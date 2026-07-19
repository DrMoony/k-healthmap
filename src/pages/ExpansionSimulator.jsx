import { useState, useMemo } from 'react';
import { geoMercator, geoPath } from 'd3';
import { STROKE_ACCESS } from '../data/stroke_access';
import { STROKE_CANDIDATES } from '../data/stroke_candidates';
import { KOREA_SIG_GEO } from '../data/korea_sig_geo';

const t = (ko, en, lang) => (lang === 'ko' ? ko : en);
const fmt = (n) => Math.round(n || 0).toLocaleString('ko-KR');
const COVER_KM = 36;      // 60분 ≈ 36km (데이터 캘리브레이션)
const COVER_MIN = 60;
const CAND_MIN = 45;      // 중심점 후보 = 도달 45분 초과 공백지
function hav(x1, y1, x2, y2) {
  const R = 6371, p1 = y1 * Math.PI / 180, p2 = y2 * Math.PI / 180, dp = (y2 - y1) * Math.PI / 180, dl = (x2 - x1) * Math.PI / 180;
  const a = Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export default function ExpansionSimulator({ lang, onClose }) {
  const [K, setK] = useState(3);
  const [mode, setMode] = useState('a');   // 'c' 중심점 | 'a' tPA-ready | 'b' TSC-ready
  const dem = useMemo(() => STROKE_ACCESS.sig.regions.filter((r) => r.x && !r.heli && r.a != null), []);

  const roadB = (r) => r.c - (r.ci || 0);  // 육지 커버 가능 부담 (도서 제외)
  const roadP = (r) => r.p - (r.pi || 0);

  // 후보 위치 목록 (mode별)
  const cands = useMemo(() => {
    if (mode === 'c') {
      return dem.filter((r) => r.a > CAND_MIN).map((r) => ({
        x: r.x, y: r.y, label: `${r.s} ${r.n}`, sub: t('시군구 중심점', 'district centroid', lang), real: false,
      }));
    }
    let hs = STROKE_CANDIDATES;
    if (mode === 'b') hs = hs.filter((h) => h.b);
    return hs.map((h) => ({
      x: h.x, y: h.y, label: h.n, sub: `${h.s} ${h.sg} · ${h.er}${h.mri ? '·MRI' : ''}`, real: true, sc: h.sc,
    }));
  }, [mode, dem, lang]);

  const sim = useMemo(() => {
    const covered = new Set();
    const picks = [];
    for (let k = 0; k < K; k++) {
      let best = null, bestGain = -1, bestSet = null;
      for (const c of cands) {
        if (picks.some((p) => p.c === c)) continue;
        let gain = 0; const set = [];
        for (const y of dem) {
          if (y.a <= COVER_MIN) continue;
          const key = y.s + y.n;
          if (covered.has(key)) continue;
          if (hav(c.x, c.y, y.x, y.y) < COVER_KM) { gain += roadB(y); set.push(key); }  // 섬 부담 제외
        }
        if (gain > bestGain) { bestGain = gain; best = c; bestSet = set; }
      }
      if (!best || bestGain <= 0) break;
      picks.push({ c: best, gain: bestGain }); bestSet.forEach((s) => covered.add(s));
    }
    const gap = dem.filter((r) => r.a > COVER_MIN);
    const beforeB = gap.reduce((s, r) => s + r.c, 0);
    const beforeP = gap.reduce((s, r) => s + r.p, 0);
    const redB = gap.filter((r) => covered.has(r.s + r.n)).reduce((s, r) => s + roadB(r), 0);
    const redP = gap.filter((r) => covered.has(r.s + r.n)).reduce((s, r) => s + roadP(r), 0);
    return { picks, covered, beforeB, afterB: beforeB - redB, beforeP, afterP: beforeP - redP };
  }, [K, dem, cands]);

  // choropleth projection (fit to sig boundaries, excl. islands)
  const MW = 300, MH = 400;
  const regions = STROKE_ACCESS.sig.regions;
  const { path, project } = useMemo(() => {
    const fit = { type: 'FeatureCollection', features: KOREA_SIG_GEO.features.filter((f) => { const r = f.properties.rid != null ? regions[f.properties.rid] : null; return r && r.x && !r.heli; }) };
    const p = geoMercator().fitExtent([[8, 8], [MW - 8, MH - 8]], fit);
    return { path: geoPath(p), project: p };
  }, [regions]);
  const proj = { W: MW, H: MH };

  const seg = (opts) => (
    <div style={{ display: 'inline-flex', background: '#0d0d14', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 9, padding: 3 }}>
      {opts.map(([v, lab]) => (
        <button key={v} onClick={() => setMode(v)} style={{ border: 0, cursor: 'pointer', font: 'inherit', fontSize: 11.5, fontWeight: 700, padding: '5px 11px', borderRadius: 7,
          background: mode === v ? 'linear-gradient(90deg,#b388ff,#00d4ff)' : 'transparent', color: mode === v ? '#08080d' : '#bbbbdd' }}>{lab}</button>
      ))}
    </div>
  );

  const disc = mode === 'c'
    ? t('⚠️ 후보가 실제 병원이 아닌 공백 시군구의 중심점(가상 예시)입니다. 비교 기준용.', '⚠️ Candidates are gap-district centroids (illustrative), for comparison only.', lang)
    : mode === 'a'
      ? t('⚠️ 후보 = 실제 종합병원 중 응급의료기관 지정 + CT 보유 (tPA-ready, 기존 앵커 제외). 스태핑(신경과·당직)만 갖추면 tPA 가능한 인프라. 특정 기관의 센터 지정을 뜻하지 않는 탐색적 what-if.', '⚠️ Candidates = real general hospitals with an emergency-center designation + CT (tPA-ready, existing anchors excluded). Exploratory what-if, not a designation.', lang)
      : t('⚠️ 후보 = 지역응급의료센터 이상 + CT·MRI 보유 (TSC-ready, EVT 현실성, 앵커 제외). 고역량 인프라만. 탐색적 what-if.', '⚠️ Candidates = regional emergency center or above with CT+MRI (TSC/EVT-ready, anchors excluded). Exploratory what-if.', lang);

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.72)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: '#12121a', border: '1px solid rgba(179,136,255,0.35)', borderRadius: 16, maxWidth: 780, width: '100%', maxHeight: '88vh', overflow: 'auto', padding: '22px 24px', fontFamily: "'Noto Sans KR'", boxShadow: '0 20px 60px rgba(0,0,0,.6)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>{t('🔬 가상 확충 시뮬레이터', '🔬 Expansion what-if simulator', lang)}</div>
            <div style={{ fontSize: 11.5, color: '#8888aa', marginTop: 3 }}>{t('탐색적 what-if · MCLP 근사(60분≈36km)', 'Exploratory what-if · MCLP approximation', lang)}</div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#bbbbdd', borderRadius: 8, padding: '4px 12px', cursor: 'pointer', fontSize: 13 }}>✕</button>
        </div>

        {/* 후보 티어 토글 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '14px 0 4px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: '#8888aa', fontWeight: 700 }}>{t('후보', 'Candidates', lang)}</span>
          {seg([['c', t('중심점(참고)', 'Centroid', lang)], ['a', t('tPA-ready', 'tPA-ready', lang)], ['b', t('TSC-ready', 'TSC-ready', lang)]])}
          <span style={{ fontSize: 11.5, color: '#7a7a99' }}>{cands.length}{t('개 후보', ' sites', lang)}</span>
        </div>

        <div style={{ background: 'rgba(255,45,110,0.08)', border: '1px solid rgba(255,45,110,0.25)', borderRadius: 10, padding: '9px 12px', margin: '10px 0', fontSize: 11.5, color: '#e6a9b8', lineHeight: 1.6 }}>
          {disc}{t(' 커버리지는 직선거리 근사이며, 섬(도서) 부담은 육지 도달 불가라 제외(항공·여객선 대상).', ' Coverage is a straight-line approximation; island burden excluded (needs air/ferry).', lang)}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14, margin: '10px 0 16px' }}>
          <span style={{ fontSize: 13, color: '#bbbbdd', fontWeight: 700 }}>{t('가상 추가 센터 수', 'Hypothetical centres', lang)}</span>
          <input type="range" min={1} max={6} value={K} onChange={(e) => setK(+e.target.value)} style={{ flex: 1, accentColor: '#b388ff' }} />
          <span style={{ fontSize: 20, fontWeight: 800, color: '#b388ff', minWidth: 28, textAlign: 'center' }}>{K}</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 18, alignItems: 'start' }}>
          <svg viewBox={`0 0 ${proj.W} ${proj.H}`} style={{ width: 300, background: '#0b0b12', borderRadius: 10 }}>
            <g>{KOREA_SIG_GEO.features.map((f, i) => {
              const r = f.properties.rid != null ? regions[f.properties.rid] : null;
              let col = '#3a3a4a';
              if (r && r.x && !r.heli) {
                if (r.a == null) col = '#3a3a4a';
                else if (r.a <= COVER_MIN) col = '#26523b';           // 이미 커버
                else if (sim.covered.has(r.s + r.n)) col = '#00ff88'; // 신규 커버
                else col = '#ff2d6e';                                  // 여전히 공백
              }
              return <path key={i} d={path(f)} fill={col} fillOpacity={0.92} stroke="#0a0a0f" strokeWidth={0.3} />;
            })}</g>
            {sim.picks.map((p, i) => { const q = project([p.c.x, p.c.y]); return q ? (
              <text key={'p' + i} x={q[0]} y={q[1] + 5} fontSize={15} textAnchor="middle" fill="#b388ff" style={{ filter: 'drop-shadow(0 0 3px #b388ff)' }}>★</text>
            ) : null; })}
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
            <div style={{ fontSize: 12.5, fontWeight: 700, color: '#bbbbdd', marginBottom: 8 }}>{mode === 'c' ? t('가상 후보 위치 (커버 부담 순)', 'Hypothetical sites (by burden)', lang) : t('선정 병원 (커버 부담 순)', 'Selected hospitals (by burden)', lang)}</div>
            <div style={{ display: 'grid', gap: 6 }}>
              {sim.picks.map((p, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, fontSize: 12.5, background: 'var(--bg-card)', borderRadius: 8, padding: '7px 11px', border: '1px solid rgba(179,136,255,0.15)' }}>
                  <span style={{ color: '#e8e8f0', lineHeight: 1.35 }}><span style={{ color: '#b388ff', fontWeight: 700 }}>{i + 1}.</span> {p.c.sc ? '★ ' : ''}{p.c.label} <span style={{ color: '#7a7a99', fontSize: 11 }}>· {p.c.sub}</span></span>
                  <span style={{ color: '#00ff88', fontWeight: 700, whiteSpace: 'nowrap' }}>+{fmt(p.gain)}{t('건', '', lang)}</span>
                </div>
              ))}
              {sim.picks.length === 0 && <div style={{ fontSize: 12, color: '#7a7a99' }}>{t('커버할 공백이 없어요.', 'No coverable gap.', lang)}</div>}
            </div>
            <div style={{ fontSize: 11, color: '#7a7a99', marginTop: 12, lineHeight: 1.6 }}>
              {mode === 'c'
                ? t('※ 중심점 후보 버전(비교용). tPA-ready/TSC-ready로 바꾸면 실제 병원 후보로.', '※ Centroid version (for comparison). Switch to tPA/TSC-ready for real hospitals.', lang)
                : t('※ 목적함수=60분 내 미커버 기대발생 최대화(그리디 MCLP). ★=상급종합. 출처: HIRA 2026.6 · 중앙응급의료센터 E-Gen.', '※ Objective = greedy MCLP maximizing newly covered burden within 60 min. ★=tertiary. Source: HIRA, E-Gen.', lang)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
