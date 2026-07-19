import { useState, useMemo } from 'react';
import { STROKE_ACCESS } from '../data/stroke_access';

const t = (ko, en, lang) => (lang === 'ko' ? ko : en);
const fmt = (n) => Math.round(n || 0).toLocaleString('ko-KR');
const COVER_KM = 36;      // 60분 ≈ 36km (데이터 캘리브레이션)
const COVER_MIN = 60;
const CAND_MIN = 45;      // 후보 = 도달 45분 초과 공백지
function hav(x1, y1, x2, y2) {
  const R = 6371, p1 = y1 * Math.PI / 180, p2 = y2 * Math.PI / 180, dp = (y2 - y1) * Math.PI / 180, dl = (x2 - x1) * Math.PI / 180;
  const a = Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export default function ExpansionSimulator({ lang, onClose }) {
  const [K, setK] = useState(3);
  const dem = useMemo(() => STROKE_ACCESS.sig.regions.filter((r) => r.x && !r.heli && r.a != null), []);

  const sim = useMemo(() => {
    const cands = dem.filter((r) => r.a > CAND_MIN);
    const covered = new Set();
    const picks = [];
    for (let k = 0; k < K; k++) {
      let best = null, bestGain = -1, bestSet = null;
      for (const c of cands) {
        if (picks.includes(c)) continue;
        let gain = 0; const set = [];
        for (const y of dem) {
          if (y.a <= COVER_MIN) continue;
          const key = y.s + y.n;
          if (covered.has(key)) continue;
          if (hav(c.x, c.y, y.x, y.y) < COVER_KM) { gain += y.c; set.push(key); }
        }
        if (gain > bestGain) { bestGain = gain; best = c; bestSet = set; }
      }
      if (!best || bestGain <= 0) break;
      picks.push(best); bestSet.forEach((s) => covered.add(s));
      best._gain = bestGain;
    }
    const beforeB = dem.filter((r) => r.a > COVER_MIN).reduce((s, r) => s + r.c, 0);
    const beforeP = dem.filter((r) => r.a > COVER_MIN).reduce((s, r) => s + r.p, 0);
    const afterUn = dem.filter((r) => r.a > COVER_MIN && !covered.has(r.s + r.n));
    const afterB = afterUn.reduce((s, r) => s + r.c, 0);
    const afterP = afterUn.reduce((s, r) => s + r.p, 0);
    return { picks, covered, beforeB, afterB, beforeP, afterP };
  }, [K, dem]);

  // mini map projection
  const proj = useMemo(() => {
    const xs = dem.map((r) => r.x), ys = dem.map((r) => r.y);
    const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    const kx = Math.cos(36 * Math.PI / 180), W = 300, H = 380, PAD = 14;
    const sc = Math.min((W - 2 * PAD) / ((x1 - x0) * kx), (H - 2 * PAD) / (y1 - y0));
    const ox = (W - (x1 - x0) * kx * sc) / 2, oy = (H - (y1 - y0) * sc) / 2;
    return { W, H, px: (x) => ox + (x - x0) * kx * sc, py: (y) => oy + (y1 - y) * sc };
  }, [dem]);

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.72)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: '#12121a', border: '1px solid rgba(179,136,255,0.35)', borderRadius: 16, maxWidth: 780, width: '100%', maxHeight: '88vh', overflow: 'auto', padding: '22px 24px', fontFamily: "'Noto Sans KR'", boxShadow: '0 20px 60px rgba(0,0,0,.6)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>{t('🔬 가상 확충 시뮬레이터', '🔬 Expansion what-if simulator', lang)}</div>
            <div style={{ fontSize: 11.5, color: '#8888aa', marginTop: 3 }}>{t('탐색적 what-if 분석 · MCLP 근사(60분≈36km)', 'Exploratory what-if · MCLP approximation', lang)}</div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#bbbbdd', borderRadius: 8, padding: '4px 12px', cursor: 'pointer', fontSize: 13 }}>✕</button>
        </div>

        <div style={{ background: 'rgba(255,45,110,0.08)', border: '1px solid rgba(255,45,110,0.25)', borderRadius: 10, padding: '9px 12px', margin: '14px 0', fontSize: 11.5, color: '#e6a9b8', lineHeight: 1.6 }}>
          {t('⚠️ 정책 제언이 아닌 탐색적 시나리오입니다. 특정 기관·지역의 센터 지정을 의미하지 않으며, 후보는 실제 병원이 아닌 공백 시군구의 중심점(가상 위치 예시)입니다. 커버리지는 직선거리 근사값입니다.',
            '⚠️ Exploratory scenario, not a policy recommendation. Candidates are district centroids (illustrative locations), not actual hospitals; coverage is a straight-line approximation.', lang)}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14, margin: '10px 0 16px' }}>
          <span style={{ fontSize: 13, color: '#bbbbdd', fontWeight: 700 }}>{t('가상 추가 센터 수', 'Hypothetical centres', lang)}</span>
          <input type="range" min={1} max={6} value={K} onChange={(e) => setK(+e.target.value)} style={{ flex: 1, accentColor: '#b388ff' }} />
          <span style={{ fontSize: 20, fontWeight: 800, color: '#b388ff', minWidth: 28, textAlign: 'center' }}>{K}</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 18, alignItems: 'start' }}>
          <svg viewBox={`0 0 ${proj.W} ${proj.H}`} style={{ width: 300, background: '#0b0b12', borderRadius: 10 }}>
            {dem.map((r, i) => {
              const cov = r.a <= COVER_MIN || sim.covered.has(r.s + r.n);
              return <circle key={i} cx={proj.px(r.x).toFixed(1)} cy={proj.py(r.y).toFixed(1)} r={2.2 + Math.min(2.5, r.c / 300)}
                fill={r.a <= COVER_MIN ? '#2f6b4a' : cov ? '#00ff88' : '#ff2d6e'} fillOpacity={cov ? 0.9 : 0.75} />;
            })}
            {sim.picks.map((p, i) => (
              <g key={'p' + i}>
                <circle cx={proj.px(p.x)} cy={proj.py(p.y)} r={COVER_KM * Math.cos(36 * Math.PI / 180) * (proj.px(1) - proj.px(0))} fill="#b388ff" fillOpacity={0.08} stroke="#b388ff" strokeOpacity={0.4} strokeWidth={0.5} />
                <text x={proj.px(p.x)} y={proj.py(p.y) + 4} fontSize={13} textAnchor="middle" fill="#b388ff">★</text>
              </g>
            ))}
          </svg>

          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
              <div style={{ background: 'var(--bg-card)', borderRadius: 10, padding: '12px 14px', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div style={{ fontSize: 11, color: '#8888aa' }}>{t('60분 밖 기대발생', 'Cases beyond 60m', lang)}</div>
                <div style={{ fontSize: 20, fontWeight: 800, marginTop: 4 }}><span style={{ color: '#ff2d6e' }}>{fmt(sim.beforeB)}</span> <span style={{ color: '#8888aa', fontSize: 14 }}>→</span> <span style={{ color: '#00ff88' }}>{fmt(sim.afterB)}</span></div>
                <div style={{ fontSize: 11.5, color: '#00ff88', marginTop: 3 }}>{t('−', '−', lang)}{fmt(sim.beforeB - sim.afterB)}{t('건 커버', ' covered', lang)}</div>
              </div>
              <div style={{ background: 'var(--bg-card)', borderRadius: 10, padding: '12px 14px', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div style={{ fontSize: 11, color: '#8888aa' }}>{t('60분 밖 인구', 'Pop beyond 60m', lang)}</div>
                <div style={{ fontSize: 20, fontWeight: 800, marginTop: 4 }}><span style={{ color: '#ff8c42' }}>{fmt(sim.beforeP / 10000)}</span> <span style={{ color: '#8888aa', fontSize: 14 }}>→</span> <span style={{ color: '#00ff88' }}>{fmt(sim.afterP / 10000)}</span><span style={{ fontSize: 12, color: '#bbbbdd' }}> {t('만', '0k', lang)}</span></div>
                <div style={{ fontSize: 11.5, color: '#00ff88', marginTop: 3 }}>−{fmt((sim.beforeP - sim.afterP) / 10000)}{t('만명 커버', '0k covered', lang)}</div>
              </div>
            </div>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: '#bbbbdd', marginBottom: 8 }}>{t('가상 후보 위치 (커버 부담 순)', 'Hypothetical sites (by burden covered)', lang)}</div>
            <div style={{ display: 'grid', gap: 6 }}>
              {sim.picks.map((p, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, background: 'var(--bg-card)', borderRadius: 8, padding: '7px 11px', border: '1px solid rgba(179,136,255,0.15)' }}>
                  <span style={{ color: '#e8e8f0' }}><span style={{ color: '#b388ff', fontWeight: 700 }}>{i + 1}.</span> {p.s} {p.n} <span style={{ color: '#7a7a99', fontSize: 11 }}>({p.a}{t('분', 'm', lang)})</span></span>
                  <span style={{ color: '#00ff88', fontWeight: 700 }}>+{fmt(p._gain)}{t('건', '', lang)}</span>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 11, color: '#7a7a99', marginTop: 12, lineHeight: 1.6 }}>
              {t('※ (b) 중심점 후보 버전. 다음 단계에서 공백지 실제 종합병원으로 교체 예정. 목적함수=60분 내 미커버 기대발생 최대화(그리디 MCLP).',
                '※ Centroid-candidate version (b); to be replaced with actual hospitals. Objective = greedy MCLP maximizing newly covered burden within 60 min.', lang)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
