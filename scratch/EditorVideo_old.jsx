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
  Crown, Grid, LayoutGrid, Star, Gift, Shield, Building2, Eye, EyeOff, Cpu, Wrench,
  ChevronDown
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

  // Modern minimalism theme variables aligned with #141414
  const backgroundStyle = { backgroundColor: '#141414', minHeight: '100vh' };

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden font-sans"
      style={{ backgroundColor: '#141414', color: t.text }}>
      
      {/* HEADER NAV */}
      <nav className="h-16 flex items-center justify-between px-6 relative z-50"
        style={{ backgroundColor: '#141414', borderBottom: `1px solid ${t.border}` }}>
         <div className="flex items-center gap-8">
            <div>
               <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', margin: 0 }}>Editor de Video</h2>
               <p style={{ fontSize: '0.7rem', color: t.textDim, marginTop: '2px', fontWeight: 500 }}>Control de Producción & Hub de Negocios</p>
            </div>
            <div className="flex rounded-xl p-0.5" style={{ backgroundColor: 'transparent', border: `1px solid ${t.border}` }}>
                <button onClick={() => setViewState('client-list')} className="px-5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all"
                  style={{
                    backgroundColor: viewState.includes('client') || viewState === 'session' ? '#141414' : 'transparent',
                    border: viewState.includes('client') || viewState === 'session' ? `1px solid ${t.accent}` : '1px solid transparent',
                    color: viewState.includes('client') || viewState === 'session' ? t.accent : t.textDim,
                  }}>Clientes</button>
                <button onClick={() => setViewState('agency-hub')} className="px-5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all"
                  style={{
                    backgroundColor: viewState.includes('agency') ? '#141414' : 'transparent',
                    border: viewState.includes('agency') ? `1px solid ${t.accent}` : '1px solid transparent',
                    color: viewState.includes('agency') ? t.accent : t.textDim,
                  }}>Agencia Pro</button>
                <button onClick={() => setViewState('project-engine')} className="px-5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all"
                  style={{
                    backgroundColor: viewState === 'project-engine' ? '#141414' : 'transparent',
                    border: viewState === 'project-engine' ? `1px solid ${t.accent}` : '1px solid transparent',
                    color: viewState === 'project-engine' ? t.accent : t.textDim,
                  }}>Edición de Video</button>
            </div>
         </div>
         <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl" style={{ backgroundColor: 'transparent', border: `1px solid ${t.border}` }}>
               <div className="w-1.5 h-1.5 rounded-xl animate-pulse" style={{ backgroundColor: t.accent }}></div>
               <span className="text-[8px] font-black uppercase tracking-widest" style={{ color: t.accent }}>System Online</span>
            </div>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center overflow-hidden" style={{ backgroundColor: '#141414', border: `1px solid ${t.border}` }}>
              <UserIcon size={16} color={t.textDim}/>
            </div>
         </div>
       </nav>

       {/* CLIENTS LIST */}
       {viewState === 'client-list' && (
        <div className="flex flex-col flex-1 min-h-0 p-6 space-y-6 max-w-[1400px] mx-auto w-full animate-in fade-in duration-500 overflow-y-auto mac-scrollbar">
            {/* Minimal KPI Board */}
            <div className="grid grid-cols-4 gap-3">
               {[
                 { label: 'Capacidad Operativa', val: '98.4%', icon: Activity },
                 { label: 'Proyectos en Render', val: uniqueClients.length, icon: Video },
                 { label: 'Latencia de Sistema', val: '0.4ms', icon: Cpu },
                 { label: 'Base de Clientes', val: uniqueClients.length, icon: Users }
               ].map((s, i) => (
                 <div key={i} className="flex items-center justify-between p-4"
                   style={{ backgroundColor: '#141414', border: `1px solid ${t.border}`, borderRadius: 12 }}>
                    <div>
                       <p className="text-[8px] font-black uppercase tracking-widest mb-1" style={{ color: t.textDim }}>{s.label}</p>
                       <p className="text-xl font-bold" style={{ color: 'white' }}>{s.val}</p>
                    </div>
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ border: `1px solid ${t.border}`, color: t.accent }}>
                      <s.icon size={16} />
                    </div>
                 </div>
               ))}
            </div>

            <header className="flex justify-between items-end pt-4">
               <div>
                  <h2 className="text-base font-black uppercase tracking-wider text-white">Directorio de Nexus Clientes</h2>
               </div>
               <div className="flex gap-3">
                  <div className="relative">
                     <input type="text" value={clientSearch} onChange={e=>setClientSearch(e.target.value)} placeholder="FILTRAR..."
                       className="rounded-lg py-2.5 pl-4 pr-5 text-[9px] font-black uppercase tracking-widest outline-none w-56 transition-all"
                       style={{ backgroundColor: '#141414', border: `1px solid ${t.border}`, color: t.text }} />
                  </div>
                  <button onClick={() => setIsClientModalOpen(true)} className="px-5 py-2.5 rounded-lg font-black text-[9px] uppercase tracking-widest flex items-center gap-2 transition-all"
                    style={{ backgroundColor: '#141414', border: `1px solid ${t.accent}`, color: t.accent }}>
                     <Plus size={14} strokeWidth={2}/> Añadir Registro
                  </button>
               </div>
            </header>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 pt-2">
               {uniqueClients.map(cl => (
                 <div key={cl.id} onClick={() => openClientProfile(cl)} className="p-5 flex flex-col items-center justify-center group relative overflow-hidden aspect-square cursor-pointer transition-all"
                   style={{ backgroundColor: '#141414', border: `1px solid ${t.border}`, borderRadius: 12 }}>
                    
                    <div className="w-16 h-16 rounded-full flex items-center justify-center overflow-hidden mb-4" style={{ border: `1px solid ${t.border}` }}>
                       {cl.foto_url ? (
                         <img src={cl.foto_url} alt={cl.nombre} className="w-full h-full object-cover" />
                       ) : (
                         <span className="text-xl font-bold" style={{ color: t.textDim }}>{cl.nombre.charAt(0)}</span>
                       )}
                    </div>

                    <p className="text-xs font-black uppercase tracking-wider truncate w-full text-center mb-1 text-white">{cl.nombre}</p>
                    <p className="text-[7px] font-bold uppercase tracking-widest mb-3" style={{ color: t.textDim }}>{cl.empresa || 'Independiente'}</p>
                    
                    <div className="flex flex-col items-center gap-0.5 mb-2">
                       <span className="text-[7px] font-bold uppercase tracking-wider" style={{ color: t.textMuted }}>{cl.nacionalidad || 'Global'}</span>
                       <span className="text-[7px] font-mono" style={{ color: t.textDim }}>{cl.telefono || 'Sin Teléfono'}</span>
                    </div>

                    <div className="mt-2 w-full pt-3 flex items-center justify-between opacity-50 group-hover:opacity-100 transition-all" style={{ borderTop: `1px solid ${t.border}` }}>
                       <span className="text-[7px] font-black uppercase tracking-widest" style={{ color: t.accent }}>Enlace</span>
                       <ChevronRight size={10} color={t.accent}/>
                    </div>
                 </div>
               ))}
            </div>
        </div>
       )}

       {/* CLIENT PROFILE */}
       {viewState === 'client-profile' && activeClient && (
        <div className="flex flex-col flex-1 min-h-0 p-6 space-y-6 max-w-[1200px] mx-auto w-full animate-in slide-in-from-right duration-400 overflow-y-auto mac-scrollbar">
           <header className="flex items-center justify-between">
             <div className="flex items-center gap-4">
               <button onClick={() => setViewState('client-list')} className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                 style={{ backgroundColor: '#141414', border: `1px solid ${t.border}` }}>
                 <ArrowLeft size={16} color={t.textDim}/>
               </button>
               <div>
                 <h3 className="text-base font-black uppercase tracking-wider text-white">{activeClient.nombre}</h3>
                 <p className="text-[8px] font-bold uppercase tracking-widest" style={{ color: t.textDim }}>{activeClient.empresa || 'Independent Production'}</p>
               </div>
             </div>
             <button onClick={createMeeting} className="px-5 py-2.5 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-2 transition-all"
               style={{ backgroundColor: '#141414', border: `1px solid ${t.accent}`, color: t.accent }}>
               <Video size={14}/> Iniciar Sesión
             </button>
           </header>

           <div className="space-y-3 pt-2">
             {filteredMeetings.map(m => (
               <div key={m.id} onClick={() => openMeeting(m)} className="flex items-center justify-between p-4 cursor-pointer transition-all"
                 style={{ backgroundColor: '#141414', border: `1px solid ${t.border}`, borderRadius: 12 }}>
                 <div className="flex items-center gap-4">
                   <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ border: `1px solid ${t.border}` }}>
                     <FileVideo size={18} color={t.accent}/>
                   </div>
                   <div>
                     <h4 className="text-sm font-black uppercase tracking-wider text-white">{m.session_title}</h4>
                     <p className="text-[8px] font-mono text-neutral-400">{m.fecha}</p>
                   </div>
                 </div>
                 <div className="text-right">
                   <p className="text-[7px] font-bold uppercase mb-0.5" style={{ color: t.textDim }}>Tiempo Registrado</p>
                   <p className="text-sm font-bold font-mono text-white">{formatTime(m.total_time)}</p>
                 </div>
               </div>
             ))}
             {filteredMeetings.length === 0 && (
               <div className="text-center py-10 rounded-lg" style={{ backgroundColor: '#141414', border: `1px dashed ${t.border}` }}>
                 <p className="text-[8px] font-black uppercase tracking-widest" style={{ color: t.textDim }}>Sin sesiones registradas. Comienza un nuevo flujo.</p>
               </div>
             )}
           </div>
        </div>
       )}

       {/* AGENCY HUB */}
       {viewState === 'agency-hub' && (
        <div className="flex flex-col flex-1 min-h-0 p-6 space-y-6 max-w-[1400px] mx-auto w-full animate-in fade-in duration-500 overflow-y-auto mac-scrollbar">
            {/* Agency KPIs */}
            <div className="grid grid-cols-4 gap-3">
               {[
                 { label: 'Campañas Activas', val: agencyClients.length, icon: Target },
                 { label: 'Conversión Mensual', val: '24%', icon: TrendingUp },
                 { label: 'Nivel NPS', val: '9.8', icon: Star },
                 { label: 'Marcas Aliadas', val: agencyClients.length, icon: Building2 }
               ].map((s, i) => (
                 <div key={i} className="flex items-center justify-between p-4"
                   style={{ backgroundColor: '#141414', border: `1px solid ${t.border}`, borderRadius: 12 }}>
                    <div>
                       <p className="text-[8px] font-black uppercase tracking-widest mb-1" style={{ color: t.textDim }}>{s.label}</p>
                       <p className="text-xl font-bold" style={{ color: 'white' }}>{s.val}</p>
                    </div>
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ border: `1px solid ${t.border}`, color: t.accent }}>
                      <s.icon size={16} />
                    </div>
                 </div>
               ))}
            </div>

            <header className="flex justify-between items-end pt-4">
               <div>
                  <h2 className="text-base font-black uppercase tracking-wider text-white">Agency Pro Planificador</h2>
               </div>
               <button onClick={() => setIsCompanyModalOpen(true)} className="px-5 py-2.5 rounded-lg font-black text-[9px] uppercase tracking-widest transition-all flex items-center gap-2"
                 style={{ backgroundColor: '#141414', border: `1px solid ${t.accent}`, color: t.accent }}>
                 <Plus size={14} strokeWidth={2}/> Nueva Marca
               </button>
            </header>

            {/* Filter buttons styled minimal */}
            <div className="grid grid-cols-4 gap-2 p-1 rounded-xl" style={{ backgroundColor: '#141414', border: `1px solid ${t.border}` }}>
               {['Básico', 'Intermedio', 'Avanzado', 'Personalizado'].map(p => {
                 const count = agencyClients.filter(cl => cl.plan === p).length;
                 return (
                   <button key={p} onClick={() => setActiveAgencyPlan(p)} className="p-3 rounded-lg transition-all flex flex-col items-center gap-1"
                     style={{
                       backgroundColor: activeAgencyPlan === p ? '#141414' : 'transparent',
                       border: activeAgencyPlan === p ? `1px solid ${t.accent}` : '1px solid transparent',
                       color: activeAgencyPlan === p ? t.accent : t.textDim,
                     }}>
                     <h4 className="text-[8px] font-black uppercase tracking-widest">{p}</h4>
                     <p className="text-base font-bold">{count}</p>
                   </button>
                 );
               })}
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-[9px] font-black uppercase tracking-widest flex items-center gap-2 text-white">
                  <div className="w-1 h-1 rounded-full" style={{ backgroundColor: t.accent }}></div>
                  Tablero de Proyectos Estratégicos
                </h3>
              </div>

              <div className="p-4 rounded-xl overflow-x-auto mac-scrollbar" style={{ backgroundColor: '#141414', border: `1px solid ${t.border}` }}>
                <div className="min-w-[900px] space-y-3">
                  {filteredAgencyClients.map((company, idx) => {
                    const meta = company.metadata || {};
                    const metrics = meta.metrics || { loyalty: 'Normal', payment: 'A tiempo', growth: 'Estable' };
                    const isPremium = metrics.loyalty === 'VIP' || metrics.growth === 'Top Tier';
                    
                    return (
                      <div key={company.id} onClick={() => { setSelectedCompany(company); fetchStrategies(company.id); setViewState('agency-session'); }} className="flex items-center gap-6 p-4 rounded-lg cursor-pointer relative overflow-hidden transition-all"
                        style={{ backgroundColor: '#141414', border: `1px solid ${t.border}` }}>
                        {isPremium && <div className="absolute top-1 right-1"><Crown size={10} color={t.accent}/></div>}
                        
                        <div className="w-24 shrink-0">
                          <h4 className="text-xs font-black uppercase truncate text-white">{company.nombre_empresa}</h4>
                          <p className="text-[7px] font-bold uppercase" style={{ color: t.textDim }}>{company.dueño}</p>
                        </div>

                        <div className="flex-1 flex items-center gap-3">
                          <div className="flex-1 h-1.5 rounded-full overflow-hidden relative" style={{ backgroundColor: '#141414', border: `1px solid ${t.border}` }}>
                            <div className="absolute inset-y-0 left-0 rounded-full transition-all duration-1000" style={{ width: `${30 + (idx * 15) % 70}%`, backgroundColor: t.accent }}></div>
                          </div>
                          <span className="text-[8px] font-mono text-neutral-400">{30 + (idx * 15) % 70}%</span>
                        </div>

                        <div className="flex items-center gap-4 shrink-0">
                           <div className="flex gap-1">
                             {['instagram', 'tiktok', 'facebook', 'youtube'].map(red => (
                               <div key={red} className="w-6 h-6 rounded-md flex items-center justify-center"
                                 style={{
                                   border: meta.redes?.[red] ? `1px solid ${t.accent}aa` : `1px solid ${t.border}`,
                                   backgroundColor: '#141414',
                                   color: meta.redes?.[red] ? t.accent : t.textDim,
                                 }}>
                                 {red === 'instagram' && <Instagram size={10}/>}
                                 {red === 'tiktok' && <TiktokIcon size={10}/>}
                                 {red === 'facebook' && <Facebook size={10}/>}
                                 {red === 'youtube' && <Youtube size={10}/>}
                               </div>
                             ))}
                           </div>
                           <div className="px-2.5 py-1 rounded-md" style={{ border: `1px solid ${t.border}` }}>
                             <p className="text-[6px] font-bold uppercase mb-0.5" style={{ color: t.textDim }}>Pago</p>
                             <p className="text-[7px] font-black uppercase" style={{ color: metrics.payment === 'A tiempo' ? t.accent : t.textDim }}>{metrics.payment}</p>
                           </div>
                        </div>
                      </div>
                    );
                  })}
                  {filteredAgencyClients.length === 0 && (
                    <div className="py-10 text-center rounded-lg animate-fade-in" style={{ border: `1px dashed ${t.border}`, backgroundColor: '#141414' }}>
                      <p className="text-[8px] font-black uppercase tracking-widest" style={{ color: t.textDim }}>No se encontraron marcas en esta categoría</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
        </div>
       )}

       {/* AGENCY SESSION HUB */}
       {viewState === 'agency-session' && selectedCompany && (
        <div className="flex flex-col flex-1 min-h-0 p-6 space-y-6 max-w-[1200px] mx-auto w-full animate-in slide-in-from-right duration-400 overflow-y-auto mac-scrollbar">
           <header className="flex items-center justify-between">
             <div className="flex items-center gap-4">
               <button onClick={() => setViewState('agency-hub')} className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                 style={{ backgroundColor: '#141414', border: `1px solid ${t.border}` }}>
                 <ArrowLeft size={16} color={t.textDim}/>
               </button>
               <div>
                 <h3 className="text-base font-black uppercase tracking-wider text-white">{selectedCompany.nombre_empresa}</h3>
                 <p className="text-[8px] font-bold uppercase tracking-widest" style={{ color: t.accent }}>{selectedCompany.plan}</p>
               </div>
             </div>
             <button onClick={createStrategy} className="px-5 py-2.5 rounded-lg font-black text-[9px] uppercase tracking-widest flex items-center gap-2 transition-all"
               style={{ backgroundColor: '#141414', border: `1px solid ${t.accent}`, color: t.accent }}>
               <Sparkles size={14}/> Crear Estrategia
             </button>
           </header>
           <div className="space-y-3 pt-2">
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
                 className="flex items-center justify-between p-4 cursor-pointer transition-all"
                 style={{ backgroundColor: '#141414', border: `1px solid ${t.border}`, borderRadius: 12 }}>
                 <div className="flex items-center gap-4">
                   <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ border: `1px solid ${t.border}` }}>
                     <Target size={18} color={t.accent}/>
                   </div>
                   <h4 className="text-sm font-black uppercase tracking-wider text-white">{s.titulo_estrategia}</h4>
                 </div>
                 <ChevronRight size={16} color={t.textDim}/>
               </div>
             ))}
             {strategies.length === 0 && (
               <div className="text-center py-10 rounded-lg" style={{ backgroundColor: '#141414', border: `1px dashed ${t.border}` }}>
                 <p className="text-[8px] font-black uppercase tracking-widest" style={{ color: t.textDim }}>Sin estrategias planeadas para esta marca.</p>
               </div>
             )}
           </div>
        </div>
       )}

       {/* AGENCY STRATEGY EDITOR */}
       {viewState === 'agency-editor' && activeStrategy && (
        <div className="flex flex-col h-full overflow-hidden animate-in fade-in duration-400">
          <header className="px-4 py-3 flex items-center justify-between" style={{ backgroundColor: '#141414', borderBottom: `1px solid ${t.border}` }}>
            <div className="flex items-center gap-3">
              <button onClick={saveStrategy} className="w-8 h-8 rounded-lg flex items-center justify-center transition-all" style={{ backgroundColor: '#141414', border: `1px solid ${t.border}` }}>
                <ArrowLeft size={16} color={t.textDim}/>
              </button>
              <div>
                <h3 className="text-xs font-black uppercase text-white">{activeStrategy.titulo_estrategia}</h3>
                <p className="text-[7px] font-black uppercase tracking-widest text-neutral-400">{selectedCompany?.nombre_empresa}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1 rounded-lg text-sm font-mono font-bold" style={{ backgroundColor: '#141414', border: `1px solid ${t.border}`, color: 'white' }}>
                {formatTime(time)}
                <button onClick={() => setIsTimerRunning(!isTimerRunning)} className="w-6 h-6 rounded flex items-center justify-center" style={{ backgroundColor: '#141414', border: `1px solid ${t.accent}`, color: t.accent }}>
                  {isTimerRunning ? <Pause size={10}/> : <Play size={10}/>}
                </button>
                <button onClick={() => { setTime(0); setIsTimerRunning(false); }} className="w-6 h-6 rounded flex items-center justify-center" style={{ border: `1px solid ${t.border}` }}>
                  <RotateCcw size={10} color={t.textDim}/>
                </button>
              </div>
              <button onClick={saveStrategy} className="px-4 py-2 text-[9px] font-black rounded-lg uppercase tracking-wider flex items-center gap-1.5 transition-all"
                style={{ backgroundColor: '#141414', border: `1px solid ${t.accent}`, color: t.accent }}>
                <Save size={12}/> Guardar
              </button>
            </div>
          </header>
          <div className="flex-1 flex p-3 gap-3 overflow-hidden max-w-[1600px] mx-auto w-full">
            <div className="flex-1 rounded-lg overflow-hidden flex flex-col" style={{ backgroundColor: '#141414', border: `1px solid ${t.border}` }}>
              <div className="px-3 py-2 flex items-center gap-1 flex-wrap" style={{ borderBottom: `1px solid ${t.border}`, backgroundColor: '#141414' }}>
                <button onMouseDown={e => { e.preventDefault(); document.execCommand('formatBlock', false, 'h1'); }} className="px-2 py-1 text-[8px] font-black" style={{ color: t.textDim }}>H1</button>
                <button onMouseDown={e => { e.preventDefault(); document.execCommand('formatBlock', false, 'h2'); }} className="px-2 py-1 text-[8px] font-black" style={{ color: t.textDim }}>H2</button>
                <div className="w-px h-4 mx-1" style={{ backgroundColor: t.border }}/>
                <button onMouseDown={e => { e.preventDefault(); document.execCommand('bold', false, null); }} className="p-1 hover:opacity-80" style={{ color: t.textDim }}><Bold size={12}/></button>
                <button onMouseDown={e => { e.preventDefault(); document.execCommand('italic', false, null); }} className="p-1 hover:opacity-80" style={{ color: t.textDim }}><Italic size={12}/></button>
                <button onMouseDown={e => { e.preventDefault(); document.execCommand('underline', false, null); }} className="px-1.5 py-0.5 text-xs font-black" style={{ color: t.textDim, textDecoration: 'underline' }}>U</button>
                <div className="w-px h-4 mx-1" style={{ backgroundColor: t.border }}/>
                <button onMouseDown={e => { e.preventDefault(); document.execCommand('insertUnorderedList', false, null); }} className="p-1 hover:opacity-80" style={{ color: t.textDim }}><List size={12}/></button>
                <button onMouseDown={e => { e.preventDefault(); document.execCommand('insertHTML', false, '<table style="border-collapse:collapse;width:100%;margin:8px 0"><tr><td style="border:1px solid #444;padding:8px;color:inherit">Celda</td><td style="border:1px solid #444;padding:8px;color:inherit">Celda</td></tr></table><p></p>'); }} className="p-1 hover:opacity-80" style={{ color: t.textDim }}><Table2 size={12}/></button>
              </div>
              <div ref={editorRef} contentEditable="true" suppressContentEditableWarning={true}
                className="flex-1 p-5 text-sm leading-relaxed outline-none mac-scrollbar overflow-y-auto"
                style={{ color: t.text }}
                dangerouslySetInnerHTML={{ __html: activeStrategy.contenido }} />
            </div>
            <div className="w-[280px] flex flex-col gap-3 overflow-y-auto mac-scrollbar">
              <div className="grid grid-cols-2 p-0.5 rounded-lg" style={{ backgroundColor: '#141414', border: `1px solid ${t.border}` }}>
                {[{ id: 'calc', label: 'Calculadora', icon: CalcIcon }, { id: 'info', label: 'Estrategia', icon: Target }].map(tab => (
                  <button key={tab.id} onClick={() => setAgencySideTab(tab.id)}
                    className="py-1.5 rounded text-[8px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all"
                    style={{ backgroundColor: agencySideTab === tab.id ? '#141414' : 'transparent', border: agencySideTab === tab.id ? `1px solid ${t.accent}` : '1px solid transparent', color: agencySideTab === tab.id ? t.accent : t.textDim }}>
                    <tab.icon size={10}/> {tab.label}
                  </button>
                ))}
              </div>
              {agencySideTab === 'calc' && (
                <div className="flex flex-col gap-3">
                  <div className="grid grid-cols-4 p-0.5 rounded-lg gap-1" style={{ backgroundColor: '#141414', border: `1px solid ${t.border}` }}>
                    {['BOB', 'USD', 'EUR', 'BRL'].map(cur => (
                      <button key={cur} onClick={() => setAgencySessionCurrency(cur)}
                        className="py-1 rounded text-[7px] font-black"
                        style={{ backgroundColor: agencySessionCurrency === cur ? '#141414' : 'transparent', border: agencySessionCurrency === cur ? `1px solid ${t.accent}` : '1px solid transparent', color: agencySessionCurrency === cur ? t.accent : t.textDim }}>
                        {cur}
                      </button>
                    ))}
                  </div>
                  <div className="p-3 rounded-lg text-right" style={{ backgroundColor: '#141414', border: `1px solid ${t.border}`, color: 'white' }}>
                    <p className="text-[7px] font-black uppercase tracking-wider mb-0.5" style={{ color: t.accent }}>{agencySessionCurrency}</p>
                    <p className="text-base font-mono font-bold">{calcDisplay}</p>
                  </div>
                  <div className="grid grid-cols-4 gap-1">
                    {['C','DEL','%','/','7','8','9','*','4','5','6','-','1','2','3','+','0','.','='].map(btn => (
                      <button key={btn} onClick={() => btn === '=' ? handleCalc('=') : handleCalc(btn)} className="h-8 rounded text-[8px] font-black transition-all"
                        style={{ backgroundColor: '#141414', border: `1px solid ${btn === '=' ? t.accent : t.border}`, color: btn === '=' ? t.accent : t.textDim }}>
                        {btn}
                      </button>
                    ))}
                  </div>
                  <button onClick={() => { setAgencySessionPrice(calcDisplay !== '0' ? calcDisplay : agencySessionPrice); setAgencySideTab('info'); }}
                    className="w-full py-2 rounded-lg text-[8px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5"
                    style={{ backgroundColor: '#141414', border: `1px solid ${t.border}`, color: t.textMuted }}>
                    <DollarSign size={10}/> Fijar Presupuesto
                  </button>
                </div>
              )}
              {agencySideTab === 'info' && (
                <div className="flex flex-col gap-3">
                  <div className="p-3 rounded-lg space-y-2.5" style={{ backgroundColor: '#141414', border: `1px solid ${t.border}` }}>
                    <p className="text-[7px] font-black uppercase tracking-widest" style={{ color: t.accent }}>📅 Reunión Planificada</p>
                    <div>
                      <p className="text-[7px] font-bold uppercase ml-0.5 mb-1" style={{ color: t.textDim }}>Siguiente Sesión</p>
                      <input type="date" value={agencyNextDate} onChange={e => setAgencyNextDate(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded text-[10px] outline-none"
                        style={{ backgroundColor: '#141414', border: `1px solid ${t.border}`, color: t.text }} />
                    </div>
                  </div>
                  <div className="p-3 rounded-lg space-y-2.5" style={{ backgroundColor: '#141414', border: `1px solid ${t.border}` }}>
                    <p className="text-[7px] font-black uppercase tracking-widest" style={{ color: t.accent }}>🔗 Enlaces Nexus</p>
                    <div>
                      <p className="text-[7px] font-bold uppercase ml-0.5 mb-1" style={{ color: t.textDim }}>Link de Llamada</p>
                      <input type="url" value={agencyMeetLink} onChange={e => setAgencyMeetLink(e.target.value)} placeholder="meet.google.com/..."
                        className="w-full px-2.5 py-1.5 rounded text-[10px] outline-none"
                        style={{ backgroundColor: '#141414', border: `1px solid ${t.border}`, color: t.text }} />
                    </div>
                    <div>
                      <p className="text-[7px] font-bold uppercase ml-0.5 mb-1" style={{ color: t.textDim }}>Carpeta de Contenidos</p>
                      <input type="url" value={agencyDriveLink} onChange={e => setAgencyDriveLink(e.target.value)} placeholder="drive.google.com/..."
                        className="w-full px-2.5 py-1.5 rounded text-[10px] outline-none"
                        style={{ backgroundColor: '#141414', border: `1px solid ${t.border}`, color: t.text }} />
                    </div>
                  </div>
                  <div className="p-3 rounded-lg space-y-2.5" style={{ backgroundColor: '#141414', border: `1px solid ${t.border}` }}>
                    <p className="text-[7px] font-black uppercase tracking-widest" style={{ color: t.accent }}>💰 Ingreso Estimado</p>
                    <div className="flex gap-2 items-center">
                      <span className="text-[9px] font-bold text-neutral-400">{agencySessionCurrency}</span>
                      <input type="number" value={agencySessionPrice} onChange={e => setAgencySessionPrice(e.target.value)}
                        placeholder="0.00" className="flex-1 px-2.5 py-1.5 rounded text-[10px] font-mono outline-none"
                        style={{ backgroundColor: '#141414', border: `1px solid ${t.border}`, color: t.text }} />
                    </div>
                    <button onClick={() => registerSessionIncome(selectedCompany?.nombre_empresa || 'Empresa', activeStrategy.titulo_estrategia, agencySessionPrice, agencySessionCurrency, true)}
                      disabled={!agencySessionPrice || parseFloat(agencySessionPrice) <= 0 || agencyPriceRegistered}
                      className="w-full py-2 rounded-lg text-[8px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5"
                      style={{ 
                        backgroundColor: '#141414',
                        border: `1px solid ${agencyPriceRegistered ? t.border : t.accent}`,
                        color: agencyPriceRegistered ? t.textDim : t.accent,
                        cursor: agencyPriceRegistered ? 'not-allowed' : 'pointer'
                      }}>
                      {agencyPriceRegistered ? 'Registrado en Ganancias' : 'Registrar Pago'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
       )}

       {/* SESSIONS / MEETING EDITOR */}
       {viewState === 'session' && activeMeeting && (
        <div className="flex flex-col h-full overflow-hidden animate-in fade-in duration-400">
          <header className="px-4 py-3 flex items-center justify-between" style={{ backgroundColor: '#141414', borderBottom: `1px solid ${t.border}` }}>
            <div className="flex items-center gap-3">
              <button onClick={saveMeeting} className="w-8 h-8 rounded-lg flex items-center justify-center transition-all" style={{ backgroundColor: '#141414', border: `1px solid ${t.border}` }}>
                <ArrowLeft size={16} color={t.textDim}/>
              </button>
              <div>
                <h3 className="text-xs font-black uppercase text-white">{activeMeeting.session_title}</h3>
                <p className="text-[7px] font-black uppercase tracking-widest text-neutral-400">{activeClient?.nombre}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1 rounded-lg text-sm font-mono font-bold" style={{ backgroundColor: '#141414', border: `1px solid ${t.border}`, color: 'white' }}>
                {formatTime(time)}
                <button onClick={() => setIsTimerRunning(!isTimerRunning)} className="w-6 h-6 rounded flex items-center justify-center" style={{ backgroundColor: '#141414', border: `1px solid ${t.accent}`, color: t.accent }}>
                  {isTimerRunning ? <Pause size={10}/> : <Play size={10}/>}
                </button>
                <button onClick={() => { setTime(0); setIsTimerRunning(false); }} className="w-6 h-6 rounded flex items-center justify-center" style={{ border: `1px solid ${t.border}` }}>
                  <RotateCcw size={10} color={t.textDim}/>
                </button>
              </div>
              <button onClick={saveMeeting} className="px-4 py-2 text-[9px] font-black rounded-lg uppercase tracking-wider flex items-center gap-1.5 transition-all"
                style={{ backgroundColor: '#141414', border: `1px solid ${t.accent}`, color: t.accent }}>
                <Save size={12}/> Guardar
              </button>
            </div>
          </header>
          <div className="flex-1 flex p-3 gap-3 overflow-hidden max-w-[1600px] mx-auto w-full">
            <div className="flex-1 rounded-lg overflow-hidden flex flex-col" style={{ backgroundColor: '#141414', border: `1px solid ${t.border}` }}>
              <div className="px-3 py-2 flex items-center gap-1 flex-wrap" style={{ borderBottom: `1px solid ${t.border}`, backgroundColor: '#141414' }}>
                <button onMouseDown={e => { e.preventDefault(); document.execCommand('formatBlock', false, 'h1'); }} className="px-2 py-1 text-[8px] font-black" style={{ color: t.textDim }}>H1</button>
                <button onMouseDown={e => { e.preventDefault(); document.execCommand('formatBlock', false, 'h2'); }} className="px-2 py-1 text-[8px] font-black" style={{ color: t.textDim }}>H2</button>
                <div className="w-px h-4 mx-1" style={{ backgroundColor: t.border }}/>
                <button onMouseDown={e => { e.preventDefault(); document.execCommand('bold', false, null); }} className="p-1 hover:opacity-80" style={{ color: t.textDim }}><Bold size={12}/></button>
                <button onMouseDown={e => { e.preventDefault(); document.execCommand('italic', false, null); }} className="p-1 hover:opacity-80" style={{ color: t.textDim }}><Italic size={12}/></button>
                <button onMouseDown={e => { e.preventDefault(); document.execCommand('underline', false, null); }} className="px-1.5 py-0.5 text-xs font-black" style={{ color: t.textDim, textDecoration: 'underline' }}>U</button>
                <div className="w-px h-4 mx-1" style={{ backgroundColor: t.border }}/>
                <button onMouseDown={e => { e.preventDefault(); document.execCommand('insertUnorderedList', false, null); }} className="p-1 hover:opacity-80" style={{ color: t.textDim }}><List size={12}/></button>
                <button onMouseDown={e => { e.preventDefault(); document.execCommand('insertHTML', false, '<table style="border-collapse:collapse;width:100%;margin:8px 0"><tr><td style="border:1px solid #444;padding:8px;color:inherit">Celda</td><td style="border:1px solid #444;padding:8px;color:inherit">Celda</td></tr></table><p></p>'); }} className="p-1 hover:opacity-80" style={{ color: t.textDim }}><Table2 size={12}/></button>
              </div>
              <div ref={editorRef} contentEditable="true" suppressContentEditableWarning={true}
                className="flex-1 p-5 text-sm leading-relaxed outline-none mac-scrollbar overflow-y-auto"
                style={{ color: t.text }}
                dangerouslySetInnerHTML={{ __html: activeMeeting.contenido }} />
            </div>
            <div className="w-[280px] flex flex-col gap-3 overflow-y-auto mac-scrollbar">
              <div className="grid grid-cols-2 p-0.5 rounded-lg" style={{ backgroundColor: '#141414', border: `1px solid ${t.border}` }}>
                {[{ id: 'calc', label: 'Calculadora', icon: CalcIcon }, { id: 'info', label: 'Sesión', icon: Calendar }].map(tab => (
                  <button key={tab.id} onClick={() => setSessionSideTab(tab.id)}
                    className="py-1.5 rounded text-[8px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all"
                    style={{ backgroundColor: sessionSideTab === tab.id ? '#141414' : 'transparent', border: sessionSideTab === tab.id ? `1px solid ${t.accent}` : '1px solid transparent', color: sessionSideTab === tab.id ? t.accent : t.textDim }}>
                    <tab.icon size={10}/> {tab.label}
                  </button>
                ))}
              </div>
              {sessionSideTab === 'calc' && (
                <div className="flex flex-col gap-3">
                  <div className="grid grid-cols-4 p-0.5 rounded-lg gap-1" style={{ backgroundColor: '#141414', border: `1px solid ${t.border}` }}>
                    {['BOB', 'USD', 'EUR', 'BRL'].map(cur => (
                      <button key={cur} onClick={() => setSessionCurrency(cur)}
                        className="py-1 rounded text-[7px] font-black"
                        style={{ backgroundColor: sessionCurrency === cur ? '#141414' : 'transparent', border: sessionCurrency === cur ? `1px solid ${t.accent}` : '1px solid transparent', color: sessionCurrency === cur ? t.accent : t.textDim }}>
                        {cur}
                      </button>
                    ))}
                  </div>
                  <div className="p-3 rounded-lg text-right" style={{ backgroundColor: '#141414', border: `1px solid ${t.border}`, color: 'white' }}>
                    <p className="text-[7px] font-black uppercase tracking-wider mb-0.5" style={{ color: t.accent }}>{sessionCurrency}</p>
                    <p className="text-base font-mono font-bold">{calcDisplay}</p>
                  </div>
                  <div className="grid grid-cols-4 gap-1">
                    {['C','DEL','%','/','7','8','9','*','4','5','6','-','1','2','3','+','0','.','='].map(btn => (
                      <button key={btn} onClick={() => btn === '=' ? handleCalc('=') : handleCalc(btn)} className="h-8 rounded text-[8px] font-black transition-all"
                        style={{ backgroundColor: '#141414', border: `1px solid ${btn === '=' ? t.accent : t.border}`, color: btn === '=' ? t.accent : t.textDim }}>
                        {btn}
                      </button>
                    ))}
                  </div>
                  <button onClick={() => { setSessionPrice(calcDisplay !== '0' ? calcDisplay : sessionPrice); setSessionSideTab('info'); }}
                    className="w-full py-2 rounded-lg text-[8px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5"
                    style={{ backgroundColor: '#141414', border: `1px solid ${t.border}`, color: t.textMuted }}>
                    <DollarSign size={10}/> Fijar Cobro
                  </button>
                </div>
              )}
              {sessionSideTab === 'info' && (
                <div className="flex flex-col gap-3">
                  <div className="p-3 rounded-lg space-y-2.5" style={{ backgroundColor: '#141414', border: `1px solid ${t.border}` }}>
                    <p className="text-[7px] font-black uppercase tracking-widest" style={{ color: t.accent }}>📅 Control Temporal</p>
                    <div>
                      <p className="text-[7px] font-bold uppercase ml-0.5 mb-1" style={{ color: t.textDim }}>Fecha Próxima</p>
                      <input type="date" value={sessionNextDate} onChange={e => setSessionNextDate(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded text-[10px] outline-none"
                        style={{ backgroundColor: '#141414', border: `1px solid ${t.border}`, color: t.text }} />
                    </div>
                  </div>
                  <div className="p-3 rounded-lg space-y-2.5" style={{ backgroundColor: '#141414', border: `1px solid ${t.border}` }}>
                    <p className="text-[7px] font-black uppercase tracking-widest" style={{ color: t.accent }}>🔗 Enlaces</p>
                    <div>
                      <p className="text-[7px] font-bold uppercase ml-0.5 mb-1" style={{ color: t.textDim }}>Sala de Video</p>
                      <input type="url" value={sessionMeetLink} onChange={e => setSessionMeetLink(e.target.value)} placeholder="meet.google.com/..."
                        className="w-full px-2.5 py-1.5 rounded text-[10px] outline-none"
                        style={{ backgroundColor: '#141414', border: `1px solid ${t.border}`, color: t.text }} />
                    </div>
                    <div>
                      <p className="text-[7px] font-bold uppercase ml-0.5 mb-1" style={{ color: t.textDim }}>Enlace del Proyecto</p>
                      <input type="url" value={sessionDriveLink} onChange={e => setSessionDriveLink(e.target.value)} placeholder="drive.google.com/..."
                        className="w-full px-2.5 py-1.5 rounded text-[10px] outline-none"
                        style={{ backgroundColor: '#141414', border: `1px solid ${t.border}`, color: t.text }} />
                    </div>
                  </div>
                  <div className="p-3 rounded-lg space-y-2.5" style={{ backgroundColor: '#141414', border: `1px solid ${t.border}` }}>
                    <p className="text-[7px] font-black uppercase tracking-widest" style={{ color: t.accent }}>💰 Tarifación</p>
                    <div className="flex gap-2 items-center">
                      <span className="text-[9px] font-bold text-neutral-400">{sessionCurrency}</span>
                      <input type="number" value={sessionPrice} onChange={e => setSessionPrice(e.target.value)}
                        placeholder="0.00" className="flex-1 px-2.5 py-1.5 rounded text-[10px] font-mono outline-none"
                        style={{ backgroundColor: '#141414', border: `1px solid ${t.border}`, color: t.text }} />
                    </div>
                    <button onClick={() => registerSessionIncome(activeClient?.nombre || 'Cliente', activeMeeting.session_title, sessionPrice, sessionCurrency, false)}
                      disabled={!sessionPrice || parseFloat(sessionPrice) <= 0 || priceRegistered}
                      className="w-full py-2 rounded-lg text-[8px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5"
                      style={{ 
                        backgroundColor: '#141414',
                        border: `1px solid ${priceRegistered ? t.border : t.accent}`,
                        color: priceRegistered ? t.textDim : t.accent,
                        cursor: priceRegistered ? 'not-allowed' : 'pointer'
                      }}>
                      {priceRegistered ? 'Venta Registrada' : 'Registrar Venta'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
       )}

       {/* MODAL: NUEVO CLIENTE (Minimal #141414 styled) */}
       {isClientModalOpen && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-6 animate-in zoom-in duration-300"
          style={{ backgroundColor: 'rgba(20, 20, 20, 0.85)', backdropFilter: 'blur(12px)' }}>
           <div className="w-full max-w-md p-6 space-y-5 rounded-xl"
             style={{ backgroundColor: '#141414', border: `1px solid ${t.border}` }}>
                <div className="flex justify-between items-center">
                   <h3 className="text-sm font-black uppercase tracking-wider text-white">Nuevo Nexus Registro</h3>
                   <button onClick={() => setIsClientModalOpen(false)} className="w-6 h-6 rounded flex items-center justify-center transition-all" style={{ border: `1px solid ${t.border}` }}>
                     <X size={14} color={t.textDim}/>
                   </button>
                </div>
                
                <div className="space-y-3">
                   <div className="space-y-1">
                      <p className="text-[7px] font-black uppercase ml-0.5 tracking-wider text-neutral-400">Identidad</p>
                      <input type="text" value={newClient.nombre} onChange={e=>setNewClient({...newClient, nombre: e.target.value})} placeholder="Nombre completo..."
                        className="w-full rounded-lg p-3 text-xs outline-none"
                        style={{ backgroundColor: '#141414', border: `1px solid ${t.border}`, color: t.text }} />
                      <input type="text" value={newClient.empresa} onChange={e=>setNewClient({...newClient, empresa: e.target.value})} placeholder="Organización / Empresa..."
                        className="w-full rounded-lg p-3 text-xs outline-none mt-2"
                        style={{ backgroundColor: '#141414', border: `1px solid ${t.border}`, color: t.text }} />
                   </div>

                   <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                         <p className="text-[7px] font-black uppercase ml-0.5 tracking-wider text-neutral-400">Nacionalidad</p>
                         <input type="text" value={newClient.nacionalidad} onChange={e=>setNewClient({...newClient, nacionalidad: e.target.value})} placeholder="Ej: Peruana"
                           className="w-full rounded-lg p-3 text-xs outline-none"
                           style={{ backgroundColor: '#141414', border: `1px solid ${t.border}`, color: t.text }} />
                      </div>
                      <div className="space-y-1">
                         <p className="text-[7px] font-black uppercase ml-0.5 tracking-wider text-neutral-400">Canal de Contacto</p>
                         <input type="text" value={newClient.telefono} onChange={e=>setNewClient({...newClient, telefono: e.target.value})} placeholder="+00 000..."
                           className="w-full rounded-lg p-3 text-xs outline-none"
                           style={{ backgroundColor: '#141414', border: `1px solid ${t.border}`, color: t.text }} />
                      </div>
                   </div>
                </div>

                <div className="flex gap-2 pt-2">
                   <button onClick={() => setIsClientModalOpen(false)} className="flex-1 py-3 text-[8px] font-black uppercase tracking-wider" style={{ color: t.textDim }}>Cerrar</button>
                   <button onClick={handleCreateClient} className="flex-[2] py-3 rounded-lg font-black uppercase text-[8px] tracking-wider transition-all"
                     style={{ backgroundColor: '#141414', border: `1px solid ${t.accent}`, color: t.accent }}>Vincular Nexus</button>
                </div>
            </div>
         </div>
       )}

       {/* MODAL: NUEVA MARCA / EMPRESA (Minimal #141414 styled) */}
       {isCompanyModalOpen && (
        <div className="fixed inset-0 z-[800] flex items-center justify-center p-6 animate-in zoom-in duration-300"
          style={{ backgroundColor: 'rgba(20, 20, 20, 0.85)', backdropFilter: 'blur(12px)' }}>
           <div className="w-full max-w-xl overflow-hidden rounded-xl"
             style={{ backgroundColor: '#141414', border: `1px solid ${t.border}` }}>
              <header className="px-6 py-4 flex justify-between items-center" style={{ borderBottom: `1px solid ${t.border}` }}>
                 <div>
                   <h3 className="text-sm font-black uppercase tracking-wider text-white">Nuevo Enlace Nexus Agency</h3>
                 </div>
                 <button onClick={() => setIsCompanyModalOpen(false)} className="w-6 h-6 rounded flex items-center justify-center transition-all" style={{ border: `1px solid ${t.border}` }}>
                   <X size={14} color={t.textDim}/>
                 </button>
              </header>

              <div className="flex bg-[#141414]" style={{ borderBottom: `1px solid ${t.border}` }}>
                 {['general', 'redes', 'cm'].map(tab => (
                    <button key={tab} onClick={() => setAgencyTab(tab)} className="flex-1 py-3 text-[8px] font-black uppercase tracking-widest transition-all"
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
                    <div className="space-y-3">
                       <div className="space-y-1">
                         <p className="text-[7px] font-black uppercase ml-0.5 tracking-wider text-neutral-400">Marca / Empresa</p>
                         <input type="text" value={newCompany.nombre_empresa} onChange={e=>setNewCompany({...newCompany, nombre_empresa: e.target.value})} placeholder="Nombre de la marca..."
                           className="w-full rounded-lg p-3 text-xs outline-none"
                           style={{ backgroundColor: '#141414', border: `1px solid ${t.border}`, color: t.text }} />
                       </div>
                       <div className="space-y-1">
                         <p className="text-[7px] font-black uppercase ml-0.5 tracking-wider text-neutral-400">Propietario / Representante</p>
                         <input type="text" value={newCompany.dueño} onChange={e=>setNewCompany({...newCompany, dueño: e.target.value})} placeholder="Nombre del responsable..."
                           className="w-full rounded-lg p-3 text-xs outline-none"
                           style={{ backgroundColor: '#141414', border: `1px solid ${t.border}`, color: t.text }} />
                       </div>
                       <div className="grid grid-cols-2 gap-2">
                          <input type="email" value={newCompany.email} onChange={e=>setNewCompany({...newCompany, email: e.target.value})} placeholder="email@empresa.com"
                            className="w-full rounded-lg p-3 text-xs outline-none"
                            style={{ backgroundColor: '#141414', border: `1px solid ${t.border}`, color: t.text }} />
                          <input type="text" value={newCompany.telefono} onChange={e=>setNewCompany({...newCompany, telefono: e.target.value})} placeholder="+00 000..."
                            className="w-full rounded-lg p-3 text-xs outline-none"
                            style={{ backgroundColor: '#141414', border: `1px solid ${t.border}`, color: t.text }} />
                       </div>
                    </div>
                 )}

                 {agencyTab === 'redes' && (
                    <div className="space-y-2">
                       {['instagram', 'tiktok', 'facebook', 'youtube'].map(red => (
                          <div key={red} className="flex items-center gap-3 p-1 rounded-lg" style={{ border: `1px solid ${t.border}` }}>
                             <div className="w-8 h-8 rounded flex items-center justify-center" style={{ color: t.accent }}>
                                {red === 'instagram' && <Instagram size={14}/>}
                                {red === 'tiktok' && <TiktokIcon size={14}/>}
                                {red === 'facebook' && <Facebook size={14}/>}
                                {red === 'youtube' && <Youtube size={14}/>}
                             </div>
                             <input type="text" value={newCompany.redes[red]} onChange={e=>setNewCompany({...newCompany, redes: {...newCompany.redes, [red]: e.target.value}})} placeholder={`URL de ${red}...`}
                               className="flex-1 bg-transparent p-2 text-xs outline-none" style={{ color: t.text }} />
                          </div>
                       ))}
                    </div>
                 )}

                 {agencyTab === 'cm' && (
                    <div className="space-y-3">
                       {['instagram', 'tiktok', 'facebook', 'youtube'].map(red => (
                          <div key={red} className="space-y-1.5 p-3 rounded-lg" style={{ border: `1px solid ${t.border}` }}>
                             <h4 className="text-[7px] font-black uppercase tracking-wider flex items-center gap-1.5 text-white">
                                Access {red}
                             </h4>
                             <div className="grid grid-cols-2 gap-2">
                                <input type="text" value={newCompany.credentials[red].user} onChange={e=>setNewCompany({...newCompany, credentials: {...newCompany.credentials, [red]: {...newCompany.credentials[red], user: e.target.value}}})} placeholder="Usuario"
                                  className="w-full rounded-lg p-2.5 text-[10px] outline-none"
                                  style={{ backgroundColor: '#141414', border: `1px solid ${t.border}`, color: t.text }} />
                                <input type="password" value={newCompany.credentials[red].pass} onChange={e=>setNewCompany({...newCompany, credentials: {...newCompany.credentials, [red]: {...newCompany.credentials[red], pass: e.target.value}}})} placeholder="Contraseña"
                                  className="w-full rounded-lg p-2.5 text-[10px] outline-none"
                                  style={{ backgroundColor: '#141414', border: `1px solid ${t.border}`, color: t.text }} />
                             </div>
                          </div>
                       ))}
                    </div>
                 )}
              </div>

              <footer className="px-6 py-4 flex gap-2" style={{ borderTop: `1px solid ${t.border}` }}>
                 <button onClick={() => setIsCompanyModalOpen(false)} className="flex-1 py-3 text-[8px] font-black uppercase tracking-wider" style={{ color: t.textDim }}>Descartar</button>
                 <button onClick={handleCreateAgencyClient} className="flex-[2] py-3 rounded-lg font-black uppercase text-[8px] tracking-wider transition-all"
                   style={{ backgroundColor: '#141414', border: `1px solid ${t.accent}`, color: t.accent }}>Sincronizar Nexus</button>
              </footer>
           </div>
         </div>
       )}

       {/* PROJECT ENGINE VIEW (VIDEO EDITING TAB) */}
       {viewState === 'project-engine' && (
         <ProjectEngineView isDark={isDark} />
       )}
    </div>
  );
};

// ── REDESIGNED PROJECT ENGINE VIEW (3 COLUMNS, VISUAL INTERACTIVE ELEMENTS) ──
const ProjectEngineView = ({ isDark = true }) => {
  const t = useMemo(() => getTheme(isDark), [isDark]);

  const [carpetaMaestra, setCarpetaMaestra] = useState('Base de Edición Principal');
  const [empresa, setEmpresa] = useState('');
  const [proyecto, setProyecto] = useState('');
  const [selectedPremiere, setSelectedPremiere] = useState('');
  const [selectedAE, setSelectedAE] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [destinationPath, setDestinationPath] = useState('');
  const [dirHandle, setDirHandle] = useState(null);

  // Timecode & Bitrate calculator states
  const [calcRes, setCalcRes] = useState('1080p');
  const [calcFps, setCalcFps] = useState(30);
  const [calcMin, setCalcMin] = useState(5);

  const [fpsVal, setFpsVal] = useState(30);
  const [tcInput, setTcInput] = useState('00:01:24:12');
  const [framesOutput, setFramesOutput] = useState(2532);
  const [framesInput, setFramesInput] = useState(3000);
  const [tcOutput, setTcOutput] = useState('00:01:40:00');

  // Edit notes
  const [editNotes, setEditNotes] = useState('00:15 - Cortar silencio inicial\n01:30 - Aplicar zoom en el gancho\n02:45 - Inserción de CTA final');

  // Nomenclatura states
  const [nomClient, setNomClient] = useState('CLIENTE');
  const [nomProj, setNomProj] = useState('PROYECTO');
  const [nomVer, setNomVer] = useState('V1');
  const [nomAspect, setNomAspect] = useState('H');

  // Safe Zones
  const [cropGuide, setCropGuide] = useState('916');

  // Injections
  const [incSFX, setIncSFX] = useState(true);
  const [incLogos, setIncLogos] = useState(false);
  const [incMOGRTs, setIncMOGRTs] = useState(false);

  // Interactive local tree navigation
  const [treeCollapsed, setTreeCollapsed] = useState({
    root: false,
    client: false,
    project: false,
    pr: false,
    ae: false,
    video: false,
    audio: false,
    img: false,
  });

  // Timeline production stage milestones
  const [productionMilestone, setProductionMilestone] = useState('Ingesta');

  // Simulated render queue
  const [renders, setRenders] = useState([
    { id: 1, name: 'SPOT_SOVEREIGN_V1_916.mp4', progress: 42, status: 'rendering', size: '215 MB', type: '9:16 vertical' },
    { id: 2, name: 'PRESENTACION_MARCA_V2_H.mp4', progress: 100, status: 'completed', size: '820 MB', type: '16:9 horizontal' }
  ]);

  const today = new Date().toISOString().split('T')[0];

  const templates = [
    '1080x1920_25fps', '1080x1920_30fps', '1080x1920_60fps',
    '1920x1080_25fps', '1920x1080_30fps', '1920x1080_60fps',
    '4K_Horizontal_25fps', '4K_Horizontal_30fps', '4K_Horizontal_60fps'
  ];

  // Helper converters
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
    element.download = `notas_edicion_${today}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleSelectDirectory = async () => {
    try {
      if (window.electronAPI) {
        const path = await window.electronAPI.selectDirectory();
        if (path) setDestinationPath(path);
      } else {
        if (!window.showDirectoryPicker) throw new Error('Navegador no soportado.');
        const handle = await window.showDirectoryPicker({ mode: 'readwrite' });
        setDirHandle(handle);
        setDestinationPath(handle.name || 'Directorio Local');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleGenerate = async () => {
    if (!carpetaMaestra || !empresa || !proyecto) {
      alert('Completa la nomenclatura.');
      return;
    }
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setStatusMsg('Estructura inyectada en el disco local.');
    }, 1500);
  };

  const cleanFolderName = (txt) => txt.replace(/ /g, '_');
  const finalProjectFolderName = `${today}_${cleanFolderName(empresa || 'CLIENTE')}_${cleanFolderName(proyecto || 'PROYECTO')}`;
  const finalNamingResult = `${nomClient.toUpperCase().replace(/ /g, '_')}_${nomProj.toUpperCase().replace(/ /g, '_')}_${nomVer.toUpperCase()}_${today}_${nomAspect}`;

  const calcEstSizeGB = ((calcRes === '4K' ? 0.35 : 0.08) * calcFps * calcMin * 60 / 1000).toFixed(2);
  const recommendedBitrateMbps = calcRes === '4K' ? (calcFps > 30 ? 60 : 45) : (calcFps > 30 ? 24 : 15);

  // Simulated render loop
  useEffect(() => {
    const interval = setInterval(() => {
      setRenders(prev => prev.map(r => {
        if (r.status === 'rendering') {
          const next = r.progress + Math.floor(Math.random() * 8) + 2;
          if (next >= 100) return { ...r, progress: 100, status: 'completed' };
          return { ...r, progress: next };
        }
        return r;
      }));
    }, 1200);
    return () => clearInterval(interval);
  }, []);

  const addRenderFromCurrent = () => {
    const newRender = {
      id: Date.now(),
      name: `${finalNamingResult}.mp4`,
      progress: 0,
      status: 'rendering',
      size: `${calcEstSizeGB} GB`,
      type: nomAspect === 'V' ? '9:16 vertical' : '16:9 horizontal'
    };
    setRenders(prev => [newRender, ...prev]);
  };

  const toggleRenderStatus = (id) => {
    setRenders(prev => prev.map(r => {
      if (r.id === id) {
        return { ...r, status: r.status === 'rendering' ? 'paused' : 'rendering' };
      }
      return r;
    }));
  };

  const deleteRender = (id) => {
    setRenders(prev => prev.filter(r => r.id !== id));
  };

  const toggleTree = (key) => {
    setTreeCollapsed(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="flex-grow flex flex-col p-6 space-y-6 max-w-[1400px] mx-auto w-full animate-in fade-in duration-500 overflow-y-auto mac-scrollbar">
       
       {/* Tab Title */}
       <header className="flex justify-between items-center pb-4" style={{ borderBottom: `1px solid ${t.border}` }}>
          <div>
             <h2 className="text-base font-black uppercase tracking-wider text-white">Mesa de Trabajo — Edición de Video</h2>
             <p className="text-[7.5px] font-bold uppercase tracking-widest" style={{ color: t.textDim }}>Workspace de control de montaje local & utilidades de compresión</p>
          </div>
          <div className="flex items-center gap-2 text-[8px] font-black uppercase text-neutral-400">
             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
             Ingesta Activa
          </div>
       </header>

       {/* THREE COLUMN GRID */}
       <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
          
          {/* COLUMN 1: ENTORNO E INGESTA */}
          <div className="flex flex-col space-y-5">
             
             {/* Local Folder Structure Generator */}
             <div className="p-5 rounded-xl space-y-4" style={{ backgroundColor: '#141414', border: `1px solid ${t.border}` }}>
                <div className="flex items-center gap-2 pb-2" style={{ borderBottom: `1px solid ${t.border}` }}>
                   <FolderOpen size={14} color={t.accent}/>
                   <span className="text-[10px] font-black uppercase tracking-widest text-white">Generador de Entorno Local</span>
                </div>

                <div className="space-y-3 text-xs">
                   <div className="space-y-1">
                      <label className="text-[7.5px] font-black uppercase tracking-wider text-neutral-400">Directorio de Destino</label>
                      <div className="flex gap-2">
                         <input type="text" value={destinationPath || 'No seleccionado...'} disabled
                           className="flex-1 rounded p-2 text-[9px] font-mono outline-none truncate"
                           style={{ backgroundColor: '#141414', border: `1px solid ${t.border}`, color: t.textDim }} />
                         <button onClick={handleSelectDirectory} className="px-3 rounded text-[8px] font-black uppercase transition-all"
                           style={{ border: `1px solid ${t.accent}`, color: t.accent, backgroundColor: '#141414' }}>Vincular</button>
                      </div>
                   </div>

                   <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                         <label className="text-[7.5px] font-black uppercase tracking-wider text-neutral-400">Carpeta Maestra</label>
                         <input type="text" value={carpetaMaestra} onChange={e=>setCarpetaMaestra(e.target.value)}
                           className="w-full rounded p-2 text-[10px] outline-none"
                           style={{ backgroundColor: '#141414', border: `1px solid ${t.border}`, color: t.text }} />
                      </div>
                      <div className="space-y-1">
                         <label className="text-[7.5px] font-black uppercase tracking-wider text-neutral-400">Cliente / Empresa</label>
                         <input type="text" value={empresa} onChange={e=>setEmpresa(e.target.value)} placeholder="Ej: Urbanizacion"
                           className="w-full rounded p-2 text-[10px] outline-none"
                           style={{ backgroundColor: '#141414', border: `1px solid ${t.border}`, color: t.text }} />
                      </div>
                   </div>

                   <div className="space-y-1">
                      <label className="text-[7.5px] font-black uppercase tracking-wider text-neutral-400">Proyecto</label>
                      <input type="text" value={proyecto} onChange={e=>setProyecto(e.target.value)} placeholder="Ej: Spot Comercial"
                        className="w-full rounded p-2 text-[10px] outline-none"
                        style={{ backgroundColor: '#141414', border: `1px solid ${t.border}`, color: t.text }} />
                   </div>

                   <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                         <label className="text-[7.5px] font-black uppercase tracking-wider text-neutral-400">Premiere Template</label>
                         <select value={selectedPremiere} onChange={e=>setSelectedPremiere(e.target.value)}
                           className="w-full rounded p-2 text-[9px] outline-none cursor-pointer"
                           style={{ backgroundColor: '#141414', border: `1px solid ${t.border}`, color: t.text }}>
                            <option value="">Ninguna</option>
                            {templates.map(tmp => <option key={tmp} value={tmp}>{tmp}</option>)}
                         </select>
                      </div>
                      <div className="space-y-1">
                         <label className="text-[7.5px] font-black uppercase tracking-wider text-neutral-400">After Effects Template</label>
                         <select value={selectedAE} onChange={e=>setSelectedAE(e.target.value)}
                           className="w-full rounded p-2 text-[9px] outline-none cursor-pointer"
                           style={{ backgroundColor: '#141414', border: `1px solid ${t.border}`, color: t.text }}>
                            <option value="">Ninguna</option>
                            {templates.map(tmp => <option key={tmp} value={tmp}>{tmp}</option>)}
                         </select>
                      </div>
                   </div>

                   <div className="space-y-1">
                      <label className="text-[7.5px] font-black uppercase tracking-wider text-neutral-400">Módulos Extra</label>
                      <div className="grid grid-cols-3 gap-1">
                         <label className="flex items-center gap-1.5 p-1.5 rounded cursor-pointer transition-all" style={{ border: `1px solid ${t.border}` }}>
                            <input type="checkbox" checked={incSFX} onChange={e=>setIncSFX(e.target.checked)} className="accent-neutral-500" />
                            <span className="text-[7px] font-bold uppercase tracking-wider" style={{ color: t.textDim }}>SFX Audio</span>
                         </label>
                         <label className="flex items-center gap-1.5 p-1.5 rounded cursor-pointer transition-all" style={{ border: `1px solid ${t.border}` }}>
                            <input type="checkbox" checked={incLogos} onChange={e=>setIncLogos(e.target.checked)} className="accent-neutral-500" />
                            <span className="text-[7px] font-bold uppercase tracking-wider" style={{ color: t.textDim }}>Logos</span>
                         </label>
                         <label className="flex items-center gap-1.5 p-1.5 rounded cursor-pointer transition-all" style={{ border: `1px solid ${t.border}` }}>
                            <input type="checkbox" checked={incMOGRTs} onChange={e=>setIncMOGRTs(e.target.checked)} className="accent-neutral-500" />
                            <span className="text-[7px] font-bold uppercase tracking-wider" style={{ color: t.textDim }}>MOGRTs</span>
                         </label>
                      </div>
                   </div>

                   <button onClick={handleGenerate} disabled={isGenerating || !destinationPath}
                      className="w-full py-2.5 rounded font-black text-[9px] uppercase tracking-wider flex items-center justify-center gap-2 transition-all mt-2"
                      style={{
                         backgroundColor: '#141414',
                         border: `1px solid ${isGenerating || !destinationPath ? t.border : t.accent}`,
                         color: isGenerating || !destinationPath ? t.textDim : t.accent,
                         cursor: isGenerating || !destinationPath ? 'not-allowed' : 'pointer'
                      }}>
                      {isGenerating ? 'Generando...' : 'Generar Estructura'}
                   </button>
                   {statusMsg && <p className="text-center text-[7.5px] font-black uppercase tracking-wider text-emerald-500 mt-1">{statusMsg}</p>}
                </div>
             </div>

             {/* Interactive Visual Directory Tree */}
             <div className="p-5 rounded-xl space-y-3" style={{ backgroundColor: '#141414', border: `1px solid ${t.border}` }}>
                <div className="flex items-center justify-between pb-2" style={{ borderBottom: `1px solid ${t.border}` }}>
                   <div className="flex items-center gap-2">
                      <Grid size={14} color={t.accent}/>
                      <span className="text-[10px] font-black uppercase tracking-widest text-white">Visualizador de Árbol de Directorio</span>
                   </div>
                   <span className="text-[7px] font-mono text-neutral-400">Estructura Dinámica</span>
                </div>

                <div className="font-mono text-[9px] space-y-1.5 text-neutral-300 pl-1 select-none overflow-y-auto max-h-[220px] mac-scrollbar">
                   {/* Root Node */}
                   <div>
                      <div className="flex items-center gap-1 cursor-pointer" onClick={() => toggleTree('root')}>
                         <ChevronDown size={10} className={`transform transition-transform ${treeCollapsed.root ? '-rotate-90' : ''}`}/>
                         <Folder size={10} color={t.accent}/>
                         <span className="font-bold text-white">{carpetaMaestra || 'Carpeta Maestra'}</span>
                      </div>
                      
                      {!treeCollapsed.root && (
                         <div className="pl-4 border-l border-neutral-800 space-y-1.5 mt-1.5">
                            {/* Client Node */}
                            <div>
                               <div className="flex items-center gap-1 cursor-pointer" onClick={() => toggleTree('client')}>
                                  <ChevronDown size={10} className={`transform transition-transform ${treeCollapsed.client ? '-rotate-90' : ''}`}/>
                                  <Folder size={10} color={t.accent}/>
                                  <span className="font-bold">{empresa || 'Cliente'}</span>
                               </div>
                               
                               {!treeCollapsed.client && (
                                  <div className="pl-4 border-l border-neutral-800 space-y-1.5 mt-1.5">
                                     {/* Project Folder */}
                                     <div>
                                        <div className="flex items-center gap-1 cursor-pointer" onClick={() => toggleTree('project')}>
                                           <ChevronDown size={10} className={`transform transition-transform ${treeCollapsed.project ? '-rotate-90' : ''}`}/>
                                           <Folder size={10} color={t.accent}/>
                                           <span className="text-white truncate max-w-[170px]">{finalProjectFolderName}</span>
                                        </div>

                                        {!treeCollapsed.project && (
                                           <div className="pl-4 border-l border-neutral-800 space-y-1.5 mt-1.5">
                                              {/* 01_Premiere */}
                                              <div>
                                                 <div className="flex items-center gap-1 cursor-pointer" onClick={() => toggleTree('pr')}>
                                                    <ChevronDown size={10} className={`transform transition-transform ${treeCollapsed.pr ? '-rotate-90' : ''}`}/>
                                                    <Folder size={10} color="#94a3b8"/>
                                                    <span>01_Premiere Pro</span>
                                                 </div>
                                                 {!treeCollapsed.pr && (
                                                    <div className="pl-4 border-l border-neutral-800 space-y-1 mt-1">
                                                       {selectedPremiere && (
                                                          <div className="flex items-center gap-1 text-[8.5px] text-neutral-400">
                                                             <File size={9}/>
                                                             <span>{finalProjectFolderName}.prproj</span>
                                                          </div>
                                                       )}
                                                       {incMOGRTs && (
                                                          <div className="flex items-center gap-1 text-[8.5px] text-neutral-400">
                                                             <Folder size={9}/>
                                                             <span>MOGRTs_Sovereign</span>
                                                          </div>
                                                       )}
                                                    </div>
                                                 )}
                                              </div>

                                              {/* 02_AE */}
                                              <div>
                                                 <div className="flex items-center gap-1 cursor-pointer" onClick={() => toggleTree('ae')}>
                                                    <ChevronDown size={10} className={`transform transition-transform ${treeCollapsed.ae ? '-rotate-90' : ''}`}/>
                                                    <Folder size={10} color="#94a3b8"/>
                                                    <span>02_After Effects</span>
                                                 </div>
                                                 {!treeCollapsed.ae && selectedAE && (
                                                    <div className="pl-4 border-l border-neutral-800 mt-1">
                                                       <div className="flex items-center gap-1 text-[8.5px] text-neutral-400">
                                                          <File size={9}/>
                                                          <span>{finalProjectFolderName}.aep</span>
                                                       </div>
                                                    </div>
                                                 )}
                                              </div>

                                              {/* 03_video */}
                                              <div>
                                                 <div className="flex items-center gap-1 cursor-pointer" onClick={() => toggleTree('video')}>
                                                    <ChevronDown size={10} className={`transform transition-transform ${treeCollapsed.video ? '-rotate-90' : ''}`}/>
                                                    <Folder size={10} color="#94a3b8"/>
                                                    <span>03_video</span>
                                                 </div>
                                                 {!treeCollapsed.video && (
                                                    <div className="pl-4 border-l border-neutral-800 space-y-0.5 mt-1 text-neutral-400 text-[8.5px]">
                                                       <div>📁 video 01 (RAW)</div>
                                                       <div>📁 video 02 (Recortes)</div>
                                                       {incLogos && <div>📁 PNG/Logotipos_Marca</div>}
                                                    </div>
                                                 )}
                                              </div>

                                              {/* 04_audio */}
                                              <div>
                                                 <div className="flex items-center gap-1 cursor-pointer" onClick={() => toggleTree('audio')}>
                                                    <ChevronDown size={10} className={`transform transition-transform ${treeCollapsed.audio ? '-rotate-90' : ''}`}/>
                                                    <Folder size={10} color="#94a3b8"/>
                                                    <span>04_audio</span>
                                                 </div>
                                                 {!treeCollapsed.audio && incSFX && (
                                                    <div className="pl-4 border-l border-neutral-800 mt-1">
                                                       <div className="flex items-center gap-1 text-[8.5px] text-neutral-400">
                                                          <Folder size={9}/>
                                                          <span>SFX_Comunes</span>
                                                       </div>
                                                    </div>
                                                 )}
                                              </div>

                                              {/* 06_IA */}
                                              <div className="flex items-center gap-1 text-neutral-400">
                                                 <Folder size={10} color="#94a3b8"/>
                                                 <span>06_IA</span>
                                              </div>
                                           </div>
                                        )}
                                     </div>
                                  </div>
                               )}
                            </div>
                         </div>
                      )}
                   </div>
                </div>
             </div>

          </div>

          {/* COLUMN 2: NÚCLEO DE MONTAJE Y SAFE ZONES */}
          <div className="flex flex-col space-y-5">
             
             {/* Production Milestone Horizontal Interactive Timeline */}
             <div className="p-5 rounded-xl space-y-4" style={{ backgroundColor: '#141414', border: `1px solid ${t.border}` }}>
                <div className="flex items-center gap-2 pb-2" style={{ borderBottom: `1px solid ${t.border}` }}>
                   <Activity size={14} color={t.accent}/>
                   <span className="text-[10px] font-black uppercase tracking-widest text-white">Flujo Temporal de Producción</span>
                </div>

                {/* Horizontal Timeline Bar */}
                <div className="flex items-center justify-between relative py-2">
                   <div className="absolute left-2 right-2 h-0.5 bg-neutral-800 top-1/2 -translate-y-1/2 z-0"></div>
                   
                   {['Ingesta', 'Corte', 'SFX', 'Color', 'Render'].map((mstone, idx) => {
                      const isActive = productionMilestone === mstone;
                      return (
                         <button key={mstone} onClick={() => setProductionMilestone(mstone)} className="relative z-10 flex flex-col items-center focus:outline-none">
                            <div className="w-5 h-5 rounded-full flex items-center justify-center transition-all"
                              style={{
                                 backgroundColor: '#141414',
                                 border: `1.5px solid ${isActive ? t.accent : '#2d2d2d'}`,
                                 color: isActive ? t.accent : '#6b7280'
                              }}>
                               {idx + 1}
                            </div>
                            <span className="text-[7px] font-black uppercase mt-1.5 tracking-wider"
                              style={{ color: isActive ? t.accent : '#6b7280' }}>
                               {mstone}
                            </span>
                         </button>
                      );
                   })}
                </div>

                {/* Milestone Detail Card */}
                <div className="p-3.5 rounded-lg text-xs" style={{ border: `1px solid ${t.border}` }}>
                   {productionMilestone === 'Ingesta' && (
                      <div className="space-y-1">
                         <p className="text-[8px] font-black uppercase text-white">Etapa 1: Ingesta de Datos</p>
                         <p className="text-[9.5px] leading-relaxed text-neutral-400">Verificación de clips RAW, copiado rápido a discos SSD locales y nomenclatura del árbol estructural del proyecto.</p>
                      </div>
                   )}
                   {productionMilestone === 'Corte' && (
                      <div className="space-y-1">
                         <p className="text-[8px] font-black uppercase text-white">Etapa 2: Estructura y Selección</p>
                         <p className="text-[9.5px] leading-relaxed text-neutral-400">Montaje en timeline, sincronización de pista de audio de voz, remoción de espacios y ritmos principales (A-Roll).</p>
                      </div>
                   )}
                   {productionMilestone === 'SFX' && (
                      <div className="space-y-1">
                         <p className="text-[8px] font-black uppercase text-white">Etapa 3: Diseño de Audio y Efectos</p>
                         <p className="text-[9.5px] leading-relaxed text-neutral-400">Inyección de efectos de sonido locales (SFX), transiciones y música de fondo con nivelación de espectro sonora.</p>
                      </div>
                   )}
                   {productionMilestone === 'Color' && (
                      <div className="space-y-1">
                         <p className="text-[8px] font-black uppercase text-white">Etapa 4: Tratamiento de Color</p>
                         <p className="text-[9.5px] leading-relaxed text-neutral-400">Corrección de color primaria, igualación de cámaras diferentes y exportación de look artístico (grading).</p>
                      </div>
                   )}
                   {productionMilestone === 'Render' && (
                      <div className="space-y-1">
                         <p className="text-[8px] font-black uppercase text-white">Etapa 5: Exportación de Entregable</p>
                         <p className="text-[9.5px] leading-relaxed text-neutral-400">Control de Safe Zones en aspect ratio de salida, cálculos de bitrate target y cola de render local.</p>
                      </div>
                   )}
                </div>
             </div>

             {/* Safe Zones selector and visualizer */}
             <div className="p-5 rounded-xl space-y-3.5" style={{ backgroundColor: '#141414', border: `1px solid ${t.border}` }}>
                <div className="flex items-center justify-between pb-2" style={{ borderBottom: `1px solid ${t.border}` }}>
                   <div className="flex items-center gap-2">
                      <Highlighter size={14} color={t.accent}/>
                      <span className="text-[10px] font-black uppercase tracking-widest text-white">Guías de Safe Zones</span>
                   </div>
                   <div className="flex gap-1">
                      {['916', '11', '239'].map(sz => (
                         <button key={sz} onClick={() => setCropGuide(sz)} className="px-2 py-0.5 rounded text-[7.5px] font-black"
                           style={{
                              backgroundColor: '#141414',
                              border: `1px solid ${cropGuide === sz ? t.accent : t.border}`,
                              color: cropGuide === sz ? t.accent : t.textDim
                           }}>
                            {sz === '916' ? '9:16' : sz === '11' ? '1:1' : '2.39:1'}
                         </button>
                      ))}
                   </div>
                </div>

                <div className="relative w-full aspect-video rounded-lg overflow-hidden flex items-center justify-center bg-black"
                  style={{ border: `1px solid ${t.border}` }}>
                   <div className="absolute text-[8px] font-mono text-neutral-500 z-10">16:9 Lienzo Principal</div>
                   
                   {cropGuide === '916' && (
                      <div className="absolute h-full aspect-[9/16] animate-in fade-in"
                        style={{ borderLeft: '1px dashed #f59e0b', borderRight: '1px dashed #f59e0b', backgroundColor: 'rgba(245, 158, 11, 0.03)' }}>
                         <div className="absolute bottom-2 left-0 right-0 text-center text-[5.5px] font-mono text-amber-500">TikTok Safe Zone</div>
                      </div>
                   )}
                   {cropGuide === '11' && (
                      <div className="absolute h-full aspect-[1/1] animate-in fade-in"
                        style={{ border: '1px dashed #10b981', backgroundColor: 'rgba(16, 185, 129, 0.03)' }}>
                         <div className="absolute bottom-2 left-0 right-0 text-center text-[5.5px] font-mono text-emerald-500">Instagram 1:1</div>
                      </div>
                   )}
                   {cropGuide === '239' && (
                      <div className="absolute w-full h-[65%] animate-in fade-in"
                        style={{ borderTop: '1px dashed #3b82f6', borderBottom: '1px dashed #3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.03)' }}>
                         <div className="absolute right-2 bottom-1 text-[5.5px] font-mono text-blue-500">Cinema 2.39:1</div>
                      </div>
                   )}
                </div>
             </div>

             {/* Calculadoras de Timecode y Bitrate */}
             <div className="grid grid-cols-2 gap-3">
                
                {/* Timecode Calc */}
                <div className="p-4 rounded-xl space-y-3.5" style={{ backgroundColor: '#141414', border: `1px solid ${t.border}` }}>
                   <div className="flex items-center gap-1.5 pb-2" style={{ borderBottom: `1px solid ${t.border}` }}>
                      <Clock size={12} color={t.accent}/>
                      <span className="text-[8.5px] font-black uppercase tracking-wider text-white">Conversor TC</span>
                   </div>
                   <div className="space-y-2 text-xs">
                      <div>
                         <label className="text-[6.5px] font-black uppercase text-neutral-400 block mb-1">FPS base</label>
                         <select value={fpsVal} onChange={e=>{setFpsVal(parseInt(e.target.value)); handleTcToFrames(tcInput, parseInt(e.target.value)); handleFramesToTc(framesInput, parseInt(e.target.value));}}
                           className="w-full rounded p-1.5 text-[9px] outline-none"
                           style={{ backgroundColor: '#141414', border: `1px solid ${t.border}`, color: t.text }}>
                            <option value="24">24 fps</option>
                            <option value="30">30 fps</option>
                            <option value="60">60 fps</option>
                         </select>
                      </div>
                      <div className="space-y-1">
                         <span className="text-[6.5px] font-black uppercase text-neutral-400">TC → Frames</span>
                         <input type="text" value={tcInput} onChange={e=>{setTcInput(e.target.value); handleTcToFrames(e.target.value, fpsVal);}}
                           className="w-full rounded p-1 text-[9px] font-mono outline-none"
                           style={{ backgroundColor: '#141414', border: `1px solid ${t.border}`, color: t.text }} />
                         <span className="text-[8.5px] font-mono font-bold text-white">{framesOutput} f</span>
                      </div>
                   </div>
                </div>

                {/* Bitrate Calc */}
                <div className="p-4 rounded-xl space-y-3.5" style={{ backgroundColor: '#141414', border: `1px solid ${t.border}` }}>
                   <div className="flex items-center gap-1.5 pb-2" style={{ borderBottom: `1px solid ${t.border}` }}>
                      <Calculator as={CalcIcon} size={12} color={t.accent}/>
                      <span className="text-[8.5px] font-black uppercase tracking-wider text-white">Calculadora Peso</span>
                   </div>
                   <div className="space-y-2 text-xs">
                      <div className="grid grid-cols-2 gap-1">
                         <div>
                            <span className="text-[6px] font-black uppercase text-neutral-400 block mb-0.5">Res</span>
                            <select value={calcRes} onChange={e=>setCalcRes(e.target.value)}
                              className="w-full rounded p-1 text-[8px] outline-none"
                              style={{ backgroundColor: '#141414', border: `1px solid ${t.border}`, color: t.text }}>
                               <option value="1080p">1080p</option>
                               <option value="4K">4K</option>
                            </select>
                         </div>
                         <div>
                            <span className="text-[6px] font-black uppercase text-neutral-400 block mb-0.5">Min</span>
                            <input type="number" value={calcMin} onChange={e=>setCalcMin(parseInt(e.target.value) || 1)}
                              className="w-full rounded p-1 text-[8px] outline-none"
                              style={{ backgroundColor: '#141414', border: `1px solid ${t.border}`, color: t.text }} />
                         </div>
                      </div>
                      <div className="p-1.5 rounded space-y-1 text-[8px]" style={{ border: `1px solid ${t.border}` }}>
                         <div className="flex justify-between text-neutral-400">Peso: <span className="font-bold text-white font-mono">{calcEstSizeGB} GB</span></div>
                         <div className="flex justify-between text-neutral-400">Target: <span className="font-bold text-white font-mono">{recommendedBitrateMbps} Mb</span></div>
                      </div>
                   </div>
                </div>

             </div>

          </div>

          {/* COLUMN 3: RENDERIZADO Y UTILIDADES DE DISCO */}
          <div className="flex flex-col space-y-5">
             
             {/* Simulated Render Queue */}
             <div className="p-5 rounded-xl space-y-4" style={{ backgroundColor: '#141414', border: `1px solid ${t.border}` }}>
                <div className="flex items-center justify-between pb-2" style={{ borderBottom: `1px solid ${t.border}` }}>
                   <div className="flex items-center gap-2">
                      <Monitor size={14} color={t.accent}/>
                      <span className="text-[10px] font-black uppercase tracking-widest text-white">Cola de Render Virtual</span>
                   </div>
                   <button onClick={addRenderFromCurrent} className="px-2.5 py-1 rounded text-[7.5px] font-black uppercase transition-all"
                     style={{ border: `1px solid ${t.accent}`, color: t.accent, backgroundColor: '#141414' }}>
                      Renderizar Actual
                   </button>
                </div>

                <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1 mac-scrollbar">
                   {renders.map(r => (
                      <div key={r.id} className="p-3 rounded-lg space-y-2 text-xs" style={{ border: `1px solid ${t.border}` }}>
                         <div className="flex justify-between items-start">
                            <div className="max-w-[70%]">
                               <p className="text-[9px] font-bold truncate text-white">{r.name}</p>
                               <span className="text-[7px] text-neutral-500 uppercase font-mono">{r.type} • {r.size}</span>
                            </div>
                            <span className="text-[7.5px] font-mono font-black uppercase px-1.5 py-0.5 rounded"
                              style={{
                                 border: `1px solid ${r.status === 'completed' ? '#10b981' : r.status === 'paused' ? '#f59e0b' : t.accent}`,
                                 color: r.status === 'completed' ? '#10b981' : r.status === 'paused' ? '#f59e0b' : t.accent
                              }}>
                               {r.status}
                            </span>
                         </div>

                         {/* Progress bar */}
                         <div className="space-y-1">
                            <div className="flex justify-between text-[7px] font-mono text-neutral-400">
                               <span>Progreso</span>
                               <span>{r.progress}%</span>
                            </div>
                            <div className="w-full h-1 bg-neutral-900 rounded-full overflow-hidden">
                               <div className="h-full transition-all duration-300"
                                 style={{
                                    width: `${r.progress}%`,
                                    backgroundColor: r.status === 'completed' ? '#10b981' : r.status === 'paused' ? '#f59e0b' : t.accent
                                 }}></div>
                            </div>
                         </div>

                         {/* Action Buttons */}
                         <div className="flex justify-end gap-1.5 pt-1">
                            {r.status !== 'completed' && (
                               <button onClick={() => toggleRenderStatus(r.id)} className="p-1 rounded transition-all" style={{ border: `1px solid ${t.border}` }}>
                                  {r.status === 'rendering' ? <Pause size={10} color={t.textDim}/> : <Play size={10} color={t.accent}/>}
                               </button>
                            )}
                            <button onClick={() => deleteRender(r.id)} className="p-1 rounded transition-all" style={{ border: `1px solid ${t.border}` }}>
                               <Trash2 size={10} color="#f87171"/>
                            </button>
                         </div>
                      </div>
                   ))}
                   {renders.length === 0 && (
                      <div className="py-8 text-center" style={{ border: `1px dashed ${t.border}`, borderRadius: 8 }}>
                         <p className="text-[7.5px] font-black uppercase tracking-wider text-neutral-500">Cola de render vacía.</p>
                      </div>
                   )}
                </div>
             </div>

             {/* Downloadable Edit Notes */}
             <div className="p-5 rounded-xl space-y-4" style={{ backgroundColor: '#141414', border: `1px solid ${t.border}` }}>
                <div className="flex items-center gap-2 pb-2" style={{ borderBottom: `1px solid ${t.border}` }}>
                   <Edit3 size={14} color={t.accent}/>
                   <span className="text-[10px] font-black uppercase tracking-widest text-white">Notas de Corte & Producción</span>
                </div>

                <div className="space-y-3">
                   <textarea value={editNotes} onChange={e=>setEditNotes(e.target.value)}
                     className="w-full rounded p-3 text-[9px] font-mono outline-none h-[120px] resize-none mac-scrollbar"
                     style={{ backgroundColor: '#141414', border: `1px solid ${t.border}`, color: t.text }}
                     placeholder="Notas de montaje..." />

                   <button onClick={downloadNotes} className="w-full py-2.5 rounded font-black text-[9px] uppercase tracking-wider transition-all"
                     style={{ backgroundColor: '#141414', border: `1px solid ${t.accent}`, color: t.accent }}>
                      Descargar Notas (TXT)
                   </button>
                </div>
             </div>

          </div>

       </div>

    </div>
  );
};

// Simple Calculator Icon wrapper to match standard naming inside the code
const Calculator = ({ as: Component, ...props }) => {
  return <Component {...props} />;
};

export default EditorVideo;
