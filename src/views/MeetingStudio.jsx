import React, { useState, useRef, useEffect } from 'react';
import { 
  Plus, Users, Video, PlayCircle, ArrowLeft, MessageSquare, Save, FileText, Eraser, 
  Hash, DollarSign, FolderOpen, ExternalLink, Quote, X, Trash2, Search, Mail, 
  Instagram, Youtube, Globe, CreditCard, Phone, Camera, Filter, MoreVertical,
  Calendar, CheckCircle2, Clock, User as UserIcon, Tag, Play, Pause, RotateCcw, 
  Layers, ListChecks, History, Timer, Scissors, Music, Palette, Share2, Activity,
  Calculator as CalcIcon, RefreshCw, AlertCircle, Check, Link, Target, ChevronRight,
  Zap, Copy, Smartphone, Monitor, Info, HardDrive, Megaphone, Palette as BrandIcon,
  Building2, Globe as GlobeIcon, File, FileVideo, Image as ImageIcon, Folder, ChevronLeft,
  Upload, Download, Bold, Italic, Strikethrough, List, CheckSquare, Table2, Heading1, Heading2,
  Facebook, Smartphone as TiktokIcon, Cloud
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import GoogleTasks from '../components/GoogleTasks';
import { getDriveFiles, getCalendarEvents, getCalendarList, uploadFileToDrive, downloadDriveFile, deleteDriveFile } from '../lib/googleApi';
import { aiService } from '../services/aiService';
import { Sparkles } from 'lucide-react';
import { generateSovereignInvoice } from '../utils/invoiceGenerator';

const MeetingStudio = ({ meetingsList = [], setMeetingsList, settings = {}, token }) => {
  const [viewState, setViewState] = useState('client-list'); 
  const [activeClient, setActiveClient] = useState(null);
  const [activeMeeting, setActiveMeeting] = useState(null);
  const [rightPanelTab, setRightPanelTab] = useState('delivery');
  const [sessionTab, setSessionTab] = useState('editor'); // 'editor', 'drive', 'calendar'
  
  const [clients, setClients] = useState([]);
  const [clientSearch, setClientSearch] = useState('');
  const [meetingSearch, setMeetingSearch] = useState('');
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Google Drive en Sesión
  const [driveFiles, setDriveFiles] = useState([]);
  const [driveLoading, setDriveLoading] = useState(false);
  const [sessionFolder, setSessionFolder] = useState({ id: 'root', name: 'Mi Unidad' });
  const [driveHistory, setDriveHistory] = useState([]);

  // Google Calendar en Sesión
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [currentCalDate, setCurrentCalDate] = useState(new Date());
  const [sessionCalendarList, setSessionCalendarList] = useState([]);
  
  // Modal Evento en Sesión
  const [isCalModalOpen, setIsCalModalOpen] = useState(false);
  const [calTitle, setCalTitle] = useState('');
  const [calDate, setCalDate] = useState(new Date().toISOString().split('T')[0]);
  const [calStart, setCalStart] = useState('10:00');
  const [calEnd, setCalEnd] = useState('11:00');
  const [calDesc, setCalDesc] = useState('');
  const [calTargetId, setCalTargetId] = useState('primary');
  
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [time, setTime] = useState(0);
  const [rates, setRates] = useState({ USDT: 6.96, EUR: 7.52, BRL: 1.38 }); 
  
  const [calcDisplay, setCalcDisplay] = useState('0');
  const [convCurrency, setConvCurrency] = useState('USD');
  const [convAmount, setConvAmount] = useState('');

  const editorRef = useRef(null);
  const timerRef = useRef(null);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [tempNoteText, setTempNoteText] = useState('');
  const [pendingNoteRange, setPendingNoteRange] = useState(null);

  const [showAIModal, setShowAIModal] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const [newClient, setNewClient] = useState({
    nombre: '', 
    nombre_completo: '',
    identidad: '',
    email: '', 
    telefono: '', 
    pais: '', 
    empresa: '',
    metodo_pago_preferido: 'QR', 
    link_brutos: '',
    foto_url: '', 
    redes: { instagram: '', youtube: '', twitter: '', tiktok: '' }
  });

  useEffect(() => {
    fetchClients();
    fetchExchangeRates();
  }, []);

  const fetchExchangeRates = async () => {
    try {
      // Intentar obtener tipo de cambio oficial de una API gratuita
      const response = await fetch('https://open.er-api.com/v6/latest/USD');
      const data = await response.json();
      if (data && data.rates && data.rates.BOB) {
        // El oficial suele ser 6.96, pero esto nos dará el mercado internacional
        // Usamos el oficial de Bolivia 6.96 como base si la API falla o da algo muy distinto
        setRates(prev => ({
          ...prev,
          USDT: data.rates.BOB || 6.96,
          EUR: (data.rates.BOB / data.rates.EUR).toFixed(2) || 7.52
        }));
      }
    } catch (e) {
      console.error("Error al actualizar divisas:", e);
    }
  };

  useEffect(() => {
    if (isTimerRunning) {
      timerRef.current = setInterval(() => setTime(t => t + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isTimerRunning]);

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase.from('clientes_editor').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setClients(data || []);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const extractFolderId = (url) => {
    if (!url) return null;
    const match = url.match(/[-\w]{25,}/);
    return match ? match[0] : null;
  };

  const fetchDriveFiles = async (folderId) => {
    if (!token) return;
    setDriveLoading(true);
    try {
      const files = await getDriveFiles(token, folderId || sessionFolder.id);
      setDriveFiles(files || []);
    } catch (e) { console.error(e); }
    setDriveLoading(false);
  };

  const loadCalendarEvents = async () => {
    if (!token) return;
    setCalendarLoading(true);
    try {
      const list = await getCalendarList(token);
      setSessionCalendarList(list);
      
      const selectedIds = list.filter(c => c.selected).map(c => c.id);
      const allEventsPromises = selectedIds.length > 0 
        ? selectedIds.map(id => getCalendarEvents(token, id, currentCalDate.getFullYear(), currentCalDate.getMonth()))
        : [getCalendarEvents(token, 'primary', currentCalDate.getFullYear(), currentCalDate.getMonth())];
        
      const results = await Promise.all(allEventsPromises);
      setCalendarEvents(results.flat());

      const writeable = list.filter(c => c.accessRole === 'owner' || c.accessRole === 'writer');
      if (writeable.length > 0 && calTargetId === 'primary') setCalTargetId(writeable[0].id);
    } catch (e) { 
      console.error("Error cargando calendario en sesión:", e); 
    }
    setCalendarLoading(false);
  };

  const handleCreateSessionEvent = async (e) => {
    if (e) e.preventDefault();
    if (!calTitle) return;
    setCalendarLoading(true);
    try {
      const eventData = {
        summary: calTitle,
        description: calDesc,
        start: { dateTime: `${calDate}T${calStart}:00Z`, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
        end: { dateTime: `${calDate}T${calEnd}:00Z`, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
      };
      await createCalendarEvent(token, eventData, calTargetId);
      setIsCalModalOpen(false);
      setCalTitle('');
      loadCalendarEvents();
      alert('¡Reunión Sincronizada! Añadida a Google Calendar.');
    } catch (error) {
      alert(`Error de sincronización: ${error.message}`);
    } finally {
      setCalendarLoading(false);
    }
  };

  useEffect(() => {
    if (viewState === 'session') {
      if (sessionTab === 'drive') fetchDriveFiles();
      if (sessionTab === 'calendar') loadCalendarEvents();
    }
  }, [sessionTab, viewState, sessionFolder]);

  const navigateSessionDrive = (folder) => {
    setDriveHistory([...driveHistory, sessionFolder]);
    setSessionFolder(folder);
  };

  const goBackSessionDrive = () => {
    if (driveHistory.length === 0) return;
    const prev = driveHistory[driveHistory.length - 1];
    setDriveHistory(driveHistory.slice(0, -1));
    setSessionFolder(prev);
  };

  const handleCreateClient = async () => {
    if (!newClient.nombre) return;
    setLoading(true);
    try {
      const clientData = {
        nombre: newClient.nombre,
        nombre_completo: newClient.nombre_completo || '',
        identidad: newClient.identidad || '',
        email: newClient.email || '',
        telefono: newClient.telefono || '',
        pais: newClient.pais || '',
        empresa: newClient.empresa || '',
        metodo_pago_preferido: newClient.metodo_pago_preferido || 'QR',
        link_brutos: newClient.link_brutos || '',
        foto_url: newClient.foto_url || '',
        redes_sociales: newClient.redes || {},
        portal_id: newClient.portal_id || Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
      };

      if (newClient.id) {
        // ACTUALIZAR
        const { error } = await supabase.from('clientes_editor').update(clientData).eq('id', newClient.id);
        if (error) throw error;
      } else {
        // CREAR
        const { error } = await supabase.from('clientes_editor').insert(clientData);
        if (error) throw error;
      }

      await fetchClients();
      setIsClientModalOpen(false);
      setNewClient({
        nombre: '', nombre_completo: '', identidad: '', email: '', 
        telefono: '', pais: '', empresa: '', metodo_pago_preferido: 'QR', 
        link_brutos: '', foto_url: '', redes: { instagram: '', youtube: '', twitter: '', tiktok: '' }
      });
    } catch (e) { 
      console.error(e);
      alert(`Error: ${e.message}`); 
    }
    setLoading(false);
  };

  const moveToTrash = async (client, e) => {
    e.stopPropagation();
    if (!confirm(`¿Mover a ${client.nombre} a la papelera? Se borrará permanentemente en 30 días.`)) return;
    
    setLoading(true);
    try {
      // 1. Guardar en papelera
      await supabase.from('papelera').insert({
        tipo_dato: 'cliente',
        item_id: client.id,
        nombre_item: client.nombre,
        datos_originales: client
      });
      
      // 2. Borrar de la tabla principal
      await supabase.from('clientes_editor').delete().eq('id', client.id);
      
      await fetchClients();
      alert('Movido a la papelera correctamente.');
    } catch (e) {
      alert(e.message);
    }
    setLoading(false);
  };

  const startEditClient = (client, e) => {
    e.stopPropagation();
    setNewClient({
      id: client.id,
      nombre: client.nombre || '',
      nombre_completo: client.nombre_completo || '',
      identidad: client.identidad || '',
      email: client.email || '',
      telefono: client.telefono || '',
      pais: client.pais || '',
      empresa: client.empresa || '',
      metodo_pago_preferido: client.metodo_pago_preferido || 'QR',
      link_brutos: client.link_brutos || '',
      foto_url: client.foto_url || '',
      redes: client.redes_sociales || { instagram: '', youtube: '', twitter: '', tiktok: '' }
    });
    setIsClientModalOpen(true);
  };

  const fetchMeetings = async (clientId) => {
    try {
      const { data, error } = await supabase.from('reuniones').select('*').eq('cliente_id', clientId).order('created_at', { ascending: false });
      if (error) throw error;
      setMeetingsList(data || []);
    } catch (e) { console.error(e); }
  };

  const openClientProfile = (client) => { 
    setActiveClient(client); 
    fetchMeetings(client.id);
    setViewState('client-profile'); 
  };

  const openMeeting = (meeting) => { 
    const stableMeeting = {
      ...meeting,
      pipeline: Array.isArray(meeting.pipeline) ? meeting.pipeline : [
        { id: 1, label: 'Corte Bruto', done: false, icon: 'Scissors' },
        { id: 2, label: 'Audio/FX', done: false, icon: 'Music' },
        { id: 3, label: 'Color', done: false, icon: 'Palette' },
        { id: 4, label: 'Render', done: false, icon: 'Share2' }
      ],
      feedback: Array.isArray(meeting.feedback) ? meeting.feedback : [],
      hitos_pago: Array.isArray(meeting.hitos_pago) ? meeting.hitos_pago : [
        { id: 1, label: 'Adelanto', paid: false },
        { id: 2, label: 'Final', paid: false }
      ],
      deadlines_multiple: Array.isArray(meeting.deadlines_multiple) ? meeting.deadlines_multiple : [],
      referencias_multiple: Array.isArray(meeting.referencias_multiple) ? meeting.referencias_multiple : [],
      brand_kit: meeting.brand_kit || { colors: [], logo: '' },
      export_checklist: Array.isArray(meeting.export_checklist) ? meeting.export_checklist : [
        { id: 1, label: 'Vertical 9:16', done: false },
        { id: 2, label: 'Horizontal 16:9', done: false },
        { id: 3, label: 'Subtítulos', done: false }
      ],
      priority: meeting.priority || 'Baja',
      platforms: Array.isArray(meeting.platforms) ? meeting.platforms : [],
      social_kit: Array.isArray(meeting.social_kit) ? meeting.social_kit : [
        { id: 1, label: 'Miniatura', done: false },
        { id: 2, label: 'Clip Story', done: false }
      ],
      insights: Array.isArray(meeting.insights) ? meeting.insights : [],
      total_time: meeting.total_time || 0
    };
    setActiveMeeting(stableMeeting); 
    setTime(stableMeeting.total_time);
    setViewState('session'); 
  };

  const createMeeting = async () => {
    const newMeeting = { 
      id: crypto.randomUUID(), 
      cliente_id: activeClient.id,
      cliente: activeClient.nombre, 
      fecha: new Date().toISOString().split('T')[0], 
      estado: 'Pendiente', 
      link: '', drive: '', presupuesto: 0, contenido: '<p><br></p>', 
      insights: [], feedback: [], total_time: 0,
      pipeline: [
        { id: 1, label: 'Corte Bruto', done: false, icon: 'Scissors' },
        { id: 2, label: 'Audio/FX', done: false, icon: 'Music' },
        { id: 3, label: 'Color', done: false, icon: 'Palette' },
        { id: 4, label: 'Render', done: false, icon: 'Share2' }
      ],
      hitos_pago: [{ id: 1, label: 'Adelanto', paid: false }, { id: 2, label: 'Final', paid: false }],
      deadlines_multiple: [], referencias_multiple: [],
      brand_kit: { colors: [], logo: '' },
      export_checklist: [ { id: 1, label: 'Vertical 9:16', done: false }, { id: 2, label: 'Horizontal 16:9', done: false }, { id: 3, label: 'Subtítulos', done: false } ],
      priority: 'Baja',
      platforms: [],
      social_kit: [ { id: 1, label: 'Miniatura', done: false }, { id: 2, label: 'Clip Story', done: false } ]
    };
    setLoading(true);
    try {
      await supabase.from('reuniones').insert(newMeeting);
      setMeetingsList([...(meetingsList || []), newMeeting]); 
      openMeeting(newMeeting);
    } catch (error) { alert(error.message); }
    setLoading(false);
  };

  const saveMeeting = async () => {
    setLoading(true);
    try {
      const updatedMeeting = { ...activeMeeting, total_time: time };
      await supabase.from('reuniones').upsert(updatedMeeting);
      setMeetingsList((meetingsList || []).map(m => m.id === updatedMeeting.id ? updatedMeeting : m));
      setViewState('client-profile'); 
      setActiveMeeting(null);
      setIsTimerRunning(false);
    } catch (error) { alert(error.message); }
    setLoading(false);
  };

  const copyBillingSummary = () => {
    const paid = activeMeeting.hitos_pago.filter(h=>h.paid).length;
    const total = activeMeeting.hitos_pago.length;
    const text = `⭐ RESUMEN DE PRODUCCIÓN ⭐\n\n📌 Cliente: ${activeClient.nombre}\n📅 Fecha: ${activeMeeting.fecha}\n💰 Presupuesto: ${activeMeeting.presupuesto} $\n✅ Pagos: ${paid}/${total} completados\n🚀 Status: ${activeMeeting.priority} Prioridad\n\n¡Gracias por confiar en mi estudio!`;
    navigator.clipboard.writeText(text);
    alert('¡Resumen profesional copiado al portapapeles!');
  };

  const handleCalc = (val) => {
    if (val === '=') {
      try { setCalcDisplay(eval(calcDisplay.replace(/[^-()\d/*+.]/g, '')).toString()); } catch (e) { setCalcDisplay('Error'); }
    } else if (val === 'C') {
      setCalcDisplay('0');
    } else if (val === 'DEL') {
      setCalcDisplay(prev => prev.length > 1 ? prev.slice(0, -1) : '0');
    } else {
      setCalcDisplay(prev => prev === '0' ? val : prev + val);
    }
  };

  const formatTime = (s) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const applyHighlight = (colorHex, e) => { e.preventDefault(); document.execCommand('hiliteColor', false, colorHex); };
  const clearHighlight = (e) => { e.preventDefault(); document.execCommand('hiliteColor', false, 'transparent'); };
  const initNoteAddition = (e) => { 
    e.preventDefault(); 
    const selection = window.getSelection(); 
    if (!selection.rangeCount || selection.isCollapsed) return; 
    
    // Insert a temporary marker to hold the position and text
    const text = selection.toString();
    const html = `<span id="temp-note-marker" class="annotated-text-pending">${text}</span>`;
    document.execCommand('insertHTML', false, html);
    
    setShowNoteModal(true); 
  };

  const cancelAddNote = () => {
    const marker = editorRef.current?.querySelector('#temp-note-marker');
    if (marker) {
      // Revert marker to plain text if cancelled
      const textNode = document.createTextNode(marker.textContent);
      marker.parentNode.replaceChild(textNode, marker);
    }
    setShowNoteModal(false);
    setTempNoteText('');
  };

  const confirmAddNote = () => { 
    const marker = editorRef.current?.querySelector('#temp-note-marker');
    
    if (!tempNoteText) { 
      cancelAddNote();
      return; 
    } 
    
    if (marker) {
      // Upgrade marker to actual note
      marker.removeAttribute('id');
      marker.className = 'annotated-text';
      const safeNote = tempNoteText.replace(/"/g, '&quot;');
      marker.setAttribute('data-note', safeNote);

      // Mover el cursor fuera del span para poder escribir normalmente
      const spaceNode = document.createTextNode('\u200B'); // Espacio de ancho cero
      if (marker.nextSibling) {
        marker.parentNode.insertBefore(spaceNode, marker.nextSibling);
      } else {
        marker.parentNode.appendChild(spaceNode);
      }
      
      const selection = window.getSelection();
      const range = document.createRange();
      range.setStartAfter(spaceNode);
      range.setEndAfter(spaceNode);
      selection.removeAllRanges();
      selection.addRange(range);
    }
    
    // Limpiar y sincronizar
    setActiveMeeting({...activeMeeting, contenido: editorRef.current.innerHTML}); 
    setShowNoteModal(false); 
    setTempNoteText(''); 
  };

  const handleAISuggestion = async () => {
    if (!aiPrompt) return;
    setAiLoading(true);
    try {
      const context = editorRef.current.innerHTML;
      const suggestion = await aiService.generateScript(aiPrompt, context, activeMeeting.mood || 'Profesional');
      
      // Enfocar el editor antes de insertar
      editorRef.current.focus();
      
      // Convertir saltos de línea a HTML
      const htmlContent = suggestion.replace(/\n/g, '<br>');
      
      // Usar execCommand para una inserción limpia como texto normal
      document.execCommand('insertHTML', false, htmlContent + '<br>');
      
      // Sincronizar estado
      const finalHTML = editorRef.current.innerHTML;
      setActiveMeeting(prev => ({...prev, contenido: finalHTML}));
      setShowAIModal(false);
      setAiPrompt('');
    } catch (e) {
      alert(e.message);
    }
    setAiLoading(false);
  };
  // Editor Pro Functions
  const formatText = (command, value = null, e) => {
    e.preventDefault();
    document.execCommand(command, false, value);
    editorRef.current.focus();
  };

  const insertChecklist = (e) => {
    e.preventDefault();
    const id = Date.now();
    const html = `<div class="editor-checklist-item" style="display: flex; align-items: flex-start; gap: 8px; margin-bottom: 6px;"><input type="checkbox" contenteditable="false" style="margin-top: 4px; cursor: pointer;"><div contenteditable="true" style="outline: none; flex: 1; min-height: 1.2em; font-size: inherit;"></div></div>`;
    document.execCommand('insertHTML', false, html);
    editorRef.current.focus();
  };

  const insertTable = (e) => {
    e.preventDefault();
    const html = `
      <br/>
      <table style="width: 100%; border-collapse: collapse; margin: 10px 0; border: 1px solid #333;">
        <tbody>
          <tr>
            <td style="border: 1px solid #333; padding: 8px;" contenteditable="true">Celda 1</td>
            <td style="border: 1px solid #333; padding: 8px;" contenteditable="true">Celda 2</td>
          </tr>
          <tr>
            <td style="border: 1px solid #333; padding: 8px;" contenteditable="true">Celda 3</td>
            <td style="border: 1px solid #333; padding: 8px;" contenteditable="true">Celda 4</td>
          </tr>
        </tbody>
      </table><br/>
    `;
    document.execCommand('insertHTML', false, html);
    editorRef.current.focus();
  };

  const insertTag = (e, tagName, colorBg, colorText, colorBorder) => {
    e.preventDefault();
    const html = `<span contenteditable="false" style="background-color: ${colorBg}; color: ${colorText}; border: 1px solid ${colorBorder}; padding: 2px 8px; border-radius: 12px; font-size: 9px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.05em; display: inline-flex; align-items: center; justify-content: center; margin: 0 4px; vertical-align: middle; box-shadow: 0 2px 4px rgba(0,0,0,0.2); cursor: default; user-select: none;">${tagName}</span>&nbsp;`;
    document.execCommand('insertHTML', false, html);
    editorRef.current.focus();
  };

  const EDITOR_TAGS = [
    { name: 'Guion', bg: 'rgba(59, 130, 246, 0.1)', text: '#60a5fa', border: 'rgba(59, 130, 246, 0.3)' },
    { name: 'Video', bg: 'rgba(239, 68, 68, 0.1)', text: '#f87171', border: 'rgba(239, 68, 68, 0.3)' },
    { name: 'Efectos', bg: 'rgba(168, 85, 247, 0.1)', text: '#c084fc', border: 'rgba(168, 85, 247, 0.3)' },
    { name: 'Formato', bg: 'rgba(34, 197, 94, 0.1)', text: '#4ade80', border: 'rgba(34, 197, 94, 0.3)' },
    { name: 'Vertical', bg: 'rgba(236, 72, 153, 0.1)', text: '#f472b6', border: 'rgba(236, 72, 153, 0.3)' },
    { name: 'Horizontal', bg: 'rgba(59, 130, 246, 0.1)', text: '#60a5fa', border: 'rgba(59, 130, 246, 0.3)' },
    { name: 'Hook', bg: 'rgba(245, 158, 11, 0.1)', text: '#fbbf24', border: 'rgba(245, 158, 11, 0.3)' },
    { name: 'Voz IA', bg: 'rgba(16, 185, 129, 0.1)', text: '#34d399', border: 'rgba(16, 185, 129, 0.3)' },
    { name: 'Cliente', bg: 'rgba(99, 102, 241, 0.1)', text: '#818cf8', border: 'rgba(99, 102, 241, 0.3)' },
    { name: 'Pagado', bg: 'rgba(34, 197, 94, 0.2)', text: '#22c55e', border: '#22c55e' },
    { name: 'Pendiente', bg: 'rgba(239, 68, 68, 0.2)', text: '#ef4444', border: '#ef4444' },
    { name: 'Descuento', bg: 'rgba(234, 179, 8, 0.2)', text: '#eab308', border: '#eab308' },
    { name: 'Mejorar', bg: 'rgba(245, 158, 11, 0.1)', text: '#fbbf24', border: 'rgba(245, 158, 11, 0.3)' },
    { name: 'IA', bg: 'rgba(168, 85, 247, 0.1)', text: '#c084fc', border: 'rgba(168, 85, 247, 0.3)' },
    { name: 'Negocio', bg: 'rgba(20, 184, 166, 0.1)', text: '#2dd4bf', border: 'rgba(20, 184, 166, 0.3)' }
  ];

  const filteredClients = (clients || []).filter(c => (c.nombre || '').toLowerCase().includes(clientSearch.toLowerCase()));
  const filteredMeetings = (meetingsList || [])
    .filter(m => m.cliente_id === activeClient?.id)
    .filter(m => (m.fecha || '').includes(meetingSearch) || (m.categoria || '').toLowerCase().includes(meetingSearch.toLowerCase()));

  const togglePlatform = (p) => {
    const current = activeMeeting.platforms || [];
    const newP = current.includes(p) ? current.filter(x=>x!==p) : [...current, p];
    setActiveMeeting({...activeMeeting, platforms: newP});
  };

  return (
    <div className="flex flex-col h-screen max-w-full w-full animate-in fade-in duration-500 overflow-hidden bg-black font-sans">
      
      {/* VISTA: LISTA DE CLIENTES */}
      {viewState === 'client-list' && (
        <div className="p-6 space-y-6 overflow-y-auto mac-scrollbar">
          <header className="flex justify-between items-center pb-8 border-b border-white/5">
            <div>
              <h2 className="text-4xl font-black text-white tracking-tighter uppercase leading-none">Editor <span className="text-neutral-800">Pro</span></h2>
              <p className="text-[10px] text-neutral-600 font-black uppercase tracking-[0.3em] mt-2">Gestión de Talento & Producción</p>
            </div>
            <div className="flex gap-4">
              <button 
                onClick={async () => {
                  if(confirm("⚠ ATENCIÓN: Esto borrará TODOS los clientes permanentemente. ¿Proceder?")) {
                    const { error } = await supabase.from('clientes_editor').delete().neq('id', 0);
                    if(!error) { alert("¡Base de datos limpia!"); fetchClients(); }
                    else alert("Error: " + error.message);
                  }
                }}
                className="px-6 py-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all flex items-center gap-2"
              >
                <Trash2 size={16}/> Reset DB
              </button>
              <button 
                onClick={() => {
                  setNewClient({
                    nombre: '', nombre_completo: '', identidad: '', email: '', 
                    telefono: '', pais: '', empresa: '', metodo_pago_preferido: 'QR', 
                    link_brutos: '', foto_url: '', redes: { instagram: '', youtube: '', twitter: '', tiktok: '' }
                  });
                  setIsClientModalOpen(true);
                }} 
                className="px-8 py-4 bg-white text-black rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-neutral-200 transition-all shadow-2xl flex items-center gap-3 active:scale-95"
              >
                <Plus size={18}/> Nuevo Cliente
              </button>
            </div>
          </header>
          <div className="relative">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-neutral-700" size={18}/>
            <input 
              type="text" 
              value={clientSearch} 
              onChange={e=>setClientSearch(e.target.value)} 
              placeholder="Identificar talento, empresa o país..." 
              className="w-full bg-[#0a0a0a] border border-white/5 rounded-xl py-4 pl-14 pr-6 text-sm text-white outline-none focus:border-white/10"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {clients.filter(c => 
              c.nombre?.toLowerCase().includes(clientSearch.toLowerCase()) ||
              c.empresa?.toLowerCase().includes(clientSearch.toLowerCase()) ||
              c.pais?.toLowerCase().includes(clientSearch.toLowerCase())
            ).map(client => (
              <div 
                key={client.id} 
                onClick={() => openClientProfile(client)} 
                className="bg-[#0a0a0a] border border-white/5 rounded-[3rem] p-10 hover:bg-white/10 hover:border-white/20 cursor-pointer transition-all flex flex-col items-center text-center group active:scale-95 shadow-2xl relative overflow-hidden"
              >
                {/* ACCIONES FLOTANTES (EDITAR/BORRAR) */}
                <div className="absolute top-6 right-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                  <button 
                    onClick={(e) => startEditClient(client, e)}
                    className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-neutral-400 hover:text-white hover:bg-white/10 transition-all"
                  >
                    <BrandIcon size={14} />
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      const url = `${window.location.origin}/portal/${client.portal_id || client.id}`;
                      navigator.clipboard.writeText(url);
                      alert('¡Link del Portal copiado al portapapeles!');
                    }}
                    className="p-2.5 bg-amber-500/10 border border-amber-500/20 text-amber-500 hover:bg-amber-500 hover:text-white transition-all rounded-xl"
                    title="Copiar Link de Portal"
                  >
                    <Share2 size={14} />
                  </button>
                  <button 
                    onClick={(e) => moveToTrash(client, e)}
                    className="p-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-500 hover:bg-rose-500 hover:text-white transition-all rounded-xl"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                {/* ICONO CENTRAL (ESTILO IMAGEN USUARIO) */}
                <div className="w-28 h-28 mb-8 rounded-[2rem] bg-white/5 flex items-center justify-center overflow-hidden border border-white/5 shadow-inner">
                  {client.foto_url ? (
                    <img src={client.foto_url} className="w-full h-full object-cover" alt="" />
                  ) : (
                    <div className="p-6 bg-black/40 rounded-3xl">
                      <UserIcon size={40} className="text-neutral-800" />
                    </div>
                  )}
                </div>

                {/* INFORMACIÓN DEL CLIENTE */}
                <h4 className="text-xl font-black text-white uppercase tracking-tighter mb-1">{client.nombre}</h4>
                <p className="text-[10px] text-neutral-500 font-black uppercase tracking-[0.2em] mb-6">{client.pais || 'Bolivia'}</p>
                
                {/* DATOS EXTRA (SUBTILES) */}
                <div className="w-full pt-8 border-t border-white/5 space-y-3">
                   {client.empresa && (
                     <div className="flex items-center justify-center gap-2">
                        <Building2 size={12} className="text-amber-500/50" />
                        <p className="text-[9px] font-black uppercase tracking-widest text-neutral-400">{client.empresa}</p>
                     </div>
                   )}
                   <div className="flex items-center justify-center gap-2">
                      <Phone size={12} className="text-neutral-700" />
                      <p className="text-[9px] font-black uppercase tracking-widest text-neutral-600">{client.telefono || 'Sin Contacto'}</p>
                   </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VISTA: PERFIL DEL CLIENTE ÉLITE */}
      {viewState === 'client-profile' && activeClient && (
        <div className="h-full flex flex-col overflow-hidden bg-black">
          <header className="px-6 py-4 bg-[#0a0a0a] border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <button onClick={() => setViewState('client-list')} className="w-10 h-10 bg-white/5 rounded-2xl flex items-center justify-center text-neutral-600 hover:text-white transition-all"><ArrowLeft size={20}/></button>
              <div className="flex items-center gap-4">
                 <div className="w-14 h-14 rounded-2xl bg-white/5 overflow-hidden border border-white/10">
                   {activeClient.foto_url ? <img src={activeClient.foto_url} className="w-full h-full object-cover" alt="" /> : <UserIcon size={24} className="text-neutral-800 m-auto mt-4" />}
                 </div>
                 <div>
                   <h3 className="text-xl font-black text-white uppercase tracking-tighter leading-none mb-1">{activeClient.nombre_completo || activeClient.nombre}</h3>
                   <div className="flex items-center gap-2">
                     <span className="text-[9px] text-amber-500 font-black uppercase tracking-widest">{activeClient.empresa || 'Freelance / Personal'}</span>
                     <span className="w-1 h-1 bg-neutral-800 rounded-full"></span>
                     <span className="text-[9px] text-neutral-600 font-bold uppercase tracking-widest">{activeClient.pais}</span>
                   </div>
                 </div>
              </div>
            </div>
            <button onClick={createMeeting} className="px-8 py-3 bg-white text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-neutral-200 transition-all flex items-center gap-2 shadow-xl shadow-white/5"><Plus size={16}/> Nueva Sesión</button>
          </header>

          <div className="flex-1 flex overflow-hidden">
            {/* BARRA LATERAL DE INFORMACIÓN */}
            <div className="w-[320px] bg-[#050505] border-r border-white/5 p-6 space-y-8 overflow-y-auto mac-scrollbar">
              <section>
                <h4 className="text-[10px] font-black text-neutral-700 uppercase tracking-[0.3em] mb-6">Datos de Contacto</h4>
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                    <Phone size={16} className="text-neutral-600" />
                    <div>
                      <p className="text-[8px] text-neutral-700 font-black uppercase tracking-widest">Teléfono</p>
                      <p className="text-xs text-white font-bold">{activeClient.telefono || 'No registrado'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                    <Mail size={16} className="text-neutral-600" />
                    <div>
                      <p className="text-[8px] text-neutral-700 font-black uppercase tracking-widest">Email</p>
                      <p className="text-xs text-white font-bold truncate">{activeClient.email || 'No registrado'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                    <CreditCard size={16} className="text-neutral-600" />
                    <div>
                      <p className="text-[8px] text-neutral-700 font-black uppercase tracking-widest">Método de Pago</p>
                      <p className="text-xs text-amber-500 font-black uppercase">{activeClient.metodo_pago_preferido || 'No definido'}</p>
                    </div>
                  </div>
                </div>
              </section>

              <section>
                <h4 className="text-[10px] font-black text-neutral-700 uppercase tracking-[0.3em] mb-6">Recursos Cloud</h4>
                {activeClient.link_brutos ? (
                  <a href={activeClient.link_brutos} target="_blank" rel="noreferrer" className="flex items-center justify-between p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl group hover:bg-blue-500/20 transition-all">
                    <div className="flex items-center gap-4">
                      <FolderOpen size={20} className="text-blue-500" />
                      <div>
                        <p className="text-[8px] text-blue-500 font-black uppercase tracking-widest">Drive / Cloud</p>
                        <p className="text-[10px] text-white font-bold uppercase">Ver Brutos</p>
                      </div>
                    </div>
                    <ExternalLink size={14} className="text-blue-500 opacity-0 group-hover:opacity-100 transition-all" />
                  </a>
                ) : (
                  <div className="p-4 bg-white/5 border border-dashed border-white/10 rounded-2xl text-center">
                    <p className="text-[8px] text-neutral-700 font-bold uppercase tracking-widest">Sin link de brutos</p>
                  </div>
                )}
              </section>

              <section>
                <h4 className="text-[10px] font-black text-neutral-700 uppercase tracking-[0.3em] mb-6">Redes Sociales</h4>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(activeClient.redes_sociales || {}).map(([key, val]) => val && (
                    <div key={key} className="p-3 bg-white/5 rounded-xl flex items-center gap-2 border border-white/5">
                      {key === 'instagram' && <Instagram size={12} className="text-pink-500" />}
                      {key === 'youtube' && <Youtube size={12} className="text-red-500" />}
                      {key === 'tiktok' && <Smartphone size={12} className="text-cyan-500" />}
                      <span className="text-[8px] font-black uppercase text-white truncate">{key}</span>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* LISTA DE SESIONES */}
            <div className="flex-1 p-8 overflow-y-auto mac-scrollbar bg-black">
               <div className="max-w-4xl mx-auto space-y-6">
                  <div className="flex items-center justify-between px-2">
                     <h4 className="text-[11px] font-black text-white uppercase tracking-[0.4em] flex items-center gap-3">
                       <Activity size={16} className="text-neutral-700"/> Historial de Producción
                     </h4>
                     <p className="text-[9px] text-neutral-700 font-black uppercase tracking-widest">{filteredMeetings.length} Sesiones Activas</p>
                  </div>
                  
                  <div className="space-y-3">
                    {filteredMeetings.map(mov => (
                      <div key={mov.id} onClick={() => openMeeting(mov)} className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-6 hover:bg-white/10 cursor-pointer transition-all flex items-center justify-between group">
                         <div className="flex items-center gap-6">
                            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-neutral-800 group-hover:text-amber-500 transition-all border border-white/5">
                               <PlayCircle size={24}/>
                            </div>
                            <div>
                               <p className="text-base font-black text-white uppercase tracking-tighter">{mov.fecha}</p>
                               <div className="flex gap-1.5 mt-2">
                                  {(mov.pipeline || []).map(s => (
                                    <div key={s.id} className={`w-2 h-2 rounded-full ${s.done ? 'bg-emerald-500' : 'bg-white/10'}`}></div>
                                  ))}
                               </div>
                            </div>
                         </div>
                         <div className="flex items-center gap-10">
                            <div className="text-right">
                               <p className="text-xl font-black text-white font-mono leading-none mb-1">{parseFloat(mov.presupuesto || 0).toLocaleString()} $</p>
                               <span className={`text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full ${mov.priority === 'ASAP' ? 'bg-rose-500/20 text-rose-500' : 'bg-white/5 text-neutral-700'}`}>
                                 {mov.priority}
                               </span>
                            </div>
                            <button onClick={(e) => { e.stopPropagation(); handleDeleteMeeting(mov.id, e); }} className="p-4 text-neutral-900 hover:text-rose-500 hover:bg-rose-500/10 rounded-2xl transition-all opacity-0 group-hover:opacity-100"><Trash2 size={20}/></button>
                         </div>
                      </div>
                    ))}
                  </div>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* VISTA: WAR ROOM (MASTER EXECUTIVE EDITION) */}
      {viewState === 'session' && activeMeeting && (
        <div className="flex-1 flex flex-col overflow-hidden bg-black animate-in fade-in duration-500">
          <header className="px-5 py-2 border-b border-white/5 bg-[#0a0a0a] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-4">
              <button onClick={saveMeeting} className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center text-neutral-600 hover:text-white transition-all"><ArrowLeft size={16}/></button>
              <div>
                <h3 className="text-[11px] font-black text-white uppercase tracking-tighter leading-none">{activeClient?.nombre} <span className="text-neutral-800">/</span> {activeMeeting.fecha}</h3>
                <p className="text-[7px] text-neutral-600 font-bold uppercase tracking-widest mt-1">Sovereign OS Pro • Creative Session</p>
              </div>
              <div className={`px-2 py-0.5 rounded-md text-[7px] font-black uppercase ${activeMeeting.priority === 'ASAP' ? 'bg-rose-500 text-black' : 'bg-white/5 text-neutral-600'}`}>{activeMeeting.priority}</div>
            </div>
            <div className="flex items-center gap-3">
               <button onClick={copyBillingSummary} className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-lg text-[8px] font-black uppercase hover:bg-emerald-500/20 transition-all"><Copy size={12}/> Resumen</button>
               <div className="flex items-center gap-3 bg-black border border-white/5 rounded-xl px-3 py-1">
                  <p className="text-sm font-mono font-black text-white">{formatTime(time)}</p>
                  <button onClick={() => setIsTimerRunning(!isTimerRunning)} className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${isTimerRunning ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'bg-white/5 text-white'}`}>
                    {isTimerRunning ? <Pause size={12}/> : <Play size={12}/>}
                  </button>
               </div>
               <button onClick={saveMeeting} className="px-5 py-1.5 bg-white text-black text-[9px] font-black rounded-lg uppercase tracking-widest flex items-center gap-2 shadow-xl shadow-white/5">
                <Save size={14}/> Finalizar
              </button>
            </div>
          </header>

          <div className={`flex-1 flex ${settings.isMobileMode ? 'flex-col overflow-y-auto' : 'flex-row overflow-hidden'}`}>
            {/* IZQUIERDA: HERRAMIENTAS (Versión Compacta) */}
            <div className={`w-[230px] shrink-0 flex flex-col bg-[#050505] border-r border-white/5 overflow-y-auto mac-scrollbar p-2.5 space-y-2.5`}>
               
               {/* PRIORIDAD & VIBRA */}
               <div className="bg-[#0a0a0a] border border-white/5 rounded-xl p-2.5">
                  <p className="text-[7px] text-neutral-700 font-black uppercase mb-2 tracking-widest flex items-center gap-2"><Zap size={10}/> Prioridad & Vibras</p>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {['Baja', 'Media', 'Alta', 'ASAP'].map(p => (
                      <button key={p} onClick={()=>setActiveMeeting({...activeMeeting, priority: p})} className={`px-2 py-1.5 rounded-lg text-[8px] font-black uppercase transition-all ${activeMeeting.priority === p ? 'bg-white text-black' : 'bg-white/5 text-neutral-700'}`}>{p}</button>
                    ))}
                  </div>
                  <select value={activeMeeting.mood || ''} onChange={e=>setActiveMeeting({...activeMeeting, mood: e.target.value})} className="w-full bg-black border border-white/5 rounded-lg p-2.5 text-[10px] text-white font-black uppercase outline-none">
                    <option value="">Mood del Video...</option>
                    <option value="Cinematic">Cinematic</option>
                    <option value="Fast-Paced">Fast-Paced</option>
                    <option value="Corporate">Corporate</option>
                    <option value="Minimalist">Minimalist</option>
                  </select>
               </div>

               {/* CALCULADORA (Micro-HUD) */}
               <div className="bg-[#0a0a0a] border border-white/5 rounded-xl p-2.5">
                  <div className="bg-black border border-white/5 rounded-lg p-2 text-right text-sm font-mono font-black text-white mb-1.5 truncate shadow-inner">{calcDisplay}</div>
                  <div className="grid grid-cols-4 gap-1">
                    {['7','8','9','/','4','5','6','*','1','2','3','-','0','.','=','+'].map(btn => (
                      <button key={btn} onClick={() => handleCalc(btn)} className={`p-1.5 rounded-md text-[9px] font-black ${btn === '=' ? 'bg-amber-500 text-black' : 'bg-white/5 text-neutral-500 hover:bg-white/10 hover:text-white'}`}>{btn}</button>
                    ))}
                  </div>
                  <div className="grid grid-cols-3 gap-1 mt-2.5 border-t border-white/5 pt-2.5">
                     {Object.entries(rates).map(([curr, val]) => (
                        <div key={curr} className="text-center bg-black/40 rounded-lg p-1 border border-white/5">
                           <p className="text-[5px] text-neutral-600 font-bold uppercase">{curr}</p>
                           <p className="text-[8px] text-white font-black">{val}</p>
                        </div>
                     ))}
                  </div>
               </div>

               {/* BRAND KIT & ASSETS */}
               <div className="bg-[#0a0a0a] border border-white/5 rounded-xl p-2.5">
                  <p className="text-[7px] text-neutral-700 font-black uppercase mb-2 flex items-center gap-2"><BrandIcon size={10}/> Assets</p>
                  <div className="space-y-1.5">
                    <div className="grid grid-cols-3 gap-1">
                       {[1,2,3].map(i => <div key={i} className="h-4 bg-black border border-white/5 rounded text-[6px] text-neutral-800 flex items-center justify-center font-mono">#HEX</div>)}
                    </div>
                    <input type="text" value={activeMeeting.brand_kit?.logo || ''} onChange={e=>setActiveMeeting({...activeMeeting, brand_kit: {...activeMeeting.brand_kit, logo: e.target.value}})} placeholder="Logo URL..." className="w-full bg-black border border-white/5 rounded-lg p-1.5 text-[7px] text-neutral-600 outline-none" />
                  </div>
               </div>

               {/* DEADLINES (Micro) */}
               <div className="bg-[#0a0a0a] border border-white/5 rounded-xl p-2.5">
                  <div className="flex justify-between items-center mb-1.5">
                    <p className="text-[7px] text-neutral-700 font-black uppercase flex items-center gap-2"><Calendar size={10}/> Deadlines</p>
                    <button onClick={() => setActiveMeeting({...activeMeeting, deadlines_multiple: [...(activeMeeting.deadlines_multiple || []), { id: Date.now(), label: 'Entrega', date: '', done: false }]})} className="p-1 hover:text-white text-neutral-600"><Plus size={10}/></button>
                  </div>
                  <div className="space-y-1">
                    {(activeMeeting.deadlines_multiple || []).map(d => (
                      <div key={d.id} className="flex items-center gap-1.5 bg-black/50 p-1 rounded-lg border border-white/5">
                        <input type="text" value={d.label} onChange={e => setActiveMeeting({...activeMeeting, deadlines_multiple: activeMeeting.deadlines_multiple.map(item => item.id === d.id ? {...item, label: e.target.value} : item)})} className="bg-transparent text-[7px] font-bold text-white uppercase outline-none flex-1 truncate" />
                        <button onClick={() => setActiveMeeting({...activeMeeting, deadlines_multiple: activeMeeting.deadlines_multiple.map(item => item.id === d.id ? {...item, done: !item.done} : item)})} className={`w-3 h-3 rounded flex items-center justify-center shrink-0 ${d.done ? 'bg-emerald-500 text-black' : 'bg-white/5 text-neutral-900'}`}>
                          {d.done && <Check size={8} strokeWidth={4}/>}
                        </button>
                      </div>
                    ))}
                  </div>
               </div>
            </div>

            {/* CENTRO: EDITOR / DRIVE / CALENDAR (Espacio Proporcionado) */}
            <div className={`flex-1 flex flex-col bg-black min-h-0 border-x border-white/5 ${settings.interfaceDensity === 'compacto' ? 'p-1 space-y-1' : 'p-3 space-y-3'} ${settings.isMobileMode ? 'min-h-[600px] overflow-visible' : ''}`}>
               {/* TABS DE SESIÓN NEXUS */}
               <div className="flex bg-[#0a0a0a] border border-white/5 rounded-2xl p-1 shadow-xl">
                  {['editor', 'drive', 'calendar'].map(t => (
                    <button 
                      key={t} 
                      onClick={() => setSessionTab(t)}
                      className={`flex-1 py-2.5 rounded-xl text-[9px] font-black uppercase transition-all flex items-center justify-center gap-2 ${sessionTab === t ? 'bg-white text-black shadow-lg' : 'text-neutral-600 hover:text-white'}`}
                    >
                      {t === 'editor' && <FileText size={14}/>}
                      {t === 'drive' && <HardDrive size={14}/>}
                      {t === 'calendar' && <Calendar size={14}/>}
                             {t}
                    </button>
                  ))}
               </div>

               {sessionTab === 'editor' && (
                 <div className="flex-1 bg-[#0a0a0a] border border-white/5 rounded-[24px] flex flex-col overflow-hidden shadow-2xl relative animate-in fade-in zoom-in duration-500">
                    {/* BARRA ÚNICA DE HERRAMIENTAS (MICRO) */}
                    <div className="flex items-center gap-1.5 px-3 py-1.5 border-b border-white/5 bg-black/40 shrink-0 overflow-x-auto no-scrollbar">
                        <div className="flex items-center gap-0.5 pr-2 border-r border-white/10 shrink-0">
                           <button onMouseDown={(e) => formatText('bold', null, e)} className="p-1.5 text-neutral-500 hover:text-white rounded-md transition-colors"><Bold size={12}/></button>
                           <button onMouseDown={(e) => formatText('italic', null, e)} className="p-1.5 text-neutral-500 hover:text-white rounded-md transition-colors"><Italic size={12}/></button>
                           <button onMouseDown={insertChecklist} className="p-1.5 text-emerald-500 hover:text-emerald-400 rounded-md transition-colors"><CheckSquare size={12}/></button>
                        </div>
                        <div className="flex-1 flex items-center gap-1 px-2 overflow-x-auto no-scrollbar">
                           {EDITOR_TAGS.map(tag => (
                             <button key={tag.name} onMouseDown={(e) => insertTag(e, tag.name, tag.bg, tag.text, tag.border)} className="px-1.5 py-0.5 rounded text-[7px] font-black uppercase tracking-widest shrink-0 transition-transform hover:scale-105" style={{ backgroundColor: tag.bg, color: tag.text, border: `1px solid ${tag.border}` }}>{tag.name}</button>
                           ))}
                        </div>
                        <button onMouseDown={(e) => { e.preventDefault(); setShowAIModal(true); }} className="px-3 py-1.5 bg-purple-600 rounded-lg text-[8px] font-black uppercase text-white shadow-lg flex items-center gap-1.5 hover:bg-purple-500 transition-all shrink-0"><Sparkles size={10}/> IA MAGIC</button>
                    </div>
                    <div ref={editorRef} contentEditable="true" suppressContentEditableWarning={true} className="w-full flex-1 p-4 text-neutral-500 font-light text-[11px] leading-relaxed editor-container outline-none mac-scrollbar overflow-y-auto" dangerouslySetInnerHTML={{ __html: activeMeeting.contenido || '<p><br></p>' }} onBlur={() => setActiveMeeting({...activeMeeting, contenido: editorRef.current.innerHTML})}></div>
                 </div>
               )}

               {sessionTab === 'drive' && (
                 <div className="flex-1 bg-[#0a0a0a] border border-white/5 rounded-[32px] flex flex-col overflow-hidden shadow-2xl animate-in fade-in slide-in-from-right-4 duration-500">
                    <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center bg-black/40">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-3 text-blue-500 font-black text-[9px] uppercase tracking-widest"><HardDrive size={16}/> Almacenamiento Nexus</div>
                        <div className="flex items-center gap-2 mt-1">
                          {driveHistory.length > 0 && <button onClick={goBackSessionDrive} className="text-neutral-500 hover:text-white transition-colors"><ArrowLeft size={12}/></button>}
                          <span className="text-[8px] text-neutral-600 font-bold uppercase tracking-widest">{sessionFolder.name}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 rounded-xl text-[8px] font-black uppercase text-white hover:bg-blue-500 transition-all cursor-pointer">
                          <Upload size={12}/> Subir
                          <input type="file" multiple className="hidden" onChange={async (e) => {
                            const arr = Array.from(e.target.files);
                            try { for (const f of arr) await uploadFileToDrive(token, f, sessionFolder.id); fetchDriveFiles(); }
                            catch (err) { console.error(err); }
                          }}/>
                        </label>
                        <button onClick={() => fetchDriveFiles()} className="p-2 hover:bg-white/5 rounded-lg text-neutral-600 hover:text-white transition-all"><RefreshCw size={13} className={driveLoading ? 'animate-spin' : ''}/></button>
                      </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 mac-scrollbar">
                       {!token ? (
                         <div className="h-full flex flex-col items-center justify-center py-20 text-center">
                            <Cloud size={40} className="text-neutral-800 mb-4"/>
                            <p className="text-[10px] text-neutral-600 font-black uppercase tracking-widest">Vincula tu cuenta desde Configuración</p>
                         </div>
                       ) : driveLoading ? (
                         <div className="h-full flex items-center justify-center py-20">
                            <RefreshCw className="text-blue-500 animate-spin" size={28}/>
                         </div>
                       ) : driveFiles.length > 0 ? (
                         <div className="border border-white/5 rounded-2xl overflow-hidden">
                            <div className="grid grid-cols-12 px-4 py-2 bg-white/[0.02] border-b border-white/5 text-[8px] font-black text-neutral-600 uppercase tracking-widest">
                              <span className="col-span-7">Nombre</span><span className="col-span-2">Tamaño</span><span className="col-span-3 text-right">Acciones</span>
                            </div>
                            {driveFiles.map(file => (
                              <div key={file.id}
                                onDoubleClick={() => file.mimeType === 'application/vnd.google-apps.folder' ? navigateSessionDrive({id: file.id, name: file.name}) : null}
                                className="grid grid-cols-12 px-4 py-2.5 border-b border-white/[0.03] hover:bg-white/[0.03] transition-all group items-center cursor-pointer"
                              >
                                <div className="col-span-7 flex items-center gap-2">
                                  {file.mimeType?.includes('folder') ? <Folder size={14} className="text-amber-400 shrink-0"/> :
                                   file.mimeType?.includes('video') ? <FileVideo size={14} className="text-rose-400 shrink-0"/> :
                                   file.mimeType?.includes('image') ? <ImageIcon size={14} className="text-emerald-400 shrink-0"/> : <File size={14} className="text-neutral-500 shrink-0"/>}
                                  <span className="text-[10px] font-bold text-white truncate">{file.name}</span>
                                </div>
                                <span className="col-span-2 text-[9px] text-neutral-600">{file.size ? (file.size/1024/1024).toFixed(1)+'MB' : '--'}</span>
                                <div className="col-span-3 flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  {file.mimeType !== 'application/vnd.google-apps.folder' && (
                                    <button onClick={e=>{e.stopPropagation();downloadDriveFile(token,file);}} className="p-1 hover:bg-white/10 rounded-lg text-neutral-600 hover:text-white"><Download size={11}/></button>
                                  )}
                                  <button onClick={e=>{e.stopPropagation();window.open(file.webViewLink,'_blank');}} className="p-1 hover:bg-white/10 rounded-lg text-neutral-600 hover:text-white"><ExternalLink size={11}/></button>
                                  <button onClick={e=>{e.stopPropagation();if(confirm(`¿Eliminar "${file.name}"?`)){deleteDriveFile(token,file.id).then(()=>fetchDriveFiles());}}} className="p-1 hover:bg-red-500/10 rounded-lg text-neutral-600 hover:text-red-400"><Trash2 size={11}/></button>
                                </div>
                              </div>
                            ))}
                         </div>
                       ) : (
                         <div className="h-full flex flex-col items-center justify-center text-center py-20">
                            <FolderOpen size={32} className="text-neutral-800 mb-4"/>
                            <p className="text-[9px] text-neutral-600 font-black uppercase tracking-widest">Carpeta Vacía</p>
                         </div>
                       )}
                    </div>
                 </div>
               )}

               {sessionTab === 'calendar' && (
                 <div className="flex-1 bg-[#0a0a0a] border border-white/5 rounded-[32px] flex flex-col overflow-hidden shadow-2xl animate-in fade-in slide-in-from-right-4 duration-500">
                    <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center bg-black/40">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-3 text-emerald-500 font-black text-[9px] uppercase tracking-widest"><Calendar size={16}/> Agenda Nexus</div>
                        <span className="text-[8px] text-neutral-600 font-bold uppercase tracking-widest mt-1">
                          {currentCalDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => {
                            setCalTitle(`Sesión: ${activeClient?.nombre}`);
                            setIsCalModalOpen(true);
                          }}
                          className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 rounded-xl text-[8px] font-black uppercase text-white hover:bg-emerald-500 transition-all shadow-lg"
                        >
                          <Plus size={12}/> Nuevo Evento
                        </button>
                        <button onClick={() => setCurrentCalDate(new Date(currentCalDate.getFullYear(), currentCalDate.getMonth()-1, 1))} className="p-1.5 hover:bg-white/5 rounded-lg text-neutral-600"><ChevronLeft size={14}/></button>
                        <button onClick={() => setCurrentCalDate(new Date())} className="text-[8px] font-black uppercase tracking-widest text-neutral-400 hover:text-white px-2">Hoy</button>
                        <button onClick={() => setCurrentCalDate(new Date(currentCalDate.getFullYear(), currentCalDate.getMonth()+1, 1))} className="p-1.5 hover:bg-white/5 rounded-lg text-neutral-600"><ChevronRight size={14}/></button>
                        <button onClick={loadCalendarEvents} className="p-2 text-neutral-600 hover:text-white"><RefreshCw size={14} className={calendarLoading ? 'animate-spin' : ''}/></button>
                      </div>
                    </div>
                    <div className="flex-1 overflow-hidden bg-[#030303] flex flex-col">
                       <div className="grid grid-cols-7 border-b border-neutral-800 bg-[#080808]">
                         {['DOM','LUN','MAR','MIÉ','JUE','VIE','SÁB'].map(d => (
                           <div key={d} className="py-2 text-center text-[8px] font-black text-neutral-600 uppercase tracking-widest">{d}</div>
                         ))}
                       </div>
                       <div className="flex-1 grid grid-cols-7 overflow-y-auto mac-scrollbar border-l border-neutral-800">
                         {calendarLoading ? (
                           <div className="col-span-7 h-64 flex items-center justify-center">
                              <RefreshCw className="text-blue-500 animate-spin" size={24}/>
                           </div>
                         ) : (
                           (() => {
                             const days = [];
                             const year = currentCalDate.getFullYear();
                             const month = currentCalDate.getMonth();
                             const daysInMonth = new Date(year, month + 1, 0).getDate();
                             const firstDay = new Date(year, month, 1).getDay();
                             
                             for (let i = 0; i < firstDay; i++) {
                               days.push(<div key={`empty-${i}`} className="h-24 border-b border-r border-neutral-800 opacity-20 bg-neutral-900/20"></div>);
                             }
                             
                             for (let d = 1; d <= daysInMonth; d++) {
                               const dayDate = new Date(year, month, d);
                               const isToday = new Date().toDateString() === dayDate.toDateString();
                               const dayEvents = calendarEvents.filter(e => new Date(e.start.dateTime || e.start.date).toDateString() === dayDate.toDateString());
                               
                               days.push(
                                 <div key={d} className={`h-24 border-b border-r border-neutral-800 p-1 hover:bg-neutral-900 transition-all ${isToday ? 'bg-blue-600/5' : ''}`}>
                                   <div className="flex justify-center mb-1">
                                     <span className={`text-[9px] font-bold w-5 h-5 flex items-center justify-center rounded-full ${isToday ? 'bg-blue-600 text-white shadow-lg' : 'text-neutral-600'}`}>{d}</span>
                                   </div>
                                   <div className="space-y-0.5 overflow-y-auto max-h-[60px] no-scrollbar">
                                     {dayEvents.map((e, idx) => (
                                       <div key={idx} className="text-[7px] font-black uppercase truncate px-1 py-0.5 rounded bg-blue-600 text-white">{e.summary}</div>
                                     ))}
                                   </div>
                                 </div>
                               );
                             }
                             return days;
                           })()
                         )}
                       </div>
                    </div>
                 </div>
               )}

               {/* BARRA DE STORAGE Y REGLAS DE ORO */}
               <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-3 flex items-center gap-4">
                     <HardDrive size={16} className="text-neutral-800"/>
                     <input type="text" value={activeMeeting.storage_location || ''} onChange={e=>setActiveMeeting({...activeMeeting, storage_location: e.target.value})} placeholder="Ubicación de Archivos (Ej: Disco Rojo B)..." className="w-full bg-transparent text-[9px] font-black text-neutral-500 uppercase outline-none" />
                  </div>
                  <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-3 flex items-center gap-4">
                     <Info size={16} className="text-amber-500/50"/>
                     <input type="text" value={activeMeeting.rules_gold || ''} onChange={e=>setActiveMeeting({...activeMeeting, rules_gold: e.target.value})} placeholder="Reglas de Oro del Cliente (Lo que no le gusta)..." className="w-full bg-transparent text-[9px] font-black text-amber-500/50 uppercase outline-none" />
                  </div>
               </div>
            </div>

            {/* PANEL DERECHO: PRODUCTION HUB (BLINDADO) */}
            <div className={`${settings.isMobileMode ? 'w-full' : 'w-[260px] shrink-0 border-l'} bg-black border-white/5 flex flex-col p-2.5 space-y-2.5 overflow-y-auto mac-scrollbar`}>
               
               {/* PLATAFORMAS (Compacto) */}
               <div className="bg-[#0a0a0a] border border-white/5 rounded-xl p-2.5 shadow-xl shrink-0">
                  <p className="text-[7px] text-neutral-700 font-black uppercase mb-2 flex items-center gap-2"><Smartphone size={10}/> Platforms</p>
                  <div className="flex justify-around gap-1.5">
                    <button onClick={()=>togglePlatform('YT')} className={`p-1.5 rounded-lg transition-all ${activeMeeting.platforms?.includes('YT') ? 'bg-rose-500/20 text-rose-500' : 'bg-white/5 text-neutral-800'}`}><Youtube size={14}/></button>
                    <button onClick={()=>togglePlatform('IG')} className={`p-1.5 rounded-lg transition-all ${activeMeeting.platforms?.includes('IG') ? 'bg-gradient-to-tr from-yellow-500/20 to-purple-500/20 text-pink-500' : 'bg-white/5 text-neutral-800'}`}><Instagram size={14}/></button>
                    <button onClick={()=>togglePlatform('TT')} className={`p-1.5 rounded-lg transition-all ${activeMeeting.platforms?.includes('TT') ? 'bg-cyan-500/20 text-cyan-500' : 'bg-white/5 text-neutral-800'}`}><Smartphone size={14}/></button>
                    <button onClick={()=>togglePlatform('FB')} className={`p-1.5 rounded-lg transition-all ${activeMeeting.platforms?.includes('FB') ? 'bg-blue-600/20 text-blue-600' : 'bg-white/5 text-neutral-800'}`}><Facebook size={14}/></button>
                  </div>
               </div>

               {/* PANEL DERECHO CON PESTAÑAS (Compacto) */}
               <div className="bg-[#0a0a0a] border border-white/5 rounded-xl p-3 shadow-xl flex flex-col flex-1 min-h-0 overflow-hidden">
                  <div className="flex bg-black rounded-lg p-0.5 mb-2.5 border border-white/5 shrink-0">
                    <button onClick={() => setRightPanelTab('delivery')} className={`flex-1 py-1.5 rounded text-[7px] font-black uppercase transition-all ${rightPanelTab === 'delivery' ? 'bg-white text-black' : 'text-neutral-600'}`}>Delivery</button>
                    <button onClick={() => setRightPanelTab('tasks')} className={`flex-1 py-1.5 rounded text-[7px] font-black uppercase transition-all ${rightPanelTab === 'tasks' ? 'bg-white text-black' : 'text-neutral-600'}`}>Tasks</button>
                  </div>

                  <div className="flex-1 overflow-y-auto mac-scrollbar pr-1">
                    {rightPanelTab === 'delivery' ? (
                      <div className="space-y-3">
                        <div>
                          <p className="text-[7px] text-neutral-700 font-black uppercase mb-2">Export Checklist</p>
                          <div className="space-y-1">
                            {(activeMeeting.export_checklist || []).map(h => (
                              <button key={h.id} onClick={() => setActiveMeeting({...activeMeeting, export_checklist: activeMeeting.export_checklist.map(item => item.id === h.id ? {...item, done: !item.done} : item)})} className={`w-full flex justify-between items-center p-1.5 rounded-lg border transition-all ${h.done ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-white/5 border-white/5 text-neutral-800'}`}>
                                 <span className="text-[8px] font-black uppercase">{h.label}</span>
                                 {h.done && <Check size={10} strokeWidth={4}/>}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <GoogleTasks token={token} />
                    )}
                  </div>
               </div>

               {/* REVIEW LINK (Compacto) */}
               <div className="bg-[#0a0a0a] border border-white/5 rounded-xl p-3 shrink-0">
                  <p className="text-[7px] text-neutral-700 font-black uppercase mb-2 flex items-center gap-2"><ExternalLink size={10}/> Review</p>
                  <div className="flex gap-1.5">
                    <input type="text" value={activeMeeting.review_link || ''} onChange={e=>setActiveMeeting({...activeMeeting, review_link: e.target.value})} placeholder="Link..." className="flex-1 bg-black border border-white/5 rounded-lg p-1.5 text-[8px] text-white outline-none" />
                    {activeMeeting.review_link && <a href={activeMeeting.review_link} target="_blank" rel="noreferrer" className="p-1.5 bg-amber-500 text-black rounded-lg transition-all"><ExternalLink size={12}/></a>}
                  </div>
               </div>

               {/* COBROS (Compacto) */}
               <div className="bg-[#0a0a0a] border border-white/5 rounded-xl p-3 shadow-xl shrink-0">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-[7px] text-neutral-700 font-black uppercase flex items-center gap-2"><Target size={10}/> Cobros</p>
                    <button onClick={() => setActiveMeeting({...activeMeeting, hitos_pago: [...(activeMeeting.hitos_pago || []), { id: Date.now(), label: 'Hito', paid: false }]})} className="p-1 bg-white/5 rounded text-neutral-600 hover:text-white"><Plus size={10}/></button>
                  </div>
                  <div className="space-y-1.5">
                    {(activeMeeting.hitos_pago || []).map(h => (
                      <div key={h.id} className="flex gap-1.5 items-center">
                        <input type="text" value={h.label} onChange={(e) => setActiveMeeting({...activeMeeting, hitos_pago: activeMeeting.hitos_pago.map(item => item.id === h.id ? {...item, label: e.target.value} : item)})} className={`flex-1 bg-transparent border border-white/5 rounded px-1.5 py-0.5 text-[8px] font-bold uppercase outline-none ${h.paid ? 'text-emerald-500' : 'text-neutral-700'}`} />
                        <button onClick={() => setActiveMeeting({...activeMeeting, hitos_pago: activeMeeting.hitos_pago.map(item => item.id === h.id ? {...item, paid: !item.paid} : item)})} className={`w-5 h-5 rounded flex items-center justify-center transition-all border ${h.paid ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-white/5 border-white/5 text-neutral-900'}`}>
                           {h.paid ? <Check size={10} strokeWidth={4}/> : <div className="w-2 h-2 rounded-full border border-neutral-900"/>}
                        </button>
                      </div>
                    ))}
                  </div>
               </div>

               {/* PIPELINE (High-Density Grid) */}
               <div className="bg-[#0a0a0a] border border-white/5 rounded-xl p-2.5 shadow-xl shrink-0">
                  <p className="text-[7px] text-neutral-700 font-black uppercase mb-2 flex items-center gap-2"><Activity size={10}/> Pipeline Status</p>
                  <div className="grid grid-cols-2 gap-1">
                    {(activeMeeting.pipeline || []).map(step => (
                      <button key={step.id} onClick={() => setActiveMeeting({...activeMeeting, pipeline: activeMeeting.pipeline.map(s => s.id === step.id ? {...s, done: !s.done} : s)})} className={`flex items-center gap-1.5 p-1 rounded-lg border transition-all ${step.done ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-white/5 border-white/5 text-neutral-800 hover:text-white'}`}>
                        <div className={`w-3 h-3 rounded flex items-center justify-center shrink-0 ${step.done ? 'bg-emerald-500 text-black' : 'bg-white/5 border border-white/5'}`}>
                          {step.done ? <Check size={8} strokeWidth={4}/> : <div className="w-1 h-1 rounded-full bg-neutral-900"/>}
                        </div>
                        <span className="text-[6px] font-black uppercase truncate flex-1">{step.label}</span>
                      </button>
                    ))}
                  </div>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: NUEVO CLIENTE ÉLITE */}
      {isClientModalOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4 sm:p-8">
          <div className="bg-[#0a0a0a] border border-white/10 rounded-[40px] w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <header className="p-8 border-b border-white/5 flex justify-between items-center bg-black/40">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white text-black rounded-2xl"><Users size={24}/></div>
                <div>
                  <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Nuevo Perfil de Cliente</h3>
                  <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mt-1">Soberanía en gestión de datos</p>
                </div>
              </div>
              <button onClick={() => setIsClientModalOpen(false)} className="p-3 hover:bg-white/5 rounded-full text-neutral-600 hover:text-white transition-all"><X size={24}/></button>
            </header>

            <div className="flex-1 overflow-y-auto p-8 sm:p-12 mac-scrollbar grid grid-cols-1 md:grid-cols-2 gap-10">
              {/* BLOQUE: IDENTIDAD */}
              <div className="space-y-6">
                <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-[0.4em] mb-8">Identidad Corporativa</h4>
                <div>
                  <label className="text-[9px] font-black text-neutral-600 uppercase tracking-widest mb-2 block">Nombre Corto / Alias *</label>
                  <input type="text" value={newClient.nombre} onChange={e=>setNewClient({...newClient, nombre: e.target.value})} placeholder="Nombre del Cliente" className="w-full bg-black border border-white/5 rounded-2xl p-4 text-sm text-white font-bold outline-none focus:border-amber-500/50 transition-all" />
                </div>
                <div>
                  <label className="text-[9px] font-black text-neutral-600 uppercase tracking-widest mb-2 block">Nombre Completo</label>
                  <input type="text" value={newClient.nombre_completo} onChange={e=>setNewClient({...newClient, nombre_completo: e.target.value})} placeholder="Nombre y Apellidos" className="w-full bg-black border border-white/5 rounded-2xl p-4 text-sm text-white outline-none focus:border-white/20 transition-all" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] font-black text-neutral-600 uppercase tracking-widest mb-2 block">DNI / Identidad</label>
                    <input type="text" value={newClient.identidad} onChange={e=>setNewClient({...newClient, identidad: e.target.value})} placeholder="ID Fiscal" className="w-full bg-black border border-white/5 rounded-2xl p-4 text-sm text-white outline-none focus:border-white/20 transition-all" />
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-neutral-600 uppercase tracking-widest mb-2 block">País</label>
                    <input type="text" value={newClient.pais} onChange={e=>setNewClient({...newClient, pais: e.target.value})} placeholder="País" className="w-full bg-black border border-white/5 rounded-2xl p-4 text-sm text-white outline-none focus:border-white/20 transition-all" />
                  </div>
                </div>
                <div>
                  <label className="text-[9px] font-black text-neutral-600 uppercase tracking-widest mb-2 block">Empresa / Agencia</label>
                  <input type="text" value={newClient.empresa} onChange={e=>setNewClient({...newClient, empresa: e.target.value})} placeholder="Nombre de la empresa" className="w-full bg-black border border-white/5 rounded-2xl p-4 text-sm text-white outline-none focus:border-white/20 transition-all" />
                </div>
              </div>

              {/* BLOQUE: CONTACTO Y LOGÍSTICA */}
              <div className="space-y-6">
                <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.4em] mb-8">Canales & Logística</h4>
                <div className="grid grid-cols-2 gap-4">
                   <div>
                      <label className="text-[9px] font-black text-neutral-600 uppercase tracking-widest mb-2 block">Teléfono</label>
                      <input type="text" value={newClient.telefono} onChange={e=>setNewClient({...newClient, telefono: e.target.value})} placeholder="+591 ..." className="w-full bg-black border border-white/5 rounded-2xl p-4 text-sm text-white outline-none focus:border-white/20 transition-all" />
                   </div>
                   <div>
                      <label className="text-[9px] font-black text-neutral-600 uppercase tracking-widest mb-2 block">Email</label>
                      <input type="email" value={newClient.email} onChange={e=>setNewClient({...newClient, email: e.target.value})} placeholder="correo@ejemplo.com" className="w-full bg-black border border-white/5 rounded-2xl p-4 text-sm text-white outline-none focus:border-white/20 transition-all" />
                   </div>
                </div>
                <div>
                   <label className="text-[9px] font-black text-neutral-600 uppercase tracking-widest mb-2 block">Método de Pago Preferido</label>
                   <select value={newClient.metodo_pago_preferido} onChange={e=>setNewClient({...newClient, metodo_pago_preferido: e.target.value})} className="w-full bg-black border border-white/5 rounded-2xl p-4 text-sm text-white outline-none focus:border-white/20 transition-all uppercase font-bold">
                     <option value="QR">Transferencia / QR</option>
                     <option value="Tarjeta">Tarjeta de Crédito</option>
                     <option value="Efectivo">Efectivo</option>
                     <option value="PayPal">PayPal / Global</option>
                   </select>
                </div>
                <div>
                   <label className="text-[9px] font-black text-neutral-600 uppercase tracking-widest mb-2 block">Link a Brutos (Drive/Cloud)</label>
                   <input type="text" value={newClient.link_brutos} onChange={e=>setNewClient({...newClient, link_brutos: e.target.value})} placeholder="https://drive.google.com/..." className="w-full bg-black border border-white/5 rounded-2xl p-4 text-xs text-blue-400 outline-none focus:border-blue-500/30 transition-all" />
                </div>
                <div>
                   <label className="text-[9px] font-black text-neutral-600 uppercase tracking-widest mb-2 block">URL Foto de Perfil</label>
                   <input type="text" value={newClient.foto_url} onChange={e=>setNewClient({...newClient, foto_url: e.target.value})} placeholder="https://link-a-tu-foto.jpg" className="w-full bg-black border border-white/5 rounded-2xl p-4 text-[10px] text-neutral-500 outline-none focus:border-white/20 transition-all" />
                </div>
              </div>
            </div>

            <footer className="p-8 border-t border-white/5 bg-black/40 flex gap-6">
               <button onClick={() => setIsClientModalOpen(false)} className="flex-1 py-5 text-[10px] font-black text-neutral-600 uppercase tracking-[0.2em] hover:text-white transition-all">Descartar</button>
               <button onClick={handleCreateClient} disabled={loading} className="flex-[2] py-5 bg-white text-black rounded-3xl text-[11px] font-black uppercase tracking-[0.3em] hover:bg-neutral-200 transition-all shadow-xl shadow-white/5 disabled:opacity-50">
                 {loading ? 'Sincronizando...' : 'Consolidar Perfil Élite'}
               </button>
            </footer>
          </div>
        </div>
      )}

      {/* MODAL NOTAS */}
      {showNoteModal && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/80 backdrop-blur-md p-8">
          <div className="bg-[#111] border border-white/10 rounded-[64px] p-16 w-full max-w-xl shadow-2xl">
            <h4 className="text-2xl font-black text-white mb-8 flex items-center gap-4 uppercase tracking-tighter"><MessageSquare className="text-amber-500" size={32}/> Anotación Técnica</h4>
            <textarea autoFocus value={tempNoteText} onChange={e => setTempNoteText(e.target.value)} className="w-full bg-black border border-white/10 rounded-[40px] p-10 text-lg text-white outline-none h-40 resize-none mb-10" placeholder="¿Qué cambio se requiere?" />
            <div className="flex gap-8">
              <button onClick={cancelAddNote} className="flex-1 py-6 text-neutral-600 font-black uppercase text-xs tracking-widest hover:text-white transition-colors">Cancelar</button>
              <button onClick={confirmAddNote} className="flex-1 py-6 bg-amber-500 text-black font-black rounded-[28px] uppercase text-xs tracking-[0.2em] shadow-xl hover:bg-amber-400">Confirmar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL IA GEMINI */}
      {showAIModal && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/90 backdrop-blur-xl p-8">
          <div className="bg-[#0a0a0a] border border-white/10 rounded-[64px] p-16 w-full max-w-2xl shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-purple-600 via-blue-500 to-cyan-400"></div>
            <h4 className="text-3xl font-black text-white mb-8 flex items-center gap-4 uppercase tracking-tighter">
              <Sparkles className="text-purple-500 animate-pulse" size={36}/> Asistente Sovereign IA (v2)
            </h4>
            <p className="text-[10px] text-neutral-600 font-black uppercase tracking-[0.3em] mb-6">Instrucción para el Cerebro de Google</p>
            <textarea 
              autoFocus 
              value={aiPrompt} 
              onChange={e => setAiPrompt(e.target.value)} 
              className="w-full bg-black border border-white/10 rounded-[40px] p-10 text-xl text-white outline-none h-52 resize-none mb-10 placeholder:text-neutral-800" 
              placeholder="Ej: Mejora este guion para que sea más viral, o genera un gancho de 3 segundos..." 
            />
            <div className="flex gap-8">
              <button onClick={() => { setShowAIModal(false); setAiPrompt(''); }} className="flex-1 py-6 text-neutral-600 font-black uppercase text-xs tracking-widest hover:text-white transition-colors">Cerrar</button>
              <button 
                onClick={handleAISuggestion} 
                disabled={aiLoading || !aiPrompt}
                className="flex-[2] py-6 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-black rounded-[28px] uppercase text-xs tracking-[0.2em] shadow-xl hover:scale-105 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
              >
                {aiLoading ? <RefreshCw className="animate-spin" size={16}/> : <Sparkles size={16}/>}
                {aiLoading ? 'Procesando con Gemini...' : 'Ejecutar Magia IA'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* MODAL EVENTO CALENDARIO EN SESIÓN */}
      {isCalModalOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/90 backdrop-blur-xl p-6">
          <div className="bg-[#0a0a0a] border border-white/5 rounded-[40px] w-full max-w-xl overflow-hidden shadow-2xl animate-in zoom-in duration-300">
             <header className="px-10 py-8 border-b border-white/5 flex justify-between items-center bg-black/40">
                <div>
                   <h3 className="text-xl font-black text-white uppercase tracking-tighter">Agendar Sesión</h3>
                   <p className="text-[9px] text-neutral-600 font-bold uppercase tracking-widest mt-1">Sincronización Pro con Google Calendar</p>
                </div>
                <button onClick={() => setIsCalModalOpen(false)} className="p-2 hover:bg-white/5 rounded-full text-neutral-600 hover:text-white"><X size={20}/></button>
             </header>

             <form onSubmit={handleCreateSessionEvent} className="p-10 space-y-6">
                <div>
                   <label className="text-[9px] font-black text-neutral-700 uppercase tracking-widest mb-2 block">Título de la Reunión</label>
                   <input type="text" required value={calTitle} onChange={e=>setCalTitle(e.target.value)} className="w-full bg-black border border-white/5 rounded-2xl p-4 text-sm text-white font-bold outline-none focus:border-emerald-500/30 transition-all" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div>
                      <label className="text-[9px] font-black text-neutral-700 uppercase tracking-widest mb-2 block">Fecha</label>
                      <input type="date" required value={calDate} onChange={e=>setCalDate(e.target.value)} className="w-full bg-black border border-white/5 rounded-2xl p-4 text-xs text-white outline-none" />
                   </div>
                   <div>
                      <label className="text-[9px] font-black text-neutral-700 uppercase tracking-widest mb-2 block">Calendario Destino</label>
                      <select value={calTargetId} onChange={e=>setCalTargetId(e.target.value)} className="w-full bg-black border border-white/5 rounded-2xl p-4 text-[10px] text-white font-bold outline-none uppercase">
                        {sessionCalendarList.filter(c => c.accessRole === 'owner' || c.accessRole === 'writer').map(c => (
                          <option key={c.id} value={c.id}>{c.summary}</option>
                        ))}
                      </select>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div>
                      <label className="text-[9px] font-black text-neutral-700 uppercase tracking-widest mb-2 block">Hora Inicio</label>
                      <input type="time" required value={calStart} onChange={e=>setCalStart(e.target.value)} className="w-full bg-black border border-white/5 rounded-2xl p-4 text-xs text-white outline-none" />
                   </div>
                   <div>
                      <label className="text-[9px] font-black text-neutral-700 uppercase tracking-widest mb-2 block">Hora Fin</label>
                      <input type="time" required value={calEnd} onChange={e=>setCalEnd(e.target.value)} className="w-full bg-black border border-white/5 rounded-2xl p-4 text-xs text-white outline-none" />
                   </div>
                </div>

                <div>
                   <label className="text-[9px] font-black text-neutral-700 uppercase tracking-widest mb-2 block">Instrucciones / Descripción</label>
                   <textarea value={calDesc} onChange={e=>setCalDesc(e.target.value)} className="w-full bg-black border border-white/5 rounded-2xl p-4 text-xs text-neutral-400 outline-none h-24 resize-none" placeholder="Opcional..."></textarea>
                </div>

                <footer className="pt-6 flex gap-4">
                   <button type="button" onClick={() => setIsCalModalOpen(false)} className="flex-1 py-4 text-[10px] font-black text-neutral-700 uppercase tracking-widest hover:text-white">Cancelar</button>
                   <button type="submit" disabled={calendarLoading} className="flex-[2] py-4 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 shadow-xl shadow-emerald-900/20 disabled:opacity-50">
                     {calendarLoading ? 'Sincronizando...' : 'Confirmar Reunión'}
                   </button>
                </footer>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MeetingStudio;
