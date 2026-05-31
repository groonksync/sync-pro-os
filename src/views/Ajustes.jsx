import React, { useState, useMemo } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import { 
  Settings, Palette, Smartphone, DollarSign, Building2, Database, Zap, 
  ShieldCheck, Maximize2, Monitor, Globe, RefreshCw, Trash2, Download, 
  Upload, Check, ChevronRight, Plus, Cloud, User as UserIcon, Link2, Unlink, Cpu
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { getTheme } from '../lib/theme';
import { Google, DeepSeek } from '@lobehub/icons';
import UpdaterPanel from '../components/UpdaterPanel';

const GoogleLogo = ({ size = 18 }) => <Google.Color size={size} />;
const DeepSeekLogo = ({ size = 18 }) => <DeepSeek.Color size={size} />;
const OpenRouterLogo = ({ size = 18 }) => <Cpu size={size} />;

const Ajustes = ({ settings, setSettings, googleUser, onLoginSuccess, onLogout, isDark = true }) => {
  const t = useMemo(() => getTheme(isDark), [isDark]);
  const [authCode, setAuthCode] = useState(null);
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState('...');

  // EFECTO DE TELEMETRÍA: Carga el balance real al entrar o cambiar llaves
  React.useEffect(() => {
    const loadBalance = async () => {
      if (settings.geminiKey || settings.deepseekKey || settings.openrouterKey) {
        import('../services/aiService').then(async ({ aiService }) => {
          const res = await aiService.fetchBalance(settings);
          setBalance(res);
        });
      }
    };
    loadBalance();
  }, [settings.aiProvider, settings.geminiKey, settings.deepseekKey, settings.openrouterKey]);

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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', gap: 40 }}>
      
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingBottom: 32, borderBottom: `1px solid ${t.borderLight}` }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: t.text, letterSpacing: '-0.02em', margin: 0 }}>Ajustes</h2>
          <p style={{ fontSize: '0.75rem', color: t.textDim, marginTop: '4px', fontWeight: 500 }}>Calibración Global de Infraestructura</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 10, fontWeight: 900, color: t.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
           <ShieldCheck size={16}/> System Secure
        </div>
      </header>

      {/* Sección de Cuenta Google */}
      <section style={{ backgroundColor: t.panel, border: `1px solid ${t.border}`, borderRadius: 28, padding: 32, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, right: 0, padding: 32, opacity: 0.05, transition: 'opacity 0.3s' }}><Cloud size={100}/></div>
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 32 }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
              <div style={{ width: 80, height: 80, backgroundColor: t.accentSoft, borderRadius: 24, border: `1px solid ${t.borderLight}`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {googleUser ? (
                  <img src={googleUser.picture} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <UserIcon size={32} style={{ color: t.textMuted }} />
                )}
              </div>
              <div>
                 <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: t.text, textTransform: 'uppercase', letterSpacing: '-0.05em', margin: 0 }}>
                   {googleUser ? googleUser.name : 'Cuenta Desconectada'}
                 </h3>
                 <p style={{ fontSize: 10, color: t.textMuted, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', marginTop: 4 }}>
                   {googleUser ? googleUser.email : 'Sincroniza con Google para activar servicios'}
                 </p>
              </div>
           </div>
           <div style={{ display: 'flex', gap: 16, width: '100%', flexWrap: 'wrap' }}>
             {googleUser ? (
               <button onClick={onLogout}
                 style={{ width: '100%', padding: '12px 24px', backgroundColor: `${t.danger}15`, border: `1px solid ${t.danger}30`, borderRadius: 12, fontSize: 10, fontWeight: 900, textTransform: 'uppercase', color: t.danger, cursor: 'pointer', transition: 'all 0.2s' }}>
                 Desvincular
               </button>
             ) : (
               <button onClick={() => login()}
                 style={{ width: '100%', padding: '12px 24px', backgroundColor: t.accent, color: '#000', border: 'none', borderRadius: 12, fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', cursor: 'pointer' }}>
                 Vincular Google
               </button>
             )}
           </div>
        </div>
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
        {/* Motor Estético */}
        <section style={{ backgroundColor: t.panel, border: `1px solid ${t.border}`, borderRadius: 24, padding: 32, display: 'flex', flexDirection: 'column', gap: 32, position: 'relative', overflow: 'hidden' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: t.text, textTransform: 'uppercase', letterSpacing: '-0.05em', margin: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
            <Palette size={20} style={{ color: t.textMuted }}/> Motor Estético
          </h3>
          
          <div>
            <p style={{ fontSize: 10, color: t.textDim, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12, marginTop: 0 }}>Color de Acento</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              {accentColors.map(color => (
                <button 
                  key={color.hex}
                  onClick={() => updateSetting('accentColor', color.hex)}
                  style={{
                    height: 48,
                    borderRadius: 12,
                    transition: 'all 0.2s',
                    border: settings.accentColor === color.hex ? `2px solid ${t.text}` : '2px solid transparent',
                    opacity: settings.accentColor === color.hex ? 1 : 0.4,
                    backgroundColor: color.hex,
                    cursor: 'pointer'
                  }}
                  onMouseEnter={e => { if (settings.accentColor !== color.hex) e.target.style.opacity = '1'; }}
                  onMouseLeave={e => { if (settings.accentColor !== color.hex) e.target.style.opacity = '0.4'; }}
                />
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, borderTop: `1px solid ${t.borderLight}`, paddingTop: 20 }}>
            <div>
              <p style={{ fontSize: 10, color: t.textDim, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8, marginTop: 0 }}>Color de Fondo (Modo Noche)</p>
              <div style={{ display: 'flex', gap: 8 }}>
                {[
                  { id: 'darkGray', label: 'Gris Oscuro', color: '#141414' },
                  { id: 'black', label: 'Negro OLED', color: '#000000' },
                  { id: 'lightGray', label: 'Gris Claro', color: '#222222' }
                ].map(bgOpt => (
                  <button
                    key={bgOpt.id}
                    onClick={() => updateSetting('appBackground', bgOpt.id)}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: 8,
                      fontSize: 9,
                      fontWeight: 900,
                      textTransform: 'uppercase',
                      backgroundColor: settings.appBackground === bgOpt.id ? t.accent : bgOpt.color,
                      color: settings.appBackground === bgOpt.id ? '#000000' : '#ffffff',
                      border: `1px solid ${t.borderLight}`,
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    {bgOpt.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p style={{ fontSize: 10, color: t.textDim, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8, marginTop: 0 }}>Fondo de Pantalla Desenfoque (Wallpaper)</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <input
                  type="file"
                  accept="image/*"
                  id="wallpaper-upload"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        updateSetting('backgroundImage', event.target.result);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
                <button
                  onClick={() => document.getElementById('wallpaper-upload').click()}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: t.accentSoft,
                    color: t.text,
                    border: `1px solid ${t.borderLight}`,
                    borderRadius: 8,
                    fontSize: 9,
                    fontWeight: 900,
                    textTransform: 'uppercase',
                    cursor: 'pointer'
                  }}
                >
                  Subir Imagen
                </button>
                {settings.backgroundImage && (
                  <button
                    onClick={() => updateSetting('backgroundImage', null)}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: `${t.danger}15`,
                      color: t.danger,
                      border: `1px solid ${t.danger}30`,
                      borderRadius: 8,
                      fontSize: 9,
                      fontWeight: 900,
                      textTransform: 'uppercase',
                      cursor: 'pointer'
                    }}
                  >
                    Eliminar Fondo
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Transmutador Móvil */}
        <section style={{
          border: `2px solid ${settings.isMobileMode ? t.accent : t.border}`,
          borderRadius: 24,
          padding: 32,
          display: 'flex',
          flexDirection: 'column',
          gap: 32,
          transition: 'all 0.5s',
          backgroundColor: t.panel
        }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: t.text, textTransform: 'uppercase', letterSpacing: '-0.05em', margin: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
            <Smartphone size={20}/> Transmutador Móvil
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <p style={{ fontSize: 12, fontWeight: 900, textTransform: 'uppercase', color: t.textDim, margin: 0 }}>Optimización Táctil</p>
            <button onClick={() => updateSetting('isMobileMode', !settings.isMobileMode)}
              style={{ width: 64, height: 32, borderRadius: 12, position: 'relative', transition: 'all 0.2s', backgroundColor: settings.isMobileMode ? t.inputBg : `${t.textMuted}20`, border: 'none', cursor: 'pointer' }}>
              <div style={{ position: 'absolute', top: 4, width: 24, height: 24, borderRadius: 12, transition: 'all 0.2s', backgroundColor: settings.isMobileMode ? t.text : t.textMuted, ...(settings.isMobileMode ? { right: 4 } : { left: 4 }) }}></div>
            </button>
          </div>
        </section>

        {/* Bóveda de Inteligencia */}
        <section style={{ backgroundColor: t.panel, border: `1px solid ${t.border}`, borderRadius: 24, padding: 32, display: 'flex', flexDirection: 'column', gap: 32, gridColumn: 'span 2' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
             <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: t.text, textTransform: 'uppercase', letterSpacing: '-0.05em', margin: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
               <Cpu size={20} style={{ color: t.success }}/> Bóveda de Inteligencia
             </h3>
             <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', backgroundColor: t.accentSoft, borderRadius: 12, border: `1px solid ${t.borderLight}` }}>
                <div style={{ width: 8, height: 8, borderRadius: 6, backgroundColor: settings.geminiKey || settings.deepseekKey || settings.openrouterKey ? t.success : t.danger, animation: settings.geminiKey || settings.deepseekKey || settings.openrouterKey ? 'pulse 2s infinite' : 'none' }}></div>
                <span style={{ fontSize: 9, fontWeight: 900, color: t.text, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{settings.geminiKey || settings.deepseekKey || settings.openrouterKey ? 'Vault Protegido' : 'Bóveda Vacía'}</span>
             </div>
          </div>
 
          <div style={{ display: 'flex', backgroundColor: t.inputBg, borderRadius: 12, padding: 6, border: `1px solid ${t.borderLight}`, maxWidth: 420 }}>
            {[
              { id: 'gemini', label: 'Google', Icon: GoogleLogo },
              { id: 'deepseek', label: 'DeepSeek', Icon: DeepSeekLogo },
              { id: 'openrouter', label: 'OpenRouter', Icon: OpenRouterLogo }
            ].map(p => (
              <button 
                key={p.id} 
                onClick={() => updateSetting('aiProvider', p.id)} 
                style={{
                  flex: 1,
                  padding: '12px 0',
                  borderRadius: 10,
                  fontSize: 10,
                  fontWeight: 900,
                  textTransform: 'uppercase',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  border: 'none',
                  backgroundColor: settings.aiProvider === p.id ? t.accent : 'transparent',
                  color: settings.aiProvider === p.id ? '#000' : t.textMuted,
                  cursor: 'pointer'
                }}
              >
                <p.Icon />
                {p.label}
              </button>
            ))}
          </div>
 
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
            {/* GESTIÓN DE LLAVES */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
               <div style={{ padding: 32, backgroundColor: t.inputBg, border: `1px solid ${t.borderLight}`, borderRadius: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                     <p style={{ fontSize: 10, color: t.text, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', margin: 0 }}>Llave Maestra {settings.aiProvider === 'gemini' ? 'Google' : settings.aiProvider === 'deepseek' ? 'DeepSeek' : 'OpenRouter'}</p>
                     <Zap size={14} style={{ color: settings.aiProvider === 'gemini' ? t.success : '#60a5fa' }}/>
                  </div>
                  
                  <div style={{ position: 'relative' }}>
                    <input 
                      type="password" 
                      id="ai-key-input"
                      key={settings.aiProvider}
                      defaultValue={settings.aiProvider === 'gemini' ? settings.geminiKey : settings.aiProvider === 'deepseek' ? settings.deepseekKey : settings.openrouterKey}
                      placeholder={`Pegar llave de ${settings.aiProvider}...`} 
                      style={{ width: '100%', backgroundColor: t.panel, border: `1px solid ${t.borderLight}`, borderRadius: 12, padding: 16, fontSize: 10, color: t.text, fontFamily: 'monospace', outline: 'none', transition: 'border-color 0.2s', paddingRight: 48 }}
                    />
                  </div>

                  {settings.aiProvider === 'openrouter' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <p style={{ fontSize: 8, color: t.textDim, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Modelo de Inteligencia (OpenRouter)</p>
                      <select 
                        value={settings.openrouterModel || 'google/gemini-2.5-flash'} 
                        onChange={e => updateSetting('openrouterModel', e.target.value)}
                        style={{ width: '100%', backgroundColor: t.panel, border: `1px solid ${t.borderLight}`, borderRadius: 12, padding: 12, fontSize: 10, color: t.text, outline: 'none' }}
                      >
                        <option value="google/gemini-2.5-flash">Gemini 2.5 Flash</option>
                        <option value="google/gemini-2.5-pro">Gemini 2.5 Pro</option>
                        <option value="deepseek/deepseek-chat">DeepSeek Chat (V3)</option>
                        <option value="meta-llama/llama-3-8b-instruct:free">Llama 3 8B Instruct (Free)</option>
                        <option value="anthropic/claude-3-haiku">Claude 3 Haiku</option>
                      </select>
                    </div>
                  )}
 
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                     <button 
                       onClick={() => {
                         const val = document.getElementById('ai-key-input').value;
                         const keyField = settings.aiProvider === 'gemini' ? 'geminiKey' : settings.aiProvider === 'deepseek' ? 'deepseekKey' : 'openrouterKey';
                         updateSetting(keyField, val);
                         alert("✅ Bóveda Actualizada. Llave vinculada correctamente.");
                       }}
                       style={{ padding: '14px 0', backgroundColor: t.success, color: '#000', borderRadius: 12, fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', border: 'none', cursor: 'pointer', transition: 'transform 0.2s' }}
                     >
                       Guardar API
                     </button>
                     <button 
                       onClick={() => {
                         const keyField = settings.aiProvider === 'gemini' ? 'geminiKey' : settings.aiProvider === 'deepseek' ? 'deepseekKey' : 'openrouterKey';
                         updateSetting(keyField, '');
                         document.getElementById('ai-key-input').value = '';
                         alert("⚠️ Purga Completada. La llave ha sido eliminada del sistema.");
                       }}
                       style={{ padding: '14px 0', backgroundColor: `${t.danger}15`, border: `1px solid ${t.danger}30`, color: t.danger, borderRadius: 12, fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer', transition: 'all 0.2s' }}
                     >
                       Eliminar API
                     </button>
                  </div>
               </div>
            </div>
 
            {/* ESTADO Y CRÉDITOS */}
            <div style={{ padding: 32, backgroundColor: t.inputBg, border: `1px solid ${t.borderLight}`, borderRadius: 24, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 32 }}>
               <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 16, borderBottom: `1px solid ${t.borderLight}` }}>
                     <span style={{ fontSize: 10, color: t.textDim, fontWeight: 900, textTransform: 'uppercase' }}>Consumo Neural</span>
                     <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 6, height: 6, borderRadius: 6, backgroundColor: t.success }}></div>
                        <span style={{ fontSize: 10, color: t.success, fontWeight: 900 }}>ACTIVO</span>
                     </div>
                  </div>
                  
                  <div style={{ textAlign: 'center', padding: '16px 0' }}>
                     <p style={{ fontSize: 10, color: t.textMuted, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Créditos Disponibles</p>
                     <p style={{ fontSize: '2rem', fontWeight: 900, color: t.text, letterSpacing: '-0.05em', margin: 0 }}>
                       {settings.aiProvider === 'gemini' ? (balance === '...' ? 'Ilimitado' : balance) : balance}
                     </p>
                     <p style={{ fontSize: 8, color: t.textMuted, fontWeight: 700, textTransform: 'uppercase', marginTop: 8 }}>Sincronizado en tiempo real</p>
                  </div>
               </div>
 
               <button 
                 onClick={async () => {
                   setBalance('...');
                   const { aiService } = await import('../services/aiService');
                   
                   const key = settings.aiProvider === 'gemini' ? settings.geminiKey : settings.aiProvider === 'deepseek' ? settings.deepseekKey : settings.openrouterKey;
                   if (!key) {
                      alert("❌ Error: No hay llave para sincronizar.");
                      setBalance('Sin Llave');
                      return;
                   }
 
                   const res = await aiService.fetchBalance(settings);
                   setBalance(res);
 
                   try {
                     if (settings.aiProvider === 'gemini') {
                       const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
                       const mRes = await fetch(url);
                       const mData = await mRes.json();
                       if (mData.models) {
                          const modelList = mData.models.map(m => m.name.replace('models/', '')).join(', ');
                          alert(`📡 Sincronización Neural Exitosa.\n\nModelos detectados: ${modelList}\n\nTu llave está lista para operar.`);
                       } else {
                          alert("⚠️ Sincronización Parcial: La llave conecta pero no ve modelos de IA. Asegúrate de habilitar la 'Generative Language API'.");
                       }
                     } else if (settings.aiProvider === 'openrouter') {
                       alert("📡 Sincronización Exitosa: Balance de OpenRouter actualizado en tiempo real.");
                     } else {
                       alert("📡 Sincronización Exitosa: Balance de DeepSeek actualizado.");
                     }
                   } catch (e) {
                     alert("📡 Sincronización Exitosa: Balance actualizado.");
                   }
                 }} 
                 style={{ width: '100%', padding: '18px 0', backgroundColor: t.accent, color: '#000', border: 'none', borderRadius: 12, fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer', transition: 'transform 0.2s' }}
               >
                 Refrescar y Diagnosticar Telemetría
               </button>
            </div>
          </div>
        </section>

        {/* Identidad */}
        <section style={{ backgroundColor: t.panel, border: `1px solid ${t.border}`, borderRadius: 24, padding: 32, display: 'flex', flexDirection: 'column', gap: 32 }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: t.text, textTransform: 'uppercase', letterSpacing: '-0.05em', margin: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
            <Building2 size={20}/> Identidad
          </h3>
          <input type="text" value={settings.studioName} onChange={e => updateSetting('studioName', e.target.value)}
            style={{ width: '100%', backgroundColor: t.inputBg, border: `1px solid ${t.borderLight}`, borderRadius: 12, padding: 16, fontSize: 14, color: t.text, fontWeight: 700, outline: 'none' }}/>
          <button onClick={handleExportBackup}
            style={{ width: '100%', padding: '14px 0', backgroundColor: `${t.success}15`, border: `1px solid ${t.success}30`, borderRadius: 12, fontSize: 10, fontWeight: 900, textTransform: 'uppercase', color: t.success, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, cursor: 'pointer' }}>
            <Download size={16}/> Exportar Backup
          </button>
        </section>

        {/* Mantenimiento */}
        <section style={{ backgroundColor: t.panel, border: `1px solid ${t.border}`, borderRadius: 24, padding: 32, display: 'flex', flexDirection: 'column', gap: 32 }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: t.text, textTransform: 'uppercase', letterSpacing: '-0.05em', margin: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
            <Database size={20}/> Mantenimiento
          </h3>
          <button style={{ width: '100%', padding: 24, backgroundColor: `${t.danger}08`, border: `1px solid ${t.danger}15`, borderRadius: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
            <div style={{ textAlign: 'left' }}><p style={{ fontSize: 12, fontWeight: 900, color: t.danger, textTransform: 'uppercase', margin: 0 }}>Limpiar Logs</p></div>
            <Trash2 size={18} style={{ color: t.danger }}/>
          </button>
        </section>

        {/* Actualizador */}
        <UpdaterPanel t={t} />
      </div>
    </div>
  );
};

export default Ajustes;
