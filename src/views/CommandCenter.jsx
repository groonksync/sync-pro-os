import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Wallet, CalendarDays, RefreshCw, Bell, CreditCard,
  FileText, ChevronDown, AlertTriangle, Clock, Download,
  Brain, CheckCircle, XCircle, DollarSign, Plus,
  MessageSquare, ArrowRight, ExternalLink, FileSpreadsheet,
  Check, ShieldAlert, Sparkles, Building2, Dumbbell, Video
} from 'lucide-react';
import { aiService } from '../services/aiService';
import { Google, DeepSeek } from '@lobehub/icons';
import { getTheme, useTheme } from '../lib/theme';
import { calcularCategoriaPrestamo } from '../hooks/usePrestamoCategorias';
import { useWhatsApp } from '../hooks/useWhatsApp';
import { generarCronograma } from '../hooks/useAmortizacion';
import CommandModal from '../components/CommandModal';
import ResumenIAModal from '../components/ResumenIAModal';
import { exportCobrosCSV, exportStockBajoCSV, exportPDF } from '../utils/exportReport';

const GoogleLogo = ({ size = 16 }) => <Google.Color size={size} />;
const DeepSeekLogo = ({ size = 16 }) => <DeepSeek.Color size={size} />;

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
  const [filtroActivo, setFiltroActivo] = useState('todos'); // 'todos' | 'prestamos' | 'servicios' | 'alertas'
  const [periodoMes, setPeriodoMes] = useState(mesActual);
  const [modalPago, setModalPago] = useState({ isOpen: false, prestamo: null });
  const [modalServicio, setModalServicio] = useState({ isOpen: false, servicio: null });
  const [modalIA, setModalIA] = useState({ isOpen: false, contenido: '', cargando: false });
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);
  const [aiBalance, setAiBalance] = useState('...');
  const [isRefreshingAi, setIsRefreshingAi] = useState(false);

  // ─── Toast con auto-cierre ──────────────────────────────────
  useEffect(() => {
    if (toastMsg) {
      const timer = setTimeout(() => setToastMsg(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMsg]);

  // ─── Balance IA ─────────────────────────────────────────────
  const fetchAiBalance = useCallback(async () => {
    setIsRefreshingAi(true);
    try {
      const balance = await aiService.fetchBalance(settings);
      setAiBalance(balance);
    } catch {
      setAiBalance('Activo');
    }
    setIsRefreshingAi(false);
  }, [settings]);

  useEffect(() => {
    fetchAiBalance();
  }, [fetchAiBalance]);

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
      return {
        ...p,
        ...cat,
        cuotaCalculada: p.cuotaUnit || (parseFloat(p.capital || 0) * (parseFloat(p.interes || 0) / 100)),
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

    return {
      alDia,
      pendientes,
      deudor1Mes,
      deudorCritico,
      porCobrar,
      totalPendiente,
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

  // ─── Tareas & Recordatorios Críticos ─────────────────────────
  const listaRecordatorios = Array.isArray(data?.recordatorios) ? data.recordatorios : [];
  const tareasUrgentes = useMemo(() => {
    return listaRecordatorios
      .filter(r => r.estado !== 'Completado' && r.estado !== 'Completada')
      .sort((a, b) => {
        const pMap = { 'Crítica': 0, 'Alta': 1, 'Media': 2, 'Baja': 3 };
        return (pMap[a.prioridad] ?? 2) - (pMap[b.prioridad] ?? 2);
      });
  }, [listaRecordatorios]);

  // ─── Stock Crítico ──────────────────────────────────────────
  const listaProductos = Array.isArray(data?.productos) ? data.productos : [];
  const stockCritico = useMemo(() => {
    return listaProductos.filter(p => (parseInt(p.stock_actual || p.stock || 0) || 0) <= 5);
  }, [listaProductos]);

  // ─── Handlers de Operaciones ────────────────────────────────
  const ejecutarCobroRapido = (prestamo) => {
    setModalPago({ isOpen: true, prestamo });
  };

  const confirmarCobro = async () => {
    const p = modalPago.prestamo;
    if (!p || !onQuickPayment) return;
    try {
      await onQuickPayment(p.id);
      setModalPago({ isOpen: false, prestamo: null });
      setToastMsg({ tipo: 'success', texto: `Cobro registrado: ${p.nombre}` });
    } catch (e) {
      setToastMsg({ tipo: 'error', texto: `Error: ${e.message}` });
    }
  };

  const ejecutarPagoServicio = (servicio) => {
    setModalServicio({ isOpen: true, servicio });
  };

  const confirmarPagoServicio = async () => {
    const s = modalServicio.servicio;
    if (!s || !onPayService) return;
    try {
      const ok = await onPayService(s);
      if (ok) {
        setModalServicio({ isOpen: false, servicio: null });
        setToastMsg({ tipo: 'success', texto: `Pago registrado: ${s.nombre}` });
      }
    } catch (e) {
      setToastMsg({ tipo: 'error', texto: `Error: ${e.message}` });
    }
  };

  const notificarWhatsApp = (prestamo) => {
    if (!prestamo.telefono) {
      alert(`El cliente ${prestamo.nombre} no tiene número de teléfono registrado.`);
      return;
    }
    const cuota = {
      fechaVencimiento: prestamo.fecha_pago || prestamo.inicio,
      total: prestamo.cuotaCalculada,
      diasAtraso: prestamo.mesesAtraso ? prestamo.mesesAtraso * 30 : 0,
    };
    enviarRecordatorioMensual(prestamo, cuota);
    setToastMsg({ tipo: 'success', texto: `Mensaje de WhatsApp preparado para ${prestamo.nombre}` });
  };

  const handleExport = (tipo) => {
    setExportMenuOpen(false);
    const totalCapital = listaPrestamos.reduce((s, p) => s + (parseFloat(p.capital) || 0), 0);
    const totalInteres = listaPrestamos.reduce((s, p) => s + (parseFloat(p.capital) * (parseFloat(p.interes) / 100)), 0);
    const valorInv = listaProductos.reduce((s, p) => s + ((parseFloat(p.precio_costo || p.precio) || 0) * (parseInt(p.stock_actual || 0) || 0)), 0);

    if (tipo === 'pdf') {
      exportPDF({
        totalCapital,
        totalInteresMensual: totalInteres,
        valorInventario: valorInv,
        totalPendiente: categorias.totalPendiente,
        stockBajoCount: stockCritico.length,
        porCobrar: cobrosDelPeriodo,
        mesActual: periodoMes,
      });
    } else if (tipo === 'csv-cobros') {
      exportCobrosCSV(cobrosDelPeriodo, periodoMes);
    } else if (tipo === 'csv-stock') {
      exportStockBajoCSV(stockCritico);
    }
    setToastMsg({ tipo: 'success', texto: 'Reporte generado exitosamente' });
  };

  const generarResumenIA = async () => {
    setModalIA({ isOpen: true, contenido: '', cargando: true });
    try {
      const contexto = {
        capitalActivo: listaPrestamos.reduce((s, p) => s + (parseFloat(p.capital) || 0), 0),
        totalPendiente: categorias.totalPendiente,
        cobrosPorCobrar: categorias.porCobrar.length,
        deudoresCriticos: categorias.deudorCritico.length,
        serviciosPendientes: serviciosPendientes.length,
        tareasUrgentes: tareasUrgentes.length,
      };

      const prompt = `Analiza la situación operativa actual de mi estación de trabajo:\n${JSON.stringify(contexto, null, 2)}\nGenera un resumen ejecutivo breve, directo y enfocado en prioridades del día en formato texto claro.`;
      const respuesta = await aiService.askAgent(prompt, [], { settings, activeView: 'Centro de Trabajo' });
      setModalIA({ isOpen: true, contenido: respuesta, cargando: false });
    } catch (e) {
      setModalIA({ isOpen: true, contenido: `Error: ${e.message}`, cargando: false });
    }
  };

  // ─── Meses Disponibles para Selector ─────────────────────────
  const opcionesPeriodo = useMemo(() => {
    const periodos = [];
    const base = new Date();
    for (let i = -1; i <= 3; i++) {
      const d = new Date(base.getFullYear(), base.getMonth() + i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
      periodos.push({ key, label: label.charAt(0).toUpperCase() + label.slice(1) });
    }
    return periodos;
  }, []);

  // ─── Helpers de Estilo de Estado ─────────────────────────────
  const getBadgeStyle = (categoria) => {
    switch (categoria) {
      case 'AL_DIA':
        return { bg: '#233328', text: '#4ADE80', border: '#2E4535', label: 'Al Día' };
      case 'PENDIENTE':
        return { bg: '#383324', text: '#FBBF24', border: '#4A422D', label: 'Pendiente' };
      case 'DEUDOR_1MES':
        return { bg: '#3D2C22', text: '#FB923C', border: '#523A2C', label: '1 Mes de Atraso' };
      case 'DEUDOR_CRITICO':
        return { bg: '#3D2424', text: '#F87171', border: '#542F2F', label: 'Crítico (2+ meses)' };
      default:
        return { bg: '#2A2A2A', text: '#B4B4B4', border: '#383838', label: 'Normal' };
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 pb-20 text-[#ECECEC] font-sans antialiased">

      {/* ─── TOAST NOTIFICATION ─── */}
      {toastMsg && (
        <div className="fixed top-6 right-6 z-50 px-4 py-2.5 rounded-xl bg-[#2D2D2D] border border-[#3E3E3E] text-white text-xs font-medium shadow-2xl flex items-center gap-2 fade-in">
          <span>{toastMsg.tipo === 'success' ? '✓' : '⚠️'}</span>
          <span>{toastMsg.texto}</span>
        </div>
      )}

      {/* ─── HEADER PRINCIPAL Y ACCIONES RÁPIDAS ─── */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#2C2C2C] pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2.5">
            Operaciones Activas
          </h1>
          <p className="text-xs text-[#9E9E9E] mt-1">
            Gestión limpia de cobros, suscripciones por vencer y tareas críticas
          </p>
        </div>

        {/* Barra de Herramientas y Acciones */}
        <div className="flex items-center gap-2 flex-wrap">
          
          {/* Selector de Mes */}
          <div className="relative">
            <select
              value={periodoMes}
              onChange={e => setPeriodoMes(e.target.value)}
              className="bg-[#2A2A2A] hover:bg-[#303030] text-[#ECECEC] text-xs font-medium px-3 py-2 rounded-xl border border-[#383838] focus:outline-none cursor-pointer spring-hover"
            >
              {opcionesPeriodo.map(p => (
                <option key={p.key} value={p.key}>
                  {p.label} {p.key === mesActual ? '• Actual' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Botón Nuevo Préstamo */}
          <button
            onClick={() => onNavigateTo && onNavigateTo('prestamos')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#2A2A2A] hover:bg-[#333333] border border-[#383838] text-xs font-medium text-white spring-active"
            title="Ir a Cartera de Préstamos para registrar uno nuevo"
          >
            <Plus size={14} />
            <span>Nuevo Préstamo</span>
          </button>

          {/* Botón Registrar Gasto */}
          <button
            onClick={() => onNavigateTo && onNavigateTo('pagos')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#2A2A2A] hover:bg-[#333333] border border-[#383838] text-xs font-medium text-white spring-active"
            title="Ir a Mis Egresos para registrar un gasto"
          >
            <Plus size={14} />
            <span>Registrar Gasto</span>
          </button>

          {/* Menú Exportar */}
          <div className="relative">
            <button
              onClick={() => setExportMenuOpen(!exportMenuOpen)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#2A2A2A] hover:bg-[#333333] border border-[#383838] text-xs font-medium text-[#B4B4B4] hover:text-white spring-active"
            >
              <Download size={13} />
              <span>Exportar</span>
              <ChevronDown size={12} />
            </button>

            {exportMenuOpen && (
              <div className="absolute right-0 mt-1.5 w-48 bg-[#282828] border border-[#383838] rounded-xl shadow-2xl p-1 z-30 space-y-0.5">
                <button
                  onClick={() => handleExport('pdf')}
                  className="w-full text-left px-3 py-2 text-xs text-[#ECECEC] hover:bg-[#333333] rounded-lg flex items-center gap-2"
                >
                  <FileText size={13} className="text-[#38BDF8]" />
                  <span>Reporte PDF</span>
                </button>
                <button
                  onClick={() => handleExport('csv-cobros')}
                  className="w-full text-left px-3 py-2 text-xs text-[#ECECEC] hover:bg-[#333333] rounded-lg flex items-center gap-2"
                >
                  <FileSpreadsheet size={13} className="text-[#34D399]" />
                  <span>CSV de Cobros</span>
                </button>
                <button
                  onClick={() => handleExport('csv-stock')}
                  className="w-full text-left px-3 py-2 text-xs text-[#ECECEC] hover:bg-[#333333] rounded-lg flex items-center gap-2"
                >
                  <AlertTriangle size={13} className="text-[#FBBF24]" />
                  <span>CSV Stock Crítico</span>
                </button>
              </div>
            )}
          </div>

          {/* Análisis IA */}
          <button
            onClick={generarResumenIA}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#ECECEC] hover:bg-white text-[#171717] text-xs font-semibold spring-active"
            title="Generar resumen ejecutivo de la situación actual"
          >
            <Sparkles size={13} />
            <span>Análisis IA</span>
          </button>
        </div>
      </header>

      {/* ─── FILTRO POR PÍLDORAS (Segmented Pills) ─── */}
      <div className="flex items-center justify-between gap-3 overflow-x-auto pb-1">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setFiltroActivo('todos')}
            className={`pill-tab spring-active ${
              filtroActivo === 'todos'
                ? 'bg-[#383838] text-white border border-[#484848]'
                : 'text-[#9E9E9E] hover:text-white hover:bg-[#2A2A2A]'
            }`}
          >
            Todas las Operaciones ({cobrosDelPeriodo.length + serviciosPendientes.length + tareasUrgentes.length})
          </button>

          <button
            onClick={() => setFiltroActivo('prestamos')}
            className={`pill-tab spring-active flex items-center gap-1.5 ${
              filtroActivo === 'prestamos'
                ? 'bg-[#383838] text-white border border-[#484848]'
                : 'text-[#9E9E9E] hover:text-white hover:bg-[#2A2A2A]'
            }`}
          >
            <span>Cobros ({cobrosDelPeriodo.length})</span>
            {categorias.porCobrar.length > 0 && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444]" />
            )}
          </button>

          <button
            onClick={() => setFiltroActivo('servicios')}
            className={`pill-tab spring-active flex items-center gap-1.5 ${
              filtroActivo === 'servicios'
                ? 'bg-[#383838] text-white border border-[#484848]'
                : 'text-[#9E9E9E] hover:text-white hover:bg-[#2A2A2A]'
            }`}
          >
            <span>Suscripciones y Gastos ({serviciosPendientes.length})</span>
            {serviciosPendientes.length > 0 && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />
            )}
          </button>

          <button
            onClick={() => setFiltroActivo('alertas')}
            className={`pill-tab spring-active ${
              filtroActivo === 'alertas'
                ? 'bg-[#383838] text-white border border-[#484848]'
                : 'text-[#9E9E9E] hover:text-white hover:bg-[#2A2A2A]'
            }`}
          >
            Tareas y Alertas ({tareasUrgentes.length + stockCritico.length})
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs text-[#7A7A7A]">
          <span>Pendiente de cobro:</span>
          <span className="font-mono font-bold text-white">
            {categorias.totalPendiente.toLocaleString()} Bs
          </span>
        </div>
      </div>

      {/* ─── BANDEJA UNIFICADA DE OPERACIONES (CARD FEED) ─── */}
      <div className="space-y-3">

        {/* SECCIÓN 1: PRÉSTAMOS / COBROS */}
        {(filtroActivo === 'todos' || filtroActivo === 'prestamos') && (
          <div className="space-y-3">
            {filtroActivo === 'todos' && cobrosDelPeriodo.length > 0 && (
              <div className="text-[11px] font-semibold text-[#7A7A7A] uppercase tracking-wider px-1 pt-2">
                Cobros del Mes ({periodoMes})
              </div>
            )}

            {cobrosDelPeriodo.map(p => {
              const badge = getBadgeStyle(p.categoria);
              const estaAlDia = p.categoria === 'AL_DIA';

              return (
                <div
                  key={p.id}
                  className="card-gray p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-9 h-9 rounded-xl bg-[#242424] border border-[#383838] flex items-center justify-center font-bold text-xs text-[#ECECEC] shrink-0">
                      {p.nombre ? p.nombre.charAt(0).toUpperCase() : 'P'}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-xs font-bold text-white tracking-tight">
                          {p.nombre}
                        </h3>
                        <span
                          className="text-[10px] px-2 py-0.5 rounded-md font-medium border"
                          style={{
                            backgroundColor: badge.bg,
                            color: badge.text,
                            borderColor: badge.border,
                          }}
                        >
                          {badge.label}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#9E9E9E] mt-0.5">
                        Capital: <span className="font-mono text-white">{parseFloat(p.capital || 0).toLocaleString()} {p.moneda || 'Bs'}</span> • Interés mensual: <span className="font-mono text-white">{p.cuotaCalculada.toFixed(0)} Bs</span>
                        {p.telefono && <span className="text-[#7A7A7A] ml-2">📱 {p.telefono}</span>}
                      </p>
                    </div>
                  </div>

                  {/* Acciones y Monto */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#383838]">
                    <div className="text-left sm:text-right">
                      <span className="text-xs font-mono font-bold text-white">
                        {p.cuotaCalculada.toFixed(0)} {p.moneda || 'Bs'}
                      </span>
                      <p className="text-[10px] text-[#7A7A7A]">cuota del mes</p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {p.telefono && (
                        <button
                          onClick={() => notificarWhatsApp(p)}
                          className="px-2.5 py-1.5 rounded-lg bg-[#242424] hover:bg-[#303030] border border-[#363636] text-[11px] text-[#B4B4B4] hover:text-white flex items-center gap-1 spring-active"
                          title="Enviar recordatorio por WhatsApp"
                        >
                          <MessageSquare size={12} className="text-[#34D399]" />
                          <span className="hidden md:inline">WhatsApp</span>
                        </button>
                      )}

                      {!estaAlDia && (
                        <button
                          onClick={() => ejecutarCobroRapido(p)}
                          className="px-3 py-1.5 rounded-lg bg-[#ECECEC] hover:bg-white text-[#171717] text-xs font-bold spring-active"
                        >
                          Cobrar
                        </button>
                      )}

                      <button
                        onClick={() => onNavigateToPrestamo && onNavigateToPrestamo(p.id)}
                        className="px-2.5 py-1.5 rounded-lg bg-[#242424] hover:bg-[#303030] border border-[#363636] text-[11px] text-[#9E9E9E] hover:text-white spring-active"
                        title="Ver ficha completa en Préstamos"
                      >
                        Ver
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* SECCIÓN 2: SUSCRIPCIONES Y SERVICIOS */}
        {(filtroActivo === 'todos' || filtroActivo === 'servicios') && (
          <div className="space-y-3">
            {filtroActivo === 'todos' && serviciosPendientes.length > 0 && (
              <div className="text-[11px] font-semibold text-[#7A7A7A] uppercase tracking-wider px-1 pt-3">
                Suscripciones y Servicios por Pagar
              </div>
            )}

            {serviciosPendientes.map(s => (
              <div
                key={s.id}
                className="card-gray p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-[#262B28] border border-[#344D3C] text-[#34D399] flex items-center justify-center font-bold text-xs shrink-0">
                    ⚡
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-xs font-bold text-white tracking-tight">
                        {s.nombre}
                      </h3>
                      {s.diasRestantes !== null && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-md font-medium border ${
                          s.diasRestantes <= 0
                            ? 'bg-[#3D2424] text-[#F87171] border-[#542F2F]'
                            : s.diasRestantes <= 3
                            ? 'bg-[#383324] text-[#FBBF24] border-[#4A422D]'
                            : 'bg-[#242424] text-[#9E9E9E] border-[#363636]'
                        }`}>
                          {s.diasRestantes <= 0
                            ? 'Vencido'
                            : `Vence en ${s.diasRestantes} días`}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#9E9E9E] mt-0.5">
                      Fecha estimada: <span className="font-mono text-white">{s.fecha_pago || 'Recurrente mensual'}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#383838]">
                  <span className="text-xs font-mono font-bold text-white">
                    {Number(s.monto || 0).toLocaleString()} Bs
                  </span>

                  <button
                    onClick={() => ejecutarPagoServicio(s)}
                    className="px-3 py-1.5 rounded-lg bg-[#2A2A2A] hover:bg-[#333333] border border-[#3E3E3E] text-xs font-semibold text-white spring-active"
                  >
                    Marcar Pago
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* SECCIÓN 3: TAREAS CRÍTICAS & ALERTAS DE STOCK */}
        {(filtroActivo === 'todos' || filtroActivo === 'alertas') && (
          <div className="space-y-3">
            {filtroActivo === 'todos' && (tareasUrgentes.length > 0 || stockCritico.length > 0) && (
              <div className="text-[11px] font-semibold text-[#7A7A7A] uppercase tracking-wider px-1 pt-3">
                Tareas y Alertas Prioritarias
              </div>
            )}

            {/* Tareas */}
            {tareasUrgentes.slice(0, 5).map(t => (
              <div
                key={t.id}
                className="card-gray p-4 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#282533] border border-[#3C3552] text-[#A78BFA] flex items-center justify-center font-bold text-xs shrink-0">
                    ✓
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-semibold text-white">
                        {t.titulo || t.texto || 'Tarea pendiente'}
                      </p>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#3D2C22] text-[#FB923C] border border-[#523A2C]">
                        {t.prioridad || 'Media'}
                      </span>
                    </div>
                    {t.fecha && (
                      <p className="text-[10px] text-[#7A7A7A] mt-0.5">
                        Límite: {t.fecha}
                      </p>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => onNavigateTo && onNavigateTo('recordatorios')}
                  className="px-2.5 py-1.5 rounded-lg bg-[#242424] hover:bg-[#303030] text-[11px] text-[#9E9E9E] hover:text-white spring-active"
                >
                  Gestionar
                </button>
              </div>
            ))}

            {/* Stock Bajo */}
            {stockCritico.slice(0, 3).map(prod => (
              <div
                key={prod.id}
                className="card-gray p-4 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#3D2C22] border border-[#523A2C] text-[#FB923C] flex items-center justify-center font-bold text-xs shrink-0">
                    📦
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">
                      Stock crítico: {prod.nombre}
                    </p>
                    <p className="text-[10px] text-[#7A7A7A] mt-0.5">
                      Quedan solo <span className="font-bold text-[#F87171]">{prod.stock_actual || prod.stock || 0}</span> unidades disponibles
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => onNavigateTo && onNavigateTo('inventario', { search: prod.nombre })}
                  className="px-2.5 py-1.5 rounded-lg bg-[#242424] hover:bg-[#303030] text-[11px] text-[#9E9E9E] hover:text-white spring-active"
                >
                  Ver Stock
                </button>
              </div>
            ))}
          </div>
        )}

        {/* ESTADO VACÍO (Si no hay nada pendiente) */}
        {cobrosDelPeriodo.length === 0 && serviciosPendientes.length === 0 && tareasUrgentes.length === 0 && (
          <div className="text-center py-16 text-[#7A7A7A] space-y-2">
            <div className="w-10 h-10 rounded-full bg-[#2A2A2A] mx-auto flex items-center justify-center text-sm text-[#9E9E9E]">
              ✓
            </div>
            <p className="text-xs font-semibold text-white">Todo al día</p>
            <p className="text-[11px] text-[#7A7A7A]">No hay operaciones pendientes ni alertas críticas para este período.</p>
          </div>
        )}

      </div>

      {/* ─── MODALES DE CONFIRMACIÓN (Seguridad y Claridad) ─── */}
      <CommandModal
        isOpen={modalPago.isOpen}
        onClose={() => setModalPago({ isOpen: false, prestamo: null })}
        onConfirm={confirmarCobro}
        titulo={`Confirmar Cobro — ${modalPago.prestamo?.nombre || ''}`}
        mensaje={`¿Registrar cobro de cuota mensual por ${modalPago.prestamo?.cuotaCalculada ? modalPago.prestamo.cuotaCalculada.toFixed(0) : 0} Bs correspondiente al período ${periodoMes}?`}
        icono={<DollarSign size={20} color="#34D399" />}
        colorAccent="#34D399"
        confirmText="Confirmar Cobro"
        cancelText="Cancelar"
        isDark={isDark}
      />

      <CommandModal
        isOpen={modalServicio.isOpen}
        onClose={() => setModalServicio({ isOpen: false, servicio: null })}
        onConfirm={confirmarPagoServicio}
        titulo={`Confirmar Pago — ${modalServicio.servicio?.nombre || ''}`}
        mensaje={`¿Registrar el pago de ${modalServicio.servicio?.nombre || ''} por ${modalServicio.servicio?.monto || 0} Bs? Se creará el egreso correspondiente y la fecha avanzará al siguiente mes.`}
        icono={<CreditCard size={20} color="#F87171" />}
        colorAccent="#F87171"
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
        titulo="Análisis de Situación Operativa"
      />

    </div>
  );
};

export default CommandCenter;
