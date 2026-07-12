// Inefable - GymOS Prototype (Sistema Gimnasio)
// Created: 2026-07-12
// Updated: Integración real con Supabase
import React, { useState, useEffect } from 'react';
import { 
  Dumbbell, Users, CreditCard, Tag, AlertTriangle, Plus, Search, 
  Calendar, Phone, ExternalLink, ArrowRight, UserPlus, CheckCircle, 
  XCircle, Filter, Sparkles, TrendingUp, AlertCircle, HeartPulse,
  DollarSign, RefreshCw
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useTheme } from '../lib/theme';

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
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);

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
    descuento_aplicado: 0
  });

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  // Cargar datos al inicializar
  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Obtener Planes
      const { data: planesData, error: planesError } = await supabase
        .from('gym_planes')
        .select('*')
        .order('precio', { ascending: true });
      
      if (planesError) throw planesError;
      setPlanes(planesData || []);

      // 2. Obtener Miembros con Join a Planes
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

      // 3. Obtener Pagos para calcular estados
      const { data: pagosData, error: pagosError } = await supabase
        .from('gym_pagos')
        .select('*')
        .order('fecha_vencimiento', { ascending: false });

      if (pagosError) throw pagosError;
      setPagos(pagosData || []);

      // Mapear miembros y determinar dinámicamente su estado de pago basado en su último pago
      const hoy = new Date().toISOString().split('T')[0];
      const miembrosConEstado = (miembrosData || []).map(miembro => {
        // Encontrar el pago más reciente para este miembro
        const pagosMiembro = (pagosData || []).filter(p => p.miembro_id === miembro.id && p.estado === 'Pagado');
        
        let estadoPago = 'Vencido'; // Por defecto si no tiene pagos
        let vencimiento = 'Sin registro';

        if (pagosMiembro.length > 0) {
          const ultimoPago = pagosMiembro[0]; // Ordenados por fecha_vencimiento desc
          vencimiento = ultimoPago.fecha_vencimiento;
          
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
          vencimiento,
          estadoPago
        };
      });

      setMiembros(miembrosConEstado);

      // Si no hay un plan seleccionado en el formulario, seleccionar el primero por defecto
      if (planesData && planesData.length > 0 && !formData.plan_id) {
        setFormData(prev => ({ ...prev, plan_id: planesData[0].id }));
      }

    } catch (error) {
      console.error("Error al cargar datos de GymOS:", error);
      triggerToast("Error de conexión al cargar datos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Calcular fecha de vencimiento basada en la duración del plan (meses)
  const calcularVencimiento = (meses) => {
    const d = new Date();
    d.setMonth(d.getMonth() + parseInt(meses, 10));
    return d.toISOString().split('T')[0];
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Guardar Miembro e Inicializar su primer pago
  const handleSaveMiembro = async (e) => {
    e.preventDefault();
    if (!formData.nombre.trim()) {
      triggerToast("El nombre es requerido.");
      return;
    }

    try {
      setLoading(true);

      // 1. Insertar el miembro en gym_miembros
      const { data: nuevoMiembro, error: miembroError } = await supabase
        .from('gym_miembros')
        .insert([{
          nombre: formData.nombre,
          telefono: formData.telefono,
          email: formData.email || null,
          plan_id: formData.plan_id || null,
          grupo_familiar: formData.grupo_familiar || null,
          notas_medicas: formData.notas_medicas,
          alertas_medicas: formData.alertas_medicas
        }])
        .select();

      if (miembroError) throw miembroError;

      const miembroCreado = nuevoMiembro[0];

      // 2. Si se asignó un plan, registrar automáticamente el pago e inicializar la membresía activa
      if (formData.plan_id && miembroCreado) {
        const planSeleccionado = planes.find(p => p.id === formData.plan_id);
        if (planSeleccionado) {
          const vencimientoCalculado = calcularVencimiento(planSeleccionado.duracion_meses);
          const descVal = parseFloat(formData.descuento_aplicado) || 0;

          const { error: pagoError } = await supabase
            .from('gym_pagos')
            .insert([{
              miembro_id: miembroCreado.id,
              monto: planSeleccionado.precio,
              descuento: descVal,
              fecha_vencimiento: vencimientoCalculado,
              estado: 'Pagado',
              metodo_pago: formData.metodo_pago
            }]);

          if (pagoError) throw pagoError;
        }
      }

      triggerToast("Miembro registrado con éxito.");
      setIsModalOpen(false);
      
      // Limpiar Formulario
      setFormData({
        nombre: '',
        telefono: '',
        email: '',
        plan_id: planes[0]?.id || '',
        grupo_familiar: '',
        notas_medicas: '',
        alertas_medicas: false,
        metodo_pago: 'Efectivo',
        descuento_aplicado: 0
      });

      // Recargar datos
      await fetchData();

    } catch (error) {
      console.error("Error al registrar miembro:", error);
      triggerToast("Error al guardar miembro.");
    } finally {
      setLoading(false);
    }
  };

  // Registrar un pago rápido de renovación para un miembro existente
  const handleRenovacionRapida = async (miembro) => {
    try {
      setLoading(true);
      const planSeleccionado = planes.find(p => p.id === miembro.plan_id);
      if (!planSeleccionado) {
        triggerToast("Este miembro no tiene un plan válido asignado.");
        return;
      }

      // Si ya tiene un vencimiento y está al día, sumamos al vencimiento actual. Si ya venció, sumamos a partir de hoy.
      let fechaBase = new Date();
      if (miembro.vencimiento && miembro.vencimiento !== 'Sin registro') {
        const tempVence = new Date(miembro.vencimiento);
        if (tempVence > fechaBase) {
          fechaBase = tempVence;
        }
      }
      
      fechaBase.setMonth(fechaBase.getMonth() + planSeleccionado.duracion_meses);
      const nuevoVencimiento = fechaBase.toISOString().split('T')[0];

      // Insertar el pago en gym_pagos
      const { error: pagoError } = await supabase
        .from('gym_pagos')
        .insert([{
          miembro_id: miembro.id,
          monto: planSeleccionado.precio,
          descuento: 0,
          fecha_vencimiento: nuevoVencimiento,
          estado: 'Pagado',
          metodo_pago: 'Efectivo'
        }]);

      if (pagoError) throw pagoError;

      triggerToast(`Membresía de ${miembro.nombre} renovada.`);
      await fetchData();

    } catch (error) {
      console.error("Error al renovar membresía:", error);
      triggerToast("Error al procesar la renovación.");
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
      triggerToast("Este miembro no tiene número de teléfono registrado.");
      return;
    }
    const mensaje = `Hola ${miembro.nombre}, te saludamos de GymOS. Te recordamos que tu membresía (${miembro.membresia}) venció o está próxima a vencer el ${miembro.vencimiento}. Te invitamos a realizar tu pago a la brevedad para seguir disfrutando de tus entrenamientos sin interrupciones. ¡Que tengas un excelente día!`;
    const encodedText = encodeURIComponent(mensaje);
    const cleanPhone = miembro.telefono.replace(/\s+/g, '');
    window.open(`https://wa.me/${cleanPhone}?text=${encodedText}`, '_blank');
  };

  // Promociones constantes del sistema (pueden expandirse)
  const promociones = [
    { id: '1', codigo: 'FAMILIA10', desc: '10% de descuento automático en membresías para grupos familiares vinculados.', activo: true },
    { id: '2', codigo: 'APERTURA20', desc: '20% de descuento en el primer mes para nuevos miembros.', activo: true },
  ];

  const totalMiembros = miembros.length;
  const miembrosActivos = miembros.filter(m => m.estadoPago === 'Al día' || m.estadoPago === 'Por vencer').length;
  const miembrosMorosos = miembros.filter(m => m.estadoPago === 'Vencido').length;
  const miembrosPorVencer = miembros.filter(m => m.estadoPago === 'Por vencer').length;

  const filteredMiembros = miembros.filter(m => {
    const matchesSearch = m.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          m.membresia.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (m.grupoFamiliar && m.grupoFamiliar.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesHealth = filterHealthAlerts ? m.alertasMedicas : true;
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
            <div style={{ width: 28, height: 28, borderRadius: '50%', backgroundColor: t.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000' }}>
              <CheckCircle size={16} />
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
              GymOS <span style={{ fontSize: 11, fontWeight: 650, color: t.accent, verticalAlign: 'middle', border: `1px solid ${t.accent}40`, padding: '2px 8px', borderRadius: 20, marginLeft: 8 }}>V1.0</span>
            </h1>
          </div>
          <p style={{ fontSize: 13, color: t.textMuted, margin: '6px 0 0 0' }}>
            Panel de control para miembros del gimnasio, alertas de salud y cobranza integrada.
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

      {/* Tabs de Navegación Interna */}
      <div style={{
        display: 'flex', gap: 6, borderBottom: `1px solid ${t.border}`, paddingBottom: 1,
        overflowX: 'auto', WebkitOverflowScrolling: 'touch'
      }}>
        {[
          { id: 'resumen', label: 'Dashboard', icon: TrendingUp },
          { id: 'miembros', label: 'Base de Datos Miembros', icon: Users },
          { id: 'planes', label: 'Planes y Membresías', icon: CreditCard },
          { id: 'promociones', label: 'Descuentos y Promos', icon: Tag }
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
            </button>
          );
        })}
      </div>

      {/* Cargando */}
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
                    <span style={{ fontSize: 11, color: t.accent, fontWeight: 600 }}>Total</span>
                  </div>
                </div>

                <div style={{
                  padding: 20, borderRadius: 16, backgroundColor: t.panel, border: `1px solid ${t.border}`,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column', gap: 8
                }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: t.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Membresías Activas</span>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                    <span style={{ fontSize: 28, fontWeight: 800, color: '#10B981' }}>{miembrosActivos}</span>
                    <span style={{ fontSize: 11, color: t.textMuted }}>{totalMiembros > 0 ? ((miembrosActivos/totalMiembros)*100).toFixed(0) : 0}% del total</span>
                  </div>
                </div>

                <div style={{
                  padding: 20, borderRadius: 16, backgroundColor: t.panel, border: `1px solid ${t.border}`,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column', gap: 8
                }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: t.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pagos por Vencer</span>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                    <span style={{ fontSize: 28, fontWeight: 800, color: '#F59E0B' }}>{miembrosPorVencer}</span>
                    <span style={{ fontSize: 11, color: '#F59E0B', fontWeight: 500 }}>Vence en &le; 5 días</span>
                  </div>
                </div>

                <div style={{
                  padding: 20, borderRadius: 16, backgroundColor: t.panel, border: `1px solid ${t.border}`,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column', gap: 8
                }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: t.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Vencidos / Morosos</span>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                    <span style={{ fontSize: 28, fontWeight: 800, color: '#EF4444' }}>{miembrosMorosos}</span>
                    <span style={{ fontSize: 11, color: '#EF4444', fontWeight: 600 }}>Alerta de cobro</span>
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
                              <span style={{ fontSize: 11, color: t.textMuted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Plan: {miembro.membresia} • Expira: {miembro.vencimiento}</span>
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
                                onMouseEnter={e => e.currentTarget.style.opacity = 0.8}
                                onMouseLeave={e => e.currentTarget.style.opacity = 1}
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
                    <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, fontFamily: "'Space Grotesk', sans-serif" }}>Fichas Médicas de Atención Especial</h3>
                    <HeartPulse size={18} style={{ color: t.accent }} />
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {miembros.filter(m => m.alertasMedicas).length > 0 ? (
                      miembros.filter(m => m.alertasMedicas).slice(0, 4).map(miembro => (
                        <div key={miembro.id} style={{
                          padding: 12, borderRadius: 12, backgroundColor: 'rgba(245, 158, 11, 0.03)',
                          border: '1px solid rgba(245, 158, 11, 0.15)', display: 'flex', flexDirection: 'column', gap: 6
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: t.accent }}>{miembro.nombre}</span>
                            <span style={{ fontSize: 9, color: '#F59E0B', textTransform: 'uppercase', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 3 }}>
                              <AlertCircle size={10} /> Alerta Salud
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
                      <th style={{ padding: '14px 16px', color: t.textMuted, fontWeight: 600 }}>Vencimiento</th>
                      <th style={{ padding: '14px 16px', color: t.textMuted, fontWeight: 600 }}>Grupo Familiar</th>
                      <th style={{ padding: '14px 16px', color: t.textMuted, fontWeight: 600 }}>Estado Pago</th>
                      <th style={{ padding: '14px 16px', color: t.textMuted, fontWeight: 600, textAlign: 'right' }}>Acción</th>
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
                                    <AlertTriangle size={10} /> Alerta Salud
                                  </span>
                                )}
                              </div>
                            </td>
                            <td style={{ padding: '14px 16px', color: t.textSecondary }}>{miembro.telefono || '—'}</td>
                            <td style={{ padding: '14px 16px', fontWeight: 500 }}>{miembro.membresia}</td>
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
                              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                                <button
                                  onClick={() => handleRenovacionRapida(miembro)}
                                  title="Renovar un mes / registrar cobro"
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
                                      fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center'
                                    }}
                                  >
                                    Recordar
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="7" style={{ padding: '40px 16px', textAlign: 'center', color: t.textMuted }}>
                          No se encontraron miembros registrados en la base de datos de Supabase.
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
                        <span style={{ fontSize: 16, fontWeight: 800, color: t.accent }}>${plan.precio}</span>
                      </div>
                      <p style={{ fontSize: 12, color: t.textSecondary, margin: 0, lineHeight: 1.5 }}>
                        {plan.descripcion || 'Sin descripción'}
                      </p>
                    </div>
                    <div style={{ borderTop: `1px solid ${t.border}`, paddingTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 10, color: t.textMuted }}>Duración: {plan.duracion_meses} mes(es)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. TAB DESCUENTOS Y PROMOS */}
          {activeSubTab === 'promociones' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, fontFamily: "'Space Grotesk', sans-serif" }}>Cupones y Promociones Activas</h3>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
                {promociones.map(promo => (
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
                          {promo.activo ? 'Activa' : 'Inactiva'}
                        </span>
                      </div>
                      <p style={{ fontSize: 12, color: t.textSecondary, margin: 0, lineHeight: 1.5 }}>
                        {promo.desc}
                      </p>
                    </div>
                    <div style={{ borderTop: `1px solid ${t.border}`, paddingTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 10, color: t.textMuted }}>Aplicación Automática</span>
                    </div>
                  </div>
                ))}
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
                    placeholder="Ej. +502 5555 4444" 
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
                    {planes.map(p => <option key={p.id} value={p.id}>{p.nombre} (${p.precio})</option>)}
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
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontSize: 10, color: t.textMuted, fontWeight: 600, textTransform: 'uppercase' }}>Descuento Directo ($)</label>
                  <input 
                    type="number" 
                    name="descuento_aplicado"
                    value={formData.descuento_aplicado}
                    onChange={handleInputChange}
                    placeholder="0.00" 
                    min="0"
                    step="0.01"
                    style={{ padding: 10, borderRadius: 8, border: `1px solid ${t.border}`, backgroundColor: 'rgba(255,255,255,0.01)', color: t.text, outline: 'none' }} 
                  />
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
    </div>
  );
};

export default SistemaGimnasio;
