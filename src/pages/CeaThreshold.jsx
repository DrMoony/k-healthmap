import { useState } from 'react';

const t = (ko, en, lang) => (lang === 'ko' ? ko : en);

// cea_final.py 산출 — 허용 연간 지원 상한(억원). [WTP][시행률] 조합.
// WTP: w25=관행 2,500만 / wg=1×GDP 3,700만 / w50=암묵상한 5,000만
// 시행률 티어: r102 현행 / r150 정책목표 / r195 선진국 / r310 최상위
const SITES = [
  { n: '서산중앙병원', sg: '충남 서산', cases: 1099,
    v: { r102: [6.5, 8.9, 11.6], r150: [9.5, 13.1, 17.0], r195: [12.4, 17.1, 22.1], r310: [19.7, 27.1, 35.2] } },
  { n: '해남종합병원', sg: '전남 해남', cases: 855,
    v: { r102: [4.5, 6.1, 7.9], r150: [6.6, 9.0, 11.6], r195: [8.6, 11.7, 15.1], r310: [13.7, 18.6, 24.0] } },
  { n: '거붕백병원', sg: '경남 거제', cases: 345,
    v: { r102: [2.7, 3.8, 5.0], r150: [4.0, 5.6, 7.4], r195: [5.2, 7.3, 9.6], r310: [8.3, 11.6, 15.3] } },
  { n: '서귀포의료원', sg: '제주 서귀포', cases: 371,
    v: { r102: [2.6, 3.6, 4.7], r150: [3.8, 5.3, 6.9], r195: [4.9, 6.9, 9.0], r310: [7.9, 10.9, 14.3] } },
  { n: '태백병원', sg: '강원 태백', cases: 250,
    v: { r102: [1.3, 1.8, 2.4], r150: [2.0, 2.7, 3.5], r195: [2.6, 3.5, 4.5], r310: [4.1, 5.6, 7.2] } },
];
const TOTAL = { r102: [17.6, 24.3, 31.6], r150: [26.0, 35.8, 46.4], r195: [33.7, 46.5, 60.4], r310: [53.6, 74.0, 96.0] };
const QALY = { r102: [461, 43], r150: [677, 63], r195: [881, 82], r310: [1400, 131] };

