import React, { useState, useEffect } from 'react';
import { 
  Dumbbell, Users, CreditCard, Tag, AlertTriangle, Plus, Search, 
  Calendar, Phone, ExternalLink, ArrowRight, UserPlus, CheckCircle, 
  XCircle, Filter, Sparkles, TrendingUp, AlertCircle, HeartPulse,
  DollarSign, RefreshCw, Trash2, RotateCcw, ShieldAlert, Award,
  QrCode, Receipt, Scale, Activity, ShieldCheck, Wallet, FileText,
  Check, Clock, UserCheck, UserX, ChevronRight, BarChart2, CheckCircle2,
  Zap, Ticket, Percent, Layers, Shield
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useTheme } from '../lib/theme';
import { safeDelete } from '../lib/trashService';

const COUPON_COLOR_PALETTES = [
  { border: '#10B981', bg: 'rgba(16, 185, 129, 0.06)', gradient: 'linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(16,185,129,0.02) 100%)', badgeBg: 'rgba(16, 185, 129, 0.2)', text: '#10B981' },
  { border: '#F59E0B', bg: 'rgba(245, 158, 11, 0.06)', gradient: 'linear-gradient(135deg, rgba(245,158,11,0.15) 0%, rgba(245,158,11,0.02) 100%)', badgeBg: 'rgba(245, 158, 11, 0.2)', text: '#F59E0B' },
  { border: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.06)', gradient: 'linear-gradient(135deg, rgba(139,92,246,0.15) 0%, rgba(139,92,246,0.02) 100%)', badgeBg: 'rgba(139, 92, 246, 0.2)', text: '#8B5CF6' },
  { border: '#F43F5E', bg: 'rgba(244, 63, 94, 0.06)', gradient: 'linear-gradient(135deg, rgba(244,63,94,0.15) 0%, rgba(244,63,94,0.02) 100%)', badgeBg: 'rgba(244, 63, 94, 0.2)', text: '#F43F5E' },
  { border: '#06B6D4', bg: 'rgba(6, 182, 212, 0.06)', gradient: 'linear-gradient(135deg, rgba(6,182,212,0.15) 0%, rgba(6,182,212,0.02) 100%)', badgeBg: 'rgba(6, 182, 212, 0.2)', text: '#06B6D4' }
];

const liquidGlassStyle = {
  background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.08)',
  boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
};

const inputGlassStyle = {
  backgroundColor: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '12px',
};

