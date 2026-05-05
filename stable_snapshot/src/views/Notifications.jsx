import React from 'react';
import { Bell, Calendar, ChevronRight, DollarSign, Clock, AlertCircle, TrendingUp } from 'lucide-react';

const Notifications = ({ data }) => {
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
    <div className="flex flex-col h-full max-w-[1000px] w-full animate-in fade-in duration-500">
      <header className="mb-8">
        <h2 className="text-3xl font-light text-white tracking-tight flex items-center gap-3">
          <Bell className="text-neutral-400" size={28} /> Notificaciones de Cobro
        </h2>
        <p className="text-[11px] text-neutral-500 uppercase tracking-widest mt-1">Seguimiento de vencimientos (Ciclos de 30 días)</p>
      </header>

      <div className="grid gap-4">
        {notifications.length > 0 ? (
          notifications.map(n => (
            <div key={n.id} className={`p-5 rounded-xl border flex items-center justify-between group transition-all duration-300 ${
              n.type === 'today' 
                ? 'bg-white/10 border-white/20' 
                : 'bg-[#0a0a0a] border-white/[0.05] hover:border-white/10'
            }`}>
              <div className="flex items-center gap-5">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  n.type === 'today' ? 'bg-white text-black' : 'bg-white/5 text-neutral-400'
                }`}>
                  {n.type === 'today' ? <AlertCircle size={24} /> : <Calendar size={20} />}
                </div>
                
                <div>
                  <h4 className="text-white font-medium text-lg">{n.nombre}</h4>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="text-[10px] text-emerald-400 flex items-center gap-1.5 uppercase tracking-wider font-bold">
                      <TrendingUp size={12} /> Cobrar Interés: {n.interestAmount} {n.moneda || 'BOB'}
                    </span>
                    <span className="text-[10px] text-neutral-500 flex items-center gap-1.5 uppercase tracking-wider font-bold">
                      <Clock size={12} /> Próximo cobro: {n.nextBillingDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-right flex items-center gap-6">
                <div>
                  <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${
                    n.type === 'today' ? 'text-white' : 'text-neutral-500'
                  }`}>
                    {n.type === 'today' ? 'Vence Hoy' : `En ${n.diffDays} días`}
                  </p>
                  <p className="text-xs text-neutral-400 font-mono">
                    {n.nextBillingDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}
                  </p>
                </div>
                <div className="p-2 rounded-full bg-white/5 text-neutral-500 group-hover:text-white group-hover:bg-white/10 transition-all cursor-pointer">
                  <ChevronRight size={20} />
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="py-20 flex flex-col items-center justify-center border border-dashed border-white/10 rounded-2xl bg-white/[0.01]">
            <Bell size={48} className="text-neutral-800 mb-4" />
            <p className="text-neutral-500 text-sm">No hay cobros pendientes para los próximos días.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
