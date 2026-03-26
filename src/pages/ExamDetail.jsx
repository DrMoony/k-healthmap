import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { FULL_DATA } from '../data/full_data';
import { useLang } from '../i18n';
import { T } from '../translations';

const EXAM_KEYS = [
  'bmi','waist','sight','bp_systolic','bp_diastolic','urine_protein',
  'hemoglobin','fasting_glucose','total_cholesterol','hdl','triglyceride',
  'ldl','creatinine','gfr','ast','alt','ggt','chest_xray',
];

const PROVINCES = ['서울','부산','대구','인천','광주','대전','울산','세종','경기','강원','충북','충남','전북','전남','경북','경남','제주'];
const AGE_GROUPS = ['≤19','20-24','25-29','30-34','35-39','40-44','45-49','50-54','55-59','60-64','65-69','70-74','75-79','80-84','85+'];

const GENDER_OPTIONS = [
  { key: 'total', label_ko: '전체', label_en: 'Total' },
  { key: 'male', label_ko: '남', label_en: 'M' },
  { key: 'female', label_ko: '여', label_en: 'F' },
];

const ABNORMAL_INDICES = {
  bmi: [0, 2, 3, 4],
  waist: [5, 6, 7, 8],
  sight: [0, 1],
  bp_systolic: [5, 6],
  bp_diastolic: [4, 5, 6, 7, 8],
  urine_protein: [2, 3, 4, 5],
  hemoglobin: [0, 1, 2],
  fasting_glucose: [1, 2, 3, 4, 5, 6, 7],
  total_cholesterol: [4, 5, 6, 7, 8],
  hdl: [0, 1],
  triglyceride: [3, 4, 5, 6, 7],
  ldl: [3, 4, 5],
  creatinine: [4, 5, 6, 7],
  gfr: [0, 1, 2, 3],
  ast: [2, 3, 4, 5, 6, 7, 8],
  alt: [1, 2, 3, 4, 5, 6, 7, 8, 9],
  ggt: [3, 4, 5, 6, 7],
  chest_xray: [1],
};

const AGE_CLINICAL_NOTES_KO = {
  '≤19': '소아/청소년: 성장기 기준치 별도 적용, 비만 조기선별 중요',
  '20-24': '20-24세: 건강행태 형성기, 음주·흡연 시작 영향',
  '25-29': '25-29세: 직장인 초기, 신체활동 감소 시작',
  '30-34': '30-34세: 대사증후군 위험인자 축적 시작',
  '35-39': '35-39세: 고혈압·이상지질혈증 유병률 증가 시작',
  '40-44': '40-44세: 비만 유병률이 정점에 근접, 고혈압·당뇨 동반율 급증',
  '45-49': '45-49세: 심뇌혈관 위험도 급상승, 국가건강검진 강화 대상',
  '50-54': '50-54세: 대사질환 유병률 정점, 합병증 관리 필요',
  '55-59': '55-59세: 만성질환 다중이환 증가, GFR 감소 주의',
  '60-64': '60-64세: 노화 관련 지표 변화 가속, 근감소증 동반',
  '65-69': '65-69세: 노인성 질환 전환기, 다약제 복용 증가',
  '70-74': '70-74세: 신기능·간기능 저하 가속, 기준치 재고 필요',
  '75-79': '75-79세: 허약(frailty) 동반율 급증, 검진 해석 주의',
  '80-84': '80-84세: 초고령 특성 반영 필요, 과잉진단 우려',
  '85+': '85+세: 기대여명 고려한 검진 해석, 기능 중심 평가',
};
const AGE_CLINICAL_NOTES_EN = {
  '≤19': 'Pediatric/Adolescent: Separate growth-phase criteria apply, early obesity screening important',
  '20-24': '20-24: Health behavior formation period, impact of alcohol/smoking initiation',
  '25-29': '25-29: Early career, physical activity decline begins',
  '30-34': '30-34: Metabolic syndrome risk factors start accumulating',
  '35-39': '35-39: Hypertension/dyslipidemia prevalence starts rising',
  '40-44': '40-44: Obesity prevalence nearing peak, HTN/DM comorbidity surging',
  '45-49': '45-49: Cardiovascular risk sharply rising, enhanced national screening target',
  '50-54': '50-54: Metabolic disease prevalence at peak, complication management needed',
  '55-59': '55-59: Chronic disease multimorbidity increasing, watch GFR decline',
  '60-64': '60-64: Aging-related marker changes accelerating, sarcopenia co-occurrence',
  '65-69': '65-69: Geriatric disease transition period, polypharmacy increasing',
  '70-74': '70-74: Renal/hepatic function decline accelerating, criteria reassessment needed',
  '75-79': '75-79: Frailty comorbidity surging, screening interpretation caution',
  '80-84': '80-84: Very elderly characteristics to reflect, overdiagnosis concern',
  '85+': '85+: Screening interpretation considering life expectancy, function-focused assessment',
};
// AGE_CLINICAL_NOTES resolved dynamically with lang

