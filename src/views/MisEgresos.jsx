import React, { useState, useMemo, useEffect } from 'react';
import { 
  Plus, Trash2, CreditCard, ArrowDownRight, Tag, Coffee, Wrench, Wifi, User, 
  ShoppingCart, Calendar, Edit3, Save, X, Search, FileText, 
  AlertTriangle, TrendingUp, DollarSign, Activity,
  Filter, Landmark, Sparkles, Check, Megaphone, 
  HelpCircle, Video, Cloud, Bookmark, Clock, PlusCircle, MinusCircle, RefreshCw, ChevronRight
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { getTheme, useTheme } from '../lib/theme';

// Categorías para suscripciones / servicios
const SERVICIO_CATEGORIAS = [
  { label: 'Streaming', icon: Video, color: '#f472b6' },
  { label: 'Cloud / Almacenamiento', icon: Cloud, color: '#38bdf8' },
  { label: 'Inteligencia Artificial', icon: Sparkles, color: '#a78bfa' },
  { label: 'Internet / Telecomunicaciones', icon: Wifi, color: '#60a5fa' },
  { label: 'Marketing / Anuncios', icon: Megaphone, color: '#fb923c' },
  { label: 'Servicio Básico (Luz/Agua)', icon: Landmark, color: '#f87171' },
  { label: 'Financiero / Crédito', icon: CreditCard, color: '#4ade80' },
  { label: 'Otro', icon: HelpCircle, color: '#64748b' }
];

const catServicioConfig = Object.fromEntries(SERVICIO_CATEGORIAS.map(c => [c.label, c]));

const MisEgresos = ({ data, setData, servicios = [], setServicios, onRefresh, isDark = true, settings }) => {
  const t = useTheme(isDark);
  const isMobile = settings?.isMobileMode;
  
  // Listas locales sincronizadas de props
  const egresos = data?.egresos || [];
  const activeServicios = servicios || [];

  // Pestaña activa
  const [activeTab, setActiveTab] = useState('pagos'); // 'pagos' | 'historial'

  // Estados locales para formularios y modales de SUSCRIPCIONES
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
    contribuciones: [] // [{ id, nombre, monto }]
  });

  // Estados locales para modales de EDICIÓN DE EGRESOS HISTÓRICOS
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenseLoading, setExpenseLoading] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [expenseForm, setExpenseForm] = useState({
    descripcion: '',
    monto: '',
    categoria: 'Servicio',
    fecha: new Date().toISOString().split('T')[0]
  });

  // Estado para registro rápido de gasto manual en Dashboard
  const [quickExpense, setQuickExpense] = useState({
    descripcion: '',
    monto: '',
    categoria: 'Servicio',
    fecha: new Date().toISOString().split('T')[0]
  });
  const [quickLoading, setQuickLoading] = useState(false);

  // Filtros y búsquedas para el Historial Completo
  const [historySearch, setHistorySearch] = useState('');
  const [historyCategory, setHistoryCategory] = useState('Todas');
  const [historyStartDate, setHistoryStartDate] = useState('');
  const [historyEndDate, setHistoryEndDate] = useState('');

  // ── CONTRIBUCIONES DINÁMICAS (CO-PAGADORES) ───────────────────
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
        if (c.id === id) {
          return { ...c, [key]: val };
        }
        return c;
      })
    }));
  };

  // Cálculo de coste neto de la suscripción actual en formulario
  const computedNetCost = useMemo(() => {
    const total = parseFloat(serviceForm.monto) || 0;
    const contributorsSum = serviceForm.contribuciones.reduce((acc, c) => acc + (parseFloat(c.monto) || 0), 0);
    return Math.max(total - contributorsSum, 0);
  }, [serviceForm.monto, serviceForm.contribuciones]);

  // ── RESUMEN FINANCIERO DEL MES ────────────────────────────────
  const ahora = new Date();
  const mesActual = ahora.getMonth();
  const anioActual = ahora.getFullYear();

  // Egresos manuales y recurrentes facturados este mes
  const egresosMesActual = useMemo(() => {
    return egresos.filter(e => {
      const f = new Date(e.fecha || e.created_at);
      return f.getMonth() === mesActual && f.getFullYear() === anioActual;
    });
  }, [egresos, mesActual, anioActual]);

  const totalEgresosMes = useMemo(() => {
    return egresosMesActual.reduce((acc, e) => acc + (parseFloat(e.monto) || 0), 0);
  }, [egresosMesActual]);

  // Sumatorio de aportes externos proyectados
  const totalAportesProyectados = useMemo(() => {
    return activeServicios.reduce((acc, s) => {
      const contribs = Array.isArray(s.contribuciones) ? s.contribuciones : [];
      const sum = contribs.reduce((sumAcc, c) => sumAcc + (parseFloat(c.monto) || 0), 0);
      return acc + sum;
    }, 0);
  }, [activeServicios]);

  // Servicios pendientes de pago este mes o atrasados
  const serviciosPendientes = useMemo(() => {
    return activeServicios.filter(s => {
      const f = new Date(s.fecha_pago);
      const limite = new Date(anioActual, mesActual + 1, 0); // último día del mes
      return f <= limite;
    });
  }, [activeServicios, mesActual, anioActual]);

  const totalPendienteMes = useMemo(() => {
    return serviciosPendientes.reduce((acc, s) => {
      const total = parseFloat(s.monto) || 0;
      const contribs = Array.isArray(s.contribuciones) ? s.contribuciones : [];
      const sumContribs = contribs.reduce((sumAcc, c) => sumAcc + (parseFloat(c.monto) || 0), 0);
      const net = Math.max(total - sumContribs, 0);
      return acc + net;
    }, 0);
  }, [serviciosPendientes]);

  // ── ESTADOS DE PAGO DINÁMICOS Y PRECISOS (MESES DE ATRASO) ──────
  const getEstadoPago = (fechaPagoStr) => {
    if (!fechaPagoStr) return { label: 'Sin Fecha', color: '#737373', bg: 'rgba(115, 115, 115, 0.1)', status: 'ok' };
    
    const hoy = new Date();
    hoy.setHours(0,0,0,0);
    const vencimiento = new Date(fechaPagoStr);
    vencimiento.setHours(0,0,0,0);

    // Calcular diferencia exacta de meses
    const yearDiff = vencimiento.getFullYear() - hoy.getFullYear();
    const monthDiff = vencimiento.getMonth() - hoy.getMonth();
    const totalMonthsDiff = yearDiff * 12 + monthDiff;

    if (totalMonthsDiff > 0) {
      return { label: 'Al día', color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)', status: 'ok' };
    } else if (totalMonthsDiff === 0) {
      // Vence en el mes actual
      const hoyDia = hoy.getDate();
      const vencDia = vencimiento.getDate() + 1; // Ajuste timezone estándar
      if (vencDia < hoyDia) {
        return { label: 'Atrasado (Venció este mes)', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', status: 'overdue' };
      }
      if (vencDia === hoyDia) {
        return { label: 'Vence hoy', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)', status: 'today' };
      }
      return { label: 'Pendiente este mes', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.1)', status: 'pending' };
    } else {
      // Vencido por meses anteriores
      const mesesAtrasados = Math.abs(totalMonthsDiff);
      return { 
        label: `Atrasado (${mesesAtrasados} ${mesesAtrasados === 1 ? 'mes' : 'meses'})`, 
        color: '#ef4444', 
        bg: 'rgba(239, 68, 68, 0.15)', 
        status: 'overdue' 
      };
    }
  };

  // ── FILTRADO DE HISTORIAL DE EGRESOS ──────────────────────────
  const filteredEgresos = useMemo(() => {
    return egresos.filter(e => {
      // Búsqueda de concepto
      const matchSearch = e.descripcion.toLowerCase().includes(historySearch.toLowerCase());
      
      // Categoría
      const matchCat = historyCategory === 'Todas' || e.categoria === historyCategory;

      // Fechas
      let matchDate = true;
      if (historyStartDate) {
        matchDate = matchDate && (e.fecha || e.created_at) >= historyStartDate;
      }
      if (historyEndDate) {
        matchDate = matchDate && (e.fecha || e.created_at) <= historyEndDate;
      }

      return matchSearch && matchCat && matchDate;
    }).sort((a, b) => new Date(b.fecha || b.created_at) - new Date(a.fecha || a.created_at));
  }, [egresos, historySearch, historyCategory, historyStartDate, historyEndDate]);

  // ── ACCIONES BASE DE DATOS ────────────────────────────────────

  // Abrir modal de creación de suscripción
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

  // Abrir modal de edición de suscripción
  const handleOpenEditService = (service) => {
    setEditingService(service);
    setServiceForm({
      nombre: service.nombre || '',
      monto: service.monto || '',
      fecha_pago: service.fecha_pago || '',
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

  // Guardar suscripción
  const handleSaveService = async (e) => {
    e.preventDefault();
    if (!serviceForm.nombre || !serviceForm.monto || !serviceForm.fecha_pago) return;
    setServiceLoading(true);

    const payload = {
      nombre: serviceForm.nombre,
      monto: parseFloat(serviceForm.monto) || 0,
      fecha_pago: serviceForm.fecha_pago,
      metodo: serviceForm.metodo,
      categoria: serviceForm.categoria,
      tipo: serviceForm.tipo,
      notas: serviceForm.notas,
      contribuciones: serviceForm.contribuciones.map(c => ({
        nombre: c.nombre,
        monto: parseFloat(c.monto) || 0
      }))
    };

    try {
      if (editingService) {
        const { error } = await supabase
          .from('servicios')
          .update(payload)
          .eq('id', editingService.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('servicios')
          .insert([{ ...payload, id: crypto.randomUUID() }]);
        if (error) throw error;
      }

      setShowServiceModal(false);
      if (onRefresh) await onRefresh();
    } catch (err) {
      alert("Error al guardar el servicio: " + err.message);
    } finally {
      setServiceLoading(false);
    }
  };

  // Registrar pago de suscripción
  const handlePayServiceClick = async (service) => {
    try {
      const hoy = new Date();
      const fechaHoyStr = hoy.toISOString().split('T')[0];

      // Cálculo coste neto real
      const total = parseFloat(service.monto) || 0;
      const contribs = Array.isArray(service.contribuciones) ? service.contribuciones : [];
      const sumContribs = contribs.reduce((acc, c) => acc + (parseFloat(c.monto) || 0), 0);
      const costoNeto = Math.max(total - sumContribs, 0);

      const nombresContribs = contribs.map(c => `${c.nombre} (+${c.monto} Bs)`).join(', ');
      const descPago = `Pago: ${service.nombre}` + (nombresContribs ? ` (Aportes de: ${nombresContribs})` : '');

      // 1. Insertar en Egresos
      const { error: egresoError } = await supabase
        .from('egresos')
        .insert([{
          id: crypto.randomUUID(),
          monto: costoNeto,
          categoria: 'Suscripción',
          descripcion: descPago,
          fecha: fechaHoyStr
        }]);

      if (egresoError) throw egresoError;

      // 2. Avanzar fecha de vencimiento 1 mes
      const fechaPagoActual = new Date(service.fecha_pago || fechaHoyStr);
      fechaPagoActual.setMonth(fechaPagoActual.getMonth() + 1);
      const siguienteFechaPago = fechaPagoActual.toISOString().split('T')[0];

      const { error: servicioError } = await supabase
        .from('servicios')
        .update({ fecha_pago: siguienteFechaPago })
        .eq('id', service.id);

      if (servicioError) throw servicioError;

      if (onRefresh) await onRefresh();
    } catch (err) {
      alert("Error al registrar pago: " + err.message);
    }
  };

  // Guardar egreso editado en el historial
  const handleSaveExpense = async (e) => {
    e.preventDefault();
    if (!expenseForm.descripcion || !expenseForm.monto) return;
    setExpenseLoading(true);

    try {
      const { error } = await supabase
        .from('egresos')
        .update({
          descripcion: expenseForm.descripcion,
          monto: parseFloat(expenseForm.monto) || 0,
          categoria: expenseForm.categoria,
          fecha: expenseForm.fecha
        })
        .eq('id', editingExpense.id);

      if (error) throw error;
      setShowExpenseModal(false);
      if (onRefresh) await onRefresh();
    } catch (err) {
      alert("Error al editar el egreso: " + err.message);
    } finally {
      setExpenseLoading(false);
    }
  };

  // Abrir modal de edición de egreso
  const handleOpenEditExpense = (expense) => {
    setEditingExpense(expense);
    setExpenseForm({
      descripcion: expense.descripcion || '',
      monto: expense.monto || '',
      categoria: expense.categoria || 'Servicio',
      fecha: expense.fecha || new Date().toISOString().split('T')[0]
    });
    setShowExpenseModal(true);
  };

  // Eliminar servicio
  const handleDeleteService = async (id) => {
    if (!window.confirm("¿Seguro que deseas eliminar esta suscripción?")) return;
    try {
      const { error } = await supabase
        .from('servicios')
        .delete()
        .eq('id', id);
      if (error) throw error;
      if (onRefresh) await onRefresh();
    } catch (err) {
      alert("Error al eliminar servicio: " + err.message);
    }
  };

  // Registrar egreso rápido manual
  const handleSaveQuickExpense = async (e) => {
    e.preventDefault();
    if (!quickExpense.descripcion || !quickExpense.monto) return;
    setQuickLoading(true);
    try {
      const { error } = await supabase
        .from('egresos')
        .insert([{
          id: crypto.randomUUID(),
          descripcion: quickExpense.descripcion,
          monto: parseFloat(quickExpense.monto) || 0,
          categoria: quickExpense.categoria,
          fecha: quickExpense.fecha
        }]);
      if (error) throw error;
      
      setQuickExpense({
        descripcion: '',
        monto: '',
        categoria: 'Servicio',
        fecha: new Date().toISOString().split('T')[0]
      });

      if (onRefresh) await onRefresh();
    } catch (err) {
      alert("Error al registrar egreso manual: " + err.message);
    } finally {
      setQuickLoading(false);
    }
  };

  // Eliminar un egreso
  const handleDeleteExpense = async (id) => {
    if (!window.confirm("¿Deseas eliminar este registro de egreso?")) return;
    try {
      const { error } = await supabase
        .from('egresos')
        .delete()
        .eq('id', id);
      if (error) throw error;
      if (onRefresh) await onRefresh();
    } catch (err) {
      alert("Error al eliminar egreso: " + err.message);
    }
  };

  return (
    <div className="flex flex-col h-full w-full select-none animate-in fade-in duration-300" style={{ color: t.text, fontFamily: "'Geist', sans-serif" }}>
      
      {/* ── CABECERA & CONTROLES ────────────────────────────────────────────── */}
      <header className="mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Mis Egresos y Suscripciones
            </h2>
            <p className="text-neutral-500 text-[10px] uppercase font-bold tracking-wider mt-1">
              Control simplificado de pagos mensuales y compartidos
            </p>
          </div>
          
          {/* Segmented Tab Control */}
          <div className="flex bg-white/5 border border-white/10 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('pagos')}
              className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${activeTab === 'pagos' ? 'bg-white text-black' : 'text-neutral-400 hover:text-white'}`}
            >
              Control de Pagos
            </button>
            <button
              onClick={() => setActiveTab('historial')}
              className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${activeTab === 'historial' ? 'bg-white text-black' : 'text-neutral-400 hover:text-white'}`}
            >
              Historial Completo
            </button>
          </div>
        </div>

        {/* ── RESUMEN FINANCIERO DEL MES (Visible en ambas pestañas) ────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl border" style={{ backgroundColor: t.panel, borderColor: t.border }}>
            <span className="text-[9px] uppercase font-bold tracking-widest text-neutral-500 block mb-1">Egresos de este Mes</span>
            <h3 className="text-2xl font-black">{totalEgresosMes.toLocaleString()} <span className="text-xs font-bold text-neutral-500">Bs.</span></h3>
            <span className="text-[9px] text-neutral-400 mt-1 block">Gastos registrados hasta hoy</span>
          </div>
          <div className="p-5 rounded-2xl border" style={{ backgroundColor: t.panel, borderColor: t.border }}>
            <span className="text-[9px] uppercase font-bold tracking-widest text-neutral-500 block mb-1">Pendiente del Mes (Vencidos/Hoy)</span>
            <h3 className="text-2xl font-black text-amber-500">{totalPendienteMes.toLocaleString()} <span className="text-xs font-bold text-amber-500/80">Bs.</span></h3>
            <span className="text-[9px] text-neutral-400 mt-1 block">Importe neto que te corresponde pagar</span>
          </div>
          <div className="p-5 rounded-2xl border" style={{ backgroundColor: t.panel, borderColor: t.border }}>
            <span className="text-[9px] uppercase font-bold tracking-widest text-neutral-500 block mb-1">Aportes / Co-pagos Proyectados</span>
            <h3 className="text-2xl font-black text-emerald-500">+{totalAportesProyectados.toLocaleString()} <span className="text-xs font-bold text-emerald-500/80">Bs.</span></h3>
            <span className="text-[9px] text-neutral-400 mt-1 block">Abonos recibidos de terceros</span>
          </div>
        </div>
      </header>

      {/* ── SECCIÓN 1: PAGO Y CONTROL DE SUSCRIPCIONES ─────────────────────── */}
      {activeTab === 'pagos' && (
        <div className={`grid gap-6 ${isMobile ? 'grid-cols-1' : 'grid-cols-12'}`}>
          
          {/* Column Izquierda: Servicios */}
          <div className={`${isMobile ? '' : 'col-span-8'} space-y-4`}>
            <div className="p-5 rounded-2xl border" style={{ backgroundColor: t.panel, borderColor: t.border }}>
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-[10px] uppercase font-bold tracking-widest text-neutral-400 flex items-center gap-2">
                  <Bookmark size={14} className="text-neutral-500" /> Servicios Activos
                </h4>
                <button 
                  onClick={handleOpenNewService} 
                  className="flex items-center gap-1 bg-white/5 border border-white/10 text-white font-bold uppercase text-[9px] tracking-widest px-3 py-1.5 rounded-lg hover:bg-white/10 transition-all"
                >
                  <Plus size={10} strokeWidth={3} /> Añadir Servicio
                </button>
              </div>

              {activeServicios.length === 0 ? (
                <div className="py-12 text-center text-neutral-500 text-xs font-semibold">
                  No tienes servicios registrados aún.
                </div>
              ) : (
                <div className="space-y-3">
                  {activeServicios.map(s => {
                    const cat = catServicioConfig[s.categoria] || { icon: HelpCircle, color: '#64748b' };
                    const IconComp = cat.icon;
                    
                    // Cálculo preciso del estado y meses de atraso
                    const venc = getEstadoPago(s.fecha_pago);

                    const contribs = Array.isArray(s.contribuciones) ? s.contribuciones : [];
                    const sumContribs = contribs.reduce((acc, c) => acc + (parseFloat(c.monto) || 0), 0);
                    const neto = Math.max((parseFloat(s.monto) || 0) - sumContribs, 0);

                    return (
                      <div key={s.id} className="p-4 rounded-xl border flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all duration-200 hover:border-white/10" style={{ backgroundColor: 'rgba(255,255,255,0.01)', borderColor: t.border }}>
                        
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${cat.color}15`, color: cat.color }}>
                            <IconComp size={20} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h5 className="text-xs font-bold text-white truncate max-w-[200px]">{s.nombre}</h5>
                              <span className="text-[8px] uppercase font-black px-2 py-0.5 rounded-full" style={{ backgroundColor: venc.bg, color: venc.color }}>
                                {venc.label}
                              </span>
                            </div>
                            <p className="text-[10px] text-neutral-500 mt-1 truncate">
                              Pago: {s.tipo} · Vence el {s.fecha_pago || 'Sin fecha'} {s.notas ? `· ${s.notas}` : ''}
                            </p>
                            {contribs.length > 0 && (
                              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                                <span className="text-[8px] font-black uppercase text-neutral-400 bg-white/5 px-2 py-0.5 rounded-md">Compartido</span>
                                {contribs.map((c, i) => (
                                  <span key={i} className="text-[8px] font-semibold text-neutral-500 bg-white/2 px-1.5 py-0.5 rounded-md">
                                    {c.nombre}: {c.monto} Bs.
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Costos y Acciones rápidas */}
                        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-white/5">
                          
                          <div className="text-right">
                            <span className="text-[8px] uppercase font-black text-neutral-500 block">Total: {parseFloat(s.monto).toLocaleString()} Bs.</span>
                            <span className="text-xs font-bold text-white block">{neto.toLocaleString()} <span className="text-[9px] text-neutral-400 font-semibold">Bs. neto</span></span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handlePayServiceClick(s)}
                              title="Marcar pago de este mes"
                              className="px-3 h-8 rounded-lg bg-emerald-500 text-black text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 hover:opacity-90 active:scale-95 transition-all shadow-md"
                            >
                              <Check size={12} strokeWidth={3} /> Pagar
                            </button>
                            <button
                              onClick={() => handleOpenEditService(s)}
                              title="Editar servicio"
                              className="w-8 h-8 rounded-lg bg-white/5 text-neutral-400 border border-white/10 flex items-center justify-center hover:bg-white/10 hover:text-white transition-all"
                            >
                              <Edit3 size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteService(s.id)}
                              title="Eliminar"
                              className="w-8 h-8 rounded-lg bg-red-500/10 text-red-500 border border-red-500/20 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all"
                            >
                              <Trash2 size={14} />
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

          {/* Column Derecha: Registro Rápido */}
          <div className={`${isMobile ? '' : 'col-span-4'} space-y-4`}>
            <div className="p-5 rounded-2xl border" style={{ backgroundColor: t.panel, borderColor: t.border }}>
              <h4 className="text-[10px] uppercase font-bold tracking-widest text-neutral-400 mb-4 flex items-center gap-2">
                <PlusCircle size={14} className="text-neutral-500" /> Registro Rápido
              </h4>

              <form onSubmit={handleSaveQuickExpense} className="space-y-3">
                <div>
                  <input 
                    type="text" 
                    value={quickExpense.descripcion}
                    onChange={e => setQuickExpense(prev => ({ ...prev, descripcion: e.target.value }))}
                    placeholder="¿En qué gastaste? (Ej. Netflix, Taxi)"
                    className="w-full text-xs"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input 
                    type="number" 
                    value={quickExpense.monto}
                    onChange={e => setQuickExpense(prev => ({ ...prev, monto: e.target.value }))}
                    placeholder="Monto (Bs)"
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
                    <option value="Personal">Personal</option>
                    <option value="Compra">Compra</option>
                    <option value="Alimentación">Alimentación</option>
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
                  className="w-full py-3 bg-white text-black font-black uppercase text-[10px] tracking-widest rounded-xl hover:opacity-90 active:scale-95 transition-all shadow-md flex justify-center items-center gap-2"
                >
                  {quickLoading ? <RefreshCw size={12} className="animate-spin" /> : <Save size={12} />} Registrar Egreso
                </button>
              </form>
            </div>
            
            {/* Vista Previa del Historial */}
            <div className="p-5 rounded-2xl border" style={{ backgroundColor: t.panel, borderColor: t.border }}>
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-[10px] uppercase font-bold tracking-widest text-neutral-400 flex items-center gap-2">
                  <Clock size={14} className="text-neutral-500" /> Egresos Recientes
                </h4>
                <button 
                  onClick={() => setActiveTab('historial')}
                  className="text-[9px] font-black uppercase text-neutral-400 hover:text-white flex items-center gap-0.5 transition-all"
                >
                  Ver Todo <ChevronRight size={10} />
                </button>
              </div>

              {egresos.length === 0 ? (
                <div className="text-center py-6 text-neutral-500 text-[10px] font-semibold">
                  No hay egresos recientes.
                </div>
              ) : (
                <div className="space-y-2">
                  {egresos.slice(0, 4).map(e => (
                    <div key={e.id} className="p-3 rounded-xl border flex justify-between items-center gap-3 bg-white/[0.01]" style={{ borderColor: t.border }}>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-bold text-white truncate">{e.descripcion}</p>
                        <p className="text-[9px] text-neutral-500 mt-0.5">{e.categoria} · {e.fecha}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-[11px] font-black text-red-400">-{parseFloat(e.monto).toLocaleString()} Bs.</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      )}

      {/* ── SECCIÓN 2: HISTORIAL DE EGRESOS COMPLETO (CRUD) ───────────────── */}
      {activeTab === 'historial' && (
        <div className="p-5 rounded-2xl border space-y-4" style={{ backgroundColor: t.panel, borderColor: t.border }}>
          
          {/* Barra de Filtros */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {/* Buscador */}
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
            
            {/* Categoría */}
            <div>
              <select
                value={historyCategory}
                onChange={e => setHistoryCategory(e.target.value)}
                className="w-full text-xs"
              >
                <option value="Todas">Todas las categorías</option>
                <option value="Servicio">Servicio</option>
                <option value="Suscripción">Suscripción</option>
                <option value="Personal">Personal</option>
                <option value="Compra">Compra</option>
                <option value="Alimentación">Alimentación</option>
                <option value="Otro">Otro</option>
              </select>
            </div>

            {/* Fecha Inicio */}
            <div className="flex items-center gap-2">
              <span className="text-[9px] uppercase font-bold text-neutral-500">Desde:</span>
              <input
                type="date"
                value={historyStartDate}
                onChange={e => setHistoryStartDate(e.target.value)}
                className="flex-1 text-xs"
              />
            </div>

            {/* Fecha Fin */}
            <div className="flex items-center gap-2">
              <span className="text-[9px] uppercase font-bold text-neutral-500">Hasta:</span>
              <input
                type="date"
                value={historyEndDate}
                onChange={e => setHistoryEndDate(e.target.value)}
                className="flex-1 text-xs"
              />
            </div>
          </div>

          {/* Tabla / Lista de Egresos */}
          <div className="overflow-x-auto">
            {filteredEgresos.length === 0 ? (
              <div className="text-center py-12 text-neutral-500 text-xs font-semibold">
                No se encontraron egresos con los filtros seleccionados.
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b text-[9px] uppercase font-black text-neutral-400 tracking-widest" style={{ borderColor: t.border }}>
                    <th className="py-3 px-2">Fecha</th>
                    <th className="py-3 px-2">Concepto</th>
                    <th className="py-3 px-2">Categoría</th>
                    <th className="py-3 px-2 text-right">Monto</th>
                    <th className="py-3 px-2 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredEgresos.map(e => (
                    <tr key={e.id} className="hover:bg-white/[0.01] transition-all text-xs">
                      <td className="py-3.5 px-2 text-neutral-400 whitespace-nowrap">{e.fecha}</td>
                      <td className="py-3.5 px-2 font-bold text-white max-w-[300px] truncate" title={e.descripcion}>
                        {e.descripcion}
                      </td>
                      <td className="py-3.5 px-2">
                        <span className="px-2 py-0.5 bg-white/5 border border-white/10 rounded-md text-[10px] text-neutral-300">
                          {e.categoria}
                        </span>
                      </td>
                      <td className="py-3.5 px-2 text-right font-black text-red-400 whitespace-nowrap">
                        -{parseFloat(e.monto).toLocaleString('es-BO', { minimumFractionDigits: 2 })} Bs.
                      </td>
                      <td className="py-3.5 px-2 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleOpenEditExpense(e)}
                            className="p-1.5 rounded bg-white/5 text-neutral-400 hover:text-white transition-all"
                            title="Editar registro"
                          >
                            <Edit3 size={12} />
                          </button>
                          <button
                            onClick={() => handleDeleteExpense(e.id)}
                            className="p-1.5 rounded bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all"
                            title="Eliminar"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ── MODAL NUEVO / EDITAR SERVICIO (SUSCRIPCIÓN) ────────────────────── */}
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

            <form onSubmit={handleSaveService} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto mac-scrollbar">
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] font-bold uppercase tracking-widest text-neutral-400 block mb-1.5">Nombre del Servicio</label>
                  <input 
                    type="text" 
                    value={serviceForm.nombre}
                    onChange={e => setServiceForm(prev => ({ ...prev, nombre: e.target.value }))}
                    placeholder="Ej. Google One"
                    className="w-full text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="text-[9px] font-bold uppercase tracking-widest text-neutral-400 block mb-1.5">Costo Mensual Total (Bs)</label>
                  <input 
                    type="number" 
                    value={serviceForm.monto}
                    onChange={e => setServiceForm(prev => ({ ...prev, monto: e.target.value }))}
                    placeholder="Ej. 20"
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
                    className="text-[8px] font-black uppercase tracking-widest bg-white/5 border border-white/10 px-2.5 py-1 rounded-md text-white hover:bg-white/10 transition-all"
                  >
                    + Agregar Persona
                  </button>
                </div>

                {serviceForm.contribuciones.length === 0 ? (
                  <p className="text-[10px] text-neutral-500 italic py-2">
                    Este servicio lo pagas tú solo en su totalidad.
                  </p>
                ) : (
                  <div className="space-y-2 mb-3">
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
                          placeholder="Aporte (Bs)" 
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
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl flex justify-between items-center mt-2">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-neutral-500">Monto Neto para Ti:</span>
                  <span className="text-xs font-black text-emerald-400">{computedNetCost.toLocaleString()} Bs.</span>
                </div>
              </div>

              <div>
                <label className="text-[9px] font-bold uppercase tracking-widest text-neutral-400 block mb-1.5">Notas adicionales</label>
                <textarea 
                  value={serviceForm.notas}
                  onChange={e => setServiceForm(prev => ({ ...prev, notas: e.target.value }))}
                  placeholder="Detalles o claves del grupo..."
                  className="w-full h-16 text-xs resize-none"
                />
              </div>

              <div className="flex gap-2 pt-4 border-t border-white/5">
                <button 
                  type="submit" 
                  disabled={serviceLoading}
                  className="flex-1 py-3 bg-white text-black font-black uppercase text-[10px] tracking-widest rounded-xl hover:opacity-90 active:scale-95 transition-all shadow-md flex justify-center items-center gap-2"
                >
                  {serviceLoading ? <RefreshCw size={12} className="animate-spin" /> : <Save size={12} />} Guardar Suscripción
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowServiceModal(false)}
                  className="px-6 py-3 bg-white/5 text-neutral-400 font-bold uppercase text-[10px] tracking-widest rounded-xl hover:bg-white/10 hover:text-white transition-all"
                >
                  Cancelar
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ── MODAL EDITAR EGRESO HISTÓRICO ─────────────────────────────────── */}
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
                  <label className="text-[9px] font-bold uppercase tracking-widest text-neutral-400 block mb-1.5">Monto (Bs)</label>
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
                    <option value="Personal">Personal</option>
                    <option value="Compra">Compra</option>
                    <option value="Alimentación">Alimentación</option>
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
                  className="flex-1 py-3 bg-white text-black font-black uppercase text-[10px] tracking-widest rounded-xl hover:opacity-90 active:scale-95 transition-all shadow-md flex justify-center items-center gap-2"
                >
                  {expenseLoading ? <RefreshCw size={12} className="animate-spin" /> : <Save size={12} />} Actualizar Egreso
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowExpenseModal(false)}
                  className="px-6 py-3 bg-white/5 text-neutral-400 font-bold uppercase text-[10px] tracking-widest rounded-xl hover:bg-white/10 hover:text-white transition-all"
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
