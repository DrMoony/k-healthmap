import { useState, useMemo } from 'react';
import nafldData from '../data/nafld_2023.json';

const comorbData = nafldData.section_3_comorbidities_and_costs;

// Disease labels (rows in dot matrix)
const DISEASES = ['HTN', 'DM', 'HL', 'CKD'];
const DISEASE_LABELS = {
  HTN: '고혈압',
  DM: '당뇨',
  HL: '이상지질혈증',
  CKD: '만성신장질환',
};

// Build intersection data from JSON
function buildIntersections() {
  const s1 = comorbData.single_comorbidity_2012_vs_2022;
  const s2 = comorbData.two_comorbidities_2012_vs_2022;
  const s3 = comorbData.three_comorbidities_2012_vs_2022;
  const s4 = comorbData.four_comorbidities_2012_vs_2022;
  const total = s1.total_nafld_patients;

  return [
    // Single
    { sets: ['HTN'], y2012: s1.hypertension['2012'], y2022: s1.hypertension['2022'] },
    { sets: ['DM'], y2012: s1.diabetes['2012'], y2022: s1.diabetes['2022'] },
    { sets: ['HL'], y2012: s1.hyperlipidemia['2012'], y2022: s1.hyperlipidemia['2022'] },
    { sets: ['CKD'], y2012: s1.chronic_kidney_disease['2012'], y2022: s1.chronic_kidney_disease['2022'] },
    // Two
    { sets: ['DM', 'HTN'], y2012: s2.diabetes_hypertension['2012'], y2022: s2.diabetes_hypertension['2022'] },
    { sets: ['HTN', 'HL'], y2012: s2.hypertension_hyperlipidemia['2012'], y2022: s2.hypertension_hyperlipidemia['2022'] },
    { sets: ['DM', 'HL'], y2012: s2.diabetes_hyperlipidemia['2012'], y2022: s2.diabetes_hyperlipidemia['2022'] },
    { sets: ['CKD', 'DM'], y2012: s2.ckd_diabetes['2012'], y2022: s2.ckd_diabetes['2022'] },
    { sets: ['CKD', 'HTN'], y2012: s2.ckd_hypertension['2012'], y2022: s2.ckd_hypertension['2022'] },
    { sets: ['CKD', 'HL'], y2012: s2.ckd_hyperlipidemia['2012'], y2022: s2.ckd_hyperlipidemia['2022'] },
    // Three
    { sets: ['DM', 'HTN', 'HL'], y2012: s3.diabetes_hypertension_hyperlipidemia['2012'], y2022: s3.diabetes_hypertension_hyperlipidemia['2022'] },
    { sets: ['CKD', 'DM', 'HTN'], y2012: s3.ckd_diabetes_hypertension['2012'], y2022: s3.ckd_diabetes_hypertension['2022'] },
    { sets: ['CKD', 'HTN', 'HL'], y2012: s3.ckd_hypertension_hyperlipidemia['2012'], y2022: s3.ckd_hypertension_hyperlipidemia['2022'] },
    { sets: ['CKD', 'DM', 'HL'], y2012: s3.ckd_diabetes_hyperlipidemia['2012'], y2022: s3.ckd_diabetes_hyperlipidemia['2022'] },
    // Four
    { sets: ['CKD', 'HL', 'DM', 'HTN'], y2012: s4.ckd_hyperlipidemia_diabetes_hypertension['2012'], y2022: s4.ckd_hyperlipidemia_diabetes_hypertension['2022'] },
  ].map(d => ({
    ...d,
    total,
  }));
}

// Set sizes (total per disease across all intersections)
function buildSetSizes() {
  const s1 = comorbData.single_comorbidity_2012_vs_2022;
  return {
    HTN: { y2012: s1.hypertension['2012'].percent, y2022: s1.hypertension['2022'].percent },
    DM: { y2012: s1.diabetes['2012'].percent, y2022: s1.diabetes['2022'].percent },
    HL: { y2012: s1.hyperlipidemia['2012'].percent, y2022: s1.hyperlipidemia['2022'].percent },
    CKD: { y2012: s1.chronic_kidney_disease['2012'].percent, y2022: s1.chronic_kidney_disease['2022'].percent },
  };
}

const COLOR_BY_SIZE = {
  1: '#00e5ff',
  2: '#ffd740',
  3: '#ff9100',
  4: '#ff1744',
};

