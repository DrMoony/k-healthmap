import { motion } from 'framer-motion';

export default function YearSlider({ year, onChange, min = 2015, max = 2024 }) {
  const years = Array.from({ length: max - min + 1 }, (_, i) => min + i);
  const progress = ((year - min) / (max - min)) * 100;

  return (
    <div style={{ width: '100%', maxWidth: '500px', padding: '0 8px' }}>
      <div style={{
        position: 'relative',
        height: '40px',
        display: 'flex',
        alignItems: 'center',
      }}>
        {/* Track */}
        <div style={{
          position: 'absolute',
          width: '100%',
          height: '4px',
          background: '#1a1a2e',
          borderRadius: '2px',
        }}>
          <motion.div
            style={{
              height: '100%',
              borderRadius: '2px',
              background: 'linear-gradient(90deg, #00d4ff, #b388ff)',
            }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.2 }}
          />
        </div>

        {/* Dots */}
        {years.map(y => (
          <div
            key={y}
            onClick={() => onChange(y)}
            style={{
              position: 'absolute',
              left: `${((y - min) / (max - min)) * 100}%`,
              transform: 'translateX(-50%)',
              width: y === year ? '14px' : '6px',
              height: y === year ? '14px' : '6px',
              borderRadius: '50%',
              background: y === year ? '#00d4ff' : '#9999bb',
              boxShadow: y === year ? '0 0 12px rgba(0,212,255,0.5)' : 'none',
              cursor: 'pointer',
              transition: 'all 0.2s',
              zIndex: y === year ? 2 : 1,
            }}
          />
        ))}

        {/* Range input (invisible, for drag) */}
        <input
          type="range"
          min={min}
          max={max}
          value={year}
          onChange={e => onChange(Number(e.target.value))}
          style={{
            position: 'absolute',
            width: '100%',
            height: '40px',
            opacity: 0,
            cursor: 'pointer',
            zIndex: 3,
          }}
        />
      </div>

      {/* Year labels */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '11px',
        fontFamily: "'JetBrains Mono'",
        color: '#9999bb',
        marginTop: '4px',
      }}>
        <span>{min}</span>
        <span style={{
          color: '#00d4ff',
          fontWeight: 700,
          fontSize: '13px',
          textShadow: '0 0 8px rgba(0,212,255,0.3)',
        }}>
          {year}
        </span>
        <span>{max}</span>
      </div>
    </div>
  );
}
