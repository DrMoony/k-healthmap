import { useLang } from '../i18n';

export default function CascadeFunnel({ title, source, totalPop, totalLabel, unit, lossLabel, endLabel, stages }) {
  const { t } = useLang();
  const u = unit || t('만','0K');

  const allRows = [
    { label: totalLabel || t('전체 인구','Total Pop.'), count: totalPop, color: '#555577', note: '' },
    ...stages,
  ];
  const max = allRows[0].count;

  return (
    <div style={{ marginTop: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <span style={{ fontSize: '13px', fontWeight: 700, color: '#e8e8f0' }}>{title}</span>
        <span style={{ fontSize: '9px', color: '#9999bb' }}>{source}</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0px' }}>
        {allRows.map((row, i) => {
          const widthPct = Math.max((row.count / max) * 100, 6);
          const prev = i === 0 ? null : allRows[i - 1].count;
          const lost = prev != null ? prev - row.count : 0;
          const lostPct = prev > 0 ? Math.round((lost / prev) * 100) : 0;
          const isFirst = i === 0;
          const pctOfFirst = isFirst ? null : ((row.count / stages[0].count) * 100);

          return (
            <div key={i}>
              {/* Loss line */}
              {lost > 0 && (
                <div style={{ textAlign: 'center', height: '14px', lineHeight: '14px' }}>
                  <span style={{ fontSize: '8px', color: '#ff6b6b77' }}>
                    ▼ -{lost.toLocaleString()}{u} ({lostPct}% {i === 1 ? (lossLabel || t('비해당','unaffected')) : t('이탈','lost')})
                  </span>
                </div>
              )}

              {/* Bar row */}
              <div style={{ display: 'flex', alignItems: 'center', height: '30px' }}>
                {/* Left label */}
                <div style={{ width: '80px', textAlign: 'right', paddingRight: '10px', flexShrink: 0 }}>
                  <span style={{ fontSize: '10px', color: row.color, fontWeight: 700 }}>{row.label}</span>
                </div>

                {/* Bar container — full width, bar inside scales by width */}
                <div style={{ flex: 1, position: 'relative', height: '24px' }}>
                  <div style={{
                    width: `${widthPct}%`,
                    height: '100%',
                    background: isFirst
                      ? 'rgba(255,255,255,0.05)'
                      : `linear-gradient(90deg, ${row.color}bb, ${row.color}44)`,
                    border: isFirst
                      ? '1px solid rgba(255,255,255,0.1)'
                      : `1px solid ${row.color}44`,
                    borderRadius: '4px',
                    display: 'flex', alignItems: 'center',
                    justifyContent: widthPct > 20 ? 'center' : 'flex-start',
                    paddingLeft: widthPct <= 20 ? '6px' : '0',
                    transition: 'width 0.6s ease',
                  }}>
                    <span style={{
                      fontSize: '11px', fontWeight: 800,
                      color: isFirst ? '#aaaacc' : '#fff',
                      fontFamily: "'JetBrains Mono'",
                      textShadow: isFirst ? 'none' : '0 1px 3px rgba(0,0,0,0.6)',
                      whiteSpace: 'nowrap',
                    }}>
                      {row.count.toLocaleString()}{u}
                    </span>
                  </div>
                </div>

                {/* Right note + pct */}
                <div style={{ width: '80px', paddingLeft: '8px', flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
                  {pctOfFirst != null && (
                    <span style={{ fontSize: '9px', color: row.color, fontFamily: "'JetBrains Mono'", fontWeight: 700 }}>
                      {pctOfFirst >= 1 ? pctOfFirst.toFixed(0) : pctOfFirst.toFixed(1)}%
                    </span>
                  )}
                  {row.note && <span style={{ fontSize: '7px', color: '#9999bb', lineHeight: 1.2 }}>{row.note}</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', marginTop: '10px', fontSize: '9px' }}>
        <span style={{ color: '#ff6b6b' }}>
          {t('이탈','Lost')} {(stages[0].count - stages[stages.length - 1].count).toLocaleString()}{u}
          ({Math.round((1 - stages[stages.length - 1].count / stages[0].count) * 100)}%)
        </span>
        <span style={{ color: stages[stages.length - 1].color }}>
          {endLabel || t('도달','Reached')} {stages[stages.length - 1].count.toLocaleString()}{u}
          ({(stages[stages.length - 1].count / stages[0].count * 100) >= 1
            ? Math.round(stages[stages.length - 1].count / stages[0].count * 100)
            : (stages[stages.length - 1].count / stages[0].count * 100).toFixed(1)}%)
        </span>
      </div>
    </div>
  );
}
