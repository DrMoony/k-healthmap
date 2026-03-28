import { useState, useEffect, useRef, useCallback } from 'react';
import { DISEASE_EPI } from '../data/disease_epi';
import nafldData from '../data/nafld_2023.json';
import diabetesData from '../data/diabetes_2024.json';
import trendsData from '../data/historical_trends.json';
import cvData from '../data/cardiovascular_2022.json';
import { DISEASE_TIMESERIES } from '../data/disease_epi';
import DiseaseOrbital from '../components/DiseaseOrbital';
import DiseaseSankey from '../components/DiseaseSankey';
import UpSetPlot from '../components/UpSetPlot';
import { useLang } from '../i18n';
import { T } from '../translations';

// ── Disease Data ──────────────────────────────────────────────
const DISEASES = {
  obesity: {
    id: 'obesity', name: '비만', nameEn: 'Obesity',
    level: 0, prevalence: '38.4%', population: '약 1,580만명',
    trend: '2012년 32.4% → 2024년 38.4% (지속 증가)',
    riskFactors: ['고열량 식이', '신체활동 부족', '유전적 소인', '스트레스/수면부족'],
    description: 'BMI 25 이상 기준. 대사질환의 핵심 시발점으로, 인슐린 저항성과 만성 염증을 유발하여 다계통 합병증의 근원이 됨.',
    comorbidity: '당뇨 2.5배, 고혈압 1.9배, 이상지질혈증 1.7배 위험 증가',
    color: '#ff006e',
    pathway: 'root',
  },
  diabetes: {
    id: 'diabetes', name: '당뇨', nameEn: 'Diabetes',
    level: 1, prevalence: '16.7%', population: '약 600만명 (30세 이상)',
    trend: '2012년 11.8% → 2024년 16.7% (꾸준히 증가)',
    riskFactors: ['비만/복부비만', '가족력', '운동부족', '고탄수화물 식이'],
    description: '공복혈당 126mg/dL 이상 또는 HbA1c 6.5% 이상. 전당뇨 포함 시 약 1,500만명 이상 추정.',
    comorbidity: '심혈관질환 2-4배, MASLD 70% 동반, CKD 40% 동반',
    color: '#00d4ff',
    pathway: 'all',
  },
  dyslipidemia: {
    id: 'dyslipidemia', name: '이상지질혈증', nameEn: 'Dyslipidemia',
    level: 1, prevalence: '40.4%', population: '약 1,660만명',
    trend: '2012년 32.8% → 2024년 40.4% (급격한 증가)',
    riskFactors: ['비만', '고지방 식이', '운동부족', '유전적 소인', '음주'],
    description: 'LDL ≥160, TG ≥200, HDL <40(남)/<50(여). 죽상동맥경화의 핵심 위험인자.',
    comorbidity: '심혈관질환 직접 기여, MASLD 65% 동반',
    color: '#b388ff',
    pathway: 'cardiac',
  },
  hypertension: {
    id: 'hypertension', name: '고혈압', nameEn: 'Hypertension',
    level: 1, prevalence: '29.3%', population: '약 1,200만명 (30세 이상)',
    trend: '2012년 29.0% → 2024년 29.3% (유지/미세 증가)',
    riskFactors: ['비만', '고나트륨 식이', '음주', '스트레스', '가족력'],
    description: '수축기 ≥140 또는 이완기 ≥90mmHg. 침묵의 살인자로 불리며, 심뇌혈관 합병증의 주요 원인.',
    comorbidity: '뇌졸중 4배, 심근경색 2배, CKD 주요 원인',
    color: '#ffd60a',
    pathway: 'cardiac',
  },
  masld: {
    id: 'masld', name: 'MASLD', nameEn: 'Metabolic Steatotic Liver Disease',
    level: 2, prevalence: '768만', population: 'NHIS 진단 기준 768만명 (성인)',
    trend: '비만/당뇨 증가와 평행하여 급증 추세',
    riskFactors: ['비만', '당뇨', '이상지질혈증', '인슐린 저항성'],
    description: '대사이상관련 지방간질환 (MASLD). MASH 진행 시 간섬유화 → 간경변 위험.',
    comorbidity: 'MASH 진행률 ~20%, 간경변 진행률 ~10%',
    color: '#00ff88',
    pathway: 'liver',
  },
  cvd: {
    id: 'cvd', name: '심혈관질환', nameEn: 'Cardiovascular Disease',
    level: 2, prevalence: '사망률 59.7/10만명', population: '사망원인 2위',
    trend: '사망률 감소 추세이나 유병률은 증가',
    riskFactors: ['고혈압', '당뇨', '이상지질혈증', '흡연', '비만'],
    description: '허혈성 심질환, 뇌혈관질환 포괄. 한국인 사망원인 2위(암 다음).',
    comorbidity: '급성 심근경색 원내사망률 약 8%',
    color: '#ff6b6b',
    pathway: 'cardiac',
  },
  ckd: {
    id: 'ckd', name: '만성신장질환', nameEn: 'Chronic Kidney Disease',
    level: 2, prevalence: '8.7%', population: '약 360만명',
    trend: '당뇨/고혈압 증가에 따라 지속 증가',
    riskFactors: ['당뇨', '고혈압', '사구체신염', '고령'],
    description: 'GFR <60 또는 단백뇨 3개월 이상. 투석환자 약 13만명, 이식대기 3만명.',
    comorbidity: '심혈관 사망률 일반인 대비 10-30배',
    color: '#4ecdc4',
    pathway: 'renal',
  },
  heart_failure: {
    id: 'heart_failure', name: '심부전', nameEn: 'Heart Failure',
    level: 2, prevalence: '2.58%', population: '약 132만명',
    trend: '2002년 0.77% → 2020년 2.58% (3.6배)',
    riskFactors: ['고혈압', '당뇨', '허혈성심질환', '심방세동', '비만'],
    description: '심장 펌프 기능 부전. 유병률 3.6배 증가, 의료비 3.2조원. 입원 사망률 16%.',
    comorbidity: '고혈압 78.7%, 당뇨 58.8%, 허혈성심질환 50.6%',
    color: '#e91e63', pathway: 'cardiac',
  },
  mash: {
    id: 'mash', name: 'MASH', nameEn: 'Metabolic Steatohepatitis',
    level: 2, prevalence: '~153만', population: 'MASLD의 ~20% 진행',
    trend: 'MASLD 증가에 비례하여 증가',
    riskFactors: ['MASLD', '비만', '당뇨', '인슐린 저항성'],
    description: '대사이상관련 지방간염. MASLD에서 간세포 손상 + 염증 동반 상태. 간섬유화의 핵심 단계.',
    comorbidity: '간경변 진행 10-20%, HCC 연간 발생률 1-2%',
    color: '#2ecc71',
    pathway: 'liver',
  },
  lc: {
    id: 'lc', name: '간경변', nameEn: 'Liver Cirrhosis',
    level: 3, prevalence: 'MASLD 10년 진행 ~3%', population: '-',
    trend: 'MASH 기인 간경변 증가',
    riskFactors: ['MASH', 'B형간염', 'C형간염', '알코올'],
    description: '간 섬유화 F4 단계. MASH에서 10-20% 진행. 5년 생존율 ~50%.',
    comorbidity: 'HCC 연간 1-3% 발생, 간부전, 복수, 정맥류 출혈',
    color: '#e74c3c',
    pathway: 'liver',
  },
  hcc: {
    id: 'hcc', name: '간세포암', nameEn: 'Hepatocellular Carcinoma',
    level: 3, prevalence: '발생률 34.2/10만', population: '사망률 14.1/10만',
    trend: 'B형간염 감소하나 MASH 기인 HCC 증가',
    riskFactors: ['간경변', 'MASH', 'B형간염', 'C형간염'],
    description: '간세포암. 간경변에서 연간 1-3% 발생, 비간경변 MASH에서도 직접 발생 가능.',
    comorbidity: '5년 생존율 ~38%',
    color: '#c0392b',
    pathway: 'liver',
  },
  lt: {
    id: 'lt', name: '간이식', nameEn: 'Liver Transplant',
    level: 3, prevalence: '연간 ~1,500건', population: '대기자 ~5,000명',
    trend: 'MASH 기인 간이식 적응증 증가',
    riskFactors: ['간경변 말기', 'HCC'],
    description: '말기 간질환 또는 간암의 근치적 치료. 국내 뇌사 간이식 + 생체 간이식.',
    comorbidity: '5년 생존율 ~75%',
    color: '#e67e22',
    pathway: 'liver',
  },
  mi_stroke: {
    id: 'mi_stroke', name: '심근경색/뇌졸중', nameEn: 'MI / Stroke',
    level: 3, prevalence: '뇌졸중 발생률 217/10만명', population: '심근경색 발생률 65/10만명',
    trend: '급성기 사망률 감소하나 발생률은 유지/증가',
    riskFactors: ['고혈압', '당뇨', '이상지질혈증', '흡연', '심방세동'],
    description: '급성 심근경색 및 뇌졸중. 골든타임 내 치료가 예후를 결정하는 응급질환.',
    comorbidity: '뇌졸중 후 장애 발생률 약 50%',
    color: '#e67e22',
    pathway: 'cardiac',
  },
  dialysis: {
    id: 'dialysis', name: '투석', nameEn: 'Dialysis',
    level: 3, prevalence: '~13만명', population: '연간 의료비 ~3,000만원/인',
    trend: '투석환자 연 8% 증가',
    riskFactors: ['만성신장질환 진행', '당뇨성 신증', '고혈압성 신경화'],
    description: 'ESKD(말기신부전)로 투석 필요. 연간 의료비 환자당 약 3,000만원.',
    comorbidity: '투석환자 5년 생존율 약 60%',
    color: '#9b59b6',
    pathway: 'renal',
  },
  kt: {
    id: 'kt', name: '신장이식', nameEn: 'Kidney Transplant',
    level: 3, prevalence: '대기자 ~3만명', population: '연간 ~2,000건',
    trend: '대기 기간 증가 추세',
    riskFactors: ['ESKD', '당뇨병성 신증'],
    description: 'ESKD 환자의 근치적 치료. 생체이식 + 뇌사이식. 투석 대비 생존율 우수.',
    comorbidity: '5년 생존율 ~95%',
    color: '#8e44ad',
    pathway: 'renal',
  },
};

// ── Fixed positions (viewBox: 0 0 840 600) ───────────────────
const LEVEL_Y = [75, 210, 370, 520];

const NODE_POSITIONS = {
  obesity:       { x: 400, y: LEVEL_Y[0] },
  diabetes:      { x: 160, y: LEVEL_Y[1] },
  dyslipidemia:  { x: 400, y: LEVEL_Y[1] },
  hypertension:  { x: 640, y: LEVEL_Y[1] },
  masld:         { x: 120, y: LEVEL_Y[2] },
  mash:          { x: 280, y: LEVEL_Y[2] },
  cvd:           { x: 430, y: LEVEL_Y[2] },
  heart_failure: { x: 565, y: LEVEL_Y[2] },
  ckd:           { x: 700, y: LEVEL_Y[2] },
  lc:            { x: 100, y: LEVEL_Y[3] },
  hcc:           { x: 240, y: LEVEL_Y[3] },
  lt:            { x: 370, y: LEVEL_Y[3] },
  mi_stroke:     { x: 500, y: LEVEL_Y[3] },
  dialysis:      { x: 620, y: LEVEL_Y[3] },
  kt:            { x: 740, y: LEVEL_Y[3] },
};

const NODE_RADIUS = { 0: 40, 1: 32, 2: 28, 3: 22 };

const EDGES = [
  { from: 'obesity', to: 'diabetes', strength: 3, pathway: 'mixed' },
  { from: 'obesity', to: 'dyslipidemia', strength: 2.5, pathway: 'mixed' },
  { from: 'obesity', to: 'hypertension', strength: 2, pathway: 'mixed' },
  { from: 'diabetes', to: 'masld', strength: 3, pathway: 'liver' },
  { from: 'diabetes', to: 'cvd', strength: 2.5, pathway: 'cardiac' },
  { from: 'diabetes', to: 'ckd', strength: 2.5, pathway: 'renal' },
  { from: 'dyslipidemia', to: 'masld', strength: 2, pathway: 'liver' },
  { from: 'dyslipidemia', to: 'cvd', strength: 3, pathway: 'cardiac' },
  { from: 'hypertension', to: 'cvd', strength: 3, pathway: 'cardiac' },
  { from: 'hypertension', to: 'ckd', strength: 2.5, pathway: 'renal' },
  { from: 'masld', to: 'mash', strength: 2.5, pathway: 'liver' },
  { from: 'mash', to: 'lc', strength: 2, pathway: 'liver' },
  { from: 'mash', to: 'hcc', strength: 1.5, pathway: 'liver' },
  { from: 'lc', to: 'hcc', strength: 2, pathway: 'liver' },
  { from: 'lc', to: 'lt', strength: 1.5, pathway: 'liver' },
  { from: 'hcc', to: 'lt', strength: 1, pathway: 'liver' },
  { from: 'cvd', to: 'mi_stroke', strength: 3, pathway: 'cardiac' },
  { from: 'ckd', to: 'dialysis', strength: 3, pathway: 'renal' },
  { from: 'ckd', to: 'kt', strength: 1.5, pathway: 'renal' },
  { from: 'obesity', to: 'masld', strength: 1.5, pathway: 'liver' },
  { from: 'diabetes', to: 'mi_stroke', strength: 1.5, pathway: 'cardiac' },
  { from: 'hypertension', to: 'mi_stroke', strength: 2, pathway: 'cardiac' },
  { from: 'ckd', to: 'cvd', strength: 1.5, pathway: 'renal' },
  { from: 'diabetes', to: 'heart_failure', strength: 2.5, pathway: 'cardiac' },
  { from: 'hypertension', to: 'heart_failure', strength: 3, pathway: 'cardiac' },
  { from: 'cvd', to: 'heart_failure', strength: 2, pathway: 'cardiac' },
];

const PATHWAY_COLORS = {
  liver: '#00ff88',
  cardiac: '#ff6b6b',
  renal: '#4ecdc4',
  mixed: '#ccccee',
};

const LEVEL_LABELS_KO = ['위험인자', '1차 질환', '2차 합병증', '3차 결과'];
const LEVEL_LABELS_EN = ['Risk Factor', 'Primary Disease', 'Secondary Complication', 'Terminal Outcome'];
const LEVEL_LABELS = LEVEL_LABELS_KO;
const LEVEL_ZONE_COLORS = [
  'rgba(255, 0, 80, 0.04)',
  'rgba(255, 180, 0, 0.04)',
  'rgba(0, 120, 255, 0.04)',
  'rgba(120, 0, 255, 0.04)',
];
const LEVEL_ZONE_BORDERS = [
  'rgba(255, 0, 80, 0.12)',
  'rgba(255, 180, 0, 0.12)',
  'rgba(0, 120, 255, 0.12)',
  'rgba(120, 0, 255, 0.12)',
];

// ── View Modes ───────────────────────────────────────────────

// ── InfoTip (hover tooltip) ────────────────────────────────
function InfoTip({ text }) {
  const [show, setShow] = useState(false);
  return (
    <span style={{ position: 'relative', display: 'inline-flex', marginLeft: '4px', verticalAlign: 'middle' }}
      onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      <span style={{
        width: '14px', height: '14px', borderRadius: '50%', border: '1px solid #9999bb',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '9px', color: '#bbbbdd', cursor: 'help',
      }}>?</span>
      {show && (
        <div style={{
          position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)',
          marginBottom: '6px', background: 'rgba(10,10,20,0.97)', border: '1px solid rgba(0,212,255,0.3)',
          borderRadius: '8px', padding: '8px 14px', zIndex: 100,
          minWidth: '280px', maxWidth: '400px',
          fontSize: '11px', color: '#ccc', lineHeight: 1.6,
          backdropFilter: 'blur(8px)', boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
          pointerEvents: 'none', whiteSpace: 'normal',
        }}>
          {text}
        </div>
      )}
    </span>
  );
}

const VIEW_MODES = [
  { id: 'network', label_ko: '질환 네트워크', label_en: 'Disease Network' },
  { id: 'masld', label_ko: 'MASLD 진행', label_en: 'MASLD Progression' },
  { id: 'management', label_ko: '관리 현황', label_en: 'Management Status' },
  { id: 'trends', label_ko: '추이 비교', label_en: 'Trend Comparison' },
  { id: 'orbital', label_ko: '궤도 뷰', label_en: 'Orbital View' },
  { id: 'sankey', label_ko: '질환 흐름', label_en: 'Disease Flow' },
  { id: 'upset', label_ko: '동반질환', label_en: 'Comorbidity' },
  { id: 'cost', label_ko: '의료비', label_en: 'Healthcare Cost' },
  { id: 'survival', label_ko: '생존 곡선', label_en: 'Survival Curves' },
];

