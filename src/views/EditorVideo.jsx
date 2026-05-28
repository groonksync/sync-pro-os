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
import { getTheme } from '../lib/theme';

const EditorVideo = ({ meetingsList = [], setMeetingsList, settings = {}, isDark = true, token }) => {
  const t = useMemo(() => getTheme(isDark), [isDark]);
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

  // ── Session extended states (Clientes) ─────────────────────────────────────
  const [sessionCurrency, setSessionCurrency] = useState('USD');
  const [sessionPrice, setSessionPrice] = useState('');
  const [sessionMeetLink, setSessionMeetLink] = useState('');
  const [sessionNextDate, setSessionNextDate] = useState('');
  const [sessionDriveLink, setSessionDriveLink] = useState('');
  const [sessionSideTab, setSessionSideTab] = useState('calc');
  const [priceRegistered, setPriceRegistered] = useState(false);

  // ── Session extended states (Agencia Pro) ──────────────────────────────────
  const [agencySideTab, setAgencySideTab] = useState('calc');
  const [agencySessionCurrency, setAgencySessionCurrency] = useState('USD');
  const [agencySessionPrice, setAgencySessionPrice] = useState('');
  const [agencyMeetLink, setAgencyMeetLink] = useState('');
  const [agencyNextDate, setAgencyNextDate] = useState('');
  const [agencyDriveLink, setAgencyDriveLink] = useState('');
  const [agencyPriceRegistered, setAgencyPriceRegistered] = useState(false);

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
      const metadata = {
        moneda: agencySessionCurrency,
        precio_acordado: agencySessionPrice || null,
        link_reunion: agencyMeetLink || null,
        fecha_siguiente: agencyNextDate || null,
        drive_folder: agencyDriveLink || null,
        precio_registrado: agencyPriceRegistered
      };
      const { error } = await supabase.from('estrategias_agencia').update({
        contenido: content,
        total_time: time,
        metadata: metadata
      }).eq('id', activeStrategy.id);
      if (error) throw error;
      await fetchStrategies(selectedCompany.id);
      setViewState('agency-session');
    } catch (e) { alert(e.message); }
  };

  const openClientProfile = (client) => { setActiveClient(client); setViewState('client-profile'); };

  const openMeeting = (meeting) => {
    setActiveMeeting(meeting);
    setTime(meeting.total_time || 0);
    const meta = meeting.metadata || {};
    setSessionCurrency(meta.moneda || 'USD');
    setSessionPrice(meta.precio_acordado || '');
    setSessionMeetLink(meta.link_reunion || '');
    setSessionNextDate(meta.fecha_siguiente || '');
    setSessionDriveLink(meta.drive_folder || '');
    setPriceRegistered(meta.precio_registrado || false);
    setSessionSideTab('calc');
    setViewState('session');
  };

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
      const metadata = {
        moneda: sessionCurrency,
        precio_acordado: sessionPrice || null,
        link_reunion: sessionMeetLink || null,
        fecha_siguiente: sessionNextDate || null,
        drive_folder: sessionDriveLink || null,
        precio_registrado: priceRegistered
      };
      const { error } = await supabase.from('reuniones').update({
        contenido: content,
        total_time: time,
        metadata: metadata
      }).eq('id', activeMeeting.id);
      if (error) throw error;
      setViewState('client-profile');
      setActiveMeeting(null);
      setIsTimerRunning(false);
    } catch (e) { alert(e.message); }
  };

  const uniqueClients = useMemo(() => {
    return clients.filter(c => normalizeText(t.nombre).includes(normalizeText(clientSearch)));
  }, [clients, clientSearch]);

  const filteredMeetings = useMemo(() => {
    if (!activeClient) return [];
    return meetingsList.filter(m => m.cliente_id === activeClient.id && normalizeText(m.session_title).includes(normalizeText(meetingSearch)));
  }, [meetingsList, activeClient, meetingSearch]);

  const filteredAgencyClients = useMemo(() => {
    let list = agencyClients;
    if (activeAgencyPlan !== 'Todos') {
      list = list.filter(c => t.plan === activeAgencyPlan);
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

  const registerSessionIncome = async (clientName, meetingTitle, price, currency, isAgency = false) => {
    if (!price || parseFloat(price) <= 0) return;
    try {
      const today = new Date().toISOString().split('T')[0];
      const newVenta = {
        id: crypto.randomUUID(),
        fecha: today,
        producto: `${clientName} — ${meetingTitle}`,
        categoria: 'Edición de Video',
        plataforma: 'Edición de Video',
        monto: parseFloat(price),
        notas: `Moneda original: ${price} ${currency}`
      };
      const { error } = await supabase.from('ventas').insert(newVenta);
      if (error) throw error;
      if (isAgency) setAgencyPriceRegistered(true);
      else setPriceRegistered(true);
      alert('✅ Ingreso registrado en Mis Ganancias');
    } catch (e) { alert('Error al registrar: ' + e.message); }
  };

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden font-sans"
      style={{ backgroundColor: t.bg, color: t.text }}>
      <nav className="h-16 flex items-center justify-between px-6 relative z-50"
        style={{ backgroundColor: t.bg, borderBottom: `1px solid ${t.border}` }}>
         <div className="flex items-center gap-8">
            <div>
               <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', letterSpacing: '-0.02em', margin: 0 }}>Editor de Video</h2>
               <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '2px', fontWeight: 500 }}>Workspace de Control de Producción de Video</p>
            </div>
            <div className="flex rounded-xl p-0.5" style={{ backgroundColor: t.accentSoft, border: `1px solid ${t.border}` }}>
                <button onClick={() => setViewState('client-list')} className="px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
                  style={{
                    backgroundColor: viewState.includes('client') || viewState === 'session' ? t.accent : 'transparent',
                    color: viewState.includes('client') || viewState === 'session' ? '#000000' : t.textDim,
                  }}>Clientes</button>
                <button onClick={() => setViewState('agency-hub')} className="px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
                  style={{
                    backgroundColor: viewState.includes('agency') ? t.accent : 'transparent',
                    color: viewState.includes('agency') ? '#000000' : t.textDim,
                  }}>Agencia Pro</button>
                <button onClick={() => setViewState('project-engine')} className="px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
                  style={{
                    backgroundColor: viewState === 'project-engine' ? t.accent : 'transparent',
                    color: viewState === 'project-engine' ? '#000000' : t.textDim,
                  }}>Edición de Video</button>
            </div>
         </div>
         <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl" style={{ backgroundColor: t.accentSoft, border: `1px solid ${t.border}` }}>
               <div className="w-1.5 h-1.5 rounded-xl" style={{ backgroundColor: t.accent }}></div>
               <span className="text-[8px] font-black uppercase tracking-widest" style={{ color: t.accent }}>System Ready</span>
            </div>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center overflow-hidden" style={{ backgroundColor: t.panel, border: `1px solid ${t.border}` }}>
              <UserIcon size={16} color={t.textDim}/>
            </div>
         </div>
       </nav>

       {viewState === 'client-list' && (
        <div className="flex flex-col flex-1 min-h-0 p-6 space-y-6 max-w-[1400px] mx-auto w-full animate-in fade-in duration-700 overflow-y-auto mac-scrollbar">
            {/* KPI STATUS BAR */}
            <div className="grid grid-cols-4 gap-3">
               {[
                 { label: 'Capacidad Operativa', val: '98.4%', icon: Activity },
                 { label: 'Proyectos en Render', val: uniqueClients.length, icon: Video },
                 { label: 'Latencia Neural', val: '0.4ms', icon: Cpu },
                 { label: 'Base de Clientes', val: uniqueClients.length, icon: Users }
               ].map((s, i) => (
                 <div key={i} className="flex items-center justify-between p-4 shadow-lg"
                   style={{ backgroundColor: t.panel, border: `1px solid ${t.border}`, borderRadius: 16 }}>
                    <div>
                       <p className="text-[8px] font-black uppercase tracking-widest mb-1" style={{ color: t.textDim }}>{s.label}</p>
                       <p className="text-xl font-black" style={{ color: 'white' }}>{s.val}</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: t.accentSoft }}>
                      <s.icon size={18} color={t.accent}/>
                    </div>
                 </div>
               ))}
            </div>

            <header className="flex justify-between items-end pt-6">
               <div>
                  <h2 className="text-xl font-black uppercase tracking-tight" style={{ color: 'white' }}>Agenda de Clientes</h2>
               </div>
               <div className="flex gap-3">
                  <div className="relative group">
                     <input type="text" value={clientSearch} onChange={e=>setClientSearch(e.target.value)} placeholder="BUSCAR..."
                       className="rounded-xl py-3 pl-4 pr-5 text-[9px] font-black uppercase tracking-widest outline-none w-56 shadow-lg"
                       style={{ backgroundColor: t.panel, border: `1px solid ${t.border}`, color: t.text }} />
                  </div>
                  <button onClick={() => setIsClientModalOpen(true)} className="px-6 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest flex items-center gap-3 shadow-lg transition-all"
                    style={{ backgroundColor: t.accent, color: '#000000' }}>
                     <Plus size={16} strokeWidth={3}/> Nuevo Registro
                  </button>
               </div>
            </header>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 pt-4">
               {uniqueClients.map(cl => (
                 <div key={cl.id} onClick={() => openClientProfile(cl)} className="p-5 flex flex-col items-center justify-center group relative overflow-hidden shadow-lg aspect-square cursor-pointer transition-all"
                   style={{ backgroundColor: t.panel, border: `1px solid ${t.border}`, borderRadius: 16 }}>
                    <div className="absolute top-0 left-0 w-full h-0.5 opacity-0 group-hover:opacity-100 transition-all" style={{ background: `linear-gradient(to right, transparent, ${t.accent}66, transparent)` }}></div>
                    
                    <div className="w-20 h-20 rounded-xl flex items-center justify-center overflow-hidden shadow-inner group-hover:scale-105 transition-all mb-5" style={{ backgroundColor: t.accentSoft, border: `1px solid ${t.border}` }}>
                       {cl.foto_url ? (
                         <img src={cl.foto_url} alt={cl.nombre} className="w-full h-full object-cover" />
                       ) : (
                         <span className="text-2xl font-black transition-all" style={{ color: t.textDim }}>{cl.nombre.charAt(0)}</span>
                       )}
                    </div>

                    <p className="text-sm font-black uppercase tracking-widest truncate w-full text-center mb-1" style={{ color: 'white' }}>{cl.nombre}</p>
                    <p className="text-[8px] font-black uppercase tracking-[0.2em] mb-3" style={{ color: t.textDim }}>{cl.empresa || 'Independiente'}</p>
                    
                    <div className="flex flex-col items-center gap-0.5 mb-4">
                       <span className="text-[7px] font-black uppercase tracking-widest" style={{ color: t.textMuted }}>{cl.nacionalidad || 'Global'}</span>
                       <span className="text-[7px] font-mono font-black uppercase tracking-widest" style={{ color: t.textDim }}>{cl.telefono || 'No Phone'}</span>
                    </div>

                    <div className="mt-3 w-full pt-4 flex items-center justify-between opacity-30 group-hover:opacity-100 transition-all" style={{ borderTop: `1px solid ${t.border}` }}>
                       <div className="flex gap-1">
                          {[...Array(3)].map((_,i)=><Star key={i} size={8} color={t.accent} fill={t.accent}/>)}
                       </div>
                       <span className="text-[7px] font-black uppercase tracking-widest" style={{ color: t.accent }}>Active</span>
                    </div>
                 </div>
               ))}
            </div>
        </div>
      )}

      {viewState === 'client-profile' && activeClient && (
        <div className="flex flex-col flex-1 min-h-0 p-6 space-y-6 max-w-[1200px] mx-auto w-full animate-in slide-in-from-right duration-500 overflow-y-auto mac-scrollbar">
           <header className="flex items-center justify-between">
             <div className="flex items-center gap-5">
               <button onClick={() => setViewState('client-list')} className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
                 style={{ backgroundColor: t.accentSoft }}>
                 <ArrowLeft size={18} color={t.textMuted}/>
               </button>
               <div>
                 <h3 className="text-xl font-black uppercase tracking-tight" style={{ color: 'white' }}>{activeClient.nombre}</h3>
                 <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: t.textDim }}>{activeClient.empresa || 'Independent Production'}</p>
               </div>
             </div>
             <button onClick={createMeeting} className="px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-3 shadow-xl transition-all"
               style={{ backgroundColor: t.accent, color: '#000000' }}>
               <Video size={16}/> Iniciar Producción
             </button>
           </header>
           <div className="space-y-3">
             {filteredMeetings.map(m => (
               <div key={m.id} onClick={() => openMeeting(m)} className="flex items-center justify-between p-4 shadow-lg cursor-pointer transition-all"
                 style={{ backgroundColor: t.panel, border: `1px solid ${t.border}`, borderRadius: 16 }}>
                 <div className="flex items-center gap-6">
                   <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: t.accentSoft }}>
                     <FileVideo size={22} color={t.accent}/>
                   </div>
                   <div>
                     <h4 className="text-lg font-black uppercase tracking-tight" style={{ color: 'white' }}>{m.session_title}</h4>
                     <p className="text-[9px] font-bold uppercase" style={{ color: t.textDim }}>{m.fecha}</p>
                   </div>
                 </div>
                 <div className="text-right">
                   <p className="text-[7px] font-black uppercase mb-0.5" style={{ color: t.textDim }}>Elapsed</p>
                   <p className="text-lg font-black font-mono" style={{ color: 'white' }}>{formatTime(m.total_time)}</p>
                 </div>
               </div>
             ))}
             {filteredMeetings.length === 0 && (
               <div className="text-center py-10 rounded-xl" style={{ backgroundColor: t.accentSoft, border: `1px dashed ${t.border}` }}>
                 <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: t.textDim }}>Sin reuniones aún. Inicia una producción.</p>
               </div>
             )}
           </div>
        </div>
      )}

      {viewState === 'agency-hub' && (
        <div className="flex flex-col flex-1 min-h-0 p-6 space-y-6 max-w-[1400px] mx-auto w-full animate-in fade-in duration-700 overflow-y-auto mac-scrollbar">
            {/* AGENCY KPI */}
            <div className="grid grid-cols-4 gap-3">
               {[
                 { label: 'Proyectos Activos', val: agencyClients.length, icon: Target },
                 { label: 'Conversión Mensual', val: '24%', icon: TrendingUp },
                 { label: 'Nivel de Satisfacción', val: '9.8', icon: Star },
                 { label: 'Empresas Vinculadas', val: agencyClients.length, icon: Building2 }
               ].map((s, i) => (
                 <div key={i} className="flex items-center justify-between p-4 shadow-lg"
                   style={{ backgroundColor: t.panel, border: `1px solid ${t.border}`, borderRadius: 16 }}>
                    <div>
                       <p className="text-[8px] font-black uppercase tracking-widest mb-1" style={{ color: t.textDim }}>{s.label}</p>
                       <p className="text-xl font-black" style={{ color: 'white' }}>{s.val}</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: t.accentSoft }}>
                      <s.icon size={18} color={t.accent}/>
                    </div>
                 </div>
               ))}
            </div>

            <header className="flex justify-between items-end pt-6">
               <div>
                  <h2 className="text-xl font-black uppercase tracking-tight" style={{ color: 'white' }}>Agency Pro Hub</h2>
               </div>
               <button onClick={() => setIsCompanyModalOpen(true)} className="px-8 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all flex items-center gap-3 shadow-xl"
                 style={{ backgroundColor: t.accent, color: '#000000' }}>
                 <Plus size={18} strokeWidth={3}/> New Strategy Project
               </button>
            </header>

            <div className="grid grid-cols-4 gap-2 p-2 rounded-xl shadow-lg" style={{ backgroundColor: t.panel, border: `1px solid ${t.border}` }}>
               {['Básico', 'Intermedio', 'Avanzado', 'Personalizado'].map(p => {
                 const count = agencyClients.filter(cl => cl.plan === p).length;
                 return (
                   <button key={p} onClick={() => setActiveAgencyPlan(p)} className="p-4 rounded-xl transition-all flex flex-col items-center gap-1.5"
                     style={{
                       backgroundColor: activeAgencyPlan === p ? t.accent : 'transparent',
                       color: activeAgencyPlan === p ? '#000000' : t.textDim,
                     }}>
                     <h4 className="text-[9px] font-black uppercase tracking-widest">{p}</h4>
                     <p className="text-xl font-black">{count}</p>
                   </button>
                 );
               })}
            </div>

            <div className="space-y-5">
              <div className="flex items-center justify-between px-3">
                <h3 className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2" style={{ color: 'white' }}>
                  <div className="w-1.5 h-1.5 rounded-xl" style={{ backgroundColor: t.accent }}></div>
                  Strategic Graphical Timeline
                </h3>
                <div className="flex gap-3">
                  <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-xl" style={{ backgroundColor: t.accent }}></div><span className="text-[7px] font-black uppercase" style={{ color: t.textDim }}>On Time</span></div>
                  <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-xl" style={{ backgroundColor: t.textDim }}></div><span className="text-[7px] font-black uppercase" style={{ color: t.textDim }}>Critical</span></div>
                </div>
              </div>

              <div className="p-5 rounded-xl mac-scrollbar overflow-x-auto" style={{ backgroundColor: t.accentSoft, border: `1px solid ${t.border}` }}>
                <div className="min-w-[900px] space-y-4">
                  {filteredAgencyClients.map((company, idx) => {
                    const meta = company.metadata || {};
                    const metrics = meta.metrics || { loyalty: 'Normal', payment: 'A tiempo', growth: 'Estable' };
                    const isPremium = metrics.loyalty === 'VIP' || metrics.growth === 'Top Tier';
                    
                    return (
                      <div key={company.id} onClick={() => { setSelectedCompany(company); fetchStrategies(company.id); setViewState('agency-session'); }} className="flex items-center gap-6 p-4 rounded-xl cursor-pointer relative overflow-hidden shadow-lg transition-all"
                        style={{ backgroundColor: t.bg, border: `1px solid ${t.border}` }}>
                        {isPremium && <div className="absolute top-0 right-0 p-3"><Crown size={12} color={t.accent}/></div>}
                        
                        <div className="w-20 shrink-0">
                          <h4 className="text-xs font-black uppercase truncate" style={{ color: 'white' }}>{company.nombre_empresa}</h4>
                          <p className="text-[7px] font-black uppercase" style={{ color: t.textDim }}>{company.dueño}</p>
                        </div>

                        <div className="flex-1 flex items-center gap-3">
                          <div className="flex-1 h-2 rounded-xl overflow-hidden relative" style={{ backgroundColor: t.surface, border: `1px solid ${t.border}` }}>
                            <div className="absolute inset-y-0 left-0 rounded-xl transition-all duration-1000" style={{ width: `${30 + (idx * 15) % 70}%`, backgroundColor: t.accent }}></div>
                          </div>
                          <span className="text-[8px] font-mono font-black" style={{ color: t.textMuted }}>{30 + (idx * 15) % 70}%</span>
                        </div>

                        <div className="flex items-center gap-4 shrink-0">
                           <div className="flex gap-1.5">
                             {['instagram', 'tiktok', 'facebook', 'youtube'].map(red => (
                               <div key={red} className="w-7 h-7 rounded-xl flex items-center justify-center"
                                 style={{
                                   border: meta.redes?.[red] ? `1px solid ${t.accent}66` : `1px solid ${t.border}`,
                                   backgroundColor: meta.redes?.[red] ? t.accentSoft : 'transparent',
                                   color: meta.redes?.[red] ? t.accent : t.textDim,
                                 }}>
                                 {red === 'instagram' && <Instagram size={12}/>}
                                 {red === 'tiktok' && <TiktokIcon size={12}/>}
                                 {red === 'facebook' && <Facebook size={12}/>}
                                 {red === 'youtube' && <Youtube size={12}/>}
                               </div>
                             ))}
                           </div>
                           <div className="px-3 py-1.5 rounded-xl" style={{ backgroundColor: t.accentSoft, border: `1px solid ${t.border}` }}>
                             <p className="text-[6px] font-black uppercase mb-0.5" style={{ color: t.textDim }}>Status</p>
                             <p className="text-[7px] font-black uppercase" style={{ color: metrics.payment === 'A tiempo' ? t.accent : t.textDim }}>{metrics.payment}</p>
                           </div>
                        </div>
                      </div>
                    );
                  })}
                  {filteredAgencyClients.length === 0 && (
                    <div className="py-14 text-center rounded-xl" style={{ border: `1px dashed ${t.border}`, backgroundColor: t.accentSoft }}>
                      <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: t.textDim }}>No Strategic Projects in this Tier</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
        </div>
      )}

      {viewState === 'agency-session' && selectedCompany && (
        <div className="flex flex-col flex-1 min-h-0 p-6 space-y-6 max-w-[1200px] mx-auto w-full animate-in slide-in-from-right duration-500 overflow-y-auto mac-scrollbar">
           <header className="flex items-center justify-between">
             <div className="flex items-center gap-5">
               <button onClick={() => setViewState('agency-hub')} className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
                 style={{ backgroundColor: t.accentSoft }}>
                 <ArrowLeft size={18} color={t.textMuted}/>
               </button>
               <div>
                 <h3 className="text-xl font-black uppercase tracking-tight" style={{ color: 'white' }}>{selectedCompany.nombre_empresa}</h3>
                 <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: t.accent }}>{selectedCompany.plan}</p>
               </div>
             </div>
             <button onClick={createStrategy} className="px-6 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest flex items-center gap-3 shadow-xl transition-all"
               style={{ backgroundColor: t.accent, color: '#000000' }}>
               <Sparkles size={16}/> Nueva Estrategia
             </button>
           </header>
           <div className="space-y-3">
             {strategies.map(s => (
               <div key={s.id} onClick={() => {
                  setActiveStrategy(s);
                  setEditorContent(s.contenido);
                  setTime(s.total_time || 0);
                  const meta = s.metadata || {};
                  setAgencySessionCurrency(meta.moneda || 'USD');
                  setAgencySessionPrice(meta.precio_acordado || '');
                  setAgencyMeetLink(meta.link_reunion || '');
                  setAgencyNextDate(meta.fecha_siguiente || '');
                  setAgencyDriveLink(meta.drive_folder || '');
                  setAgencyPriceRegistered(meta.precio_registrado || false);
                  setAgencySideTab('calc');
                  setViewState('agency-editor');
                }}
                 className="flex items-center justify-between p-4 cursor-pointer shadow-lg transition-all"
                 style={{ backgroundColor: t.panel, border: `1px solid ${t.border}`, borderRadius: 16 }}>
                 <div className="flex items-center gap-6">
                   <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: t.accentSoft }}>
                     <Target size={22} color={t.accent}/>
                   </div>
                   <h4 className="text-lg font-black uppercase tracking-tight" style={{ color: 'white' }}>{s.titulo_estrategia}</h4>
                 </div>
                 <ChevronRight size={20} color={t.textDim}/>
               </div>
             ))}
             {strategies.length === 0 && (
               <div className="text-center py-10 rounded-xl" style={{ backgroundColor: t.accentSoft, border: `1px dashed ${t.border}` }}>
                 <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: t.textDim }}>Sin estrategias aún. Crea una nueva.</p>
               </div>
             )}
           </div>
        </div>
      )}

      {viewState === 'agency-editor' && activeStrategy && (
        <div className="flex flex-col h-full overflow-hidden animate-in fade-in duration-500">
          <header className="px-4 py-3 flex items-center justify-between" style={{ backgroundColor: t.accentSoft, borderBottom: `1px solid ${t.border}` }}>
            <div className="flex items-center gap-4">
              <button onClick={saveStrategy} className="w-8 h-8 rounded-xl flex items-center justify-center transition-all" style={{ backgroundColor: t.accentSoft }}>
                <ArrowLeft size={18} color={t.textMuted}/>
              </button>
              <div>
                <h3 className="text-sm font-black uppercase" style={{ color: 'white' }}>{activeStrategy.titulo_estrategia}</h3>
                <p className="text-[7px] font-black uppercase tracking-widest" style={{ color: t.accent }}>{selectedCompany?.nombre_empresa}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-3 px-4 py-1.5 rounded-xl text-lg font-mono font-black" style={{ backgroundColor: t.panel, border: `1px solid ${t.border}`, color: 'white' }}>
                {formatTime(time)}
                <button onClick={() => setIsTimerRunning(!isTimerRunning)} className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ backgroundColor: t.accent }}>
                  {isTimerRunning ? <Pause size={12}/> : <Play size={12}/>}
                </button>
                <button onClick={() => { setTime(0); setIsTimerRunning(false); }} className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
                  <RotateCcw size={12} color={t.textMuted}/>
                </button>
              </div>
              <button onClick={saveStrategy} className="px-5 py-2.5 text-[9px] font-black rounded-xl uppercase tracking-widest shadow-xl flex items-center gap-2"
                style={{ backgroundColor: 'white', color: '#000000' }}>
                <Save size={14}/> Guardar
              </button>
            </div>
          </header>
          <div className="flex-1 flex p-3 gap-3 overflow-hidden max-w-[1600px] mx-auto w-full">
            <div className="flex-1 rounded-xl overflow-hidden flex flex-col shadow-lg" style={{ backgroundColor: t.panel, border: `1px solid ${t.border}` }}>
              <div className="px-3 py-2 flex items-center gap-1 flex-wrap" style={{ borderBottom: `1px solid ${t.border}`, backgroundColor: t.accentSoft }}>
                <button onMouseDown={e => { e.preventDefault(); document.execCommand('formatBlock', false, 'h1'); }} className="px-2 py-1 rounded-lg text-[9px] font-black hover:opacity-80 transition-all" style={{ color: t.textDim }}>H1</button>
                <button onMouseDown={e => { e.preventDefault(); document.execCommand('formatBlock', false, 'h2'); }} className="px-2 py-1 rounded-lg text-[9px] font-black hover:opacity-80 transition-all" style={{ color: t.textDim }}>H2</button>
                <button onMouseDown={e => { e.preventDefault(); document.execCommand('formatBlock', false, 'h3'); }} className="px-2 py-1 rounded-lg text-[9px] font-black hover:opacity-80 transition-all" style={{ color: t.textDim }}>H3</button>
                <div className="w-px h-5 mx-1" style={{ backgroundColor: t.border }}/>
                <button onMouseDown={e => { e.preventDefault(); document.execCommand('bold', false, null); }} className="p-1.5 rounded-lg hover:opacity-80 transition-all" style={{ color: t.textDim }}><Bold size={14}/></button>
                <button onMouseDown={e => { e.preventDefault(); document.execCommand('italic', false, null); }} className="p-1.5 rounded-lg hover:opacity-80 transition-all" style={{ color: t.textDim }}><Italic size={14}/></button>
                <button onMouseDown={e => { e.preventDefault(); document.execCommand('underline', false, null); }} className="px-2 py-1 rounded-lg hover:opacity-80 transition-all" style={{ color: t.textDim, textDecoration: 'underline', fontWeight: 900, fontSize: '13px' }}>U</button>
                <button onMouseDown={e => { e.preventDefault(); document.execCommand('strikeThrough', false, null); }} className="p-1.5 rounded-lg hover:opacity-80 transition-all" style={{ color: t.textDim }}><Strikethrough size={14}/></button>
                <div className="w-px h-5 mx-1" style={{ backgroundColor: t.border }}/>
                <button onMouseDown={e => { e.preventDefault(); document.execCommand('insertUnorderedList', false, null); }} className="p-1.5 rounded-lg hover:opacity-80 transition-all" style={{ color: t.textDim }}><List size={14}/></button>
                <button onMouseDown={e => { e.preventDefault(); document.execCommand('insertOrderedList', false, null); }} className="p-1.5 rounded-lg hover:opacity-80 transition-all" style={{ color: t.textDim }}><ListOrdered size={14}/></button>
                <div className="w-px h-5 mx-1" style={{ backgroundColor: t.border }}/>
                <button onMouseDown={e => { e.preventDefault(); document.execCommand('formatBlock', false, 'blockquote'); }} className="p-1.5 rounded-lg hover:opacity-80 transition-all" style={{ color: t.textDim }}><Quote size={14}/></button>
                <button onMouseDown={e => { e.preventDefault(); document.execCommand('insertHTML', false, '<table style="border-collapse:collapse;width:100%;margin:8px 0"><tr><td style="border:1px solid #444;padding:8px;color:inherit">Celda</td><td style="border:1px solid #444;padding:8px;color:inherit">Celda</td><td style="border:1px solid #444;padding:8px;color:inherit">Celda</td></tr><tr><td style="border:1px solid #444;padding:8px;color:inherit">Celda</td><td style="border:1px solid #444;padding:8px;color:inherit">Celda</td><td style="border:1px solid #444;padding:8px;color:inherit">Celda</td></tr></table><p></p>'); }} className="p-1.5 rounded-lg hover:opacity-80 transition-all" style={{ color: t.textDim }}><Table2 size={14}/></button>
                <button onMouseDown={e => { e.preventDefault(); const url = window.prompt('URL de imagen:'); if (url) document.execCommand('insertHTML', false, `<img src="${url}" style="max-width:100%;border-radius:8px;margin:4px 0" alt="img"/><p></p>`); }} className="p-1.5 rounded-lg hover:opacity-80 transition-all" style={{ color: t.textDim }}><ImageIcon size={14}/></button>
              </div>
              <div ref={editorRef} contentEditable="true" suppressContentEditableWarning={true}
                className="flex-1 p-6 font-medium text-base leading-relaxed outline-none mac-scrollbar overflow-y-auto"
                style={{ color: t.text }}
                dangerouslySetInnerHTML={{ __html: activeStrategy.contenido }} />
            </div>
            <div className="w-[280px] flex flex-col gap-3 overflow-y-auto mac-scrollbar">
              <div className="grid grid-cols-2 p-1 rounded-xl" style={{ backgroundColor: t.panel, border: `1px solid ${t.border}` }}>
                {[{ id: 'calc', label: 'Calc', icon: CalcIcon }, { id: 'info', label: 'Proyecto', icon: Target }].map(tab => (
                  <button key={tab.id} onClick={() => setAgencySideTab(tab.id)}
                    className="py-2 rounded-lg text-[8px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all"
                    style={{ backgroundColor: agencySideTab === tab.id ? t.accent : 'transparent', color: agencySideTab === tab.id ? '#000' : t.textDim }}>
                    <tab.icon size={12}/> {tab.label}
                  </button>
                ))}
              </div>
              {agencySideTab === 'calc' && (
                <div className="flex flex-col gap-3">
                  <div className="grid grid-cols-4 p-1 rounded-xl gap-1" style={{ backgroundColor: t.panel, border: `1px solid ${t.border}` }}>
                    {['BOB', 'USD', 'EUR', 'BRL'].map(cur => (
                      <button key={cur} onClick={() => setAgencySessionCurrency(cur)}
                        className="py-1.5 rounded-lg text-[7px] font-black uppercase tracking-widest transition-all"
                        style={{ backgroundColor: agencySessionCurrency === cur ? t.accent : 'transparent', color: agencySessionCurrency === cur ? '#000' : t.textDim }}>
                        {cur}
                      </button>
                    ))}
                  </div>
                  <div className="p-3 rounded-xl text-right shadow-inner" style={{ backgroundColor: t.panel, border: `1px solid ${t.border}`, color: 'white' }}>
                    <p className="text-[7px] font-black uppercase tracking-widest mb-1" style={{ color: t.accent }}>{agencySessionCurrency}</p>
                    <p className="text-xl font-mono font-black">{calcDisplay}</p>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {['C','DEL','%','/','7','8','9','*','4','5','6','-','1','2','3','+','0','.','='].map(btn => (
                      <button key={btn} onClick={() => btn === '=' ? handleCalc('=') : handleCalc(btn)} className="h-9 rounded-xl text-[9px] font-black transition-all"
                        style={{ backgroundColor: btn === '=' ? t.accent : 'rgba(255,255,255,0.05)', color: btn === '=' ? '#000000' : t.textMuted }}>
                        {btn}
                      </button>
                    ))}
                  </div>
                  <button onClick={() => { setAgencySessionPrice(calcDisplay !== '0' ? calcDisplay : agencySessionPrice); setAgencySideTab('info'); }}
                    className="w-full py-2.5 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                    style={{ backgroundColor: t.accentSoft, border: `1px solid ${t.border}`, color: t.textDim }}>
                    <DollarSign size={12}/> Usar como precio
                  </button>
                </div>
              )}
              {agencySideTab === 'info' && (
                <div className="flex flex-col gap-3">
                  <div className="p-4 rounded-xl space-y-3" style={{ backgroundColor: t.panel, border: `1px solid ${t.border}` }}>
                    <p className="text-[7px] font-black uppercase tracking-widest" style={{ color: t.accent }}>📅 Próxima Sesión</p>
                    <input type="date" value={agencyNextDate} onChange={e => setAgencyNextDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg text-[10px] outline-none"
                      style={{ backgroundColor: t.bg, border: `1px solid ${t.border}`, color: t.text }} />
                  </div>
                  <div className="p-4 rounded-xl space-y-3" style={{ backgroundColor: t.panel, border: `1px solid ${t.border}` }}>
                    <p className="text-[7px] font-black uppercase tracking-widest" style={{ color: t.accent }}>🔗 Links</p>
                    <div>
                      <p className="text-[7px] font-black uppercase ml-1 mb-1" style={{ color: t.textDim }}>Link Reunión</p>
                      <input type="url" value={agencyMeetLink} onChange={e => setAgencyMeetLink(e.target.value)} placeholder="meet.google.com / zoom..."
                        className="w-full px-3 py-2 rounded-lg text-[10px] outline-none"
                        style={{ backgroundColor: t.bg, border: `1px solid ${t.border}`, color: t.text }} />
                      {agencyMeetLink && <a href={agencyMeetLink} target="_blank" rel="noopener noreferrer" className="mt-1 flex items-center gap-1 text-[7px] font-black uppercase" style={{ color: t.accent }}><ExternalLink size={10}/> Abrir</a>}
                    </div>
                    <div>
                      <p className="text-[7px] font-black uppercase ml-1 mb-1" style={{ color: t.textDim }}>Drive / Archivos</p>
                      <input type="url" value={agencyDriveLink} onChange={e => setAgencyDriveLink(e.target.value)} placeholder="drive.google.com/..."
                        className="w-full px-3 py-2 rounded-lg text-[10px] outline-none"
                        style={{ backgroundColor: t.bg, border: `1px solid ${t.border}`, color: t.text }} />
                      {agencyDriveLink && <a href={agencyDriveLink} target="_blank" rel="noopener noreferrer" className="mt-1 flex items-center gap-1 text-[7px] font-black uppercase" style={{ color: t.accent }}><ExternalLink size={10}/> Abrir Drive</a>}
                    </div>
                  </div>
                  <div className="p-4 rounded-xl space-y-3" style={{ backgroundColor: t.panel, border: `1px solid ${t.border}` }}>
                    <p className="text-[7px] font-black uppercase tracking-widest" style={{ color: t.accent }}>💰 Precio Acordado</p>
                    <div className="grid grid-cols-4 gap-1 p-1 rounded-lg" style={{ backgroundColor: t.bg }}>
                      {['BOB', 'USD', 'EUR', 'BRL'].map(cur => (
                        <button key={cur} onClick={() => setAgencySessionCurrency(cur)}
                          className="py-1 rounded-md text-[7px] font-black transition-all"
                          style={{ backgroundColor: agencySessionCurrency === cur ? t.accent : 'transparent', color: agencySessionCurrency === cur ? '#000' : t.textDim }}>
                          {cur}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2 items-center">
                      <span className="text-[9px] font-black px-1" style={{ color: t.textDim }}>
                        {agencySessionCurrency === 'BOB' ? 'Bs.' : agencySessionCurrency === 'USD' ? '$' : agencySessionCurrency === 'EUR' ? '€' : 'R$'}
                      </span>
                      <input type="number" value={agencySessionPrice} onChange={e => setAgencySessionPrice(e.target.value)}
                        placeholder="0.00" min="0" step="0.01"
                        className="flex-1 px-3 py-2 rounded-lg text-sm font-mono outline-none"
                        style={{ backgroundColor: t.bg, border: `1px solid ${t.border}`, color: t.text }} />
                    </div>
                    <button onClick={() => registerSessionIncome(selectedCompany?.nombre_empresa || 'Agencia', activeStrategy.titulo_estrategia, agencySessionPrice, agencySessionCurrency, true)}
                      disabled={!agencySessionPrice || parseFloat(agencySessionPrice) <= 0 || agencyPriceRegistered}
                      className="w-full py-2.5 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                      style={{ 
                        backgroundColor: agencyPriceRegistered ? t.accentSoft : (agencySessionPrice && parseFloat(agencySessionPrice) > 0 ? t.accent : 'rgba(255,255,255,0.05)'),
                        color: agencyPriceRegistered ? t.accent : (agencySessionPrice && parseFloat(agencySessionPrice) > 0 ? '#000' : t.textDim),
                        cursor: agencyPriceRegistered || !agencySessionPrice ? 'not-allowed' : 'pointer'
                      }}>
                      {agencyPriceRegistered ? <><Check size={12}/> Registrado</> : <><TrendingUp size={12}/> Registrar Ingreso</>}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {viewState === 'session' && activeMeeting && (
        <div className="flex flex-col h-full overflow-hidden animate-in fade-in duration-500">
          <header className="px-4 py-3 flex items-center justify-between" style={{ backgroundColor: t.accentSoft, borderBottom: `1px solid ${t.border}` }}>
            <div className="flex items-center gap-4">
              <button onClick={saveMeeting} className="w-8 h-8 rounded-xl flex items-center justify-center transition-all" style={{ backgroundColor: t.accentSoft }}>
                <ArrowLeft size={18} color={t.textMuted}/>
              </button>
              <div>
                <h3 className="text-sm font-black uppercase" style={{ color: 'white' }}>{activeMeeting.session_title}</h3>
                <p className="text-[7px] font-black uppercase tracking-widest" style={{ color: t.accent }}>{activeClient?.nombre}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-3 px-4 py-1.5 rounded-xl text-lg font-mono font-black" style={{ backgroundColor: t.panel, border: `1px solid ${t.border}`, color: 'white' }}>
                {formatTime(time)}
                <button onClick={() => setIsTimerRunning(!isTimerRunning)} className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ backgroundColor: t.accent }}>
                  {isTimerRunning ? <Pause size={12}/> : <Play size={12}/>}
                </button>
                <button onClick={() => { setTime(0); setIsTimerRunning(false); }} className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
                  <RotateCcw size={12} color={t.textMuted}/>
                </button>
              </div>
              <button onClick={saveMeeting} className="px-5 py-2.5 text-[9px] font-black rounded-xl uppercase tracking-widest shadow-xl flex items-center gap-2"
                style={{ backgroundColor: 'white', color: '#000000' }}>
                <Save size={14}/> Guardar
              </button>
            </div>
          </header>
          <div className="flex-1 flex p-3 gap-3 overflow-hidden max-w-[1600px] mx-auto w-full">
            <div className="flex-1 rounded-xl overflow-hidden flex flex-col shadow-lg" style={{ backgroundColor: t.panel, border: `1px solid ${t.border}` }}>
              <div className="px-3 py-2 flex items-center gap-1 flex-wrap" style={{ borderBottom: `1px solid ${t.border}`, backgroundColor: t.accentSoft }}>
                <button onMouseDown={e => { e.preventDefault(); document.execCommand('formatBlock', false, 'h1'); }} className="px-2 py-1 rounded-lg text-[9px] font-black hover:opacity-80 transition-all" style={{ color: t.textDim }}>H1</button>
                <button onMouseDown={e => { e.preventDefault(); document.execCommand('formatBlock', false, 'h2'); }} className="px-2 py-1 rounded-lg text-[9px] font-black hover:opacity-80 transition-all" style={{ color: t.textDim }}>H2</button>
                <button onMouseDown={e => { e.preventDefault(); document.execCommand('formatBlock', false, 'h3'); }} className="px-2 py-1 rounded-lg text-[9px] font-black hover:opacity-80 transition-all" style={{ color: t.textDim }}>H3</button>
                <div className="w-px h-5 mx-1" style={{ backgroundColor: t.border }}/>
                <button onMouseDown={e => { e.preventDefault(); document.execCommand('bold', false, null); }} className="p-1.5 rounded-lg hover:opacity-80 transition-all" style={{ color: t.textDim }}><Bold size={14}/></button>
                <button onMouseDown={e => { e.preventDefault(); document.execCommand('italic', false, null); }} className="p-1.5 rounded-lg hover:opacity-80 transition-all" style={{ color: t.textDim }}><Italic size={14}/></button>
                <button onMouseDown={e => { e.preventDefault(); document.execCommand('underline', false, null); }} className="px-2 py-1 rounded-lg hover:opacity-80 transition-all" style={{ color: t.textDim, textDecoration: 'underline', fontWeight: 900, fontSize: '13px' }}>U</button>
                <button onMouseDown={e => { e.preventDefault(); document.execCommand('strikeThrough', false, null); }} className="p-1.5 rounded-lg hover:opacity-80 transition-all" style={{ color: t.textDim }}><Strikethrough size={14}/></button>
                <div className="w-px h-5 mx-1" style={{ backgroundColor: t.border }}/>
                <button onMouseDown={e => { e.preventDefault(); document.execCommand('insertUnorderedList', false, null); }} className="p-1.5 rounded-lg hover:opacity-80 transition-all" style={{ color: t.textDim }}><List size={14}/></button>
                <button onMouseDown={e => { e.preventDefault(); document.execCommand('insertOrderedList', false, null); }} className="p-1.5 rounded-lg hover:opacity-80 transition-all" style={{ color: t.textDim }}><ListOrdered size={14}/></button>
                <div className="w-px h-5 mx-1" style={{ backgroundColor: t.border }}/>
                <button onMouseDown={e => { e.preventDefault(); document.execCommand('formatBlock', false, 'blockquote'); }} className="p-1.5 rounded-lg hover:opacity-80 transition-all" style={{ color: t.textDim }}><Quote size={14}/></button>
                <button onMouseDown={e => { e.preventDefault(); document.execCommand('insertHTML', false, '<table style="border-collapse:collapse;width:100%;margin:8px 0"><tr><td style="border:1px solid #444;padding:8px;color:inherit">Celda</td><td style="border:1px solid #444;padding:8px;color:inherit">Celda</td><td style="border:1px solid #444;padding:8px;color:inherit">Celda</td></tr><tr><td style="border:1px solid #444;padding:8px;color:inherit">Celda</td><td style="border:1px solid #444;padding:8px;color:inherit">Celda</td><td style="border:1px solid #444;padding:8px;color:inherit">Celda</td></tr></table><p></p>'); }} className="p-1.5 rounded-lg hover:opacity-80 transition-all" style={{ color: t.textDim }}><Table2 size={14}/></button>
                <button onMouseDown={e => { e.preventDefault(); const url = window.prompt('URL de imagen:'); if (url) document.execCommand('insertHTML', false, `<img src="${url}" style="max-width:100%;border-radius:8px;margin:4px 0" alt="img"/><p></p>`); }} className="p-1.5 rounded-lg hover:opacity-80 transition-all" style={{ color: t.textDim }}><ImageIcon size={14}/></button>
              </div>
              <div ref={editorRef} contentEditable="true" suppressContentEditableWarning={true}
                className="flex-1 p-6 font-medium text-base leading-relaxed outline-none mac-scrollbar overflow-y-auto"
                style={{ color: t.text }}
                dangerouslySetInnerHTML={{ __html: activeMeeting.contenido }} />
            </div>
            <div className="w-[280px] flex flex-col gap-3 overflow-y-auto mac-scrollbar">
              <div className="grid grid-cols-2 p-1 rounded-xl" style={{ backgroundColor: t.panel, border: `1px solid ${t.border}` }}>
                {[{ id: 'calc', label: 'Calc', icon: CalcIcon }, { id: 'info', label: 'Reunión', icon: Calendar }].map(tab => (
                  <button key={tab.id} onClick={() => setSessionSideTab(tab.id)}
                    className="py-2 rounded-lg text-[8px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all"
                    style={{ backgroundColor: sessionSideTab === tab.id ? t.accent : 'transparent', color: sessionSideTab === tab.id ? '#000' : t.textDim }}>
                    <tab.icon size={12}/> {tab.label}
                  </button>
                ))}
              </div>
              {sessionSideTab === 'calc' && (
                <div className="flex flex-col gap-3">
                  <div className="grid grid-cols-4 p-1 rounded-xl gap-1" style={{ backgroundColor: t.panel, border: `1px solid ${t.border}` }}>
                    {['BOB', 'USD', 'EUR', 'BRL'].map(cur => (
                      <button key={cur} onClick={() => setSessionCurrency(cur)}
                        className="py-1.5 rounded-lg text-[7px] font-black uppercase tracking-widest transition-all"
                        style={{ backgroundColor: sessionCurrency === cur ? t.accent : 'transparent', color: sessionCurrency === cur ? '#000' : t.textDim }}>
                        {cur}
                      </button>
                    ))}
                  </div>
                  <div className="p-3 rounded-xl text-right shadow-inner" style={{ backgroundColor: t.panel, border: `1px solid ${t.border}`, color: 'white' }}>
                    <p className="text-[7px] font-black uppercase tracking-widest mb-1" style={{ color: t.accent }}>{sessionCurrency}</p>
                    <p className="text-xl font-mono font-black">{calcDisplay}</p>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {['C','DEL','%','/','7','8','9','*','4','5','6','-','1','2','3','+','0','.','='].map(btn => (
                      <button key={btn} onClick={() => btn === '=' ? handleCalc('=') : handleCalc(btn)} className="h-9 rounded-xl text-[9px] font-black transition-all"
                        style={{ backgroundColor: btn === '=' ? t.accent : 'rgba(255,255,255,0.05)', color: btn === '=' ? '#000000' : t.textMuted }}>
                        {btn}
                      </button>
                    ))}
                  </div>
                  <button onClick={() => { setSessionPrice(calcDisplay !== '0' ? calcDisplay : sessionPrice); setSessionSideTab('info'); }}
                    className="w-full py-2.5 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                    style={{ backgroundColor: t.accentSoft, border: `1px solid ${t.border}`, color: t.textDim }}>
                    <DollarSign size={12}/> Usar como precio
                  </button>
                </div>
              )}
              {sessionSideTab === 'info' && (
                <div className="flex flex-col gap-3">
                  <div className="p-4 rounded-xl space-y-3" style={{ backgroundColor: t.panel, border: `1px solid ${t.border}` }}>
                    <p className="text-[7px] font-black uppercase tracking-widest" style={{ color: t.accent }}>📅 Fechas</p>
                    <div>
                      <p className="text-[7px] font-black uppercase ml-1 mb-1" style={{ color: t.textDim }}>Reunión actual</p>
                      <div className="px-3 py-2 rounded-lg text-[10px] font-mono" style={{ backgroundColor: t.bg, border: `1px solid ${t.border}`, color: t.textMuted }}>{activeMeeting.fecha}</div>
                    </div>
                    <div>
                      <p className="text-[7px] font-black uppercase ml-1 mb-1" style={{ color: t.textDim }}>Próxima reunión</p>
                      <input type="date" value={sessionNextDate} onChange={e => setSessionNextDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg text-[10px] outline-none"
                        style={{ backgroundColor: t.bg, border: `1px solid ${t.border}`, color: t.text }} />
                    </div>
                  </div>
                  <div className="p-4 rounded-xl space-y-3" style={{ backgroundColor: t.panel, border: `1px solid ${t.border}` }}>
                    <p className="text-[7px] font-black uppercase tracking-widest" style={{ color: t.accent }}>🔗 Links</p>
                    <div>
                      <p className="text-[7px] font-black uppercase ml-1 mb-1" style={{ color: t.textDim }}>Link Reunión</p>
                      <input type="url" value={sessionMeetLink} onChange={e => setSessionMeetLink(e.target.value)} placeholder="meet.google.com / zoom / wa.me..."
                        className="w-full px-3 py-2 rounded-lg text-[10px] outline-none"
                        style={{ backgroundColor: t.bg, border: `1px solid ${t.border}`, color: t.text }} />
                      {sessionMeetLink && <a href={sessionMeetLink} target="_blank" rel="noopener noreferrer" className="mt-1 flex items-center gap-1 text-[7px] font-black uppercase" style={{ color: t.accent }}><ExternalLink size={10}/> Abrir</a>}
                    </div>
                    <div>
                      <p className="text-[7px] font-black uppercase ml-1 mb-1" style={{ color: t.textDim }}>Drive / Archivos</p>
                      <input type="url" value={sessionDriveLink} onChange={e => setSessionDriveLink(e.target.value)} placeholder="drive.google.com/..."
                        className="w-full px-3 py-2 rounded-lg text-[10px] outline-none"
                        style={{ backgroundColor: t.bg, border: `1px solid ${t.border}`, color: t.text }} />
                      {sessionDriveLink && <a href={sessionDriveLink} target="_blank" rel="noopener noreferrer" className="mt-1 flex items-center gap-1 text-[7px] font-black uppercase" style={{ color: t.accent }}><ExternalLink size={10}/> Abrir Drive</a>}
                    </div>
                  </div>
                  <div className="p-4 rounded-xl space-y-3" style={{ backgroundColor: t.panel, border: `1px solid ${t.border}` }}>
                    <p className="text-[7px] font-black uppercase tracking-widest" style={{ color: t.accent }}>💰 Precio Acordado</p>
                    <div className="grid grid-cols-4 gap-1 p-1 rounded-lg" style={{ backgroundColor: t.bg }}>
                      {['BOB', 'USD', 'EUR', 'BRL'].map(cur => (
                        <button key={cur} onClick={() => setSessionCurrency(cur)}
                          className="py-1 rounded-md text-[7px] font-black transition-all"
                          style={{ backgroundColor: sessionCurrency === cur ? t.accent : 'transparent', color: sessionCurrency === cur ? '#000' : t.textDim }}>
                          {cur}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2 items-center">
                      <span className="text-[9px] font-black px-1" style={{ color: t.textDim }}>
                        {sessionCurrency === 'BOB' ? 'Bs.' : sessionCurrency === 'USD' ? '$' : sessionCurrency === 'EUR' ? '€' : 'R$'}
                      </span>
                      <input type="number" value={sessionPrice} onChange={e => setSessionPrice(e.target.value)}
                        placeholder="0.00" min="0" step="0.01"
                        className="flex-1 px-3 py-2 rounded-lg text-sm font-mono outline-none"
                        style={{ backgroundColor: t.bg, border: `1px solid ${t.border}`, color: t.text }} />
                    </div>
                    <button onClick={() => registerSessionIncome(activeClient?.nombre || 'Cliente', activeMeeting.session_title, sessionPrice, sessionCurrency, false)}
                      disabled={!sessionPrice || parseFloat(sessionPrice) <= 0 || priceRegistered}
                      className="w-full py-2.5 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                      style={{ 
                        backgroundColor: priceRegistered ? t.accentSoft : (sessionPrice && parseFloat(sessionPrice) > 0 ? t.accent : 'rgba(255,255,255,0.05)'),
                        color: priceRegistered ? t.accent : (sessionPrice && parseFloat(sessionPrice) > 0 ? '#000' : t.textDim),
                        cursor: priceRegistered || !sessionPrice ? 'not-allowed' : 'pointer'
                      }}>
                      {priceRegistered ? <><Check size={12}/> Registrado en Ganancias</> : <><TrendingUp size={12}/> Registrar Ingreso</>}
                    </button>
                  </div>
                  {activeClient && (activeClient.telefono || activeClient.email) && (
                    <div className="p-4 rounded-xl space-y-2" style={{ backgroundColor: t.panel, border: `1px solid ${t.border}` }}>
                      <p className="text-[7px] font-black uppercase tracking-widest" style={{ color: t.accent }}>📱 Contacto</p>
                      {activeClient.telefono && (
                        <a href={`https://wa.me/${activeClient.telefono.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-2 text-[9px] font-black hover:opacity-80 transition-all" style={{ color: t.textDim }}>
                          <Smartphone size={12}/> {activeClient.telefono}
                        </a>
                      )}
                      {activeClient.email && (
                        <a href={`mailto:${activeClient.email}`}
                          className="flex items-center gap-2 text-[9px] font-black hover:opacity-80 transition-all" style={{ color: t.textDim }}>
                          <Mail size={12}/> {activeClient.email}
                        </a>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {isClientModalOpen && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-6 animate-in zoom-in duration-300"
          style={{ backgroundColor: 'rgba(20, 20, 20, 0.95)', backdropFilter: 'blur(24px)' }}>
           <div className="w-full max-w-lg p-6 space-y-5 shadow-2xl rounded-xl"
             style={{ backgroundColor: t.panel, border: `1px solid ${t.borderLight}` }}>
                <div className="flex justify-between items-center">
                   <h3 className="text-xl font-black uppercase tracking-tight" style={{ color: 'white' }}>Nuevo <span style={{ color: t.accent }}>Registro</span></h3>
                   <button onClick={() => setIsClientModalOpen(false)} className="w-8 h-8 rounded-xl flex items-center justify-center transition-all" style={{ backgroundColor: t.accentSoft }}>
                     <X size={18} color={t.textMuted}/>
                   </button>
                </div>
                
                <div className="space-y-3">
                   <div className="space-y-1.5">
                      <p className="text-[7px] font-black uppercase ml-1 tracking-widest" style={{ color: t.textDim }}>Información Básica</p>
                      <input type="text" value={newClient.nombre} onChange={e=>setNewClient({...newClient, nombre: e.target.value})} placeholder="Nombre completo..."
                        className="w-full rounded-xl p-4 text-sm outline-none transition-all"
                        style={{ backgroundColor: t.bg, border: `1px solid ${t.border}`, color: t.text }} />
                      <input type="text" value={newClient.empresa} onChange={e=>setNewClient({...newClient, empresa: e.target.value})} placeholder="Empresa / Marca..."
                        className="w-full rounded-xl p-4 text-sm outline-none transition-all mt-1.5"
                        style={{ backgroundColor: t.bg, border: `1px solid ${t.border}`, color: t.text }} />
                   </div>

                   <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                         <p className="text-[7px] font-black uppercase ml-1 tracking-widest" style={{ color: t.textDim }}>Nacionalidad</p>
                         <input type="text" value={newClient.nacionalidad} onChange={e=>setNewClient({...newClient, nacionalidad: e.target.value})} placeholder="Ej: Peruana"
                           className="w-full rounded-xl p-4 text-sm outline-none transition-all"
                           style={{ backgroundColor: t.bg, border: `1px solid ${t.border}`, color: t.text }} />
                      </div>
                      <div className="space-y-1.5">
                         <p className="text-[7px] font-black uppercase ml-1 tracking-widest" style={{ color: t.textDim }}>Teléfono</p>
                         <input type="text" value={newClient.telefono} onChange={e=>setNewClient({...newClient, telefono: e.target.value})} placeholder="+00 000..."
                           className="w-full rounded-xl p-4 text-sm outline-none transition-all"
                           style={{ backgroundColor: t.bg, border: `1px solid ${t.border}`, color: t.text }} />
                      </div>
                   </div>

                   <div className="space-y-1.5">
                      <p className="text-[7px] font-black uppercase ml-1 tracking-widest" style={{ color: t.textDim }}>URL de Foto de Perfil</p>
                      <input type="text" value={newClient.foto} onChange={e=>setNewClient({...newClient, foto: e.target.value})} placeholder="https://..."
                        className="w-full rounded-xl p-4 text-sm outline-none transition-all"
                        style={{ backgroundColor: t.bg, border: `1px solid ${t.border}`, color: t.text }} />
                   </div>
                </div>

                <div className="flex gap-3 pt-3">
                   <button onClick={() => setIsClientModalOpen(false)} className="flex-1 py-4 font-black uppercase text-[9px] tracking-widest transition-all" style={{ color: t.textDim }}>Cancelar</button>
                   <button onClick={handleCreateClient} className="flex-[2] py-4 rounded-xl font-black uppercase text-[9px] shadow-xl transition-all tracking-widest"
                     style={{ backgroundColor: t.accent, color: '#000000' }}>Vincular Nexus</button>
                </div>
            </div>
         </div>
      )}

      {isCompanyModalOpen && (
        <div className="fixed inset-0 z-[800] flex items-center justify-center p-6 animate-in zoom-in duration-300"
          style={{ backgroundColor: 'rgba(20, 20, 20, 0.95)', backdropFilter: 'blur(24px)' }}>
           <div className="w-full max-w-2xl overflow-hidden shadow-2xl rounded-xl"
             style={{ backgroundColor: t.panel, border: `1px solid ${t.border}` }}>
              <header className="px-6 py-5 flex justify-between items-center" style={{ borderBottom: `1px solid ${t.border}`, backgroundColor: t.accentSoft }}>
                 <div>
                   <h3 className="text-xl font-black uppercase tracking-tight" style={{ color: 'white' }}>Strategic <span style={{ color: t.accent }}>Link</span></h3>
                   <p className="text-[7px] font-black uppercase tracking-[0.3em] mt-0.5" style={{ color: t.textDim }}>Agency Connection Node</p>
                 </div>
                 <button onClick={() => setIsCompanyModalOpen(false)} className="w-8 h-8 rounded-xl flex items-center justify-center transition-all" style={{ backgroundColor: t.accentSoft }}>
                   <X size={18} color={t.textMuted}/>
                 </button>
              </header>

              <div className="flex" style={{ borderBottom: `1px solid ${t.border}`, backgroundColor: t.bg }}>
                 {['general', 'redes', 'cm'].map(tab => (
                    <button key={tab} onClick={() => setAgencyTab(tab)} className="flex-1 py-3.5 text-[8px] font-black uppercase tracking-widest transition-all"
                      style={{
                        color: agencyTab === tab ? t.accent : t.textDim,
                        borderBottom: agencyTab === tab ? `2px solid ${t.accent}` : '2px solid transparent',
                      }}>
                       {tab === 'general' ? 'Información' : tab === 'redes' ? 'Social Media' : 'CM Access'}
                    </button>
                 ))}
              </div>

              <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto mac-scrollbar">
                 {agencyTab === 'general' && (
                    <div className="space-y-3 animate-in fade-in duration-500">
                       <div className="space-y-1.5">
                         <p className="text-[7px] font-black uppercase ml-1 tracking-widest" style={{ color: t.textDim }}>Empresa / Marca</p>
                         <input type="text" value={newCompany.nombre_empresa} onChange={e=>setNewCompany({...newCompany, nombre_empresa: e.target.value})} placeholder="Nombre de la marca..."
                           className="w-full rounded-xl p-4 text-sm outline-none transition-all"
                           style={{ backgroundColor: t.bg, border: `1px solid ${t.border}`, color: t.text }} />
                       </div>
                       <div className="space-y-1.5">
                         <p className="text-[7px] font-black uppercase ml-1 tracking-widest" style={{ color: t.textDim }}>Director / Socio</p>
                         <input type="text" value={newCompany.dueño} onChange={e=>setNewCompany({...newCompany, dueño: e.target.value})} placeholder="Nombre del responsable..."
                           className="w-full rounded-xl p-4 text-sm outline-none transition-all"
                           style={{ backgroundColor: t.bg, border: `1px solid ${t.border}`, color: t.text }} />
                       </div>
                       <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <p className="text-[7px] font-black uppercase ml-1 tracking-widest" style={{ color: t.textDim }}>Email Corporativo</p>
                            <input type="email" value={newCompany.email} onChange={e=>setNewCompany({...newCompany, email: e.target.value})} placeholder="email@empresa.com"
                              className="w-full rounded-xl p-4 text-sm outline-none transition-all"
                              style={{ backgroundColor: t.bg, border: `1px solid ${t.border}`, color: t.text }} />
                          </div>
                          <div className="space-y-1.5">
                            <p className="text-[7px] font-black uppercase ml-1 tracking-widest" style={{ color: t.textDim }}>Teléfono / WhatsApp</p>
                            <input type="text" value={newCompany.telefono} onChange={e=>setNewCompany({...newCompany, telefono: e.target.value})} placeholder="+00 000 000 000"
                              className="w-full rounded-xl p-4 text-sm outline-none transition-all"
                              style={{ backgroundColor: t.bg, border: `1px solid ${t.border}`, color: t.text }} />
                          </div>
                       </div>
                    </div>
                 )}

                 {agencyTab === 'redes' && (
                    <div className="space-y-3 animate-in fade-in duration-500">
                       {['instagram', 'tiktok', 'facebook', 'youtube'].map(red => (
                          <div key={red} className="flex items-center gap-3 p-2 rounded-xl" style={{ backgroundColor: t.accentSoft, border: `1px solid ${t.border}` }}>
                             <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg" style={{ backgroundColor: t.accentSoft }}>
                                {red === 'instagram' && <Instagram size={18} color={t.accent}/>}
                                {red === 'tiktok' && <TiktokIcon size={18} color={t.accent}/>}
                                {red === 'facebook' && <Facebook size={18} color={t.accent}/>}
                                {red === 'youtube' && <Youtube size={18} color={t.accent}/>}
                             </div>
                             <input type="text" value={newCompany.redes[red]} onChange={e=>setNewCompany({...newCompany, redes: {...newCompany.redes, [red]: e.target.value}})} placeholder={`URL o @User de ${red}...`}
                               className="flex-1 bg-transparent p-3 text-sm outline-none tracking-widest" style={{ color: t.text }} />
                          </div>
                       ))}
                    </div>
                 )}

                 {agencyTab === 'cm' && (
                    <div className="space-y-4 animate-in fade-in duration-500">
                       <div className="p-4 rounded-xl" style={{ backgroundColor: t.accentSoft, border: `1px solid ${t.border}` }}>
                         <p className="text-[8px] font-black uppercase mb-1 tracking-widest" style={{ color: t.accent }}>Security Protocol</p>
                         <p className="text-[9px] font-bold uppercase leading-relaxed tracking-wider" style={{ color: t.textDim }}>Las credenciales se encriptan y se almacenan exclusivamente para gestión de Community Manager.</p>
                       </div>
                       {['instagram', 'tiktok', 'facebook', 'youtube'].map(red => (
                          <div key={red} className="space-y-2 p-4 rounded-xl shadow-inner" style={{ backgroundColor: t.accentSoft, border: `1px solid ${t.border}` }}>
                             <h4 className="text-[8px] font-black uppercase tracking-[0.15em] flex items-center gap-2" style={{ color: t.accent }}>
                                {red === 'instagram' && <Instagram size={10}/>}
                                {red === 'tiktok' && <TiktokIcon size={10}/>}
                                {red === 'facebook' && <Facebook size={10}/>}
                                {red === 'youtube' && <Youtube size={10}/>}
                                Access {red}
                             </h4>
                             <div className="grid grid-cols-2 gap-2">
                                <input type="text" value={newCompany.credentials[red].user} onChange={e=>setNewCompany({...newCompany, credentials: {...newCompany.credentials, [red]: {...newCompany.credentials[red], user: e.target.value}}})} placeholder="Usuario / Email"
                                  className="w-full rounded-xl p-3.5 text-[10px] outline-none transition-all"
                                  style={{ backgroundColor: t.bg, border: `1px solid ${t.border}`, color: t.text }} />
                                <div className="relative">
                                   <input type={showPass[red] ? 'text' : 'password'} value={newCompany.credentials[red].pass} onChange={e=>setNewCompany({...newCompany, credentials: {...newCompany.credentials, [red]: {...newCompany.credentials[red], pass: e.target.value}}})} placeholder="Contraseña"
                                     className="w-full rounded-xl p-3.5 text-[10px] outline-none pr-10 transition-all"
                                     style={{ backgroundColor: t.bg, border: `1px solid ${t.border}`, color: t.text }} />
                                   <button onClick={() => setShowPass({...showPass, [red]: !showPass[red]})} className="absolute right-3 top-1/2 -translate-y-1/2 transition-all" style={{ color: t.textDim }}>
                                      {showPass[red] ? <EyeOff size={14}/> : <Eye size={14}/>}
                                   </button>
                                </div>
                             </div>
                          </div>
                       ))}
                    </div>
                 )}
              </div>

              <footer className="px-6 py-5 flex gap-3" style={{ backgroundColor: t.accentSoft, borderTop: `1px solid ${t.border}` }}>
                 <button onClick={() => setIsCompanyModalOpen(false)} className="flex-1 py-4 font-black uppercase text-[9px] transition-all tracking-[0.15em]" style={{ color: t.textDim }}>Descartar</button>
                 <button onClick={handleCreateAgencyClient} className="flex-[2] py-4 rounded-xl font-black uppercase text-[9px] transition-all tracking-[0.15em] shadow-lg"
                   style={{ backgroundColor: t.accent, color: '#000000' }}>Sincronizar Nexus Agency</button>
              </footer>
           </div>
        </div>
      )}

      {viewState === 'project-engine' && (
        <ProjectEngineView isDark={isDark} />
      )}
    </div>
  );
};

const ProjectEngineView = ({ isDark = true }) => {
  const t = useMemo(() => getTheme(isDark), [isDark]);

  const [activeTab, setActiveTab] = useState('estructurador');
  const [carpetaMaestra, setCarpetaMaestra] = useState('Base de Edición Principal');
  const [empresa, setEmpresa] = useState('');
  const [proyecto, setProyecto] = useState('');
  const [selectedPremiere, setSelectedPremiere] = useState('');
  const [selectedAE, setSelectedAE] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  const [destinationPath, setDestinationPath] = useState('');
  const [dirHandle, setDirHandle] = useState(null);

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

  const downloadNotes = () => {
    const element = document.createElement("a");
    const file = new Blob([editNotes], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `notas_edicion_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

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

  const cleanSsdCache = () => {
    setIsCleaningCache(true);
    setCacheSuccess(false);
    setTimeout(() => {
      setIsCleaningCache(false);
      setCacheSuccess(true);
      setSsdCacheSize(0);
    }, 1500);
  };

  const handleSelectDirectory = async () => {
    try {
      if (window.electronAPI) {
        const path = await window.electronAPI.selectDirectory();
        if (path) {
          setDestinationPath(path);
        }
      } else {
        if (!window.showDirectoryPicker) {
          throw new Error('Navegador no soportado. Usa Chrome.');
        }
        const handle = await window.showDirectoryPicker({ mode: 'readwrite' });
        setDirHandle(handle);
        setDestinationPath(handle.name || 'Directorio Vinculado');
      }
    } catch (e) {
      console.error(e);
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

      if (window.electronAPI) {
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
        const rootDir = await dirHandle.getDirectoryHandle(carpetaMaestra, { create: true });
        const companyDir = await rootDir.getDirectoryHandle(empresa, { create: true });
        const folderName = `${today}_${empresa.replace(/ /g, '_')}_${proyecto.replace(/ /g, '_')}`;
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
          const res = await fetch(`/plantillas_adobe/premiere_pro/${selectedPremiere}.prproj`);
          if (!res.ok) throw new Error('No se pudo descargar la plantilla');
          const blob = await res.blob();
          const prFileHandle = await prDir.getFileHandle(`${folderName}.prproj`, { create: true });
          const writable = await prFileHandle.createWritable();
          await writable.write(blob);
          await writable.close();
        }

        if (selectedAE) {
          const res = await fetch(`/plantillas_adobe/after_effects/${selectedAE}.aep`);
          if (!res.ok) throw new Error('No se pudo descargar la plantilla');
          const blob = await res.blob();
          const aeFileHandle = await aeDir.getFileHandle(`${folderName}.aep`, { create: true });
          const writable = await aeFileHandle.createWritable();
          await writable.write(blob);
          await writable.close();
        }
      }

      setTimeout(() => setStatusMsg(''), 5000);
      setEmpresa('');
      setProyecto('');
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  const cleanFolderName = (txt) => txt.replace(/ /g, '_');
  const finalProjectFolderName = `${today}_${cleanFolderName(empresa || 'CLIENTE')}_${cleanFolderName(proyecto || 'PROYECTO')}`;
  
  const finalNamingResult = `${nomClient.toUpperCase().replace(/ /g, '_')}_${nomProj.toUpperCase().replace(/ /g, '_')}_${nomVer.toUpperCase()}_${today}_${nomAspect}`;

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
    { key: 'F9', desc: 'Easy Ease (Suaviza acelaración/deceleración)', soft: 'After Effects' },
    { key: 'Alt + [ o ]', desc: 'Recortar punto de entrada o salida de capa', soft: 'After Effects' },
    { key: 'Ctrl + D', desc: 'Duplicar pista o capa seleccionada', soft: 'Premiere Pro / AE' }
  ];
  
  const filteredShortcuts = shortcutsList.filter(s => 
    s.key.toLowerCase().includes(shortcutQuery.toLowerCase()) || 
    s.desc.toLowerCase().includes(shortcutQuery.toLowerCase()) ||
    s.soft.toLowerCase().includes(shortcutQuery.toLowerCase())
  );

  return (
    <div className="flex-grow flex-shrink min-h-0 flex flex-col p-5 lg:p-6 space-y-6 max-w-[1400px] mx-auto w-full animate-in fade-in duration-700 overflow-y-auto mac-scrollbar">
       <header className="flex flex-col md:flex-row md:items-center justify-between pb-4 gap-4" style={{ borderBottom: `1px solid ${t.border}` }}>
          <div>
             <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-2.5" style={{ color: 'white' }}>
                Editor de Video
             </h2>
             <p className="text-[8px] font-black uppercase tracking-[0.25em] mt-1 flex items-center gap-1.5" style={{ color: t.textMuted }}>
                <HardDrive size={10} color={t.accent}/> Workspace de Producción Profesional
             </p>
          </div>
          <div style={{ fontSize: 9, color: t.textDim, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }} className="flex items-center gap-2">
             <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: t.accent }} className="animate-pulse" />
             Workspace Conectado
          </div>
       </header>

       <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 items-start mt-2">
          {/* COLUMNA 1: ESTRUCTURADOR & INYECCIÓN */}
          <div className="flex flex-col space-y-5">
             
             {/* PANEL 1: ESTRUCTURADOR DE ENTORNO */}
             <div className="p-5 rounded-2xl flex flex-col space-y-4" style={{ backgroundColor: t.bg, border: `1px solid ${t.border}` }}>
                <div className="flex items-center gap-3 pb-3" style={{ borderBottom: `1px solid ${t.border}` }}>
                   <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ border: `1px solid ${t.border}`, backgroundColor: 'rgba(255,255,255,0.02)' }}>
                      <Folder size={15} color={t.accent} />
                   </div>
                   <div>
                      <h3 className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'white' }}>1. ESTRUCTURADOR DE ENTORNO</h3>
                      <p className="text-[7px] font-bold uppercase tracking-wider" style={{ color: t.textDim }}>Estructuras locales y disco duro</p>
                   </div>
                </div>

                <div className="space-y-4">
                   <div className="space-y-1.5">
                      <p className="text-[8px] font-black uppercase tracking-widest" style={{ color: t.textDim }}>Destino del Proyecto</p>
                      <div className="flex gap-2">
                         <input 
                            type="text" 
                            value={destinationPath || 'Ningún directorio seleccionado...'} 
                            disabled 
                            className="flex-1 rounded-xl p-3 text-[10px] font-mono outline-none truncate"
                            style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: `1px solid ${t.border}`, color: t.textMuted }} 
                         />
                         <button 
                            onClick={handleSelectDirectory}
                            className="px-4 rounded-xl text-[9px] font-black uppercase transition-all shrink-0 animate-in fade-in"
                            style={{ backgroundColor: t.accent, color: '#000000', border: `1px solid ${t.border}` }}
                         >
                            Vincular
                         </button>
                      </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                         <label className="text-[8px] font-black uppercase tracking-widest" style={{ color: t.textDim }}>Carpeta Maestra</label>
                         <input type="text" value={carpetaMaestra} onChange={e=>setCarpetaMaestra(e.target.value)} placeholder="Ej: Base de Edición"
                            className="w-full rounded-xl p-3 text-[11px] outline-none shadow-inner"
                            style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: `1px solid ${t.border}`, color: t.text }} />
                      </div>
                      <div className="space-y-1.5">
                         <label className="text-[8px] font-black uppercase tracking-widest" style={{ color: t.textDim }}>Cliente / Empresa</label>
                         <input type="text" value={empresa} onChange={e=>setEmpresa(e.target.value)} placeholder="Ej: Urbanización Bensa"
                            className="w-full rounded-xl p-3 text-[11px] outline-none shadow-inner"
                            style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: `1px solid ${t.border}`, color: t.text }} />
                      </div>
                   </div>
                   <div className="space-y-1.5">
                      <label className="text-[8px] font-black uppercase tracking-widest" style={{ color: t.textDim }}>Nombre del Proyecto / Temática</label>
                      <input type="text" value={proyecto} onChange={e=>setProyecto(e.target.value)} placeholder="Ej: Spot Comercial"
                         className="w-full rounded-xl p-3 text-[11px] outline-none shadow-inner"
                         style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: `1px solid ${t.border}`, color: t.text }} />
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                      <div className="space-y-1.5">
                         <label className="text-[8px] font-black uppercase tracking-widest" style={{ color: t.textDim }}>Plantilla Premiere Pro</label>
                         <select value={selectedPremiere} onChange={e=>setSelectedPremiere(e.target.value)}
                            className="w-full rounded-xl p-3 text-[11px] outline-none cursor-pointer"
                            style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: `1px solid ${t.border}`, color: t.text }}>
                            <option value="" style={{backgroundColor: '#141414'}}>No incluir Premiere</option>
                            {templates.map(t => <option key={t} value={t} style={{backgroundColor: '#141414'}}>{t}</option>)}
                         </select>
                      </div>
                      <div className="space-y-1.5">
                         <label className="text-[8px] font-black uppercase tracking-widest" style={{ color: t.textDim }}>Plantilla After Effects</label>
                         <select value={selectedAE} onChange={e=>setSelectedAE(e.target.value)}
                            className="w-full rounded-xl p-3 text-[11px] outline-none cursor-pointer"
                            style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: `1px solid ${t.border}`, color: t.text }}>
                            <option value="" style={{backgroundColor: '#141414'}}>No incluir After Effects</option>
                            {templates.map(t => <option key={t} value={t} style={{backgroundColor: '#141414'}}>{t}</option>)}
                         </select>
                      </div>
                   </div>

                   <div className="space-y-1.5">
                      <p className="text-[8px] font-black uppercase tracking-widest" style={{ color: t.textDim }}>Inyecciones Adicionales</p>
                      <div className="grid grid-cols-3 gap-2">
                         <label className="flex items-center gap-2 cursor-pointer rounded-xl p-2 transition-all" style={{ border: `1px solid ${t.border}`, backgroundColor: 'rgba(255,255,255,0.01)' }}>
                            <input type="checkbox" checked={incSFX} onChange={e=>setIncSFX(e.target.checked)} className="w-3 h-3 rounded accent-neutral-400 cursor-pointer" />
                            <span className="text-[8px] font-black uppercase tracking-wider font-bold" style={{ color: t.textMuted }}>Audio SFX</span>
                         </label>
                         <label className="flex items-center gap-2 cursor-pointer rounded-xl p-2 transition-all" style={{ border: `1px solid ${t.border}`, backgroundColor: 'rgba(255,255,255,0.01)' }}>
                            <input type="checkbox" checked={incLogos} onChange={e=>setIncLogos(e.target.checked)} className="w-3 h-3 rounded accent-neutral-400 cursor-pointer" />
                            <span className="text-[8px] font-black uppercase tracking-wider font-bold" style={{ color: t.textMuted }}>Logotipos</span>
                         </label>
                         <label className="flex items-center gap-2 cursor-pointer rounded-xl p-2 transition-all" style={{ border: `1px solid ${t.border}`, backgroundColor: 'rgba(255,255,255,0.01)' }}>
                            <input type="checkbox" checked={incMOGRTs} onChange={e=>setIncMOGRTs(e.target.checked)} className="w-3 h-3 rounded accent-neutral-400 cursor-pointer" />
                            <span className="text-[8px] font-black uppercase tracking-wider font-bold" style={{ color: t.textMuted }}>MOGRTs</span>
                         </label>
                      </div>
                   </div>
                </div>
             </div>

             {/* PANEL 2: CONSOLA DE INYECCIÓN */}
             <div className="p-5 rounded-2xl flex flex-col space-y-4" style={{ backgroundColor: t.bg, border: `1px solid ${t.border}` }}>
                <div className="flex items-center justify-between pb-3" style={{ borderBottom: `1px solid ${t.border}` }}>
                   <div className="flex items-center gap-2">
                      <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: t.accent }}></span>
                      <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'white' }}>CONSOLA DE INYECCIÓN</span>
                   </div>
                   <span className="px-2 py-0.5 rounded text-[7px] font-bold uppercase tracking-wider" style={{ border: `1px solid ${t.border}`, color: t.textMuted, backgroundColor: 'rgba(255,255,255,0.02)' }}>
                      {isGenerating ? 'Ejecutando' : 'Listo'}
                   </span>
                </div>

                <div className="space-y-3">
                   <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-xl space-y-1" style={{ border: `1px solid ${t.border}`, backgroundColor: 'rgba(255,255,255,0.01)' }}>
                         <p className="text-[7px] font-black uppercase tracking-wider" style={{ color: t.textDim }}>Disco Destino</p>
                         <div className="flex items-center gap-1.5">
                            <HardDrive size={11} color={destinationPath ? t.textMuted : t.textDim} />
                            <span className="text-[10px] font-bold font-mono truncate" style={{ color: t.textMuted }}>
                               {destinationPath ? (typeof destinationPath === 'string' ? destinationPath.split('/').pop() : destinationPath.name) : 'No vinculado'}
                            </span>
                         </div>
                      </div>
                      <div className="p-3 rounded-xl space-y-1" style={{ border: `1px solid ${t.border}`, backgroundColor: 'rgba(255,255,255,0.01)' }}>
                         <p className="text-[7px] font-black uppercase tracking-wider" style={{ color: t.textDim }}>Carpeta de Base</p>
                         <div className="flex items-center gap-1.5">
                            <Folder size={11} color={t.textMuted} />
                            <span className="text-[10px] font-bold truncate" style={{ color: t.textMuted }}>
                               {carpetaMaestra || 'Ninguna'}
                            </span>
                         </div>
                      </div>
                   </div>

                   <div className="p-4 rounded-xl space-y-2" style={{ border: `1px solid ${t.border}`, backgroundColor: 'rgba(255,255,255,0.01)' }}>
                      <p className="text-[7px] font-black uppercase tracking-wider" style={{ color: t.textDim, borderBottom: `1px solid ${t.border}`, paddingBottom: 6 }}>
                         Carpeta Estructural Destino
                      </p>
                      <div className="flex justify-between items-center text-[10px]">
                         <span style={{ color: t.textMuted }}>Nombre Proyecto:</span>
                         <span className="font-mono font-bold truncate max-w-[180px]" style={{ color: 'white' }}>
                            {empresa ? finalProjectFolderName : 'Esperando datos...'}
                         </span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] pt-1" style={{ borderTop: '1px solid rgba(255,255,255,0.03)' }}>
                         <span style={{ color: t.textMuted }}>Plantillas:</span>
                         <div className="flex gap-1.5">
                            {selectedPremiere && <span className="px-1.5 py-0.5 rounded text-[7px] font-black uppercase" style={{ border: `1px solid ${t.border}`, color: t.textMuted }}>[Pr] Premiere</span>}
                            {selectedAE && <span className="px-1.5 py-0.5 rounded text-[7px] font-black uppercase" style={{ border: `1px solid ${t.border}`, color: t.textMuted }}>[Ae] After Effects</span>}
                            {!selectedPremiere && !selectedAE && <span className="text-[9px]" style={{ color: t.textDim }}>Ninguna</span>}
                         </div>
                      </div>
                   </div>

                   <button 
                      onClick={handleGenerate} 
                      disabled={isGenerating || !destinationPath} 
                      className="w-full py-4 rounded-xl font-black uppercase tracking-[0.2em] text-[9px] flex items-center justify-center gap-2.5 transition-all duration-300 shadow-lg"
                      style={{
                         backgroundColor: isGenerating || !destinationPath ? 'transparent' : t.accent,
                         color: isGenerating || !destinationPath ? t.textDim : '#000000',
                         border: `1px solid ${t.border}`,
                         cursor: isGenerating || !destinationPath ? 'not-allowed' : 'pointer',
                      }}
                   >
                      {isGenerating ? (
                         <><div className="w-3.5 h-3.5 border-2 rounded-xl animate-spin" style={{ borderColor: t.accent, borderTopColor: 'transparent' }}></div> Inyectando...</>
                      ) : !destinationPath ? (
                         <>Vincula el disco para inyectar</>
                      ) : (
                         <><Zap size={14} fill="currentColor"/> Generar Entorno</>
                      )}
                   </button>
                   {statusMsg && (
                      <p className="text-center text-[8px] font-black uppercase tracking-widest animate-in fade-in" style={{ color: statusMsg.includes('Error') ? t.textDim : t.textMuted }}>
                         {statusMsg}
                      </p>
                   )}
                </div>
             </div>

          </div>

          {/* COLUMNA 2: NOMENCLATURA & CÁLCULOS */}
          <div className="flex flex-col space-y-5">
             
             {/* PANEL 3: NOMENCLATURA DE ARCHIVOS PRO */}
             <div className="p-5 rounded-2xl flex flex-col space-y-4" style={{ backgroundColor: t.bg, border: `1px solid ${t.border}` }}>
                <div className="flex items-center gap-3 pb-3" style={{ borderBottom: `1px solid ${t.border}` }}>
                   <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ border: `1px solid ${t.border}`, backgroundColor: 'rgba(255,255,255,0.02)' }}>
                      <Type size={15} color={t.accent} />
                   </div>
                   <div>
                      <h3 className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'white' }}>2. NOMENCLATURA DE ARCHIVOS PRO</h3>
                      <p className="text-[7px] font-bold uppercase tracking-wider" style={{ color: t.textDim }}>Estándar de entrega comercial</p>
                   </div>
                </div>

                <div className="space-y-3.5">
                   <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                         <span className="text-[7px] font-black uppercase tracking-wider" style={{ color: t.textDim }}>Cliente</span>
                         <input type="text" value={nomClient} onChange={e=>setNomClient(e.target.value)}
                            className="w-full rounded-xl p-2.5 text-[11px] outline-none shadow-inner"
                            style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: `1px solid ${t.border}`, color: t.text }} />
                      </div>
                      <div className="space-y-1">
                         <span className="text-[7px] font-black uppercase tracking-wider" style={{ color: t.textDim }}>Proyecto</span>
                         <input type="text" value={nomProj} onChange={e=>setNomProj(e.target.value)}
                            className="w-full rounded-xl p-2.5 text-[11px] outline-none shadow-inner"
                            style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: `1px solid ${t.border}`, color: t.text }} />
                      </div>
                      <div className="space-y-1">
                         <span className="text-[7px] font-black uppercase tracking-wider" style={{ color: t.textDim }}>Versión</span>
                         <input type="text" value={nomVer} onChange={e=>setNomVer(e.target.value)}
                            className="w-full rounded-xl p-2.5 text-[11px] outline-none shadow-inner"
                            style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: `1px solid ${t.border}`, color: t.text }} />
                      </div>
                      <div className="space-y-1">
                         <span className="text-[7px] font-black uppercase tracking-wider" style={{ color: t.textDim }}>Orientación</span>
                         <select value={nomAspect} onChange={e=>setNomAspect(e.target.value)}
                            className="w-full rounded-xl p-2.5 text-[11px] outline-none cursor-pointer"
                            style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: `1px solid ${t.border}`, color: t.text }}>
                            <option value="H" style={{backgroundColor: '#141414'}}>Horizontal</option>
                            <option value="V" style={{backgroundColor: '#141414'}}>Vertical</option>
                         </select>
                      </div>
                   </div>

                   <div className="p-3 rounded-xl" style={{ border: `1px solid ${t.border}`, backgroundColor: 'rgba(255,255,255,0.01)' }}>
                      <p className="text-[6px] font-black uppercase tracking-wider mb-1" style={{ color: t.textDim }}>Nombre Generado:</p>
                      <p className="text-[9px] font-mono font-black break-all select-all text-white">{finalNamingResult}.mp4</p>
                   </div>

                   <button onClick={() => { navigator.clipboard.writeText(finalNamingResult + '.mp4'); alert('¡Copiado!'); }}
                      className="w-full py-3 text-[8px] font-black uppercase tracking-wider rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
                      style={{ backgroundColor: t.accent, color: '#000000', border: `1px solid ${t.border}` }}>
                      <Copy size={11}/> Copiar Nombre
                   </button>
                </div>
             </div>

             {/* PANEL 4: BITRATE & WEIGHT CALCULATOR */}
             <div className="p-5 rounded-2xl flex flex-col space-y-4" style={{ backgroundColor: t.bg, border: `1px solid ${t.border}` }}>
                <div className="flex items-center gap-3 pb-3" style={{ borderBottom: `1px solid ${t.border}` }}>
                   <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ border: `1px solid ${t.border}`, backgroundColor: 'rgba(255,255,255,0.02)' }}>
                      <CalcIcon size={15} color={t.accent} />
                   </div>
                   <div>
                      <h3 className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'white' }}>3. BITRATE & WEIGHT CALCULATOR</h3>
                      <p className="text-[7px] font-bold uppercase tracking-wider" style={{ color: t.textDim }}>Tamaño estimado de renderizado</p>
                   </div>
                </div>

                <div className="space-y-3.5">
                   <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-1">
                         <span className="text-[6px] font-black uppercase tracking-wider" style={{ color: t.textDim }}>Resolución</span>
                         <select value={calcRes} onChange={e=>setCalcRes(e.target.value)}
                            className="w-full rounded-xl p-2.5 text-[10px] outline-none cursor-pointer"
                            style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: `1px solid ${t.border}`, color: t.text }}>
                            <option value="1080p" style={{backgroundColor: '#141414'}}>1080p</option>
                            <option value="4K" style={{backgroundColor: '#141414'}}>4K UHD</option>
                         </select>
                      </div>
                      <div className="space-y-1">
                         <span className="text-[6px] font-black uppercase tracking-wider" style={{ color: t.textDim }}>FPS</span>
                         <select value={calcFps} onChange={e=>setCalcFps(parseInt(e.target.value))}
                            className="w-full rounded-xl p-2.5 text-[10px] outline-none cursor-pointer"
                            style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: `1px solid ${t.border}`, color: t.text }}>
                            <option value="24" style={{backgroundColor: '#141414'}}>24 fps</option>
                            <option value="30" style={{backgroundColor: '#141414'}}>30 fps</option>
                            <option value="60" style={{backgroundColor: '#141414'}}>60 fps</option>
                         </select>
                      </div>
                      <div className="space-y-1">
                         <span className="text-[6px] font-black uppercase tracking-wider" style={{ color: t.textDim }}>Minutos</span>
                         <input type="number" value={calcMin} onChange={e=>setCalcMin(parseInt(e.target.value) || 1)}
                            className="w-full rounded-xl p-2.5 text-[10px] outline-none shadow-inner"
                            style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: `1px solid ${t.border}`, color: t.text }} />
                      </div>
                   </div>

                   <div className="p-3 rounded-xl space-y-1.5" style={{ border: `1px solid ${t.border}`, backgroundColor: 'rgba(255,255,255,0.01)' }}>
                      <div className="flex justify-between items-center text-[8px] font-black uppercase tracking-wider">
                         <span style={{ color: t.textDim }}>Tamaño Estimado:</span>
                         <span className="text-[11px] font-bold" style={{ color: 'white', fontFamily: 'monospace' }}>{calcEstSizeGB} GB</span>
                      </div>
                      <div className="flex justify-between items-center text-[8px] font-black uppercase tracking-wider">
                         <span style={{ color: t.textDim }}>Bitrate Target:</span>
                         <span className="text-[11px] font-bold" style={{ color: t.accent, fontFamily: 'monospace' }}>{recommendedBitrateMbps} Mbps</span>
                      </div>
                   </div>
                   <div className="text-[6px] uppercase font-black tracking-wider text-center" style={{ color: t.textDim }}>Estándares recomendados para subida a web</div>
                </div>
             </div>

             {/* PANEL 5: TIMECODE CONVERTER */}
             <div className="p-5 rounded-2xl flex flex-col space-y-4" style={{ backgroundColor: t.bg, border: `1px solid ${t.border}` }}>
                <div className="flex items-center gap-3 pb-3" style={{ borderBottom: `1px solid ${t.border}` }}>
                   <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ border: `1px solid ${t.border}`, backgroundColor: 'rgba(255,255,255,0.02)' }}>
                      <Clock size={15} color={t.accent} />
                   </div>
                   <div>
                      <h3 className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'white' }}>4. TIMECODE CONVERTER</h3>
                      <p className="text-[7px] font-bold uppercase tracking-wider" style={{ color: t.textDim }}>Conversión exacta de fotogramas</p>
                   </div>
                </div>

                <div className="space-y-3.5">
                   <div className="space-y-1">
                      <span className="text-[6px] font-black uppercase tracking-wider" style={{ color: t.textDim }}>FPS de Referencia</span>
                      <select value={fpsVal} onChange={e=>{setFpsVal(parseInt(e.target.value)); handleTcToFrames(tcInput, parseInt(e.target.value)); handleFramesToTc(framesInput, parseInt(e.target.value));}}
                         className="w-full rounded-xl p-2.5 text-[10px] outline-none cursor-pointer"
                         style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: `1px solid ${t.border}`, color: t.text }}>
                         <option value="24" style={{backgroundColor: '#141414'}}>24 fps (Cine)</option>
                         <option value="25" style={{backgroundColor: '#141414'}}>25 fps (PAL)</option>
                         <option value="30" style={{backgroundColor: '#141414'}}>30 fps (NTSC)</option>
                         <option value="60" style={{backgroundColor: '#141414'}}>60 fps (Social)</option>
                      </select>
                   </div>

                   <div className="grid grid-cols-2 gap-3 p-3 rounded-xl" style={{ border: `1px solid ${t.border}`, backgroundColor: 'rgba(255,255,255,0.01)' }}>
                      <div className="space-y-1.5">
                         <span className="text-[6px] font-black uppercase" style={{ color: t.textDim }}>TC → Frames</span>
                         <input type="text" value={tcInput} onChange={e=>{setTcInput(e.target.value); handleTcToFrames(e.target.value, fpsVal);}}
                            className="w-full rounded-xl p-2 text-[10px] font-mono outline-none shadow-inner"
                            style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: `1px solid ${t.border}`, color: t.text }} />
                         <p className="text-[9px] font-mono font-bold" style={{ color: t.accent }}>{framesOutput} frames</p>
                      </div>
                      <div className="space-y-1.5">
                         <span className="text-[6px] font-black uppercase" style={{ color: t.textDim }}>Frames → TC</span>
                         <input type="number" value={framesInput} onChange={e=>{setFramesInput(parseInt(e.target.value) || 0); handleFramesToTc(parseInt(e.target.value) || 0, fpsVal);}}
                            className="w-full rounded-xl p-2 text-[10px] font-mono outline-none shadow-inner"
                            style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: `1px solid ${t.border}`, color: t.text }} />
                         <p className="text-[9px] font-mono font-bold" style={{ color: t.accent }}>{tcOutput}</p>
                      </div>
                   </div>
                </div>
             </div>

          </div>

          {/* COLUMNA 3: UTILIDADES & VISUAL */}
          <div className="flex flex-col space-y-5">
             
             {/* PANEL 6: CROP SAFE ZONES */}
             <div className="p-5 rounded-2xl flex flex-col space-y-4" style={{ backgroundColor: t.bg, border: `1px solid ${t.border}` }}>
                <div className="flex items-center gap-3 pb-3" style={{ borderBottom: `1px solid ${t.border}` }}>
                   <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ border: `1px solid ${t.border}`, backgroundColor: 'rgba(255,255,255,0.02)' }}>
                      <Highlighter size={15} color={t.accent} />
                   </div>
                   <div>
                      <h3 className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'white' }}>5. CROP SAFE ZONES</h3>
                      <p className="text-[7px] font-bold uppercase tracking-wider" style={{ color: t.textDim }}>Visualizador de guías de aspecto</p>
                   </div>
                </div>

                <div className="space-y-3.5">
                   <div className="flex justify-between items-center p-0.5 rounded-xl text-[7px] font-black uppercase tracking-wider"
                      style={{ border: `1px solid ${t.border}`, backgroundColor: 'rgba(255,255,255,0.01)' }}>
                      {['916', '11', '239'].map(mode => (
                         <button key={mode} onClick={() => setCropGuide(mode)}
                            className="flex-1 py-1.5 text-center rounded-md transition-all text-[8px]"
                            style={{
                               backgroundColor: cropGuide === mode ? t.accent : 'transparent',
                               color: cropGuide === mode ? '#000000' : t.textDim,
                            }}>
                            {mode === '916' ? 'TikTok (9:16)' : mode === '11' ? 'Instagram (1:1)' : 'Cine (2.39:1)'}
                         </button>
                      ))}
                   </div>

                   <div className="relative w-full aspect-video rounded-xl overflow-hidden flex items-center justify-center"
                      style={{ border: `1px solid ${t.border}`, backgroundColor: 'rgba(0,0,0,0.5)' }}>
                      <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, rgba(255,255,255,0.01), rgba(0,0,0,0.3))`, opacity: 0.8 }}></div>
                      <div className="absolute z-10 text-[7px] font-mono font-black" style={{ color: t.textDim }}>16:9 Canvas</div>
                      
                      {cropGuide === '916' && (
                         <div className="absolute top-0 bottom-0 aspect-[9/16] flex items-center justify-center animate-in fade-in zoom-in-95"
                            style={{ borderLeft: `1px dashed ${t.accent}aa`, borderRight: `1px dashed ${t.accent}aa`, backgroundColor: `${t.accent}05` }}>
                            <span className="text-[6px] font-mono font-black uppercase tracking-widest text-center px-2" style={{ color: t.accent }}>9:16 safe area</span>
                         </div>
                      )}
                      {cropGuide === '11' && (
                         <div className="absolute top-0 bottom-0 aspect-[1/1] flex items-center justify-center animate-in fade-in zoom-in-95"
                            style={{ borderLeft: `1px dashed ${t.accent}aa`, borderRight: `1px dashed ${t.accent}aa`, borderTop: `1px dashed ${t.accent}aa`, borderBottom: `1px dashed ${t.accent}aa`, backgroundColor: `${t.accent}05` }}>
                            <span className="text-[6px] font-mono font-black uppercase tracking-widest text-center px-2" style={{ color: t.accent }}>1:1 safe area</span>
                         </div>
                      )}
                      {cropGuide === '239' && (
                         <div className="absolute left-0 right-0 h-[70%] flex items-center justify-center animate-in fade-in zoom-in-95"
                            style={{ borderTop: `1px dashed ${t.accent}aa`, borderBottom: `1px dashed ${t.accent}aa`, backgroundColor: `${t.accent}05` }}>
                            <span className="text-[6px] font-mono font-black uppercase tracking-widest text-center" style={{ color: t.accent }}>2.39:1 safe area</span>
                         </div>
                      )}
                   </div>
                </div>
             </div>

             {/* PANEL 7: NOTAS DE CORTE */}
             <div className="p-5 rounded-2xl flex flex-col space-y-4" style={{ backgroundColor: t.bg, border: `1px solid ${t.border}` }}>
                <div className="flex items-center gap-3 pb-3" style={{ borderBottom: `1px solid ${t.border}` }}>
                   <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ border: `1px solid ${t.border}`, backgroundColor: 'rgba(255,255,255,0.02)' }}>
                      <Edit3 size={15} color={t.accent} />
                   </div>
                   <div>
                      <h3 className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'white' }}>6. NOTAS DE CORTE</h3>
                      <p className="text-[7px] font-bold uppercase tracking-wider" style={{ color: t.textDim }}>Marcas de tiempo exportables</p>
                   </div>
                </div>

                <div className="space-y-3">
                   <textarea value={editNotes} onChange={e=>setEditNotes(e.target.value)}
                      className="w-full rounded-xl p-3 text-[10px] font-mono outline-none h-[95px] resize-none mac-scrollbar shadow-inner"
                      style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: `1px solid ${t.border}`, color: t.text }} />

                   <button onClick={downloadNotes}
                      className="w-full py-2.5 text-[8px] font-black uppercase tracking-wider rounded-xl transition-all shadow-lg"
                      style={{ backgroundColor: t.accent, color: '#000000', border: `1px solid ${t.border}` }}>
                      Descargar Notas (TXT)
                   </button>
                </div>
             </div>

             {/* PANEL 8: COMPRESOR DE VIDEO */}
             <div className="p-5 rounded-2xl flex flex-col space-y-4" style={{ backgroundColor: t.bg, border: `1px solid ${t.border}` }}>
                <div className="flex items-center gap-3 pb-3" style={{ borderBottom: `1px solid ${t.border}` }}>
                   <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ border: `1px solid ${t.border}`, backgroundColor: 'rgba(255,255,255,0.02)' }}>
                      <Monitor size={15} color={t.accent} />
                   </div>
                   <div>
                      <h3 className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'white' }}>7. COMPRESOR DE VIDEO</h3>
                      <p className="text-[7px] font-bold uppercase tracking-wider" style={{ color: t.textDim }}>Compresión rápida de salida</p>
                   </div>
                </div>

                <div className="space-y-3">
                   <div className="space-y-1">
                      <p className="text-[7px] font-black uppercase tracking-wider" style={{ color: t.textDim }}>Preset de Salida</p>
                      <select value={compPreset} onChange={e=>setCompPreset(e.target.value)}
                         className="w-full rounded-xl p-2 text-[10px] outline-none cursor-pointer"
                         style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: `1px solid ${t.border}`, color: t.text }}>
                         <option value="tiktok" style={{backgroundColor: '#141414'}}>TikTok / Reels 1080p (45MB)</option>
                         <option value="preview" style={{backgroundColor: '#141414'}}>Client Preview 720p (22MB)</option>
                         <option value="archival" style={{backgroundColor: '#141414'}}>Cinema 4K Archival (850MB)</option>
                      </select>
                   </div>

                   <div className="p-4 flex flex-col items-center justify-center text-center space-y-1.5 rounded-xl"
                      style={{ border: `1px dashed ${t.border}`, backgroundColor: 'rgba(255,255,255,0.01)' }}>
                      <Upload size={16} color={t.textDim}/>
                      <p className="text-[8px] font-bold uppercase tracking-wider" style={{ color: t.textMuted }}>Arrastra tu archivo RAW</p>
                      <p className="text-[6px] font-black uppercase" style={{ color: t.textDim }}>.mp4, .mov, .mkv</p>
                   </div>

                   {isCompressing && (
                      <div className="space-y-1">
                         <div className="flex justify-between text-[7px] font-black uppercase tracking-wider" style={{ color: t.textDim }}>
                            <span>Procesando...</span>
                            <span>{compProgress}%</span>
                         </div>
                         <div className="w-full rounded-xl h-1 overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.04)' }}>
                            <div className="h-full transition-all duration-200" style={{ width: `${compProgress}%`, backgroundColor: t.accent }}></div>
                         </div>
                      </div>
                   )}

                   {compSuccess && (
                      <p className="text-[7px] font-black uppercase text-center tracking-widest flex items-center justify-center gap-1" style={{ color: t.accent }}>
                         <Check size={8}/> ¡Compresión finalizada!
                      </p>
                   )}

                   <button onClick={runCompression} disabled={isCompressing}
                      className="w-full py-2.5 text-[8px] font-black uppercase tracking-wider rounded-xl transition-all shadow-lg"
                      style={{
                         backgroundColor: isCompressing ? 'transparent' : t.accent,
                         color: isCompressing ? t.textDim : '#000000',
                         border: `1px solid ${t.border}`,
                      }}>
                      {isCompressing ? 'Comprimiendo...' : 'Iniciar Compresión'}
                   </button>
                </div>
             </div>

             {/* PANEL 9: SYSTEM STORAGE & UTILS */}
             <div className="p-5 rounded-2xl flex flex-col space-y-4" style={{ backgroundColor: t.bg, border: `1px solid ${t.border}` }}>
                <div className="flex items-center gap-3 pb-3" style={{ borderBottom: `1px solid ${t.border}` }}>
                   <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ border: `1px solid ${t.border}`, backgroundColor: 'rgba(255,255,255,0.02)' }}>
                      <Wrench size={15} color={t.accent} />
                   </div>
                   <div>
                      <h3 className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'white' }}>8. ARCHIVOS & CACHÉ DEL SISTEMA</h3>
                      <p className="text-[7px] font-bold uppercase tracking-wider" style={{ color: t.textDim }}>Limpieza local y empaquetado</p>
                   </div>
                </div>

                <div className="space-y-4">
                   <div className="space-y-2">
                      <p className="text-[7px] font-black uppercase tracking-wider" style={{ color: t.textDim }}>Empaquetar en ZIP</p>
                      {isZipping && (
                         <div className="space-y-1">
                            <div className="flex justify-between text-[7px] font-black uppercase tracking-wider" style={{ color: t.textDim }}>
                               <span>Comprimiendo...</span>
                               <span>{zipProgress}%</span>
                            </div>
                            <div className="w-full rounded-xl h-1 overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.04)' }}>
                               <div className="h-full transition-all duration-200" style={{ width: `${zipProgress}%`, backgroundColor: t.accent }}></div>
                            </div>
                         </div>
                      )}
                      {zipSuccess && (
                         <p className="text-[7px] font-black uppercase text-center tracking-widest flex items-center justify-center gap-1" style={{ color: t.accent }}>
                            <Check size={8}/> ¡ZIP Generado!
                         </p>
                      )}
                      <button onClick={runZip} disabled={isZipping}
                         className="w-full py-2.5 text-[8px] font-black uppercase tracking-wider rounded-xl transition-all shadow-lg"
                         style={{
                            backgroundColor: isZipping ? 'transparent' : 'rgba(255,255,255,0.02)',
                            color: isZipping ? t.textDim : '#ffffff',
                            border: `1px solid ${t.border}`,
                         }}>
                         {isZipping ? 'Archivando...' : 'Comprimir en ZIP'}
                      </button>
                   </div>

                   <div className="space-y-2 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.03)' }}>
                      <div className="flex justify-between items-center">
                         <div>
                            <p className="text-[7px] font-black uppercase tracking-wider" style={{ color: t.textDim }}>Caché de Adobe</p>
                            <p className="text-sm font-black font-mono" style={{ color: 'white' }}>{ssdCacheSize.toFixed(1)} GB</p>
                         </div>
                         <button onClick={cleanSsdCache} disabled={isCleaningCache || ssdCacheSize === 0}
                            className="px-4 py-2 text-[8px] font-black uppercase tracking-wider rounded-xl transition-all shadow-lg"
                            style={{
                               backgroundColor: isCleaningCache || ssdCacheSize === 0 ? 'transparent' : t.accent,
                               color: isCleaningCache || ssdCacheSize === 0 ? t.textDim : '#000000',
                               border: `1px solid ${t.border}`,
                            }}>
                            {isCleaningCache ? 'Purgando...' : 'Purgar'}
                         </button>
                      </div>
                      {cacheSuccess && (
                         <p className="text-[7px] font-black uppercase text-center tracking-widest flex items-center justify-center gap-1" style={{ color: t.accent }}>
                            <Check size={8}/> ¡Caché purgado!
                         </p>
                      )}
                   </div>

                   <div className="space-y-2 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.03)' }}>
                      <p className="text-[7px] font-black uppercase tracking-wider" style={{ color: t.textDim }}>Atajos & Módulos Rápidos</p>
                      <div className="relative">
                         <input type="text" value={shortcutQuery} onChange={e=>setShortcutQuery(e.target.value)} placeholder="Buscar atajo..."
                            className="w-full rounded-xl p-2 pl-7 text-[10px] outline-none shadow-inner"
                            style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: `1px solid ${t.border}`, color: t.text }} />
                         <Search size={10} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: t.textDim }} />
                      </div>
                      <div className="space-y-1 max-h-[90px] overflow-y-auto mac-scrollbar pr-1">
                         {filteredShortcuts.map((s, idx) => (
                            <div key={idx} className="flex items-center justify-between text-[8px] p-2 rounded-lg"
                              style={{ border: `1px solid ${t.border}`, backgroundColor: 'rgba(255,255,255,0.01)' }}>
                              <span className="font-bold truncate text-white" style={{ maxWidth: '70%' }}>{s.desc}</span>
                              <span className="font-mono text-[7px] px-1 py-0.2 rounded border border-white/5" style={{ color: t.accent }}>{s.key}</span>
                            </div>
                         ))}
                      </div>
                   </div>
                </div>
             </div>

          </div>
       </div>
    </div>
  );
};


export default EditorVideo;
