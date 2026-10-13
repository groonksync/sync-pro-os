import React from 'react';

// Escala de grises minimalista de alta definición
const SCALE_DARK = ['#FFFFFF', '#D1D5DB', '#9CA3AF', '#4B5563', '#374151'];
const SCALE_LIGHT = ['#111827', '#4B5563', '#6B7280', '#9CA3AF', '#D1D5DB'];

export const chartScale = (isDark) => (isDark ? SCALE_DARK : SCALE_LIGHT);

/**
 * Donut SVG refinado con segmentos proporcionales en escala de grises
 * segments: [{ value: number, label?: string, color?: string }]
 */
export default function Donut({
  segments = [],
  size = 110,
  thickness = 18,
  centerValue,
  centerLabel,
  isDark = true,
}) {
  const scale = chartScale(isDark);
  const total = segments.reduce((sum, s) => sum + (Number(s.value) || 0), 0);
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const trackColor = isDark ? '#26262B' : '#E5E7EB';

  let currentOffset = 0;
  const gap = segments.filter((s) => Number(s.value) > 0).length > 1 ? 2.5 : 0;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ transform: 'rotate(-90deg)' }}
        className="overflow-visible"
      >
        {/* Pista de fondo */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={thickness}
        />

        {/* Segmentos del Donut */}
        {total > 0 &&
          segments.map((seg, idx) => {
            const val = Number(seg.value) || 0;
            if (val <= 0) return null;
            const segmentLength = (val / total) * circumference;
            const dashLength = Math.max(segmentLength - gap, 0.5);
            const strokeColor = seg.color || scale[idx % scale.length];

            const slice = (
              <circle
                key={idx}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={strokeColor}
                strokeWidth={thickness}
                strokeDasharray={`${dashLength} ${circumference - dashLength}`}
                strokeDashoffset={-currentOffset}
                className="transition-all duration-500 ease-out"
              />
            );
            currentOffset += segmentLength;
            return slice;
          })}
      </svg>

      {/* Contenido Central */}
      {(centerValue != null || centerLabel != null) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-1">
          {centerLabel && (
            <span
              className="text-[9px] uppercase tracking-wider font-semibold"
              style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}
            >
              {centerLabel}
            </span>
          )}
          {centerValue && (
            <span
              className="font-bold tracking-tight leading-none mt-0.5"
              style={{
                fontSize: Math.max(13, size * 0.16),
                color: isDark ? '#FFFFFF' : '#111827',
              }}
            >
              {centerValue}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
