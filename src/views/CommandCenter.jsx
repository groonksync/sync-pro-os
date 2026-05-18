import React, { useState, useEffect } from 'react';
import { 
  Wallet, Package, BarChart3, CalendarDays, Box, ShieldCheck, 
  RefreshCw, Bell, CheckSquare, Video, ChevronRight
} from 'lucide-react';
import { aiService } from '../services/aiService';
import { Google, DeepSeek } from '@lobehub/icons';

const GoogleLogo = ({ size = 18 }) => <Google.Color size={size} />;
const DeepSeekLogo = ({ size = 18 }) => <DeepSeek.Color size={size} />;

const CommandCenter = ({ meetingsList = [], data = { prestamos: [], productos: [], recordatorios: [] }, servicios = [], settings, onNavigateToPrestamo, onQuickPayment }) => {
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

  // LÓGICA DE DATOS: FINANZAS
  const listaPrestamos = Array.isArray(data?.prestamos) ? data.prestamos.filter(p => p && p.id) : [];
  const totalCapital = listaPrestamos.reduce((acc, p) => acc + (parseFloat(p?.capital) || 0), 0);
  const totalInteresMensual = listaPrestamos.reduce((acc, p) => {
    const cap = parseFloat(p?.capital) || 0;
    const int = parseFloat(p?.interes) || 0;
    return acc + (cap * (int / 100));
  }, 0);

  const listaServicios = Array.isArray(servicios) ? servicios.filter(s => s && s.id) : [];
  const totalEgresos = listaServicios.reduce((acc, s) => acc + (parseFloat(s?.monto) || 0), 0);

  // LÓGICA DE DATOS: INVENTARIO
  const listaProductos = Array.isArray(data?.productos) ? data.productos : [];
  const valorInventario = listaProductos.reduce((acc, p) => acc + (parseFloat(p.precio) * (parseInt(p.stock) || 0)), 0);
  const stockBajo = listaProductos.filter(p => (parseInt(p.stock) || 0) <= 5);

  // LÓGICA DE DATOS: RECORDATORIOS
  const listaRecordatorios = Array.isArray(data?.recordatorios) ? data.recordatorios : [];
  const tareasPendientes = listaRecordatorios.filter(r => r.estado === 'Pendiente').sort((a, b) => {
    const pPriority = { 'Crítica': 0, 'Alta': 1, 'Media': 2, 'Baja': 3 };
    return pPriority[a.prioridad] - pPriority[b.prioridad];
  });

  // LÓGICA DE DATOS: VIDEO
  const listaVideos = Array.isArray(meetingsList) ? meetingsList : [];

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

  const ActiveAILogo = settings.aiProvider === 'deepseek' ? DeepSeekLogo : GoogleLogo;

  return (
    <div className={`animate-in fade-in duration-500 w-full ${isMobile ? 'space-y-8' : 'space-y-12'} pb-24 bg-[#121212]`}>
      
      {/* HEADER INTEGRADO */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-white/5 pb-8">
        <div>
           <h2 className="text-3xl font-black text-white uppercase tracking-tight">Centro de Control</h2>
        </div>
        <div className="flex items-center gap-3">
           {/* INDICADOR IA INTEGRADO */}
           <div className="px-4 py-2 bg-white/5 rounded-xl border border-white/5 flex items-center gap-4">
              <div className="flex items-center gap-2">
                 <ActiveAILogo />
                 <div>
                    <p className="text-[9px] text-neutral-500 font-black uppercase tracking-widest leading-none">Modelo de IA</p>
                    <p className="text-xs font-bold text-white uppercase mt-1">
                       {aiBalance} <span className="text-[8px] text-neutral-600">{settings.aiProvider === 'deepseek' ? 'USD' : 'INF'}</span>
                    </p>
                 </div>
              </div>
              <button onClick={fetchAiBalance} className={`p-1.5 bg-white/5 rounded-lg text-neutral-500 hover:text-white transition-all ${isRefreshing ? 'animate-spin' : ''}`}>
                 <RefreshCw size={12} />
              </button>
           </div>
           
           {/* STATUS SISTEMA */}
           <div className="px-4 py-2 bg-white/5 rounded-xl border border-white/5">
              <p className="text-[9px] text-neutral-500 font-black uppercase tracking-widest leading-none">Sistema</p>
              <p className="text-xs font-bold text-emerald-500 uppercase mt-1 flex items-center gap-2">
                 <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                 Operativo
              </p>
           </div>
        </div>
      </div>

      <section className={`grid gap-6 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
        {/* CAPITAL */}
        <div className="bg-[#0a0a0a] border border-white/5 p-8 rounded-3xl group">
           <div className="flex items-center justify-between mb-6">
              <div className="w-10 h-10 bg-white/5 rounded-2xl flex items-center justify-center text-neutral-400 group-hover:text-white transition-all">
                 <Wallet size={20} />
              </div>
              <span className="text-[9px] text-emerald-500 font-black uppercase tracking-widest bg-emerald-500/10 px-2 py-1 rounded-md">Capital</span>
           </div>
           <p className="text-[10px] text-neutral-500 font-black uppercase tracking-widest mb-1">Activos en Calle</p>
           <h3 className="text-4xl font-black text-white tracking-tighter">
              {totalCapital.toLocaleString()} <span className="text-sm text-neutral-600 font-medium">BS</span>
           </h3>
           <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
              <p className="text-[9px] text-neutral-600 font-bold uppercase">Rendimiento Mensual</p>
              <p className="text-xs font-black text-emerald-500">+{totalInteresMensual.toLocaleString()} BS</p>
           </div>
        </div>

        {/* INVENTARIO PRO */}
        <div className="bg-[#0a0a0a] border border-white/5 p-8 rounded-3xl group">
           <div className="flex items-center justify-between mb-6">
              <div className="w-10 h-10 bg-white/5 rounded-2xl flex items-center justify-center text-neutral-400 group-hover:text-white transition-all">
                 <Package size={20} />
              </div>
              <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${stockBajo.length > 0 ? 'bg-rose-500/10 text-rose-500' : 'bg-blue-500/10 text-blue-500'}`}>
                 {stockBajo.length > 0 ? 'Stock Bajo' : 'Inventario'}
              </span>
           </div>
           <p className="text-[10px] text-neutral-500 font-black uppercase tracking-widest mb-1">Valor de Almacén</p>
           <h3 className="text-4xl font-black text-white tracking-tighter">
              {valorInventario.toLocaleString()} <span className="text-sm text-neutral-600 font-medium">BS</span>
           </h3>
           <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
              <p className="text-[9px] text-neutral-600 font-bold uppercase">Artículos Totales</p>
              <p className="text-xs font-black text-white">{listaProductos.length} Artículos</p>
           </div>
        </div>
      </section>

      {/* FILA 2: MATRIZ OPERATIVA (IZQUIERDA: RENDIMIENTO, DERECHA: LOGÍSTICA) */}
      <section className={`grid gap-8 ${isMobile ? 'grid-cols-1' : 'grid-cols-12'}`}>
         
         {/* RENDIMIENTO FINANCIERO */}
         <div className={`${isMobile ? '' : 'col-span-7'} bg-[#0a0a0a] border border-white/5 rounded-[2rem] overflow-hidden shadow-xl`}>
            <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
               <div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-white">Rendimiento Operativo</h3>
                  <p className="text-[9px] text-neutral-600 font-bold uppercase tracking-widest mt-1">Gestión de capital en circulación</p>
               </div>
            </div>
            
            <div className="overflow-x-auto">
               <table className="w-full text-left">
                  <thead>
                     <tr className="border-b border-white/5">
                        <th className="px-8 py-5 text-[9px] font-black uppercase text-neutral-500 tracking-widest">Activo</th>
                        <th className="px-8 py-5 text-[9px] font-black uppercase text-neutral-500 tracking-widest">Fecha Cobro</th>
                        <th className="px-8 py-5 text-[9px] font-black uppercase text-neutral-500 tracking-widest">Estado</th>
                        <th className="px-8 py-5 text-[9px] font-black uppercase text-neutral-500 tracking-widest text-right">Monto</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                     {listaPrestamos.slice(0, 5).map(p => {
                        const pData = allCobros.find(c => c.id === p.id);
                        const isPaid = pData?.isPaidThisMonth;
                        return (
                           <tr key={p.id} className="hover:bg-white/[0.02] transition-colors group">
                              <td className="px-8 py-5">
                                 <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-xs font-black text-neutral-400 group-hover:text-white transition-all">
                                       {p.nombre.charAt(0)}
                                    </div>
                                    <p className="text-xs font-black text-white uppercase">{p.nombre}</p>
                                 </div>
                              </td>
                              <td className="px-8 py-5">
                                 <p className="text-[10px] font-bold text-neutral-400 uppercase">
                                    {pData?.nextDate ? pData.nextDate.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }) : 'N/A'}
                                 </p>
                              </td>
                              <td className="px-8 py-5">
                                 <div className="flex items-center gap-3">
                                    <input 
                                       type="checkbox" 
                                       checked={isPaid || false} 
                                       onChange={() => onQuickPayment && onQuickPayment(p.id)}
                                       className="w-4 h-4 rounded border-white/10 bg-white/5 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-0 cursor-pointer"
                                    />
                                    <span className={`text-[9px] font-black uppercase ${isPaid ? 'text-emerald-500' : 'text-amber-500'}`}>{isPaid ? 'Pagado' : 'Pendiente'}</span>
                                 </div>
                              </td>
                              <td className="px-8 py-5 text-right font-mono font-black text-white text-xs">
                                 {(parseFloat(p.capital) * (parseFloat(p.interes) / 100)).toFixed(0)} BS
                              </td>
                           </tr>
                        );
                     })}
                  </tbody>
               </table>
            </div>
         </div>

         {/* TASK PULSE (RECORDATORIOS) */}
         <div className={`${isMobile ? '' : 'col-span-5'} space-y-6`}>
            <div className="bg-[#0a0a0a] border border-white/5 rounded-[2rem] p-8">
               <h3 className="text-sm font-black uppercase tracking-widest text-white mb-8 flex items-center gap-3">
                  <Bell size={18} className="text-amber-500" /> Pulso de Tareas
               </h3>
               <div className="space-y-4">
                  {tareasPendientes.slice(0, 3).map(task => (
                    <div key={task.id} className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-2xl group hover:border-white/10 transition-all">
                       <div className="flex items-center gap-4">
                          <div className={`w-2 h-2 rounded-full ${task.prioridad === 'Crítica' ? 'bg-rose-500' : task.prioridad === 'Alta' ? 'bg-amber-500' : 'bg-blue-500'}`}></div>
                          <div>
                             <p className="text-xs font-black text-white uppercase truncate max-w-[150px]">{task.titulo}</p>
                             <p className="text-[8px] text-neutral-600 font-bold uppercase tracking-widest">{task.categoria} • {task.prioridad}</p>
                          </div>
                       </div>
                       <button className="p-2 text-neutral-700 hover:text-white transition-colors">
                          <CheckSquare size={16} />
                       </button>
                    </div>
                  ))}
                  {tareasPendientes.length === 0 && (
                     <div className="py-10 text-center border border-dashed border-white/5 rounded-2xl">
                        <p className="text-[9px] text-neutral-700 font-black uppercase tracking-widest">Sistema de Tareas Limpio</p>
                     </div>
                  )}
               </div>
            </div>

            {/* PRODUCTION PIPELINE (EDITOR DE VIDEO) */}
            <div className="bg-[#0a0a0a] border border-white/5 rounded-[2.2rem] p-8">
               <h3 className="text-sm font-black uppercase tracking-widest text-white mb-8 flex items-center gap-3">
                  <Video size={18} className="text-blue-500" /> Cola de Producción
               </h3>
               <div className="flex items-center gap-6">
                  <div className="flex-1">
                     <p className="text-[9px] text-neutral-600 font-black uppercase tracking-widest mb-1">Proyectos Activos</p>
                     <p className="text-3xl font-black text-white">{listaVideos.length}</p>
                  </div>
                  <div className="flex-1">
                     <div className="h-2 bg-white/5 rounded-full overflow-hidden mb-2">
                        <div className="h-full bg-blue-500 w-2/3 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                     </div>
                     <p className="text-[8px] text-neutral-500 font-bold uppercase tracking-widest">Capacidad de Renderizado</p>
                  </div>
               </div>
            </div>
         </div>

      </section>

      {/* FILA 3: STATUS RÁPIDO (FOOTER DASHBOARD) */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-6">
         {[
           { label: 'Egresos Mes', val: totalEgresos.toLocaleString(), icon: BarChart3, color: 'text-rose-500' },
           { label: 'Proximos Cobros', val: cobrosActivos.length, icon: CalendarDays, color: 'text-amber-500' },
           { label: 'Artículos Stock Bajo', val: stockBajo.length, icon: Box, color: 'text-orange-500' },
           { label: 'Estado de Seguridad', val: 'Élite', icon: ShieldCheck, color: 'text-emerald-500' }
         ].map(item => (
            <div key={item.label} className="bg-white/[0.02] border border-white/5 p-6 rounded-[2rem] flex flex-col items-center text-center group hover:bg-white/[0.04] transition-all">
               <item.icon size={20} className={`${item.color} mb-3`} />
               <p className="text-[8px] text-neutral-600 font-black uppercase tracking-widest mb-1">{item.label}</p>
               <p className="text-xs font-black text-white uppercase">{item.val}</p>
            </div>
         ))}
      </section>

    </div>
  );
};

export default CommandCenter;
