import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SparkChart from './SparkChart';
import RadarProfile from './RadarProfile';
import { PROVINCE_INFO, NATIONAL_AVG } from '../data/province_info';
import { TRENDS } from '../data/trends';
import { BMI_PROV } from '../data/bmi_prov';
import { MET_PROV } from '../data/met_prov';
import { useLang } from '../i18n';
import { T } from '../translations';

function formatPop(n, lang) {
  if (lang === 'en') {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    return `${(n / 1000).toFixed(0)}K`;
  }
  if (n >= 10000000) return `${(n / 10000000).toFixed(0)}천만`;
  if (n >= 1000000) return `${(n / 10000).toFixed(0)}만`;
  return `${(n / 10000).toFixed(0)}만`;
}

function StatBadge({ label, value, unit, color = '#00d4ff', tooltip, info, avg, rawValue, higherIsBetter = true, onClick, isExpanded, metricKey }) {
  const { lang } = useLang();
  const [showTip, setShowTip] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  // Rule 2: brightness based on deviation from national average
  const deviationAlpha = (avg != null && rawValue != null)
    ? Math.min(1, Math.abs(rawValue - avg) / (avg * 0.3 || 1))
    : 0;
  const bgAlpha = (0x0a + Math.round(deviationAlpha * 0x18)).toString(16).padStart(2, '0');
  const borderAlpha = (0x22 + Math.round(deviationAlpha * 0x33)).toString(16).padStart(2, '0');

  return (
    <div
      style={{
        background: `${color}${bgAlpha}`,
        border: `1px solid ${color}${borderAlpha}`,
        borderRadius: '10px',
        padding: '10px 12px',
        textAlign: 'center',
        position: 'relative',
        cursor: onClick ? 'pointer' : tooltip ? 'help' : 'default',
        outline: isExpanded ? `2px solid ${color}88` : 'none',
        outlineOffset: '-1px',
        transition: 'all 0.2s',
      }}
      onClick={(e) => { if (onClick) { e.stopPropagation(); onClick(metricKey); } }}
      onMouseEnter={() => tooltip && setShowTip(true)}
      onMouseLeave={() => { setShowTip(false); setShowInfo(false); }}
    >
      <div style={{ fontSize: '11px', color: '#8888aa', marginBottom: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}>
        {label}
        {info && (
          <span
            onMouseEnter={(e) => { e.stopPropagation(); setShowInfo(true); }}
            onMouseLeave={() => setShowInfo(false)}
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: '13px', height: '13px', borderRadius: '50%',
              border: '1px solid #555570', fontSize: '9px', color: '#8888aa',
              cursor: 'help', lineHeight: 1, flexShrink: 0,
            }}
          >?</span>
        )}
      </div>
      <div style={{ fontSize: '16px', fontWeight: 800, fontFamily: "'JetBrains Mono'", color }}>
        {value}{unit && <span style={{ fontSize: '10px', color: '#555570', fontWeight: 400, marginLeft: '2px' }}>{unit}</span>}
      </div>
      {avg != null && rawValue != null && (() => {
        const diff = rawValue - avg;
        const isAbove = diff > 0;
        const isGood = higherIsBetter ? isAbove : !isAbove;
        const arrow = isAbove ? '▲' : '▼';
        const diffColor = Math.abs(diff) < 0.3 ? '#8888aa' : isGood ? '#00ff88' : '#ff4444';
        return (
          <div style={{ fontSize: '9px', color: diffColor, marginTop: '2px', fontFamily: "'JetBrains Mono'" }}>
            {arrow} {lang === 'en' ? 'vs Nat\'l' : '전국대비'} {isAbove ? '+' : ''}{typeof rawValue === 'number' && rawValue % 1 !== 0 ? diff.toFixed(1) : Math.round(diff)}
          </div>
        );
      })()}
      {/* Hover tooltip (e.g. hospital list) */}
      {showTip && tooltip && (
        <div style={{
          position: 'absolute',
          bottom: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          marginBottom: '6px',
          background: 'rgba(10,10,20,0.97)',
          border: `1px solid ${color}44`,
          borderRadius: '8px',
          padding: '8px 12px',
          minWidth: '160px',
          maxWidth: '220px',
          zIndex: 20,
          textAlign: 'left',
          backdropFilter: 'blur(8px)',
          boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
        }}>
          {tooltip}
        </div>
      )}
      {/* Info tooltip (? icon) */}
      {showInfo && info && (
        <div style={{
          position: 'absolute',
          bottom: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          marginBottom: '6px',
          background: 'rgba(10,10,20,0.97)',
          border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: '8px',
          padding: '8px 12px',
          minWidth: '160px',
          maxWidth: '220px',
          zIndex: 21,
          textAlign: 'left',
          backdropFilter: 'blur(8px)',
          boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
          fontSize: '10px',
          color: '#bbb',
          lineHeight: 1.5,
        }}>
          {info}
        </div>
      )}
    </div>
  );
}

