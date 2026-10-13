import React, { useState, useMemo } from 'react';
import {
  Calculator, DollarSign, TrendingUp, Calendar, Percent,
  ArrowRight, ShieldCheck, Check, Sparkles, RefreshCw
} from 'lucide-react';
import { useTheme } from '../lib/theme';
import BottomSheet from './ui/BottomSheet';

export default function SimuladorFinancieroModal({
  isOpen,
  onClose,
  isDark = true,
  onApplyToNewLoan,
}) {
  const t = useTheme(isDark);

  const [capital, setCapital] = useState(10000);
  const [interes, setInteres] = useState(10);
  const [plazo, setPlazo] = useState(6);
  const [tipoCalculo, setTipoCalculo] = useState('interes_mensual'); // 'interes_mensual' | 'cuota_amortizada'

  // Cálculos financieros en tiempo real
  const simulacion = useMemo(() => {
    const cap = parseFloat(capital) || 0;
    const tasa = parseFloat(interes) || 0;
    const meses = parseInt(plazo, 10) || 1;

    if (cap <= 0 || meses <= 0) {
      return {
        cuotaMensual: 0,
        interesTotal: 0,
        montoTotal: 0,
        roiPct: 0,
        cronograma: [],
      };
    }

    if (tipoCalculo === 'interes_mensual') {
      // Modelo tradicional: se cobra el % de interés cada mes, y el capital al final (o en cuotas)
      const interesMensual = cap * (tasa / 100);
      const interesTotal = interesMensual * meses;
      const montoTotal = cap + interesTotal;
      const roiPct = Math.round((interesTotal / cap) * 100);

      const cronograma = Array.from({ length: meses }).map((_, idx) => ({
        mes: idx + 1,
        cuota: interesMensual,
        capitalRestante: cap,
        esUltimo: idx === meses - 1,
      }));

      return {
        cuotaMensual: interesMensual,
        interesTotal,
        montoTotal,
        roiPct,
        cronograma,
      };
    } else {
      // Cuota nivelada con amortización de capital
      const i = tasa / 100;
      let cuota = 0;
      if (i > 0) {
        cuota = (cap * i) / (1 - Math.pow(1 + i, -meses));
      } else {
        cuota = cap / meses;
      }

      const montoTotal = cuota * meses;
      const interesTotal = Math.max(0, montoTotal - cap);
      const roiPct = cap > 0 ? Math.round((interesTotal / cap) * 100) : 0;

      let saldo = cap;
      const cronograma = Array.from({ length: meses }).map((_, idx) => {
        const interesCuota = saldo * i;
        const amortizacion = cuota - interesCuota;
        saldo = Math.max(0, saldo - amortizacion);
        return {
          mes: idx + 1,
          cuota,
          capitalRestante: saldo,
          esUltimo: idx === meses - 1,
        };
      });

      return {
        cuotaMensual: cuota,
        interesTotal,
        montoTotal,
        roiPct,
        cronograma,
      };
    }
  }, [capital, interes, plazo, tipoCalculo]);

  const handleApply = () => {
    if (onApplyToNewLoan) {
      onApplyToNewLoan({
        capital,
        interes,
        plazo_meses: plazo,
        cuotaUnit: Math.round(simulacion.cuotaMensual),
      });
    }
    onClose();
  };

  const inputStyle = {
    backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
    borderColor: t.borderLight || t.border,
    color: t.text,
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      isDark={isDark}
      maxWidth="max-w-2xl"
      title="Simulador de Crédito & Retornos"
      subtitle="Calcula cuotas, ganancias proyectadas y retornos de inversión en tiempo real"
    >
      <div className="space-y-6">
        
        {/* Parámetros de Entrada */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest block mb-1.5" style={{ color: t.textMuted }}>
              Capital a Prestar (Bs)
            </label>
            <div className="relative">
              <input
                type="number"
                value={capital}
                onChange={(e) => setCapital(e.target.value)}
                min="100"
                step="500"
                className="w-full text-xs font-mono font-bold rounded-xl border p-2.5 outline-none"
                style={inputStyle}
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest block mb-1.5" style={{ color: t.textMuted }}>
              Tasa Mensual (%)
            </label>
            <div className="relative">
              <input
                type="number"
                value={interes}
                onChange={(e) => setInteres(e.target.value)}
                min="0"
                step="0.5"
                className="w-full text-xs font-mono font-bold rounded-xl border p-2.5 outline-none"
                style={inputStyle}
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest block mb-1.5" style={{ color: t.textMuted }}>
              Plazo (Meses)
            </label>
            <div className="relative">
              <input
                type="number"
                value={plazo}
                onChange={(e) => setPlazo(e.target.value)}
                min="1"
                max="60"
                className="w-full text-xs font-mono font-bold rounded-xl border p-2.5 outline-none"
                style={inputStyle}
              />
            </div>
          </div>
        </div>

        {/* Selector de Modalidad */}
        <div className="flex gap-2 p-1 rounded-xl border" style={{ backgroundColor: isDark ? '#1C1C1E' : '#F3F4F6', borderColor: t.borderLight || t.border }}>
          <button
            type="button"
            onClick={() => setTipoCalculo('interes_mensual')}
            className="flex-1 py-1.5 px-3 rounded-lg text-xs font-medium transition-all"
            style={{
              backgroundColor: tipoCalculo === 'interes_mensual' ? (isDark ? '#2C2C30' : '#FFFFFF') : 'transparent',
              color: tipoCalculo === 'interes_mensual' ? t.text : t.textMuted,
              boxShadow: tipoCalculo === 'interes_mensual' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            Interés Mensual Simple
          </button>
          <button
            type="button"
            onClick={() => setTipoCalculo('cuota_amortizada')}
            className="flex-1 py-1.5 px-3 rounded-lg text-xs font-medium transition-all"
            style={{
              backgroundColor: tipoCalculo === 'cuota_amortizada' ? (isDark ? '#2C2C30' : '#FFFFFF') : 'transparent',
              color: tipoCalculo === 'cuota_amortizada' ? t.text : t.textMuted,
              boxShadow: tipoCalculo === 'cuota_amortizada' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            Amortización de Capital
          </button>
        </div>

        {/* Tarjetas de Métricas de Rendimiento */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="p-3 rounded-xl border" style={{ backgroundColor: isDark ? '#1C1C1E' : '#F9FAFB', borderColor: t.borderLight || t.border }}>
            <span className="text-[9px] font-bold uppercase tracking-wider block" style={{ color: t.textMuted }}>
              Cuota / Mes
            </span>
            <span className="text-base font-mono font-bold block mt-1" style={{ color: t.text }}>
              {Math.round(simulacion.cuotaMensual).toLocaleString()} Bs
            </span>
            <span className="text-[10px] block mt-0.5" style={{ color: t.textMuted }}>
              {tipoCalculo === 'interes_mensual' ? 'Interés mensual' : 'Capital + Interés'}
            </span>
          </div>

          <div className="p-3 rounded-xl border" style={{ backgroundColor: isDark ? '#1C1C1E' : '#F9FAFB', borderColor: t.borderLight || t.border }}>
            <span className="text-[9px] font-bold uppercase tracking-wider block" style={{ color: t.textMuted }}>
              Ganancia Neta
            </span>
            <span className="text-base font-mono font-bold block mt-1" style={{ color: isDark ? '#A7F3D0' : '#059669' }}>
              +{Math.round(simulacion.interesTotal).toLocaleString()} Bs
            </span>
            <span className="text-[10px] block mt-0.5" style={{ color: t.textMuted }}>
              Total intereses
            </span>
          </div>

          <div className="p-3 rounded-xl border" style={{ backgroundColor: isDark ? '#1C1C1E' : '#F9FAFB', borderColor: t.borderLight || t.border }}>
            <span className="text-[9px] font-bold uppercase tracking-wider block" style={{ color: t.textMuted }}>
              Recaudación
            </span>
            <span className="text-base font-mono font-bold block mt-1" style={{ color: t.text }}>
              {Math.round(simulacion.montoTotal).toLocaleString()} Bs
            </span>
            <span className="text-[10px] block mt-0.5" style={{ color: t.textMuted }}>
              Capital + Ganancia
            </span>
          </div>

          <div className="p-3 rounded-xl border" style={{ backgroundColor: isDark ? '#1C1C1E' : '#F9FAFB', borderColor: t.borderLight || t.border }}>
            <span className="text-[9px] font-bold uppercase tracking-wider block" style={{ color: t.textMuted }}>
              Retorno (ROI)
            </span>
            <span className="text-base font-mono font-bold block mt-1" style={{ color: t.text }}>
              +{simulacion.roiPct}%
            </span>
            <span className="text-[10px] block mt-0.5" style={{ color: t.textMuted }}>
              Rendimiento total
            </span>
          </div>
        </div>

        {/* Cronograma Resumido */}
        <div className="space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-widest block" style={{ color: t.textMuted }}>
            Desglose de Cuotas Proyectadas ({simulacion.cronograma.length} cuotas)
          </span>
          <div className="max-h-36 overflow-y-auto mac-scrollbar rounded-xl border divide-y" style={{ backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF', borderColor: t.borderLight || t.border, divideColor: t.borderLight || t.border }}>
            {simulacion.cronograma.map((c) => (
              <div key={c.mes} className="flex items-center justify-between px-3 py-2 text-xs">
                <span className="font-medium" style={{ color: t.text }}>
                  Mes {c.mes} {c.esUltimo && '(Liquidación final)'}
                </span>
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold" style={{ color: t.text }}>
                    {Math.round(c.cuota).toLocaleString()} Bs
                  </span>
                  <span className="text-[10px] font-mono" style={{ color: t.textMuted }}>
                    Saldo: {Math.round(c.capitalRestante).toLocaleString()} Bs
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Botones de Acción */}
        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-xl border text-xs font-semibold uppercase tracking-wider transition-opacity hover:opacity-80"
            style={{
              backgroundColor: isDark ? '#232326' : '#F3F4F6',
              borderColor: t.borderLight || t.border,
              color: t.textMuted,
            }}
          >
            Cerrar
          </button>

          {onApplyToNewLoan && (
            <button
              type="button"
              onClick={handleApply}
              className="flex-1 py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-opacity hover:opacity-90 shadow-md"
              style={{
                backgroundColor: isDark ? '#ECECEC' : '#1C1C1E',
                color: isDark ? '#1C1C1E' : '#FFFFFF',
              }}
            >
              <Sparkles size={14} /> Aplicar a Nuevo Préstamo
            </button>
          )}
        </div>

      </div>
    </BottomSheet>
  );
}
