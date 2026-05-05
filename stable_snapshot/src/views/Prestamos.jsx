import React, { useState, useEffect } from 'react';
import { 
  Plus, ChevronRight, ArrowLeft, Save, FileSignature, Smartphone, DollarSign, 
  ExternalLink, User, CreditCard, ArrowRight, ShieldCheck, CalendarDays, CheckCircle2
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

const Prestamos = ({ data, setData, settings, isDark, preSelectedId, onClearSelection }) => {
  const [prestamoView, setPrestamoView] = useState('list'); 
  const [activePrestamo, setActivePrestamo] = useState(null);
  const [loading, setLoading] = useState(false);
  const isMobile = settings?.isMobileMode;

  useEffect(() => {
    if (preSelectedId && data?.prestamos) {
      const prestamo = data.prestamos.find(p => p.id === preSelectedId);
      if (prestamo) { openPrestamo(prestamo); if (onClearSelection) onClearSelection(); }
    }
  }, [preSelectedId, data?.prestamos]);

  const openPrestamo = (p) => { 
    if (!p) return;
    setActivePrestamo({ ...p, pagos: Array.isArray(p.pagos) ? p.pagos : [], moneda: p.moneda || 'BOB', estado: p.estado || 'Activo' }); 
    setPrestamoView('detail'); 
  };
  
  const closePrestamo = async () => { try { if (activePrestamo) await handleSave(); } finally { setPrestamoView('list'); setActivePrestamo(null); } };

  const createPrestamo = () => {
    const newP = { id: Date.now().toString(), nombre: '', ci: '', telefono: '', capital: 0, interes: 5, moneda: 'BOB', inicio: new Date().toISOString().split('T')[0], fin: new Date(new Date().setMonth(new Date().getMonth() + 6)).toISOString().split('T')[0], estado: 'Activo', garantia: '', drive_contrato: '', drive_fotos: '', pagos: [] };
    setActivePrestamo(newP); setPrestamoView('detail');
  };

  const handleSave = async () => {
    if (!activePrestamo) return; setLoading(true);
    try {
      const payload = { ...activePrestamo, capital: parseFloat(activePrestamo.capital) || 0, interes: parseFloat(activePrestamo.interes) || 0 };
      const { error } = await supabase.from('prestamos').upsert(payload);
      if (error) throw error;
      const current = Array.isArray(data?.prestamos) ? data.prestamos : [];
      const updated = current.some(p => p.id === activePrestamo.id) ? current.map(p => p.id === activePrestamo.id ? activePrestamo : p) : [...current, activePrestamo];
      setData({...data, prestamos: updated});
    } catch (e) { alert('Error: ' + e.message); } finally { setLoading(false); }
  };

  const togglePago = (mes) => {
    if (!activePrestamo) return;
    const current = Array.isArray(activePrestamo.pagos) ? activePrestamo.pagos : [];
    const newPagos = current.includes(mes) ? current.filter(m => m !== mes) : [...current, mes];
    setActivePrestamo({ ...activePrestamo, pagos: newPagos });
  };

  const generateTimeline = () => {
    if (!activePrestamo?.inicio || !activePrestamo?.fin) return [];
    const start = new Date(activePrestamo.inicio); const end = new Date(activePrestamo.fin);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return [];
    const months = []; let current = new Date(start.getFullYear(), start.getMonth(), 1);
    while (current <= new Date(end.getFullYear(), end.getMonth(), 1)) {
      months.push({ key: `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`, label: current.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }) });
      current.setMonth(current.getMonth() + 1);
    }
    return months;
  };

  const prestamosList = Array.isArray(data?.prestamos) ? data.prestamos : [];

  return (
    <div className={`flex flex-col h-full w-full animate-in fade-in duration-500 ${isMobile ? 'pb-20' : ''}`}>
      {prestamoView === 'list' ? (
        <div className="animate-in fade-in duration-300">
          <header className={`mb-10 flex ${isMobile ? 'flex-col gap-6 text-center' : 'justify-between items-end'}`}>
            <div className={isMobile ? 'w-full' : ''}>
              <h2 className={`text-3xl md:text-4xl font-black ${isDark ? 'text-white' : 'text-neutral-900'} uppercase tracking-tighter`}>Cartera de Préstamos</h2>
              <p className="text-[10px] text-neutral-500 font-black uppercase tracking-[0.4em] mt-2 flex items-center justify-center md:justify-start gap-2">
                <ShieldCheck size={14} /> Gestión de Capital Asegurado
              </p>
            </div>
            <button onClick={createPrestamo} className={`bg-blue-600 text-white text-[11px] font-black rounded-2xl md:rounded-[2rem] hover:bg-blue-700 transition-all flex items-center justify-center gap-3 shadow-2xl active:scale-95 uppercase tracking-widest ${isMobile ? 'w-full py-6' : 'px-8 py-4'}`}>
              <Plus size={18} strokeWidth={4} /> Nuevo Registro Maestro
            </button>
          </header>

          <div className={`${isMobile ? 'space-y-4' : `${isDark ? 'bg-black/20 border-white/5' : 'bg-white border-neutral-200'} border rounded-[28px] overflow-hidden shadow-2xl`}`}>
            {!isMobile ? (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className={`${isDark ? 'bg-black/60 border-white/5' : 'bg-neutral-50 border-neutral-100'} border-b`}>
                    <th className="px-8 py-5 text-[10px] font-black text-neutral-500 uppercase tracking-widest">Acreditado</th>
                    <th className="px-8 py-5 text-[10px] font-black text-neutral-500 uppercase tracking-widest">Capital</th>
                    <th className="px-8 py-5 text-[10px] font-black text-neutral-500 uppercase tracking-widest">Interés</th>
                    <th className="px-8 py-5 text-[10px] font-black text-neutral-500 uppercase tracking-widest text-right">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {prestamosList.map(p => (
                    <tr key={p.id} onClick={() => openPrestamo(p)} className={`border-b ${isDark ? 'border-white/5 hover:bg-white/5' : 'border-neutral-50 hover:bg-neutral-50'} transition-all cursor-pointer group`}>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl ${isDark ? 'bg-white/5 text-neutral-400' : 'bg-neutral-100 text-neutral-500'} flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all`}><User size={18} /></div>
                          <div><p className={`text-sm font-black ${isDark ? 'text-white' : 'text-neutral-900'} uppercase tracking-tight`}>{p.nombre || 'Sin Nombre'}</p><p className="text-[10px] text-neutral-500 mt-1 uppercase font-black tracking-widest">{p.estado}</p></div>
                        </div>
                      </td>
                      <td className="px-8 py-5"><p className={`text-base font-mono font-black ${isDark ? 'text-white' : 'text-neutral-900'}`}>{parseFloat(p.capital).toLocaleString()} <span className="text-[10px] opacity-40 font-sans">{p.moneda}</span></p></td>
                      <td className="px-8 py-5"><p className="text-base font-mono text-emerald-500 font-black">{(parseFloat(p.capital) * (parseFloat(p.interes) / 100)).toLocaleString()} <span className="text-[10px] opacity-40 font-sans">{p.moneda}</span></p></td>
                      <td className="px-8 py-5 text-right"><div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity"><button className="p-3 bg-blue-600/10 text-blue-500 rounded-xl hover:bg-blue-600 hover:text-white transition-all"><ChevronRight size={18} /></button></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {prestamosList.map(p => (
                  <div key={p.id} onClick={() => openPrestamo(p)} className={`${isDark ? 'bg-black/20 border-white/5' : 'bg-white border-neutral-200'} border p-6 rounded-[2rem] flex justify-between items-center active:scale-95 transition-all shadow-lg`}>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-blue-600/10 text-blue-500 flex items-center justify-center"><User size={24}/></div>
                      <div>
                        <p className={`text-sm font-black ${isDark ? 'text-white' : 'text-neutral-900'} uppercase tracking-tight`}>{p.nombre}</p>
                        <p className="text-[10px] text-emerald-500 font-black uppercase tracking-widest mt-1">{(parseFloat(p.capital) * (parseFloat(p.interes) / 100)).toLocaleString()} {p.moneda}</p>
                      </div>
                    </div>
                    <ChevronRight size={20} className="text-neutral-400"/>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="animate-in slide-in-from-right-8 duration-500">
          <div className="flex items-center gap-2 mb-10 text-[10px] text-neutral-500 cursor-pointer hover:text-white w-max transition-colors group font-black uppercase tracking-[0.3em]" onClick={closePrestamo}><ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Volver a la Cartera</div>
          <header className={`mb-12 flex ${isMobile ? 'flex-col gap-8' : 'flex-row justify-between items-center gap-8'}`}>
            <div className={`flex ${isMobile ? 'flex-col items-center text-center gap-6' : 'items-center gap-6'}`}>
              <div className={`${isDark ? 'bg-white/5' : 'bg-neutral-100'} w-20 h-20 rounded-3xl flex items-center justify-center border ${isDark ? 'border-white/5' : 'border-neutral-200'}`}><User size={40} className={isDark ? 'text-white' : 'text-neutral-900'} /></div>
              <div className={isMobile ? 'w-full' : ''}>
                <input type="text" value={activePrestamo.nombre} onChange={e=>setActivePrestamo({...activePrestamo, nombre: e.target.value})} className={`${isMobile ? 'text-2xl text-center' : 'text-4xl'} font-black ${isDark ? 'text-white' : 'text-neutral-900'} bg-transparent outline-none w-full border-b-2 border-transparent focus:border-blue-500/30 transition-colors tracking-tighter uppercase`} placeholder="Nombre Cliente" />
                <div className={`flex items-center gap-4 mt-4 ${isMobile ? 'justify-center flex-wrap' : ''}`}>
                  <div className={`${isDark ? 'bg-white/5 border-white/5' : 'bg-neutral-50 border-neutral-200'} flex items-center gap-2 px-4 py-2 rounded-xl border`}><FileSignature size={14} className="text-neutral-500" /><input type="text" value={activePrestamo.ci} onChange={e=>setActivePrestamo({...activePrestamo, ci: e.target.value})} className={`bg-transparent outline-none w-24 text-[10px] ${isDark ? 'text-white' : 'text-neutral-900'} font-black`} placeholder="CI..."/></div>
                  <div className={`${isDark ? 'bg-white/5 border-white/5' : 'bg-neutral-50 border-neutral-200'} flex items-center gap-2 px-4 py-2 rounded-xl border`}><Smartphone size={14} className="text-neutral-500" /><input type="text" value={activePrestamo.telefono} onChange={e=>setActivePrestamo({...activePrestamo, telefono: e.target.value})} className={`bg-transparent outline-none w-24 text-[10px] ${isDark ? 'text-white' : 'text-neutral-900'} font-black`} placeholder="WA..."/></div>
                </div>
              </div>
            </div>
            <button onClick={closePrestamo} className={`bg-blue-600 text-white text-[11px] font-black rounded-2xl md:rounded-[2rem] hover:bg-blue-700 transition-all flex items-center justify-center gap-3 shadow-2xl active:scale-95 uppercase tracking-widest ${isMobile ? 'w-full py-6' : 'px-8 py-4'}`}><Save size={20}/> Guardar Cambios</button>
          </header>
          <div className={`grid gap-8 ${isMobile ? 'grid-cols-1' : 'grid-cols-12'}`}>
            <div className={`${isMobile ? '' : 'col-span-8'} space-y-8`}>
              <div className={`${isDark ? 'bg-black/20 border-white/5' : 'bg-white border-neutral-200'} border rounded-[28px] p-8 shadow-2xl`}>
                 <h3 className="text-xs font-black tracking-[0.2em] uppercase text-neutral-500 flex items-center gap-3 mb-8"><CalendarDays size={18} /> Cronograma de Cobros</h3>
                 <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {generateTimeline().map((mes) => {
                    const isPaid = (activePrestamo.pagos || []).includes(mes.key);
                    return (
                      <div key={mes.key} onClick={() => togglePago(mes.key)} className={`p-5 rounded-3xl border-2 cursor-pointer transition-all flex flex-col gap-2 relative overflow-hidden group ${isPaid ? 'bg-emerald-500/10 border-emerald-500/20' : `${isDark ? 'bg-black/40 border-white/5 hover:border-blue-500/30' : 'bg-neutral-50 border-neutral-200 hover:border-blue-500/50'}`}`}>
                        <span className={`text-[10px] font-black uppercase tracking-widest ${isPaid ? 'text-emerald-500' : 'text-neutral-400'}`}>{mes.label}</span>
                        <p className={`text-sm font-mono font-bold ${isPaid ? (isDark ? 'text-white' : 'text-neutral-900') : 'text-neutral-400 group-hover:text-blue-500'}`}>{(parseFloat(activePrestamo.capital) * (parseFloat(activePrestamo.interes) / 100)).toLocaleString()} {activePrestamo.moneda}</p>
                        {isPaid && <CheckCircle2 size={16} className="absolute top-4 right-4 text-emerald-500" />}
                      </div>
                    );
                  })}
                 </div>
              </div>
            </div>
            <div className={`${isMobile ? '' : 'col-span-4'} space-y-6`}>
               <div className={`${isDark ? 'bg-black/20 border-white/5' : 'bg-white border-neutral-200'} border rounded-[28px] p-8 shadow-2xl space-y-6`}>
                  <label className="text-[10px] text-neutral-500 block mb-4 font-black uppercase tracking-widest">Capital Invertido</label>
                  <div className={`flex items-center gap-4 ${isDark ? 'bg-white/5 border-white/5' : 'bg-neutral-50 border-neutral-200'} p-6 rounded-[24px] border`}><DollarSign className="text-neutral-400" size={24}/><input type="number" value={activePrestamo.capital} onChange={e=>setActivePrestamo({...activePrestamo, capital: e.target.value})} className={`bg-transparent text-4xl font-mono ${isDark ? 'text-white' : 'text-neutral-900'} outline-none w-full font-black tracking-tighter`} /></div>
                  <div className="grid grid-cols-2 gap-4">
                     <div><label className="text-[9px] text-neutral-500 block mb-2 font-black uppercase tracking-widest">Interés (%)</label><input type="number" value={activePrestamo.interes} onChange={e=>setActivePrestamo({...activePrestamo, interes: e.target.value})} className={`w-full ${isDark ? 'bg-white/5 border-white/5 text-emerald-500' : 'bg-neutral-50 border-neutral-200 text-emerald-600'} rounded-2xl p-4 text-2xl font-mono outline-none font-black`} /></div>
                     <div><label className="text-[9px] text-neutral-500 block mb-2 font-black uppercase tracking-widest">Moneda</label><select value={activePrestamo.moneda} onChange={e=>setActivePrestamo({...activePrestamo, moneda: e.target.value})} className={`w-full ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-neutral-50 border-neutral-200 text-neutral-900'} rounded-2xl p-4 text-xl font-bold outline-none appearance-none`}><option value="BOB">BOB</option><option value="USD">USD</option></select></div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default Prestamos;
