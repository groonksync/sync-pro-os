import React from 'react';
import { useTheme } from '../../lib/theme';

/** Barras horizontales finas. items: [{ label, value, max? }] */
export default function SegBar({ items = [], isDark = true }) {
  const t = useTheme(isDark);
  const globalMax = Math.max(1, ...items.map((i) => Number(i.max) || Number(i.value) || 0));
  const fill = isDark ? '#A0A0A6' : '#6A6A70';

  return (
    <div className="flex flex-col gap-2 w-full min-w-[110px]">
      {items.map((it, idx) => {
        const max = Number(it.max) || globalMax;
        const pct = Math.max(0, Math.min(100, ((Number(it.value) || 0) / max) * 100));
        return (
          <div key={idx} className="flex items-center gap-2">
            <span className="text-[10px] w-14 truncate" style={{ color: t.textMuted }}>{it.label}</span>
            <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: t.surface }}>
              <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: fill }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
