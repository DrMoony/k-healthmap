import { useState } from 'react';
import { useLang } from '../i18n';
import { DISEASE_EPI, DISEASE_TIMESERIES } from '../data/disease_epi';
import { DM_KOSIS } from '../data/dm_kosis';
import CascadeWaterfall from '../components/CascadeWaterfall';
import InsightPanel from '../components/InsightPanel';

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
      <CascadeWaterfall
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
      <InsightPanel
        title={t('CKD Stage 분포 (20세 이상)', 'CKD Stage Distribution (≥20y)', lang)}
        source="Sci Rep 2023" sourceUrl="https://doi.org/10.1038/s41598-023-33377-2"
        details={[
          { label: t('전체 유병률', 'Total Prevalence', lang), value: '8.2', unit: '%', color: '#ff6b6b' },
          { label: 'Stage 1-2', value: '~5.3', unit: '%', color: '#4d96ff' },
          { label: 'Stage 3-5', value: '~2.9', unit: '%', color: '#ff922b' },
        ]}
        insight={{
          ko: 'CKD Stage 1-2가 전체 유병자의 약 65%를 차지하며, 알부민뇨 기준으로 분류됩니다. Stage 3 이상(eGFR <60)은 약 35%로, 조기 선별검사(알부민뇨 + eGFR)의 중요성을 시사합니다.',
          en: 'Stage 1-2 accounts for ~65% of all CKD, classified by albuminuria. Stage 3+ (eGFR <60) comprises ~35%, underscoring the importance of early screening with albuminuria + eGFR.',
        }}
      >
        <StageDistributionChart lang={lang} />
      </InsightPanel>

      {/* CKD Awareness Gap */}
      <InsightPanel
        title={t('CKD 인지율 Gap', 'CKD Awareness Gap', lang)}
        source="KSN 2024" sourceUrl="https://www.ksn.or.kr/"
        details={[
          { label: t('유병률', 'Prevalence', lang), value: '8.2', unit: '%', color: '#ff6b6b' },
          { label: t('인지율 상한', 'Awareness High', lang), value: '6.3', unit: '%', color: '#ffd93d' },
          { label: t('인지율 하한', 'Awareness Low', lang), value: '1.3', unit: '%', color: '#ff922b' },
        ]}
        insight={{
          ko: 'CKD 인지율은 1.3~6.3%로, 유병률 8.2%에 비해 극히 낮습니다. Stage 3 이상에서도 10% 미만만이 자신의 질환을 인지하며, 이는 한국의 CKD 조기 진단 인프라 확충이 시급함을 보여줍니다.',
          en: 'CKD awareness is only 1.3-6.3%, extremely low versus 8.2% prevalence. Even in Stage 3+, fewer than 10% are aware of their condition, highlighting an urgent need for improved CKD screening infrastructure in Korea.',
        }}
      >
        <AwarenessGapChart lang={lang} />
      </InsightPanel>

      {/* Age Distribution */}
      <InsightPanel
        title={t('연령대별 CKD 유병률', 'CKD Prevalence by Age', lang)}
        source="KNHANES" sourceUrl="https://www.ksn.or.kr/"
        details={[
          { label: t('70세 이상', '70+', lang), value: '28.3', unit: '%', color: '#ff6b6b' },
          { label: t('60대', '60s', lang), value: '~14', unit: '%', color: '#ffd93d' },
          { label: t('20-30대', '20-30s', lang), value: '<3', unit: '%', color: '#6bcb77' },
        ]}
        insight={{
          ko: '70세 이상에서 CKD 유병률이 28.3%에 달하며, 고령화 사회에서 CKD 부담이 급증하고 있습니다. 60대 이상에서 전체 CKD 환자의 절반 이상을 차지하므로, 노인 대상 신장기능 정기검사가 필수적입니다.',
          en: 'CKD prevalence reaches 28.3% in those aged 70+, with the aging population driving a rapid increase in CKD burden. Over half of all CKD patients are 60+, making routine kidney function screening essential for older adults.',
        }}
      >
        <AgeDistributionChart lang={lang} />
      </InsightPanel>

      {/* Cost Burden */}
      <InsightPanel
        title={t('CKD 의료비 부담', 'CKD Cost Burden', lang)}
        source="NHIS/KSN" sourceUrl="https://www.ksn.or.kr/"
        insight={{
          ko: '투석 환자 1인당 연간 약 3,000만원의 의료비가 소요되며, 이식 후 유지비는 연 600-800만원으로 투석 대비 경제적입니다. 전체 투석 비용은 건강보험 재정에 상당한 부담을 주고 있어, CKD 조기 발견 및 진행 억제가 비용 효율적 전략입니다.',
          en: 'Annual dialysis cost is ~30M KRW per patient, while post-transplant maintenance costs 6-8M KRW/year, making transplantation more cost-effective. Total dialysis expenditure places significant burden on national health insurance, emphasizing early CKD detection and progression prevention as cost-effective strategies.',
        }}
      >
        <CostBurdenPanel lang={lang} />
      </InsightPanel>

      {/* Regional kidney exam rate — full width */}
      <div style={{ gridColumn: '1 / -1' }}>
      <InsightPanel
        title={t(`시도별 당뇨환자 신장검사율 (${latestYear})`, `Regional DM Kidney Exam Rate (${latestYear})`, lang)}
        source="KOSIS HIRA" sourceUrl="https://kosis.kr/"
        insight={{
          ko: '당뇨환자의 신장검사율은 지역 간 편차가 큽니다. DKD 가이드라인(2024)은 당뇨 진단 시점부터 매년 eGFR과 소변 알부민-크레아티닌 비(UACR) 검사를 권고하지만, 실제 검사율은 전국 평균 40% 내외에 그치고 있습니다.',
          en: 'Kidney screening rates among diabetic patients vary significantly across regions. DKD guidelines (2024) recommend annual eGFR and UACR testing from diabetes diagnosis, but actual screening rates average only ~40% nationwide.',
        }}
      >
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
      </InsightPanel>
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
      <InsightPanel
        title={t('ESKD 발생률 추이 (백만명당)', 'ESKD Incidence Trend (per million)', lang)}
        source="KORDS 2010-2022" sourceUrl="https://www.ksn.or.kr/"
        details={[
          { label: '2022', value: '~310', unit: t('/백만', '/M', lang), color: '#ff6b6b' },
          { label: t('연평균 증가', 'Avg Growth', lang), value: '~3', unit: '%/yr', color: '#ffd93d' },
        ]}
        insight={{
          ko: 'ESKD 발생률은 2010년 이후 꾸준히 증가하여 2022년 약 310명/백만명에 달합니다. 당뇨와 고혈압의 증가, 고령화가 주요 원인이며, CKD 진행 억제를 위한 조기 개입(SGLT2i, RASi 등)이 ESKD 발생을 줄이는 핵심 전략입니다.',
          en: 'ESKD incidence has steadily risen since 2010, reaching ~310 per million in 2022. Increasing diabetes, hypertension, and aging are key drivers. Early intervention with SGLT2i and RAS inhibitors to slow CKD progression is the primary strategy to reduce ESKD incidence.',
        }}
      >
        <ESKDIncidenceChart lang={lang} />
      </InsightPanel>

      {/* ESKD Prevalence Trend */}
      <InsightPanel
        title={t('ESKD 유병환자 추이', 'ESKD Prevalent Patients Trend', lang)}
        source="KORDS 2010-2022" sourceUrl="https://www.ksn.or.kr/"
        details={[
          { label: '2022', value: '135,345', unit: t('명', 'pts', lang), color: '#ffd93d' },
          { label: t('10년 증가', '10yr Growth', lang), value: '~60', unit: '%', color: '#ff922b' },
        ]}
        insight={{
          ko: 'ESKD 유병환자는 2022년 13.5만명으로, 10년간 약 60% 증가했습니다. 투석 생존율 개선과 신규 환자 지속 유입이 동시에 작용하여, 의료 인프라와 재정 부담이 계속 커지고 있습니다.',
          en: 'ESKD prevalent patients reached 135,345 in 2022, a ~60% increase over 10 years. Improved dialysis survival and continuous new patient influx both contribute, placing growing strain on healthcare infrastructure and finances.',
        }}
      >
        <ESKDPrevalenceChart lang={lang} />
      </InsightPanel>

      {/* Dialysis Modality */}
      <InsightPanel
        title={t('투석 방법 (HD vs PD)', 'Dialysis Modality (HD vs PD)', lang)}
        source="KORDS 2022" sourceUrl="https://www.ksn.or.kr/"
        details={[
          { label: t('혈액투석', 'HD', lang), value: '91.2', unit: '%', color: '#4d96ff' },
          { label: t('복막투석', 'PD', lang), value: '8.8', unit: '%', color: '#e599f7' },
        ]}
        insight={{
          ko: '한국은 HD(혈액투석) 비율이 91.2%로 PD(복막투석) 대비 압도적입니다. 국제적으로 PD 비율이 15-30%인 점과 비교하면 한국의 PD 활용이 저조하며, 가정 기반 투석(home dialysis) 확대 정책이 논의되고 있습니다.',
          en: 'Korea has a 91.2% HD vs 8.8% PD ratio, far below the global PD rate of 15-30%. This highlights underutilization of peritoneal dialysis, with policy discussions ongoing to expand home-based dialysis options.',
        }}
      >
        <DialysisDonut lang={lang} />
      </InsightPanel>

      {/* Dialysis Trend */}
      <InsightPanel
        title={t('투석 환자수 추이', 'Dialysis Patient Trend', lang)}
        source="KORDS 2010-2022" sourceUrl="https://www.ksn.or.kr/"
        details={[
          { label: '2022 HD', value: '107,370', unit: t('명', 'pts', lang), color: '#4d96ff' },
          { label: '2022 PD', value: '10,328', unit: t('명', 'pts', lang), color: '#e599f7' },
        ]}
        insight={{
          ko: '투석 환자수는 2010년 이후 꾸준히 증가하여 2022년 약 11.8만명입니다. HD 환자 비율이 지속적으로 증가하는 반면, PD 환자 수는 정체 또는 감소 추세를 보이고 있습니다.',
          en: 'Total dialysis patients have steadily increased to ~118K in 2022. HD patient numbers continue to grow, while PD numbers remain stagnant or declining.',
        }}
      >
        <DialysisTrendChart lang={lang} />
      </InsightPanel>

      {/* ESKD Cause Distribution */}
      <InsightPanel
        title={t('ESKD 원인질환 분포', 'ESKD Cause Distribution', lang)}
        source="KORDS 2022" sourceUrl="https://www.ksn.or.kr/"
        details={[
          { label: t('당뇨', 'DM', lang), value: '48.3', unit: '%', color: '#ff6b6b' },
          { label: t('고혈압', 'HTN', lang), value: '21.6', unit: '%', color: '#ffd93d' },
          { label: t('사구체신염', 'GN', lang), value: '7.8', unit: '%', color: '#4d96ff' },
        ]}
        insight={{
          ko: 'ESKD의 가장 큰 원인은 당뇨병(48.3%)이며, 고혈압(21.6%)이 뒤를 잇습니다. 두 질환이 전체 ESKD의 70%를 차지하므로, 당뇨와 고혈압의 적극적 관리가 ESKD 예방의 핵심입니다.',
          en: 'Diabetes (48.3%) is the leading cause of ESKD, followed by hypertension (21.6%). Together they account for 70% of all ESKD, making aggressive management of these conditions the cornerstone of ESKD prevention.',
        }}
      >
        <ESKDCauseChart lang={lang} />
      </InsightPanel>

      {/* Transplant Trend */}
      <InsightPanel
        title={t('신장이식 추이 (생체 vs 뇌사)', 'Transplant Trend (Living vs Deceased)', lang)}
        source="KORDS 2010-2022" sourceUrl="https://www.ksn.or.kr/"
        details={[
          { label: '2022', value: '2,164', unit: t('건', 'cases', lang), color: '#6bcb77' },
          { label: t('생체이식', 'Living', lang), value: '~55', unit: '%', color: '#6bcb77' },
          { label: t('뇌사이식', 'Deceased', lang), value: '~45', unit: '%', color: '#ff922b' },
        ]}
        insight={{
          ko: '2022년 신장이식 2,164건 중 생체이식이 약 55%를 차지합니다. ESKD 유병환자 13.5만명 대비 연간 이식 건수는 1.6%에 불과하여, 장기 기증 활성화 및 대기 시간 단축이 시급합니다.',
          en: '2,164 kidney transplants were performed in 2022, with living donors accounting for ~55%. Only 1.6% of ESKD patients receive a transplant annually, underscoring the urgent need to increase organ donation and reduce wait times.',
        }}
      >
        <TransplantChart lang={lang} />
      </InsightPanel>

      {/* Mortality & Workforce */}
      <div style={{ gridColumn: '1 / -1' }}>
      <InsightPanel
        title={t('ESKD 사망 및 투석전문의 현황', 'ESKD Mortality & Workforce', lang)}
        source="KSN 2024" sourceUrl="https://www.ksn.or.kr/"
        insight={{
          ko: 'ESKD 환자의 5년 생존율은 약 60%로, 일반 인구 대비 현저히 낮습니다. 투석전문의 1인당 담당 환자 수가 증가하고 있어, 전문 인력 확충이 필요합니다. 이식 후 생존율은 투석 대비 유의하게 높습니다.',
          en: 'Five-year survival for ESKD patients is ~60%, significantly lower than the general population. The nephrologist-to-patient ratio is worsening, necessitating workforce expansion. Post-transplant survival is significantly better than dialysis.',
        }}
      >
        <MortalityWorkforcePanel lang={lang} />
      </InsightPanel>
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
      <InsightPanel
        title={t('당뇨병콩팥병 (DKD) 핵심 지표', 'Diabetic Kidney Disease Key Metrics', lang)}
        source="DKD GL 2024" sourceUrl="https://www.ksn.or.kr/"
        details={[
          { label: t('DM 중 CKD', 'CKD in DM', lang), value: '25-40', unit: '%', color: '#ff6b6b' },
          { label: t('ESKD 원인 DM', 'DM in ESKD', lang), value: '48.3', unit: '%', color: '#ffd93d' },
        ]}
        insight={{
          ko: '당뇨병은 ESKD의 최대 원인(48.3%)이며, 당뇨환자의 25-40%에서 CKD가 동반됩니다. SGLT2 억제제, Finerenone 등 최신 치료제가 DKD 진행을 유의하게 지연시키는 것으로 입증되어, 조기 DKD 선별과 적극적 치료가 핵심입니다.',
          en: 'Diabetes is the leading cause of ESKD (48.3%), with 25-40% of diabetic patients developing CKD. SGLT2 inhibitors and finerenone have proven to significantly delay DKD progression, making early screening and aggressive treatment essential.',
        }}
      >
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
      </InsightPanel>

      {/* HTN + CKD */}
      <InsightPanel
        title={t('고혈압 + CKD 관련', 'Hypertension + CKD', lang)}
        source="HTN-CKD GL 2025" sourceUrl="https://www.ksn.or.kr/"
        details={[
          { label: t('HTN 중 CKD', 'CKD in HTN', lang), value: ckd.htnCkdOverlap?.ckdAmongHTN || '—', unit: '%', color: '#ff922b' },
          { label: t('ESKD 원인 HTN', 'HTN in ESKD', lang), value: ckd.htnCkdOverlap?.htnAmongESKD || '—', unit: '%', color: '#e599f7' },
        ]}
        insight={{
          ko: '고혈압은 ESKD의 두 번째 원인(21.6%)이며, 고혈압 환자의 상당수가 CKD를 동반합니다. RAS 차단제 기반의 혈압 조절(목표 <130/80 mmHg)이 CKD 진행 억제의 핵심이며, 단백뇨 동반 시 더욱 적극적인 관리가 필요합니다.',
          en: 'Hypertension is the second leading cause of ESKD (21.6%), with a significant proportion of hypertensive patients having concurrent CKD. RAS inhibitor-based BP control (target <130/80 mmHg) is key to slowing CKD progression, with more aggressive management needed when proteinuria is present.',
        }}
      >
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
      </InsightPanel>

      {/* DKD vs Non-DKD ESKD cause pie comparison */}
      <div style={{ gridColumn: '1 / -1' }}>
      <InsightPanel
        title={t('ESKD 원인별 비율 — 당뇨가 압도적 1위', 'ESKD by Cause — Diabetes Dominates', lang)}
        source="KORDS 2022" sourceUrl="https://www.ksn.or.kr/"
        details={[
          { label: t('당뇨', 'DM', lang), value: '48.3', unit: '%', color: '#ff6b6b' },
          { label: t('고혈압', 'HTN', lang), value: '21.6', unit: '%', color: '#ffd93d' },
          { label: t('사구체신염', 'GN', lang), value: '7.8', unit: '%', color: '#4d96ff' },
          { label: t('다낭신', 'PKD', lang), value: '2.1', unit: '%', color: '#6bcb77' },
        ]}
        insight={{
          ko: '당뇨병이 ESKD 원인의 거의 절반(48.3%)을 차지하여 압도적 1위입니다. 당뇨+고혈압 합산 69.9%로, 대사질환 관리가 곧 말기신질환 예방의 핵심임을 명확히 보여줍니다.',
          en: 'Diabetes accounts for nearly half (48.3%) of all ESKD causes, overwhelmingly the #1 factor. Combined with hypertension (69.9%), this clearly demonstrates that metabolic disease management is the cornerstone of ESKD prevention.',
        }}
      >
        <ESKDCauseHorizontal lang={lang} />
      </InsightPanel>
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
