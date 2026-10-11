import React from 'react';
import { useTheme } from '../../lib/theme';

/** Punto de 7 días. days: [{ label, count }] */
export default function WeekDots({ days = [], isDark = true }) {
  const t = useTheme(isDark);
  const on = isDark ? '#E8E8EA' : '#1C1C1E';

  return (
    <div className="flex items-end gap-2">
      {days.map((d, i) => (
        <div key={i} className="flex flex-col items-center gap-1.5">
          <div
            className="rounded-full"
            style={{
              width: 10,
              height: 10,
              backgroundColor: d.count > 0 ? on : t.surface,
              border: d.count > 0 ? 'none' : `1px solid ${t.border}`,
            }}
            title={d.count > 0 ? `${d.count} evento(s)` : 'Sin eventos'}
          />
          <span className="text-[9px]" style={{ color: t.textMuted }}>{d.label}</span>
        </div>
      ))}
    </div>
  );
}
