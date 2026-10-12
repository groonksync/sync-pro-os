import React, { useState, useEffect, useMemo } from 'react';
import {
  Landmark, DollarSign, Wallet, Package, Bell, TrendingUp,
  Sparkles, Download, ChevronDown, ChevronLeft, ChevronRight,
  Check, CheckCircle, AlertTriangle, FileText, FileSpreadsheet,
  Smartphone, Clock, ArrowUpRight, ArrowDownRight, Layers,
  ExternalLink, Calendar
} from 'lucide-react';
import { aiService } from '../services/aiService';
import { useTheme } from '../lib/theme';
import { calcularCategoriaPrestamo } from '../hooks/usePrestamoCategorias';
import { useWhatsApp } from '../hooks/useWhatsApp';
import CommandModal from '../components/CommandModal';
import ResumenIAModal from '../components/ResumenIAModal';
import { exportCobrosCSV, exportStockBajoCSV, exportPDF } from '../utils/exportReport';

// Componentes UI de Gris Esencial
import Panel from '../components/ui/Panel';
import Donut from '../components/ui/Donut';
import Ring from '../components/ui/Ring';
import Sparkline from '../components/ui/Sparkline';
import SegBar from '../components/ui/SegBar';
import WeekDots from '../components/ui/WeekDots';
import StatusDot from '../components/ui/StatusDot';

