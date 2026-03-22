import re

with open('src/pages/ExamDetail.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Remove CHART_HEIGHT constant
content = content.replace(
    "  // Chart height — FIXED, never shrinks\n  const CHART_HEIGHT = 340;\n",
    ""
)

# 2. Replace all height={CHART_HEIGHT} with height={'100%'}
# Actually we need to remove the height prop entirely so charts use container height
# But the canvas charts need a numeric height. Let's make them use 100% of container.
# We need to replace height={CHART_HEIGHT} occurrences - remove them so default is used
# Actually better: pass a large value and let container clip, or make charts responsive.
# The charts already have containerRef with ResizeObserver for width. Let's also observe height.

# For AbnormalBarChart: add height observation
old_abnormal_resize = """  useEffect(() => {
    const ro = new ResizeObserver(entries => {
      for (const entry of entries) setCanvasWidth(Math.floor(entry.contentRect.width));
    });
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // Compute sorted data"""

new_abnormal_resize = """  useEffect(() => {
    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        setCanvasWidth(Math.floor(entry.contentRect.width));
        setCanvasHeight(Math.floor(entry.contentRect.height));
      }
    });
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // Compute sorted data"""

# But first we need to add the state. Let's find the state declarations.
# AbnormalBarChart
old_abnormal_state = "  const [canvasWidth, setCanvasWidth] = useState(600);\n  const [tooltip, setTooltip] = useState(null);"
new_abnormal_state = "  const [canvasWidth, setCanvasWidth] = useState(600);\n  const [canvasHeight, setCanvasHeight] = useState(400);\n  const [tooltip, setTooltip] = useState(null);"

content = content.replace(old_abnormal_state, new_abnormal_state, 1)
content = content.replace(old_abnormal_resize, new_abnormal_resize, 1)

# StackedBarChart - same pattern but it appears second
old_stacked_state = "  const [tooltip, setTooltip] = useState(null);\n  const [canvasWidth, setCanvasWidth] = useState(600);"
new_stacked_state = "  const [tooltip, setTooltip] = useState(null);\n  const [canvasWidth, setCanvasWidth] = useState(600);\n  const [canvasHeight, setCanvasHeight] = useState(400);"

content = content.replace(old_stacked_state, new_stacked_state, 1)

# StackedBarChart resize observer
old_stacked_resize = """  useEffect(() => {
    const ro = new ResizeObserver(entries => {
      for (const entry of entries) setCanvasWidth(Math.floor(entry.contentRect.width));
    });
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const draw = useCallback"""

new_stacked_resize = """  useEffect(() => {
    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        setCanvasWidth(Math.floor(entry.contentRect.width));
        setCanvasHeight(Math.floor(entry.contentRect.height));
      }
    });
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const draw = useCallback"""

content = content.replace(old_stacked_resize, new_stacked_resize, 1)

# Now in AbnormalBarChart, replace usage of `height` with `canvasHeight` for the actual drawing
# The draw function uses `const h = height;` — change to use canvasHeight when available
# Actually the charts use the height prop for canvas.style.height and for drawing.
# Let's change the approach: use Math.max(canvasHeight, 200) as the effective height

# In AbnormalBarChart's draw:
content = content.replace(
    "    const h = height;\n    canvas.width = w * dpr;\n    canvas.height = h * dpr;\n    canvas.style.width = w + 'px';\n    canvas.style.height = h + 'px';",
    "    const h = Math.max(canvasHeight, 200);\n    canvas.width = w * dpr;\n    canvas.height = h * dpr;\n    canvas.style.width = w + 'px';\n    canvas.style.height = h + 'px';",
    1
)

# In StackedBarChart's draw:
content = content.replace(
    "    const w = canvasWidth;\n    const h = height;\n    canvas.width = w * dpr;\n    canvas.height = h * dpr;\n    canvas.style.width = w + 'px';\n    canvas.style.height = h + 'px';",
    "    const w = canvasWidth;\n    const h = Math.max(canvasHeight, 200);\n    canvas.width = w * dpr;\n    canvas.height = h * dpr;\n    canvas.style.width = w + 'px';\n    canvas.style.height = h + 'px';",
    1
)

# Update draw dependency arrays to include canvasHeight instead of height
content = content.replace(
    "], [sortedData, canvasWidth, height, maxRate, nationalAvg, tooltip, onBarClick]);",
    "], [sortedData, canvasWidth, canvasHeight, maxRate, nationalAvg, tooltip, onBarClick]);",
    1
)

# For StackedBarChart dependency - find the right one
# Let me check what deps look like
# Actually let me be more careful. Let me check the actual dep arrays.

# AbnormalBarChart container style - make it fill height
content = content.replace(
    '    <div ref={containerRef} style={{ position: \'relative\', width: \'100%\' }}>\n      <canvas\n        ref={canvasRef}\n        style={{ width: \'100%\', height, display: \'block\', cursor: \'crosshair\' }}',
    '    <div ref={containerRef} style={{ position: \'relative\', width: \'100%\', height: \'100%\' }}>\n      <canvas\n        ref={canvasRef}\n        style={{ width: \'100%\', height: \'100%\', display: \'block\', cursor: \'crosshair\' }}',
    1
)

# StackedBarChart container style
content = content.replace(
    '    <div ref={containerRef} style={{ position: \'relative\', width: \'100%\' }}>\n      <canvas\n        ref={canvasRef}\n        style={{ width: \'100%\', height, display: \'block\', cursor: \'crosshair\' }}',
    '    <div ref={containerRef} style={{ position: \'relative\', width: \'100%\', height: \'100%\' }}>\n      <canvas\n        ref={canvasRef}\n        style={{ width: \'100%\', height: \'100%\', display: \'block\', cursor: \'crosshair\' }}',
    1
)

# Remove height={CHART_HEIGHT} from all chart usages (4 occurrences)
content = content.replace('\n              height={CHART_HEIGHT}\n', '\n')
content = content.replace('\n                height={CHART_HEIGHT}\n', '\n')

# 3. Change grid layout
content = content.replace(
    "      gridTemplateColumns: '1fr 1fr 320px',\n      gridTemplateRows: 'auto 1fr',",
    "      gridTemplateColumns: '1fr 1fr',\n      gridTemplateRows: 'auto 1fr auto',"
)

# 4. Restructure Analysis Panel section - change from Col 3 to full-width bottom row
old_analysis = """      {/* ─── Analysis Panel (Col 3) ────────────────────────────────── */}
      <Panel style={{ minHeight: 0, overflow: 'hidden' }}>
        <div style={{ fontSize: 12, fontWeight: 700, fontFamily: 'Noto Sans KR', ...glowStyle(NEON.bodyText), marginBottom: 6, flexShrink: 0 }}>
          분석 패널
        </div>
        <AnalysisPanel"""

new_analysis = """      {/* ─── Analysis Panel (Bottom Row, Full Width) ──────────────── */}
      <Panel style={{ gridColumn: '1 / -1', maxHeight: 200, overflow: 'hidden' }}>
        <div style={{ fontSize: 12, fontWeight: 700, fontFamily: 'Noto Sans KR', ...glowStyle(NEON.bodyText), marginBottom: 6, flexShrink: 0 }}>
          분석 패널
        </div>
        <AnalysisPanel"""

content = content.replace(old_analysis, new_analysis)

# 5. Now change AnalysisPanel to horizontal layout
old_analysis_layout = """    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      height: '100%',
      overflowY: 'auto',
      overflowX: 'hidden',
      paddingRight: 2,
      /* custom scrollbar */
    }}>
      {/* KPI Cards */}
      {hasAbnormal && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, flexShrink: 0 }}>"""

new_analysis_layout = """    <div style={{
      display: 'flex',
      flexDirection: 'row',
      gap: 12,
      height: '100%',
      overflowX: 'auto',
      overflowY: 'hidden',
      paddingBottom: 2,
    }}>
      {/* KPI Cards - Left Section */}
      {hasAbnormal && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: 4, flexShrink: 0, minWidth: 240 }}>"""

content = content.replace(old_analysis_layout, new_analysis_layout)

# Wrap the "Selected Detail" and "Disease Correlation" sections in a middle container
# Find the selected detail section
old_middle_start = """      {/* Selected Detail */}
      {selLabel && hasAbnormal && ("""
new_middle_start = """      {/* Middle Section: Selected Detail + Disease Correlations */}
      <div style={{ flex: 1, minWidth: 200, display: 'flex', flexDirection: 'row', gap: 10, overflowX: 'auto' }}>
      {selLabel && hasAbnormal && ("""

content = content.replace(old_middle_start, new_middle_start)

# Find clinical threshold reference and wrap the close of middle section after disease correlation
old_clinical = """      {/* Clinical Threshold Reference */}
      {examData.ref && ("""
new_clinical = """      </div>
      {/* Right Section: Clinical Threshold Reference */}
      {examData.ref && ("""

content = content.replace(old_clinical, new_clinical)

# Make the clinical ref section not column but constrained width
old_clinical_style = """        <div style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 8,
          padding: '6px 8px',
          flexShrink: 0,
        }}>"""
new_clinical_style = """        <div style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 8,
          padding: '6px 8px',
          flexShrink: 0,
          minWidth: 200,
          maxWidth: 260,
          overflowY: 'auto',
        }}>"""

content = content.replace(old_clinical_style, new_clinical_style, 1)

# Make the selected detail section have constrained width for horizontal layout
old_sel_style = """        <div style={{
          background: 'rgba(10,10,20,0.92)',
          border: `1px solid ${hexToRgba(NEON.cyan, 0.25)}`,
          borderRadius: 10,
          padding: '8px 10px',
          flexShrink: 0,
        }}>"""
new_sel_style = """        <div style={{
          background: 'rgba(10,10,20,0.92)',
          border: `1px solid ${hexToRgba(NEON.cyan, 0.25)}`,
          borderRadius: 10,
          padding: '8px 10px',
          flexShrink: 0,
          minWidth: 220,
          maxWidth: 300,
          overflowY: 'auto',
        }}>"""

content = content.replace(old_sel_style, new_sel_style, 1)

# No selection hint - put it in the middle section
old_no_sel = """      {/* No selection hint */}
      {!selLabel && hasAbnormal && (
        <div style={{
          fontSize: 10, color: NEON.dimText, textAlign: 'center',
          padding: '12px 8px', lineHeight: 1.5,
          border: `1px dashed rgba(255,255,255,0.08)`,
          borderRadius: 8,
        }}>
          차트에서 시도 또는 연령대를 클릭하면<br />상세 분석이 여기에 표시됩니다
        </div>
      )}"""

new_no_sel = """      {/* No selection hint */}
      {!selLabel && hasAbnormal && (
        <div style={{
          fontSize: 10, color: NEON.dimText, textAlign: 'center',
          padding: '12px 8px', lineHeight: 1.5,
          border: `1px dashed rgba(255,255,255,0.08)`,
          borderRadius: 8,
          alignSelf: 'center',
          minWidth: 180,
        }}>
          차트에서 시도 또는 연령대를 클릭하면<br />상세 분석이 여기에 표시됩니다
        </div>
      )}"""

content = content.replace(old_no_sel, new_no_sel)

with open('src/pages/ExamDetail.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("ExamDetail layout updated")
