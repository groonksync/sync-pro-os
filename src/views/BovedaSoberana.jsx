import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Lock, Unlock, Key, Plus, Trash2, Copy, Eye, EyeOff, 
  Search, Filter, Star, Globe, Smartphone, CreditCard, Laptop, 
  RefreshCw, ShieldAlert, Zap, Calendar, ExternalLink, MoreVertical,
  Download, Upload, CheckCircle2, AlertTriangle, Fingerprint,
  Grid, List, ArrowLeft, PlusCircle, Bookmark, Share2, 
  Clock, Tag, Shield, Activity, Settings, Cpu, DollarSign,
  Music, Tv, Mail, Cloud, Database, Github, MessageSquare, MonitorPlay,
  Play, Scissors, Film
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import CryptoJS from 'crypto-js';

const BovedaSoberana = () => {
  const [items, setItems] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [llaveMaestra, setLlaveMaestra] = useState('');
  const [desbloqueada, setDesbloqueada] = useState(false);
  const [mostrarModalLlave, setMostrarModalLlave] = useState(true);
  const [terminoBusqueda, setTerminoBusqueda] = useState('');
  const [categoriaActual, setCategoriaActual] = useState('todos');
  const [itemEditando, setItemEditando] = useState(null);

  const CATALOGO_PLANES = {
    "Adobe": ["Photography (20GB)", "Creative Cloud All Apps", "Premiere Pro Single", "After Effects Single"],
    "Google IA": ["Gemini Advanced", "Google One 2TB", "Google One 100GB"],
    "Netflix": ["Estándar con anuncios", "Estándar", "Premium (4K + HDR)"],
    "HBO Max": ["Plan Mensual", "Plan Anual"],
    "Disney+": ["Estándar", "Premium"],
    "Amazon Prime": ["Mensual", "Anual"],
    "Spotify": ["Individual", "Duo", "Familiar", "Student"],
    "Internet": ["Fibra 300Mb", "Fibra 600Mb", "Fibra 1Gb", "Plan Gamer"]
  };

  useEffect(() => { cargarCredenciales(); }, []);

  const cargarCredenciales = async () => {
    setCargando(true);
    try {
      const { data, error } = await supabase
        .from('notas')
        .select('*')
        .eq('icono', 'lock')
        .order('updated_at', { ascending: false });
      if (error) throw error;
      setItems(data || []);
    } catch (e) { console.error(e); } finally { setCargando(false); }
  };

  const cifrar = (texto) => llaveMaestra ? CryptoJS.AES.encrypt(texto, llaveMaestra).toString() : texto;
  const descifrar = (textoCifrado) => {
    if (!llaveMaestra) return "[BLOQUEADO]";
    try {
      const bytes = CryptoJS.AES.decrypt(textoCifrado, llaveMaestra);
      const dec = bytes.toString(CryptoJS.enc.Utf8);
      return dec || "[ERROR: LLAVE]";
    } catch (e) { return "[ERROR]"; }
  };

  const guardarNuevaCredencial = async (nueva) => {
    const item = {
      id: crypto.randomUUID(),
      titulo: nueva.sitio,
      icono: 'lock',
      is_folder: false,
      contenido: [{
        ...nueva,
        value: cifrar(nueva.password),
        password: null
      }],
      color: '#10b981',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    try {
      const { error } = await supabase.from('notas').insert([item]);
      if (error) throw error;
      await cargarCredenciales();
      setItemEditando(null);
    } catch (e) { alert("Error al guardar: " + e.message); }
  };

  const eliminarItem = async (id) => {
    if (!confirm("¿Eliminar definitivamente?")) return;
    try {
      await supabase.from('notas').delete().eq('id', id);
      setItems(prev => prev.filter(i => i.id !== id));
    } catch (e) { console.error(e); }
  };

  const itemsFiltrados = items.filter(i => {
    const matchBusqueda = i.titulo.toLowerCase().includes(terminoBusqueda.toLowerCase());
    const itemData = (i.contenido && Array.isArray(i.contenido)) ? i.contenido[0] : {};
    const matchCategoria = categoriaActual === 'todos' || itemData.categoria === categoriaActual;
    return matchBusqueda && matchCategoria;
  });

  return (
    <div className="flex h-full w-full flex-col bg-[#141414] font-sans text-white overflow-hidden animate-in fade-in duration-700">
      <header className="px-8 py-6 border-b border-white/5 bg-[#141414]/50 backdrop-blur-md flex items-center justify-between shrink-0">
         <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.1)]"><ShieldCheck size={28}/></div>
            <div><h1 className="text-xl font-black uppercase tracking-tight">Bóveda Soberana</h1><p className="text-[9px] font-black text-neutral-500 uppercase tracking-widest">Seguridad Grado Militar AES-256</p></div>
         </div>
         <div className="flex items-center gap-4">
            <div className="relative">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-600" size={14}/>
               <input value={terminoBusqueda} onChange={e=>setTerminoBusqueda(e.target.value)} className="bg-[#141414] border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-[11px] font-medium text-white outline-none focus:border-emerald-500/20 w-[200px]" placeholder="Buscar..."/>
            </div>
            <button onClick={() => setItemEditando({ type: 'new' })} className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 text-black font-black text-[10px] rounded-xl uppercase tracking-widest"><Plus size={16}/> Nueva Entrada</button>
            <button onClick={() => {setDesbloqueada(false); setMostrarModalLlave(true);}} className="p-3 bg-white/5 border border-white/5 rounded-xl text-neutral-500 hover:text-white"><Lock size={18}/></button>
         </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
         <aside className="w-64 border-r border-white/5 bg-[#141414]/30 p-6 space-y-8 shrink-0">
            <section className="space-y-2">
               <p className="text-[9px] font-black text-neutral-600 uppercase tracking-widest px-2 mb-4">Filtros</p>
               <NavBtn active={categoriaActual === 'todos'} onClick={()=>setCategoriaActual('todos')} icon={Grid} label="Todos los Items"/>
            </section>
            <section className="space-y-2">
               <p className="text-[9px] font-black text-neutral-600 uppercase tracking-widest px-2 mb-4">Categorías</p>
               <NavBtn active={categoriaActual === 'pass'} onClick={()=>setCategoriaActual('pass')} icon={Key} label="Contraseñas"/>
               <NavBtn active={categoriaActual === 'license'} onClick={()=>setCategoriaActual('license')} icon={MonitorPlay} label="Licencias App"/>
               <NavBtn active={categoriaActual === 'subscription'} onClick={()=>setCategoriaActual('subscription')} icon={CreditCard} label="Suscripciones"/>
               <NavBtn active={categoriaActual === 'internet'} onClick={()=>setCategoriaActual('internet')} icon={Globe} label="Planes Internet"/>
            </section>
         </aside>

         <main className="flex-1 overflow-y-auto mac-scrollbar p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in slide-in-from-bottom-10 duration-500">
               {itemsFiltrados.map(item => <VaultCard key={item.id} item={item} onDelete={()=>eliminarItem(item.id)} alDescifrar={descifrar} />)}
            </div>
         </main>
      </div>

      {itemEditando && <ModalNueva onClose={() => setItemEditando(null)} onSave={guardarNuevaCredencial} catalogo={CATALOGO_PLANES} />}

      {mostrarModalLlave && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-[#141414]/95 backdrop-blur-xl">
           <div className="max-w-md w-full p-12 text-center space-y-8">
              <div className="w-24 h-24 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 mx-auto animate-pulse"><Fingerprint size={48}/></div>
              <div><h2 className="text-2xl font-black text-white uppercase">Acceso Blindado</h2><p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mt-2">Introduce tu Llave Maestra</p></div>
              <input type="password" value={llaveMaestra} onChange={e=>setLlaveMaestra(e.target.value)} placeholder="Llave..." autoFocus onKeyDown={e => e.key === 'Enter' && (setDesbloqueada(true), setMostrarModalLlave(false))} className="w-full bg-[#141414] border border-white/10 rounded-xl p-5 text-center text-white text-lg font-black outline-none focus:border-emerald-500/50"/>
              <button onClick={() => { setDesbloqueada(true); setMostrarModalLlave(false); }} className="w-full py-5 bg-emerald-500 text-black font-black uppercase tracking-widest rounded-xl">Desbloquear</button>
           </div>
        </div>
      )}
    </div>
  );
};

