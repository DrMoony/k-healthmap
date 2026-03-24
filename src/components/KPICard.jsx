import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

export default function KPICard({ label, value, unit = '%', delta, icon, color = '#00d4ff', delay = 0, compact, active, onClick, data }) {
  const [displayed, setDisplayed] = useState(0);
  const ref = useRef(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (hasAnimated.current) return;
    hasAnimated.current = true;
    const duration = 1800;
    const start = performance.now();
    function tick(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutCubic(progress);
      setDisplayed(parseFloat((eased * value).toFixed(1)));
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [value]);

  const isPositive = delta > 0;

  // Rule 2: glow intensity based on value magnitude (normalize 0-100 range)
  const glowIntensity = Math.min(1, (value || 0) / 60);
  const glowAlpha = active
    ? Math.round(0x22 + glowIntensity * 0x33).toString(16).padStart(2, '0')
    : Math.round(glowIntensity * 0x18).toString(16).padStart(2, '0');

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      onClick={onClick}
      style={{
        background: active
          ? `linear-gradient(145deg, ${color}${Math.round(0x18 + glowIntensity * 0x10).toString(16).padStart(2, '0')}, ${color}08)`
          : 'linear-gradient(145deg, #1a1a2e 0%, #12121a 100%)',
        border: active
          ? `1px solid ${color}66`
          : '1px solid rgba(255, 255, 255, 0.06)',
        borderRadius: compact ? '12px' : '16px',
        padding: compact ? '14px 18px' : '24px',
        position: 'relative',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'all 0.25s',
        boxShadow: active ? `0 0 ${16 + Math.round(glowIntensity * 20)}px ${color}${glowAlpha}` : `0 0 ${Math.round(glowIntensity * 8)}px ${color}${glowAlpha}`,
      }}
      whileHover={{
        scale: 1.02,
        boxShadow: `0 0 24px ${color}33`,
      }}
    >
      {/* Glow accent line */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0,
        height: '2px',
        background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
        opacity: active ? 1 : 0.5,
      }} />

      <div style={{
        display: 'flex',
        alignItems: compact ? 'center' : 'flex-start',
        gap: compact ? '12px' : '8px',
        flexDirection: compact ? 'row' : 'column',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          ...(compact ? {} : { marginBottom: '8px' }),
        }}>
          <span style={{ fontSize: compact ? '16px' : '20px' }}>{icon}</span>
          <span style={{ color: '#8888aa', fontSize: compact ? '12px' : '13px', fontWeight: 500 }}>
            {label}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: '3px', marginLeft: compact ? 'auto' : 0 }}>
          <span style={{
            fontSize: compact ? '24px' : '36px',
            fontWeight: 900,
            fontFamily: "'JetBrains Mono', monospace",
            color,
            textShadow: `0 0 16px ${color}44`,
          }}>
            {displayed.toFixed(1)}
          </span>
          <span style={{ color: '#8888aa', fontSize: compact ? '12px' : '16px' }}>{unit}</span>
        </div>

        {delta != null && (
          <div style={{
            fontSize: '11px',
            color: isPositive ? '#ff006e' : '#00ff88',
            fontFamily: "'JetBrains Mono', monospace",
            ...(compact ? { marginLeft: '8px' } : { marginTop: '4px' }),
          }}>
            {isPositive ? '▲' : '▼'} {Math.abs(delta).toFixed(1)}pp
          </div>
        )}
      </div>
    </motion.div>
  );
}
