import React, { useState, useEffect } from 'react';
import { 
  Calendar, Clock, AlertCircle, Plus, Search, Trash2, 
  CheckCircle2, Circle, Zap, Bell, TrendingUp,
  ShoppingCart, Lightbulb, X, User, DollarSign, FileText
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

const Recordatorios = ({ settings, isDark }) => {
  const [recordatorios, setRecordatorios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('Todos');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [subtareasTemp, setSubtareasTemp] = useState([]);
  const [nuevaSubtarea, setNuevaSubtarea] = useState('');

  const [nuevoRecordatorio, setNuevoRecordatorio] = useState({
    titulo: '',
    descripcion: '',
    fecha: '',
    fecha_fin: '',
    prioridad: 'Media',
    categoria: 'Tarea',
    estado: 'Pendiente',
    monto: 0,
    nombre_contacto: '',
    recurrencia: 'Ninguna'
  });

  useEffect(() => {
    fetchRecordatorios();
  }, []);

  const fetchRecordatorios = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('recordatorios')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setRecordatorios(data || []);
    } catch (e) {
      console.error("Error cargando recordatorios:", e);
    } finally {
      setLoading(false);
    }
  };

  const addSubtarea = () => {
    if (!nuevaSubtarea) return;
    setSubtareasTemp([...subtareasTemp, { id: Date.now(), texto: nuevaSubtarea, completado: false }]);
    setNuevaSubtarea('');
  };

  const toggleSubtarea = async (recordatorioId, subtareaId, currentSubtareas) => {
    const updated = currentSubtareas.map(st => 
      st.id === subtareaId ? { ...st, completado: !st.completado } : st
    );
    try {
      const { error } = await supabase
        .from('recordatorios')
        .update({ subtareas: updated })
        .eq('id', recordatorioId);
      if (error) throw error;
      fetchRecordatorios();
    } catch (e) { console.error(e); }
  };

  const handleCreate = async () => {
    if (!nuevoRecordatorio.titulo) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('recordatorios')
        .insert([{
          ...nuevoRecordatorio,
          fecha: nuevoRecordatorio.fecha || null,
          fecha_fin: nuevoRecordatorio.fecha_fin || null,
          subtareas: subtareasTemp,
          id: crypto.randomUUID(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }]);
      
      if (error) throw error;
      
      setIsModalOpen(false);
      setSubtareasTemp([]);
      setNuevoRecordatorio({
        titulo: '', descripcion: '', fecha: '', fecha_fin: '', prioridad: 'Media', categoria: 'Tarea', estado: 'Pendiente', monto: 0, nombre_contacto: '', recurrencia: 'Ninguna'
      });
      await fetchRecordatorios();
    } catch (e) {
      alert("❌ ERROR: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleEstado = async (id, estadoActual) => {
    const nuevoEstado = estadoActual === 'Pendiente' ? 'Completado' : 'Pendiente';
    try {
      const { error } = await supabase
        .from('recordatorios')
        .update({ estado: nuevoEstado })
        .eq('id', id);
      
      if (error) throw error;
      fetchRecordatorios();
    } catch (e) {
      console.error(e);
    }
  };

  const deleteRecordatorio = async (id) => {
    if (!confirm("¿Eliminar este recordatorio?")) return;
    try {
      const { error } = await supabase
        .from('recordatorios')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      fetchRecordatorios();
    } catch (e) {
      console.error(e);
    }
  };

  const stats = {
    total: recordatorios.length,
    pendientes: recordatorios.filter(r => r.estado === 'Pendiente').length,
    criticos: recordatorios.filter(r => r.prioridad === 'Crítica' && r.estado === 'Pendiente').length,
    gastos: recordatorios.filter(r => r.estado === 'Pendiente').reduce((acc, curr) => acc + (parseFloat(curr.monto) || 0), 0)
  };

  const getPriorityColor = (p) => {
    switch(p) {
      case 'Crítica': return 'text-rose-500 border-rose-500/20 bg-rose-500/5';
      case 'Alta': return 'text-amber-500 border-amber-500/20 bg-amber-500/5';
      case 'Media': return 'text-blue-500 border-blue-500/20 bg-blue-500/5';
      default: return 'text-emerald-500 border-emerald-500/20 bg-emerald-500/5';
    }
  };

  const filtered = recordatorios.filter(r => {
    const matchesSearch = r.titulo.toLowerCase().includes(searchTerm.toLowerCase());
    if (activeFilter === 'Todos') return matchesSearch;
    return r.categoria === activeFilter && matchesSearch;
  });

  return (
    <div className="flex flex-col h-full w-full animate-in fade-in duration-700">
      
      <header className="mb-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-10">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20">
                <Bell size={28} />
              </div>
              <h2 className="text-2xl font-black text-white uppercase tracking-tighter leading-none">
                Recordatorios
              </h2>
            </div>
          </div>

          <button 
            onClick={() => setIsModalOpen(true)}
            className="px-8 py-4 bg-white text-black rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-500 transition-all flex items-center gap-3 shadow-2xl active:scale-95"
          >
            <Plus size={16} /> Crear Recordatorio
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { label: 'Carga Operativa', val: stats.pendientes, icon: Clock, color: 'text-white' },
            { label: 'Prioridad Crítica', val: stats.criticos, icon: AlertCircle, color: 'text-rose-500' },
            { label: 'Flujo Estimado', val: stats.gastos.toLocaleString() + ' BS', icon: TrendingUp, color: 'text-amber-500' },
            { label: 'Completado', val: stats.total > 0 ? Math.round(((stats.total - stats.pendientes) / stats.total) * 100) + '%' : '0%', icon: CheckCircle2, color: 'text-emerald-500' }
          ].map((kpi, i) => (
            <div key={i} className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-6 flex items-center gap-5 hover:border-white/10 transition-colors">
              <div className={`p-4 rounded-2xl bg-black/40 ${kpi.color}`}>
                <kpi.icon size={20} />
              </div>
              <div>
                <p className="text-[9px] text-neutral-600 font-black uppercase tracking-widest">{kpi.label}</p>
                <h4 className={`text-2xl font-black ${kpi.color} tracking-tighter whitespace-nowrap`}>{kpi.val}</h4>
              </div>
            </div>
          ))}
        </div>
      </header>

      <div className="flex flex-col md:flex-row gap-6 mb-10 items-center justify-between">
        <div className="flex bg-black rounded-2xl p-1.5 border border-white/5 w-full md:w-auto overflow-x-auto mac-scrollbar">
          {['Todos', 'Tarea', 'Compra', 'Idea', 'Nota'].map(f => (
            <button 
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeFilter === f ? 'bg-white text-black shadow-xl' : 'text-neutral-600 hover:text-white'}`}
            >
              {f === 'Todos' ? 'Todos' : f === 'Nota' ? 'Apuntes' : `${f}s`}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-[400px]">
          <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-neutral-700" />
          <input 
            type="text" 
            placeholder="Buscar recordatorios o apuntes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/[0.02] border border-white/5 rounded-2xl py-4 pl-14 pr-6 text-xs text-white outline-none focus:border-amber-500/30 transition-all"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* COLUMNA DE ACCIÓN: Tareas y Compras */}
        <div className="space-y-12">
          {[
            { key: 'Tarea', label: 'Tareas y Pendientes', icon: Zap, color: 'emerald' },
            { key: 'Compra', label: 'Lista de Compras', icon: ShoppingCart, color: 'amber' }
          ].map(cat => (
            <section key={cat.key} className="space-y-6">
              <div className="flex items-center gap-3 px-4 py-2 border-l-2 border-amber-500 bg-white/[0.01]">
                <cat.icon size={16} className="text-amber-500" />
                <h3 className="text-[11px] font-black text-white uppercase tracking-[0.3em]">{cat.label}</h3>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {filtered
                  .filter(r => r.categoria === cat.key || (cat.key === 'Tarea' && !['Compra', 'Idea', 'Nota'].includes(r.categoria)))
                  .map(r => (
                    <RecordatorioCard key={r.id} r={r} onToggle={toggleEstado} onSubToggle={toggleSubtarea} onDelete={deleteRecordatorio} colorFunc={getPriorityColor} />
                  ))}
              </div>
            </section>
          ))}
        </div>

        {/* COLUMNA DE CONOCIMIENTO: Ideas y Apuntes */}
        <div className="space-y-12">
          {[
            { key: 'Idea', label: 'Laboratorio de Ideas', icon: Lightbulb, color: 'blue' },
            { key: 'Nota', label: 'Apuntes Rápidos', icon: FileText, color: 'purple' }
          ].map(cat => (
            <section key={cat.key} className="space-y-6">
              <div className="flex items-center gap-3 px-4 py-2 border-l-2 border-emerald-500 bg-white/[0.01]">
                <cat.icon size={16} className="text-emerald-500" />
                <h3 className="text-[11px] font-black text-white uppercase tracking-[0.3em]">{cat.label}</h3>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {filtered
                  .filter(r => r.categoria === cat.key)
                  .map(r => (
                    <RecordatorioCard key={r.id} r={r} onToggle={toggleEstado} onSubToggle={toggleSubtarea} onDelete={deleteRecordatorio} colorFunc={getPriorityColor} />
                  ))}
              </div>
            </section>
          ))}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-2xl z-[600] flex items-center justify-center p-4">
          <div className="bg-[#0a0a0a] border border-white/10 w-full max-w-2xl rounded-[2.5rem] p-10 animate-in zoom-in duration-300 max-h-[90vh] overflow-y-auto mac-scrollbar">
            <header className="flex justify-between items-center mb-10">
               <div>
                 <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Nuevo <span className="text-amber-500">Recordatorio</span></h3>
                 <p className="text-[9px] text-neutral-600 font-black uppercase tracking-widest mt-1">Sincronización con vida personal</p>
               </div>
               <button onClick={() => setIsModalOpen(false)} className="text-neutral-700 hover:text-white transition-colors"><X size={24}/></button>
            </header>

            <div className="space-y-6">
              <div className="space-y-2">
                <p className="text-[9px] text-neutral-600 font-black uppercase ml-2 tracking-widest">Título / Asunto</p>
                <input 
                  type="text" 
                  value={nuevoRecordatorio.titulo}
                  onChange={e => setNuevoRecordatorio({...nuevoRecordatorio, titulo: e.target.value})}
                  placeholder="Ej: Comprar café de especialidad..."
                  className="w-full bg-white/[0.03] border border-white/5 rounded-2xl p-5 text-sm text-white font-bold outline-none focus:border-amber-500/30 transition-all"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <p className="text-[9px] text-neutral-600 font-black uppercase ml-2 tracking-widest">Persona Relacionada</p>
                  <input 
                    type="text" 
                    value={nuevoRecordatorio.nombre_contacto}
                    onChange={e => setNuevoRecordatorio({...nuevoRecordatorio, nombre_contacto: e.target.value})}
                    placeholder="Nombre..."
                    className="w-full bg-white/[0.03] border border-white/5 rounded-2xl p-5 text-xs text-white outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <p className="text-[9px] text-neutral-600 font-black uppercase ml-2 tracking-widest">Monto Estimado (BS)</p>
                  <input 
                    type="number" 
                    value={nuevoRecordatorio.monto}
                    onChange={e => setNuevoRecordatorio({...nuevoRecordatorio, monto: e.target.value})}
                    className="w-full bg-white/[0.03] border border-white/5 rounded-2xl p-5 text-xs text-white outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <p className="text-[9px] text-neutral-600 font-black uppercase ml-2 tracking-widest">Recurrencia</p>
                  <select 
                    value={nuevoRecordatorio.recurrencia}
                    onChange={e => setNuevoRecordatorio({...nuevoRecordatorio, recurrencia: e.target.value})}
                    className="w-full bg-white/[0.03] border border-white/5 rounded-2xl p-5 text-[10px] font-black text-white uppercase outline-none"
                  >
                    <option value="Ninguna">Único</option>
                    <option value="Mensual">Mensual</option>
                    <option value="Bimestral">Bimestral</option>
                    <option value="Trimestral">Trimestral</option>
                    <option value="Anual">Anual</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <p className="text-[9px] text-neutral-600 font-black uppercase ml-2 tracking-widest">Inicio</p>
                  <input 
                    type="date" 
                    value={nuevoRecordatorio.fecha}
                    onChange={e => setNuevoRecordatorio({...nuevoRecordatorio, fecha: e.target.value})}
                    className="w-full bg-white/[0.03] border border-white/5 rounded-2xl p-5 text-xs text-white outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <p className="text-[9px] text-neutral-600 font-black uppercase ml-2 tracking-widest">Vencimiento</p>
                  <input 
                    type="date" 
                    value={nuevoRecordatorio.fecha_fin}
                    onChange={e => setNuevoRecordatorio({...nuevoRecordatorio, fecha_fin: e.target.value})}
                    className="w-full bg-white/[0.03] border border-white/5 rounded-2xl p-5 text-xs text-white outline-none"
                  />
                </div>
              </div>

              <div className="space-y-4 p-6 bg-black/40 rounded-[2rem] border border-white/5">
                <p className="text-[9px] text-neutral-600 font-black uppercase tracking-widest">Lista de Items / Pasos</p>
                <div className="flex gap-2">
                   <input 
                    type="text" 
                    value={nuevaSubtarea}
                    onChange={e => setNuevaSubtarea(e.target.value)}
                    placeholder="Añadir ítem..."
                    className="flex-1 bg-white/[0.03] border border-white/5 rounded-xl px-4 py-3 text-xs text-white outline-none"
                    onKeyDown={e => e.key === 'Enter' && addSubtarea()}
                   />
                   <button onClick={addSubtarea} className="p-3 bg-white text-black rounded-xl hover:bg-amber-500 transition-all"><Plus size={16}/></button>
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto mac-scrollbar pr-2">
                   {subtareasTemp.map(st => (
                     <div key={st.id} className="flex items-center justify-between bg-white/[0.02] p-3 rounded-xl border border-white/5">
                        <span className="text-[10px] text-neutral-400 font-bold">{st.texto}</span>
                        <button onClick={() => setSubtareasTemp(subtareasTemp.filter(i => i.id !== st.id))} className="text-neutral-700 hover:text-rose-500 transition-all"><Trash2 size={14}/></button>
                     </div>
                   ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-[9px] text-neutral-600 font-black uppercase ml-2 tracking-widest">Categoría</p>
                  <select 
                    value={nuevoRecordatorio.categoria}
                    onChange={e => setNuevoRecordatorio({...nuevoRecordatorio, categoria: e.target.value})}
                    className="w-full bg-white/[0.03] border border-white/5 rounded-2xl p-5 text-[10px] font-black text-white uppercase outline-none"
                  >
                    <option value="Tarea">Tarea</option>
                    <option value="Compra">Compra</option>
                    <option value="Idea">Idea</option>
                    <option value="Nota">Apunte Personal</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <p className="text-[9px] text-neutral-600 font-black uppercase ml-2 tracking-widest">Prioridad</p>
                  <select 
                    value={nuevoRecordatorio.prioridad}
                    onChange={e => setNuevoRecordatorio({...nuevoRecordatorio, prioridad: e.target.value})}
                    className="w-full bg-white/[0.03] border border-white/5 rounded-2xl p-5 text-[10px] font-black text-white uppercase outline-none"
                  >
                    <option value="Baja">Baja</option>
                    <option value="Media">Media</option>
                    <option value="Alta">Alta</option>
                    <option value="Crítica">Crítica</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex gap-4">
                 <button onClick={() => setIsModalOpen(false)} className="flex-1 py-4 text-neutral-600 font-black uppercase text-[10px] tracking-widest hover:text-white transition-all">Cancelar</button>
                 <button onClick={handleCreate} className="flex-[2] py-4 bg-amber-500 hover:bg-amber-400 text-black font-black uppercase text-[10px] tracking-[0.3em] rounded-2xl transition-all shadow-xl shadow-amber-500/10">Crear Recordatorio</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const RecordatorioCard = ({ r, onToggle, onSubToggle, onDelete, colorFunc }) => (
  <div className={`group relative bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-6 transition-all hover:bg-white/[0.04] ${r.estado === 'Completado' ? 'opacity-40' : ''}`}>
    <div className="flex gap-5 items-start">
      <button 
        onClick={() => onToggle(r.id, r.estado)}
        className={`mt-1.5 transition-all ${r.estado === 'Completado' ? 'text-emerald-500' : 'text-neutral-800 hover:text-neutral-600'}`}
      >
        {r.estado === 'Completado' ? <CheckCircle2 size={24} /> : <Circle size={24} />}
      </button>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-2">
          <h4 className={`text-sm font-black uppercase tracking-tight truncate ${r.estado === 'Completado' ? 'line-through text-neutral-600' : 'text-white'}`}>
            {r.titulo}
          </h4>
          <div className={`px-2 py-0.5 rounded-lg border text-[7px] font-black uppercase tracking-widest ${colorFunc(r.prioridad)}`}>
            {r.prioridad}
          </div>
        </div>

        {(r.nombre_contacto || r.monto > 0) && (
          <div className="flex flex-wrap gap-4 mb-4">
            {r.nombre_contacto && (
              <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/5 text-[9px] text-neutral-400 font-bold uppercase">
                <User size={10} className="text-amber-500" /> {r.nombre_contacto}
              </div>
            )}
            {r.monto > 0 && (
              <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/5 text-[9px] text-white font-black uppercase">
                <TrendingUp size={10} className="text-amber-500" /> {r.monto} BS
              </div>
            )}
          </div>
        )}

        <div className="flex flex-wrap gap-4 mb-4">
          {r.recurrencia && r.recurrencia !== 'Ninguna' && (
            <div className="flex items-center gap-2 text-[8px] text-emerald-500 font-black uppercase tracking-widest">
              <Zap size={10} /> {r.recurrencia}
            </div>
          )}
          {r.fecha && (
            <div className="flex items-center gap-1.5 text-[8px] text-neutral-600 font-black uppercase">
              <Clock size={10} /> {new Date(r.fecha).toLocaleDateString()} {r.fecha_fin ? `al ${new Date(r.fecha_fin).toLocaleDateString()}` : ''}
            </div>
          )}
        </div>

        {r.subtareas && r.subtareas.length > 0 && (
          <div className="space-y-2 mt-4 p-4 bg-black/30 rounded-2xl border border-white/5">
             {r.subtareas.map(st => (
               <div 
                key={st.id} 
                onClick={(e) => { e.stopPropagation(); onSubToggle(r.id, st.id, r.subtareas); }}
                className="flex items-center gap-3 cursor-pointer group/sub"
               >
                 {st.completado ? <CheckCircle2 size={14} className="text-emerald-500" /> : <Circle size={14} className="text-neutral-700 group-hover/sub:text-neutral-500" />}
                 <span className={`text-[10px] font-bold ${st.completado ? 'line-through text-neutral-600' : 'text-neutral-400'}`}>
                   {st.texto}
                 </span>
               </div>
             ))}
          </div>
        )}
      </div>

      <button 
        onClick={() => onDelete(r.id)}
        className="opacity-0 group-hover:opacity-100 p-2 text-neutral-800 hover:text-rose-500 transition-all shrink-0"
      >
        <Trash2 size={18} />
      </button>
    </div>
  </div>
);

export default Recordatorios;