const NavBtn = ({ icon: Icon, label, active, onClick }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${active ? 'bg-emerald-500/10 text-emerald-500' : 'text-neutral-500 hover:text-white hover:bg-white/5'}`}>
     <Icon size={16}/><span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
  </button>
);

const VaultCard = ({ item, onDelete, alDescifrar }) => {
  const [mask, setMask] = useState(true);
  const data = (item.contenido && Array.isArray(item.contenido)) ? item.contenido[0] : {};
  const getIcon = (sitio) => {
    const s = (sitio || '').toLowerCase();
    if (s.includes('adobe')) return <MonitorPlay size={24}/>;
    if (s.includes('google')) return <Cloud size={24}/>;
    if (s.includes('netflix') || s.includes('hbo')) return <Tv size={24}/>;
    if (s.includes('spotify')) return <Music size={24}/>;
    return <Globe size={24}/>;
  };
  return (
    <div className="group bg-[#141414] border border-white/5 rounded-xl p-6 hover:border-emerald-500/30 transition-all flex flex-col justify-between relative overflow-hidden h-[240px]">
       <button onClick={onDelete} className="absolute top-4 right-4 p-2 bg-rose-500/10 text-rose-500 rounded-xl opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={12}/></button>
       <div className="space-y-4">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center text-emerald-500 border border-white/5">{getIcon(item.titulo)}</div>
             <div className="truncate flex-1"><h4 className="text-sm font-black text-white uppercase truncate">{item.titulo}</h4><p className="text-[8px] font-black text-neutral-600 uppercase">{data.categoria}</p></div>
          </div>
          <div className="space-y-3 pt-4 border-t border-white/5">
             <div><p className="text-[8px] font-black text-neutral-600 uppercase mb-1">Usuario</p><p className="text-[11px] font-bold text-neutral-300 truncate">{data.usuario}</p></div>
             <div><p className="text-[8px] font-black text-neutral-600 uppercase mb-1">Pass</p><div className="flex items-center justify-between gap-2 bg-white/2 rounded-xl p-2 border border-white/5"><p className="text-[11px] font-mono text-emerald-500 truncate">{mask ? '••••••••' : alDescifrar(data.value)}</p><button onClick={() => setMask(!mask)} className="text-neutral-500">{mask ? <Eye size={12}/> : <EyeOff size={12}/>}</button></div></div>
          </div>
       </div>
    </div>
  );
};

const ModalNueva = ({ onClose, onSave, catalogo }) => {
  const [nueva, setNueva] = useState({ sitio: '', usuario: '', password: '', categoria: 'pass', plan: '' });
  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-[#141414]/80 backdrop-blur-md p-8">
       <div className="bg-[#141414] border border-white/10 rounded-xl w-full max-w-lg overflow-hidden">
          <div className="p-8 border-b border-white/5 flex items-center justify-between bg-[#141414]/50"><h3 className="text-lg font-black uppercase">Nueva Entrada</h3><button onClick={onClose} className="text-neutral-500 hover:text-white"><Shield size={20}/></button></div>
          <div className="p-8 space-y-6">
             <select value={nueva.categoria} onChange={e=>setNueva({...nueva, categoria: e.target.value})} className="w-full bg-[#141414] border border-white/10 rounded-xl p-4 text-[11px] text-white">
                <option value="pass">Contraseña Web</option><option value="license">Licencia Software</option><option value="subscription">Suscripción Ocio</option><option value="internet">Plan de Internet</option>
             </select>
             <input value={nueva.sitio} onChange={e=>setNueva({...nueva, sitio: e.target.value})} className="w-full bg-[#141414] border border-white/10 rounded-xl p-4 text-[11px] text-white" placeholder="Servicio..."/>
             <select value={nueva.plan} onChange={e=>setNueva({...nueva, plan: e.target.value})} className="w-full bg-[#141414] border border-white/10 rounded-xl p-4 text-[11px] text-white">
                <option value="">Selecciona un plan (Opcional)</option>
                {Object.entries(catalogo).map(([key, plans]) => <optgroup key={key} label={key}>{plans.map(p => <option key={p} value={`${key} - ${p}`}>{p}</option>)}</optgroup>)}
             </select>
             <div className="grid grid-cols-2 gap-4">
                <input value={nueva.usuario} onChange={e=>setNueva({...nueva, usuario: e.target.value})} className="bg-[#141414] border border-white/10 rounded-xl p-4 text-[11px] text-white" placeholder="Usuario..."/>
                <input type="password" value={nueva.password} onChange={e=>setNueva({...nueva, password: e.target.value})} className="bg-[#141414] border border-white/10 rounded-xl p-4 text-[11px] text-white" placeholder="Pass..."/>
             </div>
             <button onClick={() => onSave(nueva)} className="w-full py-5 bg-emerald-500 text-black font-black uppercase rounded-xl">Blindar Entrada</button>
          </div>
       </div>
    </div>
  );
};

export default BovedaSoberana;
