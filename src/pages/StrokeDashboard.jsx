import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import KoreaMap from '../components/KoreaMap';
import { PROVINCE_INFO, NATIONAL_AVG } from '../data/province_info';
import { STROKE_KOSIS } from '../data/stroke_kosis';

const PROVINCES = [
  '서울','부산','대구','인천','광주','대전','울산','세종',
  '경기','강원','충북','충남','전북','전남','경북','경남','제주',
];

const TRANSPORT_KEYS = ['1시간미만','1~2시간','2~3시간','3~6시간','6시간이상'];
const TRANSPORT_LABELS = ['<1h','1-2h','2-3h','3-6h','6h+'];

// Grouped transport keys for dashboard display
const TRANSPORT_GROUPED_KEYS = ['3시간미만','3~6시간','6시간이상','미상'];
const TRANSPORT_GROUPED_LABELS = ['<3h','3-6h','6h+','미상'];

const AGE_GROUPS_KOSIS = ['1세미만','1~9세','10~19세','20~29세','30~39세','40~49세','50~59세','60~69세','70~79세','80세이상'];
const AGE_LABELS = ['<1','1-9','10-19','20-29','30-39','40-49','50-59','60-69','70-79','80+'];

// ── Utilities ────────────────────────────────────

function gradientColor(t) {
  // 0=cyan → 1=magenta
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

function generateStrokeInsight(provName, prov) {
  const parts = [];
  if (prov.agingRate > 22 && prov.goldenTimeRate < 35) {
    parts.push(`고령화율 ${prov.agingRate}%(전국 상위) + 골든타임 도착률 ${prov.goldenTimeRate}%(전국 하위)로 뇌졸중 예후 불량 위험.`);
  }
  if (prov.doctorsPerThousand < 1.8 && prov.unmetMedical > 8) {
    parts.push(`의사밀도 ${prov.doctorsPerThousand}/천명 + 미충족의료 ${prov.unmetMedical}%로 의료 접근성 취약.`);
  }
  if (prov.strokeIncidence > 125) {
    parts.push(`발생률 ${prov.strokeIncidence}/10만으로 전국 상위. 위험인자(고혈압·당뇨·흡연) 관리 강화 필요.`);
  }
  if (prov.tpaRate < 7) {
    parts.push(`tPA 시행률 ${prov.tpaRate}%로 매우 낮음. 급성기 뇌졸중 치료 인프라 확충 필요.`);
  }
  if (prov.goldenTimeRate >= 45 && prov.tpaRate >= 10) {
    parts.push(`골든타임 도착률 ${prov.goldenTimeRate}% + tPA ${prov.tpaRate}%로 급성기 치료 체계 양호.`);
  }
  if (prov.strokeMortality > 38) {
    parts.push(`사망률 ${prov.strokeMortality}/10만으로 전국 상위. 뇌졸중 사후관리·재활 체계 강화 필요.`);
  }
  return parts.length > 0 ? parts.join(' ') : '현재 지표 양호. 지속적 모니터링 권장.';
}

function getPatientCount(provName) {
  const d = STROKE_KOSIS?.regionPatients?.[provName];
  if (!d) return null;
  return d['2024'] || d['2023'] || d['2022'] || null;
}

function getTransportDist(provName) {
  const regionData = STROKE_KOSIS?.transportByRegion?.[provName];
  if (!regionData) return { counts: TRANSPORT_KEYS.map(() => 0), total: 1 };
  const total = regionData['계']?.['2024'] || regionData['계']?.['2023'] || 1;
  const result = TRANSPORT_KEYS.map(key => {
    const v = regionData[key]?.['2024'] || regionData[key]?.['2023'] || 0;
    return v;
  });
  return { counts: result, total };
}

function getTransportGrouped(provName) {
  const data = STROKE_KOSIS?.transportGrouped?.[provName];
  if (!data) return null;
  return data;
}

function getAgeDistribution(gender = '전체') {
  const genderData = STROKE_KOSIS?.byGenderAge?.[gender];
  if (!genderData) return null;
  return AGE_GROUPS_KOSIS.map(ag => {
    const v = genderData[ag];
    return v ? (v['2021'] || v['2020'] || v['2019'] || 0) : 0;
  });
}

// ── CompareBar component ────────────────────────────────────

function CompareBar({ label, value, national, unit = '', higherIsWorse = true, width = '100%' }) {
  const ratio = national !== 0 ? value / national : 1;
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
              background: isHighlight ? 'rgba(0,212,255,0.08)' : 'transparent',
            }}
          >
            <span style={{
              width: `${labelWidth}px`, fontSize: '11px', textAlign: 'right',
              color: isHighlight ? '#00d4ff' : '#8888aa', fontWeight: isHighlight ? 700 : 400,
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
                  border: isHighlight ? '1px solid rgba(0,212,255,0.5)' : 'none',
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
              color: isHighlight ? '#00d4ff' : '#bbb', flexShrink: 0,
            }}>
              {typeof value === 'number' ? (value >= 1000 ? value.toLocaleString() : value.toFixed(1)) : value}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── VerticalBar chart (for age distribution / transport) ────────

