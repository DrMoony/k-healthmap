import { useState } from 'react';

const t = (ko, en, lang) => (lang === 'ko' ? ko : en);

// cea_final.py 산출 — 허용 연간 지원 상한(억원). [WTP][시행률] 조합.
// WTP: w25=관행 2,500만 / wg=1×GDP 3,700만 / w50=암묵상한 5,000만
// 시행률: r102 현행 한국 / r113 아시아고소득 / r143 유럽평균 / r195 독일
const SITES = [
  { n: '서산중앙병원', sg: '충남 서산', cases: 1099,
    v: { r102: [6.5, 8.9, 11.6], r113: [7.2, 9.9, 12.8], r143: [9.1, 12.5, 16.2], r195: [12.4, 17.1, 22.1] } },
  { n: '해남종합병원', sg: '전남 해남', cases: 855,
    v: { r102: [4.5, 6.1, 7.9], r113: [5.0, 6.8, 8.8], r143: [6.3, 8.6, 11.1], r195: [8.6, 11.7, 15.1] } },
  { n: '거붕백병원', sg: '경남 거제', cases: 345,
    v: { r102: [2.7, 3.8, 5.0], r113: [3.0, 4.2, 5.6], r143: [3.8, 5.4, 7.0], r195: [5.2, 7.3, 9.6] } },
  { n: '서귀포의료원', sg: '제주 서귀포', cases: 371,
    v: { r102: [2.6, 3.6, 4.7], r113: [2.9, 4.0, 5.2], r143: [3.6, 5.1, 6.6], r195: [4.9, 6.9, 9.0] } },
  { n: '태백병원', sg: '강원 태백', cases: 250,
    v: { r102: [1.3, 1.8, 2.4], r113: [1.5, 2.0, 2.6], r143: [1.9, 2.6, 3.3], r195: [2.6, 3.5, 4.5] } },
];
const TOTAL = { r102: [17.6, 24.3, 31.6], r113: [19.6, 27.0, 35.0], r143: [24.7, 34.1, 44.3], r195: [33.7, 46.5, 60.4] };
const QALY = { r102: [461, 43], r113: [510, 48], r143: [646, 60], r195: [881, 82] };

const WTPS = [
  { k: 0, lab: '2,500만', full: '관행 기준' },
  { k: 1, lab: '3,700만', full: '1인당 GDP' },
  { k: 2, lab: '5,000만', full: '암묵 상한' },
];
const RATES = [
  { k: 'r102', lab: '한국 10.2%', note: '현행 (CRCS-K 2021)' },
  { k: 'r113', lab: '아시아 11.3%', note: '고소득국 평균' },
  { k: 'r143', lab: '유럽 14.3%', note: '47개국 평균 2023' },
  { k: 'r195', lab: '독일 19.5%', note: '2023' },
];
// 현행 정부 지원 기준선 (억원/년)
const REFS = [
  { v: 2.5, lab: '지역센터', c: '#8888aa' },
  { v: 5.0, lab: '권역 24시간 진료체계', c: '#00d4ff' },
  { v: 12.0, lab: '권역 총사업비', c: '#b388ff' },
];
const MAX = 24;

