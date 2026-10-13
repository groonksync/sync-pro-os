import React from 'react';

/**
 * Anillo de progreso circular.
 * Soporta percent simple (0-100) o múltiple concentric rings ([{ percent, color, stroke }])
 */
export default function Ring({
  percent = 0,
  rings = null,
  size = 52,
  stroke = 5,
  label,
  sublabel,
  isDark = true,
}) {
  const track = isDark ? '#26262B' : '#E5E7EB';
  const primaryColor = isDark ? '#FFFFFF' : '#111827';
  const secondaryColor = isDark ? '#6B7280' : '#9CA3AF';

  // Modo doble o múltiple anillo concéntrico
  if (Array.isArray(rings) && rings.length > 0) {
    return (
      <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          style={{ transform: 'rotate(-90deg)' }}
          className="overflow-visible"
        >
          {rings.map((rData, idx) => {
            const currentStroke = rData.stroke || stroke;
            const currentRadius = (size - currentStroke) / 2 - idx * (currentStroke + 2.5);
            if (currentRadius <= 0) return null;
            const circumference = 2 * Math.PI * currentRadius;
            const p = Math.max(0, Math.min(100, Number(rData.percent) || 0));
            const dashLength = (p / 100) * circumference;
            const ringColor = rData.color || (idx === 0 ? primaryColor : secondaryColor);

            return (
              <React.Fragment key={idx}>
                {/* Track */}
                <circle
                  cx={size / 2}
                  cy={size / 2}
                  r={currentRadius}
                  fill="none"
                  stroke={track}
                  strokeWidth={currentStroke}
                />
                {/* Progress */}
                <circle
                  cx={size / 2}
                  cy={size / 2}
                  r={currentRadius}
                  fill="none"
                  stroke={ringColor}
                  strokeWidth={currentStroke}
                  strokeLinecap="round"
                  strokeDasharray={`${dashLength} ${circumference}`}
                  className="transition-all duration-500 ease-out"
                />
              </React.Fragment>
            );
          })}
        </svg>

        {label && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center"
            style={{ color: primaryColor }}
          >
            <span className="font-bold tracking-tight leading-none" style={{ fontSize: Math.max(10, size * 0.22) }}>
              {label}
            </span>
            {sublabel && (
              <span className="text-[8px] font-medium mt-0.5" style={{ color: secondaryColor }}>
                {sublabel}
              </span>
            )}
          </div>
        )}
      </div>
    );
  }

  // Modo anillo simple
  const p = Math.max(0, Math.min(100, Number(percent) || 0));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashLength = (p / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ transform: 'rotate(-90deg)' }}
        className="overflow-visible"
      >
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={track} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={primaryColor}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dashLength} ${circumference}`}
          className="transition-all duration-500 ease-out"
        />
      </svg>
      <div
        className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none font-bold"
        style={{ color: primaryColor }}
      >
        <span style={{ fontSize: Math.max(10, size * 0.24) }}>
          {label != null ? label : `${Math.round(p)}%`}
        </span>
        {sublabel && (
          <span className="text-[8px] font-medium" style={{ color: secondaryColor }}>
            {sublabel}
          </span>
        )}
      </div>
    </div>
  );
}
