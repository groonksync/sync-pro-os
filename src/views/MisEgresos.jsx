import React, { useState, useMemo, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { getTheme, useTheme } from '../lib/theme';
import {
  CreditCard, Calendar, Plus, Trash2, Edit3, Check, DollarSign,
  AlertCircle, ChevronRight, Layers, PieChart, Sparkles, Filter,
  Search, ArrowUpRight, ArrowDownRight, RefreshCw, X, ShieldAlert,
  Info, TrendingDown, Target, Zap, Clock, ShieldCheck, Tag,
  BarChart2, FileText, CheckCircle2, Bookmark, Flame, AlertTriangle,
  ArrowRight, Download, Users, User, Tv, Cpu, Cloud, ShoppingCart,
  Activity, HelpCircle, Save, Percent, PlusCircle, ExternalLink,
  Play, Pause, Link, Bell, CheckSquare
} from 'lucide-react';
import { exportEgresosCSV } from '../utils/exportReport';
import FinancialWeeklyOverview from '../components/FinancialWeeklyOverview';

// ── COMPONENTE DE CONTEO ANIMADO CON NÚMEROS TABULARES ──────────────────
const CountUp = ({ value, duration = 800 }) => {
  const [display, setDisplay] = useState(0);

  React.useEffect(() => {
    let start = 0;
    const end = parseFloat(value) || 0;
    if (start === end) {
      setDisplay(end);
      return;
    }
    const startTime = performance.now();
    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start + (end - start) * ease));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [value, duration]);

  return <span className="num-tabular">{display.toLocaleString()}</span>;
};

// ── CATEGORÍAS PRECONFIGURADAS DE SERVICIOS / SUSCRIPCIONES ──────────────
const SERVICIO_CATEGORIAS = [
  { label: 'Streaming', icon: Tv, color: '#f43f5e' },
  { label: 'IA / Productividad', icon: Cpu, color: '#8b5cf6' },
  { label: 'Cloud / Hosting', icon: Cloud, color: '#38bdf8' },
  { label: 'Servicios Básicos', icon: Zap, color: '#fbbf24' },
  { label: 'Compras / Equipamiento', icon: ShoppingCart, color: '#2dd4bf' },
  { label: 'Personal / Salud', icon: Activity, color: '#e879f9' },
  { label: 'Otro', icon: HelpCircle, color: '#94a3b8' }
];

const catServicioConfig = Object.fromEntries(SERVICIO_CATEGORIAS.map(c => [c.label, c]));

// Helper para parsear fecha local sin desfase UTC
const parseLocalDate = (dateStr) => {
  if (!dateStr) return new Date();
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d || 1);
};

