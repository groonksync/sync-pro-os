import React, { useState, useMemo } from 'react';
import {
  Plus, ArrowLeft, Save, Briefcase, FolderOpen, ExternalLink,
  Calendar, User, Trash2, ChevronRight, Tag, Clock, CheckCircle2,
  Circle, Loader, PackageCheck
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { getTheme } from '../lib/theme';

const ESTADOS = ['Sin Iniciar', 'En Edición', 'En Revisión', 'Entregado'];
const TIPOS = ['Edición', 'Colorización', 'Mixing', 'Motion Graphics', 'VFX', 'Documental', 'Otro'];

const statusConfig = {
  'Sin Iniciar': { icon: Circle },
  'En Edición':  { icon: Loader },
  'En Revisión': { icon: Clock },
  'Entregado':   { icon: CheckCircle2 },
};

const getStatusColor = (estado, t) => {
  const map = {
    'Sin Iniciar': t.textMuted,
    'En Edición':  '#60a5fa',
    'En Revisión': '#fbbf24',
    'Entregado':   t.success,
  };
  return map[estado] || t.textMuted;
};

const getStatusBg = (estado, t) => {
  const map = {
    'Sin Iniciar': `${t.textMuted}15`,
    'En Edición':  '#60a5fa15',
    'En Revisión': '#fbbf2415',
    'Entregado':   `${t.success}15`,
  };
  return map[estado] || `${t.textMuted}15`;
};

const StatusBadge = ({ estado, t }) => {
  const cfg = statusConfig[estado] || statusConfig['Sin Iniciar'];
  const Icon = cfg.icon;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 9, padding: '2px 8px', borderRadius: 6, textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.1em', border: `1px solid ${getStatusColor(estado, t)}30`, backgroundColor: getStatusBg(estado, t), color: getStatusColor(estado, t) }}>
      <Icon size={9} style={estado === 'En Edición' ? { animation: 'spin 2s linear infinite' } : {}}/> {estado}
    </span>
  );
};

