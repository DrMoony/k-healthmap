import { useState, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { useLang } from '../i18n';
import { STROKE_ACCESS } from '../data/stroke_access';

const t = (ko, en, lang) => (lang === 'ko' ? ko : en);
const fmt = (n) => (n ?? 0).toLocaleString('ko-KR');

// 골든윈도 관점 접근성 심각도 (네온)
const BANDS = [
  { c: '#00ff88', lab: '≤30분' },
  { c: '#ffd60a', lab: '30–60분' },
  { c: '#ff8c42', lab: '60–90분' },
  { c: '#ff2d6e', lab: '>90분' },
];
const NA = '#6a6a88';
const bandOf = (a) => (a == null ? -1 : a <= 30 ? 0 : a <= 60 ? 1 : a <= 90 ? 2 : 3);

export default function StrokeAccessDashboard() {
  const { lang } = useLang();
  const [mode, setMode] = useState('full'); // 'full'(75) | 'reg'(14)
  const [sortK, setSortK] = useState('u');
  const [hover, setHover] = useState(null);
  const wrapRef = useRef(null);

  const { regions, anchors, meta } = STROKE_ACCESS;
  const aKey = mode === 'full' ? 'a' : 'ar';
  const uKey = mode === 'full' ? 'u' : 'ur';
  const nKey = mode === 'full' ? 'nr' : 'nrn';
  const S = mode === 'full' ? meta.full : meta.reg;
  const shownAnchors = mode === 'full' ? anchors : anchors.filter((a) => a.r);

  // projection
  const proj = useMemo(() => {
    const pts = regions.filter((r) => r.x && !r.isl);
    const lo = pts.map((p) => p.x), la = pts.map((p) => p.y);
    const lon0 = Math.min(...lo), lon1 = Math.max(...lo), lat0 = Math.min(...la), lat1 = Math.max(...la);
    const kx = Math.cos(36 * Math.PI / 180);
    const W = 440, H = 560, PAD = 26;
    const sc = Math.min((W - 2 * PAD) / ((lon1 - lon0) * kx), (H - 2 * PAD) / (lat1 - lat0));
    const ox = (W - (lon1 - lon0) * kx * sc) / 2, oy = (H - (lat1 - lat0) * sc) / 2;
    return {
      W, H,
      px: (lon) => ox + (lon - lon0) * kx * sc,
      py: (lat) => oy + (lat1 - lat) * sc,
    };
  }, [regions]);

  const mapRegions = useMemo(
    () => regions.filter((r) => r.x && !r.isl).sort((a, b) => (a[aKey] || 0) - (b[aKey] || 0)),
    [regions, aKey]
  );

  const tableRows = useMemo(() => {
    const arr = regions.filter((r) => !r.isl && r[aKey] != null);
    arr.sort((x, y) => (sortK === 'n' ? x.n.localeCompare(y.n, 'ko') : (y[sortK] || 0) - (x[sortK] || 0)));
    return arr.slice(0, 25);
  }, [regions, sortK, aKey]);

  const card = { background: 'var(--bg-card)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14 };
  const chip = (a) => {
    const b = bandOf(a);
    const col = b < 0 ? NA : BANDS[b].c;
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '2px 8px', borderRadius: 20,
        fontSize: 12, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: col, background: col + '1f' }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: col }} />{a == null ? t('섬', 'is.', lang) : a + t('분', 'm', lang)}
      </span>
    );
  };

  return (
    <div style={{ padding: '4px 0 32px', fontFamily: "'Noto Sans KR'" }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, color: '#fff', margin: '0 0 8px' }}>
        {t('🚑 tPA 접근성 — 골든타임 안에 닿지 못하는 곳', '🚑 tPA Access — Beyond the Golden Window', lang)}
      </h1>
      <div style={{ fontSize: 12, color: '#aaaacc', marginBottom: 18, maxWidth: '80ch', lineHeight: 1.6 }}>
        {t('전국 252개 시군구의 연령표준화 기대 허혈성 뇌졸중 부담 × 인증 뇌졸중센터까지 실도로 도달시간(카카오 길찾기). 수요=KOSIS 주민등록인구 2024 간접표준화 · 앵커=권역심뇌혈관질환센터 14 + 대한뇌졸중학회 인증센터 74.',
          '252 districts: age-standardized ischemic-stroke burden × real drive-time to certified stroke centers (Kakao). Demand = indirect standardization on KOSIS 2024; anchors = 14 regional CVD centers + 74 KSS-certified.', lang)}
      </div>

      {/* mode toggle */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 18, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 12, color: '#8888aa', fontWeight: 700 }}>{t('앵커 기준', 'Anchor set', lang)}</span>
        <div style={{ display: 'inline-flex', background: '#12121a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: 3 }}>
          {[['full', t('전체 인증센터 75', 'All 75', lang)], ['reg', t('권역센터 14', 'Regional 14', lang)]].map(([m, lab]) => (
            <button key={m} onClick={() => setMode(m)} style={{
              border: 0, cursor: 'pointer', font: 'inherit', fontSize: 12.5, fontWeight: 700, padding: '6px 14px', borderRadius: 8,
              background: mode === m ? 'linear-gradient(90deg,#00d4ff,#b388ff)' : 'transparent',
              color: mode === m ? '#08080d' : '#bbbbdd' }}>{lab}</button>
          ))}
        </div>
        <span style={{ fontSize: 11.5, color: '#7a7a99' }}>
          {mode === 'reg'
            ? t('권역심뇌혈관센터 14곳만 있다고 가정한 도달시간', 'Assuming only the 14 regional centers', lang)
            : t('학회 인증센터까지 포함한 실제 접근성', 'Actual access incl. KSS-certified centers', lang)}
        </span>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 18 }}>
        {[
          { lab: t('인증센터(앵커)', 'Anchors', lang), val: mode === 'full' ? meta.n_anchor : meta.n_regional, unit: '', col: '#00d4ff', sub: mode === 'full' ? t('권역 14 + 학회 74', '14 regional + 74 KSS', lang) : t('권역심뇌혈관센터', 'Regional CVD centers', lang) },
          { lab: t('중앙 도달시간', 'Median access', lang), val: S.med, unit: t('분', 'm', lang), col: '#ffd60a', sub: t('평균', 'mean', lang) + ' ' + S.mean + t('분 · 최장', 'm · max', lang) + ' ' + S.max + t('분', 'm', lang) },
          { lab: t('60분 밖 기대발생', 'Cases beyond 60m', lang), val: S.o60_cases, unit: t('건', '', lang), col: '#ff2d6e', sub: t('전체의', '', lang) + ' ' + S.o60_pct + t('% · 골든윈도 밖', '% beyond window', lang) },
          { lab: t('60분 밖 인구', 'Pop. beyond 60m', lang), val: Math.round(S.o60_pop / 10000), unit: t('만', '0k', lang), col: '#ff8c42', sub: S.o60_n + t('개 시군구', ' districts', lang) },
        ].map((k, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            style={{ ...card, padding: '15px 16px' }}>
            <div style={{ fontSize: 11.5, color: '#8888aa', fontWeight: 600 }}>{k.lab}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: k.col, marginTop: 5, lineHeight: 1, fontVariantNumeric: 'tabular-nums', textShadow: `0 0 18px ${k.col}44` }}>
              {fmt(k.val)}<span style={{ fontSize: 14, color: '#bbbbdd', fontWeight: 700 }}> {k.unit}</span>
            </div>
            <div style={{ fontSize: 11.5, color: '#9999bb', marginTop: 7 }}>{k.sub}</div>
          </motion.div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr .9fr', gap: 16, alignItems: 'start' }}>
        {/* MAP */}
        <section style={{ ...card, padding: '16px 18px', position: 'relative' }} ref={wrapRef}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 2 }}>{t('접근성 지도', 'Access Map', lang)}</div>
          <div style={{ fontSize: 11.5, color: '#8888aa', marginBottom: 8 }}>{t('점=시군구(색=도달시간, 크기=기대발생) · 고리=인증센터', 'dots=districts · rings=centers', lang)}</div>
          <svg viewBox={`0 0 ${proj.W} ${proj.H}`} style={{ width: '100%', height: 'auto', display: 'block' }} role="img"
            onMouseLeave={() => setHover(null)}>
            {mapRegions.map((r, i) => {
              const b = bandOf(r[aKey]); const col = b < 0 ? NA : BANDS[b].c;
              return (
                <circle key={i} cx={proj.px(r.x).toFixed(1)} cy={proj.py(r.y).toFixed(1)}
                  r={(3.2 + Math.min(3.2, r.c / 220)).toFixed(1)} fill={col} fillOpacity="0.82"
                  stroke="#0a0a0f" strokeWidth="0.5" style={{ cursor: 'pointer', filter: b >= 2 ? `drop-shadow(0 0 3px ${col})` : 'none' }}
                  onMouseEnter={(e) => setHover({ r, x: e.clientX, y: e.clientY })} />
              );
            })}
            {shownAnchors.map((a, i) => (
              <circle key={'a' + i} cx={proj.px(a.x).toFixed(1)} cy={proj.py(a.y).toFixed(1)} r={a.r ? 5 : 3.6}
                fill={a.r ? '#00d4ff' : 'none'} fillOpacity={a.r ? 0.85 : 0} stroke="#00d4ff" strokeWidth={a.r ? 1.3 : 1.5} />
            ))}
          </svg>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 11, fontSize: 11.5, color: '#bbbbdd', marginTop: 8 }}>
            {BANDS.map((b) => (
              <span key={b.lab} style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: b.c }} />{b.lab}
              </span>
            ))}
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 11, height: 11, borderRadius: '50%', border: '2px solid #00d4ff', boxSizing: 'border-box' }} />{t('인증센터', 'center', lang)}
            </span>
          </div>
          {hover && (
            <div style={{ position: 'fixed', left: hover.x, top: hover.y - 12, transform: 'translate(-50%,-100%)', pointerEvents: 'none',
              background: '#05050a', border: '1px solid rgba(0,212,255,0.4)', borderRadius: 8, padding: '8px 10px', fontSize: 12,
              color: '#e8e8f0', zIndex: 200, whiteSpace: 'nowrap', boxShadow: '0 8px 24px rgba(0,0,0,.5)' }}>
              <b>{hover.r.s} {hover.r.n}</b><br />
              {t('도달', 'access', lang)} <b style={{ color: BANDS[Math.max(0, bandOf(hover.r[aKey]))].c }}>{hover.r[aKey]}{t('분', 'm', lang)}</b>
              {' · '}{hover.r[nKey] || '–'}<br />
              <span style={{ color: '#9999bb' }}>{t('기대발생', 'burden', lang)} {fmt(hover.r.c)}{t('건/년 · 인구', '/yr · pop', lang)} {fmt(hover.r.p)}</span>
            </div>
          )}
        </section>

        {/* TABLE */}
        <section style={{ ...card, padding: '16px 16px' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 2 }}>{t('시급도 순위', 'Priority ranking', lang)}</div>
          <div style={{ fontSize: 11.5, color: '#8888aa', marginBottom: 10 }}>{t('부담 × 30분 초과 지연', 'burden × delay over 30m', lang)}</div>
          <div style={{ maxHeight: 500, overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
              <thead><tr>
                {[[uKey, t('시급도', 'Urgency', lang)], ['n', t('지역', 'District', lang)], [aKey, t('도달', 'Access', lang)], ['c', t('부담', 'Burden', lang)]].map(([k, lab]) => (
                  <th key={k} onClick={() => setSortK(k)} style={{ textAlign: k === 'n' ? 'left' : 'right', padding: '6px 7px', color: sortK === k ? '#00d4ff' : '#8888aa',
                    fontSize: 11, fontWeight: 700, cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.08)', whiteSpace: 'nowrap' }}>{lab}</th>
                ))}
              </tr></thead>
              <tbody>
                {tableRows.map((r, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ textAlign: 'right', padding: '6px 7px', fontWeight: 700, color: '#ffd60a', fontVariantNumeric: 'tabular-nums' }}>{r[uKey] ? fmt(r[uKey]) : '–'}</td>
                    <td style={{ padding: '6px 7px', color: '#e8e8f0' }}>{r.n}<span style={{ color: '#7a7a99', fontSize: 11 }}> {r.s}</span></td>
                    <td style={{ textAlign: 'right', padding: '6px 7px' }}>{chip(r[aKey])}</td>
                    <td style={{ textAlign: 'right', padding: '6px 7px', color: '#bbbbdd', fontVariantNumeric: 'tabular-nums' }}>{fmt(r.c)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* distribution + insight */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
        <section style={{ ...card, padding: '16px 18px' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 12 }}>{t('접근성 심각도 분포', 'Severity distribution', lang)}</div>
          {S.bands.map((n, i) => {
            const mx = Math.max(...S.bands);
            return (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '80px 1fr 46px', gap: 10, alignItems: 'center', marginBottom: 9, fontSize: 12.5 }}>
                <span style={{ color: '#bbbbdd', fontWeight: 600 }}>{BANDS[i].lab}</span>
                <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 6, height: 14, overflow: 'hidden' }}>
                  <div style={{ width: `${Math.max(2, (n / mx) * 100)}%`, height: '100%', background: BANDS[i].c, borderRadius: 6, boxShadow: `0 0 8px ${BANDS[i].c}66` }} />
                </div>
                <span style={{ textAlign: 'right', fontWeight: 700, color: '#e8e8f0', fontVariantNumeric: 'tabular-nums' }}>{n}</span>
              </div>
            );
          })}
        </section>
        <section style={{ ...card, padding: '16px 18px', borderLeft: '3px solid #ff2d6e' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 8 }}>{t('학회 인증센터가 메우는 공백', 'What KSS centers close', lang)}</div>
          <div style={{ fontSize: 13, color: '#cccce0', lineHeight: 1.7 }}>
            {t('권역 14곳만 있다면 60분 밖 기대발생이 ', 'With only 14 regional centers, burden beyond 60 min is ')}
            <b style={{ color: '#ff2d6e' }}>{fmt(meta.reg.o60_cases)}{t('건', '', lang)}({meta.reg.o60_pct}%)</b>
            {t('. 학회 인증센터(TSC 64/SC 10)까지 더하면 ', '. Adding KSS-certified centers cuts it to ')}
            <b style={{ color: '#00ff88' }}>{fmt(meta.full.o60_cases)}{t('건', '', lang)}({meta.full.o60_pct}%)</b>
            {t('로 절반 가까이 줄어요. 즉 학회 인증망이 재관류 접근성의 실질적 뼈대예요. 반대로 여전히 남는 공백(여수·순천·서산·목포·거제·충남 서북부)이 확충 우선순위.',
              ' — nearly halved. The KSS network is the real backbone of reperfusion access; the gaps that remain (Yeosu, Suncheon, Seosan, Mokpo, Geoje, NW Chungnam) are the expansion priorities.', lang)}
          </div>
        </section>
      </div>

      <div style={{ fontSize: 11, color: '#7a7a99', marginTop: 20, lineHeight: 1.7 }}>
        {t('출처 · 인구: KOSIS 주민등록인구 2024 · 발생률: 심뇌혈관질환 발생통계(허혈성 분율 0.76) · 인증센터: 대한뇌졸중학회·권역심뇌혈관질환센터 · 도달시간: 카카오 길찾기(승용차). 한계 · 생태학적 설계, 시군구 행정중심 1점 기준, 병원 전·내 지연 미포함, 도서(울릉) 제외.',
          'Sources · KOSIS 2024; CVD incidence stats (ischemic 0.76); KSS & regional CVD centers; Kakao routing. Ecological design; district-centroid single point; excludes pre/in-hospital delay & islands.', lang)}
      </div>
    </div>
  );
}
