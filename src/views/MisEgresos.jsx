import React, { useState, useMemo, useEffect } from 'react';
import { 
  Plus, Trash2, CreditCard, ArrowDownRight, Tag, Coffee, Wrench, Wifi, User, 
  ShoppingCart, Calendar, Edit3, Save, X, Search, Mail, Phone, FileText, 
  AlertTriangle, TrendingUp, TrendingDown, Layers, Settings, DollarSign, Activity,
  Sliders, Filter, Landmark, Banknote, AlertCircle, Sparkles, Check, Megaphone, 
  HelpCircle, Video, Cloud, Music, Palette, Scissors
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { getTheme } from '../lib/theme';

// Categorías para gastos individuales
const GASTO_CATEGORIAS = [
  { label: 'Suscripción', icon: Wifi, color: '#a78bfa', defaultLimit: 200 },
  { label: 'Herramienta', icon: Wrench, color: '#38bdf8', defaultLimit: 500 },
  { label: 'Servicio',    icon: Tag, color: '#fb923c', defaultLimit: 400 },
  { label: 'Personal',   icon: User, color: '#4ade80', defaultLimit: 800 },
  { label: 'Compra',     icon: ShoppingCart, color: '#f472b6', defaultLimit: 600 },
  { label: 'Crédito / Préstamo', icon: Landmark, color: '#60a5fa', defaultLimit: 700 },
  { label: 'Deuda',      icon: AlertCircle, color: '#f87171', defaultLimit: 400 },
  { label: 'Alimentación', icon: Coffee, color: '#f59e0b', defaultLimit: 300 },
  { label: 'Otro',       icon: HelpCircle, color: '#94a3b8', defaultLimit: 300 },
];

// Categorías para suscripciones / servicios
const SERVICIO_CATEGORIAS = [
  { label: 'Streaming', icon: Video, color: '#f472b6' },
  { label: 'Cloud / Almacenamiento', icon: Cloud, color: '#38bdf8' },
  { label: 'Inteligencia Artificial', icon: Sparkles, color: '#a78bfa' },
  { label: 'Marketing / Anuncios', icon: Megaphone, color: '#fb923c' },
  { label: 'SaaS / Software', icon: Layers, color: '#2dd4bf' },
  { label: 'Servicio Básico', icon: Landmark, color: '#94a3b8' },
  { label: 'Financiero / Crédito', icon: CreditCard, color: '#4ade80' },
  { label: 'Otro', icon: HelpCircle, color: '#64748b' }
];

const catGastoConfig = Object.fromEntries(GASTO_CATEGORIAS.map(c => [c.label, c]));
const catServicioConfig = Object.fromEntries(SERVICIO_CATEGORIAS.map(c => [c.label, c]));

const MisEgresos = ({ data, setData, servicios = [], setServicios, onRefresh, isDark = true, initialFilterText = '' }) => {
  const t = useMemo(() => getTheme(isDark), [isDark]);
  const egresos = data.egresos || [];
  const ventas  = data.ventas  || [];

  const [activeTab, setActiveTab] = useState(initialFilterText ? 'transacciones' : 'dashboard'); // dashboard | transacciones | suscripciones

  // ── Doble Moneda (Bolivianos Bs. / Dólares USD) ──────────────────────────
  const [currency, setCurrency] = useState(() => {
    return localStorage.getItem('sovereign_egresos_currency') || 'Bs';
  });
  const exchangeRate = 6.96; // 1 USD = 6.96 Bs

  useEffect(() => {
    localStorage.setItem('sovereign_egresos_currency', currency);
  }, [currency]);

  // Formateador de moneda dinámico
  const formatCurrency = (val) => {
    const num = parseFloat(val) || 0;
    if (currency === 'USD') {
      const usdVal = num / exchangeRate;
      return `$${usdVal.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`;
    }
    return `${num.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bs.`;
  };

  // Helper para convertir el presupuesto en base a la moneda
  const formatBudget = (val) => {
    return formatCurrency(val);
  };

  // ── Filtros para transacciones ──────────────────────────────────────────
  const [filterText, setFilterText] = useState(initialFilterText);

  useEffect(() => {
    if (initialFilterText) {
      setFilterText(initialFilterText);
      setActiveTab('transacciones');
    }
  }, [initialFilterText]);

  const [filterCategory, setFilterCategory] = useState('Todas');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  // ── Presupuestos (Persistencia en localStorage) ──────────────────────────
  const [monthlyBudget, setMonthlyBudget] = useState(() => {
    const saved = localStorage.getItem('sovereign_monthly_budget');
    return saved ? parseFloat(saved) : 2500;
  });

  const [categoryBudgets, setCategoryBudgets] = useState(() => {
    const saved = localStorage.getItem('sovereign_category_budgets');
    if (saved) return JSON.parse(saved);
    return Object.fromEntries(GASTO_CATEGORIAS.map(c => [c.label, c.defaultLimit]));
  });

  const [isEditingBudgets, setIsEditingBudgets] = useState(false);
  const [tempMonthlyBudget, setTempMonthlyBudget] = useState(monthlyBudget);
  const [tempCategoryBudgets, setTempCategoryBudgets] = useState(categoryBudgets);

  useEffect(() => {
    localStorage.setItem('sovereign_monthly_budget', monthlyBudget.toString());
  }, [monthlyBudget]);

  useEffect(() => {
    localStorage.setItem('sovereign_category_budgets', JSON.stringify(categoryBudgets));
  }, [categoryBudgets]);

  // ── Formulario de Gasto Individual (Crear / Editar) ─────────────────────────
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [expenseLoading, setExpenseLoading] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null); // null = nuevo, objeto = editando
  const [expenseForm, setExpenseForm] = useState({
    fecha: new Date().toISOString().split('T')[0],
    descripcion: '',
    categoria: 'Suscripción',
    monto: '',
    notas: '',
  });

  // ── Formulario de Servicio Recurrente (Crear / Editar) ─────────────────────
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [serviceLoading, setServiceLoading] = useState(false);
  const [editingService, setEditingService] = useState(null); // null = nuevo, objeto = editando
  const [serviceForm, setServiceForm] = useState({
    nombre: '',
    monto: '',
    fecha_pago: new Date().toISOString().split('T')[0],
    metodo: 'Tarjeta',
    contacto: '',
    notas: '',
    tipo: 'Mensual',
    categoria: 'Streaming'
  });

  // Cargar/actualizar datos al montar
  useEffect(() => {
    if (onRefresh) onRefresh();
  }, []);

  // ── Cálculos Financieros Consolidados ──────────────────────────────────────
  const ahora = new Date();
  const mesActualStr = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}`;

  // Se consolidan gastos individuales + suscripciones recurrentes
  const totalEgresosAllTime = egresos.reduce((acc, e) => acc + (parseFloat(e.monto) || 0), 0) + servicios.reduce((acc, s) => acc + (parseFloat(s.monto) || 0), 0);
  const egresosMesActual = egresos.filter(e => e.fecha?.startsWith(mesActualStr));
  const totalEgresosMes = egresosMesActual.reduce((acc, e) => acc + (parseFloat(e.monto) || 0), 0) + servicios.reduce((acc, s) => acc + (parseFloat(s.monto) || 0), 0);
  const totalIngresosMes = ventas.filter(v => v.fecha?.startsWith(mesActualStr)).reduce((acc, v) => acc + (parseFloat(v.monto) || 0), 0);
  const gananciaNetaMes = totalIngresosMes - totalEgresosMes;

  // Distribución de gastos del mes actual por categoría consolidando suscripciones en la categoría "Suscripción"
  const egresosPorCategoriaMes = useMemo(() => {
    return GASTO_CATEGORIAS.map(cat => {
      let totalCat = egresosMesActual
        .filter(e => e.categoria === cat.label)
        .reduce((acc, e) => acc + (parseFloat(e.monto) || 0), 0);
      
      if (cat.label === 'Suscripción') {
        totalCat += servicios.reduce((acc, s) => acc + (parseFloat(s.monto) || 0), 0);
      }

      return {
        ...cat,
        total: totalCat,
        limit: categoryBudgets[cat.label] || cat.defaultLimit,
        pct: Math.min(Math.round((totalCat / (categoryBudgets[cat.label] || cat.defaultLimit || 1)) * 100), 100)
      };
    }).sort((a, b) => b.total - a.total);
  }, [egresosMesActual, categoryBudgets, servicios]);

  // Transacciones Filtradas
  const filteredEgresos = useMemo(() => {
    return egresos.filter(e => {
      const matchText = !filterText || e.descripcion?.toLowerCase().includes(filterText.toLowerCase()) || e.notas?.toLowerCase().includes(filterText.toLowerCase());
      const matchCategory = filterCategory === 'Todas' || e.categoria === filterCategory;
      const matchStart = !filterStartDate || e.fecha >= filterStartDate;
      const matchEnd = !filterEndDate || e.fecha <= filterEndDate;
      return matchText && matchCategory && matchStart && matchEnd;
    }).sort((a, b) => b.fecha.localeCompare(a.fecha));
  }, [egresos, filterText, filterCategory, filterStartDate, filterEndDate]);

  // Mayor gasto del mes (considerando también suscripciones individuales)
  const mayorGastoMes = useMemo(() => {
    const listado = [...egresosMesActual];
    servicios.forEach(s => listado.push({ descripcion: s.nombre, monto: s.monto, categoria: 'Suscripción' }));
    if (listado.length === 0) return null;
    return listado.sort((a, b) => parseFloat(b.monto) - parseFloat(a.monto))[0];
  }, [egresosMesActual, servicios]);

  // Promedio diario del mes
  const promedioDiarioMes = useMemo(() => {
    if (totalEgresosMes === 0) return 0;
    const diasTranscurridos = ahora.getDate();
    return totalEgresosMes / diasTranscurridos;
  }, [totalEgresosMes]);

  // ── Operaciones Egresos ─────────────────────────────────────────────────────
  const handleSaveBudget = () => {
    setMonthlyBudget(parseFloat(tempMonthlyBudget) || 0);
    setCategoryBudgets(tempCategoryBudgets);
    setIsEditingBudgets(false);
  };

  const handleOpenBudgetEditor = () => {
    setTempMonthlyBudget(monthlyBudget);
    setTempCategoryBudgets(categoryBudgets);
    setIsEditingBudgets(true);
  };

  const handleOpenNewExpense = () => {
    setEditingExpense(null);
    setExpenseForm({
      fecha: new Date().toISOString().split('T')[0],
      descripcion: '',
      categoria: 'Suscripción',
      monto: '',
      notas: '',
    });
    setShowExpenseForm(true);
  };

  const handleOpenEditExpense = (e) => {
    setEditingExpense(e);
    setExpenseForm({
      fecha: e.fecha,
      descripcion: e.descripcion,
      categoria: e.categoria,
      monto: e.monto,
      notas: e.notas || '',
    });
    setShowExpenseForm(true);
  };

  const handleSaveExpense = async () => {
    if (!expenseForm.descripcion.trim() || !expenseForm.monto) return;
    setExpenseLoading(true);

    const payload = {
      id: editingExpense ? editingExpense.id : crypto.randomUUID(),
      fecha: expenseForm.fecha,
      descripcion: expenseForm.descripcion.trim(),
      categoria: expenseForm.categoria,
      monto: parseFloat(expenseForm.monto),
      notas: expenseForm.notas.trim() || null
    };

    try {
      const { error } = await supabase.from('egresos').upsert(payload);
      if (error) throw error;
      
      if (editingExpense) {
        setData(prev => ({
          ...prev,
          egresos: prev.egresos.map(item => item.id === editingExpense.id ? payload : item)
        }));
      } else {
        setData(prev => ({
          ...prev,
          egresos: [payload, ...prev.egresos]
        }));
      }

      setExpenseForm({ fecha: new Date().toISOString().split('T')[0], descripcion: '', categoria: 'Suscripción', monto: '', notas: '' });
      setShowExpenseForm(false);
      setEditingExpense(null);
      if (onRefresh) onRefresh();
    } catch (err) { 
      alert('Error al guardar egreso: ' + err.message); 
    } finally { 
      setExpenseLoading(false); 
    }
  };

  const handleDeleteExpense = async (id) => {
    if (!confirm('¿Seguro que deseas eliminar este registro de gasto?')) return;
    try {
      const { error } = await supabase.from('egresos').delete().eq('id', id);
      if (error) throw error;
      setData(prev => ({ ...prev, egresos: prev.egresos.filter(e => e.id !== id) }));
      if (onRefresh) onRefresh();
    } catch (err) { 
      alert('Error al eliminar: ' + err.message); 
    }
  };

  // ── Operaciones Servicios/Suscripciones ──────────────────────────────────────
  const handleOpenNewService = () => {
    setEditingService(null);
    setServiceForm({
      nombre: '',
      monto: '',
      fecha_pago: new Date().toISOString().split('T')[0],
      metodo: 'Tarjeta',
      contacto: '',
      notas: '',
      tipo: 'Mensual',
      categoria: 'Streaming'
    });
    setShowServiceForm(true);
  };

  const handleOpenEditService = (s) => {
    setEditingService(s);
    
    // Desempaquetar categoria de notas si viene del fallback
    let cat = s.categoria || 'Streaming';
    let cleanNotas = s.notas || '';
    if (s.notas && s.notas.startsWith('[Categoría:')) {
      const match = s.notas.match(/^\[Categoría:\s*([^\]]+)\]\s*(.*)/);
      if (match) {
        cat = match[1];
        cleanNotas = match[2];
      }
    }

    setServiceForm({
      nombre: s.nombre,
      monto: s.monto,
      fecha_pago: s.fecha_pago,
      metodo: s.metodo,
      contacto: s.contacto || '',
      notas: cleanNotas,
      tipo: s.tipo || 'Mensual',
      categoria: cat
    });
    setShowServiceForm(true);
  };

  const handleSaveService = async () => {
    if (!serviceForm.nombre.trim() || !serviceForm.monto || !serviceForm.fecha_pago) {
      alert('Por favor completa los campos obligatorios (*).');
      return;
    }
    setServiceLoading(true);

    const payload = {
      id: editingService ? editingService.id : crypto.randomUUID(),
      nombre: serviceForm.nombre.trim(),
      monto: parseFloat(serviceForm.monto) || 0,
      fecha_pago: serviceForm.fecha_pago,
      metodo: serviceForm.metodo,
      contacto: (serviceForm.contacto || '').trim() || null,
      notas: (serviceForm.notas || '').trim() || null,
      tipo: serviceForm.tipo,
      categoria: serviceForm.categoria
    };

    try {
      let { error } = await supabase.from('servicios').upsert(payload);
      if (error) {
        // Fallback robusto por si no existe la columna categoria
        if (error.message && (error.message.toLowerCase().includes("categoria") || error.message.toLowerCase().includes("column"))) {
          const { categoria, ...fallbackPayload } = payload;
          fallbackPayload.notas = `[Categoría: ${serviceForm.categoria}] ${(serviceForm.notas || '').trim()}`.trim() || null;
          const retry = await supabase.from('servicios').upsert(fallbackPayload);
          if (retry.error) throw retry.error;
        } else {
          throw error;
        }
      }
      
      // Forzar recarga en componente principal
      if (onRefresh) await onRefresh();
      
      setShowServiceForm(false);
      setEditingService(null);
    } catch (err) {
      alert('Error al guardar servicio: ' + err.message);
    } finally {
      setServiceLoading(false);
    }
  };

  const handleDeleteService = async (id) => {
    if (!confirm('¿Deseas dar de baja o eliminar esta suscripción recurrente?')) return;
    try {
      const { error } = await supabase.from('servicios').delete().eq('id', id);
      if (error) throw error;
      if (onRefresh) onRefresh();
    } catch (err) {
      alert('Error al eliminar: ' + err.message);
    }
  };

  const getMetodoIcon = (metodo) => {
    if (metodo === 'Tarjeta') return CreditCard;
    if (metodo === 'Banco') return Landmark;
    return Banknote;
  };

  // Helper de colores para la barra de presupuesto
  const getProgressColor = (pct) => {
    if (pct < 70) return '#4ade80'; // verde
    if (pct < 90) return '#fb923c'; // naranja
    return '#f87171'; // rojo
  };

  const budgetUsagePercent = Math.min(Math.round((totalEgresosMes / (monthlyBudget || 1)) * 100), 100);

  return (
    <div className="flex flex-col h-full w-full select-none" style={{ color: t.text }}>
      
      {/* ── CABECERA ────────────────────────────────────────────────────────── */}
      <header className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white mb-1">Mis Egresos</h2>
          <p className="text-xs text-neutral-400 font-medium">Dashboard financiero consolidado con control de presupuestos en múltiples monedas</p>
        </div>

        <div className="flex flex-wrap gap-4 items-center self-start lg:self-center">
          {/* Selector de moneda */}
          <div className="flex p-0.5 rounded-xl border border-white/5" style={{ backgroundColor: t.accentSoft }}>
            <button
              onClick={() => setCurrency('Bs')}
              className="px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all"
              style={{
                backgroundColor: currency === 'Bs' ? t.accent : 'transparent',
                color: currency === 'Bs' ? '#000' : t.textDim,
              }}
            >
              Bs.
            </button>
            <button
              onClick={() => setCurrency('USD')}
              className="px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all"
              style={{
                backgroundColor: currency === 'USD' ? t.accent : 'transparent',
                color: currency === 'USD' ? '#000' : t.textDim,
              }}
            >
              USD
            </button>
          </div>
          
          {/* Switcher de Pestañas */}
          <div className="flex p-0.5 rounded-xl" style={{ backgroundColor: t.accentSoft, border: `1px solid ${t.border}` }}>
            {[
              { id: 'dashboard', label: 'Dashboard', icon: Activity },
              { id: 'transacciones', label: 'Gastos Individuales', icon: Layers },
              { id: 'suscripciones', label: 'Suscripciones & Servicios', icon: Wifi },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all"
                style={{
                  backgroundColor: activeTab === tab.id ? t.accent : 'transparent',
                  color: activeTab === tab.id ? '#000' : t.textDim,
                }}
              >
                <tab.icon size={12} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* ── VISTA 1: DASHBOARD FINANCIERO ─────────────────────────────────────── */}
      {activeTab === 'dashboard' && (
        <div className="flex flex-col gap-6 animate-in fade-in duration-500">
          
          {/* Tarjetas KPI Sin Sombras */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* KPI 1: Total Gastado */}
            <div className="p-5 rounded-2xl border border-white/5 flex flex-col justify-between min-h-[110px] transition-all hover:scale-[1.02]" style={{ backgroundColor: t.bg }}>
              <div className="flex items-center justify-between text-neutral-400 text-[9px] font-black uppercase tracking-widest mb-4">
                <span>Gastado Total (Consolidado)</span>
                <CreditCard size={14} className="text-neutral-500" />
              </div>
              <div>
                <p className="text-2xl font-light text-white tracking-tight">{formatCurrency(totalEgresosAllTime)}</p>
                <p className="text-[9px] text-neutral-500 mt-1 font-bold">Gastos + Suscripciones</p>
              </div>
            </div>

            {/* KPI 2: Presupuesto Mensual */}
            <div className="p-5 rounded-2xl border border-white/5 flex flex-col justify-between min-h-[110px] transition-all hover:scale-[1.02]" style={{ backgroundColor: t.bg }}>
              <div className="flex items-center justify-between text-neutral-400 text-[9px] font-black uppercase tracking-widest mb-4">
                <span>Presupuesto Mes</span>
                <button 
                  onClick={handleOpenBudgetEditor} 
                  className="p-1.5 rounded-lg border border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/10 transition-all text-neutral-400 hover:text-white flex items-center justify-center"
                  title="Ajustar Presupuesto"
                >
                  <Sliders size={12} />
                </button>
              </div>
              <div>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-light text-white tracking-tight">{formatBudget(monthlyBudget)}</p>
                  <button onClick={handleOpenBudgetEditor} className="text-[8px] text-neutral-500 font-bold hover:text-white uppercase tracking-wider">Ajustar</button>
                </div>
                <p className="text-[9px] text-neutral-500 mt-1 font-bold">Límite mensual general</p>
              </div>
            </div>

            {/* KPI 3: Ingresos del Mes */}
            <div className="p-5 rounded-2xl border border-white/5 flex flex-col justify-between min-h-[110px] transition-all hover:scale-[1.02]" style={{ backgroundColor: t.bg }}>
              <div className="flex items-center justify-between text-neutral-400 text-[9px] font-black uppercase tracking-widest mb-4">
                <span>Ingresos del Mes</span>
                <TrendingUp size={14} className="text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-light text-emerald-400 tracking-tight">{formatCurrency(totalIngresosMes)}</p>
                <p className="text-[9px] text-neutral-500 mt-1 font-bold">De ventas digitales</p>
              </div>
            </div>

            {/* KPI 4: Margen Neto */}
            <div className="p-5 rounded-2xl border border-white/5 flex flex-col justify-between min-h-[110px] transition-all hover:scale-[1.02]" style={{ backgroundColor: t.bg }}>
              <div className="flex items-center justify-between text-neutral-400 text-[9px] font-black uppercase tracking-widest mb-4">
                <span>Margen Neto Mes</span>
                {gananciaNetaMes >= 0 ? <Sparkles size={14} className="text-emerald-400" /> : <AlertCircle size={14} className="text-rose-400" />}
              </div>
              <div>
                <p className={`text-2xl font-semibold tracking-tight ${gananciaNetaMes >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {gananciaNetaMes >= 0 ? '+' : ''}{formatCurrency(gananciaNetaMes)}
                </p>
                <p className="text-[9px] text-neutral-500 mt-1 font-bold">Balance de ganancias</p>
              </div>
            </div>

          </div>

          {/* Segunda fila: Progreso Presupuesto y Límites Categorías Sin Sombras */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Columna Izquierda: Progreso General */}
            <div className="lg:col-span-5 p-6 rounded-3xl border border-white/5 flex flex-col justify-between gap-6" style={{ backgroundColor: t.bg }}>
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-white mb-2">Presupuesto Mensual Consumido</h3>
                <p className="text-[10px] text-neutral-400">Consumo total del presupuesto asignado para el periodo mensual actual</p>
              </div>

              {/* Progress Visual */}
              <div className="flex flex-col items-center justify-center py-4">
                <div className="relative w-36 h-36 flex items-center justify-center rounded-full border border-white/5" style={{ backgroundColor: t.bg }}>
                  {/* Círculo de progreso estilizado */}
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="42" stroke="rgba(255,255,255,0.02)" strokeWidth="6" fill="transparent" />
                    <circle 
                      cx="50" 
                      cy="50" 
                      r="42" 
                      stroke={getProgressColor(budgetUsagePercent)} 
                      strokeWidth="6" 
                      fill="transparent" 
                      strokeDasharray={2 * Math.PI * 42}
                      strokeDashoffset={(2 * Math.PI * 42) * (1 - budgetUsagePercent / 100)}
                      strokeLinecap="round"
                      style={{ transition: 'stroke-dashoffset 0.8s ease' }}
                    />
                  </svg>
                  <div className="absolute text-center">
                    <span className="text-3xl font-black text-white">{budgetUsagePercent}%</span>
                    <span className="text-[8px] text-neutral-500 font-bold uppercase tracking-widest block mt-1">Consumido</span>
                  </div>
                </div>
              </div>

              {/* Status details */}
              <div className="space-y-3 bg-black/20 p-4 rounded-xl border border-white/5 text-[11px] font-medium">
                <div className="flex justify-between">
                  <span className="text-neutral-400">Total Consumido:</span>
                  <span className="text-white">{formatCurrency(totalEgresosMes)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Presupuesto Límite:</span>
                  <span className="text-white">{formatBudget(monthlyBudget)}</span>
                </div>
                <div className="h-px bg-white/5 my-2"></div>
                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wide">
                  <span className="text-neutral-400">Remanente Disponible:</span>
                  <span className={monthlyBudget - totalEgresosMes >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                    {formatCurrency(monthlyBudget - totalEgresosMes)}
                  </span>
                </div>
              </div>
            </div>

            {/* Columna Derecha: Límites por Categoría */}
            <div className="lg:col-span-7 p-6 rounded-3xl border border-white/5 flex flex-col gap-6" style={{ backgroundColor: t.bg }}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-white mb-1">Presupuestos por Categoría</h3>
                  <p className="text-[10px] text-neutral-400">Control de gastos específicos del mes (Suscripciones incluidas)</p>
                </div>
                <button onClick={handleOpenBudgetEditor} className="text-[9px] font-black uppercase tracking-widest rounded-lg px-3 py-1.5 transition-all border border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/10 text-white flex items-center gap-1.5">
                  <Sliders size={10} /> Configurar Límites
                </button>
              </div>

              <div className="flex flex-col gap-4">
                {egresosPorCategoriaMes.map(cat => {
                  const Icon = cat.icon;
                  const isExceeded = cat.total > cat.limit;
                  return (
                    <div key={cat.label} className="bg-zinc-950/20 p-3 rounded-xl border border-white/5 flex flex-col gap-2">
                      <div className="flex items-center justify-between text-[11px] font-semibold">
                        <span className="flex items-center gap-2" style={{ color: cat.color }}>
                          <Icon size={12} />
                          {cat.label}
                        </span>
                        <div className="flex items-center gap-1.5 font-mono text-[10px]">
                          <span className={isExceeded ? 'text-rose-400 font-bold' : 'text-white'}>
                            {formatCurrency(cat.total)}
                          </span>
                          <span className="text-neutral-500">/</span>
                          <span className="text-neutral-400">{formatBudget(cat.limit)}</span>
                        </div>
                      </div>
                      
                      {/* Bar */}
                      <div className="h-2 w-full bg-white/5 rounded-xl overflow-hidden">
                        <div 
                          className="h-full rounded-xl transition-all duration-700"
                          style={{
                            width: `${cat.pct}%`,
                            backgroundColor: getProgressColor(cat.pct)
                          }}
                        />
                      </div>

                      {/* Warning if exceeded */}
                      <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-wider">
                        <span className="text-neutral-500">{cat.pct}% del límite consumido</span>
                        {isExceeded && (
                          <span className="text-rose-400 flex items-center gap-1 font-mono text-[8px]">
                            <AlertTriangle size={10} /> Excedido por {formatCurrency(cat.total - cat.limit)}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>

          </div>

          {/* Fila 3: Estadísticas rápidas Sin Sombras */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Estadística 1: Mayor Gasto */}
            <div className="p-5 rounded-2xl border border-white/5 flex items-center gap-4" style={{ backgroundColor: t.bg }}>
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center flex-shrink-0">
                <TrendingDown size={20} />
              </div>
              <div className="min-w-0">
                <span className="text-[8px] font-black uppercase text-neutral-400 tracking-widest block">Mayor Gasto del Mes</span>
                {mayorGastoMes ? (
                  <>
                    <h5 className="text-xs font-bold text-white truncate mt-1">{mayorGastoMes.descripcion}</h5>
                    <p className="text-[11px] font-bold text-rose-400 mt-0.5 font-mono">-{formatCurrency(mayorGastoMes.monto)}</p>
                  </>
                ) : (
                  <p className="text-[10px] text-neutral-500 italic mt-1">Sin egresos registrados</p>
                )}
              </div>
            </div>

            {/* Estadística 2: Promedio Diario */}
            <div className="p-5 rounded-2xl border border-white/5 flex items-center gap-4" style={{ backgroundColor: t.bg }}>
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center flex-shrink-0">
                <Calendar size={20} />
              </div>
              <div>
                <span className="text-[8px] font-black uppercase text-neutral-400 tracking-widest block">Gasto Diario Promedio</span>
                <p className="text-sm font-bold text-white mt-1 font-mono">{formatCurrency(promedioDiarioMes)} / día</p>
                <p className="text-[8px] text-neutral-500 font-bold uppercase tracking-wider mt-0.5">Mes transcurrido</p>
              </div>
            </div>

            {/* Estadística 3: Frecuencia de Gastos */}
            <div className="p-5 rounded-2xl border border-white/5 flex items-center gap-4" style={{ backgroundColor: t.bg }}>
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 text-violet-400 flex items-center justify-center flex-shrink-0">
                <Activity size={20} />
              </div>
              <div>
                <span className="text-[8px] font-black uppercase text-neutral-400 tracking-widest block">Transacciones del Mes</span>
                <p className="text-sm font-bold text-white mt-1">{egresosMesActual.length} operaciones</p>
                <p className="text-[8px] text-neutral-500 font-bold uppercase tracking-wider mt-0.5">En el periodo actual</p>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ── VISTA 2: LISTADO DE GASTOS ─────────────────────────────────────────── */}
      {activeTab === 'transacciones' && (
        <div className="flex flex-col gap-5 animate-in fade-in duration-500">
          
          {/* Controles de Búsqueda y Filtrado Sin Sombras */}
          <div className="p-4 rounded-2xl border border-white/5 flex flex-col md:flex-row gap-4 items-center justify-between" style={{ backgroundColor: t.bg }}>
            <div className="flex flex-wrap gap-3 items-center w-full md:w-auto">
              
              {/* Buscador */}
              <div className="relative w-full sm:w-[220px]">
                <input
                  type="text"
                  placeholder="Buscar gastos..."
                  value={filterText}
                  onChange={e => setFilterText(e.target.value)}
                  className="w-full bg-zinc-950/40 border border-white/5 rounded-xl pl-4 pr-4 py-2 text-xs outline-none text-white focus:border-white/20 transition-all"
                />
              </div>

              {/* Categorías */}
              <div className="relative">
                <select
                  value={filterCategory}
                  onChange={e => setFilterCategory(e.target.value)}
                  className="bg-zinc-950/40 border border-white/5 rounded-xl px-3 py-2 text-xs outline-none text-neutral-300 cursor-pointer focus:border-white/20"
                >
                  <option value="Todas">Todas las Categorías</option>
                  {GASTO_CATEGORIAS.map(c => <option key={c.label} value={c.label}>{c.label}</option>)}
                </select>
              </div>

              {/* Rango de Fechas */}
              <div className="flex items-center gap-2 text-neutral-500 text-xs font-semibold">
                <input
                  type="date"
                  value={filterStartDate}
                  onChange={e => setFilterStartDate(e.target.value)}
                  className="bg-zinc-950/40 border border-white/5 rounded-xl px-3 py-2 text-xs outline-none text-neutral-300 focus:border-white/20"
                />
                <span>a</span>
                <input
                  type="date"
                  value={filterEndDate}
                  onChange={e => setFilterEndDate(e.target.value)}
                  className="bg-zinc-950/40 border border-white/5 rounded-xl px-3 py-2 text-xs outline-none text-neutral-300 focus:border-white/20"
                />
              </div>

              {/* Limpiar Filtros */}
              {(filterText || filterCategory !== 'Todas' || filterStartDate || filterEndDate) && (
                <button
                  onClick={() => { setFilterText(''); setFilterCategory('Todas'); setFilterStartDate(''); setFilterEndDate(''); }}
                  className="text-[9px] font-black uppercase tracking-widest text-neutral-400 hover:text-white px-2 py-1 transition-all"
                >
                  Limpiar Filtros
                </button>
              )}

            </div>

            {/* Registrar Egreso */}
            <button
              onClick={handleOpenNewExpense}
              className="w-full md:w-auto px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95"
              style={{ backgroundColor: t.accent, color: '#000' }}
            >
              <Plus size={14} strokeWidth={3} /> Registrar Gasto
            </button>
          </div>

          {/* Tabla de Egresos Sin Sombras */}
          <div className="rounded-2xl border border-white/5 overflow-hidden" style={{ backgroundColor: t.bg }}>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 bg-white/2">
                    <th className="px-5 py-4 text-[9px] font-black uppercase tracking-widest text-neutral-400">Descripción / Detalles</th>
                    <th className="px-5 py-4 text-[9px] font-black uppercase tracking-widest text-neutral-400">Categoría</th>
                    <th className="px-5 py-4 text-[9px] font-black uppercase tracking-widest text-neutral-400">Fecha</th>
                    <th className="px-5 py-4 text-[9px] font-black uppercase tracking-widest text-neutral-400 text-right">Monto</th>
                    <th className="px-5 py-4 w-24 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEgresos.length > 0 ? (
                    filteredEgresos.map(e => {
                      const cat = catGastoConfig[e.categoria] || catGastoConfig['Otro'];
                      const Icon = cat.icon;
                      return (
                        <tr 
                          key={e.id}
                          className="border-b border-white/5 hover:bg-white/1 transition-all group"
                        >
                          <td className="px-5 py-4">
                            <p className="text-xs font-semibold text-white">{e.descripcion}</p>
                            {e.notes && <p className="text-[10px] text-neutral-500 mt-1 max-w-md italic flex items-center gap-1.5"><FileText size={10} /> {e.notes}</p>}
                            {e.notas && !e.notes && <p className="text-[10px] text-neutral-500 mt-1 max-w-md italic flex items-center gap-1.5"><FileText size={10} /> {e.notas}</p>}
                          </td>
                          <td className="px-5 py-4">
                            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-lg border border-white/5 bg-white/2" style={{ color: cat.color }}>
                              <Icon size={10} />
                              {e.categoria}
                            </span>
                          </td>
                          <td className="px-5 py-4 font-mono text-[10px] text-neutral-400">{e.fecha}</td>
                          <td className="px-5 py-4 text-right font-mono text-xs font-black text-rose-400">
                            -{formatCurrency(e.monto)}
                          </td>
                          <td className="px-5 py-4 text-center">
                            <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => handleOpenEditExpense(e)}
                                className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-white/5 transition-all"
                              >
                                <Edit3 size={13} />
                              </button>
                              <button
                                onClick={() => handleDeleteExpense(e.id)}
                                className="p-2 rounded-lg text-neutral-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="5" className="px-5 py-12 text-center text-xs text-neutral-500 italic">
                        No se encontraron registros de gastos.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ── VISTA 3: SUSCRIPCIONES Y SERVICIOS ──────────────────────────────────── */}
      {activeTab === 'suscripciones' && (
        <div className="flex flex-col gap-6 animate-in fade-in duration-500">
          
          {/* Cabecera Pestaña Sin Sombras */}
          <div className="flex items-center justify-between p-4 rounded-2xl border border-white/5" style={{ backgroundColor: t.bg }}>
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-white mb-1">Suscripciones Activas</h3>
              <p className="text-[10px] text-neutral-400">Gastos recurrentes y servicios fijos registrados ({servicios.length} activos)</p>
            </div>
            <button
              onClick={handleOpenNewService}
              className="px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 transition-all active:scale-95"
              style={{ backgroundColor: t.accent, color: '#000' }}
            >
              <Plus size={14} strokeWidth={3} /> Registrar Suscripción
            </button>
          </div>

          {/* Tabla de Suscripciones y Servicios Sin Sombras */}
          <div className="rounded-2xl border border-white/5 overflow-hidden" style={{ backgroundColor: t.bg }}>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 bg-white/2">
                    <th className="px-5 py-4 text-[9px] font-black uppercase tracking-widest text-neutral-400">Nombre / Soporte</th>
                    <th className="px-5 py-4 text-[9px] font-black uppercase tracking-widest text-neutral-400">Categoría</th>
                    <th className="px-5 py-4 text-[9px] font-black uppercase tracking-widest text-neutral-400">Próximo Pago</th>
                    <th className="px-5 py-4 text-[9px] font-black uppercase tracking-widest text-neutral-400">Periodo</th>
                    <th className="px-5 py-4 text-[9px] font-black uppercase tracking-widest text-neutral-400 text-right">Costo Mensual</th>
                    <th className="px-5 py-4 w-24 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {servicios.length > 0 ? (
                    servicios.map(s => {
                      // Desempaquetar categoria y notas de fallback
                      let catName = s.categoria || 'Streaming';
                      let cleanNotas = s.notas || '';
                      if (s.notas && s.notas.startsWith('[Categoría:')) {
                        const match = s.notas.match(/^\[Categoría:\s*([^\]]+)\]\s*(.*)/);
                        if (match) {
                          catName = match[1];
                          cleanNotas = match[2];
                        }
                      }
                      const sCat = catServicioConfig[catName] || catServicioConfig['Otro'];
                      const SIcon = sCat.icon;
                      const hasExpired = s.fecha_pago && new Date(s.fecha_pago) < new Date();
                      return (
                        <tr 
                          key={s.id}
                          className="border-b border-white/5 hover:bg-white/1 transition-all group"
                        >
                          <td className="px-5 py-4">
                            <p className="text-xs font-semibold text-white">{s.nombre}</p>
                            {s.contacto && <p className="text-[10px] text-neutral-500 mt-1 max-w-md flex items-center gap-1.5"><Mail size={10} /> {s.contacto}</p>}
                            {cleanNotas && <p className="text-[10px] text-neutral-500 mt-1 max-w-md italic flex items-center gap-1.5"><FileText size={10} /> {cleanNotas}</p>}
                          </td>
                          <td className="px-5 py-4">
                            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-lg border border-white/5 bg-white/2" style={{ color: sCat.color }}>
                              <SIcon size={10} />
                              {catName}
                            </span>
                          </td>
                          <td className="px-5 py-4 font-mono text-[10px] text-neutral-400">
                            <span className={hasExpired ? 'text-rose-400 font-bold animate-pulse' : 'text-neutral-200'}>
                              {s.fecha_pago || 'N/A'}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-[10px] text-neutral-300">
                            <span className="capitalize">{s.tipo || 'Mensual'}</span>
                          </td>
                          <td className="px-5 py-4 text-right font-mono text-xs font-black text-rose-400">
                            -{formatCurrency(s.monto)}
                          </td>
                          <td className="px-5 py-4 text-center">
                            <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => handleOpenEditService(s)}
                                className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-white/5 transition-all"
                              >
                                <Edit3 size={13} />
                              </button>
                              <button
                                onClick={() => handleDeleteService(s.id)}
                                className="p-2 rounded-lg text-neutral-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="6" className="px-5 py-12 text-center text-xs text-neutral-500 italic">
                        No se encontraron suscripciones activas.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ── MODAL 1: CONFIGURAR PRESUPUESTOS ──────────────────────────────────── */}
      {isEditingBudgets && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="border border-white/10 rounded-2xl w-full max-w-md p-6 animate-in zoom-in-95 duration-200" style={{ backgroundColor: t.bg }}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-sm font-black uppercase tracking-wider text-white">Presupuestos del Sistema</h3>
              <button onClick={() => setIsEditingBudgets(false)} className="text-neutral-400 hover:text-white transition-colors">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-5 max-h-[60vh] overflow-y-auto pr-1 mac-scrollbar">
              
              {/* Presupuesto General */}
              <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                <label className="text-[9px] font-black uppercase tracking-wider text-neutral-400 display: block mb-2">Presupuesto Mensual General ($)</label>
                <div className="flex items-center gap-2 bg-zinc-950/40 border border-white/5 rounded-xl px-3 py-2">
                  <span className="text-neutral-400 text-xs font-bold">$</span>
                  <input
                    type="number"
                    value={tempMonthlyBudget}
                    onChange={e => setTempMonthlyBudget(parseFloat(e.target.value) || 0)}
                    className="w-full bg-transparent border-none text-xs outline-none text-white font-bold"
                  />
                </div>
              </div>

              {/* Categorías específicas */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-white border-b border-white/5 pb-2">Límites por Categoría ($)</h4>
                {GASTO_CATEGORIAS.map(c => (
                  <div key={c.label} className="flex items-center justify-between gap-4">
                    <span className="text-xs font-bold text-neutral-300 flex items-center gap-2">
                      <c.icon size={12} style={{ color: c.color }} />
                      {c.label}
                    </span>
                    <div className="flex items-center gap-1.5 bg-zinc-950/40 border border-white/5 rounded-xl px-3 py-1.5 w-28">
                      <span className="text-neutral-500 text-[10px] font-bold">$</span>
                      <input
                        type="number"
                        value={tempCategoryBudgets[c.label] || 0}
                        onChange={e => {
                          const val = parseFloat(e.target.value) || 0;
                          setTempCategoryBudgets(prev => ({ ...prev, [c.label]: val }));
                        }}
                        className="w-full bg-transparent border-none text-xs text-right outline-none text-white font-mono"
                      />
                    </div>
                  </div>
                ))}
              </div>

            </div>

            <div className="flex gap-3 pt-6 border-t border-white/5 mt-6">
              <button
                onClick={() => setIsEditingBudgets(false)}
                className="flex-1 py-3 bg-zinc-950/40 border border-white/5 rounded-xl text-[9px] font-black uppercase tracking-widest text-neutral-400 hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveBudget}
                className="flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest hover:opacity-90 transition-opacity"
                style={{ backgroundColor: t.accent, color: '#000' }}
              >
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 2: NUEVO/EDITAR GASTO INDIVIDUAL ─────────────────────────────────── */}
      {showExpenseForm && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="border border-white/10 rounded-2xl w-full max-w-md p-6 animate-in zoom-in-95 duration-200" style={{ backgroundColor: t.bg }}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-sm font-black uppercase tracking-wider text-white">
                {editingExpense ? 'Modificar Gasto' : 'Registrar Gasto'}
              </h3>
              <button onClick={() => { setShowExpenseForm(false); setEditingExpense(null); }} className="text-neutral-400 hover:text-white transition-colors">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4">
              
              <div>
                <label className="text-[8px] font-black uppercase tracking-widest text-neutral-400 display: block mb-2">Descripción *</label>
                <input
                  type="text"
                  value={expenseForm.descripcion}
                  onChange={e => setExpenseForm({...expenseForm, descripcion: e.target.value})}
                  className="w-full bg-zinc-950/40 border border-white/5 rounded-xl px-4 py-2.5 text-xs outline-none text-white focus:border-white/20 transition-all"
                  placeholder="Ej: Suscripción Adobe CC o Pago de crédito"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[8px] font-black uppercase tracking-widest text-neutral-400 display: block mb-2">Monto ($) *</label>
                  <input
                    type="number"
                    value={expenseForm.monto}
                    onChange={e => setExpenseForm({...expenseForm, monto: e.target.value})}
                    className="w-full bg-zinc-950/40 border border-white/5 rounded-xl px-4 py-2.5 text-xs outline-none text-white focus:border-white/20 transition-all font-mono"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="text-[8px] font-black uppercase tracking-widest text-neutral-400 display: block mb-2">Fecha</label>
                  <input
                    type="date"
                    value={expenseForm.fecha}
                    onChange={e => setExpenseForm({...expenseForm, fecha: e.target.value})}
                    className="w-full bg-zinc-950/40 border border-white/5 rounded-xl px-4 py-2.5 text-xs outline-none text-neutral-400 focus:border-white/20 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="text-[8px] font-black uppercase tracking-widest text-neutral-400 display: block mb-2">Categoría</label>
                <select
                  value={expenseForm.categoria}
                  onChange={e => setExpenseForm({...expenseForm, categoria: e.target.value})}
                  className="w-full bg-zinc-950/40 border border-white/5 rounded-xl px-4 py-2.5 text-xs outline-none text-neutral-300 cursor-pointer focus:border-white/20 transition-all"
                >
                  {GASTO_CATEGORIAS.map(c => <option key={c.label} value={c.label}>{c.label}</option>)}
                </select>
              </div>

              <div>
                <label className="text-[8px] font-black uppercase tracking-widest text-neutral-400 display: block mb-2">Notas / Detalles</label>
                <textarea
                  value={expenseForm.notas}
                  onChange={e => setExpenseForm({...expenseForm, notas: e.target.value})}
                  className="w-full bg-zinc-950/40 border border-white/5 rounded-xl px-4 py-2.5 text-xs outline-none text-white focus:border-white/20 transition-all resize-none h-16"
                  placeholder="Detalles opcionales (ej. cuota 3 de 12)..."
                />
              </div>

            </div>

            <div className="flex gap-3 pt-6 border-t border-white/5 mt-6">
              <button
                onClick={() => { setShowExpenseForm(false); setEditingExpense(null); }}
                className="flex-1 py-3 bg-zinc-950/40 border border-white/5 rounded-xl text-[9px] font-black uppercase tracking-widest text-neutral-400 hover:text-white transition-colors"
                disabled={expenseLoading}
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveExpense}
                className="flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                style={{ backgroundColor: t.accent, color: '#000' }}
                disabled={expenseLoading || !expenseForm.descripcion || !expenseForm.monto}
              >
                {expenseLoading ? 'Guardando...' : editingExpense ? 'Guardar Cambios' : 'Registrar Gasto'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 3: NUEVA/EDITAR SUSCRIPCIÓN RECURRENTE ─────────────────────────── */}
      {showServiceForm && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="border border-white/10 rounded-2xl w-full max-w-md p-6 animate-in zoom-in-95 duration-200" style={{ backgroundColor: t.bg }}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-sm font-black uppercase tracking-wider text-white">
                {editingService ? 'Modificar Suscripción' : 'Nueva Suscripción'}
              </h3>
              <button onClick={() => { setShowServiceForm(false); setEditingService(null); }} className="text-neutral-400 hover:text-white transition-colors">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4">
              
              <div>
                <label className="text-[8px] font-black uppercase tracking-widest text-neutral-400 display: block mb-2">Nombre del Servicio *</label>
                <input
                  type="text"
                  value={serviceForm.nombre}
                  onChange={e => setServiceForm({...serviceForm, nombre: e.target.value})}
                  className="w-full bg-zinc-950/40 border border-white/5 rounded-xl px-4 py-2.5 text-xs outline-none text-white focus:border-white/20 transition-all"
                  placeholder="Ej: Netflix, Google Workspace..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[8px] font-black uppercase tracking-widest text-neutral-400 display: block mb-2">Costo Mensual (Bs.) *</label>
                  <input
                    type="number"
                    value={serviceForm.monto}
                    onChange={e => setServiceForm({...serviceForm, monto: e.target.value})}
                    className="w-full bg-zinc-950/40 border border-white/5 rounded-xl px-4 py-2.5 text-xs outline-none text-white focus:border-white/20 transition-all font-mono"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="text-[8px] font-black uppercase tracking-widest text-neutral-400 display: block mb-2">Próxima Fecha de Pago *</label>
                  <input
                    type="date"
                    value={serviceForm.fecha_pago}
                    onChange={e => setServiceForm({...serviceForm, fecha_pago: e.target.value})}
                    className="w-full bg-zinc-950/40 border border-white/5 rounded-xl px-4 py-2.5 text-xs outline-none text-neutral-400 focus:border-white/20 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[8px] font-black uppercase tracking-widest text-neutral-400 display: block mb-2">Frecuencia / Tipo</label>
                  <select
                    value={serviceForm.tipo}
                    onChange={e => setServiceForm({...serviceForm, tipo: e.target.value})}
                    className="w-full bg-zinc-950/40 border border-white/5 rounded-xl px-4 py-2.5 text-xs outline-none text-neutral-300 cursor-pointer focus:border-white/20 transition-all"
                  >
                    <option value="Mensual">Mensual</option>
                    <option value="Bimestral">Bimestral</option>
                    <option value="Trimestral">Trimestral</option>
                    <option value="Semestral">Semestral</option>
                    <option value="Anual">Anual</option>
                    <option value="Único">Pago Único</option>
                  </select>
                </div>
                <div>
                  <label className="text-[8px] font-black uppercase tracking-widest text-neutral-400 display: block mb-2">Método de Pago</label>
                  <select
                    value={serviceForm.metodo}
                    onChange={e => setServiceForm({...serviceForm, metodo: e.target.value})}
                    className="w-full bg-zinc-950/40 border border-white/5 rounded-xl px-4 py-2.5 text-xs outline-none text-neutral-300 cursor-pointer focus:border-white/20 transition-all"
                  >
                    <option value="Tarjeta">Tarjeta de Crédito/Débito</option>
                    <option value="Banco">Transferencia Bancaria</option>
                    <option value="Efectivo">Efectivo</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[8px] font-black uppercase tracking-widest text-neutral-400 display: block mb-2">Categoría del Servicio</label>
                <select
                  value={serviceForm.categoria}
                  onChange={e => setServiceForm({...serviceForm, categoria: e.target.value})}
                  className="w-full bg-zinc-950/40 border border-white/5 rounded-xl px-4 py-2.5 text-xs outline-none text-neutral-300 cursor-pointer focus:border-white/20 transition-all"
                >
                  {SERVICIO_CATEGORIAS.map(c => <option key={c.label} value={c.label}>{c.label}</option>)}
                </select>
              </div>

              <div>
                <label className="text-[8px] font-black uppercase tracking-widest text-neutral-400 display: block mb-2">Contacto / Soporte</label>
                <input
                  type="text"
                  value={serviceForm.contacto}
                  onChange={e => setServiceForm({...serviceForm, contacto: e.target.value})}
                  className="w-full bg-zinc-950/40 border border-white/5 rounded-xl px-4 py-2.5 text-xs outline-none text-white focus:border-white/20 transition-all"
                  placeholder="Ej: Correo, Teléfono de soporte o URL"
                />
              </div>

              <div>
                <label className="text-[8px] font-black uppercase tracking-widest text-neutral-400 display: block mb-2">Notas / Enlaces</label>
                <textarea
                  value={serviceForm.notas}
                  onChange={e => setServiceForm({...serviceForm, notas: e.target.value})}
                  className="w-full bg-zinc-950/40 border border-white/5 rounded-xl px-4 py-2.5 text-xs outline-none text-white focus:border-white/20 transition-all resize-none h-16"
                  placeholder="Credenciales de acceso, links de cobro..."
                />
              </div>

            </div>

            <div className="flex gap-3 pt-6 border-t border-white/5 mt-6">
              <button
                onClick={() => { setShowServiceForm(false); setEditingService(null); }}
                className="flex-1 py-3 bg-zinc-950/40 border border-white/5 rounded-xl text-[9px] font-black uppercase tracking-widest text-neutral-400 hover:text-white transition-colors"
                disabled={serviceLoading}
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveService}
                className="flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                style={{ backgroundColor: t.accent, color: '#000' }}
                disabled={serviceLoading || !serviceForm.nombre || !serviceForm.monto || !serviceForm.fecha_pago}
              >
                {serviceLoading ? 'Guardando...' : editingService ? 'Guardar Cambios' : 'Registrar Servicio'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default MisEgresos;
