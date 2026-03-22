import re

with open('src/pages/DiseaseNetwork.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Find the CascadeView function and replace it entirely
# It starts at "// ── Diabetes Control Cascade" and ends before "// ── Multi-Disease Trend Comparison"
old_section_pattern = r'// ── Diabetes Control Cascade.*?function CascadeView\(\) \{.*?\n\}\n'
# Find the boundaries
start_marker = '// ── Diabetes Control Cascade'
end_marker = '// ── Multi-Disease Trend Comparison'

start_idx = content.index(start_marker)
end_idx = content.index(end_marker)

new_cascade = r'''// ── Diabetes Control Cascade (SVG Funnel) ────────────────────
function CascadeView() {
  const containerRef = useRef(null);
  const svgRef = useRef(null);
  const [cascadeDetail, setCascadeDetail] = useState(null);

  // Fixed viewBox 900x420
  const w = 900, h = 420;

  // Overall cascade (30+)
  const overall = [
    { label: '당뇨 환자', value: 100, sub: '30세 이상' },
    { label: '인지', value: 74.7, sub: 'Awareness' },
    { label: '치료', value: 70.9, sub: 'Treatment' },
    { label: 'HbA1c <6.5%', value: 32.4, sub: 'Glycemic Control' },
    { label: '+BP 조절', value: 32.4 * 0.608, sub: 'BP <140/85' },
    { label: '+LDL 조절', value: 15.9, sub: 'LDL <100' },
    { label: '통합관리', value: 15.9, sub: 'All 3 Targets Met' },
  ];

  // Young adult cascade (19-39)
  const young = [
    { value: 100 },
    { value: 43.3 },
    { value: 34.6 },
    { value: 29.6 },
    { value: 29.6 * 0.269 },
    { value: 9.2 },
    { value: 9.2 },
  ];

  // Funnel dimensions
  const marginT = 52;
  const marginB = 8;
  const maxWidth = 580;
  const cx = w / 2 - 20; // center x, shifted left for right-side labels
  const stepCount = overall.length;
  const totalH = h - marginT - marginB;
  const stepH = totalH / stepCount;

  const getStepColor = (val) => {
    const t = val / 100;
    const r = Math.round(0 + (1 - t) * 255);
    const g = Math.round(212 * t);
    const b = Math.round(255 * t);
    return `rgb(${r},${g},${b})`;
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '12px 24px 4px' }}>
        <h2 style={{
          fontFamily: "'Noto Sans KR', sans-serif", fontSize: 18, fontWeight: 800,
          color: '#e0e0ff', margin: 0, textShadow: '0 0 20px rgba(0,212,255,0.3)',
        }}>
          당뇨 관리 캐스케이드
        </h2>
        <p style={{
          fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#4a4a6a',
          margin: '2px 0 0', letterSpacing: 0.5,
        }}>
          DIABETES INTEGRATED CONTROL FUNNEL
        </p>
      </div>
      <div style={{ flex: 1, padding: '0 8px 0', position: 'relative' }} ref={containerRef}>
        <svg ref={svgRef} viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: '100%' }}
          preserveAspectRatio="xMidYMid meet">
          <defs>
            <pattern id="cascGrid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#141430" strokeWidth="0.5" opacity="0.3" />
            </pattern>
          </defs>
          <rect width={w} height={h} fill="url(#cascGrid)" />

          {/* Funnel trapezoids */}
          {overall.map((step, i) => {
            const topW = (step.value / 100) * maxWidth;
            const bottomW = i < overall.length - 1
              ? (overall[i + 1].value / 100) * maxWidth
              : topW * 0.85;
            const yTop = marginT + i * stepH;
            const yBottom = yTop + stepH;
            const color = getStepColor(step.value);
            const opacity = 0.4 + (step.value / 100) * 0.55;

            // Trapezoid points: top-left, top-right, bottom-right, bottom-left
            const path = `M${cx - topW / 2},${yTop} L${cx + topW / 2},${yTop} L${cx + bottomW / 2},${yBottom} L${cx - bottomW / 2},${yBottom} Z`;

            // Drop-off between this step and next
            const dropPct = i < overall.length - 1 ? step.value - overall[i + 1].value : 0;
            const dropOpacity = dropPct > 1 ? Math.min(dropPct / 40, 0.7) * 0.35 : 0;

            // Young adult comparison bar
            const youngBarH = Math.max((young[i].value / 100) * stepH * 0.8, 2);
            const youngBarX = cx + topW / 2 + 30;

            return (
              <g key={i} style={{ cursor: 'pointer' }}
                onClick={() => setCascadeDetail({
                  type: 'bar', label: step.label, sub: step.sub,
                  value: step.value,
                  prevValue: i > 0 ? overall[i - 1].value : null,
                  youngValue: young[i].value,
                })}>
                {/* Main trapezoid */}
                <path d={path} fill={color} opacity={opacity} />
                <path d={path} fill="none" stroke={color} strokeWidth="1" opacity="0.5" />

                {/* Drop-off red tint in the angled gap areas */}
                {dropPct > 1 && (
                  <g>
                    <path d={`M${cx - topW / 2},${yTop} L${cx - topW / 2},${yBottom} L${cx - bottomW / 2},${yBottom} Z`}
                      fill="#ff2222" opacity={dropOpacity} />
                    <path d={`M${cx + topW / 2},${yTop} L${cx + topW / 2},${yBottom} L${cx + bottomW / 2},${yBottom} Z`}
                      fill="#ff2222" opacity={dropOpacity} />
                  </g>
                )}

                {/* Step label - left side */}
                <text x={cx - topW / 2 - 10} y={yTop + stepH / 2 + 1} textAnchor="end"
                  fill="#aaaacc" fontSize="11" fontFamily="'Noto Sans KR', sans-serif" fontWeight="600">
                  {step.label}
                </text>
                <text x={cx - topW / 2 - 10} y={yTop + stepH / 2 + 14} textAnchor="end"
                  fill="#4a4a6a" fontSize="9" fontFamily="'JetBrains Mono', monospace">
                  {step.sub}
                </text>

                {/* Value label - center */}
                <text x={cx} y={yTop + stepH / 2 + 2} textAnchor="middle"
                  fill="#ffffff" fontSize="14" fontWeight="700"
                  fontFamily="'JetBrains Mono', monospace"
                  style={{ textShadow: '0 0 8px rgba(0,0,0,0.8)' }}>
                  {step.value.toFixed(1)}%
                </text>

                {/* Drop amount - right of funnel */}
                {dropPct > 1 && (
                  <text x={cx + topW / 2 + 10} y={yTop + stepH - 2} textAnchor="start"
                    fill="#ff6666" fontSize="9" fontWeight="600"
                    fontFamily="'JetBrains Mono', monospace">
                    ▼ {dropPct.toFixed(1)}%p
                  </text>
                )}

                {/* Young adult comparison bar */}
                <rect x={youngBarX} y={yTop + (stepH - youngBarH) / 2}
                  width={6} height={youngBarH}
                  fill="#ff006e" opacity="0.7" rx="2" />
                <text x={youngBarX + 12} y={yTop + stepH / 2 + 3} textAnchor="start"
                  fill="#ff006e" fontSize="9" fontWeight="600"
                  fontFamily="'JetBrains Mono', monospace">
                  {young[i].value.toFixed(1)}%
                </text>
              </g>
            );
          })}

          {/* Legend */}
          <g>
            <rect x={w - 200} y={8} width={185} height={38} rx="6"
              fill="#0d0d1aee" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
            <path d={`M${w - 192},${18} L${w - 178},${18} L${w - 180},${28} L${w - 190},${28} Z`}
              fill="#00d4ff" opacity="0.7" />
            <text x={w - 174} y={26} fill="#aaaacc" fontSize="10" fontFamily="'Noto Sans KR', sans-serif">
              30세 이상 전체
            </text>
            <rect x={w - 190} y={33} width={6} height={8} rx="2" fill="#ff006e" opacity="0.7" />
            <text x={w - 174} y={41} fill="#ff006e" fontSize="10" fontFamily="'Noto Sans KR', sans-serif">
              19-39세 청년층
            </text>
          </g>
        </svg>
        {/* Cascade click detail */}
        {cascadeDetail && (
          <div className="detail-panel" style={{
            position: 'absolute', top: 10, right: 10,
            background: '#1a1a2eee', border: '1px solid rgba(0,212,255,0.3)', borderRadius: 10,
            padding: '12px 14px', zIndex: 50, minWidth: 200, maxWidth: 260,
            maxHeight: '250px', overflowY: 'auto',
            boxShadow: '0 0 20px rgba(0,212,255,0.15)',
          }}>
            <button onClick={() => setCascadeDetail(null)} style={{
              position: 'absolute', top: 6, right: 8,
              background: 'rgba(255,255,255,0.06)', border: 'none',
              color: '#8888aa', fontSize: 14, cursor: 'pointer',
              width: 22, height: 22, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>x</button>
            <h4 style={{ color: cascadeDetail.type === 'young' ? '#ff006e' : '#00d4ff', margin: '0 0 6px', fontFamily: "'Noto Sans KR', sans-serif", fontSize: 14 }}>
              {cascadeDetail.label}
            </h4>
            <p style={{ color: '#6666aa', fontSize: 10, margin: '0 0 10px' }}>{cascadeDetail.sub}</p>
            {cascadeDetail.type === 'bar' && (
              <>
                <div className="stat-row">
                  <span className="stat-label">잔존율</span>
                  <span className="stat-value" style={{ color: '#00d4ff' }}>{cascadeDetail.value.toFixed(1)}%</span>
                </div>
                {cascadeDetail.prevValue && (
                  <div className="stat-row">
                    <span className="stat-label">이전 단계 대비 감소</span>
                    <span className="stat-value" style={{ color: '#ff6666' }}>-{(cascadeDetail.prevValue - cascadeDetail.value).toFixed(1)}%p</span>
                  </div>
                )}
                <div className="stat-row">
                  <span className="stat-label">청년층 비교</span>
                  <span className="stat-value" style={{ color: '#ff006e' }}>{cascadeDetail.youngValue.toFixed(1)}%</span>
                </div>
              </>
            )}
            {cascadeDetail.type === 'young' && (
              <>
                <div className="stat-row">
                  <span className="stat-label">청년층 (19-39세)</span>
                  <span className="stat-value" style={{ color: '#ff006e' }}>{cascadeDetail.youngValue.toFixed(1)}%</span>
                </div>
                <div className="stat-row">
                  <span className="stat-label">전체 (30세+)</span>
                  <span className="stat-value" style={{ color: '#00d4ff' }}>{cascadeDetail.overallValue.toFixed(1)}%</span>
                </div>
                <div className="stat-row">
                  <span className="stat-label">격차</span>
                  <span className="stat-value" style={{ color: '#ff6666' }}>{cascadeDetail.gap}%p</span>
                </div>
              </>
            )}
          </div>
        )}
      </div>
      <div style={{
        padding: '4px 24px 10px', fontFamily: "'JetBrains Mono', monospace",
        fontSize: 10, color: '#4a4a6a',
      }}>
        출처: KDA Diabetes Fact Sheet 2024, KNHANES 2019-2022
      </div>
    </div>
  );
}

'''

content = content[:start_idx] + new_cascade + content[end_idx:]

with open('src/pages/DiseaseNetwork.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("CascadeView replaced with funnel visualization")
