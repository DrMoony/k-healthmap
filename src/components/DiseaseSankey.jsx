import { useState } from 'react';
import { ResponsiveSankey } from '@nivo/sankey';

// ── Evidence-based disease progression flow data ──────────────
// Values represent estimated adult patient counts (만 명 단위)
// Population basis: 20세+ ~4,350만, 30세+ ~3,600만 (2024 행안부)
// 단면 동반이환률 기반 환자 수 추정치 (질환 간 중복 포함)
const sankeyData = {
  nodes: [
    // Level 0 - Root risk factors
    { id: '비만 1,670만', nodeColor: '#ff006e' },
    { id: '유전·노화·환경', nodeColor: '#6c7a89' },
    { id: '대사이상 (Lean)', nodeColor: '#bbbbdd' },
    // Level 1 - Primary diseases
    { id: '당뇨 530만', nodeColor: '#00d4ff' },
    { id: '이상지질혈증 1,780만', nodeColor: '#b388ff' },
    { id: '고혈압 1,300만', nodeColor: '#ffd60a' },
    // Level 2 - Secondary complications
    { id: 'MASLD 768만', nodeColor: '#00ff88' },
    { id: 'MASH ~153만', nodeColor: '#2ecc71' },
    { id: '심혈관질환', nodeColor: '#ff6b6b' },
    { id: 'CKD 357만', nodeColor: '#4ecdc4' },
    { id: '심부전 132만', nodeColor: '#e91e63' },
    // Level 3 - Terminal outcomes
    { id: '간경변·HCC', nodeColor: '#e74c3c' },
    { id: 'MI·뇌졸중 14.5만/년', nodeColor: '#e67e22' },
    { id: '투석 13만', nodeColor: '#9b59b6' },
  ],
  links: [
    // 비만 → 1차 질환
    { source: '비만 1,670만', target: '당뇨 530만', value: 285 },
    // 530만 × 53.8%(비만동반) = 285만 [KDA FS 2024]

    { source: '비만 1,670만', target: '이상지질혈증 1,780만', value: 982 },
    // 1,780만 × 55.2%(비만동반) = 982만 [KSoLA FS 2024]

    { source: '비만 1,670만', target: '고혈압 1,300만', value: 520 },
    // 1,300만 × ~40%(비만동반) = 520만 [KOSSO FS 2024]

    { source: '비만 1,670만', target: 'MASLD 768만', value: 538 },
    // 768만 × 70%(비만동반 MASLD) = 538만 [KASL FS 2023]

    // 대사이상(Lean) → MASLD
    { source: '대사이상 (Lean)', target: 'MASLD 768만', value: 230 },
    // 768만 × 30%(Lean MASLD) = 230만. BMI<25이나 인슐린저항성/유전적 소인. [KASL FS 2023]

    // 유전·노화·환경 → 1차 질환 (비만 독립 경로)
    { source: '유전·노화·환경', target: '당뇨 530만', value: 245 },
    // 530만 - 285만(비만동반) = 245만. 가족력/노화/유전적 소인 [KDA FS 2024]

    { source: '유전·노화·환경', target: '이상지질혈증 1,780만', value: 798 },
    // 1,780만 - 982만(비만동반) = 798만. 유전적 이상지질혈증, 노화 [KSoLA FS 2024]

    { source: '유전·노화·환경', target: '고혈압 1,300만', value: 780 },
    // 1,300만 - 520만(비만동반) = 780만. 본태성 고혈압, 노화, 유전 [KSH FS 2024]

    // 당뇨·이상지질혈증 → 대사이상(Lean) 기여
    { source: '당뇨 530만', target: '대사이상 (Lean)', value: 80 },
    // 당뇨 환자 중 비비만 인슐린저항성 → Lean MASLD 기여 [추정]

    { source: '이상지질혈증 1,780만', target: '대사이상 (Lean)', value: 100 },
    // 비비만 이상지질혈증 → Lean MASLD 기여 (고중성지방 등) [추정]

    // 당뇨 → 2차
    { source: '당뇨 530만', target: 'MASLD 768만', value: 112 },
    // 768만 × 14.6%(당뇨동반) = 112만 [KASL FS 2023]

    { source: '당뇨 530만', target: '심혈관질환', value: 316 },
    // 530만 × 59.6%(고혈압동반=CVD고위험) = 316만 [KDA FS 2024]

    { source: '당뇨 530만', target: 'CKD 357만', value: 106 },
    // 530만 × ~20%(DKD) = 106만 [추정]

    // 이상지질혈증 → 2차
    { source: '이상지질혈증 1,780만', target: '심혈관질환', value: 445 },
    // 주요 CVD 기여 인자

    { source: '이상지질혈증 1,780만', target: 'MASLD 768만', value: 62 },
    // 768만 × 8.1%(고지혈증동반) = 62만 [KASL FS 2023]

    // 고혈압 → 2차
    { source: '고혈압 1,300만', target: '심혈관질환', value: 390 },
    // 고혈압 미조절 ~30% → 390만 고위험

    { source: '고혈압 1,300만', target: 'CKD 357만', value: 89 },
    // 357만 × ~25%(고혈압기인) = 89만

    // MASLD → MASH → 간경변
    { source: 'MASLD 768만', target: 'MASH ~153만', value: 153 },
    // 768만 × 20%(MASH진행) = 153만 [KASL FS 2023]

    { source: 'MASH ~153만', target: '간경변·HCC', value: 15 },
    // 153만 × ~10%(간경변진행) = 15만 [KASL FS 2023]

    // 심혈관 → 종말점
    { source: '심혈관질환', target: 'MI·뇌졸중 14.5만/년', value: 145 },
    // MI 3.5만 + 뇌졸중 11만 = 14.5만/년 [KDCA FS 2022]

    { source: 'CKD 357만', target: '투석 13만', value: 13 },
    // ESKD 투석 13만 [NHIS]

    // 심부전 flows
    { source: '고혈압 1,300만', target: '심부전 132만', value: 100 },
    // 심부전 132만 × HTN동반 78.7% = ~104만 → 역산 약 100만 [KSHF 2024]

    { source: '당뇨 530만', target: '심부전 132만', value: 78 },
    // 심부전 132만 × DM동반 58.8% = ~78만 [KSHF 2024]

    { source: '심혈관질환', target: '심부전 132만', value: 67 },
    // 심부전 132만 × IHD동반 50.6% = ~67만 [KSHF 2024]
  ],
};

