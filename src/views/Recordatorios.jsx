import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar, Clock, AlertCircle, Plus, Search, Trash2, 
  CheckCircle2, Circle, Zap, Bell, TrendingUp,
  ShoppingCart, Lightbulb, X, User, DollarSign, FileText
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { getTheme } from '../lib/theme';

const Recordatorios = ({ settings, isDark }) => {
  const t = useMemo(() => getTheme(isDark), [isDark]);
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
    try {
      const { error } = await supabase
        .from('recordatorios')
        .insert([{
          ...nuevoRecordatorio,
          subtareas: subtareasTemp,
          estado: 'Pendiente',
          monto: parseFloat(nuevoRecordatorio.monto) || 0,
        }]);
      if (error) throw error;
      setIsModalOpen(false);
      setSubtareasTemp([]);
      setNuevoRecordatorio({
        titulo: '', descripcion: '', fecha: '', fecha_fin: '', prioridad: 'Media',
        categoria: 'Tarea', estado: 'Pendiente', monto: 0, nombre_contacto: '', recurrencia: 'Ninguna'
      });
      fetchRecordatorios();
    } catch (e) { console.error(e); }
  };

  const toggleEstado = async (id, estadoActual) => {
    const nuevoEstado = estadoActual === 'Completado' ? 'Pendiente' : 'Completado';
    try {
      await supabase.from('recordatorios').update({ estado: nuevoEstado }).eq('id', id);
      fetchRecordatorios();
    } catch (e) { console.error(e); }
  };

  const deleteRecordatorio = async (id) => {
    try {
      await supabase.from('recordatorios').delete().eq('id', id);
      fetchRecordatorios();
    } catch (e) { console.error(e); }
  };

  const stats = [
    { label: 'Total', val: recordatorios.length, icon: Bell },
    { label: 'Completados', val: recordatorios.filter(r => r.estado === 'Completado').length, icon: CheckCircle2 },
    { label: 'Pendientes', val: recordatorios.filter(r => r.estado !== 'Completado').length, icon: AlertCircle },
  ];

  const getPriorityColor = (p) => {
    switch(p) {
      case 'Crítica': return { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)', border: 'rgba(239, 68, 68, 0.25)' };
      case 'Alta': return { color: '#d4a04a', bg: 'rgba(212, 160, 74, 0.12)', border: 'rgba(212, 160, 74, 0.25)' };
      case 'Media': return { color: t.accent, bg: t.accentSoft, border: 'rgba(160, 160, 160, 0.2)' };
      default: return { color: '#7ecba0', bg: 'rgba(126, 203, 160, 0.12)', border: 'rgba(126, 203, 160, 0.25)' };
    }
  };

  const filtered = recordatorios.filter(r => {
    const term = searchTerm.toLowerCase();
    const matchSearch = !term || 
      r.titulo?.toLowerCase().includes(term) || 
      r.nombre_contacto?.toLowerCase().includes(term) ||
      r.monto?.toString().includes(term);
    const matchFilter = activeFilter === 'Todos' || r.categoria === activeFilter;
    return matchSearch && matchFilter;
  });

  const categories = [
    { key: 'Tarea', icon: FileText, label: 'Tareas y Obligaciones' },
    { key: 'Compra', icon: ShoppingCart, label: 'Compras Previstas' },
    { key: 'Idea', icon: Lightbulb, label: 'Ideas y Creatividad' },
    { key: 'Nota', icon: DollarSign, label: 'Apuntes Personales' },
  ];

  return (
    <div className="h-full w-full flex flex-col">
      {/* HEADER */}
      <header className="flex items-center justify-between mb-4 pb-3 border-b" style={{ borderColor: t.border }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: t.text, letterSpacing: '-0.02em', margin: 0 }}>Recordatorios</h2>
          <p style={{ fontSize: '0.75rem', color: t.textDim, marginTop: '4px', fontWeight: 500 }}>Sistema de Gestión de Tareas</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-semibold uppercase tracking-wider transition-all"
          style={{ backgroundColor: t.accent, color: t.bg }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = t.accentHover; }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = t.accent; }}
        >
          <Plus size={14} /> Nuevo
        </button>
      </header>

      {/* STATS */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {stats.map((kpi, i) => (
          <div key={i} className="flex items-center gap-3 transition-all"
            style={{ backgroundColor: t.panel, border: `1px solid ${t.border}`, borderRadius: 12, padding: '14px 16px' }}
          >
            <div style={{ backgroundColor: t.accentSoft, borderRadius: 10, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <kpi.icon size={16} color={t.accent} />
            </div>
            <div className="min-w-0">
              <p className="text-[8px] font-black uppercase tracking-widest" style={{ color: t.textDim }}>{kpi.label}</p>
              <h4 className="text-lg font-black tracking-tight truncate" style={{ color: t.text }}>{kpi.val}</h4>
            </div>
          </div>
        ))}
      </div>

      {/* FILTERS + SEARCH */}
      <div className="flex flex-col md:flex-row gap-3 mb-6 items-center justify-between">
        <div className="flex p-1 rounded-xl w-full md:w-auto overflow-x-auto mac-scrollbar" style={{ backgroundColor: t.panel, border: `1px solid ${t.border}` }}>
          {['Todos', 'Tarea', 'Compra', 'Idea', 'Nota'].map(f => (
            <button key={f} onClick={() => setActiveFilter(f)}
              className="px-3.5 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all whitespace-nowrap"
              style={{
                backgroundColor: activeFilter === f ? t.accent : 'transparent',
                color: activeFilter === f ? '#000000' : t.textDim,
              }}
            >{f}</button>
          ))}
        </div>
        <div className="relative w-full md:w-[320px]">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2" color={t.textDim} />
          <input
            type="text" value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Buscar recordatorio..."
            className="w-full rounded-xl py-3 pl-12 pr-4 text-xs outline-none transition-all"
            style={{
              backgroundColor: t.panel,
              border: `1px solid ${t.border}`,
              color: t.text,
            }}
            onFocus={e => { e.currentTarget.style.borderColor = t.accent; }}
            onBlur={e => { e.currentTarget.style.borderColor = t.border; }}
          />
        </div>
      </div>

      {/* LIST */}
      <div className="flex-1 overflow-y-auto mac-scrollbar space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: t.border, borderTopColor: t.accent }} />
          </div>
        ) : (
          categories.map(cat => {
            const items = filtered.filter(r => r.categoria === cat.key || (cat.key === 'Tarea' && !['Compra', 'Idea', 'Nota'].includes(r.categoria)));
            if (items.length === 0) return null;
            return (
              <section key={cat.key} className="space-y-3">
                <div className="flex items-center gap-3 px-3 py-2 rounded-lg" style={{ backgroundColor: t.accentSoft }}>
                  <cat.icon size={14} color={t.accent} />
                  <h3 className="text-[9px] font-black uppercase tracking-[0.2em]" style={{ color: t.text }}>{cat.label}</h3>
                </div>
                {items.length === 0 ? (
                  <div className="text-center py-6 rounded-xl" style={{ backgroundColor: t.accentSoft, border: `1px dashed ${t.border}` }}>
                    <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: t.textDim }}>Sin elementos</p>
                  </div>
                ) : (
                  items.map(r => (
                    <RecordatorioCard key={r.id} r={r} onToggle={toggleEstado} onSubToggle={toggleSubtarea} onDelete={deleteRecordatorio} colorFunc={getPriorityColor} isDark={isDark} />
                  ))
                )}
              </section>
            );
          })
        )}
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4" style={{ backgroundColor: t.overlay, backdropFilter: 'blur(24px)' }}>
          <div className="w-full max-w-lg rounded-2xl p-6 animate-in zoom-in duration-300 max-h-[90vh] overflow-y-auto mac-scrollbar" style={{ backgroundColor: t.panel, border: `1px solid ${t.borderLight}` }}>
            <header className="flex justify-between items-center mb-6">
               <div>
                 <h3 className="text-lg font-black text-white uppercase tracking-tight">Nuevo <span style={{ color: t.accent }}>Recordatorio</span></h3>
                 <p className="text-[8px] font-black uppercase tracking-widest mt-1" style={{ color: t.textDim }}>Sincronización con vida personal</p>
               </div>
               <button onClick={() => setIsModalOpen(false)} className="transition-colors" style={{ color: t.textDim }}>
                 <X size={20}/>
               </button>
            </header>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <p className="text-[8px] font-black uppercase ml-1 tracking-widest" style={{ color: t.textDim }}>Título / Asunto</p>
                <input type="text" value={nuevoRecordatorio.titulo}
                  onChange={e => setNuevoRecordatorio({...nuevoRecordatorio, titulo: e.target.value})}
                  placeholder="Ej: Comprar café de especialidad..."
                  className="w-full rounded-xl p-3.5 text-xs outline-none transition-all"
                  style={{ backgroundColor: t.bg, border: `1px solid ${t.border}`, color: t.text }}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <p className="text-[8px] font-black uppercase ml-1 tracking-widest" style={{ color: t.textDim }}>Persona Relacionada</p>
                  <input type="text" value={nuevoRecordatorio.nombre_contacto}
                    onChange={e => setNuevoRecordatorio({...nuevoRecordatorio, nombre_contacto: e.target.value})}
                    placeholder="Nombre..."
                    className="w-full rounded-xl p-3.5 text-xs outline-none"
                    style={{ backgroundColor: t.bg, border: `1px solid ${t.border}`, color: t.text }}
                  />
                </div>
                <div className="space-y-1.5">
                  <p className="text-[8px] font-black uppercase ml-1 tracking-widest" style={{ color: t.textDim }}>Monto Estimado (BS)</p>
                  <input type="number" value={nuevoRecordatorio.monto}
                    onChange={e => setNuevoRecordatorio({...nuevoRecordatorio, monto: e.target.value})}
                    className="w-full rounded-xl p-3.5 text-xs outline-none"
                    style={{ backgroundColor: t.bg, border: `1px solid ${t.border}`, color: t.text }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <p className="text-[8px] font-black uppercase ml-1 tracking-widest" style={{ color: t.textDim }}>Recurrencia</p>
                  <select value={nuevoRecordatorio.recurrencia}
                    onChange={e => setNuevoRecordatorio({...nuevoRecordatorio, recurrencia: e.target.value})}
                    className="w-full rounded-xl p-3.5 text-[9px] font-black uppercase outline-none"
                    style={{ backgroundColor: t.bg, border: `1px solid ${t.border}`, color: t.text }}
                  >
                    <option value="Ninguna" style={{ backgroundColor: t.bg, color: t.text }}>Único</option>
                    <option value="Mensual" style={{ backgroundColor: t.bg, color: t.text }}>Mensual</option>
                    <option value="Bimestral" style={{ backgroundColor: t.bg, color: t.text }}>Bimestral</option>
                    <option value="Trimestral" style={{ backgroundColor: t.bg, color: t.text }}>Trimestral</option>
                    <option value="Anual" style={{ backgroundColor: t.bg, color: t.text }}>Anual</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <p className="text-[8px] font-black uppercase ml-1 tracking-widest" style={{ color: t.textDim }}>Inicio</p>
                  <input type="date" value={nuevoRecordatorio.fecha}
                    onChange={e => setNuevoRecordatorio({...nuevoRecordatorio, fecha: e.target.value})}
                    className="w-full rounded-xl p-3.5 text-xs outline-none"
                    style={{ backgroundColor: t.bg, border: `1px solid ${t.border}`, color: t.text }}
                  />
                </div>
                <div className="space-y-1.5">
                  <p className="text-[8px] font-black uppercase ml-1 tracking-widest" style={{ color: t.textDim }}>Vencimiento</p>
                  <input type="date" value={nuevoRecordatorio.fecha_fin}
                    onChange={e => setNuevoRecordatorio({...nuevoRecordatorio, fecha_fin: e.target.value})}
                    className="w-full rounded-xl p-3.5 text-xs outline-none"
                    style={{ backgroundColor: t.bg, border: `1px solid ${t.border}`, color: t.text }}
                  />
                </div>
              </div>

              <div className="space-y-3 p-4 rounded-xl" style={{ backgroundColor: t.accentSoft, border: `1px solid ${t.border}` }}>
                <p className="text-[8px] font-black uppercase tracking-widest" style={{ color: t.textDim }}>Lista de Items / Pasos</p>
                <div className="flex gap-2">
                   <input type="text" value={nuevaSubtarea}
                    onChange={e => setNuevaSubtarea(e.target.value)}
                    placeholder="Añadir ítem..."
                    className="flex-1 rounded-lg px-3.5 py-2.5 text-xs outline-none"
                    style={{ backgroundColor: t.bg, border: `1px solid ${t.border}`, color: t.text }}
                    onKeyDown={e => e.key === 'Enter' && addSubtarea()}
                   />
                   <button onClick={addSubtarea} className="p-2.5 rounded-lg transition-all" style={{ backgroundColor: t.accent, color: '#000000' }}><Plus size={14}/></button>
                </div>
                <div className="space-y-1.5 max-h-32 overflow-y-auto mac-scrollbar pr-1">
                   {subtareasTemp.map(st => (
                     <div key={st.id} className="flex items-center justify-between p-2.5 rounded-lg" style={{ backgroundColor: t.accentSoft, border: `1px solid ${t.border}` }}>
                        <span className="text-[9px] font-bold" style={{ color: t.textMuted }}>{st.texto}</span>
                        <button onClick={() => setSubtareasTemp(subtareasTemp.filter(i => i.id !== st.id))} className="transition-all" style={{ color: t.textDim }}>
                          <Trash2 size={12}/>
                        </button>
                     </div>
                   ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <p className="text-[8px] font-black uppercase ml-1 tracking-widest" style={{ color: t.textDim }}>Categoría</p>
                  <select value={nuevoRecordatorio.categoria}
                    onChange={e => setNuevoRecordatorio({...nuevoRecordatorio, categoria: e.target.value})}
                    className="w-full rounded-xl p-3.5 text-[9px] font-black uppercase outline-none"
                    style={{ backgroundColor: t.bg, border: `1px solid ${t.border}`, color: t.text }}
                  >
                    <option value="Tarea" style={{ backgroundColor: t.bg, color: t.text }}>Tarea</option>
                    <option value="Compra" style={{ backgroundColor: t.bg, color: t.text }}>Compra</option>
                    <option value="Idea" style={{ backgroundColor: t.bg, color: t.text }}>Idea</option>
                    <option value="Nota" style={{ backgroundColor: t.bg, color: t.text }}>Apunte Personal</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <p className="text-[8px] font-black uppercase ml-1 tracking-widest" style={{ color: t.textDim }}>Prioridad</p>
                  <select value={nuevoRecordatorio.prioridad}
                    onChange={e => setNuevoRecordatorio({...nuevoRecordatorio, prioridad: e.target.value})}
                    className="w-full rounded-xl p-3.5 text-[9px] font-black uppercase outline-none"
                    style={{ backgroundColor: t.bg, border: `1px solid ${t.border}`, color: t.text }}
                  >
                    <option value="Baja" style={{ backgroundColor: t.bg, color: t.text }}>Baja</option>
                    <option value="Media" style={{ backgroundColor: t.bg, color: t.text }}>Media</option>
                    <option value="Alta" style={{ backgroundColor: t.bg, color: t.text }}>Alta</option>
                    <option value="Crítica" style={{ backgroundColor: t.bg, color: t.text }}>Crítica</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex gap-3">
                 <button onClick={() => setIsModalOpen(false)} className="flex-1 py-3.5 font-black uppercase text-[9px] tracking-widest transition-all" style={{ color: t.textDim }}>Cancelar</button>
                 <button onClick={handleCreate} className="flex-[2] py-3.5 font-black uppercase text-[9px] tracking-[0.2em] rounded-xl transition-all" style={{ backgroundColor: t.accent, color: '#000000' }}>Crear Recordatorio</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const RecordatorioCard = ({ r, onToggle, onSubToggle, onDelete, colorFunc, isDark }) => {
  const t = useMemo(() => getTheme(isDark), [isDark]);
  const pc = colorFunc(r.prioridad);
  return (
    <div 
      className="group relative transition-all"
      style={{ 
        backgroundColor: t.accentSoft,
        border: `1px solid ${t.border}`,
        borderRadius: 12,
        padding: 14,
        opacity: r.estado === 'Completado' ? 0.45 : 1,
      }}
    >
      <div className="flex gap-3 items-start">
        <button 
          onClick={() => onToggle(r.id, r.estado)}
          className="mt-0.5 transition-all shrink-0"
          style={{ color: r.estado === 'Completado' ? t.accent : t.textDim }}
        >
          {r.estado === 'Completado' ? <CheckCircle2 size={20} /> : <Circle size={20} />}
        </button>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1.5">
            <h4 className="text-xs font-black uppercase tracking-tight truncate" style={{
              color: r.estado === 'Completado' ? t.textDim : t.text,
              textDecoration: r.estado === 'Completado' ? 'line-through' : 'none',
            }}>
              {r.titulo}
            </h4>
            <div className="px-2 py-0.5 rounded-lg border text-[7px] font-black uppercase tracking-widest shrink-0 ml-2" style={{ color: pc.color, backgroundColor: pc.bg, borderColor: pc.border }}>
              {r.prioridad}
            </div>
          </div>

          {(r.nombre_contacto || r.monto > 0) && (
            <div className="flex flex-wrap gap-2 mb-2.5">
              {r.nombre_contacto && (
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[8px] font-bold uppercase" style={{ backgroundColor: t.accentSoft, border: `1px solid ${t.border}`, color: t.textMuted }}>
                  <User size={8} color={t.accent} /> {r.nombre_contacto}
                </div>
              )}
              {r.monto > 0 && (
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[8px] font-black uppercase" style={{ backgroundColor: t.accentSoft, border: `1px solid ${t.border}`, color: t.text }}>
                  <TrendingUp size={8} color={t.accent} /> {r.monto} BS
                </div>
              )}
            </div>
          )}

          <div className="flex flex-wrap gap-3 mb-2.5">
            {r.recurrencia && r.recurrencia !== 'Ninguna' && (
              <div className="flex items-center gap-1.5 text-[7px] font-black uppercase tracking-widest" style={{ color: t.accent }}>
                <Zap size={8} /> {r.recurrencia}
              </div>
            )}
            {r.fecha && (
              <div className="flex items-center gap-1 text-[7px] font-black uppercase" style={{ color: t.textDim }}>
                <Clock size={8} /> {new Date(r.fecha).toLocaleDateString()} {r.fecha_fin ? `al ${new Date(r.fecha_fin).toLocaleDateString()}` : ''}
              </div>
            )}
          </div>

          {r.subtareas && r.subtareas.length > 0 && (
            <div className="space-y-1.5 mt-2.5 p-3 rounded-xl" style={{ backgroundColor: t.bg, border: `1px solid ${t.border}` }}>
               {r.subtareas.map(st => (
                 <div 
                  key={st.id} 
                  onClick={(e) => { e.stopPropagation(); onSubToggle(r.id, st.id, r.subtareas); }}
                  className="flex items-center gap-2 cursor-pointer group/sub"
                 >
                   {st.completado ? <CheckCircle2 size={12} color={t.accent} /> : <Circle size={12} color={t.textDim} />}
                   <span className="text-[9px] font-bold" style={{
                     color: st.completado ? t.textDim : t.textMuted,
                     textDecoration: st.completado ? 'line-through' : 'none',
                   }}>
                     {st.texto}
                   </span>
                 </div>
               ))}
            </div>
          )}
        </div>

        <button 
          onClick={() => onDelete(r.id)}
          className="opacity-0 group-hover:opacity-100 p-1.5 transition-all shrink-0"
          style={{ color: t.textDim }}
        >
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  );
};

export default Recordatorios;
