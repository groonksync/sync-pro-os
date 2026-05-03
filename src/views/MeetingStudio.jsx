import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Plus, Users, Video, PlayCircle, ArrowLeft, MessageSquare, Save, FileText, Eraser, 
  Hash, DollarSign, FolderOpen, ExternalLink, Quote, X, Trash2, Search, Mail, 
  Instagram, Youtube, Globe, CreditCard, Phone, Camera, Filter, MoreVertical,
  Calendar, CheckCircle2, Clock, User as UserIcon, Tag, Play, Pause, RotateCcw, 
  Layers, ListChecks, History, Timer, Scissors, Music, Palette, Share2, Activity,
  Calculator as CalcIcon, RefreshCw, AlertCircle, Check, Link, Target, ChevronRight,
  Zap, Copy, Smartphone, Monitor, Info, HardDrive, Megaphone, Palette as BrandIcon,
  Building2, Globe as GlobeIcon, File, FileVideo, Image as ImageIcon, Folder, ChevronLeft,
  Upload, Download, Bold, Italic, Strikethrough, List, CheckSquare, Table2, Heading1, Heading2,
  Facebook, Smartphone as TiktokIcon, Cloud, Sparkles, Type, Highlighter, TrendingUp, BarChart3,
  AlignLeft, AlignCenter, AlignRight, ListOrdered, ClipboardList, Briefcase, Edit3, Mail as MailIcon
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import GoogleTasks from '../components/GoogleTasks';
import { getDriveFiles, getCalendarEvents, getCalendarList, uploadFileToDrive, downloadDriveFile, deleteDriveFile, createCalendarEvent } from '../lib/googleApi';
import { aiService } from '../services/aiService';

