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
  AlignLeft, AlignCenter, AlignRight, ListOrdered, ClipboardList, Briefcase
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import GoogleTasks from '../components/GoogleTasks';
import { getDriveFiles, getCalendarEvents, getCalendarList, uploadFileToDrive, downloadDriveFile, deleteDriveFile, createCalendarEvent } from '../lib/googleApi';
import { aiService } from '../services/aiService';

const MeetingStudio = ({ meetingsList = [], setMeetingsList, settings = {}, token }) => {
  const [viewState, setViewState] = useState('client-list'); 
  const [activeClient, setActiveClient] = useState(null);
  const [activeMeeting, setActiveMeeting] = useState(null);
  const [sessionTab, setSessionTab] = useState('editor'); // editor, drive, calendar, mood, brand
  
  const [clients, setClients] = useState([]);
  const [clientSearch, setClientSearch] = useState('');
  const [meetingSearch, setMeetingSearch] = useState(''); 
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [driveFiles, setDriveFiles] = useState([]);
  const [driveLoading, setDriveLoading] = useState(false);
  const [sessionFolder, setSessionFolder] = useState({ id: 'root', name: 'Mi Unidad' });

  // GOOGLE CALENDAR & TASKS
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [currentCalDate, setCurrentCalDate] = useState(new Date());
  const [isCalModalOpen, setIsCalModalOpen] = useState(false);
  const [calTitle, setCalTitle] = useState('');
  const [calDate, setCalDate] = useState(new Date().toISOString().split('T')[0]);
  const [calStart, setCalStart] = useState('10:00');
  const [calEnd, setCalEnd] = useState('11:00');
  const [calDesc, setCalDesc] = useState('');
  
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [time, setTime] = useState(0);
  const [rates, setRates] = useState({ USDT_BOB: 10.80, USD_BOB: 6.96, BRL: 1.38 }); 
  
  const [calcDisplay, setCalcDisplay] = useState('0');
  const editorRef = useRef(null);
  const timerRef = useRef(null);
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const [newClient, setNewClient] = useState({
    nombre: '', nombre_completo: '', identidad: '', email: '', telefono: '', 
    pais: '', empresa: '', metodo_pago_preferido: 'QR', link_brutos: '', foto_url: '', 
    redes: { instagram: '', youtube: '', twitter: '', tiktok: '' }
  });

  useEffect(() => { fetchClients(); fetchExchangeRates(); }, []);

  const fetchExchangeRates = async () => {
    try {
      const response = await fetch('https://open.er-api.com/v6/latest/USD');
      const data = await response.json();
      if (data?.rates?.BOB) setRates(prev => ({ ...prev, USDT_BOB: data.rates.BOB || 10.80, USD_BOB: 6.96, BRL: (data.rates.BOB / data.rates.BRL).toFixed(2) || 1.38 }));
    } catch (e) { console.error(e); }
  };

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
      const results = await getCalendarEvents(token, 'primary', currentCalDate.getFullYear(), currentCalDate.getMonth());
      setCalendarEvents(results || []);
    } catch (e) { console.error(e); }
    setCalendarLoading(false);
  };

  const handleCreateSessionEvent = async (e) => {
    if (e) e.preventDefault();
    if (!calTitle || !token) return;
    setCalendarLoading(true);
    try {
      const eventData = {
        summary: calTitle,
        description: calDesc,
        start: { dateTime: `${calDate}T${calStart}:00Z`, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
        end: { dateTime: `${calDate}T${calEnd}:00Z`, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
      };
      await createCalendarEvent(token, eventData, 'primary');
      setIsCalModalOpen(false);
      setCalTitle('');
      loadCalendarEvents();
    } catch (error) { alert(error.message); } finally { setCalendarLoading(false); }
  };

  useEffect(() => {
    if (viewState === 'session') {
      if (sessionTab === 'drive') fetchDriveFiles();
      if (sessionTab === 'calendar') loadCalendarEvents();
    }
  }, [sessionTab, viewState]);

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
      mood: meeting.mood || 'Cinematic',
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
      contenido: '<p><br></p>', total_time: 0, priority: 'Baja', revision_version: 'V1', mood: 'Cinematic'
    };
    try { await supabase.from('reuniones').insert(newMeeting); await fetchMeetings(activeClient.id); openMeeting(newMeeting); } catch (error) { alert(error.message); }
  };

  const deleteMeeting = async (id, e) => {
    e.stopPropagation();
    if (!confirm('¿Eliminar esta sesión?')) return;
    try { await supabase.from('reuniones').delete().eq('id', id); await fetchMeetings(activeClient.id); } catch (error) { alert(error.message); }
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
  const applyHighlight = (colorHex, e) => { if (e) e.preventDefault(); document.execCommand('hiliteColor', false, colorHex); };
  
  const insertTag = (e, tagName, colorBg, colorText, colorBorder) => {
    if (e) e.preventDefault();
    const html = `<span contenteditable="false" style="background-color: ${colorBg}; color: ${colorText}; border: 1px solid ${colorBorder}; padding: 2px 6px; border-radius: 8px; font-size: 9px; font-weight: 800; text-transform: uppercase; margin: 0 3px; display: inline-flex; align-items: center; justify-content: center; vertical-align: middle; letter-spacing: 0.02em;">${tagName}</span>&nbsp;`;
    document.execCommand('insertHTML', false, html);
    editorRef.current.focus();
  };

  const EDITOR_TAGS = [
    { name: 'Guion', bg: 'rgba(59, 130, 246, 0.05)', text: '#60a5fa', border: 'rgba(59, 130, 246, 0.2)' },
    { name: 'Video', bg: 'rgba(239, 68, 68, 0.05)', text: '#f87171', border: 'rgba(239, 68, 68, 0.2)' },
    { name: 'Audio', bg: 'rgba(16, 185, 129, 0.05)', text: '#10b981', border: 'rgba(16, 185, 129, 0.2)' },
    { name: 'FX', bg: 'rgba(245, 158, 11, 0.05)', text: '#f59e0b', border: 'rgba(245, 158, 11, 0.2)' },
    { name: 'Render', bg: 'rgba(99, 102, 241, 0.05)', text: '#6366f1', border: 'rgba(99, 102, 241, 0.2)' },
    { name: 'Story', bg: 'rgba(236, 72, 153, 0.05)', text: '#ec4899', border: 'rgba(236, 72, 153, 0.2)' },
    { name: 'IA', bg: 'rgba(168, 85, 247, 0.05)', text: '#c084fc', border: 'rgba(168, 85, 247, 0.2)' }
  ];

  const handleAISuggestion = async () => {
    if (!aiPrompt) return;
    setAiLoading(true);
    try {
      const suggestion = await aiService.generateScript(aiPrompt, editorRef.current.innerHTML, activeMeeting.mood || 'Profesional');
      document.execCommand('insertHTML', false, suggestion.replace(/\n/g, '<br>') + '<br>');
      setShowAIModal(false);
      setAiPrompt('');
    } catch (e) { alert(e.message); }
    setAiLoading(false);
  };

  const filteredClients = (clients || []).filter(c => normalizeText(c.nombre).includes(normalizeText(clientSearch)) || normalizeText(c.empresa).includes(normalizeText(clientSearch)));
  const filteredMeetings = useMemo(() => (meetingsList || []).filter(m => normalizeText(m.fecha).includes(normalizeText(meetingSearch)) || normalizeText(m.session_title).includes(normalizeText(meetingSearch))), [meetingsList, meetingSearch]);
  const totalTimeWorked = useMemo(() => (meetingsList || []).reduce((acc, curr) => acc + (curr.total_time || 0), 0), [meetingsList]);

  return (
    <div className="flex flex-col h-screen w-full bg-[#020202] text-white overflow-hidden font-sans tracking-tight">
      
      {/* VISTAS PRINCIPALES */}
      {viewState === 'client-list' && (
        <div className="p-8 space-y-8 overflow-y-auto mac-scrollbar h-full max-w-[1600px] mx-auto w-full">
           <header className="flex justify-between items-center pb-8 border-b border-white/5">
            <div>
              <p className="text-[10px] text-neutral-600 font-black uppercase tracking-[0.4em] mb-2">Sovereign OS • Intelligence</p>
              <h2 className="text-5xl font-black text-white tracking-tighter uppercase leading-none">Editor <span className="text-neutral-900">Pro</span></h2>
            </div>
            <button onClick={() => setIsClientModalOpen(true)} className="px-8 py-3.5 bg-white text-black rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-[#10b981] hover:text-white transition-all flex items-center gap-3 shadow-xl">
              <Plus size={16} strokeWidth={3}/> Nuevo Cliente
            </button>
          </header>
          <div className="relative group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-neutral-800 group-focus-within:text-[#10b981] transition-colors" size={20}/>
            <input type="text" value={clientSearch} onChange={e=>setClientSearch(e.target.value)} placeholder="Identificar talento..." className="w-full bg-[#080808] border border-white/5 rounded-2xl py-5 pl-16 pr-6 text-base text-white outline-none focus:border-[#10b981]/30 transition-all font-medium" />
          </div>
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
            {filteredClients.map(client => (
              <div key={client.id} onClick={() => openClientProfile(client)} className="bg-[#080808] border border-white/5 rounded-[2.5rem] p-8 hover:bg-white/[0.02] cursor-pointer transition-all flex flex-col items-center group active:scale-95 border-b-2 border-b-transparent hover:border-b-[#10b981]">
                <div className="w-24 h-24 mb-6 rounded-3xl bg-white/5 flex items-center justify-center border border-white/5 shadow-inner overflow-hidden">
                  {client.foto_url ? <img src={client.foto_url} className="w-full h-full object-cover" alt="" /> : <UserIcon size={36} className="text-neutral-900" />}
                </div>
                <h4 className="text-lg font-black text-white uppercase tracking-tighter mb-1 leading-none">{client.nombre}</h4>
                <p className="text-[9px] text-neutral-600 font-black uppercase tracking-[0.2em]">{client.pais || 'Global'}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {viewState === 'client-profile' && activeClient && (
        <div className="h-full flex flex-col overflow-hidden bg-black">
          <header className="px-10 py-6 bg-[#080808] border-b border-white/5 flex items-center justify-between relative z-10">
            <div className="flex items-center gap-6">
              <button onClick={() => setViewState('client-list')} className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-neutral-600 hover:text-[#10b981] transition-all"><ArrowLeft size={24}/></button>
              <div>
                <h3 className="text-3xl font-black text-white uppercase tracking-tighter leading-none mb-1">{activeClient.nombre}</h3>
                <p className="text-[10px] text-neutral-600 font-black uppercase tracking-[0.2em]"><Globe size={12} className="inline mr-1"/> {activeClient.pais || 'Global'}</p>
              </div>
            </div>
            <button onClick={createMeeting} className="px-8 py-4 bg-white text-black rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-[#10b981] hover:text-white transition-all flex items-center gap-3">
              <Plus size={18} strokeWidth={3}/> Nueva Sesión
            </button>
          </header>
          <div className="flex-1 overflow-y-auto mac-scrollbar p-8 space-y-6 max-w-[1600px] mx-auto w-full">
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-[#080808] border border-white/5 rounded-[2rem] p-6 flex items-center gap-6 border-l-2 border-l-amber-500/20 shadow-xl">
                     <div className="w-14 h-14 rounded-2xl bg-amber-500/5 flex items-center justify-center text-amber-500"><Clock size={28}/></div>
                     <div><p className="text-[10px] text-neutral-600 font-black mb-1">Inversión</p><h5 className="text-2xl font-black text-white font-mono leading-none">{formatTime(totalTimeWorked)}</h5></div>
                  </div>
                  <div className="bg-[#080808] border border-white/5 rounded-[2rem] p-6 flex items-center gap-6 border-l-2 border-l-blue-500/20 shadow-xl">
                     <div className="w-14 h-14 rounded-2xl bg-blue-500/5 flex items-center justify-center text-blue-500"><Layers size={28}/></div>
                     <div><p className="text-[10px] text-neutral-600 font-black mb-1">Sesiones</p><h5 className="text-2xl font-black text-white">{meetingsList.length} <span className="text-neutral-800 font-bold">Items</span></h5></div>
                  </div>
                  <div className="bg-[#080808] border border-white/5 rounded-[2rem] p-6 flex items-center gap-6 border-l-2 border-l-[#10b981]/20 shadow-xl">
                     <div className="w-14 h-14 rounded-2xl bg-[#10b981]/5 flex items-center justify-center text-[#10b981]"><TrendingUp size={28}/></div>
                     <div><p className="text-[10px] text-neutral-600 font-black mb-1">Actividad</p><h5 className="text-2xl font-black text-white">{meetingsList[0]?.fecha || 'N/A'}</h5></div>
                  </div>
               </div>
               <div className="relative">
                  <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-neutral-800" size={20}/>
                  <input type="text" value={meetingSearch} onChange={e=>setMeetingSearch(e.target.value)} placeholder="Filtrar sesiones..." className="w-full bg-[#080808] border border-white/5 rounded-2xl py-4 pl-16 pr-6 text-base text-white outline-none focus:border-[#10b981]/30 transition-all shadow-xl" />
               </div>
               <div className="grid gap-3">
                  {filteredMeetings.map(m => (
                    <div key={m.id} onClick={() => openMeeting(m)} className="bg-[#080808] border border-white/5 rounded-[2rem] p-6 hover:bg-white/[0.02] cursor-pointer transition-all flex items-center justify-between group shadow-xl active:scale-[0.99] border-r-2 border-r-transparent hover:border-r-[#10b981]">
                       <div className="flex items-center gap-6">
                          <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-neutral-900 group-hover:text-[#10b981] transition-all"><PlayCircle size={24}/></div>
                          <div>
                            <div className="flex items-center gap-4 mb-0.5"><p className="text-lg font-black text-white uppercase tracking-tighter">{m.fecha}</p><span className="px-3 py-1 bg-white/5 rounded-lg text-[8px] font-black text-[#10b981] uppercase tracking-widest">{m.revision_version || 'V1'}</span></div>
                            <p className="text-[11px] text-neutral-600 font-bold uppercase tracking-widest">{m.session_title || 'Edición de Video'}</p>
                          </div>
                       </div>
                       <div className="flex items-center gap-8">
                          <p className="text-xl font-black text-white font-mono leading-none">{formatTime(m.total_time || 0)}</p>
                          <button onClick={(e) => deleteMeeting(m.id, e)} className="p-3 text-neutral-900 hover:text-rose-500 transition-all opacity-0 group-hover:opacity-100"><Trash2 size={20}/></button>
                          <ChevronRight size={20} className="text-neutral-900 group-hover:text-white transition-all" />
                       </div>
                    </div>
                  ))}
               </div>
          </div>
        </div>
      )}

      {/* VISTA: WAR ROOM / EDITOR (RESTAURACIÓN TOTAL) */}
      {viewState === 'session' && activeMeeting && (
        <div className="flex-1 flex flex-col overflow-hidden bg-[#020202] animate-in fade-in duration-500">
          <header className="px-6 py-4 border-b border-white/5 bg-[#080808] flex items-center justify-between shrink-0 relative z-50 shadow-2xl">
            <div className="flex items-center gap-6">
              <button onClick={saveMeeting} className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-neutral-600 hover:text-[#10b981] transition-all"><ArrowLeft size={20}/></button>
              <div>
                <div className="flex items-center gap-3">
                   <h3 className="text-lg font-black text-white uppercase tracking-tighter leading-none">{activeClient?.nombre}</h3>
                   <span className="text-neutral-800 text-xl font-thin">/</span>
                   <input type="text" value={activeMeeting.session_title} onChange={e=>setActiveMeeting({...activeMeeting, session_title: e.target.value})} className="bg-transparent text-lg font-black text-[#10b981] uppercase tracking-tighter outline-none w-auto min-w-[150px]" />
                   <div className="flex bg-white/5 rounded-lg p-0.5 border border-white/10 ml-2">
                     {['V1','V2','V3','FINAL'].map(v => (
                        <button key={v} onClick={()=>setActiveMeeting({...activeMeeting, revision_version: v})} className={`px-3 py-1 rounded text-[8px] font-black uppercase transition-all ${activeMeeting.revision_version === v ? 'bg-[#10b981] text-white shadow-lg' : 'text-neutral-700'}`}>{v}</button>
                     ))}
                   </div>
                </div>
                <p className="text-[8px] text-neutral-700 font-black uppercase tracking-[0.4em] mt-1">Sovereign Obsidian • Professional Edition</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
               <div className="flex items-center gap-4 bg-black border border-white/5 rounded-xl px-5 py-2 shadow-2xl">
                  <p className="text-xl font-mono font-black text-white leading-none">{formatTime(time)}</p>
                  <button onClick={() => setIsTimerRunning(!isTimerRunning)} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${isTimerRunning ? 'bg-[#10b981] text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-white text-black'}`}>
                    {isTimerRunning ? <Pause size={14} strokeWidth={3}/> : <Play size={14} strokeWidth={3} fill="currentColor"/>}
                  </button>
               </div>
               <button onClick={saveMeeting} className="px-6 py-3 bg-white text-black text-[10px] font-black rounded-xl uppercase tracking-widest flex items-center gap-3 active:scale-95 transition-all shadow-xl hover:bg-[#10b981] hover:text-white">
                <Save size={16} strokeWidth={3}/> Finalizar
              </button>
            </div>
          </header>

          <div className="flex-1 flex p-4 gap-4 overflow-hidden max-w-[1800px] mx-auto w-full">
            
            {/* IZQUIERDA: HERRAMIENTAS DINÁMICAS (RESTAURADAS) */}
            <div className="w-[300px] h-full shrink-0 flex flex-col space-y-4 overflow-y-auto mac-scrollbar pr-2">
               
               {/* CALCULADORA HUD */}
               <div className="bg-[#080808] border border-white/5 rounded-[1.5rem] p-5 shadow-2xl relative">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-[10px] text-neutral-700 font-black uppercase tracking-[0.2em] flex items-center gap-2"><CalcIcon size={14} className="text-[#10b981]"/> Business HUD</p>
                    <button onClick={()=>setCalcDisplay('0')} className="text-neutral-800 hover:text-white"><RefreshCw size={12}/></button>
                  </div>
                  <div className="bg-black border border-white/5 rounded-xl p-4 text-right text-3xl font-mono font-black text-white mb-4 shadow-inner truncate">
                    {calcDisplay}
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {['C','DEL','%','/','7','8','9','*','4','5','6','-','1','2','3','+','0','.','=','+'].slice(0,19).map(btn => (
                      <button key={btn} onClick={() => handleCalc(btn === 'C' ? 'C' : btn)} className={`h-11 rounded-lg text-[11px] font-black transition-all ${btn === '=' ? 'bg-[#10b981] text-white col-span-2' : 'bg-white/5 text-neutral-600 hover:bg-white/10 hover:text-white'}`}>{btn}</button>
                    ))}
                    <button onClick={()=>handleCalc('=')} className="h-11 rounded-lg text-[11px] font-black bg-[#10b981] text-white transition-all col-span-2 shadow-[0_5px_15px_rgba(16,185,129,0.3)]">=</button>
                  </div>
               </div>

               {/* OBJETIVOS ESTRATÉGICOS */}
               <div className="bg-[#080808] border border-white/5 rounded-[1.5rem] p-5 shadow-2xl flex-1 flex flex-col min-h-[150px]">
                  <p className="text-[10px] text-neutral-700 font-black uppercase tracking-[0.2em] mb-4 flex items-center gap-2"><Target size={14} className="text-[#10b981]"/> Objectives</p>
                  <textarea 
                    value={activeMeeting.session_objective || ''} 
                    onChange={e=>setActiveMeeting({...activeMeeting, session_objective: e.target.value})} 
                    placeholder="Misión de la sesión..." 
                    className="w-full flex-1 bg-black border border-white/5 rounded-xl p-4 text-sm text-neutral-400 font-medium outline-none resize-none placeholder:text-neutral-900 leading-tight shadow-inner" 
                  />
               </div>

               {/* COBROS / HITOS DE PAGO (RESTAURADO) */}
               <div className="bg-[#080808] border border-white/5 rounded-[1.5rem] p-5 shadow-2xl">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-[10px] text-neutral-700 font-black uppercase tracking-[0.2em] flex items-center gap-2"><DollarSign size={14} className="text-[#10b981]"/> Cobros / Hitos</p>
                    <button onClick={() => setActiveMeeting({...activeMeeting, hitos_pago: [...(activeMeeting.hitos_pago || []), { id: Date.now(), label: 'Hito', paid: false }]})} className="p-1.5 bg-white/5 rounded-lg text-[#10b981] hover:bg-white/10 transition-all"><Plus size={14}/></button>
                  </div>
                  <div className="space-y-2">
                    {(activeMeeting.hitos_pago || []).map(h => (
                      <div key={h.id} className="flex gap-2 items-center">
                        <input type="text" value={h.label} onChange={(e) => setActiveMeeting({...activeMeeting, hitos_pago: activeMeeting.hitos_pago.map(item => item.id === h.id ? {...item, label: e.target.value} : item)})} className={`flex-1 bg-transparent border border-white/5 rounded-lg px-3 py-1.5 text-[9px] font-bold uppercase outline-none focus:border-[#10b981]/30 transition-all ${h.paid ? 'text-[#10b981]' : 'text-neutral-600'}`} />
                        <button onClick={() => setActiveMeeting({...activeMeeting, hitos_pago: activeMeeting.hitos_pago.map(item => item.id === h.id ? {...item, paid: !item.paid} : item)})} className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all border ${h.paid ? 'bg-[#10b981]/10 border-[#10b981]/30 text-[#10b981]' : 'bg-white/5 border-white/5 text-neutral-900'}`}>{h.paid && <Check size={14} strokeWidth={4}/>}</button>
                      </div>
                    ))}
                  </div>
               </div>

               {/* PIPELINE STATUS (RESTAURADO) */}
               <div className="bg-[#080808] border border-white/5 rounded-[1.5rem] p-5 shadow-2xl">
                  <p className="text-[10px] text-neutral-700 font-black uppercase tracking-[0.2em] mb-4 flex items-center gap-2"><Activity size={14} className="text-[#10b981]"/> Production Pipeline</p>
                  <div className="grid grid-cols-1 gap-2">
                    {(activeMeeting.pipeline || []).map(step => (
                      <button key={step.id} onClick={() => setActiveMeeting({...activeMeeting, pipeline: activeMeeting.pipeline.map(s => s.id === step.id ? {...s, done: !s.done} : s)})} className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all ${step.done ? 'bg-[#10b981]/10 border-[#10b981]/30 text-[#10b981]' : 'bg-white/5 border-white/5 text-neutral-800'}`}>
                        <div className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 ${step.done ? 'bg-[#10b981] text-black shadow-lg' : 'bg-white/5 border border-white/10'}`}>{step.done && <Check size={12} strokeWidth={4}/>}</div>
                        <span className="text-[9px] font-black uppercase tracking-widest truncate flex-1 text-left">{step.label}</span>
                      </button>
                    ))}
                  </div>
               </div>

               {/* DEADLINES (RESTAURADO) */}
               <div className="bg-[#080808] border border-white/5 rounded-[1.5rem] p-5 shadow-2xl">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-[10px] text-neutral-700 font-black uppercase tracking-[0.2em] flex items-center gap-2"><Timer size={14} className="text-[#10b981]"/> Deadlines</p>
                    <button onClick={() => setActiveMeeting({...activeMeeting, deadlines: [...(activeMeeting.deadlines || []), { id: Date.now(), label: 'Entrega', date: '' }]})} className="p-1.5 bg-white/5 rounded-lg text-[#10b981] hover:bg-white/10 transition-all"><Plus size={14}/></button>
                  </div>
                  <div className="space-y-2">
                    {(activeMeeting.deadlines || []).map(d => (
                      <div key={d.id} className="flex gap-2 items-center">
                        <input type="text" value={d.label} onChange={(e) => setActiveMeeting({...activeMeeting, deadlines: activeMeeting.deadlines.map(item => item.id === d.id ? {...item, label: e.target.value} : item)})} className="flex-1 bg-transparent border border-white/5 rounded-lg px-3 py-1.5 text-[9px] font-bold uppercase text-white outline-none focus:border-[#10b981]/30" />
                        <input type="date" value={d.date} onChange={(e) => setActiveMeeting({...activeMeeting, deadlines: activeMeeting.deadlines.map(item => item.id === d.id ? {...item, date: e.target.value} : item)})} className="w-20 bg-black border border-white/5 rounded-lg px-2 py-1 text-[8px] text-neutral-500 outline-none" />
                      </div>
                    ))}
                  </div>
               </div>

            </div>

            {/* DERECHA: EDITOR / DRIVE / CALENDAR / MOOD / BRAND (PESTAÑAS RESTAURADAS) */}
            <div className="flex-1 flex flex-col bg-black border border-white/5 rounded-[2rem] overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.5)] relative">
               
               {/* TABS NAVEGACIÓN EXTENDIDA */}
               <div className="flex items-center justify-between px-8 py-4 bg-[#080808] border-b border-white/5 shrink-0 shadow-2xl">
                  <div className="flex items-center gap-4">
                     <div className="flex items-center gap-1 pr-4 border-r border-white/10">
                        <button onMouseDown={(e) => formatText('bold', null, e)} className="p-2 text-neutral-600 hover:text-[#10b981] rounded-lg transition-all"><Bold size={16}/></button>
                        <button onMouseDown={(e) => formatText('insertUnorderedList', null, e)} className="p-2 text-neutral-600 hover:text-[#10b981] rounded-lg transition-all"><List size={16}/></button>
                        <button onMouseDown={(e) => { e.preventDefault(); document.execCommand('insertHTML', false, '<div style="display:flex; align-items:center; gap:8px; margin: 4px 0;"><input type="checkbox" style="width:16px; height:16px; cursor:pointer;" /> <span contenteditable="true" style="outline:none;">Tarea...</span></div>'); }} className="p-2 text-neutral-600 hover:text-[#10b981] rounded-lg transition-all"><CheckSquare size={16}/></button>
                     </div>
                     <div className="flex items-center gap-2">
                        <button onMouseDown={(e) => applyHighlight('#ef4444', e)} className="w-5 h-5 rounded-full bg-red-500 border border-white/10 shadow-[0_0_10px_rgba(239,68,68,0.3)]"></button>
                        <button onMouseDown={(e) => applyHighlight('#3b82f6', e)} className="w-5 h-5 rounded-full bg-blue-500 border border-white/10 shadow-[0_0_10px_rgba(59,130,246,0.3)]"></button>
                        <button onMouseDown={(e) => applyHighlight('#fbbf24', e)} className="w-5 h-5 rounded-full bg-amber-400 border border-white/10 shadow-[0_0_10px_rgba(251,191,36,0.3)]"></button>
                     </div>
                  </div>

                  <div className="flex bg-black/50 rounded-xl p-1 border border-white/5 shadow-inner">
                     {[
                       { id: 'editor', icon: <FileText size={12}/>, label: 'Editor' },
                       { id: 'drive', icon: <HardDrive size={12}/>, label: 'Drive' },
                       { id: 'calendar', icon: <Calendar size={12}/>, label: 'Agenda' },
                       { id: 'mood', icon: <Palette size={12}/>, label: 'Mood' },
                       { id: 'brand', icon: <Briefcase size={12}/>, label: 'Brand' },
                       { id: 'tasks', icon: <ClipboardList size={12}/>, label: 'Tasks' }
                     ].map(tab => (
                        <button key={tab.id} onClick={()=>setSessionTab(tab.id)} className={`px-4 py-2 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${sessionTab === tab.id ? 'bg-white text-black shadow-lg' : 'text-neutral-700 hover:text-white'}`}>
                          {tab.icon} {tab.label}
                        </button>
                     ))}
                  </div>
               </div>

               {/* TAGS (DENSOS) */}
               <div className="px-8 py-3 flex items-center gap-2 overflow-x-auto no-scrollbar bg-black/40 border-b border-white/5">
                  <p className="text-[8px] text-neutral-800 font-black uppercase tracking-[0.4em] mr-2 shrink-0">Tags Rápidos</p>
                  {EDITOR_TAGS.map(tag => (
                     <button key={tag.name} onMouseDown={(e) => insertTag(e, tag.name, tag.bg, tag.text, tag.border)} className="px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest shrink-0 transition-all hover:scale-105 border border-white/5 shadow-lg" style={{ backgroundColor: tag.bg, color: tag.text, border: `1px solid ${tag.border}` }}>{tag.name}</button>
                  ))}
               </div>

               {/* CONTENIDO TABS */}
               <div className="flex-1 relative overflow-hidden bg-[#050505]">
                  
                  {sessionTab === 'editor' && (
                    <div className="w-full h-full relative animate-in fade-in duration-500">
                        <div 
                          ref={editorRef} 
                          contentEditable="true" 
                          suppressContentEditableWarning={true} 
                          className="w-full h-full p-12 text-white font-medium text-lg leading-relaxed editor-container outline-none mac-scrollbar overflow-y-auto max-w-[1000px] mx-auto selection:bg-[#10b981]/30" 
                          dangerouslySetInnerHTML={{ __html: activeMeeting.contenido || '<p><br></p>' }} 
                          onBlur={() => setActiveMeeting({...activeMeeting, contenido: editorRef.current.innerHTML})} 
                        />
                        <button onMouseDown={(e) => { e.preventDefault(); setShowAIModal(true); }} className="absolute bottom-8 right-8 w-14 h-14 bg-[#10b981] hover:bg-[#0d9668] text-white rounded-full shadow-[0_10px_30px_rgba(16,185,129,0.3)] flex items-center justify-center transition-all hover:scale-110 active:scale-95 group">
                           <Sparkles size={24} className="group-hover:animate-pulse" />
                        </button>
                    </div>
                  )}

                  {sessionTab === 'drive' && (
                    <div className="w-full h-full p-8 overflow-y-auto mac-scrollbar animate-in fade-in duration-500">
                       <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                          {driveLoading ? <div className="col-span-full py-20 text-center"><RefreshCw className="animate-spin m-auto text-[#10b981]" /></div> : 
                            driveFiles.map(file => (
                              <div key={file.id} onClick={()=>window.open(file.webViewLink,'_blank')} className="bg-white/5 border border-white/5 rounded-2xl p-4 hover:bg-white/10 cursor-pointer transition-all flex flex-col items-center gap-3 text-center group border-b-2 border-b-transparent hover:border-b-[#10b981]">
                                 {file.mimeType?.includes('folder') ? <Folder size={28} className="text-amber-500"/> : <FileVideo size={28} className="text-[#10b981]"/>}
                                 <span className="text-[9px] font-bold text-white truncate w-full">{file.name}</span>
                              </div>
                            ))
                          }
                       </div>
                    </div>
                  )}

                  {sessionTab === 'calendar' && (
                    <div className="w-full h-full p-6 overflow-y-auto mac-scrollbar animate-in fade-in duration-500 flex flex-col space-y-4">
                        <div className="flex justify-between items-center mb-2">
                           <h4 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2"><Calendar size={16} className="text-[#10b981]"/> Planificación Nexus</h4>
                           <button onClick={() => setIsCalModalOpen(true)} className="px-5 py-2 bg-[#10b981] text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg">+ Agendar Sesión</button>
                        </div>
                        <div className="grid grid-cols-7 border border-white/5 rounded-2xl overflow-hidden bg-black/40 shadow-inner">
                           {['DOM','LUN','MAR','MIÉ','JUE','VIE','SÁB'].map(d => (
                             <div key={d} className="py-3 text-center text-[8px] font-black text-neutral-700 border-b border-white/5 uppercase tracking-widest bg-white/5">{d}</div>
                           ))}
                           {calendarLoading ? <div className="col-span-full py-20 text-center"><RefreshCw className="animate-spin m-auto text-[#10b981]" /></div> : 
                             Array.from({ length: 35 }).map((_, i) => (
                               <div key={i} className="h-20 border-b border-r border-white/5 p-2 hover:bg-[#10b981]/5 transition-all text-[9px] font-bold text-neutral-900 hover:text-white flex flex-col justify-between group">
                                  <span>{i + 1}</span>
                                  <div className="w-full h-1 bg-[#10b981]/0 group-hover:bg-[#10b981]/40 rounded-full transition-all"></div>
                               </div>
                             ))
                           }
                        </div>
                    </div>
                  )}

                  {sessionTab === 'mood' && (
                    <div className="w-full h-full p-8 overflow-y-auto mac-scrollbar animate-in fade-in duration-500">
                        <div className="flex justify-between items-center mb-6">
                           <h4 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2"><Palette size={16} className="text-[#10b981]"/> Mood Board</h4>
                           <button onClick={() => { const url = prompt('URL de imagen de referencia:'); if(url) setActiveMeeting({...activeMeeting, mood_board: [...activeMeeting.mood_board, url]}) }} className="px-5 py-2 bg-white/5 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">+ Añadir Referencia</button>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                           {activeMeeting.mood_board?.map((img, i) => (
                              <div key={i} className="aspect-video bg-white/5 rounded-[2rem] overflow-hidden border border-white/5 group relative shadow-2xl">
                                 <img src={img} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt="" />
                                 <button onClick={()=>setActiveMeeting({...activeMeeting, mood_board: activeMeeting.mood_board.filter((_, idx)=>idx!==i)})} className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all"><X size={14}/></button>
                              </div>
                           ))}
                        </div>
                    </div>
                  )}

                  {sessionTab === 'brand' && (
                    <div className="w-full h-full p-8 overflow-y-auto mac-scrollbar animate-in fade-in duration-500">
                        <h4 className="text-sm font-black text-white uppercase tracking-widest mb-8 flex items-center gap-2"><Briefcase size={16} className="text-[#10b981]"/> Brand Kit del Cliente</h4>
                        <div className="grid grid-cols-2 gap-10">
                           <div className="bg-white/5 p-8 rounded-[2rem] border border-white/5 shadow-2xl">
                              <p className="text-[10px] text-neutral-600 font-black uppercase tracking-widest mb-6">Paleta de Colores</p>
                              <div className="flex gap-4">
                                 {activeMeeting.brand_kit?.colors?.map((c, i) => (
                                    <div key={i} className="w-16 h-16 rounded-2xl shadow-xl border border-white/10 group relative" style={{ backgroundColor: c }}>
                                       <button onClick={()=>setActiveMeeting({...activeMeeting, brand_kit: {...activeMeeting.brand_kit, colors: activeMeeting.brand_kit.colors.filter((_, idx)=>idx!==i)}})} className="absolute -top-2 -right-2 p-1 bg-black text-white rounded-full opacity-0 group-hover:opacity-100 transition-all"><X size={10}/></button>
                                    </div>
                                 ))}
                                 <button onClick={() => { const c = prompt('Color HEX:'); if(c) setActiveMeeting({...activeMeeting, brand_kit: {...activeMeeting.brand_kit, colors: [...(activeMeeting.brand_kit.colors || []), c]}}) }} className="w-16 h-16 rounded-2xl bg-white/5 border border-dashed border-white/10 flex items-center justify-center text-neutral-800 hover:text-white transition-all"><Plus size={24}/></button>
                              </div>
                           </div>
                           <div className="bg-white/5 p-8 rounded-[2rem] border border-white/5 shadow-2xl">
                              <p className="text-[10px] text-neutral-600 font-black uppercase tracking-widest mb-6">Logotipos / Assets</p>
                              <div className="grid grid-cols-2 gap-4">
                                 {activeMeeting.brand_kit?.logos?.map((l, i) => (
                                    <div key={i} className="h-20 bg-black rounded-xl p-4 flex items-center justify-center group relative border border-white/5 shadow-inner">
                                       <img src={l} className="max-h-full max-w-full object-contain" alt="" />
                                       <button onClick={()=>setActiveMeeting({...activeMeeting, brand_kit: {...activeMeeting.brand_kit, logos: activeMeeting.brand_kit.logos.filter((_, idx)=>idx!==i)}})} className="absolute top-2 right-2 p-1 bg-black text-white rounded-full opacity-0 group-hover:opacity-100 transition-all"><X size={10}/></button>
                                    </div>
                                 ))}
                                 <button onClick={() => { const l = prompt('URL de Logo:'); if(l) setActiveMeeting({...activeMeeting, brand_kit: {...activeMeeting.brand_kit, logos: [...(activeMeeting.brand_kit.logos || []), l]}}) }} className="h-20 rounded-xl bg-white/5 border border-dashed border-white/10 flex items-center justify-center text-neutral-800 hover:text-white transition-all"><Plus size={24}/></button>
                              </div>
                           </div>
                        </div>
                    </div>
                  )}

                  {sessionTab === 'tasks' && (
                    <div className="w-full h-full p-4 overflow-hidden flex flex-col animate-in fade-in duration-500">
                        <GoogleTasks token={token} />
                    </div>
                  )}
               </div>

            </div>

          </div>
        </div>
      )}

      {/* MODALES RESTAURADOS */}
      {isCalModalOpen && (
        <div className="fixed inset-0 z-[800] flex items-center justify-center bg-black/95 backdrop-blur-2xl p-8 animate-in zoom-in duration-300">
          <div className="bg-[#080808] border border-white/10 rounded-[3rem] w-full max-w-xl p-10 space-y-6 shadow-2xl border-t-[#10b981] border-t-2">
            <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Agendar <span className="text-[#10b981]">Google Calendar</span></h3>
            <input type="text" value={calTitle} onChange={e=>setCalTitle(e.target.value)} placeholder="Título..." className="w-full bg-black border border-white/5 rounded-2xl p-4 text-white outline-none focus:border-[#10b981]/50" />
            <div className="grid grid-cols-2 gap-4">
              <input type="date" value={calDate} onChange={e=>setCalDate(e.target.value)} className="w-full bg-black border border-white/5 rounded-2xl p-4 text-white outline-none focus:border-[#10b981]/50" />
              <div className="grid grid-cols-2 gap-2">
                <input type="time" value={calStart} onChange={e=>setCalStart(e.target.value)} className="bg-black border border-white/5 rounded-2xl p-4 text-xs text-white" />
                <input type="time" value={calEnd} onChange={e=>setCalEnd(e.target.value)} className="bg-black border border-white/5 rounded-2xl p-4 text-xs text-white" />
              </div>
            </div>
            <div className="flex gap-4 pt-4">
               <button onClick={() => setIsCalModalOpen(false)} className="flex-1 py-5 text-neutral-600 font-black uppercase text-[10px] tracking-widest">Cerrar</button>
               <button onClick={handleCreateSessionEvent} disabled={calendarLoading} className="flex-[2] py-5 bg-[#10b981] text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg flex items-center justify-center gap-3">
                 {calendarLoading ? <RefreshCw className="animate-spin" size={16}/> : <Check size={16}/>} Confirmar en Google
               </button>
            </div>
          </div>
        </div>
      )}

      {showAIModal && (
        <div className="fixed inset-0 z-[700] flex items-center justify-center bg-black/95 backdrop-blur-3xl p-10 animate-in zoom-in duration-300">
          <div className="bg-[#080808] border border-white/10 rounded-[4rem] p-16 w-full max-w-3xl shadow-2xl relative overflow-hidden border-t-[#10b981] border-t-2">
            <h4 className="text-3xl font-black text-white uppercase tracking-tighter mb-8 flex items-center gap-4"><Sparkles className="text-[#10b981]" size={28}/> IA Oracle</h4>
            <textarea autoFocus value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} className="w-full bg-black border border-white/10 rounded-[2.5rem] p-8 text-lg text-white outline-none h-48 resize-none mb-8 placeholder:text-neutral-900 leading-normal" placeholder="Pide una mejora creativa..." />
            <div className="flex gap-8">
              <button onClick={() => setShowAIModal(false)} className="flex-1 py-6 text-neutral-600 font-black uppercase text-[10px] tracking-widest">Cerrar</button>
              <button onClick={handleAISuggestion} disabled={aiLoading || !aiPrompt} className="flex-[2] py-6 bg-[#10b981] text-white font-black rounded-[2.5rem] uppercase text-[10px] tracking-widest flex items-center justify-center gap-3 shadow-lg transition-all">
                {aiLoading ? <RefreshCw className="animate-spin" size={16}/> : <Sparkles size={16}/>} Ejecutar
              </button>
            </div>
          </div>
        </div>
      )}

      {isClientModalOpen && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center bg-black/90 backdrop-blur-xl p-8 animate-in zoom-in duration-300">
           <div className="bg-[#080808] border border-white/10 rounded-[3rem] w-full max-w-xl p-12 space-y-8 shadow-2xl border-t-[#10b981] border-t-2">
                <h3 className="text-3xl font-black text-white uppercase tracking-tighter leading-none">Sovereign <span className="text-[#10b981]">Nexus</span></h3>
                <input type="text" value={newClient.nombre} onChange={e=>setNewClient({...newClient, nombre: e.target.value})} placeholder="Nombre completo..." className="w-full bg-black border border-white/5 rounded-2xl p-6 text-lg text-white outline-none focus:border-[#10b981]/30" />
                <div className="flex gap-4">
                   <button onClick={() => setIsClientModalOpen(false)} className="flex-1 py-6 text-neutral-600 font-black uppercase text-[10px] tracking-widest">Descartar</button>
                   <button onClick={handleCreateClient} className="flex-[2] py-6 bg-[#10b981] text-white rounded-2xl font-black uppercase text-[10px] tracking-widest active:scale-95 transition-all shadow-lg">Guardar Perfil</button>
                </div>
           </div>
        </div>
      )}
    </div>
  );
};
export default MeetingStudio;
