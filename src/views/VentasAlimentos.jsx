import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useTheme } from '../lib/theme';
import {
  UtensilsCrossed, Plus, Search, Filter, Smartphone, Check, CheckCircle2,
  AlertTriangle, DollarSign, Wallet, QrCode, HeartHandshake, Truck, MapPin,
  Share2, Copy, Trash2, Edit3, RefreshCw, X, Download, User, ShieldCheck,
  Calendar, ArrowRight, Clock, ChevronDown, Package, Settings, Sparkles, Tag
} from 'lucide-react';
import {
  getLocalCatalogo,
  saveLocalCatalogo,
  fetchRemoteCatalogo,
  calcularPrecioDinamico,
  CATALOGO_DEFAULT
} from '../lib/alimentosCatalogo';

export default function VentasAlimentos({ isDark, settings }) {
  const t = useTheme(isDark);
  
  // Pestaña activa del módulo: 'ventas' | 'catalogo'
  const [tabActual, setTabActual] = useState('ventas');

  // Estado del catálogo dinámico
  const [catalogo, setCatalogo] = useState(() => getLocalCatalogo());
  const [catalogoSaving, setCatalogoSaving] = useState(false);

  // Estados de ventas
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos'); // 'todos', 'pagados', 'fiados', 'delivery'
  const [filtroVendedor, setFiltroVendedor] = useState('todos');
  const [toastMsg, setToastMsg] = useState('');
  const [showModal, setShowModal] = useState(false);

  // Formulario manual de ventas
  const [clienteNombre, setClienteNombre] = useState('');
  const [clienteTelefono, setClienteTelefono] = useState('');
  const [vendedorNombre, setVendedorNombre] = useState('');
  const [cantidad, setCantidad] = useState(1);
  const [tipoEntrega, setTipoEntrega] = useState('recojo');
  const [costoDeliveryCliente, setCostoDeliveryCliente] = useState('15');
  const [costoDeliveryEmpresa, setCostoDeliveryEmpresa] = useState('15');
  const [direccionEntrega, setDireccionEntrega] = useState('');
  const [metodoPago, setMetodoPago] = useState('efectivo');
  const [personaFiada, setPersonaFiada] = useState('');
  const [hermanoAutoriza, setHermanoAutoriza] = useState('');
  const [fechaPagoCredito, setFechaPagoCredito] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [notas, setNotas] = useState('');
  const [savingVenta, setSavingVenta] = useState(false);

  // Formulario para nuevo plato / producto
  const [nuevoPlato, setNuevoPlato] = useState({ nombre: '', precio: 35, descripcion: '', icono: '🍛' });
  const [nuevoPaquete, setNuevoPaquete] = useState({ nombre: '', unidades: 3, precio: 100, badge: 'Promo Ahorro' });

  // Cargar ventas y catálogo
  const fetchVentas = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('ventas_alimentos_tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVentas(data || []);
    } catch (err) {
      console.warn('Error cargando ventas de Supabase, usando respaldo local:', err);
      try {
        const local = localStorage.getItem('field_sales_history_today');
        if (local) setVentas(JSON.parse(local));
      } catch {}
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVentas();
    fetchRemoteCatalogo().then(c => {
      if (c) setCatalogo(c);
    });
  }, []);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3500);
  };

  // Copiar enlace de vendedor en campo
  const handleCopyFieldLink = () => {
    const origin = window.location.origin;
    const url = `${origin}/ventas-campo`;
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(url);
      showToast('¡Enlace para vendedores copiado al portapapeles!');
    } else {
      prompt('Copia el siguiente enlace para vendedores:', url);
    }
  };

  // Guardar cambios en el catálogo
  const handleSaveCatalogo = async (newConfig) => {
    setCatalogo(newConfig);
    setCatalogoSaving(true);
    try {
      await saveLocalCatalogo(newConfig);
      showToast('¡Configuración de catálogo guardada con éxito!');
    } catch (err) {
      console.error('Error guardando catalogo:', err);
      showToast('Error al guardar catálogo.');
    } finally {
      setCatalogoSaving(false);
    }
  };

  // Agregar nuevo plato
  const handleAddPlato = (e) => {
    e.preventDefault();
    if (!nuevoPlato.nombre.trim() || !nuevoPlato.precio) {
      alert('Nombre y precio unitario son obligatorios.');
      return;
    }
    const item = {
      id: `prod_${Date.now()}`,
      nombre: nuevoPlato.nombre.trim(),
      precio: parseFloat(nuevoPlato.precio) || 35,
      descripcion: nuevoPlato.descripcion.trim(),
      icono: nuevoPlato.icono || '🍛',
      activo: true,
    };
    const updated = {
      ...catalogo,
      productos: [...(catalogo.productos || []), item],
    };
    handleSaveCatalogo(updated);
    setNuevoPlato({ nombre: '', precio: 35, descripcion: '', icono: '🍛' });
  };

  // Eliminar plato
  const handleDeletePlato = (id) => {
    if (catalogo.productos.length <= 1) {
      alert('Debe existir al menos un plato principal en el catálogo.');
      return;
    }
    const updated = {
      ...catalogo,
      productos: catalogo.productos.filter(p => p.id !== id),
    };
    handleSaveCatalogo(updated);
  };

  // Agregar nuevo paquete / combo
  const handleAddPaquete = (e) => {
    e.preventDefault();
    if (!nuevoPaquete.nombre.trim() || !nuevoPaquete.unidades || !nuevoPaquete.precio) {
      alert('Nombre, unidades y precio son obligatorios.');
      return;
    }
    const item = {
      id: `pack_${Date.now()}`,
      nombre: nuevoPaquete.nombre.trim(),
      unidades: parseInt(nuevoPaquete.unidades) || 3,
      precio: parseFloat(nuevoPaquete.precio) || 100,
      badge: nuevoPaquete.badge.trim() || 'Promo',
      activo: true,
    };
    const updated = {
      ...catalogo,
      paquetes: [...(catalogo.paquetes || []), item],
    };
    handleSaveCatalogo(updated);
    setNuevoPaquete({ nombre: '', unidades: 3, precio: 100, badge: 'Promo Ahorro' });
  };

  // Eliminar paquete
  const handleDeletePaquete = (id) => {
    const updated = {
      ...catalogo,
      paquetes: catalogo.paquetes.filter(p => p.id !== id),
    };
    handleSaveCatalogo(updated);
  };

  // Marcar crédito / fiado como pagado
  const handleMarcarPagado = async (venta) => {
    try {
      const { error } = await supabase
        .from('ventas_alimentos_tickets')
        .update({ estado_credito: 'pagado', fecha_pago_credito: new Date().toISOString().split('T')[0] })
        .eq('id', venta.id);

      if (error) throw error;
      showToast(`¡Crédito de ${venta.cliente_nombre} marcado como PAGADO!`);
      setVentas(prev => prev.map(v => v.id === venta.id ? { ...v, estado_credito: 'pagado' } : v));
    } catch (err) {
      console.error('Error al actualizar crédito:', err);
      showToast('Error al actualizar en la base de datos.');
    }
  };

  // Eliminar venta
  const handleDeleteVenta = async (venta) => {
    if (!window.confirm(`¿Eliminar la venta #${venta.numero_ticket} de ${venta.cliente_nombre}?`)) return;
    try {
      const { error } = await supabase
        .from('ventas_alimentos_tickets')
        .delete()
        .eq('id', venta.id);

      if (error) throw error;
      setVentas(prev => prev.filter(v => v.id !== venta.id));
      showToast('Venta eliminada correctamente.');
    } catch (err) {
      console.error('Error al eliminar venta:', err);
      showToast('Error al eliminar venta.');
    }
  };

  // Guardar venta manual
  const handleSaveManual = async (e) => {
    e.preventDefault();
    if (!clienteNombre.trim() || !vendedorNombre.trim()) {
      alert('Nombre de cliente y vendedor son obligatorios.');
      return;
    }

    const calc = calcularPrecioDinamico(cantidad, catalogo);
    const extraDel = tipoEntrega === 'delivery_pagado' ? (parseFloat(costoDeliveryCliente) || 0) : 0;
    const total = calc.subtotal + extraDel;
    const packCount = (calc.packsAplicados && calc.packsAplicados.length > 0) ? calc.packsAplicados[0].count : 0;

    setSavingVenta(true);
    try {
      const ticketNum = `TICK-${Date.now().toString().slice(-6)}`;
      const payload = {
        numero_ticket: ticketNum,
        cliente_nombre: clienteNombre.trim(),
        cliente_telefono: clienteTelefono.trim(),
        vendedor_nombre: vendedorNombre.trim(),
        cantidad_unidades: cantidad,
        paquetes_3: packCount,
        unidades_sueltas: calc.sueltas || 0,
        monto_subtotal: calc.subtotal,
        monto_total: total,
        metodo_pago: metodoPago,
        es_credito: metodoPago === 'credito',
        persona_fiada: metodoPago === 'credito' ? personaFiada.trim() : null,
        hermano_autoriza: metodoPago === 'credito' ? hermanoAutoriza.trim() : null,
        estado_credito: metodoPago === 'credito' ? 'pendiente' : 'pagado',
        fecha_pago_credito: metodoPago === 'credito' ? fechaPagoCredito : null,
        tipo_entrega: tipoEntrega,
        costo_delivery_cliente: tipoEntrega === 'delivery_pagado' ? (parseFloat(costoDeliveryCliente) || 0) : 0,
        costo_delivery_empresa: tipoEntrega === 'delivery_gratuito' ? (parseFloat(costoDeliveryEmpresa) || 0) : 0,
        direccion_entrega: direccionEntrega.trim(),
        notas: notas.trim(),
        estado: 'completado'
      };

      const { data, error } = await supabase
        .from('ventas_alimentos_tickets')
        .insert([payload])
        .select()
        .single();

      if (error) throw error;
      setVentas(prev => [data || payload, ...prev]);
      setShowModal(false);
      showToast('¡Venta registrada con éxito!');

      // Reset form
      setClienteNombre('');
      setClienteTelefono('');
      setCantidad(1);
      setDireccionEntrega('');
      setNotas('');
      setPersonaFiada('');
      setHermanoAutoriza('');
    } catch (err) {
      console.error('Error guardando venta manual:', err);
      showToast('Error al guardar en Supabase.');
    } finally {
      setSavingVenta(false);
    }
  };

  // Cálculos y Métricas
  const stats = useMemo(() => {
    let totalRecaudado = 0;
    let totalPlatos = 0;
    let totalFiadoPendiente = 0;
    let totalCostoDelivery = 0;

    ventas.forEach(v => {
      const tot = parseFloat(v.monto_total) || 0;
      const cant = parseInt(v.cantidad_unidades) || 0;
      totalPlatos += cant;

      if (v.es_credito && v.estado_credito === 'pendiente') {
        totalFiadoPendiente += tot;
      } else {
        totalRecaudado += tot;
      }

      totalCostoDelivery += (parseFloat(v.costo_delivery_cliente) || 0) + (parseFloat(v.costo_delivery_empresa) || 0);
    });

    return { totalRecaudado, totalPlatos, totalFiadoPendiente, totalCostoDelivery };
  }, [ventas]);

  // Lista única de vendedores para filtros
  const vendedoresList = useMemo(() => {
    const set = new Set();
    ventas.forEach(v => { if (v.vendedor_nombre) set.add(v.vendedor_nombre.trim()); });
    return Array.from(set);
  }, [ventas]);

  // Filtrado de ventas
  const ventasFiltradas = useMemo(() => {
    return ventas.filter(v => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchCliente = (v.cliente_nombre || '').toLowerCase().includes(q);
        const matchVendedor = (v.vendedor_nombre || '').toLowerCase().includes(q);
        const matchTicket = (v.numero_ticket || '').toLowerCase().includes(q);
        const matchFiado = (v.persona_fiada || '').toLowerCase().includes(q);
        if (!matchCliente && !matchVendedor && !matchTicket && !matchFiado) return false;
      }

      if (filtroVendedor !== 'todos' && v.vendedor_nombre !== filtroVendedor) return false;

      if (filtroEstado === 'pagados' && (v.es_credito && v.estado_credito === 'pendiente')) return false;
      if (filtroEstado === 'fiados' && (!v.es_credito || v.estado_credito === 'pagado')) return false;
      if (filtroEstado === 'delivery' && v.tipo_entrega === 'recojo') return false;

      return true;
    });
  }, [ventas, searchQuery, filtroEstado, filtroVendedor]);

  const modalCalc = useMemo(() => calcularPrecioDinamico(cantidad, catalogo), [cantidad, catalogo]);
  const modalDeliveryExtra = tipoEntrega === 'delivery_pagado' ? (parseFloat(costoDeliveryCliente) || 0) : 0;
  const modalTotal = modalCalc.subtotal + modalDeliveryExtra;

  return (
    <div className="flex flex-col h-full w-full animate-in fade-in duration-300 p-2 md:p-6 space-y-6">
      
      {/* Toast */}
      {toastMsg && (
        <div className="fixed top-6 right-6 z-50 p-4 rounded-2xl bg-emerald-500 text-neutral-950 font-black text-xs shadow-2xl animate-in slide-in-from-top-4 flex items-center gap-2">
          <CheckCircle2 size={16} />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* ─── CABECERA PRINCIPAL LIQUID GLASS ─── */}
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-neutral-950 font-black shadow-lg shadow-emerald-500/20">
              <UtensilsCrossed size={20} />
            </div>
            <div>
              <h1 style={{ color: t.text }} className="text-xl font-black tracking-tight m-0 leading-none">
                Ventas de Alimentos & Tickets
              </h1>
              <p style={{ color: t.textDim }} className="text-xs font-semibold mt-1 m-0">
                Gestión integral de preventa, catálogo dinámico, vendedores y fiados
              </p>
            </div>
          </div>
        </div>

        {/* Botones de Cabecera y Selector de Pestañas */}
        <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
          {/* Switcher de Sub-Pestañas */}
          <div className="flex p-1 rounded-xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl">
            <button
              onClick={() => setTabActual('ventas')}
              className={`py-2 px-3.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 ${
                tabActual === 'ventas' ? 'bg-emerald-500 text-neutral-950 shadow-md' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <UtensilsCrossed size={14} /> Panel Ventas
            </button>
            <button
              onClick={() => setTabActual('catalogo')}
              className={`py-2 px-3.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 ${
                tabActual === 'catalogo' ? 'bg-sky-500 text-neutral-950 shadow-md' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Settings size={14} /> Catálogo & Paquetes
            </button>
          </div>

          {/* Botón Copiar Enlace Vendedores */}
          <button
            onClick={handleCopyFieldLink}
            style={{ backgroundColor: t.panel, border: `1px solid ${t.border}`, color: t.text }}
            className="py-2.5 px-3.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-white/[0.08] transition-all shadow-sm backdrop-blur-xl"
            title="Copiar enlace restringido para vendedores en la calle (/ventas-campo)"
          >
            <Share2 size={15} className="text-emerald-400" />
            <span className="hidden sm:inline">Enlace Campo</span>
          </button>

          {/* Botón Nueva Venta Manual */}
          <button
            onClick={() => setShowModal(true)}
            className="py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
          >
            <Plus size={16} strokeWidth={3} />
            <span>Nueva Venta</span>
          </button>
        </div>
      </header>

      {tabActual === 'ventas' ? (
        <>
          {/* ─── INDICADORES FINANCIEROS (4 KPIs EN 1 FILA COMPACTA) ─── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div
              className="p-4 rounded-2xl space-y-1 shadow-sm transition-all"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <div className="flex items-center justify-between text-neutral-400">
                <span className="text-[10px] font-black uppercase tracking-wider">Total Recaudado</span>
                <DollarSign size={16} className="text-emerald-400" />
              </div>
              <p className="text-2xl font-black font-mono text-emerald-400 m-0">
                {stats.totalRecaudado.toLocaleString()} <span className="text-xs text-neutral-400">BOB</span>
              </p>
              <span className="text-[10px] text-neutral-500 font-bold">Efectivo + QR cobrado</span>
            </div>

            <div
              className="p-4 rounded-2xl space-y-1 shadow-sm transition-all"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <div className="flex items-center justify-between text-neutral-400">
                <span className="text-[10px] font-black uppercase tracking-wider">Platos Vendidos</span>
                <UtensilsCrossed size={16} className="text-sky-400" />
              </div>
              <p className="text-2xl font-black font-mono text-white m-0">
                {stats.totalPlatos.toLocaleString()} <span className="text-xs text-neutral-400">unidades</span>
              </p>
              <span className="text-[10px] text-neutral-500 font-bold">Total despachado</span>
            </div>

            <div
              className="p-4 rounded-2xl space-y-1 shadow-sm transition-all"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <div className="flex items-center justify-between text-neutral-400">
                <span className="text-[10px] font-black uppercase tracking-wider">Fiados Pendientes</span>
                <HeartHandshake size={16} className="text-amber-400" />
              </div>
              <p className="text-2xl font-black font-mono text-amber-400 m-0">
                {stats.totalFiadoPendiente.toLocaleString()} <span className="text-xs text-neutral-400">BOB</span>
              </p>
              <span className="text-[10px] text-neutral-500 font-bold">Créditos por cobrar</span>
            </div>

            <div
              className="p-4 rounded-2xl space-y-1 shadow-sm transition-all"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <div className="flex items-center justify-between text-neutral-400">
                <span className="text-[10px] font-black uppercase tracking-wider">Deliveries</span>
                <Truck size={16} className="text-purple-400" />
              </div>
              <p className="text-2xl font-black font-mono text-purple-400 m-0">
                {stats.totalCostoDelivery.toLocaleString()} <span className="text-xs text-neutral-400">BOB</span>
              </p>
              <span className="text-[10px] text-neutral-500 font-bold">Costo logístico global</span>
            </div>
          </div>

          {/* ─── FILTROS Y BÚSQUEDA MINIMALISTA ─── */}
          <div className="space-y-3">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              {/* Buscador minimalista sin lupa */}
              <div className="relative flex-1 max-w-md">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Buscar por cliente, vendedor o # ticket..."
                  style={{ backgroundColor: t.panel, border: `1px solid ${t.border}`, color: t.text }}
                  className="w-full px-4 py-2.5 rounded-xl text-xs placeholder-neutral-500 focus:border-emerald-500 outline-none transition-all shadow-inner"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white p-1">
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Filtro por Vendedor */}
              {vendedoresList.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-neutral-400">Vendedor:</span>
                  <select
                    value={filtroVendedor}
                    onChange={e => setFiltroVendedor(e.target.value)}
                    style={{ backgroundColor: t.panel, border: `1px solid ${t.border}`, color: t.text }}
                    className="px-3 py-2 rounded-xl text-xs font-semibold outline-none"
                  >
                    <option value="todos">Todos los vendedores</option>
                    {vendedoresList.map(v => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Chips de Filtro Rápido en 1 Sola Línea Continua */}
            <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap scrollbar-none py-1 w-full">
              {[
                { id: 'todos', label: `Todos (${ventas.length})` },
                { id: 'pagados', label: `Pagados (${ventas.filter(v => !v.es_credito || v.estado_credito === 'pagado').length})` },
                { id: 'fiados', label: `Fiados Pendientes (${ventas.filter(v => v.es_credito && v.estado_credito === 'pendiente').length})` },
                { id: 'delivery', label: `Con Delivery (${ventas.filter(v => v.tipo_entrega !== 'recojo').length})` },
              ].map(chip => (
                <button
                  key={chip.id}
                  onClick={() => setFiltroEstado(chip.id)}
                  className={`py-1.5 px-3.5 rounded-xl text-xs font-bold transition-all border shrink-0 ${
                    filtroEstado === chip.id
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                      : 'bg-white/[0.02] hover:bg-white/[0.05] text-neutral-400 border-white/[0.06]'
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          {/* ─── LISTADO DE VENTAS / TICKETS ─── */}
          <div
            className="rounded-2xl overflow-hidden shadow-2xl transition-all"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            {loading ? (
              <div className="p-12 text-center text-neutral-400 text-xs">
                <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-emerald-400" />
                Cargando tickets de venta...
              </div>
            ) : ventasFiltradas.length === 0 ? (
              <div className="p-12 text-center text-neutral-500 text-xs space-y-2">
                <UtensilsCrossed size={32} className="mx-auto opacity-30 text-neutral-400" />
                <p className="m-0 font-semibold">No se encontraron registros de ventas.</p>
                <p className="text-[10px] text-neutral-600 m-0">Comparte el enlace /ventas-campo con tus vendedores o registra una venta con el botón superior.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${t.border}` }} className="text-[10px] uppercase font-black tracking-wider text-neutral-400 bg-white/[0.01]">
                      <th className="py-3 px-4">Ticket / Fecha</th>
                      <th className="py-3 px-4">Cliente / Contacto</th>
                      <th className="py-3 px-4">Vendedor</th>
                      <th className="py-3 px-4">Pedido / Entrega</th>
                      <th className="py-3 px-4 text-right">Total</th>
                      <th className="py-3 px-4 text-center">Estado / Pago</th>
                      <th className="py-3 px-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04] text-xs">
                    {ventasFiltradas.map(v => {
                      const esFiadoPendiente = v.es_credito && v.estado_credito === 'pendiente';
                      return (
                        <tr key={v.id} className="hover:bg-white/[0.02] transition-colors">
                          {/* Ticket / Fecha */}
                          <td className="py-3.5 px-4">
                            <span className="font-mono font-bold text-white block">#{v.numero_ticket || 'TICK'}</span>
                            <span className="text-[10px] text-neutral-500">
                              {new Date(v.created_at || Date.now()).toLocaleDateString([], { day: '2-digit', month: 'short' })} · {new Date(v.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </td>

                          {/* Cliente */}
                          <td className="py-3.5 px-4">
                            <span className="font-bold text-white block">{v.cliente_nombre}</span>
                            {v.cliente_telefono && (
                              <span className="text-[10px] text-neutral-400 font-mono flex items-center gap-1">
                                <Smartphone size={10} /> {v.cliente_telefono}
                              </span>
                            )}
                          </td>

                          {/* Vendedor */}
                          <td className="py-3.5 px-4">
                            <span className="px-2 py-0.5 rounded-lg bg-white/[0.06] text-neutral-300 text-[11px] font-semibold">
                              {v.vendedor_nombre}
                            </span>
                          </td>

                          {/* Pedido / Entrega */}
                          <td className="py-3.5 px-4">
                            <span className="font-bold text-white block">
                              {v.cantidad_unidades} plato(s) {v.paquetes_3 > 0 && `(${v.paquetes_3} pack)`}
                            </span>
                            <span className="text-[10px] text-neutral-400 flex items-center gap-1 mt-0.5">
                              {v.tipo_entrega === 'recojo' ? (
                                <><MapPin size={10} /> Recojo</>
                              ) : (
                                <><Truck size={10} className="text-purple-400" /> Delivery {v.costo_delivery_cliente > 0 ? `(+${v.costo_delivery_cliente} Bs)` : '(Gratis)'}</>
                              )}
                            </span>
                            {v.direccion_entrega && (
                              <span className="text-[9px] text-neutral-500 block truncate max-w-[180px]">
                                {v.direccion_entrega}
                              </span>
                            )}
                          </td>

                          {/* Total */}
                          <td className="py-3.5 px-4 text-right">
                            <span className="font-black font-mono text-sm text-emerald-400 block">
                              {v.monto_total} BOB
                            </span>
                          </td>

                          {/* Estado / Pago */}
                          <td className="py-3.5 px-4 text-center">
                            {esFiadoPendiente ? (
                              <div className="inline-flex flex-col items-center">
                                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-black uppercase">
                                  Fiado Pendiente
                                </span>
                                <span className="text-[9px] text-amber-400/80 mt-0.5">
                                  Aut: {v.hermano_autoriza}
                                </span>
                              </div>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 text-[10px] font-black uppercase">
                                {v.es_credito ? 'Fiado Pagado' : v.metodo_pago === 'qr_transferencia' ? 'QR / Transf' : 'Efectivo'}
                              </span>
                            )}
                          </td>

                          {/* Acciones */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Botón Marcar Pagado si es fiado pendiente */}
                              {esFiadoPendiente && (
                                <button
                                  onClick={() => handleMarcarPagado(v)}
                                  className="py-1 px-2.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[10px] font-black flex items-center gap-1 border border-emerald-500/30 transition-all"
                                  title="Marcar crédito como cobrado"
                                >
                                  <Check size={12} /> Cobrar
                                </button>
                              )}

                              {/* WhatsApp */}
                              {v.cliente_telefono && (
                                <button
                                  onClick={() => {
                                    const phone = (v.cliente_telefono || '').replace(/\D/g, '');
                                    const text = `🎟️ *COMPROBANTE TICKET #${v.numero_ticket}*\n👤 Cliente: ${v.cliente_nombre}\n🍽️ Pedido: ${v.cantidad_unidades} plato(s)\n💰 Total: *${v.monto_total} BOB*\n💳 Pago: ${v.es_credito ? 'Fiado (Autorizado por ' + v.hermano_autoriza + ')' : v.metodo_pago}`;
                                    window.open(`https://wa.me/${phone.startsWith('591') ? phone : '591' + phone}?text=${encodeURIComponent(text)}`, '_blank');
                                  }}
                                  className="p-1.5 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-400"
                                  title="Enviar comprobante WhatsApp"
                                >
                                  <Smartphone size={14} />
                                </button>
                              )}

                              {/* Eliminar */}
                              <button
                                onClick={() => handleDeleteVenta(v)}
                                className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400"
                                title="Eliminar registro"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : (
        /* ─── 9. MÓDULO DE GESTIÓN DE CATÁLOGO & PAQUETES DINÁMICOS ─── */
        <div className="space-y-6 animate-in fade-in">
          <div className="p-4 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-300 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-sky-400" />
              <span>
                Cualquier plato o paquete que configures aquí se reflejará en tiempo real en el portal de vendedores en campo (<strong>/ventas-campo</strong>).
              </span>
            </div>
            {catalogoSaving && <span className="font-bold text-sky-400 animate-pulse">Guardando...</span>}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* SECCIÓN 1: PLATOS INDIVIDUALES */}
            <div
              className="p-5 rounded-2xl space-y-4 shadow-xl"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <UtensilsCrossed size={18} className="text-emerald-400" />
                  <h3 className="text-sm font-black text-white uppercase tracking-wider m-0">
                    Platos Individuales ({catalogo.productos?.length || 0})
                  </h3>
                </div>
              </div>

              {/* Lista de Platos */}
              <div className="space-y-2.5">
                {(catalogo.productos || []).map((p) => (
                  <div
                    key={p.id}
                    className="p-3.5 rounded-xl bg-black/40 border border-white/[0.06] flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-xl">{p.icono || '🍛'}</span>
                      <div>
                        <p className="text-xs font-black text-white m-0 truncate">{p.nombre}</p>
                        <p className="text-[10px] text-neutral-400 m-0">{p.descripcion || 'Plato estándar'}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-sm font-black font-mono text-emerald-400">{p.precio} BOB</span>
                      <button
                        onClick={() => handleDeletePlato(p.id)}
                        className="text-neutral-500 hover:text-red-400 p-1"
                        title="Eliminar plato"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Formulario Agregar Plato */}
              <form onSubmit={handleAddPlato} className="pt-3 border-t border-white/[0.06] space-y-3">
                <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400 block">
                  + Agregar Nuevo Plato
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Nombre del plato..."
                    value={nuevoPlato.nombre}
                    onChange={e => setNuevoPlato({ ...nuevoPlato, nombre: e.target.value })}
                    className="col-span-2 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs text-white outline-none"
                  />
                  <input
                    type="number"
                    required
                    placeholder="Precio (Bs)"
                    value={nuevoPlato.precio}
                    onChange={e => setNuevoPlato({ ...nuevoPlato, precio: e.target.value })}
                    className="px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs text-white font-mono outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-md"
                >
                  <Plus size={15} strokeWidth={3} /> Agregar Plato al Catálogo
                </button>
              </form>
            </div>

            {/* SECCIÓN 2: PAQUETES & COMBOS PROMOCIONALES */}
            <div
              className="p-5 rounded-2xl space-y-4 shadow-xl"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <Package size={18} className="text-amber-400" />
                  <h3 className="text-sm font-black text-white uppercase tracking-wider m-0">
                    Paquetes & Combos ({catalogo.paquetes?.length || 0})
                  </h3>
                </div>
              </div>

              {/* Lista de Paquetes */}
              <div className="space-y-2.5">
                {(catalogo.paquetes || []).map((pkg) => (
                  <div
                    key={pkg.id}
                    className="p-3.5 rounded-xl bg-black/40 border border-white/[0.06] flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-black text-white m-0 truncate">{pkg.nombre}</p>
                        {pkg.badge && (
                          <span className="text-[8px] font-black px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            {pkg.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-neutral-400 m-0">Contiene {pkg.unidades} platos</p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-sm font-black font-mono text-amber-400">{pkg.precio} BOB</span>
                      <button
                        onClick={() => handleDeletePaquete(pkg.id)}
                        className="text-neutral-500 hover:text-red-400 p-1"
                        title="Eliminar paquete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Formulario Agregar Paquete */}
              <form onSubmit={handleAddPaquete} className="pt-3 border-t border-white/[0.06] space-y-3">
                <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400 block">
                  + Agregar Nuevo Paquete Promocional
                </span>
                <input
                  type="text"
                  required
                  placeholder="Nombre (ej: Combo Familiar de 3)..."
                  value={nuevoPaquete.nombre}
                  onChange={e => setNuevoPaquete({ ...nuevoPaquete, nombre: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs text-white outline-none"
                />
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="number"
                    required
                    placeholder="Unidades (ej: 3)"
                    value={nuevoPaquete.unidades}
                    onChange={e => setNuevoPaquete({ ...nuevoPaquete, unidades: e.target.value })}
                    className="px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs text-white font-mono outline-none"
                  />
                  <input
                    type="number"
                    required
                    placeholder="Precio Total (Bs)"
                    value={nuevoPaquete.precio}
                    onChange={e => setNuevoPaquete({ ...nuevoPaquete, precio: e.target.value })}
                    className="px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs text-white font-mono outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Etiqueta (-5 Bs)"
                    value={nuevoPaquete.badge}
                    onChange={e => setNuevoPaquete({ ...nuevoPaquete, badge: e.target.value })}
                    className="px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs text-white outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-md"
                >
                  <Plus size={15} strokeWidth={3} /> Agregar Paquete al Catálogo
                </button>
              </form>
            </div>

          </div>
        </div>
      )}

      {/* ─── MODAL DE REGISTRO MANUAL DE VENTAS ─── */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div
            className="w-full max-w-md rounded-3xl border border-white/[0.1] p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto"
            style={{
              background: '#141418',
            }}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <UtensilsCrossed size={18} className="text-emerald-400" />
                <h3 className="text-sm font-black text-white uppercase tracking-wider m-0">Registrar Venta de Alimentos</h3>
              </div>
              <button onClick={() => setShowModal(false)} className="text-neutral-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveManual} className="space-y-3.5">
              
              {/* Opciones del Catálogo */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setCantidad(1)}
                  className={`p-2.5 rounded-xl border text-left ${cantidad === 1 ? 'bg-emerald-500/20 border-emerald-500 text-white' : 'bg-black/30 border-white/[0.06] text-neutral-400'}`}
                >
                  <p className="text-[11px] font-black m-0">1 Unidad</p>
                  <p className="text-sm font-mono font-black text-emerald-400 m-0">{modalCalc.basePrice || 35} Bs</p>
                </button>
                {catalogo.paquetes?.[0] ? (
                  <button
                    type="button"
                    onClick={() => setCantidad(parseInt(catalogo.paquetes[0].unidades) || 3)}
                    className={`p-2.5 rounded-xl border text-left ${cantidad === parseInt(catalogo.paquetes[0].unidades) ? 'bg-emerald-500/20 border-emerald-500 text-white' : 'bg-black/30 border-white/[0.06] text-neutral-400'}`}
                  >
                    <p className="text-[11px] font-black m-0">{catalogo.paquetes[0].nombre}</p>
                    <p className="text-sm font-mono font-black text-amber-400 m-0">{catalogo.paquetes[0].precio} Bs</p>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setCantidad(3)}
                    className="p-2.5 rounded-xl border text-left bg-black/30 border-white/[0.06] text-neutral-400"
                  >
                    <p className="text-[11px] font-black m-0">3 Unidades</p>
                    <p className="text-sm font-mono font-black text-amber-400 m-0">105 Bs</p>
                  </button>
                )}
              </div>

              {/* Cantidad Stepper */}
              <div>
                <label className="text-[9px] font-bold text-neutral-400 uppercase block mb-1">Cantidad de Platos</label>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => setCantidad(c => Math.max(1, c - 1))} className="px-3 py-1.5 rounded-lg bg-white/[0.06] text-white font-bold">-</button>
                  <span className="flex-1 text-center font-black font-mono text-white text-base">{cantidad} platos = {modalTotal} BOB</span>
                  <button type="button" onClick={() => setCantidad(c => c + 1)} className="px-3 py-1.5 rounded-lg bg-emerald-500 text-neutral-950 font-black">+</button>
                </div>
              </div>

              {/* Vendedor */}
              <div>
                <label className="text-[9px] font-bold text-neutral-400 uppercase block mb-1">Vendedor Responsable *</label>
                <input
                  type="text"
                  required
                  value={vendedorNombre}
                  onChange={e => setVendedorNombre(e.target.value)}
                  placeholder="Nombre del vendedor..."
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/[0.08] text-xs text-white outline-none"
                />
              </div>

              {/* Cliente */}
              <div>
                <label className="text-[9px] font-bold text-neutral-400 uppercase block mb-1">Nombre del Cliente *</label>
                <input
                  type="text"
                  required
                  value={clienteNombre}
                  onChange={e => setClienteNombre(e.target.value)}
                  placeholder="Nombre y Apellido..."
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/[0.08] text-xs text-white outline-none"
                />
              </div>

              {/* WhatsApp */}
              <div>
                <label className="text-[9px] font-bold text-neutral-400 uppercase block mb-1">WhatsApp</label>
                <input
                  type="tel"
                  value={clienteTelefono}
                  onChange={e => setClienteTelefono(e.target.value)}
                  placeholder="Ej: 71234567"
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/[0.08] text-xs text-white outline-none"
                />
              </div>

              {/* Entrega */}
              <div>
                <label className="text-[9px] font-bold text-neutral-400 uppercase block mb-1">Tipo de Entrega</label>
                <select
                  value={tipoEntrega}
                  onChange={e => setTipoEntrega(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/[0.08] text-xs text-white outline-none"
                >
                  <option value="recojo">Recojo en Punto (0 Bs)</option>
                  <option value="delivery_pagado">Delivery Pagado (+15 Bs)</option>
                  <option value="delivery_gratuito">Delivery Gratuito (Absorbido)</option>
                </select>
              </div>

              {/* Forma de Pago */}
              <div>
                <label className="text-[9px] font-bold text-neutral-400 uppercase block mb-1">Método de Pago</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'efectivo', label: 'Efectivo' },
                    { id: 'qr_transferencia', label: 'QR' },
                    { id: 'credito', label: 'Fiado' },
                  ].map(m => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setMetodoPago(m.id)}
                      className={`py-2 rounded-lg text-xs font-bold border ${metodoPago === m.id ? 'bg-emerald-500/20 border-emerald-500 text-white' : 'bg-black/30 border-white/[0.06] text-neutral-400'}`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Campos de Fiado */}
              {metodoPago === 'credito' && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                  <input
                    type="text"
                    required
                    value={personaFiada}
                    onChange={e => setPersonaFiada(e.target.value)}
                    placeholder="Persona que se fía..."
                    className="w-full px-3 py-1.5 rounded-lg bg-black/40 border border-amber-500/30 text-xs text-white outline-none"
                  />
                  <input
                    type="text"
                    required
                    value={hermanoAutoriza}
                    onChange={e => setHermanoAutoriza(e.target.value)}
                    placeholder="Hermano que autoriza el crédito..."
                    className="w-full px-3 py-1.5 rounded-lg bg-black/40 border border-amber-500/30 text-xs text-white outline-none"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={savingVenta}
                className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-black text-xs uppercase tracking-wider mt-2 flex items-center justify-center gap-2"
              >
                {savingVenta ? 'Guardando...' : `Confirmar Venta (${modalTotal} BOB)`}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
