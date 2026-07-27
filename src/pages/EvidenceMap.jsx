import { useState, useMemo } from 'react';

const t = (ko, en, lang) => (lang === 'ko' ? ko : en);
const fmt = (n, d = 0) => (n ?? 0).toLocaleString('ko-KR', { minimumFractionDigits: d, maximumFractionDigits: d });

// ── 계산 상수 (cea_saver.py와 동일) ──
const P_GOOD0 = 0.39, P_DEAD0 = 0.17;
const U_GOOD = 0.875, U_POOR = 0.545;
const OR_GOOD = 1.04, OR_DEAD = 0.96;
const DISC = 0.045, H = 10;
const AF = Array.from({ length: H }, (_, y) => 1 / (1 + DISC) ** y).reduce((a, b) => a + b, 0);

// 후보 5개소: 커버 발생 / 인구가중 평균 단축(분)
const SITES = [
  { n: '서산중앙병원', sg: '충남 서산', cases: 1099, cut: 46 },
  { n: '해남종합병원', sg: '전남 해남', cases: 855, cut: 40 },
  { n: '거붕백병원', sg: '경남 거제', cases: 345, cut: 67 },
  { n: '서귀포의료원', sg: '제주 서귀포', cases: 371, cut: 57 },
  { n: '태백병원', sg: '강원 태백', cases: 250, cut: 41 },
];

const shift = (p0, OR, dmin) => {
  const o = (p0 / (1 - p0)) * OR ** (dmin / 15);
  return o / (1 + o);
};

