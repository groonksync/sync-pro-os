import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, Activity, ShoppingBag, History, AlertCircle,
  User, CheckCircle2, Circle, CalendarDays, ChevronRight,
  Cpu, Wallet, Sparkles, RefreshCw, BarChart3, 
  ArrowUpRight, ArrowDownRight, Layers, Target, Clock,
  ArrowDownUp, Info, Eye, RotateCcw, ShieldCheck, Zap,
  Globe, Radio, Fingerprint
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
    const nextDate = new Date(hoy.getFullYear(), hoy.getMonth(), start.getDate());
    if (nextDate < hoy && nextDate.toDateString() !== hoy.toDateString()) nextDate.setMonth(nextDate.getMonth() + 1);
    const diff = Math.ceil((nextDate - hoy) / (1000 * 60 * 60 * 24));
    const isPaidThisMonth = (Array.isArray(p.pagos) ? p.pagos : []).includes(mesActual);
    return { ...p, nextDate, diffDays: diff, isPaidThisMonth };
  }).filter(p => p !== null);

  const cobrosActivos = allCobros.filter(p => !p.isPaidThisMonth && p.diffDays <= 7).sort((a, b) => a.diffDays - b.diffDays);

  return (
    <div className={`animate-in fade-in zoom-in-95 duration-1000 w-full ${isMobile ? 'space-y-6' : 'space-y-12'} pb-32 bg-[#0a0a0c]`}>
      
      {/* HEADER: MISSION CONTROL */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-6">
           <div className="relative">
              <div className="absolute inset-0 bg-blue-500/20 blur-xl animate-pulse rounded-full"></div>
              <div className="relative w-16 h-16 rounded-3xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
                 <Radio size={32} className="animate-pulse" />
              </div>
           </div>
           <div>
              <p className="text-[10px] text-blue-500 font-black uppercase tracking-[0.5em] mb-1">Status: Operational</p>
              <h2 className="text-4xl font-black text-white tracking-tighter uppercase leading-none">Nova Control</h2>
           </div>
        </div>
        <div className="flex gap-4">
           <div className="px-6 py-3 bg-white/[0.03] border border-white/5 rounded-2xl backdrop-blur-xl flex items-center gap-3">
              <Fingerprint size={16} className="text-neutral-500" />
              <p className="text-[10px] text-neutral-400 font-black uppercase tracking-widest">Carlos / Sovereign-01</p>
           </div>
        </div>
      </header>

      {/* CORE KPI: HOLOGRAPHIC TILES */}
      <section className={`grid gap-8 ${isMobile ? 'grid-cols-1' : 'grid-cols-12'}`}>
        
        {/* MAIN CAPITAL (LIQUID BORDER) */}
        <div className={`${isMobile ? '' : 'col-span-7'} relative group`}>
           <div className="absolute -inset-[2px] bg-gradient-to-r from-blue-500 via-emerald-500 to-blue-500 rounded-[3rem] opacity-20 blur-md group-hover:opacity-40 transition-opacity animate-pulse"></div>
           <div className="relative h-full bg-[#111115] rounded-[3rem] p-10 overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-[100px] -mr-32 -mt-32"></div>
              
              <div className="flex justify-between items-start mb-16">
                 <div>
                    <p className="text-[10px] text-neutral-500 font-black uppercase tracking-widest mb-2">Total Capital Asset</p>
                    <h3 className="text-6xl font-black text-white tracking-tighter shadow-blue-500/20 drop-shadow-2xl">
                       {totalCapital.toLocaleString()}<span className="text-xl text-neutral-600 font-medium ml-3">BS</span>
                    </h3>
                 </div>
                 <div className="p-4 bg-white/5 rounded-3xl border border-white/10">
                    <Wallet size={24} className="text-blue-500" />
                 </div>
              </div>

              <div className="grid grid-cols-3 gap-6">
                 {[
                   { label: 'Rendimiento', value: `+${totalInteresMensual}`, color: 'text-emerald-500' },
                   { label: 'Optimización', value: '85%', color: 'text-blue-500' },
                   { label: 'Health', value: 'Elite', color: 'text-amber-500' }
                 ].map(stat => (
                   <div key={stat.label} className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                      <p className="text-[8px] text-neutral-600 font-black uppercase tracking-widest mb-1">{stat.label}</p>
                      <p className={`text-sm font-black uppercase ${stat.color}`}>{stat.value}</p>
                   </div>
                 ))}
              </div>
           </div>
        </div>

        {/* NEURAL STATUS (ORBITAL) */}
        <div className={`${isMobile ? '' : 'col-span-5'} bg-[#111115] border border-white/5 rounded-[3rem] p-10 flex flex-col justify-between relative overflow-hidden group`}>
           <div className="absolute inset-0 bg-blue-500/[0.02] opacity-0 group-hover:opacity-100 transition-opacity"></div>
           <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
                    <Cpu size={24} />
                 </div>
                 <div>
                    <h4 className="text-lg font-black text-white uppercase tracking-tighter">Neural Engine</h4>
                    <p className="text-[9px] text-blue-500 font-bold uppercase tracking-widest">Level 04 Intelligence</p>
                 </div>
              </div>
              <button onClick={fetchAiBalance} className={`p-3 bg-white/5 rounded-xl text-neutral-500 hover:text-white transition-all ${isRefreshing ? 'animate-spin' : ''}`}>
                 <RefreshCw size={18} />
              </button>
           </div>

           <div className="space-y-6">
              <div className="flex justify-between items-end">
                 <div>
                    <p className="text-[9px] text-neutral-500 font-black uppercase tracking-widest mb-1">Sovereign Balance</p>
                    <p className="text-3xl font-mono font-black text-white tracking-tighter">{aiBalance}</p>
                 </div>
                 <div className="text-right">
                    <p className="text-[9px] text-neutral-600 font-black uppercase tracking-widest mb-1">Latency</p>
                    <p className="text-xs font-bold text-blue-400">12ms</p>
                 </div>
              </div>
              <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                 <div className="h-full bg-gradient-to-r from-blue-600 to-emerald-400 w-full animate-pulse shadow-[0_0_15px_rgba(59,130,246,0.5)]"></div>
              </div>
           </div>

           <div className="mt-8 flex gap-3">
              <div className="flex-1 py-3 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center gap-2">
                 <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                 <span className="text-[9px] text-white font-black uppercase tracking-widest">Active Core</span>
              </div>
              <div className="flex-1 py-3 bg-blue-500/10 rounded-2xl border border-blue-500/20 flex items-center justify-center gap-2">
                 <Zap size={12} className="text-blue-500" />
                 <span className="text-[9px] text-blue-500 font-black uppercase tracking-widest">Boosted</span>
              </div>
           </div>
        </div>
      </section>

      {/* TIER 2: PORTFOLIO & EVENTS */}
      <section className={`grid gap-8 ${isMobile ? 'grid-cols-1' : 'grid-cols-12'}`}>
         
         {/* PORTFOLIO (TACTICAL CARDS) */}
         <div className={`${isMobile ? '' : 'col-span-8'} space-y-6`}>
            <div className="flex items-center justify-between px-4">
               <h3 className="text-xs font-black uppercase tracking-[0.3em] text-neutral-500">Asset Portfolio</h3>
               <div className="flex items-center gap-4 text-[9px] font-black uppercase text-neutral-700">
                  <span>Show: Performance</span>
                  <div className="w-px h-3 bg-white/10"></div>
                  <span>Sort: Value</span>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               {listaPrestamos.slice(0, 6).map(p => {
                  const pData = allCobros.find(c => c.id === p.id);
                  const isPaid = pData?.isPaidThisMonth;
                  
                  return (
                    <div key={p.id} onClick={() => onNavigateToPrestamo(p.id)} className="group bg-[#111115] border border-white/5 p-6 rounded-[2.5rem] hover:bg-white/[0.05] transition-all cursor-pointer relative overflow-hidden">
                       <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-20 transition-all -rotate-12 translate-x-4">
                          <TrendingUp size={64} />
                       </div>
                       <div className="flex items-center gap-5 relative z-10">
                          <div className={`w-14 h-14 rounded-full flex items-center justify-center font-black text-lg border-2 ${isPaid ? 'border-emerald-500/20 text-emerald-500' : 'border-amber-500/20 text-amber-500'}`}>
                             {p.nombre.charAt(0)}
                          </div>
                          <div>
                             <h5 className="text-sm font-black text-white uppercase tracking-tight mb-1">{p.nombre}</h5>
                             <div className="flex items-center gap-3">
                                <span className="text-[10px] font-mono font-bold text-neutral-500">{p.capital} BS</span>
                                <span className="w-1 h-1 bg-neutral-700 rounded-full"></span>
                                <span className={`text-[9px] font-black uppercase ${isPaid ? 'text-emerald-500' : 'text-amber-500'}`}>{isPaid ? 'Operational' : 'Pending'}</span>
                             </div>
                          </div>
                       </div>
                    </div>
                  );
               })}
            </div>
         </div>

         {/* EVENT FEED (SIDEBAR) */}
         <div className={`${isMobile ? '' : 'col-span-4'} bg-[#111115] border border-white/5 rounded-[3rem] p-8 flex flex-col`}>
            <div className="flex items-center justify-between mb-10 px-2">
               <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white">Event Stream</h3>
               <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-blue-500"><Globe size={14} className="animate-spin-slow" /></div>
            </div>

            <div className="space-y-6 flex-1">
               {cobrosActivos.slice(0, 4).map(c => (
                  <div key={c.id} className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl hover:bg-white/[0.04] transition-all relative group overflow-hidden">
                     <div className="absolute top-0 left-0 bottom-0 w-1 bg-blue-500 scale-y-0 group-hover:scale-y-100 transition-transform origin-top"></div>
                     <div className="flex justify-between items-start mb-3">
                        <p className="text-[11px] font-black text-white uppercase tracking-tight truncate max-w-[140px]">{c.nombre}</p>
                        <p className="text-[10px] font-mono font-black text-blue-500">+{ (parseFloat(c.capital) * (parseFloat(c.interes) / 100)).toFixed(0) } BS</p>
                     </div>
                     <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                           <Clock size={10} className="text-neutral-600" />
                           <p className="text-[9px] text-neutral-500 font-bold uppercase tracking-widest">In {c.diffDays} Days</p>
                        </div>
                        <button onClick={() => onQuickPayment(c.id)} className="text-[8px] font-black uppercase text-blue-500 hover:text-white transition-colors">Authorize →</button>
                     </div>
                  </div>
               ))}
               {cobrosActivos.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-center py-20">
                     <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mb-4"><ShieldCheck size={24} className="text-neutral-700" /></div>
                     <p className="text-[9px] text-neutral-600 font-black uppercase tracking-[0.3em]">Stream Clear</p>
                  </div>
               )}
            </div>

            <button className="w-full mt-10 py-4 bg-blue-600 text-white font-black uppercase text-[10px] rounded-2xl shadow-[0_0_20px_rgba(37,99,235,0.2)] hover:bg-blue-500 transition-all">
               System Log Full View
            </button>
         </div>

      </section>

    </div>
  );
};

export default CommandCenter;
