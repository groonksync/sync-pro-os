import React, { useState, useMemo, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import {
  UtensilsCrossed, Plus, Minus, Check, CheckCircle2, Smartphone,
  User, ShieldCheck, MapPin, Truck, AlertTriangle, MessageCircle,
  Clock, DollarSign, Wallet, QrCode, RefreshCw, Sparkles, ChevronDown,
  History, ArrowRight, HeartHandshake, FileText, Share2
} from 'lucide-react';

const PRECIO_UNITARIO = 35; // 1 plato = 35 Bs
const PRECIO_PACK_3 = 100;  // 3 platos = 100 Bs

// Función que optimiza el cálculo de precio según paquetes de 3
export function calcularPrecioOptimo(totalUnidades) {
  const unidades = Math.max(0, parseInt(totalUnidades) || 0);
  const packs3 = Math.floor(unidades / 3);
  const sueltas = unidades % 3;
  const subtotal = (packs3 * PRECIO_PACK_3) + (sueltas * PRECIO_UNITARIO);
  const ahorro = (unidades * PRECIO_UNITARIO) - subtotal;
  return { unidades, packs3, sueltas, subtotal, ahorro };
}

export default function FieldSalesPortal() {
  // Estado de sesión y memoria de vendedor
  const [vendedor, setVendedor] = useState(() => localStorage.getItem('field_seller_name') || '');
  const [vista, setVista] = useState('formulario'); // 'formulario' | 'historial'

  // Datos del pedido
  const [cantidad, setCantidad] = useState(1);
  const [clienteNombre, setClienteNombre] = useState('');
  const [clienteTelefono, setClienteTelefono] = useState('');
  const [tipoEntrega, setTipoEntrega] = useState('recojo'); // 'recojo', 'delivery_pagado', 'delivery_gratuito'
  const [costoDeliveryCliente, setCostoDeliveryCliente] = useState('15');
  const [costoDeliveryEmpresa, setCostoDeliveryEmpresa] = useState('15');
  const [direccionEntrega, setDireccionEntrega] = useState('');
  
  // Método de pago y sección a crédito
  const [metodoPago, setMetodoPago] = useState('efectivo'); // 'efectivo', 'qr_transferencia', 'credito'
  const [personaFiada, setPersonaFiada] = useState('');
  const [hermanoAutoriza, setHermanoAutoriza] = useState('');
  const [fechaPagoCredito, setFechaPagoCredito] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [notas, setNotas] = useState('');

  // Estados de control
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [ventaExitosa, setVentaExitosa] = useState(null);
  const [misVentasHoy, setMisVentasHoy] = useState(() => {
    try {
      const saved = localStorage.getItem('field_sales_history_today');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Guardar vendedor en memoria
  useEffect(() => {
    if (vendedor.trim()) {
      localStorage.setItem('field_seller_name', vendedor.trim());
    }
  }, [vendedor]);

  // Cálculos automáticos de precio
  const { packs3, sueltas, subtotal, ahorro } = useMemo(() => calcularPrecioOptimo(cantidad), [cantidad]);
  
  const deliveryExtra = tipoEntrega === 'delivery_pagado' ? (parseFloat(costoDeliveryCliente) || 0) : 0;
  const totalPagar = subtotal + deliveryExtra;

  // Registrar venta
  const handleSubmit = async (e) => {
    e?.preventDefault();
    setErrorMsg('');

    if (!vendedor.trim()) {
      setErrorMsg('Por favor ingresa tu nombre de vendedor responsable.');
      return;
    }
    if (!clienteNombre.trim()) {
      setErrorMsg('Por favor ingresa el nombre del cliente.');
      return;
    }
    if (cantidad < 1) {
      setErrorMsg('La cantidad mínima es 1 plato.');
      return;
    }
    if (metodoPago === 'credito') {
      if (!personaFiada.trim()) {
        setErrorMsg('Debes especificar el nombre de la persona que se fía.');
        return;
      }
      if (!hermanoAutoriza.trim()) {
        setErrorMsg('Debes especificar el hermano que autoriza el crédito.');
        return;
      }
    }

    setLoading(true);

    try {
      const ticketNum = `TICK-${Date.now().toString().slice(-6)}`;
      const ventaData = {
        numero_ticket: ticketNum,
        cliente_nombre: clienteNombre.trim(),
        cliente_telefono: clienteTelefono.trim(),
        vendedor_nombre: vendedor.trim(),
        cantidad_unidades: cantidad,
        paquetes_3: packs3,
        unidades_sueltas: sueltas,
        monto_subtotal: subtotal,
        monto_total: totalPagar,
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

      // Guardar en Supabase
      const { data, error } = await supabase
        .from('ventas_alimentos_tickets')
        .insert([ventaData])
        .select()
        .single();

      const savedTicket = data || { ...ventaData, id: Date.now().toString(), created_at: new Date().toISOString() };

      // Guardar en historial local
      const nuevoHistorial = [savedTicket, ...misVentasHoy];
      setMisVentasHoy(nuevoHistorial);
      try {
        localStorage.setItem('field_sales_history_today', JSON.stringify(nuevoHistorial));
      } catch (err) {
        console.warn('Storage limit reached', err);
      }

      // Mostrar modal de éxito
      setVentaExitosa(savedTicket);

      // Resetear campos del pedido (conservando vendedor)
      setCantidad(1);
      setClienteNombre('');
      setClienteTelefono('');
      setDireccionEntrega('');
      setNotas('');
      setPersonaFiada('');
      setHermanoAutoriza('');
      setMetodoPago('efectivo');
      setTipoEntrega('recojo');

    } catch (err) {
      console.error('Error al registrar venta:', err);
      setErrorMsg('No se pudo guardar la venta en el servidor. Verifica tu conexión a internet.');
    } finally {
      setLoading(false);
    }
  };

  // Generador de mensaje de WhatsApp para el cliente
  const handleSendWhatsAppTicket = (ticket) => {
    if (!ticket) return;
    const phone = (ticket.cliente_telefono || '').replace(/\D/g, '');
    const packText = ticket.paquetes_3 > 0 
      ? `\n🍱 *${ticket.paquetes_3} Pack(s) de 3* + *${ticket.unidades_sueltas} plato(s) suelto(s)*` 
      : `\n🍛 *${ticket.cantidad_unidades} Plato(s)*`;

    const entregaText = ticket.tipo_entrega === 'recojo' 
      ? '🏬 *Recojo en Punto*' 
      : ticket.tipo_entrega === 'delivery_pagado' 
      ? `🛵 *Delivery Pagado* (+${ticket.costo_delivery_cliente} Bs)` 
      : '🎁 *Envío Gratuito / Cortesía*';

    const pagoText = ticket.es_credito
      ? `🤝 *Venta a Crédito (Fiado)*\n👤 *A nombre de:* ${ticket.persona_fiada}\n🛡️ *Autorizado por:* ${ticket.hermano_autoriza}\n📅 *Fecha compromiso:* ${ticket.fecha_pago_credito || 'A coordinar'}`
      : ticket.metodo_pago === 'qr_transferencia'
      ? '📲 *Pagado por QR / Transferencia*'
      : '💵 *Pagado en Efectivo*';

    const text = `🎟️ *COMPROBANTE DE TICKET / VENTA DE ALIMENTOS*\n` +
      `━━━━━━━━━━━━━━━━━━━━━━\n` +
      `🔖 *Ticket:* #${ticket.numero_ticket || 'TICK'}\n` +
      `👤 *Cliente:* ${ticket.cliente_nombre}\n` +
      `🧑‍💼 *Vendedor Responsable:* ${ticket.vendedor_nombre}\n` +
      `━━━━━━━━━━━━━━━━━━━━━━\n` +
      `🍽️ *Detalle del Pedido:* ${packText}\n` +
      `🚚 *Entrega:* ${entregaText}\n` +
      (ticket.direccion_entrega ? `📍 *Dirección:* ${ticket.direccion_entrega}\n` : '') +
      `━━━━━━━━━━━━━━━━━━━━━━\n` +
      `💰 *TOTAL A PAGAR:* *${ticket.monto_total} BOB*\n` +
      `💳 *Estado / Pago:* ${pagoText}\n` +
      `━━━━━━━━━━━━━━━━━━━━━━\n` +
      `✨ _¡Muchas gracias por tu compra y bendición!_`;

    const url = phone 
      ? `https://wa.me/${phone.startsWith('591') ? phone : '591' + phone}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;

    window.open(url, '_blank');
  };

  // Totales de la sesión de hoy
  const totalRecaudadoHoy = misVentasHoy.reduce((sum, v) => sum + (parseFloat(v.monto_total) || 0), 0);
  const totalPlatosHoy = misVentasHoy.reduce((sum, v) => sum + (parseInt(v.cantidad_unidades) || 0), 0);

  return (
    <div className="min-h-screen bg-[#0A0A0C] text-[#ECECEE] font-sans selection:bg-emerald-500 selection:text-black pb-24">
      {/* ─── CABECERA EXCLUSIVA MINIMALISTA ─── */}
      <header className="sticky top-0 z-40 bg-[#121216]/90 backdrop-blur-xl border-b border-white/[0.08] px-4 py-3">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-neutral-950 font-black shadow-lg shadow-emerald-500/20">
              <UtensilsCrossed size={18} />
            </div>
            <div>
              <h1 className="text-sm font-black text-white uppercase tracking-tight flex items-center gap-1.5 m-0 leading-none">
                Ventas en Campo
              </h1>
              <p className="text-[10px] text-emerald-400 font-bold tracking-wider uppercase mt-1 m-0">
                Tickets de Alimentos
              </p>
            </div>
          </div>

          {/* Toggle de Vistas */}
          <div className="flex p-0.5 rounded-xl bg-black/40 border border-white/[0.08]">
            <button
              onClick={() => setVista('formulario')}
              className={`py-1.5 px-3 rounded-lg text-[11px] font-black transition-all ${
                vista === 'formulario' ? 'bg-emerald-500 text-neutral-950 shadow-sm' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Vender
            </button>
            <button
              onClick={() => setVista('historial')}
              className={`py-1.5 px-3 rounded-lg text-[11px] font-black transition-all flex items-center gap-1 ${
                vista === 'historial' ? 'bg-white/[0.12] text-white shadow-sm' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <History size={12} /> ({misVentasHoy.length})
            </button>
          </div>
        </div>
      </header>

      {/* ─── CONTENEDOR PRINCIPAL MOBILE-FIRST ─── */}
      <main className="max-w-md mx-auto px-4 pt-4 space-y-4">

        {/* Notificación de Error */}
        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-bold flex items-center gap-2.5 animate-in slide-in-from-top-2">
            <AlertTriangle size={18} className="shrink-0 text-red-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {vista === 'formulario' ? (
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* 1. SELECCIÓN VISUAL DE PLATOS Y PROMOCIONES */}
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-3.5 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400">
                  Opciones de Compra
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] font-black uppercase">
                  Promo 3x100 Bs
                </span>
              </div>

              {/* Botones Rápidos de Paquete */}
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setCantidad(1)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    cantidad === 1
                      ? 'bg-emerald-500/15 border-emerald-500 text-white shadow-md'
                      : 'bg-black/30 border-white/[0.06] text-neutral-300 hover:border-white/[0.15]'
                  }`}
                >
                  <p className="text-xs font-black m-0">1 Unidad</p>
                  <p className="text-base font-black text-emerald-400 font-mono m-0 mt-0.5">35 Bs</p>
                  <span className="text-[9px] text-neutral-500">Plato individual</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCantidad(3)}
                  className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden ${
                    cantidad === 3
                      ? 'bg-emerald-500/20 border-emerald-400 text-white shadow-lg'
                      : 'bg-black/30 border-white/[0.06] text-neutral-300 hover:border-white/[0.15]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-black m-0">Paquete de 3</p>
                    <span className="text-[8px] font-black px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      -5 Bs
                    </span>
                  </div>
                  <p className="text-base font-black text-amber-400 font-mono m-0 mt-0.5">100 Bs</p>
                  <span className="text-[9px] text-neutral-400">Combo familiar</span>
                </button>
              </div>

              {/* Selector de Cantidad Personalizada */}
              <div className="p-3 rounded-xl bg-black/40 border border-white/[0.06] flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-neutral-400 uppercase">Cantidad Total</span>
                  <p className="text-lg font-black text-white m-0 leading-none mt-0.5">
                    {cantidad} {cantidad === 1 ? 'Plato' : 'Platos'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCantidad(c => Math.max(1, c - 1))}
                    className="w-10 h-10 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] active:scale-90 flex items-center justify-center text-white border border-white/[0.1] transition-all"
                  >
                    <Minus size={18} />
                  </button>

                  <span className="w-10 text-center text-lg font-black font-mono text-white">
                    {cantidad}
                  </span>

                  <button
                    type="button"
                    onClick={() => setCantidad(c => c + 1)}
                    className="w-10 h-10 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-90 flex items-center justify-center text-neutral-950 font-black transition-all shadow-md"
                  >
                    <Plus size={18} strokeWidth={3} />
                  </button>
                </div>
              </div>

              {/* Presets Rápidos */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {[
                  { label: '+1 Plato', val: 1 },
                  { label: '+3 (1 Pack)', val: 3 },
                  { label: '+6 (2 Packs)', val: 6 },
                  { label: '+9 (3 Packs)', val: 9 },
                  { label: '+12 (4 Packs)', val: 12 },
                ].map(p => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => setCantidad(p.val)}
                    className={`py-1 px-2.5 rounded-lg text-[10px] font-bold shrink-0 transition-all border ${
                      cantidad === p.val
                        ? 'bg-white text-black border-white'
                        : 'bg-white/[0.04] text-neutral-400 border-white/[0.06] hover:text-white'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Desglose de Cálculo */}
              <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-xs font-mono">
                <span className="text-neutral-400 text-[11px]">
                  {packs3 > 0 && `${packs3}x Pack 3 (100 Bs)`}
                  {packs3 > 0 && sueltas > 0 && ' + '}
                  {sueltas > 0 && `${sueltas}x Suelto (35 Bs)`}
                </span>
                <span className="text-white font-black text-sm">
                  Subtotal: {subtotal} BOB
                </span>
              </div>
              {ahorro > 0 && (
                <p className="text-[10px] text-amber-400 font-bold text-right m-0">
                  🎉 Ahorro aplicado: {ahorro} Bs
                </p>
              )}
            </div>

            {/* 2. DATOS DEL CLIENTE Y VENDEDOR */}
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-3 shadow-xl">
              <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400 block">
                Datos de Venta
              </span>

              {/* Vendedor Responsable */}
              <div>
                <label className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">
                  Vendedor Responsable *
                </label>
                <div className="relative">
                  <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
                  <input
                    type="text"
                    required
                    value={vendedor}
                    onChange={e => setVendedor(e.target.value)}
                    placeholder="Tu nombre o hermano asignado..."
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-black/40 border border-white/[0.08] text-xs text-white placeholder-neutral-500 focus:border-emerald-500 focus:bg-white/[0.06] outline-none transition-all"
                  />
                </div>
              </div>

              {/* Nombre del Cliente */}
              <div>
                <label className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">
                  Nombre del Cliente *
                </label>
                <input
                  type="text"
                  required
                  value={clienteNombre}
                  onChange={e => setClienteNombre(e.target.value)}
                  placeholder="Nombre y Apellido del comprador..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/[0.08] text-xs text-white placeholder-neutral-500 focus:border-emerald-500 focus:bg-white/[0.06] outline-none transition-all"
                />
              </div>

              {/* Teléfono / WhatsApp */}
              <div>
                <label className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">
                  WhatsApp del Cliente (Para enviar ticket)
                </label>
                <div className="relative">
                  <Smartphone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
                  <input
                    type="tel"
                    value={clienteTelefono}
                    onChange={e => setClienteTelefono(e.target.value)}
                    placeholder="Ej: 71234567"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-black/40 border border-white/[0.08] text-xs text-white placeholder-neutral-500 focus:border-emerald-500 focus:bg-white/[0.06] outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            {/* 3. LOGÍSTICA Y ENTREGA */}
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-3 shadow-xl">
              <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400 block">
                Modalidad de Entrega
              </span>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'recojo', label: 'Recojo', icon: MapPin, desc: '0 Bs' },
                  { id: 'delivery_pagado', label: 'Delivery', icon: Truck, desc: `+${costoDeliveryCliente} Bs` },
                  { id: 'delivery_gratuito', label: 'Gratuito', icon: HeartHandshake, desc: 'Cortesía' },
                ].map(d => {
                  const Icon = d.icon;
                  const isSel = tipoEntrega === d.id;
                  return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => setTipoEntrega(d.id)}
                      className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1 ${
                        isSel
                          ? 'bg-emerald-500/20 border-emerald-500 text-white shadow-md'
                          : 'bg-black/30 border-white/[0.06] text-neutral-400 hover:text-white'
                      }`}
                    >
                      <Icon size={16} className={isSel ? 'text-emerald-400' : 'text-neutral-500'} />
                      <span className="text-[10px] font-black uppercase tracking-wider">{d.label}</span>
                      <span className="text-[9px] font-mono text-neutral-400">{d.desc}</span>
                    </button>
                  );
                })}
              </div>

              {/* Ajuste de costo de delivery si aplica */}
              {tipoEntrega === 'delivery_pagado' && (
                <div className="p-3 rounded-xl bg-black/40 border border-white/[0.06] space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[9px] font-bold text-neutral-400 uppercase">Costo Delivery Cliente (Bs)</label>
                    <input
                      type="number"
                      value={costoDeliveryCliente}
                      onChange={e => setCostoDeliveryCliente(e.target.value)}
                      className="w-20 px-2 py-1 rounded-lg bg-white/[0.08] border border-white/[0.1] text-xs font-mono text-right text-white outline-none"
                    />
                  </div>
                  <input
                    type="text"
                    value={direccionEntrega}
                    onChange={e => setDireccionEntrega(e.target.value)}
                    placeholder="Dirección o punto de entrega..."
                    className="w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-xs text-white placeholder-neutral-500 outline-none"
                  />
                </div>
              )}

              {tipoEntrega === 'delivery_gratuito' && (
                <div className="p-3 rounded-xl bg-black/40 border border-white/[0.06] space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[9px] font-bold text-neutral-400 uppercase">Costo Absorbido por Empresa (Bs)</label>
                    <input
                      type="number"
                      value={costoDeliveryEmpresa}
                      onChange={e => setCostoDeliveryEmpresa(e.target.value)}
                      className="w-20 px-2 py-1 rounded-lg bg-white/[0.08] border border-white/[0.1] text-xs font-mono text-right text-white outline-none"
                    />
                  </div>
                  <input
                    type="text"
                    value={direccionEntrega}
                    onChange={e => setDireccionEntrega(e.target.value)}
                    placeholder="Dirección o punto de entrega..."
                    className="w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-xs text-white placeholder-neutral-500 outline-none"
                  />
                </div>
              )}
            </div>

            {/* 4. FORMA DE PAGO & SECCIÓN DE CRÉDITO (FIADOS) */}
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-3.5 shadow-xl">
              <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400 block">
                Forma de Pago
              </span>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'efectivo', label: 'Efectivo', icon: DollarSign },
                  { id: 'qr_transferencia', label: 'QR / Banco', icon: QrCode },
                  { id: 'credito', label: 'Fiado', icon: HeartHandshake },
                ].map(m => {
                  const Icon = m.icon;
                  const isSel = metodoPago === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setMetodoPago(m.id)}
                      className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1 ${
                        isSel
                          ? m.id === 'credito'
                            ? 'bg-amber-500/20 border-amber-500 text-white shadow-md'
                            : 'bg-emerald-500/20 border-emerald-500 text-white shadow-md'
                          : 'bg-black/30 border-white/[0.06] text-neutral-400 hover:text-white'
                      }`}
                    >
                      <Icon size={16} className={isSel ? (m.id === 'credito' ? 'text-amber-400' : 'text-emerald-400') : 'text-neutral-500'} />
                      <span className="text-[10px] font-black uppercase tracking-wider">{m.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* SECCIÓN ESPECÍFICA DE CRÉDITO / FIADO */}
              {metodoPago === 'credito' && (
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-3 animate-in fade-in">
                  <div className="flex items-center gap-2 text-amber-400 text-xs font-bold">
                    <ShieldCheck size={16} />
                    <span>Control de Venta a Crédito (Fiado)</span>
                  </div>

                  <div>
                    <label className="text-[9px] font-bold text-amber-300 uppercase tracking-wider block mb-1">
                      Persona que se fía (Deudor) *
                    </label>
                    <input
                      type="text"
                      required={metodoPago === 'credito'}
                      value={personaFiada}
                      onChange={e => setPersonaFiada(e.target.value)}
                      placeholder="Nombre de la persona que recibe el plato fiado..."
                      className="w-full px-3 py-2 rounded-lg bg-black/50 border border-amber-500/30 text-xs text-white placeholder-neutral-500 outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] font-bold text-amber-300 uppercase tracking-wider block mb-1">
                      Hermano que autoriza el crédito *
                    </label>
                    <input
                      type="text"
                      required={metodoPago === 'credito'}
                      value={hermanoAutoriza}
                      onChange={e => setHermanoAutoriza(e.target.value)}
                      placeholder="Nombre del hermano que respalda / autoriza..."
                      className="w-full px-3 py-2 rounded-lg bg-black/50 border border-amber-500/30 text-xs text-white placeholder-neutral-500 outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] font-bold text-amber-300 uppercase tracking-wider block mb-1">
                      Fecha límite de compromiso de pago
                    </label>
                    <input
                      type="date"
                      value={fechaPagoCredito}
                      onChange={e => setFechaPagoCredito(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-black/50 border border-amber-500/30 text-xs text-white outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 5. NOTAS ADICIONALES */}
            <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
              <input
                type="text"
                value={notas}
                onChange={e => setNotas(e.target.value)}
                placeholder="Observaciones o notas (ej: sin picante, hora de entrega)..."
                className="w-full px-3 py-2 rounded-xl bg-transparent border-none text-xs text-white placeholder-neutral-500 outline-none"
              />
            </div>

            {/* 6. BARRA FIJA INFERIOR DE REGISTRO */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-neutral-950 font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/20 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw size={18} className="animate-spin" /> Guardando Ticket...
                  </>
                ) : (
                  <>
                    <Check size={18} strokeWidth={3} /> Registrar Venta — {totalPagar} BOB
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          /* ─── VISTA HISTORIAL DE VENTAS DE HOY ─── */
          <div className="space-y-4 animate-in fade-in">
            {/* Tarjeta de Resumen */}
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-black/40 border border-white/[0.04]">
                <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider">Total Recaudado</span>
                <p className="text-xl font-black text-emerald-400 font-mono m-0 mt-0.5">
                  {totalRecaudadoHoy} <span className="text-xs text-neutral-400">BOB</span>
                </p>
              </div>
              <div className="p-3 rounded-xl bg-black/40 border border-white/[0.04]">
                <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider">Platos Vendidos</span>
                <p className="text-xl font-black text-white font-mono m-0 mt-0.5">
                  {totalPlatosHoy} <span className="text-xs text-neutral-400">unidades</span>
                </p>
              </div>
            </div>

            {/* Lista de Tickets Registrados */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                  Tickets de Esta Sesión ({misVentasHoy.length})
                </span>
                <button
                  onClick={() => setVista('formulario')}
                  className="text-xs font-bold text-emerald-400 flex items-center gap-1 hover:underline"
                >
                  <Plus size={14} /> Nueva Venta
                </button>
              </div>

              {misVentasHoy.length === 0 ? (
                <div className="p-8 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-center text-neutral-500 text-xs">
                  Aún no has registrado ventas en esta sesión.
                </div>
              ) : (
                misVentasHoy.map((v, idx) => (
                  <div
                    key={v.id || idx}
                    className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-2 relative"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-white">{v.cliente_nombre}</span>
                          <span className="text-[9px] font-mono font-bold text-neutral-400">#{v.numero_ticket}</span>
                        </div>
                        <p className="text-[11px] text-neutral-400 m-0 mt-0.5">
                          {v.cantidad_unidades} plato(s) · {v.tipo_entrega === 'recojo' ? 'Recojo' : 'Delivery'}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-sm font-black text-emerald-400 font-mono m-0">
                          {v.monto_total} BOB
                        </p>
                        <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${
                          v.es_credito ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'
                        }`}>
                          {v.es_credito ? 'Fiado' : v.metodo_pago}
                        </span>
                      </div>
                    </div>

                    {v.es_credito && (
                      <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-300">
                        🤝 Fiado a: <strong>{v.persona_fiada}</strong> · Autoriza: <strong>{v.hermano_autoriza}</strong>
                      </div>
                    )}

                    <div className="pt-2 border-t border-white/[0.04] flex items-center justify-between">
                      <span className="text-[9px] text-neutral-500 font-mono">
                        {new Date(v.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>

                      <button
                        onClick={() => handleSendWhatsAppTicket(v)}
                        className="py-1 px-2.5 rounded-lg bg-green-500/15 hover:bg-green-500/25 text-green-400 text-[10px] font-bold flex items-center gap-1 border border-green-500/30 transition-all"
                      >
                        <Smartphone size={12} /> WhatsApp
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>

      {/* ─── MODAL DE ÉXITO & COMPROBANTE WHATSAPP ─── */}
      {ventaExitosa && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl bg-[#141418] border border-emerald-500/40 p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-300 text-center">
            
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mx-auto shadow-lg shadow-emerald-500/20">
              <CheckCircle2 size={32} />
            </div>

            <div>
              <h2 className="text-lg font-black text-white m-0">¡Venta Registrada!</h2>
              <p className="text-xs font-mono text-emerald-400 font-bold mt-1 m-0">
                Ticket #{ventaExitosa.numero_ticket}
              </p>
            </div>

            {/* Resumen Compacto */}
            <div className="p-3.5 rounded-2xl bg-black/50 border border-white/[0.06] text-left text-xs space-y-1.5 font-mono">
              <div className="flex justify-between">
                <span className="text-neutral-400">Cliente:</span>
                <span className="font-bold text-white">{ventaExitosa.cliente_nombre}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Cantidad:</span>
                <span className="font-bold text-white">{ventaExitosa.cantidad_unidades} plato(s)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Total a Cobrar:</span>
                <span className="font-black text-emerald-400">{ventaExitosa.monto_total} BOB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Método:</span>
                <span className="font-bold uppercase text-neutral-300">
                  {ventaExitosa.es_credito ? '🤝 Venta a Crédito' : ventaExitosa.metodo_pago}
                </span>
              </div>
            </div>

            {/* Acciones */}
            <div className="space-y-2 pt-2">
              <button
                onClick={() => handleSendWhatsAppTicket(ventaExitosa)}
                className="w-full py-3.5 rounded-xl bg-green-500 hover:bg-green-400 text-neutral-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-green-500/20 active:scale-95 transition-all"
              >
                <Smartphone size={16} /> Enviar Ticket por WhatsApp
              </button>

              <button
                onClick={() => setVentaExitosa(null)}
                className="w-full py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-neutral-300 font-bold text-xs transition-all"
              >
                Cerrar y Nueva Venta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
