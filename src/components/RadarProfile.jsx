import { useState, useRef, useEffect, useMemo } from 'react';
import { PROVINCE_INFO, NATIONAL_AVG } from '../data/province_info';
import { BMI_PROV } from '../data/bmi_prov';
import { MET_PROV } from '../data/met_prov';

const AXES = [
  { key: 'obesity', label: '비만율', getter: (prov) => BMI_PROV[prov]?.[9] ?? 0, natAvg: () => {
    const vals = Object.values(BMI_PROV).map(v => v[9]);
    return vals.reduce((a, b) => a + b, 0) / vals.length;
  }, range: [25, 50], higherIsBad: true },
  { key: 'metabolic', label: '대사증후군', getter: (prov) => {
    const vals = MET_PROV[prov]?.filter(v => v != null);
    return vals?.length ? vals[vals.length - 1] : 0;
  }, natAvg: () => {
    const all = Object.values(MET_PROV).flatMap(v => v.filter(x => x != null));
    return all.reduce((a, b) => a + b, 0) / all.length;
  }, range: [60, 80], higherIsBad: true },
  { key: 'smokingRate', label: '흡연율', getter: (prov) => PROVINCE_INFO[prov]?.smokingRate ?? 0,
    natAvg: () => NATIONAL_AVG.smokingRate, range: [10, 25], higherIsBad: true },
  { key: 'drinkingRate', label: '음주율', getter: (prov) => PROVINCE_INFO[prov]?.drinkingRate ?? 0,
    natAvg: () => NATIONAL_AVG.drinkingRate, range: [15, 30], higherIsBad: true },
  { key: 'noExerciseRate', label: '운동부족', getter: (prov) => PROVINCE_INFO[prov]?.noExerciseRate ?? 0,
    natAvg: () => NATIONAL_AVG.noExerciseRate, range: [40, 65], higherIsBad: true },
  { key: 'unmetMedical', label: '미충족의료', getter: (prov) => PROVINCE_INFO[prov]?.unmetMedical ?? 0,
    natAvg: () => NATIONAL_AVG.unmetMedical, range: [4, 12], higherIsBad: true },
  { key: 'agingRate', label: '고령화율', getter: (prov) => PROVINCE_INFO[prov]?.agingRate ?? 0,
    natAvg: () => NATIONAL_AVG.agingRate, range: [10, 30], higherIsBad: true },
  { key: 'doctorsPerThousand', label: '의사밀도', getter: (prov) => PROVINCE_INFO[prov]?.doctorsPerThousand ?? 0,
    natAvg: () => NATIONAL_AVG.doctorsPerThousand, range: [1, 4], higherIsBad: false },
];

function normalize(value, axis) {
  const [min, max] = axis.range;
  let t = (value - min) / (max - min);
  t = Math.max(0, Math.min(1, t));
  // Invert for "low is bad" metrics (doctorsPerThousand)
  if (!axis.higherIsBad) t = 1 - t;
  return t;
}

function polarToXY(cx, cy, radius, angleDeg) {
  const rad = (angleDeg - 90) * Math.PI / 180;
  return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
}