// ── Evidence text for each link ──────────────────────────────
const LINK_EVIDENCE = {
  '유전·노화·환경→당뇨 530만': '당뇨 환자의 46.2%가 비만 없이 발생. 가족력, 노화, 유전적 소인(MODY 등). 530만 - 285만 = 245만. [KDA Fact Sheet 2024]',
  '유전·노화·환경→이상지질혈증 1,780만': '이상지질혈증의 44.8%가 비비만. 가족성 고콜레스테롤혈증, 노화 등. 1,780만 - 982만 = 798만. [KSoLA Fact Sheet 2024]',
  '유전·노화·환경→고혈압 1,300만': '고혈압의 60%가 비만 비동반. 본태성 고혈압(유전 30-50%), 노화, 고나트륨. 1,300만 - 520만 = 780만. [KSH Fact Sheet 2024]',
  '비만 1,670만→당뇨 530만': '당뇨 환자의 53.8%가 비만 (BMI≥25) 동반. 530만 × 53.8% = 285만. 19-39세 젊은 당뇨 환자 87.1% 비만 동반. [KDA Fact Sheet 2024]',
  '비만 1,670만→이상지질혈증 1,780만': '이상지질혈증 환자의 55.2%가 비만 동반. 1,780만 × 55.2% = 982만. 복부비만 시 59% 동반. [KSoLA Fact Sheet 2024]',
  '비만 1,670만→고혈압 1,300만': '비만은 고혈압 위험 1.9배 증가. 1,300만 × ~40% = 520만. 복부비만 시 더 높은 상관관계. [KOSSO Fact Sheet 2024]',
  '비만 1,670만→MASLD 768만': '비만 환자의 60-70%에서 MASLD 동반. 전체 MASLD의 70%가 비만 동반. 768만 × 70% = 538만. [KASL Fact Sheet 2023]',
  '대사이상 (Lean)→MASLD 768만': 'Lean MASLD: 전체 MASLD의 약 20-30%. BMI <25이나 인슐린저항성/유전적 소인으로 발생. 768만 × 30% = 230만. [KASL Fact Sheet 2023]',
  '당뇨 530만→대사이상 (Lean)': '비비만 당뇨 환자의 인슐린저항성이 Lean MASLD 발생에 기여. 당뇨는 비만과 무관하게 간 지방 축적을 촉진. [KDA 2024]',
  '이상지질혈증 1,780만→대사이상 (Lean)': '비비만 이상지질혈증(특히 고중성지방혈증)이 Lean MASLD의 주요 대사 기여 인자. [KSoLA 2024]',
  '당뇨 530만→MASLD 768만': 'MASLD 환자의 14.6%가 당뇨 동반. 768만 × 14.6% = 112만. 인슐린 저항성이 간 지방 축적 촉진. [KASL Fact Sheet 2023]',
  '당뇨 530만→심혈관질환': '당뇨 환자의 59.6%가 고혈압 동반(CVD 고위험). 530만 × 59.6% = 316만. 심혈관질환 위험 2-4배 증가. [KDA Fact Sheet 2024]',
  '당뇨 530만→CKD 357만': '당뇨 환자의 ~20%에서 당뇨성 신증(DKD) 발생. 530만 × 20% = 106만. 당뇨성 신증은 투석의 1위 원인. [KDA Fact Sheet 2024]',
  '이상지질혈증 1,780만→심혈관질환': '이상지질혈증은 죽상동맥경화의 핵심 위험인자. LDL 10% 감소 시 CVD 위험 약 10% 감소. 주요 CVD 기여 인자 445만. [KSoLA 2024]',
  '이상지질혈증 1,780만→MASLD 768만': 'MASLD 환자의 8.1%가 고지혈증 동반. 768만 × 8.1% = 62만. 고중성지방이 간 지방 축적에 직접 기여. [KASL Fact Sheet 2023]',
  '고혈압 1,300만→심혈관질환': '고혈압은 뇌졸중 위험 4배, 심근경색 위험 2배 증가. 미조절 ~30% → 390만 고위험군. [KSH 2024]',
  '고혈압 1,300만→CKD 357만': '고혈압은 CKD의 주요 원인 (당뇨 다음 2위). 357만 × ~25%(고혈압기인) = 89만. 고혈압성 신경화 → ESKD 진행. [KSH 2024]',
  'MASLD 768만→MASH ~153만': 'MASLD → MASH 진행률 약 20%. 768만 × 20% = 153만. MASH(대사이상관련 지방간염)는 간섬유화의 주요 원인. [KASL Fact Sheet 2023]',
  'MASH ~153만→간경변·HCC': 'MASH → 간경변 진행률 약 10%. 153만 × 10% = 15만. MASH 기인 HCC 비율 증가 추세. [KASL Fact Sheet 2023]',
  '심혈관질환→MI·뇌졸중 14.5만/년': '심혈관질환의 주요 종말점. 급성 심근경색 발생 연 3.5만건, 뇌졸중 연 11만건 = 14.5만/년. [KDCA Fact Sheet 2022]',
  'CKD 357만→투석 13만': 'CKD → ESKD 진행. 투석환자 약 13만명. 연간 1인당 의료비 약 3,000만원. [NHIS]',
  '고혈압 1,300만→심부전 132만': '심부전 환자의 78.7%가 고혈압 동반. 132만 × 78.7% 역산 → 약 100만. 고혈압은 심부전의 1위 동반질환. [KSHF Heart Failure Statistics 2024]',
  '당뇨 530만→심부전 132만': '심부전 환자의 58.8%가 당뇨 동반. 132만 × 58.8% = 약 78만. 당뇨는 심근 에너지 대사 장애 통해 심부전 촉진. [KSHF 2024]',
  '심혈관질환→심부전 132만': '심부전 환자의 50.6%가 허혈성심질환 동반. 132만 × 50.6% = 약 67만. 심근경색 후 심부전 전이가 주요 경로. [KSHF 2024]',
};

