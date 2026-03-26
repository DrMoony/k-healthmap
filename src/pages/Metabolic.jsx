import { useState, useRef, useEffect, useCallback } from 'react';
import { FULL_DATA } from '../data/full_data';
import { BMI_PROV } from '../data/bmi_prov';
import { MET_PROV } from '../data/met_prov';
import { TRENDS } from '../data/trends';
import { getProvinceInsight, getAgeInsight } from '../data/insights';
import DumbbellChart from '../components/DumbbellChart';
import { useLang } from '../i18n';
import { T } from '../translations';

const PROVINCES = [
  '서울','부산','대구','인천','광주','대전','울산','세종',
  '경기','강원','충북','충남','전북','전남','경북','경남','제주',
];

const AGE_GROUPS = [
  '≤19','20-24','25-29','30-34','35-39','40-44','45-49',
  '50-54','55-59','60-64','65-69','70-74','75-79','80-84','85+',
];

const YEARS = TRENDS.years; // [2015..2024]

// Obesity rate per province = sum of 25.0~29.9 + 30.0~39.9 + 40.0이상
function getObesityRate(provData) {
  if (!provData) return 0;
  const [, , a, b, c] = provData;
  return +(a + b + c).toFixed(1);
}

// Build heatmap data: age × province obesity rates by gender
function buildHeatmapData(metric, gender) {
  if (metric === 'obesity') {
    return AGE_GROUPS.map(age => {
      const ageData = FULL_DATA.exam_items.bmi.age[age];
      const vals = ageData?.[gender] || ageData?.total || [0,0,0,0,0];
      const obesityPct = +(vals[2] + vals[3] + vals[4]).toFixed(1);
      return obesityPct;
    });
  }
  return AGE_GROUPS.map(() => 0);
}

// For heatmap: province obesity rates by gender
function getProvObesityByGender(prov, gender) {
  const d = FULL_DATA.exam_items.bmi.province[prov];
  if (!d) return 0;
  const vals = d[gender] || d.total;
  return +(vals[2] + vals[3] + vals[4]).toFixed(1);
}

// For heatmap: age obesity rates by gender
function getAgeObesityByGender(age, gender) {
  const d = FULL_DATA.exam_items.bmi.age[age];
  if (!d) return 0;
  const vals = d[gender] || d.total;
  return +(vals[2] + vals[3] + vals[4]).toFixed(1);
}

// Color interpolation for heatmap
function heatColor(value, min, max) {
  const t = max === min ? 0.5 : (value - min) / (max - min);
  // Low (healthy) = dark teal, High (worse) = bright magenta
  const r = Math.round(0 + t * 255);
  const g = Math.round(212 * (1 - t * 0.6));
  const b = Math.round(255 * (1 - t * 0.3));
  return `rgb(${r},${g},${b})`;
}

// Panel style
const panel = {
  background: 'linear-gradient(145deg, #1a1a2e 0%, #12121a 100%)',
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: '14px',
  padding: '14px',
  overflow: 'hidden',
};

const glowText = (color) => ({
  color,
  textShadow: `0 0 8px ${color}66`,
});

