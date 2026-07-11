import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, Mic, Sparkles, X, Bot, User, Loader2, Brain, 
  Zap, Paperclip, CheckCircle2, Package, Briefcase, AlertCircle, Square
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { supabase } from '../lib/supabaseClient';
import { aiService } from '../services/aiService';
import { Google, DeepSeek } from '@lobehub/icons';

const GoogleLogo = ({ size = 24 }) => <Google.Color size={size} />;
const DeepSeekLogo = ({ size = 24 }) => <DeepSeek.Color size={size} />;

const ActionCard = ({ action, data, isDark, onConfirm, onCancel }) => {
  if (!action || !data) return null;

  const configs = {
    'CREATE_REMINDER': { icon: <Brain size={18}/>, label: 'Nuevo Recordatorio', button: 'Crear Recordatorio', color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)', fields: [ { k: 'Título', v: data.titulo }, { k: 'Monto', v: (data.monto || 0) + ' BS' }, { k: 'Contacto', v: data.nombre_contacto || 'N/A' }, { k: 'Ciclo', v: data.recurrencia || 'Único' } ] },
    'CREATE_PRODUCT': { icon: <Package size={18}/>, label: 'Nuevo Producto', button: 'Crear Producto', color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)', fields: [ { k: 'Nombre', v: data.nombre }, { k: 'Venta', v: (data.precio_venta || 0) + ' BS' }, { k: 'Stock', v: data.stock_actual || 0 } ] },
    'CREATE_LOAN': { icon: <Briefcase size={18}/>, label: 'Nuevo Préstamo', button: 'Registrar Préstamo', color: '#969696', bg: 'rgba(255, 255, 255, 0.08)', fields: [ { k: 'Cliente', v: data.nombre }, { k: 'Capital', v: data.capital + ' BS' }, { k: 'Interés', v: data.interes + '%' } ] },
    'CREATE_EXPENSE': { icon: <AlertCircle size={18}/>, label: 'Nuevo Egreso', button: 'Registrar Egreso', color: '#f43f5e', bg: 'rgba(244, 63, 94, 0.1)', fields: [ { k: 'Concepto', v: data.nombre }, { k: 'Monto', v: data.monto + ' BS' }, { k: 'Fecha', v: data.fecha_pago } ] },
  };

  const config = configs[action];
  if (!config) return null;

  return (
    <div className="mt-4 p-5 rounded-[2rem] border animate-in zoom-in duration-300 shadow-2xl" style={{ backgroundColor: config.bg, borderColor: `${config.color}33` }}>
      <div className="flex items-center gap-3 mb-4" style={{ color: config.color }}>
         {config.icon}
         <span className="text-[10px] font-black uppercase tracking-widest">{config.label}</span>
      </div>
      <div className="space-y-2 mb-6">
         {config.fields.map((f, i) => (
           <p key={i} className="text-[10px] uppercase font-black tracking-wider text-neutral-400">{f.k}: <span className="text-white">{f.v}</span></p>
         ))}
      </div>
      <div className="flex gap-3">
         <button onClick={onConfirm} className="flex-1 py-3 text-black text-[9px] font-black uppercase tracking-widest rounded-xl hover:opacity-80 transition-all active:scale-95 shadow-lg" style={{ backgroundColor: config.color }}>
           {config.button}
         </button>
         <button onClick={onCancel} className="px-4 py-3 bg-white/5 text-neutral-500 rounded-xl hover:text-rose-500 transition-all"><X size={14}/></button>
      </div>
    </div>
  );
};

