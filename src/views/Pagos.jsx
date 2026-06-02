import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Save, Trash2, CreditCard, Landmark, Banknote, Mail, Phone, 
  FileText, Calendar, Bell, ChevronRight, Edit3, X
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { getTheme, useTheme } from '../lib/theme';

const Pagos = ({ servicios = [], onRefresh, isDark = true }) => {
  const t = useTheme(isDark);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [activeService, setActiveService] = useState(null);

  useEffect(() => {
    if (onRefresh) onRefresh();
  }, []);

  const fetchServicios = () => {
    if (onRefresh) onRefresh();
  };

  const openNew = () => {
    setActiveService({
      id: crypto.randomUUID(),
      nombre: '',
      monto: 0,
      fecha_pago: new Date().toISOString().split('T')[0],
      metodo: 'Tarjeta',
      contacto: '',
      notas: '',
      tipo: 'Mensual'
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.from('servicios').upsert(activeService);
      if (error) throw error;
      fetchServicios();
      setIsEditing(false);
      setActiveService(null);
    } catch (err) {
      alert('Error al guardar servicio: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este servicio?')) return;
    const { error } = await supabase.from('servicios').delete().eq('id', id);
    if (!error) fetchServicios();
  };

  // ── Focus helpers ──────────────────────────────────────────────────────
  const inputFocus = (e) => { e.target.style.borderColor = t.accent; };
  const inputBlur = (e) => { e.target.style.borderColor = t.borderLight; };

  const getMetodoIcon = (metodo) => {
    if (metodo === 'Tarjeta') return CreditCard;
    if (metodo === 'Banco') return Landmark;
    return Banknote;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
      <header style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: t.text, letterSpacing: '-0.02em', margin: 0 }}>Gestión de Egresos</h2>
          <p style={{ fontSize: '0.75rem', color: t.textDim, marginTop: '4px', fontWeight: 500 }}>Control de gastos personales y suscripciones digitales</p>
        </div>
        <button onClick={openNew}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', backgroundColor: t.accent, color: '#000', border: 'none', borderRadius: 12, fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', cursor: 'pointer', transition: 'opacity 0.2s' }}
          onMouseEnter={e => e.target.style.opacity = '0.85'}
          onMouseLeave={e => e.target.style.opacity = '1'}>
          <Plus size={16} /> Registrar Egreso
        </button>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
        {servicios.map(s => {
          const MetodoIcon = getMetodoIcon(s.metodo);
          return (
            <div key={s.id}
              style={{ backgroundColor: t.panel, border: `1px solid ${t.border}`, borderRadius: 14, padding: 20, transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = t.borderLight; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = t.border; }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div style={{ padding: 12, borderRadius: 12, backgroundColor: t.accentSoft, color: t.textDim, transition: 'all 0.2s' }}>
                  <MetodoIcon size={20} />
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button onClick={() => { setActiveService(s); setIsEditing(true); }}
                    style={{ padding: 8, background: 'none', border: 'none', color: t.textMuted, cursor: 'pointer', transition: 'color 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.color = t.text}
                    onMouseLeave={e => e.currentTarget.style.color = t.textMuted}>
                    <Edit3 size={14}/>
                  </button>
                  <button onClick={() => handleDelete(s.id)}
                    style={{ padding: 8, background: 'none', border: 'none', color: t.textMuted, cursor: 'pointer', transition: 'color 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.color = t.danger}
                    onMouseLeave={e => e.currentTarget.style.color = t.textMuted}>
                    <Trash2 size={14}/>
                  </button>
                </div>
              </div>
              
              <h4 style={{ fontSize: '1.125rem', fontWeight: 700, color: t.text, margin: '0 0 4px 0' }}>{s.nombre}</h4>
              <p style={{ fontSize: '1.25rem', fontFamily: 'monospace', fontWeight: 700, color: t.text, margin: '0 0 16px 0' }}>
                {s.monto} <span style={{ fontSize: 10, color: t.textMuted, textTransform: 'uppercase' }}>Bs.</span>
              </p>
              
              <div style={{ paddingTop: 16, borderTop: `1px solid ${t.border}`, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 10, color: t.textDim, textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.1em' }}>
                  <Calendar size={12} /> Próximo Pago: <span style={{ color: t.text, marginLeft: 'auto' }}>{s.fecha_pago}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 10, color: t.textDim, textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.1em' }}>
                  <Mail size={12} /> Contacto: <span style={{ color: t.text, marginLeft: 'auto', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 150 }}>{s.contacto || 'N/A'}</span>
                </div>
              </div>

              {s.notas && (
                <div style={{ marginTop: 16, padding: 12, backgroundColor: t.inputBg, border: `1px solid ${t.borderLight}`, borderRadius: 12 }}>
                  <p style={{ fontSize: 10, color: t.textDim, fontStyle: 'italic', display: 'flex', gap: 8, margin: 0 }}><FileText size={12}/> {s.notas}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {isEditing && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: t.overlay, backdropFilter: 'blur(8px)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ backgroundColor: t.panel, border: `1px solid ${t.border}`, width: '100%', maxWidth: 500, borderRadius: 14, padding: 32 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: t.text, margin: 0 }}>Configurar Egreso</h3>
              <button onClick={() => setIsEditing(false)}
                style={{ padding: 8, background: 'none', border: 'none', color: t.textMuted, cursor: 'pointer', transition: 'color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.color = t.text}
                onMouseLeave={e => e.currentTarget.style.color = t.textMuted}>
                <X size={20}/>
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <label style={{ fontSize: 10, fontWeight: 700, color: t.textDim, textTransform: 'uppercase', marginBottom: 8, display: 'block', letterSpacing: '0.1em' }}>Nombre del Egreso</label>
                <input 
                  type="text" 
                  value={activeService.nombre} 
                  onChange={e => setActiveService({...activeService, nombre: e.target.value})}
                  onFocus={inputFocus} onBlur={inputBlur}
                  style={{ width: '100%', backgroundColor: t.inputBg, border: `1px solid ${t.borderLight}`, borderRadius: 12, padding: 12, color: t.text, outline: 'none', transition: 'border-color 0.2s' }}
                  placeholder="Ej: Google Cloud, Luz, Internet..."
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 700, color: t.textDim, textTransform: 'uppercase', marginBottom: 8, display: 'block', letterSpacing: '0.1em' }}>Monto (Bs.)</label>
                  <input 
                    type="number" 
                    value={activeService.monto} 
                    onChange={e => setActiveService({...activeService, monto: e.target.value})}
                    onFocus={inputFocus} onBlur={inputBlur}
                    style={{ width: '100%', backgroundColor: t.inputBg, border: `1px solid ${t.borderLight}`, borderRadius: 12, padding: 12, color: t.text, fontFamily: 'monospace', outline: 'none', transition: 'border-color 0.2s' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 700, color: t.textDim, textTransform: 'uppercase', marginBottom: 8, display: 'block', letterSpacing: '0.1em' }}>Fecha de Pago</label>
                  <input 
                    type="date" 
                    value={activeService.fecha_pago} 
                    onChange={e => setActiveService({...activeService, fecha_pago: e.target.value})}
                    onFocus={inputFocus} onBlur={inputBlur}
                    style={{ width: '100%', backgroundColor: t.inputBg, border: `1px solid ${t.borderLight}`, borderRadius: 12, padding: 12, color: t.text, outline: 'none', transition: 'border-color 0.2s' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 10, fontWeight: 700, color: t.textDim, textTransform: 'uppercase', marginBottom: 8, display: 'block', letterSpacing: '0.1em' }}>Método de Pago</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                  {['Tarjeta', 'Banco', 'Efectivo'].map(m => (
                    <button 
                      key={m}
                      onClick={() => setActiveService({...activeService, metodo: m})}
                      style={{
                        padding: '8px 0',
                        fontSize: 10,
                        fontWeight: 700,
                        borderRadius: 12,
                        border: activeService.metodo === m ? `1px solid ${t.accent}` : `1px solid ${t.borderLight}`,
                        backgroundColor: activeService.metodo === m ? t.accent : t.inputBg,
                        color: activeService.metodo === m ? '#000' : t.textDim,
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ fontSize: 10, fontWeight: 700, color: t.textDim, textTransform: 'uppercase', marginBottom: 8, display: 'block', letterSpacing: '0.1em' }}>Contacto / Correo</label>
                <input 
                  type="text" 
                  value={activeService.contacto} 
                  onChange={e => setActiveService({...activeService, contacto: e.target.value})}
                  onFocus={inputFocus} onBlur={inputBlur}
                  style={{ width: '100%', backgroundColor: t.inputBg, border: `1px solid ${t.borderLight}`, borderRadius: 12, padding: 12, color: t.text, outline: 'none', transition: 'border-color 0.2s' }}
                  placeholder="email@ejemplo.com o teléfono"
                />
              </div>

              <div>
                <label style={{ fontSize: 10, fontWeight: 700, color: t.textDim, textTransform: 'uppercase', marginBottom: 8, display: 'block', letterSpacing: '0.1em' }}>Notas / Observaciones</label>
                <textarea 
                  value={activeService.notas} 
                  onChange={e => setActiveService({...activeService, notas: e.target.value})}
                  onFocus={inputFocus} onBlur={inputBlur}
                  style={{ width: '100%', backgroundColor: t.inputBg, border: `1px solid ${t.borderLight}`, borderRadius: 12, padding: 12, color: t.text, fontSize: 12, outline: 'none', minHeight: 80, resize: 'none', transition: 'border-color 0.2s' }}
                  placeholder="Ej: El servicio va a fallar hasta el día X..."
                />
              </div>

              <button
                onClick={handleSave}
                disabled={loading}
                style={{ width: '100%', padding: '14px 0', backgroundColor: t.accent, color: '#000', border: 'none', borderRadius: 12, fontWeight: 900, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.5 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.2em', transition: 'opacity 0.2s' }}
              >
                <Save size={18} /> {loading ? 'Guardando...' : 'Guardar Egreso'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Pagos;
