import { useState } from 'react';
import { useLang } from '../i18n';
import { DISEASE_EPI } from '../data/disease_epi';
import { DM_KOSIS } from '../data/dm_kosis';

const t = (ko, en, lang) => lang === 'ko' ? ko : en;
const dm = DISEASE_EPI.diseases.diabetes;

export default function DiabetesDashboard() {
  const { lang } = useLang();
  const [selectedRegion, setSelectedRegion] = useState(null);

  // Latest KOSIS data
  const latestYear = '2023';
  const admTotal = DM_KOSIS.admission['전체']?.[latestYear];
  const statinTotal = DM_KOSIS.statinRx['전체']?.[latestYear];
  const antihtnTotal = DM_KOSIS.antihtnRx['전체']?.[latestYear];

  // Safe value extraction — prevalence is {value: 15.5}, patients is string, control key differs
  const prevVal = typeof dm.prevalence === 'object' ? dm.prevalence?.value : dm.prevalence;
  const patientsVal = typeof dm.patients === 'string' ? dm.patients.replace(/[^0-9.]/g, '') : dm.patients;
  const controlVal = dm.management?.control_HbA1c_lt_7_0 ?? dm.management?.control;

  const kpiCards = [
    { label: t('유병률', 'Prevalence', lang), value: prevVal, unit: '%', sub: t('30세 이상', '≥30y', lang), color: '#ff6b6b', refUrl: 'https://www.diabetes.or.kr/', refLabel: 'KDA DFS 2024' },
    { label: t('환자수', 'Patients', lang), value: '530', unit: t('만명', '0K', lang), sub: t('30세 이상', '≥30y', lang), color: '#ffd93d', refUrl: 'https://www.diabetes.or.kr/', refLabel: 'KDA DFS 2024' },
    { label: t('인지율', 'Awareness', lang), value: dm.management?.awareness, unit: '%', color: '#6bcb77', refUrl: 'https://www.diabetes.or.kr/', refLabel: 'KDA DFS 2024' },
    { label: t('치료율', 'Treatment', lang), value: dm.management?.treatment, unit: '%', color: '#4d96ff', refUrl: 'https://www.diabetes.or.kr/', refLabel: 'KDA DFS 2024' },
    { label: t('조절률(HbA1c<7%)', 'Control(HbA1c<7%)', lang), value: controlVal, unit: '%', color: '#b388ff', refUrl: 'https://www.diabetes.or.kr/', refLabel: 'KDA DFS 2024' },
    { label: t('입원율', 'Admission', lang), value: admTotal, unit: t('/10만', '/100K', lang), sub: latestYear, color: '#ff922b', refUrl: 'https://kosis.kr/', refLabel: 'KOSIS HIRA' },
    { label: t('스타틴 처방률', 'Statin Rx', lang), value: statinTotal, unit: '%', sub: latestYear, color: '#20c997', refUrl: 'https://kosis.kr/', refLabel: 'KOSIS HIRA' },
    { label: t('항고혈압제', 'Anti-HTN Rx', lang), value: antihtnTotal, unit: '%', sub: latestYear, color: '#e599f7', refUrl: 'https://kosis.kr/', refLabel: 'KOSIS HIRA' },
  ];

  return (
    <div style={{ padding: '76px 24px 24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Title */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#fff', margin: 0, fontFamily: "'Noto Sans KR'" }}>
          {t('🩸 당뇨병 대시보드', '🩸 Diabetes Dashboard', lang)}
        </h1>
        <div style={{ fontSize: '12px', color: '#aaaacc', marginTop: '4px' }}>
          {t('출처: KDA DFS 2024, KOSIS 당뇨병 적정성 평가 2008-2023', 'Source: KDA DFS 2024, KOSIS DM Quality Assessment 2008-2023', lang)}
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
        {kpiCards.map((kpi, i) => (
          <div key={i} style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '12px',
            padding: '16px',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: kpi.color, opacity: 0.6 }} />
            <div style={{ fontSize: '11px', color: '#bbbbdd', marginBottom: '8px' }}>{kpi.label}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
              <span style={{ fontSize: '28px', fontWeight: 800, color: kpi.color, fontFamily: "'JetBrains Mono'" }}>
                {kpi.value ?? '—'}
              </span>
              <span style={{ fontSize: '12px', color: '#aaaacc' }}>{kpi.unit}</span>
            </div>
            {kpi.sub && <div style={{ fontSize: '10px', color: '#9999bb', marginTop: '4px' }}>{kpi.sub}</div>}
            {kpi.refUrl && (
              <a href={kpi.refUrl} target="_blank" rel="noopener noreferrer"
                style={{ fontSize: '8px', color: '#00d4ff88', textDecoration: 'none', marginTop: '2px', display: 'block' }}
                onMouseOver={e => e.target.style.color = '#00d4ff'}
                onMouseOut={e => e.target.style.color = '#00d4ff88'}>
                📎 {kpi.refLabel}
              </a>
            )}
          </div>
        ))}
      </div>

      {/* Two-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {/* Left: Admission Trend */}
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '12px',
          padding: '20px',
        }}>
          <h3 style={{ fontSize: '14px', color: '#fff', margin: '0 0 4px', fontFamily: "'Noto Sans KR'" }}>
            {t('입원율 추이 (인구 10만명당)', 'Admission Rate Trend (per 100K)', lang)}
          </h3>
          <a href="https://kosis.kr/" target="_blank" rel="noopener noreferrer" style={{ fontSize: '8px', color: '#00d4ff66', textDecoration: 'none', display: 'block', marginBottom: '12px' }}>📎 KOSIS HIRA 2008-2023</a>
          <AdmissionChart data={DM_KOSIS.admission} lang={lang} />
        </div>

        {/* Right: Management Cascade */}
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '12px',
          padding: '20px',
        }}>
          <h3 style={{ fontSize: '14px', color: '#fff', margin: '0 0 4px', fontFamily: "'Noto Sans KR'" }}>
            {t('당뇨 관리 캐스케이드', 'Diabetes Management Cascade', lang)}
          </h3>
          <a href="https://www.diabetes.or.kr/" target="_blank" rel="noopener noreferrer" style={{ fontSize: '8px', color: '#00d4ff66', textDecoration: 'none', display: 'block', marginBottom: '12px' }}>📎 KDA DFS 2024</a>
          <CascadeChart dm={dm} lang={lang} />
        </div>

        {/* Left: Amputation Trend */}
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '12px',
          padding: '20px',
        }}>
          <h3 style={{ fontSize: '14px', color: '#fff', margin: '0 0 4px', fontFamily: "'Noto Sans KR'" }}>
            {t('절단율 추이 (대절단 vs 소절단)', 'Amputation Rate (Major vs Minor)', lang)}
          </h3>
          <a href="https://kosis.kr/" target="_blank" rel="noopener noreferrer" style={{ fontSize: '8px', color: '#00d4ff66', textDecoration: 'none', display: 'block', marginBottom: '12px' }}>📎 KOSIS HIRA</a>
          <AmputationChart major={DM_KOSIS.majorAmputation} minor={DM_KOSIS.minorAmputation} lang={lang} />
        </div>

        {/* Right: Statin + Anti-HTN Rx Trend */}
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '12px',
          padding: '20px',
        }}>
          <h3 style={{ fontSize: '14px', color: '#fff', margin: '0 0 4px', fontFamily: "'Noto Sans KR'" }}>
            {t('동반질환 처방률 추이', 'Comorbidity Prescription Trend', lang)}
          </h3>
          <a href="https://kosis.kr/" target="_blank" rel="noopener noreferrer" style={{ fontSize: '8px', color: '#00d4ff66', textDecoration: 'none', display: 'block', marginBottom: '12px' }}>📎 KOSIS HIRA</a>
          <RxTrendChart statin={DM_KOSIS.statinRx} antihtn={DM_KOSIS.antihtnRx} lang={lang} />
        </div>

        {/* Full width: Regional Diagnosis vs Treatment */}
        <div style={{
          gridColumn: '1 / -1',
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '12px',
          padding: '20px',
        }}>
          <h3 style={{ fontSize: '14px', color: '#fff', margin: '0 0 4px', fontFamily: "'Noto Sans KR'" }}>
            {t('시도별 진단율 vs 치료율 (2023)', 'Regional Diagnosis vs Treatment Rate (2023)', lang)}
          </h3>
          <a href="https://kosis.kr/" target="_blank" rel="noopener noreferrer" style={{ fontSize: '8px', color: '#00d4ff66', textDecoration: 'none', display: 'block', marginBottom: '12px' }}>📎 KOSIS HIRA</a>
          <RegionalCompare diagnosis={DM_KOSIS.diagnosisRegion} treatment={DM_KOSIS.treatmentRegion} lang={lang} year={latestYear} />
        </div>

        {/* Full width: Eye + Kidney Exam regional */}
        <div style={{
          gridColumn: '1 / -1',
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '12px',
          padding: '20px',
        }}>
          <h3 style={{ fontSize: '14px', color: '#fff', margin: '0 0 4px', fontFamily: "'Noto Sans KR'" }}>
            {t('시도별 합병증 검사율 (안저 + 신장, 2023)', 'Regional Complication Screening (Eye + Kidney, 2023)', lang)}
          </h3>
          <a href="https://kosis.kr/" target="_blank" rel="noopener noreferrer" style={{ fontSize: '8px', color: '#00d4ff66', textDecoration: 'none', display: 'block', marginBottom: '12px' }}>📎 KOSIS HIRA</a>
          <ComplicationScreening eye={DM_KOSIS.eyeExamRegion} kidney={DM_KOSIS.kidneyExamRegion} lang={lang} year={latestYear} />
        </div>
      </div>

      {/* Reference */}
      <div style={{ marginTop: '16px', fontSize: '10px', color: '#444', textAlign: 'right' }}>
        {dm.ref} | KOSIS {t('건강보험심사평가원 당뇨병 적정성 평가', 'HIRA Diabetes Quality Assessment', lang)}
      </div>
    </div>
  );
}


