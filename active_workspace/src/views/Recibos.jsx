import React, { useState, useRef } from 'react';
import { Plus, FileText, Printer, Trash2, CheckCircle2, Clock, ArrowLeft, Activity } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

const Recibos = ({ data, setData }) => {
  const recibos = data.recibos || [];
  const [view, setView] = useState('list'); // 'list' | 'create' | 'print'
  const [activeRecibo, setActiveRecibo] = useState(null);
  const [loading, setLoading] = useState(false);
  const printRef = useRef(null);

  const [form, setForm] = useState({
    cliente: '',
    concepto: '',
    monto: '',
    fecha: new Date().toISOString().split('T')[0],
    estado: 'Pendiente',
    notas: '',
  });

  // ── Número de recibo auto ─────────────────────────────────────────────────
  const nextNum = String((recibos.length || 0) + 1).padStart(4, '0');

  // ── Crear recibo ──────────────────────────────────────────────────────────
  const handleCreate = async () => {
    if (!form.cliente.trim() || !form.monto) return;
    setLoading(true);
    const newRecibo = {
      id: crypto.randomUUID(),
      numero: nextNum,
      ...form,
      monto: parseFloat(form.monto),
    };
    try {
      const { error } = await supabase.from('recibos').insert(newRecibo);
      if (error) throw error;
      setData(prev => ({ ...prev, recibos: [newRecibo, ...prev.recibos] }));
      setForm({ cliente: '', concepto: '', monto: '', fecha: new Date().toISOString().split('T')[0], estado: 'Pendiente', notas: '' });
      setView('list');
    } catch (err) { alert('Error: ' + err.message); }
    finally { setLoading(false); }
  };

  // ── Cambiar estado ─────────────────────────────────────────────────────────
  const toggleEstado = async (recibo) => {
    const nuevoEstado = recibo.estado === 'Pagado' ? 'Pendiente' : 'Pagado';
    const updated = { ...recibo, estado: nuevoEstado };
    try {
      await supabase.from('recibos').upsert(updated);
      setData(prev => ({ ...prev, recibos: prev.recibos.map(r => r.id === recibo.id ? updated : r) }));
    } catch (err) { console.error(err); }
  };

  // ── Eliminar ──────────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este recibo?')) return;
    try {
      await supabase.from('recibos').delete().eq('id', id);
      setData(prev => ({ ...prev, recibos: prev.recibos.filter(r => r.id !== id) }));
    } catch (err) { alert('Error: ' + err.message); }
  };

  // ── Imprimir ──────────────────────────────────────────────────────────────
  const handlePrint = (recibo) => { setActiveRecibo(recibo); setView('print'); };
  const triggerPrint = () => window.print();

  // ── Stats ─────────────────────────────────────────────────────────────────
  const totalEmitido = recibos.reduce((acc, r) => acc + (parseFloat(r.monto) || 0), 0);
  const totalCobrado = recibos.filter(r => r.estado === 'Pagado').reduce((acc, r) => acc + (parseFloat(r.monto) || 0), 0);
  const pendiente    = totalEmitido - totalCobrado;

  return (
    <div className="animate-in fade-in duration-300 max-w-[1200px] w-full">

      {/* ── LISTA ─────────────────────────────────────────────────────────── */}
      {view === 'list' && (
        <>
          <header className="mb-6 flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-light text-white tracking-tight">Recibos</h2>
              <p className="text-[11px] text-neutral-500 uppercase tracking-widest mt-1">Gestión y emisión de comprobantes de pago</p>
            </div>
            <button onClick={() => setView('create')}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5">
              <Plus size={14}/> Nuevo Recibo
            </button>
          </header>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-4">
              <p className="text-[10px] text-neutral-500 uppercase tracking-widest mb-2 flex items-center gap-1"><FileText size={10}/> Total Emitido</p>
              <p className="text-2xl font-light text-white">${totalEmitido.toLocaleString('en', { minimumFractionDigits: 2 })}</p>
              <p className="text-[9px] text-neutral-600 mt-1">{recibos.length} recibos</p>
            </div>
            <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-4">
              <p className="text-[10px] text-neutral-500 uppercase tracking-widest mb-2 flex items-center gap-1"><CheckCircle2 size={10}/> Cobrado</p>
              <p className="text-2xl font-light text-emerald-400">${totalCobrado.toLocaleString('en', { minimumFractionDigits: 2 })}</p>
              <p className="text-[9px] text-emerald-600 mt-1">{recibos.filter(r => r.estado === 'Pagado').length} pagados</p>
            </div>
            <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-4">
              <p className="text-[10px] text-neutral-500 uppercase tracking-widest mb-2 flex items-center gap-1"><Clock size={10}/> Por Cobrar</p>
              <p className="text-2xl font-light text-amber-400">${pendiente.toLocaleString('en', { minimumFractionDigits: 2 })}</p>
              <p className="text-[9px] text-amber-600 mt-1">{recibos.filter(r => r.estado !== 'Pagado').length} pendientes</p>
            </div>
          </div>

          {/* Tabla */}
          <div className="bg-[#0a0a0a] border border-white/[0.05] rounded-xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-black/40 border-b border-white/[0.05]">
                  <th className="px-4 py-3 text-[10px] font-bold text-neutral-500 uppercase tracking-widest"># Recibo</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Cliente / Concepto</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Fecha</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Estado</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-neutral-500 uppercase tracking-widest text-right">Monto</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-neutral-500 uppercase tracking-widest text-center">Acción</th>
                </tr>
              </thead>
              <tbody>
                {recibos.length > 0 ? [...recibos].sort((a, b) => b.fecha?.localeCompare(a.fecha)).map(r => (
                  <tr key={r.id} className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors group">
                    <td className="px-4 py-3">
                      <span className="font-mono text-[11px] text-amber-500 font-bold">#{r.numero || '—'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs text-white font-medium">{r.cliente}</p>
                      <p className="text-[10px] text-neutral-500 mt-0.5">{r.concepto}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-neutral-500 font-mono">{r.fecha}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => toggleEstado(r)}
                        className={`text-[9px] px-2 py-0.5 rounded uppercase font-bold tracking-widest border transition-colors ${r.estado === 'Pagado' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20'}`}>
                        {r.estado}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <p className="text-sm font-mono font-bold text-white">${parseFloat(r.monto).toLocaleString('en', { minimumFractionDigits: 2 })}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => handlePrint(r)} className="p-1.5 text-neutral-500 hover:text-white transition-colors" title="Ver e imprimir recibo">
                          <Printer size={13}/>
                        </button>
                        <button onClick={() => handleDelete(r.id)} className="p-1.5 text-neutral-600 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100">
                          <Trash2 size={13}/>
                        </button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan="6" className="px-4 py-10 text-center text-neutral-600 text-xs italic">Sin recibos emitidos. Crea el primero.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── CREAR ─────────────────────────────────────────────────────────── */}
      {view === 'create' && (
        <div className="animate-in slide-in-from-bottom-4 duration-300 max-w-xl w-full">
          <div className="flex items-center gap-2 mb-4 text-xs text-neutral-500 cursor-pointer hover:text-white w-max" onClick={() => setView('list')}>
            <ArrowLeft size={12}/> Volver a Recibos
          </div>
          <div className="bg-[#0a0a0a] border border-white/[0.05] rounded-xl p-8">
            <h2 className="text-2xl font-light text-white tracking-tight mb-1 flex items-center gap-2">
              <FileText size={20} className="text-amber-500"/> Nuevo Recibo
            </h2>
            <p className="text-[10px] text-neutral-600 mb-6 font-mono">Número: <span className="text-amber-500">#{nextNum}</span></p>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] uppercase tracking-widest text-neutral-500 font-bold mb-1.5 block">Cliente *</label>
                <input type="text" value={form.cliente} onChange={e => setForm({...form, cliente: e.target.value})}
                  className="w-full bg-black/40 border border-white/10 rounded-md px-3 py-2 text-sm text-white outline-none focus:border-amber-500/50" placeholder="Nombre del cliente" autoFocus/>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-neutral-500 font-bold mb-1.5 block">Concepto *</label>
                <input type="text" value={form.concepto} onChange={e => setForm({...form, concepto: e.target.value})}
                  className="w-full bg-black/40 border border-white/10 rounded-md px-3 py-2 text-xs text-white outline-none focus:border-amber-500/50" placeholder="Ej: Edición de video — Boda"/>
              </div>
              <div className="grid grid-cols-2 gap-4">
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
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-neutral-500 font-bold mb-1.5 block">Notas adicionales</label>
                <textarea value={form.notas} onChange={e => setForm({...form, notas: e.target.value})}
                  className="w-full bg-black/40 border border-white/10 rounded-md px-3 py-2 text-xs text-white outline-none min-h-[60px] resize-none" placeholder="Opcional..."/>
              </div>
            </div>
            <button onClick={handleCreate} disabled={loading || !form.cliente || !form.monto}
              className="mt-6 w-full py-2.5 bg-white text-black text-xs font-bold rounded-md hover:bg-neutral-200 disabled:opacity-50 transition-colors">
              {loading ? 'Creando...' : 'Emitir Recibo'}
            </button>
          </div>
        </div>
      )}

      {/* ── VISTA DE IMPRESIÓN ─────────────────────────────────────────────── */}
      {view === 'print' && activeRecibo && (
        <div className="animate-in fade-in duration-300">
          <div className="flex items-center justify-between mb-5">
            <button className="flex items-center gap-2 text-xs text-neutral-500 hover:text-white" onClick={() => setView('list')}>
              <ArrowLeft size={12}/> Volver a Recibos
            </button>
            <button onClick={triggerPrint}
              className="px-4 py-2 bg-white text-black text-xs font-bold rounded-md hover:bg-neutral-200 transition-colors flex items-center gap-1.5">
              <Printer size={13}/> Imprimir / Guardar PDF
            </button>
          </div>

          {/* Recibo imprimible */}
          <div ref={printRef} className="bg-white text-black rounded-xl p-10 max-w-2xl mx-auto print:m-0 print:rounded-none print:shadow-none shadow-2xl">
            {/* Cabecera del recibo */}
            <div className="flex justify-between items-start mb-8 pb-6 border-b border-neutral-200">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Activity size={18} className="text-amber-500"/>
                  <span className="text-lg font-bold tracking-tight">sync <span className="text-amber-500 italic">pro</span></span>
                </div>
                <p className="text-xs text-neutral-500">Producción Audiovisual Profesional</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-neutral-800">RECIBO</p>
                <p className="text-sm font-mono text-amber-600 font-bold">#{activeRecibo.numero}</p>
              </div>
            </div>

            {/* Datos del cliente */}
            <div className="grid grid-cols-2 gap-8 mb-8">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-neutral-400 font-bold mb-1">Emitido para</p>
                <p className="text-lg font-semibold text-neutral-800">{activeRecibo.cliente}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-widest text-neutral-400 font-bold mb-1">Fecha</p>
                <p className="text-sm font-mono text-neutral-700">{activeRecibo.fecha}</p>
                <div className={`inline-block mt-1 text-[9px] px-2 py-0.5 rounded uppercase font-bold tracking-widest ${activeRecibo.estado === 'Pagado' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                  {activeRecibo.estado}
                </div>
              </div>
            </div>

            {/* Tabla de concepto */}
            <table className="w-full mb-8 border-collapse">
              <thead>
                <tr className="border-b-2 border-neutral-200">
                  <th className="text-left text-[10px] uppercase tracking-widest text-neutral-400 py-2 font-bold">Concepto</th>
                  <th className="text-right text-[10px] uppercase tracking-widest text-neutral-400 py-2 font-bold">Total</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-neutral-100">
                  <td className="py-4 text-sm text-neutral-700">{activeRecibo.concepto}</td>
                  <td className="py-4 text-right font-mono font-bold text-neutral-800 text-lg">
                    ${parseFloat(activeRecibo.monto).toLocaleString('en', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr>
                  <td className="pt-4 text-[10px] uppercase tracking-widest font-bold text-neutral-400">Total</td>
                  <td className="pt-4 text-right font-mono font-bold text-2xl text-amber-600">
                    ${parseFloat(activeRecibo.monto).toLocaleString('en', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </tfoot>
            </table>

            {/* Notas */}
            {activeRecibo.notas && (
              <div className="bg-neutral-50 rounded-lg p-4 mb-8">
                <p className="text-[10px] uppercase tracking-widest text-neutral-400 font-bold mb-1">Notas</p>
                <p className="text-xs text-neutral-600">{activeRecibo.notas}</p>
              </div>
            )}

            {/* Pie del recibo */}
            <div className="border-t border-neutral-200 pt-6 flex justify-between items-center">
              <p className="text-[10px] text-neutral-400">Generado con Sync Pro OS</p>
              <p className="text-[10px] text-neutral-400 font-mono">{new Date().toLocaleDateString('es')}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Recibos;
