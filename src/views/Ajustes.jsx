import React, { useState, useMemo, useRef, useCallback } from 'react';
import {
  Palette, Monitor, Smartphone, Sun, Moon, Eye, EyeOff,
  DollarSign, Bell, Shield, Download, Upload, Trash2,
  RefreshCw, Zap, Cpu, Building2, Wallet, Check, X,
  CheckCircle2, AlertTriangle, Globe, LogOut, RotateCcw,
  Sparkles, Bot, ExternalLink, Sliders, HardDrive, SmartphoneCharging
} from 'lucide-react';
import { useSettings } from '../lib/settingsStore';
import { getTheme, useTheme } from '../lib/theme';
import { aiService } from '../services/aiService';

const SECCIONES_PROFESIONALES = [
  { id: 'ia', icon: Cpu, label: 'Inteligencia Artificial', desc: 'Google Gemini, DeepSeek y prueba de API en vivo', badge: 'PRO' },
  { id: 'apariencia', icon: Palette, label: 'Pantalla & Apariencia', desc: 'Smartphone vs Escritorio, tonos grises y tema' },
  { id: 'prestamos', icon: DollarSign, label: 'Préstamos & Cartera', desc: 'Moneda base, tasas, plazos y QR de cobro' },
  { id: 'egresos', icon: Wallet, label: 'Egresos & Presupuesto', desc: 'Límites mensuales y alertas de suscripción' },
  { id: 'empresa', icon: Building2, label: 'Empresa & Catálogo', desc: 'Datos comerciales, NIT y valorizaciones' },
  { id: 'notificaciones', icon: Bell, label: 'Notificaciones & Alertas', desc: 'Avisos de vencimientos y recordatorios' },
  { id: 'respaldo', icon: Shield, label: 'Seguridad & Respaldo', desc: 'Exportar/importar datos y cuenta Google' },
];

const ACCENT_COLORS = [
  { name: 'Titanio', hex: '#A1A1AA' },
  { name: 'Platino', hex: '#E4E4E7' },
  { name: 'Grafito', hex: '#71717A' },
  { name: 'Acero', hex: '#52525B' },
  { name: 'Blanco Puro', hex: '#FFFFFF' },
  { name: 'Carbón', hex: '#27272A' },
  { name: 'Oro Neutro', hex: '#D4AF37' },
  { name: 'Zafiro Frío', hex: '#38BDF8' },
];

const MODOS_FONDO = [
  { id: 'darkGray', label: 'Gris Oscuro', desc: '#1A1A1C Grafito', color: '#1A1A1C' },
  { id: 'black', label: 'Negro OLED', desc: '#121214 Profundo', color: '#121214' },
  { id: 'lightGray', label: 'Gris Carbón', desc: '#222225 Neutro', color: '#222225' },
];

