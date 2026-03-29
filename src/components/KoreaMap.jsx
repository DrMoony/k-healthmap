import { useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { KOREA_PATHS } from '../data/korea_paths';
import { PROV_LABELS } from '../data/prov_labels';
import { BMI_PROV } from '../data/bmi_prov';
import { MET_PROV } from '../data/met_prov';
import { PROVINCE_INFO } from '../data/province_info';
import { FULL_DATA } from '../data/full_data';
import { LIVER_WP } from '../data/liver_whitepaper';
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
const HTN_COLORS = [
  [255, 240, 230], [255, 210, 180], [255, 170, 130],
  [230, 120, 80], [200, 70, 40], [150, 30, 10],
];
const DM_COLORS = [
  [240, 230, 255], [210, 190, 255], [180, 150, 240],
  [150, 100, 220], [120, 60, 190], [80, 20, 140],
];
const CKD_COLORS = [
  [230, 255, 250], [180, 240, 220], [130, 210, 190],
  [80, 180, 160], [40, 140, 120], [10, 100, 80],
];
const HCV_COLORS = [
  [245, 230, 255], [220, 190, 255], [195, 150, 240],
  [170, 110, 220], [140, 70, 200], [110, 30, 170],
];

// HCV province prevalence from liver whitepaper (2015 multi-center, age/sex adjusted)
const HCV_PROV = Object.fromEntries(
  Object.entries(LIVER_WP.hcv.by_region_2015).map(([k, v]) => [k, v])
);

// Compute province-level prevalence from exam category distributions
function computePrevalence(examKey, thresholdIdx) {
  const item = FULL_DATA.exam_items[examKey];
  if (!item?.province) return {};
  const result = {};
  for (const [name, data] of Object.entries(item.province)) {
    const vals = data.total;
    if (!vals) continue;
    // Sum categories from thresholdIdx onwards (abnormal range)
    result[name] = vals.slice(thresholdIdx).reduce((a, b) => a + b, 0);
  }
  return result;
}

// Cache computed prevalence maps
// Note: bp_systolic/bp_diastolic keys are swapped in full_data.js
// bp_diastolic actually contains systolic BP categories (110미만~180+)
// bp_systolic actually contains diastolic BP categories (70미만~120+)
const HTN_PROV = computePrevalence('bp_diastolic', 4);   // SBP ≥140 (indices 4-8)
const DM_PROV = computePrevalence('fasting_glucose', 3);  // FG ≥126 (indices 3-7)
const CKD_PROV_FIXED = (() => {
  const item = FULL_DATA.exam_items.gfr;
  if (!item?.province) return {};
  const r = {};
  for (const [name, data] of Object.entries(item.province)) {
    const v = data.total;
    if (!v) continue;
    r[name] = v[0] + v[1] + v[2] + v[3]; // GFR <60
  }
  return r;
})();

export default function KoreaMap({ metric = 'obesity', year = 2024, onProvinceClick }) {
  const [hovered, setHovered] = useState(null);
  const [selected, setSelected] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);
  const { t, lang } = useLang();

  const yearIndex = year - 2015;

  const METRIC_CONFIG = {
    obesity:    { colors: OBESITY_COLORS, range: [30, 44], unit: '%', label: t('비만율', 'Obesity Rate') },
    metabolic:  { colors: METABOLIC_COLORS, range: [62, 78], unit: '%', label: t('대사증후군', 'Metabolic Syndrome') },
    stroke:     { colors: STROKE_COLORS, range: [95, 140], unit: '', label: t('뇌졸중 발생률', 'Stroke Incidence') },
    htn:        { colors: HTN_COLORS, range: [5, 15], unit: '%', label: t('고혈압 의심', 'Hypertension (SBP≥140)') },
    dm:         { colors: DM_COLORS, range: [4, 10], unit: '%', label: t('당뇨 의심', 'Diabetes (FG≥126)') },
    ckd:        { colors: CKD_COLORS, range: [1, 6], unit: '%', label: t('CKD 의심', 'CKD (GFR<60)') },
    hcv:        { colors: HCV_COLORS, range: [0.2, 1.6], unit: '%', label: t('HCV 양성률', 'HCV Prevalence') },
  };
  const cfg = METRIC_CONFIG[metric] || METRIC_CONFIG.obesity;

  const provinces = useMemo(() => {
    return Object.entries(KOREA_PATHS).map(([name, path]) => {
      let val;
      if (metric === 'stroke') {
        val = PROVINCE_INFO[name]?.strokeIncidence ?? null;
      } else if (metric === 'htn') {
        val = HTN_PROV[name] ?? null;
      } else if (metric === 'dm') {
        val = DM_PROV[name] ?? null;
      } else if (metric === 'ckd') {
        val = CKD_PROV_FIXED[name] ?? null;
      } else if (metric === 'hcv') {
        val = HCV_PROV[name] ?? null;
      } else {
        const data = metric === 'obesity' ? BMI_PROV : MET_PROV;
        const values = data[name];
        val = values ? values[yearIndex] : null;
      }
      const color = val != null ? interpolateColor(val, cfg.range[0], cfg.range[1], cfg.colors) : '#2a2a3a';
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
        <text x="385" y="134" textAnchor="middle" fontSize={9} fill="#ccccee" fontFamily="'Noto Sans KR'" fontWeight={500}>{t('울릉도', 'Ulleungdo')}</text>

        {/* Dokdo */}
        <circle cx="408" cy="115" r="2.5" fill="#2a2a3a" stroke="rgba(255,255,255,0.4)" strokeWidth={0.8} />
        <text x="408" y="106" textAnchor="middle" fontSize={9} fill="#ccccee" fontFamily="'Noto Sans KR'" fontWeight={500}>{t('독도', 'Dokdo')}</text>

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
                  x={x - (lang === 'en' ? 50 : 36)}
                  y={y - 13}
                  width={lang === 'en' ? 100 : 72}
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
                    x={x + (lang === 'en' ? 38 : 28)}
                    y={y - 10}
                    fontSize={12}
                    style={{ animation: 'sirenBlink 1s ease-in-out infinite' }}
                  >🚨</text>
                )}
                <text
                  x={x}
                  y={y + 5}
                  textAnchor="middle"
                  fontSize={11}
                  fontWeight={isActive ? 800 : 600}
                  fill={isActive ? '#000' : isWorst ? '#ff6666' : isBest ? '#66ffaa' : '#e8e8f0'}
                  fontFamily={lang === 'en' ? "'JetBrains Mono', monospace" : "'Noto Sans KR', sans-serif"}
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
            {cfg.colors.map((c, i) => (
              <stop key={i} offset={`${(i / (cfg.colors.length - 1)) * 100}%`} stopColor={`rgb(${c.join(',')})`} />
            ))}
          </linearGradient>
        </defs>
        <g transform="translate(82, 160)">
          <rect x="0" y="0" width="8" height="160" rx="4" fill="url(#legendGrad)" />
          <text x="12" y="8" fontSize="9" fill="#bbbbdd" fontFamily="'JetBrains Mono'" dominantBaseline="middle">
            {cfg.range[1]}{cfg.unit}
          </text>
          <text x="12" y="160" fontSize="9" fill="#bbbbdd" fontFamily="'JetBrains Mono'" dominantBaseline="middle">
            {cfg.range[0]}{cfg.unit}
          </text>
          <text x="4" y="-10" fontSize="9" fill="#9999bb" fontFamily="'Noto Sans KR'" textAnchor="start">
            {cfg.label}
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
              {provinces.find(p => p.name === hovered)?.value?.toFixed(1) ?? 'N/A'}{cfg.unit}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
