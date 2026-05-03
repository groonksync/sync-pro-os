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
  AlignLeft, AlignCenter, AlignRight, ListOrdered
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
  const [sessionTab, setSessionTab] = useState('editor');
  
  const [clients, setClients] = useState([]);
  const [clientSearch, setClientSearch] = useState('');
  const [meetingSearch, setMeetingSearch] = useState(''); 
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [driveFiles, setDriveFiles] = useState([]);
  const [driveLoading, setDriveLoading] = useState(false);
  const [sessionFolder, setSessionFolder] = useState({ id: 'root', name: 'Mi Unidad' });

  const [calendarEvents, setCalendarEvents] = useState([]);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [currentCalDate, setCurrentCalDate] = useState(new Date());
  
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

  useEffect(() => {
    if (viewState === 'session') {
      if (sessionTab === 'drive') fetchDriveFiles();
      if (sessionTab === 'calendar') loadCalendarEvents();
    }
  }, [sessionTab, viewState, sessionFolder]);

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
      mood: meeting.mood || 'Cinematic'
    }); 
    setTime(meeting.total_time || 0);
    setViewState('session'); 
  };

  const createMeeting = async () => {
    const sTitle = prompt('Descripción de la sesión:', 'Edición de Video');
    if (sTitle === null) return;
    const newMeeting = { 
      id: crypto.randomUUID(), cliente_id: activeClient.id, cliente: activeClient.nombre, fecha: new Date().toISOString().split('T')[0], session_title: sTitle,
      contenido: '<p><br></p>', total_time: 0, priority: 'Baja', revision_version: 'V1', mood: 'Cinematic'
    };
    try { await supabase.from('reuniones').insert(newMeeting); await fetchMeetings(activeClient.id); openMeeting(newMeeting); } catch (error) { alert(error.message); }
  };

  const deleteMeeting = async (id, e) => {
    e.stopPropagation();
    if (!confirm('¿Eliminar esta sesión permanentemente?')) return;
    try {
      await supabase.from('reuniones').delete().eq('id', id);
      await fetchMeetings(activeClient.id);
    } catch (error) { alert(error.message); }
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
    const html = `<span contenteditable="false" style="background-color: ${colorBg}; color: ${colorText}; border: 1px solid ${colorBorder}; padding: 3px 10px; border-radius: 12px; font-size: 10px; font-weight: 900; text-transform: uppercase; margin: 0 4px; display: inline-flex; align-items: center; justify-content: center; vertical-align: middle; letter-spacing: 0.05em;">${tagName}</span>&nbsp;`;
    document.execCommand('insertHTML', false, html);
    editorRef.current.focus();
  };

  const EDITOR_TAGS = [
    { name: 'Guion', bg: 'rgba(59, 130, 246, 0.1)', text: '#60a5fa', border: 'rgba(59, 130, 246, 0.3)' },
    { name: 'Video', bg: 'rgba(239, 68, 68, 0.1)', text: '#f87171', border: 'rgba(239, 68, 68, 0.3)' },
    { name: 'Audio', bg: 'rgba(16, 185, 129, 0.1)', text: '#10b981', border: 'rgba(16, 185, 129, 0.3)' },
    { name: 'FX', bg: 'rgba(245, 158, 11, 0.1)', text: '#f59e0b', border: 'rgba(245, 158, 11, 0.3)' },
    { name: 'Render', bg: 'rgba(99, 102, 241, 0.1)', text: '#6366f1', border: 'rgba(99, 102, 241, 0.3)' },
    { name: 'Story', bg: 'rgba(236, 72, 153, 0.1)', text: '#ec4899', border: 'rgba(236, 72, 153, 0.3)' },
    { name: 'IA', bg: 'rgba(168, 85, 247, 0.1)', text: '#c084fc', border: 'rgba(168, 85, 247, 0.3)' }
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
    <div className="flex flex-col h-screen w-full bg-[#050505] text-white overflow-hidden animate-in fade-in duration-700 font-sans tracking-tight">
      
      {/* VISTA: LISTA DE CLIENTES */}
      {viewState === 'client-list' && (
        <div className="p-10 space-y-10 overflow-y-auto mac-scrollbar h-full max-w-[1800px] mx-auto w-full">
          <header className="flex justify-between items-end pb-12 border-b border-white/5">
            <div>
              <p className="text-[12px] text-neutral-600 font-black uppercase tracking-[0.5em] mb-4">Sovereign OS • Production Intelligence</p>
              <h2 className="text-7xl font-black text-white tracking-tighter uppercase leading-none">Editor <span className="text-neutral-900">Suite</span></h2>
            </div>
            <button onClick={() => setIsClientModalOpen(true)} className="px-12 py-5 bg-white text-black rounded-3xl font-black text-[13px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-[0_20px_50px_rgba(255,255,255,0.1)] flex items-center gap-4">
              <Plus size={20} strokeWidth={3}/> Nuevo Cliente
            </button>
          </header>
          <div className="relative group">
            <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-neutral-800 group-focus-within:text-white transition-colors" size={24}/>
            <input type="text" value={clientSearch} onChange={e=>setClientSearch(e.target.value)} placeholder="Identificar talento o proyecto..." className="w-full bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] py-8 pl-20 pr-8 text-xl text-white outline-none focus:border-white/10 transition-all shadow-2xl font-medium" />
          </div>
          <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {filteredClients.map(client => (
              <div key={client.id} onClick={() => openClientProfile(client)} className="bg-[#0a0a0a] border border-white/5 rounded-[4rem] p-12 hover:bg-white/[0.03] cursor-pointer transition-all flex flex-col items-center text-center group active:scale-95 shadow-2xl relative border-b-4 border-b-transparent hover:border-b-white/10">
                <div className="w-36 h-36 mb-10 rounded-[3rem] bg-white/5 flex items-center justify-center border border-white/5 shadow-inner overflow-hidden group-hover:scale-110 transition-transform duration-500">
                  {client.foto_url ? <img src={client.foto_url} className="w-full h-full object-cover" alt="" /> : <UserIcon size={56} className="text-neutral-900" />}
                </div>
                <h4 className="text-2xl font-black text-white uppercase tracking-tighter mb-2 leading-none">{client.nombre}</h4>
                <p className="text-[11px] text-neutral-600 font-black uppercase tracking-[0.3em]">{client.pais || 'Global Project'}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VISTA: PERFIL CLIENTE */}
      {viewState === 'client-profile' && activeClient && (
        <div className="h-full flex flex-col overflow-hidden bg-black animate-in slide-in-from-right duration-700">
          <header className="px-12 py-10 bg-[#080808] border-b border-white/5 flex items-center justify-between relative z-10">
            <div className="flex items-center gap-10">
              <button onClick={() => setViewState('client-list')} className="w-16 h-16 bg-white/5 rounded-3xl flex items-center justify-center text-neutral-600 hover:text-white hover:bg-white/10 transition-all"><ArrowLeft size={32}/></button>
              <div>
                <h3 className="text-5xl font-black text-white uppercase tracking-tighter leading-none mb-4">{activeClient.nombre}</h3>
                <div className="flex items-center gap-6 text-neutral-600 font-black uppercase text-[11px] tracking-[0.3em]">
                   <span className="flex items-center gap-2 text-white/40"><Globe size={14}/> {activeClient.pais || 'Global'}</span>
                   <span className="flex items-center gap-2 text-white/40"><Building2 size={14}/> {activeClient.empresa || 'Corporate'}</span>
                </div>
              </div>
            </div>
            <button onClick={createMeeting} className="px-12 py-6 bg-white text-black rounded-[2rem] text-[13px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-2xl flex items-center gap-4">
              <Plus size={22} strokeWidth={3}/> Nueva Sesión
            </button>
          </header>

          <div className="flex-1 overflow-y-auto mac-scrollbar p-12 space-y-12 bg-black max-w-[1800px] mx-auto w-full">
               <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="bg-[#0a0a0a] border border-white/5 rounded-[3.5rem] p-10 flex items-center gap-8 shadow-2xl border-l-4 border-l-amber-500/20">
                     <div className="w-20 h-20 rounded-[2rem] bg-amber-500/5 flex items-center justify-center text-amber-500"><Clock size={40}/></div>
                     <div>
                        <p className="text-[12px] text-neutral-600 font-black uppercase tracking-widest mb-2">Acumulado</p>
                        <h5 className="text-4xl font-black text-white font-mono leading-none">{formatTime(totalTimeWorked).split(':')[0]}h {formatTime(totalTimeWorked).split(':')[1]}m</h5>
                     </div>
                  </div>
                  <div className="bg-[#0a0a0a] border border-white/5 rounded-[3.5rem] p-10 flex items-center gap-8 shadow-2xl border-l-4 border-l-blue-500/20">
                     <div className="w-20 h-20 rounded-[2rem] bg-blue-500/5 flex items-center justify-center text-blue-500"><Layers size={40}/></div>
                     <div>
                        <p className="text-[12px] text-neutral-600 font-black uppercase tracking-widest mb-2">Entregas</p>
                        <h5 className="text-4xl font-black text-white uppercase tracking-tighter leading-none">{meetingsList.length} <span className="text-neutral-900">Total</span></h5>
                     </div>
                  </div>
                  <div className="bg-[#0a0a0a] border border-white/5 rounded-[3.5rem] p-10 flex items-center gap-8 shadow-2xl border-l-4 border-l-emerald-500/20">
                     <div className="w-20 h-20 rounded-[2rem] bg-emerald-500/5 flex items-center justify-center text-emerald-500"><TrendingUp size={40}/></div>
                     <div>
                        <p className="text-[12px] text-neutral-600 font-black uppercase tracking-widest mb-2">Última Sesión</p>
                        <h5 className="text-4xl font-black text-white uppercase tracking-tighter leading-none">{meetingsList[0]?.fecha?.split('-')[2] || '00'} <span className="text-neutral-900">Ago</span></h5>
                     </div>
                  </div>
               </div>

               <div className="relative">
                  <Search className="absolute left-10 top-1/2 -translate-y-1/2 text-neutral-800" size={28}/>
                  <input type="text" value={meetingSearch} onChange={e=>setSessionSearch(e.target.value)} placeholder="Filtrar por fecha o descripción de proyecto..." className="w-full bg-[#0a0a0a] border border-white/5 rounded-[3rem] py-10 pl-24 pr-10 text-2xl text-white font-medium outline-none focus:border-white/10 transition-all shadow-2xl" />
               </div>

               <div className="grid gap-6">
                  {filteredMeetings.map(m => (
                    <div key={m.id} onClick={() => openMeeting(m)} className="bg-[#0a0a0a] border border-white/5 rounded-[3.5rem] p-10 hover:bg-white/[0.03] cursor-pointer transition-all flex items-center justify-between group shadow-2xl active:scale-[0.98] border-r-4 border-r-transparent hover:border-r-white/10">
                       <div className="flex items-center gap-10">
                          <div className="w-20 h-20 rounded-[2rem] bg-white/5 flex items-center justify-center text-neutral-900 group-hover:text-amber-500 transition-all border border-white/5 shadow-inner"><PlayCircle size={40}/></div>
                          <div>
                            <div className="flex items-center gap-5 mb-2">
                               <p className="text-3xl font-black text-white uppercase tracking-tighter">{m.fecha}</p>
                               <span className="px-5 py-2 bg-white/5 rounded-xl text-[11px] font-black text-emerald-500 uppercase tracking-widest border border-emerald-500/10">{m.revision_version || 'V1'}</span>
                            </div>
                            <p className="text-lg text-neutral-600 font-medium uppercase tracking-[0.2em]">{m.session_title || 'Video Production Project'}</p>
                          </div>
                       </div>
                       <div className="flex items-center gap-12">
                          <div className="text-right">
                             <p className="text-4xl font-black text-white font-mono leading-none mb-2">{formatTime(m.total_time || 0)}</p>
                             <p className="text-[10px] text-neutral-700 font-black uppercase tracking-[0.3em]">Duración Total</p>
                          </div>
                          <button onClick={(e) => deleteMeeting(m.id, e)} className="p-6 text-neutral-900 hover:text-rose-500 hover:bg-rose-500/5 rounded-[2rem] transition-all opacity-0 group-hover:opacity-100"><Trash2 size={28}/></button>
                          <ChevronRight size={32} className="text-neutral-900 group-hover:text-white transition-all group-hover:translate-x-3" />
                       </div>
                    </div>
                  ))}
               </div>
          </div>
        </div>
      )}

      {/* VISTA: WAR ROOM / EDITOR PROFESIONAL (REDESIGN RADICAL) */}
      {viewState === 'session' && activeMeeting && (
        <div className="flex-1 flex flex-col overflow-hidden bg-[#050505] animate-in fade-in duration-1000">
          <header className="px-10 py-8 border-b border-white/5 bg-[#0a0a0a] flex items-center justify-between shrink-0 relative z-50">
            <div className="flex items-center gap-8">
              <button onClick={saveMeeting} className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center text-neutral-600 hover:text-white transition-all"><ArrowLeft size={28}/></button>
              <div>
                <div className="flex items-center gap-4">
                   <h3 className="text-2xl font-black text-white uppercase tracking-tighter leading-none">{activeClient?.nombre}</h3>
                   <span className="text-neutral-800 text-3xl font-thin">/</span>
                   <input type="text" value={activeMeeting.session_title} onChange={e=>setActiveMeeting({...activeMeeting, session_title: e.target.value})} className="bg-transparent text-2xl font-black text-emerald-500 uppercase tracking-tighter outline-none w-auto min-w-[200px]" />
                   <div className="flex bg-white/5 rounded-xl p-1 border border-white/10 ml-4">
                     {['V1','V2','V3','FINAL'].map(v => (
                        <button key={v} onClick={()=>setActiveMeeting({...activeMeeting, revision_version: v})} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${activeMeeting.revision_version === v ? 'bg-amber-500 text-black shadow-lg' : 'text-neutral-600'}`}>{v}</button>
                     ))}
                   </div>
                </div>
                <p className="text-[10px] text-neutral-600 font-black uppercase tracking-[0.4em] mt-2">Sovereign Edition Suite • 16-Inch Professional Display</p>
              </div>
            </div>
            <div className="flex items-center gap-6">
               <div className="flex items-center gap-6 bg-black border border-white/5 rounded-2xl px-8 py-3 shadow-2xl">
                  <div className="flex flex-col items-end">
                     <p className="text-3xl font-mono font-black text-white leading-none">{formatTime(time)}</p>
                     <p className="text-[8px] text-neutral-800 font-black uppercase tracking-[0.3em] mt-1">Live Tracking</p>
                  </div>
                  <button onClick={() => setIsTimerRunning(!isTimerRunning)} className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${isTimerRunning ? 'bg-rose-500 text-white animate-pulse' : 'bg-white text-black hover:scale-105'}`}>
                    {isTimerRunning ? <Pause size={20} strokeWidth={3}/> : <Play size={20} strokeWidth={3} fill="currentColor"/>}
                  </button>
               </div>
               <button onClick={saveMeeting} className="px-12 py-5 bg-white text-black text-[13px] font-black rounded-3xl uppercase tracking-widest flex items-center gap-4 shadow-[0_20px_50px_rgba(255,255,255,0.05)] hover:scale-105 transition-all">
                <Save size={20} strokeWidth={3}/> Guardar Cambios
              </button>
            </div>
          </header>

          <div className="flex-1 flex p-6 gap-8 overflow-hidden max-w-[1900px] mx-auto w-full">
            
            {/* IZQUIERDA: HERRAMIENTAS (REDISEÑADAS Y AMPLIADAS) */}
            <div className="w-[380px] h-full shrink-0 flex flex-col space-y-8 overflow-y-auto mac-scrollbar pr-4">
               
               {/* CALCULADORA HUD PRO */}
               <div className="bg-[#0a0a0a] border border-white/5 rounded-[3rem] p-8 shadow-2xl">
                  <div className="flex items-center justify-between mb-6">
                    <p className="text-[12px] text-neutral-700 font-black uppercase tracking-[0.3em] flex items-center gap-3"><CalcIcon size={16}/> Business HUD</p>
                    <button onClick={()=>setCalcDisplay('0')} className="text-neutral-800 hover:text-white transition-all"><RefreshCw size={14}/></button>
                  </div>
                  <div className="bg-black border border-white/5 rounded-[2rem] p-8 text-right text-5xl font-mono font-black text-white mb-6 shadow-inner tracking-tighter overflow-hidden truncate">
                    {calcDisplay}
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    {['C','DEL','%','/','7','8','9','*','4','5','6','-','1','2','3','+','0','.','=','+'].slice(0,19).map(btn => (
                      <button key={btn} onClick={() => handleCalc(btn === 'C' ? 'C' : btn)} className={`h-16 rounded-2xl text-lg font-black transition-all ${btn === '=' ? 'bg-amber-500 text-black col-span-2' : btn === 'C' ? 'bg-rose-500/10 text-rose-500' : 'bg-white/5 text-neutral-500 hover:bg-white/10 hover:text-white'}`}>{btn}</button>
                    ))}
                    <button onClick={()=>handleCalc('=')} className="h-16 rounded-2xl text-lg font-black bg-white text-black hover:bg-neutral-200 transition-all col-span-2">=</button>
                  </div>
               </div>

               {/* OBJETIVOS ESTRATÉGICOS */}
               <div className="bg-[#0a0a0a] border border-white/5 rounded-[3rem] p-10 shadow-2xl flex-1 flex flex-col">
                  <p className="text-[12px] text-neutral-700 font-black uppercase tracking-[0.3em] mb-6 flex items-center gap-3"><Target size={18}/> Misión de Sesión</p>
                  <textarea 
                    value={activeMeeting.session_objective || ''} 
                    onChange={e=>setActiveMeeting({...activeMeeting, session_objective: e.target.value})} 
                    placeholder="Dicta aquí los objetivos técnicos para no perder el norte..." 
                    className="w-full flex-1 bg-black border border-white/5 rounded-[2rem] p-8 text-xl text-neutral-400 font-medium outline-none resize-none placeholder:text-neutral-900 leading-relaxed shadow-inner" 
                  />
               </div>

               {/* MOOD & PRIORIDAD */}
               <div className="bg-[#0a0a0a] border border-white/5 rounded-[3rem] p-8 shadow-2xl">
                  <p className="text-[12px] text-neutral-700 font-black uppercase tracking-[0.3em] mb-6 flex items-center gap-3"><Zap size={16}/> Prioridad</p>
                  <div className="grid grid-cols-2 gap-3">
                    {['Baja', 'Media', 'Alta', 'URGENTE'].map(p => (
                      <button key={p} onClick={()=>setActiveMeeting({...activeMeeting, priority: p})} className={`py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${activeMeeting.priority === p ? 'bg-white text-black' : 'bg-white/5 text-neutral-700 hover:text-white'}`}>{p}</button>
                    ))}
                  </div>
               </div>

            </div>

            {/* DERECHA: EDITOR EXPANDIDO (ESTILO APPLE NOTES) */}
            <div className="flex-1 flex flex-col bg-black border border-white/5 rounded-[4rem] overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,0.5)] relative">
               
               {/* TOOLBAR CLEAN */}
               <div className="flex items-center justify-between px-12 py-8 bg-[#0a0a0a] border-b border-white/5 shrink-0">
                  <div className="flex items-center gap-6">
                     <div className="flex items-center gap-2 pr-6 border-r border-white/10">
                        <button onMouseDown={(e) => formatText('formatBlock', '<h1>', e)} className="p-4 text-neutral-500 hover:text-white hover:bg-white/5 rounded-2xl transition-all"><Heading1 size={24}/></button>
                        <button onMouseDown={(e) => formatText('formatBlock', '<h2>', e)} className="p-4 text-neutral-500 hover:text-white hover:bg-white/5 rounded-2xl transition-all"><Heading2 size={24}/></button>
                     </div>
                     <div className="flex items-center gap-2 pr-6 border-r border-white/10">
                        <button onMouseDown={(e) => formatText('bold', null, e)} className="p-4 text-neutral-500 hover:text-white hover:bg-white/5 rounded-2xl transition-all"><Bold size={20}/></button>
                        <button onMouseDown={(e) => formatText('italic', null, e)} className="p-4 text-neutral-500 hover:text-white hover:bg-white/5 rounded-2xl transition-all"><Italic size={20}/></button>
                        <button onMouseDown={(e) => formatText('insertUnorderedList', null, e)} className="p-4 text-neutral-500 hover:text-white hover:bg-white/5 rounded-2xl transition-all"><List size={20}/></button>
                        <button onMouseDown={(e) => { e.preventDefault(); document.execCommand('insertHTML', false, '<div style="display:flex; align-items:center; gap:10px; margin: 10px 0;"><input type="checkbox" style="width:22px; height:22px; cursor:pointer;" /> <span contenteditable="true" style="outline:none;">Tarea de edición...</span></div>'); }} className="p-4 text-neutral-500 hover:text-white hover:bg-white/5 rounded-2xl transition-all"><CheckSquare size={20}/></button>
                     </div>
                     <div className="flex items-center gap-4 px-2">
                        <button onMouseDown={(e) => applyHighlight('#ef4444', e)} className="w-10 h-10 rounded-full bg-red-500 border-4 border-white/10 hover:scale-110 transition-all"></button>
                        <button onMouseDown={(e) => applyHighlight('#3b82f6', e)} className="w-10 h-10 rounded-full bg-blue-500 border-4 border-white/10 hover:scale-110 transition-all"></button>
                        <button onMouseDown={(e) => applyHighlight('#eab308', e)} className="w-10 h-10 rounded-full bg-yellow-500 border-4 border-white/10 hover:scale-110 transition-all"></button>
                        <button onMouseDown={(e) => applyHighlight('transparent', e)} className="p-3 text-neutral-800 hover:text-white"><Eraser size={20}/></button>
                     </div>
                  </div>
                  <div className="flex items-center gap-3">
                     <button onClick={()=>setSessionTab('editor')} className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${sessionTab === 'editor' ? 'bg-white text-black' : 'text-neutral-700 hover:text-white'}`}>Editor</button>
                     <button onClick={()=>setSessionTab('drive')} className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${sessionTab === 'drive' ? 'bg-white text-black' : 'text-neutral-700 hover:text-white'}`}>Nexus Drive</button>
                  </div>
               </div>

               {/* ETIQUETAS FLOTANTES SUPERIORES */}
               <div className="px-12 py-6 flex items-center gap-3 overflow-x-auto no-scrollbar bg-black/40 border-b border-white/5">
                  <p className="text-[9px] text-neutral-800 font-black uppercase tracking-[0.4em] mr-4 shrink-0">Tags Rápidos</p>
                  {EDITOR_TAGS.map(tag => (
                     <button key={tag.name} onMouseDown={(e) => insertTag(e, tag.name, tag.bg, tag.text, tag.border)} className="px-5 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-widest shrink-0 transition-all hover:scale-105 active:scale-95 shadow-lg border border-white/5" style={{ backgroundColor: tag.bg, color: tag.text, border: `1px solid ${tag.border}` }}>{tag.name}</button>
                  ))}
               </div>

               {/* ÁREA DE TEXTO (ESTILO APPLE NOTES / NOTION) */}
               <div className="flex-1 relative overflow-hidden bg-black/60">
                  <div 
                    ref={editorRef} 
                    contentEditable="true" 
                    suppressContentEditableWarning={true} 
                    className="w-full h-full p-20 text-white font-medium text-2xl leading-[1.6] editor-container outline-none mac-scrollbar overflow-y-auto max-w-[1200px] mx-auto selection:bg-amber-500/30" 
                    dangerouslySetInnerHTML={{ __html: activeMeeting.contenido || '<p><br></p>' }} 
                    onBlur={() => setActiveMeeting({...activeMeeting, contenido: editorRef.current.innerHTML})} 
                  />
                  
                  {/* IA MAGIC BOTÓN (MÁS DISCRETO Y ELEGANTE) */}
                  <button onMouseDown={(e) => { e.preventDefault(); setShowAIModal(true); }} className="absolute bottom-12 right-12 w-20 h-20 bg-purple-600 hover:bg-purple-500 text-white rounded-full shadow-[0_20px_60px_rgba(168,85,247,0.4)] flex items-center justify-center transition-all hover:scale-110 active:scale-95 group">
                     <Sparkles size={32} className="group-hover:animate-spin" />
                  </button>
               </div>

            </div>

          </div>
        </div>
      )}

      {/* MODALES RE-ESTILIZADOS */}
      {isClientModalOpen && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center bg-black/95 backdrop-blur-3xl p-10">
           <div className="bg-[#0a0a0a] border border-white/10 rounded-[5rem] w-full max-w-2xl p-20 space-y-10 shadow-[0_50px_100px_rgba(0,0,0,0.8)]">
                <h3 className="text-5xl font-black text-white uppercase tracking-tighter">Sovereign <span className="text-neutral-900">ID</span></h3>
                <input type="text" value={newClient.nombre} onChange={e=>setNewClient({...newClient, nombre: e.target.value})} placeholder="Nombre completo del cliente..." className="w-full bg-black border border-white/5 rounded-3xl p-8 text-2xl text-white outline-none focus:border-white/20 transition-all shadow-inner" />
                <div className="flex gap-6">
                   <button onClick={() => setIsClientModalOpen(false)} className="flex-1 py-8 text-neutral-600 font-black uppercase text-xs tracking-widest">Descartar</button>
                   <button onClick={handleCreateClient} className="flex-[2] py-8 bg-white text-black rounded-3xl font-black uppercase text-xs tracking-widest shadow-2xl active:scale-95 transition-all">Registrar Cliente</button>
                </div>
           </div>
        </div>
      )}

      {showAIModal && (
        <div className="fixed inset-0 z-[700] flex items-center justify-center bg-black/95 backdrop-blur-3xl p-10">
          <div className="bg-[#0a0a0a] border border-white/10 rounded-[6rem] p-24 w-full max-w-4xl shadow-2xl relative overflow-hidden">
            <div className="flex items-center gap-6 mb-12">
               <div className="w-20 h-20 bg-purple-600/20 rounded-3xl flex items-center justify-center text-purple-500"><Sparkles size={40}/></div>
               <h4 className="text-5xl font-black text-white uppercase tracking-tighter leading-none">IA Production <span className="text-neutral-900">Oracle</span></h4>
            </div>
            <textarea autoFocus value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} className="w-full bg-black border border-white/10 rounded-[4rem] p-12 text-2xl text-white outline-none h-64 resize-none mb-12 placeholder:text-neutral-900 leading-relaxed shadow-inner" placeholder="Pide una sugerencia, mejora de guion o idea creativa..." />
            <div className="flex gap-10">
              <button onClick={() => setShowAIModal(false)} className="flex-1 py-8 text-neutral-600 font-black uppercase text-xs tracking-widest">Cerrar</button>
              <button onClick={handleAISuggestion} disabled={aiLoading || !aiPrompt} className="flex-[2] py-8 bg-purple-600 text-white font-black rounded-[3rem] uppercase text-xs tracking-widest shadow-[0_20px_60px_rgba(168,85,247,0.3)] disabled:opacity-50 flex items-center justify-center gap-4 active:scale-95 transition-all">
                {aiLoading ? <RefreshCw className="animate-spin" size={20}/> : <Sparkles size={20}/>} {aiLoading ? 'Procesando...' : 'Ejecutar Comando'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default MeetingStudio;
