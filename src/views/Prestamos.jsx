import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Plus, ChevronRight, ArrowLeft, Save, FileSignature, Smartphone, DollarSign,
  ExternalLink, User, CreditCard, ArrowRight, ShieldCheck, CalendarDays, CheckCircle2,
  Check, X, AlertCircle, Trash2, AlertTriangle, Edit3, Search, Eye, EyeOff, Clock,
  MoreHorizontal, Filter, Download, Printer, RefreshCw, TrendingUp, Percent,
  Heart, BarChart3, PieChart, Wallet
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { getTheme } from '../lib/theme';
import FormularioPrestamo from '../components/FormularioPrestamo';
import { useAmortizacion, useAmortizacionGlobal, generarCronograma, calcularResumen, proyectarSiguientes } from '../hooks/useAmortizacion';
import { usePrestamoCategorias } from '../hooks/usePrestamoCategorias';

// ─── ESTILOS TOAST ───────────────────────────────────────────
const toastStyles = {
  success: { bg: 'rgba(78, 201, 176, 0.10)', border: 'rgba(78, 201, 176, 0.30)', icon: CheckCircle2, color: '#4ec9b0' },
  error: { bg: 'rgba(241, 76, 76, 0.10)', border: 'rgba(241, 76, 76, 0.30)', icon: AlertCircle, color: '#f14c4c' },
  warning: { bg: 'rgba(245, 158, 11, 0.10)', border: 'rgba(245, 158, 11, 0.30)', icon: AlertTriangle, color: '#f59e0b' }
};

// ─── TOAST NOTIFICATION ──────────────────────────────────────
const ToastNotification = ({ message, type = 'success', onClose, isDark }) => {
  const t = useMemo(() => getTheme(isDark), [isDark]);
  const { bg, border, icon: Icon, color } = toastStyles[type] || toastStyles.success;
  
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-6 right-6 z-[9999] animate-in slide-in-from-right-4 fade-in duration-300">
      <div style={{ backgroundColor: bg, borderColor: border }} className="border rounded-xl px-5 py-4 shadow-2xl flex items-center gap-4 backdrop-blur-xl min-w-[300px]">
        <div style={{ backgroundColor: `${color}15`, color }} className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0">
          <Icon size={16} />
        </div>
        <p style={{ color: t.text }} className="text-xs font-medium flex-1">{message}</p>
        <button onClick={onClose} style={{ color: t.textDim }} className="hover:text-white transition-colors shrink-0">
          <X size={14} />
        </button>
      </div>
    </div>
  );
};

