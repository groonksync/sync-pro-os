import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Wallet, Package, BarChart3, CalendarDays, RefreshCw,
  Bell, CheckSquare, Video, Cloud, ShieldCheck, FileText,
  Lock, CreditCard, Briefcase, ShoppingCart, Settings,
  ChevronDown, ChevronUp, AlertTriangle, Clock, UserPlus,
  Download, Brain, Eye, EyeOff, X, Filter, Box, Check,
  CheckCircle, XCircle, DollarSign, Sparkles, Flame,
  FileSpreadsheet, LayoutDashboard
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
  return <span className="num-tabular tabular-nums" style={style}>{fmt}{suffix}</span>;
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
          FILA 1: KPIs PRINCIPALES (Tarjetas Ejecutivas con Gráfico de Barras)
          ══════════════════════════════════════════════════════ */}
      <section className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-3'}`} style={{ marginBottom: '28px' }}>
        
        {/* KPI 1: Capital Activo en Préstamos */}
        <div className="metric-card-executive animate-countUp stagger-1" style={{ backgroundColor: t.panel, borderColor: 'rgba(255,255,255,0.07)' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: t.textSecondary, letterSpacing: '-0.01em' }}>
                Active Capital
              </span>
              <span className="badge-luxury-success" style={{ padding: '2px 8px', fontSize: '9px' }}>
                +2.5%
              </span>
            </div>
            <h3 style={{ fontSize: 26, fontWeight: 800, color: t.text, letterSpacing: '-0.04em', margin: 0, fontFamily: "'Geist', 'Space Grotesk', sans-serif" }}>
              <CountUp value={totalCapital} /> <span style={{ fontSize: 13, fontWeight: 600, color: t.textMuted, letterSpacing: '0.02em' }}>BOB</span>
            </h3>
          </div>
          {/* Executive Bar Chart */}
          <div style={{ width: '100%', marginTop: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '5px', height: '46px', padding: '0 2px' }}>
              {[45, 52, 60, 58, 68, 72, 80, 78, 88, 100].map((val, idx, arr) => {
                const isLast = idx === arr.length - 1;
                return (
                  <div key={idx} style={{ flex: 1, height: '100%', display: 'flex', alignItems: 'flex-end' }}>
                    <div
                      style={{
                        width: '100%',
                        height: `${val}%`,
                        borderRadius: '4px 4px 2px 2px',
                        backgroundColor: isLast ? '#10b981' : 'rgba(255, 255, 255, 0.1)',
                        boxShadow: isLast ? '0 0 10px rgba(16, 185, 129, 0.4)' : 'none',
                        transition: 'all 0.25s ease',
                      }}
                    />
                  </div>
                );
              })}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', fontSize: '9px', fontWeight: 600, color: t.textDim }}>
              <span>Evolución Mensual</span>
              <span style={{ color: '#10b981' }}>+2.5% vs Mes Anterior</span>
            </div>
          </div>
        </div>

        {/* KPI 2: Inventario a Costo */}
        <div className="metric-card-executive animate-countUp stagger-2" style={{ backgroundColor: t.panel, borderColor: 'rgba(255,255,255,0.07)' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: t.textSecondary, letterSpacing: '-0.01em' }}>
                Inventory Value
              </span>
              <span className="badge-luxury-success" style={{ padding: '2px 8px', fontSize: '9px', backgroundColor: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b', borderColor: 'rgba(245, 158, 11, 0.3)' }}>
                +6.3%
              </span>
            </div>
            <h3 style={{ fontSize: 26, fontWeight: 800, color: t.text, letterSpacing: '-0.04em', margin: 0, fontFamily: "'Geist', 'Space Grotesk', sans-serif" }}>
              <CountUp value={valorInventario} /> <span style={{ fontSize: 13, fontWeight: 600, color: t.textMuted, letterSpacing: '0.02em' }}>BOB</span>
            </h3>
          </div>
          {/* Executive Bar Chart */}
          <div style={{ width: '100%', marginTop: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '5px', height: '46px', padding: '0 2px' }}>
              {[60, 65, 55, 70, 75, 68, 82, 85, 92, 100].map((val, idx, arr) => {
                const isLast = idx === arr.length - 1;
                return (
                  <div key={idx} style={{ flex: 1, height: '100%', display: 'flex', alignItems: 'flex-end' }}>
                    <div
                      style={{
                        width: '100%',
                        height: `${val}%`,
                        borderRadius: '4px 4px 2px 2px',
                        backgroundColor: isLast ? '#f59e0b' : 'rgba(255, 255, 255, 0.1)',
                        boxShadow: isLast ? '0 0 10px rgba(245, 158, 11, 0.4)' : 'none',
                        transition: 'all 0.25s ease',
                      }}
                    />
                  </div>
                );
              })}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', fontSize: '9px', fontWeight: 600, color: t.textDim }}>
              <span>Rotación de Stock</span>
              <span style={{ color: '#f59e0b' }}>+6.3% Crecimiento</span>
            </div>
          </div>
        </div>

        {/* KPI 3: Balance Neto Mensual */}
        <div className="metric-card-executive animate-countUp stagger-3" style={{ backgroundColor: t.panel, borderColor: 'rgba(255,255,255,0.07)' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: t.textSecondary, letterSpacing: '-0.01em' }}>
                Net Balance
              </span>
              <span className="badge-luxury-success" style={{ padding: '2px 8px', fontSize: '9px' }}>
                {balanceMensual >= 0 ? '+2.5%' : '-1.8%'}
              </span>
            </div>
            <h3 style={{ fontSize: 26, fontWeight: 800, color: balanceMensual >= 0 ? '#10b981' : '#f87171', letterSpacing: '-0.04em', margin: 0, fontFamily: "'Geist', 'Space Grotesk', sans-serif" }}>
              {balanceMensual >= 0 ? '+' : '-'}<CountUp value={Math.abs(balanceMensual)} /> <span style={{ fontSize: 13, fontWeight: 600, color: t.textMuted, letterSpacing: '0.02em' }}>BOB</span>
            </h3>
          </div>
          {/* Executive Bar Chart */}
          <div style={{ width: '100%', marginTop: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '5px', height: '46px', padding: '0 2px' }}>
              {[30, 45, 50, 42, 60, 65, 75, 70, 85, 100].map((val, idx, arr) => {
                const isLast = idx === arr.length - 1;
                const barColor = balanceMensual >= 0 ? '#10b981' : '#f87171';
                return (
                  <div key={idx} style={{ flex: 1, height: '100%', display: 'flex', alignItems: 'flex-end' }}>
                    <div
                      style={{
                        width: '100%',
                        height: `${val}%`,
                        borderRadius: '4px 4px 2px 2px',
                        backgroundColor: isLast ? barColor : 'rgba(255, 255, 255, 0.1)',
                        boxShadow: isLast ? `0 0 10px ${barColor}60` : 'none',
                        transition: 'all 0.25s ease',
                      }}
                    />
                  </div>
                );
              })}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', fontSize: '9px', fontWeight: 600, color: t.textDim }}>
              <span>Flujo Neto</span>
              <span style={{ color: balanceMensual >= 0 ? '#10b981' : '#f87171' }}>
                {balanceMensual >= 0 ? 'Margen Positivo' : 'Déficit del Mes'}
              </span>
            </div>
          </div>
        </div>

      </section>

      {/* ══════════════════════════════════════════════════════
          FILA 2: COBROS — EXECUTIVE LOAN COLLECTIONS TABLE
          ══════════════════════════════════════════════════════ */}
      <section style={{ marginBottom: '28px' }}>
        <div style={{
          padding: '24px', backgroundColor: t.panel,
          border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        }}>
          {/* Header con filtros segmentados */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: '20px', flexWrap: 'wrap', gap: '14px',
          }}>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: t.text, margin: 0, letterSpacing: '-0.02em', fontFamily: "'Geist', sans-serif" }}>
                Executive Loan Collections
              </h3>
              <p style={{
                fontSize: '11px', color: t.textMuted, margin: '3px 0 0',
                display: 'flex', alignItems: 'center', gap: '6px',
              }}>
                <span style={{
                  display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%',
                  backgroundColor: cobrosDelPeriodo.length > 0 ? '#fbbf24' : '#34d399',
                }} />
                {cobrosDelPeriodo.length} clientes · <span className="num-tabular" style={{ fontWeight: 700, color: t.text }}>{categorias.totales.totalPendiente.toLocaleString()} {settings?.loanDefaultCurrency || 'BOB'}</span> pendientes
              </p>
            </div>

            {/* Segmented Filter Buttons */}
            <div className="tab-segmented-wrap">
              <button
                onClick={() => setFiltroCategoria(null)}
                className={`tab-segmented-btn ${filtroCategoria === null ? 'active' : ''}`}
              >
                Todos ({cobrosDelPeriodo.length})
              </button>
              <button
                onClick={() => setFiltroCategoria(filtroCategoria === 'AL_DIA' ? null : 'AL_DIA')}
                className={`tab-segmented-btn ${filtroCategoria === 'AL_DIA' ? 'active' : ''}`}
              >
                <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#10b981' }} />
                Al Día ({categorias.totales.alDia})
              </button>
              <button
                onClick={() => setFiltroCategoria(filtroCategoria === 'PENDIENTE' ? null : 'PENDIENTE')}
                className={`tab-segmented-btn ${filtroCategoria === 'PENDIENTE' ? 'active' : ''}`}
              >
                <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#f59e0b' }} />
                Pendientes ({categorias.totales.pendientes})
              </button>
              <button
                onClick={() => setFiltroCategoria(filtroCategoria === 'DEUDOR_CRITICO' ? null : 'DEUDOR_CRITICO')}
                className={`tab-segmented-btn ${filtroCategoria === 'DEUDOR_CRITICO' ? 'active' : ''}`}
              >
                <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#ef4444' }} />
                Críticos ({categorias.totales.deudorCritico})
              </button>
            </div>
          </div>

          {/* Tabla de cobros con diseño executive */}
          {cobrosFiltrados.length > 0 ? (
            <div className="table-luxury-container" style={{ border: '1px solid rgba(255,255,255,0.05)', backgroundColor: 'transparent', boxShadow: 'none' }}>
              <table className="table-luxury">
                <thead>
                  <tr>
                    <th style={{ width: '28%' }}>Client</th>
                    <th style={{ width: '18%' }}>Status</th>
                    <th style={{ width: '14%' }}>Overdue</th>
                    <th style={{ width: '16%', textAlign: 'right' }}>Capital</th>
                    <th style={{ width: '14%', textAlign: 'right' }}>Interest</th>
                    <th style={{ width: '10%', textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {cobrosFiltrados.map(p => {
                    const badgeColor = p.dialog?.color || t.textDim;
                    const isCritico = p.categoria === 'DEUDOR_CRITICO';
                    return (
                      <tr key={p.id} style={{ backgroundColor: isCritico ? 'rgba(239, 68, 68, 0.04)' : 'transparent' }}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div className="icon-squircle" style={{
                              width: '34px', height: '34px', borderRadius: '10px',
                              fontSize: '12px', fontWeight: 800,
                              backgroundColor: `${badgeColor}18`, color: badgeColor, border: `1px solid ${badgeColor}30`
                            }}>
                              {p.nombre?.charAt(0) || '?'}
                            </div>
                            <div>
                              <p style={{ fontSize: 13, fontWeight: 600, color: t.text, margin: 0, letterSpacing: '-0.01em' }}>
                                {p.nombre || 'Sin nombre'}
                              </p>
                              <p style={{ fontSize: '10px', color: t.textMuted, margin: '2px 0 0' }}>
                                {p.moneda || 'BOB'} · {(parseFloat(p.capital) * (parseFloat(p.interes) / 100)).toFixed(0)} BOB/mes
                              </p>
                            </div>
                          </div>
                        </td>
                        <td>
                          {p.categoria === 'AL_DIA' && (
                            <span className="badge-luxury-success">Al Día</span>
                          )}
                          {p.categoria === 'PENDIENTE' && (
                            <span className="badge-luxury-warning">Pendiente</span>
                          )}
                          {p.categoria === 'DEUDOR_1MES' && (
                            <span className="badge-luxury-warning">1 Mes</span>
                          )}
                          {p.categoria === 'DEUDOR_CRITICO' && (
                            <span className="badge-luxury-danger">Crítico</span>
                          )}
                        </td>
                        <td>
                          <p className="num-tabular" style={{ fontSize: '12px', fontWeight: 600, color: p.mesesAtraso > 0 ? '#f59e0b' : t.text, margin: 0 }}>
                            {p.mesesAtraso > 0 ? `${p.mesesAtraso} ${p.mesesAtraso === 1 ? 'mes' : 'meses'}` : '0'}
                          </p>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <p className="num-tabular" style={{ fontSize: '13px', fontWeight: 700, color: t.text, margin: 0 }}>
                            {(parseFloat(p.capital) || 0).toLocaleString()} {p.moneda || 'BOB'}
                          </p>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <p className="num-tabular" style={{ fontSize: '13px', fontWeight: 700, color: '#10b981', margin: 0 }}>
                            +{(parseFloat(p.capital) * (parseFloat(p.interes) / 100) || 0).toLocaleString()} BOB
                          </p>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            onClick={() => onNavigateToPrestamo && onNavigateToPrestamo(p.id, 'emitir-recibo')}
                            className="btn-action-pill btn-action-pill-primary"
                          >
                            Cobrar ›
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
              textAlign: 'center', padding: '48px 20px',
              color: t.textDim, fontSize: '11px',
            }}>
              <CalendarDays size={32} style={{ opacity: 0.25, margin: '0 auto 8px' }} />
              <p style={{ margin: 0, fontWeight: 600, color: t.text }}>No hay cobros para este período</p>
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
                          if (onNavigateToPrestamo) onNavigateToPrestamo(n.prestamoId, 'emitir-recibo');
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