// ── Node detail info ─────────────────────────────────────────
const NODE_DETAIL = {
  '비만 1,670만': { population: '약 1,670만명 (20세+)', desc: 'BMI ≥25 기준. 38.4% × 4,350만(20세+). 대사질환의 핵심 시발점이나, 모든 대사질환의 유일한 원인은 아님.', ref: 'KOSSO Obesity Fact Sheet 2024' },
  '유전·노화·환경': { population: '비만 비동반 대사질환자', desc: '가족력, 노화, 유전적 소인, 고나트륨 식이, 환경적 요인 등으로 비만 없이도 당뇨·이상지질혈증·고혈압 발생. 당뇨 46.2%, 고혈압 60%, 이상지질혈증 44.8%가 비만 비동반.', ref: '각 학회 팩트시트 동반이환률 역산' },
  '대사이상 (Lean)': { population: 'Lean MASLD 약 230만명', desc: 'BMI <25이나 인슐린저항성, PNPLA3 유전변이, 내장지방 축적으로 MASLD 발생. 전체 MASLD의 20-30%.', ref: 'KASL Fact Sheet 2023' },
  '당뇨 530만': { population: '약 530만명 (30세+)', desc: '공복혈당 ≥126 또는 HbA1c ≥6.5%. 15.5% × 3,600만(30세+). 전당뇨 포함 시 약 1,500만명.', ref: 'KDA Diabetes Fact Sheet 2024' },
  '이상지질혈증 1,780만': { population: '약 1,780만명 (20세+)', desc: 'LDL ≥160, TG ≥200 등. 40.9% × 4,350만(20세+). 죽상동맥경화의 핵심 위험인자.', ref: 'KSoLA Fact Sheet 2024' },
  '고혈압 1,300만': { population: '약 1,300만명 (20세+)', desc: 'SBP ≥140 또는 DBP ≥90mmHg. ~30% × 4,350만(20세+). 침묵의 살인자.', ref: 'KSH Fact Sheet 2024' },
  'MASLD 768만': { population: '약 768만명 (성인)', desc: '대사이상관련 지방간질환 (MASLD). NHIS 진단 기준. MASH 진행 시 간섬유화 → 간경변 위험.', ref: 'KASL MASLD Fact Sheet 2023' },
  'MASH ~153만': { population: '약 153만명 (추정)', desc: '대사이상관련 지방간염 (MASH). MASLD 768만 × 진행률 20%. 간섬유화·간경변의 주요 원인.', ref: 'KASL 2023' },
  '심혈관질환': { population: '사망원인 2위', desc: '허혈성 심질환 + 뇌혈관질환. 사망률 59.7/10만명.', ref: 'KDCA CVD Fact Sheet 2022' },
  'CKD 357만': { population: '약 357만명 (20세+)', desc: '8.2% × 4,350만(20세+). GFR <60 또는 단백뇨 3개월 이상. 투석환자 약 13만명.', ref: 'NHIS cohort' },
  '간경변·HCC': { population: '간암 사망률 14.1/10만명', desc: 'MASLD → MASH → 간섬유화 → 간경변 → HCC. MASH 기인 HCC 증가 추세.', ref: 'KASL 2023' },
  'MI·뇌졸중 14.5만/년': { population: 'MI 3.5만건/년, 뇌졸중 11만건/년', desc: '골든타임 내 치료가 예후 결정. 뇌졸중 후 장애 발생률 약 50%.', ref: 'KDCA 2022' },
  '투석 13만': { population: '투석 13만명, 이식대기 3만명', desc: 'ESKD. 투석환자 5년 생존율 약 60%. 연간 의료비 약 3,000만원/인.', ref: 'NHIS' },
  '심부전 132만': { population: '약 132만명 (2020)', desc: '심장 펌프 기능 부전. 2002-2020년 유병률 3.6배 증가 (0.77%→2.58%). 입원 사망률 16%, 연간 의료비 3.2조원. 고혈압 78.7%, 당뇨 58.8% 동반.', ref: 'KSHF Heart Failure Statistics 2024 Update' },
};

