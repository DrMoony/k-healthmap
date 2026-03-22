import { useState, useRef, useEffect, useCallback } from 'react';
import { LIFESTYLE_DATA } from '../data/lifestyle_data';
import { LIFESTYLE_TRENDS } from '../data/lifestyle_trends';
import BumpChart from '../components/BumpChart';

const CATEGORIES = [
  { key: 'smoking', label: '흡연', icon: '🚬', color: '#ff006e' },
  { key: 'drinking', label: '음주', icon: '🍺', color: '#ffd60a' },
  { key: 'exercise', label: '운동', icon: '🏃', color: '#00ff88' },
];

const GENDERS = [
  { key: 'total', label: '전체' },
  { key: 'male', label: '남' },
  { key: 'female', label: '여' },
];

const PANEL = {
  background: 'linear-gradient(145deg, #1a1a2e 0%, #12121a 100%)',
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: '14px',
  padding: '14px',
};

const METRIC_LABELS = {
  smoking: '현재흡연율 (%)',
  drinking: '고빈도음주율 (주2회 이상, %)',
  exercise: '고강도운동 미실천율 (0일, %)',
};

function getMetricValue(category, arr) {
  if (category === 'smoking') return arr[2]; // 현재흡연%
  if (category === 'drinking') return +(arr[1] + arr[2]).toFixed(1); // 주2-4회 + 주5-7회
  if (category === 'exercise') return arr[0]; // 0일
  return 0;
}

function getProvinceRanking(category, gender) {
  const provData = LIFESTYLE_DATA[category].province;
  const entries = Object.entries(provData).map(([name, d]) => ({
    name,
    value: getMetricValue(category, d[gender]),
  }));
  entries.sort((a, b) => b.value - a.value);
  return entries;
}

function getAgeData(category, gender) {
  const ageData = LIFESTYLE_DATA[category].age;
  return Object.entries(ageData).map(([label, d]) => ({
    label,
    value: getMetricValue(category, d[gender]),
  }));
}

function getNationalAvg(category, gender) {
  const provData = LIFESTYLE_DATA[category].province;
  const vals = Object.values(provData).map(d => getMetricValue(category, d[gender]));
  return +(vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1);
}

// ── Province Bar Chart (Canvas 2D) ──
function ProvinceChart({ category, gender, selectedProv, onProvClick }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const layoutRef = useRef(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const dpr = window.devicePixelRatio || 1;
    const w = container.clientWidth;
    const h = container.clientHeight;
    if (w <= 0 || h <= 0) return;
    canvas.width = w * dpr;
    canvas.height = h * dpr;

    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);

    const data = getProvinceRanking(category, gender);
    const avg = getNationalAvg(category, gender);
    const maxVal = Math.max(...data.map(d => d.value), avg) * 1.15;
    const catColor = CATEGORIES.find(c => c.key === category).color;

    const padL = 55;
    const padR = 20;
    const padT = 4;
    const padB = 40;
    const chartL = padL + 4;
    const chartR = w - padR - 46;
    const chartW = chartR - chartL;
    const availH = h - padT - padB;
    const barH = Math.min(18, (availH) / data.length - 3);
    const gap = (availH - data.length * barH) / (data.length + 1);

    // Store layout for hit detection
    layoutRef.current = { data, chartL, barH, gap, maxVal, chartW, padT };

    // Bars with value-based opacity
    const dataMax = Math.max(...data.map(d => d.value), 1);
    data.forEach((d, i) => {
      const y = padT + gap + i * (barH + gap);
      const bw = (d.value / maxVal) * chartW;
      const isSelected = selectedProv === d.name;
      const valueOpacity = 0.3 + (d.value / dataMax) * 0.7;
      const dimmed = selectedProv && !isSelected;

      ctx.globalAlpha = dimmed ? 0.3 : 1;

      // Bar with value-based opacity
      const grad = ctx.createLinearGradient(chartL, 0, chartL + bw, 0);
      const alphaHex = Math.round(valueOpacity * 255).toString(16).padStart(2, '0');
      grad.addColorStop(0, catColor + Math.round(valueOpacity * 0.6 * 255).toString(16).padStart(2, '0'));
      grad.addColorStop(1, catColor + alphaHex);
      ctx.fillStyle = isSelected ? '#ffd60a' : grad;
      ctx.beginPath();
      ctx.roundRect(chartL, y, bw, barH, 3);
      ctx.fill();

      if (isSelected) {
        ctx.strokeStyle = '#ffd60a';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(chartL, y, bw, barH, 3);
        ctx.stroke();
      }

      // Province label
      ctx.fillStyle = isSelected ? '#ffd60a' : '#ccc';
      ctx.font = '11px "Noto Sans KR", sans-serif';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(d.name, padL, y + barH / 2);

      // Value
      ctx.fillStyle = isSelected ? '#ffd60a' : '#fff';
      ctx.font = '11px "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillText(d.value.toFixed(1), chartL + bw + 5, y + barH / 2);

      ctx.globalAlpha = 1;
    });

    // Average line
    const avgX = chartL + (avg / maxVal) * chartW;
    ctx.strokeStyle = '#00d4ff';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(avgX, padT);
    ctx.lineTo(avgX, padT + availH);
    ctx.stroke();
    ctx.setLineDash([]);

    // Average label
    ctx.fillStyle = '#00d4ff';
    ctx.font = '11px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`평균 ${avg}`, avgX, h - padB + 16);
  }, [category, gender, selectedProv]);

  useEffect(() => {
    draw();
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver(() => draw());
    obs.observe(el);
    return () => obs.disconnect();
  }, [draw]);

  const handleClick = (e) => {
    if (!layoutRef.current || !canvasRef.current) return;
    const { data, barH, gap, padT } = layoutRef.current;
    const rect = canvasRef.current.getBoundingClientRect();
    const my = e.clientY - rect.top;
    for (let i = 0; i < data.length; i++) {
      const y = padT + gap + i * (barH + gap);
      if (my >= y && my <= y + barH) {
        onProvClick?.(data[i].name);
        return;
      }
    }
  };

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', minHeight: 0 }}>
      <canvas ref={canvasRef} onClick={handleClick} style={{ width: '100%', height: '100%', cursor: 'pointer' }} />
    </div>
  );
}

