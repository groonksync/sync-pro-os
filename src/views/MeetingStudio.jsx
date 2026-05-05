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

const AGENCY_PLANS = [
  { name: 'Plan Básico', color: '#10b981', clients: [] },
  { name: 'Plan Intermedio', color: '#3b82f6', clients: [] },
  { name: 'Plan Avanzado', color: '#8b5cf6', clients: [] },
  { name: 'Plan Personalizado', color: '#f59e0b', clients: [] }
];

const EDITOR_TAGS = [
  { name: 'Script', color: '#ef4444' },
  { name: 'B-Roll', color: '#3b82f6' },
  { name: 'SFX', color: '#10b981' },
  { name: 'Color', color: '#8b5cf6' },
  { name: 'Review', color: '#f59e0b' }
];

const MeetingStudio = ({ meetingsList = [{id:1, session_title:"Demo"}],  settings = {} }) => {
  const [viewState, setViewState] = useState('client-list'); 
  const [activeClient, setActiveClient] = useState(null);
  const [activeMeeting, setActiveMeeting] = useState(null);
  const [activeAgencyPlan, setActiveAgencyPlan] = useState(null);
  const [sessionTab, setSessionTab] = useState('editor');
  const [clientSearch, setClientSearch] = useState('');
  const [clients, setClients] = useState([{id:"ex-1",nombre:"Nexus Corp",pais:"Miami, USA",email:"contact@nexus.com"},{id:"ex-2",nombre:"Emerald Studio",pais:"BR",email:"prod@emerald.br"},{id:"ex-3",nombre:"Global Media",pais:"ES",email:"info@global.es"},{id:"ex-4",nombre:"Visionary Films",pais:"UK",email:"hello@visionary.uk"},{id:"ex-5",nombre:"Apex Digital",pais:"UAE",email:"sales@apex.ae"}]);
  const [meetings, setMeetings] = useState([{id:"ex-1",nombre:"Nexus Corp",pais:"Miami, USA",email:"contact@nexus.com"},{id:"ex-2",nombre:"Emerald Studio",pais:"BR",email:"prod@emerald.br"},{id:"ex-3",nombre:"Global Media",pais:"ES",email:"info@global.es"},{id:"ex-4",nombre:"Visionary Films",pais:"UK",email:"hello@visionary.uk"},{id:"ex-5",nombre:"Apex Digital",pais:"UAE",email:"sales@apex.ae"}]);
  const [time, setTime] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [calcDisplay, setCalcDisplay] = useState('0');
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [newClient, setNewClient] = useState({ nombre: '', email: '', pais: '', empresa: '' });
  const timerRef = useRef(null);
  const editorRef = useRef(null);

  useEffect(() => { fetchClients(); fetchMeetings(); }, []);
  useEffect(() => {
    if (isTimerRunning) timerRef.current = setInterval(() => setTime(t => t + 1), 1000);
    else clearInterval(timerRef.current);
    return () => clearInterval(timerRef.current);
  }, [isTimerRunning]);

  const fetchClients = async () => {
    const { data } = await supabase.from('clientes_editor').select('*').order('created_at', { ascending: false });
    setClients(data || []);
  };

  const fetchMeetings = async () => {
    const { data } = await supabase.from('reuniones').select('*').order('created_at', { ascending: false });
    setMeetings(data || []);
  };

  const handleCreateClient = async () => {
    const { data, error } = await supabase.from('clientes_editor').insert([newClient]).select();
    if (!error) { fetchClients(); setIsClientModalOpen(false); }
  };

  const formatTime = (s) => {
    const hrs = Math.floor(s / 3600);
    const mins = Math.floor((s % 3600) / 60);
    const secs = s % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const insertTag = (e, name, color) => {
    e.preventDefault();
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    const range = selection.getRangeAt(0);
    const span = document.createElement('span');
    span.textContent = `#${name}`;
    span.style.backgroundColor = color + '20';
    span.style.color = color;
    span.style.padding = '2px 8px';
    span.style.borderRadius = '4px';
    span.style.fontWeight = '800';
    span.style.fontSize = '12px';
    span.style.marginRight = '5px';
    range.insertNode(span);
    range.collapse(false);
  };

  const highlight = (e, color) => {
    e.preventDefault();
    document.execCommand('backColor', false, color);
  };

  return (
    <div className="flex flex-col h-screen w-full bg-gradient-to-br from-[#0b0c0e] via-[#121417] to-[#0b0c0e] text-white font-sans overflow-hidden">
      {/* NAV MAESTRO */}
      <nav className="h-16 border-b border-white/5 flex items-center justify-between px-8 bg-gradient-to-br from-[#0b0c0e] via-[#121417] to-[#0b0c0e]/80 backdrop-blur-3xl z-[100]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#10b981] rounded flex items-center justify-center"><Briefcase size={16}/></div>
          <h1 className="text-sm font-black uppercase tracking-tighter italic">Sovereign <span className="text-neutral-600">Nexus</span></h1>
        </div>
        <div className="flex bg-[#121417] border-white/10 shadow-2xl p-1 rounded-lg border border-white/5">
          <button onClick={() => setViewState('client-list')} className={`px-6 py-2 rounded text-[9px] font-black uppercase tracking-widest transition-all ${viewState.includes('client') || viewState === 'session' ? 'bg-[#10b981] text-white' : 'text-neutral-600 hover:text-white'}`}>Editor Pro</button>
          <button onClick={() => setViewState('plan-list')} className={`px-6 py-2 rounded text-[9px] font-black uppercase tracking-widest transition-all ${viewState.includes('plan') ? 'bg-[#10b981] text-white' : 'text-neutral-600 hover:text-white'}`}>Planes Agencia</button>
        </div>
      </nav>

      {/* CONTENIDO PRINCIPAL */}
      <div className="flex-1 overflow-hidden relative">
        
        {/* LISTA DE CLIENTES - DASHBOARD COMPACTO (5 por fila) */}
        {viewState === 'client-list' && (
          <main className="h-full overflow-y-auto p-12 space-y-12 animate-in fade-in duration-500">
            <div className="flex justify-between items-end">
              <div className="space-y-2">
                <p className="text-[10px] font-black text-[#10b981] uppercase tracking-[0.5em]">Executive Matrix</p>
                <h2 className="text-5xl font-black tracking-tighter uppercase leading-none">Clientes Editor</h2>
              </div>
              <div className="flex items-center gap-4">
                <div className="relative w-80">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-neutral-700" size={18}/>
                  <input type="text" value={clientSearch} onChange={e=>setClientSearch(e.target.value)} placeholder="Filtrar Identidad..." className="w-full bg-[#121417] border-white/10 shadow-2xl rounded-2xl py-4 pl-14 pr-6 text-[11px] outline-none border border-white/5 focus:border-[#10b981]/30 transition-all font-bold uppercase tracking-widest" />
                </div>
                <button onClick={() => setIsClientModalOpen(true)} className="px-6 py-4 bg-[#10b981] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3 hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-[#10b981]/20"><Plus size={18} strokeWidth={3}/> Nuevo Cliente</button>
              </div>
            </div>

            <div className="grid grid-cols-5 gap-4">
              {clients.filter(c => c.nombre.toLowerCase().includes(clientSearch.toLowerCase())).map((client) => (
                <div key={client.id} className="bg-[#121417] border-white/10 shadow-2xl rounded-3xl p-6 border border-white/5 hover:border-[#10b981]/40 transition-all group cursor-pointer" onClick={() => { setActiveClient(client); setViewState('session-list'); }}>
                   <div className="flex justify-between items-start mb-6">
                      <div className="w-12 h-12 bg-gradient-to-br from-[#0b0c0e] via-[#121417] to-[#0b0c0e] rounded-2xl border border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <UserIcon size={20} className="text-neutral-700 group-hover:text-[#10b981]" />
                      </div>
                      <div className="px-3 py-1 bg-[#10b981]/10 rounded text-[7px] font-black text-[#10b981] uppercase tracking-widest border border-[#10b981]/20">Active</div>
                   </div>
                   <h3 className="text-sm font-black text-white uppercase tracking-tighter truncate mb-1">{client.nombre}</h3>
                   <p className="text-[8px] text-neutral-600 font-bold uppercase tracking-widest mb-6">{client.pais || 'Global Partner'}</p>
                   <button className="w-full py-3 bg-gradient-to-br from-[#0b0c0e] via-[#121417] to-[#0b0c0e] rounded-xl text-[8px] font-black uppercase tracking-widest text-neutral-600 group-hover:text-white group-hover:bg-[#10b981] transition-all">Panel Control</button>
                </div>
              ))}
            </div>
          </main>
        )}

        {/* LISTA DE SESIONES DEL CLIENTE */}
        {viewState === 'session-list' && activeClient && (
          <main className="h-full overflow-y-auto p-12 space-y-12 animate-in slide-in-from-right duration-500">
             <button onClick={() => setViewState('client-list')} className="flex items-center gap-3 text-neutral-700 hover:text-white transition-colors uppercase font-black text-[10px] tracking-widest"><ArrowLeft size={16}/> Volver a la Matriz</button>
             <div className="flex justify-between items-end">
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-[#10b981] uppercase tracking-[0.5em]">{activeClient.nombre}</p>
                  <h2 className="text-5xl font-black tracking-tighter uppercase leading-none">Sesiones</h2>
                </div>
                <button onClick={() => { setActiveMeeting({ id: Date.now(), session_title: 'Nueva Sesión', created_at: new Date().toISOString(), contenido: '' }); setViewState('session'); }} className="px-8 py-4 bg-white text-black rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3 hover:scale-105 active:scale-95 transition-all shadow-2xl"><Plus size={18} strokeWidth={3}/> Nueva Sesión</button>
             </div>
             <div className="grid grid-cols-4 gap-6">
                {[{id:1,session_title:"Promo 04/05/2026",client_id:"ex-1"}].filter(m => m.client_id === activeClient.id).map(meeting => (
                  <div key={meeting.id} onClick={() => { setActiveMeeting(meeting); setViewState('session'); }} className="bg-[#121417] border-white/10 shadow-2xl p-8 rounded-[2rem] border border-white/5 hover:border-white/20 transition-all cursor-pointer group">
                     <div className="w-12 h-12 bg-gradient-to-br from-[#0b0c0e] via-[#121417] to-[#0b0c0e] rounded-2xl flex items-center justify-center text-neutral-700 mb-6 group-hover:text-[#10b981] transition-colors"><MessageSquare size={24}/></div>
                     <h4 className="text-lg font-black text-white uppercase tracking-tighter mb-2">{meeting.session_title}</h4>
                     <p className="text-[9px] text-neutral-700 font-bold uppercase tracking-widest">{new Date(meeting.created_at).toLocaleDateString()}</p>
                  </div>
                ))}
             </div>
          </main>
        )}

        {/* EL WAR ROOM: EDITOR PRO CON HERRAMIENTAS APPLE NOTES STYLE */}
        {viewState === 'session' && activeMeeting && (
          <div className="h-full flex animate-in zoom-in duration-500 bg-gradient-to-br from-[#0b0c0e] via-[#121417] to-[#0b0c0e]">
            {/* BARRA LATERAL: HERRAMIENTAS */}
            <aside className="w-80 border-r border-white/5 flex flex-col bg-[#121417] border-white/10 shadow-2xl/30">
               <div className="p-8 border-b border-white/5">
                  <p className="text-[9px] font-black text-neutral-700 uppercase tracking-widest mb-4">Control de Tiempo</p>
                  <div className="bg-gradient-to-br from-[#0b0c0e] via-[#121417] to-[#0b0c0e] rounded-2xl p-6 border border-white/5 text-center">
                     <p className="text-4xl font-black font-mono text-[#10b981] tracking-tighter mb-4">{formatTime(time)}</p>
                     <div className="flex gap-2">
                        <button onClick={() => setIsTimerRunning(!isTimerRunning)} className={`flex-1 py-3 rounded-xl flex items-center justify-center ${isTimerRunning ? 'bg-red-500/10 text-red-500' : 'bg-[#10b981]/10 text-[#10b981]'}`}>{isTimerRunning ? <Pause size={16}/> : <Play size={16}/>}</button>
                        <button onClick={() => setTime(0)} className="w-12 py-3 bg-neutral-900 rounded-xl flex items-center justify-center text-neutral-600"><RotateCcw size={16}/></button>
                     </div>
                  </div>
               </div>

               <div className="p-8 space-y-6 overflow-y-auto mac-scrollbar flex-1">
                  <div>
                    <p className="text-[9px] font-black text-neutral-700 uppercase tracking-widest mb-4">Calculadora</p>
                    <div className="bg-black rounded-2xl p-4 border border-white/5">
                       <div className="text-right text-xl font-mono mb-4 h-8 overflow-hidden">{calcDisplay}</div>
                       <div className="grid grid-cols-4 gap-1">
                          {['7','8','9','/','4','5','6','*','1','2','3','-','0','.','=','+'].map(btn => (
                            <button key={btn} onClick={() => setCalcDisplay(btn === '=' ? eval(calcDisplay).toString() : calcDisplay === '0' ? btn : calcDisplay + btn)} className="h-10 rounded bg-[#121417] border-white/10 shadow-2xl text-[10px] font-bold hover:bg-[#10b981] transition-colors">{btn}</button>
                          ))}
                          <button onClick={() => setCalcDisplay('0')} className="col-span-4 h-8 rounded bg-red-500/10 text-red-500 text-[8px] font-black uppercase tracking-widest mt-1">Clear</button>
                       </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-[9px] font-black text-neutral-700 uppercase tracking-widest mb-4">Drive Nexus</p>
                    <div className="bg-[#121417] border-white/10 shadow-2xl rounded-2xl p-6 border border-white/5 space-y-4">
                       <div className="flex items-center gap-3 text-[#10b981]">
                          <Folder size={18}/>
                          <span className="text-[10px] font-black uppercase tracking-widest truncate">{activeClient.nombre}_FILES</span>
                       </div>
                       <div className="space-y-2">
                          {['RAW_CONTENT', 'ASSETS', 'FINAL_VIDEOS'].map(f => (
                            <div key={f} className="flex items-center justify-between p-3 bg-gradient-to-br from-[#0b0c0e] via-[#121417] to-[#0b0c0e] rounded-xl group border border-transparent hover:border-[#10b981]/20">
                               <div className="flex items-center gap-3">
                                  <FolderOpen size={14} className="text-neutral-700"/>
                                  <span className="text-[9px] font-bold uppercase tracking-widest text-neutral-400">{f}</span>
                               </div>
                               <Download size={12} className="text-neutral-800 opacity-0 group-hover:opacity-100 transition-all"/>
                            </div>
                          ))}
                       </div>
                       <button className="w-full py-4 border-2 border-dashed border-white/5 rounded-2xl text-neutral-800 hover:text-[#10b981] hover:border-[#10b981]/30 transition-all flex flex-col items-center gap-2">
                          <Upload size={16}/>
                          <span className="text-[8px] font-black uppercase tracking-widest">Upload Files</span>
                       </button>
                    </div>
                  </div>
               </div>
               
               <div className="p-8 border-t border-white/5">
                  <button onClick={() => setViewState('session-list')} className="w-full py-4 bg-[#1a1c20] text-neutral-600 hover:text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all">Guardar & Cerrar</button>
               </div>
            </aside>

            {/* AREA DE NOTAS (APPLE NOTES CLONE) */}
            <main className="flex-1 flex flex-col">
               <header className="h-16 px-8 border-b border-white/5 flex items-center justify-between bg-[#121417] border-white/10 shadow-2xl/50 backdrop-blur-3xl">
                  <div className="flex items-center gap-6">
                     <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse"></div>
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#10b981]">Sesión Activa</span>
                     </div>
                     <input type="text" defaultValue={activeMeeting.session_title} className="bg-transparent border-none outline-none text-lg font-black uppercase tracking-tighter text-white focus:text-[#10b981] transition-colors w-64" />
                  </div>
                  <div className="flex items-center gap-4">
                     <div className="flex bg-neutral-900 rounded-lg p-1">
                        <button onMouseDown={(e) => highlight(e, 'rgba(16,185,129,0.3)')} className="w-8 h-8 rounded flex items-center justify-center text-[#10b981] hover:bg-[#10b981]/10"><Highlighter size={14}/></button>
                        <button onMouseDown={(e) => highlight(e, 'rgba(239,68,68,0.3)')} className="w-8 h-8 rounded flex items-center justify-center text-red-500 hover:bg-red-500/10"><Highlighter size={14}/></button>
                        <button onMouseDown={(e) => highlight(e, 'rgba(59,130,246,0.3)')} className="w-8 h-8 rounded flex items-center justify-center text-blue-500 hover:bg-blue-500/10"><Highlighter size={14}/></button>
                     </div>
                     <div className="h-6 w-[1px] bg-white/5"></div>
                     <div className="flex gap-2">
                        {EDITOR_TAGS.map(tag => (
                          <button key={tag.name} onMouseDown={(e) => insertTag(e, tag.name, tag.color)} className="px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest border border-white/5 text-neutral-500 hover:text-white hover:border-white/20 transition-all">#{tag.name}</button>
                        ))}
                     </div>
                  </div>
               </header>

               <div className="flex-1 relative bg-gradient-to-br from-[#0b0c0e] via-[#121417] to-[#0b0c0e]">
                  <div ref={editorRef} contentEditable="true" suppressContentEditableWarning={true} className="w-full h-full p-20 text-white font-medium text-xl leading-relaxed outline-none mac-scrollbar overflow-y-auto max-w-[1000px] mx-auto prose prose-invert prose-emerald" dangerouslySetInnerHTML={{ __html: activeMeeting.contenido || '<p><br></p>' }} />
                  <button onMouseDown={(e) => { e.preventDefault(); setShowAIModal(true); }} className="absolute bottom-12 right-12 w-16 h-16 bg-[#10b981] text-white rounded-3xl shadow-[0_20px_40px_rgba(16,185,129,0.3)] flex items-center justify-center transition-all hover:scale-110 active:scale-95 group">
                     <Sparkles size={28} className="group-hover:rotate-12 transition-transform"/>
                  </button>
               </div>
            </main>
          </div>
        )}

        {/* LISTA DE PLANES (AGENCIA) */}
        {viewState === 'plan-list' && (
          <main className="h-full overflow-y-auto p-12 space-y-12 animate-in fade-in duration-500">
             <div className="space-y-2">
                <p className="text-[10px] font-black text-[#10b981] uppercase tracking-[0.5em]">Nexus Agency Control</p>
                <h2 className="text-5xl font-black tracking-tighter uppercase leading-none">Planes de Marketing</h2>
             </div>
             <div className="grid grid-cols-4 gap-8">
                {AGENCY_PLANS.map((plan) => (
                  <div key={plan.name} onClick={() => { setActiveAgencyPlan(plan); setViewState('plan-detail'); }} className="bg-[#121417] border-white/10 shadow-2xl p-10 rounded-[3rem] border border-white/5 hover:border-[#10b981]/30 transition-all group cursor-pointer relative overflow-hidden h-96 flex flex-col justify-between">
                     <div className="relative z-10">
                        <div className="w-16 h-16 bg-gradient-to-br from-[#0b0c0e] via-[#121417] to-[#0b0c0e] rounded-3xl flex items-center justify-center mb-8 border border-white/10 group-hover:scale-110 transition-transform">
                           <Layers size={32} style={{ color: plan.color }}/>
                        </div>
                        <h3 className="text-2xl font-black text-white uppercase tracking-tighter leading-none mb-4">{plan.name}</h3>
                        <div className="flex items-center gap-2 text-neutral-700 text-[10px] font-black uppercase tracking-widest">
                           <Users size={14}/> 0 Clientes Activos
                        </div>
                     </div>
                     <button className="w-full py-5 bg-gradient-to-br from-[#0b0c0e] via-[#121417] to-[#0b0c0e] rounded-2xl text-[10px] font-black uppercase tracking-widest text-neutral-600 group-hover:bg-[#10b981] group-hover:text-white transition-all">Gestionar Plan</button>
                     <div className="absolute top-0 right-0 w-32 h-32 blur-[100px] opacity-20" style={{ backgroundColor: plan.color }}></div>
                  </div>
                ))}
             </div>
          </main>
        )}

        {/* DETALLE DE PLAN (CLIENTES DENTRO DEL PLAN) */}
        {viewState === 'plan-detail' && activeAgencyPlan && (
           <main className="h-full overflow-y-auto p-12 space-y-12 animate-in slide-in-from-right duration-500">
              <button onClick={() => setViewState('plan-list')} className="flex items-center gap-3 text-neutral-700 hover:text-white transition-colors uppercase font-black text-[10px] tracking-widest"><ArrowLeft size={16}/> Volver a Planes</button>
              <div className="flex justify-between items-end">
                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-[0.5em]" style={{ color: activeAgencyPlan.color }}>{activeAgencyPlan.name}</p>
                  <h2 className="text-5xl font-black tracking-tighter uppercase leading-none">Matriz de Socios</h2>
                </div>
                <button onClick={() => setIsClientModalOpen(true)} className="px-8 py-4 bg-[#10b981] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3 shadow-2xl shadow-[#10b981]/20"><Plus size={18} strokeWidth={3}/> Agregar Socio</button>
             </div>
             <div className="grid grid-cols-5 gap-4">
                {/* LISTA DE CLIENTES DEL PLAN (5 POR FILA) */}
                {[1,2].map(i => (
                  <div key={i} className="bg-[#121417] border-white/10 shadow-2xl rounded-3xl p-6 border border-white/5 hover:border-[#10b981]/40 transition-all group cursor-pointer">
                     <div className="flex justify-between items-start mb-6">
                        <div className="w-12 h-12 bg-gradient-to-br from-[#0b0c0e] via-[#121417] to-[#0b0c0e] rounded-2xl border border-white/10 flex items-center justify-center"><UserIcon size={20} className="text-neutral-700"/></div>
                        <div className="px-3 py-1 bg-[#10b981]/10 rounded text-[7px] font-black text-[#10b981] uppercase tracking-widest">Inmueble {i}</div>
                     </div>
                     <h3 className="text-sm font-black text-white uppercase tracking-tighter truncate mb-1">Partner Corporativo {i}</h3>
                     <p className="text-[8px] text-neutral-600 font-bold uppercase tracking-widest mb-6">Miami, FL</p>
                     <button className="w-full py-3 bg-gradient-to-br from-[#0b0c0e] via-[#121417] to-[#0b0c0e] rounded-xl text-[8px] font-black uppercase tracking-widest text-neutral-600 group-hover:text-white group-hover:bg-[#10b981] transition-all">Ver Sesiones</button>
                  </div>
                ))}
             </div>
           </main>
        )}
      </div>

      {/* MODAL IA ORACLE */}
      {showAIModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/90 backdrop-blur-2xl p-10 animate-in zoom-in duration-300">
           <div className="bg-[#121417] border-white/10 shadow-2xl rounded-[4rem] p-20 w-full max-w-4xl border border-white/5 shadow-2xl">
              <div className="flex items-center gap-6 mb-12">
                 <div className="w-16 h-16 bg-[#10b981] rounded-3xl flex items-center justify-center text-white"><Sparkles size={32}/></div>
                 <h4 className="text-5xl font-black text-white uppercase tracking-tighter leading-none">IA <span className="text-[#10b981]">Oracle</span></h4>
              </div>
              <textarea autoFocus placeholder="Describe la visión para esta producción..." className="w-full bg-gradient-to-br from-[#0b0c0e] via-[#121417] to-[#0b0c0e] rounded-[3rem] p-12 text-xl outline-none h-64 resize-none mb-12 border border-white/5 focus:border-[#10b981]/30 transition-all text-white font-medium" />
              <div className="flex gap-8">
                <button onClick={() => setShowAIModal(false)} className="flex-1 py-8 text-neutral-700 font-black uppercase text-[12px] tracking-widest hover:text-white">Abortar</button>
                <button className="flex-[2] py-8 bg-[#10b981] text-white font-black rounded-[3rem] uppercase text-[12px] tracking-[0.4em] flex items-center justify-center gap-4 hover:scale-105 transition-all">Invocar Oráculo</button>
              </div>
           </div>
        </div>
      )}

      {/* MODAL CREAR CLIENTE */}
      {isClientModalOpen && (
        <div className="fixed inset-0 z-[900] flex items-center justify-center bg-black/95 backdrop-blur-3xl p-8 animate-in zoom-in duration-300">
          <div className="bg-[#121417] border-white/10 shadow-2xl border-t-8 border-[#10b981] rounded-[4rem] w-full max-w-2xl p-16 space-y-12">
            <div className="text-center space-y-4">
              <h3 className="text-5xl font-black text-white uppercase tracking-tighter leading-none">Nuevo <span className="text-[#10b981]">Nexus</span></h3>
              <p className="text-neutral-700 font-bold uppercase tracking-[0.4em] text-[10px]">Portal de Sincronización de Identidad</p>
            </div>
            <div className="space-y-6">
              <input type="text" value={newClient.nombre} onChange={e=>setNewClient({...newClient, nombre: e.target.value})} placeholder="Nombre Completo..." className="w-full bg-gradient-to-br from-[#0b0c0e] via-[#121417] to-[#0b0c0e] rounded-3xl p-8 text-xl outline-none border border-white/5 focus:border-[#10b981]/30 transition-all text-white" />
              <input type="email" value={newClient.email} onChange={e=>setNewClient({...newClient, email: e.target.value})} placeholder="Email Corporativo..." className="w-full bg-gradient-to-br from-[#0b0c0e] via-[#121417] to-[#0b0c0e] rounded-3xl p-8 text-xl outline-none border border-white/5 focus:border-[#10b981]/30 transition-all text-white" />
              <div className="grid grid-cols-2 gap-6">
                <input type="text" value={newClient.pais} onChange={e=>setNewClient({...newClient, pais: e.target.value})} placeholder="País..." className="w-full bg-gradient-to-br from-[#0b0c0e] via-[#121417] to-[#0b0c0e] rounded-3xl p-8 text-xl outline-none border border-white/5 focus:border-[#10b981]/30 transition-all text-white" />
                <input type="text" value={newClient.empresa} onChange={e=>setNewClient({...newClient, empresa: e.target.value})} placeholder="Empresa..." className="w-full bg-gradient-to-br from-[#0b0c0e] via-[#121417] to-[#0b0c0e] rounded-3xl p-8 text-xl outline-none border border-white/5 focus:border-[#10b981]/30 transition-all text-white" />
              </div>
            </div>
            <div className="flex gap-8">
              <button onClick={() => setIsClientModalOpen(false)} className="flex-1 py-8 text-neutral-700 font-black uppercase text-[12px] tracking-widest hover:text-white">Cancelar</button>
              <button onClick={handleCreateClient} className="flex-[2] py-8 bg-[#10b981] text-white rounded-[3rem] font-black uppercase text-[12px] tracking-[0.4em] hover:scale-105 transition-all shadow-2xl shadow-[#10b981]/30">Establecer Nexo</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MeetingStudio;
