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
  Crown, Grid, LayoutGrid, Star, Gift, Shield, Building2
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import GoogleTasks from '../components/GoogleTasks';
import { aiService } from '../services/aiService';

const MeetingStudio = ({ meetingsList = [], setMeetingsList, settings = {}, token }) => {
  const isLight = settings.theme === 'light';
  
  const [viewState, setViewState] = useState('client-list'); 
  const [activeClient, setActiveClient] = useState(null);
  const [activeMeeting, setActiveMeeting] = useState(null);
  const [sessionTab, setSessionTab] = useState('editor'); 
  
  // ESTADO DE AGENCIA DE MARKETING
  const [activeAgencyPlan, setActiveAgencyPlan] = useState('Básico'); 
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [newCompany, setNewCompany] = useState({
    nombre_empresa: '', dueño: '', email: '', telefono: '', plan: 'Básico'
  });

  const [clients, setClients] = useState([]);
  const [clientSearch, setClientSearch] = useState('');
  const [meetingSearch, setMeetingSearch] = useState(''); 
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [time, setTime] = useState(0);
  const [calcDisplay, setCalcDisplay] = useState('0');
  const [editorContent, setEditorContent] = useState('');
  const editorRef = useRef(null);
  const timerRef = useRef(null);
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const [newClient, setNewClient] = useState({
    nombre: '', email: '', pais: '', empresa: '', status: 'Activo'
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

  const normalizeText = (text) => {
    if (!text) return "";
    return text.toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  };

  const handleCreateClient = async () => {
    if (!newClient.nombre) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('clientes_editor').insert([{ 
        nombre: newClient.nombre, email: newClient.email, pais: newClient.pais, 
        empresa: newClient.empresa, estado: 'Activo' 
      }]);
      if (error) throw error;
      await fetchClients();
      setIsClientModalOpen(false);
      setNewClient({ nombre: '', email: '', pais: '', empresa: '', status: 'Activo' });
    } catch (e) { alert(e.message); }
    setLoading(false);
  };

  const openClientProfile = (client) => { setActiveClient(client); fetchMeetings(); setViewState('client-profile'); };

  const [meetings, setMeetings] = useState([]);
  const fetchMeetings = async () => {
    try {
      const { data, error } = await supabase.from('reuniones').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setMeetings(data || []);
    } catch (e) { console.error(e); }
  };

  const openMeeting = (meeting) => { 
    setActiveMeeting(meeting); 
    setEditorContent(meeting.contenido || '<p><br></p>');
    setTime(meeting.total_time || 0);
    setViewState('session'); 
  };

  const createMeeting = async () => {
    const sTitle = prompt('Título de la sesión:', 'Edición de Video');
    if (!sTitle) return;
    const newMeeting = { 
      id: crypto.randomUUID(), cliente_id: activeClient.id, cliente: activeClient.nombre, 
      session_title: sTitle, contenido: '<p><br></p>', total_time: 0 
    };
    try { 
      await supabase.from('reuniones').insert(newMeeting); 
      await fetchMeetings(); 
      openMeeting(newMeeting); 
    } catch (error) { alert(error.message); }
  };

  const saveMeeting = async () => {
    if (!activeMeeting) return;
    setLoading(true);
    try {
      const finalContent = editorRef.current ? editorRef.current.innerHTML : activeMeeting.contenido;
      const updated = { ...activeMeeting, contenido: finalContent, total_time: time, updated_at: new Date().toISOString() };
      const { error } = await supabase.from('reuniones').upsert(updated);
      if (error) throw error;
      await fetchMeetings();
      setViewState('client-profile');
      setActiveMeeting(null);
      setIsTimerRunning(false);
    } catch (error) { alert(error.message); }
    setLoading(false);
  };

  // AGENCIA DE MARKETING: ESTADOS Y LÓGICA
  const [agencyClients, setAgencyClients] = useState([]);
  const [activeStrategy, setActiveStrategy] = useState(null);
  const [agencySearch, setAgencySearch] = useState('');

  useEffect(() => {
    if (viewState.includes('agency')) fetchAgencyClients();
  }, [viewState, activeAgencyPlan]);

  const fetchAgencyClients = async () => {
    try {
      const { data, error } = await supabase.from('clientes_agencia').select('*').eq('plan', activeAgencyPlan).order('created_at', { ascending: false });
      if (error) throw error;
      setAgencyClients(data || []);
    } catch (e) { console.error(e); }
  };

  const handleCreateAgencyClient = async () => {
    if (!newCompany.nombre_empresa) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('clientes_agencia').insert([{ ...newCompany, plan: activeAgencyPlan }]);
      if (error) throw error;
      await fetchAgencyClients();
      setIsCompanyModalOpen(false);
      setNewCompany({ nombre_empresa: '', dueño: '', email: '', telefono: '', plan: 'Básico' });
    } catch (e) { alert(e.message); }
    setLoading(false);
  };

  const [strategies, setStrategies] = useState([]);
  const fetchStrategies = async (companyId) => {
    try {
      const { data, error } = await supabase.from('estrategias_agencia').select('*').eq('cliente_agencia_id', companyId).order('created_at', { ascending: false });
      if (error) throw error;
      setStrategies(data || []);
    } catch (e) { console.error(e); }
  };

  const createStrategy = async () => {
    const title = prompt('Título de la estrategia:', 'Plan Estratégico');
    if (!title) return;
    const newStrat = { 
      id: crypto.randomUUID(), cliente_agencia_id: selectedCompany.id, titulo_estrategia: title, 
      contenido: '<p>Nueva fase estratégica...</p>', total_time: 0 
    };
    try { 
      await supabase.from('estrategias_agencia').insert(newStrat); 
      await fetchStrategies(selectedCompany.id);
      setActiveStrategy(newStrat);
      setViewState('agency-editor');
    } catch (error) { alert(error.message); }
  };

  const saveStrategy = async () => {
    if (!activeStrategy) return;
    setLoading(true);
    try {
      const finalContent = editorRef.current ? editorRef.current.innerHTML : activeStrategy.contenido;
      const updated = { ...activeStrategy, contenido: finalContent, total_time: time, updated_at: new Date().toISOString() };
      const { error } = await supabase.from('estrategias_agencia').upsert(updated);
      if (error) throw error;
      await fetchStrategies(selectedCompany.id);
      setViewState('agency-session');
      setActiveStrategy(null);
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

  const uniqueClients = useMemo(() => {
    return (clients || []).filter(c => normalizeText(c.nombre).includes(normalizeText(clientSearch)));
  }, [clients, clientSearch]);

  const filteredMeetings = useMemo(() => {
    return (meetings || []).filter(m => m.cliente_id === activeClient?.id && normalizeText(m.session_title).includes(normalizeText(meetingSearch)));
  }, [meetings, meetingSearch, activeClient]);

  const filteredAgencyClients = useMemo(() => {
    return (agencyClients || []).filter(c => normalizeText(c.nombre_empresa).includes(normalizeText(agencySearch)));
  }, [agencyClients, agencySearch]);

  const colors = {
    bg: isLight ? 'bg-[#f8fafc]' : 'bg-[#0b0c0e]',
    card: isLight ? 'bg-white border-slate-200 shadow-lg' : 'bg-[#121418] border-white/5 shadow-2xl',
    text: isLight ? 'text-slate-900' : 'text-white',
    textMuted: isLight ? 'text-slate-500' : 'text-neutral-500',
    border: isLight ? 'border-slate-200' : 'border-white/5',
    input: isLight ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-[#0d0f12] border-white/5 text-white',
    innerBg: isLight ? 'bg-slate-50' : 'bg-[#080808]'
  };

  return (
    <div className={`flex flex-col h-screen w-full ${colors.bg} ${colors.text} overflow-hidden font-sans transition-colors duration-500`}>
      <nav className="h-20 border-b border-white/5 flex items-center justify-between px-10 relative z-50 bg-black/20 backdrop-blur-3xl">
         <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-[#10b981] rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.4)]"><Briefcase size={20} className="text-white"/></div>
            <h1 className="text-xl font-black tracking-tighter uppercase">Sovereign <span className="text-neutral-500 italic">OS</span></h1>
         </div>
         <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/10 shadow-2xl">
            <button onClick={() => setViewState('client-list')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewState.includes('client') || viewState === 'session' ? 'bg-[#10b981] text-white shadow-lg' : 'text-neutral-600 hover:text-white'}`}><Video size={14}/> Editor Pro</button>
            <button onClick={() => setViewState('agency-hub')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewState.includes('agency') ? 'bg-amber-500 text-white shadow-lg' : 'text-neutral-600 hover:text-white'}`}><Briefcase size={14}/> Agencia</button>
         </div>
         <div className="flex items-center gap-6">
            <button className="text-neutral-700 hover:text-white transition-all"><Calendar size={20}/></button>
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500 to-rose-500 border-2 border-white/10"></div>
         </div>
      </nav>

      {viewState === 'client-list' && (
        <div className="flex flex-col h-full overflow-hidden p-10 space-y-10 max-w-[1900px] mx-auto w-full">
            <header className={`${colors.card} rounded-[3rem] p-10 border border-white/5 flex justify-between items-center`}>
               <div><p className="text-[10px] text-[#10b981] font-black uppercase tracking-[0.8em] animate-pulse">Operational Matrix</p><h2 className="text-6xl font-black text-white uppercase tracking-tighter leading-none">Control de <span className="text-white/10">Clientes</span></h2></div>
               <button onClick={() => setIsClientModalOpen(true)} className="px-12 py-5 bg-[#10b981] text-white rounded-[2rem] font-black text-[12px] uppercase tracking-widest hover:scale-105 transition-all shadow-lg flex items-center gap-4"><Plus size={20}/> Nuevo Cliente</button>
            </header>
            <div className="relative"><Search className="absolute left-8 top-1/2 -translate-y-1/2 text-neutral-800" size={24}/><input type="text" value={clientSearch} onChange={e=>setClientSearch(e.target.value)} placeholder="Filtrar clientes..." className={`w-full ${colors.input} rounded-[2.5rem] py-6 pl-20 pr-8 text-xl outline-none border border-white/5 focus:border-[#10b981]/30 transition-all font-bold`} /></div>
            <div className={`${colors.card} rounded-[3.5rem] overflow-hidden border border-white/5`}>
               <table className="w-full text-left"><thead className="bg-white/[0.01] border-b border-white/5"><tr className="text-[10px] text-neutral-700 font-black uppercase tracking-widest"><th className="px-10 py-8">Cliente</th><th className="px-10 py-8">Email</th><th className="px-10 py-8 text-right">Comandos</th></tr></thead><tbody className="divide-y divide-white/5">{uniqueClients.map(client => (<tr key={client.id} onClick={() => openClientProfile(client)} className="group hover:bg-[#10b981]/[0.03] transition-all cursor-pointer"><td className="px-10 py-8 text-base font-black uppercase tracking-tighter">{client.nombre}</td><td className="px-10 py-8 text-xs font-bold text-neutral-600">{client.email || 'Global Partner'}</td><td className="px-10 py-8 text-right"><ChevronRight size={20} className="text-neutral-800 group-hover:text-[#10b981] transition-all ml-auto"/></td></tr>))}</tbody></table>
            </div>
        </div>
      )}

      {viewState === 'client-profile' && activeClient && (
        <div className="h-full flex flex-col p-10 space-y-10 max-w-[1500px] mx-auto w-full">
          <header className="flex items-center justify-between"><div className="flex items-center gap-8"><button onClick={() => setViewState('client-list')} className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-neutral-500 hover:text-[#10b981] transition-all"><ArrowLeft size={24}/></button><div><h3 className="text-3xl font-black text-white uppercase tracking-tighter">{activeClient.nombre}</h3><p className="text-[10px] text-neutral-500 font-black uppercase tracking-widest">{activeClient.empresa || 'Independent Production'}</p></div></div><button onClick={createMeeting} className="px-10 py-5 bg-[#10b981] text-white rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center gap-4 shadow-xl"><Video size={18}/> Iniciar Producción</button></header>
          <div className="space-y-4">{filteredMeetings.map(m => (<div key={m.id} onClick={() => openMeeting(m)} className={`${colors.card} rounded-[2rem] p-8 border border-white/5 flex items-center justify-between hover:bg-white/[0.01] transition-all cursor-pointer shadow-2xl`}><div className="flex items-center gap-10"><div className="w-16 h-16 rounded-2xl bg-neutral-900 flex items-center justify-center text-[#10b981]"><FileVideo size={28}/></div><div><h4 className="text-2xl font-black text-white uppercase tracking-tighter">{m.session_title}</h4><p className="text-[10px] text-neutral-600 font-bold uppercase">{m.fecha}</p></div></div><div className="text-right"><p className="text-[8px] text-neutral-700 font-black uppercase mb-1">Elapsed</p><p className="text-2xl font-black text-white font-mono">{formatTime(m.total_time)}</p></div></div>))}</div>
        </div>
      )}

      {viewState === 'agency-hub' && (
        <div className="flex flex-col h-full p-12 space-y-16 max-w-[1900px] mx-auto w-full">
            <header className="flex justify-between items-center"><div><div className="w-2 h-10 bg-amber-500 rounded-full mb-4"></div><h2 className="text-4xl font-black text-white uppercase tracking-tighter">Agencia de <span className="text-neutral-500 italic">Marketing</span></h2></div><button onClick={() => setIsCompanyModalOpen(true)} className="px-10 py-4 bg-amber-500 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest hover:scale-105 transition-all shadow-xl"><Plus size={18}/> Nuevo Proyecto</button></header>
            <div className="grid grid-cols-4 gap-6">{['Básico', 'Intermedio', 'Avanzado', 'Personalizado'].map(p => (<div key={p} onClick={() => setActiveAgencyPlan(p)} className={`p-8 rounded-[2rem] bg-white/[0.02] border border-white/5 hover:border-amber-500/50 transition-all cursor-pointer ${activeAgencyPlan === p ? 'bg-white/[0.05] border-amber-500 shadow-xl' : ''}`}><h4 className="text-lg font-black text-white uppercase tracking-tighter mb-2">{p}</h4><p className="text-[9px] text-neutral-600 font-bold uppercase">{agencyClients.length} Proyectos</p></div>))}</div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">{filteredAgencyClients.map(company => (<div key={company.id} onClick={() => { setSelectedCompany(company); fetchStrategies(company.id); setViewState('agency-session'); }} className="bg-[#080808] border border-white/5 rounded-[2.5rem] p-8 hover:border-amber-500/30 transition-all cursor-pointer"><div className="flex items-center gap-6 mb-8"><div className="w-16 h-16 bg-neutral-900 rounded-2xl flex items-center justify-center text-amber-500"><Building2 size={28}/></div><div><h4 className="text-xl font-black text-white uppercase tracking-tighter">{company.nombre_empresa}</h4><p className="text-[9px] text-neutral-600 font-black uppercase">Socio: {company.dueño}</p></div></div><div className="flex gap-3"><div className="flex-1 p-3 bg-white/5 rounded-xl text-center text-[9px] font-black text-amber-500 uppercase">Ver Estrategia</div></div></div>))}</div>
        </div>
      )}

      {viewState === 'agency-session' && selectedCompany && (
        <div className="flex flex-col h-full p-10 space-y-10 max-w-[1500px] mx-auto w-full">
           <header className="flex items-center justify-between"><div className="flex items-center gap-8"><button onClick={() => setViewState('agency-hub')} className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-neutral-500 hover:text-amber-500 transition-all"><ArrowLeft size={24}/></button><div><h3 className="text-3xl font-black text-white uppercase tracking-tighter">{selectedCompany.nombre_empresa}</h3><p className="text-[10px] text-amber-500 font-black uppercase">{selectedCompany.plan}</p></div></div><button onClick={createStrategy} className="px-10 py-5 bg-white text-black rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center gap-4 hover:bg-amber-500 hover:text-white transition-all shadow-xl"><Sparkles size={18}/> Nueva Estrategia</button></header>
           <div className="space-y-4">{strategies.map(s => (<div key={s.id} onClick={() => { setActiveStrategy(s); setEditorContent(s.contenido); setTime(s.total_time); setViewState('agency-editor'); }} className={`${colors.card} rounded-[2rem] p-8 flex items-center justify-between hover:border-amber-500/30 transition-all cursor-pointer shadow-2xl`}><div className="flex items-center gap-10"><div className="w-16 h-16 rounded-2xl bg-neutral-900 flex items-center justify-center text-amber-500"><Target size={28}/></div><h4 className="text-2xl font-black text-white uppercase tracking-tighter">{s.titulo_estrategia}</h4></div><ChevronRight size={24} className="text-neutral-800"/></div>))}</div>
        </div>
      )}

      {viewState === 'agency-editor' && activeStrategy && (
        <div className="flex flex-col h-full overflow-hidden">
           <header className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-black/40">
              <div className="flex items-center gap-6"><button onClick={() => setViewState('agency-session')} className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-neutral-600 hover:text-amber-500 transition-all"><ArrowLeft size={20}/></button><h3 className="text-lg font-black text-white uppercase">{activeStrategy.titulo_estrategia}</h3></div>
              <div className="flex items-center gap-4"><div className="bg-[#080808] border border-white/5 rounded-xl px-5 py-2 flex items-center gap-4 text-xl font-mono font-black text-white">{formatTime(time)}<button onClick={() => setIsTimerRunning(!isTimerRunning)} className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center">{isTimerRunning ? <Pause size={14}/> : <Play size={14}/>}</button></div><button onClick={saveStrategy} className="px-6 py-3 bg-white text-black text-[10px] font-black rounded-xl uppercase tracking-widest shadow-xl"><Save size={16}/> Guardar</button></div>
           </header>
           <div className="flex-1 flex p-4 gap-4 overflow-hidden max-w-[1800px] mx-auto w-full">
              <div className="w-[300px] space-y-4"><div className="bg-[#121418] p-5 rounded-2xl shadow-2xl text-right text-2xl font-mono font-black text-white bg-[#080808] p-4 rounded-xl border border-white/5">{calcDisplay}</div><div className="grid grid-cols-4 gap-2">{['C','DEL','%','/','7','8','9','*','4','5','6','-','1','2','3','+','0','.','=','+'].slice(0,19).map(btn => (<button key={btn} onClick={() => handleCalc(btn)} className="h-10 rounded-lg text-[10px] font-black bg-white/5 text-neutral-500">{btn}</button>))}<button onClick={()=>handleCalc('=')} className="h-10 rounded-lg text-[10px] font-black bg-amber-500 text-white col-span-2">=</button></div></div>
              <div className="flex-1 bg-[#121418] rounded-[2rem] overflow-hidden flex flex-col shadow-2xl"><div className="px-8 py-4 border-b border-white/5 flex gap-4"><button onMouseDown={(e)=>formatText('bold',null,e)} className="p-2 text-neutral-600 hover:text-white"><Bold size={18}/></button><button onMouseDown={(e)=>formatText('insertUnorderedList',null,e)} className="p-2 text-neutral-600 hover:text-white"><List size={18}/></button></div><div ref={editorRef} contentEditable="true" suppressContentEditableWarning={true} className="flex-1 p-12 text-white font-medium text-lg leading-relaxed outline-none mac-scrollbar overflow-y-auto" dangerouslySetInnerHTML={{ __html: activeStrategy.contenido }} /></div>
           </div>
        </div>
      )}

      {viewState === 'session' && activeMeeting && (
        <div className="flex flex-col h-full overflow-hidden animate-in fade-in duration-500">
          <header className={`px-6 py-4 border-b ${colors.card} flex items-center justify-between bg-black/40`}>
            <div className="flex items-center gap-6"><button onClick={saveMeeting} className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-neutral-600 hover:text-[#10b981] transition-all"><ArrowLeft size={20}/></button><h3 className="text-lg font-black text-white uppercase">{activeMeeting.session_title}</h3></div>
            <div className="flex items-center gap-4"><div className="bg-[#080808] border border-white/5 rounded-xl px-5 py-2 flex items-center gap-4 text-xl font-mono font-black text-white">{formatTime(time)}<button onClick={() => setIsTimerRunning(!isTimerRunning)} className="w-8 h-8 rounded-lg bg-[#10b981] flex items-center justify-center">{isTimerRunning ? <Pause size={14}/> : <Play size={14}/>}</button></div><button onClick={saveMeeting} className="px-6 py-3 bg-white text-black text-[10px] font-black rounded-xl uppercase shadow-xl"><Save size={16}/> Finalizar</button></div>
          </header>
          <div className="flex-1 flex p-4 gap-4 overflow-hidden max-w-[1800px] mx-auto w-full">
            <div className="w-[300px] space-y-4"><div className="bg-[#121418] p-5 rounded-2xl shadow-xl text-right text-2xl font-mono font-black text-white bg-[#080808] p-4 rounded-xl border border-white/5 shadow-inner">{calcDisplay}</div><div className="grid grid-cols-4 gap-2">{['C','DEL','%','/','7','8','9','*','4','5','6','-','1','2','3','+','0','.','=','+'].slice(0,19).map(btn => (<button key={btn} onClick={() => handleCalc(btn)} className="h-10 rounded-lg text-[10px] font-black bg-white/5 text-neutral-500">{btn}</button>))}<button onClick={()=>handleCalc('=')} className="h-10 rounded-lg text-[10px] font-black bg-[#10b981] text-white col-span-2 shadow-lg">=</button></div></div>
            <div className="flex-1 bg-[#121418] rounded-[2rem] overflow-hidden flex flex-col shadow-2xl"><div className="px-8 py-4 border-b border-white/5 flex gap-4"><button onMouseDown={(e)=>formatText('bold',null,e)} className="p-2 text-neutral-600 hover:text-white"><Bold size={18}/></button><button onMouseDown={(e)=>formatText('insertUnorderedList',null,e)} className="p-2 text-neutral-600 hover:text-white"><List size={18}/></button></div><div ref={editorRef} contentEditable="true" suppressContentEditableWarning={true} className="flex-1 p-12 text-white font-medium text-lg leading-relaxed outline-none mac-scrollbar overflow-y-auto" dangerouslySetInnerHTML={{ __html: activeMeeting.contenido }} /></div>
          </div>
        </div>
      )}

      {isClientModalOpen && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center bg-black/95 backdrop-blur-xl p-8 animate-in zoom-in duration-300">
           <div className={`${colors.card} border-t-4 border-t-[#10b981] rounded-[3rem] w-full max-w-xl p-12 space-y-8 shadow-2xl`}>
                <h3 className="text-3xl font-black text-white uppercase">Sovereign <span className="text-[#10b981]">Nexus</span></h3>
                <div className="space-y-4"><input type="text" value={newClient.nombre} onChange={e=>setNewClient({...newClient, nombre: e.target.value})} placeholder="Nombre..." className={`w-full ${colors.input} rounded-2xl p-6 text-lg outline-none`} /><input type="email" value={newClient.email} onChange={e=>setNewClient({...newClient, email: e.target.value})} placeholder="Email..." className={`w-full ${colors.input} rounded-2xl p-6 text-lg outline-none`} /></div>
                <div className="flex gap-4"><button onClick={() => setIsClientModalOpen(false)} className="flex-1 py-6 text-neutral-600 font-black uppercase text-[10px]">Cerrar</button><button onClick={handleCreateClient} className="flex-[2] py-6 bg-[#10b981] text-white rounded-2xl font-black uppercase text-[10px] shadow-lg">Guardar</button></div>
           </div>
        </div>
      )}

      {isCompanyModalOpen && (
        <div className="fixed inset-0 z-[800] flex items-center justify-center bg-black/95 backdrop-blur-2xl p-8 animate-in zoom-in duration-300">
           <div className="bg-[#121418] border-t-4 border-t-amber-500 rounded-[3rem] w-full max-w-xl p-12 space-y-8 shadow-2xl">
                <h3 className="text-3xl font-black text-white uppercase">Sovereign <span className="text-amber-500">Agency</span></h3>
                <div className="space-y-4"><input type="text" value={newCompany.nombre_empresa} onChange={e=>setNewCompany({...newCompany, nombre_empresa: e.target.value})} placeholder="Empresa..." className="w-full bg-[#0d0f12] border border-white/5 rounded-2xl p-6 text-lg text-white outline-none" /><input type="text" value={newCompany.dueño} onChange={e=>setNewCompany({...newCompany, dueño: e.target.value})} placeholder="Socio..." className="w-full bg-[#0d0f12] border border-white/5 rounded-2xl p-6 text-lg text-white outline-none" /></div>
                <div className="flex gap-4"><button onClick={() => setIsCompanyModalOpen(false)} className="flex-1 py-6 text-neutral-600 font-black uppercase text-[10px]">Cerrar</button><button onClick={handleCreateAgencyClient} className="flex-[2] py-6 bg-amber-500 text-white rounded-2xl font-black uppercase text-[10px] shadow-lg">Lanzar</button></div>
           </div>
        </div>
      )}
    </div>
  );
};
export default MeetingStudio;
