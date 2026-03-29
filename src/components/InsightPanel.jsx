import { useState } from 'react';
import { useLang } from '../i18n';

/**
 * Clickable chart wrapper with expandable insight panel.
 *
 * Props:
 *   title     — chart title (string)
 *   source    — data source label + URL
 *   sourceUrl — link for source badge
 *   insight   — { ko, en } — pre-written inference text
 *   details   — [{ label, value, unit }] — drill-down data points (optional)
 *   children  — the chart content (SVG, Canvas, etc.)
 *   defaultOpen — start expanded (default: false)
 */
export default function InsightPanel({
  title, source, sourceUrl, insight, details, children, defaultOpen = false,
}) {
  const { t, lang } = useLang();
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: `1px solid rgba(255,255,255,${open ? '0.12' : '0.06'})`,
        borderRadius: '12px',
        padding: '20px',
        cursor: 'pointer',
        transition: 'border-color 0.3s',
      }}
      onClick={() => setOpen(v => !v)}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', margin: '0 0 14px' }}>
        <h3 style={{ fontSize: '13px', color: '#fff', margin: 0, fontFamily: "'Noto Sans KR'" }}>
          {title}
        </h3>
        {sourceUrl ? (
          <a href={sourceUrl} target="_blank" rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            style={{ fontSize: '8px', color: '#00d4ff88', textDecoration: 'none', whiteSpace: 'nowrap' }}>
            📎 {source}
          </a>
        ) : source ? (
          <span style={{ fontSize: '8px', color: '#00d4ff66' }}>📎 {source}</span>
        ) : null}
        <span style={{
          marginLeft: 'auto', fontSize: '10px', color: '#9999bb',
          transition: 'transform 0.3s',
          transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          display: 'inline-block',
        }}>▼</span>
      </div>

      {/* Chart content */}
      <div>{children}</div>

      {/* Expandable insight area */}
      <div style={{
        maxHeight: open ? '500px' : '0px',
        overflow: 'hidden',
        transition: 'max-height 0.4s ease, opacity 0.3s ease',
        opacity: open ? 1 : 0,
      }}>
        <div style={{
          marginTop: '14px',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          paddingTop: '12px',
        }}>
          {/* Details row */}
          {details && details.length > 0 && (
            <div style={{
              display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '10px',
            }}>
              {details.map((d, i) => (
                <div key={i} style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '8px',
                  padding: '6px 10px',
                  minWidth: '80px',
                }}>
                  <div style={{ fontSize: '9px', color: '#9999bb' }}>{d.label}</div>
                  <div style={{
                    fontSize: '14px', fontWeight: 700, color: d.color || '#e8e8f0',
                    fontFamily: "'JetBrains Mono'",
                  }}>
                    {d.value}<span style={{ fontSize: '10px', fontWeight: 400, color: '#9999bb' }}>{d.unit || ''}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Insight text */}
          {insight && (
            <div style={{
              display: 'flex', gap: '8px', alignItems: 'flex-start',
              background: 'rgba(0,212,255,0.04)',
              border: '1px solid rgba(0,212,255,0.12)',
              borderRadius: '8px',
              padding: '10px 12px',
            }}>
              <span style={{ fontSize: '14px', lineHeight: '18px', flexShrink: 0 }}>💡</span>
              <div style={{
                fontSize: '11px', color: '#ccc', lineHeight: 1.6,
                fontFamily: "'Noto Sans KR'",
              }}>
                {lang === 'ko' ? insight.ko : insight.en}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
