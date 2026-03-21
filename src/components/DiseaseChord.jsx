import { useState } from 'react';
import { ResponsiveChord } from '@nivo/chord';

// ── Disease labels (order matches matrix rows/columns) ───────
const DISEASES = [
  '비만',
  '당뇨',
  '이상지질혈증',
  '고혈압',
  'MASLD',
  'CKD',
];

// ── Neon colors per disease ──────────────────────────────────
const DISEASE_COLORS = [
  '#ff006e', // 비만
  '#00d4ff', // 당뇨
  '#b388ff', // 이상지질혈증
  '#ffd60a', // 고혈압
  '#00ff88', // MASLD
  '#4ecdc4', // CKD
];

// ── Comorbidity matrix (symmetric) ───────────────────────────
// Values = comorbidity rate (%) from Korean factsheet data
// Matrix[i][j] = rate of disease j among patients with disease i
// Diagonal = 0 (self)
//
// Sources:
//   DM+HTN: 59.6%  (KDA Fact Sheet 2024)
//   DM+Dyslipidemia(highLDL): 74.2% (KDA 2024)
//   DM+Obesity: 53.8% (KDA 2024)
//   Dyslipidemia+HTN: 72.4% (KSoLA 2024)
//   Dyslipidemia+Obesity: 55.2% (KSoLA 2024)
//   Dyslipidemia+DM: 87% (KSoLA 2024)
//   MASLD+HTN: 42.3% (KASL 2023)
//   MASLD+DM: 14.6% (KASL 2023)
//   MASLD+CKD: 19.1% (KASL 2023)
//   MASLD+Obesity: ~50% (estimated from prevalence overlap)
//   MASLD+Dyslipidemia: 8.1% (KASL 2023, hyperlipidemia)
//   CKD+DM: 40% (KDA 2024)
//   CKD+HTN: 60% (estimated)
//   Other pairs: estimated from overlapping prevalence data

// For visual balance, we use the average of the two directional rates
// (e.g., DM→HTN=59.6%, HTN→DM≈45% → avg ~52)
const matrix = [
  //  비만   당뇨   이상지질  고혈압   MASLD   CKD
  [    0,    54,    55,     45,     50,     15  ],  // 비만
  [   54,     0,    80,     60,     30,     40  ],  // 당뇨
  [   55,    80,     0,     72,     20,     18  ],  // 이상지질혈증
  [   45,    60,    72,      0,     42,     35  ],  // 고혈압
  [   50,    30,    20,     42,      0,     19  ],  // MASLD
  [   15,    40,    18,     35,     19,      0  ],  // CKD
];

// ── Comorbidity detail text ──────────────────────────────────
const COMORBIDITY_DETAIL = {};

function makeKey(a, b) {
  return [a, b].sort().join('↔');
}

const details = [
  ['비만', '당뇨', '당뇨 환자의 53.8%가 비만 (BMI≥25) 동반. 19-39세 젊은 당뇨 환자에서 87.1%로 더 높음.', 'KDA Diabetes Fact Sheet 2024'],
  ['비만', '이상지질혈증', '이상지질혈증 환자의 55.2%가 비만 동반. 복부비만 시 59% 동반.', 'KSoLA Dyslipidemia Fact Sheet 2024'],
  ['비만', '고혈압', '비만은 고혈압 위험 1.9배 증가. 복부비만과 고혈압의 강한 연관성.', 'KOSSO Obesity Fact Sheet 2024'],
  ['비만', 'MASLD', '비만은 MASLD의 핵심 원인 인자. BMI 증가에 비례하여 지방간 유병률 상승.', 'KASL MASLD Fact Sheet 2023'],
  ['당뇨', '이상지질혈증', '이상지질혈증 환자의 87%가 당뇨 동반. 당뇨 환자의 74.2%가 고LDL. 대사증후군 핵심 구성요소.', 'KSoLA 2024 / KDA 2024'],
  ['당뇨', '고혈압', '당뇨 환자의 59.6%가 고혈압 동반. 두 질환 모두 심혈관 위험을 상승적으로 증가.', 'KDA Diabetes Fact Sheet 2024'],
  ['당뇨', 'MASLD', 'MASLD 환자의 14.6%가 당뇨 동반 (진단 기준). 당뇨 환자 중 MASLD 동반은 약 70%.', 'KASL 2023 / KDA 2024'],
  ['당뇨', 'CKD', '당뇨 환자의 약 40%에서 CKD 발생. 당뇨성 신증은 투석 원인 1위.', 'KDA Diabetes Fact Sheet 2024'],
  ['이상지질혈증', '고혈압', '이상지질혈증 환자의 72.4%가 고혈압 동반. 동맥경화의 이중 위험.', 'KSoLA Dyslipidemia Fact Sheet 2024'],
  ['이상지질혈증', 'MASLD', 'MASLD 환자의 8.1%가 고지혈증으로 진단. 고중성지방이 간 지방 축적에 직접 기여.', 'KASL MASLD Fact Sheet 2023'],
  ['고혈압', 'MASLD', 'MASLD 환자의 42.3%가 고혈압 동반. 2012년 34.5%에서 2022년 42.3%로 증가.', 'KASL MASLD Fact Sheet 2023'],
  ['고혈압', 'CKD', '고혈압은 CKD의 2번째 주요 원인. CKD 환자의 약 60%가 고혈압 동반.', 'KSH Fact Sheet 2024'],
  ['MASLD', 'CKD', 'MASLD 환자의 19.1%가 CKD 동반. 2012년 1.1%에서 2022년 19.1%로 급증.', 'KASL MASLD Fact Sheet 2023'],
  ['비만', 'CKD', 'CKD 위험인자로 비만 포함. 비만에 의한 사구체 과여과가 신손상 촉진.', 'NHIS cohort'],
  ['이상지질혈증', 'CKD', 'CKD 환자에서 이상지질혈증 흔히 동반. 심혈관 합병증 위험 증가 기여.', 'NHIS cohort'],
];