export default function DiseaseSankey() {
  const [tooltip, setTooltip] = useState(null);

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: '#0a0a0f',
      position: 'relative',
    }}>
      {/* Header */}
      <div style={{ padding: '16px 24px 8px', flexShrink: 0 }}>
        <h2 style={{ color: '#fff', fontSize: 18, margin: 0, fontWeight: 600 }}>
          질환 진행 흐름도 (Sankey)
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, margin: '4px 0 0' }}>
          비만 및 대사이상에서 시작하는 대사질환 진행 경로 | 환자 수 기반 (만 명) | 노드·링크 클릭 시 상세 정보
        </p>
      </div>

      {/* Sankey Chart */}
      <div style={{ flex: 1, minHeight: 0, padding: '0 16px 16px' }}>
        <ResponsiveSankey
          data={sankeyData}
          margin={{ top: 20, right: 180, bottom: 40, left: 20 }}
          align="justify"
          colors={node => node.nodeColor || '#bbbbdd'}
          nodeOpacity={0.9}
          nodeHoverOpacity={1}
          nodeThickness={20}
          nodeSpacing={28}
          nodeBorderWidth={1}
          nodeBorderColor={{ from: 'color', modifiers: [['brighter', 0.4]] }}
          nodeBorderRadius={3}
          linkOpacity={0.35}
          linkHoverOpacity={0.7}
          linkContract={2}
          linkBlendMode="screen"
          enableLinkGradient={true}
          labelPosition="outside"
          labelOrientation="horizontal"
          labelPadding={12}
          labelTextColor={{ from: 'color', modifiers: [['brighter', 0.8]] }}
          label={node => node.id}
          nodeTooltip={({ node }) => {
            const detail = NODE_DETAIL[node.id];
            return (
              <div style={{
                background: 'rgba(20,20,30,0.95)',
                border: `1px solid ${node.color}`,
                borderRadius: 8,
                padding: '12px 16px',
                maxWidth: 320,
                color: '#fff',
                fontSize: 13,
              }}>
                <div style={{ fontWeight: 700, color: node.color, marginBottom: 6, fontSize: 14 }}>
                  {node.id}
                </div>
                {detail && (
                  <>
                    <div style={{ marginBottom: 4 }}>환자 수: {detail.population}</div>
                    <div style={{ marginBottom: 4, color: 'rgba(255,255,255,0.7)' }}>{detail.desc}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>출처: {detail.ref}</div>
                  </>
                )}
              </div>
            );
          }}
          linkTooltip={({ link }) => {
            const key = `${link.source.id}→${link.target.id}`;
            const evidence = LINK_EVIDENCE[key];
            return (
              <div style={{
                background: 'rgba(20,20,30,0.95)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 8,
                padding: '12px 16px',
                maxWidth: 380,
                color: '#fff',
                fontSize: 13,
              }}>
                <div style={{ fontWeight: 700, marginBottom: 6, fontSize: 14 }}>
                  <span style={{ color: link.source.color }}>{link.source.id}</span>
                  <span style={{ color: 'rgba(255,255,255,0.4)' }}> → </span>
                  <span style={{ color: link.target.color }}>{link.target.id}</span>
                </div>
                {evidence && (
                  <div style={{ color: 'rgba(255,255,255,0.8)', lineHeight: 1.5 }}>{evidence}</div>
                )}
              </div>
            );
          }}
          onClick={(data) => {
            // Node click
            if (data.id && NODE_DETAIL[data.id]) {
              const d = NODE_DETAIL[data.id];
              setTooltip({
                type: 'node',
                title: data.id,
                color: data.nodeColor || data.color,
                population: d.population,
                desc: d.desc,
                ref: d.ref,
              });
            }
            // Link click
            if (data.source && data.target) {
              const key = `${data.source.id}→${data.target.id}`;
              setTooltip({
                type: 'link',
                title: `${data.source.id} → ${data.target.id}`,
                color: data.source.color,
                evidence: LINK_EVIDENCE[key] || '상세 데이터 준비 중',
              });
            }
          }}
          theme={{
            tooltip: { container: { background: 'transparent', padding: 0, boxShadow: 'none' } },
            labels: { text: { fontSize: 12, fontWeight: 600 } },
          }}
        />
      </div>

      {/* Click detail panel */}
      {tooltip && (
        <div
          style={{
            position: 'absolute',
            bottom: 40,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(15,15,25,0.95)',
            border: `1px solid ${tooltip.color || 'rgba(255,255,255,0.15)'}`,
            borderRadius: 12,
            padding: '16px 24px',
            maxWidth: 500,
            color: '#fff',
            fontSize: 13,
            backdropFilter: 'blur(12px)',
            zIndex: 10,
            boxShadow: `0 4px 24px rgba(0,0,0,0.5)`,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontWeight: 700, fontSize: 15, color: tooltip.color }}>{tooltip.title}</span>
            <button
              onClick={() => setTooltip(null)}
              style={{
                background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)',
                cursor: 'pointer', fontSize: 18, padding: '0 0 0 16px',
              }}
            >
              ×
            </button>
          </div>
          {tooltip.type === 'node' && (
            <>
              <div style={{ marginBottom: 4 }}>환자 수: {tooltip.population}</div>
              <div style={{ color: 'rgba(255,255,255,0.7)', marginBottom: 4 }}>{tooltip.desc}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>출처: {tooltip.ref}</div>
            </>
          )}
          {tooltip.type === 'link' && (
            <div style={{ color: 'rgba(255,255,255,0.8)', lineHeight: 1.5 }}>{tooltip.evidence}</div>
          )}
        </div>
      )}

      {/* Disclaimer */}
      <div style={{
        padding: '4px 24px 8px',
        color: 'rgba(255,255,255,0.3)',
        fontSize: 10,
        lineHeight: 1.4,
        flexShrink: 0,
      }}>
        ※ 성인(20세+/30세+) 기준. 단면 동반이환률 기반 환자 수 추정치이며, 질환 간 중복을 포함합니다. 실측 코호트 데이터가 아닌 통계적 근사값으로 해석에 주의가 필요합니다.
      </div>
    </div>
  );
}
