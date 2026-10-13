import React, { useState } from 'react';
import {
  Home, Landmark, Wallet, Package, Bell, Settings, Dumbbell, Video,
  Briefcase, Image as ImageIcon, Trash2, Menu, X, Search, LogOut, ShoppingBag,
  Calculator, Command
} from 'lucide-react';
import { useTheme } from '../lib/theme';
import ThemeToggle from './ui/ThemeToggle';

// Ítems principales (siempre visibles) — un solo ícono por sección
export const MAIN_ITEMS = [
  { id: 'resumen',    label: 'Inicio',     icon: Home },
  { id: 'prestamos',  label: 'Préstamos',  icon: Landmark },
  { id: 'pagos',      label: 'Egresos',    icon: Wallet },
  { id: 'inventario', label: 'Inventario', icon: Package },
];

// Módulos extra: grupo inferior en escritorio, hoja "Menú" en móvil
export const EXTRA_ITEMS = [
  { id: 'gimnasio',           label: 'Gimnasio',       icon: Dumbbell },
  { id: 'editor',             label: 'Agencia',        icon: Video },
  { id: 'proyectos-edicion',  label: 'Proyectos',      icon: Briefcase },
  { id: 'recordatorios',      label: 'Recordatorios',  icon: Bell },
  { id: 'conversor-imagenes', label: 'Conversor WebP', icon: ImageIcon },
  { id: 'papelera',           label: 'Papelera',       icon: Trash2 },
];

const getBadge = (id, counts) => {
  if (id === 'prestamos') return counts?.prestamos || 0;
  if (id === 'recordatorios') return counts?.notificaciones || 0;
  if (id === 'editor') return counts?.meetings || 0;
  return 0;
};

// Glifo orgánico redondeado idéntico al logotipo de las propuestas conceptuales
export const LogoGlyph = ({ size = 26, isDark = true }) => (
  <svg width={size} height={size} viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path
      d="M6 7.5C6 4.46243 8.46243 2 11.5 2H16.5C22.299 2 27 6.70101 27 12.5C27 18.299 22.299 23 16.5 23H10.5C8.01472 23 6 20.9853 6 18.5V7.5Z"
      fill={isDark ? '#E5E7EB' : '#1F2937'}
    />
  </svg>
);

const openCatalog = (setActiveTab) => {
  if (window.location.protocol === 'file:') setActiveTab('catalogo');
  else window.open(window.location.origin + '/catalogo', '_blank');
};

/* ─────────────────────────────────────────────────────────────
   NAVEGACIÓN: barra lateral (escritorio) / barra inferior (móvil)
   ───────────────────────────────────────────────────────────── */
