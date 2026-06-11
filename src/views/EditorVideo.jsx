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
import { getTheme, useTheme } from '../lib/theme';

const EditorVideo = ({ meetingsList = [], setMeetingsList, settings = {}, isDark = true, token }) => {
  const t = useTheme(isDark);
  const [viewState, setViewState] = useState('dashboard'); 
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

  // ── Universal Trash Integration (Clientes y Sesiones) ─────────────────────
  const handleDeleteClient = async (client, e) => {
    e.stopPropagation();
    if (!confirm(`¿Eliminar al cliente ${client.nombre} y enviar a la papelera?`)) return;
    try {
      await supabase.from('papelera').insert([{
        tipo_dato: 'cliente',
        nombre_item: client.nombre,
        datos_originales: client,
        borrado_el: new Date().toISOString(),
        expira_el: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      }]);
      const { error } = await supabase.from('clientes_editor').delete().eq('id', client.id);
      if (error) throw error;
      await fetchClients();
      setViewState('client-list');
    } catch (err) { alert('Error al eliminar cliente: ' + err.message); }
  };

  const handleDeleteMeeting = async (meeting, e) => {
    e.stopPropagation();
    if (!confirm(`¿Eliminar la sesión "${meeting.session_title}" y enviar a la papelera?`)) return;
    try {
      await supabase.from('papelera').insert([{
        tipo_dato: 'sesion',
        nombre_item: meeting.session_title,
        datos_originales: meeting,
        borrado_el: new Date().toISOString(),
        expira_el: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      }]);
      const { error } = await supabase.from('reuniones').delete().eq('id', meeting.id);
      if (error) throw error;
      setMeetingsList(prev => prev.filter(m => m.id !== meeting.id));
    } catch (err) { alert('Error al eliminar sesión: ' + err.message); }
  };

  const normalizeText = (text) => (text || '').toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  const handleCreateClient = async () => {
    if (!newClient.nombre) return;
    setLoading(true);
    try {
      let payload = { 
        nombre: newClient.nombre, 
        email: newClient.email, 
        empresa: newClient.empresa, 
        status: 'Activo',
        telefono: newClient.telefono,
        nacionalidad: newClient.nacionalidad,
        foto_url: newClient.foto
      };
      
      let success = false;
      let attempts = 0;
      let currentPayload = { ...payload };
      
      while (!success && attempts < 12) {
        attempts++;
        const { error } = await supabase.from('clientes_editor').insert([currentPayload]);
        if (!error) {
          success = true;
          break;
        }
        
        // Match error format: Could not find the 'status' column of 'clientes_editor' in the schema cache
        const match = error.message && error.message.match(/Could not find the '([^']+)' column/);
        if (match && match[1]) {
          const missingColumn = match[1];
          delete currentPayload[missingColumn];
        } else {
          throw error;
        }
      }
      
      if (!success) {
        throw new Error("No se pudo insertar el cliente tras varios reintentos de compatibilidad.");
      }

      await fetchClients();
      setIsClientModalOpen(false);
      setNewClient({ nombre: '', email: '', pais: '', empresa: '', status: 'Activo', telefono: '', nacionalidad: '', foto: '' });
    } catch (e) { 
      alert("Error al registrar cliente: " + e.message); 
    }
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

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden font-sans"
      style={{ backgroundColor: t.bg, color: t.text }}>
      
      {/* HEADER NAV */}
      <nav className="h-16 flex items-center justify-between px-6 relative z-50"
        style={{ backgroundColor: t.panel, borderBottom: `1px solid ${t.border}` }}>
         <div className="flex items-center gap-8">
            <div>
               <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', margin: 0 }}>Mesa de Trabajo</h2>
               <p style={{ fontSize: '0.7rem', color: t.textDim, marginTop: '2px', fontWeight: 500 }}>Control de Producción & Hub de Negocios</p>
            </div>
            <div className="flex rounded-xl p-0.5" style={{ backgroundColor: 'transparent', border: `1px solid ${t.border}` }}>
                <button onClick={() => setViewState('dashboard')} className="px-5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all"
                  style={{
                    backgroundColor: viewState === 'dashboard' ? '#141414' : 'transparent',
                    border: viewState === 'dashboard' ? `1px solid ${t.accent}` : '1px solid transparent',
                    color: viewState === 'dashboard' ? t.accent : t.textDim,
                  }}>Dashboard</button>
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
                  }}>Proyectos de Edición</button>
            </div>
         </div>
         <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl" style={{ backgroundColor: 'transparent', border: `1px solid ${t.border}` }}>
               <div className="w-1.5 h-1.5 rounded-xl animate-pulse" style={{ backgroundColor: t.accent }}></div>
               <span className="text-[8px] font-black uppercase tracking-widest" style={{ color: t.accent }}>System Online</span>
            </div>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center overflow-hidden" style={{ backgroundColor: t.panel, border: `1px solid ${t.border}` }}>
              <UserIcon size={16} color={t.textDim}/>
            </div>
         </div>
       </nav>

       {/* WORK DESK DASHBOARD */}
       {viewState === 'dashboard' && (
          <div className="flex flex-col flex-1 min-h-0 p-6 space-y-6 max-w-[1400px] mx-auto w-full animate-in fade-in duration-500 overflow-y-auto mac-scrollbar">
             <div className="grid grid-cols-4 gap-4">
                {[
                  { label: 'Clientes Nexus', val: clients.length, subtitle: 'Activos en directorio', icon: Users, tab: 'client-list' },
                  { label: 'Marcas Agencia', val: agencyClients.length, subtitle: 'Empresas Pro', icon: Building2, tab: 'agency-hub' },
                  { label: 'Proyectos de Edición', val: JSON.parse(localStorage.getItem('inefable_proyectos_edicion') || '[]').length, subtitle: 'Mesa de producción', icon: Briefcase, tab: 'project-engine' },
                  { label: 'Sesiones Totales', val: meetingsList.length, subtitle: 'Reuniones de trabajo', icon: Video, tab: 'client-list' }
                ].map((s, i) => (
                  <div key={i} onClick={() => setViewState(s.tab)} className="flex items-center justify-between p-5 cursor-pointer transition-all hover:scale-[1.02]"
                    style={{ backgroundColor: t.panel, border: `1px solid ${t.border}`, borderRadius: 14 }}>
                     <div>
                        <p className="text-[8px] font-black uppercase tracking-widest mb-1" style={{ color: t.textDim }}>{s.label}</p>
                        <p className="text-2xl font-light text-white tracking-tight">{s.val}</p>
                        <p className="text-[8px] text-neutral-500 font-semibold uppercase tracking-wider mt-1">{s.subtitle}</p>
                     </div>
                     <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/2" style={{ border: `1px solid ${t.border}`, color: t.accent }}>
                       <s.icon size={18} />
                     </div>
                  </div>
                ))}
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                <div className="lg:col-span-2 p-6 rounded-3xl border border-white/5 flex flex-col gap-4" style={{ backgroundColor: t.panel, borderColor: t.border }}>
                   <div>
                      <h3 className="text-xs font-black uppercase tracking-wider text-white mb-1">Actividad Reciente</h3>
                      <p className="text-[10px] text-neutral-400 font-medium">Últimas interacciones y sesiones en el sistema</p>
                   </div>
                   <div className="flex flex-col gap-3 min-h-[220px]">
                      {meetingsList.slice(0, 5).map(m => (
                         <div key={m.id} onClick={() => openMeeting(m)} className="p-3.5 rounded-xl border border-white/5 bg-zinc-950/20 flex justify-between items-center text-xs cursor-pointer hover:bg-white/5 transition-all">
                            <div className="flex items-center gap-3">
                               <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/2" style={{ border: `1px solid ${t.border}` }}>
                                  <Video size={14} color={t.accent} />
                               </div>
                               <div>
                                  <p className="font-bold text-white uppercase">{m.session_title}</p>
                                  <p className="text-[8px] text-neutral-500 mt-0.5">Cliente: {m.cliente} • {m.fecha}</p>
                               </div>
                            </div>
                            <span className="font-mono text-[9px] font-bold text-neutral-400">{formatTime(m.total_time)}</span>
                         </div>
                      ))}
                      {meetingsList.length === 0 && (
                         <div className="flex flex-col items-center justify-center text-center p-8 text-neutral-500 h-full border border-dashed border-white/5 rounded-2xl flex-1">
                            <p className="text-[10px] uppercase font-black tracking-wider text-neutral-400">Sin actividad reciente</p>
                         </div>
                      )}
                   </div>
                </div>

                <div className="p-6 rounded-3xl border border-white/5 flex flex-col gap-4" style={{ backgroundColor: t.panel, borderColor: t.border }}>
                   <div>
                      <h3 className="text-xs font-black uppercase tracking-wider text-white mb-1">Últimos Clientes Registrados</h3>
                      <p className="text-[10px] text-neutral-400 font-medium">Agregados recientemente al directorio</p>
                   </div>
                   <div className="flex flex-col gap-3">
                      {clients.slice(0, 4).map(cl => (
                         <div key={cl.id} onClick={() => openClientProfile(cl)} className="flex items-center gap-3 p-2 rounded-xl cursor-pointer hover:bg-white/5 transition-all">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden bg-white/2" style={{ border: `1px solid ${t.border}` }}>
                               {cl.foto_url ? (
                                  <img src={cl.foto_url} alt="" className="w-full h-full object-cover" />
                               ) : (
                                  <span className="text-[10px] font-bold" style={{ color: t.textDim }}>{cl.nombre.charAt(0)}</span>
                                )}
                            </div>
                            <div>
                               <p className="text-[11px] font-bold text-white uppercase">{cl.nombre}</p>
                               <p className="text-[7.5px] text-neutral-500 uppercase">{cl.empresa || 'Independiente'}</p>
                            </div>
                         </div>
                      ))}
                      {clients.length === 0 && (
                         <p className="text-[9px] text-neutral-500 italic text-center py-6">No hay clientes registrados.</p>
                      )}
                   </div>
                </div>
             </div>
          </div>
       )}

       {/* CLIENTS LIST */}
       {viewState === 'client-list' && (
        <div className="flex flex-col flex-1 min-h-0 p-6 space-y-6 max-w-[1400px] mx-auto w-full animate-in fade-in duration-500 overflow-y-auto mac-scrollbar">
             <header className="flex justify-between items-end pt-4">
                <div>
                   <h2 className="text-base font-black uppercase tracking-wider text-white">Directorio de Nexus Clientes</h2>
                </div>
                <div className="flex gap-3">
                   <div className="relative">
                      <input type="text" value={clientSearch} onChange={e=>setClientSearch(e.target.value)} placeholder="FILTRAR..."
                        className="rounded-lg py-2.5 pl-4 pr-5 text-[9px] font-black uppercase tracking-widest outline-none w-56 transition-all"
                        style={{ backgroundColor: t.panel, border: `1px solid ${t.border}`, color: t.text }} />
                   </div>
                   <button onClick={() => setIsClientModalOpen(true)} className="px-5 py-2.5 rounded-lg font-black text-[9px] uppercase tracking-widest flex items-center gap-2 transition-all"
                     style={{ backgroundColor: t.panel, border: `1px solid ${t.accent}`, color: t.accent }}>
                      <Plus size={14} strokeWidth={2}/> Añadir Registro
                   </button>
                </div>
             </header>

             <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 pt-2">
                {uniqueClients.map(cl => (
                  <div key={cl.id} className="p-5 flex flex-col items-center justify-center group relative overflow-hidden aspect-square cursor-pointer transition-all hover:bg-white/2"
                    style={{ backgroundColor: t.panel, border: `1px solid ${t.border}`, borderRadius: 12 }}>
                     
                     <div onClick={() => openClientProfile(cl)} className="w-16 h-16 rounded-full flex items-center justify-center overflow-hidden mb-4" style={{ border: `1px solid ${t.border}` }}>
                        {cl.foto_url ? (
                          <img src={cl.foto_url} alt={cl.nombre} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xl font-bold" style={{ color: t.textDim }}>{cl.nombre.charAt(0)}</span>
                        )}
                     </div>

                     <p onClick={() => openClientProfile(cl)} className="text-xs font-black uppercase tracking-wider truncate w-full text-center mb-1 text-white">{cl.nombre}</p>
                     <p onClick={() => openClientProfile(cl)} className="text-[7px] font-bold uppercase tracking-widest mb-3" style={{ color: t.textDim }}>{cl.empresa || 'Independiente'}</p>
                     
                     <div onClick={() => openClientProfile(cl)} className="flex flex-col items-center gap-0.5 mb-2">
                        <span className="text-[7px] font-bold uppercase tracking-wider" style={{ color: t.textMuted }}>{cl.nacionalidad || 'Global'}</span>
                        <span className="text-[7px] font-mono" style={{ color: t.textDim }}>{cl.telefono || 'Sin Teléfono'}</span>
                     </div>

                     <div onClick={() => openClientProfile(cl)} className="mt-2 w-full pt-3 flex items-center justify-between opacity-50 group-hover:opacity-100 transition-all" style={{ borderTop: `1px solid ${t.border}` }}>
                        <span className="text-[7px] font-black uppercase tracking-widest" style={{ color: t.accent }}>Enlace</span>
                        <ChevronRight size={10} color={t.accent}/>
                     </div>

                     <button onClick={(e) => handleDeleteClient(cl, e)} className="absolute top-2 right-2 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-500/10 text-neutral-500 hover:text-rose-400" title="Eliminar Cliente">
                        <Trash2 size={12}/>
                     </button>
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
                 style={{ backgroundColor: t.panel, border: `1px solid ${t.border}` }}>
                 <ArrowLeft size={16} color={t.textDim}/>
               </button>
               <div>
                 <h3 className="text-base font-black uppercase tracking-wider text-white">{activeClient.nombre}</h3>
                 <p className="text-[8px] font-bold uppercase tracking-widest" style={{ color: t.textDim }}>{activeClient.empresa || 'Independent Production'}</p>
               </div>
             </div>
             <button onClick={createMeeting} className="px-5 py-2.5 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-2 transition-all"
               style={{ backgroundColor: t.panel, border: `1px solid ${t.accent}`, color: t.accent }}>
               <Video size={14}/> Iniciar Sesión
             </button>
           </header>

           <div className="space-y-3 pt-2">
             {filteredMeetings.map(m => (
               <div key={m.id} className="flex items-center justify-between p-4 cursor-pointer transition-all hover:bg-white/2"
                 style={{ backgroundColor: t.panel, border: `1px solid ${t.border}`, borderRadius: 12 }}>
                 <div onClick={() => openMeeting(m)} className="flex-1 flex items-center gap-4">
                   <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ border: `1px solid ${t.border}` }}>
                     <FileVideo size={18} color={t.accent}/>
                   </div>
                   <div>
                     <h4 className="text-sm font-black uppercase tracking-wider text-white">{m.session_title}</h4>
                     <p className="text-[8px] font-mono text-neutral-400">{m.fecha}</p>
                   </div>
                 </div>
                 <div className="flex items-center gap-4">
                   <div className="text-right">
                     <p className="text-[7px] font-bold uppercase mb-0.5" style={{ color: t.textDim }}>Tiempo Registrado</p>
                     <p className="text-sm font-bold font-mono text-white">{formatTime(m.total_time)}</p>
                   </div>
                   <button onClick={(e) => handleDeleteMeeting(m, e)} className="p-2 rounded-lg text-neutral-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all" title="Eliminar Sesión">
                     <Trash2 size={13}/>
                   </button>
                 </div>
               </div>
             ))}
             {filteredMeetings.length === 0 && (
               <div className="text-center py-10 rounded-lg" style={{ backgroundColor: t.panel, border: `1px dashed ${t.border}` }}>
                 <p className="text-[8px] font-black uppercase tracking-widest" style={{ color: t.textDim }}>Sin sesiones registradas. Comienza un nuevo flujo.</p>
               </div>
             )}
           </div>
        </div>
       )}

       {/* AGENCY HUB */}
       {viewState === 'agency-hub' && (
        <div className="flex flex-col flex-1 min-h-0 p-6 space-y-6 max-w-[1400px] mx-auto w-full animate-in fade-in duration-500 overflow-y-auto mac-scrollbar">
             <header className="flex justify-between items-end pt-4">
                <div>
                   <h2 className="text-base font-black uppercase tracking-wider text-white">Agency Pro Planificador</h2>
                </div>
                <button onClick={() => setIsCompanyModalOpen(true)} className="px-5 py-2.5 rounded-lg font-black text-[9px] uppercase tracking-widest transition-all flex items-center gap-2"
                  style={{ backgroundColor: t.panel, border: `1px solid ${t.accent}`, color: t.accent }}>
                  <Plus size={14} strokeWidth={2}/> Nueva Marca
                </button>
             </header>

             {/* Filter buttons styled minimal */}
             <div className="grid grid-cols-4 gap-2 p-1 rounded-xl" style={{ backgroundColor: t.panel, border: `1px solid ${t.border}` }}>
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

               <div className="p-4 rounded-xl overflow-x-auto mac-scrollbar" style={{ backgroundColor: t.panel, border: `1px solid ${t.border}` }}>
                 <div className="min-w-[900px] space-y-3">
                   {filteredAgencyClients.map((company, idx) => {
                     const meta = company.metadata || {};
                     const metrics = meta.metrics || { loyalty: 'Normal', payment: 'A tiempo', growth: 'Estable' };
                     const isPremium = metrics.loyalty === 'VIP' || metrics.growth === 'Top Tier';
                     
                     return (
                       <div key={company.id} onClick={() => { setSelectedCompany(company); fetchStrategies(company.id); setViewState('agency-session'); }} className="flex items-center gap-6 p-4 rounded-lg cursor-pointer relative overflow-hidden transition-all hover:bg-white/2"
                         style={{ backgroundColor: t.panel, border: `1px solid ${t.border}` }}>
                         {isPremium && <div className="absolute top-1 right-1"><Crown size={10} color={t.accent}/></div>}
                         
                         <div className="w-24 shrink-0">
                           <h4 className="text-xs font-black uppercase truncate text-white">{company.nombre_empresa}</h4>
                           <p className="text-[7px] font-bold uppercase" style={{ color: t.textDim }}>{company.dueño}</p>
                         </div>

                         <div className="flex-1 flex items-center gap-3">
                           <div className="flex-1 h-1.5 rounded-full overflow-hidden relative" style={{ backgroundColor: t.panel, border: `1px solid ${t.border}` }}>
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
                                    backgroundColor: t.panel,
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
                     <div className="py-10 text-center rounded-lg" style={{ border: `1px dashed ${t.border}`, backgroundColor: t.panel }}>
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
                 style={{ backgroundColor: t.panel, border: `1px solid ${t.border}` }}>
                 <ArrowLeft size={16} color={t.textDim}/>
               </button>
               <div>
                 <h3 className="text-base font-black uppercase tracking-wider text-white">{selectedCompany.nombre_empresa}</h3>
                 <p className="text-[8px] font-bold uppercase tracking-widest" style={{ color: t.accent }}>{selectedCompany.plan}</p>
               </div>
             </div>
             <button onClick={createStrategy} className="px-5 py-2.5 rounded-lg font-black text-[9px] uppercase tracking-widest flex items-center gap-2 transition-all"
               style={{ backgroundColor: t.panel, border: `1px solid ${t.accent}`, color: t.accent }}>
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
                  className="flex items-center justify-between p-4 cursor-pointer transition-all hover:bg-white/2"
                  style={{ backgroundColor: t.panel, border: `1px solid ${t.border}`, borderRadius: 12 }}>
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
               <div className="text-center py-10 rounded-lg" style={{ backgroundColor: t.panel, border: `1px dashed ${t.border}` }}>
                 <p className="text-[8px] font-black uppercase tracking-widest" style={{ color: t.textDim }}>Sin estrategias planeadas para esta marca.</p>
               </div>
             )}
           </div>
        </div>
       )}

       {/* AGENCY STRATEGY EDITOR */}
       {viewState === 'agency-editor' && activeStrategy && (
        <div className="flex flex-col h-full overflow-hidden animate-in fade-in duration-400">
           <header className="px-4 py-3 flex items-center justify-between" style={{ backgroundColor: t.panel, borderBottom: `1px solid ${t.border}` }}>
             <div className="flex items-center gap-3">
               <button onClick={saveStrategy} className="w-8 h-8 rounded-lg flex items-center justify-center transition-all" style={{ backgroundColor: t.panel, border: `1px solid ${t.border}` }}>
                 <ArrowLeft size={16} color={t.textDim}/>
               </button>
               <div>
                 <h3 className="text-xs font-black uppercase text-white">{activeStrategy.titulo_estrategia}</h3>
                 <p className="text-[7px] font-black uppercase tracking-widest text-neutral-400">{selectedCompany?.nombre_empresa}</p>
               </div>
             </div>
             <div className="flex items-center gap-3">
               <div className="flex items-center gap-2 px-3 py-1 rounded-lg text-sm font-mono font-bold" style={{ backgroundColor: t.panel, border: `1px solid ${t.border}`, color: 'white' }}>
                 {formatTime(time)}
                 <button onClick={() => setIsTimerRunning(!isTimerRunning)} className="w-6 h-6 rounded flex items-center justify-center" style={{ backgroundColor: t.panel, border: `1px solid ${t.accent}`, color: t.accent }}>
                   {isTimerRunning ? <Pause size={10}/> : <Play size={10}/>}
                 </button>
                 <button onClick={() => { setTime(0); setIsTimerRunning(false); }} className="w-6 h-6 rounded flex items-center justify-center" style={{ border: `1px solid ${t.border}` }}>
                   <RotateCcw size={10} color={t.textDim}/>
                 </button>
               </div>
               <button onClick={saveStrategy} className="px-4 py-2 text-[9px] font-black rounded-lg uppercase tracking-wider flex items-center gap-1.5 transition-all"
                 style={{ backgroundColor: t.panel, border: `1px solid ${t.accent}`, color: t.accent }}>
                 <Save size={12}/> Guardar
               </button>
             </div>
           </header>
           <div className="flex-1 flex p-3 gap-3 overflow-hidden max-w-[1600px] mx-auto w-full">
             <div className="flex-1 rounded-lg overflow-hidden flex flex-col" style={{ backgroundColor: t.panel, border: `1px solid ${t.border}` }}>
               <div className="px-3 py-2 flex items-center gap-1 flex-wrap" style={{ borderBottom: `1px solid ${t.border}`, backgroundColor: t.panel }}>
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
               <div className="grid grid-cols-2 p-0.5 rounded-lg" style={{ backgroundColor: t.panel, border: `1px solid ${t.border}` }}>
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
                   <div className="grid grid-cols-4 p-0.5 rounded-lg gap-1" style={{ backgroundColor: t.panel, border: `1px solid ${t.border}` }}>
                     {['BOB', 'USD', 'EUR', 'BRL'].map(cur => (
                       <button key={cur} onClick={() => setAgencySessionCurrency(cur)}
                         className="py-1 rounded text-[7px] font-black"
                         style={{ backgroundColor: agencySessionCurrency === cur ? '#141414' : 'transparent', border: agencySessionCurrency === cur ? `1px solid ${t.accent}` : '1px solid transparent', color: agencySessionCurrency === cur ? t.accent : t.textDim }}>
                         {cur}
                       </button>
                     ))}
                   </div>
                   <div className="p-3 rounded-lg text-right" style={{ backgroundColor: t.panel, border: `1px solid ${t.border}`, color: 'white' }}>
                     <p className="text-[7px] font-black uppercase tracking-wider mb-0.5" style={{ color: t.accent }}>{agencySessionCurrency}</p>
                     <p className="text-base font-mono font-bold">{calcDisplay}</p>
                   </div>
                   <div className="grid grid-cols-4 gap-1">
                     {['C','DEL','%','/','7','8','9','*','4','5','6','-','1','2','3','+','0','.','='].map(btn => (
                       <button key={btn} onClick={() => btn === '=' ? handleCalc('=') : handleCalc(btn)} className="h-8 rounded text-[8px] font-black transition-all"
                         style={{ backgroundColor: t.panel, border: `1px solid ${btn === '=' ? t.accent : t.border}`, color: btn === '=' ? t.accent : t.textDim }}>
                         {btn}
                       </button>
                     ))}
                   </div>
                   <button onClick={() => { setAgencySessionPrice(calcDisplay !== '0' ? calcDisplay : agencySessionPrice); setAgencySideTab('info'); }}
                     className="w-full py-2 rounded-lg text-[8px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5"
                     style={{ backgroundColor: t.panel, border: `1px solid ${t.border}`, color: t.textMuted }}>
                     <DollarSign size={10}/> Fijar Presupuesto
                   </button>
                 </div>
               )}
               {agencySideTab === 'info' && (
                 <div className="flex flex-col gap-3">
                   <div className="p-3 rounded-lg space-y-2.5" style={{ backgroundColor: t.panel, border: `1px solid ${t.border}` }}>
                     <p className="text-[7px] font-black uppercase tracking-widest" style={{ color: t.accent }}>📅 Reunión Planificada</p>
                     <div>
                       <p className="text-[7px] font-bold uppercase ml-0.5 mb-1" style={{ color: t.textDim }}>Siguiente Sesión</p>
                       <input type="date" value={agencyNextDate} onChange={e => setAgencyNextDate(e.target.value)}
                         className="w-full px-2.5 py-1.5 rounded text-[10px] outline-none"
                         style={{ backgroundColor: t.panel, border: `1px solid ${t.border}`, color: t.text }} />
                     </div>
                   </div>
                   <div className="p-3 rounded-lg space-y-2.5" style={{ backgroundColor: t.panel, border: `1px solid ${t.border}` }}>
                     <p className="text-[7px] font-black uppercase tracking-widest" style={{ color: t.accent }}>🔗 Enlaces Nexus</p>
                     <div>
                       <p className="text-[7px] font-bold uppercase ml-0.5 mb-1" style={{ color: t.textDim }}>Link de Llamada</p>
                       <input type="url" value={agencyMeetLink} onChange={e => setAgencyMeetLink(e.target.value)} placeholder="meet.google.com/..."
                         className="w-full px-2.5 py-1.5 rounded text-[10px] outline-none"
                         style={{ backgroundColor: t.panel, border: `1px solid ${t.border}`, color: t.text }} />
                     </div>
                     <div>
                       <p className="text-[7px] font-bold uppercase ml-0.5 mb-1" style={{ color: t.textDim }}>Carpeta de Contenidos</p>
                       <input type="url" value={agencyDriveLink} onChange={e => setAgencyDriveLink(e.target.value)} placeholder="drive.google.com/..."
                         className="w-full px-2.5 py-1.5 rounded text-[10px] outline-none"
                         style={{ backgroundColor: t.panel, border: `1px solid ${t.border}`, color: t.text }} />
                     </div>
                   </div>
                   <div className="p-3 rounded-lg space-y-2.5" style={{ backgroundColor: t.panel, border: `1px solid ${t.border}` }}>
                     <p className="text-[7px] font-black uppercase tracking-widest" style={{ color: t.accent }}>💰 Ingreso Estimado</p>
                     <div className="flex gap-2 items-center">
                       <span className="text-[9px] font-bold text-neutral-400">{agencySessionCurrency}</span>
                       <input type="number" value={agencySessionPrice} onChange={e => setAgencySessionPrice(e.target.value)}
                         placeholder="0.00" className="flex-1 px-2.5 py-1.5 rounded text-[10px] font-mono outline-none"
                         style={{ backgroundColor: t.panel, border: `1px solid ${t.border}`, color: t.text }} />
                     </div>
                     <button onClick={() => registerSessionIncome(selectedCompany?.nombre_empresa || 'Empresa', activeStrategy.titulo_estrategia, agencySessionPrice, agencySessionCurrency, true)}
                       disabled={!agencySessionPrice || parseFloat(agencySessionPrice) <= 0 || agencyPriceRegistered}
                       className="w-full py-2 rounded-lg text-[8px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5"
                       style={{ 
                         backgroundColor: t.panel,
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
          <header className="px-4 py-3 flex items-center justify-between" style={{ backgroundColor: t.panel, borderBottom: `1px solid ${t.border}` }}>
            <div className="flex items-center gap-3">
              <button onClick={saveMeeting} className="w-8 h-8 rounded-lg flex items-center justify-center transition-all" style={{ backgroundColor: t.panel, border: `1px solid ${t.border}` }}>
                <ArrowLeft size={16} color={t.textDim}/>
              </button>
              <div>
                <h3 className="text-xs font-black uppercase text-white">{activeMeeting.session_title}</h3>
                <p className="text-[7px] font-black uppercase tracking-widest text-neutral-400">{activeClient?.nombre}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1 rounded-lg text-sm font-mono font-bold" style={{ backgroundColor: t.panel, border: `1px solid ${t.border}`, color: 'white' }}>
                {formatTime(time)}
                <button onClick={() => setIsTimerRunning(!isTimerRunning)} className="w-6 h-6 rounded flex items-center justify-center" style={{ backgroundColor: t.panel, border: `1px solid ${t.accent}`, color: t.accent }}>
                  {isTimerRunning ? <Pause size={10}/> : <Play size={10}/>}
                </button>
                <button onClick={() => { setTime(0); setIsTimerRunning(false); }} className="w-6 h-6 rounded flex items-center justify-center" style={{ border: `1px solid ${t.border}` }}>
                  <RotateCcw size={10} color={t.textDim}/>
                </button>
              </div>
              <button onClick={saveMeeting} className="px-4 py-2 text-[9px] font-black rounded-lg uppercase tracking-wider flex items-center gap-1.5 transition-all"
                style={{ backgroundColor: t.panel, border: `1px solid ${t.accent}`, color: t.accent }}>
                <Save size={12}/> Guardar
              </button>
            </div>
          </header>
          <div className="flex-1 flex p-3 gap-3 overflow-hidden max-w-[1600px] mx-auto w-full">
            <div className="flex-1 rounded-lg overflow-hidden flex flex-col" style={{ backgroundColor: t.panel, border: `1px solid ${t.border}` }}>
              {/* Espacio vacío según requerimiento para futura herramienta */}
            </div>
          </div>
        </div>
       )}

       {/* PROJECT ENGINE VIEW (VIDEO EDITING PROJECTS) */}
       {viewState === 'project-engine' && (
          <ProjectEngineView isDark={isDark} />
       )}

       {/* Modal de Nueva Compañía (Agencia Pro) */}
       {isCompanyModalOpen && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <div className="border border-white/10 rounded-2xl w-full max-w-md p-6 animate-in zoom-in-95 duration-200" style={{ backgroundColor: t.panel }}>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-black uppercase tracking-wider text-white">Nueva Marca de Agencia</h3>
                <button onClick={() => setIsCompanyModalOpen(false)} className="text-neutral-400 hover:text-white transition-colors">
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1 mac-scrollbar">
                <div>
                  <label className="text-[8px] font-black uppercase tracking-widest text-neutral-400 block mb-2">Nombre de la Empresa *</label>
                  <input type="text" value={newCompany.nombre_empresa} onChange={e => setNewCompany({ ...newCompany, nombre_empresa: e.target.value })}
                    className="w-full bg-zinc-950/40 border border-white/5 rounded-xl px-4 py-2.5 text-xs outline-none text-white focus:border-white/20 transition-all" placeholder="Ej: Nexus Agency" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[8px] font-black uppercase tracking-widest text-neutral-400 block mb-2">Dueño *</label>
                    <input type="text" value={newCompany.dueño} onChange={e => setNewCompany({ ...newCompany, dueño: e.target.value })}
                      className="w-full bg-zinc-950/40 border border-white/5 rounded-xl px-4 py-2.5 text-xs outline-none text-white focus:border-white/20 transition-all" placeholder="Nombre..." />
                  </div>
                  <div>
                    <label className="text-[8px] font-black uppercase tracking-widest text-neutral-400 block mb-2">Teléfono</label>
                    <input type="text" value={newCompany.telefono} onChange={e => setNewCompany({ ...newCompany, telefono: e.target.value })}
                      className="w-full bg-zinc-950/40 border border-white/5 rounded-xl px-4 py-2.5 text-xs outline-none text-white focus:border-white/20 transition-all" placeholder="Ej: +591..." />
                  </div>
                </div>
                <div>
                  <label className="text-[8px] font-black uppercase tracking-widest text-neutral-400 block mb-2">Plan Suscrito</label>
                  <select value={newCompany.plan} onChange={e => setNewCompany({ ...newCompany, plan: e.target.value })}
                    className="w-full bg-zinc-950/40 border border-white/5 rounded-xl px-4 py-2.5 text-xs outline-none text-neutral-300 cursor-pointer focus:border-white/20 transition-all">
                    <option value="Básico">Básico</option>
                    <option value="Intermedio">Intermedio</option>
                    <option value="Avanzado">Avanzado</option>
                    <option value="Personalizado">Personalizado</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-6 border-t border-white/5 mt-6">
                <button onClick={() => setIsCompanyModalOpen(false)} className="flex-1 py-3 bg-zinc-950/40 border border-white/5 rounded-xl text-[9px] font-black uppercase tracking-widest text-neutral-400 hover:text-white transition-colors">Cancelar</button>
                <button onClick={handleCreateAgencyClient} className="flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest text-black" style={{ backgroundColor: t.accent }}>Crear Marca</button>
              </div>
            </div>
          </div>
       )}

       {/* Modal de Nuevo Cliente */}
       {isClientModalOpen && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <div className="border border-white/10 rounded-2xl w-full max-w-md p-6 animate-in zoom-in-95 duration-200" style={{ backgroundColor: t.panel }}>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-black uppercase tracking-wider text-white">Registrar Nuevo Cliente</h3>
                <button onClick={() => setIsClientModalOpen(false)} className="text-neutral-400 hover:text-white transition-colors">
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[8px] font-black uppercase tracking-widest text-neutral-400 block mb-2">Nombre Completo *</label>
                  <input type="text" value={newClient.nombre} onChange={e => setNewClient({ ...newClient, nombre: e.target.value })}
                    className="w-full bg-zinc-950/40 border border-white/5 rounded-xl px-4 py-2.5 text-xs outline-none text-white focus:border-white/20 transition-all" placeholder="Ej: John Doe" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[8px] font-black uppercase tracking-widest text-neutral-400 block mb-2">Empresa / Proyecto</label>
                    <input type="text" value={newClient.empresa} onChange={e => setNewClient({ ...newClient, empresa: e.target.value })}
                      className="w-full bg-zinc-950/40 border border-white/5 rounded-xl px-4 py-2.5 text-xs outline-none text-white focus:border-white/20 transition-all" placeholder="Opcional..." />
                  </div>
                  <div>
                    <label className="text-[8px] font-black uppercase tracking-widest text-neutral-400 block mb-2">Nacionalidad</label>
                    <input type="text" value={newClient.nacionalidad} onChange={e => setNewClient({ ...newClient, nacionalidad: e.target.value })}
                      className="w-full bg-zinc-950/40 border border-white/5 rounded-xl px-4 py-2.5 text-xs outline-none text-white focus:border-white/20 transition-all" placeholder="Ej: Bolivia" />
                  </div>
                </div>
                <div>
                  <label className="text-[8px] font-black uppercase tracking-widest text-neutral-400 block mb-2">Teléfono de Contacto</label>
                  <input type="text" value={newClient.telefono} onChange={e => setNewClient({ ...newClient, telefono: e.target.value })}
                    className="w-full bg-zinc-950/40 border border-white/5 rounded-xl px-4 py-2.5 text-xs outline-none text-white focus:border-white/20 transition-all" placeholder="Ej: +5917..." />
                </div>
              </div>

              <div className="flex gap-3 pt-6 border-t border-white/5 mt-6">
                <button onClick={() => setIsClientModalOpen(false)} className="flex-1 py-3 bg-zinc-950/40 border border-white/5 rounded-xl text-[9px] font-black uppercase tracking-widest text-neutral-400 hover:text-white transition-colors">Cancelar</button>
                <button onClick={handleCreateClient} className="flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest text-black" style={{ backgroundColor: t.accent }}>Guardar Cliente</button>
              </div>
            </div>
          </div>
       )}

    </div>
  );
};

const ProjectEngineView = ({ isDark = true }) => {
  const t = useTheme(isDark);

  const [cliente, setCliente] = useState('');
  const [proyecto, setProyecto] = useState('');
  const [customDate, setCustomDate] = useState('');
  const [selectedPremiere, setSelectedPremiere] = useState('');
  const [selectedAE, setSelectedAE] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [destinationPath, setDestinationPath] = useState('');
  const [dirHandle, setDirHandle] = useState(null);

  const [treeCollapsed, setTreeCollapsed] = useState({
    client: false, project: false, pr: false, ae: false,
  });

  const templates = [
    '1080x1920_25fps', '1080x1920_30fps', '1080x1920_60fps',
    '1920x1080_25fps', '1920x1080_30fps', '1920x1080_60fps',
    '4K_Horizontal_25fps', '4K_Horizontal_30fps', '4K_Horizontal_60fps',
    '4K_Vertical_25fps', '4K_Vertical_30fps', '4K_Vertical_60fps'
  ];

  const cleanFolderName = (txt) => txt.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_áéíóúÁÉÍÓÚüÜñÑ-]/g, '');
  const today = new Date().toISOString().split('T')[0];
  const effectiveDate = customDate || today;
  const safeCliente = cliente ? cleanFolderName(cliente) : '';
  const safeProyecto = cleanFolderName(proyecto || 'PROYECTO');
  const formatDateShort = (dateStr) => {
    const [y, m, d] = dateStr.split('-');
    return `${d}-${m}-${y.slice(-2)}`;
  };
  const finalProjectFolderName = `${safeProyecto}_${formatDateShort(effectiveDate)}`;

  const handleSelectDirectory = async () => {
    try {
      if (window.electronAPI) {
        const path = await window.electronAPI.selectDirectory();
        if (path) setDestinationPath(path);
      } else {
        if (!window.showDirectoryPicker) {
          alert('La creación real de carpetas solo está disponible en la app de escritorio o en navegadores compatibles.');
          return;
        }
        const handle = await window.showDirectoryPicker({ mode: 'readwrite' });
        setDirHandle(handle);
        setDestinationPath(handle.name);
      }
    } catch (e) {
      if (e.name !== 'AbortError' && e.name !== 'SecurityError') {
        console.error(e);
      }
    }
  };

  const ensureDir = async (parentHandle, pathParts) => {
    let current = parentHandle;
    for (const part of pathParts) {
      if (part) {
        current = await current.getDirectoryHandle(part, { create: true });
      }
    }
    return current;
  };

  const writeFile = async (dirHandle, fileName, content) => {
    const fileHandle = await dirHandle.getFileHandle(fileName, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(content);
    await writable.close();
  };

  const copyTemplateToDir = async (dir, fileName, templatePath) => {
    try {
      const res = await fetch(templatePath);
      if (res.ok) {
        const blob = await res.blob();
        await writeFile(dir, fileName, blob);
        return true;
      }
    } catch {}
    await writeFile(dir, fileName, '');
    return false;
  };

  const handleGenerate = async () => {
    if (!proyecto) {
      alert('El nombre del proyecto es obligatorio.');
      return;
    }
    if (!dirHandle && !window.electronAPI) {
      alert('Primero selecciona un directorio de destino con el botón "Vincular".');
      return;
    }
    if (window.electronAPI && !destinationPath) {
      alert('Primero selecciona un directorio de destino con el botón "Vincular".');
      return;
    }
    setIsGenerating(true);
    setStatusMsg('Creando estructura...');
    try {
      const folderName = finalProjectFolderName;

      if (window.electronAPI) {
        const result = await window.electronAPI.createFolderStructure({
          rootPath: destinationPath,
          cliente,
          proyecto,
          projectDate: effectiveDate,
          templates: { premiere: selectedPremiere, afterEffects: selectedAE }
        });
        if (result && result.success) {
          setStatusMsg(`Estructura creada exitosamente en: ${result.projectPath || destinationPath}`);
        } else {
          setStatusMsg(`Error: ${result ? result.error : 'Desconocido'}`);
        }
      } else if (dirHandle) {
        let rootDir = dirHandle;

        if (cliente) {
          rootDir = await ensureDir(rootDir, [safeCliente]);
        }

        const projectDir = await ensureDir(rootDir, [folderName]);

        const subdirs = ['01_PR', '02_AE', '03_Videos', '04_Audios', '05_Imágenes'];

        for (const sub of subdirs) {
          await ensureDir(projectDir, [sub]);
        }

        if (selectedPremiere) {
          const prDir = await ensureDir(projectDir, ['01_PR']);
          await copyTemplateToDir(prDir, `${folderName}.prproj`, `/plantillas_adobe/premiere_pro/${selectedPremiere}.prproj`);
        }

        if (selectedAE) {
          const aeDir = await ensureDir(projectDir, ['02_AE']);
          await copyTemplateToDir(aeDir, `${folderName}.aep`, `/plantillas_adobe/after_effects/${selectedAE}.aep`);
        }

        setStatusMsg(`Estructura creada exitosamente en: ${destinationPath}${cliente ? '/' + safeCliente : ''}/${folderName}`);
      }
    } catch (err) {
      console.error(err);
      setStatusMsg(`Error al generar: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleTree = (key) => {
    setTreeCollapsed(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="flex-grow flex flex-col p-6 space-y-6 w-full animate-in fade-in duration-500 overflow-y-auto mac-scrollbar">
      <header className="flex justify-between items-center pb-4" style={{ borderBottom: `1px solid ${t.border}` }}>
        <div>
          <h2 className="text-base font-black uppercase tracking-wider text-white">Generador de Estructura de Proyectos</h2>
          <p className="text-[7.5px] font-bold uppercase tracking-widest" style={{ color: t.textDim }}>
            Crea carpetas y archivos .prproj / .aep para Premiere Pro y After Effects
          </p>
        </div>
        <div className="flex items-center gap-2 text-[8px] font-black uppercase text-neutral-400">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
          Sistema Activo
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-5">
          <div className="p-5 rounded-xl space-y-4" style={{ backgroundColor: t.panel, border: `1px solid ${t.border}` }}>
            <div className="flex items-center gap-2 pb-2" style={{ borderBottom: `1px solid ${t.border}` }}>
              <FolderOpen size={14} color={t.accent}/>
              <span className="text-[10px] font-black uppercase tracking-widest text-white">Configuración del Proyecto</span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-[7.5px] font-black uppercase tracking-wider text-neutral-400">Directorio de Destino</label>
                <div className="flex gap-2">
                  <input type="text" value={destinationPath || 'No seleccionado...'} disabled
                    className="flex-1 rounded p-2 text-[9px] font-mono outline-none truncate"
                    style={{ backgroundColor: t.panel, border: `1px solid ${t.border}`, color: t.textDim }} />
                  <button onClick={handleSelectDirectory} className="px-3 rounded text-[8px] font-black uppercase transition-all"
                    style={{ border: `1px solid ${t.accent}`, color: t.accent, backgroundColor: t.panel }}>Vincular</button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[7.5px] font-black uppercase tracking-wider text-neutral-400">
                  Cliente / Empresa <span style={{ color: t.textDim }}>(opcional)</span>
                </label>
                <input type="text" value={cliente} onChange={e=>setCliente(e.target.value)} placeholder="Ej: Urbanización"
                  className="w-full rounded p-2 text-[10px] outline-none"
                  style={{ backgroundColor: t.panel, border: `1px solid ${t.border}`, color: t.text }} />
              </div>

              <div className="space-y-1">
                <label className="text-[7.5px] font-black uppercase tracking-wider text-neutral-400">Nombre del Proyecto</label>
                <input type="text" value={proyecto} onChange={e=>setProyecto(e.target.value)} placeholder="Ej: Spot Comercial"
                  className="w-full rounded p-2 text-[10px] outline-none"
                  style={{ backgroundColor: t.panel, border: `1px solid ${t.border}`, color: t.text }} />
              </div>

              <div className="space-y-1">
                <label className="text-[7.5px] font-black uppercase tracking-wider text-neutral-400">
                  Fecha del Proyecto <span style={{ color: t.textDim }}>(vacío = hoy)</span>
                </label>
                <input type="date" value={customDate} onChange={e=>setCustomDate(e.target.value)}
                  className="w-full rounded p-2 text-[10px] outline-none"
                  style={{ backgroundColor: t.panel, border: `1px solid ${t.border}`, color: t.text }} />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[7.5px] font-black uppercase tracking-wider text-neutral-400">Plantilla Premiere Pro</label>
                  <select value={selectedPremiere} onChange={e=>setSelectedPremiere(e.target.value)}
                    className="w-full rounded p-2 text-[9px] outline-none cursor-pointer"
                    style={{ backgroundColor: t.panel, border: `1px solid ${t.border}`, color: t.text }}>
                    <option value="">Ninguna</option>
                    {templates.map(tmp => <option key={tmp} value={tmp}>{tmp}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[7.5px] font-black uppercase tracking-wider text-neutral-400">Plantilla After Effects</label>
                  <select value={selectedAE} onChange={e=>setSelectedAE(e.target.value)}
                    className="w-full rounded p-2 text-[9px] outline-none cursor-pointer"
                    style={{ backgroundColor: t.panel, border: `1px solid ${t.border}`, color: t.text }}>
                    <option value="">Ninguna</option>
                    {templates.map(tmp => <option key={tmp} value={tmp}>{tmp}</option>)}
                  </select>
                </div>
              </div>

              <button onClick={handleGenerate} disabled={isGenerating || !proyecto || (!dirHandle && !window.electronAPI)}
                className="w-full py-2.5 rounded font-black text-[9px] uppercase tracking-wider flex items-center justify-center gap-2 transition-all mt-2"
                style={{
                  backgroundColor: isGenerating || !proyecto ? t.panel : t.accent,
                  border: `1px solid ${isGenerating || !proyecto ? t.border : t.accent}`,
                  color: isGenerating || !proyecto ? t.textDim : '#000',
                  cursor: isGenerating || !proyecto ? 'not-allowed' : 'pointer'
                }}>
                {isGenerating ? 'Generando...' : 'Generar Estructura'}
              </button>
              {statusMsg && <p className="text-center text-[7.5px] font-black uppercase tracking-wider text-emerald-500 mt-1">{statusMsg}</p>}
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="p-5 rounded-xl space-y-3" style={{ backgroundColor: t.panel, border: `1px solid ${t.border}` }}>
            <div className="flex items-center justify-between pb-2" style={{ borderBottom: `1px solid ${t.border}` }}>
              <div className="flex items-center gap-2">
                <Grid size={14} color={t.accent}/>
                <span className="text-[10px] font-black uppercase tracking-widest text-white">Vista Previa del Árbol</span>
              </div>
              <span className="text-[7px] font-mono text-neutral-400">Estructura Dinámica</span>
            </div>

            <div className="font-mono text-[9px] space-y-1.5 text-neutral-300 pl-1 select-none overflow-y-auto max-h-[500px] mac-scrollbar">
              <div>
                {cliente ? (
                  <div>
                    <div className="flex items-center gap-1 cursor-pointer" onClick={() => toggleTree('client')}>
                      <ChevronDown size={10} className={`transform transition-transform ${treeCollapsed.client ? '-rotate-90' : ''}`}/>
                      <Folder size={10} color={t.accent}/>
                      <span className="font-bold">{safeCliente}</span>
                    </div>
                    {!treeCollapsed.client && (
                      <div className="pl-4 border-l border-neutral-800 space-y-1.5 mt-1.5">
                        <ProjectTreeNode t={t} folderName={finalProjectFolderName} treeCollapsed={treeCollapsed} toggleTree={toggleTree}
                           hasPr={!!selectedPremiere} hasAe={!!selectedAE} />
                      </div>
                    )}
                  </div>
                ) : (
                  <ProjectTreeNode t={t} folderName={finalProjectFolderName} treeCollapsed={treeCollapsed} toggleTree={toggleTree}
                    hasPr={!!selectedPremiere} hasAe={!!selectedAE} />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ProjectTreeNode = ({ t, folderName, treeCollapsed, toggleTree, hasPr, hasAe }) => (
  <div>
    <div className="flex items-center gap-1 cursor-pointer" onClick={() => toggleTree('project')}>
      <ChevronDown size={10} className={`transform transition-transform ${treeCollapsed.project ? '-rotate-90' : ''}`}/>
      <Folder size={10} color={t.accent}/>
      <span className="text-white truncate max-w-[300px]">{folderName}</span>
    </div>
    {!treeCollapsed.project && (
      <div className="pl-4 border-l border-neutral-800 space-y-1.5 mt-1.5">
        <div>
          <div className="flex items-center gap-1 cursor-pointer" onClick={() => toggleTree('pr')}>
            <ChevronDown size={10} className={`transform transition-transform ${treeCollapsed.pr ? '-rotate-90' : ''}`}/>
            <Folder size={10} color="#94a3b8"/>
            <span>01_PR</span>
          </div>
          {!treeCollapsed.pr && hasPr && (
            <div className="pl-4 border-l border-neutral-800 mt-1">
              <div className="flex items-center gap-1 text-[8.5px] text-neutral-400">
                <File size={9}/>
                <span>{folderName}.prproj</span>
              </div>
            </div>
          )}
        </div>
        <div>
          <div className="flex items-center gap-1 cursor-pointer" onClick={() => toggleTree('ae')}>
            <ChevronDown size={10} className={`transform transition-transform ${treeCollapsed.ae ? '-rotate-90' : ''}`}/>
            <Folder size={10} color="#94a3b8"/>
            <span>02_AE</span>
          </div>
          {!treeCollapsed.ae && hasAe && (
            <div className="pl-4 border-l border-neutral-800 mt-1">
              <div className="flex items-center gap-1 text-[8.5px] text-neutral-400">
                <File size={9}/>
                <span>{folderName}.aep</span>
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 text-neutral-400">
          <Folder size={10} color="#94a3b8"/>
          <span>03_Videos</span>
        </div>
        <div className="flex items-center gap-1 text-neutral-400">
          <Folder size={10} color="#94a3b8"/>
          <span>04_Audios</span>
        </div>
        <div className="flex items-center gap-1 text-neutral-400">
          <Folder size={10} color="#94a3b8"/>
          <span>05_Imágenes</span>
        </div>
      </div>
    )}
  </div>
);

export default EditorVideo;
