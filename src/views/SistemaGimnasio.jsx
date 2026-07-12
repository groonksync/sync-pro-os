// Inefable - GymOS Prototype (Sistema Gimnasio V2.0)
// Created: 2026-07-12
// Updated: Bolivian Currency, Customizable Soft Delete, Coupon DB Integration & Date Ranges
import React, { useState, useEffect } from 'react';
import { 
  Dumbbell, Users, CreditCard, Tag, AlertTriangle, Plus, Search, 
  Calendar, Phone, ExternalLink, ArrowRight, UserPlus, CheckCircle, 
  XCircle, Filter, Sparkles, TrendingUp, AlertCircle, HeartPulse,
  DollarSign, RefreshCw, Trash2, RotateCcw, ShieldAlert, Award
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useTheme } from '../lib/theme';
import { safeDelete } from '../lib/trashService';

const SistemaGimnasio = ({ settings, isDark }) => {
  const t = useTheme(isDark);
  const [activeSubTab, setActiveSubTab] = useState('resumen');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterHealthAlerts, setFilterHealthAlerts] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Estados para datos reales de Supabase
  const [miembros, setMiembros] = useState([]);
  const [planes, setPlanes] = useState([]);
  const [pagos, setPagos] = useState([]);
  const [cupones, setCupones] = useState([]);
  const [papeleraMiembros, setPapeleraMiembros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState(false);
  
  // Estados para Toasts
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastType, setToastType] = useState('success'); // 'success' | 'error'

  // Estados del Formulario de Registro
  const [formData, setFormData] = useState({
    nombre: '',
    telefono: '',
    email: '',
    plan_id: '',
    grupo_familiar: '',
    notas_medicas: '',
    alertas_medicas: false,
    metodo_pago: 'Efectivo',
    descuento_manual: 0,
    cupon_id: '',
    fecha_inicio: new Date().toISOString().split('T')[0]
  });

  // Estado para Formulario de Nuevo Cupón
  const [newCoupon, setNewCoupon] = useState({
    codigo: '',
    tipo_descuento: 'Porcentaje',
    valor: 10,
    activo: true
  });
  const [couponLoading, setCouponLoading] = useState(false);

  // Estados del Modal de Eliminación Seguro
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedMiembroForDelete, setSelectedMiembroForDelete] = useState(null);
  const [diasRetencionDelete, setDiasRetencionDelete] = useState(60);

  const triggerToast = (msg, type = 'success') => {
    setToastMessage(msg);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  // Cargar datos de Supabase
  const fetchData = async () => {
    setLoading(true);
    setDbError(false);
    try {
      // 1. Obtener Planes
      const { data: planesData, error: planesError } = await supabase
        .from('gym_planes')
        .select('*')
        .order('precio', { ascending: true });
      
      if (planesError) throw planesError;
      setPlanes(planesData || []);

      // 2. Obtener Cupones
      const { data: cuponesData, error: cuponesError } = await supabase
        .from('gym_cupones')
        .select('*')
        .order('codigo');
      
      if (cuponesError) throw cuponesError;
      setCupones(cuponesData || []);

      // 3. Obtener Miembros
      const { data: miembrosData, error: miembrosError } = await supabase
        .from('gym_miembros')
        .select(`
          *,
          gym_planes (
            nombre,
            precio,
            duracion_meses
          )
        `)
        .order('nombre');

      if (miembrosError) throw miembrosError;

      // 4. Obtener Pagos
      const { data: pagosData, error: pagosError } = await supabase
        .from('gym_pagos')
        .select('*')
        .order('fecha_vencimiento', { ascending: false });

      if (pagosError) throw pagosError;
      setPagos(pagosData || []);

      // 5. Obtener Miembros en la Papelera de Supabase
      const { data: papeleraData, error: papeleraError } = await supabase
        .from('papelera')
        .select('*')
        .eq('tipo_dato', 'gym_miembro');
      
      if (papeleraError) throw papeleraError;
      setPapeleraMiembros(papeleraData || []);

      // Mapear miembros y calcular estado y fechas basado en el último pago
      const hoy = new Date().toISOString().split('T')[0];
      const miembrosConEstado = (miembrosData || []).map(miembro => {
        const pagosMiembro = (pagosData || []).filter(p => p.miembro_id === miembro.id && p.estado === 'Pagado');
        
        let estadoPago = 'Vencido';
        let vencimiento = 'Sin registro';
        let fechaInicioMembresia = miembro.fecha_inicio || 'Sin registro';

        if (pagosMiembro.length > 0) {
          const ultimoPago = pagosMiembro[0]; // Ordenado desc
          vencimiento = ultimoPago.fecha_vencimiento;
          fechaInicioMembresia = ultimoPago.fecha_inicio || miembro.fecha_inicio;
          
          const fechaVence = new Date(vencimiento);
          const fechaHoy = new Date(hoy);
          const diffTiempo = fechaVence - fechaHoy;
          const diffDias = Math.ceil(diffTiempo / (1000 * 60 * 60 * 24));

          if (diffDias < 0) {
            estadoPago = 'Vencido';
          } else if (diffDias <= 5) {
            estadoPago = 'Por vencer';
          } else {
            estadoPago = 'Al día';
          }
        }

        return {
          ...miembro,
          membresia: miembro.gym_planes?.nombre || 'Ninguno',
          precioPlan: miembro.gym_planes?.precio || 0,
          duracionPlan: miembro.gym_planes?.duracion_meses || 1,
          fecha_inicio: fechaInicioMembresia,
          vencimiento,
          estadoPago
        };
      });

      setMiembros(miembrosConEstado);

      // Valores por defecto para formulario
      if (planesData && planesData.length > 0 && !formData.plan_id) {
        setFormData(prev => ({ ...prev, plan_id: planesData[0].id }));
      }

    } catch (error) {
      console.error("Error al cargar datos de GymOS:", error);
      setDbError(true);
      triggerToast("Error de conexión al cargar base de datos Supabase.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Calcular vencimiento en base a una fecha de inicio y una cantidad de meses
  const calcularVencimiento = (fechaBaseStr, meses) => {
    const d = new Date(fechaBaseStr + 'T12:00:00'); // Evitar desfase de zona horaria
    d.setMonth(d.getMonth() + parseInt(meses, 10));
    return d.toISOString().split('T')[0];
  };

  // Calcular el descuento y el total en Bolivianos
  const getPreciosFinales = () => {
    const planSeleccionado = planes.find(p => p.id === formData.plan_id);
    if (!planSeleccionado) return { subtotal: 0, descuento: 0, total: 0 };

    const subtotal = parseFloat(planSeleccionado.precio) || 0;
    let descuento = parseFloat(formData.descuento_manual) || 0;

    if (formData.cupon_id) {
      const cuponSeleccionado = cupones.find(c => c.id === formData.cupon_id);
      if (cuponSeleccionado && cuponSeleccionado.activo) {
        if (cuponSeleccionado.tipo_descuento === 'Porcentaje') {
          descuento += (subtotal * (parseFloat(cuponSeleccionado.valor) / 100));
        } else {
          descuento += parseFloat(cuponSeleccionado.valor);
        }
      }
    }

    return {
      subtotal,
      descuento: Math.min(descuento, subtotal), // El descuento no puede exceder el costo
      total: Math.max(0, subtotal - descuento)
    };
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Crear cupón en Supabase
  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    if (!newCoupon.codigo.trim() || newCoupon.valor <= 0) {
      triggerToast("Ingresa datos válidos para el cupón.", "error");
      return;
    }

    setCouponLoading(true);
    try {
      const { error } = await supabase
        .from('gym_cupones')
        .insert([{
          codigo: newCoupon.codigo.toUpperCase().trim(),
          tipo_descuento: newCoupon.tipo_descuento,
          valor: parseFloat(newCoupon.valor),
          activo: newCoupon.activo
        }]);

      if (error) throw error;

      triggerToast(`Cupón ${newCoupon.codigo.toUpperCase()} creado.`);
      setNewCoupon({ codigo: '', tipo_descuento: 'Porcentaje', valor: 10, activo: true });
      await fetchData();
    } catch (err) {
      console.error(err);
      triggerToast("Error al guardar cupón: " + (err.message || ''), "error");
    } finally {
      setCouponLoading(false);
    }
  };

  // Cambiar estado activo/inactivo de un cupón
  const toggleCouponStatus = async (id, status) => {
    try {
      const { error } = await supabase
        .from('gym_cupones')
        .update({ activo: !status })
        .eq('id', id);

      if (error) throw error;
      triggerToast("Estado del cupón actualizado.");
      await fetchData();
    } catch (err) {
      console.error(err);
      triggerToast("Error al actualizar cupón.", "error");
    }
  };

  // Guardar Miembro, calcular fechas e insertar primer pago con descuento
  const handleSaveMiembro = async (e) => {
    e.preventDefault();
    if (!formData.nombre.trim()) {
      triggerToast("El nombre es requerido.", "error");
      return;
    }

    if (!formData.plan_id) {
      triggerToast("Debes seleccionar un plan de membresía. Verifica tu Supabase.", "error");
      return;
    }

    setLoading(true);
    try {
      const planSeleccionado = planes.find(p => p.id === formData.plan_id);
      const cuponSeleccionado = cupones.find(c => c.id === formData.cupon_id);
      
      const { descuento, total } = getPreciosFinales();
      const vencimientoCalculado = calcularVencimiento(formData.fecha_inicio, planSeleccionado.duracion_meses);

      // 1. Registrar Miembro
      const { data: nuevoMiembro, error: miembroError } = await supabase
        .from('gym_miembros')
        .insert([{
          nombre: formData.nombre,
          telefono: formData.telefono || null,
          email: formData.email || null,
          plan_id: formData.plan_id,
          grupo_familiar: formData.grupo_familiar || null,
          notas_medicas: formData.notas_medicas,
          alertas_medicas: formData.alertas_medicas,
          fecha_inicio: formData.fecha_inicio,
          cupon_aplicado: cuponSeleccionado ? cuponSeleccionado.codigo : null
        }])
        .select();

      if (miembroError) throw miembroError;
      const miembroCreado = nuevoMiembro[0];

      // 2. Registrar Transacción de Pago inicial
      if (miembroCreado) {
        const { error: pagoError } = await supabase
          .from('gym_pagos')
          .insert([{
            miembro_id: miembroCreado.id,
            monto: planSeleccionado.precio,
            descuento: descuento,
            fecha_pago: formData.fecha_inicio,
            fecha_inicio: formData.fecha_inicio,
            fecha_vencimiento: vencimientoCalculado,
            estado: 'Pagado',
            metodo_pago: formData.metodo_pago,
            cupon_id: cuponSeleccionado ? cuponSeleccionado.id : null
          }]);

        if (pagoError) throw pagoError;
      }

      triggerToast("Miembro registrado y pago acreditado.");
      setIsModalOpen(false);
      
      // Reset Formulario
      setFormData({
        nombre: '',
        telefono: '',
        email: '',
        plan_id: planes[0]?.id || '',
        grupo_familiar: '',
        notas_medicas: '',
        alertas_medicas: false,
        metodo_pago: 'Efectivo',
        descuento_manual: 0,
        cupon_id: '',
        fecha_inicio: new Date().toISOString().split('T')[0]
      });

      await fetchData();
    } catch (err) {
      console.error(err);
      triggerToast("Error al guardar miembro: " + (err.message || ''), "error");
    } finally {
      setLoading(false);
    }
  };

  // Abrir Modal de Confirmación de Borrado Seguro
  const openDeleteModal = (miembro) => {
    setSelectedMiembroForDelete(miembro);
    setDiasRetencionDelete(60); // Default 60 días
    setDeleteModalOpen(true);
  };

  // Enviar a papelera Supabase (Soft Delete)
  const handleConfirmDelete = async () => {
    if (!selectedMiembroForDelete) return;

    setLoading(true);
    try {
      // Elimina de gym_miembros y lo mueve a papelera Supabase con fecha de vencimiento personalizada
      await safeDelete('gym_miembro', selectedMiembroForDelete.id, selectedMiembroForDelete, diasRetencionDelete);
      
      triggerToast(`Miembro enviado a papelera por ${diasRetencionDelete} días.`);
      setDeleteModalOpen(false);
      setSelectedMiembroForDelete(null);
      await fetchData();
    } catch (err) {
      console.error(err);
      triggerToast("Error al enviar a papelera.", "error");
    } finally {
      setLoading(false);
    }
  };

  // Restaurar miembro borrado desde la papelera Supabase
  const handleRestoreMiembro = async (trashEntry) => {
    setLoading(true);
    try {
      const dataOriginal = trashEntry.datos_originales;

      // 1. Re-insertar en gym_miembros
      const { error: insertError } = await supabase
        .from('gym_miembros')
        .insert([{
          id: dataOriginal.id,
          nombre: dataOriginal.nombre,
          telefono: dataOriginal.telefono,
          email: dataOriginal.email,
          plan_id: dataOriginal.plan_id,
          grupo_familiar: dataOriginal.grupo_familiar,
          notas_medicas: dataOriginal.notas_medicas,
          alertas_medicas: dataOriginal.alertas_medicas,
          fecha_inicio: dataOriginal.fecha_inicio,
          cupon_aplicado: dataOriginal.cupon_aplicado
        }]);

      if (insertError) throw insertError;

      // 2. Eliminar entrada de papelera
      const { error: deleteError } = await supabase
        .from('papelera')
        .delete()
        .eq('id', trashEntry.id);

      if (deleteError) throw deleteError;

      triggerToast(`Miembro ${dataOriginal.nombre} restaurado.`);
      await fetchData();
    } catch (err) {
      console.error(err);
      triggerToast("Error al restaurar miembro de la papelera.", "error");
    } finally {
      setLoading(false);
    }
  };

  // Eliminar definitivamente de la papelera sin esperar
  const handlePurgeMiembro = async (trashId) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('papelera')
        .delete()
        .eq('id', trashId);

      if (error) throw error;
      triggerToast("Registro purgado de forma permanente.");
      await fetchData();
    } catch (err) {
      console.error(err);
      triggerToast("Error al purgar registro.", "error");
    } finally {
      setLoading(false);
    }
  };

  // Registrar pago rápido de renovación para cliente existente
  const handleRenovacionRapida = async (miembro) => {
    setLoading(true);
    try {
      const planSeleccionado = planes.find(p => p.id === miembro.plan_id);
      if (!planSeleccionado) {
        triggerToast("Este miembro no tiene un plan asignado válido.", "error");
        return;
      }

      let fechaBase = new Date();
      // Si el vencimiento es a futuro, extender a partir del vencimiento. Si ya venció, inicia hoy.
      if (miembro.vencimiento && miembro.vencimiento !== 'Sin registro') {
        const tempVence = new Date(miembro.vencimiento + 'T12:00:00');
        if (tempVence > fechaBase) {
          fechaBase = tempVence;
        }
      }

      const inicioStr = fechaBase.toISOString().split('T')[0];
      const vencimientoCalculado = calcularVencimiento(inicioStr, planSeleccionado.duracion_meses);

      const { error: pagoError } = await supabase
        .from('gym_pagos')
        .insert([{
          miembro_id: miembro.id,
          monto: planSeleccionado.precio,
          descuento: 0,
          fecha_pago: new Date().toISOString().split('T')[0],
          fecha_inicio: inicioStr,
          fecha_vencimiento: vencimientoCalculado,
          estado: 'Pagado',
          metodo_pago: 'Efectivo'
        }]);

      if (pagoError) throw pagoError;

      triggerToast(`Plan de ${miembro.nombre} renovado (vence: ${vencimientoCalculado}).`);
      await fetchData();
    } catch (err) {
      console.error(err);
      triggerToast("Error al procesar renovación rápida.", "error");
    } finally {
      setLoading(false);
    }
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
    if (!miembro.telefono) {
      triggerToast("Miembro sin número telefónico.", "error");
      return;
    }
    const mensaje = `Hola ${miembro.nombre}, te saludamos de GymOS. Te recordamos que tu membresía (${miembro.membresia}) registrada el ${miembro.fecha_inicio} vence el ${miembro.vencimiento}. Te invitamos a realizar tu renovación para seguir entrenando sin cortes. ¡Te esperamos!`;
    const cleanPhone = miembro.telefono.replace(/\s+/g, '');
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(mensaje)}`, '_blank');
  };

  const totalMiembros = miembros.length;
  const miembrosActivos = miembros.filter(m => m.estadoPago === 'Al día' || m.estadoPago === 'Por vencer').length;
  const miembrosMorosos = miembros.filter(m => m.estadoPago === 'Vencido').length;
  const miembrosPorVencer = miembros.filter(m => m.estadoPago === 'Por vencer').length;

  const filteredMiembros = miembros.filter(m => {
    const matchesSearch = m.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          m.membresia.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (m.grupo_familiar && m.grupo_familiar.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesHealth = filterHealthAlerts ? m.alertas_medicas : true;
    return matchesSearch && matchesHealth;
  });

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 24,
      fontFamily: "'Geist', 'Inter', sans-serif", color: t.text
    }}>
      {/* Toast Notificación */}
      {showToast && (
        <div style={{
          position: 'fixed', bottom: 40, left: '50%', transform: 'translateX(-50%)', zIndex: 9999,
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div style={{
            backgroundColor: isDark ? 'rgba(20,20,20,0.95)' : 'rgba(245,245,247,0.98)',
            backdropFilter: 'blur(24px)', border: `1px solid ${t.border}`, padding: '14px 28px',
            borderRadius: 16, boxShadow: '0 20px 60px rgba(0,0,0,0.6)', display: 'flex',
            alignItems: 'center', gap: 12, minWidth: 280, justifyContent: 'center'
          }}>
            <div style={{ 
              width: 28, 
              height: 28, 
              borderRadius: '50%', 
              backgroundColor: toastType === 'success' ? '#10B981' : '#EF4444', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              color: '#FFF' 
            }}>
              {toastType === 'success' ? <CheckCircle size={16} style={{ color: '#000' }} /> : <AlertTriangle size={16} />}
            </div>
            <span style={{ color: t.text, fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em' }}>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10,
              background: `linear-gradient(135deg, ${t.accent}, #F59E0B)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: `0 4px 20px ${t.accent}20`
            }}>
              <Dumbbell size={20} style={{ color: '#0A0A0C' }} />
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em', margin: 0, fontFamily: "'Space Grotesk', sans-serif" }}>
              GymOS <span style={{ fontSize: 11, fontWeight: 650, color: t.accent, verticalAlign: 'middle', border: `1px solid ${t.accent}40`, padding: '2px 8px', borderRadius: 20, marginLeft: 8 }}>V2.0</span>
            </h1>
          </div>
          <p style={{ fontSize: 13, color: t.textMuted, margin: '6px 0 0 0' }}>
            Módulo de Administración de Fitness: Miembros, Fichas de Salud, Promociones y Facturación (Precios en Bolivianos Bs.).
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: 10 }}>
          <button 
            onClick={fetchData}
            disabled={loading}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px',
              borderRadius: 12, border: `1px solid ${t.border}`, backgroundColor: 'transparent',
              color: t.textMuted, cursor: 'pointer', fontSize: 13, fontWeight: 600,
              transition: 'all 0.2s ease', outline: 'none'
            }}
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
          
          <button 
            onClick={() => setIsModalOpen(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px',
              borderRadius: 12, border: `1px solid ${t.accent}`, backgroundColor: t.accentSoft,
              color: t.accent, cursor: 'pointer', fontSize: 13, fontWeight: 600,
              transition: 'all 0.2s ease', outline: 'none'
            }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = t.accent; e.currentTarget.style.color = '#0A0A0C'; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = t.accentSoft; e.currentTarget.style.color = t.accent; }}
          >
            <UserPlus size={16} />
            Nuevo Miembro
          </button>
        </div>
      </div>

      {/* Alerta de Base de Datos / SQL Faltante */}
      {dbError && (
        <div style={{
          padding: 16, borderRadius: 12, backgroundColor: 'rgba(239, 68, 68, 0.05)',
          border: '1px solid rgba(239, 68, 68, 0.2)', display: 'flex', flexDirection: 'column', gap: 8,
          animation: 'fadeIn 0.3s ease-out', marginBottom: 16
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#EF4444', fontWeight: 700, fontSize: 13 }}>
            <AlertTriangle size={18} />
            Tablas de Base de Datos no detectadas o migración faltante
          </div>
          <p style={{ fontSize: 12, color: t.textMuted, margin: 0, lineHeight: 1.5 }}>
            Parece que no se han creado o actualizado las tablas de <strong>GymOS V2.0</strong> en tu base de datos de Supabase. Para solucionarlo, ve al SQL Editor de Supabase y ejecuta el script <strong>supabase_gym_schema_v2.sql</strong> que he creado en la raíz de tu proyecto.
          </p>
        </div>
      )}

      {/* Tabs de Navegación Interna */}
      <div style={{
        display: 'flex', gap: 6, borderBottom: `1px solid ${t.border}`, paddingBottom: 1,
        overflowX: 'auto', WebkitOverflowScrolling: 'touch'
      }}>
        {[
          { id: 'resumen', label: 'Dashboard', icon: TrendingUp },
          { id: 'miembros', label: 'Base de Datos Miembros', icon: Users },
          { id: 'planes', label: 'Planes y Membresías', icon: CreditCard },
          { id: 'promociones', label: 'Cupones & Promos', icon: Tag },
          { id: 'papelera', label: 'Papelera de Clientes', icon: Trash2 }
        ].map(tab => {
          const active = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px',
                background: active ? 'rgba(255, 255, 255, 0.03)' : 'transparent',
                border: 'none', borderBottom: active ? `2px solid ${t.accent}` : '2px solid transparent',
                color: active ? t.accent : t.textMuted, cursor: 'pointer',
                fontSize: 13, fontWeight: active ? 600 : 500,
                transition: 'all 0.15s ease', outline: 'none', whiteSpace: 'nowrap'
              }}
            >
              <tab.icon size={15} />
              {tab.label}
              {tab.id === 'papelera' && papeleraMiembros.length > 0 && (
                <span style={{ fontSize: 9, backgroundColor: '#EF4444', color: '#FFF', padding: '1px 5px', borderRadius: 99, fontWeight: 700, marginLeft: 2 }}>{papeleraMiembros.length}</span>
              )}
            </button>
          );
        })}
      </div>

      {loading && miembros.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', gap: 12 }}>
          <div className="animate-spin" style={{ width: 28, height: 28, borderRadius: '50%', border: `2px solid ${t.border}`, borderTopColor: t.accent }} />
          <span style={{ fontSize: 12, color: t.textMuted }}>Sincronizando con base de datos de Supabase...</span>
        </div>
      ) : (
        <>
          {/* RENDERIZADO DE TABS */}
          
          {/* 1. TAB DASHBOARD */}
          {activeSubTab === 'resumen' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {/* Tarjetas de Métricas */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                <div style={{
                  padding: 20, borderRadius: 16, backgroundColor: t.panel, border: `1px solid ${t.border}`,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column', gap: 8
                }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: t.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Miembros Registrados</span>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                    <span style={{ fontSize: 28, fontWeight: 800 }}>{totalMiembros}</span>
                    <span style={{ fontSize: 11, color: t.accent, fontWeight: 600 }}>Total Activos</span>
                  </div>
                </div>

                <div style={{
                  padding: 20, borderRadius: 16, backgroundColor: t.panel, border: `1px solid ${t.border}`,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column', gap: 8
                }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: t.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Membresías Al Día</span>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                    <span style={{ fontSize: 28, fontWeight: 800, color: '#10B981' }}>{miembrosActivos}</span>
                    <span style={{ fontSize: 11, color: t.textMuted }}>{totalMiembros > 0 ? ((miembrosActivos/totalMiembros)*100).toFixed(0) : 0}%</span>
                  </div>
                </div>

                <div style={{
                  padding: 20, borderRadius: 16, backgroundColor: t.panel, border: `1px solid ${t.border}`,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column', gap: 8
                }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: t.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Próximos a Vencer</span>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                    <span style={{ fontSize: 28, fontWeight: 800, color: '#F59E0B' }}>{miembrosPorVencer}</span>
                    <span style={{ fontSize: 11, color: '#F59E0B', fontWeight: 500 }}>&le; 5 días</span>
                  </div>
                </div>

                <div style={{
                  padding: 20, borderRadius: 16, backgroundColor: t.panel, border: `1px solid ${t.border}`,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column', gap: 8
                }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: t.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Vencidos / Deudores</span>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                    <span style={{ fontSize: 28, fontWeight: 800, color: '#EF4444' }}>{miembrosMorosos}</span>
                    <span style={{ fontSize: 11, color: '#EF4444', fontWeight: 600 }}>Alerta de Cobro</span>
                  </div>
                </div>
              </div>

              {/* Fila de Contenido Principal del Dashboard */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
                {/* Clientes Morosos con Acción Rápida */}
                <div style={{
                  padding: 20, borderRadius: 16, backgroundColor: t.panel, border: `1px solid ${t.border}`,
                  display: 'flex', flexDirection: 'column', gap: 16
                }}>
                  <div style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, fontFamily: "'Space Grotesk', sans-serif" }}>Acción de Cobro Requerida</h3>
                    <span style={{ fontSize: 10, color: '#EF4444', backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '2px 8px', borderRadius: 20, fontWeight: 600 }}>Alerta</span>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {miembros.filter(m => m.estadoPago === 'Vencido' || m.estadoPago === 'Por vencer').length > 0 ? (
                      miembros.filter(m => m.estadoPago === 'Vencido' || m.estadoPago === 'Por vencer').slice(0, 5).map(miembro => {
                        const colors = getStatusColor(miembro.estadoPago);
                        return (
                          <div key={miembro.id} style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            padding: 12, borderRadius: 12, backgroundColor: 'rgba(255, 255, 255, 0.02)',
                            border: `1px solid ${t.border}`
                          }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0, flex: 1, marginRight: 8 }}>
                              <span style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{miembro.nombre}</span>
                              <span style={{ fontSize: 11, color: t.textMuted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Plan: {miembro.membresia} • Vence: {miembro.vencimiento}</span>
                            </div>
                            
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                              <span style={{ 
                                fontSize: 10, fontWeight: 600, color: colors.text,
                                backgroundColor: colors.bg, padding: '2px 8px', borderRadius: 8,
                                border: `1px solid ${colors.border}`
                              }}>{miembro.estadoPago}</span>
                              
                              <button
                                onClick={() => handleSendWhatsApp(miembro)}
                                style={{
                                  padding: '6px 10px', borderRadius: 8, border: 'none',
                                  backgroundColor: '#10B981', color: '#FFFFFF', cursor: 'pointer',
                                  fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4,
                                  transition: 'opacity 0.2s'
                                }}
                              >
                                Recordar
                              </button>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p style={{ fontSize: 12, color: t.textMuted, textAlign: 'center', margin: '20px 0' }}>No hay cuentas pendientes o por vencer. ¡Todo al día!</p>
                    )}
                  </div>
                </div>

                {/* Fichas de Salud Importantes / Alertas */}
                <div style={{
                  padding: 20, borderRadius: 16, backgroundColor: t.panel, border: `1px solid ${t.border}`,
                  display: 'flex', flexDirection: 'column', gap: 16
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, fontFamily: "'Space Grotesk', sans-serif" }}>Atención Especial de Salud</h3>
                    <HeartPulse size={18} style={{ color: t.accent }} />
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {miembros.filter(m => m.alertas_medicas).length > 0 ? (
                      miembros.filter(m => m.alertas_medicas).slice(0, 4).map(miembro => (
                        <div key={miembro.id} style={{
                          padding: 12, borderRadius: 12, backgroundColor: 'rgba(245, 158, 11, 0.03)',
                          border: '1px solid rgba(245, 158, 11, 0.15)', display: 'flex', flexDirection: 'column', gap: 6
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: t.accent }}>{miembro.nombre}</span>
                            <span style={{ fontSize: 9, color: '#F59E0B', textTransform: 'uppercase', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 3 }}>
                              <AlertCircle size={10} /> Ficha de cuidado
                            </span>
                          </div>
                          <p style={{ fontSize: 11, color: t.textSecondary, margin: 0, lineHeight: 1.4 }}>
                            {miembro.notas_medicas || 'Requiere cuidado físico pero no se detallaron notas.'}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p style={{ fontSize: 12, color: t.textMuted, textAlign: 'center', margin: '20px 0' }}>No se han registrado alertas médicas o de discapacidad física.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. TAB BASE DE DATOS MIEMBROS */}
          {activeSubTab === 'miembros' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Barra de Búsqueda y Filtros */}
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <div style={{
                  flex: 1, minWidth: 260, position: 'relative', display: 'flex', alignItems: 'center'
                }}>
                  <Search size={16} style={{ position: 'absolute', left: 12, color: t.textMuted }} />
                  <input
                    type="text"
                    placeholder="Buscar miembro por nombre, membresía o grupo familiar..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    style={{
                      width: '100%', padding: '10px 12px 10px 36px', borderRadius: 10,
                      border: `1px solid ${t.border}`, backgroundColor: 'rgba(255,255,255,0.01)',
                      color: t.text, fontSize: 13, outline: 'none', transition: 'border-color 0.2s'
                    }}
                    onFocus={e => e.currentTarget.style.borderColor = t.accent}
                    onBlur={e => e.currentTarget.style.borderColor = t.border}
                  />
                </div>
                
                <button
                  onClick={() => setFilterHealthAlerts(!filterHealthAlerts)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px',
                    borderRadius: 10, border: `1px solid ${filterHealthAlerts ? '#F59E0B' : t.border}`,
                    backgroundColor: filterHealthAlerts ? 'rgba(245, 158, 11, 0.05)' : 'transparent',
                    color: filterHealthAlerts ? '#F59E0B' : t.textMuted, cursor: 'pointer',
                    fontSize: 13, fontWeight: 500, transition: 'all 0.2s'
                  }}
                >
                  <Filter size={14} />
                  {filterHealthAlerts ? 'Solo Alertas de Salud: ON' : 'Filtrar por Salud'}
                </button>
              </div>

              {/* Tabla de Miembros */}
              <div style={{
                width: '100%', overflowX: 'auto', backgroundColor: t.panel,
                border: `1px solid ${t.border}`, borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${t.border}`, backgroundColor: 'rgba(255,255,255,0.01)' }}>
                      <th style={{ padding: '14px 16px', color: t.textMuted, fontWeight: 600 }}>Miembro</th>
                      <th style={{ padding: '14px 16px', color: t.textMuted, fontWeight: 600 }}>Contacto</th>
                      <th style={{ padding: '14px 16px', color: t.textMuted, fontWeight: 600 }}>Membresía</th>
                      <th style={{ padding: '14px 16px', color: t.textMuted, fontWeight: 600 }}>Fecha Inicio</th>
                      <th style={{ padding: '14px 16px', color: t.textMuted, fontWeight: 600 }}>Vencimiento</th>
                      <th style={{ padding: '14px 16px', color: t.textMuted, fontWeight: 600 }}>Grupo Familiar</th>
                      <th style={{ padding: '14px 16px', color: t.textMuted, fontWeight: 600 }}>Estado Pago</th>
                      <th style={{ padding: '14px 16px', color: t.textMuted, fontWeight: 600, textAlign: 'right' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMiembros.length > 0 ? (
                      filteredMiembros.map((miembro) => {
                        const colors = getStatusColor(miembro.estadoPago);
                        return (
                          <tr key={miembro.id} style={{ borderBottom: `1px solid ${t.border}`, transition: 'background 0.2s' }}
                              onMouseOver={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.01)'}
                              onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                            <td style={{ padding: '14px 16px' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                <span style={{ fontWeight: 650 }}>{miembro.nombre}</span>
                                {miembro.alertas_medicas && (
                                  <span style={{ fontSize: 9, color: '#F59E0B', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <AlertTriangle size={10} /> Alerta Física
                                  </span>
                                )}
                              </div>
                            </td>
                            <td style={{ padding: '14px 16px', color: t.textSecondary }}>{miembro.telefono || '—'}</td>
                            <td style={{ padding: '14px 16px', fontWeight: 500 }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <span>{miembro.membresia}</span>
                                {miembro.cupon_aplicado && (
                                  <span style={{ fontSize: 9, color: t.accent, fontWeight: 600 }}>Promo: {miembro.cupon_aplicado}</span>
                                )}
                              </div>
                            </td>
                            <td style={{ padding: '14px 16px', color: t.textSecondary }}>{miembro.fecha_inicio}</td>
                            <td style={{ padding: '14px 16px', color: t.textSecondary }}>{miembro.vencimiento}</td>
                            <td style={{ padding: '14px 16px', color: t.textSecondary }}>
                              {miembro.grupo_familiar ? (
                                <span style={{ color: t.accent, backgroundColor: `${t.accent}0a`, border: `1px solid ${t.accent}20`, padding: '2px 8px', borderRadius: 8, fontSize: 11 }}>
                                  {miembro.grupo_familiar}
                                </span>
                              ) : '—'}
                            </td>
                            <td style={{ padding: '14px 16px' }}>
                              <span style={{
                                fontSize: 10, fontWeight: 600, color: colors.text,
                                backgroundColor: colors.bg, padding: '4px 10px', borderRadius: 20,
                                border: `1px solid ${colors.border}`
                              }}>{miembro.estadoPago}</span>
                            </td>
                            <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                                <button
                                  onClick={() => handleRenovacionRapida(miembro)}
                                  title="Renovar plan actual"
                                  style={{
                                    padding: '5px 10px', borderRadius: 8, border: `1px solid ${t.border}`,
                                    backgroundColor: 'transparent', color: t.text, cursor: 'pointer',
                                    fontSize: 11, fontWeight: 600, transition: 'all 0.2s'
                                  }}
                                  onMouseEnter={e => e.currentTarget.style.borderColor = t.accent}
                                  onMouseLeave={e => e.currentTarget.style.borderColor = t.border}
                                >
                                  Renovar
                                </button>
                                
                                {miembro.telefono && (
                                  <button
                                    onClick={() => handleSendWhatsApp(miembro)}
                                    title="Enviar recordatorio WhatsApp"
                                    style={{
                                      padding: '5px 10px', borderRadius: 8, border: 'none',
                                      backgroundColor: '#10B981', color: '#FFFFFF', cursor: 'pointer',
                                      fontSize: 11, fontWeight: 650, display: 'flex', alignItems: 'center'
                                    }}
                                  >
                                    Recordar
                                  </button>
                                )}

                                <button
                                  onClick={() => openDeleteModal(miembro)}
                                  title="Eliminar Miembro (Envía a Papelera)"
                                  style={{
                                    padding: '5px 10px', borderRadius: 8, border: 'none',
                                    backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', cursor: 'pointer',
                                    fontSize: 11, fontWeight: 600
                                  }}
                                  onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.2)'}
                                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'}
                                >
                                  Eliminar
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="8" style={{ padding: '40px 16px', textAlign: 'center', color: t.textMuted }}>
                          No se encontraron miembros registrados.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 3. TAB PLANES Y MEMBRESÍAS */}
          {activeSubTab === 'planes' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, fontFamily: "'Space Grotesk', sans-serif" }}>Planes Habilitados en Supabase</h3>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
                {planes.map(plan => (
                  <div key={plan.id} style={{
                    padding: 20, borderRadius: 16, backgroundColor: t.panel, border: `1px solid ${t.border}`,
                    display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 14
                  }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <span style={{ fontSize: 15, fontWeight: 750 }}>{plan.nombre}</span>
                        <span style={{ fontSize: 16, fontWeight: 800, color: t.accent }}>{plan.precio} Bs.</span>
                      </div>
                      <p style={{ fontSize: 12, color: t.textSecondary, margin: 0, lineHeight: 1.5 }}>
                        {plan.descripcion || 'Sin descripción'}
                      </p>
                    </div>
                    <div style={{ borderTop: `1px solid ${t.border}`, paddingTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 10, color: t.textMuted }}>Periodo: {plan.duracion_meses} mes(es)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. TAB DESCUENTOS Y PROMOS (Cupones CRUD) */}
          {activeSubTab === 'promociones' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr md:350px', gap: 20, alignItems: 'start' }}>
              
              {/* Listado de Cupones */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, fontFamily: "'Space Grotesk', sans-serif" }}>Cupones Registrados</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
                  {cupones.length > 0 ? (
                    cupones.map(promo => (
                      <div key={promo.id} style={{
                        padding: 20, borderRadius: 16, backgroundColor: t.panel, border: `1px solid ${t.border}`,
                        display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 14,
                        opacity: promo.activo ? 1 : 0.6
                      }}>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                            <span style={{ 
                              fontSize: 12, fontWeight: 700, color: t.accent,
                              fontFamily: "'JetBrains Mono', monospace", border: `1px solid ${t.accent}40`,
                              padding: '4px 8px', borderRadius: 6, backgroundColor: `${t.accent}0d`
                            }}>{promo.codigo}</span>
                            <span style={{ 
                              fontSize: 10, fontWeight: 600, color: promo.activo ? '#10B981' : t.textMuted,
                              display: 'flex', alignItems: 'center', gap: 4
                            }}>
                              {promo.activo ? <CheckCircle size={12} /> : <XCircle size={12} />}
                              {promo.activo ? 'Activo' : 'Inactivo'}
                            </span>
                          </div>
                          <p style={{ fontSize: 12, color: t.textSecondary, margin: 0 }}>
                            Tipo: {promo.tipo_descuento} • Valor: {promo.tipo_descuento === 'Porcentaje' ? `${promo.valor}%` : `${promo.valor} Bs.`}
                          </p>
                        </div>
                        <div style={{ borderTop: `1px solid ${t.border}`, paddingTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => toggleCouponStatus(promo.id, promo.activo)}
                            style={{
                              background: 'none', border: 'none', color: t.textSecondary, fontSize: 11,
                              cursor: 'pointer', fontWeight: 600
                            }}
                          >
                            {promo.activo ? 'Desactivar' : 'Activar'}
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p style={{ fontSize: 12, color: t.textMuted, gridColumn: '1/-1', textAlign: 'center', padding: '40px 0' }}>No hay cupones guardados. Crea uno al lado.</p>
                  )}
                </div>
              </div>

              {/* Crear Cupón */}
              <form onSubmit={handleCreateCoupon} style={{
                padding: 20, borderRadius: 16, backgroundColor: t.panel, border: `1px solid ${t.border}`,
                display: 'flex', flexDirection: 'column', gap: 14
              }}>
                <h3 style={{ fontSize: 14, fontWeight: 800, margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: "'Space Grotesk', sans-serif" }}>Crear Nuevo Cupón</h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontSize: 10, color: t.textMuted, fontWeight: 600, textTransform: 'uppercase' }}>Código del Cupón</label>
                  <input
                    type="text"
                    value={newCoupon.codigo}
                    onChange={e => setNewCoupon({ ...newCoupon, codigo: e.target.value })}
                    placeholder="Ej. VERANO30"
                    required
                    style={{ padding: 10, borderRadius: 8, border: `1px solid ${t.border}`, backgroundColor: 'rgba(255,255,255,0.01)', color: t.text, outline: 'none' }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontSize: 10, color: t.textMuted, fontWeight: 600, textTransform: 'uppercase' }}>Tipo de Descuento</label>
                  <select
                    value={newCoupon.tipo_descuento}
                    onChange={e => setNewCoupon({ ...newCoupon, tipo_descuento: e.target.value })}
                    style={{ padding: 10, borderRadius: 8, border: `1px solid ${t.border}`, backgroundColor: t.panel, color: t.text, outline: 'none' }}
                  >
                    <option value="Porcentaje">Porcentaje (%)</option>
                    <option value="Monto">Monto Fijo (Bs.)</option>
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontSize: 10, color: t.textMuted, fontWeight: 600, textTransform: 'uppercase' }}>Valor del Descuento</label>
                  <input
                    type="number"
                    value={newCoupon.valor}
                    onChange={e => setNewCoupon({ ...newCoupon, valor: parseFloat(e.target.value) || 0 })}
                    placeholder="Ej. 10"
                    min="1"
                    required
                    style={{ padding: 10, borderRadius: 8, border: `1px solid ${t.border}`, backgroundColor: 'rgba(255,255,255,0.01)', color: t.text, outline: 'none' }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={couponLoading}
                  style={{
                    padding: '10px 14px', borderRadius: 8, border: 'none',
                    backgroundColor: t.accent, color: '#0A0A0C', cursor: 'pointer',
                    fontSize: 12, fontWeight: 600, transition: 'opacity 0.2s', marginTop: 6
                  }}
                  onMouseEnter={e => e.currentTarget.style.opacity = 0.9}
                  onMouseLeave={e => e.currentTarget.style.opacity = 1}
                >
                  {couponLoading ? 'Creando...' : 'Guardar Cupón'}
                </button>
              </form>

            </div>
          )}

          {/* 5. TAB PAPELERA DE CLIENTES */}
          {activeSubTab === 'papelera' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, fontFamily: "'Space Grotesk', sans-serif" }}>Papelera de Clientes Borrados</h3>
              
              <div style={{
                width: '100%', overflowX: 'auto', backgroundColor: t.panel,
                border: `1px solid ${t.border}`, borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${t.border}`, backgroundColor: 'rgba(255,255,255,0.01)' }}>
                      <th style={{ padding: '14px 16px', color: t.textMuted, fontWeight: 600 }}>Miembro</th>
                      <th style={{ padding: '14px 16px', color: t.textMuted, fontWeight: 600 }}>Fecha Borrado</th>
                      <th style={{ padding: '14px 16px', color: t.textMuted, fontWeight: 600 }}>Fecha Expiración</th>
                      <th style={{ padding: '14px 16px', color: t.textMuted, fontWeight: 600 }}>Plan Original</th>
                      <th style={{ padding: '14px 16px', color: t.textMuted, fontWeight: 600, textAlign: 'right' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {papeleraMiembros.length > 0 ? (
                      papeleraMiembros.map((item) => {
                        const datos = item.datos_originales || {};
                        const borrado = new Date(item.borrado_el).toLocaleDateString();
                        const expira = new Date(item.expira_el).toLocaleDateString();
                        return (
                          <tr key={item.id} style={{ borderBottom: `1px solid ${t.border}`, transition: 'background 0.2s' }}
                              onMouseOver={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.01)'}
                              onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                            <td style={{ padding: '14px 16px', fontWeight: 650 }}>{item.nombre_item}</td>
                            <td style={{ padding: '14px 16px', color: t.textSecondary }}>{borrado}</td>
                            <td style={{ padding: '14px 16px', color: '#EF4444', fontWeight: 600 }}>{expira}</td>
                            <td style={{ padding: '14px 16px', color: t.textSecondary }}>{datos.membresia || '—'}</td>
                            <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                                <button
                                  onClick={() => handleRestoreMiembro(item)}
                                  title="Restaurar miembro a la base activa"
                                  style={{
                                    padding: '5px 10px', borderRadius: 8, border: `1px solid ${t.border}`,
                                    backgroundColor: 'transparent', color: t.text, cursor: 'pointer',
                                    fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4
                                  }}
                                >
                                  <RotateCcw size={12} /> Restaurar
                                </button>
                                
                                <button
                                  onClick={() => handlePurgeMiembro(item.id)}
                                  title="Eliminar de forma permanente"
                                  style={{
                                    padding: '5px 10px', borderRadius: 8, border: 'none',
                                    backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', cursor: 'pointer',
                                    fontSize: 11, fontWeight: 600
                                  }}
                                >
                                  Purgar
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="5" style={{ padding: '40px 16px', textAlign: 'center', color: t.textMuted }}>
                          La papelera de clientes está vacía.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* MODAL: NUEVO MIEMBRO */}
      {isModalOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center',
          justifyContent: 'center', padding: 16, backgroundColor: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)'
        }}>
          <form onSubmit={handleSaveMiembro} style={{
            maxWidth: 500, width: '100%', backgroundColor: t.panel, border: `1px solid ${t.border}`,
            borderRadius: 20, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            display: 'flex', flexDirection: 'column', gap: 20, padding: 24,
            animation: 'fadeInScale 0.2s ease-out forwards'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: 16, fontWeight: 800, margin: 0, fontFamily: "'Space Grotesk', sans-serif" }}>Registrar Miembro y Pago</h2>
              <button 
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'none', border: 'none', color: t.textMuted, cursor: 'pointer', outline: 'none' }}
              >
                <XCircle size={20} />
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 10, color: t.textMuted, fontWeight: 600, textTransform: 'uppercase' }}>Nombre Completo</label>
                <input 
                  type="text" 
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleInputChange}
                  placeholder="Ej. Carlos Pérez" 
                  required
                  style={{ padding: 10, borderRadius: 8, border: `1px solid ${t.border}`, backgroundColor: 'rgba(255,255,255,0.01)', color: t.text, outline: 'none' }} 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontSize: 10, color: t.textMuted, fontWeight: 600, textTransform: 'uppercase' }}>Número de Teléfono</label>
                  <input 
                    type="text" 
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleInputChange}
                    placeholder="Ej. 70838665" 
                    style={{ padding: 10, borderRadius: 8, border: `1px solid ${t.border}`, backgroundColor: 'rgba(255,255,255,0.01)', color: t.text, outline: 'none' }} 
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontSize: 10, color: t.textMuted, fontWeight: 600, textTransform: 'uppercase' }}>Correo Electrónico</label>
                  <input 
                    type="email" 
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="carlos@correo.com" 
                    style={{ padding: 10, borderRadius: 8, border: `1px solid ${t.border}`, backgroundColor: 'rgba(255,255,255,0.01)', color: t.text, outline: 'none' }} 
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontSize: 10, color: t.textMuted, fontWeight: 600, textTransform: 'uppercase' }}>Plan de Membresía</label>
                  <select 
                    name="plan_id"
                    value={formData.plan_id}
                    onChange={handleInputChange}
                    style={{ padding: 10, borderRadius: 8, border: `1px solid ${t.border}`, backgroundColor: t.panel, color: t.text, outline: 'none' }}
                  >
                    {planes.map(p => <option key={p.id} value={p.id}>{p.nombre} ({p.precio} Bs.)</option>)}
                  </select>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontSize: 10, color: t.textMuted, fontWeight: 600, textTransform: 'uppercase' }}>Grupo Familiar (Opcional)</label>
                  <input 
                    type="text" 
                    name="grupo_familiar"
                    value={formData.grupo_familiar}
                    onChange={handleInputChange}
                    placeholder="Ej. Familia Pérez" 
                    style={{ padding: 10, borderRadius: 8, border: `1px solid ${t.border}`, backgroundColor: 'rgba(255,255,255,0.01)', color: t.text, outline: 'none' }} 
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontSize: 10, color: t.textMuted, fontWeight: 600, textTransform: 'uppercase' }}>Fecha de Inicio</label>
                  <input 
                    type="date" 
                    name="fecha_inicio"
                    value={formData.fecha_inicio}
                    onChange={handleInputChange}
                    style={{ padding: 10, borderRadius: 8, border: `1px solid ${t.border}`, backgroundColor: 'rgba(255,255,255,0.01)', color: t.text, outline: 'none' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontSize: 10, color: t.textMuted, fontWeight: 600, textTransform: 'uppercase' }}>Método de Pago</label>
                  <select 
                    name="metodo_pago"
                    value={formData.metodo_pago}
                    onChange={handleInputChange}
                    style={{ padding: 10, borderRadius: 8, border: `1px solid ${t.border}`, backgroundColor: t.panel, color: t.text, outline: 'none' }}
                  >
                    <option value="Efectivo">Efectivo</option>
                    <option value="Transferencia">Transferencia Bancaria</option>
                    <option value="Tarjeta">Tarjeta de Crédito/Débito</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontSize: 10, color: t.textMuted, fontWeight: 600, textTransform: 'uppercase' }}>Aplicar Cupón</label>
                  <select 
                    name="cupon_id"
                    value={formData.cupon_id}
                    onChange={handleInputChange}
                    style={{ padding: 10, borderRadius: 8, border: `1px solid ${t.border}`, backgroundColor: t.panel, color: t.text, outline: 'none' }}
                  >
                    <option value="">Ninguno</option>
                    {cupones.filter(c => c.activo).map(c => (
                      <option key={c.id} value={c.id}>
                        {c.codigo} ({c.tipo_descuento === 'Porcentaje' ? `${c.valor}%` : `${c.valor} Bs.`})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontSize: 10, color: t.textMuted, fontWeight: 600, textTransform: 'uppercase' }}>Descuento Manual Directo (Bs.)</label>
                  <input 
                    type="number" 
                    name="descuento_manual"
                    value={formData.descuento_manual}
                    onChange={handleInputChange}
                    placeholder="0.00" 
                    min="0"
                    step="0.01"
                    style={{ padding: 10, borderRadius: 8, border: `1px solid ${t.border}`, backgroundColor: 'rgba(255,255,255,0.01)', color: t.text, outline: 'none' }} 
                  />
                </div>
              </div>

              {/* Caja informativa de Cobro */}
              <div style={{
                padding: 12, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.02)',
                border: `1px solid ${t.border}`, display: 'flex', justifyContent: 'space-between',
                fontSize: 12, fontWeight: 600
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ color: t.textMuted }}>Subtotal: {getPreciosFinales().subtotal} Bs.</span>
                  <span style={{ color: t.accent }}>Descuento: -{getPreciosFinales().descuento} Bs.</span>
                </div>
                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ color: t.textMuted }}>Moneda: Bs. (Bolivia)</span>
                  <span style={{ fontSize: 14, color: '#10B981', fontWeight: 800 }}>Total: {getPreciosFinales().total} Bs.</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 10, color: t.textMuted, fontWeight: 600, textTransform: 'uppercase' }}>Notas Médicas / Discapacidad / Problemas Hereditarios</label>
                <textarea 
                  name="notas_medicas"
                  value={formData.notas_medicas}
                  onChange={handleInputChange}
                  placeholder="Ej. Diagnóstico de asma, problemas cardíacos hereditarios o discapacidades físicas..." 
                  rows="3"
                  style={{ padding: 10, borderRadius: 8, border: `1px solid ${t.border}`, backgroundColor: 'rgba(255,255,255,0.01)', color: t.text, outline: 'none', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                <input 
                  type="checkbox" 
                  name="alertas_medicas"
                  id="alertas_medicas"
                  checked={formData.alertas_medicas}
                  onChange={handleInputChange}
                  style={{ cursor: 'pointer' }}
                />
                <label htmlFor="alertas_medicas" style={{ fontSize: 12, color: '#F59E0B', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <AlertCircle size={14} /> Activar alerta visual de cuidado físico en el sistema
                </label>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, borderTop: `1px solid ${t.border}`, paddingTop: 16 }}>
              <button 
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{ padding: '8px 16px', borderRadius: 8, border: `1px solid ${t.border}`, background: 'transparent', color: t.textMuted, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
              >
                Cancelar
              </button>
              
              <button 
                type="submit"
                disabled={loading}
                style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: t.accent, color: '#0A0A0C', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
              >
                {loading ? 'Guardando...' : 'Registrar y Pagar'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL DE CONFIRMACIÓN DE ELIMINACIÓN SEGURO (PAPELERA DÍAS) */}
      {deleteModalOpen && selectedMiembroForDelete && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1001, display: 'flex', alignItems: 'center',
          justifyContent: 'center', padding: 16, backgroundColor: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)'
        }}>
          <div style={{
            maxWidth: 420, width: '100%', backgroundColor: t.panel, border: `1px solid ${t.border}`,
            borderRadius: 20, padding: 24, display: 'flex', flexDirection: 'column', gap: 16,
            animation: 'fadeInScale 0.2s ease-out forwards'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#EF4444' }}>
              <ShieldAlert size={22} />
              <h3 style={{ fontSize: 15, fontWeight: 800, margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: "'Space Grotesk', sans-serif" }}>Confirmar Envío a Papelera</h3>
            </div>
            
            <p style={{ fontSize: 12, color: t.textSecondary, margin: 0, lineHeight: 1.5 }}>
              ¿Estás seguro de que deseas enviar a <strong>{selectedMiembroForDelete.nombre}</strong> a la papelera? Su servicio quedará inactivo.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, margin: '8px 0' }}>
              <label style={{ fontSize: 10, color: t.textMuted, fontWeight: 650, textTransform: 'uppercase' }}>
                Días de retención en papelera antes del borrado final:
              </label>
              <input
                type="number"
                value={diasRetencionDelete}
                onChange={e => setDiasRetencionDelete(Math.max(1, parseInt(e.target.value, 10) || 60))}
                min="1"
                placeholder="60"
                style={{ padding: 10, borderRadius: 8, border: `1px solid ${t.border}`, backgroundColor: 'rgba(255,255,255,0.01)', color: t.text, outline: 'none', fontSize: 13, fontWeight: 600 }}
              />
              <span style={{ fontSize: 9, color: t.textMuted }}>
                *El registro se eliminará permanentemente de forma automática transcurrido este tiempo.
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, borderTop: `1px solid ${t.border}`, paddingTop: 14 }}>
              <button
                type="button"
                onClick={() => { setDeleteModalOpen(false); setSelectedMiembroForDelete(null); }}
                style={{ padding: '8px 16px', borderRadius: 8, border: `1px solid ${t.border}`, background: 'transparent', color: t.textMuted, cursor: 'pointer', fontSize: 11, fontWeight: 600 }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={loading}
                style={{ padding: '8px 16px', borderRadius: 8, border: 'none', backgroundColor: '#EF4444', color: '#FFF', cursor: 'pointer', fontSize: 11, fontWeight: 600 }}
              >
                {loading ? 'Borrando...' : 'Mover a Papelera'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default SistemaGimnasio;