const STEPS = [
  {
    k: 'A', ttl: ['이 동네에 환자가 몇 명 생길까', 'How many patients will occur'],
    desc: ['뇌졸중은 나이가 많을수록, 같은 나이라면 남성에게 더 잘 생겨요. 그래서 전국 평균 발생률을 그 동네의 나이·성별 구성에 그대로 입혀서, 이 인구라면 한 해에 몇 명이 쓰러질지를 계산해요. 뇌졸중 넷 중 셋은 혈관이 막히는 종류라 그 비율만 남기고요.',
      'Nationwide age- and sex-specific rates are applied to each area’s own population structure.'],
    eq: ['한 해 예상 환자 = 동네 인구(나이·성별로 쪼갠 것) × 전국 발생률 × 0.76', 'Expected cases = population × national rate × 0.76'],
    src: [['국내', 'kr'], ['주민등록인구 2024 · 질병관리청 발생통계', '']],
  },
  {
    k: 'B', ttl: ['쓰러진 뒤 치료까지 얼마나 걸릴까', 'How long until treatment'],
    desc: ['환자가 병원에 닿기까지는 두 덩어리의 시간이 걸려요. 하나는 신고를 받고 구급차가 도착해 환자를 태우기까지, 다른 하나는 거기서 병원까지 달리는 시간이죠. 앞쪽은 소방청 기록으로 시도마다 20분 안팎이고, 뒤쪽은 동네 주민센터에서 가장 가까운 인증 뇌졸중센터까지 실제 도로를 달린 시간이에요.',
      'Two blocks: ambulance response plus on-scene time (~20 min), then the drive to hospital.'],
    eq: ['치료까지 걸리는 시간 = 구급차가 오고 태우는 시간(약 20분) + 병원까지 달리는 시간', 'Total = prehospital (~20 min) + road time'],
    src: [['본연구', 'own'], ['실제 도로 소요시간(KakaoMap API) · 소방청 2024 통계연보', '']],
  },
  {
    k: 'C', ttl: ['15분 빨라지면 얼마나 좋아질까', 'What 15 minutes buys'],
    desc: ['뇌졸중 치료제는 늦을수록 효과가 빠지는 약이라 얼마나 빨리 맞느냐가 결과를 갈라요. 미국에서 실제 환자 5만 8천 명을 추적해보니 치료가 15분 빨라질 때마다 혼자 걸어서 퇴원할 확률이 오르고 사망 확률은 떨어졌어요. 이 숫자를 그대로 가져다 썼어요.',
      'Every 15 minutes faster raised independent ambulation and lowered mortality in 58,353 US patients.'],
    eq: ['치료가 15분 빨라질 때마다 — 혼자 걷기 1.04배 늘고, 사망 0.96배로 줄어요', 'Per 15 min faster — ambulation ×1.04, mortality ×0.96'],
    src: [['국제', 'int'], ['Saver 2013 JAMA 309(23):2480 — 환자 58,353명', '']],
  },
  {
    k: 'D', ttl: ['그래서 어디가 제일 급한가', 'Which area is most urgent'],
    desc: ['환자가 많이 생기는 곳과 치료가 늦는 곳, 둘 다 해당하는 동네가 가장 급해요. 그래서 예상 환자 수에 "늦어서 잃는 몫"을 곱해요. 거리와 발생률을 몇 대 몇으로 섞을지 사람이 정하지 않고, 각자 제 역할로 들어가 자연히 곱해지는 구조예요.',
      'Urgency = expected cases × benefit lost to delay. No arbitrary weighting.'],
    eq: ['급한 정도 = 예상 환자 수 × 늦어서 잃는 몫', 'Urgency = cases × loss from delay'],
    src: [['본연구', 'own'], ['시군구 252곳 · 읍면동 3,556곳 계산', '']],
  },
  {
    k: 'E', ttl: ['어느 병원을 센터로 만들면 좋을까', 'Which hospital to upgrade'],
    desc: ['새로 짓는 게 아니라 이미 응급실과 CT를 갖춘 병원 중에서 골라요. 그중 어디를 센터로 지정하면 1시간 밖에 남는 환자가 가장 많이 줄어드는지 하나씩 따져서 순서를 매겨요.',
      'Candidates are existing hospitals with an ER and CT; ranked by how much uncovered burden each removes.'],
    src: [['국제', 'int'], ['최대커버입지 모형(Church & ReVelle 1974) · 심평원 병원·장비 2026.6', '']],
  },
  {
    k: 'F', ttl: ['그만한 돈을 쓸 값어치가 있나', 'Is it worth the money'],
    desc: ['시간이 줄면 후유증이 가벼워지고 사망도 줄어요. 그 개선을 "건강하게 사는 햇수"로 바꾸고 장애가 남았을 때 5년간 드는 의료비와 견줘요. 국내 환자 1만 1천여 명의 실제 진료비 자료를 썼어요.',
      'Gains are converted to healthy life-years and weighed against 5-year care costs.'],
    src: [['국내', 'kr'], ['Kim DY 2020 Neurology 94(9):e978 — 국내 11,136명', '']],
  },
];

const TAGC = { kr: ['#00ff88', 'rgba(0,255,136,0.13)'], int: ['#ffb74d', 'rgba(255,183,77,0.13)'], own: ['#b388ff', 'rgba(179,136,255,0.13)'], warn: ['#ff2d6e', 'rgba(255,45,110,0.13)'] };

