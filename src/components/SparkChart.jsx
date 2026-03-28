import { useState } from 'react';

export default function SparkChart({ data, labels, color, height = 100, showLabels = false, avgLine, rankText }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  if (!data || data.length === 0) return null;

  const padding = { top: 24, bottom: showLabels ? 24 : 10, left: 10, right: 10 };
  const width = 380;
  const chartH = height - padding.top - padding.bottom;
  const chartW = width - padding.left - padding.right;

  const allValues = avgLine != null ? [...data, avgLine] : data;
  const min = Math.min(...allValues) - 1;
  const max = Math.max(...allValues) + 1;

  const points = data.map((v, i) => ({
    x: padding.left + (i / (data.length - 1)) * chartW,
    y: padding.top + chartH - ((v - min) / (max - min)) * chartH,
    value: v,
    label: labels?.[i],
  }));

  const avgY = avgLine != null
    ? padding.top + chartH - ((avgLine - min) / (max - min)) * chartH
    : null;

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const areaPath = `${linePath} L${points[points.length - 1].x},${height - padding.bottom} L${points[0].x},${height - padding.bottom} Z`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      style={{ width: '100%', height: `${height}px`, overflow: 'visible' }}
      onMouseLeave={() => setHoveredIdx(null)}
    >
      {/* Grid lines */}
      {[0.25, 0.5, 0.75].map(t => {
        const y = padding.top + chartH * (1 - t);
        return (
          <line key={t} x1={padding.left} y1={y} x2={width - padding.right} y2={y}
            stroke="rgba(255,255,255,0.04)" strokeDasharray="4,4" />
        );
      })}

      {/* Area */}
      <path d={areaPath} fill={`${color}15`} />

      {/* Line */}
      <path d={linePath} fill="none" stroke={color} strokeWidth={2.5}
        strokeLinecap="round" strokeLinejoin="round" />

      {/* National average line — rendered AFTER chart so it's on top */}
      {avgY != null && (
        <>
          <line
            x1={padding.left} y1={avgY} x2={width - padding.right} y2={avgY}
            stroke="#ffffff88" strokeWidth={1.2} strokeDasharray="6,4"
          />
          <rect
            x={width - padding.right - 68} y={avgY - 12}
            width={68} height={14} rx={3}
            fill="rgba(10,10,20,0.85)"
          />
          <text
            x={width - padding.right - 4} y={avgY - 2}
            textAnchor="end" fontSize={10} fill="#fff" fontWeight={600} fontFamily="'JetBrains Mono'"
          >
            전국 {avgLine.toFixed(1)}%
          </text>
        </>
      )}

      {/* Rank text top-right */}
      {rankText && (
        <text
          x={width - padding.right} y={12}
          textAnchor="end" fontSize={10} fill="#ccccdd" fontWeight={600} fontFamily="'JetBrains Mono'"
        >
          {rankText}
        </text>
      )}

      {/* Data points */}
      {points.map((p, i) => {
        const tooltipY = Math.max(18, p.y - 28);
        return (
          <g key={i}>
            <rect
              x={p.x - chartW / data.length / 2}
              y={0}
              width={chartW / data.length}
              height={height}
              fill="transparent"
              onMouseEnter={() => setHoveredIdx(i)}
            />
            <circle
              cx={p.x} cy={p.y}
              r={hoveredIdx === i ? 5 : (i === data.length - 1 ? 4 : 0)}
              fill={color}
              style={{
                filter: hoveredIdx === i ? `drop-shadow(0 0 6px ${color})` : 'none',
                transition: 'r 0.15s',
              }}
            />
            {hoveredIdx === i && (
              <>
                <line x1={p.x} y1={padding.top} x2={p.x} y2={height - padding.bottom}
                  stroke={`${color}44`} strokeWidth={1} strokeDasharray="3,3" />
                <rect
                  x={p.x - 28} y={tooltipY}
                  width={56} height={20}
                  rx={6}
                  fill="rgba(10,10,15,0.9)"
                  stroke={color}
                  strokeWidth={1}
                />
                <text
                  x={p.x} y={tooltipY + 14}
                  textAnchor="middle"
                  fontSize={11}
                  fontWeight={700}
                  fontFamily="'JetBrains Mono'"
                  fill={color}
                >
                  {p.value.toFixed(1)}%
                </text>
              </>
            )}
          </g>
        );
      })}

      {/* X-axis labels */}
      {showLabels && labels && points.map((p, i) => {
        if (i !== 0 && i !== data.length - 1 && i % 3 !== 0) return null;
        return (
          <text
            key={`label-${i}`}
            x={p.x} y={height - 4}
            textAnchor="middle"
            fontSize={10}
            fontFamily="'JetBrains Mono'"
            fill={hoveredIdx === i ? color : '#ccccee'}
            fontWeight={i === data.length - 1 ? 700 : 400}
          >
            {labels[i]}
          </text>
        );
      })}
    </svg>
  );
}
