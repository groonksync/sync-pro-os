import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Bell, Calendar, DollarSign, Clock, AlertCircle, TrendingUp,
  CreditCard, FileText, CheckCircle, ExternalLink, Archive,
  ChevronRight, AlertTriangle, Ban, Zap
} from 'lucide-react';
import { getTheme } from '../lib/theme';

const getCheckState = () => {
  try {
    const saved = localStorage.getItem('inefable_notifications_checked');
    return saved ? JSON.parse(saved) : {};
  } catch { return {}; }
};

const Notifications = ({ data = {}, servicios = [], theReminders = [], onNavigate, isDark = true }) => {
  const t = useMemo(() => getTheme(isDark), [isDark]);
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
          tab: 'notas',
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
        return { icon: <TrendingUp size={18} />, label: 'Préstamo', color: '#f59e0b' };
      case 'servicio':
        return { icon: <CreditCard size={18} />, label: 'Servicio', color: '#3b82f6' };
      case 'recordatorio':
        return { icon: <Bell size={18} />, label: 'Recordatorio', color: '#8b5cf6' };
      default:
        return { icon: <AlertCircle size={18} />, label: 'General', color: t.textMuted };
    }
  };

  const getStatusConfig = (n) => {
    if (checked[n.id]) return { icon: <CheckCircle size={14} />, label: 'Revisado', color: '#10b981' };
    if (n.diffDays < 0) return { icon: <AlertTriangle size={14} />, label: `Vencido hace ${Math.abs(n.diffDays)} días`, color: '#ef4444' };
    if (n.diffDays === 0) return { icon: <Zap size={14} />, label: 'Vence hoy', color: '#f59e0b' };
    return { icon: <Clock size={14} />, label: `En ${n.diffDays} días`, color: t.textMuted };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', padding: '0 4px' }}>
      {/* Header with Stats */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: t.text, letterSpacing: '-0.02em', margin: 0 }}>Notificaciones</h2>
            <p style={{ fontSize: '0.75rem', color: t.textDim, marginTop: '4px', fontWeight: 500 }}>
              Centro de monitoreo inteligente
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            {[
              { label: `${stats.due} vencidos`, color: '#ef4444' },
              { label: `${stats.upcoming} próximos`, color: '#3b82f6' },
              { label: `${stats.checkedCount} revisados`, color: '#10b981' }
            ].map((s, i) => (
              <div key={i} style={{
                padding: '6px 12px', borderRadius: 8,
                backgroundColor: `${s.color}15`,
                color: s.color, fontSize: 10, fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.03em'
              }}>
                {s.label}
              </div>
            ))}
          </div>
        </div>
        {stats.total > 0 && (
          <div style={{
            height: 4, borderRadius: 2, backgroundColor: t.border,
            overflow: 'hidden', display: 'flex'
          }}>
            <div style={{ width: `${(stats.checkedCount / stats.total) * 100}%`, height: '100%', backgroundColor: '#10b981', transition: 'width 0.5s ease' }} />
            <div style={{ width: `${(stats.due / stats.total) * 100}%`, height: '100%', backgroundColor: '#ef4444' }} />
            <div style={{ flex: 1, height: '100%', backgroundColor: t.border }} />
          </div>
        )}
      </div>

      {/* List */}
      <div style={{ display: 'grid', gap: 12, overflow: 'auto' }}>
        {notifications.length > 0 ? notifications.map(n => {
          const tc = getTypeConfig(n.type);
          const sc = getStatusConfig(n);
          const isChecked = checked[n.id];

          return (
            <div key={n.id}
              onClick={() => navigateTo(n.tab, n.sourceId)}
              style={{
                padding: 16,
                borderRadius: 14,
                border: `1px solid ${n.isDue && !isChecked ? '#ef444440' : t.border}`,
                backgroundColor: isChecked ? `${t.panel}60` : (n.isDue ? '#ef444408' : t.panel),
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                cursor: 'pointer',
                transition: 'all 0.3s',
                opacity: isChecked ? 0.6 : 1
              }}
            >
              {/* Checkbox */}
              <div onClick={e => { e.stopPropagation(); toggleChecked(n.id); }}
                style={{
                  width: 28, height: 28, borderRadius: 8,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  backgroundColor: isChecked ? '#10b981' : 'transparent',
                  border: `2px solid ${isChecked ? '#10b981' : t.border}`,
                  color: '#000', cursor: 'pointer', transition: 'all 0.2s',
                  flexShrink: 0
                }}
              >
                {isChecked && <CheckCircle size={16} />}
              </div>

              {/* Icon */}
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                backgroundColor: isChecked ? `${tc.color}10` : `${tc.color}20`,
                color: isChecked ? t.textMuted : tc.color,
                flexShrink: 0
              }}>
                {tc.icon}
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{
                    fontSize: 9, fontWeight: 900, textTransform: 'uppercase',
                    letterSpacing: '0.08em', color: tc.color,
                    padding: '2px 8px', borderRadius: 4, backgroundColor: `${tc.color}12`
                  }}>
                    {tc.label}
                  </span>
                  <span style={{

                    fontSize: 9, fontWeight: 700, textTransform: 'uppercase',
                    letterSpacing: '0.05em', color: sc.color,
                    display: 'flex', alignItems: 'center', gap: 4
                  }}>
                    {sc.icon} {sc.label}
                  </span>
                </div>
                <h4 style={{
                  color: isChecked ? t.textMuted : t.text,
                  fontWeight: 600, fontSize: '0.95rem', margin: 0,
                  textDecoration: isChecked ? 'line-through' : 'none',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                }}>
                  {n.title}
                </h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 6, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 10, color: t.textMuted, display: 'flex', alignItems: 'center', gap: 4, fontWeight: 500 }}>
                    <Calendar size={11} />
                    {n.date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                  {n.amount != null && n.amount > 0 && (
                    <span style={{ fontSize: 10, color: t.text, fontFamily: 'monospace', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <DollarSign size={11} />
                      {formatAmount(n.amount, n.currency)}
                    </span>
                  )}
                  {n.type === 'prestamo' && n.capital > 0 && (
                    <span style={{ fontSize: 9, color: t.textMuted }}>
                      Capital: {Number(n.capital).toLocaleString()} {n.currency}
                    </span>
                  )}
                  {n.type === 'servicio' && n.metodo && (
                    <span style={{ fontSize: 9, color: t.textMuted }}>{n.metodo}</span>
                  )}
                  {n.type === 'recordatorio' && n.description && (
                    <span style={{
                      fontSize: 9, color: t.textMuted,
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      maxWidth: 150
                    }}>
                      {n.description}
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                {onNavigate && (
                  <div style={{
                    padding: 8, borderRadius: 10,
                    backgroundColor: isChecked ? 'transparent' : t.accentSoft,
                    color: t.textDim, cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <ExternalLink size={16} />
                  </div>
                )}
              </div>
            </div>
          );
        }) : (
          <div style={{
            padding: '80px 0',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            border: `1px dashed ${t.borderLight}`,
            borderRadius: 14,
            backgroundColor: `${t.panel}80`
          }}>
            <Bell size={48} style={{ color: t.textMuted, marginBottom: 16 }} />
            <p style={{ color: t.textDim, fontSize: 14, margin: 0 }}>No hay notificaciones pendientes.</p>
            <p style={{ color: t.textMuted, fontSize: 11, marginTop: 4 }}>Todo está al día</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
