import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Wallet, Package, BarChart3, CalendarDays, RefreshCw,
  Bell, CheckSquare, Video, Cloud, ShieldCheck, FileText,
  Lock, CreditCard, Briefcase, ShoppingCart, Settings,
  ChevronDown, ChevronUp, AlertTriangle, Clock, UserPlus,
  Download, Brain, Eye, EyeOff, X, Filter, Box, Check,
  CheckCircle, XCircle, DollarSign, Sparkles, Flame,
  FileSpreadsheet
} from 'lucide-react';
import { aiService } from '../services/aiService';
import { Google, DeepSeek } from '@lobehub/icons';
import { getTheme, useTheme } from '../lib/theme';
import { usePrestamoCategorias } from '../hooks/usePrestamoCategorias';
import { generarCronograma } from '../hooks/useAmortizacion';
import CommandModal from '../components/CommandModal';
import ResumenIAModal from '../components/ResumenIAModal';
import { exportCobrosCSV, exportStockBajoCSV, exportPDF } from '../utils/exportReport';

const GoogleLogo = ({ size = 18 }) => <Google.Color size={size} />;
const DeepSeekLogo = ({ size = 18 }) => <DeepSeek.Color size={size} />;

// ============================================================
// CONFIGURACIÓN DE WIDGETS DE MÓDULOS (Grid 3x3)
// ============================================================
const MODULE_WIDGETS = [
  {
    id: 'editor',
    titulo: 'Editor de Video',
    icono: Video,
    color: '#a78bfa',
    getData: ({ meetingsList }) => ({
      principal: `${meetingsList?.length || 0} proyectos`,
      secundaria: `${meetingsList?.length || 0} sesiones activas`,
      alerta: null,
    }),
    accion: 'editor'
  },
  {
    id: 'almacenamiento',
    titulo: 'Drive Soberano',
    icono: Cloud,
    color: '#60a5fa',
    getData: () => ({
      principal: 'Drive Conectado',
      secundaria: 'Google API activa',
      alerta: null,
    }),
    accion: 'drive-sovereign'
  },
  {
    id: 'calendario',
    titulo: 'Calendario',
    icono: CalendarDays,
    color: '#34d399',
    getData: () => ({
      principal: 'Calendario Google',
      secundaria: 'Eventos sincronizados',
      alerta: null,
    }),
    accion: 'calendar'
  },
  {
    id: 'recordatorios',
    titulo: 'Recordatorios',
    icono: Bell,
    color: '#fbbf24',
    getData: ({ data }) => {
      const pendientes = data?.recordatorios?.filter(r => r.estado !== 'Completada') || [];
      const criticas = pendientes.filter(r => r.prioridad === 'Crítica');
      return {
        principal: `${pendientes.length} pendientes`,
        secundaria: `${criticas.length} críticas`,
        alerta: criticas.length > 0 ? `${criticas.length} tareas críticas` : null,
      };
    },
    accion: 'recordatorios'
  },
  {
    id: 'notas',
    titulo: 'Notas',
    icono: FileText,
    color: '#818cf8',
    getData: ({ data }) => ({
      principal: `${data?.notas?.length || 0} notas activas`,
      secundaria: 'Todas tus notas',
      alerta: null,
    }),
    accion: 'notas'
  },
  {
    id: 'boveda',
    titulo: 'Bóveda',
    icono: Lock,
    color: '#f472b6',
    getData: () => ({
      principal: 'Bóveda de Contraseñas',
      secundaria: 'Cifrado AES-256',
      alerta: null,
    }),
    accion: 'boveda'
  },
  {
    id: 'egresos',
    titulo: 'Mis Egresos',
    icono: CreditCard,
    color: '#fb923c',
    getData: ({ data }) => {
      const egresos = data?.egresos || [];
      const mesActual = new Date().getMonth();
      const egresosMes = egresos.filter(e => {
        const fecha = new Date(e.fecha_pago || e.fecha || e.created_at);
        return fecha.getMonth() === mesActual;
      });
      const total = egresosMes.reduce((sum, e) => sum + Number(e.monto || 0), 0);
      return {
        principal: `${total.toFixed(0)} Bs este mes`,
        secundaria: `${egresosMes.length} egresos`,
        alerta: null,
      };
    },
    accion: 'pagos'
  },
  {
    id: 'proyectos',
    titulo: 'Proyectos',
    icono: Briefcase,
    color: '#2dd4bf',
    getData: ({ data }) => ({
      principal: `${data?.proyectos?.filter(p => p.estado !== 'Completado').length || 0} activos`,
      secundaria: `${data?.proyectos?.filter(p => p.estado === 'Completado').length || 0} completados`,
      alerta: null,
    }),
    accion: 'proyectos'
  },
  {
    id: 'ventas',
    titulo: 'Ventas Digitales',
    icono: ShoppingCart,
    color: '#a78bfa',
    getData: ({ data }) => {
      const ventas = data?.ventas || [];
      const total = ventas.reduce((s, v) => s + Number(v.monto || 0), 0);
      return {
        principal: `${ventas.length} ventas totales`,
        secundaria: `${total.toFixed(0)} Bs`,
        alerta: null,
      };
    },
    accion: 'ventas'
  },
];

