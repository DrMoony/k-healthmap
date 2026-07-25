import { useState } from 'react';

const t = (ko, en, lang) => (lang === 'ko' ? ko : en);

// 임계값 분석 — WTP에서 역산한 후보별 허용 연간지원 상한(억원). cea_threshold.py 산출.
const SITES = [
  { n: '서산중앙병원', sg: '충남 서산', cases: 1099, qaly: 327, save: 58, cap: { w35: 20.9, w50: 26.8 } },
  { n: '해남종합병원', sg: '전남 해남', cases: 855, qaly: 219, save: 39, cap: { w35: 14.0, w50: 18.0 } },
  { n: '거붕백병원', sg: '경남 거제', cases: 345, qaly: 148, save: 26, cap: { w35: 9.5, w50: 12.1 } },
  { n: '서귀포의료원', sg: '제주 서귀포', cases: 371, qaly: 136, save: 24, cap: { w35: 8.7, w50: 11.2 } },
  { n: '태백병원', sg: '강원 태백', cases: 250, qaly: 66, save: 12, cap: { w35: 4.2, w50: 5.4 } },
];
const TOTAL = { w35: 57, w50: 74 };
const REF = [
  { v: 2.5, lab: '지역센터 국고', c: '#8888aa' },
  { v: 14, lab: '권역센터 총사업비', c: '#00d4ff' },
];
const MAX = 30; // 축 상한(억)

