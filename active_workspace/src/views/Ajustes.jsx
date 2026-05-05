import React, { useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import { 
  Settings, Palette, Smartphone, DollarSign, Building2, Database, Zap, 
  ShieldCheck, Maximize2, Monitor, Globe, RefreshCw, Trash2, Download, 
  Upload, Check, ChevronRight, Plus, Cloud, User as UserIcon, Link2, Unlink 
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

const Ajustes = ({ settings, setSettings, googleUser, onLoginSuccess, onLogout }) => {
  const [authCode, setAuthCode] = useState(null);
  const [loading, setLoading] = useState(false);

  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      try {
        const userInfo = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });
        onLoginSuccess(tokenResponse.access_token, userInfo.data);
      } catch (error) {
        console.error('Error fetching user info:', error);
      } finally {
        setLoading(false);
      }
    },
    scope: 'https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/tasks https://www.googleapis.com/auth/calendar',
  });

  const getAuthCode = useGoogleLogin({
    flow: 'auth-code',
    onSuccess: (codeResponse) => {
      setAuthCode(codeResponse.code);
      alert("Código de autorización obtenido con éxito:\n\n" + codeResponse.code);
    },
    scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/tasks https://www.googleapis.com/auth/calendar.readonly',
  });
  
  const accentColors = [
    { name: 'Sovereign Gold', hex: '#fbbf24' },
    { name: 'Pure White', hex: '#ffffff' },
    { name: 'Cyber Blue', hex: '#3b82f6' },
    { name: 'Crimson Red', hex: '#ef4444' },
    { name: 'Emerald Finance', hex: '#10b981' },
    { name: 'Neon Purple', hex: '#a855f7' },
    { name: 'Sunset Orange', hex: '#f97316' },
  ];

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const updateRate = (currency, val) => {
    setSettings(prev => ({
      ...prev,
      currencyRates: { ...prev.currencyRates, [currency]: parseFloat(val) || 0 }
    }));
  };

  const handleExportBackup = async () => {
    try {
      const { data: reuniones } = await supabase.from('reuniones').select('*');
      const { data: clientes } = await supabase.from('clientes_editor').select('*');
      const { data: prestamos } = await supabase.from('prestamos').select('*');
      const { data: servicios } = await supabase.from('servicios').select('*');
      
      const backupData = {
        timestamp: new Date().toISOString(),
        tables: { reuniones, clientes_editor: clientes, prestamos, servicios }
      };
      
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `syncpro_backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert("Error al exportar: " + e.message);
    }
  };

  const handleImportBackup = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!confirm("⚠️ CRÍTICO: Esto sobrescribirá todos los datos actuales de la nube con los del archivo de respaldo. ¿Estás absolutamente seguro de proceder?")) {
      e.target.value = '';
      return;
    }
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const backupData = JSON.parse(event.target.result);
        if (!backupData.tables) throw new Error("Formato de archivo inválido");
        
        if (backupData.tables.reuniones?.length > 0) await supabase.from('reuniones').upsert(backupData.tables.reuniones);
        if (backupData.tables.clientes_editor?.length > 0) await supabase.from('clientes_editor').upsert(backupData.tables.clientes_editor);
        if (backupData.tables.prestamos?.length > 0) await supabase.from('prestamos').upsert(backupData.tables.prestamos);
        if (backupData.tables.servicios?.length > 0) await supabase.from('servicios').upsert(backupData.tables.servicios);
        
        alert("✅ Base de datos restaurada con éxito. La aplicación se reiniciará para aplicar los cambios.");
        window.location.reload();
      } catch (err) {
        alert("Error al restaurar: " + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
    e.target.value = '';
  };

  return (
    <div className="flex flex-col h-full max-w-5xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      
      {/* HEADER MASTER */}
      <header className="flex justify-between items-end pb-8 border-b border-white/5">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-white/5 text-neutral-400"><Settings size={20}/></div>
            <h2 className="text-3xl font-black text-white tracking-tighter uppercase leading-none">Ajustador <span className="text-neutral-700">Maestro</span></h2>
          </div>
          <p className="text-[10px] text-neutral-600 font-black uppercase tracking-[0.3em]">Calibración Global de Infraestructura</p>
        </div>
        <div className="flex items-center gap-4 text-[10px] font-black text-neutral-800 uppercase tracking-widest">
           <ShieldCheck size={16}/> System Secure
        </div>
      </header>

      {/* SECCIÓN: IDENTIDAD Y NUBE (GOOGLE) */}
      <section className="bg-[#0a0a0a] border border-white/5 rounded-[32px] p-8 shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity"><Cloud size={100}/></div>
        <div className="relative flex flex-col md:flex-row items-center justify-between gap-8">
           <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-white/5 rounded-[2rem] border border-white/5 flex items-center justify-center overflow-hidden">
                {googleUser ? (
                  <img src={googleUser.picture} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <UserIcon size={32} className="text-neutral-800" />
                )}
              </div>
              <div>
                 <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-1">
                   {googleUser ? googleUser.name : 'Cuenta Desconectada'}
                 </h3>
                 <p className="text-[10px] text-neutral-600 font-black uppercase tracking-[0.2em]">
                   {googleUser ? googleUser.email : 'Sincroniza con Google para activar servicios'}
                 </p>
                 {googleUser && (
                   <div className="flex items-center gap-2 mt-2">
                     <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                     <span className="text-[8px] text-emerald-500 font-black uppercase tracking-widest">Sincronización Activa</span>
                   </div>
                 )}
              </div>
           </div>

           <div className="flex gap-4 w-full md:w-auto">
              {googleUser ? (
                <>
                  <button 
                    onClick={() => login()}
                    disabled={loading}
                    className="flex-1 md:flex-none px-6 py-4 bg-white/5 border border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/10 transition-all flex items-center justify-center gap-3"
                  >
                    <Link2 size={16}/> Cambiar Cuenta
                  </button>
                  <button 
                    onClick={onLogout}
                    className="flex-1 md:flex-none px-6 py-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-[10px] font-black uppercase tracking-widest text-rose-500 hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center gap-3"
                  >
                    <Unlink size={16}/> Desvincular
                  </button>
                </>
              ) : (
                <button 
                  onClick={() => login()}
                  disabled={loading}
                  className="w-full md:w-auto px-10 py-4 bg-white text-black rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-neutral-200 transition-all flex items-center justify-center gap-3 shadow-xl"
                >
                  {loading ? <RefreshCw className="animate-spin" size={16}/> : <Cloud size={16}/>}
                  Vincular Cuenta de Google
                </button>
              )}
           </div>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* SECCIÓN: PERSONALIZACIÓN ESTÉTICA */}
        <section className="bg-[#0a0a0a] border border-white/5 rounded-[28px] p-8 space-y-8 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity"><Palette size={120}/></div>
          
          <div className="relative">
            <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-2 flex items-center gap-3"><Palette size={20} className="text-neutral-700"/> Motor Estético</h3>
            <p className="text-[10px] text-neutral-600 font-bold uppercase tracking-widest mb-8">Define el ADN visual de Sovereign OS</p>
            
            <div className="space-y-6">
              <div>
                <p className="text-[9px] text-neutral-500 font-black uppercase mb-4 tracking-widest">Color de Acento Global</p>
                <div className="grid grid-cols-4 gap-3">
                  {accentColors.map(color => (
                    <button 
                      key={color.hex}
                      onClick={() => updateSetting('accentColor', color.hex)}
                      className={`h-12 rounded-2xl transition-all relative overflow-hidden border-2 ${settings.accentColor === color.hex ? 'border-white scale-110 shadow-xl z-10' : 'border-transparent opacity-40 hover:opacity-100'}`}
                      style={{ backgroundColor: color.hex }}
                    >
                      {settings.accentColor === color.hex && <Check size={16} className="absolute inset-0 m-auto text-black font-bold"/>}
                    </button>
                  ))}
                  
                  <div className="relative h-12 rounded-2xl border-2 border-dashed border-white/20 flex items-center justify-center text-neutral-400 hover:text-white cursor-pointer transition-colors overflow-hidden group">
                    <input 
                      type="color" 
                      value={settings.accentColor}
                      onChange={(e) => updateSetting('accentColor', e.target.value)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <Plus size={16} className="group-hover:scale-125 transition-transform" />
                  </div>
                </div>
              </div>

              <div>
                <p className="text-[9px] text-neutral-500 font-black uppercase mb-4 tracking-widest">Densidad de Interfaz</p>
                <div className="flex bg-black rounded-2xl p-1.5 border border-white/5">
                  {['Compacto', 'Normal', 'Expandido'].map(d => (
                    <button 
                      key={d} 
                      onClick={() => updateSetting('interfaceDensity', d.toLowerCase())}
                      className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase transition-all ${settings.interfaceDensity === d.toLowerCase() ? 'bg-white text-black shadow-lg' : 'text-neutral-600 hover:text-white'}`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECCIÓN: TRANSMUTACIÓN MÓVIL */}
        <section className={`border-2 rounded-[28px] p-8 space-y-8 shadow-2xl transition-all duration-500 relative overflow-hidden ${settings.isMobileMode ? 'bg-white border-white' : 'bg-[#0a0a0a] border-white/5'}`}>
          <div className={`absolute top-0 right-0 p-8 transition-opacity ${settings.isMobileMode ? 'text-black opacity-10' : 'text-white opacity-5'}`}><Smartphone size={120}/></div>
          
          <div className="relative">
            <h3 className={`text-xl font-black uppercase tracking-tighter mb-2 flex items-center gap-3 ${settings.isMobileMode ? 'text-black' : 'text-white'}`}>
              <Smartphone size={20} className={settings.isMobileMode ? 'text-black/20' : 'text-neutral-700'}/> Transmutador Móvil
            </h3>
            <p className={`text-[10px] font-bold uppercase tracking-widest mb-10 ${settings.isMobileMode ? 'text-black/60' : 'text-neutral-600'}`}>Re-estructura la app para dispositivos táctiles</p>
            
            <div className={`p-8 rounded-[32px] border transition-all ${settings.isMobileMode ? 'bg-black/5 border-black/10' : 'bg-black/40 border-white/5'}`}>
               <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className={`text-xs font-black uppercase ${settings.isMobileMode ? 'text-black' : 'text-white'}`}>Modo Smart Phone</p>
                    <p className={`text-[9px] font-medium ${settings.isMobileMode ? 'text-black/40' : 'text-neutral-600'}`}>Optimiza navegación, botones y paneles</p>
                  </div>
                  <button 
                    onClick={() => updateSetting('isMobileMode', !settings.isMobileMode)}
                    className={`w-16 h-8 rounded-full transition-all relative ${settings.isMobileMode ? 'bg-black' : 'bg-white/10'}`}
                  >
                    <div className={`absolute top-1 w-6 h-6 rounded-full transition-all ${settings.isMobileMode ? 'right-1 bg-white' : 'left-1 bg-neutral-700'}`}></div>
                  </button>
               </div>
               
               <div className="space-y-3 mt-8">
                  {[
                    { icon: Monitor, label: 'Navegación Inferior Tactil', active: settings.isMobileMode },
                    { icon: Maximize2, label: 'Auto-Stack de Paneles Pro', active: settings.isMobileMode },
                    { icon: Zap, label: 'Renderización de Alto Desempeño', active: settings.isMobileMode }
                  ].map((item, idx) => (
                    <div key={idx} className={`flex items-center gap-3 text-[9px] font-black uppercase ${item.active ? 'text-black opacity-100' : 'text-neutral-800'}`}>
                       <item.icon size={14}/> {item.label}
                    </div>
                  ))}
               </div>
            </div>
          </div>
        </section>

        {/* SECCIÓN: INFRAESTRUCTURA FINANCIERA */}
        <section className="bg-[#0a0a0a] border border-white/5 rounded-[28px] p-8 space-y-8 shadow-2xl md:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-2 flex items-center gap-3"><DollarSign size={20} className="text-neutral-700"/> Infraestructura Financiera</h3>
              <p className="text-[10px] text-neutral-600 font-bold uppercase tracking-widest">Tipos de cambio maestros (Global BOB)</p>
            </div>
            <div className="p-3 bg-white/5 rounded-xl text-neutral-500"><RefreshCw size={18}/></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Object.entries(settings.currencyRates).map(([cur, rate]) => (
              <div key={cur} className="bg-black border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-all">
                <p className="text-[9px] text-neutral-500 font-black uppercase mb-3 tracking-widest">Valor Maestro {cur}</p>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-white font-black text-xs">{cur}</div>
                  <input 
                    type="number" 
                    step="0.01" 
                    value={rate} 
                    onChange={(e) => updateRate(cur, e.target.value)}
                    className="flex-1 bg-transparent text-2xl font-mono font-black text-white outline-none" 
                  />
                  <span className="text-[10px] text-neutral-700 font-black">BOB</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SECCIÓN: IDENTIDAD Y SISTEMA */}
        <section className="bg-[#0a0a0a] border border-white/5 rounded-[28px] p-8 space-y-8 shadow-2xl">
          <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-8 flex items-center gap-3"><Building2 size={20} className="text-neutral-700"/> Identidad del Sistema</h3>
          
          <div className="space-y-6">
            <div>
              <p className="text-[9px] text-neutral-500 font-black uppercase mb-3 tracking-widest">Nombre del Estudio / Agencia</p>
              <input 
                type="text" 
                value={settings.studioName}
                onChange={(e) => updateSetting('studioName', e.target.value)}
                className="w-full bg-black border border-white/5 rounded-2xl p-4 text-sm text-white font-bold outline-none focus:border-white/20 transition-colors" 
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <button onClick={handleExportBackup} className="w-full py-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-[10px] font-black uppercase text-emerald-500 hover:bg-emerald-500/20 transition-all flex items-center justify-center gap-3">
                <Download size={16}/> Exportar DB (Backup)
              </button>
              
              <div className="relative w-full">
                <input 
                  type="file" 
                  accept=".json"
                  onChange={handleImportBackup}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <button className="w-full h-full py-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-[10px] font-black uppercase text-rose-500 hover:bg-rose-500/20 transition-all flex items-center justify-center gap-3 pointer-events-none">
                  <Upload size={16}/> Restaurar DB
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* SECCIÓN: MANTENIMIENTO CRÍTICO */}
        <section className="bg-[#0a0a0a] border border-white/5 rounded-[28px] p-8 space-y-8 shadow-2xl">
          <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-8 flex items-center gap-3"><Database size={20} className="text-neutral-700"/> Mantenimiento Crítico</h3>
          
          <div className="space-y-4">
            <button className="w-full p-6 bg-rose-500/5 border border-rose-500/10 rounded-[32px] flex items-center justify-between group hover:bg-rose-500/10 transition-all">
              <div className="text-left">
                <p className="text-xs font-black text-rose-500 uppercase">Limpieza de Infraestructura</p>
                <p className="text-[9px] text-rose-500/40 font-medium uppercase mt-1">Borrar logs y caché del sistema</p>
              </div>
              <div className="p-3 rounded-xl bg-rose-500/10 text-rose-500 group-hover:scale-110 transition-transform"><Trash2 size={18}/></div>
            </button>

            <button className="w-full p-6 bg-amber-500/5 border border-amber-500/10 rounded-[32px] flex items-center justify-between group hover:bg-amber-500/10 transition-all">
              <div className="text-left">
                <p className="text-xs font-black text-amber-500 uppercase">Resincronizar Supabase</p>
                <p className="text-[9px] text-amber-500/40 font-medium uppercase mt-1">Refrescar esquemas de tablas</p>
              </div>
              <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500 group-hover:rotate-180 transition-transform duration-700"><RefreshCw size={18}/></div>
            </button>
          </div>
        </section>

      </div>
    </div>
  );
};

export default Ajustes;