// ─── Disease Correlation Data ────────────────────────────────────────────────
const EXAM_DISEASE_LINKS = {
  bmi: [
    { disease: '비만', prevalence: '38.4%', risk: 'BMI \u226525 기준 비만 진단', color: '#ff006e' },
    { disease: '당뇨', prevalence: '15.5%', risk: '비만 시 당뇨 위험 2.5배', color: '#00d4ff' },
    { disease: '고혈압', prevalence: '30%', risk: '비만 시 고혈압 위험 1.9배', color: '#ffd60a' },
    { disease: 'NAFLD', prevalence: '38%', risk: '비만의 90%에서 지방간 동반', color: '#00ff88' },
  ],
  fasting_glucose: [
    { disease: '당뇨', prevalence: '15.5%', risk: '공복혈당 \u2265126 당뇨 진단', color: '#00d4ff' },
    { disease: '전당뇨', prevalence: '41.1%', risk: '100-125 전당뇨, 연 5-10% 당뇨 전환', color: '#ffd60a' },
    { disease: 'CKD', prevalence: '8.2%', risk: '당뇨병성 신증 ESRD 1위 원인', color: '#4ecdc4' },
  ],
  bp_systolic: [
    { disease: '고혈압', prevalence: '30%', risk: '수축기 \u2265140 고혈압 진단', color: '#ffd60a' },
    { disease: '뇌졸중', prevalence: '215.7/10만', risk: '고혈압 시 뇌졸중 4배', color: '#ff6b6b' },
    { disease: '심근경색', prevalence: '68.2/10만', risk: '고혈압 시 MI 2배', color: '#ff006e' },
  ],
  bp_diastolic: [
    { disease: '고혈압', prevalence: '30%', risk: '이완기 \u226590 고혈압 진단', color: '#ffd60a' },
  ],
  total_cholesterol: [
    { disease: '이상지질혈증', prevalence: '40.9%', risk: '총콜레스테롤 \u2265240 고콜레스테롤혈증', color: '#b388ff' },
    { disease: '심혈관질환', prevalence: '사망원인 2위', risk: 'LDL 상승 시 죽상경화 촉진', color: '#ff6b6b' },
  ],
  hdl: [
    { disease: '이상지질혈증', prevalence: '40.9%', risk: 'HDL <40(남)/<50(여) 시 심혈관 위험\u2191', color: '#b388ff' },
  ],
  triglyceride: [
    { disease: '이상지질혈증', prevalence: '40.9%', risk: 'TG \u2265150 고중성지방혈증', color: '#b388ff' },
    { disease: 'NAFLD', prevalence: '38%', risk: '고TG가 간 지방 축적 촉진', color: '#00ff88' },
  ],
  ldl: [
    { disease: '이상지질혈증', prevalence: '40.9%', risk: 'LDL \u2265160 고LDL콜레스테롤혈증', color: '#b388ff' },
    { disease: '심근경색', prevalence: '68.2/10만', risk: 'LDL이 죽상경화의 핵심 인자', color: '#ff006e' },
  ],
  creatinine: [
    { disease: 'CKD', prevalence: '8.2%', risk: '크레아티닌 상승 시 신기능 저하 의심', color: '#4ecdc4' },
  ],
  gfr: [
    { disease: 'CKD', prevalence: '8.2%', risk: 'GFR <60 CKD 3기 이상, 인지율 1.3-6.3%', color: '#4ecdc4' },
    { disease: '심혈관질환', prevalence: '사망원인 2위', risk: 'CKD 3기+ 심혈관 사망 2-4배', color: '#ff6b6b' },
  ],
  ast: [
    { disease: 'NAFLD', prevalence: '38%', risk: 'AST 상승 시 간세포 손상 의심', color: '#00ff88' },
    { disease: '간경변', prevalence: '간암 34.2/10만', risk: 'AST/ALT 비율로 섬유화 평가', color: '#ff8c00' },
  ],
  alt: [
    { disease: 'NAFLD', prevalence: '38%', risk: 'ALT가 간 특이적 효소, NAFLD 선별지표', color: '#00ff88' },
  ],
  ggt: [
    { disease: 'NAFLD', prevalence: '38%', risk: 'GGT 상승 시 담도/간 질환 의심', color: '#00ff88' },
    { disease: '음주성 간질환', prevalence: '-', risk: 'GGT는 알코올 남용의 민감한 지표', color: '#845ef7' },
  ],
  hemoglobin: [
    { disease: '빈혈', prevalence: '-', risk: 'Hb <12(여)/<13(남) 빈혈 진단', color: '#ff6b6b' },
    { disease: 'CKD', prevalence: '8.2%', risk: '신성 빈혈 \u2014 CKD 진행의 지표', color: '#4ecdc4' },
  ],
  chest_xray: [
    { disease: '폐결핵', prevalence: '-', risk: '흉부X선 이상 시 결핵/폐질환 의심', color: '#8888aa' },
  ],
  waist: [
    { disease: '복부비만', prevalence: '24.5%', risk: '남 \u226590cm, 여 \u226585cm 복부비만', color: '#ff006e' },
    { disease: '대사증후군', prevalence: '~30%', risk: '복부비만이 대사증후군 핵심 요소', color: '#ffd60a' },
  ],
  sight: [
    { disease: '당뇨망막병증', prevalence: '-', risk: '시력 저하가 당뇨 합병증 의심 단서', color: '#00d4ff' },
  ],
  urine_protein: [
    { disease: 'CKD', prevalence: '8.2%', risk: '단백뇨 양성 시 신질환 의심, CKD 선별', color: '#4ecdc4' },
    { disease: '당뇨병성 신증', prevalence: '-', risk: '미세알부민뇨가 조기 DKD 지표', color: '#00d4ff' },
  ],
};

// ─── Theme Colors ────────────────────────────────────────────────────────────
const NEON = {
  cyan: '#00d4ff',
  magenta: '#ff006e',
  gold: '#ffd60a',
  green: '#00ff88',
  bg: '#0a0a0f',
  bgPanel: '#1a1a2e',
  bgPanelEnd: '#12121a',
  dimText: '#555570',
  labelText: '#8888aa',
  bodyText: '#e8e8f0',
};

// Normal categories get dim blue/gray, abnormal get bright neon
const NORMAL_COLORS = [
  '#2a3a5c', '#334466', '#2e3d55', '#394d6b', '#2b3f5a',
  '#3a4d66', '#304560', '#3d5070', '#354a64', '#2f4058',
  '#36496a', '#3b4e6e', '#324762', '#384c68', '#2d3e56',
];
const ABNORMAL_COLORS = [
  '#ff006e', '#ff4444', '#ff6e40', '#e040fb', '#ff8c00',
  '#ff006e', '#ff4444', '#ff6e40', '#e040fb', '#ff8c00',
];

function getCategoryColor(ci, isAbnormal, abnormalIndices) {
  if (isAbnormal) {
    const abnIdx = abnormalIndices.indexOf(ci);
    return ABNORMAL_COLORS[abnIdx % ABNORMAL_COLORS.length];
  }
  return NORMAL_COLORS[ci % NORMAL_COLORS.length];
}

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function glowStyle(color) {
  return { color, textShadow: `0 0 8px ${hexToRgba(color, 0.4)}` };
}

// ─── Gradient color function ────────────────────────────────────────────────
function abnormalColor(value, min, max) {
  const t = max === min ? 0.5 : (value - min) / (max - min);
  if (t < 0.5) {
    // blue to yellow (color-blind safe)
    const s = t * 2;
    return `rgb(${Math.round(69 + s * 186)}, ${Math.round(117 + s * 138)}, ${Math.round(180 - s * 20)})`;
  } else {
    // yellow to red (color-blind safe)
    const s = (t - 0.5) * 2;
    return `rgb(${Math.round(255)}, ${Math.round(255 - s * 187)}, ${Math.round(160 - s * 160)})`;
  }
}

// ─── Compute abnormality rate ────────────────────────────────────────────────
function getAbnormalRate(vals, abnormalIndices) {
  if (!vals || !abnormalIndices.length) return 0;
  return abnormalIndices.reduce((s, idx) => s + (vals[idx] || 0), 0);
}

function getNationalAvg(dataObj, gender, abnormalIndices) {
  if (!dataObj) return 0;
  const keys = Object.keys(dataObj);
  let sum = 0, count = 0;
  keys.forEach(k => {
    const vals = dataObj[k]?.[gender];
    if (vals) {
      sum += getAbnormalRate(vals, abnormalIndices);
      count++;
    }
  });
  return count ? sum / count : 0;
}

// ─── Sort options ────────────────────────────────────────────────────────────
const SORT_OPTIONS = [
  { key: 'rate', label_ko: '이상치율순', label_en: 'By Rate' },
  { key: 'alpha', label_ko: '가나다순', label_en: 'Alphabetical' },
  { key: 'diff', label_ko: '전국대비순', label_en: 'vs National' },
];

function SortToggle({ value, onChange }) {
  const { lang } = useLang();
  return (
    <div style={{ display: 'flex', gap: 3 }}>
      {SORT_OPTIONS.map(o => (
        <button
          key={o.key}
          onClick={() => onChange(o.key)}
          style={{
            background: value === o.key ? hexToRgba(NEON.gold, 0.12) : 'transparent',
            border: `1px solid ${value === o.key ? hexToRgba(NEON.gold, 0.4) : 'rgba(255,255,255,0.06)'}`,
            borderRadius: 5,
            padding: '2px 7px',
            color: value === o.key ? NEON.gold : NEON.dimText,
            fontSize: 11,
            fontWeight: value === o.key ? 600 : 400,
            cursor: 'pointer',
            fontFamily: 'Noto Sans KR',
            transition: 'all 0.2s',
          }}
        >
          {lang === 'en' ? o.label_en : o.label_ko}
        </button>
      ))}
    </div>
  );
}