// ── Sub-components ──────────────────────

function AdmissionChart({ data, lang }) {
  const series = ['전체', '남자', '여자'];
  const colors = { '전체': '#ff922b', '남자': '#4d96ff', '여자': '#ff6b6b' };
  const years = Object.keys(data['전체'] || {}).sort();

  const maxVal = Math.max(...series.flatMap(s => years.map(y => data[s]?.[y] || 0)));
  const W = 540, H = 200, PL = 40, PR = 10, PT = 10, PB = 30;
  const plotW = W - PL - PR, plotH = H - PT - PB;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%' }}>
      {/* Y axis labels */}
      {[0, 100, 200, 300].filter(v => v <= maxVal + 20).map(v => {
        const y = PT + plotH - (v / maxVal) * plotH;
        return (
          <g key={v}>
            <line x1={PL} x2={W - PR} y1={y} y2={y} stroke="rgba(255,255,255,0.05)" />
            <text x={PL - 4} y={y + 3} fill="#9999bb" fontSize="9" textAnchor="end" fontFamily="JetBrains Mono">{v}</text>
          </g>
        );
      })}
      {/* Lines */}
      {series.map(s => {
        const pts = years.map((y, i) => {
          const x = PL + (i / (years.length - 1)) * plotW;
          const yy = PT + plotH - ((data[s]?.[y] || 0) / maxVal) * plotH;
          return `${x},${yy}`;
        }).join(' ');
        return <polyline key={s} points={pts} fill="none" stroke={colors[s]} strokeWidth="2" />;
      })}
      {/* X axis */}
      {years.filter((_, i) => i % 3 === 0).map((y, i) => {
        const x = PL + (years.indexOf(y) / (years.length - 1)) * plotW;
        return <text key={y} x={x} y={H - 4} fill="#9999bb" fontSize="9" textAnchor="middle" fontFamily="JetBrains Mono">{y}</text>;
      })}
      {/* Legend */}
      {series.map((s, i) => (
        <g key={s} transform={`translate(${PL + i * 80}, ${H - 16})`}>
          <rect width="10" height="3" fill={colors[s]} rx="1" />
          <text x="14" y="3" fill="#bbbbdd" fontSize="9">{lang === 'ko' ? s : s === '전체' ? 'Total' : s === '남자' ? 'Male' : 'Female'}</text>
        </g>
      ))}
    </svg>
  );
}

