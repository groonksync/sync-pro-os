import React, { useState, useRef, useEffect } from 'react';
import { 
  LayoutDashboard, Wallet, Bell, Settings, CreditCard,
  Package, TrendingUp, Activity, Video, Briefcase,
  Landmark, Trash2, ShoppingBag, Sun, Moon, Building2,
  Image, Menu, X, Dumbbell, ChevronDown, Search, Sparkles,
  ExternalLink, User, LogOut, Check
} from 'lucide-react';
import { useTheme } from '../lib/theme';

const MAIN_NAV_ITEMS = [
  { id: 'resumen',    label: 'Dashboard',             icon: LayoutDashboard },
  { id: 'prestamos',  label: 'Clientes & Préstamos',  icon: Landmark },
  { id: 'inventario', label: 'Inventario & Vitrina',  icon: Package },
  { id: 'pagos',      label: 'Flujo & Egresos',       icon: Wallet },
];

const EXTRA_MODULES = [
  { id: 'gimnasio',          label: 'Sistema Gimnasio',     category: 'Sistemas',      icon: Dumbbell },
  { id: 'editor',            label: 'Agencia de Marketing', category: 'Agencia',       icon: Video },
  { id: 'proyectos-edicion', label: 'Proyectos de Edición', category: 'Agencia',       icon: Briefcase },
  { id: 'recordatorios',     label: 'Recordatorios',        category: 'Herramientas',  icon: Bell },
  { id: 'conversor-imagenes',label: 'Conversor WebP',       category: 'Herramientas',  icon: Image },
  { id: 'papelera',          label: 'Papelera',             category: 'Herramientas',  icon: Trash2 },
];

