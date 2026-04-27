import React, { useState } from 'react';
import { 
  Plus, ChevronRight, ArrowLeft, Save, FileSignature, Smartphone, DollarSign, 
  Briefcase, FolderOpen, FileText, ImageIcon, ExternalLink, Trash2 
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

const Prestamos = ({ data, setData }) => {
  const [prestamoView, setPrestamoView] = useState('list'); 
  const [activePrestamo, setActivePrestamo] = useState(null);
  const [loading, setLoading] = useState(false);

  const openPrestamo = (prestamo) => { setActivePrestamo(prestamo); setPrestamoView('detail'); };
  
  const closePrestamo = async () => {
    if (activePrestamo) {
      await handleSave();
    }
    setPrestamoView('list'); 
    setActivePrestamo(null);
  };

  const createPrestamo = () => {
    const newPrestamo = { 
      id: crypto.randomUUID(), 
      nombre: 'Nuevo Cliente', 
      ci: '', 
      telefono: '', 
      capital: 0, 
      interes: 0, 
      inicio: new Date().toISOString().split('T')[0], 
      fin: '', 
      estado: 'Pendiente', 
      garantia: '', 
      drive_contrato: '', 
      drive_fotos: '' 
    };
    setActivePrestamo(newPrestamo); 
    setPrestamoView('detail');
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation(); // Evitar que se abra el detalle al hacer clic en borrar
    if (!confirm('¿Estás seguro de eliminar este préstamo? Esta acción no se puede deshacer.')) return;

    try {
      const { error } = await supabase.from('prestamos').delete().eq('id', id);
      if (error) throw error;
      
      const updatedPrestamos = data.prestamos.filter(p => p.id !== id);
      setData({...data, prestamos: updatedPrestamos});
    } catch (error) {
      alert('Error al borrar: ' + error.message);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('prestamos')
        .upsert({
          id: activePrestamo.id,
          nombre: activePrestamo.nombre,
          ci: activePrestamo.ci,
          telefono: activePrestamo.telefono,
          capital: parseFloat(activePrestamo.capital),
          interes: parseFloat(activePrestamo.interes),
          inicio: activePrestamo.inicio,
          fin: activePrestamo.fin,
          estado: activePrestamo.estado,
          garantia: activePrestamo.garantia,
          drive_contrato: activePrestamo.drive_contrato,
          drive_fotos: activePrestamo.drive_fotos
        });

      if (error) throw error;
      
      const updatedPrestamos = data.prestamos.some(p => p.id === activePrestamo.id)
        ? data.prestamos.map(p => p.id === activePrestamo.id ? activePrestamo : p)
        : [...data.prestamos, activePrestamo];
        
      setData({...data, prestamos: updatedPrestamos});
    } catch (error) {
      console.error('Error guardando en Supabase:', error.message);
      alert('Error al guardar: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-[1200px] w-full">
      {prestamoView === 'list' && (
        <div className="animate-in fade-in duration-300">
          <header className="mb-6 flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-light text-white tracking-tight">Cartera de Préstamos</h2>
              <p className="text-[11px] text-neutral-500 uppercase tracking-widest mt-1">Gestión de capital y garantías</p>
            </div>
            <button onClick={createPrestamo} className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5">
              <Plus size={14} /> Nuevo Préstamo
            </button>
          </header>

          <div className="bg-[#0a0a0a] border border-white/[0.05] rounded-xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-black/40 border-b border-white/[0.05]">
                  <th className="px-4 py-3 text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Acreditado</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Capital e Interés</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Vencimiento</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-neutral-500 uppercase tracking-widest text-right">Acción</th>
                </tr>
              </thead>
              <tbody>
                {data.prestamos.map(p => (
                  <tr key={p.id} onClick={() => openPrestamo(p)} className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors cursor-pointer group">
                    <td className="px-4 py-4">
                      <p className="text-sm text-white font-medium">{p.nombre}</p>
                      <p className="text-[10px] text-neutral-500 mt-0.5">CI: {p.ci} | Tel: {p.telefono}</p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm font-mono text-amber-500 font-medium">{p.capital} Bs.</p>
                      <p className="text-[10px] text-neutral-500 mt-0.5">{p.interes}% Mensual</p>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest ${p.estado === 'Alerta' ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' : 'bg-white/5 text-neutral-400 border border-white/5'}`}>
                        {p.fin || 'Sin fecha'}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right flex items-center justify-end gap-2">
                       <button onClick={(e) => handleDelete(p.id, e)} className="p-2 text-neutral-600 hover:text-rose-500 transition-colors">
                         <Trash2 size={14} />
                       </button>
                       <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[9px] font-bold uppercase bg-white/5 text-neutral-400 group-hover:text-white transition-colors">
                         Expediente <ChevronRight size={10}/>
                       </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {prestamoView === 'detail' && activePrestamo && (
        <div className="animate-in slide-in-from-right-4 duration-300">
          <div className="flex items-center gap-2 mb-4 text-xs text-neutral-500 cursor-pointer hover:text-white w-max" onClick={closePrestamo}>
            <ArrowLeft size={12} /> Volver a la Cartera
          </div>
          
          <header className="mb-6 flex justify-between items-end pb-4 border-b border-white/5">
            <div>
              <h2 className="text-3xl font-semibold text-white tracking-tight flex items-center gap-3">
                <input type="text" value={activePrestamo.nombre} onChange={e=>setActivePrestamo({...activePrestamo, nombre: e.target.value})} className="bg-transparent outline-none w-[300px]" placeholder="Nombre del Cliente" />
              </h2>
              <div className="flex items-center gap-4 mt-2">
                <span className="text-[10px] font-mono text-neutral-400 bg-white/5 px-2 py-1 rounded border border-white/5 flex items-center gap-1.5"><FileSignature size={12}/> CI: <input type="text" value={activePrestamo.ci} onChange={e=>setActivePrestamo({...activePrestamo, ci: e.target.value})} className="bg-transparent outline-none w-20 text-white" placeholder="Ej: 8432122"/></span>
                <span className="text-[10px] font-mono text-neutral-400 bg-white/5 px-2 py-1 rounded border border-white/5 flex items-center gap-1.5"><Smartphone size={12}/> Tel: <input type="text" value={activePrestamo.telefono} onChange={e=>setActivePrestamo({...activePrestamo, telefono: e.target.value})} className="bg-transparent outline-none w-24 text-white" placeholder="+591..."/></span>
              </div>
            </div>
            <button onClick={closePrestamo} className="px-5 py-2 bg-amber-500 text-black text-[11px] font-bold rounded-md hover:bg-amber-400 transition-colors flex items-center gap-1.5">
              <Save size={14}/> Guardar Expediente
            </button>
          </header>

          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-5 flex flex-col gap-6">
              <div className="bg-[#0a0a0a] border border-white/[0.05] rounded-xl p-5">
                <h3 className="text-[10px] font-bold tracking-widest uppercase text-neutral-500 mb-4 flex items-center gap-1.5"><DollarSign size={12}/> Datos de Capital</h3>
                <div className="space-y-4">
                  <div className="bg-black/40 border border-white/5 rounded-lg p-3">
                    <label className="text-[10px] text-neutral-500 block mb-1">Monto Prestado (Bs.)</label>
                    <input type="number" value={activePrestamo.capital} onChange={e=>setActivePrestamo({...activePrestamo, capital: e.target.value})} className="bg-transparent text-2xl font-mono text-amber-500 outline-none w-full font-medium" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-black/40 border border-white/5 rounded-lg p-3">
                      <label className="text-[10px] text-neutral-500 block mb-1">Interés (%)</label>
                      <input type="number" value={activePrestamo.interes} onChange={e=>setActivePrestamo({...activePrestamo, interes: e.target.value})} className="bg-transparent text-lg font-mono text-white outline-none w-full" />
                    </div>
                    <div className="bg-black/40 border border-white/5 rounded-lg p-3">
                      <label className="text-[10px] text-neutral-500 block mb-1">Vencimiento</label>
                      <input type="text" value={activePrestamo.fin} onChange={e=>setActivePrestamo({...activePrestamo, fin: e.target.value})} className="bg-transparent text-sm text-white outline-none w-full" placeholder="Ej: 01 Dic, 2024" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-span-7 flex flex-col gap-6">
              <div className="bg-[#0a0a0a] border border-white/[0.05] rounded-xl p-5">
                <h3 className="text-[10px] font-bold tracking-widest uppercase text-neutral-500 mb-3 flex items-center gap-1.5"><Briefcase size={12}/> Descripción de Garantía</h3>
                <textarea value={activePrestamo.garantia} onChange={e=>setActivePrestamo({...activePrestamo, garantia: e.target.value})} placeholder="Describe el objeto, vehículo o inmueble dejado en garantía..." className="w-full bg-black/40 border border-white/5 rounded-lg p-3 text-sm text-white outline-none focus:border-amber-500/50 min-h-[80px] resize-none" />
              </div>

              <div className="bg-gradient-to-br from-blue-500/[0.02] to-transparent border border-blue-500/10 rounded-xl p-5 flex-1">
                <h3 className="text-[10px] font-bold tracking-widest uppercase text-blue-400 mb-4 flex items-center gap-1.5"><FolderOpen size={12}/> Repositorio Documental (Drive)</h3>
                <div className="space-y-4">
                  <div className="bg-black/40 border border-white/5 rounded-lg p-3 relative group">
                    <label className="text-[10px] text-neutral-500 flex items-center gap-1.5 mb-2"><FileText size={12} className="text-neutral-400"/> Carpeta de Contratos (PDF)</label>
                    <input type="text" value={activePrestamo.drive_contrato} onChange={e=>setActivePrestamo({...activePrestamo, drive_contrato: e.target.value})} className="w-full bg-transparent text-xs text-white outline-none border-b border-white/10 pb-1 focus:border-blue-500/50" placeholder="https://drive.google.com/..." />
                    {activePrestamo.drive_contrato && (
                      <a href={activePrestamo.drive_contrato} target="_blank" rel="noreferrer" className="absolute top-3 right-3 text-[9px] bg-blue-500/10 text-blue-400 px-2 py-1 rounded font-bold uppercase flex items-center gap-1 hover:bg-blue-500/20 transition-colors">Abrir <ExternalLink size={10}/></a>
                    )}
                  </div>
                  <div className="bg-black/40 border border-white/5 rounded-lg p-3 relative group">
                    <label className="text-[10px] text-neutral-500 flex items-center gap-1.5 mb-2"><ImageIcon size={12} className="text-amber-500"/> Fotos CI y Garantía (Imágenes)</label>
                    <input type="text" value={activePrestamo.drive_fotos} onChange={e=>setActivePrestamo({...activePrestamo, drive_fotos: e.target.value})} className="w-full bg-transparent text-xs text-white outline-none border-b border-white/10 pb-1 focus:border-amber-500/50" placeholder="https://drive.google.com/..." />
                    {activePrestamo.drive_fotos && (
                      <a href={activePrestamo.drive_fotos} target="_blank" rel="noreferrer" className="absolute top-3 right-3 text-[9px] bg-amber-500/10 text-amber-500 px-2 py-1 rounded font-bold uppercase flex items-center gap-1 hover:bg-amber-500/20 transition-colors">Ver Fotos <ExternalLink size={10}/></a>
                    )}
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
