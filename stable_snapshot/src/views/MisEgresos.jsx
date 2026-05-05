import React, { useState } from 'react';
import { Plus, Trash2, CreditCard, ArrowDownRight, Tag, Coffee, Wrench, Wifi, User, ShoppingCart } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

const CATEGORIAS = [
  { label: 'Suscripción', icon: Wifi, color: 'text-blue-400' },
  { label: 'Herramienta', icon: Wrench, color: 'text-amber-400' },
  { label: 'Servicio',    icon: Tag, color: 'text-purple-400' },
  { label: 'Personal',   icon: User, color: 'text-rose-400' },
  { label: 'Compra',     icon: ShoppingCart, color: 'text-emerald-400' },
  { label: 'Otro',       icon: Coffee, color: 'text-neutral-400' },
];

const catConfig = Object.fromEntries(CATEGORIAS.map(c => [c.label, c]));

const MisEgresos = ({ data, setData }) => {
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
    <div className="animate-in fade-in duration-300 max-w-[1200px] w-full">
      <header className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-light text-white tracking-tight">Mis Egresos</h2>
          <p className="text-[11px] text-neutral-500 uppercase tracking-widest mt-1">Control de gastos y balance mensual</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5">
          <Plus size={14}/> Registrar Egreso
        </button>
      </header>

      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-4">
          <p className="text-[10px] text-neutral-500 uppercase tracking-widest mb-2 flex items-center gap-1"><CreditCard size={10}/> Total Gastado</p>
          <p className="text-2xl font-light text-white">${totalEgresos.toLocaleString('en', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-rose-500/5 border border-rose-500/10 rounded-xl p-4">
          <p className="text-[10px] text-neutral-500 uppercase tracking-widest mb-2 flex items-center gap-1"><ArrowDownRight size={10}/> Egresos Este Mes</p>
          <p className="text-2xl font-light text-rose-400">${egresosMes.toLocaleString('en', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-4">
          <p className="text-[10px] text-neutral-500 uppercase tracking-widest mb-2">Ingresos Este Mes</p>
          <p className="text-2xl font-light text-emerald-400">${ingresosMes.toLocaleString('en', { minimumFractionDigits: 2 })}</p>
          <p className="text-[9px] text-neutral-600 mt-1">Ventas digitales</p>
        </div>
        <div className={`border rounded-xl p-4 ${gananciaNeta >= 0 ? 'bg-emerald-500/5 border-emerald-500/10' : 'bg-rose-500/5 border-rose-500/10'}`}>
          <p className="text-[10px] text-neutral-500 uppercase tracking-widest mb-2">Ganancia Neta Mes</p>
          <p className={`text-2xl font-light font-mono ${gananciaNeta >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {gananciaNeta >= 0 ? '+' : ''}${gananciaNeta.toLocaleString('en', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-5 mb-6">
        {/* Gastos por categoría */}
        {porCategoria.length > 0 && (
          <div className="col-span-4 bg-[#0a0a0a] border border-white/[0.05] rounded-xl p-5">
            <p className="text-[11px] text-neutral-500 uppercase tracking-widest mb-4">Por Categoría</p>
            <div className="space-y-3">
              {porCategoria.map(cat => {
                const Icon = cat.icon;
                const pct = Math.round((cat.total / (totalEgresos || 1)) * 100);
                return (
                  <div key={cat.label}>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-[10px] font-bold flex items-center gap-1.5 ${cat.color}`}><Icon size={10}/>{cat.label}</span>
                      <span className="text-[10px] text-neutral-400 font-mono">${cat.total.toLocaleString('en', { maximumFractionDigits: 0 })}</span>
                    </div>
                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-current rounded-full transition-all duration-500" style={{ width: `${pct}%`, color: 'inherit' }}
                        className={`h-full rounded-full transition-all duration-500 ${cat.color.replace('text-', 'bg-').replace('400', '400/60')}`}/>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Formulario si está abierto */}
        {showForm && (
          <div className="col-span-8 bg-[#0a0a0a] border border-amber-500/20 rounded-xl p-5 animate-in fade-in duration-200">
            <h3 className="text-[11px] text-amber-500 uppercase tracking-widest font-bold mb-4">Nuevo Egreso</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-[10px] uppercase tracking-widest text-neutral-500 font-bold mb-1.5 block">Descripción *</label>
                <input type="text" value={form.descripcion} onChange={e => setForm({...form, descripcion: e.target.value})}
                  className="w-full bg-black/40 border border-white/10 rounded-md px-3 py-2 text-xs text-white outline-none focus:border-amber-500/50" placeholder="Ej: Adobe Creative Cloud" autoFocus/>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-neutral-500 font-bold mb-1.5 block">Categoría</label>
                <select value={form.categoria} onChange={e => setForm({...form, categoria: e.target.value})}
                  className="w-full bg-black/40 border border-white/10 rounded-md px-3 py-2 text-xs text-white outline-none cursor-pointer">
                  {CATEGORIAS.map(c => <option key={c.label}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-neutral-500 font-bold mb-1.5 block">Monto ($) *</label>
                <input type="number" value={form.monto} onChange={e => setForm({...form, monto: e.target.value})}
                  className="w-full bg-black/40 border border-white/10 rounded-md px-3 py-2 text-xs text-white outline-none focus:border-amber-500/50" placeholder="0.00"/>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-neutral-500 font-bold mb-1.5 block">Fecha</label>
                <input type="date" value={form.fecha} onChange={e => setForm({...form, fecha: e.target.value})}
                  className="w-full bg-black/40 border border-white/10 rounded-md px-3 py-2 text-xs text-neutral-300 outline-none"/>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-neutral-500 font-bold mb-1.5 block">Notas</label>
                <input type="text" value={form.notas} onChange={e => setForm({...form, notas: e.target.value})}
                  className="w-full bg-black/40 border border-white/10 rounded-md px-3 py-2 text-xs text-white outline-none" placeholder="Opcional..."/>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-xs text-neutral-400 hover:text-white">Cancelar</button>
              <button onClick={handleCreate} disabled={loading || !form.descripcion || !form.monto}
                className="px-5 py-2 bg-amber-500 text-black text-xs font-bold rounded-md hover:bg-amber-400 disabled:opacity-50">
                {loading ? 'Guardando...' : 'Registrar Egreso'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Tabla de egresos */}
      <div className="bg-[#0a0a0a] border border-white/[0.05] rounded-xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-black/40 border-b border-white/[0.05]">
              <th className="px-4 py-3 text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Descripción</th>
              <th className="px-4 py-3 text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Categoría</th>
              <th className="px-4 py-3 text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Fecha</th>
              <th className="px-4 py-3 text-[10px] font-bold text-neutral-500 uppercase tracking-widest text-right">Monto</th>
              <th className="px-4 py-3 w-10"></th>
            </tr>
          </thead>
          <tbody>
            {egresos.length > 0 ? [...egresos].sort((a, b) => b.fecha?.localeCompare(a.fecha)).map(e => {
              const cat = catConfig[e.categoria] || catConfig['Otro'];
              const Icon = cat.icon;
              return (
                <tr key={e.id} className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors group">
                  <td className="px-4 py-3">
                    <p className="text-xs text-white font-medium">{e.descripcion}</p>
                    {e.notas && <p className="text-[10px] text-neutral-600 mt-0.5">{e.notas}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-bold flex items-center gap-1 ${cat.color}`}><Icon size={10}/>{e.categoria}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-neutral-500 font-mono">{e.fecha}</td>
                  <td className="px-4 py-3 text-right">
                    <p className="text-sm font-mono font-bold text-rose-400">-${parseFloat(e.monto).toLocaleString('en', { minimumFractionDigits: 2 })}</p>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleDelete(e.id)} className="p-1.5 text-neutral-600 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100">
                      <Trash2 size={13}/>
                    </button>
                  </td>
                </tr>
              );
            }) : (
              <tr><td colSpan="5" className="px-4 py-10 text-center text-neutral-600 text-xs italic">Sin egresos registrados.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MisEgresos;
