import { useState, lazy, Suspense } from 'react';
import { useLang } from '../i18n';
import CascadeWaterfall from '../components/CascadeWaterfall';
import InsightPanel from '../components/InsightPanel';
import { DISEASE_EPI, DISEASE_TIMESERIES } from '../data/disease_epi';
import { MI_KOSIS } from '../data/mi_kosis';
import { HF_KOSIS } from '../data/hf_kosis';
import { STROKE_KOSIS } from '../data/stroke_kosis';

const StrokeDashboard = lazy(() => import('./StrokeDashboard'));
const MIDashboard = lazy(() => import('./MIDashboard'));

const t = (ko, en, lang) => lang === 'ko' ? ko : en;

export default function CardiovascularDashboard() {
  const { lang } = useLang();
  const [subTab, setSubTab] = useState('mi');

  const mi = DISEASE_EPI.diseases.mi;
  const stroke = DISEASE_EPI.diseases.stroke;
  const hf = DISEASE_EPI.diseases.heart_failure;

  const subTabs = [
    { id: 'mi', label: t('급성심근경색', 'MI', lang), icon: '💔' },
    { id: 'stroke', label: t('뇌졸중', 'Stroke', lang), icon: '🧠' },
    { id: 'hf', label: t('심부전', 'Heart Failure', lang), icon: '❤️‍🩹' },
    { id: 'htn', label: t('고혈압', 'Hypertension', lang), icon: '🩺' },
    { id: 'oecd', label: t('OECD 비교', 'OECD Compare', lang), icon: '🌍' },
  ];

  return (
    <div style={{ padding: '76px 24px 24px', maxWidth: '1400px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#fff', margin: '0 0 8px', fontFamily: "'Noto Sans KR'" }}>
        {t('❤️ 심혈관질환 대시보드', '❤️ Cardiovascular Dashboard', lang)}
      </h1>
      <div style={{ fontSize: '12px', color: '#aaaacc', marginBottom: '20px' }}>
        {t('출처: KDCA 심뇌혈관질환 발생통계 2022, KOSIS, KSHF 2025', 'Source: KDCA CVD Statistics 2022, KOSIS, KSHF 2025', lang)}
      </div>

      {/* Sub-tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        {subTabs.map(st => (
          <button key={st.id} onClick={() => setSubTab(st.id)} style={{
            padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px',
            fontFamily: "'Noto Sans KR'",
            background: subTab === st.id ? 'rgba(255,100,100,0.15)' : 'rgba(255,255,255,0.03)',
            border: subTab === st.id ? '1px solid rgba(255,100,100,0.4)' : '1px solid rgba(255,255,255,0.06)',
            color: subTab === st.id ? '#ff6b6b' : '#bbbbdd',
            fontWeight: subTab === st.id ? 600 : 400,
          }}>
            {st.icon} {st.label}
          </button>
        ))}
      </div>

      <Suspense fallback={<div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>Loading...</div>}>
        {subTab === 'mi' && <MIDashboard embedded />}
        {subTab === 'stroke' && <StrokeDashboard embedded />}
      </Suspense>
      {subTab === 'hf' && <HFPanel hf={hf} kosis={HF_KOSIS} lang={lang} />}
      {subTab === 'htn' && <HTNPanel lang={lang} />}
      {subTab === 'oecd' && <OECDPanel kosis={MI_KOSIS} lang={lang} />}
    </div>
  );
}

// ── MI Panel ──
function MIPanel({ mi, kosis, lang }) {
  const latest = '2023';
  const kpis = [
    { label: t('발생률', 'Incidence', lang), value: kosis.incidenceRate['전체']?.[latest], unit: '/10만', color: '#ff6b6b', refUrl: 'https://kosis.kr/', refLabel: t('KOSIS 심뇌혈관질환통계', 'KOSIS CVD Statistics', lang) },
    { label: t('환자수', 'Cases', lang), value: kosis.cases['전체']?.[latest]?.toLocaleString(), unit: t('명', '', lang), color: '#ffd93d', refUrl: 'https://kosis.kr/', refLabel: t('KOSIS 심뇌혈관질환통계', 'KOSIS CVD Statistics', lang) },
    { label: t('30일 치명률', '30-day CFR', lang), value: kosis.fatality30d['전체']?.[latest], unit: '%', color: '#ff922b', refUrl: 'https://kosis.kr/', refLabel: t('KOSIS 심뇌혈관질환통계', 'KOSIS CVD Statistics', lang) },
    { label: t('1년 치명률', '1-yr CFR', lang), value: kosis.fatality1yr['전체']?.[latest], unit: '%', color: '#e599f7', refUrl: 'https://kosis.kr/', refLabel: t('KOSIS 심뇌혈관질환통계', 'KOSIS CVD Statistics', lang) },
  ];

  return (
    <>
      <KPIRow kpis={kpis} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
        <ChartPanel title={t('MI 발생률 추이', 'MI Incidence Trend', lang)} refUrl="https://kosis.kr/" refLabel={t('KOSIS 심뇌혈관질환통계', 'KOSIS CVD Statistics', lang)}>
          <TrendLines data={kosis.incidenceRate} keys={['전체', '남자', '여자']} lang={lang} />
        </ChartPanel>
        <ChartPanel title={t('30일 치명률 추이', '30-day Fatality Trend', lang)} refUrl="https://kosis.kr/" refLabel={t('KOSIS 심뇌혈관질환통계', 'KOSIS CVD Statistics', lang)}>
          <TrendLines data={kosis.fatality30d} keys={['전체', '남자', '여자']} lang={lang} colors={{ '전체': '#ff922b', '남자': '#4d96ff', '여자': '#ff6b6b' }} />
        </ChartPanel>
        <ChartPanel title={t('발생유형별 발생률', 'Incidence by Onset Type', lang)} refUrl="https://kosis.kr/" refLabel="KOSIS">
          <TrendLines data={kosis.incidenceType} keys={['전체_첫발생', '전체_재발생']} lang={lang}
            colors={{ '전체_첫발생': '#4d96ff', '전체_재발생': '#ff6b6b' }}
            labels={{ '전체_첫발생': t('첫발생', 'First', lang), '전체_재발생': t('재발생', 'Recurrent', lang) }} />
        </ChartPanel>
        <ChartPanel title={t('원내 30일 사망률', 'In-hospital 30-day Mortality', lang)} refUrl="https://kosis.kr/" refLabel="KOSIS">
          <TrendLines data={kosis.inhospital30d} keys={['전체_환자단위', '전체_입원단위']} lang={lang}
            colors={{ '전체_환자단위': '#20c997', '전체_입원단위': '#ffd93d' }}
            labels={{ '전체_환자단위': t('환자단위', 'Patient', lang), '전체_입원단위': t('입원단위', 'Admission', lang) }} />
        </ChartPanel>
      </div>
    </>
  );
}

// ── Stroke Panel ──
function StrokePanel({ stroke, kosis, lang }) {
  const [type, setType] = useState('ischemic');

  const typeData = type === 'ischemic' ? kosis.ischemic : kosis.hemorrhagic;
  const monthlyData = typeData?.monthlyRegion || {};
  const months = Object.keys(monthlyData).filter(m => m !== '계');

  // Monthly total for latest year
  const latestYear = type === 'ischemic' ? '2024' : '2024';
  const monthlyTotals = months.map(m => ({
    month: m,
    count: monthlyData[m]?.['전체']?.[latestYear] || 0,
  }));

  return (
    <>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        {['ischemic', 'hemorrhagic'].map(tp => (
          <button key={tp} onClick={() => setType(tp)} style={{
            padding: '6px 14px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer',
            background: type === tp ? 'rgba(0,212,255,0.1)' : 'transparent',
            border: type === tp ? '1px solid rgba(0,212,255,0.3)' : '1px solid rgba(255,255,255,0.06)',
            color: type === tp ? '#00d4ff' : '#bbbbdd',
          }}>
            {tp === 'ischemic' ? t('허혈성', 'Ischemic', lang) : t('출혈성', 'Hemorrhagic', lang)}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <ChartPanel title={t(`${type === 'ischemic' ? '허혈성' : '출혈성'} 월별 환자수 (${latestYear})`,
          `${type === 'ischemic' ? 'Ischemic' : 'Hemorrhagic'} Monthly Cases (${latestYear})`, lang)}
          refUrl="https://kosis.kr/" refLabel={t('KOSIS 심뇌혈관질환통계 2022-2024', 'KOSIS CVD Statistics 2022-2024', lang)}>
          <MonthlyBar data={monthlyTotals} lang={lang} />
        </ChartPanel>
        <ChartPanel title={t('시도별 이송시간 (2023)', 'Regional Transport Time (2023)', lang)} refUrl="https://kosis.kr/" refLabel="KOSIS">
          <TransportSummary data={kosis.transportGrouped} lang={lang} />
        </ChartPanel>
      </div>

      <div style={{ marginTop: '12px', fontSize: '10px', color: '#444' }}>
        {t('2022년부터 허혈성/출혈성 분리 집계. 2024년 데이터는 부분연도(partial-year) 가능. 2014-2021 전체 데이터는 네트워크 탭에서 확인.',
           'Ischemic/Hemorrhagic split since 2022. 2024 data may be partial-year. Pre-2022 combined data in Network tab.', lang)}
      </div>
    </>
  );
}

// ── HF Panel ──
function HFPanel({ hf, kosis, lang }) {
  const latest = '2023';
  const hfPrev = typeof hf.prevalence === 'object' ? hf.prevalence?.value : hf.prevalence;
  const hfSurv5 = typeof hf.survival === 'object' ? hf.survival?.year5 : hf.survival?.fiveYear;
  const kpis = [
    { label: t('유병률', 'Prevalence', lang), value: hfPrev, unit: '%', color: '#e599f7', refUrl: 'https://www.kshf.or.kr/', refLabel: 'KSHF HF Fact Sheet 2025' },
    { label: t('환자수', 'Patients', lang), value: '175', unit: t('만명', '0K', lang), color: '#ffd93d', refUrl: 'https://www.kshf.or.kr/', refLabel: 'KSHF HF Fact Sheet 2025' },
    { label: t('입원율', 'Admission', lang), value: kosis.admission['전체']?.[latest], unit: '/10만', color: '#ff922b', refUrl: 'https://kosis.kr/', refLabel: 'KOSIS HIRA' },
    { label: t('5년 생존율', '5yr Survival', lang), value: hfSurv5, unit: '%', color: '#6bcb77', refUrl: 'https://www.kshf.or.kr/', refLabel: 'KSHF HF Fact Sheet 2025' },
  ];

  return (
    <>
      <KPIRow kpis={kpis} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
        <InsightPanel
          title={t('심부전 입원율 추이', 'HF Admission Rate Trend', lang)}
          source="KOSIS HIRA" sourceUrl="https://kosis.kr/"
          details={[
            { label: t('전체', 'Total', lang), value: kosis.admission['전체']?.['2023'] ?? '—', unit: '/10만', color: '#e599f7' },
            { label: t('남자', 'Male', lang), value: kosis.admission['남자']?.['2023'] ?? '—', unit: '/10만', color: '#4d96ff' },
            { label: t('여자', 'Female', lang), value: kosis.admission['여자']?.['2023'] ?? '—', unit: '/10만', color: '#ff6b6b' },
          ]}
          insight={{
            ko: '심부전 입원율은 2015년 이후 지속 증가 추세. 고령화와 심부전 진단율 향상이 주 원인. 남성이 여성보다 입원율이 높으나, 80세 이상에서는 여성 비율이 역전. HFpEF 비율 증가로 진단 패턴 변화 중.',
            en: 'HF admission rate has been rising steadily since 2015, driven by aging and improved diagnosis. Males have higher admission rates, but females surpass males above age 80. HFpEF proportion is increasing, shifting diagnostic patterns.',
          }}
        >
          <TrendLines data={kosis.admission} keys={['전체', '남자', '여자']} lang={lang} colors={{ '전체': '#e599f7', '남자': '#4d96ff', '여자': '#ff6b6b' }} />
        </InsightPanel>
        <InsightPanel
          title={t('심부전 동반질환', 'HF Comorbidities', lang)}
          source="KSHF 2025" sourceUrl="https://www.kshf.or.kr/"
          insight={{
            ko: '심부전 환자의 75% 이상이 고혈압을 동반하며, 당뇨 동반율 약 35%. 심방세동은 HFpEF에서 50% 이상 동반. 동반질환 수가 많을수록 재입원율과 사망률이 유의하게 증가하여 다학제 통합 관리가 필수.',
            en: 'Over 75% of HF patients have comorbid hypertension, ~35% diabetes. AF accompanies >50% of HFpEF. More comorbidities significantly increase readmission and mortality, necessitating multidisciplinary integrated care.',
          }}
        >
          <ComorbidityBars data={hf.comorbidities} lang={lang} />
        </InsightPanel>
      </div>
    </>
  );
}

// ── OECD Panel ──
function OECDPanel({ kosis, lang }) {
  const OECD_EN = {'한국':'Korea','이스라엘':'Israel','호주':'Australia','멕시코':'Mexico','칠레':'Chile','캐나다':'Canada','일본':'Japan','프랑스':'France','독일':'Germany','영국':'UK','이탈리아':'Italy','스페인':'Spain','스웨덴':'Sweden','노르웨이':'Norway','핀란드':'Finland','덴마크':'Denmark','네덜란드':'Netherlands','벨기에':'Belgium','스위스':'Switzerland','터키':'Turkey','폴란드':'Poland','체코':'Czech Rep.','헝가리':'Hungary','슬로바키아':'Slovakia','슬로베니아':'Slovenia','에스토니아':'Estonia','라트비아':'Latvia','리투아니아':'Lithuania','아이슬란드':'Iceland','룩셈부르크':'Luxembourg','그리스':'Greece','포르투갈':'Portugal','아일랜드':'Ireland','뉴질랜드':'New Zealand','콜롬비아':'Colombia','코스타리카':'Costa Rica','루마니아':'Romania','1100':'OECD Avg','1195':'EU27','1225':'Colombia','2020':'Mexico','2030':'Chile','3060':'Latvia','3065':'Costa Rica','3070':'Iceland','4015':'Canada','4025':'Czech Rep.','4045':'Romania','4050':'Finland','4055':'France','4060':'Greece','4070':'Italy','4075':'Japan','4080':'Luxembourg','4100':'Netherlands','4105':'Norway','4110':'Poland','4120':'Portugal','4125':'Slovakia','4135':'Slovenia','4140':'Spain','4165':'Sweden','4170':'Switzerland','4175':'Turkey','4180':'UK','4185':'Hungary','4200':'Denmark','4205':'Estonia','4210':'Germany','4215':'Ireland','4220':'Lithuania','4230':'Belgium','6010':'New Zealand','6060':'USA'};
  const oecdData = kosis.oecdMortality || {};
  const koreaData = oecdData['한국']?.['원내입원'] || {};
  const latestYear = Object.keys(koreaData).sort().pop();

  const countries = Object.keys(oecdData);
  const comparison = countries.map(c => ({
    country: c,
    countryEn: OECD_EN[c] || c,
    value: oecdData[c]?.['원내입원']?.[latestYear],
  })).filter(c => c.value != null).sort((a, b) => a.value - b.value);

  return (
    <InsightPanel
      title={t(`OECD AMI 원내 30일 사망률 (${latestYear})`, `OECD AMI In-hospital 30-day Mortality (${latestYear})`, lang)}
      source="KOSIS OECD Health Statistics" sourceUrl="https://kosis.kr/"
      details={[
        { label: t('한국', 'Korea', lang), value: koreaData[latestYear] ?? '—', unit: '%', color: '#00d4ff' },
        { label: t('비교국 수', 'Countries', lang), value: comparison.length, color: '#aaaacc' },
      ]}
      insight={{
        ko: '한국의 AMI 원내 30일 사망률은 OECD 평균 대비 양호한 수준. 이는 PCI(경피적 관상동맥 중재술) 접근성과 24시간 심혈관센터 운영 체계의 영향. 다만 농어촌 지역의 이송시간 격차가 존재하여 지역별 편차 해소가 과제.',
        en: 'Korea\'s AMI in-hospital 30-day mortality is favorable vs OECD average, reflecting high PCI accessibility and 24/7 cardiovascular center operations. However, transport time disparities in rural areas remain a challenge for reducing regional variation.',
      }}
    >
      <div>
        {(() => {
          const maxVal = Math.max(...comparison.map(x => x.value));
          const minVal = Math.min(...comparison.map(x => x.value));
          const FLAG = {'Korea':'🇰🇷','Israel':'🇮🇱','Australia':'🇦🇺','Mexico':'🇲🇽','Chile':'🇨🇱','Canada':'🇨🇦','Japan':'🇯🇵','France':'🇫🇷','Germany':'🇩🇪','UK':'🇬🇧','Italy':'🇮🇹','Spain':'🇪🇸','Sweden':'🇸🇪','Norway':'🇳🇴','Finland':'🇫🇮','Denmark':'🇩🇰','Netherlands':'🇳🇱','Belgium':'🇧🇪','Switzerland':'🇨🇭','Turkey':'🇹🇷','Poland':'🇵🇱','Czech Rep.':'🇨🇿','Hungary':'🇭🇺','Slovakia':'🇸🇰','Slovenia':'🇸🇮','Estonia':'🇪🇪','Latvia':'🇱🇻','Lithuania':'🇱🇹','Iceland':'🇮🇸','Luxembourg':'🇱🇺','Greece':'🇬🇷','Portugal':'🇵🇹','Ireland':'🇮🇪','New Zealand':'🇳🇿','Colombia':'🇨🇴','Costa Rica':'🇨🇷','Romania':'🇷🇴','USA':'🇺🇸'};
          return comparison.map((c) => {
            const isKorea = c.country === '한국';
            const name = c.countryEn || c.country;
            const barW = (c.value / maxVal) * 100;
            const ratio = maxVal > minVal ? (c.value - minVal) / (maxVal - minVal) : 0;
            const barColor = isKorea ? '#00d4ff'
              : `rgb(${Math.round(60 + ratio * 195)}, ${Math.round(180 - ratio * 130)}, ${Math.round(255 - ratio * 155)})`;
            return (
              <div key={c.country} style={{
                display: 'flex', alignItems: 'center', gap: '3px', padding: '1px 0',
                background: isKorea ? 'rgba(0,212,255,0.08)' : 'transparent',
                borderRadius: '3px',
              }}>
                <span style={{ fontSize: '10px', width: '14px', textAlign: 'center', flexShrink: 0 }}>{FLAG[name] || ''}</span>
                <div style={{ width: '62px', textAlign: 'right', fontSize: '9px', color: isKorea ? '#00d4ff' : '#bbbbdd', fontWeight: isKorea ? 700 : 400, flexShrink: 0 }}>
                  {name}
                </div>
                <div style={{ flex: 1, height: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${barW}%`, height: '100%',
                    background: barColor,
                    borderRadius: '3px', opacity: 0.7,
                  }} />
                </div>
                <div style={{ width: '34px', fontSize: '9px', textAlign: 'right', color: isKorea ? '#00d4ff' : '#aaaacc', fontFamily: "'JetBrains Mono'", fontWeight: isKorea ? 700 : 400, flexShrink: 0 }}>
                  {c.value}%
                </div>
              </div>
            );
          });
        })()}
      </div>
    </InsightPanel>
  );
}


// ── Shared Components ──

function KPIRow({ kpis }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${kpis.length}, 1fr)`, gap: '12px' }}>
      {kpis.map((kpi, i) => (
        <div key={i} style={{
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '12px', padding: '16px', position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: kpi.color, opacity: 0.6 }} />
          <div style={{ fontSize: '11px', color: '#bbbbdd', marginBottom: '6px' }}>{kpi.label}</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
            <span style={{ fontSize: '24px', fontWeight: 800, color: kpi.color, fontFamily: "'JetBrains Mono'" }}>{kpi.value ?? '—'}</span>
            <span style={{ fontSize: '11px', color: '#aaaacc' }}>{kpi.unit}</span>
          </div>
          {kpi.refUrl && (
            <a href={kpi.refUrl} target="_blank" rel="noopener noreferrer"
              style={{ fontSize: '8px', color: '#00d4ff88', textDecoration: 'none', marginTop: '2px', display: 'block' }}>
              📎 {kpi.refLabel}
            </a>
          )}
        </div>
      ))}
    </div>
  );
}

function ChartPanel({ title, children, refUrl, refLabel }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: '12px', padding: '20px',
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', margin: '0 0 14px' }}>
        <h3 style={{ fontSize: '13px', color: '#fff', margin: 0, fontFamily: "'Noto Sans KR'" }}>{title}</h3>
        {refUrl && (
          <a href={refUrl} target="_blank" rel="noopener noreferrer"
            style={{ fontSize: '8px', color: '#00d4ff88', textDecoration: 'none', whiteSpace: 'nowrap' }}>
            📎 {refLabel}
          </a>
        )}
      </div>
      {children}
    </div>
  );
}

function TrendLines({ data, keys, lang, colors, labels }) {
  const defaultColors = { '전체': '#ff6b6b', '남자': '#4d96ff', '여자': '#ff6b6b' };
  const c = colors || defaultColors;
  const lb = labels || {};
  const firstKey = keys[0];
  const years = Object.keys(data[firstKey] || {}).sort();
  if (!years.length) return <div style={{ color: '#9999bb', fontSize: '12px' }}>No data</div>;

  const allVals = keys.flatMap(k => years.map(y => data[k]?.[y]).filter(v => v != null));
  const maxVal = Math.max(...allVals);
  const minVal = Math.min(...allVals);
  const range = maxVal - minVal || 1;

  const W = 520, H = 170, PL = 45, PR = 10, PT = 10, PB = 28;
  const plotW = W - PL - PR, plotH = H - PT - PB;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%' }}>
      {keys.map(k => {
        const pts = years.map((y, i) => {
          const v = data[k]?.[y];
          if (v == null) return null;
          const x = PL + (i / Math.max(years.length - 1, 1)) * plotW;
          const yy = PT + plotH - ((v - minVal) / range) * plotH;
          return `${x},${yy}`;
        }).filter(Boolean).join(' ');
        return <polyline key={k} points={pts} fill="none" stroke={c[k] || '#bbbbdd'} strokeWidth="1.5" />;
      })}
      {years.filter((_, i) => i % Math.ceil(years.length / 6) === 0 || i === years.length - 1).map(y => {
        const x = PL + (years.indexOf(y) / Math.max(years.length - 1, 1)) * plotW;
        return <text key={y} x={x} y={H - 4} fill="#9999bb" fontSize="9" textAnchor="middle" fontFamily="JetBrains Mono">{y}</text>;
      })}
      {keys.map((k, i) => (
        <g key={k} transform={`translate(${PL + i * 90}, ${H - 16})`}>
          <rect width="10" height="3" fill={c[k] || '#bbbbdd'} rx="1" />
          <text x="14" y="3" fill="#bbbbdd" fontSize="9">{lb[k] || (lang === 'ko' ? k : ({'전체':'Total','남자':'Male','여자':'Female','전체_첫발생':'First','전체_재발생':'Recurrent','전체_환자단위':'Patient','전체_입원단위':'Admission'}[k] || k))}</text>
        </g>
      ))}
    </svg>
  );
}

function MonthlyBar({ data, lang }) {
  if (!data.length) return null;
  const maxVal = Math.max(...data.map(d => d.count));
  const W = 520, H = 170, PL = 40, PR = 10, PT = 10, PB = 30;
  const barW = (W - PL - PR) / data.length;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%' }}>
      {data.map((d, i) => {
        const h = maxVal > 0 ? (d.count / maxVal) * (H - PT - PB) : 0;
        const x = PL + i * barW;
        return (
          <g key={d.month}>
            <rect x={x + 2} y={H - PB - h} width={barW - 4} height={h} fill="#4d96ff66" rx="3" />
            <text x={x + barW / 2} y={H - PB + 14} fill="#bbbbdd" fontSize="9" textAnchor="middle">{d.month.replace('월', '')}</text>
            <text x={x + barW / 2} y={H - PB - h - 4} fill="#ccccee" fontSize="8" textAnchor="middle">{d.count.toLocaleString()}</text>
          </g>
        );
      })}
    </svg>
  );
}

const PROV_EN = {'서울':'Seoul','부산':'Busan','대구':'Daegu','인천':'Incheon','광주':'Gwangju','대전':'Daejeon','울산':'Ulsan','세종':'Sejong','경기':'Gyeonggi','강원':'Gangwon','충북':'Chungbuk','충남':'Chungnam','전북':'Jeonbuk','전남':'Jeonnam','경북':'Gyeongbuk','경남':'Gyeongnam','제주':'Jeju'};

function TransportSummary({ data, lang }) {
  if (!data) return null;
  const regions = Object.keys(data).filter(r => r !== '전체');
  const sorted = regions.map(r => ({
    region: r,
    under3: data[r]?.['3시간미만'] || 0,
    total: (data[r]?.['3시간미만'] || 0) + (data[r]?.['3~6시간'] || 0) + (data[r]?.['6시간이상'] || 0) + (data[r]?.['미상'] || 0),
  })).sort((a, b) => (b.under3 / (b.total || 1)) - (a.under3 / (a.total || 1)));

  return (
    <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
      {sorted.map(r => {
        const pct = r.total > 0 ? ((r.under3 / r.total) * 100).toFixed(1) : 0;
        return (
          <div key={r.region} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '2px 0' }}>
            <div style={{ width: '40px', fontSize: '11px', color: '#bbbbdd', textAlign: 'right' }}>{lang === 'en' ? (PROV_EN[r.region] || r.region) : r.region}</div>
            <div style={{ flex: 1, height: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ width: `${pct}%`, height: '100%', background: pct > 80 ? '#6bcb77' : pct > 60 ? '#ffd93d' : '#ff6b6b', borderRadius: '3px' }} />
            </div>
            <div style={{ width: '45px', fontSize: '10px', color: '#aaaacc', fontFamily: "'JetBrains Mono'" }}>{pct}%</div>
          </div>
        );
      })}
    </div>
  );
}

const COMORB_LABELS = {
  htn: { ko: '고혈압', en: 'Hypertension' }, dm: { ko: '당뇨', en: 'Diabetes' },
  ihd: { ko: '허혈성심질환', en: 'IHD' }, af: { ko: '심방세동', en: 'A-fib' },
  ckd: { ko: 'CKD', en: 'CKD' }, stroke: { ko: '뇌졸중', en: 'Stroke' },
  hypertension: { ko: '고혈압', en: 'Hypertension' }, highLDL: { ko: '고LDL', en: 'High LDL' },
  obesity: { ko: '비만', en: 'Obesity' }, integratedControl: { ko: '통합관리', en: 'All Targets' },
  withDiabetes: { ko: '당뇨동반', en: 'w/ Diabetes' }, withHypertension: { ko: '고혈압동반', en: 'w/ Hypertension' },
  withObesity: { ko: '비만동반', en: 'w/ Obesity' }, withAbdominalObesity: { ko: '복부비만동반', en: 'w/ Central Obesity' },
};

function ComorbidityBars({ data, lang }) {
  if (!data) return <div style={{ color: '#9999bb', fontSize: '12px' }}>No data</div>;
  const items = typeof data === 'object' && !Array.isArray(data) ? Object.entries(data) : [];
  if (!items.length) return <div style={{ color: '#9999bb', fontSize: '12px' }}>No structured data</div>;

  return (
    <div>
      {items.slice(0, 8).map(([k, v]) => {
        const val = typeof v === 'number' ? v : parseFloat(v);
        if (isNaN(val)) return null;
        const label = COMORB_LABELS[k] ? COMORB_LABELS[k][lang] || COMORB_LABELS[k].en : k;
        return (
          <div key={k} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '3px 0' }}>
            <div style={{ width: '120px', fontSize: '11px', color: '#bbbbdd', textAlign: 'right' }}>{label}</div>
            <div style={{ flex: 1, height: '14px', background: 'rgba(255,255,255,0.03)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ width: `${Math.min(val, 100)}%`, height: '100%', background: '#e599f788', borderRadius: '3px' }} />
            </div>
            <div style={{ width: '40px', fontSize: '11px', color: '#aaaacc', fontFamily: "'JetBrains Mono'" }}>{val}%</div>
          </div>
        );
      })}
    </div>
  );
}

// ── HTN Panel ──
function HTNPanel({ lang }) {
  const htn = DISEASE_EPI.diseases.hypertension;
  const ts = DISEASE_TIMESERIES.htn_prevalence;
  const cascade = DISEASE_TIMESERIES.htn_factsheet_cascade;

  const cascadeYears = cascade?.years || [];
  const cascadeAwareness = cascade?.awareness || [];
  const cascadeTreatment = cascade?.treatment || [];
  const cascadeControl = cascade?.control || [];
  const latestIdx = cascadeYears.length - 1;

  const kpis = [
    { label: t('유병률', 'Prevalence', lang), value: 29, unit: '%', sub: t('20세 이상, 1,260만명', '≥20y, 12.6M', lang), color: '#ff6b6b', refUrl: 'https://www.ksh.or.kr/', refLabel: 'KSH 2025' },
    { label: t('인지율', 'Awareness', lang), value: cascadeAwareness[latestIdx], unit: '%', color: '#ffd93d', refUrl: 'https://www.ksh.or.kr/', refLabel: 'KSH 2025' },
    { label: t('치료율', 'Treatment', lang), value: cascadeTreatment[latestIdx], unit: '%', color: '#6bcb77', refUrl: 'https://www.ksh.or.kr/', refLabel: 'KSH 2025' },
    { label: t('조절률', 'Control', lang), value: cascadeControl[latestIdx], unit: '%', color: '#4d96ff', refUrl: 'https://www.ksh.or.kr/', refLabel: 'KSH 2025' },
  ];

  const trendYears = ts?.years || [];
  const trendCrude = ts?.crude || [];
  const W = 600, H = 200, PL = 45, PR = 10, PT = 15, PB = 30;
  const plotW = W - PL - PR, plotH = H - PT - PB;

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '16px' }}>
        {kpis.map((kpi, i) => (
          <div key={i} style={{
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '12px', padding: '16px', position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: kpi.color, opacity: 0.6 }} />
            <div style={{ fontSize: '11px', color: '#bbbbdd', marginBottom: '6px' }}>{kpi.label}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
              <span style={{ fontSize: '28px', fontWeight: 800, color: kpi.color, fontFamily: "'JetBrains Mono'" }}>{kpi.value ?? '—'}</span>
              <span style={{ fontSize: '11px', color: '#aaaacc' }}>{kpi.unit}</span>
            </div>
            {kpi.sub && <div style={{ fontSize: '9px', color: '#9999bb', marginTop: '4px' }}>{kpi.sub}</div>}
            {kpi.refUrl && (
              <a href={kpi.refUrl} target="_blank" rel="noopener noreferrer"
                style={{ fontSize: '8px', color: '#00d4ff88', textDecoration: 'none', marginTop: '2px', display: 'block' }}>
                📎 {kpi.refLabel}
              </a>
            )}
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <InsightPanel
          title={t('유병률 추이 (30세 이상, 조율)', 'Prevalence Trend (≥30y, crude)', lang)}
          source="KNHANES 1998-2023" sourceUrl="https://www.ksh.or.kr/"
          details={[
            { label: t('최신 유병률', 'Latest Prevalence', lang), value: trendCrude[trendCrude.length - 1] ?? '—', unit: '%', color: '#ff6b6b' },
            { label: t('기간', 'Period', lang), value: `${trendYears[0]}-${trendYears[trendYears.length - 1]}`, color: '#aaaacc' },
          ]}
          insight={{
            ko: '고혈압 유병률(30세+)은 1998년 약 30%에서 2007년 24.6%까지 하락 후 다시 상승하여 최근 29% 수준. 비만율 증가와 고령화가 주요 원인. 2020년 COVID 기간 건강검진 감소로 일시적 변동 있으나 장기 추세는 상승.',
            en: 'HTN prevalence (≥30y) dropped from ~30% in 1998 to 24.6% in 2007, then rebounded to ~29%. Rising obesity and aging are key drivers. COVID-related screening reduction caused transient fluctuation in 2020, but long-term trend is upward.',
          }}
        >
          <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%' }}>
            {[15, 20, 25, 30, 35].map(v => {
              const y = PT + plotH - ((v - 15) / 20) * plotH;
              return (<g key={v}><line x1={PL} x2={W - PR} y1={y} y2={y} stroke="rgba(255,255,255,0.04)" /><text x={PL - 4} y={y + 3} fill="#9999bb" fontSize="9" textAnchor="end" fontFamily="JetBrains Mono">{v}%</text></g>);
            })}
            <polyline points={trendYears.map((yr, i) => {
              const x = PL + (i / Math.max(trendYears.length - 1, 1)) * plotW;
              const y = PT + plotH - ((trendCrude[i] - 15) / 20) * plotH;
              return `${x},${y}`;
            }).join(' ')} fill="none" stroke="#ff6b6b" strokeWidth="2" />
            {trendYears.filter((_, i) => i % 4 === 0 || i === trendYears.length - 1).map(yr => {
              const x = PL + (trendYears.indexOf(yr) / Math.max(trendYears.length - 1, 1)) * plotW;
              return <text key={yr} x={x} y={H - 6} fill="#9999bb" fontSize="9" textAnchor="middle" fontFamily="JetBrains Mono">{yr}</text>;
            })}
          </svg>
        </InsightPanel>

        <InsightPanel
          title={t('관리 캐스케이드 추이 (팩트시트별)', 'Management Cascade (by Factsheet)', lang)}
          source="KSH 2018-2025" sourceUrl="https://www.ksh.or.kr/"
          details={[
            { label: t('인지율', 'Awareness', lang), value: cascadeAwareness[latestIdx] ?? '—', unit: '%', color: '#ffd93d' },
            { label: t('치료율', 'Treatment', lang), value: cascadeTreatment[latestIdx] ?? '—', unit: '%', color: '#6bcb77' },
            { label: t('조절률', 'Control', lang), value: cascadeControl[latestIdx] ?? '—', unit: '%', color: '#4d96ff' },
          ]}
          insight={{
            ko: '인지율 65%→79%, 치료율 61%→76%, 조절률 44%→62%로 7년간 꾸준히 개선. 그러나 20-30대 유병자의 인지율 36%, 치료율 35%로 젊은 층 관리 사각지대가 존재. 65세 이상은 인지율 90% 이상으로 양호.',
            en: 'Awareness 65%→79%, treatment 61%→76%, control 44%→62% — steady improvement over 7 years. However, ages 20-30: awareness 36%, treatment 35% — young adults remain a blind spot. Ages 65+ awareness exceeds 90%.',
          }}
        >
          <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%' }}>
            {[40, 50, 60, 70, 80].map(v => {
              const y = PT + plotH - ((v - 30) / 60) * plotH;
              return (<g key={v}><line x1={PL} x2={W - PR} y1={y} y2={y} stroke="rgba(255,255,255,0.04)" /><text x={PL - 4} y={y + 3} fill="#9999bb" fontSize="9" textAnchor="end" fontFamily="JetBrains Mono">{v}%</text></g>);
            })}
            {[
              { data: cascadeAwareness, color: '#ffd93d', label: t('인지율', 'Awareness', lang) },
              { data: cascadeTreatment, color: '#6bcb77', label: t('치료율', 'Treatment', lang) },
              { data: cascadeControl, color: '#4d96ff', label: t('조절률', 'Control', lang) },
            ].map(series => {
              const pts = cascadeYears.map((yr, i) => {
                if (series.data[i] == null) return null;
                const x = PL + (i / Math.max(cascadeYears.length - 1, 1)) * plotW;
                const y = PT + plotH - ((series.data[i] - 30) / 60) * plotH;
                return `${x},${y}`;
              }).filter(Boolean).join(' ');
              return <polyline key={series.label} points={pts} fill="none" stroke={series.color} strokeWidth="2" />;
            })}
            {cascadeYears.map((yr, i) => {
              const x = PL + (i / Math.max(cascadeYears.length - 1, 1)) * plotW;
              return <text key={yr} x={x} y={H - 6} fill="#9999bb" fontSize="9" textAnchor="middle" fontFamily="JetBrains Mono">{yr}</text>;
            })}
            {[{ l: t('인지율','Awareness',lang), c: '#ffd93d' }, { l: t('치료율','Treatment',lang), c: '#6bcb77' }, { l: t('조절률','Control',lang), c: '#4d96ff' }].map((s, i) => (
              <g key={s.l} transform={`translate(${PL + i * 90}, ${H - 18})`}><rect width="10" height="3" fill={s.c} rx="1" /><text x="14" y="3" fill="#bbbbdd" fontSize="9">{s.l}</text></g>
            ))}
          </svg>
        </InsightPanel>
      </div>

      {/* Care Cascade Funnel */}
      <CascadeWaterfall
        title={t('고혈압 관리 캐스케이드', 'Hypertension Care Cascade', lang)}
        source="KSH 2025"
        totalPop={4350}
        stages={[
          { label: t('유병','Prevalent'), count: 1260, color: '#ff6b6b', note: t('BP≥140/90 or 복약자','BP≥140/90 or on meds') },
          { label: t('진단(인지)','Diagnosed'), count: Math.round(1260 * 0.79), color: '#ffd93d', note: t('의사 진단 경험','Doctor Dx') },
          { label: t('복약','On Meds'), count: Math.round(1260 * 0.76), color: '#6bcb77', note: t('항고혈압제','Anti-HTN Rx') },
          { label: t('조절','Controlled'), count: Math.round(1260 * 0.62), color: '#4d96ff', note: 'BP <140/90' },
        ]}
      />

      <div style={{ marginTop: '12px', padding: '12px 16px', background: 'rgba(255,107,107,0.05)', borderRadius: '8px', border: '1px solid rgba(255,107,107,0.15)', fontSize: '11px', color: '#ccc', lineHeight: 1.6 }}>
        <strong style={{ color: '#ff6b6b' }}>{t('핵심', 'Key', lang)}:</strong>{' '}
        {t('인지율 65%→79%, 치료율 61%→76%, 조절률 44%→62%로 7년간 꾸준히 개선. 그러나 20-30대 유병자의 인지율 36%, 치료율 35%로 젊은 층 관리 사각지대.',
           'Awareness 65%→79%, treatment 61%→76%, control 44%→62% — steady 7yr improvement. But ages 20-30: awareness 36%, treatment 35% — young adults remain a blind spot.', lang)}
      </div>
    </>
  );
}

