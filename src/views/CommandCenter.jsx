import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Wallet, CalendarDays, RefreshCw, Bell, CreditCard,
  FileText, ChevronDown, AlertTriangle, Clock, Download,
  Brain, CheckCircle, XCircle, DollarSign, Plus,
  MessageSquare, ArrowRight, ExternalLink, FileSpreadsheet,
  Check, ShieldAlert, Sparkles, Building2, Dumbbell, Video,
  ChevronLeft, ChevronRight, Share2, Smartphone, Cpu,
  ToggleLeft, ToggleRight, ArrowUpRight, ArrowDownRight, Layers
} from 'lucide-react';
import { aiService } from '../services/aiService';
import { Google, DeepSeek } from '@lobehub/icons';
import { useTheme } from '../lib/theme';
import { calcularCategoriaPrestamo } from '../hooks/usePrestamoCategorias';
import { useWhatsApp } from '../hooks/useWhatsApp';
import { generarCronograma } from '../hooks/useAmortizacion';
import CommandModal from '../components/CommandModal';
import ResumenIAModal from '../components/ResumenIAModal';
import { exportCobrosCSV, exportStockBajoCSV, exportPDF } from '../utils/exportReport';

const ChipIcon = () => (
  <svg width="28" height="22" viewBox="0 0 28 22" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="28" height="22" rx="4" fill="#D4AF37" fillOpacity="0.25" stroke="#D4AF37" strokeWidth="1.2"/>
    <path d="M0 7H9M0 15H9M19 7H28M19 15H28M9 0V22M19 0V22M9 11H19" stroke="#E5C158" strokeWidth="1.2"/>
    <rect x="11" y="7" width="6" height="8" rx="2" fill="#D4AF37" fillOpacity="0.5"/>
  </svg>
);

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
  const [selectedTimelineDay, setSelectedTimelineDay] = useState(0); // 0 = Hoy, 1 = Mañana, etc.
  const [cashflowToggleActive, setCashflowToggleActive] = useState(true);
  const [productPage, setProductPage] = useState(0);

  // Toast con auto-cierre
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
      const amortizadoPct = totalEsperado > 0 ? Math.min(100, Math.round((totalPagado / totalEsperado) * 100)) : 45;

      return {
        ...p,
        ...cat,
        cuotaCalculada,
        amortizadoPct,
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

  // ─── Servicios Próximos o Pendientes ─────────────────────────
  const egresos = Array.isArray(data?.egresos) ? data.egresos : [];
  const serviciosActivos = useMemo(() => {
    const lista = (servicios || []).filter(s => s && s.activo !== false);
    const mesActualNum = hoy.getMonth();
    const añoActualNum = hoy.getFullYear();

    const egresosDelMes = egresos.filter(e => {
      const f = new Date(e.fecha || e.fecha_pago || e.created_at);
      return f.getMonth() === mesActualNum && f.getFullYear() === añoActualNum;
    });

    return lista.map(s => {
      const yaPagado = egresosDelMes.some(e =>
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

  // ─── Timeline 7 Días Dinámico ────────────────────────────────
  const timelineDays = useMemo(() => {
    const days = [];
    const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    
    for (let i = 0; i < 7; i++) {
      const targetDate = new Date();
      targetDate.setDate(hoy.getDate() + timelineDayOffset + i);
      const diaNum = targetDate.getDate();
      const diaNom = diasSemana[targetDate.getDay()];
      const dateStr = targetDate.toISOString().split('T')[0];

      // Verificar si hay cobros de préstamos en este día
      const cobrosEnDia = cobrosDelPeriodo.filter(p => {
        if (!p.inicio) return false;
        const diaInicio = new Date(p.inicio).getDate();
        return diaInicio === diaNum;
      });

      // Verificar si hay servicios que vencen en este día
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

  // ─── Productos de Inventario ─────────────────────────────────
  const listaProductos = Array.isArray(data?.productos) ? data.productos : [];
  const stockCritico = useMemo(() => {
    return listaProductos.filter(p => (parseInt(p.stock_actual || p.stock || 0) || 0) <= 5);
  }, [listaProductos]);

  const visibleProducts = useMemo(() => {
    const start = productPage * 6;
    return listaProductos.slice(start, start + 6);
  }, [listaProductos, productPage]);

  // ─── Handlers de Operación ──────────────────────────────────
  const ejecutarCobroRapido = (prestamo) => {
    setModalPago({ isOpen: true, prestamo });
  };

  const confirmarCobro = async () => {
    if (!modalPago.prestamo) return;
    try {
      await onQuickPayment(modalPago.prestamo.id);
      setToastMsg(`✅ Cobro registrado con éxito para ${modalPago.prestamo.nombre}`);
    } catch (e) {
      setToastMsg(`❌ Error al registrar cobro: ${e.message}`);
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
        setToastMsg(`✅ Pago registrado para ${modalServicio.servicio.nombre}`);
      }
    } catch (e) {
      setToastMsg(`❌ Error al registrar pago: ${e.message}`);
    } finally {
      setModalServicio({ isOpen: false, servicio: null });
    }
  };

  const handleShareWhatsAppProduct = (prod) => {
    const text = encodeURIComponent(
      `Hola! Te comparto la información de nuestro producto:\n\n*${prod.nombre}*\n💰 Precio: ${prod.precio_venta || 0} Bs\n📦 Stock disponible: ${prod.stock_actual || prod.stock || 0} unidades\n\n¿Te gustaría coordinar la entrega?`
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

Por favor, genera un análisis ejecutivo con 3 recomendaciones tácticas de cobranza y optimización de flujo de caja para hoy.`;

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
      setToastMsg("📄 Reporte PDF descargado con éxito");
    } else if (tipo === 'csv-cobros') {
      exportCobrosCSV(cobrosDelPeriodo, periodoMes);
      setToastMsg("📊 CSV de cobros descargado");
    } else if (tipo === 'csv-stock') {
      exportStockBajoCSV(stockCritico);
      setToastMsg("⚠️ CSV de stock crítico descargado");
    }
  };

  return (
    <div className="w-full space-y-5 animate-in fade-in duration-300 pb-12">
      
      {/* ─── TOAST NOTIFICACIÓN FLOTANTE ─── */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 p-3.5 px-5 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold shadow-2xl backdrop-blur-xl animate-in slide-in-from-bottom-3 duration-200 flex items-center gap-2.5">
          <CheckCircle size={16} className="text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* ─── BARRA DE CONTROL EJECUTIVA BENTO ─── */}
      <div 
        className="w-full p-4 rounded-3xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 backdrop-blur-xl"
        style={{
          backgroundColor: isDark ? 'rgba(20, 21, 27, 0.7)' : 'rgba(255, 255, 255, 0.85)',
          borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
        }}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-black">
            <Sparkles size={18} />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-black tracking-tight text-white m-0">
              Centro de Mando Spatial
            </h1>
            <p className="text-[11px] text-neutral-400 m-0">
              Operaciones de cartera, cobros, vitrina de productos y flujo de caja en tiempo real
            </p>
          </div>
        </div>

        {/* Acciones Rápidas */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Selector de Mes */}
          <input
            type="month"
            value={periodoMes}
            onChange={(e) => setPeriodoMes(e.target.value)}
            className="text-xs font-bold py-1.5 px-3 rounded-xl border bg-white/[0.04] text-white border-white/10 focus:outline-none"
          />

          {/* Botón Análisis IA */}
          <button
            onClick={generarResumenIA}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-black transition-all hover:scale-105 active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #10B981, #34D399)',
              boxShadow: '0 4px 15px rgba(16, 185, 129, 0.35)',
            }}
          >
            <Sparkles size={13} />
            <span>Análisis IA</span>
          </button>

          {/* Menú Exportar */}
          <div className="relative">
            <button
              onClick={() => setExportMenuOpen(!exportMenuOpen)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.09] border border-white/10 text-xs font-semibold text-neutral-200"
            >
              <Download size={13} />
              <span>Exportar</span>
              <ChevronDown size={12} />
            </button>

            {exportMenuOpen && (
              <div 
                className="absolute right-0 mt-2 w-48 rounded-2xl p-1.5 shadow-2xl border backdrop-blur-2xl z-40 space-y-0.5"
                style={{
                  backgroundColor: isDark ? 'rgba(24, 25, 32, 0.98)' : 'rgba(255, 255, 255, 0.98)',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                }}
              >
                <button
                  onClick={() => handleExport('pdf')}
                  className="w-full text-left px-3 py-2 text-xs text-neutral-200 hover:bg-white/[0.06] rounded-xl flex items-center gap-2"
                >
                  <FileText size={13} className="text-cyan-400" />
                  <span>Reporte PDF</span>
                </button>
                <button
                  onClick={() => handleExport('csv-cobros')}
                  className="w-full text-left px-3 py-2 text-xs text-neutral-200 hover:bg-white/[0.06] rounded-xl flex items-center gap-2"
                >
                  <FileSpreadsheet size={13} className="text-emerald-400" />
                  <span>CSV de Cobros</span>
                </button>
                <button
                  onClick={() => handleExport('csv-stock')}
                  className="w-full text-left px-3 py-2 text-xs text-neutral-200 hover:bg-white/[0.06] rounded-xl flex items-center gap-2"
                >
                  <AlertTriangle size={13} className="text-amber-400" />
                  <span>CSV Stock Crítico</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          SPATIAL BENTO GRID (4 MÓDULOS PRINCIPALES)
          ══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* ── 1. BLOQUE IZQUIERDO: CUSTOMER LOAN CARDS (WALLET STYLE) ── */}
        <div 
          className="lg:col-span-4 rounded-3xl p-5 border space-y-4 backdrop-blur-xl relative flex flex-col"
          style={{
            backgroundColor: isDark ? 'rgba(18, 19, 25, 0.75)' : 'rgba(255, 255, 255, 0.85)',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
            minHeight: '480px',
          }}
        >
          {/* Header del Tile */}
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
            <div>
              <div className="flex items-center gap-2">
                <CreditCard size={16} className="text-emerald-400" />
                <h3 className="text-sm font-black uppercase tracking-wider text-white m-0">
                  Tarjetas de Deudores
                </h3>
              </div>
              <p className="text-[10px] text-neutral-400 m-0 mt-0.5">
                Cartera activa · {cobrosDelPeriodo.length} préstamos registrados
              </p>
            </div>
            <button 
              onClick={() => onNavigateToPrestamo ? onNavigateToPrestamo(null) : onNavigateTo('prestamos')}
              className="text-[10px] font-bold text-emerald-400 hover:underline uppercase tracking-wider"
            >
              Ver Cartera
            </button>
          </div>

          {/* Feed de Tarjetas de Débito Digitales */}
          <div className="space-y-3.5 overflow-y-auto max-h-[460px] pr-1 mac-scrollbar">
            {cobrosDelPeriodo.length > 0 ? (
              cobrosDelPeriodo.map((p) => {
                const isPaid = p.categoria === 'AL_DIA';
                return (
                  <div
                    key={p.id}
                    className="p-4 rounded-2xl border transition-all duration-300 relative group overflow-hidden"
                    style={{
                      background: 'linear-gradient(145deg, #15161D, #0F1014)',
                      borderColor: isPaid ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255, 255, 255, 0.08)',
                      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
                    }}
                  >
                    {/* Top Row: Chip + Badge */}
                    <div className="flex items-center justify-between mb-3">
                      <ChipIcon />
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                          isPaid
                            ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                            : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                        }`}>
                          {isPaid ? 'Al Día' : 'Pendiente'}
                        </span>
                        <span className="text-[9px] font-mono text-neutral-400">
                          {p.moneda || 'BOB'}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar de Amortización */}
                    <div className="space-y-1 mb-3">
                      <div className="flex justify-between text-[10px] text-neutral-400">
                        <span>Estado de amortización</span>
                        <span className="font-mono font-bold text-emerald-400">
                          {p.amortizadoPct}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-500 bg-emerald-400"
                          style={{
                            width: `${p.amortizadoPct}%`,
                            boxShadow: '0 0 10px #10B981',
                          }}
                        />
                      </div>
                    </div>

                    {/* Deudor Info & Monto */}
                    <div className="flex items-end justify-between mb-4">
                      <div>
                        <span className="text-[9px] uppercase tracking-widest text-neutral-500 font-bold block">
                          Titular Deudor
                        </span>
                        <h4 className="text-sm font-bold text-white m-0 truncate max-w-[170px]">
                          {p.nombre || 'Deudor sin nombre'}
                        </h4>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] uppercase tracking-widest text-neutral-500 font-bold block">
                          Cuota Período
                        </span>
                        <span className="text-sm font-mono font-black text-white">
                          {Math.round(p.cuotaCalculada || 0).toLocaleString()} {p.moneda || 'Bs'}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons: Quick-Pay & WhatsApp */}
                    <div className="flex items-center gap-2 pt-2 border-t border-white/[0.06]">
                      <button
                        onClick={() => ejecutarCobroRapido(p)}
                        className="flex-1 py-2 px-3 rounded-xl text-xs font-black text-black flex items-center justify-center gap-1.5 transition-all active:scale-95 hover:brightness-110"
                        style={{
                          background: isPaid 
                            ? 'linear-gradient(135deg, #10B981, #059669)' 
                            : 'linear-gradient(135deg, #34D399, #10B981)',
                          boxShadow: '0 2px 10px rgba(16, 185, 129, 0.4)',
                        }}
                      >
                        <Check size={14} />
                        <span>{isPaid ? 'Cobro Registrado' : 'Quick-Pay'}</span>
                      </button>

                      {p.telefono && (
                        <button
                          onClick={() => enviarRecordatorioMensual(p, periodoMes)}
                          title="Enviar aviso por WhatsApp"
                          className="p-2 rounded-xl bg-green-500/15 hover:bg-green-500/25 text-green-400 border border-green-500/30 transition-all active:scale-95"
                        >
                          <Smartphone size={15} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-neutral-500 space-y-2">
                <CreditCard size={28} className="mx-auto opacity-40 text-emerald-400" />
                <p className="text-xs font-bold text-neutral-300">Sin préstamos activos</p>
                <p className="text-[10px]">Crea contratos en la sección de Clientes & Préstamos.</p>
              </div>
            )}
          </div>
        </div>

        {/* ── 2. BLOQUE CENTRAL: 7-DAY PAYMENT TIMELINE & TAREAS ── */}
        <div className="lg:col-span-4 space-y-5">
          
          {/* Módulo Timeline 7 Días */}
          <div 
            className="rounded-3xl p-5 border backdrop-blur-xl space-y-4"
            style={{
              backgroundColor: isDark ? 'rgba(18, 19, 25, 0.75)' : 'rgba(255, 255, 255, 0.85)',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
            }}
          >
            {/* Header del Timeline */}
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <CalendarDays size={16} className="text-amber-400" />
                <h3 className="text-sm font-black uppercase tracking-wider text-white m-0">
                  Línea de Cobros (7 Días)
                </h3>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setTimelineDayOffset(prev => prev - 7)}
                  className="w-6 h-6 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center text-neutral-300 text-xs"
                >
                  <ChevronLeft size={13} />
                </button>
                <button
                  onClick={() => setTimelineDayOffset(prev => prev + 7)}
                  className="w-6 h-6 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center text-neutral-300 text-xs"
                >
                  <ChevronRight size={13} />
                </button>
              </div>
            </div>

            {/* Nodos de los 7 Días */}
            <div className="grid grid-cols-7 gap-1.5 text-center">
              {timelineDays.map((day) => {
                const isSelected = selectedTimelineDay === day.index;
                return (
                  <button
                    key={day.index}
                    onClick={() => setSelectedTimelineDay(day.index)}
                    className={`p-2 rounded-xl flex flex-col items-center justify-center transition-all ${
                      isSelected
                        ? 'bg-amber-400/25 border-amber-400 text-white shadow-lg shadow-amber-500/20'
                        : day.hasEvents
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/15'
                        : 'bg-white/[0.02] border-white/[0.05] text-neutral-400 hover:bg-white/[0.05]'
                    } border`}
                  >
                    <span className="text-[9px] font-bold uppercase block opacity-75">
                      {day.diaNom}
                    </span>
                    <span className="text-xs font-mono font-black block mt-0.5">
                      {day.diaNum}
                    </span>
                    {day.hasEvents && (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1 shadow-sm" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Badge de Próximos Pagos en el Día Seleccionado */}
            <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  {selectedDayInfo.isToday ? 'Cobros programados para Hoy' : `Cobros para el ${selectedDayInfo.diaNom} ${selectedDayInfo.diaNum}`}
                </span>
                <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-white/[0.06] text-neutral-300">
                  {selectedDayInfo.eventCount} {selectedDayInfo.eventCount === 1 ? 'evento' : 'eventos'}
                </span>
              </div>

              {selectedDayInfo.hasEvents ? (
                <div className="space-y-1.5 max-h-32 overflow-y-auto mac-scrollbar">
                  {selectedDayInfo.cobrosEnDia.map(p => (
                    <div key={p.id} className="flex items-center justify-between text-xs p-2 rounded-xl bg-white/[0.04]">
                      <span className="font-bold text-white truncate max-w-[150px]">{p.nombre}</span>
                      <span className="font-mono text-emerald-400 font-bold">{Math.round(p.cuotaCalculada || 0)} Bs</span>
                    </div>
                  ))}
                  {selectedDayInfo.serviciosEnDia.map(s => (
                    <div key={s.id} className="flex items-center justify-between text-xs p-2 rounded-xl bg-rose-500/10 text-rose-300">
                      <span className="font-bold truncate max-w-[150px]">{s.nombre}</span>
                      <span className="font-mono font-bold">-{s.monto} Bs</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[10px] text-neutral-500 m-0 py-1 text-center">
                  Sin vencimientos para esta fecha.
                </p>
              )}
            </div>
          </div>

          {/* Sub-Widget: Suscripciones & Gastos Próximos */}
          <div 
            className="rounded-3xl p-5 border backdrop-blur-xl space-y-3"
            style={{
              backgroundColor: isDark ? 'rgba(18, 19, 25, 0.75)' : 'rgba(255, 255, 255, 0.85)',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
            }}
          >
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
              <span className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
                <Wallet size={14} className="text-rose-400" />
                Suscripciones por Pagar
              </span>
              <span className="text-[10px] font-mono font-bold text-rose-400">
                {serviciosPendientes.length} pendientes
              </span>
            </div>

            <div className="space-y-2 max-h-40 overflow-y-auto mac-scrollbar">
              {serviciosPendientes.slice(0, 3).map(s => (
                <div key={s.id} className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-white m-0">{s.nombre}</p>
                    <p className="text-[10px] text-neutral-400 m-0">Vence: {s.fecha_pago || 'Mes en curso'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-white">{s.monto} Bs</span>
                    <button
                      onClick={() => ejecutarPagoServicio(s)}
                      className="px-2.5 py-1 rounded-lg bg-white/[0.06] hover:bg-emerald-500/20 hover:text-emerald-300 text-[10px] font-bold transition-all text-neutral-300"
                    >
                      Pagar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* ── 3. BLOQUE DERECHO: VITRINA DE INVENTARIO & CATÁLOGO ── */}
        <div 
          className="lg:col-span-4 rounded-3xl p-5 border space-y-4 backdrop-blur-xl relative"
          style={{
            backgroundColor: isDark ? 'rgba(18, 19, 25, 0.75)' : 'rgba(255, 255, 255, 0.85)',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
            minHeight: '480px',
          }}
        >
          {/* Header del Showcase */}
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
            <div>
              <div className="flex items-center gap-2">
                <Package size={16} className="text-cyan-400" />
                <h3 className="text-sm font-black uppercase tracking-wider text-white m-0">
                  Vitrina de Catálogo
                </h3>
              </div>
              <p className="text-[10px] text-neutral-400 m-0 mt-0.5">
                {listaProductos.length} referencias en stock
              </p>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setProductPage(prev => Math.max(0, prev - 1))}
                disabled={productPage === 0}
                className="w-6 h-6 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] disabled:opacity-30 flex items-center justify-center text-neutral-300 text-xs"
              >
                <ChevronLeft size={13} />
              </button>
              <button
                onClick={() => setProductPage(prev => ((prev + 1) * 6 < listaProductos.length ? prev + 1 : prev))}
                disabled={(productPage + 1) * 6 >= listaProductos.length}
                className="w-6 h-6 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] disabled:opacity-30 flex items-center justify-center text-neutral-300 text-xs"
              >
                <ChevronRight size={13} />
              </button>
            </div>
          </div>

          {/* Grilla 2x3 de Productos Visuales */}
          <div className="grid grid-cols-2 gap-3 max-h-[440px] overflow-y-auto mac-scrollbar pr-1">
            {visibleProducts.map((prod) => {
              const mainImg = prod.imagen || (Array.isArray(prod.imagenes) && prod.imagenes[0]) || null;
              const stock = parseInt(prod.stock_actual || prod.stock || 0);

              return (
                <div
                  key={prod.id}
                  className="p-3 rounded-2xl border transition-all duration-200 flex flex-col justify-between group hover:border-cyan-500/40"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    borderColor: 'rgba(255, 255, 255, 0.06)',
                  }}
                >
                  {/* Foto del Producto */}
                  <div className="w-full h-24 rounded-xl overflow-hidden bg-black/40 border border-white/5 relative mb-2 flex items-center justify-center">
                    {mainImg ? (
                      <img 
                        src={mainImg} 
                        alt={prod.nombre} 
                        className="w-full h-full object-contain p-1 group-hover:scale-105 transition-transform duration-300" 
                      />
                    ) : (
                      <Package size={28} className="text-neutral-600" />
                    )}
                    <span className={`absolute top-1 right-1 text-[8px] font-black uppercase px-1.5 py-0.5 rounded-md ${
                      stock <= 5 ? 'bg-rose-500 text-white' : 'bg-black/60 text-white backdrop-blur-md'
                    }`}>
                      Stock {stock}
                    </span>
                  </div>

                  {/* Nombre y Precio */}
                  <div className="space-y-0.5 mb-2">
                    <h5 className="text-[11px] font-bold text-white truncate m-0" title={prod.nombre}>
                      {prod.nombre}
                    </h5>
                    <p className="text-xs font-mono font-black text-cyan-400 m-0">
                      {prod.precio_venta || 0} Bs
                    </p>
                  </div>

                  {/* Botón WhatsApp */}
                  <button
                    onClick={() => handleShareWhatsAppProduct(prod)}
                    className="w-full py-1.5 rounded-lg bg-green-500/15 hover:bg-green-500/25 border border-green-500/25 text-green-400 text-[10px] font-bold flex items-center justify-center gap-1 transition-all active:scale-95"
                  >
                    <Smartphone size={11} />
                    <span>WhatsApp</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── 4. BLOQUE INFERIOR HORIZONTAL: CASHFLOW & BALANCE OPERATIVO ── */}
        <div 
          className="lg:col-span-12 rounded-3xl p-5 border backdrop-blur-xl"
          style={{
            backgroundColor: isDark ? 'rgba(18, 19, 25, 0.75)' : 'rgba(255, 255, 255, 0.85)',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
          }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-white m-0 flex items-center gap-2">
                <Layers size={16} className="text-emerald-400" />
                Flujo de Caja & Balance Operativo (Cashflow Toggles)
              </h3>
              <p className="text-[10px] text-neutral-400 m-0 mt-0.5">
                Seguimiento de ingresos recaudados vs. compromisos de salida y gastos del período
              </p>
            </div>

            {/* Switch Toggle */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-neutral-400 font-semibold">Monitor de Flujo</span>
              <button
                onClick={() => setCashflowToggleActive(!cashflowToggleActive)}
                className="text-emerald-400 transition-transform active:scale-90"
              >
                {cashflowToggleActive ? <ToggleRight size={32} /> : <ToggleLeft size={32} className="text-neutral-600" />}
              </button>
            </div>
          </div>

          {/* Barras de Inflows vs Outflows */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
            
            {/* 1. Entradas (Inflows) */}
            <div className="space-y-2 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
              <div className="flex justify-between items-center text-xs">
                <span className="text-neutral-400 font-bold uppercase text-[10px] flex items-center gap-1">
                  <ArrowUpRight size={13} className="text-emerald-400" /> Cobros Recaudados (Inflows)
                </span>
                <span className="font-mono font-black text-emerald-400">
                  +{categorias.totalRecaudado.toLocaleString()} Bs
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-white/[0.06] overflow-hidden">
                <div className="h-full rounded-full bg-emerald-400" style={{ width: '75%', boxShadow: '0 0 10px #10B981' }} />
              </div>
            </div>

            {/* 2. Salidas (Outflows) */}
            <div className="space-y-2 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
              <div className="flex justify-between items-center text-xs">
                <span className="text-neutral-400 font-bold uppercase text-[10px] flex items-center gap-1">
                  <ArrowDownRight size={13} className="text-amber-400" /> Salidas & Servicios (Outflows)
                </span>
                <span className="font-mono font-black text-amber-400">
                  -{totalGastoServicios.toLocaleString()} Bs
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-white/[0.06] overflow-hidden">
                <div className="h-full rounded-full bg-amber-400" style={{ width: '45%', boxShadow: '0 0 10px #F59E0B' }} />
              </div>
            </div>

            {/* 3. Margen Neto */}
            <div className="space-y-2 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
              <div className="flex justify-between items-center text-xs">
                <span className="text-neutral-400 font-bold uppercase text-[10px]">
                  Balance Neto Operativo
                </span>
                <span className="font-mono font-black text-white text-sm">
                  {(categorias.totalRecaudado - totalGastoServicios).toLocaleString()} Bs
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-white/[0.06] overflow-hidden">
                <div className="h-full rounded-full bg-cyan-400" style={{ width: '60%', boxShadow: '0 0 10px #06B6D4' }} />
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* ─── MODALES DE OPERACIÓN ─── */}
      <CommandModal
        isOpen={modalPago.isOpen}
        onClose={() => setModalPago({ isOpen: false, prestamo: null })}
        onConfirm={confirmarCobro}
        titulo={`Confirmar Cobro Rápido — ${modalPago.prestamo?.nombre || ''}`}
        mensaje={`¿Registrar cobro de cuota mensual por ${modalPago.prestamo?.cuotaCalculada ? modalPago.prestamo.cuotaCalculada.toFixed(0) : 0} Bs para el período ${periodoMes}?`}
        icono={<DollarSign size={20} color="#10B981" />}
        colorAccent="#10B981"
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
        icono={<CreditCard size={20} color="#F59E0B" />}
        colorAccent="#F59E0B"
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