export default function HorizonBar({
  activeTab,
  setActiveTab,
  counts,
  settings,
  googleUser,
  isDark,
  setIsDark,
  onSearch,
}) {
  const t = useTheme(isDark);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const menuRef = useRef(null);
  const userMenuRef = useRef(null);

  // Cerrar menús al hacer click afuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOpenCatalog = () => {
    if (window.location.protocol === 'file:') setActiveTab('catalogo');
    else window.open(window.location.origin + '/catalogo', '_blank');
  };

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchValue(val);
    if (onSearch) onSearch(val);
  };

  const isExtraActive = EXTRA_MODULES.some(m => m.id === activeTab);
  const activeExtraItem = EXTRA_MODULES.find(m => m.id === activeTab);

  return (
    <header className="w-full sticky top-0 z-50 px-3 sm:px-6 py-2.5 transition-all duration-300">
      <div 
        className="w-full max-w-[2000px] mx-auto h-14 rounded-2xl px-4 flex items-center justify-between gap-3 shadow-2xl backdrop-blur-2xl transition-all duration-300 border"
        style={{
          backgroundColor: isDark ? 'rgba(18, 19, 24, 0.88)' : 'rgba(255, 255, 255, 0.92)',
          borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
          boxShadow: isDark ? '0 10px 35px -5px rgba(0, 0, 0, 0.6)' : '0 10px 30px -5px rgba(0, 0, 0, 0.08)',
        }}
      >
        {/* ── 1. LOGOTIPO DE MARCA ── */}
        <div className="flex items-center gap-3 shrink-0">
          <button 
            onClick={() => setActiveTab('resumen')}
            className="flex items-center gap-2.5 focus:outline-none group text-left"
          >
            <div 
              className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm transition-transform group-hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, #10B981, #059669)',
                color: '#FFFFFF',
                boxShadow: '0 2px 10px rgba(16, 185, 129, 0.35)',
              }}
            >
              I
            </div>
            <div className="hidden sm:block">
              <span 
                className="font-bold text-base tracking-tight leading-none block"
                style={{ color: isDark ? '#FFFFFF' : '#111827' }}
              >
                Inefable
              </span>
              <span 
                className="text-[9px] font-semibold uppercase tracking-wider block opacity-60"
                style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}
              >
                Spatial Bento OS
              </span>
            </div>
          </button>
        </div>

        {/* ── 2. PÍLDORAS DE NAVEGACIÓN PRINCIPAL (HORIZON PILLS) ── */}
        <nav className="hidden lg:flex items-center gap-1.5 p-1 rounded-xl border"
             style={{
               backgroundColor: isDark ? 'rgba(0, 0, 0, 0.25)' : 'rgba(0, 0, 0, 0.03)',
               borderColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
             }}>
          {MAIN_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const badgeCount = item.id === 'prestamos' ? counts?.prestamos : null;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`relative flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 select-none ${
                  isActive
                    ? 'text-white shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/[0.04]'
                }`}
                style={{
                  backgroundColor: isActive 
                    ? (isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)') 
                    : 'transparent',
                  color: isActive ? (isDark ? '#FFFFFF' : '#111827') : undefined,
                }}
              >
                <Icon size={14} className={isActive ? 'text-emerald-400' : 'opacity-70'} />
                <span>{item.label}</span>

                {/* Badge contador */}
                {badgeCount != null && badgeCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold bg-white/[0.1] text-emerald-300 border border-white/10">
                    {badgeCount}
                  </span>
                )}

                {/* Indicador de píldora activa */}
                {isActive && (
                  <span 
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full bg-emerald-400"
                    style={{ boxShadow: '0 0 8px #10B981' }}
                  />
                )}
              </button>
            );
          })}

          {/* MENÚ DESPLEGABLE "MÁS MÓDULOS" */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                isExtraActive
                  ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/[0.04]'
              }`}
            >
              <span>{isExtraActive && activeExtraItem ? activeExtraItem.label : 'Más'}</span>
              <ChevronDown size={13} className={`transition-transform duration-200 ${menuOpen ? 'rotate-180' : ''}`} />
            </button>

            {menuOpen && (
              <div 
                className="absolute left-0 mt-2 w-60 rounded-2xl p-2 shadow-2xl border backdrop-blur-2xl z-50 animate-in fade-in zoom-in-95 duration-150"
                style={{
                  backgroundColor: isDark ? 'rgba(22, 23, 29, 0.96)' : 'rgba(255, 255, 255, 0.98)',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                }}
              >
                <div className="text-[9px] font-bold uppercase tracking-wider text-neutral-400 px-2.5 py-1">
                  Módulos Especializados
                </div>
                <div className="space-y-0.5">
                  {EXTRA_MODULES.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveTab(item.id);
                          setMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium transition-all text-left ${
                          isActive
                            ? 'bg-emerald-500/15 text-emerald-300 font-bold'
                            : 'text-neutral-300 hover:text-white hover:bg-white/[0.06]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon size={14} className={isActive ? 'text-emerald-400' : 'text-neutral-400'} />
                          <span>{item.label}</span>
                        </div>
                        {isActive && <Check size={13} className="text-emerald-400" />}
                      </button>
                    );
                  })}
                </div>

                <div className="my-1.5 border-t border-white/[0.06]" />

                <button
                  onClick={() => {
                    handleOpenCatalog();
                    setMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium text-neutral-300 hover:text-white hover:bg-white/[0.06] transition-all text-left"
                >
                  <div className="flex items-center gap-2.5">
                    <ShoppingBag size={14} className="text-amber-400" />
                    <span>Catálogo Público Web</span>
                  </div>
                  <ExternalLink size={12} className="text-neutral-500" />
                </button>
              </div>
            )}
          </div>
        </nav>

        {/* ── 3. BUSCADOR GLOBAL HORIZONTAL ── */}
        <div className="flex-1 max-w-xs md:max-w-sm hidden sm:block">
          <div 
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all"
            style={{
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.04)',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.08)',
            }}
          >
            <Search size={14} className="text-neutral-400 shrink-0" />
            <input
              type="text"
              value={searchValue}
              onChange={handleSearchChange}
              placeholder="Buscar clientes, préstamos, productos... (Ctrl+K)"
              className="bg-transparent text-xs w-full focus:outline-none"
              style={{ color: isDark ? '#FFFFFF' : '#111827' }}
            />
            {searchValue && (
              <button 
                onClick={() => { setSearchValue(''); if (onSearch) onSearch(''); }}
                className="text-neutral-400 hover:text-white"
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        {/* ── 4. BOTONES DE ACCIÓN RÁPIDA DERECHA ── */}
        <div className="flex items-center gap-2 shrink-0">
          
          {/* Conmutador Modo Oscuro / Claro */}
          <button
            onClick={() => setIsDark(!isDark)}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all border"
            style={{
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.04)',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
              color: isDark ? '#F3F4F6' : '#1F2937',
            }}
            title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          >
            {isDark ? <Sun size={15} /> : <Moon size={15} />}
          </button>

          {/* Notificaciones */}
          {counts?.notificaciones != null && (
            <button
              onClick={() => setActiveTab('recordatorios')}
              className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-all border"
              style={{
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.04)',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
                color: isDark ? '#F3F4F6' : '#1F2937',
              }}
              title="Notificaciones y avisos pendientes"
            >
              <Bell size={15} />
              {counts.notificaciones > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-black font-bold font-mono text-[9px] flex items-center justify-center shadow-lg">
                  {counts.notificaciones}
                </span>
              )}
            </button>
          )}

          {/* Botón Acceso a Ajustes */}
          <button
            onClick={() => setActiveTab('configuracion')}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all border ${
              activeTab === 'configuracion'
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                : 'text-neutral-400 hover:text-white border-white/10 hover:bg-white/[0.06]'
            }`}
            style={{
              backgroundColor: activeTab === 'configuracion'
                ? 'rgba(16, 185, 129, 0.15)'
                : (isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.04)'),
            }}
            title="Ajustes & Preferencias"
          >
            <Settings size={15} />
          </button>

          {/* Perfil de Usuario Google */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 p-1 rounded-xl border transition-all hover:bg-white/[0.06]"
              style={{
                borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
              }}
            >
              {googleUser?.picture ? (
                <img 
                  src={googleUser.picture} 
                  alt={googleUser.name || 'User'} 
                  className="w-7 h-7 rounded-lg object-cover" 
                />
              ) : (
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-xs">
                  {googleUser?.name?.charAt(0) || 'U'}
                </div>
              )}
            </button>

            {userMenuOpen && (
              <div 
                className="absolute right-0 mt-2 w-56 rounded-2xl p-2.5 shadow-2xl border backdrop-blur-2xl z-50 animate-in fade-in zoom-in-95 duration-150"
                style={{
                  backgroundColor: isDark ? 'rgba(22, 23, 29, 0.96)' : 'rgba(255, 255, 255, 0.98)',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                }}
              >
                <div className="px-2.5 py-1.5">
                  <p className="text-xs font-bold text-white truncate m-0">
                    {googleUser?.name || 'Administrador'}
                  </p>
                  <p className="text-[10px] text-neutral-400 truncate m-0 mt-0.5">
                    {googleUser?.email || 'Sesión Google Activa'}
                  </p>
                </div>
                <div className="my-1.5 border-t border-white/[0.06]" />
                <button
                  onClick={() => {
                    setActiveTab('configuracion');
                    setUserMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs text-neutral-300 hover:text-white hover:bg-white/[0.06] transition-all text-left"
                >
                  <Settings size={13} />
                  <span>Configuración del Sistema</span>
                </button>
                <button
                  onClick={() => {
                    setActiveTab('logout-google');
                    setUserMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs text-rose-400 hover:bg-rose-500/10 transition-all text-left"
                >
                  <LogOut size={13} />
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            )}
          </div>

          {/* Botón Menú Móvil Hamburger */}
          <button
            onClick={() => setMobileDrawerOpen(!mobileDrawerOpen)}
            className="lg:hidden w-9 h-9 rounded-xl flex items-center justify-center border text-neutral-300"
            style={{
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.04)',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
            }}
          >
            {mobileDrawerOpen ? <X size={17} /> : <Menu size={17} />}
          </button>
        </div>
      </div>

      {/* ── 5. DRAWER MÓVIL RESPONSIVO ── */}
      {mobileDrawerOpen && (
        <div 
          className="lg:hidden fixed inset-x-3 top-20 z-50 rounded-2xl p-4 shadow-2xl border backdrop-blur-3xl animate-in slide-in-from-top-4 duration-200"
          style={{
            backgroundColor: isDark ? 'rgba(18, 19, 25, 0.98)' : 'rgba(255, 255, 255, 0.98)',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.1)',
          }}
        >
          <div className="space-y-1">
            <div className="text-[10px] font-black uppercase tracking-wider text-neutral-500 px-2 py-1">
              Navegación Principal
            </div>
            {MAIN_NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileDrawerOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive 
                      ? 'bg-emerald-500/20 text-emerald-300 font-bold'
                      : 'text-neutral-300 hover:bg-white/[0.06]'
                  }`}
                >
                  <Icon size={16} className={isActive ? 'text-emerald-400' : 'text-neutral-400'} />
                  <span>{item.label}</span>
                </button>
              );
            })}

            <div className="text-[10px] font-black uppercase tracking-wider text-neutral-500 px-2 pt-3 pb-1">
              Más Herramientas
            </div>
            {EXTRA_MODULES.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileDrawerOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    isActive 
                      ? 'bg-emerald-500/20 text-emerald-300 font-bold'
                      : 'text-neutral-400 hover:bg-white/[0.06]'
                  }`}
                >
                  <Icon size={15} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
}
