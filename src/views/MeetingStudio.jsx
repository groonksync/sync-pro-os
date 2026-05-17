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
  Crown, Grid, LayoutGrid, Star, Gift, Shield, Building2, Terminal, Code2, Cpu, PieChart, TrendingDown, Eye
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import GoogleTasks from '../components/GoogleTasks';
import { aiService } from '../services/aiService';

const MeetingStudio = ({ meetingsList = [], setMeetingsList, settings = {}, token }) => {
  const isLight = settings.theme === 'light';
  
  // viewState can be: 'client-list' (default under CLIENTES tab), 'client-profile', 'session'
  // agencyViewState can be: 'agency-hub' (default under AGENCIA tab), 'agency-session', 'agency-editor'
  // We use activeTab: 'clientes' | 'agencia' | 'edicion' to orchestrate the main view
  const [activeTab, setActiveTab] = useState('clientes');
  const [viewState, setViewState] = useState('client-list'); 
  const [activeClient, setActiveClient] = useState(null);
  const [activeMeeting, setActiveMeeting] = useState(null);
  
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

  useEffect(() => { 
    fetchClients(); 
    fetchMeetings();
    fetchAgencyClients();
  }, []);

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

  const openClientProfile = (client) => { 
    setActiveClient(client); 
    fetchMeetings(); 
    setViewState('client-profile'); 
    setActiveTab('clientes');
  };

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
    setActiveTab('edicion');
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
      setActiveTab('clientes');
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
    fetchAgencyClients();
  }, [activeAgencyPlan]);

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
      setActiveTab('agencia');
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

  const formatText = (command, value = null, e) => { 
    if (e) e.preventDefault(); 
    document.execCommand(command, false, value); 
    if (editorRef.current) editorRef.current.focus(); 
  };

  const handleAISuggestion = async () => {
    if (!aiPrompt) return;
    setAiLoading(true);
    try {
      const suggestion = await aiService.generateScript(aiPrompt, editorRef.current?.innerHTML || '', 'Profesional');
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
      
      {/* HEADER PRINCIPAL PREMIUM: NEURAL PRODUCTION */}
      <nav className="h-20 border-b border-white/5 flex items-center justify-between px-10 relative z-50 bg-[#08080a]/60 backdrop-blur-3xl">
         <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-[#10b981]/10 rounded-2xl flex items-center justify-center border border-[#10b981]/30 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
               <Zap size={20} className="text-[#10b981] animate-pulse"/>
            </div>
            <div className="flex flex-col">
               <span className="text-[11px] font-black tracking-[0.25em] text-[#10b981] uppercase leading-none">Sovereign OS</span>
               <span className="text-[8px] font-bold text-neutral-500 tracking-[0.4em] uppercase mt-1 leading-none">Neural Production</span>
            </div>
         </div>
         
         {/* NAVEGACIÓN CAPSULAR DE TRES PESTAÑAS (Misma de la Imagen 1) */}
         <div className="flex bg-[#121417]/85 p-1 rounded-[1.2rem] border border-white/5 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
            <button 
              onClick={() => { setActiveTab('clientes'); setViewState('client-list'); }} 
              className={`px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-[0.15em] transition-all flex items-center gap-2 ${activeTab === 'clientes' ? 'bg-[#10b981] text-white shadow-lg shadow-[#10b981]/25 scale-105' : 'text-neutral-500 hover:text-white'}`}
            >
               <Users size={12}/> Clientes
            </button>
            <button 
              onClick={() => { setActiveTab('agencia'); setViewState('agency-hub'); }} 
              className={`px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-[0.15em] transition-all flex items-center gap-2 ${activeTab === 'agencia' ? 'bg-[#f59e0b] text-white shadow-lg shadow-[#f59e0b]/25 scale-105' : 'text-neutral-500 hover:text-white'}`}
            >
               <Briefcase size={12}/> Agencia Pro
            </button>
            <button 
              onClick={() => { 
                setActiveTab('edicion'); 
                if (activeMeeting) {
                  setViewState('session');
                } else {
                  setViewState('recent-meetings');
                }
              }} 
              className={`px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-[0.15em] transition-all flex items-center gap-2 ${activeTab === 'edicion' ? 'bg-[#8b5cf6] text-white shadow-lg shadow-[#8b5cf6]/25 scale-105' : 'text-neutral-500 hover:text-white'}`}
            >
               <Video size={12}/> Edición de Video
            </button>
         </div>

         {/* BADGE SYSTEM READY Y AVATAR */}
         <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-2.5 px-4 py-2 bg-[#10b981]/5 border border-[#10b981]/20 rounded-full">
               <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-ping"></span>
               <span className="text-[8px] font-black uppercase tracking-widest text-[#10b981]">• System Ready</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#10b981] to-[#8b5cf6] border border-white/20 p-[2px] cursor-pointer hover:scale-105 transition-all">
               <div className="w-full h-full bg-[#0b0c0e] rounded-full flex items-center justify-center font-black text-xs text-white">4</div>
            </div>
         </div>
      </nav>

      {/* CONTENIDO PRINCIPAL BASADO EN PESTAÑAS */}
      <div className="flex-1 overflow-hidden relative bg-[#0b0c0e]">
        
        {/* PESTAÑA: CLIENTES */}
        {activeTab === 'clientes' && (
          <div className="h-full overflow-y-auto max-w-[1700px] mx-auto w-full p-10 space-y-8 animate-in fade-in duration-500">
             
             {viewState === 'client-list' && (
               <>
                 {/* OPERATIONAL MATRIX TITLE */}
                 <header className="flex justify-between items-end">
                    <div className="space-y-1">
                       <p className="text-[9px] text-[#10b981] font-black uppercase tracking-[0.6em] animate-pulse">Operational Matrix</p>
                       <h2 className="text-5xl font-black text-white uppercase tracking-tighter leading-none">Control de Clientes</h2>
                    </div>
                    <button 
                      onClick={() => setIsClientModalOpen(true)} 
                      className="px-8 py-4 bg-[#10b981] hover:bg-[#059669] text-white rounded-2xl font-black text-[11px] uppercase tracking-widest hover:scale-105 transition-all shadow-[0_15px_30px_rgba(16,185,129,0.2)] flex items-center gap-3"
                    >
                       <Plus size={16}/> Nuevo Cliente
                    </button>
                 </header>

                 {/* MICRO-HUD: 4 CARDS (Exactamente como en la Imagen 1) */}
                 <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                    
                    {/* CARD 1: CAPACIDAD OPERATIVA */}
                    <div className="bg-[#121417] border border-white/5 rounded-3xl p-6 flex items-center justify-between shadow-2xl relative overflow-hidden group hover:border-[#10b981]/25 transition-all">
                       <div className="space-y-2">
                          <p className="text-[8px] text-neutral-500 font-black uppercase tracking-widest">Capacidad Operativa</p>
                          <p className="text-3xl font-mono font-black text-[#10b981]">98.4%</p>
                       </div>
                       <div className="w-12 h-12 rounded-2xl bg-[#10b981]/5 border border-[#10b981]/15 flex items-center justify-center text-[#10b981] group-hover:scale-110 transition-transform">
                          <Activity size={22}/>
                       </div>
                    </div>

                    {/* CARD 2: PROYECTOS EN RENDER */}
                    <div className="bg-[#121417] border border-white/5 rounded-3xl p-6 flex items-center justify-between shadow-2xl relative overflow-hidden group hover:border-[#3b82f6]/25 transition-all">
                       <div className="space-y-2">
                          <p className="text-[8px] text-neutral-500 font-black uppercase tracking-widest">Proyectos en Render</p>
                          <p className="text-3xl font-mono font-black text-[#3b82f6]">2</p>
                       </div>
                       <div className="w-12 h-12 rounded-2xl bg-[#3b82f6]/5 border border-[#3b82f6]/15 flex items-center justify-center text-[#3b82f6] group-hover:scale-110 transition-transform">
                          <Video size={22}/>
                       </div>
                    </div>

                    {/* CARD 3: LATENCIA NEURAL */}
                    <div className="bg-[#121417] border border-white/5 rounded-3xl p-6 flex items-center justify-between shadow-2xl relative overflow-hidden group hover:border-[#8b5cf6]/25 transition-all">
                       <div className="space-y-2">
                          <p className="text-[8px] text-neutral-500 font-black uppercase tracking-widest">Latencia Neural</p>
                          <p className="text-3xl font-mono font-black text-[#8b5cf6]">0.4ms</p>
                       </div>
                       <div className="w-12 h-12 rounded-2xl bg-[#8b5cf6]/5 border border-[#8b5cf6]/15 flex items-center justify-center text-[#8b5cf6] group-hover:scale-110 transition-transform">
                          <Cpu size={22}/>
                       </div>
                    </div>

                    {/* CARD 4: BASE DE CLIENTES */}
                    <div className="bg-[#121417] border border-white/5 rounded-3xl p-6 flex items-center justify-between shadow-2xl relative overflow-hidden group hover:border-[#f59e0b]/25 transition-all">
                       <div className="space-y-2">
                          <p className="text-[8px] text-neutral-500 font-black uppercase tracking-widest">Base de Clientes</p>
                          <p className="text-3xl font-mono font-black text-[#f59e0b]">{clients.length}</p>
                       </div>
                       <div className="w-12 h-12 rounded-2xl bg-[#f59e0b]/5 border border-[#f59e0b]/15 flex items-center justify-center text-[#f59e0b] group-hover:scale-110 transition-transform">
                          <Users size={22}/>
                       </div>
                    </div>

                 </div>

                 {/* SEARCH BAR */}
                 <div className="relative">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-neutral-600" size={20}/>
                    <input 
                      type="text" 
                      value={clientSearch} 
                      onChange={e=>setClientSearch(e.target.value)} 
                      placeholder="Filtrar Identidad de Socio..." 
                      className="w-full bg-[#121417] rounded-2xl py-5 pl-16 pr-8 text-xs outline-none border border-white/5 focus:border-[#10b981]/30 transition-all font-bold uppercase tracking-widest text-white placeholder-neutral-600" 
                    />
                 </div>

                 {/* CUADRÍCULA DE CLIENTES - OBSIDIAN GLASS DESIGN (Imagen 1) */}
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {uniqueClients.map(client => (
                      <div 
                        key={client.id} 
                        onClick={() => openClientProfile(client)}
                        className="bg-[#121417] rounded-[2.5rem] p-8 border border-white/5 hover:border-[#10b981]/35 transition-all duration-300 group cursor-pointer relative overflow-hidden shadow-2xl"
                      >
                         <div className="flex flex-col h-full justify-between gap-6 relative z-10">
                            
                            <div className="flex justify-between items-start">
                               <div className="w-14 h-14 bg-[#08080a] rounded-2xl border border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                  <UserIcon size={22} className="text-neutral-500 group-hover:text-[#10b981] transition-all"/>
                               </div>
                               <div className="px-3.5 py-1.5 bg-[#10b981]/10 rounded-xl text-[8px] font-black text-[#10b981] uppercase tracking-widest border border-[#10b981]/25">
                                  Active Partner
                                </div>
                            </div>

                            <div className="space-y-1.5">
                               <h4 className="text-xl font-black uppercase tracking-tighter text-white group-hover:text-[#10b981] transition-colors">{client.nombre}</h4>
                               <p className="text-[9px] text-neutral-600 font-bold uppercase tracking-widest">{client.email || 'Global Partner Account'}</p>
                            </div>

                            <button className="w-full py-4 bg-[#1a1c20] hover:bg-[#10b981] text-neutral-500 hover:text-white rounded-xl font-black uppercase text-[9px] tracking-widest transition-all flex items-center justify-center gap-2">
                               Abrir Nexus <ChevronRight size={14}/>
                            </button>
                         </div>
                         <div className="absolute top-0 right-0 w-32 h-32 bg-[#10b981]/5 blur-[80px] opacity-30 group-hover:opacity-100 transition-opacity"></div>
                      </div>
                    ))}
                 </div>
               </>
             )}

             {/* CLIENT PROFILE VIEW */}
             {viewState === 'client-profile' && activeClient && (
               <div className="space-y-8 animate-in fade-in duration-500">
                  <header className="flex items-center justify-between">
                     <div className="flex items-center gap-6">
                        <button 
                          onClick={() => setViewState('client-list')} 
                          className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-neutral-500 hover:text-[#10b981] hover:bg-[#10b981]/5 transition-all"
                        >
                           <ArrowLeft size={20}/>
                        </button>
                        <div>
                           <h3 className="text-3xl font-black text-white uppercase tracking-tighter leading-none mb-1.5">{activeClient.nombre}</h3>
                           <p className="text-[10px] text-neutral-600 font-black uppercase tracking-widest">{activeClient.email || 'Independent Partner'}</p>
                        </div>
                     </div>
                     <button 
                       onClick={createMeeting} 
                       className="px-8 py-4 bg-[#10b981] text-white rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center gap-3 shadow-xl hover:scale-105 transition-all"
                     >
                        <Video size={16}/> Iniciar Producción
                     </button>
                  </header>

                  <div className="relative">
                     <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-neutral-700" size={20}/>
                     <input 
                       type="text" 
                       value={meetingSearch} 
                       onChange={e => setMeetingSearch(e.target.value)} 
                       placeholder="Buscar Sesión..." 
                       className="w-full bg-[#121417] border border-white/5 rounded-2xl py-5 pl-16 pr-8 text-xs font-bold uppercase tracking-widest text-white placeholder-neutral-700"
                     />
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                     {filteredMeetings.length > 0 ? filteredMeetings.map(m => (
                       <div 
                         key={m.id} 
                         onClick={() => openMeeting(m)}
                         className="bg-[#121417] rounded-3xl p-6 border border-white/5 flex items-center justify-between hover:border-[#10b981]/20 transition-all cursor-pointer group"
                       >
                          <div className="flex items-center gap-6">
                             <div className="w-12 h-12 rounded-2xl bg-[#08080a] border border-white/10 flex items-center justify-center text-[#10b981]">
                                <FileVideo size={22}/>
                             </div>
                             <div>
                                <h5 className="text-lg font-black uppercase tracking-tight text-white group-hover:text-[#10b981] transition-colors">{m.session_title}</h5>
                                <p className="text-[9px] text-neutral-600 font-bold uppercase mt-1">{m.created_at ? new Date(m.created_at).toLocaleDateString() : 'Active Workspace'}</p>
                             </div>
                          </div>
                          <div className="flex items-center gap-8">
                             <div className="text-right">
                                <p className="text-[8px] text-neutral-700 font-black uppercase tracking-widest mb-0.5">Elapsed</p>
                                <p className="text-xl font-black text-white font-mono">{formatTime(m.total_time)}</p>
                             </div>
                             <ChevronRight size={20} className="text-neutral-700 group-hover:text-white transition-colors"/>
                          </div>
                       </div>
                     )) : (
                       <div className="py-16 text-center border-2 border-dashed border-white/5 rounded-[2.5rem]">
                          <p className="text-[10px] font-black uppercase tracking-widest text-neutral-600">No hay sesiones de producción registradas para este socio.</p>
                       </div>
                     )}
                  </div>
               </div>
             )}

          </div>
        )}

        {/* PESTAÑA: AGENCIA PRO */}
        {activeTab === 'agencia' && (
          <div className="h-full overflow-y-auto max-w-[1700px] mx-auto w-full p-10 space-y-12 animate-in fade-in duration-500">
             
             {viewState === 'agency-hub' && (
               <>
                  <header className="flex justify-between items-center">
                     <div>
                        <div className="w-12 h-[2px] bg-amber-500 mb-3"></div>
                        <h2 className="text-4xl font-black text-white uppercase tracking-tighter">Agencia de Marketing</h2>
                     </div>
                     <button 
                       onClick={() => setIsCompanyModalOpen(true)} 
                       className="px-8 py-4 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest hover:scale-105 transition-all shadow-xl"
                     >
                        <Plus size={16}/> Nuevo Proyecto
                     </button>
                  </header>

                  {/* PLANES DE AGENCIA CARD CAPSUlES */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                     {['Básico', 'Intermedio', 'Avanzado', 'Personalizado'].map(p => (
                       <div 
                         key={p} 
                         onClick={() => setActiveAgencyPlan(p)} 
                         className={`p-6 rounded-3xl border transition-all cursor-pointer relative overflow-hidden group ${activeAgencyPlan === p ? 'bg-amber-500/10 border-amber-500 shadow-xl' : 'bg-[#121417] border-white/5 hover:border-amber-500/30'}`}
                       >
                          <h4 className="text-lg font-black text-white uppercase tracking-tighter mb-1.5">{p}</h4>
                          <p className="text-[8px] font-black uppercase tracking-widest text-neutral-500 group-hover:text-amber-500 transition-colors">Ver Proyectos Activos</p>
                          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 blur-[50px]"></div>
                       </div>
                     ))}
                  </div>

                  {/* BUSCADOR DE AGENCIA */}
                  <div className="relative">
                     <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-neutral-700" size={20}/>
                     <input 
                       type="text" 
                       value={agencySearch} 
                       onChange={e=>setAgencySearch(e.target.value)} 
                       placeholder="Buscar Empresa Socio..." 
                       className="w-full bg-[#121417] border border-white/5 rounded-2xl py-5 pl-16 pr-8 text-xs font-bold uppercase tracking-widest text-white placeholder-neutral-700" 
                     />
                  </div>

                  {/* GRID DE COMPAÑÍAS DE AGENCIA */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                     {filteredAgencyClients.length > 0 ? filteredAgencyClients.map(company => (
                       <div 
                         key={company.id} 
                         onClick={() => { setSelectedCompany(company); fetchStrategies(company.id); setViewState('agency-session'); }}
                         className="bg-[#121417] border border-white/5 rounded-[2.5rem] p-8 hover:border-amber-500/35 transition-all cursor-pointer relative overflow-hidden group"
                       >
                          <div className="flex items-center gap-5 mb-8">
                             <div className="w-14 h-14 bg-[#08080a] border border-white/10 rounded-2xl flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform">
                                <Building2 size={24}/>
                             </div>
                             <div>
                                <h4 className="text-xl font-black text-white uppercase tracking-tighter group-hover:text-amber-500 transition-colors">{company.nombre_empresa}</h4>
                                <p className="text-[9px] text-neutral-600 font-bold uppercase">Socio: {company.dueño}</p>
                             </div>
                          </div>
                          <div className="w-full py-4 bg-[#1a1c20] hover:bg-amber-500 text-neutral-500 hover:text-white rounded-xl text-center text-[9px] font-black uppercase tracking-widest transition-all">
                             Ver Mesa de Estrategia
                          </div>
                       </div>
                     )) : (
                       <div className="py-16 text-center border-2 border-dashed border-white/5 rounded-[2.5rem] col-span-full">
                          <p className="text-[10px] font-black uppercase tracking-widest text-neutral-600">No hay proyectos de agencia bajo este plan en este momento.</p>
                       </div>
                     )}
                  </div>
               </>
             )}

             {/* AGENDA DE ESTRATEGIAS */}
             {viewState === 'agency-session' && selectedCompany && (
               <div className="space-y-8 animate-in fade-in duration-500">
                  <header className="flex items-center justify-between">
                     <div className="flex items-center gap-6">
                        <button 
                          onClick={() => setViewState('agency-hub')} 
                          className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-neutral-500 hover:text-amber-500 transition-all"
                        >
                           <ArrowLeft size={20}/>
                        </button>
                        <div>
                           <h3 className="text-3xl font-black text-white uppercase tracking-tighter leading-none mb-1.5">{selectedCompany.nombre_empresa}</h3>
                           <p className="text-[10px] text-amber-500 font-black uppercase tracking-widest">Plan: {selectedCompany.plan}</p>
                        </div>
                     </div>
                     <button 
                       onClick={createStrategy} 
                       className="px-8 py-4 bg-white text-black hover:bg-amber-500 hover:text-white rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center gap-3 shadow-xl transition-all"
                     >
                        <Sparkles size={16}/> Nueva Estrategia
                     </button>
                  </header>

                  <div className="grid grid-cols-1 gap-4">
                     {strategies.length > 0 ? strategies.map(s => (
                       <div 
                         key={s.id} 
                         onClick={() => { setActiveStrategy(s); setEditorContent(s.contenido); setTime(s.total_time); setViewState('agency-editor'); }}
                         className="bg-[#121417] rounded-3xl p-6 border border-white/5 flex items-center justify-between hover:border-amber-500/30 transition-all cursor-pointer group"
                       >
                          <div className="flex items-center gap-6">
                             <div className="w-12 h-12 rounded-2xl bg-[#08080a] border border-white/10 flex items-center justify-center text-amber-500">
                                <Target size={22}/>
                             </div>
                             <h5 className="text-lg font-black uppercase tracking-tight text-white group-hover:text-amber-500 transition-colors">{s.titulo_estrategia}</h5>
                          </div>
                          <ChevronRight size={20} className="text-neutral-700 group-hover:text-white transition-colors"/>
                       </div>
                     )) : (
                       <div className="py-16 text-center border-2 border-dashed border-white/5 rounded-[2.5rem]">
                          <p className="text-[10px] font-black uppercase tracking-widest text-neutral-600">No hay planes estratégicos registrados.</p>
                       </div>
                     )}
                  </div>
               </div>
             )}

             {/* EDITOR DE ESTRATEGIA */}
             {viewState === 'agency-editor' && activeStrategy && (
               <div className="flex flex-col h-[calc(100vh-14rem)] overflow-hidden animate-in fade-in duration-500">
                  <header className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-black/40 rounded-t-3xl">
                     <div className="flex items-center gap-5">
                        <button 
                          onClick={() => setViewState('agency-session')} 
                          className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-neutral-600 hover:text-amber-500 transition-all"
                        >
                           <ArrowLeft size={16}/>
                        </button>
                        <h3 className="text-base font-black text-white uppercase tracking-tight">{activeStrategy.titulo_estrategia}</h3>
                     </div>
                     <div className="flex items-center gap-4">
                        <div className="bg-[#080808] border border-white/5 rounded-xl px-4 py-2 flex items-center gap-4 text-lg font-mono font-black text-white">
                           {formatTime(time)}
                           <button 
                             onClick={() => setIsTimerRunning(!isTimerRunning)} 
                             className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center"
                           >
                              {isTimerRunning ? <Pause size={12}/> : <Play size={12}/>}
                           </button>
                        </div>
                        <button 
                          onClick={saveStrategy} 
                          className="px-6 py-3.5 bg-white text-black hover:bg-amber-500 hover:text-white text-[10px] font-black rounded-xl uppercase tracking-widest transition-all shadow-xl"
                        >
                           <Save size={14}/> Guardar
                        </button>
                     </div>
                  </header>
                  
                  <div className="flex-1 flex p-4 gap-4 overflow-hidden bg-black/20 rounded-b-3xl border-x border-b border-white/5">
                     {/* CALC SIDE PANEL */}
                     <div className="w-[280px] flex flex-col gap-4">
                        <div className="bg-[#121417] p-5 rounded-2xl shadow-xl text-right text-2xl font-mono font-black text-white border border-white/5">{calcDisplay}</div>
                        <div className="grid grid-cols-4 gap-2 flex-1 max-h-[300px]">
                           {['C','/','*','-','7','8','9','+','4','5','6','='].map(btn => (
                             <button 
                               key={btn} 
                               onClick={() => handleCalc(btn)} 
                               className={`rounded-xl text-[10px] font-black ${btn === '=' ? 'bg-amber-500 text-white' : 'bg-white/5 text-neutral-500 hover:text-white'}`}
                             >
                                {btn}
                             </button>
                           ))}
                        </div>
                     </div>
                     
                     {/* RICH TEXT EDITOR */}
                     <div className="flex-1 bg-[#121417] rounded-3xl overflow-hidden flex flex-col shadow-2xl border border-white/5">
                        <div className="px-6 py-3.5 border-b border-white/5 flex gap-4 bg-black/30">
                           <button onMouseDown={(e) => formatText('bold', null, e)} className="p-2 text-neutral-500 hover:text-white transition-colors"><Bold size={16}/></button>
                           <button onMouseDown={(e) => formatText('insertUnorderedList', null, e)} className="p-2 text-neutral-500 hover:text-white transition-colors"><List size={16}/></button>
                        </div>
                        <div 
                          ref={editorRef} 
                          contentEditable="true" 
                          suppressContentEditableWarning={true} 
                          className="flex-1 p-10 text-white font-medium text-lg leading-relaxed outline-none mac-scrollbar overflow-y-auto" 
                          dangerouslySetInnerHTML={{ __html: activeStrategy.contenido }} 
                        />
                     </div>
                  </div>
               </div>
             )}

          </div>
        )}

        {/* PESTAÑA: EDICIÓN DE VIDEO WORKSPACE (Apple Notes Clone & Timer) */}
        {activeTab === 'edicion' && (
          <div className="h-full overflow-y-auto max-w-[1700px] mx-auto w-full p-10 space-y-8 animate-in fade-in duration-500">
             
             {viewState === 'recent-meetings' && (
               <div className="space-y-8">
                  <header className="space-y-1">
                     <p className="text-[9px] text-[#8b5cf6] font-black uppercase tracking-[0.6em]">Production Grid</p>
                     <h2 className="text-5xl font-black text-white uppercase tracking-tighter leading-none">Edición de Video</h2>
                  </header>

                  <div className="py-16 text-center border-2 border-dashed border-white/5 rounded-[2.5rem] space-y-6">
                     <div className="w-16 h-16 bg-[#8b5cf6]/5 border border-[#8b5cf6]/20 text-[#8b5cf6] rounded-3xl flex items-center justify-center mx-auto">
                        <Video size={28}/>
                     </div>
                     <div className="space-y-2 max-w-md mx-auto">
                        <h4 className="text-lg font-black uppercase tracking-tight">Estación de Trabajo Inactiva</h4>
                        <p className="text-neutral-500 text-xs leading-relaxed">Para iniciar o continuar una edición de video, ve a la pestaña **Clientes**, abre el perfil de un socio y presiona **Iniciar Producción** o selecciona una sesión existente.</p>
                     </div>
                     <button 
                       onClick={() => { setActiveTab('clientes'); setViewState('client-list'); }}
                       className="px-6 py-3.5 bg-[#8b5cf6] hover:bg-[#7c3aed] text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-[#8b5cf6]/20"
                     >
                        Ir a Clientes
                     </button>
                  </div>
               </div>
             )}

             {viewState === 'session' && activeMeeting && (
               <div className="flex flex-col h-[calc(100vh-14rem)] overflow-hidden animate-in fade-in duration-500">
                  <header className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-black/40 rounded-t-3xl">
                     <div className="flex items-center gap-5">
                        <button 
                          onClick={() => { 
                            setActiveTab('clientes'); 
                            setViewState('client-profile'); 
                          }} 
                          className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-neutral-600 hover:text-[#10b981] transition-all"
                        >
                           <ArrowLeft size={16}/>
                        </button>
                        <div className="flex flex-col">
                           <span className="text-xs text-neutral-500 font-bold uppercase tracking-widest leading-none">Sesión Activa</span>
                           <h3 className="text-base font-black text-white uppercase tracking-tight mt-1 leading-none">{activeMeeting.session_title}</h3>
                        </div>
                     </div>
                     <div className="flex items-center gap-4">
                        <div className="bg-[#080808] border border-white/5 rounded-xl px-4 py-2 flex items-center gap-4 text-lg font-mono font-black text-white">
                           {formatTime(time)}
                           <button 
                             onClick={() => setIsTimerRunning(!isTimerRunning)} 
                             className="w-7 h-7 rounded-lg bg-[#8b5cf6] text-white flex items-center justify-center"
                           >
                              {isTimerRunning ? <Pause size={12}/> : <Play size={12}/>}
                           </button>
                        </div>
                        <button 
                          onClick={saveMeeting} 
                          className="px-6 py-3.5 bg-[#10b981] text-white hover:bg-[#059669] text-[10px] font-black rounded-xl uppercase tracking-widest transition-all shadow-xl shadow-[#10b981]/15"
                        >
                           <Save size={14}/> Finalizar
                        </button>
                     </div>
                  </header>

                  <div className="flex-1 flex p-4 gap-4 overflow-hidden bg-black/20 rounded-b-3xl border-x border-b border-white/5">
                     {/* CALC SIDE PANEL */}
                     <div className="w-[280px] flex flex-col gap-4">
                        <div className="bg-[#121417] p-5 rounded-2xl shadow-xl text-right text-2xl font-mono font-black text-white border border-white/5">{calcDisplay}</div>
                        <div className="grid grid-cols-4 gap-2 flex-1 max-h-[280px]">
                           {['C','/','*','-','7','8','9','+','4','5','6','='].map(btn => (
                             <button 
                               key={btn} 
                               onClick={() => handleCalc(btn)} 
                               className={`rounded-xl text-[10px] font-black ${btn === '=' ? 'bg-[#8b5cf6] text-white' : 'bg-white/5 text-neutral-500 hover:text-white'}`}
                             >
                                {btn}
                             </button>
                           ))}
                        </div>

                        {/* IA WRITING ASSISTANT CARD */}
                        <div className="p-5 bg-[#8b5cf6]/5 border border-[#8b5cf6]/15 rounded-2xl flex flex-col gap-3">
                           <div className="flex items-center gap-2 text-[#8b5cf6]">
                              <Sparkles size={16} className="animate-spin duration-300"/>
                              <span className="text-[9px] font-black uppercase tracking-widest">Asistente IA</span>
                           </div>
                           <p className="text-[8px] text-neutral-500 font-medium leading-relaxed">Genera guiones de video profesionales o expande tus ideas usando inteligencia artificial integrada.</p>
                           <button 
                             onClick={() => setShowAIModal(true)}
                             className="w-full py-3 bg-[#8b5cf6] text-white rounded-xl text-[8px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-[#8b5cf6]/10"
                           >
                              Lanzar Script IA
                           </button>
                        </div>
                     </div>

                     {/* RICH TEXT EDITOR */}
                     <div className="flex-1 bg-[#121417] rounded-3xl overflow-hidden flex flex-col shadow-2xl border border-white/5">
                        <div className="px-6 py-3.5 border-b border-white/5 flex gap-4 bg-black/30">
                           <button onMouseDown={(e) => formatText('bold', null, e)} className="p-2 text-neutral-500 hover:text-white transition-colors"><Bold size={16}/></button>
                           <button onMouseDown={(e) => formatText('insertUnorderedList', null, e)} className="p-2 text-neutral-500 hover:text-white transition-colors"><List size={16}/></button>
                        </div>
                        <div 
                          ref={editorRef} 
                          contentEditable="true" 
                          suppressContentEditableWarning={true} 
                          className="flex-1 p-10 text-white font-medium text-lg leading-relaxed outline-none mac-scrollbar overflow-y-auto max-w-[900px] mx-auto prose prose-invert" 
                          dangerouslySetInnerHTML={{ __html: editorContent }} 
                        />
                     </div>
                  </div>
               </div>
             )}

          </div>
        )}

      </div>

      {/* MODALES FLOTANTES */}
      {isClientModalOpen && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center bg-black/90 backdrop-blur-xl p-8 animate-in zoom-in duration-300">
           <div className="bg-[#121417] border border-white/5 rounded-[3rem] w-full max-w-xl p-12 space-y-8 shadow-2xl relative overflow-hidden">
                <h3 className="text-3xl font-black text-white uppercase">Sovereign <span className="text-[#10b981]">Nexus</span></h3>
                <div className="space-y-4">
                   <input 
                     type="text" 
                     value={newClient.nombre} 
                     onChange={e=>setNewClient({...newClient, nombre: e.target.value})} 
                     placeholder="Nombre Completo..." 
                     className="w-full bg-[#0d0f12] border border-white/5 rounded-2xl p-6 text-sm text-white outline-none font-bold placeholder-neutral-600 focus:border-[#10b981]/30 transition-all uppercase tracking-wider" 
                   />
                   <input 
                     type="email" 
                     value={newClient.email} 
                     onChange={e=>setNewClient({...newClient, email: e.target.value})} 
                     placeholder="Dirección Email..." 
                     className="w-full bg-[#0d0f12] border border-white/5 rounded-2xl p-6 text-sm text-white outline-none font-bold placeholder-neutral-600 focus:border-[#10b981]/30 transition-all uppercase tracking-wider" 
                   />
                </div>
                <div className="flex gap-4">
                   <button onClick={() => setIsClientModalOpen(false)} className="flex-1 py-5 text-neutral-600 hover:text-white font-black uppercase text-[10px] tracking-widest">Cerrar</button>
                   <button onClick={handleCreateClient} className="flex-[2] py-5 bg-[#10b981] hover:bg-[#059669] text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg">Guardar Socio</button>
                </div>
                <div className="absolute -top-10 -right-10 w-48 h-48 bg-[#10b981]/5 rounded-full blur-[80px]"></div>
           </div>
        </div>
      )}

      {isCompanyModalOpen && (
        <div className="fixed inset-0 z-[800] flex items-center justify-center bg-black/90 backdrop-blur-xl p-8 animate-in zoom-in duration-300">
           <div className="bg-[#121417] border border-white/5 rounded-[3rem] w-full max-w-xl p-12 space-y-8 shadow-2xl relative overflow-hidden">
                <h3 className="text-3xl font-black text-white uppercase">Sovereign <span className="text-amber-500">Agency</span></h3>
                <div className="space-y-4">
                   <input 
                     type="text" 
                     value={newCompany.nombre_empresa} 
                     onChange={e=>setNewCompany({...newCompany, nombre_empresa: e.target.value})} 
                     placeholder="Nombre Empresa..." 
                     className="w-full bg-[#0d0f12] border border-white/5 rounded-2xl p-6 text-sm text-white outline-none font-bold placeholder-neutral-600 focus:border-amber-500/30 transition-all uppercase tracking-wider" 
                   />
                   <input 
                     type="text" 
                     value={newCompany.dueño} 
                     onChange={e=>setNewCompany({...newCompany, dueño: e.target.value})} 
                     placeholder="Dueño/Socio Lead..." 
                     className="w-full bg-[#0d0f12] border border-white/5 rounded-2xl p-6 text-sm text-white outline-none font-bold placeholder-neutral-600 focus:border-amber-500/30 transition-all uppercase tracking-wider" 
                   />
                </div>
                <div className="flex gap-4">
                   <button onClick={() => setIsCompanyModalOpen(false)} className="flex-1 py-5 text-neutral-600 hover:text-white font-black uppercase text-[10px] tracking-widest">Cerrar</button>
                   <button onClick={handleCreateAgencyClient} className="flex-[2] py-5 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg">Lanzar Proyecto</button>
                </div>
                <div className="absolute -top-10 -right-10 w-48 h-48 bg-amber-500/5 rounded-full blur-[80px]"></div>
           </div>
        </div>
      )}

      {showAIModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/95 backdrop-blur-2xl p-8 animate-in zoom-in duration-300">
           <div className="bg-[#121417] border border-white/5 rounded-[3rem] w-full max-w-xl p-12 space-y-8 shadow-2xl relative overflow-hidden">
                <div className="flex items-center gap-3">
                   <Sparkles size={24} className="text-[#8b5cf6] animate-pulse"/>
                   <h3 className="text-3xl font-black text-white uppercase">IA Script <span className="text-[#8b5cf6]">Vanguard</span></h3>
                </div>
                <div className="space-y-4">
                   <textarea 
                     value={aiPrompt} 
                     onChange={e => setAiPrompt(e.target.value)} 
                     placeholder="Describe el guión o contenido que deseas generar con inteligencia artificial..." 
                     className="w-full bg-[#0d0f12] border border-white/5 rounded-2xl p-6 text-sm text-white outline-none font-medium h-48 focus:border-[#8b5cf6]/30 transition-all placeholder-neutral-700 leading-relaxed"
                   />
                </div>
                <div className="flex gap-4">
                   <button 
                     onClick={() => setShowAIModal(false)} 
                     className="flex-1 py-5 text-neutral-600 hover:text-white font-black uppercase text-[10px] tracking-widest"
                   >
                      Cancelar
                   </button>
                   <button 
                     onClick={handleAISuggestion} 
                     disabled={aiLoading} 
                     className="flex-[2] py-5 bg-[#8b5cf6] text-white hover:bg-[#7c3aed] rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg flex items-center justify-center gap-3"
                   >
                      {aiLoading ? <RefreshCw size={14} className="animate-spin"/> : <Sparkles size={14}/>} 
                      {aiLoading ? 'Generando...' : 'Generar Contenido'}
                   </button>
                </div>
                <div className="absolute -top-10 -right-10 w-48 h-48 bg-[#8b5cf6]/5 rounded-full blur-[80px]"></div>
           </div>
        </div>
      )}

    </div>
  );
};

export default MeetingStudio;
