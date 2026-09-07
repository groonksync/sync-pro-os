import React, { useState, useEffect } from 'react';
import { 
  Search, Bell, Sparkles, Command, ShieldCheck, 
  Sun, Moon, ExternalLink, ChevronRight, Activity,
  Landmark, Building2, Wallet, Dumbbell, Video, Briefcase, 
  Trash2, Image, Settings
} from 'lucide-react';
import { useTheme } from '../lib/theme';
import { Google, DeepSeek } from '@lobehub/icons';

const SECTION_MAP = {
  resumen: { label: 'Centro de Control', icon: Activity, group: 'Principal' },
  prestamos: { label: 'Gestión de Préstamos', icon: Landmark, group: 'Finanzas' },
  inventario: { label: 'Empresa & Inventario', icon: Building2, group: 'Comercial' },
  pagos: { label: 'Mis Egresos & Flujo', icon: Wallet, group: 'Finanzas' },
  gimnasio: { label: 'Sistema Gimnasio', icon: Dumbbell, group: 'Sistemas' },
  editor: { label: 'Agencia de Marketing', icon: Video, group: 'Agencia' },
  'proyectos-edicion': { label: 'Proyectos de Edición', icon: Briefcase, group: 'Agencia' },
  recordatorios: { label: 'Recordatorios & Agenda', icon: Bell, group: 'Productividad' },
  'conversor-imagenes': { label: 'Conversor WebP', icon: Image, group: 'Herramientas' },
  papelera: { label: 'Papelera de Reciclaje', icon: Trash2, group: 'Sistema' },
  configuracion: { label: 'Configuración & Ajustes', icon: Settings, group: 'Sistema' },
};

