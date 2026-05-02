import React from 'react';
import { 
  TrendingUp, LayoutDashboard, Calendar, Clock, Bell, AlertCircle, 
  User, DollarSign, ChevronRight, CreditCard, Activity, ShoppingBag,
  CheckCircle2, Circle, AlertTriangle, CalendarDays, History
} from 'lucide-react';

const CommandCenter = ({ meetingsList = [], data = { prestamos: [] }, servicios = [], onNavigateToPrestamo, onQuickPayment }) => {
  const hoy = new Date();
  const mesActual = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;
  
  const listaPrestamos = Array.isArray(data?.prestamos) ? data.prestamos.filter(p => p && p.id) : [];

  const totalCapital = listaPrestamos.reduce((acc, p) => acc + (parseFloat(p?.capital) || 0), 0);
  const totalInteresMensual = listaPrestamos.reduce((acc, p) => {
    const cap = parseFloat(p?.capital) || 0;
    const int = parseFloat(p?.interes) || 0;
    return acc + (cap * (int / 100));
  }, 0);

  const listaServicios = Array.isArray(servicios) ? servicios.filter(s => s && s.id) : [];
  const totalEgresos = listaServicios.reduce((acc, s) => acc + (parseFloat(s?.monto) || 0), 0);

  const allCobros = listaPrestamos.map(p => {
    if (!p?.inicio) return null;
    const start = new Date(p.inicio);
    if (isNaN(start.getTime())) return null;

    // Cálculo de meses debidos
    const monthsSinceStart = (hoy.getFullYear() - start.getFullYear()) * 12 + (hoy.getMonth() - start.getMonth());
    const expectedPayments = monthsSinceStart; // No contamos el mes actual si aún no ha llegado el día
    const actualPayments = (Array.isArray(p.pagos) ? p.pagos : []).length;
    
    // Si hoy ya pasó su día de cobro, debería tener un pago más
    const billingDay = start.getDate();
    const thisMonthBillingDate = new Date(hoy.getFullYear(), hoy.getMonth(), billingDay);
    const hasPassedBillingDay = hoy >= thisMonthBillingDate;
    
    const totalExpected = hasPassedBillingDay ? monthsSinceStart + 1 : monthsSinceStart;
    const debtMonths = Math.max(0, totalExpected - actualPayments);

    let nextDate = new Date(hoy.getFullYear(), hoy.getMonth(), billingDay);
    if (nextDate < hoy && nextDate.toDateString() !== hoy.toDateString()) {
      nextDate = new Date(hoy.getFullYear(), hoy.getMonth() + 1, billingDay);
    }
    
    const diff = Math.ceil((nextDate - hoy) / (1000 * 60 * 60 * 24));
    const isPaidThisMonth = (Array.isArray(p.pagos) ? p.pagos : []).includes(mesActual);
    
    return { ...p, nextDate, diffDays: diff, isPaidThisMonth, debtMonths };
  }).filter(p => p !== null);

  const alertasUrgentes = allCobros.filter(p => p.diffDays >= 0 && p.diffDays <= 7 && !p.isPaidThisMonth);
  const deudoresCronicos = allCobros.filter(p => p.debtMonths > 0);
  const cobrosActivos = allCobros.filter(p => !p.isPaidThisMonth && p.diffDays <= 3).sort((a, b) => a.diffDays - b.diffDays);
  const liquidados = allCobros.filter(p => p.isPaidThisMonth);

  const proximosServicios = [...listaServicios].sort((a, b) => new Date(a.fecha_pago) - new Date(b.fecha_pago));

  return (
    <div className="animate-in fade-in duration-500 max-w-[1200px] w-full">
      <header className="mb-6 flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight mb-2 uppercase underline decoration-purple-500/30 underline-offset-8">Centro de Control <span className="text-purple-500">PRO MAX</span></h2>
          <p className="text-[10px] text-neutral-600 font-bold uppercase tracking-[0.3em] flex items-center gap-2">
            <Activity size={14} /> Gestión de Capital Sovereign OS
          </p>
        </div>
        <div className="flex gap-6">
           <div className="text-right">
            <p className="text-2xl font-mono text-white font-bold tracking-tighter">{totalCapital.toLocaleString()} <span className="text-xs text-neutral-600 uppercase">Bs.</span></p>
            <p className="text-[10px] text-neutral-500 tracking-widest uppercase mt-1 font-bold">Capital en Calle</p>
          </div>
          <div className="text-right border-l border-white/10 pl-6">
            <p className="text-2xl font-mono text-rose-500 font-bold tracking-tighter">{totalEgresos.toLocaleString()} <span className="text-xs text-rose-900 uppercase">Bs.</span></p>
            <p className="text-[10px] text-rose-500/50 tracking-widest uppercase mt-1 font-bold">Egresos Mensuales</p>
          </div>
        </div>
      </header>

      {/* SECCIÓN DE DEUDORES CRÓNICOS */}
      {deudoresCronicos.length > 0 && (
        <div className="mb-6 p-6 bg-rose-500/5 border border-rose-500/20 rounded-[28px] shadow-xl relative overflow-hidden">
           <div className="flex items-center gap-4 mb-4">
              <History size={20} className="text-rose-500" />
              <h3 className="text-base font-black text-white uppercase tracking-[0.2em]">Pagos Faltantes / Deudores</h3>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {deudoresCronicos.map(p => (
                <div key={p.id} onClick={() => onNavigateToPrestamo(p.id)} className="bg-black/40 border border-white/5 p-5 rounded-2xl flex justify-between items-center group hover:border-rose-500/50 transition-all cursor-pointer">
                   <div>
                      <p className="text-xs font-bold text-white mb-1">{p.nombre}</p>
                      <div className="px-2 py-0.5 bg-rose-500 text-white text-[8px] font-black rounded-full uppercase w-max">
                         Debe {p.debtMonths} {p.debtMonths === 1 ? 'Mes' : 'Meses'}
                      </div>
                   </div>
                   <ChevronRight size={16} className="text-neutral-700 group-hover:text-white" />
                </div>
              ))}
           </div>
        </div>
      )}

      {alertasUrgentes.length > 0 && (
        <div className="mb-6 p-6 bg-neutral-900/40 border border-white/10 rounded-[28px] shadow-2xl relative overflow-hidden">
           <div className="flex items-center justify-between mb-6">
              <h3 className="text-base font-black text-white uppercase tracking-[0.3em] flex items-center gap-3">
                <AlertCircle size={20} className="text-rose-500" /> Cobros Pendientes
              </h3>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {alertasUrgentes.map(p => (
                <div key={p.id} className="bg-black/60 border border-white/5 p-6 rounded-3xl flex flex-col gap-4">
                   <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-bold text-white mb-1">{p.nombre}</p>
                        <p className="text-[10px] text-rose-500 font-black uppercase tracking-widest">Vence {p.nextDate.toLocaleDateString()}</p>
                      </div>
                   </div>
                   <div className="flex justify-between items-center mt-2 pt-4 border-t border-white/5">
                      <p className="text-lg font-mono text-white font-black">{(parseFloat(p.capital) * (parseFloat(p.interes) / 100)).toFixed(2)} Bs.</p>
                      <button onClick={() => onQuickPayment(p.id)} className="w-10 h-10 rounded-xl bg-white/5 text-white flex items-center justify-center hover:bg-rose-500 transition-all"><CheckCircle2 size={20} /></button>
                   </div>
                </div>
              ))}
           </div>
        </div>
      )}

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <div className="bg-[#0a0a0a] border border-white/[0.05] rounded-[28px] p-6 shadow-xl">
             <div className="flex items-center gap-3 mb-4 text-neutral-500">
               <TrendingUp size={16}/>
               <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">Interés Mensual</h3>
             </div>
             <p className="text-2xl font-mono text-emerald-400 font-black">+{totalInteresMensual.toLocaleString()} <span className="text-[10px] font-sans opacity-50">Bs.</span></p>
          </div>

          <div className="bg-[#0a0a0a] border border-white/[0.05] rounded-[28px] p-6 shadow-xl">
            <h3 className="text-[10px] text-neutral-500 uppercase tracking-[0.2em] mb-4 font-black flex items-center gap-2"><ShoppingBag size={14}/> Mis Egresos</h3>
            <div className="space-y-4">
              {proximosServicios.slice(0, 4).map(s => (
                <div key={s.id} className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl flex justify-between items-center">
                  <p className="text-xs text-white font-bold">{s.nombre}</p>
                  <p className="text-xs font-mono text-rose-500 font-bold">{s.monto} Bs.</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-8 bg-[#0a0a0a] border border-white/[0.05] rounded-[28px] p-8 shadow-2xl">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-white tracking-tight">Cobros de la Semana</h3>
            <p className="text-[10px] text-neutral-600 uppercase font-bold tracking-[0.2em] mt-1">Ventana de Cobro: 3 Días</p>
          </div>

          <div className="space-y-4">
            {cobrosActivos.length > 0 ? cobrosActivos.map(p => (
              <div key={p.id} className="flex items-center justify-between p-5 rounded-[24px] border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all">
                <div className="flex items-center gap-5 flex-1">
                  <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-neutral-500"><User size={24}/></div>
                  <div>
                    <h4 className="text-base font-bold text-white">{p.nombre}</h4>
                    <p className="text-[10px] text-rose-500 font-black uppercase tracking-widest mt-1 flex items-center gap-2">
                       <CalendarDays size={12}/> Cobrar el {p.nextDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-10">
                  <p className="text-xl font-mono font-black text-white">{(parseFloat(p.capital) * (parseFloat(p.interes) / 100)).toFixed(2)} Bs.</p>
                  <button onClick={() => onQuickPayment(p.id)} className="w-14 h-14 rounded-2xl bg-white/5 text-neutral-600 hover:bg-white hover:text-black transition-all shadow-xl">
                    <Circle size={24} />
                  </button>
                </div>
              </div>
            )) : (
              <div className="py-10 text-center border border-dashed border-white/5 rounded-3xl">
                 <p className="text-neutral-600 text-xs italic">No hay cobros para los próximos 3 días.</p>
              </div>
            )}

            {liquidados.length > 0 && (
              <div className="mt-12 pt-8 border-t border-white/5">
                <p className="text-[9px] text-neutral-600 font-black uppercase tracking-[0.3em] mb-6">Cobros Liquidados</p>
                <div className="space-y-4 opacity-40">
                  {liquidados.map(p => (
                    <div key={p.id} className="flex items-center justify-between p-5 rounded-[24px] border border-emerald-500/10 bg-emerald-500/[0.02]">
                       <div className="flex items-center gap-4">
                          <CheckCircle2 size={18} className="text-emerald-500" />
                          <div>
                             <p className="text-sm font-bold text-white">{p.nombre}</p>
                             <p className="text-[9px] text-neutral-500 font-bold uppercase">Reinicio: {p.nextDate.toLocaleDateString()}</p>
                          </div>
                       </div>
                       <button onClick={() => onQuickPayment(p.id)} className="text-emerald-500 p-2"><CheckCircle2 size={20}/></button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommandCenter;
