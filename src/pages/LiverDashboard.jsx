import React, { useState } from 'react';
import { useLang } from '../i18n';
import { DISEASE_EPI } from '../data/disease_epi';
import { LIVER_WP } from '../data/liver_whitepaper';
import CascadeWaterfall from '../components/CascadeWaterfall';
import InsightPanel from '../components/InsightPanel';

const t = (ko, en, lang) => lang === 'ko' ? ko : en;

export default function LiverDashboard() {
  const { lang } = useLang();
  const [subTab, setSubTab] = useState('masld');

  const masld = DISEASE_EPI.diseases.nafld;
  const mash = DISEASE_EPI.diseases.mash;
  const lc = DISEASE_EPI.diseases.lc_hcc;

  const subTabs = [
    { id: 'masld', label: 'MASLD/MASH', icon: '🫁' },
    { id: 'viral', label: t('바이러스 간염', 'Viral Hepatitis', lang), icon: '🦠' },
    { id: 'ald', label: t('알코올 간질환', 'ALD', lang), icon: '🍺' },
    { id: 'progression', label: t('간질환 진행', 'Progression', lang), icon: '📈' },
  ];

  return (
    <div style={{ padding: '76px 24px 24px', maxWidth: '1400px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#fff', margin: '0 0 8px', fontFamily: "'Noto Sans KR'" }}>
        {t('🫁 간건강 대시보드', '🫁 Liver Health Dashboard', lang)}
      </h1>
      <div style={{ fontSize: '12px', color: '#aaaacc', marginBottom: '20px' }}>
        {t('출처: KASL NAFLD FS 2023, MASLD GL 2025, 간질환 백서 2024, HBV/HCV/ALD FS',
           'Source: KASL NAFLD FS 2023, MASLD GL 2025, Liver White Paper 2024, HBV/HCV/ALD FS', lang)}
      </div>

      {/* Sub-tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        {subTabs.map(st => (
          <button key={st.id} onClick={() => setSubTab(st.id)} style={{
            padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px',
            fontFamily: "'Noto Sans KR'",
            background: subTab === st.id ? 'rgba(107,203,119,0.15)' : 'rgba(255,255,255,0.03)',
            border: subTab === st.id ? '1px solid rgba(107,203,119,0.4)' : '1px solid rgba(255,255,255,0.06)',
            color: subTab === st.id ? '#6bcb77' : '#bbbbdd',
            fontWeight: subTab === st.id ? 600 : 400,
          }}>
            {st.icon} {st.label}
          </button>
        ))}
      </div>

      {subTab === 'masld' && <MASLDPanel masld={masld} mash={mash} lang={lang} />}
      {subTab === 'viral' && <ViralPanel lang={lang} />}
      {subTab === 'ald' && <ALDPanel lang={lang} />}
      {subTab === 'progression' && <ProgressionPanel masld={masld} mash={mash} lc={lc} lang={lang} />}

      {/* MASLD Progression Funnel */}
      <CascadeWaterfall
        title={t('MASLD 질병 진행 펀넬 (성인, 만 단위)', 'MASLD Disease Progression Funnel (Adults, in 10K)', lang)}
        source="KASL 2025, NHIS"
        totalPop={3600}
        totalLabel={t('성인 인구', 'Adult Pop.', lang)}
        lossLabel={t('비MASLD', 'no MASLD', lang)}
        endLabel="HCC"
        stages={[
          { label: 'MASLD', count: 768, color: '#00ff88', note: t('NHIS 청구', 'NHIS claims', lang) },
          { label: 'MASH', count: 153, color: '#2ecc71', note: '~20%' },
          { label: t('진행성 섬유화', 'Adv. Fibrosis', lang), count: 30, color: '#e67e22', note: 'F3-F4 19.4%' },
          { label: t('간경변', 'Cirrhosis', lang), count: 6, color: '#e74c3c', note: '10yr 3.7%' },
          { label: 'HCC', count: 1, color: '#c0392b', note: t('연 1-3%', '1-3%/yr', lang) },
        ]}
      />
    </div>
  );
}