export const TopHeader = ({
  activeTab,
  setActiveTab,
  isDark,
  setIsDark,
  googleUser,
  settings,
  notificationCount = 0,
  onOpenCommandModal
}) => {
  const t = useTheme(isDark);
  const [timeStr, setTimeStr] = useState('');
  const [dateStr, setDateStr] = useState('');

  // Reloj en tiempo real
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('es-ES', { 
          hour: '2-digit', 
          minute: '2-digit',
          second: '2-digit',
          hour12: true 
        })
      );
      setDateStr(
        now.toLocaleDateString('es-ES', { 
          weekday: 'short', 
          day: 'numeric', 
          month: 'short' 
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const currentSection = SECTION_MAP[activeTab] || { 
    label: activeTab?.toUpperCase() || 'INEFABLE', 
    icon: Activity, 
    group: 'Estación' 
  };
  const SectionIcon = currentSection.icon;

  return (
    <header 
      className="w-full flex items-center justify-between px-4 md:px-8 py-3.5 border-b backdrop-blur-xl transition-colors duration-300 z-30 sticky top-0"
      style={{
        backgroundColor: isDark ? 'rgba(12, 12, 15, 0.75)' : 'rgba(255, 255, 255, 0.82)',
        borderColor: isDark ? 'rgba(255, 255, 255, 0.07)' : 'rgba(0, 0, 0, 0.08)',
        boxShadow: isDark 
          ? '0 4px 20px -2px rgba(0, 0, 0, 0.5), inset 0 1px 0 0 rgba(255, 255, 255, 0.05)'
          : '0 2px 10px rgba(0, 0, 0, 0.04), inset 0 1px 0 0 rgba(255, 255, 255, 0.8)',
      }}
    >
      {/* ── SECCIÓN IZQUIERDA: BREADCRUMBS & TÍTULO DE VISTA ── */}
      <div className="flex items-center gap-3 min-w-0">
        <div 
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform duration-200"
          style={{
            background: isDark 
              ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.02))'
              : 'linear-gradient(135deg, rgba(0, 0, 0, 0.06), rgba(0, 0, 0, 0.02))',
            border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)'}`,
            color: t.accent,
          }}
        >
          <SectionIcon size={16} strokeWidth={2.2} />
        </div>

        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5 text-[10px] uppercase font-semibold tracking-wider text-neutral-500">
            <span>{currentSection.group}</span>
            <ChevronRight size={10} className="opacity-60" />
            <span style={{ color: t.accent }}>{currentSection.label}</span>
          </div>
          <h1 
            className="text-[14px] md:text-[15px] font-bold tracking-tight truncate m-0"
            style={{ color: t.text }}
          >
            {currentSection.label}
          </h1>
        </div>
      </div>

      {/* ── SECCIÓN CENTRAL: QUICK SEARCH COMMAND (DESKTOP) ── */}
      <div className="hidden md:flex items-center justify-center flex-1 max-w-md mx-6">
        <button
          onClick={onOpenCommandModal}
          className="w-full flex items-center justify-between px-3.5 py-1.5 rounded-xl border text-xs transition-all duration-200 group"
          style={{
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.07)' : 'rgba(0, 0, 0, 0.08)',
            color: t.textMuted,
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = isDark ? 'rgba(255, 255, 255, 0.16)' : 'rgba(0, 0, 0, 0.16)';
            e.currentTarget.style.backgroundColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = isDark ? 'rgba(255, 255, 255, 0.07)' : 'rgba(0, 0, 0, 0.08)';
            e.currentTarget.style.backgroundColor = isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)';
          }}
        >
          <div className="flex items-center gap-2">
            <Search size={13} className="text-neutral-500 group-hover:text-neutral-300 transition-colors" />
            <span className="text-[11px] font-medium text-neutral-400">Buscar comandos, préstamos, clientes...</span>
          </div>
          <div className="flex items-center gap-1 font-mono text-[10px] px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-neutral-400">
            <Command size={10} />
            <span>K</span>
          </div>
        </button>
      </div>

      {/* ── SECCIÓN DERECHA: STATUS, RELOJ Y PERFIL ── */}
      <div className="flex items-center gap-2.5 sm:gap-3 flex-shrink-0">
        
        {/* Reloj Digital Monospace (Desktop) */}
        <div 
          className="hidden xl:flex items-center gap-2 px-3 py-1 rounded-lg border"
          style={{
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)',
          }}
        >
          <span className="text-[10px] font-medium uppercase text-neutral-500 tracking-wider">
            {dateStr}
          </span>
          <span className="w-1 h-1 rounded-full bg-neutral-600" />
          <span className="num-tabular font-mono text-[11px] font-semibold text-neutral-300">
            {timeStr}
          </span>
        </div>

        {/* Indicador de Estado Supabase / En Línea */}
        <div 
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wide border"
          style={{
            backgroundColor: 'rgba(16, 185, 129, 0.08)',
            borderColor: 'rgba(16, 185, 129, 0.25)',
            color: '#34d399',
          }}
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-mono text-[9px] uppercase tracking-wider">Online</span>
        </div>

        {/* Indicador de IA Activa */}
        <div 
          className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium border"
          style={{
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.03)',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.07)' : 'rgba(0, 0, 0, 0.07)',
            color: t.textSecondary,
          }}
        >
          {settings?.aiProvider === 'deepseek' ? (
            <DeepSeek.Color size={13} />
          ) : (
            <Google.Color size={13} />
          )}
          <span className="text-[10px] font-semibold">
            {settings?.aiProvider === 'deepseek' ? 'DeepSeek' : 'Gemini AI'}
          </span>
        </div>

        {/* Separador vertical */}
        <div className="h-4 w-[1px] bg-white/10 hidden sm:block" />

        {/* Notificaciones Bell Icon */}
        <button
          onClick={() => setActiveTab('recordatorios')}
          className="relative p-2 rounded-xl transition-all duration-200 flex items-center justify-center"
          style={{
            backgroundColor: activeTab === 'recordatorios' ? t.accentSoft : 'transparent',
            color: activeTab === 'recordatorios' ? t.accent : t.textMuted,
          }}
          title="Notificaciones y Recordatorios"
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = t.hover; }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = activeTab === 'recordatorios' ? t.accentSoft : 'transparent'; }}
        >
          <Bell size={16} />
          {notificationCount > 0 && (
            <span 
              className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
              style={{ backgroundColor: '#EF4444', boxShadow: '0 0 8px #EF4444' }}
            />
          )}
        </button>

        {/* Selector de Modo Claro/Oscuro */}
        <button
          onClick={() => setIsDark(!isDark)}
          className="p-2 rounded-xl transition-all duration-200 flex items-center justify-center text-neutral-400 hover:text-neutral-200"
          title={isDark ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = t.hover; }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
        >
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* Perfil de Usuario con Avatar */}
        {googleUser ? (
          <button
            onClick={() => setActiveTab('configuracion')}
            className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl border transition-all duration-200 group"
            style={{
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
            }}
            title="Ir a Configuración de Cuenta"
          >
            <img 
              src={googleUser.picture || '/isologo_blanco.png'} 
              alt={googleUser.name} 
              className="w-6 h-6 rounded-lg object-cover border border-white/10"
            />
            <span 
              className="text-[11px] font-semibold max-w-[90px] truncate hidden sm:inline"
              style={{ color: t.text }}
            >
              {googleUser.name?.split(' ')[0]}
            </span>
          </button>
        ) : (
          <button
            onClick={() => setActiveTab('configuracion')}
            className="p-2 rounded-xl border transition-all duration-200"
            style={{
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
              color: t.textMuted,
            }}
            title="Configuración"
          >
            <Settings size={15} />
          </button>
        )}
      </div>
    </header>
  );
};

export default TopHeader;
