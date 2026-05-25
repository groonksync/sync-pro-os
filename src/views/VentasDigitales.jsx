import React, { useState, useMemo } from 'react';
import { Plus, TrendingUp, Download, Trash2, ArrowUpRight, ShoppingBag, Globe } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { getTheme } from '../lib/theme';

const PLATAFORMAS = ['Gumroad', 'Etsy', 'Shopify', 'Patreon', 'Gumroad', 'Ko-fi', 'Directo', 'Otra'];
const CATEGORIAS = ['Preset', 'Plantilla', 'Curso', 'Pack de Footage', 'LUT', 'Plugin', 'Otro'];

const VentasDigitales = ({ data, setData, isDark = true }) => {
  const t = useMemo(() => getTheme(isDark), [isDark]);
  const ventas = data.ventas || [];
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    fecha: new Date().toISOString().split('T')[0],
    producto: '',
    categoria: 'Preset',
    plataforma: 'Gumroad',
    monto: '',
    notas: '',
  });

  // ── Cálculos ──────────────────────────────────────────────────────────────
  const ahora = new Date();
  const mesActual = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}`;
  const mesAnterior = (() => {
    const d = new Date(ahora); d.setMonth(d.getMonth() - 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  })();

  const totalGeneral = ventas.reduce((acc, v) => acc + (parseFloat(v.monto) || 0), 0);
  const totalMesActual = ventas.filter(v => v.fecha?.startsWith(mesActual)).reduce((acc, v) => acc + (parseFloat(v.monto) || 0), 0);
  const totalMesAnterior = ventas.filter(v => v.fecha?.startsWith(mesAnterior)).reduce((acc, v) => acc + (parseFloat(v.monto) || 0), 0);
  const crecimiento = totalMesAnterior > 0 ? (((totalMesActual - totalMesAnterior) / totalMesAnterior) * 100).toFixed(1) : null;

  // ── Mini gráfico de barras (últimos 6 meses) ──────────────────────────────
  const ultimos6Meses = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(ahora); d.setMonth(d.getMonth() - (5 - i));
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleString('es', { month: 'short' });
    const total = ventas.filter(v => v.fecha?.startsWith(key)).reduce((acc, v) => acc + (parseFloat(v.monto) || 0), 0);
    return { key, label, total };
  });
  const maxMes = Math.max(...ultimos6Meses.map(m => m.total), 1);

  // ── Crear venta ───────────────────────────────────────────────────────────
  const handleCreate = async () => {
    if (!form.producto.trim() || !form.monto) return;
    setLoading(true);
    const newVenta = { id: crypto.randomUUID(), ...form, monto: parseFloat(form.monto) };
    try {
      const { error } = await supabase.from('ventas').insert(newVenta);
      if (error) throw error;
      setData(prev => ({ ...prev, ventas: [newVenta, ...prev.ventas] }));
      setForm({ fecha: new Date().toISOString().split('T')[0], producto: '', categoria: 'Preset', plataforma: 'Gumroad', monto: '', notas: '' });
      setShowForm(false);
    } catch (err) { alert('Error: ' + err.message); }
    finally { setLoading(false); }
  };

  // ── Eliminar ──────────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar esta venta?')) return;
    try {
      await supabase.from('ventas').delete().eq('id', id);
      setData(prev => ({ ...prev, ventas: prev.ventas.filter(v => v.id !== id) }));
    } catch (err) { alert('Error: ' + err.message); }
  };

  return (
    <div className="flex flex-col h-full w-full animate-in fade-in duration-300">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: t.text, letterSpacing: '-0.02em', margin: 0 }}>Ventas Digitales</h2>
          <p style={{ fontSize: '0.75rem', color: t.textDim, marginTop: '4px', fontWeight: 500 }}>Registro de ingresos por productos digitales</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          style={{ padding: '10px 24px', backgroundColor: t.accent, color: '#000', borderRadius: 12, fontWeight: 900, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.2em', display: 'flex', alignItems: 'center', gap: 10, border: 'none', cursor: 'pointer', transition: 'all 0.2s' }}>
          <Plus size={16} strokeWidth={3}/> Registrar Venta
        </button>
      </header>

      {/* Tarjetas de resumen */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
        <div style={{ backgroundColor: t.panel, border: `1px solid ${t.border}`, borderRadius: 14, padding: 20, boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
          <p style={{ fontSize: 9, fontWeight: 900, color: t.textDim, textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}><Download size={12}/> Total Acumulado</p>
          <p style={{ fontSize: 28, fontWeight: 300, color: t.text }}>${totalGeneral.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        </div>
        <div style={{ backgroundColor: t.panel, border: `1px solid ${t.border}`, borderRadius: 14, padding: 20, boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
          <p style={{ fontSize: 9, fontWeight: 900, color: t.textDim, textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}><TrendingUp size={12}/> Este Mes</p>
          <p style={{ fontSize: 28, fontWeight: 300, color: t.success }}>${totalMesActual.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          {crecimiento !== null && (
            <p style={{ fontSize: 10, marginTop: 4, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4, color: parseFloat(crecimiento) >= 0 ? t.success : t.danger }}>
              <ArrowUpRight size={10}/> {crecimiento}% vs mes anterior
            </p>
          )}
        </div>
        <div style={{ backgroundColor: t.panel, border: `1px solid ${t.border}`, borderRadius: 14, padding: 20, boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
          <p style={{ fontSize: 9, fontWeight: 900, color: t.textDim, textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}><ShoppingBag size={12}/> Total Ventas</p>
          <p style={{ fontSize: 28, fontWeight: 300, color: t.text }}>{ventas.length}</p>
          <p style={{ fontSize: 10, color: t.textMuted, marginTop: 4 }}>{ventas.filter(v => v.fecha?.startsWith(mesActual)).length} este mes</p>
        </div>
      </div>

      {/* Mini gráfico de barras */}
      <div style={{ backgroundColor: t.panel, border: `1px solid ${t.border}`, borderRadius: 14, padding: 20, marginBottom: 32, boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
        <p style={{ fontSize: 9, fontWeight: 900, color: t.textDim, textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}><TrendingUp size={12}/> Ingresos Últimos 6 Meses</p>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 80 }}>
          {ultimos6Meses.map(m => (
            <div key={m.key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <p style={{ fontSize: 9, color: t.textMuted, fontFamily: 'monospace' }}>${m.total > 0 ? m.total.toLocaleString('en', { maximumFractionDigits: 0 }) : ''}</p>
              <div style={{ width: '100%', borderRadius: 4, backgroundColor: `${t.accent}20`, position: 'relative', overflow: 'hidden', transition: 'all 0.7s', height: `${Math.max((m.total / maxMes) * 60, m.total > 0 ? 4 : 1)}px` }}>
                <div style={{ position: 'absolute', inset: 0, backgroundColor: m.key === mesActual ? t.accent : `${t.accent}66`, borderRadius: 4 }}/>
              </div>
              <p style={{ fontSize: 9, textTransform: 'uppercase', fontWeight: 700, color: m.key === mesActual ? t.accent : t.textMuted }}>{m.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Formulario de nueva venta (colapsable) */}
      {showForm && (
        <div style={{ backgroundColor: t.panel, border: `1px solid ${t.accent}33`, borderRadius: 14, padding: 24, marginBottom: 24, boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
          <h3 style={{ fontSize: 11, color: t.accent, textTransform: 'uppercase', letterSpacing: '0.2em', fontWeight: 700, marginBottom: 16 }}>Nueva Venta</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: t.textDim, fontWeight: 700, marginBottom: 6, display: 'block' }}>Producto *</label>
              <input type="text" value={form.producto} onChange={e => setForm({...form, producto: e.target.value})}
                style={{ width: '100%', backgroundColor: t.inputBg, border: `1px solid ${t.borderLight}`, borderRadius: 8, padding: '8px 12px', fontSize: 12, color: t.text, outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                placeholder="Ej: Urban Cinematic Preset Pack" autoFocus
                onFocus={e => e.currentTarget.style.borderColor = t.accent}
                onBlur={e => e.currentTarget.style.borderColor = t.borderLight}/>
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
              <label style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: t.textDim, fontWeight: 700, marginBottom: 6, display: 'block' }}>Categoría</label>
              <select value={form.categoria} onChange={e => setForm({...form, categoria: e.target.value})}
                style={{ width: '100%', backgroundColor: t.inputBg, border: `1px solid ${t.borderLight}`, borderRadius: 8, padding: '8px 12px', fontSize: 12, color: t.text, outline: 'none', cursor: 'pointer', boxSizing: 'border-box' }}>
                {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: t.textDim, fontWeight: 700, marginBottom: 6, display: 'block' }}>Plataforma</label>
              <select value={form.plataforma} onChange={e => setForm({...form, plataforma: e.target.value})}
                style={{ width: '100%', backgroundColor: t.inputBg, border: `1px solid ${t.borderLight}`, borderRadius: 8, padding: '8px 12px', fontSize: 12, color: t.text, outline: 'none', cursor: 'pointer', boxSizing: 'border-box' }}>
                {PLATAFORMAS.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: t.textDim, fontWeight: 700, marginBottom: 6, display: 'block' }}>Fecha</label>
              <input type="date" value={form.fecha} onChange={e => setForm({...form, fecha: e.target.value})}
                style={{ width: '100%', backgroundColor: t.inputBg, border: `1px solid ${t.borderLight}`, borderRadius: 8, padding: '8px 12px', fontSize: 12, color: t.textMuted, outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                onFocus={e => e.currentTarget.style.borderColor = t.accent}
                onBlur={e => e.currentTarget.style.borderColor = t.borderLight}/>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 20 }}>
            <button onClick={() => setShowForm(false)}
              style={{ padding: '8px 16px', fontSize: 11, color: t.textDim, background: 'none', border: 'none', cursor: 'pointer', transition: 'color 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.color = t.text}
              onMouseLeave={e => e.currentTarget.style.color = t.textDim}>
              Cancelar
            </button>
            <button onClick={handleCreate} disabled={loading || !form.producto || !form.monto}
              style={{ padding: '10px 24px', backgroundColor: loading || !form.producto || !form.monto ? t.textMuted : t.accent, color: '#000', borderRadius: 12, fontWeight: 900, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.2em', border: 'none', cursor: loading || !form.producto || !form.monto ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}>
              {loading ? 'Guardando...' : 'Registrar Venta'}
            </button>
          </div>
        </div>
      )}

      {/* Tabla de ventas */}
      <div style={{ backgroundColor: t.panel, border: `1px solid ${t.border}`, borderRadius: 14, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${t.border}`, backgroundColor: t.accentSoft }}>
              <th style={{ padding: '12px 16px', fontSize: 9, fontWeight: 900, color: t.textDim, textTransform: 'uppercase', letterSpacing: '0.2em' }}>Producto</th>
              <th style={{ padding: '12px 16px', fontSize: 9, fontWeight: 900, color: t.textDim, textTransform: 'uppercase', letterSpacing: '0.2em' }}>Plataforma</th>
              <th style={{ padding: '12px 16px', fontSize: 9, fontWeight: 900, color: t.textDim, textTransform: 'uppercase', letterSpacing: '0.2em' }}>Fecha</th>
              <th style={{ padding: '12px 16px', fontSize: 9, fontWeight: 900, color: t.textDim, textTransform: 'uppercase', letterSpacing: '0.2em', textAlign: 'right' }}>Monto</th>
              <th style={{ padding: '12px 16px', width: 40 }}></th>
            </tr>
          </thead>
          <tbody>
            {ventas.length > 0 ? [...ventas].sort((a, b) => b.fecha?.localeCompare(a.fecha)).map(v => (
              <tr key={v.id}
                style={{ borderBottom: `1px solid ${t.border}`, transition: 'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = t.hover}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                <td style={{ padding: '12px 16px' }}>
                  <p style={{ fontSize: 12, color: t.text, fontWeight: 500, margin: 0 }}>{v.producto}</p>
                  <span style={{ fontSize: 9, backgroundColor: t.accentSoft, color: t.textDim, padding: '1px 6px', borderRadius: 4, border: `1px solid ${t.borderLight}`, marginTop: 2, display: 'inline-block' }}>{v.categoria}</span>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ fontSize: 10, color: t.textDim, display: 'flex', alignItems: 'center', gap: 4 }}><Globe size={10}/>{v.plataforma}</span>
                </td>
                <td style={{ padding: '12px 16px', fontSize: 11, color: t.textDim, fontFamily: 'monospace' }}>{v.fecha}</td>
                <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                  <p style={{ fontSize: 13, fontFamily: 'monospace', fontWeight: 700, color: t.success, margin: 0 }}>${parseFloat(v.monto).toLocaleString('en', { minimumFractionDigits: 2 })}</p>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <button onClick={() => handleDelete(v.id)}
                    style={{ padding: 6, borderRadius: 8, border: 'none', backgroundColor: 'transparent', color: t.textMuted, cursor: 'pointer', transition: 'all 0.2s' }}
                    onMouseEnter={e => { e.currentTarget.style.color = t.danger; }}
                    onMouseLeave={e => { e.currentTarget.style.color = t.textMuted; }}>
                    <Trash2 size={13}/>
                  </button>
                </td>
              </tr>
            )) : (
              <tr><td colSpan="5" style={{ padding: '40px 16px', textAlign: 'center', color: t.textDim, fontSize: 11, fontStyle: 'italic' }}>Sin ventas registradas. Registra tu primera venta.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default VentasDigitales;
