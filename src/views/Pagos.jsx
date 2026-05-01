import React, { useState, useEffect } from 'react';
import { 
  Plus, Save, Trash2, CreditCard, Landmark, Banknote, Mail, Phone, 
  FileText, Calendar, Bell, ChevronRight, Edit3, X
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

const Pagos = () => {
  const [servicios, setServicios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [activeService, setActiveService] = useState(null);

  useEffect(() => {
    fetchServicios();
  }, []);

  const fetchServicios = async () => {
    const { data, error } = await supabase.from('servicios').select('*').order('fecha_pago', { ascending: true });
    if (data) setServicios(data);
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

  return (
    <div className="flex flex-col h-full max-w-[1200px] w-full animate-in fade-in duration-500">
      <header className="mb-8 flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-light text-white tracking-tight">Gestión de <span className="text-neutral-400 font-medium">Pagos y Servicios</span></h2>
          <p className="text-[11px] text-neutral-500 uppercase tracking-widest mt-1">Control de gastos personales y suscripciones digitales</p>
        </div>
        <button onClick={openNew} className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white text-xs font-bold rounded-lg border border-white/10 transition-all flex items-center gap-2">
          <Plus size={16} /> Registrar Servicio
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {servicios.map(s => (
          <div key={s.id} className="bg-[#0a0a0a] border border-white/[0.05] rounded-2xl p-5 hover:border-white/20 transition-all group relative">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 rounded-xl bg-white/5 text-neutral-400 group-hover:bg-white/10 group-hover:text-white transition-all">
                {s.metodo === 'Tarjeta' ? <CreditCard size={20} /> : s.metodo === 'Banco' ? <Landmark size={20} /> : <Banknote size={20} />}
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => { setActiveService(s); setIsEditing(true); }} className="p-2 text-neutral-500 hover:text-white"><Edit3 size={14}/></button>
                <button onClick={() => handleDelete(s.id)} className="p-2 text-neutral-500 hover:text-rose-500"><Trash2 size={14}/></button>
              </div>
            </div>
            
            <h4 className="text-lg font-bold text-white mb-1">{s.nombre}</h4>
            <p className="text-2xl font-mono font-bold text-neutral-200 mb-4">{s.monto} <span className="text-xs text-neutral-600 uppercase">Bs.</span></p>
            
            <div className="space-y-3 pt-4 border-t border-white/5">
              <div className="flex items-center gap-3 text-[10px] text-neutral-500 uppercase font-bold tracking-widest">
                <Calendar size={12} /> Próximo Pago: <span className="text-neutral-300 ml-auto">{s.fecha_pago}</span>
              </div>
              <div className="flex items-center gap-3 text-[10px] text-neutral-500 uppercase font-bold tracking-widest">
                <Mail size={12} /> Contacto: <span className="text-neutral-300 ml-auto truncate max-w-[150px]">{s.contacto || 'N/A'}</span>
              </div>
            </div>

            {s.notas && (
              <div className="mt-4 p-3 bg-white/[0.02] border border-white/5 rounded-lg">
                <p className="text-[10px] text-neutral-500 italic flex gap-2"><FileText size={12}/> {s.notas}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {isEditing && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f0f0f] border border-white/10 w-full max-w-[500px] rounded-3xl p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">Configurar Servicio</h3>
              <button onClick={() => setIsEditing(false)} className="text-neutral-500 hover:text-white transition-colors"><X size={20}/></button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="text-[10px] font-bold text-neutral-500 uppercase mb-2 block tracking-widest">Nombre del Servicio</label>
                <input 
                  type="text" 
                  value={activeService.nombre} 
                  onChange={e => setActiveService({...activeService, nombre: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-white/30" 
                  placeholder="Ej: Google Cloud, Luz, Internet..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-neutral-500 uppercase mb-2 block tracking-widest">Monto (Bs.)</label>
                  <input 
                    type="number" 
                    value={activeService.monto} 
                    onChange={e => setActiveService({...activeService, monto: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white font-mono outline-none focus:border-white/30" 
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-neutral-500 uppercase mb-2 block tracking-widest">Fecha de Pago</label>
                  <input 
                    type="date" 
                    value={activeService.fecha_pago} 
                    onChange={e => setActiveService({...activeService, fecha_pago: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-white/30" 
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-neutral-500 uppercase mb-2 block tracking-widest">Método de Pago</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Tarjeta', 'Banco', 'Efectivo'].map(m => (
                    <button 
                      key={m}
                      onClick={() => setActiveService({...activeService, metodo: m})}
                      className={`py-2 text-[10px] font-bold rounded-lg border transition-all ${
                        activeService.metodo === m ? 'bg-white text-black border-white' : 'bg-white/5 text-neutral-500 border-white/10'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-neutral-500 uppercase mb-2 block tracking-widest">Contacto / Correo</label>
                <input 
                  type="text" 
                  value={activeService.contacto} 
                  onChange={e => setActiveService({...activeService, contacto: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-white/30" 
                  placeholder="email@ejemplo.com o teléfono"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-neutral-500 uppercase mb-2 block tracking-widest">Notas / Observaciones</label>
                <textarea 
                  value={activeService.notas} 
                  onChange={e => setActiveService({...activeService, notas: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-xs outline-none focus:border-white/30 min-h-[80px] resize-none"
                  placeholder="Ej: El servicio va a fallar hasta el día X..."
                />
              </div>

              <button 
                onClick={handleSave}
                disabled={loading}
                className="w-full py-4 bg-white text-black font-bold rounded-2xl hover:bg-neutral-200 transition-all flex items-center justify-center gap-2"
              >
                <Save size={18} /> {loading ? 'Guardando...' : 'Guardar Servicio'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Pagos;
