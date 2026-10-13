import React from 'react';

/**
 * Barras horizontales de progreso limpias idénticas a las tarjetas conceptuales
 * items: [{ label: string, value: number, max?: number, displayValue?: string, color?: string }]
 * scaleMarks?: string[] (ej. ['0', '30', '60', '130'])
 */
export default function SegBar({
  items = [],
  scaleMarks = null,
  height = 7,
  isDark = true,
  barWidth = 'flex-1',
}) {
  const globalMax = Math.max(1, ...items.map((i) => Number(i.max) || Number(i.value) || 0));
  const trackBg = isDark ? '#26262B' : '#E5E7EB';
  const defaultFill = isDark ? '#D1D5DB' : '#374151';
  const textMuted = isDark ? '#9CA3AF' : '#6B7280';
  const textValue = isDark ? '#F3F4F6' : '#111827';

  return (
    <div className="flex flex-col gap-2.5 w-full">
      {items.map((it, idx) => {
        const max = Number(it.max) || globalMax;
        const pct = Math.max(0, Math.min(100, ((Number(it.value) || 0) / max) * 100));
        const fillColor = it.color || (idx === 0 ? defaultFill : (isDark ? '#6B7280' : '#9CA3AF'));

        return (
          <div key={idx} className="flex items-center justify-between gap-3 text-xs">
            {it.label && (
              <span
                className="w-20 sm:w-24 text-[11px] font-medium truncate text-left shrink-0"
                style={{ color: textMuted }}
                title={it.label}
              >
                {it.label}
              </span>
            )}

            <div
              className={`${barWidth} rounded-full overflow-hidden`}
              style={{ height, backgroundColor: trackBg }}
            >
              <div
                className="h-full rounded-full transition-all duration-500 ease-out"
                style={{ width: `${pct}%`, backgroundColor: fillColor }}
              />
            </div>

            {it.displayValue != null ? (
              <span
                className="font-mono text-[11px] font-bold shrink-0 text-right w-12 sm:w-14"
                style={{ color: textValue }}
              >
                {it.displayValue}
              </span>
            ) : null}
          </div>
        );
      })}

      {/* Escala numérica horizontal inferior opcional */}
      {Array.isArray(scaleMarks) && scaleMarks.length > 0 && (
        <div
          className="flex justify-between items-center pt-1 text-[9px] font-mono px-1"
          style={{ color: textMuted }}
        >
          {scaleMarks.map((mark, i) => (
            <span key={i}>{mark}</span>
          ))}
        </div>
      )}
    </div>
  );
}
