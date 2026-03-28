import { useState } from 'react';
import { useLang } from '../i18n';
import { DISEASE_EPI, DISEASE_TIMESERIES } from '../data/disease_epi';
import { DM_KOSIS } from '../data/dm_kosis';
import CascadeFunnel from '../components/CascadeFunnel';

const t = (ko, en, lang) => lang === 'ko' ? ko : en;
const ckd = DISEASE_EPI.diseases.ckd;

export default function KidneyDashboard() {
  const { lang } = useLang();
  const [activeTab, setActiveTab] = useState('ckd');

  // Kidney exam data from DM KOSIS
  const kidneyExam = DM_KOSIS.kidneyExamRegion;
  const latestYear = '2023';

  const regions = Object.keys(kidneyExam).filter(r => kidneyExam[r]?.['율']?.[latestYear] != null);
  const examData = regions.map(r => ({
    region: r,
    rate: kidneyExam[r]?.['율']?.[latestYear],
  })).sort((a, b) => (b.rate || 0) - (a.rate || 0));

  const tabs = [
    { id: 'ckd', label: t('CKD 개요', 'CKD Overview', lang) },
    { id: 'eskd', label: t('ESKD / 투석', 'ESKD / Dialysis', lang) },
    { id: 'dkd', label: t('DKD / 동반질환', 'DKD / Comorbidity', lang) },
  ];

  // KPI cards
  const kpiCards = [
    { label: t('CKD 유병률', 'CKD Prevalence', lang), value: '8.2', unit: '%', sub: t('20세 이상 (2011-13)', '≥20y (2011-13)', lang), color: '#ff6b6b', refLabel: 'KNHANES' },
    { label: t('ESKD 유병환자', 'ESKD Patients', lang), value: '135,345', unit: t('명', '', lang), sub: '2022', color: '#ffd93d', refLabel: 'KORDS 2022' },
    { label: t('투석 환자', 'Dialysis Patients', lang), value: '117,698', unit: t('명', '', lang), sub: '2022 (HD 91.2%)', color: '#4d96ff', refLabel: 'KORDS 2022' },
    { label: t('신장이식', 'Transplants', lang), value: '2,164', unit: t('건/년', '/yr', lang), sub: '2022', color: '#6bcb77', refLabel: 'KORDS 2022' },
    { label: t('DKD (당뇨→ESKD)', 'DKD (DM→ESKD)', lang), value: '48.3', unit: '%', sub: t('ESKD 원인 1위', '#1 cause of ESKD', lang), color: '#e599f7', refLabel: 'KORDS 2022' },
    { label: t('신장검사율', 'Kidney Exam', lang), value: examData.length > 0 ? (examData.reduce((s, d) => s + d.rate, 0) / examData.length).toFixed(1) : '—', unit: '%', sub: t('당뇨환자, 전국평균', 'DM patients, avg', lang), color: '#20c997', refLabel: 'KOSIS HIRA' },
  ];

  return (
    <div style={{ padding: '76px 24px 24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Title */}
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#fff', margin: 0, fontFamily: "'Noto Sans KR'" }}>
          {t('콩팥 대시보드', 'Kidney Dashboard', lang)}
        </h1>
        <div style={{ fontSize: '12px', color: '#aaaacc', marginTop: '4px' }}>
          {t('출처: KSN ESKD FS 2024, KORDS 2010-2022, DKD GL 2024, HTN-CKD GL 2025, KOSIS',
             'Source: KSN ESKD FS 2024, KORDS 2010-2022, DKD GL 2024, HTN-CKD GL 2025, KOSIS', lang)}
          <a href="https://www.ksn.or.kr/" target="_blank" rel="noopener noreferrer"
            style={{ fontSize: '10px', color: '#00d4ff88', textDecoration: 'none', marginLeft: '8px' }}>
            KSN
          </a>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '10px', marginBottom: '20px' }}>
        {kpiCards.map((kpi, i) => (
          <div key={i} style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '12px',
            padding: '14px',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: kpi.color, opacity: 0.6 }} />
            <div style={{ fontSize: '10px', color: '#bbbbdd', marginBottom: '6px' }}>{kpi.label}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '3px' }}>
              <span style={{ fontSize: '22px', fontWeight: 800, color: kpi.color, fontFamily: "'JetBrains Mono'" }}>
                {kpi.value}
              </span>
              <span style={{ fontSize: '11px', color: '#aaaacc' }}>{kpi.unit}</span>
            </div>
            {kpi.sub && <div style={{ fontSize: '9px', color: '#9999bb', marginTop: '3px' }}>{kpi.sub}</div>}
            <div style={{ fontSize: '8px', color: '#00d4ff66', marginTop: '2px' }}>{kpi.refLabel}</div>
          </div>
        ))}
      </div>

      {/* Sub-tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '16px' }}>
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: activeTab === tab.id ? '1px solid rgba(0,212,255,0.3)' : '1px solid rgba(255,255,255,0.06)',
            background: activeTab === tab.id ? 'rgba(0,212,255,0.08)' : 'rgba(255,255,255,0.02)',
            color: activeTab === tab.id ? '#00d4ff' : '#bbbbdd',
            cursor: 'pointer',
            fontSize: '12px',
            fontFamily: "'Noto Sans KR'",
            fontWeight: activeTab === tab.id ? 700 : 400,
          }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'ckd' && <CKDTab lang={lang} examData={examData} latestYear={latestYear} />}
      {activeTab === 'eskd' && <ESKDTab lang={lang} />}
      {activeTab === 'dkd' && <DKDTab lang={lang} examData={examData} latestYear={latestYear} />}

      {/* CKD Care Cascade Funnel */}
      <CascadeFunnel
        title={t('CKD 관리 캐스케이드 (20세+, 만 단위)', 'CKD Care Cascade (20+, in 10K)', lang)}
        source="KSN KORDS 2024"
        totalPop={4350}
        totalLabel={t('20세+ 인구', '20+ Pop.', lang)}
        lossLabel={t('비CKD', 'no CKD', lang)}
        endLabel={t('투석/이식', 'Dialysis/Tx', lang)}
        stages={[
          { label: t('CKD 유병', 'CKD Prev.', lang), count: 360, color: '#4ecdc4', note: '8.2% (2011-13)' },
          { label: t('인지(진단)', 'Awareness', lang), count: 23, color: '#ffd93d', note: t('6.3%만 인지!', '6.3% aware!', lang) },
          { label: t('ESKD(투석/이식)', 'ESKD(Dial/Tx)', lang), count: 14, color: '#9b59b6', note: t('13.5만명', '135K pts', lang) },
        ]}
      />

      {/* Reference */}
      <div style={{ marginTop: '16px', fontSize: '10px', color: '#444', textAlign: 'right' }}>
        {ckd?.ref?.substring(0, 120)}...
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════
// Tab 1: CKD Overview
// ═══════════════════════════════════════════
function CKDTab({ lang, examData, latestYear }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
      {/* CKD Stage Distribution */}
      <div style={cardStyle}>
        <CardTitle text={t('CKD Stage 분포 (20세 이상)', 'CKD Stage Distribution (≥20y)', lang)}
          refUrl="https://doi.org/10.1038/s41598-023-30location" refLabel="Sci Rep 2023" />
        <StageDistributionChart lang={lang} />
      </div>

      {/* CKD Awareness Gap */}
      <div style={cardStyle}>
        <CardTitle text={t('CKD 인지율 Gap', 'CKD Awareness Gap', lang)}
          refUrl="https://www.ksn.or.kr/" refLabel="KSN 2024" />
        <AwarenessGapChart lang={lang} />
      </div>

      {/* Age Distribution */}
      <div style={cardStyle}>
        <CardTitle text={t('연령대별 CKD 유병률', 'CKD Prevalence by Age', lang)}
          refUrl="https://www.ksn.or.kr/" refLabel="KNHANES" />
        <AgeDistributionChart lang={lang} />
      </div>

      {/* Cost Burden */}
      <div style={cardStyle}>
        <CardTitle text={t('CKD 의료비 부담', 'CKD Cost Burden', lang)}
          refUrl="https://www.ksn.or.kr/" refLabel="NHIS/KSN" />
        <CostBurdenPanel lang={lang} />
      </div>

      {/* Regional kidney exam rate — full width */}
      <div style={{ ...cardStyle, gridColumn: '1 / -1' }}>
        <CardTitle text={t(`시도별 당뇨환자 신장검사율 (${latestYear})`, `Regional DM Kidney Exam Rate (${latestYear})`, lang)}
          refUrl="https://kosis.kr/" refLabel="KOSIS HIRA" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {examData.map(d => {
            const maxRate = examData[0]?.rate || 1;
            const barW = (d.rate / maxRate) * 100;
            return (
              <div key={d.region} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '40px', fontSize: '11px', color: '#bbbbdd', textAlign: 'right' }}>{d.region}</div>
                <div style={{ flex: 1, height: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${barW}%`, height: '100%',
                    background: d.rate > 50 ? '#6bcb7788' : d.rate > 35 ? '#ffd93d88' : '#ff6b6b88',
                    borderRadius: '4px',
                  }} />
                </div>
                <div style={{ width: '45px', fontSize: '11px', color: '#aaaacc', fontFamily: "'JetBrains Mono'" }}>{d.rate}%</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════
// Tab 2: ESKD / Dialysis
// ═══════════════════════════════════════════
function ESKDTab({ lang }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
      {/* ESKD Incidence Trend */}
      <div style={cardStyle}>
        <CardTitle text={t('ESKD 발생률 추이 (백만명당)', 'ESKD Incidence Trend (per million)', lang)}
          refUrl="https://www.ksn.or.kr/" refLabel="KORDS 2010-2022" />
        <ESKDIncidenceChart lang={lang} />
      </div>

      {/* ESKD Prevalence Trend */}
      <div style={cardStyle}>
        <CardTitle text={t('ESKD 유병환자 추이', 'ESKD Prevalent Patients Trend', lang)}
          refUrl="https://www.ksn.or.kr/" refLabel="KORDS 2010-2022" />
        <ESKDPrevalenceChart lang={lang} />
      </div>

      {/* Dialysis Modality */}
      <div style={cardStyle}>
        <CardTitle text={t('투석 방법 (HD vs PD)', 'Dialysis Modality (HD vs PD)', lang)}
          refUrl="https://www.ksn.or.kr/" refLabel="KORDS 2022" />
        <DialysisDonut lang={lang} />
      </div>

      {/* Dialysis Trend */}
      <div style={cardStyle}>
        <CardTitle text={t('투석 환자수 추이', 'Dialysis Patient Trend', lang)}
          refUrl="https://www.ksn.or.kr/" refLabel="KORDS 2010-2022" />
        <DialysisTrendChart lang={lang} />
      </div>

      {/* ESKD Cause Distribution */}
      <div style={cardStyle}>
        <CardTitle text={t('ESKD 원인질환 분포', 'ESKD Cause Distribution', lang)}
          refUrl="https://www.ksn.or.kr/" refLabel="KORDS 2022" />
        <ESKDCauseChart lang={lang} />
      </div>

      {/* Transplant Trend */}
      <div style={cardStyle}>
        <CardTitle text={t('신장이식 추이 (생체 vs 뇌사)', 'Transplant Trend (Living vs Deceased)', lang)}
          refUrl="https://www.ksn.or.kr/" refLabel="KORDS 2010-2022" />
        <TransplantChart lang={lang} />
      </div>

      {/* Mortality & Workforce */}
      <div style={{ ...cardStyle, gridColumn: '1 / -1' }}>
        <CardTitle text={t('ESKD 사망 및 투석전문의 현황', 'ESKD Mortality & Workforce', lang)}
          refUrl="https://www.ksn.or.kr/" refLabel="KSN 2024" />
        <MortalityWorkforcePanel lang={lang} />
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════
// Tab 3: DKD / Comorbidity
// ═══════════════════════════════════════════
function DKDTab({ lang, examData, latestYear }) {
  const dkd = ckd.dkdOverlap;
  const htn = ckd.htnCkdOverlap;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
      {/* DKD Overview */}
      <div style={cardStyle}>
        <CardTitle text={t('당뇨병콩팥병 (DKD) 핵심 지표', 'Diabetic Kidney Disease Key Metrics', lang)}
          refUrl="https://www.ksn.or.kr/" refLabel="DKD GL 2024" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <MetricRow label={t('당뇨 환자 중 CKD 동반', 'CKD among DM patients', lang)} value={dkd?.ckdAmongDM} unit="%" color="#ff6b6b" />
          <MetricRow label={t('ESKD 원인 중 당뇨', 'DM as ESKD cause', lang)} value={dkd?.dmAmongESKD} unit="%" color="#ffd93d" />
          <MetricRow label={t('30세+ 당뇨환자 CKD 동반', 'CKD in DM ≥30y', lang)} value={dkd?.dkdPrevalenceInDM30plus} unit="%" color="#4d96ff" />
          <MetricRow label={t('당뇨 환자 알부민뇨', 'Albuminuria in DM', lang)} value={dkd?.albuminuriaInDM} unit="%" color="#b388ff" />
          <div style={{ fontSize: '10px', color: '#aaaacc', marginTop: '4px', lineHeight: 1.6, borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '8px' }}>
            {t(dkd?.dmCkdMortality, dkd?.dmCkdMortality, lang)}
            <br />
            {t(dkd?.yearlyProgression, dkd?.yearlyProgression, lang)}
          </div>
        </div>
      </div>

      {/* HTN + CKD */}
      <div style={cardStyle}>
        <CardTitle text={t('고혈압 + CKD 관련', 'Hypertension + CKD', lang)}
          refUrl="https://www.ksn.or.kr/" refLabel="HTN-CKD GL 2025" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <MetricRow label={t('고혈압 환자 중 CKD', 'CKD among HTN', lang)} value={htn?.ckdAmongHTN} unit="%" color="#ff922b" />
          <MetricRow label={t('ESKD 원인 중 고혈압', 'HTN as ESKD cause', lang)} value={htn?.htnAmongESKD} unit="%" color="#e599f7" />
          <div style={{ fontSize: '11px', color: '#bbbbdd', marginTop: '12px', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', lineHeight: 1.6 }}>
            {t(
              'ESKD 원인: 당뇨 48.3% > 고혈압 21.6% > 사구체신염 7.8% > 다낭신 2.1%',
              'ESKD causes: DM 48.3% > HTN 21.6% > GN 7.8% > PKD 2.1%',
              lang
            )}
          </div>
        </div>
      </div>

      {/* DKD vs Non-DKD ESKD cause pie comparison */}
      <div style={{ ...cardStyle, gridColumn: '1 / -1' }}>
        <CardTitle text={t('ESKD 원인별 비율 — 당뇨가 압도적 1위', 'ESKD by Cause — Diabetes Dominates', lang)}
          refUrl="https://www.ksn.or.kr/" refLabel="KORDS 2022" />
        <ESKDCauseHorizontal lang={lang} />
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════
// Shared Components
// ═══════════════════════════════════════════
const cardStyle = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: '12px',
  padding: '20px',
};

function CardTitle({ text, refUrl, refLabel }) {
  return (
    <h3 style={{ fontSize: '13px', color: '#fff', margin: '0 0 14px', fontFamily: "'Noto Sans KR'" }}>
      {text}
      {refUrl && (
        <a href={refUrl} target="_blank" rel="noopener noreferrer"
          style={{ fontSize: '8px', color: '#00d4ff66', textDecoration: 'none', marginLeft: '8px' }}>
          {refLabel}
        </a>
      )}
    </h3>
  );
}

function MetricRow({ label, value, unit, color }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
      <span style={{ fontSize: '12px', color: '#bbbbdd' }}>{label}</span>
      <span style={{ fontSize: '16px', fontWeight: 700, color, fontFamily: "'JetBrains Mono'" }}>
        {value ?? '—'}{unit}
      </span>
    </div>
  );
}


// ═══════════════════════════════════════════
// Chart Components
// ═══════════════════════════════════════════

function StageDistributionChart({ lang }) {
  const sd = ckd.stageDistribution;
  if (!sd) return <div style={{ color: '#9999bb', fontSize: '12px' }}>Data loading...</div>;

  const stages = [
    { key: 'stage1', label: 'Stage 1', color: '#6bcb77' },
    { key: 'stage2', label: 'Stage 2', color: '#4d96ff' },
    { key: 'stage3a', label: '3a', color: '#ffd93d' },
    { key: 'stage3b', label: '3b', color: '#ff922b' },
    { key: 'stage4', label: 'Stage 4', color: '#ff6b6b' },
    { key: 'stage5', label: 'Stage 5', color: '#e599f7' },
  ];
  const total = stages.reduce((s, st) => s + (sd[st.key]?.percent || 0), 0);

  return (
    <div>
      {/* Stacked horizontal bar */}
      <div style={{ display: 'flex', height: '32px', borderRadius: '8px', overflow: 'hidden', marginBottom: '12px' }}>
        {stages.map(st => {
          const pct = (sd[st.key]?.percent || 0) / total * 100;
          return (
            <div key={st.key} style={{
              width: `${pct}%`, background: st.color, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '9px', color: '#000', fontWeight: 700, fontFamily: "'JetBrains Mono'",
              minWidth: pct > 3 ? 'auto' : '0',
            }}>
              {pct > 8 ? `${sd[st.key]?.percent}%` : ''}
            </div>
          );
        })}
      </div>
      {/* Legend */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {stages.map(st => (
          <div key={st.key} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: st.color }} />
            <span style={{ fontSize: '10px', color: '#bbbbdd' }}>{st.label}</span>
            <span style={{ fontSize: '10px', color: st.color, fontFamily: "'JetBrains Mono'", fontWeight: 700 }}>{sd[st.key]?.percent}%</span>
          </div>
        ))}
      </div>
      <div style={{ fontSize: '9px', color: '#9999bb', marginTop: '8px' }}>
        {t('전체 CKD 유병률 8.2% (20세 이상). Stage 1-2: 알부민뇨 기준, Stage 3-5: eGFR 기준',
           'Total CKD 8.2% (≥20y). Stage 1-2: albuminuria-based, Stage 3-5: eGFR-based', lang)}
      </div>
    </div>
  );
}

function AwarenessGapChart({ lang }) {
  const gap = ckd.awarenessGap;
  if (!gap) return null;

  const bars = [
    { label: t('유병률', 'Prevalence', lang), value: gap.prevalence, color: '#ff6b6b' },
    { label: t('인지율 (상한)', 'Awareness (high)', lang), value: gap.awareness_high, color: '#ffd93d' },
    { label: t('인지율 (하한)', 'Awareness (low)', lang), value: gap.awareness_low, color: '#ff922b' },
  ];
  const maxVal = Math.max(...bars.map(b => b.value));

  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {bars.map((b, i) => (
          <div key={i}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontSize: '11px', color: '#bbbbdd' }}>{b.label}</span>
              <span style={{ fontSize: '13px', fontWeight: 700, color: b.color, fontFamily: "'JetBrains Mono'" }}>{b.value}%</span>
            </div>
            <div style={{ height: '20px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', overflow: 'hidden' }}>
              <div style={{
                width: `${(b.value / maxVal) * 100}%`, height: '100%',
                background: `linear-gradient(90deg, ${b.color}33, ${b.color}aa)`,
                borderRadius: '6px',
              }} />
            </div>
          </div>
        ))}
      </div>
      <div style={{ fontSize: '10px', color: '#ff6b6b', marginTop: '12px', padding: '8px', background: 'rgba(255,107,107,0.05)', borderRadius: '6px', lineHeight: 1.5 }}>
        {t('CKD 인지율 1.3~6.3%: 유병률 8.2% 대비 극히 낮음. Stage 3 이상에서도 10% 미만이 자신의 질환을 인지.',
           'CKD awareness 1.3-6.3%: extremely low vs 8.2% prevalence. Even in Stage 3+, <10% are aware.', lang)}
      </div>
    </div>
  );
}

function AgeDistributionChart({ lang }) {
  const ad = ckd.ageDistribution;
  if (!ad) return null;

  const groups = Object.entries(ad).filter(([k]) => k !== 'unit' && k !== 'source');
  const maxVal = Math.max(...groups.map(([, v]) => v));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {groups.map(([age, val]) => (
        <div key={age} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '50px', fontSize: '11px', color: '#bbbbdd', textAlign: 'right' }}>{age}</div>
          <div style={{ flex: 1, height: '18px', background: 'rgba(255,255,255,0.03)', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{
              width: `${(val / maxVal) * 100}%`, height: '100%',
              background: val > 20 ? '#ff6b6b88' : val > 10 ? '#ffd93d88' : '#4d96ff88',
              borderRadius: '4px',
              display: 'flex', alignItems: 'center', paddingLeft: '6px',
            }}>
              <span style={{ fontSize: '10px', color: '#fff', fontFamily: "'JetBrains Mono'", fontWeight: 700 }}>{val}%</span>
            </div>
          </div>
        </div>
      ))}
      <div style={{ fontSize: '9px', color: '#9999bb', marginTop: '4px' }}>
        {t('70세 이상 약 28.3%: 고령화 사회에서 CKD 부담 급증', '70+: ~28.3% — aging population drives CKD burden', lang)}
      </div>
    </div>
  );
}

function CostBurdenPanel({ lang }) {
  const cost = ckd.costBurden;
  if (!cost) return <div style={{ color: '#9999bb', fontSize: '12px' }}>Loading...</div>;

  const items = [
    { label: t('투석 연간 비용/인', 'Dialysis cost/yr/pt', lang), value: cost.dialysisCostPerYear, color: '#ff6b6b' },
    { label: t('전체 투석 비용', 'Total dialysis cost', lang), value: cost.totalDialysisCost2022, color: '#ffd93d' },
    { label: t('이식 첫해 비용', 'Transplant 1st year', lang), value: cost.transplantCostFirstYear, color: '#6bcb77' },
    { label: t('이식 유지 비용/년', 'Transplant maint/yr', lang), value: cost.transplantMaintenancePerYear, color: '#4d96ff' },
  ];

  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {items.map((item, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
            <span style={{ fontSize: '11px', color: '#bbbbdd' }}>{item.label}</span>
            <span style={{ fontSize: '13px', fontWeight: 700, color: item.color, fontFamily: "'JetBrains Mono'" }}>{item.value}</span>
          </div>
        ))}
      </div>
      <div style={{ fontSize: '10px', color: '#6bcb77', marginTop: '10px', padding: '8px', background: 'rgba(107,203,119,0.05)', borderRadius: '6px', lineHeight: 1.5 }}>
        {t(cost.costNote, cost.costNote, lang)}
      </div>
    </div>
  );
}

function ESKDIncidenceChart({ lang }) {
  const data = DISEASE_TIMESERIES.eskd_incidence;
  if (!data) return null;

  const { years, rates } = data;
  const maxVal = Math.max(...rates) * 1.1;
  const W = 540, H = 200, PL = 45, PR = 10, PT = 10, PB = 30;
  const plotW = W - PL - PR, plotH = H - PT - PB;

  const pts = years.map((y, i) => {
    const x = PL + (i / (years.length - 1)) * plotW;
    const yy = PT + plotH - (rates[i] / maxVal) * plotH;
    return `${x},${yy}`;
  }).join(' ');

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%' }}>
      {[0, 100, 200, 300, 400].filter(v => v <= maxVal).map(v => {
        const y = PT + plotH - (v / maxVal) * plotH;
        return (
          <g key={v}>
            <line x1={PL} x2={W - PR} y1={y} y2={y} stroke="rgba(255,255,255,0.05)" />
            <text x={PL - 4} y={y + 3} fill="#9999bb" fontSize="9" textAnchor="end" fontFamily="JetBrains Mono">{v}</text>
          </g>
        );
      })}
      <polyline points={pts} fill="none" stroke="#ff6b6b" strokeWidth="2.5" />
      {/* Area fill */}
      <polygon points={`${PL},${PT + plotH} ${pts} ${PL + plotW},${PT + plotH}`} fill="url(#eskdGrad)" />
      <defs>
        <linearGradient id="eskdGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ff6b6b" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#ff6b6b" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Data points */}
      {years.map((y, i) => {
        const x = PL + (i / (years.length - 1)) * plotW;
        const yy = PT + plotH - (rates[i] / maxVal) * plotH;
        return (
          <g key={y}>
            <circle cx={x} cy={yy} r="3.5" fill="#ff6b6b" />
            <text x={x} y={yy - 8} fill="#ff6b6b" fontSize="9" textAnchor="middle" fontFamily="JetBrains Mono" fontWeight="700">{rates[i]}</text>
            <text x={x} y={H - 4} fill="#9999bb" fontSize="9" textAnchor="middle" fontFamily="JetBrains Mono">{y}</text>
          </g>
        );
      })}
    </svg>
  );
}

function ESKDPrevalenceChart({ lang }) {
  const data = DISEASE_TIMESERIES.eskd_incidence;
  if (!data) return null;

  const { years, patients } = data;
  const maxVal = Math.max(...patients) * 1.1;
  const W = 540, H = 200, PL = 55, PR = 10, PT = 10, PB = 30;
  const plotW = W - PL - PR, plotH = H - PT - PB;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%' }}>
      {[0, 50000, 100000, 150000].filter(v => v <= maxVal).map(v => {
        const y = PT + plotH - (v / maxVal) * plotH;
        return (
          <g key={v}>
            <line x1={PL} x2={W - PR} y1={y} y2={y} stroke="rgba(255,255,255,0.05)" />
            <text x={PL - 4} y={y + 3} fill="#9999bb" fontSize="8" textAnchor="end" fontFamily="JetBrains Mono">{(v / 10000).toFixed(0)}{lang === 'ko' ? '만' : '0K'}</text>
          </g>
        );
      })}
      {years.map((y, i) => {
        const x = PL + (i / (years.length - 1)) * plotW;
        const barH = (patients[i] / maxVal) * plotH;
        return (
          <g key={y}>
            <rect x={x - 16} y={PT + plotH - barH} width="32" height={barH} fill="#ffd93d44" rx="4" />
            <text x={x} y={PT + plotH - barH - 6} fill="#ffd93d" fontSize="8" textAnchor="middle" fontFamily="JetBrains Mono" fontWeight="700">
              {(patients[i] / 10000).toFixed(1)}{lang === 'ko' ? '만' : '0K'}
            </text>
            <text x={x} y={H - 4} fill="#9999bb" fontSize="9" textAnchor="middle" fontFamily="JetBrains Mono">{y}</text>
          </g>
        );
      })}
    </svg>
  );
}

function DialysisDonut({ lang }) {
  const dial = ckd.dialysis;
  if (!dial) return null;

  const hd = dial.hdPercent;
  const pd = dial.pdPercent;
  const cx = 100, cy = 90, r = 60, r2 = 35;

  // SVG donut via two arcs
  const hdAngle = (hd / 100) * 360;
  const hdRad = (hdAngle - 90) * Math.PI / 180;
  const pdRad = (360 - 90) * Math.PI / 180;

  const hdX = cx + r * Math.cos(hdRad);
  const hdY = cy + r * Math.sin(hdRad);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
      <svg viewBox="0 0 200 180" style={{ width: '160px', height: '150px' }}>
        {/* HD arc */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#4d96ff" strokeWidth="24"
          strokeDasharray={`${hd / 100 * 2 * Math.PI * r} ${2 * Math.PI * r}`}
          strokeDashoffset={2 * Math.PI * r * 0.25}
          strokeLinecap="round" />
        {/* PD arc */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e599f7" strokeWidth="24"
          strokeDasharray={`${pd / 100 * 2 * Math.PI * r} ${2 * Math.PI * r}`}
          strokeDashoffset={-hd / 100 * 2 * Math.PI * r + 2 * Math.PI * r * 0.25}
          strokeLinecap="round" />
        {/* Center text */}
        <text x={cx} y={cy - 6} fill="#fff" fontSize="16" fontWeight="800" textAnchor="middle" fontFamily="JetBrains Mono">
          {(dial.totalPatients2022 / 10000).toFixed(1)}
        </text>
        <text x={cx} y={cy + 10} fill="#bbbbdd" fontSize="9" textAnchor="middle">
          {lang === 'ko' ? '만명 (2022)' : '0K (2022)'}
        </text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#4d96ff' }} />
            <span style={{ fontSize: '12px', color: '#bbbbdd' }}>{t('혈액투석 (HD)', 'Hemodialysis', lang)}</span>
          </div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: '#4d96ff', fontFamily: "'JetBrains Mono'" }}>
            {hd}%
            <span style={{ fontSize: '11px', color: '#aaaacc', fontWeight: 400 }}> ({(dial.hdPatients2022).toLocaleString()})</span>
          </div>
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#e599f7' }} />
            <span style={{ fontSize: '12px', color: '#bbbbdd' }}>{t('복막투석 (PD)', 'Peritoneal Dialysis', lang)}</span>
          </div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: '#e599f7', fontFamily: "'JetBrains Mono'" }}>
            {pd}%
            <span style={{ fontSize: '11px', color: '#aaaacc', fontWeight: 400 }}> ({(dial.pdPatients2022).toLocaleString()})</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function DialysisTrendChart({ lang }) {
  const data = DISEASE_TIMESERIES.dialysis_trend;
  if (!data) return null;

  const { years, hd, pd } = data;
  const maxVal = Math.max(...hd.map((h, i) => h + pd[i])) * 1.1;
  const W = 540, H = 200, PL = 55, PR = 10, PT = 10, PB = 30;
  const plotW = W - PL - PR, plotH = H - PT - PB;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%' }}>
      {/* Stacked bars */}
      {years.map((y, i) => {
        const x = PL + (i / (years.length - 1)) * plotW;
        const hdH = (hd[i] / maxVal) * plotH;
        const pdH = (pd[i] / maxVal) * plotH;
        return (
          <g key={y}>
            <rect x={x - 16} y={PT + plotH - hdH - pdH} width="32" height={pdH} fill="#e599f788" rx="2" />
            <rect x={x - 16} y={PT + plotH - hdH} width="32" height={hdH} fill="#4d96ff66" rx="2" />
            <text x={x} y={PT + plotH - hdH - pdH - 6} fill="#bbbbdd" fontSize="8" textAnchor="middle" fontFamily="JetBrains Mono">
              {((hd[i] + pd[i]) / 10000).toFixed(1)}
            </text>
            <text x={x} y={H - 4} fill="#9999bb" fontSize="9" textAnchor="middle" fontFamily="JetBrains Mono">{y}</text>
          </g>
        );
      })}
      {/* Legend */}
      <g transform={`translate(${PL}, 4)`}>
        <rect width="10" height="6" fill="#4d96ff66" rx="1" />
        <text x="14" y="6" fill="#bbbbdd" fontSize="9">HD</text>
        <rect x="40" width="10" height="6" fill="#e599f788" rx="1" />
        <text x="54" y="6" fill="#bbbbdd" fontSize="9">PD</text>
        <text x="80" y="6" fill="#9999bb" fontSize="8">{lang === 'ko' ? '(만명)' : '(x10K)'}</text>
      </g>
    </svg>
  );
}

function ESKDCauseChart({ lang }) {
  const causes = ckd.eskd?.causeDistribution;
  if (!causes) return null;

  const items = [
    { label: t('당뇨병', 'Diabetes', lang), value: causes.diabetes, color: '#ff6b6b' },
    { label: t('고혈압', 'Hypertension', lang), value: causes.hypertension, color: '#ffd93d' },
    { label: t('사구체신염', 'GN', lang), value: causes.glomerulonephritis, color: '#4d96ff' },
    { label: t('다낭신', 'PKD', lang), value: causes.polycysticKidney, color: '#6bcb77' },
    { label: t('기타', 'Other', lang), value: causes.other, color: '#bbbbdd' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {items.map((item, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '60px', fontSize: '11px', color: '#bbbbdd', textAlign: 'right' }}>{item.label}</div>
          <div style={{ flex: 1, height: '22px', background: 'rgba(255,255,255,0.03)', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{
              width: `${item.value}%`, height: '100%',
              background: `linear-gradient(90deg, ${item.color}44, ${item.color}aa)`,
              borderRadius: '4px',
              display: 'flex', alignItems: 'center', paddingLeft: '6px',
            }}>
              <span style={{ fontSize: '10px', color: '#fff', fontFamily: "'JetBrains Mono'", fontWeight: 700 }}>{item.value}%</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function TransplantChart({ lang }) {
  const data = DISEASE_TIMESERIES.transplant_trend;
  if (!data) return null;

  const { years, living, deceased } = data;
  const maxVal = Math.max(...living.map((l, i) => l + deceased[i])) * 1.15;
  const W = 540, H = 200, PL = 45, PR = 10, PT = 10, PB = 30;
  const plotW = W - PL - PR, plotH = H - PT - PB;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%' }}>
      {years.map((y, i) => {
        const x = PL + (i / (years.length - 1)) * plotW;
        const lH = (living[i] / maxVal) * plotH;
        const dH = (deceased[i] / maxVal) * plotH;
        return (
          <g key={y}>
            <rect x={x - 16} y={PT + plotH - lH - dH} width="32" height={dH} fill="#ff922b88" rx="2" />
            <rect x={x - 16} y={PT + plotH - lH} width="32" height={lH} fill="#6bcb7788" rx="2" />
            <text x={x} y={PT + plotH - lH - dH - 6} fill="#bbbbdd" fontSize="8" textAnchor="middle" fontFamily="JetBrains Mono">
              {living[i] + deceased[i]}
            </text>
            <text x={x} y={H - 4} fill="#9999bb" fontSize="9" textAnchor="middle" fontFamily="JetBrains Mono">{y}</text>
          </g>
        );
      })}
      <g transform={`translate(${PL}, 4)`}>
        <rect width="10" height="6" fill="#6bcb7788" rx="1" />
        <text x="14" y="6" fill="#bbbbdd" fontSize="9">{lang === 'ko' ? '생체' : 'Living'}</text>
        <rect x="60" width="10" height="6" fill="#ff922b88" rx="1" />
        <text x="74" y="6" fill="#bbbbdd" fontSize="9">{lang === 'ko' ? '뇌사' : 'Deceased'}</text>
      </g>
    </svg>
  );
}

function MortalityWorkforcePanel({ lang }) {
  const mort = ckd.eskd?.mortality;
  const wf = ckd.nephrologistWorkforce;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
      {/* Mortality */}
      <div>
        <div style={{ fontSize: '12px', color: '#ff6b6b', fontWeight: 700, marginBottom: '10px' }}>
          {t('ESKD 사망', 'ESKD Mortality', lang)}
        </div>
        {mort && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <MetricRow label={t('연간 사망자', 'Annual deaths', lang)} value={mort.annualDeaths2022?.toLocaleString()} unit="" color="#ff6b6b" />
            <MetricRow label={t('조사망률', 'Crude death rate', lang)} value={mort.crudeDeathRate} unit="/1000" color="#ff922b" />
            <MetricRow label={t('5년 생존율', '5yr survival', lang)} value={mort.fiveYearSurvival} unit="%" color="#6bcb77" />
            <div style={{ fontSize: '9px', color: '#aaaacc', marginTop: '4px' }}>{t(mort.note, mort.note, lang)}</div>
          </div>
        )}
      </div>
      {/* Workforce */}
      <div>
        <div style={{ fontSize: '12px', color: '#4d96ff', fontWeight: 700, marginBottom: '10px' }}>
          {t('투석전문의 현황 (2024)', 'Nephrologist Workforce (2024)', lang)}
        </div>
        {wf && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <MetricRow label={t('전문의 수', 'Nephrologists', lang)} value={wf.totalNephrologists2024?.toLocaleString()} unit={t('명', '', lang)} color="#4d96ff" />
            <MetricRow label={t('투석시설', 'Dialysis facilities', lang)} value={wf.dialysisFacilities2024?.toLocaleString()} unit={t('개소', '', lang)} color="#b388ff" />
            <MetricRow label={t('시설당 전문의', 'Per facility', lang)} value={wf.nephrologistPerFacility} unit={t('명', '', lang)} color="#ffd93d" />
            <div style={{ fontSize: '9px', color: '#aaaacc', marginTop: '4px' }}>{t(wf.shortageNote, wf.shortageNote, lang)}</div>
          </div>
        )}
      </div>
    </div>
  );
}

function ESKDCauseHorizontal({ lang }) {
  const causes = ckd.eskd?.causeDistribution;
  if (!causes) return null;

  const items = [
    { label: t('당뇨병', 'DM', lang), value: causes.diabetes, color: '#ff6b6b' },
    { label: t('고혈압', 'HTN', lang), value: causes.hypertension, color: '#ffd93d' },
    { label: t('사구체신염', 'GN', lang), value: causes.glomerulonephritis, color: '#4d96ff' },
    { label: t('다낭신', 'PKD', lang), value: causes.polycysticKidney, color: '#6bcb77' },
    { label: t('기타', 'Other', lang), value: causes.other, color: '#aaaacc' },
  ];

  return (
    <div>
      {/* Full-width stacked bar */}
      <div style={{ display: 'flex', height: '40px', borderRadius: '8px', overflow: 'hidden', marginBottom: '12px' }}>
        {items.map((item, i) => (
          <div key={i} style={{
            width: `${item.value}%`, background: item.color,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: item.value > 10 ? '11px' : '8px', color: '#000', fontWeight: 700, fontFamily: "'JetBrains Mono'",
          }}>
            {item.value > 5 ? `${item.label} ${item.value}%` : ''}
          </div>
        ))}
      </div>
      {/* Legend */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center' }}>
        {items.map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: item.color }} />
            <span style={{ fontSize: '11px', color: '#bbbbdd' }}>{item.label}</span>
            <span style={{ fontSize: '11px', color: item.color, fontFamily: "'JetBrains Mono'", fontWeight: 700 }}>{item.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
