import React, { useState, useEffect } from 'react';
import { 
  Trash2, 
  RotateCcw, 
  Trash, 
  Clock, 
  RefreshCw, 
  AlertCircle,
  XCircle,
  CheckCircle2,
  HardDrive
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

const TrashView = ({ settings }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTrashItems();
  }, []);

  const fetchTrashItems = async () => {
    setLoading(true);
    try {
      // 1. Cargar items
      const { data, error } = await supabase
        .from('papelera')
        .select('*')
        .order('borrado_el', { ascending: false });
      
      if (error) throw error;
      setItems(data || []);

      // 2. Limpieza automática de items expirados (mayor a 30 días)
      const now = new Date();
      const expiredItems = (data || []).filter(item => new Date(item.expira_el) < now);
      
      if (expiredItems.length > 0) {
        const ids = expiredItems.map(i => i.id);
        await supabase.from('papelera').delete().in('id', ids);
        setItems(prev => prev.filter(i => !ids.includes(i.id)));
      }

    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const restoreItem = async (item) => {
    if (!confirm(`¿Restaurar ${item.nombre_item}? Volverá a su vista original.`)) return;
    
    setLoading(true);
    try {
      let tableName = '';
      if (item.tipo_dato === 'cliente') tableName = 'clientes_editor';
      if (item.tipo_dato === 'sesion') tableName = 'reuniones';
      // Añadir más tipos aquí...

      if (tableName) {
        // Insertar de nuevo en la tabla original
        const { error: restoreError } = await supabase.from(tableName).insert(item.datos_originales);
        if (restoreError) throw restoreError;

        // Borrar de la papelera
        await supabase.from('papelera').delete().eq('id', item.id);
        
        setItems(prev => prev.filter(i => i.id !== item.id));
        alert('Item restaurado con éxito.');
      }
    } catch (e) {
      alert(`Error al restaurar: ${e.message}`);
    }
    setLoading(false);
  };

  const deleteForever = async (item) => {
    if (!confirm(`¿BORRAR DEFINITIVAMENTE ${item.nombre_item}? Esta acción es irreversible.`)) return;
    
    setLoading(true);
    try {
      await supabase.from('papelera').delete().eq('id', item.id);
      setItems(prev => prev.filter(i => i.id !== item.id));
    } catch (e) {
      alert(e.message);
    }
    setLoading(false);
  };

  const emptyTrash = async () => {
    if (!confirm('¿VACIAR TODA LA PAPELERA? Se borrará TODO de forma permanente del sistema.')) return;
    
    setLoading(true);
    try {
      await supabase.from('papelera').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      setItems([]);
      alert('Papelera vaciada.');
    } catch (e) {
      alert(e.message);
    }
    setLoading(false);
  };

  const getDaysLeft = (expiraEl) => {
    const diff = new Date(expiraEl) - new Date();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };

  return (
    <div className="flex flex-col h-full max-w-[1400px] w-full animate-in fade-in duration-500 p-8">
      <header className="flex justify-between items-end mb-10 border-b border-white/5 pb-8">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-rose-500/10 rounded-2xl text-rose-500 border border-rose-500/20 shadow-lg shadow-rose-500/10">
              <Trash2 size={24}/>
            </div>
            <h2 className="text-4xl font-black text-white tracking-tighter uppercase leading-none">Papelera <span className="text-neutral-800">Sovereign</span></h2>
          </div>
          <p className="text-[10px] text-neutral-600 font-black uppercase tracking-[0.3em] mt-3">Los items se borran definitivamente tras 30 días</p>
        </div>

        <div className="flex gap-4">
           <button 
             onClick={fetchTrashItems}
             className="p-4 bg-white/5 border border-white/10 rounded-2xl text-neutral-500 hover:text-white transition-all"
           >
             <RefreshCw size={20} className={loading ? 'animate-spin' : ''}/>
           </button>
           <button 
             onClick={emptyTrash}
             disabled={items.length === 0}
             className="px-8 py-4 bg-rose-500 text-black rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-rose-600 transition-all shadow-xl shadow-rose-500/20 disabled:opacity-30 flex items-center gap-3"
           >
             <Trash size={18}/> Vaciar Papelera
           </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto mac-scrollbar pr-4">
        {loading && items.length === 0 ? (
          <div className="py-40 flex flex-col items-center justify-center gap-4">
            <RefreshCw size={40} className="text-neutral-800 animate-spin" />
            <p className="text-[10px] text-neutral-700 font-black uppercase tracking-widest">Escaneando archivos borrados...</p>
          </div>
        ) : items.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {items.map(item => (
              <div key={item.id} className="bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] p-6 hover:border-white/20 transition-all group flex flex-col relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-50 group-hover:opacity-100 transition-opacity">
                   <div className="flex items-center gap-1.5 px-2.5 py-1 bg-rose-500/10 rounded-full border border-rose-500/20">
                     <Clock size={10} className="text-rose-500" />
                     <span className="text-[9px] font-black text-rose-500 uppercase">{getDaysLeft(item.expira_el)} días</span>
                   </div>
                </div>

                <div className="flex items-center gap-4 mb-6">
                   <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-neutral-700">
                      {item.tipo_dato === 'cliente' ? <RotateCcw size={24}/> : <HardDrive size={24}/>}
                   </div>
                   <div>
                      <p className="text-[9px] font-black text-neutral-700 uppercase tracking-widest mb-1">{item.tipo_dato}</p>
                      <h4 className="text-sm font-black text-white uppercase truncate max-w-[150px]">{item.nombre_item}</h4>
                   </div>
                </div>

                <div className="mt-auto pt-6 border-t border-white/5 flex gap-3">
                   <button 
                     onClick={() => restoreItem(item)}
                     className="flex-1 py-3 bg-white/5 border border-white/5 rounded-xl text-[9px] font-black uppercase tracking-widest text-neutral-400 hover:bg-emerald-500 hover:text-black hover:border-emerald-500 transition-all flex items-center justify-center gap-2"
                   >
                     <RefreshCw size={14}/> Restaurar
                   </button>
                   <button 
                     onClick={() => deleteForever(item)}
                     className="p-3 bg-white/5 border border-white/5 rounded-xl text-neutral-700 hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center"
                   >
                     <Trash size={16}/>
                   </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-40 flex flex-col items-center justify-center border border-dashed border-white/5 rounded-[40px] bg-white/[0.01]">
            <CheckCircle2 size={48} className="text-neutral-900 mb-6" />
            <h3 className="text-xl font-black text-white uppercase tracking-tighter">Papelera Impecable</h3>
            <p className="text-[10px] text-neutral-600 font-black uppercase tracking-widest mt-2">No hay archivos ni datos en el limbo</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrashView;
