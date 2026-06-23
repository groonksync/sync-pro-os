import React, { useState, useMemo, useRef, useCallback } from 'react';
import {
  Palette, Monitor, Sidebar, Image, Type, Layout, Sun, Moon, Eye, EyeOff,
  DollarSign, BadgePercent, CalendarDays, Bell, BellRing, BellOff,
  Smartphone, Tablet, Shield, Lock, Key, Download, Upload, Trash2,
  RefreshCw, Wifi, WifiOff, Zap, Cpu, Languages, Clock, MonitorDown,
  CreditCard, Building2, Wallet, FileText, Video, FolderOpen, MousePointer2,
  ChevronDown, ChevronRight, Save, Check, X, Camera, QrCode, Link,
  AppWindow, Terminal, LogOut, RotateCcw, Info, AlertTriangle, Globe,
  BookA, BookAudio, BookOpen, Bookmark, Braces, Briefcase, Calendar,
  ChevronLeft, ChevronUp, ChevronsLeft, Circle, Clipboard, Code,
  Cog, Command, Compass, Copy, Cpu as CpuIcon, Database, Disc,
  ExternalLink, Feather, File, Fingerprint, Flag, GitBranch,
  GripVertical, Headphones, Heart, HelpCircle, Home, Inbox,
  Layers, LifeBuoy, Lightbulb, List, Loader, Lock as LockIcon,
  LogIn, Mail, MapPin, Maximize, Menu, MessageSquare, Mic,
  Minimize, Minus, Monitor as MonitorIcon, Moon as MoonIcon,
  MoreHorizontal, Move, Music, Navigation, Paperclip,
  Pause, Pen, Pencil, Phone, PieChart, Pin, Play, Plus,
  Power, Printer, Radio, Repeat, Reply, Rewind,
  Rocket, RotateCw, Rss, Scissors, Search, Send,
  Server, Settings, Share, Shield as ShieldIcon,
  ShieldOff, Shuffle, SkipBack, SkipForward,
  Sliders, Smartphone as SmartphoneIcon,
  Smile, Speaker, Square, Star, StopCircle,
  Sun as SunIcon, Sunrise, Sunset, SwatchBook,
  SwitchCamera, Table, Tag, Target, Terminal as TerminalIcon,
  Thermometer, ThumbsUp, ToggleLeft, ToggleRight,
  Trash, Trello, TrendingUp, Triangle,
  Trophy, Truck, Tv, Twitch, Twitter, Umbrella,
} from 'lucide-react';
import { useSettings } from '../lib/settingsStore';
import { getTheme, useTheme } from '../lib/theme';

const ICONS = {
  Pallete: Palette, Monitor: Monitor, Sidebar: Sidebar, Image: Image,
  Type: Type, Layout: Layout, Dollar: DollarSign, Percent: BadgePercent,
  Calendar: CalendarDays, Bell: Bell, Shield: Shield, Lock: Lock,
  Key: Key, Download: Download, Upload: Upload, Trash: Trash2,
  Refresh: RefreshCw, Wifi: Wifi, Zap: Zap, Cpu: CpuIcon,
  Languages: Languages, Clock: Clock, Building: Building2,
  Wallet: Wallet, File: FileText, Video: Video, Folder: FolderOpen,
  CreditCard: CreditCard, QrCode: QrCode, Link: Link,
  Info: Info, Alert: AlertTriangle, Globe: Globe,
  Smartphone: SmartphoneIcon, ToggleLeft: ToggleLeft,
  Sun: SunIcon, Moon: MoonIcon, Eye: Eye, EyeOff: EyeOff,
  Save: Save, Check: Check, X: X, Home: Home, Star: Star,
};

const SECCIONES = [
  { id: 'apariencia', icon: 'Pallete', label: 'Apariencia', desc: 'Colores, fondo, barra lateral e imagen' },
  { id: 'panel', icon: 'Layout', label: 'Panel Principal', desc: 'Widgets del dashboard y vista predeterminada' },
  { id: 'prestamos', icon: 'Dollar', label: 'Préstamos', desc: 'Defaults, cobros, recordatorios y QR' },
  { id: 'flujo', icon: 'File', label: 'Flujo de Trabajo', desc: 'Editor de documentos y plantillas' },
  { id: 'video', icon: 'Video', label: 'Editor de Video', desc: 'Rutas y plantillas Adobe' },
  { id: 'empresa', icon: 'Building', label: 'Empresa', desc: 'Datos fiscales y facturación' },
  { id: 'egresos', icon: 'Wallet', label: 'Egresos', desc: 'Categorías y seguimiento' },
  { id: 'calendario', icon: 'Calendar', label: 'Calendario', desc: 'Vista y sincronización' },
  { id: 'notificaciones', icon: 'Bell', label: 'Notificaciones', desc: 'Push, sonidos y toasts' },
  { id: 'idioma', icon: 'Languages', label: 'Idioma y Región', desc: 'Idioma, moneda y zona horaria' },
  { id: 'seguridad', icon: 'Lock', label: 'Seguridad', desc: 'PIN, bloqueo y datos sensibles' },
  { id: 'respaldo', icon: 'Download', label: 'Respaldo y Sinc', desc: 'Exportar/Importar configuración' },
  { id: 'rendimiento', icon: 'Zap', label: 'Rendimiento', desc: 'Caché, animaciones y modo' },
  { id: 'ia', icon: 'Cpu', label: 'Inteligencia Artificial', desc: 'Proveedores y modelos' },
  { id: 'sistema', icon: 'Info', label: 'Sistema', desc: 'Versión, entorno y actualizaciones' },
  { id: 'mantenimiento', icon: 'Trash', label: 'Mantenimiento', desc: 'Limpieza de datos y diagnóstico' },
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
  { id: 'lightGray', label: 'Gris Claro', color: '#2a2a2a' },
];

const SIDEBAR_OPTIONS = [
  { id: 'same', label: 'Mismo que fondo' },
  { id: 'black', label: 'Negro OLED (#000000)' },
  { id: 'darkGray', label: 'Gris Oscuro (#141414)' },
  { id: 'lightGray', label: 'Gris Claro (#2a2a2a)' },
];

const DENSIDADES = [
  { id: 'compact', label: 'Compacto', desc: 'Máxima información' },
  { id: 'normal', label: 'Normal', desc: 'Balance ideal' },
  { id: 'comfortable', label: 'Cómodo', desc: 'Espacio amplio' },
];

