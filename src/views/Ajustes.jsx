import React, { useState, useMemo, useRef, useCallback } from 'react';
import {
  Palette, Monitor, Sidebar as SidebarIcon, Image as ImageIcon, Type, Layout, Sun, Moon, Eye, EyeOff,
  DollarSign, BadgePercent, CalendarDays, Bell, BellRing, BellOff,
  Smartphone, Tablet, Shield, Lock, Key, Download, Upload, Trash2,
  RefreshCw, Wifi, WifiOff, Zap, Cpu, Languages, Clock, MonitorDown,
  CreditCard, Building2, Wallet, FileText, Video, FolderOpen, MousePointer2,
  ChevronDown, ChevronRight, Save, Check, X, Camera, QrCode, Link as LinkIcon,
  AppWindow, Terminal, LogOut, RotateCcw, Info, AlertTriangle, Globe,
  Bookmark, Briefcase, Calendar, CheckCircle2, ChevronUp, Layers, Sparkles,
  Play, Bot, ExternalLink
} from 'lucide-react';
import { useSettings } from '../lib/settingsStore';
import { getTheme, useTheme } from '../lib/theme';
import { aiService } from '../services/aiService';

const SECCIONES_PROFESIONALES = [
  { id: 'ia', icon: Cpu, label: 'Inteligencia Artificial', desc: 'Google Gemini, DeepSeek y prueba de API en vivo', badge: 'PRO' },
  { id: 'apariencia', icon: Palette, label: 'Apariencia & Tema', desc: 'Colores, tonos OLED, barra lateral y wallpaper' },
  { id: 'prestamos', icon: DollarSign, label: 'Préstamos & Cartera', desc: 'Moneda base, tasas, plazos y QR de cobro' },
  { id: 'egresos', icon: Wallet, label: 'Egresos & Presupuesto', desc: 'Límites mensuales y alertas de suscripción' },
  { id: 'empresa', icon: Building2, label: 'Empresa & Catálogo', desc: 'Datos comerciales, NIT y valorizaciones' },
  { id: 'notificaciones', icon: Bell, label: 'Notificaciones & Alertas', desc: 'Avisos de vencimientos y recordatorios' },
  { id: 'respaldo', icon: Shield, label: 'Seguridad & Respaldo', desc: 'Exportar/importar datos y cuenta Google' },
];

const ACCENT_COLORS = [
  { name: 'Sovereign Gold', hex: '#fbbf24' },
  { name: 'Pure White', hex: '#ffffff' },
  { name: 'Cyber Blue', hex: '#0ea5e9' },
  { name: 'Crimson Red', hex: '#ef4444' },
  { name: 'Emerald Finance', hex: '#10b981' },
  { name: 'Neon Purple', hex: '#a855f7' },
  { name: 'Sunset Orange', hex: '#f97316' },
  { name: 'Steel Gray', hex: '#969696' },
  { name: 'Pink Bloom', hex: '#ec4899' },
  { name: 'Indigo Deep', hex: '#6366f1' },
  { name: 'Teal Wave', hex: '#14b8a6' },
  { name: 'Amber Glow', hex: '#d97706' },
];

const MODOS_FONDO = [
  { id: 'darkGray', label: 'Gris Oscuro', color: '#141414' },
  { id: 'black', label: 'Negro OLED', color: '#000000' },
  { id: 'lightGray', label: 'Gris Carbón', color: '#242428' },
];

const DENSIDADES = [
  { id: 'compact', label: 'Compacto', desc: 'Mayor información' },
  { id: 'normal', label: 'Normal', desc: 'Equilibrio visual' },
  { id: 'comfortable', label: 'Cómodo', desc: 'Espaciado amplio' },
];

