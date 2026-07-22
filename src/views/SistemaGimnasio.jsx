// Inefable - Sistema Pro (Sistema de Gestión de Gimnasio & Fitness Enterprise)
// Updated: Header "Sistema Pro", Ultra-Detailed Pricing Cards in Bs. & Vibrant Colored Coupon Badges
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

// Mapa de esquemas de colores vibrantes para cada cupón
const COUPON_COLOR_PALETTES = [
  { border: '#10B981', bg: 'rgba(16, 185, 129, 0.06)', gradient: 'linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(16,185,129,0.02) 100%)', badgeBg: 'rgba(16, 185, 129, 0.2)', text: '#10B981' },
  { border: '#F59E0B', bg: 'rgba(245, 158, 11, 0.06)', gradient: 'linear-gradient(135deg, rgba(245,158,11,0.15) 0%, rgba(245,158,11,0.02) 100%)', badgeBg: 'rgba(245, 158, 11, 0.2)', text: '#F59E0B' },
  { border: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.06)', gradient: 'linear-gradient(135deg, rgba(139,92,246,0.15) 0%, rgba(139,92,246,0.02) 100%)', badgeBg: 'rgba(139, 92, 246, 0.2)', text: '#8B5CF6' },
  { border: '#F43F5E', bg: 'rgba(244, 63, 94, 0.06)', gradient: 'linear-gradient(135deg, rgba(244,63,94,0.15) 0%, rgba(244,63,94,0.02) 100%)', badgeBg: 'rgba(244, 63, 94, 0.2)', text: '#F43F5E' },
  { border: '#06B6D4', bg: 'rgba(6, 182, 212, 0.06)', gradient: 'linear-gradient(135deg, rgba(6,182,212,0.15) 0%, rgba(6,182,212,0.02) 100%)', badgeBg: 'rgba(6, 182, 212, 0.2)', text: '#06B6D4' }
];

