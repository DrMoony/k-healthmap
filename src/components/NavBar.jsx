import { motion } from 'framer-motion';
import { useLang } from '../i18n';
import { T } from '../translations';

const tabs = [
  { id: 'overview', icon: '🏠' },
  { id: 'metabolic', icon: '🗺️' },
  { id: 'exam', icon: '🔬' },
  { id: 'lifestyle', icon: '🏃' },
  { id: 'disease', icon: '🧬' },
  { id: 'stroke', icon: '🧠' },
];

export default function NavBar({ active, onChange }) {
  const { lang, setLang } = useLang();

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
            {T.tabs[tab.id][lang]}
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

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Language Toggle */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          background: 'rgba(255,255,255,0.05)',
          borderRadius: '20px',
          padding: '2px',
          border: '1px solid rgba(255,255,255,0.08)',
        }}>
          <button
            onClick={() => setLang('ko')}
            style={{
              padding: '4px 10px',
              borderRadius: '16px',
              border: 'none',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
              background: lang === 'ko' ? 'rgba(0,212,255,0.2)' : 'transparent',
              color: lang === 'ko' ? '#00d4ff' : '#666',
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            KO
          </button>
          <button
            onClick={() => setLang('en')}
            style={{
              padding: '4px 10px',
              borderRadius: '16px',
              border: 'none',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
              background: lang === 'en' ? 'rgba(0,212,255,0.2)' : 'transparent',
              color: lang === 'en' ? '#00d4ff' : '#666',
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            EN
          </button>
        </div>
      </div>
    </nav>
  );
}
