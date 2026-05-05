import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Plus, Users, Video, PlayCircle, ArrowLeft, MessageSquare, Save, FileText, Eraser, 
  Hash, DollarSign, FolderOpen, ExternalLink, Quote, X, Trash2, Search, Mail, 
  Instagram, Youtube, Globe, CreditCard, Phone, Camera, Filter, MoreVertical,
  Calendar, CheckCircle2, Clock, User as UserIcon, Tag, Play, Pause, RotateCcw, 
  Layers, ListChecks, History, Timer, Scissors, Music, Palette, Share2, Activity,
  Calculator as CalcIcon, RefreshCw, AlertCircle, Check, Link, Target, ChevronRight,
  Zap, Copy, Smartphone, Monitor, Info, HardDrive, Megaphone, 
  Globe as GlobeIcon, File, FileVideo, Image as ImageIcon, Folder, ChevronLeft,
  Upload, Download, Bold, Italic, Strikethrough, List, CheckSquare, Table2, Heading1, Heading2,
  Facebook, Smartphone as TiktokIcon, Cloud, Sparkles, Type, Highlighter, TrendingUp, BarChart3,
  AlignLeft, AlignCenter, AlignRight, ListOrdered, ClipboardList, Briefcase, Edit3, Mail as MailIcon,
  Crown, Grid, LayoutGrid, Star, Gift, Shield, Building2, Terminal, Code2, Cpu, PieChart, TrendingDown
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import GoogleTasks from '../components/GoogleTasks';
import { getDriveFiles, getCalendarEvents, getCalendarList, uploadFileToDrive, downloadDriveFile, deleteDriveFile, createCalendarEvent } from '../lib/googleApi';
import { aiService } from '../services/aiService';

