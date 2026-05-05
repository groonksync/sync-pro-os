
import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { 
  Play, Download, CheckCircle2, Clock, Calendar, 
  ExternalLink, Smartphone, Instagram, Youtube, Facebook, 
  Zap, ShieldCheck, Activity, Video
} from 'lucide-react';

const ClientPortal = ({ portalId }) => {
  const [client, setClient] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPortalData = async () => {
      try {
        // Buscar cliente por portal_id
        const { data: clientData, error: clientError } = await supabase
          .from('clientes_editor')
          .select('*')
          .eq('portal_id', portalId)
          .single();

        if (clientError) throw clientError;
        setClient(clientData);

        // Buscar sesiones de este cliente
        const { data: sessionsData, error: sessionsError } = await supabase
          .from('reuniones_editor')
          .select('*')
          .eq('cliente_id', clientData.id)
          .order('fecha', { ascending: false });

        if (sessionsError) throw sessionsError;
        setSessions(sessionsData);
      } catch (e) {
        console.error("Error cargando el portal:", e);
      } finally {
        setLoading(false);
      }
    };

    if (portalId) fetchPortalData();
  }, [portalId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center">
        <div className="w-16 h-1 bg-white/10 overflow-hidden rounded-full mb-4">
          <div className="w-full h-full bg-amber-500 animate-[loading_1.5s_infinite]"></div>
        </div>
        <p className="text-[10px] text-neutral-600 font-black uppercase tracking-[0.5em]">Accediendo al Nexus...</p>
        <style>{`
          @keyframes loading {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
        `}</style>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-10 text-center">
        <Zap size={48} className="text-rose-500 mb-6 opacity-20"/>
        <h1 className="text-2xl font-black text-white uppercase tracking-tighter mb-4">Acceso Denegado</h1>
        <p className="text-neutral-600 text-sm max-w-xs uppercase font-bold tracking-widest leading-relaxed">
          Este portal no existe o el enlace ha caducado. Contacta con tu editor.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-amber-500 selection:text-black pb-20">
      {/* HUD HEADER */}
      <header className="fixed top-0 inset-x-0 z-50 bg-black/60 backdrop-blur-2xl border-b border-white/5 px-10 py-6 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 shadow-inner">
            <ShieldCheck size={20} className="text-emerald-500"/>
          </div>
          <div>
            <h2 className="text-lg font-black tracking-tighter uppercase leading-none">Sovereign <span className="text-neutral-700">Client Hub</span></h2>
            <p className="text-[8px] text-neutral-600 font-black uppercase tracking-[0.3em] mt-1">Conexión Segura v2.0</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/5">
             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
             <span className="text-[8px] font-black uppercase tracking-widest text-neutral-400">Sistema Online</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500 to-orange-600 p-[1px]">
             <div className="w-full h-full rounded-full bg-black flex items-center justify-center overflow-hidden">
                {client.foto_url ? <img src={client.foto_url} className="w-full h-full object-cover" /> : <Zap size={14}/>}
             </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto pt-32 px-10 space-y-20">
        
        {/* HERO SECTION */}
        <section className="animate-in fade-in slide-in-from-bottom-10 duration-1000">
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter uppercase leading-none mb-6">
            Bienvenido, <span className="text-neutral-800">{client.nombre}</span>
          </h1>
          <div className="flex flex-wrap gap-4">
            <div className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-3">
              <Activity size={16} className="text-emerald-500"/>
              <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">{sessions.length} Proyectos Activos</span>
            </div>
            <div className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-3">
              <Zap size={16} className="text-amber-500"/>
              <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Entrega Express</span>
            </div>
          </div>
        </section>

        {/* PROYECTOS GRID */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {sessions.map((session, idx) => (
            <div key={session.id} className="bg-[#0a0a0a] border border-white/5 rounded-[3rem] overflow-hidden flex flex-col group hover:border-white/20 transition-all duration-500 shadow-2xl">
              {/* VIDEO PREVIEW (PLACEHOLDER OR REAL) */}
              <div className="aspect-video bg-neutral-900 relative overflow-hidden flex items-center justify-center group-hover:bg-black transition-all">
                <Video size={48} className="text-neutral-800 group-hover:scale-110 transition-all duration-700"/>
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60"></div>
                <div className="absolute bottom-8 left-8 right-8 flex justify-between items-end">
                   <div>
                     <p className="text-[9px] text-neutral-500 font-black uppercase tracking-widest mb-1">{session.categoria || 'Producción'}</p>
                     <h3 className="text-2xl font-black uppercase tracking-tighter">{session.fecha}</h3>
                   </div>
                   <button className="w-14 h-14 bg-white text-black rounded-2xl flex items-center justify-center hover:scale-110 transition-all active:scale-95 shadow-xl">
                      <Play size={24} fill="currentColor"/>
                   </button>
                </div>
              </div>

              {/* INFO & PIPELINE */}
              <div className="p-10 space-y-8">
                <div className="flex justify-between items-center">
                   <div className="flex gap-2">
                     {session.platforms?.map(p => (
                       <div key={p} className="p-2 bg-white/5 rounded-lg border border-white/5 text-neutral-600">
                          {p === 'YT' && <Youtube size={14}/>}
                          {p === 'IG' && <Instagram size={14}/>}
                          {p === 'FB' && <Facebook size={14}/>}
                          {p === 'TT' && <Smartphone size={14}/>}
                       </div>
                     ))}
                   </div>
                   <span className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-[0.2em] ${session.priority === 'ASAP' ? 'bg-rose-500 text-white' : 'bg-white/5 text-neutral-600'}`}>
                      {session.priority}
                   </span>
                </div>

                {/* MINI PIPELINE */}
                <div className="space-y-4">
                  <p className="text-[9px] text-neutral-700 font-black uppercase tracking-[0.3em]">Estado de la Producción</p>
                  <div className="grid grid-cols-4 gap-2">
                    {(session.pipeline || []).map((step, sIdx) => (
                      <div key={sIdx} className="space-y-2">
                        <div className={`h-1.5 rounded-full transition-all duration-1000 ${step.done ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-white/5'}`}></div>
                        <p className={`text-[7px] font-black uppercase tracking-widest truncate ${step.done ? 'text-emerald-500' : 'text-neutral-800'}`}>{step.label}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ACCIONES */}
                <div className="pt-6 border-t border-white/5 flex gap-4">
                   <a 
                     href={session.review_link} 
                     target="_blank" 
                     rel="noreferrer" 
                     className="flex-1 py-4 bg-white text-black rounded-2xl text-[10px] font-black uppercase tracking-widest text-center hover:bg-neutral-200 transition-all flex items-center justify-center gap-2"
                   >
                     <ExternalLink size={14}/> Revisar Versión
                   </a>
                   <button className="px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white hover:bg-white/10 transition-all">
                     <Download size={16}/>
                   </button>
                </div>
              </div>
            </div>
          ))}
        </section>

      </main>

      {/* FOOTER */}
      <footer className="mt-40 border-t border-white/5 py-20 text-center px-10">
         <div className="max-w-md mx-auto space-y-6">
            <h4 className="text-xl font-black uppercase tracking-tighter text-white">Sovereign OS</h4>
            <p className="text-[10px] text-neutral-700 font-black uppercase tracking-[0.4em] leading-relaxed">
              Sistema de Gestión de Talento & Producción de Video de Alta Gama. Desarrollado para Creadores de Élite.
            </p>
            <div className="pt-10 flex justify-center gap-8 opacity-20">
               <Zap size={20}/>
               <ShieldCheck size={20}/>
               <Activity size={20}/>
            </div>
         </div>
      </footer>
    </div>
  );
};

export default ClientPortal;
