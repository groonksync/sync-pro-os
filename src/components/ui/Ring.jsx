import React from 'react';

/** Anillo de progreso. percent: 0-100 */
export default function Ring({ percent = 0, size = 48, stroke = 5, label, isDark = true }) {
  const p = Math.max(0, Math.min(100, Number(percent) || 0));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const track = isDark ? '#2A2A2E' : '#EAEAEC';
  const color = isDark ? '#E8E8EA' : '#1C1C1E';

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${(p / 100) * c} ${c}`}
        />
      </svg>
      <div
        className="absolute inset-0 flex items-center justify-center font-bold"
        style={{ fontSize: Math.max(9, size / 4.2), color }}
      >
        {label != null ? label : `${Math.round(p)}%`}
      </div>
    </div>
  );
}