const SovereignAgent = ({ settings, setSettings, isDark, onRefresh, currentView }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'agent', content: "¡Hola! Soy tu Agente. ¿En qué te puedo ayudar hoy?" }
  ]);
  const [isListening, setIsListening] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const scrollRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    // Inicializar Web Speech API
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.lang = 'es-ES';
      recognition.continuous = true;
      recognition.interimResults = true;
      
      recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) finalTranscript += transcript + ' ';
          else interimTranscript += transcript;
        }
        setInput(prev => prev.replace(/ \.\.\.$/, '') + finalTranscript + (interimTranscript ? ' ...' : ''));
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        setIsRecording(false);
      };
      
      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const handleSend = async () => {
    let textToSend = input.replace(/ \.\.\.$/, '').trim();
    if (!textToSend && uploadedFiles.length === 0) return;
    
    // Si estaba grabando, detiene pero ya tenemos el input lleno
    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }

    const userMsg = { role: 'user', content: textToSend, files: uploadedFiles };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setUploadedFiles([]);
    setIsThinking(true);

    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      const responseText = await aiService.askAgent(textToSend, history, { settings, activeView: currentView });
      
      // Parsear Acciones
      let cleanText = responseText;
      let actions = [];
      const actionRegex = /\[\[\[ACTION(.*?)\]\]\]/g;
      let match;
      while ((match = actionRegex.exec(responseText)) !== null) {
        try {
          actions.push(JSON.parse(match[1]));
          cleanText = cleanText.replace(match[0], '');
        } catch (e) { console.error("Error parseando acción:", e); }
      }

      setMessages(prev => [...prev, { role: 'agent', content: cleanText.trim(), actions }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'agent', content: "❌ Error de conexión neural: " + e.message }]);
    } finally {
      setIsThinking(false);
    }
  };

  const handleConfirmAction = async (confirmAction, msgIndex, actionIndex) => {
    setIsThinking(true);
    try {
      const actionRaw = confirmAction?.action;
      let payload = confirmAction?.data || confirmAction || {};
      let action = actionRaw;
      
      // Si el payload es el objeto confirmAction, eliminar la propiedad action para no duplicar
      if (!confirmAction?.data && payload.action) {
        const { action: _, ...rest } = payload;
        payload = rest;
      }

      let finalPayload = { ...payload };
      let targetTable = '';

      // --- INTELIGENCIA DE CONTEXTO SOBERANO ---
      const activeViewLower = currentView?.toLowerCase();
      if (activeViewLower === 'recordatorios' && (action === 'CREATE_REMINDER' || action === 'CREATE_EXPENSE')) {
        action = 'CREATE_REMINDER';
      }

      if (action === 'CREATE_REMINDER') {
        targetTable = 'recordatorios';
        finalPayload = {
          titulo: payload.titulo || payload.nombre || payload.concept || 'Nuevo Registro Maestro',
          descripcion: payload.descripcion || payload.notas || payload.notes || '',
          fecha: payload.fecha || payload.fecha_pago || new Date().toISOString(),
          fecha_fin: payload.fecha_fin || null,
          prioridad: payload.prioridad || 'Media',
          categoria: payload.categoria || (payload.nombre?.toLowerCase().includes('compra') ? 'Compra' : 'Tarea'),
          monto: parseFloat(payload.monto || 0),
          nombre_contacto: payload.nombre_contacto || payload.contacto || '',
          recurrencia: payload.recurrencia || 'Ninguna',
          subtareas: Array.isArray(payload.subtareas) ? payload.subtareas.map(s => typeof s === 'string' ? { id: Math.random(), texto: s, completado: false } : s) : [],
          estado: 'Pendiente'
        };
      } else if (action === 'CREATE_PRODUCT') {
        targetTable = 'productos';
        finalPayload = {
          nombre: payload.nombre,
          precio_venta: parseFloat(payload.precio_venta || 0),
          stock_actual: parseInt(payload.stock_actual || 0),
          categoria: payload.categoria || 'General'
        };
      } else if (action === 'CREATE_LOAN') {
        targetTable = 'prestamos';
        finalPayload = {
          nombre: payload.nombre,
          capital: parseFloat(payload.capital),
          interes: parseFloat(payload.interes),
          inicio: payload.inicio,
          fin: payload.fin
        };
      } else if (action === 'CREATE_EXPENSE') {
        targetTable = 'servicios';
        finalPayload = {
          nombre: payload.nombre,
          monto: parseFloat(payload.monto),
          fecha_pago: payload.fecha_pago,
          metodo: payload.metodo || 'Efectivo',
          contacto: payload.contacto,
          notas: payload.notas
        };
      } else if (action === 'CREATE_NOTE') {
        targetTable = 'notas';
        finalPayload = {
          titulo: payload.titulo || 'Nueva Nota IA',
          icono: payload.icono || '🤖',
          contenido: Array.isArray(payload.contenido) ? payload.contenido : [{ id: Date.now(), type: 'text', value: payload.contenido_texto || payload.contenido || '' }],
          folder: payload.folder || 'General'
        };
      }
      
      if (targetTable) {
        const { error } = await supabase.from(targetTable).insert([{ 
          ...finalPayload, 
          id: crypto.randomUUID(), 
          created_at: new Date().toISOString() 
        }]);
        if (error) throw error;
      }

      if (onRefresh) onRefresh();
      
      setMessages(prev => {
        const newM = [...prev];
        newM[msgIndex].actions = newM[msgIndex].actions.filter((_, idx) => idx !== actionIndex);
        if (newM[msgIndex].actions.length === 0) newM[msgIndex].content += "\n\n✅ Acción completada exitosamente.";
        return newM;
      });
    } catch (e) {
      setMessages(prev => [...prev, { role: 'agent', content: "❌ Error: " + e.message }]);
    } finally { setIsThinking(false); }
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setUploadedFiles(prev => [...prev, { name: file.name, type: file.type, base64: ev.target.result }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const toggleListening = () => setIsListening(!isListening);
  
  const toggleRecording = () => {
    if (!recognitionRef.current) return alert("Tu navegador no soporta grabación de voz nativa.");
    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
      setTimeout(() => handleSend(), 300); // Dar tiempo a que el texto final se asiente y enviar
    } else {
      setInput('');
      recognitionRef.current.start();
      setIsRecording(true);
    }
  };

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isThinking, isOpen]);

  const NeuralIcon = ({ className }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M12 7L13.1 10.9L17 12L13.1 13.1L12 17L10.9 13.1L7 12L10.9 10.9L12 7Z" fill="currentColor"/>
      <circle cx="12" cy="3" r="1.5" fill="currentColor"/>
      <circle cx="12" cy="21" r="1.5" fill="currentColor"/>
      <circle cx="19.7942" cy="7.5" r="1.5" fill="currentColor"/>
      <circle cx="4.20577" cy="16.5" r="1.5" fill="currentColor"/>
      <circle cx="19.7942" cy="16.5" r="1.5" fill="currentColor"/>
      <circle cx="4.20577" cy="7.5" r="1.5" fill="currentColor"/>
    </svg>
  );

  const ActiveLogo = settings?.aiProvider === 'deepseek' ? DeepSeekLogo : GoogleLogo;

  return (
    <>
      {/* ===== BOTÓN FLOTANTE — DISEÑO PREMIUM MINIMAL ===== */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed z-[1000] bottom-24 right-4 md:bottom-8 md:right-8 flex items-center gap-3 transition-all duration-300 active:scale-95 group ${
          isOpen
            ? 'px-4 py-4 md:px-5 md:py-4 rounded-xl bg-white/10 backdrop-blur-xl border border-white/20'
            : 'px-4 py-3.5 md:px-5 md:py-3.5 rounded-xl bg-white/[0.07] backdrop-blur-xl border border-white/[0.12] hover:bg-white/[0.12] hover:border-white/25'
        }`}
      >
        {isOpen ? (
          <X size={20} className="text-white/80 relative z-10"/>
        ) : (
          <>
            <div className="relative z-10 group-hover:scale-105 transition-transform duration-200">
               <ActiveLogo />
            </div>
            <span className="hidden md:inline text-[10px] font-semibold text-white/70 uppercase tracking-[0.08em] relative z-10 group-hover:text-white/90 transition-colors">Agente</span>
          </>
        )}
      </button>

      {/* ===== VENTANA DE CHAT REDISEÑADA ===== */}
      {isOpen && (
        <div className="fixed top-12 bottom-auto left-4 right-4 w-auto h-[75vh] md:top-auto md:bottom-32 md:right-8 md:left-auto md:w-[440px] md:h-[640px] bg-[#1a1a1e]/95 backdrop-blur-2xl border border-white/[0.08] rounded-2xl z-[1000] flex flex-col shadow-2xl animate-in fade-in zoom-in duration-200 overflow-hidden">
          
          {/* HEADER COMPACTO */}
          <header className="px-6 py-5 border-b border-white/[0.06] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/[0.06] flex items-center justify-center border border-white/[0.08] shadow-inner">
                <ActiveLogo />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-white/90 uppercase tracking-[0.08em]">Agente</h4>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1 h-1 rounded-full bg-white/30"></span>
                  <span className="text-[7px] font-medium text-white/40 uppercase tracking-[0.08em]">Online</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* SELECTOR DE PROVEEDOR */}
              <div className="flex rounded-lg p-0.5 bg-white/[0.04] border border-white/[0.06]">
                <button
                  onClick={() => setSettings(prev => ({ ...prev, aiProvider: 'gemini' }))}
                  className={`text-[7px] font-black uppercase tracking-tighter px-2 py-1 rounded-md transition-all ${
                    settings?.aiProvider === 'gemini'
                      ? 'bg-white text-black shadow-sm'
                      : 'text-neutral-600 hover:text-white'
                  }`}
                >
                  Google
                </button>
                <button
                  onClick={() => setSettings(prev => ({ ...prev, aiProvider: 'deepseek' }))}
                  className={`text-[7px] font-black uppercase tracking-tighter px-2 py-1 rounded-md transition-all ${
                    settings?.aiProvider === 'deepseek'
                      ? 'bg-blue-500 text-white shadow-sm'
                      : 'text-neutral-600 hover:text-white'
                  }`}
                >
                  DeepSeek
                </button>
              </div>
              <button onClick={() => setIsOpen(false)} className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-600 hover:text-white hover:bg-white/5 transition-all">
                <X size={15}/>
              </button>
            </div>
          </header>

          {/* ZONA DE MENSAJES */}
          <div className="flex-1 overflow-y-auto px-5 py-6 space-y-5 mac-scrollbar" ref={scrollRef}>
            {messages.map((m, i) => (
              <div key={i} className={`flex w-full ${m.role === 'agent' ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-[88%] flex gap-3 ${m.role === 'agent' ? 'flex-row' : 'flex-row-reverse'}`}>
                  {/* Avatar */}
                  <div className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center border shadow-sm ${
                    m.role === 'agent'
                      ? 'bg-white/[0.06] border-white/[0.08]'
                      : 'bg-white/[0.08] border-white/[0.10]'
                  }`}>
                    {m.role === 'agent'
                      ? <div className="scale-[0.6]"><ActiveLogo /></div>
                      : <User size={13} className="text-white/60"/>
                    }
                  </div>
                  {/* Contenido */}
                  <div className="space-y-2">
                    <div className={`px-4 py-3 text-[12px] leading-relaxed ${
                      m.role === 'agent'
                        ? 'bg-white/[0.04] border border-white/[0.06] text-neutral-200 rounded-2xl rounded-tl-sm'
                        : 'bg-white/[0.10] border border-white/[0.12] text-white font-medium rounded-2xl rounded-tr-sm'
                    }`}>
                      {m.role === 'agent'
                        ? <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                        : m.content
                      }
                    </div>
                    {m.files && (
                      <div className="flex gap-2 flex-wrap">
                        {m.files.map((f, fi) => (
                          <div key={fi} className="px-3 py-1.5 bg-white/[0.04] border border-white/[0.06] rounded-xl flex items-center gap-2">
                            {f.type?.startsWith('image/')
                              ? <img src={f.base64} className="w-8 h-8 object-cover rounded-lg" />
                              : <Paperclip size={12} className="text-neutral-500"/>
                            }
                            <span className="text-[7px] text-neutral-500 font-bold uppercase truncate max-w-[70px]">{f.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {m.actions?.map((act, actIdx) => (
                      <ActionCard
                        key={actIdx}
                        action={act.action}
                        data={act.data}
                        isDark={isDark}
                        onConfirm={() => handleConfirmAction(act, i, actIdx)}
                        onCancel={() => setMessages(prev => {
                          const newM = [...prev];
                          newM[i].actions = newM[i].actions.filter((_, idx) => idx !== actIdx);
                          return newM;
                        })}
                      />
                    ))}
                  </div>
                </div>
              </div>
            ))}
            {isThinking && (
              <div className="flex items-center gap-3 px-2 py-3">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-white/30 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-white/30 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-white/30 animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
                <span className="text-[8px] font-medium text-white/40 uppercase tracking-[0.08em]">Procesando...</span>
              </div>
            )}
          </div>

          {/* INPUT REDISEÑADO */}
          <footer className="px-5 py-4 border-t border-white/[0.06] shrink-0">
            <div className="relative bg-white/[0.04] border border-white/[0.08] rounded-xl p-1.5 flex items-center gap-1 transition-all focus-within:border-white/20">
              <label className="w-9 h-9 rounded-lg flex items-center justify-center text-neutral-600 hover:text-white/70 hover:bg-white/5 cursor-pointer transition-all">
                <input type="file" multiple className="hidden" onChange={handleFileUpload}/>
                <Paperclip size={16}/>
              </label>
              <button
                onClick={toggleListening}
                className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                  isListening
                    ? 'bg-blue-500/20 text-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.2)]'
                    : 'text-neutral-600 hover:text-blue-400 hover:bg-white/5'
                }`}
              >
                <Sparkles size={16} />
              </button>
              <button
                onClick={toggleRecording}
                className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                  isRecording
                    ? 'bg-rose-500/20 text-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.2)] animate-pulse'
                    : 'text-neutral-600 hover:text-rose-400 hover:bg-white/5'
                }`}
              >
                <Mic size={16} />
              </button>
              <input
                type="text"
                value={input}
                onChange={e=>setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                placeholder={isListening ? "Escuchando..." : isRecording ? "Grabando..." : "Comando maestro..."}
                className={`flex-1 bg-transparent py-3 text-xs font-semibold outline-none px-2 placeholder-neutral-600 ${
                  isRecording ? 'text-rose-400 animate-pulse' : 'text-white'
                }`}
              />
              
              {isRecording ? (
                <button onClick={toggleRecording} className="w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br from-rose-500 to-rose-600 text-white shadow-[0_0_15px_rgba(244,63,94,0.4)] animate-pulse">
                  <Square size={14} fill="currentColor"/>
                </button>
              ) : (
                <button
                  onClick={handleSend}
                  className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200 ${
                    input.trim() || uploadedFiles.length > 0
                      ? 'bg-white text-black font-bold hover:bg-white/90 active:scale-95'
                      : 'bg-white/5 text-neutral-700'
                  }`}
                >
                  <Send size={15}/>
                </button>
              )}
            </div>
          </footer>
        </div>
      )}
    </>
  );
};

export default SovereignAgent;
