import React, { useState, useMemo } from 'react';
import { Plus, Trash2, CreditCard, ArrowDownRight, Tag, Coffee, Wrench, Wifi, User, ShoppingCart } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { getTheme } from '../lib/theme';

const CATEGORIAS = [
  { label: 'Suscripción', icon: Wifi },
  { label: 'Herramienta', icon: Wrench },
  { label: 'Servicio',    icon: Tag },
  { label: 'Personal',   icon: User },
  { label: 'Compra',     icon: ShoppingCart },
  { label: 'Otro',       icon: Coffee },
];

const catConfig = Object.fromEntries(CATEGORIAS.map(c => [c.label, c]));

const MisEgresos = ({ data, setData, isDark = true }) => {
  const t = useMemo(() => getTheme(isDark), [isDark]);
  const egresos = data.egresos || [];
  const ventas  = data.ventas  || [];
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    fecha: new Date().toISOString().split('T')[0],
    descripcion: '',
    categoria: 'Suscripción',
    monto: '',
    notas: '',
  });

  // ── Cálculos ──────────────────────────────────────────────────────────────
  const ahora = new Date();
  const mesActual = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}`;

  const totalEgresos    = egresos.reduce((acc, e) => acc + (parseFloat(e.monto) || 0), 0);
  const egresosMes      = egresos.filter(e => e.fecha?.startsWith(mesActual)).reduce((acc, e) => acc + (parseFloat(e.monto) || 0), 0);
  const ingresosMes     = ventas.filter(v => v.fecha?.startsWith(mesActual)).reduce((acc, v) => acc + (parseFloat(v.monto) || 0), 0);
  const gananciaNeta    = ingresosMes - egresosMes;

  // ── Crear egreso ──────────────────────────────────────────────────────────
  const handleCreate = async () => {
    if (!form.descripcion.trim() || !form.monto) return;
    setLoading(true);
    const newEgreso = { id: crypto.randomUUID(), ...form, monto: parseFloat(form.monto) };
    try {
      const { error } = await supabase.from('egresos').insert(newEgreso);
      if (error) throw error;
      setData(prev => ({ ...prev, egresos: [newEgreso, ...prev.egresos] }));
      setForm({ fecha: new Date().toISOString().split('T')[0], descripcion: '', categoria: 'Suscripción', monto: '', notas: '' });
      setShowForm(false);
    } catch (err) { alert('Error: ' + err.message); }
    finally { setLoading(false); }
  };

  // ── Eliminar ──────────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este egreso?')) return;
    try {
      await supabase.from('egresos').delete().eq('id', id);
      setData(prev => ({ ...prev, egresos: prev.egresos.filter(e => e.id !== id) }));
    } catch (err) { alert('Error: ' + err.message); }
  };

  // ── Gastos por categoría ──────────────────────────────────────────────────
  const porCategoria = CATEGORIAS.map(cat => ({
    ...cat,
    total: egresos.filter(e => e.categoria === cat.label).reduce((acc, e) => acc + (parseFloat(e.monto) || 0), 0),
  })).filter(c => c.total > 0).sort((a, b) => b.total - a.total);

  return (
    <div className="flex flex-col h-full w-full animate-in fade-in duration-300">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: t.text, letterSpacing: '-0.02em', margin: 0 }}>Mis Egresos</h2>
          <p style={{ fontSize: '0.75rem', color: t.textDim, marginTop: '4px', fontWeight: 500 }}>Control de gastos y balance mensual</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          style={{ padding: '10px 24px', backgroundColor: t.accent, color: '#000', borderRadius: 12, fontWeight: 900, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.2em', display: 'flex', alignItems: 'center', gap: 10, border: 'none', cursor: 'pointer', transition: 'all 0.2s' }}>
          <Plus size={16} strokeWidth={3}/> Registrar Egreso
        </button>
      </header>

      {/* Tarjetas de resumen */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
        <div style={{ backgroundColor: '#0a0a0a', border: `1px solid ${t.border}`, borderRadius: 14, padding: 20, boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
          <p style={{ fontSize: 9, fontWeight: 900, color: t.textDim, textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}><CreditCard size={12}/> Total Gastado</p>
          <p style={{ fontSize: 24, fontWeight: 300, color: t.text }}>${totalEgresos.toLocaleString('en', { minimumFractionDigits: 2 })}</p>
        </div>
        <div style={{ backgroundColor: '#0a0a0a', border: `1px solid ${t.border}`, borderRadius: 14, padding: 20, boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
          <p style={{ fontSize: 9, fontWeight: 900, color: t.textDim, textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}><ArrowDownRight size={12}/> Egresos Este Mes</p>
          <p style={{ fontSize: 24, fontWeight: 300, color: t.danger }}>${egresosMes.toLocaleString('en', { minimumFractionDigits: 2 })}</p>
        </div>
        <div style={{ backgroundColor: '#0a0a0a', border: `1px solid ${t.border}`, borderRadius: 14, padding: 20, boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
          <p style={{ fontSize: 9, fontWeight: 900, color: t.textDim, textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: 12 }}>Ingresos Este Mes</p>
          <p style={{ fontSize: 24, fontWeight: 300, color: t.success }}>${ingresosMes.toLocaleString('en', { minimumFractionDigits: 2 })}</p>
          <p style={{ fontSize: 9, color: t.textMuted, marginTop: 4 }}>Ventas digitales</p>
        </div>
        <div style={{ backgroundColor: '#0a0a0a', border: `1px solid ${t.border}`, borderRadius: 14, padding: 20, boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
          <p style={{ fontSize: 9, fontWeight: 900, color: t.textDim, textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: 12 }}>Ganancia Neta Mes</p>
          <p style={{ fontSize: 24, fontWeight: 300, fontFamily: 'monospace', color: gananciaNeta >= 0 ? t.success : t.danger }}>
            {gananciaNeta >= 0 ? '+' : ''}${gananciaNeta.toLocaleString('en', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 20, marginBottom: 32 }}>
        {/* Gastos por categoría */}
        {porCategoria.length > 0 && (
          <div style={{ gridColumn: 'span 4', backgroundColor: t.panel, border: `1px solid ${t.border}`, borderRadius: 14, padding: 20, boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
            <p style={{ fontSize: 9, fontWeight: 900, color: t.textDim, textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: 16 }}>Por Categoría</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {porCategoria.map(cat => {
                const Icon = cat.icon;
                const pct = Math.round((cat.total / (totalEgresos || 1)) * 100);
                return (
                  <div key={cat.label}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, color: t.textDim }}>
                        <Icon size={10} color={t.accent}/>{cat.label}
                      </span>
                      <span style={{ fontSize: 10, color: t.textMuted, fontFamily: 'monospace' }}>${cat.total.toLocaleString('en', { maximumFractionDigits: 0 })}</span>
                    </div>
                    <div style={{ height: 4, backgroundColor: t.accentSoft, borderRadius: 10, overflow: 'hidden' }}>
                      <div style={{ height: '100%', backgroundColor: t.accent, borderRadius: 10, transition: 'all 0.5s', width: `${pct}%` }}/>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Formulario si está abierto */}
        {showForm && (
          <div style={{ gridColumn: 'span 8', backgroundColor: t.panel, border: `1px solid ${t.accent}33`, borderRadius: 14, padding: 24, boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
            <h3 style={{ fontSize: 11, color: t.accent, textTransform: 'uppercase', letterSpacing: '0.2em', fontWeight: 700, marginBottom: 16 }}>Nuevo Egreso</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: t.textDim, fontWeight: 700, marginBottom: 6, display: 'block' }}>Descripción *</label>
                <input type="text" value={form.descripcion} onChange={e => setForm({...form, descripcion: e.target.value})}
                  style={{ width: '100%', backgroundColor: t.inputBg, border: `1px solid ${t.borderLight}`, borderRadius: 8, padding: '8px 12px', fontSize: 12, color: t.text, outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                  placeholder="Ej: Adobe Creative Cloud" autoFocus
                  onFocus={e => e.currentTarget.style.borderColor = t.accent}
                  onBlur={e => e.currentTarget.style.borderColor = t.borderLight}/>
              </div>
              <div>
                <label style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: t.textDim, fontWeight: 700, marginBottom: 6, display: 'block' }}>Categoría</label>
                <select value={form.categoria} onChange={e => setForm({...form, categoria: e.target.value})}
                  style={{ width: '100%', backgroundColor: t.inputBg, border: `1px solid ${t.borderLight}`, borderRadius: 8, padding: '8px 12px', fontSize: 12, color: t.text, outline: 'none', cursor: 'pointer', boxSizing: 'border-box' }}>
                  {CATEGORIAS.map(c => <option key={c.label}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: t.textDim, fontWeight: 700, marginBottom: 6, display: 'block' }}>Monto ($) *</label>
                <input type="number" value={form.monto} onChange={e => setForm({...form, monto: e.target.value})}
                  style={{ width: '100%', backgroundColor: t.inputBg, border: `1px solid ${t.borderLight}`, borderRadius: 8, padding: '8px 12px', fontSize: 12, color: t.text, outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                  placeholder="0.00"
                  onFocus={e => e.currentTarget.style.borderColor = t.accent}
                  onBlur={e => e.currentTarget.style.borderColor = t.borderLight}/>
              </div>
              <div>
                <label style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: t.textDim, fontWeight: 700, marginBottom: 6, display: 'block' }}>Fecha</label>
                <input type="date" value={form.fecha} onChange={e => setForm({...form, fecha: e.target.value})}
                  style={{ width: '100%', backgroundColor: t.inputBg, border: `1px solid ${t.borderLight}`, borderRadius: 8, padding: '8px 12px', fontSize: 12, color: t.textMuted, outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                  onFocus={e => e.currentTarget.style.borderColor = t.accent}
                  onBlur={e => e.currentTarget.style.borderColor = t.borderLight}/>
              </div>
              <div>
                <label style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: t.textDim, fontWeight: 700, marginBottom: 6, display: 'block' }}>Notas</label>
                <input type="text" value={form.notas} onChange={e => setForm({...form, notas: e.target.value})}
                  style={{ width: '100%', backgroundColor: t.inputBg, border: `1px solid ${t.borderLight}`, borderRadius: 8, padding: '8px 12px', fontSize: 12, color: t.text, outline: 'none', boxSizing: 'border-box' }}
                  placeholder="Opcional..."/>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 20 }}>
              <button onClick={() => setShowForm(false)}
                style={{ padding: '8px 16px', fontSize: 11, color: t.textDim, background: 'none', border: 'none', cursor: 'pointer', transition: 'color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.color = t.text}
                onMouseLeave={e => e.currentTarget.style.color = t.textDim}>
                Cancelar
              </button>
              <button onClick={handleCreate} disabled={loading || !form.descripcion || !form.monto}
                style={{ padding: '10px 24px', backgroundColor: loading || !form.descripcion || !form.monto ? t.textMuted : t.accent, color: '#000', borderRadius: 12, fontWeight: 900, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.2em', border: 'none', cursor: loading || !form.descripcion || !form.monto ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}>
                {loading ? 'Guardando...' : 'Registrar Egreso'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Tabla de egresos */}
      <div style={{ backgroundColor: t.panel, border: `1px solid ${t.border}`, borderRadius: 14, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${t.border}`, backgroundColor: t.accentSoft }}>
              <th style={{ padding: '12px 16px', fontSize: 9, fontWeight: 900, color: t.textDim, textTransform: 'uppercase', letterSpacing: '0.2em' }}>Descripción</th>
              <th style={{ padding: '12px 16px', fontSize: 9, fontWeight: 900, color: t.textDim, textTransform: 'uppercase', letterSpacing: '0.2em' }}>Categoría</th>
              <th style={{ padding: '12px 16px', fontSize: 9, fontWeight: 900, color: t.textDim, textTransform: 'uppercase', letterSpacing: '0.2em' }}>Fecha</th>
              <th style={{ padding: '12px 16px', fontSize: 9, fontWeight: 900, color: t.textDim, textTransform: 'uppercase', letterSpacing: '0.2em', textAlign: 'right' }}>Monto</th>
              <th style={{ padding: '12px 16px', width: 40 }}></th>
            </tr>
          </thead>
          <tbody>
            {egresos.length > 0 ? [...egresos].sort((a, b) => b.fecha?.localeCompare(a.fecha)).map(e => {
              const cat = catConfig[e.categoria] || catConfig['Otro'];
              const Icon = cat.icon;
              return (
                <tr key={e.id}
                  style={{ borderBottom: `1px solid ${t.border}`, transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = t.hover}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <td style={{ padding: '12px 16px' }}>
                    <p style={{ fontSize: 12, color: t.text, fontWeight: 500, margin: 0 }}>{e.descripcion}</p>
                    {e.notas && <p style={{ fontSize: 10, color: t.textMuted, marginTop: 2 }}>{e.notas}</p>}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4, color: t.textDim }}>
                      <Icon size={10} color={t.accent}/>{e.categoria}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 11, color: t.textDim, fontFamily: 'monospace' }}>{e.fecha}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <p style={{ fontSize: 13, fontFamily: 'monospace', fontWeight: 700, color: t.danger, margin: 0 }}>-${parseFloat(e.monto).toLocaleString('en', { minimumFractionDigits: 2 })}</p>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <button onClick={() => handleDelete(e.id)}
                      style={{ padding: 6, borderRadius: 8, border: 'none', backgroundColor: 'transparent', color: t.textMuted, cursor: 'pointer', transition: 'all 0.2s' }}
                      onMouseEnter={e => { e.currentTarget.style.color = t.danger; }}
                      onMouseLeave={e => { e.currentTarget.style.color = t.textMuted; }}>
                      <Trash2 size={13}/>
                    </button>
                  </td>
                </tr>
              );
            }) : (
              <tr><td colSpan="5" style={{ padding: '40px 16px', textAlign: 'center', color: t.textDim, fontSize: 11, fontStyle: 'italic' }}>Sin egresos registrados.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MisEgresos;
