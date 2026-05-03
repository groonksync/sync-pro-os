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
  Facebook, Smartphone as TiktokIcon, Cloud, Sparkles
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import GoogleTasks from '../components/GoogleTasks';
import { getDriveFiles, getCalendarEvents, getCalendarList, uploadFileToDrive, downloadDriveFile, deleteDriveFile, createCalendarEvent } from '../lib/googleApi';
import { aiService } from '../services/aiService';
import { generateSovereignInvoice } from '../utils/invoiceGenerator';

const MeetingStudio = ({ meetingsList = [], setMeetingsList, settings = {}, token }) => {
  const [viewState, setViewState] = useState('client-list'); 
  const [activeClient, setActiveClient] = useState(null);
  const [activeMeeting, setActiveMeeting] = useState(null);
  const [rightPanelTab, setRightPanelTab] = useState('delivery');
  const [sessionTab, setSessionTab] = useState('editor'); // 'editor', 'drive', 'calendar'
  
  const [clients, setClients] = useState([]);
  const [clientSearch, setClientSearch] = useState('');
  const [meetingSearch, setMeetingSearch] = useState('');
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Google Drive en Sesión
  const [driveFiles, setDriveFiles] = useState([]);
  const [driveLoading, setDriveLoading] = useState(false);
  const [sessionFolder, setSessionFolder] = useState({ id: 'root', name: 'Mi Unidad' });
  const [driveHistory, setDriveHistory] = useState([]);

  // Google Calendar en Sesión
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [currentCalDate, setCurrentCalDate] = useState(new Date());
  const [sessionCalendarList, setSessionCalendarList] = useState([]);
  
  // Modal Evento en Sesión
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

  useEffect(() => {
    fetchClients();
    fetchExchangeRates();
  }, []);

  const fetchExchangeRates = async () => {
    try {
      const response = await fetch('https://open.er-api.com/v6/latest/USD');
      const data = await response.json();
      if (data?.rates?.BOB) {
        setRates(prev => ({ ...prev, USDT_BOB: data.rates.BOB || 10.80, USD_BOB: 6.96, BRL: (data.rates.BOB / data.rates.BRL).toFixed(2) || 1.38 }));
      }
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    if (isTimerRunning) { timerRef.current = setInterval(() => setTime(t => t + 1), 1000); }
    else { clearInterval(timerRef.current); }
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
      const list = await getCalendarList(token);
      setSessionCalendarList(list || []);
      const results = await getCalendarEvents(token, 'primary', currentCalDate.getFullYear(), currentCalDate.getMonth());
      setCalendarEvents(results || []);
    } catch (e) { console.error(e); }
    setCalendarLoading(false);
  };

  const handleCreateSessionEvent = async (e) => {
    if (e) e.preventDefault();
    if (!calTitle) return;
    setCalendarLoading(true);
    try {
      const eventData = { summary: calTitle, description: calDesc, start: { dateTime: `${calDate}T${calStart}:00Z` }, end: { dateTime: `${calDate}T${calEnd}:00Z` } };
      await createCalendarEvent(token, eventData, calTargetId);
      setIsCalModalOpen(false);
      loadCalendarEvents();
    } catch (error) { alert(error.message); } finally { setCalendarLoading(false); }
  };

  useEffect(() => {
    if (viewState === 'session') {
      if (sessionTab === 'drive') fetchDriveFiles();
      if (sessionTab === 'calendar') loadCalendarEvents();
    }
  }, [sessionTab, viewState, sessionFolder]);

  const navigateSessionDrive = (folder) => { setDriveHistory([...driveHistory, sessionFolder]); setSessionFolder(folder); };
  const goBackSessionDrive = () => { if (driveHistory.length === 0) return; const prev = driveHistory[driveHistory.length - 1]; setDriveHistory(driveHistory.slice(0, -1)); setSessionFolder(prev); };

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
    } catch (e) { alert(e.message); }
    setLoading(false);
  };

  const fetchMeetings = async (clientId) => {
    try {
      const { data, error } = await supabase.from('reuniones').select('*').eq('cliente_id', clientId).order('created_at', { ascending: false });
      if (error) throw error;
      setMeetingsList(data || []);
    } catch (e) { console.error(e); }
  };

  const openClientProfile = (client) => { setActiveClient(client); fetchMeetings(client.id); setViewState('client-profile'); };

  const openMeeting = (meeting) => { 
    setActiveMeeting({
      ...meeting,
      pipeline: Array.isArray(meeting.pipeline) ? meeting.pipeline : [],
      feedback: Array.isArray(meeting.feedback) ? meeting.feedback : [],
      hitos_pago: Array.isArray(meeting.hitos_pago) ? meeting.hitos_pago : [],
      deadlines_multiple: Array.isArray(meeting.deadlines_multiple) ? meeting.deadlines_multiple : [],
      export_checklist: Array.isArray(meeting.export_checklist) ? meeting.export_checklist : [],
      priority: meeting.priority || 'Baja',
      platforms: Array.isArray(meeting.platforms) ? meeting.platforms : [],
      session_title: meeting.session_title || 'Edición de Video'
    }); 
    setTime(meeting.total_time || 0);
    setViewState('session'); 
  };

  const createMeeting = async () => {
    const sTitle = prompt('Descripción de la sesión:', 'Edición de Video');
    if (sTitle === null) return;
    const newMeeting = { 
      id: crypto.randomUUID(), cliente_id: activeClient.id, cliente: activeClient.nombre, fecha: new Date().toISOString().split('T')[0], session_title: sTitle,
      pipeline: [{ id: 1, label: 'Corte Bruto', done: false }, { id: 2, label: 'Audio/FX', done: false }, { id: 3, label: 'Color', done: false }, { id: 4, label: 'Render', done: false }],
      hitos_pago: [{ id: 1, label: 'Adelanto', paid: false }, { id: 2, label: 'Final', paid: false }],
      export_checklist: [{ id: 1, label: 'Vertical 9:16', done: false }, { id: 2, label: 'Horizontal 16:9', done: false }],
      contenido: '<p><br></p>', total_time: 0, priority: 'Baja'
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
  const applyHighlight = (colorHex, e) => { if (e) e.preventDefault(); document.execCommand('hiliteColor', false, colorHex); };
  const insertTag = (e, tagName, colorBg, colorText, colorBorder) => {
    if (e) e.preventDefault();
    const html = `<span contenteditable="false" style="background-color: ${colorBg}; color: ${colorText}; border: 1px solid ${colorBorder}; padding: 2px 8px; border-radius: 12px; font-size: 9px; font-weight: 900; text-transform: uppercase; margin: 0 4px; display: inline-flex;">${tagName}</span>&nbsp;`;
    document.execCommand('insertHTML', false, html);
    editorRef.current.focus();
  };

  const togglePlatform = (p) => {
    const current = activeMeeting.platforms || [];
    const next = current.includes(p) ? current.filter(x => x !== p) : [...current, p];
    setActiveMeeting({...activeMeeting, platforms: next});
  };

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
  const filteredMeetings = (meetingsList || []).filter(m => m.cliente_id === activeClient?.id);

  return (
    <div className="flex flex-col h-screen w-full bg-black text-white overflow-hidden animate-in fade-in duration-500 font-sans">
      
      {/* VISTA: LISTA DE CLIENTES */}
      {viewState === 'client-list' && (
        <div className="p-6 space-y-6 overflow-y-auto mac-scrollbar h-full">
          <header className="flex justify-between items-center pb-8 border-b border-white/5">
            <div>
              <h2 className="text-4xl font-black text-white tracking-tighter uppercase leading-none">Editor <span className="text-neutral-800">Pro</span></h2>
              <p className="text-[10px] text-neutral-600 font-black uppercase tracking-[0.3em] mt-2">Executive Production Suite</p>
            </div>
            <button onClick={() => setIsClientModalOpen(true)} className="px-8 py-4 bg-white text-black rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-neutral-200 transition-all shadow-2xl flex items-center gap-3">
              <Plus size={18}/> Nuevo Cliente
            </button>
          </header>
          <div className="relative">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-neutral-700" size={18}/>
            <input type="text" value={clientSearch} onChange={e=>setClientSearch(e.target.value)} placeholder="Identificar talento..." className="w-full bg-[#0a0a0a] border border-white/5 rounded-xl py-4 pl-14 pr-6 text-sm text-white outline-none focus:border-white/10" />
          </div>
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {filteredClients.map(client => (
              <div key={client.id} onClick={() => openClientProfile(client)} className="bg-[#0a0a0a] border border-white/5 rounded-[3rem] p-10 hover:bg-white/10 cursor-pointer transition-all flex flex-col items-center text-center group active:scale-95 shadow-2xl relative">
                <div className="w-28 h-28 mb-8 rounded-[2rem] bg-white/5 flex items-center justify-center border border-white/5 shadow-inner">
                  {client.foto_url ? <img src={client.foto_url} className="w-full h-full object-cover" alt="" /> : <UserIcon size={40} className="text-neutral-800" />}
                </div>
                <h4 className="text-xl font-black text-white uppercase tracking-tighter mb-1">{client.nombre}</h4>
                <p className="text-[10px] text-neutral-500 font-black uppercase tracking-[0.2em]">{client.pais || 'Global'}</p>
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
            <button onClick={createMeeting} className="px-8 py-3 bg-white text-black rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2"><Plus size={16}/> Nueva Sesión</button>
          </header>
          <div className="flex-1 p-8 overflow-y-auto mac-scrollbar">
               <div className="max-w-4xl mx-auto space-y-3">
                  {filteredMeetings.map(m => (
                    <div key={m.id} onClick={() => openMeeting(m)} className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-6 hover:bg-white/10 cursor-pointer transition-all flex items-center justify-between group">
                       <div className="flex items-center gap-6">
                          <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-neutral-800 group-hover:text-amber-500 transition-all border border-white/5"><PlayCircle size={24}/></div>
                          <div>
                            <p className="text-base font-black text-white uppercase tracking-tighter">{m.fecha}</p>
                            <p className="text-[9px] text-neutral-600 font-black uppercase tracking-widest mt-1">{m.session_title || 'Edición de Video'}</p>
                          </div>
                       </div>
                       <p className="text-xl font-black text-white font-mono">{formatTime(m.total_time || 0)}</p>
                    </div>
                  ))}
               </div>
          </div>
        </div>
      )}

      {/* VISTA: WAR ROOM / SESIÓN (RESTAURACIÓN TOTAL DE HERRAMIENTAS) */}
      {viewState === 'session' && activeMeeting && (
        <div className="flex-1 flex flex-col overflow-hidden bg-black animate-in fade-in duration-500">
          <header className="px-5 py-3 border-b border-white/5 bg-[#0a0a0a] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-4">
              <button onClick={saveMeeting} className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-neutral-600 hover:text-white transition-all"><ArrowLeft size={20}/></button>
              <div>
                <div className="flex items-center gap-2">
                   <h3 className="text-[12px] font-black text-white uppercase tracking-tighter leading-none">{activeClient?.nombre}</h3>
                   <span className="text-neutral-800">/</span>
                   <input type="text" value={activeMeeting.session_title} onChange={e=>setActiveMeeting({...activeMeeting, session_title: e.target.value})} className="bg-transparent text-[12px] font-black text-emerald-500 uppercase tracking-tighter outline-none w-auto min-w-[100px]" />
                </div>
                <p className="text-[8px] text-neutral-600 font-bold uppercase tracking-widest mt-1">{activeMeeting.fecha} • Sovereign Pro Session</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
               {!settings.isMobileMode && <button onClick={() => {
                 const text = editorRef.current.innerText;
                 navigator.clipboard.writeText(text);
                 alert('Resumen copiado');
               }} className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-lg text-[8px] font-black uppercase hover:bg-emerald-500/20 transition-all"><Copy size={12}/> Resumen</button>}
               <div className="flex items-center gap-3 bg-black border border-white/5 rounded-xl px-4 py-1.5">
                  <p className="text-sm font-mono font-black text-white">{formatTime(time)}</p>
                  <button onClick={() => setIsTimerRunning(!isTimerRunning)} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${isTimerRunning ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'bg-white/5 text-white'}`}>
                    {isTimerRunning ? <Pause size={14}/> : <Play size={14}/>}
                  </button>
               </div>
               <button onClick={saveMeeting} className="px-6 py-2.5 bg-white text-black text-[10px] font-black rounded-xl uppercase tracking-widest flex items-center gap-2 shadow-xl shadow-white/5">
                <Save size={16}/> Finalizar
              </button>
            </div>
          </header>

          <div className="flex-1 flex p-1.5 gap-1.5 overflow-hidden">
            {/* IZQUIERDA: HERRAMIENTAS (RESTAURADAS) */}
            <div className="w-[230px] h-full shrink-0 flex flex-col bg-[#050505] border-white/5 overflow-y-auto mac-scrollbar p-1.5 space-y-1.5">
               <div className="bg-[#0a0a0a] border border-white/5 rounded-xl p-2">
                  <p className="text-[10px] text-neutral-700 font-black uppercase mb-1.5 tracking-widest flex items-center gap-2"><Zap size={12}/> Prioridad & Mood</p>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {['Baja', 'Media', 'Alta', 'ASAP'].map(p => (
                      <button key={p} onClick={()=>setActiveMeeting({...activeMeeting, priority: p})} className={`px-2 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${activeMeeting.priority === p ? 'bg-white text-black' : 'bg-white/5 text-neutral-700'}`}>{p}</button>
                    ))}
                  </div>
                  <select value={activeMeeting.mood || ''} onChange={e=>setActiveMeeting({...activeMeeting, mood: e.target.value})} className="w-full bg-black border border-white/5 rounded-lg p-2.5 text-[11px] text-white font-black uppercase outline-none">
                    <option value="">Mood del Video...</option>
                    <option value="Cinematic">Cinematic</option>
                    <option value="Fast-Paced">Fast-Paced</option>
                    <option value="Corporate">Corporate</option>
                    <option value="Minimalist">Minimalist</option>
                  </select>
               </div>
               <div className="bg-[#0a0a0a] border border-white/5 rounded-xl p-2">
                  <div className="bg-black border border-white/5 rounded-lg p-1.5 text-right text-sm font-mono font-black text-white mb-1 shadow-inner">{calcDisplay}</div>
                  <div className="grid grid-cols-4 gap-1">
                    {['7','8','9','/','4','5','6','*','1','2','3','-','0','.','=','+'].map(btn => (
                      <button key={btn} onClick={() => handleCalc(btn)} className={`p-1.5 rounded-md text-[11px] font-black ${btn === '=' ? 'bg-amber-500 text-black' : 'bg-white/5 text-neutral-500'}`}>{btn}</button>
                    ))}
                  </div>
               </div>
               <div className="bg-[#0a0a0a] border border-white/5 rounded-xl p-2.5">
                  <p className="text-[7px] text-neutral-700 font-black uppercase mb-2 flex items-center gap-2"><BrandIcon size={10}/> Assets & Kit</p>
                  <div className="space-y-1.5">
                    <input type="text" value={activeMeeting.brand_kit?.logo || ''} onChange={e=>setActiveMeeting({...activeMeeting, brand_kit: {...(activeMeeting.brand_kit || {}), logo: e.target.value}})} placeholder="Logo URL..." className="w-full bg-black border border-white/5 rounded-lg p-1.5 text-[7px] text-neutral-600 outline-none" />
                  </div>
               </div>
               <div className="bg-[#0a0a0a] border border-white/5 rounded-xl p-2">
                  <p className="text-[10px] text-neutral-700 font-black uppercase mb-1.5 tracking-widest flex items-center gap-2"><Calendar size={12}/> Deadlines</p>
                  <div className="space-y-1">
                    {(activeMeeting.deadlines_multiple || []).map(d => (
                      <div key={d.id} className="flex items-center gap-1.5 bg-black/50 p-1 rounded-lg border border-white/5">
                        <input type="text" value={d.label} onChange={e => setActiveMeeting({...activeMeeting, deadlines_multiple: activeMeeting.deadlines_multiple.map(item => item.id === d.id ? {...item, label: e.target.value} : item)})} className="bg-transparent text-[7px] font-bold text-white uppercase outline-none flex-1 truncate" />
                        <button onClick={() => setActiveMeeting({...activeMeeting, deadlines_multiple: activeMeeting.deadlines_multiple.map(item => item.id === d.id ? {...item, done: !item.done} : item)})} className={`w-3 h-3 rounded flex items-center justify-center shrink-0 ${d.done ? 'bg-emerald-500 text-black' : 'bg-white/5 text-neutral-900'}`}>{d.done && <Check size={8} strokeWidth={4}/>}</button>
                      </div>
                    ))}
                    <button onClick={() => setActiveMeeting({...activeMeeting, deadlines_multiple: [...(activeMeeting.deadlines_multiple || []), { id: Date.now(), label: 'Entrega', done: false }]})} className="w-full py-1.5 bg-white/5 rounded-lg text-[8px] font-black uppercase text-neutral-600 hover:text-white transition-all">+ Añadir</button>
                  </div>
               </div>
            </div>

            {/* CENTRO: EDITOR / DRIVE / CALENDAR */}
            <div className="flex-1 min-w-0 flex flex-col bg-black border-x border-white/5 p-1.5 space-y-1.5 items-center overflow-hidden">
               <div className="flex w-[95%] max-w-[1100px] bg-[#0a0a0a] border border-white/5 rounded-2xl p-1 shadow-xl">
                  {['editor', 'drive', 'calendar'].map(t => (
                    <button key={t} onClick={() => setSessionTab(t)} className={`flex-1 py-2.5 rounded-xl text-[9px] font-black uppercase transition-all flex items-center justify-center gap-2 ${sessionTab === t ? 'bg-white text-black shadow-lg' : 'text-neutral-600 hover:text-white'}`}>
                      {t === 'editor' && <FileText size={14}/>}
                      {t === 'drive' && <HardDrive size={14}/>}
                      {t === 'calendar' && <Calendar size={14}/>}
                      {t}
                    </button>
                  ))}
               </div>

               {sessionTab === 'editor' && (
                 <div className="flex-1 w-[95%] max-w-[1100px] bg-[#0a0a0a] border border-white/5 rounded-[24px] flex flex-col overflow-hidden shadow-2xl relative animate-in fade-in zoom-in duration-500">
                      <div className="flex items-center gap-3 px-6 py-4 border-b border-white/5 bg-black/40 shrink-0">
                          <div className="flex items-center gap-2 pr-4 border-r border-white/10 shrink-0">
                             <button onMouseDown={(e) => formatText('formatBlock', '<h1>', e)} className="px-5 py-3 bg-blue-600/10 hover:bg-blue-600 text-blue-500 hover:text-white rounded-xl text-[11px] font-black uppercase transition-all border border-blue-500/20 flex items-center gap-2 shadow-lg">H1</button>
                             <button onMouseDown={(e) => formatText('formatBlock', '<h2>', e)} className="px-5 py-3 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-500 hover:text-white rounded-xl text-[11px] font-black uppercase transition-all border border-emerald-500/20 flex items-center gap-2 shadow-lg">H2</button>
                          </div>
                          <div className="flex items-center gap-1 px-2 border-r border-white/10 shrink-0">
                             <button onMouseDown={(e) => formatText('bold', null, e)} className="p-3 text-neutral-500 hover:text-white bg-white/5 rounded-xl"><Bold size={16}/></button>
                             <button onMouseDown={(e) => formatText('italic', null, e)} className="p-3 text-neutral-500 hover:text-white bg-white/5 rounded-xl"><Italic size={16}/></button>
                          </div>
                          <div className="flex-1 flex items-center gap-2 px-2 overflow-x-auto no-scrollbar">
                             {EDITOR_TAGS.map(tag => (
                               <button key={tag.name} onMouseDown={(e) => insertTag(e, tag.name, tag.bg, tag.text, tag.border)} className="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest shrink-0 transition-transform hover:scale-105" style={{ backgroundColor: tag.bg, color: tag.text, border: `1px solid ${tag.border}` }}>{tag.name}</button>
                             ))}
                          </div>
                      </div>
                      <div ref={editorRef} contentEditable="true" suppressContentEditableWarning={true} className="w-full flex-1 p-8 text-neutral-300 font-normal text-[15px] leading-relaxed editor-container outline-none mac-scrollbar overflow-y-auto" dangerouslySetInnerHTML={{ __html: activeMeeting.contenido || '<p><br></p>' }} onBlur={() => setActiveMeeting({...activeMeeting, contenido: editorRef.current.innerHTML})} />
                      <button onMouseDown={(e) => { e.preventDefault(); setShowAIModal(true); }} className="absolute bottom-16 right-8 px-5 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-full shadow-2xl border border-white/10 flex items-center gap-2 text-[11px] font-black uppercase tracking-widest transition-all z-50 group">
                         <Sparkles size={16} className="animate-pulse" />
                         <span>IA Magic</span>
                      </button>
                 </div>
               )}

               {sessionTab === 'drive' && (
                 <div className="flex-1 w-[95%] max-w-[1100px] bg-[#0a0a0a] border border-white/5 rounded-[32px] flex flex-col overflow-hidden shadow-2xl">
                    <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center bg-black/40">
                      <div className="flex items-center gap-3 text-blue-500 font-black text-[9px] uppercase tracking-widest"><HardDrive size={16}/> Almacenamiento Nexus</div>
                      <button onClick={() => fetchDriveFiles()} className="p-2 hover:bg-white/5 rounded-lg text-neutral-600 hover:text-white transition-all"><RefreshCw size={13} className={driveLoading ? 'animate-spin' : ''}/></button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 mac-scrollbar">
                       {driveFiles.map(file => (
                         <div key={file.id} className="flex items-center justify-between p-3 border-b border-white/[0.03] hover:bg-white/[0.03] transition-all group">
                            <div className="flex items-center gap-3">
                               {file.mimeType?.includes('folder') ? <Folder size={14} className="text-amber-400"/> : <File size={14} className="text-neutral-500"/>}
                               <span className="text-[11px] font-bold text-white">{file.name}</span>
                            </div>
                            <button onClick={()=>window.open(file.webViewLink,'_blank')} className="p-2 text-neutral-600 hover:text-white"><ExternalLink size={14}/></button>
                         </div>
                       ))}
                    </div>
                 </div>
               )}
            </div>

            {/* PANEL DERECHO (RESTAURADO) */}
            <div className="w-[260px] border-l shrink-0 bg-black border-white/5 flex flex-col p-1.5 space-y-1.5 overflow-y-auto mac-scrollbar">
               <div className="bg-[#0a0a0a] border border-white/5 rounded-xl p-2 shadow-xl">
                  <p className="text-[7px] text-neutral-700 font-black uppercase mb-1.5 flex items-center gap-2"><Smartphone size={10}/> Platforms</p>
                  <div className="flex justify-around">
                    <button onClick={()=>togglePlatform('YT')} className={`p-1.5 rounded-lg ${activeMeeting.platforms?.includes('YT') ? 'text-rose-500 bg-rose-500/10' : 'text-neutral-800'}`}><Youtube size={14}/></button>
                    <button onClick={()=>togglePlatform('IG')} className={`p-1.5 rounded-lg ${activeMeeting.platforms?.includes('IG') ? 'text-pink-500 bg-pink-500/10' : 'text-neutral-800'}`}><Instagram size={14}/></button>
                    <button onClick={()=>togglePlatform('FB')} className={`p-1.5 rounded-lg ${activeMeeting.platforms?.includes('FB') ? 'text-blue-500 bg-blue-500/10' : 'text-neutral-800'}`}><Facebook size={14}/></button>
                  </div>
               </div>
               <div className="bg-[#0a0a0a] border border-white/5 rounded-xl p-3 shadow-xl flex flex-col flex-1 min-h-0 overflow-hidden">
                  <div className="flex bg-black rounded-lg p-0.5 mb-2.5 border border-white/5 shrink-0">
                    <button onClick={() => setRightPanelTab('delivery')} className={`flex-1 py-1.5 rounded text-[7px] font-black uppercase transition-all ${rightPanelTab === 'delivery' ? 'bg-white text-black' : 'text-neutral-600'}`}>Delivery</button>
                    <button onClick={() => setRightPanelTab('tasks')} className={`flex-1 py-1.5 rounded text-[7px] font-black uppercase transition-all ${rightPanelTab === 'tasks' ? 'bg-white text-black' : 'text-neutral-600'}`}>Tasks</button>
                  </div>
                  <div className="flex-1 overflow-y-auto mac-scrollbar pr-1">
                    {rightPanelTab === 'delivery' ? (
                      <div className="space-y-1">
                        {(activeMeeting.export_checklist || []).map(h => (
                          <button key={h.id} onClick={() => setActiveMeeting({...activeMeeting, export_checklist: activeMeeting.export_checklist.map(item => item.id === h.id ? {...item, done: !item.done} : item)})} className={`w-full flex justify-between items-center p-1.5 rounded-lg border transition-all ${h.done ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-white/5 border-white/5 text-neutral-800'}`}>
                             <span className="text-[8px] font-black uppercase">{h.label}</span>
                             {h.done && <Check size={10} strokeWidth={4}/>}
                          </button>
                        ))}
                      </div>
                    ) : <GoogleTasks token={token} />}
                  </div>
               </div>
               <div className="bg-[#0a0a0a] border border-white/5 rounded-xl p-2 shadow-xl shrink-0">
                  <div className="flex justify-between items-center mb-1.5">
                    <p className="text-[7px] text-neutral-700 font-black uppercase flex items-center gap-2"><Target size={10}/> Cobros</p>
                    <button onClick={() => setActiveMeeting({...activeMeeting, hitos_pago: [...(activeMeeting.hitos_pago || []), { id: Date.now(), label: 'Hito', paid: false }]})} className="p-1 bg-white/5 rounded text-neutral-600 hover:text-white"><Plus size={10}/></button>
                  </div>
                  <div className="space-y-1.5">
                    {(activeMeeting.hitos_pago || []).map(h => (
                      <div key={h.id} className="flex gap-1.5 items-center">
                        <input type="text" value={h.label} onChange={(e) => setActiveMeeting({...activeMeeting, hitos_pago: activeMeeting.hitos_pago.map(item => item.id === h.id ? {...item, label: e.target.value} : item)})} className={`flex-1 bg-transparent border border-white/5 rounded px-1.5 py-0.5 text-[8px] font-bold uppercase outline-none ${h.paid ? 'text-emerald-500' : 'text-neutral-700'}`} />
                        <button onClick={() => setActiveMeeting({...activeMeeting, hitos_pago: activeMeeting.hitos_pago.map(item => item.id === h.id ? {...item, paid: !item.paid} : item)})} className={`w-5 h-5 rounded flex items-center justify-center transition-all border ${h.paid ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-white/5 border-white/5 text-neutral-900'}`}>{h.paid && <Check size={10} strokeWidth={4}/>}</button>
                      </div>
                    ))}
                  </div>
               </div>
               <div className="bg-[#0a0a0a] border border-white/5 rounded-xl p-2.5 shadow-xl shrink-0">
                  <p className="text-[7px] text-neutral-700 font-black uppercase mb-2 flex items-center gap-2"><Activity size={10}/> Pipeline Status</p>
                  <div className="grid grid-cols-2 gap-1">
                    {(activeMeeting.pipeline || []).map(step => (
                      <button key={step.id} onClick={() => setActiveMeeting({...activeMeeting, pipeline: activeMeeting.pipeline.map(s => s.id === step.id ? {...s, done: !s.done} : s)})} className={`flex items-center gap-1.5 p-1 rounded-lg border transition-all ${step.done ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-white/5 border-white/5 text-neutral-800'}`}>
                        <div className={`w-3 h-3 rounded flex items-center justify-center shrink-0 ${step.done ? 'bg-emerald-500 text-black' : 'bg-white/5 border border-white/5'}`}>{step.done && <Check size={8} strokeWidth={4}/>}</div>
                        <span className="text-[6px] font-black uppercase truncate flex-1">{step.label}</span>
                      </button>
                    ))}
                  </div>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* MODALES */}
      {isClientModalOpen && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center bg-black/90 backdrop-blur-xl p-8">
           <div className="bg-[#0a0a0a] border border-white/10 rounded-[40px] w-full max-w-xl p-10 space-y-6">
                <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Nuevo Perfil</h3>
                <input type="text" value={newClient.nombre} onChange={e=>setNewClient({...newClient, nombre: e.target.value})} placeholder="Alias del Cliente" className="w-full bg-black border border-white/5 rounded-2xl p-4 text-white outline-none" />
                <div className="flex gap-4 pt-6">
                   <button onClick={() => setIsClientModalOpen(false)} className="flex-1 py-4 text-neutral-600 font-black uppercase text-[10px]">Cerrar</button>
                   <button onClick={handleCreateClient} className="flex-[2] py-4 bg-white text-black rounded-2xl font-black uppercase text-[10px]">Sincronizar</button>
                </div>
           </div>
        </div>
      )}

      {showAIModal && (
        <div className="fixed inset-0 z-[700] flex items-center justify-center bg-black/90 backdrop-blur-xl p-8">
          <div className="bg-[#0a0a0a] border border-white/10 rounded-[40px] p-16 w-full max-w-2xl shadow-2xl relative overflow-hidden">
            <h4 className="text-3xl font-black text-white mb-8 flex items-center gap-4 uppercase tracking-tighter"><Sparkles className="text-purple-500 animate-pulse" size={36}/> IA Magic v2</h4>
            <textarea autoFocus value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} className="w-full bg-black border border-white/10 rounded-[30px] p-8 text-lg text-white outline-none h-48 resize-none mb-10 placeholder:text-neutral-800" placeholder="Ej: Mejora este guion..." />
            <div className="flex gap-8">
              <button onClick={() => setShowAIModal(false)} className="flex-1 py-6 text-neutral-600 font-black uppercase text-xs">Cerrar</button>
              <button onClick={handleAISuggestion} disabled={aiLoading || !aiPrompt} className="flex-[2] py-6 bg-purple-600 text-white font-black rounded-[28px] uppercase text-xs shadow-xl disabled:opacity-50 flex items-center justify-center gap-3">
                {aiLoading ? <RefreshCw className="animate-spin" size={16}/> : <Sparkles size={16}/>} {aiLoading ? 'Generando...' : 'Ejecutar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default MeetingStudio;