const MeetingStudio = ({ meetingsList = [], setMeetingsList, settings = {}, token }) => {
  const isLight = settings.theme === 'light';
  
  const [viewState, setViewState] = useState('client-list'); 
  const [activeClient, setActiveClient] = useState(null);
  const [activeMeeting, setActiveMeeting] = useState(null);
  const [sessionTab, setSessionTab] = useState('editor'); 
  
  const [clients, setClients] = useState([]);
  const [clientSearch, setClientSearch] = useState('');
  const [meetingSearch, setMeetingSearch] = useState(''); 
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [driveFiles, setDriveFiles] = useState([]);
  const [driveLoading, setDriveLoading] = useState(false);

  // GOOGLE CALENDAR
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [isCalModalOpen, setIsCalModalOpen] = useState(false);
  const [calTitle, setCalTitle] = useState('');
  const [calDate, setCalDate] = useState(new Date().toISOString().split('T')[0]);
  const [calStart, setCalStart] = useState('10:00');
  const [calEnd, setCalEnd] = useState('11:00');
  const [calDesc, setCalDesc] = useState('');
  
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [time, setTime] = useState(0);
  const [calcDisplay, setCalcDisplay] = useState('0');
  const editorRef = useRef(null);
  const timerRef = useRef(null);
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const [newClient, setNewClient] = useState({
    nombre: '', identidad: '', email: '', telefono: '', 
    pais: '', empresa: '', status: 'Activo', foto_url: '', 
    redes: { instagram: '', youtube: '', tiktok: '' }
  });

  useEffect(() => { fetchClients(); }, []);

  useEffect(() => {
    if (isTimerRunning) timerRef.current = setInterval(() => setTime(t => t + 1), 1000);
    else clearInterval(timerRef.current);
    return () => clearInterval(timerRef.current);
  }, [isTimerRunning]);

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase.from('clientes_editor').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setClients(data || []);
    } catch (e) { console.error(e); }
  };

  const normalizeText = (text) => (text || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  const handleCreateClient = async () => {
    if (!newClient.nombre) return;
    setLoading(true);
    try {
      const clientData = { ...newClient, redes_sociales: newClient.redes, portal_id: newClient.id ? newClient.portal_id : crypto.randomUUID() };
      delete clientData.redes;
      if (newClient.id) await supabase.from('clientes_editor').update(clientData).eq('id', newClient.id);
      else await supabase.from('clientes_editor').insert(clientData);
      await fetchClients();
      setIsClientModalOpen(false);
      setNewClient({ nombre: '', email: '', pais: '', status: 'Activo', redes: { instagram: '', youtube: '', tiktok: '' } });
    } catch (e) { alert(e.message); }
    setLoading(false);
  };

  const handleDeleteClient = async (clientId, e) => {
    if (e) e.stopPropagation();
    if (!confirm('¿ELIMINAR CLIENTE Y TODAS SUS SESIONES? Esta acción es irreversible.')) return;
    try {
      await supabase.from('reuniones').delete().eq('cliente_id', clientId);
      await supabase.from('clientes_editor').delete().eq('id', clientId);
      await fetchClients();
    } catch (e) { alert(e.message); }
  };

  const toggleClientStatus = async (client, e) => {
    if (e) e.stopPropagation();
    const newStatus = client.status === 'Activo' ? 'Ausente' : 'Activo';
    try {
      await supabase.from('clientes_editor').update({ status: newStatus }).eq('id', client.id);
      await fetchClients();
    } catch (e) { console.error(e); }
  };

  const openClientProfile = (client) => { setActiveClient(client); fetchMeetings(client.id); setViewState('client-profile'); };

  const fetchMeetings = async (clientId) => {
    try {
      const { data, error } = await supabase.from('reuniones').select('*').eq('cliente_id', clientId).order('created_at', { ascending: false });
      if (error) throw error;
      setMeetingsList(data || []);
    } catch (e) { console.error(e); }
  };

  const openMeeting = (meeting) => { 
    setActiveMeeting({
      ...meeting,
      session_title: meeting.session_title || 'Edición de Video',
      revision_version: meeting.revision_version || 'V1',
      contenido: meeting.contenido || '<p><br></p>',
      priority: meeting.priority || 'Baja',
      hitos_pago: meeting.hitos_pago || [],
      pipeline: meeting.pipeline || [
        { id: 1, label: 'Corte Bruto', done: false },
        { id: 2, label: 'Color Grade', done: false },
        { id: 3, label: 'SFX/Mix', done: false },
        { id: 4, label: 'Export Final', done: false }
      ],
      deadlines: meeting.deadlines || [],
      mood_board: meeting.mood_board || [],
      brand_kit: meeting.brand_kit || { colors: [], logos: [] }
    }); 
    setTime(meeting.total_time || 0);
    setViewState('session'); 
  };

  const createMeeting = async () => {
    const sTitle = prompt('Descripción de la sesión:', 'Edición de Video');
    if (!sTitle) return;
    const newMeeting = { 
      id: crypto.randomUUID(), cliente_id: activeClient.id, cliente: activeClient.nombre, fecha: new Date().toISOString().split('T')[0], session_title: sTitle,
      contenido: '<p><br></p>', total_time: 0, priority: 'Baja', revision_version: 'V1'
    };
    try { await supabase.from('reuniones').insert(newMeeting); await fetchMeetings(activeClient.id); openMeeting(newMeeting); } catch (error) { alert(error.message); }
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

  const handleCalc = (val) => {
    if (val === '=') { try { setCalcDisplay(eval(calcDisplay).toString()); } catch (e) { setCalcDisplay('Error'); } }
    else if (val === 'C') setCalcDisplay('0');
    else setCalcDisplay(prev => prev === '0' ? val : prev + val);
  };

  const formatTime = (s) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const formatText = (command, value = null, e) => { if (e) e.preventDefault(); document.execCommand(command, false, value); editorRef.current.focus(); };
  
  const handleAISuggestion = async () => {
    if (!aiPrompt) return;
    setAiLoading(true);
    try {
      const suggestion = await aiService.generateScript(aiPrompt, editorRef.current.innerHTML, 'Profesional');
      document.execCommand('insertHTML', false, suggestion.replace(/\n/g, '<br>') + '<br>');
      setShowAIModal(false);
      setAiPrompt('');
    } catch (e) { alert(e.message); }
    setAiLoading(false);
  };

  const filteredClients = (clients || []).filter(c => normalizeText(c.nombre).includes(normalizeText(clientSearch)));
  const filteredMeetings = useMemo(() => (meetingsList || []).filter(m => normalizeText(m.session_title).includes(normalizeText(meetingSearch))), [meetingsList, meetingSearch]);
  const totalTimeWorked = useMemo(() => (meetingsList || []).reduce((acc, curr) => acc + (curr.total_time || 0), 0), [meetingsList]);

  // COLOR SCHEME
  const colors = {
    bg: isLight ? 'bg-[#f8fafc]' : 'bg-[#020202]',
    card: isLight ? 'bg-white border-slate-200 shadow-lg' : 'bg-[#080808] border-white/5 shadow-2xl',
    text: isLight ? 'text-slate-900' : 'text-white',
    textMuted: isLight ? 'text-slate-500' : 'text-neutral-600',
    border: isLight ? 'border-slate-200' : 'border-white/5',
    input: isLight ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-[#080808] border-white/5 text-white',
    innerBg: isLight ? 'bg-slate-50' : 'bg-black'
  };

  return (
    <div className={`flex flex-col h-screen w-full ${colors.bg} ${colors.text} overflow-hidden font-sans tracking-tight transition-colors duration-500`}>
      
      {/* VISTA: LISTA DE CLIENTES (REORG SQUARE) */}
      {viewState === 'client-list' && (
        <div className="p-10 space-y-10 overflow-y-auto mac-scrollbar h-full max-w-[1800px] mx-auto w-full animate-in fade-in duration-700">
          <header className="flex justify-between items-end pb-8 border-b border-white/5">
            <div>
              <p className={`text-[10px] ${isLight ? 'text-slate-400' : 'text-[#10b981]'} font-black uppercase tracking-[0.5em] mb-3 flex items-center gap-2`}>
                <Sparkles size={12}/> Sovereign OS • Talent Hub
              </p>
              <h2 className={`text-6xl font-black ${colors.text} tracking-tighter uppercase leading-none`}>Identificar <span className={isLight ? 'text-slate-200' : 'text-neutral-900'}>Talento</span></h2>
            </div>
            <button onClick={() => setIsClientModalOpen(true)} className="px-10 py-5 bg-[#10b981] text-white rounded-[2rem] font-black text-[11px] uppercase tracking-widest hover:scale-105 transition-all flex items-center gap-3 shadow-xl active:scale-95">
              <Plus size={18} strokeWidth={3}/> Reclutar Talento
            </button>
          </header>

          <div className="relative group">
            <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-neutral-800" size={24}/>
            <input type="text" value={clientSearch} onChange={e=>setClientSearch(e.target.value)} placeholder="Escanear base de datos..." className={`w-full ${colors.input} rounded-[2.5rem] py-7 pl-20 pr-8 text-xl outline-none focus:border-[#10b981]/30 transition-all font-bold`} />
          </div>

          <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {filteredClients.map(client => (
              <div key={client.id} onClick={() => openClientProfile(client)} className={`${colors.card} rounded-[3rem] aspect-square p-8 hover:bg-white/[0.02] cursor-pointer transition-all flex flex-col items-center justify-center group active:scale-95 relative overflow-hidden border-b-2 border-b-transparent hover:border-b-[#10b981] hover:-translate-y-2`}>
                
                {/* HUD FLOTANTE (ACCIONES RÁPIDAS) */}
                <div className="absolute top-6 left-1/2 -translate-x-1/2 flex gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0 z-20">
                   <button onClick={(e) => { e.stopPropagation(); window.location.href=`mailto:${client.email}`; }} className="w-10 h-10 bg-white text-black rounded-full flex items-center justify-center shadow-2xl hover:bg-[#10b981] hover:text-white transition-all"><MailIcon size={18}/></button>
                   <button onClick={(e) => { e.stopPropagation(); setNewClient(client); setIsClientModalOpen(true); }} className="w-10 h-10 bg-white text-black rounded-full flex items-center justify-center shadow-2xl hover:bg-blue-500 hover:text-white transition-all"><Edit3 size={18}/></button>
                   <button onClick={(e) => handleDeleteClient(client.id, e)} className="w-10 h-10 bg-white text-rose-600 rounded-full flex items-center justify-center shadow-2xl hover:bg-rose-600 hover:text-white transition-all"><Trash2 size={18}/></button>
                </div>

                {/* IMAGEN CENTRAL */}
                <div className="w-32 h-32 rounded-full bg-white/5 flex items-center justify-center border border-white/5 shadow-2xl overflow-hidden mb-6 group-hover:scale-105 transition-all relative z-10">
                  {client.foto_url ? <img src={client.foto_url} className="w-full h-full object-cover" alt="" /> : <UserIcon size={48} className={isLight ? 'text-slate-200' : 'text-neutral-900'} />}
                </div>

                <div className="text-center relative z-10">
                  <h4 className={`text-xl font-black ${colors.text} uppercase tracking-tighter leading-none mb-2`}>{client.nombre}</h4>
                  <p className={`text-[9px] ${colors.textMuted} font-black uppercase tracking-[0.3em] flex items-center justify-center gap-2`}><Globe size={10}/> {client.pais || 'Global'}</p>
                </div>

                {/* ESTATUS MANUAL (ACTIVO/AUSENTE) */}
                <button onClick={(e) => toggleClientStatus(client, e)} className={`mt-6 px-4 py-2 rounded-full text-[8px] font-black uppercase tracking-widest transition-all ${client.status === 'Activo' ? 'bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/30' : 'bg-rose-500/10 text-rose-500 border border-rose-500/30'}`}>
                   {client.status || 'Activo'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VISTA: PERFIL CLIENTE */}
      {viewState === 'client-profile' && activeClient && (
        <div className="h-full flex flex-col overflow-hidden animate-in slide-in-from-right duration-500">
          <header className={`px-10 py-6 ${colors.card} border-b flex items-center justify-between relative z-10`}>
            <div className="flex items-center gap-6">
              <button onClick={() => setViewState('client-list')} className={`w-12 h-12 ${isLight ? 'bg-slate-100' : 'bg-white/5'} rounded-2xl flex items-center justify-center text-neutral-600 hover:text-[#10b981] transition-all`}><ArrowLeft size={24}/></button>
              <div>
                <h3 className={`text-3xl font-black ${colors.text} uppercase tracking-tighter leading-none mb-1`}>{activeClient.nombre}</h3>
                <p className={`text-[10px] ${colors.textMuted} font-black uppercase tracking-[0.2em]`}>{activeClient.pais || 'Global'}</p>
              </div>
            </div>
            <button onClick={createMeeting} className="px-8 py-4 bg-[#10b981] text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:scale-105 transition-all flex items-center gap-3">
              <Plus size={18} strokeWidth={3}/> Nueva Sesión
            </button>
          </header>
          <div className="flex-1 overflow-y-auto mac-scrollbar p-8 space-y-6 max-w-[1600px] mx-auto w-full">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className={`${colors.card} rounded-[2rem] p-6 flex items-center gap-6 border-l-4 border-l-amber-500`}>
                     <div className="w-14 h-14 rounded-2xl bg-amber-500/5 flex items-center justify-center text-amber-500"><Clock size={28}/></div>
                     <div><p className={`text-[10px] ${colors.textMuted} font-black mb-1 uppercase`}>Inversión</p><h5 className={`text-2xl font-black ${colors.text} font-mono leading-none`}>{formatTime(totalTimeWorked)}</h5></div>
                  </div>
                  <div className={`${colors.card} rounded-[2rem] p-6 flex items-center gap-6 border-l-4 border-l-blue-500`}>
                     <div className="w-14 h-14 rounded-2xl bg-blue-500/5 flex items-center justify-center text-blue-500"><Layers size={28}/></div>
                     <div><p className={`text-[10px] ${colors.textMuted} font-black mb-1 uppercase`}>Sesiones</p><h5 className={`text-2xl font-black ${colors.text}`}>{meetingsList.length} <span className={isLight ? 'text-slate-300' : 'text-neutral-800'}>Items</span></h5></div>
                  </div>
               </div>
               <div className="relative">
                  <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-neutral-800" size={20}/>
                  <input type="text" value={meetingSearch} onChange={e=>setMeetingSearch(e.target.value)} placeholder="Filtrar sesiones..." className={`w-full ${colors.input} rounded-2xl py-4 pl-16 pr-6 text-base font-medium outline-none focus:border-[#10b981]/30 transition-all`} />
               </div>
               <div className="grid gap-3">
                  {filteredMeetings.map(m => (
                    <div key={m.id} onClick={() => openMeeting(m)} className={`${colors.card} rounded-[2rem] p-6 hover:bg-white/[0.02] cursor-pointer transition-all flex items-center justify-between group active:scale-[0.99] border-r-4 border-r-transparent hover:border-r-[#10b981]`}>
                       <div className="flex items-center gap-6">
                          <div className={`w-12 h-12 rounded-2xl ${isLight ? 'bg-slate-100' : 'bg-white/5'} flex items-center justify-center text-neutral-900 group-hover:text-[#10b981] transition-all`}><PlayCircle size={24}/></div>
                          <div>
                            <div className="flex items-center gap-4 mb-0.5"><p className={`text-lg font-black ${colors.text} uppercase tracking-tighter`}>{m.fecha}</p><span className="px-3 py-1 bg-[#10b981]/10 rounded-lg text-[8px] font-black text-[#10b981] uppercase tracking-widest">{m.revision_version || 'V1'}</span></div>
                            <p className={`text-[11px] ${colors.textMuted} font-bold uppercase tracking-widest`}>{m.session_title || 'Edición de Video'}</p>
                          </div>
                       </div>
                       <div className="flex items-center gap-8">
                          <p className={`text-xl font-black ${colors.text} font-mono leading-none`}>{formatTime(m.total_time || 0)}</p>
                          <ChevronRight size={20} className="text-neutral-800 group-hover:text-[#10b981] transition-all" />
                       </div>
                    </div>
                  ))}
               </div>
          </div>
        </div>
      )}

      {/* VISTA: WAR ROOM / EDITOR (EMERALD DUAL MODE) */}
      {viewState === 'session' && activeMeeting && (
        <div className={`flex-1 flex flex-col overflow-hidden ${colors.bg} animate-in fade-in duration-500`}>
          <header className={`px-6 py-4 border-b ${colors.card} flex items-center justify-between shrink-0 relative z-50`}>
            <div className="flex items-center gap-6">
              <button onClick={saveMeeting} className={`w-10 h-10 ${isLight ? 'bg-slate-100' : 'bg-white/5'} rounded-xl flex items-center justify-center text-neutral-600 hover:text-[#10b981] transition-all`}><ArrowLeft size={20}/></button>
              <div>
                <div className="flex items-center gap-3">
                   <h3 className={`text-lg font-black ${colors.text} uppercase tracking-tighter leading-none`}>{activeClient?.nombre}</h3>
                   <span className="text-neutral-800 text-xl font-thin">/</span>
                   <input type="text" value={activeMeeting.session_title} onChange={e=>setActiveMeeting({...activeMeeting, session_title: e.target.value})} className={`bg-transparent text-lg font-black text-[#10b981] uppercase tracking-tighter outline-none w-auto min-w-[150px]`} />
                </div>
                <p className={`text-[8px] ${colors.textMuted} font-black uppercase tracking-[0.4em] mt-1`}>Sovereign Obsidian • Professional Edition</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
               <div className={`flex items-center gap-4 ${colors.innerBg} border ${colors.border} rounded-xl px-5 py-2 shadow-2xl`}>
                  <p className={`text-xl font-mono font-black ${colors.text} leading-none`}>{formatTime(time)}</p>
                  <button onClick={() => setIsTimerRunning(!isTimerRunning)} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${isTimerRunning ? 'bg-[#10b981] text-white shadow-lg' : 'bg-white text-black'}`}>
                    {isTimerRunning ? <Pause size={14} strokeWidth={3}/> : <Play size={14} strokeWidth={3} fill="currentColor"/>}
                  </button>
               </div>
               <button onClick={saveMeeting} className="px-6 py-3 bg-white text-black text-[10px] font-black rounded-xl uppercase tracking-widest hover:bg-[#10b981] hover:text-white transition-all shadow-xl">
                <Save size={16} strokeWidth={3}/> Guardar
              </button>
            </div>
          </header>

          <div className="flex-1 flex p-4 gap-4 overflow-hidden max-w-[1800px] mx-auto w-full">
            <div className="w-[300px] h-full shrink-0 flex flex-col space-y-4 overflow-y-auto mac-scrollbar pr-2">
               {/* CALCULADORA */}
               <div className={`${colors.card} rounded-[1.5rem] p-5 relative shadow-xl`}>
                  <div className="flex items-center justify-between mb-4">
                    <p className={`text-[10px] ${colors.textMuted} font-black uppercase tracking-[0.2em] flex items-center gap-2`}><CalcIcon size={14} className="text-[#10b981]"/> Business HUD</p>
                    <button onClick={()=>setCalcDisplay('0')} className="text-neutral-500 hover:text-[#10b981]"><RefreshCw size={12}/></button>
                  </div>
                  <div className={`${colors.innerBg} border ${colors.border} rounded-xl p-4 text-right text-3xl font-mono font-black ${colors.text} mb-4 shadow-inner truncate`}>
                    {calcDisplay}
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {['C','DEL','%','/','7','8','9','*','4','5','6','-','1','2','3','+','0','.','=','+'].slice(0,19).map(btn => (
                      <button key={btn} onClick={() => handleCalc(btn === 'C' ? 'C' : btn)} className={`h-11 rounded-lg text-[11px] font-black transition-all ${btn === '=' ? 'bg-[#10b981] text-white col-span-2' : isLight ? 'bg-slate-100 text-slate-600' : 'bg-white/5 text-neutral-600'} hover:scale-105`}>{btn}</button>
                    ))}
                    <button onClick={()=>handleCalc('=')} className="h-11 rounded-lg text-[11px] font-black bg-[#10b981] text-white transition-all col-span-2 shadow-lg">=</button>
                  </div>
               </div>

               {/* PIPELINE STATUS */}
               <div className={`${colors.card} rounded-[1.5rem] p-5 shadow-xl`}>
                  <p className={`text-[10px] ${colors.textMuted} font-black uppercase tracking-[0.2em] mb-4 flex items-center gap-2`}><Activity size={14} className="text-[#10b981]"/> Production Pipeline</p>
                  <div className="grid grid-cols-1 gap-2">
                    {(activeMeeting.pipeline || []).map(step => (
                      <button key={step.id} onClick={() => setActiveMeeting({...activeMeeting, pipeline: activeMeeting.pipeline.map(s => s.id === step.id ? {...s, done: !s.done} : s)})} className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all ${step.done ? 'bg-[#10b981]/10 border-[#10b981]/30 text-[#10b981]' : isLight ? 'bg-slate-100 border-slate-200 text-slate-400' : 'bg-white/5 border-white/5 text-neutral-800'}`}>
                        <div className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 ${step.done ? 'bg-[#10b981] text-black shadow-lg' : 'bg-white/5 border border-white/10'}`}>{step.done && <Check size={12} strokeWidth={4}/>}</div>
                        <span className="text-[9px] font-black uppercase tracking-widest truncate flex-1 text-left">{step.label}</span>
                      </button>
                    ))}
                  </div>
               </div>
            </div>

            <div className={`flex-1 flex flex-col ${colors.card} rounded-[2rem] overflow-hidden shadow-2xl relative`}>
               <div className={`flex items-center justify-between px-8 py-4 ${isLight ? 'bg-slate-50' : 'bg-[#080808]'} border-b shrink-0`}>
                  <div className="flex bg-black/20 rounded-xl p-1 border border-white/5">
                     {['editor', 'drive', 'calendar', 'mood', 'brand', 'tasks'].map(tab => (
                        <button key={tab} onClick={()=>setSessionTab(tab)} className={`px-4 py-2 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${sessionTab === tab ? 'bg-[#10b981] text-white shadow-lg' : isLight ? 'text-slate-400 hover:text-slate-900' : 'text-neutral-700 hover:text-white'}`}>
                          {tab.toUpperCase()}
                        </button>
                     ))}
                  </div>
               </div>

               <div className={`flex-1 relative overflow-hidden ${isLight ? 'bg-white' : 'bg-[#050505]'}`}>
                  {sessionTab === 'editor' && (
                    <div className="w-full h-full relative animate-in fade-in duration-500">
                        <div ref={editorRef} contentEditable="true" suppressContentEditableWarning={true} className={`w-full h-full p-12 ${isLight ? 'text-slate-900' : 'text-white'} font-medium text-lg leading-relaxed editor-container outline-none mac-scrollbar overflow-y-auto max-w-[1000px] mx-auto`} dangerouslySetInnerHTML={{ __html: activeMeeting.contenido || '<p><br></p>' }} onBlur={() => setActiveMeeting({...activeMeeting, contenido: editorRef.current.innerHTML})} />
                        <button onMouseDown={(e) => { e.preventDefault(); setShowAIModal(true); }} className="absolute bottom-8 right-8 w-14 h-14 bg-[#10b981] text-white rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 group">
                           <Sparkles size={24} className="group-hover:animate-pulse" />
                        </button>
                    </div>
                  )}
                  {sessionTab === 'drive' && <div className="w-full h-full p-8"><p className="text-center text-neutral-500 py-20 uppercase font-black tracking-widest">Google Drive Link Active</p></div>}
                  {sessionTab === 'calendar' && <div className="w-full h-full p-8"><p className="text-center text-neutral-500 py-20 uppercase font-black tracking-widest">Google Calendar Link Active</p></div>}
               </div>
            </div>
          </div>
        </div>
      )}

      {/* MODALES */}
      {isClientModalOpen && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center bg-black/95 backdrop-blur-2xl p-8 animate-in zoom-in duration-300">
           <div className={`${colors.card} border-t-4 border-t-[#10b981] rounded-[3rem] w-full max-w-xl p-12 space-y-8 shadow-2xl`}>
                <h3 className={`text-3xl font-black ${colors.text} uppercase tracking-tighter leading-none`}>Sovereign <span className="text-[#10b981]">Nexus</span></h3>
                <div className="space-y-4">
                  <input type="text" value={newClient.nombre} onChange={e=>setNewClient({...newClient, nombre: e.target.value})} placeholder="Nombre completo..." className={`w-full ${colors.input} rounded-2xl p-6 text-lg outline-none focus:border-[#10b981]/30`} />
                  <input type="email" value={newClient.email} onChange={e=>setNewClient({...newClient, email: e.target.value})} placeholder="Email corporativo..." className={`w-full ${colors.input} rounded-2xl p-6 text-lg outline-none focus:border-[#10b981]/30`} />
                  <input type="text" value={newClient.pais} onChange={e=>setNewClient({...newClient, pais: e.target.value})} placeholder="País/Región..." className={`w-full ${colors.input} rounded-2xl p-6 text-lg outline-none focus:border-[#10b981]/30`} />
                </div>
                <div className="flex gap-4">
                   <button onClick={() => setIsClientModalOpen(false)} className={`flex-1 py-6 ${colors.textMuted} font-black uppercase text-[10px] tracking-widest hover:text-white`}>Descartar</button>
                   <button onClick={handleCreateClient} className="flex-[2] py-6 bg-[#10b981] text-white rounded-2xl font-black uppercase text-[10px] tracking-widest active:scale-95 transition-all shadow-lg">Guardar Perfil</button>
                </div>
           </div>
        </div>
      )}
    </div>
  );
};
export default MeetingStudio;