// ─── MODAL ELIMINACIÓN SEGURA ────────────────────────────────
const DeleteConfirmModal = ({ target, isDark, onConfirm, onCancel }) => {
  const t = useMemo(() => getTheme(isDark), [isDark]);
  const [step, setStep] = useState(1);
  const [typed, setTyped] = useState('');
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (step === 1) { setStep(2); return; }
    if (typed !== 'ELIMINAR') return;
    setLoading(true);
    try {
      await onConfirm(target);
    } finally {
      setLoading(false);
    }
  };

  const isMobile = window.innerWidth < 1024;

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
      <div style={{
        backgroundColor: t.panel, border: `1px solid ${t.border}`,
        borderRadius: '20px', padding: isMobile ? '24px' : '32px',
        maxWidth: '440px', width: '100%', position: 'relative',
        animation: 'scaleIn 0.2s ease-out',
      }}>
        <div style={{
          width: '56px', height: '56px', borderRadius: '50%',
          backgroundColor: `${t.danger || '#ef4444'}15`,
          color: t.danger || '#ef4444',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 16px',
        }}>
          {step === 1 ? <AlertTriangle size={24} /> : <Trash2 size={24} />}
        </div>

        <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: t.text, textAlign: 'center', margin: '0 0 8px' }}>
          {step === 1 ? '¿Eliminar este préstamo?' : 'Confirmación final'}
        </h3>

        <p style={{ fontSize: '12px', color: t.textDim, textAlign: 'center', margin: '0 0 20px', lineHeight: 1.5 }}>
          {step === 1
            ? `Esta acción eliminará el registro de "${target?.nombre || 'Sin nombre'}". Se guardará en la papelera por si necesitas restaurarlo.`
            : 'Escribe "ELIMINAR" para confirmar que deseas eliminar permanentemente este registro.'
          }
        </p>

        {step === 2 && (
          <div style={{
            padding: '12px', borderRadius: '12px',
            backgroundColor: `${t.danger || '#ef4444'}08`,
            border: `1px solid ${t.danger || '#ef4444'}20`,
            marginBottom: '16px',
          }}>
            <p style={{ fontSize: '10px', fontWeight: 600, color: t.textMuted, marginBottom: '8px' }}>
              Registro a eliminar:
            </p>
            <p style={{ fontSize: '13px', fontWeight: 600, color: t.text, margin: 0 }}>
              {target?.nombre || 'Sin nombre'}
            </p>
            <p style={{ fontSize: '11px', color: t.textDim, marginTop: '2px' }}>
              {parseFloat(target?.capital || 0).toLocaleString()} {target?.moneda || 'BOB'} — {target?.estado || 'Activo'}
            </p>
          </div>
        )}

        {step === 2 && (
          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: t.textMuted, display: 'block', marginBottom: '6px' }}>
              Escribe <span style={{ color: t.danger || '#ef4444' }}>ELIMINAR</span> para confirmar
            </label>
            <input
              type="text"
              value={typed}
              onChange={e => setTyped(e.target.value)}
              placeholder="ELIMINAR"
              autoFocus
              style={{
                width: '100%', padding: '12px', fontSize: '14px', fontWeight: 700,
                textAlign: 'center', letterSpacing: '0.15em',
                backgroundColor: t.input, border: `1px solid ${typed === 'ELIMINAR' ? (t.danger || '#ef4444') : t.border}`,
                color: typed === 'ELIMINAR' ? (t.danger || '#ef4444') : t.text,
                borderRadius: '12px', outline: 'none',
              }}
            />
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={onCancel}
            disabled={loading}
            style={{
              flex: 1, padding: '12px', borderRadius: '12px',
              border: `1px solid ${t.border}`, backgroundColor: t.input,
              color: t.text, fontSize: '11px', fontWeight: 600, cursor: 'pointer',
              transition: 'all 0.2s', opacity: loading ? 0.6 : 1,
            }}
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading || (step === 2 && typed !== 'ELIMINAR')}
            style={{
              flex: 1, padding: '12px', borderRadius: '12px',
              border: 'none',
              backgroundColor: step === 2 ? (t.danger || '#dc2626') : (t.danger || '#ef4444'),
              color: 'white', fontSize: '11px', fontWeight: 600, cursor: 'pointer',
              transition: 'all 0.2s', opacity: (loading || (step === 2 && typed !== 'ELIMINAR')) ? 0.6 : 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            }}
          >
            {loading ? 'Eliminando...' : step === 1 ? 'Sí, eliminar' : 'Confirmar y eliminar'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── MODAL PRESTAMO (WIZARD) ─────────────────────────────────
const PrestamoFormModal = ({ isDark, prestamo, onClose, onSave }) => {
  const t = useMemo(() => getTheme(isDark), [isDark]);
  return (
    <div className="fixed inset-0 z-[9997] overflow-y-auto"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
      <div className="min-h-full py-8 px-4 flex items-start justify-center">
        <div style={{
          backgroundColor: t.bg, border: `1px solid ${t.border}`,
          borderRadius: '24px', padding: '32px',
          maxWidth: '820px', width: '100%',
          animation: 'scaleIn 0.2s ease-out',
        }}>
          <FormularioPrestamo
            isDark={isDark}
            onClose={onClose}
            onSave={onSave}
            initialData={prestamo}
          />
        </div>
      </div>
    </div>
  );
};

// ─── COMPONENTE PRINCIPAL ────────────────────────────────────
const Prestamos = ({ data, setData, settings, isDark, preSelectedId, onClearSelection }) => {
  const t = useMemo(() => getTheme(isDark), [isDark]);
  const [prestamoView, setPrestamoView] = useState('list'); 
  const [activePrestamo, setActivePrestamo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editPrestamo, setEditPrestamo] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const isMobile = settings?.isMobileMode;
  const { cuotas: ledgerCuotas, resumen: ledgerResumen } = useAmortizacion(activePrestamo);

  const showToast = (message, type = 'success') => {
    setToast({ message, type, key: Date.now() });
  };

  useEffect(() => {
    if (preSelectedId && data?.prestamos) {
      const prestamo = data.prestamos.find(p => p.id === preSelectedId);
      if (prestamo) { openPrestamo(prestamo); if (onClearSelection) onClearSelection(); }
    }
  }, [preSelectedId, data?.prestamos]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const openPrestamo = (p) => {
    if (!p) return;
    setActivePrestamo({ ...p, pagos: Array.isArray(p.pagos) ? p.pagos : [], moneda: p.moneda || 'BOB', estado: p.estado || 'Activo' });
    setPrestamoView('detail');
  };

  const closePrestamo = async () => {
    try { if (activePrestamo) await handleSave(); }
    finally { setPrestamoView('list'); setActivePrestamo(null); }
  };

  const handleNewPrestamo = () => {
    setEditPrestamo(null);
    setShowForm(true);
  };

  const handleEditPrestamo = (p, e) => {
    if (e) e.stopPropagation();
    setEditPrestamo(p);
    setShowForm(true);
  };

  const handleFormSave = async () => {
    setShowForm(false);
    setEditPrestamo(null);
    if (setData) {
      const { data: refreshed } = await supabase.from('prestamos').select('*');
      if (refreshed) setData(prev => ({ ...prev, prestamos: refreshed }));
    }
    showToast('✅ Préstamo guardado correctamente');
  };

  const handleDeleteRequest = (p, e) => {
    if (e) e.stopPropagation();
    setDeleteTarget(p);
  };

  const handleDeleteConfirm = async (target) => {
    try {
      const trashEntry = {
        tipo: 'prestamo',
        datos_originales: target,
        titulo: target.nombre || 'Préstamo',
        descripcion: `Capital: ${target.capital} ${target.moneda} — Estado: ${target.estado}`,
        eliminado_en: new Date().toISOString(),
        expira_el: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      };
      const { error: trashError } = await supabase.from('papelera').insert([trashEntry]);
      if (trashError) throw trashError;

      const { error: auditError } = await supabase.from('prestamos_historial').insert([{
        prestamo_id: target.id,
        accion: 'ELIMINADO',
        detalle: `Préstamo eliminado: ${target.nombre} - ${target.capital} ${target.moneda}`,
        datos_previos: target,
      }]);
      if (auditError) throw auditError;

      const { error: deleteError } = await supabase.from('prestamos').delete().eq('id', target.id);
      if (deleteError) throw deleteError;

      const updated = (data?.prestamos || []).filter(p => p.id !== target.id);
      setData({ ...data, prestamos: updated });
      setDeleteTarget(null);
      setPrestamoView('list');
      setActivePrestamo(null);
      showToast('🗑️ Préstamo eliminado correctamente');
    } catch (e) {
      showToast('Error: ' + e.message, 'error');
    }
  };

  const handleSave = async () => {
    if (!activePrestamo) return; setLoading(true);
    const isNew = !data?.prestamos?.some(p => p.id === activePrestamo.id);
    try {
      const payload = { ...activePrestamo, capital: parseFloat(activePrestamo.capital) || 0, interes: parseFloat(activePrestamo.interes) || 0 };
      const { error } = await supabase.from('prestamos').upsert(payload);
      if (error) throw error;
      const current = Array.isArray(data?.prestamos) ? data.prestamos : [];
      const updated = current.some(p => p.id === activePrestamo.id) 
        ? current.map(p => p.id === activePrestamo.id ? activePrestamo : p) 
        : [...current, activePrestamo];
      setData({...data, prestamos: updated});
      
      if (isNew) {
        showToast(`Nuevo prestamista "${activePrestamo.nombre || 'Sin nombre'}" registrado con éxito`, 'success');
      } else {
        showToast(`Cambios guardados correctamente`, 'success');
      }
    } catch (e) { 
      showToast('Error: ' + e.message, 'error');
    } finally { setLoading(false); }
  };

  const togglePago = (mes) => {
    if (!activePrestamo) return;
    const current = Array.isArray(activePrestamo.pagos) ? activePrestamo.pagos : [];
    const newPagos = current.includes(mes) ? current.filter(m => m !== mes) : [...current, mes];
    setActivePrestamo({ ...activePrestamo, pagos: newPagos });
  };

  const generateTimeline = () => {
    if (!activePrestamo?.inicio || !activePrestamo?.fin) return [];
    const start = new Date(activePrestamo.inicio);
    const end = new Date(activePrestamo.fin);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return [];
    
    const months = [];
    let current = new Date(start.getFullYear(), start.getMonth() + 1, 1);
    
    while (current <= new Date(end.getFullYear(), end.getMonth(), 1)) {
      months.push({ 
        key: `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`, 
        label: current.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }) 
      });
      current.setMonth(current.getMonth() + 1);
    }
    return months;
  };

  const prestamosList = Array.isArray(data?.prestamos) ? data.prestamos : [];

  // ─── HOOKS DEL DASHBOARD ─────────────────────────────────
  const { stats } = useAmortizacionGlobal(prestamosList);
  const { totales } = usePrestamoCategorias(prestamosList);

  // Proyección agregada de todos los préstamos activos
  const proyeccionAgregada = useMemo(() => {
    const activos = prestamosList.filter(p => p.estado !== 'Finalizado');
    if (activos.length === 0) return [];
    const acum = {};
    activos.forEach(p => {
      const prox = proyectarSiguientes(p, 6);
      prox.forEach(item => {
        if (!acum[item.key]) acum[item.key] = { label: item.label, valor: 0 };
        acum[item.key].valor += item.total;
      });
    });
    const maxVal = Math.max(...Object.values(acum).map(v => v.valor), 1);
    return Object.values(acum).map(v => ({ ...v, pct: (v.valor / maxVal) * 100 }));
  }, [prestamosList]);

  // Data para donut chart de riesgo
  const riesgoData = useMemo(() => {
    const items = [
      { label: 'Al día', value: totales.alDia, color: '#10b981' },
      { label: 'Pendientes', value: totales.pendientes, color: '#f59e0b' },
      { label: '1 mes mora', value: totales.deudor1Mes, color: '#f97316' },
      { label: 'Crítico', value: totales.deudorCritico, color: '#ef4444' },
    ];
    const totalVal = items.reduce((s, i) => s + i.value, 0) || 1;
    let offset = 0;
    const circumference = 2 * Math.PI * 38;
    const segments = items.map(i => {
      const pct = i.value / totalVal;
      const segLen = pct * circumference;
      const seg = { ...i, pct: pct * 100, dashArray: `${segLen} ${circumference - segLen}`, dashOffset: -offset };
      offset += segLen;
      return seg;
    });
    return { segments, totalVal, items };
  }, [totales]);

  // Mapa de mora por préstamo para mostrar en lista
  const moraMap = useMemo(() => {
    const map = {};
    prestamosList.forEach(p => {
      const cuotas = generarCronograma(p);
      const resumen = calcularResumen(cuotas);
      if (resumen.totalMora > 0) map[p.id] = resumen.totalMora;
    });
    return map;
  }, [prestamosList]);

  // ─── RENDER ─────────────────────────────────────────────
  return (
    <>
      {toast && (
        <ToastNotification
          key={toast.key}
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
          isDark={isDark}
        />
      )}

      {/* Modal Formulario Wizard */}
      {showForm && (
        <PrestamoFormModal
          isDark={isDark}
          prestamo={editPrestamo}
          onClose={() => { setShowForm(false); setEditPrestamo(null); }}
          onSave={handleFormSave}
        />
      )}

      {/* Modal Eliminación */}
      {deleteTarget && (
        <DeleteConfirmModal
          target={deleteTarget}
          isDark={isDark}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      <div className="flex flex-col h-full w-full animate-in fade-in duration-500">
        {prestamoView === 'list' ? (
          <div className="animate-in fade-in duration-300">
            <header style={{
              display: 'flex', flexDirection: isMobile ? 'column' : 'row',
              justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'flex-end',
              gap: '16px', marginBottom: '32px',
            }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: t.text, letterSpacing: '-0.02em', margin: 0 }}>Cartera de Préstamos</h2>
                <p style={{ fontSize: '0.75rem', color: t.textDim, marginTop: '4px', fontWeight: 500 }}>Dashboard Analítico — Gestión de Capital</p>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  onClick={handleNewPrestamo} 
                  style={{
                    backgroundColor: t.accent, color: 'white', border: 'none',
                    borderRadius: '12px', padding: isMobile ? '14px 24px' : '10px 20px',
                    fontSize: '11px', fontWeight: 600, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    gap: '8px', transition: 'all 0.2s ease', width: isMobile ? '100%' : 'auto',
                  }}
                  onMouseEnter={e => e.target.style.backgroundColor = t.accentHover}
                  onMouseLeave={e => e.target.style.backgroundColor = t.accent}
                >
                  <Plus size={16} strokeWidth={3} /> Nuevo Registro
                </button>
              </div>
            </header>

            {/* ─── DASHBOBOARD ANALÍTICO ──────────────────────────────── */}
            {/* KPIs */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(5, 1fr)',
              gap: '12px', marginBottom: '24px',
            }}>
              <KPICard t={t} icon={DollarSign} label="Capital Activo" value={stats.capitalActivo.toLocaleString()} moneda="BOB" color={t.accent} />
              <KPICard t={t} icon={TrendingUp} label="Rendimiento Mensual" value={stats.rendimientoMensual.toLocaleString()} moneda="BOB" color="#10b981" />
              <KPICard t={t} icon={Percent} label="Tasa Promedio" value={stats.tasaPromedio.toFixed(1)} moneda="%" color="#f59e0b" />
              <KPICard t={t} icon={AlertTriangle} label="Mora Acumulada" value={stats.totalMora.toLocaleString()} moneda="BOB" color="#ef4444" />
              <KPICard t={t} icon={Heart} label="Índice de Salud" value={stats.indiceSalud.toFixed(0)} moneda="/100" color={stats.indiceSalud >= 70 ? '#10b981' : stats.indiceSalud >= 40 ? '#f59e0b' : '#ef4444'} />
            </div>

            {/* Gráficos: Bar Chart + Donut Chart */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr',
              gap: '16px', marginBottom: '24px',
            }}>
              {/* Bar Chart — Proyección 6 meses */}
              <div style={{
                padding: '20px', backgroundColor: t.panel,
                border: `1px solid ${t.border}`, borderRadius: '16px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <BarChart3 size={16} color={t.accent} />
                  <span style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em', color: t.textDim }}>
                    Proyección Próximos 6 Meses
                  </span>
                </div>
                {proyeccionAgregada.length > 0 ? (
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '100px' }}>
                    {proyeccionAgregada.map((item, idx) => (
                      <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', height: '100%', justifyContent: 'flex-end' }}>
                        <span style={{ fontSize: '8px', fontWeight: 600, color: t.text, opacity: 0.7 }}>{(item.valor).toLocaleString()}</span>
                        <div
                          title={`${item.label}: ${item.valor.toLocaleString()}`}
                          style={{
                            width: '100%', maxWidth: '36px',
                            height: `${Math.max(item.pct, 4)}%`,
                            borderRadius: '6px 6px 0 0',
                            background: `linear-gradient(180deg, ${t.accent}, ${t.accent}60)`,
                            transition: 'height 0.4s ease',
                            minHeight: '6px',
                          }}
                        />
                        <span style={{ fontSize: '7px', fontWeight: 500, color: t.textDim, transform: 'rotate(-45deg)', transformOrigin: 'left', whiteSpace: 'nowrap', marginTop: '2px' }}>
                          {item.label}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100px', color: t.textDim, fontSize: '11px' }}>
                    Sin préstamos activos para proyectar
                  </div>
                )}
              </div>

              {/* Donut Chart — Distribución de Riesgo */}
              <div style={{
                padding: '20px', backgroundColor: t.panel,
                border: `1px solid ${t.border}`, borderRadius: '16px',
                display: 'flex', flexDirection: 'column',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <PieChart size={16} color={t.accent} />
                  <span style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em', color: t.textDim }}>
                    Distribución de Riesgo
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
                  <div style={{ position: 'relative', width: '96px', height: '96px', flexShrink: 0 }}>
                    <svg width="96" height="96" viewBox="0 0 100 100">
                      {riesgoData.segments.map((seg, idx) => (
                        <circle
                          key={idx}
                          cx="50" cy="50" r="38"
                          fill="none"
                          stroke={seg.color}
                          strokeWidth="12"
                          strokeDasharray={seg.dashArray}
                          strokeDashoffset={seg.dashOffset}
                          transform="rotate(-90 50 50)"
                          style={{ transition: 'stroke-dasharray 0.5s ease' }}
                        />
                      ))}
                      <circle cx="50" cy="50" r="28" fill={t.panel} />
                      <text x="50" y="50" textAnchor="middle" dominantBaseline="central"
                        fill={t.text} fontSize="14" fontWeight="700">
                        {riesgoData.totalVal}
                      </text>
                    </svg>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                    {riesgoData.items.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: item.color, flexShrink: 0 }} />
                        <span style={{ fontSize: '9px', fontWeight: 500, color: t.textDim, flex: 1 }}>{item.label}</span>
                        <span style={{ fontSize: '9px', fontWeight: 700, color: t.text }}>{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Tabla/Cards con botón eliminar */}
            <div style={{ backgroundColor: t.panel, border: `1px solid ${t.border}`, borderRadius: '12px', overflow: 'hidden' }}>
              {!isMobile ? (
                <table className="w-full text-left" style={{ borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${t.border}` }}>
                      <th style={{ padding: '16px 24px', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: t.textDim }}>Acreditado</th>
                      <th style={{ padding: '16px 24px', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: t.textDim, textAlign: 'center' }}>Periodo</th>
                      <th style={{ padding: '16px 24px', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: t.textDim }}>Capital</th>
                      <th style={{ padding: '16px 24px', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: t.textDim }}>Interés</th>
                      <th style={{ padding: '16px 24px', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: t.textDim, textAlign: 'right' }}>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {prestamosList.map(p => {
                      const moraAmount = moraMap[p.id];
                      return (
                      <tr key={p.id} onClick={() => openPrestamo(p)}
                        style={{ borderBottom: `1px solid ${t.border}`, cursor: 'pointer', transition: 'background 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = t.hover}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <td style={{ padding: '16px 24px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '36px', height: '36px', borderRadius: '50%', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: t.accentSoft, color: t.accent, flexShrink: 0 }}>
                              {p.foto ? (
                                <img src={p.foto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : (
                                <User size={16} />
                              )}
                            </div>
                            <div>
                              <p style={{ fontSize: '13px', fontWeight: 600, color: t.text, margin: 0 }}>{p.nombre || 'Sin Nombre'}</p>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                                <span style={{
                                  fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em',
                                  padding: '2px 8px', borderRadius: '12px',
                                  backgroundColor: p.estado === 'Finalizado' ? 'rgba(16, 185, 129, 0.10)' : p.estado === 'En Mora' ? 'rgba(239, 68, 68, 0.10)' : t.accentSoft,
                                  color: p.estado === 'Finalizado' ? t.success : p.estado === 'En Mora' ? t.danger : t.accent,
                                }}>
                                  {p.estado || 'Activo'}
                                </span>
                                {moraAmount > 0 && (
                                  <span style={{
                                    fontSize: '9px', fontWeight: 700, color: '#ef4444',
                                    padding: '2px 8px', borderRadius: '12px',
                                    backgroundColor: 'rgba(239, 68, 68, 0.10)',
                                  }}>
                                    +{moraAmount.toLocaleString()} mora
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                          <span style={{ fontSize: '10px', fontWeight: 500, color: t.textMuted }}>
                            {p.inicio ? new Date(p.inicio).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) : '---'}
                          </span>
                        </td>
                        <td style={{ padding: '16px 24px' }}>
                          <p style={{ fontSize: '13px', fontWeight: 600, color: t.text, margin: 0 }}>
                            {parseFloat(p.capital).toLocaleString()} <span style={{ fontSize: '9px', color: t.textDim }}>{p.moneda}</span>
                          </p>
                        </td>
                        <td style={{ padding: '16px 24px' }}>
                          <p style={{ fontSize: '13px', fontWeight: 600, color: t.accent, margin: 0 }}>
                            {(parseFloat(p.capital) * (parseFloat(p.interes) / 100)).toLocaleString()} <span style={{ fontSize: '9px', color: t.accent }}>{p.moneda}</span>
                          </p>
                        </td>
                        <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleEditPrestamo(p); }}
                              style={{
                                padding: '8px', borderRadius: '12px', border: 'none',
                                backgroundColor: t.accentSoft, color: t.accent, cursor: 'pointer',
                                opacity: 0, transition: 'all 0.2s',
                              }}
                              className="group-hover:opacity-100"
                              onMouseEnter={e => { e.currentTarget.style.opacity = '1'; }}
                              title="Editar"
                            >
                              <Edit3 size={14} />
                            </button>
                            <button 
                              onClick={(e) => handleDeleteRequest(p, e)}
                              style={{
                                padding: '8px', borderRadius: '12px', border: 'none',
                                backgroundColor: 'rgba(239, 68, 68, 0.10)', color: '#ef4444', cursor: 'pointer',
                                opacity: 0, transition: 'all 0.2s',
                              }}
                              className="group-hover:opacity-100"
                              onMouseEnter={e => { e.currentTarget.style.opacity = '1'; }}
                              title="Eliminar"
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
              ) : (
                <div>
                  {prestamosList.map(p => {
                    const moraAmount = moraMap[p.id];
                    return (
                    <div key={p.id} onClick={() => openPrestamo(p)}
                      style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', borderBottom: `1px solid ${t.border}` }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '44px', height: '44px', borderRadius: '50%', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: t.accentSoft, color: t.accent, flexShrink: 0 }}>
                          {p.foto ? (
                            <img src={p.foto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <User size={20} />
                          )}
                        </div>
                        <div>
                          <p style={{ fontSize: '13px', fontWeight: 600, color: t.text, margin: 0 }}>{p.nombre}</p>
                          <p style={{ fontSize: '10px', fontWeight: 600, color: t.accent, marginTop: '2px' }}>
                            {(parseFloat(p.capital) * (parseFloat(p.interes) / 100)).toLocaleString()} {p.moneda}
                          </p>
                          {moraAmount > 0 && (
                            <span style={{ fontSize: '9px', fontWeight: 700, color: '#ef4444', marginTop: '2px', display: 'inline-block' }}>
                              +{moraAmount.toLocaleString()} mora
                            </span>
                          )}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleEditPrestamo(p); }}
                          style={{
                            padding: '8px', borderRadius: '10px', border: 'none',
                            backgroundColor: t.accentSoft, color: t.accent, cursor: 'pointer',
                            fontSize: '10px', fontWeight: 600,
                            display: 'flex', alignItems: 'center', gap: '4px',
                          }}
                        >
                          <Edit3 size={12} /> Editar
                        </button>
                        <button
                          onClick={(e) => handleDeleteRequest(p, e)}
                          style={{
                            padding: '8px', borderRadius: '10px', border: 'none',
                            backgroundColor: 'rgba(239, 68, 68, 0.10)', color: '#ef4444', cursor: 'pointer',
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                        <ChevronRight size={18} color={t.textDim} />
                      </div>
                    </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="animate-in slide-in-from-right-8 duration-500">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '32px', cursor: 'pointer' }}
              onClick={closePrestamo}>
              <span style={{ color: t.textMuted, fontSize: '11px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ArrowLeft size={14} /> Volver
              </span>
            </div>
            
            <header style={{
              display: 'flex', flexDirection: isMobile ? 'column' : 'row',
              justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'center',
              gap: '24px', marginBottom: '40px',
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                <div style={{ width: '88px', height: '88px', borderRadius: '16px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: t.accentSoft, border: `2px solid ${t.border}`, flexShrink: 0 }}>
                  {activePrestamo?.foto ? (
                    <img src={activePrestamo.foto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <User size={32} color={t.accent} />
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%' }}>
                    <input
                      type="text"
                      value={activePrestamo.nombre}
                      onChange={e => setActivePrestamo({...activePrestamo, nombre: e.target.value})}
                      style={{
                        fontSize: '1.25rem', fontWeight: 700, color: t.text,
                        background: 'transparent', border: 'none', outline: 'none',
                        flex: 1, minWidth: 0, letterSpacing: '-0.02em',
                      }}
                      placeholder="Nombre del Cliente"
                    />
                    <span style={{ color: t.textMuted, fontSize: '11px', fontWeight: 400, whiteSpace: 'nowrap', flexShrink: 0 }}>
                      Contrato: {new Date(activePrestamo?.inicio || activePrestamo?.created_at || Date.now()).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
                    {/* CI — misma altura y estilo que el select */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0 14px', height: '36px', backgroundColor: t.input, border: `1px solid ${t.border}`, borderRadius: '10px', boxSizing: 'border-box', overflow: 'hidden' }}>
                      <FileSignature size={14} color={t.textDim} />
                      <input type="text" value={activePrestamo?.ci || ''}
                        onChange={e => setActivePrestamo({...activePrestamo, ci: e.target.value})}
                        style={{ background: 'transparent', border: 'none', outline: 'none', width: '100%', minWidth: 0, color: t.text, fontSize: '11px', lineHeight: 1.2, padding: 0, height: 'auto' }} placeholder="Cédula de Identidad" />
                    </div>
                    {/* WhatsApp — misma altura y estilo que el select */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0 14px', height: '36px', backgroundColor: t.input, border: `1px solid ${t.border}`, borderRadius: '10px', boxSizing: 'border-box', overflow: 'hidden' }}>
                      <Smartphone size={14} color={t.textDim} />
                      <input type="text" value={activePrestamo.telefono}
                        onChange={e => setActivePrestamo({...activePrestamo, telefono: e.target.value})}
                        style={{ background: 'transparent', border: 'none', outline: 'none', width: '100%', minWidth: 0, color: t.text, fontSize: '11px', lineHeight: 1.2, padding: 0, height: 'auto' }} placeholder="WhatsApp" />
                    </div>
                    <select value={activePrestamo.estado}
                      onChange={e => setActivePrestamo({...activePrestamo, estado: e.target.value})}
                      style={{
                        height: '36px', padding: '0 14px', borderRadius: '10px', fontSize: '11px', fontWeight: 600,
                        textTransform: 'uppercase', border: `1px solid ${t.border}`,
                        backgroundColor: t.input, color: t.accent, outline: 'none', boxSizing: 'border-box',
                      }}>
                      <option value="Activo">Activo</option>
                      <option value="En Mora">En Mora</option>
                      <option value="Finalizado">Finalizado</option>
                    </select>
                    {/* Editar — misma altura que el resto */}
                    <button
                      onClick={() => handleEditPrestamo(activePrestamo)}
                      title="Editar préstamo"
                      style={{
                        width: '36px', height: '36px', borderRadius: '10px',
                        border: `1px solid ${t.border}`, backgroundColor: t.input,
                        color: t.accent, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={e => { e.target.style.borderColor = t.accent; e.target.style.backgroundColor = t.accentSoft; }}
                      onMouseLeave={e => { e.target.style.borderColor = t.border; e.target.style.backgroundColor = t.input; }}
                    >
                      <Edit3 size={15} />
                    </button>
                    {/* Eliminar — misma altura que el resto */}
                    <button
                      onClick={(e) => handleDeleteRequest(activePrestamo, e)}
                      title="Eliminar préstamo"
                      style={{
                        width: '36px', height: '36px', borderRadius: '10px',
                        border: '1px solid rgba(239, 68, 68, 0.25)', backgroundColor: 'rgba(239, 68, 68, 0.07)',
                        color: '#ef4444', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={e => { e.target.style.backgroundColor = 'rgba(239, 68, 68, 0.15)'; e.target.style.borderColor = 'rgba(239, 68, 68, 0.5)'; }}
                      onMouseLeave={e => { e.target.style.backgroundColor = 'rgba(239, 68, 68, 0.07)'; e.target.style.borderColor = 'rgba(239, 68, 68, 0.25)'; }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
              <button 
                onClick={handleSave} 
                disabled={loading}
                style={{
                  backgroundColor: t.accent, color: 'white', border: 'none',
                  borderRadius: '12px', padding: isMobile ? '14px 24px' : '10px 20px',
                  fontSize: '11px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  gap: '8px', transition: 'all 0.2s', opacity: loading ? 0.6 : 1,
                  width: isMobile ? '100%' : 'auto',
                }}
                onMouseEnter={e => { if (!loading) e.target.style.backgroundColor = t.accentHover; }}
                onMouseLeave={e => { if (!loading) e.target.style.backgroundColor = t.accent; }}
              >
                <Save size={16} /> {loading ? 'Guardando...' : 'Guardar'}
              </button>
            </header>

            <div className={`grid gap-6 ${isMobile ? 'grid-cols-1' : 'grid-cols-12'}`}>
              {/* LEFT COLUMN - Timeline & Contract */}
              <div className={`${isMobile ? '' : 'col-span-8'} space-y-6`}>
                {/* LEDGER / CUENTA CORRIENTE */}
                <div style={{ padding: '24px', backgroundColor: t.panel, border: `1px solid ${t.border}`, borderRadius: '12px' }}>
                  <h3 style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: t.textMuted, margin: 0, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                    <CalendarDays size={14} color={t.accent} /> Cuenta Corriente
                  </h3>
                  <p style={{ fontSize: '10px', fontWeight: 500, color: t.textDim, marginBottom: '16px' }}>
                    <span style={{ color: t.accent }}>⏱️</span> Click en fila para marcar como pagado
                  </p>
                  <div style={{ overflowX: 'auto' }}>
                    <table className="w-full text-left" style={{ borderCollapse: 'collapse', minWidth: '600px' }}>
                      <thead>
                        <tr style={{ borderBottom: `1px solid ${t.border}` }}>
                          <th style={{ padding: '10px 14px', fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: t.textDim }}>Mes</th>
                          <th style={{ padding: '10px 14px', fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: t.textDim }}>Vencimiento</th>
                          <th style={{ padding: '10px 14px', fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: t.textDim, textAlign: 'right' }}>Interés</th>
                          <th style={{ padding: '10px 14px', fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: t.textDim, textAlign: 'right' }}>Total</th>
                          <th style={{ padding: '10px 14px', fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: t.textDim, textAlign: 'center' }}>Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ledgerCuotas.map((c) => {
                          const isPaid = (activePrestamo.pagos || []).includes(c.key);
                          return (
                            <tr key={c.key} onClick={() => togglePago(c.key)}
                              style={{
                                cursor: 'pointer', transition: 'background 0.15s',
                                borderBottom: `1px solid ${t.border}`,
                                backgroundColor: isPaid ? 'rgba(16, 185, 129, 0.04)' : 'transparent',
                              }}
                              onMouseEnter={e => e.currentTarget.style.backgroundColor = isPaid ? 'rgba(16, 185, 129, 0.08)' : t.hover}
                              onMouseLeave={e => e.currentTarget.style.backgroundColor = isPaid ? 'rgba(16, 185, 129, 0.04)' : 'transparent'}
                            >
                              <td style={{ padding: '10px 14px' }}>
                                <span style={{ fontSize: '11px', fontWeight: 600, color: isPaid ? t.success : t.text }}>
                                  {c.label}
                                </span>
                              </td>
                              <td style={{ padding: '10px 14px' }}>
                                <span style={{ fontSize: '10px', color: t.textDim, fontWeight: 500 }}>
                                  {c.fechaVencimiento || '—'}
                                </span>
                              </td>
                              <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                                <span style={{ fontSize: '11px', fontWeight: 600, color: isPaid ? t.success : t.accent }}>
                                  {c.interes.toLocaleString()}
                                </span>
                              </td>
                              <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '1px' }}>
                                  <span style={{ fontSize: '11px', fontWeight: 600, color: isPaid ? t.success : t.text }}>
                                    {c.total.toLocaleString()}
                                  </span>
                                  {c.mora > 0 && (
                                    <span style={{ fontSize: '9px', fontWeight: 700, color: '#ef4444' }}>
                                      +{c.mora.toLocaleString()} mora
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                                {isPaid ? (
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '9px', fontWeight: 600, color: t.success }}>
                                    <CheckCircle2 size={12} /> Pagado
                                  </span>
                                ) : c.estado === 'vencido' ? (
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '9px', fontWeight: 600, color: '#ef4444' }}>
                                    <AlertCircle size={12} /> Vencido
                                  </span>
                                ) : c.estado === 'futuro' ? (
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '9px', fontWeight: 600, color: t.textDim }}>
                                    <Clock size={12} /> Futuro
                                  </span>
                                ) : (
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '9px', fontWeight: 600, color: t.textMuted }}>
                                    <Clock size={12} /> Pendiente
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      {ledgerResumen && (
                        <tfoot>
                          <tr style={{ borderTop: `2px solid ${t.accent}` }}>
                            <td style={{ padding: '12px 14px' }}>
                              <span style={{ fontSize: '10px', fontWeight: 700, color: t.text }}>Totales</span>
                            </td>
                            <td style={{ padding: '12px 14px' }}></td>
                            <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                              <span style={{ fontSize: '11px', fontWeight: 700, color: t.accent }}>
                                {ledgerResumen.interesPromedio.toLocaleString()}/mes
                              </span>
                            </td>
                            <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                              <span style={{ fontSize: '11px', fontWeight: 700, color: t.text }}>
                                {ledgerResumen.totalPagado.toLocaleString()} pagado
                              </span>
                              <br />
                              <span style={{ fontSize: '10px', fontWeight: 600, color: t.textDim }}>
                                {ledgerResumen.totalPendiente.toLocaleString()} pend.
                              </span>
                              {ledgerResumen.totalMora > 0 && (
                                <>
                                  <br />
                                  <span style={{ fontSize: '10px', fontWeight: 700, color: '#ef4444' }}>
                                    {ledgerResumen.totalMora.toLocaleString()} en mora
                                  </span>
                                </>
                              )}
                            </td>
                            <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                              <span style={{ fontSize: '9px', fontWeight: 600, color: t.textMuted }}>
                                {ledgerResumen.cuotasPagadas}/{ledgerResumen.totalCuotas} pagadas
                              </span>
                            </td>
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  </div>
                </div>

                {/* CONTRACT & GUARANTEE */}
                <div style={{ padding: '24px', backgroundColor: t.panel, border: `1px solid ${t.border}`, borderRadius: '12px' }}>
                  <h3 style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: t.textMuted, margin: 0, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                    <ShieldCheck size={14} color={t.accent} /> Contrato y Garantía
                  </h3>
                  <textarea value={activePrestamo.garantia} 
                    onChange={e => setActivePrestamo({...activePrestamo, garantia: e.target.value})} 
                    style={{
                      width: '100%', height: '120px', padding: '14px', fontSize: '12px',
                      backgroundColor: t.input, border: `1px solid ${t.border}`, color: t.text,
                      borderRadius: '12px', outline: 'none', resize: 'none', transition: 'border 0.2s',
                    }}
                    onFocus={e => { e.target.style.borderColor = t.accent; }}
                    onBlur={e => { e.target.style.borderColor = t.border; }}
                    placeholder="Detalles de la garantía (Ej: Auto, Título de propiedad, etc.)" />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
                    <div>
                      <label style={{ fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: t.textMuted, display: 'block', marginBottom: '6px' }}>Link Contrato Drive</label>
                      <input type="text" value={activePrestamo.drive_contrato} 
                        onChange={e => setActivePrestamo({...activePrestamo, drive_contrato: e.target.value})} 
                        style={{
                          width: '100%', padding: '10px 14px', fontSize: '10px',
                          backgroundColor: t.input, border: `1px solid ${t.border}`, color: t.text,
                          borderRadius: '12px', outline: 'none', transition: 'border 0.2s',
                        }}
                        onFocus={e => { e.target.style.borderColor = t.accent; }}
                        onBlur={e => { e.target.style.borderColor = t.border; }}
                        placeholder="https://drive.google.com/..." />
                    </div>
                    <div>
                      <label style={{ fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: t.textMuted, display: 'block', marginBottom: '6px' }}>Link Fotos Respaldo</label>
                      <input type="text" value={activePrestamo.drive_fotos} 
                        onChange={e => setActivePrestamo({...activePrestamo, drive_fotos: e.target.value})} 
                        style={{
                          width: '100%', padding: '10px 14px', fontSize: '10px',
                          backgroundColor: t.input, border: `1px solid ${t.border}`, color: t.text,
                          borderRadius: '12px', outline: 'none', transition: 'border 0.2s',
                        }}
                        onFocus={e => { e.target.style.borderColor = t.accent; }}
                        onBlur={e => { e.target.style.borderColor = t.border; }}
                        placeholder="https://photos.app.goo.gl/..." />
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN - Capital & Period */}
              <div className={`${isMobile ? '' : 'col-span-4'} space-y-6`}>
                {/* CAPITAL & INTEREST */}
                <div style={{ padding: '24px', backgroundColor: t.panel, border: `1px solid ${t.border}`, borderRadius: '12px' }}>
                  <label style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: t.textMuted, display: 'block', marginBottom: '12px' }}>Capital Invertido</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px', backgroundColor: t.input, border: `1px solid ${t.border}`, borderRadius: '12px' }}>
                    <DollarSign size={18} color={t.textDim} />
                    <input type="number" value={activePrestamo.capital} 
                      onChange={e => setActivePrestamo({...activePrestamo, capital: e.target.value})} 
                      style={{
                        background: 'transparent', border: 'none', outline: 'none',
                        fontSize: '1.5rem', fontWeight: 700, color: t.text, width: '100%',
                        fontFamily: 'monospace',
                      }} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '16px' }}>
                    <div>
                      <label style={{ fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: t.textMuted, display: 'block', marginBottom: '6px' }}>Interés (%)</label>
                      <input type="number" value={activePrestamo.interes} 
                        onChange={e => setActivePrestamo({...activePrestamo, interes: e.target.value})} 
                        style={{
                          width: '100%', padding: '12px', fontSize: '1rem', fontFamily: 'monospace',
                          backgroundColor: t.input, border: `1px solid ${t.border}`, color: t.accent,
                          borderRadius: '12px', outline: 'none', fontWeight: 600,
                        }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: t.textMuted, display: 'block', marginBottom: '6px' }}>Moneda</label>
                      <select value={activePrestamo.moneda} 
                        onChange={e => setActivePrestamo({...activePrestamo, moneda: e.target.value})} 
                        style={{
                          width: '100%', padding: '12px', fontSize: '14px', fontWeight: 600,
                          backgroundColor: t.input, border: `1px solid ${t.border}`, color: t.text,
                          borderRadius: '12px', outline: 'none',
                        }}>
                        <option value="BOB">BOB</option>
                        <option value="USD">USD</option>
                      </select>
                    </div>
                  </div>
                  <div style={{ paddingTop: '12px', marginTop: '12px', borderTop: `1px solid ${t.border}` }}>
                    <p style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: t.textMuted, marginBottom: '6px' }}>Interés Mensual Calculado</p>
                    <p style={{ fontSize: '1.125rem', fontWeight: 600, color: t.accent, margin: 0 }}>
                      {(parseFloat(activePrestamo.capital) * (parseFloat(activePrestamo.interes) / 100) || 0).toLocaleString()} {activePrestamo.moneda}
                    </p>
                  </div>
                </div>

                {/* PERIOD */}
                <div style={{ padding: '24px', backgroundColor: t.panel, border: `1px solid ${t.border}`, borderRadius: '12px' }}>
                  <label style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: t.textMuted, display: 'block', marginBottom: '16px' }}>Periodo del Préstamo</label>
                  <div style={{ marginBottom: '12px' }}>
                    <p style={{ fontSize: '8px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: t.textDim, marginBottom: '6px' }}>Fecha Inicio</p>
                    <input type="date" value={activePrestamo.inicio} 
                      onChange={e => setActivePrestamo({...activePrestamo, inicio: e.target.value})} 
                      style={{
                        width: '100%', padding: '10px 14px', fontSize: '12px',
                        backgroundColor: t.input, border: `1px solid ${t.border}`, color: t.text,
                        borderRadius: '12px', outline: 'none', transition: 'border 0.2s',
                      }}
                      onFocus={e => { e.target.style.borderColor = t.accent; }}
                      onBlur={e => { e.target.style.borderColor = t.border; }} />
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    <p style={{ fontSize: '8px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: t.textDim, marginBottom: '6px' }}>Fecha Vencimiento</p>
                    <input type="date" value={activePrestamo.fin} 
                      onChange={e => setActivePrestamo({...activePrestamo, fin: e.target.value})} 
                      style={{
                        width: '100%', padding: '10px 14px', fontSize: '12px',
                        backgroundColor: t.input, border: `1px solid ${t.border}`, color: t.text,
                        borderRadius: '12px', outline: 'none', transition: 'border 0.2s',
                      }}
                      onFocus={e => { e.target.style.borderColor = t.accent; }}
                      onBlur={e => { e.target.style.borderColor = t.border; }} />
                  </div>
                  <div style={{ paddingTop: '12px', borderTop: `1px solid ${t.border}` }}>
                    <p style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: t.textMuted, marginBottom: '4px' }}>Primer Cobro</p>
                    <p style={{ fontSize: '13px', fontWeight: 600, color: t.accent, margin: 0 }}>
                      {activePrestamo.inicio ? new Date(new Date(activePrestamo.inicio).setMonth(new Date(activePrestamo.inicio).getMonth() + 1)).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }) : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

// ─── COMPONENTE KPI CARD ────────────────────────────────────
const KPICard = ({ t, icon: Icon, label, value, moneda, color }) => (
  <div style={{
    padding: '16px', backgroundColor: t.panel,
    border: `1px solid ${t.border}`, borderRadius: '12px',
    display: 'flex', flexDirection: 'column', gap: '8px',
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div style={{
        width: '32px', height: '32px', borderRadius: '10px',
        backgroundColor: `${color}15`, color,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={16} />
      </div>
      <span style={{ fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em', color: t.textDim }}>
        {label}
      </span>
    </div>
    <span style={{ fontSize: '1rem', fontWeight: 700, color: t.text, lineHeight: 1 }}>
      {value} {moneda && <span style={{ fontSize: '10px', fontWeight: 600, color: t.textDim }}>{moneda}</span>}
    </span>
  </div>
);

export default Prestamos;
