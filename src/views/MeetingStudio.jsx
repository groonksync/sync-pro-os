import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Plus, Users, Video, PlayCircle, ArrowLeft, MessageSquare, Save, FileText, Eraser, 
  Hash, DollarSign, FolderOpen, ExternalLink, Quote, X, Trash2, Search, Mail, 
  Instagram, Youtube, Globe, CreditCard, Phone, Camera, Filter, MoreVertical,
  Calendar, CheckCircle2, Clock, User as UserIcon, Tag, Play, Pause, RotateCcw, 
  Layers, ListChecks, History, Timer, Scissors, Music, Palette, Share2, Activity,
  RefreshCw, AlertCircle, Check, Link, Target, ChevronRight,
  Zap, Copy, Smartphone, Monitor, Info, HardDrive, Megaphone,
  Building2, File, FileVideo, Image as ImageIcon, Folder, ChevronLeft,
  Upload, Download, Bold, Italic, Strikethrough, List, CheckSquare, Table2, Heading1, Heading2,
  Facebook, Cloud
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import GoogleTasks from '../components/GoogleTasks';
import { getDriveFiles, getCalendarEvents, getCalendarList, uploadFileToDrive, downloadDriveFile, deleteDriveFile, createCalendarEvent } from '../lib/googleApi';
import { aiService } from '../services/aiService';
import { Sparkles } from 'lucide-react';