const Proyectos = ({ proyectos, setProyectos, isDark = true }) => {
  const t = useMemo(() => getTheme(isDark), [isDark]);
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

  // ── Helpers de foco ───────────────────────────────────────────────────────
  const inputFocus = (e) => { e.target.style.borderColor = t.accent; };
  const inputBlur = (e) => { e.target.style.borderColor = t.borderLight; };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>

      {/* ── LISTA ─────────────────────────────────────────────────────────── */}
      {view === 'list' && (
        <div className="animate-in fade-in duration-300">
          <header style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: t.text, letterSpacing: '-0.02em', margin: 0 }}>Proyectos</h2>
              <p style={{ fontSize: '0.75rem', color: t.textDim, marginTop: '4px', fontWeight: 500 }}>Gestión de producción audiovisual</p>
            </div>
            <button onClick={() => setView('create')}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', backgroundColor: t.accent, color: '#000', border: 'none', borderRadius: 12, fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', cursor: 'pointer', transition: 'opacity 0.2s' }}
              onMouseEnter={e => e.target.style.opacity = '0.85'}
              onMouseLeave={e => e.target.style.opacity = '1'}>
              <Plus size={14}/> Nuevo Proyecto
            </button>
          </header>

          {/* Resumen por columna de estado */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
            {ESTADOS.map(estado => {
              const cfg = statusConfig[estado];
              const Icon = cfg.icon;
              const isActive = filterEstado === estado;
              return (
                <button key={estado} onClick={() => setFilterEstado(isActive ? 'Todos' : estado)}
                  style={{ padding: 20, borderRadius: 14, border: `1px solid ${isActive ? getStatusColor(estado, t) : t.border}`, backgroundColor: isActive ? getStatusBg(estado, t) : t.panel, textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s' }}>
                  <p style={{ fontSize: '1.5rem', fontWeight: 300, color: getStatusColor(estado, t), margin: 0 }}>{conteos[estado] || 0}</p>
                  <p style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, marginTop: 4, color: getStatusColor(estado, t), opacity: 0.7, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Icon size={9} style={estado === 'En Edición' ? { animation: 'spin 2s linear infinite' } : {}}/> {estado}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Buscador */}
          <div style={{ marginBottom: 16 }}>
            <input
              type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar por proyecto o cliente..."
              onFocus={inputFocus} onBlur={inputBlur}
              style={{ width: '100%', maxWidth: 320, backgroundColor: t.inputBg, border: `1px solid ${t.borderLight}`, borderRadius: 12, padding: '8px 12px', fontSize: 12, color: t.text, outline: 'none', transition: 'border-color 0.2s' }}
            />
          </div>

          {/* Tabla */}
          <div style={{ backgroundColor: t.panel, border: `1px solid ${t.border}`, borderRadius: 14, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: t.accentSoft, borderBottom: `1px solid ${t.border}` }}>
                  <th style={{ padding: '12px 16px', fontSize: 10, fontWeight: 700, color: t.textDim, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Proyecto</th>
                  <th style={{ padding: '12px 16px', fontSize: 10, fontWeight: 700, color: t.textDim, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Tipo</th>
                  <th style={{ padding: '12px 16px', fontSize: 10, fontWeight: 700, color: t.textDim, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Entrega</th>
                  <th style={{ padding: '12px 16px', fontSize: 10, fontWeight: 700, color: t.textDim, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Estado</th>
                  <th style={{ padding: '12px 16px', fontSize: 10, fontWeight: 700, color: t.textDim, textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'right' }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {proyectosFiltrados.length > 0 ? proyectosFiltrados.map(p => {
                  const dias = diasAlVencimiento(p.fecha_entrega);
                  const vencido = dias !== null && dias < 0 && p.estado !== 'Entregado';
                  return (
                    <tr key={p.id} onClick={() => { setActiveProyecto(p); setView('detail'); }}
                      style={{ borderBottom: `1px solid ${t.border}`, cursor: 'pointer', transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = t.hover}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                      <td style={{ padding: '16px' }}>
                        <p style={{ fontSize: 14, fontWeight: 500, color: t.text, margin: 0 }}>{p.nombre}</p>
                        {p.cliente && <p style={{ fontSize: 10, color: t.textDim, marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}><User size={9}/> {p.cliente}</p>}
                      </td>
                      <td style={{ padding: '16px' }}>
                        <span style={{ fontSize: 10, backgroundColor: `${t.textMuted}15`, color: t.textDim, padding: '2px 8px', borderRadius: 6, border: `1px solid ${t.borderLight}`, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <Tag size={9}/> {p.tipo || 'Edición'}
                        </span>
                      </td>
                      <td style={{ padding: '16px' }}>
                        {p.fecha_entrega ? (
                          <div>
                            <p style={{ fontSize: 12, color: t.text, fontFamily: 'monospace', margin: 0 }}>{p.fecha_entrega}</p>
                            {dias !== null && (
                              <p style={{ fontSize: 9, fontWeight: 700, marginTop: 2, color: vencido ? t.danger : dias <= 3 ? '#fbbf24' : t.textMuted }}>
                                {vencido ? `Vencido hace ${Math.abs(dias)}d` : dias === 0 ? 'Entrega hoy' : `${dias}d restantes`}
                              </p>
                            )}
                          </div>
                        ) : <span style={{ fontSize: 10, color: t.textMuted }}>Sin fecha</span>}
                      </td>
                      <td style={{ padding: '16px' }} onClick={e => e.stopPropagation()}>
                        <select
                          value={p.estado || 'Sin Iniciar'}
                          onChange={e => cambiarEstado(p, e.target.value, e)}
                          style={{ fontSize: 9, textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.1em', padding: '4px 8px', borderRadius: 6, outline: 'none', cursor: 'pointer', backgroundColor: 'transparent', color: getStatusColor(p.estado, t), border: `1px solid ${getStatusColor(p.estado, t)}30` }}
                        >
                          {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
                        </select>
                      </td>
                      <td style={{ padding: '16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                          <button onClick={(e) => handleDelete(p.id, e)}
                            style={{ padding: 8, background: 'none', border: 'none', color: t.textMuted, cursor: 'pointer', transition: 'color 0.2s' }}
                            onMouseEnter={e => e.currentTarget.style.color = t.danger}
                            onMouseLeave={e => e.currentTarget.style.color = t.textMuted}>
                            <Trash2 size={13}/>
                          </button>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 6, fontSize: 9, fontWeight: 700, textTransform: 'uppercase', backgroundColor: `${t.textMuted}10`, color: t.textDim, transition: 'color 0.2s' }}>
                            Detalle <ChevronRight size={10}/>
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                }) : (
                  <tr><td colSpan="5" style={{ padding: '40px 16px', textAlign: 'center', color: t.textMuted, fontSize: 12, fontStyle: 'italic', letterSpacing: '0.1em' }}>
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
        <div className="animate-in slide-in-from-bottom-4 duration-300" style={{ width: '100%', maxWidth: 560 }}>
          <div onClick={() => setView('list')}
            style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, fontSize: 12, color: t.textDim, cursor: 'pointer', width: 'max-content', transition: 'color 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.color = t.text}
            onMouseLeave={e => e.currentTarget.style.color = t.textDim}>
            <ArrowLeft size={12}/> Volver a Proyectos
          </div>
          <div style={{ backgroundColor: t.panel, border: `1px solid ${t.border}`, borderRadius: 14, padding: 32 }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 300, color: t.text, letterSpacing: '-0.02em', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Briefcase size={20} style={{ color: t.accent }}/> Nuevo Proyecto
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: t.textDim, fontWeight: 700, marginBottom: 6, display: 'block' }}>Nombre del Proyecto *</label>
                <input type="text" value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})}
                  onFocus={inputFocus} onBlur={inputBlur}
                  style={{ width: '100%', backgroundColor: t.inputBg, border: `1px solid ${t.borderLight}`, borderRadius: 8, padding: '8px 12px', fontSize: 14, color: t.text, outline: 'none', transition: 'border-color 0.2s' }} placeholder="Ej: Boda Rodríguez — Edición Final" autoFocus/>
              </div>
              <div>
                <label style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: t.textDim, fontWeight: 700, marginBottom: 6, display: 'block' }}>Cliente</label>
                <input type="text" value={form.cliente} onChange={e => setForm({...form, cliente: e.target.value})}
                  onFocus={inputFocus} onBlur={inputBlur}
                  style={{ width: '100%', backgroundColor: t.inputBg, border: `1px solid ${t.borderLight}`, borderRadius: 8, padding: '8px 12px', fontSize: 12, color: t.text, outline: 'none', transition: 'border-color 0.2s' }} placeholder="Nombre del cliente"/>
              </div>
              <div>
                <label style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: t.textDim, fontWeight: 700, marginBottom: 6, display: 'block' }}>Tipo de Proyecto</label>
                <select value={form.tipo} onChange={e => setForm({...form, tipo: e.target.value})}
                  onFocus={inputFocus} onBlur={inputBlur}
                  style={{ width: '100%', backgroundColor: t.inputBg, border: `1px solid ${t.borderLight}`, borderRadius: 8, padding: '8px 12px', fontSize: 12, color: t.text, outline: 'none', cursor: 'pointer', transition: 'border-color 0.2s' }}>
                  {TIPOS.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: t.textDim, fontWeight: 700, marginBottom: 6, display: 'block' }}>Fecha de Inicio</label>
                <input type="date" value={form.fecha_inicio} onChange={e => setForm({...form, fecha_inicio: e.target.value})}
                  onFocus={inputFocus} onBlur={inputBlur}
                  style={{ width: '100%', backgroundColor: t.inputBg, border: `1px solid ${t.borderLight}`, borderRadius: 8, padding: '8px 12px', fontSize: 12, color: t.text, outline: 'none', transition: 'border-color 0.2s' }}/>
              </div>
              <div>
                <label style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: t.textDim, fontWeight: 700, marginBottom: 6, display: 'block' }}>Fecha de Entrega</label>
                <input type="date" value={form.fecha_entrega} onChange={e => setForm({...form, fecha_entrega: e.target.value})}
                  onFocus={inputFocus} onBlur={inputBlur}
                  style={{ width: '100%', backgroundColor: t.inputBg, border: `1px solid ${t.borderLight}`, borderRadius: 8, padding: '8px 12px', fontSize: 12, color: t.text, outline: 'none', transition: 'border-color 0.2s' }}/>
              </div>
              <div>
                <label style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: t.textDim, fontWeight: 700, marginBottom: 6, display: 'block' }}>Presupuesto ($)</label>
                <input type="number" value={form.presupuesto} onChange={e => setForm({...form, presupuesto: e.target.value})}
                  onFocus={inputFocus} onBlur={inputBlur}
                  style={{ width: '100%', backgroundColor: t.inputBg, border: `1px solid ${t.borderLight}`, borderRadius: 8, padding: '8px 12px', fontSize: 12, color: t.text, outline: 'none', transition: 'border-color 0.2s' }} placeholder="0"/>
              </div>
              <div>
                <label style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: t.textDim, fontWeight: 700, marginBottom: 6, display: 'block' }}>Carpeta Drive</label>
                <input type="text" value={form.drive} onChange={e => setForm({...form, drive: e.target.value})}
                  onFocus={inputFocus} onBlur={inputBlur}
                  style={{ width: '100%', backgroundColor: t.inputBg, border: `1px solid ${t.borderLight}`, borderRadius: 8, padding: '8px 12px', fontSize: 12, color: t.text, outline: 'none', transition: 'border-color 0.2s' }} placeholder="https://drive.google.com/..."/>
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: t.textDim, fontWeight: 700, marginBottom: 6, display: 'block' }}>Notas internas</label>
                <textarea value={form.notas} onChange={e => setForm({...form, notas: e.target.value})}
                  onFocus={inputFocus} onBlur={inputBlur}
                  style={{ width: '100%', backgroundColor: t.inputBg, border: `1px solid ${t.borderLight}`, borderRadius: 8, padding: '8px 12px', fontSize: 12, color: t.text, outline: 'none', resize: 'none', minHeight: 70, transition: 'border-color 0.2s' }} placeholder="Requerimientos, instrucciones especiales..."/>
              </div>
            </div>
            <button onClick={handleCreate} disabled={loading || !form.nombre.trim()}
              style={{ marginTop: 24, width: '100%', padding: '10px 0', backgroundColor: t.accent, color: '#000', border: 'none', borderRadius: 12, fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', cursor: loading || !form.nombre.trim() ? 'not-allowed' : 'pointer', opacity: loading || !form.nombre.trim() ? 0.5 : 1, transition: 'opacity 0.2s' }}>
              {loading ? 'Creando...' : 'Crear Proyecto'}
            </button>
          </div>
        </div>
      )}

      {/* ── DETALLE ───────────────────────────────────────────────────────── */}
      {view === 'detail' && activeProyecto && (
        <div className="animate-in slide-in-from-right-4 duration-300">
          <div onClick={() => { setView('list'); setActiveProyecto(null); }}
            style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, fontSize: 12, color: t.textDim, cursor: 'pointer', width: 'max-content', transition: 'color 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.color = t.text}
            onMouseLeave={e => e.currentTarget.style.color = t.textDim}>
            <ArrowLeft size={12}/> Volver a Proyectos
          </div>

          <header style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingBottom: 16, borderBottom: `1px solid ${t.borderLight}` }}>
            <div>
              <input type="text" value={activeProyecto.nombre}
                onChange={e => setActiveProyecto({...activeProyecto, nombre: e.target.value})}
                style={{ fontSize: '1.5rem', fontWeight: 600, background: 'none', border: 'none', outline: 'none', color: t.text, width: '100%', maxWidth: 500 }} placeholder="Nombre del Proyecto"/>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
                {activeProyecto.cliente && (
                  <span style={{ fontSize: 10, fontFamily: 'monospace', color: t.textDim, backgroundColor: t.accentSoft, padding: '4px 8px', borderRadius: 6, border: `1px solid ${t.borderLight}`, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <User size={10}/> {activeProyecto.cliente}
                  </span>
                )}
                <StatusBadge estado={activeProyecto.estado} t={t}/>
              </div>
            </div>
            <button onClick={handleSave} disabled={loading}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 20px', backgroundColor: t.accent, color: '#000', border: 'none', borderRadius: 12, fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.5 : 1, transition: 'opacity 0.2s' }}>
              <Save size={14}/> {loading ? 'Guardando...' : 'Guardar Proyecto'}
            </button>
          </header>

          <div style={{ display: 'grid', gridTemplateColumns: '5fr 7fr', gap: 24 }}>
            {/* Columna izquierda */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ backgroundColor: t.panel, border: `1px solid ${t.border}`, borderRadius: 14, padding: 20 }}>
                <h3 style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: t.textDim, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}><Calendar size={12}/> Fechas y Presupuesto</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ backgroundColor: t.inputBg, border: `1px solid ${t.borderLight}`, borderRadius: 12, padding: 12 }}>
                    <label style={{ fontSize: 10, color: t.textDim, display: 'block', marginBottom: 4 }}>Tipo de Proyecto</label>
                    <select value={activeProyecto.tipo || 'Edición'} onChange={e => setActiveProyecto({...activeProyecto, tipo: e.target.value})}
                      onFocus={inputFocus} onBlur={inputBlur}
                      style={{ background: 'none', border: 'none', color: t.text, fontSize: 14, outline: 'none', width: '100%', cursor: 'pointer' }}>
                      {TIPOS.map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div style={{ backgroundColor: t.inputBg, border: `1px solid ${t.borderLight}`, borderRadius: 12, padding: 12 }}>
                    <label style={{ fontSize: 10, color: t.textDim, display: 'block', marginBottom: 4 }}>Estado</label>
                    <select value={activeProyecto.estado} onChange={e => setActiveProyecto({...activeProyecto, estado: e.target.value})}
                      onFocus={inputFocus} onBlur={inputBlur}
                      style={{ background: 'none', border: 'none', color: getStatusColor(activeProyecto.estado, t), fontSize: 14, fontWeight: 700, outline: 'none', width: '100%', cursor: 'pointer' }}>
                      {ESTADOS.map(e => <option key={e}>{e}</option>)}
                    </select>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div style={{ backgroundColor: t.inputBg, border: `1px solid ${t.borderLight}`, borderRadius: 12, padding: 12 }}>
                      <label style={{ fontSize: 10, color: t.textDim, display: 'block', marginBottom: 4 }}>Inicio</label>
                      <input type="date" value={activeProyecto.fecha_inicio || ''} onChange={e => setActiveProyecto({...activeProyecto, fecha_inicio: e.target.value})}
                        onFocus={inputFocus} onBlur={inputBlur}
                        style={{ background: 'none', border: 'none', color: t.text, fontSize: 12, outline: 'none', width: '100%' }}/>
                    </div>
                    <div style={{ backgroundColor: t.inputBg, border: `1px solid ${t.borderLight}`, borderRadius: 12, padding: 12 }}>
                      <label style={{ fontSize: 10, color: t.textDim, display: 'block', marginBottom: 4 }}>Entrega</label>
                      <input type="date" value={activeProyecto.fecha_entrega || ''} onChange={e => setActiveProyecto({...activeProyecto, fecha_entrega: e.target.value})}
                        onFocus={inputFocus} onBlur={inputBlur}
                        style={{ background: 'none', border: 'none', color: t.text, fontSize: 12, outline: 'none', width: '100%' }}/>
                    </div>
                  </div>
                  <div style={{ backgroundColor: t.inputBg, border: `1px solid ${t.borderLight}`, borderRadius: 12, padding: 12 }}>
                    <label style={{ fontSize: 10, color: t.textDim, display: 'block', marginBottom: 4 }}>Presupuesto ($)</label>
                    <input type="number" value={activeProyecto.presupuesto || ''} onChange={e => setActiveProyecto({...activeProyecto, presupuesto: e.target.value})}
                      onFocus={inputFocus} onBlur={inputBlur}
                      style={{ background: 'none', border: 'none', color: t.accent, fontSize: '1.25rem', fontFamily: 'monospace', outline: 'none', width: '100%' }} placeholder="0"/>
                  </div>
                </div>
              </div>
            </div>

            {/* Columna derecha */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ backgroundColor: t.panel, border: `1px solid ${t.border}`, borderRadius: 14, padding: 20 }}>
                <h3 style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: t.textDim, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}><Briefcase size={12}/> Notas Internas</h3>
                <textarea value={activeProyecto.notas || ''} onChange={e => setActiveProyecto({...activeProyecto, notas: e.target.value})}
                  onFocus={inputFocus} onBlur={inputBlur}
                  placeholder="Requerimientos, instrucciones especiales, assets entregados..."
                  style={{ width: '100%', backgroundColor: t.inputBg, border: `1px solid ${t.borderLight}`, borderRadius: 12, padding: 12, fontSize: 14, color: t.text, outline: 'none', minHeight: 120, resize: 'none', transition: 'border-color 0.2s' }}/>
              </div>

              <div style={{ background: `linear-gradient(135deg, ${t.accentSoft}, transparent)`, border: `1px solid ${t.border}`, borderRadius: 14, padding: 20 }}>
                <h3 style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: t.accent, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <FolderOpen size={12}/> Carpeta en Drive
                </h3>
                <div style={{ backgroundColor: t.inputBg, border: `1px solid ${t.borderLight}`, borderRadius: 12, padding: 12, position: 'relative' }}>
                  <input type="text" value={activeProyecto.drive || ''} onChange={e => setActiveProyecto({...activeProyecto, drive: e.target.value})}
                    onFocus={inputFocus} onBlur={inputBlur}
                    style={{ width: '100%', background: 'none', border: 'none', borderBottom: `1px solid ${t.borderLight}`, paddingBottom: 4, color: t.text, fontSize: 12, outline: 'none', paddingRight: 80 }} placeholder="https://drive.google.com/..."/>
                  {activeProyecto.drive && (
                    <a href={activeProyecto.drive} target="_blank" rel="noreferrer"
                      style={{ position: 'absolute', top: 12, right: 12, fontSize: 9, backgroundColor: `${t.accent}20`, color: t.accent, padding: '4px 8px', borderRadius: 6, fontWeight: 700, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none', transition: 'background 0.2s' }}>
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