// Bar showing value position relative to national average
function CompareBar({ value, avg, min, max, color, label, unit = '', higherIsBetter = true }) {
  const { lang } = useLang();
  const range = max - min;
  const pos = Math.max(0, Math.min(100, ((value - min) / range) * 100));
  const avgPos = Math.max(0, Math.min(100, ((avg - min) / range) * 100));
  const isGood = higherIsBetter ? value >= avg : value <= avg;
  return (
    <div style={{ marginBottom: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
        <span style={{ fontSize: '11px', color: '#8888aa' }}>{label}</span>
        <span style={{ fontSize: '11px', fontFamily: "'JetBrains Mono'", color: isGood ? '#00ff88' : '#ff4444', fontWeight: 700 }}>
          {typeof value === 'number' && value % 1 !== 0 ? value.toFixed(1) : value}{unit}
        </span>
      </div>
      <div style={{ position: 'relative', height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px' }}>
        <div style={{
          position: 'absolute', left: 0, top: 0, height: '100%',
          width: `${pos}%`, borderRadius: '3px',
          background: `linear-gradient(90deg, ${color}44, ${color})`,
          opacity: 0.4 + 0.6 * (pos / 100),
        }} />
        <div style={{
          position: 'absolute', top: '-2px', left: `${avgPos}%`, transform: 'translateX(-50%)',
          width: '2px', height: '10px', background: '#fff', borderRadius: '1px', opacity: 0.6,
        }} />
      </div>
      <div style={{ position: 'relative', height: '12px' }}>
        <span style={{
          position: 'absolute', left: `${avgPos}%`, transform: 'translateX(-50%)',
          fontSize: '9px', color: '#8888aa', top: '1px',
        }}>
          {lang === 'en' ? 'Nat\'l' : '전국'} {typeof avg === 'number' && avg % 1 !== 0 ? avg.toFixed(1) : avg}
        </span>
      </div>
    </div>
  );
}

// Rank badge
function getRank(provName, key, ascending = false) {
  const entries = Object.entries(PROVINCE_INFO).map(([name, info]) => {
    let val;
    if (key === 'grdpPerCapita') val = info.grdp * 1e12 / info.population / 1e4;
    else if (key === 'tertiaryPerMil') val = info.tertiaryHospitals / (info.population / 1e6);
    else val = info[key];
    return { name, val };
  });
  entries.sort((a, b) => ascending ? a.val - b.val : b.val - a.val);
  const rank = entries.findIndex(e => e.name === provName) + 1;
  return { rank, total: entries.length };
}

function InfoBox({ title, color, children }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.02)',
      borderRadius: '10px',
      padding: '12px',
      border: `1px solid ${color}15`,
      marginBottom: '8px',
    }}>
      <div style={{ fontSize: '11px', color, marginBottom: '8px', fontWeight: 700 }}>
        {title}
      </div>
      {children}
    </div>
  );
}

// Build ranked list for a given metric across all provinces
function getRankedList(metricKey) {
  const configs = {
    population: { getter: (info) => info.population, format: (v) => `${(v / 10000).toFixed(0)}만`, unit: '', ascending: false },
    grdpPerCapita: { getter: (info) => Math.round(info.grdp * 1e12 / info.population / 1e4), format: (v) => `${v}`, unit: '만원', ascending: false },
    agingRate: { getter: (info) => info.agingRate, format: (v) => `${v}%`, unit: '', ascending: true },
    lifeExpectancy: { getter: (info) => info.lifeExpectancy, format: (v) => `${v}`, unit: '세', ascending: false },
    tertiaryHospitals: { getter: (info) => info.tertiaryHospitals, format: (v) => `${v}`, unit: '개', ascending: false },
    doctorsPerThousand: { getter: (info) => info.doctorsPerThousand, format: (v) => v.toFixed(2), unit: '/천명', ascending: false },
    unmetMedical: { getter: (info) => info.unmetMedical, format: (v) => `${v}%`, unit: '', ascending: true },
    smokingRate: { getter: (info) => info.smokingRate, format: (v) => `${v}%`, unit: '', ascending: true },
    drinkingRate: { getter: (info) => info.drinkingRate, format: (v) => `${v}%`, unit: '', ascending: true },
    noExerciseRate: { getter: (info) => info.noExerciseRate, format: (v) => `${v}%`, unit: '', ascending: true },
    strokeIncidence: { getter: (info) => info.strokeIncidence, format: (v) => `${v}`, unit: '/10만', ascending: true },
    strokeMortality: { getter: (info) => info.strokeMortality, format: (v) => `${v}`, unit: '/10만', ascending: true },
    tpaRate: { getter: (info) => info.tpaRate, format: (v) => `${v}%`, unit: '', ascending: false },
    goldenTimeRate: { getter: (info) => info.goldenTimeRate, format: (v) => `${v}%`, unit: '', ascending: false },
  };
  const cfg = configs[metricKey];
  if (!cfg) return [];
  const entries = Object.entries(PROVINCE_INFO).map(([name, info]) => ({
    name, value: cfg.getter(info), formatted: cfg.format(cfg.getter(info)) + cfg.unit,
  }));
  entries.sort((a, b) => cfg.ascending ? a.value - b.value : b.value - a.value);
  return entries;
}