// ── Age Distribution Bar Chart (Canvas 2D) ──
function AgeChart({ category, gender, selectedAge, onAgeClick }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const layoutRef = useRef(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const dpr = window.devicePixelRatio || 1;
    const w = container.clientWidth;
    const h = container.clientHeight;
    if (w <= 0 || h <= 0) return;
    canvas.width = w * dpr;
    canvas.height = h * dpr;

    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);

    const data = getAgeData(category, gender);
    const maxVal = Math.max(...data.map(d => d.value)) * 1.15;
    const dataMax = Math.max(...data.map(d => d.value), 1);
    const catColor = CATEGORIES.find(c => c.key === category).color;

    const padL = 55;
    const padR = 20;
    const padT = 16;
    const padB = 45;
    const chartW = w - padL - padR;
    const chartH = h - padT - padB;
    const barW = Math.min(28, (chartW / data.length) * 0.65);
    const step = chartW / data.length;

    layoutRef.current = { data, padL, padT, padB, chartH, barW, step, w, h };

    // Grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 4; i++) {
      const y = padT + (chartH / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(w - padR, y);
      ctx.stroke();

      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.font = '11px "JetBrains Mono", monospace';
      ctx.textAlign = 'right';
      ctx.fillText(((4 - i) / 4 * maxVal).toFixed(0), padL - 4, y + 3);
    }

    // Bars with value-based opacity
    data.forEach((d, i) => {
      const x = padL + step * i + (step - barW) / 2;
      const bh = (d.value / maxVal) * chartH;
      const y = padT + chartH - bh;
      const isSelected = selectedAge === d.label;
      const dimmed = selectedAge && !isSelected;
      const valueOpacity = 0.3 + (d.value / dataMax) * 0.7;

      ctx.globalAlpha = dimmed ? 0.3 : 1;

      const grad = ctx.createLinearGradient(0, y, 0, y + bh);
      const alphaHex = Math.round(valueOpacity * 255).toString(16).padStart(2, '0');
      grad.addColorStop(0, (isSelected ? '#ffd60a' : catColor) + alphaHex);
      grad.addColorStop(1, (isSelected ? '#ffd60a' : catColor) + Math.round(valueOpacity * 0.3 * 255).toString(16).padStart(2, '0'));
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(x, y, barW, bh, [3, 3, 0, 0]);
      ctx.fill();

      if (isSelected) {
        ctx.strokeStyle = '#ffd60a';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(x, y, barW, bh, [3, 3, 0, 0]);
        ctx.stroke();
      }

      // Value on top
      ctx.fillStyle = isSelected ? '#ffd60a' : '#fff';
      ctx.font = '11px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(d.value.toFixed(1), x + barW / 2, y - 3);

      // Age label
      ctx.save();
      ctx.translate(x + barW / 2, padT + chartH + 6);
      ctx.rotate(Math.PI / 4);
      ctx.fillStyle = isSelected ? '#ffd60a' : '#aaa';
      ctx.font = '11px "Noto Sans KR", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(d.label, 0, 0);
      ctx.restore();

      ctx.globalAlpha = 1;
    });
  }, [category, gender, selectedAge]);

  useEffect(() => {
    draw();
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver(() => draw());
    obs.observe(el);
    return () => obs.disconnect();
  }, [draw]);

  const handleClick = (e) => {
    if (!layoutRef.current || !canvasRef.current) return;
    const { data, padL, step, barW } = layoutRef.current;
    const rect = canvasRef.current.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    for (let i = 0; i < data.length; i++) {
      const x = padL + step * i + (step - barW) / 2;
      if (mx >= x && mx <= x + barW) {
        onAgeClick?.(data[i].label);
        return;
      }
    }
  };

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', minHeight: 0 }}>
      <canvas ref={canvasRef} onClick={handleClick} style={{ width: '100%', height: '100%', cursor: 'pointer' }} />
    </div>
  );
}

