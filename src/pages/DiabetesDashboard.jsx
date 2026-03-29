import { useState } from 'react';
import { useLang } from '../i18n';
import { DISEASE_EPI } from '../data/disease_epi';
import { DM_KOSIS } from '../data/dm_kosis';
import CascadeWaterfall from '../components/CascadeWaterfall';
import InsightPanel from '../components/InsightPanel';

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
        <InsightPanel
          title={t('입원율 추이 (인구 10만명당)', 'Admission Rate Trend (per 100K)', lang)}
          source="KOSIS HIRA 2008-2023" sourceUrl="https://kosis.kr/"
          details={[
            { label: t('전체 최신', 'Total Latest', lang), value: '159.3', unit: '/10만', color: '#ff6b6b' },
            { label: t('남성', 'Male', lang), value: '213', unit: '/10만', color: '#4d96ff' },
            { label: t('여성', 'Female', lang), value: '129', unit: '/10만', color: '#ffd93d' },
            { label: t('감소폭', 'Decline', lang), value: '-42%', color: '#6bcb77' },
          ]}
          insight={{
            ko: '입원율이 2008년 275→2023년 159로 42% 감소. 외래 중심 관리 강화, SGLT2i/GLP-1RA 처방 증가, 교육 프로그램 확대가 주요 원인. 단, 여성 입원율 감소폭(-33%)이 남성(-38%)보다 작아 성별 격차 주시 필요.',
            en: 'Admission rate dropped 42% (275→159 per 100K) from 2008-2023. Key drivers: shift to outpatient management, SGLT2i/GLP-1RA uptake, expanded education programs. Female decline (-33%) lags male (-38%) — gender gap warrants monitoring.',
          }}
        >
          <AdmissionChart data={DM_KOSIS.admission} lang={lang} />
        </InsightPanel>

        {/* Right: Amputation Trend */}
        <InsightPanel
          title={t('절단율 추이 (대절단 vs 소절단)', 'Amputation Rate (Major vs Minor)', lang)}
          source="KOSIS HIRA" sourceUrl="https://kosis.kr/"
          details={[
            { label: t('대절단 최신', 'Major Latest', lang), value: '1.7', unit: '/10만', color: '#ff6b6b' },
            { label: t('소절단 최신', 'Minor Latest', lang), value: '8.2', unit: '/10만', color: '#4d96ff' },
          ]}
          insight={{
            ko: '대절단은 2008년 이후 꾸준히 감소, 소절단은 증가세 — 조기 발견과 보존적 치료 전환을 반영. 소절단 증가는 진단율 향상의 긍정적 신호이나, 당뇨발 선별검사 강화가 지속 필요.',
            en: 'Major amputations steadily declining since 2008 while minor amputations rise — reflecting earlier detection and limb-sparing approaches. Rising minor amputations signal improved diagnosis, but continued diabetic foot screening is critical.',
          }}
        >
          <AmputationChart major={DM_KOSIS.majorAmputation} minor={DM_KOSIS.minorAmputation} lang={lang} />
        </InsightPanel>

        {/* Statin + Anti-HTN Rx Trend */}
        <InsightPanel
          title={t('동반질환 처방률 추이', 'Comorbidity Prescription Trend', lang)}
          source="KOSIS HIRA" sourceUrl="https://kosis.kr/"
          details={[
            { label: t('스타틴', 'Statin', lang), value: '82.5', unit: '%', color: '#6bcb77' },
            { label: t('항고혈압제', 'Anti-HTN', lang), value: '81.6', unit: '%', color: '#4d96ff' },
          ]}
          insight={{
            ko: '스타틴 82.5%, 항고혈압제 81.6%로 2011년 이후 지속 상승. 가이드라인 준수율이 OECD 평균(~75%)을 상회하나, 30대 이하 젊은 환자의 복약 순응도는 여전히 낮은 편.',
            en: 'Statin 82.5% and anti-HTN 81.6% — steadily rising since 2011, exceeding OECD average (~75%). However, medication adherence in patients under 30 remains suboptimal.',
          }}
        >
          <RxTrendChart statin={DM_KOSIS.statinRx} antihtn={DM_KOSIS.antihtnRx} lang={lang} />
        </InsightPanel>

        {/* Full width: Regional Diagnosis vs Treatment */}
        <div style={{ gridColumn: '1 / -1' }}>
          <InsightPanel
            title={t('시도별 진단율 vs 치료율 (2023)', 'Regional Diagnosis vs Treatment Rate (2023)', lang)}
            source="KOSIS HIRA" sourceUrl="https://kosis.kr/"
            details={[
              { label: t('진단율 최고', 'Highest Dx', lang), value: t('전남 72%', 'Jeonnam 72%', lang), color: '#ffd93d' },
              { label: t('진단율 최저', 'Lowest Dx', lang), value: t('제주 51%', 'Jeju 51%', lang), color: '#ff6b6b' },
              { label: t('격차', 'Gap', lang), value: '21pp', color: '#9999bb' },
            ]}
            insight={{
              ko: '전남·전북·경북 등 농촌 지역의 진단율이 높은 이유는 고령 인구 비중과 건보 청구 기반 산출 특성. 반면 세종·울산·제주는 진단율이 낮으나 치료율과의 격차가 작아 진단 후 관리 연계가 양호.',
              en: 'Rural provinces (Jeonnam, Jeonbuk, Gyeongbuk) show higher diagnosis rates due to older demographics and claims-based calculation. Sejong/Ulsan/Jeju have lower diagnosis rates but smaller Dx-Tx gaps, indicating better care linkage post-diagnosis.',
            }}
          >
            <RegionalCompare diagnosis={DM_KOSIS.diagnosisRegion} treatment={DM_KOSIS.treatmentRegion} lang={lang} year={latestYear} />
          </InsightPanel>
        </div>

        {/* Full width: Eye + Kidney Exam regional */}
        <div style={{ gridColumn: '1 / -1' }}>
          <InsightPanel
            title={t('시도별 합병증 검사율 (안저 + 신장, 2023)', 'Regional Complication Screening (Eye + Kidney, 2023)', lang)}
            source="KOSIS HIRA" sourceUrl="https://kosis.kr/"
            details={[
              { label: t('안저검사 최고', 'Eye Best', lang), value: t('제주 38%', 'Jeju 38%', lang), color: '#ffd93d' },
              { label: t('신장검사 최고', 'Kidney Best', lang), value: t('세종 67%', 'Sejong 67%', lang), color: '#6bcb77' },
              { label: t('전국 평균', 'National Avg', lang), value: t('안저 27%, 신장 51%', 'Eye 27%, Kidney 51%', lang), color: '#9999bb' },
            ]}
            insight={{
              ko: '안저검사율 전국 27%로 매우 낮음 — 당뇨망막병증은 실명 원인 1위임에도 검사율이 저조. 신장검사율(51%)은 상대적으로 양호하나 지역 편차(세종 67% vs 전남 40%)가 큼. 수도권 접근성이 검사율과 양의 상관.',
              en: 'Eye screening at 27% nationally is critically low — diabetic retinopathy is the leading cause of blindness yet screening lags. Kidney screening (51%) is better but regionally variable (Sejong 67% vs Jeonnam 40%). Urban accessibility correlates with screening rates.',
            }}
          >
            <ComplicationScreening eye={DM_KOSIS.eyeExamRegion} kidney={DM_KOSIS.kidneyExamRegion} lang={lang} year={latestYear} />
          </InsightPanel>
        </div>
      </div>

      {/* Care Cascade Waterfall */}
      <CascadeWaterfall
        title={t('당뇨병 관리 캐스케이드 (30세+, 만 단위)', 'Diabetes Care Cascade (30+, in 10K)', lang)}
        source="KDA DFS 2024"
        totalPop={3600}
        totalLabel={t('30세+ 인구', '30+ Pop.', lang)}
        lossLabel={t('비당뇨', 'no DM', lang)}
        endLabel={t('통합관리', 'All Targets', lang)}
        stages={[
          { label: t('유병', 'Prevalence', lang), count: 530, color: '#ff6b6b', note: 'FPG≥126 or HbA1c≥6.5 or 복약' },
          { label: t('인지(진단)', 'Awareness', lang), count: 396, color: '#ffd93d', note: t('의사 진단', 'Physician Dx', lang) },
          { label: t('치료(복약)', 'Treatment', lang), count: 376, color: '#6bcb77', note: t('경구약/인슐린', 'OHA/Insulin', lang) },
          { label: t('조절(HbA1c<7%)', 'Control(A1c<7)', lang), count: 321, color: '#4d96ff', note: 'HbA1c <7.0%' },
          { label: t('통합관리', 'All Targets', lang), count: 84, color: '#b388ff', note: t('혈당+BP+LDL', 'Glc+BP+LDL', lang) },
        ]}
      />

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
