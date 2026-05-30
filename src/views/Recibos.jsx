import React, { useState, useRef, useMemo } from 'react';
import { Plus, FileText, Printer, Trash2, CheckCircle2, Clock, ArrowLeft, Activity } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { getTheme } from '../lib/theme';

const Recibos = ({ data, setData, isDark = true }) => {
  const t = useMemo(() => getTheme(isDark), [isDark]);
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
      const item = recibos.find(r => r.id === id);
      if (item) {
        await supabase.from('papelera').insert([{
          tipo_dato: 'recibo',
          nombre_item: `Recibo #${item.numero} - ${item.cliente}`,
          datos_originales: item,
          borrado_el: new Date().toISOString(),
          expira_el: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        }]);
      }
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
    <div className="flex flex-col h-full w-full animate-in fade-in duration-300">

      {/* ── LISTA ─────────────────────────────────────────────────────────── */}
      {view === 'list' && (
        <>
          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: t.text, letterSpacing: '-0.02em', margin: 0 }}>Recibos</h2>
              <p style={{ fontSize: '0.75rem', color: t.textDim, marginTop: '4px', fontWeight: 500 }}>Gestión y emisión de comprobantes de pago</p>
            </div>
            <button onClick={() => setView('create')}
              style={{ padding: '10px 24px', backgroundColor: t.accent, color: '#000', borderRadius: 12, fontWeight: 900, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.2em', display: 'flex', alignItems: 'center', gap: 10, border: 'none', cursor: 'pointer', transition: 'all 0.2s' }}>
              <Plus size={16} strokeWidth={3}/> Nuevo Recibo
            </button>
          </header>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
            <div style={{ backgroundColor: t.panel, border: `1px solid ${t.border}`, borderRadius: 14, padding: 20, display: 'flex', flexDirection: 'column', gap: 8, boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
              <p style={{ fontSize: 9, fontWeight: 900, color: t.textDim, textTransform: 'uppercase', letterSpacing: '0.2em', display: 'flex', alignItems: 'center', gap: 6 }}><FileText size={12}/> Total Emitido</p>
              <p style={{ fontSize: 20, fontWeight: 900, color: t.text }}>${totalEmitido.toLocaleString('en', { minimumFractionDigits: 2 })}</p>
              <p style={{ fontSize: 8, fontWeight: 700, color: t.textMuted }}>{recibos.length} recibos</p>
            </div>
            <div style={{ backgroundColor: t.panel, border: `1px solid ${t.border}`, borderRadius: 14, padding: 20, display: 'flex', flexDirection: 'column', gap: 8, boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
              <p style={{ fontSize: 9, fontWeight: 900, color: t.textDim, textTransform: 'uppercase', letterSpacing: '0.2em', display: 'flex', alignItems: 'center', gap: 6 }}><CheckCircle2 size={12}/> Cobrado</p>
              <p style={{ fontSize: 20, fontWeight: 900, color: t.success }}>${totalCobrado.toLocaleString('en', { minimumFractionDigits: 2 })}</p>
              <p style={{ fontSize: 8, fontWeight: 700, color: t.textMuted }}>{recibos.filter(r => r.estado === 'Pagado').length} pagados</p>
            </div>
            <div style={{ backgroundColor: t.panel, border: `1px solid ${t.border}`, borderRadius: 14, padding: 20, display: 'flex', flexDirection: 'column', gap: 8, boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
              <p style={{ fontSize: 9, fontWeight: 900, color: t.textDim, textTransform: 'uppercase', letterSpacing: '0.2em', display: 'flex', alignItems: 'center', gap: 6 }}><Clock size={12}/> Por Cobrar</p>
              <p style={{ fontSize: 20, fontWeight: 900, color: t.accent }}>${pendiente.toLocaleString('en', { minimumFractionDigits: 2 })}</p>
              <p style={{ fontSize: 8, fontWeight: 700, color: t.textMuted }}>{recibos.filter(r => r.estado !== 'Pagado').length} pendientes</p>
            </div>
          </div>

          {/* Tabla */}
          <div style={{ backgroundColor: t.panel, border: `1px solid ${t.border}`, borderRadius: 14, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
            <table className="w-full text-left" style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${t.border}`, backgroundColor: t.accentSoft }}>
                  <th style={{ padding: '16px 24px', fontSize: 9, fontWeight: 900, color: t.textDim, textTransform: 'uppercase', letterSpacing: '0.2em' }}># Recibo</th>
                  <th style={{ padding: '16px 24px', fontSize: 9, fontWeight: 900, color: t.textDim, textTransform: 'uppercase', letterSpacing: '0.2em' }}>Cliente / Concepto</th>
                  <th style={{ padding: '16px 24px', fontSize: 9, fontWeight: 900, color: t.textDim, textTransform: 'uppercase', letterSpacing: '0.2em' }}>Fecha</th>
                  <th style={{ padding: '16px 24px', fontSize: 9, fontWeight: 900, color: t.textDim, textTransform: 'uppercase', letterSpacing: '0.2em' }}>Estado</th>
                  <th style={{ padding: '16px 24px', fontSize: 9, fontWeight: 900, color: t.textDim, textTransform: 'uppercase', letterSpacing: '0.2em', textAlign: 'right' }}>Monto</th>
                  <th style={{ padding: '16px 24px', fontSize: 9, fontWeight: 900, color: t.textDim, textTransform: 'uppercase', letterSpacing: '0.2em', textAlign: 'center' }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {recibos.length > 0 ? [...recibos].sort((a, b) => b.fecha?.localeCompare(a.fecha)).map(r => (
                  <tr key={r.id} onClick={() => { setActiveRecibo(r); setView('print'); }}
                    style={{ borderBottom: `1px solid ${t.border}`, cursor: 'pointer', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = t.hover}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <td style={{ padding: '16px 24px' }}>
                      <span style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 900, color: t.accent }}>#{r.numero || '—'}</span>
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: t.text, margin: 0 }}>{r.cliente}</p>
                      <p style={{ fontSize: 10, color: t.textDim, marginTop: 2 }}>{r.concepto}</p>
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <span style={{ fontSize: 10, color: t.textDim, fontFamily: 'monospace' }}>{r.fecha}</span>
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <button onClick={(e) => { e.stopPropagation(); toggleEstado(r); }}
                        style={{ padding: '4px 10px', borderRadius: 10, border: 'none', fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer',
                          backgroundColor: r.estado === 'Pagado' ? `${t.success}1e` : `${t.accent}1e`,
                          color: r.estado === 'Pagado' ? t.success : t.accent }}>
                        {r.estado}
                      </button>
                    </td>
                    <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                      <p style={{ fontSize: 14, fontWeight: 900, color: t.text, fontFamily: 'monospace' }}>${parseFloat(r.monto).toLocaleString('en', { minimumFractionDigits: 2 })}</p>
                    </td>
                    <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                        <button onClick={(e) => { e.stopPropagation(); handlePrint(r); }}
                          style={{ padding: 6, borderRadius: 8, border: 'none', backgroundColor: t.accentSoft, color: t.textMuted, cursor: 'pointer', transition: 'all 0.2s' }}
                          onMouseEnter={e => { e.currentTarget.style.backgroundColor = t.panel; e.currentTarget.style.color = t.text; }}
                          onMouseLeave={e => { e.currentTarget.style.backgroundColor = t.accentSoft; e.currentTarget.style.color = t.textMuted; }}>
                          <Printer size={13}/>
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleDelete(r.id); }}
                          style={{ padding: 6, borderRadius: 8, border: 'none', backgroundColor: 'transparent', color: t.textDim, cursor: 'pointer', transition: 'all 0.2s' }}
                          onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; }}
                          onMouseLeave={e => { e.currentTarget.style.color = t.textDim; }}>
                          <Trash2 size={13}/>
                        </button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan="6" style={{ padding: '40px 24px', textAlign: 'center', color: t.textDim, fontSize: 11, fontStyle: 'italic' }}>Sin recibos emitidos. Crea el primero.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── CREAR ─────────────────────────────────────────────────────────── */}
      {view === 'create' && (
        <div className="animate-in slide-in-from-bottom-4 duration-300" style={{ maxWidth: 560, width: '100%' }}>
          <button onClick={() => setView('list')}
            style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24, fontSize: 11, color: t.textDim, background: 'none', border: 'none', cursor: 'pointer', transition: 'color 0.2s', padding: 0 }}
            onMouseEnter={e => e.currentTarget.style.color = t.text}
            onMouseLeave={e => e.currentTarget.style.color = t.textDim}>
            <ArrowLeft size={14}/> Volver a Recibos
          </button>
          <div style={{ backgroundColor: t.panel, border: `1px solid ${t.border}`, borderRadius: 14, padding: 32, boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
            <h2 style={{ fontSize: 22, fontWeight: 300, color: t.text, letterSpacing: '-0.02em', margin: '0 0 2px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
              <FileText size={20} color={t.accent}/> Nuevo Recibo
            </h2>
            <p style={{ fontSize: 10, color: t.textMuted, marginBottom: 24, fontFamily: 'monospace' }}>Número: <span style={{ color: t.accent, fontWeight: 700 }}>#{nextNum}</span></p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: t.textDim, fontWeight: 700, marginBottom: 6, display: 'block' }}>Cliente *</label>
                <input type="text" value={form.cliente} onChange={e => setForm({...form, cliente: e.target.value})}
                  style={{ width: '100%', backgroundColor: t.inputBg, border: `1px solid ${t.borderLight}`, borderRadius: 8, padding: '10px 14px', fontSize: 13, color: t.text, outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                  placeholder="Nombre del cliente" autoFocus
                  onFocus={e => e.currentTarget.style.borderColor = t.accent}
                  onBlur={e => e.currentTarget.style.borderColor = t.borderLight}/>
              </div>
              <div>
                <label style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: t.textDim, fontWeight: 700, marginBottom: 6, display: 'block' }}>Concepto *</label>
                <input type="text" value={form.concepto} onChange={e => setForm({...form, concepto: e.target.value})}
                  style={{ width: '100%', backgroundColor: t.inputBg, border: `1px solid ${t.borderLight}`, borderRadius: 8, padding: '10px 14px', fontSize: 12, color: t.text, outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                  placeholder="Ej: Edición de video — Boda"
                  onFocus={e => e.currentTarget.style.borderColor = t.accent}
                  onBlur={e => e.currentTarget.style.borderColor = t.borderLight}/>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: t.textDim, fontWeight: 700, marginBottom: 6, display: 'block' }}>Monto ($) *</label>
                  <input type="number" value={form.monto} onChange={e => setForm({...form, monto: e.target.value})}
                    style={{ width: '100%', backgroundColor: t.inputBg, border: `1px solid ${t.borderLight}`, borderRadius: 8, padding: '10px 14px', fontSize: 12, color: t.text, outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                    placeholder="0.00"
                    onFocus={e => e.currentTarget.style.borderColor = t.accent}
                    onBlur={e => e.currentTarget.style.borderColor = t.borderLight}/>
                </div>
                <div>
                  <label style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: t.textDim, fontWeight: 700, marginBottom: 6, display: 'block' }}>Fecha</label>
                  <input type="date" value={form.fecha} onChange={e => setForm({...form, fecha: e.target.value})}
                    style={{ width: '100%', backgroundColor: t.inputBg, border: `1px solid ${t.borderLight}`, borderRadius: 8, padding: '10px 14px', fontSize: 12, color: t.textMuted, outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                    onFocus={e => e.currentTarget.style.borderColor = t.accent}
                    onBlur={e => e.currentTarget.style.borderColor = t.borderLight}/>
                </div>
              </div>
              <div>
                <label style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: t.textDim, fontWeight: 700, marginBottom: 6, display: 'block' }}>Notas adicionales</label>
                <textarea value={form.notas} onChange={e => setForm({...form, notas: e.target.value})}
                  style={{ width: '100%', backgroundColor: t.inputBg, border: `1px solid ${t.borderLight}`, borderRadius: 8, padding: '10px 14px', fontSize: 12, color: t.text, outline: 'none', minHeight: 60, resize: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                  placeholder="Opcional..."
                  onFocus={e => e.currentTarget.style.borderColor = t.accent}
                  onBlur={e => e.currentTarget.style.borderColor = t.borderLight}/>
              </div>
            </div>
            <button onClick={handleCreate} disabled={loading || !form.cliente || !form.monto}
              style={{ marginTop: 24, width: '100%', padding: '12px 0', backgroundColor: loading || !form.cliente || !form.monto ? t.textMuted : t.accent, color: '#000', borderRadius: 12, fontWeight: 900, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.2em', border: 'none', cursor: loading || !form.cliente || !form.monto ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}>
              {loading ? 'Creando...' : 'Emitir Recibo'}
            </button>
          </div>
        </div>
      )}

      {/* ── VISTA DE IMPRESIÓN ─────────────────────────────────────────────── */}
      {view === 'print' && activeRecibo && (
        <div className="animate-in fade-in duration-300">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <button onClick={() => setView('list')}
              style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: t.textDim, background: 'none', border: 'none', cursor: 'pointer', transition: 'color 0.2s', padding: 0 }}
              onMouseEnter={e => e.currentTarget.style.color = t.text}
              onMouseLeave={e => e.currentTarget.style.color = t.textDim}>
              <ArrowLeft size={14}/> Volver a Recibos
            </button>
            <button onClick={triggerPrint}
              style={{ padding: '10px 20px', backgroundColor: t.accent, color: '#000', borderRadius: 12, fontWeight: 900, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.2em', display: 'flex', alignItems: 'center', gap: 8, border: 'none', cursor: 'pointer', transition: 'all 0.2s' }}>
              <Printer size={14}/> Imprimir / Guardar PDF
            </button>
          </div>

          {/* Recibo imprimible — mantiene blanco para impresión física */}
          <div ref={printRef} style={{ backgroundColor: '#fff', color: '#000', borderRadius: 14, padding: 40, maxWidth: 672, margin: '0 auto', boxShadow: '0 25px 80px rgba(0,0,0,0.5)' }}>
            {/* Cabecera del recibo */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32, paddingBottom: 24, borderBottom: '1px solid #e5e5e5' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <Activity size={18} color="#d97706"/>
                  <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em' }}>sync <span style={{ color: '#d97706', fontStyle: 'italic' }}>pro</span></span>
                </div>
                <p style={{ fontSize: 12, color: '#737373' }}>Producción Audiovisual Profesional</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: 24, fontWeight: 700, color: '#262626' }}>RECIBO</p>
                <p style={{ fontSize: 14, fontFamily: 'monospace', color: '#d97706', fontWeight: 700 }}>#{activeRecibo.numero}</p>
              </div>
            </div>

            {/* Datos del cliente */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, marginBottom: 32 }}>
              <div>
                <p style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#a3a3a3', fontWeight: 700, marginBottom: 4 }}>Emitido para</p>
                <p style={{ fontSize: 18, fontWeight: 600, color: '#262626' }}>{activeRecibo.cliente}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#a3a3a3', fontWeight: 700, marginBottom: 4 }}>Fecha</p>
                <p style={{ fontSize: 14, fontFamily: 'monospace', color: '#404040' }}>{activeRecibo.fecha}</p>
                <div style={{ display: 'inline-block', marginTop: 4, fontSize: 9, padding: '2px 8px', borderRadius: 4, textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.1em', backgroundColor: activeRecibo.estado === 'Pagado' ? '#d1fae5' : '#fef3c7', color: activeRecibo.estado === 'Pagado' ? '#047857' : '#b45309' }}>
                  {activeRecibo.estado}
                </div>
              </div>
            </div>

            {/* Tabla de concepto */}
            <table style={{ width: '100%', marginBottom: 32, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e5e5e5' }}>
                  <th style={{ textAlign: 'left', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#a3a3a3', paddingBottom: 8, fontWeight: 700 }}>Concepto</th>
                  <th style={{ textAlign: 'right', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#a3a3a3', paddingBottom: 8, fontWeight: 700 }}>Total</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #f5f5f5' }}>
                  <td style={{ padding: '16px 0', fontSize: 14, color: '#404040' }}>{activeRecibo.concepto}</td>
                  <td style={{ padding: '16px 0', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: '#262626', fontSize: 18 }}>
                    ${parseFloat(activeRecibo.monto).toLocaleString('en', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr>
                  <td style={{ paddingTop: 16, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, color: '#a3a3a3' }}>Total</td>
                  <td style={{ paddingTop: 16, textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, fontSize: 24, color: '#d97706' }}>
                    ${parseFloat(activeRecibo.monto).toLocaleString('en', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </tfoot>
            </table>

            {/* Notas */}
            {activeRecibo.notas && (
              <div style={{ backgroundColor: '#fafafa', borderRadius: 14, padding: 16, marginBottom: 32 }}>
                <p style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#a3a3a3', fontWeight: 700, marginBottom: 4 }}>Notas</p>
                <p style={{ fontSize: 12, color: '#525252' }}>{activeRecibo.notas}</p>
              </div>
            )}

            {/* Pie del recibo */}
            <div style={{ borderTop: '1px solid #e5e5e5', paddingTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ fontSize: 10, color: '#a3a3a3' }}>Generado con Inefable</p>
              <p style={{ fontSize: 10, color: '#a3a3a3', fontFamily: 'monospace' }}>{new Date().toLocaleDateString('es')}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Recibos;