const SistemaGimnasio = ({ settings, isDark }) => {
  const t = useTheme(isDark);
  const [activeSubTab, setActiveSubTab] = useState('resumen');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterHealthAlerts, setFilterHealthAlerts] = useState(false);
  const [planCategoryFilter, setPlanCategoryFilter] = useState('Todos');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Estados para datos reales de Supabase
  const [miembros, setMiembros] = useState([]);
  const [planes, setPlanes] = useState([]);
  const [pagos, setPagos] = useState([]);
  const [cupones, setCupones] = useState([]);
  const [papeleraMiembros, setPapeleraMiembros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState(false);
  const [filterPaymentStatus, setFilterPaymentStatus] = useState('Todos');
  const [hoveredMiembroId, setHoveredMiembroId] = useState(null);
  
  // Estados para Control de Acceso (Check-in Terminal)
  const [checkinInput, setCheckinInput] = useState('');
  const [checkinResult, setCheckinResult] = useState(null);
  const [accesosHoy, setAccesosHoy] = useState([]);

  // Estado para Expediente 360° y Progreso Físico
  const [selectedMiembro360, setSelectedMiembro360] = useState(null);
  const [progresosFisicos, setProgresosFisicos] = useState([]);
  const [newProgreso, setNewProgreso] = useState({
    peso_kg: '',
    porcentaje_grasa: '',
    masa_muscular_kg: '',
    medida_cintura_cm: '',
    medida_pecho_cm: '',
    notas: ''
  });

  // Estados para Toasts
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastType, setToastType] = useState('success');

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
            duracion_dias
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

      // 5. Obtener Miembros en Papelera
      const { data: papeleraData, error: papeleraError } = await supabase
        .from('papelera')
        .select('*')
        .eq('tipo_dato', 'gym_miembro');
      
      if (papeleraError) throw papeleraError;
      setPapeleraMiembros(papeleraData || []);

      // Mapear miembros y calcular estado y fechas
      const hoy = new Date().toISOString().split('T')[0];
      const miembrosConEstado = (miembrosData || []).map(miembro => {
        const pagosMiembro = (pagosData || []).filter(p => p.miembro_id === miembro.id && p.estado === 'Pagado');
        
        let estadoPago = 'Vencido';
        let vencimiento = 'Sin registro';
        let fechaInicioMembresia = miembro.fecha_inicio || 'Sin registro';

        if (pagosMiembro.length > 0) {
          const ultimoPago = pagosMiembro[0];
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
          duracionPlan: miembro.gym_planes?.duracion_dias || 30,
          fecha_inicio: fechaInicioMembresia,
          vencimiento,
          estadoPago
        };
      });

      setMiembros(miembrosConEstado);

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

  // Calcular vencimiento en base a días de manera segura
  const calcularVencimiento = (fechaBaseStr, dias) => {
    let diasNum = parseInt(dias, 10);
    if (isNaN(diasNum)) diasNum = 30;
    
    const baseStr = fechaBaseStr || new Date().toISOString().split('T')[0];
    const d = new Date(baseStr + 'T12:00:00');
    
    if (isNaN(d.getTime())) {
      const backupDate = new Date();
      backupDate.setDate(backupDate.getDate() + diasNum);
      return backupDate.toISOString().split('T')[0];
    }
    
    d.setDate(d.getDate() + diasNum);
    return d.toISOString().split('T')[0];
  };

  // Precios y Descuentos
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
      descuento: Math.min(descuento, subtotal),
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

  // Crear cupón
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

  // Registrar nuevo miembro
  const handleSaveMiembro = async (e) => {
    e.preventDefault();
    if (!formData.nombre.trim()) {
      triggerToast("El nombre es requerido.", "error");
      return;
    }

    if (!formData.plan_id) {
      triggerToast("Debes seleccionar un plan de membresía.", "error");
      return;
    }

    setLoading(true);
    try {
      const planSeleccionado = planes.find(p => p.id === formData.plan_id);
      const cuponSeleccionado = cupones.find(c => c.id === formData.cupon_id);
      
      const { descuento } = getPreciosFinales();
      const duracionDias = planSeleccionado ? (planSeleccionado.duracion_dias || 30) : 30;
      const vencimientoCalculado = calcularVencimiento(formData.fecha_inicio, duracionDias);

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

  // Procesar Check-In en Vivo
  const handleProcessCheckin = (e) => {
    if (e) e.preventDefault();
    if (!checkinInput.trim()) return;

    const term = checkinInput.trim().toLowerCase();
    const miembroEncontrado = miembros.find(m => 
      m.nombre.toLowerCase().includes(term) || 
      (m.telefono && m.telefono.includes(term)) ||
      m.id.toLowerCase().startsWith(term)
    );

    const horaActual = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    if (!miembroEncontrado) {
      setCheckinResult({
        permitido: false,
        mensaje: 'Miembro no encontrado en el sistema',
        hora: horaActual
      });
      return;
    }

    const estaAlDia = miembroEncontrado.estadoPago === 'Al día' || miembroEncontrado.estadoPago === 'Por vencer';

    const nuevoAcceso = {
      id: Date.now(),
      miembro: miembroEncontrado,
      permitido: estaAlDia,
      hora: horaActual,
      fecha: new Date().toLocaleDateString()
    };

    setCheckinResult(nuevoAcceso);
    setAccesosHoy(prev => [nuevoAcceso, ...prev]);
    setCheckinInput('');
  };

  // Registrar Evaluación Física en Expediente 360°
  const handleAddProgresoFisico = (e) => {
    e.preventDefault();
    if (!selectedMiembro360) return;

    const nuevoRegistro = {
      id: Date.now(),
      fecha: new Date().toISOString().split('T')[0],
      peso_kg: parseFloat(newProgreso.peso_kg) || 0,
      porcentaje_grasa: parseFloat(newProgreso.porcentaje_grasa) || 0,
      masa_muscular_kg: parseFloat(newProgreso.masa_muscular_kg) || 0,
      medida_cintura_cm: parseFloat(newProgreso.medida_cintura_cm) || 0,
      medida_pecho_cm: parseFloat(newProgreso.medida_pecho_cm) || 0,
      notas: newProgreso.notas
    };

    setProgresosFisicos(prev => [nuevoRegistro, ...prev]);
    triggerToast(`Evaluación física registrada para ${selectedMiembro360.nombre}.`);
    setNewProgreso({ peso_kg: '', porcentaje_grasa: '', masa_muscular_kg: '', medida_cintura_cm: '', medida_pecho_cm: '', notas: '' });
  };

  // Modal Borrado
  const openDeleteModal = (miembro) => {
    setSelectedMiembroForDelete(miembro);
    setDiasRetencionDelete(60);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedMiembroForDelete) return;

    setLoading(true);
    try {
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

  const handleRestoreMiembro = async (trashEntry) => {
    setLoading(true);
    try {
      const dataOriginal = trashEntry.datos_originales;

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

  const handleRenovacionRapida = async (miembro) => {
    setLoading(true);
    try {
      const planSeleccionado = planes.find(p => p.id === miembro.plan_id);
      if (!planSeleccionado) {
        triggerToast("Este miembro no tiene un plan asignado válido.", "error");
        return;
      }

      let fechaBase = new Date();
      if (miembro.vencimiento && miembro.vencimiento !== 'Sin registro') {
        const tempVence = new Date(miembro.vencimiento + 'T12:00:00');
        if (tempVence > fechaBase) {
          fechaBase = tempVence;
        }
      }

      const inicioStr = fechaBase.toISOString().split('T')[0];
      const vencimientoCalculado = calcularVencimiento(inicioStr, planSeleccionado.duracion_dias);

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
    const mensaje = `Hola ${miembro.nombre}, te saludamos de Sistema Pro. Te recordamos que tu membresía (${miembro.membresia}) registrada el ${miembro.fecha_inicio} vence el ${miembro.vencimiento}. Te invitamos a realizar tu renovación para seguir entrenando sin cortes. ¡Te esperamos!`;
    const cleanPhone = miembro.telefono.replace(/\s+/g, '');
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(mensaje)}`, '_blank');
  };

  // Cálculos Financieros
  const hoyStr = new Date().toISOString().split('T')[0];
  const ingresosHoy = pagos.filter(p => p.fecha_pago === hoyStr && p.estado === 'Pagado').reduce((acc, p) => acc + (parseFloat(p.monto) - parseFloat(p.descuento || 0)), 0);
  const ingresosMes = pagos.filter(p => p.estado === 'Pagado').reduce((acc, p) => acc + (parseFloat(p.monto) - parseFloat(p.descuento || 0)), 0);
  const totalDescuentos = pagos.reduce((acc, p) => acc + parseFloat(p.descuento || 0), 0);

  const totalMiembros = miembros.length;
  const miembrosActivos = miembros.filter(m => m.estadoPago === 'Al día' || m.estadoPago === 'Por vencer').length;
  const miembrosMorosos = miembros.filter(m => m.estadoPago === 'Vencido').length;
  const miembrosPorVencer = miembros.filter(m => m.estadoPago === 'Por vencer').length;

  const filteredMiembros = miembros.filter(m => {
    const matchesSearch = m.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          m.membresia.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (m.grupo_familiar && m.grupo_familiar.toLowerCase().includes(searchTerm.toLowerCase()));
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
              width: 28, height: 28, borderRadius: '50%', 
              backgroundColor: toastType === 'success' ? '#10B981' : '#EF4444', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF' 
            }}>
              {toastType === 'success' ? <CheckCircle size={16} style={{ color: '#000' }} /> : <AlertTriangle size={16} />}
            </div>
            <span style={{ color: t.text, fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em' }}>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Header Pro (Sin ícono al lado del nombre) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em', margin: 0, fontFamily: "'Space Grotesk', sans-serif" }}>
            Sistema Pro
          </h1>
          <p style={{ fontSize: 13, color: t.textMuted, margin: '4px 0 0 0' }}>
            Plataforma Enterprise de Control de Acceso, Expedientes, Contabilidad y Membresías.
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
            Actualizar
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

      {/* Alerta de Error de Base de Datos */}
      {dbError && (
        <div style={{
          padding: 16, borderRadius: 12, backgroundColor: 'rgba(239, 68, 68, 0.05)',
          border: '1px solid rgba(239, 68, 68, 0.2)', display: 'flex', flexDirection: 'column', gap: 8,
          animation: 'fadeIn 0.3s ease-out'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#EF4444', fontWeight: 700, fontSize: 13 }}>
            <AlertTriangle size={18} />
            Tablas de Base de Datos no detectadas o migración faltante
          </div>
          <p style={{ fontSize: 12, color: t.textMuted, margin: 0, lineHeight: 1.5 }}>
            Ve al SQL Editor de Supabase y ejecuta el script <strong>supabase_gym_schema_v2.sql</strong> para sincronizar.
          </p>
        </div>
      )}

      {/* Sub-navegación Pro */}
      <div style={{
        display: 'flex', gap: 6, borderBottom: `1px solid ${t.border}`, paddingBottom: 1,
        overflowX: 'auto', WebkitOverflowScrolling: 'touch'
      }}>
        {[
          { id: 'resumen', label: 'Dashboard', icon: TrendingUp },
          { id: 'checkin', label: 'Control de Acceso', icon: QrCode },
          { id: 'miembros', label: 'Miembros & Expedientes', icon: Users },
          { id: 'contabilidad', label: 'Contabilidad & Caja', icon: Receipt },
          { id: 'planes', label: 'Planes y Tarifas', icon: CreditCard },
          { id: 'promociones', label: 'Cupones & Promos', icon: Ticket },
          { id: 'papelera', label: 'Papelera', icon: Trash2 }
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
          {/* 1. DASHBOARD */}
          {activeSubTab === 'resumen' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {/* Tarjetas Interactivas de Métricas con Iconos Ricos */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                <div 
                  onClick={() => { setFilterPaymentStatus('Todos'); setActiveSubTab('miembros'); }}
                  style={{
                    padding: 20, borderRadius: 16, backgroundColor: t.panel, border: `1px solid ${t.border}`,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column', gap: 8,
                    cursor: 'pointer', transition: 'transform 0.2s, border-color 0.2s'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = t.accent; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = t.border; }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: t.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Miembros Registrados</span>
                    <Users size={18} style={{ color: t.accent }} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                    <span style={{ fontSize: 28, fontWeight: 800 }}>{totalMiembros}</span>
                    <span style={{ fontSize: 11, color: t.accent, fontWeight: 600 }}>Total Activos</span>
                  </div>
                </div>

                <div 
                  onClick={() => { setFilterPaymentStatus('Al día'); setActiveSubTab('miembros'); }}
                  style={{
                    padding: 20, borderRadius: 16, backgroundColor: t.panel, border: `1px solid ${t.border}`,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column', gap: 8,
                    cursor: 'pointer', transition: 'transform 0.2s, border-color 0.2s'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = '#10B981'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = t.border; }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: t.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Membresías Al Día</span>
                    <CheckCircle2 size={18} style={{ color: '#10B981' }} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                    <span style={{ fontSize: 28, fontWeight: 800, color: '#10B981' }}>{miembrosActivos}</span>
                    <span style={{ fontSize: 11, color: t.textMuted }}>{totalMiembros > 0 ? ((miembrosActivos/totalMiembros)*100).toFixed(0) : 0}%</span>
                  </div>
                </div>

                <div 
                  onClick={() => { setFilterPaymentStatus('Por vencer'); setActiveSubTab('miembros'); }}
                  style={{
                    padding: 20, borderRadius: 16, backgroundColor: t.panel, border: `1px solid ${t.border}`,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column', gap: 8,
                    cursor: 'pointer', transition: 'transform 0.2s, border-color 0.2s'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = '#F59E0B'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = t.border; }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: t.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Próximos a Vencer</span>
                    <Clock size={18} style={{ color: '#F59E0B' }} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                    <span style={{ fontSize: 28, fontWeight: 800, color: '#F59E0B' }}>{miembrosPorVencer}</span>
                    <span style={{ fontSize: 11, color: '#F59E0B', fontWeight: 500 }}>&le; 5 días</span>
                  </div>
                </div>

                <div 
                  onClick={() => { setFilterPaymentStatus('Vencido'); setActiveSubTab('miembros'); }}
                  style={{
                    padding: 20, borderRadius: 16, backgroundColor: t.panel, border: `1px solid ${t.border}`,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column', gap: 8,
                    cursor: 'pointer', transition: 'transform 0.2s, border-color 0.2s'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = '#EF4444'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = t.border; }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: t.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Vencidos / Deudores</span>
                    <AlertTriangle size={18} style={{ color: '#EF4444' }} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                    <span style={{ fontSize: 28, fontWeight: 800, color: '#EF4444' }}>{miembrosMorosos}</span>
                    <span style={{ fontSize: 11, color: '#EF4444', fontWeight: 600 }}>Alerta de Cobro</span>
                  </div>
                </div>
              </div>

              {/* Fila Principal Dashboard */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
                {/* Cobros Pendientes */}
                <div style={{
                  padding: 20, borderRadius: 16, backgroundColor: t.panel, border: `1px solid ${t.border}`,
                  display: 'flex', flexDirection: 'column', gap: 16
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, fontFamily: "'Space Grotesk', sans-serif", display: 'flex', alignItems: 'center', gap: 8 }}>
                      <AlertCircle size={18} style={{ color: '#EF4444' }} /> Acción de Cobro Requerida
                    </h3>
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
                                  fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4
                                }}
                              >
                                Recordar
                              </button>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p style={{ fontSize: 12, color: t.textMuted, textAlign: 'center', margin: '20px 0' }}>No hay cuentas pendientes o por vencer.</p>
                    )}
                  </div>
                </div>

                {/* Fichas Médicas Flotantes */}
                <div style={{
                  padding: 20, borderRadius: 16, backgroundColor: t.panel, border: `1px solid ${t.border}`,
                  display: 'flex', flexDirection: 'column', gap: 16
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, fontFamily: "'Space Grotesk', sans-serif", display: 'flex', alignItems: 'center', gap: 8 }}>
                      <HeartPulse size={18} style={{ color: t.accent }} /> Atención Especial de Salud
                    </h3>
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

          {/* 2. CONTROL DE ACCESO (CHECK-IN TERMINAL) */}
          {activeSubTab === 'checkin' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr md:360px', gap: 20, alignItems: 'start' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Caja de escaneo de torniquete */}
                <div style={{
                  padding: 24, borderRadius: 20, backgroundColor: t.panel, border: `1px solid ${t.border}`,
                  display: 'flex', flexDirection: 'column', gap: 16, boxShadow: '0 8px 30px rgba(0,0,0,0.2)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <QrCode size={24} style={{ color: t.accent }} />
                    <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, fontFamily: "'Space Grotesk', sans-serif" }}>Terminal de Ingreso y Torniquete Virtual</h3>
                  </div>
                  <p style={{ fontSize: 12, color: t.textMuted, margin: 0 }}>
                    Busca por Nombre, Teléfono o ID del Miembro para validar su derecho de acceso a las instalaciones.
                  </p>

                  <form onSubmit={handleProcessCheckin} style={{ display: 'flex', gap: 10 }}>
                    <input
                      type="text"
                      value={checkinInput}
                      onChange={e => setCheckinInput(e.target.value)}
                      placeholder="Escribe el nombre o teléfono del cliente..."
                      autoFocus
                      style={{
                        flex: 1, padding: '12px 16px', borderRadius: 12, border: `1px solid ${t.border}`,
                        backgroundColor: 'rgba(255,255,255,0.02)', color: t.text, fontSize: 14, outline: 'none'
                      }}
                    />
                    <button
                      type="submit"
                      style={{
                        padding: '12px 24px', borderRadius: 12, border: 'none',
                        backgroundColor: t.accent, color: '#0A0A0C', cursor: 'pointer',
                        fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8
                      }}
                    >
                      <CheckCircle size={16} /> Validar Ingreso
                    </button>
                  </form>
                </div>

                {/* Banner de Resultado Instantáneo */}
                {checkinResult && (
                  <div style={{
                    padding: 24, borderRadius: 20,
                    backgroundColor: checkinResult.permitido ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                    border: `1.5px solid ${checkinResult.permitido ? '#10B981' : '#EF4444'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
                    animation: 'fadeInScale 0.2s ease-out'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <div style={{
                        width: 50, height: 50, borderRadius: '50%',
                        backgroundColor: checkinResult.permitido ? '#10B981' : '#EF4444',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF'
                      }}>
                        {checkinResult.permitido ? <UserCheck size={28} style={{ color: '#0A0A0C' }} /> : <UserX size={28} />}
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: checkinResult.permitido ? '#10B981' : '#EF4444' }}>
                          {checkinResult.permitido ? '🟢 ACCESO CONCEDIDO' : '🔴 ACCESO DENEGADO'}
                        </span>
                        <h4 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>
                          {checkinResult.miembro ? checkinResult.miembro.nombre : 'Usuario Desconocido'}
                        </h4>
                        {checkinResult.miembro && (
                          <span style={{ fontSize: 12, color: t.textMuted }}>
                            Plan: {checkinResult.miembro.membresia} • Vence: {checkinResult.miembro.vencimiento}
                          </span>
                        )}
                      </div>
                    </div>

                    <span style={{ fontSize: 12, fontWeight: 700, color: t.textMuted }}>
                      {checkinResult.hora}
                    </span>
                  </div>
                )}
              </div>

              {/* Historial de Entradas de Hoy */}
              <div style={{
                padding: 20, borderRadius: 20, backgroundColor: t.panel, border: `1px solid ${t.border}`,
                display: 'flex', flexDirection: 'column', gap: 14
              }}>
                <h4 style={{ fontSize: 14, fontWeight: 800, margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Clock size={16} /> Entradas Registradas Hoy ({accesosHoy.length})
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 350, overflowY: 'auto' }} className="mac-scrollbar">
                  {accesosHoy.length > 0 ? (
                    accesosHoy.map(item => (
                      <div key={item.id} style={{
                        padding: 10, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.02)',
                        border: `1px solid ${t.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                      }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <span style={{ fontSize: 12, fontWeight: 650 }}>{item.miembro.nombre}</span>
                          <span style={{ fontSize: 10, color: t.textMuted }}>{item.miembro.membresia}</span>
                        </div>
                        <span style={{ fontSize: 10, fontWeight: 700, color: item.permitido ? '#10B981' : '#EF4444' }}>
                          {item.hora}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p style={{ fontSize: 11, color: t.textMuted, textAlign: 'center', margin: '30px 0' }}>Aún no hay ingresos escaneados hoy.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 3. BASE DE DATOS MIEMBROS & EXPEDIENTE 360° */}
          {activeSubTab === 'miembros' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Barra de Filtros */}
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 260, position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Search size={16} style={{ position: 'absolute', left: 12, color: t.textMuted }} />
                  <input
                    type="text"
                    placeholder="Buscar miembro por nombre, membresía o grupo..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    style={{
                      width: '100%', padding: '10px 12px 10px 36px', borderRadius: 10,
                      border: `1px solid ${t.border}`, backgroundColor: 'rgba(255,255,255,0.01)',
                      color: t.text, fontSize: 13, outline: 'none'
                    }}
                  />
                </div>
                
                <button
                  onClick={() => setFilterHealthAlerts(!filterHealthAlerts)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px',
                    borderRadius: 10, border: `1px solid ${filterHealthAlerts ? '#F59E0B' : t.border}`,
                    backgroundColor: filterHealthAlerts ? 'rgba(245, 158, 11, 0.05)' : 'transparent',
                    color: filterHealthAlerts ? '#F59E0B' : t.textMuted, cursor: 'pointer',
                    fontSize: 13, fontWeight: 500
                  }}
                >
                  <Filter size={14} />
                  {filterHealthAlerts ? 'Salud: ON' : 'Filtrar por Salud'}
                </button>

                <div style={{ display: 'flex', gap: 6, alignItems: 'center', borderLeft: `1px solid ${t.border}`, paddingLeft: 12 }}>
                  {[
                    { status: 'Todos', label: 'Todos', color: t.text },
                    { status: 'Al día', label: 'Al Día', color: '#10B981' },
                    { status: 'Por vencer', label: 'Por Vencer', color: '#F59E0B' },
                    { status: 'Vencido', label: 'Vencidos', color: '#EF4444' }
                  ].map(item => {
                    const active = filterPaymentStatus === item.status;
                    return (
                      <button
                        key={item.status}
                        onClick={() => setFilterPaymentStatus(item.status)}
                        style={{
                          padding: '6px 12px', borderRadius: 8, border: active ? `1px solid ${item.color}` : `1px solid ${t.border}`,
                          backgroundColor: active ? `${item.color}15` : 'transparent',
                          color: active ? item.color : t.textMuted, fontSize: 12, fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tabla de Miembros con Iconos Ricos */}
              <div style={{
                width: '100%', overflowX: 'auto', backgroundColor: t.panel,
                border: `1px solid ${t.border}`, borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${t.border}`, backgroundColor: 'rgba(255,255,255,0.01)' }}>
                      <th style={{ padding: '14px 16px', color: t.textMuted, fontWeight: 600 }}><span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Users size={14} /> Miembro</span></th>
                      <th style={{ padding: '14px 16px', color: t.textMuted, fontWeight: 600 }}><span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Phone size={14} /> Contacto</span></th>
                      <th style={{ padding: '14px 16px', color: t.textMuted, fontWeight: 600 }}><span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><CreditCard size={14} /> Membresía</span></th>
                      <th style={{ padding: '14px 16px', color: t.textMuted, fontWeight: 600 }}><span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Calendar size={14} /> Fecha Inicio</span></th>
                      <th style={{ padding: '14px 16px', color: t.textMuted, fontWeight: 600 }}><span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Clock size={14} /> Vencimiento</span></th>
                      <th style={{ padding: '14px 16px', color: t.textMuted, fontWeight: 600 }}><span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Users size={14} /> Grupo</span></th>
                      <th style={{ padding: '14px 16px', color: t.textMuted, fontWeight: 600 }}><span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Activity size={14} /> Estado</span></th>
                      <th style={{ padding: '14px 16px', color: t.textMuted, fontWeight: 600, textAlign: 'right' }}>Acciones Pro</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMiembros.length > 0 ? (
                      filteredMiembros.map((miembro) => {
                        const colors = getStatusColor(miembro.estadoPago);
                        return (
                          <tr key={miembro.id} style={{ borderBottom: `1px solid ${t.border}` }}>
                            <td style={{ padding: '14px 16px' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                <span style={{ fontWeight: 650 }}>{miembro.nombre}</span>
                                {miembro.alertas_medicas && (
                                  <div 
                                    onMouseEnter={() => setHoveredMiembroId(miembro.id)}
                                    onMouseLeave={() => setHoveredMiembroId(null)}
                                    style={{ position: 'relative', display: 'inline-flex', cursor: 'help', alignSelf: 'flex-start' }}
                                  >
                                    <span style={{ 
                                      fontSize: 9, color: '#F59E0B', fontWeight: 700, 
                                      display: 'flex', alignItems: 'center', gap: 2,
                                      backgroundColor: 'rgba(245, 158, 11, 0.08)',
                                      padding: '2px 6px', borderRadius: 6, border: '1px solid rgba(245, 158, 11, 0.2)'
                                    }}>
                                      <AlertTriangle size={9} /> Cuidado Especial
                                    </span>

                                    {hoveredMiembroId === miembro.id && (
                                      <div style={{
                                        position: 'absolute', bottom: '135%', left: '50%', transform: 'translateX(-50%)',
                                        backgroundColor: isDark ? 'rgba(15,15,18,0.98)' : 'rgba(255,255,255,0.98)',
                                        backdropFilter: 'blur(16px)', border: '1px solid rgba(245, 158, 11, 0.3)', padding: 12, borderRadius: 12, width: 240, zIndex: 999,
                                        boxShadow: '0 10px 30px rgba(0,0,0,0.6)', color: t.text, pointerEvents: 'none',
                                        lineHeight: 1.4, fontSize: 11
                                      }}>
                                        <div style={{ fontWeight: 700, color: '#F59E0B', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                                          <HeartPulse size={12} /> Ficha Médica:
                                        </div>
                                        {miembro.notas_medicas || 'Requiere cuidado físico.'}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td style={{ padding: '14px 16px', color: t.textSecondary }}>{miembro.telefono || '—'}</td>
                            <td style={{ padding: '14px 16px', fontWeight: 500 }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <span>{miembro.membresia}</span>
                                {miembro.cupon_aplicado && (
                                  <span style={{ fontSize: 9, color: t.accent, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}>
                                    <Tag size={10} /> Promo: {miembro.cupon_aplicado}
                                  </span>
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
                                  onClick={() => setSelectedMiembro360(miembro)}
                                  title="Ver Expediente 360° y Progreso Físico"
                                  style={{
                                    padding: '5px 10px', borderRadius: 8, border: `1px solid ${t.accent}`,
                                    backgroundColor: t.accentSoft, color: t.accent, cursor: 'pointer',
                                    fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4
                                  }}
                                >
                                  <Activity size={12} /> Expediente
                                </button>

                                <button
                                  onClick={() => handleRenovacionRapida(miembro)}
                                  title="Renovar plan actual"
                                  style={{
                                    padding: '5px 10px', borderRadius: 8, border: `1px solid ${t.border}`,
                                    backgroundColor: 'transparent', color: t.text, cursor: 'pointer',
                                    fontSize: 11, fontWeight: 600
                                  }}
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
                                      fontSize: 11, fontWeight: 650
                                    }}
                                  >
                                    Recordar
                                  </button>
                                )}

                                <button
                                  onClick={() => openDeleteModal(miembro)}
                                  style={{
                                    padding: '5px 10px', borderRadius: 8, border: 'none',
                                    backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', cursor: 'pointer',
                                    fontSize: 11, fontWeight: 600
                                  }}
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
                          No se encontraron miembros.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 4. CONTABILIDAD & ARQUEO DE CAJA */}
          {activeSubTab === 'contabilidad' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {/* Tarjetas de Resumen Financiero */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                <div style={{ padding: 20, borderRadius: 16, backgroundColor: t.panel, border: `1px solid ${t.border}`, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: t.textMuted, textTransform: 'uppercase' }}>Ingresos de Hoy</span>
                    <DollarSign size={18} style={{ color: '#10B981' }} />
                  </div>
                  <span style={{ fontSize: 28, fontWeight: 800, color: '#10B981' }}>{ingresosHoy.toFixed(2)} Bs.</span>
                </div>

                <div style={{ padding: 20, borderRadius: 16, backgroundColor: t.panel, border: `1px solid ${t.border}`, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: t.textMuted, textTransform: 'uppercase' }}>Total Acumulado del Mes</span>
                    <Wallet size={18} style={{ color: t.accent }} />
                  </div>
                  <span style={{ fontSize: 28, fontWeight: 800, color: t.accent }}>{ingresosMes.toFixed(2)} Bs.</span>
                </div>

                <div style={{ padding: 20, borderRadius: 16, backgroundColor: t.panel, border: `1px solid ${t.border}`, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: t.textMuted, textTransform: 'uppercase' }}>Total Descuentos Aplicados</span>
                    <Percent size={18} style={{ color: '#F59E0B' }} />
                  </div>
                  <span style={{ fontSize: 28, fontWeight: 800, color: '#F59E0B' }}>{totalDescuentos.toFixed(2)} Bs.</span>
                </div>
              </div>

              {/* Historial de Transacciones de Cobro */}
              <div style={{
                padding: 20, borderRadius: 20, backgroundColor: t.panel, border: `1px solid ${t.border}`,
                display: 'flex', flexDirection: 'column', gap: 16
              }}>
                <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, fontFamily: "'Space Grotesk', sans-serif", display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Receipt size={18} style={{ color: t.accent }} /> Libro Diario de Transacciones (Cobros en Bs.)
                </h3>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: `1px solid ${t.border}`, color: t.textMuted }}>
                        <th style={{ padding: '12px 14px' }}>Fecha</th>
                        <th style={{ padding: '12px 14px' }}>Miembro</th>
                        <th style={{ padding: '12px 14px' }}>Método</th>
                        <th style={{ padding: '12px 14px' }}>Monto Subtotal</th>
                        <th style={{ padding: '12px 14px' }}>Descuento</th>
                        <th style={{ padding: '12px 14px' }}>Total Cobrado</th>
                        <th style={{ padding: '12px 14px' }}>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagos.length > 0 ? (
                        pagos.map(pago => {
                          const miembroAsociado = miembros.find(m => m.id === pago.miembro_id);
                          const total = parseFloat(pago.monto) - parseFloat(pago.descuento || 0);
                          return (
                            <tr key={pago.id} style={{ borderBottom: `1px solid ${t.border}` }}>
                              <td style={{ padding: '12px 14px', color: t.textSecondary }}>{pago.fecha_pago}</td>
                              <td style={{ padding: '12px 14px', fontWeight: 650 }}>{miembroAsociado?.nombre || 'Miembro'}</td>
                              <td style={{ padding: '12px 14px', color: t.textMuted }}>{pago.metodo_pago}</td>
                              <td style={{ padding: '12px 14px' }}>{parseFloat(pago.monto).toFixed(2)} Bs.</td>
                              <td style={{ padding: '12px 14px', color: '#F59E0B' }}>-{parseFloat(pago.descuento || 0).toFixed(2)} Bs.</td>
                              <td style={{ padding: '12px 14px', fontWeight: 800, color: '#10B981' }}>{total.toFixed(2)} Bs.</td>
                              <td style={{ padding: '12px 14px' }}>
                                <span style={{ fontSize: 10, fontWeight: 700, color: '#10B981', backgroundColor: 'rgba(16,185,129,0.1)', padding: '2px 8px', borderRadius: 8 }}>
                                  {pago.estado}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan="7" style={{ padding: '30px 14px', textAlign: 'center', color: t.textMuted }}>No se han registrado pagos aún.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 5. PLANES Y MEMBRESÍAS (Diseño Elaborado con Casillas Grandes y Precios Sellados en Botones) */}
          {activeSubTab === 'planes' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0, fontFamily: "'Space Grotesk', sans-serif", display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CreditCard size={20} style={{ color: t.accent }} /> Tarifario Oficial de Planes & Disciplinas (Bs.)
                </h3>

                <div style={{ display: 'flex', gap: 6 }}>
                  {['Todos', 'General', 'Disciplinas'].map(cat => (
                    <button
                      key={cat}
                      onClick={() => setPlanCategoryFilter(cat)}
                      style={{
                        padding: '6px 14px', borderRadius: 10,
                        border: planCategoryFilter === cat ? `1px solid ${t.accent}` : `1px solid ${t.border}`,
                        backgroundColor: planCategoryFilter === cat ? t.accentSoft : 'transparent',
                        color: planCategoryFilter === cat ? t.accent : t.textMuted,
                        fontSize: 12, fontWeight: 600, cursor: 'pointer'
                      }}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Grid de Casillas Grandes para Planes */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
                {filteredPlanes.map((plan, idx) => {
                  const isDisciplina = plan.nombre.toLowerCase().includes('disciplina');
                  return (
                    <div key={plan.id} style={{
                      padding: 24, borderRadius: 20, backgroundColor: t.panel,
                      border: `1.5px solid ${isDisciplina ? 'rgba(139, 92, 246, 0.3)' : t.border}`,
                      boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
                      display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 20,
                      position: 'relative', overflow: 'hidden'
                    }}>
                      {/* Top Ribbon badge */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <span style={{ fontSize: 10, fontWeight: 800, color: isDisciplina ? '#8B5CF6' : t.accent, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: 4 }}>
                            {isDisciplina ? <Sparkles size={12} /> : <Award size={12} />} {isDisciplina ? 'Clase Individual' : 'Plan Membresía'}
                          </span>
                          <h4 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>{plan.nombre}</h4>
                        </div>

                        {/* Botón Sellado de Precio */}
                        <div style={{
                          padding: '8px 16px', borderRadius: 12,
                          background: isDisciplina 
                            ? 'linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)' 
                            : `linear-gradient(135deg, ${t.accent} 0%, #F59E0B 100%)`,
                          color: '#0A0A0C', fontWeight: 900, fontSize: 18,
                          fontFamily: "'JetBrains Mono', monospace",
                          boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
                          whiteSpace: 'nowrap'
                        }}>
                          {parseFloat(plan.precio).toFixed(0)} Bs.
                        </div>
                      </div>

                      <p style={{ fontSize: 12, color: t.textSecondary, margin: 0, lineHeight: 1.5 }}>
                        {plan.descripcion || 'Acceso garantizado a las instalaciones del gimnasio.'}
                      </p>

                      {/* Lista de Detalles del Plan */}
                      <div style={{ padding: 14, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.02)', border: `1px solid ${t.border}`, display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: t.textSecondary }}>
                          <CheckCircle2 size={14} style={{ color: '#10B981' }} />
                          <span>Acceso ilimitado a equipos y área fitness</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: t.textSecondary }}>
                          <Clock size={14} style={{ color: t.accent }} />
                          <span>Duración exacta: <strong>{plan.duracion_dias} día(s) hábiles</strong></span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: t.textSecondary }}>
                          <Users size={14} style={{ color: '#06B6D4' }} />
                          <span>Válido para 1 persona</span>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setFormData(prev => ({ ...prev, plan_id: plan.id }));
                          setIsModalOpen(true);
                        }}
                        style={{
                          width: '100%', padding: '12px', borderRadius: 12,
                          border: `1px solid ${t.accent}`, backgroundColor: t.accentSoft,
                          color: t.accent, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.backgroundColor = t.accent; e.currentTarget.style.color = '#0A0A0C'; }}
                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = t.accentSoft; e.currentTarget.style.color = t.accent; }}
                      >
                        Inscribir Cliente en este Plan <ChevronRight size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 6. CUPONES & PROMOS (Diseño Colorido Específico por Cupón) */}
          {activeSubTab === 'promociones' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr md:360px', gap: 20, alignItems: 'start' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0, fontFamily: "'Space Grotesk', sans-serif", display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Ticket size={20} style={{ color: t.accent }} /> Cupones Promocionales Activos
                </h3>

                {/* Grid de Cupones con Colores Específicos */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
                  {cupones.length > 0 ? (
                    cupones.map((promo, idx) => {
                      const colorTheme = COUPON_COLOR_PALETTES[idx % COUPON_COLOR_PALETTES.length];
                      const miembrosConCupon = miembros.filter(m => m.cupon_aplicado === promo.codigo).length;

                      return (
                        <div key={promo.id} style={{
                          padding: 20, borderRadius: 20,
                          background: colorTheme.gradient,
                          border: `1.5px solid ${colorTheme.border}`,
                          boxShadow: `0 8px 25px ${colorTheme.border}15`,
                          display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 16,
                          opacity: promo.activo ? 1 : 0.55, transition: 'all 0.2s'
                        }}>
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                              <span style={{ 
                                fontSize: 13, fontWeight: 800, color: colorTheme.text,
                                fontFamily: "'JetBrains Mono', monospace", border: `1px solid ${colorTheme.border}`,
                                padding: '4px 10px', borderRadius: 8, backgroundColor: colorTheme.badgeBg,
                                display: 'flex', alignItems: 'center', gap: 6
                              }}>
                                <Tag size={12} /> {promo.codigo}
                              </span>
                              
                              <span style={{ 
                                fontSize: 10, fontWeight: 700, color: promo.activo ? '#10B981' : t.textMuted,
                                display: 'flex', alignItems: 'center', gap: 4,
                                backgroundColor: promo.activo ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
                                padding: '2px 8px', borderRadius: 12
                              }}>
                                {promo.activo ? <CheckCircle size={12} /> : <XCircle size={12} />}
                                {promo.activo ? 'Activo' : 'Inactivo'}
                              </span>
                            </div>

                            {/* Badge de Descuento */}
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, margin: '8px 0' }}>
                              <span style={{ fontSize: 26, fontWeight: 900, color: colorTheme.text }}>
                                {promo.tipo_descuento === 'Porcentaje' ? `${promo.valor}%` : `${promo.valor} Bs.`}
                              </span>
                              <span style={{ fontSize: 11, fontWeight: 700, color: t.textMuted }}>DESCUENTO</span>
                            </div>

                            <p style={{ fontSize: 11, color: t.textSecondary, margin: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                              <Users size={12} /> Usado por {miembrosConCupon} miembro(s) registrado(s)
                            </p>
                          </div>

                          <div style={{ borderTop: `1px solid ${colorTheme.border}40`, paddingTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
                            <button
                              onClick={() => toggleCouponStatus(promo.id, promo.activo)}
                              style={{
                                background: 'none', border: `1px solid ${colorTheme.border}`,
                                color: colorTheme.text, fontSize: 11, padding: '4px 10px', borderRadius: 6,
                                cursor: 'pointer', fontWeight: 700
                              }}
                            >
                              {promo.activo ? 'Desactivar Cupón' : 'Activar Cupón'}
                            </button>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p style={{ fontSize: 12, color: t.textMuted, textAlign: 'center', padding: '40px 0' }}>No hay cupones guardados.</p>
                  )}
                </div>
              </div>

              {/* Formulario Cupón */}
              <form onSubmit={handleCreateCoupon} style={{
                padding: 20, borderRadius: 20, backgroundColor: t.panel, border: `1px solid ${t.border}`,
                display: 'flex', flexDirection: 'column', gap: 14, boxShadow: '0 8px 30px rgba(0,0,0,0.15)'
              }}>
                <h3 style={{ fontSize: 14, fontWeight: 800, margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: "'Space Grotesk', sans-serif", display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Plus size={16} style={{ color: t.accent }} /> Crear Nuevo Cupón
                </h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontSize: 10, color: t.textMuted, fontWeight: 600, textTransform: 'uppercase' }}>Código del Cupón</label>
                  <input
                    type="text"
                    value={newCoupon.codigo}
                    onChange={e => setNewCoupon({ ...newCoupon, codigo: e.target.value })}
                    placeholder="Ej. VERANO30"
                    required
                    style={{ padding: 10, borderRadius: 8, border: `1px solid ${t.border}`, backgroundColor: 'rgba(255,255,255,0.01)', color: t.text, outline: 'none', fontWeight: 700 }}
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
                    fontSize: 12, fontWeight: 700, marginTop: 6
                  }}
                >
                  {couponLoading ? 'Creando...' : 'Guardar Cupón'}
                </button>
              </form>
            </div>
          )}

          {/* 7. PAPELERA */}
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
                      <th style={{ padding: '14px 16px', color: t.textMuted, fontWeight: 600 }}>Borrado El</th>
                      <th style={{ padding: '14px 16px', color: t.textMuted, fontWeight: 600 }}>Expiración Papelera</th>
                      <th style={{ padding: '14px 16px', color: t.textMuted, fontWeight: 600, textAlign: 'right' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {papeleraMiembros.length > 0 ? (
                      papeleraMiembros.map((item) => (
                        <tr key={item.id} style={{ borderBottom: `1px solid ${t.border}` }}>
                          <td style={{ padding: '14px 16px', fontWeight: 650 }}>{item.nombre_item}</td>
                          <td style={{ padding: '14px 16px', color: t.textSecondary }}>{new Date(item.borrado_el).toLocaleDateString()}</td>
                          <td style={{ padding: '14px 16px', color: '#EF4444', fontWeight: 600 }}>{new Date(item.expira_el).toLocaleDateString()}</td>
                          <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                              <button
                                onClick={() => handleRestoreMiembro(item)}
                                style={{ padding: '5px 10px', borderRadius: 8, border: `1px solid ${t.border}`, background: 'transparent', color: t.text, cursor: 'pointer', fontSize: 11, fontWeight: 600 }}
                              >
                                <RotateCcw size={12} /> Restaurar
                              </button>
                              <button
                                onClick={() => handlePurgeMiembro(item.id)}
                                style={{ padding: '5px 10px', borderRadius: 8, border: 'none', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', cursor: 'pointer', fontSize: 11, fontWeight: 600 }}
                              >
                                Purgar
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" style={{ padding: '40px 16px', textAlign: 'center', color: t.textMuted }}>La papelera está vacía.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* DRAWER / MODAL EXPEDIENTE 360° & PROGRESO FÍSICO */}
      {selectedMiembro360 && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', justifyContent: 'flex-end',
          backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)'
        }}>
          <div style={{
            width: '100%', maxWidth: 540, backgroundColor: t.panel, height: '100%',
            borderLeft: `1px solid ${t.border}`, padding: 24, overflowY: 'auto',
            display: 'flex', flexDirection: 'column', gap: 20, animation: 'slideInRight 0.25s ease-out'
          }} className="mac-scrollbar">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: 10, color: t.accent, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Expediente 360° del Miembro</span>
                <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>{selectedMiembro360.nombre}</h2>
              </div>
              <button onClick={() => setSelectedMiembro360(null)} style={{ background: 'none', border: 'none', color: t.textMuted, cursor: 'pointer' }}>
                <XCircle size={22} />
              </button>
            </div>

            {/* Ficha General */}
            <div style={{ padding: 14, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.02)', border: `1px solid ${t.border}`, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: t.textSecondary }}>Información General</span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 12 }}>
                <div><span style={{ color: t.textMuted }}>Teléfono:</span> {selectedMiembro360.telefono || '—'}</div>
                <div><span style={{ color: t.textMuted }}>Email:</span> {selectedMiembro360.email || '—'}</div>
                <div><span style={{ color: t.textMuted }}>Plan Actual:</span> {selectedMiembro360.membresia}</div>
                <div><span style={{ color: t.textMuted }}>Vencimiento:</span> {selectedMiembro360.vencimiento}</div>
              </div>
              {selectedMiembro360.notas_medicas && (
                <div style={{ marginTop: 6, padding: 10, borderRadius: 8, backgroundColor: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.2)', fontSize: 11, color: '#F59E0B' }}>
                  <strong>Notas Médicas:</strong> {selectedMiembro360.notas_medicas}
                </div>
              )}
            </div>

            {/* Formulario de Evaluación Corporal / Progreso */}
            <form onSubmit={handleAddProgresoFisico} style={{ padding: 16, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.02)', border: `1px solid ${t.border}`, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: t.accent, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Scale size={14} /> Registrar Nueva Evaluación Física
              </span>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <input
                  type="number" step="0.1" placeholder="Peso (kg)"
                  value={newProgreso.peso_kg} onChange={e => setNewProgreso({ ...newProgreso, peso_kg: e.target.value })}
                  style={{ padding: 8, borderRadius: 8, border: `1px solid ${t.border}`, backgroundColor: 'transparent', color: t.text, fontSize: 12, outline: 'none' }}
                />
                <input
                  type="number" step="0.1" placeholder="% Grasa Corporal"
                  value={newProgreso.porcentaje_grasa} onChange={e => setNewProgreso({ ...newProgreso, porcentaje_grasa: e.target.value })}
                  style={{ padding: 8, borderRadius: 8, border: `1px solid ${t.border}`, backgroundColor: 'transparent', color: t.text, fontSize: 12, outline: 'none' }}
                />
                <input
                  type="number" step="0.1" placeholder="Cintura (cm)"
                  value={newProgreso.medida_cintura_cm} onChange={e => setNewProgreso({ ...newProgreso, medida_cintura_cm: e.target.value })}
                  style={{ padding: 8, borderRadius: 8, border: `1px solid ${t.border}`, backgroundColor: 'transparent', color: t.text, fontSize: 12, outline: 'none' }}
                />
                <input
                  type="number" step="0.1" placeholder="Pecho (cm)"
                  value={newProgreso.medida_pecho_cm} onChange={e => setNewProgreso({ ...newProgreso, medida_pecho_cm: e.target.value })}
                  style={{ padding: 8, borderRadius: 8, border: `1px solid ${t.border}`, backgroundColor: 'transparent', color: t.text, fontSize: 12, outline: 'none' }}
                />
              </div>

              <button
                type="submit"
                style={{ padding: '8px 12px', borderRadius: 8, border: 'none', backgroundColor: t.accent, color: '#0A0A0C', cursor: 'pointer', fontSize: 12, fontWeight: 700, marginTop: 4 }}
              >
                Guardar Medición
              </button>
            </form>

            {/* Historial de Mediciones Físicas */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: t.textSecondary }}>Historial de Medidas Físicas</span>
              {progresosFisicos.length > 0 ? (
                progresosFisicos.map(item => (
                  <div key={item.id} style={{ padding: 12, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.02)', border: `1px solid ${t.border}`, fontSize: 12, display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                      <span style={{ fontWeight: 700, color: t.accent }}>{item.fecha}:</span> Peso: {item.peso_kg} kg | % Grasa: {item.porcentaje_grasa}%
                    </div>
                    <div style={{ color: t.textMuted }}>
                      Cintura: {item.medida_cintura_cm} cm
                    </div>
                  </div>
                ))
              ) : (
                <p style={{ fontSize: 11, color: t.textMuted }}>Aún no hay evaluaciones corporales registradas.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: REGISTRAR MIEMBRO */}
      {isModalOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center',
          justifyContent: 'center', padding: 16, backgroundColor: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(8px)'
        }}>
          <form onSubmit={handleSaveMiembro} style={{
            maxWidth: 500, width: '100%', backgroundColor: t.panel, border: `1px solid ${t.border}`,
            borderRadius: 20, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            display: 'flex', flexDirection: 'column', gap: 20, padding: 24
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: 16, fontWeight: 800, margin: 0, fontFamily: "'Space Grotesk', sans-serif" }}>Registrar Miembro y Pago</h2>
              <button type="button" onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: t.textMuted, cursor: 'pointer' }}>
                <XCircle size={20} />
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 10, color: t.textMuted, fontWeight: 600, textTransform: 'uppercase' }}>Nombre Completo</label>
                <input 
                  type="text" name="nombre" value={formData.nombre} onChange={handleInputChange}
                  placeholder="Ej. Carlos Pérez" required
                  style={{ padding: 10, borderRadius: 8, border: `1px solid ${t.border}`, backgroundColor: 'rgba(255,255,255,0.01)', color: t.text, outline: 'none' }} 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontSize: 10, color: t.textMuted, fontWeight: 600, textTransform: 'uppercase' }}>Número de Teléfono</label>
                  <input 
                    type="text" name="telefono" value={formData.telefono} onChange={handleInputChange}
                    placeholder="Ej. 70838665" 
                    style={{ padding: 10, borderRadius: 8, border: `1px solid ${t.border}`, backgroundColor: 'rgba(255,255,255,0.01)', color: t.text, outline: 'none' }} 
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontSize: 10, color: t.textMuted, fontWeight: 600, textTransform: 'uppercase' }}>Correo Electrónico</label>
                  <input 
                    type="email" name="email" value={formData.email} onChange={handleInputChange}
                    placeholder="carlos@correo.com" 
                    style={{ padding: 10, borderRadius: 8, border: `1px solid ${t.border}`, backgroundColor: 'rgba(255,255,255,0.01)', color: t.text, outline: 'none' }} 
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontSize: 10, color: t.textMuted, fontWeight: 600, textTransform: 'uppercase' }}>Plan de Membresía</label>
                  <select 
                    name="plan_id" value={formData.plan_id} onChange={handleInputChange}
                    style={{ padding: 10, borderRadius: 8, border: `1px solid ${t.border}`, backgroundColor: t.panel, color: t.text, outline: 'none' }}
                  >
                    {planes.map(p => <option key={p.id} value={p.id}>{p.nombre} ({p.precio} Bs.)</option>)}
                  </select>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontSize: 10, color: t.textMuted, fontWeight: 600, textTransform: 'uppercase' }}>Grupo Familiar (Opcional)</label>
                  <input 
                    type="text" name="grupo_familiar" value={formData.grupo_familiar} onChange={handleInputChange}
                    placeholder="Ej. Familia Pérez" 
                    style={{ padding: 10, borderRadius: 8, border: `1px solid ${t.border}`, backgroundColor: 'rgba(255,255,255,0.01)', color: t.text, outline: 'none' }} 
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontSize: 10, color: t.textMuted, fontWeight: 600, textTransform: 'uppercase' }}>Fecha de Inicio</label>
                  <input 
                    type="date" name="fecha_inicio" value={formData.fecha_inicio} onChange={handleInputChange}
                    style={{ padding: 10, borderRadius: 8, border: `1px solid ${t.border}`, backgroundColor: 'rgba(255,255,255,0.01)', color: t.text, outline: 'none' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontSize: 10, color: t.textMuted, fontWeight: 600, textTransform: 'uppercase' }}>Método de Pago</label>
                  <select 
                    name="metodo_pago" value={formData.metodo_pago} onChange={handleInputChange}
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
                    name="cupon_id" value={formData.cupon_id} onChange={handleInputChange}
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
                  <label style={{ fontSize: 10, color: t.textMuted, fontWeight: 600, textTransform: 'uppercase' }}>Descuento Manual (Bs.)</label>
                  <input 
                    type="number" name="descuento_manual" value={formData.descuento_manual} onChange={handleInputChange}
                    placeholder="0.00" min="0" step="0.01"
                    style={{ padding: 10, borderRadius: 8, border: `1px solid ${t.border}`, backgroundColor: 'rgba(255,255,255,0.01)', color: t.text, outline: 'none' }} 
                  />
                </div>
              </div>

              <div style={{
                padding: 12, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.02)',
                border: `1px solid ${t.border}`, display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 600
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
                <label style={{ fontSize: 10, color: t.textMuted, fontWeight: 600, textTransform: 'uppercase' }}>Notas Médicas / Discapacidad</label>
                <textarea 
                  name="notas_medicas" value={formData.notas_medicas} onChange={handleInputChange}
                  placeholder="Diagnóstico de asma, problemas cardíacos, lesiones..." rows="3"
                  style={{ padding: 10, borderRadius: 8, border: `1px solid ${t.border}`, backgroundColor: 'rgba(255,255,255,0.01)', color: t.text, outline: 'none', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                <input 
                  type="checkbox" name="alertas_medicas" id="alertas_medicas"
                  checked={formData.alertas_medicas} onChange={handleInputChange}
                  style={{ cursor: 'pointer' }}
                />
                <label htmlFor="alertas_medicas" style={{ fontSize: 12, color: '#F59E0B', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <AlertCircle size={14} /> Activar alerta visual de cuidado físico en el sistema
                </label>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, borderTop: `1px solid ${t.border}`, paddingTop: 16 }}>
              <button 
                type="button" onClick={() => setIsModalOpen(false)}
                style={{ padding: '8px 16px', borderRadius: 8, border: `1px solid ${t.border}`, background: 'transparent', color: t.textMuted, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
              >
                Cancelar
              </button>
              
              <button 
                type="submit" disabled={loading}
                style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: t.accent, color: '#0A0A0C', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
              >
                {loading ? 'Guardando...' : 'Registrar y Pagar'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL ELIMINACIÓN */}
      {deleteModalOpen && selectedMiembroForDelete && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1001, display: 'flex', alignItems: 'center',
          justifyContent: 'center', padding: 16, backgroundColor: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(8px)'
        }}>
          <div style={{
            maxWidth: 420, width: '100%', backgroundColor: t.panel, border: `1px solid ${t.border}`,
            borderRadius: 20, padding: 24, display: 'flex', flexDirection: 'column', gap: 16
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#EF4444' }}>
              <ShieldAlert size={22} />
              <h3 style={{ fontSize: 15, fontWeight: 800, margin: 0, textTransform: 'uppercase', fontFamily: "'Space Grotesk', sans-serif" }}>Confirmar Envío a Papelera</h3>
            </div>
            
            <p style={{ fontSize: 12, color: t.textSecondary, margin: 0, lineHeight: 1.5 }}>
              ¿Estás seguro de enviar a <strong>{selectedMiembroForDelete.nombre}</strong> a la papelera?
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, margin: '8px 0' }}>
              <label style={{ fontSize: 10, color: t.textMuted, fontWeight: 650, textTransform: 'uppercase' }}>
                Días de retención en papelera:
              </label>
              <input
                type="number" value={diasRetencionDelete}
                onChange={e => setDiasRetencionDelete(Math.max(1, parseInt(e.target.value, 10) || 60))}
                min="1" placeholder="60"
                style={{ padding: 10, borderRadius: 8, border: `1px solid ${t.border}`, backgroundColor: 'rgba(255,255,255,0.01)', color: t.text, outline: 'none', fontSize: 13, fontWeight: 600 }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, borderTop: `1px solid ${t.border}`, paddingTop: 14 }}>
              <button
                type="button" onClick={() => { setDeleteModalOpen(false); setSelectedMiembroForDelete(null); }}
                style={{ padding: '8px 16px', borderRadius: 8, border: `1px solid ${t.border}`, background: 'transparent', color: t.textMuted, cursor: 'pointer', fontSize: 11, fontWeight: 600 }}
              >
                Cancelar
              </button>
              <button
                type="button" onClick={handleConfirmDelete} disabled={loading}
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