const WIDGETS_DISPONIBLES = [
  { id: 'ingresos', label: 'Ingresos del Mes', icon: 'Dollar' },
  { id: 'prestamos', label: 'Préstamos Activos', icon: 'CreditCard' },
  { id: 'cobros', label: 'Cobros de Hoy', icon: 'Calendar' },
  { id: 'recordatorios', label: 'Recordatorios', icon: 'Bell' },
  { id: 'egresos', label: 'Egresos del Mes', icon: 'Wallet' },
  { id: 'movimientos', label: 'Últimos Movimientos', icon: 'Activity' },
  { id: 'proyeccion', label: 'Proyección', icon: 'TrendingUp' },
  { id: 'salud', label: 'Salud de Cartera', icon: 'Heart' },
];

const FONT_OPTIONS = ['Inter', 'Roboto', 'Merriweather', 'JetBrains Mono', 'Open Sans', 'Lato', 'Poppins', 'Montserrat'];
const WORK_SIZE_OPTIONS = [12, 14, 16, 18, 20];
const MARGIN_OPTIONS = [
  { id: 'narrow', label: 'Estrecho' },
  { id: 'normal', label: 'Normal' },
  { id: 'wide', label: 'Ancho' },
];
const AUTOSAVE_INTERVALS = [1, 3, 5, 10];
const TOAST_DURATIONS = [2000, 4000, 6000, 10000];
const TOAST_POSITIONS = [
  { id: 'top-right', label: 'Superior derecha' },
  { id: 'top-left', label: 'Superior izquierda' },
  { id: 'bottom-right', label: 'Inferior derecha' },
  { id: 'bottom-left', label: 'Inferior izquierda' },
];
const SOUND_TYPES = ['chime', 'bell', 'ping', 'digital', 'soft', 'none'];
const ZOOM_OPTIONS = [90, 100, 110, 125, 150];
const DEFAULT_VIEWS = [
  { id: 'dashboard', label: 'Panel Principal' },
  { id: 'prestamos', label: 'Préstamos' },
  { id: 'flujo', label: 'Flujo de Trabajo' },
];
const LOAN_TERMS = [1, 3, 6, 9, 12];
const VIDEO_RESOLUTIONS = ['1080p', '2K', '4K'];

// ─── COMPONENTE SECCIÓN COLAPSABLE ──────────────────────────
const Seccion = ({ icon, label, desc, children, defaultOpen = true }) => {
  const [open, setOpen] = useState(defaultOpen);
  const Icon = ICONS[icon] || Info;

  return (
    <div style={{
      borderRadius: '16px', overflow: 'hidden',
      backgroundColor: '#1a1a1a', border: '1px solid #2e2e30',
      transition: 'all 0.2s',
    }}>
      <div onClick={() => setOpen(!open)}
        style={{
          padding: '14px 18px', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: '12px',
          userSelect: 'none',
        }}>
        <div style={{
          width: '32px', height: '32px', borderRadius: '10px',
          backgroundColor: 'rgba(160,160,160,0.1)', color: '#a0a0a0',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Icon size={15} />
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#d4d4d4' }}>{label}</p>
          <p style={{ margin: '2px 0 0', fontSize: '10px', color: '#707070' }}>{desc}</p>
        </div>
        {open ? <ChevronUp size={14} color="#707070" /> : <ChevronDown size={14} color="#707070" />}
      </div>
      {open && <div style={{ padding: '0 18px 18px' }}>{children}</div>}
    </div>
  );
};

// ─── COMPONENTE ROW (label + control) ──────────────────────
const Fila = ({ label, desc, children }) => (
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '8px 0', borderBottom: '1px solid #2a2a2a',
    gap: '12px',
  }}>
    <div style={{ flex: 1, minWidth: 0 }}>
      <p style={{ margin: 0, fontSize: '11px', fontWeight: 500, color: '#d4d4d4' }}>{label}</p>
      {desc && <p style={{ margin: '2px 0 0', fontSize: '9px', color: '#707070' }}>{desc}</p>}
    </div>
    <div style={{ flexShrink: 0 }}>{children}</div>
  </div>
);

// ─── SWITCH TOGGLE ─────────────────────────────────────────
const Toggle = ({ value, onChange }) => (
  <div onClick={() => onChange(!value)}
    style={{
      width: '40px', height: '22px', borderRadius: '11px',
      backgroundColor: value ? '#a0a0a0' : '#333',
      cursor: 'pointer', position: 'relative',
      transition: 'background 0.2s',
    }}>
    <div style={{
      width: '18px', height: '18px', borderRadius: '50%',
      backgroundColor: 'white', position: 'absolute',
      top: '2px', left: value ? '20px' : '2px',
      transition: 'left 0.2s',
    }} />
  </div>
);

