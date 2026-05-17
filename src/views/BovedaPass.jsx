import React, { useState, useEffect } from 'react';
import { 
  Key, 
  Lock, 
  Unlock, 
  Search, 
  Plus, 
  Eye, 
  EyeOff, 
  Copy, 
  Check, 
  Trash2, 
  ShieldAlert, 
  Globe, 
  ShieldCheck, 
  Database,
  ExternalLink,
  ChevronRight,
  RefreshCw,
  Sliders,
  AlertCircle
} from 'lucide-react';
import CryptoJS from 'crypto-js';
import { supabase } from '../lib/supabaseClient';

const BovedaPass = ({ settings, isDark }) => {
  // --- Estados de Desbloqueo Bóveda ---
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [masterPassword, setMasterPassword] = useState('');
  const [isMasterPasswordCreated, setIsMasterPasswordCreated] = useState(() => {
    return !!localStorage.getItem('sovereign_boveda_master_hash');
  });
  
  // --- Estados de Datos ---
  const [credentials, setCredentials] = useState([]);
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [dbError, setDbError] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  
  // --- Estados para Revelado temporal ---
  const [visiblePasswords, setVisiblePasswords] = useState({}); // { [id]: boolean }
  
  // --- Modales y Generación de Passwords ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [newCred, setNewCred] = useState({
    sitio_web: '',
    url: '',
    usuario: '',
    contrasena: '',
    categoria: 'General',
    notas: ''
  });
  
  // Parámetros del Generador
  const [genLength, setGenLength] = useState(16);
  const [genUpper, setGenUpper] = useState(true);
  const [genNumbers, setGenNumbers] = useState(true);
  const [genSymbols, setGenSymbols] = useState(true);

  const categories = ['Todos', 'General', 'Sitios Web', 'Redes Sociales', 'Finanzas', 'Servidores', 'Otros'];

  const sqlSchemaCode = `-- SOVEREIGN STUDIO - BÓVEDA PASS MIGRACIÓN
CREATE TABLE IF NOT EXISTS boveda_pass (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sitio_web TEXT NOT NULL,
    url TEXT,
    usuario TEXT NOT NULL,
    contrasena TEXT NOT NULL, -- Guardada encriptada con AES-256 (CryptoJS) en cliente
    categoria TEXT DEFAULT 'General',
    notas TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
ALTER TABLE boveda_pass DISABLE ROW LEVEL SECURITY;`;

  // --- Carga Inicial de Datos (Sólo tras desbloquear) ---
  useEffect(() => {
    if (isUnlocked && masterPassword) {
      fetchCredentials();
    }
  }, [isUnlocked]);

  const fetchCredentials = async () => {
    setLoading(true);
    setDbError(false);
    try {
      const { data, error } = await supabase
        .from('boveda_pass')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        // Desencriptar contraseñas en memoria
        const decryptedData = data.map(item => {
          try {
            const bytes = CryptoJS.AES.decrypt(item.contrasena, masterPassword);
            const decryptedPass = bytes.toString(CryptoJS.enc.Utf8);
            return {
              ...item,
              contrasena_plana: decryptedPass || 'Error de Desencriptación'
            };
          } catch (e) {
            return {
              ...item,
              contrasena_plana: 'Error: Master Password incorrecta'
            };
          }
        });
        setCredentials(decryptedData);
      }
    } catch (e) {
      console.warn("Bóveda Pass: tabla Supabase no detectada, utilizando fallback de localStorage.");
      setDbError(true);
      
      const localCreds = localStorage.getItem('sovereign_creds');
      if (localCreds) {
        const parsed = JSON.parse(localCreds);
        const decryptedData = parsed.map(item => {
          try {
            const bytes = CryptoJS.AES.decrypt(item.contrasena, masterPassword);
            const decryptedPass = bytes.toString(CryptoJS.enc.Utf8);
            return {
              ...item,
              contrasena_plana: decryptedPass || 'Error de Desencriptación'
            };
          } catch (err) {
            return {
              ...item,
              contrasena_plana: 'Error: Master Password incorrecta'
            };
          }
        });
        setCredentials(decryptedData);
      }
    }
    setLoading(false);
  };

  // --- Gestión de Master Password ---
  const handleCreateMasterPassword = () => {
    if (!masterPassword.trim()) return;
    
    // Guardar hash para validación futura
    const hash = CryptoJS.SHA256(masterPassword).toString();
    localStorage.setItem('sovereign_boveda_master_hash', hash);
    setIsMasterPasswordCreated(true);
    setIsUnlocked(true);
  };

  const handleUnlockBoveda = () => {
    const savedHash = localStorage.getItem('sovereign_boveda_master_hash');
    const inputHash = CryptoJS.SHA256(masterPassword).toString();
    
    if (savedHash === inputHash) {
      setIsUnlocked(true);
    } else {
      alert("Llave Maestra INCORRECTA. Por favor verifica de nuevo.");
    }
  };

  // --- Operaciones de Credenciales ---
  const handleSaveCredential = async () => {
    if (!newCred.sitio_web || !newCred.usuario || !newCred.contrasena) {
      alert("Por favor completa los campos de Sitio Web, Usuario y Contraseña.");
      return;
    }

    setLoading(true);
    try {
      // 1. Cifrar la contraseña
      const encryptedPassword = CryptoJS.AES.encrypt(newCred.contrasena, masterPassword).toString();
      
      const payload = {
        sitio_web: newCred.sitio_web,
        url: newCred.url,
        usuario: newCred.usuario,
        contrasena: encryptedPassword,
        categoria: newCred.categoria,
        notas: newCred.notas
      };

      let returnedId = 'local-' + Date.now();

      // 2. Guardar en Supabase o en local
      if (!dbError) {
        const { data, error } = await supabase
          .from('boveda_pass')
          .insert(payload)
          .select();
        
        if (error) throw error;
        if (data && data[0]) returnedId = data[0].id;
      }

      // 3. Actualizar estado local
      const newLocalItem = {
        ...payload,
        id: returnedId,
        contrasena_plana: newCred.contrasena
      };

      const updatedList = [newLocalItem, ...credentials];
      setCredentials(updatedList);

      // Si es offline/local, persistir el batch cifrado completo en localStorage
      if (dbError) {
        localStorage.setItem('sovereign_creds', JSON.stringify(updatedList));
      }

      // Resetear formulario
      setNewCred({
        sitio_web: '',
        url: '',
        usuario: '',
        contrasena: '',
        categoria: 'General',
        notas: ''
      });
      setIsModalOpen(false);
    } catch (e) {
      alert("Error al guardar credencial: " + e.message);
    }
    setLoading(false);
  };

  const handleDeleteCredential = async (id) => {
    if (!confirm("¿Eliminar esta credencial de forma permanente de tu bóveda?")) return;
    
    setLoading(true);
    try {
      if (!dbError) {
        // Enviar a papelera antes de borrar
        const target = credentials.find(c => c.id === id);
        if (target) {
          await supabase.from('papelera').insert({
            nombre_item: `${target.sitio_web} (${target.usuario})`,
            tipo_dato: 'credencial',
            datos_originales: target,
            expira_el: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          });
          
          await supabase.from('boveda_pass').delete().eq('id', id);
        }
      } else {
        // Papelera local
        const target = credentials.find(c => c.id === id);
        if (target) {
          const localTrash = JSON.parse(localStorage.getItem('sovereign_local_trash') || '[]');
          localTrash.push({
            id: 'trash-' + Date.now(),
            nombre_item: `${target.sitio_web} (${target.usuario})`,
            tipo_dato: 'credencial',
            datos_originales: target,
            expira_el: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            borrado_el: new Date().toISOString()
          });
          localStorage.setItem('sovereign_local_trash', JSON.stringify(localTrash));
        }
      }

      const updated = credentials.filter(c => c.id !== id);
      setCredentials(updated);
      
      if (dbError) {
        localStorage.setItem('sovereign_creds', JSON.stringify(updated));
      }
    } catch (e) {
      alert("Error al eliminar: " + e.message);
    }
    setLoading(false);
  };

  // --- Generador de Contraseñas Seguras ---
  const generatePassword = () => {
    let charset = "abcdefghijklmnopqrstuvwxyz";
    if (genUpper) charset += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    if (genNumbers) charset += "0123456789";
    if (genSymbols) charset += "!@#$%^&*()_+~`|}{[]:;?><,./-=";

    let pass = "";
    for (let i = 0; i < genLength; i++) {
      pass += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    
    setNewCred(prev => ({ ...prev, contrasena: pass }));
  };

  // --- Utilidades ---
  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const copySqlToClipboard = () => {
    navigator.clipboard.writeText(sqlSchemaCode);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  const togglePasswordVisibility = (id) => {
    setVisiblePasswords(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // --- Filtrado ---
  const filteredCreds = credentials.filter(c => {
    const matchCategory = activeCategory === 'Todos' || c.categoria === activeCategory;
    const matchSearch = c.sitio_web.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        c.usuario.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (c.notas && c.notas.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchCategory && matchSearch;
  });

  // --- PANTALLA 1: LOCK / SETUP MASTER PASSWORD ---
  if (!isUnlocked) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)] w-full max-w-lg mx-auto p-6 animate-in fade-in zoom-in-95 duration-500">
        
        {/* LOGO HUD BÓVEDA */}
        <div className="mb-10 text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-rose-500/10 rounded-[2rem] flex items-center justify-center text-rose-500 border border-rose-500/20 shadow-2xl shadow-rose-500/10 mb-6">
            <Lock size={32} className="animate-pulse" />
          </div>
          <h2 className="text-3xl font-black text-white tracking-tighter uppercase leading-none">Bóveda <span className="text-neutral-800">Pass</span></h2>
          <p className="text-[9px] text-neutral-600 font-black uppercase tracking-[0.25em] mt-3">Encriptación simétrica AES-256 en cliente</p>
        </div>

        {/* TARJETA DE ACCESO GLASSMORPHIC */}
        <div className="w-full bg-[#080808]/80 border border-white/5 rounded-[2.5rem] p-8 backdrop-blur-3xl shadow-2xl flex flex-col gap-6 relative overflow-hidden">
          
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full filter blur-2xl pointer-events-none" />

          {isMasterPasswordCreated ? (
            // INGRESO LLAVE MAESTRA
            <div className="space-y-6">
              <div>
                <h4 className="text-xs font-black text-white uppercase tracking-wider mb-2">Desbloquear Bóveda</h4>
                <p className="text-[9px] text-neutral-500 font-black uppercase tracking-wider leading-relaxed">
                  Ingresa tu Llave Maestra local. Las contraseñas se desencriptarán en memoria de inmediato.
                </p>
              </div>

              <div className="relative">
                <input
                  type="password"
                  placeholder="LLAVE MAESTRA"
                  value={masterPassword}
                  onChange={e => setMasterPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleUnlockBoveda()}
                  className="w-full bg-[#040404] border border-white/5 focus:border-rose-500 rounded-2xl py-4 px-6 text-sm font-black uppercase tracking-widest text-center text-white placeholder-neutral-700 outline-none transition-all"
                />
              </div>

              <button
                onClick={handleUnlockBoveda}
                className="w-full py-4 bg-rose-500 text-black rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-600 transition-all shadow-xl shadow-rose-500/20 flex items-center justify-center gap-2"
              >
                <Unlock size={14} /> Desbloquear Bóveda
              </button>
            </div>
          ) : (
            // CREACIÓN INICIAL DE LLAVE MAESTRA
            <div className="space-y-6">
              <div className="p-4 bg-rose-500/5 border border-rose-500/10 rounded-2xl flex items-start gap-3">
                <ShieldAlert className="text-rose-500 shrink-0 mt-0.5" size={16} />
                <div className="space-y-1">
                  <h5 className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Atención: Criptografía Extrema</h5>
                  <p className="text-[8px] text-neutral-500 font-bold uppercase leading-normal">
                    Tus contraseñas se encriptarán del lado del cliente. Si olvidas esta Llave Maestra, tus datos serán irrecuperables. Sync Pro OS no almacena tu llave maestra.
                  </p>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-black text-white uppercase tracking-wider mb-2">Configurar Llave Maestra</h4>
                <p className="text-[9px] text-neutral-500 font-black uppercase tracking-wider leading-relaxed">
                  Crea una contraseña maestra ultra fuerte. Se utilizará como semilla criptográfica AES-256.
                </p>
              </div>

              <div className="relative">
                <input
                  type="password"
                  placeholder="NUEVA LLAVE MAESTRA"
                  value={masterPassword}
                  onChange={e => setMasterPassword(e.target.value)}
                  className="w-full bg-[#040404] border border-white/5 focus:border-rose-500 rounded-2xl py-4 px-6 text-sm font-black uppercase tracking-widest text-center text-white placeholder-neutral-700 outline-none transition-all"
                />
              </div>

              <button
                onClick={handleCreateMasterPassword}
                className="w-full py-4 bg-emerald-500 text-black rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2"
              >
                <ShieldCheck size={14} /> Crear & Desbloquear
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- PANTALLA 2: VISTA PRINCIPAL DE LA BÓVEDA ---
  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] w-full max-w-[1400px] mx-auto animate-in fade-in duration-500 overflow-hidden">
      
      {/* ALERTA DE CONFIGURACIÓN DE BASE DE DATOS */}
      {dbError && (
        <div className="mb-6 p-4 bg-[#f43f5e]/5 border border-[#f43f5e]/10 rounded-3xl flex items-center justify-between text-xs text-[#f43f5e] font-black uppercase tracking-wider backdrop-blur-md animate-bounce">
          <div className="flex items-center gap-3">
            <AlertCircle size={18} />
            <span>Bóveda local activa (localStorage). Para sincronizar de forma segura y encriptada en la nube, ejecuta el esquema SQL en Supabase.</span>
          </div>
          <button 
            onClick={copySqlToClipboard}
            className="px-4 py-2 bg-[#f43f5e]/10 border border-[#f43f5e]/20 rounded-xl hover:bg-[#f43f5e] hover:text-black transition-all flex items-center gap-1.5"
          >
            {copiedSql ? <Check size={14} /> : <Copy size={14} />}
            {copiedSql ? 'Copiado' : 'Copiar SQL'}
          </button>
        </div>
      )}

      {/* HEADER HUD */}
      <header className="flex justify-between items-end mb-8 border-b border-white/5 pb-6">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-rose-500/10 rounded-2xl text-rose-500 border border-rose-500/20 shadow-lg shadow-rose-500/10">
              <Key size={24}/>
            </div>
            <h2 className="text-4xl font-black text-white tracking-tighter uppercase leading-none">Credenciales <span className="text-neutral-800">Bóveda</span></h2>
          </div>
          <p className="text-[10px] text-neutral-600 font-black uppercase tracking-[0.3em] mt-3">Encriptación AES-256 militar en cliente</p>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-8 py-4 bg-rose-500 text-black rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-rose-600 transition-all shadow-xl shadow-rose-500/20 flex items-center gap-2"
          >
            <Plus size={18}/> Agregar Llave
          </button>
        </div>
      </header>

      {/* ÁREA DE CONTENIDO */}
      <div className="flex-1 flex gap-6 overflow-hidden min-h-0">
        
        {/* TABS DE CATEGORÍA (Lateral o vertical) */}
        <div className="w-64 bg-[#080808]/80 border border-white/5 rounded-[2.5rem] p-6 flex flex-col gap-6 min-h-0 backdrop-blur-3xl">
          <h4 className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Categorías</h4>
          <div className="space-y-1.5">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`w-full text-left px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all border ${
                  activeCategory === cat ? 'bg-white/5 border-white/10 text-white shadow-xl' : 'border-transparent text-neutral-500 hover:text-white hover:bg-white/[0.01]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="mt-auto p-4 bg-rose-500/5 border border-rose-500/10 rounded-2xl flex items-center gap-3">
            <ShieldCheck className="text-rose-500 shrink-0" size={16} />
            <span className="text-[8px] font-black uppercase text-neutral-500 tracking-wider leading-normal">
              Semilla de cifrado activa
            </span>
          </div>
        </div>

        {/* LISTADO DE CREDENCIALES */}
        <div className="flex-1 bg-[#080808]/80 border border-white/5 rounded-[2.5rem] p-6 flex flex-col gap-6 min-h-0 backdrop-blur-3xl">
          
          {/* Barra de Búsqueda */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-700" size={16} />
            <input
              type="text"
              placeholder="Buscar por sitio, usuario, notas..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-[#040404] border border-white/5 hover:border-white/10 focus:border-rose-500 rounded-2xl py-4 pl-12 pr-4 text-xs font-black uppercase tracking-wider text-white placeholder-neutral-700 outline-none transition-all"
            />
          </div>

          {/* Grilla de Credenciales */}
          <div className="flex-1 overflow-y-auto mac-scrollbar pr-1">
            {filteredCreds.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCreds.map(item => (
                  <div 
                    key={item.id} 
                    className="bg-[#040404] border border-white/5 hover:border-white/15 rounded-[2rem] p-6 transition-all group flex flex-col relative overflow-hidden"
                  >
                    {/* Header Credencial */}
                    <div className="flex justify-between items-start gap-4 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/5 border border-white/5 rounded-xl flex items-center justify-center text-neutral-600 shrink-0">
                          <Globe size={18} />
                        </div>
                        <div>
                          <span className="text-[7px] font-black uppercase text-neutral-600 tracking-wider block mb-0.5">{item.categoria}</span>
                          <h4 className="text-xs font-black text-white uppercase tracking-tight truncate max-w-[150px]">{item.sitio_web}</h4>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteCredential(item.id)}
                        className="p-2 bg-white/5 rounded-xl border border-white/5 text-neutral-700 hover:text-rose-500 hover:bg-rose-500/10 hover:border-rose-500/20 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>

                    {/* Campos de datos */}
                    <div className="space-y-3 mb-6 bg-[#080808]/80 border border-white/5 p-4 rounded-2xl">
                      
                      {/* Usuario */}
                      <div>
                        <span className="text-[7px] font-black uppercase text-neutral-700 tracking-wider block mb-1">Usuario / Correo</span>
                        <div className="flex justify-between items-center gap-2">
                          <span className="text-[10px] font-bold text-neutral-400 select-all truncate">{item.usuario}</span>
                          <button
                            onClick={() => copyToClipboard(item.usuario, item.id + '-user')}
                            className="p-1.5 bg-white/5 rounded-lg border border-white/5 text-neutral-600 hover:text-white hover:bg-white/10 transition-all shrink-0"
                          >
                            {copiedId === item.id + '-user' ? <Check size={10} className="text-emerald-500" /> : <Copy size={10} />}
                          </button>
                        </div>
                      </div>

                      {/* Contraseña */}
                      <div>
                        <span className="text-[7px] font-black uppercase text-neutral-700 tracking-wider block mb-1">Contraseña</span>
                        <div className="flex justify-between items-center gap-2">
                          <input
                            type={visiblePasswords[item.id] ? 'text' : 'password'}
                            value={item.contrasena_plana}
                            readOnly
                            className="bg-transparent border-0 text-[10px] font-mono text-rose-500 outline-none w-full select-all"
                          />
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => togglePasswordVisibility(item.id)}
                              className="p-1.5 bg-white/5 rounded-lg border border-white/5 text-neutral-600 hover:text-white hover:bg-white/10 transition-all"
                            >
                              {visiblePasswords[item.id] ? <EyeOff size={10} /> : <Eye size={10} />}
                            </button>
                            <button
                              onClick={() => copyToClipboard(item.contrasena_plana, item.id + '-pass')}
                              className="p-1.5 bg-white/5 rounded-lg border border-white/5 text-neutral-600 hover:text-white hover:bg-white/10 transition-all"
                            >
                              {copiedId === item.id + '-pass' ? <Check size={10} className="text-emerald-500" /> : <Copy size={10} />}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Notas y Enlaces */}
                    {item.notas && (
                      <p className="text-[9px] font-semibold text-neutral-600 line-clamp-2 leading-relaxed lowercase mb-4 border-t border-white/5 pt-3">
                        {item.notas}
                      </p>
                    )}

                    {item.url && (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-auto py-2.5 bg-white/5 border border-white/5 hover:border-white/15 rounded-xl text-[8px] font-black uppercase tracking-widest text-neutral-500 hover:text-white transition-all flex items-center justify-center gap-1.5"
                      >
                        <ExternalLink size={10} /> Abrir Enlace
                      </a>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-24 text-center border border-dashed border-white/5 rounded-[2.5rem] bg-white/[0.01]">
                <Key size={36} className="text-neutral-800 mx-auto mb-4" />
                <h5 className="text-xs font-black text-white uppercase tracking-wider">No hay credenciales</h5>
                <p className="text-[8px] text-neutral-600 font-black uppercase tracking-widest mt-1">Crea una llave o cambia el filtro de categoría</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL NUEVA CREDENCIAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[2000] animate-in fade-in duration-300">
          <div className="bg-[#080808] border border-white/10 rounded-[3rem] p-8 w-full max-w-2xl shadow-2xl relative max-h-[90vh] overflow-y-auto mac-scrollbar">
            <h4 className="text-lg font-black text-white uppercase tracking-wider mb-6 flex items-center gap-3">
              <Key className="text-rose-500" /> Nueva Credencial Segura
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Columna Formulario */}
              <div className="space-y-4">
                <div>
                  <label className="text-[9px] font-black text-neutral-500 uppercase tracking-widest mb-1.5 block">Nombre del Sitio</label>
                  <input
                    type="text"
                    value={newCred.sitio_web}
                    onChange={e => setNewCred(prev => ({ ...prev, sitio_web: e.target.value }))}
                    placeholder="Ej. Supabase, Instagram, Servidor..."
                    className="w-full bg-[#040404] border border-white/5 focus:border-rose-500 rounded-xl py-3 px-4 text-xs font-black uppercase tracking-wider text-white placeholder-neutral-700 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="text-[9px] font-black text-neutral-500 uppercase tracking-widest mb-1.5 block">URL del Sitio</label>
                  <input
                    type="url"
                    value={newCred.url}
                    onChange={e => setNewCred(prev => ({ ...prev, url: e.target.value }))}
                    placeholder="https://..."
                    className="w-full bg-[#040404] border border-white/5 focus:border-rose-500 rounded-xl py-3 px-4 text-xs font-black uppercase tracking-wider text-white placeholder-neutral-700 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="text-[9px] font-black text-neutral-500 uppercase tracking-widest mb-1.5 block">Usuario / Email</label>
                  <input
                    type="text"
                    value={newCred.usuario}
                    onChange={e => setNewCred(prev => ({ ...prev, usuario: e.target.value }))}
                    placeholder="Ej. admin@studio.com"
                    className="w-full bg-[#040404] border border-white/5 focus:border-rose-500 rounded-xl py-3 px-4 text-xs font-black uppercase tracking-wider text-white placeholder-neutral-700 outline-none transition-all"
                  />
                </div>

                <div className="relative">
                  <label className="text-[9px] font-black text-neutral-500 uppercase tracking-widest mb-1.5 block">Contraseña</label>
                  <input
                    type="text"
                    value={newCred.contrasena}
                    onChange={e => setNewCred(prev => ({ ...prev, contrasena: e.target.value }))}
                    placeholder="Escribe o genera una clave..."
                    className="w-full bg-[#040404] border border-white/5 focus:border-rose-500 rounded-xl py-3 px-4 text-xs font-black text-rose-500 placeholder-neutral-700 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Columna Generador & Metadata */}
              <div className="space-y-4">
                <div>
                  <label className="text-[9px] font-black text-neutral-500 uppercase tracking-widest mb-1.5 block">Categoría</label>
                  <select
                    value={newCred.categoria}
                    onChange={e => setNewCred(prev => ({ ...prev, categoria: e.target.value }))}
                    className="w-full bg-[#040404] border border-white/5 hover:border-white/10 rounded-xl py-3 px-4 text-xs font-black uppercase tracking-wider text-white outline-none cursor-pointer"
                  >
                    {categories.filter(c => c !== 'Todos').map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                {/* Generador de contraseñas */}
                <div className="bg-[#040404] border border-white/5 p-4 rounded-2xl">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[8px] font-black uppercase text-neutral-500 tracking-wider flex items-center gap-1.5">
                      <Sliders size={12} /> Generador Inteligente
                    </span>
                    <button
                      onClick={generatePassword}
                      className="px-2.5 py-1 bg-rose-500/10 border border-rose-500/20 text-rose-500 hover:bg-rose-500 hover:text-black rounded-lg text-[8px] font-black uppercase tracking-wider transition-all"
                    >
                      Generar Clave
                    </button>
                  </div>

                  <div className="space-y-3">
                    {/* Longitud */}
                    <div className="flex justify-between items-center">
                      <span className="text-[8px] font-bold text-neutral-600 uppercase">Longitud ({genLength})</span>
                      <input
                        type="range"
                        min="8"
                        max="32"
                        value={genLength}
                        onChange={e => setGenLength(parseInt(e.target.value))}
                        className="w-24 accent-rose-500"
                      />
                    </div>

                    {/* Checkboxes de parámetros */}
                    <div className="grid grid-cols-3 gap-2">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={genUpper}
                          onChange={e => setGenUpper(e.target.checked)}
                          className="rounded border-white/5 bg-transparent text-rose-500 focus:ring-0 w-3 h-3"
                        />
                        <span className="text-[7px] font-black text-neutral-600 uppercase">MAYÚS</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={genNumbers}
                          onChange={e => setGenNumbers(e.target.checked)}
                          className="rounded border-white/5 bg-transparent text-rose-500 focus:ring-0 w-3 h-3"
                        />
                        <span className="text-[7px] font-black text-neutral-600 uppercase">NÚM</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={genSymbols}
                          onChange={e => setGenSymbols(e.target.checked)}
                          className="rounded border-white/5 bg-transparent text-rose-500 focus:ring-0 w-3 h-3"
                        />
                        <span className="text-[7px] font-black text-neutral-600 uppercase">SÍMB</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-[9px] font-black text-neutral-500 uppercase tracking-widest mb-1.5 block">Notas Adicionales</label>
                  <textarea
                    value={newCred.notas}
                    onChange={e => setNewCred(prev => ({ ...prev, notas: e.target.value }))}
                    placeholder="Pines de recuperación, respuestas de seguridad..."
                    rows="2"
                    className="w-full bg-[#040404] border border-white/5 focus:border-rose-500 rounded-xl py-3 px-4 text-xs font-semibold text-neutral-200 placeholder-neutral-700 outline-none transition-all resize-none font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-6 border-t border-white/5 mt-6">
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex-1 py-4 bg-white/5 border border-white/5 hover:bg-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-neutral-400 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveCredential}
                className="flex-1 py-4 bg-rose-500 text-black rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-600 transition-all shadow-xl shadow-rose-500/20"
              >
                Cifrar & Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BovedaPass;
