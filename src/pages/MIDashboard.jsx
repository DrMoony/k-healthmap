import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MI_KOSIS } from '../data/mi_kosis';
import { useLang } from '../i18n';

const PROVINCES = [
  '서울','부산','대구','인천','광주','대전','울산','세종',
  '경기','강원','충북','충남','전북','전남','경북','경남','제주',
];

const MONTHS = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];
const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const ER_OUTCOMES = ['퇴가','입원','전원','사망'];
const ER_COLORS = ['#00ff88','#4d96ff','#ffd93d','#ff6b6b'];

const DEATH_TIMING_KEYS = ['퇴원 후 30일 이내','31일~90일','91일~180일','181일~365일'];
const DEATH_TIMING_COLORS = ['#ff6b6b','#ff922b','#ffd93d','#4d96ff'];

// KOSIS numeric country codes → names
const OECD_NAMES = {
  '한국':'Korea','이스라엘':'Israel','호주':'Australia',
  '1100':'OECD Avg','1195':'EU27','1225':'Colombia',
  '2020':'Mexico','2030':'Chile','3060':'Latvia',
  '3065':'Costa Rica','3070':'Iceland','4015':'Canada',
  '4025':'Czech Rep.','4045':'Romania','4050':'Finland',
  '4055':'France','4060':'Greece','4070':'Italy',
  '4075':'Japan','4080':'Luxembourg','4100':'Netherlands',
  '4105':'Norway','4110':'Poland','4120':'Portugal',
  '4125':'Slovakia','4135':'Slovenia','4140':'Spain',
  '4165':'Sweden','4170':'Switzerland','4175':'Turkey',
  '4180':'UK','4185':'Hungary','4200':'Denmark',
  '4205':'Estonia','4210':'Germany','4215':'Ireland',
  '4220':'Lithuania','4230':'Belgium','6010':'New Zealand',
  '6060':'USA',
};

// ── Utilities ────────────────────────────────────

function getLatest(obj, preferYear = '2023') {
  if (!obj) return null;
  for (let y = 2024; y >= 2010; y--) {
    const v = obj[String(y)];
    if (v != null) return { year: y, value: v };
  }
  return null;
}

function getVal(obj, year = '2023') {
  if (!obj) return null;
  return obj[year] ?? obj['2022'] ?? obj['2021'] ?? null;
}

// ── Panel ────────────────────────────────────

function Panel({ children, style = {} }) {
  return (
    <div style={{
      background: 'linear-gradient(145deg, #1a1a2e 0%, #12121a 100%)',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: '12px',
      padding: '14px',
      overflow: 'hidden',
      ...style,
    }}>{children}</div>
  );
}

// ── Section Header ────────────────────────────────────

function SectionHeader({ title, source, sourceUrl }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexShrink: 0 }}>
      <span style={{ fontSize: '12px', fontWeight: 700, color: '#e8e8f0' }}>{title}</span>
      {source && (
        <a href={sourceUrl || 'https://kosis.kr/'} target="_blank" rel="noopener noreferrer"
          style={{ fontSize: '9px', color: '#9999bb', textDecoration: 'none' }}>
          📎 {source}
        </a>
      )}
    </div>
  );
}

// ── KPI Card ────────────────────────────────────