export default function CeaThreshold({ lang }) {
  const [wtp, setWtp] = useState(1);
  const [rate, setRate] = useState('r102');
  const pct = (v) => Math.min(100, (v / MAX) * 100);
  const seg = (items, cur, set, keyf) => (
    <div style={{ display: 'inline-flex', background: '#0d0d14', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: 3, flexWrap: 'wrap' }}>
      {items.map((x) => {
        const k = keyf(x); const on = cur === k;
        return (
          <button key={k} onClick={() => set(k)} title={x.full || x.note}
            style={{ border: 0, cursor: 'pointer', font: 'inherit', fontSize: 11.5, fontWeight: 700, padding: '5px 10px', borderRadius: 6,
              background: on ? 'linear-gradient(90deg,#b388ff,#00d4ff)' : 'transparent', color: on ? '#08080d' : '#bbbbdd' }}>{x.lab}</button>
        );
      })}
    </div>
  );

  const [q10, dv] = QALY[rate];
  const tot = TOTAL[rate][wtp];

  return (
    <div style={{ marginTop: 16, borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 14 }}>
      <div style={{ fontSize: 13.5, fontWeight: 800, color: '#fff' }}>
        {t('얼마까지 지원해도 타당한가', 'How much support is justified', lang)}</div>
      <div style={{ fontSize: 12, color: '#9a9db0', lineHeight: 1.7, margin: '8px 0 14px', maxWidth: '76ch' }}>
        {t('운영비를 짐작하는 대신 거꾸로 물었어요. 이만큼 건강이 좋아진다면 사회가 한 해에 얼마까지 쓰는 게 타당할까. 막대가 그 상한이고, 세로선은 정부가 지금 쓰는 금액이에요.',
          'Instead of assuming operating cost we invert the question: given the health gain, how much annual support is justified? Bars are the ceiling; vertical lines are current government funding.', lang)}
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 6 }}>
        <div>
          <div style={{ fontSize: 10.5, color: '#8888aa', fontWeight: 700, marginBottom: 4 }}>{t('1년 건강에 쓸 만한 돈', 'Willingness to pay', lang)}</div>
          {seg(WTPS, wtp, setWtp, (x) => x.k)}
        </div>
        <div>
          <div style={{ fontSize: 10.5, color: '#8888aa', fontWeight: 700, marginBottom: 4 }}>{t('치료제 투여 비율 목표', 'Thrombolysis rate target', lang)}</div>
          {seg(RATES, rate, setRate, (x) => x.k)}
        </div>
      </div>
      <div style={{ fontSize: 11, color: '#7a7a99', marginBottom: 14 }}>
        {WTPS[wtp].full} · {RATES.find((r) => r.k === rate).note}
      </div>

      <div style={{ position: 'relative', paddingBottom: 4 }}>
        {SITES.map((s, i) => {
          const v = s.v[rate][wtp];
          const col = v >= 12 ? '#b388ff' : v >= 5 ? '#00ff88' : v >= 2.5 ? '#ffd60a' : '#ff2d6e';
          return (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '118px 1fr 74px', gap: 10, alignItems: 'center', margin: '9px 0' }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: '#e8e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.n}</div>
                <div style={{ fontSize: 10.5, color: '#7a7a99' }}>{s.sg} · {s.cases.toLocaleString('ko-KR')}{t('건/년', '/yr', lang)}</div>
              </div>
              <div style={{ position: 'relative', height: 26, background: 'rgba(255,255,255,0.04)', borderRadius: 6 }}>
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${pct(v)}%`, background: `linear-gradient(90deg,${col}cc,${col}55)`, borderRadius: 6, transition: 'width .35s ease' }} />
                {REFS.map((r, j) => (
                  <div key={j} style={{ position: 'absolute', left: `${pct(r.v)}%`, top: -3, bottom: -3, width: 2, background: r.c, opacity: 0.8 }} />
                ))}
              </div>
              <div style={{ textAlign: 'right', fontSize: 14, fontWeight: 800, color: col, fontVariantNumeric: 'tabular-nums' }}>
                {v.toFixed(1)}<span style={{ fontSize: 10.5, color: '#8888aa', fontWeight: 600 }}> {t('억', '', lang)}</span></div>
            </div>
          );
        })}
        <div style={{ display: 'grid', gridTemplateColumns: '118px 1fr 74px', gap: 10, marginTop: 3 }}>
          <div />
          <div style={{ position: 'relative', height: 26 }}>
            {REFS.map((r, j) => (
              <div key={j} style={{ position: 'absolute', left: `${pct(r.v)}%`, transform: 'translateX(-50%)', textAlign: 'center', fontSize: 9, color: r.c, whiteSpace: 'nowrap', fontWeight: 700, lineHeight: 1.35 }}>
                ↑<br />{r.v}{t('억', '', lang)}<br />{r.lab}</div>
            ))}
          </div>
          <div />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 30 }}>
        <div style={{ flex: '1 1 150px', background: 'rgba(0,255,136,0.06)', border: '1px solid rgba(0,255,136,0.25)', borderRadius: 9, padding: '11px 13px' }}>
          <div style={{ fontSize: 10.5, color: '#8888aa', fontWeight: 700 }}>{t('5개소 합계', 'Five sites total', lang)}</div>
          <div style={{ fontSize: 21, fontWeight: 800, color: '#00ff88', marginTop: 3, fontVariantNumeric: 'tabular-nums' }}>
            {tot}<span style={{ fontSize: 11.5, color: '#bbbbdd', fontWeight: 600 }}> {t('억원/년', '00M/yr', lang)}</span></div>
          <div style={{ fontSize: 11, color: '#7a7a99', marginTop: 2 }}>{t('센터당 평균', 'avg/centre', lang)} {(tot / 5).toFixed(1)}{t('억', '', lang)}</div>
        </div>
        <div style={{ flex: '1 1 150px', background: 'rgba(0,0,0,0.22)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 9, padding: '11px 13px' }}>
          <div style={{ fontSize: 10.5, color: '#8888aa', fontWeight: 700 }}>{t('10년 건강수명', 'Healthy years, 10y', lang)}</div>
          <div style={{ fontSize: 21, fontWeight: 800, color: '#00d4ff', marginTop: 3, fontVariantNumeric: 'tabular-nums' }}>{q10}</div>
          <div style={{ fontSize: 11, color: '#7a7a99', marginTop: 2 }}>{t('사망 회피', 'deaths averted', lang)} {dv}{t('명', '', lang)}</div>
        </div>
      </div>

      <div style={{ fontSize: 11.5, color: '#9a9db0', lineHeight: 1.75, marginTop: 13, maxWidth: '78ch' }}>
        {t('현행 투여 비율에서도 센터당 평균 4.9억이 정당화되는데, 이는 정부가 권역센터에 24시간 진료체계 몫으로 배정하는 5억과 거의 같아요. 서산은 단독으로 8.9억까지 가능하고, 투여 비율이 유럽 평균에 이르면 12.5억으로 권역 총사업비에 근접해요. 반대로 태백은 1.8억이 한계라 단독 센터보다 이송체계나 원격협진이 합리적이에요.',
          'At the current thrombolysis rate an average ₩490M per centre is justified — nearly identical to the ₩500M the government allocates for 24-hour care at regional centres. Seosan alone justifies ₩890M, rising to ₩1.25B at the European average rate.', lang)}
      </div>
      <div style={{ fontSize: 11, color: '#7a7a99', marginTop: 10, lineHeight: 1.65 }}>
        {t('※ 상한 = (지불의사 × 늘어나는 건강수명 + 아끼는 의료비)를 10년 현가로 환산한 연간액. 할인 4.5%, 설립비 제외. 이 후보들은 혈전 제거 시술이 아닌 정맥 혈전용해(tPA) 체계를 갖추는 시나리오라 시행률도 tPA 기준이에요. 정부 지원 기준선: 지역센터 총사업비 2.5억, 권역센터 24시간 전문진료체계 5억(국비 2.5억), 권역센터 총사업비 12억(2026 신규 공고 14억).',
          '※ Ceiling = (WTP × QALY gained + downstream savings), annualised over 10 years at 4.5%. These sites model IV thrombolysis capability, not thrombectomy. Government reference: local centre ₩250M, regional 24-hour care ₩500M, regional total ₩1.2B.', lang)}
      </div>
    </div>
  );
}
