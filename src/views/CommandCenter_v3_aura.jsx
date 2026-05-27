import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, Activity, ShoppingBag, History, AlertCircle,
  User, CheckCircle2, Circle, CalendarDays, ChevronRight,
  Cpu, Wallet, Sparkles, RefreshCw, BarChart3, 
  ArrowUpRight, ArrowDownRight, Layers, Target, Clock
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

  // COMPONENTE: GRÁFICO DE ANILLO (RADIAL PROGRESS)
  const RadialProgress = ({ percent = 70, size = 120, color = "#3b82f6", children }) => {
    const radius = (size - 10) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (percent / 100) * circumference;

    return (
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg className="transform -rotate-90" width={size} height={size}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth="6"
            fill="transparent"
            className="text-white/5"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth="6"
            strokeDasharray={circumference}
            style={{ strokeDashoffset: offset, transition: 'stroke-dashoffset 1.5s ease-in-out' }}
            strokeLinecap="round"
            fill="transparent"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          {children}
        </div>
      </div>
    );
  };

  const getGreeting = () => {
    const hours = new Date().getHours();
    if (hours < 12) return "Buenos días";
    if (hours < 18) return "Buenas tardes";
    return "Buenas noches";
  };

  return (
    <div className={`animate-in fade-in duration-1000 w-full ${isMobile ? 'space-y-6' : 'space-y-12'} pb-24`}>
      
      {/* SECCIÓN DE BIENVENIDA (ESTILO LUXURY) */}
      <section className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-2">
           <p className="text-[10px] text-neutral-500 font-black uppercase tracking-[0.4em] mb-4">Sovereign OS / v4.2 Aura</p>
           <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter leading-none">
              {getGreeting()}, <span className="text-white/40 font-medium italic">Carlos</span>
           </h2>
        </div>
        <div className="flex gap-4">
           <div className="flex -space-x-3 overflow-hidden">
              {[1,2,3].map(i => (
                <div key={i} className="w-10 h-10 rounded-full border-2 border-[#141414] bg-neutral-800 flex items-center justify-center text-[10px] font-black text-white">
                   {String.fromCharCode(64 + i)}
                </div>
              ))}
           </div>
           <button onClick={fetchAiBalance} className={`w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all ${isRefreshing ? 'animate-spin' : ''}`}>
              <RefreshCw size={16} className="text-neutral-500" />
           </button>
        </div>
      </section>

      {/* MONITOR DE MÉTRICAS "AURA" */}
      <section className={`grid gap-8 ${isMobile ? 'grid-cols-1' : 'grid-cols-3'}`}>
        
        {/* TOTAL ASSETS (GLASS) */}
        <div className="bg-white/[0.03] backdrop-blur-3xl border border-white/5 p-8 rounded-[3rem] shadow-2xl group hover:bg-white/[0.05] transition-all duration-500">
           <div className="flex justify-between items-start mb-10">
              <div className="p-4 bg-emerald-500/10 rounded-3xl text-emerald-500 shadow-xl shadow-emerald-500/5">
                 <Wallet size={24} />
              </div>
              <div className="text-right">
                 <p className="text-[9px] text-neutral-500 font-black uppercase tracking-widest">Activos Totales</p>
                 <div className="flex items-center gap-1 text-emerald-500 font-mono font-bold text-xs">
                    <ArrowUpRight size={14} /> +2.5%
                 </div>
              </div>
           </div>
           <h3 className="text-4xl font-mono font-black text-white tracking-tighter mb-2">{totalCapital.toLocaleString()}</h3>
           <p className="text-[10px] text-neutral-600 font-bold uppercase tracking-widest">Balance de capital en calle</p>
        </div>

        {/* AI NEURAL ENGINE (RADIAL) */}
        <div className="bg-white/[0.03] backdrop-blur-3xl border border-white/5 p-8 rounded-[3rem] shadow-2xl flex items-center justify-between group">
           <div className="space-y-4">
              <div>
                 <p className="text-[9px] text-neutral-500 font-black uppercase tracking-widest mb-1">Neural Health</p>
                 <h4 className="text-xl font-black text-white uppercase tracking-tighter">
                    {settings.aiProvider === 'deepseek' ? 'DeepSeek' : 'Gemini Pro'}
                 </h4>
              </div>
              <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                 <span className="text-[9px] text-blue-500 font-black uppercase">Sincronizado</span>
              </div>
           </div>
           <RadialProgress percent={85} color="#3b82f6" size={100}>
              <div className="flex flex-col items-center">
                 <span className="text-xs font-mono font-black text-white leading-none">85%</span>
              </div>
           </RadialProgress>
        </div>

        {/* MONTHLY GOAL (EGRESOS) */}
        <div className="bg-white/[0.03] backdrop-blur-3xl border border-white/5 p-8 rounded-[3rem] shadow-2xl flex items-center justify-between group">
           <div className="space-y-4">
              <div>
                 <p className="text-[9px] text-neutral-500 font-black uppercase tracking-widest mb-1">Egresos Mes</p>
                 <h4 className="text-xl font-mono font-black text-white tracking-tighter">
                    {totalEgresos.toLocaleString()} <span className="text-[10px] text-neutral-600 font-bold uppercase">BS</span>
                 </h4>
              </div>
              <div className="px-3 py-1 bg-rose-500/10 border border-rose-500/20 rounded-full w-max">
                 <p className="text-[8px] text-rose-500 font-black uppercase">Presupuesto Limite</p>
              </div>
           </div>
           <RadialProgress percent={45} color="#f43f5e" size={100}>
              <BarChart3 size={18} className="text-rose-500 opacity-50" />
           </RadialProgress>
        </div>
      </section>

      {/* DASHBOARD CENTRAL: AGENTA Y RENDIMIENTO */}
      <section className={`grid gap-12 ${isMobile ? 'grid-cols-1' : 'grid-cols-12'}`}>
        
        {/* TIMELINE DE COBROS (ESTILO AGENDA DE LUJO) */}
        <div className={`${isMobile ? '' : 'col-span-4'} space-y-10`}>
           <div className="flex items-center justify-between">
              <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white">Eventos Próximos</h3>
              <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-neutral-500"><Clock size={14}/></div>
           </div>
           
           <div className="space-y-8 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-px before:bg-white/5">
              {cobrosActivos.slice(0, 4).map(c => (
                <div key={c.id} className="relative pl-8 group">
                   <div className="absolute left-0 top-1.5 w-[22px] h-[22px] rounded-full bg-[#141414] border-2 border-rose-500/30 flex items-center justify-center z-10 group-hover:border-rose-500 transition-all">
                      <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                   </div>
                   <div className="bg-white/[0.02] border border-white/5 p-5 rounded-[2rem] hover:bg-white/5 transition-all">
                      <div className="flex justify-between items-start mb-2">
                         <p className="text-xs font-black text-white uppercase truncate max-w-[120px]">{c.nombre}</p>
                         <p className="text-[10px] font-mono font-black text-rose-500">{ (parseFloat(c.capital) * (parseFloat(c.interes) / 100)).toFixed(0) } BS</p>
                      </div>
                      <div className="flex items-center gap-2">
                         <CalendarDays size={10} className="text-neutral-600" />
                         <p className="text-[9px] text-neutral-500 font-bold uppercase tracking-widest">En {c.diffDays} días • {new Date(c.nextDate).toLocaleDateString()}</p>
                      </div>
                   </div>
                </div>
              ))}
              {cobrosActivos.length === 0 && (
                 <div className="py-10 text-center text-neutral-700 text-[10px] font-black uppercase tracking-widest">Sin eventos críticos</div>
              )}
           </div>
        </div>

        {/* PORTAFOLIO "AURA" (LIMPIO) */}
        <div className={`${isMobile ? '' : 'col-span-8'} bg-white/[0.03] backdrop-blur-3xl border border-white/5 rounded-[3.5rem] p-10 shadow-2xl`}>
           <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-12">
              <div>
                 <h3 className="text-2xl font-black text-white tracking-tighter uppercase">Rendimiento Operativo</h3>
                 <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-[0.2em] mt-1">Análisis de activos en circulación</p>
              </div>
              <div className="flex items-center gap-4">
                 <div className="text-right">
                    <p className="text-[8px] text-neutral-600 font-black uppercase tracking-widest">Rendimiento Mensual</p>
                    <p className="text-lg font-mono font-black text-emerald-500 leading-none">+{totalInteresMensual.toLocaleString()} <span className="text-[8px]">BS</span></p>
                 </div>
                 <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                    <TrendingUp size={24} />
                 </div>
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {listaPrestamos.slice(0, 6).map(p => {
                 const pData = allCobros.find(c => c.id === p.id);
                 const isPaid = pData?.isPaidThisMonth;
                 
                 return (
                   <div key={p.id} onClick={() => onNavigateToPrestamo(p.id)} className="flex items-center justify-between p-6 bg-white/[0.02] border border-white/5 rounded-[2.5rem] hover:bg-white/[0.05] transition-all cursor-pointer group">
                      <div className="flex items-center gap-4">
                         <div className="w-12 h-12 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-400 group-hover:scale-110 transition-all overflow-hidden border border-white/5">
                            {p.nombre.charAt(0)}
                         </div>
                         <div>
                            <p className="text-xs font-black text-white uppercase">{p.nombre}</p>
                            <div className="flex items-center gap-2 mt-1">
                               <div className={`w-1.5 h-1.5 rounded-full ${isPaid ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                               <p className="text-[8px] text-neutral-500 font-bold uppercase tracking-widest">{isPaid ? 'Liquidado' : 'Pendiente'}</p>
                            </div>
                         </div>
                      </div>
                      <div className="text-right">
                         <p className="text-sm font-mono font-black text-white">{(parseFloat(p.capital) * (parseFloat(p.interes) / 100)).toFixed(0)} <span className="text-[8px] opacity-30">BS</span></p>
                         <p className="text-[7px] text-neutral-600 font-black uppercase mt-1">Interés Generado</p>
                      </div>
                   </div>
                 );
              })}
           </div>

           <button 
              onClick={() => onNavigateToPrestamo()}
              className="w-full mt-10 py-5 border border-dashed border-white/10 rounded-3xl text-[9px] text-neutral-600 font-black uppercase tracking-[0.4em] hover:border-white/30 hover:text-white transition-all"
           >
              Ver Cartera Completa
           </button>
        </div>

      </section>
    </div>
  );
};

export default CommandCenter;
