import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, Activity, ShoppingBag, History, AlertCircle,
  User, CheckCircle2, Circle, CalendarDays, ChevronRight,
  Cpu, Wallet, Sparkles, RefreshCw, BarChart3, PieChart, 
  ArrowUpRight, ArrowDownRight, Layers, Target
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

  // COMPONENTES GRÁFICOS (SVG)
  const Sparkline = ({ color = "#10b981", data = [10, 40, 30, 70, 50, 90] }) => (
    <svg viewBox="0 0 100 30" className="w-24 h-8">
      <path
        d={`M 0 ${30 - data[0]} ${data.map((d, i) => `L ${(i * 100) / (data.length - 1)} ${30 - d}`).join(' ')}`}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="opacity-50"
      />
    </svg>
  );

  return (
    <div className={`animate-in fade-in duration-700 w-full ${isMobile ? 'space-y-6' : 'space-y-8'} pb-20`}>
      
      {/* HEADER EJECUTIVO */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <div className="flex items-center gap-3 mb-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <p className="text-[10px] text-neutral-500 font-black uppercase tracking-[0.4em]">Sovereign Executive Hub</p>
           </div>
           <h2 className="text-4xl font-black tracking-tighter text-white uppercase">Centro de Control</h2>
        </div>
        <div className="flex items-center gap-4 bg-white/[0.03] border border-white/5 p-2 rounded-2xl">
           <div className="px-4 py-2 text-right">
              <p className="text-[9px] text-neutral-500 font-black uppercase tracking-widest">Sistema Operativo</p>
              <p className="text-xs font-bold text-emerald-500 uppercase">v4.0 High-Performance</p>
           </div>
           <button onClick={fetchAiBalance} className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all ${isRefreshing ? 'animate-spin' : ''}`}>
              <RefreshCw size={16} className="text-neutral-400" />
           </button>
        </div>
      </header>

      {/* KPI GRID (VISUAL) */}
      <div className={`grid gap-6 ${isMobile ? 'grid-cols-1' : 'grid-cols-3'}`}>
        {/* CARD: CAPITAL CALLE */}
        <div className="bg-[#141414] border border-white/5 p-6 rounded-[2.5rem] relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-30 transition-all">
              <TrendingUp size={60} />
           </div>
           <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                 <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-500"><Wallet size={20}/></div>
                 <Sparkline color="#10b981" />
              </div>
              <p className="text-[10px] text-neutral-500 font-black uppercase tracking-widest mb-1">Capital en Calle</p>
              <div className="flex items-baseline gap-2">
                 <h3 className="text-3xl font-mono font-black text-white">{totalCapital.toLocaleString()}</h3>
                 <span className="text-xs text-neutral-600 font-bold">BS.</span>
              </div>
              <div className="mt-4 flex items-center gap-2 text-[10px] text-emerald-500 font-black uppercase">
                 <ArrowUpRight size={14} /> +12.5% <span className="text-neutral-600 ml-1">vs mes anterior</span>
              </div>
           </div>
        </div>

        {/* CARD: EGRESOS MES */}
        <div className="bg-[#141414] border border-white/5 p-6 rounded-[2.5rem] relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-30 transition-all">
              <ShoppingBag size={60} />
           </div>
           <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                 <div className="p-3 bg-rose-500/10 rounded-2xl text-rose-500"><BarChart3 size={20}/></div>
                 <Sparkline color="#f43f5e" data={[80, 20, 60, 30, 90, 40]} />
              </div>
              <p className="text-[10px] text-neutral-500 font-black uppercase tracking-widest mb-1">Egresos del Mes</p>
              <div className="flex items-baseline gap-2">
                 <h3 className="text-3xl font-mono font-black text-white">{totalEgresos.toLocaleString()}</h3>
                 <span className="text-xs text-neutral-600 font-bold">BS.</span>
              </div>
              <div className="mt-4 flex items-center gap-2 text-[10px] text-rose-500 font-black uppercase">
                 <ArrowDownRight size={14} /> -3.2% <span className="text-neutral-600 ml-1">optimización activa</span>
              </div>
           </div>
        </div>

        {/* CARD: NEURAL STATUS */}
        <div className="bg-[#141414] border border-white/5 p-6 rounded-[2.5rem] relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-30 transition-all">
              <Cpu size={60} />
           </div>
           <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                 <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-500"><Sparkles size={20}/></div>
                 <div className="flex gap-1">
                    {[1,2,3,4].map(i => <div key={i} className={`w-1 h-6 rounded-full ${i <= 3 ? 'bg-blue-500' : 'bg-white/10'}`}></div>)}
                 </div>
              </div>
              <p className="text-[10px] text-neutral-500 font-black uppercase tracking-widest mb-1">Sistemas Neurales</p>
              <div className="flex items-baseline gap-2">
                 <h3 className="text-3xl font-mono font-black text-white truncate max-w-[150px]">{aiBalance}</h3>
                 <span className="text-[10px] text-neutral-600 font-bold uppercase">{settings.aiProvider === 'deepseek' ? 'USD' : 'INF'}</span>
              </div>
              <div className="mt-4 flex items-center gap-2">
                 <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 w-3/4 animate-pulse"></div>
                 </div>
                 <span className="text-[9px] text-blue-500 font-black uppercase">Optimizando</span>
              </div>
           </div>
        </div>
      </div>

      {/* DASHBOARD PRINCIPAL: PORTAFOLIO DE RENDIMIENTO */}
      <div className={`grid gap-8 ${isMobile ? 'grid-cols-1' : 'grid-cols-12'}`}>
        
        {/* PORTAFOLIO DE PRÉSTAMOS (TABLA GRÁFICA) */}
        <div className={`${isMobile ? '' : 'col-span-8'} bg-[#141414] border border-white/5 rounded-[2.5rem] overflow-hidden flex flex-col shadow-2xl`}>
           <div className="p-8 border-b border-white/5 flex justify-between items-center">
              <div>
                 <h3 className="text-lg font-black uppercase tracking-tight text-white">Portafolio de Rendimiento</h3>
                 <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mt-1">Análisis de riesgo y flujo de capital</p>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                 <Target size={14} className="text-emerald-500" />
                 <span className="text-[10px] text-emerald-500 font-black uppercase">+{totalInteresMensual.toLocaleString()} BS / Mes</span>
              </div>
           </div>
           
           <div className="overflow-x-auto mac-scrollbar">
              <table className="w-full text-left border-collapse">
                 <thead>
                    <tr className="bg-white/[0.02]">
                       <th className="px-8 py-5 text-[9px] font-black uppercase text-neutral-500 tracking-widest">Activo / Cliente</th>
                       <th className="px-8 py-5 text-[9px] font-black uppercase text-neutral-500 tracking-widest text-center">Estado</th>
                       <th className="px-8 py-5 text-[9px] font-black uppercase text-neutral-500 tracking-widest text-right">Rendimiento</th>
                       <th className="px-8 py-5 text-[9px] font-black uppercase text-neutral-500 tracking-widest text-right">Acción</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-white/5">
                    {listaPrestamos.slice(0, 8).map(p => {
                       const pData = allCobros.find(c => c.id === p.id);
                       const isUrgent = pData?.diffDays <= 3 && !pData?.isPaidThisMonth;
                       const isPaid = pData?.isPaidThisMonth;
                       
                       return (
                          <tr key={p.id} className="hover:bg-white/[0.01] transition-colors group">
                             <td className="px-8 py-6">
                                <div className="flex items-center gap-4">
                                   <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs ${isUrgent ? 'bg-rose-500/10 text-rose-500' : 'bg-white/5 text-neutral-400'}`}>
                                      {p.nombre.charAt(0)}
                                   </div>
                                   <div>
                                      <p className="text-xs font-black text-white uppercase">{p.nombre}</p>
                                      <p className="text-[9px] text-neutral-600 font-bold">Capital: {p.capital} BS</p>
                                   </div>
                                </div>
                             </td>
                             <td className="px-8 py-6">
                                <div className="flex justify-center">
                                   <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${
                                      isPaid ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 
                                      isUrgent ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' : 
                                      'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                   }`}>
                                      {isPaid ? 'Liquidado' : isUrgent ? 'Crítico' : 'En Fecha'}
                                   </div>
                                </div>
                             </td>
                             <td className="px-8 py-6 text-right">
                                <p className="text-sm font-mono font-black text-white">
                                   {(parseFloat(p.capital) * (parseFloat(p.interes) / 100)).toFixed(0)} <span className="text-[9px] text-neutral-600">BS</span>
                                </p>
                                <div className="w-20 h-1 bg-white/5 rounded-full mt-2 ml-auto overflow-hidden">
                                   <div className={`h-full ${isPaid ? 'bg-emerald-500' : 'bg-amber-500'} w-full`}></div>
                                </div>
                             </td>
                             <td className="px-8 py-6 text-right">
                                <button 
                                   onClick={() => onQuickPayment(p.id)}
                                   className={`p-2 rounded-xl transition-all ${isPaid ? 'bg-emerald-500 text-black' : 'bg-white/5 text-neutral-500 hover:bg-emerald-500 hover:text-black'}`}
                                >
                                   <CheckCircle2 size={16} />
                                </button>
                             </td>
                          </tr>
                       );
                    })}
                 </tbody>
              </table>
           </div>
           
           <button 
              onClick={() => onNavigateToPrestamo()}
              className="mt-auto p-6 text-center text-[10px] font-black uppercase tracking-[0.3em] text-neutral-600 hover:text-white border-t border-white/5 transition-colors"
           >
              Gestionar Cartera Completa <ChevronRight size={12} className="inline ml-1" />
           </button>
        </div>

        {/* LOGÍSTICA Y RECURSOS (GRÁFICOS LATERALES) */}
        <div className={`${isMobile ? '' : 'col-span-4'} space-y-8`}>
           
           {/* DISTRIBUCIÓN DE LOGÍSTICA */}
           <div className="bg-[#141414] border border-white/5 rounded-[2.5rem] p-8">
              <h3 className="text-xs font-black uppercase tracking-widest text-neutral-500 mb-8 flex items-center gap-3">
                 <Layers size={16} /> Matriz de Logística
              </h3>
              
              <div className="space-y-8">
                 {[
                    { label: 'Tareas', color: '#3b82f6', percent: 75 },
                    { label: 'Compras', color: '#10b981', percent: 45 },
                    { label: 'Ideas', color: '#f59e0b', percent: 90 },
                    { label: 'Apuntes', color: '#8b5cf6', percent: 30 }
                 ].map(item => (
                    <div key={item.label} className="group">
                       <div className="flex justify-between items-end mb-2">
                          <p className="text-[10px] font-black uppercase tracking-widest text-white">{item.label}</p>
                          <p className="text-[10px] font-mono font-bold text-neutral-600">{item.percent}%</p>
                       </div>
                       <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                          <div 
                             className="h-full transition-all duration-1000 ease-out" 
                             style={{ width: `${item.percent}%`, backgroundColor: item.color }}
                          ></div>
                       </div>
                    </div>
                 ))}
              </div>

              <div className="mt-10 p-5 bg-white/[0.02] border border-white/5 rounded-[1.5rem] flex items-center gap-4">
                 <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
                    <PieChart size={24} />
                 </div>
                 <div>
                    <p className="text-[9px] text-neutral-500 font-black uppercase tracking-widest">Optimización</p>
                    <p className="text-xs font-bold text-white">Soberanía del tiempo activa</p>
                 </div>
              </div>
           </div>

           {/* COBROS PRÓXIMOS (VALORES DE REFERENCIA) */}
           <div className="bg-[#141414] border border-white/5 rounded-[2.5rem] p-8">
              <h3 className="text-xs font-black uppercase tracking-widest text-neutral-500 mb-8 flex items-center gap-3">
                 <CalendarDays size={16} /> Próximos Eventos
              </h3>
              <div className="space-y-6">
                 {cobrosActivos.slice(0, 3).map(c => (
                    <div key={c.id} className="flex items-center justify-between group">
                       <div className="flex items-center gap-4">
                          <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                          <div>
                             <p className="text-xs font-black text-white uppercase">{c.nombre}</p>
                             <p className="text-[8px] text-neutral-600 font-bold uppercase tracking-widest">Vence en {c.diffDays} días</p>
                          </div>
                       </div>
                       <p className="text-xs font-mono font-black text-rose-500">
                          {(parseFloat(c.capital) * (parseFloat(c.interes) / 100)).toFixed(0)} BS
                       </p>
                    </div>
                 ))}
                 {cobrosActivos.length === 0 && (
                    <p className="text-[9px] text-neutral-600 italic font-bold">No hay eventos críticos proyectados.</p>
                 )}
              </div>
           </div>

        </div>

      </div>
    </div>
  );
};

export default CommandCenter;
