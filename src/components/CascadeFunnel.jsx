import { useLang } from '../i18n';

/**
 * Care Cascade / Disease Progression Funnel
 * @param {string} title - 펀넬 제목
 * @param {string} source - 출처
 * @param {number} totalPop - 전체 인구 (만 단위)
 * @param {string} totalLabel - 전체 인구 라벨 (기본: "30세+ 인구")
 * @param {string} unit - 단위 (기본: "만")
 * @param {string} lossLabel - 첫 단계 이탈 라벨 (기본: "비유병")
 * @param {string} endLabel - 마지막 단계 라벨 (기본: "조절 도달")
 * @param {Array} stages - [{ label, count, color, note }]
 */
export default function CascadeFunnel({ title, source, totalPop, totalLabel, unit, lossLabel, endLabel, stages }) {
  const { lang, t } = useLang();
  const u = unit || t('만','0K');
  const maxCount = totalPop;

  return (
    <div style={{ marginTop: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <span style={{ fontSize: '13px', fontWeight: 700, color: '#e8e8f0' }}>{title}</span>
        <span style={{ fontSize: '9px', color: '#9999bb' }}>{source}</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0px' }}>
        {/* Total population bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
          <div style={{ width: '80px', textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: '9px', color: '#9999bb' }}>{totalLabel || t('30세+ 인구','30+ Pop.')}</div>
          </div>
          <div style={{ flex: 1, height: '16px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '10px', color: '#9999bb', fontFamily: "'JetBrains Mono'" }}>{totalPop.toLocaleString()}{u}</span>
          </div>
          <div style={{ width: '60px', flexShrink: 0 }} />
        </div>

        {stages.map((stage, i) => {
          const widthPct = Math.max((stage.count / maxCount) * 100, 8);
          const prev = i === 0 ? totalPop : stages[i - 1].count;
          const lost = prev - stage.count;
          const lostPct = prev > 0 ? Math.round((lost / prev) * 100) : 0;

          return (
            <div key={i}>
              {lost > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', height: '18px' }}>
                  <div style={{ width: '80px', flexShrink: 0 }} />
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ fontSize: '8px', color: '#ff6b6b', display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <span style={{ color: '#ff6b6b66' }}>▼</span>
                      <span>-{lost.toLocaleString()}{u} ({lostPct}% {i === 0 ? (lossLabel || t('비유병','unaffected')) : t('이탈','lost')})</span>
                    </div>
                  </div>
                  <div style={{ width: '60px', flexShrink: 0 }} />
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '80px', textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: '10px', color: stage.color, fontWeight: 700 }}>{stage.label}</div>
                </div>
                <div style={{ flex: 1, position: 'relative' }}>
                  <div style={{
                    width: `${widthPct}%`, height: '26px',
                    background: `linear-gradient(90deg, ${stage.color}dd, ${stage.color}55)`,
                    borderRadius: '4px',
                    display: 'flex', alignItems: 'center', paddingLeft: '8px',
                    transition: 'width 0.8s ease',
                  }}>
                    <span style={{ fontSize: '11px', fontWeight: 800, color: '#fff', fontFamily: "'JetBrains Mono'", textShadow: '0 1px 4px rgba(0,0,0,0.6)', whiteSpace: 'nowrap' }}>
                      {stage.count.toLocaleString()}{u}
                    </span>
                  </div>
                </div>
                <div style={{ width: '60px', flexShrink: 0, fontSize: '8px', color: '#9999bb', lineHeight: 1.3 }}>
                  {stage.note}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '12px', fontSize: '10px' }}>
        <span style={{ color: '#ff6b6b' }}>
          {t('최종 이탈','Total lost')}: {stages[0].count - stages[stages.length - 1].count}{u}
          ({Math.round((1 - stages[stages.length - 1].count / stages[0].count) * 100)}%)
        </span>
        <span style={{ color: '#4d96ff' }}>
          {endLabel || t('도달','Reached')}: {stages[stages.length - 1].count}{u}
          ({Math.round(stages[stages.length - 1].count / stages[0].count * 100)}%)
        </span>
      </div>
    </div>
  );
}