const SistemaGimnasio = ({ settings, isDark }) => {
  const t = useTheme(isDark);
  const [activeSubTab, setActiveSubTab] = useState('resumen');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterHealthAlerts, setFilterHealthAlerts] = useState(false);
  const [planCategoryFilter, setPlanCategoryFilter] = useState('Todos');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [miembros, setMiembros] = useState([]);
  const [planes, setPlanes] = useState([]);
  const [pagos, setPagos] = useState([]);
  const [cupones, setCupones] = useState([]);
  const [papeleraMiembros, setPapeleraMiembros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState(false);
  const [filterPaymentStatus, setFilterPaymentStatus] = useState('Todos');
  const [hoveredMiembroId, setHoveredMiembroId] = useState(null);
  
  const [checkinInput, setCheckinInput] = useState('');
  const [checkinResult, setCheckinResult] = useState(null);
  const [accesosHoy, setAccesosHoy] = useState([]);

  const [selectedMiembro360, setSelectedMiembro360] = useState(null);
  const [progresosFisicos, setProgresosFisicos] = useState([]);
  const [newProgreso, setNewProgreso] = useState({
    peso_kg: '', porcentaje_grasa: '', masa_muscular_kg: '', medida_cintura_cm: '', medida_pecho_cm: '', notas: ''
  });

  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastType, setToastType] = useState('success');

  const [formData, setFormData] = useState({
    nombre: '', telefono: '', email: '', plan_id: '', grupo_familiar: '', notas_medicas: '', alertas_medicas: false, metodo_pago: 'Efectivo', descuento_manual: 0, cupon_id: '', fecha_inicio: new Date().toISOString().split('T')[0]
  });

  const [newCoupon, setNewCoupon] = useState({
    codigo: '', tipo_descuento: 'Porcentaje', valor: 10, activo: true
  });
  const [couponLoading, setCouponLoading] = useState(false);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedMiembroForDelete, setSelectedMiembroForDelete] = useState(null);
  const [diasRetencionDelete, setDiasRetencionDelete] = useState(60);

  const triggerToast = (msg, type = 'success') => {
    setToastMessage(msg);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const fetchData = async () => {
    setLoading(true); setDbError(false);
    try {
      const { data: planesData, error: planesError } = await supabase.from('gym_planes').select('*').order('precio', { ascending: true });
      if (planesError) throw planesError;
      setPlanes(planesData || []);

      const { data: cuponesData, error: cuponesError } = await supabase.from('gym_cupones').select('*').order('codigo');
      if (cuponesError) throw cuponesError;
      setCupones(cuponesData || []);

      const { data: miembrosData, error: miembrosError } = await supabase.from('gym_miembros').select(`*, gym_planes (nombre, precio, duracion_dias)`).order('nombre');
      if (miembrosError) throw miembrosError;

      const { data: pagosData, error: pagosError } = await supabase.from('gym_pagos').select('*').order('fecha_vencimiento', { ascending: false });
      if (pagosError) throw pagosError;
      setPagos(pagosData || []);

      const { data: papeleraData, error: papeleraError } = await supabase.from('papelera').select('*').eq('tipo_dato', 'gym_miembro');
      if (papeleraError) throw papeleraError;
      setPapeleraMiembros(papeleraData || []);

      const hoy = new Date().toISOString().split('T')[0];
      const miembrosConEstado = (miembrosData || []).map(miembro => {
        const pagosMiembro = (pagosData || []).filter(p => p.miembro_id === miembro.id && p.estado === 'Pagado');
        let estadoPago = 'Vencido'; let vencimiento = 'Sin registro'; let fechaInicioMembresia = miembro.fecha_inicio || 'Sin registro';
        if (pagosMiembro.length > 0) {
          const ultimoPago = pagosMiembro[0];
          vencimiento = ultimoPago.fecha_vencimiento;
          fechaInicioMembresia = ultimoPago.fecha_inicio || miembro.fecha_inicio;
          const fechaVence = new Date(vencimiento); const fechaHoy = new Date(hoy);
          const diffTiempo = fechaVence - fechaHoy; const diffDias = Math.ceil(diffTiempo / (1000 * 60 * 60 * 24));
          if (diffDias < 0) estadoPago = 'Vencido';
          else if (diffDias <= 5) estadoPago = 'Por vencer';
          else estadoPago = 'Al día';
        }
        return {
          ...miembro, membresia: miembro.gym_planes?.nombre || 'Ninguno',
          precioPlan: miembro.gym_planes?.precio || 0, duracionPlan: miembro.gym_planes?.duracion_dias || 30,
          fecha_inicio: fechaInicioMembresia, vencimiento, estadoPago
        };
      });
      setMiembros(miembrosConEstado);
      if (planesData && planesData.length > 0 && !formData.plan_id) setFormData(prev => ({ ...prev, plan_id: planesData[0].id }));
    } catch (error) {
      console.error("Error al cargar datos de GymOS:", error); setDbError(true); triggerToast("Error de conexión al cargar base de datos Supabase.", "error");
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const calcularVencimiento = (fechaBaseStr, dias) => {
    let diasNum = parseInt(dias, 10);
    if (isNaN(diasNum)) diasNum = 30;
    const baseStr = fechaBaseStr || new Date().toISOString().split('T')[0];
    const d = new Date(baseStr + 'T12:00:00');
    if (isNaN(d.getTime())) {
      const backupDate = new Date(); backupDate.setDate(backupDate.getDate() + diasNum);
      return backupDate.toISOString().split('T')[0];
    }
    d.setDate(d.getDate() + diasNum); return d.toISOString().split('T')[0];
  };

  const getPreciosFinales = () => {
    const planSeleccionado = planes.find(p => p.id === formData.plan_id);
    if (!planSeleccionado) return { subtotal: 0, descuento: 0, total: 0 };
    const subtotal = parseFloat(planSeleccionado.precio) || 0;
    let descuento = parseFloat(formData.descuento_manual) || 0;
    if (formData.cupon_id) {
      const cuponSeleccionado = cupones.find(c => c.id === formData.cupon_id);
      if (cuponSeleccionado && cuponSeleccionado.activo) {
        if (cuponSeleccionado.tipo_descuento === 'Porcentaje') descuento += (subtotal * (parseFloat(cuponSeleccionado.valor) / 100));
        else descuento += parseFloat(cuponSeleccionado.valor);
      }
    }
    return { subtotal, descuento: Math.min(descuento, subtotal), total: Math.max(0, subtotal - descuento) };
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    if (!newCoupon.codigo.trim() || newCoupon.valor <= 0) { triggerToast("Ingresa datos válidos para el cupón.", "error"); return; }
    setCouponLoading(true);
    try {
      const { error } = await supabase.from('gym_cupones').insert([{
        codigo: newCoupon.codigo.toUpperCase().trim(), tipo_descuento: newCoupon.tipo_descuento,
        valor: parseFloat(newCoupon.valor), activo: newCoupon.activo
      }]);
      if (error) throw error;
      triggerToast(`Cupón ${newCoupon.codigo.toUpperCase()} creado.`);
      setNewCoupon({ codigo: '', tipo_descuento: 'Porcentaje', valor: 10, activo: true });
      await fetchData();
    } catch (err) { triggerToast("Error al guardar cupón.", "error"); } finally { setCouponLoading(false); }
  };

  const toggleCouponStatus = async (id, status) => {
    try {
      const { error } = await supabase.from('gym_cupones').update({ activo: !status }).eq('id', id);
      if (error) throw error;
      triggerToast("Estado del cupón actualizado."); await fetchData();
    } catch (err) { triggerToast("Error al actualizar cupón.", "error"); }
  };

  const handleSaveMiembro = async (e) => {
    e.preventDefault();
    if (!formData.nombre.trim()) { triggerToast("El nombre es requerido.", "error"); return; }
    if (!formData.plan_id) { triggerToast("Debes seleccionar un plan.", "error"); return; }
    setLoading(true);
    try {
      const planSeleccionado = planes.find(p => p.id === formData.plan_id);
      const cuponSeleccionado = cupones.find(c => c.id === formData.cupon_id);
      const { descuento } = getPreciosFinales();
      const duracionDias = planSeleccionado ? (planSeleccionado.duracion_dias || 30) : 30;
      const vencimientoCalculado = calcularVencimiento(formData.fecha_inicio, duracionDias);

      const { data: nuevoMiembro, error: miembroError } = await supabase.from('gym_miembros').insert([{
        nombre: formData.nombre, telefono: formData.telefono || null, email: formData.email || null,
        plan_id: formData.plan_id, grupo_familiar: formData.grupo_familiar || null,
        notas_medicas: formData.notas_medicas, alertas_medicas: formData.alertas_medicas,
        fecha_inicio: formData.fecha_inicio, cupon_aplicado: cuponSeleccionado ? cuponSeleccionado.codigo : null
      }]).select();

      if (miembroError) throw miembroError;
      const miembroCreado = nuevoMiembro[0];
      if (miembroCreado) {
        const { error: pagoError } = await supabase.from('gym_pagos').insert([{
          miembro_id: miembroCreado.id, monto: planSeleccionado.precio, descuento: descuento,
          fecha_pago: formData.fecha_inicio, fecha_inicio: formData.fecha_inicio,
          fecha_vencimiento: vencimientoCalculado, estado: 'Pagado', metodo_pago: formData.metodo_pago,
          cupon_id: cuponSeleccionado ? cuponSeleccionado.id : null
        }]);
        if (pagoError) throw pagoError;
      }
      triggerToast("Miembro registrado y pago acreditado."); setIsModalOpen(false);
      setFormData({ nombre: '', telefono: '', email: '', plan_id: planes[0]?.id || '', grupo_familiar: '', notas_medicas: '', alertas_medicas: false, metodo_pago: 'Efectivo', descuento_manual: 0, cupon_id: '', fecha_inicio: new Date().toISOString().split('T')[0] });
      await fetchData();
    } catch (err) { triggerToast("Error al guardar miembro.", "error"); } finally { setLoading(false); }
  };

  const handleProcessCheckin = (e) => {
    if (e) e.preventDefault(); if (!checkinInput.trim()) return;
    const term = checkinInput.trim().toLowerCase();
    const miembroEncontrado = miembros.find(m => m.nombre.toLowerCase().includes(term) || (m.telefono && m.telefono.includes(term)) || m.id.toLowerCase().startsWith(term));
    const horaActual = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    if (!miembroEncontrado) {
      setCheckinResult({ permitido: false, mensaje: 'Miembro no encontrado', hora: horaActual }); return;
    }
    const estaAlDia = miembroEncontrado.estadoPago === 'Al día' || miembroEncontrado.estadoPago === 'Por vencer';
    const nuevoAcceso = { id: Date.now(), miembro: miembroEncontrado, permitido: estaAlDia, hora: horaActual, fecha: new Date().toLocaleDateString() };
    setCheckinResult(nuevoAcceso); setAccesosHoy(prev => [nuevoAcceso, ...prev]); setCheckinInput('');
  };

  const handleAddProgresoFisico = (e) => {
    e.preventDefault(); if (!selectedMiembro360) return;
    const nuevoRegistro = {
      id: Date.now(), fecha: new Date().toISOString().split('T')[0],
      peso_kg: parseFloat(newProgreso.peso_kg) || 0, porcentaje_grasa: parseFloat(newProgreso.porcentaje_grasa) || 0,
      masa_muscular_kg: parseFloat(newProgreso.masa_muscular_kg) || 0, medida_cintura_cm: parseFloat(newProgreso.medida_cintura_cm) || 0,
      medida_pecho_cm: parseFloat(newProgreso.medida_pecho_cm) || 0, notas: newProgreso.notas
    };
    setProgresosFisicos(prev => [nuevoRegistro, ...prev]); triggerToast(`Evaluación registrada.`);
    setNewProgreso({ peso_kg: '', porcentaje_grasa: '', masa_muscular_kg: '', medida_cintura_cm: '', medida_pecho_cm: '', notas: '' });
  };

  const openDeleteModal = (miembro) => { setSelectedMiembroForDelete(miembro); setDiasRetencionDelete(60); setDeleteModalOpen(true); };

  const handleConfirmDelete = async () => {
    if (!selectedMiembroForDelete) return;
    setLoading(true);
    try {
      await safeDelete('gym_miembro', selectedMiembroForDelete.id, selectedMiembroForDelete, diasRetencionDelete);
      triggerToast(`Miembro enviado a papelera por ${diasRetencionDelete} días.`); setDeleteModalOpen(false); setSelectedMiembroForDelete(null); await fetchData();
    } catch (err) { triggerToast("Error al enviar a papelera.", "error"); } finally { setLoading(false); }
  };

  const handleRestoreMiembro = async (trashEntry) => {
    setLoading(true);
    try {
      const dataOriginal = trashEntry.datos_originales;
      const { error: insertError } = await supabase.from('gym_miembros').insert([{
        id: dataOriginal.id, nombre: dataOriginal.nombre, telefono: dataOriginal.telefono, email: dataOriginal.email,
        plan_id: dataOriginal.plan_id, grupo_familiar: dataOriginal.grupo_familiar, notas_medicas: dataOriginal.notas_medicas,
        alertas_medicas: dataOriginal.alertas_medicas, fecha_inicio: dataOriginal.fecha_inicio, cupon_aplicado: dataOriginal.cupon_aplicado
      }]);
      if (insertError) throw insertError;
      await supabase.from('papelera').delete().eq('id', trashEntry.id);
      triggerToast(`Miembro restaurado.`); await fetchData();
    } catch (err) { triggerToast("Error al restaurar.", "error"); } finally { setLoading(false); }
  };

  const handlePurgeMiembro = async (trashId) => {
    setLoading(true);
    try {
      await supabase.from('papelera').delete().eq('id', trashId); triggerToast("Registro purgado."); await fetchData();
    } catch (err) { triggerToast("Error al purgar.", "error"); } finally { setLoading(false); }
  };

  const handleRenovacionRapida = async (miembro) => {
    setLoading(true);
    try {
      const planSeleccionado = planes.find(p => p.id === miembro.plan_id);
      if (!planSeleccionado) { triggerToast("Plan inválido.", "error"); return; }
      let fechaBase = new Date();
      if (miembro.vencimiento && miembro.vencimiento !== 'Sin registro') {
        const tempVence = new Date(miembro.vencimiento + 'T12:00:00');
        if (tempVence > fechaBase) fechaBase = tempVence;
      }
      const inicioStr = fechaBase.toISOString().split('T')[0];
      const vencimientoCalculado = calcularVencimiento(inicioStr, planSeleccionado.duracion_dias);
      const { error: pagoError } = await supabase.from('gym_pagos').insert([{
        miembro_id: miembro.id, monto: planSeleccionado.precio, descuento: 0,
        fecha_pago: new Date().toISOString().split('T')[0], fecha_inicio: inicioStr,
        fecha_vencimiento: vencimientoCalculado, estado: 'Pagado', metodo_pago: 'Efectivo'
      }]);
      if (pagoError) throw pagoError;
      triggerToast(`Plan renovado.`); await fetchData();
    } catch (err) { triggerToast("Error en renovación rápida.", "error"); } finally { setLoading(false); }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Al día': return { text: '#10B981', bg: 'rgba(16, 185, 129, 0.1)', border: 'rgba(16, 185, 129, 0.2)' };
      case 'Por vencer': return { text: '#F59E0B', bg: 'rgba(245, 158, 11, 0.1)', border: 'rgba(245, 158, 11, 0.2)' };
      case 'Vencido': return { text: '#EF4444', bg: 'rgba(239, 68, 68, 0.1)', border: 'rgba(239, 68, 68, 0.2)' };
      default: return { text: '#ECECEE', bg: 'rgba(255, 255, 255, 0.05)', border: 'rgba(255, 255, 255, 0.1)' };
    }
  };

  const handleSendWhatsApp = (miembro) => {
    if (!miembro.telefono) { triggerToast("Miembro sin número telefónico.", "error"); return; }
    const mensaje = `Hola ${miembro.nombre}, te saludamos de Sistema Pro. Te recordamos que tu membresía (${miembro.membresia}) registrada el ${miembro.fecha_inicio} vence el ${miembro.vencimiento}. Te invitamos a realizar tu renovación para seguir entrenando sin cortes. ¡Te esperamos!`;
    const cleanPhone = miembro.telefono.replace(/\s+/g, '');
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(mensaje)}`, '_blank');
  };

  const hoyStr = new Date().toISOString().split('T')[0];
  const ingresosHoy = pagos.filter(p => p.fecha_pago === hoyStr && p.estado === 'Pagado').reduce((acc, p) => acc + (parseFloat(p.monto) - parseFloat(p.descuento || 0)), 0);
  const ingresosMes = pagos.filter(p => p.estado === 'Pagado').reduce((acc, p) => acc + (parseFloat(p.monto) - parseFloat(p.descuento || 0)), 0);
  const totalDescuentos = pagos.reduce((acc, p) => acc + parseFloat(p.descuento || 0), 0);

  const totalMiembros = miembros.length;
  const miembrosActivos = miembros.filter(m => m.estadoPago === 'Al día' || m.estadoPago === 'Por vencer').length;
  const miembrosMorosos = miembros.filter(m => m.estadoPago === 'Vencido').length;
  const miembrosPorVencer = miembros.filter(m => m.estadoPago === 'Por vencer').length;

  const filteredMiembros = miembros.filter(m => {
    const matchesSearch = m.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || m.membresia.toLowerCase().includes(searchTerm.toLowerCase()) || (m.grupo_familiar && m.grupo_familiar.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesHealth = filterHealthAlerts ? m.alertas_medicas : true;
    const matchesPayment = filterPaymentStatus === 'Todos' ? true : m.estadoPago === filterPaymentStatus;
    return matchesSearch && matchesHealth && matchesPayment;
  });

  const filteredPlanes = planes.filter(p => {
    if (planCategoryFilter === 'General') return !p.nombre.toLowerCase().includes('disciplina');
    if (planCategoryFilter === 'Disciplinas') return p.nombre.toLowerCase().includes('disciplina');
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, fontFamily: "'Geist', 'Inter', sans-serif", color: t.text }}>
      
      {/* TOAST MINIMALISTA LIQUID GLASS */}
      {showToast && (
        <div style={{
          position: 'fixed', bottom: 30, left: '50%', transform: 'translateX(-50%)', zIndex: 9999,
          animation: 'fadeIn 0.2s ease-out', ...liquidGlassStyle, padding: '10px 20px', borderRadius: '24px',
          display: 'flex', alignItems: 'center', gap: 10, minWidth: 200, justifyContent: 'center'
        }}>
          {toastType === 'success' ? <CheckCircle size={14} style={{ color: '#10B981' }} /> : <AlertTriangle size={14} style={{ color: '#EF4444' }} />}
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.05em' }}>{toastMessage}</span>
        </div>
      )}

      {/* HEADER MINIMALISTA */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 900, margin: 0, letterSpacing: '-0.03em' }}>Sistema Pro</h1>
          <p style={{ fontSize: 12, color: t.textMuted, margin: '2px 0 0 0' }}>Enterprise Gym Management</p>
        </div>
        
        <div style={{ display: 'flex', gap: 12 }}>
          <button 
            onClick={fetchData} disabled={loading}
            style={{
              ...liquidGlassStyle, padding: '8px 12px', borderRadius: '10px', color: t.text, cursor: 'pointer',
              fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s'
            }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Actualizar
          </button>
          
          <button 
            onClick={() => setIsModalOpen(true)}
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.02) 100%)',
              backdropFilter: 'blur(20px)', border: `1px solid ${t.accent}`, borderRadius: '10px',
              padding: '8px 16px', color: t.accent, cursor: 'pointer', fontSize: 12, fontWeight: 700,
              display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s', boxShadow: `0 4px 15px ${t.accent}30`
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <UserPlus size={14} /> Nuevo Miembro
          </button>
        </div>
      </div>

      {dbError && (
        <div style={{ ...liquidGlassStyle, padding: 16, borderRadius: 12, border: '1px solid rgba(239, 68, 68, 0.3)', display: 'flex', gap: 8, color: '#EF4444' }}>
          <AlertTriangle size={16} /> <span style={{ fontSize: 12, fontWeight: 600 }}>Error de Base de Datos. Verifica Supabase.</span>
        </div>
      )}

      {/* COMPACT TABS */}
      <div style={{
        display: 'flex', gap: 4, overflowX: 'auto', paddingBottom: 4, borderBottom: '1px solid rgba(255,255,255,0.05)', WebkitOverflowScrolling: 'touch'
      }}>
        {[
          { id: 'resumen', label: 'Dashboard', icon: TrendingUp },
          { id: 'checkin', label: 'Acceso', icon: QrCode },
          { id: 'miembros', label: 'Clientes', icon: Users },
          { id: 'contabilidad', label: 'Caja', icon: Receipt },
          { id: 'planes', label: 'Planes', icon: CreditCard },
          { id: 'promociones', label: 'Cupones', icon: Ticket },
          { id: 'papelera', label: 'Papelera', icon: Trash2 }
        ].map(tab => {
          const active = activeSubTab === tab.id;
          return (
            <button
              key={tab.id} onClick={() => setActiveSubTab(tab.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: '12px 12px 0 0',
                background: active ? 'linear-gradient(180deg, rgba(255,255,255,0.05) 0%, transparent 100%)' : 'transparent',
                border: 'none', borderBottom: active ? `2px solid ${t.accent}` : '2px solid transparent',
                color: active ? t.accent : t.textMuted, cursor: 'pointer', fontSize: 11, fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap', transition: 'all 0.2s',
                textShadow: active ? `0 0 10px ${t.accent}60` : 'none'
              }}
            >
              <tab.icon size={14} /> {tab.label}
            </button>
          );
        })}
      </div>

      {loading && miembros.length === 0 ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}><RefreshCw size={24} className="animate-spin" color={t.accent} /></div>
      ) : (
        <>
          {/* DASHBOARD */}
          {activeSubTab === 'resumen' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                <div onClick={() => { setFilterPaymentStatus('Todos'); setActiveSubTab('miembros'); }} style={{ ...liquidGlassStyle, padding: 16, borderRadius: 16, cursor: 'pointer' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Users size={16} /></div>
                  </div>
                  <span style={{ fontSize: 10, color: t.textMuted, textTransform: 'uppercase', fontWeight: 700 }}>Total Miembros</span>
                  <div style={{ fontSize: 24, fontWeight: 800, marginTop: 4 }}>{totalMiembros}</div>
                </div>
                <div onClick={() => { setFilterPaymentStatus('Al día'); setActiveSubTab('miembros'); }} style={{ ...liquidGlassStyle, padding: 16, borderRadius: 16, cursor: 'pointer' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(16,185,129,0.1)', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CheckCircle2 size={16} /></div>
                  </div>
                  <span style={{ fontSize: 10, color: t.textMuted, textTransform: 'uppercase', fontWeight: 700 }}>Al Día</span>
                  <div style={{ fontSize: 24, fontWeight: 800, marginTop: 4, color: '#10B981' }}>{miembrosActivos}</div>
                </div>
                <div onClick={() => { setFilterPaymentStatus('Por vencer'); setActiveSubTab('miembros'); }} style={{ ...liquidGlassStyle, padding: 16, borderRadius: 16, cursor: 'pointer' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(245,158,11,0.1)', color: '#F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Clock size={16} /></div>
                  </div>
                  <span style={{ fontSize: 10, color: t.textMuted, textTransform: 'uppercase', fontWeight: 700 }}>Por Vencer</span>
                  <div style={{ fontSize: 24, fontWeight: 800, marginTop: 4, color: '#F59E0B' }}>{miembrosPorVencer}</div>
                </div>
                <div onClick={() => { setFilterPaymentStatus('Vencido'); setActiveSubTab('miembros'); }} style={{ ...liquidGlassStyle, padding: 16, borderRadius: 16, cursor: 'pointer' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(239,68,68,0.1)', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><AlertTriangle size={16} /></div>
                  </div>
                  <span style={{ fontSize: 10, color: t.textMuted, textTransform: 'uppercase', fontWeight: 700 }}>Vencidos</span>
                  <div style={{ fontSize: 24, fontWeight: 800, marginTop: 4, color: '#EF4444' }}>{miembrosMorosos}</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
                <div style={{ ...liquidGlassStyle, padding: 16, borderRadius: 16 }}>
                  <h3 style={{ fontSize: 13, fontWeight: 800, margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: 6 }}><AlertCircle size={14} color="#EF4444" /> Cobros Pendientes</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {miembros.filter(m => m.estadoPago === 'Vencido' || m.estadoPago === 'Por vencer').slice(0, 5).map(m => (
                      <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: 10 }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: 12, fontWeight: 600 }}>{m.nombre}</span>
                          <span style={{ fontSize: 10, color: t.textMuted }}>Vence: {m.vencimiento}</span>
                        </div>
                        <button onClick={() => handleSendWhatsApp(m)} style={{ padding: '4px 8px', borderRadius: 6, background: '#10B981', color: '#fff', border: 'none', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>Recordar</button>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div style={{ ...liquidGlassStyle, padding: 16, borderRadius: 16 }}>
                  <h3 style={{ fontSize: 13, fontWeight: 800, margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: 6 }}><HeartPulse size={14} color={t.accent} /> Alertas Médicas</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {miembros.filter(m => m.alertas_medicas).slice(0, 4).map(m => (
                      <div key={m.id} style={{ padding: '8px 12px', background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.1)', borderRadius: 10 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#F59E0B' }}>{m.nombre}</span>
                        <p style={{ fontSize: 10, color: t.textMuted, margin: '4px 0 0 0' }}>{m.notas_medicas || 'Atención requerida'}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CHECKIN */}
          {activeSubTab === 'checkin' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr md:360px', gap: 20 }}>
              <div style={{ ...liquidGlassStyle, padding: 24, borderRadius: 16 }}>
                <h3 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: 8 }}><QrCode size={18} /> Terminal de Acceso</h3>
                <form onSubmit={handleProcessCheckin} style={{ display: 'flex', gap: 10 }}>
                  <input type="text" value={checkinInput} onChange={e => setCheckinInput(e.target.value)} placeholder="Nombre o ID..." autoFocus style={{ ...inputGlassStyle, flex: 1, padding: '12px 16px', color: t.text, outline: 'none' }} />
                  <button type="submit" style={{ padding: '12px 20px', borderRadius: 12, background: t.accent, border: 'none', color: '#000', fontWeight: 700, cursor: 'pointer' }}>Validar</button>
                </form>
                {checkinResult && (
                  <div style={{ marginTop: 20, padding: 20, borderRadius: 12, background: checkinResult.permitido ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', border: `1px solid ${checkinResult.permitido ? '#10B981' : '#EF4444'}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      {checkinResult.permitido ? <CheckCircle size={32} color="#10B981" /> : <XCircle size={32} color="#EF4444" />}
                      <div>
                        <h4 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>{checkinResult.miembro ? checkinResult.miembro.nombre : 'Desconocido'}</h4>
                        <span style={{ fontSize: 11, color: t.textMuted }}>{checkinResult.permitido ? 'ACCESO CONCEDIDO' : 'ACCESO DENEGADO'}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div style={{ ...liquidGlassStyle, padding: 20, borderRadius: 16 }}>
                <h4 style={{ fontSize: 12, fontWeight: 800, margin: '0 0 12px 0', textTransform: 'uppercase' }}>Ingresos Hoy</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 300, overflowY: 'auto' }}>
                  {accesosHoy.map(item => (
                    <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: 8, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <span style={{ fontSize: 11, fontWeight: 600 }}>{item.miembro.nombre}</span>
                      <span style={{ fontSize: 10, color: item.permitido ? '#10B981' : '#EF4444' }}>{item.hora}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* CLIENTES */}
          {activeSubTab === 'miembros' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
                  <input type="text" placeholder="Buscar cliente..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ ...inputGlassStyle, width: '100%', padding: '8px 32px 8px 12px', color: t.text, outline: 'none', fontSize: 12 }} />
                  {searchTerm && <button onClick={() => setSearchTerm('')} style={{ position: 'absolute', right: 8, top: 8, background: 'none', border: 'none', color: t.textMuted, cursor: 'pointer' }}><XCircle size={14} /></button>}
                </div>
                
                <button onClick={() => setFilterHealthAlerts(!filterHealthAlerts)} style={{ padding: '6px 12px', borderRadius: 20, background: filterHealthAlerts ? 'rgba(245,158,11,0.1)' : 'rgba(255,255,255,0.03)', border: `1px solid ${filterHealthAlerts ? '#F59E0B' : 'rgba(255,255,255,0.08)'}`, color: filterHealthAlerts ? '#F59E0B' : t.textMuted, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                  {filterHealthAlerts ? '♥ Salud Activo' : '♥ Salud'}
                </button>

                <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.03)', padding: 4, borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)' }}>
                  {['Todos', 'Al día', 'Por vencer', 'Vencido'].map(status => (
                    <button key={status} onClick={() => setFilterPaymentStatus(status)} style={{ padding: '4px 10px', borderRadius: 8, background: filterPaymentStatus === status ? 'rgba(255,255,255,0.1)' : 'transparent', border: 'none', color: filterPaymentStatus === status ? t.text : t.textMuted, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ ...liquidGlassStyle, borderRadius: 16, overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 12 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <th style={{ padding: '12px 16px', color: t.textMuted, fontWeight: 600 }}>Cliente</th>
                      <th style={{ padding: '12px 16px', color: t.textMuted, fontWeight: 600 }}>Plan</th>
                      <th style={{ padding: '12px 16px', color: t.textMuted, fontWeight: 600 }}>Vence</th>
                      <th style={{ padding: '12px 16px', color: t.textMuted, fontWeight: 600 }}>Estado</th>
                      <th style={{ padding: '12px 16px', color: t.textMuted, fontWeight: 600, textAlign: 'right' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMiembros.map(m => {
                      const colors = getStatusColor(m.estadoPago);
                      return (
                        <tr key={m.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ fontWeight: 600 }}>{m.nombre}</div>
                            <div style={{ fontSize: 10, color: t.textSecondary }}>{m.telefono}</div>
                          </td>
                          <td style={{ padding: '12px 16px' }}>{m.membresia}</td>
                          <td style={{ padding: '12px 16px', color: t.textSecondary }}>{m.vencimiento}</td>
                          <td style={{ padding: '12px 16px' }}><span style={{ color: colors.text, background: colors.bg, padding: '2px 8px', borderRadius: 8, fontSize: 10, fontWeight: 700 }}>{m.estadoPago}</span></td>
                          <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 4 }}>
                              <button onClick={() => setSelectedMiembro360(m)} style={{ padding: '4px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.05)', border: 'none', color: t.text, fontSize: 11, cursor: 'pointer' }}>360°</button>
                              <button onClick={() => handleRenovacionRapida(m)} style={{ padding: '4px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.05)', border: 'none', color: t.text, fontSize: 11, cursor: 'pointer' }}>Renovar</button>
                              <button onClick={() => openDeleteModal(m)} style={{ padding: '4px 8px', borderRadius: 6, background: 'rgba(239,68,68,0.1)', border: 'none', color: '#EF4444', fontSize: 11, cursor: 'pointer' }}>X</button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* CONTABILIDAD */}
          {activeSubTab === 'contabilidad' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                <div style={{ ...liquidGlassStyle, padding: 20, borderRadius: 16 }}>
                  <span style={{ fontSize: 10, textTransform: 'uppercase', color: t.textMuted, fontWeight: 700 }}>Ingresos Hoy</span>
                  <div style={{ fontSize: 24, fontWeight: 800, color: '#10B981', marginTop: 8 }}>{ingresosHoy.toFixed(2)} Bs.</div>
                </div>
                <div style={{ ...liquidGlassStyle, padding: 20, borderRadius: 16 }}>
                  <span style={{ fontSize: 10, textTransform: 'uppercase', color: t.textMuted, fontWeight: 700 }}>Acumulado Mes</span>
                  <div style={{ fontSize: 24, fontWeight: 800, color: t.accent, marginTop: 8 }}>{ingresosMes.toFixed(2)} Bs.</div>
                </div>
              </div>
              <div style={{ ...liquidGlassStyle, padding: 20, borderRadius: 16, overflowX: 'auto' }}>
                <h4 style={{ fontSize: 14, fontWeight: 800, margin: '0 0 16px 0' }}>Transacciones</h4>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <th style={{ padding: '8px 12px', color: t.textMuted }}>Fecha</th>
                      <th style={{ padding: '8px 12px', color: t.textMuted }}>Miembro</th>
                      <th style={{ padding: '8px 12px', color: t.textMuted }}>Total</th>
                      <th style={{ padding: '8px 12px', color: t.textMuted }}>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagos.map(p => {
                      const total = parseFloat(p.monto) - parseFloat(p.descuento || 0);
                      return (
                        <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                          <td style={{ padding: '8px 12px' }}>{p.fecha_pago}</td>
                          <td style={{ padding: '8px 12px' }}>{miembros.find(m => m.id === p.miembro_id)?.nombre || 'N/A'}</td>
                          <td style={{ padding: '8px 12px', fontWeight: 700, color: '#10B981' }}>{total.toFixed(2)} Bs.</td>
                          <td style={{ padding: '8px 12px' }}><span style={{ background: 'rgba(16,185,129,0.1)', color: '#10B981', padding: '2px 6px', borderRadius: 6, fontSize: 10 }}>{p.estado}</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* PLANES */}
          {activeSubTab === 'planes' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
              {planes.map(p => (
                <div key={p.id} style={{ ...liquidGlassStyle, padding: 24, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 16, position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: `linear-gradient(90deg, ${t.accent}, #F59E0B)` }} />
                  <div>
                    <h4 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>{p.nombre}</h4>
                    <span style={{ fontSize: 11, color: t.textMuted }}>{p.duracion_dias} días</span>
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 900, fontFamily: "'JetBrains Mono', monospace" }}>{parseFloat(p.precio).toFixed(0)} Bs.</div>
                  <button onClick={() => { setFormData(prev => ({ ...prev, plan_id: p.id })); setIsModalOpen(true); }} style={{ padding: '10px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: `1px solid rgba(255,255,255,0.1)`, color: t.text, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = t.accentSoft} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}>Inscribir</button>
                </div>
              ))}
            </div>
          )}

          {/* CUPONES */}
          {activeSubTab === 'promociones' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr md:300px', gap: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
                {cupones.map((c, i) => {
                  const theme = COUPON_COLOR_PALETTES[i % COUPON_COLOR_PALETTES.length];
                  return (
                    <div key={c.id} style={{ ...liquidGlassStyle, padding: 20, borderRadius: 16, border: `1px solid ${theme.border}40`, opacity: c.activo ? 1 : 0.6 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 14, fontWeight: 900, color: theme.text }}>{c.codigo}</span>
                        <span style={{ fontSize: 10, background: theme.bg, color: theme.text, padding: '2px 6px', borderRadius: 6 }}>{c.activo ? 'ON' : 'OFF'}</span>
                      </div>
                      <div style={{ fontSize: 24, fontWeight: 800, margin: '12px 0' }}>{c.tipo_descuento === 'Porcentaje' ? `${c.valor}%` : `${c.valor} Bs.`}</div>
                      <button onClick={() => toggleCouponStatus(c.id, c.activo)} style={{ width: '100%', padding: '6px', background: 'none', border: `1px solid ${theme.border}`, color: theme.text, borderRadius: 8, fontSize: 11, cursor: 'pointer' }}>Toggle</button>
                    </div>
                  );
                })}
              </div>
              <form onSubmit={handleCreateCoupon} style={{ ...liquidGlassStyle, padding: 20, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <h4 style={{ margin: 0, fontSize: 14, fontWeight: 800 }}>Nuevo Cupón</h4>
                <input type="text" value={newCoupon.codigo} onChange={e => setNewCoupon({...newCoupon, codigo: e.target.value})} placeholder="Código..." style={{ ...inputGlassStyle, padding: '10px', color: t.text, outline: 'none' }} />
                <select value={newCoupon.tipo_descuento} onChange={e => setNewCoupon({...newCoupon, tipo_descuento: e.target.value})} style={{ ...inputGlassStyle, padding: '10px', color: t.text, outline: 'none' }}><option value="Porcentaje">%</option><option value="Monto">Bs.</option></select>
                <input type="number" value={newCoupon.valor} onChange={e => setNewCoupon({...newCoupon, valor: parseFloat(e.target.value)||0})} placeholder="Valor..." style={{ ...inputGlassStyle, padding: '10px', color: t.text, outline: 'none' }} />
                <button type="submit" style={{ padding: '10px', borderRadius: 10, background: t.accent, border: 'none', color: '#000', fontWeight: 700, cursor: 'pointer' }}>Guardar</button>
              </form>
            </div>
          )}

          {/* PAPELERA */}
          {activeSubTab === 'papelera' && (
            <div style={{ ...liquidGlassStyle, padding: 20, borderRadius: 16, overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <th style={{ padding: '8px 12px', color: t.textMuted }}>Miembro</th>
                    <th style={{ padding: '8px 12px', color: t.textMuted, textAlign: 'right' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {papeleraMiembros.map(item => (
                    <tr key={item.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      <td style={{ padding: '8px 12px', fontWeight: 600 }}>{item.nombre_item}</td>
                      <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                        <button onClick={() => handleRestoreMiembro(item)} style={{ padding: '4px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.1)', border: 'none', color: t.text, fontSize: 10, cursor: 'pointer', marginRight: 4 }}>Restaurar</button>
                        <button onClick={() => handlePurgeMiembro(item.id)} style={{ padding: '4px 8px', borderRadius: 6, background: 'rgba(239,68,68,0.1)', border: 'none', color: '#EF4444', fontSize: 10, cursor: 'pointer' }}>Purgar</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* DRAWER 360 */}
      {selectedMiembro360 && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', justifyContent: 'flex-end', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}>
          <div style={{ ...liquidGlassStyle, width: '100%', maxWidth: 400, height: '100%', borderRadius: '24px 0 0 24px', padding: 24, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>{selectedMiembro360.nombre}</h3>
              <button onClick={() => setSelectedMiembro360(null)} style={{ background: 'none', border: 'none', color: t.textMuted, cursor: 'pointer' }}><XCircle size={20} /></button>
            </div>
            <div style={{ padding: 12, borderRadius: 12, background: 'rgba(255,255,255,0.03)' }}>
              <div style={{ fontSize: 11, color: t.textSecondary }}>Plan: {selectedMiembro360.membresia}</div>
              <div style={{ fontSize: 11, color: t.textSecondary }}>Vence: {selectedMiembro360.vencimiento}</div>
            </div>
            <form onSubmit={handleAddProgresoFisico} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: t.accent }}>Nueva Medición</span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <input type="number" step="0.1" placeholder="Peso (kg)" value={newProgreso.peso_kg} onChange={e => setNewProgreso({...newProgreso, peso_kg: e.target.value})} style={{ ...inputGlassStyle, padding: 8, color: t.text, fontSize: 11, outline: 'none' }} />
                <input type="number" step="0.1" placeholder="% Grasa" value={newProgreso.porcentaje_grasa} onChange={e => setNewProgreso({...newProgreso, porcentaje_grasa: e.target.value})} style={{ ...inputGlassStyle, padding: 8, color: t.text, fontSize: 11, outline: 'none' }} />
              </div>
              <button type="submit" style={{ padding: '8px', borderRadius: 8, background: t.accent, border: 'none', color: '#000', fontWeight: 700, fontSize: 11, cursor: 'pointer' }}>Guardar</button>
            </form>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {progresosFisicos.map(item => (
                <div key={item.id} style={{ padding: 10, borderRadius: 10, background: 'rgba(255,255,255,0.03)', fontSize: 11 }}>
                  <span style={{ fontWeight: 700 }}>{item.fecha}:</span> {item.peso_kg}kg | {item.porcentaje_grasa}%
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL REGISTRO */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(12px)', padding: 16 }}>
          <form onSubmit={handleSaveMiembro} style={{ ...liquidGlassStyle, maxWidth: 480, width: '100%', padding: 24, borderRadius: 24, display: 'flex', flexDirection: 'column', gap: 16, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Registrar Miembro</h3>
              <button type="button" onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: t.textMuted, cursor: 'pointer' }}><XCircle size={20} /></button>
            </div>
            
            <input type="text" name="nombre" value={formData.nombre} onChange={handleInputChange} placeholder="Nombre completo" required style={{ ...inputGlassStyle, padding: '12px', color: t.text, outline: 'none', fontSize: 13 }} />
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <input type="text" name="telefono" value={formData.telefono} onChange={handleInputChange} placeholder="Teléfono" style={{ ...inputGlassStyle, padding: '12px', color: t.text, outline: 'none', fontSize: 13 }} />
              <input type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="Email" style={{ ...inputGlassStyle, padding: '12px', color: t.text, outline: 'none', fontSize: 13 }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <select name="plan_id" value={formData.plan_id} onChange={handleInputChange} style={{ ...inputGlassStyle, padding: '12px', color: t.text, outline: 'none', fontSize: 13 }}>
                {planes.map(p => <option key={p.id} value={p.id} style={{ color: '#000' }}>{p.nombre}</option>)}
              </select>
              <input type="date" name="fecha_inicio" value={formData.fecha_inicio} onChange={handleInputChange} style={{ ...inputGlassStyle, padding: '12px', color: t.text, outline: 'none', fontSize: 13 }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <select name="cupon_id" value={formData.cupon_id} onChange={handleInputChange} style={{ ...inputGlassStyle, padding: '12px', color: t.text, outline: 'none', fontSize: 13 }}>
                <option value="" style={{ color: '#000' }}>Sin cupón</option>
                {cupones.filter(c=>c.activo).map(c=><option key={c.id} value={c.id} style={{ color: '#000' }}>{c.codigo}</option>)}
              </select>
              <select name="metodo_pago" value={formData.metodo_pago} onChange={handleInputChange} style={{ ...inputGlassStyle, padding: '12px', color: t.text, outline: 'none', fontSize: 13 }}>
                <option value="Efectivo" style={{ color: '#000' }}>Efectivo</option>
                <option value="Transferencia" style={{ color: '#000' }}>Transferencia</option>
              </select>
            </div>

            <div style={{ padding: 12, borderRadius: 12, background: 'rgba(255,255,255,0.03)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: t.textMuted }}>Total a cobrar:</span>
              <span style={{ fontSize: 18, fontWeight: 800, color: '#10B981' }}>{getPreciosFinales().total} Bs.</span>
            </div>

            <button type="submit" disabled={loading} style={{ padding: '14px', borderRadius: 12, background: t.accent, border: 'none', color: '#000', fontWeight: 800, fontSize: 14, cursor: 'pointer', marginTop: 8 }}>
              {loading ? 'Procesando...' : 'Guardar y Cobrar'}
            </button>
          </form>
        </div>
      )}

      {/* MODAL ELIMINACION */}
      {deleteModalOpen && selectedMiembroForDelete && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1001, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', padding: 16 }}>
          <div style={{ ...liquidGlassStyle, maxWidth: 360, width: '100%', padding: 24, borderRadius: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h4 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#EF4444' }}>Eliminar Cliente</h4>
            <p style={{ margin: 0, fontSize: 12, color: t.textSecondary }}>¿Mover a <strong>{selectedMiembroForDelete.nombre}</strong> a la papelera?</p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
              <button type="button" onClick={() => {setDeleteModalOpen(false); setSelectedMiembroForDelete(null);}} style={{ padding: '8px 16px', borderRadius: 8, background: 'rgba(255,255,255,0.1)', border: 'none', color: t.text, fontSize: 12, cursor: 'pointer' }}>Cancelar</button>
              <button type="button" onClick={handleConfirmDelete} disabled={loading} style={{ padding: '8px 16px', borderRadius: 8, background: '#EF4444', border: 'none', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Eliminar</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default SistemaGimnasio;
