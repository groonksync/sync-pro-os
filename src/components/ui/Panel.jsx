import React from 'react';
import { useTheme } from '../../lib/theme';

/**
 * Panel base: icono + valor grande + etiqueta + infografía opcional (children).
 * Props: icon (componente lucide), label, value, hint, onClick, children, isDark
 */
export default function Panel({ icon: Icon, label, value, hint, onClick, children, isDark = true, className = '' }) {
  const t = useTheme(isDark);
  const clickable = typeof onClick === 'function';

  return (
    <div
      onClick={onClick}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={clickable ? (e) => { if (e.key === 'Enter') onClick(); } : undefined}
      className={`rounded-2xl p-4 sm:p-5 flex flex-col gap-4 min-w-0 transition-colors ${clickable ? 'cursor-pointer' : ''} ${className}`}
      style={{
        backgroundColor: t.card,
        border: `1px solid ${t.border}`,
        boxShadow: isDark ? 'none' : '0 1px 2px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.04)',
      }}
      onMouseEnter={clickable ? (e) => { e.currentTarget.style.backgroundColor = t.cardHover; } : undefined}
      onMouseLeave={clickable ? (e) => { e.currentTarget.style.backgroundColor = t.card; } : undefined}
    >
      <div className="flex items-start justify-between gap-3">
        {Icon && (
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: t.surface, color: t.textSecondary }}
          >
            <Icon size={18} strokeWidth={1.8} />
          </div>
        )}
        {hint && (
          <span
            className="text-[10px] font-medium px-2 py-0.5 rounded-full"
            style={{ backgroundColor: t.surface, color: t.textMuted }}
          >
            {hint}
          </span>
        )}
      </div>

      <div className="flex items-end justify-between gap-3 min-w-0">
        <div className="min-w-0">
          <div className="font-bold leading-none truncate" style={{ fontSize: 28, color: t.text, fontVariantNumeric: 'tabular-nums' }}>
            {value}
          </div>
          <div className="mt-1.5 text-xs font-medium truncate" style={{ color: t.textMuted }}>
            {label}
          </div>
        </div>
        {children && <div className="shrink-0">{children}</div>}
      </div>
    </div>
  );
}
