import { useLang } from '../i18n';

export default function CascadeFunnel({ title, source, totalPop, totalLabel, unit, lossLabel, endLabel, stages }) {
  const { t } = useLang();
  const u = unit || t('만','0K');

  // All rows including total
  const allRows = [
    { label: totalLabel || t('전체 인구','Total Pop.'), count: totalPop, color: '#444466', note: '' },
    ...stages,
  ];

  // SVG nested squares — area proportional to count
  const svgSize = 280;
  const maxArea = svgSize * svgSize;

  return (
    <div style={{ marginTop: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <span style={{ fontSize: '13px', fontWeight: 700, color: '#e8e8f0' }}>{title}</span>
        <span style={{ fontSize: '9px', color: '#9999bb' }}>{source}</span>
      </div>

      <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
        {/* Left: nested area squares */}
        <div style={{ flexShrink: 0 }}>
          <svg width={svgSize} height={svgSize} viewBox={`0 0 ${svgSize} ${svgSize}`}>
            {allRows.map((row, i) => {
              const ratio = row.count / allRows[0].count;
              const side = Math.sqrt(ratio) * svgSize;
              const x = (svgSize - side) / 2;
              const y = (svgSize - side) / 2;
              const isFirst = i === 0;
              return (
                <g key={i}>
                  <rect
                    x={x} y={y} width={side} height={side}
                    rx={isFirst ? 8 : Math.max(2, 6 - i)}
                    fill={isFirst ? 'rgba(255,255,255,0.04)' : `${row.color}22`}
                    stroke={row.color}
                    strokeWidth={isFirst ? 1 : 1.5}
                    strokeOpacity={isFirst ? 0.2 : 0.6}
                  />
                  {/* Label inside if big enough */}
                  {side > 40 && (
                    <text
                      x={svgSize / 2} y={y + (i === 0 ? 14 : Math.min(side / 2 + 4, y + side - 4))}
                      textAnchor="middle"
                      fill={row.color}
                      fontSize={side > 80 ? 11 : side > 50 ? 9 : 7}
                      fontFamily="'JetBrains Mono'"
                      fontWeight={700}
                      opacity={0.9}
                    >
                      {row.count.toLocaleString()}{u}
                    </text>
                  )}
                </g>
              );
            })}
            {/* Labels for tiny squares — outside */}
            {allRows.filter((row, i) => {
              const ratio = row.count / allRows[0].count;
              return Math.sqrt(ratio) * svgSize <= 40 && i > 0;
            }).map((row, idx) => {
              const ratio = row.count / allRows[0].count;
              const side = Math.sqrt(ratio) * svgSize;
              const cx = svgSize / 2;
              const cy = svgSize / 2;
              return (
                <g key={`lbl-${idx}`}>
                  <line x1={cx + side / 2} y1={cy} x2={svgSize - 8} y2={30 + idx * 20}
                    stroke={row.color} strokeWidth={0.5} strokeOpacity={0.4} strokeDasharray="2 2" />
                  <text x={svgSize - 6} y={33 + idx * 20} textAnchor="end"
                    fill={row.color} fontSize={8} fontFamily="'JetBrains Mono'" fontWeight={700}>
                    {row.count}{u}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Right: legend with bars */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '3px', justifyContent: 'center' }}>
          {allRows.map((row, i) => {
            const pctOfTotal = ((row.count / allRows[0].count) * 100).toFixed(1);
            const prev = i === 0 ? null : allRows[i - 1].count;
            const lost = prev != null ? prev - row.count : 0;
            const lostPct = prev > 0 ? Math.round((lost / prev) * 100) : 0;
            const isFirst = i === 0;

            return (
              <div key={i}>
                {lost > 0 && (
                  <div style={{ fontSize: '7px', color: '#ff6b6b77', paddingLeft: '4px', height: '12px', lineHeight: '12px' }}>
                    ▼ -{lost.toLocaleString()}{u} ({lostPct}% {i === 1 ? (lossLabel || t('비유병','unaffected')) : t('이탈','lost')})
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{
                    width: '10px', height: '10px', borderRadius: '2px', flexShrink: 0,
                    background: isFirst ? 'rgba(255,255,255,0.06)' : `${row.color}88`,
                    border: `1px solid ${row.color}66`,
                  }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <span style={{ fontSize: '10px', color: row.color, fontWeight: 700 }}>{row.label}</span>
                      <span style={{ fontSize: '10px', color: isFirst ? '#9999bb' : '#fff', fontFamily: "'JetBrains Mono'", fontWeight: 700 }}>
                        {row.count.toLocaleString()}{u}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '8px', color: '#9999bb' }}>{row.note}</span>
                      {!isFirst && <span style={{ fontSize: '8px', color: '#9999bb' }}>{pctOfTotal}%</span>}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Summary */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '6px', fontSize: '9px', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '6px' }}>
            <span style={{ color: '#ff6b6b' }}>
              {t('이탈','Lost')} {(stages[0].count - stages[stages.length - 1].count).toLocaleString()}{u}
              ({Math.round((1 - stages[stages.length - 1].count / stages[0].count) * 100)}%)
            </span>
            <span style={{ color: stages[stages.length - 1].color }}>
              {endLabel || t('도달','Reached')} {stages[stages.length - 1].count.toLocaleString()}{u}
              ({Math.round(stages[stages.length - 1].count / stages[0].count * 100)}%)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
