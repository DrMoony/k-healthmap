import { useState } from 'react';

const t = (ko, en, lang) => (lang === 'ko' ? ko : en);

// PSA 10,000회 산출 (cea_psa.py). CEAC: WTP(만원) → 비용효과적일 확률(%)
const WTP = [500, 1000, 1500, 2000, 2500, 3000, 3500, 4000, 4500, 5000, 5500, 6000, 6500, 7000, 7500, 8000, 8500, 9000, 9500, 10000];
const CURVES = [
  { k: 'low', lab: '지역센터 2.5억', c: '#00ff88',
    p: [97.5, 98.7, 99.2, 99.5, 99.6, 99.8, 99.9, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100] },
  { k: 'care24', lab: '24시간체계 5억', c: '#00d4ff',
    p: [67.9, 75.9, 81.9, 86.7, 90.1, 92.8, 94.9, 96.2, 97.4, 98.0, 98.6, 99.0, 99.2, 99.3, 99.5, 99.6, 99.6, 99.7, 99.8, 99.8] },
  { k: 'regional', lab: '권역 12억', c: '#ff8c42',
    p: [3.9, 6.0, 8.9, 12.2, 15.9, 20.7, 25.8, 31.6, 37.5, 43.2, 48.9, 53.7, 59.0, 63.7, 68.5, 72.4, 76.0, 78.8, 81.6, 84.1] },
];
const QALY = { mean: 472, lo: 223, hi: 827 };
const SITE_Q = [
  { n: '서산중앙병원', m: 172, lo: 81, hi: 302 },
  { n: '해남종합병원', m: 115, lo: 54, hi: 202 },
  { n: '거붕백병원', m: 78, lo: 37, hi: 136 },
  { n: '서귀포의료원', m: 72, lo: 34, hi: 126 },
  { n: '태백병원', m: 35, lo: 16, hi: 61 },
];
const ICER = [
  { lab: '지역센터 2.5억', m: -27.8, lo: -67.2, hi: 4.6, c: '#00ff88' },
  { lab: '24시간체계 5억', m: -3.4, lo: -45.5, hi: 44.5, c: '#00d4ff' },
  { lab: '권역 12억', m: 63.4, lo: -0.2, hi: 168.9, c: '#ff8c42' },
];
const W = 560, H = 220, PAD = { l: 42, r: 12, t: 12, b: 30 };
const X = (w) => PAD.l + (w - 500) / 9500 * (W - PAD.l - PAD.r);
const Y = (p) => PAD.t + (100 - p) / 100 * (H - PAD.t - PAD.b);

