import React, { useState, useRef } from 'react';
import { 
  Plus, Users, Video, PlayCircle, ArrowLeft, MessageSquare, Save, FileText, Eraser, 
  Hash, DollarSign, FolderOpen, ExternalLink, Quote, X, Trash2 
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

const MeetingStudio = ({ meetingsList, setMeetingsList }) => {
  const [meetingView, setMeetingView] = useState('list'); 
  const [activeMeeting, setActiveMeeting] = useState(null);
  const [newMeetingForm, setNewMeetingForm] = useState({ cliente: '', fecha: new Date().toISOString().split('T')[0], link: '', presupuesto: 0 });
  const [loading, setLoading] = useState(false);
  
  const editorRef = useRef(null);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [tempNoteText, setTempNoteText] = useState('');
  const [pendingNoteRange, setPendingNoteRange] = useState(null);

  const openMeeting = (meeting) => { setActiveMeeting(meeting); setMeetingView('session'); };
  
  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!confirm('¿Borrar esta sesión de trabajo?')) return;
    try {
      const { error } = await supabase.from('reuniones').delete().eq('id', id);
      if (error) throw error;
      setMeetingsList(meetingsList.filter(m => m.id !== id));
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  const createMeeting = async () => {
    const newMeeting = { 
      id: crypto.randomUUID(), 
      cliente: newMeetingForm.cliente || 'Cliente Nuevo', 
      fecha: newMeetingForm.fecha, 
      estado: 'Pendiente', 
      link: newMeetingForm.link, 
      drive: '', 
      presupuesto: parseFloat(newMeetingForm.presupuesto) || 0, 
      contenido: '<p><br></p>', 
      insights: [] 
    };

    setLoading(true);
    try {
      const { error } = await supabase.from('reuniones').insert(newMeeting);
      if (error) throw error;
      setMeetingsList([...meetingsList, newMeeting]); 
      setActiveMeeting(newMeeting); 
      setMeetingView('session');
      setNewMeetingForm({ cliente: '', fecha: new Date().toISOString().split('T')[0], link: '', presupuesto: 0 });
    } catch (error) {
      alert('Error al crear: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const saveMeeting = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('reuniones')
        .upsert({
          ...activeMeeting,
          presupuesto: parseFloat(activeMeeting.presupuesto) || 0
        });
      if (error) throw error;
      setMeetingsList(meetingsList.map(m => m.id === activeMeeting.id ? activeMeeting : m));
      setMeetingView('list'); 
      setActiveMeeting(null);
    } catch (error) {
      alert('Error al guardar: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const applyHighlight = (colorHex, e) => { e.preventDefault(); document.execCommand('hiliteColor', false, colorHex); };
  const clearHighlight = (e) => { e.preventDefault(); document.execCommand('hiliteColor', false, 'transparent'); };
  
  const initNoteAddition = (e) => {
    e.preventDefault(); const selection = window.getSelection();
    if (!selection.rangeCount || selection.isCollapsed) return;
    setPendingNoteRange(selection.getRangeAt(0).cloneRange()); setTempNoteText(''); setShowNoteModal(true);
  };

  const confirmAddNote = () => {
    if (!pendingNoteRange || !tempNoteText) { setShowNoteModal(false); return; }
    const selection = window.getSelection(); selection.removeAllRanges(); selection.addRange(pendingNoteRange);
    const span = document.createElement('span'); span.className = 'annotated-text'; span.setAttribute('data-note', tempNoteText); span.textContent = pendingNoteRange.toString();
    pendingNoteRange.deleteContents(); pendingNoteRange.insertNode(span);
    setActiveMeeting({...activeMeeting, contenido: editorRef.current.innerHTML});
    selection.removeAllRanges(); setShowNoteModal(false); setPendingNoteRange(null);
  };

  const addInsight = () => { setActiveMeeting({...activeMeeting, insights: [...activeMeeting.insights, { id: Date.now(), text: '', note: '' }]}); };

  return (
    <div className="flex flex-col h-full max-w-[1200px] w-full">
      {meetingView === 'list' && (
        <div className="animate-in fade-in duration-300">
          <header className="mb-6 flex justify-between items-center">
            <h2 className="text-2xl font-light text-white tracking-tight">Directorio de Clientes</h2>
            <button onClick={() => setMeetingView('create')} className="px-3 py-1.5 bg-amber-500 text-black text-xs font-bold rounded-md hover:bg-amber-400 transition-colors flex items-center gap-1.5">
              <Plus size={14} /> Nueva Sesión
            </button>
          </header>
          <div className="bg-[#0a0a0a] border border-white/[0.05] rounded-xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-black/40 border-b border-white/[0.05]">
                  <th className="px-4 py-2.5 text-[10px] font-bold text-neutral-500 uppercase tracking-widest w-1/3">Cliente</th>
                  <th className="px-4 py-2.5 text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Fecha</th>
                  <th className="px-4 py-2.5 text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Estado</th>
                  <th className="px-4 py-2.5 text-[10px] font-bold text-neutral-500 uppercase tracking-widest text-right">Acción</th>
                </tr>
              </thead>
              <tbody>
                {meetingsList.length > 0 ? [...meetingsList].sort((a, b) => a.cliente.localeCompare(b.cliente)).map(m => (
                  <tr key={m.id} onClick={() => openMeeting(m)} className="border-b border-white/[0.02] hover:bg-white/[0.02] cursor-pointer transition-colors group">
                    <td className="px-4 py-3 flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded bg-white/5 flex items-center justify-center text-neutral-400 group-hover:text-amber-500"><Users size={12} /></div>
                      <span className="text-xs text-white font-medium">{m.cliente}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-neutral-400 font-mono">{m.fecha}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[9px] px-2 py-0.5 rounded uppercase font-bold tracking-widest border ${m.estado === 'En Progreso' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : m.estado === 'Finalizado' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-white/5 text-neutral-400 border-white/10'}`}>
                        {m.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right flex items-center justify-end gap-2">
                       <button onClick={(e) => handleDelete(m.id, e)} className="p-2 text-neutral-600 hover:text-rose-500 transition-colors">
                         <Trash2 size={14} />
                       </button>
                       <span className="text-[10px] text-neutral-500 group-hover:text-white transition-colors uppercase font-bold tracking-tighter">Abrir</span>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan="4" className="px-4 py-10 text-center text-neutral-600 text-xs italic tracking-widest">Sin sesiones registradas</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {meetingView === 'create' && (
        <div className="animate-in slide-in-from-bottom-4 duration-300 max-w-xl mx-auto w-full mt-6">
          <div className="flex items-center gap-2 mb-4 text-xs text-neutral-500 cursor-pointer hover:text-white w-max" onClick={() => setMeetingView('list')}>
            <ArrowLeft size={12}/> Volver
          </div>
          <div className="bg-[#0a0a0a] border border-white/[0.05] rounded-xl p-8 shadow-2xl">
            <h2 className="text-2xl font-light text-white tracking-tight mb-6 flex items-center gap-2"><PlayCircle size={20} className="text-amber-500"/> Iniciar Sesión</h2>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] uppercase tracking-widest text-neutral-500 font-bold mb-1.5 block">Cliente</label>
                <input type="text" value={newMeetingForm.cliente} onChange={e => setNewMeetingForm({...newMeetingForm, cliente: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-md px-3 py-2 text-sm text-white outline-none focus:border-amber-500/50" placeholder="Nombre completo" autoFocus/>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-neutral-500 font-bold mb-1.5 block">Fecha</label>
                  <input type="date" value={newMeetingForm.fecha} onChange={e => setNewMeetingForm({...newMeetingForm, fecha: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-md px-3 py-2 text-xs text-neutral-300 outline-none focus:border-amber-500/50" />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-neutral-500 font-bold mb-1.5 block">Presupuesto ($)</label>
                  <input type="number" value={newMeetingForm.presupuesto} onChange={e => setNewMeetingForm({...newMeetingForm, presupuesto: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-md px-3 py-2 text-xs text-white outline-none focus:border-amber-500/50" />
                </div>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-neutral-500 font-bold mb-1.5 block">Link Meet (Opcional)</label>
                <input type="text" value={newMeetingForm.link} onChange={e => setNewMeetingForm({...newMeetingForm, link: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-md px-3 py-2 text-xs text-white outline-none focus:border-amber-500/50" placeholder="https://..." />
              </div>
            </div>
            <div className="mt-8">
              <button onClick={createMeeting} disabled={loading} className="w-full py-2.5 bg-white text-black text-xs font-bold rounded-md hover:bg-neutral-200 transition-colors disabled:opacity-50">{loading ? 'Creando...' : 'Crear y Abrir Cuaderno'}</button>
            </div>
          </div>
        </div>
      )}

      {meetingView === 'session' && activeMeeting && (
        <div className="animate-in fade-in duration-300 h-full flex flex-col">
          {showNoteModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
              <div className="bg-[#111] border border-white/10 rounded-xl p-5 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="flex items-center gap-2 mb-3 text-white text-sm font-medium"><MessageSquare size={14} className="text-amber-500"/> Nota en texto</div>
                <textarea autoFocus value={tempNoteText} onChange={e => setTempNoteText(e.target.value)} placeholder="Aparecerá como un tooltip flotante..." className="w-full bg-black border border-white/10 rounded-md p-2 text-xs text-white outline-none focus:border-amber-500/50 h-20 resize-none mb-3" />
                <div className="flex justify-end gap-2">
                  <button onClick={() => setShowNoteModal(false)} className="px-3 py-1.5 text-[11px] font-bold text-neutral-400 hover:text-white">Cancelar</button>
                  <button onClick={confirmAddNote} className="px-3 py-1.5 bg-amber-500 text-black text-[11px] font-bold rounded hover:bg-amber-400">Guardar</button>
                </div>
              </div>
            </div>
          )}

          <header className="mb-4 flex flex-col md:flex-row md:items-end justify-between gap-4 pb-3 border-b border-white/[0.05]">
            <div>
              <div className="flex items-center gap-2 mb-1.5 text-[9px] font-bold">
                 <button onClick={() => setMeetingView('list')} className="text-neutral-500 hover:text-white transition-colors flex items-center gap-1 uppercase tracking-widest"><ArrowLeft size={10}/> Lista</button>
                 <span className="text-neutral-700">|</span>
                 <span className="uppercase tracking-widest text-neutral-400">{activeMeeting.fecha}</span>
              </div>
              <input type="text" value={activeMeeting.cliente} onChange={e=>setActiveMeeting({...activeMeeting, cliente: e.target.value})} className="text-2xl font-semibold bg-transparent outline-none text-white w-full max-w-[400px]" placeholder="Cliente" />
            </div>
            <div className="flex items-center gap-3">
              <select 
                value={activeMeeting.estado} onChange={(e) => setActiveMeeting({...activeMeeting, estado: e.target.value})}
                className={`text-[9px] uppercase font-bold tracking-widest px-2 py-1.5 rounded outline-none cursor-pointer border ${activeMeeting.estado === 'Finalizado' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}
              >
                <option>Pendiente</option><option>En Progreso</option><option>Finalizado</option>
              </select>
              <button onClick={saveMeeting} disabled={loading} className="px-4 py-2 bg-white text-black text-[11px] font-bold rounded-md hover:bg-neutral-200 transition-colors flex items-center gap-1.5 disabled:opacity-50">
                <Save size={12}/> {loading ? 'Guardando...' : 'Guardar Sesión'}
              </button>
            </div>
          </header>

          <div className="flex-1 grid grid-cols-12 gap-5 min-h-[400px]">
            <div className="col-span-8 flex flex-col bg-[#0a0a0a] border border-white/[0.05] rounded-xl overflow-hidden shadow-sm">
              <div className="px-3 py-2 border-b border-white/5 flex justify-between items-center bg-black/40">
                <div className="flex items-center gap-1.5 text-neutral-500"><FileText size={12} /><span className="text-[10px] font-bold uppercase tracking-widest">Minuta</span></div>
                <div className="flex items-center gap-1.5 bg-white/[0.02] px-1.5 py-1 rounded border border-white/5">
                  <button onMouseDown={(e) => applyHighlight('rgba(239, 68, 68, 0.3)', e)} className="w-3.5 h-3.5 rounded-sm bg-rose-500 cursor-pointer hover:scale-110 transition-transform"></button>
                  <button onMouseDown={(e) => applyHighlight('rgba(59, 130, 246, 0.3)', e)} className="w-3.5 h-3.5 rounded-sm bg-blue-500 cursor-pointer hover:scale-110 transition-transform"></button>
                  <button onMouseDown={(e) => applyHighlight('rgba(234, 179, 8, 0.3)', e)} className="w-3.5 h-3.5 rounded-sm bg-yellow-500 cursor-pointer hover:scale-110 transition-transform"></button>
                  <div className="w-[1px] h-3 bg-white/10 mx-0.5"></div>
                  <button onMouseDown={clearHighlight} title="Limpiar" className="text-neutral-500 hover:text-white p-0.5"><Eraser size={12}/></button>
                  <button onMouseDown={initNoteAddition} title="Añadir Nota" className="text-amber-500 hover:text-amber-300 p-0.5"><MessageSquare size={12}/></button>
                </div>
              </div>
              <div 
                ref={editorRef} 
                contentEditable="true" 
                suppressContentEditableWarning={true} 
                className="w-full flex-1 p-5 text-neutral-300 font-light text-sm leading-relaxed mac-scrollbar editor-container outline-none" 
                dangerouslySetInnerHTML={{ __html: activeMeeting.contenido }} 
                onBlur={() => setActiveMeeting({...activeMeeting, contenido: editorRef.current.innerHTML})}
              ></div>
            </div>
            <div className="col-span-4 flex flex-col gap-4">
              <div className="bg-[#0a0a0a] border border-white/[0.05] rounded-xl p-4">
                <h3 className="text-[10px] font-bold tracking-widest uppercase text-neutral-500 mb-3 flex items-center gap-1.5"><Hash size={12}/> Metadatos</h3>
                <div className="space-y-2.5">
                  <div className="flex items-center bg-black/40 border border-white/5 rounded px-2 py-1.5">
                    <DollarSign size={12} className="text-neutral-500 mr-2"/>
                    <input type="number" value={activeMeeting.presupuesto} onChange={e=>setActiveMeeting({...activeMeeting, presupuesto: e.target.value})} className="bg-transparent text-xs text-white outline-none w-full font-mono" placeholder="Presupuesto" />
                  </div>
                  <div className="flex items-center bg-black/40 border border-white/5 rounded px-2 py-1.5">
                    <FolderOpen size={12} className="text-neutral-500 mr-2"/>
                    <input type="text" value={activeMeeting.drive || ''} onChange={e=>setActiveMeeting({...activeMeeting, drive: e.target.value})} className="bg-transparent text-xs text-white outline-none w-full" placeholder="Carpeta Drive..." />
                  </div>
                  <div className="flex items-center bg-black/40 border border-white/5 rounded px-2 py-1.5">
                    <Video size={12} className="text-neutral-500 mr-2"/>
                    <input type="text" value={activeMeeting.link || ''} onChange={e=>setActiveMeeting({...activeMeeting, link: e.target.value})} className="bg-transparent text-xs text-white outline-none w-full" placeholder="Enlace Meet..." />
                  </div>
                  {activeMeeting.link && (
                     <a href={activeMeeting.link.includes('http') ? activeMeeting.link : `https://${activeMeeting.link}`} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-1 text-[10px] uppercase font-bold bg-white/5 hover:bg-white/10 text-white rounded py-1.5 transition-colors mt-1">Lanzar Meet <ExternalLink size={10}/></a>
                  )}
                </div>
              </div>
              <div className="bg-gradient-to-b from-amber-500/[0.02] to-transparent border border-amber-500/10 rounded-xl p-4 flex-1 flex flex-col overflow-hidden">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-[10px] font-bold tracking-widest uppercase text-amber-500 flex items-center gap-1.5"><Quote size={10}/> Insights</h3>
                  <button onClick={addInsight} className="text-neutral-400 hover:text-white p-0.5 bg-white/5 rounded transition-colors"><Plus size={12}/></button>
                </div>
                <div className="space-y-3 flex-1 overflow-y-auto pr-1 mac-scrollbar">
                  {activeMeeting.insights.map((insight) => (
                    <div key={insight.id} className="p-2.5 bg-black/40 border border-white/5 rounded-lg relative group animate-in slide-in-from-right-2 duration-200">
                      <button onClick={() => setActiveMeeting({...activeMeeting, insights: activeMeeting.insights.filter(i=>i.id!==insight.id)})} className="absolute top-1.5 right-1.5 text-neutral-600 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"><X size={10}/></button>
                      <input type="text" value={insight.text} onChange={(e) => setActiveMeeting({...activeMeeting, insights: activeMeeting.insights.map(i => i.id === insight.id ? {...i, text: e.target.value} : i)})} placeholder="Punto clave..." className="w-full bg-transparent text-[11px] text-white italic font-medium mb-1.5 outline-none pr-3" />
                      <input type="text" value={insight.note} onChange={(e) => setActiveMeeting({...activeMeeting, insights: activeMeeting.insights.map(i => i.id === insight.id ? {...i, note: e.target.value} : i)})} placeholder="Anotación..." className="w-full bg-transparent border-b border-white/10 text-[10px] text-neutral-500 pb-0.5 outline-none focus:border-amber-500/50" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MeetingStudio;
