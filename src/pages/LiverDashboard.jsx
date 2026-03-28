import React, { useState } from 'react';
import { useLang } from '../i18n';
import { DISEASE_EPI } from '../data/disease_epi';
import CascadeFunnel from '../components/CascadeFunnel';

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
      <CascadeFunnel
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

      {/* MASLD → MASH → Fibrosis → Cirrhosis → HCC Pipeline */}
      <div style={{
        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '12px', padding: '24px', marginBottom: '16px',
      }}>
        <h3 style={{ fontSize: '14px', color: '#fff', margin: '0 0 20px', fontFamily: "'Noto Sans KR'" }}>
          {t('MASLD → MASH 진행 파이프라인', 'MASLD → MASH Progression Pipeline', lang)}
        </h3>
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
          <a href="https://www.e-cmh.org/" target="_blank" rel="noopener noreferrer" style={{ color: '#00d4ff88', textDecoration: 'none', fontSize: '10px' }}>
            📎 KASL GL 2025 refs 82-95
          </a>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {/* Fibrosis breakdown: MASLD vs MASH */}
        <div style={{
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '12px', padding: '20px',
        }}>
          <h3 style={{ fontSize: '13px', color: '#fff', margin: '0 0 14px', fontFamily: "'Noto Sans KR'" }}>
            {t('MASLD 섬유화 진행 및 예후', 'MASLD Fibrosis Progression & Prognosis', lang)}
          </h3>
          <FibrosisProgression fibrosis={fibrosis} lang={lang} />
        </div>

        {/* Mortality HR staircase */}
        <div style={{
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '12px', padding: '20px',
        }}>
          <h3 style={{ fontSize: '13px', color: '#fff', margin: '0 0 14px', fontFamily: "'Noto Sans KR'" }}>
            {t('전체사망률 위험배수 (HR)', 'All-cause Mortality HR', lang)}
          </h3>
          <MortalityStaircase hr={mortalityHR} lang={lang} />
        </div>

        {/* Comorbidity 2012 vs 2022 */}
        <div style={{
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '12px', padding: '20px',
        }}>
          <h3 style={{ fontSize: '13px', color: '#fff', margin: '0 0 14px', fontFamily: "'Noto Sans KR'" }}>
            {t('동반질환 변화 (2012 vs 2022)', 'Comorbidity Change (2012 vs 2022)', lang)}
          </h3>
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
        </div>

        {/* Cost */}
        <div style={{
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '12px', padding: '20px',
        }}>
          <h3 style={{ fontSize: '13px', color: '#fff', margin: '0 0 14px', fontFamily: "'Noto Sans KR'" }}>
            {t('의료비 부담', 'Medical Cost Burden', lang)}
          </h3>
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
        </div>
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
      <div style={{
        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '12px', padding: '20px', marginBottom: '16px',
      }}>
        <h3 style={{ fontSize: '14px', color: '#fff', margin: '0 0 16px', fontFamily: "'Noto Sans KR'" }}>
          🦠 {t('B형간염 (HBV)', 'Hepatitis B (HBV)', lang)}
        </h3>
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
        <div style={{ marginTop: '8px', fontSize: '9px', color: '#444' }}>
          <a href={hbv.refUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#00d4ff88', textDecoration: 'none' }}>
            📎 {hbv.ref}
          </a>
        </div>
      </div>

      {/* HCV Section */}
      <div style={{
        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '12px', padding: '20px',
      }}>
        <h3 style={{ fontSize: '14px', color: '#fff', margin: '0 0 16px', fontFamily: "'Noto Sans KR'" }}>
          🧬 {t('C형간염 (HCV)', 'Hepatitis C (HCV)', lang)}
        </h3>
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
        <div style={{ marginTop: '4px', fontSize: '9px', color: '#444' }}>
          <a href={hcv.refUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#00d4ff88', textDecoration: 'none' }}>
            📎 {hcv.ref}
          </a>
        </div>
      </div>
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
        <div style={{
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '12px', padding: '20px',
        }}>
          <h3 style={{ fontSize: '13px', color: '#fff', margin: '0 0 14px', fontFamily: "'Noto Sans KR'" }}>
            {t('알코올 간질환 스펙트럼', 'ALD Spectrum', lang)}
          </h3>
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
        </div>

        {/* Demographics + Alcohol */}
        <div style={{
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '12px', padding: '20px',
        }}>
          <h3 style={{ fontSize: '13px', color: '#fff', margin: '0 0 14px', fontFamily: "'Noto Sans KR'" }}>
            {t('성별·연령 분포 및 음주 현황', 'Demographics & Alcohol Consumption', lang)}
          </h3>

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
        </div>
      </div>

      {/* ALD Complications */}
      <div style={{
        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '12px', padding: '20px', marginBottom: '12px',
      }}>
        <h3 style={{ fontSize: '13px', color: '#fff', margin: '0 0 14px', fontFamily: "'Noto Sans KR'" }}>
          {t('ALD 관련 간질환 기여도', 'ALD Contribution to Liver Disease', lang)}
        </h3>
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
      </div>

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
      <div style={{
        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '12px', padding: '20px',
      }}>
        <h3 style={{ fontSize: '13px', color: '#fff', margin: '0 0 8px', fontFamily: "'Noto Sans KR'" }}>
          {t('MASLD 2년 추적 진행률 (%)', '2-Year Progression Rate (%)', lang)}
        </h3>
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
        <a href="https://www.kasl.org/" target="_blank" rel="noopener noreferrer" style={{ fontSize: '8px', color: '#00d4ff66', textDecoration: 'none', marginTop: '6px', display: 'block' }}>
          📎 KASL NAFLD FS 2023, NHIS 2yr follow-up
        </a>
      </div>

      {/* 10yr Progression Stacked Bar */}
      <div style={{
        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '12px', padding: '20px',
      }}>
        <h3 style={{ fontSize: '13px', color: '#fff', margin: '0 0 8px', fontFamily: "'Noto Sans KR'" }}>
          {t('10년 추적 진행률 (2010 기준, %)', '10-Year Progression (2010 baseline, %)', lang)}
        </h3>
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
        <a href="https://www.kasl.org/" target="_blank" rel="noopener noreferrer" style={{ fontSize: '8px', color: '#00d4ff66', textDecoration: 'none', marginTop: '4px', display: 'block' }}>
          📎 KASL NAFLD FS 2023
        </a>
      </div>
    </div>
  );
}