function KPICard({ label, value, unit, color = '#ff6b6b', sub }) {
  return (
    <div style={{
      background: 'linear-gradient(145deg, #1a1a2e 0%, #12121a 100%)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '10px',
      padding: '8px 10px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: `linear-gradient(90deg, transparent, ${color}, transparent)`, opacity: 0.6 }} />
      <div style={{ fontSize: '10px', color: '#ccccdd', fontWeight: 500, marginBottom: '3px' }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px' }}>
        <span style={{ fontSize: '18px', fontWeight: 900, fontFamily: "'JetBrains Mono'", color: '#ffffff', textShadow: `0 0 10px ${color}44` }}>
          {value}
        </span>
        <span style={{ fontSize: '10px', color: '#ccccee' }}>{unit}</span>
      </div>
      {sub && <div style={{ fontSize: '9px', color: '#aaaacc', marginTop: '2px' }}>{sub}</div>}
    </div>
  );
}

// ── TrendLine (SVG multi-line chart) ────────────────────────

function TrendLineChart({ title, lines, years, source, valueUnit = '' }) {
  const allVals = lines.flatMap(l => l.data.filter(v => v != null));
  if (allVals.length === 0) return null;
  const minV = Math.min(...allVals) * 0.85;
  const maxV = Math.max(...allVals) * 1.1;
  const w = 300, h = 130, padL = 36, padR = 44, padT = 10, padB = 24;
  const plotW = w - padL - padR;
  const plotH = h - padT - padB;

  function toX(i) { return padL + (i / (years.length - 1)) * plotW; }
  function toY(v) { return padT + plotH - ((v - minV) / (maxV - minV)) * plotH; }

  return (
    <div style={{ width: '100%' }}>
      {title && <SectionHeader title={title} source={source} />}
      <svg width="100%" viewBox={`0 0 ${w} ${h}`} style={{ overflow: 'visible' }}>
        {[0, 0.25, 0.5, 0.75, 1].map((t, i) => {
          const y = padT + plotH * (1 - t);
          const val = minV + t * (maxV - minV);
          return (
            <g key={i}>
              <line x1={padL} y1={y} x2={w - padR} y2={y} stroke="rgba(255,255,255,0.05)" />
              <text x={padL - 4} y={y + 3} textAnchor="end" fill="#9999bb" fontSize="8" fontFamily="'JetBrains Mono'">{val.toFixed(1)}</text>
            </g>
          );
        })}
        {years.map((yr, i) => (
          <text key={yr} x={toX(i)} y={h - 4} textAnchor="middle" fill="#aaaacc" fontSize="7" fontFamily="'JetBrains Mono'">{yr.slice(-2)}</text>
        ))}
        {lines.map((line, li) => {
          const validPts = line.data.map((v, i) => v != null ? { x: toX(i), y: toY(v), v, i } : null).filter(Boolean);
          if (validPts.length < 2) return null;
          const pts = validPts.map(p => `${p.x},${p.y}`).join(' ');
          const last = validPts[validPts.length - 1];
          return (
            <g key={li}>
              <polyline points={pts} fill="none" stroke={line.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              {validPts.map((p, i) => (
                <circle key={i} cx={p.x} cy={p.y} r="2.5" fill={line.color} stroke="#12121a" strokeWidth="1" />
              ))}
              <text x={last.x + 4} y={last.y + 3} fill={line.color} fontSize="9" fontFamily="'JetBrains Mono'" fontWeight="700">
                {last.v}{valueUnit}
              </text>
            </g>
          );
        })}
      </svg>
      <div style={{ display: 'flex', gap: '12px', marginTop: '4px', justifyContent: 'center' }}>
        {lines.map((line, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{ width: '12px', height: '2px', background: line.color, borderRadius: '1px' }} />
            <span style={{ fontSize: '10px', color: '#bbbbdd' }}>{line.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════

export default function MIDashboard({ embedded = false }) {
  const { lang, t } = useLang();
  const [selectedProv, setSelectedProv] = useState(null);

  const PROV_EN = {
    '서울':'Seoul','부산':'Busan','대구':'Daegu','인천':'Incheon',
    '광주':'Gwangju','대전':'Daejeon','울산':'Ulsan','세종':'Sejong',
    '경기':'Gyeonggi','강원':'Gangwon','충북':'Chungbuk','충남':'Chungnam',
    '전북':'Jeonbuk','전남':'Jeonnam','경북':'Gyeongbuk','경남':'Gyeongnam',
    '제주':'Jeju',
  };
  const provName = (name) => lang === 'ko' ? name : (PROV_EN[name] || name);

  // ── KPI values (2023) — province-aware ────────────────
  const kpi = useMemo(() => {
    const yr = '2023';
    const reg = selectedProv || '전체';

    // National-level stats (always available)
    const incidenceTotal = getVal(MI_KOSIS.incidenceRate?.['전체']);
    const casesTotal = getVal(MI_KOSIS.cases?.['전체']);
    const fatality30d = getVal(MI_KOSIS.fatality30d?.['전체']);
    const fatality1yr = getVal(MI_KOSIS.fatality1yr?.['전체']);
    const inhospital = getVal(MI_KOSIS.inhospital30d?.['전체_환자단위']);
    const maleRate = getVal(MI_KOSIS.incidenceRate?.['남자']);
    const femaleRate = getVal(MI_KOSIS.incidenceRate?.['여자']);
    const genderRatio = (maleRate && femaleRate && femaleRate > 0) ? (maleRate / femaleRate).toFixed(1) : '-';

    if (!selectedProv) {
      return { incidenceTotal, casesTotal, fatality30d, fatality1yr, inhospital, genderRatio, maleRate, femaleRate, isProvince: false };
    }

    // Province-level: compute from available regional data
    const erTotal = MI_KOSIS.erResultRegion?.[selectedProv]?.['계']?.B331?.[yr]
      ?? MI_KOSIS.erResultRegion?.[selectedProv]?.['계']?.B331?.['2022'] ?? null;

    // Monthly total for province
    const monthlyTotal = MONTHS.reduce((sum, m) => {
      const v = MI_KOSIS.monthlyRegion?.[m]?.[selectedProv]?.[yr]
        ?? MI_KOSIS.monthlyRegion?.[m]?.[selectedProv]?.['2022'] ?? 0;
      return sum + v;
    }, 0);

    // Death timing total for province
    const deathTotal = MI_KOSIS.deathTimingRegion?.[selectedProv]?.['계']?.['2017'] ?? null;

    // ER death count for province
    const erDeaths = MI_KOSIS.erResultRegion?.[selectedProv]?.['사망']?.B331?.[yr]
      ?? MI_KOSIS.erResultRegion?.[selectedProv]?.['사망']?.B331?.['2022'] ?? null;

    // ER mortality rate for province
    const erMortRate = (erTotal && erDeaths != null && erTotal > 0) ? ((erDeaths / erTotal) * 100).toFixed(1) : null;

    return {
      incidenceTotal: null, // not available per province
      casesTotal: monthlyTotal > 0 ? monthlyTotal : erTotal,
      fatality30d: null, // not available per province
      fatality1yr: null, // not available per province
      inhospital: erMortRate,
      genderRatio: '-',
      maleRate: null,
      femaleRate: null,
      erTotal,
      erDeaths,
      deathTotal,
      isProvince: true,
    };
  }, [selectedProv]);

  // ── ER Result data (always show all provinces, highlight selected) ────────────────
  const erData = useMemo(() => {
    const yr = '2023';
    return PROVINCES.map(prov => {
      const outcomes = ER_OUTCOMES.map(outcome => {
        const val = MI_KOSIS.erResultRegion?.[prov]?.[outcome]?.B331?.[yr]
          ?? MI_KOSIS.erResultRegion?.[prov]?.[outcome]?.B331?.['2022'] ?? 0;
        return val;
      });
      const total = outcomes.reduce((s, v) => s + v, 0);
      return { name: prov, outcomes, total };
    }).filter(d => d.total > 0).sort((a, b) => b.total - a.total);
  }, []);

  // ── Monthly pattern ────────────────
  const monthlyData = useMemo(() => {
    const yr = '2023';
    const reg = selectedProv || '전체';
    return MONTHS.map(m => {
      const v = MI_KOSIS.monthlyRegion?.[m]?.[reg]?.[yr]
        ?? MI_KOSIS.monthlyRegion?.[m]?.[reg]?.['2022'] ?? 0;
      return v;
    });
  }, [selectedProv]);

  // ── Incidence trend years ────────────────
  const incYears = useMemo(() => {
    const d = MI_KOSIS.incidenceRate?.['전체'];
    return d ? Object.keys(d).sort() : [];
  }, []);

  // ── Fatality trend years ────────────────
  const fatYears = useMemo(() => {
    const d = MI_KOSIS.fatality30d?.['전체'];
    return d ? Object.keys(d).sort() : [];
  }, []);

  // ── OECD comparison ────────────────
  const oecdData = useMemo(() => {
    const entries = [];
    const data = MI_KOSIS.oecdMortality;
    if (!data) return [];
    for (const [code, vals] of Object.entries(data)) {
      const d = vals?.['원내입원'];
      if (!d) continue;
      const latest = getLatest(d);
      if (!latest) continue;
      const name = OECD_NAMES[code] || code;
      // Skip OECD avg and EU27 for the chart (keep them as reference)
      if (code === '1100' || code === '1195') continue;
      entries.push({ name, value: latest.value, year: latest.year, code });
    }
    return entries.sort((a, b) => a.value - b.value);
  }, []);

  // ── Death timing ────────────────
  const deathTiming = useMemo(() => {
    const reg = selectedProv || '전체';
    const d = MI_KOSIS.deathTimingRegion?.[reg];
    if (!d) return null;
    return DEATH_TIMING_KEYS.map(k => {
      const v = d[k]?.['2017'] ?? 0;
      return v;
    });
  }, [selectedProv]);

  const deathTimingTotal = deathTiming ? deathTiming.reduce((s, v) => s + v, 0) : 0;

  // ── Incidence type (첫발생 vs 재발생) ────────────────
  const incTypeYears = useMemo(() => {
    const d = MI_KOSIS.incidenceType?.['전체_첫발생'];
    return d ? Object.keys(d).filter(y => parseInt(y) >= 2013).sort() : [];
  }, []);

  // ── Fatality type (첫발생 vs 재발생 치명률) ────────────────
  const fatTypeYears = useMemo(() => {
    const d = MI_KOSIS.fatality30dType?.['전체_첫발생'];
    return d ? Object.keys(d).filter(y => parseInt(y) >= 2013).sort() : [];
  }, []);

  return (
    <div style={{
      position: embedded ? 'relative' : 'fixed',
      top: embedded ? 0 : '56px',
      left: embedded ? undefined : 0,
      right: embedded ? undefined : 0,
      bottom: embedded ? undefined : 0,
      height: embedded ? 'calc(100vh - 160px)' : undefined,
      background: '#0a0a0f',
      display: 'grid',
      gridTemplateColumns: '280px 1fr 1fr',
      gridTemplateRows: '1fr',
      gap: '12px',
      padding: '12px',
      fontFamily: "'Noto Sans KR', sans-serif",
      overflow: 'hidden',
    }}>

      {/* ═══════ COLUMN 1: KPIs + Province Selector + 첫발생/재발생 ═══════ */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflow: 'auto' }}>
        {/* Title */}
        <div style={{ padding: '4px 0' }}>
          <div style={{ fontSize: '16px', fontWeight: 900, color: '#ff6b6b' }}>
            {t('급성 심근경색 대시보드','Acute MI Dashboard')}
          </div>
          <div style={{ fontSize: '10px', color: '#9999bb' }}>KOSIS {t('심뇌혈관질환통계','CVD Statistics')} 2023</div>
          {selectedProv && (
            <div style={{ marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#ff922b', background: 'rgba(255,147,43,0.12)', padding: '2px 8px', borderRadius: '4px' }}>
                📍 {provName(selectedProv)}
              </span>
              <button onClick={() => setSelectedProv(null)} style={{
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                color: '#bbbbdd', cursor: 'pointer', fontSize: '10px', borderRadius: '4px', padding: '2px 6px',
              }}>↩ {t('전국','National')}</button>
            </div>
          )}
        </div>

        {/* 6 KPI Cards — province-aware */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
          {kpi.isProvince ? (
            <>
              <KPICard label={t('ER 환자수','ER Patients')} value={kpi.erTotal?.toLocaleString() ?? '-'} unit={t('명','')} color="#ff6b6b" sub="2023" />
              <KPICard label={t('월별 합계','Annual Total')} value={kpi.casesTotal?.toLocaleString() ?? '-'} unit={t('명','')} color="#ff922b" sub="2023" />
              <KPICard label={t('ER 사망','ER Deaths')} value={kpi.erDeaths?.toLocaleString() ?? '-'} unit={t('명','')} color="#ffd93d" sub="2023" />
              <KPICard label={t('ER 사망률','ER Mortality')} value={kpi.inhospital ?? '-'} unit="%" color="#ff922b" sub={t('응급실 기준','ER-based')} />
              <KPICard label={t('퇴원후 사망','Post-DC Death')} value={kpi.deathTotal?.toLocaleString() ?? '-'} unit={t('명','')} color="#ff6b6b" sub="2017" />
              <KPICard label={t('발생률','Incidence')} value="-" unit="" color="#4d96ff" sub={t('시도별 미제공','Not avail. by prov.')} />
            </>
          ) : (
            <>
              <KPICard label={t('발생률','Incidence')} value={kpi.incidenceTotal} unit="/10만" color="#ff6b6b" sub="2023" />
              <KPICard label={t('환자수','Cases')} value={kpi.casesTotal?.toLocaleString()} unit={t('명','')} color="#ff922b" sub="2023" />
              <KPICard label={t('30일 치명률','30d CFR')} value={kpi.fatality30d} unit="%" color="#ffd93d" sub="2023" />
              <KPICard label={t('1년 치명률','1yr CFR')} value={kpi.fatality1yr} unit="%" color="#ff922b" sub="2023" />
              <KPICard label={t('원내 30일 사망률','In-hosp 30d')} value={kpi.inhospital} unit="%" color="#ff6b6b" sub={t('환자단위','Patient-based')} />
              <KPICard label={t('남녀비','M:F Ratio')} value={kpi.genderRatio} unit=":1" color="#4d96ff" sub={`M ${kpi.maleRate} / F ${kpi.femaleRate}`} />
            </>
          )}
        </div>

        {/* Province Selector */}
        <Panel style={{ flexShrink: 0 }}>
          <div style={{ fontSize: '11px', color: '#bbbbdd', marginBottom: '6px', fontWeight: 600 }}>
            {t('시도 선택','Province')}
          </div>
          <select
            value={selectedProv || ''}
            onChange={(e) => setSelectedProv(e.target.value || null)}
            style={{
              width: '100%', padding: '8px 10px', borderRadius: '8px',
              background: '#12121a', border: '1px solid rgba(255,107,107,0.3)',
              color: '#e8e8f0', fontSize: '12px', fontFamily: "'Noto Sans KR'",
              cursor: 'pointer', outline: 'none',
            }}
          >
            <option value="">{t('전체 (전국)','All (National)')}</option>
            {PROVINCES.map(p => (
              <option key={p} value={p}>{provName(p)}</option>
            ))}
          </select>
          {selectedProv && (
            <div style={{ marginTop: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#ff922b', fontWeight: 700, fontSize: '13px' }}>{provName(selectedProv)}</span>
              <button onClick={() => setSelectedProv(null)} style={{
                background: 'none', border: 'none', color: '#bbbbdd', cursor: 'pointer', fontSize: '11px',
              }}>✕ {t('초기화','Reset')}</button>
            </div>
          )}
        </Panel>

        {/* 첫발생 vs 재발생 발생률 */}
        <Panel style={{ flex: 1, minHeight: '160px' }}>
          <TrendLineChart
            title={t('첫발생 vs 재발생 발생률','First vs Recurrent Incidence')}
            source="KOSIS"
            years={incTypeYears}
            valueUnit=""
            lines={[
              {
                label: t('첫발생','First'),
                color: '#ff6b6b',
                data: incTypeYears.map(y => MI_KOSIS.incidenceType?.['전체_첫발생']?.[y] ?? null),
              },
              {
                label: t('재발생','Recurrent'),
                color: '#ffd93d',
                data: incTypeYears.map(y => MI_KOSIS.incidenceType?.['전체_재발생']?.[y] ?? null),
              },
            ]}
          />
        </Panel>
      </div>

      {/* ═══════ COLUMN 2: ER결과 + 월별 + 퇴원후 사망시점 ═══════ */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflow: 'hidden' }}>

        {/* ER Result by Region — Horizontal stacked bar */}
        <Panel style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <SectionHeader
            title={t('시도별 응급실 결과','ER Result by Province')}
            source="KOSIS 2023"
          />
          <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
            {erData.map((d, idx) => {
              const total = d.total;
              return (
                <div key={d.name} style={{
                  display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '3px', cursor: 'pointer',
                  padding: '1px 2px', borderRadius: '4px',
                  background: d.name === selectedProv ? 'rgba(255,147,43,0.12)' : 'transparent',
                  opacity: selectedProv && d.name !== selectedProv ? 0.4 : 1,
                  transition: 'opacity 0.3s, background 0.3s',
                }}
                  onClick={() => setSelectedProv(prev => prev === d.name ? null : d.name)}>
                  <span style={{
                    width: '36px', fontSize: '10px', textAlign: 'right',
                    color: d.name === selectedProv ? '#ff922b' : '#bbbbdd',
                    fontWeight: d.name === selectedProv ? 700 : 400,
                    flexShrink: 0, fontFamily: "'Noto Sans KR'",
                  }}>{provName(d.name)}</span>
                  <div style={{ flex: 1, display: 'flex', height: '14px', borderRadius: '3px', overflow: 'hidden' }}>
                    {d.outcomes.map((v, i) => {
                      const pct = total > 0 ? (v / total) * 100 : 0;
                      return (
                        <motion.div
                          key={i}
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.5, delay: idx * 0.02 + i * 0.05 }}
                          title={`${ER_OUTCOMES[i]}: ${v.toLocaleString()} (${pct.toFixed(1)}%)`}
                          style={{
                            height: '100%',
                            background: ER_COLORS[i],
                            minWidth: pct > 0 ? '1px' : 0,
                            opacity: 0.8,
                          }}
                        />
                      );
                    })}
                  </div>
                  <span style={{
                    width: '44px', fontSize: '10px', textAlign: 'right',
                    fontFamily: "'JetBrains Mono'", color: '#bbb', flexShrink: 0,
                  }}>
                    {total >= 1000 ? `${(total / 1000).toFixed(1)}k` : total}
                  </span>
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', gap: '10px', marginTop: '6px', justifyContent: 'center', flexShrink: 0 }}>
            {ER_OUTCOMES.map((o, i) => (
              <div key={o} style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: ER_COLORS[i] }} />
                <span style={{ fontSize: '9px', color: '#bbbbdd' }}>{t(o, ['Discharged','Admitted','Transferred','Death'][i])}</span>
              </div>
            ))}
          </div>
        </Panel>

        {/* Monthly Pattern */}
        <Panel style={{ flex: '0 0 auto', minHeight: '160px' }}>
          <SectionHeader
            title={`${t('월별 환자수','Monthly Patients')}${selectedProv ? ` — ${provName(selectedProv)}` : ''}`}
            source="KOSIS"
          />
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '110px' }}>
            {monthlyData.map((v, i) => {
              const max = Math.max(...monthlyData, 1);
              const ratio = v / max;
              const isWinter = i <= 1 || i >= 10; // Dec, Jan, Feb
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                  <span style={{ fontSize: '8px', color: '#bbbbdd', fontFamily: "'JetBrains Mono'", marginBottom: '2px' }}>
                    {v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}
                  </span>
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${ratio * 100}%` }}
                    transition={{ duration: 0.5, delay: i * 0.03 }}
                    style={{
                      width: '100%', minHeight: '2px', borderRadius: '3px 3px 0 0',
                      background: isWinter
                        ? 'linear-gradient(180deg, #ff6b6b, #ff922b)'
                        : 'linear-gradient(180deg, #ffd93d88, #ff922b44)',
                    }}
                  />
                  <span style={{ fontSize: '8px', color: '#aaaacc', marginTop: '3px' }}>
                    {lang === 'ko' ? `${i + 1}월` : MONTH_LABELS[i]}
                  </span>
                </div>
              );
            })}
          </div>
          <div style={{ fontSize: '9px', color: '#ff922b', marginTop: '6px', textAlign: 'center' }}>
            {t('겨울철(12-2월) 심근경색 발생 증가','Higher MI incidence in winter (Dec-Feb)')}
          </div>
        </Panel>

        {/* Death Timing */}
        <Panel style={{ flex: '0 0 auto' }}>
          <SectionHeader
            title={`${t('퇴원 후 사망 시점','Death Timing After Discharge')}${selectedProv ? ` — ${provName(selectedProv)}` : ''}`}
            source="KOSIS 2017"
          />
          {deathTiming && deathTimingTotal > 0 ? (
            <>
              <div style={{ display: 'flex', height: '28px', borderRadius: '6px', overflow: 'hidden' }}>
                {deathTiming.map((v, i) => {
                  const pct = (v / deathTimingTotal) * 100;
                  return (
                    <motion.div
                      key={i}
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.6, delay: i * 0.1 }}
                      title={`${DEATH_TIMING_KEYS[i]}: ${v} (${pct.toFixed(1)}%)`}
                      style={{ background: DEATH_TIMING_COLORS[i], height: '100%', minWidth: pct > 0 ? '2px' : 0 }}
                    />
                  );
                })}
              </div>
              <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
                {deathTiming.map((v, i) => {
                  const pct = deathTimingTotal > 0 ? ((v / deathTimingTotal) * 100).toFixed(1) : 0;
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: DEATH_TIMING_COLORS[i] }} />
                      <span style={{ fontSize: '9px', color: '#ccc' }}>{DEATH_TIMING_KEYS[i]}</span>
                      <span style={{ fontSize: '10px', color: '#fff', fontFamily: "'JetBrains Mono'", fontWeight: 700 }}>{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div style={{ color: '#9999bb', fontSize: '12px', textAlign: 'center', padding: '10px 0' }}>{t('데이터 없음','No data')}</div>
          )}
        </Panel>
      </div>

      {/* ═══════ COLUMN 3: Trends + OECD + 첫발생/재발생 치명률 ═══════ */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflow: 'auto' }}>

        {/* Incidence Trend */}
        <Panel style={{ flex: '0 0 auto', minHeight: '180px' }}>
          <TrendLineChart
            title={t('발생률 추이 (2013-2023)','Incidence Trend (2013-2023)')}
            source="KOSIS"
            years={incYears}
            valueUnit=""
            lines={[
              {
                label: t('전체','Total'),
                color: '#ff6b6b',
                data: incYears.map(y => MI_KOSIS.incidenceRate?.['전체']?.[y] ?? null),
              },
              {
                label: t('남자','Male'),
                color: '#4d96ff',
                data: incYears.map(y => MI_KOSIS.incidenceRate?.['남자']?.[y] ?? null),
              },
              {
                label: t('여자','Female'),
                color: '#ff922b',
                data: incYears.map(y => MI_KOSIS.incidenceRate?.['여자']?.[y] ?? null),
              },
            ]}
          />
        </Panel>

        {/* Fatality Trend (30d + 1yr) */}
        <Panel style={{ flex: '0 0 auto', minHeight: '180px' }}>
          <TrendLineChart
            title={t('치명률 추이 (30일/1년)','Case Fatality Trend (30d/1yr)')}
            source="KOSIS"
            years={fatYears}
            valueUnit="%"
            lines={[
              {
                label: t('30일 전체','30d Total'),
                color: '#ff6b6b',
                data: fatYears.map(y => MI_KOSIS.fatality30d?.['전체']?.[y] ?? null),
              },
              {
                label: t('1년 전체','1yr Total'),
                color: '#ff922b',
                data: fatYears.map(y => MI_KOSIS.fatality1yr?.['전체']?.[y] ?? null),
              },
            ]}
          />
        </Panel>

        {/* OECD Comparison */}
        <Panel style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <SectionHeader
            title={t('OECD 원내 30일 사망률 비교','OECD In-hospital 30d Mortality')}
            source="KOSIS/OECD"
          />
          <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
            {oecdData.map((d, idx) => {
              const maxVal = oecdData.length > 0 ? Math.max(...oecdData.map(x => x.value)) : 1;
              const ratio = maxVal > 0 ? d.value / maxVal : 0;
              const isKorea = d.code === '한국';
              return (
                <div key={d.code} style={{
                  display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px',
                  padding: '0 2px', borderRadius: '4px',
                  background: isKorea ? 'rgba(255,107,107,0.1)' : 'transparent',
                }}>
                  <span style={{
                    width: '64px', fontSize: '9px', textAlign: 'right',
                    color: isKorea ? '#ff6b6b' : '#bbbbdd',
                    fontWeight: isKorea ? 800 : 400,
                    flexShrink: 0,
                  }}>{d.name}</span>
                  <div style={{ flex: 1, position: 'relative', height: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '3px' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${ratio * 100}%` }}
                      transition={{ duration: 0.5, delay: idx * 0.015 }}
                      style={{
                        height: '100%', borderRadius: '3px',
                        background: isKorea
                          ? 'linear-gradient(90deg, #ff6b6b, #ff922b)'
                          : 'linear-gradient(90deg, rgba(255,255,255,0.1), rgba(255,255,255,0.2))',
                      }}
                    />
                  </div>
                  <span style={{
                    width: '36px', fontSize: '9px', textAlign: 'right',
                    fontFamily: "'JetBrains Mono'",
                    color: isKorea ? '#ff6b6b' : '#bbb',
                    fontWeight: isKorea ? 800 : 500,
                    flexShrink: 0,
                  }}>{d.value}%</span>
                </div>
              );
            })}
          </div>
        </Panel>

        {/* 첫발생 vs 재발생 치명률 */}
        <Panel style={{ flex: '0 0 auto', minHeight: '160px' }}>
          <TrendLineChart
            title={t('첫발생 vs 재발생 30일 치명률','First vs Recurrent 30d CFR')}
            source="KOSIS"
            years={fatTypeYears}
            valueUnit="%"
            lines={[
              {
                label: t('첫발생','First'),
                color: '#ff6b6b',
                data: fatTypeYears.map(y => MI_KOSIS.fatality30dType?.['전체_첫발생']?.[y] ?? null),
              },
              {
                label: t('재발생','Recurrent'),
                color: '#ffd93d',
                data: fatTypeYears.map(y => MI_KOSIS.fatality30dType?.['전체_재발생']?.[y] ?? null),
              },
            ]}
          />
        </Panel>

        {/* Footer */}
        <div style={{
          padding: '4px 8px',
          fontSize: 9,
          color: '#4a4a6a',
          fontFamily: "'JetBrains Mono', monospace",
          borderTop: '1px solid rgba(255,255,255,0.04)',
          flexShrink: 0,
          lineHeight: 1.5,
        }}>
          {t('출처','Source')}: KOSIS {t('심뇌혈관질환통계','Cardiovascular Disease Stats')} (orgId=411), OECD Health at a Glance 2025
        </div>
      </div>
    </div>
  );
}