// ── CSS Animations ───────────────────────────────────────────
const STYLES = `
@keyframes pulseGlow {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.8; }
}
@keyframes flowDash {
  0% { stroke-dashoffset: 24; }
  100% { stroke-dashoffset: 0; }
}
@keyframes nodeHoverPulse {
  0%, 100% { filter: drop-shadow(0 0 6px var(--glow)); }
  50% { filter: drop-shadow(0 0 20px var(--glow)); }
}
@keyframes ringExpand {
  0% { r: var(--r-start); opacity: 0.6; }
  100% { r: var(--r-end); opacity: 0; }
}
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes gradientFlow {
  0% { stop-offset: 0%; }
  100% { stop-offset: 100%; }
}
.dn-node {
  cursor: pointer;
}
.detail-panel {
  animation: fadeInUp 0.3s ease-out;
}
.stat-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid rgba(255,255,255,0.06);
}
.stat-label {
  color: #bbbbdd;
  font-size: 12px;
  font-family: 'Noto Sans KR', sans-serif;
}
.stat-value {
  color: #e0e0ff;
  font-size: 13px;
  font-family: 'JetBrains Mono', monospace;
  font-weight: 600;
}
.risk-tag {
  display: inline-block;
  padding: 3px 10px;
  margin: 3px;
  border-radius: 12px;
  font-size: 11px;
  font-family: 'Noto Sans KR', sans-serif;
  background: rgba(255,255,255,0.06);
  color: #ccccee;
  border: 1px solid rgba(255,255,255,0.08);
}
.level-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 10px;
  font-family: 'JetBrains Mono', monospace;
  letter-spacing: 1px;
  text-transform: uppercase;
}
.strength-bar-bg {
  background: rgba(255,255,255,0.06);
  border-radius: 3px;
  height: 4px;
  width: 60px;
}
.strength-bar-fill {
  border-radius: 3px;
  height: 4px;
}
.view-tab {
  padding: 6px 16px;
  border-radius: 20px;
  border: 1px solid rgba(255,255,255,0.1);
  background: rgba(255,255,255,0.03);
  color: #6666aa;
  font-family: 'Noto Sans KR', sans-serif;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}
.view-tab:hover {
  background: rgba(255,255,255,0.08);
  color: #ccccee;
  border-color: rgba(255,255,255,0.2);
}
.view-tab.active {
  background: rgba(0,212,255,0.15);
  color: #00d4ff;
  border-color: rgba(0,212,255,0.4);
  box-shadow: 0 0 12px rgba(0,212,255,0.15);
}
`;

// ── Level zone band dimensions ───────────────────────────────
function getLevelBand(levelIdx) {
  const y = LEVEL_Y[levelIdx];
  const halfH = levelIdx === 0 ? 55 : 48;
  return { y: y - halfH, height: halfH * 2 };
}

// ── Parse prevalence string to number for gradient ──────────
function parsePrevalence(prev) {
  const m = String(prev).match(/([\d.]+)%/);
  return m ? parseFloat(m[1]) : 0;
}
const MAX_PREVALENCE = Math.max(...Object.values(DISEASES).map(d => parsePrevalence(d.prevalence)));

// ── Edge evidence data ──────────────────────────────────────
const EDGE_EVIDENCE = {};
EDGES.forEach(e => {
  const from = DISEASES[e.from], to = DISEASES[e.to];
  EDGE_EVIDENCE[`${e.from}-${e.to}`] = {
    from: from.name, to: to.name,
    strength: e.strength, pathway: e.pathway,
    evidence: `${from.name}은(는) ${to.name}의 주요 위험인자입니다. 연결 강도 ${e.strength}/3. 경로: ${e.pathway}.`,
  };
});

// ── Edge Component ───────────────────────────────────────────
function EdgeLine({ from, to, strength, pathway, selectedId, edgeIdx, onEdgeClick }) {
  const p1 = NODE_POSITIONS[from];
  const p2 = NODE_POSITIONS[to];
  const isHighlighted = selectedId === from || selectedId === to;
  const baseOpacity = isHighlighted ? 0.85 : 0.2;
  const pathwayColor = PATHWAY_COLORS[pathway] || '#ccccee';
  const color = isHighlighted ? pathwayColor : '#223344';

  const mx = (p1.x + p2.x) / 2;
  const dx = p2.x - p1.x;
  const offset = Math.min(Math.abs(dx), 40) * 0.25;
  const cx1 = mx + (dx > 0 ? -offset : offset);
  const cy1 = (p1.y + p2.y) / 2;
  const r1 = NODE_RADIUS[DISEASES[from].level];
  const r2 = NODE_RADIUS[DISEASES[to].level];

  const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
  const sx = p1.x + Math.cos(angle) * (r1 + 4);
  const sy = p1.y + Math.sin(angle) * (r1 + 4);
  const ex = p2.x - Math.cos(angle) * (r2 + 8);
  const ey = p2.y - Math.sin(angle) * (r2 + 8);

  const d = `M${sx},${sy} Q${cx1},${cy1} ${ex},${ey}`;
  const gradId = `edgeGrad-${edgeIdx}`;

  // Edge color opacity varies by strength (Rule 2)
  const strengthOpacity = 0.3 + (strength / 3) * 0.7;

  return (
    <g style={{ cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); onEdgeClick && onEdgeClick({ from, to, strength, pathway }); }}>
      {isHighlighted && (
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={color} stopOpacity="0.1" />
            <stop offset="50%" stopColor={color} stopOpacity="1" />
            <stop offset="100%" stopColor={color} stopOpacity="0.1" />
          </linearGradient>
        </defs>
      )}
      {/* Invisible wide hit area for easier clicking */}
      <path d={d} fill="none" stroke="transparent" strokeWidth="14" />
      <path
        d={d} fill="none" stroke={color}
        strokeWidth={strength * 2.5 + 2}
        opacity={baseOpacity * 0.2 * strengthOpacity}
        filter="url(#edgeGlow)"
      />
      <path
        d={d} fill="none"
        stroke={color}
        strokeWidth={strength * 0.9 + 0.5}
        opacity={baseOpacity * strengthOpacity}
        markerEnd="url(#arrowhead)"
        strokeDasharray={isHighlighted ? '8 4' : 'none'}
        style={isHighlighted ? { animation: 'flowDash 0.8s linear infinite' } : {}}
      />
      {isHighlighted && (
        <circle r="3" fill={color} opacity="0.9">
          <animateMotion dur="2s" repeatCount="indefinite" path={d} />
        </circle>
      )}
    </g>
  );
}

// ── Node Component ──────────────────────────────────────────
function DiseaseNode({ disease, pos, isSelected, onClick, dimmed }) {
  const r = NODE_RADIUS[disease.level];
  const glowColor = disease.color;
  // Rule 2: Fill opacity based on prevalence
  const prevVal = parsePrevalence(disease.prevalence);
  const fillOpacity = 0.08 + (prevVal / Math.max(MAX_PREVALENCE, 1)) * 0.35;
  const nodeOpacity = dimmed ? 0.2 : 1;

  return (
    <g
      className="dn-node"
      onClick={onClick}
      style={{ '--glow': glowColor, cursor: 'pointer', opacity: nodeOpacity }}
    >
      <circle cx={pos.x} cy={pos.y} r={r + 10} fill="transparent" />
      {isSelected && (
        <>
          <circle cx={pos.x} cy={pos.y} r={r + 8} fill="none"
            stroke={glowColor} strokeWidth="1.5" opacity="0.5"
            style={{ animation: 'pulseGlow 1.5s ease-in-out infinite' }}
          />
          <circle cx={pos.x} cy={pos.y} r={r + 16} fill="none"
            stroke={glowColor} strokeWidth="1" opacity="0.2"
            style={{ animation: 'pulseGlow 2s ease-in-out infinite' }}
          />
        </>
      )}
      <circle
        cx={pos.x} cy={pos.y} r={r + 3}
        fill="none" stroke={glowColor}
        strokeWidth={isSelected ? 2 : 1}
        opacity={isSelected ? 0.8 : 0.3}
        strokeDasharray={`${r * 2} ${r * 4.28}`}
        filter="url(#nodeGlow)"
      />
      <circle
        cx={pos.x} cy={pos.y} r={r}
        fill={glowColor}
        fillOpacity={isSelected ? fillOpacity + 0.15 : fillOpacity}
        stroke={glowColor}
        strokeWidth={isSelected ? 2.5 : 1.5}
        opacity={isSelected ? 1 : 0.9}
      />
      <circle
        cx={pos.x} cy={pos.y} r={r - 5}
        fill="none" stroke={glowColor}
        strokeWidth="0.4" opacity="0.2"
      />
      <text
        x={pos.x} y={pos.y - (disease.level === 0 ? 5 : 3)}
        textAnchor="middle" fill="#e0e0ff"
        fontSize={disease.level === 0 ? 14 : disease.level === 3 ? 10 : 12}
        fontFamily="'Noto Sans KR', sans-serif" fontWeight="700"
      >
        {disease.name}
      </text>
      <text
        x={pos.x} y={pos.y + (disease.level === 0 ? 13 : disease.level === 3 ? 9 : 11)}
        textAnchor="middle" fill={glowColor}
        fontSize={disease.level === 3 ? 9 : 10}
        fontFamily="'JetBrains Mono', monospace" fontWeight="600" opacity="0.8"
      >
        {disease.prevalence}
      </text>
    </g>
  );
}

