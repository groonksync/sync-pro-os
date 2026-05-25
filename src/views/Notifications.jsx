import React, { useMemo } from 'react';
import { Bell, Calendar, ChevronRight, DollarSign, Clock, AlertCircle, TrendingUp } from 'lucide-react';
import { getTheme } from '../lib/theme';

const Notifications = ({ data, isDark = true }) => {
  const t = useMemo(() => getTheme(isDark), [isDark]);
  const today = new Date();
  
  // Filtrar préstamos con pagos próximos o vencidos basándose en ciclos de 30 días
  const notifications = data.prestamos.map(p => {
    if (!p.inicio) return null;
    
    const startDate = new Date(p.inicio);
    const billingDay = startDate.getDate();
    let nextBillingDate = new Date(today.getFullYear(), today.getMonth(), billingDay);
    
    if (nextBillingDate < today && nextBillingDate.toDateString() !== today.toDateString()) {
      nextBillingDate = new Date(today.getFullYear(), today.getMonth() + 1, billingDay);
    }

    const diffTime = nextBillingDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 7 && diffDays >= 0) {
      return {
        ...p,
        nextBillingDate,
        diffDays,
        interestAmount: (p.capital * (p.interes / 100)).toFixed(2),
        type: diffDays === 0 ? 'today' : 'upcoming'
      };
    }
    
    return null;
  }).filter(Boolean).sort((a, b) => a.diffDays - b.diffDays);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
      <header style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: t.text, letterSpacing: '-0.02em', margin: 0 }}>Notificaciones de Cobro</h2>
        <p style={{ fontSize: '0.75rem', color: t.textDim, marginTop: '4px', fontWeight: 500 }}>Seguimiento de vencimientos (Ciclos de 30 días)</p>
      </header>

      <div style={{ display: 'grid', gap: 16 }}>
        {notifications.length > 0 ? (
          notifications.map(n => (
            <div key={n.id}
              style={{
                padding: 20,
                borderRadius: 14,
                border: `1px solid ${n.type === 'today' ? t.accent : t.border}`,
                backgroundColor: n.type === 'today' ? `${t.accent}15` : t.panel,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'all 0.3s'
              }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                <div style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: n.type === 'today' ? t.accent : t.accentSoft,
                  color: n.type === 'today' ? '#000' : t.textDim
                }}>
                  {n.type === 'today' ? <AlertCircle size={24} /> : <Calendar size={20} />}
                </div>
                
                <div>
                  <h4 style={{ color: t.text, fontWeight: 500, fontSize: '1.125rem', margin: 0 }}>{n.nombre}</h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 4 }}>
                    <span style={{ fontSize: 10, color: t.success, display: 'flex', alignItems: 'center', gap: 6, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
                      <TrendingUp size={12} /> Cobrar Interés: {n.interestAmount} {n.moneda || 'BOB'}
                    </span>
                    <span style={{ fontSize: 10, color: t.textDim, display: 'flex', alignItems: 'center', gap: 6, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
                      <Clock size={12} /> Próximo cobro: {n.nextBillingDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: 24 }}>
                <div>
                  <p style={{
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    marginBottom: 4,
                    color: n.type === 'today' ? t.accent : t.textDim
                  }}>
                    {n.type === 'today' ? 'Vence Hoy' : `En ${n.diffDays} días`}
                  </p>
                  <p style={{ fontSize: 12, color: t.textMuted, fontFamily: 'monospace', margin: 0 }}>
                    {n.nextBillingDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}
                  </p>
                </div>
                <div style={{
                  padding: 8,
                  borderRadius: 12,
                  backgroundColor: t.accentSoft,
                  color: t.textDim,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}>
                  <ChevronRight size={20} />
                </div>
              </div>
            </div>
          ))
        ) : (
          <div style={{
            padding: '80px 0',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            border: `1px dashed ${t.borderLight}`,
            borderRadius: 14,
            backgroundColor: `${t.panel}80`
          }}>
            <Bell size={48} style={{ color: t.textMuted, marginBottom: 16 }} />
            <p style={{ color: t.textDim, fontSize: 14, margin: 0 }}>No hay cobros pendientes para los próximos días.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
