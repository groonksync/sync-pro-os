import React, { useState, useMemo, useEffect } from 'react';
import { 
  Plus, Trash2, CreditCard, ArrowDownRight, Tag, Coffee, Wrench, Wifi, User, 
  ShoppingCart, Calendar, Edit3, Save, X, Search, Mail, Phone, FileText, 
  AlertTriangle, TrendingUp, TrendingDown, Layers, Settings, DollarSign, Activity,
  Sliders, Filter, Landmark, Banknote, AlertCircle, Sparkles, Check, Megaphone, 
  HelpCircle, Video, Cloud, Music, Palette, Scissors, Bookmark, Clock
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { getTheme, useTheme } from '../lib/theme';
import { createCalendarEvent, updateCalendarEvent, deleteCalendarEvent } from '../lib/googleApi';
import { generarCronograma, generarCronogramaDiario } from '../hooks/useAmortizacion';

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

const MisEgresos = ({ data, setData, servicios = [], setServicios, onRefresh, isDark = true, initialFilterText = '', token }) => {
  const t = useTheme(isDark);

  // Auxiliares de Google Calendar
  const parseGoogleEventId = (text) => {
    if (!text) return null;
    const match = text.match(/\[google_event_id:\s*([^\]]+)\]/);
    return match ? match[1].trim() : null;
  };

  const serializeGoogleEventId = (text, eventId) => {
    const clean = text ? text.replace(/\[google_event_id:\s*[^\]]+\]/, '').trim() : '';
    if (!eventId) return clean;
    return `${clean}\n\n[google_event_id: ${eventId}]`.trim();
  };

  const syncExpenseToCalendar = async (expense, token) => {
    if (!token || !expense) return null;
    try {
      const existingEventId = parseGoogleEventId(expense.notas);
      const eventData = {
        summary: `❌ Egreso: ${expense.descripcion} — ${expense.monto} BOB`,
        description: `--- EGRESO PROGRAMADO ---\nConcepto: ${expense.descripcion}\nMonto: ${expense.monto} BOB\nCategoría: ${expense.categoria}\nNotas: ${expense.notas ? expense.notas.replace(/\[google_event_id:\s*[^\]]+\]/, '').trim() : '---'}`,
        start: { date: expense.fecha },
        end: { date: new Date(new Date(expense.fecha).getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0] }
      };
      
      if (existingEventId) {
        try {
          await updateCalendarEvent(token, existingEventId, eventData);
          return existingEventId;
        } catch (err) {
          console.warn("Could not update event, creating new one:", err);
          const res = await createCalendarEvent(token, eventData);
          return res.id;
        }
      } else {
        const res = await createCalendarEvent(token, eventData);
        return res.id;
      }
    } catch (err) {
      console.error("Error syncing expense to calendar:", err);
      return null;
    }
  };

  const syncServiceToCalendar = async (servicio, token) => {
    if (!token || !servicio) return null;
    try {
      const existingEventId = parseGoogleEventId(servicio.notas);
      
      const summary = `💳 Pago Servicio: ${servicio.nombre} — ${servicio.monto} BOB`;
      const description = `--- PAGO DE SERVICIO / SUSCRIPCIÓN ---\nServicio: ${servicio.nombre}\nMonto: ${servicio.monto} BOB\nCategoría: ${servicio.categoria || 'Streaming'}\nMétodo de Pago: ${servicio.metodo || 'Tarjeta'}\nRecurrencia: ${servicio.tipo || 'Mensual'}\nNotas: ${servicio.notas ? servicio.notas.replace(/\[google_event_id:\s*[^\]]+\]/, '').trim() : '---'}`;
      
      const startDate = servicio.fecha_pago;
      const nextDay = new Date(new Date(startDate).getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const recurrenceRule = [];
      if (servicio.tipo === 'Mensual') {
        recurrenceRule.push('RRULE:FREQ=MONTHLY');
      } else if (servicio.tipo === 'Anual') {
        recurrenceRule.push('RRULE:FREQ=YEARLY');
      } else if (servicio.tipo === 'Semanal') {
        recurrenceRule.push('RRULE:FREQ=WEEKLY');
      }
      
      const eventData = {
        summary,
        description,
        start: { date: startDate },
        end: { date: nextDay },
      };
      if (recurrenceRule.length > 0) {
        eventData.recurrence = recurrenceRule;
      }
      
      if (existingEventId) {
        try {
          await updateCalendarEvent(token, existingEventId, eventData);
          return existingEventId;
        } catch (err) {
          console.warn("Could not update service event, creating new one:", err);
          const res = await createCalendarEvent(token, eventData);
          return res.id;
        }
      } else {
        const res = await createCalendarEvent(token, eventData);
        return res.id;
      }
    } catch (err) {
      console.error("Error syncing service to calendar:", err);
      return null;
    }
  };
  const egresos = data.egresos || [];
  const ventas  = data.ventas  || [];
  const prestamosList = data.prestamos || [];

  const [activeTab, setActiveTab] = useState(initialFilterText ? 'transacciones' : 'dashboard'); // dashboard | ganancias | transacciones | suscripciones

  const ahora = new Date();
  const mesActualStr = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}`;

  // ── Selector de Período ──────────────────────────────────────────────────
  const [periodoMes, setPeriodoMes] = useState(mesActualStr);

  const generarPeriodos = () => {
    const periodos = [];
    const baseDate = new Date();
    for (let i = -6; i <= 2; i++) {
      const d = new Date(baseDate.getFullYear(), baseDate.getMonth() + i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
      periodos.push({ key, label, esActual: i === 0 });
    }
    return periodos;
  };
  const periodosDisponibles = useMemo(() => generarPeriodos(), []);

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

  const getTipoPrestamo = (p) => {
    if (p.tipo_prestamo) return p.tipo_prestamo;
    if (p.notas && p.notas.includes('[TIPO:recibido]')) return 'recibido';
    return 'otorgado';
  };

  const prestamosRecibidos = useMemo(() => {
    return prestamosList.filter(p => getTipoPrestamo(p) === 'recibido');
  }, [prestamosList]);

  const totalDeudaRecibida = useMemo(() => {
    return prestamosRecibidos.reduce((acc, p) => acc + (parseFloat(p.capital) || 0), 0);
  }, [prestamosRecibidos]);

  const cuotasRecibidasMes = useMemo(() => {
    const list = [];
    prestamosRecibidos.forEach(p => {
      const cuotas = p.tipo_pago === 'diario' ? generarCronogramaDiario(p) : generarCronograma(p);
      const matches = cuotas.filter(c => c.key.startsWith(periodoMes));
      matches.forEach(c => {
        list.push({
          prestamo: p,
          cuota: c,
        });
      });
    });
    return list;
  }, [prestamosRecibidos, periodoMes]);

  const handleToggleRecibidoPago = async (prestamo, cuotaKey) => {
    const current = Array.isArray(prestamo.pagos) ? prestamo.pagos : [];
    const keyReservado = `${cuotaKey}_reservado`;
    let newPagos;
    if (current.includes(cuotaKey)) {
      newPagos = current.filter(m => m !== cuotaKey && m !== keyReservado);
    } else if (current.includes(keyReservado)) {
      newPagos = [...current.filter(m => m !== keyReservado), cuotaKey];
    } else {
      newPagos = [...current, keyReservado];
    }
    
    try {
      const updatedPrestamo = { ...prestamo, pagos: newPagos };
      const { error } = await supabase.from('prestamos').upsert(updatedPrestamo);
      if (error) throw error;
      
      const updatedList = prestamosList.map(p => p.id === prestamo.id ? updatedPrestamo : p);
      setData(prev => ({ ...prev, prestamos: updatedList }));
    } catch (err) {
      console.error("Error toggling recibido payment:", err);
    }
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

  // ── Formulario de Ganancia Manual (Crear) ──────────────────────────────────
  const [showIncomeForm, setShowIncomeForm] = useState(false);
  const [incomeLoading, setIncomeLoading] = useState(false);
  const [availableProducts, setAvailableProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [comprador, setComprador] = useState('');
  const [telefono, setTelefono] = useState('');
  const [metodoPago, setMetodoPago] = useState('Efectivo');
  const [monedaVenta, setMonedaVenta] = useState('BOB');
  
  const [incomeForm, setIncomeForm] = useState({
    fecha: new Date().toISOString().split('T')[0],
    producto: '',
    categoria: 'Venta de Productos',
    plataforma: 'WhatsApp',
    monto: '0',
    costo: '0',
    notas: ''
  });

  // Cargar productos del catálogo de Supabase
  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const { data, error } = await supabase.from('productos').select('*').order('nombre');
        if (data) setAvailableProducts(data);
      } catch (e) {
        console.error("Error loading products for checkout:", e);
      }
    };
    if (showIncomeForm) {
      fetchCatalog();
    }
  }, [showIncomeForm]);

  // Cargar/actualizar datos al montar
  useEffect(() => {
    if (onRefresh) onRefresh();
  }, []);

  // ── Cálculos Financieros Consolidados ──────────────────────────────────────

  // Se consolidan gastos individuales + suscripciones recurrentes del período seleccionado
  const totalEgresosAllTime = egresos.reduce((acc, e) => acc + (parseFloat(e.monto) || 0), 0) + servicios.reduce((acc, s) => acc + (parseFloat(s.monto) || 0), 0);
  
  const egresosMesFiltrado = useMemo(() => {
    return egresos.filter(e => e.fecha?.startsWith(periodoMes));
  }, [egresos, periodoMes]);

  const totalEgresosMes = useMemo(() => {
    return egresosMesFiltrado.reduce((acc, e) => acc + (parseFloat(e.monto) || 0), 0) + servicios.reduce((acc, s) => acc + (parseFloat(s.monto) || 0), 0);
  }, [egresosMesFiltrado, servicios]);

  // Cálculos detallados de ingresos/ganancias por categoría del periodo seleccionado:
  
  // 1. Intereses cobrados de préstamos activos
  const prestamosInteresMes = useMemo(() => {
    return prestamosList.reduce((acc, p) => {
      if (getTipoPrestamo(p) !== 'otorgado') return acc;
      const isPaidThisMonth = Array.isArray(p.pagos) && p.pagos.includes(periodoMes);
      if (isPaidThisMonth) {
        const interest = (parseFloat(p.capital) || 0) * ((parseFloat(p.interes) || 0) / 100);
        return acc + interest;
      }
      return acc;
    }, 0);
  }, [prestamosList, periodoMes]);

  const prestamosAcreditadosMes = useMemo(() => {
    return prestamosList.filter(p => getTipoPrestamo(p) === 'otorgado' && Array.isArray(p.pagos) && p.pagos.includes(periodoMes));
  }, [prestamosList, periodoMes]);

  // 2. Utilidades obtenidas de ventas de catálogo (monto venta - costo de productos)
  const ventasCatalogoMes = useMemo(() => {
    return ventas.filter(v => v.fecha?.startsWith(periodoMes) && v.categoria === 'Catálogo' && v.estado !== 'Pendiente');
  }, [ventas, periodoMes]);

  const utilidadVentasCatalogoMes = useMemo(() => {
    return ventasCatalogoMes.reduce((acc, v) => {
      const cost = parseFloat(v.metadata?.cart?.reduce((sum, item) => sum + (parseFloat(item.precio_costo || 0) * (parseInt(item.quantity) || 1)), 0) || v.metadata?.precio_costo || 0);
      const saleValue = parseFloat(v.monto) || 0;
      return acc + (saleValue - cost);
    }, 0);
  }, [ventasCatalogoMes]);

  // 3. Trabajos de edición de video / freelance
  const ventasVideoMes = useMemo(() => {
    return ventas.filter(v => v.fecha?.startsWith(periodoMes) && (v.categoria === 'Edición de Video' || v.categoria === 'Freelance') && v.estado !== 'Pendiente');
  }, [ventas, periodoMes]);

  const totalVideoMes = useMemo(() => {
    return ventasVideoMes.reduce((acc, v) => acc + (parseFloat(v.monto) || 0), 0);
  }, [ventasVideoMes]);

  // 4. Otras ganancias manuales o secundarias
  const ventasOtrasMes = useMemo(() => {
    return ventas.filter(v => v.fecha?.startsWith(periodoMes) && v.categoria !== 'Catálogo' && v.categoria !== 'Edición de Video' && v.categoria !== 'Freelance' && v.estado !== 'Pendiente');
  }, [ventas, periodoMes]);

  const totalOtrasMes = useMemo(() => {
    return ventasOtrasMes.reduce((acc, v) => {
      const cost = parseFloat(v.metadata?.precio_costo || 0);
      return acc + (parseFloat(v.monto) || 0) - cost;
    }, 0);
  }, [ventasOtrasMes]);

  // Suma total de ganancias netas del período
  const totalIngresosMes = useMemo(() => {
    return prestamosInteresMes + utilidadVentasCatalogoMes + totalVideoMes + totalOtrasMes;
  }, [prestamosInteresMes, utilidadVentasCatalogoMes, totalVideoMes, totalOtrasMes]);

  const gananciaNetaMes = totalIngresosMes - totalEgresosMes;

  // Distribución de gastos del mes seleccionado por categoría
  const egresosPorCategoriaMes = useMemo(() => {
    return GASTO_CATEGORIAS.map(cat => {
      let totalCat = egresosMesFiltrado
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
  }, [egresosMesFiltrado, categoryBudgets, servicios]);

  // Transacciones Filtradas (lista general)
  const filteredEgresos = useMemo(() => {
    return egresos.filter(e => {
      const matchText = !filterText || e.descripcion?.toLowerCase().includes(filterText.toLowerCase()) || e.notas?.toLowerCase().includes(filterText.toLowerCase());
      const matchCategory = filterCategory === 'Todas' || e.categoria === filterCategory;
      const matchStart = !filterStartDate || e.fecha >= filterStartDate;
      const matchEnd = !filterEndDate || e.fecha <= filterEndDate;
      return matchText && matchCategory && matchStart && matchEnd;
    }).sort((a, b) => b.fecha.localeCompare(a.fecha));
  }, [egresos, filterText, filterCategory, filterStartDate, filterEndDate]);

  // Mayor gasto del mes seleccionado
  const mayorGastoMes = useMemo(() => {
    const listado = [...egresosMesFiltrado];
    servicios.forEach(s => listado.push({ descripcion: s.nombre, monto: s.monto, categoria: 'Suscripción' }));
    if (listado.length === 0) return null;
    return listado.sort((a, b) => parseFloat(b.monto) - parseFloat(a.monto))[0];
  }, [egresosMesFiltrado, servicios]);

  // Promedio diario del mes seleccionado
  const promedioDiarioMes = useMemo(() => {
    if (totalEgresosMes === 0) return 0;
    const isCurrentMonth = periodoMes === mesActualStr;
    const diasTranscurridos = isCurrentMonth ? ahora.getDate() : 30;
    return totalEgresosMes / diasTranscurridos;
  }, [totalEgresosMes, periodoMes, mesActualStr, ahora]);

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
      let savedPayload = { ...payload };
      if (token) {
        try {
          const eventId = await syncExpenseToCalendar(payload, token);
          if (eventId) {
            savedPayload.notas = serializeGoogleEventId(payload.notas || '', eventId);
          }
        } catch (calErr) {
          console.error("Error syncing expense to calendar:", calErr);
        }
      }

      const { error } = await supabase.from('egresos').upsert(savedPayload);
      if (error) throw error;
      
      if (editingExpense) {
        setData(prev => ({
          ...prev,
          egresos: prev.egresos.map(item => item.id === editingExpense.id ? savedPayload : item)
        }));
      } else {
        setData(prev => ({
          ...prev,
          egresos: [savedPayload, ...prev.egresos]
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

  const handleSaveIncome = async () => {
    setIncomeLoading(true);
    try {
      let finalProducto = incomeForm.producto;
      let finalMonto = parseFloat(incomeForm.monto) || 0;
      let finalCosto = parseFloat(incomeForm.costo) || 0;

      // Si es una venta de productos del catálogo y hay ítems en el carrito, calculamos automáticamente
      if (incomeForm.categoria === 'Venta de Productos' && cart.length > 0) {
        finalProducto = cart.map(c => `${c.nombre} (x${c.quantity})`).join(', ');
        finalMonto = cart.reduce((sum, c) => sum + (c.quantity * (parseFloat(c.precio_venta) || 0)), 0);
        finalCosto = cart.reduce((sum, c) => sum + (c.quantity * (parseFloat(c.precio_costo) || 0)), 0);

        // Descontar stock en Supabase
        for (const item of cart) {
          const { data: pData } = await supabase.from('productos').select('stock_actual').eq('id', item.id).single();
          if (pData) {
            const currentStock = parseInt(pData.stock_actual) || 0;
            await supabase.from('productos').update({ stock_actual: Math.max(0, currentStock - item.quantity) }).eq('id', item.id);
          }
        }
      }

      if (!finalProducto.trim() || finalMonto <= 0) {
        alert("Por favor, ingresa un concepto/producto y un monto de venta válido.");
        setIncomeLoading(false);
        return;
      }

      const newVenta = {
        id: crypto.randomUUID(),
        fecha: incomeForm.fecha,
        producto: finalProducto.trim(),
        categoria: incomeForm.categoria,
        plataforma: incomeForm.plataforma,
        monto: finalMonto,
        estado: 'Aprobado',
        moneda: monedaVenta,
        notas: `Comprador: ${comprador} | Teléfono: ${telefono} | Notas: ${incomeForm.notas}`.trim(),
        metadata: {
          precio_costo: finalCosto,
          comprador,
          telefono,
          metodo_pago: metodoPago,
          moneda: monedaVenta,
          cart: cart
        }
      };

      const { error } = await supabase.from('ventas').insert(newVenta);
      if (error) throw error;
      
      if (onRefresh) await onRefresh();
      setShowIncomeForm(false);
      
      // Reset states
      setCart([]);
      setComprador('');
      setTelefono('');
      setMetodoPago('Efectivo');
      setMonedaVenta('BOB');
      setIncomeForm({
        fecha: new Date().toISOString().split('T')[0],
        producto: '',
        categoria: 'Venta de Productos',
        plataforma: 'WhatsApp',
        monto: '0',
        costo: '0',
        notas: ''
      });
      alert('✅ Venta registrada y stock actualizado correctamente');
    } catch (err) {
      alert('Error al registrar venta: ' + err.message);
    } finally {
      setIncomeLoading(false);
    }
  };

  const handleDeleteIncome = async (id) => {
    if (!confirm('¿Seguro que deseas eliminar este registro de ganancia?')) return;
    try {
      const { error } = await supabase.from('ventas').delete().eq('id', id);
      if (error) throw error;
      if (onRefresh) await onRefresh();
      alert('✅ Registro de ganancia eliminado');
    } catch (err) {
      alert('Error al eliminar ganancia: ' + err.message);
    }
  };

  const handleDeleteExpense = async (id) => {
    if (!confirm('¿Seguro que deseas eliminar este registro de gasto?')) return;
    try {
      const item = egresos.find(e => e.id === id);
      if (item) {
        if (token) {
          const eventId = parseGoogleEventId(item.notas);
          if (eventId) {
            try {
              await deleteCalendarEvent(token, eventId);
            } catch (calErr) {
              console.error("Error deleting calendar event:", calErr);
            }
          }
        }
        await supabase.from('papelera').insert([{
          tipo_dato: 'egreso',
          nombre_item: item.descripcion,
          datos_originales: item,
          item_id: id,
          borrado_el: new Date().toISOString(),
          expira_el: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        }]);
      }
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
      let savedPayload = { ...payload };
      if (token) {
        try {
          const eventId = await syncServiceToCalendar(payload, token);
          if (eventId) {
            savedPayload.notas = serializeGoogleEventId(payload.notas || '', eventId);
          }
        } catch (calErr) {
          console.error("Error syncing service to calendar:", calErr);
        }
      }

      let { error } = await supabase.from('servicios').upsert(savedPayload);
      if (error) {
        // Fallback robusto por si no existe la columna categoria
        if (error.message && (error.message.toLowerCase().includes("categoria") || error.message.toLowerCase().includes("column"))) {
          const { categoria, ...fallbackPayload } = savedPayload;
          fallbackPayload.notas = `[Categoría: ${serviceForm.categoria}] ${(serviceForm.notas || '').trim()}`.trim() || null;
          if (savedPayload.notas && savedPayload.notas.includes('[google_event_id:')) {
            const eventId = parseGoogleEventId(savedPayload.notas);
            fallbackPayload.notas = serializeGoogleEventId(fallbackPayload.notas, eventId);
          }
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
      const item = servicios.find(s => s.id === id);
      if (item) {
        if (token) {
          const eventId = parseGoogleEventId(item.notas);
          if (eventId) {
            try {
              await deleteCalendarEvent(token, eventId);
            } catch (calErr) {
              console.error("Error deleting calendar event:", calErr);
            }
          }
        }
        await supabase.from('papelera').insert([{
          tipo_dato: 'servicio',
          nombre_item: item.nombre,
          datos_originales: item,
          item_id: id,
          borrado_el: new Date().toISOString(),
          expira_el: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        }]);
      }
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
        <div className="flex items-center gap-4 flex-wrap">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white mb-1">Mis Egresos</h2>
            <p className="text-xs text-neutral-400 font-medium">Dashboard financiero consolidado con control de presupuestos en múltiples monedas</p>
          </div>
          {/* Selector de Período */}
          <select
            value={periodoMes}
            onChange={(e) => setPeriodoMes(e.target.value)}
            className="rounded-xl px-3 py-1.5 text-[9px] font-black uppercase tracking-widest outline-none bg-zinc-900 border border-white/5 text-white hover:border-white/15 cursor-pointer transition-all"
            style={{ height: '36px' }}
          >
            {periodosDisponibles.map(p => (
              <option key={p.key} value={p.key}>
                {p.label} {p.esActual ? ' (Mes Actual)' : ''}
              </option>
            ))}
          </select>
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
          <div className="flex p-0.5 rounded-xl overflow-x-auto max-w-full hide-scrollbar" style={{ backgroundColor: t.accentSoft, border: `1px solid ${t.border}` }}>
            {[
              { id: 'dashboard', label: 'Dashboard', icon: Activity },
              { id: 'ganancias', label: 'Ingresos & Ganancias', icon: TrendingUp },
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start animate-in fade-in duration-500 max-w-[1400px] mx-auto w-full px-6">
          
          {/* COLUMNA IZQUIERDA Y CENTRAL: MÉTRICAS Y PRESUPUESTOS (2/3) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Tarjetas KPI Superiores */}
            <div className="grid grid-cols-2 gap-4">
              {/* KPI 1: Gastado Mes */}
              <div className="p-5 rounded-2xl border flex flex-col justify-between min-h-[110px] transition-all hover:scale-[1.01]" 
                style={{ backgroundColor: t.panel, borderColor: t.border }}>
                <div className="flex items-center justify-between text-neutral-400 text-[9px] font-black uppercase tracking-widest mb-3">
                  <span>Gastado en el Mes</span>
                  <CreditCard size={14} className="text-neutral-500" />
                </div>
                <div>
                  <p className="text-2xl font-light text-white tracking-tight font-mono">{formatCurrency(totalEgresosMes)}</p>
                  <p className="text-[9px] text-neutral-500 mt-1 font-bold">Gastos + Suscripciones del período</p>
                </div>
              </div>

              {/* KPI 2: Presupuesto Mes */}
              <div className="p-5 rounded-2xl border flex flex-col justify-between min-h-[110px] transition-all hover:scale-[1.01]" 
                style={{ backgroundColor: t.panel, borderColor: t.border }}>
                <div className="flex items-center justify-between text-neutral-400 text-[9px] font-black uppercase tracking-widest mb-3">
                  <span>Presupuesto Mes</span>
                  <button onClick={handleOpenBudgetEditor} className="p-1 rounded-md hover:bg-white/5 text-neutral-400 hover:text-white transition-all">
                    <Sliders size={12} />
                  </button>
                </div>
                <div>
                  <div className="flex items-baseline gap-2">
                    <p className="text-2xl font-light text-white tracking-tight font-mono">{formatBudget(monthlyBudget)}</p>
                  </div>
                  <p className="text-[9px] text-neutral-500 mt-1 font-bold">Límite mensual general</p>
                </div>
              </div>

              {/* KPI 3: Ingresos Mes */}
              <div className="p-5 rounded-2xl border flex flex-col justify-between min-h-[110px] transition-all hover:scale-[1.01]" 
                style={{ backgroundColor: t.panel, borderColor: t.border }}>
                <div className="flex items-center justify-between text-neutral-400 text-[9px] font-black uppercase tracking-widest mb-3">
                  <span>Ingresos del Mes</span>
                  <TrendingUp size={14} className="text-emerald-500" />
                </div>
                <div>
                  <p className="text-2xl font-light text-emerald-400 tracking-tight font-mono">{formatCurrency(totalIngresosMes)}</p>
                  <p className="text-[9px] text-neutral-500 mt-1 font-bold">Ventas & Intereses cobrados</p>
                </div>
              </div>

              {/* KPI 4: Balance Neto */}
              <div className="p-5 rounded-2xl border flex flex-col justify-between min-h-[110px] transition-all hover:scale-[1.01]" 
                style={{ backgroundColor: t.panel, borderColor: t.border }}>
                <div className="flex items-center justify-between text-neutral-400 text-[9px] font-black uppercase tracking-widest mb-3">
                  <span>Balance Neto Mes</span>
                  {gananciaNetaMes >= 0 ? <Sparkles size={14} className="text-emerald-400" /> : <AlertCircle size={14} className="text-rose-400" />}
                </div>
                <div>
                  <p className={`text-2xl font-semibold tracking-tight font-mono ${gananciaNetaMes >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {gananciaNetaMes >= 0 ? '+' : ''}{formatCurrency(gananciaNetaMes)}
                  </p>
                  <p className="text-[9px] text-neutral-500 mt-1 font-bold">Resultado consolidado</p>
                </div>
              </div>
            </div>

            {/* Presupuesto Consumido (Radial + Detalles) */}
            <div className="p-6 rounded-3xl border flex flex-col sm:flex-row items-center justify-between gap-6 transition-all" 
              style={{ backgroundColor: t.panel, borderColor: t.border }}>
              <div className="flex items-center gap-6">
                <div className="relative w-24 h-24 flex items-center justify-center rounded-full border border-white/5 bg-black/10">
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
                    <span className="text-xl font-black text-white font-mono">{budgetUsagePercent}%</span>
                    <span className="text-[7px] text-neutral-500 font-bold uppercase tracking-widest block">Consumo</span>
                  </div>
                </div>
                <div className="text-left">
                  <h3 className="text-sm font-black uppercase tracking-wider text-white">Presupuesto Mensual</h3>
                  <p className="text-[10px] text-neutral-400 mt-1 max-w-[280px]">Consumo general del presupuesto respecto al límite configurado para este mes.</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 w-full sm:w-auto shrink-0 font-mono">
                <div className="p-3 bg-zinc-950/20 border border-white/5 rounded-xl text-left">
                  <span className="text-[7px] font-black uppercase tracking-wider text-neutral-500 block">Disponible</span>
                  <span className={`text-xs font-bold ${monthlyBudget - totalEgresosMes >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {formatCurrency(monthlyBudget - totalEgresosMes)}
                  </span>
                </div>
                <div className="p-3 bg-zinc-950/20 border border-white/5 rounded-xl text-left">
                  <span className="text-[7px] font-black uppercase tracking-wider text-neutral-500 block">Consumido</span>
                  <span className="text-xs font-bold text-neutral-300">
                    {formatCurrency(totalEgresosMes)}
                  </span>
                </div>
              </div>
            </div>

            {/* Presupuestos por Categoría */}
            <div className="p-6 rounded-3xl border flex flex-col gap-6" style={{ backgroundColor: t.panel, borderColor: t.border }}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-white mb-0.5">Límites de Categoría</h3>
                  <p className="text-[10px] text-neutral-400">Distribución de gastos del mes</p>
                </div>
                <button onClick={handleOpenBudgetEditor} className="text-[8px] font-black uppercase tracking-widest rounded-lg px-2.5 py-1.5 transition-all border border-white/5 bg-white/5 hover:bg-white/10 text-white flex items-center gap-1">
                  <Sliders size={10} /> Ajustar
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {egresosPorCategoriaMes.map(cat => {
                  const Icon = cat.icon;
                  const isExceeded = cat.total > cat.limit;
                  return (
                    <div key={cat.label} className="bg-zinc-950/20 p-3.5 rounded-xl border border-white/5 flex flex-col gap-2">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="flex items-center gap-2" style={{ color: cat.color }}>
                          <Icon size={12} />
                          {cat.label}
                        </span>
                        <span className={`font-mono text-xs ${isExceeded ? 'text-rose-400 font-black' : 'text-neutral-200'}`}>
                          {formatCurrency(cat.total)}
                        </span>
                      </div>
                      
                      <div className="h-1.5 w-full bg-white/5 rounded-xl overflow-hidden">
                        <div 
                          className="h-full rounded-xl transition-all duration-700"
                          style={{
                            width: `${Math.min(cat.pct, 100)}%`,
                            backgroundColor: getProgressColor(cat.pct)
                          }}
                        />
                      </div>

                      <div className="flex justify-between items-center text-[8px] font-bold uppercase tracking-wider text-neutral-500">
                        <span>{cat.pct}% de {formatBudget(cat.limit)}</span>
                        {isExceeded && (
                          <span className="text-rose-400 font-mono font-black">
                            +{formatCurrency(cat.total - cat.limit)}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Préstamos & Obligaciones */}
            <div className="p-6 rounded-3xl border flex flex-col gap-6" style={{ backgroundColor: t.panel, borderColor: t.border }}>
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-white mb-0.5">Préstamos y Obligaciones</h3>
                <p className="text-[10px] text-neutral-400">Control de deudas de préstamos recibidos y cuotas activas</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-zinc-950/20 p-3 rounded-xl border border-white/5 flex flex-col">
                  <span className="text-[7.5px] font-black uppercase text-neutral-500 tracking-wider">Créditos Recibidos</span>
                  <span className="text-sm font-bold text-rose-400 mt-1 font-mono">{formatCurrency(totalDeudaRecibida)}</span>
                  <span className="text-[7px] text-neutral-500 mt-0.5">Total capital a pagar</span>
                </div>
                <div className="bg-zinc-950/20 p-3 rounded-xl border border-white/5 flex flex-col">
                  <span className="text-[7.5px] font-black uppercase text-neutral-500 tracking-wider">Créditos Otorgados</span>
                  <span className="text-sm font-bold text-emerald-400 mt-1 font-mono">{formatCurrency(prestamosList.filter(p => getTipoPrestamo(p) === 'otorgado').reduce((s, p) => s + (parseFloat(p.capital) || 0), 0))}</span>
                  <span className="text-[7px] text-neutral-500 mt-0.5">Capital activo prestado</span>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <h4 className="text-[8px] font-black uppercase tracking-widest text-neutral-400">Cuotas del Mes ({periodoMes})</h4>
                {cuotasRecibidasMes.length === 0 ? (
                  <div className="text-center py-6 text-neutral-500 text-[9px] uppercase tracking-widest border border-dashed border-white/5 rounded-xl bg-zinc-950/10">
                    Sin obligaciones registradas para este período
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {cuotasRecibidasMes.map(({ prestamo, cuota }) => {
                      const isPaid = (prestamo.pagos || []).includes(cuota.key);
                      const isReserved = (prestamo.pagos || []).includes(`${cuota.key}_reservado`);
                      
                      let statusBadge = (
                        <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase bg-rose-500/10 text-rose-400 border border-rose-500/10 flex items-center gap-1">
                          <Clock size={8} /> Pendiente
                        </span>
                      );
                      if (isPaid) {
                        statusBadge = (
                          <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/10 flex items-center gap-1">
                            <Check size={8} /> Pagado
                          </span>
                        );
                      } else if (isReserved) {
                        statusBadge = (
                          <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase bg-amber-500/10 text-amber-500 border border-amber-500/10 flex items-center gap-1">
                            <Bookmark size={8} /> Reservado
                          </span>
                        );
                      }

                      return (
                        <div 
                          key={`${prestamo.id}-${cuota.key}`}
                          onClick={() => handleToggleRecibidoPago(prestamo, cuota.key)}
                          className="p-3 rounded-xl border border-white/5 bg-zinc-950/20 hover:bg-zinc-950/30 transition-all flex items-center justify-between cursor-pointer"
                        >
                          <div className="flex flex-col gap-0.5 min-w-0">
                            <span className="text-[11px] font-bold text-white truncate">{prestamo.nombre || 'Préstamo'}</span>
                            <span className="text-[8px] text-neutral-400">
                              Cuota: {cuota.label} • Venc. {cuota.fechaVencimiento}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <span className="text-[11px] font-bold text-white font-mono">{formatCurrency(cuota.total)}</span>
                            </div>
                            {statusBadge}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* COLUMNA DERECHA: TIMELINE DE GASTOS Y HIGHLIGHTS (1/3) */}
          <div className="space-y-6">
            
            {/* Actividad Reciente de Gastos */}
            <div className="p-6 rounded-3xl border flex flex-col gap-4" style={{ backgroundColor: t.panel, borderColor: t.border }}>
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-white mb-0.5">Timeline de Gastos</h3>
                <p className="text-[10px] text-neutral-400">Últimos egresos individuales registrados</p>
              </div>

              <div className="flex flex-col gap-3 min-h-[220px]">
                {egresosMesFiltrado.slice(0, 6).map(e => {
                  const cat = catGastoConfig[e.categoria] || catGastoConfig['Otro'];
                  const Icon = cat.icon;
                  return (
                    <div key={e.id} className="p-3 rounded-xl border border-white/5 bg-zinc-950/20 flex justify-between items-center text-xs">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-white/2" 
                          style={{ border: `1px solid ${t.border}`, color: cat.color }}>
                          <Icon size={14} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-white uppercase truncate text-[10px]">{e.descripcion}</p>
                          <p className="text-[7.5px] text-neutral-500 font-mono mt-0.5">{e.fecha} • {e.categoria}</p>
                        </div>
                      </div>
                      <span className="font-mono text-[10px] font-black text-rose-400 shrink-0">-{formatCurrency(e.monto)}</span>
                    </div>
                  );
                })}
                {egresosMesFiltrado.length === 0 && (
                  <div className="flex flex-col items-center justify-center text-center p-8 text-neutral-500 h-full border border-dashed border-white/5 rounded-2xl flex-1">
                    <p className="text-[9px] uppercase font-black tracking-widest text-neutral-400">Sin egresos recientes</p>
                  </div>
                )}
              </div>
            </div>

            {/* Tarjetas de Resumen & Estadísticas */}
            <div className="p-6 rounded-3xl border flex flex-col gap-4" style={{ backgroundColor: t.panel, borderColor: t.border }}>
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-white mb-0.5">Análisis del Período</h3>
                <p className="text-[10px] text-neutral-400">Resumen y frecuencia operativa</p>
              </div>

              <div className="space-y-3 font-mono">
                {/* Mayor Gasto */}
                <div className="p-3.5 rounded-xl border border-white/5 bg-zinc-950/20 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <TrendingDown size={14} className="text-rose-400" />
                    <div>
                      <span className="text-[7.5px] font-black uppercase text-neutral-500 block">Mayor Gasto</span>
                      <span className="text-[10px] font-bold text-neutral-300 block truncate max-w-[120px]">{mayorGastoMes ? mayorGastoMes.descripcion : 'N/A'}</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-black text-rose-400">{mayorGastoMes ? formatCurrency(mayorGastoMes.monto) : '0.00'}</span>
                </div>

                {/* Gasto Diario */}
                <div className="p-3.5 rounded-xl border border-white/5 bg-zinc-950/20 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <Calendar size={14} className="text-amber-500" />
                    <div>
                      <span className="text-[7.5px] font-black uppercase text-neutral-500 block">Gasto Diario Promedio</span>
                      <span className="text-[10px] font-bold text-neutral-300 block">Promedio</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-black text-neutral-300">{formatCurrency(promedioDiarioMes)}</span>
                </div>

                {/* Transacciones */}
                <div className="p-3.5 rounded-xl border border-white/5 bg-zinc-950/20 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <Activity size={14} className="text-violet-400" />
                    <div>
                      <span className="text-[7.5px] font-black uppercase text-neutral-500 block">Frecuencia</span>
                      <span className="text-[10px] font-bold text-neutral-300 block">Gastos Registrados</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-black text-neutral-300">{egresosMesFiltrado.length} ops</span>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ── VISTA EXTRA: INGRESOS & GANANCIAS ───────────────────────────────────── */}
      {activeTab === 'ganancias' && (
        <div className="space-y-6 max-w-[1400px] mx-auto w-full px-6 animate-in fade-in duration-500">
          
          {/* Fila superior: KPIs de Ganancias */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* KPI 1: Ingresos Totales Periodo */}
            <div className="p-5 rounded-2xl border flex flex-col justify-between min-h-[110px] transition-all hover:scale-[1.01]" 
              style={{ backgroundColor: t.panel, borderColor: t.border }}>
              <div className="flex items-center justify-between text-neutral-400 text-[9px] font-black uppercase tracking-widest mb-4">
                <span>Ingresos Totales (Período)</span>
                <TrendingUp size={14} className="text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-light text-emerald-400 tracking-tight font-mono">{formatCurrency(totalIngresosMes)}</p>
                <p className="text-[9px] text-neutral-500 mt-1 font-bold">Intereses + Ventas + Freelance</p>
              </div>
            </div>

            {/* KPI 2: Egresos Totales Periodo */}
            <div className="p-5 rounded-2xl border flex flex-col justify-between min-h-[110px] transition-all hover:scale-[1.01]" 
              style={{ backgroundColor: t.panel, borderColor: t.border }}>
              <div className="flex items-center justify-between text-neutral-400 text-[9px] font-black uppercase tracking-widest mb-4">
                <span>Egresos Totales (Período)</span>
                <TrendingDown size={14} className="text-rose-400" />
              </div>
              <div>
                <p className="text-2xl font-light text-rose-400 tracking-tight font-mono">{formatCurrency(totalEgresosMes)}</p>
                <p className="text-[9px] text-neutral-500 mt-1 font-bold">Gastos + Suscripciones</p>
              </div>
            </div>

            {/* KPI 3: Margen Neto Consolidado */}
            <div className="p-5 rounded-2xl border flex flex-col justify-between min-h-[110px] transition-all hover:scale-[1.01]" 
              style={{ backgroundColor: t.panel, borderColor: t.border }}>
              <div className="flex items-center justify-between text-neutral-400 text-[9px] font-black uppercase tracking-widest mb-4">
                <span>Balance Neto Consolidado</span>
                {gananciaNetaMes >= 0 ? <Sparkles size={14} className="text-emerald-400" /> : <AlertCircle size={14} className="text-rose-400" />}
              </div>
              <div>
                <p className={`text-2xl font-semibold tracking-tight font-mono ${gananciaNetaMes >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {gananciaNetaMes >= 0 ? '+' : ''}{formatCurrency(gananciaNetaMes)}
                </p>
                <p className="text-[9px] text-neutral-500 mt-1 font-bold">{gananciaNetaMes >= 0 ? 'Superávit Financiero' : 'Déficit en el Periodo'}</p>
              </div>
            </div>

            {/* KPI 4: Registrar Ganancia Manual */}
            <div className="p-5 rounded-2xl border flex flex-col justify-between min-h-[110px] transition-all hover:scale-[1.01] cursor-pointer" 
              style={{ backgroundColor: t.panel, borderColor: t.border }} onClick={() => setShowIncomeForm(true)}>
              <div className="flex items-center justify-between text-neutral-400 text-[9px] font-black uppercase tracking-widest mb-4">
                <span>Acción Rápida</span>
                <Plus size={14} className="text-neutral-400" />
              </div>
              <div>
                <button className="w-full py-2.5 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 text-white text-[9px] font-black uppercase tracking-widest transition-all">
                  + Registrar Ingreso
                </button>
                <p className="text-[9px] text-neutral-500 mt-2 font-bold text-center">Añadir trabajo freelance, ventas, etc.</p>
              </div>
            </div>
          </div>

          {/* Grilla principal de desglose */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Columna Izquierda Panel 1: Préstamos (Intereses Cobrados) */}
            <div className="p-6 rounded-3xl border flex flex-col gap-4" style={{ backgroundColor: t.panel, borderColor: t.border }}>
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-white mb-0.5">Préstamos (Intereses Cobrados)</h3>
                <p className="text-[10px] text-neutral-400">Rendimiento e intereses cobrados en el mes seleccionado</p>
              </div>

              <div className="flex flex-col gap-3 min-h-[220px]">
                {prestamosAcreditadosMes.length > 0 ? (
                  prestamosAcreditadosMes.map(p => {
                    const interes = (parseFloat(p.capital) || 0) * ((parseFloat(p.interes) || 0) / 100);
                    return (
                      <div key={p.id} className="p-3.5 rounded-xl border border-white/5 bg-zinc-950/20 flex justify-between items-center text-xs">
                        <div>
                          <p className="font-bold text-white uppercase">{p.nombre}</p>
                          <p className="text-[8px] text-neutral-500 font-mono mt-0.5">Capital: {parseFloat(p.capital).toLocaleString()} BOB • Tasa: {p.interes}%</p>
                        </div>
                        <div className="text-right">
                          <p className="font-black text-emerald-400 font-mono">+{formatCurrency(interes)}</p>
                          <p className="text-[7.5px] text-neutral-500 uppercase font-black">Interés Cobrado</p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center text-center p-8 text-neutral-500 h-full border border-dashed border-white/5 rounded-2xl flex-1">
                    <p className="text-[9px] uppercase font-black tracking-widest mb-1">Sin Intereses Cobrados</p>
                    <p className="text-[8.5px]">Registra los cobros en Préstamos para verlos aquí.</p>
                  </div>
                )}
              </div>
              <div className="bg-black/20 p-3.5 rounded-xl border border-white/5 text-[9px] font-black flex justify-between uppercase text-neutral-400">
                <span>Total Intereses Recibidos:</span>
                <span className="text-emerald-400 font-mono">{formatCurrency(prestamosInteresMes)}</span>
              </div>
            </div>

            {/* Columna Derecha Panel 2: Ventas del Catálogo */}
            <div className="p-6 rounded-3xl border flex flex-col gap-4" style={{ backgroundColor: t.panel, borderColor: t.border }}>
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-white mb-0.5">Ventas del Catálogo (WhatsApp)</h3>
                <p className="text-[10px] text-neutral-400">Ventas procesadas y aprobadas en este periodo</p>
              </div>

              <div className="flex flex-col gap-3 min-h-[220px]">
                {ventasCatalogoMes.length > 0 ? (
                  ventasCatalogoMes.map(v => {
                    const cost = parseFloat(v.metadata?.cart?.reduce((sum, item) => sum + (parseFloat(item.precio_costo || 0) * (parseInt(item.quantity) || 1)), 0) || v.metadata?.precio_costo || 0);
                    const profit = (parseFloat(v.monto) || 0) - cost;
                    return (
                      <div key={v.id} className="p-3.5 rounded-xl border border-white/5 bg-zinc-950/20 text-xs">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-bold text-white uppercase">{v.producto}</p>
                            <p className="text-[8px] text-neutral-500 font-mono mt-0.5">Fecha: {v.fecha} • Plataforma: {v.plataforma}</p>
                          </div>
                          <span className="text-[7.5px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full font-black uppercase border border-emerald-500/20">Aprobada</span>
                        </div>
                        <div className="flex justify-between items-center text-[9px] bg-black/20 p-2.5 rounded-lg border border-white/5 font-mono">
                          <span className="text-neutral-400">Venta: {formatCurrency(v.monto)}</span>
                          <span className="text-neutral-500">|</span>
                          <span className="text-neutral-400">Costo: {formatCurrency(cost)}</span>
                          <span className="text-neutral-500">|</span>
                          <span className="font-bold text-emerald-400">Neto: {formatCurrency(profit)}</span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center text-center p-8 text-neutral-500 h-full border border-dashed border-white/5 rounded-2xl flex-1">
                    <p className="text-[9px] uppercase font-black tracking-widest mb-1">Sin Ventas de Catálogo</p>
                    <p className="text-[8.5px]">Las ventas del catálogo de WhatsApp aparecerán aquí.</p>
                  </div>
                )}
              </div>
              <div className="bg-black/20 p-3.5 rounded-xl border border-white/5 text-[9px] font-black flex justify-between uppercase text-neutral-400">
                <span>Utilidad Total de Ventas:</span>
                <span className="text-emerald-400 font-mono">{formatCurrency(utilidadVentasCatalogoMes)}</span>
              </div>
            </div>

            {/* Fila 2 - Panel 3: Trabajos de Edición de Video / Freelance */}
            <div className="p-6 rounded-3xl border flex flex-col gap-4" style={{ backgroundColor: t.panel, borderColor: t.border }}>
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-white mb-0.5">Edición & Freelance</h3>
                <p className="text-[10px] text-neutral-400">Ingresos directos por sesiones de edición de video</p>
              </div>

              <div className="flex flex-col gap-3 min-h-[220px]">
                {ventasVideoMes.length > 0 ? (
                  ventasVideoMes.map(v => (
                    <div key={v.id} className="p-3.5 rounded-xl border border-white/5 bg-zinc-950/20 flex justify-between items-center text-xs">
                      <div>
                        <p className="font-bold text-white uppercase">{v.producto}</p>
                        <p className="text-[8px] text-neutral-500 font-mono mt-0.5">Fecha: {v.fecha} • {v.notas || 'Sin notas'}</p>
                      </div>
                      <div className="text-right flex items-center gap-3">
                        <span className="font-black text-emerald-400 font-mono">+{formatCurrency(v.monto)}</span>
                        <button onClick={() => handleDeleteIncome(v.id)} className="text-rose-500 hover:text-rose-400 p-1 transition-colors" title="Eliminar">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center text-center p-8 text-neutral-500 h-full border border-dashed border-white/5 rounded-2xl flex-1">
                    <p className="text-[9px] uppercase font-black tracking-widest mb-1">Sin Trabajos de Edición</p>
                    <p className="text-[8.5px]">Los precios registrados del Editor de Video se listarán aquí.</p>
                  </div>
                )}
              </div>
              <div className="bg-black/20 p-3.5 rounded-xl border border-white/5 text-[9px] font-black flex justify-between uppercase text-neutral-400">
                <span>Total Edición & Freelance:</span>
                <span className="text-emerald-400 font-mono">{formatCurrency(totalVideoMes)}</span>
              </div>
            </div>

            {/* Fila 2 - Panel 4: Otras Ganancias Manuales */}
            <div className="p-6 rounded-3xl border flex flex-col gap-4" style={{ backgroundColor: t.panel, borderColor: t.border }}>
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-white mb-0.5">Otros Ingresos Manuales</h3>
                <p className="text-[10px] text-neutral-400">Otros ingresos registrados directamente</p>
              </div>

              <div className="flex flex-col gap-3 min-h-[220px]">
                {ventasOtrasMes.length > 0 ? (
                  ventasOtrasMes.map(v => {
                    const cost = parseFloat(v.metadata?.precio_costo || 0);
                    const netIncome = (parseFloat(v.monto) || 0) - cost;
                    return (
                      <div key={v.id} className="p-3.5 rounded-xl border border-white/5 bg-zinc-950/20 flex justify-between items-center text-xs">
                        <div>
                          <p className="font-bold text-white uppercase">{v.producto}</p>
                          <p className="text-[8px] text-neutral-500 font-mono mt-0.5">{v.fecha} • {v.categoria}</p>
                          {cost > 0 && <p className="text-[7.5px] text-neutral-500 mt-0.5 font-mono">Bruto: {formatCurrency(v.monto)} • Costo: {formatCurrency(cost)}</p>}
                        </div>
                        <div className="text-right flex items-center gap-3">
                          <span className="font-black text-emerald-400 font-mono">+{formatCurrency(netIncome)}</span>
                          <button onClick={() => handleDeleteIncome(v.id)} className="text-rose-500 hover:text-rose-400 p-1 transition-colors" title="Eliminar">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center text-center p-8 text-neutral-500 h-full border border-dashed border-white/5 rounded-2xl flex-1">
                    <p className="text-[9px] uppercase font-black tracking-widest mb-1">Sin Otros Ingresos</p>
                    <p className="text-[8.5px]">Usa el botón superior para añadir otros ingresos.</p>
                  </div>
                )}
              </div>
              <div className="bg-black/20 p-3.5 rounded-xl border border-white/5 text-[9px] font-black flex justify-between uppercase text-neutral-400">
                <span>Total Otros Ingresos:</span>
                <span className="text-emerald-400 font-mono">{formatCurrency(totalOtrasMes)}</span>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ── VISTA 2: LISTADO DE GASTOS ─────────────────────────────────────────── */}
      {activeTab === 'transacciones' && (
        <div className="space-y-6 max-w-[1400px] mx-auto w-full px-6 animate-in fade-in duration-500">
          
          {/* Controles de Búsqueda y Filtrado */}
          <div className="p-4 rounded-2xl border flex flex-col md:flex-row gap-4 items-center justify-between" 
            style={{ backgroundColor: t.panel, borderColor: t.border }}>
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
                  className="bg-zinc-950/40 border border-white/5 rounded-xl px-3 py-2 text-xs outline-none text-neutral-300 cursor-pointer focus:border-white/20 transition-all"
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
                  className="bg-zinc-950/40 border border-white/5 rounded-xl px-3 py-2 text-xs outline-none text-neutral-300 focus:border-white/20 transition-all cursor-pointer"
                />
                <span>a</span>
                <input
                  type="date"
                  value={filterEndDate}
                  onChange={e => setFilterEndDate(e.target.value)}
                  className="bg-zinc-950/40 border border-white/5 rounded-xl px-3 py-2 text-xs outline-none text-neutral-300 focus:border-white/20 transition-all cursor-pointer"
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
              className="w-full md:w-auto px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 text-black font-bold"
              style={{ backgroundColor: t.accent }}
            >
              <Plus size={14} strokeWidth={3} /> Registrar Gasto
            </button>
          </div>

          {/* Tabla de Egresos Premium */}
          <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: t.panel, borderColor: t.border }}>
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
                            <p className="text-xs font-semibold text-white uppercase">{e.descripcion}</p>
                            {e.notes && <p className="text-[9px] text-neutral-500 mt-1 max-w-md italic flex items-center gap-1.5"><FileText size={10} /> {e.notes}</p>}
                            {e.notas && !e.notes && <p className="text-[9px] text-neutral-500 mt-1 max-w-md italic flex items-center gap-1.5"><FileText size={10} /> {e.notas}</p>}
                          </td>
                          <td className="px-5 py-4">
                            <span className="inline-flex items-center gap-1.5 text-[9px] font-bold px-2 py-0.5 rounded-lg border border-white/5 bg-white/2" style={{ color: cat.color }}>
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
                      <td colSpan="5" className="px-5 py-12 text-center text-[10px] font-black uppercase tracking-widest text-neutral-500 italic">
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
        <div className="space-y-6 max-w-[1400px] mx-auto w-full px-6 animate-in fade-in duration-500">
          
          {/* Cabecera Pestaña */}
          <div className="flex items-center justify-between p-4 rounded-2xl border" style={{ backgroundColor: t.panel, borderColor: t.border }}>
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-white mb-0.5">Suscripciones Activas</h3>
              <p className="text-[10px] text-neutral-400">Gastos recurrentes y servicios fijos registrados ({servicios.length} activos)</p>
            </div>
            <button
              onClick={handleOpenNewService}
              className="px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 transition-all active:scale-95 text-black font-bold"
              style={{ backgroundColor: t.accent }}
            >
              <Plus size={14} strokeWidth={3} /> Registrar Suscripción
            </button>
          </div>

          {/* Grid de Suscripciones Premium */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {servicios.map(s => {
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
              const PaymentIcon = getMetodoIcon(s.metodo);
              
              return (
                <div key={s.id} className="p-5 flex flex-col justify-between group relative overflow-hidden transition-all duration-300 rounded-2xl hover:bg-white/[0.02] cursor-pointer"
                  style={{ backgroundColor: t.panel, border: `1px solid ${t.border}`, minHeight: 160 }}>
                  
                  {/* Top: Icon and Status Badge */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/[0.02]" style={{ border: `1px solid ${t.border}`, color: sCat.color }}>
                        <SIcon size={14} />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-[11px] font-black uppercase tracking-wider text-white truncate max-w-[110px]">{s.nombre}</h4>
                        <span className="text-[7.5px] font-black uppercase tracking-wider text-neutral-500 block">{catName}</span>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[7.5px] font-black uppercase tracking-widest ${hasExpired ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20 animate-pulse' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                      {hasExpired ? 'Vencido' : 'Al Día'}
                    </span>
                  </div>

                  {/* Mid details */}
                  <div className="space-y-1.5 pt-2.5 border-t border-white/5 text-[9px] font-mono">
                    <div className="flex justify-between items-center">
                      <span className="text-neutral-500 uppercase font-black">Próximo Pago</span>
                      <span className={`font-bold ${hasExpired ? 'text-rose-400' : 'text-neutral-300'}`}>{s.fecha_pago || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-neutral-500 uppercase font-black">Frecuencia</span>
                      <span className="text-neutral-300 uppercase font-bold">{s.tipo || 'Mensual'}</span>
                    </div>
                    {s.contacto && (
                      <div className="flex justify-between items-center">
                        <span className="text-neutral-500 uppercase font-black font-sans">Soporte</span>
                        <span className="text-neutral-300 truncate max-w-[100px] font-sans">{s.contacto}</span>
                      </div>
                    )}
                  </div>

                  {/* Bottom details: price and action buttons */}
                  <div className="flex items-center justify-between pt-3 mt-3 border-t border-white/5">
                    <div className="flex items-center gap-1.5 text-rose-400 font-mono font-black">
                      <PaymentIcon size={12} className="text-neutral-500" />
                      <span>-{formatCurrency(s.monto)}</span>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleOpenEditService(s)} className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/5 transition-all" title="Editar">
                        <Edit3 size={11} />
                      </button>
                      <button onClick={() => handleDeleteService(s.id)} className="p-1.5 rounded-lg text-neutral-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all" title="Dar de baja">
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
            {servicios.length === 0 && (
              <div className="col-span-full text-center py-10 rounded-xl" style={{ border: `1px dashed ${t.border}`, backgroundColor: t.panel }}>
                <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: t.textDim }}>No se encontraron suscripciones activas.</p>
              </div>
            )}
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
      {/* ── DIÁLOGO MODAL: REGISTRAR INGRESO / GANANCIA MANUAL ─────────────────── */}
      {showIncomeForm && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div 
            className="w-full max-w-lg border border-white/5 rounded-3xl p-8 max-h-[90vh] overflow-y-auto mac-scrollbar animate-in zoom-in-95 duration-300"
            style={{ backgroundColor: t.bg }}
          >
            <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-6">
              <div>
                <h3 className="text-sm font-black uppercase tracking-widest text-white">Registrar Ingreso Manual</h3>
                <p className="text-[9px] text-neutral-400 font-bold uppercase tracking-wider mt-1">Agregar ganancia o cobro consolidado</p>
              </div>
              <button 
                onClick={() => setShowIncomeForm(false)} 
                className="w-8 h-8 rounded-xl border border-white/5 hover:bg-white/5 text-neutral-400 hover:text-white flex items-center justify-center transition-all"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4">
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[8px] font-black uppercase tracking-widest text-neutral-400 display: block mb-2">Fecha del Ingreso</label>
                  <input
                    type="date"
                    value={incomeForm.fecha}
                    onChange={e => setIncomeForm({...incomeForm, fecha: e.target.value})}
                    className="w-full bg-zinc-950/40 border border-white/5 rounded-xl px-4 py-2.5 text-xs outline-none text-white focus:border-white/20 transition-all"
                  />
                </div>
                <div>
                  <label className="text-[8px] font-black uppercase tracking-widest text-neutral-400 display: block mb-2">Categoría</label>
                  <select
                    value={incomeForm.categoria}
                    onChange={e => {
                      const newCat = e.target.value;
                      setIncomeForm({...incomeForm, categoria: newCat});
                    }}
                    className="w-full bg-zinc-950/40 border border-white/5 rounded-xl px-4 py-2.5 text-xs outline-none text-white focus:border-white/20 transition-all cursor-pointer"
                  >
                    <option value="Venta de Productos">Venta de Productos</option>
                    <option value="Edición de Video">Edición de Video</option>
                    <option value="Freelance">Freelance</option>
                    <option value="Préstamos">Préstamos</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
              </div>

              {incomeForm.categoria === 'Venta de Productos' ? (
                <>
                  {/* CLIENT & SALE DETAILS FOR CART */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[8px] font-black uppercase tracking-widest text-neutral-400 display: block mb-2">Nombre Comprador</label>
                      <input
                        type="text"
                        value={comprador}
                        onChange={e => setComprador(e.target.value)}
                        placeholder="Ej: Carlos Joel"
                        className="w-full bg-zinc-950/40 border border-white/5 rounded-xl px-4 py-2.5 text-xs outline-none text-white focus:border-white/20 transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-[8px] font-black uppercase tracking-widest text-neutral-400 display: block mb-2">Teléfono Comprador</label>
                      <input
                        type="text"
                        value={telefono}
                        onChange={e => setTelefono(e.target.value)}
                        placeholder="Ej: +59178912345"
                        className="w-full bg-zinc-950/40 border border-white/5 rounded-xl px-4 py-2.5 text-xs outline-none text-white focus:border-white/20 transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[8px] font-black uppercase tracking-widest text-neutral-400 display: block mb-2">Método de Pago</label>
                      <select
                        value={metodoPago}
                        onChange={e => setMetodoPago(e.target.value)}
                        className="w-full bg-zinc-950/40 border border-white/5 rounded-xl px-4 py-2.5 text-xs outline-none text-white focus:border-white/20 transition-all cursor-pointer"
                      >
                        <option value="Efectivo">Efectivo</option>
                        <option value="Transferencia">Transferencia Bancaria</option>
                        <option value="Tigo Money">Tigo Money</option>
                        <option value="Tarjeta">Tarjeta</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[8px] font-black uppercase tracking-widest text-neutral-400 display: block mb-2">Divisa Transacción</label>
                      <select
                        value={monedaVenta}
                        onChange={e => setMonedaVenta(e.target.value)}
                        className="w-full bg-zinc-950/40 border border-white/5 rounded-xl px-4 py-2.5 text-xs outline-none text-white focus:border-white/20 transition-all cursor-pointer"
                      >
                        <option value="BOB">BOB (Bolivianos)</option>
                        <option value="USD">USD (Dólares)</option>
                        <option value="EUR">EUR (Euros)</option>
                        <option value="BRL">BRL (Reales)</option>
                      </select>
                    </div>
                  </div>

                  {/* SELECT PRODUCT & ADD */}
                  <div className="border-t border-white/5 pt-4">
                    <label className="text-[8px] font-black uppercase tracking-widest text-neutral-400 display: block mb-2">Catálogo de Productos</label>
                    <select
                      value=""
                      onChange={e => {
                        const prod = availableProducts.find(p => p.id === e.target.value);
                        if (prod) {
                          const exist = cart.find(c => c.id === prod.id);
                          if (exist) {
                            setCart(cart.map(c => c.id === prod.id ? { ...c, quantity: c.quantity + 1 } : c));
                          } else {
                            setCart([...cart, {
                              id: prod.id,
                              nombre: prod.nombre,
                              precio_venta: prod.precio_venta,
                              precio_costo: prod.precio_costo,
                              quantity: 1
                            }]);
                          }
                        }
                      }}
                      className="w-full bg-zinc-950/40 border border-white/5 rounded-xl px-4 py-2.5 text-xs outline-none text-white focus:border-white/20 transition-all cursor-pointer"
                    >
                      <option value="" disabled>-- Selecciona un producto para añadir --</option>
                      {availableProducts.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.nombre.toUpperCase()} - Stock: {p.stock_actual} uds ({p.precio_venta} BOB)
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* SHOPPING CART LIST */}
                  {cart.length > 0 && (
                    <div className="bg-zinc-950/20 border border-white/5 rounded-2xl p-4 space-y-3">
                      <span className="text-[8px] font-black uppercase tracking-widest text-neutral-400 block pb-2 border-b border-white/5">Lista de Compra ({cart.reduce((sum, c) => sum + c.quantity, 0)} uds)</span>
                      <div className="space-y-2 max-h-[180px] overflow-y-auto mac-scrollbar">
                        {cart.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between gap-3 text-xs bg-zinc-950/30 p-2.5 rounded-xl border border-white/5">
                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-white truncate text-[11px] uppercase">{item.nombre}</p>
                              <span className="text-[9px] text-neutral-500 font-mono">Costo Unit: {item.precio_costo} {monedaVenta}</span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <input 
                                type="number" 
                                value={item.precio_venta} 
                                onChange={e => {
                                  const val = parseFloat(e.target.value) || 0;
                                  setCart(cart.map((c, i) => i === idx ? { ...c, precio_venta: val } : c));
                                }}
                                className="w-16 bg-zinc-900 border border-white/5 rounded px-2 py-1 text-center font-mono text-[10px] text-white outline-none"
                              />
                              <div className="flex items-center border border-white/5 rounded-lg bg-zinc-900 overflow-hidden">
                                <button onClick={() => {
                                  if (item.quantity > 1) {
                                    setCart(cart.map((c, i) => i === idx ? { ...c, quantity: c.quantity - 1 } : c));
                                  } else {
                                    setCart(cart.filter((_, i) => i !== idx));
                                  }
                                }} className="px-2 py-1 text-[10px] text-neutral-400 hover:text-white">-</button>
                                <span className="px-2 text-[10px] text-white font-bold">{item.quantity}</span>
                                <button onClick={() => setCart(cart.map((c, i) => i === idx ? { ...c, quantity: c.quantity + 1 } : c))} className="px-2 py-1 text-[10px] text-neutral-400 hover:text-white">+</button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="flex justify-between items-center pt-2 border-t border-white/5 text-xs">
                        <span className="font-black text-neutral-400 uppercase tracking-widest text-[9px]">Total de la Venta:</span>
                        <span className="font-mono font-black text-emerald-400 text-sm">
                          {cart.reduce((sum, c) => sum + (c.quantity * c.precio_venta), 0).toLocaleString()} {monedaVenta}
                        </span>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {/* STANDARD MANUAL INCOME INPUTS */}
                  <div>
                    <label className="text-[8px] font-black uppercase tracking-widest text-neutral-400 display: block mb-2">Concepto / Producto / Cliente</label>
                    <input
                      type="text"
                      value={incomeForm.producto}
                      onChange={e => setIncomeForm({...incomeForm, producto: e.target.value})}
                      className="w-full bg-zinc-950/40 border border-white/5 rounded-xl px-4 py-2.5 text-xs outline-none text-white focus:border-white/20 transition-all"
                      placeholder="Ej: Cliente Juan - Edición Clip 5, Venta Teclado..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[8px] font-black uppercase tracking-widest text-neutral-400 display: block mb-2">Monto de Venta ({currency})</label>
                      <input
                        type="number"
                        value={incomeForm.monto}
                        onChange={e => setIncomeForm({...incomeForm, monto: e.target.value})}
                        className="w-full bg-zinc-950/40 border border-white/5 rounded-xl px-4 py-2.5 text-xs outline-none text-white focus:border-white/20 transition-all font-mono"
                        placeholder="Monto total ingresado"
                      />
                    </div>
                    <div>
                      <label className="text-[8px] font-black uppercase tracking-widest text-neutral-400 display: block mb-2">Costo del Producto ({currency})</label>
                      <input
                        type="number"
                        value={incomeForm.costo}
                        onChange={e => setIncomeForm({...incomeForm, costo: e.target.value})}
                        className="w-full bg-zinc-950/40 border border-white/5 rounded-xl px-4 py-2.5 text-xs outline-none text-white focus:border-white/20 transition-all font-mono"
                        placeholder="Opcional. Para utilidad"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[8px] font-black uppercase tracking-widest text-neutral-400 display: block mb-2">Plataforma</label>
                      <input
                        type="text"
                        value={incomeForm.plataforma}
                        onChange={e => setIncomeForm({...incomeForm, plataforma: e.target.value})}
                        className="w-full bg-zinc-950/40 border border-white/5 rounded-xl px-4 py-2.5 text-xs outline-none text-white focus:border-white/20 transition-all"
                        placeholder="Ej: Directo, Gumroad, WhatsApp..."
                      />
                    </div>
                    <div className="flex flex-col justify-end">
                      <p className="text-[8px] text-neutral-500 font-bold uppercase tracking-wider mb-2">Utilidad Estimada</p>
                      <div className="w-full bg-zinc-950/60 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-emerald-400 font-bold font-mono">
                        {formatCurrency((parseFloat(incomeForm.monto) || 0) - (parseFloat(incomeForm.costo) || 0))}
                      </div>
                    </div>
                  </div>
                </>
              )}              <div>
                <label className="text-[8px] font-black uppercase tracking-widest text-neutral-400 display: block mb-2">Notas Adicionales</label>
                <textarea
                  value={incomeForm.notes}
                  onChange={e => setIncomeForm({...incomeForm, notes: e.target.value, notas: e.target.value})}
                  className="w-full bg-zinc-950/40 border border-white/5 rounded-xl px-4 py-2.5 text-xs outline-none text-white focus:border-white/20 transition-all resize-none h-16"
                  placeholder="Detalles sobre el cobro o la entrega..."
                />
              </div>

            </div>

            <div className="flex gap-3 pt-6 border-t border-white/5 mt-6">
              <button
                onClick={() => setShowIncomeForm(false)}
                className="flex-1 py-3 bg-zinc-950/40 border border-white/5 rounded-xl text-[9px] font-black uppercase tracking-widest text-neutral-400 hover:text-white transition-colors"
                disabled={incomeLoading}
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveIncome}
                className="flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                style={{ backgroundColor: t.accent, color: '#000' }}
                disabled={
                  incomeLoading || 
                  (incomeForm.categoria === 'Venta de Productos' && cart.length === 0) ||
                  (incomeForm.categoria !== 'Venta de Productos' && (!incomeForm.producto || !incomeForm.monto))
                }
              >
                {incomeLoading ? 'Registrando...' : 'Registrar Venta'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default MisEgresos;
