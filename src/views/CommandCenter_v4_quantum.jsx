import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, Activity, ShoppingBag, History, AlertCircle,
  User, CheckCircle2, Circle, CalendarDays, ChevronRight,
  Cpu, Wallet, Sparkles, RefreshCw, BarChart3, 
  ArrowUpRight, ArrowDownRight, Layers, Target, Clock,
  ArrowDownUp, Info, Eye, RotateCcw
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

  // COMPONENTE: NEON WAVE CHART
  const NeonWave = ({ color = "#3b82f6", data = [20, 45, 28, 80, 50, 90] }) => {
    const points = data.map((d, i) => `${(i * 100) / (data.length - 1)},${100 - d}`).join(' ');
    const lastPoint = { x: 100, y: 100 - data[data.length - 1] };

    return (
      <svg viewBox="0 0 100 100" className="w-full h-full preserve-3d" preserveAspectRatio="none">
        <defs>
          <linearGradient id={`grad-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{ stopColor: color, stopOpacity: 0.2 }} />
            <stop offset="100%" style={{ stopColor: color, stopOpacity: 0 }} />
          </linearGradient>
        </defs>
        <path
          d={`M 0 100 ${data.map((d, i) => `L ${(i * 100) / (data.length - 1)} ${100 - d}`).join(' ')} L 100 100 Z`}
          fill={`url(#grad-${color})`}
        />
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
          className="drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]"
        />
        <circle cx={lastPoint.x} cy={lastPoint.y} r="3" fill="white" className="animate-pulse shadow-[0_0_10px_white]" />
      </svg>
    );
  };

  return (
    <div className={`animate-in fade-in duration-1000 w-full ${isMobile ? 'space-y-6' : 'space-y-10'} pb-24 bg-[#0b0c0e]`}>
      
      {/* TOP ROW: BALANCE & TOP ASSETS */}
      <section className={`grid gap-6 ${isMobile ? 'grid-cols-1' : 'grid-cols-12'}`}>
        
        {/* MY BALANCE CARD (LARGE) */}
        <div className={`${isMobile ? '' : 'col-span-5'} bg-[#131417] border border-white/5 rounded-[2rem] p-8 relative overflow-hidden group`}>
           <div className="flex justify-between items-center mb-10">
              <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_#3b82f6]"></div>
                 <p className="text-[10px] text-neutral-500 font-black uppercase tracking-widest">My Balance</p>
              </div>
              <div className="flex gap-2">
                 <button className="p-2 bg-white/5 rounded-lg text-neutral-500"><Eye size={14}/></button>
                 <button onClick={fetchAiBalance} className="p-2 bg-white/5 rounded-lg text-neutral-500"><RotateCcw size={14}/></button>
              </div>
           </div>
           
           <div className="relative z-10 space-y-2 mb-8">
              <h2 className="text-4xl font-mono font-black text-white leading-none tracking-tighter">
                 ${totalCapital.toLocaleString()}.00
              </h2>
              <div className="flex items-center gap-2 text-emerald-500 text-xs font-bold">
                 <div className="px-2 py-0.5 bg-emerald-500/10 rounded-md flex items-center gap-1">
                    <ArrowUpRight size={14}/> +$3,948.23 (17.03%)
                 </div>
                 <span className="text-neutral-600 text-[10px] uppercase font-black">Since last week</span>
              </div>
           </div>

           <div className="absolute bottom-0 inset-x-0 h-32 opacity-60">
              <NeonWave color="#3b82f6" data={[20, 60, 40, 80, 55, 95]} />
           </div>
        </div>

        {/* TOP ASSETS (GRID) */}
        <div className={`${isMobile ? '' : 'col-span-7'} grid grid-cols-1 md:grid-cols-3 gap-6`}>
           {listaPrestamos.slice(0, 3).map((p, i) => (
              <div key={p.id} className="bg-[#131417] border border-white/5 rounded-[2rem] p-6 relative overflow-hidden group hover:bg-white/[0.02] transition-all">
                 <div className="flex items-center gap-3 mb-6">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black ${i === 0 ? 'bg-orange-500/20 text-orange-500' : i === 1 ? 'bg-blue-500/20 text-blue-500' : 'bg-purple-500/20 text-purple-500'}`}>
                       {p.nombre.charAt(0)}
                    </div>
                    <div>
                       <p className="text-[10px] text-white font-black uppercase tracking-tight">{p.nombre}</p>
                       <p className="text-[8px] text-neutral-500 uppercase font-bold">Asset Rank #{i+1}</p>
                    </div>
                 </div>
                 <div className="space-y-1 mb-8">
                    <p className="text-lg font-mono font-black text-white leading-none">{p.capital} BS</p>
                    <p className="text-[9px] text-emerald-500 font-bold flex items-center gap-1">
                       <ArrowUpRight size={10}/> +{p.interes}%
                    </p>
                 </div>
                 <div className="absolute bottom-0 inset-x-0 h-16 opacity-30">
                    <NeonWave color={i === 0 ? '#f97316' : i === 1 ? '#3b82f6' : '#a855f7'} data={[30, 70, 20, 90, 40, 80]} />
                 </div>
              </div>
           ))}
        </div>
      </section>

      {/* MIDDLE ROW: MARKETS & SWAP */}
      <section className={`grid gap-8 ${isMobile ? 'grid-cols-1' : 'grid-cols-12'}`}>
        
        {/* MARKETS (LIST) */}
        <div className={`${isMobile ? '' : 'col-span-5'} bg-[#131417] border border-white/5 rounded-[2.5rem] p-8`}>
           <div className="flex items-center justify-between mb-8">
              <h3 className="text-lg font-black text-white uppercase tracking-tight">Active Portfolio</h3>
              <button className="px-4 py-1.5 bg-white/5 rounded-xl text-[9px] text-neutral-500 font-black uppercase hover:text-white transition-all">See All</button>
           </div>
           
           <div className="space-y-6">
              {listaPrestamos.slice(0, 4).map((p, i) => (
                 <div key={p.id} className="flex items-center justify-between group cursor-pointer">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-full bg-neutral-800 border border-white/5 flex items-center justify-center text-xs font-black text-white">
                          {p.nombre.charAt(0)}
                       </div>
                       <div>
                          <p className="text-xs font-black text-white uppercase">{p.nombre}</p>
                          <p className="text-[9px] text-neutral-600 font-bold uppercase">{p.estado}</p>
                       </div>
                    </div>
                    <div className="w-20 h-8 opacity-40">
                       <NeonWave color={i % 2 === 0 ? '#3b82f6' : '#f43f5e'} data={[50, 20, 80, 30, 60]} />
                    </div>
                    <div className="text-right">
                       <p className="text-xs font-mono font-black text-white leading-none">{p.capital} BS</p>
                       <p className="text-[9px] text-emerald-500 font-bold mt-1">+{p.interes}%</p>
                    </div>
                 </div>
              ))}
           </div>
        </div>

        {/* NEURAL SWAP (FUNCTIONAL) */}
        <div className={`${isMobile ? '' : 'col-span-4'} bg-[#131417] border border-white/5 rounded-[2.5rem] p-8 flex flex-col`}>
           <div className="flex items-center justify-between mb-10">
              <h3 className="text-lg font-black text-white uppercase tracking-tight">Neural Swap</h3>
              <RefreshCw size={16} className="text-neutral-600" />
           </div>

           <div className="space-y-4 flex-1">
              {/* FROM SECTION */}
              <div className="bg-white/[0.03] border border-white/5 p-4 rounded-2xl relative">
                 <div className="flex justify-between items-center mb-2">
                    <p className="text-[9px] text-neutral-500 font-black uppercase">Current Engine</p>
                    <p className="text-[9px] text-neutral-500 font-bold">Balance: {aiBalance}</p>
                 </div>
                 <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                       <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500"><Cpu size={16}/></div>
                       <p className="text-sm font-black text-white uppercase tracking-tighter">{settings.aiProvider === 'deepseek' ? 'DeepSeek' : 'Gemini'}</p>
                    </div>
                    <p className="text-lg font-mono font-black text-white">100%</p>
                 </div>
              </div>

              {/* SWAP ICON */}
              <div className="flex justify-center -my-6 relative z-10">
                 <div className="w-10 h-10 bg-[#131417] border border-white/5 rounded-full flex items-center justify-center text-white shadow-xl">
                    <ArrowDownUp size={16} />
                 </div>
              </div>

              {/* TO SECTION */}
              <div className="bg-white/[0.03] border border-white/5 p-4 rounded-2xl">
                 <div className="flex justify-between items-center mb-2">
                    <p className="text-[9px] text-neutral-500 font-black uppercase">Target Optimization</p>
                    <p className="text-[9px] text-neutral-500 font-bold">Health: 100%</p>
                 </div>
                 <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                       <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500"><Sparkles size={16}/></div>
                       <p className="text-sm font-black text-white uppercase tracking-tighter">Sovereign Pro</p>
                    </div>
                    <p className="text-lg font-mono font-black text-neutral-700">INF</p>
                 </div>
              </div>
           </div>

           <button className="w-full mt-8 py-4 bg-white text-black font-black uppercase text-[10px] rounded-2xl shadow-[0_10px_20px_rgba(255,255,255,0.1)] hover:scale-[1.02] active:scale-95 transition-all">
              Initialize Protocol
           </button>
        </div>

        {/* AI ACCESS PROMO CARD */}
        <div className={`${isMobile ? '' : 'col-span-3'} bg-gradient-to-br from-blue-600/20 via-[#131417] to-emerald-600/10 border border-white/10 rounded-[2.5rem] p-8 flex flex-col items-center justify-center text-center relative overflow-hidden`}>
           <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-500/10 via-transparent to-transparent"></div>
           <div className="relative z-10">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-6 mx-auto border border-white/10 shadow-2xl backdrop-blur-xl">
                 <Sparkles size={32} className="text-white animate-pulse" />
              </div>
              <h4 className="text-xl font-black text-white uppercase tracking-tighter leading-tight mb-4">
                 Sovereign AI <br/> Quantum Access!
              </h4>
              <p className="text-[9px] text-neutral-500 font-bold uppercase tracking-widest leading-relaxed mb-8">
                 Access advanced financial forecasting and neural automation with Sovereign Pro.
              </p>
              <button className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-[10px] font-black uppercase hover:bg-white/10 transition-all group">
                 Launch Intelligence <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </button>
           </div>
        </div>

      </section>
    </div>
  );
};

export default CommandCenter;