export default function UpSetPlot({ onIntersectionClick }) {
  const [selectedYear, setSelectedYear] = useState('both'); // '2012', '2022', 'both'
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const [selectedIdx, setSelectedIdx] = useState(null);

  const intersections = useMemo(() => buildIntersections(), []);
  const setSizes = useMemo(() => buildSetSizes(), []);

  // Sort intersections by 2022 percent descending
  const sorted = useMemo(() => {
    return [...intersections]
      .map((d, i) => ({ ...d, origIdx: i }))
      .sort((a, b) => b.y2022.percent - a.y2022.percent);
  }, [intersections]);

  // Layout constants
  const W = 820, H = 540;
  const marginLeft = 130, marginTop = 40, marginBottom = 10, marginRight = 20;
  const dotAreaH = 120; // height for dot matrix
  const barAreaH = H - marginTop - dotAreaH - marginBottom - 40; // bar chart area
  const barAreaTop = marginTop + 20;
  const dotAreaTop = barAreaTop + barAreaH + 10;
  const colW = Math.min(40, (W - marginLeft - marginRight) / sorted.length);
  const dotR = 6;
  const rowGap = 24;

  // Max percent for bar scale
  const maxPct = useMemo(() => {
    let m = 0;
    sorted.forEach(d => {
      m = Math.max(m, d.y2012.percent, d.y2022.percent);
    });
    return m * 1.15;
  }, [sorted]);

  const barScale = (pct) => (pct / maxPct) * barAreaH;

  // Set size bar scale (left side)
  const maxSetPct = useMemo(() => {
    let m = 0;
    Object.values(setSizes).forEach(v => {
      m = Math.max(m, v.y2012, v.y2022);
    });
    return m * 1.15;
  }, [setSizes]);
  const setSizeBarW = 80;
  const setSizeScale = (pct) => (pct / maxSetPct) * setSizeBarW;

  const handleClick = (idx, d) => {
    setSelectedIdx(idx === selectedIdx ? null : idx);
    if (onIntersectionClick) {
      onIntersectionClick({
        sets: d.sets,
        y2012: d.y2012,
        y2022: d.y2022,
        total: d.total,
      });
    }
  };

  const formatNum = (n) => {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(0) + 'K';
    return n.toLocaleString();
  };

  return (
    <div style={{ width: '100%' }}>
      {/* Year toggle */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, justifyContent: 'center' }}>
        {[
          { id: 'both', label: '2012 vs 2022' },
          { id: '2012', label: '2012' },
          { id: '2022', label: '2022' },
        ].map(opt => (
          <button
            key={opt.id}
            onClick={() => setSelectedYear(opt.id)}
            style={{
              padding: '4px 14px',
              borderRadius: 6,
              border: selectedYear === opt.id ? '1px solid #00e5ff' : '1px solid #334',
              background: selectedYear === opt.id ? 'rgba(0,229,255,0.15)' : 'rgba(20,20,40,0.6)',
              color: selectedYear === opt.id ? '#00e5ff' : '#8892b0',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: selectedYear === opt.id ? 600 : 400,
              transition: 'all 0.2s',
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxWidth: 820, display: 'block', margin: '0 auto' }}>
        <defs>
          <filter id="upsetGlow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id="barGrad2012" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#334" />
            <stop offset="100%" stopColor="#5c6bc0" />
          </linearGradient>
          <linearGradient id="barGrad2022" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#334" />
            <stop offset="100%" stopColor="#00e5ff" />
          </linearGradient>
        </defs>

        {/* ── Left side: Set size bars ── */}
        <text x={marginLeft - setSizeBarW - 12} y={dotAreaTop - 8} fill="#8892b0" fontSize={9} textAnchor="middle">
          전체 유병률 (%)
        </text>
        {DISEASES.map((d, i) => {
          const cy = dotAreaTop + i * rowGap + dotR;
          const sz = setSizes[d];
          const show2012 = selectedYear !== '2022';
          const show2022 = selectedYear !== '2012';
          return (
            <g key={`setsize-${d}`}>
              <text x={marginLeft - setSizeBarW - 16} y={cy + 4} fill="#ccd6f6" fontSize={11} textAnchor="end" fontWeight={500}>
                {DISEASE_LABELS[d]}
              </text>
              {/* 2022 bar (background) */}
              {show2022 && (
                <rect
                  x={marginLeft - setSizeScale(sz.y2022) - 8}
                  y={cy - 5}
                  width={setSizeScale(sz.y2022)}
                  height={show2012 ? 5 : 10}
                  rx={2}
                  fill="#00e5ff"
                  opacity={0.7}
                />
              )}
              {/* 2012 bar */}
              {show2012 && (
                <rect
                  x={marginLeft - setSizeScale(sz.y2012) - 8}
                  y={show2022 ? cy : cy - 5}
                  width={setSizeScale(sz.y2012)}
                  height={show2022 ? 5 : 10}
                  rx={2}
                  fill="#5c6bc0"
                  opacity={0.7}
                />
              )}
              {/* Value labels */}
              {show2022 && (
                <text x={marginLeft - setSizeScale(sz.y2022) - 12} y={cy - (show2012 ? 0 : 0)} fill="#00e5ff" fontSize={8} textAnchor="end" dominantBaseline="middle">
                  {sz.y2022}%
                </text>
              )}
            </g>
          );
        })}

        {/* ── Top: Bar chart ── */}
        {/* Y-axis gridlines */}
        {[0, 0.25, 0.5, 0.75, 1].map(frac => {
          const y = barAreaTop + barAreaH - barScale(maxPct * frac);
          const val = (maxPct * frac).toFixed(0);
          return (
            <g key={`grid-${frac}`}>
              <line x1={marginLeft} y1={y} x2={W - marginRight} y2={y} stroke="#1a1a3e" strokeWidth={0.5} />
              {frac > 0 && (
                <text x={marginLeft - 4} y={y + 3} fill="#556" fontSize={8} textAnchor="end">{val}%</text>
              )}
            </g>
          );
        })}

        {sorted.map((d, i) => {
          const x = marginLeft + i * colW + colW / 2;
          const barBase = barAreaTop + barAreaH;
          const n = d.sets.length;
          const color = COLOR_BY_SIZE[n];
          const isHovered = hoveredIdx === i;
          const isSelected = selectedIdx === i;
          const show2012 = selectedYear !== '2022';
          const show2022 = selectedYear !== '2012';
          const barW = selectedYear === 'both' ? colW * 0.35 : colW * 0.6;
          const gap = selectedYear === 'both' ? 1 : 0;

          const change = d.y2022.percent - d.y2012.percent;
          const changePct = d.y2012.percent > 0 ? ((change / d.y2012.percent) * 100).toFixed(0) : '∞';
          const isDramatic = Math.abs(change) > 2 || (d.y2012.percent > 0 && Math.abs(change / d.y2012.percent) > 1);

          return (
            <g
              key={`bar-${i}`}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
              onClick={() => handleClick(i, d)}
              style={{ cursor: 'pointer' }}
              opacity={(hoveredIdx !== null && hoveredIdx !== i && selectedIdx === null) ? 0.4 : 1}
            >
              {/* 2012 bar */}
              {show2012 && (
                <rect
                  x={selectedYear === 'both' ? x - barW - gap : x - barW / 2}
                  y={barBase - barScale(d.y2012.percent)}
                  width={barW}
                  height={Math.max(1, barScale(d.y2012.percent))}
                  rx={2}
                  fill="#5c6bc0"
                  opacity={isHovered || isSelected ? 1 : 0.7}
                />
              )}
              {/* 2022 bar */}
              {show2022 && (
                <rect
                  x={selectedYear === 'both' ? x + gap : x - barW / 2}
                  y={barBase - barScale(d.y2022.percent)}
                  width={barW}
                  height={Math.max(1, barScale(d.y2022.percent))}
                  rx={2}
                  fill={color}
                  opacity={isHovered || isSelected ? 1 : 0.8}
                  filter={isHovered ? 'url(#upsetGlow)' : undefined}
                />
              )}
              {/* Value label on hover */}
              {(isHovered || isSelected) && (
                <text
                  x={x}
                  y={barBase - barScale(Math.max(d.y2012.percent, d.y2022.percent)) - 6}
                  fill={color}
                  fontSize={9}
                  textAnchor="middle"
                  fontWeight={600}
                >
                  {selectedYear === 'both'
                    ? `${d.y2012.percent}→${d.y2022.percent}%`
                    : selectedYear === '2012'
                    ? `${d.y2012.percent}%`
                    : `${d.y2022.percent}%`}
                </text>
              )}
              {/* Dramatic change indicator */}
              {isDramatic && selectedYear === 'both' && !isHovered && !isSelected && (
                <text
                  x={x}
                  y={barBase - barScale(Math.max(d.y2012.percent, d.y2022.percent)) - 4}
                  fill={change > 0 ? '#ff1744' : '#00e676'}
                  fontSize={7}
                  textAnchor="middle"
                  fontWeight={700}
                >
                  {change > 0 ? '▲' : '▼'}
                </text>
              )}
            </g>
          );
        })}

        {/* ── Bottom: Dot matrix ── */}
        {/* Separator line */}
        <line x1={marginLeft} y1={dotAreaTop - 6} x2={W - marginRight} y2={dotAreaTop - 6} stroke="#1a1a3e" strokeWidth={1} />

        {sorted.map((d, i) => {
          const x = marginLeft + i * colW + colW / 2;
          const isHovered = hoveredIdx === i;
          const isSelected = selectedIdx === i;
          const n = d.sets.length;
          const color = COLOR_BY_SIZE[n];

          // Find min/max filled row indices for connecting line
          const filledIndices = DISEASES.map((dis, di) => d.sets.includes(dis) ? di : -1).filter(v => v >= 0);
          const minRow = Math.min(...filledIndices);
          const maxRow = Math.max(...filledIndices);

          return (
            <g
              key={`dot-${i}`}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
              onClick={() => handleClick(i, d)}
              style={{ cursor: 'pointer' }}
              opacity={(hoveredIdx !== null && hoveredIdx !== i && selectedIdx === null) ? 0.3 : 1}
            >
              {/* Connecting line */}
              {filledIndices.length > 1 && (
                <line
                  x1={x}
                  y1={dotAreaTop + minRow * rowGap + dotR}
                  x2={x}
                  y2={dotAreaTop + maxRow * rowGap + dotR}
                  stroke={isHovered || isSelected ? color : '#445'}
                  strokeWidth={2}
                />
              )}
              {/* Dots */}
              {DISEASES.map((dis, di) => {
                const cy = dotAreaTop + di * rowGap + dotR;
                const filled = d.sets.includes(dis);
                return (
                  <circle
                    key={`${i}-${dis}`}
                    cx={x}
                    cy={cy}
                    r={dotR}
                    fill={filled ? (isHovered || isSelected ? color : '#667') : 'transparent'}
                    stroke={filled ? (isHovered || isSelected ? color : '#556') : '#2a2a4a'}
                    strokeWidth={filled ? 2 : 1}
                    filter={filled && (isHovered || isSelected) ? 'url(#upsetGlow)' : undefined}
                  />
                );
              })}
            </g>
          );
        })}

        {/* Legend */}
        {selectedYear === 'both' && (
          <g>
            <rect x={W - 150} y={barAreaTop} width={8} height={8} rx={2} fill="#5c6bc0" />
            <text x={W - 138} y={barAreaTop + 7} fill="#8892b0" fontSize={9}>2012</text>
            <rect x={W - 100} y={barAreaTop} width={8} height={8} rx={2} fill="#00e5ff" />
            <text x={W - 88} y={barAreaTop + 7} fill="#8892b0" fontSize={9}>2022</text>
          </g>
        )}

        {/* Color legend by intersection size */}
        <g>
          {[1, 2, 3, 4].map((n, li) => (
            <g key={`legend-${n}`}>
              <circle cx={marginLeft + li * 70} cy={H - 8} r={4} fill={COLOR_BY_SIZE[n]} />
              <text x={marginLeft + li * 70 + 8} y={H - 5} fill="#8892b0" fontSize={8}>{n}개 질환</text>
            </g>
          ))}
        </g>
      </svg>

      {/* Detail panel */}
      {selectedIdx !== null && (() => {
        const d = sorted[selectedIdx];
        const change = d.y2022.percent - d.y2012.percent;
        const changePct = d.y2012.percent > 0 ? ((change / d.y2012.percent) * 100).toFixed(0) : '∞';
        const pctChange = d.y2012.patients > 0
          ? (((d.y2022.patients - d.y2012.patients) / d.y2012.patients) * 100).toFixed(0)
          : '∞';
        return (
          <div style={{
            marginTop: 12,
            padding: '12px 16px',
            background: 'rgba(10,10,30,0.8)',
            border: '1px solid rgba(0,229,255,0.2)',
            borderRadius: 8,
            fontSize: 13,
            color: '#ccd6f6',
          }}>
            <div style={{ fontWeight: 600, marginBottom: 8, color: COLOR_BY_SIZE[d.sets.length] }}>
              MASLD + {d.sets.map(s => DISEASE_LABELS[s]).join(' + ')}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <div>
                <div style={{ color: '#5c6bc0', fontSize: 11, marginBottom: 2 }}>2012</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#5c6bc0' }}>{d.y2012.percent}%</div>
                <div style={{ fontSize: 11, color: '#556' }}>{formatNum(d.y2012.patients)}명</div>
              </div>
              <div>
                <div style={{ color: '#00e5ff', fontSize: 11, marginBottom: 2 }}>2022</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#00e5ff' }}>{d.y2022.percent}%</div>
                <div style={{ fontSize: 11, color: '#556' }}>{formatNum(d.y2022.patients)}명</div>
              </div>
              <div>
                <div style={{ color: '#8892b0', fontSize: 11, marginBottom: 2 }}>변화</div>
                <div style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: change > 0 ? '#ff1744' : change < 0 ? '#00e676' : '#8892b0',
                }}>
                  {change > 0 ? '+' : ''}{change.toFixed(1)}%p
                </div>
                <div style={{ fontSize: 11, color: '#556' }}>
                  환자수 {pctChange === '∞' ? '∞' : (pctChange > 0 ? '+' : '') + pctChange}%
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
