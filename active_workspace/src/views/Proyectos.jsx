import React, { useState } from 'react';
import {
  Plus, ArrowLeft, Save, Briefcase, FolderOpen, ExternalLink,
  Calendar, User, Trash2, ChevronRight, Tag, Clock, CheckCircle2,
  Circle, Loader, PackageCheck
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

const ESTADOS = ['Sin Iniciar', 'En Edición', 'En Revisión', 'Entregado'];
const TIPOS = ['Edición', 'Colorización', 'Mixing', 'Motion Graphics', 'VFX', 'Documental', 'Otro'];

const statusConfig = {
  'Sin Iniciar': { color: 'text-neutral-400', bg: 'bg-neutral-500/10', border: 'border-neutral-500/20', icon: Circle },
  'En Edición':  { color: 'text-blue-400',    bg: 'bg-blue-500/10',    border: 'border-blue-500/20',    icon: Loader },
  'En Revisión': { color: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/20',   icon: Clock },
  'Entregado':   { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: CheckCircle2 },
};

const StatusBadge = ({ estado }) => {
  const cfg = statusConfig[estado] || statusConfig['Sin Iniciar'];
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded uppercase font-bold tracking-widest border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
      <Icon size={9} className={estado === 'En Edición' ? 'animate-spin' : ''}/> {estado}
    </span>
  );
};

const Proyectos = ({ proyectos, setProyectos }) => {
  const [view, setView] = useState('list'); // 'list' | 'create' | 'detail'
  const [activeProyecto, setActiveProyecto] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState('Todos');

  const [form, setForm] = useState({
    nombre: '',
    cliente: '',
    tipo: 'Edición',
    estado: 'Sin Iniciar',
    fecha_inicio: new Date().toISOString().split('T')[0],
    fecha_entrega: '',
    drive: '',
    presupuesto: '',
    notas: '',
  });

  // ── Crear proyecto ────────────────────────────────────────────────────────
  const handleCreate = async () => {
    if (!form.nombre.trim()) return;
    setLoading(true);
    const newProyecto = { id: crypto.randomUUID(), ...form, presupuesto: parseFloat(form.presupuesto) || 0 };
    try {
      const { error } = await supabase.from('proyectos').insert(newProyecto);
      if (error) throw error;
      setProyectos(prev => [...prev, newProyecto]);
      setForm({ nombre: '', cliente: '', tipo: 'Edición', estado: 'Sin Iniciar', fecha_inicio: new Date().toISOString().split('T')[0], fecha_entrega: '', drive: '', presupuesto: '', notas: '' });
      setView('list');
    } catch (err) { alert('Error: ' + err.message); }
    finally { setLoading(false); }
  };

  // ── Guardar edición ───────────────────────────────────────────────────────
  const handleSave = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.from('proyectos').upsert({ ...activeProyecto, presupuesto: parseFloat(activeProyecto.presupuesto) || 0 });
      if (error) throw error;
      setProyectos(prev => prev.map(p => p.id === activeProyecto.id ? activeProyecto : p));
      setView('list'); setActiveProyecto(null);
    } catch (err) { alert('Error: ' + err.message); }
    finally { setLoading(false); }
  };

  // ── Eliminar ──────────────────────────────────────────────────────────────
  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!confirm('¿Eliminar este proyecto?')) return;
    try {
      const { error } = await supabase.from('proyectos').delete().eq('id', id);
      if (error) throw error;
      setProyectos(prev => prev.filter(p => p.id !== id));
    } catch (err) { alert('Error: ' + err.message); }
  };

  // ── Cambiar estado rápido desde la lista ──────────────────────────────────
  const cambiarEstado = async (proyecto, nuevoEstado, e) => {
    e.stopPropagation();
    const updated = { ...proyecto, estado: nuevoEstado };
    try {
      await supabase.from('proyectos').upsert(updated);
      setProyectos(prev => prev.map(p => p.id === proyecto.id ? updated : p));
    } catch (err) { console.error(err); }
  };

  // ── Días al vencimiento ───────────────────────────────────────────────────
  const diasAlVencimiento = (fecha) => {
    if (!fecha) return null;
    return Math.ceil((new Date(fecha) - new Date()) / (1000 * 60 * 60 * 24));
  };

  // ── Proyectos filtrados ───────────────────────────────────────────────────
  const proyectosFiltrados = proyectos.filter(p => {
    const matchSearch = p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (p.cliente || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchEstado = filterEstado === 'Todos' || p.estado === filterEstado;
    return matchSearch && matchEstado;
  });

  // ── Conteos por estado ────────────────────────────────────────────────────
  const conteos = ESTADOS.reduce((acc, e) => ({ ...acc, [e]: proyectos.filter(p => p.estado === e).length }), {});

  return (
    <div className="flex flex-col h-full max-w-[1200px] w-full">

      {/* ── LISTA ─────────────────────────────────────────────────────────── */}
      {view === 'list' && (
        <div className="animate-in fade-in duration-300">
          <header className="mb-6 flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-light text-white tracking-tight">Proyectos</h2>
              <p className="text-[11px] text-neutral-500 uppercase tracking-widest mt-1">Gestión de producción audiovisual</p>
            </div>
            <button onClick={() => setView('create')}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5">
              <Plus size={14}/> Nuevo Proyecto
            </button>
          </header>

          {/* Resumen por columna de estado */}
          <div className="grid grid-cols-4 gap-3 mb-6">
            {ESTADOS.map(estado => {
              const cfg = statusConfig[estado];
              const Icon = cfg.icon;
              return (
                <button key={estado} onClick={() => setFilterEstado(filterEstado === estado ? 'Todos' : estado)}
                  className={`p-4 rounded-xl border text-left transition-all ${filterEstado === estado ? `${cfg.bg} ${cfg.border}` : 'bg-white/[0.02] border-white/[0.05] hover:bg-white/[0.04]'}`}>
                  <p className={`text-2xl font-light ${cfg.color}`}>{conteos[estado] || 0}</p>
                  <p className={`text-[10px] uppercase tracking-widest font-bold mt-1 flex items-center gap-1 ${cfg.color} opacity-70`}>
                    <Icon size={9} className={estado === 'En Edición' ? 'animate-spin' : ''}/> {estado}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Buscador */}
          <div className="mb-4">
            <input
              type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar por proyecto o cliente..."
              className="w-full max-w-sm bg-white/[0.03] border border-white/[0.07] rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-amber-500/40 placeholder:text-neutral-600"
            />
          </div>

          {/* Tabla */}
          <div className="bg-[#0a0a0a] border border-white/[0.05] rounded-xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-black/40 border-b border-white/[0.05]">
                  <th className="px-4 py-3 text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Proyecto</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Tipo</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Entrega</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Estado</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-neutral-500 uppercase tracking-widest text-right">Acción</th>
                </tr>
              </thead>
              <tbody>
                {proyectosFiltrados.length > 0 ? proyectosFiltrados.map(p => {
                  const dias = diasAlVencimiento(p.fecha_entrega);
                  const vencido = dias !== null && dias < 0 && p.estado !== 'Entregado';
                  return (
                    <tr key={p.id} onClick={() => { setActiveProyecto(p); setView('detail'); }}
                      className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors cursor-pointer group">
                      <td className="px-4 py-4">
                        <p className="text-sm text-white font-medium">{p.nombre}</p>
                        {p.cliente && <p className="text-[10px] text-neutral-500 mt-0.5 flex items-center gap-1"><User size={9}/> {p.cliente}</p>}
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-[10px] bg-white/5 text-neutral-400 px-2 py-0.5 rounded border border-white/5 flex items-center gap-1 w-max">
                          <Tag size={9}/> {p.tipo || 'Edición'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        {p.fecha_entrega ? (
                          <div>
                            <p className="text-xs text-neutral-300 font-mono">{p.fecha_entrega}</p>
                            {dias !== null && (
                              <p className={`text-[9px] font-bold mt-0.5 ${vencido ? 'text-rose-400' : dias <= 3 ? 'text-amber-400' : 'text-neutral-500'}`}>
                                {vencido ? `Vencido hace ${Math.abs(dias)}d` : dias === 0 ? 'Entrega hoy' : `${dias}d restantes`}
                              </p>
                            )}
                          </div>
                        ) : <span className="text-[10px] text-neutral-600">Sin fecha</span>}
                      </td>
                      <td className="px-4 py-4" onClick={e => e.stopPropagation()}>
                        <select
                          value={p.estado || 'Sin Iniciar'}
                          onChange={e => cambiarEstado(p, e.target.value, e)}
                          className={`text-[9px] uppercase font-bold tracking-widest px-2 py-1 rounded outline-none cursor-pointer border ${statusConfig[p.estado]?.bg} ${statusConfig[p.estado]?.color} ${statusConfig[p.estado]?.border} bg-transparent`}
                        >
                          {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={(e) => handleDelete(p.id, e)} className="p-2 text-neutral-600 hover:text-rose-500 transition-colors">
                            <Trash2 size={13}/>
                          </button>
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[9px] font-bold uppercase bg-white/5 text-neutral-400 group-hover:text-white transition-colors">
                            Detalle <ChevronRight size={10}/>
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                }) : (
                  <tr><td colSpan="5" className="px-4 py-10 text-center text-neutral-600 text-xs italic tracking-widest">
                    {searchTerm ? 'Sin resultados para tu búsqueda.' : 'No hay proyectos registrados. Crea el primero.'}
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── CREAR ─────────────────────────────────────────────────────────── */}
      {view === 'create' && (
        <div className="animate-in slide-in-from-bottom-4 duration-300 max-w-2xl w-full">
          <div className="flex items-center gap-2 mb-4 text-xs text-neutral-500 cursor-pointer hover:text-white w-max" onClick={() => setView('list')}>
            <ArrowLeft size={12}/> Volver a Proyectos
          </div>
          <div className="bg-[#0a0a0a] border border-white/[0.05] rounded-xl p-8 shadow-2xl">
            <h2 className="text-2xl font-light text-white tracking-tight mb-6 flex items-center gap-2">
              <Briefcase size={20} className="text-amber-500"/> Nuevo Proyecto
            </h2>
            <div className="grid grid-cols-2 gap-5">
              <div className="col-span-2">
                <label className="text-[10px] uppercase tracking-widest text-neutral-500 font-bold mb-1.5 block">Nombre del Proyecto *</label>
                <input type="text" value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})}
                  className="w-full bg-black/40 border border-white/10 rounded-md px-3 py-2 text-sm text-white outline-none focus:border-amber-500/50" placeholder="Ej: Boda Rodríguez — Edición Final" autoFocus/>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-neutral-500 font-bold mb-1.5 block">Cliente</label>
                <input type="text" value={form.cliente} onChange={e => setForm({...form, cliente: e.target.value})}
                  className="w-full bg-black/40 border border-white/10 rounded-md px-3 py-2 text-xs text-white outline-none focus:border-amber-500/50" placeholder="Nombre del cliente"/>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-neutral-500 font-bold mb-1.5 block">Tipo de Proyecto</label>
                <select value={form.tipo} onChange={e => setForm({...form, tipo: e.target.value})}
                  className="w-full bg-black/40 border border-white/10 rounded-md px-3 py-2 text-xs text-white outline-none focus:border-amber-500/50 cursor-pointer">
                  {TIPOS.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-neutral-500 font-bold mb-1.5 block">Fecha de Inicio</label>
                <input type="date" value={form.fecha_inicio} onChange={e => setForm({...form, fecha_inicio: e.target.value})}
                  className="w-full bg-black/40 border border-white/10 rounded-md px-3 py-2 text-xs text-neutral-300 outline-none focus:border-amber-500/50"/>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-neutral-500 font-bold mb-1.5 block">Fecha de Entrega</label>
                <input type="date" value={form.fecha_entrega} onChange={e => setForm({...form, fecha_entrega: e.target.value})}
                  className="w-full bg-black/40 border border-white/10 rounded-md px-3 py-2 text-xs text-neutral-300 outline-none focus:border-amber-500/50"/>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-neutral-500 font-bold mb-1.5 block">Presupuesto ($)</label>
                <input type="number" value={form.presupuesto} onChange={e => setForm({...form, presupuesto: e.target.value})}
                  className="w-full bg-black/40 border border-white/10 rounded-md px-3 py-2 text-xs text-white outline-none focus:border-amber-500/50" placeholder="0"/>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-neutral-500 font-bold mb-1.5 block">Carpeta Drive</label>
                <input type="text" value={form.drive} onChange={e => setForm({...form, drive: e.target.value})}
                  className="w-full bg-black/40 border border-white/10 rounded-md px-3 py-2 text-xs text-white outline-none focus:border-amber-500/50" placeholder="https://drive.google.com/..."/>
              </div>
              <div className="col-span-2">
                <label className="text-[10px] uppercase tracking-widest text-neutral-500 font-bold mb-1.5 block">Notas internas</label>
                <textarea value={form.notas} onChange={e => setForm({...form, notas: e.target.value})}
                  className="w-full bg-black/40 border border-white/10 rounded-md px-3 py-2 text-xs text-white outline-none focus:border-amber-500/50 min-h-[70px] resize-none" placeholder="Requerimientos, instrucciones especiales..."/>
              </div>
            </div>
            <button onClick={handleCreate} disabled={loading || !form.nombre.trim()}
              className="mt-6 w-full py-2.5 bg-white text-black text-xs font-bold rounded-md hover:bg-neutral-200 transition-colors disabled:opacity-50">
              {loading ? 'Creando...' : 'Crear Proyecto'}
            </button>
          </div>
        </div>
      )}

      {/* ── DETALLE ───────────────────────────────────────────────────────── */}
      {view === 'detail' && activeProyecto && (
        <div className="animate-in slide-in-from-right-4 duration-300">
          <div className="flex items-center gap-2 mb-4 text-xs text-neutral-500 cursor-pointer hover:text-white w-max" onClick={() => { setView('list'); setActiveProyecto(null); }}>
            <ArrowLeft size={12}/> Volver a Proyectos
          </div>

          <header className="mb-6 flex justify-between items-end pb-4 border-b border-white/5">
            <div>
              <input type="text" value={activeProyecto.nombre}
                onChange={e => setActiveProyecto({...activeProyecto, nombre: e.target.value})}
                className="text-3xl font-semibold bg-transparent outline-none text-white w-full max-w-[500px]" placeholder="Nombre del Proyecto"/>
              <div className="flex items-center gap-3 mt-2">
                {activeProyecto.cliente && (
                  <span className="text-[10px] font-mono text-neutral-400 bg-white/5 px-2 py-1 rounded border border-white/5 flex items-center gap-1.5">
                    <User size={10}/> {activeProyecto.cliente}
                  </span>
                )}
                <StatusBadge estado={activeProyecto.estado}/>
              </div>
            </div>
            <button onClick={handleSave} disabled={loading}
              className="px-5 py-2 bg-amber-500 text-black text-[11px] font-bold rounded-md hover:bg-amber-400 transition-colors flex items-center gap-1.5 disabled:opacity-50">
              <Save size={14}/> {loading ? 'Guardando...' : 'Guardar Proyecto'}
            </button>
          </header>

          <div className="grid grid-cols-12 gap-6">
            {/* Columna izquierda */}
            <div className="col-span-5 flex flex-col gap-5">
              <div className="bg-[#0a0a0a] border border-white/[0.05] rounded-xl p-5">
                <h3 className="text-[10px] font-bold tracking-widest uppercase text-neutral-500 mb-4 flex items-center gap-1.5"><Calendar size={12}/> Fechas y Presupuesto</h3>
                <div className="space-y-3">
                  <div className="bg-black/40 border border-white/5 rounded-lg p-3">
                    <label className="text-[10px] text-neutral-500 block mb-1">Tipo de Proyecto</label>
                    <select value={activeProyecto.tipo || 'Edición'} onChange={e => setActiveProyecto({...activeProyecto, tipo: e.target.value})}
                      className="bg-transparent text-sm text-white outline-none w-full cursor-pointer">
                      {TIPOS.map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="bg-black/40 border border-white/5 rounded-lg p-3">
                    <label className="text-[10px] text-neutral-500 block mb-1">Estado</label>
                    <select value={activeProyecto.estado} onChange={e => setActiveProyecto({...activeProyecto, estado: e.target.value})}
                      className={`bg-transparent text-sm outline-none w-full cursor-pointer font-bold ${statusConfig[activeProyecto.estado]?.color}`}>
                      {ESTADOS.map(e => <option key={e}>{e}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-black/40 border border-white/5 rounded-lg p-3">
                      <label className="text-[10px] text-neutral-500 block mb-1">Inicio</label>
                      <input type="date" value={activeProyecto.fecha_inicio || ''} onChange={e => setActiveProyecto({...activeProyecto, fecha_inicio: e.target.value})}
                        className="bg-transparent text-xs text-white outline-none w-full"/>
                    </div>
                    <div className="bg-black/40 border border-white/5 rounded-lg p-3">
                      <label className="text-[10px] text-neutral-500 block mb-1">Entrega</label>
                      <input type="date" value={activeProyecto.fecha_entrega || ''} onChange={e => setActiveProyecto({...activeProyecto, fecha_entrega: e.target.value})}
                        className="bg-transparent text-xs text-white outline-none w-full"/>
                    </div>
                  </div>
                  <div className="bg-black/40 border border-white/5 rounded-lg p-3">
                    <label className="text-[10px] text-neutral-500 block mb-1">Presupuesto ($)</label>
                    <input type="number" value={activeProyecto.presupuesto || ''} onChange={e => setActiveProyecto({...activeProyecto, presupuesto: e.target.value})}
                      className="bg-transparent text-2xl font-mono text-amber-500 outline-none w-full" placeholder="0"/>
                  </div>
                </div>
              </div>
            </div>

            {/* Columna derecha */}
            <div className="col-span-7 flex flex-col gap-5">
              <div className="bg-[#0a0a0a] border border-white/[0.05] rounded-xl p-5">
                <h3 className="text-[10px] font-bold tracking-widest uppercase text-neutral-500 mb-3 flex items-center gap-1.5"><Briefcase size={12}/> Notas Internas</h3>
                <textarea value={activeProyecto.notas || ''} onChange={e => setActiveProyecto({...activeProyecto, notas: e.target.value})}
                  placeholder="Requerimientos, instrucciones especiales, assets entregados..."
                  className="w-full bg-black/40 border border-white/5 rounded-lg p-3 text-sm text-white outline-none focus:border-amber-500/50 min-h-[120px] resize-none"/>
              </div>

              <div className="bg-gradient-to-br from-blue-500/[0.02] to-transparent border border-blue-500/10 rounded-xl p-5">
                <h3 className="text-[10px] font-bold tracking-widest uppercase text-blue-400 mb-4 flex items-center gap-1.5">
                  <FolderOpen size={12}/> Carpeta en Drive
                </h3>
                <div className="bg-black/40 border border-white/5 rounded-lg p-3 relative">
                  <input type="text" value={activeProyecto.drive || ''} onChange={e => setActiveProyecto({...activeProyecto, drive: e.target.value})}
                    className="w-full bg-transparent text-xs text-white outline-none border-b border-white/10 pb-1 focus:border-blue-500/50 pr-20" placeholder="https://drive.google.com/..."/>
                  {activeProyecto.drive && (
                    <a href={activeProyecto.drive} target="_blank" rel="noreferrer"
                      className="absolute top-3 right-3 text-[9px] bg-blue-500/10 text-blue-400 px-2 py-1 rounded font-bold uppercase flex items-center gap-1 hover:bg-blue-500/20 transition-colors">
                      Abrir <ExternalLink size={10}/>
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Proyectos;