// ── Detail Panel ─────────────────────────────────────────────
function DiseaseDetail({ disease, onClose }) {
  const { lang, t } = useLang();
  if (!disease) return null;

  const levelColors = ['#ff006e', '#ffb400', '#0078ff', '#7800ff'];
  const levelNames = ['ROOT', 'Lv.1', 'Lv.2', 'Lv.3'];
  const connectedEdges = EDGES.filter(e => e.from === disease.id || e.to === disease.id);

  return (
    <div className="detail-panel" style={{
      background: 'linear-gradient(135deg, #1a1a2e 0%, #12121f 100%)',
      borderRadius: '12px',
      border: `1px solid ${disease.color}33`,
      padding: '20px',
      height: '100%',
      overflowY: 'auto',
      position: 'relative',
    }}>
      <button onClick={onClose} style={{
        position: 'absolute', top: 12, right: 12,
        background: 'rgba(255,255,255,0.06)', border: 'none',
        color: '#bbbbdd', fontSize: 18, cursor: 'pointer',
        width: 28, height: 28, borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>x</button>

      <div style={{ marginBottom: 16 }}>
        <span className="level-badge" style={{
          background: `${levelColors[disease.level]}22`,
          color: levelColors[disease.level],
          border: `1px solid ${levelColors[disease.level]}44`,
        }}>
          {levelNames[disease.level]}
        </span>
        <h2 style={{
          color: disease.color, margin: '8px 0 2px',
          fontFamily: "'Noto Sans KR', sans-serif",
          fontSize: 22, fontWeight: 800,
          textShadow: `0 0 20px ${disease.color}44`,
        }}>
          {disease.name}
        </h2>
        <p style={{
          color: '#6666aa', margin: 0, fontSize: 12,
          fontFamily: "'JetBrains Mono', monospace",
        }}>
          {disease.nameEn}
        </p>
      </div>

      <div style={{
        background: 'rgba(0,0,0,0.3)', borderRadius: 8, padding: 14, marginBottom: 14,
        border: '1px solid rgba(255,255,255,0.04)',
      }}>
        <div className="stat-row">
          <span className="stat-label">{t('유병률','Prevalence')}</span>
          <span className="stat-value" style={{ color: disease.color }}>{disease.prevalence}</span>
        </div>
        <div className="stat-row">
          <span className="stat-label">{t('환자규모','Patients')}</span>
          <span className="stat-value">{disease.population}</span>
        </div>
        <div className="stat-row" style={{ borderBottom: 'none' }}>
          <span className="stat-label">{t('추이','Trend')}</span>
          <span className="stat-value" style={{ fontSize: 11, textAlign: 'right', maxWidth: '65%' }}>{disease.trend}</span>
        </div>
      </div>

      <div style={{ marginBottom: 14 }}>
        <p style={{
          color: '#ccccee', fontSize: 12.5, lineHeight: 1.7,
          fontFamily: "'Noto Sans KR', sans-serif", margin: 0,
        }}>
          {disease.description}
        </p>
      </div>

      <div style={{
        background: `${disease.color}0a`, borderRadius: 8, padding: 12, marginBottom: 14,
        border: `1px solid ${disease.color}22`,
      }}>
        <p style={{
          color: '#bbbbdd', fontSize: 11, margin: '0 0 4px',
          fontFamily: "'Noto Sans KR', sans-serif", fontWeight: 600,
        }}>
          {t('동반질환/합병증','Comorbidities/Complications')}
        </p>
        <p style={{
          color: '#ccccee', fontSize: 12, lineHeight: 1.6,
          fontFamily: "'Noto Sans KR', sans-serif", margin: 0,
        }}>
          {disease.comorbidity}
        </p>
      </div>

      <div>
        <p style={{
          color: '#bbbbdd', fontSize: 11, margin: '0 0 6px',
          fontFamily: "'Noto Sans KR', sans-serif", fontWeight: 600,
        }}>
          {t('위험인자','Risk Factors')}
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap' }}>
          {disease.riskFactors.map((rf, i) => (
            <span key={i} className="risk-tag">{rf}</span>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 14 }}>
        <p style={{
          color: '#bbbbdd', fontSize: 11, margin: '0 0 8px',
          fontFamily: "'Noto Sans KR', sans-serif", fontWeight: 600,
        }}>
          {t('연결된 질환','Connected Diseases')}
        </p>
        {connectedEdges.map((e, i) => {
          const otherId = e.from === disease.id ? e.to : e.from;
          const other = DISEASES[otherId];
          const direction = e.from === disease.id ? '\u2192' : '\u2190';
          const pColor = PATHWAY_COLORS[e.pathway] || '#ccccee';
          return (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '6px 0',
              borderBottom: '1px solid rgba(255,255,255,0.04)',
            }}>
              <span style={{
                width: 8, height: 8, borderRadius: '50%',
                background: other.color, flexShrink: 0,
              }} />
              <span style={{
                color: other.color, fontSize: 12,
                fontFamily: "'Noto Sans KR', sans-serif",
                minWidth: 80,
              }}>
                {direction} {other.name}
              </span>
              <div className="strength-bar-bg" style={{ flexShrink: 0 }}>
                <div className="strength-bar-fill" style={{
                  width: `${(e.strength / 3) * 100}%`,
                  background: pColor,
                }} />
              </div>
              <span style={{
                fontSize: 10, color: pColor, fontFamily: "'JetBrains Mono', monospace",
                textTransform: 'capitalize',
              }}>
                {e.pathway}
              </span>
            </div>
          );
        })}
      </div>

      {(() => {
        const epi = DISEASE_EPI.diseases[disease.id];
        if (!epi) return null;
        return (
          <div style={{ marginTop: 14 }}>
            {epi.genderGap && (
              <div style={{
                display: 'flex', gap: '8px', marginBottom: '10px',
                fontSize: 11, fontFamily: "'JetBrains Mono', monospace",
              }}>
                <span style={{ color: '#00d4ff' }}>{'\u2642'} {epi.genderGap.male}%</span>
                <span style={{ color: '#ff006e' }}>{'\u2640'} {epi.genderGap.female}%</span>
                <span style={{ color: '#aaaacc' }}>({epi.prevalence?.year})</span>
              </div>
            )}
            {epi.awareness && (
              <div style={{
                background: 'rgba(0,0,0,0.2)', borderRadius: 6, padding: '8px 10px',
                marginBottom: 10, fontSize: 10, lineHeight: 1.8, color: '#ccccee',
              }}>
                <div>{t('인지율','Awareness')} <span style={{ color: '#ffd60a', fontWeight: 700 }}>{epi.awareness}%</span></div>
                {epi.treatment && <div>{t('치료율','Treatment')} <span style={{ color: '#00ff88', fontWeight: 700 }}>{epi.treatment}%</span></div>}
                {epi.control && <div>{t('조절률','Control')} <span style={{ color: '#00d4ff', fontWeight: 700 }}>{epi.control.value}%</span> <span style={{ color: '#aaaacc' }}>({epi.control.criteria})</span></div>}
              </div>
            )}
            <div style={{
              paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.06)',
            }}>
              <p style={{
                color: '#6a6a8a', fontSize: 10, margin: 0, lineHeight: 1.6,
                fontFamily: "'Noto Sans KR', sans-serif",
              }}>
                {'\uD83D\uDCDA'} {epi.ref}
              </p>
              {epi.refUrl && (
                <a href={epi.refUrl} target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: 9, color: '#4a4aaa', textDecoration: 'underline', wordBreak: 'break-all' }}>
                  {epi.refUrl}
                </a>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// ── Edge Detail Popup ────────────────────────────────────────
function EdgeDetailPopup({ edge, onClose }) {
  const { lang, t } = useLang();
  if (!edge) return null;
  const evidence = EDGE_EVIDENCE[`${edge.from}-${edge.to}`];
  if (!evidence) return null;
  const pColor = PATHWAY_COLORS[edge.pathway] || '#ccccee';
  return (
    <div className="detail-panel" style={{
      position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #12121f 100%)',
      borderRadius: 12, border: `1px solid ${pColor}44`, padding: 20,
      zIndex: 50, minWidth: 280, maxWidth: 360,
      boxShadow: `0 0 30px ${pColor}22`,
    }}>
      <button onClick={onClose} style={{
        position: 'absolute', top: 8, right: 8,
        background: 'rgba(255,255,255,0.06)', border: 'none',
        color: '#bbbbdd', fontSize: 16, cursor: 'pointer',
        width: 24, height: 24, borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>x</button>
      <h3 style={{ color: pColor, margin: '0 0 8px', fontFamily: "'Noto Sans KR', sans-serif", fontSize: 16 }}>
        {evidence.from} → {evidence.to}
      </h3>
      <div className="stat-row">
        <span className="stat-label">{t('연결 강도','Connection Strength')}</span>
        <span className="stat-value" style={{ color: pColor }}>{evidence.strength}/3</span>
      </div>
      <div className="stat-row">
        <span className="stat-label">{t('경로','Pathway')}</span>
        <span className="stat-value" style={{ color: pColor, textTransform: 'capitalize' }}>{evidence.pathway}</span>
      </div>
      <div style={{ marginTop: 10 }}>
        <div className="strength-bar-bg" style={{ width: '100%' }}>
          <div className="strength-bar-fill" style={{ width: `${(evidence.strength / 3) * 100}%`, background: pColor }} />
        </div>
      </div>
      <p style={{ color: '#ccccee', fontSize: 12, lineHeight: 1.6, marginTop: 12, fontFamily: "'Noto Sans KR', sans-serif" }}>
        {evidence.evidence}
      </p>
    </div>
  );
}

// ── Network View (original skill tree) ──────────────────────
function NetworkView({ selectedId, setSelectedId, hoveredId, setHoveredId, selectedDisease }) {
  const { lang, t } = useLang();
  const [highlightLevel, setHighlightLevel] = useState(null);
  const [edgeDetail, setEdgeDetail] = useState(null);
  const highlightId = selectedId || hoveredId;

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: selectedDisease ? '1fr 320px' : '1fr',
      gap: 0,
      height: '100%',
      overflow: 'hidden',
    }}>
      <div style={{ position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 16, left: 24, zIndex: 2 }}>
          <h1 style={{
            fontFamily: "'Noto Sans KR', sans-serif",
            fontSize: 20, fontWeight: 800, color: '#e0e0ff', margin: 0,
            textShadow: '0 0 30px rgba(0,212,255,0.3)',
          }}>
            {t('비만 질환 네트워크','Obesity Disease Network')}
          </h1>
          <p style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11, color: '#4a4a6a', margin: '4px 0 0',
            letterSpacing: 1,
          }}>
            OBESITY COMPLICATION CASCADE
          </p>
        </div>

        <div style={{
          position: 'absolute', bottom: 16, left: 24, zIndex: 2,
          display: 'flex', gap: 16, alignItems: 'center',
        }}>
          {[
            { label: 'Liver', color: PATHWAY_COLORS.liver },
            { label: 'Cardiac', color: PATHWAY_COLORS.cardiac },
            { label: 'Renal', color: PATHWAY_COLORS.renal },
          ].map((p, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{
                width: 16, height: 3, borderRadius: 2, background: p.color, opacity: 0.8,
              }} />
              <span style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 10, color: p.color, letterSpacing: 0.5, opacity: 0.7,
              }}>
                {p.label}
              </span>
            </div>
          ))}
        </div>

        <svg
          viewBox="0 0 840 600"
          style={{ width: '100%', height: '100%' }}
          preserveAspectRatio="xMidYMin meet"
        >
          <defs>
            <marker id="arrowhead" viewBox="0 0 10 7" refX="10" refY="3.5"
              markerWidth="8" markerHeight="6" orient="auto-start-reverse"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill="#556677" opacity="0.6" />
            </marker>
            <filter id="nodeGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="edgeGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" />
            </filter>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#141430" strokeWidth="0.5" opacity="0.5" />
            </pattern>
          </defs>

          <rect width="800" height="600" fill="url(#grid)" />

          {LEVEL_Y.map((_, lvl) => {
            const band = getLevelBand(lvl);
            const isLevelActive = highlightLevel === lvl;
            return (
              <g key={`zone-${lvl}`}>
                <rect
                  x="0" y={band.y} width="800" height={band.height}
                  fill={isLevelActive ? LEVEL_ZONE_COLORS[lvl].replace('0.04', '0.12') : LEVEL_ZONE_COLORS[lvl]} rx="0"
                />
                <line
                  x1="0" y1={band.y} x2="800" y2={band.y}
                  stroke={LEVEL_ZONE_BORDERS[lvl]}
                  strokeWidth="0.5" strokeDasharray="6 4"
                />
                {/* Clickable level label */}
                <g style={{ cursor: 'pointer' }}
                  onClick={() => setHighlightLevel(highlightLevel === lvl ? null : lvl)}>
                  <rect x="8" y={LEVEL_Y[lvl] - 10} width="90" height="30" fill="transparent" />
                  <text
                    x="16" y={LEVEL_Y[lvl] + 4}
                    fill={isLevelActive ? '#ffffff' : LEVEL_ZONE_BORDERS[lvl]}
                    fontSize="11" fontFamily="'Noto Sans KR', sans-serif"
                    fontWeight="700" opacity={isLevelActive ? 1 : 0.9}
                    textDecoration={isLevelActive ? 'underline' : 'none'}
                  >
                    {LEVEL_LABELS[lvl]}
                  </text>
                  <text
                    x="16" y={LEVEL_Y[lvl] + 16}
                    fill={LEVEL_ZONE_BORDERS[lvl]}
                    fontSize="9" fontFamily="'JetBrains Mono', monospace" opacity="0.5"
                  >
                    {['LV.0  ROOT', 'LV.1  PRIMARY', 'LV.2  SECONDARY', 'LV.3  TERMINAL'][lvl]}
                  </text>
                </g>
              </g>
            );
          })}

          {[150, 290, 450].map((y, i) => (
            <g key={`flow-${i}`} opacity="0.15">
              <line x1="400" y1={y} x2="400" y2={y + 20} stroke="#ccccee" strokeWidth="1" strokeDasharray="3 3" />
              <polygon points={`395,${y + 18} 405,${y + 18} 400,${y + 24}`} fill="#ccccee" />
            </g>
          ))}

          <g>
            {EDGES.map((edge, i) => (
              <EdgeLine key={i} {...edge} selectedId={highlightId} edgeIdx={i}
                onEdgeClick={(e) => setEdgeDetail(e)} />
            ))}
          </g>

          <g>
            {Object.entries(DISEASES).map(([id, disease]) => (
              <g
                key={id}
                onMouseEnter={() => setHoveredId(id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                <DiseaseNode
                  disease={disease}
                  pos={NODE_POSITIONS[id]}
                  isSelected={selectedId === id}
                  dimmed={highlightLevel !== null && disease.level !== highlightLevel}
                  onClick={() => { setSelectedId(selectedId === id ? null : id); setEdgeDetail(null); }}
                />
              </g>
            ))}
          </g>

          {hoveredId && hoveredId !== selectedId && (() => {
            const hp = NODE_POSITIONS[hoveredId];
            const hd = DISEASES[hoveredId];
            const r = NODE_RADIUS[hd.level];
            const label = `${hd.name} — ${hd.prevalence}`;
            const boxW = Math.min(250, Math.max(120, label.length * 9 + 24));
            const boxH = 22;
            const gap = 8;
            const aboveY = hp.y - r - gap - boxH;
            const showBelow = aboveY < 5;
            const tooltipY = showBelow ? hp.y + r + gap : aboveY;
            const tooltipX = Math.max(4, Math.min(800 - boxW - 4, hp.x - boxW / 2));
            return (
              <g style={{ pointerEvents: 'none' }}>
                <rect
                  x={tooltipX} y={tooltipY}
                  width={boxW} height={boxH} rx="5"
                  fill="rgba(10,10,20,0.95)"
                  stroke={hd.color} strokeWidth="0.5"
                />
                <text
                  x={tooltipX + boxW / 2} y={tooltipY + 15}
                  textAnchor="middle" fill="#ddddef"
                  fontSize="11" fontFamily="'Noto Sans KR', sans-serif"
                  fontWeight="500"
                >
                  {label}
                </text>
              </g>
            );
          })()}
        </svg>
      </div>

      {selectedDisease && (
        <div style={{
          borderLeft: '1px solid #1a1a3a',
          background: '#0d0d18',
          padding: '12px',
          overflowY: 'auto',
        }}>
          <DiseaseDetail disease={selectedDisease} onClose={() => setSelectedId(null)} />
        </div>
      )}

      {/* Edge detail popup */}
      {edgeDetail && !selectedDisease && (
        <EdgeDetailPopup edge={edgeDetail} onClose={() => setEdgeDetail(null)} />
      )}

      {/* Source footer */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: '4px 12px',
        fontSize: 10,
        color: '#4a4a6a',
        fontFamily: "'JetBrains Mono', monospace",
        borderTop: '1px solid rgba(255,255,255,0.04)',
        background: 'rgba(10,10,15,0.85)',
      }}>
        {t('출처: 각 학회 팩트시트 (KOSSO/KDA/KSoLA/KASL/KDCA/KSH/KSHF 2022-2025)','Source: Medical Society Fact Sheets (KOSSO/KDA/KSoLA/KASL/KDCA/KSH/KSHF 2022-2025)')}
      </div>
    </div>
  );
}

// ── MASLD 2-Year Progression Trend (SVG Line Chart) ─────────
function Progression2yrView({ gender }) {
  const { lang, t } = useLang();
  const prog2yr = DISEASE_EPI.diseases?.nafld?.progression2yr;
  if (!prog2yr) return <div style={{ color: '#bbbbdd', padding: 24 }}>No 2yr data</div>;

  const AGE_GROUPS = ['20-29', '30-39', '40-49', '50-59', '60-69', '70-79', '80+'];
  const YEARS = [2010, 2015, 2020];
  const AGE_COLORS = ['#00ff88', '#00d4ff', '#ffd60a', '#ff6b6b', '#c084fc', '#ff006e', '#ff8800'];

  const outcomes = [
    { key: 'cirrhosis', label: t('간경화 2년 진행률 추이', 'Cirrhosis 2yr Progression Trend'), code: 'K702, K703, K717, K74' },
    { key: 'hcc', label: t('간세포암 2년 진행률 추이', 'HCC 2yr Progression Trend'), code: 'C220' },
  ];

  const w = 420, h = 240;
  const mL = 50, mR = 16, mT = 28, mB = 32;
  const cW = w - mL - mR, cH = h - mT - mB;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '0 12px 8px', overflow: 'auto' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, flex: 1, minHeight: 0 }}>
        {outcomes.map(({ key, label, code }) => {
          const data = prog2yr[key]?.[gender === 'male' ? 'male' : 'female'];
          if (!data) return null;

          // Calculate y-axis max
          let maxVal = 0;
          AGE_GROUPS.forEach(ag => {
            YEARS.forEach(yr => {
              const v = data[ag]?.[yr];
              if (v != null && v > maxVal) maxVal = v;
            });
          });
          maxVal = Math.ceil(maxVal * 1.2 * 10) / 10 || 1;

          const xScale = (yr) => mL + ((yr - 2010) / 10) * cW;
          const yScale = (v) => mT + cH - (v / maxVal) * cH;

          // Y-axis ticks
          const yTicks = [];
          const step = maxVal > 5 ? 2 : maxVal > 1 ? 0.5 : 0.1;
          for (let v = 0; v <= maxVal; v += step) {
            yTicks.push(Math.round(v * 100) / 100);
          }

          return (
            <div key={key} style={{ flex: '1 1 380px', minWidth: 340 }}>
              <h4 style={{
                fontFamily: "'Noto Sans KR', sans-serif", fontSize: 13, fontWeight: 700,
                color: '#e0e0ff', margin: '0 0 4px', textShadow: '0 0 12px rgba(0,255,136,0.2)',
              }}>
                {label}
                <span style={{ fontSize: 10, color: '#6666aa', marginLeft: 8 }}>({code})</span>
              </h4>
              <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', maxHeight: 240, background: '#0a0a0f', borderRadius: 8 }}>
                {/* Grid */}
                {yTicks.map(v => (
                  <g key={v}>
                    <line x1={mL} y1={yScale(v)} x2={w - mR} y2={yScale(v)} stroke="rgba(255,255,255,0.06)" />
                    <text x={mL - 6} y={yScale(v) + 3} textAnchor="end" fill="#6666aa" fontSize="9" fontFamily="'JetBrains Mono'">{v.toFixed(step < 1 ? 1 : 0)}%</text>
                  </g>
                ))}
                {/* X-axis labels */}
                {YEARS.map(yr => (
                  <text key={yr} x={xScale(yr)} y={h - mB + 16} textAnchor="middle" fill="#bbbbdd" fontSize="10" fontFamily="'JetBrains Mono'">{yr}</text>
                ))}
                {/* Lines per age group */}
                {AGE_GROUPS.map((ag, i) => {
                  const pts = YEARS.map(yr => ({ yr, val: data[ag]?.[yr] })).filter(p => p.val != null);
                  if (pts.length < 2) return null;
                  const pathD = pts.map((p, j) => `${j === 0 ? 'M' : 'L'}${xScale(p.yr)},${yScale(p.val)}`).join(' ');
                  return (
                    <g key={ag}>
                      <path d={pathD} fill="none" stroke={AGE_COLORS[i]} strokeWidth="2" opacity="0.85" />
                      {pts.map((p, j) => (
                        <g key={j}>
                          <circle cx={xScale(p.yr)} cy={yScale(p.val)} r="3.5" fill={AGE_COLORS[i]} stroke="#0a0a0f" strokeWidth="1" />
                          <text x={xScale(p.yr)} y={yScale(p.val) - 7} textAnchor="middle" fill={AGE_COLORS[i]} fontSize="8" fontFamily="'JetBrains Mono'" opacity="0.9">
                            {p.val.toFixed(2)}
                          </text>
                        </g>
                      ))}
                    </g>
                  );
                })}
              </svg>
              {/* Legend */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 12px', marginTop: 4, paddingLeft: mL }}>
                {AGE_GROUPS.map((ag, i) => (
                  <span key={ag} style={{ fontSize: 9, fontFamily: "'JetBrains Mono'", color: AGE_COLORS[i] }}>
                    {ag}{t('세','y')}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      {/* Insight box */}
      <div style={{
        margin: '8px 0 0', padding: '8px 14px',
        background: 'rgba(0,255,136,0.04)', border: '1px solid rgba(0,255,136,0.12)', borderRadius: 8,
      }}>
        <p style={{ fontFamily: "'Noto Sans KR', sans-serif", fontSize: 11, color: '#ccccee', margin: 0, lineHeight: 1.7 }}>
          {t(
            '간경화 진행률은 대부분 연령에서 2010→2020 감소 추세 (치료 발전). 단, 여성 70-79세·80+에서는 여전히 4-10%로 높음. 간세포암은 남성 80+에서 증가 추세 (0.67%→0.71%).',
            'Cirrhosis progression declining across most age groups (2010→2020). However, female 70-79 & 80+ remain high (4-10%). HCC in male 80+ shows slight increase (0.67%→0.71%).'
          )}
        </p>
      </div>
      <div style={{
        padding: '4px 0 2px', fontFamily: "'JetBrains Mono', monospace",
        fontSize: 10, color: '#4a4a6a',
      }}>
        {t(
          '출처: 대한간학회(KASL) NAFLD Fact Sheet 2023, Section IV "연도별 간경화(K702/K703/K717/K74) 및 간세포암(C220) 발전비율 (2년 추적관찰)". NHIS 2010/2015/2020년 MASLD 진단 코호트 각 2년 추적. ⚠️ 여성 일부 연령대 데이터 확인 필요.',
          'Source: KASL NAFLD Fact Sheet 2023, Section IV "Liver Cirrhosis (K702/K703/K717/K74) & HCC (C220) 2-Year Progression Rates by Year". NHIS 2010/2015/2020 MASLD cohorts, 2yr follow-up each. ⚠️ Some female age group data needs verification.'
        )}
      </div>
    </div>
  );
}

// ── MASLD Progression Heatmap (Canvas 2D) ───────────────────
function MASLDHeatmapView() {
  const { lang, t } = useLang();
  const canvasRef = useRef(null);
  const [gender, setGender] = useState('male');
  const [tooltip, setTooltip] = useState(null);
  const [clickDetail, setClickDetail] = useState(null);
  const [trackingMode, setTrackingMode] = useState('10yr'); // '10yr' or '2yr'

  const AGE_GROUPS = ['20-29', '30-39', '40-49', '50-59', '60-69', '70-79', '80+'];
  const AGE_KEYS = ['20_29', '30_39', '40_49', '50_59', '60_69', '70_79', '80_plus'];
  const OUTCOMES = ['malignancy', 'ischemic_heart_disease', 'ischemic_stroke', 'liver_cirrhosis', 'hepatocellular_carcinoma'];
  const OUTCOME_LABELS = ['악성종양', '허혈성 심질환', '뇌경색', '간경변', '간세포암'];

  // 일반 인구 10년 누적 발생률 추정 (%, 남성 기준, 국가암등록/KDCA 기반 근사)
  // 연간 발생률(10만명당) × 10년 / 100,000 × 100
  const GENERAL_POP_10YR = {
    male: {
      malignancy:              [0.3, 0.7, 1.6, 5.0, 11.0, 20.0, 25.0], // 암등록 2020 근사
      ischemic_heart_disease:  [0.1, 0.3, 0.8, 2.0, 4.5,  8.0, 12.0], // KDCA 심뇌혈관 근사
      ischemic_stroke:         [0.05, 0.1, 0.3, 1.0, 3.0, 7.0, 15.0], // KDCA 뇌졸중 근사
      liver_cirrhosis:         [0.01, 0.05, 0.2, 0.5, 1.0, 1.5, 2.0], // NHIS 근사
      hepatocellular_carcinoma:[0.01, 0.02, 0.1, 0.3, 0.5, 0.8, 1.0], // 암등록 간암 근사
    },
    female: {
      malignancy:              [0.5, 1.5, 3.0, 4.5, 6.5, 10.0, 12.0],
      ischemic_heart_disease:  [0.05, 0.1, 0.3, 0.8, 2.5, 5.0,  9.0],
      ischemic_stroke:         [0.03, 0.05, 0.2, 0.5, 2.0, 5.5, 12.0],
      liver_cirrhosis:         [0.01, 0.03, 0.1, 0.3, 0.5, 1.0, 1.5],
      hepatocellular_carcinoma:[0.005, 0.01, 0.05, 0.1, 0.2, 0.4, 0.6],
    },
  };

  const getData = useCallback(() => {
    const prog = nafldData.section_4_progression_and_mortality['10_year_progression_2010_baseline'];
    const prefix = gender === 'male' ? 'male_age_' : 'female_age_';
    const matrix = [];
    for (let row = 0; row < OUTCOMES.length; row++) {
      const rowData = [];
      for (let col = 0; col < AGE_KEYS.length; col++) {
        const ageKey = prefix + AGE_KEYS[col];
        const val = prog[ageKey]?.[OUTCOMES[row]] ?? 0;
        rowData.push(val);
      }
      matrix.push(rowData);
    }
    return matrix;
  }, [gender]);

  const getColor = (val, maxVal) => {
    const t = Math.min(val / Math.max(maxVal, 1), 1);
    const r = Math.round(20 + t * 235);
    const g = Math.round(20 + (1 - t) * 40);
    const b = Math.round(80 + (1 - t) * 175);
    return `rgb(${r},${g},${b})`;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;

    const W = canvas.parentElement.clientWidth;
    const H = canvas.parentElement.clientHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.scale(dpr, dpr);

    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, W, H);

    const matrix = getData();
    const maxVal = Math.max(...matrix.flat());

    const marginLeft = 90;
    const marginTop = 30;
    const marginRight = 40;
    const marginBottom = 10;
    const cellW = (W - marginLeft - marginRight) / AGE_GROUPS.length;
    const cellH = (H - marginTop - marginBottom) / OUTCOMES.length;

    // Column headers
    ctx.font = "11px 'JetBrains Mono', monospace";
    ctx.fillStyle = '#bbbbdd';
    ctx.textAlign = 'center';
    AGE_GROUPS.forEach((ag, i) => {
      ctx.fillText(ag, marginLeft + i * cellW + cellW / 2, marginTop - 12);
    });

    // Row labels
    ctx.textAlign = 'right';
    ctx.font = "12px 'Noto Sans KR', sans-serif";
    OUTCOME_LABELS.forEach((label, i) => {
      ctx.fillStyle = '#ccccee';
      ctx.fillText(label, marginLeft - 12, marginTop + i * cellH + cellH / 2 + 4);
    });

    // Cells — color by RR (ratio vs general population)
    const genPopData = GENERAL_POP_10YR[gender] || GENERAL_POP_10YR.male;
    let maxRatio = 1;
    // Pre-calculate ratios
    const ratioMatrix = [];
    for (let row = 0; row < OUTCOMES.length; row++) {
      const ratioRow = [];
      for (let col = 0; col < AGE_GROUPS.length; col++) {
        const val = matrix[row][col];
        const genVal = genPopData[OUTCOMES[row]]?.[col] || 0.01;
        const ratio = genVal > 0 ? val / genVal : 1;
        ratioRow.push(ratio);
        if (ratio > maxRatio) maxRatio = ratio;
      }
      ratioMatrix.push(ratioRow);
    }

    // Log scale for color: log2(ratio) maps ×1=0, ×2=1, ×4=2, ×8=3, ×16=4, ×32=5
    const logMax = Math.log2(Math.max(maxRatio, 2));

    for (let row = 0; row < OUTCOMES.length; row++) {
      for (let col = 0; col < AGE_GROUPS.length; col++) {
        const val = matrix[row][col];
        const ratio = ratioMatrix[row][col];
        const x = marginLeft + col * cellW;
        const y = marginTop + row * cellH;

        // Log-scale color: ×1=dark navy, ×2=teal, ×4=yellow, ×8=orange, ×16+=red
        const logR = ratio > 1 ? Math.log2(ratio) : 0;
        const t = Math.min(logR / logMax, 1);
        let r, g, b;
        if (t < 0.33) { // navy → teal
          const s = t / 0.33;
          r = Math.round(15 + s * 5);  g = Math.round(25 + s * 160);  b = Math.round(80 + s * 80);
        } else if (t < 0.66) { // teal → yellow/orange
          const s = (t - 0.33) / 0.33;
          r = Math.round(20 + s * 235); g = Math.round(185 + s * 30);  b = Math.round(160 - s * 150);
        } else { // orange → red
          const s = (t - 0.66) / 0.34;
          r = Math.round(255);           g = Math.round(215 - s * 195); b = Math.round(10 - s * 10);
        }
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(x + 1, y + 1, cellW - 2, cellH - 2);

        // Text: show ratio (big) + absolute % (small)
        ctx.font = "bold 11px 'JetBrains Mono', monospace";
        ctx.textAlign = 'center';
        ctx.fillStyle = t > 0.4 ? '#ffffff' : '#ccccee';
        ctx.fillText(`×${ratio < 10 ? ratio.toFixed(1) : Math.round(ratio)}`, x + cellW / 2, y + cellH / 2 - 2);
        ctx.font = "9px 'JetBrains Mono', monospace";
        ctx.fillStyle = t > 0.4 ? 'rgba(255,255,255,0.6)' : '#777';
        ctx.fillText(`${val.toFixed(1)}%`, x + cellW / 2, y + cellH / 2 + 12);
      }
    }

    // Color scale legend — log-scale ratio
    const legendX = W - marginRight + 10;
    const legendY = marginTop;
    const legendH = H - marginTop - marginBottom;
    const legendW = 12;
    for (let i = 0; i < legendH; i++) {
      const t = 1 - i / legendH;
      let r2, g2, b2;
      if (t < 0.33) { const s = t / 0.33; r2 = Math.round(15 + s * 5); g2 = Math.round(25 + s * 160); b2 = Math.round(80 + s * 80); }
      else if (t < 0.66) { const s = (t - 0.33) / 0.33; r2 = Math.round(20 + s * 235); g2 = Math.round(185 + s * 30); b2 = Math.round(160 - s * 150); }
      else { const s = (t - 0.66) / 0.34; r2 = 255; g2 = Math.round(215 - s * 195); b2 = Math.round(10 - s * 10); }
      ctx.fillStyle = `rgb(${r2},${g2},${b2})`;
      ctx.fillRect(legendX, legendY + i, legendW, 1);
    }
    ctx.font = "10px 'JetBrains Mono', monospace";
    ctx.fillStyle = '#ccccee';
    ctx.textAlign = 'left';
    // Log scale labels
    const maxR = Math.round(Math.pow(2, logMax));
    ctx.fillText(`×${maxR}`, legendX + legendW + 3, legendY + 8);
    ctx.fillText('×4', legendX + legendW + 3, legendY + legendH * 0.4);
    ctx.fillText('×2', legendX + legendW + 3, legendY + legendH * 0.7);
    ctx.fillText('×1', legendX + legendW + 3, legendY + legendH);

    // Store layout info for hover
    canvas._layout = { marginLeft, marginTop, cellW, cellH, matrix };
  }, [gender, getData]);

  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas || !canvas._layout) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const { marginLeft, marginTop, cellW, cellH, matrix } = canvas._layout;
    const col = Math.floor((x - marginLeft) / cellW);
    const row = Math.floor((y - marginTop) / cellH);
    if (col >= 0 && col < AGE_GROUPS.length && row >= 0 && row < OUTCOMES.length) {
      setTooltip({
        x: e.clientX, y: e.clientY,
        text: (() => {
          const v = matrix[row][col];
          const genPop = GENERAL_POP_10YR[gender]?.[OUTCOMES[row]]?.[col];
          const ratio = genPop && genPop > 0 ? (v / genPop).toFixed(1) : null;
          return `${AGE_GROUPS[col]}세 MASLD: ${v.toFixed(1)}%` +
            (ratio ? ` (일반인구 ${genPop}% 대비 ${ratio}배)` : '');
        })(),
      });
    } else {
      setTooltip(null);
    }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '12px 24px 8px',
      }}>
        <div>
          <h2 style={{
            fontFamily: "'Noto Sans KR', sans-serif", fontSize: 18, fontWeight: 800,
            color: '#e0e0ff', margin: 0, textShadow: '0 0 20px rgba(0,255,136,0.3)',
          }}>
            {trackingMode === '10yr'
              ? t('MASLD 코호트 10년 누적 질환 발생률','MASLD Cohort 10-Year Cumulative Disease Incidence')
              : t('MASLD 2년 추적 진행률 추이 (2010/2015/2020)', 'MASLD 2-Year Progression Trend (2010/2015/2020)')}
            <InfoTip text={trackingMode === '10yr'
              ? t('일반 인구 대비 배수(×) 표시. 색이 붉을수록 MASLD 환자의 해당 질환 발생이 일반인보다 높음. 비보정 단순비율이므로 교란변수(비만·당뇨) 영향 포함.','Shows ratio (×) vs general population. Redder = higher incidence in MASLD vs general pop. Unadjusted ratios — confounders (obesity, DM) included.')
              : t('2010/2015/2020년 MASLD 코호트의 2년 추적 시 간경화·간세포암 진행률을 비교. 시간에 따른 진행률 변화를 파악.','Compares 2yr progression to cirrhosis/HCC across 2010/2015/2020 MASLD cohorts.')} />
          </h2>
          <p style={{
            fontFamily: "'Noto Sans KR', sans-serif", fontSize: 11, color: '#ccccee',
            margin: '4px 0 0', lineHeight: 1.6,
          }}>
            {trackingMode === '10yr'
              ? t('2010년 MASLD 진단 환자를 10년간 추적 — 일반 인구 발생률 대비 배수 표시. ⚠️ 교란변수(비만·당뇨·연령 등) 미보정 단순 비율 비교이며, 독립적 위험도(adjusted RR/HR)가 아님. MASLD의 독립적 기여도를 평가하려면 다변량 보정 분석이 필요합니다. 여성 일부 데이터 검증 필요.', 'Tracking 2010 MASLD patients over 10 years — showing ratio vs general population. ⚠️ Unadjusted simple ratios (confounders like obesity, DM, age not controlled). Multivariable analysis needed for independent risk assessment.')
              : t('2010/2015/2020년 MASLD 진단 코호트의 2년 추적 진행률 비교. 간경화·간세포암으로의 진행이 시간에 따라 개선되고 있는지 보여줌.', '2yr follow-up progression rates compared across 2010/2015/2020 MASLD cohorts. Shows whether liver disease progression is improving over time.')}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {/* Tracking mode toggle */}
          {['10yr', '2yr'].map(m => (
            <button key={m} onClick={() => { setTrackingMode(m); setClickDetail(null); }} style={{
              padding: '4px 12px', borderRadius: 14,
              border: `1px solid ${trackingMode === m ? '#00ff8844' : 'rgba(255,255,255,0.1)'}`,
              background: trackingMode === m ? 'rgba(0,255,136,0.12)' : 'transparent',
              color: trackingMode === m ? '#00ff88' : '#6666aa',
              fontFamily: "'Noto Sans KR', sans-serif", fontSize: 11, fontWeight: 600, cursor: 'pointer',
            }}>
              {m === '10yr' ? t('10년 추적', '10yr') : t('2년 추적 (연도별)', '2yr Trend')}
            </button>
          ))}
          <span style={{ width: 1, height: 18, background: 'rgba(255,255,255,0.1)', margin: '0 4px' }} />
          {/* Gender toggle */}
          {['male', 'female'].map(g => (
            <button key={g} onClick={() => setGender(g)} style={{
              padding: '4px 14px', borderRadius: 14,
              border: `1px solid ${gender === g ? (g === 'male' ? '#00d4ff44' : '#ff006e44') : 'rgba(255,255,255,0.1)'}`,
              background: gender === g ? (g === 'male' ? 'rgba(0,212,255,0.15)' : 'rgba(255,0,110,0.15)') : 'transparent',
              color: gender === g ? (g === 'male' ? '#00d4ff' : '#ff006e') : '#6666aa',
              fontFamily: "'Noto Sans KR', sans-serif", fontSize: 12, fontWeight: 600, cursor: 'pointer',
            }}>
              {g === 'male' ? t('남','M') : t('여','F')}
            </button>
          ))}
        </div>
      </div>
      {trackingMode === '10yr' ? (<>
      <div style={{ flex: 1, position: 'relative', padding: '0 8px 8px' }}>
        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setTooltip(null)}
          onClick={(e) => {
            const canvas = canvasRef.current;
            if (!canvas || !canvas._layout) return;
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const { marginLeft, marginTop: mT, cellW: cW, cellH: cH, matrix: mat } = canvas._layout;
            const col = Math.floor((x - marginLeft) / cW);
            const row = Math.floor((y - mT) / cH);
            if (col >= 0 && col < AGE_GROUPS.length && row >= 0 && row < OUTCOMES.length) {
              // Cell click - show detail for that cell
              const rowVals = AGE_GROUPS.map((_, ci) => ({ age: AGE_GROUPS[ci], value: mat[row][ci] }));
              const colVals = OUTCOME_LABELS.map((_, ri) => ({ outcome: OUTCOME_LABELS[ri], value: mat[ri][col] }));
              setClickDetail({
                type: 'cell',
                outcome: OUTCOME_LABELS[row], age: AGE_GROUPS[col],
                value: mat[row][col],
                rowTrend: rowVals, colTrend: colVals,
                mx: e.clientX, my: e.clientY,
              });
            } else if (y >= mT && y < mT + cH * OUTCOMES.length && x < marginLeft) {
              // Row label click
              const row2 = Math.floor((y - mT) / cH);
              if (row2 >= 0 && row2 < OUTCOMES.length) {
                const rowVals = AGE_GROUPS.map((ag, ci) => ({ age: ag, value: mat[row2][ci] }));
                setClickDetail({ type: 'row', outcome: OUTCOME_LABELS[row2], data: rowVals, mx: e.clientX, my: e.clientY });
              }
            } else if (y < mT && x >= marginLeft) {
              // Column label click
              const col2 = Math.floor((x - marginLeft) / cW);
              if (col2 >= 0 && col2 < AGE_GROUPS.length) {
                const colVals = OUTCOME_LABELS.map((lbl, ri) => ({ outcome: lbl, value: mat[ri][col2] }));
                setClickDetail({ type: 'col', age: AGE_GROUPS[col2], data: colVals, mx: e.clientX, my: e.clientY });
              }
            }
          }}
          style={{ width: '100%', height: '100%', cursor: 'pointer' }}
        />
        {tooltip && (
          <div style={{
            position: 'fixed', left: tooltip.x + 12, top: tooltip.y - 30,
            background: '#1a1a2eee', border: '1px solid #00ff8844', borderRadius: 6,
            padding: '6px 12px', pointerEvents: 'none', zIndex: 100,
            fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#e0e0ff',
            boxShadow: '0 0 12px rgba(0,255,136,0.2)',
          }}>
            {tooltip.text}
          </div>
        )}
        {/* Click detail panel — always visible with default */}
        {(() => {
          const showDefault = !clickDetail;
          const panelStyle = {
            position: showDefault ? 'absolute' : 'fixed',
            ...(showDefault ? { right: 16, bottom: 50 } : { left: Math.min(clickDetail.mx + 16, window.innerWidth - 280), top: Math.min(clickDetail.my - 20, window.innerHeight - 300) }),
            background: '#1a1a2eee', border: '1px solid #00ff8844', borderRadius: 10,
            padding: '12px 14px', zIndex: 100, minWidth: 220, maxWidth: 280,
            maxHeight: '260px', overflowY: 'auto',
            boxShadow: '0 0 20px rgba(0,255,136,0.15)',
            backdropFilter: 'blur(8px)',
          };
          return showDefault ? (
            <div style={panelStyle}>
              <h4 style={{ color: '#00ff88', margin: '0 0 6px', fontSize: 12, fontWeight: 700 }}>
                {t('MASLD 합병증 요약', 'MASLD Complication Summary')}
              </h4>
              <p style={{ color: '#ccccee', fontSize: 11, lineHeight: 1.7, margin: 0 }}>
                {t(
                  'MASLD 환자는 일반 인구 대비 간경변 최대 ×30, 간세포암 ×10, 심혈관질환 ×2-4배 높은 발생률. 특히 50세 이상 남성에서 악성종양 발생이 현저히 증가. 셀을 클릭하면 상세 분석을 확인할 수 있습니다.',
                  'MASLD patients show up to ×30 higher cirrhosis, ×10 HCC, ×2-4 CVD incidence vs general population. Malignancy risk notably elevated in males 50+. Click a cell for detailed analysis.'
                )}
              </p>
            </div>
          ) : null;
        })()}
        {clickDetail && (
          <div className="detail-panel" style={{
            position: 'fixed',
            left: Math.min(clickDetail.mx + 16, window.innerWidth - 280),
            top: Math.min(clickDetail.my - 20, window.innerHeight - 300),
            background: '#1a1a2eee', border: '1px solid #00ff8844', borderRadius: 10,
            padding: '12px 14px', zIndex: 100, minWidth: 220, maxWidth: 280,
            maxHeight: '260px', overflowY: 'auto',
            boxShadow: '0 0 20px rgba(0,255,136,0.15)',
            backdropFilter: 'blur(8px)',
          }}>
            <button onClick={() => setClickDetail(null)} style={{
              position: 'absolute', top: 6, right: 8,
              background: 'rgba(255,255,255,0.06)', border: 'none',
              color: '#bbbbdd', fontSize: 14, cursor: 'pointer',
              width: 22, height: 22, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>x</button>
            {clickDetail.type === 'cell' && (() => {
              const v = clickDetail.value;
              const colIdx = AGE_GROUPS.indexOf(clickDetail.age);
              const outcomeKey = OUTCOMES[OUTCOME_LABELS.indexOf(clickDetail.outcome)];
              const genPop = GENERAL_POP_10YR[gender]?.[outcomeKey]?.[colIdx];
              const ratio = genPop && genPop > 0 ? (v / genPop) : null;
              const risk = v > 15 ? '매우 높음' : v > 5 ? '높음' : v > 1 ? '중등도' : '낮음';
              const riskColor = v > 15 ? '#ff4444' : v > 5 ? '#ffd60a' : v > 1 ? '#00d4ff' : '#00ff88';
              return (
                <>
                  <h4 style={{ color: '#00ff88', margin: '0 0 4px', fontSize: 13 }}>
                    {clickDetail.age}세 · {clickDetail.outcome}
                  </h4>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 6 }}>
                    <span style={{ color: '#e0e0ff', fontSize: 22, fontWeight: 800, fontFamily: "'JetBrains Mono'" }}>{v.toFixed(1)}%</span>
                    <span style={{ color: riskColor, fontSize: 11, fontWeight: 600, padding: '2px 6px', background: `${riskColor}15`, borderRadius: 4 }}>{risk}</span>
                  </div>
                  {ratio && (
                    <div style={{ marginBottom: 8, padding: '4px 8px', background: 'rgba(255,214,10,0.08)', borderRadius: 6, border: '1px solid rgba(255,214,10,0.15)' }}>
                      <span style={{ color: '#ffd60a', fontSize: 11, fontWeight: 600 }}>
                        일반 인구 대비 {ratio.toFixed(1)}배
                      </span>
                      <span style={{ color: '#bbbbdd', fontSize: 10, marginLeft: 6 }}>
                        ({t('일반','Gen pop')}: {genPop}%)
                      </span>
                    </div>
                  )}
                  <p style={{ color: '#ccccee', fontSize: 11, lineHeight: 1.6, margin: 0 }}>
                    {lang === 'en'
                      ? `Among 100 ${gender === 'male' ? 'male' : 'female'} MASLD patients aged ${clickDetail.age}, ~${v < 1 ? v.toFixed(1) : Math.round(v)} develop ${clickDetail.outcome} within 10yr.`
                      : `${clickDetail.age}세 ${gender === 'male' ? '남성' : '여성'} MASLD 환자 100명 중 약 ${v < 1 ? v.toFixed(1) : Math.round(v)}명에서 10년 내 ${clickDetail.outcome} 발생.`}
                    {ratio && ratio > 3 && (lang === 'en' ? ` ${ratio.toFixed(1)}x vs general population (unadjusted). Confounders (obesity, diabetes) may contribute; independent causality needs separate analysis.` : ` 일반 인구 대비 ${ratio.toFixed(1)}배 (비보정). 비만·당뇨 등 교란변수 기여 가능성 있어 독립적 인과관계는 별도 분석 필요.`)}
                    {ratio && ratio > 1.5 && ratio <= 3 && (lang === 'en' ? ' Slightly elevated vs general population (unadjusted).' : ' 일반 인구 대비 소폭 상승 (비보정 비율).')}
                    {v > 10 && (lang === 'en' ? ' Active screening recommended.' : ' 적극적 선별검사 필요.')}
                    {v <= 1 && (lang === 'en' ? ' Low incidence but continued monitoring recommended.' : ' 낮은 발생률이나 지속 모니터링 권장.')}
                  </p>
                  <p style={{ color: '#9999bb', fontSize: 9, marginTop: 6 }}>
                    {t('※ 일반 인구 발생률은 국가암등록/KDCA 기반 근사치. 정확한 비교에는 연령표준화 분석 필요.','※ General population incidence rates are approximations from National Cancer Registry/KDCA. Age-standardized analysis needed for precise comparison.')}
                  </p>
                </>
              );
            })()}
            {clickDetail.type === 'row' && (() => {
              const maxAge = clickDetail.data.reduce((a, b) => b.value > a.value ? b : a, clickDetail.data[0]);
              return (
                <>
                  <h4 style={{ color: '#00ff88', margin: '0 0 6px', fontSize: 13 }}>{clickDetail.outcome}</h4>
                  <p style={{ color: '#ccccee', fontSize: 11, lineHeight: 1.6, margin: 0 }}>
                    MASLD 코호트에서 {clickDetail.outcome} 10년 누적 발생률은 연령 증가에 따라 상승하며, {maxAge.age}세에서 {maxAge.value.toFixed(1)}%로 가장 높음.
                    {clickDetail.outcome === '간경변' || clickDetail.outcome === '간세포암' ? ' MASLD와 직접적 인과관계가 있는 합병증.' : ' MASLD와의 독립적 인과관계는 추가 연구 필요.'}
                  </p>
                </>
              );
            })()}
            {clickDetail.type === 'col' && (() => {
              const maxOutcome = clickDetail.data.reduce((a, b) => b.value > a.value ? b : a, clickDetail.data[0]);
              return (
                <>
                  <h4 style={{ color: '#00ff88', margin: '0 0 6px', fontSize: 13 }}>{clickDetail.age}세 MASLD 환자</h4>
                  <p style={{ color: '#ccccee', fontSize: 11, lineHeight: 1.6, margin: 0 }}>
                    이 연령대에서 10년 내 가장 높은 누적 발생률은 {maxOutcome.outcome} ({maxOutcome.value.toFixed(1)}%).
                    {parseInt(clickDetail.age) >= 60 ? ' 고령에서 다장기 합병증 위험이 급격히 증가하므로 다학제 관리 필요.' : ' 비교적 젊은 연령이나 장기 추적 시 합병증 부담 증가 가능.'}
                  </p>
                </>
              );
            })()}
          </div>
        )}
      </div>
      <div style={{
        padding: '4px 24px 10px', fontFamily: "'JetBrains Mono', monospace",
        fontSize: 10, color: '#4a4a6a',
      }}>
        {t(
          '출처: 대한간학회(KASL) NAFLD Fact Sheet 2023, Section IV "비알코올지방간질환 진행 및 사망(추적관찰)". 국민건강보험공단(NHIS) 2010년 MASLD 진단 코호트 10년 추적(2010→2020). 일반 인구 발생률은 국가암등록사업/KDCA 기반 근사치.',
          'Source: KASL NAFLD Fact Sheet 2023, Section IV "NAFLD Progression & Mortality (Follow-up)". NHIS 2010 MASLD cohort 10-year tracking (2010→2020). General population rates are approximate estimates from National Cancer Registry/KDCA.'
        )}
      </div>
      </>) : (
      <Progression2yrView gender={gender} />
      )}
    </div>
  );
}