function VerticalBarChart({ data, labels, title, color = '#00d4ff', maxOverride }) {
  const max = maxOverride || Math.max(...data, 1);
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ fontSize: '11px', color: '#8888aa', marginBottom: '6px', fontWeight: 600 }}>{title}</div>
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
                  background: `linear-gradient(180deg, ${gradientColor(t)}, ${gradientColor(t * 0.3)})`,
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

function Panel({ children, style = {} }) {
  return (
    <div style={{
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

function KPIMini({ label, value, unit, icon, color = '#00d4ff', source }) {
  return (
    <div style={{
      background: 'linear-gradient(145deg, #1a1a2e 0%, #12121a 100%)',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: '10px',
      padding: '10px 12px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: `linear-gradient(90deg, transparent, ${color}, transparent)`, opacity: 0.5 }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
        <span style={{ fontSize: '13px' }}>{icon}</span>
        <span style={{ fontSize: '10px', color: '#8888aa' }}>{label}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px' }}>
        <span style={{ fontSize: '20px', fontWeight: 900, fontFamily: "'JetBrains Mono'", color, textShadow: `0 0 12px ${color}44` }}>
          {value}
        </span>
        <span style={{ fontSize: '10px', color: '#666' }}>{unit}</span>
      </div>
      {source && (
        <div style={{ fontSize: '8px', color: '#555', marginTop: '3px', fontFamily: "'JetBrains Mono', monospace" }}>
          {source}
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════
// ██ MAIN COMPONENT
// ════════════════════════════════════════════════════

export default function StrokeDashboard() {
  const [selectedProv, setSelectedProv] = useState(null);
  const [col2Metric, setCol2Metric] = useState('patients'); // 'patients' | 'tpa' | 'goldenTime'
  const [gender, setGender] = useState('전체');

  const prov = selectedProv ? PROVINCE_INFO[selectedProv] : null;

  // ── Column 2 data: sorted province bars ────────────────

  const col2Data = useMemo(() => {
    if (col2Metric === 'patients') {
      return PROVINCES
        .map(name => ({ name, value: getPatientCount(name) || Math.round(PROVINCE_INFO[name].strokeIncidence * PROVINCE_INFO[name].population / 100000) }))
        .sort((a, b) => b.value - a.value);
    }
    if (col2Metric === 'tpa') {
      return PROVINCES
        .map(name => ({ name, value: PROVINCE_INFO[name].tpaRate }))
        .sort((a, b) => b.value - a.value);
    }
    return PROVINCES
      .map(name => ({ name, value: PROVINCE_INFO[name].goldenTimeRate }))
      .sort((a, b) => b.value - a.value);
  }, [col2Metric]);

  const col2Max = useMemo(() => Math.max(...col2Data.map(d => d.value), 1), [col2Data]);
  const col2NatAvg = col2Metric === 'patients' ? null : col2Metric === 'tpa' ? NATIONAL_AVG.tpaRate : NATIONAL_AVG.goldenTimeRate;

  // ── Column 2 bottom: secondary metric ────────────────

  const col2BottomMetric = col2Metric === 'patients' ? 'tpa' : col2Metric === 'tpa' ? 'goldenTime' : 'patients';
  const col2BottomData = useMemo(() => {
    if (col2BottomMetric === 'patients') {
      return PROVINCES
        .map(name => ({ name, value: getPatientCount(name) || Math.round(PROVINCE_INFO[name].strokeIncidence * PROVINCE_INFO[name].population / 100000) }))
        .sort((a, b) => b.value - a.value);
    }
    if (col2BottomMetric === 'tpa') {
      return PROVINCES
        .map(name => ({ name, value: PROVINCE_INFO[name].tpaRate }))
        .sort((a, b) => b.value - a.value);
    }
    return PROVINCES
      .map(name => ({ name, value: PROVINCE_INFO[name].goldenTimeRate }))
      .sort((a, b) => b.value - a.value);
  }, [col2BottomMetric]);

  const col2BottomMax = useMemo(() => Math.max(...col2BottomData.map(d => d.value), 1), [col2BottomData]);
  const col2BottomNatAvg = col2BottomMetric === 'patients' ? null : col2BottomMetric === 'tpa' ? NATIONAL_AVG.tpaRate : NATIONAL_AVG.goldenTimeRate;

  // ── Age distribution ────────────────

  const ageDist = useMemo(() => getAgeDistribution(gender), [gender]);

  // ── Transport distribution ────────────────

  const transportDist = useMemo(() => {
    if (selectedProv) return getTransportDist(selectedProv);
    return getTransportDist('전체');
  }, [selectedProv]);

  const transportGrouped = useMemo(() => {
    const prov = selectedProv || '전체';
    const data = getTransportGrouped(prov);
    if (!data) return { counts: [0, 0, 0, 0], total: 1 };
    const counts = TRANSPORT_GROUPED_KEYS.map(k => data[k] || 0);
    const total = counts.reduce((a, b) => a + b, 0);
    return { counts, total };
  }, [selectedProv]);

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

  // ── Worst/Best 3 ────────────────

  const worstBest = useMemo(() => {
    const byMortality = PROVINCES
      .map(name => ({ name, val: PROVINCE_INFO[name].strokeMortality }))
      .sort((a, b) => b.val - a.val);
    const byGolden = PROVINCES
      .map(name => ({ name, val: PROVINCE_INFO[name].goldenTimeRate }))
      .sort((a, b) => a.val - b.val);
    return {
      worstMortality: byMortality.slice(0, 3),
      bestMortality: byMortality.slice(-3).reverse(),
      worstGolden: byGolden.slice(0, 3),
      bestGolden: byGolden.slice(-3).reverse(),
    };
  }, []);

  const metricLabels = { patients: '환자수', tpa: 'tPA 시행률', goldenTime: '골든타임 도착률' };
  const metricBottomLabels = { patients: '환자수', tpa: 'tPA 시행률 (%)', goldenTime: '골든타임 도착률 (%)' };

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

      {/* ═══════ COLUMN 1: Map + KPIs ═══════ */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflow: 'hidden' }}>
        <Panel style={{ flex: '0 0 auto', display: 'flex', justifyContent: 'center', padding: '8px' }}>
          <div style={{ width: '100%', maxWidth: '260px' }}>
            <KoreaMap metric="stroke" onProvinceClick={(name) => setSelectedProv(name)} />
          </div>
        </Panel>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <KPIMini label="전국 발생률" value={NATIONAL_AVG.strokeIncidence} unit="/10만" icon="📊" color="#00d4ff" source="KDCA 2022" />
          <KPIMini label="30일 치명률" value={NATIONAL_AVG.strokeMortality} unit="/10만" icon="💀" color="#ff6b6b" source="KOSIS 2023" />
          <KPIMini label="골든타임 도착" value={NATIONAL_AVG.goldenTimeRate} unit="%" icon="⏱️" color="#ffaa00" source="연구 기반 추정" />
          <KPIMini label="tPA 시행률" value={NATIONAL_AVG.tpaRate} unit="%" icon="💉" color="#b388ff" source="심평원 (추정)" />
        </div>
      </div>

      {/* ═══════ COLUMN 2: Province comparison bars ═══════ */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflow: 'hidden' }}>
        {/* Top: primary metric */}
        <Panel style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexShrink: 0 }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#e8e8f0' }}>시도별 {metricLabels[col2Metric]}</span>
            <div style={{ display: 'flex', gap: '4px' }}>
              {['patients', 'tpa', 'goldenTime'].map(m => (
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

        {/* Bottom: secondary metric */}
        <Panel style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#e8e8f0', marginBottom: '8px', flexShrink: 0 }}>
            시도별 {metricBottomLabels[col2BottomMetric]}
          </div>
          <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
            <HBar
              data={col2BottomData}
              maxVal={col2BottomMax}
              highlightName={selectedProv}
              nationalAvg={col2BottomNatAvg}
              onClick={(name) => setSelectedProv(prev => prev === name ? null : name)}
            />
          </div>
          {col2BottomNatAvg && (
            <div style={{ fontSize: '10px', color: '#ffaa00', marginTop: '4px', textAlign: 'right', flexShrink: 0 }}>
              ━ 전국 평균 {col2BottomNatAvg}
            </div>
          )}
        </Panel>
      </div>

      {/* ═══════ COLUMN 3: Age & Transport ═══════ */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflow: 'hidden' }}>
        {/* Top: Age distribution */}
        <Panel style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px', flexShrink: 0 }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#e8e8f0' }}>연령별 뇌졸중 환자수 (전국)</span>
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
        </Panel>

        {/* Bottom: Transport time (grouped) */}
        <Panel style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#e8e8f0', marginBottom: '6px', flexShrink: 0 }}>
            이송 소요시간 분포 {selectedProv ? `(${selectedProv})` : '(전국)'} <span style={{ fontSize: '10px', color: '#666', fontWeight: 400 }}>2023</span>
          </div>
          <div style={{ flex: 1, minHeight: 0 }}>
            <VerticalBarChart
              data={transportGrouped.counts}
              labels={TRANSPORT_GROUPED_LABELS}
              title=""
              color="#ffaa00"
            />
          </div>
          <div style={{ fontSize: '10px', color: '#555', marginTop: '4px', textAlign: 'right', flexShrink: 0 }}>
            총 {transportGrouped.total?.toLocaleString()}건 (3시간미만: {((transportGrouped.counts[0] / transportGrouped.total) * 100).toFixed(1)}%)
          </div>
        </Panel>
      </div>

      {/* ═══════ COLUMN 4: Insight Panel ═══════ */}
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
              </Panel>

              {/* Socioeconomic indicators */}
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

              {/* Stroke-specific rankings */}
              <Panel style={{ flexShrink: 0 }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#ff6b6b', marginBottom: '10px' }}>뇌졸중 특화 지표</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                  {[
                    { label: '발생률', rank: rankings?.incidence, val: prov.strokeIncidence, unit: '/10만', color: '#ff6b6b' },
                    { label: '사망률', rank: rankings?.mortality, val: prov.strokeMortality, unit: '/10만', color: '#ff4444' },
                    { label: 'tPA 시행', rank: rankings?.tpa, val: prov.tpaRate, unit: '%', color: '#b388ff' },
                    { label: '골든타임', rank: rankings?.goldenTime, val: prov.goldenTimeRate, unit: '%', color: '#ffaa00' },
                  ].map(({ label, rank: r, val, unit, color }) => (
                    <div key={label} style={{
                      background: 'rgba(255,255,255,0.03)', borderRadius: '8px', padding: '8px 10px',
                      border: '1px solid rgba(255,255,255,0.04)',
                    }}>
                      <div style={{ fontSize: '10px', color: '#8888aa', marginBottom: '2px' }}>{label}</div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                        <span style={{ fontSize: '16px', fontWeight: 900, fontFamily: "'JetBrains Mono'", color }}>{val}</span>
                        <span style={{ fontSize: '9px', color: '#666' }}>{unit}</span>
                      </div>
                      <div style={{ fontSize: '10px', color: '#555', marginTop: '2px' }}>{r}/17위</div>
                    </div>
                  ))}
                </div>
              </Panel>

              {/* Auto-insight */}
              <Panel style={{ flex: 1, minHeight: 0 }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#ffaa00', marginBottom: '8px' }}>💡 인사이트</div>
                <div style={{
                  fontSize: '12px', color: '#ccc', lineHeight: '1.7',
                  fontFamily: "'Noto Sans KR'",
                }}>
                  {generateStrokeInsight(selectedProv, prov)}
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
              <Panel>
                <div style={{ fontSize: '16px', fontWeight: 900, color: '#e8e8f0', marginBottom: '4px' }}>전국 뇌졸중 현황</div>
                <div style={{ fontSize: '11px', color: '#666' }}>지도에서 시도를 클릭하면 상세 분석이 표시됩니다</div>
              </Panel>

              {/* Worst 3 */}
              <Panel>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#ff6b6b', marginBottom: '10px' }}>⚠️ 사망률 상위 3개 시도</div>
                {worstBest.worstMortality.map(({ name, val }, i) => (
                  <div
                    key={name}
                    onClick={() => setSelectedProv(name)}
                    style={{
                      display: 'flex', justifyContent: 'space-between', padding: '6px 8px',
                      borderRadius: '6px', cursor: 'pointer', marginBottom: '4px',
                      background: 'rgba(255,68,68,0.06)', border: '1px solid rgba(255,68,68,0.1)',
                    }}
                  >
                    <span style={{ fontSize: '12px', color: '#e8e8f0' }}>{i + 1}. {name}</span>
                    <span style={{ fontSize: '12px', color: '#ff6b6b', fontFamily: "'JetBrains Mono'", fontWeight: 700 }}>{val}/10만</span>
                  </div>
                ))}
              </Panel>

              <Panel>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#00ff88', marginBottom: '10px' }}>✅ 사망률 하위 3개 시도</div>
                {worstBest.bestMortality.map(({ name, val }, i) => (
                  <div
                    key={name}
                    onClick={() => setSelectedProv(name)}
                    style={{
                      display: 'flex', justifyContent: 'space-between', padding: '6px 8px',
                      borderRadius: '6px', cursor: 'pointer', marginBottom: '4px',
                      background: 'rgba(0,255,136,0.04)', border: '1px solid rgba(0,255,136,0.1)',
                    }}
                  >
                    <span style={{ fontSize: '12px', color: '#e8e8f0' }}>{i + 1}. {name}</span>
                    <span style={{ fontSize: '12px', color: '#00ff88', fontFamily: "'JetBrains Mono'", fontWeight: 700 }}>{val}/10만</span>
                  </div>
                ))}
              </Panel>

              <Panel>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#ffaa00', marginBottom: '10px' }}>⏱️ 골든타임 도착 하위 3개 시도</div>
                {worstBest.worstGolden.map(({ name, val }, i) => (
                  <div
                    key={name}
                    onClick={() => setSelectedProv(name)}
                    style={{
                      display: 'flex', justifyContent: 'space-between', padding: '6px 8px',
                      borderRadius: '6px', cursor: 'pointer', marginBottom: '4px',
                      background: 'rgba(255,170,0,0.06)', border: '1px solid rgba(255,170,0,0.1)',
                    }}
                  >
                    <span style={{ fontSize: '12px', color: '#e8e8f0' }}>{i + 1}. {name}</span>
                    <span style={{ fontSize: '12px', color: '#ffaa00', fontFamily: "'JetBrains Mono'", fontWeight: 700 }}>{val}%</span>
                  </div>
                ))}
              </Panel>

              <Panel>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#00d4ff', marginBottom: '10px' }}>⏱️ 골든타임 도착 상위 3개 시도</div>
                {worstBest.bestGolden.map(({ name, val }, i) => (
                  <div
                    key={name}
                    onClick={() => setSelectedProv(name)}
                    style={{
                      display: 'flex', justifyContent: 'space-between', padding: '6px 8px',
                      borderRadius: '6px', cursor: 'pointer', marginBottom: '4px',
                      background: 'rgba(0,212,255,0.04)', border: '1px solid rgba(0,212,255,0.1)',
                    }}
                  >
                    <span style={{ fontSize: '12px', color: '#e8e8f0' }}>{i + 1}. {name}</span>
                    <span style={{ fontSize: '12px', color: '#00d4ff', fontFamily: "'JetBrains Mono'", fontWeight: 700 }}>{val}%</span>
                  </div>
                ))}
              </Panel>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <div style={{
          padding: '4px 12px',
          fontSize: 10,
          color: '#4a4a6a',
          fontFamily: "'JetBrains Mono', monospace",
          borderTop: '1px solid rgba(255,255,255,0.04)',
          flexShrink: 0,
        }}>
          출처: KOSIS 심뇌혈관질환통계 (orgId=411, 2022-2024), KDCA 심뇌혈관질환 발생통계 2022, 심평원 급성기 뇌졸중 적정성 평가. tPA 시행률·골든타임 도착률은 추정치.
        </div>
      </div>
    </div>
  );
}
