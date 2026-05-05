import React, { useState, useEffect } from 'react';
import { 
  Menu, Search, HelpCircle, Settings, ChevronLeft, ChevronRight, 
  Plus, X, CheckCircle2, Clock, MapPin, Grid, RefreshCw, ChevronDown, Check, 
  Calendar as CalendarIcon, Filter, Layers, Zap, Target, Star, MoreHorizontal
} from 'lucide-react';
import { getCalendarList, getCalendarEvents, createCalendarEvent } from '../lib/googleApi';

const GoogleCalendar = ({ token, user }) => {
  const [calendarList, setCalendarList] = useState([]);
  const [selectedCalendars, setSelectedCalendars] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('11:00');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [targetCalendarId, setTargetCalendarId] = useState('primary');

  useEffect(() => {
    if (token) loadInitialData();
  }, [token]);

  useEffect(() => {
    if (token && (selectedCalendars.length > 0 || calendarList.length > 0)) loadAllEvents();
  }, [token, currentDate, selectedCalendars]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const list = await getCalendarList(token);
      setCalendarList(list);
      const initialSelected = list.filter(c => c.selected).map(c => c.id);
      setSelectedCalendars(initialSelected.length > 0 ? initialSelected : ['primary']);
      
      const writeable = list.filter(c => c.accessRole === 'owner' || c.accessRole === 'writer');
      setTargetCalendarId(writeable.length > 0 ? writeable[0].id : 'primary');
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAllEvents = async () => {
    setLoading(true);
    try {
      const idsToFetch = selectedCalendars.length > 0 ? selectedCalendars : ['primary'];
      const allEventsPromises = idsToFetch.map(id => 
        getCalendarEvents(token, id, currentDate.getFullYear(), currentDate.getMonth())
      );
      const results = await Promise.all(allEventsPromises);
      setEvents(results.flat());
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const eventData = {
        summary: title,
        location,
        description,
        start: { dateTime: `${date}T${startTime}:00Z`, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
        end: { dateTime: `${date}T${endTime}:00Z`, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
      };
      await createCalendarEvent(token, eventData, targetCalendarId);
      setIsModalOpen(false);
      setTitle('');
      loadAllEvents();
      alert('¡Sincronización Exitosa! Evento añadido a Google.');
    } catch (error) {
      const msg = error.response?.data?.error?.message || error.message;
      alert(`Error de sincronización: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAdd = (type) => {
    if (type === 'client') {
      setTitle('Sesión con Cliente');
      setStartTime('10:00');
      setEndTime('11:00');
      setDescription('Reunión estratégica para revisión de proyecto y entrega.');
    } else if (type === 'deepwork') {
      setTitle('🚀 Deep Work Edition');
      setStartTime('09:00');
      setEndTime('12:00');
      setDescription('Bloque de enfoque total: Edición de video y post-producción sin interrupciones.');
    }
    setIsModalOpen(true);
  };

  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    const prevMonthDays = new Date(year, month, 0).getDate();
    const days = [];

    for (let i = firstDay - 1; i >= 0; i--) {
      days.push(<div key={`prev-${i}`} className="h-full border-r border-b border-white/5 bg-white/[0.02] p-2 opacity-20"><span className="text-[10px] text-neutral-400">{prevMonthDays - i}</span></div>);
    }
    
    for (let d = 1; d <= daysInMonth; d++) {
      const dayDate = new Date(year, month, d);
      const isToday = new Date().toDateString() === dayDate.toDateString();
      const dayEvents = events.filter(e => new Date(e.start.dateTime || e.start.date).toDateString() === dayDate.toDateString());

      days.push(
        <div key={d} className={`h-full border-r border-b border-white/5 p-1 flex flex-col relative hover:bg-white/[0.03] transition-all ${isToday ? 'bg-blue-500/5' : ''}`}>
          <div className="flex justify-center mb-1">
            <span className={`text-[11px] font-bold w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]' : 'text-neutral-500'}`}>{d}</span>
          </div>
          <div className="flex-1 space-y-0.5 overflow-hidden">
            {dayEvents.map((event, idx) => (
              <div key={idx} className="text-[9px] px-2 py-0.5 rounded truncate font-black text-white shadow-sm cursor-pointer hover:scale-[1.02] transition-transform" style={{ backgroundColor: event.backgroundColor || '#2563eb' }} title={event.summary}>
                {event.summary || '(Sin título)'}
              </div>
            ))}
          </div>
        </div>
      );
    }
    return days;
  };

  return (
    <div className="flex-1 h-full flex flex-col bg-[#030303] text-neutral-200 overflow-hidden font-sans">
      
      {/* HEADER EXECUTIVE */}
      <header className="h-16 flex items-center justify-between px-6 border-b border-white/10 bg-black">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
             <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/20">
                <CalendarIcon className="text-white" size={18}/>
             </div>
             <div>
                <h2 className="text-sm font-black uppercase tracking-tighter text-white">Sovereign Scheduler</h2>
                <div className="flex items-center gap-1.5">
                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                   <p className="text-[8px] text-neutral-500 font-black uppercase tracking-[0.2em]">Real-time Google Sync</p>
                </div>
             </div>
          </div>
          
          <div className="flex items-center gap-1 ml-4 bg-white/5 p-1 rounded-lg border border-white/5">
            <button onClick={() => setCurrentDate(new Date())} className="px-4 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest hover:bg-white/10 text-white transition-all">Hoy</button>
            <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))} className="p-2 hover:bg-white/10 rounded-lg text-neutral-400"><ChevronLeft size={16}/></button>
            <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))} className="p-2 hover:bg-white/10 rounded-lg text-neutral-400"><ChevronRight size={16}/></button>
            <span className="text-sm font-bold ml-4 mr-4 text-white uppercase tracking-widest">
              {currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
           <button onClick={loadInitialData} className="p-2.5 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 text-neutral-400 transition-all">
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''}/>
           </button>
           <div className="h-8 w-px bg-white/10"></div>
           <div className="flex items-center gap-3">
              <div className="text-right">
                 <p className="text-[9px] font-black text-white uppercase tracking-widest">{user?.name || 'Director'}</p>
                 <p className="text-[8px] text-neutral-500 font-bold uppercase tracking-widest">Sovereign OS</p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-blue-600 border border-blue-400/30 flex items-center justify-center text-white font-black text-sm">
                 {user?.name?.charAt(0) || 'G'}
              </div>
           </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        
        {/* PANEL IZQUIERDO: PRODUCTIVIDAD */}
        <aside className="w-64 flex flex-col p-6 border-r border-white/5 bg-[#050505]">
           <button onClick={() => setIsModalOpen(true)} className="w-full flex items-center justify-center gap-3 py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-[0_10px_30px_rgba(37,99,235,0.3)] hover:bg-blue-500 transition-all mb-8 active:scale-95">
              <Plus size={18}/> Nuevo Evento
           </button>

           <div className="space-y-8">
              <div>
                 <h3 className="text-[9px] font-black text-neutral-600 uppercase tracking-[0.2em] mb-4 flex items-center gap-2"><Zap size={12} className="text-amber-500"/> Atajos Rápidos</h3>
                 <div className="space-y-2">
                    <button 
                      onClick={() => handleQuickAdd('client')}
                      className="w-full flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl transition-all group"
                    >
                       <Star size={14} className="text-blue-500 group-hover:scale-110 transition-transform"/>
                       <span className="text-[9px] font-black text-neutral-400 uppercase tracking-widest">Sesión con Cliente</span>
                    </button>
                    <button 
                      onClick={() => handleQuickAdd('deepwork')}
                      className="w-full flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl transition-all group"
                    >
                       <Layers size={14} className="text-emerald-500 group-hover:scale-110 transition-transform"/>
                       <span className="text-[9px] font-black text-neutral-400 uppercase tracking-widest">Deep Work Edition</span>
                    </button>
                 </div>
              </div>

              <div>
                 <h3 className="text-[9px] font-black text-neutral-600 uppercase tracking-[0.2em] mb-4 flex items-center gap-2"><Target size={12} className="text-red-500"/> Objetivo del Día</h3>
                 <div className="bg-gradient-to-br from-blue-600/10 to-transparent p-4 rounded-2xl border border-blue-500/10">
                    <p className="text-[10px] font-bold text-neutral-300 leading-relaxed italic">"Tu tiempo es el activo más caro. Úsalo para crear, no para gestionar."</p>
                 </div>
              </div>
           </div>
        </aside>

        {/* MAIN CALENDAR GRID */}
        <main className="flex-1 flex flex-col overflow-hidden bg-[#030303]">
          <div className="grid grid-cols-7 h-12 border-b border-white/5 bg-black/40">
            {['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'].map(day => (
              <div key={day} className="flex items-center justify-center text-[10px] font-black text-neutral-500 tracking-[0.25em]">{day}</div>
            ))}
          </div>
          <div className="flex-1 grid grid-cols-7 grid-rows-5 overflow-hidden border-l border-white/5">
            {loading && events.length === 0 ? (
              <div className="col-span-7 row-span-5 flex flex-col items-center justify-center bg-black/40 backdrop-blur-md z-10">
                 <RefreshCw className="text-blue-500 animate-spin mb-4" size={32}/>
                 <p className="text-[9px] text-neutral-500 font-black uppercase tracking-[0.4em]">Engine Synchronizing...</p>
              </div>
            ) : renderCalendar()}
          </div>
        </main>

        {/* PANEL DERECHO: FILTROS (CALENDARIOS) */}
        <aside className="w-72 flex flex-col p-6 border-l border-white/5 bg-[#050505] overflow-y-auto mac-scrollbar">
           <h3 className="text-[10px] font-black text-neutral-600 uppercase tracking-[0.2em] mb-6 flex items-center gap-2"><Filter size={14} className="text-blue-500"/> Capas de Tiempo</h3>
           <div className="space-y-2">
              {calendarList.length === 0 && <p className="text-[9px] text-neutral-700 font-bold uppercase italic text-center py-4">No se detectaron capas de calendario.</p>}
              {calendarList.map(cal => (
                 <div 
                   key={cal.id} 
                   onClick={() => setSelectedCalendars(prev => prev.includes(cal.id) ? prev.filter(i => i !== cal.id) : [...prev, cal.id])}
                   className={`flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer group ${selectedCalendars.includes(cal.id) ? 'bg-white/[0.03] border-white/10' : 'bg-transparent border-transparent'}`}
                 >
                    <div className="flex items-center gap-3">
                       <div className={`w-4 h-4 rounded-lg flex items-center justify-center transition-all ${selectedCalendars.includes(cal.id) ? 'shadow-lg' : 'opacity-40'}`} style={{ backgroundColor: cal.backgroundColor }}>
                          {selectedCalendars.includes(cal.id) && <Check size={10} className="text-white"/>}
                       </div>
                       <span className={`text-[10px] font-black uppercase tracking-widest truncate max-w-[140px] transition-colors ${selectedCalendars.includes(cal.id) ? 'text-white' : 'text-neutral-600 group-hover:text-neutral-400'}`}>{cal.summary}</span>
                    </div>
                    {cal.accessRole === 'owner' && <div className="w-1 h-1 rounded-full bg-blue-500"></div>}
                 </div>
              ))}
           </div>
        </aside>
      </div>

      {/* MODAL EXECUTIVE CREATOR */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl">
          <div className="bg-[#0f0f0f] w-full max-w-lg rounded-[32px] shadow-[0_40px_120px_rgba(0,0,0,1)] overflow-hidden border border-white/10 animate-in zoom-in-95 duration-300">
            <header className="flex justify-between items-center px-8 py-6 border-b border-white/5 bg-white/[0.02]">
               <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                     <Plus className="text-emerald-500" size={16}/>
                  </div>
                  <h3 className="text-[11px] font-black text-white uppercase tracking-[0.2em]">Agendar Nueva Sesión</h3>
               </div>
               <button onClick={() => setIsModalOpen(false)} className="text-neutral-500 hover:text-white transition-colors"><X size={24}/></button>
            </header>
            
            <form onSubmit={handleCreateEvent} className="p-8 space-y-6">
               <div className="space-y-2">
                  <label className="text-[9px] font-black text-neutral-600 uppercase tracking-widest ml-1">¿Qué vamos a hacer?</label>
                  <input type="text" required placeholder="Título del evento empresarial" value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-4 px-6 text-sm font-bold text-white outline-none focus:border-blue-500/50 transition-all placeholder-neutral-800 shadow-inner"/>
               </div>
               
               <div className="space-y-2">
                 <label className="text-[9px] font-black text-neutral-600 uppercase tracking-widest ml-1">Calendario de Destino</label>
                 <div className="relative group">
                    <select 
                      value={targetCalendarId} 
                      onChange={(e) => setTargetCalendarId(e.target.value)}
                      className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-4 px-6 text-[10px] font-black uppercase tracking-widest text-white outline-none appearance-none cursor-pointer focus:border-blue-500/50 transition-all"
                    >
                      {calendarList.length === 0 && <option value="primary">Cargando calendarios...</option>}
                      {calendarList.map(cal => (
                        <option key={cal.id} value={cal.id} className="bg-neutral-900 text-white font-sans">{cal.summary} {cal.accessRole === 'owner' ? '(Principal)' : ''}</option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-6 top-1/2 -translate-y-1/2 text-neutral-600 pointer-events-none group-hover:text-blue-500 transition-colors"/>
                 </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                     <label className="text-[9px] font-black text-neutral-600 uppercase tracking-widest ml-1">Fecha</label>
                     <div className="flex items-center gap-3 bg-white/[0.03] border border-white/5 p-4 rounded-2xl">
                       <Clock size={16} className="text-blue-500"/>
                       <input type="date" value={date} onChange={e => setDate(e.target.value)} className="bg-transparent text-xs font-bold text-white outline-none w-full [color-scheme:dark]"/>
                     </div>
                  </div>
                  <div className="space-y-2">
                     <label className="text-[9px] font-black text-neutral-600 uppercase tracking-widest ml-1">Hora Inicio</label>
                     <div className="flex items-center gap-3 bg-white/[0.03] border border-white/5 p-4 rounded-2xl">
                       <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="bg-transparent text-xs font-bold text-white outline-none w-full [color-scheme:dark]"/>
                     </div>
                  </div>
               </div>

               <button type="submit" disabled={loading} className="w-full py-5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-[20px] text-[10px] font-black uppercase tracking-[0.3em] hover:from-blue-500 hover:to-blue-600 transition-all flex items-center justify-center gap-4 shadow-[0_20px_40px_rgba(37,99,235,0.2)] mt-8 disabled:opacity-50 disabled:cursor-not-allowed">
                 {loading ? <RefreshCw className="animate-spin" size={18}/> : <CheckCircle2 size={18}/>} 
                 {loading ? 'Sincronizando...' : 'Confirmar en Google Calendar'}
               </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoogleCalendar;
