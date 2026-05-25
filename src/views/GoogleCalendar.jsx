import React, { useState, useEffect, useMemo } from 'react';
import {
  Menu, Search, HelpCircle, Settings, ChevronLeft, ChevronRight,
  Plus, X, CheckCircle2, Clock, MapPin, Grid, RefreshCw, ChevronDown, Check,
  Calendar as CalendarIcon, Filter, Layers, Zap, Target, Star, MoreHorizontal
} from 'lucide-react';
import { getCalendarList, getCalendarEvents, createCalendarEvent } from '../lib/googleApi';
import { getTheme } from '../lib/theme';

const GoogleCalendar = ({ token, user, settings, isDark = true }) => {
  const t = useMemo(() => getTheme(isDark), [isDark]);
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
      const initialSelected = list.filter(c => t.selected).map(c => t.id);
      setSelectedCalendars(initialSelected.length > 0 ? initialSelected : ['primary']);
      
      const writeable = list.filter(c => t.accessRole === 'owner' || t.accessRole === 'writer');
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
      days.push(<div key={`prev-${i}`} className="h-full border-r border-b p-2 opacity-20" style={{ borderColor: t.border, backgroundColor: t.accentSoft }}><span style={{ fontSize: 9, color: t.textMuted }}>{prevMonthDays - i}</span></div>);
    }
    
    for (let d = 1; d <= daysInMonth; d++) {
      const dayDate = new Date(year, month, d);
      const isToday = new Date().toDateString() === dayDate.toDateString();
      const dayEvents = events.filter(e => new Date(e.start.dateTime || e.start.date).toDateString() === dayDate.toDateString());

      days.push(
        <div key={d} className="h-full border-r border-b p-1 flex flex-col relative" style={{ borderColor: t.border, backgroundColor: isToday ? t.accentSoft : 'transparent' }}>
          <div className="flex justify-center mb-1">
            <span style={{ fontSize: 10, fontWeight: 700, width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', backgroundColor: isToday ? t.accent : 'transparent', color: isToday ? '#000' : t.textMuted }}>{d}</span>
          </div>
          <div className="flex-1 space-y-0.5 overflow-hidden">
            {dayEvents.map((event, idx) => (
              <div key={idx} className="text-[9px] px-2 py-0.5 rounded truncate font-black text-white shadow-sm cursor-pointer" style={{ backgroundColor: event.backgroundColor || t.accent }} title={event.summary}>
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
    <div className="flex-1 h-full flex flex-col overflow-hidden font-sans" style={{ backgroundColor: t.bg, color: t.text }}>
      
      {/* HEADER */}
      <header className="h-16 flex items-center justify-between px-6" style={{ borderBottom: `1px solid ${t.border}`, backgroundColor: t.bg }}>
        <div className="flex items-center gap-6">
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: t.text, letterSpacing: '-0.02em', margin: 0 }}>Calendario</h2>
            <p style={{ fontSize: '0.75rem', color: t.textDim, marginTop: '4px', fontWeight: 500 }}>Google Sync</p>
          </div>
          
          <div className="flex items-center gap-1" style={{ backgroundColor: t.panel, padding: 4, borderRadius: 12, border: `1px solid ${t.border}` }}>
            <button onClick={() => setCurrentDate(new Date())} style={{ padding: '6px 16px', borderRadius: 10, fontSize: 8, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#fff', background: 'none', border: 'none', cursor: 'pointer' }}>Hoy</button>
            <div style={{ width: 1, height: 14, backgroundColor: t.borderLight, margin: '0 6px' }}></div>
            <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))} style={{ padding: 6, background: 'none', border: 'none', cursor: 'pointer', color: t.textMuted }}><ChevronLeft size={14}/></button>
            <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))} style={{ padding: 6, background: 'none', border: 'none', cursor: 'pointer', color: t.textMuted }}><ChevronRight size={14}/></button>
            <span style={{ fontSize: 11, fontWeight: 900, margin: '0 12px', color: '#fff', textTransform: 'uppercase', letterSpacing: '0.15em', minWidth: 120, textAlign: 'center' }}>
              {currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
           <button onClick={loadInitialData} style={{ padding: 10, backgroundColor: t.panel, borderRadius: 12, border: `1px solid ${t.border}`, color: t.textMuted, cursor: 'pointer' }}>
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''}/>
           </button>
           <div style={{ width: 1, height: 28, backgroundColor: t.borderLight }}></div>
           <div className="flex items-center gap-3">
              <div className="text-right">
                 <p style={{ fontSize: 9, fontWeight: 900, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.12em' }}>{user?.name || 'Usuario'}</p>
                 <p style={{ fontSize: 7, color: t.textDim, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em' }}>Sincronizado</p>
              </div>
              <div style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: t.panel, border: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: 14 }}>
                 {user?.name?.charAt(0) || 'G'}
              </div>
           </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        
        {/* PANEL IZQUIERDO */}
        <aside className="w-60 flex flex-col p-6" style={{ borderRight: `1px solid ${t.border}`, backgroundColor: t.bg }}>
           <button onClick={() => setIsModalOpen(true)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '14px 0', backgroundColor: t.accent, color: '#000', borderRadius: 12, fontWeight: 900, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.2em', border: 'none', cursor: 'pointer', marginBottom: 24 }}>
              <Plus size={18} strokeWidth={3}/> Nuevo Evento
           </button>

           <div className="space-y-6">
              <div>
                 <h3 style={{ fontSize: 8, fontWeight: 900, color: t.textDim, textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}><Zap size={10} color={t.accent}/> Atajos Rápidos</h3>
                 <div className="space-y-2">
                    <button 
                      onClick={() => handleQuickAdd('client')}
                      className="w-full flex items-center gap-3 p-3 transition-all group" style={{ backgroundColor: t.accentSoft, border: `1px solid ${t.border}`, borderRadius: 10 }}
                    >
                       <Star size={12} color={t.accent}/>
                       <span style={{ fontSize: 8, fontWeight: 900, color: t.textMuted, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Sesión con Cliente</span>
                    </button>
                    <button 
                      onClick={() => handleQuickAdd('deepwork')}
                      className="w-full flex items-center gap-3 p-3 transition-all group" style={{ backgroundColor: t.accentSoft, border: `1px solid ${t.border}`, borderRadius: 10 }}
                    >
                       <Layers size={12} color={t.accent}/>
                       <span style={{ fontSize: 8, fontWeight: 900, color: t.textMuted, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Deep Work Edition</span>
                    </button>
                 </div>
              </div>

              <div>
                 <h3 style={{ fontSize: 8, fontWeight: 900, color: t.textDim, textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}><Target size={10} color={t.accent}/> Objetivo del Día</h3>
                 <div style={{ backgroundColor: t.accentSoft, padding: 14, borderRadius: 12, border: `1px solid ${t.borderLight}` }}>
                    <p style={{ fontSize: 9, fontWeight: 700, color: t.textMuted, lineHeight: 1.5, fontStyle: 'italic' }}>"Tu tiempo es el activo más caro. Úsalo para crear, no para gestionar."</p>
                 </div>
              </div>
           </div>
        </aside>

        {/* MAIN CALENDAR GRID */}
        <main className="flex-1 flex flex-col overflow-hidden" style={{ backgroundColor: t.bg }}>
          <div className="grid grid-cols-7 h-10" style={{ borderBottom: `1px solid ${t.border}`, backgroundColor: t.panel }}>
            {['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'].map(day => (
              <div key={day} className="flex items-center justify-center" style={{ fontSize: 9, fontWeight: 900, color: t.textDim, letterSpacing: '0.2em' }}>{day}</div>
            ))}
          </div>
          <div className="flex-1 grid grid-cols-7 grid-rows-5 overflow-hidden" style={{ borderLeft: `1px solid ${t.border}` }}>
            {loading && events.length === 0 ? (
              <div className="col-span-7 row-span-5 flex flex-col items-center justify-center">
                 <RefreshCw style={{ color: t.accent, marginBottom: 12 }} className="animate-spin" size={28}/>
                 <p style={{ fontSize: 8, color: t.textDim, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.3em' }}>Sincronizando...</p>
              </div>
            ) : renderCalendar()}
          </div>
        </main>

        {/* PANEL DERECHO */}
        <aside className="w-60 flex flex-col p-5 overflow-y-auto mac-scrollbar" style={{ borderLeft: `1px solid ${t.border}`, backgroundColor: t.bg }}>
           <h3 style={{ fontSize: 9, fontWeight: 900, color: t.textDim, textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}><Filter size={12} color={t.accent}/> Calendarios</h3>
           <div className="space-y-1.5">
              {calendarList.length === 0 && <p style={{ fontSize: 8, color: t.textDim, fontWeight: 700, textTransform: 'uppercase', textAlign: 'center', padding: 16 }}>No hay calendarios disponibles.</p>}
              {calendarList.map(cal => (
                 <div 
                   key={cal.id} 
                   onClick={() => setSelectedCalendars(prev => prev.includes(cal.id) ? prev.filter(i => i !== cal.id) : [...prev, cal.id])}
                   className="flex items-center justify-between p-3 transition-all cursor-pointer"
                   style={{ backgroundColor: selectedCalendars.includes(cal.id) ? t.accentSoft : 'transparent', borderRadius: 10, border: `1px solid ${selectedCalendars.includes(cal.id) ? t.borderLight : 'transparent'}` }}
                 >
                    <div className="flex items-center gap-2.5">
                       <div style={{ width: 14, height: 14, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: cal.backgroundColor, opacity: selectedCalendars.includes(cal.id) ? 1 : 0.4 }}>
                          {selectedCalendars.includes(cal.id) && <Check size={8} color="#fff"/>}
                       </div>
                       <span style={{ fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', color: selectedCalendars.includes(cal.id) ? '#fff' : t.textDim, overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 120 }}>{cal.summary}</span>
                    </div>
                    {cal.accessRole === 'owner' && <div style={{ width: 4, height: 4, borderRadius: '50%', backgroundColor: t.accent }}></div>}
                 </div>
              ))}
           </div>
        </aside>
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6" style={{ backgroundColor: 'rgba(20,20,20,0.9)', backdropFilter: 'blur(16px)' }}>
          <div style={{ backgroundColor: t.panel, width: '100%', maxWidth: 480, borderRadius: 20, border: `1px solid ${t.borderLight}`, overflow: 'hidden' }}>
            <header className="flex justify-between items-center px-6 py-5" style={{ borderBottom: `1px solid ${t.border}` }}>
               <div className="flex items-center gap-2.5">
                  <div style={{ width: 28, height: 28, backgroundColor: t.accentSoft, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                     <Plus color={t.accent} size={14}/>
                  </div>
                  <h3 style={{ fontSize: 10, fontWeight: 900, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Nuevo Evento</h3>
               </div>
               <button onClick={() => setIsModalOpen(false)} style={{ color: t.textDim, background: 'none', border: 'none', cursor: 'pointer' }}><X size={20}/></button>
            </header>
            
            <form onSubmit={handleCreateEvent} className="p-6 space-y-5">
               <div className="space-y-1.5">
                  <label style={{ fontSize: 8, fontWeight: 900, color: t.textDim, textTransform: 'uppercase', letterSpacing: '0.12em', marginLeft: 4 }}>Título</label>
                  <input type="text" required placeholder="Título del evento" value={title} onChange={e => setTitle(e.target.value)} 
                    style={{ width: '100%', backgroundColor: t.bg, border: `1px solid ${t.border}`, borderRadius: 10, padding: '12px 16px', fontSize: 12, fontWeight: 700, color: '#fff', outline: 'none' }}/>
               </div>
               
               <div className="space-y-1.5">
                 <label style={{ fontSize: 8, fontWeight: 900, color: t.textDim, textTransform: 'uppercase', letterSpacing: '0.12em', marginLeft: 4 }}>Calendario</label>
                 <select 
                   value={targetCalendarId} 
                   onChange={(e) => setTargetCalendarId(e.target.value)}
                   style={{ width: '100%', backgroundColor: t.bg, border: `1px solid ${t.border}`, borderRadius: 10, padding: '12px 16px', fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#fff', outline: 'none', appearance: 'none' }}
                 >
                   {calendarList.length === 0 && <option value="primary">Cargando calendarios...</option>}
                   {calendarList.map(cal => (
                     <option key={cal.id} value={cal.id} className="bg-neutral-900 text-white">{cal.summary}</option>
                   ))}
                 </select>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                     <label style={{ fontSize: 8, fontWeight: 900, color: t.textDim, textTransform: 'uppercase', letterSpacing: '0.12em', marginLeft: 4 }}>Fecha</label>
                     <div className="flex items-center gap-2" style={{ backgroundColor: t.bg, border: `1px solid ${t.border}`, padding: '10px 14px', borderRadius: 10 }}>
                       <Clock size={14} color={t.accent}/>
                       <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ backgroundColor: 'transparent', fontSize: 11, fontWeight: 700, color: '#fff', outline: 'none', width: '100%', border: 'none' }}/>
                     </div>
                  </div>
                  <div className="space-y-1.5">
                     <label style={{ fontSize: 8, fontWeight: 900, color: t.textDim, textTransform: 'uppercase', letterSpacing: '0.12em', marginLeft: 4 }}>Inicio</label>
                     <div style={{ backgroundColor: t.bg, border: `1px solid ${t.border}`, padding: '10px 14px', borderRadius: 10 }}>
                       <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} style={{ backgroundColor: 'transparent', fontSize: 11, fontWeight: 700, color: '#fff', outline: 'none', width: '100%', border: 'none' }}/>
                     </div>
                  </div>
               </div>

               <button type="submit" disabled={loading}
                 style={{ width: '100%', padding: '14px 0', backgroundColor: t.accent, color: '#000', borderRadius: 14, fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                 {loading ? <RefreshCw className="animate-spin" size={16}/> : <CheckCircle2 size={16}/>} 
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
