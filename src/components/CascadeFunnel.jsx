import { useLang } from '../i18n';

export default function CascadeFunnel({ title, source, totalPop, totalLabel, unit, lossLabel, endLabel, stages, logScale }) {
  const { t } = useLang();
  const u = unit || t('만','0K');
  const maxCount = totalPop || stages[0]?.count || 1;

  // Auto-detect if log scale needed: if ratio > 50x between first and last stage
  const ratio = stages[0]?.count / (stages[stages.length - 1]?.count || 1);
  const useLog = logScale ?? ratio > 30;

  function getWidth(count) {
    if (useLog) {
      const logMax = Math.log10(maxCount);
      const logVal = Math.log10(Math.max(count, 1));
      return Math.max((logVal / logMax) * 100, 15);
    }
    return Math.max((count / maxCount) * 100, 15);
  }

  const allRows = [
    { label: totalLabel || t('전체 인구','Total Pop.'), count: totalPop, color: '#555577', note: '', isTotal: true },
    ...stages,
  ];

  return (
    <div style={{ marginTop: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <span style={{ fontSize: '13px', fontWeight: 700, color: '#e8e8f0' }}>{title}</span>
        <span style={{ fontSize: '9px', color: '#9999bb' }}>{source}</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0px' }}>
        {allRows.map((row, i) => {
          const widthPct = getWidth(row.count);
          const prev = i === 0 ? null : allRows[i - 1].count;
          const lost = prev != null ? prev - row.count : 0;
          const lostPct = prev > 0 ? Math.round((lost / prev) * 100) : 0;

          // Format count nicely
          const countStr = row.count >= 10000
            ? `${(row.count / 10000).toFixed(1)}${t('억','00M')}`
            : `${row.count.toLocaleString()}${u}`;

          return (
            <div key={i}>
              {lost > 0 && (
                <div style={{ textAlign: 'center', height: '14px', lineHeight: '14px' }}>
                  <span style={{ fontSize: '8px', color: '#ff6b6b88' }}>
                    ▼ -{lost.toLocaleString()}{u} ({lostPct}% {i === 1 ? (lossLabel || t('비유병','unaffected')) : t('이탈','lost')})
                  </span>
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ width: '76px', textAlign: 'right', paddingRight: '8px', flexShrink: 0 }}>
                  <div style={{ fontSize: row.isTotal ? '9px' : '10px', color: row.color, fontWeight: 700, lineHeight: 1.2 }}>{row.label}</div>
                </div>

                <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                  <div style={{
                    width: `${widthPct}%`, minWidth: '50px',
                    height: row.isTotal ? '22px' : '26px',
                    background: row.isTotal
                      ? 'rgba(255,255,255,0.06)'
                      : `linear-gradient(180deg, ${row.color}cc, ${row.color}44)`,
                    borderRadius: i === 0 ? '8px 8px 4px 4px' : i === allRows.length - 1 ? '4px 4px 8px 8px' : '3px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: row.isTotal ? '1px solid rgba(255,255,255,0.08)' : `1px solid ${row.color}33`,
                    transition: 'width 0.8s ease',
                  }}>
                    <span style={{
                      fontSize: row.isTotal ? '10px' : '11px',
                      fontWeight: row.isTotal ? 500 : 800,
                      color: row.isTotal ? '#9999bb' : '#fff',
                      fontFamily: "'JetBrains Mono'",
                      textShadow: row.isTotal ? 'none' : '0 1px 4px rgba(0,0,0,0.7)',
                      whiteSpace: 'nowrap',
                    }}>
                      {countStr}
                    </span>
                  </div>
                </div>

                <div style={{ width: '76px', paddingLeft: '8px', flexShrink: 0 }}>
                  <div style={{ fontSize: '8px', color: '#9999bb', lineHeight: 1.3 }}>{row.note}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '12px', fontSize: '10px' }}>
        <span style={{ color: '#ff6b6b' }}>
          {t('이탈','Lost')}: {(stages[0].count - stages[stages.length - 1].count).toLocaleString()}{u}
          <span style={{ opacity: 0.7 }}> ({Math.round((1 - stages[stages.length - 1].count / stages[0].count) * 100)}%)</span>
        </span>
        <span style={{ color: stages[stages.length - 1].color }}>
          {endLabel || t('도달','Reached')}: {stages[stages.length - 1].count.toLocaleString()}{u}
          <span style={{ opacity: 0.7 }}> ({Math.round(stages[stages.length - 1].count / stages[0].count * 100)}%)</span>
        </span>
      </div>
      {useLog && (
        <div style={{ textAlign: 'center', fontSize: '7px', color: '#555566', marginTop: '4px' }}>
          {t('※ 로그 스케일 (범위 차이가 커 선형 대비 축소 표시)','※ Log scale (wide range compressed for visibility)')}
        </div>
      )}
    </div>
  );
}
