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
  const [activeAgencyPlan, setActiveAgencyPlan] = useState(null); // 'Básico', 'Intermedio', etc.
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [newCompany, setNewCompany] = useState({
    nombre_empresa: '',
    dueño: '',
    email: '',
    telefono: '',
    plan: 'Básico',
    drive_folder_id: ''
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

  const normalizeText = (text) => (text || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

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
      setNewClient({ nombre: '', email: '', pais: '', status: 'Activo', redes: { instagram: '', youtube: '', tiktok: '' } });
    } catch (e) { alert(e.message); }
    setLoading(false);
  };

  const handleDeleteClient = async (clientId, e) => {
    if (e) e.stopPropagation();
    if (!confirm('¿ELIMINAR CLIENTE Y TODAS SUS SESIONES?')) return;
    try {
      await supabase.from('reuniones').delete().eq('cliente_id', clientId);
      await supabase.from('clientes_editor').delete().eq('id', clientId);
      await fetchClients();
    } catch (e) { alert(e.message); }
  };

  const toggleClientStatus = async (client, e) => {
    if (e) e.stopPropagation();
    const newStatus = client.status === 'Activo' ? 'Ausente' : 'Activo';
    try {
      await supabase.from('clientes_editor').update({ status: newStatus }).eq('id', client.id);
      await fetchClients();
    } catch (e) { console.error(e); }
  };

  const openClientProfile = (client) => { setActiveClient(client); fetchMeetings(client.nombre); setViewState('client-profile'); };

  const fetchMeetings = async (clientName) => {
    try {
      // 1. Obtener todos los IDs posibles para este nombre (por si hay duplicados antiguos)
      const { data: allClients } = await supabase
        .from('clientes_editor')
        .select('id')
        .eq('nombre', clientName);
      
      const clientIds = allClients?.map(c => c.id) || [];
      
      // 2. Buscar reuniones por nombre O por cualquiera de esos IDs
      let query = supabase.from('reuniones').select('*');
      
      if (clientIds.length > 0) {
        query = query.or(`cliente.eq."${clientName}",cliente_id.in.(${clientIds.map(id => `"${id}"`).join(',')})`);
      } else {
        query = query.eq('cliente', clientName);
      }

      const { data, error } = await query.order('fecha', { ascending: false });
      
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
      hitos_pago: meeting.hitos_pago || [],
      pipeline: meeting.pipeline || [
        { id: 1, label: 'Corte Bruto', done: false },
        { id: 2, label: 'Color Grade', done: false },
        { id: 3, label: 'SFX/Mix', done: false },
        { id: 4, label: 'Export Final', done: false }
      ],
      deadlines: meeting.deadlines || [],
      mood_board: meeting.mood_board || [],
      brand_kit: meeting.brand_kit || { colors: [], logos: [] }
    }); 
    setEditorContent(meeting.contenido || '<p><br></p>');
    setTime(meeting.total_time || 0);
    setViewState('session'); 
  };

  const createMeeting = async () => {
    const sTitle = prompt('Descripción de la sesión:', 'Edición de Video');
    if (!sTitle) return;
    const newMeeting = { 
      id: crypto.randomUUID(), cliente_id: activeClient.id, cliente: activeClient.nombre, fecha: new Date().toISOString().split('T')[0], session_title: sTitle,
      contenido: '<p><br></p>', total_time: 0, priority: 'Baja', revision_version: 'V1'
    };
    try { await supabase.from('reuniones').insert(newMeeting); await fetchMeetings(activeClient.id); openMeeting(newMeeting); } catch (error) { alert(error.message); }
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

  const handleEditorInput = (e) => {
    setEditorContent(e.currentTarget.innerHTML);
  };

  const uniqueClients = useMemo(() => {
    const seen = new Set();
    return (clients || []).filter(c => {
      if (seen.has(c.nombre)) return false;
      seen.add(c.nombre);
      return true;
    }).filter(c => normalizeText(c.nombre).includes(normalizeText(clientSearch)));
  }, [clients, clientSearch]);

  const filteredMeetings = useMemo(() => (meetingsList || []).filter(m => normalizeText(m.session_title).includes(normalizeText(meetingSearch))), [meetingsList, meetingSearch]);
  const totalTimeWorked = useMemo(() => (meetingsList || []).reduce((acc, curr) => acc + (curr.total_time || 0), 0), [meetingsList]);

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
      
      {/* NAVEGACIÓN MAESTRA: EDITOR VS AGENCIA */}
      <nav className="h-20 border-b border-white/5 flex items-center justify-between px-10 relative z-50 bg-black/20 backdrop-blur-3xl">
         <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-[#10b981] rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.4)]">
               <Briefcase size={20} className="text-white"/>
            </div>
            <h1 className="text-xl font-black tracking-tighter uppercase">Sovereign <span className="text-neutral-500 italic">OS</span></h1>
         </div>
         
         <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/10 shadow-2xl">
            <button onClick={() => setViewState('client-list')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewState === 'client-list' || viewState === 'session' ? 'bg-[#10b981] text-white shadow-lg' : 'text-neutral-600 hover:text-white'}`}>
               <div className="flex items-center gap-2"><Video size={14}/> Editor Pro</div>
            </button>
            <button onClick={() => setViewState('agency-hub')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewState === 'agency-hub' || viewState === 'agency-session' ? 'bg-amber-500 text-white shadow-lg' : 'text-neutral-600 hover:text-white'}`}>
               <div className="flex items-center gap-2"><Briefcase size={14}/> Agencia de Marketing</div>
            </button>
         </div>

         <div className="flex items-center gap-6">
            <button className="text-neutral-700 hover:text-white transition-all"><Calendar size={20}/></button>
            <button className="text-neutral-700 hover:text-white transition-all"><Search size={20}/></button>
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500 to-rose-500 border-2 border-white/10"></div>
         </div>
      </nav>
      
      {/* VISTA: CONTROL DE CLIENTES (FIDELIDAD & TRADING BOARD) */}
      {viewState === 'client-list' && (
        <div className="flex flex-col h-full overflow-hidden animate-in fade-in duration-1000 relative">
          <div className="flex-1 overflow-y-auto mac-scrollbar p-10 space-y-10 max-w-[1900px] mx-auto w-full relative z-10">
            {/* CABECERA: CONTROL DE CLIENTES */}
            <header className={`${colors.card} rounded-[3rem] p-10 shadow-2xl border border-white/5 relative overflow-hidden group animate-in slide-in-from-top duration-1000`}>
               <div className="absolute top-0 right-0 w-[40%] h-full bg-gradient-to-l from-[#10b981]/5 to-transparent pointer-events-none"></div>
               <div className="flex justify-between items-start mb-12 relative z-10">
                  <div className="space-y-3">
                    <p className={`text-[10px] text-[#10b981] font-black uppercase tracking-[0.8em] flex items-center gap-3 animate-pulse`}>
                       <Crown size={14}/> Operational Matrix • Elite Edition
                    </p>
                    <h2 className={`text-6xl font-black ${colors.text} tracking-tighter uppercase leading-[0.8]`}>
                       Control de <br/><span className={isLight ? 'text-slate-200' : 'text-white/10'}>Clientes</span>
                    </h2>
                  </div>
                  <div className="flex gap-8">
                     <div className="bg-black/40 p-5 rounded-[2rem] border border-white/5 flex gap-6 items-center shadow-2xl">
                        <div className="space-y-1">
                           <p className="text-[8px] text-neutral-600 font-black uppercase tracking-widest">Global Pulse</p>
                           <p className="text-xl font-black text-white font-mono">94.2%</p>
                           <p className="text-[9px] text-[#10b981] font-bold">▲ 8.4%</p>
                        </div>
                        <div className="flex items-end gap-1.5 h-12">
                           {[20, 45, 30, 60, 40, 75, 55].map((h, i) => (
                              <div key={i} className="w-2 rounded-full bg-[#10b981]/20 relative group">
                                 <div className="absolute bottom-0 w-full bg-[#10b981] rounded-full group-hover:shadow-[0_0_10px_#10b981] transition-all" style={{ height: `${h}%` }}></div>
                              </div>
                           ))}
                        </div>
                     </div>
                     <button onClick={() => setIsClientModalOpen(true)} className="px-12 py-5 bg-[#10b981] text-white rounded-[2rem] font-black text-[12px] uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-95 transition-all shadow-[0_20px_50px_rgba(16,185,129,0.3)] flex items-center gap-4">
                       <Plus size={20} strokeWidth={3}/> Nuevo Cliente
                     </button>
                  </div>
               </div>
               <div className="grid grid-cols-4 gap-8 relative z-10">
                  {['Revenue Velocity', 'Client Seniority', 'Loyalty Flow', 'Retention Rate'].map((label, i) => (
                     <div key={i} className="bg-white/[0.02] p-6 rounded-[2rem] border border-white/5 group hover:bg-[#10b981]/5 transition-all">
                        <div className="flex justify-between items-center mb-4">
                           <p className="text-[9px] text-neutral-600 font-black uppercase tracking-widest">{label}</p>
                           <TrendingUp size={12} className="text-[#10b981]"/>
                        </div>
                        <div className="flex flex-col gap-1 w-full">
                           <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                              <div className="h-full bg-[#10b981]" style={{ width: `${60 + i*10}%` }}></div>
                           </div>
                           <p className="text-xl font-black text-white font-mono tracking-tighter">{85 + i*3}%</p>
                        </div>
                     </div>
                  ))}
               </div>
            </header>

            {/* BUSCADOR */}
      {/* BUSCADOR */}
            <div className="flex gap-6 items-center">
              <div className="relative group flex-1">
                <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-neutral-800 group-focus-within:text-[#10b981] transition-colors" size={24}/>
                <input type="text" value={clientSearch} onChange={e=>setClientSearch(e.target.value)} placeholder="Filtrar clientes en la matriz..." className={`w-full ${colors.input} rounded-[2.5rem] py-6 pl-20 pr-8 text-xl outline-none border border-white/5 focus:border-[#10b981]/30 transition-all font-bold shadow-2xl`} />
              </div>
            </div>

            {/* TABLA DE CLIENTES */}
            <div className={`${colors.card} rounded-[3.5rem] overflow-hidden shadow-2xl border border-white/5`}>
               <table className="w-full text-left border-collapse">
                  <thead>
                     <tr className="border-b border-white/5 bg-white/[0.01]">
                        <th className="px-10 py-8 text-[10px] text-neutral-700 font-black uppercase tracking-[0.3em]">ID</th>
                        <th className="px-10 py-8 text-[10px] text-neutral-700 font-black uppercase tracking-[0.3em]">Cliente</th>
                        <th className="px-10 py-8 text-[10px] text-neutral-700 font-black uppercase tracking-[0.3em]">Modalidad</th>
                        <th className="px-10 py-8 text-[10px] text-neutral-700 font-black uppercase tracking-[0.3em] text-center">Fidelidad</th>
                        <th className="px-10 py-8 text-[10px] text-neutral-700 font-black uppercase tracking-[0.3em] text-right">Inversión</th>
                        <th className="px-10 py-8 text-[10px] text-neutral-700 font-black uppercase tracking-[0.3em] text-right">Comandos</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                     {uniqueClients.map((client, idx) => (
                       <tr key={client.id} onClick={() => openClientProfile(client)} className="group hover:bg-[#10b981]/[0.03] transition-all cursor-pointer">
                          <td className="px-10 py-8"><span className="text-sm font-mono text-neutral-800 font-black tracking-tighter">{(idx + 1).toString().padStart(2, '0')}</span></td>
                          <td className="px-10 py-8">
                             <div className="flex items-center gap-6">
                                <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 overflow-hidden shrink-0 shadow-xl">
                                   {client.foto_url ? <img src={client.foto_url} className="w-full h-full object-cover" alt="" /> : <UserIcon size={24} className="text-neutral-800 m-auto mt-4" />}
                                </div>
                                <div>
                                   <p className={`text-base font-black ${colors.text} uppercase tracking-tighter leading-none mb-1.5`}>{client.nombre}</p>
                                   <p className="text-[10px] text-neutral-600 font-bold uppercase tracking-widest">{client.email || 'Global Partner'}</p>
                                </div>
                             </div>
                          </td>
                          <td className="px-10 py-8">
                             <div className="flex items-center gap-3">
                                {idx % 2 === 0 ? <div className="px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[8px] font-black text-amber-500 uppercase flex items-center gap-2"><Crown size={12}/> VIP Tier</div> : <div className="px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-xl text-[8px] font-black text-blue-500 uppercase flex items-center gap-2"><Zap size={12}/> High Growth</div>}
                             </div>
                          </td>
                          <td className="px-10 py-8 text-center">
                             <div className="flex justify-center gap-1">
                                {[...Array(5)].map((_, i) => <Star key={i} size={10} fill={i < (4 + idx%2) ? "#10b981" : "transparent"} className={i < (4 + idx%2) ? "text-[#10b981]" : "text-white/10"}/>)}
                             </div>
                          </td>
                          <td className="px-10 py-8 text-right"><p className="text-base font-black text-white font-mono">$1,200.00</p></td>
                          <td className="px-10 py-8 text-right">
                             <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                                <button className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-neutral-500 transition-all"><MoreVertical size={16}/></button>
                                <button className="p-3 bg-white/5 hover:bg-[#10b981] rounded-xl text-white transition-all"><ArrowLeft className="rotate-180" size={16}/></button>
                             </div>
                          </td>
                       </tr>
                     ))}
                  </tbody>
               </table>
            </div>
          </div>
        </div>
      )}

      {/* VISTA: PERFIL CLIENTE */}
      {viewState === 'client-profile' && activeClient && (
        <div className={`h-full flex flex-col overflow-hidden ${colors.bg} animate-in slide-in-from-right duration-500`}>
          {/* CABECERA EJECUTIVA DEL PERFIL */}
          <header className={`px-10 py-6 ${colors.card} border-b border-white/5 flex items-center justify-between relative z-10 shrink-0 bg-black/20 backdrop-blur-3xl`}>
            <div className="flex items-center gap-8">
              <button onClick={() => setViewState('client-list')} className={`w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-neutral-500 hover:text-[#10b981] transition-all border border-white/5`}><ArrowLeft size={24}/></button>
              <div>
                 <div className="flex items-center gap-4 mb-1">
                    <h3 className={`text-3xl font-black ${colors.text} uppercase tracking-tighter`}>{activeClient.nombre}</h3>
                    <span className="px-3 py-1 bg-[#10b981]/10 rounded-lg text-[9px] font-black text-[#10b981] uppercase tracking-widest border border-[#10b981]/20">Verified Client</span>
                 </div>
                 <p className={`text-[10px] ${colors.textMuted} font-black uppercase tracking-[0.4em]`}>{activeClient.empresa || 'Independent Production'}</p>
              </div>
            </div>
            <button onClick={createMeeting} className="px-10 py-5 bg-white text-black rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] flex items-center gap-4 hover:bg-[#10b981] hover:text-white transition-all shadow-[0_15px_30px_rgba(255,255,255,0.1)]">
               <Video size={18} strokeWidth={3}/> Iniciar Nueva Producción
            </button>
          </header>
          
          <div className="flex-1 overflow-y-auto mac-scrollbar p-10 space-y-10 max-w-[1500px] mx-auto w-full relative">
               
               {/* MÉTRICAS DE ALTO NIVEL */}
               <div className="grid grid-cols-3 gap-6">
                  <div className={`${colors.card} rounded-[2rem] p-8 border border-white/5 flex flex-col justify-between group hover:border-amber-500/30 transition-all`}>
                     <p className="text-[10px] text-neutral-600 font-black uppercase tracking-widest mb-4">Total Production Time</p>
                     <div className="flex items-end justify-between">
                        <h5 className={`text-4xl font-black ${colors.text} font-mono leading-none tracking-tighter`}>{formatTime(totalTimeWorked)}</h5>
                        <Clock size={32} className="text-amber-500/20 group-hover:text-amber-500 transition-all"/>
                     </div>
                  </div>
                  <div className="col-span-2 p-8 rounded-[2rem] bg-gradient-to-br from-[#10b981]/5 to-transparent border border-[#10b981]/10 flex items-center justify-between">
                     <div>
                        <p className="text-[10px] text-[#10b981] font-black uppercase tracking-[0.4em] mb-2">Project Capacity</p>
                        <h4 className="text-2xl font-black text-white uppercase tracking-tighter">Gestionando {meetingsList.length} Sesiones Activas</h4>
                     </div>
                     <div className="flex -space-x-4">
                        {[...Array(4)].map((_,i) => <div key={i} className="w-12 h-12 rounded-full border-4 border-[#0b0c0e] bg-neutral-900 flex items-center justify-center text-[10px] font-black text-neutral-500 uppercase">S{i+1}</div>)}
                     </div>
                  </div>
               </div>

               {/* LISTADO DE SESIONES: "EXECUTIVE SLATE" DESIGN */}
               <div className="space-y-4">
                  <div className="flex items-center gap-4 mb-6 opacity-30">
                     <span className="text-[10px] font-black text-white uppercase tracking-[1em]">Production Ledger</span>
                     <div className="h-[1px] flex-1 bg-white"></div>
                  </div>

                  {filteredMeetings.length > 0 ? filteredMeetings.map(m => (
                    <div key={m.id} className="group relative">
                       {/* ELEGANT ROW DESIGN */}
                       <div className={`${colors.card} rounded-[2rem] p-8 border border-white/5 flex items-center justify-between hover:bg-white/[0.01] hover:border-white/20 transition-all shadow-2xl relative z-10 overflow-hidden`}>
                          
                          <div className="flex items-center gap-10">
                             <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-neutral-900 to-neutral-800 flex items-center justify-center text-[#10b981] border border-white/5 shadow-inner group-hover:scale-110 transition-all">
                                <FileVideo size={28} strokeWidth={1.5}/>
                             </div>
                             
                             <div className="space-y-2">
                                <div className="flex items-center gap-4">
                                   <h4 className="text-2xl font-black text-white uppercase tracking-tighter leading-none">{m.session_title || 'Untitled Session'}</h4>
                                   <span className="px-3 py-1 bg-white/5 rounded-lg text-[8px] font-black text-neutral-500 uppercase tracking-widest border border-white/5">{m.revision_version || 'V1.0'}</span>
                                </div>
                                <div className="flex items-center gap-4">
                                   <div className="flex items-center gap-2 text-neutral-600">
                                      <Calendar size={12}/>
                                      <span className="text-[10px] font-bold uppercase tracking-widest">{m.fecha}</span>
                                   </div>
                                   <span className="w-1 h-1 rounded-full bg-neutral-800"></span>
                                   <div className="flex items-center gap-2 text-[#10b981]">
                                      <Activity size={12}/>
                                      <span className="text-[10px] font-black uppercase tracking-widest">Active Draft</span>
                                   </div>
                                </div>
                             </div>
                          </div>

                          <div className="flex items-center gap-12">
                             <div className="text-right">
                                <p className="text-[8px] text-neutral-700 font-black uppercase tracking-widest mb-1">Time Elapsed</p>
                                <p className="text-2xl font-black text-white font-mono tracking-tighter">{formatTime(m.total_time || 0)}</p>
                             </div>
                             
                             <button onClick={() => openMeeting(m)} className="px-10 py-5 bg-white/5 hover:bg-white text-neutral-500 hover:text-black font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl border border-white/10 transition-all flex items-center gap-4 group/btn">
                                Continuar <ChevronRight size={16} className="group-hover/btn:translate-x-1 transition-all"/>
                             </button>
                          </div>

                          {/* DECORACIÓN DE FONDO SUTIL */}
                          <div className="absolute top-0 right-0 h-full w-40 bg-gradient-to-l from-[#10b981]/[0.02] to-transparent pointer-events-none"></div>
                       </div>
                    </div>
                  )) : (
                     <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-[3rem]">
                        <p className="text-neutral-600 font-black uppercase tracking-widest">No hay sesiones registradas en el Ledger</p>
                     </div>
                  )}
               </div>
          </div>
        </div>
      )}

      {/* VISTA: AGENCIA DE MARKETING HUB (SOVEREIGN PLATINUM DESIGN) */}
      {viewState === 'agency-hub' && (
        <div className="flex flex-col h-full overflow-hidden animate-in fade-in duration-1000 bg-[#0b0c0e]">
           <div className="flex-1 overflow-y-auto mac-scrollbar p-12 space-y-16 max-w-[1900px] mx-auto w-full relative">
              
              {/* DECORACIÓN DE FONDO: LÍNEAS DE PRECISIÓN */}
              <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-[0.03]">
                 <div className="absolute top-0 left-1/4 w-[1px] h-full bg-white"></div>
                 <div className="absolute top-0 left-2/4 w-[1px] h-full bg-white"></div>
                 <div className="absolute top-0 left-3/4 w-[1px] h-full bg-white"></div>
              </div>

              {/* CABECERA SIMPLIFICADA */}
              <header className="relative z-10 flex justify-between items-center">
                 <div className="flex items-center gap-6">
                    <div className="w-2 h-10 bg-amber-500 rounded-full"></div>
                    <h2 className="text-4xl font-black text-white tracking-tighter uppercase">
                       Agencia
                    </h2>
                 </div>
                 
                 <div className="flex items-center gap-8">
                    <div className="flex gap-4 items-center bg-white/5 p-2 rounded-2xl border border-white/10">
                       <div className="px-6 py-2 border-r border-white/10 text-center">
                          <p className="text-[8px] text-neutral-600 font-black uppercase tracking-widest mb-1">Cuentas</p>
                          <p className="text-xl font-black text-white font-mono">{uniqueClients.length || 12}</p>
                       </div>
                       <div className="px-6 py-2 text-center">
                          <p className="text-[8px] text-neutral-600 font-black uppercase tracking-widest mb-1">Eficiencia</p>
                          <p className="text-xl font-black text-[#10b981] font-mono">98%</p>
                       </div>
                    </div>
                    <button onClick={() => setIsCompanyModalOpen(true)} className="px-10 py-4 bg-white text-black rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-amber-500 hover:text-white transition-all flex items-center gap-4 group">
                       <Plus size={18} strokeWidth={3}/> Nuevo Proyecto
                    </button>
                 </div>
              </header>

              {/* MATRIZ DE PLANES */}
              <div className="grid grid-cols-4 gap-6 relative z-10">
                 {[
                   { name: 'Básico', icon: <Shield size={18}/>, color: '#3b82f6' },
                   { name: 'Intermedio', icon: <Zap size={18}/>, color: '#10b981' },
                   { name: 'Avanzado', icon: <Crown size={18}/>, color: '#a855f7' },
                   { name: 'Personalizado', icon: <Sparkles size={18}/>, color: '#f59e0b' }
                 ].map((p, i) => (
                   <div key={i} onClick={() => setActiveAgencyPlan(p.name)} className={`group relative p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all cursor-pointer ${activeAgencyPlan === p.name ? 'bg-white/[0.05] border-white/20' : ''}`}>
                      <div className="flex justify-between items-center">
                         <div className="flex items-center gap-4">
                            <div className="text-neutral-500 group-hover:text-white transition-all">{p.icon}</div>
                            <h4 className="text-sm font-black text-white uppercase tracking-widest">{p.name}</h4>
                         </div>
                         <div className={`w-1.5 h-1.5 rounded-full`} style={{ backgroundColor: p.color }}></div>
                      </div>
                      <div className="absolute bottom-0 left-0 w-full h-[2px] bg-white/5 overflow-hidden">
                         <div className="h-full transition-all duration-1000" style={{ width: activeAgencyPlan === p.name ? '100%' : '0%', backgroundColor: p.color }}></div>
                      </div>
                   </div>
                 ))}
              </div>

              {/* LISTADO DE PROYECTOS */}
              <div className="space-y-10 relative z-10">
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 relative z-10">
                    {uniqueClients.map((company, i) => {
                       const data = (company && company.nombre) ? company : { nombre: 'Global Dynamics', dueño: 'Marcus Aurelius', drive_url: '#', telefono: '+1 800 234 567' };
                       return (
                          <div key={i} onClick={() => { setSelectedCompany(data); setViewState('agency-session'); }} className="group relative">
                             <div className="absolute -inset-2 bg-gradient-to-tr from-amber-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-all blur-2xl rounded-[3rem]"></div>
                             
                             <div className="relative bg-[#080808] border border-white/5 rounded-[3rem] p-10 hover:border-white/20 transition-all cursor-pointer">
                                <div className="flex justify-between items-start mb-10">
                                   <div className="flex items-center gap-6">
                                      <div className="w-16 h-16 bg-neutral-900 rounded-2xl flex items-center justify-center text-white border border-white/10 shadow-2xl group-hover:scale-110 transition-all">
                                         <Building2 size={28} strokeWidth={1.5}/>
                                      </div>
                                      <div>
                                         <h4 className="text-xl font-black text-white uppercase tracking-tighter leading-none mb-2">{data.nombre_empresa}</h4>
                                         <div className="flex items-center gap-3">
                                            <span className="text-[8px] font-black text-neutral-600 uppercase tracking-widest">ID: PRJ-{204 + i}</span>
                                            <span className="w-1 h-1 rounded-full bg-[#10b981]"></span>
                                         </div>
                                      </div>
                                   </div>
                                </div>

                                <div className="grid grid-cols-2 gap-8 mb-10">
                                   <div className="space-y-1">
                                      <p className="text-[8px] text-neutral-700 font-black uppercase tracking-widest">Lead Partner</p>
                                      <p className="text-xs font-black text-neutral-400">{data.dueño}</p>
                                   </div>
                                   <div className="space-y-1 text-right">
                                      <p className="text-[8px] text-neutral-700 font-black uppercase tracking-widest">Status</p>
                                      <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest">In Progress</p>
                                   </div>
                                </div>

                                <div className="flex gap-4">
                                   <button 
                                      onClick={(e) => { e.stopPropagation(); if(data.drive_url !== '#') window.open(data.drive_url, '_blank'); }} 
                                      className="flex-1 py-4 bg-white/5 hover:bg-white text-neutral-500 hover:text-black font-black text-[9px] uppercase tracking-widest rounded-xl transition-all border border-white/10 flex items-center justify-center gap-3"
                                   >
                                      <FolderOpen size={14}/> Drive Archive
                                   </button>
                                   <button 
                                      onClick={(e) => { e.stopPropagation(); if(data.telefono) { navigator.clipboard.writeText(data.telefono); alert('Copiado: ' + data.telefono); } }} 
                                      className="w-14 h-14 bg-white/5 hover:bg-amber-500 text-white rounded-xl flex items-center justify-center transition-all border border-white/10"
                                   >
                                      <Phone size={18}/>
                                   </button>
                                </div>
                             </div>
                          </div>
                       );
                    })}
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* VISTA: ESTRATEGIA DE AGENCIA (AGENCY SESSION) */}
      {viewState === 'agency-session' && selectedCompany && (
        <div className="flex flex-col h-full overflow-hidden animate-in fade-in duration-500">
           <header className="h-24 border-b border-white/5 px-10 flex items-center justify-between bg-black/40 backdrop-blur-3xl">
              <div className="flex items-center gap-8">
                 <button onClick={() => setViewState('agency-hub')} className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-neutral-600 hover:text-amber-500 transition-all border border-white/10"><ArrowLeft size={24}/></button>
                 <div>
                    <h3 className="text-3xl font-black text-white uppercase tracking-tighter leading-none mb-1">{selectedCompany.nombre_empresa}</h3>
                    <p className="text-[10px] text-amber-500 font-black uppercase tracking-[0.2em]">Strategic War Room • Plan Avanzado</p>
                 </div>
              </div>
              <div className="flex gap-4">
                 <button className="px-8 py-4 bg-white/5 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest border border-white/10 hover:bg-white/10 transition-all flex items-center gap-3"><FolderOpen size={18}/> Abrir Drive</button>
                 <button className="px-8 py-4 bg-amber-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3"><Save size={18}/> Guardar Estrategia</button>
              </div>
           </header>

           <div className="flex-1 flex overflow-hidden">
              {/* SIDEBAR DE DATOS EMPRESARIALES */}
              <aside className="w-96 border-r border-white/5 p-10 space-y-10 overflow-y-auto mac-scrollbar bg-black/20">
                 <div className="space-y-6">
                    <h4 className="text-[10px] text-neutral-700 font-black uppercase tracking-[0.3em]">Métricas de Cuenta</h4>
                    <div className="grid gap-4">
                       {[
                         { label: 'Growth Score', value: '88%', color: 'text-emerald-500' },
                         { label: 'Budget Status', value: 'On Track', color: 'text-blue-500' },
                         { label: 'Ad Performance', value: '+12.4%', color: 'text-emerald-500' }
                       ].map((m, i) => (
                         <div key={i} className={`${colors.card} p-5 rounded-2xl border border-white/5`}>
                            <p className="text-[9px] text-neutral-600 font-black uppercase tracking-widest mb-2">{m.label}</p>
                            <p className={`text-2xl font-black font-mono ${m.color}`}>{m.value}</p>
                         </div>
                       ))}
                    </div>
                 </div>

                 <div className="space-y-6">
                    <h4 className="text-[10px] text-neutral-700 font-black uppercase tracking-[0.3em]">Información del Socio</h4>
                    <div className="space-y-4">
                       <div className="flex items-center gap-4 p-4 bg-white/[0.02] rounded-2xl border border-white/5">
                          <UserIcon size={20} className="text-amber-500"/>
                          <div><p className="text-[8px] text-neutral-600 font-black uppercase tracking-widest">Dueño</p><p className="text-sm font-black text-white">{selectedCompany.dueño}</p></div>
                       </div>
                       <div className="flex items-center gap-4 p-4 bg-white/[0.02] rounded-2xl border border-white/5">
                          <Phone size={20} className="text-amber-500"/>
                          <div><p className="text-[8px] text-neutral-600 font-black uppercase tracking-widest">Contacto</p><p className="text-sm font-black text-white">+1 800 234 567</p></div>
                       </div>
                    </div>
                 </div>
              </aside>

              {/* EDITOR ESTRATÉGICO CENTRAL */}
              <main className="flex-1 flex flex-col p-10 overflow-hidden relative">
                 <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent"></div>
                 <div className="flex items-center justify-between mb-8">
                    <div className="flex gap-4">
                       {['Estrategia General', 'Calendario de Contenidos', 'Briefing de Campaña'].map((tab, i) => (
                          <button key={i} className={`px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${i === 0 ? 'bg-amber-500 text-white shadow-xl' : 'text-neutral-600 hover:text-white hover:bg-white/5'}`}>{tab}</button>
                       ))}
                    </div>
                    <div className="flex gap-2">
                       <button className="p-3 text-neutral-600 hover:text-white transition-all"><Bold size={18}/></button>
                       <button className="p-3 text-neutral-600 hover:text-white transition-all"><List size={18}/></button>
                       <button className="p-3 text-neutral-600 hover:text-white transition-all"><Type size={18}/></button>
                    </div>
                 </div>

                 <div className={`${colors.card} flex-1 rounded-[3rem] p-12 overflow-y-auto mac-scrollbar border border-white/5 relative group`}>
                    <textarea 
                       className="w-full h-full bg-transparent outline-none resize-none text-xl font-bold text-neutral-200 placeholder:text-neutral-800 leading-relaxed font-mono"
                       placeholder="Comienza a redactar la estrategia maestra para esta empresa..."
                    ></textarea>
                    <div className="absolute bottom-10 right-10 flex gap-4 opacity-0 group-hover:opacity-100 transition-all translate-y-4 group-hover:translate-y-0">
                       <div className="px-6 py-3 bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl text-[9px] font-black uppercase text-amber-500">Autoguardado Activo</div>
                    </div>
                 </div>
              </main>
           </div>
        </div>
      )}

      {/* VISTA: WAR ROOM / EDITOR (RESTAURACIÓN TOTAL DE HERRAMIENTAS) */}
      {viewState === 'session' && activeMeeting && (
        <div className={`flex-1 flex flex-col overflow-hidden ${colors.bg} animate-in fade-in duration-500`}>
          <header className={`px-6 py-4 border-b ${colors.card} flex items-center justify-between shrink-0 relative z-50`}>
            <div className="flex items-center gap-6">
              <button onClick={saveMeeting} className={`w-10 h-10 ${isLight ? 'bg-slate-100' : 'bg-white/5'} rounded-xl flex items-center justify-center text-neutral-600 hover:text-[#10b981] transition-all`}><ArrowLeft size={20}/></button>
              <div><div className="flex items-center gap-3"><h3 className={`text-lg font-black ${colors.text} uppercase leading-none`}>{activeClient?.nombre}</h3><span className="text-neutral-800 text-xl font-thin">/</span><input type="text" value={activeMeeting.session_title} onChange={e=>setActiveMeeting({...activeMeeting, session_title: e.target.value})} className="bg-transparent text-lg font-black text-[#10b981] uppercase outline-none w-auto" /></div><p className={`text-[8px] ${colors.textMuted} font-black uppercase tracking-[0.4em] mt-1`}>Sovereign Obsidian • Professional War Room</p></div>
            </div>
            <div className="flex items-center gap-4">
               <div className={`flex items-center gap-4 ${colors.innerBg} border ${colors.border} rounded-xl px-5 py-2 shadow-2xl`}><p className={`text-xl font-mono font-black ${colors.text} leading-none`}>{formatTime(time)}</p><button onClick={() => setIsTimerRunning(!isTimerRunning)} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${isTimerRunning ? 'bg-[#10b981] text-white shadow-lg' : 'bg-white text-black'}`}>{isTimerRunning ? <Pause size={14} strokeWidth={3}/> : <Play size={14} strokeWidth={3} fill="currentColor"/>}</button></div>
               <button onClick={saveMeeting} className="px-6 py-3 bg-white text-black text-[10px] font-black rounded-xl uppercase tracking-widest hover:bg-[#10b981] hover:text-white transition-all shadow-xl"><Save size={16} strokeWidth={3}/> Finalizar</button>
            </div>
          </header>

          <div className="flex-1 flex p-4 gap-4 overflow-hidden max-w-[1800px] mx-auto w-full">
            <div className="w-[300px] h-full shrink-0 flex flex-col space-y-4 overflow-y-auto mac-scrollbar pr-2">
               {/* CALCULADORA HUD */}
               <div className={`${colors.card} rounded-[1.5rem] p-5 shadow-xl`}>
                  <div className="flex items-center justify-between mb-4"><p className={`text-[10px] ${colors.textMuted} font-black uppercase flex items-center gap-2`}><CalcIcon size={14} className="text-[#10b981]"/> Business HUD</p><button onClick={()=>setCalcDisplay('0')} className="text-neutral-500 hover:text-[#10b981]"><RefreshCw size={12}/></button></div>
                  <div className={`${colors.innerBg} border ${colors.border} rounded-xl p-4 text-right text-3xl font-mono font-black ${colors.text} mb-4 truncate shadow-inner`}>{calcDisplay}</div>
                  <div className="grid grid-cols-4 gap-2">
                    {['C','DEL','%','/','7','8','9','*','4','5','6','-','1','2','3','+','0','.','=','+'].slice(0,19).map(btn => (
                      <button key={btn} onClick={() => handleCalc(btn === 'C' ? 'C' : btn)} className={`h-11 rounded-lg text-[11px] font-black transition-all ${btn === '=' ? 'bg-[#10b981] text-white col-span-2' : isLight ? 'bg-slate-100 text-slate-600' : 'bg-white/5 text-neutral-600'} hover:scale-105`}>{btn}</button>
                    ))}
                    <button onClick={()=>handleCalc('=')} className="h-11 rounded-lg text-[11px] font-black bg-[#10b981] text-white transition-all col-span-2 shadow-lg">=</button>
                  </div>
               </div>
               {/* OBJETIVOS */}
               <div className={`${colors.card} rounded-[1.5rem] p-5 flex-1 flex flex-col min-h-[120px] shadow-xl`}><p className={`text-[10px] ${colors.textMuted} font-black uppercase mb-4 flex items-center gap-2`}><Target size={14} className="text-[#10b981]"/> Objectives</p><textarea value={activeMeeting.session_objective || ''} onChange={e=>setActiveMeeting({...activeMeeting, session_objective: e.target.value})} placeholder="Misión de hoy..." className={`w-full flex-1 ${colors.innerBg} border ${colors.border} rounded-xl p-4 text-sm outline-none resize-none`} /></div>
               {/* COBROS (RESTAURADO) */}
               <div className={`${colors.card} rounded-[1.5rem] p-5 shadow-xl`}><div className="flex items-center justify-between mb-4"><p className={`text-[10px] ${colors.textMuted} font-black uppercase flex items-center gap-2`}><DollarSign size={14} className="text-[#10b981]"/> Cobros</p><button onClick={() => setActiveMeeting({...activeMeeting, hitos_pago: [...(activeMeeting.hitos_pago || []), { id: Date.now(), label: 'Pago', paid: false }]})} className="p-1.5 bg-[#10b981]/10 text-[#10b981] rounded-lg"><Plus size={14}/></button></div><div className="space-y-2">{(activeMeeting.hitos_pago || []).map(h => (<div key={h.id} className="flex gap-2 items-center"><input type="text" value={h.label} onChange={(e) => setActiveMeeting({...activeMeeting, hitos_pago: activeMeeting.hitos_pago.map(item => item.id === h.id ? {...item, label: e.target.value} : item)})} className="flex-1 bg-transparent text-[9px] font-bold uppercase outline-none" /><button onClick={() => setActiveMeeting({...activeMeeting, hitos_pago: activeMeeting.hitos_pago.map(item => item.id === h.id ? {...item, paid: !item.paid} : item)})} className={`w-7 h-7 rounded-lg flex items-center justify-center border ${h.paid ? 'bg-[#10b981]/20 border-[#10b981]/40 text-[#10b981]' : 'bg-white/5 border-white/5 text-neutral-800'}`}>{h.paid && <Check size={14}/>}</button></div>))}</div></div>
               {/* PIPELINE (RESTAURADO) */}
               <div className={`${colors.card} rounded-[1.5rem] p-5 shadow-xl`}><p className={`text-[10px] ${colors.textMuted} font-black uppercase mb-4 flex items-center gap-2`}><Activity size={14} className="text-[#10b981]"/> Pipeline</p><div className="grid grid-cols-1 gap-2">{(activeMeeting.pipeline || []).map(step => (<button key={step.id} onClick={() => setActiveMeeting({...activeMeeting, pipeline: activeMeeting.pipeline.map(s => s.id === step.id ? {...s, done: !s.done} : s)})} className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all ${step.done ? 'bg-[#10b981]/10 border-[#10b981]/30 text-[#10b981]' : isLight ? 'bg-slate-100 border-slate-200 text-slate-400' : 'bg-white/5 border-white/5 text-neutral-800'}`}><div className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 ${step.done ? 'bg-[#10b981] text-black' : 'bg-white/5 border border-white/10'}`}>{step.done && <Check size={12} strokeWidth={4}/>}</div><span className="text-[9px] font-black uppercase tracking-widest truncate flex-1 text-left">{step.label}</span></button>))}</div></div>
               {/* DEADLINES (RESTAURADO) */}
               <div className={`${colors.card} rounded-[1.5rem] p-5 shadow-xl`}><div className="flex items-center justify-between mb-4"><p className={`text-[10px] ${colors.textMuted} font-black uppercase flex items-center gap-2`}><Timer size={14} className="text-[#10b981]"/> Deadlines</p><button onClick={() => setActiveMeeting({...activeMeeting, deadlines: [...(activeMeeting.deadlines || []), { id: Date.now(), label: 'Entrega', date: '' }]})} className="p-1.5 bg-[#10b981]/10 text-[#10b981] rounded-lg"><Plus size={14}/></button></div><div className="space-y-2">{(activeMeeting.deadlines || []).map(d => (<div key={d.id} className="flex gap-2 items-center"><input type="text" value={d.label} onChange={(e) => setActiveMeeting({...activeMeeting, deadlines: activeMeeting.deadlines.map(item => item.id === d.id ? {...item, label: e.target.value} : item)})} className="flex-1 bg-transparent text-[9px] font-bold uppercase outline-none" /><input type="date" value={d.date} onChange={(e) => setActiveMeeting({...activeMeeting, deadlines: activeMeeting.deadlines.map(item => item.id === d.id ? {...item, date: e.target.value} : item)})} className="w-16 bg-transparent text-[8px] text-neutral-500" /></div>))}</div></div>
            </div>

            <div className={`flex-1 flex flex-col ${colors.card} rounded-[2rem] overflow-hidden shadow-2xl relative`}>
               <div className={`flex items-center justify-between px-8 py-4 ${isLight ? 'bg-slate-50' : 'bg-[#080808]'} border-b shrink-0`}>
                  <div className="flex items-center gap-4">
                     <div className="flex items-center gap-1 pr-4 border-r border-white/10">
                        <button onMouseDown={(e) => formatText('bold', null, e)} className="p-2 text-neutral-600 hover:text-[#10b981] rounded-lg transition-all"><Bold size={16}/></button>
                        <button onMouseDown={(e) => formatText('insertUnorderedList', null, e)} className="p-2 text-neutral-600 hover:text-[#10b981] rounded-lg transition-all"><List size={16}/></button>
                     </div>
                     <div className="flex items-center gap-2">
                        <button onMouseDown={(e) => applyHighlight('#ef4444', e)} className="w-4 h-4 rounded-full bg-red-500 shadow-lg"></button>
                        <button onMouseDown={(e) => applyHighlight('#3b82f6', e)} className="w-4 h-4 rounded-full bg-blue-500 shadow-lg"></button>
                        <button onMouseDown={(e) => applyHighlight('#fbbf24', e)} className="w-4 h-4 rounded-full bg-amber-400 shadow-lg"></button>
                     </div>
                  </div>
                  <div className={`flex ${isLight ? 'bg-slate-100' : 'bg-black/50'} rounded-xl p-1 border border-white/5`}>
                     {['editor', 'drive', 'calendar', 'mood', 'brand', 'tasks'].map(tab => (
                        <button key={tab} onClick={()=>setSessionTab(tab)} className={`px-4 py-2 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${sessionTab === tab ? 'bg-[#10b981] text-white shadow-lg' : isLight ? 'text-slate-400 hover:text-slate-900' : 'text-neutral-700 hover:text-white'}`}>{tab.toUpperCase()}</button>
                     ))}
                  </div>
               </div>

               {/* TAGS HUD (RESTAURADO) */}
               <div className={`px-8 py-2.5 flex items-center gap-2 overflow-x-auto no-scrollbar border-b ${isLight ? 'bg-slate-50 border-slate-100' : 'bg-black/40 border-white/5'}`}>
                  {EDITOR_TAGS.map(tag => (<button key={tag.name} onMouseDown={(e) => insertTag(e, tag.name, tag.bg, tag.text, tag.border)} className="px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest shrink-0 transition-all hover:scale-105 border border-white/5" style={{ backgroundColor: tag.bg, color: tag.text, border: `1px solid ${tag.border}` }}>{tag.name}</button>))}
               </div>

               <div className={`flex-1 relative overflow-hidden ${isLight ? 'bg-white' : 'bg-[#050505]'}`}>
                  {sessionTab === 'editor' && (
                    <div className="w-full h-full relative animate-in fade-in duration-500">
                        <div ref={editorRef} contentEditable="true" suppressContentEditableWarning={true} className={`w-full h-full p-12 ${isLight ? 'text-slate-900' : 'text-white'} font-medium text-lg leading-relaxed editor-container outline-none mac-scrollbar overflow-y-auto max-w-[1000px] mx-auto`} dangerouslySetInnerHTML={{ __html: activeMeeting.contenido || '<p><br></p>' }} onBlur={() => setActiveMeeting({...activeMeeting, contenido: editorRef.current.innerHTML})} />
                        <button onMouseDown={(e) => { e.preventDefault(); setShowAIModal(true); }} className="absolute bottom-8 right-8 w-14 h-14 bg-[#10b981] text-white rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 group"><Sparkles size={24} className="group-hover:animate-pulse" /></button>
                    </div>
                  )}
                  {sessionTab === 'drive' && <div className="w-full h-full p-8 overflow-y-auto mac-scrollbar"><div className="grid grid-cols-2 md:grid-cols-4 gap-4">{driveFiles.map(f => (<div key={f.id} className="bg-white/5 p-4 rounded-2xl border border-white/5 flex flex-col items-center gap-3"><Folder size={32} className="text-[#10b981]"/><span className="text-[9px] font-bold text-center">{f.name}</span></div>))}</div></div>}
                  {sessionTab === 'calendar' && <div className="w-full h-full p-6"><button onClick={() => setIsCalModalOpen(true)} className="mb-4 px-5 py-2 bg-[#10b981] text-white rounded-xl text-[9px] font-black uppercase tracking-widest">+ Agendar Sesión</button><div className="grid grid-cols-7 border border-white/5 rounded-2xl overflow-hidden bg-black/40 shadow-inner">{['DOM','LUN','MAR','MIÉ','JUE','VIE','SÁB'].map(d => (<div key={d} className="py-3 text-center text-[8px] font-black text-neutral-700 bg-white/5">{d}</div>))}{Array.from({ length: 31 }).map((_, i) => (<div key={i} className="h-20 border-b border-r border-white/5 p-2 text-[9px] font-bold text-neutral-800">{i + 1}</div>))}</div></div>}
                  {sessionTab === 'mood' && <div className="w-full h-full p-8 grid grid-cols-3 gap-6">{activeMeeting.mood_board?.map((img, i) => (<div key={i} className="aspect-video bg-white/5 rounded-[2rem] overflow-hidden border border-white/5 group relative"><img src={img} className="w-full h-full object-cover group-hover:scale-110 transition-all" alt="" /><button onClick={()=>setActiveMeeting({...activeMeeting, mood_board: activeMeeting.mood_board.filter((_, idx)=>idx!==i)})} className="absolute top-4 right-4 p-2 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-all"><X size={14}/></button></div>))}</div>}
                  {sessionTab === 'brand' && <div className="w-full h-full p-8"><div className="grid grid-cols-2 gap-10"><div className="bg-white/5 p-8 rounded-[2rem] border border-white/5 shadow-2xl"><p className="text-[10px] text-neutral-600 font-black uppercase mb-6">Paleta de Colores</p><div className="flex gap-4">{activeMeeting.brand_kit?.colors?.map((c, i) => (<div key={i} className="w-16 h-16 rounded-2xl border border-white/10 group relative" style={{ backgroundColor: c }}><button onClick={()=>setActiveMeeting({...activeMeeting, brand_kit: {...activeMeeting.brand_kit, colors: activeMeeting.brand_kit.colors.filter((_, idx)=>idx!==i)}})} className="absolute -top-2 -right-2 p-1 bg-black rounded-full opacity-0 group-hover:opacity-100 transition-all"><X size={10}/></button></div>))}</div></div><div className="bg-white/5 p-8 rounded-[2rem] border border-white/5 shadow-2xl"><p className="text-[10px] text-neutral-600 font-black uppercase mb-6">Assets</p><div className="grid grid-cols-2 gap-4">{activeMeeting.brand_kit?.logos?.map((l, i) => (<div key={i} className="h-20 bg-black rounded-xl p-4 flex items-center justify-center group relative"><img src={l} className="max-h-full object-contain" alt="" /><button onClick={()=>setActiveMeeting({...activeMeeting, brand_kit: {...activeMeeting.brand_kit, logos: activeMeeting.brand_kit.logos.filter((_, idx)=>idx!==i)}})} className="absolute top-2 right-2 p-1 bg-black rounded-full opacity-0 group-hover:opacity-100 transition-all"><X size={10}/></button></div>))}</div></div></div></div>}
                  {sessionTab === 'tasks' && <div className="w-full h-full p-4"><GoogleTasks token={token} /></div>}
               </div>
            </div>
          </div>
        </div>
      )}

      {/* MODALES RESTAURADOS */}
      {isCalModalOpen && (
        <div className="fixed inset-0 z-[800] flex items-center justify-center bg-black/95 backdrop-blur-2xl p-8 animate-in zoom-in duration-300">
          <div className={`${colors.card} border-t-4 border-t-[#10b981] rounded-[3rem] w-full max-w-xl p-10 space-y-6 shadow-2xl`}>
            <h3 className={`text-2xl font-black ${colors.text} uppercase`}>Agendar en <span className="text-[#10b981]">Google Calendar</span></h3>
            <input type="text" value={calTitle} onChange={e=>setCalTitle(e.target.value)} placeholder="Título..." className={`w-full ${colors.input} rounded-2xl p-4 outline-none`} />
            <div className="grid grid-cols-2 gap-4">
              <input type="date" value={calDate} onChange={e=>setCalDate(e.target.value)} className={`w-full ${colors.input} rounded-2xl p-4`} />
              <div className="grid grid-cols-2 gap-2"><input type="time" value={calStart} onChange={e=>setCalStart(e.target.value)} className={`${colors.input} rounded-2xl p-4 text-xs`} /><input type="time" value={calEnd} onChange={e=>setCalEnd(e.target.value)} className={`${colors.input} rounded-2xl p-4 text-xs`} /></div>
            </div>
            <div className="flex gap-4 pt-4"><button onClick={() => setIsCalModalOpen(false)} className={`flex-1 py-5 ${colors.textMuted} font-black uppercase text-[10px]`}>Cerrar</button><button className="flex-[2] py-5 bg-[#10b981] text-white rounded-2xl font-black uppercase text-[10px] shadow-lg flex items-center justify-center gap-3">Confirmar en Google</button></div>
          </div>
        </div>
      )}

      {showAIModal && (
        <div className="fixed inset-0 z-[700] flex items-center justify-center bg-black/95 backdrop-blur-3xl p-10 animate-in zoom-in duration-300">
          <div className={`${colors.card} border-t-4 border-t-[#10b981] rounded-[4rem] p-16 w-full max-w-3xl shadow-2xl`}>
            <h4 className={`text-3xl font-black ${colors.text} uppercase mb-8 flex items-center gap-4`}><Sparkles className="text-[#10b981]" size={28}/> IA Oracle</h4>
            <textarea autoFocus value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} className={`w-full ${colors.input} rounded-[2.5rem] p-8 text-lg outline-none h-48 resize-none mb-8 placeholder:text-neutral-900`} placeholder="Pide una mejora creativa..." />
            <div className="flex gap-8"><button onClick={() => setShowAIModal(false)} className={`flex-1 py-6 ${colors.textMuted} font-black uppercase text-[10px]`}>Cerrar</button><button onClick={handleAISuggestion} disabled={aiLoading || !aiPrompt} className="flex-[2] py-6 bg-[#10b981] text-white font-black rounded-[2.5rem] uppercase text-[10px] tracking-widest flex items-center justify-center gap-3 shadow-lg">{aiLoading ? <RefreshCw className="animate-spin" size={16}/> : <Sparkles size={16}/>} Ejecutar</button></div>
          </div>
        </div>
      )}

      {isClientModalOpen && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center bg-black/95 backdrop-blur-xl p-8 animate-in zoom-in duration-300">
           <div className={`${colors.card} border-t-4 border-t-[#10b981] rounded-[3rem] w-full max-w-xl p-12 space-y-8 shadow-2xl`}>
                <h3 className={`text-3xl font-black ${colors.text} uppercase tracking-tighter leading-none`}>Sovereign <span className="text-[#10b981]">Nexus</span></h3>
                <div className="space-y-4">
                  <input type="text" value={newClient.nombre} onChange={e=>setNewClient({...newClient, nombre: e.target.value})} placeholder="Nombre completo..." className={`w-full ${colors.input} rounded-2xl p-6 text-lg outline-none`} />
                  <input type="email" value={newClient.email} onChange={e=>setNewClient({...newClient, email: e.target.value})} placeholder="Email corporativo..." className={`w-full ${colors.input} rounded-2xl p-6 text-lg outline-none`} />
                  <input type="text" value={newClient.pais} onChange={e=>setNewClient({...newClient, pais: e.target.value})} placeholder="País/Región..." className={`w-full ${colors.input} rounded-2xl p-6 text-lg outline-none`} />
                </div>
                <div className="flex gap-4">
                   <button onClick={() => setIsClientModalOpen(false)} className={`flex-1 py-6 ${colors.textMuted} font-black uppercase text-[10px] tracking-widest`}>Descartar</button>
                   <button onClick={handleCreateClient} className="flex-[2] py-6 bg-[#10b981] text-white rounded-2xl font-black uppercase text-[10px] tracking-widest active:scale-95 shadow-lg">Guardar Perfil</button>
                </div>
           </div>
        </div>
      )}
    </div>
  );
};
export default MeetingStudio;
