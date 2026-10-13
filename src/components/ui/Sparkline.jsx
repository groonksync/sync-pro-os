import React from 'react';

/**
 * Curva de onda suave Bézier minimalista con gradiente suave
 * points: number[] (mínimo 2)
 * showDots: boolean
 */
export default function Sparkline({
  points = [20, 25, 18, 30, 28, 35, 42],
  width = 160,
  height = 56,
  isDark = true,
  showDots = false,
  strokeWidth = 2.2,
}) {
  const data = points.map((n) => Number(n) || 0);
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const padX = 6;
  const padY = 8;
  const step = (width - padX * 2) / (data.length - 1);

  // Coordenadas normalizadas
  const coords = data.map((v, i) => [
    padX + i * step,
    height - padY - ((v - min) / range) * (height - padY * 2),
  ]);

  // Generar curva suave Bezier cúbica
  const bezierCommand = (point, i, a) => {
    // Control point calculation
    const [cpsX, cpsY] = controlPoint(a[i - 1], a[i - 2], point);
    const [cpeX, cpeY] = controlPoint(point, a[i - 1], a[i + 1], true);
    return `C ${cpsX.toFixed(1)},${cpsY.toFixed(1)} ${cpeX.toFixed(1)},${cpeY.toFixed(1)} ${point[0].toFixed(1)},${point[1].toFixed(1)}`;
  };

  const controlPoint = (current, previous, next, reverse) => {
    const p = previous || current;
    const n = next || current;
    const smoothing = 0.2;
    const oppLength = Math.hypot(n[0] - p[0], n[1] - p[1]);
    const oppAngle = Math.atan2(n[1] - p[1], n[0] - p[0]) + (reverse ? Math.PI : 0);
    const length = oppLength * smoothing;
    const x = current[0] + Math.cos(oppAngle) * length;
    const y = current[1] + Math.sin(oppAngle) * length;
    return [x, y];
  };

  const dPath = coords.reduce(
    (acc, point, i, a) => (i === 0 ? `M ${point[0].toFixed(1)},${point[1].toFixed(1)}` : `${acc} ${bezierCommand(point, i, a)}`),
    ''
  );

  const fillPath = `${dPath} L ${coords[coords.length - 1][0].toFixed(1)},${height} L ${coords[0][0].toFixed(1)},${height} Z`;

  const lineColor = isDark ? '#E5E7EB' : '#1F2937';
  const fillStart = isDark ? 'rgba(255, 255, 255, 0.22)' : 'rgba(0, 0, 0, 0.12)';
  const gradId = `spark-bezier-${isDark ? 'dark' : 'light'}-${Math.round(data[0] || 0)}`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible" aria-hidden="true">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={lineColor} stopOpacity={isDark ? 0.35 : 0.2} />
          <stop offset="100%" stopColor={lineColor} stopOpacity={0} />
        </linearGradient>
      </defs>
      {/* Área degradada */}
      <path d={fillPath} fill={`url(#${gradId})`} />
      {/* Línea curva suave */}
      <path d={dPath} fill="none" stroke={lineColor} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      {/* Puntos en los nodos si showDots es true */}
      {showDots &&
        coords.map(([cx, cy], idx) => (
          <circle
            key={idx}
            cx={cx}
            cy={cy}
            r={3}
            fill={isDark ? '#FFFFFF' : '#111827'}
            stroke={isDark ? '#1E1E22' : '#FFFFFF'}
            strokeWidth={1.5}
          />
        ))}
    </svg>
  );
}
