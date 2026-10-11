import React from 'react';

// Escalas de grises para gráficos (índice 0 = más destacado)
const SCALE_DARK = ['#E8E8EA', '#A0A0A6', '#6A6A70', '#45454A'];
const SCALE_LIGHT = ['#1C1C1E', '#6A6A70', '#A0A0A6', '#D0D0D4'];

export const chartScale = (isDark) => (isDark ? SCALE_DARK : SCALE_LIGHT);

/** Dona SVG. segments: [{ value, label }] */
export default function Donut({ segments = [], size = 96, thickness = 12, centerLabel, isDark = true }) {
  const scale = chartScale(isDark);
  const total = segments.reduce((s, x) => s + (Number(x.value) || 0), 0);
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const track = isDark ? '#2A2A2E' : '#EAEAEC';
  let offset = 0;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={thickness} />
        {total > 0 && segments.map((seg, i) => {
          const val = Number(seg.value) || 0;
          if (val <= 0) return null;
          const len = (val / total) * c;
          const el = (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={scale[i % scale.length]}
              strokeWidth={thickness}
              strokeDasharray={`${Math.max(len - 2, 0)} ${c - Math.max(len - 2, 0)}`}
              strokeDashoffset={-offset}
            />
          );
          offset += len;
          return el;
        })}
      </svg>
      {centerLabel != null && (
        <div
          className="absolute inset-0 flex items-center justify-center text-xs font-bold"
          style={{ color: isDark ? '#E8E8EA' : '#1C1C1E' }}
        >
          {centerLabel}
        </div>
      )}
    </div>
  );
}