// Mapa de íconos para los diálogos de categoría
const DIALOG_ICONS = {
  CheckCircle, Clock, AlertTriangle, XCircle,
};

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================
const CommandCenter = ({
  meetingsList = [],
  data = { prestamos: [], productos: [], recordatorios: [], egresos: [], notas: [] },
  servicios = [],
  settings,
  isDark,
  onNavigateToPrestamo,
  onQuickPayment,
  onNavigateTo,
}) => {
  const t = useTheme(isDark);
  const hoy = new Date();
  const mesActual = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;
  const isMobile = settings?.isMobileMode;

  // ─── Estados ────────────────────────────────────────────────
  const [aiBalance, setAiBalance] = useState('...');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [periodoMes, setPeriodoMes] = useState(mesActual);
  const [filtroCategoria, setFiltroCategoria] = useState(null); // null = todos
  const [modalPago, setModalPago] = useState({ isOpen: false, prestamo: null });
  const [modalIA, setModalIA] = useState({ isOpen: false, contenido: '', cargando: false });
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [configWidgetOpen, setConfigWidgetOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);

  // Visibilidad de widgets (persistida en localStorage)
  const [widgetVisibility, setWidgetVisibility] = useState(() => {
    try {
      const saved = localStorage.getItem('cc_widget_visibility');
      const parsed = saved ? JSON.parse(saved) : null;
      if (parsed && typeof parsed === 'object') return parsed;
    } catch (e) { /* ignore */ }
    return Object.fromEntries(MODULE_WIDGETS.map(w => [w.id, true]));
  });

  // ─── Hooks ──────────────────────────────────────────────────
  const categorias = usePrestamoCategorias(data?.prestamos);

  // ─── Efectos ─────────────────────────────────────────────────
  const fetchAiBalance = useCallback(async () => {
    setIsRefreshing(true);
    const balance = await aiService.fetchBalance(settings);
    setAiBalance(balance);
    setIsRefreshing(false);
  }, [settings]);

  useEffect(() => { fetchAiBalance(); }, [fetchAiBalance]);

  // Toast automático
  useEffect(() => {
    if (toastMsg) {
      const timer = setTimeout(() => setToastMsg(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMsg]);

  // ─── Datos calculados ───────────────────────────────────────
  const listaPrestamos = Array.isArray(data?.prestamos) ? data.prestamos.filter(p => p && p.id) : [];
  const totalCapital = listaPrestamos.reduce((acc, p) => acc + (parseFloat(p?.capital) || 0), 0);
  const totalInteresMensual = listaPrestamos.reduce((acc, p) => {
    const cap = parseFloat(p?.capital) || 0;
    const int = parseFloat(p?.interes) || 0;
    return acc + (cap * (int / 100));
  }, 0);

  const listaProductos = Array.isArray(data?.productos) ? data.productos : [];
  const valorInventario = listaProductos.reduce((acc, p) => acc + (parseFloat(p.precio_venta || p.precio || 0) * (parseInt(p.stock_actual || p.stock || 0) || 0)), 0);
  const stockBajo = listaProductos.filter(p => (parseInt(p.stock_actual || p.stock || 0) || 0) <= 5);

  const listaRecordatorios = Array.isArray(data?.recordatorios) ? data.recordatorios : [];
  const tareasPendientes = listaRecordatorios.filter(r => r.estado === 'Pendiente').sort((a, b) => {
    const pPriority = { 'Crítica': 0, 'Alta': 1, 'Media': 2, 'Baja': 3 };
    return pPriority[a.prioridad] - pPriority[b.prioridad];
  });
  const tareasCriticas = tareasPendientes.filter(r => r.prioridad === 'Crítica');

  // Balance mensual
  const egresos = Array.isArray(data?.egresos) ? data.egresos : [];
  const ventas = Array.isArray(data?.ventas) ? data.ventas : [];
  const ingresosMes = ventas.filter(v => {
    const fecha = new Date(v.fecha || v.created_at);
    return fecha.getMonth() === hoy.getMonth() && fecha.getFullYear() === hoy.getFullYear() && v.estado !== 'Pendiente';
  }).reduce((s, v) => s + Number(v.monto || 0), 0);
  const egresosMes = egresos.filter(e => {
    const fecha = new Date(e.fecha_pago || e.fecha || e.created_at);
    return fecha.getMonth() === hoy.getMonth() && fecha.getFullYear() === hoy.getFullYear();
  }).reduce((s, e) => s + Number(e.monto || 0), 0);
  const balanceMensual = ingresosMes - egresosMes;

  // Cobros del período seleccionado
  const cobrosDelPeriodo = categorias.porCobrar.filter(p => {
    if (!p.inicio) return false;
    const [year, month] = periodoMes.split('-').map(Number);
    const fechaCobro = new Date(p.inicio);
    // Mostrar si tiene deuda en el período seleccionado
    return p.mesesAdeudados?.some(m => m.startsWith(periodoMes));
  });

  // Filtrar por categoría si está seleccionada
  const cobrosFiltrados = filtroCategoria
    ? cobrosDelPeriodo.filter(p => p.categoria === filtroCategoria)
    : cobrosDelPeriodo;

  // Notificaciones automáticas
  const notificaciones = useMemo(() => {
    const notifs = [];
    
    // Deudores críticos
    categorias.deudorCritico.forEach(d => {
      notifs.push({
        id: `critico-${d.id}`,
        tipo: 'critico',
        icono: 'XCircle',
        mensaje: `${d.nombre} - ${parseFloat(d.capital).toFixed(0)} Bs (${d.mesesAtraso} meses sin pagar)`,
        accion: 'Cobrar',
        color: t.danger,
        prestamoId: d.id,
      });
    });
    
    // ⏰ Próximos primeros pagos (notificación 10 días antes)
    listaPrestamos.forEach(p => {
      try {
        const cuotas = generarCronograma(p);
        const primeraNoPagada = cuotas.find(c => c.estado !== 'pagado');
        if (!primeraNoPagada) return;
        const hoyLocal = new Date();
        const venc = new Date(primeraNoPagada.fechaVencimiento);
        const diffTime = venc.getTime() - hoyLocal.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays === 10) {
          notifs.push({
            id: `pago-prox-${p.id}`,
            tipo: 'pago-proximo',
            icono: 'Bell',
            mensaje: `🔔 ${p.nombre}: faltan EXACTAMENTE 10 DÍAS para su primer pago (${primeraNoPagada.fechaVencimiento})`,
            accion: 'Ver',
            color: '#8b5cf6',
            prestamoId: p.id,
          });
        }
      } catch (e) { /* ignorar errores de cómputo */ }
    });
    
    // Stock bajo
    stockBajo.slice(0, 3).forEach(p => {
      notifs.push({
        id: `stock-${p.id}`,
        tipo: 'stock',
        icono: 'AlertTriangle',
        mensaje: `Stock bajo: ${p.nombre} (${p.stock_actual || p.stock || 0} unidades)`,
        accion: 'Ir',
        color: '#f97316',
        navigateTo: 'inventario',
        searchTerm: p.nombre,
      });
    });
    
    // Tareas críticas
    tareasCriticas.slice(0, 3).forEach(r => {
      notifs.push({
        id: `tarea-${r.id}`,
        tipo: 'tarea',
        icono: 'Flame',
        mensaje: `Tarea crítica: ${r.titulo}`,
        accion: 'Ir',
        color: '#ef4444',
        navigateTo: 'recordatorios',
        searchTerm: r.titulo,
      });
    });
    
    // Servicios / Suscripciones
    servicios.forEach(s => {
      if (!s.fecha_pago) return;
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      const venc = new Date(s.fecha_pago);
      venc.setHours(0, 0, 0, 0);
      
      const diffTime = venc.getTime() - hoy.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays < 0) {
        notifs.push({
          id: `servicio-vencido-${s.id}`,
          tipo: 'critico',
          icono: 'XCircle',
          mensaje: `⚠️ Pago vencido: ${s.nombre} (${parseFloat(s.monto || 0).toFixed(0)} Bs) venció el ${s.fecha_pago}`,
          accion: 'Pagar',
          color: '#ef4444',
          navigateTo: 'pagos',
          searchTerm: s.nombre,
        });
      } else if (diffDays <= 5) {
        notifs.push({
          id: `servicio-prox-${s.id}`,
          tipo: 'pago-proximo',
          icono: 'AlertTriangle',
          mensaje: `📅 Próximo pago: ${s.nombre} (${parseFloat(s.monto || 0).toFixed(0)} Bs) vence en ${diffDays} días (${s.fecha_pago})`,
          accion: 'Ver',
          color: '#f59e0b',
          navigateTo: 'pagos',
          searchTerm: s.nombre,
        });
      }
    });
    
    // Pendientes
    if (categorias.pendientes.length > 0) {
      notifs.push({
        id: 'pendientes-resumen',
        tipo: 'pendiente',
        icono: 'Clock',
        mensaje: `${categorias.pendientes.length} cobros pendientes este mes`,
        accion: 'Ver',
        color: '#eab308',
      });
    }
    
    return notifs.sort((a, b) => {
      const prioridad = { critico: 0, 'pago-proximo': 1, stock: 2, tarea: 3, pendiente: 4 };
      return (prioridad[a.tipo] || 99) - (prioridad[b.tipo] || 99);
    });
  }, [categorias, stockBajo, tareasCriticas, listaPrestamos, servicios]);

  // ─── Handlers ───────────────────────────────────────────────
  const toggleWidget = (widgetId) => {
    const updated = { ...widgetVisibility, [widgetId]: !widgetVisibility[widgetId] };
    setWidgetVisibility(updated);
    localStorage.setItem('cc_widget_visibility', JSON.stringify(updated));
  };

  const abrirModalPago = (prestamo) => {
    setModalPago({ isOpen: true, prestamo });
  };

  const confirmarPago = async () => {
    const p = modalPago.prestamo;
    if (!p || !onQuickPayment) return;
    await onQuickPayment(p.id);
    setModalPago({ isOpen: false, prestamo: null });
    setToastMsg({ tipo: 'success', texto: `✅ Cobro registrado: ${p.nombre}` });
  };

  const generarResumenIA = async () => {
    setModalIA({ isOpen: true, contenido: '', cargando: true });
    try {
      const contexto = {
        capitalActivo: totalCapital,
        rendimientoMensual: totalInteresMensual,
        valorInventario,
        stockBajo: stockBajo.length,
        balanceMensual,
        totalDeudores: categorias.totales.totalPorCobrar,
        totalPendiente: categorias.totales.totalPendiente,
        deudoresCriticos: categorias.deudorCritico.map(d => ({ nombre: d.nombre, capital: d.capital, interes: d.interes, diasAtraso: d.diasAtraso || 0 })),
        totalDeudoresCriticos: categorias.deudorCritico.length,
        tareasCriticas: tareasCriticas.length,
        proveedorIA: settings.aiProvider || 'gemini',
        categoriasDetalle: [
          { nombre: 'Al Día', cantidad: categorias.alDia.length, monto: categorias.totales.totalAlDia },
          { nombre: 'Pendientes', cantidad: categorias.pendientes.length, monto: categorias.totales.totalPendiente },
          { nombre: 'Deudores 1 Mes', cantidad: categorias.deudor1Mes.length, monto: categorias.totales.totalDeudor1Mes },
          { nombre: 'Críticos', cantidad: categorias.deudorCritico.length, monto: categorias.totales.totalDeudorCritico },
        ],
        totalPorCobrar: categorias.totales.totalPorCobrar,
        totalCapitalActivo: data?.prestamos?.reduce((s, p) => s + (parseFloat(p.capital) || 0), 0) || 0,
        totalPrestamosActivos: data?.prestamos?.length || 0,
      };
      
      const prompt = `Eres un analista financiero senior. Genera un resumen ejecutivo profesional en formato JSON con los siguientes datos contextuales:\n${JSON.stringify(contexto, null, 2)}\n\nDebes responder EXACTAMENTE con este esquema JSON (sin markdown, solo JSON puro):\n\n{\n  "resumenGeneral": [\n    { "indicador": "Capital Activo", "valor": "X Bs", "variacion": "—" },\n    { "indicador": "Rendimiento Mensual", "valor": "X Bs", "variacion": "—" },\n    { "indicador": "Valor Inventario", "valor": "X Bs", "variacion": "—" },\n    { "indicador": "Balance Mensual", "valor": "X Bs", "variacion": "—" }\n  ],\n  "tablaCartera": [\n    { "concepto": "Al Día", "cantidad": "X", "monto": "X Bs", "porcentaje": "X%" },\n    { "concepto": "Pendientes", "cantidad": "X", "monto": "X Bs", "porcentaje": "X%" },\n    { "concepto": "Deudores 1 Mes", "cantidad": "X", "monto": "X Bs", "porcentaje": "X%" },\n    { "concepto": "Críticos", "cantidad": "X", "monto": "X Bs", "porcentaje": "X%" },\n    { "concepto": "Total a Cobrar", "cantidad": "—", "monto": "X Bs", "porcentaje": "100%" }\n  ],\n  "tablaInventario": [\n    { "concepto": "Productos en Stock", "cantidad": "X", "valor": "X Bs" },\n    { "concepto": "Stock Crítico", "cantidad": "X", "valor": "X Bs" }\n  ],\n  "tablaBalance": [\n    { "concepto": "Ingresos por Intereses", "ingresos": "X Bs", "egresos": "—", "neto": "X Bs" },\n    { "concepto": "Ventas Inventario", "ingresos": "X Bs", "egresos": "—", "neto": "X Bs" },\n    { "concepto": "Balance Neto", "ingresos": "X Bs", "egresos": "—", "neto": "X Bs" }\n  ],\n  "alertas": [\n    { "tipo": "Crítico", "descripcion": "Deudores con más de 30 días", "nivel": "🔴 Alto", "accion": "Gestionar cobro inmediato" }\n  ],\n  "recomendaciones": [\n    "Recomendación estratégica 1",\n    "Recomendación estratégica 2",\n    "Recomendación estratégica 3"\n  ]\n}\n\nImportante: Calcula los porcentajes correctamente. Usa datos reales del contexto. Responde SOLO con el JSON válido, sin texto adicional.`;
      
      const respuesta = await aiService.askAgent(prompt, [], {
        settings,
        activeView: 'Centro de Control',
      });
      
      setModalIA({ isOpen: true, contenido: respuesta, cargando: false });
    } catch (e) {
      setModalIA({ isOpen: true, contenido: `Error al generar: ${e.message}`, cargando: false });
    }
  };

  const handleExport = (tipo) => {
    setExportMenuOpen(false);
    if (tipo === 'pdf') {
      exportPDF({
        totalCapital,
        totalInteresMensual,
        valorInventario,
        totalPendiente: categorias.totales.totalPendiente,
        stockBajoCount: stockBajo.length,
        porCobrar: cobrosDelPeriodo,
        mesActual: periodoMes,
      });
    } else if (tipo === 'csv-cobros') {
      exportCobrosCSV(cobrosDelPeriodo, periodoMes);
    } else if (tipo === 'csv-stock') {
      exportStockBajoCSV(stockBajo);
    }
    setToastMsg({ tipo: 'success', texto: 'Reporte exportado exitosamente' });
  };

  const ActiveAILogo = settings.aiProvider === 'deepseek' ? DeepSeekLogo : GoogleLogo;

  // Períodos para selector — desde mayo 2026 en adelante
  const generarPeriodos = () => {
    const periodos = [];
    const hoy = new Date();
    const inicio = new Date(2026, 4, 1); // Mayo 2026
    const desde = hoy > inicio ? inicio : hoy;
    for (let i = 0; i <= 4; i++) {
      const d = new Date(desde.getFullYear(), desde.getMonth() + i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
      periodos.push({ key, label, esActual: i === 0 });
    }
    return periodos;
  };
  const periodosDisponibles = generarPeriodos();

  // Badge de categoría
  const CategoryBadge = ({ categoria, count, activo, onClick }) => {
    const configs = {
      AL_DIA: { Icon: CheckCircle, color: '#22c55e', label: 'Al Día' },
      PENDIENTE: { Icon: Clock, color: '#eab308', label: 'Pendientes' },
      DEUDOR_1MES: { Icon: AlertTriangle, color: '#f97316', label: 'Deudores 1M' },
      DEUDOR_CRITICO: { Icon: XCircle, color: '#ef4444', label: 'Críticos' },
    };
    const cfg = configs[categoria] || { Icon: FileText, color: t.text, label: categoria };
    return (
      <button
        onClick={onClick}
        style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '8px 14px', borderRadius: '12px', cursor: 'pointer',
          border: `1px solid ${activo ? cfg.color : t.border}`,
          backgroundColor: activo ? `${cfg.color}15` : t.input,
          color: activo ? cfg.color : t.textDim,
          fontWeight: 600, fontSize: '11px',
          transition: 'all 0.2s',
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = cfg.color; e.currentTarget.style.backgroundColor = `${cfg.color}10`; }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = activo ? cfg.color : t.border;
          e.currentTarget.style.backgroundColor = activo ? `${cfg.color}15` : t.input;
        }}
      >
        <cfg.Icon size={14} color={activo ? cfg.color : t.textDim} />
        <span>{cfg.label}</span>
        <span style={{
          padding: '2px 8px', borderRadius: '8px',
          backgroundColor: activo ? cfg.color : t.hover,
          color: activo ? '#fff' : t.textDim,
          fontSize: '10px', fontWeight: 700,
        }}>{count}</span>
      </button>
    );
  };

  // ─── Render ─────────────────────────────────────────────────
  return (
    <div className="animate-in fade-in duration-500 w-full pb-24">
      
      {/* ─── TOAST ─────────────────────────────────────────── */}
      {toastMsg && (
        <div style={{
          position: 'fixed', top: '20px', right: '20px', zIndex: 9998,
          padding: '14px 20px', borderRadius: '14px',
          backgroundColor: toastMsg.tipo === 'success' ? '#065f46' : '#7f1d1d',
          color: '#fff', fontWeight: 600, fontSize: '13px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
          animation: 'slideInRight 0.3s ease-out',
        }}>
          {toastMsg.texto}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          HEADER
          ══════════════════════════════════════════════════════ */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        paddingBottom: '16px', marginBottom: '20px',
        flexWrap: 'wrap', gap: '12px',
      }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: t.text, letterSpacing: '-0.02em', margin: 0 }}>
            Centro de Control
          </h2>
          <p style={{ fontSize: '0.75rem', color: t.textDim, marginTop: '2px', fontWeight: 500 }}>
            Panel de monitoreo y control unificado
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          
          {/* Selector de período */}
          <div style={{ position: 'relative' }}>
            <select
              value={periodoMes}
              onChange={e => setPeriodoMes(e.target.value)}
              style={{
                padding: '8px 14px', borderRadius: '12px', border: `1px solid ${t.border}`,
                backgroundColor: t.panel, color: t.text, fontSize: '11px', fontWeight: 600,
                cursor: 'pointer', outline: 'none',
              }}
            >
              {periodosDisponibles.map(p => (
                <option key={p.key} value={p.key}>
                  {p.label} {p.esActual ? '(Actual)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Estado IA */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '8px 14px', backgroundColor: t.panel,
            border: `1px solid ${t.border}`, borderRadius: '12px',
          }}>
            <ActiveAILogo />
            <div>
              <p style={{ fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: t.textDim, margin: 0 }}>
                {settings.aiProvider === 'deepseek' ? 'DeepSeek' : 'Gemini'}
              </p>
              <p style={{ fontSize: '11px', fontWeight: 600, color: t.text, marginTop: '1px', margin: 0 }}>
                {aiBalance} <span style={{ fontSize: '8px', color: t.textDim }}>{settings.aiProvider === 'deepseek' ? 'USD' : 'INF'}</span>
              </p>
            </div>
            <button
              onClick={fetchAiBalance}
              className={isRefreshing ? 'animate-spin' : ''}
              style={{ padding: '4px', borderRadius: '10px', border: 'none', background: 'transparent', color: t.textDim, cursor: 'pointer' }}
            >
              <RefreshCw size={12} />
            </button>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          FILA 1: KPIs PRINCIPALES (4 tarjetas)
          ══════════════════════════════════════════════════════ */}
      <section className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-2 lg:grid-cols-4'}`} style={{ marginBottom: '20px' }}>
        
        {/* KPI 1: Capital / Ingresos */}
        <div style={{ padding: '20px', backgroundColor: t.panel, border: `1px solid ${t.border}`, borderRadius: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: `${t.accent}15` }}>
              <Wallet size={16} color={t.accent} />
            </div>
            <span style={{ fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', padding: '4px 10px', borderRadius: '10px', backgroundColor: `${t.accent}15`, color: t.accent }}>
              Capital
            </span>
          </div>
          <p style={{ fontSize: '9px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', color: t.textDim, margin: 0 }}>Activos en Calle</p>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: t.text, letterSpacing: '-0.02em', marginTop: '2px', margin: 0 }}>
            {totalCapital.toLocaleString()} <span style={{ fontSize: '0.75rem', fontWeight: 500, color: t.textDim }}>BS</span>
          </h3>
          <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <p style={{ fontSize: '8px', fontWeight: 600, textTransform: 'uppercase', color: t.textDim, margin: 0 }}>Rend./Mes</p>
            <p style={{ fontSize: '11px', fontWeight: 600, color: t.success, margin: 0 }}>+{totalInteresMensual.toLocaleString()} BS</p>
          </div>
        </div>

        {/* KPI 2: Inventario */}
        <div style={{ padding: '20px', backgroundColor: t.panel, border: `1px solid ${t.border}`, borderRadius: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: `${stockBajo.length > 0 ? '#ef4444' : t.accent}15` }}>
              <Package size={16} color={stockBajo.length > 0 ? '#ef4444' : t.accent} />
            </div>
            <span style={{
              fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em',
              padding: '4px 10px', borderRadius: '10px',
              backgroundColor: stockBajo.length > 0 ? 'rgba(239, 68, 68, 0.10)' : `${t.accent}15`,
              color: stockBajo.length > 0 ? '#ef4444' : t.accent,
            }}>
              {stockBajo.length > 0 ? `${stockBajo.length} Stock Bajo` : 'Inventario'}
            </span>
          </div>
          <p style={{ fontSize: '9px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', color: t.textDim, margin: 0 }}>Valor Almacén</p>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: t.text, letterSpacing: '-0.02em', marginTop: '2px', margin: 0 }}>
            {valorInventario.toLocaleString()} <span style={{ fontSize: '0.75rem', fontWeight: 500, color: t.textDim }}>BS</span>
          </h3>
          <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <p style={{ fontSize: '8px', fontWeight: 600, textTransform: 'uppercase', color: t.textDim, margin: 0 }}>Artículos</p>
            <p style={{ fontSize: '11px', fontWeight: 600, color: t.text, margin: 0 }}>{listaProductos.length} items</p>
          </div>
        </div>

        {/* KPI 3: Balance Mensual */}
        <div style={{ padding: '20px', backgroundColor: t.panel, border: `1px solid ${t.border}`, borderRadius: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: `${balanceMensual >= 0 ? '#22c55e' : '#ef4444'}15` }}>
              <BarChart3 size={16} color={balanceMensual >= 0 ? '#22c55e' : '#ef4444'} />
            </div>
            <span style={{
              fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em',
              padding: '4px 10px', borderRadius: '10px',
              backgroundColor: balanceMensual >= 0 ? 'rgba(34, 197, 94, 0.10)' : 'rgba(239, 68, 68, 0.10)',
              color: balanceMensual >= 0 ? '#22c55e' : '#ef4444',
            }}>
              Balance
            </span>
          </div>
          <p style={{ fontSize: '9px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', color: t.textDim, margin: 0 }}>Este Mes</p>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: t.text, letterSpacing: '-0.02em', marginTop: '2px', margin: 0 }}>
            {balanceMensual >= 0 ? '+' : ''}{balanceMensual.toLocaleString()} <span style={{ fontSize: '0.75rem', fontWeight: 500, color: t.textDim }}>BS</span>
          </h3>
          <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <p style={{ fontSize: '8px', fontWeight: 600, textTransform: 'uppercase', color: t.textDim, margin: 0 }}>Ingresos</p>
            <p style={{ fontSize: '11px', fontWeight: 600, color: t.success, margin: 0 }}>+{ingresosMes.toLocaleString()} BS</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
            <p style={{ fontSize: '8px', fontWeight: 600, textTransform: 'uppercase', color: t.textDim, margin: 0 }}>Egresos</p>
            <p style={{ fontSize: '11px', fontWeight: 600, color: t.danger, margin: 0 }}>-{egresosMes.toLocaleString()} BS</p>
          </div>
        </div>

        {/* KPI 4: Cobros Pendientes */}
        <div style={{ padding: '20px', backgroundColor: t.panel, border: `1px solid ${t.border}`, borderRadius: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: `${categorias.totales.totalPorCobrar > 0 ? '#eab308' : t.accent}15` }}>
              <CalendarDays size={16} color={categorias.totales.totalPorCobrar > 0 ? '#eab308' : t.accent} />
            </div>
            <span style={{
              fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em',
              padding: '4px 10px', borderRadius: '10px',
              backgroundColor: categorias.totales.totalPorCobrar > 0 ? 'rgba(234, 179, 8, 0.10)' : `${t.accent}15`,
              color: categorias.totales.totalPorCobrar > 0 ? '#eab308' : t.accent,
            }}>
              {categorias.totales.totalPorCobrar > 0 ? `${categorias.totales.totalPorCobrar} Pendientes` : 'Al Día'}
            </span>
          </div>
          <p style={{ fontSize: '9px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', color: t.textDim, margin: 0 }}>Por Cobrar</p>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: t.text, letterSpacing: '-0.02em', marginTop: '2px', margin: 0 }}>
            {categorias.totales.totalPendiente.toLocaleString()} <span style={{ fontSize: '0.75rem', fontWeight: 500, color: t.textDim }}>BS</span>
          </h3>
          <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: `1px solid ${t.border}` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontSize: '8px', color: t.textDim }}>Al Día</span>
              <span style={{ fontSize: '10px', fontWeight: 600, color: '#22c55e' }}>{categorias.totales.alDia}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '8px', color: t.textDim }}>Críticos</span>
              <span style={{ fontSize: '10px', fontWeight: 600, color: categorias.totales.deudorCritico > 0 ? '#ef4444' : t.textDim }}>
                {categorias.totales.deudorCritico}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          FILA 1B: BARRA DE CATEGORÍAS
          ══════════════════════════════════════════════════════ */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap',
        marginBottom: '20px', padding: '14px 18px',
        backgroundColor: t.panel, border: `1px solid ${t.border}`, borderRadius: '14px',
      }}>
        <span style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: t.textDim, marginRight: '8px' }}>
          Deudores:
        </span>
        <CategoryBadge categoria="AL_DIA" count={categorias.totales.alDia} activo={filtroCategoria === 'AL_DIA'} onClick={() => setFiltroCategoria(filtroCategoria === 'AL_DIA' ? null : 'AL_DIA')} />
        <CategoryBadge categoria="PENDIENTE" count={categorias.totales.pendientes} activo={filtroCategoria === 'PENDIENTE'} onClick={() => setFiltroCategoria(filtroCategoria === 'PENDIENTE' ? null : 'PENDIENTE')} />
        <CategoryBadge categoria="DEUDOR_1MES" count={categorias.totales.deudor1Mes} activo={filtroCategoria === 'DEUDOR_1MES'} onClick={() => setFiltroCategoria(filtroCategoria === 'DEUDOR_1MES' ? null : 'DEUDOR_1MES')} />
        <CategoryBadge categoria="DEUDOR_CRITICO" count={categorias.totales.deudorCritico} activo={filtroCategoria === 'DEUDOR_CRITICO'} onClick={() => setFiltroCategoria(filtroCategoria === 'DEUDOR_CRITICO' ? null : 'DEUDOR_CRITICO')} />
        {filtroCategoria && (
          <button
            onClick={() => setFiltroCategoria(null)}
            style={{ padding: '6px 10px', borderRadius: '8px', border: 'none', background: 'transparent', color: t.textDim, cursor: 'pointer', fontSize: '10px', fontWeight: 600, marginLeft: '4px' }}
          >
            <X size={12} style={{ marginRight: '4px', display: 'inline' }} /> Limpiar
          </button>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════
          FILA 2: COBROS — TIMELINE MEJORADO
          ══════════════════════════════════════════════════════ */}
      <section style={{ marginBottom: '24px' }}>
        <div style={{
          padding: '24px', backgroundColor: t.panel,
          border: `1px solid ${t.border}`, borderRadius: '16px',
        }}>
          {/* Header con fecha destacada */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: '20px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                width: '42px', height: '42px', borderRadius: '12px',
                backgroundColor: `${t.warning}20`, color: t.warning,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <CalendarDays size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '14px', fontWeight: 700, color: t.text, margin: 0 }}>
                  Cobros — {periodosDisponibles.find(p => p.key === periodoMes)?.label || periodoMes}
                </h3>
                <p style={{
                  fontSize: '10px', color: t.textDim, margin: '2px 0 0',
                  display: 'flex', alignItems: 'center', gap: '6px',
                }}>
                  <span style={{
                    display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%',
                    backgroundColor: cobrosDelPeriodo.length > 0 ? t.warning : t.success,
                  }} />
                  {cobrosDelPeriodo.length} deudores · {categorias.totales.totalPendiente.toLocaleString()} {settings?.loanDefaultCurrency || 'BOB'} pendientes
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              {['AL_DIA', 'PENDIENTE', 'DEUDOR_1MES', 'DEUDOR_CRITICO'].map(cat => {
                const count = cobrosDelPeriodo.filter(p => p.categoria === cat).length;
                if (count === 0) return null;
                return (
                  <div key={cat} onClick={() => setFiltroCategoria(filtroCategoria === cat ? null : cat)}
                    style={{
                      padding: '5px 10px', borderRadius: '8px', cursor: 'pointer', fontSize: '9px', fontWeight: 600,
                      backgroundColor: filtroCategoria === cat ? (cat === 'DEUDOR_CRITICO' ? '#ef444420' : `${t.accent}20`) : t.input,
                      color: filtroCategoria === cat ? (cat === 'DEUDOR_CRITICO' ? '#ef4444' : t.accent) : t.textDim,
                      border: `1px solid ${filtroCategoria === cat ? (cat === 'DEUDOR_CRITICO' ? '#ef444440' : `${t.accent}40`) : 'transparent'}`,
                      display: 'flex', alignItems: 'center', gap: '4px',
                    }}>
                    <span style={{
                      width: '5px', height: '5px', borderRadius: '50%',
                      backgroundColor: cat === 'AL_DIA' ? '#22c55e' : cat === 'PENDIENTE' ? '#eab308' : cat === 'DEUDOR_1MES' ? '#f97316' : '#ef4444',
                    }} />
                    {count}
                  </div>
                );
              })}
              {filtroCategoria && (
                <div onClick={() => setFiltroCategoria(null)}
                  style={{
                    padding: '5px 10px', borderRadius: '8px', cursor: 'pointer', fontSize: '9px',
                    color: t.textDim, border: `1px solid ${t.border}`,
                  }}>
                  ✕
                </div>
              )}
            </div>
          </div>

          {/* Tabla de cobros con diseño mejorado */}
          {cobrosFiltrados.length > 0 ? (
            <div style={{ overflowX: 'auto', borderRadius: '12px', border: `1px solid ${t.borderLight || t.border}` }}>
              <table className="w-full text-left" style={{ borderCollapse: 'collapse', minWidth: '650px' }}>
                <thead>
                  <tr style={{
                    backgroundColor: t.input,
                    borderBottom: `1px solid ${t.border}`,
                  }}>
                    <th style={{ padding: '10px 14px', fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: t.textDim }}>Prestamista</th>
                    <th style={{ padding: '10px 14px', fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: t.textDim }}>Estado</th>
                    <th style={{ padding: '10px 14px', fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: t.textDim }}>Deuda</th>
                    <th style={{ padding: '10px 14px', fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: t.textDim, textAlign: 'right' }}>Capital</th>
                    <th style={{ padding: '10px 14px', fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: t.textDim, textAlign: 'right' }}>Interés</th>
                    <th style={{ padding: '10px 14px', fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: t.textDim, textAlign: 'center' }}>Cobrar</th>
                  </tr>
                </thead>
                <tbody>
                  {cobrosFiltrados.map(p => {
                    const badgeColor = p.dialog?.color || t.textDim;
                    const isCritico = p.categoria === 'DEUDOR_CRITICO';
                    return (
                      <tr key={p.id} style={{
                        borderBottom: `1px solid ${t.borderLight || t.border}`,
                        transition: 'background 0.15s',
                        backgroundColor: isCritico ? `${t.danger}06` : 'transparent',
                      }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = t.hover}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = isCritico ? `${t.danger}06` : 'transparent'}
                      >
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{
                              width: '32px', height: '32px', borderRadius: '10px',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: '11px', fontWeight: 700,
                              backgroundColor: `${badgeColor}18`, color: badgeColor,
                            }}>
                              {p.nombre?.charAt(0) || '?'}
                            </div>
                            <div>
                              <p style={{ fontSize: '12px', fontWeight: 600, color: t.text, margin: 0 }}>
                                {p.nombre || 'Sin nombre'}
                              </p>
                              <p style={{ fontSize: '9px', color: t.textDim, margin: '2px 0 0' }}>
                                {p.moneda || 'Bs'} · {(parseFloat(p.capital) * (parseFloat(p.interes) / 100)).toFixed(0)} Bs/mes
                              </p>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: '5px',
                            padding: '4px 10px', borderRadius: '8px',
                            backgroundColor: `${badgeColor}15`, color: badgeColor,
                            fontSize: '10px', fontWeight: 600,
                          }}>
                            {(() => {
                              const IconComp = DIALOG_ICONS[p.dialog?.icono] || CheckCircle;
                              return <IconComp size={11} />;
                            })()}
                            {p.categoria === 'AL_DIA' ? 'Al Día' :
                              p.categoria === 'PENDIENTE' ? 'Pendiente' :
                              p.categoria === 'DEUDOR_1MES' ? 'Vencido' : 'Crítico'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <p style={{ fontSize: '11px', fontWeight: 600, color: t.text, margin: 0 }}>
                            {p.mesesAtraso > 0 ? `${p.mesesAtraso} mes${p.mesesAtraso > 1 ? 'es' : ''}` : 'Al corriente'}
                          </p>
                          {p.mesesAtraso > 3 && (
                            <div style={{
                              marginTop: '4px', padding: '2px 8px', borderRadius: '4px',
                              backgroundColor: `${t.danger}15`, color: t.danger,
                              fontSize: '8px', fontWeight: 600, display: 'inline-block',
                            }}>
                              ⚠ Riesgo alto
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                          <p style={{ fontSize: '12px', fontWeight: 700, color: t.text, margin: 0, fontFamily: 'monospace' }}>
                            {(parseFloat(p.capital) || 0).toLocaleString()}
                          </p>
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                          <p style={{ fontSize: '11px', fontWeight: 600, color: '#22c55e', margin: 0, fontFamily: 'monospace' }}>
                            +{(parseFloat(p.capital) * (parseFloat(p.interes) / 100) || 0).toLocaleString()}
                          </p>
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                          <button onClick={() => abrirModalPago(p)}
                            style={{
                              padding: '6px 14px', borderRadius: '8px', border: 'none',
                              backgroundColor: isCritico ? '#ef4444' : t.accent,
                              color: 'white', fontSize: '10px', fontWeight: 600, cursor: 'pointer',
                              transition: 'all 0.15s',
                            }}
                            onMouseEnter={e => e.target.style.opacity = '0.8'}
                            onMouseLeave={e => e.target.style.opacity = '1'}>
                            Cobrar
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{
              textAlign: 'center', padding: '40px 20px',
              color: t.textDim, fontSize: '11px',
            }}>
              <CalendarDays size={32} style={{ opacity: 0.3, marginBottom: '8px' }} />
              <p style={{ margin: 0, fontWeight: 500 }}>No hay cobros para este período</p>
              <p style={{ margin: '4px 0 0', fontSize: '9px' }}>Selecciona otro mes o agrega nuevos préstamos</p>
            </div>
          )}
        </div>
      </section>
                            backgroundColor: `${badgeColor}10`,
                            border: `1px solid ${badgeColor}20`,
                            maxWidth: '200px',
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                              {(() => {
                                const IconComp = DIALOG_ICONS[p.dialog?.icono] || CheckCircle;
                                return <IconComp size={14} color={badgeColor} />;
                              })()}
                              <p style={{ fontSize: '10px', fontWeight: 700, color: badgeColor, margin: 0 }}>
                                {p.dialog?.titulo || 'Sin riesgo'}
                              </p>
                            </div>
                            <p style={{ fontSize: '8px', color: t.textDim, margin: '2px 0 0 0', lineHeight: 1.3 }}>
                              {p.dialog?.mensaje || ''}
                            </p>
                            <span style={{
                              display: 'inline-block', marginTop: '4px',
                              padding: '2px 8px', borderRadius: '6px',
                              backgroundColor: `${badgeColor}20`, color: badgeColor,
                              fontSize: '8px', fontWeight: 700,
                            }}>
                              Riesgo: {p.dialog?.nivel || 'N/A'}
                            </span>
                          </div>
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                          <p style={{ fontSize: '13px', fontWeight: 700, color: t.text, margin: 0 }}>
                            {parseFloat(p.capital).toLocaleString()}
                          </p>
                          <p style={{ fontSize: '8px', color: t.textDim, margin: '1px 0 0 0' }}>{p.moneda || 'Bs'}</p>
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                          <p style={{ fontSize: '13px', fontWeight: 700, color: t.accent, margin: 0 }}>
                            {(parseFloat(p.capital) * (parseFloat(p.interes) / 100)).toLocaleString()}
                          </p>
                          <p style={{ fontSize: '8px', color: t.textDim, margin: '1px 0 0 0' }}>
                            {p.moneda || 'Bs'} · {parseFloat(p.interes)}%
                          </p>
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                          <button
                            onClick={() => abrirModalPago(p)}
                            style={{
                              padding: '8px 14px', borderRadius: '10px', border: 'none',
                              backgroundColor: badgeColor, color: '#fff',
                              fontSize: '10px', fontWeight: 700, cursor: 'pointer',
                              transition: 'all 0.2s',
                              opacity: p.categoria === 'AL_DIA' ? 0.5 : 1,
                            }}
                            disabled={p.categoria === 'AL_DIA'}
                            onMouseEnter={e => { if (p.categoria !== 'AL_DIA') e.currentTarget.style.opacity = '0.85'; }}
                            onMouseLeave={e => { if (p.categoria !== 'AL_DIA') e.currentTarget.style.opacity = '1'; }}
                          >
                            <DollarSign size={12} style={{ marginRight: '4px', display: 'inline' }} />
                            Cobrar
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ padding: '40px', textAlign: 'center', border: `1px dashed ${t.border}`, borderRadius: '12px' }}>
              <CheckCircle size={32} color="#22c55e" style={{ margin: '0 0 8px 0' }} />
              <p style={{ fontSize: '13px', fontWeight: 600, color: t.text, margin: 0 }}>
                {filtroCategoria ? 'No hay deudores en esta categoría' : '¡Todos los deudores están al día!'}
              </p>
              <p style={{ fontSize: '10px', color: t.textDim, margin: '4px 0 0 0' }}>
                {periodosDisponibles.find(p => p.key === periodoMes)?.label || periodoMes}
              </p>
            </div>
          )}

          {/* Totales */}
          {cobrosFiltrados.length > 0 && (
            <div style={{
              marginTop: '16px', paddingTop: '16px',
              borderTop: `1px solid ${t.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              flexWrap: 'wrap', gap: '12px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                <div>
                  <p style={{ fontSize: '8px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: t.textDim, margin: 0 }}>Total Pendiente</p>
                  <p style={{ fontSize: '16px', fontWeight: 700, color: t.text, margin: '2px 0 0 0' }}>
                    {cobrosFiltrados.reduce((s, p) => {
                      const cap = parseFloat(p.capital) || 0;
                      const int = parseFloat(p.interes) || 0;
                      return s + (cap * (int / 100));
                    }, 0).toLocaleString()} BS
                  </p>
                </div>
                <div style={{ width: '1px', height: '30px', backgroundColor: t.border }}></div>
                <div>
                  <p style={{ fontSize: '8px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: t.textDim, margin: 0 }}>Deudores</p>
                  <p style={{ fontSize: '16px', fontWeight: 700, color: t.text, margin: '2px 0 0 0' }}>{cobrosFiltrados.length}</p>
                </div>
                <div style={{ width: '1px', height: '30px', backgroundColor: t.border }}></div>
                <div>
                  <p style={{ fontSize: '8px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: t.textDim, margin: 0 }}>Críticos</p>
                  <p style={{ fontSize: '16px', fontWeight: 700, color: categorias.totales.deudorCritico > 0 ? '#ef4444' : t.text, margin: '2px 0 0 0' }}>
                    {categorias.totales.deudorCritico}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>



      {/* ══════════════════════════════════════════════════════
          FILA 4: CENTRO DE NOTIFICACIONES
          ══════════════════════════════════════════════════════ */}
      {notificaciones.length > 0 && (
        <section style={{ marginBottom: '24px' }}>
          <div style={{
            padding: '18px', borderRadius: '14px',
            backgroundColor: t.panel, border: `1px solid ${t.border}`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <Bell size={16} color={t.warning} />
              <h3 style={{ fontSize: '12px', fontWeight: 700, color: t.text, margin: 0 }}>
                Notificaciones
              </h3>
              <span style={{
                padding: '2px 8px', borderRadius: '8px',
                backgroundColor: `${t.warning}15`, color: t.warning,
                fontSize: '9px', fontWeight: 700, marginLeft: 'auto',
              }}>
                {notificaciones.length} alertas
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {notificaciones.map(n => (
                <div
                  key={n.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '12px 14px', borderRadius: '12px',
                    backgroundColor: `${n.color}08`, border: `1px solid ${n.color}20`,
                    transition: 'all 0.2s',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = `${n.color}15`; }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = `${n.color}08`; }}
                  onClick={() => {
                    if (n.prestamoId && onNavigateToPrestamo) {
                      onNavigateToPrestamo(n.prestamoId);
                    } else if (n.navigateTo && onNavigateTo) {
                      onNavigateTo(n.navigateTo, { search: n.searchTerm });
                    }
                  }}
                >
                  {(() => {
                    const NotifIcon = DIALOG_ICONS[n.icono] || Bell;
                    return <NotifIcon size={16} color={n.color} />;
                  })()}
                  <p style={{ flex: 1, fontSize: '11px', fontWeight: 600, color: t.text, margin: 0, lineHeight: 1.4 }}>
                    {n.mensaje}
                  </p>
                  <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                    {n.tipo === 'critico' && n.prestamoId && (
                      <button
                        onClick={() => {
                          const p = categorias.deudorCritico.find(d => d.id === n.prestamoId);
                          if (p) abrirModalPago(p);
                        }}
                        style={{
                          padding: '6px 12px', borderRadius: '8px', border: 'none',
                          backgroundColor: n.color, color: '#fff',
                          fontSize: '9px', fontWeight: 700, cursor: 'pointer',
                        }}
                      >
                        Cobrar
                      </button>
                    )}
                    <button
                      onClick={() => {
                        if (n.prestamoId && onNavigateToPrestamo) {
                          onNavigateToPrestamo(n.prestamoId);
                        } else if (n.navigateTo && onNavigateTo) {
                          onNavigateTo(n.navigateTo, { search: n.searchTerm });
                        }
                      }}
                      style={{
                        padding: '6px 12px', borderRadius: '8px', border: `1px solid ${t.border}`,
                        backgroundColor: 'transparent', color: t.textDim,
                        fontSize: '9px', fontWeight: 600, cursor: 'pointer',
                      }}
                    >
                      {n.accion}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════
          FILA 5: ACCIONES AVANZADAS
          ══════════════════════════════════════════════════════ */}
      <section style={{ marginBottom: '24px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap',
          padding: '16px 20px', borderRadius: '14px',
          backgroundColor: t.panel, border: `1px solid ${t.border}`,
        }}>
          
          {/* Resumen IA */}
          <button
            onClick={generarResumenIA}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '10px 18px', borderRadius: '12px', border: 'none',
              background: `linear-gradient(135deg, ${t.accent}, ${t.accent}cc)`,
              color: '#fff', fontSize: '11px', fontWeight: 700, cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: `0 4px 14px ${t.accent}30`,
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <Brain size={16} />
            Resumen Ejecutivo IA
          </button>

          {/* Exportar */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setExportMenuOpen(!exportMenuOpen)}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '10px 18px', borderRadius: '12px',
                border: `1px solid ${t.border}`, backgroundColor: t.input,
                color: t.text, fontSize: '11px', fontWeight: 600, cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = t.accent; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = t.border; }}
            >
              <Download size={14} />
              Exportar <ChevronDown size={10} />
            </button>
            
            {exportMenuOpen && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, marginTop: '6px',
                padding: '8px', borderRadius: '12px',
                backgroundColor: t.panel, border: `1px solid ${t.border}`,
                boxShadow: '0 12px 30px rgba(0,0,0,0.3)',
                zIndex: 100, minWidth: '200px',
              }}>
                {[
                  { label: 'PDF - Reporte Ejecutivo', tipo: 'pdf', Icono: FileText },
                  { label: 'CSV - Tabla de Cobros', tipo: 'csv-cobros', Icono: FileSpreadsheet },
                  { label: 'CSV - Stock Crítico', tipo: 'csv-stock', Icono: AlertTriangle },
                ].map(item => (
                  <button
                    key={item.tipo}
                    onClick={() => handleExport(item.tipo)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '10px 14px', borderRadius: '8px',
                      border: 'none', background: 'transparent', color: t.text,
                      fontSize: '11px', fontWeight: 500, cursor: 'pointer',
                      textAlign: 'left', transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = t.hover; }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >
                    <item.Icono size={14} color={t.accent} />
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={fetchAiBalance}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '10px 18px', borderRadius: '12px',
              border: `1px solid ${t.border}`, backgroundColor: t.input,
              color: t.textDim, fontSize: '11px', fontWeight: 600, cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = t.accent; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = t.border; }}
          >
            <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} /> Refrescar
          </button>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          MODAL DE CONFIRMACIÓN DE PAGO
          ══════════════════════════════════════════════════════ */}
      <CommandModal
        isOpen={modalPago.isOpen}
        onClose={() => setModalPago({ isOpen: false, prestamo: null })}
        onConfirm={confirmarPago}
        titulo={`Confirmar cobro de ${modalPago.prestamo?.nombre || ''}`}
        mensaje={`¿Estás seguro de registrar el cobro de ${modalPago.prestamo?.nombre || ''} por ${modalPago.prestamo ? (parseFloat(modalPago.prestamo.capital) * (parseFloat(modalPago.prestamo.interes) / 100)).toFixed(0) : 0} Bs correspondiente a ${periodoMes}?`}
        icono={<DollarSign size={22} color="#22c55e" />}
        colorAccent="#22c55e"
        confirmText="Confirmar Cobro"
        cancelText="Cancelar"
        isDark={isDark}
      >
        {modalPago.prestamo && (
          <div style={{
            padding: '12px', borderRadius: '10px',
            backgroundColor: `${modalPago.prestamo.dialog?.color || t.textDim}10`,
            border: `1px solid ${modalPago.prestamo.dialog?.color || t.border}20`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
              {(() => {
                const IconComp = DIALOG_ICONS[modalPago.prestamo.dialog?.icono] || CheckCircle;
                return <IconComp size={14} color={modalPago.prestamo.dialog?.color || t.textDim} />;
              })()}
              <p style={{ fontSize: '11px', fontWeight: 600, color: modalPago.prestamo.dialog?.color || t.text, margin: 0 }}>
                {modalPago.prestamo.dialog?.titulo}
              </p>
            </div>
            <p style={{ fontSize: '9px', color: t.textDim, margin: '4px 0 0 0' }}>
              {modalPago.prestamo.dialog?.mensaje}
            </p>
          </div>
        )}

        {/* Resumen del cobro: solo intereses */}
        {modalPago.prestamo && (
          <div style={{
            marginTop: '12px', padding: '12px', borderRadius: '10px',
            backgroundColor: `${t.accent}10`, border: `1px solid ${t.border}`,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div>
              <p style={{ fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: t.textDim, margin: 0 }}>
                Capital Original
              </p>
              <p style={{ fontSize: '14px', fontWeight: 700, color: t.text, margin: '2px 0 0 0' }}>
                {parseFloat(modalPago.prestamo.capital).toLocaleString()} {modalPago.prestamo.moneda || 'Bs'}
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: t.textDim, margin: 0 }}>
                Interés a Cobrar
              </p>
              <p style={{ fontSize: '14px', fontWeight: 700, color: '#22c55e', margin: '2px 0 0 0' }}>
                +{(parseFloat(modalPago.prestamo.capital) * (parseFloat(modalPago.prestamo.interes) / 100)).toLocaleString()} {modalPago.prestamo.moneda || 'Bs'}
              </p>
              <p style={{ fontSize: '9px', color: t.textDim, margin: '1px 0 0 0' }}>
                ({parseFloat(modalPago.prestamo.interes)}% del capital)
              </p>
            </div>
          </div>
        )}
      </CommandModal>

      {/* ══════════════════════════════════════════════════════
          MODAL DE RESUMEN IA PROFESIONAL
          ══════════════════════════════════════════════════════ */}
      <ResumenIAModal
        isOpen={modalIA.isOpen}
        onClose={() => setModalIA({ isOpen: false, contenido: '', cargando: false })}
        contenido={modalIA.contenido}
        cargando={modalIA.cargando}
        isDark={isDark}
        titulo="Resumen Ejecutivo IA"
        onExportPDF={(data) => {
          try {
            exportPDF({
              totalCapital: totalCapital,
              totalInteresMensual: totalInteresMensual,
              valorInventario: valorInventario,
              stockBajoCount: stockBajo.length,
              totalPendiente: categorias.totales.totalPendiente,
              porCobrar: cobrosDelPeriodo,
              mesActual: periodoMes,
            });
          } catch (e) {
            setToastMsg({ tipo: 'error', texto: `Error al exportar: ${e.message}` });
          }
        }}
      />

    </div>
  );
};

export default CommandCenter;