const WTPS = [
  { k: 0, lab: '2,500만', full: '관행 기준' },
  { k: 1, lab: '3,700만', full: '1인당 GDP' },
  { k: 2, lab: '5,000만', full: '암묵 상한' },
];
const RATES = [
  { k: 'r102', lab: '현행 10.2%', tier: '한국 현재', note: 'CRCS-K 2021 · 2017–19년 12%에서 하락' },
  { k: 'r150', lab: '목표 15%', tier: '정책 목표', note: '유럽뇌졸중기구 2030 목표 — 전 회원국 15% 이상' },
  { k: 'r195', lab: '선진 19.5%', tier: '선진국 도달', note: '독일 2023 — 촘촘한 stroke unit 망 + 텔레스트로크' },
  { k: 'r310', lab: '최상위 31%', tier: '최상위 사례', note: '헬싱키 단일센터 · 체코 26.4% — 병원전 통보·중앙 트리아지' },
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
      {(() => {
        const R = RATES.find((r) => r.k === rate);
        return (
          <div style={{ background: 'rgba(0,0,0,0.22)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, padding: '9px 12px', margin: '2px 0 14px' }}>
            <div style={{ fontSize: 11, color: '#8888aa' }}>
              <b style={{ color: '#bbbbdd' }}>{t(R.tier, R.tier, lang)}</b> · {WTPS[wtp].full}</div>
            <div style={{ fontSize: 11.5, color: '#9a9db0', marginTop: 3, lineHeight: 1.55 }}>{R.note}</div>
          </div>
        );
      })()}

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
        {t('현행 투여 비율에서도 센터당 평균 4.9억이 정당화되는데, 이는 정부가 권역센터에 24시간 진료체계 몫으로 배정하는 5억과 거의 같아요. 서산은 단독으로 8.9억까지 가능하고, 투여 비율이 정책 목표(15%)에 이르면 13.1억으로 권역 총사업비를 넘어서요. 반대로 태백은 1.8억이 한계라 단독 센터보다 이송체계나 원격협진이 합리적이에요. 시행률을 올리는 것 자체가 센터 확충과 맞먹는 정책 레버라는 뜻이에요.',
          'At the current rate an average ₩490M per centre is justified — nearly identical to the ₩500M the government allocates for 24-hour care. Seosan alone justifies ₩890M, exceeding the regional total budget at the 15% policy target. Raising the treatment rate is itself a policy lever comparable to building centres.', lang)}
      </div>
      <div style={{ fontSize: 11, color: '#7a7a99', marginTop: 10, lineHeight: 1.65 }}>
        {t('※ 상한 = (지불의사 × 늘어나는 건강수명 + 아끼는 의료비)를 10년 현가로 환산한 연간액. 할인 4.5%, 설립비 제외. 이 후보들은 혈전 제거 시술이 아닌 정맥 혈전용해(tPA) 체계를 갖추는 시나리오라 시행률도 tPA 기준이에요.',
          '※ Ceiling = (WTP × QALY gained + downstream savings), annualised over 10 years at 4.5%. These sites model IV thrombolysis capability, not thrombectomy.', lang)}
      </div>
      <div style={{ fontSize: 11, color: '#9a9db0', marginTop: 12, lineHeight: 1.7, background: 'rgba(179,136,255,0.06)', border: '1px solid rgba(179,136,255,0.2)', borderRadius: 9, padding: '11px 13px' }}>
        <b style={{ color: '#d9c4ff', fontSize: 11.5 }}>{t('시행률은 왜 나라마다 다를까 — 돈보다 시스템이에요', 'Why rates differ — systems, not money', lang)}</b>
        <div style={{ marginTop: 5 }}>
          {t('한국 10.2%는 유럽 평균 14.3%에 못 미치고 2017–19년 12%에서 오히려 떨어졌어요. 발목을 잡는 건 병원 도착 지연이에요 — 발병에서 도착까지 중앙값이 5.1시간이라 4.5시간 안에 오는 사람이 37%뿐이거든요. 시행률이 높은 나라들은 새 병원을 지어서가 아니라 체계를 바꿔서 올렸어요. 체코(26.4%)는 2010–12년 전국 중앙 트리아지와 의무 질 보고를 도입했고, 헬싱키(31%)는 구급차가 미리 통보하고 CT실에서 바로 투약해요. 독일(19.5%)은 텔레스트로크로 인력 부족을 원격으로 메우고요. 센터 확충과 별개로 병원전 통보·인지 개선이 함께 가야 이 숫자에 닿아요.',
            'Korea’s 10.2% trails the European average and fell from 12% (2017–19). The bottleneck is arrival delay — median onset-to-door 5.1h, only 37% within 4.5h. High-performing countries raised rates by redesigning systems, not building hospitals: Czechia (26.4%) introduced nationwide triage and mandatory quality reporting; Helsinki (31%) uses prehospital notification and CT-suite treatment; Germany (19.5%) fills workforce gaps with telestroke.', lang)}
        </div>
        <div style={{ fontSize: 10.5, color: '#7a7a99', marginTop: 6 }}>
          {t('출처 — 한국 10.2%: CRCS-K-NIH 2021(JKMS 2024;39:e278) · 유럽 평균 14.3%·목표 15%: 유럽뇌졸중기구 Stroke Action Plan for Europe, Stroke Service Tracker 2023 · 독일 19.5%: Acute Stroke Treatment in Germany 2015–2023 · 체코 26.4%: 중앙화 뇌졸중체계 연구(2018) · 헬싱키 31%·병원전통보: Helsinki 모델 연구',
            'Sources — Korea 10.2%: CRCS-K-NIH 2021; Europe 14.3%/15% target: ESO Stroke Action Plan, Service Tracker 2023; Germany 19.5% (2015–2023); Czechia 26.4% (2018); Helsinki model.', lang)}
        </div>
      </div>
      <div style={{ fontSize: 10.5, color: '#7a7a99', marginTop: 9, lineHeight: 1.65, background: 'rgba(0,212,255,0.05)', border: '1px solid rgba(0,212,255,0.18)', borderRadius: 8, padding: '9px 11px' }}>
        {t('※ EVT(혈전 제거 시술)는 별개예요. 한국 EVT 시행률은 9.9%로 독일 9.1%·스웨덴 7.3%보다 오히려 높아요. EVT는 소수 대형 허브에서 하는 시술이라 이미 국제 수준이고, 뒤처진 건 넓게 깔려야 하는 tPA 하나예요. 이 확충안이 tPA 접근성을 다루는 이유고요. (EVT는 치료 창이 6–24시간이라 시간-편익 계산이 달라 이 모델에 섞지 않았어요.)',
          '※ EVT (thrombectomy) is separate. Korea’s EVT rate (9.9%) already exceeds Germany (9.1%) and Sweden (7.3%). EVT is hub-based and at international level; the gap is in broadly-distributed tPA. EVT’s 6–24h window makes its time-benefit different, so it is excluded from this model.', lang)}
      </div>
      <div style={{ fontSize: 10.5, color: '#6e6e8a', marginTop: 7, lineHeight: 1.7, background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '9px 11px' }}>
        <b style={{ color: '#8888aa' }}>{t('세로선 출처', 'Reference lines', lang)}</b><br />
        {t('· 지역센터 2.5억 — 보건복지부 「지역심뇌혈관질환센터 지정 공모」 공고 제2024-816호(국비 1.25억·자부담 1.25억), 제2025-922호(국비 1.25·지방비 0.75·자부담 0.5)',
          '· Local centre ₩250M — MOHW notices 2024-816, 2025-922', lang)}<br />
        {t('· 권역 24시간 전문진료체계 5억 — 보건복지부 「2024년 권역심뇌혈관질환센터 운영지침」. 총 5억(국비 2.5억) 중 2.5억 이상을 전문의 당직수당, 당직팀원 수당, 24시간 진료 추가인력 인건비, 지역 네트워크 운영비에 편성하도록 명시',
          '· Regional 24-hour care ₩500M — MOHW 2024 Regional CVD Centre Operating Guideline; ≥₩250M must fund on-call pay and 24-hour staffing', lang)}<br />
        {t('· 권역 총사업비 12억 — 같은 운영지침(국비 6억 = 전문진료 2.5 + 예방관리 3.5). 2026년 신규 지정 공고 제2025-921호(전남)는 운영비 14억 + 시설장비비 30억(1회)',
          '· Regional total ₩1.2B — same guideline; 2026 new-designation notice 2025-921 sets ₩1.4B plus ₩3B one-off facility cost', lang)}
      </div>
    </div>
  );
}
