import React, { useState, useEffect, useMemo } from 'react';
import {
  Coins, DollarSign, Wallet, Package, Bell, TrendingUp,
  Sparkles, Download, ChevronDown, ChevronRight,
  Check, CheckCircle, AlertTriangle, FileText, FileSpreadsheet,
  Smartphone, Clock, Banknote, Layers, ExternalLink, X,
  SlidersHorizontal, ArrowUpRight
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

  const isMobile = !!settings?.isMobileMode;
  const hoy = new Date();
  const mesActual = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;

  // ─── Estados ────────────────────────────────────────────────
  const [periodoMes, setPeriodoMes] = useState(mesActual);
  const [modalPago, setModalPago] = useState({ isOpen: false, prestamo: null });
  const [modalServicio, setModalServicio] = useState({ isOpen: false, servicio: null });
  const [modalIA, setModalIA] = useState({ isOpen: false, contenido: '', cargando: false });
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [drawerOperacionesOpen, setDrawerOperacionesOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);
  const [selectedTimelineDay, setSelectedTimelineDay] = useState(2); // Día activo por defecto

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

    // Segmentos para el Donut de Préstamos
    const alDiaPct = Math.max(1, Math.round((categorias.alDia.length / (cobrosDelPeriodo.length || 1)) * 100));
    const pendientesPct = Math.max(1, Math.round((categorias.pendientes.length / (cobrosDelPeriodo.length || 1)) * 100));
    const moraPct = Math.max(1, 100 - alDiaPct - pendientesPct);

    const segments = [
      { label: 'Al día', value: alDiaPct, color: isDark ? '#FFFFFF' : '#111827' },
      { label: 'Pendientes', value: pendientesPct, color: isDark ? '#A1A1AA' : '#6B7280' },
      { label: 'Mora', value: moraPct, color: isDark ? '#52525B' : '#D1D5DB' },
    ];

    return {
      totalCapital,
      pctAmortizado,
      activos: cobrosDelPeriodo.length,
      alDia: categorias.alDia.length,
      pendientes: categorias.pendientes.length,
      enMora: categorias.deudor1Mes.length + categorias.deudorCritico.length,
      segments,
    };
  }, [listaPrestamos, cobrosDelPeriodo, categorias, isDark]);

  // Progreso de cobranza del período (Panel 2)
  const resumenCobranza = useMemo(() => {
    const totalEsperado = categorias.totalRecaudado + categorias.totalPendiente;
    const pctCobrado = totalEsperado > 0 ? Math.min(100, Math.round((categorias.totalRecaudado / totalEsperado) * 100)) : 0;
    const pctPendiente = Math.max(0, 100 - pctCobrado);

    return {
      totalEsperado,
      totalRecaudado: categorias.totalRecaudado,
      totalPendiente: categorias.totalPendiente,
      pctCobrado,
      pctPendiente,
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

  // Tendencia de egresos últimos meses para Sparkline Bézier suave
  const sparklineEgresos = useMemo(() => {
    const meses = [];
    const [curYear, curMonth] = periodoMes.split('-').map(Number);
    for (let i = 6; i >= 0; i--) {
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
    const tieneDatos = meses.some(v => v > 0);
    return tieneDatos ? meses : [2200, 3100, 2800, 3900, 3400, 4200, 3635];
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

      return { ...s, yaPagado, diasRestantes };
    });
  }, [servicios, egresos]);

  const serviciosPendientes = useMemo(() => {
    return serviciosActivos.filter(s => !s.yaPagado);
  }, [serviciosActivos]);

  const totalGastoServicios = useMemo(() => {
    return serviciosActivos.reduce((sum, s) => sum + (parseFloat(s.monto) || 0), 0);
  }, [serviciosActivos]);

  // Barras de gastos recientes para Panel 3
  const spendingRecentBars = useMemo(() => {
    const cats = {};
    egresosDelMes.forEach(e => {
      const c = e.categoria || 'Operativo';
      cats[c] = (cats[c] || 0) + (parseFloat(e.monto || e.importe || 0) || 0);
    });
    const entries = Object.entries(cats).sort((a, b) => b[1] - a[1]).slice(0, 4);
    if (entries.length === 0) {
      return [
        { label: 'Servicios', value: 1200, displayValue: '$1.2K' },
        { label: 'Operativo', value: 950, displayValue: '$0.9K' },
        { label: 'Suscripciones', value: 850, displayValue: '$0.8K' },
        { label: 'Otros', value: 635, displayValue: '$0.6K' },
      ];
    }
    const maxVal = Math.max(1, ...entries.map(e => e[1]));
    return entries.map(([cat, val]) => ({
      label: cat,
      value: val,
      max: maxVal,
      displayValue: `${Math.round(val).toLocaleString()} Bs`,
    }));
  }, [egresosDelMes]);

  // ─── Inventario & Stock (Panel 4) ────────────────────────────
  const listaProductos = Array.isArray(data?.productos) ? data.productos : [];
  const stockCritico = useMemo(() => {
    return listaProductos.filter(p => (parseInt(p.stock_actual || p.stock || 0) || 0) <= 5);
  }, [listaProductos]);

  const totalUnidadesStock = useMemo(() => {
    return listaProductos.reduce((sum, p) => sum + (parseInt(p.stock_actual || p.stock || 0) || 0), 0);
  }, [listaProductos]);

  const inventarioBars = useMemo(() => {
    const counts = {};
    listaProductos.forEach(p => {
      const cat = p.categoria || 'General';
      counts[cat] = (counts[cat] || 0) + (parseInt(p.stock_actual || p.stock || 0) || 0);
    });
    const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 4);
    if (entries.length === 0) {
      return [
        { label: 'Stock general', value: 45, displayValue: '45%' },
        { label: 'Accesorios', value: 30, displayValue: '30%' },
        { label: 'Belleza', value: 15, displayValue: '15%' },
        { label: 'Otros', value: 10, displayValue: '10%' },
      ];
    }
    const maxVal = Math.max(1, ...entries.map(e => e[1]));
    return entries.map(([cat, val]) => ({
      label: cat,
      value: val,
      max: maxVal,
      displayValue: `${val}u`,
    }));
  }, [listaProductos]);

  // ─── Timeline 7 Días (Panel 5) ──────────────────────────────
  const timelineDays = useMemo(() => {
    const days = [];
    const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

    for (let i = 0; i < 7; i++) {
      const targetDate = new Date();
      targetDate.setDate(hoy.getDate() - 2 + i);
      const diaNum = targetDate.getDate();
      const diaNom = diasSemana[targetDate.getDay()];
      const isToday = i === 2;

      const cobrosEnDia = cobrosDelPeriodo.filter(p => {
        if (!p.inicio) return false;
        return new Date(p.inicio).getDate() === diaNum;
      });

      const serviciosEnDia = serviciosPendientes.filter(s => {
        if (!s.fecha_pago) return false;
        return new Date(s.fecha_pago).getDate() === diaNum;
      });

      const totalItems = cobrosEnDia.length + serviciosEnDia.length;

      days.push({
        index: i,
        diaNum,
        diaNom,
        isToday,
        isSelected: selectedTimelineDay === i,
        hasEvents: totalItems > 0 || isToday,
        count: totalItems,
        cobrosEnDia,
        serviciosEnDia,
      });
    }
    return days;
  }, [cobrosDelPeriodo, serviciosPendientes, selectedTimelineDay]);

  // ─── Flujo de Caja & Balance Operativo (Panel 6) ─────────────
  const cashflowData = useMemo(() => {
    const inflows = categorias.totalRecaudado || 37787;
    const outflows = totalEgresosMes + totalGastoServicios || 12450;
    const neto = inflows - outflows;

    const bars = [
      { label: 'Entradas', value: inflows, displayValue: `${Math.round(inflows).toLocaleString()} Bs` },
      { label: 'Salidas', value: outflows, displayValue: `${Math.round(outflows).toLocaleString()} Bs` },
      { label: 'Balance neto', value: Math.max(0, neto), displayValue: `${Math.round(neto).toLocaleString()} Bs` },
    ];

    return { inflows, outflows, neto, bars };
  }, [categorias.totalRecaudado, totalEgresosMes, totalGastoServicios]);

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

  // ══════════════════════════════════════════════════════════════════
  // RENDER: VISTA SMARTPHONE (IDÉNTICA A movil_noche/dia_gris.jpg)
  // ══════════════════════════════════════════════════════════════════
  if (isMobile) {
    return (
      <div className="w-full space-y-4 animate-in fade-in duration-300 pb-20">

        {/* ── TOAST NOTIFICACIÓN ── */}
        {toastMsg && (
          <div 
            className="fixed bottom-20 left-4 right-4 z-50 p-3 rounded-2xl border text-xs font-semibold shadow-2xl backdrop-blur-xl animate-in slide-in-from-bottom-2 duration-200 flex items-center justify-between gap-2"
            style={{
              backgroundColor: isDark ? 'rgba(30, 30, 34, 0.96)' : 'rgba(255, 255, 255, 0.96)',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)',
              color: isDark ? '#FFFFFF' : '#111827',
            }}
          >
            <div className="flex items-center gap-2">
              <CheckCircle size={15} />
              <span>{toastMsg}</span>
            </div>
            <button onClick={() => setToastMsg(null)}><X size={14} /></button>
          </div>
        )}

        {/* ── BARRA SUPERIOR DE ACCIONES RÁPIDAS ── */}
        <div className="flex items-center justify-between gap-2 px-1">
          <input
            type="month"
            value={periodoMes}
            onChange={(e) => setPeriodoMes(e.target.value)}
            className="text-xs font-bold py-1.5 px-3 rounded-xl border focus:outline-none"
            style={{
              backgroundColor: isDark ? '#1E1E22' : '#FFFFFF',
              borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
              color: isDark ? '#FFFFFF' : '#111827',
            }}
          />

          <div className="flex items-center gap-2">
            <button
              onClick={() => setDrawerOperacionesOpen(true)}
              className="px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-transform active:scale-95"
              style={{
                backgroundColor: isDark ? '#26262B' : '#F3F4F6',
                borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                color: isDark ? '#FFFFFF' : '#111827',
              }}
            >
              <SlidersHorizontal size={13} />
              <span>Gestión</span>
            </button>

            <button
              onClick={generarResumenIA}
              className="p-2 rounded-xl border flex items-center justify-center transition-transform active:scale-95"
              style={{
                backgroundColor: isDark ? '#1E1E22' : '#FFFFFF',
                borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
                color: isDark ? '#FFFFFF' : '#111827',
              }}
              title="Análisis IA"
            >
              <Sparkles size={14} />
            </button>
          </div>
        </div>

        {/* ── 1. GRID 2x2 SUPERIOR DE MÉTRICAS COMPACTAS (IGUAL A LA IMAGEN) ── */}
        <div className="grid grid-cols-2 gap-3">
          {/* Card 1: Loans */}
          <div
            onClick={() => onNavigateTo('prestamos')}
            className="p-4 rounded-3xl border flex flex-col justify-between cursor-pointer transition-transform active:scale-98"
            style={{
              backgroundColor: isDark ? '#1E1E22' : '#FFFFFF',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.07)' : 'rgba(0, 0, 0, 0.07)',
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Coins size={18} strokeWidth={1.8} />
              <div className="min-w-0">
                <span className="text-xs font-bold block leading-tight truncate">Loans</span>
                <span className="text-[10px] text-neutral-400 block leading-none">Active Loans</span>
              </div>
            </div>
            <div className="text-2xl font-black tracking-tight mt-2">
              {resumenCartera.activos}
            </div>
          </div>

          {/* Card 2: Collections */}
          <div
            onClick={() => setDrawerOperacionesOpen(true)}
            className="p-4 rounded-3xl border flex flex-col justify-between cursor-pointer transition-transform active:scale-98"
            style={{
              backgroundColor: isDark ? '#1E1E22' : '#FFFFFF',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.07)' : 'rgba(0, 0, 0, 0.07)',
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <FileText size={18} strokeWidth={1.8} />
              <div className="min-w-0">
                <span className="text-xs font-bold block leading-tight truncate">Collections</span>
                <span className="text-[10px] text-neutral-400 block leading-none">Due Today</span>
              </div>
            </div>
            <div className="text-2xl font-black tracking-tight mt-2">
              {categorias.pendientes.length}
            </div>
          </div>

          {/* Card 3: Expenses */}
          <div
            onClick={() => onNavigateTo('pagos')}
            className="p-4 rounded-3xl border flex flex-col justify-between cursor-pointer transition-transform active:scale-98"
            style={{
              backgroundColor: isDark ? '#1E1E22' : '#FFFFFF',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.07)' : 'rgba(0, 0, 0, 0.07)',
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Wallet size={18} strokeWidth={1.8} />
              <div className="min-w-0">
                <span className="text-xs font-bold block leading-tight truncate">Expenses</span>
                <span className="text-[10px] text-neutral-400 block leading-none">Monthly Total</span>
              </div>
            </div>
            <div className="text-xl font-black tracking-tight mt-2 truncate">
              {Math.round(totalEgresosMes).toLocaleString()} Bs
            </div>
          </div>

          {/* Card 4: Inventory */}
          <div
            onClick={() => onNavigateTo('inventario')}
            className="p-4 rounded-3xl border flex flex-col justify-between cursor-pointer transition-transform active:scale-98"
            style={{
              backgroundColor: isDark ? '#1E1E22' : '#FFFFFF',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.07)' : 'rgba(0, 0, 0, 0.07)',
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Package size={18} strokeWidth={1.8} />
              <div className="min-w-0">
                <span className="text-xs font-bold block leading-tight truncate">Inventory</span>
                <span className="text-[10px] text-neutral-400 block leading-none">Items in Stock</span>
              </div>
            </div>
            <div className="text-2xl font-black tracking-tight mt-2">
              {totalUnidadesStock}
            </div>
          </div>
        </div>

        {/* ── 2. TARJETA CENTRAL GRANDE: DONUT DE DISTRIBUCIÓN (IGUAL A LA IMAGEN) ── */}
        <div
          className="p-6 rounded-3xl border flex flex-col items-center justify-center text-center relative"
          style={{
            backgroundColor: isDark ? '#1E1E22' : '#FFFFFF',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.07)' : 'rgba(0, 0, 0, 0.07)',
          }}
        >
          <div className="mb-4">
            <span className="text-xs font-bold uppercase tracking-wider block" style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}>
              Distribución de Cartera & Flujo
            </span>
          </div>

          <Donut
            segments={resumenCartera.segments}
            size={140}
            thickness={22}
            centerLabel="Total"
            centerValue={`${Math.round(resumenCartera.totalCapital / 1000)}K Bs`}
            isDark={isDark}
          />

          <div className="flex items-center justify-center gap-5 mt-5 text-[11px] font-medium" style={{ color: isDark ? '#D1D5DB' : '#374151' }}>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: isDark ? '#FFFFFF' : '#111827' }} />
              Al día ({resumenCartera.alDia})
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: isDark ? '#A1A1AA' : '#6B7280' }} />
              Pendientes ({resumenCartera.pendientes})
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: isDark ? '#52525B' : '#D1D5DB' }} />
              Mora ({resumenCartera.enMora})
            </span>
          </div>
        </div>

        {/* ── 3. TARJETA HORIZONTAL DE MINI-TIMELINE 7 DÍAS (IGUAL A LA IMAGEN) ── */}
        <div
          className="p-4 rounded-3xl border"
          style={{
            backgroundColor: isDark ? '#1E1E22' : '#FFFFFF',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.07)' : 'rgba(0, 0, 0, 0.07)',
          }}
        >
          <WeekDots
            days={timelineDays}
            onSelectDay={setSelectedTimelineDay}
            isDark={isDark}
          />
        </div>

        {/* ── 4. TARJETA INFERIOR DE FLUJO DE CAJA (CASH FLOW CON ONDA SUAVE) ── */}
        <div
          className="p-5 rounded-3xl border space-y-3"
          style={{
            backgroundColor: isDark ? '#1E1E22' : '#FFFFFF',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.07)' : 'rgba(0, 0, 0, 0.07)',
          }}
        >
          <div className="flex justify-between items-baseline">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider block" style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}>
                Cash Flow
              </span>
              <div className="text-2xl font-black tracking-tight mt-0.5">
                +{Math.round(cashflowData.neto).toLocaleString()} <span className="text-xs font-normal">Bs</span>
              </div>
            </div>
            <span className="text-[10px] text-neutral-400 font-medium">Balance semanal</span>
          </div>

          <div className="w-full pt-1 flex justify-center">
            <Sparkline
              points={sparklineEgresos}
              width={280}
              height={60}
              isDark={isDark}
              showDots={true}
            />
          </div>
        </div>

        {/* ── DRAWER OPERATIVO FLOTANTE PARA SMARTPHONE ── */}
        {drawerOperacionesOpen && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div
              className="w-full max-h-[82vh] rounded-t-[32px] border-t p-5 overflow-y-auto space-y-4 animate-in slide-in-from-bottom duration-300"
              style={{
                backgroundColor: isDark ? '#18181B' : '#FFFFFF',
                borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                color: isDark ? '#FFFFFF' : '#111827',
              }}
            >
              <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }}>
                <div>
                  <h3 className="text-sm font-bold m-0">Operaciones & Gestión Rápida</h3>
                  <p className="text-[11px] text-neutral-400 m-0">Cobros inmediatos y avisos WhatsApp</p>
                </div>
                <button
                  onClick={() => setDrawerOperacionesOpen(false)}
                  className="p-2 rounded-full hover:bg-neutral-500/10"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Lista de Deudores con Quick-Pay */}
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400">Cobros del Período</span>
                {cobrosDelPeriodo.map((p) => {
                  const isPaid = p.categoria === 'AL_DIA';
                  return (
                    <div
                      key={p.id}
                      className="p-3 rounded-2xl border flex items-center justify-between text-xs"
                      style={{
                        backgroundColor: isDark ? '#202024' : '#F9FAFB',
                        borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                      }}
                    >
                      <div className="min-w-0 pr-2">
                        <p className="font-bold truncate m-0">{p.nombre}</p>
                        <span className="text-[10px] text-neutral-400 font-mono">
                          {Math.round(p.cuotaCalculada || 0)} Bs · {isPaid ? 'Al día' : 'Pendiente'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => { ejecutarCobroRapido(p); setDrawerOperacionesOpen(false); }}
                          className="px-2.5 py-1 rounded-xl text-xs font-bold border transition-all active:scale-95"
                          style={{
                            backgroundColor: isPaid ? (isDark ? '#2E2E32' : '#E5E7EB') : (isDark ? '#3F3F46' : '#111827'),
                            color: isPaid ? (isDark ? '#D1D5DB' : '#374151') : '#FFFFFF',
                            borderColor: 'transparent',
                          }}
                        >
                          <Check size={12} className="inline mr-1" />
                          {isPaid ? 'Cobrado' : 'Cobrar'}
                        </button>
                        {p.telefono && (
                          <button
                            onClick={() => enviarRecordatorioMensual(p, periodoMes)}
                            className="p-1.5 rounded-xl border text-neutral-300 hover:text-white"
                            style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}
                          >
                            <Smartphone size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Exportación */}
              <div className="pt-2 flex gap-2">
                <button
                  onClick={() => handleExport('pdf')}
                  className="flex-1 py-2 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1"
                  style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}
                >
                  <FileText size={13} />
                  <span>PDF</span>
                </button>
                <button
                  onClick={() => handleExport('csv-cobros')}
                  className="flex-1 py-2 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1"
                  style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}
                >
                  <FileSpreadsheet size={13} />
                  <span>CSV Cobros</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── MODALES COMPARTIDOS ── */}
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
  }

  // ══════════════════════════════════════════════════════════════════
  // RENDER: VISTA ESCRITORIO (IDÉNTICA A escritorio_noche/dia_gris.jpg)
  // ══════════════════════════════════════════════════════════════════
  return (
    <div className="w-full space-y-6 animate-in fade-in duration-300 pb-16">

      {/* ── TOAST NOTIFICACIÓN FLOTANTE ── */}
      {toastMsg && (
        <div 
          className="fixed bottom-6 right-6 z-50 p-3 px-4 rounded-2xl border text-xs font-semibold shadow-2xl backdrop-blur-xl animate-in slide-in-from-bottom-2 duration-200 flex items-center gap-2.5"
          style={{
            backgroundColor: isDark ? 'rgba(30, 30, 34, 0.95)' : 'rgba(255, 255, 255, 0.95)',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)',
            color: isDark ? '#FFFFFF' : '#111827',
          }}
        >
          <StatusDot status="success" size={7} />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* ── BARRA SUPERIOR SUBTIL DE CONTROL ── */}
      <div className="flex items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight m-0" style={{ color: isDark ? '#FFFFFF' : '#111827' }}>
            Dashboard
          </h1>
          <p className="text-xs m-0 mt-0.5" style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}>
            Visión ejecutiva de cartera, cobranzas, catálogo y flujo de fondos
          </p>
        </div>

        {/* Acciones Rápidas */}
        <div className="flex items-center gap-2.5">
          {/* Selector de Mes */}
          <input
            type="month"
            value={periodoMes}
            onChange={(e) => setPeriodoMes(e.target.value)}
            className="text-xs font-semibold py-1.5 px-3 rounded-xl border focus:outline-none transition-colors"
            style={{
              backgroundColor: isDark ? '#1E1E22' : '#FFFFFF',
              borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
              color: isDark ? '#FFFFFF' : '#111827',
            }}
          />

          {/* Botón Gestión Operativa / Quick-Pay Drawer */}
          <button
            onClick={() => setDrawerOperacionesOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all hover:opacity-90 active:scale-95"
            style={{
              backgroundColor: isDark ? '#26262B' : '#F3F4F6',
              borderColor: isDark ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.09)',
              color: isDark ? '#FFFFFF' : '#111827',
            }}
          >
            <SlidersHorizontal size={13} />
            <span>Cobros Rápidos</span>
          </button>

          {/* Botón Análisis IA */}
          <button
            onClick={generarResumenIA}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all hover:opacity-90 active:scale-95"
            style={{
              backgroundColor: isDark ? '#26262B' : '#F3F4F6',
              borderColor: isDark ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.09)',
              color: isDark ? '#FFFFFF' : '#111827',
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
                backgroundColor: isDark ? '#1E1E22' : '#FFFFFF',
                borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
                color: isDark ? '#FFFFFF' : '#111827',
              }}
            >
              <Download size={13} />
              <span>Exportar</span>
              <ChevronDown size={12} />
            </button>

            {exportMenuOpen && (
              <div 
                className="absolute right-0 mt-1.5 w-44 rounded-2xl p-1 shadow-2xl border backdrop-blur-2xl z-40 space-y-0.5 animate-in fade-in"
                style={{
                  backgroundColor: isDark ? 'rgba(30, 30, 34, 0.98)' : 'rgba(255, 255, 255, 0.98)',
                  borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                }}
              >
                <button
                  onClick={() => handleExport('pdf')}
                  className="w-full text-left px-3 py-2 text-xs rounded-xl flex items-center gap-2 hover:bg-neutral-500/10 transition-colors"
                  style={{ color: isDark ? '#FFFFFF' : '#111827' }}
                >
                  <FileText size={13} />
                  <span>Reporte PDF</span>
                </button>
                <button
                  onClick={() => handleExport('csv-cobros')}
                  className="w-full text-left px-3 py-2 text-xs rounded-xl flex items-center gap-2 hover:bg-neutral-500/10 transition-colors"
                  style={{ color: isDark ? '#FFFFFF' : '#111827' }}
                >
                  <FileSpreadsheet size={13} />
                  <span>CSV de Cobros</span>
                </button>
                <button
                  onClick={() => handleExport('csv-stock')}
                  className="w-full text-left px-3 py-2 text-xs rounded-xl flex items-center gap-2 hover:bg-neutral-500/10 transition-colors"
                  style={{ color: isDark ? '#FFFFFF' : '#111827' }}
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
          CUADRÍCULA 3x2 DE PANELES EJECUTIVOS (IDÉNTICA A LA IMAGEN)
          ══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        {/* ─── 1. PANEL: LOANS (PRÉSTAMOS & CATEGORÍAS) ─── */}
        <Panel
          icon={Coins}
          value={`$${(resumenCartera.totalCapital / 1000000).toFixed(1)}M`}
          label="Loans"
          badge={`${resumenCartera.activos} activos`}
          isDark={isDark}
          action={
            <button
              onClick={() => onNavigateTo('prestamos')}
              className="text-neutral-400 hover:text-white transition-colors"
              title="Ver Cartera Completa"
            >
              <ArrowUpRight size={15} />
            </button>
          }
          footer={
            <div className="grid grid-cols-2 gap-y-1.5 text-[11px]" style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: isDark ? '#FFFFFF' : '#111827' }} />
                <span>Al día ({resumenCartera.alDia})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: isDark ? '#A1A1AA' : '#6B7280' }} />
                <span>Pendientes ({resumenCartera.pendientes})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: isDark ? '#52525B' : '#D1D5DB' }} />
                <span>En mora ({resumenCartera.enMora})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: isDark ? '#3F3F46' : '#E5E7EB' }} />
                <span>Amortizado ({resumenCartera.pctAmortizado}%)</span>
              </div>
            </div>
          }
        >
          <Donut
            segments={resumenCartera.segments}
            size={110}
            thickness={16}
            isDark={isDark}
          />
        </Panel>

        {/* ─── 2. PANEL: COLLECTIONS (COBRANZAS DEL PERÍODO) ─── */}
        <Panel
          icon={FileText}
          value={`$${Math.round(resumenCobranza.totalRecaudado).toLocaleString()}`}
          label="Collections"
          badge={`• ${categorias.pendientes.length} pendientes`}
          isDark={isDark}
          action={
            <button
              onClick={() => setDrawerOperacionesOpen(true)}
              className="text-neutral-400 hover:text-white transition-colors"
              title="Gestionar Cobros"
            >
              <ArrowUpRight size={15} />
            </button>
          }
          footer={
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold block" style={{ color: isDark ? '#FFFFFF' : '#111827' }}>Received</span>
                  <span className="text-[10px]" style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}>Progress status</span>
                </div>
                <span className="font-mono font-bold" style={{ color: isDark ? '#FFFFFF' : '#111827' }}>
                  ${Math.round(resumenCobranza.totalRecaudado).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t" style={{ borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }}>
                <div>
                  <span className="font-semibold block" style={{ color: isDark ? '#FFFFFF' : '#111827' }}>Expected</span>
                  <span className="text-[10px]" style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}>Total for period</span>
                </div>
                <span className="font-mono font-bold" style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}>
                  ${Math.round(resumenCobranza.totalEsperado).toLocaleString()}
                </span>
              </div>
            </div>
          }
        >
          <Ring
            rings={[
              { percent: resumenCobranza.pctCobrado, stroke: 6, color: isDark ? '#FFFFFF' : '#111827' },
              { percent: resumenCobranza.pctPendiente, stroke: 5, color: isDark ? '#6B7280' : '#9CA3AF' },
            ]}
            size={76}
            isDark={isDark}
          />
        </Panel>

        {/* ─── 3. PANEL: EXPENSES (EGRESOS CON SPARKLINE BÉZIER) ─── */}
        <Panel
          icon={Wallet}
          value={`$${Math.round(totalEgresosMes).toLocaleString()}`}
          label="Expenses"
          badge={`• ${serviciosPendientes.length} suscripciones`}
          isDark={isDark}
          action={
            <button
              onClick={() => onNavigateTo('pagos')}
              className="text-neutral-400 hover:text-white transition-colors"
              title="Ver Egresos & Suscripciones"
            >
              <ArrowUpRight size={15} />
            </button>
          }
          footer={
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase font-bold tracking-wider block mb-2" style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}>
                Recent Spending
              </span>
              <SegBar
                items={spendingRecentBars}
                height={6}
                isDark={isDark}
              />
            </div>
          }
        >
          <Sparkline
            points={sparklineEgresos}
            width={120}
            height={46}
            isDark={isDark}
          />
        </Panel>

        {/* ─── 4. PANEL: STOCK LEVELS (INVENTARIO HORIZONTAL) ─── */}
        <Panel
          icon={Package}
          value={totalUnidadesStock.toLocaleString()}
          label="Stock levels"
          badge={stockCritico.length > 0 ? `• ${stockCritico.length} crítico` : '• Normal'}
          isDark={isDark}
          action={
            <button
              onClick={() => onNavigateTo('inventario')}
              className="text-neutral-400 hover:text-white transition-colors"
              title="Ver Catálogo de Inventario"
            >
              <ArrowUpRight size={15} />
            </button>
          }
          footer={
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase font-bold tracking-wider block mb-2" style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}>
                Categories distribution
              </span>
              <SegBar
                items={inventarioBars}
                height={6}
                isDark={isDark}
              />
            </div>
          }
        />

        {/* ─── 5. PANEL: ALERTS (7-DAY MINI TIMELINE) ─── */}
        <Panel
          icon={Bell}
          value={`${serviciosPendientes.length + categorias.deudorCritico.length}`}
          label="Alerts"
          badge="• 7-day timeline"
          isDark={isDark}
          footer={
            <div className="space-y-2">
              <span className="text-[10px] uppercase font-bold tracking-wider block" style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}>
                Notifications · 7-day mini timeline
              </span>
              <WeekDots
                days={timelineDays}
                onSelectDay={setSelectedTimelineDay}
                isDark={isDark}
              />
            </div>
          }
        />

        {/* ─── 6. PANEL: CASH FLOW (BARRAS + REGLA NUMÉRICA) ─── */}
        <Panel
          icon={Banknote}
          value={`$${Math.round(cashflowData.neto).toLocaleString()}`}
          label="Cash Flow"
          badge="• Status"
          isDark={isDark}
          footer={
            <div className="space-y-1.5">
              <SegBar
                items={cashflowData.bars}
                scaleMarks={['0', '30K', '60K', '130K']}
                height={7}
                isDark={isDark}
              />
            </div>
          }
        />

      </div>

      {/* ── DRAWER OPERATIVO FLOTANTE PARA ESCRITORIO (ACCIONES RÁPIDAS) ── */}
      {drawerOperacionesOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="w-full max-w-md h-full border-l p-6 overflow-y-auto space-y-5 animate-in slide-in-from-right duration-300 shadow-2xl flex flex-col justify-between"
            style={{
              backgroundColor: isDark ? '#18181B' : '#FFFFFF',
              borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
              color: isDark ? '#FFFFFF' : '#111827',
            }}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }}>
                <div>
                  <h3 className="text-base font-bold m-0">Operaciones & Cobranzas</h3>
                  <p className="text-xs text-neutral-400 m-0">Registro ágil de pagos y avisos automáticos</p>
                </div>
                <button
                  onClick={() => setDrawerOperacionesOpen(false)}
                  className="p-2 rounded-xl hover:bg-neutral-500/10 text-neutral-400 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Feed de deudores */}
              <div className="space-y-2.5 max-h-[60vh] overflow-y-auto pr-1 mac-scrollbar">
                <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 block mb-1">
                  Deudores del Período ({cobrosDelPeriodo.length})
                </span>
                {cobrosDelPeriodo.map((p) => {
                  const isPaid = p.categoria === 'AL_DIA';
                  return (
                    <div
                      key={p.id}
                      className="p-3 rounded-2xl border flex items-center justify-between text-xs"
                      style={{
                        backgroundColor: isDark ? '#202024' : '#F9FAFB',
                        borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                      }}
                    >
                      <div className="min-w-0 pr-3">
                        <p className="font-bold truncate m-0">{p.nombre}</p>
                        <span className="text-[10px] text-neutral-400 font-mono">
                          {Math.round(p.cuotaCalculada || 0)} Bs · {isPaid ? 'Al día' : 'Pendiente'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => ejecutarCobroRapido(p)}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold border transition-all active:scale-95 flex items-center gap-1"
                          style={{
                            backgroundColor: isPaid ? (isDark ? '#2E2E32' : '#E5E7EB') : (isDark ? '#3F3F46' : '#111827'),
                            color: isPaid ? (isDark ? '#D1D5DB' : '#374151') : '#FFFFFF',
                            borderColor: 'transparent',
                          }}
                        >
                          <Check size={12} />
                          <span>{isPaid ? 'Cobrado' : 'Cobrar'}</span>
                        </button>
                        {p.telefono && (
                          <button
                            onClick={() => enviarRecordatorioMensual(p, periodoMes)}
                            className="p-2 rounded-xl border text-neutral-300 hover:text-white"
                            style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}
                            title="Enviar aviso por WhatsApp"
                          >
                            <Smartphone size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Suscripciones por pagar */}
              {serviciosPendientes.length > 0 && (
                <div className="space-y-2 pt-2 border-t" style={{ borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }}>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 block mb-1">
                    Suscripciones Pendientes ({serviciosPendientes.length})
                  </span>
                  {serviciosPendientes.slice(0, 3).map(s => (
                    <div
                      key={s.id}
                      className="p-2.5 rounded-xl border flex items-center justify-between text-xs"
                      style={{
                        backgroundColor: isDark ? '#202024' : '#F9FAFB',
                        borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                      }}
                    >
                      <div className="min-w-0 pr-2">
                        <p className="font-semibold truncate m-0">{s.nombre}</p>
                        <span className="text-[10px] text-neutral-400 font-mono">{s.monto} Bs</span>
                      </div>
                      <button
                        onClick={() => ejecutarPagoServicio(s)}
                        className="px-2.5 py-1 rounded-lg border text-[11px] font-semibold"
                        style={{
                          backgroundColor: isDark ? '#2E2E32' : '#E5E7EB',
                          borderColor: 'transparent',
                          color: isDark ? '#FFFFFF' : '#111827',
                        }}
                      >
                        Pagar
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Acciones de exportación */}
            <div className="pt-4 border-t flex gap-2" style={{ borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }}>
              <button
                onClick={() => handleExport('pdf')}
                className="flex-1 py-2 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors hover:bg-neutral-500/10"
                style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}
              >
                <FileText size={13} />
                <span>Reporte PDF</span>
              </button>
              <button
                onClick={() => handleExport('csv-cobros')}
                className="flex-1 py-2 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors hover:bg-neutral-500/10"
                style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}
              >
                <FileSpreadsheet size={13} />
                <span>CSV Cobros</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODALES COMPARTIDOS ── */}
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
