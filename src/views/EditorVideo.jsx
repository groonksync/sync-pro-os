import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Plus, Users, Video, PlayCircle, ArrowLeft, MessageSquare, Save, FileText, Eraser,
  Hash, DollarSign, FolderOpen, ExternalLink, Quote, X, Trash2, Search, Mail,
  Instagram, Youtube, Globe, CreditCard, Phone, Camera, Filter, MoreVertical,
  Calendar, CheckCircle2, Clock, Tag, Play, Pause, RotateCcw,
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
import NotionBlockEditor from '../components/NotionBlockEditor';
import FacturasArx from './FacturasArx';


const EditorVideo = ({ meetingsList = [], setMeetingsList, settings = {}, isDark = true, token }) => {
  const t = useTheme(isDark);
  const isMobile = settings?.isMobileMode || window.innerWidth < 768;
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
        item_id: client.id,
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
        item_id: meeting.id,
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

  const openStrategy = (s) => {
    setActiveStrategy(s);
    setEditorContent(s.contenido || '');
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
  };

  const createStrategy = async () => {
    if (!selectedCompany) return;
    const title = prompt('Título de la Estrategia:', 'Nueva Estrategia');
    if (!title) return;
    try {
      const { data, error } = await supabase.from('estrategias_agencia').insert([{ cliente_agencia_id: selectedCompany.id, titulo_estrategia: title, contenido: '', total_time: 0 }]).select();
      if (error) throw error;
      await fetchStrategies(selectedCompany.id);
      if (data && data[0]) {
        openStrategy(data[0]);
      }
    } catch (e) { alert(e.message); }
  };

  const saveStrategy = async () => {
    if (!activeStrategy) return;
    try {
      const content = editorContent;
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
    setEditorContent(meeting.contenido || '');
    setViewState('session');
  };

  const createMeeting = async () => {
    if (!activeClient) return;
    const sTitle = prompt('Descripción:', 'Sesión de Trabajo');
    if (!sTitle) return;
    try {
      const newMeetingObj = { 
        cliente_id: activeClient.id, 
        cliente: activeClient.nombre, 
        fecha: new Date().toISOString().split('T')[0], 
        session_title: sTitle, 
        contenido: '', 
        total_time: 0 
      };
      const { data, error } = await supabase.from('reuniones').insert([newMeetingObj]).select();
      if (error) throw error;
      
      const created = data && data[0] ? data[0] : { ...newMeetingObj, id: Date.now().toString() };
      
      if (setMeetingsList) {
        setMeetingsList(prev => [created, ...prev]);
      }
      await fetchClients(); 
      openMeeting(created);
    } catch (e) { alert(e.message); }
  };

  const saveMeeting = async () => {
    if (!activeMeeting) return;
    try {
      const content = editorContent;
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

      if (setMeetingsList) {
        setMeetingsList(prev => prev.map(m => m.id === activeMeeting.id ? { ...m, contenido: content, total_time: time, metadata } : m));
      }

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
      
      {/* HEADER NAV - only shown on main hub views, not inside sessions/profiles */}
      {['dashboard', 'client-list', 'agency-hub', 'facturas'].includes(viewState) && (
        <div className="w-full shrink-0">
          <nav className="h-14 flex items-center px-6 relative z-50 gap-1 max-w-[1400px] mx-auto w-full"
            style={{ backgroundColor: 'transparent', borderBottom: 'none' }}>
              {[
                { id: 'dashboard', label: 'Dashboard' },
                { id: 'client-list', label: 'Clientes' },
                { id: 'agency-hub', label: 'Agencia Pro' },
                { id: 'facturas', label: 'Facturas' },
              ].map(tab => (
                <button key={tab.id} onClick={() => setViewState(tab.id)}
                  className="px-5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center"
                  style={{
                    backgroundColor: viewState === tab.id ? t.panel : 'transparent',
                    border: viewState === tab.id ? `1px solid ${t.border}` : '1px solid transparent',
                    color: viewState === tab.id ? t.accent : t.textDim,
                    minHeight: '44px',
                  }}>{tab.label}</button>
              ))}
          </nav>
        </div>
      )}

       {/* WORK DESK DASHBOARD */}
       {viewState === 'dashboard' && (
          <div className="flex flex-col flex-1 min-h-0 p-6 space-y-6 max-w-[1400px] mx-auto w-full animate-in fade-in duration-500 overflow-y-auto mac-scrollbar">
             <div className="grid grid-cols-4 gap-4">
                {[
                  { label: 'Clientes Nexus', val: clients.length, subtitle: 'Activos en directorio', icon: Users, tab: 'client-list' },
                  { label: 'Marcas Agencia', val: agencyClients.length, subtitle: 'Empresas Pro', icon: Building2, tab: 'agency-hub' },
                  { label: 'Estrategias Agencia', val: strategies.length, subtitle: 'Roadmaps creados', icon: Target, tab: 'agency-hub' },
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
                        style={{ backgroundColor: 'transparent', border: `1px solid ${t.border}`, color: t.text }} />
                   </div>
                   <button onClick={() => setIsClientModalOpen(true)} className="px-5 py-2.5 rounded-lg font-black text-[9px] uppercase tracking-widest flex items-center gap-2 transition-all"
                     style={{ backgroundColor: t.accent, color: isDark ? '#000' : '#fff', minHeight: '44px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                   >
                     <Plus size={12} strokeWidth={3} /> Nuevo Cliente
                   </button>
                </div>
             </header>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pt-2">
                 {uniqueClients.map(cl => (
                   <div key={cl.id} onClick={() => openClientProfile(cl)} className="p-5 flex flex-col justify-between group relative overflow-hidden transition-all duration-300 rounded-2xl hover:bg-white/[0.04] cursor-pointer"
                     style={{ backgroundColor: 'rgba(20, 20, 20, 0.4)', border: `1px solid ${t.border}`, minHeight: 140 }}>
                      
                      {/* Header */}
                      <div className="flex items-center justify-between w-full mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden bg-white/[0.02]" style={{ border: `1px solid ${t.border}` }}>
                             {cl.foto_url ? (
                               <img src={cl.foto_url} alt={cl.nombre} className="w-full h-full object-cover" />
                             ) : (
                               <span className="text-xs font-bold" style={{ color: t.textDim }}>{cl.nombre.charAt(0)}</span>
                             )}
                          </div>
                          <div>
                            <h4 className="text-[11px] font-black uppercase tracking-wider text-white truncate max-w-[120px]">{cl.nombre}</h4>
                            <p className="text-[7px] font-mono text-neutral-500">{cl.empresa || 'Independiente'}</p>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          ACTIVO
                        </span>
                      </div>

                      {/* Body details (2 columns) */}
                      <div className="grid grid-cols-2 gap-4 pt-3 border-t border-white/5">
                        <div>
                          <span className="text-[7.5px] font-black uppercase tracking-wider text-neutral-500 block">Nacionalidad</span>
                          <span className="text-[10px] font-bold text-neutral-300 block mt-1">{cl.nacionalidad || 'Global'}</span>
                        </div>
                        <div>
                          <span className="text-[7.5px] font-black uppercase tracking-wider text-neutral-500 block">Teléfono</span>
                          <span className="text-[10px] font-mono text-neutral-300 block mt-1 truncate">{cl.telefono || 'Sin Teléfono'}</span>
                        </div>
                      </div>

                      {/* Delete button */}
                      <button onClick={(e) => { e.stopPropagation(); handleDeleteClient(cl, e); }} className="absolute top-2 right-2 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-500/10 text-neutral-500 hover:text-rose-400" title="Eliminar Cliente">
                         <Trash2 size={11}/>
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
               style={{ backgroundColor: t.accent, color: isDark ? '#000' : '#fff', minHeight: '44px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
             >
               <Plus size={12} strokeWidth={3} /> Crear Proyecto
             </button>
           </header>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pt-2">
             {filteredMeetings.map(m => (
               <div key={m.id} onClick={() => openMeeting(m)} className="p-5 flex flex-col justify-between group/session relative overflow-hidden transition-all duration-300 rounded-2xl hover:bg-white/[0.04] cursor-pointer"
                 style={{ backgroundColor: 'rgba(20, 20, 20, 0.4)', border: `1px solid ${t.border}`, minHeight: 140 }}>
                 
                 {/* Header */}
                 <div className="flex items-center justify-between w-full mb-4">
                   <div className="flex items-center gap-3">
                     <div className="w-8 h-8 rounded-full flex items-center justify-center bg-white/[0.02]" style={{ border: `1px solid ${t.border}` }}>
                       <FileVideo size={14} color={t.accent}/>
                     </div>
                     <div>
                       <h4 className="text-[11px] font-black uppercase tracking-wider text-white truncate max-w-[150px]">{m.session_title}</h4>
                       <p className="text-[7px] font-mono text-neutral-500">Sesión de Trabajo</p>
                     </div>
                   </div>
                   <span className="px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-widest bg-amber-500/10 text-amber-400 border border-amber-500/20">
                     RECIENTE
                   </span>
                 </div>

                 {/* Body details (2 columns) */}
                 <div className="grid grid-cols-2 gap-4 pt-3 border-t border-white/5">
                   <div>
                     <span className="text-[7.5px] font-black uppercase tracking-wider text-neutral-500 block">Fecha Creación</span>
                     <span className="text-[10px] font-mono text-neutral-300 block mt-1">{m.fecha}</span>
                   </div>
                   <div>
                     <span className="text-[7.5px] font-black uppercase tracking-wider text-neutral-500 block">Última Modificación</span>
                     <span className="text-[10px] font-mono text-neutral-300 block mt-1">Reciente</span>
                   </div>
                 </div>

                 {/* Delete button */}
                 <button onClick={(e) => { e.stopPropagation(); handleDeleteMeeting(m, e); }} 
                   className="absolute top-2 right-2 p-1.5 rounded-lg opacity-0 group-hover/session:opacity-100 transition-all hover:bg-rose-500/10 text-neutral-500 hover:text-rose-400" 
                   title="Eliminar Sesión">
                   <Trash2 size={11}/>
                 </button>
               </div>
             ))}
             {filteredMeetings.length === 0 && (
               <div className="col-span-full text-center py-10 rounded-xl" style={{ backgroundColor: 'rgba(20, 20, 20, 0.4)', border: `1px dashed ${t.border}` }}>
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
               style={{ backgroundColor: t.accent, color: isDark ? '#000' : '#fff', minHeight: '44px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
             >
               <Plus size={12} strokeWidth={3} /> Crear Marca
             </button>
           </header>
           <div className="space-y-3 pt-2">
             {strategies.map(s => (
                <div key={s.id} onClick={() => openStrategy(s)}
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
           <header className="px-4 py-3 flex items-center justify-between" style={{ backgroundColor: 'transparent', borderBottom: 'none' }}>
              <div className="flex items-center gap-3">
                <button onClick={saveStrategy} className="w-8 h-8 rounded-lg flex items-center justify-center transition-all" style={{ backgroundColor: 'transparent', border: `1px solid ${t.border}` }}>
                  <ArrowLeft size={16} color={t.textDim}/>
                </button>
                <div>
                  <h3 className="text-xs font-black uppercase text-white">{activeStrategy.titulo_estrategia}</h3>
                  <p className="text-[7px] font-black uppercase tracking-widest text-neutral-400">{selectedCompany?.nombre_empresa}</p>
                </div>
              </div>
              <button onClick={saveStrategy} className="px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest text-black flex items-center gap-1.5 transition-all" style={{ backgroundColor: t.accent }}>
                <Save size={12} /> Guardar Cambios
              </button>
            </header>
           <div className="flex-1 flex p-3 gap-3 overflow-hidden max-w-[1600px] mx-auto w-full">
             <div className="flex-1 overflow-y-auto flex flex-col mac-scrollbar" style={{ backgroundColor: 'transparent', border: 'none' }}>
               <NotionBlockEditor value={editorContent} onChange={setEditorContent} isDark={isDark} settings={settings} title={activeStrategy.titulo_estrategia} />
             </div>
           </div>
        </div>
       )}

       {/* SESSIONS / MEETING EDITOR */}
       {viewState === 'session' && activeMeeting && (
        <div className="flex flex-col h-full overflow-hidden animate-in fade-in duration-400">
          <header className="px-4 py-3 flex items-center justify-between" style={{ backgroundColor: 'transparent', border: 'none' }}>
            <div className="flex items-center gap-3">
              <button onClick={saveMeeting} className="w-8 h-8 rounded-lg flex items-center justify-center transition-all" style={{ backgroundColor: 'transparent', border: `1px solid ${t.border}` }}>
                <ArrowLeft size={16} color={t.textDim}/>
              </button>
              <div>
                <h3 className="text-xs font-black uppercase text-white">{activeMeeting.session_title}</h3>
                <p className="text-[7px] font-black uppercase tracking-widest text-neutral-400">{activeClient?.nombre}</p>
              </div>
            </div>
            <button onClick={saveMeeting} className="px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest text-black flex items-center gap-1.5 transition-all" style={{ backgroundColor: t.accent }}>
              <Save size={12} /> Guardar Cambios
            </button>
          </header>
          <div className="flex-1 flex p-3 gap-3 overflow-hidden max-w-[1600px] mx-auto w-full">
            <div className="flex-1 overflow-y-auto flex flex-col mac-scrollbar" style={{ backgroundColor: 'transparent', border: 'none' }}>
              <NotionBlockEditor value={editorContent} onChange={setEditorContent} isDark={isDark} settings={settings} title={activeMeeting.session_title} />
            </div>
          </div>
        </div>
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

       {/* FACTURAS ARX */}
       {viewState === 'facturas' && (
         <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
           <FacturasArx token={token} isDark={isDark} clients={clients} />
         </div>
       )}

    </div>
  );
};

export default EditorVideo;
