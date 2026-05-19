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
  Crown, Grid, LayoutGrid, Star, Gift, Shield, Building2, Eye, EyeOff, Cpu, Wrench
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import GoogleTasks from '../components/GoogleTasks';
import { aiService } from '../services/aiService';

const MeetingStudio = ({ meetingsList = [], setMeetingsList, settings = {}, token }) => {
  const colors = {
    bg: 'bg-[#121212]',
    card: 'bg-[#1a1a1a] border-white/5 shadow-2xl',
    text: 'text-neutral-200',
    textMuted: 'text-neutral-500',
    accent: '#10b981', 
    accentGlow: 'shadow-[0_0_25px_rgba(16,185,129,0.2)]',
    border: 'border-white/5',
    input: 'bg-[#0d0d0d] border-white/5 text-white',
    innerBg: 'bg-[#121212]'
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

  const [agencyClients, setAgencyClients] = useState([]);
  const [activeAgencyPlan, setActiveAgencyPlan] = useState('Todos'); 
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  
  const [newCompany, setNewCompany] = useState({
    nombre_empresa: '', dueño: '', email: '', telefono: '', plan: 'Básico',
    redes: { instagram: '', tiktok: '', facebook: '', youtube: '' },
    credentials: {
      instagram: { user: '', pass: '' },
      tiktok: { user: '', pass: '' },
      facebook: { user: '', pass: '' },
      youtube: { user: '', pass: '' }
    }
  });
  const [agencyTab, setAgencyTab] = useState('general');
  const [showPass, setShowPass] = useState({ instagram: false, tiktok: false, facebook: false, youtube: false });

  const [newClient, setNewClient] = useState({
    nombre: '', email: '', pais: '', empresa: '', status: 'Activo',
    dueño: '', telefono: '', nacionalidad: '', foto: '',
    metrics: { loyalty: 'Normal', payment: 'A tiempo', growth: 'Estable' }
  });

  useEffect(() => { fetchClients(); fetchAgencyClients(); }, []);

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

  const fetchAgencyClients = async () => {
    try {
      const { data, error } = await supabase.from('clientes_agencia').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setAgencyClients(data || []);
    } catch (e) { console.error(e); }
  };

  const normalizeText = (text) => (text || '').toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  const handleCreateClient = async () => {
    if (!newClient.nombre) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('clientes_editor').insert([{ 
        nombre: newClient.nombre, 
        email: newClient.email, 
        empresa: newClient.empresa, 
        status: 'Activo',
        telefono: newClient.telefono,
        nacionalidad: newClient.nacionalidad,
        foto_url: newClient.foto
      }]);
      if (error) throw error;
      await fetchClients();
      setIsClientModalOpen(false);
      setNewClient({ nombre: '', email: '', pais: '', empresa: '', status: 'Activo', telefono: '', nacionalidad: '', foto: '' });
    } catch (e) { alert(e.message); }
    setLoading(false);
  };

  const handleCreateAgencyClient = async () => {
    if (!newCompany.nombre_empresa) return;
    setLoading(true);
    try {
      const payload = {
        nombre_empresa: newCompany.nombre_empresa,
        dueño: newCompany.dueño,
        email: newCompany.email,
        telefono: newCompany.telefono,
        plan: activeAgencyPlan === 'Todos' ? 'Básico' : activeAgencyPlan,
        metadata: {
          redes: newCompany.redes,
          credentials: newCompany.credentials,
          metrics: { loyalty: 'Normal', payment: 'A tiempo', growth: 'Estable' }
        }
      };
      const { error } = await supabase.from('clientes_agencia').insert([payload]);
      if (error) throw error;
      await fetchAgencyClients();
      setIsCompanyModalOpen(false);
      setNewCompany({
        nombre_empresa: '', dueño: '', email: '', telefono: '', plan: 'Básico',
        redes: { instagram: '', tiktok: '', facebook: '', youtube: '' },
        credentials: {
          instagram: { user: '', pass: '' },
          tiktok: { user: '', pass: '' },
          facebook: { user: '', pass: '' },
          youtube: { user: '', pass: '' }
        }
      });
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

  const [activeStrategy, setActiveStrategy] = useState(null);
  const [editorContent, setEditorContent] = useState('');

  const createStrategy = async () => {
    if (!selectedCompany) return;
    const title = prompt('Título de la Estrategia:', 'Nueva Estrategia');
    if (!title) return;
    try {
      const { error } = await supabase.from('estrategias_agencia').insert([{ cliente_agencia_id: selectedCompany.id, titulo_estrategia: title, contenido: '', total_time: 0 }]);
      if (error) throw error;
      await fetchStrategies(selectedCompany.id);
    } catch (e) { alert(e.message); }
  };

  const saveStrategy = async () => {
    if (!activeStrategy) return;
    try {
      const content = editorRef.current ? editorRef.current.innerHTML : editorContent;
      const { error } = await supabase.from('estrategias_agencia').update({ contenido: content, total_time: time }).eq('id', activeStrategy.id);
      if (error) throw error;
      await fetchStrategies(selectedCompany.id);
      setViewState('agency-session');
    } catch (e) { alert(e.message); }
  };

  const openClientProfile = (client) => { setActiveClient(client); setViewState('client-profile'); };

  const openMeeting = (meeting) => { setActiveMeeting(meeting); setTime(meeting.total_time); setViewState('session'); };

  const createMeeting = async () => {
    if (!activeClient) return;
    const sTitle = prompt('Descripción:', 'Sesión de Trabajo');
    if (!sTitle) return;
    try {
      const { error } = await supabase.from('reuniones').insert([{ cliente_id: activeClient.id, cliente: activeClient.nombre, fecha: new Date().toISOString().split('T')[0], session_title: sTitle, contenido: '', total_time: 0 }]);
      if (error) throw error;
      fetchClients(); 
      setViewState('client-profile');
    } catch (e) { alert(e.message); }
  };

  const saveMeeting = async () => {
    if (!activeMeeting) return;
    try {
      const content = editorRef.current ? editorRef.current.innerHTML : activeMeeting.contenido;
      const { error } = await supabase.from('reuniones').update({ contenido: content, total_time: time }).eq('id', activeMeeting.id);
      if (error) throw error;
      setViewState('client-profile');
      setActiveMeeting(null);
      setIsTimerRunning(false);
    } catch (e) { alert(e.message); }
  };

  const uniqueClients = useMemo(() => {
    return clients.filter(c => normalizeText(c.nombre).includes(normalizeText(clientSearch)));
  }, [clients, clientSearch]);

  const filteredMeetings = useMemo(() => {
    if (!activeClient) return [];
    return meetingsList.filter(m => m.cliente_id === activeClient.id && normalizeText(m.session_title).includes(normalizeText(meetingSearch)));
  }, [meetingsList, activeClient, meetingSearch]);

  const filteredAgencyClients = useMemo(() => {
    let list = agencyClients;
    if (activeAgencyPlan !== 'Todos') {
      list = list.filter(c => c.plan === activeAgencyPlan);
    }
    return list;
  }, [agencyClients, activeAgencyPlan]);

  const formatTime = (s) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const handleCalc = (val) => {
    if (val === '=') { try { setCalcDisplay(eval(calcDisplay).toString()); } catch (e) { setCalcDisplay('ERR'); } }
    else if (val === 'C') setCalcDisplay('0');
    else if (val === 'DEL') setCalcDisplay(calcDisplay.length > 1 ? calcDisplay.slice(0, -1) : '0');
    else setCalcDisplay(prev => prev === '0' ? val : prev + val);
  };

  const formatText = (cmd, val, e) => { e.preventDefault(); document.execCommand(cmd, false, val); };

  return (
    <div className={`flex flex-col h-screen w-full ${colors.bg} ${colors.text} overflow-hidden selection:bg-emerald-500/30 font-sans`}>
      <nav className="h-20 border-b border-white/5 flex items-center justify-between px-10 bg-[#121212]/80 backdrop-blur-3xl relative z-50">
         <div className="flex items-center gap-12">
            <div className="flex items-center gap-4">
               <div className="w-10 h-10 bg-[#1a1a1a] rounded-2xl flex items-center justify-center border border-white/5 shadow-xl"><Zap size={20} className="text-emerald-500"/></div>
               <div>
                  <h1 className="text-sm font-black tracking-[0.3em] uppercase text-white">Sovereign <span className="text-neutral-600">OS</span></h1>
                  <p className="text-[7px] text-emerald-500 font-black uppercase tracking-[0.4em]">Neural Production</p>
               </div>
            </div>
            <div className="flex bg-black/40 rounded-2xl p-1 border border-white/5">
                <button onClick={() => setViewState('client-list')} className={`px-10 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewState.includes('client') || viewState === 'session' ? 'bg-emerald-500 text-black shadow-lg' : 'text-neutral-700 hover:text-white'}`}>Clientes</button>
                <button onClick={() => setViewState('agency-hub')} className={`px-10 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewState.includes('agency') ? 'bg-amber-500 text-black shadow-lg' : 'text-neutral-700 hover:text-white'}`}>Agencia Pro</button>
                <button onClick={() => setViewState('project-engine')} className={`px-10 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewState === 'project-engine' ? 'bg-purple-500 text-white shadow-lg' : 'text-neutral-700 hover:text-white'}`}>Edición de Video</button>
            </div>
         </div>
         <div className="flex items-center gap-8">
            <div className="flex items-center gap-3 px-4 py-2 bg-emerald-500/5 rounded-full border border-emerald-500/10">
               <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
               <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">System Ready</span>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-[#1a1a1a] border border-white/5 flex items-center justify-center overflow-hidden shadow-xl text-neutral-600"><UserIcon size={20}/></div>
         </div>
       </nav>

       {viewState === 'client-list' && (
        <div className="flex flex-col flex-1 min-h-0 p-12 space-y-12 max-w-[1900px] mx-auto w-full animate-in fade-in duration-700 overflow-y-auto mac-scrollbar">
            {/* OPERATIONAL STATUS BAR */}
            <div className="grid grid-cols-4 gap-6">
               {[
                 { label: 'Capacidad Operativa', val: '98.4%', icon: Activity, color: 'text-emerald-500' },
                 { label: 'Proyectos en Render', val: uniqueClients.length, icon: Video, color: 'text-blue-500' },
                 { label: 'Latencia Neural', val: '0.4ms', icon: Cpu, color: 'text-purple-500' },
                 { label: 'Base de Clientes', val: uniqueClients.length, icon: Users, color: 'text-amber-500' }
               ].map((s, i) => (
                 <div key={i} className="bg-[#0d0d0d] border border-white/5 rounded-3xl p-8 flex items-center justify-between shadow-2xl group hover:border-white/10 transition-all">
                    <div>
                       <p className="text-[10px] font-black text-neutral-600 uppercase tracking-widest mb-2">{s.label}</p>
                       <p className="text-3xl font-black text-white">{s.val}</p>
                    </div>
                    <div className={`w-14 h-14 rounded-2xl bg-white/[0.03] flex items-center justify-center ${s.color} group-hover:scale-110 transition-all shadow-inner`}><s.icon size={24}/></div>
                 </div>
               ))}
            </div>

            <header className="flex justify-between items-end pt-12">
               <div>
                  <h2 className="text-2xl font-black text-white uppercase tracking-tighter leading-none">Agenda de Clientes</h2>
               </div>
               <div className="flex gap-4">
                  <div className="relative group">
                     <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-neutral-800 group-focus-within:text-emerald-500 transition-all" size={18}/>
                     <input type="text" value={clientSearch} onChange={e=>setClientSearch(e.target.value)} placeholder="BUSCAR EN BÓVEDA..." className="bg-[#0d0d0d] border border-white/5 rounded-2xl py-5 pl-16 pr-8 text-[11px] font-black w-72 uppercase tracking-widest focus:border-emerald-500/50 transition-all outline-none text-white shadow-2xl" />
                  </div>
                  <button onClick={() => setIsClientModalOpen(true)} className="px-10 py-5 bg-white text-black rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-emerald-500 hover:text-white hover:scale-105 transition-all shadow-2xl flex items-center gap-4">
                     <Plus size={18} strokeWidth={3}/> Nuevo Registro
                  </button>
               </div>
            </header>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8 pt-10">
               {uniqueClients.map(c => (
                 <div key={c.id} onClick={() => openClientProfile(c)} className="bg-[#0d0d0d] border border-white/5 rounded-3xl p-8 hover:border-emerald-500/40 transition-all cursor-pointer flex flex-col items-center justify-center group relative overflow-hidden shadow-2xl aspect-square">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-all"></div>
                    
                    <div className="w-24 h-24 rounded-2xl bg-black/40 border border-white/5 mb-8 flex items-center justify-center overflow-hidden shadow-inner group-hover:scale-105 transition-all">
                       {c.foto_url ? (
                         <img src={c.foto_url} alt={c.nombre} className="w-full h-full object-cover" />
                       ) : (
                         <span className="text-3xl font-black text-neutral-800 group-hover:text-emerald-500 transition-all">{c.nombre.charAt(0)}</span>
                       )}
                    </div>

                    <p className="text-sm font-black text-white uppercase tracking-widest truncate w-full text-center mb-2">{c.nombre}</p>
                    <p className="text-[9px] text-neutral-700 font-black uppercase tracking-[0.3em] mb-4">{c.empresa || 'Independiente'}</p>
                    
                    <div className="flex flex-col items-center gap-1 mb-6">
                       <span className="text-[8px] font-black text-neutral-500 uppercase tracking-widest">{c.nacionalidad || 'Global'}</span>
                       <span className="text-[8px] font-mono font-black text-neutral-800 uppercase tracking-widest">{c.telefono || 'No Phone'}</span>
                    </div>

                    <div className="mt-4 w-full pt-6 border-t border-white/5 flex items-center justify-between opacity-30 group-hover:opacity-100 transition-all">
                       <div className="flex gap-1.5">
                          {[...Array(3)].map((_,i)=><Star key={i} size={10} fill="#10b981" className="text-emerald-500"/>)}
                       </div>
                       <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Active</span>
                    </div>
                 </div>
               ))}
            </div>
        </div>
      )}

      {viewState === 'client-profile' && activeClient && (
        <div className="flex flex-col flex-1 min-h-0 p-10 space-y-10 max-w-[1500px] mx-auto w-full animate-in slide-in-from-right duration-500 overflow-y-auto mac-scrollbar">
           <header className="flex items-center justify-between"><div className="flex items-center gap-8"><button onClick={() => setViewState('client-list')} className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-neutral-500 hover:text-[#10b981] transition-all"><ArrowLeft size={24}/></button><div><h3 className="text-3xl font-black text-white uppercase tracking-tighter">{activeClient.nombre}</h3><p className="text-[10px] text-neutral-500 font-black uppercase tracking-widest">{activeClient.empresa || 'Independent Production'}</p></div></div><button onClick={createMeeting} className="px-10 py-5 bg-[#10b981] text-white rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center gap-4 shadow-xl"><Video size={18}/> Iniciar Producción</button></header>
           <div className="space-y-4">{filteredMeetings.map(m => (<div key={m.id} onClick={() => openMeeting(m)} className={`${colors.card} rounded-[2rem] p-8 border border-white/5 flex items-center justify-between hover:bg-white/[0.01] transition-all cursor-pointer shadow-2xl`}><div className="flex items-center gap-10"><div className="w-16 h-16 rounded-2xl bg-neutral-900 flex items-center justify-center text-[#10b981]"><FileVideo size={28}/></div><div><h4 className="text-2xl font-black text-white uppercase tracking-tighter">{m.session_title}</h4><p className="text-[10px] text-neutral-600 font-bold uppercase">{m.fecha}</p></div></div><div className="text-right"><p className="text-[8px] text-neutral-700 font-black uppercase mb-1">Elapsed</p><p className="text-2xl font-black text-white font-mono">{formatTime(m.total_time)}</p></div></div>))}</div>
        </div>
      )}

      {viewState === 'agency-hub' && (
        <div className="flex flex-col flex-1 min-h-0 p-12 space-y-12 max-w-[1900px] mx-auto w-full animate-in fade-in duration-700 overflow-y-auto mac-scrollbar">
            {/* AGENCY OPERATIONAL STATUS */}
            <div className="grid grid-cols-4 gap-6">
               {[
                 { label: 'Proyectos Activos', val: agencyClients.length, icon: Target, color: 'text-amber-500' },
                 { label: 'Conversión Mensual', val: '24%', icon: TrendingUp, color: 'text-emerald-500' },
                 { label: 'Nivel de Satisfacción', val: '9.8', icon: Star, color: 'text-blue-500' },
                 { label: 'Empresas Vinculadas', val: agencyClients.length, icon: Building2, color: 'text-purple-500' }
               ].map((s, i) => (
                 <div key={i} className="bg-[#0d0d0d] border border-white/5 rounded-3xl p-8 flex items-center justify-between shadow-2xl group hover:border-white/10 transition-all">
                    <div>
                       <p className="text-[10px] font-black text-neutral-600 uppercase tracking-widest mb-2">{s.label}</p>
                       <p className="text-3xl font-black text-white">{s.val}</p>
                    </div>
                    <div className={`w-14 h-14 rounded-2xl bg-white/[0.03] flex items-center justify-center ${s.color} group-hover:scale-110 transition-all shadow-inner`}><s.icon size={24}/></div>
                 </div>
               ))}
            </div>

            <header className="flex justify-between items-end pt-12">
               <div>
                  <h2 className="text-2xl font-black text-white uppercase tracking-tighter leading-none">Agency Pro Hub</h2>
               </div>
               <button onClick={() => setIsCompanyModalOpen(true)} className="px-12 py-5 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest hover:scale-105 transition-all shadow-2xl flex items-center gap-4">
                 <Plus size={20} strokeWidth={3}/> New Strategy Project
               </button>
            </header>

            <div className="grid grid-cols-4 gap-4 bg-[#0d0d0d] p-3 rounded-3xl border border-white/5 shadow-2xl">
               {['Básico', 'Intermedio', 'Avanzado', 'Personalizado'].map(p => {
                 const count = agencyClients.filter(c => c.plan === p).length;
                 return (
                   <button key={p} onClick={() => setActiveAgencyPlan(p)} className={`p-6 rounded-2xl transition-all flex flex-col items-center gap-2 ${activeAgencyPlan === p ? 'bg-amber-500 text-white shadow-2xl scale-95' : 'text-neutral-500 hover:text-white hover:bg-white/5'}`}>
                     <h4 className="text-[10px] font-black uppercase tracking-widest">{p}</h4>
                     <p className="text-2xl font-black">{count}</p>
                   </button>
                 );
               })}
            </div>

            <div className="space-y-8">
              <div className="flex items-center justify-between px-4">
                <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
                  Strategic Graphical Timeline
                </h3>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500"></div><span className="text-[8px] font-black text-neutral-600 uppercase">On Time</span></div>
                  <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-rose-500"></div><span className="text-[8px] font-black text-neutral-600 uppercase">Critical</span></div>
                </div>
              </div>

              <div className="bg-white/[0.01] border border-white/5 rounded-[3rem] p-10 mac-scrollbar overflow-x-auto">
                <div className="min-w-[1200px] space-y-6">
                  {filteredAgencyClients.map((company, idx) => {
                    const meta = company.metadata || {};
                    const metrics = meta.metrics || { loyalty: 'Normal', payment: 'A tiempo', growth: 'Estable' };
                    const isPremium = metrics.loyalty === 'VIP' || metrics.growth === 'Top Tier';
                    
                    return (
                      <div key={company.id} onClick={() => { setSelectedCompany(company); fetchStrategies(company.id); setViewState('agency-session'); }} className="group flex items-center gap-8 p-6 bg-black/40 border border-white/5 rounded-[2rem] hover:border-amber-500/40 hover:bg-white/[0.02] transition-all cursor-pointer relative overflow-hidden shadow-xl">
                        {isPremium && <div className="absolute top-0 right-0 p-4"><Crown size={14} className="text-amber-500 animate-bounce"/></div>}
                        
                        <div className="w-24 shrink-0">
                          <h4 className="text-sm font-black text-white uppercase truncate">{company.nombre_empresa}</h4>
                          <p className="text-[8px] text-neutral-600 font-black uppercase">{company.dueño}</p>
                        </div>

                        <div className="flex-1 flex items-center gap-4">
                          <div className="flex-1 h-3 bg-neutral-900 rounded-full overflow-hidden relative border border-white/5">
                            <div className={`absolute inset-y-0 left-0 bg-gradient-to-r ${idx % 2 === 0 ? 'from-amber-500 to-orange-500' : 'from-emerald-500 to-teal-500'} rounded-full transition-all duration-1000`} style={{ width: `${30 + (idx * 15) % 70}%` }}></div>
                          </div>
                          <span className="text-[9px] font-mono font-black text-neutral-500">{30 + (idx * 15) % 70}%</span>
                        </div>

                        <div className="flex items-center gap-6 shrink-0">
                           <div className="flex gap-2">
                             {['instagram', 'tiktok', 'facebook', 'youtube'].map(red => (
                               <div key={red} className={`w-8 h-8 rounded-lg flex items-center justify-center border ${meta.redes?.[red] ? 'border-amber-500/40 text-amber-500 bg-amber-500/10' : 'border-white/5 text-neutral-800'}`}>
                                 {red === 'instagram' && <Instagram size={14}/>}
                                 {red === 'tiktok' && <TiktokIcon size={14}/>}
                                 {red === 'facebook' && <Facebook size={14}/>}
                                 {red === 'youtube' && <Youtube size={14}/>}
                               </div>
                             ))}
                           </div>
                           <div className="px-4 py-2 bg-white/5 rounded-xl border border-white/5">
                             <p className="text-[7px] text-neutral-700 font-black uppercase mb-1">Status</p>
                             <p className={`text-[8px] font-black uppercase ${metrics.payment === 'A tiempo' ? 'text-emerald-500' : 'text-rose-500'}`}>{metrics.payment}</p>
                           </div>
                        </div>
                      </div>
                    );
                  })}
                  {filteredAgencyClients.length === 0 && (
                    <div className="py-20 text-center border border-dashed border-white/10 rounded-[2rem] bg-white/[0.01]">
                      <p className="text-[10px] font-black text-neutral-700 uppercase tracking-widest">No Strategic Projects in this Tier</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
        </div>
      )}

      {viewState === 'agency-session' && selectedCompany && (
        <div className="flex flex-col flex-1 min-h-0 p-10 space-y-10 max-w-[1500px] mx-auto w-full animate-in slide-in-from-right duration-500 overflow-y-auto mac-scrollbar">
           <header className="flex items-center justify-between"><div className="flex items-center gap-8"><button onClick={() => setViewState('agency-hub')} className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-neutral-500 hover:text-amber-500 transition-all"><ArrowLeft size={24}/></button><div><h3 className="text-3xl font-black text-white uppercase tracking-tighter">{selectedCompany.nombre_empresa}</h3><p className="text-[10px] text-amber-500 font-black uppercase tracking-widest">{selectedCompany.plan}</p></div></div><button onClick={createStrategy} className="px-10 py-5 bg-white text-black rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center gap-4 hover:bg-amber-500 hover:text-white transition-all shadow-xl"><Sparkles size={18}/> Nueva Estrategia</button></header>
           <div className="space-y-4">{strategies.map(s => (<div key={s.id} onClick={() => { setActiveStrategy(s); setEditorContent(s.contenido); setTime(s.total_time); setViewState('agency-editor'); }} className={`${colors.card} rounded-[2rem] p-8 flex items-center justify-between hover:border-amber-500/30 transition-all cursor-pointer shadow-2xl`}><div className="flex items-center gap-10"><div className="w-16 h-16 rounded-2xl bg-neutral-900 flex items-center justify-center text-amber-500"><Target size={28}/></div><h4 className="text-2xl font-black text-white uppercase tracking-tighter">{s.titulo_estrategia}</h4></div><ChevronRight size={24} className="text-neutral-800"/></div>))}</div>
        </div>
      )}

      {viewState === 'agency-editor' && activeStrategy && (
        <div className="flex flex-col h-full overflow-hidden animate-in fade-in duration-500">
           <header className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-black/40">
              <div className="flex items-center gap-6"><button onClick={() => setViewState('agency-session')} className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-neutral-600 hover:text-amber-500 transition-all"><ArrowLeft size={20}/></button><h3 className="text-lg font-black text-white uppercase">{activeStrategy.titulo_estrategia}</h3></div>
              <div className="flex items-center gap-4"><div className="bg-[#080808] border border-white/5 rounded-xl px-5 py-2 flex items-center gap-4 text-xl font-mono font-black text-white">{formatTime(time)}<button onClick={() => setIsTimerRunning(!isTimerRunning)} className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center">{isTimerRunning ? <Pause size={14}/> : <Play size={14}/>}</button></div><button onClick={saveStrategy} className="px-6 py-3 bg-white text-black text-[10px] font-black rounded-xl uppercase tracking-widest shadow-xl"><Save size={16}/> Guardar</button></div>
           </header>
           <div className="flex-1 flex p-4 gap-4 overflow-hidden max-w-[1800px] mx-auto w-full">
              <div className="w-[300px] space-y-4"><div className="bg-[#121418] p-5 rounded-2xl shadow-2xl text-right text-2xl font-mono font-black text-white bg-[#080808] p-4 rounded-xl border border-white/5 shadow-inner">{calcDisplay}</div><div className="grid grid-cols-4 gap-2">{['C','DEL','%','/','7','8','9','*','4','5','6','-','1','2','3','+','0','.','=','+'].slice(0,19).map(btn => (<button key={btn} onClick={() => handleCalc(btn)} className="h-10 rounded-lg text-[10px] font-black bg-white/5 text-neutral-500">{btn}</button>))}<button onClick={()=>handleCalc('=')} className="h-10 rounded-lg text-[10px] font-black bg-amber-500 text-white col-span-2 shadow-lg">=</button></div></div>
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
           <div className={`${colors.card} border-t-4 border-t-emerald-500 rounded-[3rem] w-full max-w-xl p-12 space-y-8 shadow-2xl`}>
                <div className="flex justify-between items-center">
                   <h3 className="text-3xl font-black text-white uppercase tracking-tighter">Nuevo <span className="text-emerald-500">Registro</span></h3>
                   <button onClick={() => setIsClientModalOpen(false)} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-neutral-500 hover:text-white transition-all"><X size={20}/></button>
                </div>
                
                <div className="space-y-4">
                   <div className="space-y-2">
                      <p className="text-[8px] text-neutral-700 font-black uppercase ml-2 tracking-widest">Información Básica</p>
                      <input type="text" value={newClient.nombre} onChange={e=>setNewClient({...newClient, nombre: e.target.value})} placeholder="Nombre completo..." className={`w-full ${colors.input} rounded-2xl p-5 text-sm outline-none focus:border-emerald-500/50 transition-all`} />
                      <input type="text" value={newClient.empresa} onChange={e=>setNewClient({...newClient, empresa: e.target.value})} placeholder="Empresa / Marca..." className={`w-full ${colors.input} rounded-2xl p-5 text-sm outline-none focus:border-emerald-500/50 transition-all mt-2`} />
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                         <p className="text-[8px] text-neutral-700 font-black uppercase ml-2 tracking-widest">Nacionalidad</p>
                         <input type="text" value={newClient.nacionalidad} onChange={e=>setNewClient({...newClient, nacionalidad: e.target.value})} placeholder="Ej: Peruana" className={`w-full ${colors.input} rounded-2xl p-5 text-sm outline-none focus:border-emerald-500/50 transition-all`} />
                      </div>
                      <div className="space-y-2">
                         <p className="text-[8px] text-neutral-700 font-black uppercase ml-2 tracking-widest">Teléfono</p>
                         <input type="text" value={newClient.telefono} onChange={e=>setNewClient({...newClient, telefono: e.target.value})} placeholder="+00 000..." className={`w-full ${colors.input} rounded-2xl p-5 text-sm outline-none focus:border-emerald-500/50 transition-all`} />
                      </div>
                   </div>

                   <div className="space-y-2">
                      <p className="text-[8px] text-neutral-700 font-black uppercase ml-2 tracking-widest">URL de Foto de Perfil</p>
                      <input type="text" value={newClient.foto} onChange={e=>setNewClient({...newClient, foto: e.target.value})} placeholder="https://..." className={`w-full ${colors.input} rounded-2xl p-5 text-sm outline-none focus:border-emerald-500/50 transition-all`} />
                   </div>
                </div>

                <div className="flex gap-4 pt-4">
                   <button onClick={() => setIsClientModalOpen(false)} className="flex-1 py-5 text-neutral-700 font-black uppercase text-[10px] tracking-widest hover:text-white transition-all">Cancelar</button>
                   <button onClick={handleCreateClient} className="flex-[2] py-5 bg-emerald-500 text-black rounded-2xl font-black uppercase text-[10px] shadow-2xl hover:scale-105 transition-all tracking-widest">Vincular Nexus</button>
                </div>
            </div>
         </div>
      )}

      {isCompanyModalOpen && (
        <div className="fixed inset-0 z-[800] flex items-center justify-center bg-black/95 backdrop-blur-2xl p-8 animate-in zoom-in duration-300">
           <div className="bg-[#0a0a0a] border border-white/5 rounded-[3rem] w-full max-w-2xl overflow-hidden shadow-2xl">
              <header className="px-10 py-8 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                 <div><h3 className="text-2xl font-black text-white uppercase tracking-tighter">Strategic <span className="text-amber-500">Link</span></h3><p className="text-[8px] text-neutral-600 font-black uppercase tracking-[0.4em] mt-1">Agency Connection Node</p></div>
                 <button onClick={() => setIsCompanyModalOpen(false)} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-neutral-500 hover:text-white transition-all"><X size={20}/></button>
              </header>

              <div className="flex border-b border-white/5 bg-black/40">
                 {['general', 'redes', 'cm'].map(tab => (
                    <button key={tab} onClick={() => setAgencyTab(tab)} className={`flex-1 py-4 text-[9px] font-black uppercase tracking-widest transition-all ${agencyTab === tab ? 'text-amber-500 border-b-2 border-amber-500' : 'text-neutral-700 hover:text-white'}`}>
                       {tab === 'general' ? 'Información' : tab === 'redes' ? 'Social Media' : 'CM Access'}
                    </button>
                 ))}
              </div>

              <div className="p-10 space-y-6 max-h-[60vh] overflow-y-auto mac-scrollbar">
                 {agencyTab === 'general' && (
                    <div className="space-y-4 animate-in fade-in duration-500">
                       <div className="space-y-2"><p className="text-[8px] text-neutral-700 font-black uppercase ml-2 tracking-widest">Empresa / Marca</p><input type="text" value={newCompany.nombre_empresa} onChange={e=>setNewCompany({...newCompany, nombre_empresa: e.target.value})} placeholder="Nombre de la marca..." className="w-full bg-white/[0.03] border border-white/5 rounded-2xl p-5 text-sm text-white outline-none focus:border-amber-500/50 transition-all" /></div>
                       <div className="space-y-2"><p className="text-[8px] text-neutral-700 font-black uppercase ml-2 tracking-widest">Director / Socio</p><input type="text" value={newCompany.dueño} onChange={e=>setNewCompany({...newCompany, dueño: e.target.value})} placeholder="Nombre del responsable..." className="w-full bg-white/[0.03] border border-white/5 rounded-2xl p-5 text-sm text-white outline-none focus:border-amber-500/50 transition-all" /></div>
                       <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2"><p className="text-[8px] text-neutral-700 font-black uppercase ml-2 tracking-widest">Email Corporativo</p><input type="email" value={newCompany.email} onChange={e=>setNewCompany({...newCompany, email: e.target.value})} placeholder="email@empresa.com" className="w-full bg-white/[0.03] border border-white/5 rounded-2xl p-5 text-sm text-white outline-none focus:border-amber-500/50 transition-all" /></div>
                          <div className="space-y-2"><p className="text-[8px] text-neutral-700 font-black uppercase ml-2 tracking-widest">Teléfono / WhatsApp</p><input type="text" value={newCompany.telefono} onChange={e=>setNewCompany({...newCompany, telefono: e.target.value})} placeholder="+00 000 000 000" className="w-full bg-white/[0.03] border border-white/5 rounded-2xl p-5 text-sm text-white outline-none focus:border-amber-500/50 transition-all" /></div>
                       </div>
                    </div>
                 )}

                 {agencyTab === 'redes' && (
                    <div className="space-y-4 animate-in fade-in duration-500">
                       {['instagram', 'tiktok', 'facebook', 'youtube'].map(red => (
                          <div key={red} className="flex items-center gap-4 bg-white/[0.02] p-2 rounded-2xl border border-white/5">
                             <div className="w-12 h-12 rounded-xl bg-neutral-900 flex items-center justify-center text-amber-500 shadow-lg">
                                {red === 'instagram' && <Instagram size={20}/>}
                                {red === 'tiktok' && <TiktokIcon size={20}/>}
                                {red === 'facebook' && <Facebook size={20}/>}
                                {red === 'youtube' && <Youtube size={20}/>}
                             </div>
                             <input type="text" value={newCompany.redes[red]} onChange={e=>setNewCompany({...newCompany, redes: {...newCompany.redes, [red]: e.target.value}})} placeholder={`URL o @User de ${red}...`} className="flex-1 bg-transparent p-4 text-sm text-white outline-none tracking-widest" />
                          </div>
                       ))}
                    </div>
                 )}

                 {agencyTab === 'cm' && (
                    <div className="space-y-6 animate-in fade-in duration-500">
                       <div className="p-6 bg-amber-500/5 border border-amber-500/20 rounded-3xl"><p className="text-[9px] text-amber-500 font-black uppercase mb-2 tracking-widest">Security Protocol</p><p className="text-[10px] text-neutral-600 font-bold uppercase leading-relaxed tracking-wider">Las credenciales se encriptan y se almacenan exclusivamente para gestión de Community Manager.</p></div>
                       {['instagram', 'tiktok', 'facebook', 'youtube'].map(red => (
                          <div key={red} className="space-y-3 p-6 bg-white/[0.02] rounded-3xl border border-white/5 shadow-inner">
                             <h4 className="text-[9px] font-black text-amber-500 uppercase tracking-[0.2em] flex items-center gap-2">
                                {red === 'instagram' && <Instagram size={12}/>}
                                {red === 'tiktok' && <TiktokIcon size={12}/>}
                                {red === 'facebook' && <Facebook size={12}/>}
                                {red === 'youtube' && <Youtube size={12}/>}
                                Access {red}
                             </h4>
                             <div className="grid grid-cols-2 gap-3">
                                <input type="text" value={newCompany.credentials[red].user} onChange={e=>setNewCompany({...newCompany, credentials: {...newCompany.credentials, [red]: {...newCompany.credentials[red], user: e.target.value}}})} placeholder="Usuario / Email" className="w-full bg-black/40 border border-white/5 rounded-xl p-4 text-[11px] text-white outline-none focus:border-amber-500/50 transition-all" />
                                <div className="relative">
                                   <input type={showPass[red] ? 'text' : 'password'} value={newCompany.credentials[red].pass} onChange={e=>setNewCompany({...newCompany, credentials: {...newCompany.credentials, [red]: {...newCompany.credentials[red], pass: e.target.value}}})} placeholder="Contraseña" className="w-full bg-black/40 border border-white/5 rounded-xl p-4 text-[11px] text-white outline-none pr-12 focus:border-amber-500/50 transition-all" />
                                   <button onClick={() => setShowPass({...showPass, [red]: !showPass[red]})} className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-700 hover:text-white transition-all">
                                      {showPass[red] ? <EyeOff size={16}/> : <Eye size={16}/>}
                                   </button>
                                </div>
                             </div>
                          </div>
                       ))}
                    </div>
                 )}
              </div>

              <footer className="px-10 py-8 bg-white/[0.02] border-t border-white/5 flex gap-4">
                 <button onClick={() => setIsCompanyModalOpen(false)} className="flex-1 py-5 text-neutral-700 font-black uppercase text-[10px] hover:text-white transition-all tracking-[0.2em]">Descartar</button>
                 <button onClick={handleCreateAgencyClient} className="flex-[2] py-5 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-2xl font-black uppercase text-[10px] shadow-[0_0_30px_rgba(245,158,11,0.2)] hover:scale-105 transition-all tracking-[0.2em]">Sincronizar Nexus Agency</button>
              </footer>
           </div>
        </div>
      )}

      {viewState === 'project-engine' && (
        <ProjectEngineView />
      )}
    </div>
  );
};

const ProjectEngineView = () => {

  const [activeTab, setActiveTab] = useState('estructurador');
  const [carpetaMaestra, setCarpetaMaestra] = useState('Base de Edición Principal');
  const [empresa, setEmpresa] = useState('');
  const [proyecto, setProyecto] = useState('');
  const [selectedPremiere, setSelectedPremiere] = useState('');
  const [selectedAE, setSelectedAE] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  // 1. Selector de directorio
  const [destinationPath, setDestinationPath] = useState('');
  const [dirHandle, setDirHandle] = useState(null);

  // 2. Estados de las 10 Herramientas
  // H1: Compresor
  const [compPreset, setCompPreset] = useState('tiktok');
  const [isCompressing, setIsCompressing] = useState(false);
  const [compProgress, setCompProgress] = useState(0);
  const [compSuccess, setCompSuccess] = useState(false);

  // H2: Bitrate Calc
  const [calcRes, setCalcRes] = useState('1080p');
  const [calcFps, setCalcFps] = useState(30);
  const [calcMin, setCalcMin] = useState(5);

  // H3: Timecode Calc
  const [fpsVal, setFpsVal] = useState(30);
  const [tcInput, setTcInput] = useState('00:01:24:12');
  const [framesOutput, setFramesOutput] = useState(2532);
  const [framesInput, setFramesInput] = useState(3000);
  const [tcOutput, setTcOutput] = useState('00:01:40:00');

  // H4: Notas de Edición
  const [editNotes, setEditNotes] = useState('00:15 - Cortar silencio inicial\n01:30 - Aplicar zoom en el gancho\n02:45 - Inserción de CTA final');

  // H5: Nomenclatura PRO
  const [nomClient, setNomClient] = useState('CLIENTE');
  const [nomProj, setNomProj] = useState('PROYECTO');
  const [nomVer, setNomVer] = useState('V1');
  const [nomAspect, setNomAspect] = useState('H');

  // H6: Atajos
  const [shortcutQuery, setShortcutQuery] = useState('');

  // H7: Crop Guide Overlay
  const [cropGuide, setCropGuide] = useState('916');

  // H8: Recursos adicionales
  const [incSFX, setIncSFX] = useState(true);
  const [incLogos, setIncLogos] = useState(false);
  const [incMOGRTs, setIncMOGRTs] = useState(false);

  // H9: ZIP Archivador
  const [isZipping, setIsZipping] = useState(false);
  const [zipProgress, setZipProgress] = useState(0);
  const [zipSuccess, setZipSuccess] = useState(false);

  // H10: Caché SSD
  const [ssdCacheSize, setSsdCacheSize] = useState(42.8);
  const [isCleaningCache, setIsCleaningCache] = useState(false);
  const [cacheSuccess, setCacheSuccess] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  const templates = [
    '1080x1920_25fps', '1080x1920_30fps', '1080x1920_60fps',
    '1920x1080_25fps', '1920x1080_30fps', '1920x1080_60fps',
    '4K_Horizontal_25fps', '4K_Horizontal_30fps', '4K_Horizontal_60fps',
    '4K_Vertical_25fps', '4K_Vertical_30fps', '4K_Vertical_60fps'
  ];

  // H3: Handlers
  const handleTcToFrames = (tc, fps) => {
    const parts = tc.split(':');
    if (parts.length !== 4) return;
    const h = parseInt(parts[0]) || 0;
    const m = parseInt(parts[1]) || 0;
    const s = parseInt(parts[2]) || 0;
    const f = parseInt(parts[3]) || 0;
    const total = ((h * 3600 + m * 60 + s) * fps) + f;
    setFramesOutput(total);
  };

  const handleFramesToTc = (fr, fps) => {
    const f = fr % fps;
    const totalSecs = Math.floor(fr / fps);
    const s = totalSecs % 60;
    const totalMins = Math.floor(totalSecs / 60);
    const m = totalMins % 60;
    const h = Math.floor(totalMins / 60);
    const pad = (n) => String(n).padStart(2, '0');
    setTcOutput(`${pad(h)}:${pad(m)}:${pad(s)}:${pad(f)}`);
  };

  // H4: Notes Download
  const downloadNotes = () => {
    const element = document.createElement("a");
    const file = new Blob([editNotes], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `notas_edicion_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // H1: Compression Simulation
  const runCompression = () => {
    setIsCompressing(true);
    setCompSuccess(false);
    setCompProgress(0);
    const interval = setInterval(() => {
      setCompProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsCompressing(false);
          setCompSuccess(true);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  // H9: ZIP Simulation
  const runZip = () => {
    setIsZipping(true);
    setZipSuccess(false);
    setZipProgress(0);
    const interval = setInterval(() => {
      setZipProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsZipping(false);
          setZipSuccess(true);
          return 100;
        }
        return prev + 8;
      });
    }, 150);
  };

  // H10: Cache cleaner simulation
  const cleanSsdCache = () => {
    setIsCleaningCache(true);
    setCacheSuccess(false);
    setTimeout(() => {
      setIsCleaningCache(false);
      setCacheSuccess(true);
      setSsdCacheSize(0);
    }, 1500);
  };

  // Folder picking workflow
  const handleSelectDirectory = async () => {
    try {
      if (window.electronAPI) {
        setStatusMsg('Abriendo selector de directorio (App Nativa)...');
        const path = await window.electronAPI.selectDirectory();
        if (path) {
          setDestinationPath(path);
          setStatusMsg('Destino vinculado.');
        } else {
          setStatusMsg('Selección cancelada.');
        }
      } else {
        if (!window.showDirectoryPicker) {
          throw new Error('Navegador no soportado. Usa Chrome.');
        }
        setStatusMsg('Por favor selecciona la ubicación en tu disco duro...');
        const handle = await window.showDirectoryPicker({ mode: 'readwrite' });
        setDirHandle(handle);
        setDestinationPath(handle.name || 'Directorio Vinculado');
        setStatusMsg('Directorio local vinculado.');
      }
    } catch (e) {
      console.error(e);
      setStatusMsg(`Error: ${e.message}`);
    }
  };

  const handleGenerate = async () => {
    if (!carpetaMaestra || !empresa || !proyecto) {
      alert('Por favor completa todos los campos de Nomenclatura.');
      return;
    }
    if (!destinationPath) {
      alert('Por favor selecciona primero una ubicación de destino.');
      return;
    }

    try {
      setIsGenerating(true);
      setStatusMsg('Preparando entorno de producción...');

      if (window.electronAPI) {
        setStatusMsg(`Generando estructura de proyecto en: ${destinationPath}...`);
        const result = await window.electronAPI.createFolderStructure({
          rootPath: destinationPath,
          empresa,
          proyecto,
          templates: {
            premiere: selectedPremiere,
            afterEffects: selectedAE
          }
        });

        if (!result.success) throw new Error(result.error);
        
      } else {
        if (!dirHandle) {
          throw new Error('Por favor vuelve a vincular el directorio destino.');
        }

        setStatusMsg(`Generando Carpeta Maestra: ${carpetaMaestra}...`);
        const rootDir = await dirHandle.getDirectoryHandle(carpetaMaestra, { create: true });

        setStatusMsg(`Organizando carpeta de empresa: ${empresa}...`);
        const companyDir = await rootDir.getDirectoryHandle(empresa, { create: true });

        const folderName = `${today}_${empresa.replace(/ /g, '_')}_${proyecto.replace(/ /g, '_')}`;
        setStatusMsg(`Estructurando proyecto: ${folderName}...`);
        const projectDir = await companyDir.getDirectoryHandle(folderName, { create: true });
        
        const prDir = await projectDir.getDirectoryHandle('01_Premiere Pro', { create: true });
        const aeDir = await projectDir.getDirectoryHandle('02_After Effects', { create: true });
        const vidDir = await projectDir.getDirectoryHandle('03_video', { create: true });
        await vidDir.getDirectoryHandle('video 01', { create: true });
        await vidDir.getDirectoryHandle('video 02', { create: true });
        await vidDir.getDirectoryHandle('video 03', { create: true });
        await vidDir.getDirectoryHandle('video 04', { create: true });
        await vidDir.getDirectoryHandle('video 06', { create: true });
        await vidDir.getDirectoryHandle('video bar', { create: true });
        await vidDir.getDirectoryHandle('video tragos', { create: true });
        
        await projectDir.getDirectoryHandle('04_audio', { create: true });
        const imgDir = await projectDir.getDirectoryHandle('05_imágenes', { create: true });
        await imgDir.getDirectoryHandle('PNG', { create: true });
        await projectDir.getDirectoryHandle('06_IA', { create: true });

        // Recursos adicionales
        if (incSFX) {
          const sfxDir = await projectDir.getDirectoryHandle('04_audio', { create: true });
          await sfxDir.getDirectoryHandle('SFX_Comunes', { create: true });
        }
        if (incLogos) {
          const lDir = await imgDir.getDirectoryHandle('PNG', { create: true });
          await lDir.getDirectoryHandle('Logotipos_Marca', { create: true });
        }
        if (incMOGRTs) {
          const mDir = await prDir.getDirectoryHandle('MOGRTs_Sovereign', { create: true });
          await mDir.getDirectoryHandle('Lower_Thirds', { create: true });
        }

        if (selectedPremiere) {
          setStatusMsg('Clonando plantilla de Premiere Pro...');
          const res = await fetch(`/plantillas_adobe/premiere_pro/${selectedPremiere}.prproj`);
          if (!res.ok) throw new Error('No se pudo descargar la plantilla');
          const blob = await res.blob();
          const prFileHandle = await prDir.getFileHandle(`${folderName}.prproj`, { create: true });
          const writable = await prFileHandle.createWritable();
          await writable.write(blob);
          await writable.close();
        }

        if (selectedAE) {
          setStatusMsg('Clonando plantilla de After Effects...');
          const res = await fetch(`/plantillas_adobe/after_effects/${selectedAE}.aep`);
          if (!res.ok) throw new Error('No se pudo descargar la plantilla');
          const blob = await res.blob();
          const aeFileHandle = await aeDir.getFileHandle(`${folderName}.aep`, { create: true });
          const writable = await aeFileHandle.createWritable();
          await writable.write(blob);
          await writable.close();
        }
      }

      setStatusMsg('¡Proyecto generado con éxito y blindado en tu disco!');
      setTimeout(() => setStatusMsg(''), 5000);
      setEmpresa('');
      setProyecto('');
    } catch (e) {
      console.error(e);
      setStatusMsg(`Error: ${e.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const cleanFolderName = (txt) => txt.replace(/ /g, '_');
  const finalProjectFolderName = `${today}_${cleanFolderName(empresa || 'CLIENTE')}_${cleanFolderName(proyecto || 'PROYECTO')}`;
  
  // H5 Naming Result
  const finalNamingResult = `${nomClient.toUpperCase().replace(/ /g, '_')}_${nomProj.toUpperCase().replace(/ /g, '_')}_${nomVer.toUpperCase()}_${today}_${nomAspect}`;

  // H2 Bitrate calc output
  const calcEstSizeGB = ((calcRes === '4K' ? 0.35 : 0.08) * calcFps * calcMin * 60 / 1000).toFixed(2);
  const recommendedBitrateMbps = calcRes === '4K' ? (calcFps > 30 ? 60 : 45) : (calcFps > 30 ? 24 : 15);

  const shortcutsList = [
    { key: 'C', desc: 'Herramienta Cuchilla (Corta clips en timeline)', soft: 'Premiere Pro' },
    { key: 'V', desc: 'Herramienta de Selección (Cursor estándar)', soft: 'Premiere Pro' },
    { key: 'A', desc: 'Seleccionar pista adelante (Mueve todo en timeline)', soft: 'Premiere Pro' },
    { key: 'Ctrl + K', desc: 'Añadir corte de edición en el cabezal', soft: 'Premiere Pro' },
    { key: 'Espacio', desc: 'Reproducir / Pausar reproducción de video', soft: 'Premiere Pro / AE' },
    { key: 'J / K / L', desc: 'Retroceder / Parar / Avanzar velocidad variable', soft: 'Premiere Pro / AE' },
    { key: 'U', desc: 'Revelar todos los fotogramas clave (Keyframes) animados', soft: 'After Effects' },
    { key: 'F9', desc: 'Easy Ease (Suaviza aceleración/deceleración)', soft: 'After Effects' },
    { key: 'Alt + [ o ]', desc: 'Recortar punto de entrada o salida de capa', soft: 'After Effects' },
    { key: 'Ctrl + D', desc: 'Duplicar pista o capa seleccionada', soft: 'Premiere Pro / AE' }
  ];
  
  const filteredShortcuts = shortcutsList.filter(s => 
    s.key.toLowerCase().includes(shortcutQuery.toLowerCase()) || 
    s.desc.toLowerCase().includes(shortcutQuery.toLowerCase()) ||
    s.soft.toLowerCase().includes(shortcutQuery.toLowerCase())
  );

  return (
    <div className="flex-grow flex-shrink min-h-0 flex flex-col p-8 lg:p-12 space-y-8 max-w-[1500px] mx-auto w-full animate-in fade-in duration-700 overflow-y-auto mac-scrollbar">
       <header className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/5 pb-6 gap-6">
          <div>
             <h2 className="text-3xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
                Edición de Video
             </h2>
             <p className="text-[9px] text-neutral-500 font-black uppercase tracking-[0.3em] mt-1.5 flex items-center gap-2">
                <HardDrive size={12} className="text-purple-500"/> Suite de Producción y Herramientas Locales
             </p>
          </div>

          {/* TAB SELECTOR */}
          <div className="flex bg-black/40 border border-white/5 rounded-2xl p-1.5 self-start md:self-auto shadow-2xl">
             <button 
                onClick={() => setActiveTab('estructurador')}
                className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-2 ${activeTab === 'estructurador' ? 'bg-neutral-800 text-white border border-neutral-700 shadow-xl' : 'text-neutral-500 hover:text-white'}`}
             >
                <Folder size={14} /> Estructurador Pro
             </button>
             <button 
                onClick={() => setActiveTab('suite')}
                className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-2 ${activeTab === 'suite' ? 'bg-neutral-800 text-white border border-neutral-700 shadow-xl' : 'text-neutral-500 hover:text-white'}`}
             >
                <Wrench size={14} /> Suite de productividad
             </button>
          </div>
       </header>

       {activeTab === 'estructurador' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
             {/* CONFIG (LEFT COLUMN) */}
             <div className="lg:col-span-5 flex flex-col space-y-6">
                {/* SELECT DESTINATION CARD */}
                <div className="bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/[0.04] p-8 rounded-[2rem] shadow-2xl flex flex-col space-y-5">
                   <div className="flex items-center gap-3 pb-3 border-b border-white/5">
                      <div className="w-10 h-10 rounded-xl bg-neutral-800/80 text-neutral-300 flex items-center justify-center border border-neutral-700/50 shadow-inner">
                         <FolderOpen size={18} />
                      </div>
                      <div>
                         <h3 className="text-xs font-black text-white uppercase tracking-widest">1. Vincular Disco Duro</h3>
                         <p className="text-[8px] text-neutral-500 font-bold uppercase tracking-wider">Destino de las Carpetas</p>
                      </div>
                   </div>

                   <div className="space-y-4">
                      <div className="space-y-2">
                         <p className="text-[9px] text-neutral-500 font-black uppercase ml-1 tracking-widest">Ubicación Destino Actual</p>
                         <div className="flex gap-2">
                            <input 
                               type="text" 
                               value={destinationPath || 'Ningún directorio seleccionado...'} 
                               disabled 
                               className="flex-1 bg-black/40 border border-white/5 rounded-2xl p-4 text-xs font-mono text-neutral-400 outline-none truncate" 
                            />
                            <button 
                               onClick={handleSelectDirectory}
                               className="px-5 bg-neutral-800 hover:bg-neutral-700 text-white border border-neutral-700 text-[10px] font-black uppercase rounded-2xl shadow-xl transition-all hover:scale-105 shrink-0"
                            >
                               Examinar...
                            </button>
                         </div>
                      </div>
                   </div>
                </div>

                {/* NOMENCLATURA */}
                <div className="bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/[0.04] p-8 rounded-[2rem] shadow-2xl flex flex-col space-y-5">
                   <div className="flex items-center gap-3 pb-3 border-b border-white/5">
                      <div className="w-10 h-10 rounded-xl bg-neutral-800/80 text-neutral-300 flex items-center justify-center border border-neutral-700/50 shadow-inner">
                         <Folder size={18} />
                      </div>
                      <div>
                         <h3 className="text-xs font-black text-white uppercase tracking-widest">2. Estructurar Nomenclatura</h3>
                         <p className="text-[8px] text-neutral-500 font-bold uppercase tracking-wider">Identificadores del Proyecto</p>
                      </div>
                   </div>

                   <div className="space-y-4">
                      <div className="space-y-2">
                         <label className="text-[9px] text-neutral-500 font-black uppercase ml-1 tracking-widest">Nombre de la Carpeta Maestra</label>
                         <input 
                            type="text" 
                            value={carpetaMaestra} 
                            onChange={e=>setCarpetaMaestra(e.target.value)} 
                            placeholder="Ej: Base de Edición Principal" 
                            className="w-full bg-black/40 border border-white/5 focus:border-neutral-500/50 rounded-2xl p-5 text-sm text-white outline-none transition-all shadow-inner focus:shadow-[0_0_20px_rgba(255,255,255,0.05)]" 
                         />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[9px] text-neutral-500 font-black uppercase ml-1 tracking-widest">Nombre de la Empresa / Cliente</label>
                         <input 
                            type="text" 
                            value={empresa} 
                            onChange={e=>setEmpresa(e.target.value)} 
                            placeholder="Ej: Urbanización Bensa" 
                            className="w-full bg-black/40 border border-white/5 focus:border-neutral-500/50 rounded-2xl p-5 text-sm text-white outline-none transition-all shadow-inner focus:shadow-[0_0_20px_rgba(255,255,255,0.05)]" 
                         />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[9px] text-neutral-500 font-black uppercase ml-1 tracking-widest">Nombre del Proyecto / Temática</label>
                         <input 
                            type="text" 
                            value={proyecto} 
                            onChange={e=>setProyecto(e.target.value)} 
                            placeholder="Ej: Spot Comercial" 
                            className="w-full bg-black/40 border border-white/5 focus:border-neutral-500/50 rounded-2xl p-5 text-sm text-white outline-none transition-all shadow-inner focus:shadow-[0_0_20px_rgba(255,255,255,0.05)]" 
                         />
                      </div>
                   </div>
                </div>
             </div>

             {/* ESTRUCTURA & PLANTILLAS (RIGHT COLUMN) */}
             <div className="lg:col-span-7 flex flex-col space-y-6">
                {/* TEMPLATE PICKER */}
                <div className="bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/[0.04] p-8 rounded-[2rem] shadow-2xl space-y-6">
                   <div className="flex items-center gap-3 pb-4 border-b border-white/5">
                      <div className="w-10 h-10 rounded-xl bg-neutral-800/80 text-neutral-300 flex items-center justify-center border border-neutral-700/50 shadow-inner">
                         <Layers size={18} />
                      </div>
                      <div>
                         <h3 className="text-xs font-black text-white uppercase tracking-widest">3. Plantillas de Inyección</h3>
                         <p className="text-[8px] text-neutral-500 font-bold uppercase tracking-wider">Recursos Proyectados en Estructura</p>
                      </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                         <label className="text-[9px] text-neutral-500 font-black uppercase ml-1 tracking-widest">Plantilla de Premiere Pro</label>
                         <div className="relative">
                            <select 
                               value={selectedPremiere} 
                               onChange={e=>setSelectedPremiere(e.target.value)} 
                               className="w-full bg-black/40 border border-white/5 focus:border-neutral-500/50 rounded-2xl p-5 pr-12 text-sm text-white outline-none transition-all shadow-inner appearance-none focus:shadow-[0_0_20px_rgba(255,255,255,0.05)] cursor-pointer"
                            >
                               <option value="">No incluir Premiere Pro</option>
                               {templates.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                            <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-500"><ChevronRight size={16} className="rotate-90"/></div>
                         </div>
                      </div>
                      <div className="space-y-2">
                         <label className="text-[9px] text-neutral-500 font-black uppercase ml-1 tracking-widest">Plantilla de After Effects</label>
                         <div className="relative">
                            <select 
                               value={selectedAE} 
                               onChange={e=>setSelectedAE(e.target.value)} 
                               className="w-full bg-black/40 border border-white/5 focus:border-neutral-500/50 rounded-2xl p-5 pr-12 text-sm text-white outline-none transition-all shadow-inner appearance-none focus:shadow-[0_0_20px_rgba(255,255,255,0.05)] cursor-pointer"
                            >
                               <option value="">No incluir After Effects</option>
                               {templates.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                            <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-500"><ChevronRight size={16} className="rotate-90"/></div>
                         </div>
                      </div>
                   </div>

                   {/* RECURSOS ADICIONALES CHECKBOXES */}
                   <div className="grid grid-cols-3 gap-4 pt-2">
                      <label className="flex items-center gap-2 cursor-pointer bg-black/30 border border-white/5 rounded-2xl p-3 hover:border-neutral-500/30 transition-all">
                         <input type="checkbox" checked={incSFX} onChange={e=>setIncSFX(e.target.checked)} className="accent-neutral-400 w-4 h-4 rounded-lg cursor-pointer" />
                         <span className="text-[9px] font-black text-neutral-400 uppercase tracking-wider">Audio SFX</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer bg-black/30 border border-white/5 rounded-2xl p-3 hover:border-neutral-500/30 transition-all">
                         <input type="checkbox" checked={incLogos} onChange={e=>setIncLogos(e.target.checked)} className="accent-neutral-400 w-4 h-4 rounded-lg cursor-pointer" />
                         <span className="text-[9px] font-black text-neutral-400 uppercase tracking-wider">Logotipos</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer bg-black/30 border border-white/5 rounded-2xl p-3 hover:border-neutral-500/30 transition-all">
                         <input type="checkbox" checked={incMOGRTs} onChange={e=>setIncMOGRTs(e.target.checked)} className="accent-neutral-400 w-4 h-4 rounded-lg cursor-pointer" />
                         <span className="text-[9px] font-black text-neutral-400 uppercase tracking-wider">MOGRTs</span>
                      </label>
                   </div>
                </div>

                {/* CONSOLA DE INYECCIÓN DE PRODUCCIÓN REFINADA */}
                 <div className="bg-[#0a0a0a]/95 backdrop-blur-xl border border-white/[0.04] p-8 rounded-[2rem] shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[480px]">
                    <div className="absolute -top-32 -right-32 w-[350px] h-[350px] bg-white/[0.01] rounded-full blur-3xl pointer-events-none"></div>
                    
                    <div className="space-y-6">
                       {/* HEADER BANNER */}
                       <div className="flex items-center justify-between pb-4 border-b border-white/5">
                          <div className="flex items-center gap-2.5">
                             <div className="w-2.5 h-2.5 rounded-full bg-neutral-400 animate-pulse shadow-[0_0_10px_rgba(255,255,255,0.4)]"></div>
                             <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Consola de Inyección Local</span>
                          </div>
                          <span className="px-2.5 py-0.5 bg-neutral-800 border border-neutral-700 text-neutral-300 text-[8px] font-bold rounded uppercase tracking-wider">
                             Listo para estructurar
                          </span>
                       </div>

                       {/* STATUS DISPLAY GRID */}
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* DESTINATION STAT */}
                          <div className="bg-black/40 border border-white/5 rounded-2xl p-4 space-y-1">
                             <p className="text-[8px] text-neutral-500 font-black uppercase tracking-wider">Disco Duro Destino</p>
                             <div className="flex items-center gap-2">
                                <HardDrive size={13} className={destinationPath ? 'text-neutral-300' : 'text-neutral-500'} />
                                <span className="text-xs text-neutral-200 font-bold font-mono truncate">
                                   {destinationPath ? (typeof destinationPath === 'string' ? destinationPath.split('/').pop() : destinationPath.name) : 'No vinculado'}
                                </span>
                             </div>
                          </div>

                          {/* BASE FOLDER STAT */}
                          <div className="bg-black/40 border border-white/5 rounded-2xl p-4 space-y-1">
                             <p className="text-[8px] text-neutral-500 font-black uppercase tracking-wider">Carpeta de Base</p>
                             <div className="flex items-center gap-2">
                                <Folder size={13} className="text-neutral-400" />
                                <span className="text-xs text-neutral-200 font-bold truncate">
                                   {carpetaMaestra || 'Ninguna'}
                                </span>
                             </div>
                          </div>
                       </div>

                       {/* PROJECT DETAILS BLOCK */}
                       <div className="bg-black/40 border border-white/5 rounded-2xl p-5 space-y-3">
                          <p className="text-[8px] text-neutral-500 font-black uppercase tracking-wider border-b border-white/5 pb-2">Configuración Estructural Activa</p>
                          
                          <div className="flex justify-between items-center text-xs">
                             <span className="text-neutral-400 font-medium">Nombre de Estructura:</span>
                             <span className="text-white font-mono font-bold truncate max-w-[220px]">
                                {empresa ? finalProjectFolderName : 'Esperando datos de Nomenclatura...'}
                             </span>
                          </div>

                          <div className="flex justify-between items-center text-xs pt-1 border-t border-white/[0.02]">
                             <span className="text-neutral-400 font-medium">Plantillas de Software:</span>
                             <div className="flex gap-2">
                                {selectedPremiere && (
                                   <span className="bg-neutral-800 border border-neutral-700 px-2 py-0.5 rounded text-[8px] font-black text-neutral-300 uppercase tracking-wider">[Pr] Premiere</span>
                                )}
                                {selectedAE && (
                                   <span className="bg-neutral-800 border border-neutral-700 px-2 py-0.5 rounded text-[8px] font-black text-neutral-300 uppercase tracking-wider">[Ae] After Effects</span>
                                )}
                                {!selectedPremiere && !selectedAE && (
                                   <span className="text-[10px] text-neutral-600 italic">Ninguna seleccionada</span>
                                )}
                             </div>
                          </div>
                       </div>

                       {/* ADDITIONAL OPTION CHIPS */}
                       <div className="space-y-2">
                          <p className="text-[8px] text-neutral-500 font-black uppercase tracking-wider">Módulos Auxiliares de Inyección</p>
                          <div className="flex flex-wrap gap-2">
                             <span className={`px-2.5 py-1 rounded-lg text-[8px] font-black tracking-widest uppercase border ${incSFX ? 'bg-neutral-800 border-neutral-700 text-neutral-200' : 'bg-black/30 border-white/5 text-neutral-600'}`}>
                                Audio SFX
                             </span>
                             <span className={`px-2.5 py-1 rounded-lg text-[8px] font-black tracking-widest uppercase border ${incLogos ? 'bg-neutral-800 border-neutral-700 text-neutral-200' : 'bg-black/30 border-white/5 text-neutral-600'}`}>
                                Logotipos
                             </span>
                             <span className={`px-2.5 py-1 rounded-lg text-[8px] font-black tracking-widest uppercase border ${incMOGRTs ? 'bg-neutral-800 border-neutral-700 text-neutral-200' : 'bg-black/30 border-white/5 text-neutral-600'}`}>
                                MOGRTs Pro
                             </span>
                             <span className="px-2.5 py-1 rounded-lg text-[8px] font-black tracking-widest uppercase border bg-black/30 border-white/5 text-neutral-500">
                                video subfolders
                             </span>
                             <span className="px-2.5 py-1 rounded-lg text-[8px] font-black tracking-widest uppercase border bg-black/30 border-white/5 text-neutral-500">
                                imágenes/png
                             </span>
                             <span className="px-2.5 py-1 rounded-lg text-[8px] font-black tracking-widest uppercase border bg-black/30 border-white/5 text-neutral-500">
                                ia subfolders
                             </span>
                          </div>
                       </div>
                    </div>

                    {/* MAIN GENERATE ACTION BLOCK */}
                    <div className="pt-6 border-t border-white/5 space-y-4">
                       <button 
                          onClick={handleGenerate} 
                          disabled={isGenerating || !destinationPath} 
                          className={`w-full py-5 rounded-2xl font-black uppercase tracking-[0.25em] text-[10.5px] flex items-center justify-center gap-3 transition-all duration-500 ${isGenerating || !destinationPath ? 'bg-white/[0.02] text-neutral-600 border border-white/[0.04] cursor-not-allowed' : 'bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-500 hover:to-purple-700 text-white border border-purple-500/20 hover:border-purple-500/40 hover:scale-[1.01] shadow-[0_0_40px_rgba(168,85,247,0.15)] active:scale-95 cursor-pointer'}`}
                       >
                          {isGenerating ? (
                             <><div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div> Inyectando estructura física...</>
                          ) : !destinationPath ? (
                             <>Vincula el disco duro para estructurar</>
                          ) : (
                             <><Zap size={16} fill="currentColor"/> Generar Entorno de Producción</>
                          )}
                       </button>
                       {statusMsg && (
                          <p className={`text-center text-[9px] font-black uppercase tracking-widest animate-in fade-in ${statusMsg.includes('Error') ? 'text-rose-500 animate-bounce' : 'text-neutral-400'}`}>
                             {statusMsg}
                          </p>
                       )}
                    </div>
                 </div>

              </div>
           </div>
        )}
 
        {activeTab === 'suite' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
             {/* H1: COMPRESOR DE VIDEO */}
             <div className="bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/[0.04] p-8 rounded-[2rem] shadow-2xl flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                   <div className="flex items-center gap-3 pb-3 border-b border-white/5">
                      <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center border border-purple-500/20 shadow-inner"><Monitor size={18}/></div>
                      <div>
                         <h3 className="text-xs font-black text-white uppercase tracking-widest">1. Compresor de Video</h3>
                         <p className="text-[8px] text-neutral-500 font-bold uppercase tracking-wider">Presets de Entrega Directa</p>
                      </div>
                   </div>
                   <div className="space-y-3">
                      <div className="space-y-1">
                         <p className="text-[8px] text-neutral-500 font-black uppercase tracking-wider">Preset de Compresión</p>
                         <select value={compPreset} onChange={e=>setCompPreset(e.target.value)} className="w-full bg-black/40 border border-white/5 rounded-xl p-3 text-xs text-white outline-none cursor-pointer">
                            <option value="tiktok">TikTok / Reels 1080p (45MB)</option>
                            <option value="preview">Client Preview 720p (22MB)</option>
                            <option value="archival">Cinema 4K Archival (850MB)</option>
                         </select>
                      </div>
                      <div className="border border-dashed border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center text-center space-y-2 bg-black/20 hover:border-purple-500/40 transition-all cursor-pointer">
                         <Upload size={20} className="text-neutral-600"/>
                         <p className="text-[9px] text-neutral-400 font-bold uppercase tracking-wider">Arrastra archivo RAW de video</p>
                         <p className="text-[7px] text-neutral-600 font-black uppercase">Soporta .mp4, .mov, .mkv</p>
                      </div>
                      {isCompressing && (
                         <div className="space-y-1.5">
                            <div className="flex justify-between text-[8px] font-black uppercase text-neutral-500 tracking-wider">
                               <span>Procesando FFmpeg...</span>
                               <span>{compProgress}%</span>
                            </div>
                            <div className="w-full bg-black/60 rounded-full h-1.5 overflow-hidden">
                               <div className="bg-purple-500 h-full transition-all duration-200" style={{width: `${compProgress}%`}}></div>
                            </div>
                         </div>
                      )}
                      {compSuccess && (
                         <p className="text-[8px] text-emerald-500 font-black uppercase text-center tracking-widest flex items-center justify-center gap-1.5 animate-pulse"><Check size={10}/> ¡Compresión finalizada con éxito!</p>
                      )}
                   </div>
                </div>
                <button 
                   onClick={runCompression}
                   disabled={isCompressing}
                   className="w-full py-4 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-500/20 disabled:text-purple-500 text-[9px] font-black uppercase tracking-wider rounded-xl transition-all shadow-lg hover:scale-102"
                >
                   {isCompressing ? 'Comprimiendo...' : 'Iniciar Compresión Local'}
                </button>
             </div>

             {/* H2: CALCULADORA DE BITRATE */}
             <div className="bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/[0.04] p-8 rounded-[2rem] shadow-2xl flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                   <div className="flex items-center gap-3 pb-3 border-b border-white/5">
                      <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center border border-purple-500/20 shadow-inner"><CalcIcon size={18}/></div>
                      <div>
                         <h3 className="text-xs font-black text-white uppercase tracking-widest">2. Calculadora de Bitrate</h3>
                         <p className="text-[8px] text-neutral-500 font-bold uppercase tracking-wider">Estimación de Peso final</p>
                      </div>
                   </div>
                   <div className="space-y-3">
                      <div className="grid grid-cols-3 gap-2">
                         <div className="space-y-1">
                            <span className="text-[7px] text-neutral-600 font-black uppercase tracking-wider">Resolución</span>
                            <select value={calcRes} onChange={e=>setCalcRes(e.target.value)} className="w-full bg-black/40 border border-white/5 rounded-lg p-2.5 text-[10px] text-white outline-none">
                               <option value="1080p">1080p</option>
                               <option value="4K">4K UHD</option>
                            </select>
                         </div>
                         <div className="space-y-1">
                            <span className="text-[7px] text-neutral-600 font-black uppercase tracking-wider">FPS</span>
                            <select value={calcFps} onChange={e=>setCalcFps(parseInt(e.target.value))} className="w-full bg-black/40 border border-white/5 rounded-lg p-2.5 text-[10px] text-white outline-none">
                               <option value="24">24 fps</option>
                               <option value="30">30 fps</option>
                               <option value="60">60 fps</option>
                            </select>
                         </div>
                         <div className="space-y-1">
                            <span className="text-[7px] text-neutral-600 font-black uppercase tracking-wider">Duración (min)</span>
                            <input type="number" value={calcMin} onChange={e=>setCalcMin(parseInt(e.target.value) || 1)} className="w-full bg-black/40 border border-white/5 rounded-lg p-2 text-[10px] text-white outline-none" />
                         </div>
                      </div>

                      <div className="bg-black/40 border border-white/5 rounded-2xl p-4 space-y-2">
                         <div className="flex justify-between items-center text-[8px] font-black uppercase tracking-wider">
                            <span className="text-neutral-500">Tamaño Estimado:</span>
                            <span className="text-white text-xs">{calcEstSizeGB} GB</span>
                         </div>
                         <div className="flex justify-between items-center text-[8px] font-black uppercase tracking-wider">
                            <span className="text-neutral-500">Bitrate Objetivo:</span>
                            <span className="text-purple-400 text-xs">{recommendedBitrateMbps} Mbps</span>
                         </div>
                      </div>
                   </div>
                </div>
                <div className="text-[7px] text-neutral-600 uppercase font-black tracking-wider text-center">Datos recomendados bajo estándar de exportación de YouTube y Vimeo PRO.</div>
             </div>

             {/* H3: CONVERSOR DE TIMECODES */}
             <div className="bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/[0.04] p-8 rounded-[2rem] shadow-2xl flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                   <div className="flex items-center gap-3 pb-3 border-b border-white/5">
                      <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center border border-purple-500/20 shadow-inner"><Clock size={18}/></div>
                      <div>
                         <h3 className="text-xs font-black text-white uppercase tracking-widest">3. Conversor de Timecode</h3>
                         <p className="text-[8px] text-neutral-500 font-bold uppercase tracking-wider">Conversiones de FPS exactos</p>
                      </div>
                   </div>

                   <div className="space-y-3">
                      <div className="space-y-1">
                         <span className="text-[7px] text-neutral-600 font-black uppercase tracking-wider">Tasa de Fotogramas Clave (FPS)</span>
                         <select value={fpsVal} onChange={e=>{setFpsVal(parseInt(e.target.value)); handleTcToFrames(tcInput, parseInt(e.target.value)); handleFramesToTc(framesInput, parseInt(e.target.value));}} className="w-full bg-black/40 border border-white/5 rounded-xl p-3 text-xs text-white outline-none">
                            <option value="24">24 fps (Cine)</option>
                            <option value="25">25 fps (PAL)</option>
                            <option value="30">30 fps (NTSC)</option>
                            <option value="60">60 fps (Gaming/Social)</option>
                         </select>
                      </div>

                      <div className="grid grid-cols-2 gap-3 bg-black/20 p-3 rounded-xl border border-white/5">
                         <div className="space-y-1">
                            <span className="text-[7px] text-neutral-600 font-black uppercase">Timecode a Cuadros</span>
                            <input type="text" value={tcInput} onChange={e=>{setTcInput(e.target.value); handleTcToFrames(e.target.value, fpsVal);}} className="w-full bg-black/50 border border-white/5 rounded-lg p-2 text-xs font-mono text-white outline-none" />
                            <p className="text-[9px] font-mono text-purple-400">{framesOutput} frames</p>
                         </div>
                         <div className="space-y-1">
                            <span className="text-[7px] text-neutral-600 font-black uppercase">Cuadros a Timecode</span>
                            <input type="number" value={framesInput} onChange={e=>{setFramesInput(parseInt(e.target.value) || 0); handleFramesToTc(parseInt(e.target.value) || 0, fpsVal);}} className="w-full bg-black/50 border border-white/5 rounded-lg p-2 text-xs font-mono text-white outline-none" />
                            <p className="text-[9px] font-mono text-purple-400">{tcOutput}</p>
                         </div>
                      </div>
                   </div>
                </div>
                <div className="text-[7px] text-neutral-600 font-black uppercase tracking-wider text-center">Fórmula no-drop frame integrada.</div>
             </div>

             {/* H4: EXPORTADOR DE NOTAS DE CORTE */}
             <div className="bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/[0.04] p-8 rounded-[2rem] shadow-2xl flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                   <div className="flex items-center gap-3 pb-3 border-b border-white/5">
                      <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center border border-purple-500/20 shadow-inner"><Edit3 size={18}/></div>
                      <div>
                         <h3 className="text-xs font-black text-white uppercase tracking-widest">4. Notas de Corte</h3>
                         <p className="text-[8px] text-neutral-500 font-bold uppercase tracking-wider">Exportar a TXT del Proyecto</p>
                      </div>
                   </div>

                   <div className="space-y-2">
                      <p className="text-[7px] text-neutral-600 font-black uppercase tracking-wider">Escribe tiempos y comentarios de edición</p>
                      <textarea 
                         value={editNotes} 
                         onChange={e=>setEditNotes(e.target.value)} 
                         className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-xs font-mono text-white outline-none h-[110px] resize-none mac-scrollbar"
                      />
                   </div>
                </div>
                <button 
                   onClick={downloadNotes}
                   className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white text-[9px] font-black uppercase tracking-wider rounded-xl transition-all shadow-lg hover:scale-102"
                >
                   Descargar Notas en Proyecto
                </button>
             </div>

             {/* H5: NOMENCLATURA PRO */}
             <div className="bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/[0.04] p-8 rounded-[2rem] shadow-2xl flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                   <div className="flex items-center gap-3 pb-3 border-b border-white/5">
                      <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center border border-purple-500/20 shadow-inner"><Type size={18}/></div>
                      <div>
                         <h3 className="text-xs font-black text-white uppercase tracking-widest">5. Nomenclatura PRO</h3>
                         <p className="text-[8px] text-neutral-500 font-bold uppercase tracking-wider">Nombres Profesionales de Entregas</p>
                      </div>
                   </div>

                   <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                         <span className="text-[7px] text-neutral-600 font-black uppercase">Cliente</span>
                         <input type="text" value={nomClient} onChange={e=>setNomClient(e.target.value)} className="w-full bg-black/40 border border-white/5 rounded-lg p-2 text-[10px] text-white outline-none" />
                      </div>
                      <div className="space-y-1">
                         <span className="text-[7px] text-neutral-600 font-black uppercase">Proyecto</span>
                         <input type="text" value={nomProj} onChange={e=>setNomProj(e.target.value)} className="w-full bg-black/40 border border-white/5 rounded-lg p-2 text-[10px] text-white outline-none" />
                      </div>
                      <div className="space-y-1">
                         <span className="text-[7px] text-neutral-600 font-black uppercase">Versión</span>
                         <input type="text" value={nomVer} onChange={e=>setNomVer(e.target.value)} className="w-full bg-black/40 border border-white/5 rounded-lg p-2 text-[10px] text-white outline-none" />
                      </div>
                      <div className="space-y-1">
                         <span className="text-[7px] text-neutral-600 font-black uppercase">Orientación</span>
                         <select value={nomAspect} onChange={e=>setNomAspect(e.target.value)} className="w-full bg-black/40 border border-white/5 rounded-lg p-2 text-[10px] text-white outline-none">
                            <option value="H">Horizontal</option>
                            <option value="V">Vertical (TikTok)</option>
                         </select>
                      </div>
                   </div>

                   <div className="bg-black/50 border border-white/5 rounded-xl p-3">
                      <p className="text-[7px] text-neutral-500 font-black uppercase tracking-wider mb-1">Nombre Final Generado:</p>
                      <p className="text-[9px] font-mono font-black text-purple-400 break-all select-all">{finalNamingResult}.mp4</p>
                   </div>
                </div>
                <button 
                   onClick={() => { navigator.clipboard.writeText(finalNamingResult + '.mp4'); alert('¡Copiado al portapapeles!'); }}
                   className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white text-[9px] font-black uppercase tracking-wider rounded-xl transition-all shadow-lg hover:scale-102 flex items-center justify-center gap-2"
                >
                   <Copy size={12}/> Copiar Nombre Limpio
                </button>
             </div>

             {/* H6: BUSCADOR DE ATAJOS RAPIDOS */}
             <div className="bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/[0.04] p-8 rounded-[2rem] shadow-2xl flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                   <div className="flex items-center gap-3 pb-3 border-b border-white/5">
                      <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center border border-purple-500/20 shadow-inner"><Search size={18}/></div>
                      <div>
                         <h3 className="text-xs font-black text-white uppercase tracking-widest">6. Buscador de Atajos</h3>
                         <p className="text-[8px] text-neutral-500 font-bold uppercase tracking-wider">Atajos de Teclado Premiere/AE</p>
                      </div>
                   </div>

                   <div className="space-y-2">
                      <input 
                         type="text" 
                         value={shortcutQuery} 
                         onChange={e=>setShortcutQuery(e.target.value)} 
                         placeholder="Buscar atajo... (Ej: Cuchilla, Keyframe)" 
                         className="w-full bg-black/40 border border-white/5 rounded-xl p-3 text-xs text-white outline-none focus:border-purple-500/50"
                      />

                      <div className="space-y-2 max-h-[140px] overflow-y-auto mac-scrollbar pr-1">
                         {filteredShortcuts.map((s, idx) => (
                            <div key={idx} className="bg-black/30 border border-white/5 rounded-lg p-2.5 flex items-center justify-between text-[9px]">
                               <div>
                                  <p className="font-bold text-white uppercase">{s.desc}</p>
                                  <p className="text-[7px] text-neutral-600 font-black uppercase">{s.soft}</p>
                                </div>
                               <span className="bg-purple-900/40 border border-purple-500/20 rounded px-2 py-1 text-purple-300 font-mono font-bold shrink-0 ml-3">{s.key}</span>
                            </div>
                         ))}
                      </div>
                   </div>
                </div>
                <div className="text-[7px] text-neutral-600 font-black uppercase text-center">Presiona las teclas indicadas en el teclado de tu sistema.</div>
             </div>

             {/* H7: ASPECT RATIO GUIDE OVERLAYS */}
             <div className="bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/[0.04] p-8 rounded-[2rem] shadow-2xl flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                   <div className="flex items-center gap-3 pb-3 border-b border-white/5">
                      <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center border border-purple-500/20 shadow-inner"><Highlighter size={18}/></div>
                      <div>
                         <h3 className="text-xs font-black text-white uppercase tracking-widest">7. Guías de Encuadre</h3>
                         <p className="text-[8px] text-neutral-500 font-bold uppercase tracking-wider">Crop Safe Zones</p>
                      </div>
                   </div>

                   <div className="space-y-3">
                      <div className="flex justify-between items-center bg-black/40 border border-white/5 rounded-xl p-1 text-[8px] font-black uppercase tracking-wider">
                         {['916', '11', '239'].map(mode => (
                            <button 
                               key={mode} 
                               onClick={() => setCropGuide(mode)} 
                               className={`flex-1 py-2 text-center rounded-lg ${cropGuide === mode ? 'bg-purple-600 text-white' : 'text-neutral-500 hover:text-white'}`}
                            >
                               {mode === '916' ? 'TikTok (9:16)' : mode === '11' ? 'Instagram (1:1)' : 'Cine (2.39:1)'}
                            </button>
                         ))}
                      </div>

                      {/* SIMULATED CANVAS PREVIEW */}
                      <div className="relative w-full aspect-video bg-black rounded-xl border border-white/5 overflow-hidden flex items-center justify-center">
                         <div className="absolute inset-0 bg-gradient-to-tr from-neutral-900 to-neutral-800 opacity-80"></div>
                         <div className="absolute z-10 text-[8px] font-mono font-black text-neutral-700">16:9 Canvas Principal</div>
                         
                         {/* CROP OVERLAYS */}
                         {cropGuide === '916' && (
                            <div className="absolute top-0 bottom-0 aspect-[9/16] border-l-2 border-r-2 border-purple-500/60 border-dashed bg-purple-500/5 flex items-center justify-center">
                               <span className="text-[7px] text-purple-400 font-mono font-black uppercase tracking-widest text-center px-2">9:16 safe area (tiktok / reels)</span>
                            </div>
                         )}
                         {cropGuide === '11' && (
                            <div className="absolute top-0 bottom-0 aspect-[1/1] border-2 border-purple-500/60 border-dashed bg-purple-500/5 flex items-center justify-center">
                               <span className="text-[7px] text-purple-400 font-mono font-black uppercase tracking-widest text-center px-2">1:1 safe area (instagram)</span>
                            </div>
                         )}
                         {cropGuide === '239' && (
                            <div className="absolute left-0 right-0 h-[70%] border-t-2 border-b-2 border-purple-500/60 border-dashed bg-purple-500/5 flex items-center justify-center">
                               <span className="text-[7px] text-purple-400 font-mono font-black uppercase tracking-widest text-center">2.39:1 safe area (cinematic)</span>
                            </div>
                         )}
                      </div>
                   </div>
                </div>
                <div className="text-[7px] text-neutral-600 font-black uppercase tracking-wider text-center">Márgenes de seguridad recomendados para Premiere Pro.</div>
             </div>

             {/* H8: RECURSOS FRECUENTES */}
             <div className="bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/[0.04] p-8 rounded-[2rem] shadow-2xl flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                   <div className="flex items-center gap-3 pb-3 border-b border-white/5">
                      <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center border border-purple-500/20 shadow-inner"><Layers size={18}/></div>
                      <div>
                         <h3 className="text-xs font-black text-white uppercase tracking-widest">8. Recursos Frecuentes</h3>
                         <p className="text-[8px] text-neutral-500 font-bold uppercase tracking-wider">Inyectar en carpetas locales</p>
                      </div>
                   </div>

                   <div className="space-y-3">
                      <p className="text-[8px] text-neutral-500 font-black uppercase tracking-wider">Los siguientes recursos se copiarán automáticamente al estructurar:</p>
                      <div className="space-y-2">
                         <div className="flex justify-between items-center bg-black/40 border border-white/5 rounded-xl p-3">
                            <span className="text-[9px] font-black text-white uppercase tracking-wider flex items-center gap-2"><Music size={12} className="text-purple-400"/> Sound Effects PRO</span>
                            <span className="text-[8px] text-emerald-500 font-bold uppercase">Incluido</span>
                         </div>
                         <div className="flex justify-between items-center bg-black/40 border border-white/5 rounded-xl p-3">
                            <span className="text-[9px] font-black text-white uppercase tracking-wider flex items-center gap-2"><Palette size={12} className="text-purple-400"/> Logotipos y Overlays</span>
                            <span className="text-[8px] text-neutral-500 font-bold uppercase">No Seleccionado</span>
                         </div>
                         <div className="flex justify-between items-center bg-black/40 border border-white/5 rounded-xl p-3">
                            <span className="text-[9px] font-black text-white uppercase tracking-wider flex items-center gap-2"><Scissors size={12} className="text-purple-400"/> Lower Thirds</span>
                            <span className="text-[8px] text-neutral-500 font-bold uppercase">No Seleccionado</span>
                         </div>
                      </div>
                   </div>
                </div>
                <div className="text-[7px] text-neutral-600 font-black uppercase text-center">Configurable en la pestaña "Estructurador Pro".</div>
             </div>

             {/* H9: ARCHIVADOR Y COMPRESOR ZIP */}
             <div className="bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/[0.04] p-8 rounded-[2rem] shadow-2xl flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                   <div className="flex items-center gap-3 pb-3 border-b border-white/5">
                      <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center border border-purple-500/20 shadow-inner"><Cloud size={18}/></div>
                      <div>
                         <h3 className="text-xs font-black text-white uppercase tracking-widest">9. Archivador ZIP</h3>
                         <p className="text-[8px] text-neutral-500 font-bold uppercase tracking-wider">Comprimir Proyecto Completo</p>
                      </div>
                   </div>

                   <div className="space-y-3">
                      <p className="text-[8px] text-neutral-500 font-black uppercase tracking-wider">Empaqueta la estructura local en formato ZIP para entrega final o almacenamiento en la nube.</p>
                      {isZipping && (
                         <div className="space-y-1.5">
                            <div className="flex justify-between text-[8px] font-black uppercase text-neutral-500 tracking-wider">
                               <span>Comprimiendo directorios locales...</span>
                               <span>{zipProgress}%</span>
                            </div>
                            <div className="w-full bg-black/60 rounded-full h-1.5 overflow-hidden">
                               <div className="bg-purple-500 h-full transition-all duration-200" style={{width: `${zipProgress}%`}}></div>
                            </div>
                         </div>
                      )}
                      {zipSuccess && (
                         <p className="text-[8px] text-emerald-500 font-black uppercase text-center tracking-widest flex items-center justify-center gap-1.5 animate-pulse"><Check size={10}/> ¡ZIP Generado: proyecto_archivado.zip!</p>
                      )}
                   </div>
                </div>
                <button 
                   onClick={runZip}
                   disabled={isZipping}
                   className="w-full py-4 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-500/20 disabled:text-purple-500 text-[9px] font-black uppercase tracking-wider rounded-xl transition-all shadow-lg hover:scale-102"
                >
                   {isZipping ? 'Archivando...' : 'Iniciar Archivado ZIP'}
                </button>
             </div>

             {/* H10: AUDITOR SSD Y LIMPIADOR CACHE */}
             <div className="bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/[0.04] p-8 rounded-[2rem] shadow-2xl flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                   <div className="flex items-center gap-3 pb-3 border-b border-white/5">
                      <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center border border-purple-500/20 shadow-inner"><Cpu size={18}/></div>
                      <div>
                         <h3 className="text-xs font-black text-white uppercase tracking-widest">10. Auditor de Caché SSD</h3>
                         <p className="text-[8px] text-neutral-500 font-bold uppercase tracking-wider">Rendimiento local de Edición</p>
                      </div>
                   </div>

                   <div className="space-y-4">
                      <div className="flex justify-between items-center bg-black/40 border border-white/5 rounded-xl p-3.5">
                         <div>
                            <p className="text-[8px] text-neutral-500 font-black uppercase tracking-wider">Caché Acumulado (Adobe)</p>
                            <p className="text-white text-base font-black font-mono">{ssdCacheSize.toFixed(1)} GB</p>
                         </div>
                         <div className="w-10 h-10 rounded-full border-2 border-purple-500/30 flex items-center justify-center text-[10px] text-purple-400 font-bold font-mono">98%</div>
                      </div>

                      {isCleaningCache && (
                         <p className="text-[8px] text-neutral-500 font-black uppercase tracking-wider text-center animate-pulse">Liberando espacio en disco local...</p>
                      )}
                      {cacheSuccess && (
                         <p className="text-[8px] text-emerald-500 font-black uppercase text-center tracking-widest flex items-center justify-center gap-1.5 animate-pulse"><Check size={10}/> ¡Caché purgado e hilos de render acelerados!</p>
                      )}
                   </div>
                </div>
                <button 
                   onClick={cleanSsdCache}
                   disabled={isCleaningCache || ssdCacheSize === 0}
                   className="w-full py-4 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-500/20 disabled:text-purple-500 text-[9px] font-black uppercase tracking-wider rounded-xl transition-all shadow-lg hover:scale-102"
                >
                   {isCleaningCache ? 'Liberando...' : ssdCacheSize === 0 ? 'Espacio Libre de Caché' : 'Limpiar Caché Temporal'}
                </button>
             </div>
          </div>
       )}
    </div>
  );
};

export default MeetingStudio;