function CascadeChart({ dm, lang }) {
  const stages = [
    { label: lang === 'ko' ? '유병률' : 'Prevalence', value: typeof dm.prevalence === 'object' ? dm.prevalence?.value : dm.prevalence, color: '#ff6b6b' },
    { label: lang === 'ko' ? '인지율' : 'Awareness', value: dm.management?.awareness, color: '#ffd93d' },
    { label: lang === 'ko' ? '치료율' : 'Treatment', value: dm.management?.treatment, color: '#6bcb77' },
    { label: lang === 'ko' ? '조절률' : 'Control', value: dm.management?.control_HbA1c_lt_7_0 ?? dm.management?.control, color: '#4d96ff' },
  ];
  const maxVal = Math.max(...stages.map(s => s.value || 0));

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', height: '180px', padding: '0 20px' }}>
      {stages.map((s, i) => {
        const h = maxVal > 0 ? ((s.value || 0) / maxVal) * 150 : 0;
        return (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ fontSize: '18px', fontWeight: 800, color: s.color, marginBottom: '4px', fontFamily: "'JetBrains Mono'" }}>
              {s.value ?? '—'}%
            </div>
            <div style={{
              width: '100%', height: `${h}px`, background: `linear-gradient(to top, ${s.color}33, ${s.color}88)`,
              borderRadius: '6px 6px 0 0', border: `1px solid ${s.color}44`, borderBottom: 'none',
            }} />
            <div style={{ fontSize: '11px', color: '#bbbbdd', marginTop: '8px', textAlign: 'center' }}>{s.label}</div>
          </div>
        );
      })}
    </div>
  );
}