// ─── Horizontal Abnormality Bar Chart (Canvas 2D) ────────────────────────────
function AbnormalBarChart({ labels, dataObj, gender, abnormalIndices, nationalAvg, height = 300, sortMode = 'rate', onBarClick }) {
  const { lang } = useLang();
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [canvasWidth, setCanvasWidth] = useState(600);
  const [canvasHeight, setCanvasHeight] = useState(400);
  const [tooltip, setTooltip] = useState(null);

  useEffect(() => {
    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        setCanvasWidth(Math.floor(entry.contentRect.width));
        setCanvasHeight(Math.floor(entry.contentRect.height));
      }
    });
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // Compute sorted data
  const sortedData = useMemo(() => {
    const data = labels.map(label => ({
      label,
      rate: getAbnormalRate(dataObj[label]?.[gender] || [], abnormalIndices),
      diff: getAbnormalRate(dataObj[label]?.[gender] || [], abnormalIndices) - nationalAvg,
    }));
    if (sortMode === 'alpha') {
      return data.sort((a, b) => a.label.localeCompare(b.label, 'ko'));
    } else if (sortMode === 'diff') {
      return data.sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));
    }
    return data.sort((a, b) => b.rate - a.rate);
  }, [labels, dataObj, gender, abnormalIndices, sortMode, nationalAvg]);

  const maxRate = useMemo(() => Math.max(...sortedData.map(d => d.rate), nationalAvg, 1), [sortedData, nationalAvg]);
  const minRate = useMemo(() => Math.min(...sortedData.map(d => d.rate), 0), [sortedData]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const w = canvasWidth;
    const h = Math.max(canvasHeight, 200);
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);

    const ml = 52, mr = 40, mt = 8, mb = 8;
    const cw = w - ml - mr;
    const ch = h - mt - mb;
    const n = sortedData.length;
    const barH = Math.max(6, Math.min(18, (ch / n) * 0.65));
    const rowH = ch / n;
    const scale = cw / (maxRate * 1.15);

    // Grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 1;
    ctx.font = '11px JetBrains Mono';
    ctx.fillStyle = NEON.dimText;
    ctx.textAlign = 'center';
    const step = maxRate > 50 ? 20 : maxRate > 20 ? 10 : 5;
    for (let v = 0; v <= maxRate * 1.1; v += step) {
      const x = ml + v * scale;
      if (x > w - mr) break;
      ctx.beginPath();
      ctx.moveTo(x, mt);
      ctx.lineTo(x, mt + ch);
      ctx.stroke();
      ctx.fillText(v + '%', x, mt + ch + mb - 1);
    }

    // National average dashed line
    const avgX = ml + nationalAvg * scale;
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = NEON.gold;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(avgX, mt);
    ctx.lineTo(avgX, mt + ch);
    ctx.stroke();
    ctx.setLineDash([]);
    // Label
    ctx.fillStyle = NEON.gold;
    ctx.font = '11px JetBrains Mono';
    ctx.textAlign = 'center';
    ctx.fillText((lang === 'ko' ? '전국 ' : 'Nat\'l ') + nationalAvg.toFixed(1) + '%', avgX, mt - 1);

    // Bars with gradient colors
    sortedData.forEach((d, i) => {
      const y = mt + i * rowH + (rowH - barH) / 2;
      const bw = d.rate * scale;

      // Background track
      ctx.fillStyle = 'rgba(255,255,255,0.02)';
      ctx.beginPath();
      ctx.roundRect(ml, y, cw, barH, 3);
      ctx.fill();

      // Bar with continuous gradient color
      if (bw > 2) {
        const barColor = abnormalColor(d.rate, minRate, maxRate);
        const grad = ctx.createLinearGradient(ml, 0, ml + bw, 0);
        const rgbMatch = barColor.match(/rgb\((\d+),(\d+),(\d+)\)/);
        const [, rr, gg, bb] = rgbMatch || [0, 200, 200, 200];
        grad.addColorStop(0, `rgba(${rr},${gg},${bb},0.5)`);
        grad.addColorStop(1, barColor);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(ml, y, bw, barH, 3);
        ctx.fill();

        // Glow for high values
        if (d.rate > nationalAvg) {
          ctx.shadowColor = barColor;
          ctx.shadowBlur = 6;
          ctx.fillStyle = 'transparent';
          ctx.beginPath();
          ctx.roundRect(ml, y, bw, barH, 3);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }

      // Value text at end of bar
      const textColor = abnormalColor(d.rate, minRate, maxRate);
      ctx.fillStyle = textColor;
      ctx.font = '11px JetBrains Mono';
      ctx.textAlign = 'left';
      ctx.fillText(d.rate.toFixed(1) + '%', ml + bw + 4, y + barH / 2 + 3.5);

      // Label on left
      ctx.fillStyle = NEON.labelText;
      ctx.font = '11px Noto Sans KR';
      ctx.textAlign = 'right';
      const displayLabel = lang === 'en' ? ({'서울':'Seoul','부산':'Busan','대구':'Daegu','인천':'Incheon','광주':'Gwangju','대전':'Daejeon','울산':'Ulsan','세종':'Sejong','경기':'Gyeonggi','강원':'Gangwon','충북':'Chungbuk','충남':'Chungnam','전북':'Jeonbuk','전남':'Jeonnam','경북':'Gyeongbuk','경남':'Gyeongnam','제주':'Jeju'}[d.label] || d.label) : d.label;
      ctx.fillText(displayLabel, ml - 6, y + barH / 2 + 3.5);
    });
  }, [sortedData, canvasWidth, canvasHeight, maxRate, minRate, nationalAvg]);

  useEffect(() => { draw(); }, [draw]);

  const getIdxFromY = useCallback((my) => {
    const mt2 = 8, mb2 = 8;
    const ch2 = canvasHeight - mt2 - mb2;
    const rowH2 = ch2 / sortedData.length;
    return Math.floor((my - mt2) / rowH2);
  }, [sortedData.length, canvasHeight]);

  const handleMouseMove = useCallback((e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const my = e.clientY - rect.top;
    const idx = getIdxFromY(my);
    if (idx < 0 || idx >= sortedData.length) { setTooltip(null); return; }
    const d = sortedData[idx];
    setTooltip({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      label: d.label,
      rate: d.rate,
      diff: d.rate - nationalAvg,
    });
  }, [sortedData, getIdxFromY, nationalAvg]);

  const handleClick = useCallback((e) => {
    if (!onBarClick) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const my = e.clientY - rect.top;
    const idx = getIdxFromY(my);
    if (idx >= 0 && idx < sortedData.length) {
      onBarClick(sortedData[idx].label);
    }
  }, [sortedData, getIdxFromY, onBarClick]);

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', height: '100%' }}>
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', display: 'block', cursor: 'crosshair' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setTooltip(null)}
        onClick={handleClick}
      />
      {tooltip && (
        <div style={{
          position: 'absolute',
          left: Math.min(tooltip.x + 12, canvasWidth - 180),
          top: Math.max(tooltip.y - 30, 0),
          background: 'rgba(10,10,15,0.95)',
          border: `1px solid ${hexToRgba(NEON.cyan, 0.3)}`,
          borderRadius: 8,
          padding: '6px 10px',
          fontSize: 11,
          color: NEON.bodyText,
          fontFamily: 'Noto Sans KR',
          pointerEvents: 'none',
          zIndex: 20,
          minWidth: 120,
        }}>
          <div style={{ fontWeight: 700, color: NEON.cyan, marginBottom: 2 }}>{tooltip.label}</div>
          <div>Abnormality: <span style={{ fontFamily: 'JetBrains Mono', fontWeight: 600 }}>{tooltip.rate.toFixed(1)}%</span></div>
          <div style={{ color: tooltip.diff > 0 ? NEON.magenta : NEON.green, fontSize: 10 }}>
            vs Nat'l {tooltip.diff > 0 ? '+' : ''}{tooltip.diff.toFixed(1)}%p
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Stacked Bar Chart (Canvas 2D) ──────────────────────────────────────────
function StackedBarChart({ labels, dataObj, categories, gender, abnormalIndices, nationalAvg, height = 300, highlightCat, onSegmentClick }) {
  const { lang } = useLang();
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [tooltip, setTooltip] = useState(null);
  const [canvasWidth, setCanvasWidth] = useState(600);
  const [canvasHeight, setCanvasHeight] = useState(400);

  useEffect(() => {
    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        setCanvasWidth(Math.floor(entry.contentRect.width));
        setCanvasHeight(Math.floor(entry.contentRect.height));
      }
    });
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const w = canvasWidth;
    const h = Math.max(canvasHeight, 200);
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);

    const ml = 50, mr = 15, mt = 18, mb = 56;
    const cw = w - ml - mr;
    const ch = h - mt - mb;
    const n = labels.length;
    const barW = Math.max(8, Math.min(36, (cw / n) * 0.7));
    const gap = cw / n;

    // Y axis grid
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 1;
    ctx.font = '11px JetBrains Mono';
    ctx.fillStyle = NEON.dimText;
    ctx.textAlign = 'right';
    for (let pct = 0; pct <= 100; pct += 25) {
      const y = mt + ch - (pct / 100) * ch;
      ctx.beginPath();
      ctx.moveTo(ml, y);
      ctx.lineTo(w - mr, y);
      ctx.stroke();
      ctx.fillText(pct + '%', ml - 4, y + 3);
    }

    // National average line (abnormal rate)
    if (abnormalIndices.length > 0) {
      const avgY = mt + ch - (nationalAvg / 100) * ch;
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = NEON.gold;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(ml, avgY);
      ctx.lineTo(w - mr, avgY);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = NEON.gold;
      ctx.font = '11px JetBrains Mono';
      ctx.textAlign = 'left';
      ctx.fillText((lang === 'ko' ? '전국 ' : 'Nat\'l ') + nationalAvg.toFixed(1) + '%', w - mr + 2, avgY - 3);
    }

    // Bars
    labels.forEach((label, i) => {
      const vals = dataObj[label]?.[gender] || [];
      const x = ml + i * gap + (gap - barW) / 2;
      let cumY = 0;

      vals.forEach((v, ci) => {
        const bh = (v / 100) * ch;
        const y = mt + ch - cumY - bh;
        const isAbn = abnormalIndices.includes(ci);
        const color = getCategoryColor(ci, isAbn, abnormalIndices);
        const vividness = Math.max(0.3, Math.min(1, v / 40));
        const isDimmed = highlightCat != null && highlightCat !== ci;
        const alpha = isDimmed ? 0.1 : isAbn ? vividness * 0.95 : vividness * 0.5;
        ctx.fillStyle = hexToRgba(color, alpha);
        ctx.fillRect(x, y, barW, bh);

        if (isAbn && bh > 2 && !isDimmed) {
          ctx.strokeStyle = hexToRgba(color, 0.8);
          ctx.lineWidth = 1;
          ctx.strokeRect(x, y, barW, bh);
        }
        cumY += bh;
      });

      // X labels
      ctx.save();
      ctx.translate(ml + i * gap + gap / 2, mt + ch + 8);
      ctx.rotate(labels.length > 10 ? -Math.PI / 3 : -Math.PI / 4);
      ctx.fillStyle = NEON.labelText;
      ctx.font = '11px Noto Sans KR';
      ctx.textAlign = 'right';
      const displayLabel2 = lang === 'en' ? ({'서울':'Seoul','부산':'Busan','대구':'Daegu','인천':'Incheon','광주':'Gwangju','대전':'Daejeon','울산':'Ulsan','세종':'Sejong','경기':'Gyeonggi','강원':'Gangwon','충북':'Chungbuk','충남':'Chungnam','전북':'Jeonbuk','전남':'Jeonnam','경북':'Gyeongbuk','경남':'Gyeongnam','제주':'Jeju'}[label] || label) : label;
      ctx.fillText(displayLabel2, 0, 0);
      ctx.restore();
    });
  }, [labels, dataObj, categories, gender, abnormalIndices, nationalAvg, canvasWidth, canvasHeight, highlightCat, lang]);

  useEffect(() => { draw(); }, [draw]);

  const getBarInfo = useCallback((mx, my) => {
    const ml2 = 50, mt2 = 18, mb2 = 56;
    const cw2 = canvasWidth - ml2 - 15;
    const ch2 = canvasHeight - mt2 - mb2;
    const gap2 = cw2 / labels.length;
    const idx = Math.floor((mx - ml2) / gap2);
    if (idx < 0 || idx >= labels.length || my < mt2 || my > mt2 + ch2) return null;
    const label = labels[idx];
    const vals = dataObj[label]?.[gender] || [];
    let cumY = 0;
    const yPos = my - mt2;
    const chartBottom = ch2;
    for (let ci = 0; ci < vals.length; ci++) {
      const bh = (vals[ci] / 100) * ch2;
      const segTop = chartBottom - cumY - bh;
      const segBot = chartBottom - cumY;
      if (yPos >= segTop && yPos <= segBot) {
        return { idx, label, vals, catIdx: ci };
      }
      cumY += bh;
    }
    return { idx, label, vals, catIdx: -1 };
  }, [labels, dataObj, gender, canvasWidth, canvasHeight]);

  const handleMouseMove = useCallback((e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const info = getBarInfo(mx, my);
    if (!info) { setTooltip(null); return; }
    setTooltip({ x: e.clientX - rect.left, y: e.clientY - rect.top, label: info.label, vals: info.vals });
  }, [getBarInfo]);

  const handleStackedClick = useCallback((e) => {
    if (!onSegmentClick) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const info = getBarInfo(mx, my);
    if (info) onSegmentClick(info.label, info.catIdx);
  }, [getBarInfo, onSegmentClick]);

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', height: '100%' }}>
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', display: 'block', cursor: 'crosshair' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setTooltip(null)}
        onClick={handleStackedClick}
      />
      {tooltip && (
        <div style={{
          position: 'absolute',
          left: Math.min(tooltip.x + 12, canvasWidth - 200),
          top: Math.max(tooltip.y - 10, 0),
          background: 'rgba(10,10,15,0.95)',
          border: `1px solid ${hexToRgba(NEON.cyan, 0.3)}`,
          borderRadius: 8,
          padding: '8px 10px',
          fontSize: 11,
          color: NEON.bodyText,
          fontFamily: 'Noto Sans KR',
          pointerEvents: 'none',
          zIndex: 20,
          maxHeight: 220,
          overflowY: 'auto',
          minWidth: 140,
        }}>
          <div style={{ fontWeight: 700, marginBottom: 4, ...glowStyle(NEON.cyan) }}>{tooltip.label}</div>
          {tooltip.vals.map((v, ci) => {
            const isAbn = abnormalIndices.includes(ci);
            return (
              <div key={ci} style={{
                display: 'flex', justifyContent: 'space-between', gap: 8,
                opacity: isAbn ? 1 : 0.45,
              }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{
                    width: 8, height: 8, borderRadius: 2,
                    background: getCategoryColor(ci, isAbn, abnormalIndices),
                    display: 'inline-block', flexShrink: 0,
                  }} />
                  {categories[ci]}
                </span>
                <span style={{
                  fontFamily: 'JetBrains Mono', fontWeight: 600,
                  color: isAbn ? NEON.magenta : NEON.bodyText,
                }}>{v}%</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Gender Toggle ───────────────────────────────────────────────────────────
function GenderToggle({ value, onChange }) {
  const { lang } = useLang();
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {GENDER_OPTIONS.map(g => (
        <button
          key={g.key}
          onClick={() => onChange(g.key)}
          style={{
            background: value === g.key ? hexToRgba(NEON.cyan, 0.15) : 'transparent',
            border: `1px solid ${value === g.key ? NEON.cyan : 'rgba(255,255,255,0.08)'}`,
            borderRadius: 6,
            padding: '3px 10px',
            color: value === g.key ? NEON.cyan : NEON.labelText,
            fontSize: 11,
            fontWeight: value === g.key ? 600 : 400,
            cursor: 'pointer',
            fontFamily: 'Noto Sans KR',
            transition: 'all 0.2s',
          }}
        >
          {lang === 'en' ? g.label_en : g.label_ko}
        </button>
      ))}
    </div>
  );
}

// ─── View Toggle ─────────────────────────────────────────────────────────────
function ViewToggle({ value, onChange }) {
  const { lang } = useLang();
  const opts = [
    { key: 'abnormal', label_ko: '이상치율', label_en: 'Abnormality' },
    { key: 'stacked', label_ko: '분포', label_en: 'Distribution' },
  ];
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {opts.map(o => (
        <button
          key={o.key}
          onClick={() => onChange(o.key)}
          style={{
            background: value === o.key
              ? (o.key === 'abnormal' ? hexToRgba(NEON.magenta, 0.15) : hexToRgba(NEON.cyan, 0.15))
              : 'transparent',
            border: `1px solid ${value === o.key
              ? (o.key === 'abnormal' ? NEON.magenta : NEON.cyan)
              : 'rgba(255,255,255,0.08)'}`,
            borderRadius: 6,
            padding: '3px 10px',
            color: value === o.key
              ? (o.key === 'abnormal' ? NEON.magenta : NEON.cyan)
              : NEON.labelText,
            fontSize: 11,
            fontWeight: value === o.key ? 600 : 400,
            cursor: 'pointer',
            fontFamily: 'Noto Sans KR',
            transition: 'all 0.2s',
          }}
        >
          {lang === 'en' ? o.label_en : o.label_ko}
        </button>
      ))}
    </div>
  );
}

// ─── Panel ───────────────────────────────────────────────────────────────────
function Panel({ children, style }) {
  return (
    <div style={{
      background: `linear-gradient(145deg, ${NEON.bgPanel} 0%, ${NEON.bgPanelEnd} 100%)`,
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 14,
      padding: 14,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      ...style,
    }}>
      {children}
    </div>
  );
}

// ─── Legend (stacked mode only) ──────────────────────────────────────────────
function Legend({ categories, abnormalIndices, highlightCat, onCatClick }) {
  const { t } = useLang();
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px 8px', marginTop: 4 }}>
      {categories.map((cat, i) => {
        const isAbn = abnormalIndices.includes(i);
        const isHighlighted = highlightCat === i;
        const isDimmed = highlightCat != null && highlightCat !== i;
        return (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 3, fontSize: 11,
            color: NEON.labelText,
            opacity: isDimmed ? 0.2 : isAbn ? 1 : 0.5,
            cursor: 'pointer',
            outline: isHighlighted ? `1px solid ${NEON.cyan}` : 'none',
            borderRadius: 3,
            padding: '1px 3px',
            transition: 'opacity 0.2s',
          }} onClick={() => onCatClick && onCatClick(i)}>
            <span style={{
              width: 7, height: 7, borderRadius: 2,
              background: getCategoryColor(i, isAbn, abnormalIndices),
              display: 'inline-block',
              boxShadow: isAbn ? `0 0 4px ${hexToRgba(getCategoryColor(i, true, abnormalIndices), 0.5)}` : 'none',
            }} />
            <span style={{ fontFamily: 'Noto Sans KR' }}>{cat}</span>
            {isAbn && <span style={{ color: NEON.magenta, fontSize: 11, fontWeight: 700 }}>!</span>}
          </div>
        );
      })}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: NEON.gold, marginLeft: 6,
      }}>
        <span style={{ width: 14, height: 0, borderTop: `1.5px dashed ${NEON.gold}`, display: 'inline-block' }} />
        {t('전국 평균', 'National Avg')}
      </div>
    </div>
  );
}

