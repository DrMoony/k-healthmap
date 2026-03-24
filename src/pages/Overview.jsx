import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import KPICard from '../components/KPICard';
import KoreaMap from '../components/KoreaMap';
import YearSlider from '../components/YearSlider';
import DetailPanel from '../components/DetailPanel';
import { TRENDS } from '../data/trends';
import { BMI_PROV } from '../data/bmi_prov';
import { MET_PROV } from '../data/met_prov';
import { NATIONAL_AVG } from '../data/province_info';

export default function Overview() {
  const [year, setYear] = useState(2024);
  const [metric, setMetric] = useState('obesity');
  const [selectedKPI, setSelectedKPI] = useState(null);
  const [selectedProvince, setSelectedProvince] = useState(null);

  const latest = TRENDS.years.length - 1;
  const first = 0;

  const kpis = [
    { id: 'screening', label: '일반검진 수검률', value: TRENDS.screening[latest], icon: '🏥', color: '#00d4ff', delta: TRENDS.screening[latest] - TRENDS.screening[first], data: TRENDS.screening },
    { id: 'cancer', label: '암검진 수검률', value: TRENDS.cancer[latest], icon: '🔬', color: '#b388ff', delta: TRENDS.cancer[latest] - TRENDS.cancer[first], data: TRENDS.cancer },
    { id: 'obesity', label: '비만율', value: TRENDS.obesity[latest], icon: '⚖️', color: '#ff006e', delta: TRENDS.obesity[latest] - TRENDS.obesity[first], data: TRENDS.obesity },
    { id: 'metabolic', label: '대사증후군 위험군', value: TRENDS.metabolic[latest], icon: '💉', color: '#ffd60a', delta: TRENDS.metabolic[latest] - TRENDS.metabolic[first], data: TRENDS.metabolic },
    { id: 'stroke', label: '뇌졸중 발생률', value: NATIONAL_AVG.strokeIncidence, icon: '🧠', color: '#e74c3c', delta: null, data: null, unit: '/10만' },
  ];

  // Province detail data
  const provDetail = selectedProvince ? {
    name: selectedProvince,
    obesity: BMI_PROV[selectedProvince],
    metabolic: MET_PROV[selectedProvince],
  } : null;

  return (
    <div style={{
      height: 'calc(100vh - 56px)',
      marginTop: '56px',
      display: 'grid',
      gridTemplateColumns: '400px 1fr',
      gridTemplateRows: 'auto 1fr',
      gap: '12px',
      padding: '12px',
      overflow: 'hidden',
    }}>
      {/* Top: KPI strip */}
      <div style={{
        gridColumn: '1 / -1',
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: '10px',
      }}>
        {kpis.map((kpi, i) => (
          <KPICard
            key={kpi.id}
            {...kpi}
            delay={i * 0.08}
            compact
            active={selectedKPI === kpi.id}
            onClick={() => {
              setSelectedKPI(selectedKPI === kpi.id ? null : kpi.id);
              // Switch map metric when clicking obesity, metabolic, or stroke KPI
              if (kpi.id === 'obesity' || kpi.id === 'metabolic' || kpi.id === 'stroke') setMetric(kpi.id);
            }}
          />
        ))}
      </div>

      {/* Left: Map area */}
      <div style={{
        background: 'linear-gradient(145deg, #1a1a2e 0%, #12121a 100%)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '16px',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        overflow: 'hidden',
        position: 'relative',
      }}>
        {/* Metric toggle — in flow, not absolute */}
        <div style={{ display: 'flex', gap: '8px', alignSelf: 'flex-start', flexShrink: 0, zIndex: 2 }}>
          {[
            { id: 'obesity', label: '비만율', color: '#ff006e' },
            { id: 'metabolic', label: '대사증후군', color: '#00d4ff' },
            { id: 'stroke', label: '뇌졸중', color: '#e74c3c' },
          ].map(m => (
            <button
              key={m.id}
              onClick={() => setMetric(m.id)}
              style={{
                background: metric === m.id ? `${m.color}22` : 'transparent',
                border: `1px solid ${metric === m.id ? m.color : 'rgba(255,255,255,0.1)'}`,
                borderRadius: '8px',
                padding: '4px 12px',
                color: metric === m.id ? m.color : '#8888aa',
                fontSize: '12px',
                fontWeight: metric === m.id ? 600 : 400,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {m.label}
            </button>
          ))}
        </div>

        <div style={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          <KoreaMap
            metric={metric}
            year={year}
            onProvinceClick={(name) => {
              setSelectedProvince(selectedProvince === name ? null : name);
              setSelectedKPI(null);
            }}
          />
        </div>

        {/* Year slider at bottom — always visible */}
        <div style={{ width: '80%', maxWidth: '400px', flexShrink: 0, padding: '4px 0' }}>
          <YearSlider year={year} onChange={setYear} />
        </div>
      </div>

      {/* Right: Detail panel */}
      <div style={{
        background: 'linear-gradient(145deg, #1a1a2e 0%, #12121a 100%)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '16px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <DetailPanel
          selectedKPI={selectedKPI ? kpis.find(k => k.id === selectedKPI) : null}
          selectedProvince={provDetail}
          years={TRENDS.years}
          year={year}
          metric={metric}
        />
      </div>

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
        출처: 건강검진통계연보 2015-2024, 행안부 주민등록인구 2024, 통계청 GRDP 2023, 각 학회 팩트시트
      </div>
    </div>
  );
}
