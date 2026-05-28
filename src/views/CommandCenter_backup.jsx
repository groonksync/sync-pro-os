import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, Activity, ShoppingBag, History, AlertCircle,
  User, CheckCircle2, Circle, CalendarDays, ChevronRight,
  Cpu, Wallet, Sparkles, RefreshCw
} from 'lucide-react';
import { aiService } from '../services/aiService';

const CommandCenter = ({ meetingsList = [], data = { prestamos: [] }, servicios = [], settings, onNavigateToPrestamo, onQuickPayment }) => {
  const hoy = new Date();
  const mesActual = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;
  const isMobile = settings?.isMobileMode;
  
  const [aiBalance, setAiBalance] = useState('...');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchAiBalance = async () => {
    setIsRefreshing(true);
    const balance = await aiService.fetchBalance(settings);
    setAiBalance(balance);
    setIsRefreshing(false);
  };

  useEffect(() => {
    fetchAiBalance();
  }, [settings.aiProvider, settings.deepseekKey]);

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

    const monthsSinceStart = (hoy.getFullYear() - start.getFullYear()) * 12 + (hoy.getMonth() - start.getMonth());
    const actualPayments = (Array.isArray(p.pagos) ? p.pagos : []).length;
    
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
    <div className={`animate-in fade-in duration-500 w-full ${isMobile ? 'space-y-6' : 'space-y-8'}`}>
      
      {/* HEADER ADAPTATIVO CON MONITOR DE IA */}
      <header className={`grid ${isMobile ? 'grid-cols-1 gap-6' : 'grid-cols-3 gap-8'} items-start`}>
        <div className={isMobile ? 'text-center space-y-2' : 'col-span-1'}>
          <h2 className={`font-black tracking-tighter uppercase ${isMobile ? 'text-3xl' : 'text-4xl'}`}>Principal</h2>
          <p className="text-[10px] text-neutral-500 font-black uppercase tracking-[0.4em] flex items-center justify-center md:justify-start gap-2">
            <Activity size={14} className="text-emerald-500" /> Centro de Control Activo
          </p>
        </div>

        {/* MONITOR NEURAL ULTRA-PROFESIONAL */}
        <div className={`col-span-1 group relative`}>
           <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent rounded-[2rem] blur-xl opacity-50 group-hover:opacity-100 transition-opacity"></div>
           <div className={`relative bg-neutral-900/60 backdrop-blur-xl border border-white/10 rounded-[2rem] p-5 shadow-2xl overflow-hidden`}>
              {/* Micro-líneas de diseño estilo chip */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full -mr-12 -mt-12 blur-2xl"></div>
              
              <div className="flex items-center justify-between mb-4">
                 <div className="flex items-center gap-3">
                    <div className="relative">
                       <div className="absolute inset-0 bg-blue-500/20 blur-md animate-pulse rounded-lg"></div>
                       <div className="relative p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400">
                          <Cpu size={16} strokeWidth={2.5} />
                       </div>
                    </div>
                    <div>
                       <p className="text-[8px] text-neutral-500 font-black uppercase tracking-[0.2em] mb-0.5">Neural Engine</p>
                       <h4 className="text-[10px] font-black text-white uppercase tracking-tight flex items-center gap-2">
                          {settings.aiProvider === 'deepseek' ? 'DeepSeek-V3' : 'Gemini-1.5'}
                          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                       </h4>
                    </div>
                 </div>
                 <button onClick={fetchAiBalance} className={`p-2 hover:bg-white/5 rounded-xl transition-all ${isRefreshing ? 'animate-spin' : ''}`}>
                    <RefreshCw size={12} className="text-neutral-500" />
                 </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="p-3 bg-white/[0.02] border border-white/5 rounded-2xl">
                    <p className="text-[7px] text-neutral-600 font-black uppercase tracking-widest mb-1">Balance</p>
                    <div className="flex items-baseline gap-1">
                       <span className="text-lg font-mono font-black text-white leading-none">{aiBalance}</span>
                       <span className="text-[8px] text-neutral-500 font-bold">{settings.aiProvider === 'deepseek' ? 'USD' : 'INF'}</span>
                    </div>
                 </div>
                 <div className="p-3 bg-white/[0.02] border border-white/5 rounded-2xl flex flex-col justify-center">
                    <p className="text-[7px] text-neutral-600 font-black uppercase tracking-widest mb-1">Status</p>
                    <div className="flex items-center gap-2">
                       <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 w-full shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                       </div>
                       <span className="text-[8px] text-emerald-500 font-black uppercase">Active</span>
                    </div>
                 </div>
              </div>
           </div>
        </div>

        <div className={`col-span-1 flex ${isMobile ? 'flex-col w-full gap-4' : 'gap-6 justify-end'}`}>
           <div className={`${isMobile ? 'bg-white/5 p-4 rounded-2xl border border-white/5' : 'text-right'}`}>
            <p className={`${isMobile ? 'text-xl' : 'text-2xl'} font-mono font-black tracking-tighter leading-none text-white`}>
              {totalCapital.toLocaleString()} <span className="text-xs opacity-40 uppercase font-sans font-normal">Bs.</span>
            </p>
            <p className="text-[9px] text-neutral-500 tracking-widest uppercase mt-2 font-black">Capital Calle</p>
          </div>
          <div className={`${isMobile ? 'bg-rose-500/5 p-4 rounded-2xl border border-rose-500/10' : 'text-right border-l border-white/10 pl-6'}`}>
            <p className={`${isMobile ? 'text-xl' : 'text-2xl'} font-mono text-rose-500 font-black tracking-tighter leading-none`}>
              {totalEgresos.toLocaleString()} <span className="text-xs opacity-40 uppercase font-sans font-normal">Bs.</span>
            </p>
            <p className="text-[9px] text-rose-500/50 tracking-widest uppercase mt-2 font-black">Egresos Mes</p>
          </div>
        </div>
      </header>

      {/* DEUDORES CRÓNICOS */}
      {deudoresCronicos.length > 0 && (
        <div className={`p-6 md:p-8 bg-rose-500/5 border border-rose-500/10 rounded-[2rem] md:rounded-[32px] shadow-2xl relative overflow-hidden`}>
           <div className="flex items-center gap-4 mb-6">
              <History size={20} className="text-rose-500" />
              <h3 className="text-sm md:text-base font-black uppercase tracking-[0.2em]">Pagos Faltantes / Deudores</h3>
           </div>
           <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-2 lg:grid-cols-4'}`}>
              {deudoresCronicos.map(p => (
                <div key={p.id} onClick={() => onNavigateToPrestamo(p.id)} className="bg-black/20 border border-white/5 p-5 rounded-2xl flex justify-between items-center group hover:border-rose-500/50 transition-all cursor-pointer">
                    <div>
                       <p className="text-xs font-black uppercase tracking-tight">{p.nombre}</p>
                       <div className="px-2.5 py-1 bg-rose-500 text-white text-[8px] font-black rounded-lg uppercase w-max tracking-widest mt-1">
                          Debe {p.debtMonths} {p.debtMonths === 1 ? 'Mes' : 'Meses'}
                       </div>
                    </div>
                    <ChevronRight size={18} className="text-neutral-700 group-hover:text-white transition-colors" />
                </div>
              ))}
           </div>
        </div>
      )}

      {/* COBROS PENDIENTES */}
      {alertasUrgentes.length > 0 && (
        <div className="p-6 md:p-8 bg-black/20 border border-white/5 rounded-[2rem] md:rounded-[32px] shadow-2xl">
           <div className="flex items-center justify-between mb-8">
              <h3 className="text-sm md:text-base font-black uppercase tracking-[0.3em] flex items-center gap-4">
                <AlertCircle size={22} className="text-rose-500" /> Cobros Pendientes
              </h3>
           </div>
           <div className={`grid gap-6 ${isMobile ? 'grid-cols-1' : 'grid-cols-2 lg:grid-cols-3'}`}>
              {alertasUrgentes.map(p => (
                <div key={p.id} className="bg-black/40 border border-white/5 p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] flex flex-col gap-6">
                   <div>
                      <p className="text-base font-black uppercase">{p.nombre}</p>
                      <p className="text-[10px] text-rose-500 font-black uppercase tracking-[0.2em] mt-1">Vence {p.nextDate.toLocaleDateString()}</p>
                   </div>
                   <div className="flex justify-between items-center mt-2 pt-6 border-t border-white/5">
                      <p className="text-2xl font-mono font-black tracking-tighter text-white">
                        {(parseFloat(p.capital) * (parseFloat(p.interes) / 100)).toFixed(2)} <span className="text-[10px] opacity-20">BS.</span>
                      </p>
                      <button onClick={() => onQuickPayment(p.id)} className="w-12 h-12 rounded-2xl bg-white/5 text-white flex items-center justify-center hover:bg-rose-500 transition-all shadow-xl active:scale-90 border border-white/5">
                        <CheckCircle2 size={24} />
                      </button>
                   </div>
                </div>
              ))}
           </div>
        </div>
      )}

      {/* DASHBOARD PRINCIPAL */}
      <div className={`grid gap-6 md:gap-8 ${isMobile ? 'grid-cols-1' : 'grid-cols-12'}`}>
        
        {/* COLUMNA IZQUIERDA (INTERÉS Y EGRESOS) */}
        <div className={`${isMobile ? '' : 'col-span-4'} space-y-6 md:space-y-8`}>
          <div className="bg-black/20 border border-white/5 rounded-[2rem] md:rounded-[32px] p-8 shadow-xl">
             <div className="flex items-center gap-3 mb-6 text-neutral-500">
               <TrendingUp size={18}/>
               <h3 className="text-[10px] font-black uppercase tracking-[0.3em]">Interés Mensual</h3>
             </div>
             <p className="text-3xl font-mono text-emerald-500 font-black tracking-tighter">+{totalInteresMensual.toLocaleString()} <span className="text-[10px] opacity-20 font-sans">BS.</span></p>
          </div>

          <div className="bg-black/20 border border-white/5 rounded-[2rem] md:rounded-[32px] p-8 shadow-xl">
            <h3 className="text-[10px] text-neutral-500 uppercase tracking-[0.3em] mb-6 font-black flex items-center gap-2"><ShoppingBag size={14}/> Mis Egresos</h3>
            <div className="space-y-4">
              {proximosServicios.slice(0, 4).map(s => (
                <div key={s.id} className="p-5 bg-white/5 border border-white/5 rounded-2xl flex justify-between items-center hover:bg-white/10 transition-all">
                  <p className="text-xs font-black uppercase tracking-tight">{s.nombre}</p>
                  <p className="text-sm font-mono text-rose-500 font-black">{s.monto} <span className="text-[9px] opacity-30">BS.</span></p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA (COBROS SEMANA) */}
        <div className={`${isMobile ? '' : 'col-span-8'} bg-black/20 border border-white/5 rounded-[2rem] md:rounded-[32px] p-6 md:p-10 shadow-2xl`}>
          <div className="mb-10 flex flex-col md:flex-row md:justify-between md:items-center gap-2">
            <h3 className="text-xl md:text-2xl font-black uppercase tracking-tighter text-white">Cobros de la Semana</h3>
            <p className="text-[10px] text-neutral-600 uppercase font-black tracking-[0.3em]">Ventana de Cobro: Activa</p>
          </div>

          <div className="space-y-4">
            {cobrosActivos.length > 0 ? cobrosActivos.map(p => (
              <div key={p.id} className={`flex ${isMobile ? 'flex-col gap-6' : 'items-center justify-between'} p-6 rounded-[2rem] border border-white/5 bg-white/5 hover:bg-white/10 transition-all group relative`}>
                <div className="flex items-center gap-6 flex-1">
                  <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-neutral-500 border border-white/5 shrink-0"><User size={28}/></div>
                  <div>
                    <h4 className="text-base md:text-lg font-black uppercase tracking-tight text-white">{p.nombre}</h4>
                    <p className="text-[10px] md:text-[11px] text-rose-500 font-black uppercase tracking-[0.2em] mt-1.5 flex items-center gap-2 opacity-80">
                       <CalendarDays size={14}/> Cobrar el {p.nextDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}
                    </p>
                  </div>
                </div>
                <div className={`flex items-center ${isMobile ? 'justify-between pt-6 border-t border-white/5' : 'gap-12'}`}>
                  <p className="text-xl md:text-2xl font-mono font-black tracking-tighter text-white">{(parseFloat(p.capital) * (parseFloat(p.interes) / 100)).toFixed(2)} <span className="text-xs opacity-20">BS.</span></p>
                  <button onClick={() => onQuickPayment(p.id)} className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-white/5 text-neutral-700 hover:bg-emerald-500 hover:text-black transition-all shadow-xl flex items-center justify-center border border-white/5 active:scale-90">
                    <CheckCircle2 size={28} />
                  </button>
                </div>
              </div>
            )) : (
              <div className="py-10 text-center border border-dashed border-white/10 rounded-[2rem]">
                 <p className="text-neutral-600 text-[10px] italic font-black uppercase tracking-widest">No hay cobros para los próximos 3 días.</p>
              </div>
            )}

            {liquidados.length > 0 && !isMobile && (
              <div className="mt-12 pt-8 border-t border-white/5">
                <p className="text-[9px] text-neutral-600 font-black uppercase tracking-[0.3em] mb-6">Cobros Liquidados</p>
                <div className="space-y-4 opacity-40">
                  {liquidados.map(p => (
                    <div key={p.id} className="flex items-center justify-between p-5 rounded-[1.5rem] border border-emerald-500/10 bg-emerald-500/5">
                       <div className="flex items-center gap-4">
                          <CheckCircle2 size={18} className="text-emerald-500" />
                          <div>
                             <p className="text-xs font-black uppercase">{p.nombre}</p>
                             <p className="text-[9px] text-neutral-500 font-bold uppercase tracking-widest">Reinicio: {p.nextDate.toLocaleDateString()}</p>
                          </div>
                       </div>
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