// ─── KPI Mini Card ──────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, color }) {
  return (
    <div style={{
      background: hexToRgba(color, 0.06),
      border: `1px solid ${hexToRgba(color, 0.2)}`,
      borderRadius: 8,
      padding: '6px 8px',
      flex: 1,
      minWidth: 0,
    }}>
      <div style={{ fontSize: 10, color: NEON.dimText, marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</div>
      <div style={{ fontFamily: 'JetBrains Mono', fontWeight: 700, fontSize: 13, color, lineHeight: 1.2 }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: NEON.labelText, marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sub}</div>}
    </div>
  );
}

// ─── Disease Correlation Card ────────────────────────────────────────────────
function DiseaseCard({ item }) {
  return (
    <div style={{
      background: hexToRgba(item.color, 0.06),
      border: `1px solid ${hexToRgba(item.color, 0.2)}`,
      borderRadius: 8,
      padding: '6px 8px',
      marginBottom: 4,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
        <span style={{ fontWeight: 700, fontSize: 11, color: item.color }}>{item.disease}</span>
        <span style={{
          fontSize: 10,
          fontFamily: 'JetBrains Mono',
          background: hexToRgba(item.color, 0.12),
          borderRadius: 4,
          padding: '1px 5px',
          color: item.color,
          fontWeight: 600,
        }}>{item.prevalence}</span>
      </div>
      <div style={{ fontSize: 10, color: NEON.labelText, lineHeight: 1.4 }}>{item.risk}</div>
    </div>
  );
}

// ─── Analysis Panel (right column, always visible) ──────────────────────────
function AnalysisPanel({ selectedExam, examData, selectedProv, selectedAge, genderProv, genderAge, abnormalIndices, categories, natAvgProv, natAvgAge }) {
  const { lang, t } = useLang();
  const hasAbnormal = abnormalIndices.length > 0;
  const diseaseLinks = EXAM_DISEASE_LINKS[selectedExam] || [];

  // Province rates for KPI
  const provRates = useMemo(() =>
    PROVINCES.map(p => ({
      name: p,
      rate: getAbnormalRate(examData.province[p]?.[genderProv] || [], abnormalIndices),
    })).sort((a, b) => b.rate - a.rate),
    [examData, genderProv, abnormalIndices]
  );

  const highest = provRates[0];
  const lowest = provRates[provRates.length - 1];

  // Gender gap
  const maleAvg = getNationalAvg(examData.province, 'male', abnormalIndices);
  const femaleAvg = getNationalAvg(examData.province, 'female', abnormalIndices);
  const genderGap = Math.abs(maleAvg - femaleAvg);
  const genderHigher = maleAvg > femaleAvg ? 'M' : 'F';

  // Selected detail data
  const selLabel = selectedProv || selectedAge;
  const selType = selectedProv ? 'province' : selectedAge ? 'age' : null;
  const selDataObj = selType === 'province' ? examData.province : examData.age;
  const selGender = selType === 'province' ? genderProv : genderAge;
  const selNatAvg = selType === 'province' ? natAvgProv : natAvgAge;
  const selAllLabels = selType === 'province' ? PROVINCES : AGE_GROUPS;

  const selVals = selLabel ? (selDataObj[selLabel]?.[selGender] || []) : [];
  const selRate = selLabel ? getAbnormalRate(selVals, abnormalIndices) : 0;
  const selDiff = selLabel ? selRate - selNatAvg : 0;

  // Rank
  const selAllRates = selLabel ? selAllLabels.map(l => ({
    label: l,
    rate: getAbnormalRate(selDataObj[l]?.[selGender] || [], abnormalIndices),
  })).sort((a, b) => b.rate - a.rate) : [];
  const selRank = selLabel ? selAllRates.findIndex(d => d.label === selLabel) + 1 : 0;

  const clinicalNote = selType === 'age' ? (lang === 'en' ? AGE_CLINICAL_NOTES_EN : AGE_CLINICAL_NOTES_KO)[selLabel] : null;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'row',
      gap: 12,
      height: '100%',
      overflow: 'hidden',
      paddingBottom: 2,
    }}>
      {/* KPI Cards - Left Section */}
      {hasAbnormal && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: 4, flex: '0 0 200px' }}>
          <KpiCard label={t("전국 이상치율","National Abnormality")} value={natAvgProv.toFixed(1) + '%'} color={NEON.magenta} />
          <KpiCard label={t("최고 시도","Highest Province")} value={highest?.rate.toFixed(1) + '%'} sub={pn(highest?.name || '')} color="#ff6b6b" />
          <KpiCard label={t("최저 시도","Lowest Province")} value={lowest?.rate.toFixed(1) + '%'} sub={pn(lowest?.name || '')} color={NEON.green} />
          <KpiCard label={t("남녀 격차","Gender Gap")} value={genderGap.toFixed(1) + '%p'} sub={genderHigher + (lang === 'en' ? ' higher' : ' 우세')} color={NEON.gold} />
        </div>
      )}

      {/* Middle Section: Selected Detail + Disease Correlations */}
      <div style={{ flex: '1 1 0', minWidth: 0, display: 'flex', flexDirection: 'row', gap: 10, overflow: 'hidden' }}>
      {selLabel && hasAbnormal && (
        <div style={{
          background: 'rgba(10,10,20,0.92)',
          border: `1px solid ${hexToRgba(NEON.cyan, 0.25)}`,
          borderRadius: 10,
          padding: '8px 10px',
          flex: '1 1 0',
          minWidth: 0,
          overflow: 'hidden',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span style={{ fontWeight: 700, fontSize: 12, fontFamily: 'Noto Sans KR', ...glowStyle(NEON.cyan) }}>{selType === 'province' ? pn(selLabel) : selLabel}</span>
            <span style={{
              fontSize: 10,
              background: hexToRgba(NEON.gold, 0.12),
              border: `1px solid ${hexToRgba(NEON.gold, 0.3)}`,
              borderRadius: 5,
              padding: '1px 6px',
              color: NEON.gold,
              fontFamily: 'JetBrains Mono',
              fontWeight: 600,
            }}>
              #{selRank}/{selAllLabels.length}
            </span>
          </div>

          <div style={{ display: 'flex', gap: 10, marginBottom: 4 }}>
            <div>
              <div style={{ fontSize: 10, color: NEON.dimText }}>Abnormality</div>
              <div style={{
                fontFamily: 'JetBrains Mono', fontWeight: 700, fontSize: 15,
                color: selAllRates.length > 0
                  ? abnormalColor(selRate, Math.min(...selAllRates.map(d => d.rate)), Math.max(...selAllRates.map(d => d.rate)))
                  : NEON.bodyText,
              }}>
                {selRate.toFixed(1)}%
              </div>
              <div style={{ fontSize: 10, color: selDiff > 0 ? NEON.magenta : NEON.green }}>
                vs Nat'l {selDiff > 0 ? '+' : ''}{selDiff.toFixed(1)}%p
              </div>
            </div>
          </div>

          {/* Category breakdown */}
          <div style={{ fontSize: 10, color: NEON.dimText, marginBottom: 2 }}>Categories</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
            {categories.map((cat, ci) => {
              const isAbn = abnormalIndices.includes(ci);
              return (
                <div key={ci} style={{
                  display: 'flex', justifyContent: 'space-between', gap: 4,
                  opacity: isAbn ? 1 : 0.4,
                  fontSize: 10,
                }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <span style={{
                      width: 6, height: 6, borderRadius: 2,
                      background: getCategoryColor(ci, isAbn, abnormalIndices),
                      display: 'inline-block', flexShrink: 0,
                    }} />
                    {cat}
                  </span>
                  <span style={{
                    fontFamily: 'JetBrains Mono', fontWeight: 600,
                    color: isAbn ? NEON.magenta : NEON.bodyText,
                  }}>{selVals[ci] != null ? selVals[ci] + '%' : '-'}</span>
                </div>
              );
            })}
          </div>

          {clinicalNote && (
            <div style={{
              marginTop: 5,
              padding: '4px 6px',
              background: hexToRgba(NEON.gold, 0.06),
              border: `1px solid ${hexToRgba(NEON.gold, 0.15)}`,
              borderRadius: 6,
              fontSize: 11,
              color: NEON.gold,
              lineHeight: 1.4,
            }}>
              {clinicalNote}
            </div>
          )}
        </div>
      )}

      {/* Disease Correlation */}
      {diseaseLinks.length > 0 && (
        <div style={{ flex: '1 1 0', minWidth: 0, overflow: 'hidden' }}>
          <div style={{
            fontSize: 11, fontWeight: 700, fontFamily: 'Noto Sans KR',
            color: NEON.bodyText, marginBottom: 4,
            display: 'flex', alignItems: 'center', gap: 4,
          }}>
            <span style={{ color: NEON.magenta }}>+</span> Disease Correlation
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {diseaseLinks.map((item, i) => (
              <span key={i} title={item.risk} style={{
                padding: '3px 8px', borderRadius: 12, fontSize: 10,
                background: `${item.color}15`, border: `1px solid ${item.color}33`,
                color: item.color, whiteSpace: 'nowrap',
                fontFamily: 'Noto Sans KR',
              }}>
                {(lang === 'en' && T.diseases[item.disease]) ? T.diseases[item.disease] : item.disease} {item.prevalence}
              </span>
            ))}
          </div>
        </div>
      )}

      </div>
      {/* Right Section: Clinical Threshold Reference */}
      {examData.ref && (
        <div style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 8,
          padding: '6px 8px',
          flex: '0 0 180px',
          overflow: 'hidden',
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, fontFamily: 'Noto Sans KR', color: NEON.bodyText, marginBottom: 4 }}>
            {t('판정 기준','Clinical Threshold')}
          </div>
          <div style={{ fontSize: 11, color: NEON.labelText, lineHeight: 1.5 }}>
            {examData.ref}
          </div>
          {hasAbnormal && categories.length > 0 && (
            <div style={{ marginTop: 4, fontSize: 11, lineHeight: 1.5 }}>
              <span style={{ color: NEON.magenta, fontWeight: 600 }}>{t('이상 판정: ','Abnormal Criteria: ')}</span>
              <span style={{ color: NEON.labelText }}>
                {abnormalIndices.map(idx => categories[idx]).filter(Boolean).join(', ')}
              </span>
            </div>
          )}
        </div>
      )}

      {/* No selection hint */}
      {!selLabel && hasAbnormal && (
        <div style={{
          fontSize: 10, color: NEON.dimText, textAlign: 'center',
          padding: '12px 8px', lineHeight: 1.5,
          border: `1px dashed rgba(255,255,255,0.08)`,
          borderRadius: 8,
          alignSelf: 'center',
          minWidth: 180,
        }}>
          {t('차트에서 시도 또는 연령대를 클릭하면','Click a province or age group on the chart')}<br />{t('상세 분석이 여기에 표시됩니다','to see detailed analysis here')}
        </div>
      )}
    </div>
  );
}