// ── Diabetes Control Cascade (SVG Funnel) ────────────────────
// ── Multi-Disease Trend Comparison (SVG) ────────────────────
function TrendsView() {
  const { lang, t } = useLang();
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const [mode, setMode] = useState('prevalence');
  const [hoverInfo, setHoverInfo] = useState(null);
  const [hiddenDiseases, setHiddenDiseases] = useState({});
  const [pointDetail, setPointDetail] = useState(null);

  // Fixed viewBox — reduced height to prevent bottom clipping
  const w = 900, h = 340;
  const marginL = 50;
  const marginR = 30;
  const marginT = 40;
  const marginB = 40;
  const chartW = w - marginL - marginR;
  const chartH = h - marginT - marginB;

  const COLORS = {
    hypertension: '#ffd60a',
    diabetes: '#00d4ff',
    dyslipidemia: '#b388ff',
  };
  const LABELS = {
    hypertension: '고혈압',
    diabetes: '당뇨',
    dyslipidemia: '이상지질혈증',
  };
  const LABELS_EN = {
    hypertension: 'Hypertension',
    diabetes: 'Diabetes',
    dyslipidemia: 'Dyslipidemia',
  };

  const isIncidenceMode = mode === 'incidence';

  // Different colors/labels for incidence mode (MI, Stroke, NAFLD)
  const INCIDENCE_COLORS = { mi: '#ff4444', stroke: '#ff8800', nafld: '#66ff66' };
  const INCIDENCE_LABELS = { mi: '심근경색', stroke: '뇌졸중', nafld: 'MASLD' };
  const INCIDENCE_LABELS_EN = { mi: 'MI', stroke: 'Stroke', nafld: 'MASLD' };

  const activeColors = isIncidenceMode ? INCIDENCE_COLORS : COLORS;
  const activeLabels = isIncidenceMode ? INCIDENCE_LABELS : LABELS;

  // Build prevalence series
  const buildPrevalenceSeries = () => {
    const htData = trendsData.hypertension_historical.prevalence_by_year;
    const htYears = Object.keys(htData).map(Number).sort((a, b) => a - b);

    const series = {
      hypertension: htYears.map(yr => ({ year: yr, value: htData[yr].crude })),
      diabetes: [],
      dyslipidemia: [],
    };

    const dbPrev = trendsData.diabetes_historical.prevalence_by_year;
    const dbMapping = [
      ['1998-2005', 2002], ['2007-2009', 2008], ['2010-2012', 2011],
      ['2013-2015', 2014], ['2016-2018', 2017], ['2019-2020', 2020], ['2021-2022', 2022],
    ];
    for (const [key, yr] of dbMapping) {
      if (dbPrev[key] != null) series.diabetes.push({ year: yr, value: dbPrev[key] });
    }

    const dlPrev = trendsData.dyslipidemia_historical.overall_dyslipidemia_prevalence;
    const dlMapping = [
      ['2005-2009', 2007], ['2010-2012', 2011], ['2013-2015', 2014],
      ['2016-2019', 2018], ['2020-2022', 2021],
    ];
    for (const [key, yr] of dlMapping) {
      if (dlPrev[key] != null) series.dyslipidemia.push({ year: yr, value: dlPrev[key] });
    }

    return series;
  };

  // Build awareness series
  const buildAwarenessSeries = () => {
    const series = { hypertension: [], diabetes: [], dyslipidemia: [] };

    const htAw = trendsData.hypertension_historical.awareness_by_year;
    const htMapping = [['1998', 1998], ['2007-2009', 2008], ['2013-2015', 2014], ['2020', 2020], ['2021', 2021]];
    for (const [key, yr] of htMapping) {
      if (htAw[key] != null) series.hypertension.push({ year: yr, value: htAw[key] });
    }

    const dbAw = trendsData.diabetes_historical.awareness_by_year;
    const dbMapping = [['2013-2015', 2014], ['2016-2018', 2017], ['2019-2020', 2020], ['2021-2022', 2022]];
    for (const [key, yr] of dbMapping) {
      if (dbAw[key] != null) series.diabetes.push({ year: yr, value: dbAw[key] });
    }

    const dlAw = trendsData.dyslipidemia_historical.awareness_by_period;
    const dlMapping = [['2005-2009', 2007], ['2010-2012', 2011], ['2013-2015', 2014], ['2016-2019', 2018], ['2020-2022', 2021]];
    for (const [key, yr] of dlMapping) {
      if (dlAw[key] != null) series.dyslipidemia.push({ year: yr, value: dlAw[key] });
    }

    return series;
  };

  // Build treatment series (치료율)
  const buildTreatmentSeries = () => {
    const series = { hypertension: [], diabetes: [], dyslipidemia: [] };

    const htTx = trendsData.hypertension_historical.treatment_by_year;
    const htMapping = [['1998', 1998], ['2007-2009', 2008], ['2013-2015', 2014], ['2020', 2020], ['2021', 2021]];
    for (const [key, yr] of htMapping) {
      if (htTx[key] != null) series.hypertension.push({ year: yr, value: htTx[key] });
    }

    const dbTx = trendsData.diabetes_historical.treatment_by_year;
    const dbMapping = [['2007-2009', 2008], ['2013-2016', 2015], ['2016-2018', 2017], ['2019-2020', 2020], ['2021-2022', 2022]];
    for (const [key, yr] of dbMapping) {
      if (dbTx[key] != null) series.diabetes.push({ year: yr, value: dbTx[key] });
    }

    const dlTx = trendsData.dyslipidemia_historical.treatment_by_period;
    const dlMapping = [['2005-2009', 2007], ['2010-2012', 2011], ['2013-2015', 2014], ['2016-2019', 2018], ['2020-2022', 2021]];
    for (const [key, yr] of dlMapping) {
      if (dlTx[key] != null) series.dyslipidemia.push({ year: yr, value: dlTx[key] });
    }

    return series;
  };

  // Build control series (조절률)
  const buildControlSeries = () => {
    const series = { hypertension: [], diabetes: [], dyslipidemia: [] };

    const htCtrl = trendsData.hypertension_historical.control_by_year;
    const htMapping = [['1998', 1998], ['2007-2009', 2008], ['2013-2015', 2014], ['2020', 2020], ['2021', 2021]];
    for (const [key, yr] of htMapping) {
      if (htCtrl[key] != null) series.hypertension.push({ year: yr, value: htCtrl[key] });
    }

    // Diabetes control: use HbA1c <6.5% rates
    const dbCtrl = trendsData.diabetes_historical.control_by_year.hba1c_less_than_6_5_percent || trendsData.diabetes_historical.control_by_year['hba1c_less_than_6.5_percent'];
    if (dbCtrl) {
      const dbMapping = [['2013-2014', 2014], ['2016-2018', 2017], ['2019-2020', 2020], ['2021-2022', 2022]];
      for (const [key, yr] of dbMapping) {
        if (dbCtrl[key] != null) series.diabetes.push({ year: yr, value: dbCtrl[key] });
      }
    }

    const dlCtrl = trendsData.dyslipidemia_historical.control_among_prevalence;
    const dlMapping = [['2005-2009', 2007], ['2010-2012', 2011], ['2013-2015', 2014], ['2016-2019', 2018], ['2020-2022', 2021]];
    for (const [key, yr] of dlMapping) {
      if (dlCtrl[key] != null) series.dyslipidemia.push({ year: yr, value: dlCtrl[key] });
    }

    return series;
  };

  // Build incidence series (발생건수) — MI, Stroke, NAFLD
  const buildIncidenceSeries = () => {
    const series = { mi: [], stroke: [], nafld: [] };

    const mi = DISEASE_TIMESERIES.mi_incidence;
    mi.years.forEach((yr, i) => series.mi.push({ year: yr, value: mi.cases[i] }));

    const st = DISEASE_TIMESERIES.stroke_incidence;
    st.years.forEach((yr, i) => series.stroke.push({ year: yr, value: st.cases[i] }));

    const nf = DISEASE_TIMESERIES.nafld_incidence;
    nf.years.forEach((yr, i) => series.nafld.push({ year: yr, value: nf.cases[i] }));

    return series;
  };

  const TREND_MODES = [
    { id: 'prevalence', label_ko: '유병률', label_en: 'Prevalence' },
    { id: 'awareness', label_ko: '인지율', label_en: 'Awareness' },
    { id: 'treatment', label_ko: '치료율', label_en: 'Treatment' },
    { id: 'control', label_ko: '조절률', label_en: 'Control' },
    { id: 'incidence', label_ko: '발생건수', label_en: 'Incidence' },
  ];

  const MODE_LABELS = {
    prevalence: '유병률', awareness: '인지율', treatment: '치료율',
    control: '조절률', incidence: '발생건수',
  };
  const MODE_LABELS_EN = {
    prevalence: 'Prevalence', awareness: 'Awareness', treatment: 'Treatment',
    control: 'Control', incidence: 'Incidence',
  };

  const buildSeries = () => {
    switch (mode) {
      case 'prevalence': return buildPrevalenceSeries();
      case 'awareness': return buildAwarenessSeries();
      case 'treatment': return buildTreatmentSeries();
      case 'control': return buildControlSeries();
      case 'incidence': return buildIncidenceSeries();
      default: return buildPrevalenceSeries();
    }
  };

  const series = buildSeries();

  // Compute axes
  const allYears = Object.values(series).flatMap(s => s.map(d => d.year));
  const allValues = Object.values(series).flatMap(s => s.map(d => d.value));
  const minYear = Math.min(...allYears);
  const maxYear = Math.max(...allYears);

  // For incidence, values are large integers; for percentages, step by 5
  const valStep = isIncidenceMode
    ? (() => { const range = Math.max(...allValues) - Math.min(...allValues); if (range > 1000000) return 500000; if (range > 100000) return 200000; return 50000; })()
    : 5;
  const minVal = Math.floor(Math.min(...allValues) / valStep) * valStep;
  const maxVal = Math.ceil(Math.max(...allValues) / valStep) * valStep + valStep;

  const xScale = (yr) => marginL + ((yr - minYear) / (maxYear - minYear)) * chartW;
  const yScale = (val) => marginT + chartH * (1 - (val - minVal) / (maxVal - minVal));

  const buildPath = (data) => {
    if (data.length === 0) return '';
    return data.map((d, i) => `${i === 0 ? 'M' : 'L'}${xScale(d.year).toFixed(1)},${yScale(d.value).toFixed(1)}`).join(' ');
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '12px 24px 4px',
      }}>
        <div>
          <h2 style={{
            fontFamily: "'Noto Sans KR', sans-serif", fontSize: 18, fontWeight: 800,
            color: '#e0e0ff', margin: 0, textShadow: '0 0 20px rgba(179,136,255,0.3)',
          }}>
            {t('대사질환 추이 비교','Metabolic Disease Trend Comparison')}
          </h2>
          <p style={{
            fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#4a4a6a',
            margin: '2px 0 0', letterSpacing: 0.5,
          }}>
            MULTI-DISEASE TREND COMPARISON 1998-2022
          </p>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {TREND_MODES.map(m => (
            <button key={m.id} onClick={() => { setMode(m.id); setHiddenDiseases({}); setPointDetail(null); }} style={{
              padding: '4px 12px', borderRadius: 14,
              border: `1px solid ${mode === m.id ? '#b388ff44' : 'rgba(255,255,255,0.1)'}`,
              background: mode === m.id ? 'rgba(179,136,255,0.15)' : 'transparent',
              color: mode === m.id ? '#b388ff' : '#6666aa',
              fontFamily: "'Noto Sans KR', sans-serif", fontSize: 11, fontWeight: 600, cursor: 'pointer',
            }}>
              {lang === 'en' ? m.label_en : m.label_ko}
            </button>
          ))}
        </div>
      </div>
      <div style={{ flex: 1, minHeight: 0, padding: '0 8px 0', position: 'relative', overflow: 'visible' }} ref={containerRef}>
        <svg ref={svgRef} viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: '100%', display: 'block' }}
          preserveAspectRatio="xMidYMin meet"
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const svgX = (e.clientX - rect.left) / rect.width * w;
            const hoverYear = minYear + ((svgX - marginL) / chartW) * (maxYear - minYear);
            if (hoverYear >= minYear && hoverYear <= maxYear) {
              setHoverInfo({ x: e.clientX, y: e.clientY, year: Math.round(hoverYear) });
            } else {
              setHoverInfo(null);
            }
          }}
          onMouseLeave={() => setHoverInfo(null)}
        >
          <defs>
            <pattern id="trendGrid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#141430" strokeWidth="0.5" opacity="0.3" />
            </pattern>
          </defs>
          <rect width={w} height={h} fill="url(#trendGrid)" />

          {/* Y gridlines */}
          {Array.from({ length: Math.round((maxVal - minVal) / valStep) + 1 }, (_, i) => minVal + i * valStep).map(pct => {
            const yy = yScale(pct);
            return (
              <g key={pct}>
                <line x1={marginL} y1={yy} x2={w - marginR} y2={yy}
                  stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
                <text x={marginL - 6} y={yy + 3} textAnchor="end"
                  fill="#4a4a6a" fontSize="10" fontFamily="'JetBrains Mono', monospace">
                  {isIncidenceMode ? (pct >= 1000000 ? `${(pct / 10000).toFixed(0)}만` : pct >= 10000 ? `${(pct / 10000).toFixed(1)}만` : pct.toLocaleString()) : `${pct}%`}
                </text>
              </g>
            );
          })}

          {/* X axis labels */}
          {Array.from({ length: Math.floor((maxYear - minYear) / 4) + 1 }, (_, i) => minYear + i * 4).map(yr => (
            <text key={yr} x={xScale(yr)} y={marginT + chartH + 18} textAnchor="middle"
              fill="#4a4a6a" fontSize="10" fontFamily="'JetBrains Mono', monospace">
              {yr}
            </text>
          ))}

          {/* Lines */}
          {Object.entries(series).map(([disease, data]) => {
            if (hiddenDiseases[disease] || data.length === 0) return null;
            const maxDiseaseVal = Math.max(...data.map(d => d.value), 1);
            const lineWidth = 1.2 + (maxDiseaseVal / maxVal) * 2.5;
            const glowWidth = lineWidth * 2.5;
            const color = activeColors[disease] || '#bbbbdd';
            return (
              <g key={disease}>
                <path d={buildPath(data)} fill="none" stroke={color}
                  strokeWidth={glowWidth} opacity="0.15" />
                <path d={buildPath(data)} fill="none" stroke={color}
                  strokeWidth={lineWidth} opacity="0.9" strokeLinejoin="round" />
                {data.map((d, i) => (
                  <g key={i} style={{ cursor: 'pointer' }}
                    onClick={() => {
                      const yearData = {};
                      Object.entries(series).forEach(([dk, dd]) => {
                        const match = dd.find(p => p.year === d.year);
                        if (match) yearData[dk] = match.value;
                      });
                      setPointDetail({ year: d.year, disease, value: d.value, allDiseases: yearData });
                    }}>
                    <circle cx={xScale(d.year)} cy={yScale(d.value)} r="8" fill="transparent" />
                    <circle cx={xScale(d.year)} cy={yScale(d.value)} r="3.5"
                      fill="#0a0a0f" stroke={color} strokeWidth="1.5" />
                  </g>
                ))}
              </g>
            );
          })}

          {/* Hover line */}
          {hoverInfo && (
            <line x1={xScale(hoverInfo.year)} y1={marginT} x2={xScale(hoverInfo.year)} y2={marginT + chartH}
              stroke="rgba(255,255,255,0.15)" strokeWidth="1" strokeDasharray="4 4" />
          )}

          {/* Clickable Legend (toggle disease lines) */}
          <g>
            {Object.entries(activeLabels).map(([key, label], i) => {
              const isHidden = hiddenDiseases[key];
              const color = activeColors[key] || '#bbbbdd';
              return (
                <g key={key} transform={`translate(${marginL + 10 + i * 130}, ${marginT - 20})`}
                  style={{ cursor: 'pointer' }}
                  onClick={() => setHiddenDiseases(prev => ({ ...prev, [key]: !prev[key] }))}>
                  <rect x="-4" y="-10" width="120" height="20" fill="transparent" />
                  <line x1="0" y1="0" x2="18" y2="0" stroke={color} strokeWidth="2.5"
                    opacity={isHidden ? 0.2 : 1} />
                  <circle cx="9" cy="0" r="3" fill={isHidden ? '#333' : '#0a0a0f'}
                    stroke={color} strokeWidth="1.5" opacity={isHidden ? 0.2 : 1} />
                  <text x="24" y="4" fill={color} fontSize="11"
                    fontFamily="'Noto Sans KR', sans-serif" fontWeight="600"
                    opacity={isHidden ? 0.3 : 1}
                    textDecoration={isHidden ? 'line-through' : 'none'}>
                    {label}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>

        {/* Tooltip */}
        {hoverInfo && (
          <div style={{
            position: 'fixed', left: hoverInfo.x + 14, top: hoverInfo.y - 20,
            background: '#1a1a2eee', border: '1px solid rgba(179,136,255,0.3)', borderRadius: 6,
            padding: '6px 12px', pointerEvents: 'none', zIndex: 100,
            fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#e0e0ff',
            boxShadow: '0 0 12px rgba(179,136,255,0.15)',
          }}>
            <div style={{ fontWeight: 700, marginBottom: 3 }}>{hoverInfo.year}</div>
            {Object.entries(series).map(([key, data]) => {
              if (hiddenDiseases[key] || data.length === 0) return null;
              const closest = data.reduce((prev, curr) =>
                Math.abs(curr.year - hoverInfo.year) < Math.abs(prev.year - hoverInfo.year) ? curr : prev
              , data[0]);
              if (!closest || Math.abs(closest.year - hoverInfo.year) > 3) return null;
              const color = activeColors[key] || '#bbbbdd';
              const label = activeLabels[key] || key;
              const valStr = isIncidenceMode ? `${closest.value.toLocaleString()}건` : `${closest.value.toFixed(1)}%`;
              return (
                <div key={key} style={{ color, fontSize: 10 }}>
                  {label}: {valStr} ({closest.year})
                </div>
              );
            })}
          </div>
        )}
        {/* Point click detail */}
        {pointDetail && (
          <div className="detail-panel" style={{
            position: 'absolute', top: 10, right: 10,
            background: '#1a1a2eee', border: '1px solid rgba(179,136,255,0.3)', borderRadius: 10,
            padding: '12px 14px', zIndex: 50, minWidth: 200, maxWidth: 260,
            maxHeight: '250px', overflowY: 'auto',
            boxShadow: '0 0 20px rgba(179,136,255,0.15)',
          }}>
            <button onClick={() => setPointDetail(null)} style={{
              position: 'absolute', top: 6, right: 8,
              background: 'rgba(255,255,255,0.06)', border: 'none',
              color: '#bbbbdd', fontSize: 14, cursor: 'pointer',
              width: 22, height: 22, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>x</button>
            <h4 style={{ color: '#b388ff', margin: '0 0 8px', fontFamily: "'Noto Sans KR', sans-serif", fontSize: 14 }}>
              {pointDetail.year}{lang === 'ko' ? '년' : ''} {lang === 'en' ? (MODE_LABELS_EN[mode] || mode) : (MODE_LABELS[mode] || mode)}
            </h4>
            {Object.entries(pointDetail.allDiseases).map(([key, val]) => {
              const color = activeColors[key] || '#bbbbdd';
              const label = activeLabels[key] || key;
              const valStr = isIncidenceMode ? `${val.toLocaleString()}건/년` : `${val.toFixed(1)}%`;
              return (
                <div key={key} style={{
                  display: 'flex', justifyContent: 'space-between', padding: '4px 0',
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                }}>
                  <span style={{ color, fontSize: 12, fontFamily: "'Noto Sans KR', sans-serif" }}>{label}</span>
                  <span style={{ color, fontSize: 12, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>{valStr}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <div style={{
        padding: '4px 24px 10px', fontFamily: "'JetBrains Mono', monospace",
        fontSize: 10, color: '#4a4a6a',
      }}>
        {t('출처: 고혈압학회, 당뇨병학회, 지질동맥경화학회 Fact Sheet 2024, 질병관리청 심뇌혈관 발생통계 2022, KASL NAFLD Fact Sheet 2023', 'Source: KSH, KDA, KSoLA Fact Sheet 2024, KDCA CVD Statistics 2022, KASL NAFLD FS 2023')}
      </div>
    </div>
  );
}

// ── Healthcare Cost Treemap View ─────────────────────────────
function CostTreemapView() {
  const { lang, t } = useLang();
  const [selectedCost, setSelectedCost] = useState(null);
  const w = 900, h = 340;

  // indirect = 간접비 추정 (생산성 손실, 조기사망, 간병, 미인지 환자)
  // ⚠️ 간접비는 한국 실측 데이터가 아닌 추정치. 근거 수준 표기 필수.
  const costData = [
    { id: 'htn', name: '고혈압', cost: 4.5, indirect: 3.5, indirectBasis: '추정 (한국 연구 미발표)',
      basis: '건보 직접 진료비', perPatient: '약 37만원/년', population: '약 1,200만명',
      note: '직접: 건보 청구코드 기준. 간접: 한국 실측 데이터 없음, 해외 비율(직접의 0.5-1배) 적용 추정.', color: '#ffd60a', ref: 'KDCA 만성질환 현황 2025' },
    { id: 'eskd', name: 'ESKD 투석', cost: 3.9, indirect: 2.5, indirectBasis: '추정 (간병비 일부 연구)',
      basis: '건보 직접 진료비', perPatient: '약 3,000만원/년', population: '약 13만명',
      note: '직접: 환자당 3,000만원. 간접: 간병비·생산성 손실, 국내 일부 연구 기반 추정.', color: '#9b59b6', ref: 'KSN ESKD FS 2024' },
    { id: 'dm', name: '당뇨병', cost: 3.2, indirect: 4.8, indirectBasis: '추정 (KDA 연구 일부)',
      basis: '건보 직접 진료비', perPatient: '약 53만원/년', population: '약 600만명',
      note: '직접: 건보 청구. 간접: 약제비 ~1.5조 + 합병증·생산성 ~3.3조 추정. 미인지 25%(~134만명) 미래비용 미반영.', color: '#00d4ff', ref: 'KDCA 2025' },
    { id: 'hf', name: '심부전', cost: 3.2, indirect: 2.0, indirectBasis: '추정 (한국 연구 미발표)',
      basis: '건보 직접 의료비', perPatient: '약 186만원/년', population: '약 132만명',
      note: '직접: 입원 2.1조+외래 0.3조. 간접: 간병·재입원·조기사망, 한국 실측 없음.', color: '#ff6b6b', ref: 'KSHF HF Statistics 2024' },
    { id: 'masld', name: 'MASLD', cost: 7.5, indirect: 10.0, indirectBasis: '⚠️ 근거 약함 (유럽 비율 적용)',
      basis: 'MASLD 초과 의료비', perPatient: '초과 97만원/년 (총 212만 - 대조군 115만)', population: '유병환자 768만명 (2022)',
      note: '212만원 = 매칭 코호트 연구 기반 MASLD 환자 1인당 "총" 의료비(지방간 외 포함). 대조군(성별·연령 1:2 매칭) 115만원 대비 초과 97만원. 768만 × 97만 = 7.5조는 "추정치"(실측 합산 아님). 유병 ~1,650만 중 768만 진료.', color: '#00ff88', ref: 'KASL MASLD FS 2023 (NHIS, 매칭 코호트)' },
  ];

  const sorted = [...costData].sort((a, b) => (b.cost + b.indirect) - (a.cost + a.indirect));
  const maxCost = Math.max(...sorted.map(d => d.cost + d.indirect));

  const barH = 44;
  const gap = 8;
  const labelW = 130;
  const rightInfo = 180;
  const barAreaW = w - labelW - rightInfo - 20;
  const startY = 20;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '12px 24px 4px' }}>
        <h2 style={{ fontFamily: "'Noto Sans KR', sans-serif", fontSize: 18, fontWeight: 800, color: '#e0e0ff', margin: 0 }}>
          {t('질환별 사회경제적 부담','Socioeconomic Burden by Disease')}
        </h2>
        <p style={{ fontFamily: "'Noto Sans KR', sans-serif", fontSize: 11, color: '#bbbbdd', margin: '4px 0 0' }}>
          ■ 진한 색 = 직접 의료비 (건보 진료비)　■ 옅은 색 = 간접비 추정 (생산성 손실·미인지·진행 비용) — 조원/년
        </p>
      </div>
      <div style={{ flex: 1, display: 'flex', position: 'relative', minHeight: 0 }}>
        <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: '100%', display: 'block' }} preserveAspectRatio="xMidYMin meet">
          {sorted.map((d, i) => {
            const y = startY + i * (barH + gap);
            const totalW = ((d.cost + d.indirect) / maxCost) * barAreaW;
            const directW = (d.cost / maxCost) * barAreaW;
            const isSelected = selectedCost?.id === d.id;
            return (
              <g key={d.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedCost(isSelected ? null : d)}>
                <text x={labelW - 8} y={y + barH / 2 - 4} textAnchor="end" dominantBaseline="middle"
                  fill={isSelected ? d.color : '#ccccee'} fontSize={13} fontWeight={700} fontFamily="'Noto Sans KR', sans-serif">
                  {d.name}
                </text>
                <text x={labelW - 8} y={y + barH / 2 + 12} textAnchor="end"
                  fill="#9999bb" fontSize={9} fontFamily="'JetBrains Mono', monospace">
                  {d.basis}
                </text>
                {/* Indirect cost bar — lighter */}
                <rect x={labelW} y={y + 6} width={totalW} height={barH - 12} rx={6}
                  fill={d.color} opacity={0.12}
                  stroke={d.color} strokeWidth={0.5} strokeOpacity={0.2} strokeDasharray="4,3" />
                {/* Direct cost bar — solid */}
                <rect x={labelW} y={y + 6} width={directW} height={barH - 12} rx={6}
                  fill={d.color} opacity={0.5 + (d.cost / maxCost) * 0.4}
                  stroke={isSelected ? '#fff' : 'none'} strokeWidth={isSelected ? 1.5 : 0} />
                {/* Direct label */}
                <text x={labelW + directW - 6} y={y + barH / 2 - 1} textAnchor="end" dominantBaseline="middle"
                  fill="#fff" fontSize={16} fontWeight={800} fontFamily="'JetBrains Mono', monospace">
                  {d.cost}조
                </text>
                {/* Indirect label */}
                {d.indirect > 0 && (
                  <text x={labelW + totalW - 4} y={y + barH / 2 - 1} textAnchor="end" dominantBaseline="middle"
                    fill={d.color} fontSize={11} fontWeight={600} fontFamily="'JetBrains Mono', monospace" opacity={0.6}>
                    +{d.indirect}조
                  </text>
                )}
                <text x={labelW + barAreaW + 14} y={y + barH / 2 - 6}
                  fill="#ccccee" fontSize={11} fontFamily="'JetBrains Mono', monospace">
                  총 {(d.cost + d.indirect).toFixed(1)}조
                </text>
                <text x={labelW + barAreaW + 14} y={y + barH / 2 + 10}
                  fill="#aaaacc" fontSize={10} fontFamily="'Noto Sans KR', sans-serif">
                  {d.population}
                </text>
              </g>
            );
          })}
        </svg>
        {selectedCost && (
          <div style={{
            position: 'absolute', top: 10, right: 10,
            background: '#1a1a2eee', border: `1px solid ${selectedCost.color}44`, borderRadius: 10,
            padding: '14px 16px', zIndex: 50, minWidth: 240, maxWidth: 300, maxHeight: 280, overflowY: 'auto',
          }}>
            <button onClick={() => setSelectedCost(null)} style={{
              position: 'absolute', top: 8, right: 8, background: 'none', border: 'none',
              color: '#aaaacc', fontSize: 14, cursor: 'pointer',
            }}>x</button>
            <h4 style={{ color: selectedCost.color, margin: '0 0 8px', fontSize: 14 }}>{selectedCost.name}</h4>
            {[
              [t('비용 기준','Cost Basis'), selectedCost.basis],
              [t('직접 의료비','Direct Medical Cost'), `${selectedCost.cost}${t('조원','T KRW')}`],
              [t('간접비 추정','Indirect Cost Est.'), `${selectedCost.indirect}${t('조원','T KRW')} (${selectedCost.indirectBasis})`],
              [t('총 사회적 부담','Total Societal Burden'), `${(selectedCost.cost + selectedCost.indirect).toFixed(1)}${t('조원','T KRW')}`],
              [t('환자당 비용','Cost per Patient'), selectedCost.perPatient],
              [t('대상 인구','Target Population'), selectedCost.population],
              [t('비고','Note'), selectedCost.note],
              [t('출처','Source'), selectedCost.ref],
            ].map(([label, val]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,0.06)', gap: 8 }}>
                <span style={{ color: '#bbbbdd', fontSize: 11, flexShrink: 0 }}>{label}</span>
                <span style={{ color: '#e0e0ff', fontSize: 11, textAlign: 'right' }}>{val}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      <div style={{ padding: '4px 24px 8px', fontSize: 10, color: '#4a4a6a', fontFamily: "'Noto Sans KR', sans-serif" }}>
        {t('※ 직접비: 건보 청구코드 기준. 간접비: 한국 실측 데이터 대부분 미발표, 해외 연구 비율 기반 추정. 근거 수준은 질환별 상이. 출처: KDCA 2025, KSHF 2024, KASL 2023, KSN 2024, J Hepatol 2023', '※ Direct: NHI claim codes. Indirect: Mostly unpublished in Korea, estimated from international ratios. Source: KDCA 2025, KSHF 2024, KASL 2023, KSN 2024, J Hepatol 2023')}
      </div>
    </div>
  );
}

// ── Management Comparison View ───────────────────────────────
function ManagementView() {
  const { lang, t } = useLang();
  const [selectedDisease, setSelectedDisease] = useState(null);
  const w = 900, h = 340;

  const diseases = [
    {
      id: 'htn', name: '고혈압', color: '#ffd60a', highlight: false,
      patients: '~1,300만',
      stages: [
        { label: '인지', value: 77 },
        { label: '치료', value: 74 },
        { label: '조절', value: 59 },
      ],
      detail: '고혈압 인지율 77%, 치료율 74%, 조절율 59%. 3차 예방 강화 필요.',
      ref: '대한고혈압학회 Fact Sheet 2024',
    },
    {
      id: 'dm', name: '당뇨', color: '#00d4ff', highlight: true,
      patients: '~530만',
      stages: [
        { label: '인지', value: 75 },
        { label: '치료', value: 71 },
        { label: '조절', value: 32 },
      ],
      extendedCascade: [
        { label: '당뇨 환자', value: 100, sub: '30세 이상' },
        { label: '인지', value: 74.7, sub: 'Awareness' },
        { label: '치료', value: 70.9, sub: 'Treatment' },
        { label: 'HbA1c <6.5%', value: 32.4, sub: 'Glycemic Control' },
        { label: '+BP 조절', value: 19.7, sub: 'BP <140/85' },
        { label: '+LDL 조절', value: 15.9, sub: 'LDL <100' },
        { label: '통합관리', value: 15.9, sub: 'All 3 Targets Met' },
      ],
      youngAdult: [100, 43.3, 34.6, 29.6, 8.0, 9.2, 9.2],
      detail: '당뇨 인지율 75%, 치료율 71%이나 HbA1c<6.5% 조절율 32.4%로 매우 낮음. 통합관리(혈당+혈압+LDL 동시조절) 15.9%.',
      ref: 'KDA Diabetes Fact Sheet 2024',
    },
    {
      id: 'dyslip', name: '이상지질혈증', color: '#b388ff', highlight: false,
      patients: '~1,780만',
      stages: [
        { label: '인지', value: 68 },
        { label: '치료', value: 61 },
        { label: '조절', value: 54 },
      ],
      detail: '이상지질혈증 인지율 68%, 치료율 61%, LDL 조절율 54%. 고위험군 스타틴 처방 확대 필요.',
      ref: '한국지질동맥경화학회 Fact Sheet 2024',
    },
    {
      id: 'ckd', name: 'CKD', color: '#4ecdc4', highlight: false,
      patients: '~357만',
      stages: [
        { label: '인지', value: 6.3 },
        { label: '치료', value: null },
        { label: '조절', value: null },
      ],
      detail: 'CKD 인지율 1.3~6.3%로 극히 낮음. 대부분 투석 직전까지 인지 못함. 조기 선별 시급.',
      ref: '대한신장학회 KORDS 2023',
    },
    {
      id: 'obesity', name: '비만', color: '#ff006e', highlight: false,
      patients: '~1,670만',
      stages: [
        { label: '인지', value: null },
        { label: '치료', value: null },
        { label: '조절', value: null },
      ],
      detail: '비만 관리 캐스케이드 공식 데이터 부재. 인지율 약 55% 추정, 적극 관리 30%, 5% 이상 감량 성공 12%.',
      ref: '대한비만학회 Fact Sheet 2024 (추정)',
    },
    {
      id: 'masld', name: 'MASLD', color: '#00ff88', highlight: false,
      patients: '~768만',
      stages: [
        { label: '인지', value: null },
        { label: '치료', value: null },
        { label: '조절', value: null },
      ],
      detail: 'MASLD 인지율 ~10%. 건강검진에서 지방간 소견 있으나 후속 관리 부재. FIB-4 기반 선별 도입 필요.',
      ref: 'KASL MASLD Fact Sheet 2023',
    },
  ];

  // Layout: mini funnels side by side
  const funnelW = 130;
  const funnelGap = 12;
  const totalFunnelsW = diseases.length * funnelW + (diseases.length - 1) * funnelGap;
  const startX = (w - totalFunnelsW) / 2;
  const funnelTop = 60;
  const funnelH = 200;

  const renderMiniFunnel = (d, idx) => {
    const fx = startX + idx * (funnelW + funnelGap);
    const stages = d.stages;
    const isSelected = selectedDisease?.id === d.id;

    // Build trapezoid stages
    const maxStageW = funnelW - 16;
    const stageH = Math.min(funnelH / stages.length - 4, 55);
    const stageStartY = funnelTop + 32;

    return (
      <g key={d.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedDisease(isSelected ? null : d)}>
        <rect x={fx} y={funnelTop - 10} width={funnelW} height={funnelH + 30} rx={8}
          fill={isSelected ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.01)'}
          stroke={isSelected ? `${d.color}66` : 'rgba(255,255,255,0.03)'} strokeWidth={1} />
        {/* Disease name + patient count */}
        <text x={fx + funnelW / 2} y={funnelTop + 4} textAnchor="middle"
          fill={isSelected ? d.color : '#ccccee'} fontSize={12} fontWeight={700}
          fontFamily="'Noto Sans KR', sans-serif">{d.name}</text>
        {d.patients && (
          <text x={fx + funnelW / 2} y={funnelTop + 18} textAnchor="middle"
            fill="#aaaacc" fontSize={10} fontFamily="'JetBrains Mono', monospace">{d.patients}</text>
        )}
        {d.highlight && <circle cx={fx + funnelW / 2 + 28} cy={funnelTop} r={3} fill={d.color} opacity={0.8} />}
        {/* Trapezoid stages */}
        {stages.map((stage, si) => {
          const val = stage.value ?? 0;
          const nextStage = si < stages.length - 1 ? stages[si + 1] : null;
          const nextVal = nextStage ? (nextStage.value ?? val * 0.7) : val * 0.7;
          const topW = val > 0 ? (val / 100) * maxStageW : maxStageW * 0.15;
          const bottomW = nextVal > 0 ? (nextVal / 100) * maxStageW : maxStageW * 0.1;
          const cy = fx + funnelW / 2;
          const yTop = stageStartY + si * (stageH + 4);
          const yBottom = yTop + stageH;
          const opacity = val > 0 ? (0.35 + (val / 100) * 0.55) : 0.15;

          const path = `M${cy - topW / 2},${yTop} L${cy + topW / 2},${yTop} L${cy + bottomW / 2},${yBottom} L${cy - bottomW / 2},${yBottom} Z`;

          return (
            <g key={si}>
              <path d={path} fill={d.color} opacity={opacity} />
              <path d={path} fill="none" stroke={d.color} strokeWidth={0.5} opacity={0.4} />
              {/* Label */}
              <text x={cy} y={yTop + stageH / 2 - 4} textAnchor="middle"
                fill="#ffffff" fontSize={10} fontWeight={700} fontFamily="'JetBrains Mono', monospace"
                style={{ textShadow: '0 0 6px rgba(0,0,0,0.9)' }}>
                {stage.value == null ? '?' : (val < 10 ? val.toFixed(1) : Math.round(val)) + '%'}
              </text>
              <text x={cy} y={yTop + stageH / 2 + 8} textAnchor="middle"
                fill="rgba(255,255,255,0.5)" fontSize={8} fontFamily="'Noto Sans KR', sans-serif">
                {stage.label}
              </text>
            </g>
          );
        })}
      </g>
    );
  };

  const defaultMgmtInference = {
    title: t('관리 현황 핵심 요약', 'Management Status Key Summary'),
    detail: t(
      '고혈압·당뇨·이상지질혈증은 인지율 68-77%로 비교적 양호하나, 당뇨 조절률(HbA1c<6.5%)은 32%에 불과. CKD 인지율은 6.3%로 극히 낮아 대부분 투석 직전까지 모름. MASLD·비만은 관리 캐스케이드 자체가 부재. 퍼널을 클릭하면 상세 정보를 확인할 수 있습니다.',
      'HTN/DM/dyslipidemia awareness is 68-77%, relatively good, but DM control (HbA1c<6.5%) only 32%. CKD awareness is extremely low at 6.3%. MASLD/obesity lack formal management cascades. Click a funnel for details.'
    ),
    color: '#00d4ff',
  };

  // Detail panel content
  const renderDetail = () => {
    if (!selectedDisease) return (
      <div style={{
        position: 'absolute', right: 16, top: 60, width: 280,
        background: 'rgba(10,10,20,0.96)', border: '1px solid rgba(0,212,255,0.2)',
        borderRadius: 12, padding: 16, backdropFilter: 'blur(12px)',
        maxHeight: 260, overflowY: 'auto',
        boxShadow: '0 0 20px rgba(0,212,255,0.1)',
      }}>
        <h4 style={{ color: '#bbbbdd', margin: '0 0 8px', fontFamily: "'Noto Sans KR', sans-serif", fontSize: 13 }}>
          {defaultMgmtInference.title}
        </h4>
        <p style={{ color: '#bbb', fontSize: 11, lineHeight: 1.7, margin: 0 }}>{defaultMgmtInference.detail}</p>
      </div>
    );
    const d = selectedDisease;
    return (
      <div style={{
        position: 'absolute', right: 16, top: 60, width: 280,
        background: 'rgba(10,10,20,0.96)', border: `1px solid ${d.color}44`,
        borderRadius: 12, padding: 16, backdropFilter: 'blur(12px)',
        animation: 'fadeInUp 0.3s ease-out', maxHeight: 260, overflowY: 'auto',
        boxShadow: `0 0 20px ${d.color}15`,
      }}>
        <button onClick={() => setSelectedDisease(null)} style={{
          position: 'absolute', top: 8, right: 10, background: 'rgba(255,255,255,0.06)',
          border: 'none', color: '#bbbbdd', fontSize: 14, cursor: 'pointer',
          width: 22, height: 22, borderRadius: '50%', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
        }}>x</button>
        <h4 style={{ color: d.color, margin: '0 0 8px', fontFamily: "'Noto Sans KR', sans-serif", fontSize: 14 }}>
          {d.name} {t('관리 현황','Management Status')}
        </h4>
        <p style={{ color: '#bbb', fontSize: 11, lineHeight: 1.7, margin: '0 0 10px' }}>{d.detail}</p>

        {/* Extended cascade for diabetes */}
        {d.extendedCascade && (
          <div style={{ marginTop: 8 }}>
            <p style={{ color: '#6666aa', fontSize: 9, margin: '0 0 6px', fontFamily: "'JetBrains Mono', monospace" }}>
              {t('확장 캐스케이드 (30세+)', 'EXTENDED CASCADE (30+)')}
            </p>
            {d.extendedCascade.map((step, i) => {
              const barW = (step.value / 100) * 200;
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', marginBottom: 3 }}>
                  <span style={{ width: 70, fontSize: 9, color: '#ccccee', fontFamily: "'Noto Sans KR', sans-serif", flexShrink: 0 }}>
                    {step.label}
                  </span>
                  <div style={{ flex: 1, height: 10, background: 'rgba(255,255,255,0.03)', borderRadius: 3, position: 'relative' }}>
                    <div style={{
                      width: barW, height: '100%', borderRadius: 3,
                      background: `linear-gradient(90deg, ${d.color}88, ${d.color}44)`,
                    }} />
                  </div>
                  <span style={{ width: 40, fontSize: 9, color: d.color, textAlign: 'right', fontFamily: "'JetBrains Mono', monospace", flexShrink: 0 }}>
                    {step.value.toFixed(1)}%
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Young adult comparison for diabetes */}
        {d.youngAdult && (
          <div style={{ marginTop: 10 }}>
            <p style={{ color: '#ff006e', fontSize: 9, margin: '0 0 4px', fontFamily: "'JetBrains Mono', monospace" }}>
              19-39 {t('청년층 비교','Young Adult Comparison')}
            </p>
            {d.extendedCascade.map((step, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', marginBottom: 2 }}>
                <span style={{ width: 70, fontSize: 8, color: '#aaaacc', fontFamily: "'Noto Sans KR', sans-serif", flexShrink: 0 }}>
                  {step.label}
                </span>
                <span style={{ fontSize: 9, color: '#ff006e', fontFamily: "'JetBrains Mono', monospace" }}>
                  {d.youngAdult[i].toFixed(1)}%
                </span>
                <span style={{ fontSize: 8, color: '#ff6666', marginLeft: 6, fontFamily: "'JetBrains Mono', monospace" }}>
                  ({(d.youngAdult[i] - step.value) > 0 ? '+' : ''}{(d.youngAdult[i] - step.value).toFixed(1)}%p)
                </span>
              </div>
            ))}
          </div>
        )}

        <p style={{ color: '#4a4a6a', fontSize: 8, margin: '10px 0 0', fontFamily: "'JetBrains Mono', monospace" }}>
          출처: {d.ref}
        </p>
      </div>
    );
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '12px 24px 4px' }}>
        <h2 style={{
          fontFamily: "'Noto Sans KR', sans-serif", fontSize: 18, fontWeight: 800,
          color: '#e0e0ff', margin: 0, textShadow: '0 0 20px rgba(0,212,255,0.3)',
        }}>
          {t('질환별 관리 현황','Disease Management Status')}
          <InfoTip text={t(
            '인지율 = 본인이 해당 질환이 있다고 아는 비율. 치료율 = 진단받은 환자 중 약물/비약물 치료를 받는 비율. 조절률 = 치료 환자 중 목표치를 달성한 비율. 세 지표의 곱이 실질 관리율.',
            'Awareness = knows they have the disease. Treatment = receiving therapy among diagnosed. Control = meeting target among treated. Product of all three = effective management rate.'
          )} />
        </h2>
        <p style={{
          fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#4a4a6a',
          margin: '2px 0 0', letterSpacing: 0.5,
        }}>
          AWARENESS → TREATMENT → CONTROL FUNNELS
        </p>
      </div>
      <div style={{ flex: 1, padding: '0 8px 0', position: 'relative' }}>
        <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: '100%' }}
          preserveAspectRatio="xMidYMin meet">
          <defs>
            <pattern id="mgmtFunnelGrid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#141430" strokeWidth="0.5" opacity="0.3" />
            </pattern>
          </defs>
          <rect width={w} height={h} fill="url(#mgmtFunnelGrid)" />
          {diseases.map((d, i) => renderMiniFunnel(d, i))}
          {/* Instruction */}
          <text x={w / 2} y={h - 8} textAnchor="middle" fill="#4a4a6a" fontSize={9}
            fontFamily="'JetBrains Mono', monospace">
            {t('클릭하여 상세 정보 확인','Click for details')} | Source: KSH 2024, KDA 2024, KSoLA 2024, KSN 2024
          </text>
        </svg>
        {renderDetail()}
      </div>
    </div>
  );
}

// ── Survival Curves View ─────────────────────────────────────
function SurvivalCurvesView() {
  const { lang, t } = useLang();
  const [selectedCurve, setSelectedCurve] = useState(null);
  const [hoveredCurve, setHoveredCurve] = useState(null);
  const w = 900, h = 280;

  const curves = [
    { id: 'hf_all', name: t('심부전(전체)','HF(Total)'), color: '#00d4ff',
      points: [{ t: 0, s: 100 }, { t: 1, s: 91 }, { t: 5, s: 79 }, { t: 10, s: 66 }, { t: 15, s: 54 }],
      detail: t('심부전 전체 환자 생존율. 1년 91%, 5년 79%, 10년 66%, 15년 54%. 출처: KSHF HF Statistics 2024 Update (NHIS 2002-2020)','HF total survival. 1yr 91%, 5yr 79%, 10yr 66%, 15yr 54%. Source: KSHF 2024 (NHIS 2002-2020)') },
    { id: 'hf_hosp', name: t('심부전(입원)','HF(Hosp)'), color: '#ff006e',
      points: [{ t: 0, s: 100 }, { t: 1, s: 84 }, { t: 5, s: 66 }, { t: 10, s: 48 }, { t: 15, s: 34 }],
      detail: t('심부전 입원 환자. 1년 84%, 5년 66%, 10년 48%, 15년 34%. 외래 대비 예후 불량. 입원 사망률 16%. 출처: KSHF 2024','HF hospitalized. 1yr 84%, 5yr 66%, 10yr 48%, 15yr 34%. Worse vs outpatient. In-hosp mortality 16%. Source: KSHF 2024') },
    { id: 'hf_out', name: t('심부전(외래)','HF(Outpt)'), color: '#00ff88',
      points: [{ t: 0, s: 100 }, { t: 1, s: 96 }, { t: 5, s: 88 }, { t: 10, s: 79 }, { t: 15, s: 71 }],
      detail: t('심부전 외래 환자. 1년 96%, 5년 88%, 10년 79%, 15년 71%. 조기 진단·관리가 생존 개선의 핵심. 출처: KSHF 2024','HF outpatient. 1yr 96%, 5yr 88%, 10yr 79%, 15yr 71%. Early dx key to survival. Source: KSHF 2024') },
    { id: 'lc', name: t('간경변','Cirrhosis'), color: '#ffd60a',
      points: [{ t: 0, s: 100 }, { t: 1, s: 85 }, { t: 3, s: 65 }, { t: 5, s: 50 }, { t: 10, s: 30 }, { t: 15, s: 18 }],
      detail: t('간경변 5년 생존율 ~50%. MASH 기인 간경변 증가. 비대상성 전환 시 예후 급격 악화. 출처: KASL NAFLD FS 2023','Cirrhosis 5yr survival ~50%. MASH-driven LC increasing. Decompensation worsens prognosis sharply. Source: KASL 2023') },
    { id: 'hcc', name: t('간세포암','HCC'), color: '#b388ff',
      points: [{ t: 0, s: 100 }, { t: 1, s: 70 }, { t: 3, s: 48 }, { t: 5, s: 38 }, { t: 10, s: 22 }, { t: 15, s: 14 }],
      detail: t('HCC 5년 생존율 ~38%. 간경변 배경 HCC 예후 더 불량. 조기 발견(초음파+AFP) 중요. 출처: 국가암등록사업','HCC 5yr survival ~38%. Worse with cirrhosis background. Early detection (US+AFP) crucial. Source: National Cancer Registry') },
  ];

  const margin = { top: 50, left: 70, right: 30, bottom: 40 };
  const plotW = w - margin.left - margin.right;
  const plotH = h - margin.top - margin.bottom;
  const toX = (t) => margin.left + (t / 15) * plotW;
  const toY = (s) => margin.top + ((100 - s) / 100) * plotH;

  const buildPath = (points) => {
    let d = '';
    for (let i = 0; i < points.length; i++) {
      const x = toX(points[i].t);
      const y = toY(points[i].s);
      if (i === 0) { d += `M${x},${y}`; }
      else {
        const prevY = toY(points[i - 1].s);
        d += ` L${x},${prevY} L${x},${y}`;
      }
    }
    return d;
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '12px 24px 4px' }}>
        <h2 style={{ fontFamily: "'Noto Sans KR', sans-serif", fontSize: 18, fontWeight: 800, color: '#e0e0ff', margin: 0 }}>
          {t('질환별 생존 곡선','Disease Survival Curves')}
        </h2>
        <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#4a4a6a', margin: '2px 0 0' }}>
          KAPLAN-MEIER STYLE SURVIVAL CURVES
        </p>
      </div>
      <div style={{ flex: 1, display: 'flex', position: 'relative' }}>
        <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: '100%' }} preserveAspectRatio="xMidYMin meet">
          <defs>
            <pattern id="survGrid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#141430" strokeWidth="0.5" opacity="0.3" />
            </pattern>
          </defs>
          <rect width={w} height={h} fill="url(#survGrid)" />
          {[0, 25, 50, 75, 100].map(s => (
            <g key={s}>
              <line x1={margin.left} y1={toY(s)} x2={w - margin.right} y2={toY(s)}
                stroke="rgba(255,255,255,0.06)" strokeWidth={1} strokeDasharray={s === 50 ? '4,4' : 'none'} />
              <text x={margin.left - 8} y={toY(s) + 4} textAnchor="end"
                fill="#6666aa" fontSize={10} fontFamily="'JetBrains Mono', monospace">{s}%</text>
            </g>
          ))}
          {[0, 1, 3, 5, 10, 15].map(t => (
            <g key={t}>
              <line x1={toX(t)} y1={margin.top} x2={toX(t)} y2={h - margin.bottom}
                stroke="rgba(255,255,255,0.04)" strokeWidth={1} />
              <text x={toX(t)} y={h - margin.bottom + 16} textAnchor="middle"
                fill="#6666aa" fontSize={10} fontFamily="'JetBrains Mono', monospace">{t}yr</text>
            </g>
          ))}
          <text x={w / 2} y={h - 6} textAnchor="middle" fill="#bbbbdd" fontSize={11} fontFamily="'Noto Sans KR', sans-serif">
            {t('추적 기간 (년)','Follow-up Period (years)')}
          </text>
          <text x={16} y={h / 2} textAnchor="middle" fill="#bbbbdd" fontSize={11}
            fontFamily="'Noto Sans KR', sans-serif" transform={`rotate(-90, 16, ${h / 2})`}>
            {t('생존율 (%)','Survival Rate (%)')}
          </text>
          {/* Compact legend row at top */}
          {(() => {
            const legendY = 14;
            const legendStartX = margin.left;
            let offsetX = 0;
            return curves.map((curve, ci) => {
              const x = legendStartX + ci * 150;
              const isActive = hoveredCurve === curve.id || selectedCurve?.id === curve.id;
              const isOther = (hoveredCurve || selectedCurve) && !isActive;
              return (
                <g key={`legend-${curve.id}`} style={{ cursor: 'pointer' }}
                  onMouseEnter={() => setHoveredCurve(curve.id)}
                  onMouseLeave={() => setHoveredCurve(null)}
                  onClick={() => setSelectedCurve(selectedCurve?.id === curve.id ? null : curve)}
                  opacity={isOther ? 0.3 : 1}>
                  <line x1={x} y1={legendY} x2={x + 16} y2={legendY} stroke={curve.color} strokeWidth={2} />
                  <circle cx={x + 8} cy={legendY} r={2.5} fill={curve.color} />
                  <text x={x + 20} y={legendY + 3.5} fill={curve.color} fontSize={9} fontWeight={isActive ? 700 : 500}
                    fontFamily="'Noto Sans KR', sans-serif">{curve.name}</text>
                </g>
              );
            });
          })()}
          {curves.map(curve => {
            const isActive = hoveredCurve === curve.id || selectedCurve?.id === curve.id;
            const isOther = (hoveredCurve || selectedCurve) && !isActive;
            return (
              <g key={curve.id} style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHoveredCurve(curve.id)}
                onMouseLeave={() => setHoveredCurve(null)}
                onClick={() => setSelectedCurve(selectedCurve?.id === curve.id ? null : curve)}>
                <path d={buildPath(curve.points)} fill="none" stroke={curve.color}
                  strokeWidth={isActive ? 3 : 2} opacity={isOther ? 0.2 : 0.9} />
                {curve.points.map((p, pi) => (
                  <g key={pi}>
                    <circle cx={toX(p.t)} cy={toY(p.s)} r={isActive ? 4 : 2.5}
                      fill={curve.color} opacity={isOther ? 0.2 : 0.9}
                      stroke={isActive ? '#fff' : 'none'} strokeWidth={1} strokeOpacity={0.3} />
                    {/* Show value at 5yr and 10yr points when active */}
                    {isActive && (p.t === 5 || p.t === 10) && (
                      <text x={toX(p.t)} y={toY(p.s) - 8} textAnchor="middle"
                        fill={curve.color} fontSize={9} fontWeight={700}
                        fontFamily="'JetBrains Mono'" opacity={0.9}>
                        {p.s}%
                      </text>
                    )}
                  </g>
                ))}
                {/* End-of-line value only (no name to avoid clipping) */}
                {(() => {
                  const last = curve.points[curve.points.length - 1];
                  return (
                    <text x={toX(last.t) + 6} y={toY(last.s) + 4}
                      fill={curve.color} fontSize={9} fontWeight={600}
                      fontFamily="'JetBrains Mono', monospace" opacity={isOther ? 0.2 : 0.9}>
                      {last.s}%
                    </text>
                  );
                })()}
              </g>
            );
          })}
        </svg>
        {selectedCurve && (
          <div style={{
            position: 'absolute', right: 24, top: 24, width: 280,
            background: 'rgba(10,10,20,0.95)', border: `1px solid ${selectedCurve.color}44`,
            borderRadius: 12, padding: 16, backdropFilter: 'blur(12px)',
            animation: 'fadeInUp 0.3s ease-out',
          }}>
            <button onClick={() => setSelectedCurve(null)} style={{
              position: 'absolute', top: 8, right: 8, background: 'none', border: 'none',
              color: '#aaaacc', fontSize: 14, cursor: 'pointer',
            }}>x</button>
            <h4 style={{ color: selectedCurve.color, margin: '0 0 8px', fontSize: 14 }}>{selectedCurve.name}</h4>
            <div style={{ marginBottom: 8 }}>
              {selectedCurve.points.filter(p => p.t > 0).map(p => (
                <div key={p.t} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <span style={{ color: '#bbbbdd', fontSize: 11 }}>{p.t}{t('년 생존율','yr Survival')}</span>
                  <span style={{ color: '#e0e0ff', fontSize: 12, fontWeight: 700, fontFamily: "'JetBrains Mono'" }}>{p.s}%</span>
                </div>
              ))}
            </div>
            <p style={{ color: '#bbb', fontSize: 11, lineHeight: 1.6, margin: 0 }}>{selectedCurve.detail}</p>
          </div>
        )}
      </div>
      <div style={{ padding: '4px 24px 10px', fontSize: 10, color: '#4a4a6a', fontFamily: "'JetBrains Mono', monospace" }}>
        {t('출처: KSHF HF Statistics 2024, KASL MASLD FS 2023, 국가암등록통계 2022', 'Source: KSHF HF Statistics 2024, KASL MASLD FS 2023, National Cancer Registry 2022')}
      </div>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────
export default function DiseaseNetwork() {
  const { lang, t } = useLang();
  const [selectedId, setSelectedId] = useState(null);
  const [hoveredId, setHoveredId] = useState(null);
  const [viewMode, setViewMode] = useState('network');

  const selectedDisease = selectedId ? DISEASES[selectedId] : null;

  return (
    <>
      <style>{STYLES}</style>
      <div style={{
        height: 'calc(100vh - 56px)',
        marginTop: '56px',
        display: 'flex',
        flexDirection: 'column',
        background: '#0a0a0f',
        overflow: 'hidden',
        position: 'relative',
      }}>
        {/* ── View Mode Tabs ──────────────── */}
        <div style={{
          display: 'flex', gap: 8, padding: '10px 24px 6px',
          borderBottom: '1px solid rgba(255,255,255,0.04)',
          flexShrink: 0,
        }}>
          {VIEW_MODES.map(vm => (
            <button
              key={vm.id}
              className={`view-tab ${viewMode === vm.id ? 'active' : ''}`}
              onClick={() => {
                setViewMode(vm.id);
                if (vm.id !== 'network') {
                  setSelectedId(null);
                  setHoveredId(null);
                }
              }}
            >
              {lang === 'en' ? vm.label_en : vm.label_ko}
            </button>
          ))}
        </div>

        {/* ── View Content ────────────────── */}
        <div key={viewMode} style={{ flex: 1, overflow: 'visible', minHeight: 0 }}>
          {viewMode === 'network' && (
            <NetworkView
              selectedId={selectedId}
              setSelectedId={setSelectedId}
              hoveredId={hoveredId}
              setHoveredId={setHoveredId}
              selectedDisease={selectedDisease}
            />
          )}
          {viewMode === 'masld' && <MASLDHeatmapView />}
          {viewMode === 'trends' && <TrendsView />}
          {viewMode === 'orbital' && (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <div style={{ flex: 1, minHeight: 0 }}><DiseaseOrbital /></div>
              <div style={{
                padding: '4px 12px',
                fontSize: 10,
                color: '#4a4a6a',
                fontFamily: "'JetBrains Mono', monospace",
                borderTop: '1px solid rgba(255,255,255,0.04)',
                flexShrink: 0,
              }}>
                {t('출처: 각 학회 팩트시트 2022-2025','Source: Medical Society Fact Sheets 2022-2025')}
              </div>
            </div>
          )}
          {viewMode === 'sankey' && <DiseaseSankey />}
          {viewMode === 'upset' && (
            <div>
              <h3 style={{ color: '#ccd6f6', fontSize: 18, fontWeight: 600, marginBottom: 4, textAlign: 'center' }}>
                {t('MASLD 동반질환 교차 분석','MASLD Comorbidity Cross-Analysis')}
                <InfoTip text={t(
                  'UpSet Plot — 다수 질환의 동반이환 조합별 빈도를 시각화. 하단 점 행렬은 동반 질환 조합, 상단 막대는 해당 조합의 환자 비율. 벤 다이어그램의 확장형.',
                  'UpSet Plot — visualizes comorbidity combination frequencies. Bottom dot matrix shows disease combinations, top bars show patient proportion per combination. Extended Venn diagram.'
                )} />
              </h3>
              <p style={{ color: '#8892b0', fontSize: 13, textAlign: 'center', marginBottom: 16 }}>
                {t('2012 vs 2022 동반이환 패턴 변화','2012 vs 2022 Comorbidity Pattern Change')}
              </p>
              <UpSetPlot />
              <p style={{ color: '#556', fontSize: 10, textAlign: 'right', marginTop: 8 }}>
                {t('출처: KASL MASLD Fact Sheet 2023, NHIS 2012-2022','Source: KASL MASLD Fact Sheet 2023, NHIS 2012-2022')}
              </p>
            </div>
          )}
          {viewMode === 'cost' && <CostTreemapView />}
          {viewMode === 'management' && <ManagementView />}
          {viewMode === 'survival' && <SurvivalCurvesView />}
        </div>
      </div>
    </>
  );
}
