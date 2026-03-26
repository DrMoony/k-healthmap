import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import KoreaMap from '../components/KoreaMap';
import { PROVINCE_INFO, NATIONAL_AVG } from '../data/province_info';
import { STROKE_KOSIS } from '../data/stroke_kosis';
import { STROKE_KSR } from '../data/stroke_ksr';

const PROVINCES = [
  '서울','부산','대구','인천','광주','대전','울산','세종',
  '경기','강원','충북','충남','전북','전남','경북','경남','제주',
];

const AGE_GROUPS_KOSIS = ['1세미만','1~9세','10~19세','20~29세','30~39세','40~49세','50~59세','60~69세','70~79세','80세이상'];
const AGE_LABELS = ['<1','1-9','10-19','20-29','30-39','40-49','50-59','60-69','70-79','80+'];

// ── Utilities ────────────────────────────────────

function gradientColor(t) {
  t = Math.max(0, Math.min(1, t));
  const r = Math.round(0 + t * 255);
  const g = Math.round(212 - t * 212);
  const b = Math.round(255 - t * 100);
  return `rgb(${r},${g},${b})`;
}

function rank(provName, field, ascending = false) {
  const sorted = PROVINCES
    .filter(p => PROVINCE_INFO[p]?.[field] != null)
    .sort((a, b) => ascending
      ? PROVINCE_INFO[a][field] - PROVINCE_INFO[b][field]
      : PROVINCE_INFO[b][field] - PROVINCE_INFO[a][field]
    );
  return sorted.indexOf(provName) + 1;
}

function getPatientCount(provName) {
  const d = STROKE_KOSIS?.regionPatients?.[provName];
  if (!d) return null;
  return d['2024'] || d['2023'] || d['2022'] || null;
}

function getAgeDistribution(gender = '전체') {
  const genderData = STROKE_KOSIS?.byGenderAge?.[gender];
  if (!genderData) return null;
  return AGE_GROUPS_KOSIS.map(ag => {
    const v = genderData[ag];
    return v ? (v['2021'] || v['2020'] || v['2019'] || 0) : 0;
  });
}

const TRANSPORT_LABELS = ['<1h', '1-2h', '2-3h', '3-6h', '6h+'];
const TRANSPORT_KEYS = ['1시간미만', '1~2시간', '2~3시간', '3~6시간', '6시간이상'];

const OUTCOME_KEYS = ['퇴가', '입원', '전원', '사망', '기타'];
const OUTCOME_COLORS = ['#00ff88', '#00d4ff', '#ffd60a', '#ff4444', '#888'];
const OUTCOME_LABELS = ['퇴가', '입원', '전원', '사망', '기타'];

function getOutcomeDist(regionName) {
  const data = STROKE_KOSIS?.regionByOutcome?.[regionName];
  if (!data) return null;
  const yr = '2023';
  const raw = OUTCOME_KEYS.map(k => {
    const v = data[k];
    return v ? (v[yr] || v['2022'] || 0) : 0;
  });
  const total = raw.reduce((s, v) => s + v, 0);
  if (total === 0) return null;
  return raw.map(v => Math.round((v / total) * 1000) / 10);
}

function getTransportDist(regionName) {
  const region = regionName || '전체';
  const data = STROKE_KOSIS?.transportByRegion?.[region];
  if (!data) return null;
  const yr = '2023';
  return TRANSPORT_KEYS.map(k => {
    const v = data[k];
    return v ? (v[yr] || v['2022'] || 0) : 0;
  });
}

// ── CompareBar component ────────────────────────────────────

function CompareBar({ label, value, national, unit = '', higherIsWorse = true, width = '100%' }) {
  const diff = value - national;
  const isWorse = higherIsWorse ? diff > 0 : diff < 0;
  const barWidth = Math.min(100, (Math.max(value, national) !== 0 ? (value / Math.max(value, national)) * 100 : 50));
  const natBarWidth = Math.min(100, (Math.max(value, national) !== 0 ? (national / Math.max(value, national)) * 100 : 50));

  return (
    <div style={{ marginBottom: '8px', width }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '3px' }}>
        <span style={{ color: '#8888aa' }}>{label}</span>
        <span style={{ color: isWorse ? '#ff6b6b' : '#00ff88', fontFamily: "'JetBrains Mono'", fontWeight: 700 }}>
          {typeof value === 'number' ? value.toFixed(1) : value}{unit}
          <span style={{ color: '#555', marginLeft: '4px', fontSize: '10px' }}>
            ({diff >= 0 ? '+' : ''}{diff.toFixed(1)})
          </span>
        </span>
      </div>
      <div style={{ position: 'relative', height: '6px', background: 'rgba(255,255,255,0.04)', borderRadius: '3px' }}>
        <div style={{
          position: 'absolute', height: '100%', borderRadius: '3px',
          width: `${barWidth}%`,
          background: isWorse ? 'linear-gradient(90deg, #ff4444, #ff6b6b)' : 'linear-gradient(90deg, #00cc66, #00ff88)',
          opacity: 0.8,
        }} />
        <div style={{
          position: 'absolute', left: `${natBarWidth}%`, top: '-2px', bottom: '-2px',
          width: '2px', background: '#00d4ff', borderRadius: '1px',
        }} />
      </div>
    </div>
  );
}

// ── HBar component ────────────────────────────────────