function AmputationChart({ major, minor, lang }) {
  const majorData = major['전체_환자단위'] || {};
  const minorData = minor['전체_환자단위'] || {};
  const years = Object.keys(majorData).sort();
  const maxVal = Math.max(...years.map(y => Math.max(majorData[y] || 0, minorData[y] || 0)));

  const W = 540, H = 180, PL = 40, PR = 10, PT = 10, PB = 30;
  const plotW = W - PL - PR, plotH = H - PT - PB;

  const makeLine = (data, color) => {
    const pts = years.map((y, i) => {
      const x = PL + (i / (years.length - 1)) * plotW;
      const yy = PT + plotH - ((data[y] || 0) / maxVal) * plotH;
      return `${x},${yy}`;
    }).join(' ');
    return <polyline points={pts} fill="none" stroke={color} strokeWidth="2" />;
  };

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%' }}>
      {makeLine(majorData, '#ff6b6b')}
      {makeLine(minorData, '#4d96ff')}
      {years.filter((_, i) => i % 3 === 0).map(y => {
        const x = PL + (years.indexOf(y) / (years.length - 1)) * plotW;
        return <text key={y} x={x} y={H - 4} fill="#9999bb" fontSize="9" textAnchor="middle" fontFamily="JetBrains Mono">{y}</text>;
      })}
      <g transform={`translate(${PL}, ${H - 16})`}>
        <rect width="10" height="3" fill="#ff6b6b" rx="1" />
        <text x="14" y="3" fill="#bbbbdd" fontSize="9">{lang === 'ko' ? '대절단' : 'Major'}</text>
        <rect x="70" width="10" height="3" fill="#4d96ff" rx="1" />
        <text x="84" y="3" fill="#bbbbdd" fontSize="9">{lang === 'ko' ? '소절단' : 'Minor'}</text>
      </g>
    </svg>
  );
}

function RxTrendChart({ statin, antihtn, lang }) {
  const statinData = statin['전체'] || {};
  const antihtnData = antihtn['전체'] || {};
  const years = Object.keys(statinData).sort();
  const maxVal = 100;

  const W = 540, H = 180, PL = 40, PR = 10, PT = 10, PB = 30;
  const plotW = W - PL - PR, plotH = H - PT - PB;

  const makeLine = (data, color) => {
    const pts = years.map((y, i) => {
      const x = PL + (i / (years.length - 1)) * plotW;
      const yy = PT + plotH - ((data[y] || 0) / maxVal) * plotH;
      return `${x},${yy}`;
    }).join(' ');
    return <polyline points={pts} fill="none" stroke={color} strokeWidth="2" />;
  };

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%' }}>
      {[0, 25, 50, 75, 100].map(v => {
        const y = PT + plotH - (v / maxVal) * plotH;
        return (
          <g key={v}>
            <line x1={PL} x2={W - PR} y1={y} y2={y} stroke="rgba(255,255,255,0.05)" />
            <text x={PL - 4} y={y + 3} fill="#9999bb" fontSize="9" textAnchor="end" fontFamily="JetBrains Mono">{v}%</text>
          </g>
        );
      })}
      {makeLine(statinData, '#20c997')}
      {makeLine(antihtnData, '#e599f7')}
      {years.filter((_, i) => i % 2 === 0).map(y => {
        const x = PL + (years.indexOf(y) / (years.length - 1)) * plotW;
        return <text key={y} x={x} y={H - 4} fill="#9999bb" fontSize="9" textAnchor="middle" fontFamily="JetBrains Mono">{y}</text>;
      })}
      <g transform={`translate(${PL}, ${H - 16})`}>
        <rect width="10" height="3" fill="#20c997" rx="1" />
        <text x="14" y="3" fill="#bbbbdd" fontSize="9">{lang === 'ko' ? '스타틴' : 'Statin'}</text>
        <rect x="80" width="10" height="3" fill="#e599f7" rx="1" />
        <text x="94" y="3" fill="#bbbbdd" fontSize="9">{lang === 'ko' ? '항고혈압제' : 'Anti-HTN'}</text>
      </g>
    </svg>
  );
}