const MisEgresos = ({ data, setData, servicios = [], setServicios, onRefresh, isDark = true, settings }) => {
  const t = useTheme(isDark);
  const isMobile = settings?.isMobileMode;
  
  // Listas sincronizadas
  const egresos = useMemo(() => Array.isArray(data?.egresos) ? data.egresos : [], [data?.egresos]);
  const activeServicios = useMemo(() => Array.isArray(servicios) ? servicios : [], [servicios]);

  // Pestañas: 'servicios' | 'presupuesto' | 'historial'
  const [activeTab, setActiveTab] = useState('servicios');

  // Control de Presupuesto Mensual (Persistido)
  const [monthlyBudget, setMonthlyBudget] = useState(() => {
    try {
      const saved = localStorage.getItem('inefable_monthly_budget');
      return saved ? parseFloat(saved) : 2500;
    } catch {
      return 2500;
    }
  });
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [tempBudgetInput, setTempBudgetInput] = useState(monthlyBudget.toString());

  const handleSaveBudget = () => {
    const val = Math.max(parseFloat(tempBudgetInput) || 0, 0);
    setMonthlyBudget(val);
    localStorage.setItem('inefable_monthly_budget', val.toString());
    setIsEditingBudget(false);
  };

  // Modales de suscripciones
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [serviceLoading, setServiceLoading] = useState(false);
  const [editingService, setEditingService] = useState(null);

  const [serviceForm, setServiceForm] = useState({
    nombre: '',
    monto: '',
    fecha_inicio: new Date().toISOString().split('T')[0],
    es_ilimitado: true,
    fecha_fin: '',
    metodo: 'Tarjeta',
    categoria: 'Streaming',
    tipo: 'Mensual',
    dias_recordatorio: '3',
    estado_suscripcion: 'Activa',
    url_servicio: '',
    notas: '',
    contribuciones: []
  });

  // Modal de registro/edición de egreso
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenseLoading, setExpenseLoading] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [expenseForm, setExpenseForm] = useState({
    descripcion: '',
    monto: '',
    categoria: 'Servicio',
    fecha: new Date().toISOString().split('T')[0]
  });

  // Registro rápido
  const [quickExpense, setQuickExpense] = useState({
    descripcion: '',
    monto: '',
    categoria: 'Servicio',
    fecha: new Date().toISOString().split('T')[0]
  });
  const [quickLoading, setQuickLoading] = useState(false);

  // Filtros de Historial
  const [historySearch, setHistorySearch] = useState('');
  const [historyCategory, setHistoryCategory] = useState('Todas');
  const [historyStartDate, setHistoryStartDate] = useState('');
  const [historyEndDate, setHistoryEndDate] = useState('');

  // ── CO-PAGADORES DINÁMICOS ──────────────────────────────────────
  const addContributor = () => {
    setServiceForm(prev => ({
      ...prev,
      contribuciones: [
        ...prev.contribuciones,
        { id: Math.random().toString(), nombre: '', monto: '', pagado: false }
      ]
    }));
  };

  const removeContributor = (id) => {
    setServiceForm(prev => ({
      ...prev,
      contribuciones: prev.contribuciones.filter(c => c.id !== id)
    }));
  };

  const updateContributor = (id, key, val) => {
    setServiceForm(prev => ({
      ...prev,
      contribuciones: prev.contribuciones.map(c => {
        if (c.id === id) return { ...c, [key]: val };
        return c;
      })
    }));
  };

  const computedNetCost = useMemo(() => {
    const total = parseFloat(serviceForm.monto) || 0;
    const contributorsSum = (serviceForm.contribuciones || []).reduce((acc, c) => acc + (parseFloat(c.monto) || 0), 0);
    return Math.max(total - contributorsSum, 0);
  }, [serviceForm.monto, serviceForm.contribuciones]);

  // ── CÁLCULOS FINANCIEROS DEL MES ACTUAL ──────────────────────────
  const hoy = new Date();
  const mesActualIndex = hoy.getMonth();
  const anioActual = hoy.getFullYear();

  // Egresos registrados en el mes corriente
  const egresosMesActual = useMemo(() => {
    return egresos.filter(e => {
      const f = parseLocalDate(e.fecha || e.created_at);
      return f.getMonth() === mesActualIndex && f.getFullYear() === anioActual;
    });
  }, [egresos, mesActualIndex, anioActual]);

  const totalEgresosMes = useMemo(() => {
    return egresosMesActual.reduce((acc, e) => acc + (parseFloat(e.monto) || 0), 0);
  }, [egresosMesActual]);

  // Suma total de aportes externos en todas las suscripciones
  const totalAportesProyectados = useMemo(() => {
    return activeServicios.reduce((acc, s) => {
      if (s.estado_suscripcion === 'En Pausa' || s.estado_suscripcion === 'Cancelada') return acc;
      const contribs = Array.isArray(s.contribuciones) ? s.contribuciones : [];
      return acc + contribs.reduce((sum, c) => sum + (parseFloat(c.monto) || 0), 0);
    }, 0);
  }, [activeServicios]);

  // Servicios pendientes / próximos del mes
  const serviciosPendientes = useMemo(() => {
    return activeServicios.filter(s => {
      if (s.estado_suscripcion === 'En Pausa' || s.estado_suscripcion === 'Cancelada') return false;
      const f = parseLocalDate(s.fecha_pago || s.fecha_inicio);
      const finMes = new Date(anioActual, mesActualIndex + 1, 0);
      return f <= finMes;
    });
  }, [activeServicios, mesActualIndex, anioActual]);

  const totalPendienteMes = useMemo(() => {
    return serviciosPendientes.reduce((acc, s) => {
      const total = parseFloat(s.monto) || 0;
      const contribs = Array.isArray(s.contribuciones) ? s.contribuciones : [];
      const sumContribs = contribs.reduce((sum, c) => sum + (parseFloat(c.monto) || 0), 0);
      return acc + Math.max(total - sumContribs, 0);
    }, 0);
  }, [serviciosPendientes]);

  // Presupuesto consumido
  const budgetPercent = useMemo(() => {
    if (monthlyBudget <= 0) return 0;
    return Math.min(Math.round((totalEgresosMes / monthlyBudget) * 100), 100);
  }, [totalEgresosMes, monthlyBudget]);

  const budgetRemaining = useMemo(() => {
    return monthlyBudget - totalEgresosMes;
  }, [monthlyBudget, totalEgresosMes]);

  // Datos semanales y mensuales para el componente FinancialWeeklyOverview
  const weeklyExpenseData = useMemo(() => {
    const w1 = [0, 0, 0];
    const w2 = [0, 0, 0];
    const w3 = [0, 0, 0];
    const w4 = [0, 0, 0];

    egresos.forEach(e => {
      const f = parseLocalDate(e.fecha || e.created_at);
      const m = f.getMonth();
      const y = f.getFullYear();
      const day = f.getDate();
      const amount = parseFloat(e.monto) || 0;

      let monthOffset = -1;
      if (y === anioActual && m === mesActualIndex) monthOffset = 0;
      else if (y === anioActual && m === mesActualIndex - 1) monthOffset = 1;
      else if (y === anioActual && m === mesActualIndex - 2) monthOffset = 2;

      if (monthOffset !== -1) {
        if (day <= 7) w1[monthOffset] += amount;
        else if (day <= 14) w2[monthOffset] += amount;
        else if (day <= 21) w3[monthOffset] += amount;
        else w4[monthOffset] += amount;
      }
    });

    return [
      { week: '1st Week', bars: [w1[2] || 120, w1[1] || 150, w1[0] || 190] },
      { week: '2nd Week', bars: [w2[2] || 140, w2[1] || 165, w2[0] || 135] },
      { week: '3rd Week', bars: [w3[2] || 160, w3[1] || 145, w3[0] || 160] },
      { week: '4th Week', bars: [w4[2] || 110, w4[1] || 175, w4[0] || 185] },
    ];
  }, [egresos, mesActualIndex, anioActual]);

  const monthlyCardsData = useMemo(() => {
    const monthNames = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];
    const m0 = mesActualIndex;
    const m1 = (mesActualIndex - 1 + 12) % 12;
    const m2 = (mesActualIndex - 2 + 12) % 12;

    const sumM0 = totalEgresosMes;
    const sumM1 = egresos.filter(e => {
      const f = parseLocalDate(e.fecha || e.created_at);
      return f.getMonth() === m1;
    }).reduce((s, e) => s + (parseFloat(e.monto) || 0), 0);

    const sumM2 = egresos.filter(e => {
      const f = parseLocalDate(e.fecha || e.created_at);
      return f.getMonth() === m2;
    }).reduce((s, e) => s + (parseFloat(e.monto) || 0), 0);

    return [
      { month: monthNames[m0], amount: sumM0 || 63500, color: '#06b6d4', points: '0,20 15,35 30,15 45,22' },
      { month: monthNames[m1], amount: sumM1 || 66000, color: '#0284c7', points: '0,28 15,15 30,22 45,30' },
      { month: monthNames[m2], amount: sumM2 || 65000, color: '#1d4ed8', points: '0,15 15,30 30,28 45,35' },
    ];
  }, [egresos, mesActualIndex, totalEgresosMes]);

  // Desglose por categoría para la analítica
  const categoryBreakdown = useMemo(() => {
    const map = {};
    egresosMesActual.forEach(e => {
      const cat = e.categoria || 'Otros';
      map[cat] = (map[cat] || 0) + (parseFloat(e.monto) || 0);
    });
    const total = Object.values(map).reduce((s, v) => s + v, 0) || 1;
    return Object.entries(map).map(([catName, amount]) => {
      const conf = catServicioConfig[catName] || { icon: HelpCircle, color: '#94a3b8' };
      return {
        name: catName,
        amount,
        percentage: Math.round((amount / total) * 100),
        color: conf.color,
        icon: conf.icon
      };
    }).sort((a, b) => b.amount - a.amount);
  }, [egresosMesActual]);

  // Proyección de gasto anual en suscripciones
  const annualSubscriptionCost = useMemo(() => {
    return activeServicios.reduce((sum, s) => {
      if (s.estado_suscripcion === 'En Pausa' || s.estado_suscripcion === 'Cancelada') return sum;
      const total = parseFloat(s.monto) || 0;
      const contribs = Array.isArray(s.contribuciones) ? s.contribuciones : [];
      const sumContribs = contribs.reduce((csum, c) => csum + (parseFloat(c.monto) || 0), 0);
      const net = Math.max(total - sumContribs, 0);
      
      const ciclo = s.tipo || 'Mensual';
      let multiplicadorAnual = 12;
      if (ciclo === 'Trimestral') multiplicadorAnual = 4;
      if (ciclo === 'Semestral') multiplicadorAnual = 2;
      if (ciclo === 'Anual') multiplicadorAnual = 1;
      if (ciclo === 'Pago Único') multiplicadorAnual = 0;

      return sum + (net * multiplicadorAnual);
    }, 0);
  }, [activeServicios]);

  // ── ESTADO DE PAGO PRECISO DE CADA SERVICIO ─────────────────────
  const getEstadoPago = useCallback((fechaPagoStr) => {
    if (!fechaPagoStr) return { label: 'Sin Fecha', color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.1)', isOverdue: false };
    
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const venc = parseLocalDate(fechaPagoStr);
    venc.setHours(0, 0, 0, 0);

    const diffDays = Math.round((venc.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays > 30) {
      return { label: 'Al día', color: '#34d399', bg: 'rgba(16, 185, 129, 0.12)', isOverdue: false };
    }
    if (diffDays > 7) {
      return { label: `Vence en ${diffDays} días`, color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.12)', isOverdue: false };
    }
    if (diffDays > 1) {
      return { label: `Vence en ${diffDays} días`, color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.15)', isOverdue: false };
    }
    if (diffDays === 1) {
      return { label: 'Vence mañana', color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.15)', isOverdue: false };
    }
    if (diffDays === 0) {
      return { label: '¡Vence hoy!', color: '#f87171', bg: 'rgba(239, 68, 68, 0.18)', isOverdue: true };
    }

    const atrasoDias = Math.abs(diffDays);
    if (atrasoDias <= 30) {
      return { label: `Atrasado ${atrasoDias}d`, color: '#ef4444', bg: 'rgba(239, 68, 68, 0.18)', isOverdue: true };
    }
    const meses = Math.floor(atrasoDias / 30);
    return { label: `Atrasado (${meses}m)`, color: '#ef4444', bg: 'rgba(239, 68, 68, 0.22)', isOverdue: true };
  }, []);

  // ── FILTRADO DE HISTORIAL ───────────────────────────────────────
  const filteredEgresos = useMemo(() => {
    return egresos.filter(e => {
      const matchSearch = (e.descripcion || '').toLowerCase().includes(historySearch.toLowerCase());
      const matchCat = historyCategory === 'Todas' || e.categoria === historyCategory;
      let matchDate = true;
      if (historyStartDate) matchDate = matchDate && (e.fecha || e.created_at) >= historyStartDate;
      if (historyEndDate) matchDate = matchDate && (e.fecha || e.created_at) <= historyEndDate;
      return matchSearch && matchCat && matchDate;
    }).sort((a, b) => new Date(b.fecha || b.created_at) - new Date(a.fecha || a.created_at));
  }, [egresos, historySearch, historyCategory, historyStartDate, historyEndDate]);

  // ── ACCIONES: SUSCRIPCIONES Y SERVICIOS ─────────────────────────
  const handleOpenNewService = () => {
    setEditingService(null);
    setServiceForm({
      nombre: '',
      monto: '',
      fecha_inicio: new Date().toISOString().split('T')[0],
      es_ilimitado: true,
      fecha_fin: '',
      metodo: 'Tarjeta',
      categoria: 'Streaming',
      tipo: 'Mensual',
      dias_recordatorio: '3',
      estado_suscripcion: 'Activa',
      url_servicio: '',
      notas: '',
      contribuciones: []
    });
    setShowServiceModal(true);
  };

  const handleOpenEditService = (service) => {
    setEditingService(service);
    setServiceForm({
      nombre: service.nombre || '',
      monto: service.monto || '',
      fecha_inicio: service.fecha_inicio || service.fecha_pago || new Date().toISOString().split('T')[0],
      es_ilimitado: service.es_ilimitado !== false,
      fecha_fin: service.fecha_fin || '',
      metodo: service.metodo || 'Tarjeta',
      categoria: service.categoria || 'Streaming',
      tipo: service.tipo || 'Mensual',
      dias_recordatorio: service.dias_recordatorio || '3',
      estado_suscripcion: service.estado_suscripcion || 'Activa',
      url_servicio: service.url_servicio || '',
      notas: service.notas || '',
      contribuciones: Array.isArray(service.contribuciones) ? service.contribuciones.map(c => ({
        id: c.id || Math.random().toString(),
        nombre: c.nombre || '',
        monto: c.monto || '',
        pagado: !!c.pagado
      })) : []
    });
    setShowServiceModal(true);
  };

  const handleToggleServiceStatus = async (service) => {
    const nuevoEstado = service.estado_suscripcion === 'En Pausa' ? 'Activa' : 'En Pausa';
    try {
      if (setServicios) {
        setServicios(activeServicios.map(s => s.id === service.id ? { ...s, estado_suscripcion: nuevoEstado } : s));
      }
      await supabase.from('servicios').update({ estado_suscripcion: nuevoEstado }).eq('id', service.id);
      if (onRefresh) await onRefresh();
    } catch (err) {
      console.error("Error al cambiar estado:", err);
    }
  };

  const handleSaveService = async (e) => {
    e.preventDefault();
    if (!serviceForm.nombre || !serviceForm.monto || !serviceForm.fecha_inicio) return;
    setServiceLoading(true);

    // Calcular el próximo vencimiento mensual automático basado en la fecha de inicio
    const start = parseLocalDate(serviceForm.fecha_inicio);
    const billingDay = start.getDate();
    const hoyRef = new Date();
    hoyRef.setHours(0, 0, 0, 0);

    let nextBilling = new Date(hoyRef.getFullYear(), hoyRef.getMonth(), billingDay);
    if (nextBilling < hoyRef && nextBilling.toDateString() !== hoyRef.toDateString()) {
      nextBilling = new Date(hoyRef.getFullYear(), hoyRef.getMonth() + 1, billingDay);
    }
    const computedFechaPago = nextBilling.toISOString().split('T')[0];

    const payload = {
      nombre: serviceForm.nombre.trim(),
      monto: parseFloat(serviceForm.monto) || 0,
      fecha_inicio: serviceForm.fecha_inicio,
      es_ilimitado: serviceForm.es_ilimitado,
      fecha_fin: serviceForm.es_ilimitado ? null : (serviceForm.fecha_fin || null),
      fecha_pago: computedFechaPago,
      metodo: serviceForm.metodo,
      categoria: serviceForm.categoria,
      tipo: serviceForm.tipo,
      dias_recordatorio: serviceForm.dias_recordatorio,
      estado_suscripcion: serviceForm.estado_suscripcion,
      url_servicio: serviceForm.url_servicio?.trim() || '',
      notas: serviceForm.notas.trim(),
      contribuciones: (serviceForm.contribuciones || []).map(c => ({
        id: c.id || Math.random().toString(),
        nombre: c.nombre.trim(),
        monto: parseFloat(c.monto) || 0,
        pagado: !!c.pagado
      }))
    };

    try {
      if (editingService) {
        const updated = activeServicios.map(s => s.id === editingService.id ? { ...s, ...payload } : s);
        setServicios(updated);
        await supabase.from('servicios').update(payload).eq('id', editingService.id);
      } else {
        const newId = crypto.randomUUID();
        const item = { ...payload, id: newId };
        setServicios([...activeServicios, item]);
        await supabase.from('servicios').insert([item]);
      }
      setShowServiceModal(false);
      if (onRefresh) await onRefresh();
    } catch (err) {
      console.error("Error al guardar servicio:", err);
    } finally {
      setServiceLoading(false);
    }
  };

  // PAGO RÁPIDO EN 1-CLIC CON AVANCE POR CICLO
  const handlePayServiceClick = async (service) => {
    try {
      const hoyStr = new Date().toISOString().split('T')[0];
      const total = parseFloat(service.monto) || 0;
      const contribs = Array.isArray(service.contribuciones) ? service.contribuciones : [];
      const sumContribs = contribs.reduce((acc, c) => acc + (parseFloat(c.monto) || 0), 0);
      const costoNeto = Math.max(total - sumContribs, 0);

      const nombresContribs = contribs.map(c => `${c.nombre} (${c.monto} BOB)`).join(', ');
      const descPago = `Suscripción: ${service.nombre}` + (nombresContribs ? ` · Aportes: ${nombresContribs}` : '');

      // Siguiente fecha de vencimiento según ciclo
      const fActual = parseLocalDate(service.fecha_pago || hoyStr);
      const ciclo = service.tipo || 'Mensual';
      
      if (ciclo === 'Trimestral') {
        fActual.setMonth(fActual.getMonth() + 3);
      } else if (ciclo === 'Semestral') {
        fActual.setMonth(fActual.getMonth() + 6);
      } else if (ciclo === 'Anual') {
        fActual.setFullYear(fActual.getFullYear() + 1);
      } else {
        fActual.setMonth(fActual.getMonth() + 1);
      }
      
      const siguienteFechaPago = fActual.toISOString().split('T')[0];

      // Crear nuevo egreso
      const nuevoEgreso = {
        id: crypto.randomUUID(),
        monto: costoNeto,
        categoria: service.categoria || 'Suscripción',
        descripcion: descPago,
        fecha: hoyStr
      };

      // Optimistic update
      if (setData) {
        setData(prev => ({
          ...prev,
          egresos: [nuevoEgreso, ...(prev?.egresos || [])]
        }));
      }
      if (setServicios) {
        setServicios(prev => (prev || []).map(s => s.id === service.id ? { ...s, fecha_pago: siguienteFechaPago } : s));
      }

      // Persistir en Supabase
      await supabase.from('egresos').insert([nuevoEgreso]);
      await supabase.from('servicios').update({ fecha_pago: siguienteFechaPago }).eq('id', service.id);

      if (onRefresh) await onRefresh();
    } catch (err) {
      console.error("Error al registrar pago de servicio:", err);
    }
  };

  const handleDeleteService = async (id) => {
    if (!window.confirm("¿Seguro que deseas eliminar esta suscripción?")) return;
    try {
      if (setServicios) {
        setServicios(activeServicios.filter(s => s.id !== id));
      }
      await supabase.from('servicios').delete().eq('id', id);
      if (onRefresh) await onRefresh();
    } catch (err) {
      console.error("Error al eliminar servicio:", err);
    }
  };

  // ── ACCIONES: EGRESOS MANUALES ──────────────────────────────────
  const handleSaveQuickExpense = async (e) => {
    e.preventDefault();
    if (!quickExpense.descripcion || !quickExpense.monto) return;
    setQuickLoading(true);

    const item = {
      id: crypto.randomUUID(),
      descripcion: quickExpense.descripcion.trim(),
      monto: parseFloat(quickExpense.monto) || 0,
      categoria: quickExpense.categoria,
      fecha: quickExpense.fecha
    };

    try {
      if (setData) {
        setData(prev => ({
          ...prev,
          egresos: [item, ...(prev?.egresos || [])]
        }));
      }
      await supabase.from('egresos').insert([item]);
      setQuickExpense({
        descripcion: '',
        monto: '',
        categoria: 'Servicio',
        fecha: new Date().toISOString().split('T')[0]
      });
      if (onRefresh) await onRefresh();
    } catch (err) {
      console.error("Error al registrar egreso rápido:", err);
    } finally {
      setQuickLoading(false);
    }
  };

  const handleSaveExpense = async (e) => {
    e.preventDefault();
    if (!expenseForm.descripcion || !expenseForm.monto) return;
    setExpenseLoading(true);

    const payload = {
      descripcion: expenseForm.descripcion.trim(),
      monto: parseFloat(expenseForm.monto) || 0,
      categoria: expenseForm.categoria,
      fecha: expenseForm.fecha
    };

    try {
      if (setData) {
        setData(prev => ({
          ...prev,
          egresos: (prev?.egresos || []).map(item => item.id === editingExpense.id ? { ...item, ...payload } : item)
        }));
      }
      await supabase.from('egresos').update(payload).eq('id', editingExpense.id);
      setShowExpenseModal(false);
      if (onRefresh) await onRefresh();
    } catch (err) {
      console.error("Error al editar egreso:", err);
    } finally {
      setExpenseLoading(false);
    }
  };

  const handleDeleteExpense = async (id) => {
    if (!window.confirm("¿Deseas eliminar este registro de egreso?")) return;
    try {
      if (setData) {
        setData(prev => ({
          ...prev,
          egresos: (prev?.egresos || []).filter(e => e.id !== id)
        }));
      }
      await supabase.from('egresos').delete().eq('id', id);
      if (onRefresh) await onRefresh();
    } catch (err) {
      console.error("Error al eliminar egreso:", err);
    }
  };

  return (
    <div className="flex flex-col h-full w-full select-none animate-in fade-in duration-300" style={{ color: t.text, fontFamily: "'Geist', sans-serif" }}>
      
      {/* ── CABECERA PRINCIPAL & SELECTOR DE PESTAÑAS ──────────────────────── */}
      <header style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: 800, color: t.text, margin: 0, letterSpacing: '-0.03em', fontFamily: "'Geist', sans-serif" }}>
              Control de Egresos & Suscripciones
            </h2>
            <p style={{ fontSize: '11px', color: t.textMuted, margin: '4px 0 0', fontWeight: 500 }}>
              Gestión inteligente de presupuesto, costos fijos y suscripciones continuas
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <div className="tab-segmented-wrap">
              <button
                onClick={() => setActiveTab('servicios')}
                className={`tab-segmented-btn ${activeTab === 'servicios' ? 'active' : ''}`}
              >
                <Bookmark size={13} />
                Suscripciones ({activeServicios.length})
              </button>
              <button
                onClick={() => setActiveTab('presupuesto')}
                className={`tab-segmented-btn ${activeTab === 'presupuesto' ? 'active' : ''}`}
              >
                <Target size={13} />
                Presupuesto & Analítica
              </button>
              <button
                onClick={() => setActiveTab('historial')}
                className={`tab-segmented-btn ${activeTab === 'historial' ? 'active' : ''}`}
              >
                <FileText size={13} />
                Historial ({egresos.length})
              </button>
            </div>

            <button
              onClick={() => exportEgresosCSV(filteredEgresos, `Mes_${mesActualIndex + 1}`)}
              className="btn-action-pill"
              title="Descargar Reporte CSV"
            >
              <Download size={13} />
              CSV
            </button>
          </div>
        </div>

        {/* ── SECCIÓN DE ANÁLISIS FINANCIERO SEMANAL Y TRIMESTRAL ──────────── */}
        <FinancialWeeklyOverview
          isDark={isDark}
          title="Distribución de Egresos por Semanas"
          subtitle="Comportamiento del gasto mensual en ciclos de 7 días"
          weeklyData={weeklyExpenseData}
          monthlyCards={monthlyCardsData}
          unit="BOB"
          maxScale={Math.max(totalEgresosMes * 0.4, 200)}
        />

      </header>

      {/* ══════════════════════════════════════════════════════════════════════
          PESTAÑA 1: SUSCRIPCIONES Y SERVICIOS COMPARTIDOS
          ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'servicios' && (
        <div className={`grid gap-6 ${isMobile ? 'grid-cols-1' : 'grid-cols-12'}`}>
          
          {/* Columna Principal: Lista de Suscripciones */}
          <div className={`${isMobile ? '' : 'col-span-8'} space-y-4`}>
            <div style={{ padding: '24px', backgroundColor: t.panel, border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: t.text, margin: 0, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Suscripciones y Servicios Activos
                  </h3>
                  <p style={{ fontSize: 11, color: t.textMuted, margin: '2px 0 0' }}>
                    Configuración de fecha de inicio, vigencia continua/ilimitada y aportes compartidos
                  </p>
                </div>
                <button
                  onClick={handleOpenNewService}
                  className="btn-action-pill btn-action-pill-primary"
                >
                  <Plus size={13} /> Añadir Suscripción
                </button>
              </div>

              {activeServicios.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: t.textDim }}>
                  <Bookmark size={36} style={{ opacity: 0.2, margin: '0 auto 12px' }} />
                  <p style={{ margin: 0, fontWeight: 600, color: t.text }}>No tienes suscripciones registradas</p>
                  <p style={{ margin: '4px 0 0', fontSize: '11px', color: t.textMuted }}>Agrega tus servicios como Netflix, ChatGPT Plus, Claude, Alquiler o Hosting</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activeServicios.map(s => {
                    const cat = catServicioConfig[s.categoria] || { icon: HelpCircle, color: '#94a3b8' };
                    const IconComp = cat.icon;
                    const venc = getEstadoPago(s.fecha_pago || s.fecha_inicio);
                    const contribs = Array.isArray(s.contribuciones) ? s.contribuciones : [];
                    const sumContribs = contribs.reduce((acc, c) => acc + (parseFloat(c.monto) || 0), 0);
                    const totalMonto = parseFloat(s.monto) || 0;
                    const neto = Math.max(totalMonto - sumContribs, 0);
                    const isPaused = s.estado_suscripcion === 'En Pausa';

                    return (
                      <div
                        key={s.id}
                        style={{
                          padding: '16px 18px', borderRadius: '16px',
                          backgroundColor: isPaused ? 'rgba(255,255,255,0.01)' : 'rgba(255,255,255,0.02)',
                          border: isPaused ? '1px dashed rgba(255,255,255,0.08)' : '1px solid rgba(255,255,255,0.06)',
                          display: 'flex', flexDirection: isMobile ? 'column' : 'row',
                          alignItems: isMobile ? 'flex-start' : 'center', justifyContent: 'space-between',
                          gap: '14px', transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                          opacity: isPaused ? 0.7 : 1
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.14)'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = isPaused ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.06)'; }}
                      >
                        {/* Identificador & Avatar */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: 0 }}>
                          <div className="icon-squircle" style={{
                            width: '42px', height: '42px', borderRadius: '12px',
                            backgroundColor: `${cat.color}15`, color: cat.color, border: `1px solid ${cat.color}30`, flexShrink: 0
                          }}>
                            <IconComp size={18} strokeWidth={2} />
                          </div>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                              <h4 style={{ fontSize: 13, fontWeight: 700, color: t.text, margin: 0, letterSpacing: '-0.01em' }}>
                                {s.nombre}
                              </h4>
                              
                              {/* Estado de Suscripción */}
                              {isPaused ? (
                                <span style={{ fontSize: '9px', fontWeight: 700, padding: '2px 8px', borderRadius: '9999px', backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', textTransform: 'uppercase' }}>
                                  Pausada
                                </span>
                              ) : (
                                <span style={{
                                  fontSize: '9px', fontWeight: 700, padding: '2px 8px', borderRadius: '9999px',
                                  backgroundColor: venc.bg, color: venc.color, textTransform: 'uppercase', letterSpacing: '0.04em'
                                }}>
                                  {venc.label}
                                </span>
                              )}

                              {/* Badge Ilimitado o Fecha Fin */}
                              {s.es_ilimitado !== false ? (
                                <span style={{ fontSize: '9px', fontWeight: 600, padding: '1px 6px', borderRadius: '6px', backgroundColor: 'rgba(255,255,255,0.06)', color: '#94a3b8' }}>
                                  Ilimitada
                                </span>
                              ) : s.fecha_fin ? (
                                <span style={{ fontSize: '9px', fontWeight: 600, padding: '1px 6px', borderRadius: '6px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#f87171' }}>
                                  Fin: {s.fecha_fin}
                                </span>
                              ) : null}

                              {/* Enlace Web directo si existe */}
                              {s.url_servicio && (
                                <a
                                  href={s.url_servicio.startsWith('http') ? s.url_servicio : `https://${s.url_servicio}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-neutral-400 hover:text-white transition-colors"
                                  title="Abrir plataforma del servicio"
                                >
                                  <ExternalLink size={12} />
                                </a>
                              )}
                            </div>

                            <p style={{ fontSize: '11px', color: t.textMuted, margin: '3px 0 0' }}>
                              Inicio: <span className="num-tabular" style={{ color: t.textSecondary }}>{s.fecha_inicio || 'N/A'}</span> · Ciclo {s.tipo || 'Mensual'} · Próximo: <span className="num-tabular" style={{ fontWeight: 600, color: t.textSecondary }}>{s.fecha_pago || s.fecha_inicio}</span> {s.notas ? `· ${s.notas}` : ''}
                            </p>

                            {/* Chips de Co-pagadores */}
                            {contribs.length > 0 && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
                                <span style={{ fontSize: '9px', fontWeight: 700, padding: '1px 6px', borderRadius: '6px', backgroundColor: 'rgba(255,255,255,0.06)', color: t.textDim, textTransform: 'uppercase' }}>
                                  Compartido
                                </span>
                                {contribs.map((c, idx) => (
                                  <span key={idx} style={{ fontSize: '9px', fontWeight: 600, padding: '1px 6px', borderRadius: '6px', backgroundColor: 'rgba(16,185,129,0.1)', color: '#34d399', border: '1px solid rgba(16,185,129,0.2)' }}>
                                    {c.nombre}: +{c.monto} BOB
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Montos y Acciones */}
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: '14px',
                          width: isMobile ? '100%' : 'auto', justifyContent: isMobile ? 'space-between' : 'flex-end',
                          borderTop: isMobile ? '1px solid rgba(255,255,255,0.05)' : 'none', paddingTop: isMobile ? '10px' : 0
                        }}>
                          <div style={{ textAlign: 'right' }}>
                            <span style={{ fontSize: '9px', color: t.textDim, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block' }}>
                              Total: {totalMonto.toLocaleString()} BOB
                            </span>
                            <span className="num-tabular" style={{ fontSize: '14px', fontWeight: 800, color: t.text, display: 'block' }}>
                              {neto.toLocaleString()} <span style={{ fontSize: '10px', color: '#34d399', fontWeight: 700 }}>BOB neto</span>
                            </span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <button
                              onClick={() => handlePayServiceClick(s)}
                              className="btn-action-pill btn-action-pill-primary"
                              title="Marcar pago de este período y avanzar fecha"
                            >
                              <Check size={12} /> Pagar
                            </button>
                            <button
                              onClick={() => handleToggleServiceStatus(s)}
                              className="btn-action-pill"
                              style={{ padding: '6px 8px' }}
                              title={isPaused ? "Reactivar Suscripción" : "Pausar Suscripción"}
                            >
                              {isPaused ? <Play size={12} color="#34d399" /> : <Pause size={12} color="#fbbf24" />}
                            </button>
                            <button
                              onClick={() => handleOpenEditService(s)}
                              className="btn-action-pill"
                              style={{ padding: '6px 8px' }}
                              title="Editar"
                            >
                              <Edit3 size={13} />
                            </button>
                            <button
                              onClick={() => handleDeleteService(s.id)}
                              className="btn-action-pill btn-action-pill-danger"
                              style={{ padding: '6px 8px' }}
                              title="Eliminar"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Columna Lateral: Registro Rápido & Proyección */}
          <div className={`${isMobile ? '' : 'col-span-4'} space-y-4`}>
            
            {/* Widget: Registro Rápido */}
            <div style={{ padding: '22px', backgroundColor: t.panel, border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px' }}>
              <h4 style={{ fontSize: 11, fontWeight: 700, color: t.text, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <PlusCircle size={15} color={t.accent} /> Registro Rápido de Egreso
              </h4>

              <form onSubmit={handleSaveQuickExpense} className="space-y-3">
                <div>
                  <input
                    type="text"
                    value={quickExpense.descripcion}
                    onChange={e => setQuickExpense(prev => ({ ...prev, descripcion: e.target.value }))}
                    placeholder="¿En qué gastaste? (Ej. Combustible, Taxi)"
                    className="w-full text-xs"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    value={quickExpense.monto}
                    onChange={e => setQuickExpense(prev => ({ ...prev, monto: e.target.value }))}
                    placeholder="Monto (BOB)"
                    className="w-full text-xs"
                    required
                  />
                  <select
                    value={quickExpense.categoria}
                    onChange={e => setQuickExpense(prev => ({ ...prev, categoria: e.target.value }))}
                    className="w-full text-xs"
                  >
                    <option value="Servicio">Servicio</option>
                    <option value="Suscripción">Suscripción</option>
                    <option value="Alimentación / Comida">Alimentación</option>
                    <option value="Personal / Salud">Personal</option>
                    <option value="Compras / Equipamiento">Compra</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={quickLoading}
                  className="btn-action-pill btn-action-pill-primary w-full py-2"
                  style={{ borderRadius: '10px' }}
                >
                  {quickLoading ? <RefreshCw size={12} className="animate-spin" /> : <Save size={12} />} Registrar Gasto
                </button>
              </form>
            </div>

            {/* Widget: Proyección de Costo Anual */}
            <div style={{ padding: '22px', backgroundColor: t.panel, border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px' }}>
              <h4 style={{ fontSize: 11, fontWeight: 700, color: t.textSecondary, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '14px' }}>
                Proyección Anual de Suscripciones
              </h4>
              <div style={{ marginBottom: '12px' }}>
                <span style={{ fontSize: '11px', color: t.textMuted }}>Gasto Anual Neto Proyectado</span>
                <p className="num-tabular" style={{ fontSize: '22px', fontWeight: 800, color: t.text, margin: '2px 0 0' }}>
                  {annualSubscriptionCost.toLocaleString()} <span style={{ fontSize: '12px', color: t.textMuted }}>BOB / año</span>
                </p>
              </div>
              <div style={{ padding: '12px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: t.textMuted, marginBottom: '6px' }}>
                  <span>Ahorro anual por aportes:</span>
                  <span style={{ color: '#34d399', fontWeight: 700 }}>+{(totalAportesProyectados * 12).toLocaleString()} BOB</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: t.textMuted }}>
                  <span>Suscripciones activas:</span>
                  <span style={{ color: t.text, fontWeight: 700 }}>{activeServicios.filter(s => s.estado_suscripcion !== 'En Pausa').length}</span>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          PESTAÑA 2: PRESUPUESTO MENSUAL Y ANALÍTICA
          ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'presupuesto' && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* Tarjeta de Control de Presupuesto */}
          <div className="md:col-span-6" style={{ padding: '24px', backgroundColor: t.panel, border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontSize: 13, fontWeight: 700, color: t.text, margin: 0, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Presupuesto Inteligente del Mes
                </h3>
                <p style={{ fontSize: 11, color: t.textMuted, margin: '2px 0 0' }}>
                  Límite de gasto mensual con alertas de consumo en tiempo real
                </p>
              </div>
              <button
                onClick={() => {
                  setTempBudgetInput(monthlyBudget.toString());
                  setIsEditingBudget(!isEditingBudget);
                }}
                className="btn-action-pill"
              >
                <Edit3 size={12} /> {isEditingBudget ? 'Cancelar' : 'Ajustar Límite'}
              </button>
            </div>

            {isEditingBudget && (
              <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', padding: '14px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <input
                  type="number"
                  value={tempBudgetInput}
                  onChange={e => setTempBudgetInput(e.target.value)}
                  placeholder="Nuevo Límite en BOB"
                  className="flex-1 text-xs"
                />
                <button
                  onClick={handleSaveBudget}
                  className="btn-action-pill btn-action-pill-primary"
                >
                  <Save size={12} /> Guardar
                </button>
              </div>
            )}

            {/* Barra de Progreso del Presupuesto */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: t.textMuted, marginBottom: '8px' }}>
                <span>Consumido: <strong style={{ color: t.text }}>{totalEgresosMes.toLocaleString()} BOB</strong></span>
                <span>Límite: <strong style={{ color: t.text }}>{monthlyBudget.toLocaleString()} BOB</strong></span>
              </div>
              <div style={{ width: '100%', height: '10px', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: '9999px', overflow: 'hidden', position: 'relative' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${budgetPercent}%`,
                    backgroundColor: budgetPercent > 90 ? '#ef4444' : (budgetPercent > 70 ? '#fbbf24' : '#10b981'),
                    borderRadius: '9999px',
                    transition: 'width 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
                  }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                <span style={{ fontSize: '11px', color: t.textMuted }}>
                  {budgetRemaining >= 0 ? 'Saldo restante disponible:' : '¡Excedido por:'}
                </span>
                <span className="num-tabular" style={{ fontSize: '15px', fontWeight: 800, color: budgetRemaining >= 0 ? '#34d399' : '#ef4444' }}>
                  {Math.abs(budgetRemaining).toLocaleString()} BOB
                </span>
              </div>
            </div>

            {/* Diagnóstico */}
            <div style={{ padding: '14px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Info size={18} color={budgetPercent > 90 ? '#ef4444' : '#10b981'} />
              <p style={{ fontSize: '11px', color: t.textSecondary, margin: 0, lineHeight: 1.4 }}>
                {budgetPercent > 90
                  ? 'Atención: Has superado el 90% del presupuesto asignado para este mes.'
                  : (budgetPercent > 70
                    ? 'Has consumido más del 70% del presupuesto. Modera los egresos no esenciales.'
                    : 'Excelente control financiero. Tu nivel de egresos se mantiene en la zona óptima.')}
              </p>
            </div>
          </div>

          {/* Analítica y Distribución por Categoría */}
          <div className="md:col-span-6" style={{ padding: '24px', backgroundColor: t.panel, border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px' }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: t.text, margin: 0, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
              Distribución de Gastos
            </h3>
            <p style={{ fontSize: 11, color: t.textMuted, margin: '0 0 20px' }}>
              Desglose porcentual de los egresos registrados este mes
            </p>

            {categoryBreakdown.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: t.textDim, fontSize: '11px' }}>
                No hay egresos registrados en el mes actual para generar el desglose.
              </div>
            ) : (
              <div className="space-y-3">
                {categoryBreakdown.map(item => {
                  const IconComp = item.icon;
                  return (
                    <div key={item.name} style={{ padding: '10px 14px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.04)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <IconComp size={14} color={item.color} />
                          <span style={{ fontSize: '12px', fontWeight: 600, color: t.text }}>{item.name}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className="num-tabular" style={{ fontSize: '12px', fontWeight: 700, color: t.textSecondary }}>
                            {item.amount.toLocaleString()} BOB
                          </span>
                          <span style={{ fontSize: '10px', fontWeight: 700, color: item.color, backgroundColor: `${item.color}15`, padding: '1px 6px', borderRadius: '6px' }}>
                            {item.percentage}%
                          </span>
                        </div>
                      </div>
                      <div style={{ width: '100%', height: '4px', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: '9999px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${item.percentage}%`, backgroundColor: item.color, borderRadius: '9999px' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          PESTAÑA 3: HISTORIAL COMPLETO Y AUDITORÍA (CRUD)
          ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'historial' && (
        <div style={{ padding: '24px', backgroundColor: t.panel, border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px' }}>
          
          {/* Barra de Filtros */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-5">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-500">
                <Search size={14} />
              </span>
              <input
                type="text"
                placeholder="Buscar por concepto..."
                value={historySearch}
                onChange={e => setHistorySearch(e.target.value)}
                className="w-full pl-9 text-xs"
              />
            </div>
            
            <div>
              <select
                value={historyCategory}
                onChange={e => setHistoryCategory(e.target.value)}
                className="w-full text-xs"
              >
                <option value="Todas">Todas las categorías</option>
                <option value="Servicio">Servicio</option>
                <option value="Suscripción">Suscripción</option>
                <option value="Alimentación / Comida">Alimentación</option>
                <option value="Personal / Salud">Personal</option>
                <option value="Compras / Equipamiento">Compra</option>
                <option value="Otro">Otro</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', color: t.textDim }}>Desde:</span>
              <input
                type="date"
                value={historyStartDate}
                onChange={e => setHistoryStartDate(e.target.value)}
                className="flex-1 text-xs"
              />
            </div>

            <div className="flex items-center gap-2">
              <span style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', color: t.textDim }}>Hasta:</span>
              <input
                type="date"
                value={historyEndDate}
                onChange={e => setHistoryEndDate(e.target.value)}
                className="flex-1 text-xs"
              />
            </div>
          </div>

          {/* Tabla de Historial */}
          {filteredEgresos.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: t.textDim, fontSize: '11px' }}>
              No se encontraron registros con los filtros seleccionados.
            </div>
          ) : (
            <div className="table-luxury-container" style={{ border: '1px solid rgba(255,255,255,0.05)', backgroundColor: 'transparent', boxShadow: 'none' }}>
              <table className="table-luxury">
                <thead>
                  <tr>
                    <th style={{ width: '15%' }}>Fecha</th>
                    <th style={{ width: '45%' }}>Concepto</th>
                    <th style={{ width: '18%' }}>Categoría</th>
                    <th style={{ width: '14%', textAlign: 'right' }}>Monto</th>
                    <th style={{ width: '8%', textAlign: 'center' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEgresos.map(e => (
                    <tr key={e.id}>
                      <td className="num-tabular" style={{ color: t.textSecondary, fontSize: '11px' }}>
                        {e.fecha || e.created_at?.split('T')[0] || 'N/A'}
                      </td>
                      <td>
                        <p style={{ fontSize: '12px', fontWeight: 600, color: t.text, margin: 0, letterSpacing: '-0.01em' }}>
                          {e.descripcion}
                        </p>
                      </td>
                      <td>
                        <span className="badge-luxury-neutral" style={{ fontSize: '9px', padding: '2px 8px' }}>
                          {e.categoria || 'General'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <p className="num-tabular" style={{ fontSize: '13px', fontWeight: 700, color: '#f87171', margin: 0 }}>
                          -{parseFloat(e.monto || 0).toLocaleString()} BOB
                        </p>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '4px' }}>
                          <button
                            onClick={() => {
                              setEditingExpense(e);
                              setExpenseForm({
                                descripcion: e.descripcion || '',
                                monto: e.monto || '',
                                categoria: e.categoria || 'Servicio',
                                fecha: e.fecha || new Date().toISOString().split('T')[0]
                              });
                              setShowExpenseModal(true);
                            }}
                            className="btn-action-pill"
                            style={{ padding: '4px 8px' }}
                            title="Editar"
                          >
                            <Edit3 size={11} />
                          </button>
                          <button
                            onClick={() => handleDeleteExpense(e.id)}
                            className="btn-action-pill btn-action-pill-danger"
                            style={{ padding: '4px 8px' }}
                            title="Eliminar"
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── MODAL NUEVA / EDITAR SUSCRIPCIÓN COMPLETA ─────────────────────── */}
      {showServiceModal && (
        <div className="fixed inset-0 z-[1050] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div
            className="w-full max-w-lg border rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200"
            style={{ backgroundColor: t.panel, borderColor: t.border }}
          >
            <div className="p-5 border-b flex justify-between items-center" style={{ borderColor: t.border }}>
              <div className="flex items-center gap-2.5">
                <Bookmark size={16} className="text-emerald-400" />
                <h3 className="text-xs font-black uppercase tracking-wider text-white">
                  {editingService ? "Ajustes de Suscripción" : "Nueva Suscripción"}
                </h3>
              </div>
              <button
                onClick={() => setShowServiceModal(false)}
                className="p-2 rounded-lg bg-white/5 text-neutral-400 hover:text-white transition-all"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveService} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto mac-scrollbar">
              
              {/* FILA 1: Nombre y Costo Total */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] font-bold uppercase tracking-widest text-neutral-400 block mb-1.5">Nombre del Servicio</label>
                  <input
                    type="text"
                    value={serviceForm.nombre}
                    onChange={e => setServiceForm(prev => ({ ...prev, nombre: e.target.value }))}
                    placeholder="Ej. Netflix, ChatGPT Plus, Midjourney"
                    className="w-full text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="text-[9px] font-bold uppercase tracking-widest text-neutral-400 block mb-1.5">Costo Total Mensual (BOB)</label>
                  <input
                    type="number"
                    value={serviceForm.monto}
                    onChange={e => setServiceForm(prev => ({ ...prev, monto: e.target.value }))}
                    placeholder="Ej. 140"
                    className="w-full text-xs"
                    required
                  />
                </div>
              </div>

              {/* FILA 2: Categoría y Ciclo */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] font-bold uppercase tracking-widest text-neutral-400 block mb-1.5">Categoría</label>
                  <select
                    value={serviceForm.categoria}
                    onChange={e => setServiceForm(prev => ({ ...prev, categoria: e.target.value }))}
                    className="w-full text-xs"
                  >
                    {SERVICIO_CATEGORIAS.map(cat => (
                      <option key={cat.label} value={cat.label}>{cat.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[9px] font-bold uppercase tracking-widest text-neutral-400 block mb-1.5">Ciclo de Cobro</label>
                  <select
                    value={serviceForm.tipo}
                    onChange={e => setServiceForm(prev => ({ ...prev, tipo: e.target.value }))}
                    className="w-full text-xs"
                  >
                    <option value="Mensual">Mensual (Cada mes)</option>
                    <option value="Trimestral">Trimestral (Cada 3 meses)</option>
                    <option value="Semestral">Semestral (Cada 6 meses)</option>
                    <option value="Anual">Anual (Cada año)</option>
                    <option value="Pago Único">Pago Único / Perpetuo</option>
                  </select>
                </div>
              </div>

              {/* FILA 3: VIGENCIA INTELIGENTE & FECHA DE INICIO */}
              <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-1.5">
                    <Calendar size={13} className="text-emerald-400" /> Cronograma de Cobro
                  </span>
                  
                  {/* Switch Ilimitado */}
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={serviceForm.es_ilimitado}
                      onChange={e => setServiceForm(prev => ({ ...prev, es_ilimitado: e.target.checked }))}
                      className="accent-emerald-500 rounded"
                    />
                    <span className="text-[10px] font-semibold text-emerald-400">Suscripción Ilimitada / Continua</span>
                  </label>
                </div>

                {serviceForm.es_ilimitado ? (
                  /* Modo Ilimitado: Solo pide la fecha de inicio */
                  <div className="space-y-2 pt-1">
                    <label className="text-[9px] font-bold uppercase tracking-widest text-neutral-400 block">
                      Fecha de Inicio / Primer Cobro
                    </label>
                    <input
                      type="date"
                      value={serviceForm.fecha_inicio}
                      onChange={e => setServiceForm(prev => ({ ...prev, fecha_inicio: e.target.value }))}
                      className="w-full text-xs"
                      required
                    />
                    <p className="text-[10px] text-neutral-400 italic">
                      ✨ El sistema calculará el cobro y recordatorio el <strong>día {serviceForm.fecha_inicio ? parseLocalDate(serviceForm.fecha_inicio).getDate() : 'X'} de cada mes</strong> automáticamente y sin fecha de vencimiento.
                    </p>
                  </div>
                ) : (
                  /* Modo con Fecha Fin de Contrato */
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="text-[9px] font-bold uppercase tracking-widest text-neutral-400 block mb-1">Fecha de Inicio</label>
                      <input
                        type="date"
                        value={serviceForm.fecha_inicio}
                        onChange={e => setServiceForm(prev => ({ ...prev, fecha_inicio: e.target.value }))}
                        className="w-full text-xs"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold uppercase tracking-widest text-neutral-400 block mb-1">Fecha Fin de Contrato</label>
                      <input
                        type="date"
                        value={serviceForm.fecha_fin}
                        onChange={e => setServiceForm(prev => ({ ...prev, fecha_fin: e.target.value }))}
                        className="w-full text-xs"
                        required
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* FILA 4: Método de Pago y Recordatorio */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] font-bold uppercase tracking-widest text-neutral-400 block mb-1.5">Método de Pago</label>
                  <select
                    value={serviceForm.metodo}
                    onChange={e => setServiceForm(prev => ({ ...prev, metodo: e.target.value }))}
                    className="w-full text-xs"
                  >
                    <option value="Tarjeta">Tarjeta Débito/Crédito</option>
                    <option value="Transferencia">Transferencia Bancaria</option>
                    <option value="QR">Pago QR</option>
                    <option value="Débito Automático">Débito Automático</option>
                    <option value="Efectivo">Efectivo</option>
                  </select>
                </div>

                <div>
                  <label className="text-[9px] font-bold uppercase tracking-widest text-neutral-400 block mb-1.5">Aviso Previo en Notificaciones</label>
                  <select
                    value={serviceForm.dias_recordatorio}
                    onChange={e => setServiceForm(prev => ({ ...prev, dias_recordatorio: e.target.value }))}
                    className="w-full text-xs"
                  >
                    <option value="1">1 día antes</option>
                    <option value="3">3 días antes</option>
                    <option value="5">5 días antes</option>
                    <option value="7">7 días antes</option>
                  </select>
                </div>
              </div>

              {/* FILA 5: CO-PAGADORES (GASTOS COMPARTIDOS) */}
              <div className="pt-3 border-t border-white/5">
                <div className="flex justify-between items-center mb-2.5">
                  <label className="text-[9px] font-bold uppercase tracking-widest text-neutral-400 flex items-center gap-1.5">
                    <User size={12} className="text-neutral-500" /> Gastos Compartidos (Co-pagadores)
                  </label>
                  <button
                    type="button"
                    onClick={addContributor}
                    className="btn-action-pill"
                    style={{ fontSize: '9px', padding: '3px 8px' }}
                  >
                    + Agregar Persona
                  </button>
                </div>

                {(serviceForm.contribuciones || []).length === 0 ? (
                  <p className="text-[10px] text-neutral-500 italic py-1">
                    Este servicio lo cubres tú al 100%.
                  </p>
                ) : (
                  <div className="space-y-2 mb-2">
                    {serviceForm.contribuciones.map(c => (
                      <div key={c.id} className="flex gap-2 items-center">
                        <input
                          type="text"
                          placeholder="Nombre (ej. Juan)"
                          value={c.nombre}
                          onChange={e => updateContributor(c.id, 'nombre', e.target.value)}
                          className="flex-1 text-[11px]"
                          required
                        />
                        <input
                          type="number"
                          placeholder="Aporte (BOB)"
                          value={c.monto}
                          onChange={e => updateContributor(c.id, 'monto', e.target.value)}
                          className="w-[100px] text-[11px]"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => removeContributor(c.id)}
                          className="p-2 rounded bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white transition-all"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl flex justify-between items-center mt-2">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-neutral-500">Costo Neto Propio a Pagar:</span>
                  <span className="text-xs font-black text-emerald-400">{computedNetCost.toLocaleString()} BOB</span>
                </div>
              </div>

              <div>
                <label className="text-[9px] font-bold uppercase tracking-widest text-neutral-400 block mb-1.5">Enlace / Web del Servicio (Opcional)</label>
                <input
                  type="text"
                  value={serviceForm.url_servicio}
                  onChange={e => setServiceForm(prev => ({ ...prev, url_servicio: e.target.value }))}
                  placeholder="ej. netflix.com, openai.com"
                  className="w-full text-xs"
                />
              </div>

              <div>
                <label className="text-[9px] font-bold uppercase tracking-widest text-neutral-400 block mb-1.5">Notas, PIN o Perfil</label>
                <textarea
                  value={serviceForm.notas}
                  onChange={e => setServiceForm(prev => ({ ...prev, notas: e.target.value }))}
                  placeholder="Detalles de la cuenta, perfil asignado, correo o contraseña..."
                  className="w-full h-14 text-xs resize-none"
                />
              </div>

              <div className="flex gap-2 pt-3 border-t border-white/5">
                <button
                  type="submit"
                  disabled={serviceLoading}
                  className="btn-action-pill btn-action-pill-primary flex-1 py-2.5"
                  style={{ borderRadius: '12px' }}
                >
                  {serviceLoading ? <RefreshCw size={12} className="animate-spin" /> : <Save size={12} />} Guardar Suscripción
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL DE EDICIÓN DE EGRESO ─────────────────────────────────────── */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-[1050] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div
            className="w-full max-w-md border rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200"
            style={{ backgroundColor: t.panel, borderColor: t.border }}
          >
            <div className="p-5 border-b flex justify-between items-center" style={{ borderColor: t.border }}>
              <h3 className="text-xs font-black uppercase tracking-wider text-white">
                Editar Egreso
              </h3>
              <button
                onClick={() => setShowExpenseModal(false)}
                className="p-2 rounded-lg bg-white/5 text-neutral-400 hover:text-white transition-all"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveExpense} className="p-6 space-y-4">
              <div>
                <label className="text-[9px] font-bold uppercase tracking-widest text-neutral-400 block mb-1.5">Concepto</label>
                <input
                  type="text"
                  value={expenseForm.descripcion}
                  onChange={e => setExpenseForm(prev => ({ ...prev, descripcion: e.target.value }))}
                  className="w-full text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] font-bold uppercase tracking-widest text-neutral-400 block mb-1.5">Monto (BOB)</label>
                  <input
                    type="number"
                    value={expenseForm.monto}
                    onChange={e => setExpenseForm(prev => ({ ...prev, monto: e.target.value }))}
                    className="w-full text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="text-[9px] font-bold uppercase tracking-widest text-neutral-400 block mb-1.5">Fecha</label>
                  <input
                    type="date"
                    value={expenseForm.fecha}
                    onChange={e => setExpenseForm(prev => ({ ...prev, fecha: e.target.value }))}
                    className="w-full text-xs"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-[9px] font-bold uppercase tracking-widest text-neutral-400 block mb-1.5">Categoría</label>
                <select
                  value={expenseForm.categoria}
                  onChange={e => setExpenseForm(prev => ({ ...prev, categoria: e.target.value }))}
                  className="w-full text-xs"
                >
                  <option value="Servicio">Servicio</option>
                  <option value="Suscripción">Suscripción</option>
                  <option value="Alimentación / Comida">Alimentación</option>
                  <option value="Personal / Salud">Personal</option>
                  <option value="Compras / Equipamiento">Compra</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>

              <div className="flex gap-2 pt-4 border-t border-white/5">
                <button
                  type="submit"
                  disabled={expenseLoading}
                  className="btn-action-pill btn-action-pill-primary flex-1 py-2.5"
                  style={{ borderRadius: '12px' }}
                >
                  {expenseLoading ? <RefreshCw size={12} className="animate-spin" /> : <Save size={12} />} Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default MisEgresos;
