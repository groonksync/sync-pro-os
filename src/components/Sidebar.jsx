import React, { useState, useMemo } from 'react';
import { 
  LayoutDashboard, 
  Calendar, 
  Wallet, 
  Bell, 
  Settings, 
  LogOut,
  CreditCard,
  Package,
  TrendingUp,
  Activity,
  Video,
  Home,
  Briefcase,
  User,
  Cloud,
  Landmark,
  ListTodo,
  Trash2,
  ShoppingBag,
  ExternalLink,
  PanelLeftClose,
  PanelLeftOpen,
  Sun,
  Moon,
  Zap,
  BrainCircuit,
  StickyNote,
  ShieldCheck,
  Building2,
  Workflow,
  Image
} from 'lucide-react';
import { getTheme, useTheme } from '../lib/theme';

const Sidebar = ({ activeTab, setActiveTab, counts, settings, googleUser, isCollapsed, setIsCollapsed, isDark, setIsDark, sidebarBg }) => {
  const t = useTheme(isDark);
  const [hoveredItem, setHoveredItem] = useState(null);

  const handleOpenCatalog = () => {
    if (window.location.protocol === 'file:') {
      setActiveTab('catalogo');
    } else {
      window.open(window.location.origin + '/catalogo', '_blank');
    }
  };

  const menuItems = [
    { id: 'resumen', label: 'Centro de Control', icon: Activity },
    { id: 'prestamos', label: 'Préstamos', icon: Landmark, count: counts?.prestamos },
    { id: 'inventario', label: 'Empresa', icon: Building2 },
    { id: 'pagos', label: 'Mis Egresos', icon: Wallet },
    { id: 'editor', label: 'Editor de Video', icon: Video, count: counts?.meetings },
    { id: 'drive-sovereign', label: 'Almacenamiento', icon: Cloud },
    { id: 'calendar', label: 'Calendario', icon: Calendar },
    { id: 'recordatorios', label: 'Recordatorios', icon: Bell, count: counts?.notificaciones },
    { id: 'flujo-trabajo', label: 'Flujo de Trabajo', icon: Workflow },
    { id: 'conversor-imagenes', label: 'Conversor WebP', icon: Image },
    { id: 'boveda', label: 'Contraseñas', icon: ShieldCheck },
    { id: 'papelera', label: 'Papelera', icon: Trash2 },
  ];

  // Mobile navigation
  if (settings.isMobileMode) {
    return (
      <div className="fixed bottom-4 inset-x-4 z-[1000] animate-in slide-in-from-bottom-8 duration-700">
        <nav className="h-16 bg-[#252526]/90 border border-[#3c3c3c] backdrop-blur-2xl rounded-xl flex items-center justify-around px-2 shadow-2xl">
          {menuItems.slice(0, 5).map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className="relative flex flex-col items-center justify-center w-12 h-12 transition-all active:scale-75"
            >
              <div className={`transition-all duration-300 ${activeTab === item.id ? 'text-white' : 'text-[#6e6e6e]'}`} style={activeTab === item.id ? { color: t.accent } : {}}>
                <item.icon size={18} strokeWidth={activeTab === item.id ? 2.5 : 2} />
              </div>
              {activeTab === item.id && (
                <div className="absolute -bottom-1 w-1 h-1 rounded-xl animate-pulse" style={{ backgroundColor: t.accent }}></div>
              )}
            </button>
          ))}
          <div className="w-px h-6 bg-[#3c3c3c] mx-1"></div>
          <button 
            onClick={() => setActiveTab('configuracion')} 
            className="relative flex flex-col items-center justify-center w-12 h-12 transition-all active:scale-75"
          >
             <div className={`transition-all duration-300 ${activeTab === 'configuracion' ? 'text-white' : 'text-[#6e6e6e]'}`} style={activeTab === 'configuracion' ? { color: t.accent } : {}}>
                <Settings size={18} />
             </div>
             {activeTab === 'configuracion' && (
                <div className="absolute -bottom-1 w-1 h-1 rounded-xl animate-pulse" style={{ backgroundColor: t.accent }}></div>
             )}
          </button>
        </nav>
      </div>
    );
  }

  // Unified handler for menu item hover
  const handleItemMouseEnter = (e, itemId, isActive) => {
    setHoveredItem(itemId);
    if (!isActive) e.currentTarget.style.backgroundColor = t.hover;
  };
  const handleItemMouseLeave = (e, isActive) => {
    setHoveredItem(null);
    if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
  };

  return (
    <div 
      className={`${isCollapsed ? 'w-20' : 'w-64'} flex flex-col h-full py-6 px-3 transition-all duration-500 ease-in-out overflow-visible relative group/sidebar border-r`}
      style={{ backgroundColor: sidebarBg || t.bg, borderColor: t.border, transition: 'background-color 0.3s' }}
    >
      {/* Collapse button */}
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-12 w-6 h-6 rounded-xl flex items-center justify-center z-[100] transition-all duration-300 hover:scale-110 active:scale-90"
        style={{ backgroundColor: t.panel, border: `1px solid ${t.border}`, color: t.textMuted }}
      >
        {isCollapsed ? <PanelLeftOpen size={12} /> : <PanelLeftClose size={12} />}
      </button>

      {/* Main Navigation */}
      <nav className="flex-1 space-y-1">
        {menuItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
          <div key={item.id} className="relative flex items-center">
            <button
              onClick={() => setActiveTab(item.id)}
              onMouseEnter={(e) => handleItemMouseEnter(e, item.id, isActive)}
              onMouseLeave={(e) => handleItemMouseLeave(e, isActive)}
              className={`w-full flex items-center ${isCollapsed ? 'justify-center px-0' : 'justify-between px-3'} py-2.5 rounded-xl transition-all duration-200 relative group/item`}
              style={{
                backgroundColor: isActive ? t.accentSoft : 'transparent',
                color: isActive ? t.accent : t.textMuted,
              }}
            >
              <div className={`flex items-center ${isCollapsed ? 'gap-0' : 'gap-3'}`}>
                <div 
                  className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200"
                  style={{
                    backgroundColor: isActive ? t.accentSoft : 'transparent',
                  }}
                >
                  <item.icon size={16} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                {!isCollapsed && (
                  <span className="text-[11px] font-medium transition-all duration-200">
                    {item.label}
                  </span>
                )}
              </div>
              
              {!isCollapsed && item.count > 0 && (
                <span 
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-xl"
                  style={{
                    backgroundColor: isActive ? t.accentSoft : 'rgba(255,255,255,0.04)',
                    color: isActive ? t.accent : t.textDim,
                  }}
                >
                  {item.count}
                </span>
              )}

              {isCollapsed && item.count > 0 && (
                <div className="absolute top-1 right-1 w-2 h-2 rounded-xl" style={{ backgroundColor: t.accent }}></div>
              )}
            </button>

            {isCollapsed && hoveredItem === item.id && (
              <div className="absolute left-[75px] z-[200] px-3 py-1.5 rounded-xl text-[10px] font-medium whitespace-nowrap pointer-events-none animate-in fade-in slide-in-from-left-2 duration-200"
                style={{ backgroundColor: t.panel, border: `1px solid ${t.border}`, color: t.text }}>
                {item.label}
              </div>
            )}
          </div>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="mt-auto space-y-1 pt-4" style={{ borderTop: `1px solid ${t.border}` }}>
        
        {/* Theme Toggle */}
        <div className="relative flex items-center">
          <button 
            onClick={() => setIsDark(!isDark)}
            onMouseEnter={(e) => { setHoveredItem('theme-tip'); e.currentTarget.style.backgroundColor = t.hover; }}
            onMouseLeave={(e) => { setHoveredItem(null); e.currentTarget.style.backgroundColor = 'transparent'; }}
            className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 px-3'} py-2.5 rounded-xl transition-all`}
            style={{ color: t.textMuted }}
          >
            {isDark ? <Sun size={16} className="shrink-0" /> : <Moon size={16} className="shrink-0" />}
            {!isCollapsed && <span className="text-[11px] font-medium">{isDark ? 'Modo Día' : 'Modo Noche'}</span>}
          </button>
          {isCollapsed && hoveredItem === 'theme-tip' && (
            <div className="absolute left-[75px] z-[200] px-3 py-1.5 rounded-xl text-[10px] font-medium whitespace-nowrap"
              style={{ backgroundColor: t.panel, border: `1px solid ${t.border}`, color: t.text }}>
               {isDark ? 'Modo Día' : 'Modo Noche'}
            </div>
          )}
        </div>

        {/* Catalog */}
        <div className="relative flex items-center">
          <button 
            onClick={handleOpenCatalog}
            onMouseEnter={(e) => { setHoveredItem('catalogo-tip'); e.currentTarget.style.backgroundColor = t.hoverActive; }}
            onMouseLeave={(e) => { setHoveredItem(null); e.currentTarget.style.backgroundColor = t.accentSoft; }}
            className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 px-3'} py-2.5 rounded-xl transition-all`}
            style={{ backgroundColor: t.accentSoft, color: t.accent, border: `1px solid ${t.border}` }}
          >
            <ShoppingBag size={16} className="shrink-0" />
            {!isCollapsed && <span className="text-[11px] font-medium">Catálogo</span>}
          </button>
          {isCollapsed && hoveredItem === 'catalogo-tip' && (
            <div className="absolute left-[75px] z-[200] px-3 py-1.5 rounded-xl text-[10px] font-medium whitespace-nowrap"
              style={{ backgroundColor: t.accent, color: '#1e1e1e' }}>Ver Catálogo</div>
          )}
        </div>

        {/* Google User */}
        {googleUser && (
          <div className="relative flex items-center mt-2">
            <div className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 px-3'} py-2.5 rounded-xl`}
              style={{ backgroundColor: t.hover, border: `1px solid ${t.border}` }}>
              <img 
                src={googleUser.picture} 
                alt="" 
                className="w-7 h-7 rounded-xl shrink-0"
                style={{ border: `1px solid ${t.borderLight}` }}
              />
              {!isCollapsed && (
                <div className="overflow-hidden">
                  <p className="text-[11px] font-medium truncate" style={{ color: t.text }}>{googleUser.name}</p>
                  <p className="text-[9px]" style={{ color: t.textDim }}>Conectado</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Settings */}
        <div className="relative flex items-center">
          <button 
            onClick={() => setActiveTab('configuracion')}
            onMouseEnter={(e) => { setHoveredItem('config-tip'); if (activeTab !== 'configuracion') e.currentTarget.style.backgroundColor = t.hover; }}
            onMouseLeave={(e) => { setHoveredItem(null); if (activeTab !== 'configuracion') e.currentTarget.style.backgroundColor = 'transparent'; }}
            className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 px-3'} py-2.5 rounded-xl transition-all`}
            style={{
              backgroundColor: activeTab === 'configuracion' ? t.accentSoft : 'transparent',
              color: activeTab === 'configuracion' ? t.accent : t.textMuted,
            }}
          >
            <Settings size={16} className="shrink-0" />
            {!isCollapsed && <span className="text-[11px] font-medium">Configuración</span>}
          </button>
          {isCollapsed && hoveredItem === 'config-tip' && (
            <div className="absolute left-[75px] z-[200] px-3 py-1.5 rounded-xl text-[10px] font-medium whitespace-nowrap"
              style={{ backgroundColor: t.panel, border: `1px solid ${t.border}`, color: t.text }}>Ajustes</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