// ── 10-Year Trends (SVG Line Chart) ──
function TrendChart({ category, onYearClick, selectedYear, selectedProv }) {
  const containerRef = useRef(null);
  const [size, setSize] = useState({ w: 400, h: 200 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      if (width > 0 && height > 0) setSize({ w: width, h: height });
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const trendKey = category === 'exercise' ? null : category;
  if (!trendKey) {
    return (
      <div ref={containerRef} style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: '#666', fontSize: '12px', fontFamily: '"Noto Sans KR", sans-serif' }}>
          운동 트렌드 데이터는 추후 업데이트 예정
        </span>
      </div>
    );
  }

  const years = LIFESTYLE_TRENDS.years;
  const trendData = LIFESTYLE_TRENDS[trendKey];
  const provinces = Object.keys(trendData);
  const allVals = provinces.flatMap(p => trendData[p]);
  const minVal = Math.floor(Math.min(...allVals) - 2);
  const maxVal = Math.ceil(Math.max(...allVals) + 2);

  const padL = 56;
  const padR = 70;
  const padT = 15;
  const padB = 40;
  const { w, h } = size;
  const chartW = w - padL - padR;
  const chartH = h - padT - padB;

  const xScale = (i) => padL + (i / (years.length - 1)) * chartW;
  const yScale = (v) => padT + chartH - ((v - minVal) / (maxVal - minVal)) * chartH;

  // Show only top 3 + bottom 3 + selected province
  const lastVals = provinces.map(p => ({ p, v: trendData[p][trendData[p].length - 1] }));
  lastVals.sort((a, b) => b.v - a.v);
  const highlightSet = new Set([
    ...lastVals.slice(0, 3).map(d => d.p),
    ...lastVals.slice(-3).map(d => d.p),
    ...(selectedProv && trendData[selectedProv] ? [selectedProv] : []),
  ]);

  const catColor = CATEGORIES.find(c => c.key === category).color;

  // Y grid
  const yTicks = [];
  const yStep = Math.ceil((maxVal - minVal) / 5);
  for (let v = minVal; v <= maxVal; v += yStep) yTicks.push(v);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
      <svg width={w} height={h} style={{ display: 'block' }}>
        {/* Y grid */}
        {yTicks.map(v => (
          <g key={v}>
            <line x1={padL} y1={yScale(v)} x2={w - padR} y2={yScale(v)} stroke="rgba(255,255,255,0.06)" />
            <text x={padL - 4} y={yScale(v) + 3} fill="#666" fontSize="11" fontFamily="JetBrains Mono" textAnchor="end">{v}</text>
          </g>
        ))}

        {/* X labels - clickable */}
        {years.map((yr, i) => (
          <text key={yr} x={xScale(i)} y={h - 6} fill={selectedYear === yr ? '#ffd60a' : '#888'} fontSize="11" fontFamily="JetBrains Mono" textAnchor="middle"
            style={{ cursor: 'pointer' }} onClick={() => onYearClick?.(yr)}
            fontWeight={selectedYear === yr ? 'bold' : 'normal'}>{yr}</text>
        ))}

        {/* Lines - faded (only non-highlighted) */}
        {provinces.filter(p => !highlightSet.has(p)).map(p => (
          <polyline
            key={p}
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="0.5"
            points={trendData[p].map((v, i) => `${xScale(i)},${yScale(v)}`).join(' ')}
          />
        ))}

        {/* Selected year indicator line */}
        {selectedYear && years.includes(selectedYear) && (
          <line x1={xScale(years.indexOf(selectedYear))} y1={padT} x2={xScale(years.indexOf(selectedYear))} y2={padT + chartH} stroke="#ffd60a" strokeWidth={1} strokeDasharray="4,3" opacity={0.5} />
        )}

        {/* Lines - highlighted (top3 + bottom3 + selected) */}
        {provinces.filter(p => highlightSet.has(p)).map((p) => {
          const isSelected = selectedProv === p;
          const isTop = lastVals.slice(0, 3).some(d => d.p === p);
          const lineColor = isSelected ? '#ffd60a' : isTop ? catColor : '#00d4ff';
          const lastIdx = trendData[p].length - 1;
          const lastY = yScale(trendData[p][lastIdx]);
          const lastX = xScale(lastIdx);
          return (
            <g key={p}>
              <polyline
                fill="none"
                stroke={lineColor}
                strokeWidth={isSelected ? 2.5 : 1.5}
                strokeOpacity={isSelected ? 1 : 0.8}
                points={trendData[p].map((v, i) => `${xScale(i)},${yScale(v)}`).join(' ')}
              />
              {/* Clickable data points */}
              {trendData[p].map((v, i) => (
                <circle key={i} cx={xScale(i)} cy={yScale(v)} r={selectedYear === years[i] ? 5 : 3}
                  fill={selectedYear === years[i] ? '#ffd60a' : lineColor}
                  style={{ cursor: 'pointer' }}
                  opacity={selectedYear === years[i] ? 1 : (i === lastIdx ? 1 : 0)}
                  onClick={() => onYearClick?.(years[i])}
                />
              ))}
              <text x={lastX + 6} y={lastY + 3} fill={lineColor} fontSize="11" fontFamily="Noto Sans KR" fontWeight={isSelected ? 700 : 400}>{p}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ── Gender Toggle ──
function GenderToggle({ value, onChange, accentColor }) {
  return (
    <div style={{ display: 'flex', gap: '4px' }}>
      {GENDERS.map(g => (
        <button
          key={g.key}
          onClick={() => onChange(g.key)}
          style={{
            padding: '3px 10px',
            fontSize: '11px',
            fontFamily: '"Noto Sans KR", sans-serif',
            borderRadius: '6px',
            border: value === g.key ? `1px solid ${accentColor}` : '1px solid rgba(255,255,255,0.1)',
            background: value === g.key ? accentColor + '22' : 'transparent',
            color: value === g.key ? accentColor : '#888',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          {g.label}
        </button>
      ))}
    </div>
  );
}

// ── Detail Panel Content ──
function DetailPanel({ category, selectedProv, selectedAge, selectedYear, provGender, ageGender }) {
  const cat = CATEGORIES.find(c => c.key === category);

  const SMOKE_CATS = ['비흡연', '현재금연', '현재흡연'];
  const DRINK_CATS = ['주1회이하', '주2-4회', '주5-7회', '월1회이상', '연1회이상', '비음주'];
  const EXERCISE_CATS = ['0일', '1일', '2일', '3일', '4일', '5일', '6일', '7일'];
  const CAT_MAP = { smoking: SMOKE_CATS, drinking: DRINK_CATS, exercise: EXERCISE_CATS };
  const catNames = CAT_MAP[category];

  const renderDistBars = (label, vals, color) => {
    if (!vals) return null;
    const maxV = Math.max(...vals, 1);
    return (
      <div style={{ marginBottom: '8px' }}>
        <div style={{ fontSize: '10px', color: color || '#ccc', fontWeight: 600, marginBottom: '3px' }}>{label}</div>
        {catNames.map((c, ci) => (
          <div key={ci} style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '1px' }}>
            <span style={{ fontSize: '10px', color: '#8888aa', width: '56px', textAlign: 'right', flexShrink: 0 }}>{c}</span>
            <div style={{ flex: 1, height: '7px', background: 'rgba(255,255,255,0.04)', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ width: `${(vals[ci] / maxV) * 100}%`, height: '100%', background: cat.color, opacity: 0.3 + (vals[ci] / maxV) * 0.7, borderRadius: '2px' }} />
            </div>
            <span style={{ fontSize: '9px', color: '#ccccdd', width: '36px', fontFamily: '"JetBrains Mono", monospace' }}>{vals[ci]}%</span>
          </div>
        ))}
      </div>
    );
  };

  // Province selected
  if (selectedProv) {
    return (
      <div style={{ overflowY: 'auto', height: '100%' }}>
        <div style={{ marginBottom: '8px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#e0e0ff', marginBottom: '2px' }}>{selectedProv}</div>
          <div style={{ fontSize: '10px', color: '#8888aa' }}>
            {provGender === 'male' ? '남성' : provGender === 'female' ? '여성' : '전체'} 기준
          </div>
          <div style={{ fontSize: '10px', color: cat.color, marginTop: '4px', fontWeight: 600 }}>{METRIC_LABELS[category]}</div>
          <div style={{ fontSize: '16px', fontWeight: 700, color: '#fff', fontFamily: '"JetBrains Mono", monospace' }}>
            {getMetricValue(category, LIFESTYLE_DATA[category].province[selectedProv]?.[provGender] || [0,0,0])}%
          </div>
        </div>
        {CATEGORIES.map(c => {
          const vals = LIFESTYLE_DATA[c.key].province[selectedProv]?.[provGender];
          return vals ? renderDistBars(`${c.icon} ${c.label}`, vals, c.color) : null;
        })}
      </div>
    );
  }

  // Age selected
  if (selectedAge) {
    return (
      <div style={{ overflowY: 'auto', height: '100%' }}>
        <div style={{ marginBottom: '8px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#e0e0ff', marginBottom: '2px' }}>{selectedAge}세</div>
          <div style={{ fontSize: '10px', color: '#8888aa' }}>
            {ageGender === 'male' ? '남성' : ageGender === 'female' ? '여성' : '전체'} 기준
          </div>
          <div style={{ fontSize: '10px', color: cat.color, marginTop: '4px', fontWeight: 600 }}>{METRIC_LABELS[category]}</div>
          <div style={{ fontSize: '16px', fontWeight: 700, color: '#fff', fontFamily: '"JetBrains Mono", monospace' }}>
            {getMetricValue(category, LIFESTYLE_DATA[category].age[selectedAge]?.[ageGender] || [0,0,0])}%
          </div>
        </div>
        {CATEGORIES.map(c => {
          const vals = LIFESTYLE_DATA[c.key].age[selectedAge]?.[ageGender];
          return vals ? renderDistBars(`${c.icon} ${c.label}`, vals, c.color) : null;
        })}
      </div>
    );
  }

  // Year selected
  if (selectedYear) {
    const trendKey = category === 'exercise' ? null : category;
    if (!trendKey) return <div style={{ color: '#666', fontSize: '11px' }}>운동 트렌드 데이터 없음</div>;
    const yearIdx = LIFESTYLE_TRENDS.years.indexOf(selectedYear);
    const trendData = LIFESTYLE_TRENDS[trendKey];
    const yearVals = Object.entries(trendData).map(([p, vals]) => ({ name: p, value: vals[yearIdx] })).sort((a, b) => b.value - a.value);
    const maxV = Math.max(...yearVals.map(d => d.value), 1);
    return (
      <div style={{ overflowY: 'auto', height: '100%' }}>
        <div style={{ fontSize: '12px', fontWeight: 700, color: '#ffd60a', marginBottom: '6px' }}>{selectedYear}년 {cat.label}</div>
        {yearVals.map((d, i) => (
          <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
            <span style={{ fontSize: '10px', color: i < 3 ? cat.color : i >= yearVals.length - 3 ? '#00d4ff' : '#8888aa', width: '36px', textAlign: 'right', flexShrink: 0 }}>{d.name}</span>
            <div style={{ flex: 1, height: '7px', background: 'rgba(255,255,255,0.04)', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ width: `${(d.value / maxV) * 100}%`, height: '100%', background: i < 3 ? cat.color : '#00d4ff', opacity: 0.3 + (d.value / maxV) * 0.7, borderRadius: '2px' }} />
            </div>
            <span style={{ fontSize: '10px', color: '#ccccdd', fontFamily: '"JetBrains Mono", monospace', width: '40px' }}>{d.value}%</span>
          </div>
        ))}
      </div>
    );
  }

  // Default: national summary
  return (
    <div style={{ overflowY: 'auto', height: '100%' }}>
      <div style={{ fontSize: '12px', fontWeight: 700, color: '#e0e0ff', marginBottom: '8px' }}>전국 평균 요약</div>
      {CATEGORIES.map(c => {
        const avg = getNationalAvg(c.key, 'total');
        const ranking = getProvinceRanking(c.key, 'total');
        const top = ranking[0];
        const bottom = ranking[ranking.length - 1];
        return (
          <div key={c.key} style={{ marginBottom: '10px', padding: '6px 8px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
              <span>{c.icon}</span>
              <span style={{ fontSize: '11px', color: c.color, fontWeight: 600 }}>{c.label}</span>
              <span style={{ fontSize: '14px', fontWeight: 700, color: '#fff', fontFamily: '"JetBrains Mono", monospace', marginLeft: 'auto' }}>{avg}%</span>
            </div>
            <div style={{ fontSize: '10px', color: '#8888aa', display: 'flex', justifyContent: 'space-between' }}>
              <span>최고: <span style={{ color: c.color }}>{top.name} {top.value}%</span></span>
              <span>최저: <span style={{ color: '#00d4ff' }}>{bottom.name} {bottom.value}%</span></span>
            </div>
          </div>
        );
      })}
      <div style={{ fontSize: '10px', color: '#555', marginTop: '4px' }}>차트를 클릭하면 상세 정보가 표시됩니다</div>
    </div>
  );
}

// ── Main Export ──
export default function Lifestyle() {
  const [category, setCategory] = useState('smoking');
  const [provGender, setProvGender] = useState('total');
  const [ageGender, setAgeGender] = useState('total');
  const [selectedProv, setSelectedProv] = useState(null);
  const [selectedAge, setSelectedAge] = useState(null);
  const [selectedYear, setSelectedYear] = useState(null);
  const [trendView, setTrendView] = useState('line'); // 'line' | 'bump'
  const [bumpMetric, setBumpMetric] = useState('obesity');

  const cat = CATEGORIES.find(c => c.key === category);

  const handleProvClick = (name) => {
    setSelectedProv(prev => prev === name ? null : name);
    setSelectedAge(null);
    setSelectedYear(null);
  };
  const handleAgeClick = (label) => {
    setSelectedAge(prev => prev === label ? null : label);
    // Keep selectedProv so trend chart stays highlighted
    setSelectedYear(null);
  };
  const handleYearClick = (yr) => {
    setSelectedYear(prev => prev === yr ? null : yr);
    // Keep selectedProv so trend chart stays highlighted
    setSelectedAge(null);
  };

  return (
    <div style={{
      height: 'calc(100vh - 56px)',
      marginTop: '56px',
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gridTemplateRows: 'auto 1fr 1fr',
      gap: '10px',
      padding: '12px',
      overflow: 'hidden',
      background: '#0a0a0f',
      fontFamily: '"Noto Sans KR", sans-serif',
    }}>
      {/* Row 1: Category Selector (full width) */}
      <div style={{
        gridColumn: '1 / -1',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}>
        <span style={{ color: '#666', fontSize: '12px', marginRight: '4px' }}>생활습관</span>
        {CATEGORIES.map(c => (
          <button
            key={c.key}
            onClick={() => setCategory(c.key)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 18px',
              fontSize: '13px',
              fontFamily: '"Noto Sans KR", sans-serif',
              fontWeight: category === c.key ? 600 : 400,
              borderRadius: '8px',
              border: category === c.key ? `1.5px solid ${c.color}` : '1.5px solid rgba(255,255,255,0.08)',
              background: category === c.key ? c.color + '18' : 'rgba(255,255,255,0.02)',
              color: category === c.key ? c.color : '#888',
              cursor: 'pointer',
              transition: 'all 0.25s',
              boxShadow: category === c.key ? `0 0 12px ${c.color}33` : 'none',
            }}
          >
            <span>{c.icon}</span>
            <span>{c.label}</span>
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <span style={{ color: '#555', fontSize: '11px', fontFamily: '"JetBrains Mono", monospace' }}>
          {METRIC_LABELS[category]}
        </span>
      </div>

      {/* Row 2 Left: Province Comparison */}
      <div style={{ ...PANEL, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexShrink: 0 }}>
          <span style={{ color: '#ccc', fontSize: '13px', fontWeight: 600 }}>시도별 비교</span>
          <GenderToggle value={provGender} onChange={setProvGender} accentColor={cat.color} />
        </div>
        <div style={{ flex: 1, minHeight: 0 }}>
          <ProvinceChart category={category} gender={provGender} selectedProv={selectedProv} onProvClick={handleProvClick} />
        </div>
      </div>

      {/* Row 2 Right: Age Distribution */}
      <div style={{ ...PANEL, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexShrink: 0 }}>
          <span style={{ color: '#ccc', fontSize: '13px', fontWeight: 600 }}>연령별 분포</span>
          <GenderToggle value={ageGender} onChange={setAgeGender} accentColor={cat.color} />
        </div>
        <div style={{ flex: 1, minHeight: 0 }}>
          <AgeChart category={category} gender={ageGender} selectedAge={selectedAge} onAgeClick={handleAgeClick} />
        </div>
      </div>

      {/* Row 3 Left: 10-year Trends */}
      <div style={{ ...PANEL, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ color: '#ccc', fontSize: '13px', fontWeight: 600 }}>
              {trendView === 'line' ? `10년 추이` : '순위 변동'}
            </span>
            <div style={{ display: 'flex', gap: '3px' }}>
              {[
                { key: 'line', label: '추이' },
                { key: 'bump', label: '순위' },
              ].map(v => (
                <button key={v.key} onClick={() => setTrendView(v.key)} style={{
                  padding: '2px 8px', fontSize: '10px', borderRadius: '4px',
                  border: trendView === v.key ? `1px solid ${cat.color}` : '1px solid rgba(255,255,255,0.1)',
                  background: trendView === v.key ? `${cat.color}22` : 'transparent',
                  color: trendView === v.key ? cat.color : '#888',
                  cursor: 'pointer', transition: 'all 0.2s',
                  fontFamily: '"Noto Sans KR", sans-serif',
                }}>{v.label}</button>
              ))}
            </div>
          </div>
          {trendView === 'line' && (
            <span style={{ color: '#555', fontSize: '9px' }}>
              <span style={{ color: cat.color }}>●</span> 상위3 &nbsp;
              <span style={{ color: '#00d4ff' }}>●</span> 하위3
            </span>
          )}
          {trendView === 'bump' && (
            <div style={{ display: 'flex', gap: '4px' }}>
              {[
                { key: 'obesity', label: '비만율', color: '#ff006e' },
                { key: 'metabolic', label: '대사증후군', color: '#ffd60a' },
              ].map(m => (
                <button key={m.key} onClick={() => setBumpMetric(m.key)} style={{
                  padding: '2px 8px', fontSize: '10px', borderRadius: '4px',
                  border: `1px solid ${bumpMetric === m.key ? m.color : 'rgba(255,255,255,0.1)'}`,
                  background: bumpMetric === m.key ? `${m.color}22` : 'transparent',
                  color: bumpMetric === m.key ? m.color : '#888',
                  cursor: 'pointer', fontFamily: '"Noto Sans KR", sans-serif',
                }}>{m.label}</button>
              ))}
            </div>
          )}
        </div>
        <div style={{ flex: 1, minHeight: 0 }}>
          {trendView === 'line' ? (
            <TrendChart category={category} selectedYear={selectedYear} onYearClick={handleYearClick} selectedProv={selectedProv} />
          ) : (
            <BumpChart metric={bumpMetric} onProvinceClick={(name) => setSelectedProv(name)} />
          )}
        </div>
      </div>

      {/* Row 3 Right: Detail Panel */}
      <div style={{
        ...PANEL,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        minHeight: 0,
        background: 'linear-gradient(145deg, rgba(26,26,46,0.85) 0%, rgba(18,18,26,0.9) 100%)',
        borderColor: (selectedProv || selectedAge || selectedYear) ? `${cat.color}33` : 'rgba(255,255,255,0.06)',
      }}>
        <div style={{ fontSize: '11px', color: '#888', marginBottom: '6px', flexShrink: 0, fontWeight: 600 }}>
          {selectedProv ? '지역 상세' : selectedAge ? '연령 상세' : selectedYear ? '연도 상세' : '요약'}
        </div>
        <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
          <DetailPanel
            category={category}
            selectedProv={selectedProv}
            selectedAge={selectedAge}
            selectedYear={selectedYear}
            provGender={provGender}
            ageGender={ageGender}
          />
        </div>
      </div>
    </div>
  );
}
