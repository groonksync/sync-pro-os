import React, { useState } from 'react';
import { useTheme } from '../lib/theme';
import { TrendingUp, ArrowUpRight, ArrowDownRight, Layers } from 'lucide-react';

const MONTH_NAMES = [
  'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
  'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'
];

export const FinancialWeeklyOverview = ({
  isDark = true,
  title = "Distribución Semanal de Flujo",
  subtitle = "Comparativa de rendimiento y egresos por períodos de 7 días",
  weeklyData = [
    { week: '1st Week', bars: [200, 160, 180] },
    { week: '2nd Week', bars: [150, 175, 125] },
    { week: '3rd Week', bars: [175, 150, 150] },
    { week: '4th Week', bars: [125, 175, 180] },
  ],
  monthlyCards = [
    { month: 'SEPTIEMBRE', amount: 63500, color: '#06b6d4', trend: 'down', points: '0,20 15,35 30,15 45,25' },
    { month: 'AGOSTO', amount: 66000, color: '#0284c7', trend: 'up', points: '0,25 15,15 30,22 45,30' },
    { month: 'JULIO', amount: 65000, color: '#2563eb', trend: 'down', points: '0,15 15,30 30,28 45,35' },
  ],
  unit = "BOB",
  maxScale = 200
}) => {
  const t = useTheme(isDark);
  const [hoveredBar, setHoveredBar] = useState(null);

  // Paleta de 3 colores para las barras agrupadas (idéntica a la imagen de referencia)
  const barColors = ['#1d4ed8', '#0284c7', '#06b6d4'];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 w-full my-6">
      
      {/* ── PANEL PRINCIPAL: GRÁFICO DE BARRAS POR SEMANAS ───────────────── */}
      <div
        className="lg:col-span-8 p-6 rounded-2xl flex flex-col justify-between"
        style={{
          backgroundColor: t.panel,
          border: '1px solid rgba(255,255,255,0.07)',
          boxShadow: '0 8px 30px rgba(0,0,0,0.25)'
        }}
      >
        {/* Cabecera del Gráfico */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h3 style={{ fontSize: '13px', fontWeight: 800, color: t.text, textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>
              {title}
            </h3>
            <p style={{ fontSize: '11px', color: t.textMuted, margin: '3px 0 0' }}>
              {subtitle}
            </p>
          </div>

          {/* Leyenda de colores */}
          <div className="flex items-center gap-4 text-[10px] font-semibold">
            <span className="flex items-center gap-1.5" style={{ color: '#06b6d4' }}>
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#06b6d4' }} /> Mes Actual
            </span>
            <span className="flex items-center gap-1.5" style={{ color: '#0284c7' }}>
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#0284c7' }} /> Mes Anterior
            </span>
            <span className="flex items-center gap-1.5" style={{ color: '#1d4ed8' }}>
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#1d4ed8' }} /> Histórico
            </span>
          </div>
        </div>

        {/* Contenedor del Gráfico de Barras con Eje Y */}
        <div className="relative w-full pt-4 pb-2">
          
          {/* Líneas Guía Horizontales con Escala Y */}
          <div className="absolute inset-x-0 inset-y-0 flex flex-col justify-between pointer-events-none" style={{ bottom: '26px' }}>
            {[maxScale, Math.round(maxScale * 0.75), Math.round(maxScale * 0.5), Math.round(maxScale * 0.25)].map((tick, i) => (
              <div key={i} className="flex items-center w-full">
                <span className="num-tabular text-[9px] font-bold text-neutral-500 w-7 text-right pr-2">
                  {tick}
                </span>
                <div className="flex-1 h-[1px]" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }} />
              </div>
            ))}
            <div className="flex items-center w-full">
              <span className="num-tabular text-[9px] font-bold text-neutral-500 w-7 text-right pr-2">0</span>
              <div className="flex-1 h-[1px]" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }} />
            </div>
          </div>

          {/* Columnas de Semanas con Barras Agrupadas */}
          <div className="relative z-10 grid grid-cols-4 gap-3 pl-8" style={{ height: '160px', marginBottom: '26px' }}>
            {weeklyData.map((weekItem, wIdx) => (
              <div key={wIdx} className="flex items-end justify-center gap-1.5 h-full relative">
                
                {/* 3 Barras agrupadas por semana */}
                {weekItem.bars.map((val, bIdx) => {
                  const heightPercent = Math.min(Math.round((val / maxScale) * 100), 100);
                  const barColor = barColors[bIdx % barColors.length];
                  const barKey = `${wIdx}-${bIdx}`;
                  const isHovered = hoveredBar === barKey;

                  return (
                    <div
                      key={bIdx}
                      onMouseEnter={() => setHoveredBar(barKey)}
                      onMouseLeave={() => setHoveredBar(null)}
                      className="relative flex-1 max-w-[22px] flex items-end h-full cursor-pointer group"
                    >
                      {/* Tooltip flotante */}
                      {isHovered && (
                        <div
                          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded-md text-[9px] font-bold text-white whitespace-nowrap pointer-events-none z-30 shadow-lg"
                          style={{ backgroundColor: '#18181B', border: `1px solid ${barColor}` }}
                        >
                          {val.toLocaleString()} {unit}
                        </div>
                      )}

                      {/* Barra vertical estilizada */}
                      <div
                        style={{
                          height: `${heightPercent}%`,
                          backgroundColor: barColor,
                          borderRadius: '3px 3px 0 0',
                          width: '100%',
                          transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                          transform: isHovered ? 'scaleY(1.05)' : 'scaleY(1)',
                          transformOrigin: 'bottom',
                          boxShadow: isHovered ? `0 0 12px ${barColor}80` : 'none'
                        }}
                      />
                    </div>
                  );
                })}

                {/* Etiqueta del Eje X */}
                <div
                  className="absolute top-full left-0 right-0 text-center pt-2 text-[10px] font-semibold"
                  style={{ color: t.textSecondary }}
                >
                  {weekItem.week}
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* ── PANEL DERECHO: 3 TARJETAS APILADAS CON SPARKLINE ─────────────── */}
      <div className="lg:col-span-4 flex flex-col justify-between gap-3">
        {monthlyCards.map((card, idx) => (
          <div
            key={idx}
            className="flex-1 p-4 rounded-2xl flex items-center justify-between transition-all duration-300 hover:scale-[1.01]"
            style={{
              backgroundColor: t.panel,
              border: '1px solid rgba(255,255,255,0.07)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
            }}
          >
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: card.color, boxShadow: `0 0 8px ${card.color}` }}
                />
                <span style={{ fontSize: '10px', fontWeight: 800, color: card.color, letterSpacing: '0.06em' }}>
                  {card.month}
                </span>
              </div>
              <h4 style={{ fontSize: '20px', fontWeight: 800, color: t.text, margin: 0, letterSpacing: '-0.03em' }}>
                $ <span className="num-tabular">{card.amount.toLocaleString()}</span> <span style={{ fontSize: '11px', color: t.textMuted, fontWeight: 600 }}>{unit}</span>
              </h4>
            </div>

            {/* Mini Sparkline SVG a la derecha como en la imagen */}
            <div style={{ width: '70px', height: '36px' }}>
              <svg width="100%" height="100%" viewBox="0 0 50 40" fill="none" style={{ overflow: 'visible' }}>
                <polyline
                  points={card.points || "0,20 15,30 30,10 45,25"}
                  stroke={card.color}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};

export default FinancialWeeklyOverview;