export default function RadarProfile({ provinceName, onAxisClick }) {
  const containerRef = useRef(null);
  const [size, setSize] = useState({ w: 300, h: 300 });
  const [hoveredAxis, setHoveredAxis] = useState(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      if (width > 0 && height > 0) setSize({ w: width, h: height });
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const { w, h } = size;
  const cx = w / 2;
  const cy = h / 2;
  const maxRadius = Math.min(w, h) / 2 - 46;
  const n = AXES.length;
  const angleStep = 360 / n;

  // Province values (normalized 0-1, 1=worst)
  const provValues = useMemo(() => {
    if (!provinceName) return AXES.map(() => 0);
    return AXES.map(ax => normalize(ax.getter(provinceName), ax));
  }, [provinceName]);

  // National average (normalized)
  const natValues = useMemo(() => {
    return AXES.map(ax => normalize(ax.natAvg(), ax));
  }, []);

  // Province polygon points
  const provPoints = provValues.map((v, i) => {
    const angle = i * angleStep;
    return polarToXY(cx, cy, v * maxRadius, angle);
  });

  // National avg polygon points
  const natPoints = natValues.map((v, i) => {
    const angle = i * angleStep;
    return polarToXY(cx, cy, v * maxRadius, angle);
  });

  // Grid rings
  const rings = [0.25, 0.5, 0.75, 1.0];

  // Determine province color based on overall profile
  const avgNorm = provValues.reduce((a, b) => a + b, 0) / provValues.length;
  const provColor = avgNorm > 0.6 ? '#ff006e' : avgNorm > 0.4 ? '#ffd60a' : '#00ff88';

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', minHeight: '200px' }}>
      {!provinceName ? (
        <div style={{
          height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#9999bb', fontSize: '11px',
        }}>
          지역을 선택하면 건강 프로필이 표시됩니다
        </div>
      ) : (
        <svg width={w} height={h} style={{ display: 'block' }}>
          {/* Grid rings */}
          {rings.map(r => {
            const pts = Array.from({ length: n }, (_, i) =>
              polarToXY(cx, cy, r * maxRadius, i * angleStep)
            );
            return (
              <polygon key={r}
                points={pts.map(p => `${p.x},${p.y}`).join(' ')}
                fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={0.5}
              />
            );
          })}

          {/* Axis lines */}
          {AXES.map((ax, i) => {
            const end = polarToXY(cx, cy, maxRadius, i * angleStep);
            return (
              <line key={ax.key} x1={cx} y1={cy} x2={end.x} y2={end.y}
                stroke="rgba(255,255,255,0.08)" strokeWidth={0.5} />
            );
          })}

          {/* National average polygon */}
          <polygon
            points={natPoints.map(p => `${p.x},${p.y}`).join(' ')}
            fill="none" stroke="#bbbbdd" strokeWidth={1.5}
            strokeDasharray="4,3" opacity={0.5}
          />

          {/* Province polygon */}
          <polygon
            points={provPoints.map(p => `${p.x},${p.y}`).join(' ')}
            fill={provColor} fillOpacity={0.15}
            stroke={provColor} strokeWidth={2} opacity={0.9}
          />

          {/* Data points on province polygon */}
          {provPoints.map((pt, i) => (
            <circle key={i} cx={pt.x} cy={pt.y} r={4}
              fill={provColor} stroke="#0a0a0f" strokeWidth={1.5}
              style={{ cursor: 'pointer' }}
              onMouseEnter={() => setHoveredAxis(i)}
              onMouseLeave={() => setHoveredAxis(null)}
              onClick={() => onAxisClick?.(AXES[i].key)}
            />
          ))}

          {/* Axis labels */}
          {AXES.map((ax, i) => {
            const labelR = maxRadius + 26;
            const pos = polarToXY(cx, cy, labelR, i * angleStep);
            const isHovered = hoveredAxis === i;
            const rawValue = ax.getter(provinceName);
            const unit = ax.key === 'doctorsPerThousand' ? '/천명' : '%';
            return (
              <g key={ax.key} style={{ cursor: 'pointer' }}
                onClick={() => onAxisClick?.(ax.key)}
                onMouseEnter={() => setHoveredAxis(i)}
                onMouseLeave={() => setHoveredAxis(null)}
              >
                <text
                  x={pos.x} y={pos.y}
                  fill={isHovered ? '#ffd60a' : '#ccccee'}
                  fontSize="10"
                  fontFamily="Noto Sans KR, sans-serif"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontWeight={isHovered ? 'bold' : 'normal'}
                >
                  {ax.label}
                </text>
                {isHovered && (
                  <text
                    x={pos.x} y={pos.y + 13}
                    fill="#ffd60a"
                    fontSize="9"
                    fontFamily="JetBrains Mono, monospace"
                    textAnchor="middle"
                  >
                    {typeof rawValue === 'number' ? rawValue.toFixed(1) : rawValue}{unit}
                  </text>
                )}
              </g>
            );
          })}

          {/* Center label */}
          <text x={cx} y={cy - 6} fill="#e8e8f0" fontSize="12" fontWeight="bold"
            fontFamily="Noto Sans KR, sans-serif" textAnchor="middle">
            {provinceName}
          </text>
          <text x={cx} y={cy + 10} fill="#9999bb" fontSize="9"
            fontFamily="Noto Sans KR, sans-serif" textAnchor="middle">
            외곽 = 나쁨 | --- 전국평균
          </text>
        </svg>
      )}
    </div>
  );
}
