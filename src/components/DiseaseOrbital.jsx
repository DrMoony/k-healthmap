import { useState, useEffect, useRef, useCallback } from 'react';
import { DISEASE_EPI } from '../data/disease_epi';

// ── Orbital Disease Nodes ───────────────────────────────────
const diseaseNodes = [
  {
    id: 'obesity', name: '비만', nameEn: 'Obesity', level: 0,
    prevalence: '38.4%', prevalenceNum: 38.4, population: '약 1,500만명',
    color: '#ff006e', relatedIds: ['diabetes', 'dyslipidemia', 'hypertension', 'masld'],
    status: 'critical', energy: 95, angle: 0,
    genderGap: { male: 49.6, female: 27.7 },
    trend: '10년간 지속 증가',
  },
  {
    id: 'diabetes', name: '당뇨', nameEn: 'Diabetes', level: 1,
    prevalence: '15.5%', prevalenceNum: 15.5, population: '약 530만명',
    color: '#00d4ff', relatedIds: ['obesity', 'hypertension', 'ckd', 'masld', 'cvd'],
    status: 'critical', energy: 85, angle: 0,
    genderGap: { male: 18.1, female: 13.0 },
    trend: '꾸준히 증가',
  },
  {
    id: 'dyslipidemia', name: '이상지질혈증', nameEn: 'Dyslipidemia', level: 1,
    prevalence: '40.9%', prevalenceNum: 40.9, population: '약 1,660만명',
    color: '#b388ff', relatedIds: ['obesity', 'masld', 'cvd'],
    status: 'warning', energy: 80, angle: 120,
    genderGap: { male: 47.1, female: 34.7 },
    trend: '급격한 증가',
  },
  {
    id: 'hypertension', name: '고혈압', nameEn: 'Hypertension', level: 1,
    prevalence: '30%', prevalenceNum: 30, population: '약 1,300만명',
    color: '#ffd60a', relatedIds: ['obesity', 'cvd', 'ckd', 'mi_stroke'],
    status: 'warning', energy: 75, angle: 240,
    genderGap: { male: 33.2, female: 23.1 },
    trend: '유지/미세 증가',
  },
  {
    id: 'masld', name: 'MASLD', nameEn: 'Steatotic Liver', level: 2,
    prevalence: '768만', prevalenceNum: 38, population: 'NHIS 진단 기준 768만명',
    color: '#00ff88', relatedIds: ['obesity', 'diabetes', 'dyslipidemia', 'cirrhosis'],
    status: 'critical', energy: 88, angle: 0,
    genderGap: { male: 45, female: 30 },
    trend: '급증 추세',
  },
  {
    id: 'cvd', name: '심혈관질환', nameEn: 'Cardiovascular', level: 2,
    prevalence: '사망 59.7/10만', prevalenceNum: 15, population: '사망원인 2위',
    color: '#ff6b6b', relatedIds: ['diabetes', 'dyslipidemia', 'hypertension', 'mi_stroke'],
    status: 'warning', energy: 70, angle: 120,
    genderGap: { male: null, female: null },
    trend: '유병률 증가',
  },
  {
    id: 'ckd', name: 'CKD', nameEn: 'Chronic Kidney', level: 2,
    prevalence: '8.2%', prevalenceNum: 8.2, population: '약 360만명',
    color: '#4ecdc4', relatedIds: ['diabetes', 'hypertension', 'dialysis'],
    status: 'warning', energy: 65, angle: 240,
    genderGap: { male: null, female: null },
    trend: '지속 증가',
  },
  {
    id: 'cirrhosis', name: '간경변/HCC', nameEn: 'Cirrhosis/HCC', level: 3,
    prevalence: '간암 34.2/10만', prevalenceNum: 5, population: '간암 사망률 14.1/10만',
    color: '#e74c3c', relatedIds: ['masld'],
    status: 'danger', energy: 50, angle: 0,
    genderGap: { male: null, female: null },
    trend: 'MASH 기인 증가',
  },
  {
    id: 'mi_stroke', name: 'MI/뇌졸중', nameEn: 'MI/Stroke', level: 3,
    prevalence: '뇌졸중 217/10만', prevalenceNum: 8, population: '심근경색 65/10만',
    color: '#e67e22', relatedIds: ['cvd', 'hypertension', 'diabetes'],
    status: 'danger', energy: 55, angle: 120,
    genderGap: { male: null, female: null },
    trend: '발생률 유지/증가',
  },
  {
    id: 'dialysis', name: '투석/이식', nameEn: 'Dialysis', level: 3,
    prevalence: '약 13만명', prevalenceNum: 3, population: '이식대기 약 3만명',
    color: '#9b59b6', relatedIds: ['ckd'],
    status: 'danger', energy: 45, angle: 240,
    genderGap: { male: null, female: null },
    trend: '연 8% 증가',
  },
];

