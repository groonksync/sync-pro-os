import React from 'react';
import { TrendingUp, LayoutDashboard, Briefcase, Calendar, Clock, Bell, AlertCircle } from 'lucide-react';

const CommandCenter = ({ meetingsList = [], data = { prestamos: [] } }) => {
  // Cálculos financieros
  const totalCapital = data.prestamos.reduce((acc, p) => acc + (parseFloat(p.capital) || 0), 0);
  const totalInteres = data.prestamos.reduce((acc, p) => acc + ((parseFloat(p.capital) || 0) * (parseFloat(p.interes) || 0) / 100), 0);
  const totalPorCobrar = totalCapital + totalInteres;

  // Alertas de Cobro (Préstamos que vencen hoy o pronto)
  const hoy = new Date().toISOString().split('T')[0];
  const proximosCobros = data.prestamos.filter(p => {
    if (!p.fin) return false;
    // Simplificación: Si la fecha contiene el día de hoy o es parecida
    return p.fin.includes(hoy.split('-')[2]) || p.estado === 'Alerta';
  });

  return (
    <div className="animate-in fade-in duration-500 max-w-[1200px]">
      <header className="mb-8 flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-light text-white tracking-tight mb-1">Buenos días.</h2>
          <p className="text-xs text-neutral-500 font-medium">Resumen operativo de hoy.</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-mono text-white font-light">{totalPorCobrar.toLocaleString()} <span className="text-sm text-neutral-500">Bs.</span></p>
          <p className="text-[10px] text-amber-500 tracking-widest uppercase mt-0.5 font-bold">Capital Total Proyectado</p>
        </div>
      </header>

      <div className="grid grid-cols-12 gap-5 mb-8">
        <div className="col-span-8 flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-5">
            <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-5 flex flex-col justify-between hover:bg-white/[0.03] transition-colors">
              <p className="text-[11px] text-neutral-500 uppercase tracking-widest mb-3 flex items-center gap-1.5"><LayoutDashboard size={12}/> Capital Prestado</p>
              <p className="text-3xl font-light text-white">{totalCapital.toLocaleString()} <span className="text-sm text-neutral-600">Bs.</span></p>
            </div>
            <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-5 flex flex-col justify-between hover:bg-white/[0.03] transition-colors">
              <p className="text-[11px] text-neutral-500 uppercase tracking-widest mb-3 flex items-center gap-1.5"><TrendingUp size={12}/> Interés Mensual Generado</p>
              <p className="text-3xl font-light text-amber-500">{totalInteres.toLocaleString()} <span className="text-sm text-amber-600">Bs.</span></p>
            </div>
          </div>

          {/* Sección de Alertas Críticas */}
          <div className="bg-rose-500/5 border border-rose-500/10 rounded-xl p-5">
            <h3 className="text-[11px] text-rose-500 uppercase tracking-widest mb-4 font-bold flex items-center gap-1.5"><Bell size={12}/> Alertas de Cobro Urgente</h3>
            <div className="space-y-3">
              {proximosCobros.length > 0 ? proximosCobros.map(p => (
                <div key={p.id} className="flex items-center justify-between bg-black/40 p-3 rounded-lg border border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500">
                      <AlertCircle size={16} />
                    </div>
                    <div>
                      <p className="text-xs text-white font-bold">{p.nombre}</p>
                      <p className="text-[10px] text-neutral-500">Vence: {p.fin} | Capital: {p.capital} Bs.</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-rose-500 font-bold uppercase">Cobrar Hoy</p>
                  </div>
                </div>
              )) : (
                <p className="text-[10px] text-neutral-600 italic">No hay cobros urgentes programados para hoy.</p>
              )}
            </div>
          </div>
        </div>

        <div className="col-span-4 bg-[#0a0a0a] border border-white/[0.05] rounded-xl p-5 flex flex-col">
           <h3 className="text-[11px] text-amber-500 uppercase tracking-widest mb-4 font-bold flex items-center gap-1.5"><Calendar size={12}/> Agenda de Reuniones</h3>
           <div className="space-y-0 flex-1">
             {meetingsList.length > 0 ? meetingsList.filter(m => m.estado !== 'Finalizado').map(m => (
               <div key={m.id} className="flex gap-3 group cursor-pointer py-2.5 border-b border-white/5 last:border-0 hover:bg-white/[0.01]">
                 <div className="flex flex-col items-center justify-center w-8 h-8 rounded bg-white/[0.02] border border-white/5 shrink-0">
                   <span className="text-[10px] font-bold text-white leading-none">{m.fecha?.split('-')[2] || '??'}</span>
                 </div>
                 <div className="flex-1 flex flex-col justify-center">
                   <p className="text-xs text-white font-medium group-hover:text-amber-500 transition-colors truncate">{m.cliente}</p>
                   <p className="text-[10px] text-neutral-500 flex items-center gap-1 mt-0.5"><Clock size={9}/> {m.estado}</p>
                 </div>
               </div>
             )) : (
               <p className="text-[10px] text-neutral-600 italic">No hay reuniones pendientes.</p>
             )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default CommandCenter;
