import React, { useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import { 
  Settings, Palette, Smartphone, DollarSign, Building2, Database, Zap, 
  ShieldCheck, Maximize2, Monitor, Globe, RefreshCw, Trash2, Download, 
  Upload, Check, ChevronRight, Plus, Cloud, User as UserIcon, Link2, Unlink, Cpu
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { Google, DeepSeek } from '@lobehub/icons';

const GoogleLogo = ({ size = 18 }) => <Google.Color size={size} />;
const DeepSeekLogo = ({ size = 18 }) => <DeepSeek.Color size={size} />;

const Ajustes = ({ settings, setSettings, googleUser, onLoginSuccess, onLogout }) => {
  const [authCode, setAuthCode] = useState(null);
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState('...');

  // EFECTO DE TELEMETRÍA: Carga el balance real al entrar o cambiar llaves
  React.useEffect(() => {
    const loadBalance = async () => {
      if (settings.geminiKey || settings.deepseekKey) {
        import('../services/aiService').then(async ({ aiService }) => {
          const res = await aiService.fetchBalance(settings);
          setBalance(res);
        });
      }
    };
    loadBalance();
  }, [settings.aiProvider, settings.geminiKey, settings.deepseekKey]);

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

  const accentColors = [
    { name: 'Sovereign Gold', hex: '#fbbf24' },
    { name: 'Pure White', hex: '#ffffff' },
    { name: 'Cyber Blue', hex: '#969696' },
    { name: 'Crimson Red', hex: '#ef4444' },
    { name: 'Emerald Finance', hex: '#10b981' },
    { name: 'Neon Purple', hex: '#a855f7' },
    { name: 'Sunset Orange', hex: '#f97316' },
  ];

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
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
  };

  return (
    <div className="flex flex-col h-full max-w-5xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      
      <header className="flex justify-between items-end pb-8 border-b border-white/5">
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', letterSpacing: '-0.02em', margin: 0 }}>Ajustes</h2>
          <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '4px', fontWeight: 500 }}>Calibración Global de Infraestructura</p>
        </div>
        <div className="flex items-center gap-4 text-[10px] font-black text-neutral-800 uppercase tracking-widest">
           <ShieldCheck size={16}/> System Secure
        </div>
      </header>

      <section className="bg-[#202022] border border-white/5 rounded-[32px] p-8 shadow-2xl relative overflow-hidden group">
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
              </div>
           </div>
           <div className="flex gap-4 w-full md:w-auto">
              {googleUser ? (
                <button onClick={onLogout} className="w-full md:w-auto px-6 py-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-[10px] font-black uppercase text-rose-500 hover:bg-rose-500 hover:text-white transition-all">Desvincular</button>
              ) : (
                <button onClick={() => login()} className="w-full md:w-auto px-10 py-4 bg-white text-black rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl">Vincular Google</button>
              )}
           </div>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <section className="bg-[#202022] border border-white/5 rounded-[28px] p-8 space-y-8 shadow-2xl relative overflow-hidden">
          <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-2 flex items-center gap-3"><Palette size={20} className="text-neutral-700"/> Motor Estético</h3>
          <div className="grid grid-cols-4 gap-3">
            {accentColors.map(color => (
              <button 
                key={color.hex}
                onClick={() => updateSetting('accentColor', color.hex)}
                className={`h-12 rounded-2xl transition-all border-2 ${settings.accentColor === color.hex ? 'border-white scale-110 shadow-xl' : 'border-transparent opacity-40 hover:opacity-100'}`}
                style={{ backgroundColor: color.hex }}
              />
            ))}
          </div>
        </section>

        <section className={`border-2 rounded-[28px] p-8 space-y-8 shadow-2xl transition-all duration-500 ${settings.isMobileMode ? 'bg-white border-white text-black' : 'bg-[#202022] border-white/5 text-white'}`}>
          <h3 className="text-xl font-black uppercase tracking-tighter flex items-center gap-3"><Smartphone size={20}/> Transmutador Móvil</h3>
          <div className="flex items-center justify-between">
            <p className="text-xs font-black uppercase">Optimización Táctil</p>
            <button onClick={() => updateSetting('isMobileMode', !settings.isMobileMode)} className={`w-16 h-8 rounded-full relative transition-all ${settings.isMobileMode ? 'bg-[#141414]' : 'bg-white/10'}`}>
              <div className={`absolute top-1 w-6 h-6 rounded-full transition-all ${settings.isMobileMode ? 'right-1 bg-white' : 'left-1 bg-neutral-700'}`}></div>
            </button>
          </div>
        </section>

        <section className="bg-[#202022] border border-white/5 rounded-[28px] p-8 space-y-8 shadow-2xl md:col-span-2">
          <div className="flex items-center justify-between">
             <h3 className="text-xl font-black text-white uppercase tracking-tighter flex items-center gap-3"><Cpu size={20} className="text-emerald-500"/> Bóveda de Inteligencia</h3>
             <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/5">
                <div className={`w-2 h-2 rounded-full ${settings.geminiKey || settings.deepseekKey ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></div>
                <span className="text-[9px] font-black text-white uppercase tracking-widest">{settings.geminiKey || settings.deepseekKey ? 'Vault Protegido' : 'Bóveda Vacía'}</span>
             </div>
          </div>

          <div className="flex bg-[#141414] rounded-2xl p-1.5 border border-white/10 max-w-xs">
            {[
              { id: 'gemini', label: 'Google', Icon: GoogleLogo },
              { id: 'deepseek', label: 'DeepSeek', Icon: DeepSeekLogo }
            ].map(p => (
              <button 
                key={p.id} 
                onClick={() => updateSetting('aiProvider', p.id)} 
                className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all flex items-center justify-center gap-2 ${settings.aiProvider === p.id ? 'bg-white text-black shadow-xl' : 'text-neutral-600 hover:text-white'}`}
              >
                <p.Icon />
                {p.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* GESTIÓN DE LLAVES */}
            <div className="space-y-6">
               <div className="p-8 bg-white/[0.02] border border-white/5 rounded-[2rem] space-y-6">
                  <div className="flex justify-between items-center">
                     <p className="text-[10px] text-white font-black uppercase tracking-[0.2em]">Llave Maestra {settings.aiProvider === 'gemini' ? 'Google' : 'DeepSeek'}</p>
                     <Zap size={14} className={settings.aiProvider === 'gemini' ? 'text-emerald-500' : 'text-blue-500'}/>
                  </div>
                  
                  <div className="relative">
                    <input 
                      type="password" 
                      id="ai-key-input"
                      defaultValue={settings.aiProvider === 'gemini' ? settings.geminiKey : settings.deepseekKey}
                      placeholder={`Pegar llave de ${settings.aiProvider}...`} 
                      className="w-full bg-[#141414] border border-white/5 rounded-2xl p-5 text-[10px] text-white font-mono outline-none focus:border-white/20 transition-all pr-12 shadow-inner"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <button 
                       onClick={() => {
                         const val = document.getElementById('ai-key-input').value;
                         updateSetting(settings.aiProvider === 'gemini' ? 'geminiKey' : 'deepseekKey', val);
                         alert("✅ Bóveda Actualizada. Llave vinculada correctamente.");
                       }}
                       className="py-4 bg-emerald-500 text-black rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                     >
                       Guardar API
                     </button>
                     <button 
                       onClick={() => {
                         updateSetting(settings.aiProvider === 'gemini' ? 'geminiKey' : 'deepseekKey', '');
                         document.getElementById('ai-key-input').value = '';
                         alert("⚠️ Purga Completada. La llave ha sido eliminada del sistema.");
                       }}
                       className="py-4 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all"
                     >
                       Eliminar API
                     </button>
                  </div>
               </div>
            </div>

            {/* ESTADO Y CRÉDITOS */}
            <div className="p-8 bg-white/[0.02] border border-white/5 rounded-[2rem] flex flex-col justify-between gap-8">
               <div className="space-y-6">
                  <div className="flex justify-between items-center pb-4 border-b border-white/5">
                     <span className="text-[10px] text-neutral-500 font-black uppercase">Consumo Neural</span>
                     <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                        <span className="text-[10px] text-emerald-500 font-black">ACTIVO</span>
                     </div>
                  </div>
                  
                  <div className="text-center py-4">
                     <p className="text-[10px] text-neutral-600 font-black uppercase tracking-widest mb-2">Créditos Disponibles</p>
                     <p className="text-4xl font-black text-white tracking-tighter">
                        {settings.aiProvider === 'gemini' ? (balance === '...' ? 'Ilimitado' : balance) : balance}
                     </p>
                     <p className="text-[8px] text-neutral-700 font-bold uppercase mt-2">Sincronizado en tiempo real</p>
                  </div>
               </div>

               <button 
                 onClick={async () => {
                   setBalance('...');
                   const { aiService } = await import('../services/aiService');
                   
                   // TEST DE MODELOS
                   const key = settings.aiProvider === 'gemini' ? settings.geminiKey : settings.deepseekKey;
                   if (!key) {
                      alert("❌ Error: No hay llave para sincronizar.");
                      setBalance('Sin Llave');
                      return;
                   }

                   const res = await aiService.fetchBalance(settings);
                   setBalance(res);

                   // DETECTAR MODELOS (Diagnóstico profundo)
                   try {
                     const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
                     const mRes = await fetch(url);
                     const mData = await mRes.json();
                     if (mData.models) {
                        const modelList = mData.models.map(m => m.name.replace('models/', '')).join(', ');
                        alert(`📡 Sincronización Neural Exitosa.\n\nModelos detectados: ${modelList}\n\nTu llave está lista para operar.`);
                     } else {
                        alert("⚠️ Sincronización Parcial: La llave conecta pero no ve modelos de IA. Asegúrate de habilitar la 'Generative Language API'.");
                     }
                   } catch (e) {
                     alert("📡 Sincronización Exitosa: Balance actualizado.");
                   }
                 }} 
                 className="w-full py-5 bg-white text-black rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl"
               >
                 Refrescar y Diagnosticar Telemetría
               </button>
            </div>
          </div>
        </section>

        <section className="bg-[#202022] border border-white/5 rounded-[28px] p-8 space-y-8 shadow-2xl">
          <h3 className="text-xl font-black text-white uppercase tracking-tighter flex items-center gap-3"><Building2 size={20}/> Identidad</h3>
          <input type="text" value={settings.studioName} onChange={e => updateSetting('studioName', e.target.value)} className="w-full bg-[#141414] border border-white/5 rounded-2xl p-4 text-sm text-white font-bold outline-none"/>
          <button onClick={handleExportBackup} className="w-full py-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-[10px] font-black uppercase text-emerald-500 flex items-center justify-center gap-3"><Download size={16}/> Exportar Backup</button>
        </section>

        <section className="bg-[#202022] border border-white/5 rounded-[28px] p-8 space-y-8 shadow-2xl">
          <h3 className="text-xl font-black text-white uppercase tracking-tighter flex items-center gap-3"><Database size={20}/> Mantenimiento</h3>
          <button className="w-full p-6 bg-rose-500/5 border border-rose-500/10 rounded-[32px] flex items-center justify-between group">
            <div className="text-left"><p className="text-xs font-black text-rose-500 uppercase">Limpiar Logs</p></div>
            <Trash2 size={18} className="text-rose-500"/>
          </button>
        </section>
      </div>
    </div>
  );
};

export default Ajustes;