export default function EvidenceMap({ lang }) {
  const [open, setOpen] = useState('C');
  const [rep, setRep] = useState(20);        // 재관류 시행률 %
  const [le, setLe] = useState(9.6);         // 잔여여명
  const [gain, setGain] = useState(100);     // 시간단축 배율 %

  const calc = useMemo(() => {
    let cases = 0, treated = 0, good = 0, dead = 0, qaly = 0;
    const rows = SITES.map((s) => {
      const d = s.cut * (gain / 100);
      const tr = s.cases * (rep / 100);
      const dg = shift(P_GOOD0, OR_GOOD, d) - P_GOOD0;
      const dd = P_DEAD0 - shift(P_DEAD0, OR_DEAD, d);
      const q = tr * (dd * U_POOR * le + dg * (U_GOOD - U_POOR) * le);
      cases += s.cases; treated += tr; good += tr * dg; dead += tr * dd; qaly += q;
      return { ...s, d, tr, g: tr * dg, dv: tr * dd, q, q10: q * AF };
    });
    return { rows, cases, treated, good, dead, qaly, q10: qaly * AF };
  }, [rep, le, gain]);

  const card = { background: 'var(--bg-card)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14 };
  const maxQ = Math.max(...calc.rows.map((r) => r.q10), 1);

  const slider = (label, val, set, min, max, step, unit, hint) => (
    <div style={{ flex: '1 1 170px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 3 }}>
        <span style={{ fontSize: 11.5, color: '#bbbbdd', fontWeight: 600 }}>{label}</span>
        <span style={{ fontSize: 13, color: '#00d4ff', fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>{val}{unit}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={val} onChange={(e) => set(+e.target.value)}
        style={{ width: '100%', accentColor: '#00d4ff' }} />
      <div style={{ fontSize: 10, color: '#7a7a99', marginTop: 1 }}>{hint}</div>
    </div>
  );

  return (
    <section style={{ ...card, padding: '20px 22px', marginTop: 16 }}>
      <div style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>
        {t('🗺️ 이 숫자들은 어디서 왔나', '🗺️ Where these numbers come from', lang)}</div>
      <div style={{ fontSize: 12.5, color: '#9a9db0', lineHeight: 1.7, margin: '7px 0 15px', maxWidth: '76ch' }}>
        {t('계산이 여섯 단계로 이어져요. 각 단계를 눌러서 무엇을 어떤 근거로 계산했는지 펼쳐볼 수 있고, 아래 손잡이를 움직이면 가정이 바뀔 때 결과가 어떻게 달라지는지 바로 보여요.',
          'Six steps. Tap any step to see what it does and where the numbers come from; move the sliders to see how assumptions change the result.', lang)}
      </div>

      {/* 단계 */}
      <div style={{ display: 'grid', gap: 6 }}>
        {STEPS.map((s) => {
          const on = open === s.k;
          return (
            <div key={s.k} style={{ border: `1px solid ${on ? 'rgba(0,212,255,0.35)' : 'rgba(255,255,255,0.07)'}`, borderRadius: 10, background: on ? 'rgba(0,212,255,0.05)' : 'rgba(0,0,0,0.18)', overflow: 'hidden' }}>
              <button onClick={() => setOpen(on ? null : s.k)}
                style={{ display: 'flex', alignItems: 'center', gap: 11, width: '100%', border: 0, background: 'transparent', cursor: 'pointer', font: 'inherit', padding: '11px 13px', textAlign: 'left' }}>
                <span style={{ width: 25, height: 25, borderRadius: '50%', display: 'grid', placeItems: 'center', flexShrink: 0,
                  background: on ? '#00d4ff' : 'rgba(255,255,255,0.08)', color: on ? '#08080d' : '#8888aa', fontSize: 12, fontWeight: 800 }}>{s.k}</span>
                <span style={{ flex: 1, fontSize: 13.5, fontWeight: 650, color: on ? '#fff' : '#cdd0dd' }}>{t(s.ttl[0], s.ttl[1], lang)}</span>
                <span style={{ color: '#7a7a99', fontSize: 11, transform: on ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}>▾</span>
              </button>
              {on && (
                <div style={{ padding: '0 13px 13px 49px' }}>
                  <div style={{ fontSize: 12.5, color: '#9a9db0', lineHeight: 1.75, maxWidth: '72ch' }}>{t(s.desc[0], s.desc[1], lang)}</div>
                  {s.eq && (
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11.5, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 7, padding: '9px 11px', margin: '9px 0 0', color: '#cdd0dd', overflowX: 'auto' }}>
                      {t(s.eq[0], s.eq[1], lang)}</div>
                  )}
                  <div style={{ display: 'flex', gap: 7, alignItems: 'center', flexWrap: 'wrap', marginTop: 8, fontSize: 11, color: '#7a7a99' }}>
                    {s.src[0] && <span style={{ color: TAGC[s.src[0][1]][0], background: TAGC[s.src[0][1]][1], borderRadius: 3, padding: '2px 7px', fontWeight: 700, fontSize: 10 }}>{s.src[0][0]}</span>}
                    <span>{s.src[1][0]}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 인터랙티브 */}
      <div style={{ marginTop: 18, borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 15 }}>
        <div style={{ fontSize: 13.5, fontWeight: 800, color: '#fff', marginBottom: 3 }}>
          {t('가정을 바꿔보세요', 'Try changing the assumptions', lang)}</div>
        <div style={{ fontSize: 11.5, color: '#7a7a99', marginBottom: 12 }}>
          {t('다섯 곳을 센터로 지정했을 때 한 해에 달라지는 것 — 손잡이를 움직이면 바로 다시 계산돼요.', 'Annual effect of upgrading five sites — recalculates live.', lang)}</div>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 16 }}>
          {slider(t('실제 치료받는 비율', 'Treated share', lang), rep, setRep, 5, 40, 1, '%', t('지금은 5명 중 1명', 'currently 1 in 5', lang))}
          {slider(t('남은 수명', 'Life expectancy', lang), le, setLe, 5, 15, 0.5, t('년', 'y', lang), t('70세 발병 기준', 'onset at 70', lang))}
          {slider(t('시간 단축 정도', 'Time saved', lang), gain, setGain, 30, 150, 5, '%', t('기준의 몇 배로 볼지', 'vs. baseline', lang))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(132px,1fr))', gap: 9, marginBottom: 15 }}>
          {[
            { v: fmt(calc.treated), l: t('한 해 치료 건수', 'treated/yr', lang), c: '#8fd6e6' },
            { v: fmt(calc.good, 1), l: t('혼자 걷게 되는 사람', 'walk independently', lang), c: '#00ff88' },
            { v: fmt(calc.dead, 1), l: t('살아남는 사람', 'deaths averted', lang), c: '#00ff88' },
            { v: fmt(calc.q10), l: t('10년 건강수명', 'healthy years, 10y', lang), c: '#00d4ff' },
          ].map((k, i) => (
            <div key={i} style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 9, padding: '11px 13px' }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: k.c, fontVariantNumeric: 'tabular-nums' }}>{k.v}</div>
              <div style={{ fontSize: 11, color: '#8888aa', marginTop: 2, lineHeight: 1.4 }}>{k.l}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gap: 6 }}>
          {calc.rows.map((r, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '118px 1fr 66px', gap: 10, alignItems: 'center', fontSize: 12 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ color: '#e8e8f0', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.n}</div>
                <div style={{ fontSize: 10, color: '#7a7a99' }}>{r.sg} · {fmt(r.d)}{t('분 단축', 'min', lang)}</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 5, height: 15, overflow: 'hidden' }}>
                <div style={{ width: `${Math.max(2, r.q10 / maxQ * 100)}%`, height: '100%', background: 'linear-gradient(90deg,#00d4ff,#b388ff)', borderRadius: 5, transition: 'width .3s ease' }} />
              </div>
              <div style={{ textAlign: 'right', fontWeight: 700, color: '#8fd6e6', fontVariantNumeric: 'tabular-nums' }}>{fmt(r.q10)}</div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 10.5, color: '#7a7a99', marginTop: 7 }}>
          {t('막대 = 10년 동안 늘어나는 건강수명(건강하게 사는 햇수)', 'bar = healthy life-years gained over 10 years', lang)}</div>
      </div>

      <div style={{ fontSize: 11, color: '#7a7a99', marginTop: 14, lineHeight: 1.65, borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 11 }}>
        {t('기본값으로 두면 다섯 곳에서 10년간 약 900년치 건강수명이 늘고, 그중 대략 열 명 중 넷은 사망을 피한 몫이에요. 치료받는 비율을 올리거나 시간이 더 줄면 결과가 비례해서 커져요. 계산에 쓴 숫자와 출처는 위 단계를 눌러 확인할 수 있어요.',
          'At default settings the five sites add roughly 900 healthy life-years over ten years. Open any step above to see the sources.', lang)}
      </div>
    </section>
  );
}
