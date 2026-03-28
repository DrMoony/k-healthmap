import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import KoreaMap from '../components/KoreaMap';
import { PROVINCE_INFO, NATIONAL_AVG } from '../data/province_info';
import { FULL_DATA } from '../data/full_data';
import { STROKE_KOSIS } from '../data/stroke_kosis';
import { STROKE_KSR } from '../data/stroke_ksr';
import { useLang } from '../i18n';

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

function getTypedPatientCount(provName, strokeType) {
  if (strokeType === 'all') {
    return getPatientCount(provName);
  }
  const typeData = strokeType === 'ischemic' ? STROKE_KOSIS.ischemic : STROKE_KOSIS.hemorrhagic;
  const total = typeData?.monthlyRegion?.['계']?.[provName];
  return total?.['2024'] || total?.['2023'] || null;
}

function getTypedAgeDistribution(strokeType, gender = '전체') {
  if (strokeType === 'all') return null; // use existing byGenderAge
  const typeData = strokeType === 'ischemic' ? STROKE_KOSIS.ischemic : STROKE_KOSIS.hemorrhagic;
  if (!typeData?.erResultAge) return null;
  const genderPrefix = gender === '남자' ? '남자' : gender === '여자' ? '여자' : '전체';
  return AGE_GROUPS_KOSIS.map(ag => {
    const key = `${genderPrefix}_${ag}`;
    const entry = typeData.erResultAge[key];
    if (!entry || !entry['계']) return 0;
    return entry['계']['2024'] || entry['계']['2023'] || entry['계']['2022'] || 0;
  });
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
const OUTCOME_COLORS = ['#00ff88', '#00d4ff', '#ffd60a', '#ff4444', '#bbbbdd'];
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


// ── Risk factor helpers from FULL_DATA ────────────────────────
function getExamRiskFactors(provName) {
  if (!provName || !FULL_DATA?.exam_items) return null;
  const bp = FULL_DATA.exam_items.bp_systolic?.province?.[provName]?.total;
  const fg = FULL_DATA.exam_items.fasting_glucose?.province?.[provName]?.total;
  const tc = FULL_DATA.exam_items.total_cholesterol?.province?.[provName]?.total;
  const bmi = FULL_DATA.exam_items.bmi?.province?.[provName]?.total;
  if (!Array.isArray(bp) || !Array.isArray(fg) || !Array.isArray(tc) || !Array.isArray(bmi)) return null;
  return {
    bpHigh: +(bp.slice(3).reduce((s,v) => s+v, 0).toFixed(1)),      // 90이상 (diastolic hypertension range)
    glucoseHigh: +(fg.slice(1).reduce((s,v) => s+v, 0).toFixed(1)),  // 100이상
    cholesterolHigh: +(tc.slice(4).reduce((s,v) => s+v, 0).toFixed(1)), // 200이상
    obesityRate: +(bmi.slice(2).reduce((s,v) => s+v, 0).toFixed(1)),  // BMI 25이상
  };
}

function getExamNationalAvg() {
  const provinces = ['서울','부산','대구','인천','광주','대전','울산','세종','경기','강원','충북','충남','전북','전남','경북','경남','제주'];
  const vals = provinces.map(p => getExamRiskFactors(p)).filter(Boolean);
  if (vals.length === 0) return { bpHigh: 0, glucoseHigh: 0, cholesterolHigh: 0, obesityRate: 0 };
  const avg = (arr, key) => +(arr.reduce((s,v) => s + v[key], 0) / arr.length).toFixed(1);
  return {
    bpHigh: avg(vals, 'bpHigh'),
    glucoseHigh: avg(vals, 'glucoseHigh'),
    cholesterolHigh: avg(vals, 'cholesterolHigh'),
    obesityRate: avg(vals, 'obesityRate'),
  };
}

function getOutcomeTrend(regionName) {
  const data = STROKE_KOSIS?.regionByOutcome?.[regionName];
  if (!data) return null;
  const years = ['2022', '2023', '2024'];
  const result = years.map(yr => {
    const raw = OUTCOME_KEYS.map(k => {
      const v = data[k];
      return v ? (v[yr] || 0) : 0;
    });
    const total = raw.reduce((s, v) => s + v, 0);
    if (total === 0) return null;
    return {
      year: yr,
      입원: +(raw[1] / total * 100).toFixed(1),
      사망: +(raw[3] / total * 100).toFixed(1),
      퇴가: +(raw[0] / total * 100).toFixed(1),
      전원: +(raw[2] / total * 100).toFixed(1),
    };
  }).filter(Boolean);
  return result.length >= 2 ? result : null;
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
        <span style={{ color: '#bbbbdd' }}>{label}</span>
        <span style={{ color: isWorse ? '#ff6b6b' : '#00ff88', fontFamily: "'JetBrains Mono'", fontWeight: 700 }}>
          {typeof value === 'number' ? value.toFixed(1) : value}{unit}
          <span style={{ color: '#9999bb', marginLeft: '4px', fontSize: '10px' }}>
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
        const ratio = maxVal > 0 ? value / maxVal : 0;
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
              color: isHighlight ? '#ffd60a' : '#bbbbdd', fontWeight: isHighlight ? 700 : 400,
              flexShrink: 0, fontFamily: "'Noto Sans KR'",
            }}>{name}</span>
            <div style={{ flex: 1, position: 'relative', height: '14px', background: 'rgba(255,255,255,0.03)', borderRadius: '3px' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${ratio * 100}%` }}
                transition={{ duration: 0.6, delay: i * 0.02 }}
                style={{
                  height: '100%', borderRadius: '3px',
                  background: `linear-gradient(90deg, ${gradientColor(ratio * 0.3)}, ${gradientColor(ratio)})`,
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
      {title && <div style={{ fontSize: '11px', color: '#bbbbdd', marginBottom: '6px', fontWeight: 600 }}>{title}</div>}
      <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: '3px', minHeight: 0 }}>
        {data.map((v, i) => {
          const ratio = max > 0 ? v / max : 0;
          return (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
              <span style={{ fontSize: '9px', color: '#bbbbdd', fontFamily: "'JetBrains Mono'", marginBottom: '2px' }}>
                {v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}
              </span>
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${ratio * 100}%` }}
                transition={{ duration: 0.5, delay: i * 0.03 }}
                style={{
                  width: '100%', minHeight: '2px', borderRadius: '3px 3px 0 0',
                  background: typeof color === 'function' ? color(ratio) : `linear-gradient(180deg, ${gradientColor(ratio)}, ${gradientColor(ratio * 0.3)})`,
                }}
              />
              <span style={{ fontSize: '9px', color: '#aaaacc', marginTop: '3px', whiteSpace: 'nowrap' }}>
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

// ── KPI Mini Card ────────────────────────────────────

function KPIMini({ label, value, unit, icon, color = '#00d4ff', source, warning, onClick, provinceName, nationalValue, infoTip }) {
  const { t } = useLang();
  const isProvince = !!provinceName;
  return (
    <div
      onClick={onClick}
      style={{
        background: isProvince
          ? 'linear-gradient(145deg, #1a1a10 0%, #12120a 100%)'
          : 'linear-gradient(145deg, #1a1a2e 0%, #12121a 100%)',
        border: isProvince
          ? '2px solid rgba(255,214,10,0.4)'
          : '1px solid rgba(255,255,255,0.08)',
        borderRadius: '10px',
        padding: '8px 10px',
        position: 'relative',
        overflow: 'hidden',
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: isProvince ? 'linear-gradient(90deg, transparent, #ffd60a, transparent)' : `linear-gradient(90deg, transparent, ${color}, transparent)`, opacity: 0.6 }} />
      {isProvince && <div style={{ fontSize: '9px', color: '#ffd60a', fontWeight: 700, marginBottom: '2px' }}>{provinceName}</div>}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '3px' }}>
        <span style={{ fontSize: '12px' }}>{icon}</span>
        <span style={{ fontSize: '10px', color: '#ccccdd', fontWeight: 500 }}>{label}</span>
        {infoTip && <InfoTip text={infoTip} />}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px' }}>
        <span style={{ fontSize: '18px', fontWeight: 900, fontFamily: "'JetBrains Mono'", color: isProvince ? '#ffd60a' : '#ffffff', textShadow: `0 0 10px ${isProvince ? '#ffd60a' : color}44` }}>
          {value}
        </span>
        <span style={{ fontSize: '10px', color: '#ccccee' }}>{unit}</span>
      </div>
      {isProvince && nationalValue != null && (
        <div style={{ fontSize: '9px', color: '#ccccee', marginTop: '2px', fontFamily: "'JetBrains Mono'" }}>
          {t('전국','Natl')} <span style={{ color: '#00d4ff' }}>{nationalValue}</span>{unit}
        </div>
      )}
      {warning && (
        <div style={{ fontSize: '9px', color: '#ffaa00', marginTop: '2px', fontWeight: 600 }}>⚠ {warning}</div>
      )}
      {source && !isProvince && (
        <div style={{ fontSize: '8px', color: '#aaaacc', marginTop: '2px' }}>{source}</div>
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
    <div style={{ paddingRight: '4px' }}>
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
              title={`${seg.label}: ${seg.value}%`}
              style={{
                background: seg.color,
                height: '100%',
                minWidth: pct > 0 ? '2px' : 0,
              }}
            />
          );
        })}
      </div>
      {showLabels && (
        <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
          {segments.filter(s => s.value > 0).map((seg, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '3px', cursor: onClick ? 'pointer' : 'default' }}
              onClick={() => onClick?.(seg)}>
              <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: seg.color, flexShrink: 0 }} />
              <span style={{ fontSize: '10px', color: '#ccc' }}>{seg.label}</span>
              <span style={{ fontSize: '11px', color: '#fff', fontFamily: "'JetBrains Mono'", fontWeight: 700 }}>{seg.value}%</span>
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
  const w = 280, h = 120, padL = 32, padR = 40, padT = 10, padB = 24;
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
              <text x={padL - 4} y={y + 3} textAnchor="end" fill="#9999bb" fontSize="8" fontFamily="'JetBrains Mono'">{val.toFixed(1)}</text>
            </g>
          );
        })}
        {/* x axis labels */}
        {years.map((yr, i) => (
          <text key={yr} x={toX(i)} y={h - 4} textAnchor="middle" fill="#aaaacc" fontSize="8" fontFamily="'JetBrains Mono'">{yr}</text>
        ))}
        {/* lines */}
        {lines.map((line, li) => {
          const pts = line.data.map((v, i) => `${toX(i)},${toY(v)}`).join(' ');
          const lastVal = line.data[line.data.length - 1];
          const lastY = toY(lastVal);
          // Anti-collision: if another line's last value is within 8px, offset vertically
          const otherLastYs = lines.filter((_, j) => j < li).map(l => toY(l.data[l.data.length - 1]));
          const labelOffset = otherLastYs.some(oy => Math.abs(oy - lastY) < 10) ? (li % 2 === 0 ? -7 : 7) : 0;
          return (
            <g key={li}>
              <polyline points={pts} fill="none" stroke={line.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              {line.data.map((v, i) => (
                <circle key={i} cx={toX(i)} cy={toY(v)} r="3" fill={line.color} stroke="#12121a" strokeWidth="1" />
              ))}
              <text x={toX(line.data.length - 1) + 4} y={lastY + 3 + labelOffset}
                fill={line.color} fontSize="9" fontFamily="'JetBrains Mono'" fontWeight="700">
                {lastVal}%
              </text>
            </g>
          );
        })}
      </svg>
      <div style={{ display: 'flex', gap: '12px', marginTop: '4px', justifyContent: 'center' }}>
        {lines.map((line, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{ width: '12px', height: '2px', background: line.color, borderRadius: '1px' }} />
            <span style={{ fontSize: '10px', color: '#bbbbdd' }}>{line.label}</span>
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
          width: '24px', height: '24px', color: '#bbbbdd', cursor: 'pointer', fontSize: '14px',
        }}>x</button>
      </div>
      <div style={{ fontSize: '12px', color: '#ccc', lineHeight: 1.8 }}>{content}</div>
    </motion.div>
  );
}

