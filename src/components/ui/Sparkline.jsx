import React from 'react';

/** Línea de tendencia. points: number[] (mínimo 2) */
export default function Sparkline({ points = [], width = 120, height = 40, isDark = true }) {
  const data = points.map((n) => Number(n) || 0);
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pad = 3;
  const step = (width - pad * 2) / (data.length - 1);
  const coords = data.map((v, i) => [pad + i * step, height - pad - ((v - min) / range) * (height - pad * 2)]);
  const line = coords.map(([x, y]) => `${x},${y}`).join(' ');
  const area = `${pad},${height} ${line} ${width - pad},${height}`;
  const color = isDark ? '#A0A0A6' : '#6A6A70';
  const gid = `spark-${isDark ? 'd' : 'l'}-${data.length}`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#${gid})`} />
      <polyline points={line} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
