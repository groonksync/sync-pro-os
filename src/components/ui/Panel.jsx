import React from 'react';
import { useTheme } from '../../lib/theme';

/**
 * Panel ejecutivo minimalista en tonos grises idéntico a las propuestas conceptuales.
 * Props:
 * - icon: Componente Lucide
 * - value: string | number (Número gigante)
 * - label: string (Título/Etiqueta bajo el número)
 * - badge: string (Chip superior derecho, ej. '• Status', '• 11 pendientes')
 * - action: ReactNode (Botón de acción rápida opcional)
 * - children: ReactNode (Infografía o contenido visual central/derecho)
 * - footer: ReactNode (Desglose o bullets inferiores opcionales)
 * - isDark: boolean
 * - onClick: () => void
 */
export default function Panel({
  icon: Icon,
  value,
  label,
  badge,
  action,
  children,
  footer,
  isDark = true,
  onClick,
  className = '',
}) {
  const t = useTheme(isDark);
  const clickable = typeof onClick === 'function';

  return (
    <div
      onClick={onClick}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={clickable ? (e) => { if (e.key === 'Enter') onClick(); } : undefined}
      className={`rounded-3xl p-6 sm:p-7 flex flex-col justify-between transition-all duration-200 border ${
        clickable ? 'cursor-pointer hover:scale-[1.01] active:scale-[0.99]' : ''
      } ${className}`}
      style={{
        backgroundColor: isDark ? '#1E1E22' : '#FFFFFF',
        borderColor: isDark ? 'rgba(255, 255, 255, 0.07)' : 'rgba(0, 0, 0, 0.07)',
        boxShadow: isDark
          ? '0 8px 30px rgba(0, 0, 0, 0.25)'
          : '0 4px 24px rgba(0, 0, 0, 0.04)',
      }}
    >
      {/* ── CABECERA SUPERIOR: ICONO + BADGE / ACCIÓN ── */}
      <div className="flex items-center justify-between gap-3 mb-4">
        {Icon ? (
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center border transition-colors shrink-0"
            style={{
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
              color: isDark ? '#F3F4F6' : '#111827',
            }}
          >
            <Icon size={20} strokeWidth={1.8} />
          </div>
        ) : <div />}

        <div className="flex items-center gap-2">
          {badge && (
            <span
              className="text-[11px] font-medium px-2.5 py-1 rounded-full border flex items-center gap-1.5"
              style={{
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
                color: isDark ? '#9CA3AF' : '#6B7280',
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: isDark ? '#E5E7EB' : '#374151' }}
              />
              {badge}
            </span>
          )}
          {action}
        </div>
      </div>

      {/* ── CUERPO PRINCIPAL: NÚMERO GIGANTE + INFOGRAFÍA ── */}
      <div className="flex items-end justify-between gap-4 my-auto">
        <div className="min-w-0 flex-1">
          {value != null && (
            <div
              className="font-extrabold tracking-tight leading-none truncate"
              style={{
                fontSize: 'clamp(28px, 3.5vw, 36px)',
                color: isDark ? '#FFFFFF' : '#111827',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {value}
            </div>
          )}
          {label && (
            <div
              className="mt-1.5 text-xs font-semibold uppercase tracking-wider truncate"
              style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}
            >
              {label}
            </div>
          )}
        </div>

        {children && <div className="shrink-0">{children}</div>}
      </div>

      {/* ── PIE DEL PANEL (BULLETS O DESGLOSE) ── */}
      {footer && <div className="mt-5 pt-4 border-t" style={{ borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)' }}>{footer}</div>}
    </div>
  );
}