export default function Ajustes({ isDark = true, setIsDark, googleUser, onLoginSuccess, onLogout }) {
  const { settings, updateSetting, updateSettings, resetSettings, exportSettings, importSettings } = useSettings();
  const s = settings;
  const t = useMemo(() => getTheme(isDark, s), [isDark, s]);

  const [activeSection, setActiveSection] = useState('ia');
  const [showApiKey, setShowApiKey] = useState(false);
  const [testingAi, setTestingAi] = useState(false);
  const [aiTestResult, setAiTestResult] = useState(null);
  const [importStatus, setImportStatus] = useState(null);
  const [savedBadge, setSavedBadge] = useState(false);

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
    reader.onload = (ev) => {
      updateSetting('backgroundImage', ev.target.result);
      triggerSaveNotice();
    };
    reader.readAsDataURL(file);
  }, [updateSetting]);

  const handleRemoveBg = useCallback(() => {
    updateSetting('backgroundImage', null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    triggerSaveNotice();
  }, [updateSetting]);

  const handleQrUpload = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      updateSetting('loanQrImage', ev.target.result);
      triggerSaveNotice();
    };
    reader.readAsDataURL(file);
  }, [updateSetting]);

  const handleRemoveQr = useCallback(() => {
    updateSetting('loanQrImage', null);
    if (qrInputRef.current) qrInputRef.current.value = '';
    triggerSaveNotice();
  }, [updateSetting]);

  const triggerSaveNotice = () => {
    setSavedBadge(true);
    setTimeout(() => setSavedBadge(false), 2000);
  };

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
        setImportStatus(ok ? 'Configuración restaurada con éxito' : 'Archivo JSON no válido');
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
        if (Object.prototype.hasOwnProperty.call(localStorage, key)) {
          total += localStorage[key].length * 2;
        }
      }
      return (total / 1024 / 1024).toFixed(2);
    } catch {
      return '0.50';
    }
  }, []);

  const inputStyle = {
    backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
    borderColor: t.borderLight || t.border,
    color: t.text,
  };

  const cardStyle = {
    backgroundColor: t.panel,
    borderColor: t.borderLight || t.border,
  };

  const subCardStyle = {
    backgroundColor: isDark ? '#1F1F22' : '#F9FAFB',
    borderColor: t.borderLight || t.border,
  };

  return (
    <div className="w-full max-w-7xl mx-auto py-5 px-3 sm:px-6 space-y-6">
      
      {/* ── CABECERA PRINCIPAL EJECUTIVA ─────────────────────────────────── */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b" style={{ borderColor: t.border }}>
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border"
            style={{
              backgroundColor: isDark ? '#232326' : '#F3F4F6',
              borderColor: t.borderLight || t.border,
              color: t.text,
            }}
          >
            <Sliders size={18} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight m-0" style={{ color: t.text }}>
              Configuración & Sistema
            </h1>
            <p className="text-xs mt-0.5 m-0" style={{ color: t.textMuted }}>
              Personaliza la interfaz, motores de IA, parámetros financieros y respaldos
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {savedBadge && (
            <span
              className="text-[11px] font-medium px-2.5 py-1.5 rounded-xl border flex items-center gap-1.5 animate-in fade-in"
              style={{
                backgroundColor: isDark ? '#232326' : '#FFFFFF',
                borderColor: t.borderLight || t.border,
                color: t.text,
              }}
            >
              <Check size={12} /> Guardado
            </span>
          )}
          <button
            type="button"
            onClick={handleExport}
            className="flex items-center gap-1.5 text-xs py-2 px-3.5 rounded-xl border font-medium transition-opacity hover:opacity-80"
            style={{
              backgroundColor: isDark ? '#232326' : '#FFFFFF',
              borderColor: t.borderLight || t.border,
              color: t.text,
            }}
            title="Exportar archivo de configuración en formato JSON"
          >
            <Download size={13} /> Exportar JSON
          </button>
          <button
            type="button"
            onClick={handleImport}
            className="flex items-center gap-1.5 text-xs py-2 px-3.5 rounded-xl border font-medium transition-opacity hover:opacity-80"
            style={{
              backgroundColor: isDark ? '#232326' : '#FFFFFF',
              borderColor: t.borderLight || t.border,
              color: t.text,
            }}
            title="Restaurar configuración desde un archivo JSON"
          >
            <Upload size={13} /> Importar JSON
          </button>
        </div>
      </header>

      {importStatus && (
        <div
          className="p-3.5 rounded-2xl border text-xs font-semibold flex items-center gap-2 animate-in fade-in"
          style={{
            backgroundColor: isDark ? '#1F2421' : '#ECFDF5',
            borderColor: isDark ? '#2D3A31' : '#A7F3D0',
            color: isDark ? '#D1FAE5' : '#065F46',
          }}
        >
          <CheckCircle2 size={16} />
          {importStatus}
        </div>
      )}

      {/* ── NAVEGACIÓN MÓVIL: PÍLDORAS HORIZONTALES (SMARTPHONE) ─────────── */}
      <div className="lg:hidden -mx-3 px-3 overflow-x-auto no-scrollbar flex items-center gap-1.5 pb-1">
        {SECCIONES_PROFESIONALES.map(sec => {
          const Icon = sec.icon;
          const isActive = activeSection === sec.id;
          return (
            <button
              key={sec.id}
              type="button"
              onClick={() => setActiveSection(sec.id)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium shrink-0 transition-all border"
              style={{
                backgroundColor: isActive
                  ? (isDark ? '#ECECEC' : '#1C1C1E')
                  : (isDark ? '#232326' : '#FFFFFF'),
                borderColor: isActive
                  ? (isDark ? '#ECECEC' : '#1C1C1E')
                  : (t.borderLight || t.border),
                color: isActive
                  ? (isDark ? '#1C1C1E' : '#FFFFFF')
                  : t.text,
              }}
            >
              <Icon size={14} />
              <span>{sec.label.split(' ')[0]}</span>
            </button>
          );
        })}
      </div>

      {/* ── GRID PRINCIPAL: LATERAL ESCRITORIO + CONTENIDO ACTIVO ────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* NAVEGADOR DE SECCIONES LATERAL (ESCRITORIO) */}
        <aside 
          className="hidden lg:block lg:col-span-4 space-y-1.5 p-3 rounded-2xl border"
          style={cardStyle}
        >
          <span className="text-[9px] font-bold uppercase tracking-widest px-3 py-1.5 block" style={{ color: t.textMuted }}>
            Módulos del Sistema
          </span>
          {SECCIONES_PROFESIONALES.map(sec => {
            const Icon = sec.icon;
            const isActive = activeSection === sec.id;
            return (
              <button
                key={sec.id}
                type="button"
                onClick={() => setActiveSection(sec.id)}
                className="w-full text-left p-3 rounded-xl flex items-center justify-between transition-all border"
                style={{
                  backgroundColor: isActive
                    ? (isDark ? '#2C2C30' : '#EAEAEB')
                    : 'transparent',
                  borderColor: isActive
                    ? (isDark ? '#3D3D42' : '#D4D4D8')
                    : 'transparent',
                  color: t.text,
                }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div 
                    className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border"
                    style={{
                      backgroundColor: isActive
                        ? (isDark ? '#38383E' : '#DCDCE0')
                        : (isDark ? '#1C1C1E' : '#F3F4F6'),
                      borderColor: t.borderLight || t.border,
                      color: t.text,
                    }}
                  >
                    <Icon size={15} />
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-semibold m-0 leading-tight" style={{ color: t.text }}>
                      {sec.label}
                    </p>
                    <p className="text-[10px] m-0 truncate mt-0.5" style={{ color: t.textMuted }}>
                      {sec.desc}
                    </p>
                  </div>
                </div>
                {sec.badge && (
                  <span
                    className="text-[8px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded border"
                    style={{
                      backgroundColor: isDark ? '#1C1C1E' : '#F3F4F6',
                      borderColor: t.borderLight || t.border,
                      color: t.textMuted,
                    }}
                  >
                    {sec.badge}
                  </span>
                )}
              </button>
            );
          })}

          <div className="pt-4 mt-4 border-t px-3 space-y-1.5" style={{ borderColor: t.borderLight || t.border }}>
            <div className="flex justify-between items-center text-[10px]" style={{ color: t.textMuted }}>
              <span className="flex items-center gap-1.5">
                <HardDrive size={11} /> Almacenamiento Local
              </span>
              <span className="font-mono font-semibold" style={{ color: t.text }}>{storageUsed} MB</span>
            </div>
            <div className="flex justify-between items-center text-[10px]" style={{ color: t.textMuted }}>
              <span className="flex items-center gap-1.5">
                <Shield size={11} /> Versión Cloud
              </span>
              <span className="font-mono font-semibold" style={{ color: t.text }}>1.1.0 Pro</span>
            </div>
          </div>
        </aside>

        {/* PANEL DE DETALLE / CONTENIDO ACTIVO */}
        <main 
          className="lg:col-span-8 space-y-6 p-5 sm:p-7 rounded-2xl border"
          style={cardStyle}
        >

          {/* ══════════════════════════════════════════════════════════════════
              SECCIÓN 1: INTELIGENCIA ARTIFICIAL (GEMINI / DEEPSEEK)
              ══════════════════════════════════════════════════════════════════ */}
          {activeSection === 'ia' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="pb-4 border-b" style={{ borderColor: t.borderLight || t.border }}>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center border" style={{ backgroundColor: isDark ? '#1C1C1E' : '#F3F4F6', borderColor: t.borderLight || t.border, color: t.text }}>
                    <Bot size={15} />
                  </div>
                  <h3 className="text-sm font-bold tracking-tight m-0" style={{ color: t.text }}>
                    Motores de Inteligencia Artificial
                  </h3>
                </div>
                <p className="text-xs mt-1 m-0" style={{ color: t.textMuted }}>
                  Configura y valida en tiempo real tu conexión con Google Gemini AI Studio o DeepSeek
                </p>
              </div>

              {/* Selector de Proveedor */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest block" style={{ color: t.textMuted }}>
                  Proveedor de IA Activo
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { id: 'gemini', name: 'Google Gemini (AI Studio)', desc: 'Recomendado · Alto rendimiento y baja latencia' },
                    { id: 'deepseek', name: 'DeepSeek AI', desc: 'Modelos V3 y Razonamiento R1' }
                  ].map(p => {
                    const isSelected = (s.aiProvider || 'gemini') === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          updateSetting('aiProvider', p.id);
                          triggerSaveNotice();
                        }}
                        className="p-4 rounded-xl text-left border transition-all"
                        style={{
                          backgroundColor: isSelected
                            ? (isDark ? '#2C2C30' : '#EAEAEB')
                            : (isDark ? '#1C1C1E' : '#FFFFFF'),
                          borderColor: isSelected
                            ? (isDark ? '#ECECEC' : '#1C1C1E')
                            : (t.borderLight || t.border),
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold" style={{ color: t.text }}>{p.name}</span>
                          {isSelected && <Check size={14} style={{ color: t.text }} />}
                        </div>
                        <span className="text-[10px] mt-1 block" style={{ color: t.textMuted }}>{p.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Parámetros específicos según proveedor */}
              {s.aiProvider === 'deepseek' ? (
                <div className="space-y-4 p-4 rounded-xl border" style={subCardStyle}>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest block mb-1.5" style={{ color: t.textMuted }}>
                      Modelo DeepSeek
                    </label>
                    <select
                      value={s.deepseekModel || 'deepseek-chat'}
                      onChange={e => {
                        updateSetting('deepseekModel', e.target.value);
                        triggerSaveNotice();
                      }}
                      className="w-full text-xs font-medium rounded-xl border p-2.5 outline-none"
                      style={inputStyle}
                    >
                      <option value="deepseek-chat">deepseek-chat (DeepSeek-V3 General)</option>
                      <option value="deepseek-reasoner">deepseek-reasoner (DeepSeek-R1 Razonamiento)</option>
                    </select>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-widest" style={{ color: t.textMuted }}>
                        API Key DeepSeek
                      </label>
                      <a
                        href="https://platform.deepseek.com/api_keys"
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] font-medium hover:underline flex items-center gap-1"
                        style={{ color: t.text }}
                      >
                        Obtener clave <ExternalLink size={10} />
                      </a>
                    </div>
                    <div className="relative">
                      <input
                        type={showApiKey ? 'text' : 'password'}
                        value={s.deepseekKey || ''}
                        onChange={e => updateSetting('deepseekKey', e.target.value.trim())}
                        onBlur={triggerSaveNotice}
                        placeholder="sk-..."
                        className="w-full text-xs pr-10 font-mono rounded-xl border p-2.5 outline-none"
                        style={inputStyle}
                      />
                      <button
                        type="button"
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-80"
                        style={{ color: t.textMuted }}
                      >
                        {showApiKey ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 p-4 rounded-xl border" style={subCardStyle}>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest block mb-1.5" style={{ color: t.textMuted }}>
                      Modelo Oficial de Google AI Studio
                    </label>
                    <select
                      value={s.geminiModel || 'gemini-1.5-flash'}
                      onChange={e => {
                        updateSetting('geminiModel', e.target.value);
                        triggerSaveNotice();
                      }}
                      className="w-full text-xs font-medium rounded-xl border p-2.5 outline-none"
                      style={inputStyle}
                    >
                      <option value="gemini-1.5-flash">gemini-1.5-flash (Recomendado · Rápido y Estable)</option>
                      <option value="gemini-2.0-flash">gemini-2.0-flash (Próxima Generación Flash)</option>
                      <option value="gemini-1.5-pro">gemini-1.5-pro (Máxima Capacidad de Razonamiento)</option>
                      <option value="gemini-1.5-flash-8b">gemini-1.5-flash-8b (Ultra Ligero)</option>
                    </select>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-widest" style={{ color: t.textMuted }}>
                        API Key de Google AI Studio
                      </label>
                      <a
                        href="https://aistudio.google.com/app/apikey"
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] font-medium hover:underline flex items-center gap-1"
                        style={{ color: t.text }}
                      >
                        Generar API Key en Google AI Studio <ExternalLink size={10} />
                      </a>
                    </div>
                    <div className="relative">
                      <input
                        type={showApiKey ? 'text' : 'password'}
                        value={s.geminiKey || ''}
                        onChange={e => updateSetting('geminiKey', e.target.value.trim())}
                        onBlur={triggerSaveNotice}
                        placeholder="AIzaSy..."
                        className="w-full text-xs pr-10 font-mono rounded-xl border p-2.5 outline-none"
                        style={inputStyle}
                      />
                      <button
                        type="button"
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-80"
                        style={{ color: t.textMuted }}
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
                  className="w-full py-3 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
                  style={{
                    backgroundColor: isDark ? '#ECECEC' : '#1C1C1E',
                    color: isDark ? '#1C1C1E' : '#FFFFFF',
                  }}
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
                <div
                  className="p-4 rounded-xl border text-xs animate-in zoom-in-95 duration-200"
                  style={{
                    backgroundColor: aiTestResult.success
                      ? (isDark ? 'rgba(16,185,129,0.06)' : '#ECFDF5')
                      : (isDark ? 'rgba(239,68,68,0.06)' : '#FEF2F2'),
                    borderColor: aiTestResult.success
                      ? (isDark ? 'rgba(16,185,129,0.2)' : '#A7F3D0')
                      : (isDark ? 'rgba(239,68,68,0.2)' : '#FECACA'),
                    color: aiTestResult.success
                      ? (isDark ? '#A7F3D0' : '#065F46')
                      : (isDark ? '#FECACA' : '#991B1B'),
                  }}
                >
                  <div className="flex items-center gap-2 font-bold mb-1">
                    {aiTestResult.success ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                    <span>{aiTestResult.success ? 'Conexión Exitosa' : 'Fallo de Conexión'}</span>
                  </div>
                  <p className="text-[11px] m-0 leading-relaxed opacity-90">{aiTestResult.message}</p>
                </div>
              )}

              {/* Parámetros Avanzados: Temperatura & Tokens */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t" style={{ borderColor: t.borderLight || t.border }}>
                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="font-bold uppercase text-[9px]" style={{ color: t.textMuted }}>Temperatura Creativa</span>
                    <span className="font-mono text-xs font-semibold" style={{ color: t.text }}>{s.aiTemperature ?? 0.7}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={s.aiTemperature ?? 0.7}
                    onChange={e => updateSetting('aiTemperature', parseFloat(e.target.value))}
                    className="w-full accent-neutral-400"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="font-bold uppercase text-[9px]" style={{ color: t.textMuted }}>Límite de Tokens</span>
                    <span className="font-mono text-xs font-semibold" style={{ color: t.text }}>{s.aiMaxTokens ?? 2048}</span>
                  </div>
                  <input
                    type="range"
                    min="512"
                    max="4096"
                    step="256"
                    value={s.aiMaxTokens ?? 2048}
                    onChange={e => updateSetting('aiMaxTokens', parseInt(e.target.value, 10))}
                    className="w-full accent-neutral-400"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              SECCIÓN 2: PANTALLA & APARIENCIA
              ══════════════════════════════════════════════════════════════════ */}
          {activeSection === 'apariencia' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="pb-4 border-b" style={{ borderColor: t.borderLight || t.border }}>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center border" style={{ backgroundColor: isDark ? '#1C1C1E' : '#F3F4F6', borderColor: t.borderLight || t.border, color: t.text }}>
                    <Palette size={15} />
                  </div>
                  <h3 className="text-sm font-bold tracking-tight m-0" style={{ color: t.text }}>
                    Pantalla, Dispositivo & Apariencia
                  </h3>
                </div>
                <p className="text-xs mt-1 m-0" style={{ color: t.textMuted }}>
                  Ajusta el modo de visualización (Smartphone vs Escritorio), el tema Día/Noche y la escala de grises
                </p>
              </div>

              {/* ── CONMUTADOR TEMA DÍA / NOCHE ── */}
              <div className="p-4 rounded-xl border space-y-3" style={subCardStyle}>
                <div>
                  <label className="text-xs font-bold block" style={{ color: t.text }}>
                    Tema Visual del Entorno
                  </label>
                  <p className="text-[11px] m-0 mt-0.5" style={{ color: t.textMuted }}>
                    Alterna entre la atmósfera oscura cinematográfica y la versión clara de alto contraste
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      if (setIsDark) setIsDark(true);
                      triggerSaveNotice();
                    }}
                    className="p-3.5 rounded-xl border flex items-center justify-between transition-all"
                    style={{
                      backgroundColor: isDark ? (isDark ? '#2C2C30' : '#EAEAEB') : 'transparent',
                      borderColor: isDark ? (isDark ? '#ECECEC' : '#1C1C1E') : (t.borderLight || t.border),
                    }}
                  >
                    <div className="flex items-center gap-2.5">
                      <Moon size={16} style={{ color: t.text }} />
                      <div className="text-left">
                        <span className="text-xs font-bold block" style={{ color: t.text }}>Modo Noche</span>
                        <span className="text-[10px] block" style={{ color: t.textMuted }}>Gris oscuro cinematográfico</span>
                      </div>
                    </div>
                    {isDark && <Check size={14} style={{ color: t.text }} />}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (setIsDark) setIsDark(false);
                      triggerSaveNotice();
                    }}
                    className="p-3.5 rounded-xl border flex items-center justify-between transition-all"
                    style={{
                      backgroundColor: !isDark ? (isDark ? '#2C2C30' : '#EAEAEB') : 'transparent',
                      borderColor: !isDark ? (isDark ? '#ECECEC' : '#1C1C1E') : (t.borderLight || t.border),
                    }}
                  >
                    <div className="flex items-center gap-2.5">
                      <Sun size={16} style={{ color: t.text }} />
                      <div className="text-left">
                        <span className="text-xs font-bold block" style={{ color: t.text }}>Modo Día</span>
                        <span className="text-[10px] block" style={{ color: t.textMuted }}>Gris perla y blanco puro</span>
                      </div>
                    </div>
                    {!isDark && <Check size={14} style={{ color: t.text }} />}
                  </button>
                </div>
              </div>

              {/* ── MODO DE DISPOSITIVO / PANTALLA ── */}
              <div className="p-4 rounded-xl border space-y-3" style={subCardStyle}>
                <div>
                  <label className="text-xs font-bold block" style={{ color: t.text }}>
                    Modo de Dispositivo & Navegación
                  </label>
                  <p className="text-[11px] m-0 mt-0.5" style={{ color: t.textMuted }}>
                    Optimiza la disposición de controles para teléfonos inteligentes o monitores de escritorio
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* Opción 1: Auto */}
                  <button
                    type="button"
                    onClick={() => {
                      updateSettings({
                        mobileModeSource: 'auto',
                        isMobileMode: typeof window !== 'undefined' ? window.innerWidth < 768 : false
                      });
                      triggerSaveNotice();
                    }}
                    className="p-3 rounded-xl border text-left flex flex-col justify-between transition-all"
                    style={{
                      backgroundColor: s.mobileModeSource === 'auto' ? (isDark ? '#2C2C30' : '#EAEAEB') : 'transparent',
                      borderColor: s.mobileModeSource === 'auto' ? (isDark ? '#ECECEC' : '#1C1C1E') : (t.borderLight || t.border),
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <SmartphoneCharging size={16} style={{ color: t.text }} />
                      {s.mobileModeSource === 'auto' && <Check size={14} style={{ color: t.text }} />}
                    </div>
                    <div>
                      <span className="text-xs font-bold block" style={{ color: t.text }}>Automático</span>
                      <span className="text-[10px] block mt-0.5" style={{ color: t.textMuted }}>Adapta según resolución</span>
                    </div>
                  </button>

                  {/* Opción 2: Smartphone */}
                  <button
                    type="button"
                    onClick={() => {
                      updateSettings({ mobileModeSource: 'manual', isMobileMode: true });
                      triggerSaveNotice();
                    }}
                    className="p-3 rounded-xl border text-left flex flex-col justify-between transition-all"
                    style={{
                      backgroundColor: (s.mobileModeSource === 'manual' && s.isMobileMode) ? (isDark ? '#2C2C30' : '#EAEAEB') : 'transparent',
                      borderColor: (s.mobileModeSource === 'manual' && s.isMobileMode) ? (isDark ? '#ECECEC' : '#1C1C1E') : (t.borderLight || t.border),
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Smartphone size={16} style={{ color: t.text }} />
                      {s.mobileModeSource === 'manual' && s.isMobileMode && <Check size={14} style={{ color: t.text }} />}
                    </div>
                    <div>
                      <span className="text-xs font-bold block" style={{ color: t.text }}>Smartphone</span>
                      <span className="text-[10px] block mt-0.5" style={{ color: t.textMuted }}>Barra inferior fija de 64px</span>
                    </div>
                  </button>

                  {/* Opción 3: Escritorio */}
                  <button
                    type="button"
                    onClick={() => {
                      updateSettings({ mobileModeSource: 'manual', isMobileMode: false });
                      triggerSaveNotice();
                    }}
                    className="p-3 rounded-xl border text-left flex flex-col justify-between transition-all"
                    style={{
                      backgroundColor: (s.mobileModeSource === 'manual' && !s.isMobileMode) ? (isDark ? '#2C2C30' : '#EAEAEB') : 'transparent',
                      borderColor: (s.mobileModeSource === 'manual' && !s.isMobileMode) ? (isDark ? '#ECECEC' : '#1C1C1E') : (t.borderLight || t.border),
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Monitor size={16} style={{ color: t.text }} />
                      {s.mobileModeSource === 'manual' && !s.isMobileMode && <Check size={14} style={{ color: t.text }} />}
                    </div>
                    <div>
                      <span className="text-xs font-bold block" style={{ color: t.text }}>Escritorio</span>
                      <span className="text-[10px] block mt-0.5" style={{ color: t.textMuted }}>Barra lateral fija de 64px</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Tono Base de Fondo */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest block mb-2" style={{ color: t.textMuted }}>
                  Tono Base de Fondo (Modo Noche)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {MODOS_FONDO.map(m => {
                    const isSelected = (s.appearanceMode || 'darkGray') === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          updateSetting('appearanceMode', m.id);
                          triggerSaveNotice();
                        }}
                        className="p-3 rounded-xl border flex items-center gap-3 transition-all"
                        style={{
                          backgroundColor: isSelected ? (isDark ? '#2C2C30' : '#EAEAEB') : 'transparent',
                          borderColor: isSelected ? (isDark ? '#ECECEC' : '#1C1C1E') : (t.borderLight || t.border),
                        }}
                      >
                        <div className="w-5 h-5 rounded-full border border-white/20 shrink-0" style={{ backgroundColor: m.color }} />
                        <div className="text-left">
                          <span className="text-xs font-bold block" style={{ color: t.text }}>{m.label}</span>
                          <span className="text-[10px] block" style={{ color: t.textMuted }}>{m.desc}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Paleta de Color de Acento Refinado */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest block mb-2" style={{ color: t.textMuted }}>
                  Acento Visual Refinado
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {ACCENT_COLORS.map(c => {
                    const isSelected = s.accentColor === c.hex;
                    return (
                      <button
                        key={c.hex}
                        type="button"
                        onClick={() => {
                          updateSetting('accentColor', c.hex);
                          triggerSaveNotice();
                        }}
                        className="p-2.5 rounded-xl border flex items-center gap-2.5 transition-all"
                        style={{
                          backgroundColor: isSelected ? (isDark ? '#2C2C30' : '#EAEAEB') : 'transparent',
                          borderColor: isSelected ? (isDark ? '#ECECEC' : '#1C1C1E') : (t.borderLight || t.border),
                        }}
                      >
                        <div className="w-4 h-4 rounded-md border border-black/10 shrink-0 shadow-sm" style={{ backgroundColor: c.hex }} />
                        <span className="text-xs font-medium truncate" style={{ color: t.text }}>{c.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Wallpaper Personalizado */}
              <div className="p-4 rounded-xl border space-y-3" style={subCardStyle}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <label className="text-xs font-bold block" style={{ color: t.text }}>Wallpaper Cinematográfico</label>
                    <p className="text-[10px] m-0" style={{ color: t.textMuted }}>Aplica un difuminado sutil detrás del contenido de la plataforma</p>
                  </div>
                  <div className="flex gap-2">
                    <label
                      className="cursor-pointer text-xs py-2 px-3.5 rounded-xl border font-medium flex items-center gap-1.5 transition-opacity hover:opacity-80"
                      style={{
                        backgroundColor: isDark ? '#232326' : '#FFFFFF',
                        borderColor: t.borderLight || t.border,
                        color: t.text,
                      }}
                    >
                      <Upload size={12} /> Subir Imagen
                      <input type="file" accept="image/*" onChange={handleBgImageUpload} ref={fileInputRef} className="hidden" />
                    </label>
                    {s.backgroundImage && (
                      <button
                        type="button"
                        onClick={handleRemoveBg}
                        className="text-xs py-2 px-3 rounded-xl border font-medium transition-opacity hover:opacity-80"
                        style={{
                          backgroundColor: isDark ? '#232326' : '#FFFFFF',
                          borderColor: t.borderLight || t.border,
                          color: '#EF4444',
                        }}
                        title="Eliminar imagen"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                </div>
                {s.backgroundImage && (
                  <div className="h-20 w-full rounded-xl overflow-hidden border relative" style={{ borderColor: t.borderLight || t.border }}>
                    <img src={s.backgroundImage} alt="Wallpaper" className="w-full h-full object-cover blur-sm opacity-60" />
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
              <div className="pb-4 border-b" style={{ borderColor: t.borderLight || t.border }}>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center border" style={{ backgroundColor: isDark ? '#1C1C1E' : '#F3F4F6', borderColor: t.borderLight || t.border, color: t.text }}>
                    <DollarSign size={15} />
                  </div>
                  <h3 className="text-sm font-bold tracking-tight m-0" style={{ color: t.text }}>
                    Parámetros de Préstamos & Cobranza
                  </h3>
                </div>
                <p className="text-xs mt-1 m-0" style={{ color: t.textMuted }}>
                  Valores iniciales automáticos al registrar nuevos contratos y código QR de cobro bancario
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest block mb-1.5" style={{ color: t.textMuted }}>
                    Moneda Predeterminada
                  </label>
                  <select
                    value={s.loanDefaultCurrency || 'BOB'}
                    onChange={e => {
                      updateSetting('loanDefaultCurrency', e.target.value);
                      triggerSaveNotice();
                    }}
                    className="w-full text-xs font-medium rounded-xl border p-2.5 outline-none"
                    style={inputStyle}
                  >
                    <option value="BOB">BOB (Bolivianos - Bs)</option>
                    <option value="USD">USD (Dólares Americanos - $)</option>
                    <option value="EUR">EUR (Euros - €)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest block mb-1.5" style={{ color: t.textMuted }}>
                    Tasa de Interés Sugerida (% Mensual)
                  </label>
                  <input
                    type="number"
                    value={s.loanDefaultRate ?? 10}
                    onChange={e => updateSetting('loanDefaultRate', parseFloat(e.target.value) || 0)}
                    onBlur={triggerSaveNotice}
                    className="w-full text-xs font-mono font-bold rounded-xl border p-2.5 outline-none"
                    style={inputStyle}
                  />
                </div>
              </div>

              {/* QR de Cobro Bancario */}
              <div className="p-4 rounded-xl border space-y-3" style={subCardStyle}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <label className="text-xs font-bold block" style={{ color: t.text }}>Código QR de Cobro Bancario</label>
                    <p className="text-[10px] m-0" style={{ color: t.textMuted }}>Se incrustará en los comprobantes y en los registros de amortización</p>
                  </div>
                  <div className="flex gap-2">
                    <label
                      className="cursor-pointer text-xs py-2 px-3.5 rounded-xl border font-medium flex items-center gap-1.5 transition-opacity hover:opacity-80"
                      style={{
                        backgroundColor: isDark ? '#232326' : '#FFFFFF',
                        borderColor: t.borderLight || t.border,
                        color: t.text,
                      }}
                    >
                      <Upload size={12} /> Cargar QR
                      <input type="file" accept="image/*" onChange={handleQrUpload} ref={qrInputRef} className="hidden" />
                    </label>
                    {s.loanQrImage && (
                      <button
                        type="button"
                        onClick={handleRemoveQr}
                        className="text-xs py-2 px-3 rounded-xl border font-medium transition-opacity hover:opacity-80"
                        style={{
                          backgroundColor: isDark ? '#232326' : '#FFFFFF',
                          borderColor: t.borderLight || t.border,
                          color: '#EF4444',
                        }}
                        title="Eliminar QR"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                </div>
                {s.loanQrImage && (
                  <div className="w-24 h-24 rounded-xl overflow-hidden border p-1 bg-white" style={{ borderColor: t.borderLight || t.border }}>
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
              <div className="pb-4 border-b" style={{ borderColor: t.borderLight || t.border }}>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center border" style={{ backgroundColor: isDark ? '#1C1C1E' : '#F3F4F6', borderColor: t.borderLight || t.border, color: t.text }}>
                    <Wallet size={15} />
                  </div>
                  <h3 className="text-sm font-bold tracking-tight m-0" style={{ color: t.text }}>
                    Control de Egresos & Suscripciones
                  </h3>
                </div>
                <p className="text-xs mt-1 m-0" style={{ color: t.textMuted }}>
                  Presupuesto objetivo mensual y días de antelación para recordatorios de débito
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest block mb-1.5" style={{ color: t.textMuted }}>
                    Presupuesto Mensual Objetivo (BOB)
                  </label>
                  <input
                    type="number"
                    value={s.monthlyBudget ?? 2500}
                    onChange={e => {
                      const v = parseFloat(e.target.value) || 0;
                      updateSetting('monthlyBudget', v);
                      localStorage.setItem('inefable_monthly_budget', v.toString());
                    }}
                    onBlur={triggerSaveNotice}
                    className="w-full text-xs font-mono font-bold rounded-xl border p-2.5 outline-none"
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest block mb-1.5" style={{ color: t.textMuted }}>
                    Días de Anticipación para Alertas
                  </label>
                  <select
                    value={s.reminderDays || '3'}
                    onChange={e => {
                      updateSetting('reminderDays', e.target.value);
                      triggerSaveNotice();
                    }}
                    className="w-full text-xs font-medium rounded-xl border p-2.5 outline-none"
                    style={inputStyle}
                  >
                    <option value="1">1 día antes del vencimiento</option>
                    <option value="3">3 días antes del vencimiento</option>
                    <option value="5">5 días antes del vencimiento</option>
                    <option value="7">7 días antes del vencimiento</option>
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
              <div className="pb-4 border-b" style={{ borderColor: t.borderLight || t.border }}>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center border" style={{ backgroundColor: isDark ? '#1C1C1E' : '#F3F4F6', borderColor: t.borderLight || t.border, color: t.text }}>
                    <Building2 size={15} />
                  </div>
                  <h3 className="text-sm font-bold tracking-tight m-0" style={{ color: t.text }}>
                    Identidad Comercial & Facturación
                  </h3>
                </div>
                <p className="text-xs mt-1 m-0" style={{ color: t.textMuted }}>
                  Datos que aparecen en reportes, inventarios y comprobantes emitidos
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest block mb-1.5" style={{ color: t.textMuted }}>
                    Razón Social / Nombre Comercial
                  </label>
                  <input
                    type="text"
                    value={s.companyName || 'Inefable Corp'}
                    onChange={e => updateSetting('companyName', e.target.value)}
                    onBlur={triggerSaveNotice}
                    className="w-full text-xs font-medium rounded-xl border p-2.5 outline-none"
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest block mb-1.5" style={{ color: t.textMuted }}>
                    NIT / Número Tributario
                  </label>
                  <input
                    type="text"
                    value={s.companyNit || ''}
                    onChange={e => updateSetting('companyNit', e.target.value)}
                    onBlur={triggerSaveNotice}
                    placeholder="Ej. 102938475"
                    className="w-full text-xs font-mono rounded-xl border p-2.5 outline-none"
                    style={inputStyle}
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
              <div className="pb-4 border-b" style={{ borderColor: t.borderLight || t.border }}>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center border" style={{ backgroundColor: isDark ? '#1C1C1E' : '#F3F4F6', borderColor: t.borderLight || t.border, color: t.text }}>
                    <Bell size={15} />
                  </div>
                  <h3 className="text-sm font-bold tracking-tight m-0" style={{ color: t.text }}>
                    Centro de Alertas & Notificaciones
                  </h3>
                </div>
                <p className="text-xs mt-1 m-0" style={{ color: t.textMuted }}>
                  Configuración de notificaciones visuales e indicadores en la barra de menú
                </p>
              </div>

              <div className="space-y-3">
                <div className="p-4 rounded-xl border flex items-center justify-between" style={subCardStyle}>
                  <div>
                    <p className="text-xs font-bold m-0" style={{ color: t.text }}>Alertas de Vencimiento de Préstamos</p>
                    <p className="text-[10px] m-0 mt-0.5" style={{ color: t.textMuted }}>Mostrar puntos de alerta y cobros pendientes en la campana</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={s.loanNotifications !== false}
                    onChange={e => {
                      updateSetting('loanNotifications', e.target.checked);
                      triggerSaveNotice();
                    }}
                    className="accent-neutral-400 w-4 h-4 cursor-pointer"
                  />
                </div>

                <div className="p-4 rounded-xl border flex items-center justify-between" style={subCardStyle}>
                  <div>
                    <p className="text-xs font-bold m-0" style={{ color: t.text }}>Alertas de Suscripciones & Servicios</p>
                    <p className="text-[10px] m-0 mt-0.5" style={{ color: t.textMuted }}>Avisar con anticipación antes de la fecha de cobro automático</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={s.serviceNotifications !== false}
                    onChange={e => {
                      updateSetting('serviceNotifications', e.target.checked);
                      triggerSaveNotice();
                    }}
                    className="accent-neutral-400 w-4 h-4 cursor-pointer"
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
              <div className="pb-4 border-b" style={{ borderColor: t.borderLight || t.border }}>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center border" style={{ backgroundColor: isDark ? '#1C1C1E' : '#F3F4F6', borderColor: t.borderLight || t.border, color: t.text }}>
                    <Shield size={15} />
                  </div>
                  <h3 className="text-sm font-bold tracking-tight m-0" style={{ color: t.text }}>
                    Seguridad, Cuenta & Respaldo
                  </h3>
                </div>
                <p className="text-xs mt-1 m-0" style={{ color: t.textMuted }}>
                  Administración de sesiones, exportación completa y restauración de fábrica
                </p>
              </div>

              {/* Cuenta de Google */}
              <div className="p-4 rounded-xl border flex items-center justify-between" style={subCardStyle}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden border" style={{ backgroundColor: isDark ? '#2A2A2E' : '#E5E7EB', borderColor: t.borderLight || t.border }}>
                    {googleUser?.picture ? (
                      <img src={googleUser.picture} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <Globe size={18} style={{ color: t.textMuted }} />
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-bold m-0" style={{ color: t.text }}>{googleUser?.name || 'Usuario Inefable'}</p>
                    <p className="text-[10px] m-0 mt-0.5" style={{ color: t.textMuted }}>{googleUser?.email || 'Google Workspace Conectado'}</p>
                  </div>
                </div>
                {onLogout && (
                  <button
                    type="button"
                    onClick={onLogout}
                    className="flex items-center gap-1.5 text-xs py-2 px-3 rounded-xl border font-medium transition-opacity hover:opacity-80"
                    style={{
                      backgroundColor: isDark ? '#232326' : '#FFFFFF',
                      borderColor: t.borderLight || t.border,
                      color: t.text,
                    }}
                  >
                    <LogOut size={12} /> Cerrar Sesión
                  </button>
                )}
              </div>

              {/* Restauración de Fábrica */}
              <div
                className="p-4 rounded-xl border space-y-2"
                style={{
                  backgroundColor: isDark ? 'rgba(239,68,68,0.04)' : '#FEF2F2',
                  borderColor: isDark ? 'rgba(239,68,68,0.15)' : '#FECACA',
                }}
              >
                <div className="flex items-center gap-2 font-bold text-xs" style={{ color: isDark ? '#FCA5A5' : '#DC2626' }}>
                  <AlertTriangle size={15} /> Zona de Peligro: Restablecer Preferencias
                </div>
                <p className="text-[10px] m-0 leading-relaxed" style={{ color: t.textMuted }}>
                  Regresa todas las configuraciones, claves API y preferencias de visualización a los valores iniciales.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('¿Seguro que deseas restablecer todas las preferencias del panel?')) {
                      resetSettings();
                    }
                  }}
                  className="flex items-center gap-1.5 text-xs py-2 px-3.5 rounded-xl border font-medium mt-2 transition-opacity hover:opacity-80"
                  style={{
                    backgroundColor: isDark ? '#232326' : '#FFFFFF',
                    borderColor: isDark ? 'rgba(239,68,68,0.3)' : '#F87171',
                    color: isDark ? '#FCA5A5' : '#DC2626',
                  }}
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