export default function AppNav({ activeTab, setActiveTab, counts, settings, isDark }) {
  const t = useTheme(isDark);
  const [tooltip, setTooltip] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const isMobile = !!settings?.isMobileMode;

  /* ── MÓVIL ───────────────────────────────────────────────── */
  if (isMobile) {
    const bottomItems = [MAIN_ITEMS[0], MAIN_ITEMS[2], MAIN_ITEMS[1], MAIN_ITEMS[3]]; // Inicio, Pagos, Préstamos, Inventario
    const sheetItems = [
      ...EXTRA_ITEMS,
      { id: 'configuracion', label: 'Ajustes', icon: Settings },
      { id: '__catalogo', label: 'Catálogo', icon: ShoppingBag },
      { id: 'logout-google', label: 'Salir', icon: LogOut },
    ];
    const extraActive = EXTRA_ITEMS.some((i) => i.id === activeTab) || activeTab === 'configuracion';

    return (
      <>
        {menuOpen && (
          <div
            className="fixed inset-0 z-[60] flex flex-col"
            style={{ backgroundColor: t.overlay, backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}
          >
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <span className="text-sm font-semibold" style={{ color: t.text }}>Menú</span>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: t.surface, color: t.text }}
                aria-label="Cerrar menú"
              >
                <X size={18} />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-3 px-5 pb-28 overflow-y-auto mac-scrollbar">
              {sheetItems.map((item) => {
                const Icon = item.icon;
                const active = activeTab === item.id;
                const badge = getBadge(item.id, counts);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      if (item.id === '__catalogo') openCatalog(setActiveTab);
                      else setActiveTab(item.id);
                      setMenuOpen(false);
                    }}
                    className="relative flex flex-col items-center justify-center gap-2 rounded-2xl py-4 min-h-[88px]"
                    style={{
                      backgroundColor: active ? t.surface : t.card,
                      border: `1px solid ${active ? t.borderLight : t.border}`,
                      color: active ? t.text : t.textSecondary,
                    }}
                  >
                    <Icon size={22} strokeWidth={1.8} />
                    <span className="text-[11px] font-medium text-center leading-tight">{item.label}</span>
                    {badge > 0 && (
                      <span
                        className="absolute top-2 right-2 min-w-[16px] h-4 px-1 rounded-full text-[9px] font-bold flex items-center justify-center"
                        style={{ backgroundColor: t.text, color: t.bg }}
                      >
                        {badge > 9 ? '9+' : badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <nav
          className="fixed bottom-0 inset-x-0 z-[70] flex items-center justify-around px-2"
          style={{
            height: 64,
            paddingBottom: 'env(safe-area-inset-bottom)',
            backgroundColor: t.panel,
            borderTop: `1px solid ${t.border}`,
          }}
        >
          {bottomItems.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id && !menuOpen;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => { setActiveTab(item.id); setMenuOpen(false); }}
                className="relative flex flex-col items-center justify-center gap-0.5 w-16 h-14 rounded-xl"
                style={{ color: active ? t.text : t.textMuted, backgroundColor: active ? t.surface : 'transparent' }}
                aria-label={item.label}
              >
                <Icon size={20} strokeWidth={active ? 2.1 : 1.7} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="relative flex flex-col items-center justify-center gap-0.5 w-16 h-14 rounded-xl"
            style={{
              color: menuOpen || extraActive ? t.text : t.textMuted,
              backgroundColor: menuOpen || extraActive ? t.surface : 'transparent',
            }}
            aria-label="Menú"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
            <span className="text-[10px] font-medium">Menú</span>
          </button>
        </nav>
      </>
    );
  }

  /* ── ESCRITORIO: barra lateral de íconos ─────────────────── */
  const railBtn = (item, group) => {
    const Icon = item.icon;
    const active = activeTab === item.id;
    const badge = getBadge(item.id, counts);
    return (
      <div key={item.id} className="relative">
        <button
          type="button"
          onClick={() => (item.id === '__catalogo' ? openCatalog(setActiveTab) : setActiveTab(item.id))}
          onMouseEnter={() => setTooltip(`${group}-${item.id}`)}
          onMouseLeave={() => setTooltip(null)}
          className="relative w-10 h-10 rounded-xl flex items-center justify-center transition-colors"
          style={{
            color: active ? t.text : t.textMuted,
            backgroundColor: active ? t.surface : 'transparent',
            border: `1px solid ${active ? t.border : 'transparent'}`,
          }}
          aria-label={item.label}
          aria-current={active ? 'page' : undefined}
        >
          <Icon size={19} strokeWidth={active ? 2.1 : 1.7} />
          {badge > 0 && (
            <span
              className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
              style={{ backgroundColor: '#F59E0B', border: `1.5px solid ${t.panel}` }}
            />
          )}
        </button>
        {tooltip === `${group}-${item.id}` && (
          <div
            className="absolute left-12 top-1/2 -translate-y-1/2 z-50 px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap pointer-events-none"
            style={{ backgroundColor: t.text, color: t.bg }}
          >
            {item.label}{badge > 0 ? ` · ${badge}` : ''}
          </div>
        )}
      </div>
    );
  };

  return (
    <aside
      className="flex flex-col items-center gap-1 py-3 shrink-0 h-full"
      style={{ width: 64, backgroundColor: t.panel, borderRight: `1px solid ${t.border}` }}
    >
      <button
        type="button"
        onClick={() => setActiveTab('resumen')}
        className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-transform hover:scale-105 active:scale-95"
        aria-label="Inefable"
        title="Inefable"
      >
        <LogoGlyph size={26} isDark={isDark} />
      </button>

      <nav className="flex flex-col items-center gap-1">
        {MAIN_ITEMS.map((i) => railBtn(i, 'main'))}
      </nav>

      <div className="w-6 my-2" style={{ borderTop: `1px solid ${t.border}` }} />

      <nav className="flex flex-col items-center gap-1 overflow-y-auto mac-scrollbar flex-1 min-h-0">
        {EXTRA_ITEMS.map((i) => railBtn(i, 'extra'))}
        {railBtn({ id: '__catalogo', label: 'Catálogo público', icon: ShoppingBag }, 'extra')}
      </nav>

      <div className="flex flex-col items-center gap-1 pt-2" style={{ borderTop: `1px solid ${t.border}` }}>
        {railBtn({ id: 'configuracion', label: 'Ajustes', icon: Settings }, 'foot')}
      </div>
    </aside>
  );
}

/* ─────────────────────────────────────────────────────────────
   CABECERA: escritorio (buscador + tema + avatar) / móvil (logo + tema + avatar)
   ───────────────────────────────────────────────────────────── */
export function TopBar({
  activeTab,
  setActiveTab,
  counts,
  settings,
  googleUser,
  isDark,
  setIsDark,
  onSearch,
  onOpenCommandPalette,
  onOpenSimulador
}) {
  const t = useTheme(isDark);
  const [q, setQ] = useState('');
  const isMobile = !!settings?.isMobileMode;
  const notif = counts?.notificaciones || 0;

  const handleSearch = (e) => {
    setQ(e.target.value);
    if (onSearch) onSearch(e.target.value);
  };

  const avatar = googleUser?.picture ? (
    <img src={googleUser.picture} alt="" className="w-8 h-8 rounded-full object-cover" style={{ border: `1px solid ${t.border}` }} />
  ) : (
    <div
      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
      style={{ backgroundColor: t.surface, color: t.textSecondary, border: `1px solid ${t.border}` }}
    >
      {(googleUser?.name || 'U').charAt(0).toUpperCase()}
    </div>
  );

  return (
    <header
      className="flex items-center justify-between gap-3 px-4 sm:px-6 shrink-0"
      style={{ height: 56, backgroundColor: t.bg, borderBottom: `1px solid ${t.border}` }}
    >
      {isMobile ? (
        <div className="flex items-center gap-2">
          <LogoGlyph size={24} isDark={isDark} />
          <span className="text-sm font-bold tracking-tight" style={{ color: t.text }}>Inefable</span>
        </div>
      ) : (
        <div className="flex items-center gap-2 w-full max-w-sm">
          <div
            className="flex items-center gap-2 px-3 h-9 rounded-xl w-full transition-all border"
            style={{ backgroundColor: t.inputBg, borderColor: t.border }}
          >
            <Search size={14} style={{ color: t.textMuted }} />
            <input
              type="text"
              value={q}
              onChange={handleSearch}
              placeholder="Buscar o presiona ⌘K…"
              className="bg-transparent text-xs w-full focus:outline-none"
              style={{ color: t.text }}
            />
            {q ? (
              <button type="button" onClick={() => { setQ(''); if (onSearch) onSearch(''); }} style={{ color: t.textMuted }} aria-label="Limpiar">
                <X size={12} />
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenCommandPalette}
                className="hidden sm:flex items-center gap-0.5 text-[10px] font-mono px-1.5 py-0.5 rounded border transition-opacity hover:opacity-80"
                style={{
                  backgroundColor: isDark ? '#1C1C1E' : '#F3F4F6',
                  borderColor: t.borderLight || t.border,
                  color: t.textMuted,
                }}
                title="Abrir barra de comandos (Cmd+K)"
              >
                <span>⌘</span>K
              </button>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 shrink-0">
        {/* Botón rápido de Command Palette en móvil */}
        {isMobile && onOpenCommandPalette && (
          <button
            type="button"
            onClick={onOpenCommandPalette}
            className="w-9 h-9 rounded-xl flex items-center justify-center border transition-opacity hover:opacity-80"
            style={{ backgroundColor: t.surface, color: t.textSecondary, borderColor: t.border }}
            aria-label="Buscar comandos"
            title="Buscar o comandos"
          >
            <Search size={16} />
          </button>
        )}

        {/* Botón Simulador Financiero */}
        {onOpenSimulador && (
          <button
            type="button"
            onClick={onOpenSimulador}
            className="h-9 px-2.5 sm:px-3 rounded-xl flex items-center gap-1.5 text-xs font-semibold border transition-all hover:opacity-90 shadow-sm"
            style={{
              backgroundColor: isDark ? '#232326' : '#FFFFFF',
              borderColor: t.borderLight || t.border,
              color: t.text,
            }}
            title="Simulador de Crédito & Retornos"
          >
            <Calculator size={14} />
            <span className="hidden sm:inline">Simulador</span>
          </button>
        )}

        <ThemeToggle isDark={isDark} setIsDark={setIsDark} />

        {!isMobile && (
          <button
            type="button"
            onClick={() => setActiveTab('recordatorios')}
            className="relative w-9 h-9 rounded-xl flex items-center justify-center border"
            style={{ backgroundColor: t.surface, color: t.textSecondary, borderColor: t.border }}
            aria-label="Notificaciones"
          >
            <Bell size={16} />
            {notif > 0 && (
              <span
                className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full text-[9px] font-bold flex items-center justify-center"
                style={{ backgroundColor: t.text, color: t.bg }}
              >
                {notif > 9 ? '9+' : notif}
              </span>
            )}
          </button>
        )}
        <button type="button" onClick={() => setActiveTab('configuracion')} aria-label="Perfil y ajustes" title="Ajustes">
          {avatar}
        </button>
      </div>
    </header>
  );
}