export default function Metabolic() {
  const { lang, t } = useLang();
  const pn = (name) => lang === 'en' ? (T.provinces[name] || name) : name;
  const [year, setYear] = useState(2024);
  const [gender, setGender] = useState('total');
  const [metric, setMetric] = useState('obesity'); // obesity | metabolic
  const [hoveredCell, setHoveredCell] = useState(null);
  const [selectedProv, setSelectedProv] = useState(null);
  const [selectedAge, setSelectedAge] = useState(null);
  const [tooltip, setTooltip] = useState(null);
  const [genderView, setGenderView] = useState('bar'); // 'bar' | 'dumbbell'
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const genderCompRef = useRef(null);

  const yearIdx = YEARS.indexOf(year);

  // Get province values for selected year, metric, AND gender
  const getProvValue = useCallback((prov) => {
    if (metric === 'obesity') {
      return getProvObesityByGender(prov, gender);
    }
    const vals = MET_PROV[prov];
    if (!vals || vals[yearIdx] == null) return null;
    return vals[yearIdx];
  }, [metric, yearIdx, gender]);

  // Province ranking data — reflects gender selection
  const provRanking = PROVINCES
    .map(p => ({ name: p, value: getProvValue(p) }))
    .filter(p => p.value != null)
    .sort((a, b) => b.value - a.value);

  const nationalAvg = metric === 'obesity' ? TRENDS.obesity[yearIdx] : TRENDS.metabolic[yearIdx];
  const genderLabel = gender === 'male' ? t('남성','Male') : gender === 'female' ? t('여성','Female') : t('전체','Total');

  // Build heatmap matrix: rows=age, cols=province
  const ageRates = AGE_GROUPS.map(a => getAgeObesityByGender(a, gender));
  const provRates = PROVINCES.map(p => getProvObesityByGender(p, gender));

  const heatmapMatrix = AGE_GROUPS.map((age, ai) =>
    PROVINCES.map((prov, pi) => {
      if (metric === 'obesity') {
        const ageR = ageRates[ai];
        const provR = provRates[pi];
        const avg = nationalAvg || 39;
        return +((ageR * provR) / avg).toFixed(1);
      } else {
        const provVal = getProvValue(prov);
        if (provVal == null) return null;
        const ageR = ageRates[ai];
        const avgAge = ageRates.reduce((s, v) => s + v, 0) / ageRates.length;
        return +(provVal * (ageR / (avgAge || 1))).toFixed(1);
      }
    })
  );

  // Find min/max for color scale
  const allVals = heatmapMatrix.flat().filter(v => v != null);
  const heatMin = Math.min(...allVals);
  const heatMax = Math.max(...allVals);

  // Canvas heatmap rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const container = containerRef.current;
    const rect = container.getBoundingClientRect();

    const LABEL_LEFT = 48;
    const LABEL_TOP = 56;
    const W = rect.width - 20;
    const H = rect.height - 20;

    canvas.width = W * window.devicePixelRatio;
    canvas.height = H * window.devicePixelRatio;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';

    const ctx = canvas.getContext('2d');
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    ctx.clearRect(0, 0, W, H);

    const cellW = (W - LABEL_LEFT - 10) / PROVINCES.length;
    const cellH = (H - LABEL_TOP - 10) / AGE_GROUPS.length;

    // Draw column labels (provinces) — highlight selected
    ctx.textAlign = 'center';
    PROVINCES.forEach((p, i) => {
      const x = LABEL_LEFT + i * cellW + cellW / 2;
      ctx.save();
      ctx.translate(x, LABEL_TOP - 4);
      ctx.rotate(-Math.PI / 4);
      ctx.fillStyle = selectedProv === p ? '#ffd60a' : '#8888aa';
      ctx.font = selectedProv === p ? 'bold 11px "Noto Sans KR", sans-serif' : '11px "Noto Sans KR", sans-serif';
      ctx.fillText(pn(p), 0, 0);
      ctx.restore();
    });

    // Draw row labels (age groups) — highlight selected
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    AGE_GROUPS.forEach((a, i) => {
      const y = LABEL_TOP + i * cellH + cellH / 2;
      ctx.fillStyle = selectedAge === a ? '#ffd60a' : '#8888aa';
      ctx.font = selectedAge === a ? 'bold 11px "JetBrains Mono", monospace' : '11px "JetBrains Mono", monospace';
      ctx.fillText(a, LABEL_LEFT - 4, y);
    });

    // Draw cells
    AGE_GROUPS.forEach((_, ai) => {
      PROVINCES.forEach((_, pi) => {
        const val = heatmapMatrix[ai][pi];
        const x = LABEL_LEFT + pi * cellW;
        const y = LABEL_TOP + ai * cellH;

        if (val == null) {
          ctx.fillStyle = '#0a0a0f';
          ctx.fillRect(x, y, cellW - 1, cellH - 1);
          return;
        }

        ctx.fillStyle = heatColor(val, heatMin, heatMax);
        ctx.fillRect(x, y, cellW - 1, cellH - 1);

        // Highlight selected province column with gold tint
        if (selectedProv && PROVINCES[pi] === selectedProv) {
          ctx.fillStyle = 'rgba(255,214,10,0.12)';
          ctx.fillRect(x, y, cellW - 1, cellH - 1);
          ctx.strokeStyle = '#ffd60a44';
          ctx.lineWidth = 1;
          ctx.strokeRect(x, y, cellW - 1, cellH - 1);
        }

        // Highlight selected age row with gold tint
        if (selectedAge && AGE_GROUPS[ai] === selectedAge) {
          ctx.fillStyle = 'rgba(255,214,10,0.12)';
          ctx.fillRect(x, y, cellW - 1, cellH - 1);
          ctx.strokeStyle = '#ffd60a44';
          ctx.lineWidth = 1;
          ctx.strokeRect(x, y, cellW - 1, cellH - 1);
        }

        // When BOTH selected, the specific intersection cell gets a bright border
        if (selectedProv && selectedAge && PROVINCES[pi] === selectedProv && AGE_GROUPS[ai] === selectedAge) {
          ctx.save();
          ctx.strokeStyle = '#ffd60a';
          ctx.lineWidth = 2.5;
          ctx.shadowColor = '#ffd60a';
          ctx.shadowBlur = 6;
          ctx.strokeRect(x + 0.5, y + 0.5, cellW - 2, cellH - 2);
          ctx.restore();
        }

        // Hover highlight
        if (hoveredCell && hoveredCell.ai === ai && hoveredCell.pi === pi) {
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.strokeRect(x, y, cellW - 1, cellH - 1);
        }
      });
    });

    // Store layout info for mouse interaction
    canvas._layout = { LABEL_LEFT, LABEL_TOP, cellW, cellH, W, H };
  }, [heatmapMatrix, heatMin, heatMax, hoveredCell, selectedProv, selectedAge, year, gender, metric, lang]);

  const handleCanvasMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas || !canvas._layout) return;
    const { LABEL_LEFT, LABEL_TOP, cellW, cellH } = canvas._layout;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    const pi = Math.floor((mx - LABEL_LEFT) / cellW);
    const ai = Math.floor((my - LABEL_TOP) / cellH);

    if (pi >= 0 && pi < PROVINCES.length && ai >= 0 && ai < AGE_GROUPS.length) {
      setHoveredCell({ ai, pi });
      const val = heatmapMatrix[ai]?.[pi];
      setTooltip({
        x: e.clientX,
        y: e.clientY,
        text: `${pn(PROVINCES[pi])} · ${AGE_GROUPS[ai]}${t('세','y/o')} — ${val != null ? val + '%' : 'N/A'}`,
      });
    } else {
      setHoveredCell(null);
      setTooltip(null);
    }
  };

  // Heatmap click: cell click selects BOTH province + age
  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    if (!canvas || !canvas._layout) return;
    const { LABEL_LEFT, LABEL_TOP, cellW, cellH } = canvas._layout;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const pi = Math.floor((mx - LABEL_LEFT) / cellW);
    const ai = Math.floor((my - LABEL_TOP) / cellH);

    // Check if clicking on age label area (left of LABEL_LEFT)
    if (mx < LABEL_LEFT && ai >= 0 && ai < AGE_GROUPS.length) {
      const clickedAge = AGE_GROUPS[ai];
      setSelectedAge(prev => prev === clickedAge ? null : clickedAge);
      return;
    }

    // Check if clicking on province label area (above LABEL_TOP)
    if (my < LABEL_TOP && pi >= 0 && pi < PROVINCES.length) {
      const clickedProv = PROVINCES[pi];
      setSelectedProv(prev => prev === clickedProv ? null : clickedProv);
      return;
    }

    // Cell click: toggle both province AND age
    if (pi >= 0 && pi < PROVINCES.length && ai >= 0 && ai < AGE_GROUPS.length) {
      const clickedProv = PROVINCES[pi];
      const clickedAge = AGE_GROUPS[ai];
      // If both are already this exact combo, deselect both
      if (selectedProv === clickedProv && selectedAge === clickedAge) {
        setSelectedProv(null);
        setSelectedAge(null);
      } else {
        setSelectedProv(clickedProv);
        setSelectedAge(clickedAge);
      }
    }
  };

  // Province bar click handler — toggle province only
  const handleProvBarClick = (provName) => {
    setSelectedProv(prev => prev === provName ? null : provName);
  };

  // Gender comparison data
  const genderCompData = PROVINCES.map(p => {
    if (metric === 'obesity') {
      return {
        name: p,
        male: getProvObesityByGender(p, 'male'),
        female: getProvObesityByGender(p, 'female'),
      };
    } else {
      const val = getProvValue(p);
      return { name: p, male: val, female: val }; // MET_PROV doesn't split by gender
    }
  }).filter(d => d.male != null);

  const genderMax = Math.max(...genderCompData.flatMap(d => [d.male || 0, d.female || 0]));

  // Bar chart dimensions
  const barH = 18;
  const barGap = 3;
  const rankMax = provRanking.length ? Math.max(...provRanking.map(p => p.value)) : 100;
  const rankChartW = 260;

  // Province rank for selected age group
  const getProvRankForAge = useCallback((provName, ageGroup) => {
    const ai = AGE_GROUPS.indexOf(ageGroup);
    if (ai < 0) return null;
    const valsForAge = PROVINCES.map((p, pi) => ({
      name: p,
      value: heatmapMatrix[ai]?.[pi],
    })).filter(x => x.value != null).sort((a, b) => b.value - a.value);
    const idx = valsForAge.findIndex(x => x.name === provName);
    return idx >= 0 ? { rank: idx + 1, total: valsForAge.length } : null;
  }, [heatmapMatrix]);

  return (
    <div style={{
      height: 'calc(100vh - 56px)',
      marginTop: '56px',
      display: 'grid',
      gridTemplateColumns: '1fr 300px',
      gridTemplateRows: 'auto 1fr auto',
      gap: '10px',
      padding: '12px',
      overflow: 'hidden',
      fontFamily: '"Noto Sans KR", sans-serif',
    }}>
      {/* ===== Top Controls ===== */}
      <div style={{
        gridColumn: '1 / -1',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        ...panel,
        padding: '10px 18px',
        flexWrap: 'wrap',
      }}>
        {/* Title */}
        <h2 style={{
          margin: 0, fontSize: '16px', fontWeight: 700,
          ...glowText('#00d4ff'),
          letterSpacing: '1px',
          marginRight: '12px',
        }}>
          {t('대사질환','Metabolic')}
        </h2>

        {/* Metric toggle */}
        <div style={{ display: 'flex', gap: '6px' }}>
          {[
            { id: 'obesity', label: t('비만율','Obesity Rate'), color: '#ff006e' },
            { id: 'metabolic', label: t('대사증후군','Metabolic Syndrome'), color: '#ffd60a' },
          ].map(m => (
            <button key={m.id} onClick={() => setMetric(m.id)} style={{
              background: metric === m.id ? `${m.color}22` : 'transparent',
              border: `1px solid ${metric === m.id ? m.color : 'rgba(255,255,255,0.1)'}`,
              borderRadius: '8px',
              padding: '5px 14px',
              color: metric === m.id ? m.color : '#8888aa',
              fontSize: '12px',
              fontWeight: metric === m.id ? 600 : 400,
              cursor: 'pointer',
              transition: 'all 0.2s',
              fontFamily: '"Noto Sans KR", sans-serif',
            }}>
              {m.label}
            </button>
          ))}
        </div>

        {/* Divider */}
        <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.08)' }} />

        {/* Year selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '11px', color: '#8888aa' }}>{t('연도','Year')}</span>
          <select
            value={year}
            onChange={e => setYear(+e.target.value)}
            style={{
              background: '#0d0d1a',
              border: '1px solid rgba(0,212,255,0.3)',
              borderRadius: '6px',
              color: '#00d4ff',
              padding: '4px 8px',
              fontSize: '12px',
              fontFamily: '"JetBrains Mono", monospace',
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        {/* Divider */}
        <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.08)' }} />

        {/* Gender toggle */}
        <div style={{ display: 'flex', gap: '4px' }}>
          {[
            { id: 'total', label: t('전체','Total') },
            { id: 'male', label: t('남','M') },
            { id: 'female', label: t('여','F') },
          ].map(g => (
            <button key={g.id} onClick={() => setGender(g.id)} style={{
              background: gender === g.id ? '#00d4ff22' : 'transparent',
              border: `1px solid ${gender === g.id ? '#00d4ff' : 'rgba(255,255,255,0.1)'}`,
              borderRadius: '6px',
              padding: '4px 12px',
              color: gender === g.id ? '#00d4ff' : '#8888aa',
              fontSize: '12px',
              fontWeight: gender === g.id ? 600 : 400,
              cursor: 'pointer',
              transition: 'all 0.2s',
              fontFamily: '"Noto Sans KR", sans-serif',
            }}>
              {g.label}
            </button>
          ))}
        </div>

        {/* National stat */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '10px', color: '#8888aa' }}>
              {year} {t('전국','National')} {metric === 'obesity' ? t('비만율','Obesity Rate') : t('대사증후군','Metabolic Syndrome')}
            </div>
            <div style={{
              fontSize: '20px',
              fontFamily: '"JetBrains Mono", monospace',
              fontWeight: 700,
              ...glowText(metric === 'obesity' ? '#ff006e' : '#ffd60a'),
            }}>
              {nationalAvg}%
            </div>
          </div>
        </div>
      </div>

      {/* ===== Heatmap (left, main area) ===== */}
      <div ref={containerRef} style={{
        ...panel,
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <div style={{
          fontSize: '12px',
          color: '#8888aa',
          marginBottom: '6px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <span>
            <span style={glowText('#00d4ff')}>{t('연령 x 시도','Age x Province')}</span> {metric === 'obesity' ? t('비만율','Obesity Rate') : t('대사증후군','Metabolic Syndrome')} {t('히트맵','Heatmap')}
            <span style={{ display: 'block', color: '#ffd60a', fontSize: '10px', fontWeight: 400, marginTop: '2px' }}>
              {t('※ 추정값: 연령별·시도별 비만율의 교차 추정치입니다. 실측 교차데이터가 아닌 통계적 근사값으로 해석에 주의가 필요합니다.', '※ Estimated: Cross-estimated values from age and province obesity rates. Statistical approximations, not actual cross-tabulated data.')}
            </span>
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
              <div style={{ width: 12, height: 8, background: heatColor(heatMin, heatMin, heatMax), borderRadius: 2 }} />
              <span>{t('낮음','Low')}</span>
            </div>
            <div style={{ width: 60, height: 8, borderRadius: 4, background: `linear-gradient(90deg, ${heatColor(heatMin, heatMin, heatMax)}, ${heatColor((heatMin+heatMax)/2, heatMin, heatMax)}, ${heatColor(heatMax, heatMin, heatMax)})` }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
              <div style={{ width: 12, height: 8, background: heatColor(heatMax, heatMin, heatMax), borderRadius: 2 }} />
              <span>{t('높음','High')}</span>
            </div>
          </div>
        </div>
        <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
          <canvas
            ref={canvasRef}
            onMouseMove={handleCanvasMove}
            onMouseLeave={() => { setHoveredCell(null); setTooltip(null); }}
            onClick={handleCanvasClick}
            style={{ cursor: 'crosshair' }}
          />
        </div>
      </div>

      {/* ===== Province Ranking (right sidebar) ===== */}
      <div style={{
        ...panel,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <div style={{ fontSize: '12px', color: '#8888aa', marginBottom: '8px' }}>
          <span style={glowText('#00ff88')}>{t('시도별 순위','Provincial Ranking')}</span>
          <span style={{ marginLeft: '6px', fontSize: '10px' }}>
            ({year} {genderLabel} {metric === 'obesity' ? t('비만율','Obesity Rate') : t('대사증후군','Metabolic Syndrome')})
          </span>
        </div>
        <svg viewBox={`0 0 ${rankChartW} ${provRanking.length * (barH + barGap) + 20}`} style={{ width: '100%', height: 'auto', flexShrink: 0 }}>
          {/* National average line */}
          {nationalAvg && (
            <>
              <line
                x1={60 + (nationalAvg / rankMax) * (rankChartW - 110)}
                y1={0}
                x2={60 + (nationalAvg / rankMax) * (rankChartW - 110)}
                y2={provRanking.length * (barH + barGap)}
                stroke="#ffd60a"
                strokeWidth={1}
                strokeDasharray="3,3"
                opacity={0.6}
              />
              <text
                x={60 + (nationalAvg / rankMax) * (rankChartW - 110)}
                y={provRanking.length * (barH + barGap) + 12}
                fill="#ffd60a"
                fontSize="10"
                fontFamily="JetBrains Mono, monospace"
                textAnchor="middle"
                opacity={0.8}
              >
                {t('전국','Nat\'l')} {nationalAvg}%
              </text>
            </>
          )}
          {provRanking.map((p, i) => {
            const w = (p.value / rankMax) * (rankChartW - 110);
            const y = i * (barH + barGap);
            const isSelected = selectedProv === p.name;
            // Gradient by value: higher = more saturated/brighter
            const t = rankMax > 0 ? p.value / rankMax : 0;
            const baseColor = metric === 'obesity' ? '#ff006e' : '#00d4ff';
            const barOpacity = isSelected ? 1 : (0.35 + t * 0.6);
            const barColor = isSelected ? '#ffd60a' : baseColor;
            return (
              <g key={p.name}
                onClick={() => handleProvBarClick(p.name)}
                style={{ cursor: 'pointer' }}
                opacity={selectedProv && !isSelected ? 0.4 : 1}
              >
                <text
                  x={56} y={y + barH / 2 + 1}
                  fill={isSelected ? '#ffd60a' : '#8888aa'}
                  fontSize="10"
                  fontFamily="Noto Sans KR, sans-serif"
                  textAnchor="end"
                  dominantBaseline="middle"
                >
                  {pn(p.name)}
                </text>
                <rect
                  x={60} y={y + 2}
                  width={w} height={barH - 4}
                  rx={3}
                  fill={barColor}
                  opacity={barOpacity}
                />
                {isSelected && (
                  <rect
                    x={60} y={y + 2}
                    width={w} height={barH - 4}
                    rx={3}
                    fill="none"
                    stroke="#ffd60a"
                    strokeWidth={1.5}
                    filter="url(#glow)"
                  />
                )}
                <text
                  x={60 + w + 4} y={y + barH / 2 + 1}
                  fill={isSelected ? '#ffd60a' : '#ccccdd'}
                  fontSize="10"
                  fontFamily="JetBrains Mono, monospace"
                  dominantBaseline="middle"
                >
                  {p.value}%
                </text>
              </g>
            );
          })}
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
        </svg>
      </div>

      {/* ===== Bottom: Gender Comparison (60%) + Insight Panel (40%) ===== */}
      <div style={{
        gridColumn: '1 / -1',
        display: 'grid',
        gridTemplateColumns: '60% 40%',
        gap: '10px',
        maxHeight: '220px',
      }}>
        {/* Gender Comparison */}
        <div ref={genderCompRef} style={{
          ...panel,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}>
          <div style={{ fontSize: '12px', color: '#8888aa', marginBottom: '6px', display: 'flex', gap: '16px', alignItems: 'center' }}>
            <span style={glowText('#ff006e')}>{t('성별 비교','Gender Comparison')}</span>
            <span style={{ fontSize: '10px' }}>
              ({metric === 'obesity' ? t('비만율 (BMI 25+)','Obesity Rate (BMI 25+)') : t('대사증후군 위험군','Metabolic Syndrome Risk')})
            </span>
            <div style={{ display: 'flex', gap: '3px', marginLeft: '8px' }}>
              {[
                { key: 'bar', label: t('바','Bar') },
                { key: 'dumbbell', label: t('덤벨','Dumbbell') },
              ].map(v => (
                <button key={v.key} onClick={() => setGenderView(v.key)} style={{
                  padding: '2px 7px', fontSize: '10px', borderRadius: '4px',
                  border: genderView === v.key ? '1px solid #ff006e' : '1px solid rgba(255,255,255,0.1)',
                  background: genderView === v.key ? '#ff006e22' : 'transparent',
                  color: genderView === v.key ? '#ff006e' : '#888',
                  cursor: 'pointer', fontFamily: '"Noto Sans KR", sans-serif',
                }}>{v.label}</button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '12px', marginLeft: 'auto', fontSize: '10px' }}>
              <span style={{ color: '#00d4ff' }}>{t('● 남성','● Male')}</span>
              <span style={{ color: '#ff006e' }}>{t('● 여성','● Female')}</span>
            </div>
          </div>
          <div style={{ flex: 1, minHeight: 0, overflowX: 'auto', overflowY: 'hidden' }}>
            {genderView === 'dumbbell' ? (
              <DumbbellChart
                data={genderCompData}
                label={metric === 'obesity' ? t('비만율 성별 격차','Obesity Rate Gender Gap') : t('대사증후군 성별 격차','Metabolic Syndrome Gender Gap')}
                onItemClick={(name) => {
                  setSelectedProv(prev => prev === name ? null : name);
                }}
              />
            ) : (
            <svg
              width={Math.max(genderCompData.length * 52 + 40, 300)}
              height={150}
              style={{ display: 'block' }}
            >
              {genderCompData.map((d, i) => {
                const x = 30 + i * 52;
                const maxBarH = 110;
                const maleH = (d.male / genderMax) * maxBarH;
                const femaleH = (d.female / genderMax) * maxBarH;
                const isSelected = selectedProv === d.name;
                const groupOpacity = selectedProv && !isSelected ? 0.3 : 1;
                const maleOpacity = 0.3 + (d.male / genderMax) * 0.7;
                const femaleOpacity = 0.3 + (d.female / genderMax) * 0.7;
                return (
                  <g key={d.name} opacity={groupOpacity}
                    onClick={() => handleProvBarClick(d.name)}
                    style={{ cursor: 'pointer' }}
                  >
                    <rect x={x} y={maxBarH - maleH + 5} width={18} height={maleH} rx={3} fill="#00d4ff" opacity={maleOpacity} />
                    <text x={x + 9} y={maxBarH - maleH} fill="#00d4ff" fontSize="9" fontFamily="JetBrains Mono, monospace" textAnchor="middle" opacity={0.9}>{d.male}</text>
                    <rect x={x + 22} y={maxBarH - femaleH + 5} width={18} height={femaleH} rx={3} fill="#ff006e" opacity={femaleOpacity} />
                    <text x={x + 31} y={maxBarH - femaleH} fill="#ff006e" fontSize="9" fontFamily="JetBrains Mono, monospace" textAnchor="middle" opacity={0.9}>{d.female}</text>
                    <text x={x + 20} y={maxBarH + 20} fill={isSelected ? '#ffd60a' : '#8888aa'} fontSize="10" fontFamily="Noto Sans KR, sans-serif" textAnchor="middle">{pn(d.name)}</text>
                    {isSelected && (
                      <rect x={x - 2} y={2} width={44} height={maxBarH + 24} rx={6} fill="none" stroke="#ffd60a44" strokeWidth={1} />
                    )}
                  </g>
                );
              })}
              {nationalAvg && (
                <>
                  <line x1={25} y1={110 - (nationalAvg / genderMax) * 110 + 5} x2={genderCompData.length * 52 + 30} y2={110 - (nationalAvg / genderMax) * 110 + 5} stroke="#ffd60a" strokeWidth={1} strokeDasharray="4,3" opacity={0.5} />
                  <text x={20} y={110 - (nationalAvg / genderMax) * 110 + 2} fill="#ffd60a" fontSize="9" fontFamily="JetBrains Mono, monospace" textAnchor="end" opacity={0.7}>{nationalAvg}%</text>
                </>
              )}
            </svg>
            )}
          </div>
        </div>

        {/* ===== Insight Panel with Cross-Selection ===== */}
        <div style={{
          ...panel,
          background: 'linear-gradient(145deg, rgba(26,26,46,0.85) 0%, rgba(18,18,26,0.9) 100%)',
          backdropFilter: 'blur(12px)',
          borderColor: 'rgba(0,212,255,0.15)',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
        }}>
          {/* Breadcrumb selection indicator */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            marginBottom: '8px',
            paddingBottom: '6px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}>
            <span style={{ fontSize: '10px', color: '#555577', flexShrink: 0 }}>{t('선택:','Selection:')}</span>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              flexWrap: 'wrap',
            }}>
              {/* Province chip */}
              {selectedProv ? (
                <span
                  onClick={() => setSelectedProv(null)}
                  style={{
                    fontSize: '10px',
                    padding: '2px 8px',
                    borderRadius: '10px',
                    background: '#ffd60a18',
                    border: '1px solid #ffd60a55',
                    color: '#ffd60a',
                    cursor: 'pointer',
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '3px',
                  }}
                >
                  {pn(selectedProv)}
                  <span style={{ fontSize: '9px', opacity: 0.6 }}>x</span>
                </span>
              ) : null}

              {/* Separator dot when both */}
              {selectedProv && selectedAge && (
                <span style={{ color: '#555577', fontSize: '10px' }}>&middot;</span>
              )}

              {/* Age chip */}
              {selectedAge ? (
                <span
                  onClick={() => setSelectedAge(null)}
                  style={{
                    fontSize: '10px',
                    padding: '2px 8px',
                    borderRadius: '10px',
                    background: '#00d4ff18',
                    border: '1px solid #00d4ff55',
                    color: '#00d4ff',
                    cursor: 'pointer',
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '3px',
                  }}
                >
                  {selectedAge}{t('세','y/o')}
                  <span style={{ fontSize: '9px', opacity: 0.6 }}>x</span>
                </span>
              ) : null}

              {/* Nothing selected */}
              {!selectedProv && !selectedAge && (
                <span style={{ fontSize: '10px', color: '#555577' }}>{t('전국','National')}</span>
              )}
            </div>
          </div>

          {(() => {
            const provInsight = selectedProv ? getProvinceInsight(selectedProv, metric, yearIdx, lang) : null;
            const ageInsight = selectedAge ? getAgeInsight(selectedAge, metric, gender, lang) : null;
            const BMI_CATS = ['<18.5', '18.5~24.9', '25.0~29.9', '30.0~39.9', '40.0+'];
            const BMI_COLORS = ['#00ff88', '#00d4ff', '#ffd60a', '#ff6e00', '#ff006e'];

            // Nothing selected
            if (!selectedProv && !selectedAge) {
              return (
                <div style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#555577',
                  fontSize: '11px',
                  textAlign: 'center',
                  padding: '12px',
                  lineHeight: 1.6,
                }}>
                  {t('시도 또는 연령대를 클릭하면','Click a province or age group')}<br />{t('분석 결과가 표시됩니다','to see analysis results')}
                </div>
              );
            }

            // Mini bar renderer for BMI distribution
            const renderBmiDist = (label, vals, color) => {
              if (!vals) return null;
              const maxV = Math.max(...vals, 1);
              return (
                <div style={{ marginBottom: '6px' }}>
                  <div style={{ fontSize: '10px', color: color || '#aaaacc', fontWeight: 600, marginBottom: '2px' }}>{label}</div>
                  {BMI_CATS.map((cat, ci) => (
                    <div key={ci} style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '1px' }}>
                      <span style={{ fontSize: '9px', color: '#8888aa', width: '52px', textAlign: 'right', flexShrink: 0 }}>{cat}</span>
                      <div style={{ flex: 1, height: '8px', background: 'rgba(255,255,255,0.04)', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{ width: `${(vals[ci] / maxV) * 100}%`, height: '100%', background: BMI_COLORS[ci], opacity: 0.3 + (vals[ci] / maxV) * 0.7, borderRadius: '2px' }} />
                      </div>
                      <span style={{ fontSize: '9px', color: '#ccccdd', width: '32px', fontFamily: '"JetBrains Mono", monospace' }}>{vals[ci]}%</span>
                    </div>
                  ))}
                </div>
              );
            };

            // ===== COMBINED VIEW: Province + Age =====
            if (selectedProv && selectedAge) {
              const ai = AGE_GROUPS.indexOf(selectedAge);
              const pi = PROVINCES.indexOf(selectedProv);
              const cellValue = (ai >= 0 && pi >= 0) ? heatmapMatrix[ai]?.[pi] : null;
              const provBmi = FULL_DATA.exam_items.bmi.province[selectedProv];
              const ageBmi = FULL_DATA.exam_items.bmi.age[selectedAge];
              const provVals = provBmi?.[gender] || provBmi?.total || [0,0,0,0,0];
              const ageVals = ageBmi?.[gender] || ageBmi?.total || [0,0,0,0,0];
              const rankInfo = getProvRankForAge(selectedProv, selectedAge);

              return (
                <div style={{ fontSize: '10px', lineHeight: 1.6 }}>
                  {/* Combined header */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    marginBottom: '6px',
                  }}>
                    <span style={{
                      fontSize: '12px',
                      fontWeight: 700,
                      ...glowText('#ffd60a'),
                    }}>
                      {pn(selectedProv)} &middot; {selectedAge}{t('세','')}
                    </span>
                    {cellValue != null && (
                      <span style={{
                        fontSize: '14px',
                        fontFamily: '"JetBrains Mono", monospace',
                        fontWeight: 700,
                        color: '#ffd60a',
                        textShadow: '0 0 10px #ffd60a66',
                      }}>
                        {cellValue}%
                      </span>
                    )}
                  </div>

                  {/* Province rank for this age group */}
                  {rankInfo && (
                    <div style={{
                      fontSize: '10px',
                      color: rankInfo.rank <= 3 ? '#ff6666' : rankInfo.rank >= rankInfo.total - 2 ? '#66ffaa' : '#aaaacc',
                      marginBottom: '6px',
                      padding: '3px 8px',
                      background: 'rgba(255,255,255,0.03)',
                      borderRadius: '6px',
                      border: '1px solid rgba(255,255,255,0.05)',
                    }}>
                      {t(`${selectedAge}세 연령대에서 ${selectedProv}은`, `In the ${selectedAge} age group, ${pn(selectedProv)} is`)} <strong>{t(`${rankInfo.rank}위`,`#${rankInfo.rank}`)}</strong>/{rankInfo.total} {t('개 시도','provinces')}
                      {rankInfo.rank <= 3 && ' \u2014 상위권 (관리 필요)'}
                      {rankInfo.rank >= rankInfo.total - 2 && ' \u2014 양호 수준'}
                    </div>
                  )}

                  {/* Province 10-year trend summary */}
                  {provInsight && (
                    <div style={{ marginBottom: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '3px' }}>
                        <span style={{ fontSize: '10px' }}>{provInsight.statusEmoji}</span>
                        <span style={{ fontSize: '10px', fontWeight: 600, color: '#e0e0ff' }}>{provInsight.title}</span>
                        <span style={{
                          fontSize: '9px',
                          padding: '1px 5px',
                          borderRadius: '4px',
                          background: `${provInsight.statusColor}22`,
                          color: provInsight.statusColor,
                          border: `1px solid ${provInsight.statusColor}44`,
                          fontWeight: 600,
                        }}>
                          {provInsight.status}
                        </span>
                      </div>
                      {provInsight.lines.map((line, i) => (
                        <div key={i} style={{ color: line.color, marginBottom: '1px', fontSize: '10px' }}>
                          <span style={{ marginRight: '3px' }}>{line.icon}</span>
                          {line.text}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Age group clinical note */}
                  {ageInsight && (
                    <div style={{
                      marginTop: '4px',
                      padding: '5px 8px',
                      background: 'rgba(0,212,255,0.05)',
                      borderRadius: '6px',
                      borderLeft: '2px solid #00d4ff44',
                    }}>
                      <div style={{ fontSize: '10px', fontWeight: 600, color: '#00d4ff', marginBottom: '2px' }}>
                        {selectedAge}{t('세 임상 컨텍스트',' Clinical Context')}
                      </div>
                      <div style={{ color: '#bbbbdd', fontSize: '10px' }}>
                        {ageInsight.note}
                      </div>
                    </div>
                  )}

                  {/* BMI distributions */}
                  <div style={{ marginTop: '6px' }}>
                    {renderBmiDist(`${pn(selectedProv)} ${t('BMI 분포','BMI Distribution')}`, provVals)}
                    {renderBmiDist(`${selectedAge}${t('세 BMI 분포',' BMI Distribution')}`, ageVals)}
                  </div>

                  {/* Correlations if available */}
                  {provInsight?.correlations?.length > 0 && (
                    <div style={{ marginTop: '4px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '4px' }}>
                      <div style={{ color: '#8888aa', fontSize: '9px', marginBottom: '2px', fontWeight: 600 }}>{t('연관 요인','Related Factors')}</div>
                      {provInsight.correlations.slice(0, 2).map((c, i) => (
                        <div key={i} style={{ color: '#aaaacc', fontSize: '9px', marginBottom: '1px', paddingLeft: '6px' }}>
                          {'• '}{c}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            // ===== PROVINCE ONLY =====
            if (selectedProv && !selectedAge) {
              const provBmi = FULL_DATA.exam_items.bmi.province[selectedProv];
              const provVals = provBmi?.[gender] || provBmi?.total || [0,0,0,0,0];

              return (
                <div style={{ fontSize: '10px', lineHeight: 1.6 }}>
                  {provInsight && (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                        <span style={{ fontSize: '12px' }}>{provInsight.statusEmoji}</span>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#e0e0ff' }}>{provInsight.title}</span>
                        <span style={{
                          fontSize: '9px',
                          padding: '1px 6px',
                          borderRadius: '4px',
                          background: `${provInsight.statusColor}22`,
                          color: provInsight.statusColor,
                          border: `1px solid ${provInsight.statusColor}44`,
                          fontWeight: 600,
                        }}>
                          {provInsight.status}
                        </span>
                      </div>
                      {provInsight.lines.map((line, i) => (
                        <div key={i} style={{ color: line.color, marginBottom: '2px' }}>
                          <span style={{ marginRight: '4px' }}>{line.icon}</span>
                          {line.text}
                        </div>
                      ))}

                      {/* Gender summary */}
                      <div style={{ display: 'flex', gap: '8px', marginTop: '4px', marginBottom: '4px', fontSize: '10px' }}>
                        <span style={{ color: '#00d4ff' }}>{t('남','M')} {getProvObesityByGender(selectedProv, 'male')}%</span>
                        <span style={{ color: '#ff006e' }}>{t('여','F')} {getProvObesityByGender(selectedProv, 'female')}%</span>
                      </div>

                      {renderBmiDist(`${pn(selectedProv)} ${t('BMI 분포','BMI Distribution')}`, provVals)}

                      {provInsight.correlations.length > 0 && (
                        <div style={{ marginTop: '6px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '4px' }}>
                          <div style={{ color: '#8888aa', fontSize: '9px', marginBottom: '3px', fontWeight: 600 }}>{t('연관 요인','Related Factors')}</div>
                          {provInsight.correlations.map((c, i) => (
                            <div key={i} style={{ color: '#aaaacc', fontSize: '9px', marginBottom: '1px', paddingLeft: '8px' }}>
                              {'• '}{c}
                            </div>
                          ))}
                        </div>
                      )}
                      {provInsight.recommendation && (
                        <div style={{
                          marginTop: '6px',
                          fontStyle: 'italic',
                          fontSize: '9px',
                          color: '#7777aa',
                          borderTop: '1px solid rgba(255,255,255,0.06)',
                          paddingTop: '4px',
                        }}>
                          {provInsight.recommendation}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            }

            // ===== AGE ONLY =====
            if (!selectedProv && selectedAge) {
              const ageBmi = FULL_DATA.exam_items.bmi.age[selectedAge];
              const ageVals = ageBmi?.[gender] || ageBmi?.total || [0,0,0,0,0];
              const ageObesity = getAgeObesityByGender(selectedAge, gender);

              return (
                <div style={{ fontSize: '10px', lineHeight: 1.6 }}>
                  {ageInsight && (
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: '#00d4ff', marginBottom: '4px' }}>
                        {ageInsight.title}
                      </div>
                      <div style={{
                        fontSize: '16px',
                        fontFamily: '"JetBrains Mono", monospace',
                        fontWeight: 700,
                        ...glowText('#00d4ff'),
                        marginBottom: '6px',
                      }}>
                        {ageObesity}%
                      </div>
                      <div style={{
                        color: '#bbbbdd',
                        fontSize: '10px',
                        marginBottom: '8px',
                        padding: '5px 8px',
                        background: 'rgba(0,212,255,0.05)',
                        borderRadius: '6px',
                        borderLeft: '2px solid #00d4ff44',
                      }}>
                        {ageInsight.note}
                      </div>

                      {/* Gender comparison for this age */}
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '4px', fontSize: '10px' }}>
                        <span style={{ color: '#00d4ff' }}>{t('남','M')} {getAgeObesityByGender(selectedAge, 'male')}%</span>
                        <span style={{ color: '#ff006e' }}>{t('여','F')} {getAgeObesityByGender(selectedAge, 'female')}%</span>
                        <span style={{ color: '#ffd60a' }}>
                          {t('차이','Gap')} {Math.abs(getAgeObesityByGender(selectedAge, 'male') - getAgeObesityByGender(selectedAge, 'female')).toFixed(1)}%p
                        </span>
                      </div>

                      {renderBmiDist(`${selectedAge}${t('세 BMI 분포',' BMI Distribution')}`, ageVals)}
                    </div>
                  )}
                </div>
              );
            }

            return null;
          })()}
        </div>
      </div>

      {/* ===== Tooltip ===== */}
      {tooltip && (
        <div style={{
          position: 'fixed',
          left: tooltip.x + 12,
          top: tooltip.y - 10,
          background: 'rgba(10,10,20,0.95)',
          border: '1px solid rgba(0,212,255,0.3)',
          borderRadius: '8px',
          padding: '8px 12px',
          fontSize: '11px',
          color: '#e0e0ff',
          fontFamily: '"JetBrains Mono", monospace',
          pointerEvents: 'none',
          zIndex: 1000,
          whiteSpace: 'nowrap',
          backdropFilter: 'blur(8px)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.6)',
        }}>
          {tooltip.text}
        </div>
      )}

      {/* Reference footer */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        padding: '4px 12px',
        fontSize: 10,
        color: '#4a4a6a',
        fontFamily: "'JetBrains Mono', monospace",
        borderTop: '1px solid rgba(255,255,255,0.04)',
        background: '#0a0a0f',
        zIndex: 10,
      }}>
        {t('출처: 건강검진통계연보(NHIS 2015-2024), KOSSO 비만 팩트시트 2025, KDA 당뇨 팩트시트 2024', 'Source: Health Screening Statistics (NHIS 2015-2024), KOSSO Obesity Fact Sheet 2025, KDA Diabetes Fact Sheet 2024')}
      </div>
    </div>
  );
}
