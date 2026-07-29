import { useState, useMemo, useEffect, lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
const ExpansionSimulator = lazy(() => import('./ExpansionSimulator'));
const CeaBeta = lazy(() => import('./CeaBeta'));
const EvidenceMap = lazy(() => import('./EvidenceMap'));
import { geoMercator, geoPath } from 'd3';
import { useLang } from '../i18n';
import { STROKE_ACCESS } from '../data/stroke_access';
import { KOREA_SIG_GEO } from '../data/korea_sig_geo';

const t = (ko, en, lang) => (lang === 'ko' ? ko : en);
const fmt = (n) => (n ?? 0).toLocaleString('ko-KR');
const BANDS = [
  { c: '#00ff88', lab: '≤30분' }, { c: '#ffd60a', lab: '30–60분' },
  { c: '#ff8c42', lab: '60–90분' }, { c: '#ff2d6e', lab: '>90분' },
];
const NA = '#3a3a4a';
const bandOf = (a) => (a == null ? -1 : a <= 30 ? 0 : a <= 60 ? 1 : a <= 90 ? 2 : 3);
const MW = 430, MH = 560;

export default function StrokeAccessDashboard() {
  const { lang } = useLang();
  const [res, setRes] = useState('sig');   // 'sig' | 'emd'
  const [mode, setMode] = useState('full'); // 'reg' | 'desig' | 'full'
  const [sortK, setSortK] = useState('u');
  const [hover, setHover] = useState(null);
  const [emdGeo, setEmdGeo] = useState(null);
  const [loadingEmd, setLoadingEmd] = useState(false);
  const [showSim, setShowSim] = useState(false);
  const [query, setQuery] = useState('');
  const [picked, setPicked] = useState(null);
  const [tab, setTab] = useState('map');   // 'map' | 'analysis' | 'evidence'

  const { anchors, meta } = STROKE_ACCESS;
  const RES = STROKE_ACCESS[res];
  const regions = RES.regions;
  const MODES = { reg: { a: 'ar', u: 'ur', s: 'reg' }, desig: { a: 'ad', u: 'ud', s: 'desig' }, full: { a: 'a', u: 'u', s: 'full' } };
  const M = MODES[mode];
  const aKey = M.a, uKey = M.u;
  const S = RES.meta[M.s];
  const shownAnchors = mode === 'full' ? anchors : mode === 'desig' ? anchors.filter((a) => a.r || a.l) : anchors.filter((a) => a.r);

  useEffect(() => {
    if (res === 'emd' && !emdGeo && !loadingEmd) {
      setLoadingEmd(true);
      import('../data/korea_emd_geo').then((m) => { setEmdGeo(m.KOREA_EMD_GEO); setLoadingEmd(false); });
    }
  }, [res, emdGeo, loadingEmd]);

  useEffect(() => { setPicked(null); setQuery(''); }, [res]);

  const geo = res === 'sig' ? KOREA_SIG_GEO : emdGeo;

  const emdIdx = useMemo(() => {
    if (res !== 'emd') return null;
    const m = new Map(); regions.forEach((r, i) => m.set(r.code, i)); return m;
  }, [res, regions]);
  const regOf = (f) => res === 'sig'
    ? (f.properties.rid != null ? regions[f.properties.rid] : null)
    : (emdIdx && emdIdx.has(f.properties.c) ? regions[emdIdx.get(f.properties.c)] : null);

  const { path, project } = useMemo(() => {
    if (!geo) return { path: null, project: null };
    let fit = geo;
    if (res === 'sig') fit = { type: 'FeatureCollection', features: geo.features.filter((f) => { const r = f.properties.rid != null ? regions[f.properties.rid] : null; return !(r && r.isl); }) };
    const p = geoMercator().fitExtent([[10, 10], [MW - 10, MH - 10]], fit);
    return { path: geoPath(p), project: p };
  }, [geo, res, regions]);

  const mapPaths = useMemo(() => {
    if (!geo || !path) return null;
    const sw = res === 'sig' ? 0.4 : 0.12;
    return geo.features.map((f, i) => {
      const r = regOf(f); const v = r ? r[aKey] : null; const b = bandOf(v);
      const col = r && r.heli ? '#b388ff' : (!r || b < 0 ? NA : BANDS[b].c);
      const sel = r && picked && r === picked;
      return (
        <path key={i} d={path(f)} fill={col} fillOpacity={sel ? 1 : 0.9} stroke={sel ? '#fff' : '#0a0a0f'} strokeWidth={sel ? 1.6 : sw}
          style={{ cursor: r ? 'pointer' : 'default', filter: sel ? `drop-shadow(0 0 5px ${col})` : (b >= 2 ? `drop-shadow(0 0 1.2px ${col})` : 'none') }}
          onClick={r ? () => { setPicked(r); setQuery(res === 'emd' ? `${r.s} ${r.sg || ''} ${r.n}` : `${r.s} ${r.n}`); } : undefined}
          onMouseEnter={r ? (e) => setHover({ r, x: e.clientX, y: e.clientY }) : undefined}
          onMouseMove={r ? (e) => setHover({ r, x: e.clientX, y: e.clientY }) : undefined}
          onMouseLeave={() => setHover(null)} />
      );
    });
  }, [geo, path, aKey, res, picked]); // eslint-disable-line

  const anchorDots = useMemo(() => {
    if (!project) return null;
    return shownAnchors.map((a, i) => {
      const p = project([a.x, a.y]); if (!p) return null;
      return <circle key={i} cx={p[0].toFixed(1)} cy={p[1].toFixed(1)} r={a.r ? 4.4 : 3} fill={a.r ? '#00e5ff' : 'none'}
        fillOpacity={a.r ? 0.95 : 0} stroke="#00e5ff" strokeWidth={a.r ? 1.1 : 1.3} style={{ filter: 'drop-shadow(0 0 3px #00e5ff)' }} />;
    });
  }, [shownAnchors, project]);

  const tableRows = useMemo(() => {
    const arr = regions.filter((r) => r[aKey] != null && !r.isl);
    arr.sort((x, y) => (sortK === 'n' ? x.n.localeCompare(y.n, 'ko') : (y[sortK] || 0) - (x[sortK] || 0)));
    return arr.slice(0, 25);
  }, [regions, sortK, aKey]);

  // 지역 검색 — 현재 해상도 기준. 전국 시급도 순위도 함께 산출.
  const rankMap = useMemo(() => {
    const arr = regions.filter((r) => r[uKey] != null && !r.isl)
      .slice().sort((x, y) => (y[uKey] || 0) - (x[uKey] || 0));
    const m = new Map(); arr.forEach((r, i) => m.set(r, i + 1));
    return { map: m, total: arr.length };
  }, [regions, uKey]);

  const hits = useMemo(() => {
    const q = query.trim().replace(/\s+/g, '');
    if (q.length < 1) return [];
    return regions.filter((r) => {
      const full = res === 'emd' ? `${r.s}${r.sg || ''}${r.n}` : `${r.s}${r.n}`;
      return full.replace(/\s+/g, '').includes(q);
    }).slice(0, 8);
  }, [query, regions, res]);

  const card = { background: 'var(--bg-card)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14 };
  const seg = (val, set, opts) => (
    <div style={{ display: 'inline-flex', background: '#12121a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: 3 }}>
      {opts.map(([v, lab]) => (
        <button key={v} onClick={() => set(v)} style={{ border: 0, cursor: 'pointer', font: 'inherit', fontSize: 12.5, fontWeight: 700, padding: '6px 13px', borderRadius: 8,
          background: val === v ? 'linear-gradient(90deg,#00d4ff,#b388ff)' : 'transparent', color: val === v ? '#08080d' : '#bbbbdd' }}>{lab}</button>
      ))}
    </div>
  );
  const chip = (a) => { const b = bandOf(a); const col = b < 0 ? '#8a8aa0' : BANDS[b].c;
    return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '2px 8px', borderRadius: 20, fontSize: 12, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: col, background: col + '1f' }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: col }} />{a == null ? '–' : a + t('분', 'm', lang)}</span>; };

  const nUnit = regions.length;

  return (
    <div style={{ padding: '4px 0 32px', fontFamily: "'Noto Sans KR'" }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, color: '#fff', margin: '0 0 8px' }}>
        {t('🚑 tPA 접근성 — 골든타임 안에 닿지 못하는 곳', '🚑 tPA Access — Beyond the Golden Window', lang)}
      </h1>
      <div style={{ fontSize: 12, color: '#aaaacc', marginBottom: 16, maxWidth: '80ch', lineHeight: 1.6 }}>
        {t('연령·성별 표준화 기대 허혈성 뇌졸중 부담 × 인증 뇌졸중센터까지 실도로 도달시간(KakaoMap API). 수요=KOSIS 주민등록인구 2024 연령×성별 간접표준화 · 앵커=권역15+지역13+학회인증(82).',
          'Age-standardized ischemic-stroke burden × real drive-time to certified stroke centers (Kakao). Demand=KOSIS 2024 indirect standardization; anchors=15 regional+13 local+KSS (82).', lang)}
      </div>

      {/* two toggles */}
      <div style={{ display: 'flex', gap: 18, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: '#8888aa', fontWeight: 700 }}>{t('해상도', 'Resolution', lang)}</span>
          {seg(res, setRes, [['sig', t('시군구 252', 'District 252', lang)], ['emd', t('읍면동 3,556', 'Dong 3,556', lang)]])}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: '#8888aa', fontWeight: 700 }}>{t('앵커 기준', 'Anchors', lang)}</span>
          {seg(mode, setMode, [['reg', t('권역 15', 'Reg 15', lang)], ['desig', t('+ 지역 28', '+ Local 28', lang)], ['full', t('+ 학회 82', '+ KSS 82', lang)]])}
        </div>
        <button onClick={() => setShowSim(true)} style={{ marginLeft: 'auto', background: 'rgba(179,136,255,0.12)', border: '1px solid rgba(179,136,255,0.4)', color: '#b388ff', borderRadius: 9, padding: '7px 14px', cursor: 'pointer', fontSize: 12.5, fontWeight: 700 }}>
          {t('🔬 가상 확충 시뮬레이터', '🔬 Expansion simulator', lang)}
        </button>
      </div>
      {showSim && <Suspense fallback={null}><ExpansionSimulator lang={lang} onClose={() => setShowSim(false)} /></Suspense>}

      {/* 우리 동네 찾기 — 검색 + 상세 */}
      <section style={{ ...card, padding: '16px 18px', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 14, fontWeight: 800, color: '#fff', whiteSpace: 'nowrap' }}>
            {t('🔎 우리 동네는 어떤가요', '🔎 Look up your area', lang)}</span>
          <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
            <input value={query} onChange={(e) => { setQuery(e.target.value); setPicked(null); }}
              placeholder={res === 'emd' ? t('읍면동 이름 (예: 대산읍, 해남읍)', 'Dong name', lang) : t('시군구 이름 (예: 서산시, 해남군)', 'District name', lang)}
              style={{ width: '100%', background: '#0f0f16', border: '1px solid rgba(255,255,255,0.13)', borderRadius: 9, padding: '9px 12px', color: '#e8e8f0', font: 'inherit', fontSize: 13, outline: 'none' }} />
            {hits.length > 0 && !picked && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, background: '#161620', border: '1px solid rgba(255,255,255,0.14)', borderRadius: 9, zIndex: 30, overflow: 'hidden', boxShadow: '0 12px 32px rgba(0,0,0,.5)' }}>
                {hits.map((r, i) => (
                  <button key={i} onClick={() => { setPicked(r); setQuery(res === 'emd' ? `${r.s} ${r.sg || ''} ${r.n}` : `${r.s} ${r.n}`); }}
                    style={{ display: 'flex', width: '100%', justifyContent: 'space-between', gap: 10, border: 0, borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'transparent', color: '#e8e8f0', font: 'inherit', fontSize: 12.5, padding: '8px 12px', cursor: 'pointer', textAlign: 'left' }}>
                    <span>{res === 'emd' ? `${r.s} ${r.sg || ''} ${r.n}` : `${r.s} ${r.n}`}</span>
                    <span style={{ color: '#8888aa' }}>{r[aKey] == null ? '–' : `${r[aKey]}${t('분', 'm', lang)}`}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          {picked && <button onClick={() => { setPicked(null); setQuery(''); }} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.18)', color: '#bbbbdd', borderRadius: 8, padding: '6px 11px', cursor: 'pointer', fontSize: 12 }}>{t('지우기', 'Clear', lang)}</button>}
        </div>

        {picked && (() => {
          const rk = rankMap.map.get(picked); const b = bandOf(picked[aKey]);
          const pct = rk ? Math.round((rk / rankMap.total) * 100) : null;
          const nm = res === 'sig' ? { a: picked.nr, ad: picked.ndn, ar: picked.nrn }[aKey] : null;
          const rows = [
            ['reg', t('권역 15', 'Regional 15', lang), picked.ar],
            ['desig', t('+ 지역 28', '+ Local 28', lang), picked.ad],
            ['full', t('+ 학회 82', '+ KSS 82', lang), picked.a],
          ];
          return (
            <div style={{ marginTop: 14, borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 14, display: 'grid', gap: 14 }}>
              <div style={{ display: 'flex', gap: 26, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: 11.5, color: '#8888aa', fontWeight: 700 }}>{t('실도로 도달시간', 'Drive-time', lang)}</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 3 }}>
                    <span style={{ fontSize: 30, fontWeight: 800, color: b < 0 ? '#8a8aa0' : BANDS[b].c, fontVariantNumeric: 'tabular-nums' }}>{picked[aKey] ?? '–'}</span>
                    <span style={{ fontSize: 14, color: '#bbbbdd' }}>{t('분', 'min', lang)}</span>
                    {b >= 0 && <span style={{ fontSize: 12, fontWeight: 700, color: BANDS[b].c }}>{BANDS[b].lab}</span>}
                  </div>
                  {nm && <div style={{ fontSize: 11.5, color: '#8888aa', marginTop: 3 }}>→ {nm}</div>}
                  {picked.nr === 1 && <div style={{ fontSize: 11.5, color: '#b388ff', marginTop: 3 }}>🚁 {t('육로 불가 · 항공이송 대상', 'No road access', lang)}</div>}
                </div>
                <div>
                  <div style={{ fontSize: 11.5, color: '#8888aa', fontWeight: 700 }}>{t('연 기대발생', 'Cases/yr', lang)}</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: '#e8e8f0', marginTop: 3, fontVariantNumeric: 'tabular-nums' }}>{fmt(picked.c)}</div>
                  <div style={{ fontSize: 11.5, color: '#8888aa', marginTop: 2 }}>{t('인구', 'pop', lang)} {fmt(picked.p)}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11.5, color: '#8888aa', fontWeight: 700 }}>{t('시급도 전국순위', 'Priority rank', lang)}</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: rk && pct <= 10 ? '#ff2d6e' : '#e8e8f0', marginTop: 3, fontVariantNumeric: 'tabular-nums' }}>
                    {rk ? `${rk}` : '–'}<span style={{ fontSize: 13, color: '#8888aa', fontWeight: 600 }}> / {fmt(rankMap.total)}</span></div>
                  {rk && <div style={{ fontSize: 11.5, color: pct <= 10 ? '#ff2d6e' : '#8888aa', marginTop: 2 }}>{t('상위', 'top', lang)} {pct}%{pct <= 10 ? t(' · 최우선권', ' · highest priority', lang) : ''}</div>}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11.5, color: '#8888aa', fontWeight: 700, marginBottom: 6 }}>{t('어느 인증 단계까지 열려야 닿나요', 'Access by designation tier', lang)}</div>
                <div style={{ display: 'grid', gap: 5 }}>
                  {rows.map(([k, lab, v]) => {
                    const bb = bandOf(v); const col = bb < 0 ? '#8a8aa0' : BANDS[bb].c; const w = v == null ? 0 : Math.min(100, v / 120 * 100);
                    return (
                      <div key={k} style={{ display: 'grid', gridTemplateColumns: '92px 1fr 62px', gap: 10, alignItems: 'center', fontSize: 12 }}>
                        <span style={{ color: mode === k ? '#00d4ff' : '#bbbbdd', fontWeight: mode === k ? 700 : 500 }}>{lab}</span>
                        <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 5, height: 11, overflow: 'hidden' }}>
                          <div style={{ width: `${Math.max(2, w)}%`, height: '100%', background: col, borderRadius: 5 }} /></div>
                        <span style={{ textAlign: 'right', color: col, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{v == null ? '–' : `${v}${t('분', 'm', lang)}`}</span>
                      </div>
                    );
                  })}
                </div>
                <div style={{ fontSize: 11, color: '#7a7a99', marginTop: 7, lineHeight: 1.6 }}>
                  {picked.ar != null && picked.a != null && picked.ar - picked.a >= 15
                    ? t(`국가지정(권역)만으로는 ${picked.ar}분이지만 학회 인증망까지 열면 ${picked.a}분 — 학회망이 이 지역을 실질적으로 떠받쳐요.`,
                        `Regional-only ${picked.ar}m vs ${picked.a}m with the KSS network — the society network carries this area.`, lang)
                    : t('단계별로 도달시간이 크게 줄지 않아요. 이 지역은 어느 망 기준으로도 접근성이 비슷해요.', 'Access changes little across tiers here.', lang)}
                </div>
              </div>
            </div>
          );
        })()}
      </section>

      {/* 탭 */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.09)', flexWrap: 'wrap' }}>
        {[['map', t('🗺️ 지도', '🗺️ Map', lang)],
          ['analysis', t('📊 분석', '📊 Analysis', lang)],
          ['evidence', t('📖 근거와 비용', '📖 Evidence & cost', lang)]].map(([k, lab]) => {
          const on = tab === k;
          return (
            <button key={k} onClick={() => setTab(k)}
              style={{ border: 0, borderBottom: `2px solid ${on ? '#00d4ff' : 'transparent'}`, background: 'transparent',
                cursor: 'pointer', font: 'inherit', fontSize: 13.5, fontWeight: on ? 800 : 600,
                color: on ? '#fff' : '#8888aa', padding: '9px 15px', marginBottom: -1 }}>{lab}</button>
          );
        })}
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 18 }}>
        {[
          { lab: t('분석 단위', 'Units', lang), val: nUnit, unit: res === 'sig' ? t('시군구', 'sig', lang) : t('읍면동', 'dong', lang), col: '#b388ff', sub: res === 'emd' ? t('일부는 시군구 근사', 'some approx.', lang) : t('전국', 'nationwide', lang) },
          { lab: t('중앙 도달시간', 'Median access', lang), val: S.med, unit: t('분', 'm', lang), col: '#ffd60a', sub: t('평균', 'mean', lang) + ' ' + S.mean + t('분 · 최장', 'm · max', lang) + ' ' + S.max + t('분', 'm', lang) },
          { lab: t('60분 밖 기대발생', 'Cases beyond 60m', lang), val: S.o60_cases, unit: t('건', '', lang), col: '#ff2d6e', sub: t('전체의', '', lang) + ' ' + S.o60_pct + t('% · 골든윈도 밖', '% beyond', lang) },
          { lab: t('60분 밖 인구', 'Pop. beyond 60m', lang), val: Math.round(S.o60_pop / 10000), unit: t('만', '0k', lang), col: '#ff8c42', sub: S.o60_n + (res === 'sig' ? t('개 시군구', ' sig', lang) : t('개 읍면동', ' dong', lang)) },
        ].map((k, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} style={{ ...card, padding: '15px 16px' }}>
            <div style={{ fontSize: 11.5, color: '#8888aa', fontWeight: 600 }}>{k.lab}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: k.col, marginTop: 5, lineHeight: 1, fontVariantNumeric: 'tabular-nums', textShadow: `0 0 18px ${k.col}44` }}>
              {fmt(k.val)}<span style={{ fontSize: 14, color: '#bbbbdd', fontWeight: 700 }}> {k.unit}</span></div>
            <div style={{ fontSize: 11.5, color: '#9999bb', marginTop: 7 }}>{k.sub}</div>
          </motion.div>
        ))}
      </div>

      {tab === 'map' && (
      <div style={{ display: 'grid', gridTemplateColumns: '1.05fr .95fr', gap: 16, alignItems: 'start' }}>
        <section style={{ ...card, padding: '16px 18px', position: 'relative' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 2 }}>{t('접근성 지도', 'Access Map', lang)}</div>
          <div style={{ fontSize: 11.5, color: '#8888aa', marginBottom: 8 }}>{res === 'sig' ? t('시군구 색=도달시간 · 청록=인증센터', 'district color=drive-time', lang) : t('읍면동 색=도달시간 · 청록=인증센터', 'dong color=drive-time', lang)}</div>
          {geo ? (
            <svg viewBox={`0 0 ${MW} ${MH}`} style={{ width: '100%', height: 'auto', display: 'block', background: '#0b0b12', borderRadius: 10 }} role="img">
              <g>{mapPaths}</g><g>{anchorDots}</g>
            </svg>
          ) : (
            <div style={{ height: 360, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8888aa', fontSize: 13, background: '#0b0b12', borderRadius: 10 }}>
              {t('읍면동 경계 불러오는 중…', 'Loading dong boundaries…', lang)}
            </div>
          )}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 11, fontSize: 11.5, color: '#bbbbdd', marginTop: 8 }}>
            {BANDS.map((b) => <span key={b.lab} style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><span style={{ width: 10, height: 10, borderRadius: 3, background: b.c }} />{b.lab}</span>)}
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><span style={{ width: 10, height: 10, borderRadius: '50%', background: '#00e5ff', boxShadow: '0 0 4px #00e5ff' }} />{t('인증센터', 'center', lang)}</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><span style={{ width: 10, height: 10, borderRadius: 3, background: '#b388ff' }} />{t('🚁 도서·항공 대상', 'island/air', lang)}</span>
          </div>
          {hover && (
            <div style={{ position: 'fixed', left: hover.x, top: hover.y - 14, transform: 'translate(-50%,-100%)', pointerEvents: 'none', background: '#05050a', border: '1px solid rgba(0,212,255,0.4)', borderRadius: 8, padding: '8px 10px', fontSize: 12, color: '#e8e8f0', zIndex: 200, whiteSpace: 'nowrap', boxShadow: '0 8px 24px rgba(0,0,0,.5)' }}>
              <b>{hover.r.s} {hover.r.sg ? hover.r.sg + ' ' : ''}{hover.r.n}</b><br />
              {hover.r.heli
                ? <b style={{ color: '#b388ff' }}>{t('🚁 도서·항공이송 대상 (육로 불가)', '🚁 island / air-transport (no road)', lang)}</b>
                : <>{t('도달', 'access', lang)} <b style={{ color: hover.r[aKey] == null ? '#8a8aa0' : BANDS[Math.max(0, bandOf(hover.r[aKey]))].c }}>{hover.r.nr === 1 ? t('육로 접근 불가', 'no road', lang) : hover.r[aKey] == null ? '–' : hover.r[aKey] + t('분', 'm', lang)}</b>{hover.r.nr === 1 ? t(' (미수복)', ' (DMZ)', lang) : hover.r.e ? t(' (시군구 근사)', ' (approx)', lang) : ''}</>}<br />
              <span style={{ color: '#9999bb' }}>{t('기대발생', 'burden', lang)} {fmt(hover.r.c)}{t('건/년 · 인구', '/yr · pop', lang)} {fmt(hover.r.p)}</span>
            </div>
          )}
        </section>

        <section style={{ ...card, padding: '16px 16px' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 2 }}>{t('시급도 순위', 'Priority ranking', lang)}</div>
          <div style={{ fontSize: 11.5, color: '#8888aa', marginBottom: 10 }}>{t('부담 × tPA 시간-편익 손실', 'burden × time-benefit loss', lang)}</div>
          <div style={{ maxHeight: 500, overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
              <thead><tr>
                {[[uKey, t('시급도', 'Urg.', lang)], ['n', t('지역', 'Area', lang)], [aKey, t('도달', 'Acc.', lang)], ['c', t('부담', 'Burden', lang)]].map(([k, lab]) => (
                  <th key={k} onClick={() => setSortK(k)} style={{ textAlign: k === 'n' ? 'left' : 'right', padding: '6px 7px', color: sortK === k ? '#00d4ff' : '#8888aa', fontSize: 11, fontWeight: 700, cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.08)', whiteSpace: 'nowrap' }}>{lab}</th>
                ))}
              </tr></thead>
              <tbody>
                {tableRows.map((r, i) => (
                  <tr key={i} onClick={() => { setPicked(r); setQuery(res === 'emd' ? `${r.s} ${r.sg || ''} ${r.n}` : `${r.s} ${r.n}`); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer', background: picked === r ? 'rgba(0,212,255,0.08)' : 'transparent' }}>
                    <td style={{ textAlign: 'right', padding: '6px 7px', fontWeight: 700, color: '#ffd60a', fontVariantNumeric: 'tabular-nums' }}>{r[uKey] ? fmt(r[uKey]) : '–'}</td>
                    <td style={{ padding: '6px 7px', color: '#e8e8f0' }}>{r.n}<span style={{ color: '#7a7a99', fontSize: 11 }}> {r.sg || r.s}</span></td>
                    <td style={{ textAlign: 'right', padding: '6px 7px' }}>{chip(r[aKey])}</td>
                    <td style={{ textAlign: 'right', padding: '6px 7px', color: '#bbbbdd', fontVariantNumeric: 'tabular-nums' }}>{fmt(r.c)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
      )}

      {tab === 'analysis' && (<>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <section style={{ ...card, padding: '16px 18px' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 12 }}>{t('접근성 심각도 분포', 'Severity distribution', lang)}</div>
          {S.bands.map((n, i) => { const mx = Math.max(...S.bands); return (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '80px 1fr 52px', gap: 10, alignItems: 'center', marginBottom: 9, fontSize: 12.5 }}>
              <span style={{ color: '#bbbbdd', fontWeight: 600 }}>{BANDS[i].lab}</span>
              <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 6, height: 14, overflow: 'hidden' }}>
                <div style={{ width: `${Math.max(1, (n / mx) * 100)}%`, height: '100%', background: BANDS[i].c, borderRadius: 6, boxShadow: `0 0 8px ${BANDS[i].c}66` }} /></div>
              <span style={{ textAlign: 'right', fontWeight: 700, color: '#e8e8f0', fontVariantNumeric: 'tabular-nums' }}>{n}</span>
            </div>); })}
        </section>
        <section style={{ ...card, padding: '16px 18px', borderLeft: '3px solid #ff2d6e' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 8 }}>{t('지정 단계별 공백 축소', 'Gap closes by tier', lang)}</div>
          <div style={{ fontSize: 13, color: '#cccce0', lineHeight: 1.7 }}>
            {t('60분 밖 기대발생 — 권역 15곳만 ', 'Burden beyond 60m — 15 regional: ')}
            <b style={{ color: '#ff2d6e' }}>{fmt(RES.meta.reg.o60_cases)}({RES.meta.reg.o60_pct}%)</b>
            {t(', 지역센터까지 ', ', + local: ')}<b style={{ color: '#ffd60a' }}>{fmt(RES.meta.desig.o60_cases)}({RES.meta.desig.o60_pct}%)</b>
            {t(', 학회 인증까지 ', ', + KSS: ')}<b style={{ color: '#00ff88' }}>{fmt(RES.meta.full.o60_cases)}({RES.meta.full.o60_pct}%)</b>
            {t('. 성가롤로 같은 지역센터가 전남 동부를, 학회망이 나머지를 메워요. 끝까지 남는 공백이 진짜 확충 우선순위.', '. Local centers close the SE, KSS the rest; surviving gaps are the true priorities.', lang)}
          </div>
        </section>
      </div>

      {/* 병원전 · 구급 자원 (시도) — response/resource lever */}
      {meta.sido && (
      <section style={{ ...card, padding: '18px 20px', marginTop: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 8 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>{t('병원전 단계 · 구급 자원 (시도)', 'Prehospital & EMS resources (province)', lang)}</div>
          <div style={{ fontSize: 11.5, color: '#7a7a99' }}>{t('소방청 2024 통계연보 · 반응/이송 중앙값', 'NFA 2024 yearbook · medians', lang)}</div>
        </div>
        <div style={{ fontSize: 12.5, color: '#9a9db0', lineHeight: 1.7, margin: '8px 0 15px', maxWidth: '76ch' }}>
          {t('메인 지도가 "인증센터까지 거리" 레버라면, 여기는 "구급 자원" 레버예요. 재미있는 건 — 농촌일수록 인구당 구급차는 오히려 많은데(강원 9.0 vs 서울 2.0대/10만명) 이송시간은 2배예요. 격차를 만드는 건 구급차 수가 아니라 거리라는 뜻이에요. 병원전 반응시간(RT₁)은 시도별로 시급도(U) 계산에 반영했어요.',
            'If the main map is the "distance-to-center" lever, this panel is the "EMS resource" lever. Tellingly, rural provinces have MORE ambulances per capita (Gangwon 9.0 vs Seoul 2.0 per 100k) yet ~2× the transport time — the gap is distance, not vehicle count. Provincial response time (RT₁) is folded into the priority score (U).', lang)}
        </div>
        <div style={{ overflowX: 'auto' }}>
          <div style={{ minWidth: 470 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '58px 60px 1.1fr 1.1fr', gap: 12, fontSize: 11, color: '#7a7a99', fontWeight: 700, paddingBottom: 6, borderBottom: '1px solid rgba(255,255,255,0.09)' }}>
              <span>{t('시도', 'Prov.', lang)}</span>
              <span style={{ textAlign: 'right' }}>{t('반응 분', 'Resp. m', lang)}</span>
              <span>{t('이송(현장→병원) 분', 'Transport min', lang)}</span>
              <span>{t('구급차 / 10만명', 'Ambulances /100k', lang)}</span>
            </div>
            {[...meta.sido].sort((a, b) => b.rt3 - a.rt3).map((sd) => {
              const rt3col = sd.rt3 >= 14 ? '#ff2d6e' : sd.rt3 >= 12 ? '#ff8c42' : '#ffd60a';
              return (
                <div key={sd.name} style={{ display: 'grid', gridTemplateColumns: '58px 60px 1.1fr 1.1fr', gap: 12, alignItems: 'center', padding: '5px 0', fontSize: 12, borderBottom: '1px solid rgba(255,255,255,0.045)' }}>
                  <span style={{ color: '#cdd0dd', fontWeight: 600 }}>{sd.name}</span>
                  <span style={{ textAlign: 'right', color: '#bbbbdd', fontVariantNumeric: 'tabular-nums' }}>{sd.rt1}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <div style={{ flex: 1, background: 'rgba(255,255,255,0.05)', borderRadius: 5, height: 12, overflow: 'hidden' }}>
                      <div style={{ width: `${Math.min(100, sd.rt3 / 16 * 100)}%`, height: '100%', background: rt3col, borderRadius: 5 }} /></div>
                    <span style={{ width: 30, textAlign: 'right', color: rt3col, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{sd.rt3}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <div style={{ flex: 1, background: 'rgba(255,255,255,0.05)', borderRadius: 5, height: 12, overflow: 'hidden' }}>
                      <div style={{ width: `${Math.min(100, (sd.amb || 0) / 9.5 * 100)}%`, height: '100%', background: '#00d4ff', borderRadius: 5, opacity: 0.72 }} /></div>
                    <span style={{ width: 30, textAlign: 'right', color: '#8fd6e6', fontVariantNumeric: 'tabular-nums' }}>{sd.amb ?? '–'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div style={{ fontSize: 11, color: '#7a7a99', marginTop: 11, lineHeight: 1.6 }}>
          {t('※ 반응=신고→현장 근사(출동→현장 중앙값+turnout), 이송=현장→병원 중앙값. 구급차 밀도가 높아도 이송거리가 길면 도달은 불리 — per100k만으로 "자원 충분"으로 읽으면 안 됨. 출처: 소방청 2024 통계연보, KOSIS 구급차현황·주민등록인구.',
            '※ Response ≈ call-to-scene (dispatch-to-scene median + turnout); transport = scene-to-hospital median. High per-capita ambulances don’t offset long transport distances. Source: NFA 2024 yearbook, KOSIS.', lang)}
        </div>
      </section>
      )}

      {/* 모델 검증 */}
      <section style={{ ...card, padding: '18px 20px', marginTop: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>{t('이 모델을 믿어도 되나 — 외부 검증', 'Model validation', lang)}</div>
          <div style={{ fontSize: 11.5, color: '#7a7a99' }}>{t('독립 실측자료 대조', 'against independent data', lang)}</div>
        </div>
        <div style={{ fontSize: 12.5, color: '#9a9db0', lineHeight: 1.7, margin: '7px 0 14px', maxWidth: '78ch' }}>
          {t('수요 추정이 현실과 맞는지 두 가지 독립 자료로 대조했어요. 시군구 발생 통계는 공개되지 않아서, 가장 세밀하게 얻을 수 있는 뇌혈관 사망률(229 시군구)을 대리지표로, 실측 발생률(시도)은 보조로 썼어요.',
            'We checked demand estimates against two independent sources. Small-area incidence is not published, so cerebrovascular mortality (229 districts) serves as proxy, with observed incidence (province) as support.', lang)}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(178px,1fr))', gap: 11 }}>
          {[
            { v: '0.77', lab: t('사망률 대조 R²', 'R² vs mortality', lang), sub: t('229 시군구 · 2024', '229 districts', lang), c: '#00ff88' },
            { v: '±0.003', lab: t('성별 추가 효과', 'sex adjustment', lang), sub: t('연령만 0.773 → 연령×성별 0.770', 'age-only vs age×sex', lang), c: '#8fd6e6' },
            { v: '1.35×', lab: t('연령 제거 후 지역위험', 'residual regional risk', lang), sub: t('충북 133 vs 서울 99 (실측)', 'Chungbuk vs Seoul', lang), c: '#ffd60a' },
            { v: 'r=0.76', lab: t('고령·고위험 중첩', 'age–risk overlap', lang), sub: t('충북·경북·전북 이중고', 'double burden', lang), c: '#ff8c42' },
          ].map((k, i) => (
            <div key={i} style={{ background: 'rgba(0,0,0,0.24)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '12px 14px' }}>
              <div style={{ fontSize: 21, fontWeight: 800, color: k.c, fontVariantNumeric: 'tabular-nums' }}>{k.v}</div>
              <div style={{ fontSize: 12, color: '#cdd0dd', fontWeight: 600, marginTop: 2 }}>{k.lab}</div>
              <div style={{ fontSize: 11, color: '#7a7a99', marginTop: 2, lineHeight: 1.5 }}>{k.sub}</div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 12, color: '#9a9db0', lineHeight: 1.75, marginTop: 13, maxWidth: '78ch' }}>
          {t('읽는 법 — R²=0.77은 높아 보이지만 상당 부분이 연령 착시예요(고령지는 발생도 사망도 함께 높으니까). 그래서 성별을 더해도 값이 거의 안 움직이고(±0.003), 위험인자를 더 넣으면 교차검증에서 오히려 떨어져요(과적합). 대신 실측 발생률로 보면 연령을 걷어내도 지역 위험이 1.35배 남고, 그 위험이 고령지와 겹쳐요 — 충북·경북·전북은 늙었고 동시에 위험도 높은 이중고예요.',
            'Reading it — R² 0.77 is largely an age artifact; adding sex barely moves it (±0.003) and risk factors overfit. Observed incidence shows 1.35× residual regional risk after age removal, concentrated in the same older provinces — a double burden.', lang)}
        </div>
        <div style={{ fontSize: 11, color: '#7a7a99', marginTop: 11, lineHeight: 1.6, borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 10 }}>
          {t('⚠️ 한계 — 검증 타깃이 발생이 아니라 사망이에요(사망=발생×치명률, 그 치명률이 하필 접근성과 얽혀요). 뇌혈관 사망(I60–69)은 뇌경색 39%·출혈 32%·후유증 23%로 구성되고, 뇌경색 단독 사망은 지역 단위로 공표되지 않아요. 시군구 실제 발생은 건강보험 맞춤형 DB라야 가능해요. 출처: KOSIS 사망원인통계 DT_1B34E13(2024) · 질병관리청 심뇌혈관 발생통계 DT_177001_A018(2023).',
            '⚠️ Limitation — the target is mortality, not incidence (mortality = incidence × fatality, and fatality itself relates to access). Cerebrovascular death (I60–69) = 39% infarction / 32% hemorrhage / 23% sequelae; I63-only death is not published sub-nationally. Sources: KOSIS DT_1B34E13 (2024), KDCA DT_177001_A018 (2023).', lang)}
        </div>
      </section>

      </>)}

      {tab === 'evidence' && (<>
      <Suspense fallback={null}><EvidenceMap lang={lang} /></Suspense>

      <Suspense fallback={null}><CeaBeta lang={lang} /></Suspense>

      <section style={{ ...card, padding: '20px 22px', marginTop: 18 }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: '#fff', marginBottom: 12 }}>{t('이 지도를 어떻게 만들었나', 'How this map was built', lang)}</div>
        <div style={{ fontSize: 13.5, color: '#cdd0dd', lineHeight: 1.85, maxWidth: '76ch', display: 'grid', gap: 12 }}>
          <p style={{ margin: 0 }}>{t('이 지도는 두 가지를 곱해서 만들었어요. 하나는 그 지역에 뇌졸중 환자가 한 해에 몇 명이나 생길지(수요), 다른 하나는 그 환자가 골든타임 안에 치료에 닿는지(접근성)예요.',
            'The map multiplies two things: how many stroke patients a district produces per year (demand), and whether they can reach treatment within the golden window (access).', lang)}</p>
          <p style={{ margin: 0 }}>{t('수요는 이렇게 잡았어요. 뇌졸중은 나이가 많을수록, 그리고 같은 나이라도 남성이 더 잘 생기니까, 전국 연령·성별 발생률을 그 동네의 연령·성별 인구 구조에 그대로 입혀서 이 인구라면 몇 건이 나올지를 계산해요(연령×성별 간접표준화).',
            'For demand, stroke rises with age and, at the same age, is higher in men — so we apply nationwide age- and sex-specific incidence rates to each district’s own age×sex population structure, giving an expected count (age×sex indirect standardization).', lang)}</p>
          <p style={{ margin: 0 }}>{t('접근성은 단순한 거리가 아니라 시간이에요. KakaoMap API로 주민센터에서 가장 가까운 인증센터까지 실제 도로 소요시간을 재요. 그런데 tPA(정맥 혈전용해)는 늦으면 그만큼 손해가 아니라, 늦을수록 손해가 가팔라지는 치료예요. 문헌을 보면 발병부터 치료까지 시간이 길어질수록 좋은 결과 확률이 빠르게 떨어지고, 4.5시간을 넘기면 편익이 거의 사라져요(Emberson 2014 등). 그래서 도달시간을 이 시간-편익 곡선에 넣어서 이 지역은 늦어서 얼마나 손해를 보나로 바꿨어요.',
            'Access is time, not mere distance. We measure real road drive-time from each community center to the nearest certified center (KakaoMap API). But tPA is a treatment whose benefit falls off steeply with delay, not linearly — the chance of a good outcome drops fast as onset-to-treatment time grows and all but vanishes past 4.5 hours (Emberson 2014). So we pass drive-time through this time-benefit curve to express how much outcome a district forgoes by being far.', lang)}</p>
          <p style={{ margin: 0 }}>{t('시급도는 이 둘의 곱이에요. 환자가 많고 손해도 큰 곳이 위로 올라와요. 거리와 발생률을 억지로 몇 대 몇으로 섞는 게 아니라, 각자 제 역할로 들어가요. 발생률은 사람 수를 만들고 거리는 한 명당 손해를 만들어서 곱해지는 구조라, 사람이 임의로 정한 가중치가 없어요.',
            'Priority is the product of the two: places with many patients and large forgone benefit rise to the top. Distance and incidence aren’t blended by some arbitrary ratio — each enters where it belongs. Incidence sets the count, distance sets the per-patient loss, and they multiply. No hand-picked weights.', lang)}</p>
          <p style={{ margin: 0, color: '#9a9db0' }}>{t('한 가지 솔직하게 짚을게요. 이건 지역 단위 집계라 개인의 인과를 말하진 못하고, 도달시간도 동네마다 대표점 한 곳을 기준으로 잡았어요. 지도 색으로 보이는 건 "환자→병원" 이송 구간이라, 신고받고 구급차가 오는 반응·현장 시간을 뺀 가장 좋게 봐준 값이에요 — 그래서 실제 접근성은 이보다 나빴으면 나빴지 좋진 않아요(이렇게 봐준 값으로도 골든타임 밖이 나오니 격차는 진짜라는 뜻이고요). 대신 시급도(우선순위) 계산에는 그 병원전 시간을 시도별 실측(반응+현장 약 20분, 소방청 2024)으로 얹어 반영했어요. 정답이라기보다 어디부터 손봐야 할지 우선순위를 잡는 지도로 봐주시면 좋아요.',
            'One honest caveat: this is ecological, so it can’t speak to individual causation, and drive-time uses one representative point per district. The map color shows one leg — patient to hospital — leaving out the 119 response and on-scene time, so it is a best-case read (real access is at least this bad; that the golden window is still missed under generous assumptions means the gap is real). The priority score, though, does add that prehospital time as an empirical province-level constant (response + on-scene ≈ 20 min, NFA 2024). Read it as a map for prioritizing where to act, not as a verdict.', lang)}</p>
          <div style={{ marginTop: 6, padding: '13px 15px', background: 'rgba(0,0,0,0.28)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, fontFamily: "'JetBrains Mono', monospace", fontSize: 12.5, color: '#cdd0dd', lineHeight: 2.1, overflowX: 'auto' }}>
            <div><span style={{ color: '#8888aa' }}>{t('수요(기대발생)', 'Demand', lang)}</span>{'  E = 0.76 · Σ'}<sub>{t('연령·성별', 'age·sex', lang)}</sub>{' ( '}{t('지역인구', 'pop', lang)}{' × '}{t('국가발생률', 'rate', lang)}{' )'}</div>
            <div><span style={{ color: '#8888aa' }}>{t('시급도', 'Priority', lang)}</span>{'  U = E · L(t),  t = T'}<sub>fixed</sub>{' + d'}<span style={{ color: '#7a7a99' }}>{t('   ← 병원전 + 이송', '   ← prehospital + transport', lang)}</span></div>
            <div><span style={{ color: '#8888aa' }}>{t('시간-편익', 'Time-loss', lang)}</span>{'  L(t) = max(0, (T−t)/T),  T = 270'}<span style={{ color: '#7a7a99' }}>{t('분 (Emberson 2014)', 'min (Emberson 2014)', lang)}</span></div>
            <div><span style={{ color: '#8888aa' }}>{'T'}<sub>fixed</sub></span>{t(' = 반응(시도) + 현장 ≈ 20분', ' = response(province) + on-scene ≈ 20m', lang)}<span style={{ color: '#7a7a99' }}>{t('  (소방청 2024) · d = 인증센터 실도로 (KakaoMap API)', '  (NFA 2024) · d = road time to center (KakaoMap API)', lang)}</span></div>
          </div>
        </div>
      </section>
      </>)}

      <div style={{ fontSize: 11, color: '#7a7a99', marginTop: 18, lineHeight: 1.7 }}>
        {t('출처 · 인구: KOSIS 주민등록인구 2024 · 발생률: 심뇌혈관질환 발생통계(허혈성 0.76) · 인증센터: 대한뇌졸중학회·권역/지역심뇌혈관질환센터 · 도달시간: KakaoMap API(승용차) · 경계: KOSTAT 2018. 읍면동 출발점=주민센터 좌표. 한계 · 생태학적 설계. 도달시간은 이송 한 구간만 잰 낙관 하한(병원전 반응·현장 지연 제외 → 참값은 이상, 단방향이라 격차 결론 방어). 섬·미수복 등 육로 불가 지역은 도서·항공(닥터헬기·여객선) 대상으로 분리 표시. 일부 읍면동은 2018 경계와 2024 행정동 차이로 수요 미상.',
          'Sources · KOSIS 2024; CVD incidence (ischemic 0.76); KSS & regional/local centers; KakaoMap API routing; KOSTAT 2018 boundaries. Dong origin=community-center coords. Access is a best-case lower bound (transport leg only; prehospital response/on-scene excluded → true value is worse, one-directional so it defends the gap). No-road areas (islands, DMZ) shown as island/air-transport; some dong lack demand due to 2018–2024 boundary drift.', lang)}
      </div>
    </div>
  );
}
