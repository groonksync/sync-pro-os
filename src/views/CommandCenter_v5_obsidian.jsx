import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, Activity, ShoppingBag, History, AlertCircle,
  User, CheckCircle2, Circle, CalendarDays, ChevronRight,
  Cpu, Wallet, Sparkles, RefreshCw, BarChart3, 
  ArrowUpRight, ArrowDownRight, Layers, Target, Clock,
  ArrowDownUp, Info, Eye, RotateCcw, ShieldCheck, Zap
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

  // LÓGICA DE DATOS
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

  const cobrosActivos = allCobros.filter(p => !p.isPaidThisMonth && p.diffDays <= 7).sort((a, b) => a.diffDays - b.diffDays);

  return (
    <div className={`animate-in fade-in duration-1000 w-full ${isMobile ? 'space-y-8' : 'space-y-16'} pb-32 bg-[#141414]`}>
      
      {/* SECCIÓN 1: EL CENTRO DE GRAVEDAD (CAPITAL) */}
      <section className="relative flex flex-col items-center justify-center pt-10 pb-20 overflow-hidden">
         <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/[0.03] via-transparent to-transparent"></div>
         
         <div className="relative z-10 text-center space-y-6">
            <div className="flex items-center justify-center gap-3">
               <div className="h-px w-12 bg-gradient-to-r from-transparent to-white/20"></div>
               <p className="text-[10px] text-neutral-500 font-black uppercase tracking-[0.6em]">Sovereign Assets</p>
               <div className="h-px w-12 bg-gradient-to-l from-transparent to-white/20"></div>
            </div>
            
            <div className="relative group">
               {/* REFLEJO ESPEJO */}
               <h2 className="text-6xl md:text-8xl font-black text-white tracking-tighter leading-none transition-all duration-700 group-hover:scale-105">
                  {totalCapital.toLocaleString()}<span className="text-2xl md:text-3xl text-neutral-600 font-medium ml-2">BS</span>
               </h2>
               <h2 className="text-6xl md:text-8xl font-black text-white tracking-tighter leading-none absolute top-full left-0 right-0 opacity-10 select-none pointer-events-none scale-y-[-0.6] blur-sm translate-y-[-10px]">
                  {totalCapital.toLocaleString()}
               </h2>
            </div>

            <div className="flex items-center justify-center gap-8 pt-8">
               <div className="flex flex-col items-center">
                  <p className="text-[9px] text-neutral-500 font-black uppercase tracking-widest mb-1">Crecimiento</p>
                  <p className="text-lg font-mono font-black text-emerald-500">+{totalInteresMensual.toLocaleString()} <span className="text-[10px]">BS</span></p>
               </div>
               <div className="w-px h-8 bg-white/10"></div>
               <div className="flex flex-col items-center">
                  <p className="text-[9px] text-neutral-500 font-black uppercase tracking-widest mb-1">Egresos</p>
                  <p className="text-lg font-mono font-black text-rose-500">-{totalEgresos.toLocaleString()} <span className="text-[10px]">BS</span></p>
               </div>
            </div>
         </div>
      </section>

      {/* SECCIÓN 2: PANELES DE OBSIDIANA (IA & LOGÍSTICA) */}
      <section className={`grid gap-8 ${isMobile ? 'grid-cols-1' : 'grid-cols-12'}`}>
         
         {/* MONITOR NEURAL "OBSIDIAN" */}
         <div className={`${isMobile ? '' : 'col-span-4'} relative group`}>
            <div className="absolute inset-0 bg-blue-500/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative bg-gradient-to-br from-white/[0.05] to-transparent backdrop-blur-3xl border border-white/10 rounded-[3rem] p-8 h-full shadow-2xl">
               <div className="flex justify-between items-start mb-12">
                  <div className="w-14 h-14 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-center text-blue-500">
                     <Cpu size={28} strokeWidth={1.5} />
                  </div>
                  <button onClick={fetchAiBalance} className="p-2 bg-white/5 rounded-xl text-neutral-500 hover:text-white transition-all">
                     <RefreshCw size={16} />
                  </button>
               </div>
               <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">Neural Engine</h3>
               <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-[0.2em] mb-8">Estado de Inteligencia Activa</p>
               
               <div className="space-y-6">
                  <div className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl flex justify-between items-center">
                     <p className="text-xs font-black text-neutral-400 uppercase tracking-widest">{settings.aiProvider === 'deepseek' ? 'DeepSeek' : 'Gemini'}</p>
                     <p className="text-sm font-mono font-black text-white">{aiBalance}</p>
                  </div>
                  <div className="flex items-center gap-4 px-2">
                     <div className="flex-1 h-0.5 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 w-3/4 shadow-[0_0_10px_#3b82f6]"></div>
                     </div>
                     <span className="text-[8px] text-blue-500 font-black uppercase tracking-widest">Optimized</span>
                  </div>
               </div>
            </div>
         </div>

         {/* LISTA DE RENDIMIENTO (OBSIDIAN LIST) */}
         <div className={`${isMobile ? '' : 'col-span-8'} bg-gradient-to-br from-white/[0.05] to-transparent backdrop-blur-3xl border border-white/10 rounded-[3.5rem] p-10 shadow-2xl`}>
            <div className="flex justify-between items-center mb-10">
               <div>
                  <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Portafolio de Activos</h3>
                  <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mt-1">Gestión de capital en circulación</p>
               </div>
               <div className="hidden md:flex gap-4">
                  <div className="px-5 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                     <p className="text-[8px] text-emerald-500 font-black uppercase tracking-widest">Health Index</p>
                     <p className="text-xs font-bold text-white uppercase">Sovereign Elite</p>
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               {listaPrestamos.slice(0, 6).map(p => {
                  const pData = allCobros.find(c => c.id === p.id);
                  const isPaid = pData?.isPaidThisMonth;
                  
                  return (
                     <div key={p.id} onClick={() => onNavigateToPrestamo(p.id)} className="flex items-center justify-between p-6 bg-white/[0.03] border border-white/5 rounded-[2.5rem] hover:bg-white/[0.08] transition-all cursor-pointer group relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="flex items-center gap-4">
                           <div className="w-12 h-12 rounded-2xl bg-neutral-800 border border-white/5 flex items-center justify-center text-neutral-400 group-hover:text-white transition-all">
                              {p.nombre.charAt(0)}
                           </div>
                           <div>
                              <p className="text-xs font-black text-white uppercase tracking-tight">{p.nombre}</p>
                              <p className="text-[9px] text-neutral-600 font-bold uppercase">{p.capital} BS en calle</p>
                           </div>
                        </div>
                        <div className="text-right">
                           <p className="text-base font-mono font-black text-white">{(parseFloat(p.capital) * (parseFloat(p.interes) / 100)).toFixed(0)} BS</p>
                           <p className={`text-[8px] font-black uppercase mt-1 ${isPaid ? 'text-emerald-500' : 'text-amber-500'}`}>
                              {isPaid ? 'Recibido' : 'En espera'}
                           </p>
                        </div>
                     </div>
                  );
               })}
            </div>
         </div>
      </section>

      {/* SECCIÓN 3: AGENDA CRÍTICA & STATUS */}
      <section className={`grid gap-8 ${isMobile ? 'grid-cols-1' : 'grid-cols-12'}`}>
         
         {/* AGENDA DE COBROS */}
         <div className={`${isMobile ? '' : 'col-span-7'} bg-white/[0.02] border border-white/5 rounded-[3rem] p-10`}>
            <h3 className="text-sm font-black uppercase tracking-[0.3em] text-neutral-500 mb-10 flex items-center gap-4">
               <CalendarDays size={18} /> Cronograma Crítico
            </h3>
            
            <div className="space-y-4">
               {cobrosActivos.slice(0, 4).map(c => (
                  <div key={c.id} className="flex items-center justify-between p-6 bg-white/[0.01] border border-white/5 rounded-[2rem] group hover:border-rose-500/30 transition-all">
                     <div className="flex items-center gap-6">
                        <div className="text-center">
                           <p className="text-lg font-black text-white leading-none">{new Date(c.nextDate).getDate()}</p>
                           <p className="text-[8px] text-neutral-600 font-bold uppercase">{new Date(c.nextDate).toLocaleString('es-ES', { month: 'short' })}</p>
                        </div>
                        <div>
                           <p className="text-sm font-black text-white uppercase">{c.nombre}</p>
                           <p className="text-[10px] text-rose-500 font-bold uppercase tracking-widest">Vence en {c.diffDays} días</p>
                        </div>
                     </div>
                     <button onClick={() => onQuickPayment(c.id)} className="w-12 h-12 rounded-2xl bg-white/5 text-neutral-700 hover:bg-emerald-500 hover:text-black transition-all flex items-center justify-center border border-white/5">
                        <CheckCircle2 size={24} />
                     </button>
                  </div>
               ))}
               {cobrosActivos.length === 0 && (
                  <div className="py-20 text-center border border-dashed border-white/10 rounded-[2.5rem]">
                     <p className="text-neutral-700 text-[10px] font-black uppercase tracking-[0.4em]">Agenda de cobros despejada</p>
                  </div>
               )}
            </div>
         </div>

         {/* INDICADORES RÁPIDOS */}
         <div className={`${isMobile ? '' : 'col-span-5'} grid grid-cols-2 gap-6`}>
            {[
               { label: 'Seguridad', icon: ShieldCheck, value: 'Activa', color: 'text-emerald-500', bg: 'bg-emerald-500/5' },
               { label: 'Servicios', icon: ShoppingBag, value: listaServicios.length, color: 'text-rose-500', bg: 'bg-rose-500/5' },
               { label: 'Logística', icon: Layers, value: 'En Orden', color: 'text-blue-500', bg: 'bg-blue-500/5' },
               { label: 'Priority', icon: Zap, value: 'Alta', color: 'text-amber-500', bg: 'bg-amber-500/5' }
            ].map(item => (
               <div key={item.label} className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-8 flex flex-col items-center justify-center text-center group hover:bg-white/5 transition-all">
                  <div className={`w-12 h-12 ${item.bg} ${item.color} rounded-2xl flex items-center justify-center mb-4 transition-all group-hover:scale-110`}>
                     <item.icon size={24} strokeWidth={1.5} />
                  </div>
                  <p className="text-[9px] text-neutral-500 font-black uppercase tracking-widest mb-1">{item.label}</p>
                  <p className="text-xs font-bold text-white uppercase">{item.value}</p>
               </div>
            ))}
         </div>

      </section>

    </div>
  );
};

export default CommandCenter;
