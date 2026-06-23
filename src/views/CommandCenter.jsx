import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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

// ─── COUNT-UP ANIMATED NUMBER ─────────────────────────────────────────────────
const CountUp = ({ value = 0, decimals = 0, suffix = '', style = {}, duration = 900 }) => {
  const [display, setDisplay] = useState(0);
  const prevValue = useRef(0);
  const rafRef = useRef(null);

  useEffect(() => {
    const start = prevValue.current;
    const end = Number(value) || 0;
    prevValue.current = end;
    if (start === end) { setDisplay(end); return; }
    const startTime = performance.now();
    const tick = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out quint
      const eased = 1 - Math.pow(1 - progress, 5);
      const current = start + (end - start) * eased;
      setDisplay(current);
      if (progress < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value, duration]);

  const fmt = display.toLocaleString('es', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return <span style={style}>{fmt}{suffix}</span>;
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
  onPayService,
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
  const [modalServicio, setModalServicio] = useState({ isOpen: false, servicio: null });
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
  // const categorias = usePrestamoCategorias(data?.prestamos);

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
  const valorInventario = listaProductos.reduce((acc, p) => {
    const costo = parseFloat(p.precio_costo !== undefined && p.precio_costo !== null ? p.precio_costo : (p.precio_compra || p.precio_venta || p.precio || 0));
    return acc + (costo * (parseInt(p.stock_actual || p.stock || 0) || 0));
  }, 0);
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

  // NUEVO: Categorización de cobros del período seleccionado
  const cobrosDelPeriodo = useMemo(() => {
    const [selYear, selMonth] = periodoMes.split('-').map(Number);
    const finDelMesSel = new Date(selYear, selMonth, 0);

    return listaPrestamos.map(p => {
      if (!p.inicio) return null;
      const pagos = Array.isArray(p.pagos) ? p.pagos : [];
      const inicio = new Date(p.inicio);
      if (isNaN(inicio.getTime())) return null;

      const topePeriodo = new Date(selYear, selMonth - 1, 31);
      const mesesEsperados = [];
      let cursor = new Date(inicio.getFullYear(), inicio.getMonth() + 1, 1);
      const fin = p.fin ? new Date(p.fin) : null;
      const tope = fin && fin < topePeriodo ? fin : topePeriodo;

      while (cursor <= tope) {
        const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`;
        mesesEsperados.push(key);
        cursor.setMonth(cursor.getMonth() + 1);
      }

      const mesesAdeudados = mesesEsperados.filter(m => !pagos.includes(m));
      const totalAtraso = mesesAdeudados.length;

      let categoria, dialog;
      if (totalAtraso === 0) {
        categoria = 'AL_DIA';
        dialog = {
          color: '#22c55e',
          icono: 'CheckCircle',
          titulo: 'Al día',
          mensaje: 'Cliente al día en este periodo.',
          nivel: 'Bajo',
        };
      } else if (totalAtraso === 1) {
        categoria = 'PENDIENTE';
        dialog = {
          color: '#eab308',
          icono: 'Clock',
          titulo: 'Pendiente',
          mensaje: `Debe el mes de ${mesesAdeudados[0]}. Enviar recordatorio.`,
          nivel: 'Bajo',
        };
      } else if (totalAtraso === 2) {
        categoria = 'DEUDOR_1MES';
        dialog = {
          color: '#f97316',
          icono: 'AlertTriangle',
          titulo: 'Riesgo medio',
          mensaje: `Debe 2 meses (${mesesAdeudados.join(', ')}). Contactar.`,
          nivel: 'Medio',
        };
      } else {
        categoria = 'DEUDOR_CRITICO';
        dialog = {
          color: '#ef4444',
          icono: 'XCircle',
          titulo: 'Riesgo alto',
          mensaje: `Debe ${totalAtraso} meses (${mesesAdeudados.join(', ')}). RIESGO CRÍTICO.`,
          nivel: 'Alto',
        };
      }

      return {
        ...p,
        categoria,
        mesesAtraso: totalAtraso,
        mesesAdeudados,
        dialog,
        mesesEsperados
      };
    }).filter(p => {
      if (!p) return false;
      const inicio = new Date(p.inicio);
      if (inicio > finDelMesSel) return false;

      if (p.fin) {
        const fin = new Date(p.fin);
        const inicioDelMesSel = new Date(selYear, selMonth - 1, 1);
        if (fin < inicioDelMesSel && p.mesesAtraso === 0) {
          return false;
        }
      }
      return true;
    });
  }, [listaPrestamos, periodoMes]);

  // NUEVO: Categorías del periodo seleccionado que reemplazan el const categorias inicial
  const categorias = useMemo(() => {
    const alDia = cobrosDelPeriodo.filter(p => p.categoria === 'AL_DIA');
    const pendientes = cobrosDelPeriodo.filter(p => p.categoria === 'PENDIENTE');
    const deudor1Mes = cobrosDelPeriodo.filter(p => p.categoria === 'DEUDOR_1MES');
    const deudorCritico = cobrosDelPeriodo.filter(p => p.categoria === 'DEUDOR_CRITICO');
    const porCobrar = cobrosDelPeriodo.filter(p => p.categoria !== 'AL_DIA');

    const totalPendiente = porCobrar.reduce((sum, p) => {
      const cap = parseFloat(p.capital) || 0;
      const int = parseFloat(p.interes) || 0;
      return sum + (cap * (int / 100));
    }, 0);

    const totalAlDia = alDia.reduce((sum, p) => {
      const cap = parseFloat(p.capital) || 0;
      const int = parseFloat(p.interes) || 0;
      return sum + (cap * (int / 100));
    }, 0);

    const totalDeudor1Mes = deudor1Mes.reduce((sum, p) => {
      const cap = parseFloat(p.capital) || 0;
      const int = parseFloat(p.interes) || 0;
      return sum + (cap * (int / 100));
    }, 0);

    const totalDeudorCritico = deudorCritico.reduce((sum, p) => {
      const cap = parseFloat(p.capital) || 0;
      const int = parseFloat(p.interes) || 0;
      return sum + (cap * (int / 100));
    }, 0);

    return {
      alDia,
      pendientes,
      deudor1Mes,
      deudorCritico,
      porCobrar,
      todos: cobrosDelPeriodo,
      totales: {
        alDia: alDia.length,
        pendientes: pendientes.length,
        deudor1Mes: deudor1Mes.length,
        deudorCritico: deudorCritico.length,
        totalPorCobrar: porCobrar.length,
        totalPendiente,
        totalAlDia,
        totalDeudor1Mes,
        totalDeudorCritico,
      }
    };
  }, [cobrosDelPeriodo]);

  // Filtrar por categoría si está seleccionada
  const cobrosFiltrados = filtroCategoria
    ? cobrosDelPeriodo.filter(p => p.categoria === filtroCategoria)
    : cobrosDelPeriodo;

  // NUEVO: Lista detallada de egresos y servicios (pagados + proyectados)
  const listaEgresosDetallados = useMemo(() => {
    const egresosDelMes = egresos.filter(e => {
      const fecha = new Date(e.fecha || e.fecha_pago || e.created_at);
      return fecha.getMonth() === hoy.getMonth() && fecha.getFullYear() === hoy.getFullYear();
    }).map(e => ({
      id: e.id,
      nombre: e.descripcion || e.categoria || 'Egreso',
      monto: Number(e.monto || 0),
      tipo: 'egreso',
      fecha: e.fecha || e.created_at ? new Date(e.fecha || e.created_at).toISOString().split('T')[0] : '',
    }));

    const serviciosActivos = (servicios || []).filter(s => s.activo !== false);

    const serviciosProyectados = serviciosActivos.filter(s => {
      const yaPagado = egresosDelMes.some(e => e.nombre.toLowerCase().includes(s.nombre.toLowerCase()));
      return !yaPagado;
    }).map(s => ({
      id: `serv-proj-${s.id}`,
      nombre: `[Pendiente] ${s.nombre}`,
      monto: Number(s.monto || 0),
      tipo: 'servicio_pendiente',
      fecha: s.fecha_pago || '',
      servicioOriginal: s
    }));

    return [...egresosDelMes, ...serviciosProyectados];
  }, [egresos, servicios, hoy.getMonth(), hoy.getFullYear()]);

  const totalEgresosYServicios = listaEgresosDetallados.reduce((sum, item) => sum + item.monto, 0);

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
    
    // ⏰ Próximas cuotas de préstamos (vencen en los próximos 10 días o ya vencidas)
    listaPrestamos.forEach(p => {
      try {
        const cuotas = p.tipo_pago === 'diario' ? generarCronogramaDiario(p) : generarCronograma(p);
        const hoyLocal = new Date();
        hoyLocal.setHours(0, 0, 0, 0);

        // Buscar la primera cuota pendiente o vencida
        const primeraNoPagada = cuotas.find(c => c.estado === 'pendiente' || c.estado === 'vencido');
        if (primeraNoPagada) {
          const venc = new Date(primeraNoPagada.fechaVencimiento);
          venc.setHours(0, 0, 0, 0);
          const diffTime = venc.getTime() - hoyLocal.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          // Si ya venció o vence en los próximos 10 días
          if (diffDays <= 10) {
            notifs.push({
              id: `cuota-prox-${p.id}-${primeraNoPagada.key}`,
              tipo: diffDays < 0 ? 'critico' : 'pago-proximo',
              icono: diffDays < 0 ? 'XCircle' : 'Clock',
              mensaje: `Cuota de ${p.nombre} ${diffDays < 0 ? 'vencida hace ' + Math.abs(diffDays) + ' días' : 'vence en ' + diffDays + ' días'} (${primeraNoPagada.fechaVencimiento}). Mes: ${primeraNoPagada.label}. Inicio: ${p.inicio}`,
              accion: 'Cobrar',
              color: diffDays < 0 ? t.danger : '#8b5cf6',
              prestamoId: p.id,
            });
          }
        }
      } catch (e) { /* ignorar */ }
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
          tipo: 'servicio',
          icono: 'XCircle',
          mensaje: `⚠️ Pago vencido: ${s.nombre} (${parseFloat(s.monto || 0).toFixed(0)} Bs) venció el ${s.fecha_pago}`,
          accion: 'Pagar',
          color: '#ef4444',
          servicio: s,
        });
      } else if (diffDays <= 5) {
        notifs.push({
          id: `servicio-prox-${s.id}`,
          tipo: 'servicio',
          icono: 'AlertTriangle',
          mensaje: `📅 Próximo pago: ${s.nombre} (${parseFloat(s.monto || 0).toFixed(0)} Bs) vence en ${diffDays} días (${s.fecha_pago})`,
          accion: 'Pagar',
          color: '#f59e0b',
          servicio: s,
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
      const prioridad = { critico: 0, servicio: 0, 'pago-proximo': 1, stock: 2, tarea: 3, pendiente: 4 };
      return (prioridad[a.tipo] || 99) - (prioridad[b.tipo] || 99);
    });
  }, [categorias, stockBajo, tareasCriticas, listaPrestamos, servicios, t.danger]);

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

  const abrirModalServicio = (servicio) => {
    setModalServicio({ isOpen: true, servicio });
  };

  const confirmarPagoServicio = async () => {
    const s = modalServicio.servicio;
    if (!s || !onPayService) return;
    const success = await onPayService(s);
    if (success) {
      setModalServicio({ isOpen: false, servicio: null });
      setToastMsg({ tipo: 'success', texto: `✅ Pago registrado: ${s.nombre}` });
    }
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
          padding: '8px 14px', minHeight: '44px', borderRadius: '12px', cursor: 'pointer',
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
    <div className="animate-fadeIn w-full pb-24">
      
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
          <h2 style={{ fontSize: 20, fontWeight: 800, color: t.text, letterSpacing: '-0.03em', margin: 0, fontFamily: "'Space Grotesk', 'Geist', sans-serif" }}>
            Centro de Control
          </h2>
          <p style={{ fontSize: 11, color: t.textSecondary, marginTop: 3, fontWeight: 500, letterSpacing: '-0.005em', fontFamily: "'Geist', sans-serif" }}>
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
                padding: '8px 14px', minHeight: '44px', borderRadius: '12px', border: `1px solid ${t.border}`,
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
            padding: '8px 14px', minHeight: '44px', backgroundColor: t.panel,
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
          FILA 1: KPIs PRINCIPALES (3 tarjetas, adaptable)
          ══════════════════════════════════════════════════════ */}
      <section className={`grid gap-3 ${isMobile ? 'grid-cols-1' : 'grid-cols-2 lg:grid-cols-4'}`} style={{ marginBottom: '20px' }}>
        
        {/* KPI 1: Capital Activo en Préstamos */}
        <div className="animate-countUp stagger-1" style={{ padding: '18px', backgroundColor: t.panel, border: `1px solid ${t.border}`, borderRadius: 14, animationFillMode: 'both' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: `${t.accent}12` }}>
              <Wallet size={15} color={t.accent} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', backgroundColor: t.accent }} />
              <span style={{ fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: t.textDim }}>
                Activo
              </span>
            </div>
          </div>
          <p style={{ fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: t.textDim, margin: 0 }}>Capital Activo en Préstamos</p>
          <h3 style={{ fontSize: 22, fontWeight: 700, color: t.text, letterSpacing: '-0.035em', marginTop: 4, margin: '4px 0 0', fontFamily: "'Space Grotesk', 'Geist', sans-serif" }}>
            <CountUp value={totalCapital} />{' '}<span style={{ fontSize: 11, fontWeight: 500, color: t.textDim }}>BS</span>
          </h3>
          <div style={{ marginTop: 12, paddingTop: 10, borderTop: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <p style={{ fontSize: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: t.textDim, margin: 0 }}>Rend. Esperado/Mes</p>
            <p style={{ fontSize: 11, fontWeight: 700, color: t.success, margin: 0, fontFamily: "'JetBrains Mono', monospace" }}>+<CountUp value={totalInteresMensual} /> BS</p>
          </div>
        </div>

        {/* KPI 2: Inventario a Costo */}
        <div className="animate-countUp stagger-2" style={{ padding: '18px', backgroundColor: t.panel, border: `1px solid ${t.border}`, borderRadius: 14, animationFillMode: 'both' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: `${stockBajo.length > 0 ? t.danger : t.accent}12` }}>
              <Package size={15} color={stockBajo.length > 0 ? t.danger : t.accent} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', backgroundColor: stockBajo.length > 0 ? t.danger : t.accent }} />
              <span style={{ fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: stockBajo.length > 0 ? t.danger : t.textDim }}>
                {stockBajo.length > 0 ? `${stockBajo.length} Stock Bajo` : 'Almacén'}
              </span>
            </div>
          </div>
          <p style={{ fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: t.textDim, margin: 0 }}>Valor Almacén (Costo)</p>
          <h3 style={{ fontSize: 22, fontWeight: 700, color: t.text, letterSpacing: '-0.035em', marginTop: 4, margin: '4px 0 0', fontFamily: "'Space Grotesk', sans-serif" }}>
            <CountUp value={valorInventario} />{' '}<span style={{ fontSize: 11, fontWeight: 500, color: t.textDim }}>BS</span>
          </h3>
          <div style={{ marginTop: 12, paddingTop: 10, borderTop: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <p style={{ fontSize: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: t.textDim, margin: 0 }}>Artículos</p>
            <p style={{ fontSize: 11, fontWeight: 700, color: t.text, margin: 0, fontFamily: "'JetBrains Mono', monospace" }}><CountUp value={listaProductos.length} /> items</p>
          </div>
        </div>

        {/* KPI 3: Egresos y Servicios (col-span-2) */}
        <div className={`animate-countUp stagger-3 col-span-1 md:col-span-2 lg:col-span-2`} style={{ padding: '18px', backgroundColor: t.panel, border: `1px solid ${t.border}`, borderRadius: 14, animationFillMode: 'both' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: `${t.danger}12` }}>
              <CreditCard size={15} color={t.danger} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', backgroundColor: t.danger }} />
              <span style={{ fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: t.textDim }}>
                Egresos y Servicios
              </span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.2fr 0.8fr', gap: '16px' }}>
            {/* Tabla compacta de egresos */}
            <div>
              <p style={{ fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: t.textDim, marginBottom: 8 }}>Detalle de Egresos</p>
              <div style={{ maxHeight: '100px', overflowY: 'auto', border: `1px solid ${t.border}`, borderRadius: 8, backgroundColor: t.bg }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${t.border}`, backgroundColor: t.input, position: 'sticky', top: 0 }}>
                      <th style={{ padding: '4px 6px', textAlign: 'left', color: t.textDim, fontWeight: 600 }}>Descripción</th>
                      <th style={{ padding: '4px 6px', textAlign: 'right', color: t.textDim, fontWeight: 600 }}>Monto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {listaEgresosDetallados.length > 0 ? (
                      listaEgresosDetallados.map(item => (
                        <tr key={item.id} style={{ borderBottom: `1px solid ${t.borderLight || t.border}` }}>
                          <td style={{ padding: '4px 6px', color: item.tipo === 'servicio_pendiente' ? t.textSecondary : t.text, fontWeight: 500 }}>
                            {item.nombre}
                            {item.tipo === 'servicio_pendiente' && (
                              <span style={{ marginLeft: 6, display: 'inline-flex', alignItems: 'center', gap: '4px', color: t.warning, fontSize: '8px', fontWeight: 600 }}>
                                <span style={{ display: 'inline-block', width: '4px', height: '4px', borderRadius: '50%', backgroundColor: t.warning }} />
                                PENDIENTE
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '4px 6px', textAlign: 'right', fontWeight: 700, color: item.tipo === 'servicio_pendiente' ? t.textSecondary : t.danger }}>
                            {item.monto.toLocaleString()} BS
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="2" style={{ padding: '16px 6px', textAlign: 'center', color: t.textDim }}>
                          Sin egresos registrados
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, padding: '0 2px' }}>
                <span style={{ fontSize: '9px', fontWeight: 700, color: t.textDim, textTransform: 'uppercase' }}>Total Egresos</span>
                <span style={{ fontSize: '12px', fontWeight: 800, color: t.danger, fontFamily: 'monospace' }}>
                  {totalEgresosYServicios.toLocaleString()} BS
                </span>
              </div>
            </div>

            {/* Balance mensual resumen */}
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', borderLeft: isMobile ? 'none' : `1px solid ${t.border}`, paddingLeft: isMobile ? 0 : '16px', borderTop: isMobile ? `1px solid ${t.border}` : 'none', paddingTop: isMobile ? '12px' : 0 }}>
              <p style={{ fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: t.textDim, margin: 0 }}>Balance Neto</p>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: balanceMensual >= 0 ? t.success : t.danger, letterSpacing: '-0.035em', margin: '2px 0 6px', fontFamily: "'Space Grotesk', sans-serif" }}>
                {balanceMensual >= 0 ? '+' : '-'}{Math.abs(balanceMensual).toLocaleString()} <span style={{ fontSize: 9, fontWeight: 500, color: t.textDim }}>BS</span>
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: t.textDim }}>Ingresos</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: t.success, fontFamily: "'JetBrains Mono', monospace" }}>+{ingresosMes.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: t.textDim }}>Egresos</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: t.danger, fontFamily: "'JetBrains Mono', monospace" }}>-{egresosMes.toLocaleString()}</span>
                </div>
              </div>
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
                <h3 style={{ fontSize: 13, fontWeight: 700, color: t.text, margin: 0, fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '-0.02em' }}>
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
                              <p style={{ fontSize: 12, fontWeight: 700, color: t.text, margin: 0, fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '-0.02em' }}>
                                {p.nombre || 'Sin nombre'}
                              </p>
                              <p style={{ fontSize: '9px', color: t.textDim, margin: '2px 0 0' }}>
                                {p.moneda || 'Bs'} · {(parseFloat(p.capital) * (parseFloat(p.interes) / 100)).toFixed(0)} Bs/mes
                              </p>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 600, color: t.text }}>
                            <span style={{
                              display: 'inline-block',
                              width: '6px',
                              height: '6px',
                              borderRadius: '50%',
                              backgroundColor: badgeColor,
                            }} />
                            {p.categoria === 'AL_DIA' ? 'Al Día' :
                              p.categoria === 'PENDIENTE' ? 'Pendiente' :
                              p.categoria === 'DEUDOR_1MES' ? 'Vencido' : 'Crítico'}
                          </div>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <p style={{ fontSize: '11px', fontWeight: 600, color: t.text, margin: 0 }}>
                            {p.mesesAtraso > 0 ? `${p.mesesAtraso} mes${p.mesesAtraso > 1 ? 'es' : ''}` : 'Al corriente'}
                          </p>
                          {p.mesesAtraso > 3 && (
                            <div style={{
                              marginTop: '4px', display: 'inline-flex', alignItems: 'center', gap: '4px',
                              color: t.danger, fontSize: '9px', fontWeight: 600,
                            }}>
                              <span style={{ display: 'inline-block', width: '5px', height: '5px', borderRadius: '50%', backgroundColor: t.danger }} />
                              Riesgo alto
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                          <p style={{ fontSize: '12px', fontWeight: 700, color: t.text, margin: 0, fontFamily: 'monospace' }}>
                            {(parseFloat(p.capital) || 0).toLocaleString()}
                          </p>
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                          <p style={{ fontSize: 12, fontWeight: 700, color: '#22c55e', margin: 0, fontFamily: "'JetBrains Mono', monospace" }}>
                            +{(parseFloat(p.capital) * (parseFloat(p.interes) / 100) || 0).toLocaleString()}
                          </p>
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                          <button onClick={() => abrirModalPago(p)}
                            style={{
                              padding: '10px 16px', minHeight: '44px', borderRadius: '8px', border: 'none',
                              backgroundColor: isCritico ? '#ef4444' : t.accent,
                              color: isCritico ? '#fff' : (isDark ? '#000' : '#fff'), fontSize: '11px', fontWeight: 600, cursor: 'pointer',
                              transition: 'all 0.15s',
                              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
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
              <h3 style={{ fontSize: 12, fontWeight: 700, color: t.text, margin: 0, fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '-0.02em' }}>
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
                    if (n.tipo === 'servicio' && n.servicio) {
                      abrirModalServicio(n.servicio);
                    } else if (n.prestamoId && onNavigateToPrestamo) {
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
                    {n.accion === 'Pagar' && n.servicio && (
                      <button
                        onClick={() => abrirModalServicio(n.servicio)}
                        style={{
                          padding: '6px 12px', borderRadius: '8px', border: 'none',
                          backgroundColor: t.danger, color: '#fff',
                          fontSize: '9px', fontWeight: 700, cursor: 'pointer',
                        }}
                      >
                        Pagar
                      </button>
                    )}
                    {n.accion === 'Cobrar' && n.prestamoId && (
                      <button
                        onClick={() => {
                          const p = listaPrestamos.find(d => d.id === n.prestamoId);
                          if (p) abrirModalPago(p);
                        }}
                        style={{
                          padding: '6px 12px', borderRadius: '8px', border: 'none',
                          backgroundColor: n.color || t.accent, color: '#fff',
                          fontSize: '9px', fontWeight: 700, cursor: 'pointer',
                        }}
                      >
                        Cobrar
                      </button>
                    )}
                    {n.accion && n.accion !== 'Pagar' && n.accion !== 'Cobrar' && (
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
                    )}
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
              padding: '10px 18px', minHeight: '44px', borderRadius: '12px', border: 'none',
              backgroundColor: t.accent,
              color: isDark ? '#000' : '#fff', fontSize: '11px', fontWeight: 700, cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.opacity = '0.9'; }}
            onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
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
                padding: '10px 18px', minHeight: '44px', borderRadius: '12px',
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
              padding: '10px 18px', minHeight: '44px', borderRadius: '12px',
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
          MODAL DE CONFIRMACIÓN DE PAGO DE SERVICIO
          ══════════════════════════════════════════════════════ */}
      <CommandModal
        isOpen={modalServicio.isOpen}
        onClose={() => setModalServicio({ isOpen: false, servicio: null })}
        onConfirm={confirmarPagoServicio}
        titulo={`Confirmar pago de ${modalServicio.servicio?.nombre || ''}`}
        mensaje={`¿Estás seguro de registrar el pago de servicio ${modalServicio.servicio?.nombre || ''} por ${modalServicio.servicio?.monto || 0} Bs? Se creará un egreso y la fecha de vencimiento del servicio se actualizará al mes siguiente.`}
        icono={<CreditCard size={22} color="#f14c4c" />}
        colorAccent="#f14c4c"
        confirmText="Confirmar Pago"
        cancelText="Cancelar"
        isDark={isDark}
      />

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