const MeetingStudio = ({ meetingsList = [], setMeetingsList, settings = {}, token }) => {
  const [viewState, setViewState] = useState('client-list'); 
  const [activeClient, setActiveClient] = useState(null);
  const [activeMeeting, setActiveMeeting] = useState(null);
  const [rightPanelTab, setRightPanelTab] = useState('delivery');
  const [sessionTab, setSessionTab] = useState('editor');
  
  const [clients, setClients] = useState([]);
  const [clientSearch, setClientSearch] = useState('');
  const [meetingSearch, setMeetingSearch] = useState('');
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [driveFiles, setDriveFiles] = useState([]);
  const [driveLoading, setDriveLoading] = useState(false);
  const [sessionFolder, setSessionFolder] = useState({ id: 'root', name: 'Mi Unidad' });
  const [driveHistory, setDriveHistory] = useState([]);

  const [calendarEvents, setCalendarEvents] = useState([]);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [currentCalDate, setCurrentCalDate] = useState(new Date());
  const [sessionCalendarList, setSessionCalendarList] = useState([]);
  
  const [isCalModalOpen, setIsCalModalOpen] = useState(false);
  const [calTitle, setCalTitle] = useState('');
  const [calDate, setCalDate] = useState(new Date().toISOString().split('T')[0]);
  const [calStart, setCalStart] = useState('10:00');
  const [calEnd, setCalEnd] = useState('11:00');
  const [calDesc, setCalDesc] = useState('');
  const [calTargetId, setCalTargetId] = useState('primary');
  
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [time, setTime] = useState(0);
  const [rates, setRates] = useState({ USDT_BOB: 10.80, USD_BOB: 6.96, BRL: 1.38 }); 
  const [calcDisplay, setCalcDisplay] = useState('0');

  const editorRef = useRef(null);
  const timerRef = useRef(null);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [tempNoteText, setTempNoteText] = useState('');
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const [newClient, setNewClient] = useState({
    nombre: '', nombre_completo: '', identidad: '', email: '', telefono: '', 
    pais: '', empresa: '', metodo_pago_preferido: 'QR', link_brutos: '', foto_url: '', 
    redes: { instagram: '', youtube: '', twitter: '', tiktok: '' }
  });

  const normalizeText = (text) => (text || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    if (isTimerRunning) {
      timerRef.current = setInterval(() => setTime(t => t + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isTimerRunning]);

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase.from('clientes_editor').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setClients(data || []);
    } catch (e) { console.error(e); }
  };

  const fetchDriveFiles = async (folderId) => {
    if (!token) return;
    setDriveLoading(true);
    try {
      const files = await getDriveFiles(token, folderId || sessionFolder.id);
      setDriveFiles(files || []);
    } catch (e) { console.error(e); }
    setDriveLoading(false);
  };

  const loadCalendarEvents = async () => {
    if (!token) return;
    setCalendarLoading(true);
    try {
      const list = await getCalendarList(token);
      setSessionCalendarList(list || []);
      const results = await getCalendarEvents(token, 'primary', currentCalDate.getFullYear(), currentCalDate.getMonth());
      setCalendarEvents(results || []);
    } catch (e) { console.error(e); }
    setCalendarLoading(false);
  };

  useEffect(() => {
    if (viewState === 'session') {
      if (sessionTab === 'drive') fetchDriveFiles();
      if (sessionTab === 'calendar') loadCalendarEvents();
    }
  }, [sessionTab, viewState]);

  const handleCreateClient = async () => {
    if (!newClient.nombre) return;
    setLoading(true);
    try {
      const clientData = {
        nombre: newClient.nombre,
        nombre_completo: newClient.nombre_completo || '',
        identidad: newClient.identidad || '',
        email: newClient.email || '',
        telefono: newClient.telefono || '',
        pais: newClient.pais || '',
        empresa: newClient.empresa || '',
        metodo_pago_preferido: newClient.metodo_pago_preferido || 'QR',
        link_brutos: newClient.link_brutos || '',
        foto_url: newClient.foto_url || '',
        redes_sociales: newClient.redes || {},
        portal_id: crypto.randomUUID()
      };
      const { error } = await supabase.from('clientes_editor').upsert(clientData);
      if (error) throw error;
      await fetchClients();
      setIsClientModalOpen(false);
    } catch (e) { alert(e.message); }
    setLoading(false);
  };

  const openClientProfile = async (client) => { 
    setActiveClient(client); 
    setLoading(true);
    try {
      const { data, error } = await supabase.from('reuniones').select('*').eq('cliente_id', client.id).order('created_at', { ascending: false });
      if (error) throw error;
      setMeetingsList(data || []);
      setViewState('client-profile'); 
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const openMeeting = (meeting) => { 
    setActiveMeeting({
      ...meeting,
      pipeline: Array.isArray(meeting.pipeline) ? meeting.pipeline : [],
      feedback: Array.isArray(meeting.feedback) ? meeting.feedback : [],
      hitos_pago: Array.isArray(meeting.hitos_pago) ? meeting.hitos_pago : [],
      export_checklist: Array.isArray(meeting.export_checklist) ? meeting.export_checklist : []
    }); 
    setTime(meeting.total_time || 0);
    setViewState('session'); 
  };

  const saveMeeting = async () => {
    setLoading(true);
    try {
      const updatedMeeting = { ...activeMeeting, total_time: time, updated_at: new Date().toISOString() };
      await supabase.from('reuniones').upsert(updatedMeeting);
      setViewState('client-profile'); 
      setActiveMeeting(null);
      setIsTimerRunning(false);
    } catch (error) { alert(error.message); }
    setLoading(false);
  };

  const formatTime = (s) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const formatText = (command, value = null, e) => {
    if (e) e.preventDefault();
    document.execCommand(command, false, value);
    if (editorRef.current) editorRef.current.focus();
  };

  const insertTag = (e, tagName, colorBg, colorText, colorBorder) => {
    if (e) e.preventDefault();
    const html = `<span contenteditable="false" style="background-color: ${colorBg}; color: ${colorText}; border: 1px solid ${colorBorder}; padding: 2px 8px; border-radius: 12px; font-size: 9px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.05em; display: inline-flex; align-items: center; justify-content: center; margin: 0 4px; vertical-align: middle;">${tagName}</span>&nbsp;`;
    document.execCommand('insertHTML', false, html);
    if (editorRef.current) editorRef.current.focus();
  };

  const EDITOR_TAGS = [
    { name: 'Guion', bg: 'rgba(59, 130, 246, 0.1)', text: '#60a5fa', border: 'rgba(59, 130, 246, 0.3)' },
    { name: 'Video', bg: 'rgba(239, 68, 68, 0.1)', text: '#f87171', border: 'rgba(239, 68, 68, 0.3)' },
    { name: 'IA', bg: 'rgba(168, 85, 247, 0.1)', text: '#c084fc', border: 'rgba(168, 85, 247, 0.3)' }
  ];

  const filteredClients = useMemo(() => {
    return (clients || []).filter(c => {
      const search = normalizeText(clientSearch);
      return normalizeText(c.nombre).includes(search) || normalizeText(c.empresa).includes(search);
    });
  }, [clients, clientSearch]);

  const filteredMeetings = useMemo(() => {
    return (meetingsList || []).filter(m => m && m.cliente_id === activeClient?.id);
  }, [meetingsList, activeClient]);

  // RENDER SEGURO CON TRY-CATCH
  try {
    return (
      <div className="flex flex-col h-screen w-full bg-black font-sans text-white overflow-hidden animate-in fade-in duration-500">
        
        {/* VISTA: LISTA DE CLIENTES */}
        {viewState === 'client-list' && (
          <div className="p-6 space-y-6 overflow-y-auto mac-scrollbar h-full">
            <header className="flex justify-between items-center pb-8 border-b border-white/5">
              <div>
                <h2 className="text-4xl font-black text-white tracking-tighter uppercase leading-none">Editor <span className="text-neutral-800">Pro</span></h2>
                <p className="text-[10px] text-neutral-600 font-black uppercase tracking-[0.3em] mt-2">Gestión de Talento • v4.0</p>
              </div>
              <button onClick={() => setIsClientModalOpen(true)} className="px-8 py-4 bg-white text-black rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-neutral-200 transition-all flex items-center gap-3">
                <Plus size={18}/> Nuevo Cliente
              </button>
            </header>

            <div className="relative">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-neutral-700" size={18}/>
              <input type="text" value={clientSearch} onChange={e=>setClientSearch(e.target.value)} placeholder="Identificar talento..." className="w-full bg-[#0a0a0a] border border-white/5 rounded-xl py-4 pl-14 pr-6 text-sm outline-none" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredClients.map(client => (
                <div key={client.id} onClick={() => openClientProfile(client)} className="bg-[#0a0a0a] border border-white/5 rounded-[3rem] p-10 hover:bg-white/10 cursor-pointer transition-all flex flex-col items-center text-center group active:scale-95 shadow-2xl relative">
                  <div className="w-28 h-28 mb-8 rounded-[2rem] bg-white/5 flex items-center justify-center overflow-hidden border border-white/5">
                    {client.foto_url ? <img src={client.foto_url} className="w-full h-full object-cover" alt="" /> : <UserIcon size={40} className="text-neutral-800" />}
                  </div>
                  <h4 className="text-xl font-black text-white uppercase tracking-tighter mb-1">{client.nombre}</h4>
                  <p className="text-[10px] text-neutral-500 font-black uppercase tracking-[0.2em] mb-6">{client.pais || 'Global'}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VISTA: PERFIL CLIENTE */}
        {viewState === 'client-profile' && activeClient && (
          <div className="h-full flex flex-col overflow-hidden bg-black">
            <header className="px-6 py-4 bg-[#0a0a0a] border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-6">
                <button onClick={() => setViewState('client-list')} className="w-10 h-10 bg-white/5 rounded-2xl flex items-center justify-center text-neutral-600 hover:text-white transition-all"><ArrowLeft size={20}/></button>
                <h3 className="text-xl font-black text-white uppercase tracking-tighter leading-none">{activeClient.nombre}</h3>
              </div>
              <button onClick={async () => {
                 const newM = { id: crypto.randomUUID(), cliente_id: activeClient.id, fecha: new Date().toISOString().split('T')[0], estado: 'Pendiente', contenido: '<p><br></p>', total_time: 0 };
                 await supabase.from('reuniones').insert(newM);
                 openMeeting(newM);
              }} className="px-8 py-3 bg-white text-black rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2"><Plus size={16}/> Nueva Sesión</button>
            </header>

            <div className="flex-1 p-8 overflow-y-auto mac-scrollbar">
               <div className="max-w-4xl mx-auto space-y-4">
                  {filteredMeetings.map(m => (
                    <div key={m.id} onClick={() => openMeeting(m)} className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-6 hover:bg-white/10 cursor-pointer transition-all flex items-center justify-between group">
                       <div className="flex items-center gap-6">
                          <PlayCircle size={24} className="text-neutral-800 group-hover:text-emerald-500 transition-all"/>
                          <p className="text-base font-black text-white uppercase tracking-tighter">{m.fecha}</p>
                       </div>
                       <p className="text-xl font-black text-white font-mono">{formatTime(m.total_time || 0)}</p>
                    </div>
                  ))}
               </div>
            </div>
          </div>
        )}

        {/* VISTA: SESIÓN / WAR ROOM */}
        {viewState === 'session' && activeMeeting && (
          <div className="flex-1 flex flex-col overflow-hidden bg-black">
            <header className="px-5 py-3 border-b border-white/5 bg-[#0a0a0a] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-4">
                <button onClick={saveMeeting} className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-neutral-600 hover:text-white transition-all"><ArrowLeft size={20}/></button>
                <h3 className="text-[12px] font-black text-white uppercase tracking-tighter leading-none">{activeClient?.nombre} / {activeMeeting.fecha}</h3>
              </div>
              <div className="flex items-center gap-3">
                 <div className="bg-black border border-white/5 rounded-xl px-4 py-1.5 flex items-center gap-3">
                    <p className="text-sm font-mono font-black text-white">{formatTime(time)}</p>
                    <button onClick={() => setIsTimerRunning(!isTimerRunning)} className={`w-8 h-8 rounded-lg flex items-center justify-center ${isTimerRunning ? 'bg-amber-500 text-black' : 'bg-white/5 text-white'}`}>
                      {isTimerRunning ? <Pause size={14}/> : <Play size={14}/>}
                    </button>
                 </div>
                 <button onClick={saveMeeting} className="px-6 py-2.5 bg-white text-black text-[10px] font-black rounded-xl uppercase tracking-widest flex items-center gap-2">
                  <Save size={16}/> Guardar
                </button>
              </div>
            </header>

            <div className="flex-1 flex p-1.5 gap-1.5 overflow-hidden">
               {/* CENTRO: EDITOR */}
               <div className="flex-1 flex flex-col bg-[#0a0a0a] border border-white/5 rounded-[24px] overflow-hidden shadow-2xl relative">
                  <div className="flex items-center gap-3 px-6 py-4 border-b border-white/5 bg-black/40">
                      <button onMouseDown={(e) => formatText('bold', null, e)} className="p-3 text-neutral-500 hover:text-white bg-white/5 rounded-xl"><Bold size={16}/></button>
                      <div className="flex-1 flex items-center gap-2 overflow-x-auto no-scrollbar">
                         {EDITOR_TAGS.map(tag => (
                           <button key={tag.name} onMouseDown={(e) => insertTag(e, tag.name, tag.bg, tag.text, tag.border)} className="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest shrink-0" style={{ backgroundColor: tag.bg, color: tag.text, border: `1px solid ${tag.border}` }}>{tag.name}</button>
                         ))}
                      </div>
                  </div>
                  <div 
                    ref={editorRef} 
                    contentEditable="true" 
                    suppressContentEditableWarning={true} 
                    className="w-full flex-1 p-8 text-neutral-300 font-normal text-[15px] leading-relaxed editor-container outline-none mac-scrollbar overflow-y-auto" 
                    dangerouslySetInnerHTML={{ __html: activeMeeting.contenido || '<p><br></p>' }} 
                    onBlur={() => setActiveMeeting({...activeMeeting, contenido: editorRef.current?.innerHTML || ''})}
                  />
               </div>

               {/* LATERAL DERECHO */}
               <div className="w-[300px] flex flex-col gap-1.5">
                  <div className="flex-1 bg-[#0a0a0a] border border-white/5 rounded-xl p-4 overflow-y-auto mac-scrollbar">
                     <p className="text-[10px] text-neutral-700 font-black uppercase mb-4 tracking-widest">Tareas Nexus</p>
                     <GoogleTasks token={token} />
                  </div>
               </div>
            </div>
          </div>
        )}

        {/* MODAL CLIENTE */}
        {isClientModalOpen && (
          <div className="fixed inset-0 z-[600] flex items-center justify-center bg-black/90 backdrop-blur-xl p-8">
             <div className="bg-[#0a0a0a] border border-white/10 rounded-[40px] w-full max-w-xl p-10 space-y-6">
                <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Nuevo Perfil</h3>
                <input type="text" value={newClient.nombre} onChange={e=>setNewClient({...newClient, nombre: e.target.value})} placeholder="Nombre del Cliente" className="w-full bg-black border border-white/5 rounded-2xl p-4 text-white outline-none" />
                <div className="flex gap-4 pt-6">
                   <button onClick={() => setIsClientModalOpen(false)} className="flex-1 py-4 text-neutral-600 font-black uppercase text-[10px]">Cerrar</button>
                   <button onClick={handleCreateClient} className="flex-[2] py-4 bg-white text-black rounded-2xl font-black uppercase text-[10px]">Guardar Perfil</button>
                </div>
             </div>
          </div>
        )}
      </div>
    );
  } catch (err) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center bg-black p-20">
        <AlertCircle size={48} className="text-rose-500 mb-6" />
        <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">Error Crítico de Renderizado</h2>
        <p className="text-neutral-600 text-xs uppercase tracking-widest mb-8">{err.message}</p>
        <button onClick={() => window.location.reload()} className="px-8 py-3 bg-white text-black font-black rounded-xl uppercase text-[10px]">Reiniciar Sistema</button>
      </div>
    );
  }
};

export default MeetingStudio;