// ─── COMPONENTE PRINCIPAL ──────────────────────────────────
export default function Ajustes({ isDark, settings: propSettings, onUpdateSetting }) {
  const { settings, updateSetting, updateSettings, resetSettings, exportSettings, importSettings } = useSettings();
  const s = settings;
  const t = useMemo(() => getTheme(isDark, s), [isDark, s]);
  const [activeSection, setActiveSection] = useState('apariencia');
  const [importStatus, setImportStatus] = useState(null);
  const fileInputRef = useRef(null);
  const imgPreviewRef = useRef(null);

  // Imagen de fondo
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

  // QR de pago
  const handleQrUpload = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => updateSetting('loanQrImage', ev.target.result);
    reader.readAsDataURL(file);
  }, [updateSetting]);

  const handleRemoveQr = useCallback(() => updateSetting('loanQrImage', null), [updateSetting]);

  // Export/Import
  const handleExport = useCallback(() => {
    const json = exportSettings();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `inefable-config-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [exportSettings]);

  const handleImport = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const ok = importSettings(ev.target.result);
        setImportStatus(ok ? '✅ Configuración importada correctamente' : '❌ Error: archivo inválido');
        setTimeout(() => setImportStatus(null), 3000);
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
          total += localStorage[key].length * 2; // UTF-16
        }
      }
      return (total / 1024 / 1024).toFixed(1);
    } catch { return '?'; }
  }, []);

  const renderContent = () => {
    switch (activeSection) {
      case 'apariencia': return renderApariencia();
      case 'panel': return renderPanel();
      case 'prestamos': return renderPrestamos();
      case 'flujo': return renderFlujo();
      case 'video': return renderVideo();
      case 'empresa': return renderEmpresa();
      case 'calendario': return renderCalendario();
      case 'notificaciones': return renderNotificaciones();
      case 'idioma': return renderIdioma();
      case 'seguridad': return renderSeguridad();
      case 'respaldo': return renderRespaldo();
      case 'rendimiento': return renderRendimiento();
      case 'ia': return renderIA();
      case 'sistema': return renderSistema();
      case 'mantenimiento': return renderMantenimiento();
      case 'egresos': return renderEgresos();
      default: return renderApariencia();
    }
  };

  // ─── SECCIÓN: APARIENCIA ─────────────────────────────────
  const renderApariencia = () => (
    <Seccion icon="Pallete" label="Apariencia" desc="Colores, fondo, barra lateral e imagen de fondo">
      {/* Modo de fondo */}
      <Fila label="Modo de fondo" desc="Selecciona el tono base de la interfaz">
        <div style={{ display: 'flex', gap: '8px' }}>
          {MODOS_FONDO.map(m => (
            <div key={m.id} onClick={() => updateSetting('appearanceMode', m.id)}
              style={{
                width: '36px', height: '36px', borderRadius: '10px',
                backgroundColor: m.color, cursor: 'pointer',
                border: s.appearanceMode === m.id ? '2px solid #a0a0a0' : '2px solid transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.15s',
              }}>
              {s.appearanceMode === m.id && <Check size={14} color="#a0a0a0" />}
            </div>
          ))}
        </div>
      </Fila>

      {/* Color de barra lateral */}
      <Fila label="Color de barra lateral" desc="Color de fondo del menú lateral">
        <select value={s.sidebarColor} onChange={e => updateSetting('sidebarColor', e.target.value)}
          style={{
            padding: '6px 10px', fontSize: '11px', borderRadius: '8px',
            backgroundColor: '#222', border: '1px solid #2e2e30', color: '#d4d4d4', outline: 'none',
          }}>
          {SIDEBAR_OPTIONS.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
        </select>
      </Fila>

      {/* Color de acento */}
      <Fila label="Color de acento" desc="Color de botones, iconos y elementos activos">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '6px', width: '220px' }}>
          {ACCENT_COLORS.map(c => (
            <div key={c.hex} onClick={() => updateSetting('accentColor', c.hex)}
              style={{
                width: '30px', height: '30px', borderRadius: '8px',
                backgroundColor: c.hex, cursor: 'pointer',
                border: s.accentColor === c.hex ? '2px solid white' : '2px solid transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
              {s.accentColor === c.hex && <Check size={12} color={c.hex === '#ffffff' ? '#333' : 'white'} />}
            </div>
          ))}
        </div>
      </Fila>

      {/* Densidad */}
      <Fila label="Densidad de interfaz" desc="Espaciado entre elementos">
        <div style={{ display: 'flex', gap: '6px' }}>
          {DENSIDADES.map(d => (
            <div key={d.id} onClick={() => updateSetting('interfaceDensity', d.id)}
              style={{
                padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '10px',
                backgroundColor: s.interfaceDensity === d.id ? '#a0a0a0' : '#222',
                color: s.interfaceDensity === d.id ? '#000' : '#d4d4d4',
                border: `1px solid ${s.interfaceDensity === d.id ? '#a0a0a0' : '#333'}`,
                fontWeight: s.interfaceDensity === d.id ? 600 : 400,
              }}>
              {d.label}
            </div>
          ))}
        </div>
      </Fila>

      {/* Modo de Visualización (Móvil vs Escritorio) */}
      <Fila label="Modo de Visualización" desc="Forzar interfaz para móvil o escritorio">
        <div style={{ display: 'flex', gap: '6px' }}>
          {[
            { label: 'Automático', source: 'auto', mobile: window.innerWidth < 1024 },
            { label: 'Smartphone', source: 'manual', mobile: true },
            { label: 'Escritorio', source: 'manual', mobile: false }
          ].map(opt => {
            const isSelected = s.mobileModeSource === opt.source && (opt.source === 'auto' || s.isMobileMode === opt.mobile);
            return (
              <div key={opt.label} onClick={() => {
                updateSettings({
                  mobileModeSource: opt.source,
                  isMobileMode: opt.mobile
                });
              }}
                style={{
                  padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '10px',
                  backgroundColor: isSelected ? '#a0a0a0' : '#222',
                  color: isSelected ? '#000' : '#d4d4d4',
                  border: `1px solid ${isSelected ? '#a0a0a0' : '#333'}`,
                  fontWeight: isSelected ? 600 : 400,
                }}>
                {opt.label}
              </div>
            );
          })}
        </div>
      </Fila>

      {/* Tamaño de fuente */}
      <Fila label="Tamaño de fuente base" desc={`${s.baseFontSize}px — afecta toda la tipografía`}>
        <input type="range" min={11} max={16} value={s.baseFontSize}
          onChange={e => updateSetting('baseFontSize', parseInt(e.target.value))}
          style={{ width: '120px' }} />
      </Fila>

      {/* Imagen de fondo */}
      <Fila label="Imagen de fondo" desc="Aparecerá desenfocada detrás de toda la interfaz">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
          {s.backgroundImage && (
            <div style={{
              width: '200px', height: '80px', borderRadius: '8px', overflow: 'hidden',
              border: '1px solid #333', position: 'relative',
            }}>
              <img src={s.backgroundImage} alt="Preview"
                style={{ width: '100%', height: '100%', objectFit: 'cover', filter: `blur(${s.backgroundBlur * 0.3}px)` }} />
            </div>
          )}
          <div style={{ display: 'flex', gap: '6px' }}>
            <label style={{
              padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '10px', fontWeight: 500,
              backgroundColor: '#333', color: '#d4d4d4', border: '1px solid #444',
              display: 'flex', alignItems: 'center', gap: '4px',
            }}>
              <Upload size={12} /> Subir Imagen
              <input type="file" accept="image/*" onChange={handleBgImageUpload} ref={ref => fileInputRef.current = ref} style={{ display: 'none' }} />
            </label>
            {s.backgroundImage && (
              <button onClick={handleRemoveBg}
                style={{
                  padding: '6px 12px', borderRadius: '8px', border: '1px solid #444',
                  backgroundColor: '#222', color: '#ef4444', fontSize: '10px', cursor: 'pointer',
                }}>
                Eliminar
              </button>
            )}
          </div>
        </div>
      </Fila>

      {/* Slider de desenfoque */}
      {s.backgroundImage && (
        <Fila label="Desenfoque" desc={`${s.backgroundBlur}%`}>
          <input type="range" min={50} max={100} value={s.backgroundBlur}
            onChange={e => updateSetting('backgroundBlur', parseInt(e.target.value))}
            style={{ width: '120px' }} />
        </Fila>
      )}

      {/* Animaciones */}
      <Fila label="Animaciones" desc="Transiciones y efectos visuales">
        <Toggle value={s.enableAnimations} onChange={v => updateSetting('enableAnimations', v)} />
      </Fila>

      {/* Zoom */}
      <Fila label="Zoom de interfaz" desc={`${s.zoomLevel}%`}>
        <div style={{ display: 'flex', gap: '4px' }}>
          {ZOOM_OPTIONS.map(z => (
            <div key={z} onClick={() => updateSetting('zoomLevel', z)}
              style={{
                padding: '4px 8px', borderRadius: '6px', cursor: 'pointer', fontSize: '9px',
                backgroundColor: s.zoomLevel === z ? '#a0a0a0' : '#222',
                color: s.zoomLevel === z ? '#000' : '#d4d4d4',
              }}>
              {z}%
            </div>
          ))}
        </div>
      </Fila>
    </Seccion>
  );

  // ─── SECCIÓN: PANEL PRINCIPAL ────────────────────────────
  const renderPanel = () => (
    <Seccion icon="Layout" label="Panel Principal" desc="Widgets del dashboard y vista predeterminada">
      <Fila label="Vista predeterminada" desc="Pantalla que se muestra al abrir la app">
        <select value={s.defaultView} onChange={e => updateSetting('defaultView', e.target.value)}
          style={{
            padding: '6px 10px', fontSize: '11px', borderRadius: '8px',
            backgroundColor: '#222', border: '1px solid #2e2e30', color: '#d4d4d4', outline: 'none',
          }}>
          {DEFAULT_VIEWS.map(v => <option key={v.id} value={v.id}>{v.label}</option>)}
        </select>
      </Fila>

      <p style={{ fontSize: '10px', fontWeight: 600, color: '#707070', margin: '12px 0 8px', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
        Widgets visibles
      </p>
      {WIDGETS_DISPONIBLES.map(w => {
        const isActive = (s.dashboardWidgets || []).includes(w.id);
        return (
          <Fila key={w.id} label={w.label}>
            <Toggle value={isActive} onChange={() => {
              const current = s.dashboardWidgets || [];
              if (isActive) updateSetting('dashboardWidgets', current.filter(i => i !== w.id));
              else updateSetting('dashboardWidgets', [...current, w.id]);
            }} />
          </Fila>
        );
      })}
    </Seccion>
  );

  // ─── SECCIÓN: PRÉSTAMOS ─────────────────────────────────
  const renderPrestamos = () => (
    <Seccion icon="Dollar" label="Préstamos" desc="Defaults, cobros, recordatorios y QR de pago">
      <Fila label="Interés predeterminado" desc="% mensual (default 5%)">
        <input type="number" value={s.loanDefaultInterest} min={0} max={100} step={0.5}
          onChange={e => updateSetting('loanDefaultInterest', parseFloat(e.target.value) || 5)}
          style={{
            width: '70px', padding: '6px 10px', fontSize: '11px', borderRadius: '8px',
            backgroundColor: '#222', border: '1px solid #2e2e30', color: '#d4d4d4', outline: 'none',
            textAlign: 'center', fontFamily: 'monospace',
          }} />
      </Fila>

      <Fila label="Plazo predeterminado" desc="Meses para nuevo préstamo">
        <select value={s.loanDefaultTerm} onChange={e => updateSetting('loanDefaultTerm', parseInt(e.target.value))}
          style={{
            padding: '6px 10px', fontSize: '11px', borderRadius: '8px',
            backgroundColor: '#222', border: '1px solid #2e2e30', color: '#d4d4d4', outline: 'none',
          }}>
          {LOAN_TERMS.map(m => <option key={m} value={m}>{m} mes{m !== 1 ? 'es' : ''}</option>)}
        </select>
      </Fila>

      <Fila label="Moneda predeterminada">
        <select value={s.loanDefaultCurrency} onChange={e => updateSetting('loanDefaultCurrency', e.target.value)}
          style={{
            padding: '6px 10px', fontSize: '11px', borderRadius: '8px',
            backgroundColor: '#222', border: '1px solid #2e2e30', color: '#d4d4d4', outline: 'none',
          }}>
          <option value="BOB">BOB (Bs.)</option>
          <option value="USD">USD ($)</option>
        </select>
      </Fila>

      <Fila label="Días para recordatorio" desc="Cuántos días antes del vencimiento se alerta">
        <input type="number" value={s.loanReminderDays} min={0} max={30}
          onChange={e => updateSetting('loanReminderDays', parseInt(e.target.value) || 3)}
          style={{
            width: '60px', padding: '6px 10px', fontSize: '11px', borderRadius: '8px',
            backgroundColor: '#222', border: '1px solid #2e2e30', color: '#d4d4d4', outline: 'none',
            textAlign: 'center', fontFamily: 'monospace',
          }} />
      </Fila>

      <Fila label="Tasa de mora diaria" desc="% de interés adicional por día de atraso">
        <input type="number" value={s.loanMoraRate} min={0} max={50} step={0.5}
          onChange={e => updateSetting('loanMoraRate', parseFloat(e.target.value) || 5)}
          style={{
            width: '60px', padding: '6px 10px', fontSize: '11px', borderRadius: '8px',
            backgroundColor: '#222', border: '1px solid #2e2e30', color: '#d4d4d4', outline: 'none',
            textAlign: 'center', fontFamily: 'monospace',
          }} />
      </Fila>

      <Fila label="Modalidad predeterminada">
        <select value={s.loanDefaultType} onChange={e => updateSetting('loanDefaultType', e.target.value)}
          style={{
            padding: '6px 10px', fontSize: '11px', borderRadius: '8px',
            backgroundColor: '#222', border: '1px solid #2e2e30', color: '#d4d4d4', outline: 'none',
          }}>
          <option value="mensual">Mensual (Interés)</option>
          <option value="diario">Diario (Amortización)</option>
        </select>
      </Fila>

      {/* Cuenta bancaria */}
      <Fila label="Cuenta bancaria" desc="Para transferencias y QR">
        <input type="text" value={s.loanBankAccount}
          onChange={e => updateSetting('loanBankAccount', e.target.value)}
          placeholder="BCP: 123-456789-0-00 - Carlos Joel"
          style={{
            width: '220px', padding: '6px 10px', fontSize: '10px', borderRadius: '8px',
            backgroundColor: '#222', border: '1px solid #2e2e30', color: '#d4d4d4', outline: 'none',
          }} />
      </Fila>

      {/* QR de pago */}
      <Fila label="Imagen QR" desc="Código QR para depósitos">
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          {s.loanQrImage && (
            <div style={{
              width: '48px', height: '48px', borderRadius: '6px', overflow: 'hidden', border: '1px solid #333',
            }}>
              <img src={s.loanQrImage} alt="QR" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
          )}
          <label style={{
            padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '10px',
            backgroundColor: '#333', color: '#d4d4d4', border: '1px solid #444',
          }}>
            {s.loanQrImage ? 'Cambiar' : 'Subir QR'}
            <input type="file" accept="image/*" onChange={handleQrUpload} style={{ display: 'none' }} />
          </label>
          {s.loanQrImage && (
            <button onClick={handleRemoveQr}
              style={{
                padding: '6px 8px', borderRadius: '8px', border: '1px solid #444',
                backgroundColor: '#222', color: '#ef4444', fontSize: '10px', cursor: 'pointer',
              }}>
              <X size={12} />
            </button>
          )}
        </div>
      </Fila>
    </Seccion>
  );

  // ─── SECCIÓN: FLUJO DE TRABAJO ───────────────────────────
  const renderFlujo = () => (
    <Seccion icon="File" label="Flujo de Trabajo" desc="Editor de documentos y plantillas">
      <Fila label="Fuente predeterminada">
        <select value={s.workDefaultFont} onChange={e => updateSetting('workDefaultFont', e.target.value)}
          style={{
            padding: '6px 10px', fontSize: '11px', borderRadius: '8px',
            backgroundColor: '#222', border: '1px solid #2e2e30', color: '#d4d4d4', outline: 'none',
            fontFamily: s.workDefaultFont,
          }}>
          {FONT_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
        </select>
      </Fila>

      <Fila label="Tamaño de fuente" desc="Tamaño por defecto del editor">
        <select value={s.workDefaultSize} onChange={e => updateSetting('workDefaultSize', parseInt(e.target.value))}
          style={{
            padding: '6px 10px', fontSize: '11px', borderRadius: '8px',
            backgroundColor: '#222', border: '1px solid #2e2e30', color: '#d4d4d4', outline: 'none',
          }}>
          {WORK_SIZE_OPTIONS.map(sz => <option key={sz} value={sz}>{sz}px</option>)}
        </select>
      </Fila>

      <Fila label="Márgenes predeterminados">
        <div style={{ display: 'flex', gap: '6px' }}>
          {MARGIN_OPTIONS.map(m => (
            <div key={m.id} onClick={() => updateSetting('workDefaultMargins', m.id)}
              style={{
                padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '10px',
                backgroundColor: s.workDefaultMargins === m.id ? '#a0a0a0' : '#222',
                color: s.workDefaultMargins === m.id ? '#000' : '#d4d4d4',
              }}>
              {m.label}
            </div>
          ))}
        </div>
      </Fila>

      <Fila label="Orientación predeterminada">
        <div style={{ display: 'flex', gap: '6px' }}>
          {[
            { id: 'vertical', label: 'Vertical' },
            { id: 'horizontal', label: 'Horizontal' },
          ].map(o => (
            <div key={o.id} onClick={() => updateSetting('workDefaultOrientation', o.id)}
              style={{
                padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '10px',
                backgroundColor: s.workDefaultOrientation === o.id ? '#a0a0a0' : '#222',
                color: s.workDefaultOrientation === o.id ? '#000' : '#d4d4d4',
              }}>
              {o.label}
            </div>
          ))}
        </div>
      </Fila>

      <Fila label="Color de página predeterminado">
        <div style={{ display: 'flex', gap: '6px' }}>
          {[
            { id: 'dark', label: 'Oscuro' },
            { id: 'light', label: 'Claro' },
          ].map(o => (
            <div key={o.id} onClick={() => updateSetting('workDefaultPageColor', o.id)}
              style={{
                padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '10px',
                backgroundColor: s.workDefaultPageColor === o.id ? '#a0a0a0' : '#222',
                color: s.workDefaultPageColor === o.id ? '#000' : '#d4d4d4',
              }}>
              {o.label}
            </div>
          ))}
        </div>
      </Fila>

      <Fila label="Auto-guardado">
        <Toggle value={s.workAutosave} onChange={v => updateSetting('workAutosave', v)} />
      </Fila>

      {s.workAutosave && (
        <Fila label="Intervalo de auto-guardado" desc="Cada N minutos">
          <div style={{ display: 'flex', gap: '4px' }}>
            {AUTOSAVE_INTERVALS.map(i => (
              <div key={i} onClick={() => updateSetting('workAutosaveInterval', i)}
                style={{
                  padding: '4px 8px', borderRadius: '6px', cursor: 'pointer', fontSize: '9px',
                  backgroundColor: s.workAutosaveInterval === i ? '#a0a0a0' : '#222',
                  color: s.workAutosaveInterval === i ? '#000' : '#d4d4d4',
                }}>
                {i} min
              </div>
            ))}
          </div>
        </Fila>
      )}
    </Seccion>
  );

  // ─── SECCIÓN: EDITOR DE VIDEO ───────────────────────────
  const renderVideo = () => (
    <Seccion icon="Video" label="Editor de Video" desc="Configuración de plantillas Adobe">
      <Fila label="Ruta de plantillas" desc="Directorio donde están las plantillas .prproj y .aep">
        <input type="text" value={s.videoTemplatesPath}
          onChange={e => updateSetting('videoTemplatesPath', e.target.value)}
          style={{
            width: '250px', padding: '6px 10px', fontSize: '10px', borderRadius: '8px',
            backgroundColor: '#222', border: '1px solid #2e2e30', color: '#d4d4d4', outline: 'none', fontFamily: 'monospace',
          }} />
      </Fila>

      <Fila label="Resolución predeterminada">
        <select value={s.videoDefaultResolution} onChange={e => updateSetting('videoDefaultResolution', e.target.value)}
          style={{
            padding: '6px 10px', fontSize: '11px', borderRadius: '8px',
            backgroundColor: '#222', border: '1px solid #2e2e30', color: '#d4d4d4', outline: 'none',
          }}>
          {VIDEO_RESOLUTIONS.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </Fila>

      <Fila label="Nombres de carpetas" desc="Nombres de las carpetas que se crean en cada proyecto">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {s.videoFolderNames.map((name, idx) => (
            <input key={idx} type="text" value={name}
              onChange={e => {
                const newNames = [...s.videoFolderNames];
                newNames[idx] = e.target.value;
                updateSetting('videoFolderNames', newNames);
              }}
              style={{
                width: '200px', padding: '4px 8px', fontSize: '9px', borderRadius: '6px',
                backgroundColor: '#222', border: '1px solid #2e2e30', color: '#d4d4d4', outline: 'none',
                fontFamily: 'monospace',
              }} />
          ))}
        </div>
      </Fila>
    </Seccion>
  );

  // ─── SECCIÓN: EMPRESA ───────────────────────────────────
  const renderEmpresa = () => (
    <Seccion icon="Building" label="Empresa" desc="Datos fiscales y facturación">
      {[
        { key: 'businessName', label: 'Nombre del negocio/estudio', placeholder: 'Ej: Inefable Studio', type: 'text' },
        { key: 'businessNit', label: 'NIT / RUC', placeholder: 'Ej: 123456789', type: 'text' },
        { key: 'businessAddress', label: 'Dirección comercial', placeholder: 'Ej: Av. Siempre Viva 742', type: 'text' },
        { key: 'businessPhone', label: 'Teléfono comercial', placeholder: 'Ej: 71234567', type: 'text' },
      ].map(f => (
        <Fila key={f.key} label={f.label}>
          <input type={f.type} value={s[f.key]} placeholder={f.placeholder}
            onChange={e => updateSetting(f.key, e.target.value)}
            style={{
              width: '220px', padding: '6px 10px', fontSize: '10px', borderRadius: '8px',
              backgroundColor: '#222', border: '1px solid #2e2e30', color: '#d4d4d4', outline: 'none',
            }} />
        </Fila>
      ))}
    </Seccion>
  );

  // ─── SECCIÓN: EGRESOS ────────────────────────────────────
  const renderEgresos = () => (
    <Seccion icon="Wallet" label="Egresos" desc="Categorías y seguimiento de gastos">
      <p style={{ fontSize: '10px', fontWeight: 600, color: '#707070', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
        Categorías predefinidas (próximamente)
      </p>
      <p style={{ fontSize: '10px', color: '#555', margin: 0 }}>
        La gestión de categorías de egresos estará disponible en la sección correspondiente.
      </p>
    </Seccion>
  );

  // ─── SECCIÓN: CALENDARIO ────────────────────────────────
  const renderCalendario = () => (
    <Seccion icon="Calendar" label="Calendario" desc="Configuración de vista y sincronización">
      <Fila label="Vista predeterminada">
        <select value={s.calendarDefaultView} onChange={e => updateSetting('calendarDefaultView', e.target.value)}
          style={{
            padding: '6px 10px', fontSize: '11px', borderRadius: '8px',
            backgroundColor: '#222', border: '1px solid #2e2e30', color: '#d4d4d4', outline: 'none',
          }}>
          <option value="month">Mes</option>
          <option value="week">Semana</option>
          <option value="day">Día</option>
          <option value="agenda">Agenda</option>
        </select>
      </Fila>

      <Fila label="Semana comienza en">
        <select value={s.calendarWeekStart} onChange={e => updateSetting('calendarWeekStart', e.target.value)}
          style={{
            padding: '6px 10px', fontSize: '11px', borderRadius: '8px',
            backgroundColor: '#222', border: '1px solid #2e2e30', color: '#d4d4d4', outline: 'none',
          }}>
          <option value="monday">Lunes</option>
          <option value="sunday">Domingo</option>
        </select>
      </Fila>

      <Fila label="Mostrar cobros en calendario">
        <Toggle value={s.calendarShowPayments} onChange={v => updateSetting('calendarShowPayments', v)} />
      </Fila>
    </Seccion>
  );

  // ─── SECCIÓN: NOTIFICACIONES ────────────────────────────
  const renderNotificaciones = () => (
    <Seccion icon="Bell" label="Notificaciones" desc="Push, sonidos y toasts">
      <Fila label="Notificaciones de escritorio" desc="Usa la Notification API del navegador">
        <Toggle value={s.notificationsDesktop} onChange={v => updateSetting('notificationsDesktop', v)} />
      </Fila>

      <Fila label="Sonidos" desc="Reproducir sonido al recibir notificación">
        <Toggle value={s.notificationsSound} onChange={v => updateSetting('notificationsSound', v)} />
      </Fila>

      {s.notificationsSound && (
        <Fila label="Tipo de sonido">
          <select value={s.notificationsSoundType} onChange={e => updateSetting('notificationsSoundType', e.target.value)}
            style={{
              padding: '6px 10px', fontSize: '11px', borderRadius: '8px',
              backgroundColor: '#222', border: '1px solid #2e2e30', color: '#d4d4d4', outline: 'none',
            }}>
            {SOUND_TYPES.map(st => <option key={st} value={st}>{st}</option>)}
          </select>
        </Fila>
      )}

      <Fila label="Posición del toast">
        <select value={s.toastPosition} onChange={e => updateSetting('toastPosition', e.target.value)}
          style={{
            padding: '6px 10px', fontSize: '11px', borderRadius: '8px',
            backgroundColor: '#222', border: '1px solid #2e2e30', color: '#d4d4d4', outline: 'none',
          }}>
          {TOAST_POSITIONS.map(tp => <option key={tp.id} value={tp.id}>{tp.label}</option>)}
        </select>
      </Fila>

      <Fila label="Duración del toast">
        <div style={{ display: 'flex', gap: '4px' }}>
          {TOAST_DURATIONS.map(d => (
            <div key={d} onClick={() => updateSetting('toastDuration', d)}
              style={{
                padding: '4px 8px', borderRadius: '6px', cursor: 'pointer', fontSize: '9px',
                backgroundColor: s.toastDuration === d ? '#a0a0a0' : '#222',
                color: s.toastDuration === d ? '#000' : '#d4d4d4',
              }}>
              {d / 1000}s
            </div>
          ))}
        </div>
      </Fila>
    </Seccion>
  );

  // ─── SECCIÓN: IDIOMA Y REGIÓN ──────────────────────────
  const renderIdioma = () => (
    <Seccion icon="Languages" label="Idioma y Región" desc="Idioma, moneda y zona horaria">
      <Fila label="Idioma de la interfaz">
        <select value={s.language} onChange={e => updateSetting('language', e.target.value)}
          style={{
            padding: '6px 10px', fontSize: '11px', borderRadius: '8px',
            backgroundColor: '#222', border: '1px solid #2e2e30', color: '#d4d4d4', outline: 'none',
          }}>
          <option value="es">Español</option>
          <option value="en">English</option>
        </select>
      </Fila>

      <Fila label="Formato de fecha">
        <select value={s.dateFormat} onChange={e => updateSetting('dateFormat', e.target.value)}
          style={{
            padding: '6px 10px', fontSize: '11px', borderRadius: '8px',
            backgroundColor: '#222', border: '1px solid #2e2e30', color: '#d4d4d4', outline: 'none',
          }}>
          <option value="DD/MM/AAAA">DD/MM/AAAA</option>
          <option value="MM/DD/AAAA">MM/DD/AAAA</option>
          <option value="AAAA-MM-DD">AAAA-MM-DD</option>
        </select>
      </Fila>

      <Fila label="Zona horaria">
        <select value={s.timezone} onChange={e => updateSetting('timezone', e.target.value)}
          style={{
            padding: '6px 10px', fontSize: '11px', borderRadius: '8px',
            backgroundColor: '#222', border: '1px solid #2e2e30', color: '#d4d4d4', outline: 'none',
          }}>
          <option value="America/La_Paz">América/La Paz (UTC-4)</option>
          <option value="America/Asuncion">América/Asunción (UTC-4)</option>
          <option value="America/Lima">América/Lima (UTC-5)</option>
          <option value="America/Bogota">América/Bogotá (UTC-5)</option>
          <option value="America/Mexico_City">América/Ciudad de México (UTC-6)</option>
          <option value="America/Santiago">América/Santiago (UTC-3)</option>
          <option value="America/Buenos_Aires">América/Buenos Aires (UTC-3)</option>
        </select>
      </Fila>

      <Fila label="Símbolo de moneda">
        <select value={s.currencySymbol} onChange={e => updateSetting('currencySymbol', e.target.value)}
          style={{
            padding: '6px 10px', fontSize: '11px', borderRadius: '8px',
            backgroundColor: '#222', border: '1px solid #2e2e30', color: '#d4d4d4', outline: 'none',
          }}>
          <option value="Bs.">Bs. (Boliviano)</option>
          <option value="$">$ (Dólar)</option>
          <option value="Bs">Bs</option>
        </select>
      </Fila>
    </Seccion>
  );

  // ─── SECCIÓN: SEGURIDAD ─────────────────────────────────
  const renderSeguridad = () => (
    <Seccion icon="Lock" label="Seguridad" desc="PIN, bloqueo y datos sensibles">
      <Fila label="PIN de acceso" desc="Código numérico para desbloquear la app">
        <input type="password" value={s.pinCode} maxLength={8}
          onChange={e => updateSetting('pinCode', e.target.value.replace(/\D/g, '').slice(0, 8))}
          placeholder="••••"
          style={{
            width: '100px', padding: '6px 10px', fontSize: '14px', borderRadius: '8px',
            backgroundColor: '#222', border: '1px solid #2e2e30', color: '#d4d4d4', outline: 'none',
            textAlign: 'center', fontFamily: 'monospace',
          }} />
      </Fila>

      <Fila label="Bloqueo automático" desc="Tiempo de inactividad antes de bloquear">
        <select value={s.autoLockMinutes} onChange={e => updateSetting('autoLockMinutes', parseInt(e.target.value))}
          style={{
            padding: '6px 10px', fontSize: '11px', borderRadius: '8px',
            backgroundColor: '#222', border: '1px solid #2e2e30', color: '#d4d4d4', outline: 'none',
          }}>
          <option value={0}>Desactivado</option>
          <option value={1}>1 minuto</option>
          <option value={5}>5 minutos</option>
          <option value={15}>15 minutos</option>
        </select>
      </Fila>

      <Fila label="Ocultar datos sensibles" desc="Reemplazar montos con ••• en vistas generales">
        <Toggle value={s.hideSensitiveData} onChange={v => updateSetting('hideSensitiveData', v)} />
      </Fila>
    </Seccion>
  );

  // ─── SECCIÓN: RESPALDO Y SINCRONIZACIÓN ─────────────────
  const renderRespaldo = () => (
    <Seccion icon="Download" label="Respaldo y Sincronización" desc="Exportar e importar configuración">
      <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
        <button onClick={handleExport}
          style={{
            flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid #333',
            backgroundColor: '#222', color: '#d4d4d4', cursor: 'pointer', fontSize: '11px', fontWeight: 600,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
          }}>
          <Download size={14} /> Exportar configuración
        </button>
        <button onClick={handleImport}
          style={{
            flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid #333',
            backgroundColor: '#222', color: '#d4d4d4', cursor: 'pointer', fontSize: '11px', fontWeight: 600,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
          }}>
          <Upload size={14} /> Importar configuración
        </button>
      </div>
      {importStatus && (
        <p style={{ fontSize: '10px', color: importStatus.includes('✅') ? '#4ec9b0' : '#ef4444', margin: 0 }}>
          {importStatus}
        </p>
      )}
      <p style={{ fontSize: '10px', color: '#555', margin: '8px 0 0' }}>
        El archivo exportado contiene TODA tu configuración personalizada. Puedes importarlo en otro dispositivo.
      </p>
    </Seccion>
  );

  // ─── SECCIÓN: RENDIMIENTO ───────────────────────────────
  const renderRendimiento = () => (
    <Seccion icon="Zap" label="Rendimiento" desc="Caché, animaciones y modo de rendimiento">
      <Fila label="Modo de rendimiento" desc="Balance entre rendimiento y efectos visuales">
        <select value={s.interfaceDensity} onChange={e => updateSetting('interfaceDensity', e.target.value)}
          style={{
            padding: '6px 10px', fontSize: '11px', borderRadius: '8px',
            backgroundColor: '#222', border: '1px solid #2e2e30', color: '#d4d4d4', outline: 'none',
          }}>
          {DENSIDADES.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}
        </select>
      </Fila>

      <Fila label="Caché de datos" desc="Cachear respuestas de Supabase en localStorage">
        <Toggle value={true} onChange={() => {}} />
      </Fila>
    </Seccion>
  );

  // ─── SECCIÓN: IA ────────────────────────────────────────
  const renderIA = () => (
    <Seccion icon="Cpu" label="Inteligencia Artificial" desc="Proveedores y modelos">
      <Fila label="Proveedor de IA">
        <select value={s.aiProvider} onChange={e => updateSetting('aiProvider', e.target.value)}
          style={{
            padding: '6px 10px', fontSize: '11px', borderRadius: '8px',
            backgroundColor: '#222', border: '1px solid #2e2e30', color: '#d4d4d4', outline: 'none',
          }}>
          <option value="gemini">Google Gemini</option>
          <option value="deepseek">DeepSeek</option>
          <option value="openrouter">OpenRouter</option>
        </select>
      </Fila>

      {['gemini', 'deepseek', 'openrouter'].map(p => (
        s.aiProvider === p && (
          <Fila key={p} label={`API Key (${p})`} desc="Tu clave de API">
            <input type="password" value={s[`${p}Key`] || ''}
              onChange={e => updateSetting(`${p}Key`, e.target.value)}
              placeholder={`Ingresa tu API Key de ${p}...`}
              style={{
                width: '250px', padding: '6px 10px', fontSize: '10px', borderRadius: '8px',
                backgroundColor: '#222', border: '1px solid #2e2e30', color: '#d4d4d4', outline: 'none',
              }} />
          </Fila>
        )
      ))}

      <Fila label="Temperatura" desc="Creatividad del modelo (0.0 = preciso, 2.0 = creativo)">
        <input type="range" min={0} max={20} value={Math.round(s.aiTemperature * 10)}
          onChange={e => updateSetting('aiTemperature', parseFloat((e.target.value / 10).toFixed(1)))}
          style={{ width: '120px' }} />
        <span style={{ fontSize: '10px', color: '#707070', width: '24px', textAlign: 'center' }}>
          {s.aiTemperature.toFixed(1)}
        </span>
      </Fila>

      <Fila label="Máximo de tokens" desc="Límite de respuesta">
        <input type="number" value={s.aiMaxTokens} min={256} max={8192} step={256}
          onChange={e => updateSetting('aiMaxTokens', parseInt(e.target.value) || 2048)}
          style={{
            width: '80px', padding: '6px 10px', fontSize: '10px', borderRadius: '8px',
            backgroundColor: '#222', border: '1px solid #2e2e30', color: '#d4d4d4', outline: 'none',
            textAlign: 'center', fontFamily: 'monospace',
          }} />
      </Fila>
    </Seccion>
  );

  // ─── SECCIÓN: SISTEMA ───────────────────────────────────
  const renderSistema = () => (
    <Seccion icon="Info" label="Sistema" desc="Versión, entorno y actualizaciones">
      <div style={{ display: 'grid', gap: '8px' }}>
        {[
          { label: 'Versión de la app', value: '1.1.0' },
          { label: 'Entorno', value: typeof window !== 'undefined' && navigator.userAgent.includes('Electron') ? 'Desktop (Electron)' : 'Web (Navegador)' },
          { label: 'ID de sesión', value: Math.random().toString(36).substring(2, 10) },
        ].map(item => (
          <div key={item.label} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '6px 0', borderBottom: '1px solid #2a2a2a',
          }}>
            <span style={{ fontSize: '10px', color: '#707070' }}>{item.label}</span>
            <span style={{ fontSize: '10px', color: '#d4d4d4', fontFamily: 'monospace' }}>{item.value}</span>
          </div>
        ))}
      </div>
      <div style={{ marginTop: '12px', padding: '10px', borderRadius: '8px', backgroundColor: '#222', border: '1px solid #333' }}>
        <p style={{ margin: 0, fontSize: '10px', color: '#555' }}>
          <Info size={10} style={{ display: 'inline', marginRight: '4px' }} />
          Las actualizaciones se gestionan desde GitHub. Conecta tu repositorio para recibir notificaciones de nuevas versiones.
        </p>
      </div>
    </Seccion>
  );

  // ─── SECCIÓN: MANTENIMIENTO ────────────────────────────
  const renderMantenimiento = () => (
    <Seccion icon="Trash" label="Mantenimiento" desc="Limpieza de datos y diagnóstico">
      <div style={{ marginBottom: '12px' }}>
        <p style={{ fontSize: '10px', fontWeight: 600, color: '#707070', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
          Espacio utilizado
        </p>
        <div style={{
          height: '6px', borderRadius: '3px', backgroundColor: '#222', overflow: 'hidden', marginBottom: '4px',
        }}>
          <div style={{
            height: '100%', borderRadius: '3px', backgroundColor: '#4ec9b0',
            width: `${Math.min(parseFloat(storageUsed) / 5 * 100, 100)}%`,
          }} />
        </div>
        <p style={{ margin: 0, fontSize: '9px', color: '#707070', fontFamily: 'monospace' }}>
          {storageUsed} MB de ~5 MB utilizados
        </p>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
        <button onClick={() => { localStorage.clear(); window.location.reload(); }}
          style={{
            flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid #ef444440',
            backgroundColor: '#ef444410', color: '#ef4444', cursor: 'pointer', fontSize: '11px', fontWeight: 600,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
          }}>
          <Trash2 size={14} /> Limpiar todo
        </button>
        <button onClick={() => { resetSettings(); }}
          style={{
            flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid #333',
            backgroundColor: '#222', color: '#d4d4d4', cursor: 'pointer', fontSize: '11px', fontWeight: 600,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
          }}>
          <RotateCcw size={14} /> Valores de fábrica
        </button>
      </div>
    </Seccion>
  );

  // ─── RENDER PRINCIPAL ───────────────────────────────────
  return (
    <div style={{
      width: '100%', padding: '32px',
      color: '#d4d4d4',
    }}>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#d4d4d4', margin: '0 0 4px', letterSpacing: '-0.02em' }}>
          Panel de Control
        </h2>
        <p style={{ fontSize: '11px', color: '#707070', margin: 0 }}>
          Personaliza cada aspecto de la aplicación — los cambios se guardan automáticamente
        </p>
      </div>

      <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-start' }}>
        {/* Sidebar de navegación */}
        <div style={{
          width: '240px', flexShrink: 0, position: 'sticky', top: '32px',
          display: 'flex', flexDirection: 'column', gap: '2px',
        }}>
          {SECCIONES.map(sec => {
            const Icon = ICONS[sec.icon] || Info;
            const isActive = activeSection === sec.id;
            return (
              <div key={sec.id} onClick={() => setActiveSection(sec.id)}
                style={{
                  padding: '8px 12px', borderRadius: '8px', cursor: 'pointer',
                  backgroundColor: isActive ? '#a0a0a010' : 'transparent',
                  borderLeft: isActive ? '2px solid #a0a0a0' : '2px solid transparent',
                  display: 'flex', alignItems: 'center', gap: '10px',
                  transition: 'all 0.15s',
                }}>
                <Icon size={14} color={isActive ? '#a0a0a0' : '#555'} />
                <div>
                  <p style={{
                    margin: 0, fontSize: '10px', fontWeight: isActive ? 600 : 400,
                    color: isActive ? '#d4d4d4' : '#707070',
                  }}>
                    {sec.label}
                  </p>
                  <p style={{ margin: 0, fontSize: '8px', color: '#555' }}>{sec.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Contenido */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {renderContent()}
        </div>
      </div>
    </div>
  );
}