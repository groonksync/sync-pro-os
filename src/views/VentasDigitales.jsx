import React, { useState } from 'react';
import { Plus, TrendingUp, Download, Trash2, ArrowUpRight, ShoppingBag, Globe } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

const PLATAFORMAS = ['Gumroad', 'Etsy', 'Shopify', 'Patreon', 'Gumroad', 'Ko-fi', 'Directo', 'Otra'];
const CATEGORIAS = ['Preset', 'Plantilla', 'Curso', 'Pack de Footage', 'LUT', 'Plugin', 'Otro'];

const VentasDigitales = ({ data, setData }) => {
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
    <div className="animate-in fade-in duration-300 max-w-[1200px] w-full">
      <header className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-light text-white tracking-tight">Ventas Digitales</h2>
          <p className="text-[11px] text-neutral-500 uppercase tracking-widest mt-1">Registro de ingresos por productos digitales</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5">
          <Plus size={14}/> Registrar Venta
        </button>
      </header>

      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-5">
          <p className="text-[11px] text-neutral-500 uppercase tracking-widest mb-3 flex items-center gap-1.5"><Download size={12}/> Total Acumulado</p>
          <p className="text-3xl font-light text-white">${totalGeneral.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-white/[0.02] border border-emerald-500/10 rounded-xl p-5">
          <p className="text-[11px] text-neutral-500 uppercase tracking-widest mb-3 flex items-center gap-1.5"><TrendingUp size={12}/> Este Mes</p>
          <p className="text-3xl font-light text-emerald-400">${totalMesActual.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          {crecimiento !== null && (
            <p className={`text-[10px] mt-1 font-bold flex items-center gap-1 ${parseFloat(crecimiento) >= 0 ? 'text-emerald-500' : 'text-rose-400'}`}>
              <ArrowUpRight size={10}/> {crecimiento}% vs mes anterior
            </p>
          )}
        </div>
        <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-5">
          <p className="text-[11px] text-neutral-500 uppercase tracking-widest mb-3 flex items-center gap-1.5"><ShoppingBag size={12}/> Total Ventas</p>
          <p className="text-3xl font-light text-white">{ventas.length}</p>
          <p className="text-[10px] text-neutral-600 mt-1">{ventas.filter(v => v.fecha?.startsWith(mesActual)).length} este mes</p>
        </div>
      </div>

      {/* Mini gráfico de barras */}
      <div className="bg-[#0a0a0a] border border-white/[0.05] rounded-xl p-5 mb-6">
        <p className="text-[11px] text-neutral-500 uppercase tracking-widest mb-4 flex items-center gap-1.5"><TrendingUp size={12}/> Ingresos Últimos 6 Meses</p>
        <div className="flex items-end gap-3 h-20">
          {ultimos6Meses.map(m => (
            <div key={m.key} className="flex-1 flex flex-col items-center gap-1.5">
              <p className="text-[9px] text-neutral-500 font-mono">${m.total > 0 ? m.total.toLocaleString('en', { maximumFractionDigits: 0 }) : ''}</p>
              <div className="w-full rounded-t-sm bg-amber-500/20 relative overflow-hidden transition-all duration-700"
                style={{ height: `${Math.max((m.total / maxMes) * 60, m.total > 0 ? 4 : 1)}px` }}>
                <div className={`absolute inset-0 ${m.key === mesActual ? 'bg-amber-500' : 'bg-amber-500/40'} rounded-t-sm`}/>
              </div>
              <p className={`text-[9px] uppercase font-bold ${m.key === mesActual ? 'text-amber-400' : 'text-neutral-600'}`}>{m.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Formulario de nueva venta (colapsable) */}
      {showForm && (
        <div className="bg-[#0a0a0a] border border-amber-500/20 rounded-xl p-5 mb-5 animate-in slide-in-from-top-2 duration-200">
          <h3 className="text-[11px] text-amber-500 uppercase tracking-widest font-bold mb-4">Nueva Venta</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className="text-[10px] uppercase tracking-widest text-neutral-500 font-bold mb-1.5 block">Producto *</label>
              <input type="text" value={form.producto} onChange={e => setForm({...form, producto: e.target.value})}
                className="w-full bg-black/40 border border-white/10 rounded-md px-3 py-2 text-xs text-white outline-none focus:border-amber-500/50" placeholder="Ej: Urban Cinematic Preset Pack" autoFocus/>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest text-neutral-500 font-bold mb-1.5 block">Monto ($) *</label>
              <input type="number" value={form.monto} onChange={e => setForm({...form, monto: e.target.value})}
                className="w-full bg-black/40 border border-white/10 rounded-md px-3 py-2 text-xs text-white outline-none focus:border-amber-500/50" placeholder="0.00"/>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest text-neutral-500 font-bold mb-1.5 block">Categoría</label>
              <select value={form.categoria} onChange={e => setForm({...form, categoria: e.target.value})}
                className="w-full bg-black/40 border border-white/10 rounded-md px-3 py-2 text-xs text-white outline-none cursor-pointer">
                {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest text-neutral-500 font-bold mb-1.5 block">Plataforma</label>
              <select value={form.plataforma} onChange={e => setForm({...form, plataforma: e.target.value})}
                className="w-full bg-black/40 border border-white/10 rounded-md px-3 py-2 text-xs text-white outline-none cursor-pointer">
                {PLATAFORMAS.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest text-neutral-500 font-bold mb-1.5 block">Fecha</label>
              <input type="date" value={form.fecha} onChange={e => setForm({...form, fecha: e.target.value})}
                className="w-full bg-black/40 border border-white/10 rounded-md px-3 py-2 text-xs text-neutral-300 outline-none focus:border-amber-500/50"/>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 text-xs text-neutral-400 hover:text-white">Cancelar</button>
            <button onClick={handleCreate} disabled={loading || !form.producto || !form.monto}
              className="px-5 py-2 bg-amber-500 text-black text-xs font-bold rounded-md hover:bg-amber-400 disabled:opacity-50 transition-colors">
              {loading ? 'Guardando...' : 'Registrar Venta'}
            </button>
          </div>
        </div>
      )}

      {/* Tabla de ventas */}
      <div className="bg-[#0a0a0a] border border-white/[0.05] rounded-xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-black/40 border-b border-white/[0.05]">
              <th className="px-4 py-3 text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Producto</th>
              <th className="px-4 py-3 text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Plataforma</th>
              <th className="px-4 py-3 text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Fecha</th>
              <th className="px-4 py-3 text-[10px] font-bold text-neutral-500 uppercase tracking-widest text-right">Monto</th>
              <th className="px-4 py-3 w-10"></th>
            </tr>
          </thead>
          <tbody>
            {ventas.length > 0 ? [...ventas].sort((a, b) => b.fecha?.localeCompare(a.fecha)).map(v => (
              <tr key={v.id} className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors group">
                <td className="px-4 py-3">
                  <p className="text-xs text-white font-medium">{v.producto}</p>
                  <span className="text-[9px] bg-white/5 text-neutral-400 px-1.5 py-0.5 rounded border border-white/5 mt-0.5 inline-block">{v.categoria}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-[10px] text-neutral-400 flex items-center gap-1"><Globe size={10}/>{v.plataforma}</span>
                </td>
                <td className="px-4 py-3 text-xs text-neutral-500 font-mono">{v.fecha}</td>
                <td className="px-4 py-3 text-right">
                  <p className="text-sm font-mono font-bold text-emerald-400">${parseFloat(v.monto).toLocaleString('en', { minimumFractionDigits: 2 })}</p>
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => handleDelete(v.id)} className="p-1.5 text-neutral-600 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100">
                    <Trash2 size={13}/>
                  </button>
                </td>
              </tr>
            )) : (
              <tr><td colSpan="5" className="px-4 py-10 text-center text-neutral-600 text-xs italic tracking-widest">Sin ventas registradas. Registra tu primera venta.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default VentasDigitales;
