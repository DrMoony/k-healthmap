import { useRef, useEffect, useCallback } from 'react';
import { useLang } from '../i18n';

/**
 * Waterfall + Sankey hybrid cascade visualization (Canvas 2D).
 *
 * Props:
 *   title       — chart title (string)
 *   source      — data source label
 *   totalPop    — total population (number, in 만 unit)
 *   totalLabel  — label for the total bar (optional)
 *   lossLabel   — label for first loss arrow (e.g. "비해당")
 *   endLabel    — label for the final summary (e.g. "통합관리")
 *   unit        — display unit (default: 만/0K)
 *   stages      — [{ label, count, color, note, pctLabel }]
 *                  count is absolute (in same unit as totalPop)
 *                  pctLabel: optional override for the % display
 */
export default function CascadeWaterfall({
  title, source, totalPop, totalLabel, lossLabel, endLabel, unit, stages,
}) {
  const { t } = useLang();
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const u = unit || t('만', '0K');

  const allRows = [
    { label: totalLabel || t('전체 인구', 'Total Pop.'), count: totalPop, color: '#667788', note: '' },
    ...stages,
  ];

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const dpr = window.devicePixelRatio || 1;
    const W = container.clientWidth;
    const rowCount = allRows.length;
    const ROW_H = 48;
    const GAP = 28;
    const HEADER = 0;
    const FOOTER = 44;
    const H = HEADER + rowCount * ROW_H + (rowCount - 1) * GAP + FOOTER;

    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';

    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, W, H);

    const LEFT_LABEL_W = 90;
    const RIGHT_INFO_W = 110;
    const BAR_AREA_X = LEFT_LABEL_W;
    const BAR_AREA_W = W - LEFT_LABEL_W - RIGHT_INFO_W;
    const maxCount = allRows[0].count;

    const getBarWidth = (count) => Math.max((count / maxCount) * BAR_AREA_W, 24);

    // Draw each row
    allRows.forEach((row, i) => {
      const y = HEADER + i * (ROW_H + GAP);
      const barW = getBarWidth(row.count);
      const isFirst = i === 0;
      const barX = BAR_AREA_X;
      const barY = y + 8;
      const barH = ROW_H - 16;

      // ── Sankey flow connector from previous bar ──
      if (i > 0) {
        const prevRow = allRows[i - 1];
        const prevBarW = getBarWidth(prevRow.count);
        const prevY = HEADER + (i - 1) * (ROW_H + GAP);
        const prevBarBottom = prevY + 8 + (ROW_H - 16);
        const currBarTop = barY;
        const midY = (prevBarBottom + currBarTop) / 2;

        // Retained flow (left-aligned trapezoid/bezier)
        ctx.beginPath();
        ctx.moveTo(barX, prevBarBottom);
        ctx.lineTo(barX + prevBarW, prevBarBottom);
        ctx.bezierCurveTo(
          barX + prevBarW, midY,
          barX + barW, midY,
          barX + barW, currBarTop
        );
        ctx.lineTo(barX, currBarTop);
        ctx.bezierCurveTo(
          barX, midY,
          barX, midY,
          barX, prevBarBottom
        );
        ctx.closePath();

        const flowGrad = ctx.createLinearGradient(0, prevBarBottom, 0, currBarTop);
        flowGrad.addColorStop(0, (prevRow.color || '#667788') + '40');
        flowGrad.addColorStop(1, (row.color) + '40');
        ctx.fillStyle = flowGrad;
        ctx.fill();

        // Lost flow (right side — bleeds out rightward)
        const lost = prevRow.count - row.count;
        if (lost > 0) {
          const lostFrac = lost / prevRow.count;
          const spillW = Math.max(lostFrac * 60, 20);

          ctx.beginPath();
          ctx.moveTo(barX + barW, currBarTop);
          ctx.lineTo(barX + prevBarW, prevBarBottom);
          ctx.lineTo(barX + prevBarW + spillW, prevBarBottom + 2);
          ctx.bezierCurveTo(
            barX + prevBarW + spillW, midY,
            barX + barW + spillW * 0.6, midY + 4,
            barX + barW + spillW * 0.3, currBarTop + 2
          );
          ctx.closePath();

          const lostGrad = ctx.createLinearGradient(barX + barW, prevBarBottom, barX + prevBarW + spillW, currBarTop);
          lostGrad.addColorStop(0, '#ff6b6b40');
          lostGrad.addColorStop(1, '#ff6b6b08');
          ctx.fillStyle = lostGrad;
          ctx.fill();

          // Loss label
          const lostPct = Math.round((lost / prevRow.count) * 100);
          const lossLabelText = i === 1
            ? `▼ -${lost.toLocaleString()}${u} (${lostPct}% ${lossLabel || t('비해당', 'unaffected')})`
            : `▼ -${lost.toLocaleString()}${u} (${lostPct}% ${t('이탈', 'lost')})`;

          ctx.font = '11px "JetBrains Mono", monospace';
          ctx.fillStyle = '#ff6b6baa';
          ctx.textAlign = 'center';
          ctx.fillText(lossLabelText, barX + (prevBarW + barW) / 2, midY + 4);
        }
      }

      // ── Bar ──
      const grad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
      if (isFirst) {
        grad.addColorStop(0, 'rgba(255,255,255,0.06)');
        grad.addColorStop(1, 'rgba(255,255,255,0.02)');
      } else {
        grad.addColorStop(0, row.color + 'cc');
        grad.addColorStop(1, row.color + '55');
      }

      // Rounded rect
      const r = 5;
      ctx.beginPath();
      ctx.moveTo(barX + r, barY);
      ctx.lineTo(barX + barW - r, barY);
      ctx.quadraticCurveTo(barX + barW, barY, barX + barW, barY + r);
      ctx.lineTo(barX + barW, barY + barH - r);
      ctx.quadraticCurveTo(barX + barW, barY + barH, barX + barW - r, barY + barH);
      ctx.lineTo(barX + r, barY + barH);
      ctx.quadraticCurveTo(barX, barY + barH, barX, barY + barH - r);
      ctx.lineTo(barX, barY + r);
      ctx.quadraticCurveTo(barX, barY, barX + r, barY);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();

      // Bar border
      ctx.strokeStyle = isFirst ? 'rgba(255,255,255,0.12)' : row.color + '55';
      ctx.lineWidth = 1;
      ctx.stroke();

      // ── Count text inside bar ──
      ctx.font = 'bold 14px "JetBrains Mono", monospace';
      ctx.fillStyle = isFirst ? '#aaaacc' : '#fff';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      const countText = row.count.toLocaleString() + u;
      const textX = barW > 120 ? barX + 12 : barX + 6;
      ctx.shadowColor = isFirst ? 'transparent' : 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = isFirst ? 0 : 3;
      ctx.fillText(countText, textX, barY + barH / 2);
      ctx.shadowBlur = 0;

      // ── Left label ──
      ctx.font = 'bold 12px "Noto Sans KR", sans-serif';
      ctx.fillStyle = isFirst ? '#999' : row.color;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(row.label, LEFT_LABEL_W - 12, barY + barH / 2);

      // ── Right info: percentage + note ──
      if (!isFirst) {
        const pctOfFirst = (row.count / stages[0].count) * 100;
        const pctText = row.pctLabel || (pctOfFirst >= 1 ? pctOfFirst.toFixed(0) + '%' : pctOfFirst.toFixed(1) + '%');

        ctx.font = 'bold 14px "JetBrains Mono", monospace';
        ctx.fillStyle = row.color;
        ctx.textAlign = 'left';
        ctx.fillText(pctText, BAR_AREA_X + BAR_AREA_W + 14, barY + barH / 2 - (row.note ? 6 : 0));

        if (row.note) {
          ctx.font = '9px "Noto Sans KR", sans-serif';
          ctx.fillStyle = '#9999bb';
          ctx.fillText(row.note, BAR_AREA_X + BAR_AREA_W + 14, barY + barH / 2 + 10);
        }
      }
    });

    // ── Footer summary ──
    const footerY = HEADER + rowCount * ROW_H + (rowCount - 1) * GAP + 12;
    const lastStage = stages[stages.length - 1];
    const totalLost = stages[0].count - lastStage.count;
    const lostPctTotal = Math.round((totalLost / stages[0].count) * 100);
    const reachedPct = (lastStage.count / stages[0].count * 100);
    const reachedPctStr = reachedPct >= 1 ? Math.round(reachedPct) + '%' : reachedPct.toFixed(1) + '%';

    ctx.font = '11px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';

    // Lost summary
    ctx.fillStyle = '#ff6b6b';
    ctx.fillText(
      `${t('이탈', 'Lost')} ${totalLost.toLocaleString()}${u} (${lostPctTotal}%)`,
      W / 2 - 100, footerY
    );

    // Reached summary
    ctx.fillStyle = lastStage.color;
    ctx.fillText(
      `${endLabel || t('도달', 'Reached')} ${lastStage.count.toLocaleString()}${u} (${reachedPctStr})`,
      W / 2 + 100, footerY
    );
  }, [allRows, stages, t, u, lossLabel, endLabel]);

  useEffect(() => {
    draw();
    const handleResize = () => draw();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [draw]);

  return (
    <div
      ref={containerRef}
      style={{
        marginTop: '16px',
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '12px',
        padding: '16px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <span style={{ fontSize: '14px', fontWeight: 700, color: '#e8e8f0', fontFamily: "'Noto Sans KR'" }}>{title}</span>
        <span style={{ fontSize: '9px', color: '#9999bb' }}>{source}</span>
      </div>
      <canvas ref={canvasRef} style={{ display: 'block' }} />
    </div>
  );
}