const MeetingStudio = ({ meetingsList = [], setMeetingsList, settings = {}, token }) => {
  const colors = {
    bg: 'bg-[#050505]',
    card: 'bg-[#0a0a0a] border-white/5 shadow-2xl',
    text: 'text-neutral-200',
    textMuted: 'text-neutral-500',
    accent: '#10b981', 
    accentGlow: 'shadow-[0_0_25px_rgba(16,185,129,0.2)]',
    border: 'border-white/5',
    input: 'bg-[#0d0d0d] border-white/5 text-white',
    innerBg: 'bg-[#030303]'
  };

  const [viewState, setViewState] = useState('client-list'); 
  const [activeClient, setActiveClient] = useState(null);
  const [activeMeeting, setActiveMeeting] = useState(null);
  const [sessionTab, setSessionTab] = useState('editor'); 
  const [clients, setClients] = useState([]);
  const [clientSearch, setClientSearch] = useState('');
  const [meetingSearch, setMeetingSearch] = useState(''); 
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [time, setTime] = useState(0);
  const [calcDisplay, setCalcDisplay] = useState('0');
  const editorRef = useRef(null);
  const timerRef = useRef(null);
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const [companies, setCompanies] = useState([]);
  const [activeAgencyPlan, setActiveAgencyPlan] = useState('Todos'); 
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [newCompany, setNewCompany] = useState({ nombre_empresa: '', dueño: '', email: '', telefono: '', plan: 'Básico', drive_url: '' });

  const [newClient, setNewClient] = useState({ nombre: '', email: '', pais: '' });

  const [roasCalc, setRoasCalc] = useState({ spend: '', revenue: '' });
  const [funnelSteps, setFunnelSteps] = useState([
    { id: 1, label: 'Awareness', count: 1000 },
    { id: 2, label: 'Interest', count: 450 },
    { id: 3, label: 'Conversion', count: 85 }
  ]);

  useEffect(() => { fetchClients(); fetchCompanies(); fetchMeetings(); }, []);

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

  const fetchCompanies = async () => {
    try {
      const { data, error } = await supabase.from('clientes_editor').select('*').not('empresa', 'is', null);
      if (error) throw error;
      const formatted = (data || []).map(c => ({ id: c.id, nombre_empresa: c.empresa, dueño: c.nombre, email: c.email, plan: c.plan_agencia || 'Básico', drive_url: '#' }));
      setCompanies(formatted);
    } catch (e) { console.error(e); }
  };

  const fetchMeetings = async () => {
    try {
      const { data, error } = await supabase.from('reuniones').select('*').order('fecha', { ascending: false });
      if (error) throw error;
      setMeetingsList(data || []);
    } catch (e) { console.error(e); }
  };

  const normalizeText = (text) => (text || '').toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  const handleCreateClient = async () => {
    if (!newClient.nombre) return;
    setLoading(true);
    try {
      // ÚNICAS COLUMNAS VERIFICADAS: nombre, email, pais
      const clientData = { nombre: newClient.nombre, email: newClient.email, pais: newClient.pais };
      const { error } = await supabase.from('clientes_editor').insert(clientData);
      if (error) throw error;
      await fetchClients();
      setIsClientModalOpen(false);
      setNewClient({ nombre: '', email: '', pais: '' });
    } catch (e) { alert("Error DB: " + e.message); }
    setLoading(false);
  };

  const openClientProfile = (client) => { setActiveClient(client); setViewState('client-profile'); };

  const openMeeting = (meeting) => { 
    const meta = meeting.metadata || {};
    setActiveMeeting({
      ...meeting,
      session_title: meeting.session_title || 'Edición',
      // Mapeo desde metadata para UI
      pipeline: meta.pipeline || [{ id: 1, label: 'Corte Bruto', done: false }, { id: 2, label: 'Color Grade', done: false }, { id: 3, label: 'SFX/Mix', done: false }, { id: 4, label: 'Export Final', done: false }],
      hitos_pago: meta.hitos_pago || [],
      mood_board: meta.mood_board || [],
      brand_kit: meta.brand_kit || { colors: [], logos: [] },
      priority: meta.priority || 'Baja',
      revision_version: meta.revision_version || 'V1'
    }); 
    setTime(meeting.total_time || 0);
    setViewState('session'); 
  };

  const createMeeting = async () => {
    if (!activeClient) return;
    const sTitle = prompt('Descripción:', 'Edición de Video');
    if (!sTitle) return;
    const newMeetingPayload = { 
      id: crypto.randomUUID(), 
      cliente_id: activeClient.id, 
      cliente: activeClient.nombre, 
      fecha: new Date().toISOString().split('T')[0], 
      session_title: sTitle,
      contenido: '<p><br></p>', 
      total_time: 0, 
      metadata: { priority: 'Baja', revision_version: 'V1' }
    };
    try { 
      await supabase.from('reuniones').insert(newMeetingPayload); 
      await fetchMeetings(); 
      openMeeting(newMeetingPayload); 
    } catch (error) { alert(error.message); }
  };

  const saveMeeting = async () => {
    if (!activeMeeting) return;
    setLoading(true);
    try {
      const finalContent = editorRef.current ? editorRef.current.innerHTML : (activeMeeting.contenido || '');
      
      // EMPAQUETAR TODO EN METADATA (EVITAR COLUMNAS INEXISTENTES)
      const metadata = { 
        pipeline: activeMeeting.pipeline, 
        hitos_pago: activeMeeting.hitos_pago,
        mood_board: activeMeeting.mood_board,
        brand_kit: activeMeeting.brand_kit,
        priority: activeMeeting.priority || 'Baja',
        revision_version: activeMeeting.revision_version || 'V1'
      };

      // COLUMNAS 100% VERIFICADAS POR EL HISTORIAL DE ERRORES
      const cleanPayload = {
        id: activeMeeting.id,
        cliente_id: activeMeeting.cliente_id,
        cliente: activeMeeting.cliente,
        fecha: activeMeeting.fecha,
        session_title: activeMeeting.session_title,
        contenido: finalContent,
        total_time: time,
        metadata: metadata 
      };

      const { error } = await supabase.from('reuniones').upsert(cleanPayload);
      if (error) throw error;
      
      await fetchMeetings(); setViewState('client-profile'); setActiveMeeting(null); setIsTimerRunning(false);
    } catch (e) { alert("Error Sincronización: " + e.message); }
    setLoading(false);
  };

  const uniqueClients = useMemo(() => {
    return (clients || []).filter(c => normalizeText(c.nombre).includes(normalizeText(clientSearch)));
  }, [clients, clientSearch]);

  const filteredMeetings = useMemo(() => {
    if (!activeClient) return [];
    const activeName = normalizeText(activeClient.nombre);
    return (meetingsList || []).filter(m => {
      const mName = normalizeText(m.cliente);
      return mName === activeName || m.cliente_id === activeClient.id;
    }).filter(m => normalizeText(m.session_title).includes(normalizeText(meetingSearch)));
  }, [meetingsList, meetingSearch, activeClient]);

  const totalTimeWorked = useMemo(() => filteredMeetings.reduce((acc, curr) => acc + (curr.total_time || 0), 0), [filteredMeetings]);

  const AGENCY_PLANS = [{ name: 'Básico', icon: <Shield size={16}/>, color: '#10b981' }, { name: 'Intermedio', icon: <Zap size={16}/>, color: '#10b981' }, { name: 'Avanzado', icon: <Crown size={16}/>, color: '#10b981' }, { name: 'Personalizado', icon: <Sparkles size={16}/>, color: '#10b981' }];

  const formatTime = (s) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const handleCalc = (val) => {
    if (val === '=') { try { setCalcDisplay(eval(calcDisplay).toString()); } catch (e) { setCalcDisplay('ERR'); } }
    else if (val === 'C') setCalcDisplay('0');
    else setCalcDisplay(prev => prev === '0' ? val : prev + val);
  };

  return (
    <div className={`flex flex-col h-screen w-full ${colors.bg} ${colors.text} overflow-hidden selection:bg-emerald-500/30`}>
      {/* NAVBAR */}
      <nav className="h-14 border-b border-white/5 flex items-center justify-between px-6 bg-black/40 backdrop-blur-3xl relative z-50">
         <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
               <div className="w-8 h-8 bg-neutral-900 rounded-lg flex items-center justify-center border border-white/10 shadow-[0_0_15px_rgba(16,185,129,0.2)]"><Terminal size={16} className="text-[#10b981]"/></div>
               <h1 className="text-[10px] font-black tracking-widest uppercase">Sovereign <span className="text-neutral-600">Pro</span></h1>
            </div>
            <div className="flex bg-black/60 rounded-xl p-1 border border-white/5">
                <button onClick={() => setViewState('client-list')} className={`px-5 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${viewState.includes('client') || viewState === 'session' ? 'bg-[#10b981] text-white' : 'text-neutral-700 hover:text-white'}`}>Editor Pro</button>
                <button onClick={() => setViewState('agency-hub')} className={`px-5 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${viewState.includes('agency') ? 'bg-[#10b981] text-white' : 'text-neutral-700 hover:text-white'}`}>Agencia</button>
            </div>
         </div>
         <div className="flex items-center gap-6"><div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/5"><div className="w-1 h-1 rounded-full bg-[#10b981] animate-pulse"></div><span className="text-[7px] font-black text-neutral-500 uppercase">Live Node</span></div><div className="w-8 h-8 rounded-full bg-neutral-900 border border-white/10 flex items-center justify-center overflow-hidden"><UserIcon size={14} className="text-neutral-700"/></div></div>
      </nav>

      {viewState === 'client-list' && (
        <div className="flex-1 overflow-y-auto mac-scrollbar p-6 space-y-6 max-w-[1400px] mx-auto w-full animate-in fade-in duration-500">
           <header className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Producción <span className="text-[#10b981]">Nexus</span></h2>
              <div className="flex gap-3">
                 <div className="relative"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-800" size={14}/><input type="text" value={clientSearch} onChange={e=>setClientSearch(e.target.value)} placeholder="Filtrar..." className="bg-white/[0.02] border border-white/5 rounded-xl py-2 pl-10 pr-4 text-[9px] font-bold w-44 uppercase" /></div>
                 <button onClick={() => setIsClientModalOpen(true)} className="px-5 py-2.5 bg-white text-black rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-[#10b981] hover:text-white transition-all"><Plus size={14} strokeWidth={3}/> Nuevo Perfil</button>
              </div>
           </header>
           <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {uniqueClients.map(c => (
                <div key={c.id} onClick={() => openClientProfile(c)} className="bg-[#0a0a0a] border border-white/5 rounded-xl p-4 hover:border-[#10b981]/40 transition-all cursor-pointer flex flex-col items-center group">
                   <div className="w-12 h-12 rounded-full bg-neutral-950 border border-white/5 mb-3 flex items-center justify-center text-xs font-black text-neutral-800">{c.nombre.charAt(0)}</div>
                   <p className="text-[9px] font-black text-white uppercase tracking-tight truncate w-full text-center">{c.nombre}</p>
                   <div className="mt-4 w-full pt-3 border-t border-white/5 flex items-center justify-between"><div className="flex gap-0.5">{[...Array(3)].map((_,i)=><Star key={i} size={6} fill="#10b981" className="text-[#10b981]"/>)}</div><span className="text-[6px] font-black text-[#10b981] uppercase">READY</span></div>
                </div>
              ))}
           </div>
        </div>
      )}

      {viewState === 'client-profile' && activeClient && (
        <div className="flex-1 flex flex-col overflow-hidden animate-in slide-in-from-right duration-500">
           <header className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-black/20">
              <div className="flex items-center gap-6">
                 <button onClick={() => setViewState('client-list')} className="w-9 h-9 bg-white/5 rounded-lg flex items-center justify-center text-neutral-600 hover:text-[#10b981] transition-all border border-white/5"><ArrowLeft size={16}/></button>
                 <div><h3 className="text-xl font-black text-white uppercase leading-none">{activeClient.nombre}</h3><p className="text-[8px] text-neutral-700 font-black uppercase mt-1 tracking-widest">{activeClient.pais}</p></div>
              </div>
              <button onClick={createMeeting} className="px-6 py-2.5 bg-white text-black rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-[#10b981] hover:text-white transition-all shadow-xl"><Video size={14}/> Nueva Sesión</button>
           </header>
           <div className="flex-1 overflow-y-auto mac-scrollbar p-6 space-y-6 max-w-[1200px] mx-auto w-full">
              <div className="grid grid-cols-4 gap-3">
                 <div className="bg-[#0a0a0a] border border-white/5 p-4 rounded-xl"><p className="text-[8px] text-neutral-700 font-black uppercase mb-1">Time Log</p><h5 className="text-lg font-black text-white font-mono">{formatTime(totalTimeWorked)}</h5></div>
                 <div className="bg-[#0a0a0a] border border-white/5 p-4 rounded-xl"><p className="text-[8px] text-neutral-700 font-black uppercase mb-1">Sesiones</p><h5 className="text-lg font-black text-white font-mono">{filteredMeetings.length}</h5></div>
                 <div className="col-span-2 bg-[#10b981]/5 border border-[#10b981]/10 p-4 rounded-xl flex items-center justify-between"><div><p className="text-[8px] text-[#10b981] font-black uppercase mb-1">Status</p><h4 className="text-xs font-black text-white uppercase tracking-tighter">Bóveda Sincronizada</h4></div><div className="flex -space-x-2">{[...Array(3)].map((_,i)=><div key={i} className="w-7 h-7 rounded-full border-2 border-[#050505] bg-neutral-900"></div>)}</div></div>
              </div>
              <div className="space-y-2">
                 {filteredMeetings.map(m => (
                    <div key={m.id} className="bg-[#0a0a0a] border border-white/5 rounded-xl p-4 flex items-center justify-between hover:border-white/10 transition-all">
                       <div className="flex items-center gap-6"><div className="w-10 h-10 bg-neutral-950 rounded-lg flex items-center justify-center text-[#10b981] border border-white/5"><FileVideo size={18}/></div><div><h4 className="text-sm font-black text-white uppercase mb-1">{m.session_title}</h4><p className="text-[8px] font-black text-neutral-700 uppercase">{m.fecha}</p></div></div>
                       <div className="flex items-center gap-6"><p className="text-xs font-black text-white font-mono">{formatTime(m.total_time || 0)}</p><button onClick={() => openMeeting(m)} className="px-4 py-2 bg-white/5 hover:bg-white text-neutral-700 hover:text-black font-black text-[8px] uppercase tracking-widest rounded-lg transition-all">Abrir</button></div>
                    </div>
                 ))}
              </div>
           </div>
        </div>
      )}

      {viewState === 'session' && activeMeeting && (
        <div className="flex-1 flex flex-col overflow-hidden animate-in fade-in duration-500 bg-[#050505]">
           <header className="px-6 py-3 border-b border-white/5 flex items-center justify-between bg-black/40 backdrop-blur-xl">
              <div className="flex items-center gap-5">
                 <button onClick={saveMeeting} className="w-9 h-9 bg-white/5 rounded-lg flex items-center justify-center text-neutral-700 hover:text-[#10b981] transition-all"><ArrowLeft size={18}/></button>
                 <div><h3 className="text-sm font-black text-white uppercase tracking-tight">{activeMeeting.session_title}</h3><p className="text-[7px] text-neutral-700 font-black uppercase tracking-widest mt-1">Obsidian Workspace</p></div>
              </div>
              <div className="flex items-center gap-3"><div className="flex items-center gap-3 bg-black/50 border border-white/5 rounded-lg px-4 py-1.5"><p className="text-sm font-mono font-black text-white">{formatTime(time)}</p><button onClick={()=>setIsTimerRunning(!isTimerRunning)} className="w-6 h-6 rounded bg-[#10b981] text-white flex items-center justify-center">{isTimerRunning ? <Pause size={12}/> : <Play size={12}/>}</button></div><button onClick={saveMeeting} className="px-6 py-2 bg-[#10b981] text-white text-[9px] font-black rounded-lg uppercase shadow-xl hover:bg-white hover:text-black transition-all">Sincronizar</button></div>
           </header>
           <div className="flex-1 flex p-3 gap-3 overflow-hidden">
              <aside className="w-60 h-full shrink-0 flex flex-col space-y-3 overflow-y-auto mac-scrollbar pr-1">
                 <div className="bg-[#0a0a0a] border border-white/5 p-4 rounded-xl"><p className="text-[8px] text-neutral-700 font-black uppercase mb-3 flex items-center gap-2"><CalcIcon size={12} className="text-[#10b981]"/> Calc</p><div className="bg-[#030303] border border-white/5 rounded-lg p-3 text-right text-lg font-mono text-white mb-3">{calcDisplay}</div><div className="grid grid-cols-4 gap-1">{['C','/','*','-','7','8','9','+','4','5','6','=','1','2','3','.'].map(btn=><button key={btn} onClick={()=>handleCalc(btn)} className={`h-8 rounded text-[9px] font-black ${btn === '=' ? 'bg-[#10b981] text-white' : 'bg-white/5 text-neutral-600 hover:text-white'}`}>{btn}</button>)}</div></div>
                 <div className="bg-[#0a0a0a] border border-white/5 p-4 rounded-xl"><p className="text-[8px] text-neutral-700 font-black uppercase mb-3 flex items-center gap-2"><Activity size={12} className="text-[#10b981]"/> Pipeline</p><div className="space-y-1.5">{(activeMeeting.pipeline || []).map(s=><button key={s.id} onClick={()=>setActiveMeeting({...activeMeeting, pipeline: activeMeeting.pipeline.map(x=>x.id===s.id?{...x, done:!x.done}:x)})} className={`w-full flex items-center gap-2 p-2 rounded-lg border transition-all ${s.done ? 'bg-[#10b981]/10 border-[#10b981]/20 text-[#10b981]' : 'bg-white/[0.02] border-white/5 text-neutral-800'}`}><div className={`w-3 h-3 rounded flex items-center justify-center shrink-0 ${s.done ? 'bg-[#10b981] text-black' : 'bg-white/5 border border-white/10'}`}>{s.done && <Check size={10} strokeWidth={4}/>}</div><span className="text-[8px] font-black uppercase tracking-widest truncate">{s.label}</span></button>)}</div></div>
              </aside>
              <main className="flex-1 flex flex-col bg-[#0a0a0a] border border-white/5 rounded-2xl overflow-hidden relative shadow-2xl">
                 <div className="flex items-center justify-between px-6 py-2 bg-[#080808] border-b border-white/5 shrink-0">
                    <div className="flex items-center gap-4"><button onMouseDown={e=>{e.preventDefault(); document.execCommand('bold');}} className="p-2 text-neutral-700 hover:text-[#10b981] transition-all"><Bold size={14}/></button><div className="flex bg-black/60 rounded-lg p-1 border border-white/5">{['editor','mood','brand'].map(tab=><button key={tab} onClick={()=>setSessionTab(tab)} className={`px-3 py-1.5 rounded-md text-[7px] font-black uppercase ${sessionTab===tab?'bg-[#10b981] text-white':'text-neutral-700 hover:text-white'}`}>{tab}</button>)}</div></div>
                 </div>
                 <div className="flex-1 bg-[#050505] relative overflow-hidden">
                    {sessionTab === 'editor' && <div className="w-full h-full relative"><div ref={editorRef} contentEditable="true" suppressContentEditableWarning={true} className="w-full h-full p-12 text-neutral-400 font-medium text-base outline-none mac-scrollbar overflow-y-auto max-w-[850px] mx-auto" dangerouslySetInnerHTML={{ __html: activeMeeting.contenido || '<p><br></p>' }} /><button onMouseDown={e=>{e.preventDefault(); setShowAIModal(true);}} className="absolute bottom-6 right-6 w-12 h-12 bg-[#10b981] text-white rounded-full flex items-center justify-center hover:scale-110 transition-all"><Sparkles size={20}/></button></div>}
                    {sessionTab === 'mood' && <div className="w-full h-full p-6 grid grid-cols-3 gap-4 overflow-y-auto mac-scrollbar">{(activeMeeting.mood_board || []).map((img,i)=><div key={i} className="aspect-video bg-neutral-900 rounded-xl overflow-hidden border border-white/5 relative group"><img src={img} className="w-full h-full object-cover" alt="" /><button onClick={()=>setActiveMeeting({...activeMeeting, mood_board: activeMeeting.mood_board.filter((_,idx)=>idx!==i)})} className="absolute top-2 right-2 p-1 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-all"><X size={12}/></button></div>)}<button onClick={()=>{const url=prompt('URL:');if(url)setActiveMeeting({...activeMeeting, mood_board:[...(activeMeeting.mood_board||[]),url]});}} className="aspect-video border border-dashed border-white/10 rounded-xl flex items-center justify-center text-neutral-800 hover:text-[#10b981] transition-all">+</button></div>}
                    {sessionTab === 'brand' && <div className="w-full h-full p-8 overflow-y-auto mac-scrollbar"><div className="grid grid-cols-2 gap-8"><div className="bg-[#080808] p-8 rounded-2xl border border-white/5"><p className="text-[9px] text-neutral-700 font-black uppercase mb-6">Colores</p><div className="flex gap-3 flex-wrap">{(activeMeeting.brand_kit?.colors||[]).map((c,i)=><div key={i} className="w-14 h-14 rounded-xl border border-white/10 relative group" style={{backgroundColor:c}}><button onClick={()=>setActiveMeeting({...activeMeeting, brand_kit:{...activeMeeting.brand_kit, colors:activeMeeting.brand_kit.colors.filter((_,idx)=>idx!==i)}})} className="absolute -top-1 -right-1 p-1 bg-black rounded-full opacity-0 group-hover:opacity-100"><X size={10}/></button></div>)}<button onClick={()=>{const c=prompt('HEX:');if(c)setActiveMeeting({...activeMeeting, brand_kit:{...activeMeeting.brand_kit, colors:[...(activeMeeting.brand_kit.colors||[]),c]}})}} className="w-14 h-14 rounded-xl border border-dashed border-white/10 flex items-center justify-center text-neutral-800">+</button></div></div><div className="bg-[#080808] p-8 rounded-2xl border border-white/5"><p className="text-[9px] text-neutral-700 font-black uppercase mb-6">Logos</p><div className="grid grid-cols-2 gap-4">{(activeMeeting.brand_kit?.logos||[]).map((l,i)=><div key={i} className="h-20 bg-neutral-950 rounded-xl p-3 flex items-center justify-center relative group"><img src={l} className="max-h-full object-contain" alt="" /><button onClick={()=>setActiveMeeting({...activeMeeting, brand_kit:{...activeMeeting.brand_kit, logos:activeMeeting.brand_kit.logos.filter((_,idx)=>idx!==i)}})} className="absolute top-1 right-1 p-1 bg-black rounded-full opacity-0 group-hover:opacity-100"><X size={10}/></button></div>)}<button onClick={()=>{const l=prompt('URL:');if(l)setActiveMeeting({...activeMeeting, brand_kit:{...activeMeeting.brand_kit, logos:[...(activeMeeting.brand_kit.logos||[]),l]}})}} className="h-20 border border-dashed border-white/10 rounded-xl flex items-center justify-center text-neutral-800">+</button></div></div></div></div>}
                 </div>
              </main>
           </div>
        </div>
      )}

      {viewState === 'agency-hub' && (
        <div className="flex-1 overflow-y-auto mac-scrollbar p-8 space-y-8 max-w-[1400px] mx-auto w-full animate-in fade-in duration-700 bg-[#050505]">
           <header className="flex justify-between items-center border-b border-white/5 pb-6"><h2 className="text-xl font-black text-white uppercase tracking-tighter">Hub de <span className="text-[#10b981]">Estrategia</span></h2><button onClick={()=>setIsCompanyModalOpen(true)} className="px-6 py-2.5 bg-[#10b981] text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-xl flex items-center gap-2"><Plus size={14} strokeWidth={3}/> Nuevo Proyecto</button></header>
           <div className="flex gap-3 bg-black/40 p-1.5 rounded-2xl border border-white/5"><button onClick={()=>setActiveAgencyPlan('Todos')} className={`flex-1 py-3 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all ${activeAgencyPlan==='Todos'?'bg-[#10b981] text-white shadow-lg':'text-neutral-700 hover:text-white'}`}>Todos</button>{AGENCY_PLANS.map((p,i)=><button key={i} onClick={()=>setActiveAgencyPlan(p.name)} className={`flex-1 py-3 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all ${activeAgencyPlan===p.name?'bg-[#10b981] text-white shadow-lg':'text-neutral-700 hover:text-white'}`}>{p.icon} {p.name}</button>)}</div>
           <div className="grid grid-cols-3 gap-4">
              {filteredCompanies.map((company, i) => (
                <div key={i} onClick={()=>{setSelectedCompany(company); setViewState('agency-session');}} className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6 hover:border-[#10b981]/30 transition-all cursor-pointer group flex flex-col justify-between h-44 shadow-2xl">
                   <div className="flex justify-between items-start"><div><h4 className="text-base font-black text-white uppercase truncate">{company.nombre_empresa}</h4><p className="text-[8px] text-neutral-700 font-black uppercase">{company.dueño}</p></div><div className="px-2 py-0.5 bg-[#10b981]/10 border border-[#10b981]/20 rounded-md text-[7px] font-black text-[#10b981] uppercase">{company.plan}</div></div>
                   <div className="flex gap-3"><button className="flex-1 py-3 bg-white/5 hover:bg-white text-neutral-700 hover:text-black font-black text-[8px] uppercase tracking-widest rounded-xl transition-all border border-white/5 flex items-center justify-center gap-2"><FolderOpen size={14}/> Estrategia</button><button className="w-12 h-12 bg-white/5 hover:bg-[#10b981] text-white rounded-xl flex items-center justify-center transition-all border border-white/5"><Phone size={16}/></button></div>
                </div>
              ))}
           </div>
        </div>
      )}

      {showAIModal && (
        <div className="fixed inset-0 z-[700] flex items-center justify-center bg-black/95 backdrop-blur-3xl p-6 animate-in zoom-in duration-300"><div className="bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] p-10 w-full max-w-xl shadow-2xl"><h4 className="text-xl font-black text-white uppercase mb-6 flex items-center gap-3"><Sparkles className="text-[#10b981]" size={24}/> Oracle</h4><textarea autoFocus value={aiPrompt} onChange={e=>setAiPrompt(e.target.value)} className="w-full bg-[#0d0d0d] border border-white/5 rounded-2xl p-6 text-sm outline-none h-44 resize-none mb-6 text-neutral-300 font-mono" placeholder="Instrucción..." /><div className="flex gap-4"><button onClick={()=>setShowAIModal(false)} className="flex-1 py-4 text-neutral-800 font-black uppercase text-[9px]">Cerrar</button><button onClick={async ()=>{if(!aiPrompt)return;setAiLoading(true);try{const s=await aiService.generateScript(aiPrompt,editorRef.current?.innerHTML||'','Marketing');document.execCommand('insertHTML',false,s.replace(/\n/g,'<br>')+'<br>');setShowAIModal(false);setAiPrompt('');}catch(e){alert(e.message);}setAiLoading(false);}} disabled={aiLoading||!aiPrompt} className="flex-[2] py-4 bg-[#10b981] text-white font-black rounded-2xl uppercase text-[9px] shadow-lg">Ejecutar</button></div></div></div>
      )}

      {isClientModalOpen && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center bg-black/95 backdrop-blur-2xl p-6 animate-in zoom-in duration-300"><div className="bg-[#0a0a0a] border border-white/10 rounded-[2rem] w-full max-w-md p-10 space-y-6 shadow-2xl"><h3 className="text-xl font-black text-white uppercase tracking-widest">Nexus <span className="text-[#10b981]">Identity</span></h3><div className="space-y-3"><input type="text" value={newClient.nombre} onChange={e=>setNewClient({...newClient, nombre: e.target.value})} placeholder="Nombre..." className="w-full bg-[#0d0d0d] border border-white/5 rounded-xl p-4 text-[11px] font-bold outline-none text-white uppercase" /><input type="email" value={newClient.email} onChange={e=>setNewClient({...newClient, email: e.target.value})} placeholder="Email..." className="w-full bg-[#0d0d0d] border border-white/5 rounded-xl p-4 text-[11px] font-bold outline-none text-white uppercase" /></div><div className="flex gap-4 pt-4"><button onClick={()=>setIsClientModalOpen(false)} className="flex-1 py-4 text-neutral-800 font-black uppercase text-[8px]">Cancelar</button><button onClick={handleCreateClient} className="flex-[2] py-4 bg-[#10b981] text-white rounded-xl font-black uppercase text-[8px] shadow-lg">Confirmar</button></div></div></div>
      )}

      {isCompanyModalOpen && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center bg-black/95 backdrop-blur-2xl p-6 animate-in zoom-in duration-300"><div className="bg-[#0a0a0a] border border-white/10 rounded-[2rem] w-full max-w-md p-10 space-y-6 shadow-2xl"><h3 className="text-xl font-black text-white uppercase">Vincular <span className="text-[#10b981]">Empresa</span></h3><div className="space-y-3"><input type="text" value={newCompany.nombre_empresa} onChange={e=>setNewCompany({...newCompany, nombre_empresa: e.target.value})} placeholder="Nombre Empresa..." className="w-full bg-[#0d0d0d] border border-white/5 rounded-xl p-4 text-[11px] font-bold outline-none text-white uppercase" /><select value={newCompany.plan} onChange={e=>setNewCompany({...newCompany, plan: e.target.value})} className="w-full bg-[#0d0d0d] border border-white/5 rounded-xl p-4 text-[11px] font-bold outline-none text-white uppercase">{AGENCY_PLANS.map(p=><option key={p.name} value={p.name}>{p.name}</option>)}</select></div><div className="flex gap-4 pt-4"><button onClick={()=>setIsCompanyModalOpen(false)} className="flex-1 py-4 text-neutral-800 font-black uppercase text-[8px]">Cerrar</button><button onClick={()=>{setCompanies([...companies, newCompany]); setIsCompanyModalOpen(false);}} className="flex-[2] py-4 bg-[#10b981] text-white rounded-xl font-black uppercase text-[8px] shadow-lg">Registrar</button></div></div></div>
      )}
    </div>
  );
};
export default MeetingStudio;