// ─── Insight Generator ───────────────────────────────────────────────────────
function generateInsight(examData, selectedExam, abnormalIndices, genderProv, genderAge, lang = 'ko') {
  if (!abnormalIndices.length) return null;

  const provData = examData.province;
  const ageData = examData.age;

  // Province analysis
  const provRates = PROVINCES.map(p => ({
    name: p,
    rate: getAbnormalRate(provData[p]?.[genderProv] || [], abnormalIndices),
  })).sort((a, b) => b.rate - a.rate);

  const natAvgProv = getNationalAvg(provData, genderProv, abnormalIndices);
  const highest = provRates[0];
  const lowest = provRates[provRates.length - 1];

  // Age analysis
  const ageRates = AGE_GROUPS.map(a => ({
    name: a,
    rate: getAbnormalRate(ageData[a]?.[genderAge] || [], abnormalIndices),
  }));

  // Find steepest increase between consecutive age groups
  let maxJump = 0, jumpFrom = '', jumpTo = '';
  for (let i = 1; i < ageRates.length; i++) {
    const diff = ageRates[i].rate - ageRates[i - 1].rate;
    if (diff > maxJump) {
      maxJump = diff;
      jumpFrom = ageRates[i - 1].name;
      jumpTo = ageRates[i].name;
    }
  }

  const peakAge = ageRates.reduce((a, b) => a.rate > b.rate ? a : b);

  const name = examData.name;
  const diffHigh = (highest.rate - natAvgProv).toFixed(1);

  let text = `${name} 이상치율이 ${highest.name}에서 가장 높으며 (${highest.rate.toFixed(1)}%), 전국 평균(${natAvgProv.toFixed(1)}%) 대비 +${diffHigh}%p.`;
  text += ` 최저: ${lowest.name} (${lowest.rate.toFixed(1)}%).`;

  if (maxJump > 2) {
    text += ` 연령별로는 ${jumpFrom} \u2192 ${jumpTo} 구간에서 +${maxJump.toFixed(1)}%p 급증.`;
  }
  text += ` ${peakAge.name}세에서 최고 (${peakAge.rate.toFixed(1)}%).`;

  return text;
}

