import { useState, useMemo } from 'react';
import { STROKE_CANDIDATES } from '../data/stroke_candidates';
import CeaThreshold from './CeaThreshold';

const t = (ko, en, lang) => (lang === 'ko' ? ko : en);
const ACCESS_CODE = '1003';

// 후보별 ICER (M원/QALY) — 운영비 시나리오별. cea_model.py 산출.
const SITES = [
  { n: '서산중앙병원', sg: '충남 서산', cases: 1099, qaly: 327, icer: { low: -11.5, base: 22.2, high: 62.6 } },
  { n: '해남종합병원', sg: '전남 해남', cases: 855, qaly: 220, icer: { low: -8.4, base: 41.8, high: 102.1 } },
  { n: '서귀포의료원', sg: '제주 서귀포', cases: 371, qaly: 136, icer: { low: -2.6, base: 78.3, high: 175.4 } },
  { n: '거붕백병원', sg: '경남 거제', cases: 345, qaly: 148, icer: { low: -3.8, base: 70.5, high: 159.9 } },
  { n: '태백병원', sg: '강원 태백', cases: 250, qaly: 66, icer: { low: 13.4, base: 179.2, high: 378.5 } },
];
const AGG = { low: -6.3, base: 55.1, high: 128.8 };
const SCEN = [
  { k: 'low', lab: '지역센터급 2.5억/년', note: 'tPA 승격 현실 비용 (혈관조영실 불필요)' },
  { k: 'base', lab: '권역급 14억/년', note: '권역센터 총사업비 + 설립 15억' },
  { k: 'high', lab: '전담팀 30억/년', note: 'EVT 24/7 전담팀 풀코스트' },
];
const WTP = 35;