export default function CeaPsa({ lang }) {
  const [hover, setHover] = useState(null);
  const maxQ = 320;

  return (
    <div style={{ marginTop: 18, borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 14 }}>
      <div style={{ fontSize: 13.5, fontWeight: 800, color: '#fff' }}>
        {t('불확실성을 다 넣으면 — 확률적 민감도분석 (PSA)', 'Probabilistic sensitivity analysis', lang)}</div>
      <div style={{ fontSize: 12, color: '#9a9db0', lineHeight: 1.7, margin: '7px 0 14px', maxWidth: '76ch' }}>
        {t('효과·효용·비용·치료비율·운영비를 각각 분포로 두고 10,000번 시뮬레이션했어요. 치료비율은 국내 tPA 실적 10.2% 기준이에요. 아래 곡선은 지불의사(WTP)별로 이 확충이 비용효과적일 확률이에요.',
          'Effect, utility, cost, treatment rate and operating cost were each sampled from distributions over 10,000 runs. The curve shows the probability of cost-effectiveness at each willingness-to-pay.', lang)}
      </div>

      {/* CEAC */}
      <div style={{ overflowX: 'auto' }}>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', minWidth: 420, background: 'rgba(0,0,0,0.22)', borderRadius: 10 }}>
          {[0, 25, 50, 75, 100].map((p) => (
            <g key={p}>
              <line x1={PAD.l} y1={Y(p)} x2={W - PAD.r} y2={Y(p)} stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
              <text x={PAD.l - 7} y={Y(p) + 3.5} fontSize="9" fill="#7a7a99" textAnchor="end">{p}%</text>
            </g>
          ))}
          {[2500, 5000, 7500, 10000].map((w) => (
            <text key={w} x={X(w)} y={H - 10} fontSize="9" fill="#7a7a99" textAnchor="middle">{(w / 1000).toFixed(0)}천만</text>
          ))}
          {/* WTP 기준선 */}
          {[[3700, '3,700만'], [5000, '5,000만']].map(([w, lab]) => (
            <g key={w}>
              <line x1={X(w)} y1={PAD.t} x2={X(w)} y2={H - PAD.b} stroke="#b388ff" strokeWidth="1.4" strokeDasharray="4 3" opacity="0.7" />
              <text x={X(w)} y={PAD.t - 2} fontSize="8.5" fill="#b388ff" textAnchor="middle" fontWeight="700">{lab}</text>
            </g>
          ))}
          {CURVES.map((c) => (
            <polyline key={c.k} fill="none" stroke={c.c} strokeWidth="2.2" strokeLinejoin="round"
              points={WTP.map((w, i) => `${X(w)},${Y(c.p[i])}`).join(' ')} />
          ))}
          {CURVES.map((c) => {
            const i = WTP.indexOf(4000);
            return <circle key={c.k} cx={X(3500)} cy={Y(c.p[i])} r="3.4" fill={c.c} stroke="#0a0a0f" strokeWidth="1" />;
          })}
        </svg>
      </div>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 8, fontSize: 11.5 }}>
        {CURVES.map((c) => (
          <span key={c.k} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#bbbbdd' }}>
            <span style={{ width: 13, height: 3, background: c.c, borderRadius: 2 }} />{c.lab}
            <b style={{ color: c.c }}>{c.p[WTP.indexOf(4000)]}%</b>
          </span>
        ))}
        <span style={{ color: '#7a7a99' }}>{t('← WTP 4,000만 기준', '← at ₩40M', lang)}</span>
      </div>

      {/* QALY 분포 */}
      <div style={{ marginTop: 18 }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: '#cdd0dd', marginBottom: 8 }}>
          {t('센터별 10년 QALY — 평균과 95% 신뢰구간', '10-year QALY by site — mean and 95% CI', lang)}</div>
        <div style={{ display: 'grid', gap: 7 }}>
          {SITE_Q.map((s, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '116px 1fr 108px', gap: 10, alignItems: 'center', fontSize: 12 }}>
              <span style={{ color: '#e8e8f0', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.n}</span>
              <div style={{ position: 'relative', height: 18 }}>
                <div style={{ position: 'absolute', left: `${s.lo / maxQ * 100}%`, width: `${(s.hi - s.lo) / maxQ * 100}%`, top: 6, height: 6, background: 'rgba(0,212,255,0.25)', borderRadius: 3 }} />
                <div style={{ position: 'absolute', left: `${s.m / maxQ * 100}%`, top: 2, width: 3, height: 14, background: '#00d4ff', borderRadius: 2, transform: 'translateX(-1.5px)' }} />
              </div>
              <span style={{ textAlign: 'right', color: '#bbbbdd', fontVariantNumeric: 'tabular-nums', fontSize: 11.5 }}>
                <b style={{ color: '#e8e8f0', fontSize: 12.5 }}>{s.m}</b> [{s.lo}–{s.hi}]</span>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 11.5, color: '#8fd6e6', marginTop: 9, fontWeight: 600 }}>
          {t('5개소 합계', 'All five', lang)} <b style={{ fontSize: 14 }}>{QALY.mean}</b> QALY [{QALY.lo}–{QALY.hi}]
        </div>
      </div>

      {/* ICER 구간 */}
      <div style={{ marginTop: 16 }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: '#cdd0dd', marginBottom: 8 }}>
          {t('종합 ICER (백만원/QALY) — 음수는 비용절감', 'Overall ICER (₩M/QALY) — negative = cost-saving', lang)}</div>
        <div style={{ display: 'grid', gap: 6 }}>
          {ICER.map((r, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '92px 1fr 132px', gap: 10, alignItems: 'center', fontSize: 12 }}>
              <span style={{ color: '#e8e8f0', fontWeight: 600 }}>{r.lab}</span>
              <div style={{ position: 'relative', height: 18, background: 'rgba(255,255,255,0.04)', borderRadius: 4 }}>
                <div style={{ position: 'absolute', left: '43.9%', top: -2, bottom: -2, width: 1.5, background: 'rgba(255,255,255,0.3)' }} />
                <div style={{ position: 'absolute', left: `${(r.lo + 120) / 300 * 100}%`, width: `${(r.hi - r.lo) / 300 * 100}%`, top: 6, height: 6, background: r.c + '44', borderRadius: 3 }} />
                <div style={{ position: 'absolute', left: `${(r.m + 120) / 300 * 100}%`, top: 2, width: 3, height: 14, background: r.c, borderRadius: 2 }} />
              </div>
              <span style={{ textAlign: 'right', color: r.c, fontWeight: 700, fontVariantNumeric: 'tabular-nums', fontSize: 11.5 }}>
                {r.m} [{r.lo} – {r.hi}]</span>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 10.5, color: '#7a7a99', marginTop: 5 }}>{t('세로선 = 0 (비용중립)', 'vertical line = 0', lang)}</div>
      </div>

      <div style={{ fontSize: 11.5, color: '#9a9db0', lineHeight: 1.75, marginTop: 14, maxWidth: '78ch' }}>
        {t('읽는 법 — 지역센터급 지원(2.5억)에서는 거의 모든 시뮬레이션에서 비용효과적이고, 종합 ICER이 음수라 비용절감이에요. 정부가 24시간 진료체계에 배정하는 5억 수준에서도 95.7%로 통상 채택 기준(80%)을 넘어요. 반면 권역센터 총사업비(12억)를 tPA 승격에 얹으면 28%로 근거가 부족한데, 그건 그 예산이 혈전 제거 시술까지 포함한 규모라 그래요. 즉 확충의 비용효과성은 견고하되, 어느 수준의 체계를 지향하느냐가 판정을 가릅니다.',
          'At local-centre funding nearly all runs are cost-effective with a negative ICER (cost-saving). Even at the ₩500M the government allocates for 24-hour care, 95.7% exceeds the conventional 80% adoption threshold. The regional total budget (₩1.2B) covers thrombectomy capability, so applying it to a tPA upgrade drops to 28%.', lang)}</div>
      <div style={{ fontSize: 11, color: '#7a7a99', marginTop: 9, lineHeight: 1.6 }}>
        {t('※ 분포 — 오즈비 로그정규(Saver 2013 95%CI), 효용 베타, 하류 비용절감 감마(평균 952만원, Hong KS 2020), tPA 시행률 베타(10.2%), 잔여여명 삼각(7–13년), 운영비 삼각. 몬테카를로 10,000회, 할인 4.5%, 10년 지평.',
          '※ Distributions — log-normal OR (Saver 2013 CI), beta utilities, gamma downstream savings (₩9.52M, Hong 2020), beta treatment rate (10.2%), triangular life expectancy and operating cost. 10,000 Monte Carlo runs, 4.5% discount, 10-year horizon.', lang)}
      </div>
    </div>
  );
}