// ── Orbit config ────────────────────────────────────────────
const ORBIT_RADII = { 0: 0, 1: 155, 2: 260, 3: 350 };
const NODE_SIZES = { 0: 58, 1: 46, 2: 38, 3: 32 };
const ORBIT_SPEEDS = { 0: 0, 1: 0.15, 2: 0.1, 3: 0.06 };
const STATUS_LABELS = {
  critical: { text: '위험', bg: '#ff006e' },
  warning: { text: '주의', bg: '#ffd60a' },
  danger: { text: '고위험', bg: '#e74c3c' },
  stable: { text: '양호', bg: '#00ff88' },
};

// ── Keyframe styles ─────────────────────────────────────────
const ORBITAL_STYLES = `
@keyframes orbitalPulse {
  0%, 100% { box-shadow: 0 0 8px var(--glow), 0 0 20px var(--glow); }
  50% { box-shadow: 0 0 16px var(--glow), 0 0 40px var(--glow), 0 0 60px var(--glow); }
}
@keyframes orbitalPing {
  0% { transform: translate(-50%, -50%) scale(1); opacity: 0.6; }
  100% { transform: translate(-50%, -50%) scale(2.5); opacity: 0; }
}
@keyframes centerPulse {
  0%, 100% { box-shadow: 0 0 30px #ff006e, 0 0 60px #00d4ff, 0 0 90px #00ff88; transform: translate(-50%, -50%) scale(1); }
  33% { box-shadow: 0 0 40px #00d4ff, 0 0 70px #00ff88, 0 0 100px #ff006e; transform: translate(-50%, -50%) scale(1.05); }
  66% { box-shadow: 0 0 35px #00ff88, 0 0 65px #ff006e, 0 0 95px #00d4ff; transform: translate(-50%, -50%) scale(1.02); }
}
@keyframes dashFlow {
  0% { stroke-dashoffset: 20; }
  100% { stroke-dashoffset: 0; }
}
@keyframes cardSlideIn {
  from { opacity: 0; transform: translateY(16px) scale(0.95); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes ringPulse {
  0%, 100% { opacity: 0.08; }
  50% { opacity: 0.18; }
}
@keyframes energyGlow {
  0%, 100% { opacity: 0.7; }
  50% { opacity: 1; }
}
`;