function RegionalCompare({ diagnosis, treatment, lang, year }) {
  const regions = Object.keys(diagnosis).filter(r => diagnosis[r]?.['율']?.[year] != null);
  const dxData = regions.map(r => ({ region: r, dx: diagnosis[r]?.['율']?.[year], tx: treatment[r]?.['율']?.[year] }));
  dxData.sort((a, b) => (b.dx || 0) - (a.dx || 0));

  const W = 800, H = 280, PL = 50, PR = 20, PT = 20, PB = 40;
  const barW = (W - PL - PR) / dxData.length;
  const maxVal = Math.max(...dxData.map(d => Math.max(d.dx || 0, d.tx || 0)));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%' }}>
      {dxData.map((d, i) => {
        const x = PL + i * barW;
        const dxH = ((d.dx || 0) / maxVal) * (H - PT - PB);
        const txH = ((d.tx || 0) / maxVal) * (H - PT - PB);
        return (
          <g key={d.region}>
            <rect x={x + 2} y={H - PB - dxH} width={barW * 0.4 - 2} height={dxH} fill="#4d96ff88" rx="2" />
            <rect x={x + barW * 0.4 + 2} y={H - PB - txH} width={barW * 0.4 - 2} height={txH} fill="#6bcb7788" rx="2" />
            <text x={x + barW / 2} y={H - PB + 14} fill="#bbbbdd" fontSize="9" textAnchor="middle">{d.region}</text>
          </g>
        );
      })}
      <g transform={`translate(${PL}, 6)`}>
        <rect width="10" height="8" fill="#4d96ff88" rx="1" />
        <text x="14" y="7" fill="#bbbbdd" fontSize="10">{lang === 'ko' ? '진단율' : 'Diagnosis'}</text>
        <rect x="80" width="10" height="8" fill="#6bcb7788" rx="1" />
        <text x="94" y="7" fill="#bbbbdd" fontSize="10">{lang === 'ko' ? '치료율' : 'Treatment'}</text>
      </g>
    </svg>
  );
}

function ComplicationScreening({ eye, kidney, lang, year }) {
  const regions = Object.keys(eye).filter(r => eye[r]?.['율']?.[year] != null);
  const data = regions.map(r => ({ region: r, eye: eye[r]?.['율']?.[year], kidney: kidney[r]?.['율']?.[year] }));
  data.sort((a, b) => (b.eye || 0) - (a.eye || 0));

  const W = 800, H = 260, PL = 50, PR = 20, PT = 20, PB = 40;
  const barW = (W - PL - PR) / data.length;
  const maxVal = Math.max(...data.map(d => Math.max(d.eye || 0, d.kidney || 0)));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%' }}>
      {data.map((d, i) => {
        const x = PL + i * barW;
        const eH = ((d.eye || 0) / maxVal) * (H - PT - PB);
        const kH = ((d.kidney || 0) / maxVal) * (H - PT - PB);
        return (
          <g key={d.region}>
            <rect x={x + 2} y={H - PB - eH} width={barW * 0.4 - 2} height={eH} fill="#ffd93d88" rx="2" />
            <rect x={x + barW * 0.4 + 2} y={H - PB - kH} width={barW * 0.4 - 2} height={kH} fill="#b388ff88" rx="2" />
            <text x={x + barW / 2} y={H - PB + 14} fill="#bbbbdd" fontSize="9" textAnchor="middle">{d.region}</text>
          </g>
        );
      })}
      <g transform={`translate(${PL}, 6)`}>
        <rect width="10" height="8" fill="#ffd93d88" rx="1" />
        <text x="14" y="7" fill="#bbbbdd" fontSize="10">{lang === 'ko' ? '안저검사율' : 'Eye Exam'}</text>
        <rect x="100" width="10" height="8" fill="#b388ff88" rx="1" />
        <text x="114" y="7" fill="#bbbbdd" fontSize="10">{lang === 'ko' ? '신장검사율' : 'Kidney Exam'}</text>
      </g>
    </svg>
  );
}