export default function DetailPanel({ selectedKPI, selectedProvince, years, year, metric }) {
  const { t, lang } = useLang();
  const [expandedBadge, setExpandedBadge] = useState(null);
  const hasSelection = selectedKPI || selectedProvince;
  const provInfo = selectedProvince ? PROVINCE_INFO[selectedProvince.name] : null;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{
        padding: '14px 18px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}>
        <div style={{
          width: '8px', height: '8px', borderRadius: '50%',
          background: hasSelection ? '#00ff88' : '#555570',
          boxShadow: hasSelection ? '0 0 8px rgba(0,255,136,0.5)' : 'none',
        }} />
        <span style={{ fontSize: '13px', fontWeight: 600, color: '#e8e8f0' }}>
          {hasSelection ? t('상세 분석', 'Detailed Analysis') : t('클릭하여 탐색', 'Click to explore')}
        </span>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '14px 16px' }}>
        <AnimatePresence mode="wait">
          {!hasSelection && (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '16px',
                color: '#555570',
              }}
            >
              <div style={{ fontSize: '40px', opacity: 0.3 }}>🔍</div>
              <div style={{ textAlign: 'center', lineHeight: 1.8, fontSize: '13px' }}>
                <div>{t('KPI 카드 또는 지도 지역을 클릭하면', 'Click a KPI card or map region')}</div>
                <div>{t('상세 데이터가 여기에 표시됩니다', 'to see detailed data here')}</div>
              </div>
            </motion.div>
          )}

          {selectedKPI && (
            <motion.div
              key={`kpi-${selectedKPI.id}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '18px' }}>{selectedKPI.icon}</span>
                  <span style={{ fontSize: '15px', fontWeight: 700, color: selectedKPI.color }}>
                    {selectedKPI.label}
                  </span>
                </div>
                <div style={{
                  fontSize: '28px', fontWeight: 900,
                  fontFamily: "'JetBrains Mono'",
                  color: selectedKPI.color,
                  textShadow: `0 0 16px ${selectedKPI.color}44`,
                }}>
                  {selectedKPI.value.toFixed(1)}{selectedKPI.unit || '%'}
                </div>
              </div>

              {selectedKPI.id === 'stroke' ? (
                <>
                  <div style={{
                    background: 'rgba(231,76,60,0.06)',
                    border: '1px solid rgba(231,76,60,0.15)',
                    borderRadius: '10px',
                    padding: '14px',
                    marginBottom: '12px',
                  }}>
                    <div style={{ fontSize: '11px', color: '#8888aa', marginBottom: '10px' }}>
                      {t('전국 뇌졸중 주요 지표 (2022)', 'National Stroke Key Indicators (2022)')}
                    </div>
                    <CompareBar label={t("발생률 (건/10만)", "Incidence (/100K)")} value={NATIONAL_AVG.strokeIncidence} avg={NATIONAL_AVG.strokeIncidence} min={95} max={140} color="#e74c3c" higherIsBetter={false} />
                    <CompareBar label={t("사망률 (명/10만)", "Mortality (/100K)")} value={NATIONAL_AVG.strokeMortality} avg={NATIONAL_AVG.strokeMortality} min={25} max={45} color="#c0392b" higherIsBetter={false} />
                    <CompareBar label={t("tPA 시술률 (%)", "tPA Rate (%)")} value={NATIONAL_AVG.tpaRate} avg={NATIONAL_AVG.tpaRate} min={3} max={16} color="#3498db" unit="%" higherIsBetter={true} />
                    <CompareBar label={t("골든타임 도착률 (%)", "Golden Time Arrival (%)")} value={NATIONAL_AVG.goldenTimeRate} avg={NATIONAL_AVG.goldenTimeRate} min={20} max={55} color="#2ecc71" unit="%" higherIsBetter={true} />
                  </div>
                  <div style={{
                    background: 'rgba(255,255,255,0.02)',
                    borderRadius: '10px',
                    padding: '10px',
                    border: '1px solid rgba(255,255,255,0.04)',
                  }}>
                    <div style={{ fontSize: '11px', color: '#8888aa', marginBottom: '6px' }}>{t('지역별 발생률 순위', 'Regional Incidence Ranking')}</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px' }}>
                      {Object.entries(PROVINCE_INFO)
                        .map(([name, info]) => ({ name, val: info.strokeIncidence }))
                        .sort((a, b) => b.val - a.val)
                        .map((entry, i) => (
                          <div key={entry.name} style={{
                            display: 'flex', justifyContent: 'space-between',
                            padding: '3px 8px', borderRadius: '5px',
                            background: i < 3 ? 'rgba(231,76,60,0.1)' : 'transparent',
                            fontSize: '11px',
                          }}>
                            <span style={{ color: i < 3 ? '#e74c3c' : '#8888aa', fontFamily: "'JetBrains Mono'" }}>
                              {i + 1}. {lang === 'en' ? (T.provinces[entry.name] || entry.name) : entry.name}
                            </span>
                            <span style={{
                              color: i < 3 ? '#e74c3c' : '#e8e8f0',
                              fontFamily: "'JetBrains Mono'",
                              fontWeight: i < 3 ? 700 : 400,
                            }}>
                              {entry.val}
                            </span>
                          </div>
                        ))}
                    </div>
                    <div style={{ fontSize: '9px', color: '#555570', marginTop: '6px' }}>
                      {t('출처: KDCA 심뇌혈관질환 발생통계(2022) | tPA·골든타임: 추정치', 'Source: KDCA CVD Statistics(2022) | tPA·Golden Time: Estimated')}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div style={{
                    background: 'rgba(255,255,255,0.02)',
                    borderRadius: '10px',
                    padding: '14px',
                    border: '1px solid rgba(255,255,255,0.04)',
                    marginBottom: '12px',
                  }}>
                    <div style={{ fontSize: '11px', color: '#8888aa', marginBottom: '10px' }}>
                      {t('10년 추세 (2015–2024)', '10-Year Trend (2015–2024)')}
                    </div>
                    <SparkChart
                      data={selectedKPI.data}
                      labels={years}
                      color={selectedKPI.color}
                      height={120}
                      showLabels
                    />
                  </div>

                  <div style={{
                    background: 'rgba(255,255,255,0.02)',
                    borderRadius: '10px',
                    padding: '10px',
                    border: '1px solid rgba(255,255,255,0.04)',
                  }}>
                    <div style={{ fontSize: '11px', color: '#8888aa', marginBottom: '6px' }}>{t('연도별', 'By Year')}</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px' }}>
                      {years.map((y, i) => (
                        <div key={y} style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          padding: '3px 8px',
                          borderRadius: '5px',
                          background: y === 2024 ? `${selectedKPI.color}11` : 'transparent',
                          fontSize: '11px',
                        }}>
                          <span style={{ color: '#8888aa', fontFamily: "'JetBrains Mono'" }}>{y}</span>
                          <span style={{
                            color: y === 2024 ? selectedKPI.color : '#e8e8f0',
                            fontFamily: "'JetBrains Mono'",
                            fontWeight: y === 2024 ? 700 : 400,
                          }}>
                            {selectedKPI.data[i].toFixed(1)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          )}

          {selectedProvince && !selectedKPI && (
            <motion.div
              key={`prov-${selectedProvince.name}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              {/* Province Header with source */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
                <span style={{ fontSize: '16px', fontWeight: 900, color: '#e8e8f0' }}>
                  {t('상세분석', 'Analysis')} — {lang === 'en' ? (T.provinces[selectedProvince.name] || selectedProvince.name) : selectedProvince.name}
                </span>
                <span style={{ fontSize: '9px', color: '#444460', cursor: 'help' }} title={t("인구: 행안부(2024) · GRDP: 통계청(2023) · 고령화: 통계청(2024) · 기대수명: 통계청(2022) · 상급종합: 복지부 제5기 · 의사수: KOSIS(2022) · 미충족의료: 지역건강조사(2023) · 흡연/음주/운동: 건강검진통계연보(2024)", "Pop: MOIS(2024) · GRDP: KOSTAT(2023) · Aging: KOSTAT(2024) · Life Exp: KOSTAT(2022) · Tertiary: MOHW 5th · Doctors: KOSIS(2022) · Unmet: CHS(2023) · Smoking/Drinking/Exercise: Health Screening(2024)")}>
                  {t('출처 ⓘ', 'Source ⓘ')}
                </span>
              </div>

              {/* Trends FIRST — side by side with national avg + rank */}
              {(() => {
                const latestIdx = TRENDS.years.length - 1;
                const nationalObesity = TRENDS.obesity[latestIdx];
                const nationalMetabolic = TRENDS.metabolic[latestIdx];
                const obesityEntries = Object.entries(BMI_PROV).map(([name, vals]) => ({ name, val: vals[latestIdx] }));
                obesityEntries.sort((a, b) => a.val - b.val);
                const obesityRank = obesityEntries.findIndex(e => e.name === selectedProvince.name) + 1;
                const metEntries = Object.entries(MET_PROV).map(([name, vals]) => {
                  const valid = vals.filter(v => v != null);
                  return { name, val: valid[valid.length - 1] };
                }).filter(e => e.val != null);
                metEntries.sort((a, b) => a.val - b.val);
                const metRank = metEntries.findIndex(e => e.name === selectedProvince.name) + 1;
                const totalProvs = obesityEntries.length;
                const oRankBad = obesityRank >= totalProvs - 2;
                const oRankGood = obesityRank <= 3;
                const mRankBad = metRank >= metEntries.length - 2;
                const mRankGood = metRank <= 3;

                return (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '8px' }}>
                    {selectedProvince.obesity && (
                      <div style={{
                        background: 'rgba(255,255,255,0.02)', borderRadius: '8px',
                        padding: '8px', border: `1px solid ${oRankBad ? '#ff444444' : oRankGood ? '#00ff8844' : 'rgba(255,255,255,0.04)'}`,
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                          <span style={{ fontSize: '10px', color: '#ff006e', fontWeight: 600 }}>
                            {oRankBad ? '🚨' : oRankGood ? '👍' : ''} {t('비만율', 'Obesity Rate')}
                          </span>
                          <span style={{ fontSize: '16px', fontWeight: 900, fontFamily: "'JetBrains Mono'", color: '#ff006e' }}>
                            {selectedProvince.obesity[selectedProvince.obesity.length - 1]?.toFixed(1)}%
                          </span>
                        </div>
                        <SparkChart data={selectedProvince.obesity} labels={years} color="#ff006e" height={60} showLabels avgLine={nationalObesity} rankText={`${obesityRank}/${totalProvs}${t('위', '')}`} />
                      </div>
                    )}
                    {selectedProvince.metabolic && (
                      <div style={{
                        background: 'rgba(255,255,255,0.02)', borderRadius: '8px',
                        padding: '8px', border: `1px solid ${mRankBad ? '#ff444444' : mRankGood ? '#00ff8844' : 'rgba(255,255,255,0.04)'}`,
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                          <span style={{ fontSize: '10px', color: '#00d4ff', fontWeight: 600 }}>
                            {mRankBad ? '🚨' : mRankGood ? '👍' : ''} {t('대사증후군', 'Metabolic Syndrome')}
                          </span>
                          <span style={{ fontSize: '16px', fontWeight: 900, fontFamily: "'JetBrains Mono'", color: '#00d4ff' }}>
                            {selectedProvince.metabolic[selectedProvince.metabolic.length - 1]?.toFixed(1)}%
                          </span>
                        </div>
                        <SparkChart
                          data={selectedProvince.metabolic.filter(v => v != null)}
                          labels={years.slice(years.length - selectedProvince.metabolic.filter(v => v != null).length)}
                          color="#00d4ff" height={60} showLabels avgLine={nationalMetabolic}
                          rankText={metRank > 0 ? `${metRank}/${metEntries.length}${t('위', '')}` : ''}
                        />
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Stat badges 2x5 grid */}
              {provInfo && (() => {
                const perCapita = Math.round(provInfo.grdp * 1e12 / provInfo.population / 1e4);
                const agingStage = provInfo.agingRate >= 20 ? t('초고령', 'Super-aged') : provInfo.agingRate >= 14 ? t('고령', 'Aged') : t('고령화', 'Aging');
                return (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(5, 1fr)',
                    gap: '5px',
                    marginBottom: '10px',
                  }}>
                    <StatBadge label={t("인구", "Population")} value={formatPop(provInfo.population, lang)} color="#b388ff"
                      info={t("행정안전부 주민등록인구 (2024.12)", "MOIS Registered Population (2024.12)")}
                      onClick={(k) => setExpandedBadge(expandedBadge === k ? null : k)} isExpanded={expandedBadge === 'population'} metricKey="population"
                    />
                    <StatBadge label={t("1인당GRDP", "GRDP/Capita")} value={`${perCapita}`} unit={t("만원", "0K₩")} color="#ffd60a"
                      info={t("GRDP÷인구. 경제 수준 대리지표. 통계청(2023)", "GRDP÷Population. Economic proxy. KOSTAT(2023)")}
                      rawValue={perCapita} avg={NATIONAL_AVG.grdpPerCapita} higherIsBetter={true}
                      onClick={(k) => setExpandedBadge(expandedBadge === k ? null : k)} isExpanded={expandedBadge === 'grdpPerCapita'} metricKey="grdpPerCapita"
                    />
                    <StatBadge label={t("고령화", "Aging")} value={`${provInfo.agingRate}%`} unit={agingStage} color="#ff8c00"
                      info={t("65세↑ 비율. 14%↑ 고령사회, 20%↑ 초고령사회. 통계청(2024)", "Age 65+ ratio. 14%+ aged, 20%+ super-aged. KOSTAT(2024)")}
                      rawValue={provInfo.agingRate} avg={NATIONAL_AVG.agingRate} higherIsBetter={false}
                      onClick={(k) => setExpandedBadge(expandedBadge === k ? null : k)} isExpanded={expandedBadge === 'agingRate'} metricKey="agingRate"
                    />
                    <StatBadge label={t("기대수명", "Life Expectancy")} value={`${provInfo.lifeExpectancy}`} unit={t("세", "yr")} color="#00ff88"
                      info={t("출생 시 기대여명. 통계청(2022)", "Life expectancy at birth. KOSTAT(2022)")}
                      rawValue={provInfo.lifeExpectancy} avg={NATIONAL_AVG.lifeExpectancy} higherIsBetter={true}
                      onClick={(k) => setExpandedBadge(expandedBadge === k ? null : k)} isExpanded={expandedBadge === 'lifeExpectancy'} metricKey="lifeExpectancy"
                    />
                    <StatBadge
                      label={t("상급종합", "Tertiary Hosp")}
                      value={`${provInfo.tertiaryHospitals}`}
                      unit={t("개소", "")}
                      color="#00ff88"
                      info={t("복지부 3차의료기관. 제5기(2024~2026)", "MOHW tertiary hospitals. 5th period(2024-2026)")}
                      onClick={(k) => setExpandedBadge(expandedBadge === k ? null : k)} isExpanded={expandedBadge === 'tertiaryHospitals'} metricKey="tertiaryHospitals"
                      tooltip={
                        provInfo.tertiaryList?.length > 0 ? (
                          <div>
                            <div style={{ fontSize: '10px', color: '#00ff88', fontWeight: 700, marginBottom: '4px' }}>
                              {t(`상급종합병원 (${provInfo.tertiaryHospitals}개)`, `Tertiary Hospitals (${provInfo.tertiaryHospitals})`)}
                            </div>
                            {provInfo.tertiaryList.map((h, i) => (
                              <div key={i} style={{ fontSize: '10px', color: '#ccc', lineHeight: 1.6 }}>· {h}</div>
                            ))}
                            <div style={{ fontSize: '10px', color: '#666', marginTop: '4px' }}>
                              {t(`인구당 ${(provInfo.tertiaryHospitals / (provInfo.population / 1e6)).toFixed(1)}개/백만명`, `${(provInfo.tertiaryHospitals / (provInfo.population / 1e6)).toFixed(1)} per million`)}
                            </div>
                          </div>
                        ) : (
                          <div style={{ fontSize: '10px', color: '#888' }}>{t('상급종합병원 없음', 'No tertiary hospitals')}</div>
                        )
                      }
                    />
                    <StatBadge label={t("의사밀도", "Doctor Density")} value={provInfo.doctorsPerThousand.toFixed(1)} unit={t("/천명", "/1K")} color="#00d4ff"
                      info={t("인구 1,000명당 의사 수. OECD 평균 3.7명. KOSIS(2022)", "Doctors per 1,000 pop. OECD avg 3.7. KOSIS(2022)")}
                      rawValue={provInfo.doctorsPerThousand} avg={NATIONAL_AVG.doctorsPerThousand} higherIsBetter={true}
                      onClick={(k) => setExpandedBadge(expandedBadge === k ? null : k)} isExpanded={expandedBadge === 'doctorsPerThousand'} metricKey="doctorsPerThousand"
                    />
                    <StatBadge label={t("미충족의료", "Unmet Medical")} value={`${provInfo.unmetMedical}%`}
                      color={provInfo.unmetMedical >= 9 ? '#ff4444' : provInfo.unmetMedical >= 7 ? '#ffd60a' : '#00ff88'}
                      info={t("병의원 못 간 경험 비율. 지역건강조사(2023)", "Unmet healthcare needs rate. CHS(2023)")}
                      rawValue={provInfo.unmetMedical} avg={NATIONAL_AVG.unmetMedical} higherIsBetter={false}
                      onClick={(k) => setExpandedBadge(expandedBadge === k ? null : k)} isExpanded={expandedBadge === 'unmetMedical'} metricKey="unmetMedical"
                    />
                    <StatBadge label={t("흡연율", "Smoking")} value={`${provInfo.smokingRate}%`} color="#ff6b6b"
                      info={t("현재흡연율. 건강검진통계연보(2024)", "Current smoking rate. Health Screening(2024)")}
                      rawValue={provInfo.smokingRate} avg={NATIONAL_AVG.smokingRate} higherIsBetter={false}
                      onClick={(k) => setExpandedBadge(expandedBadge === k ? null : k)} isExpanded={expandedBadge === 'smokingRate'} metricKey="smokingRate"
                    />
                    <StatBadge label={t("음주율", "Drinking")} value={`${provInfo.drinkingRate}%`} color="#845ef7"
                      info={t("주2회이상 음주율. 건강검진통계연보(2024)", "Drinking 2+/week rate. Health Screening(2024)")}
                      rawValue={provInfo.drinkingRate} avg={NATIONAL_AVG.drinkingRate} higherIsBetter={false}
                      onClick={(k) => setExpandedBadge(expandedBadge === k ? null : k)} isExpanded={expandedBadge === 'drinkingRate'} metricKey="drinkingRate"
                    />
                    <StatBadge label={t("운동부족", "Low Exercise")} value={`${provInfo.noExerciseRate}%`} color="#fd7e14"
                      info={t("고강도 운동 미실천율(0일). 건강검진통계연보(2024)", "No vigorous exercise rate. Health Screening(2024)")}
                      rawValue={provInfo.noExerciseRate} avg={NATIONAL_AVG.noExerciseRate} higherIsBetter={false}
                      onClick={(k) => setExpandedBadge(expandedBadge === k ? null : k)} isExpanded={expandedBadge === 'noExerciseRate'} metricKey="noExerciseRate"
                    />
                  </div>
                );
              })()}

              {/* Stroke detail panel — shown when metric is stroke */}
              {provInfo && metric === 'stroke' && (
                <div style={{
                  background: 'rgba(231,76,60,0.06)',
                  border: '1px solid rgba(231,76,60,0.15)',
                  borderRadius: '8px',
                  padding: '10px 12px',
                  marginBottom: '8px',
                }}>
                  <div style={{ fontSize: '11px', color: '#e74c3c', fontWeight: 700, marginBottom: '8px' }}>
                    {t('뇌졸중 지표', 'Stroke Indicators')} — {lang === 'en' ? (T.provinces[selectedProvince.name] || selectedProvince.name) : selectedProvince.name}
                  </div>
                  <CompareBar label={t("발생률 (건/10만)", "Incidence (/100K)")} value={provInfo.strokeIncidence} avg={NATIONAL_AVG.strokeIncidence} min={95} max={140} color="#e74c3c" higherIsBetter={false} />
                  <CompareBar label={t("사망률 (명/10만)", "Mortality (/100K)")} value={provInfo.strokeMortality} avg={NATIONAL_AVG.strokeMortality} min={25} max={45} color="#c0392b" higherIsBetter={false} />
                  <CompareBar label={t("tPA 시술률 (%)", "tPA Rate (%)")} value={provInfo.tpaRate} avg={NATIONAL_AVG.tpaRate} min={3} max={16} color="#3498db" unit="%" higherIsBetter={true} />
                  <CompareBar label={t("골든타임 도착률 (%)", "Golden Time Arrival (%)")} value={provInfo.goldenTimeRate} avg={NATIONAL_AVG.goldenTimeRate} min={20} max={55} color="#2ecc71" unit="%" higherIsBetter={true} />
                  <div style={{ fontSize: '9px', color: '#555570', marginTop: '4px' }}>
                    {t('출처: KDCA 심뇌혈관질환 발생통계(2022), 심평원 | tPA·골든타임: 추정치', 'Source: KDCA CVD Statistics(2022), HIRA | tPA·Golden Time: Estimated')}
                  </div>
                </div>
              )}

              {/* Obesity comorbidity OR info box */}
              {provInfo && metric !== 'stroke' && (
                <div style={{
                  background: 'rgba(255,0,110,0.06)',
                  border: '1px solid rgba(255,0,110,0.15)',
                  borderRadius: '8px',
                  padding: '8px 10px',
                  marginBottom: '8px',
                }}>
                  <div style={{ fontSize: '10px', color: '#ff006e', fontWeight: 700, marginBottom: '4px' }}>
                    {t('비만 동반질환 위험 (OR)', 'Obesity Comorbidity Risk (OR)')}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {[
                      { label: t('당뇨', 'Diabetes'), or: t('5.2배', '5.2x'), color: '#00d4ff' },
                      { label: t('대사증후군', 'MetS'), or: t('3.1배', '3.1x'), color: '#ffd60a' },
                      { label: t('고혈압', 'HTN'), or: t('2.1배', '2.1x'), color: '#ff6b6b' },
                      { label: t('이상지질혈증', 'Dyslipidemia'), or: t('1.9배', '1.9x'), color: '#b388ff' },
                    ].map(item => (
                      <span key={item.label} style={{
                        fontSize: '10px', padding: '2px 7px', borderRadius: '10px',
                        background: `${item.color}15`, border: `1px solid ${item.color}30`,
                        color: item.color, fontFamily: "'JetBrains Mono', monospace", fontWeight: 600,
                      }}>
                        {item.label} {item.or}
                      </span>
                    ))}
                  </div>
                  <div style={{ fontSize: '9px', color: '#555570', marginTop: '4px' }}>
                    {t('출처: 대한비만학회 Fact Sheet 2024', 'Source: Korean Society for Obesity Fact Sheet 2024')}
                  </div>
                </div>
              )}

              {/* Expanded badge ranking list */}
              {expandedBadge && (() => {
                const ranked = getRankedList(expandedBadge);
                const badgeLabels = {
                  population: t('인구', 'Population'), grdpPerCapita: t('1인당GRDP', 'GRDP/Capita'), agingRate: t('고령화율', 'Aging Rate'),
                  lifeExpectancy: t('기대수명', 'Life Expectancy'), tertiaryHospitals: t('상급종합', 'Tertiary Hosp'), doctorsPerThousand: t('의사밀도', 'Doctor Density'),
                  unmetMedical: t('미충족의료', 'Unmet Medical'), smokingRate: t('흡연율', 'Smoking'), drinkingRate: t('음주율', 'Drinking'), noExerciseRate: t('운동부족', 'Low Exercise'),
                };
                return (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    style={{
                      background: 'rgba(255,255,255,0.02)',
                      borderRadius: '8px',
                      padding: '8px 10px',
                      marginBottom: '8px',
                      border: '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    <div style={{ fontSize: '10px', color: '#8888aa', marginBottom: '6px', fontWeight: 600 }}>
                      {badgeLabels[expandedBadge] || expandedBadge} — {t('전국 순위', 'National Ranking')}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 12px' }}>
                      {ranked.map((entry, i) => (
                        <div key={entry.name} style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          padding: '2px 6px', borderRadius: '4px', fontSize: '10px',
                          background: entry.name === selectedProvince?.name ? 'rgba(0,212,255,0.12)' : 'transparent',
                        }}>
                          <span style={{ color: entry.name === selectedProvince?.name ? '#00d4ff' : '#8888aa', fontFamily: "'JetBrains Mono'", minWidth: '18px' }}>
                            {i + 1}.
                          </span>
                          <span style={{ color: entry.name === selectedProvince?.name ? '#e8e8f0' : '#aaa', flex: 1 }}>
                            {lang === 'en' ? (T.provinces[entry.name] || entry.name) : entry.name}
                          </span>
                          <span style={{ color: entry.name === selectedProvince?.name ? '#00d4ff' : '#ccc', fontFamily: "'JetBrains Mono'", fontWeight: entry.name === selectedProvince?.name ? 700 : 400 }}>
                            {entry.formatted}
                          </span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                );
              })()}

              {/* Compare bars — compact two-column layout */}
              {provInfo && (() => {
                const perCapita = Math.round(provInfo.grdp * 1e12 / provInfo.population / 1e4);
                return (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                    <InfoBox title={t("📊 사회경제", "📊 Socioeconomic")} color="#ffd60a">
                      <CompareBar label={t("1인당 GRDP", "GRDP/Capita")} value={perCapita} avg={NATIONAL_AVG.grdpPerCapita} min={2000} max={9000} color="#ffd60a" higherIsBetter={true} />
                      <CompareBar label={t("고령화율", "Aging Rate")} value={provInfo.agingRate} avg={NATIONAL_AVG.agingRate} min={10} max={28} color="#ff8c00" unit="%" higherIsBetter={false} />
                      <CompareBar label={t("기대수명", "Life Expectancy")} value={provInfo.lifeExpectancy} avg={NATIONAL_AVG.lifeExpectancy} min={80} max={86} color="#00ff88" unit={t("세", "yr")} higherIsBetter={true} />
                    </InfoBox>
                    <InfoBox title={t("🏥 의료·건강행태", "🏥 Healthcare & Behavior")} color="#00d4ff">
                      <CompareBar label={t("의사밀도", "Doctor Density")} value={provInfo.doctorsPerThousand} avg={NATIONAL_AVG.doctorsPerThousand} min={1.0} max={3.8} color="#00d4ff" higherIsBetter={true} />
                      <CompareBar label={t("미충족의료", "Unmet Medical")} value={provInfo.unmetMedical} avg={NATIONAL_AVG.unmetMedical} min={4} max={12} color="#ff4444" unit="%" higherIsBetter={false} />
                      <CompareBar label={t("흡연율", "Smoking")} value={provInfo.smokingRate} avg={NATIONAL_AVG.smokingRate} min={12} max={24} color="#ff6b6b" unit="%" higherIsBetter={false} />
                    </InfoBox>
                  </div>
                );
              })()}

              {/* Radar Health Profile */}
              {provInfo && (
                <div style={{
                  background: 'rgba(255,255,255,0.02)',
                  borderRadius: '10px',
                  padding: '8px',
                  border: '1px solid rgba(255,255,255,0.04)',
                  marginBottom: '8px',
                }}>
                  <div style={{ fontSize: '11px', color: '#8888aa', marginBottom: '4px', fontWeight: 600 }}>
                    {t('건강 프로필 레이더', 'Health Profile Radar')}
                  </div>
                  <div style={{ height: '220px' }}>
                    <RadarProfile
                      provinceName={selectedProvince.name}
                      onAxisClick={(key) => setExpandedBadge(expandedBadge === key ? null : key)}
                    />
                  </div>
                </div>
              )}

            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
