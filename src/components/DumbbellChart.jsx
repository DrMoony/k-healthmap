import { useState, useRef, useEffect } from 'react';

export default function DumbbellChart({ data, label, onItemClick }) {
  const containerRef = useRef(null);
  const [size, setSize] = useState({ w: 500, h: 300 });
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

  if (!data || data.length === 0) {
    return (
      <div ref={containerRef} style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555577', fontSize: '11px' }}>
        데이터 없음
      </div>
    );
  }

  // Sort by gap size (largest first)
  const sorted = [...data]
    .map(d => ({ ...d, gap: Math.abs(d.male - d.female) }))
    .sort((a, b) => b.gap - a.gap);

  const allVals = sorted.flatMap(d => [d.male, d.female]).filter(v => v != null);
  const minVal = Math.min(...allVals) * 0.9;
  const maxVal = Math.max(...allVals) * 1.05;
  const avg = allVals.reduce((a, b) => a + b, 0) / allVals.length;

  const { w, h } = size;
  const padL = 52;
  const padR = 20;
  const padT = 28;
  const padB = 12;
  const chartW = w - padL - padR;
  const rowH = Math.min(22, (h - padT - padB) / sorted.length);
  const chartH = rowH * sorted.length;

  const xScale = (v) => padL + ((v - minVal) / (maxVal - minVal)) * chartW;

  const handleClick = (name) => {
    const next = selected === name ? null : name;
    setSelected(next);
    onItemClick?.(next);
  };

  // Value-based brightness for dots
  const gapMax = Math.max(...sorted.map(d => d.gap), 1);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
      <svg width={w} height={Math.max(h, chartH + padT + padB)} style={{ display: 'block' }}>
        {/* Header legend */}
        <text x={padL} y={14} fill="#888" fontSize="10" fontFamily="Noto Sans KR, sans-serif">
          {label || '성별 비교'}
        </text>
        <circle cx={w - 120} cy={10} r={4} fill="#00d4ff" />
        <text x={w - 112} y={14} fill="#00d4ff" fontSize="9" fontFamily="Noto Sans KR, sans-serif">남성</text>
        <circle cx={w - 72} cy={10} r={4} fill="#ff006e" />
        <text x={w - 64} y={14} fill="#ff006e" fontSize="9" fontFamily="Noto Sans KR, sans-serif">여성</text>

        {/* National average line */}
        <line
          x1={xScale(avg)} y1={padT - 4}
          x2={xScale(avg)} y2={padT + chartH}
          stroke="#ffd60a" strokeWidth={1} strokeDasharray="4,3" opacity={0.5}
        />
        <text x={xScale(avg)} y={padT - 7} fill="#ffd60a" fontSize="8"
          fontFamily="JetBrains Mono, monospace" textAnchor="middle" opacity={0.7}>
          평균 {avg.toFixed(1)}%
        </text>

        {/* Rows */}
        {sorted.map((d, i) => {
          const y = padT + i * rowH + rowH / 2;
          const x1 = xScale(Math.min(d.male, d.female));
          const x2 = xScale(Math.max(d.male, d.female));
          const isHovered = hovered === d.name;
          const isSelected = selected === d.name;
          const isActive = isHovered || isSelected;
          const dimmed = (hovered || selected) && !isActive;
          const gapBrightness = 0.3 + (d.gap / gapMax) * 0.7;

          return (
            <g key={d.name}
              style={{ cursor: 'pointer' }}
              opacity={dimmed ? 0.25 : 1}
              onMouseEnter={() => setHovered(d.name)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => handleClick(d.name)}
            >
              {/* Row background on hover */}
              {isActive && (
                <rect x={0} y={y - rowH / 2} width={w} height={rowH}
                  fill="rgba(255,255,255,0.03)" rx={3} />
              )}

              {/* Province label */}
              <text x={padL - 6} y={y + 3}
                fill={isActive ? '#ffd60a' : '#aaaacc'}
                fontSize="10" fontFamily="Noto Sans KR, sans-serif"
                textAnchor="end" fontWeight={isActive ? 'bold' : 'normal'}>
                {d.name}
              </text>

              {/* Connecting line */}
              <line x1={x1} y1={y} x2={x2} y2={y}
                stroke={isActive ? '#ffd60a' : `rgba(255,255,255,${gapBrightness * 0.4})`}
                strokeWidth={isActive ? 2.5 : 2}
              />

              {/* Male dot */}
              <circle cx={xScale(d.male)} cy={y} r={isActive ? 6 : 4.5}
                fill="#00d4ff"
                stroke={isActive ? '#fff' : 'none'} strokeWidth={1}
                opacity={0.4 + (d.male / maxVal) * 0.6}
              />

              {/* Female dot */}
              <circle cx={xScale(d.female)} cy={y} r={isActive ? 6 : 4.5}
                fill="#ff006e"
                stroke={isActive ? '#fff' : 'none'} strokeWidth={1}
                opacity={0.4 + (d.female / maxVal) * 0.6}
              />

              {/* Values on hover */}
              {isActive && (
                <>
                  <text x={xScale(d.male)} y={y - 10} fill="#00d4ff" fontSize="9"
                    fontFamily="JetBrains Mono, monospace" textAnchor="middle" fontWeight="bold">
                    {d.male}%
                  </text>
                  <text x={xScale(d.female)} y={y - 10} fill="#ff006e" fontSize="9"
                    fontFamily="JetBrains Mono, monospace" textAnchor="middle" fontWeight="bold">
                    {d.female}%
                  </text>
                  <text x={(xScale(d.male) + xScale(d.female)) / 2} y={y + 13}
                    fill="#ffd60a" fontSize="8"
                    fontFamily="JetBrains Mono, monospace" textAnchor="middle" opacity={0.8}>
                    gap {d.gap.toFixed(1)}
                  </text>
                </>
              )}
            </g>
          );
        })}

        {/* X axis ticks at bottom */}
        {(() => {
          const ticks = [];
          const step = Math.ceil((maxVal - minVal) / 6);
          for (let v = Math.ceil(minVal); v <= maxVal; v += step) ticks.push(v);
          return ticks.map(v => (
            <text key={v} x={xScale(v)} y={padT + chartH + 12} fill="#555577" fontSize="8"
              fontFamily="JetBrains Mono, monospace" textAnchor="middle">{v}%</text>
          ));
        })()}
      </svg>
    </div>
  );
}
