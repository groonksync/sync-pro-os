import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Bell, Calendar, DollarSign, Clock, AlertCircle, TrendingUp,
  CreditCard, CheckCircle, ExternalLink, ChevronRight, AlertTriangle, Zap
} from 'lucide-react';
import { useTheme } from '../lib/theme';

const getCheckState = () => {
  try {
    const saved = localStorage.getItem('inefable_notifications_checked');
    return saved ? JSON.parse(saved) : {};
  } catch { return {}; }
};

const Notifications = ({ data = {}, servicios = [], theReminders = [], onNavigate, isDark = true }) => {
  const t = useTheme(isDark);
  const today = new Date();
  const [checked, setChecked] = useState(getCheckState);

  useEffect(() => {
    try { localStorage.setItem('inefable_notifications_checked', JSON.stringify(checked)); }
    catch (e) {}
  }, [checked]);

  const toggleChecked = useCallback((id) => {
    setChecked(prev => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const notifications = useMemo(() => {
    const result = [];

    const prestamos = Array.isArray(data?.prestamos) ? data.prestamos : [];
    const pagosServicios = Array.isArray(servicios) ? servicios : [];
    const recordatorios = Array.isArray(data?.recordatorios) ? data.recordatorios : (Array.isArray(theReminders) ? theReminders : []);

    prestamos.forEach(p => {
      if (!p.inicio) return;
      const startDate = new Date(p.inicio);
      const billingDay = startDate.getDate();
      let nextBilling = new Date(today.getFullYear(), today.getMonth(), billingDay);
      if (nextBilling < today && nextBilling.toDateString() !== today.toDateString()) {
        nextBilling = new Date(today.getFullYear(), today.getMonth() + 1, billingDay);
      }
      const diffDays = Math.ceil((nextBilling - today) / (1000 * 60 * 60 * 24));
      if (diffDays <= 7 && diffDays >= -3) {
        result.push({
          id: `prestamo-${p.id}`,
          type: 'prestamo',
          title: p.nombre || 'Préstamo',
          sourceId: p.id,
          tab: 'prestamos',
          date: nextBilling,
          diffDays,
          amount: (p.capital * (p.interes / 100)) || 0,
          currency: p.moneda || 'BOB',
          capital: p.capital || 0,
          interest: p.interes || 0,
          isDue: diffDays <= 0
        });
      }
    });

    pagosServicios.forEach(s => {
      if (!s.fecha_pago) return;
      const dueDate = new Date(s.fecha_pago);
      const diffDays = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
      if (diffDays <= 7 && diffDays >= -3) {
        result.push({
          id: `servicio-${s.id}`,
          type: 'servicio',
          title: s.nombre || 'Servicio',
          sourceId: s.id,
          tab: 'pagos',
          date: dueDate,
          diffDays,
          amount: s.monto || 0,
          currency: s.moneda || 'BOB',
          metodo: s.metodo || '',
          isDue: diffDays <= 0
        });
      }
    });

    recordatorios.forEach(r => {
      if (!r.fecha && !r.created_at) return;
      const remDate = new Date(r.fecha || r.created_at);
      const diffDays = Math.ceil((remDate - today) / (1000 * 60 * 60 * 24));
      if (diffDays <= 7 && diffDays >= -7) {
        result.push({
          id: `recordatorio-${r.id}`,
          type: 'recordatorio',
          title: r.titulo || r.title || 'Recordatorio',
          sourceId: r.id,
          tab: 'recordatorios',
          date: remDate,
          diffDays,
          amount: null,
          description: r.descripcion || r.notas || r.content || '',
          isDue: diffDays <= 0
        });
      }
    });

    result.sort((a, b) => a.diffDays - b.diffDays);
    return result;
  }, [data, servicios, theReminders, today]);

  const stats = useMemo(() => ({
    total: notifications.length,
    due: notifications.filter(n => n.isDue).length,
    upcoming: notifications.filter(n => !n.isDue).length,
    checkedCount: notifications.filter(n => checked[n.id]).length
  }), [notifications, checked]);

  const navigateTo = useCallback((tab, sourceId) => {
    if (onNavigate) { onNavigate(tab); }
  }, [onNavigate]);

  const formatAmount = (amount, currency) => {
    if (amount == null || amount === 0) return '';
    return `${Number(amount).toLocaleString()} ${currency}`;
  };

  const getTypeConfig = (type) => {
    switch (type) {
      case 'prestamo':
        return { icon: <TrendingUp size={16} />, label: 'Préstamo' };
      case 'servicio':
        return { icon: <CreditCard size={16} />, label: 'Servicio' };
      case 'recordatorio':
        return { icon: <Bell size={16} />, label: 'Recordatorio' };
      default:
        return { icon: <AlertCircle size={16} />, label: 'General' };
    }
  };

  const getStatusConfig = (n) => {
    if (checked[n.id]) {
      return {
        icon: <CheckCircle size={13} />,
        label: 'Revisado',
        color: isDark ? '#A7F3D0' : '#059669',
        bg: isDark ? 'rgba(16,185,129,0.08)' : '#ECFDF5',
        border: isDark ? 'rgba(16,185,129,0.2)' : '#A7F3D0',
      };
    }
    if (n.diffDays < 0) {
      return {
        icon: <AlertTriangle size={13} />,
        label: `Vencido hace ${Math.abs(n.diffDays)} d`,
        color: isDark ? '#FCA5A5' : '#DC2626',
        bg: isDark ? 'rgba(239,68,68,0.08)' : '#FEF2F2',
        border: isDark ? 'rgba(239,68,68,0.2)' : '#FECACA',
      };
    }
    if (n.diffDays === 0) {
      return {
        icon: <Zap size={13} />,
        label: 'Vence hoy',
        color: isDark ? '#FCD34D' : '#D97706',
        bg: isDark ? 'rgba(245,158,11,0.08)' : '#FFFBEB',
        border: isDark ? 'rgba(245,158,11,0.2)' : '#FDE68A',
      };
    }
    return {
      icon: <Clock size={13} />,
      label: `En ${n.diffDays} días`,
      color: t.textMuted,
      bg: isDark ? '#1F1F22' : '#F3F4F6',
      border: t.borderLight || t.border,
    };
  };

  return (
    <div className="flex flex-col h-full w-full max-w-7xl mx-auto py-5 px-3 sm:px-6 space-y-6">
      {/* Header with Stats */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b" style={{ borderColor: t.border }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: t.text, letterSpacing: '-0.02em', margin: 0 }}>
            Notificaciones & Alertas
          </h2>
          <p style={{ fontSize: '0.75rem', color: t.textMuted, marginTop: '2px', fontWeight: 500, margin: 0 }}>
            Centro de monitoreo inteligente y vencimientos
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div
            className="px-3 py-1.5 rounded-xl border text-[11px] font-bold flex items-center gap-1.5"
            style={{
              backgroundColor: isDark ? 'rgba(239,68,68,0.08)' : '#FEF2F2',
              borderColor: isDark ? 'rgba(239,68,68,0.2)' : '#FECACA',
              color: isDark ? '#FCA5A5' : '#DC2626',
            }}
          >
            <span>{stats.due} vencidos</span>
          </div>
          <div
            className="px-3 py-1.5 rounded-xl border text-[11px] font-bold flex items-center gap-1.5"
            style={{
              backgroundColor: isDark ? '#232326' : '#F3F4F6',
              borderColor: t.borderLight || t.border,
              color: t.text,
            }}
          >
            <span>{stats.upcoming} próximos</span>
          </div>
          <div
            className="px-3 py-1.5 rounded-xl border text-[11px] font-bold flex items-center gap-1.5"
            style={{
              backgroundColor: isDark ? 'rgba(16,185,129,0.08)' : '#ECFDF5',
              borderColor: isDark ? 'rgba(16,185,129,0.2)' : '#A7F3D0',
              color: isDark ? '#A7F3D0' : '#065F46',
            }}
          >
            <span>{stats.checkedCount} revisados</span>
          </div>
        </div>
      </header>

      {/* Progress bar */}
      {stats.total > 0 && (
        <div
          className="h-1.5 w-full rounded-full overflow-hidden flex"
          style={{ backgroundColor: isDark ? '#232326' : '#E5E7EB' }}
        >
          <div
            style={{
              width: `${(stats.checkedCount / stats.total) * 100}%`,
              backgroundColor: isDark ? '#A7F3D0' : '#10B981',
              transition: 'width 0.4s ease',
            }}
          />
          <div
            style={{
              width: `${(stats.due / stats.total) * 100}%`,
              backgroundColor: isDark ? '#FCA5A5' : '#EF4444',
              transition: 'width 0.4s ease',
            }}
          />
        </div>
      )}

      {/* List */}
      <div className="grid gap-3 overflow-y-auto mac-scrollbar">
        {notifications.length > 0 ? notifications.map(n => {
          const tc = getTypeConfig(n.type);
          const sc = getStatusConfig(n);
          const isChecked = checked[n.id];

          return (
            <div
              key={n.id}
              onClick={() => navigateTo(n.tab, n.sourceId)}
              className="p-4 rounded-2xl border flex items-center gap-3.5 transition-all cursor-pointer hover:opacity-95"
              style={{
                borderColor: t.borderLight || t.border,
                backgroundColor: isChecked
                  ? (isDark ? '#1C1C1E' : '#F9FAFB')
                  : t.panel,
                opacity: isChecked ? 0.55 : 1,
              }}
            >
              {/* Checkbox minimalista */}
              <button
                type="button"
                onClick={e => {
                  e.stopPropagation();
                  toggleChecked(n.id);
                }}
                className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 border transition-all"
                style={{
                  backgroundColor: isChecked ? (isDark ? '#ECECEC' : '#1C1C1E') : 'transparent',
                  borderColor: isChecked ? (isDark ? '#ECECEC' : '#1C1C1E') : (t.borderLight || t.border),
                  color: isChecked ? (isDark ? '#1C1C1E' : '#FFFFFF') : 'transparent',
                }}
                title={isChecked ? 'Marcar como pendiente' : 'Marcar como revisado'}
              >
                {isChecked && <CheckCircle size={15} />}
              </button>

              {/* Icon Squircle */}
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border"
                style={{
                  backgroundColor: isDark ? '#1F1F22' : '#F3F4F6',
                  borderColor: t.borderLight || t.border,
                  color: t.text,
                }}
              >
                {tc.icon}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span
                    className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border"
                    style={{
                      backgroundColor: isDark ? '#1F1F22' : '#F3F4F6',
                      borderColor: t.borderLight || t.border,
                      color: t.textMuted,
                    }}
                  >
                    {tc.label}
                  </span>
                  <span
                    className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border flex items-center gap-1"
                    style={{
                      backgroundColor: sc.bg,
                      borderColor: sc.border,
                      color: sc.color,
                    }}
                  >
                    {sc.icon} {sc.label}
                  </span>
                </div>

                <h4
                  className="text-xs font-bold tracking-tight m-0 truncate"
                  style={{
                    color: isChecked ? t.textMuted : t.text,
                    textDecoration: isChecked ? 'line-through' : 'none',
                  }}
                >
                  {n.title}
                </h4>

                <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                  <span className="text-[10px] flex items-center gap-1 font-mono" style={{ color: t.textMuted }}>
                    <Calendar size={11} />
                    {n.date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                  {n.amount != null && n.amount > 0 && (
                    <span className="text-[10px] font-mono font-bold flex items-center gap-1" style={{ color: t.text }}>
                      <DollarSign size={11} />
                      {formatAmount(n.amount, n.currency)}
                    </span>
                  )}
                  {n.type === 'prestamo' && n.capital > 0 && (
                    <span className="text-[9px] font-mono" style={{ color: t.textMuted }}>
                      Capital: {Number(n.capital).toLocaleString()} {n.currency}
                    </span>
                  )}
                  {n.type === 'servicio' && n.metodo && (
                    <span className="text-[9px]" style={{ color: t.textMuted }}>{n.metodo}</span>
                  )}
                  {n.type === 'recordatorio' && n.description && (
                    <span className="text-[9px] truncate max-w-xs" style={{ color: t.textMuted }}>
                      {n.description}
                    </span>
                  )}
                </div>
              </div>

              {/* Action arrow */}
              <div className="shrink-0 flex items-center justify-center p-2 rounded-xl border opacity-70 hover:opacity-100 transition-opacity" style={{ borderColor: t.borderLight || t.border, color: t.textMuted }}>
                <ChevronRight size={14} />
              </div>
            </div>
          );
        }) : (
          <div
            className="p-16 flex flex-col items-center justify-center rounded-2xl border text-center"
            style={{
              borderColor: t.borderLight || t.border,
              backgroundColor: t.panel,
            }}
          >
            <Bell size={36} style={{ color: t.textMuted, marginBottom: 12 }} />
            <p className="text-xs font-semibold m-0" style={{ color: t.text }}>No hay notificaciones pendientes</p>
            <p className="text-[10px] m-0 mt-1" style={{ color: t.textMuted }}>Todo está al día en tu cartera y servicios</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
