import React, { useState, useRef, useEffect } from 'react';
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
  Facebook, Smartphone as TiktokIcon, Cloud
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import GoogleTasks from '../components/GoogleTasks';
import { getDriveFiles, getCalendarEvents, getCalendarList, uploadFileToDrive, downloadDriveFile, deleteDriveFile, createCalendarEvent } from '../lib/googleApi';
import { aiService } from '../services/aiService';
import { Sparkles } from 'lucide-react';
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
  const [convCurrency, setConvCurrency] = useState('USD');
  const [convAmount, setConvAmount] = useState('');

  const editorRef = useRef(null);
  const timerRef = useRef(null);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [tempNoteText, setTempNoteText] = useState('');
  const [pendingNoteRange, setPendingNoteRange] = useState(null);

  const [showAIModal, setShowAIModal] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const [newClient, setNewClient] = useState({
    nombre: '', 
    nombre_completo: '',
    identidad: '',
    email: '', 
    telefono: '', 
    pais: '', 
    empresa: '',
    metodo_pago_preferido: 'QR', 
    link_brutos: '',
    foto_url: '', 
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
      if (data && data.rates && data.rates.BOB) {
        setRates(prev => ({
          ...prev,
          USDT_BOB: data.rates.BOB || 10.80,
          USD_BOB: 6.96,
          BRL: (data.rates.BOB / data.rates.BRL).toFixed(2) || 1.38
        }));
      }
    } catch (e) {
      console.error("Error al actualizar divisas:", e);
    }
  };

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
      const selectedIds = list.filter(c => c.selected).map(c => c.id);
      const allEventsPromises = selectedIds.length > 0 
        ? selectedIds.map(id => getCalendarEvents(token, id, currentCalDate.getFullYear(), currentCalDate.getMonth()))
        : [getCalendarEvents(token, 'primary', currentCalDate.getFullYear(), currentCalDate.getMonth())];
      const results = await Promise.all(allEventsPromises);
      setCalendarEvents(results.flat());
    } catch (e) { console.error(e); }
    setCalendarLoading(false);
  };

  const handleCreateSessionEvent = async (e) => {
    if (e) e.preventDefault();
    if (!calTitle) return;
    setCalendarLoading(true);
    try {
      const eventData = {
        summary: calTitle,
        description: calDesc,
        start: { dateTime: `${calDate}T${calStart}:00Z`, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
        end: { dateTime: `${calDate}T${calEnd}:00Z`, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
      };
      await createCalendarEvent(token, eventData, calTargetId);
      setIsCalModalOpen(false);
      setCalTitle('');
      loadCalendarEvents();
      alert('¡Evento Sincronizado!');
    } catch (error) { alert(`Error: ${error.message}`); } finally { setCalendarLoading(false); }
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
        portal_id: newClient.portal_id || crypto.randomUUID()
      };
      if (newClient.id) await supabase.from('clientes_editor').update(clientData).eq('id', newClient.id);
      else await supabase.from('clientes_editor').insert(clientData);
      await fetchClients();
      setIsClientModalOpen(false);
      setNewClient({ nombre: '', nombre_completo: '', identidad: '', email: '', telefono: '', pais: '', empresa: '', metodo_pago_preferido: 'QR', link_brutos: '', foto_url: '', redes: { instagram: '', youtube: '', twitter: '', tiktok: '' } });
    } catch (e) { alert(e.message); }
    setLoading(false);
  };

  const moveToTrash = async (client, e) => {
    e.stopPropagation();
    if (!confirm(`¿Mover a ${client.nombre} a la papelera?`)) return;
    try {
      await supabase.from('papelera').insert({ tipo_dato: 'cliente', item_id: client.id, nombre_item: client.nombre, datos_originales: client });
      await supabase.from('clientes_editor').delete().eq('id', client.id);
      await fetchClients();
    } catch (e) { alert(e.message); }
  };

  const startEditClient = (client, e) => {
    e.stopPropagation();
    setNewClient({ id: client.id, nombre: client.nombre || '', nombre_completo: client.nombre_completo || '', identidad: client.identidad || '', email: client.email || '', telefono: client.telefono || '', pais: client.pais || '', empresa: client.empresa || '', metodo_pago_preferido: client.metodo_pago_preferido || 'QR', link_brutos: client.link_brutos || '', foto_url: client.foto_url || '', redes: client.redes_sociales || { instagram: '', youtube: '', twitter: '', tiktok: '' } });
    setIsClientModalOpen(true);
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
    const stableMeeting = {
      ...meeting,
      pipeline: Array.isArray(meeting.pipeline) ? meeting.pipeline : [
        { id: 1, label: 'Corte Bruto', done: false, icon: 'Scissors' },
        { id: 2, label: 'Audio/FX', done: false, icon: 'Music' },
        { id: 3, label: 'Color', done: false, icon: 'Palette' },
        { id: 4, label: 'Render', done: false, icon: 'Share2' }
      ],
      feedback: Array.isArray(meeting.feedback) ? meeting.feedback : [],
      hitos_pago: Array.isArray(meeting.hitos_pago) ? meeting.hitos_pago : [
        { id: 1, label: 'Adelanto', paid: false },
        { id: 2, label: 'Final', paid: false }
      ],
      deadlines_multiple: Array.isArray(meeting.deadlines_multiple) ? meeting.deadlines_multiple : [],
      export_checklist: Array.isArray(meeting.export_checklist) ? meeting.export_checklist : [
        { id: 1, label: 'Vertical 9:16', done: false },
        { id: 2, label: 'Horizontal 16:9', done: false },
        { id: 3, label: 'Subtítulos', done: false }
      ],
      priority: meeting.priority || 'Baja',
      platforms: Array.isArray(meeting.platforms) ? meeting.platforms : []
    };
    setActiveMeeting(stableMeeting); 
    setTime(stableMeeting.total_time || 0);
    setViewState('session'); 
  };

  const createMeeting = async () => {
    const newMeeting = { 
      id: crypto.randomUUID(), cliente_id: activeClient.id, cliente: activeClient.nombre, fecha: new Date().toISOString().split('T')[0], estado: 'Pendiente', link: '', drive: '', presupuesto: 0, contenido: '<p><br></p>', insights: [], feedback: [], total_time: 0,
      pipeline: [ { id: 1, label: 'Corte Bruto', done: false, icon: 'Scissors' }, { id: 2, label: 'Audio/FX', done: false, icon: 'Music' }, { id: 3, label: 'Color', done: false, icon: 'Palette' }, { id: 4, label: 'Render', done: false, icon: 'Share2' } ],
      hitos_pago: [{ id: 1, label: 'Adelanto', paid: false }, { id: 2, label: 'Final', paid: false }],
      deadlines_multiple: [], export_checklist: [ { id: 1, label: 'Vertical 9:16', done: false }, { id: 2, label: 'Horizontal 16:9', done: false }, { id: 3, label: 'Subtítulos', done: false } ],
      priority: 'Baja', platforms: []
    };
    try { await supabase.from('reuniones').insert(newMeeting); setMeetingsList([...(meetingsList || []), newMeeting]); openMeeting(newMeeting); } catch (error) { alert(error.message); }
  };

  const saveMeeting = async () => {
    setLoading(true);
    try {
      const updatedMeeting = { ...activeMeeting, total_time: time };
      await supabase.from('reuniones').upsert(updatedMeeting);
      setMeetingsList((meetingsList || []).map(m => m.id === updatedMeeting.id ? updatedMeeting : m));
      setViewState('client-profile'); 
      setActiveMeeting(null);
      setIsTimerRunning(false);
    } catch (error) { alert(error.message); }
    setLoading(false);
  };

  const handleCalc = (val) => {
    if (val === '=') { try { setCalcDisplay(eval(calcDisplay.replace(/[^-()\d/*+.]/g, '')).toString()); } catch (e) { setCalcDisplay('Error'); } }
    else if (val === 'C') setCalcDisplay('0');
    else if (val === 'DEL') setCalcDisplay(prev => prev.length > 1 ? prev.slice(0, -1) : '0');
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
    const html = `<span contenteditable="false" style="background-color: ${colorBg}; color: ${colorText}; border: 1px solid ${colorBorder}; padding: 2px 8px; border-radius: 12px; font-size: 9px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.05em; display: inline-flex; align-items: center; justify-content: center; margin: 0 4px; vertical-align: middle; box-shadow: 0 2px 4px rgba(0,0,0,0.2); cursor: default; user-select: none;">${tagName}</span>&nbsp;`;
    document.execCommand('insertHTML', false, html);
    editorRef.current.focus();
  };

  const EDITOR_TAGS = [
    { name: 'Guion', bg: 'rgba(59, 130, 246, 0.1)', text: '#60a5fa', border: 'rgba(59, 130, 246, 0.3)' },
    { name: 'Video', bg: 'rgba(239, 68, 68, 0.1)', text: '#f87171', border: 'rgba(239, 68, 68, 0.3)' },
    { name: 'IA', bg: 'rgba(168, 85, 247, 0.1)', text: '#c084fc', border: 'rgba(168, 85, 247, 0.3)' }
  ];

  const handleAISuggestion = async () => {
    if (!aiPrompt) return;
    setAiLoading(true);
    try {
      const context = editorRef.current.innerHTML;
      const suggestion = await aiService.generateScript(aiPrompt, context, activeMeeting.mood || 'Profesional');
      editorRef.current.focus();
      document.execCommand('insertHTML', false, suggestion.replace(/\n/g, '<br>') + '<br>');
      setActiveMeeting(prev => ({...prev, contenido: editorRef.current.innerHTML}));
      setShowAIModal(false);
      setAiPrompt('');
    } catch (e) { alert(e.message); }
    setAiLoading(false);
  };

  const filteredClients = (clients || []).filter(c => normalizeText(c.nombre).includes(normalizeText(clientSearch)) || normalizeText(c.empresa).includes(normalizeText(clientSearch)));
  const filteredMeetings = (meetingsList || []).filter(m => m.cliente_id === activeClient?.id);

  return (
    <div className="flex flex-col h-screen max-w-full w-full animate-in fade-in duration-500 overflow-hidden bg-black font-sans text-white">
      
      {/* VISTA: LISTA DE CLIENTES */}
      {viewState === 'client-list' && (
        <div className="p-6 space-y-6 overflow-y-auto mac-scrollbar h-full">
          <header className="flex justify-between items-center pb-8 border-b border-white/5">
            <div>
              <h2 className="text-4xl font-black text-white tracking-tighter uppercase leading-none">Editor <span className="text-neutral-800">Pro</span></h2>
              <p className="text-[10px] text-neutral-600 font-black uppercase tracking-[0.3em] mt-2">Gestión de Talento & Producción</p>
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
              <div key={client.id} onClick={() => openClientProfile(client)} className="bg-[#0a0a0a] border border-white/5 rounded-[3rem] p-10 hover:bg-white/10 cursor-pointer transition-all flex flex-col items-center text-center group shadow-2xl relative overflow-hidden">
                <div className="absolute top-6 right-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                  <button onClick={(e) => startEditClient(client, e)} className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-neutral-400 hover:text-white"><BrandIcon size={14}/></button>
                  <button onClick={(e) => moveToTrash(client, e)} className="p-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-xl"><Trash2 size={14}/></button>
                </div>
                <div className="w-28 h-28 mb-8 rounded-[2rem] bg-white/5 flex items-center justify-center border border-white/5 shadow-inner">
                  {client.foto_url ? <img src={client.foto_url} className="w-full h-full object-cover" alt="" /> : <UserIcon size={40} className="text-neutral-800" />}
                </div>
                <h4 className="text-xl font-black text-white uppercase tracking-tighter mb-1">{client.nombre}</h4>
                <p className="text-[10px] text-neutral-500 font-black uppercase tracking-[0.2em] mb-6">{client.pais || 'Global'}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VISTA: PERFIL DEL CLIENTE */}
      {viewState === 'client-profile' && activeClient && (
        <div className="h-full flex flex-col overflow-hidden bg-black">
          <header className="px-6 py-4 bg-[#0a0a0a] border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <button onClick={() => setViewState('client-list')} className="w-10 h-10 bg-white/5 rounded-2xl flex items-center justify-center text-neutral-600 hover:text-white transition-all"><ArrowLeft size={20}/></button>
              <div className="flex items-center gap-4">
                 <div className="w-14 h-14 rounded-2xl bg-white/5 overflow-hidden border border-white/10">
                   {activeClient.foto_url ? <img src={activeClient.foto_url} className="w-full h-full object-cover" alt="" /> : <UserIcon size={24} className="text-neutral-800 m-auto mt-4" />}
                 </div>
                 <div>
                   <h3 className="text-xl font-black text-white uppercase tracking-tighter leading-none mb-1">{activeClient.nombre}</h3>
                   <span className="text-[9px] text-amber-500 font-black uppercase tracking-widest">{activeClient.empresa || 'Freelance'}</span>
                 </div>
              </div>
            </div>
            <button onClick={createMeeting} className="px-8 py-3 bg-white text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-neutral-200 transition-all flex items-center gap-2"><Plus size={16}/> Nueva Sesión</button>
          </header>

          <div className="flex-1 flex overflow-hidden">
            <div className="w-[320px] h-full border-r bg-[#050505] border-white/5 p-6 space-y-8 overflow-y-auto mac-scrollbar">
              <section>
                <h4 className="text-[10px] font-black text-neutral-700 uppercase tracking-[0.3em] mb-6">Contacto</h4>
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                    <Phone size={16} className="text-neutral-600" />
                    <p className="text-xs text-white font-bold">{activeClient.telefono || 'Sin Tel'}</p>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                    <Mail size={16} className="text-neutral-600" />
                    <p className="text-xs text-white font-bold truncate">{activeClient.email || 'Sin Email'}</p>
                  </div>
                </div>
              </section>
            </div>

            <div className="flex-1 p-8 overflow-y-auto mac-scrollbar bg-black">
                <div className="max-w-4xl mx-auto space-y-3">
                    {filteredMeetings.map(mov => (
                       <div key={mov.id} onClick={() => openMeeting(mov)} className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-6 hover:bg-white/10 cursor-pointer transition-all flex items-center justify-between group">
                          <div className="flex items-center gap-6">
                             <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-neutral-800 group-hover:text-amber-500 transition-all border border-white/5"><PlayCircle size={24}/></div>
                             <p className="text-base font-black text-white uppercase tracking-tighter">{mov.fecha}</p>
                          </div>
                          <p className="text-xl font-black text-white font-mono">{formatTime(mov.total_time || 0)}</p>
                       </div>
                    ))}
                </div>
            </div>
          </div>
        </div>
      )}

      {/* VISTA: WAR ROOM / SESIÓN */}
      {viewState === 'session' && activeMeeting && (
        <div className="flex-1 flex flex-col overflow-hidden bg-black animate-in fade-in duration-500">
          <header className="px-5 py-3 border-b border-white/5 bg-[#0a0a0a] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-4">
              <button onClick={saveMeeting} className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-neutral-600 hover:text-white transition-all"><ArrowLeft size={20}/></button>
              <div>
                <h3 className="text-[12px] font-black text-white uppercase tracking-tighter leading-none">{activeClient?.nombre} / {activeMeeting.fecha}</h3>
                <p className="text-[8px] text-neutral-600 font-bold uppercase tracking-widest mt-1">Sovereign Pro • Session</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
               <div className="flex items-center gap-3 bg-black border border-white/5 rounded-xl px-4 py-1.5">
                  <p className="text-sm font-mono font-black text-white">{formatTime(time)}</p>
                  <button onClick={() => setIsTimerRunning(!isTimerRunning)} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${isTimerRunning ? 'bg-amber-500 text-black' : 'bg-white/5 text-white'}`}>
                    {isTimerRunning ? <Pause size={14}/> : <Play size={14}/>}
                  </button>
               </div>
               <button onClick={saveMeeting} className="px-6 py-2.5 bg-white text-black text-[10px] font-black rounded-xl uppercase tracking-widest flex items-center gap-2 shadow-xl shadow-white/5">
                <Save size={16}/> Finalizar
              </button>
            </div>
          </header>

          <div className="flex-1 flex p-1.5 gap-1.5 overflow-hidden">
            {/* HERRAMIENTAS IZQUIERDA */}
            <div className="w-[230px] h-full shrink-0 flex flex-col bg-[#050505] border-white/5 overflow-y-auto mac-scrollbar p-1.5 space-y-1.5">
               <div className="bg-[#0a0a0a] border border-white/5 rounded-xl p-2">
                  <p className="text-[10px] text-neutral-700 font-black uppercase mb-1.5 tracking-widest flex items-center gap-2"><Zap size={12}/> Prioridad</p>
                  <div className="grid grid-cols-2 gap-2">
                    {['Baja', 'Media', 'Alta', 'ASAP'].map(p => (
                      <button key={p} onClick={()=>setActiveMeeting({...activeMeeting, priority: p})} className={`px-2 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${activeMeeting.priority === p ? 'bg-white text-black' : 'bg-white/5 text-neutral-700'}`}>{p}</button>
                    ))}
                  </div>
               </div>
               <div className="bg-[#0a0a0a] border border-white/5 rounded-xl p-2">
                  <div className="bg-black border border-white/5 rounded-lg p-1.5 text-right text-sm font-mono font-black text-white mb-1 shadow-inner">{calcDisplay}</div>
                  <div className="grid grid-cols-4 gap-1">
                    {['7','8','9','/','4','5','6','*','1','2','3','-','0','.','=','+'].map(btn => (
                      <button key={btn} onClick={() => handleCalc(btn)} className={`p-1.5 rounded-md text-[11px] font-black ${btn === '=' ? 'bg-amber-500 text-black' : 'bg-white/5 text-neutral-500'}`}>{btn}</button>
                    ))}
                  </div>
               </div>
            </div>

            {/* CENTRO: EDITOR / DRIVE / CALENDAR */}
            <div className="flex-1 min-w-0 flex flex-col bg-black border-x border-white/5 p-1.5 space-y-1.5 items-center overflow-hidden">
               <div className="flex w-full max-w-[1100px] bg-[#0a0a0a] border border-white/5 rounded-2xl p-1 mb-1.5">
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
                 <div className="flex-1 w-full max-w-[1100px] bg-[#0a0a0a] border border-white/5 rounded-[24px] flex flex-col overflow-hidden shadow-2xl relative">
                      <div className="flex items-center gap-3 px-6 py-4 border-b border-white/5 bg-black/40 shrink-0">
                          <div className="flex items-center gap-1 px-2 border-r border-white/10 shrink-0">
                             <button onMouseDown={(e) => formatText('bold', null, e)} className="p-3 text-neutral-500 hover:text-white bg-white/5 rounded-xl"><Bold size={16}/></button>
                             <button onMouseDown={(e) => formatText('italic', null, e)} className="p-3 text-neutral-500 hover:text-white bg-white/5 rounded-xl"><Italic size={16}/></button>
                          </div>
                          <div className="flex items-center gap-2.5 px-2 border-r border-white/10 shrink-0">
                             <button onMouseDown={(e) => applyHighlight('#ef4444', e)} className="w-10 h-10 rounded-2xl bg-red-500 border-2 border-white/20 shadow-lg"></button>
                             <button onMouseDown={(e) => applyHighlight('#fbbf24', e)} className="w-10 h-10 rounded-2xl bg-amber-400 border-2 border-white/20 shadow-lg"></button>
                          </div>
                          <div className="flex-1 flex items-center gap-2 px-2 overflow-x-auto no-scrollbar">
                             {EDITOR_TAGS.map(tag => (
                               <button key={tag.name} onMouseDown={(e) => insertTag(e, tag.name, tag.bg, tag.text, tag.border)} className="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest shrink-0 transition-transform hover:scale-105" style={{ backgroundColor: tag.bg, color: tag.text, border: `1px solid ${tag.border}` }}>{tag.name}</button>
                             ))}
                          </div>
                      </div>
                      <div ref={editorRef} contentEditable="true" suppressContentEditableWarning={true} className="w-full flex-1 p-8 text-neutral-300 font-normal text-[15px] leading-relaxed editor-container outline-none mac-scrollbar overflow-y-auto" dangerouslySetInnerHTML={{ __html: activeMeeting.contenido || '<p><br></p>' }} onBlur={() => setActiveMeeting({...activeMeeting, contenido: editorRef.current.innerHTML})} />
                      <button onMouseDown={(e) => { e.preventDefault(); setShowAIModal(true); }} className="absolute bottom-16 right-8 px-5 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-full shadow-[0_10px_30px_rgba(168,85,247,0.5)] border border-white/10 flex items-center gap-2 text-[11px] font-black uppercase tracking-widest transition-all z-50 group">
                         <Sparkles size={16} className="animate-pulse" />
                         <span>IA Magic</span>
                      </button>
                 </div>
               )}
            </div>

            {/* PANEL DERECHO */}
            <div className="w-[260px] border-l shrink-0 bg-black border-white/5 flex flex-col p-1.5 space-y-1.5 overflow-y-auto mac-scrollbar">
               <div className="bg-[#0a0a0a] border border-white/5 rounded-xl p-3 shadow-xl flex flex-col flex-1 min-h-0 overflow-hidden">
                  <p className="text-[7px] text-neutral-700 font-black uppercase mb-2">Google Tasks</p>
                  <GoogleTasks token={token} />
               </div>
               <div className="bg-[#0a0a0a] border border-white/5 rounded-xl p-2.5 shadow-xl shrink-0">
                  <p className="text-[7px] text-neutral-700 font-black uppercase mb-2">Pipeline Status</p>
                  <div className="grid grid-cols-2 gap-1">
                    {(activeMeeting.pipeline || []).map(step => (
                      <button key={step.id} onClick={() => setActiveMeeting({...activeMeeting, pipeline: activeMeeting.pipeline.map(s => s.id === step.id ? {...s, done: !s.done} : s)})} className={`flex items-center gap-1.5 p-1 rounded-lg border transition-all ${step.done ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-white/5 border-white/5 text-neutral-800'}`}>
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
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4">
          <div className="bg-[#0a0a0a] border border-white/10 rounded-[40px] w-full max-w-2xl p-8 space-y-6">
            <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Perfil de Cliente</h3>
            <input type="text" value={newClient.nombre} onChange={e=>setNewClient({...newClient, nombre: e.target.value})} placeholder="Alias del Cliente" className="w-full bg-black border border-white/5 rounded-2xl p-4 text-white outline-none" />
            <footer className="flex gap-4">
               <button onClick={() => setIsClientModalOpen(false)} className="flex-1 py-4 text-neutral-600 font-black uppercase text-[10px]">Cerrar</button>
               <button onClick={handleCreateClient} className="flex-[2] py-4 bg-white text-black rounded-2xl font-black uppercase text-[10px]">Sincronizar</button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
};
export default MeetingStudio;