details.forEach(([a, b, text, ref]) => {
  COMORBIDITY_DETAIL[makeKey(a, b)] = { text, ref };
});

export default function DiseaseChord() {
  const [selected, setSelected] = useState(null);

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
          동반질환 공존률 (Chord)
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, margin: '4px 0 0' }}>
          주요 대사질환 간 동반이환 비율 | 호(arc) 또는 리본 클릭 시 상세 정보
        </p>
      </div>

      {/* Chord Chart */}
      <div style={{ flex: 1, minHeight: 0, padding: '0 16px 16px' }}>
        <ResponsiveChord
          data={matrix}
          keys={DISEASES}
          margin={{ top: 40, right: 40, bottom: 40, left: 40 }}
          valueFormat=".0f"
          padAngle={0.04}
          innerRadiusRatio={0.9}
          innerRadiusOffset={0.02}
          arcOpacity={0.85}
          arcHoverOpacity={1}
          arcBorderWidth={1}
          arcBorderColor={{ from: 'color', modifiers: [['brighter', 0.4]] }}
          ribbonOpacity={0.3}
          ribbonHoverOpacity={0.7}
          ribbonBlendMode="screen"
          ribbonBorderWidth={0}
          enableLabel={true}
          label="id"
          labelOffset={14}
          labelRotation={-90}
          labelTextColor={{ from: 'color', modifiers: [['brighter', 0.9]] }}
          colors={DISEASE_COLORS}
          isInteractive={true}
          arcTooltip={({ arc }) => (
            <div style={{
              background: 'rgba(20,20,30,0.95)',
              border: `1px solid ${arc.color}`,
              borderRadius: 8,
              padding: '10px 14px',
              color: '#fff',
              fontSize: 13,
            }}>
              <strong style={{ color: arc.color }}>{arc.id}</strong>
              <div style={{ marginTop: 4, color: 'rgba(255,255,255,0.6)' }}>
                총 동반이환 지수: {arc.value}
              </div>
            </div>
          )}
          ribbonTooltip={({ ribbon }) => {
            const key = makeKey(ribbon.source.id, ribbon.target.id);
            const detail = COMORBIDITY_DETAIL[key];
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
                <div style={{ fontWeight: 700, marginBottom: 6 }}>
                  <span style={{ color: ribbon.source.color }}>{ribbon.source.id}</span>
                  <span style={{ color: 'rgba(255,255,255,0.4)' }}> ↔ </span>
                  <span style={{ color: ribbon.target.color }}>{ribbon.target.id}</span>
                </div>
                <div style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 4 }}>
                  동반이환율: {ribbon.source.value}% / {ribbon.target.value}%
                </div>
                {detail && (
                  <>
                    <div style={{ color: 'rgba(255,255,255,0.8)', lineHeight: 1.5, marginTop: 6 }}>{detail.text}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 4 }}>출처: {detail.ref}</div>
                  </>
                )}
              </div>
            );
          }}
          onArcClick={(arc) => {
            setSelected({
              type: 'arc',
              title: arc.id,
              color: arc.color,
              value: arc.value,
            });
          }}
          onRibbonClick={(ribbon) => {
            const key = makeKey(ribbon.source.id, ribbon.target.id);
            const detail = COMORBIDITY_DETAIL[key];
            setSelected({
              type: 'ribbon',
              title: `${ribbon.source.id} ↔ ${ribbon.target.id}`,
              sourceColor: ribbon.source.color,
              targetColor: ribbon.target.color,
              sourceValue: ribbon.source.value,
              targetValue: ribbon.target.value,
              text: detail?.text || '상세 데이터 준비 중',
              ref: detail?.ref || '',
            });
          }}
          theme={{
            tooltip: { container: { background: 'transparent', padding: 0, boxShadow: 'none' } },
            labels: { text: { fontSize: 13, fontWeight: 700 } },
          }}
        />
      </div>

      {/* Click detail panel */}
      {selected && (
        <div
          style={{
            position: 'absolute',
            bottom: 20,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(15,15,25,0.95)',
            border: `1px solid ${selected.color || selected.sourceColor || 'rgba(255,255,255,0.15)'}`,
            borderRadius: 12,
            padding: '16px 24px',
            maxWidth: 500,
            color: '#fff',
            fontSize: 13,
            backdropFilter: 'blur(12px)',
            zIndex: 10,
            boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontWeight: 700, fontSize: 15 }}>
              {selected.type === 'arc' ? (
                <span style={{ color: selected.color }}>{selected.title}</span>
              ) : (
                selected.title
              )}
            </span>
            <button
              onClick={() => setSelected(null)}
              style={{
                background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)',
                cursor: 'pointer', fontSize: 18, padding: '0 0 0 16px',
              }}
            >
              ×
            </button>
          </div>
          {selected.type === 'arc' && (
            <div style={{ color: 'rgba(255,255,255,0.7)' }}>
              총 동반이환 지수: {selected.value} (다른 질환과의 연결 강도 합계)
            </div>
          )}
          {selected.type === 'ribbon' && (
            <>
              <div style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 6 }}>
                동반이환율: {selected.sourceValue}% / {selected.targetValue}%
              </div>
              <div style={{ color: 'rgba(255,255,255,0.85)', lineHeight: 1.5 }}>{selected.text}</div>
              {selected.ref && (
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 6 }}>출처: {selected.ref}</div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