// ════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════

export default function StrokeDashboard({ embedded = false }) {
  const { lang, t } = useLang();
  const [selectedProv, setSelectedProv] = useState(null);
  const [strokeType, setStrokeType] = useState('all'); // 'all' | 'ischemic' | 'hemorrhagic'

  const PROV_EN = {
    '서울': 'Seoul', '부산': 'Busan', '대구': 'Daegu', '인천': 'Incheon',
    '광주': 'Gwangju', '대전': 'Daejeon', '울산': 'Ulsan', '세종': 'Sejong',
    '경기': 'Gyeonggi', '강원': 'Gangwon', '충북': 'Chungbuk', '충남': 'Chungnam',
    '전북': 'Jeonbuk', '전남': 'Jeonnam', '경북': 'Gyeongbuk', '경남': 'Gyeongnam',
    '제주': 'Jeju',
  };
  const provName = (name) => lang === 'ko' ? name : (PROV_EN[name] || name);
  const outcomeLabels = [t('퇴가','Discharged'), t('입원','Admitted'), t('전원','Transferred'), t('사망','Death'), t('기타','Other')];
  const [col2Metric, setCol2Metric] = useState('patients');
  const [gender, setGender] = useState('전체');
  const [detailPopup, setDetailPopup] = useState(null);

  const defaultInference = {
    title: t('허혈성 뇌졸중 핵심 요약', 'Ischemic Stroke Key Summary'),
    content: t(
      '한국의 허혈성 뇌졸중 30일 치명률은 3.3%로 OECD 최상위(평균 7.7%). 그러나 3.5시간 내 도착률은 26.2%로 10년간 개선 없음. IV-tPA는 6.1%로 하락 중이나 혈전제거술은 6.5%로 2배 증가. 뇌졸중 환자의 46%에서 심방세동이 입원 시 첫 진단되어 사전 선별 부족을 시사.',
      "Korea's 30-day ischemic stroke fatality rate is 3.3%, among the best in OECD (avg 7.7%). However, only 26.2% arrive within the 3.5h tPA window — no improvement in 10 years. IV-tPA declining (6.1%) while thrombectomy doubled (6.5%). 46% of AF in stroke patients is first diagnosed at admission, suggesting inadequate pre-screening."
    ),
  };

  const prov = selectedProv ? PROVINCE_INFO[selectedProv] : null;
  const KSR = STROKE_KSR;

  // ── Column 2 data: sorted province bars ────────────────

  const metricConfig = {
    patients:    { label: t('환자수','Patients'), unit: t('명',''), field: null, natAvg: null, higherIsWorse: true },
    incidence:   { label: t('발생률','Incidence'), unit: '/100k', field: 'strokeIncidence', natAvg: NATIONAL_AVG.strokeIncidence, higherIsWorse: true },
    mortality:   { label: t('사망률','Mortality'), unit: '/100k', field: 'strokeMortality', natAvg: NATIONAL_AVG.strokeMortality, higherIsWorse: true },
    tpa:         { label: t('tPA 시행률','tPA Rate'), unit: '%', field: 'tpaRate', natAvg: NATIONAL_AVG.tpaRate, higherIsWorse: false },
    goldenTime:  { label: t('3.5h 도착률','3.5h Arrival Rate'), unit: '%', field: 'goldenTimeRate', natAvg: NATIONAL_AVG.goldenTimeRate, higherIsWorse: false },
  };

  const col2Data = useMemo(() => {
    if (col2Metric === 'patients') {
      return PROVINCES
        .map(name => ({ name, value: getTypedPatientCount(name, strokeType) || Math.round(PROVINCE_INFO[name].strokeIncidence * PROVINCE_INFO[name].population / 100000) }))
        .sort((a, b) => b.value - a.value);
    }
    const cfg = metricConfig[col2Metric];
    if (!cfg?.field) return [];
    return PROVINCES
      .map(name => ({ name, value: PROVINCE_INFO[name][cfg.field] || 0 }))
      .sort((a, b) => b.value - a.value);
  }, [col2Metric, strokeType]);

  const col2Max = useMemo(() => Math.max(...col2Data.map(d => d.value), 1), [col2Data]);
  const col2NatAvg = metricConfig[col2Metric]?.natAvg || null;

  // ── Age distribution ────────────────

  const ageDist = useMemo(() => {
    if (strokeType !== 'all') {
      return getTypedAgeDistribution(strokeType, gender);
    }
    return getAgeDistribution(gender);
  }, [gender, strokeType]);

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
      '대혈관 죽상경화': t('대동맥 또는 주요 뇌동맥의 죽상경화증. 경동맥 내막절제술, 스텐트, 항혈소판제 이중요법 등이 치료에 사용됨. KSR에서 10년간 감소 추세.','Large artery atherosclerosis. Treated with carotid endarterectomy, stenting, dual antiplatelet therapy. Declining trend over 10yr per KSR.'),
      '소혈관 폐색': t('소동맥의 경색 (라쿠나 경색). 주로 고혈압, 당뇨와 연관. KSR에서 10년간 증가 추세 - 고혈압/당뇨 관리 강화 필요.','Small vessel occlusion (lacunar infarct). Associated with hypertension, diabetes. Increasing trend over 10yr per KSR — enhanced BP/DM management needed.'),
      '심인성 색전': t('심방세동 등에서 심장 유래 혈전. 항응고제(DOAC) 치료. AF 환자의 46%가 입원 시 첫 진단 - 사전 스크리닝 부족.','Cardiac embolism from atrial fibrillation. Treated with DOAC. 46% of AF first diagnosed at admission — pre-screening lacking.'),
      '기타/불명': t('기타 원인(혈관박리, 혈액질환 등) 또는 원인 불명. 전체의 약 27%를 차지.','Other causes (dissection, hematologic) or undetermined. Accounts for ~27% of total.'),
    };
    setDetailPopup({ title: `TOAST: ${seg.label}`, content: toastInfo[seg.label] || seg.label });
  };

  // ── Risk factor click handler ────────────────

  const handleRiskClick = (key) => {
    const info = {
      hypertension: t('고혈압: 허혈성 뇌졸중 환자의 67.9%에서 동반. 91%는 기존에 진단된 환자로, 조절 불량이 문제. 수축기혈압 10mmHg 감소 시 뇌졸중 위험 약 30% 감소.','Hypertension: present in 67.9%. 91% previously diagnosed — poor control is the issue. 10mmHg SBP reduction → ~30% stroke risk reduction.'),
      dyslipidemia: t('이상지질혈증: 42.5%에서 동반. 42%는 입원 시 처음 진단 - 건강검진 사각지대. 스타틴 치료로 재발 예방 효과.','Dyslipidemia: present in 42.5%. 42% first diagnosed at admission — screening gap. Statin therapy prevents recurrence.'),
      diabetes: t('당뇨: 34.3%에서 동반. 87%는 기존 진단자. 당뇨 동반 시 뇌졸중 예후가 불량하며 재발률도 높음.','Diabetes: present in 34.3%. 87% previously diagnosed. Diabetes worsens stroke prognosis and increases recurrence.'),
      smoking: t('현재 흡연: 21.7%. 흡연은 뇌졸중 위험을 2배 이상 증가시킴. 금연 후 5년 이내 비흡연자 수준으로 감소.','Current smoking: 21.7%. Smoking doubles stroke risk. Returns to non-smoker level within 5yr of cessation.'),
      atrialFib: t('심방세동: 20%에서 동반. 46%가 뇌졸중으로 입원하여 처음 진단 - 사전 AF 스크리닝이 매우 부족함. DOAC 예방 치료 필요.','AF: present in 20%. 46% first diagnosed at stroke admission — pre-screening severely lacking. DOAC prevention needed.'),
    };
    setDetailPopup({ title: t('위험인자 상세','Risk Factor Details'), content: info[key] || '' });
  };

  // ── Severity click handler ────────────────

  const handleSeverityClick = (seg) => {
    const info = {
      [t('NIHSS 0-3 경증','NIHSS 0-3 Minor')]: t('경증 환자 54.8% (10년간 증가 추세). mRS 0-1 달성률 높음. 조기 퇴원·외래 재활 가능. 그러나 경증이라도 재발 예방 치료(항혈소판제/항응고제) 필수.','Minor 54.8% (increasing over 10yr). High mRS 0-1 achievement. Early discharge + outpatient rehab possible. Secondary prevention (antiplatelet/anticoagulant) still essential.'),
      [t('NIHSS 4-14 중등도','NIHSS 4-14 Moderate')]: t('중등도 35.7%. tPA/혈전제거술의 주요 대상군. 적극적 재관류 치료 시 mRS 0-2 달성 가능성 높음. 재활치료 병행 필요.','Moderate 35.7%. Main target for tPA/thrombectomy. Aggressive recanalization yields high mRS 0-2 probability. Concurrent rehab needed.'),
      [t('NIHSS 15+ 중증','NIHSS 15+ Severe')]: t('중증 9.5% (10년간 12%→9.5% 감소). 혈전제거술 적응증. 원내 사망률 높고 장기 장애 위험. 전문 뇌졸중 집중치료실(SU) 필요.','Severe 9.5% (12%→9.5% decline over 10yr). Thrombectomy indication. High in-hospital mortality and long-term disability risk. Dedicated stroke unit (SU) needed.'),
    };
    setDetailPopup({ title: `${t('중증도','Severity')}: ${seg.label}`, content: info[seg.label] || '' });
  };

  // ── mRS click handler ────────────────

  const handleMrsClick = (seg) => {
    const info = {
      [t('mRS 0-1 좋은예후','mRS 0-1 Good outcome')]: t('44.1% (10년간 39.7%→44.1% 개선). 독립적 일상생활 가능. 직장 복귀 가능 수준. 재발 예방 약물 치료 + 생활습관 관리로 장기 예후 유지.','44.1% (39.7%→44.1% over 10yr). Independent ADL. Return-to-work level. Long-term prognosis maintained with secondary prevention + lifestyle.'),
      [t('mRS 2 경미장애','mRS 2 Minor disability')]: t('17.1% (mRS 0-2 합산 61.2%). 경미한 장애 있으나 독립적 생활 가능. 외래 재활 + 이차예방 약물. 운전, 업무 등 일부 제한 가능.','17.1% (mRS 0-2 combined 61.2%). Minor disability but independent. Outpatient rehab + secondary prevention. Some restrictions (driving, work).'),
      [t('mRS 3-5 장애','mRS 3-5 Disability')]: t('36.2%. 보조 필요~중증 장애. 입원 재활 → 지역사회 재활 연계 필요. 요양시설 또는 가정간호. 돌봄 부담 큼.','36.2%. Needs assistance to severe disability. Inpatient rehab → community rehab linkage needed. Nursing facility or home care. Heavy caregiver burden.'),
      [t('mRS 6 원내사망','mRS 6 In-hospital death')]: t('2.6% (10년간 1.0%→2.6% 증가). 고령 환자 증가(85세+ 2배)가 주 원인. 중증(NIHSS 15+) 환자의 사망률이 가장 높음.','2.6% (1.0%→2.6% over 10yr). Mainly due to doubling of 85+ patients. Highest mortality in severe (NIHSS 15+) patients.'),
    };
    setDetailPopup({ title: `${t('예후','Outcome')}: ${seg.label}`, content: info[seg.label] || '' });
  };

  return (
    <div style={{
      position: embedded ? 'relative' : 'fixed',
      top: embedded ? 0 : '56px',
      left: embedded ? undefined : 0,
      right: embedded ? undefined : 0,
      bottom: embedded ? undefined : 0,
      height: embedded ? 'calc(100vh - 160px)' : undefined,
      background: '#0a0a0f',
      display: 'grid',
      gridTemplateColumns: '300px 1fr 1fr 320px',
      gridTemplateRows: '1fr',
      gap: '12px',
      padding: '12px',
      fontFamily: "'Noto Sans KR', sans-serif",
      overflow: 'hidden',
    }}>

      {/* Detail popup — removed overlay, now inline in Column 4 */}
      <AnimatePresence>
        {false && detailPopup && (
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

      {/* ═══════ COLUMN 1: Type Toggle + Map + 6 KPIs ═══════ */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflow: 'hidden' }}>
        {/* Stroke Type Toggle */}
        <Panel style={{ flex: '0 0 auto', padding: '6px 8px' }}>
          <div style={{ display: 'flex', gap: '4px' }}>
            {[
              { id: 'all', label: t('전체','All'), color: '#00d4ff' },
              { id: 'ischemic', label: t('허혈성','Ischemic'), color: '#4d96ff' },
              { id: 'hemorrhagic', label: t('출혈성','Hemorrhagic'), color: '#ff6b6b' },
            ].map(tp => (
              <button key={tp.id} onClick={() => setStrokeType(tp.id)} style={{
                flex: 1, padding: '5px 4px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer',
                fontFamily: "'Noto Sans KR'", fontWeight: strokeType === tp.id ? 700 : 400,
                background: strokeType === tp.id ? `${tp.color}18` : 'transparent',
                border: strokeType === tp.id ? `1px solid ${tp.color}44` : '1px solid transparent',
                color: strokeType === tp.id ? tp.color : '#aaaacc',
                transition: 'all 0.2s',
              }}>
                {tp.label}
              </button>
            ))}
          </div>
          {strokeType !== 'all' && (
            <div style={{ fontSize: '9px', color: '#9999bb', marginTop: '4px', textAlign: 'center' }}>
              {t('허혈성/출혈성 분리: 2022년~', 'Ischemic/Hemorrhagic split: 2022+', lang)}
            </div>
          )}
        </Panel>
        <Panel style={{ flex: '0 0 auto', display: 'flex', justifyContent: 'center', padding: '8px' }}>
          <div style={{ width: '100%', maxWidth: '260px' }}>
            <KoreaMap metric="stroke" onProvinceClick={(name) => {
              const next = selectedProv === name ? null : name;
              setSelectedProv(next);
              if (next && PROVINCE_INFO[next]) {
                const p = PROVINCE_INFO[next];
                const lines = [];
                if (p.goldenTimeRate < 35) lines.push(t(`골든타임 도착률 ${p.goldenTimeRate}%로 전국 평균(${NATIONAL_AVG.goldenTimeRate}%) 대비 낮음.`, `Golden time arrival ${p.goldenTimeRate}% below national avg (${NATIONAL_AVG.goldenTimeRate}%).`));
                if (p.agingRate > 22) lines.push(`고령화율 ${p.agingRate}%로 뇌졸중 고위험 인구 집중.`);
                if (p.doctorsPerThousand < 1.8) lines.push(t(`의사밀도 ${p.doctorsPerThousand}명/천명으로 의료 인프라 부족.`, `Doctor density ${p.doctorsPerThousand}/1k — insufficient medical infra.`));
                if (p.unmetMedical > 8) lines.push(t(`미충족의료 ${p.unmetMedical}%로 접근성 취약.`, `Unmet medical need ${p.unmetMedical}% — poor access.`));
                if (p.strokeIncidence > 125) lines.push(t(`발생률 ${p.strokeIncidence}/10만으로 전국 상위 — 위험인자(고혈압·당뇨·흡연) 관리 필요.`, `Incidence ${p.strokeIncidence}/100k (top nationally) — risk factor mgmt needed.`));
                if (p.tpaRate < 8) lines.push(t(`tPA 시행률 ${p.tpaRate}%로 낮음 — 급성기 치료 인프라 확충 필요.`, `tPA rate ${p.tpaRate}% low — acute care infra expansion needed.`));
                if (p.smokingRate > 20) lines.push(`흡연율 ${p.smokingRate}%로 뇌졸중 위험 가중.`);
                setDetailPopup({ title: t(`${next} 허혈성 뇌졸중 분석`, `${provName(next)} Ischemic Stroke Analysis`), content: lines.length > 0 ? lines.join(' ') : t(`${next}의 뇌졸중 지표가 전국 평균 수준이거나 양호합니다.`, `${provName(next)} stroke metrics are at or above national average.`) });
              } else {
                setDetailPopup(null);
              }
            }} />
          </div>
        </Panel>

        {selectedProv && (
          <div style={{ background: '#ffd60a22', border: '1px solid #ffd60a44', borderRadius: 8, padding: '6px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#ffd60a', fontWeight: 700, fontSize: 14 }}>{provName(selectedProv)}</span>
            <button onClick={() => setSelectedProv(null)} style={{ background: 'none', border: 'none', color: '#bbbbdd', cursor: 'pointer', fontSize: 12 }}>✕ {t('전국으로','Back to National')}</button>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
          <KPIMini label={t("발생률","Incidence Rate")}
            infoTip={t("연령표준화 발생률 — 인구 구조 차이를 보정한 허혈성 뇌졸중 신규 발생 건수 (건/10만명/년)","Age-standardized incidence — new ischemic stroke cases adjusted for population structure (per 100K/yr)")}
            value={selectedProv && prov ? prov.strokeIncidence : NATIONAL_AVG.strokeIncidence}
            unit="/10만" icon="📊" color="#00d4ff" source="KDCA 2022"
            provinceName={selectedProv && prov ? selectedProv : null}
            nationalValue={selectedProv && prov ? NATIONAL_AVG.strokeIncidence : null}
            onClick={() => { setCol2Metric('incidence'); setDetailPopup({ title: t('허혈성 뇌졸중 발생률','Ischemic Stroke Incidence'), content: t(`연령표준화 발생률 ${NATIONAL_AVG.strokeIncidence}/10만명 (KDCA 2022). 시도별 최대 134.5(전북)~최소 101.6(서울).`, `Age-standardized incidence ${NATIONAL_AVG.strokeIncidence}/100k (KDCA 2022). Range: 134.5 (Jeonbuk) ~ 101.6 (Seoul).`) }); }}
          />
          <KPIMini label={t("연간 환자","Annual Patients")}
            infoTip={t("KOSIS 기준 연간 허혈성 뇌졸중(I63) 퇴원환자 수. 주진단 기준 집계.","Annual ischemic stroke (I63) discharged patients per KOSIS. Based on primary diagnosis.")}
            value={selectedProv && prov ? (prov.strokePatients2023 || getPatientCount(selectedProv) || '-').toLocaleString() : '100,088'}
            unit="명" icon="🏥" color="#e0e0ff" source="KOSIS 2023"
            provinceName={selectedProv && prov ? selectedProv : null}
            nationalValue={selectedProv && prov ? '100,088' : null}
            onClick={() => { setCol2Metric('patients'); setDetailPopup({ title: t('연간 허혈성 뇌졸중 환자수','Annual Ischemic Stroke Patients'), content: t('2023년 KOSIS 100,088명. 경기(24,243) > 서울(21,138) > 부산(5,798).','2023 KOSIS 100,088 patients. Gyeonggi(24,243) > Seoul(21,138) > Busan(5,798).') }); }}
          />
          <KPIMini label={t("사망률","Mortality")}
            infoTip={t("OECD 표준화 지표 — 허혈성 뇌졸중 입원 후 30일 이내 사망률. 치료 품질 국제 비교에 사용","OECD standardized indicator — 30-day case fatality after ischemic stroke admission. Used for international care quality comparison")}
            value={selectedProv && prov ? prov.strokeMortality : NATIONAL_AVG.strokeMortality}
            unit="/10만" icon="🇰🇷" color="#ffd60a" source={selectedProv && prov ? 'KOSIS 2022' : 'OECD 2025'}
            provinceName={selectedProv && prov ? selectedProv : null}
            nationalValue={selectedProv && prov ? NATIONAL_AVG.strokeMortality : null}
            onClick={() => { setCol2Metric('mortality'); setDetailPopup({ title: selectedProv ? t(`${selectedProv} 뇌혈관질환 사망률`, `${provName(selectedProv)} Cerebrovascular Mortality`) : t('OECD 비교: 30일 치명률','OECD Comparison: 30-day Case Fatality'), content: selectedProv && prov ? t(`${selectedProv} 사망률 ${prov.strokeMortality}/10만명 (전국 ${NATIONAL_AVG.strokeMortality}/10만명)`, `${provName(selectedProv)} mortality ${prov.strokeMortality}/100k (national ${NATIONAL_AVG.strokeMortality}/100k)`) : t(`한국 3.3% vs OECD 평균 7.7% — OECD 최상위. '도착 후 치료 품질'은 세계 최고이나 '도착까지'(26.2%) 과제.`, `Korea 3.3% vs OECD avg 7.7% — top tier. Post-arrival care quality world-best, but pre-arrival (26.2%) remains a challenge.`) }); }}
          />
          <KPIMini label={t("3.5h 도착","3.5h Arrival Rate")}
            infoTip={t("tPA 투여 가능 시간(3.5시간) 내 병원 도착 비율. 이 시간을 넘기면 혈전용해술 적응증이 제한됨","Percentage arriving within the 3.5h tPA window. Beyond this time, thrombolysis eligibility is restricted")}
            value={selectedProv && prov ? prov.goldenTimeRate : KSR.arrivalTime.within3_5h}
            unit="%" icon="⏱️" color="#ffaa00" source={selectedProv ? 'KDCA 추정' : 'KSR 2024'}
            warning={!selectedProv ? t('10년 무개선','No improvement in 10yr') : null}
            provinceName={selectedProv && prov ? selectedProv : null}
            nationalValue={selectedProv && prov ? KSR.arrivalTime.within3_5h : null}
            onClick={() => { setCol2Metric('goldenTime'); setDetailPopup({ title: t('3.5시간 내 도착률','3.5h Arrival Rate'), content: t('26.2% (KSR 2022). 2012년 26.0%→2022년 26.2% 10년 무개선. 중앙값 12시간. 증상 인지 지연 주 원인.','26.2% (KSR 2022). 26.0% in 2012 → 26.2% in 2022, no improvement in 10yr. Median 12hr. Delayed symptom recognition is main cause.') }); }}
          />
          <KPIMini label={t("IV-tPA","IV-tPA")}
            infoTip={t("정맥내 혈전용해술(Intravenous tissue Plasminogen Activator) — 급성 허혈성 뇌졸중의 1차 재관류 치료","Intravenous tissue Plasminogen Activator — first-line reperfusion therapy for acute ischemic stroke")}
            value={selectedProv && prov ? prov.tpaRate : KSR.revascularization.ivTpa.pct}
            unit="%" icon="💉" color="#b388ff" source={selectedProv ? 'KDCA 추정' : 'KSR 2024'}
            provinceName={selectedProv && prov ? selectedProv : null}
            nationalValue={selectedProv && prov ? KSR.revascularization.ivTpa.pct : null}
            onClick={() => { setCol2Metric('tpa'); setDetailPopup({ title: t('IV-tPA 시행률','IV-tPA Rate'), content: t('6.1% (KSR 2022). 10.2%→6.1% 하락 — 도착률 26.2%로 적응 환자 제한. 혈전제거술 3.0%→6.5% 2배↑ 대체.','6.1% (KSR 2022). 10.2%→6.1% decline — limited eligible patients due to 26.2% arrival rate. Thrombectomy 3.0%→6.5% doubled as substitute.') }); }}
          />
          <KPIMini label={t("혈전제거","Thrombectomy")}
            infoTip={t("기계적 혈전제거술(Mechanical Thrombectomy) — 대혈관 폐색(LVO) 시 카테터로 혈전을 물리적으로 제거","Mechanical Thrombectomy — physically removes clot via catheter in large vessel occlusion (LVO)")} value={KSR.revascularization.thrombectomy.pct} unit="%" icon="🔧" color="#00ff88" source="KSR 2024"
            provinceName={selectedProv ? null : null}
            onClick={() => setDetailPopup({ title: t('혈전제거술','Thrombectomy'), content: t('6.5% (KSR 2022). 3.0%→6.5% 2배↑. 지역: 전북 26.1%(최고)~서울 12.9%(최저). LVO에 효과적. 시도별 데이터는 KSR 전국만.','6.5% (KSR 2022). 3.0%→6.5% doubled. Regional: Jeonbuk 26.1% (highest) ~ Seoul 12.9% (lowest). Effective for LVO. Only national KSR data available.') })}
          />
          <KPIMini label={t("mRS 0-1","mRS 0-1")}
            infoTip={t("Modified Rankin Scale 0-1 — 증상 없음~유의한 장애 없음. 독립적 일상생활 가능","Modified Rankin Scale 0-1 — no symptoms to no significant disability. Independent in daily activities")} value={KSR.outcomes.mrs01.pct} unit="%" icon="✅" color="#00ff88"
            source={selectedProv ? t('전국 기준 (KSR)','National baseline (KSR)') : 'KSR 2024'}
            onClick={() => setDetailPopup({ title: t('좋은 예후 (mRS 0-1)','Good outcome (mRS 0-1)'), content: t('퇴원 시 mRS 0-1: 44.1% (KSR 2022). 39.7%→44.1% 개선. mRS 0-2(독립 생활): 61.2%. 경증 비율↑ + 재관류 발전 기여.','Discharge mRS 0-1: 44.1% (KSR 2022). 39.7%→44.1% improvement. mRS 0-2 (independent living): 61.2%. Increased mild cases + revascularization advances.') })}
          />
          <KPIMini label={t("원내사망","In-hospital Death")}
            infoTip={t("입원 기간 중 사망한 환자 비율","Proportion of patients who died during hospitalization")} value={KSR.outcomes.inHospitalMortality.pct} unit="%" icon="📉" color="#ff6b6b"
            source={selectedProv ? t('전국 기준 (KSR)','National baseline (KSR)') : 'KSR 2024'}
            onClick={() => setDetailPopup({ title: t('원내 사망률','In-hospital Mortality'), content: t('원내 사망 2.6% (KSR 2022). 1.0%→2.6% 증가 — 85세↑ 초고령 환자 2배 증가(6.6%→10.7%)가 주 원인.','In-hospital death 2.6% (KSR 2022). 1.0%→2.6% increase — mainly due to doubling of 85+ patients (6.6%→10.7%).') })}
          />
          <KPIMini label={t('AF 첫진단','AF New Dx')}
            infoTip={t("심방세동(Atrial Fibrillation) — 심인성 색전 뇌졸중의 89.9% 원인. 항응고제로 예방 가능","Atrial Fibrillation — causes 89.9% of cardioembolism strokes. Preventable with anticoagulants")} value="46" unit="%" icon="💔" color="#e74c3c"
            source={selectedProv ? t('전국 기준 (KSR)','National baseline (KSR)') : 'KSR 2024'}
            onClick={() => setDetailPopup({ title: t('심방세동 입원 시 첫 진단','AF First Diagnosed at Admission'), content: t('뇌졸중 환자 중 심방세동(AF) 20% 동반. 이 중 46%가 입원 시 처음 진단 — 지역사회 AF 선별검사 부족을 시사. AF는 심인성 색전(CE) 뇌졸중의 89.9% 차지. 조기 발견 시 항응고제로 뇌졸중 예방 가능.','AF present in 20% of stroke patients. 46% first diagnosed at admission — suggests inadequate community AF screening. AF accounts for 89.9% of CE strokes. Early detection enables anticoagulant prevention.') })}
          />
        </div>
      </div>

      {/* ═══════ COLUMN 2: 시도별 + 치료 분석 ═══════ */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflow: 'hidden' }}>
        {/* Top: 시도별 환자수 바차트 */}
        <Panel style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexShrink: 0 }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#e8e8f0' }}>
              {t('시도별','By Province')} {metricLabels[col2Metric]}
              {strokeType !== 'all' && col2Metric === 'patients' && (
                <span style={{ fontSize: '9px', color: strokeType === 'ischemic' ? '#4d96ff' : '#ff6b6b', fontWeight: 600, marginLeft: '6px' }}>
                  {strokeType === 'ischemic' ? t('허혈성','Ischemic') : t('출혈성','Hemorrhagic')}
                </span>
              )}
            </span>
            <div style={{ display: 'flex', gap: '4px' }}>
              {Object.keys(metricConfig).map(m => (
                <button
                  key={m}
                  onClick={() => setCol2Metric(m)}
                  style={{
                    padding: '3px 8px', fontSize: '10px', borderRadius: '6px', cursor: 'pointer',
                    border: col2Metric === m ? '1px solid rgba(0,212,255,0.5)' : '1px solid rgba(255,255,255,0.1)',
                    background: col2Metric === m ? 'rgba(0,212,255,0.15)' : 'transparent',
                    color: col2Metric === m ? '#00d4ff' : '#aaaacc',
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
              ━ {t('전국 평균','National Avg')} {col2NatAvg}
            </div>
          )}
        </Panel>

        {/* Bottom: 치료 패러다임 변화 tPA vs 혈전제거술 10년 추이 */}
        <Panel style={{ flex: '0 0 auto', minHeight: '180px' }}>
          <TrendLineChart
            title={t("치료 패러다임 변화: IV-tPA vs 혈전제거술 (10년)","Treatment Paradigm Shift: IV-tPA vs Thrombectomy (10yr)")}
            years={['2012','2014','2016','2018','2020','2022']}
            lines={[
              { label: 'IV-tPA', color: '#b388ff', data: [10.2, 9.5, 8.8, 7.5, 6.8, 6.1] },
              { label: t('혈전제거술','Thrombectomy'), color: '#00ff88', data: [3.0, 3.2, 4.0, 4.8, 5.5, 6.5] },
            ]}
          />
          <div style={{ fontSize: '10px', color: '#aaaacc', marginTop: '6px', textAlign: 'center' }}>
            {t('재관류 치료 총','Total recanalization')} {KSR.revascularization.total.pct}% | {t('지역 편차','Regional range')} {KSR.revascularization.regionalRange.min}%~{KSR.revascularization.regionalRange.max}%
          </div>
        </Panel>
      </div>

      {/* ═══════ COLUMN 3: 연령·중증도·예후 (전국) / 이송·퇴원·위험인자 (시도) ═══════ */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflow: 'auto' }}>
        {!selectedProv ? (
          <>
            {/* ── National view ── */}
            {/* 연령별 환자분포 */}
            <Panel style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px', flexShrink: 0 }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#e8e8f0' }}>
                  {strokeType === 'all'
                    ? t('연령별 허혈성 뇌졸중 환자수','Ischemic Stroke Patients by Age')
                    : strokeType === 'ischemic'
                      ? t('연령별 허혈성 뇌졸중 환자수','Ischemic Stroke Patients by Age')
                      : t('연령별 출혈성 뇌졸중 환자수','Hemorrhagic Stroke Patients by Age')}
                  <span style={{ fontSize: '10px', color: '#aaaacc', fontWeight: 400 }}> {t('(전국)','(National)')}</span>
                </span>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {[{k:'전체',l:t('전체','All')},{k:'남자',l:t('남자','Male')},{k:'여자',l:t('여자','Female')}].map(({k:g,l:gl}) => (
                    <button
                      key={g}
                      onClick={() => setGender(g)}
                      style={{
                        padding: '3px 8px', fontSize: '10px', borderRadius: '6px', cursor: 'pointer',
                        border: gender === g ? '1px solid rgba(0,212,255,0.5)' : '1px solid rgba(255,255,255,0.1)',
                        background: gender === g ? 'rgba(0,212,255,0.15)' : 'transparent',
                        color: gender === g ? '#00d4ff' : '#aaaacc',
                        fontFamily: "'Noto Sans KR'",
                      }}
                    >{gl}</button>
                  ))}
                </div>
              </div>
              <div style={{ flex: 1, minHeight: 0 }}>
                {ageDist ? (
                  <VerticalBarChart data={ageDist} labels={AGE_LABELS} title="" />
                ) : (
                  <div style={{ color: '#9999bb', fontSize: '12px', textAlign: 'center', paddingTop: '40px' }}>{t('데이터 없음','No data')}</div>
                )}
              </div>
              <div style={{ fontSize: '9px', color: '#9999bb', marginTop: '4px', textAlign: 'right', flexShrink: 0 }}>
                {strokeType === 'all' ? (
                  <>{t('평균연령','Mean age')} {KSR.demographics.meanAge}{t('세','yr')} | {t('남성','Male')} {KSR.demographics.maleRatio}% | 85{t('세+','+')} {KSR.demographics.elderly85plus.pct}% <span style={{ color: '#444' }}>KOSIS 2019-2021 + KSR</span></>
                ) : (
                  <><span style={{ color: strokeType === 'ischemic' ? '#4d96ff' : '#ff6b6b' }}>{strokeType === 'ischemic' ? t('허혈성','Ischemic') : t('출혈성','Hemorrhagic')}</span> | <span style={{ color: '#444' }}>KOSIS 2022-2024</span></>
                )}
              </div>
            </Panel>

            {/* NIHSS 중증도 분포 */}
            <Panel style={{ flex: '0 0 auto', opacity: strokeType === 'hemorrhagic' ? 0.35 : 1, position: 'relative' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#e8e8f0', marginBottom: '8px' }}>
                {t('NIHSS 중증도 분포','NIHSS Severity Distribution')} <span style={{ fontSize: '10px', color: '#aaaacc', fontWeight: 400 }}>{t('중앙값','Median')} {KSR.severity.median} (IQR {KSR.severity.iqr[0]}-{KSR.severity.iqr[1]})</span>
                {strokeType !== 'all' && <span style={{ fontSize: '9px', color: '#bbbbdd', marginLeft: '4px' }}>KSR ({t('허혈성만','Ischemic only')})</span>}
              </div>
              {strokeType === 'hemorrhagic' && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2, pointerEvents: 'none' }}>
                  <span style={{ fontSize: '11px', color: '#ff6b6b', background: 'rgba(10,10,15,0.8)', padding: '4px 12px', borderRadius: '6px' }}>
                    {t('출혈성 데이터 없음 (KSR 허혈성 레지스트리)','No hemorrhagic data (KSR ischemic registry)')}
                  </span>
                </div>
              )}
              <StackedBar
                segments={[
                  { label: t('NIHSS 0-3 경증','NIHSS 0-3 Minor'), value: KSR.severity.minor.pct, color: '#00ff88' },
                  { label: t('NIHSS 4-14 중등도','NIHSS 4-14 Moderate'), value: KSR.severity.moderate.pct, color: '#ffaa00' },
                  { label: t('NIHSS 15+ 중증','NIHSS 15+ Severe'), value: KSR.severity.severe.pct, color: '#ff4444' },
                ]}
                onClick={strokeType !== 'hemorrhagic' ? handleSeverityClick : undefined}
              />
            </Panel>

            {/* 예후 mRS 분포 */}
            <Panel style={{ flex: '0 0 auto', opacity: strokeType === 'hemorrhagic' ? 0.35 : 1, position: 'relative' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#e8e8f0', marginBottom: '8px' }}>
                {t('퇴원 시 예후','Discharge Outcome')} (mRS) <span style={{ fontSize: '10px', color: '#aaaacc', fontWeight: 400 }}>KSR 2022</span>
                {strokeType !== 'all' && <span style={{ fontSize: '9px', color: '#bbbbdd', marginLeft: '4px' }}>KSR ({t('허혈성만','Ischemic only')})</span>}
              </div>
              {strokeType === 'hemorrhagic' && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2, pointerEvents: 'none' }}>
                  <span style={{ fontSize: '11px', color: '#ff6b6b', background: 'rgba(10,10,15,0.8)', padding: '4px 12px', borderRadius: '6px' }}>
                    {t('출혈성 데이터 없음 (KSR 허혈성 레지스트리)','No hemorrhagic data (KSR ischemic registry)')}
                  </span>
                </div>
              )}
              <StackedBar
                segments={[
                  { label: t('mRS 0-1 좋은예후','mRS 0-1 Good outcome'), value: KSR.outcomes.mrs01.pct, color: '#00ff88' },
                  { label: t('mRS 2 경미장애','mRS 2 Minor disability'), value: 17.1, color: '#00d4ff' },
                  { label: t('mRS 3-5 장애','mRS 3-5 Disability'), value: 36.2, color: '#ffaa00' },
                  { label: t('mRS 6 원내사망','mRS 6 In-hospital death'), value: KSR.outcomes.inHospitalMortality.pct, color: '#ff4444' },
                ]}
                onClick={strokeType !== 'hemorrhagic' ? handleMrsClick : undefined}
              />
              <div style={{ fontSize: '10px', color: '#bbbbdd', marginTop: '6px' }}>
                {t('독립적 생활','Independent living')} (mRS 0-2): <span style={{ color: '#00ff88', fontWeight: 700, fontFamily: "'JetBrains Mono'" }}>{KSR.outcomes.mrs02.pct}%</span>
              </div>
            </Panel>
          </>
        ) : (
          <>
            {/* ── Province view ── */}
            {/* 이송시간 분포 */}
            <Panel style={{ flex: '0 0 auto' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#e8e8f0', marginBottom: '8px' }}>
                {t('이송시간 분포','Transport Time Distribution')} <span style={{ color: '#ffd60a', fontSize: '11px' }}>{provName(selectedProv)}</span>
              </div>
              {(() => {
                const tDist = getTransportDist(selectedProv);
                const natDist = getTransportDist(null);
                if (!tDist) return <div style={{ color: '#9999bb', fontSize: '12px', textAlign: 'center' }}>{t('데이터 없음','No data')}</div>;
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
                          <span style={{ fontSize: '9px', color: '#aaaacc', marginTop: '3px', whiteSpace: 'nowrap' }}>
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
                  <div style={{ fontSize: '9px', color: '#bbbbdd', marginTop: '6px', textAlign: 'right' }}>
                    {t('3시간 내 도착:','Within 3hr:')} <span style={{ color: '#ffd60a', fontWeight: 700, fontFamily: "'JetBrains Mono'" }}>{prov3h}%</span>
                    <span style={{ color: '#9999bb', marginLeft: '6px' }}>{t('전국','National')} {nat3h}%</span>
                  </div>
                );
              })()}
            </Panel>

            {/* 뇌졸중 위험인자 프로파일 */}
            <Panel style={{ flex: '0 0 auto' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#ff6b6b', marginBottom: '10px' }}>
                {t('뇌졸중 위험인자','Stroke Risk Factors')} <span style={{ color: '#ffd60a', fontSize: '11px' }}>{provName(selectedProv)}</span>
                <span style={{ fontSize: '10px', color: '#aaaacc', fontWeight: 400 }}> {t('검진통계연보','Health Screening Stats')}</span>
              </div>
              {(() => {
                const examRisk = getExamRiskFactors(selectedProv);
                const natExam = getExamNationalAvg();
                const provInfo = PROVINCE_INFO[selectedProv];
                if (!examRisk || !provInfo) return <div style={{ color: '#9999bb', fontSize: '12px', textAlign: 'center' }}>{t('데이터 없음','No data')}</div>;
                const items = [
                  { label: t('혈압 이상','High BP'), value: examRisk.bpHigh, national: natExam.bpHigh, unit: '%', src: t('수축기BP 90+','SBP 90+') },
                  { label: t('혈당 이상','High Glucose'), value: examRisk.glucoseHigh, national: natExam.glucoseHigh, unit: '%', src: t('공복혈당 100+','FBG 100+') },
                  { label: t('콜레스테롤','Cholesterol'), value: examRisk.cholesterolHigh, national: natExam.cholesterolHigh, unit: '%', src: t('총콜레스테롤 200+','TC 200+') },
                  { label: t('비만','Obesity'), value: examRisk.obesityRate, national: natExam.obesityRate, unit: '%', src: 'BMI 25+' },
                  { label: '흡연', value: provInfo.smokingRate, national: NATIONAL_AVG.smokingRate, unit: '%', src: '현재흡연율' },
                  { label: t('음주','Drinking'), value: provInfo.drinkingRate, national: NATIONAL_AVG.drinkingRate, unit: '%', src: t('주2회+','2+/wk') },
                  { label: t('운동부족','No Exercise'), value: provInfo.noExerciseRate, national: NATIONAL_AVG.noExerciseRate, unit: '%', src: t('고강도 0일','0 intense days') },
                ];
                return (
                  <div>
                    {items.map(({ label, value, national, unit, src }) => {
                      const diff = value - national;
                      const isWorse = diff > 0;
                      const maxBar = Math.max(value, national, 1);
                      const barW = (value / maxBar) * 100;
                      const natW = (national / maxBar) * 100;
                      return (
                        <div key={label} style={{ marginBottom: '6px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginBottom: '2px' }}>
                            <span style={{ color: '#bbbbdd' }}>{label} <span style={{ color: '#9999bb', fontSize: '9px' }}>({src})</span></span>
                            <span style={{ color: isWorse ? '#ff6b6b' : '#00ff88', fontFamily: "'JetBrains Mono'", fontWeight: 700, fontSize: '11px' }}>
                              {value}{unit}
                              <span style={{ color: '#9999bb', fontSize: '9px', marginLeft: '3px' }}>
                                ({diff >= 0 ? '+' : ''}{diff.toFixed(1)})
                              </span>
                            </span>
                          </div>
                          <div style={{ position: 'relative', height: '5px', background: 'rgba(255,255,255,0.04)', borderRadius: '3px' }}>
                            <div style={{
                              position: 'absolute', height: '100%', borderRadius: '3px',
                              width: `${barW}%`,
                              background: isWorse ? 'linear-gradient(90deg, #ff4444, #ff6b6b)' : 'linear-gradient(90deg, #00cc66, #00ff88)',
                              opacity: 0.7,
                            }} />
                            <div style={{
                              position: 'absolute', left: `${natW}%`, top: '-2px', bottom: '-2px',
                              width: '1.5px', background: '#00d4ff', borderRadius: '1px', opacity: 0.8,
                            }} />
                          </div>
                        </div>
                      );
                    })}
                    <div style={{ fontSize: '9px', color: '#9999bb', marginTop: '4px', textAlign: 'right' }}>
                      ━ <span style={{ color: '#00d4ff' }}>{t('전국 평균','Natl Avg')}</span> | <span style={{ color: '#ff6b6b' }}>{t('빨강','Red')}</span>={t('전국 이상','Above')} <span style={{ color: '#00ff88' }}>{t('초록','Green')}</span>={t('전국 이하','Below')}
                    </div>
                  </div>
                );
              })()}
            </Panel>

            {/* 퇴원 결과 */}
            <Panel style={{ flex: '0 0 auto' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#e8e8f0', marginBottom: '8px' }}>
                {t('퇴원 결과','Discharge Disposition')} <span style={{ color: '#ffd60a', fontSize: '11px' }}>{provName(selectedProv)}</span>
                <span style={{ fontSize: '10px', color: '#aaaacc', fontWeight: 400 }}> KOSIS 2023</span>
              </div>
              {(() => {
                const outcomePcts = getOutcomeDist(selectedProv);
                if (!outcomePcts) return <div style={{ color: '#9999bb', fontSize: '12px', textAlign: 'center' }}>{t('데이터 없음','No data')}</div>;
                return (
                  <StackedBar
                    segments={outcomePcts.map((pct, i) => ({
                      label: outcomeLabels[i],
                      value: pct,
                      color: OUTCOME_COLORS[i],
                    }))}
                  />
                );
              })()}
            </Panel>

            {/* 퇴원 결과 연도별 추이 */}
            <Panel style={{ flex: '0 0 auto' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#e8e8f0', marginBottom: '8px' }}>
                {t('퇴원 결과 추이','Discharge Trend')} <span style={{ color: '#ffd60a', fontSize: '11px' }}>{provName(selectedProv)}</span>
                <span style={{ fontSize: '10px', color: '#aaaacc', fontWeight: 400 }}> 2022-2024</span>
              </div>
              {(() => {
                const trend = getOutcomeTrend(selectedProv);
                if (!trend) return <div style={{ color: '#9999bb', fontSize: '12px', textAlign: 'center' }}>{t('데이터 없음','No data')}</div>;
                const years = trend.map(t => t.year);
                return (
                  <div>
                    <svg width="100%" viewBox="0 0 220 90" style={{ overflow: 'visible' }}>
                      {/* grid */}
                      {[0, 25, 50, 75, 100].map((v) => {
                        const y = 10 + (80 - v * 0.8);
                        return <line key={v} x1="30" y1={y} x2="210" y2={y} stroke="rgba(255,255,255,0.05)" />;
                      })}
                      {/* lines */}
                      {[
                        { key: '입원', color: '#00d4ff' },
                        { key: '퇴가', color: '#00ff88' },
                        { key: '전원', color: '#ffd60a' },
                        { key: '사망', color: '#ff4444' },
                      ].map(({ key, color }) => {
                        const vals = trend.map(t => t[key]);
                        const maxV = Math.max(...[
                          ...trend.map(t => t['입원']),
                          ...trend.map(t => t['퇴가']),
                        ], 1);
                        const pts = vals.map((v, i) => {
                          const x = 30 + (i / (years.length - 1)) * 180;
                          const y = 10 + 70 - (v / maxV) * 70;
                          return `${x},${y}`;
                        }).join(' ');
                        const lastVal = vals[vals.length - 1];
                        const lastX = 30 + ((years.length - 1) / (years.length - 1)) * 180;
                        const lastY = 10 + 70 - (lastVal / maxV) * 70;
                        return (
                          <g key={key}>
                            <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
                            {vals.map((v, i) => {
                              const x = 30 + (i / (years.length - 1)) * 180;
                              const y = 10 + 70 - (v / maxV) * 70;
                              return <circle key={i} cx={x} cy={y} r="2.5" fill={color} stroke="#12121a" strokeWidth="1" />;
                            })}
                            <text x={lastX + 3} y={lastY + 3} fill={color} fontSize="8" fontFamily="'JetBrains Mono'" fontWeight="700">
                              {lastVal}%
                            </text>
                          </g>
                        );
                      })}
                      {/* x labels */}
                      {years.map((yr, i) => (
                        <text key={yr} x={30 + (i / (years.length - 1)) * 180} y={88} textAnchor="middle" fill="#aaaacc" fontSize="8" fontFamily="'JetBrains Mono'">
                          {yr}
                        </text>
                      ))}
                    </svg>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '4px', justifyContent: 'center', flexWrap: 'wrap' }}>
                      {[
                        { label: t('입원','Admitted'), color: '#00d4ff' },
                        { label: t('퇴가','Discharged'), color: '#00ff88' },
                        { label: t('전원','Transferred'), color: '#ffd60a' },
                        { label: t('사망','Death'), color: '#ff4444' },
                      ].map(item => (
                        <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <div style={{ width: '10px', height: '2px', background: item.color, borderRadius: '1px' }} />
                          <span style={{ fontSize: '9px', color: '#bbbbdd' }}>{item.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </Panel>

            {/* 시도 요약 */}
            <Panel style={{ flex: '0 0 auto' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#b388ff', marginBottom: '8px' }}>{t('시도 요약','Province Summary')}</div>
              {prov && (
                <div style={{ fontSize: '11px', color: '#ccc', lineHeight: 1.8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ color: '#bbbbdd' }}>{t('인구','Population')}</span>
                    <span style={{ fontFamily: "'JetBrains Mono'", fontWeight: 700, color: '#e8e8f0' }}>{lang === 'ko' ? `${(prov.population / 10000).toFixed(0)}만명` : `${(prov.population / 1000000).toFixed(1)}M`}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ color: '#bbbbdd' }}>고령화율</span>
                    <span style={{ fontFamily: "'JetBrains Mono'", fontWeight: 700, color: prov.agingRate > NATIONAL_AVG.agingRate ? '#ff6b6b' : '#00ff88' }}>{prov.agingRate}%</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ color: '#bbbbdd' }}>{t('의사밀도','Doctors Density')}</span>
                    <span style={{ fontFamily: "'JetBrains Mono'", fontWeight: 700, color: prov.doctorsPerThousand < NATIONAL_AVG.doctorsPerThousand ? '#ff6b6b' : '#00ff88' }}>{prov.doctorsPerThousand}/{t('천명','/1k')}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ color: '#bbbbdd' }}>{t('상급종합병원','Tertiary Hospitals')}</span>
                    <span style={{ fontFamily: "'JetBrains Mono'", fontWeight: 700, color: '#00d4ff' }}>{prov.tertiaryHospitals}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#bbbbdd' }}>{t('미충족의료','Unmet Medical Need')}</span>
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
                  <span style={{ fontSize: '22px', fontWeight: 900, color: '#00d4ff' }}>{provName(selectedProv)}</span>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: '#e8e8f0', fontFamily: "'JetBrains Mono'" }}>
                    {(getPatientCount(selectedProv) || Math.round(prov.strokeIncidence * prov.population / 100000)).toLocaleString()}명
                  </span>
                  <span style={{ fontSize: '10px', color: '#aaaacc' }}>{t('허혈성 뇌졸중','Ischemic Stroke')}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginTop: '10px' }}>
                  {[
                    { label: t('발생률','Incidence'), val: prov.strokeIncidence, unit: '/100k', rank: rankings?.incidence, color: '#ff6b6b' },
                    { label: t('사망률','Mortality'), val: prov.strokeMortality, unit: '/100k', rank: rankings?.mortality, color: '#ff4444' },
                    { label: 'tPA', val: prov.tpaRate, unit: '%', rank: rankings?.tpa, color: '#b388ff' },
                    { label: t('골든타임','Golden Time'), val: prov.goldenTimeRate, unit: '%', rank: rankings?.goldenTime, color: '#ffaa00' },
                  ].map(({ label, val, unit, rank: r, color }) => (
                    <div key={label} style={{
                      background: 'rgba(255,255,255,0.03)', borderRadius: '6px', padding: '6px 8px',
                      border: '1px solid rgba(255,255,255,0.04)',
                    }}>
                      <div style={{ fontSize: '10px', color: '#bbbbdd' }}>{label}</div>
                      <span style={{ fontSize: '14px', fontWeight: 900, fontFamily: "'JetBrains Mono'", color }}>{val}</span>
                      <span style={{ fontSize: '9px', color: '#aaaacc' }}>{unit} ({r}/17)</span>
                    </div>
                  ))}
                </div>
              </Panel>

              {/* 사회경제 지표 */}
              <Panel style={{ flexShrink: 0 }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#b388ff', marginBottom: '10px' }}>{t('사회경제 연관 지표','Socioeconomic Indicators')}</div>
                <CompareBar label="고령화율" value={prov.agingRate} national={NATIONAL_AVG.agingRate} unit="%" />
                <CompareBar label={t("의사밀도 (/천명)","Doctors (/1k pop)")} value={prov.doctorsPerThousand} national={NATIONAL_AVG.doctorsPerThousand} unit="" higherIsWorse={false} />
                <CompareBar label={t("미충족의료","Unmet Medical")} value={prov.unmetMedical} national={NATIONAL_AVG.unmetMedical} unit="%" />
                <CompareBar label={t("1인당 GRDP (만원)","GRDP/capita (10k KRW)")} value={Math.round(prov.grdp / prov.population * 10000000)} national={NATIONAL_AVG.grdpPerCapita} unit="" higherIsWorse={false} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginTop: '4px' }}>
                  <span style={{ color: '#bbbbdd' }}>{t('상급종합병원','Tertiary Hospitals')}</span>
                  <span style={{ color: '#00d4ff', fontFamily: "'JetBrains Mono'", fontWeight: 700 }}>{prov.tertiaryHospitals}</span>
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
                  {t('위험인자 프로파일','Risk Factor Profile')} <span style={{ fontSize: '10px', color: '#aaaacc', fontWeight: 400 }}>{t('허혈성 뇌졸중 환자 중','Among ischemic stroke patients')}</span>
                </div>
                {Object.entries(KSR.riskFactors).map(([key, rf]) => {
                  const labels = { hypertension: t('고혈압','Hypertension'), dyslipidemia: t('이상지질혈증','Dyslipidemia'), diabetes: t('당뇨','Diabetes'), smoking: t('현재 흡연','Current Smoking'), atrialFib: t('심방세동','Atrial Fibrillation') };
                  const colors = { hypertension: '#ff4444', dyslipidemia: '#ffaa00', diabetes: '#ff6b6b', smoking: '#b388ff', atrialFib: '#00d4ff' };
                  return (
                    <div
                      key={key}
                      onClick={() => handleRiskClick(key)}
                      style={{ marginBottom: '8px', cursor: 'pointer' }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '3px' }}>
                        <span style={{ color: '#bbbbdd' }}>{labels[key]}</span>
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
                  {t('TOAST 분류','TOAST Classification')} <span style={{ fontSize: '10px', color: '#aaaacc', fontWeight: 400 }}>{t('허혈성 뇌졸중 아형','Ischemic stroke subtypes')}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <DonutChart
                    size={110}
                    centerLabel="TOAST"
                    segments={[
                      { label: t('대혈관 죽상경화','LAA'), value: KSR.toast.laa.pct, color: '#ff6b6b' },
                      { label: t('소혈관 폐색','SVO'), value: KSR.toast.svo.pct, color: '#ffaa00' },
                      { label: t('심인성 색전','CE'), value: KSR.toast.ce.pct, color: '#00d4ff' },
                      { label: t('기타/불명','Other/Unknown'), value: KSR.toast.other.pct, color: '#9999bb' },
                    ]}
                    onSegmentClick={handleToastClick}
                  />
                  <div style={{ flex: 1, fontSize: '10px' }}>
                    {[
                      { label: t('LAA 대혈관','LAA'), pct: KSR.toast.laa.pct, color: '#ff6b6b', note: t('감소','Decreasing') },
                      { label: t('SVO 소혈관','SVO'), pct: KSR.toast.svo.pct, color: '#ffaa00', note: t('증가','Increasing') },
                      { label: t('CE 심인성','CE'), pct: KSR.toast.ce.pct, color: '#00d4ff', note: t('안정','Stable') },
                      { label: t('기타/불명','Other/Unknown'), pct: KSR.toast.other.pct, color: '#9999bb', note: '' },
                    ].map(item => (
                      <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px', cursor: 'pointer' }}
                        onClick={() => handleToastClick({ label: item.label.split(' ').pop() === '심인성' ? '심인성 색전' : item.label.includes('대혈관') ? '대혈관 죽상경화' : item.label.includes('소혈관') ? '소혈관 폐색' : '기타/불명' })}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: item.color }} />
                        <span style={{ color: '#bbbbdd' }}>{item.label}</span>
                        <span style={{ color: item.color, fontFamily: "'JetBrains Mono'", fontWeight: 700 }}>{item.pct}%</span>
                        {item.note && <span style={{ color: '#9999bb', fontSize: '9px' }}>{item.note}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              </Panel>

              {/* 핵심 인사이트 */}
              <Panel>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#ffaa00', marginBottom: '8px' }}>{t('핵심 인사이트','Key Insights')}</div>
                <div style={{ fontSize: '11px', color: '#ccc', lineHeight: 1.8 }}>
                  <div style={{ marginBottom: '8px', padding: '8px', background: 'rgba(255,170,0,0.06)', borderRadius: '8px', border: '1px solid rgba(255,170,0,0.15)' }}>
                    <strong style={{ color: '#ffaa00' }}>AF 46%가 뇌졸중 입원 시 첫 진단</strong>
                    <div style={{ color: '#ccccdd', marginTop: '2px' }}>{t('심방세동 사전 스크리닝 부족 → 1차 예방 기회 상실','Lack of AF pre-screening → missed primary prevention')}</div>
                  </div>
                  <div style={{ marginBottom: '8px', padding: '8px', background: 'rgba(255,68,68,0.06)', borderRadius: '8px', border: '1px solid rgba(255,68,68,0.15)' }}>
                    <strong style={{ color: '#ff6b6b' }}>{t('3.5h 내 도착률 26.2% — 10년간 변화 없음','3.5h arrival rate 26.2% — no change in 10 years')}</strong>
                    <div style={{ color: '#ccccdd', marginTop: '2px' }}>{t('tPA 투여 가능 시간 내 도착 4명 중 1명. 증상 인지 교육 시급','Only 1 in 4 arrive within tPA window. Symptom awareness education urgent')}</div>
                  </div>
                  <div style={{ padding: '8px', background: 'rgba(0,255,136,0.06)', borderRadius: '8px', border: '1px solid rgba(0,255,136,0.15)' }}>
                    <strong style={{ color: '#00ff88' }}>{t('혈전제거술 2배 증가 (3.0%→6.5%)','Thrombectomy doubled (3.0%→6.5%)')}</strong>
                    <div style={{ color: '#ccccdd', marginTop: '2px' }}>{t('tPA 하락을 보상. 지역 편차(12.9~26.1%) 해소 필요','Compensating tPA decline. Regional gap (12.9~26.1%) needs attention')}</div>
                  </div>
                </div>
              </Panel>

              {/* 허혈성/출혈성 비교 (2022-2024) */}
              {strokeType !== 'all' && (
                <Panel>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: strokeType === 'ischemic' ? '#4d96ff' : '#ff6b6b', marginBottom: '10px' }}>
                    {strokeType === 'ischemic' ? t('허혈성 뇌졸중 (2022-2024)','Ischemic Stroke (2022-2024)') : t('출혈성 뇌졸중 (2022-2024)','Hemorrhagic Stroke (2022-2024)')}
                  </div>
                  <StrokeTypePanel type={strokeType} kosis={STROKE_KOSIS} selectedProv={selectedProv} lang={lang} t={t} />
                </Panel>
              )}
              {strokeType === 'all' && (
                <Panel>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#00d4ff', marginBottom: '10px' }}>
                    {t('허혈성 vs 출혈성 추이 (2022-2024)','Ischemic vs Hemorrhagic Trend (2022-2024)')}
                  </div>
                  <TypeComparison kosis={STROKE_KOSIS} selectedProv={selectedProv} lang={lang} t={t} />
                </Panel>
              )}

              {/* 지도 안내 */}
              <Panel>
                <div style={{ fontSize: '11px', color: '#aaaacc', textAlign: 'center' }}>
                  {t('지도에서 시도를 클릭하면 지역별 상세 분석이 표시됩니다','Click a province on the map for detailed regional analysis')}
                </div>
              </Panel>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Inline inference panel — always visible */}
        <Panel style={{ flexShrink: 0, borderLeft: `3px solid ${detailPopup ? '#00d4ff' : '#4a4a6a'}` }}>
          {(() => {
            const info = detailPopup || defaultInference;
            return (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: detailPopup ? '#00d4ff' : '#bbbbdd' }}>{info.title}</span>
                  {detailPopup && (
                    <button onClick={() => setDetailPopup(null)} style={{
                      background: 'none', border: 'none', color: '#9999bb', cursor: 'pointer', fontSize: '12px',
                    }}>✕</button>
                  )}
                </div>
                <div style={{ fontSize: '11px', color: '#bbb', lineHeight: 1.7 }}>{info.content}</div>
              </>
            );
          })()}
        </Panel>

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
          {t('출처','Source')}: KSR {t('한국뇌졸중등록사업','Korea Stroke Registry')} 2024 (97 {t('병원','hospitals')}, 171,520{t('건','cases')}), KOSIS {t('심뇌혈관질환통계','Cardiovascular Disease Stats')} (orgId=411), KDCA {t('심뇌혈관질환 발생통계','CVD Incidence Stats')} 2022, {t('심평원','HIRA')}, OECD Health at a Glance 2025
        </div>
      </div>
    </div>
  );
}

// ── 허혈성/출혈성 타입별 패널 ──
function StrokeTypePanel({ type, kosis, selectedProv, lang, t }) {
  const data = type === 'ischemic' ? kosis.ischemic : kosis.hemorrhagic;
  if (!data) return <div style={{ color: '#9999bb', fontSize: '11px' }}>No data</div>;

  const prov = selectedProv || '전체';
  const color = type === 'ischemic' ? '#4d96ff' : '#ff6b6b';

  // Monthly data for selected province
  const months = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];
  const monthlyData = months.map(m => {
    const val = data.monthlyRegion?.[m]?.[prov];
    return { month: m.replace('월',''), count: val?.['2024'] || val?.['2023'] || 0 };
  });
  const maxMonthly = Math.max(...monthlyData.map(d => d.count), 1);

  // ER outcomes for province
  const erData = data.erResultRegion?.[prov] || {};
  const outcomes = ['퇴가','입원','전원','사망'];
  const erYear = '2024';
  const erValues = outcomes.map(o => {
    const item = erData[o];
    if (!item) return 0;
    // Find the first numeric value from item codes
    const vals = Object.values(item);
    if (vals.length > 0 && typeof vals[0] === 'object') {
      return vals[0][erYear] || vals[0]['2023'] || 0;
    }
    return item[erYear] || item['2023'] || 0;
  });
  const erTotal = erValues.reduce((a, b) => a + b, 0) || 1;

  // Transport by region
  const transportData = data.transportRegion?.[prov] || {};
  const vehicles = ['119구급차','기타구급차','자차/택시','도보/기타'];
  const vehYear = '2024';
  const vehValues = vehicles.map(v => transportData[v]?.[vehYear] || transportData[v]?.['2023'] || 0);
  const vehTotal = vehValues.reduce((a, b) => a + b, 0) || 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {/* Monthly bar */}
      <div>
        <div style={{ fontSize: '10px', color: '#bbbbdd', marginBottom: '6px' }}>
          {t(`월별 환자수 (${prov})`, `Monthly Cases (${prov})`, lang)}
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: '60px' }}>
          {monthlyData.map((d, i) => {
            const h = maxMonthly > 0 ? (d.count / maxMonthly) * 50 : 0;
            return (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: '100%', height: `${h}px`, background: `${color}66`, borderRadius: '2px 2px 0 0' }} />
                <div style={{ fontSize: '7px', color: '#9999bb', marginTop: '2px' }}>{d.month}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ER outcomes */}
      <div>
        <div style={{ fontSize: '10px', color: '#bbbbdd', marginBottom: '4px' }}>{t('응급진료 결과','ER Outcomes', lang)}</div>
        <div style={{ display: 'flex', height: '16px', borderRadius: '4px', overflow: 'hidden' }}>
          {outcomes.map((o, i) => {
            const w = (erValues[i] / erTotal) * 100;
            const colors = ['#6bcb77','#4d96ff','#ffd93d','#ff6b6b'];
            return w > 0 ? (
              <div key={o} style={{ width: `${w}%`, background: colors[i], position: 'relative' }}
                title={`${o}: ${erValues[i]} (${w.toFixed(1)}%)`} />
            ) : null;
          })}
        </div>
        <div style={{ display: 'flex', gap: '8px', marginTop: '4px', fontSize: '9px' }}>
          {outcomes.map((o, i) => {
            const colors = ['#6bcb77','#4d96ff','#ffd93d','#ff6b6b'];
            return (
              <span key={o} style={{ color: colors[i] }}>
                {o} {((erValues[i] / erTotal) * 100).toFixed(1)}%
              </span>
            );
          })}
        </div>
      </div>

      {/* Transport mode */}
      <div>
        <div style={{ fontSize: '10px', color: '#bbbbdd', marginBottom: '4px' }}>{t('내원수단','Transport Mode', lang)}</div>
        {vehicles.map((v, i) => {
          const pct = ((vehValues[i] / vehTotal) * 100).toFixed(1);
          const colors = ['#ff6b6b','#ff922b','#ffd93d','#bbbbdd'];
          return (
            <div key={v} style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
              <div style={{ width: '65px', fontSize: '9px', color: '#bbbbdd', textAlign: 'right' }}>{v}</div>
              <div style={{ flex: 1, height: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${pct}%`, height: '100%', background: colors[i], borderRadius: '3px' }} />
              </div>
              <div style={{ width: '35px', fontSize: '9px', color: '#aaaacc', fontFamily: "'JetBrains Mono'" }}>{pct}%</div>
            </div>
          );
        })}
      </div>

      <div style={{ fontSize: '8px', color: '#00d4ff66' }}>
        <a href="https://kosis.kr/" target="_blank" rel="noopener noreferrer" style={{ color: '#00d4ff66', textDecoration: 'none' }}>
          📎 KOSIS 심뇌혈관질환통계 2022-2024
        </a>
      </div>
    </div>
  );
}

// ── 허혈성 vs 출혈성 3년 추이 비교 (all 모드) ──
function TypeComparison({ kosis, selectedProv, lang, t }) {
  const prov = selectedProv || '전체';
  const years = ['2022', '2023', '2024'];

  const getTotal = (typeData, yr) => typeData?.monthlyRegion?.['계']?.[prov]?.[yr] || 0;

  const ischByYear = years.map(yr => getTotal(kosis.ischemic, yr));
  const hemByYear = years.map(yr => getTotal(kosis.hemorrhagic, yr));
  const allMax = Math.max(...ischByYear, ...hemByYear, 1);

  const latestIsch = ischByYear[ischByYear.length - 1] || ischByYear[ischByYear.length - 2];
  const latestHem = hemByYear[hemByYear.length - 1] || hemByYear[hemByYear.length - 2];
  const latestAll = latestIsch + latestHem || 1;

  const w = 260, h = 100, pl = 36, pr = 50, pt = 10, pb = 22;
  const plotW = w - pl - pr, plotH = h - pt - pb;
  const toX = (i) => pl + (i / (years.length - 1)) * plotW;
  const toY = (v) => pt + plotH - (v / allMax) * plotH;

  return (
    <div>
      {/* Summary bars */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
        {[
          { label: t('허혈성','Ischemic',lang), value: latestIsch, pct: ((latestIsch/latestAll)*100).toFixed(0), color: '#4d96ff' },
          { label: t('출혈성','Hemorrhagic',lang), value: latestHem, pct: ((latestHem/latestAll)*100).toFixed(0), color: '#ff6b6b' },
        ].map(item => (
          <div key={item.label} style={{ flex: 1, background: `${item.color}11`, border: `1px solid ${item.color}33`, borderRadius: '8px', padding: '6px 8px', textAlign: 'center' }}>
            <div style={{ fontSize: '9px', color: item.color, fontWeight: 600 }}>{item.label}</div>
            <div style={{ fontSize: '14px', fontWeight: 800, color: item.color, fontFamily: "'JetBrains Mono'" }}>{item.value.toLocaleString()}</div>
            <div style={{ fontSize: '9px', color: '#aaaacc' }}>{item.pct}%</div>
          </div>
        ))}
      </div>

      {/* 3-year trend lines */}
      <div style={{ fontSize: '9px', color: '#aaaacc', marginBottom: '4px' }}>{t('연도별 추이 (2022-2024)','Annual Trend (2022-2024)',lang)}</div>
      <svg width="100%" viewBox={`0 0 ${w} ${h}`} style={{ overflow: 'visible' }}>
        {years.map((yr, i) => (
          <text key={yr} x={toX(i)} y={h - 4} textAnchor="middle" fill="#aaaacc" fontSize="8" fontFamily="'JetBrains Mono'">{yr}</text>
        ))}
        {[
          { data: ischByYear, color: '#4d96ff', label: t('허혈성','Isch',lang) },
          { data: hemByYear, color: '#ff6b6b', label: t('출혈성','Hem',lang) },
        ].map((line, li) => {
          const pts = line.data.map((v, i) => `${toX(i)},${toY(v)}`).join(' ');
          const lastV = line.data[line.data.length - 1];
          const lastY2 = toY(lastV);
          return (
            <g key={li}>
              <polyline points={pts} fill="none" stroke={line.color} strokeWidth="2" strokeLinecap="round" />
              {line.data.map((v, i) => (
                <circle key={i} cx={toX(i)} cy={toY(v)} r="3" fill={line.color} stroke="#12121a" strokeWidth="1" />
              ))}
              <text x={toX(years.length - 1) + 4} y={lastY2 + (li === 0 ? -2 : 10)} fill={line.color} fontSize="8" fontFamily="'JetBrains Mono'" fontWeight="700">
                {lastV > 0 ? lastV.toLocaleString() : '—'}
              </text>
            </g>
          );
        })}
      </svg>
      <div style={{ display: 'flex', gap: '12px', marginTop: '4px', fontSize: '8px', justifyContent: 'center' }}>
        <span style={{ color: '#4d96ff' }}>■ {t('허혈성','Ischemic',lang)}</span>
        <span style={{ color: '#ff6b6b' }}>■ {t('출혈성','Hemorrhagic',lang)}</span>
      </div>
      {ischByYear[2] < ischByYear[1] && <div style={{ fontSize: '8px', color: '#ffd93d', marginTop: '4px' }}>⚠ 2024 {t('부분연도 가능','may be partial-year',lang)}</div>}
    </div>
  );
}