export default function DiseaseOrbital() {
  const containerRef = useRef(null);
  const animRef = useRef(null);
  const [dims, setDims] = useState({ w: 800, h: 600 });
  const [angles, setAngles] = useState(() => {
    const init = {};
    diseaseNodes.forEach(n => { init[n.id] = n.angle; });
    return init;
  });
  const [selectedId, setSelectedId] = useState(null);
  const [rotating, setRotating] = useState(true);
  const lastTimeRef = useRef(0);

  // Resize observer
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      if (width > 0 && height > 0) setDims({ w: width, h: height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Animation loop
  useEffect(() => {
    if (!rotating) {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      return;
    }
    const tick = (time) => {
      const dt = lastTimeRef.current ? (time - lastTimeRef.current) / 1000 : 0.016;
      lastTimeRef.current = time;
      setAngles(prev => {
        const next = { ...prev };
        diseaseNodes.forEach(n => {
          if (n.level === 0) return;
          next[n.id] = (prev[n.id] + ORBIT_SPEEDS[n.level] * dt * 360) % 360;
        });
        return next;
      });
      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [rotating]);

  const cx = dims.w / 2;
  const cy = dims.h / 2;

  // Get node position
  const getNodePos = useCallback((node) => {
    if (node.level === 0) return { x: cx, y: cy };
    const a = (angles[node.id] || 0) * Math.PI / 180;
    const r = ORBIT_RADII[node.level] * Math.min(dims.w, dims.h) / 700;
    return { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r };
  }, [angles, cx, cy, dims]);

  const handleNodeClick = (e, nodeId) => {
    e.stopPropagation();
    if (selectedId === nodeId) {
      setSelectedId(null);
      setRotating(true);
    } else {
      setSelectedId(nodeId);
      setRotating(false);
    }
  };

  const handleBgClick = () => {
    setSelectedId(null);
    setRotating(true);
  };

  const selectedNode = diseaseNodes.find(n => n.id === selectedId);
  const relatedSet = selectedNode ? new Set(selectedNode.relatedIds) : new Set();

  // Connection lines for selected node
  const connections = [];
  if (selectedNode) {
    selectedNode.relatedIds.forEach(rid => {
      const related = diseaseNodes.find(n => n.id === rid);
      if (!related) return;
      const from = getNodePos(selectedNode);
      const to = getNodePos(related);
      connections.push({ from, to, color: related.color, id: rid });
    });
  }

  // Get card position
  const getCardPos = () => {
    if (!selectedNode) return {};
    const pos = getNodePos(selectedNode);
    const cardW = 320;
    const cardH = 340;
    let left = pos.x + NODE_SIZES[selectedNode.level] + 20;
    let top = pos.y - cardH / 2;
    if (left + cardW > dims.w - 10) left = pos.x - cardW - NODE_SIZES[selectedNode.level] - 20;
    if (top < 10) top = 10;
    if (top + cardH > dims.h - 10) top = dims.h - cardH - 10;
    return { left, top };
  };

  const scale = Math.min(dims.w, dims.h) / 700;

  return (
    <div
      ref={containerRef}
      onClick={handleBgClick}
      style={{
        position: 'relative', width: '100%', height: '100%',
        background: 'radial-gradient(ellipse at center, #111122 0%, #0a0a0f 70%)',
        overflow: 'hidden', cursor: 'default', fontFamily: "'Noto Sans KR', sans-serif",
      }}
    >
      <style>{ORBITAL_STYLES}</style>

      {/* ── SVG Layer: Orbit Rings + Connections ── */}
      <svg
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
      >
        {/* Orbit rings */}
        {[1, 2, 3].map(level => (
          <circle
            key={level}
            cx={cx} cy={cy}
            r={ORBIT_RADII[level] * scale}
            fill="none"
            stroke="rgba(0, 212, 255, 0.08)"
            strokeWidth={1}
            strokeDasharray="4 8"
            style={{ animation: 'ringPulse 4s ease-in-out infinite', animationDelay: `${level * 0.5}s` }}
          />
        ))}

        {/* Connection lines */}
        {connections.map(c => {
          const midX = (c.from.x + c.to.x) / 2 + (Math.random() - 0.5) * 20;
          const midY = (c.from.y + c.to.y) / 2 + (Math.random() - 0.5) * 20;
          return (
            <g key={c.id}>
              {/* Glow line */}
              <line
                x1={c.from.x} y1={c.from.y} x2={c.to.x} y2={c.to.y}
                stroke={c.color} strokeWidth={3} strokeOpacity={0.15}
              />
              {/* Dash-flow line */}
              <line
                x1={c.from.x} y1={c.from.y} x2={c.to.x} y2={c.to.y}
                stroke={c.color} strokeWidth={1.5} strokeOpacity={0.7}
                strokeDasharray="6 4"
                style={{ animation: 'dashFlow 1s linear infinite' }}
              />
            </g>
          );
        })}
      </svg>

      {/* ── Center Node ── */}
      <div
        style={{
          position: 'absolute',
          left: cx, top: cy,
          transform: 'translate(-50%, -50%)',
          width: 72 * scale, height: 72 * scale,
          borderRadius: '50%',
          background: 'radial-gradient(circle, #ff006e 0%, #00d4ff 50%, #00ff88 100%)',
          animation: 'centerPulse 4s ease-in-out infinite',
          zIndex: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
        }}
        onClick={(e) => { e.stopPropagation(); handleBgClick(); }}
      >
        <span style={{
          color: '#fff', fontSize: 11 * scale, fontWeight: 700,
          textAlign: 'center', lineHeight: 1.2, textShadow: '0 0 10px rgba(0,0,0,0.8)',
        }}>
          대사질환<br />생태계
        </span>
      </div>

      {/* ── Disease Nodes ── */}
      {diseaseNodes.map(node => {
        if (node.level === 0) {
          // Obesity node near center
        }
        const pos = getNodePos(node);
        const size = NODE_SIZES[node.level] * scale;
        const isSelected = selectedId === node.id;
        const isRelated = relatedSet.has(node.id);
        const dimmed = selectedId && !isSelected && !isRelated;

        return (
          <div
            key={node.id}
            onClick={(e) => handleNodeClick(e, node.id)}
            onMouseEnter={() => setRotating(false)}
            onMouseLeave={() => { if (!selectedNode) setRotating(true); }}
            style={{
              '--glow': node.color,
              position: 'absolute',
              left: pos.x, top: pos.y,
              transform: 'translate(-50%, -50%)',
              width: size, height: size,
              borderRadius: '50%',
              background: `radial-gradient(circle at 35% 35%, ${node.color}cc, ${node.color}44)`,
              border: `2px solid ${isSelected ? '#fff' : node.color}`,
              cursor: 'pointer',
              transition: 'opacity 0.3s, border-color 0.3s, filter 0.3s',
              opacity: dimmed ? 0.25 : 1,
              animation: isRelated ? 'orbitalPulse 1.2s ease-in-out infinite' : 'none',
              zIndex: isSelected ? 30 : node.level === 0 ? 20 : 15 - node.level,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              filter: isSelected ? `drop-shadow(0 0 16px ${node.color})` : 'none',
            }}
          >
            {/* Ping ring on related */}
            {isRelated && (
              <div style={{
                position: 'absolute', left: '50%', top: '50%',
                width: size, height: size, borderRadius: '50%',
                border: `2px solid ${node.color}`,
                animation: 'orbitalPing 1.5s ease-out infinite',
                pointerEvents: 'none',
              }} />
            )}
            <span style={{
              color: '#fff', fontSize: Math.max(10, size * 0.32),
              fontWeight: 700, textAlign: 'center',
              textShadow: '0 1px 4px rgba(0,0,0,0.9)',
              lineHeight: 1.1, pointerEvents: 'none',
              fontFamily: "'Noto Sans KR', sans-serif",
            }}>
              {node.name}
            </span>
            {/* External label: disease name + prevalence below node */}
            <div style={{
              position: 'absolute',
              top: size + 4,
              left: '50%',
              transform: 'translateX(-50%)',
              textAlign: 'center',
              pointerEvents: 'none',
              whiteSpace: 'nowrap',
              opacity: dimmed ? 0.3 : 0.9,
              transition: 'opacity 0.3s',
            }}>
              <div style={{
                color: '#fff', fontSize: Math.max(12, size * 0.28),
                fontWeight: 700, textShadow: '0 1px 6px rgba(0,0,0,0.9)',
                fontFamily: "'Noto Sans KR', sans-serif",
              }}>
                {node.name}
              </div>
              <div style={{
                color: node.color, fontSize: Math.max(10, size * 0.24),
                fontWeight: 600, textShadow: '0 1px 4px rgba(0,0,0,0.8)',
                fontFamily: "'JetBrains Mono', monospace",
                marginTop: 1,
              }}>
                {node.prevalence}
              </div>
            </div>
          </div>
        );
      })}

      {/* ── Level Labels ── */}
      {[
        { level: 1, label: '1차 질환' },
        { level: 2, label: '2차 합병증' },
        { level: 3, label: '3차 결과' },
      ].map(({ level, label }) => (
        <div key={level} style={{
          position: 'absolute',
          left: cx + ORBIT_RADII[level] * scale + 6,
          top: cy - 10,
          color: 'rgba(0, 212, 255, 0.25)',
          fontSize: 10, fontFamily: "'JetBrains Mono', monospace",
          pointerEvents: 'none', whiteSpace: 'nowrap',
        }}>
          {label}
        </div>
      ))}

      {/* ── Expanded Info Card ── */}
      {selectedNode && (() => {
        const cardPos = getCardPos();
        const st = STATUS_LABELS[selectedNode.status] || STATUS_LABELS.stable;
        return (
          <div
            onClick={e => e.stopPropagation()}
            style={{
              position: 'absolute',
              left: cardPos.left, top: cardPos.top,
              width: 310, minHeight: 300,
              background: 'rgba(15, 15, 30, 0.92)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: `1px solid ${selectedNode.color}44`,
              borderRadius: 12,
              padding: '18px 20px',
              zIndex: 50,
              animation: 'cardSlideIn 0.3s ease-out',
              boxShadow: `0 0 30px ${selectedNode.color}22, 0 8px 32px rgba(0,0,0,0.6)`,
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div style={{
                width: 12, height: 12, borderRadius: '50%',
                background: selectedNode.color,
                boxShadow: `0 0 10px ${selectedNode.color}`,
              }} />
              <div>
                <div style={{ color: '#fff', fontSize: 16, fontWeight: 700 }}>
                  {selectedNode.name}
                </div>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }}>
                  {selectedNode.nameEn}
                </div>
              </div>
              <div style={{
                marginLeft: 'auto',
                padding: '2px 10px', borderRadius: 20,
                background: `${st.bg}22`, border: `1px solid ${st.bg}66`,
                color: st.bg, fontSize: 11, fontWeight: 600,
              }}>
                {st.text}
              </div>
            </div>

            {/* Prevalence big number */}
            <div style={{
              color: selectedNode.color,
              fontSize: 32, fontWeight: 800,
              fontFamily: "'JetBrains Mono', monospace",
              letterSpacing: -1, marginBottom: 2,
            }}>
              {selectedNode.prevalence}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginBottom: 14 }}>
              {selectedNode.population}
            </div>

            {/* Gender Gap */}
            {selectedNode.genderGap.male !== null && (
              <div style={{
                display: 'flex', gap: 16, marginBottom: 14,
                padding: '8px 12px', borderRadius: 8,
                background: 'rgba(255,255,255,0.04)',
              }}>
                <div>
                  <span style={{ color: '#00d4ff', fontSize: 12 }}>♂ </span>
                  <span style={{ color: '#fff', fontSize: 14, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>
                    {selectedNode.genderGap.male}%
                  </span>
                </div>
                <div>
                  <span style={{ color: '#ff006e', fontSize: 12 }}>♀ </span>
                  <span style={{ color: '#fff', fontSize: 14, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>
                    {selectedNode.genderGap.female}%
                  </span>
                </div>
              </div>
            )}

            {/* Trend */}
            <div style={{
              color: 'rgba(255,255,255,0.6)', fontSize: 12,
              marginBottom: 14, lineHeight: 1.5,
            }}>
              <span style={{ color: '#ffd60a', fontSize: 10, marginRight: 6 }}>▲</span>
              {selectedNode.trend}
            </div>

            {/* Energy Bar */}
            <div style={{ marginBottom: 14 }}>
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4,
              }}>
                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10 }}>인구 영향도</span>
                <span style={{
                  color: selectedNode.color, fontSize: 12,
                  fontFamily: "'JetBrains Mono', monospace", fontWeight: 600,
                }}>
                  {selectedNode.energy}
                </span>
              </div>
              <div style={{
                width: '100%', height: 6, borderRadius: 3,
                background: 'rgba(255,255,255,0.06)',
                overflow: 'hidden',
              }}>
                <div style={{
                  width: `${selectedNode.energy}%`, height: '100%',
                  borderRadius: 3,
                  background: `linear-gradient(90deg, ${selectedNode.color}88, ${selectedNode.color})`,
                  animation: 'energyGlow 2s ease-in-out infinite',
                }} />
              </div>
            </div>

            {/* Connected diseases */}
            <div style={{ marginBottom: 8 }}>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, marginBottom: 6 }}>
                연결 질환
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {selectedNode.relatedIds.map(rid => {
                  const rn = diseaseNodes.find(n => n.id === rid);
                  if (!rn) return null;
                  return (
                    <button
                      key={rid}
                      onClick={(e) => { e.stopPropagation(); handleNodeClick(e, rid); }}
                      style={{
                        background: `${rn.color}18`,
                        border: `1px solid ${rn.color}44`,
                        color: rn.color,
                        padding: '3px 10px', borderRadius: 20,
                        fontSize: 11, cursor: 'pointer',
                        fontFamily: "'Noto Sans KR', sans-serif",
                        transition: 'background 0.2s',
                      }}
                      onMouseEnter={e => e.target.style.background = `${rn.color}33`}
                      onMouseLeave={e => e.target.style.background = `${rn.color}18`}
                    >
                      {rn.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Source */}
            <div style={{
              color: 'rgba(255,255,255,0.2)', fontSize: 10,
              fontFamily: "'JetBrains Mono', monospace",
              borderTop: '1px solid rgba(255,255,255,0.06)',
              paddingTop: 8, marginTop: 8,
            }}>
              출처: KNHANES / NHIS / 각 학회 Fact Sheet
            </div>
          </div>
        );
      })()}

      {/* ── Title ── */}
      <div style={{
        position: 'absolute', left: 16, top: 12,
        color: 'rgba(255,255,255,0.5)', fontSize: 11,
        fontFamily: "'JetBrains Mono', monospace",
        pointerEvents: 'none',
      }}>
        METABOLIC DISEASE ORBITAL
      </div>

      {/* ── Legend ── */}
      <div style={{
        position: 'absolute', right: 16, bottom: 12,
        display: 'flex', gap: 12, alignItems: 'center',
      }}>
        {[
          { label: '위험인자', color: '#ff006e' },
          { label: '1차', color: '#00d4ff' },
          { label: '2차', color: '#00ff88' },
          { label: '3차', color: '#e74c3c' },
        ].map(l => (
          <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{
              width: 6, height: 6, borderRadius: '50%',
              background: l.color, boxShadow: `0 0 4px ${l.color}`,
            }} />
            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10 }}>{l.label}</span>
          </div>
        ))}
      </div>

      {/* ── Hint ── */}
      {!selectedId && (
        <div style={{
          position: 'absolute', bottom: 36, left: '50%', transform: 'translateX(-50%)',
          color: 'rgba(255,255,255,0.2)', fontSize: 11,
          pointerEvents: 'none',
        }}>
          질환 노드를 클릭하면 상세 정보와 연결 관계를 확인할 수 있습니다
        </div>
      )}
    </div>
  );
}
