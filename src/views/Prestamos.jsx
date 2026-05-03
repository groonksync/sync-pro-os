import React, { useState, useEffect } from 'react';
import { 
  Plus, ChevronRight, ArrowLeft, Save, FileSignature, Smartphone, DollarSign, 
  Briefcase, FolderOpen, FileText, ImageIcon, ExternalLink, Trash2, Calendar, 
  CheckCircle2, Clock, MoreHorizontal, User, CreditCard, ArrowRight, TrendingUp,
  ShieldCheck, MapPin, Globe, AlertTriangle
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

const Prestamos = ({ data, setData, preSelectedId, onClearSelection }) => {
  const [prestamoView, setPrestamoView] = useState('list'); 
  const [activePrestamo, setActivePrestamo] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (preSelectedId && data?.prestamos) {
      const prestamo = data.prestamos.find(p => p.id === preSelectedId);
      if (prestamo) {
        openPrestamo(prestamo);
        if (onClearSelection) onClearSelection();
      }
    }
  }, [preSelectedId, data?.prestamos]);

  const openPrestamo = (prestamo) => { 
    if (!prestamo) return;
    const p = { 
      ...prestamo, 
      pagos: Array.isArray(prestamo.pagos) ? prestamo.pagos : [],
      moneda: prestamo.moneda || 'BOB',
      estado: prestamo.estado || 'Activo'
    };
    setActivePrestamo(p); 
    setPrestamoView('detail'); 
  };
  
  const closePrestamo = async () => {
    try {
      if (activePrestamo) {
        await handleSave();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setPrestamoView('list'); 
      setActivePrestamo(null);
    }
  };

  const createPrestamo = () => {
    const newPrestamo = { 
      id: Date.now().toString(), 
      nombre: '', 
      ci: '', 
      telefono: '', 
      capital: 0, 
      interes: 5, 
      moneda: 'BOB',
      inicio: new Date().toISOString().split('T')[0], 
      fin: new Date(new Date().setMonth(new Date().getMonth() + 6)).toISOString().split('T')[0], 
      estado: 'Activo', 
      garantia: '', 
      drive_contrato: '', 
      drive_fotos: '',
      pagos: []
    };
    setActivePrestamo(newPrestamo); 
    setPrestamoView('detail');
  };

  const handleSave = async () => {
    if (!activePrestamo) return;
    setLoading(true);
    try {
      const payload = {
        id: activePrestamo.id,
        nombre: activePrestamo.nombre || 'Sin Nombre',
        ci: activePrestamo.ci || '',
        telefono: activePrestamo.telefono || '',
        capital: parseFloat(activePrestamo.capital) || 0,
        interes: parseFloat(activePrestamo.interes) || 0,
        moneda: activePrestamo.moneda || 'BOB',
        inicio: activePrestamo.inicio || '',
        fin: activePrestamo.fin || '',
        estado: activePrestamo.estado || 'Activo',
        garantia: activePrestamo.garantia || '',
        drive_contrato: activePrestamo.drive_contrato || '',
        drive_fotos: activePrestamo.drive_fotos || '',
        pagos: activePrestamo.pagos || []
      };

      const { error } = await supabase.from('prestamos').upsert(payload);
      if (error) throw error;
      
      const currentPrestamos = Array.isArray(data?.prestamos) ? data.prestamos : [];
      const updatedPrestamos = currentPrestamos.some(p => p.id === activePrestamo.id)
        ? currentPrestamos.map(p => p.id === activePrestamo.id ? activePrestamo : p)
        : [...currentPrestamos, activePrestamo];
        
      setData({...data, prestamos: updatedPrestamos});
    } catch (error) {
      alert('Error al guardar: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const togglePago = (mes) => {
    if (!activePrestamo) return;
    const currentPagos = Array.isArray(activePrestamo.pagos) ? activePrestamo.pagos : [];
    const newPagos = currentPagos.includes(mes)
      ? currentPagos.filter(m => m !== mes)
      : [...currentPagos, mes];
    
    setActivePrestamo({ ...activePrestamo, pagos: newPagos });
  };

  const extenderMeses = (num) => {
    if (!activePrestamo?.fin) return;
    const currentFin = new Date(activePrestamo.fin);
    const newFin = new Date(currentFin.setMonth(currentFin.getMonth() + num));
    setActivePrestamo({ ...activePrestamo, fin: newFin.toISOString().split('T')[0] });
  };

  const generateTimeline = () => {
    if (!activePrestamo?.inicio || !activePrestamo?.fin) return [];
    const start = new Date(activePrestamo.inicio);
    const end = new Date(activePrestamo.fin);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return [];

    const months = [];
    let current = new Date(start.getFullYear(), start.getMonth(), 1);
    const endMonth = new Date(end.getFullYear(), end.getMonth(), 1);
    
    while (current <= endMonth) {
      const mesKey = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
      months.push({
        key: mesKey,
        label: current.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }),
        date: new Date(current)
      });
      current.setMonth(current.getMonth() + 1);
    }
    return months;
  };

  const prestamosList = Array.isArray(data?.prestamos) ? data.prestamos : [];

  return (
    <div className="flex flex-col h-full w-full animate-in fade-in duration-500">
      {prestamoView === 'list' ? (
        <div className="animate-in fade-in duration-300">
          <header className="mb-10 flex justify-between items-end">
            <div>
              <h2 className="text-4xl font-light text-white tracking-tight">Cartera de <span className="text-neutral-400 font-medium">Préstamos</span></h2>
              <p className="text-[10px] text-neutral-600 font-bold uppercase tracking-[0.3em] mt-2 flex items-center gap-2">
                <ShieldCheck size={14} /> Gestión de Capital Asegurado
              </p>
            </div>
            <button onClick={createPrestamo} className="px-8 py-4 bg-white text-black text-xs font-black rounded-2xl hover:bg-neutral-200 transition-all flex items-center gap-3 shadow-xl active:scale-95 uppercase tracking-widest">
              <Plus size={18} strokeWidth={4} /> Nuevo Registro
            </button>
          </header>

          <div className="bg-[#0a0a0a] border border-white/[0.05] rounded-[28px] overflow-hidden shadow-2xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-black/60 border-b border-white/[0.05]">
                  <th className="px-8 py-5 text-[10px] font-black text-neutral-500 uppercase tracking-widest">Acreditado</th>
                  <th className="px-8 py-5 text-[10px] font-black text-neutral-500 uppercase tracking-widest">Capital Invertido</th>
                  <th className="px-8 py-5 text-[10px] font-black text-neutral-500 uppercase tracking-widest">Interés (Monto)</th>
                  <th className="px-8 py-5 text-[10px] font-black text-neutral-500 uppercase tracking-widest text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {prestamosList.map(p => (
                  <tr key={p.id} onClick={() => openPrestamo(p)} className="border-b border-white/[0.02] hover:bg-white/[0.04] transition-all cursor-pointer group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-neutral-400 group-hover:bg-white group-hover:text-black transition-all">
                          <User size={18} />
                        </div>
                        <div>
                          <p className="text-sm text-white font-bold">{p.nombre || 'Sin Nombre'}</p>
                          <p className="text-[10px] text-neutral-500 mt-1 uppercase font-bold tracking-widest">{p.estado}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-base font-mono text-white font-black">{parseFloat(p.capital).toLocaleString()} <span className="text-[10px] opacity-40 font-sans">{p.moneda}</span></p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-base font-mono text-emerald-500 font-black">
                        {(parseFloat(p.capital) * (parseFloat(p.interes) / 100)).toLocaleString()} <span className="text-[10px] opacity-40 font-sans">{p.moneda}</span>
                      </p>
                      <p className="text-[9px] text-emerald-900 font-black uppercase mt-1">Interés al {p.interes}%</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="p-3 bg-white/5 rounded-xl text-neutral-500 hover:text-white transition-all"><ChevronRight size={18} /></button>
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="animate-in slide-in-from-right-8 duration-500">
          <div className="flex items-center gap-2 mb-10 text-xs text-neutral-500 cursor-pointer hover:text-white w-max transition-colors group font-bold uppercase tracking-widest" onClick={closePrestamo}>
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Volver a la Cartera
          </div>
          
          <header className="mb-12 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center text-white shadow-2xl border border-white/5">
                <User size={40} />
              </div>
              <div>
                <input 
                  type="text" 
                  value={activePrestamo.nombre} 
                  onChange={e=>setActivePrestamo({...activePrestamo, nombre: e.target.value})} 
                  className="text-4xl font-black text-white bg-transparent outline-none w-full border-b-2 border-transparent focus:border-white/10 transition-colors tracking-tight" 
                  placeholder="Nombre del Cliente" 
                />
                <div className="flex items-center gap-4 mt-3">
                  <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl border border-white/5">
                    <FileSignature size={14} className="text-neutral-500" />
                    <input type="text" value={activePrestamo.ci} onChange={e=>setActivePrestamo({...activePrestamo, ci: e.target.value})} className="bg-transparent outline-none w-28 text-xs text-white font-bold" placeholder="CÉDULA CI..."/>
                  </div>
                  <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl border border-white/5">
                    <Smartphone size={14} className="text-neutral-500" />
                    <input type="text" value={activePrestamo.telefono} onChange={e=>setActivePrestamo({...activePrestamo, telefono: e.target.value})} className="bg-transparent outline-none w-28 text-xs text-white font-bold" placeholder="WHATSAPP..."/>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-4">
              <button onClick={closePrestamo} className="px-8 py-4 bg-white text-black text-xs font-black rounded-2xl hover:bg-neutral-200 transition-all flex items-center gap-3 shadow-2xl active:scale-95 uppercase tracking-widest">
                <Save size={20}/> Guardar Cambios
              </button>
            </div>
          </header>

          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12 lg:col-span-8 space-y-6">
              {/* Timeline de Pagos */}
              <div className="bg-[#0a0a0a] border border-white/[0.05] rounded-[28px] p-8 shadow-2xl">
                <div className="flex justify-between items-center mb-8">
                   <h3 className="text-xs font-black tracking-[0.2em] uppercase text-neutral-500 flex items-center gap-3">
                     <Calendar size={18} /> Cronograma de Cobros Mensuales
                   </h3>
                   <div className="flex gap-2">
                      {[1, 3, 6].map(num => (
                        <button key={num} onClick={() => extenderMeses(num)} className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-[10px] font-bold text-neutral-400 transition-all border border-white/5">+{num} Meses</button>
                      ))}
                   </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {generateTimeline().map((mes) => {
                    const isPaid = (activePrestamo.pagos || []).includes(mes.key);
                    return (
                      <div 
                        key={mes.key} 
                        onClick={() => togglePago(mes.key)}
                        className={`p-5 rounded-3xl border-2 cursor-pointer transition-all flex flex-col gap-2 relative overflow-hidden group ${
                          isPaid ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-black/40 border-white/5 hover:border-white/20'
                        }`}
                      >
                        <span className={`text-[10px] font-black uppercase tracking-widest ${isPaid ? 'text-emerald-500' : 'text-neutral-600'}`}>{mes.label}</span>
                        <p className={`text-sm font-mono font-bold ${isPaid ? 'text-white' : 'text-neutral-400 group-hover:text-white'}`}>
                          {(parseFloat(activePrestamo.capital) * (parseFloat(activePrestamo.interes) / 100)).toLocaleString()} {activePrestamo.moneda}
                        </p>
                        {isPaid && <CheckCircle2 size={16} className="absolute top-4 right-4 text-emerald-500" />}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Garantía y Enlaces */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="bg-[#0a0a0a] border border-white/[0.05] rounded-[24px] p-6 shadow-xl">
                    <h4 className="text-[10px] font-black text-neutral-600 uppercase tracking-widest mb-4 flex items-center gap-2"><ShieldCheck size={14}/> Garantía del Préstamo</h4>
                    <textarea 
                      value={activePrestamo.garantia} 
                      onChange={e=>setActivePrestamo({...activePrestamo, garantia: e.target.value})}
                      className="w-full bg-white/5 border border-white/5 rounded-2xl p-4 text-sm text-white min-h-[150px] outline-none focus:border-white/20 transition-all resize-none italic"
                      placeholder="Describa el bien en garantía..."
                    />
                 </div>
                 <div className="space-y-6">
                    <div className="bg-[#0a0a0a] border border-white/[0.05] rounded-[24px] p-6 shadow-xl">
                       <h4 className="text-[10px] font-black text-neutral-600 uppercase tracking-widest mb-4">Documentación Drive</h4>
                       <div className="space-y-4">
                          <div className="flex gap-2">
                             <input value={activePrestamo.drive_contrato} onChange={e=>setActivePrestamo({...activePrestamo, drive_contrato: e.target.value})} className="flex-1 bg-white/5 border border-white/5 rounded-xl px-4 py-2 text-[10px] text-neutral-400 outline-none" placeholder="Link Contrato..."/>
                             {activePrestamo.drive_contrato && <a href={activePrestamo.drive_contrato} target="_blank" rel="noreferrer" className="p-3 bg-white/5 rounded-xl text-white hover:bg-white hover:text-black transition-all"><ExternalLink size={14}/></a>}
                          </div>
                          <div className="flex gap-2">
                             <input value={activePrestamo.drive_fotos} onChange={e=>setActivePrestamo({...activePrestamo, drive_fotos: e.target.value})} className="flex-1 bg-white/5 border border-white/5 rounded-xl px-4 py-2 text-[10px] text-neutral-400 outline-none" placeholder="Link Fotos Garantía..."/>
                             {activePrestamo.drive_fotos && <a href={activePrestamo.drive_fotos} target="_blank" rel="noreferrer" className="p-3 bg-white/5 rounded-xl text-white hover:bg-white hover:text-black transition-all"><ExternalLink size={14}/></a>}
                          </div>
                       </div>
                    </div>
                 </div>
              </div>
            </div>

            <div className="col-span-12 lg:col-span-4 space-y-6">
               <div className="bg-[#0a0a0a] border border-white/[0.05] rounded-[28px] p-8 shadow-2xl space-y-6">
                  <div>
                    <label className="text-[10px] text-neutral-600 block mb-4 font-black uppercase tracking-[0.2em]">Capital Prestado</label>
                    <div className="flex items-center gap-4 bg-white/5 p-6 rounded-[24px] border border-white/5">
                       <DollarSign className="text-neutral-500" size={24}/>
                       <input type="number" value={activePrestamo.capital} onChange={e=>setActivePrestamo({...activePrestamo, capital: e.target.value})} className="bg-transparent text-4xl font-mono text-white outline-none w-full font-black" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="text-[10px] text-neutral-600 block mb-3 font-black uppercase tracking-widest">Interés (%)</label>
                      <input type="number" value={activePrestamo.interes} onChange={e=>setActivePrestamo({...activePrestamo, interes: e.target.value})} className="w-full bg-white/5 border border-white/5 rounded-2xl p-4 text-2xl font-mono text-emerald-500 outline-none font-black" />
                    </div>
                    <div>
                      <label className="text-[10px] text-neutral-600 block mb-3 font-black uppercase tracking-widest">Moneda</label>
                      <select value={activePrestamo.moneda} onChange={e=>setActivePrestamo({...activePrestamo, moneda: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-xl font-bold text-white outline-none appearance-none">
                         <option value="BOB">BOB</option>
                         <option value="USD">USD</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-8 border-t border-white/5 space-y-6">
                     <div className="flex justify-between items-center bg-black/40 p-5 rounded-3xl border border-white/5">
                        <div>
                           <p className="text-[9px] text-neutral-600 font-black uppercase mb-1">Fecha Inicio</p>
                           <input type="date" value={activePrestamo.inicio} onChange={e=>setActivePrestamo({...activePrestamo, inicio: e.target.value})} className="bg-transparent text-white font-mono font-bold text-xs outline-none" />
                        </div>
                        <ArrowRight size={16} className="text-neutral-700"/>
                        <div>
                           <p className="text-[9px] text-neutral-600 font-black uppercase mb-1 text-right">Vencimiento</p>
                           <input type="date" value={activePrestamo.fin} onChange={e=>setActivePrestamo({...activePrestamo, fin: e.target.value})} className="bg-transparent text-rose-500 font-mono font-bold text-xs outline-none text-right" />
                        </div>
                     </div>

                     <div>
                        <label className="text-[10px] text-neutral-600 block mb-3 font-black uppercase tracking-widest">Estado del Préstamo</label>
                        <select value={activePrestamo.estado} onChange={e=>setActivePrestamo({...activePrestamo, estado: e.target.value})} className={`w-full p-4 rounded-2xl font-black text-xs uppercase tracking-widest outline-none border transition-all ${
                          activePrestamo.estado === 'Activo' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-neutral-900 text-neutral-500 border-white/5'
                        }`}>
                           <option value="Activo">Activo</option>
                           <option value="Finalizado">Finalizado</option>
                           <option value="Mora">En Mora</option>
                        </select>
                     </div>
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
