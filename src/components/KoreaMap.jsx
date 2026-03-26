import { useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { KOREA_PATHS } from '../data/korea_paths';
import { PROV_LABELS } from '../data/prov_labels';
import { BMI_PROV } from '../data/bmi_prov';
import { MET_PROV } from '../data/met_prov';
import { PROVINCE_INFO } from '../data/province_info';
import { useLang } from '../i18n';
import { T } from '../translations';

function interpolateColor(value, min, max, colors) {
  const t = Math.max(0, Math.min(1, (value - min) / (max - min)));
  const idx = t * (colors.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.min(lo + 1, colors.length - 1);
  const f = idx - lo;
  const r = Math.round(colors[lo][0] + f * (colors[hi][0] - colors[lo][0]));
  const g = Math.round(colors[lo][1] + f * (colors[hi][1] - colors[lo][1]));
  const b = Math.round(colors[lo][2] + f * (colors[hi][2] - colors[lo][2]));
  return `rgb(${r},${g},${b})`;
}

// Single-hue: lighter = healthier, darker = worse
const OBESITY_COLORS = [
  [255, 235, 235], [255, 180, 180], [240, 120, 120],
  [210, 60, 60], [170, 20, 20], [120, 0, 0],
];
const METABOLIC_COLORS = [
  [220, 240, 255], [160, 210, 255], [100, 170, 240],
  [50, 120, 200], [20, 70, 160], [5, 30, 100],
];
const STROKE_COLORS = [
  [255, 235, 230], [255, 200, 180], [240, 150, 120],
  [220, 100, 70], [190, 50, 30], [140, 15, 5],
];

export default function KoreaMap({ metric = 'obesity', year = 2024, onProvinceClick }) {
  const [hovered, setHovered] = useState(null);
  const [selected, setSelected] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);
  const { t, lang } = useLang();

  const yearIndex = year - 2015;
  const colors = metric === 'stroke' ? STROKE_COLORS : metric === 'obesity' ? OBESITY_COLORS : METABOLIC_COLORS;
  const range = metric === 'stroke' ? [95, 140] : metric === 'obesity' ? [30, 44] : [62, 78];

  const provinces = useMemo(() => {
    return Object.entries(KOREA_PATHS).map(([name, path]) => {
      let val;
      if (metric === 'stroke') {
        val = PROVINCE_INFO[name]?.strokeIncidence ?? null;
      } else {
        const data = metric === 'obesity' ? BMI_PROV : MET_PROV;
        const values = data[name];
        val = values ? values[yearIndex] : null;
      }
      const color = val != null ? interpolateColor(val, range[0], range[1], colors) : '#2a2a3a';
      return { name, path, value: val, color };
    });
  }, [metric, yearIndex]);

  const handleClick = (name) => {
    const next = selected === name ? null : name;
    setSelected(next);
    onProvinceClick?.(next);
  };

  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      style={{ position: 'relative', width: '100%', maxWidth: '380px' }}
    >
      <svg
        viewBox="70 30 380 490"
        style={{ width: '100%', height: 'auto' }}
      >
        {/* Province paths */}
        {provinces.map(({ name, path, color }) => {
          const isActive = hovered === name || selected === name;
          return (
            <motion.path
              key={name}
              d={path}
              fill={color}
              stroke={isActive ? '#fff' : 'rgba(255,255,255,0.15)'}
              strokeWidth={isActive ? 1.5 : 0.5}
              transform={name === '제주' ? 'translate(180,-50)' : undefined}
              style={{ cursor: 'pointer', transition: 'fill 0.3s, stroke 0.2s' }}
              onMouseEnter={() => setHovered(name)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => handleClick(name)}
            />
          );
        })}

        {/* Ulleungdo */}
        <circle cx="385" cy="120" r="5" fill="#2a2a3a" stroke="rgba(255,255,255,0.4)" strokeWidth={0.8} />
        <text x="385" y="134" textAnchor="middle" fontSize={9} fill="#aaa" fontFamily="'Noto Sans KR'" fontWeight={500}>{t('울릉도', 'Ulleungdo')}</text>

        {/* Dokdo */}
        <circle cx="408" cy="115" r="2.5" fill="#2a2a3a" stroke="rgba(255,255,255,0.4)" strokeWidth={0.8} />
        <text x="408" y="106" textAnchor="middle" fontSize={9} fill="#aaa" fontFamily="'Noto Sans KR'" fontWeight={500}>{t('독도', 'Dokdo')}</text>

        {/* Siren animation */}
        <style>{`
          @keyframes sirenBlink {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.2; }
          }
        `}</style>

        {/* Labels — clickable, ranked */}
        {(() => {
          // Rank provinces by value (higher = worse for obesity/metabolic)
          const ranked = provinces
            .filter(p => p.value != null)
            .sort((a, b) => b.value - a.value);
          const worst3 = new Set(ranked.slice(0, 3).map(p => p.name));
          const best3 = new Set(ranked.slice(-3).map(p => p.name));

          return Object.entries(PROV_LABELS).map(([name, [x, y]]) => {
            const prov = provinces.find(p => p.name === name);
            if (!prov) return null;
            const isActive = hovered === name || selected === name;
            const hasValue = prov.value != null;
            const isWorst = worst3.has(name);
            const isBest = best3.has(name);

            let borderColor = 'rgba(255,255,255,0.2)';
            let borderWidth = 0.6;
            if (isActive) { borderColor = '#00d4ff'; borderWidth = 1.5; }
            else if (isWorst) { borderColor = '#ff4444'; borderWidth = 1.5; }
            else if (isBest) { borderColor = '#00ff88'; borderWidth = 1.5; }

            return (
              <g
                key={`label-${name}`}
                style={{ cursor: 'pointer' }}
                onClick={() => handleClick(name)}
                onMouseEnter={() => setHovered(name)}
                onMouseLeave={() => setHovered(null)}
              >
                <rect
                  x={x - 36}
                  y={y - 13}
                  width={72}
                  height={26}
                  rx={6}
                  fill={isActive ? 'rgba(0,212,255,0.95)' : 'rgba(10,10,15,0.85)'}
                  stroke={borderColor}
                  strokeWidth={borderWidth}
                  style={{ transition: 'all 0.15s' }}
                />
                {/* Siren icon for worst 3 — top-right corner */}
                {isWorst && !isActive && (
                  <text
                    x={x + 28}
                    y={y - 8}
                    fontSize={8}
                    style={{ animation: 'sirenBlink 1s ease-in-out infinite' }}
                  >🚨</text>
                )}
                <text
                  x={x}
                  y={y + 5}
                  textAnchor="middle"
                  fontSize={12}
                  fontWeight={isActive ? 800 : 600}
                  fill={isActive ? '#000' : isWorst ? '#ff6666' : isBest ? '#66ffaa' : '#e8e8f0'}
                  fontFamily="'Noto Sans KR', sans-serif"
                >
                  {lang === 'en' ? (T.provinces[name] || name) : name} {hasValue ? `${prov.value.toFixed(1)}` : ''}
                </text>
              </g>
            );
          });
        })()}

        {/* Vertical color legend — left side */}
        <defs>
          <linearGradient id="legendGrad" x1="0" y1="1" x2="0" y2="0">
            {colors.map((c, i) => (
              <stop key={i} offset={`${(i / (colors.length - 1)) * 100}%`} stopColor={`rgb(${c.join(',')})`} />
            ))}
          </linearGradient>
        </defs>
        <g transform="translate(82, 160)">
          <rect x="0" y="0" width="8" height="160" rx="4" fill="url(#legendGrad)" />
          <text x="12" y="8" fontSize="9" fill="#8888aa" fontFamily="'JetBrains Mono'" dominantBaseline="middle">
            {range[1]}{metric === 'stroke' ? '' : '%'}
          </text>
          <text x="12" y="160" fontSize="9" fill="#8888aa" fontFamily="'JetBrains Mono'" dominantBaseline="middle">
            {range[0]}{metric === 'stroke' ? '' : '%'}
          </text>
          <text x="4" y="-10" fontSize="9" fill="#555570" fontFamily="'Noto Sans KR'" textAnchor="start">
            {metric === 'obesity' ? t('비만율', 'Obesity Rate') : metric === 'stroke' ? t('뇌졸중 발생률', 'Stroke Incidence') : t('대사증후군', 'Metabolic Syndrome')}
          </text>
        </g>
      </svg>

      {/* Floating tooltip — follows mouse */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.12 }}
            style={{
              position: 'absolute',
              left: mousePos.x + 12,
              top: mousePos.y - 28,
              background: 'rgba(10,10,15,0.92)',
              border: '1px solid rgba(0,212,255,0.3)',
              borderRadius: '6px',
              padding: '4px 10px',
              backdropFilter: 'blur(6px)',
              pointerEvents: 'none',
              zIndex: 10,
              whiteSpace: 'nowrap',
            }}
          >
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#00d4ff' }}>{lang === 'en' ? (T.provinces[hovered] || hovered) : hovered}</span>
            <span style={{ fontSize: '14px', fontWeight: 900, fontFamily: "'JetBrains Mono'", color: '#e8e8f0', marginLeft: '6px' }}>
              {provinces.find(p => p.name === hovered)?.value?.toFixed(1) ?? 'N/A'}{metric === 'stroke' ? '' : '%'}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