// ═══════════════════════════════════════════════════════════════════════════════
export default function ExamDetail() {
  const { lang, t } = useLang();
  const pn = (name) => lang === 'en' ? (T.provinces[name] || name) : name;
  const [selectedExam, setSelectedExam] = useState('bmi');
  const [genderProv, setGenderProv] = useState('total');
  const [genderAge, setGenderAge] = useState('total');
  const [viewMode, setViewMode] = useState('abnormal');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [sortProv, setSortProv] = useState('rate');
  const [sortAge, setSortAge] = useState('rate');
  const [selectedProv, setSelectedProv] = useState(null);
  const [selectedAge, setSelectedAge] = useState(null);
  const [highlightCat, setHighlightCat] = useState(null);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const examData = FULL_DATA.exam_items[selectedExam];
  if (!examData) return null;

  const categories = examData.categories || [];
  const abnormalIndices = ABNORMAL_INDICES[selectedExam] || [];
  const hasAbnormal = abnormalIndices.length > 0;
  const natAvgProv = getNationalAvg(examData.province, genderProv, abnormalIndices);
  const natAvgAge = getNationalAvg(examData.age, genderAge, abnormalIndices);

  const insight = generateInsight(examData, selectedExam, abnormalIndices, genderProv, genderAge, lang);


  return (
    <div style={{
      height: 'calc(100vh - 56px)',
      marginTop: 56,
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gridTemplateRows: 'auto 1fr 220px',
      gap: 10,
      padding: 12,
      overflow: 'hidden',
      background: NEON.bg,
    }}>
      {/* ─── Top Control Bar ──────────────────────────────────────── */}
      <div style={{
        gridColumn: '1 / -1',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        flexWrap: 'wrap',
      }}>
        {/* Exam Selector Dropdown */}
        <div ref={dropdownRef} style={{ position: 'relative', zIndex: 50 }}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            style={{
              background: `linear-gradient(145deg, ${NEON.bgPanel}, ${NEON.bgPanelEnd})`,
              border: `1px solid ${hexToRgba(NEON.cyan, 0.3)}`,
              borderRadius: 10,
              padding: '7px 14px',
              color: NEON.cyan,
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'Noto Sans KR',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              minWidth: 180,
              boxShadow: `0 0 12px ${hexToRgba(NEON.cyan, 0.1)}`,
              ...glowStyle(NEON.cyan),
            }}
          >
            {examData.name}
            <span style={{ marginLeft: 'auto', fontSize: 10, color: NEON.labelText }}>
              {dropdownOpen ? '\u25B2' : '\u25BC'}
            </span>
          </button>
          {dropdownOpen && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              marginTop: 4,
              background: 'rgba(10,10,15,0.97)',
              border: `1px solid ${hexToRgba(NEON.cyan, 0.2)}`,
              borderRadius: 10,
              padding: 6,
              width: 240,
              maxHeight: 340,
              overflowY: 'auto',
              boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
            }}>
              {EXAM_KEYS.map(key => {
                const item = FULL_DATA.exam_items[key];
                if (!item) return null;
                const active = key === selectedExam;
                return (
                  <button
                    key={key}
                    onClick={() => { setSelectedExam(key); setDropdownOpen(false); setSelectedProv(null); setSelectedAge(null); }}
                    style={{
                      display: 'block',
                      width: '100%',
                      textAlign: 'left',
                      background: active ? hexToRgba(NEON.cyan, 0.12) : 'transparent',
                      border: 'none',
                      borderRadius: 6,
                      padding: '5px 10px',
                      color: active ? NEON.cyan : '#ccc',
                      fontSize: 12,
                      cursor: 'pointer',
                      fontFamily: 'Noto Sans KR',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => { if (!active) e.target.style.background = 'rgba(255,255,255,0.05)'; }}
                    onMouseLeave={e => { if (!active) e.target.style.background = 'transparent'; }}
                  >
                    {item.name}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Abnormal summary badge */}
        {hasAbnormal && (
          <div style={{
            fontSize: 11,
            fontFamily: 'JetBrains Mono',
            ...glowStyle(NEON.magenta),
            background: hexToRgba(NEON.magenta, 0.08),
            borderRadius: 8,
            padding: '5px 10px',
            border: `1px solid ${hexToRgba(NEON.magenta, 0.2)}`,
          }}>
            {t('전국 이상치율','National Abnormality')} <span style={{ fontWeight: 700, fontSize: 13 }}>{natAvgProv.toFixed(1)}%</span>
          </div>
        )}

        <div style={{ flex: 1 }} />

        {/* View mode toggle */}
        {hasAbnormal && <ViewToggle value={viewMode} onChange={setViewMode} />}
      </div>

      {/* ─── Province Chart Panel (Col 1) ──────────────────────────── */}
      <Panel style={{ minHeight: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 700, fontFamily: 'Noto Sans KR', ...glowStyle(NEON.bodyText) }}>
              {t('시도별','By Province')} {viewMode === 'abnormal' ? t('이상치율','Abnormality Rate') : t('분포','Distribution')}
            </div>
            {viewMode === 'abnormal' && hasAbnormal && (
              <SortToggle value={sortProv} onChange={setSortProv} />
            )}
          </div>
          <GenderToggle value={genderProv} onChange={setGenderProv} />
        </div>
        <div style={{ flex: 1, minHeight: 0 }}>
          {viewMode === 'abnormal' && hasAbnormal ? (
            <AbnormalBarChart
              labels={PROVINCES}
              dataObj={examData.province}
              gender={genderProv}
              abnormalIndices={abnormalIndices}
              nationalAvg={natAvgProv}
              sortMode={sortProv}
              onBarClick={(label) => { setSelectedProv(prev => prev === label ? null : label); setSelectedAge(null); }}
            />
          ) : (
            <>
              <StackedBarChart
                labels={PROVINCES}
                dataObj={examData.province}
                categories={categories}
                gender={genderProv}
                abnormalIndices={abnormalIndices}
                nationalAvg={natAvgProv}
                highlightCat={highlightCat}
                onSegmentClick={(label) => { setSelectedProv(label); setSelectedAge(null); }}
              />
              <Legend categories={categories} abnormalIndices={abnormalIndices} highlightCat={highlightCat} onCatClick={(i) => setHighlightCat(prev => prev === i ? null : i)} />
            </>
          )}
        </div>
        {/* Insight at bottom of province panel */}
        {insight && (
          <div style={{
            marginTop: 6,
            background: `linear-gradient(90deg, ${hexToRgba(NEON.cyan, 0.06)}, ${hexToRgba(NEON.magenta, 0.04)})`,
            border: `1px solid ${hexToRgba(NEON.cyan, 0.15)}`,
            borderRadius: 8,
            padding: '6px 10px',
            flexShrink: 0,
          }}>
            <span style={{ fontSize: 10, fontWeight: 700, ...glowStyle(NEON.gold), marginRight: 6 }}>INSIGHT</span>
            <span style={{ fontSize: 10, color: NEON.bodyText, fontFamily: 'Noto Sans KR', lineHeight: 1.5 }}>
              {insight}
            </span>
          </div>
        )}
      </Panel>

      {/* ─── Age Group Chart Panel (Col 2) ─────────────────────────── */}
      <Panel style={{ minHeight: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 700, fontFamily: 'Noto Sans KR', ...glowStyle(NEON.bodyText) }}>
              {t('연령대별','By Age Group')} {viewMode === 'abnormal' ? t('이상치율','Abnormality Rate') : t('분포','Distribution')}
            </div>
            {viewMode === 'abnormal' && hasAbnormal && (
              <SortToggle value={sortAge} onChange={setSortAge} />
            )}
          </div>
          <GenderToggle value={genderAge} onChange={setGenderAge} />
        </div>
        <div style={{ flex: 1, minHeight: 0 }}>
          {viewMode === 'abnormal' && hasAbnormal ? (
            <AbnormalBarChart
              labels={AGE_GROUPS}
              dataObj={examData.age}
              gender={genderAge}
              abnormalIndices={abnormalIndices}
              nationalAvg={natAvgAge}
              sortMode={sortAge}
              onBarClick={(label) => { setSelectedAge(prev => prev === label ? null : label); setSelectedProv(null); }}
            />
          ) : (
            <>
              <StackedBarChart
                labels={AGE_GROUPS}
                dataObj={examData.age}
                categories={categories}
                gender={genderAge}
                abnormalIndices={abnormalIndices}
                nationalAvg={natAvgAge}
                highlightCat={highlightCat}
                onSegmentClick={(label) => { setSelectedAge(label); setSelectedProv(null); }}
              />
              <Legend categories={categories} abnormalIndices={abnormalIndices} highlightCat={highlightCat} onCatClick={(i) => setHighlightCat(prev => prev === i ? null : i)} />
            </>
          )}
        </div>
      </Panel>

      {/* ─── Analysis Panel (Bottom Row, Full Width) ──────────────── */}
      <Panel style={{ gridColumn: '1 / -1', overflow: 'hidden' }}>
        <div style={{ fontSize: 12, fontWeight: 700, fontFamily: 'Noto Sans KR', ...glowStyle(NEON.bodyText), marginBottom: 6, flexShrink: 0 }}>
          {t('분석 패널','Analysis Panel')}
        </div>
        <AnalysisPanel
          selectedExam={selectedExam}
          examData={examData}
          selectedProv={selectedProv}
          selectedAge={selectedAge}
          genderProv={genderProv}
          genderAge={genderAge}
          abnormalIndices={abnormalIndices}
          categories={categories}
          natAvgProv={natAvgProv}
          natAvgAge={natAvgAge}
        />
      </Panel>

      {/* Reference footer */}
      <div style={{
        gridColumn: '1 / -1',
        padding: '4px 12px',
        fontSize: 10,
        color: '#4a4a6a',
        fontFamily: "'JetBrains Mono', monospace",
        borderTop: '1px solid rgba(255,255,255,0.04)',
        flexShrink: 0,
      }}>
        {t('출처: 건강검진통계연보(NHIS 2024) — 18개 검진항목 x 17시도 x 15연령대 x 3성별', 'Source: Health Screening Statistics (NHIS 2024) — 18 items x 17 provinces x 15 age groups x 3 genders')}
      </div>
    </div>
  );
}