export default function Ajustes({ isDark = true, googleUser, onLoginSuccess, onLogout }) {
  const { settings, updateSetting, updateSettings, resetSettings, exportSettings, importSettings } = useSettings();
  const s = settings;
  const t = useMemo(() => getTheme(isDark, s), [isDark, s]);
  
  const [activeSection, setActiveSection] = useState('ia');
  const [showApiKey, setShowApiKey] = useState(false);
  const [testingAi, setTestingAi] = useState(false);
  const [aiTestResult, setAiTestResult] = useState(null);
  const [importStatus, setImportStatus] = useState(null);

  const fileInputRef = useRef(null);
  const qrInputRef = useRef(null);

  // Probar conexión de IA en vivo
  const handleTestAiConnection = async () => {
    setTestingAi(true);
    setAiTestResult(null);
    try {
      const provider = s.aiProvider || 'gemini';
      const key = provider === 'deepseek' ? s.deepseekKey : (provider === 'openrouter' ? s.openrouterKey : s.geminiKey);
      const model = provider === 'deepseek' ? (s.deepseekModel || 'deepseek-chat') : (s.geminiModel || 'gemini-1.5-flash');

      const result = await aiService.testConnection(provider, key, model);
      setAiTestResult(result);
    } catch (err) {
      setAiTestResult({ success: false, message: err.message || 'Error inesperado al probar conexión.' });
    } finally {
      setTestingAi(false);
    }
  };

  // Manejo de fondos y QR
  const handleBgImageUpload = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => updateSetting('backgroundImage', ev.target.result);
    reader.readAsDataURL(file);
  }, [updateSetting]);

  const handleRemoveBg = useCallback(() => {
    updateSetting('backgroundImage', null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [updateSetting]);

  const handleQrUpload = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => updateSetting('loanQrImage', ev.target.result);
    reader.readAsDataURL(file);
  }, [updateSetting]);

  const handleRemoveQr = useCallback(() => {
    updateSetting('loanQrImage', null);
    if (qrInputRef.current) qrInputRef.current.value = '';
  }, [updateSetting]);

  // Exportar / Importar
  const handleExport = useCallback(() => {
    const json = exportSettings();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inefable-config-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [exportSettings]);

  const handleImport = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const ok = importSettings(ev.target.result);
        setImportStatus(ok ? '✅ Configuración restaurada con éxito' : '❌ Archivo JSON no válido');
        setTimeout(() => setImportStatus(null), 3500);
      };
      reader.readAsText(file);
    };
    input.click();
  }, [importSettings]);

  const storageUsed = useMemo(() => {
    try {
      let total = 0;
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          total += localStorage[key].length * 2;
        }
      }
      return (total / 1024 / 1024).toFixed(2);
    } catch {
      return '0.5';
    }
  }, []);

  return (
    <div className="w-full max-w-7xl mx-auto py-4 px-2 sm:px-6 space-y-6 animate-in fade-in duration-300">
      
      {/* ── CABECERA PRINCIPAL EJECUTIVA ─────────────────────────────────── */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-white/[0.06] border border-white/[0.1] text-white">
              <Zap size={18} className="text-amber-400" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white m-0">
              Centro de Configuración & Preferencias
            </h1>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Personaliza la interfaz, motores de IA, parámetros financieros y respaldos de Inefable Cloud
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExport}
            className="btn-action-pill flex items-center gap-1.5 text-xs py-2 px-3.5"
            title="Exportar respaldo de configuración"
          >
            <Download size={13} /> Exportar JSON
          </button>
          <button
            onClick={handleImport}
            className="btn-action-pill flex items-center gap-1.5 text-xs py-2 px-3.5"
            title="Importar respaldo"
          >
            <Upload size={13} /> Importar JSON
          </button>
        </div>
      </header>

      {importStatus && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold animate-in fade-in">
          {importStatus}
        </div>
      )}

      {/* ── GRID PRINCIPAL: NAVEGACIÓN + CONTENIDO ───────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* NAVEGADOR DE SECCIONES LATERAL */}
        <aside className="lg:col-span-4 space-y-1.5 bg-white/[0.02] border border-white/[0.06] p-3 rounded-2xl">
          <span className="text-[9px] font-black uppercase tracking-widest text-neutral-500 px-3 py-1.5 block">
            Módulos del Sistema
          </span>
          {SECCIONES_PROFESIONALES.map(sec => {
            const Icon = sec.icon;
            const isActive = activeSection === sec.id;
            return (
              <button
                key={sec.id}
                onClick={() => setActiveSection(sec.id)}
                className={`w-full text-left p-3 rounded-xl flex items-center justify-between transition-all duration-200 ${
                  isActive
                    ? 'bg-white/[0.08] text-white border border-white/[0.15] shadow-lg shadow-black/20'
                    : 'text-neutral-400 hover:text-white hover:bg-white/[0.03] border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    isActive ? 'bg-amber-400/20 text-amber-300' : 'bg-white/[0.04] text-neutral-400'
                  }`}>
                    <Icon size={16} />
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-bold m-0 leading-tight">{sec.label}</p>
                    <p className="text-[10px] text-neutral-500 m-0 truncate mt-0.5">{sec.desc}</p>
                  </div>
                </div>
                {sec.badge && (
                  <span className="text-[8px] font-black tracking-wider px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    {sec.badge}
                  </span>
                )}
              </button>
            );
          })}

          <div className="pt-4 mt-4 border-t border-white/[0.06] px-3">
            <div className="flex justify-between items-center text-[10px] text-neutral-500">
              <span>Almacenamiento Local:</span>
              <span className="text-neutral-300 font-mono font-bold">{storageUsed} MB</span>
            </div>
            <div className="flex justify-between items-center text-[10px] text-neutral-500 mt-1">
              <span>Versión Cloud:</span>
              <span className="text-neutral-300 font-mono font-bold">1.1.0 Pro</span>
            </div>
          </div>
        </aside>

        {/* PANEL DE DETALLE / CONTENIDO ACTIVO */}
        <main className="lg:col-span-8 space-y-6 bg-white/[0.02] border border-white/[0.06] p-5 sm:p-7 rounded-2xl shadow-2xl">

          {/* ══════════════════════════════════════════════════════════════════
              SECCIÓN 1: INTELIGENCIA ARTIFICIAL (GEMINI / DEEPSEEK)
              ══════════════════════════════════════════════════════════════════ */}
          {activeSection === 'ia' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="pb-4 border-b border-white/[0.06]">
                <h3 className="text-base font-black uppercase tracking-wider text-white flex items-center gap-2 m-0">
                  <Bot size={18} className="text-purple-400" /> Motores de Inteligencia Artificial
                </h3>
                <p className="text-xs text-neutral-400 mt-1">
                  Configura y valida en tiempo real tu conexión con Google Gemini AI Studio o DeepSeek
                </p>
              </div>

              {/* Selector de Proveedor */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 block">
                  Proveedor de IA Activo
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { id: 'gemini', name: 'Google Gemini (AI Studio)', desc: 'Recomendado · Rápido y Estable', color: '#a855f7' },
                    { id: 'deepseek', name: 'DeepSeek AI', desc: 'V3 & Razonamiento R1', color: '#0ea5e9' }
                  ].map(p => {
                    const isSelected = (s.aiProvider || 'gemini') === p.id;
                    return (
                      <div
                        key={p.id}
                        onClick={() => updateSetting('aiProvider', p.id)}
                        className={`p-4 rounded-xl cursor-pointer border transition-all ${
                          isSelected
                            ? 'bg-white/[0.08] border-purple-500/50 shadow-md shadow-purple-500/10'
                            : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white">{p.name}</span>
                          {isSelected && <CheckCircle2 size={16} className="text-purple-400" />}
                        </div>
                        <span className="text-[10px] text-neutral-400 mt-1 block">{p.desc}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Parámetros específicos según proveedor */}
              {s.aiProvider === 'deepseek' ? (
                <div className="space-y-4 p-4 rounded-xl bg-blue-500/[0.03] border border-blue-500/10">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 block mb-1.5">
                      Modelo DeepSeek
                    </label>
                    <select
                      value={s.deepseekModel || 'deepseek-chat'}
                      onChange={e => updateSetting('deepseekModel', e.target.value)}
                      className="w-full text-xs font-semibold"
                    >
                      <option value="deepseek-chat">deepseek-chat (DeepSeek-V3 General)</option>
                      <option value="deepseek-reasoner">deepseek-reasoner (DeepSeek-R1 Razonamiento)</option>
                    </select>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
                        API Key DeepSeek
                      </label>
                      <a
                        href="https://platform.deepseek.com/api_keys"
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-blue-400 hover:underline flex items-center gap-1"
                      >
                        Obtener clave <ExternalLink size={10} />
                      </a>
                    </div>
                    <div className="relative">
                      <input
                        type={showApiKey ? "text" : "password"}
                        value={s.deepseekKey || ''}
                        onChange={e => updateSetting('deepseekKey', e.target.value.trim())}
                        placeholder="sk-..."
                        className="w-full text-xs pr-10 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white"
                      >
                        {showApiKey ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 p-4 rounded-xl bg-purple-500/[0.03] border border-purple-500/10">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 block mb-1.5">
                      Modelo Oficial de Google AI Studio
                    </label>
                    <select
                      value={s.geminiModel || 'gemini-1.5-flash'}
                      onChange={e => updateSetting('geminiModel', e.target.value)}
                      className="w-full text-xs font-semibold"
                    >
                      <option value="gemini-1.5-flash">gemini-1.5-flash (Recomendado · Ultra Rápido & Gratuito)</option>
                      <option value="gemini-2.0-flash">gemini-2.0-flash (Próxima Generación Flash)</option>
                      <option value="gemini-1.5-pro">gemini-1.5-pro (Máxima Capacidad de Razonamiento)</option>
                      <option value="gemini-1.5-flash-8b">gemini-1.5-flash-8b (Ultra Ligero)</option>
                    </select>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
                        API Key de Google AI Studio
                      </label>
                      <a
                        href="https://aistudio.google.com/app/apikey"
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-purple-400 hover:underline flex items-center gap-1"
                      >
                        Generar API Key en Google AI Studio <ExternalLink size={10} />
                      </a>
                    </div>
                    <div className="relative">
                      <input
                        type={showApiKey ? "text" : "password"}
                        value={s.geminiKey || ''}
                        onChange={e => updateSetting('geminiKey', e.target.value.trim())}
                        placeholder="AIzaSy..."
                        className="w-full text-xs pr-10 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white"
                      >
                        {showApiKey ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Botón de Test de Conexión en Tiempo Real */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleTestAiConnection}
                  disabled={testingAi}
                  className="btn-action-pill btn-action-pill-primary w-full py-3 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2"
                >
                  {testingAi ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" /> Verificando conexión con {s.aiProvider === 'deepseek' ? 'DeepSeek' : 'Google AI Studio'}...
                    </>
                  ) : (
                    <>
                      <Sparkles size={14} /> Probar Conexión en Vivo
                    </>
                  )}
                </button>
              </div>

              {/* Resultado del Test */}
              {aiTestResult && (
                <div className={`p-4 rounded-xl border text-xs animate-in zoom-in-95 duration-200 ${
                  aiTestResult.success
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                }`}>
                  <div className="flex items-center gap-2 font-bold mb-1">
                    {aiTestResult.success ? <CheckCircle2 size={16} className="text-emerald-400" /> : <AlertTriangle size={16} className="text-rose-400" />}
                    <span>{aiTestResult.success ? 'Conexión Exitosa' : 'Fallo de Conexión'}</span>
                  </div>
                  <p className="text-[11px] m-0 text-white/90 leading-relaxed">{aiTestResult.message}</p>
                </div>
              )}

              {/* Parámetros Avanzados: Temperatura & Tokens */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-white/[0.06]">
                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-neutral-400 font-bold uppercase text-[9px]">Temperatura Creativa</span>
                    <span className="text-white font-mono">{s.aiTemperature || 0.7}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={s.aiTemperature || 0.7}
                    onChange={e => updateSetting('aiTemperature', parseFloat(e.target.value))}
                    className="w-full accent-purple-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-neutral-400 font-bold uppercase text-[9px]">Límite de Tokens</span>
                    <span className="text-white font-mono">{s.aiMaxTokens || 2048}</span>
                  </div>
                  <input
                    type="range"
                    min="512"
                    max="4096"
                    step="256"
                    value={s.aiMaxTokens || 2048}
                    onChange={e => updateSetting('aiMaxTokens', parseInt(e.target.value))}
                    className="w-full accent-purple-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              SECCIÓN 2: APARIENCIA & TEMA
              ══════════════════════════════════════════════════════════════════ */}
          {activeSection === 'apariencia' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="pb-4 border-b border-white/[0.06]">
                <h3 className="text-base font-black uppercase tracking-wider text-white flex items-center gap-2 m-0">
                  <Palette size={18} className="text-amber-400" /> Apariencia & Personalización Visual
                </h3>
                <p className="text-xs text-neutral-400 mt-1">
                  Ajusta los tonos oscuros, el color de acento corporativo y la densidad visual
                </p>
              </div>

              {/* Tono de Fondo */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 block mb-2">
                  Tono Base de Fondo
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {MODOS_FONDO.map(m => (
                    <button
                      key={m.id}
                      onClick={() => updateSetting('appearanceMode', m.id)}
                      className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                        s.appearanceMode === m.id
                          ? 'border-amber-400 bg-white/[0.06]'
                          : 'border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.04]'
                      }`}
                    >
                      <div className="w-6 h-6 rounded-full border border-white/20" style={{ backgroundColor: m.color }} />
                      <span className="text-xs font-bold text-white">{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Paleta de Color de Acento */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 block mb-2">
                  Color de Acento Principal
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {ACCENT_COLORS.map(c => (
                    <button
                      key={c.hex}
                      onClick={() => updateSetting('accentColor', c.hex)}
                      className={`p-2 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                        s.accentColor === c.hex ? 'border-white bg-white/[0.1]' : 'border-white/[0.06] hover:bg-white/[0.04]'
                      }`}
                    >
                      <div className="w-5 h-5 rounded-lg shadow-sm" style={{ backgroundColor: c.hex }} />
                      <span className="text-[9px] font-semibold text-neutral-300 truncate w-full text-center">{c.name.split(' ')[0]}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Wallpaper Personalizado */}
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <label className="text-xs font-bold text-white block">Wallpaper de Fondo</label>
                    <p className="text-[10px] text-neutral-400 m-0">Aplica un difuminado cinematográfico detrás del contenido</p>
                  </div>
                  <div className="flex gap-2">
                    <label className="btn-action-pill cursor-pointer text-xs py-1.5 px-3">
                      <Upload size={12} /> Subir Imagen
                      <input type="file" accept="image/*" onChange={handleBgImageUpload} ref={fileInputRef} className="hidden" />
                    </label>
                    {s.backgroundImage && (
                      <button onClick={handleRemoveBg} className="btn-action-pill btn-action-pill-danger text-xs py-1.5 px-3">
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                </div>
                {s.backgroundImage && (
                  <div className="h-20 w-full rounded-lg overflow-hidden border border-white/10 relative">
                    <img src={s.backgroundImage} alt="Wallpaper" className="w-full h-full object-cover blur-sm" />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              SECCIÓN 3: PRÉSTAMOS & FINANZAS
              ══════════════════════════════════════════════════════════════════ */}
          {activeSection === 'prestamos' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="pb-4 border-b border-white/[0.06]">
                <h3 className="text-base font-black uppercase tracking-wider text-white flex items-center gap-2 m-0">
                  <DollarSign size={18} className="text-emerald-400" /> Parámetros de Préstamos & Cobranza
                </h3>
                <p className="text-xs text-neutral-400 mt-1">
                  Valores iniciales automáticos al registrar nuevos préstamos y QR de cobro
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 block mb-1.5">
                    Moneda Predeterminada
                  </label>
                  <select
                    value={s.loanDefaultCurrency || 'BOB'}
                    onChange={e => updateSetting('loanDefaultCurrency', e.target.value)}
                    className="w-full text-xs font-semibold"
                  >
                    <option value="BOB">BOB (Bolivianos - Bs)</option>
                    <option value="USD">USD (Dólares Americanos - $)</option>
                    <option value="EUR">EUR (Euros - €)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 block mb-1.5">
                    Tasa de Interés Sugerida (% Mensual)
                  </label>
                  <input
                    type="number"
                    value={s.loanDefaultRate || 10}
                    onChange={e => updateSetting('loanDefaultRate', parseFloat(e.target.value) || 0)}
                    className="w-full text-xs font-bold"
                  />
                </div>
              </div>

              {/* QR de Cobro Bancario */}
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <label className="text-xs font-bold text-white block">Código QR de Cobro Bancario</label>
                    <p className="text-[10px] text-neutral-400 m-0">Se mostrará en los recibos y al cobrar cuotas</p>
                  </div>
                  <div className="flex gap-2">
                    <label className="btn-action-pill cursor-pointer text-xs py-1.5 px-3">
                      <Upload size={12} /> Cargar QR
                      <input type="file" accept="image/*" onChange={handleQrUpload} ref={qrInputRef} className="hidden" />
                    </label>
                    {s.loanQrImage && (
                      <button onClick={handleRemoveQr} className="btn-action-pill btn-action-pill-danger text-xs py-1.5 px-3">
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                </div>
                {s.loanQrImage && (
                  <div className="w-24 h-24 rounded-lg overflow-hidden border border-white/10 p-1 bg-white">
                    <img src={s.loanQrImage} alt="QR de Pago" className="w-full h-full object-contain" />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              SECCIÓN 4: EGRESOS & PRESUPUESTO
              ══════════════════════════════════════════════════════════════════ */}
          {activeSection === 'egresos' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="pb-4 border-b border-white/[0.06]">
                <h3 className="text-base font-black uppercase tracking-wider text-white flex items-center gap-2 m-0">
                  <Wallet size={18} className="text-rose-400" /> Control de Egresos & Suscripciones
                </h3>
                <p className="text-xs text-neutral-400 mt-1">
                  Presupuesto objetivo mensual y días de aviso para renovación
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 block mb-1.5">
                    Presupuesto Mensual Objetivo (BOB)
                  </label>
                  <input
                    type="number"
                    value={s.monthlyBudget || 2500}
                    onChange={e => {
                      const v = parseFloat(e.target.value) || 0;
                      updateSetting('monthlyBudget', v);
                      localStorage.setItem('inefable_monthly_budget', v.toString());
                    }}
                    className="w-full text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 block mb-1.5">
                    Días de Anticipación para Alertas
                  </label>
                  <select
                    value={s.reminderDays || '3'}
                    onChange={e => updateSetting('reminderDays', e.target.value)}
                    className="w-full text-xs font-semibold"
                  >
                    <option value="1">1 día antes</option>
                    <option value="3">3 días antes</option>
                    <option value="5">5 días antes</option>
                    <option value="7">7 días antes</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              SECCIÓN 5: EMPRESA & FACTURACIÓN
              ══════════════════════════════════════════════════════════════════ */}
          {activeSection === 'empresa' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="pb-4 border-b border-white/[0.06]">
                <h3 className="text-base font-black uppercase tracking-wider text-white flex items-center gap-2 m-0">
                  <Building2 size={18} className="text-blue-400" /> Identidad Comercial & Facturación
                </h3>
                <p className="text-xs text-neutral-400 mt-1">
                  Datos que aparecen en reportes, inventarios y comprobantes
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 block mb-1.5">
                    Razón Social / Nombre Comercial
                  </label>
                  <input
                    type="text"
                    value={s.companyName || 'Inefable Corp'}
                    onChange={e => updateSetting('companyName', e.target.value)}
                    className="w-full text-xs"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 block mb-1.5">
                    NIT / Número Tributario
                  </label>
                  <input
                    type="text"
                    value={s.companyNit || ''}
                    onChange={e => updateSetting('companyNit', e.target.value)}
                    placeholder="Ej. 102938475"
                    className="w-full text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              SECCIÓN 6: NOTIFICACIONES
              ══════════════════════════════════════════════════════════════════ */}
          {activeSection === 'notificaciones' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="pb-4 border-b border-white/[0.06]">
                <h3 className="text-base font-black uppercase tracking-wider text-white flex items-center gap-2 m-0">
                  <Bell size={18} className="text-amber-400" /> Centro de Alertas & Notificaciones
                </h3>
                <p className="text-xs text-neutral-400 mt-1">
                  Configuración de notificaciones visuales y sincronización
                </p>
              </div>

              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-white m-0">Alertas de Vencimiento de Préstamos</p>
                    <p className="text-[10px] text-neutral-400 m-0">Notificar cobros pendientes en la barra de menú</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={s.loanNotifications !== false}
                    onChange={e => updateSetting('loanNotifications', e.target.checked)}
                    className="accent-amber-500 w-4 h-4"
                  />
                </div>

                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-white m-0">Alertas de Suscripciones & Servicios</p>
                    <p className="text-[10px] text-neutral-400 m-0">Avisar con anticipación antes de la fecha de débito</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={s.serviceNotifications !== false}
                    onChange={e => updateSetting('serviceNotifications', e.target.checked)}
                    className="accent-amber-500 w-4 h-4"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              SECCIÓN 7: SEGURIDAD & RESPALDO
              ══════════════════════════════════════════════════════════════════ */}
          {activeSection === 'respaldo' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="pb-4 border-b border-white/[0.06]">
                <h3 className="text-base font-black uppercase tracking-wider text-white flex items-center gap-2 m-0">
                  <Shield size={18} className="text-emerald-400" /> Seguridad, Cuenta & Respaldo
                </h3>
                <p className="text-xs text-neutral-400 mt-1">
                  Administración de sesiones, exportación completa y restauración de fábrica
                </p>
              </div>

              {/* Cuenta de Google */}
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center overflow-hidden border border-white/20">
                    {googleUser?.picture ? (
                      <img src={googleUser.picture} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <Globe size={18} className="text-neutral-400" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white m-0">{googleUser?.name || 'Usuario Inefable'}</p>
                    <p className="text-[10px] text-neutral-400 m-0">{googleUser?.email || 'Google Workspace Conectado'}</p>
                  </div>
                </div>
                {onLogout && (
                  <button onClick={onLogout} className="btn-action-pill btn-action-pill-danger text-xs py-1.5 px-3">
                    <LogOut size={12} /> Cerrar Sesión
                  </button>
                )}
              </div>

              {/* Restauración de Fábrica */}
              <div className="p-4 rounded-xl bg-rose-500/[0.03] border border-rose-500/20 space-y-2">
                <div className="flex items-center gap-2 text-rose-400 font-bold text-xs">
                  <AlertTriangle size={15} /> Zona de Peligro: Restablecer Preferencias
                </div>
                <p className="text-[10px] text-neutral-400 m-0">
                  Regresa todos los colores, claves y configuraciones a los valores predeterminados de fábrica.
                </p>
                <button
                  onClick={() => {
                    if (window.confirm("¿Seguro que deseas restablecer todas las preferencias del panel?")) {
                      resetSettings();
                    }
                  }}
                  className="btn-action-pill btn-action-pill-danger text-xs py-2 px-3.5 mt-2"
                >
                  <RotateCcw size={12} /> Restablecer Configuración
                </button>
              </div>
            </div>
          )}

        </main>
      </div>

    </div>
  );
}