function MASLDPanel({ masld, mash, lang }) {
  const pipeline = mash?.pipeline?.stages || [];
  const mortalityHR = mash?.mortalityHR || {};
  const fibrosis = mash?.fibrosis || {};
  const koreaP = mash?.koreaPrevalence || {};
  const global = mash?.global || {};

  const kpis = [
    { label: t('글로벌 MASLD', 'Global MASLD', lang), value: global.masldPrevalence, unit: '%', sub: 'Younossi 2023', color: '#6bcb77',
      refUrl: 'https://pubmed.ncbi.nlm.nih.gov/36626630/', refLabel: 'Hepatology 2023' },
    { label: t('한국 MASLD', 'Korea MASLD', lang), value: koreaP.masld_healthCheckup?.value, unit: '%', sub: t(`건보 ${(koreaP.masld_healthCheckup?.n/10000).toFixed(0)}만명`, `NHIS ${(koreaP.masld_healthCheckup?.n/1000000).toFixed(1)}M`, lang), color: '#4d96ff',
      refUrl: 'https://www.e-cmh.org/', refLabel: 'KASL GL 2025' },
    { label: t('T2DM 중 MASLD', 'MASLD in T2DM', lang), value: global.masldInT2DM, unit: '%', sub: t('2형당뇨 환자 중', 'among T2DM pts', lang), color: '#ffd93d',
      refUrl: 'https://pubmed.ncbi.nlm.nih.gov/38521116/', refLabel: 'Younossi 2024 CGH' },
    { label: t('진단 환자수', 'Diagnosed', lang), value: '768만', unit: '', sub: t('NHIS 청구 기준, 실제 유병 ~1,500-2,200만 추정', 'NHIS claims; true prevalence est. 15-22M', lang), color: '#ff922b',
      refUrl: 'https://www.kasl.org/', refLabel: 'KASL FS 2023' },
    { label: t('MASH 진단', 'MASH Dx', lang), value: mash?.koreaMASH?.prevalencePer1000?.y2021, unit: '/1000', sub: '2021 NHIS', color: '#e599f7',
      refUrl: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10744038/', refLabel: 'JCM 2023' },
    { label: t('간경변 위험', 'Cirrhosis Risk', lang), value: fibrosis.progressionRate?.tenYearCirrhosis, unit: '%', sub: t('10년', '10yr', lang), color: '#ff6b6b',
      refUrl: 'https://www.e-cmh.org/', refLabel: 'KASL GL 2025' },
  ];

  // Pipeline colors + refs
  const pipeColors = ['#6bcb77', '#ffd93d', '#ff922b', '#ff6b6b', '#e599f7'];
  const pipeRefs = [
    { label: 'Younossi 2023 / KASL GL 2025', url: 'https://pubmed.ncbi.nlm.nih.gov/36626630/' },
    { label: 'JCM 2023 (PMC10744038)', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10744038/' },
    { label: 'Quek 2023 / KASL GL ref 82', url: 'https://pubmed.ncbi.nlm.nih.gov/33833135/' },
    { label: 'KASL GL 2025 refs 87-91', url: 'https://www.e-cmh.org/' },
    { label: 'KASL GL 2025 refs 64-72', url: 'https://www.e-cmh.org/' },
  ];

  return (
    <>
      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '10px', marginBottom: '20px' }}>
        {kpis.map((kpi, i) => (
          <div key={i} style={{
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '12px', padding: '14px', position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: kpi.color, opacity: 0.6 }} />
            <div style={{ fontSize: '10px', color: '#bbbbdd', marginBottom: '6px' }}>{kpi.label}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px' }}>
              <span style={{ fontSize: '22px', fontWeight: 800, color: kpi.color, fontFamily: "'JetBrains Mono'" }}>{kpi.value ?? '—'}</span>
              <span style={{ fontSize: '10px', color: '#aaaacc' }}>{kpi.unit}</span>
            </div>
            {kpi.sub && <div style={{ fontSize: '9px', color: '#9999bb', marginTop: '4px' }}>{kpi.sub}</div>}
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

      {/* Liver Disease Mortality Trend (1989-2022) */}
      <InsightPanel
        title={t('간질환 사망률 추이 (1989-2022)', 'Liver Disease Mortality Trend (1989-2022)', lang)}
        source="간질환 백서 2024"
        details={[
          { label: t('간질환 사망', 'Liver Disease Deaths', lang), value: '7,541', unit: t('명', '', lang), color: '#ff6b6b' },
          { label: t('간암 사망', 'HCC Deaths', lang), value: '10,212', unit: t('명', '', lang), color: '#4d96ff' },
          { label: t('합계', 'Total', lang), value: '17,753', unit: t('명', '', lang), color: '#ffd93d' },
        ]}
        insight={{
          ko: '간경변 사망률은 30년간 29→13으로 55% 감소했으나, 간암 사망률은 22→20으로 거의 변화 없음. 한국은 OECD 간암 사망률 1위.',
          en: 'Cirrhosis mortality decreased 55% over 30 years (29→13), but HCC mortality barely changed (22→20). Korea ranks 1st in OECD for HCC mortality.',
        }}
      >
        <LiverMortalityChart lang={lang} />
      </InsightPanel>

      {/* MASLD → MASH → Fibrosis → Cirrhosis → HCC Pipeline */}
      <InsightPanel
        title={t('MASLD → MASH 진행 파이프라인', 'MASLD → MASH Progression Pipeline', lang)}
        source="KASL GL 2025 refs 82-95"
        sourceUrl="https://www.e-cmh.org/"
        details={[
          { label: t('글로벌 MASLD', 'Global MASLD', lang), value: '30', unit: '%', color: '#6bcb77' },
          { label: t('MASH 비율', 'MASH Rate', lang), value: '~20', unit: '%', color: '#ffd93d' },
          { label: t('10년 간경변', '10yr Cirrhosis', lang), value: '3.7', unit: '%', color: '#ff6b6b' },
        ]}
        insight={{
          ko: 'MASLD의 약 20%가 MASH로 진행하며, MASH 환자의 섬유화 진행 속도는 단순지방간 대비 2배 빠릅니다. KASL 2025 가이드라인에서는 섬유화 단계가 전체사망률의 독립 예측인자로, F3-F4 진행 시 간경변·HCC 위험이 급격히 증가합니다.',
          en: 'About 20% of MASLD progresses to MASH, with fibrosis advancing 2x faster than simple steatosis. Per KASL 2025 guidelines, fibrosis stage is an independent predictor of all-cause mortality, with F3-F4 markedly increasing cirrhosis and HCC risk.',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0' }}>
          {pipeline.map((stage, i) => (
            <div key={stage.id} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
              <div style={{
                flex: 1, padding: '16px 12px', borderRadius: '10px', textAlign: 'center',
                background: `${pipeColors[i]}11`, border: `1px solid ${pipeColors[i]}33`,
                position: 'relative',
              }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: pipeColors[i], marginBottom: '4px' }}>
                  {lang === 'ko' ? stage.label : stage.labelEn}
                </div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#fff', fontFamily: "'JetBrains Mono'" }}>
                  {stage.prevalence}
                </div>
                <div style={{ fontSize: '9px', color: '#aaaacc', marginTop: '4px' }}>
                  {stage.note}
                </div>
                {/* Mortality HR below */}
                {mash?.pipeline?.mortalityMultiplier?.[i] > 1 && (
                  <div style={{
                    marginTop: '8px', padding: '3px 8px', borderRadius: '4px',
                    background: 'rgba(255,100,100,0.1)', fontSize: '10px', color: '#ff6b6b',
                  }}>
                    HR {mash.pipeline.mortalityMultiplier[i]}x
                  </div>
                )}
                {pipeRefs[i] && (
                  <a href={pipeRefs[i].url} target="_blank" rel="noopener noreferrer"
                    style={{ fontSize: '7px', color: '#00d4ff66', textDecoration: 'none', marginTop: '4px', display: 'block' }}>
                    📎 {pipeRefs[i].label}
                  </a>
                )}
              </div>
              {i < pipeline.length - 1 && (
                <div style={{ padding: '0 4px', color: '#444', fontSize: '18px' }}>→</div>
              )}
            </div>
          ))}
        </div>
        <div style={{ marginTop: '12px', fontSize: '10px', color: '#9999bb', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <span>⏱ NASH→F1: {fibrosis.progressionRate?.nash_to_F1}{t('년', 'yr', lang)} (NAFL: {fibrosis.progressionRate?.nafl_to_F1}{t('년', 'yr', lang)})</span>
          <span>📊 {t('사망위험배수: NAFL 1.71x → MASH 2.14x → 간경변 3.79x', 'Mortality HR: NAFL 1.71x → MASH 2.14x → Cirrhosis 3.79x', lang)}</span>
        </div>
      </InsightPanel>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {/* Fibrosis breakdown: MASLD vs MASH */}
        <InsightPanel
          title={t('MASLD 섬유화 진행 및 예후', 'MASLD Fibrosis Progression & Prognosis', lang)}
          source="KASL GL 2025, Singh 2015"
          sourceUrl="https://www.e-cmh.org/"
          details={[
            { label: t('NAFL→F1', 'NAFL→F1', lang), value: fibrosis.progressionRate?.nafl_to_F1 || '—', unit: t('년', 'yr', lang), color: '#6bcb77' },
            { label: t('MASH→F1', 'MASH→F1', lang), value: fibrosis.progressionRate?.nash_to_F1 || '—', unit: t('년', 'yr', lang), color: '#ff922b' },
            { label: 'F2+', value: fibrosis.masldF2plus || '—', unit: '%', color: '#e599f7' },
          ]}
          insight={{
            ko: 'MASH의 섬유화 진행 속도는 단순지방간(NAFL) 대비 약 2배 빠르며, 10년 간경변 전환율은 3.7%입니다. KASL 2025에서는 비침습적 섬유화 평가(FIB-4, NFS)를 1차 선별 도구로 권고합니다.',
            en: 'MASH fibrosis progresses ~2x faster than NAFL, with 3.7% 10-year cirrhosis conversion. KASL 2025 recommends non-invasive fibrosis assessment (FIB-4, NFS) as first-line screening tools.',
          }}
        >
          <FibrosisProgression fibrosis={fibrosis} lang={lang} />
        </InsightPanel>

        {/* Mortality HR staircase */}
        <InsightPanel
          title={t('전체사망률 위험배수 (HR)', 'All-cause Mortality HR', lang)}
          source="Simon 2021 Gut"
          sourceUrl="https://pubmed.ncbi.nlm.nih.gov/33592475/"
          details={[
            { label: 'NAFL', value: '1.71', unit: 'x', color: '#6bcb77' },
            { label: 'MASH', value: '2.14', unit: 'x', color: '#ffd93d' },
            { label: t('간경변', 'Cirrhosis', lang), value: '3.79', unit: 'x', color: '#ff6b6b' },
          ]}
          insight={{
            ko: '간 질환 단계별 전체사망률 HR은 단순지방간 1.71배, MASH 2.14배, 간경변 3.79배로, 질환이 진행될수록 사망 위험이 기하급수적으로 증가합니다. 섬유화 동반 시 HR이 더욱 상승하며, 이는 조기 선별의 중요성을 뒷받침합니다 (KASL 2025).',
            en: 'All-cause mortality HR escalates from NAFL 1.71x to MASH 2.14x to cirrhosis 3.79x, showing exponential risk increase with disease progression. Fibrosis further elevates HR, underscoring the importance of early screening (KASL 2025).',
          }}
        >
          <MortalityStaircase hr={mortalityHR} lang={lang} />
        </InsightPanel>

        {/* Comorbidity 2012 vs 2022 */}
        <InsightPanel
          title={t('동반질환 변화 (2012 vs 2022)', 'Comorbidity Change (2012 vs 2022)', lang)}
          source="KASL NAFLD FS 2023"
          sourceUrl="https://www.kasl.org/"
          insight={{
            ko: 'MASLD 환자의 동반질환 유병률은 10년간 전반적으로 증가했으며, 특히 제2형 당뇨병, 이상지질혈증, 고혈압 동반율이 현저히 높습니다. KASL 2025에서는 MASLD를 다장기 대사질환으로 접근할 것을 권고합니다.',
            en: 'MASLD comorbidity prevalence increased over 10 years, particularly T2DM, dyslipidemia, and hypertension. KASL 2025 recommends approaching MASLD as a multi-organ metabolic disease.',
          }}
        >
          <div style={{ fontSize: '12px', color: '#bbbbdd' }}>
            {masld.comorbidities2022 ? Object.entries(masld.comorbidities2022).map(([k, v]) => {
              const pct = typeof v === 'object' && v !== null ? v.percent : (typeof v === 'number' ? v : null);
              const pts = typeof v === 'object' && v !== null ? v.patients : null;
              return (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                  <span>{k}</span>
                  <span style={{ color: '#6bcb77', fontFamily: "'JetBrains Mono'" }}>
                    {pct != null ? `${pct}%` : '—'}{pts ? ` (${(pts/10000).toFixed(1)}만)` : ''}
                  </span>
                </div>
              );
            }) : <span style={{ color: '#9999bb' }}>{t('네트워크 탭에서 확인', 'See Network tab', lang)}</span>}
          </div>
        </InsightPanel>

        {/* Cost */}
        <InsightPanel
          title={t('의료비 부담', 'Medical Cost Burden', lang)}
          source="KASL Matched Cohort"
          sourceUrl="https://www.kasl.org/"
          details={[
            { label: t('1인당 연간', 'Per Patient/yr', lang), value: '212', unit: t('만원', '0K KRW', lang), color: '#ffd93d' },
            { label: t('초과비용', 'Excess Cost', lang), value: '97', unit: t('만원/년', '0K/yr', lang), color: '#ff922b' },
            { label: t('총 초과비용', 'Total Excess', lang), value: '7.5', unit: t('조원', 'T KRW', lang), color: '#ff6b6b' },
          ]}
          insight={{
            ko: 'MASLD 환자의 1인당 연간 의료비는 212만원으로 대조군 대비 97만원 초과합니다. 768만 환자 기준 연간 총 초과 의료비는 약 7.5조원에 달하며, 이는 국가 의료비 부담의 주요 요인입니다.',
            en: 'Per-patient annual cost is ₩2.12M, ₩970K above matched controls. Applied to 7.68M patients, the total excess burden reaches ~₩7.5 trillion annually, representing a significant national healthcare cost driver.',
          }}
        >
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#ffd93d', fontFamily: "'JetBrains Mono'", marginBottom: '8px' }}>
            ₩212{t('만', '0K', lang)}/{t('년', 'yr', lang)}
          </div>
          <div style={{ fontSize: '12px', color: '#bbbbdd' }}>
            {t('1인당 연간 총 의료비 (KASL 매칭 코호트)', 'Per-patient annual total cost (KASL matched cohort)', lang)}
          </div>
          <div style={{ marginTop: '8px', padding: '8px', background: 'rgba(255,217,61,0.05)', borderRadius: '6px', fontSize: '11px', color: '#ffd93d' }}>
            {t('초과비용 97만원/년 (대조군 115만 대비)', 'Excess cost ₩970K/yr (vs ₩1.15M control)', lang)}
          </div>
          <div style={{ marginTop: '6px', padding: '8px', background: 'rgba(255,107,107,0.05)', borderRadius: '6px', fontSize: '11px', color: '#ff6b6b' }}>
            768만 × 97만 = {t('총 초과비용 약 7.5조원', 'Total excess ~₩7.5T', lang)}
          </div>
        </InsightPanel>
      </div>

      {/* MASH caveat */}
      <div style={{
        marginTop: '12px', padding: '10px 14px', background: 'rgba(255,217,61,0.05)',
        borderRadius: '8px', border: '1px solid rgba(255,217,61,0.15)',
        fontSize: '10px', color: '#aa9944', lineHeight: 1.5,
      }}>
        ⚠️ {t(
          'MASH 진단 기반 유병률(9.79/1000)은 실제 유병률의 약 10% 수준. 증가 추세는 주로 진단 인식 향상을 반영.',
          'Claims-based MASH prevalence (9.79/1000) represents ~10% of true prevalence. Rising trend mainly reflects increased diagnostic awareness.',
          lang
        )}
      </div>
      <div style={{ marginTop: '8px', fontSize: '10px', color: '#444' }}>
        {masld.ref} | KASL GL 2025 | Younossi 2023, 2024
      </div>
    </>
  );
}

function FibrosisProgression({ fibrosis, lang }) {
  const rate = fibrosis.progressionRate || {};
  const items = [
    { label: t('단순지방간 → F1 진행', 'NAFL → F1 Progression', lang), value: `${rate.nafl_to_F1}${t('년', 'yr', lang)}`, color: '#6bcb77', sub: t('느린 진행', 'Slow', lang) },
    { label: t('지방간염 → F1 진행', 'MASH → F1 Progression', lang), value: `${rate.nash_to_F1}${t('년', 'yr', lang)}`, color: '#ff922b', sub: t('2배 빠름', '2x faster', lang) },
    { label: t('3년 섬유화 진행률', '3yr Fibrosis Progression', lang), value: `${fibrosis.threeYearProgression}%`, color: '#ffd93d' },
    { label: t('5년 간경변 발생률', '5yr Cirrhosis Rate', lang), value: `${rate.fiveYearCirrhosis}%`, color: '#ff6b6b' },
    { label: t('10년 간경변 발생률', '10yr Cirrhosis Rate', lang), value: `${rate.tenYearCirrhosis}%`, color: '#ff6b6b' },
    { label: t('유의한 섬유화(F2+) 동반', 'Significant Fibrosis (F2+)', lang), value: `${fibrosis.masldF2plus}%`, color: '#e599f7', sub: t('조직검사 확인', 'Biopsy-confirmed', lang) },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {items.map((item, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
          <div style={{ flex: 1, fontSize: '12px', color: '#bbbbdd' }}>{item.label}</div>
          <div style={{ fontSize: '18px', fontWeight: 800, color: item.color, fontFamily: "'JetBrains Mono'", minWidth: '70px', textAlign: 'right' }}>
            {item.value}
          </div>
          {item.sub && <div style={{ fontSize: '9px', color: '#9999bb', minWidth: '50px' }}>{item.sub}</div>}
        </div>
      ))}
      <div style={{ fontSize: '9px', color: '#9999bb', display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
        <a href="https://www.e-cmh.org/" target="_blank" rel="noopener noreferrer" style={{ color: '#00d4ff88', textDecoration: 'none' }}>
          📎 KASL GL 2025 refs 82-91
        </a>
        <span style={{ color: '#444' }}>Singh 2015, {t('미국 VA 코호트', 'US VA cohort', lang)}</span>
      </div>
    </div>
  );
}

function MortalityStaircase({ hr, lang }) {
  const stages = [
    { label: t('일반인구', 'General', lang), value: 1.0, color: '#bbbbdd' },
    { label: t('단순지방간', 'NAFL', lang), value: hr.nafl, color: '#6bcb77' },
    { label: t('지방간염', 'NASH/MASH', lang), value: hr.nash, color: '#ffd93d' },
    { label: t('+섬유화', '+Fibrosis', lang), value: hr.nashWithFibrosis, color: '#ff922b' },
    { label: t('간경변', 'Cirrhosis', lang), value: hr.cirrhosis, color: '#ff6b6b' },
  ];
  const maxHR = 4;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '170px', padding: '0 8px' }}>
        {stages.map((s, i) => {
          const h = s.value ? (s.value / maxHR) * 140 : 0;
          return (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ fontSize: '16px', fontWeight: 800, color: s.color, marginBottom: '4px', fontFamily: "'JetBrains Mono'" }}>
                {s.value}x
              </div>
              <div style={{
                width: '100%', height: `${h}px`,
                background: `linear-gradient(to top, ${s.color}22, ${s.color}66)`,
                borderRadius: '6px 6px 0 0', border: `1px solid ${s.color}44`, borderBottom: 'none',
              }} />
              <div style={{ fontSize: '10px', color: '#bbbbdd', marginTop: '6px', textAlign: 'center', lineHeight: 1.2 }}>{s.label}</div>
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: '8px', fontSize: '9px', color: '#9999bb', display: 'flex', gap: '6px', alignItems: 'center' }}>
        <span>{t('전체사망률 HR, 일반인구 대비', 'All-cause mortality HR vs general pop.', lang)}</span>
        <a href="https://pubmed.ncbi.nlm.nih.gov/33592475/" target="_blank" rel="noopener noreferrer" style={{ color: '#00d4ff88', textDecoration: 'none' }}>
          📎 Simon 2021 Gut
        </a>
        <span style={{ color: '#444' }}>via KASL GL 2025 ref 95</span>
      </div>
    </div>
  );
}

function ViralPanel({ lang }) {
  const hbv = DISEASE_EPI.diseases.hbv;
  const hcv = DISEASE_EPI.diseases.hcv;

  const hbvKpis = [
    { label: t('HBsAg 양성률', 'HBsAg Prevalence', lang), value: hbv.hbsAgPrevalence.y2019_2021, unit: '%', sub: t('2019-2021 KNHANES', '2019-2021 KNHANES', lang), color: '#4d96ff' },
    { label: t('HBsAg (남성)', 'HBsAg (Male)', lang), value: hbv.hbsAgPrevalence.male, unit: '%', sub: t('여성 1.9%', 'Female 1.9%', lang), color: '#6bcb77' },
    { label: t('Anti-HBs 보유율', 'Anti-HBs Rate', lang), value: hbv.antiHBs.overall, unit: '%', sub: t('항체 보유 (2019-2021)', 'Antibody (2019-2021)', lang), color: '#ffd93d' },
    { label: t('만성 B형간염 환자', 'Chronic HBV Patients', lang), value: '49만', unit: t('명', '', lang), sub: t('NHIS 2021 청구기준', 'NHIS 2021 claims', lang), color: '#ff922b' },
    { label: t('신생아 접종률', 'Newborn Vaccination', lang), value: hbv.vaccination.newbornCoverage, unit: '%', sub: t('1995년 국가예방접종 도입', 'Universal since 1995', lang), color: '#e599f7' },
    { label: t('HBV 기인 간암', 'HBV-related HCC', lang), value: hbv.complications.hbvRelatedHCC_2020, unit: '%', sub: t('2020년, 감소 추세', '2020, decreasing', lang), color: '#ff6b6b' },
  ];

  const hcvKpis = [
    { label: t('Anti-HCV 양성률', 'Anti-HCV Prevalence', lang), value: hcv.antiHcvPrevalence.y2019_2021, unit: '%', sub: t('2019-2021 KNHANES', '2019-2021 KNHANES', lang), color: '#4d96ff' },
    { label: t('HCV RNA 양성', 'HCV RNA Positive', lang), value: hcv.hcvRna.positiveRate, unit: '%', sub: t('활동성 감염 ~16만명', 'Active ~160K pts', lang), color: '#ff6b6b' },
    { label: t('추정 감염자', 'Est. Infected', lang), value: '30만', unit: t('명', '', lang), sub: t('진단율 낮음', 'Low diagnosis rate', lang), color: '#ff922b' },
    { label: t('DAA 치료 성공률', 'DAA SVR Rate', lang), value: hcv.treatment.svrRate, unit: '%', sub: t('SVR12, 2015년 도입', 'SVR12, since 2015', lang), color: '#6bcb77' },
    { label: t('연간 치료자', 'Annual Treated', lang), value: '1.6만', unit: t('명', '', lang), sub: t('2021년 기준', '2021', lang), color: '#ffd93d' },
    { label: t('치료율', 'Treatment Rate', lang), value: hcv.patients.treatmentRate, unit: '%', sub: t('WHO 2030 목표 미달', 'Below WHO 2030 target', lang), color: '#e599f7' },
  ];

  const hbvTrend = [
    { year: '2007-09', value: 3.4, label: '3.4%' },
    { year: '2019-21', value: 2.14, label: '2.14%' },
  ];

  return (
    <>
      {/* HBV Section */}
      <InsightPanel
        title={t('🦠 B형간염 (HBV)', '🦠 Hepatitis B (HBV)', lang)}
        source="KASL HBV FS 2023"
        sourceUrl="https://www.kasl.org/"
        details={[
          { label: 'HBsAg', value: '2.14', unit: '%', color: '#4d96ff' },
          { label: t('만성 환자', 'Chronic Pts', lang), value: '49', unit: t('만명', '0K', lang), color: '#ff922b' },
          { label: t('HBV 기인 HCC', 'HBV-HCC', lang), value: hbv.complications?.hbvRelatedHCC_2020 || '—', unit: '%', color: '#ff6b6b' },
        ]}
        insight={{
          ko: '한국의 HBsAg 양성률은 1995년 국가예방접종 도입 이후 3.4%→2.14%로 37% 감소했으나, 여전히 만성 B형간염 49만명이 관리 중입니다. 30세 미만에서는 거의 소실되었으나, 20-30대 항체 소실에 따른 추가접종이 필요합니다 (KASL 2022 GL).',
          en: 'Korea HBsAg prevalence dropped 37% (3.4%→2.14%) since universal vaccination in 1995, but 490K chronic HBV patients remain. Near-zero in <30 age group, though antibody waning in 20-30s requires boosters (KASL 2022 GL).',
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '10px', marginBottom: '16px' }}>
          {hbvKpis.map((kpi, i) => (
            <div key={i} style={{
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '12px', padding: '14px', position: 'relative', overflow: 'hidden',
            }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: kpi.color, opacity: 0.6 }} />
              <div style={{ fontSize: '10px', color: '#bbbbdd', marginBottom: '6px' }}>{kpi.label}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px' }}>
                <span style={{ fontSize: '22px', fontWeight: 800, color: kpi.color, fontFamily: "'JetBrains Mono'" }}>{kpi.value}</span>
                <span style={{ fontSize: '10px', color: '#aaaacc' }}>{kpi.unit}</span>
              </div>
              {kpi.sub && <div style={{ fontSize: '9px', color: '#9999bb', marginTop: '4px' }}>{kpi.sub}</div>}
            </div>
          ))}
        </div>

        {/* HBsAg Trend + Key Insights */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div style={{
            background: 'rgba(77,150,255,0.05)', border: '1px solid rgba(77,150,255,0.15)',
            borderRadius: '10px', padding: '16px',
          }}>
            <div style={{ fontSize: '12px', color: '#4d96ff', fontWeight: 600, marginBottom: '12px' }}>
              {t('HBsAg 양성률 추이', 'HBsAg Prevalence Trend', lang)}
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '24px', height: '80px' }}>
              {hbvTrend.map((d, i) => {
                const h = (d.value / 4) * 70;
                return (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                    <span style={{ fontSize: '14px', fontWeight: 800, color: '#4d96ff', fontFamily: "'JetBrains Mono'", marginBottom: '4px' }}>{d.label}</span>
                    <div style={{ width: '100%', maxWidth: '60px', height: `${h}px`, background: `linear-gradient(to top, #4d96ff22, #4d96ff66)`, borderRadius: '6px 6px 0 0', border: '1px solid #4d96ff44', borderBottom: 'none' }} />
                    <span style={{ fontSize: '10px', color: '#bbbbdd', marginTop: '4px' }}>{d.year}</span>
                  </div>
                );
              })}
              <div style={{ fontSize: '20px', color: '#6bcb77', alignSelf: 'center' }}>↓ 37%</div>
            </div>
            <div style={{ fontSize: '10px', color: '#9999bb', marginTop: '8px' }}>
              {t('예방접종 효과로 30세 미만 거의 소실', 'Near-zero in <30 age group due to vaccination', lang)}
            </div>
          </div>

          <div style={{
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '10px', padding: '16px',
          }}>
            <div style={{ fontSize: '12px', color: '#fff', fontWeight: 600, marginBottom: '10px' }}>
              {t('주요 위험요인', 'Key Risk Factors', lang)}
            </div>
            {hbv.riskFactors.map((rf, i) => (
              <div key={i} style={{ fontSize: '11px', color: '#bbbbdd', padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                • {rf}
              </div>
            ))}
            <div style={{ marginTop: '10px', padding: '6px 10px', background: 'rgba(107,203,119,0.08)', borderRadius: '6px', fontSize: '10px', color: '#6bcb77' }}>
              {t('✅ 20-30대 항체 소실 → 추가접종 필요', '✅ Antibody waning in 20-30s → booster needed', lang)}
            </div>
          </div>
        </div>
      </InsightPanel>

      {/* HBV HBsAg Prevalence Trend (1982-2021) */}
      <InsightPanel
        title={t('B형간염 HBsAg 양성률 추이 (1982-2021)', 'HBV HBsAg Prevalence Trend (1982-2021)', lang)}
        source="간질환 백서 2024"
        details={[
          { label: '1982', value: '8.6', unit: '%', color: '#ff6b6b' },
          { label: '2021', value: '2.2', unit: '%', color: '#4d96ff' },
          { label: t('감소율', 'Reduction', lang), value: '74', unit: '%', color: '#6bcb77' },
        ]}
        insight={{
          ko: '1995년 영유아 예방접종 도입 효과로 30세 미만에서 거의 퇴치 수준. 그러나 1992년 이전 출생 코호트에서 40-50대 남성 유병률이 여전히 4-6%로 높아, 이 세대에 대한 선별검사와 항바이러스 치료가 핵심.',
          en: 'Near-elimination in <30 age group thanks to universal infant vaccination since 1995. However, prevalence remains 4-6% in males aged 40-50s born before 1992, making screening and antiviral treatment in this cohort essential.',
        }}
      >
        <HBVPrevalenceChart lang={lang} />
      </InsightPanel>

      {/* HCV Section */}
      <InsightPanel
        title={t('🧬 C형간염 (HCV)', '🧬 Hepatitis C (HCV)', lang)}
        source="KASL HCV FS 2023"
        sourceUrl="https://www.kasl.org/"
        details={[
          { label: 'Anti-HCV', value: hcv.antiHcvPrevalence?.y2019_2021 || '—', unit: '%', color: '#4d96ff' },
          { label: 'DAA SVR', value: hcv.treatment?.svrRate || '—', unit: '%', color: '#6bcb77' },
          { label: t('치료율', 'Tx Rate', lang), value: hcv.patients?.treatmentRate || '—', unit: '%', color: '#e599f7' },
        ]}
        insight={{
          ko: 'DAA 도입으로 SVR 95%+ 달성이 가능하지만, 추정 감염자 30만명 중 진단율과 치료율이 모두 WHO 2030 제거 목표에 미달합니다. 1b형(45%)과 2a형(26%)이 주요 유전자형이며, 고위험군 대상 적극적 검진 확대가 필요합니다.',
          en: 'Despite DAA achieving 95%+ SVR, both diagnosis and treatment rates fall short of WHO 2030 elimination targets among estimated 300K infected. GT 1b (45%) and 2a (26%) dominate, requiring expanded screening in high-risk populations.',
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '10px', marginBottom: '16px' }}>
          {hcvKpis.map((kpi, i) => (
            <div key={i} style={{
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '12px', padding: '14px', position: 'relative', overflow: 'hidden',
            }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: kpi.color, opacity: 0.6 }} />
              <div style={{ fontSize: '10px', color: '#bbbbdd', marginBottom: '6px' }}>{kpi.label}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px' }}>
                <span style={{ fontSize: '22px', fontWeight: 800, color: kpi.color, fontFamily: "'JetBrains Mono'" }}>{kpi.value}</span>
                <span style={{ fontSize: '10px', color: '#aaaacc' }}>{kpi.unit}</span>
              </div>
              {kpi.sub && <div style={{ fontSize: '9px', color: '#9999bb', marginTop: '4px' }}>{kpi.sub}</div>}
            </div>
          ))}
        </div>

        {/* HCV Genotype + Treatment Gap */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div style={{
            background: 'rgba(255,107,107,0.05)', border: '1px solid rgba(255,107,107,0.15)',
            borderRadius: '10px', padding: '16px',
          }}>
            <div style={{ fontSize: '12px', color: '#ff6b6b', fontWeight: 600, marginBottom: '10px' }}>
              {t('유전자형 분포', 'Genotype Distribution', lang)}
            </div>
            {[
              { label: t('1b형', 'GT 1b', lang), value: hcv.genotype.gt1b, color: '#4d96ff' },
              { label: t('2a형', 'GT 2a', lang), value: hcv.genotype.gt2a, color: '#6bcb77' },
              { label: t('3형', 'GT 3', lang), value: hcv.genotype.gt3, color: '#ffd93d' },
              { label: t('기타', 'Other', lang), value: hcv.genotype.other, color: '#bbbbdd' },
            ].map((gt, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <span style={{ fontSize: '11px', color: '#bbbbdd', minWidth: '40px' }}>{gt.label}</span>
                <div style={{ flex: 1, height: '14px', background: 'rgba(255,255,255,0.03)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${gt.value}%`, height: '100%', background: `${gt.color}88`, borderRadius: '4px' }} />
                </div>
                <span style={{ fontSize: '11px', color: gt.color, fontFamily: "'JetBrains Mono'", minWidth: '30px', textAlign: 'right' }}>{gt.value}%</span>
              </div>
            ))}
          </div>

          <div style={{
            background: 'rgba(255,217,61,0.05)', border: '1px solid rgba(255,217,61,0.15)',
            borderRadius: '10px', padding: '16px',
          }}>
            <div style={{ fontSize: '12px', color: '#ffd93d', fontWeight: 600, marginBottom: '10px' }}>
              {t('치료 갭 분석', 'Treatment Gap Analysis', lang)}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { label: t('추정 감염자', 'Est. Infected', lang), value: '30만', color: '#ff6b6b' },
                { label: t('진단된 환자', 'Diagnosed', lang), value: '12만', color: '#ff922b' },
                { label: t('치료 받은 환자', 'Treated', lang), value: '~4만', color: '#ffd93d' },
                { label: t('완치 (SVR)', 'Cured (SVR)', lang), value: '~3.9만', color: '#6bcb77' },
              ].map((step, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 8px', background: `${step.color}08`, borderRadius: '4px', borderLeft: `3px solid ${step.color}` }}>
                  <span style={{ fontSize: '11px', color: '#bbbbdd' }}>{step.label}</span>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: step.color, fontFamily: "'JetBrains Mono'" }}>{step.value}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: '8px', fontSize: '10px', color: '#ffd93d', padding: '6px', background: 'rgba(255,217,61,0.08)', borderRadius: '4px' }}>
              ⚠️ {t('WHO 2030 제거 목표 대비 진단율·치료율 모두 미달', 'Below WHO 2030 elimination targets for both Dx & Tx', lang)}
            </div>
          </div>
        </div>

        <div style={{ marginTop: '10px', fontSize: '10px', color: '#9999bb' }}>
          {t('위험요인: ', 'Risk factors: ', lang)}
          {hcv.riskFactors.join(' | ')}
        </div>
      </InsightPanel>
    </>
  );
}

function ALDPanel({ lang }) {
  const ald = DISEASE_EPI.diseases.ald;
  const alc = ald.alcoholConsumption;
  const demo = ald.demographics;
  const comp = ald.complications;
  const mort = ald.mortality;

  const kpis = [
    { label: t('ALD 진료환자', 'ALD Patients', lang), value: '29만', unit: t('명', '', lang), sub: t('NHIS 2021 청구기준', 'NHIS 2021 claims', lang), color: '#ff922b' },
    { label: t('ALD 추정 유병률', 'ALD Est. Prevalence', lang), value: ald.prevalence.aldPrevalence, unit: '%', sub: t('건검 수진자 중', 'Among health checkup', lang), color: '#ffd93d' },
    { label: t('고위험음주율', 'High-risk Drinking', lang), value: alc.highRiskDrinking_overall, unit: '%', sub: t(`남 ${alc.highRiskDrinking_male}% / 여 ${alc.highRiskDrinking_female}%`, `M ${alc.highRiskDrinking_male}% / F ${alc.highRiskDrinking_female}%`, lang), color: '#ff6b6b' },
    { label: t('폭음률', 'Binge Drinking', lang), value: alc.bingeRateAdult, unit: '%', sub: t('월 1회 이상 폭음', 'Binge ≥1/mo', lang), color: '#e599f7' },
    { label: t('ALD 사망률', 'ALD Mortality', lang), value: mort.aldDeathRate2021, unit: '/10만', sub: t('2021년, 증가 추세', '2021, increasing', lang), color: '#ff6b6b' },
    { label: t('간질환사망 기여', 'Liver Death Share', lang), value: mort.liverDeathContribution, unit: '%', sub: t('전체 간질환 사망 중', 'Of all liver deaths', lang), color: '#4d96ff' },
  ];

  return (
    <>
      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '10px', marginBottom: '16px' }}>
        {kpis.map((kpi, i) => (
          <div key={i} style={{
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '12px', padding: '14px', position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: kpi.color, opacity: 0.6 }} />
            <div style={{ fontSize: '10px', color: '#bbbbdd', marginBottom: '6px' }}>{kpi.label}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px' }}>
              <span style={{ fontSize: '22px', fontWeight: 800, color: kpi.color, fontFamily: "'JetBrains Mono'" }}>{kpi.value}</span>
              <span style={{ fontSize: '10px', color: '#aaaacc' }}>{kpi.unit}</span>
            </div>
            {kpi.sub && <div style={{ fontSize: '9px', color: '#9999bb', marginTop: '4px' }}>{kpi.sub}</div>}
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
        {/* ALD Spectrum */}
        <InsightPanel
          title={t('알코올 간질환 스펙트럼', 'ALD Spectrum', lang)}
          source="KASL ALD FS 2023"
          sourceUrl="https://www.kasl.org/"
          details={[
            { label: t('지방간', 'Fatty Liver', lang), value: ald.prevalence?.alcoholicFattyLiver || '—', unit: '%', color: '#ffd93d' },
            { label: t('간염', 'Hepatitis', lang), value: ald.prevalence?.alcoholicHepatitis || '—', unit: '%', color: '#ff922b' },
            { label: t('간경변', 'Cirrhosis', lang), value: ald.prevalence?.alcoholicCirrhosis || '—', unit: '%', color: '#ff6b6b' },
          ]}
          insight={{
            ko: '알코올 간질환은 지방간→간염→간경변 순으로 진행하며, HBV 기인 간경변 비율이 감소하면서 ALD 기인 간경변 비율이 상대적으로 증가하고 있습니다. 한국은 OECD 상위권 음주 수준으로 ALD 예방이 중요합니다.',
            en: 'ALD progresses from steatosis to hepatitis to cirrhosis. As HBV-related cirrhosis declines, ALD-attributed cirrhosis proportion is rising. Korea ranks high among OECD nations in alcohol consumption, making ALD prevention critical.',
          }}
        >
          {[
            { label: t('알코올성 지방간', 'Alcoholic Fatty Liver', lang), value: ald.prevalence.alcoholicFattyLiver, color: '#ffd93d' },
            { label: t('알코올성 간염', 'Alcoholic Hepatitis', lang), value: ald.prevalence.alcoholicHepatitis, color: '#ff922b' },
            { label: t('알코올성 간경변', 'Alcoholic Cirrhosis', lang), value: ald.prevalence.alcoholicCirrhosis, color: '#ff6b6b' },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
              <span style={{ flex: 1, fontSize: '12px', color: '#bbbbdd' }}>{item.label}</span>
              <div style={{ width: '120px', height: '14px', background: 'rgba(255,255,255,0.03)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${(item.value / 5) * 100}%`, height: '100%', background: `${item.color}88`, borderRadius: '4px' }} />
              </div>
              <span style={{ fontSize: '16px', fontWeight: 800, color: item.color, fontFamily: "'JetBrains Mono'", minWidth: '50px', textAlign: 'right' }}>{item.value}%</span>
            </div>
          ))}
          <div style={{ marginTop: '12px', padding: '8px 10px', background: 'rgba(255,146,43,0.08)', borderRadius: '6px', fontSize: '10px', color: '#ff922b' }}>
            {t('ALD 기인 간경변 비율 증가 추세 — HBV 비율 감소분 대체', 'ALD cirrhosis proportion rising — replacing declining HBV share', lang)}
          </div>
        </InsightPanel>

        {/* Demographics + Alcohol */}
        <InsightPanel
          title={t('성별·연령 분포 및 음주 현황', 'Demographics & Alcohol Consumption', lang)}
          source="KASL ALD FS 2023"
          sourceUrl="https://www.kasl.org/"
          details={[
            { label: t('남성 비율', 'Male Ratio', lang), value: demo.maleRatio || '—', unit: '%', color: '#4d96ff' },
            { label: t('1인당 음주', 'Per Capita', lang), value: alc.perCapitaAlcohol_L || '—', unit: 'L/yr', color: '#ff922b' },
          ]}
          insight={{
            ko: 'ALD는 남성 우위(약 3:1)이나, 최근 여성 ALD 비율 및 고위험음주가 지속 증가하고 있습니다. 1인당 알코올 소비량은 OECD 평균 이상이며, 폭음 문화가 ALD 발생의 주요 위험요인입니다.',
            en: 'ALD is male-predominant (~3:1), but female ALD proportion and high-risk drinking are steadily increasing. Per-capita alcohol consumption exceeds the OECD average, with binge drinking culture being a major risk factor.',
          }}
        >

          {/* Gender ratio bar */}
          <div style={{ marginBottom: '14px' }}>
            <div style={{ fontSize: '11px', color: '#bbbbdd', marginBottom: '6px' }}>{t('성별 비율', 'Gender Ratio', lang)}</div>
            <div style={{ display: 'flex', height: '24px', borderRadius: '6px', overflow: 'hidden' }}>
              <div style={{ width: `${demo.maleRatio}%`, background: '#4d96ff88', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#fff', fontWeight: 600 }}>
                ♂ {demo.maleRatio}%
              </div>
              <div style={{ width: `${demo.femaleRatio}%`, background: '#e599f788', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#fff', fontWeight: 600 }}>
                ♀ {demo.femaleRatio}%
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {[
              { label: t('남성 호발 연령', 'Male Peak Age', lang), value: demo.peakAge_male, color: '#4d96ff' },
              { label: t('여성 호발 연령', 'Female Peak Age', lang), value: demo.peakAge_female, color: '#e599f7' },
              { label: t('1인당 알코올 소비', 'Per Capita Alcohol', lang), value: `${alc.perCapitaAlcohol_L}L/${t('년', 'yr', lang)}`, color: '#ff922b' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '12px' }}>
                <span style={{ color: '#bbbbdd' }}>{item.label}</span>
                <span style={{ color: item.color, fontWeight: 600, fontFamily: "'JetBrains Mono'" }}>{item.value}</span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '12px', padding: '6px 10px', background: 'rgba(229,153,247,0.08)', borderRadius: '6px', fontSize: '10px', color: '#e599f7' }}>
            {t('⚠️ 여성 ALD 비율 및 고위험음주 지속 증가', '⚠️ Female ALD proportion & high-risk drinking increasing', lang)}
          </div>
        </InsightPanel>
      </div>

      {/* ALD Complications */}
      <InsightPanel
        title={t('ALD 관련 간질환 기여도', 'ALD Contribution to Liver Disease', lang)}
        source="KASL ALD FS 2023"
        sourceUrl="https://www.kasl.org/"
        details={[
          { label: t('간경변 중 ALD', 'ALD in LC', lang), value: comp.aldRelatedLC_proportion || '—', unit: '%', color: '#ff922b' },
          { label: t('HCC 중 ALD', 'ALD in HCC', lang), value: comp.aldRelatedHCC_proportion || '—', unit: '%', color: '#ff6b6b' },
          { label: t('ALD 사망률', 'ALD Mortality', lang), value: mort.aldDeathRate2021 || '—', unit: '/10만', color: '#e599f7' },
        ]}
        insight={{
          ko: 'ALD는 간경변 및 HCC의 주요 원인 중 하나로, 특히 HBV 백신 보급 이후 상대적 기여도가 증가하고 있습니다. ALD 사망률도 상승 추세로, 알코올 정책 강화가 시급합니다.',
          en: 'ALD is a leading cause of cirrhosis and HCC, with rising proportional contribution as HBV vaccination reduces viral hepatitis burden. ALD mortality is also trending upward, highlighting the urgency of alcohol policy interventions.',
        }}
      >
        <div style={{ display: 'flex', gap: '24px' }}>
          {[
            { label: t('간경변 중 ALD', 'ALD in Cirrhosis', lang), value: comp.aldRelatedLC_proportion, color: '#ff922b' },
            { label: t('간세포암 중 ALD', 'ALD in HCC', lang), value: comp.aldRelatedHCC_proportion, color: '#ff6b6b' },
            { label: t('ALD 사망률', 'ALD Mortality', lang), value: mort.aldDeathRate2021, unit: '/10만', color: '#e599f7' },
          ].map((item, i) => (
            <div key={i} style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: '28px', fontWeight: 800, color: item.color, fontFamily: "'JetBrains Mono'" }}>
                {item.value}{item.unit ? '' : '%'}
              </div>
              {item.unit && <div style={{ fontSize: '10px', color: '#aaaacc' }}>{item.unit}</div>}
              <div style={{ fontSize: '11px', color: '#bbbbdd', marginTop: '4px' }}>{item.label}</div>
            </div>
          ))}
        </div>
      </InsightPanel>

      {/* Risk factors + ref */}
      <div style={{ fontSize: '10px', color: '#9999bb', marginBottom: '4px' }}>
        {t('위험요인: ', 'Risk factors: ', lang)}
        {ald.riskFactors.join(' | ')}
      </div>
      <div style={{ fontSize: '9px', color: '#444' }}>
        <a href={ald.refUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#00d4ff88', textDecoration: 'none' }}>
          📎 {ald.ref}
        </a>
      </div>
    </>
  );
}

function ProgressionPanel({ masld, mash, lc, lang }) {
  const prog2yr = masld.progression2yr || {};
  const prog10yr = masld.progression10yr_2010baseline || {};
  const [sex2yr, setSex2yr] = useState('male');
  const [sex10yr, setSex10yr] = useState('male');

  // 2yr progression: disease → sex → ageGroup → {2010, 2015, 2020}
  const diseases2yr = Object.keys(prog2yr).filter(k => k !== 'ref' && k !== 'insight');
  const ageGroups = ['20-29','30-39','40-49','50-59','60-69','70-79','80+'];
  const years2yr = ['2010','2015','2020'];
  const diseaseLabels = {
    cirrhosis: t('간경변','Cirrhosis',lang), hcc: t('간세포암','HCC',lang),
    malignancy: t('악성종양','Malignancy',lang), ihd: t('허혈성심질환','IHD',lang),
    stroke: t('뇌졸중','Stroke',lang),
  };
  const diseaseColors = { cirrhosis: '#ff6b6b', hcc: '#e599f7', malignancy: '#ffd93d', ihd: '#ff922b', stroke: '#4d96ff' };

  // 10yr progression: sex → ageGroup → {malignancy, IHD, stroke, LC, HCC}
  const prog10yrData = prog10yr[sex10yr] || {};
  const outcomes10yr = ['malignancy','IHD','stroke','LC','HCC'];
  const outcome10yrLabels = {
    malignancy: t('악성종양','Malignancy',lang), IHD: t('허혈성심질환','IHD',lang),
    stroke: t('뇌졸중','Stroke',lang), LC: t('간경변','Cirrhosis',lang), HCC: t('간세포암','HCC',lang),
  };
  const outcome10yrColors = { malignancy: '#ffd93d', IHD: '#ff922b', stroke: '#4d96ff', LC: '#ff6b6b', HCC: '#e599f7' };

  const SexToggle = ({ value, onChange }) => (
    <div style={{ display: 'flex', gap: '4px', marginBottom: '12px' }}>
      {[{k:'male',l:t('남성','Male',lang)},{k:'female',l:t('여성','Female',lang)}].map(s => (
        <button key={s.k} onClick={() => onChange(s.k)} style={{
          padding: '4px 10px', fontSize: '10px', borderRadius: '6px', cursor: 'pointer',
          background: value === s.k ? 'rgba(0,212,255,0.12)' : 'transparent',
          border: value === s.k ? '1px solid rgba(0,212,255,0.4)' : '1px solid rgba(255,255,255,0.08)',
          color: value === s.k ? '#00d4ff' : '#aaaacc', fontFamily: "'Noto Sans KR'",
        }}>{s.l}</button>
      ))}
    </div>
  );

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
      {/* 2yr Progression Heatmap */}
      <InsightPanel
        title={t('MASLD 2년 추적 진행률 (%)', '2-Year Progression Rate (%)', lang)}
        source="KASL NAFLD FS 2023"
        sourceUrl="https://www.kasl.org/"
        insight={{
          ko: 'MASLD 진단 후 2년 내 간경변, HCC, 허혈성심질환, 뇌졸중 등의 진행률을 연령·성별로 추적한 결과입니다. 고령일수록, 남성에서 간경변·HCC 진행률이 높으며, 심혈관 합병증 동반도 증가합니다.',
          en: 'Two-year progression rates to cirrhosis, HCC, IHD, and stroke after MASLD diagnosis by age and sex. Higher rates in elderly and males for cirrhosis/HCC, with increasing cardiovascular comorbidity.',
        }}
      >
        <SexToggle value={sex2yr} onChange={setSex2yr} />
        {diseases2yr.length > 0 ? diseases2yr.map(disease => {
          const sexData = prog2yr[disease]?.[sex2yr];
          if (!sexData || typeof sexData !== 'object') return null;
          const label = diseaseLabels[disease] || disease;
          const color = diseaseColors[disease] || '#bbbbdd';
          return (
            <div key={disease} style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '11px', color, fontWeight: 700, marginBottom: '4px' }}>{label}</div>
              <div style={{ display: 'grid', gridTemplateColumns: `60px repeat(${years2yr.length}, 1fr)`, gap: '2px', fontSize: '10px' }}>
                <div style={{ color: '#9999bb' }}></div>
                {years2yr.map(y => <div key={y} style={{ color: '#aaaacc', textAlign: 'center' }}>{y}</div>)}
                {ageGroups.map(ag => {
                  const vals = years2yr.map(y => sexData[ag]?.[y]);
                  return (
                    <React.Fragment key={ag}>
                      <div style={{ color: '#bbbbdd', fontSize: '9px' }}>{ag}</div>
                      {vals.map((v, i) => {
                        const maxV = disease === 'cirrhosis' ? 12 : disease === 'hcc' ? 3 : 1;
                        const intensity = v != null ? Math.min(v / maxV, 1) : 0;
                        return (
                          <div key={i} style={{
                            textAlign: 'center', padding: '2px',
                            background: v != null ? `rgba(${color === '#ff6b6b' ? '255,107,107' : color === '#e599f7' ? '229,153,247' : '255,217,61'}, ${intensity * 0.6 + 0.05})` : 'rgba(255,255,255,0.02)',
                            borderRadius: '3px', color: v != null ? '#fff' : '#333',
                            fontFamily: "'JetBrains Mono'", fontSize: '9px',
                          }}>
                            {v != null ? v : '—'}
                          </div>
                        );
                      })}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          );
        }) : <div style={{ color: '#9999bb', fontSize: '12px' }}>{t('데이터 없음','No data',lang)}</div>}
        {prog2yr.insight && (
          <div style={{ marginTop: '8px', fontSize: '9px', color: '#aaaacc', lineHeight: 1.5 }}>
            {(Array.isArray(prog2yr.insight) ? prog2yr.insight : []).map((ins, i) => (
              <div key={i}>• {ins}</div>
            ))}
          </div>
        )}
      </InsightPanel>

      {/* 10yr Progression Stacked Bar */}
      <InsightPanel
        title={t('10년 추적 진행률 (2010 기준, %)', '10-Year Progression (2010 baseline, %)', lang)}
        source="KASL NAFLD FS 2023"
        sourceUrl="https://www.kasl.org/"
        insight={{
          ko: '2010년 NAFLD 코호트의 10년 추적에서 악성종양, 허혈성심질환, 뇌졸중, 간경변, HCC 발생률을 확인합니다. MASLD는 간 질환뿐 아니라 심혈관·종양 합병증의 독립 위험인자임을 보여줍니다.',
          en: 'Ten-year follow-up of the 2010 NAFLD cohort shows incidence of malignancy, IHD, stroke, cirrhosis, and HCC. MASLD is an independent risk factor not only for liver disease but also cardiovascular and oncologic complications.',
        }}
      >
        <SexToggle value={sex10yr} onChange={setSex10yr} />
        {Object.keys(prog10yrData).length > 0 ? (
          <div>
            {ageGroups.map(ag => {
              const agData = prog10yrData[ag];
              if (!agData || typeof agData !== 'object') return null;
              const total = outcomes10yr.reduce((s, o) => s + (agData[o] || 0), 0);
              return (
                <div key={ag} style={{ marginBottom: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '40px', fontSize: '9px', color: '#bbbbdd', textAlign: 'right' }}>{ag}</div>
                    <div style={{ flex: 1, display: 'flex', height: '18px', borderRadius: '3px', overflow: 'hidden' }}>
                      {outcomes10yr.map(o => {
                        const v = agData[o] || 0;
                        const w = total > 0 ? (v / Math.max(total, 1)) * 100 : 0;
                        return w > 0 ? (
                          <div key={o} style={{
                            width: `${w}%`, height: '100%',
                            background: outcome10yrColors[o],
                            opacity: 0.7,
                          }} title={`${outcome10yrLabels[o]}: ${v}%`} />
                        ) : null;
                      })}
                    </div>
                    <div style={{ width: '35px', fontSize: '9px', color: '#aaaacc', fontFamily: "'JetBrains Mono'", textAlign: 'right' }}>
                      {total.toFixed(1)}%
                    </div>
                  </div>
                </div>
              );
            })}
            {/* Legend */}
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
              {outcomes10yr.map(o => (
                <span key={o} style={{ fontSize: '8px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: outcome10yrColors[o], display: 'inline-block' }} />
                  <span style={{ color: '#bbbbdd' }}>{outcome10yrLabels[o]}</span>
                </span>
              ))}
            </div>
          </div>
        ) : <div style={{ color: '#9999bb', fontSize: '12px' }}>{t('데이터 없음','No data',lang)}</div>}
        <div style={{ marginTop: '8px', fontSize: '9px', color: '#9999bb' }}>
          {t('NAFLD 진단 후 10년 추적, 2010년 코호트', 'NAFLD 10yr follow-up, 2010 cohort', lang)}
        </div>
      </InsightPanel>

      {/* GBD YLL Ranking Slope Chart */}
      <InsightPanel
        title={t('질병부담(YLL) 순위 변화 — 1999 vs 2019', 'Disease Burden (YLL) Ranking — 1999 vs 2019', lang)}
        source={t('간질환 백서 2024', 'Liver WP 2024', lang)} sourceUrl="https://www.kasl.org/"
        details={[
          { label: t('간경변', 'Cirrhosis', lang), value: '3위→6위', color: '#ff6b6b' },
          { label: t('간암', 'HCC', lang), value: '8위→5위', color: '#e74c3c' },
          { label: t('교통사고', 'Traffic', lang), value: '2위→10위', color: '#6bcb77' },
        ]}
        insight={{
          ko: '20년간 간경변은 3위→6위로 하락(예방접종+항바이러스 효과)했으나, 간암은 8위→5위로 상승. 자살이 6위→2위, 교통사고가 2위→10위로 극적 변화. 간질환 전체(간경변+간암)는 여전히 한국인 조기사망의 주요 원인.',
          en: 'Cirrhosis dropped from 3rd→6th (vaccination+antiviral effect) but HCC rose from 8th→5th over 20 years. Suicide surged 6th→2nd, traffic accidents plunged 2nd→10th. Liver diseases combined remain a leading cause of premature death in Korea.',
        }}
      >
        <GBDSlopeChart lang={lang} />
      </InsightPanel>
    </div>
  );
}

function GBDSlopeChart({ lang }) {
  const data1999 = LIVER_WP.gbd_yll_ranking[1999];
  const data2019 = LIVER_WP.gbd_yll_ranking[2019];
  const W = 560, H = 280, ML = 130, MR = 130, MT = 20, MB = 30;
  const chartW = W - ML - MR, chartH = H - MT - MB;
  const yStep = chartH / 9;

  const diseases = data1999.map(d => d.disease);
  const colors = {
    '간경변증': '#ff6b6b', '간암': '#e74c3c', '뇌졸중': '#ffd93d',
    '허혈성심질환': '#ff922b', '위암': '#b388ff', '자살': '#ff006e',
    '폐암': '#9999bb', '교통사고': '#6bcb77', '당뇨': '#4d96ff', '대장암': '#4ecdc4',
  };

  const t2 = (ko, en) => lang === 'ko' ? ko : en;
  const dn = {
    '간경변증': t2('간경변증','Cirrhosis'), '간암': t2('간암','HCC'), '뇌졸중': t2('뇌졸중','Stroke'),
    '허혈성심질환': t2('허혈심질환','IHD'), '위암': t2('위암','Gastric'), '자살': t2('자살','Suicide'),
    '폐암': t2('폐암','Lung Ca'), '교통사고': t2('교통사고','Traffic'), '당뇨': t2('당뇨','DM'), '대장암': t2('대장암','Colorectal'),
  };

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%' }}>
      <text x={ML - 5} y={MT - 6} fontSize="10" fill="#9999bb" textAnchor="end" fontFamily="JetBrains Mono">1999</text>
      <text x={ML + chartW + 5} y={MT - 6} fontSize="10" fill="#9999bb" textAnchor="start" fontFamily="JetBrains Mono">2019</text>
      {diseases.map(d => {
        const r1999 = data1999.find(e => e.disease === d)?.rank;
        const r2019 = data2019.find(e => e.disease === d)?.rank;
        if (!r1999 || !r2019) return null;
        const y1 = MT + (r1999 - 1) * yStep;
        const y2 = MT + (r2019 - 1) * yStep;
        const isLiver = d === '간경변증' || d === '간암';
        return (
          <g key={d}>
            <line x1={ML} y1={y1} x2={ML + chartW} y2={y2}
              stroke={colors[d] || '#666'} strokeWidth={isLiver ? 3 : 1.5}
              opacity={isLiver ? 1 : 0.5} />
            <circle cx={ML} cy={y1} r={isLiver ? 5 : 3} fill={colors[d] || '#666'} opacity={isLiver ? 1 : 0.6} />
            <circle cx={ML + chartW} cy={y2} r={isLiver ? 5 : 3} fill={colors[d] || '#666'} opacity={isLiver ? 1 : 0.6} />
            <text x={ML - 8} y={y1 + 4} fontSize="10" fill={colors[d] || '#999'} textAnchor="end"
              fontWeight={isLiver ? 700 : 400} fontFamily="'Noto Sans KR'">
              {r1999}. {dn[d] || d}
            </text>
            <text x={ML + chartW + 8} y={y2 + 4} fontSize="10" fill={colors[d] || '#999'} textAnchor="start"
              fontWeight={isLiver ? 700 : 400} fontFamily="'Noto Sans KR'">
              {r2019}. {dn[d] || d}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function LiverMortalityChart({ lang }) {
  const { years, liver_disease, hcc_mortality } = LIVER_WP.mortality;
  const W = 600, H = 220, PL = 45, PR = 15, PT = 15, PB = 35;
  const plotW = W - PL - PR, plotH = H - PT - PB;
  const maxVal = 32;

  const toX = (i) => PL + (i / (years.length - 1)) * plotW;
  const toY = (v) => PT + plotH - (v / maxVal) * plotH;

  const buildPath = (data) => {
    let path = '';
    let drawing = false;
    data.forEach((v, i) => {
      if (v == null) { drawing = false; return; }
      const x = toX(i);
      const y = toY(v);
      path += drawing ? `L${x},${y} ` : `M${x},${y} `;
      drawing = true;
    });
    return path;
  };

  const yTicks = [0, 5, 10, 15, 20, 25, 30];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%' }}>
      {/* Grid lines */}
      {yTicks.map(v => (
        <g key={v}>
          <line x1={PL} x2={W - PR} y1={toY(v)} y2={toY(v)} stroke="rgba(255,255,255,0.05)" />
          <text x={PL - 4} y={toY(v) + 3} fill="#9999bb" fontSize="9" textAnchor="end" fontFamily="JetBrains Mono">{v}</text>
        </g>
      ))}
      {/* Y axis label */}
      <text x={8} y={PT + plotH / 2} fill="#9999bb" fontSize="8" fontFamily="JetBrains Mono" transform={`rotate(-90, 8, ${PT + plotH / 2})`} textAnchor="middle">
        /10{lang === 'ko' ? '만명' : '0K'}
      </text>
      {/* Lines */}
      <path d={buildPath(liver_disease)} fill="none" stroke="#ff6b6b" strokeWidth="2.5" strokeLinecap="round" />
      <path d={buildPath(hcc_mortality)} fill="none" stroke="#4d96ff" strokeWidth="2.5" strokeLinecap="round" />
      {/* Start/end labels for liver_disease */}
      <text x={toX(0) - 2} y={toY(liver_disease[0]) - 6} fill="#ff6b6b" fontSize="9" fontFamily="JetBrains Mono" textAnchor="start">{liver_disease[0]}</text>
      {(() => { const lastIdx = liver_disease.findLastIndex(v => v != null); return lastIdx >= 0 ? <text x={toX(lastIdx) + 2} y={toY(liver_disease[lastIdx]) - 6} fill="#ff6b6b" fontSize="9" fontFamily="JetBrains Mono" textAnchor="start">{liver_disease[lastIdx]}</text> : null; })()}
      {/* Start/end labels for hcc */}
      <text x={toX(0) - 2} y={toY(hcc_mortality[0]) + 14} fill="#4d96ff" fontSize="9" fontFamily="JetBrains Mono" textAnchor="start">{hcc_mortality[0]}</text>
      {(() => { const lastIdx = hcc_mortality.findLastIndex(v => v != null); return lastIdx >= 0 ? <text x={toX(lastIdx) + 2} y={toY(hcc_mortality[lastIdx]) + 14} fill="#4d96ff" fontSize="9" fontFamily="JetBrains Mono" textAnchor="start">{hcc_mortality[lastIdx]}</text> : null; })()}
      {/* X axis */}
      {years.filter((_, i) => i % 5 === 0).map((y, _, arr) => (
        <text key={y} x={toX(years.indexOf(y))} y={H - 6} fill="#9999bb" fontSize="9" textAnchor="middle" fontFamily="JetBrains Mono">{y}</text>
      ))}
      {/* Legend */}
      <g transform={`translate(${PL + 10}, ${H - 22})`}>
        <rect width="12" height="3" fill="#ff6b6b" rx="1" />
        <text x="16" y="3" fill="#bbbbdd" fontSize="9" fontFamily="JetBrains Mono">{lang === 'ko' ? '간질환 사망률' : 'Liver Disease'}</text>
        <rect x="120" width="12" height="3" fill="#4d96ff" rx="1" />
        <text x="136" y="3" fill="#bbbbdd" fontSize="9" fontFamily="JetBrains Mono">{lang === 'ko' ? '간암 사망률' : 'HCC Mortality'}</text>
      </g>
    </svg>
  );
}

function HBVPrevalenceChart({ lang }) {
  const { years, prevalence } = LIVER_WP.hbv;
  const W = 600, H = 220, PL = 45, PR = 15, PT = 15, PB = 35;
  const plotW = W - PL - PR, plotH = H - PT - PB;
  const maxVal = 10;

  const toX = (i) => PL + (i / (years.length - 1)) * plotW;
  const toY = (v) => PT + plotH - (v / maxVal) * plotH;

  const buildPath = (data) => {
    let path = '';
    let drawing = false;
    data.forEach((v, i) => {
      if (v == null) { drawing = false; return; }
      const x = toX(i);
      const y = toY(v);
      path += drawing ? `L${x},${y} ` : `M${x},${y} `;
      drawing = true;
    });
    return path;
  };

  const yTicks = [0, 2, 4, 6, 8, 10];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%' }}>
      {/* Grid lines */}
      {yTicks.map(v => (
        <g key={v}>
          <line x1={PL} x2={W - PR} y1={toY(v)} y2={toY(v)} stroke="rgba(255,255,255,0.05)" />
          <text x={PL - 4} y={toY(v) + 3} fill="#9999bb" fontSize="9" textAnchor="end" fontFamily="JetBrains Mono">{v}</text>
        </g>
      ))}
      {/* Y axis label */}
      <text x={8} y={PT + plotH / 2} fill="#9999bb" fontSize="8" fontFamily="JetBrains Mono" transform={`rotate(-90, 8, ${PT + plotH / 2})`} textAnchor="middle">
        HBsAg (%)
      </text>
      {/* Line */}
      <path d={buildPath(prevalence)} fill="none" stroke="#4d96ff" strokeWidth="2.5" strokeLinecap="round" />
      {/* Data points */}
      {prevalence.map((v, i) => v != null ? (
        <circle key={i} cx={toX(i)} cy={toY(v)} r="3" fill="#4d96ff" stroke="#1a1a2e" strokeWidth="1.5" />
      ) : null)}
      {/* Start label */}
      <text x={toX(0)} y={toY(prevalence[0]) - 8} fill="#ff6b6b" fontSize="10" fontFamily="JetBrains Mono" fontWeight="700" textAnchor="middle">{prevalence[0]}%</text>
      {/* End label */}
      <text x={toX(years.length - 1)} y={toY(prevalence[prevalence.length - 1]) - 8} fill="#6bcb77" fontSize="10" fontFamily="JetBrains Mono" fontWeight="700" textAnchor="middle">{prevalence[prevalence.length - 1]}%</text>
      {/* 1995 vaccination annotation */}
      {(() => {
        const idx1995 = years.indexOf(1995);
        if (idx1995 < 0) return null;
        const x95 = toX(idx1995);
        return (
          <g>
            <line x1={x95} x2={x95} y1={PT} y2={PT + plotH} stroke="#6bcb7744" strokeWidth="1" strokeDasharray="4,3" />
            <text x={x95 + 4} y={PT + 12} fill="#6bcb77" fontSize="8" fontFamily="JetBrains Mono">
              {lang === 'ko' ? '예방접종 도입' : 'Vaccination'}
            </text>
          </g>
        );
      })()}
      {/* Reduction arrow */}
      <g transform={`translate(${W - PR - 80}, ${PT + 10})`}>
        <text x="0" y="0" fill="#6bcb77" fontSize="16" fontFamily="JetBrains Mono" fontWeight="800">↓ 74%</text>
        <text x="0" y="14" fill="#9999bb" fontSize="8" fontFamily="JetBrains Mono">{lang === 'ko' ? '40년간 감소' : '40yr decline'}</text>
      </g>
      {/* X axis */}
      {years.filter((_, i) => i % 3 === 0 || i === years.length - 1).map(y => (
        <text key={y} x={toX(years.indexOf(y))} y={H - 6} fill="#9999bb" fontSize="9" textAnchor="middle" fontFamily="JetBrains Mono">{y}</text>
      ))}
    </svg>
  );
}
