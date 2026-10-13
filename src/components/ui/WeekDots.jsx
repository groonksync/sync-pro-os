import React from 'react';

/**
 * Línea de 7 días minimalista con círculos o píldoras activas
 * days: [{ diaNom: string, diaNum?: number | string, hasEvents?: boolean, count?: number, isToday?: boolean, isSelected?: boolean }]
 * onSelectDay?: (index: number) => void
 */
export default function WeekDots({
  days = [],
  onSelectDay,
  isDark = true,
  variant = 'compact', // 'compact' (como escritorio) o 'calendar' (como móvil)
}) {
  const activeBg = isDark ? '#FFFFFF' : '#111827';
  const inactiveDot = isDark ? '#3A3A40' : '#D1D5DB';
  const textMuted = isDark ? '#9CA3AF' : '#6B7280';
  const textMain = isDark ? '#F3F4F6' : '#111827';

  // Si no hay días pasados, generamos 7 días por defecto
  const items = days.length === 7 ? days : [
    { diaNom: 'Lun', diaNum: 11, hasEvents: true },
    { diaNom: 'Mar', diaNum: 12, hasEvents: true },
    { diaNom: 'Mié', diaNum: 13, hasEvents: true, isSelected: true },
    { diaNom: 'Jue', diaNum: 14, hasEvents: false },
    { diaNom: 'Vie', diaNum: 15, hasEvents: true },
    { diaNom: 'Sáb', diaNum: 16, hasEvents: false },
    { diaNom: 'Dom', diaNum: 17, hasEvents: false },
  ];

  return (
    <div className="flex items-center justify-between gap-1 w-full select-none">
      {items.map((d, idx) => {
        const isSelected = !!d.isSelected;
        const hasEvents = d.hasEvents || (d.count && d.count > 0);
        const isClickable = typeof onSelectDay === 'function';

        return (
          <button
            key={idx}
            type="button"
            onClick={() => isClickable && onSelectDay(idx)}
            className={`flex flex-col items-center justify-center transition-all ${
              isSelected
                ? 'px-2 py-1.5 rounded-xl border'
                : 'px-1.5 py-1 rounded-lg hover:bg-neutral-500/10'
            }`}
            style={{
              backgroundColor: isSelected
                ? isDark
                  ? 'rgba(255, 255, 255, 0.12)'
                  : 'rgba(0, 0, 0, 0.08)'
                : 'transparent',
              borderColor: isSelected
                ? isDark
                  ? 'rgba(255, 255, 255, 0.25)'
                  : 'rgba(0, 0, 0, 0.15)'
                : 'transparent',
              cursor: isClickable ? 'pointer' : 'default',
            }}
          >
            {/* Nombre del día */}
            <span
              className="text-[9px] font-semibold uppercase tracking-wider mb-1 block leading-none"
              style={{ color: isSelected ? textMain : textMuted }}
            >
              {d.diaNom}
            </span>

            {/* Número del día si está disponible */}
            {d.diaNum != null ? (
              <span
                className="text-xs font-bold leading-none mb-1 block"
                style={{ color: isSelected ? textMain : textMuted }}
              >
                {d.diaNum}
              </span>
            ) : null}

            {/* Punto indicador */}
            <div
              className="rounded-full transition-all"
              style={{
                width: isSelected ? 8 : (hasEvents ? 7 : 5),
                height: isSelected ? 8 : (hasEvents ? 7 : 5),
                backgroundColor: isSelected
                  ? activeBg
                  : hasEvents
                  ? (isDark ? '#E5E7EB' : '#374151')
                  : inactiveDot,
                opacity: hasEvents || isSelected ? 1 : 0.45,
              }}
            />
          </button>
        );
      })}
    </div>
  );
}
