import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
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
      const col = !r || b < 0 ? NA : BANDS[b].c;
      return (
        <path key={i} d={path(f)} fill={col} fillOpacity={0.9} stroke="#0a0a0f" strokeWidth={sw}
          style={{ cursor: r ? 'pointer' : 'default', filter: b >= 2 ? `drop-shadow(0 0 1.2px ${col})` : 'none' }}
          onMouseEnter={r ? (e) => setHover({ r, x: e.clientX, y: e.clientY }) : undefined}
          onMouseMove={r ? (e) => setHover({ r, x: e.clientX, y: e.clientY }) : undefined}
          onMouseLeave={() => setHover(null)} />
      );
    });
  }, [geo, path, aKey, res]); // eslint-disable-line

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
        {t('연령표준화 기대 허혈성 뇌졸중 부담 × 인증 뇌졸중센터까지 실도로 도달시간(카카오). 수요=KOSIS 주민등록인구 2024 간접표준화 · 앵커=권역14+지역심뇌혈관10+학회인증74(78).',
          'Age-standardized ischemic-stroke burden × real drive-time to certified stroke centers (Kakao). Demand=KOSIS 2024 indirect standardization; anchors=14 regional+10 local+74 KSS (78).', lang)}
      </div>

      {/* two toggles */}
      <div style={{ display: 'flex', gap: 18, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: '#8888aa', fontWeight: 700 }}>{t('해상도', 'Resolution', lang)}</span>
          {seg(res, setRes, [['sig', t('시군구 252', 'District 252', lang)], ['emd', t('읍면동 3,504', 'Dong 3,504', lang)]])}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: '#8888aa', fontWeight: 700 }}>{t('앵커 기준', 'Anchors', lang)}</span>
          {seg(mode, setMode, [['reg', t('권역 14', 'Reg 14', lang)], ['desig', t('+ 지역 24', '+ Local 24', lang)], ['full', t('+ 학회 78', '+ KSS 78', lang)]])}
        </div>
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
          </div>
          {hover && (
            <div style={{ position: 'fixed', left: hover.x, top: hover.y - 14, transform: 'translate(-50%,-100%)', pointerEvents: 'none', background: '#05050a', border: '1px solid rgba(0,212,255,0.4)', borderRadius: 8, padding: '8px 10px', fontSize: 12, color: '#e8e8f0', zIndex: 200, whiteSpace: 'nowrap', boxShadow: '0 8px 24px rgba(0,0,0,.5)' }}>
              <b>{hover.r.s} {hover.r.sg ? hover.r.sg + ' ' : ''}{hover.r.n}</b><br />
              {t('도달', 'access', lang)} <b style={{ color: hover.r[aKey] == null ? '#8a8aa0' : BANDS[Math.max(0, bandOf(hover.r[aKey]))].c }}>{hover.r[aKey] == null ? '–' : hover.r[aKey] + t('분', 'm', lang)}</b>
              {hover.r.e ? t(' (시군구 근사)', ' (approx)', lang) : ''}<br />
              <span style={{ color: '#9999bb' }}>{t('기대발생', 'burden', lang)} {fmt(hover.r.c)}{t('건/년 · 인구', '/yr · pop', lang)} {fmt(hover.r.p)}</span>
            </div>
          )}
        </section>

        <section style={{ ...card, padding: '16px 16px' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 2 }}>{t('시급도 순위', 'Priority ranking', lang)}</div>
          <div style={{ fontSize: 11.5, color: '#8888aa', marginBottom: 10 }}>{t('부담 × 30분 초과 지연', 'burden × delay>30m', lang)}</div>
          <div style={{ maxHeight: 500, overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
              <thead><tr>
                {[[uKey, t('시급도', 'Urg.', lang)], ['n', t('지역', 'Area', lang)], [aKey, t('도달', 'Acc.', lang)], ['c', t('부담', 'Burden', lang)]].map(([k, lab]) => (
                  <th key={k} onClick={() => setSortK(k)} style={{ textAlign: k === 'n' ? 'left' : 'right', padding: '6px 7px', color: sortK === k ? '#00d4ff' : '#8888aa', fontSize: 11, fontWeight: 700, cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.08)', whiteSpace: 'nowrap' }}>{lab}</th>
                ))}
              </tr></thead>
              <tbody>
                {tableRows.map((r, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
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
            {t('60분 밖 기대발생 — 권역 14곳만 ', 'Burden beyond 60m — 14 regional: ')}
            <b style={{ color: '#ff2d6e' }}>{fmt(RES.meta.reg.o60_cases)}({RES.meta.reg.o60_pct}%)</b>
            {t(', 지역센터까지 ', ', + local: ')}<b style={{ color: '#ffd60a' }}>{fmt(RES.meta.desig.o60_cases)}({RES.meta.desig.o60_pct}%)</b>
            {t(', 학회 인증까지 ', ', + KSS: ')}<b style={{ color: '#00ff88' }}>{fmt(RES.meta.full.o60_cases)}({RES.meta.full.o60_pct}%)</b>
            {t('. 성가롤로 같은 지역센터가 전남 동부를, 학회망이 나머지를 메워요. 끝까지 남는 공백이 진짜 확충 우선순위.', '. Local centers close the SE, KSS the rest; surviving gaps are the true priorities.', lang)}
          </div>
        </section>
      </div>

      <div style={{ fontSize: 11, color: '#7a7a99', marginTop: 18, lineHeight: 1.7 }}>
        {t('출처 · 인구: KOSIS 주민등록인구 2024 · 발생률: 심뇌혈관질환 발생통계(허혈성 0.76) · 인증센터: 대한뇌졸중학회·권역/지역심뇌혈관질환센터 · 도달시간: 카카오 길찾기(승용차) · 경계: KOSTAT 2018. 읍면동 출발점=주민센터 좌표. 한계 · 생태학적 설계, 병원 전·내 지연 미포함. 읍면동 중 973곳(경기·제주 등)은 일일 API 한도로 시군구 근사값(쿼터 리셋 후 갱신 예정).',
          'Sources · KOSIS 2024; CVD incidence (ischemic 0.76); KSS & regional/local centers; Kakao routing; KOSTAT 2018 boundaries. Dong origin=community-center coords. 973 dong approximated at district level pending API quota reset.', lang)}
      </div>
    </div>
  );
}