const CommandCenter = ({
  meetingsList = [],
  data = { prestamos: [], productos: [], recordatorios: [], egresos: [], ventas: [] },
  servicios = [],
  settings,
  isDark = true,
  onNavigateToPrestamo,
  onQuickPayment,
  onNavigateTo,
  onPayService,
}) => {
  const t = useTheme(isDark);
  const { enviarRecordatorioMensual } = useWhatsApp();

  const hoy = new Date();
  const mesActual = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;

  // ─── Estados ────────────────────────────────────────────────
  const [periodoMes, setPeriodoMes] = useState(mesActual);
  const [modalPago, setModalPago] = useState({ isOpen: false, prestamo: null });
  const [modalServicio, setModalServicio] = useState({ isOpen: false, servicio: null });
  const [modalIA, setModalIA] = useState({ isOpen: false, contenido: '', cargando: false });
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);
  const [timelineDayOffset, setTimelineDayOffset] = useState(0);
  const [selectedTimelineDay, setSelectedTimelineDay] = useState(0);
  const [productPage, setProductPage] = useState(0);

  // Auto-cierre del toast
  useEffect(() => {
    if (toastMsg) {
      const timer = setTimeout(() => setToastMsg(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMsg]);

  // ─── Cálculos de Préstamos y Cobros del Período ───────────────
  const listaPrestamos = Array.isArray(data?.prestamos)
    ? data.prestamos.filter(p => p && p.id)
    : [];

  const cobrosDelPeriodo = useMemo(() => {
    const [selYear, selMonth] = periodoMes.split('-').map(Number);
    const finDelMesSel = new Date(selYear, selMonth, 0);

    return listaPrestamos.map(p => {
      if (!p.inicio) return null;
      const cat = calcularCategoriaPrestamo(p);
      if (!cat) return null;

      const cuotaCalculada = p.cuotaUnit || (parseFloat(p.capital || 0) * (parseFloat(p.interes || 0) / 100));
      const totalPagado = (p.pagos || []).length * cuotaCalculada;
      const totalEsperado = cuotaCalculada * (parseInt(p.plazo_meses) || 12);
      const amortizadoPct = totalEsperado > 0 ? Math.min(100, Math.round((totalPagado / totalEsperado) * 100)) : 0;

      return {
        ...p,
        ...cat,
        cuotaCalculada,
        amortizadoPct,
        totalPagado,
        totalEsperado,
      };
    }).filter(p => {
      if (!p) return false;
      const inicio = new Date(p.inicio);
      if (inicio > finDelMesSel) return false;
      if (p.fin) {
        const fin = new Date(p.fin);
        const inicioDelMesSel = new Date(selYear, selMonth - 1, 1);
        if (fin < inicioDelMesSel && p.totalAtraso === 0) return false;
      }
      return true;
    });
  }, [listaPrestamos, periodoMes]);

  const categorias = useMemo(() => {
    const alDia = cobrosDelPeriodo.filter(p => p.categoria === 'AL_DIA');
    const pendientes = cobrosDelPeriodo.filter(p => p.categoria === 'PENDIENTE');
    const deudor1Mes = cobrosDelPeriodo.filter(p => p.categoria === 'DEUDOR_1MES');
    const deudorCritico = cobrosDelPeriodo.filter(p => p.categoria === 'DEUDOR_CRITICO');
    const porCobrar = cobrosDelPeriodo.filter(p => p.categoria !== 'AL_DIA');

    const totalPendiente = porCobrar.reduce((sum, p) => sum + (p.montoPendiente || p.cuotaCalculada || 0), 0);
    const totalRecaudado = alDia.reduce((sum, p) => sum + (p.cuotaCalculada || 0), 0);

    return {
      alDia,
      pendientes,
      deudor1Mes,
      deudorCritico,
      porCobrar,
      totalPendiente,
      totalRecaudado,
    };
  }, [cobrosDelPeriodo]);

  // Resumen global de cartera (Panel 1)
  const resumenCartera = useMemo(() => {
    const totalCapital = listaPrestamos.reduce((sum, p) => sum + (parseFloat(p.capital || 0) || 0), 0);
    const totalPagadoSum = cobrosDelPeriodo.reduce((sum, p) => sum + (p.totalPagado || 0), 0);
    const totalEsperadoSum = cobrosDelPeriodo.reduce((sum, p) => sum + (p.totalEsperado || 0), 0);
    const pctAmortizado = totalEsperadoSum > 0 ? Math.min(100, Math.round((totalPagadoSum / totalEsperadoSum) * 100)) : 0;

    return {
      totalCapital,
      pctAmortizado,
      activos: cobrosDelPeriodo.length,
      alDia: categorias.alDia.length,
      enMora: categorias.deudor1Mes.length + categorias.deudorCritico.length,
    };
  }, [listaPrestamos, cobrosDelPeriodo, categorias]);

  // Progreso de cobranza del período (Panel 2)
  const resumenCobranza = useMemo(() => {
    const totalEsperado = categorias.totalRecaudado + categorias.totalPendiente;
    const pctCobrado = totalEsperado > 0 ? Math.min(100, Math.round((categorias.totalRecaudado / totalEsperado) * 100)) : 0;
    return {
      totalEsperado,
      totalRecaudado: categorias.totalRecaudado,
      totalPendiente: categorias.totalPendiente,
      pctCobrado,
    };
  }, [categorias]);

  // ─── Egresos & Servicios (Panel 3) ───────────────────────────
  const egresos = Array.isArray(data?.egresos) ? data.egresos : [];
  
  const egresosDelMes = useMemo(() => {
    const [selYear, selMonth] = periodoMes.split('-').map(Number);
    return egresos.filter(e => {
      const f = new Date(e.fecha || e.fecha_pago || e.created_at);
      return f.getMonth() === selMonth - 1 && f.getFullYear() === selYear;
    });
  }, [egresos, periodoMes]);

  const totalEgresosMes = useMemo(() => {
    return egresosDelMes.reduce((sum, e) => sum + (parseFloat(e.monto || e.importe || 0) || 0), 0);
  }, [egresosDelMes]);

  // Tendencia de egresos últimos 6 meses para Sparkline
  const sparklineEgresos = useMemo(() => {
    const meses = [];
    const [curYear, curMonth] = periodoMes.split('-').map(Number);
    for (let i = 5; i >= 0; i--) {
      const d = new Date(curYear, curMonth - 1 - i, 1);
      const y = d.getFullYear();
      const m = d.getMonth();
      const suma = egresos
        .filter(e => {
          const f = new Date(e.fecha || e.fecha_pago || e.created_at);
          return f.getMonth() === m && f.getFullYear() === y;
        })
        .reduce((sum, e) => sum + (parseFloat(e.monto || e.importe || 0) || 0), 0);
      meses.push(suma);
    }
    // Si todos son 0, damos una base sobria mínima para dibujar
    const tieneDatos = meses.some(v => v > 0);
    return tieneDatos ? meses : [20, 25, 30, 22, 28, 35];
  }, [egresos, periodoMes]);

  // Servicios activos
  const serviciosActivos = useMemo(() => {
    const lista = (servicios || []).filter(s => s && s.activo !== false);
    const mesActualNum = hoy.getMonth();
    const añoActualNum = hoy.getFullYear();

    const egresosDelMesActual = egresos.filter(e => {
      const f = new Date(e.fecha || e.fecha_pago || e.created_at);
      return f.getMonth() === mesActualNum && f.getFullYear() === añoActualNum;
    });

    return lista.map(s => {
      const yaPagado = egresosDelMesActual.some(e =>
        (e.descripcion || e.nombre || '').toLowerCase().includes((s.nombre || '').toLowerCase())
      );

      let diasRestantes = null;
      if (s.fecha_pago) {
        const [y, m, d] = s.fecha_pago.split('-').map(Number);
        const fechaVenc = new Date(y, m - 1, d);
        fechaVenc.setHours(0, 0, 0, 0);
        const diff = fechaVenc.getTime() - hoy.setHours(0, 0, 0, 0);
        diasRestantes = Math.ceil(diff / (1000 * 60 * 60 * 24));
      }

      return {
        ...s,
        yaPagado,
        diasRestantes,
      };
    });
  }, [servicios, egresos]);

  const serviciosPendientes = useMemo(() => {
    return serviciosActivos.filter(s => !s.yaPagado);
  }, [serviciosActivos]);

  const totalGastoServicios = useMemo(() => {
    return serviciosActivos.reduce((sum, s) => sum + (parseFloat(s.monto) || 0), 0);
  }, [serviciosActivos]);

  // ─── Inventario & Stock (Panel 4) ────────────────────────────
  const listaProductos = Array.isArray(data?.productos) ? data.productos : [];
  const stockCritico = useMemo(() => {
    return listaProductos.filter(p => (parseInt(p.stock_actual || p.stock || 0) || 0) <= 5);
  }, [listaProductos]);

  const totalUnidadesStock = useMemo(() => {
    return listaProductos.reduce((sum, p) => sum + (parseInt(p.stock_actual || p.stock || 0) || 0), 0);
  }, [listaProductos]);

  const categoriasInventarioSegments = useMemo(() => {
    const counts = {};
    listaProductos.forEach(p => {
      const cat = p.categoria || 'General';
      counts[cat] = (counts[cat] || 0) + 1;
    });

    const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const topEntries = entries.slice(0, 3);
    const otros = entries.slice(3).reduce((sum, e) => sum + e[1], 0);

    const shades = isDark
      ? ['#E5E7EB', '#9CA3AF', '#6B7280', '#4B5563']
      : ['#374151', '#6B7280', '#9CA3AF', '#D1D5DB'];

    const segments = topEntries.map(([cat, val], idx) => ({
      label: cat,
      value: val,
      color: shades[idx] || shades[3],
    }));

    if (otros > 0) {
      segments.push({
        label: 'Otros',
        value: otros,
        color: shades[3],
      });
    }

    return segments.length > 0 ? segments : [{ label: 'Catálogo', value: 1, color: shades[0] }];
  }, [listaProductos, isDark]);

  const visibleProducts = useMemo(() => {
    const start = productPage * 4;
    return listaProductos.slice(start, start + 4);
  }, [listaProductos, productPage]);

  // ─── Timeline 7 Días (Panel 5) ──────────────────────────────
  const timelineDays = useMemo(() => {
    const days = [];
    const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

    for (let i = 0; i < 7; i++) {
      const targetDate = new Date();
      targetDate.setDate(hoy.getDate() + timelineDayOffset + i);
      const diaNum = targetDate.getDate();
      const diaNom = diasSemana[targetDate.getDay()];
      const dateStr = targetDate.toISOString().split('T')[0];

      const cobrosEnDia = cobrosDelPeriodo.filter(p => {
        if (!p.inicio) return false;
        const diaInicio = new Date(p.inicio).getDate();
        return diaInicio === diaNum;
      });

      const serviciosEnDia = serviciosPendientes.filter(s => {
        if (!s.fecha_pago) return false;
        const diaServ = new Date(s.fecha_pago).getDate();
        return diaServ === diaNum;
      });

      const totalItems = cobrosEnDia.length + serviciosEnDia.length;
      const isToday = i === 0 && timelineDayOffset === 0;

      days.push({
        index: i,
        diaNum,
        diaNom,
        dateStr,
        isToday,
        hasEvents: totalItems > 0,
        eventCount: totalItems,
        cobrosEnDia,
        serviciosEnDia,
      });
    }
    return days;
  }, [timelineDayOffset, cobrosDelPeriodo, serviciosPendientes]);

  const selectedDayInfo = timelineDays[selectedTimelineDay] || timelineDays[0];

  // ─── Flujo de Caja & Balance Operativo (Panel 6) ─────────────
  const cashflowData = useMemo(() => {
    const inflows = categorias.totalRecaudado;
    const outflows = totalEgresosMes + totalGastoServicios;
    const neto = inflows - outflows;

    const segments = [
      { label: 'Entradas', value: inflows, color: isDark ? '#D1D5DB' : '#374151' },
      { label: 'Salidas', value: outflows, color: isDark ? '#6B7280' : '#9CA3AF' },
    ];

    return { inflows, outflows, neto, segments };
  }, [categorias.totalRecaudado, totalEgresosMes, totalGastoServicios, isDark]);

  // ─── Handlers de Operación ──────────────────────────────────
  const ejecutarCobroRapido = (prestamo) => {
    setModalPago({ isOpen: true, prestamo });
  };

  const confirmarCobro = async () => {
    if (!modalPago.prestamo) return;
    try {
      await onQuickPayment(modalPago.prestamo.id);
      setToastMsg(`Cobro registrado para ${modalPago.prestamo.nombre}`);
    } catch (e) {
      setToastMsg(`Error al registrar cobro: ${e.message}`);
    } finally {
      setModalPago({ isOpen: false, prestamo: null });
    }
  };

  const ejecutarPagoServicio = (servicio) => {
    setModalServicio({ isOpen: true, servicio });
  };

  const confirmarPagoServicio = async () => {
    if (!modalServicio.servicio) return;
    try {
      if (onPayService) {
        await onPayService(modalServicio.servicio);
        setToastMsg(`Pago registrado para ${modalServicio.servicio.nombre}`);
      }
    } catch (e) {
      setToastMsg(`Error al registrar pago: ${e.message}`);
    } finally {
      setModalServicio({ isOpen: false, servicio: null });
    }
  };

  const handleShareWhatsAppProduct = (prod) => {
    const text = encodeURIComponent(
      `Hola! Te comparto la información de nuestro producto:\n\n*${prod.nombre}*\nPrecio: ${prod.precio_venta || 0} Bs\nStock disponible: ${prod.stock_actual || prod.stock || 0} unidades\n\n¿Te gustaría coordinar la entrega?`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const generarResumenIA = async () => {
    setModalIA({ isOpen: true, contenido: '', cargando: true });
    try {
      const prompt = `Analiza la situación operativa actual de Inefable:
- Préstamos Activos: ${cobrosDelPeriodo.length} contratos
- Total pendiente de cobro: ${categorias.totalPendiente.toLocaleString()} Bs
- Total cobrado este mes: ${categorias.totalRecaudado.toLocaleString()} Bs
- Deudores en mora crítica: ${categorias.deudorCritico.length}
- Suscripciones pendientes: ${serviciosPendientes.length} por un total de ${totalGastoServicios.toLocaleString()} Bs
- Stock crítico: ${stockCritico.length} productos con 5 o menos unidades

Por favor, genera un análisis ejecutivo breve con 3 recomendaciones tácticas de cobranza y optimización de flujo de caja para hoy.`;

      const response = await aiService.askAgent(prompt, [], { settings });
      setModalIA({ isOpen: true, contenido: response, cargando: false });
    } catch (e) {
      setModalIA({ isOpen: true, contenido: `No se pudo generar el análisis: ${e.message}`, cargando: false });
    }
  };

  const handleExport = (tipo) => {
    setExportMenuOpen(false);
    if (tipo === 'pdf') {
      exportPDF(data, periodoMes, settings);
      setToastMsg("Reporte PDF descargado con éxito");
    } else if (tipo === 'csv-cobros') {
      exportCobrosCSV(cobrosDelPeriodo, periodoMes);
      setToastMsg("CSV de cobros descargado");
    } else if (tipo === 'csv-stock') {
      exportStockBajoCSV(stockCritico);
      setToastMsg("CSV de stock crítico descargado");
    }
  };

  return (
    <div className="w-full space-y-5 animate-in fade-in duration-300 pb-12">

      {/* ─── TOAST NOTIFICACIÓN ─── */}
      {toastMsg && (
        <div 
          className="fixed bottom-20 md:bottom-6 right-6 z-50 p-3 px-4 rounded-xl border text-xs font-semibold shadow-2xl backdrop-blur-xl animate-in slide-in-from-bottom-2 duration-200 flex items-center gap-2"
          style={{
            backgroundColor: isDark ? 'rgba(35, 35, 38, 0.95)' : 'rgba(255, 255, 255, 0.95)',
            borderColor: isDark ? '#3A3A3D' : '#E5E7EB',
            color: isDark ? '#F9FAFB' : '#111827',
          }}
        >
          <StatusDot status="success" size={8} />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* ─── BARRA SUPERIOR MINIMALISTA ─── */}
      <div 
        className="w-full p-3.5 sm:p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors"
        style={{
          backgroundColor: t.panel,
          borderColor: t.border,
        }}
      >
        <div className="flex items-center gap-3">
          <div 
            className="w-9 h-9 rounded-xl border flex items-center justify-center transition-colors"
            style={{
              backgroundColor: isDark ? '#1F1F22' : '#F3F4F6',
              borderColor: t.borderSubtle,
              color: t.textMuted,
            }}
          >
            <Layers size={17} />
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-bold tracking-tight m-0" style={{ color: t.textMain }}>
              Centro de Mando
            </h1>
            <p className="text-[11px] m-0" style={{ color: t.textSub }}>
              Control de cartera, cobranzas, catálogo y flujo de caja
            </p>
          </div>
        </div>

        {/* Acciones Rápidas de Barra */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Selector de Mes */}
          <input
            type="month"
            value={periodoMes}
            onChange={(e) => setPeriodoMes(e.target.value)}
            className="text-xs font-semibold py-1.5 px-3 rounded-xl border focus:outline-none transition-colors"
            style={{
              backgroundColor: isDark ? '#1F1F22' : '#F9FAFB',
              borderColor: t.borderSubtle,
              color: t.textMain,
            }}
          />

          {/* Botón Análisis IA */}
          <button
            onClick={generarResumenIA}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all hover:opacity-90 active:scale-95"
            style={{
              backgroundColor: isDark ? '#2E2E32' : '#E5E7EB',
              borderColor: t.borderSubtle,
              color: t.textMain,
            }}
          >
            <Sparkles size={13} />
            <span>Análisis IA</span>
          </button>

          {/* Menú Exportar */}
          <div className="relative">
            <button
              onClick={() => setExportMenuOpen(!exportMenuOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all hover:opacity-90"
              style={{
                backgroundColor: isDark ? '#2A2A2D' : '#F3F4F6',
                borderColor: t.borderSubtle,
                color: t.textMain,
              }}
            >
              <Download size={13} />
              <span>Exportar</span>
              <ChevronDown size={12} />
            </button>

            {exportMenuOpen && (
              <div 
                className="absolute right-0 mt-1.5 w-44 rounded-xl p-1 shadow-xl border backdrop-blur-2xl z-40 space-y-0.5"
                style={{
                  backgroundColor: isDark ? 'rgba(35, 35, 38, 0.98)' : 'rgba(255, 255, 255, 0.98)',
                  borderColor: t.borderSubtle,
                }}
              >
                <button
                  onClick={() => handleExport('pdf')}
                  className="w-full text-left px-2.5 py-1.5 text-xs rounded-lg flex items-center gap-2 hover:bg-neutral-500/10 transition-colors"
                  style={{ color: t.textMain }}
                >
                  <FileText size={13} />
                  <span>Reporte PDF</span>
                </button>
                <button
                  onClick={() => handleExport('csv-cobros')}
                  className="w-full text-left px-2.5 py-1.5 text-xs rounded-lg flex items-center gap-2 hover:bg-neutral-500/10 transition-colors"
                  style={{ color: t.textMain }}
                >
                  <FileSpreadsheet size={13} />
                  <span>CSV de Cobros</span>
                </button>
                <button
                  onClick={() => handleExport('csv-stock')}
                  className="w-full text-left px-2.5 py-1.5 text-xs rounded-lg flex items-center gap-2 hover:bg-neutral-500/10 transition-colors"
                  style={{ color: t.textMain }}
                >
                  <AlertTriangle size={13} />
                  <span>CSV Stock Crítico</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          CUADRÍCULA 3x2 DE PANELES MINIMALISTAS
          ══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

        {/* ─── PANEL 1: CARTERA DE PRÉSTAMOS ─── */}
        <Panel
          title="Préstamos Activos"
          icon={Landmark}
          badge={`${resumenCartera.activos} contratos`}
          action={
            <button 
              onClick={() => onNavigateToPrestamo ? onNavigateToPrestamo(null) : onNavigateTo('prestamos')}
              className="text-[11px] font-semibold hover:underline flex items-center gap-1"
              style={{ color: t.textMuted }}
            >
              <span>Ver Cartera</span>
              <ExternalLink size={11} />
            </button>
          }
          isDark={isDark}
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider m-0" style={{ color: t.textSub }}>
                Capital Colocado
              </p>
              <h2 className="text-2xl font-black tracking-tight m-0 mt-0.5" style={{ color: t.textMain }}>
                {Math.round(resumenCartera.totalCapital).toLocaleString()} <span className="text-xs font-normal" style={{ color: t.textSub }}>Bs</span>
              </h2>
              <div className="flex items-center gap-3 mt-3 text-xs" style={{ color: t.textMuted }}>
                <span className="flex items-center gap-1.5">
                  <StatusDot status="success" size={7} />
                  <span>{resumenCartera.alDia} al día</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <StatusDot status={resumenCartera.enMora > 0 ? 'danger' : 'neutral'} size={7} />
                  <span>{resumenCartera.enMora} mora</span>
                </span>
              </div>
            </div>

            <Donut
              value={resumenCartera.pctAmortizado}
              size={76}
              strokeWidth={7}
              label={`${resumenCartera.pctAmortizado}%`}
              sublabel="Amortizado"
              isDark={isDark}
            />
          </div>
        </Panel>

        {/* ─── PANEL 2: COBROS DEL MES ─── */}
        <Panel
          title="Cobros del Mes"
          icon={DollarSign}
          badge={`${resumenCobranza.pctCobrado}%`}
          isDark={isDark}
        >
          <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: t.borderSubtle }}>
            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider m-0" style={{ color: t.textSub }}>
                Recaudado / Esperado
              </p>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-lg font-bold" style={{ color: t.textMain }}>
                  {Math.round(resumenCobranza.totalRecaudado).toLocaleString()}
                </span>
                <span className="text-xs" style={{ color: t.textSub }}>
                  / {Math.round(resumenCobranza.totalEsperado).toLocaleString()} Bs
                </span>
              </div>
            </div>
            <Ring
              value={resumenCobranza.pctCobrado}
              size={48}
              strokeWidth={5}
              centerText={`${resumenCobranza.pctCobrado}%`}
              isDark={isDark}
            />
          </div>

          {/* Lista compacta de deudores */}
          <div className="mt-3 space-y-2 max-h-44 overflow-y-auto pr-1 mac-scrollbar">
            {cobrosDelPeriodo.length > 0 ? (
              cobrosDelPeriodo.map((p) => {
                const isPaid = p.categoria === 'AL_DIA';
                const status = isPaid ? 'success' : (p.categoria === 'PENDIENTE' ? 'warning' : 'danger');

                return (
                  <div
                    key={p.id}
                    className="p-2 rounded-xl border flex items-center justify-between text-xs transition-colors"
                    style={{
                      backgroundColor: isDark ? '#1F1F22' : '#F9FAFB',
                      borderColor: t.borderSubtle,
                    }}
                  >
                    <div className="flex items-center gap-2 min-w-0 pr-2">
                      <StatusDot status={status} size={7} />
                      <div className="min-w-0 truncate">
                        <p className="font-semibold truncate m-0 leading-tight" style={{ color: t.textMain }}>
                          {p.nombre || 'Deudor'}
                        </p>
                        <span className="text-[10px] font-mono" style={{ color: t.textSub }}>
                          {Math.round(p.cuotaCalculada || 0)} Bs
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => ejecutarCobroRapido(p)}
                        title={isPaid ? "Cobro registrado" : "Registrar cobro"}
                        className="p-1.5 rounded-lg border text-xs font-semibold transition-all active:scale-90"
                        style={{
                          backgroundColor: isPaid ? (isDark ? '#2E2E32' : '#E5E7EB') : (isDark ? '#3A3A3D' : '#D1D5DB'),
                          borderColor: t.borderSubtle,
                          color: t.textMain,
                        }}
                      >
                        <Check size={12} />
                      </button>

                      {p.telefono && (
                        <button
                          onClick={() => enviarRecordatorioMensual(p, periodoMes)}
                          title="Aviso por WhatsApp"
                          className="p-1.5 rounded-lg border transition-all active:scale-90"
                          style={{
                            backgroundColor: isDark ? '#232326' : '#FFFFFF',
                            borderColor: t.borderSubtle,
                            color: t.textMuted,
                          }}
                        >
                          <Smartphone size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-center py-4 m-0" style={{ color: t.textSub }}>
                Sin registros para este período
              </p>
            )}
          </div>
        </Panel>

        {/* ─── PANEL 3: EGRESOS & SUSCRIPCIONES ─── */}
        <Panel
          title="Egresos & Gastos"
          icon={Wallet}
          badge={`${serviciosPendientes.length} por pagar`}
          isDark={isDark}
        >
          <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: t.borderSubtle }}>
            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider m-0" style={{ color: t.textSub }}>
                Gasto Mes en Curso
              </p>
              <h2 className="text-xl font-bold tracking-tight m-0 mt-0.5" style={{ color: t.textMain }}>
                {Math.round(totalEgresosMes).toLocaleString()} <span className="text-xs font-normal" style={{ color: t.textSub }}>Bs</span>
              </h2>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[10px] mb-1" style={{ color: t.textSub }}>Últimos 6 meses</span>
              <Sparkline data={sparklineEgresos} width={90} height={28} isDark={isDark} />
            </div>
          </div>

          {/* Suscripciones próximas */}
          <div className="mt-3 space-y-2 max-h-44 overflow-y-auto pr-1 mac-scrollbar">
            {serviciosPendientes.length > 0 ? (
              serviciosPendientes.slice(0, 4).map(s => (
                <div
                  key={s.id}
                  className="p-2 rounded-xl border flex items-center justify-between text-xs transition-colors"
                  style={{
                    backgroundColor: isDark ? '#1F1F22' : '#F9FAFB',
                    borderColor: t.borderSubtle,
                  }}
                >
                  <div className="min-w-0 pr-2">
                    <p className="font-semibold truncate m-0" style={{ color: t.textMain }}>
                      {s.nombre}
                    </p>
                    <span className="text-[10px]" style={{ color: t.textSub }}>
                      {s.diasRestantes !== null 
                        ? (s.diasRestantes <= 0 ? 'Vence hoy' : `En ${s.diasRestantes} días`) 
                        : (s.fecha_pago || 'Mes en curso')}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="font-mono text-xs font-semibold" style={{ color: t.textMain }}>
                      {s.monto} Bs
                    </span>
                    <button
                      onClick={() => ejecutarPagoServicio(s)}
                      className="px-2 py-1 rounded-lg border text-[10px] font-semibold transition-all hover:opacity-90 active:scale-95"
                      style={{
                        backgroundColor: isDark ? '#2E2E32' : '#E5E7EB',
                        borderColor: t.borderSubtle,
                        color: t.textMain,
                      }}
                    >
                      Pagar
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-center py-4 m-0" style={{ color: t.textSub }}>
                Sin suscripciones pendientes este mes
              </p>
            )}
          </div>
        </Panel>

        {/* ─── PANEL 4: INVENTARIO & CATÁLOGO ─── */}
        <Panel
          title="Inventario & Catálogo"
          icon={Package}
          badge={`${totalUnidadesStock} unidades`}
          action={
            <button 
              onClick={() => onNavigateTo('inventario')}
              className="text-[11px] font-semibold hover:underline flex items-center gap-1"
              style={{ color: t.textMuted }}
            >
              <span>Catálogo</span>
              <ExternalLink size={11} />
            </button>
          }
          isDark={isDark}
        >
          {/* Distribución por Categorías */}
          <div className="pb-3 border-b" style={{ borderColor: t.borderSubtle }}>
            <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-wider mb-2" style={{ color: t.textSub }}>
              <span>Categorías</span>
              <span className="font-mono">{listaProductos.length} referencias</span>
            </div>
            <SegBar segments={categoriasInventarioSegments} height={6} isDark={isDark} />
          </div>

          {/* Chip de Stock Crítico si existe */}
          {stockCritico.length > 0 && (
            <div 
              className="mt-3 p-2 rounded-xl border flex items-center justify-between text-xs"
              style={{
                backgroundColor: isDark ? 'rgba(239, 68, 68, 0.08)' : 'rgba(239, 68, 68, 0.06)',
                borderColor: isDark ? 'rgba(239, 68, 68, 0.25)' : 'rgba(239, 68, 68, 0.2)',
              }}
            >
              <div className="flex items-center gap-2">
                <StatusDot status="danger" size={7} />
                <span className="font-medium text-rose-400">
                  {stockCritico.length} con stock bajo (≤ 5)
                </span>
              </div>
              <button
                onClick={() => handleExport('csv-stock')}
                className="text-[10px] font-semibold text-rose-400 hover:underline"
              >
                Reporte CSV
              </button>
            </div>
          )}

          {/* Vitrina 2x2 compacta de productos */}
          <div className="mt-3 grid grid-cols-2 gap-2">
            {visibleProducts.map(prod => {
              const img = prod.imagen || (Array.isArray(prod.imagenes) && prod.imagenes[0]) || null;
              const stock = parseInt(prod.stock_actual || prod.stock || 0);

              return (
                <div
                  key={prod.id}
                  className="p-2 rounded-xl border flex flex-col justify-between text-xs transition-colors"
                  style={{
                    backgroundColor: isDark ? '#1F1F22' : '#F9FAFB',
                    borderColor: t.borderSubtle,
                  }}
                >
                  <div className="w-full h-16 rounded-lg overflow-hidden flex items-center justify-center relative mb-1.5" style={{ backgroundColor: isDark ? '#141416' : '#FFFFFF' }}>
                    {img ? (
                      <img src={img} alt={prod.nombre} className="w-full h-full object-contain p-0.5" />
                    ) : (
                      <Package size={20} style={{ color: t.textSub }} />
                    )}
                    <span 
                      className="absolute top-1 right-1 text-[8px] font-bold px-1 rounded"
                      style={{
                        backgroundColor: stock <= 5 ? '#EF4444' : (isDark ? '#2E2E32' : '#E5E7EB'),
                        color: stock <= 5 ? '#FFFFFF' : t.textMain,
                      }}
                    >
                      {stock}u
                    </span>
                  </div>

                  <p className="font-semibold truncate m-0 text-[11px]" style={{ color: t.textMain }} title={prod.nombre}>
                    {prod.nombre}
                  </p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="font-mono text-[11px] font-bold" style={{ color: t.textMain }}>
                      {prod.precio_venta || 0} Bs
                    </span>
                    <button
                      onClick={() => handleShareWhatsAppProduct(prod)}
                      title="Compartir por WhatsApp"
                      className="p-1 rounded-md border text-[10px] transition-transform active:scale-90"
                      style={{
                        backgroundColor: isDark ? '#2A2A2D' : '#F3F4F6',
                        borderColor: t.borderSubtle,
                        color: t.textMuted,
                      }}
                    >
                      <Smartphone size={10} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>

        {/* ─── PANEL 5: CALENDARIO 7 DÍAS ─── */}
        <Panel
          title="Próximos 7 Días"
          icon={Calendar}
          badge={`${selectedDayInfo.eventCount} eventos`}
          action={
            <div className="flex items-center gap-1">
              <button
                onClick={() => setTimelineDayOffset(prev => prev - 7)}
                className="w-5 h-5 rounded-md border flex items-center justify-center transition-colors"
                style={{ backgroundColor: isDark ? '#232326' : '#F3F4F6', borderColor: t.borderSubtle, color: t.textMain }}
              >
                <ChevronLeft size={12} />
              </button>
              <button
                onClick={() => setTimelineDayOffset(prev => prev + 7)}
                className="w-5 h-5 rounded-md border flex items-center justify-center transition-colors"
                style={{ backgroundColor: isDark ? '#232326' : '#F3F4F6', borderColor: t.borderSubtle, color: t.textMain }}
              >
                <ChevronRight size={12} />
              </button>
            </div>
          }
          isDark={isDark}
        >
          {/* Fila de 7 Días con Infografía WeekDots */}
          <WeekDots
            days={timelineDays.map((d, idx) => ({ ...d, isSelected: selectedTimelineDay === idx }))}
            onSelectDay={setSelectedTimelineDay}
            isDark={isDark}
          />

          {/* Tarjeta de Eventos en el Día Seleccionado */}
          <div 
            className="mt-3 p-2.5 rounded-xl border space-y-2"
            style={{
              backgroundColor: isDark ? '#1F1F22' : '#F9FAFB',
              borderColor: t.borderSubtle,
            }}
          >
            <div className="flex items-center justify-between text-[11px] font-semibold" style={{ color: t.textMain }}>
              <span>
                {selectedDayInfo.isToday ? 'Hoy' : `${selectedDayInfo.diaNom} ${selectedDayInfo.diaNum}`}
              </span>
              <span className="text-[10px] font-mono" style={{ color: t.textSub }}>
                {selectedDayInfo.eventCount} {selectedDayInfo.eventCount === 1 ? 'vencimiento' : 'vencimientos'}
              </span>
            </div>

            {selectedDayInfo.hasEvents ? (
              <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1 mac-scrollbar text-xs">
                {selectedDayInfo.cobrosEnDia.map(p => (
                  <div 
                    key={p.id}
                    className="p-1.5 rounded-lg flex items-center justify-between border"
                    style={{ backgroundColor: isDark ? '#232326' : '#FFFFFF', borderColor: t.borderSubtle }}
                  >
                    <span className="truncate pr-2 font-medium" style={{ color: t.textMain }}>{p.nombre}</span>
                    <span className="font-mono font-bold" style={{ color: t.textMain }}>+{Math.round(p.cuotaCalculada || 0)} Bs</span>
                  </div>
                ))}
                {selectedDayInfo.serviciosEnDia.map(s => (
                  <div 
                    key={s.id}
                    className="p-1.5 rounded-lg flex items-center justify-between border"
                    style={{ backgroundColor: isDark ? '#232326' : '#FFFFFF', borderColor: t.borderSubtle }}
                  >
                    <span className="truncate pr-2 font-medium" style={{ color: t.textMain }}>{s.nombre}</span>
                    <span className="font-mono font-bold" style={{ color: t.textMuted }}>-{s.monto} Bs</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-center py-2 m-0" style={{ color: t.textSub }}>
                Sin vencimientos programados
              </p>
            )}
          </div>
        </Panel>

        {/* ─── PANEL 6: FLUJO DE CAJA & BALANCE OPERATIVO ─── */}
        <Panel
          title="Flujo de Caja"
          icon={TrendingUp}
          badge="Operativo"
          isDark={isDark}
        >
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider m-0" style={{ color: t.textSub }}>
              Balance Neto del Período
            </p>
            <h2 className="text-2xl font-black tracking-tight m-0 mt-0.5" style={{ color: t.textMain }}>
              {Math.round(cashflowData.neto).toLocaleString()} <span className="text-xs font-normal" style={{ color: t.textSub }}>Bs</span>
            </h2>
          </div>

          {/* Gráfico de Barras Segmentadas: Entradas vs Salidas */}
          <div className="mt-3 space-y-2">
            <SegBar segments={cashflowData.segments} height={8} isDark={isDark} />
          </div>

          <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t text-xs" style={{ borderColor: t.borderSubtle }}>
            <div 
              className="p-2 rounded-xl border"
              style={{ backgroundColor: isDark ? '#1F1F22' : '#F9FAFB', borderColor: t.borderSubtle }}
            >
              <span className="text-[10px] block font-semibold" style={{ color: t.textSub }}>Entradas</span>
              <span className="font-mono font-bold text-sm block mt-0.5" style={{ color: t.textMain }}>
                +{Math.round(cashflowData.inflows).toLocaleString()} Bs
              </span>
            </div>

            <div 
              className="p-2 rounded-xl border"
              style={{ backgroundColor: isDark ? '#1F1F22' : '#F9FAFB', borderColor: t.borderSubtle }}
            >
              <span className="text-[10px] block font-semibold" style={{ color: t.textSub }}>Salidas</span>
              <span className="font-mono font-bold text-sm block mt-0.5" style={{ color: t.textMuted }}>
                -{Math.round(cashflowData.outflows).toLocaleString()} Bs
              </span>
            </div>
          </div>
        </Panel>

      </div>

      {/* ─── MODALES DE OPERACIÓN ─── */}
      <CommandModal
        isOpen={modalPago.isOpen}
        onClose={() => setModalPago({ isOpen: false, prestamo: null })}
        onConfirm={confirmarCobro}
        titulo={`Confirmar Cobro — ${modalPago.prestamo?.nombre || ''}`}
        mensaje={`¿Registrar cobro de cuota por ${modalPago.prestamo?.cuotaCalculada ? Math.round(modalPago.prestamo.cuotaCalculada) : 0} Bs para el período ${periodoMes}?`}
        icono={<DollarSign size={20} />}
        colorAccent={isDark ? '#E5E7EB' : '#1F2937'}
        confirmText="Confirmar Cobro"
        cancelText="Cancelar"
        isDark={isDark}
      />

      <CommandModal
        isOpen={modalServicio.isOpen}
        onClose={() => setModalServicio({ isOpen: false, servicio: null })}
        onConfirm={confirmarPagoServicio}
        titulo={`Confirmar Pago — ${modalServicio.servicio?.nombre || ''}`}
        mensaje={`¿Registrar pago del servicio ${modalServicio.servicio?.nombre || ''} por ${modalServicio.servicio?.monto || 0} Bs?`}
        icono={<Wallet size={20} />}
        colorAccent={isDark ? '#E5E7EB' : '#1F2937'}
        confirmText="Registrar Pago"
        cancelText="Cancelar"
        isDark={isDark}
      />

      <ResumenIAModal
        isOpen={modalIA.isOpen}
        onClose={() => setModalIA({ isOpen: false, contenido: '', cargando: false })}
        contenido={modalIA.contenido}
        cargando={modalIA.cargando}
        isDark={isDark}
        titulo="Análisis Ejecutivo de Situación Operativa"
      />

    </div>
  );
};

export default CommandCenter;