export default function CeaBeta({ lang }) {
  const [code, setCode] = useState('');
  const [ok, setOk] = useState(false);
  const [err, setErr] = useState(false);
  const [scen, setScen] = useState('low');

  const pool = useMemo(() => {
    const byEr = {};
    STROKE_CANDIDATES.forEach((c) => { byEr[c.er] = (byEr[c.er] || 0) + 1; });
    return { total: STROKE_CANDIDATES.length, tsc: STROKE_CANDIDATES.filter((c) => c.b).length, byEr };
  }, []);

  const card = { background: 'var(--bg-card)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14 };
  const submit = (e) => {
    e.preventDefault();
    if (code.trim() === ACCESS_CODE) { setOk(true); setErr(false); } else { setErr(true); }
  };
  const colOf = (v) => (v < 0 ? '#00ff88' : v <= WTP ? '#8fd6e6' : v <= 50 ? '#ffd60a' : '#ff2d6e');

  if (!ok) {
    return (
      <section style={{ ...card, padding: '20px 22px', marginTop: 16, borderStyle: 'dashed', borderColor: 'rgba(179,136,255,0.35)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>{t('🔒 비용효과분석 · 승격 후보 (CEA)', '🔒 Cost-effectiveness & upgrade candidates', lang)}</span>
          <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '.04em', color: '#b388ff', background: 'rgba(179,136,255,0.14)', border: '1px solid rgba(179,136,255,0.4)', borderRadius: 4, padding: '2px 7px' }}>BETA</span>
        </div>
        <div style={{ fontSize: 12.5, color: '#9a9db0', lineHeight: 1.7, margin: '8px 0 14px', maxWidth: '74ch' }}>
          {t('공백지 병원을 재관류센터로 승격했을 때의 증분 비용효과비(₩/QALY), 전국 승격 후보 풀, 그리고 서산 사례를 담고 있어요. 특정 기관 언급이 있어 검증 전까지는 허가코드가 있는 분에게만 열려 있어요.',
            'Incremental cost-effectiveness (₩/QALY) of upgrading gap-area hospitals, the national candidate pool, and the Seosan case. Names specific institutions — access code required pre-validation.', lang)}
        </div>
        <form onSubmit={submit} style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <input type="password" value={code} onChange={(e) => { setCode(e.target.value); setErr(false); }}
            placeholder={t('허가코드', 'Access code', lang)}
            style={{ background: '#0f0f16', border: `1px solid ${err ? '#ff2d6e' : 'rgba(255,255,255,0.14)'}`, borderRadius: 9, padding: '9px 12px', color: '#e8e8f0', font: 'inherit', fontSize: 13, width: 150, outline: 'none' }} />
          <button type="submit" style={{ border: 0, cursor: 'pointer', font: 'inherit', fontSize: 13, fontWeight: 700, padding: '9px 16px', borderRadius: 9, background: 'linear-gradient(90deg,#b388ff,#00d4ff)', color: '#08080d' }}>
            {t('열기', 'Unlock', lang)}</button>
          {err && <span style={{ fontSize: 12, color: '#ff2d6e' }}>{t('코드가 맞지 않아요.', 'Incorrect code.', lang)}</span>}
        </form>
      </section>
    );
  }

  const s = SCEN.find((x) => x.k === scen);
  return (
    <section style={{ ...card, padding: '20px 22px', marginTop: 16, borderColor: 'rgba(179,136,255,0.3)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>{t('비용효과분석 — 어디부터 승격하면 좋은가', 'Cost-effectiveness — which site first', lang)}</span>
        <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '.04em', color: '#b388ff', background: 'rgba(179,136,255,0.14)', border: '1px solid rgba(179,136,255,0.4)', borderRadius: 4, padding: '2px 7px' }}>BETA</span>
      </div>
      <div style={{ background: 'rgba(255,45,110,0.07)', border: '1px solid rgba(255,45,110,0.22)', borderRadius: 9, padding: '9px 12px', margin: '11px 0 14px', fontSize: 11.5, color: '#e6a9b8', lineHeight: 1.6 }}>
        {t('⚠️ 검증 전 초안입니다. 확률적 민감도분석(PSA) 미완료, mRS 효용값은 국내값 부재로 동아시아 대체값을 씁니다. 특정 기관의 센터 지정을 뜻하지 않는 탐색적 what-if예요.',
          '⚠️ Pre-validation draft. PSA pending; utilities are East-Asian substitutes. Exploratory what-if, not a designation.', lang)}
      </div>

      <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 6 }}>
        {SCEN.map((x) => (
          <button key={x.k} onClick={() => setScen(x.k)} style={{ border: `1px solid ${scen === x.k ? '#b388ff' : 'rgba(255,255,255,0.12)'}`, cursor: 'pointer', font: 'inherit', fontSize: 12, fontWeight: 700, padding: '6px 12px', borderRadius: 8, background: scen === x.k ? 'rgba(179,136,255,0.16)' : 'transparent', color: scen === x.k ? '#d9c4ff' : '#bbbbdd' }}>
            {x.lab}</button>
        ))}
      </div>
      <div style={{ fontSize: 11.5, color: '#7a7a99', marginBottom: 14 }}>{s.note}</div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, minWidth: 460 }}>
          <thead><tr>
            {[t('후보 병원', 'Site', lang), t('지역', 'Area', lang), t('커버 발생/년', 'Cases/yr', lang), t('증분 QALY', 'QALY', lang), 'ICER (M₩/QALY)'].map((h, i) => (
              <th key={i} style={{ textAlign: i > 1 ? 'right' : 'left', padding: '7px 8px', color: '#8888aa', fontSize: 11, fontWeight: 700, borderBottom: '1px solid rgba(255,255,255,0.1)', whiteSpace: 'nowrap' }}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {SITES.map((r, i) => {
              const v = r.icer[scen]; const c = colOf(v);
              return (
                <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '7px 8px', color: '#e8e8f0', fontWeight: 600 }}>{r.n}</td>
                  <td style={{ padding: '7px 8px', color: '#8888aa', fontSize: 11.5 }}>{r.sg}</td>
                  <td style={{ padding: '7px 8px', textAlign: 'right', color: '#bbbbdd', fontVariantNumeric: 'tabular-nums' }}>{r.cases.toLocaleString('ko-KR')}</td>
                  <td style={{ padding: '7px 8px', textAlign: 'right', color: '#bbbbdd', fontVariantNumeric: 'tabular-nums' }}>{r.qaly}</td>
                  <td style={{ padding: '7px 8px', textAlign: 'right' }}>
                    <span style={{ display: 'inline-block', padding: '2px 9px', borderRadius: 20, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: v < 0 ? '#08080d' : c, background: v < 0 ? '#00ff88' : c + '1f' }}>
                      {v < 0 ? `${v}` : v}</span>
                  </td>
                </tr>
              );
            })}
            <tr>
              <td colSpan={4} style={{ padding: '9px 8px', color: '#cdd0dd', fontWeight: 700 }}>{t('5개소 종합', 'All 5 combined', lang)}</td>
              <td style={{ padding: '9px 8px', textAlign: 'right' }}>
                <span style={{ display: 'inline-block', padding: '2px 9px', borderRadius: 20, fontWeight: 800, fontVariantNumeric: 'tabular-nums', color: AGG[scen] < 0 ? '#08080d' : colOf(AGG[scen]), background: AGG[scen] < 0 ? '#00ff88' : colOf(AGG[scen]) + '1f' }}>
                  {AGG[scen]}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <CeaThreshold lang={lang} />

      {/* 서산 케이스 — infrastructure-ready gap */}
      <div style={{ marginTop: 16, background: 'rgba(0,212,255,0.05)', border: '1px solid rgba(0,212,255,0.22)', borderLeft: '3px solid #00d4ff', borderRadius: 10, padding: '15px 17px' }}>
        <div style={{ fontSize: 13.5, fontWeight: 800, color: '#fff' }}>
          {t('사례 — 서산: 인프라는 다 있는데, 인증이 없어서 74분', 'Case — Seosan: infrastructure ready, designation missing', lang)}</div>
        <div style={{ display: 'flex', gap: 22, flexWrap: 'wrap', margin: '11px 0 10px' }}>
          {[
            { v: '74.5' + t('분', 'm', lang), l: t('최근접 인증센터까지', 'to nearest certified centre', lang), c: '#ff2d6e' },
            { v: '2' + t('위', 'nd', lang), l: t('전국 시급도 (251개 중)', 'priority rank of 251', lang), c: '#ff8c42' },
            { v: '349' + t('건', '', lang), l: t('연 기대 허혈성 발생', 'expected cases/yr', lang), c: '#ffd60a' },
            { v: '2' + t('곳', '', lang), l: t('관내 종합병원 (둘 다 CT·MRI)', 'general hospitals, both CT+MRI', lang), c: '#00ff88' },
          ].map((k, i) => (
            <div key={i}>
              <div style={{ fontSize: 19, fontWeight: 800, color: k.c, fontVariantNumeric: 'tabular-nums' }}>{k.v}</div>
              <div style={{ fontSize: 11, color: '#8888aa', marginTop: 1 }}>{k.l}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'grid', gap: 5, margin: '10px 0' }}>
          {[['서산중앙병원', '지역응급의료센터 · CT · MRI'], ['충청남도 서산의료원', '지역응급의료센터 · CT · MRI']].map(([n, d], i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 12, background: 'rgba(0,0,0,0.22)', borderRadius: 7, padding: '7px 11px' }}>
              <span style={{ color: '#e8e8f0', fontWeight: 600 }}>{n}</span>
              <span style={{ color: '#8fd6e6', fontSize: 11.5 }}>{d}</span>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 12, color: '#9a9db0', lineHeight: 1.75, maxWidth: '76ch' }}>
          {t('서산에는 응급의료센터급 종합병원이 둘 있고 CT·MRI도 갖췄어요. 그런데 재관류 뇌졸중센터 인증이 없어서, 환자는 시화(74.5분)나 천안(83분)까지 가야 해요. 병원이 없어서 생긴 공백이 아니라 지정이 없어서 생긴 공백이라, 확충의 병목은 건물이나 장비가 아니라 신경과 인력과 지정 정책이에요. 그래서 이 유형이 가장 싸고 빠른 확충 경로예요.',
            'Seosan has two emergency-centre-level general hospitals with CT and MRI, yet no reperfusion certification — so patients travel 74.5 or 83 minutes. The gap comes from designation, not from missing facilities; the bottleneck is neurology staffing and policy, which makes this the cheapest, fastest expansion route.', lang)}
        </div>
      </div>

      {/* 후보 풀 */}
      <div style={{ marginTop: 14, borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 12 }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: '#cdd0dd', marginBottom: 7 }}>
          {t('전국 승격 후보 풀 (기존 인증센터 82 제외)', 'National candidate pool (excl. 82 existing)', lang)}</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[
            { v: pool.total, l: t('tPA-ready · 응급의료기관+CT', 'tPA-ready', lang), c: '#00d4ff' },
            { v: pool.tsc, l: t('TSC-ready · 지역센터+ · MRI', 'TSC-ready', lang), c: '#b388ff' },
            { v: pool.byEr['권역'] || 0, l: t('권역응급의료센터', 'regional ER centre', lang), c: '#00ff88' },
            { v: pool.byEr['지역센터'] || 0, l: t('지역응급의료센터', 'local ER centre', lang), c: '#ffd60a' },
          ].map((k, i) => (
            <div key={i} style={{ flex: '1 1 120px', background: 'rgba(0,0,0,0.22)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 9, padding: '10px 12px' }}>
              <div style={{ fontSize: 19, fontWeight: 800, color: k.c, fontVariantNumeric: 'tabular-nums' }}>{k.v}</div>
              <div style={{ fontSize: 10.5, color: '#8888aa', marginTop: 2, lineHeight: 1.45 }}>{k.l}</div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 11, color: '#7a7a99', marginTop: 8, lineHeight: 1.6 }}>
          {t('※ 이미 인프라 문턱(응급실·CT, 상위 티어는 MRI)을 넘은 실제 종합병원이에요. 신축이 아니라 승격이 전제라 증분비용이 낮고, 이것이 위 ICER가 대부분 비용절감으로 나오는 구조적 이유예요. 출처: HIRA 병의원·의료장비 2026.6 · 중앙응급의료센터 E-Gen.',
            '※ Real general hospitals already past the infrastructure threshold. Upgrade — not new build — is why incremental cost is low and most ICERs turn cost-saving. Source: HIRA 2026.6, E-Gen.', lang)}
        </div>
      </div>

      <div style={{ fontSize: 11.5, color: '#9a9db0', lineHeight: 1.75, marginTop: 13, maxWidth: '78ch' }}>
        {t('읽는 법 — 지불의사(WTP) 기준 3,500만원/QALY 이하면 비용효과적, 음수면 비용절감(더 싸고 더 효과적)이에요. tPA는 중증장애(mRS 4–5)를 줄여 환자당 5년간 약 1,250만원을 아끼는데(Kim 2020, 국내 11,136명), 승격 비용이 낮을수록 이 절감이 이를 상쇄해요. 그래서 tPA 승격의 현실 비용에서는 대부분 비용절감으로 뒤집혀요. 결론을 좌우하는 건 운영비 가정이고, 최우선지(서산)는 권역급 비용에서도 비용효과적이에요.',
          'Below WTP ₩35M/QALY is cost-effective; negative means cost-saving. tPA averts severe disability (mRS 4–5), saving ~₩12.5M per patient over 5 years (Kim 2020, n=11,136 Korea). At realistic upgrade costs most sites turn cost-saving. Operating cost drives the verdict; the top site stays cost-effective even at regional-centre cost.', lang)}
      </div>
      <div style={{ fontSize: 11, color: '#7a7a99', marginTop: 10, lineHeight: 1.6, borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 10 }}>
        {t('모델 — 의사결정나무(3개월 mRS) + Markov(평생), 지불자 관점, 할인 4.5%(NECA), 운영 10년. 효과는 도달시간 단축 → tPA 시간-편익(Emberson 2014) → mRS 이동(NINDS 1995) → 효용·비용(Kim 2020) 경로로 전달. 후보=응급의료기관+CT 보유 종합병원(기존 인증센터 82 제외). CHEERS 2022 준수 지향.',
          'Model — decision tree (3-month mRS) + Markov (lifetime), payer perspective, 4.5% discount (NECA), 10-year operation. CHEERS 2022.', lang)}
      </div>
    </section>
  );
}
