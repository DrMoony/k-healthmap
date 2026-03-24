import { motion } from 'framer-motion';

const tabs = [
  { id: 'overview', label: '종합현황', icon: '🏠' },
  { id: 'metabolic', label: '대사질환', icon: '🗺️' },
  { id: 'exam', label: '검진항목', icon: '🔬' },
  { id: 'lifestyle', label: '생활습관', icon: '🏃' },
  { id: 'disease', label: '질환네트워크', icon: '🧬' },
  { id: 'stroke', label: '뇌졸중', icon: '🧠' },
];

export default function NavBar({ active, onChange }) {
  return (
    <nav style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 100,
      background: 'rgba(10, 10, 15, 0.9)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        padding: '0 24px',
        height: '56px',
        gap: '8px',
      }}>
        {/* Logo with Taegeukgi */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginRight: '32px' }}>
          <svg viewBox="0 0 36 36" width="22" height="22" style={{ flexShrink: 0 }}>
            {/* Taegeuk — red top, blue bottom, S-curve */}
            <circle cx="18" cy="18" r="16" fill="#c60c30"/>
            <path d="M18 2 A16 16 0 0 1 18 34 A8 8 0 0 1 18 18 A8 8 0 0 0 18 2" fill="#003478"/>
          </svg>
          <div style={{
            fontWeight: 900,
            fontSize: '18px',
            background: 'linear-gradient(90deg, #00d4ff, #b388ff)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontFamily: "'JetBrains Mono'",
            letterSpacing: '-0.5px',
          }}>
            K-HealthMap
          </div>
        </div>

        {/* Tabs */}
        {tabs.map(tab => (
          <motion.button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{
              position: 'relative',
              background: active === tab.id ? 'rgba(0,212,255,0.1)' : 'transparent',
              border: active === tab.id ? '1px solid rgba(0,212,255,0.3)' : '1px solid transparent',
              borderRadius: '8px',
              padding: '6px 14px',
              color: active === tab.id ? '#00d4ff' : '#8888aa',
              fontSize: '13px',
              fontWeight: active === tab.id ? 600 : 400,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s',
              fontFamily: "'Noto Sans KR'",
            }}
          >
            <span style={{ fontSize: '14px' }}>{tab.icon}</span>
            {tab.label}
            {active === tab.id && (
              <motion.div
                layoutId="navIndicator"
                style={{
                  position: 'absolute',
                  bottom: -1,
                  left: '20%',
                  right: '20%',
                  height: '2px',
                  background: '#00d4ff',
                  boxShadow: '0 0 8px rgba(0,212,255,0.5)',
                }}
              />
            )}
          </motion.button>
        ))}
      </div>
    </nav>
  );
}
