import { useState, useRef, useEffect, useMemo } from 'react';
import { BMI_PROV } from '../data/bmi_prov';
import { MET_PROV } from '../data/met_prov';

const YEARS = [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024];

function rankByYear(provData) {
  // Returns { province: [rank per year] }
  const provinces = Object.keys(provData);
  const ranks = {};
  provinces.forEach(p => { ranks[p] = []; });

  YEARS.forEach((_, yi) => {
    const entries = provinces
      .map(p => ({ name: p, value: provData[p]?.[yi] }))
      .filter(e => e.value != null);
    // Higher value = worse rank (rank 17 = highest rate)
    entries.sort((a, b) => a.value - b.value); // ascending: rank 1 = lowest (best)
    entries.forEach((e, i) => {
      ranks[e.name][yi] = i + 1;
    });
    // Fill nulls
    provinces.forEach(p => {
      if (ranks[p][yi] === undefined) ranks[p][yi] = null;
    });
  });
  return ranks;
}

// Catmull-Rom spline for smooth curves
function catmullRomPath(points) {
  if (points.length < 2) return '';
  const filtered = points.filter(p => p != null);
  if (filtered.length < 2) return '';

  let d = `M ${filtered[0].x} ${filtered[0].y}`;
  if (filtered.length === 2) {
    d += ` L ${filtered[1].x} ${filtered[1].y}`;
    return d;
  }

  for (let i = 0; i < filtered.length - 1; i++) {
    const p0 = filtered[Math.max(0, i - 1)];
    const p1 = filtered[i];
    const p2 = filtered[Math.min(filtered.length - 1, i + 1)];
    const p3 = filtered[Math.min(filtered.length - 1, i + 2)];

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

export default function BumpChart({ metric, onProvinceClick }) {
  const containerRef = useRef(null);
  const [size, setSize] = useState({ w: 600, h: 400 });
  const [hovered, setHovered] = useState(null);
  const [selected, setSelected] = useState(null);

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

  const provData = metric === 'obesity' ? BMI_PROV : MET_PROV;
  const ranks = useMemo(() => rankByYear(provData), [provData]);
  const provinces = Object.keys(ranks);
  const maxRank = provinces.length;

  // Color by latest rank
  const latestRanks = provinces
    .map(p => {
      const validRanks = ranks[p].filter(r => r != null);
      return { name: p, lastRank: validRanks.length ? validRanks[validRanks.length - 1] : 99 };
    })
    .sort((a, b) => a.lastRank - b.lastRank);

  const colorMap = {};
  const neonColors = ['#00ff88', '#00e676', '#69f0ae', '#b2ff59', '#c6ff00',
    '#888888', '#999999', '#777777', '#888888', '#777777', '#999999',
    '#888888', '#777777', '#888888', '#ff5252', '#ff1744', '#ff006e'];
  latestRanks.forEach((e, i) => {
    if (i < 3) colorMap[e.name] = '#00ff88';       // top 3 green
    else if (i >= maxRank - 3) colorMap[e.name] = '#ff006e'; // bottom 3 red
    else colorMap[e.name] = '#555577';
  });

  const padL = 48, padR = 56, padT = 24, padB = 32;
  const { w, h } = size;
  const chartW = w - padL - padR;
  const chartH = h - padT - padB;

  const xScale = (yi) => padL + (yi / (YEARS.length - 1)) * chartW;
  const yScale = (rank) => rank == null ? null : padT + ((rank - 1) / (maxRank - 1)) * chartH;

  const activeProvince = hovered || selected;

  const handleClick = (prov) => {
    const next = selected === prov ? null : prov;
    setSelected(next);
    onProvinceClick?.(next);
  };

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
      <svg width={w} height={h} style={{ display: 'block' }}>
        {/* Grid lines */}
        {YEARS.map((yr, i) => (
          <line key={yr} x1={xScale(i)} y1={padT} x2={xScale(i)} y2={padT + chartH}
            stroke="rgba(255,255,255,0.04)" strokeWidth={1} />
        ))}
        {Array.from({ length: maxRank }, (_, i) => i + 1).map(r => (
          <g key={r}>
            <line x1={padL} y1={yScale(r)} x2={padL + chartW} y2={yScale(r)}
              stroke="rgba(255,255,255,0.03)" strokeWidth={0.5} />
            <text x={padL - 6} y={yScale(r) + 3} fill="#555577" fontSize="10"
              fontFamily="JetBrains Mono, monospace" textAnchor="end">{r}</text>
          </g>
        ))}

        {/* X labels */}
        {YEARS.map((yr, i) => (
          <text key={yr} x={xScale(i)} y={h - 8} fill="#888" fontSize="10"
            fontFamily="JetBrains Mono, monospace" textAnchor="middle">{yr}</text>
        ))}

        {/* Province lines — dimmed */}
        {provinces.filter(p => p !== activeProvince).map(p => {
          const points = YEARS.map((_, yi) => {
            const r = ranks[p][yi];
            return r != null ? { x: xScale(yi), y: yScale(r) } : null;
          });
          const validPoints = points.filter(pt => pt != null);
          if (validPoints.length < 2) return null;

          const color = colorMap[p];
          const dimmed = activeProvince != null;
          return (
            <g key={p} style={{ cursor: 'pointer' }}
              onMouseEnter={() => setHovered(p)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => handleClick(p)}
            >
              <path d={catmullRomPath(validPoints)} fill="none"
                stroke={color} strokeWidth={dimmed ? 1 : 1.5}
                opacity={dimmed ? 0.15 : 0.6} />
              {/* End label */}
              {validPoints.length > 0 && (
                <text
                  x={validPoints[validPoints.length - 1].x + 6}
                  y={validPoints[validPoints.length - 1].y + 3}
                  fill={color} fontSize="10" fontFamily="Noto Sans KR, sans-serif"
                  opacity={dimmed ? 0.2 : 0.7}
                >{p}</text>
              )}
            </g>
          );
        })}

        {/* Active province — highlighted */}
        {activeProvince && (() => {
          const p = activeProvince;
          const points = YEARS.map((_, yi) => {
            const r = ranks[p][yi];
            return r != null ? { x: xScale(yi), y: yScale(r) } : null;
          });
          const validPoints = points.filter(pt => pt != null);
          if (validPoints.length < 2) return null;
          const color = colorMap[p] === '#555577' ? '#ffd60a' : colorMap[p];

          return (
            <g style={{ cursor: 'pointer' }}
              onMouseEnter={() => setHovered(p)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => handleClick(p)}
            >
              {/* Glow */}
              <path d={catmullRomPath(validPoints)} fill="none"
                stroke={color} strokeWidth={4} opacity={0.2}
                filter="url(#bumpGlow)" />
              {/* Line */}
              <path d={catmullRomPath(validPoints)} fill="none"
                stroke={color} strokeWidth={2.5} opacity={1} />
              {/* Dots with rank labels */}
              {validPoints.map((pt, i) => (
                <g key={i}>
                  <circle cx={pt.x} cy={pt.y} r={5} fill={color} stroke="#0a0a0f" strokeWidth={1.5} />
                  <text x={pt.x} y={pt.y - 9} fill={color} fontSize="10"
                    fontFamily="JetBrains Mono, monospace" textAnchor="middle" fontWeight="bold">
                    {ranks[p][YEARS.indexOf(YEARS[points.indexOf(pt) !== -1 ? points.findIndex((pp, idx) => pp === pt) : i])]}
                  </text>
                </g>
              ))}
              {/* Rank values on dots */}
              {YEARS.map((yr, yi) => {
                const r = ranks[p][yi];
                if (r == null) return null;
                const pt = { x: xScale(yi), y: yScale(r) };
                return (
                  <text key={yi} x={pt.x} y={pt.y - 9} fill={color} fontSize="10"
                    fontFamily="JetBrains Mono, monospace" textAnchor="middle" fontWeight="bold">
                    {r}
                  </text>
                );
              })}
              {/* End label */}
              <text
                x={validPoints[validPoints.length - 1].x + 6}
                y={validPoints[validPoints.length - 1].y + 3}
                fill={color} fontSize="11" fontFamily="Noto Sans KR, sans-serif" fontWeight="bold"
              >{p}</text>
            </g>
          );
        })()}

        <defs>
          <filter id="bumpGlow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      </svg>
    </div>
  );
}
