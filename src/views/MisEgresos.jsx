import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { 
  Plus, Trash2, CreditCard, ArrowDownRight, Tag, Coffee, Wrench, Wifi, User, 
  ShoppingCart, Calendar, Edit3, Save, X, Search, FileText, 
  AlertTriangle, TrendingUp, DollarSign, Activity,
  Filter, Landmark, Sparkles, Check, Megaphone, 
  HelpCircle, Video, Cloud, Bookmark, Clock, PlusCircle, MinusCircle, RefreshCw, 
  ChevronRight, Download, PieChart, Target, ShieldCheck, CheckCircle2, AlertCircle
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useTheme } from '../lib/theme';
import { exportEgresosCSV } from '../utils/exportReport';

// ── NUMERACIÓN TABULAR ANIMADA (CountUp) ───────────────────────────
const CountUp = ({ value = 0, decimals = 0, suffix = '', duration = 800 }) => {
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
      const eased = 1 - Math.pow(1 - progress, 4);
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
  return <span className="num-tabular tabular-nums">{fmt}{suffix}</span>;
};

// ── CATEGORÍAS PARA SUSCRIPCIONES Y SERVICIOS ─────────────────────
const SERVICIO_CATEGORIAS = [
  { label: 'Streaming', icon: Video, color: '#f472b6' },
  { label: 'Cloud / Almacenamiento', icon: Cloud, color: '#38bdf8' },
  { label: 'Inteligencia Artificial', icon: Sparkles, color: '#a78bfa' },
  { label: 'Internet / Telecomunicaciones', icon: Wifi, color: '#60a5fa' },
  { label: 'Marketing / Anuncios', icon: Megaphone, color: '#fb923c' },
  { label: 'Servicio Básico (Luz/Agua)', icon: Landmark, color: '#f87171' },
  { label: 'Financiero / Crédito', icon: CreditCard, color: '#34d399' },
  { label: 'Alimentación / Comida', icon: Coffee, color: '#fbbf24' },
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
    fecha_pago: new Date().toISOString().split('T')[0],
    metodo: 'Tarjeta',
    categoria: 'Streaming',
    tipo: 'Mensual',
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
        { id: Math.random().toString(), nombre: '', monto: '' }
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
      const contribs = Array.isArray(s.contribuciones) ? s.contribuciones : [];
      return acc + contribs.reduce((sum, c) => sum + (parseFloat(c.monto) || 0), 0);
    }, 0);
  }, [activeServicios]);

  // Servicios pendientes / próximos del mes
  const serviciosPendientes = useMemo(() => {
    return activeServicios.filter(s => {
      const f = parseLocalDate(s.fecha_pago);
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
      const total = parseFloat(s.monto) || 0;
      const contribs = Array.isArray(s.contribuciones) ? s.contribuciones : [];
      const sumContribs = contribs.reduce((csum, c) => csum + (parseFloat(c.monto) || 0), 0);
      const net = Math.max(total - sumContribs, 0);
      return sum + (net * 12);
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
      fecha_pago: new Date().toISOString().split('T')[0],
      metodo: 'Tarjeta',
      categoria: 'Streaming',
      tipo: 'Mensual',
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
      fecha_pago: service.fecha_pago || new Date().toISOString().split('T')[0],
      metodo: service.metodo || 'Tarjeta',
      categoria: service.categoria || 'Streaming',
      tipo: service.tipo || 'Mensual',
      notas: service.notas || '',
      contribuciones: Array.isArray(service.contribuciones) ? service.contribuciones.map(c => ({
        id: c.id || Math.random().toString(),
        nombre: c.nombre || '',
        monto: c.monto || ''
      })) : []
    });
    setShowServiceModal(true);
  };

  const handleSaveService = async (e) => {
    e.preventDefault();
    if (!serviceForm.nombre || !serviceForm.monto || !serviceForm.fecha_pago) return;
    setServiceLoading(true);

    const payload = {
      nombre: serviceForm.nombre.trim(),
      monto: parseFloat(serviceForm.monto) || 0,
      fecha_pago: serviceForm.fecha_pago,
      metodo: serviceForm.metodo,
      categoria: serviceForm.categoria,
      tipo: serviceForm.tipo,
      notas: serviceForm.notas.trim(),
      contribuciones: (serviceForm.contribuciones || []).map(c => ({
        nombre: c.nombre.trim(),
        monto: parseFloat(c.monto) || 0
      }))
    };

    try {
      if (editingService) {
        // Optimistic UI
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

  // PAGO RÁPIDO EN 1-CLIC
  const handlePayServiceClick = async (service) => {
    try {
      const hoyStr = new Date().toISOString().split('T')[0];
      const total = parseFloat(service.monto) || 0;
      const contribs = Array.isArray(service.contribuciones) ? service.contribuciones : [];
      const sumContribs = contribs.reduce((acc, c) => acc + (parseFloat(c.monto) || 0), 0);
      const costoNeto = Math.max(total - sumContribs, 0);

      const nombresContribs = contribs.map(c => `${c.nombre} (${c.monto} BOB)`).join(', ');
      const descPago = `Suscripción: ${service.nombre}` + (nombresContribs ? ` · Aportes: ${nombresContribs}` : '');

      // 1. Siguiente fecha de vencimiento (+1 mes)
      const fActual = parseLocalDate(service.fecha_pago || hoyStr);
      fActual.setMonth(fActual.getMonth() + 1);
      const siguienteFechaPago = fActual.toISOString().split('T')[0];

      // 2. Crear nuevo egreso
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

      // Persistir
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
      setQuickExpense({
        descripcion: '',
        monto: '',
        categoria: 'Servicio',
        fecha: new Date().toISOString().split('T')[0]
      });
      await supabase.from('egresos').insert([item]);
      if (onRefresh) await onRefresh();
    } catch (err) {
      console.error("Error al registrar egreso:", err);
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
              Gestión inteligente de presupuesto, costos fijos y gastos compartidos
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

        {/* ── TARJETAS MÉTRICAS EJECUTIVAS (Linear Style con Sparklines Animadas) ──── */}
        <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-3'}`}>
          
          {/* Tarjeta 1: Total Gastado */}
          <div className="metric-card-executive animate-countUp stagger-1" style={{ backgroundColor: t.panel, borderColor: 'rgba(255,255,255,0.07)' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: t.textSecondary }}>Egresos del Mes</span>
                <span className="badge-luxury-neutral" style={{ padding: '2px 8px', fontSize: '9px' }}>
                  {budgetPercent}% Presupuesto
                </span>
              </div>
              <h3 style={{ fontSize: 26, fontWeight: 800, color: '#f87171', letterSpacing: '-0.04em', margin: 0 }}>
                <CountUp value={totalEgresosMes} /> <span style={{ fontSize: 13, fontWeight: 600, color: t.textMuted }}>BOB</span>
              </h3>
            </div>
            {/* Animated Smooth Sparkline Curve */}
            <div style={{ width: '100%', height: 54, marginTop: 14, position: 'relative' }}>
              <svg width="100%" height="100%" viewBox="0 0 300 65" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
                <defs>
                  <linearGradient id="grad-egresos-red" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity="0.35" />
                    <stop offset="60%" stopColor="#ef4444" stopOpacity="0.08" />
                    <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
                  </linearGradient>
                  <filter id="glow-egresos-red" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor="#ef4444" floodOpacity="0.4" />
                  </filter>
                </defs>
                <path
                  d="M 0,52 C 50,52 80,38 125,44 C 170,50 200,24 240,30 C 270,34 288,18 300,20 L 300,65 L 0,65 Z"
                  fill="url(#grad-egresos-red)"
                  className="sparkline-animated-fill"
                />
                <path
                  d="M 0,52 C 50,52 80,38 125,44 C 170,50 200,24 240,30 C 270,34 288,18 300,20"
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  filter="url(#glow-egresos-red)"
                  className="sparkline-animated-path"
                />
                <circle cx="298" cy="20" r="3" fill="#ef4444" />
                <circle cx="298" cy="20" r="6" fill="#ef4444" opacity="0.3" />
              </svg>
            </div>
          </div>

          {/* Tarjeta 2: Pendiente / Vencimientos */}
          <div className="metric-card-executive animate-countUp stagger-2" style={{ backgroundColor: t.panel, borderColor: 'rgba(255,255,255,0.07)' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: t.textSecondary }}>Por Pagar (Pendientes)</span>
                <span className="badge-luxury-warning" style={{ padding: '2px 8px', fontSize: '9px' }}>
                  {serviciosPendientes.length} servicios
                </span>
              </div>
              <h3 style={{ fontSize: 26, fontWeight: 800, color: '#fbbf24', letterSpacing: '-0.04em', margin: 0 }}>
                <CountUp value={totalPendienteMes} /> <span style={{ fontSize: 13, fontWeight: 600, color: t.textMuted }}>BOB</span>
              </h3>
            </div>
            {/* Animated Smooth Sparkline Curve */}
            <div style={{ width: '100%', height: 54, marginTop: 14, position: 'relative' }}>
              <svg width="100%" height="100%" viewBox="0 0 300 65" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
                <defs>
                  <linearGradient id="grad-egresos-amber" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.35" />
                    <stop offset="60%" stopColor="#fbbf24" stopOpacity="0.08" />
                    <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
                  </linearGradient>
                  <filter id="glow-egresos-amber" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor="#fbbf24" floodOpacity="0.4" />
                  </filter>
                </defs>
                <path
                  d="M 0,46 C 45,46 75,32 115,38 C 155,44 190,22 230,28 C 265,32 285,14 300,16 L 300,65 L 0,65 Z"
                  fill="url(#grad-egresos-amber)"
                  className="sparkline-animated-fill"
                />
                <path
                  d="M 0,46 C 45,46 75,32 115,38 C 155,44 190,22 230,28 C 265,32 285,14 300,16"
                  fill="none"
                  stroke="#fbbf24"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  filter="url(#glow-egresos-amber)"
                  className="sparkline-animated-path"
                />
                <circle cx="298" cy="16" r="3" fill="#fbbf24" />
                <circle cx="298" cy="16" r="6" fill="#fbbf24" opacity="0.3" />
              </svg>
            </div>
          </div>

          {/* Tarjeta 3: Aportes / Ahorro */}
          <div className="metric-card-executive animate-countUp stagger-3" style={{ backgroundColor: t.panel, borderColor: 'rgba(255,255,255,0.07)' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: t.textSecondary }}>Aportes de Co-pagadores</span>
                <span className="badge-luxury-success" style={{ padding: '2px 8px', fontSize: '9px' }}>
                  Ahorro Activo
                </span>
              </div>
              <h3 style={{ fontSize: 26, fontWeight: 800, color: '#34d399', letterSpacing: '-0.04em', margin: 0 }}>
                +<CountUp value={totalAportesProyectados} /> <span style={{ fontSize: 13, fontWeight: 600, color: t.textMuted }}>BOB</span>
              </h3>
            </div>
            {/* Animated Smooth Sparkline Curve */}
            <div style={{ width: '100%', height: 54, marginTop: 14, position: 'relative' }}>
              <svg width="100%" height="100%" viewBox="0 0 300 65" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
                <defs>
                  <linearGradient id="grad-egresos-emerald" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#34d399" stopOpacity="0.35" />
                    <stop offset="60%" stopColor="#34d399" stopOpacity="0.08" />
                    <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
                  </linearGradient>
                  <filter id="glow-egresos-emerald" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor="#34d399" floodOpacity="0.4" />
                  </filter>
                </defs>
                <path
                  d="M 0,50 C 50,50 85,34 130,40 C 175,46 205,22 245,28 C 275,32 288,14 300,16 L 300,65 L 0,65 Z"
                  fill="url(#grad-egresos-emerald)"
                  className="sparkline-animated-fill"
                />
                <path
                  d="M 0,50 C 50,50 85,34 130,40 C 175,46 205,22 245,28 C 275,32 288,14 300,16"
                  fill="none"
                  stroke="#34d399"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  filter="url(#glow-egresos-emerald)"
                  className="sparkline-animated-path"
                />
                <circle cx="298" cy="16" r="3" fill="#34d399" />
                <circle cx="298" cy="16" r="6" fill="#34d399" opacity="0.3" />
              </svg>
            </div>
          </div>

        </div>
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
                    Suscripciones y Pagos Recurrentes
                  </h3>
                  <p style={{ fontSize: 11, color: t.textMuted, margin: '2px 0 0' }}>
                    Registra y gestiona el ciclo mensual con división de aportes
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
                  <p style={{ margin: 0, fontWeight: 600, color: t.text }}>No tienes servicios registrados</p>
                  <p style={{ margin: '4px 0 0', fontSize: '11px', color: t.textMuted }}>Agrega Netflix, Spotify, ChatGPT, Alquiler o Servicios Básicos</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activeServicios.map(s => {
                    const cat = catServicioConfig[s.categoria] || { icon: HelpCircle, color: '#94a3b8' };
                    const IconComp = cat.icon;
                    const venc = getEstadoPago(s.fecha_pago);
                    const contribs = Array.isArray(s.contribuciones) ? s.contribuciones : [];
                    const sumContribs = contribs.reduce((acc, c) => acc + (parseFloat(c.monto) || 0), 0);
                    const totalMonto = parseFloat(s.monto) || 0;
                    const neto = Math.max(totalMonto - sumContribs, 0);

                    return (
                      <div
                        key={s.id}
                        style={{
                          padding: '16px 18px', borderRadius: '16px',
                          backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                          display: 'flex', flexDirection: isMobile ? 'column' : 'row',
                          alignItems: isMobile ? 'flex-start' : 'center', justifyContent: 'space-between',
                          gap: '14px', transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.14)'; e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)'; }}
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
                              <span style={{
                                fontSize: '9px', fontWeight: 700, padding: '2px 8px', borderRadius: '9999px',
                                backgroundColor: venc.bg, color: venc.color, textTransform: 'uppercase', letterSpacing: '0.04em'
                              }}>
                                {venc.label}
                              </span>
                            </div>
                            <p style={{ fontSize: '11px', color: t.textMuted, margin: '2px 0 0' }}>
                              Ciclo {s.tipo || 'Mensual'} · Vence el <span className="num-tabular" style={{ fontWeight: 600, color: t.textSecondary }}>{s.fecha_pago}</span> {s.notas ? `· ${s.notas}` : ''}
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
                              title="Marcar pago de este mes y avanzar fecha"
                            >
                              <Check size={12} /> Pagar
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
                <div>
                  <input
                    type="date"
                    value={quickExpense.fecha}
                    onChange={e => setQuickExpense(prev => ({ ...prev, fecha: e.target.value }))}
                    className="w-full text-xs"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={quickLoading}
                  className="btn-action-pill btn-action-pill-primary w-full py-2.5"
                  style={{ width: '100%', borderRadius: '12px', fontSize: '11px' }}
                >
                  {quickLoading ? <RefreshCw size={13} className="animate-spin" /> : <Save size={13} />} Guardar Egreso
                </button>
              </form>
            </div>

            {/* Widget: Resumen Anual Proyectado */}
            <div style={{ padding: '20px', backgroundColor: t.panel, border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px' }}>
              <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: t.textDim, display: 'block' }}>
                Proyección Anual
              </span>
              <h3 className="num-tabular" style={{ fontSize: '20px', fontWeight: 800, color: t.text, margin: '4px 0 2px' }}>
                {annualSubscriptionCost.toLocaleString()} <span style={{ fontSize: '11px', color: t.textMuted }}>BOB/año</span>
              </h3>
              <p style={{ fontSize: '10px', color: t.textMuted, margin: 0 }}>
                Costo neto anual estimado de tus {activeServicios.length} suscripciones activas
              </p>
            </div>

          </div>

        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          PESTAÑA 2: PRESUPUESTO & ANALÍTICA DE GASTOS
          ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'presupuesto' && (
        <div className="space-y-6">
          
          {/* Tarjeta de Control Presupuestario */}
          <div style={{ padding: '24px', backgroundColor: t.panel, border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 800, color: t.text, margin: 0, letterSpacing: '-0.02em' }}>
                  Control de Presupuesto Mensual
                </h3>
                <p style={{ fontSize: 11, color: t.textMuted, margin: '2px 0 0' }}>
                  Establece un techo de gastos para mantener tu salud financiera
                </p>
              </div>

              {isEditingBudget ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="number"
                    value={tempBudgetInput}
                    onChange={e => setTempBudgetInput(e.target.value)}
                    className="text-xs"
                    style={{ width: '120px', padding: '6px 10px', borderRadius: '10px' }}
                    autoFocus
                  />
                  <button onClick={handleSaveBudget} className="btn-action-pill btn-action-pill-primary">
                    <Check size={12} /> Guardar
                  </button>
                  <button onClick={() => setIsEditingBudget(false)} className="btn-action-pill">
                    Cancelar
                  </button>
                </div>
              ) : (
                <button onClick={() => { setTempBudgetInput(monthlyBudget.toString()); setIsEditingBudget(true); }} className="btn-action-pill">
                  <Edit3 size={12} /> Ajustar Límite ({monthlyBudget.toLocaleString()} BOB)
                </button>
              )}
            </div>

            {/* Barra de Progreso del Presupuesto */}
            <div style={{ width: '100%', height: '12px', borderRadius: '9999px', backgroundColor: 'rgba(255,255,255,0.05)', overflow: 'hidden', position: 'relative' }}>
              <div
                style={{
                  height: '100%',
                  width: `${budgetPercent}%`,
                  borderRadius: '9999px',
                  backgroundColor: budgetPercent > 90 ? '#ef4444' : budgetPercent > 70 ? '#f59e0b' : '#10b981',
                  transition: 'width 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                  boxShadow: `0 0 12px ${budgetPercent > 90 ? '#ef4444' : budgetPercent > 70 ? '#f59e0b' : '#10b981'}`
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', fontSize: '11px' }}>
              <span style={{ color: t.textMuted }}>
                Gastado: <strong className="num-tabular" style={{ color: t.text }}>{totalEgresosMes.toLocaleString()} BOB</strong> ({budgetPercent}%)
              </span>
              <span style={{ color: budgetRemaining >= 0 ? '#34d399' : '#ef4444', fontWeight: 700 }}>
                {budgetRemaining >= 0 ? `Disponible: +${budgetRemaining.toLocaleString()} BOB` : `Excedido por: ${Math.abs(budgetRemaining).toLocaleString()} BOB`}
              </span>
            </div>
          </div>

          {/* Desglose por Categoría */}
          <div style={{ padding: '24px', backgroundColor: t.panel, border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px' }}>
            <h3 style={{ fontSize: 14, fontWeight: 800, color: t.text, margin: '0 0 18px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Distribución de Gastos por Categoría (Este Mes)
            </h3>

            {categoryBreakdown.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: t.textDim, fontSize: '11px' }}>
                No hay gastos registrados en el mes actual para generar analíticas.
              </div>
            ) : (
              <div className="space-y-4">
                {categoryBreakdown.map((cat, idx) => {
                  const IconC = cat.icon;
                  return (
                    <div key={idx} className="space-y-1.5">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: cat.color }} />
                          <span style={{ fontWeight: 600, color: t.text }}>{cat.name}</span>
                        </div>
                        <span className="num-tabular" style={{ fontWeight: 700, color: t.text }}>
                          {cat.amount.toLocaleString()} BOB <span style={{ fontSize: '10px', color: t.textMuted }}>({cat.percentage}%)</span>
                        </span>
                      </div>
                      <div style={{ width: '100%', height: '6px', borderRadius: '9999px', backgroundColor: 'rgba(255,255,255,0.04)', overflow: 'hidden' }}>
                        <div
                          style={{
                            height: '100%',
                            width: `${cat.percentage}%`,
                            borderRadius: '9999px',
                            backgroundColor: cat.color,
                            transition: 'width 0.5s ease'
                          }}
                        />
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

      {/* ── MODAL NUEVA / EDITAR SUSCRIPCIÓN ───────────────────────────────── */}
      {showServiceModal && (
        <div className="fixed inset-0 z-[1050] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div
            className="w-full max-w-lg border rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200"
            style={{ backgroundColor: t.panel, borderColor: t.border }}
          >
            <div className="p-5 border-b flex justify-between items-center" style={{ borderColor: t.border }}>
              <h3 className="text-xs font-black uppercase tracking-wider text-white">
                {editingService ? "Editar Suscripción" : "Nueva Suscripción"}
              </h3>
              <button
                onClick={() => setShowServiceModal(false)}
                className="p-2 rounded-lg bg-white/5 text-neutral-400 hover:text-white transition-all"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveService} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto mac-scrollbar">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] font-bold uppercase tracking-widest text-neutral-400 block mb-1.5">Nombre del Servicio</label>
                  <input
                    type="text"
                    value={serviceForm.nombre}
                    onChange={e => setServiceForm(prev => ({ ...prev, nombre: e.target.value }))}
                    placeholder="Ej. Netflix, Spotify, ChatGPT"
                    className="w-full text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="text-[9px] font-bold uppercase tracking-widest text-neutral-400 block mb-1.5">Costo Mensual Total (BOB)</label>
                  <input
                    type="number"
                    value={serviceForm.monto}
                    onChange={e => setServiceForm(prev => ({ ...prev, monto: e.target.value }))}
                    placeholder="Ej. 100"
                    className="w-full text-xs"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
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
                  <label className="text-[9px] font-bold uppercase tracking-widest text-neutral-400 block mb-1.5">Fecha Vencimiento</label>
                  <input
                    type="date"
                    value={serviceForm.fecha_pago}
                    onChange={e => setServiceForm(prev => ({ ...prev, fecha_pago: e.target.value }))}
                    className="w-full text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="text-[9px] font-bold uppercase tracking-widest text-neutral-400 block mb-1.5">Método</label>
                  <select
                    value={serviceForm.metodo}
                    onChange={e => setServiceForm(prev => ({ ...prev, metodo: e.target.value }))}
                    className="w-full text-xs"
                  >
                    <option value="Tarjeta">Tarjeta</option>
                    <option value="Efectivo">Efectivo</option>
                    <option value="Transferencia">Transferencia</option>
                    <option value="QR">QR</option>
                  </select>
                </div>
              </div>

              {/* CO-PAGADORES (GASTOS COMPARTIDOS) */}
              <div className="pt-4 border-t border-white/5">
                <div className="flex justify-between items-center mb-3">
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
                  <p className="text-[10px] text-neutral-500 italic py-2">
                    Este servicio lo pagas tú solo en su totalidad.
                  </p>
                ) : (
                  <div className="space-y-2 mb-3">
                    {serviceForm.contribuciones.map(c => (
                      <div key={c.id} className="flex gap-2 items-center">
                        <input
                          type="text"
                          placeholder="Nombre (ej. Carlos)"
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
                  <span className="text-[9px] font-bold uppercase tracking-widest text-neutral-500">Monto Neto Real para Ti:</span>
                  <span className="text-xs font-black text-emerald-400">{computedNetCost.toLocaleString()} BOB</span>
                </div>
              </div>

              <div>
                <label className="text-[9px] font-bold uppercase tracking-widest text-neutral-400 block mb-1.5">Notas adicionales</label>
                <textarea
                  value={serviceForm.notas}
                  onChange={e => setServiceForm(prev => ({ ...prev, notas: e.target.value }))}
                  placeholder="Detalles, correo de la cuenta, PIN..."
                  className="w-full h-16 text-xs resize-none"
                />
              </div>

              <div className="flex gap-2 pt-4 border-t border-white/5">
                <button
                  type="submit"
                  disabled={serviceLoading}
                  className="btn-action-pill btn-action-pill-primary flex-1 py-2.5"
                  style={{ borderRadius: '12px' }}
                >
                  {serviceLoading ? <RefreshCw size={12} className="animate-spin" /> : <Save size={12} />} Guardar Suscripción
                </button>
                <button
                  type="button"
                  onClick={() => setShowServiceModal(false)}
                  className="btn-action-pill"
                  style={{ borderRadius: '12px', padding: '0 20px' }}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL EDITAR EGRESO ────────────────────────────────────────────── */}
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
                <label className="text-[9px] font-bold uppercase tracking-widest text-neutral-400 block mb-1.5">Concepto o Descripción</label>
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
              </div>

              <div>
                <label className="text-[9px] font-bold uppercase tracking-widest text-neutral-400 block mb-1.5">Fecha del Gasto</label>
                <input
                  type="date"
                  value={expenseForm.fecha}
                  onChange={e => setExpenseForm(prev => ({ ...prev, fecha: e.target.value }))}
                  className="w-full text-xs"
                  required
                />
              </div>

              <div className="flex gap-2 pt-4 border-t border-white/5">
                <button
                  type="submit"
                  disabled={expenseLoading}
                  className="btn-action-pill btn-action-pill-primary flex-1 py-2.5"
                  style={{ borderRadius: '12px' }}
                >
                  {expenseLoading ? <RefreshCw size={12} className="animate-spin" /> : <Save size={12} />} Actualizar Egreso
                </button>
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="btn-action-pill"
                  style={{ borderRadius: '12px', padding: '0 20px' }}
                >
                  Cancelar
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
