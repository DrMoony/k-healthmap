// K-HealthMap Dark Theme — RPG/Cyberpunk aesthetic
export const theme = {
  // Background
  bg: {
    primary: '#0a0a0f',
    secondary: '#12121a',
    card: '#1a1a2e',
    cardHover: '#22223a',
    glass: 'rgba(26, 26, 46, 0.85)',
  },

  // Accent — neon/glow
  accent: {
    cyan: '#00d4ff',
    magenta: '#ff006e',
    gold: '#ffd60a',
    green: '#00ff88',
    purple: '#b388ff',
    orange: '#ff8c00',
  },

  // Semantic
  semantic: {
    danger: '#ff4444',
    warning: '#ffaa00',
    success: '#00cc66',
    info: '#4488ff',
  },

  // Text
  text: {
    primary: '#e8e8f0',
    secondary: '#8888aa',
    muted: '#555570',
    accent: '#00d4ff',
  },

  // Gradients
  gradient: {
    hero: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #16213e 100%)',
    card: 'linear-gradient(145deg, #1a1a2e 0%, #12121a 100%)',
    accent: 'linear-gradient(90deg, #00d4ff, #b388ff)',
    danger: 'linear-gradient(90deg, #ff006e, #ff4444)',
    warm: 'linear-gradient(90deg, #ffd60a, #ff8c00)',
  },

  // Map color scales
  map: {
    obesity: ['#1a1a2e', '#2d1b69', '#5b2c8e', '#8b3ab0', '#c850c0', '#ff006e'],
    metabolic: ['#1a1a2e', '#0d3b66', '#006d77', '#00b4d8', '#00d4ff', '#90e0ef'],
    screening: ['#1a1a2e', '#1b4332', '#2d6a4f', '#40916c', '#52b788', '#00ff88'],
  },

  // Glow effects
  glow: {
    cyan: '0 0 20px rgba(0, 212, 255, 0.3)',
    magenta: '0 0 20px rgba(255, 0, 110, 0.3)',
    gold: '0 0 20px rgba(255, 214, 10, 0.3)',
    green: '0 0 20px rgba(0, 255, 136, 0.3)',
  },

  // Typography
  font: {
    heading: "'Noto Sans KR', sans-serif",
    body: "'Noto Sans KR', sans-serif",
    mono: "'JetBrains Mono', monospace",
  },

  // Border
  border: {
    subtle: '1px solid rgba(255, 255, 255, 0.06)',
    accent: '1px solid rgba(0, 212, 255, 0.3)',
  },

  // Border radius
  radius: {
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
  },
};