export default function CeaThreshold({ lang }) {
  const [wtp, setWtp] = useState('w35');
  const pct = (v) => Math.min(100, (v / MAX) * 100);

  return (
    <div style={{ marginTop: 16, borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 13.5, fontWeight: 800, color: '#fff' }}>
          {t('얼마까지 지원해도 타당한가 — 임계값 분석', 'How much subsidy is justified — threshold analysis', lang)}</div>
        <div style={{ display: 'inline-flex', background: '#0d0d14', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: 3 }}>
          {[['w35', t('WTP 3,500만', 'WTP ₩35M', lang)], ['w50', t('WTP 5,000만', 'WTP ₩50M', lang)]].map(([k, l]) => (
            <button key={k} onClick={() => setWtp(k)} style={{ border: 0, cursor: 'pointer', font: 'inherit', fontSize: 11.5, fontWeight: 700, padding: '5px 10px', borderRadius: 6, background: wtp === k ? 'linear-gradient(90deg,#b388ff,#00d4ff)' : 'transparent', color: wtp === k ? '#08080d' : '#bbbbdd' }}>{l}</button>
          ))}
        </div>
      </div>
      <div style={{ fontSize: 12, color: '#9a9db0', lineHeight: 1.7, margin: '8px 0 16px', maxWidth: '76ch' }}>
        {t('운영비를 우리가 가정하지 않고 거꾸로 물었어요 — "이 병원을 승격해서 얻는 건강개선이 사회가 지불할 의사가 있는 만큼의 가치라면, 연간 얼마까지 지원해도 타당한가?" 막대가 곧 그 상한이고, 세로선은 현행 예산이에요.',
          'Instead of assuming operating cost, we invert the question: given the health gain, how much annual support is justified at this willingness-to-pay? Bars are the ceiling; vertical lines are current budgets.', lang)}
      </div>

      <div style={{ position: 'relative', paddingBottom: 4 }}>
        {SITES.map((s, i) => {
          const v = s.cap[wtp];
          const over14 = v >= 14;
          const col = over14 ? '#00ff88' : v >= 2.5 ? '#ffd60a' : '#ff2d6e';
          return (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '124px 1fr 92px', gap: 10, alignItems: 'center', margin: '9px 0' }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: '#e8e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.n}</div>
                <div style={{ fontSize: 10.5, color: '#7a7a99' }}>{s.sg} · {s.cases.toLocaleString('ko-KR')}{t('건/년', '/yr', lang)}</div>
              </div>
              <div style={{ position: 'relative', height: 26, background: 'rgba(255,255,255,0.04)', borderRadius: 6 }}>
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${pct(v)}%`, background: `linear-gradient(90deg,${col}cc,${col}66)`, borderRadius: 6, transition: 'width .35s ease' }} />
                {REF.map((r, j) => (
                  <div key={j} style={{ position: 'absolute', left: `${pct(r.v)}%`, top: -3, bottom: -3, width: 2, background: r.c, opacity: 0.85 }} />
                ))}
              </div>
              <div style={{ textAlign: 'right', fontSize: 14, fontWeight: 800, color: col, fontVariantNumeric: 'tabular-nums' }}>
                {v.toFixed(1)}<span style={{ fontSize: 11, color: '#8888aa', fontWeight: 600 }}> {t('억', '00M', lang)}</span></div>
            </div>
          );
        })}
        <div style={{ display: 'grid', gridTemplateColumns: '124px 1fr 92px', gap: 10, marginTop: 2 }}>
          <div />
          <div style={{ position: 'relative', height: 16 }}>
            {REF.map((r, j) => (
              <div key={j} style={{ position: 'absolute', left: `${pct(r.v)}%`, transform: 'translateX(-50%)', fontSize: 9.5, color: r.c, whiteSpace: 'nowrap', fontWeight: 700 }}>
                ↑ {r.v}{t('억 ', '00M ', lang)}{t(r.lab, r.lab, lang)}</div>
            ))}
          </div>
          <div />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 14 }}>
        <div style={{ flex: '1 1 200px', background: 'rgba(0,255,136,0.06)', border: '1px solid rgba(0,255,136,0.25)', borderRadius: 9, padding: '11px 13px' }}>
          <div style={{ fontSize: 10.5, color: '#8888aa', fontWeight: 700 }}>{t('5개소 총 허용 연간지원', 'Total justified annual support', lang)}</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#00ff88', marginTop: 3, fontVariantNumeric: 'tabular-nums' }}>
            {TOTAL[wtp]}<span style={{ fontSize: 12, color: '#bbbbdd', fontWeight: 600 }}> {t('억원/년', '00M/yr', lang)}</span></div>
          <div style={{ fontSize: 11, color: '#7a7a99', marginTop: 2 }}>{t('센터당 평균', 'avg per centre', lang)} {(TOTAL[wtp] / 5).toFixed(1)}{t('억', '00M', lang)}</div>
        </div>
        <div style={{ flex: '1 1 200px', background: 'rgba(0,0,0,0.22)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 9, padding: '11px 13px' }}>
          <div style={{ fontSize: 10.5, color: '#8888aa', fontWeight: 700 }}>{t('현행 권역센터 14개소 사업비', 'Current 14 regional centres', lang)}</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#cdd0dd', marginTop: 3, fontVariantNumeric: 'tabular-nums' }}>
            196<span style={{ fontSize: 12, color: '#bbbbdd', fontWeight: 600 }}> {t('억원/년', '00M/yr', lang)}</span></div>
          <div style={{ fontSize: 11, color: '#7a7a99', marginTop: 2 }}>{t('이 확충안은 그 ', 'this plan = ', lang)}{Math.round(TOTAL[wtp] / 196 * 100)}%{t(' 규모', ' of it', lang)}</div>
        </div>
      </div>

      <div style={{ fontSize: 11.5, color: '#9a9db0', lineHeight: 1.75, marginTop: 13, maxWidth: '78ch' }}>
        {t('읽는 법 — 막대가 파란 선(권역센터 14억)을 넘으면 권역급으로 지원해도 타당하다는 뜻이에요. 서산은 20.9억까지 여유가 있어 권역급 지원도 충분히 정당화되고, 태백은 4.2억이 한계라 지역센터급(2.5억)이 적정 수준이에요. 즉 같은 확충이라도 부담이 큰 곳일수록 더 써도 되고, 이 순서가 곧 예산 배분 우선순위가 돼요.',
          'If a bar passes the blue line (regional-centre budget ₩1.4B), regional-level support is justified. Seosan allows up to ₩2.09B; Taebaek caps at ₩420M, matching local-centre scale. Larger averted burden justifies larger support — that ordering is the budget priority.', lang)}
      </div>
      <div style={{ fontSize: 11, color: '#7a7a99', marginTop: 9, lineHeight: 1.6 }}>
        {t('※ 상한 = (WTP × 증분 QALY − 하류 의료비 절감)을 10년 현가로 환산한 연간액. 설립비 0, 할인 4.5% 가정. 운영비를 가정하지 않으므로 CEA에서 가장 불확실한 파라미터를 우회해요.',
          '※ Ceiling = (WTP × incremental QALY − downstream savings) annualised over 10 years at 4.5%. Avoids assuming operating cost, the least certain CEA parameter.', lang)}
      </div>
    </div>
  );
}
