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
  const isLight = settings.theme === 'light';
  
  const [viewState, setViewState] = useState('client-list'); 
  const [activeClient, setActiveClient] = useState(null);
  const [activeMeeting, setActiveMeeting] = useState(null);
  const [sessionTab, setSessionTab] = useState('editor'); 
  
  // ESTADO DE AGENCIA DE MARKETING
  const [companies, setCompanies] = useState([]);
  const [activeAgencyPlan, setActiveAgencyPlan] = useState('Todos'); 
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [newCompany, setNewCompany] = useState({
    nombre_empresa: '',
    dueño: '',
    email: '',
    telefono: '',
    plan: 'Básico',
    drive_url: ''
  });

  const [clients, setClients] = useState([]);
  const [clientSearch, setClientSearch] = useState('');
  const [meetingSearch, setMeetingSearch] = useState(''); 
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [driveFiles, setDriveFiles] = useState([]);
  const [driveLoading, setDriveLoading] = useState(false);

  // GOOGLE CALENDAR
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [isCalModalOpen, setIsCalModalOpen] = useState(false);
  const [calTitle, setCalTitle] = useState('');
  const [calDate, setCalDate] = useState(new Date().toISOString().split('T')[0]);
  const [calStart, setCalStart] = useState('10:00');
  const [calEnd, setCalEnd] = useState('11:00');
  const [calDesc, setCalDesc] = useState('');
  
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
    nombre: '', identidad: '', email: '', telefono: '', 
    pais: '', empresa: '', status: 'Activo', foto_url: '', 
    redes: { instagram: '', youtube: '', tiktok: '' }
  });

  const [roasCalc, setRoasCalc] = useState({ spend: '', revenue: '' });

  useEffect(() => { 
    fetchClients(); 
    fetchCompanies();
    fetchMeetings();
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

  const fetchCompanies = async () => {
    try {
      const { data, error } = await supabase.from('clientes_editor').select('*').not('empresa', 'is', null);
      if (error) throw error;
      const formatted = (data || []).map(c => ({
        id: c.id,
        nombre_empresa: c.empresa,
        dueño: c.nombre,
        email: c.email,
        plan: c.plan_agencia || 'Básico',
        drive_url: '#'
      }));
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
      const clientData = { 
        nombre: newClient.nombre, 
        email: newClient.email, 
        pais: newClient.pais,
        empresa: newClient.empresa,
        status: newClient.status
      };
      const { error } = await supabase.from('clientes_editor').insert(clientData);
      if (error) throw error;
      await fetchClients();
      setIsClientModalOpen(false);
      setNewClient({ nombre: '', email: '', pais: '', empresa: '', status: 'Activo', redes: { instagram: '', youtube: '', tiktok: '' } });
    } catch (e) { alert(e.message); }
    setLoading(false);
  };

  const openClientProfile = (client) => { setActiveClient(client); setViewState('client-profile'); };

  const openMeeting = (meeting) => { 
    const meta = meeting.metadata || {};
    setActiveMeeting({
      ...meeting,
      session_title: meeting.session_title || 'Edición de Video',
      contenido: meeting.contenido || '<p><br></p>',
      pipeline: meta.pipeline || [
        { id: 1, label: 'Corte Bruto', done: false },
        { id: 2, label: 'Color Grade', done: false },
        { id: 3, label: 'SFX/Mix', done: false },
        { id: 4, label: 'Export Final', done: false }
      ],
      hitos_pago: meta.hitos_pago || [],
      mood_board: meta.mood_board || [],
      brand_kit: meta.brand_kit || { colors: [], logos: [] },
      priority: meta.priority || 'Baja',
      revision_version: meta.revision_version || 'V1'
    }); 
    setEditorContent(meeting.contenido || '<p><br></p>');
    setTime(meeting.total_time || 0);
    setViewState('session'); 
  };

  const createMeeting = async () => {
    if (!activeClient) return;
    const sTitle = prompt('Descripción de la sesión:', 'Edición de Video');
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
      const finalContent = editorRef.current ? editorRef.current.innerHTML : activeMeeting.contenido;
      
      const metadata = { 
        pipeline: activeMeeting.pipeline, 
        hitos_pago: activeMeeting.hitos_pago,
        mood_board: activeMeeting.mood_board,
        brand_kit: activeMeeting.brand_kit,
        priority: activeMeeting.priority || 'Baja',
        revision_version: activeMeeting.revision_version || 'V1'
      };

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
    const html = `<span contenteditable="false" style="background-color: ${colorBg}; color: ${colorText}; border: 1px solid ${colorBorder}; padding: 2px 6px; border-radius: 8px; font-size: 9px; font-weight: 800; text-transform: uppercase; margin: 0 3px; display: inline-flex; align-items: center; justify-content: center; vertical-align: middle; letter-spacing: 0.02em;">${tagName}</span>&nbsp;`;
    document.execCommand('insertHTML', false, html);
    editorRef.current.focus();
  };

  const EDITOR_TAGS = [
    { name: 'Guion', bg: 'rgba(59, 130, 246, 0.05)', text: '#60a5fa', border: 'rgba(59, 130, 246, 0.2)' },
    { name: 'Video', bg: 'rgba(239, 68, 68, 0.05)', text: '#f87171', border: 'rgba(239, 68, 68, 0.2)' },
    { name: 'Audio', bg: 'rgba(16, 185, 129, 0.05)', text: '#10b981', border: 'rgba(16, 185, 129, 0.2)' },
    { name: 'FX', bg: 'rgba(245, 158, 11, 0.05)', text: '#f59e0b', border: 'rgba(245, 158, 11, 0.2)' },
    { name: 'Render', bg: 'rgba(99, 102, 241, 0.05)', text: '#6366f1', border: 'rgba(99, 102, 241, 0.2)' },
    { name: 'IA', bg: 'rgba(168, 85, 247, 0.05)', text: '#c084fc', border: 'rgba(168, 85, 247, 0.2)' }
  ];

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
    const seen = new Set();
    return (clients || []).filter(c => {
      if (!c.nombre) return false;
      const normalized = normalizeText(c.nombre);
      if (seen.has(normalized)) return false;
      seen.add(normalized);
      return true;
    }).filter(c => normalizeText(c.nombre).includes(normalizeText(clientSearch)));
  }, [clients, clientSearch]);

  const filteredMeetings = useMemo(() => {
    if (!activeClient) return [];
    const activeName = normalizeText(activeClient.nombre);
    return (meetingsList || []).filter(m => {
      const mName = normalizeText(m.cliente);
      return mName === activeName || m.cliente_id === activeClient.id;
    }).filter(m => normalizeText(m.session_title || '').includes(normalizeText(meetingSearch)));
  }, [meetingsList, meetingSearch, activeClient]);

  const filteredCompanies = useMemo(() => {
    return (companies || []).filter(c => {
      const matchSearch = normalizeText(c.nombre_empresa || '').includes(normalizeText(clientSearch)) || 
                          normalizeText(c.dueño || '').includes(normalizeText(clientSearch));
      const matchPlan = activeAgencyPlan === 'Todos' || c.plan === activeAgencyPlan;
      return matchSearch && matchPlan;
    });
  }, [companies, clientSearch, activeAgencyPlan]);

  const totalTimeWorked = useMemo(() => filteredMeetings.reduce((acc, curr) => acc + (curr.total_time || 0), 0), [filteredMeetings]);

  const AGENCY_PLANS = [
    { name: 'Todos', icon: <Grid size={16}/>, color: '#666' },
    { name: 'Básico', icon: <Zap size={16}/>, color: '#10b981' },
    { name: 'Intermedio', icon: <Star size={16}/>, color: '#f59e0b' },
    { name: 'Avanzado', icon: <Crown size={16}/>, color: '#059669' }
  ];

  const colors = {
    bg: isLight ? 'bg-slate-50' : 'bg-[#0b0c0e]',
    card: isLight ? 'bg-white' : 'bg-[#121417]',
    text: isLight ? 'text-slate-900' : 'text-white',
    textMuted: isLight ? 'text-slate-400' : 'text-neutral-500',
    border: isLight ? 'border-slate-200' : 'border-white/5',
    innerBg: isLight ? 'bg-slate-50' : 'bg-[#1a1c20]',
    input: isLight ? 'bg-slate-100' : 'bg-white/[0.05]',
    accent: '#10b981',
    accentMuted: 'rgba(16, 185, 129, 0.1)'
  };

  return (
    <>
      <div className={`flex flex-col h-screen w-full ${colors.bg} ${colors.text} overflow-hidden font-sans transition-colors duration-500`}>
        {/* NAVEGACIÓN MAESTRA - Estilo Fintrixity Compact */}
        <nav className="h-16 border-b border-white/5 flex items-center justify-between px-8 relative z-50 bg-[#0b0c0e]/80 backdrop-blur-3xl">
           <div className="flex items-center gap-4">
              <div className="w-8 h-8 bg-[#10b981] rounded-lg flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-transform hover:rotate-6">
                 <Briefcase size={16} className="text-white"/>
              </div>
              <h1 className="text-lg font-black tracking-tighter uppercase">Sovereign <span className="text-neutral-500 italic text-sm">Nexus</span></h1>
           </div>
           
           <div className="flex bg-[#121417] p-1 rounded-xl border border-white/5 shadow-2xl">
              <button onClick={() => setViewState('client-list')} className={`px-8 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${viewState === 'client-list' || viewState === 'session' ? 'bg-[#10b981] text-white shadow-[0_5px_15px_rgba(16,185,129,0.2)]' : 'text-neutral-600 hover:text-white'}`}>
                 <div className="flex items-center gap-2"><Video size={12}/> Editor Pro</div>
              </button>
              <button onClick={() => setViewState('agency-hub')} className={`px-8 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${viewState === 'agency-hub' || viewState === 'agency-session' ? 'bg-white/10 text-white border border-white/10' : 'text-neutral-600 hover:text-white'}`}>
                 <div className="flex items-center gap-2"><Briefcase size={12}/> Agencia</div>
              </button>
           </div>

           <div className="flex items-center gap-4">
              <div className="flex flex-col items-right text-right">
                 <p className="text-[9px] font-black text-white leading-none mb-1">Carlos Joel</p>
                 <p className="text-[7px] font-bold text-[#10b981] uppercase tracking-widest">Nexus Master</p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#10b981] to-[#059669] p-[2px]">
                 <div className="w-full h-full rounded-[10px] bg-[#0b0c0e] overflow-hidden flex items-center justify-center">
                    <UserIcon size={16} className="text-white" />
                 </div>
              </div>
           </div>
        </nav>
        
        {/* VISTA: CONTROL DE CLIENTES */}
        {viewState === 'client-list' && (
          <div className="flex-1 overflow-hidden relative">
            <div className="h-full overflow-y-auto mac-scrollbar p-6 space-y-6 max-w-[1800px] mx-auto w-full relative z-10">
              
              <div className="grid grid-cols-6 gap-4">
                 {/* Card Estilo "My Balance" Compact */}
                 <div className="col-span-3 bg-gradient-to-br from-[#10b981] to-[#059669] rounded-3xl p-8 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10"><Zap size={100} strokeWidth={1}/></div>
                    <div className="relative z-10 flex flex-col justify-between h-full">
                       <div className="flex justify-between items-start">
                          <div className="space-y-1">
                             <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/70">Operational Matrix</p>
                             <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Vista General</h2>
                          </div>
                          <button onClick={() => setIsClientModalOpen(true)} className="w-12 h-12 bg-white/20 hover:bg-white text-white hover:text-[#10b981] rounded-2xl flex items-center justify-center transition-all backdrop-blur-md">
                             <Plus size={24} strokeWidth={3}/>
                          </button>
                       </div>
                       <div className="flex items-end justify-between mt-6">
                          <div className="space-y-0">
                             <p className="text-5xl font-black text-white font-mono tracking-tighter leading-none">{uniqueClients.length}</p>
                             <p className="text-[8px] font-bold text-white/60 uppercase tracking-widest">Partners Activos</p>
                          </div>
                          <div className="px-4 py-2 bg-white/20 rounded-xl backdrop-blur-md text-white text-[8px] font-black uppercase tracking-widest">
                             +12% TRENDING
                          </div>
                       </div>
                    </div>
                 </div>

                 {/* Metrics Cards Compact */}
                 {['Production Velocity', 'Client Loyalty', 'Sync Health'].map((label, i) => (
                    <div key={i} className={`${colors.card} rounded-3xl p-6 border border-white/5 flex flex-col justify-between group hover:border-[#10b981]/30 transition-all shadow-xl`}>
                       <div className="flex justify-between items-start mb-6">
                          <div className="w-10 h-10 bg-[#10b981]/10 rounded-xl flex items-center justify-center text-[#10b981] border border-[#10b981]/20">
                             {i === 0 ? <Activity size={18} /> : i === 1 ? <Star size={18} /> : <Zap size={18} />}
                          </div>
                          <p className="text-[7px] font-black text-neutral-600 uppercase tracking-widest">{label}</p>
                       </div>
                       <div className="space-y-3">
                          <div className="flex items-end justify-between">
                             <h4 className="text-xl font-black text-white tracking-tighter">{i === 0 ? '84.5%' : i === 1 ? 'Elite' : 'Stable'}</h4>
                             {i === 0 && <TrendingUp size={14} className="text-[#10b981]" />}
                          </div>
                          <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                             <div className="h-full bg-[#10b981]" style={{ width: i === 0 ? '84.5%' : '100%' }}></div>
                          </div>
                       </div>
                    </div>
                 ))}
              </div>

              <div className="flex gap-4 items-center">
                <div className="relative group flex-1">
                  <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-neutral-700 group-focus-within:text-[#10b981] transition-colors" size={18}/>
                  <input type="text" value={clientSearch} onChange={e=>setClientSearch(e.target.value)} placeholder="Buscar en la matriz..." className={`w-full ${colors.input} rounded-2xl py-4 pl-16 pr-6 text-sm outline-none border border-white/5 focus:border-[#10b981]/30 transition-all font-bold shadow-xl`} />
                </div>
              </div>

              <div className={`${colors.card} rounded-3xl overflow-hidden shadow-2xl border border-white/5`}>
                 <table className="w-full text-left border-collapse">
                    <thead>
                       <tr className="border-b border-white/5 bg-white/[0.01]">
                          <th className="px-8 py-5 text-[8px] text-neutral-600 font-black uppercase tracking-[0.2em]">Identity</th>
                          <th className="px-8 py-5 text-[8px] text-neutral-600 font-black uppercase tracking-[0.2em]">Network</th>
                          <th className="px-8 py-5 text-[8px] text-neutral-600 font-black uppercase tracking-[0.2em]">Tier</th>
                          <th className="px-8 py-5 text-[8px] text-neutral-600 font-black uppercase tracking-[0.2em] text-right">Action</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                       {uniqueClients.map((client, idx) => (
                         <tr key={client.id} onClick={() => openClientProfile(client)} className="group hover:bg-white/[0.02] transition-all cursor-pointer">
                            <td className="px-8 py-4">
                               <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 rounded-xl bg-[#0b0c0e] border border-white/10 shrink-0 flex items-center justify-center group-hover:scale-105 transition-transform">
                                     <UserIcon size={16} className="text-neutral-700 group-hover:text-[#10b981] transition-colors" />
                                  </div>
                                  <div>
                                     <p className={`text-xs font-black ${colors.text} uppercase tracking-tighter mb-0.5`}>{client.nombre}</p>
                                     <p className="text-[8px] text-neutral-700 font-bold uppercase tracking-widest">{client.empresa || 'Partner'}</p>
                                  </div>
                               </div>
                            </td>
                            <td className="px-8 py-4">
                               <p className="text-[8px] font-black text-neutral-600 font-mono tracking-widest">{client.email || 'NEXUS.GLOBAL'}</p>
                            </td>
                            <td className="px-8 py-4">
                               <div className="flex items-center gap-2">
                                  {idx % 2 === 0 ? <div className="px-3 py-1 bg-[#10b981]/10 border border-[#10b981]/20 rounded-lg text-[7px] font-black text-[#10b981] uppercase tracking-widest">High Tier</div> : <div className="px-3 py-1 bg-neutral-900 border border-white/10 rounded-lg text-[7px] font-black text-neutral-600 uppercase tracking-widest">Active</div>}
                               </div>
                            </td>
                            <td className="px-8 py-4 text-right">
                               <button className="w-8 h-8 bg-[#1a1c20] hover:bg-[#10b981] rounded-xl text-neutral-700 hover:text-white transition-all flex items-center justify-center border border-white/10 group-hover:shadow-[0_5px_15px_rgba(255,93,1,0.2)]">
                                  <ChevronRight size={14}/>
                                </button>
                            </td>
                         </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
            </div>
          </div>
        )}

        )}

        {/* VISTA: PERFIL CLIENTE COMPACT */}
        {viewState === 'client-profile' && activeClient && (
          <div className="flex-1 flex flex-col overflow-hidden animate-in slide-in-from-right duration-500">
            <header className={`px-8 py-5 ${colors.card} border-b border-white/5 flex items-center justify-between relative z-10 shrink-0 bg-[#0b0c0e]/80 backdrop-blur-3xl`}>
              <div className="flex items-center gap-6">
                <button onClick={() => setViewState('client-list')} className={`w-10 h-10 bg-[#121417] rounded-xl flex items-center justify-center text-neutral-600 hover:text-[#10b981] transition-all border border-white/5`}><ArrowLeft size={20}/></button>
                <div>
                   <div className="flex items-center gap-4 mb-0.5">
                      <h3 className={`text-2xl font-black ${colors.text} uppercase tracking-tighter`}>{activeClient.nombre}</h3>
                      <span className="px-3 py-1 bg-[#10b981]/10 rounded-lg text-[7px] font-black text-[#10b981] uppercase tracking-widest border border-[#10b981]/20">Partner Elite</span>
                   </div>
                   <p className={`text-[9px] font-black uppercase tracking-[0.3em] text-[#10b981]/50`}>{activeClient.empresa || 'Production'}</p>
                </div>
              </div>
              <button onClick={createMeeting} className="px-8 py-4 bg-white text-black rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 hover:bg-[#10b981] hover:text-white transition-all shadow-xl">
                 <Video size={16} strokeWidth={3}/> Nueva Sesión
              </button>
            </header>
            
            <div className="flex-1 overflow-y-auto mac-scrollbar p-6 space-y-8 max-w-[1500px] mx-auto w-full relative">
                 <div className="grid grid-cols-3 gap-6">
                    <div className={`${colors.card} rounded-3xl p-8 border border-white/5 flex flex-col justify-between shadow-xl`}>
                       <p className="text-[9px] text-neutral-600 font-black uppercase tracking-widest mb-4">Production Velocity</p>
                       <div className="flex items-end justify-between">
                          <h5 className={`text-4xl font-black ${colors.text} font-mono tracking-tighter`}>{formatTime(totalTimeWorked)}</h5>
                          <Clock size={32} className="text-[#10b981]/20"/>
                       </div>
                    </div>
                    <div className="col-span-2 p-8 rounded-3xl bg-gradient-to-br from-[#10b981]/10 to-transparent border border-[#10b981]/10 flex items-center justify-between shadow-xl">
                       <div className="relative z-10">
                          <p className="text-[9px] text-[#10b981] font-black uppercase tracking-[0.3em] mb-2">Project Overview</p>
                          <h4 className="text-2xl font-black text-white uppercase tracking-tighter leading-tight">Gestionando <span className="text-white bg-[#10b981] px-3 py-0.5 rounded-lg mx-1">{filteredMeetings.length}</span> <br/>Proyectos en Curso</h4>
                       </div>
                       <div className="flex -space-x-3">
                          {[...Array(4)].map((_, i) => <div key={i} className="w-12 h-12 rounded-full border-4 border-[#0b0c0e] bg-neutral-900 flex items-center justify-center text-[10px] text-white font-black">P{i+1}</div>)}
                       </div>
                    </div>
                 </div>

                 <div className="space-y-4">
                    {filteredMeetings.length > 0 ? filteredMeetings.map(m => (
                      <div key={m.id} className={`${colors.card} rounded-3xl p-6 border border-white/5 flex items-center justify-between hover:bg-white/[0.01] transition-all shadow-xl`}>
                         <div className="flex items-center gap-8">
                            <div className="w-16 h-16 rounded-2xl bg-[#0b0c0e] flex items-center justify-center text-[#10b981] border border-white/10">
                               <FileVideo size={28} strokeWidth={1.5}/>
                            </div>
                            <div className="space-y-1.5">
                               <div className="flex items-center gap-4">
                                  <h4 className="text-xl font-black text-white uppercase tracking-tighter">{m.session_title || 'Untitled'}</h4>
                                  <span className="px-2 py-0.5 bg-[#10b981] rounded-lg text-[7px] font-black text-white uppercase tracking-widest">{m.metadata?.revision_version || 'V1.0'}</span>
                                </div>
                               <div className="flex items-center gap-4">
                                  <div className="flex items-center gap-2 text-neutral-700 text-[9px] font-bold uppercase tracking-widest"><Calendar size={10}/>{m.fecha}</div>
                                  <div className="flex items-center gap-2 text-[#10b981] text-[9px] font-black uppercase tracking-widest">Active Stream</div>
                               </div>
                            </div>
                         </div>
                         <div className="flex items-center gap-12">
                            <div className="text-right font-mono"><p className="text-xl font-black text-white tracking-tighter">{formatTime(m.total_time || 0)}</p></div>
                            <button onClick={() => openMeeting(m)} className="px-8 py-3 bg-[#1a1c20] hover:bg-white text-neutral-600 hover:text-black font-black text-[9px] uppercase tracking-widest rounded-xl transition-all border border-white/10 flex items-center gap-3">Gestionar <ChevronRight size={14}/></button>
                         </div>
                      </div>
                    )) : (
                       <div className="py-16 text-center border-2 border-dashed border-white/5 rounded-3xl text-neutral-800 font-black uppercase tracking-widest text-xs">Sin registros</div>
                    )}
                 </div>
            </div>
          </div>
        )}

        {/* VISTA: AGENCIA HUB - COMPACT */}
        {viewState === 'agency-hub' && (
          <div className="flex flex-col h-full overflow-hidden bg-[#0b0c0e]">
                 <header className="flex justify-between items-end">
                   <div className="space-y-2">
                      <p className="text-[9px] font-black text-[#10b981] uppercase tracking-[0.4em] mb-1">Nexus Agency Control</p>
                      <h2 className="text-5xl font-black text-white tracking-tighter uppercase leading-none">Overview</h2>
                   </div>
                   <div className="flex items-center gap-4">
                      <div className="flex bg-[#121417] p-1 rounded-xl border border-white/5">
                         {['M', 'Y'].map(t => <button key={t} className={`w-10 h-8 rounded-lg text-[9px] font-black uppercase transition-all ${t === 'Y' ? 'bg-[#10b981] text-white' : 'text-neutral-700'}`}>{t}</button>)}
                      </div>
                      <button onClick={() => setIsCompanyModalOpen(true)} className="px-8 py-3 bg-[#10b981] text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center gap-3">
                         <Plus size={16} strokeWidth={3}/> Project
                      </button>
                   </div>
                </header>
                  <div className="grid grid-cols-4 gap-4">
                   {AGENCY_PLANS.map((p, i) => (
                     <div key={i} onClick={() => setActiveAgencyPlan(p.name)} className={`p-6 rounded-3xl bg-[#121417] border border-white/5 hover:border-[#10b981]/20 transition-all cursor-pointer ${activeAgencyPlan === p.name ? 'ring-1 ring-[#10b981] shadow-xl' : ''}`}>
                        <div className="flex justify-between items-center mb-4">
                           <div className={`w-10 h-10 rounded-xl flex items-center justify-center border border-white/5 ${activeAgencyPlan === p.name ? 'bg-[#10b981] text-white' : 'bg-neutral-900 text-neutral-700'}`}>
                              {p.icon}
                           </div>
                           <MoreVertical size={14} className="text-neutral-800"/>
                        </div>
                        <h4 className="text-[10px] font-black text-white uppercase tracking-widest">{p.name}</h4>
                     </div>
                   ))}
                </div>
                 <div className="grid grid-cols-4 gap-6 pb-12">
                   {filteredCompanies.map((company, i) => (
                      <div key={i} onClick={() => { setSelectedCompany(company); setViewState('agency-session'); }} className="bg-[#121417] border border-white/5 rounded-3xl p-8 hover:border-[#10b981]/30 transition-all cursor-pointer group shadow-xl">
                         <div className="flex items-center gap-5 mb-8">
                            <div className="w-16 h-16 bg-[#0b0c0e] rounded-2xl flex items-center justify-center text-[#10b981] border border-white/10 group-hover:scale-105 transition-all">
                               <Building2 size={28} strokeWidth={1}/>
                            </div>
                            <div>
                               <h4 className="text-xl font-black text-white uppercase tracking-tighter leading-none mb-2 truncate max-w-[120px]">{company.nombre_empresa}</h4>
                               <span className="px-2 py-0.5 bg-[#10b981]/10 border border-[#10b981]/20 rounded-lg text-[7px] font-black text-[#10b981] uppercase">{company.plan}</span>
                            </div>
                         </div>
                         
                         <div className="grid grid-cols-2 gap-3 mb-8">
                            <div className="p-3 rounded-xl bg-[#0b0c0e] border border-white/5 text-center">
                               <p className="text-[7px] font-black text-neutral-700 uppercase mb-1">ROI</p>
                               <p className="text-sm font-black text-white font-mono">+12%</p>
                            </div>
                            <div className="p-3 rounded-xl bg-[#0b0c0e] border border-white/5 text-center">
                               <p className="text-[7px] font-black text-neutral-700 uppercase mb-1">CMP</p>
                               <p className="text-sm font-black text-white font-mono">08</p>
                            </div>
                         </div>

                         <div className="flex gap-3">
                            <button className="flex-1 py-3 bg-[#1a1c20] text-neutral-700 hover:text-white font-black text-[8px] uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 border border-white/10"><FolderOpen size={12}/> Docs</button>
                            <button className="w-10 h-10 bg-[#10b981] text-white rounded-xl flex items-center justify-center shadow-lg"><ChevronRight size={20}/></button>
                         </div>
                      </div>
                   ))}
                </div>
                </div>
             </div>
          </div>
        )}

        {/* VISTA: WAR ROOM / EDITOR - COMPACT */}
        {viewState === 'session' && activeMeeting && (
          <div className={`flex-1 flex flex-col overflow-hidden bg-[#0b0c0e] animate-in fade-in duration-500`}>
            <header className={`px-8 py-4 border-b border-white/5 bg-[#121417]/80 backdrop-blur-3xl flex items-center justify-between shrink-0 relative z-50`}>
              <div className="flex items-center gap-6">
                <button onClick={saveMeeting} className={`w-10 h-10 bg-[#0b0c0e] rounded-xl flex items-center justify-center text-neutral-700 hover:text-[#10b981] transition-all border border-white/10`}><ArrowLeft size={20}/></button>
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className={`text-xl font-black text-white uppercase tracking-tighter leading-none`}>{activeClient?.nombre}</h3>
                    <div className="w-1 h-1 rounded-full bg-neutral-800"></div>
                    <span className="text-xl font-black text-[#10b981] uppercase tracking-tighter">{activeMeeting.session_title}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                 <div className={`flex items-center gap-4 bg-[#0b0c0e] border border-white/10 rounded-xl px-5 py-2.5`}>
                   <p className={`text-2xl font-mono font-black text-white leading-none tracking-tighter`}>{formatTime(time)}</p>
                   <button onClick={() => setIsTimerRunning(!isTimerRunning)} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${isTimerRunning ? 'bg-[#10b981] text-white shadow-lg' : 'bg-white text-black'}`}>
                     {isTimerRunning ? <Pause size={16} strokeWidth={4}/> : <Play size={16} strokeWidth={4} fill="currentColor"/>}
                   </button>
                 </div>
                 <button onClick={saveMeeting} className="px-8 py-4 bg-white text-black text-[10px] font-black rounded-xl uppercase tracking-widest hover:bg-[#10b981] hover:text-white transition-all shadow-xl">
                   <Save size={16} strokeWidth={3}/> Sync
                 </button>
              </div>
            </header>

            <div className="flex-1 flex p-6 gap-6 overflow-hidden max-w-[1900px] mx-auto w-full">
              <aside className="w-[280px] h-full shrink-0 flex flex-col space-y-4 overflow-y-auto mac-scrollbar pr-1">
                 <div className={`bg-[#121417] rounded-3xl p-6 border border-white/5 shadow-xl`}>
                    <p className={`text-[9px] text-neutral-600 font-black uppercase tracking-[0.4em] flex items-center gap-2 mb-4`}><CalcIcon size={14} className="text-[#10b981]"/> Operational HUD</p>
                    <div className={`bg-[#0b0c0e] border border-white/5 rounded-xl p-4 text-right text-3xl font-mono font-black text-white mb-4 shadow-inner tracking-tighter`}>{calcDisplay}</div>
                    <div className="grid grid-cols-4 gap-2">
                      {['C','/','*','-','7','8','9','+','4','5','6','=','1','2','3','.'].map(btn => (
                        <button key={btn} onClick={() => handleCalc(btn)} className={`h-10 rounded-lg text-[10px] font-black transition-all ${btn === '=' ? 'bg-[#10b981] text-white shadow-lg' : 'bg-white/5 text-neutral-700 hover:text-white'}`}>{btn}</button>
                      ))}
                    </div>
                 </div>
                 <div className={`bg-[#121417] rounded-3xl p-6 border border-white/5 shadow-xl`}>
                    <p className={`text-[9px] text-neutral-600 font-black uppercase tracking-[0.4em] mb-4 flex items-center gap-2`}><Activity size={14} className="text-[#10b981]"/> Production Pipeline</p>
                    <div className="grid grid-cols-1 gap-2">
                      {(activeMeeting.pipeline || []).map(step => (
                        <button key={step.id} onClick={() => setActiveMeeting({...activeMeeting, pipeline: activeMeeting.pipeline.map(s => s.id === step.id ? {...s, done: !s.done} : s)})} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${step.done ? 'bg-[#10b981]/10 border-[#10b981]/30 text-[#10b981]' : 'bg-white/5 border-white/5 text-neutral-800'}`}>
                          <div className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 transition-all ${step.done ? 'bg-[#10b981] text-white shadow-lg' : 'bg-[#0b0c0e] border border-white/10'}`}>{step.done && <Check size={12} strokeWidth={4}/>}</div>
                          <span className="text-[8px] font-black uppercase tracking-widest truncate flex-1 text-left">{step.label}</span>
                        </button>
                      ))}
                    </div>
                 </div>
              </aside>

              <main className={`flex-1 flex flex-col bg-[#121417] rounded-[2.5rem] overflow-hidden shadow-2xl relative border border-white/5`}>
                 <div className={`flex items-center justify-between px-8 py-4 bg-[#0b0c0e]/50 border-b border-white/5 shrink-0`}>
                    <div className="flex items-center gap-5">
                       <button onMouseDown={(e) => formatText('bold', null, e)} className="p-2 text-neutral-700 hover:text-[#10b981] transition-all"><Bold size={16}/></button>
                       <button onMouseDown={(e) => formatText('insertUnorderedList', null, e)} className="p-2 text-neutral-700 hover:text-[#10b981] transition-all"><List size={16}/></button>
                       <div className="h-6 w-[1px] bg-white/5 mx-2"></div>
                       <div className="flex items-center gap-2">
                          {['#10b981', '#059669', '#f59e0b', '#3b82f6'].map(c => (
                            <button key={c} onMouseDown={(e) => applyHighlight(c, e)} className="w-4 h-4 rounded-full transition-transform hover:scale-125" style={{ backgroundColor: c }}></button>
                          ))}
                       </div>
                    </div>
                    <div className="flex bg-[#0b0c0e] rounded-xl p-1 border border-white/5">
                       {['editor', 'mood', 'brand'].map(tab => (
                          <button key={tab} onClick={()=>setSessionTab(tab)} className={`px-4 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${sessionTab === tab ? 'bg-[#10b981] text-white shadow-lg' : 'text-neutral-700 hover:text-white'}`}>{tab}</button>
                       ))}
                    </div>
                 </div>

                 <div className="px-8 py-3 flex items-center gap-2 overflow-x-auto no-scrollbar border-b border-white/5 bg-[#0b0c0e]/30">
                    {EDITOR_TAGS.map(tag => (<button key={tag.name} onMouseDown={(e) => insertTag(e, tag.name, 'rgba(255,93,1,0.05)', '#10b981', 'rgba(255,93,1,0.1)')} className="px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest shrink-0 transition-all hover:scale-105 bg-[#0b0c0e] border border-white/5 text-[#10b981]">{tag.name}</button>))}
                 </div>

                 <div className="flex-1 relative overflow-hidden bg-[#0b0c0e]/50 backdrop-blur-3xl">
                    {sessionTab === 'editor' && (
                      <div className="w-full h-full relative">
                          <div ref={editorRef} contentEditable="true" suppressContentEditableWarning={true} className="w-full h-full p-12 text-white font-medium text-lg leading-relaxed outline-none mac-scrollbar overflow-y-auto max-w-[950px] mx-auto prose prose-invert prose-emerald" dangerouslySetInnerHTML={{ __html: activeMeeting.contenido || '<p><br></p>' }} />
                          <button onMouseDown={(e) => { e.preventDefault(); setShowAIModal(true); }} className="absolute bottom-8 right-8 w-16 h-16 bg-[#10b981] text-white rounded-2xl shadow-[0_15px_30px_rgba(255,93,1,0.2)] flex items-center justify-center transition-all hover:scale-110 active:scale-95 group">
                             <Sparkles size={28} className="group-hover:rotate-12 transition-transform"/>
                          </button>
                      </div>
                    )}
                    {sessionTab === 'mood' && (
                      <div className="w-full h-full p-8 grid grid-cols-4 gap-4 overflow-y-auto mac-scrollbar">
                        {activeMeeting.mood_board?.map((img, i) => (
                          <div key={i} className="aspect-square bg-neutral-900 rounded-2xl overflow-hidden border border-white/5 group relative shadow-xl">
                            <img src={img} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <button onClick={()=>setActiveMeeting({...activeMeeting, mood_board: activeMeeting.mood_board.filter((_, idx)=>idx!==i)})} className="absolute top-4 right-4 w-8 h-8 bg-[#10b981] text-white rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                              <X size={16} strokeWidth={3}/>
                            </button>
                          </div>
                        ))}
                        <div className="aspect-square rounded-2xl border-2 border-dashed border-white/5 flex flex-col items-center justify-center text-neutral-800 hover:border-[#10b981]/20 hover:text-[#10b981] transition-all cursor-pointer">
                           <Plus size={32} strokeWidth={1} className="mb-2" />
                           <p className="text-[8px] font-black uppercase tracking-[0.2em]">Add Ref</p>
                        </div>
                      </div>
                    )}
                 </div>
              </main>
            </div>
          </div>
        )}

        {/* MODALES ESTILIZADOS */}
        {showAIModal && (
          <div className="fixed inset-0 z-[700] flex items-center justify-center bg-[#000]/95 backdrop-blur-3xl p-10 animate-in zoom-in duration-500">
            <div className={`bg-[#121417] rounded-[4rem] p-20 w-full max-w-4xl shadow-[0_50px_100px_rgba(0,0,0,0.5)] border border-white/5`}>
              <div className="flex items-center gap-6 mb-12">
                 <div className="w-16 h-16 bg-[#10b981] rounded-2xl flex items-center justify-center text-white shadow-[0_0_30px_rgba(255,93,1,0.5)]">
                    <Sparkles size={32}/>
                 </div>
                 <h4 className={`text-5xl font-black text-white uppercase tracking-tighter`}>IA <span className="text-[#10b981]">Oracle</span></h4>
              </div>
              <textarea autoFocus value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} className={`w-full bg-[#0b0c0e] rounded-[3rem] p-10 text-xl outline-none h-64 resize-none mb-12 placeholder:text-neutral-900 border border-white/5 focus:border-[#10b981]/30 transition-all text-white font-medium`} placeholder="Describe la visión creativa para esta producción..."></textarea>
              <div className="flex gap-8">
                <button onClick={() => setShowAIModal(false)} className={`flex-1 py-8 text-neutral-700 font-black uppercase text-[12px] tracking-widest hover:text-white transition-colors`}>Abortar Misión</button>
                <button onClick={handleAISuggestion} disabled={aiLoading || !aiPrompt} className="flex-[2] py-8 bg-[#10b981] text-white font-black rounded-[3rem] uppercase text-[12px] tracking-[0.4em] flex items-center justify-center gap-5 shadow-[0_25px_50px_rgba(255,93,1,0.3)] hover:scale-105 active:scale-95 transition-all">
                   {aiLoading ? <RefreshCw className="animate-spin" size={24}/> : <Terminal size={24}/>} Invocar Oráculo
                </button>
              </div>
            </div>
          </div>
        )}

        {isClientModalOpen && (
          <div className="fixed inset-0 z-[600] flex items-center justify-center bg-[#000]/95 backdrop-blur-3xl p-8 animate-in zoom-in duration-300">
              <div className={`bg-[#121417] border-t-8 border-t-[#10b981] rounded-[4rem] w-full max-w-2xl p-16 space-y-12 shadow-[0_50px_100px_rgba(0,0,0,0.5)]`}>
                   <div className="space-y-4 text-center">
                      <h3 className={`text-5xl font-black text-white uppercase tracking-tighter leading-none`}>Sovereign <span className="text-[#10b981]">Nexus</span></h3>
                      <p className="text-neutral-700 font-bold uppercase tracking-[0.4em] text-[10px]">Portal de Sincronización de Identidad</p>
                   </div>
                   <div className="space-y-6">
                    <div className="space-y-2">
                       <p className="text-[9px] font-black text-neutral-700 uppercase tracking-widest ml-4">Full Identity Name</p>
                       <input type="text" value={newClient.nombre} onChange={e=>setNewClient({...newClient, nombre: e.target.value})} placeholder="Nombre del Partner..." className={`w-full bg-[#0b0c0e] rounded-3xl p-8 text-xl outline-none border border-white/5 focus:border-[#10b981]/30 transition-all text-white`} />
                    </div>
                    <div className="space-y-2">
                       <p className="text-[9px] font-black text-neutral-700 uppercase tracking-widest ml-4">Corporate Endpoint</p>
                       <input type="email" value={newClient.email} onChange={e=>setNewClient({...newClient, email: e.target.value})} placeholder="Email de Sincronización..." className={`w-full bg-[#0b0c0e] rounded-3xl p-8 text-xl outline-none border border-white/5 focus:border-[#10b981]/30 transition-all text-white`} />
                    </div>
                  </div>
                  <div className="flex gap-8 pt-4">
                    <button onClick={() => setIsClientModalOpen(false)} className={`flex-1 py-8 text-neutral-700 font-black uppercase text-[12px] tracking-widest hover:text-white transition-colors`}>Cancelar</button>
                    <button onClick={handleCreateClient} className="flex-[2] py-8 bg-[#10b981] text-white rounded-[3rem] font-black uppercase text-[12px] tracking-[0.4em] shadow-[0_25px_50px_rgba(16,185,129,0.3)] hover:scale-105 active:scale-95 transition-all">Establecer Nexo</button>
                  </div>
             </div>
          </div>
        )}
      </div>
    </>
  );
};

export default MeetingStudio;
