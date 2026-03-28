import { useLang } from '../i18n';

export default function CascadeFunnel({ title, source, totalPop, totalLabel, unit, lossLabel, endLabel, stages }) {
  const { t } = useLang();
  const u = unit || t('만','0K');
  const maxCount = stages[0]?.count || 1; // 첫 단계 = 100% 기준

  return (
    <div style={{ marginTop: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <span style={{ fontSize: '13px', fontWeight: 700, color: '#e8e8f0' }}>{title}</span>
        <span style={{ fontSize: '9px', color: '#9999bb' }}>{source}</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0px' }}>
        {/* Total population context */}
        {totalPop && (
          <div style={{ textAlign: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '9px', color: '#666688', background: 'rgba(255,255,255,0.03)', padding: '2px 10px', borderRadius: '10px' }}>
              {totalLabel || t('30세+ 인구','30+ Pop.')} {totalPop.toLocaleString()}{u}
            </span>
          </div>
        )}

        {stages.map((stage, i) => {
          const widthPct = Math.max((stage.count / maxCount) * 100, 15);
          const prev = i === 0 ? (totalPop || stages[0].count) : stages[i - 1].count;
          const lost = prev - stage.count;
          const lostPct = prev > 0 ? Math.round((lost / prev) * 100) : 0;
          const showLoss = lost > 0 && (i > 0 || totalPop);

          return (
            <div key={i}>
              {/* Loss indicator */}
              {showLoss && (
                <div style={{ textAlign: 'center', height: '16px', lineHeight: '16px' }}>
                  <span style={{ fontSize: '8px', color: '#ff6b6b88' }}>
                    ▼ -{lost.toLocaleString()}{u} ({lostPct}% {i === 0 ? (lossLabel || t('비유병','unaffected')) : t('이탈','lost')})
                  </span>
                </div>
              )}

              {/* Stage bar — centered */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0px' }}>
                {/* Left label */}
                <div style={{ width: '76px', textAlign: 'right', paddingRight: '8px', flexShrink: 0 }}>
                  <div style={{ fontSize: '10px', color: stage.color, fontWeight: 700, lineHeight: 1.2 }}>{stage.label}</div>
                </div>

                {/* Center bar area */}
                <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                  <div style={{
                    width: `${widthPct}%`, minWidth: '60px', height: '28px',
                    background: `linear-gradient(180deg, ${stage.color}cc, ${stage.color}44)`,
                    borderRadius: i === 0 ? '8px 8px 4px 4px' : i === stages.length - 1 ? '4px 4px 8px 8px' : '4px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: `1px solid ${stage.color}33`,
                    transition: 'width 0.8s ease',
                  }}>
                    <span style={{
                      fontSize: stage.count >= 100 ? '12px' : '11px',
                      fontWeight: 800, color: '#fff',
                      fontFamily: "'JetBrains Mono'",
                      textShadow: '0 1px 4px rgba(0,0,0,0.7)',
                      whiteSpace: 'nowrap',
                    }}>
                      {stage.count >= 10000
                        ? `${(stage.count / 10000).toFixed(1)}${t('억','00M')}`
                        : `${stage.count.toLocaleString()}${u}`}
                    </span>
                  </div>
                </div>

                {/* Right note */}
                <div style={{ width: '76px', paddingLeft: '8px', flexShrink: 0 }}>
                  <div style={{ fontSize: '8px', color: '#9999bb', lineHeight: 1.3 }}>{stage.note}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary line */}
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
    </div>
  );
}