function HBar({ data, maxVal, highlightName, nationalAvg, labelWidth = 36, height = 22, onClick }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', width: '100%' }}>
      {data.map(({ name, value }, i) => {
        const t = maxVal > 0 ? value / maxVal : 0;
        const isHighlight = name === highlightName;
        return (
          <div
            key={name}
            onClick={() => onClick?.(name)}
            style={{
              display: 'flex', alignItems: 'center', gap: '4px', height: `${height}px`,
              cursor: 'pointer', padding: '0 2px', borderRadius: '4px',
              background: isHighlight ? 'rgba(255,214,10,0.1)' : 'transparent',
            }}
          >
            <span style={{
              width: `${labelWidth}px`, fontSize: '11px', textAlign: 'right',
              color: isHighlight ? '#ffd60a' : '#8888aa', fontWeight: isHighlight ? 700 : 400,
              flexShrink: 0, fontFamily: "'Noto Sans KR'",
            }}>{name}</span>
            <div style={{ flex: 1, position: 'relative', height: '14px', background: 'rgba(255,255,255,0.03)', borderRadius: '3px' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${t * 100}%` }}
                transition={{ duration: 0.6, delay: i * 0.02 }}
                style={{
                  height: '100%', borderRadius: '3px',
                  background: `linear-gradient(90deg, ${gradientColor(t * 0.3)}, ${gradientColor(t)})`,
                  border: isHighlight ? '1px solid rgba(255,214,10,0.5)' : 'none',
                }}
              />
              {nationalAvg != null && (
                <div style={{
                  position: 'absolute', left: `${(nationalAvg / maxVal) * 100}%`,
                  top: '-1px', bottom: '-1px', width: '1.5px',
                  background: '#ffaa00', opacity: 0.7,
                }} />
              )}
            </div>
            <span style={{
              width: '48px', fontSize: '11px', textAlign: 'right',
              fontFamily: "'JetBrains Mono'", fontWeight: isHighlight ? 800 : 500,
              color: isHighlight ? '#ffd60a' : '#bbb', flexShrink: 0,
            }}>
              {typeof value === 'number' ? (value >= 1000 ? value.toLocaleString() : value.toFixed(1)) : value}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── VerticalBar chart ────────────────────────

function VerticalBarChart({ data, labels, title, color = '#00d4ff', maxOverride }) {
  const max = maxOverride || Math.max(...data, 1);
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {title && <div style={{ fontSize: '11px', color: '#8888aa', marginBottom: '6px', fontWeight: 600 }}>{title}</div>}
      <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: '3px', minHeight: 0 }}>
        {data.map((v, i) => {
          const t = max > 0 ? v / max : 0;
          return (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
              <span style={{ fontSize: '9px', color: '#888', fontFamily: "'JetBrains Mono'", marginBottom: '2px' }}>
                {v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}
              </span>
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${t * 100}%` }}
                transition={{ duration: 0.5, delay: i * 0.03 }}
                style={{
                  width: '100%', minHeight: '2px', borderRadius: '3px 3px 0 0',
                  background: typeof color === 'function' ? color(t) : `linear-gradient(180deg, ${gradientColor(t)}, ${gradientColor(t * 0.3)})`,
                }}
              />
              <span style={{ fontSize: '9px', color: '#666', marginTop: '3px', whiteSpace: 'nowrap' }}>
                {labels[i]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Panel (reusable styled container) ────────────────────────

function Panel({ children, style = {}, onClick }) {
  return (
    <div onClick={onClick} style={{
      background: 'linear-gradient(145deg, #1a1a2e 0%, #12121a 100%)',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: '12px',
      padding: '14px',
      overflow: 'hidden',
      ...style,
    }}>
      {children}
    </div>
  );
}

// ── KPI Mini Card ────────────────────────────────────

function KPIMini({ label, value, unit, icon, color = '#00d4ff', source, warning, onClick, provinceName, nationalValue }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: 'linear-gradient(145deg, #1a1a2e 0%, #12121a 100%)',
        border: provinceName ? '1px solid rgba(255,214,10,0.25)' : '1px solid rgba(255,255,255,0.06)',
        borderRadius: '10px',
        padding: '10px 12px',
        position: 'relative',
        overflow: 'hidden',
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: provinceName ? 'linear-gradient(90deg, transparent, #ffd60a, transparent)' : `linear-gradient(90deg, transparent, ${color}, transparent)`, opacity: 0.5 }} />
      {provinceName && <div style={{ fontSize: '9px', color: '#ffd60a', fontWeight: 600, marginBottom: '2px' }}>{provinceName}</div>}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
        <span style={{ fontSize: '13px' }}>{icon}</span>
        <span style={{ fontSize: '10px', color: '#8888aa' }}>{label}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px' }}>
        <span style={{ fontSize: '20px', fontWeight: 900, fontFamily: "'JetBrains Mono'", color: provinceName ? '#ffd60a' : color, textShadow: `0 0 12px ${provinceName ? '#ffd60a' : color}44` }}>
          {value}
        </span>
        <span style={{ fontSize: '10px', color: '#666' }}>{unit}</span>
      </div>
      {provinceName && nationalValue != null && (
        <div style={{ fontSize: '9px', color: '#666', marginTop: '1px', fontFamily: "'JetBrains Mono', monospace" }}>
          전국 {nationalValue}{unit}
        </div>
      )}
      {warning && (
        <div style={{ fontSize: '8px', color: '#ffaa00', marginTop: '2px' }}>{warning}</div>
      )}
      {source && (
        <div style={{ fontSize: '8px', color: '#555', marginTop: '3px', fontFamily: "'JetBrains Mono', monospace" }}>
          {source}
        </div>
      )}
    </div>
  );
}

// ── Donut Chart (TOAST / Severity) ────────────────────────

function DonutChart({ segments, size = 120, innerRatio = 0.55, centerLabel, onSegmentClick }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  let cumAngle = -90;
  const paths = segments.map((seg, i) => {
    const angle = (seg.value / total) * 360;
    const startAngle = cumAngle;
    const endAngle = cumAngle + angle;
    cumAngle = endAngle;
    const r = size / 2;
    const ir = r * innerRatio;
    const cx = size / 2;
    const cy = size / 2;
    const toRad = (deg) => (deg * Math.PI) / 180;
    const x1 = cx + r * Math.cos(toRad(startAngle));
    const y1 = cy + r * Math.sin(toRad(startAngle));
    const x2 = cx + r * Math.cos(toRad(endAngle));
    const y2 = cy + r * Math.sin(toRad(endAngle));
    const ix1 = cx + ir * Math.cos(toRad(endAngle));
    const iy1 = cy + ir * Math.sin(toRad(endAngle));
    const ix2 = cx + ir * Math.cos(toRad(startAngle));
    const iy2 = cy + ir * Math.sin(toRad(startAngle));
    const largeArc = angle > 180 ? 1 : 0;
    const d = `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} L ${ix1} ${iy1} A ${ir} ${ir} 0 ${largeArc} 0 ${ix2} ${iy2} Z`;
    return (
      <path
        key={i}
        d={d}
        fill={seg.color}
        stroke="#12121a"
        strokeWidth="1"
        style={{ cursor: onSegmentClick ? 'pointer' : 'default', opacity: 0.85 }}
        onClick={() => onSegmentClick?.(seg)}
      >
        <title>{seg.label}: {seg.value}%</title>
      </path>
    );
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {paths}
      {centerLabel && (
        <text x={size/2} y={size/2} textAnchor="middle" dominantBaseline="middle"
          fill="#e8e8f0" fontSize="10" fontFamily="'JetBrains Mono'" fontWeight="700">
          {centerLabel}
        </text>
      )}
    </svg>
  );
}

// ── StackedBar ────────────────────────

function StackedBar({ segments, height = 28, showLabels = true, onClick }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  return (
    <div>
      <div style={{ display: 'flex', height: `${height}px`, borderRadius: '6px', overflow: 'hidden', cursor: onClick ? 'pointer' : 'default' }}>
        {segments.map((seg, i) => {
          const pct = total > 0 ? (seg.value / total) * 100 : 0;
          return (
            <motion.div
              key={i}
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              onClick={() => onClick?.(seg)}
              style={{
                background: seg.color,
                height: '100%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '9px', fontWeight: 700, color: '#fff',
                fontFamily: "'JetBrains Mono'",
                overflow: 'hidden',
                whiteSpace: 'nowrap',
              }}
            >
              {pct > 10 ? `${seg.value}%` : ''}
            </motion.div>
          );
        })}
      </div>
      {showLabels && (
        <div style={{ display: 'flex', gap: '8px', marginTop: '6px', flexWrap: 'wrap' }}>
          {segments.map((seg, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: seg.color }} />
              <span style={{ fontSize: '10px', color: '#8888aa' }}>{seg.label}</span>
              <span style={{ fontSize: '10px', color: '#bbb', fontFamily: "'JetBrains Mono'", fontWeight: 700 }}>{seg.value}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── TrendLine (dual-line mini chart) ────────────────────────

function TrendLineChart({ title, lines, years }) {
  const allVals = lines.flatMap(l => l.data);
  const minV = Math.min(...allVals) * 0.8;
  const maxV = Math.max(...allVals) * 1.1;
  const w = 260, h = 120, padL = 32, padR = 10, padT = 10, padB = 24;
  const plotW = w - padL - padR;
  const plotH = h - padT - padB;

  function toX(i) { return padL + (i / (years.length - 1)) * plotW; }
  function toY(v) { return padT + plotH - ((v - minV) / (maxV - minV)) * plotH; }

  return (
    <div style={{ width: '100%' }}>
      {title && <div style={{ fontSize: '11px', fontWeight: 700, color: '#e8e8f0', marginBottom: '6px' }}>{title}</div>}
      <svg width="100%" viewBox={`0 0 ${w} ${h}`} style={{ overflow: 'visible' }}>
        {/* grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((t, i) => {
          const y = padT + plotH * (1 - t);
          const val = minV + t * (maxV - minV);
          return (
            <g key={i}>
              <line x1={padL} y1={y} x2={w - padR} y2={y} stroke="rgba(255,255,255,0.05)" />
              <text x={padL - 4} y={y + 3} textAnchor="end" fill="#555" fontSize="8" fontFamily="'JetBrains Mono'">{val.toFixed(1)}</text>
            </g>
          );
        })}
        {/* x axis labels */}
        {years.map((yr, i) => (
          <text key={yr} x={toX(i)} y={h - 4} textAnchor="middle" fill="#666" fontSize="8" fontFamily="'JetBrains Mono'">{yr}</text>
        ))}
        {/* lines */}
        {lines.map((line, li) => {
          const pts = line.data.map((v, i) => `${toX(i)},${toY(v)}`).join(' ');
          return (
            <g key={li}>
              <polyline points={pts} fill="none" stroke={line.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              {line.data.map((v, i) => (
                <circle key={i} cx={toX(i)} cy={toY(v)} r="3" fill={line.color} stroke="#12121a" strokeWidth="1" />
              ))}
              <text x={toX(line.data.length - 1) + 4} y={toY(line.data[line.data.length - 1]) + 3}
                fill={line.color} fontSize="9" fontFamily="'JetBrains Mono'" fontWeight="700">
                {line.data[line.data.length - 1]}%
              </text>
            </g>
          );
        })}
      </svg>
      <div style={{ display: 'flex', gap: '12px', marginTop: '4px', justifyContent: 'center' }}>
        {lines.map((line, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{ width: '12px', height: '2px', background: line.color, borderRadius: '1px' }} />
            <span style={{ fontSize: '10px', color: '#8888aa' }}>{line.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Detail Popup ────────────────────────

function DetailPopup({ title, content, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        background: 'linear-gradient(145deg, #1e1e35 0%, #14141f 100%)',
        border: '1px solid rgba(0,212,255,0.2)',
        borderRadius: '16px', padding: '20px', maxWidth: '420px', width: '90%',
        zIndex: 1000, boxShadow: '0 20px 60px rgba(0,0,0,0.7)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <span style={{ fontSize: '14px', fontWeight: 800, color: '#e8e8f0' }}>{title}</span>
        <button onClick={onClose} style={{
          background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%',
          width: '24px', height: '24px', color: '#888', cursor: 'pointer', fontSize: '14px',
        }}>x</button>
      </div>
      <div style={{ fontSize: '12px', color: '#ccc', lineHeight: 1.8 }}>{content}</div>
    </motion.div>
  );
}

// ════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════

export default function StrokeDashboard() {
  const [selectedProv, setSelectedProv] = useState(null);
  const [col2Metric, setCol2Metric] = useState('patients');
  const [gender, setGender] = useState('전체');
  const [detailPopup, setDetailPopup] = useState(null);

  const prov = selectedProv ? PROVINCE_INFO[selectedProv] : null;
  const KSR = STROKE_KSR;

  // ── Column 2 data: sorted province bars ────────────────

  const metricConfig = {
    patients:    { label: '환자수', unit: '명', field: null, natAvg: null, higherIsWorse: true },
    incidence:   { label: '발생률', unit: '/10만', field: 'strokeIncidence', natAvg: NATIONAL_AVG.strokeIncidence, higherIsWorse: true },
    mortality:   { label: '사망률', unit: '/10만', field: 'strokeMortality', natAvg: NATIONAL_AVG.strokeMortality, higherIsWorse: true },
    tpa:         { label: 'tPA 시행률', unit: '%', field: 'tpaRate', natAvg: NATIONAL_AVG.tpaRate, higherIsWorse: false },
    goldenTime:  { label: '3.5h 도착률', unit: '%', field: 'goldenTimeRate', natAvg: NATIONAL_AVG.goldenTimeRate, higherIsWorse: false },
  };

  const col2Data = useMemo(() => {
    if (col2Metric === 'patients') {
      return PROVINCES
        .map(name => ({ name, value: getPatientCount(name) || Math.round(PROVINCE_INFO[name].strokeIncidence * PROVINCE_INFO[name].population / 100000) }))
        .sort((a, b) => b.value - a.value);
    }
    const cfg = metricConfig[col2Metric];
    if (!cfg?.field) return [];
    return PROVINCES
      .map(name => ({ name, value: PROVINCE_INFO[name][cfg.field] || 0 }))
      .sort((a, b) => b.value - a.value);
  }, [col2Metric]);

  const col2Max = useMemo(() => Math.max(...col2Data.map(d => d.value), 1), [col2Data]);
  const col2NatAvg = metricConfig[col2Metric]?.natAvg || null;

  // ── Age distribution ────────────────

  const ageDist = useMemo(() => getAgeDistribution(gender), [gender]);

  // ── Rankings ────────────────

  const rankings = useMemo(() => {
    if (!selectedProv) return null;
    return {
      incidence: rank(selectedProv, 'strokeIncidence', false),
      mortality: rank(selectedProv, 'strokeMortality', false),
      tpa: rank(selectedProv, 'tpaRate', false),
      goldenTime: rank(selectedProv, 'goldenTimeRate', false),
    };
  }, [selectedProv]);

  const metricLabels = Object.fromEntries(Object.entries(metricConfig).map(([k, v]) => [k, v.label]));

  // ── TOAST click handler ────────────────

  const handleToastClick = (seg) => {
    const toastInfo = {
      '대혈관 죽상경화': '대동맥 또는 주요 뇌동맥의 죽상경화증. 경동맥 내막절제술, 스텐트, 항혈소판제 이중요법 등이 치료에 사용됨. KSR에서 10년간 감소 추세.',
      '소혈관 폐색': '소동맥의 경색 (라쿠나 경색). 주로 고혈압, 당뇨와 연관. KSR에서 10년간 증가 추세 - 고혈압/당뇨 관리 강화 필요.',
      '심인성 색전': '심방세동 등에서 심장 유래 혈전. 항응고제(DOAC) 치료. AF 환자의 46%가 입원 시 첫 진단 - 사전 스크리닝 부족.',
      '기타/불명': '기타 원인(혈관박리, 혈액질환 등) 또는 원인 불명. 전체의 약 27%를 차지.',
    };
    setDetailPopup({ title: `TOAST: ${seg.label}`, content: toastInfo[seg.label] || seg.label });
  };

  // ── Risk factor click handler ────────────────

  const handleRiskClick = (key) => {
    const info = {
      hypertension: '고혈압: 허혈성 뇌졸중 환자의 67.9%에서 동반. 91%는 기존에 진단된 환자로, 조절 불량이 문제. 수축기혈압 10mmHg 감소 시 뇌졸중 위험 약 30% 감소.',
      dyslipidemia: '이상지질혈증: 42.5%에서 동반. 42%는 입원 시 처음 진단 - 건강검진 사각지대. 스타틴 치료로 재발 예방 효과.',
      diabetes: '당뇨: 34.3%에서 동반. 87%는 기존 진단자. 당뇨 동반 시 뇌졸중 예후가 불량하며 재발률도 높음.',
      smoking: '현재 흡연: 21.7%. 흡연은 뇌졸중 위험을 2배 이상 증가시킴. 금연 후 5년 이내 비흡연자 수준으로 감소.',
      atrialFib: '심방세동: 20%에서 동반. 46%가 뇌졸중으로 입원하여 처음 진단 - 사전 AF 스크리닝이 매우 부족함. DOAC 예방 치료 필요.',
    };
    setDetailPopup({ title: '위험인자 상세', content: info[key] || '' });
  };

  // ── Severity click handler ────────────────

  const handleSeverityClick = (seg) => {
    const info = {
      'NIHSS 0-3 경증': `경증 환자 54.8% (10년간 증가 추세). mRS 0-1 달성률 높음. 조기 퇴원·외래 재활 가능. 그러나 경증이라도 재발 예방 치료(항혈소판제/항응고제) 필수.`,
      'NIHSS 4-14 중등도': `중등도 35.7%. tPA/혈전제거술의 주요 대상군. 적극적 재관류 치료 시 mRS 0-2 달성 가능성 높음. 재활치료 병행 필요.`,
      'NIHSS 15+ 중증': `중증 9.5% (10년간 12%→9.5% 감소). 혈전제거술 적응증. 원내 사망률 높고 장기 장애 위험. 전문 뇌졸중 집중치료실(SU) 필요.`,
    };
    setDetailPopup({ title: `중증도: ${seg.label}`, content: info[seg.label] || '' });
  };

  // ── mRS click handler ────────────────

  const handleMrsClick = (seg) => {
    const info = {
      'mRS 0-1 좋은예후': `44.1% (10년간 39.7%→44.1% 개선). 독립적 일상생활 가능. 직장 복귀 가능 수준. 재발 예방 약물 치료 + 생활습관 관리로 장기 예후 유지.`,
      'mRS 2 경미장애': `17.1% (mRS 0-2 합산 61.2%). 경미한 장애 있으나 독립적 생활 가능. 외래 재활 + 이차예방 약물. 운전, 업무 등 일부 제한 가능.`,
      'mRS 3-5 장애': `36.2%. 보조 필요~중증 장애. 입원 재활 → 지역사회 재활 연계 필요. 요양시설 또는 가정간호. 돌봄 부담 큼.`,
      'mRS 6 원내사망': `2.6% (10년간 1.0%→2.6% 증가). 고령 환자 증가(85세+ 2배)가 주 원인. 중증(NIHSS 15+) 환자의 사망률이 가장 높음.`,
    };
    setDetailPopup({ title: `예후: ${seg.label}`, content: info[seg.label] || '' });
  };

  return (
    <div style={{
      position: 'fixed',
      top: '56px',
      left: 0,
      right: 0,
      bottom: 0,
      background: '#0a0a0f',
      display: 'grid',
      gridTemplateColumns: '300px 1fr 1fr 320px',
      gridTemplateRows: '1fr',
      gap: '12px',
      padding: '12px',
      fontFamily: "'Noto Sans KR', sans-serif",
      overflow: 'hidden',
    }}>

      {/* Detail popup overlay */}
      <AnimatePresence>
        {detailPopup && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setDetailPopup(null)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 999 }}
            />
            <DetailPopup title={detailPopup.title} content={detailPopup.content} onClose={() => setDetailPopup(null)} />
          </>
        )}
      </AnimatePresence>

      {/* ═══════ COLUMN 1: Map + 6 KPIs ═══════ */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflow: 'hidden' }}>
        <Panel style={{ flex: '0 0 auto', display: 'flex', justifyContent: 'center', padding: '8px' }}>
          <div style={{ width: '100%', maxWidth: '260px' }}>
            <KoreaMap metric="stroke" onProvinceClick={(name) => setSelectedProv(prev => prev === name ? null : name)} />
          </div>
        </Panel>

        {selectedProv && (
          <div style={{ background: '#ffd60a22', border: '1px solid #ffd60a44', borderRadius: 8, padding: '6px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#ffd60a', fontWeight: 700, fontSize: 14 }}>{selectedProv}</span>
            <button onClick={() => setSelectedProv(null)} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: 12 }}>✕ 전국으로</button>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
          <KPIMini label="발생률"
            value={selectedProv && prov ? prov.strokeIncidence : NATIONAL_AVG.strokeIncidence}
            unit="/10만" icon="📊" color="#00d4ff" source="KDCA 2022"
            provinceName={selectedProv && prov ? selectedProv : null}
            nationalValue={selectedProv && prov ? NATIONAL_AVG.strokeIncidence : null}
            onClick={() => { setCol2Metric('incidence'); setDetailPopup({ title: '허혈성 뇌졸중 발생률', content: `연령표준화 발생률 ${NATIONAL_AVG.strokeIncidence}/10만명 (KDCA 2022). 시도별 최대 134.5(전북)~최소 101.6(서울).` }); }}
          />
          <KPIMini label="연간 환자"
            value={selectedProv && prov ? (prov.strokePatients2023 || getPatientCount(selectedProv) || '-').toLocaleString() : '100,088'}
            unit="명" icon="🏥" color="#e0e0ff" source="KOSIS 2023"
            provinceName={selectedProv && prov ? selectedProv : null}
            nationalValue={selectedProv && prov ? '100,088' : null}
            onClick={() => { setCol2Metric('patients'); setDetailPopup({ title: '연간 허혈성 뇌졸중 환자수', content: `2023년 KOSIS 100,088명. 경기(24,243) > 서울(21,138) > 부산(5,798).` }); }}
          />
          <KPIMini label="사망률"
            value={selectedProv && prov ? prov.strokeMortality : NATIONAL_AVG.strokeMortality}
            unit="/10만" icon="🇰🇷" color="#ffd60a" source={selectedProv && prov ? 'KOSIS 2022' : 'OECD 2025'}
            provinceName={selectedProv && prov ? selectedProv : null}
            nationalValue={selectedProv && prov ? NATIONAL_AVG.strokeMortality : null}
            onClick={() => { setCol2Metric('mortality'); setDetailPopup({ title: selectedProv ? `${selectedProv} 뇌혈관질환 사망률` : 'OECD 비교: 30일 치명률', content: selectedProv && prov ? `${selectedProv} 사망률 ${prov.strokeMortality}/10만명 (전국 ${NATIONAL_AVG.strokeMortality}/10만명)` : `한국 3.3% vs OECD 평균 7.7% — OECD 최상위. '도착 후 치료 품질'은 세계 최고이나 '도착까지'(26.2%) 과제.` }); }}
          />
          <KPIMini label="3.5h 도착"
            value={selectedProv && prov ? prov.goldenTimeRate : KSR.arrivalTime.within3_5h}
            unit="%" icon="⏱️" color="#ffaa00" source={selectedProv ? 'KDCA 추정' : 'KSR 2024'}
            warning={!selectedProv ? '10년 무개선' : null}
            provinceName={selectedProv && prov ? selectedProv : null}
            nationalValue={selectedProv && prov ? KSR.arrivalTime.within3_5h : null}
            onClick={() => { setCol2Metric('goldenTime'); setDetailPopup({ title: '3.5시간 내 도착률', content: `26.2% (KSR 2022). 2012년 26.0%→2022년 26.2% 10년 무개선. 중앙값 12시간. 증상 인지 지연 주 원인.` }); }}
          />
          <KPIMini label="IV-tPA"
            value={selectedProv && prov ? prov.tpaRate : KSR.revascularization.ivTpa.pct}
            unit="%" icon="💉" color="#b388ff" source={selectedProv ? 'KDCA 추정' : 'KSR 2024'}
            provinceName={selectedProv && prov ? selectedProv : null}
            nationalValue={selectedProv && prov ? KSR.revascularization.ivTpa.pct : null}
            onClick={() => { setCol2Metric('tpa'); setDetailPopup({ title: 'IV-tPA 시행률', content: `6.1% (KSR 2022). 10.2%→6.1% 하락 — 도착률 26.2%로 적응 환자 제한. 혈전제거술 3.0%→6.5% 2배↑ 대체.` }); }}
          />
          <KPIMini label="혈전제거" value={KSR.revascularization.thrombectomy.pct} unit="%" icon="🔧" color="#00ff88" source="KSR 2024"
            provinceName={selectedProv ? null : null}
            onClick={() => setDetailPopup({ title: '혈전제거술', content: `6.5% (KSR 2022). 3.0%→6.5% 2배↑. 지역: 전북 26.1%(최고)~서울 12.9%(최저). LVO에 효과적. 시도별 데이터는 KSR 전국만.` })}
          />
          <KPIMini label="mRS 0-1" value={KSR.outcomes.mrs01.pct} unit="%" icon="✅" color="#00ff88"
            source={selectedProv ? '전국 기준 (KSR)' : 'KSR 2024'}
            onClick={() => setDetailPopup({ title: '좋은 예후 (mRS 0-1)', content: `퇴원 시 mRS 0-1: 44.1% (KSR 2022). 39.7%→44.1% 개선. mRS 0-2(독립 생활): 61.2%. 경증 비율↑ + 재관류 발전 기여.` })}
          />
          <KPIMini label="원내사망" value={KSR.outcomes.inHospitalMortality.pct} unit="%" icon="📉" color="#ff6b6b"
            source={selectedProv ? '전국 기준 (KSR)' : 'KSR 2024'}
            onClick={() => setDetailPopup({ title: '원내 사망률', content: `원내 사망 2.6% (KSR 2022). 1.0%→2.6% 증가 — 85세↑ 초고령 환자 2배 증가(6.6%→10.7%)가 주 원인.` })}
          />
          <KPIMini label="AF 첫진단" value="46" unit="%" icon="💔" color="#e74c3c"
            source={selectedProv ? '전국 기준 (KSR)' : 'KSR 2024'}
            onClick={() => setDetailPopup({ title: '심방세동 입원 시 첫 진단', content: `뇌졸중 환자 중 심방세동(AF) 20% 동반. 이 중 46%가 입원 시 처음 진단 — 지역사회 AF 선별검사 부족을 시사. AF는 심인성 색전(CE) 뇌졸중의 89.9% 차지. 조기 발견 시 항응고제로 뇌졸중 예방 가능.` })}
          />
        </div>
      </div>

      {/* ═══════ COLUMN 2: 시도별 + 치료 분석 ═══════ */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflow: 'hidden' }}>
        {/* Top: 시도별 환자수 바차트 */}
        <Panel style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexShrink: 0 }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#e8e8f0' }}>시도별 {metricLabels[col2Metric]}</span>
            <div style={{ display: 'flex', gap: '4px' }}>
              {Object.keys(metricConfig).map(m => (
                <button
                  key={m}
                  onClick={() => setCol2Metric(m)}
                  style={{
                    padding: '3px 8px', fontSize: '10px', borderRadius: '6px', cursor: 'pointer',
                    border: col2Metric === m ? '1px solid rgba(0,212,255,0.5)' : '1px solid rgba(255,255,255,0.1)',
                    background: col2Metric === m ? 'rgba(0,212,255,0.15)' : 'transparent',
                    color: col2Metric === m ? '#00d4ff' : '#666',
                    fontFamily: "'Noto Sans KR'",
                  }}
                >{metricLabels[m]}</button>
              ))}
            </div>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
            <HBar
              data={col2Data}
              maxVal={col2Max}
              highlightName={selectedProv}
              nationalAvg={col2NatAvg}
              onClick={(name) => setSelectedProv(prev => prev === name ? null : name)}
            />
          </div>
          {col2NatAvg && (
            <div style={{ fontSize: '10px', color: '#ffaa00', marginTop: '4px', textAlign: 'right', flexShrink: 0 }}>
              ━ 전국 평균 {col2NatAvg}
            </div>
          )}
        </Panel>

        {/* Bottom: 치료 패러다임 변화 tPA vs 혈전제거술 10년 추이 */}
        <Panel style={{ flex: '0 0 auto', minHeight: '180px' }}>
          <TrendLineChart
            title="치료 패러다임 변화: IV-tPA vs 혈전제거술 (10년)"
            years={['2012','2014','2016','2018','2020','2022']}
            lines={[
              { label: 'IV-tPA', color: '#b388ff', data: [10.2, 9.5, 8.8, 7.5, 6.8, 6.1] },
              { label: '혈전제거술', color: '#00ff88', data: [3.0, 3.2, 4.0, 4.8, 5.5, 6.5] },
            ]}
          />
          <div style={{ fontSize: '10px', color: '#666', marginTop: '6px', textAlign: 'center' }}>
            재관류 치료 총 {KSR.revascularization.total.pct}% | 지역 편차 {KSR.revascularization.regionalRange.min}%~{KSR.revascularization.regionalRange.max}%
          </div>
        </Panel>
      </div>

      {/* ═══════ COLUMN 3: 연령·중증도·예후 (전국) / 이송·전귀·요약 (시도) ═══════ */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflow: 'hidden' }}>
        {!selectedProv ? (
          <>
            {/* ── National view ── */}
            {/* 연령별 환자분포 */}
            <Panel style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px', flexShrink: 0 }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#e8e8f0' }}>
                  연령별 허혈성 뇌졸중 환자수
                  <span style={{ fontSize: '10px', color: '#666', fontWeight: 400 }}> (전국)</span>
                </span>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {['전체','남자','여자'].map(g => (
                    <button
                      key={g}
                      onClick={() => setGender(g)}
                      style={{
                        padding: '3px 8px', fontSize: '10px', borderRadius: '6px', cursor: 'pointer',
                        border: gender === g ? '1px solid rgba(0,212,255,0.5)' : '1px solid rgba(255,255,255,0.1)',
                        background: gender === g ? 'rgba(0,212,255,0.15)' : 'transparent',
                        color: gender === g ? '#00d4ff' : '#666',
                        fontFamily: "'Noto Sans KR'",
                      }}
                    >{g}</button>
                  ))}
                </div>
              </div>
              <div style={{ flex: 1, minHeight: 0 }}>
                {ageDist ? (
                  <VerticalBarChart data={ageDist} labels={AGE_LABELS} title="" />
                ) : (
                  <div style={{ color: '#555', fontSize: '12px', textAlign: 'center', paddingTop: '40px' }}>데이터 없음</div>
                )}
              </div>
              <div style={{ fontSize: '9px', color: '#555', marginTop: '4px', textAlign: 'right', flexShrink: 0 }}>
                평균연령 {KSR.demographics.meanAge}세 | 남성 {KSR.demographics.maleRatio}% | 85세+ {KSR.demographics.elderly85plus.pct}%
              </div>
            </Panel>

            {/* NIHSS 중증도 분포 */}
            <Panel style={{ flex: '0 0 auto' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#e8e8f0', marginBottom: '8px' }}>
                NIHSS 중증도 분포 <span style={{ fontSize: '10px', color: '#666', fontWeight: 400 }}>중앙값 {KSR.severity.median} (IQR {KSR.severity.iqr[0]}-{KSR.severity.iqr[1]})</span>
              </div>
              <StackedBar
                segments={[
                  { label: 'NIHSS 0-3 경증', value: KSR.severity.minor.pct, color: '#00ff88' },
                  { label: 'NIHSS 4-14 중등도', value: KSR.severity.moderate.pct, color: '#ffaa00' },
                  { label: 'NIHSS 15+ 중증', value: KSR.severity.severe.pct, color: '#ff4444' },
                ]}
                onClick={handleSeverityClick}
              />
            </Panel>

            {/* 예후 mRS 분포 */}
            <Panel style={{ flex: '0 0 auto' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#e8e8f0', marginBottom: '8px' }}>
                퇴원 시 예후 (mRS) <span style={{ fontSize: '10px', color: '#666', fontWeight: 400 }}>KSR 2022</span>
              </div>
              <StackedBar
                segments={[
                  { label: 'mRS 0-1 좋은예후', value: KSR.outcomes.mrs01.pct, color: '#00ff88' },
                  { label: 'mRS 2 경미장애', value: 17.1, color: '#00d4ff' },
                  { label: 'mRS 3-5 장애', value: 36.2, color: '#ffaa00' },
                  { label: 'mRS 6 원내사망', value: KSR.outcomes.inHospitalMortality.pct, color: '#ff4444' },
                ]}
                onClick={handleMrsClick}
              />
              <div style={{ fontSize: '10px', color: '#8888aa', marginTop: '6px' }}>
                독립적 생활 (mRS 0-2): <span style={{ color: '#00ff88', fontWeight: 700, fontFamily: "'JetBrains Mono'" }}>{KSR.outcomes.mrs02.pct}%</span>
              </div>
            </Panel>
          </>
        ) : (
          <>
            {/* ── Province view ── */}
            {/* 이송시간 분포 */}
            <Panel style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#e8e8f0', marginBottom: '8px' }}>
                이송시간 분포 <span style={{ color: '#ffd60a', fontSize: '11px' }}>{selectedProv}</span>
              </div>
              {(() => {
                const tDist = getTransportDist(selectedProv);
                const natDist = getTransportDist(null);
                if (!tDist) return <div style={{ color: '#555', fontSize: '12px', textAlign: 'center' }}>데이터 없음</div>;
                const total = tDist.reduce((s, v) => s + v, 0);
                const natTotal = natDist ? natDist.reduce((s, v) => s + v, 0) : 1;
                return (
                  <div style={{ display: 'flex', gap: '4px', alignItems: 'flex-end', height: '80px' }}>
                    {tDist.map((v, i) => {
                      const pct = total > 0 ? (v / total) * 100 : 0;
                      const colors = ['#00ff88', '#00d4ff', '#ffaa00', '#ff6b6b', '#ff4444'];
                      return (
                        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                          <span style={{ fontSize: '9px', color: '#bbb', fontFamily: "'JetBrains Mono'", marginBottom: '2px', fontWeight: 700 }}>
                            {pct.toFixed(0)}%
                          </span>
                          <div style={{
                            width: '100%', borderRadius: '3px 3px 0 0',
                            height: `${Math.max(pct, 2)}%`,
                            background: colors[i],
                            opacity: 0.8,
                          }} />
                          <span style={{ fontSize: '9px', color: '#666', marginTop: '3px', whiteSpace: 'nowrap' }}>
                            {TRANSPORT_LABELS[i]}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
              {(() => {
                const tDist = getTransportDist(selectedProv);
                const natDist = getTransportDist(null);
                if (!tDist || !natDist) return null;
                const total = tDist.reduce((s, v) => s + v, 0);
                const natTotal = natDist.reduce((s, v) => s + v, 0);
                const prov3h = total > 0 ? ((tDist[0] + tDist[1] + tDist[2]) / total * 100).toFixed(1) : 0;
                const nat3h = natTotal > 0 ? ((natDist[0] + natDist[1] + natDist[2]) / natTotal * 100).toFixed(1) : 0;
                return (
                  <div style={{ fontSize: '9px', color: '#888', marginTop: '6px', textAlign: 'right' }}>
                    3시간 내 도착: <span style={{ color: '#ffd60a', fontWeight: 700, fontFamily: "'JetBrains Mono'" }}>{prov3h}%</span>
                    <span style={{ color: '#555', marginLeft: '6px' }}>전국 {nat3h}%</span>
                  </div>
                );
              })()}
            </Panel>

            {/* 전귀결과 */}
            <Panel style={{ flex: '0 0 auto' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#e8e8f0', marginBottom: '8px' }}>
                전귀결과 <span style={{ color: '#ffd60a', fontSize: '11px' }}>{selectedProv}</span>
                <span style={{ fontSize: '10px', color: '#666', fontWeight: 400 }}> KOSIS 2023</span>
              </div>
              {(() => {
                const outcomePcts = getOutcomeDist(selectedProv);
                if (!outcomePcts) return <div style={{ color: '#555', fontSize: '12px', textAlign: 'center' }}>데이터 없음</div>;
                return (
                  <StackedBar
                    segments={outcomePcts.map((pct, i) => ({
                      label: OUTCOME_LABELS[i],
                      value: pct,
                      color: OUTCOME_COLORS[i],
                    }))}
                  />
                );
              })()}
            </Panel>

            {/* 시도 요약 */}
            <Panel style={{ flex: '0 0 auto' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#b388ff', marginBottom: '8px' }}>시도 요약</div>
              {prov && (
                <div style={{ fontSize: '11px', color: '#ccc', lineHeight: 1.8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ color: '#8888aa' }}>인구</span>
                    <span style={{ fontFamily: "'JetBrains Mono'", fontWeight: 700, color: '#e8e8f0' }}>{(prov.population / 10000).toFixed(0)}만명</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ color: '#8888aa' }}>고령화율</span>
                    <span style={{ fontFamily: "'JetBrains Mono'", fontWeight: 700, color: prov.agingRate > NATIONAL_AVG.agingRate ? '#ff6b6b' : '#00ff88' }}>{prov.agingRate}%</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ color: '#8888aa' }}>의사밀도</span>
                    <span style={{ fontFamily: "'JetBrains Mono'", fontWeight: 700, color: prov.doctorsPerThousand < NATIONAL_AVG.doctorsPerThousand ? '#ff6b6b' : '#00ff88' }}>{prov.doctorsPerThousand}/천명</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ color: '#8888aa' }}>상급종합병원</span>
                    <span style={{ fontFamily: "'JetBrains Mono'", fontWeight: 700, color: '#00d4ff' }}>{prov.tertiaryHospitals}개</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#8888aa' }}>미충족의료</span>
                    <span style={{ fontFamily: "'JetBrains Mono'", fontWeight: 700, color: prov.unmetMedical > NATIONAL_AVG.unmetMedical ? '#ff6b6b' : '#00ff88' }}>{prov.unmetMedical}%</span>
                  </div>
                </div>
              )}
            </Panel>
          </>
        )}
      </div>

      {/* ═══════ COLUMN 4: 인사이트 ═══════ */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflow: 'hidden' }}>
        <AnimatePresence mode="wait">
          {selectedProv && prov ? (
            <motion.div
              key={selectedProv}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              style={{ display: 'flex', flexDirection: 'column', gap: '10px', height: '100%', overflow: 'auto' }}
            >
              {/* Province header */}
              <Panel>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                  <span style={{ fontSize: '22px', fontWeight: 900, color: '#00d4ff' }}>{selectedProv}</span>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: '#e8e8f0', fontFamily: "'JetBrains Mono'" }}>
                    {(getPatientCount(selectedProv) || Math.round(prov.strokeIncidence * prov.population / 100000)).toLocaleString()}명
                  </span>
                  <span style={{ fontSize: '10px', color: '#666' }}>허혈성 뇌졸중</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginTop: '10px' }}>
                  {[
                    { label: '발생률', val: prov.strokeIncidence, unit: '/10만', rank: rankings?.incidence, color: '#ff6b6b' },
                    { label: '사망률', val: prov.strokeMortality, unit: '/10만', rank: rankings?.mortality, color: '#ff4444' },
                    { label: 'tPA', val: prov.tpaRate, unit: '%', rank: rankings?.tpa, color: '#b388ff' },
                    { label: '골든타임', val: prov.goldenTimeRate, unit: '%', rank: rankings?.goldenTime, color: '#ffaa00' },
                  ].map(({ label, val, unit, rank: r, color }) => (
                    <div key={label} style={{
                      background: 'rgba(255,255,255,0.03)', borderRadius: '6px', padding: '6px 8px',
                      border: '1px solid rgba(255,255,255,0.04)',
                    }}>
                      <div style={{ fontSize: '10px', color: '#8888aa' }}>{label}</div>
                      <span style={{ fontSize: '14px', fontWeight: 900, fontFamily: "'JetBrains Mono'", color }}>{val}</span>
                      <span style={{ fontSize: '9px', color: '#666' }}>{unit} ({r}/17)</span>
                    </div>
                  ))}
                </div>
              </Panel>

              {/* 사회경제 지표 */}
              <Panel style={{ flexShrink: 0 }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#b388ff', marginBottom: '10px' }}>사회경제 연관 지표</div>
                <CompareBar label="고령화율" value={prov.agingRate} national={NATIONAL_AVG.agingRate} unit="%" />
                <CompareBar label="의사밀도 (/천명)" value={prov.doctorsPerThousand} national={NATIONAL_AVG.doctorsPerThousand} unit="" higherIsWorse={false} />
                <CompareBar label="미충족의료" value={prov.unmetMedical} national={NATIONAL_AVG.unmetMedical} unit="%" />
                <CompareBar label="1인당 GRDP (만원)" value={Math.round(prov.grdp / prov.population * 10000000)} national={NATIONAL_AVG.grdpPerCapita} unit="" higherIsWorse={false} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginTop: '4px' }}>
                  <span style={{ color: '#8888aa' }}>상급종합병원</span>
                  <span style={{ color: '#00d4ff', fontFamily: "'JetBrains Mono'", fontWeight: 700 }}>{prov.tertiaryHospitals}개</span>
                </div>
              </Panel>
            </motion.div>
          ) : (
            <motion.div
              key="national"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ display: 'flex', flexDirection: 'column', gap: '10px', height: '100%', overflow: 'auto' }}
            >
              {/* 위험인자 프로파일 */}
              <Panel>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#ff6b6b', marginBottom: '10px' }}>
                  위험인자 프로파일 <span style={{ fontSize: '10px', color: '#666', fontWeight: 400 }}>허혈성 뇌졸중 환자 중</span>
                </div>
                {Object.entries(KSR.riskFactors).map(([key, rf]) => {
                  const labels = { hypertension: '고혈압', dyslipidemia: '이상지질혈증', diabetes: '당뇨', smoking: '현재 흡연', atrialFib: '심방세동' };
                  const colors = { hypertension: '#ff4444', dyslipidemia: '#ffaa00', diabetes: '#ff6b6b', smoking: '#b388ff', atrialFib: '#00d4ff' };
                  return (
                    <div
                      key={key}
                      onClick={() => handleRiskClick(key)}
                      style={{ marginBottom: '8px', cursor: 'pointer' }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '3px' }}>
                        <span style={{ color: '#8888aa' }}>{labels[key]}</span>
                        <span style={{ fontFamily: "'JetBrains Mono'", fontWeight: 700, color: colors[key] }}>
                          {rf.pct}%
                          {rf.newDx && <span style={{ color: '#ffaa00', fontSize: '9px', marginLeft: '4px' }}>({rf.newDx}% 첫진단)</span>}
                        </span>
                      </div>
                      <div style={{ height: '6px', background: 'rgba(255,255,255,0.04)', borderRadius: '3px' }}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${rf.pct}%` }}
                          transition={{ duration: 0.6 }}
                          style={{ height: '100%', borderRadius: '3px', background: colors[key], opacity: 0.7 }}
                        />
                      </div>
                    </div>
                  );
                })}
              </Panel>

              {/* TOAST 분류 */}
              <Panel>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#00d4ff', marginBottom: '10px' }}>
                  TOAST 분류 <span style={{ fontSize: '10px', color: '#666', fontWeight: 400 }}>허혈성 뇌졸중 아형</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <DonutChart
                    size={110}
                    centerLabel="TOAST"
                    segments={[
                      { label: '대혈관 죽상경화', value: KSR.toast.laa.pct, color: '#ff6b6b' },
                      { label: '소혈관 폐색', value: KSR.toast.svo.pct, color: '#ffaa00' },
                      { label: '심인성 색전', value: KSR.toast.ce.pct, color: '#00d4ff' },
                      { label: '기타/불명', value: KSR.toast.other.pct, color: '#555' },
                    ]}
                    onSegmentClick={handleToastClick}
                  />
                  <div style={{ flex: 1, fontSize: '10px' }}>
                    {[
                      { label: 'LAA 대혈관', pct: KSR.toast.laa.pct, color: '#ff6b6b', note: '감소' },
                      { label: 'SVO 소혈관', pct: KSR.toast.svo.pct, color: '#ffaa00', note: '증가' },
                      { label: 'CE 심인성', pct: KSR.toast.ce.pct, color: '#00d4ff', note: '안정' },
                      { label: '기타/불명', pct: KSR.toast.other.pct, color: '#555', note: '' },
                    ].map(item => (
                      <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px', cursor: 'pointer' }}
                        onClick={() => handleToastClick({ label: item.label.split(' ').pop() === '심인성' ? '심인성 색전' : item.label.includes('대혈관') ? '대혈관 죽상경화' : item.label.includes('소혈관') ? '소혈관 폐색' : '기타/불명' })}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: item.color }} />
                        <span style={{ color: '#8888aa' }}>{item.label}</span>
                        <span style={{ color: item.color, fontFamily: "'JetBrains Mono'", fontWeight: 700 }}>{item.pct}%</span>
                        {item.note && <span style={{ color: '#555', fontSize: '9px' }}>{item.note}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              </Panel>

              {/* 핵심 인사이트 */}
              <Panel>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#ffaa00', marginBottom: '8px' }}>핵심 인사이트</div>
                <div style={{ fontSize: '11px', color: '#ccc', lineHeight: 1.8 }}>
                  <div style={{ marginBottom: '8px', padding: '8px', background: 'rgba(255,170,0,0.06)', borderRadius: '8px', border: '1px solid rgba(255,170,0,0.15)' }}>
                    <strong style={{ color: '#ffaa00' }}>AF 46%가 뇌졸중 입원 시 첫 진단</strong>
                    <div style={{ color: '#999', marginTop: '2px' }}>심방세동 사전 스크리닝 부족 → 1차 예방 기회 상실</div>
                  </div>
                  <div style={{ marginBottom: '8px', padding: '8px', background: 'rgba(255,68,68,0.06)', borderRadius: '8px', border: '1px solid rgba(255,68,68,0.15)' }}>
                    <strong style={{ color: '#ff6b6b' }}>3.5h 내 도착률 26.2% — 10년간 변화 없음</strong>
                    <div style={{ color: '#999', marginTop: '2px' }}>tPA 투여 가능 시간 내 도착 4명 중 1명. 증상 인지 교육 시급</div>
                  </div>
                  <div style={{ padding: '8px', background: 'rgba(0,255,136,0.06)', borderRadius: '8px', border: '1px solid rgba(0,255,136,0.15)' }}>
                    <strong style={{ color: '#00ff88' }}>혈전제거술 2배 증가 (3.0%→6.5%)</strong>
                    <div style={{ color: '#999', marginTop: '2px' }}>tPA 하락을 보상. 지역 편차(12.9~26.1%) 해소 필요</div>
                  </div>
                </div>
              </Panel>

              {/* 지도 안내 */}
              <Panel>
                <div style={{ fontSize: '11px', color: '#666', textAlign: 'center' }}>
                  지도에서 시도를 클릭하면 지역별 상세 분석이 표시됩니다
                </div>
              </Panel>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <div style={{
          padding: '4px 12px',
          fontSize: 9,
          color: '#4a4a6a',
          fontFamily: "'JetBrains Mono', monospace",
          borderTop: '1px solid rgba(255,255,255,0.04)',
          flexShrink: 0,
          lineHeight: 1.5,
        }}>
          출처: KSR 한국뇌졸중등록사업 2024 (97개 병원, 171,520건), KOSIS 심뇌혈관질환통계 (orgId=411), KDCA 심뇌혈관질환 발생통계 2022, 심평원
        </div>
      </div>
    </div>
  );
}
