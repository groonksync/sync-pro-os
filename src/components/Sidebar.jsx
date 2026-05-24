import React, { useState } from 'react';
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
  ShieldCheck
} from 'lucide-react';

const Sidebar = ({ activeTab, setActiveTab, counts, settings, googleUser, isCollapsed, setIsCollapsed, isDark, setIsDark }) => {
  const [hoveredItem, setHoveredItem] = useState(null);

  const handleOpenCatalog = () => {
    window.open(window.location.origin + '/catalogo', '_blank');
  };

  const menuItems = [
    { id: 'resumen', label: 'Centro de Control', icon: Activity },
    { id: 'prestamos', label: 'Cartera Préstamos', icon: Landmark, count: counts?.prestamos },
    { id: 'inventario', label: 'Inventario Pro', icon: Package },
    { id: 'pagos', label: 'Mis Egresos', icon: Wallet },
    { id: 'editor', label: 'Editor de Video', icon: Video, count: counts?.meetings },
    { id: 'drive-sovereign', label: 'Drive Sovereign', icon: Cloud },
    { id: 'calendar', label: 'Google Calendar', icon: Calendar },
    { id: 'recordatorios', label: 'Recordatorios', icon: Bell, count: counts?.notificaciones },
    { id: 'notas', label: 'Notas', icon: StickyNote },
    { id: 'boveda', label: 'Bóveda Pass', icon: ShieldCheck },
    { id: 'papelera', label: 'Papelera', icon: Trash2 },
  ];

  const accentStyle = {
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
    color: isDark ? '#ffffff' : '#000000',
    border: isDark ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(0, 0, 0, 0.05)',
  };

  // NAVEGACIÓN MÓVIL ULTRA-REFINADA (ESTILO ISLA)
  if (settings.isMobileMode) {
    return (
      <div className="fixed bottom-4 inset-x-4 z-[1000] animate-in slide-in-from-bottom-8 duration-700">
        <nav className={`h-16 ${isDark ? 'bg-[#1a1a1a]/80 border-white/5' : 'bg-white/80 border-neutral-200'} backdrop-blur-2xl border rounded-3xl flex items-center justify-around px-2 shadow-2xl`}>
          {menuItems.slice(0, 5).map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className="relative flex flex-col items-center justify-center w-12 h-12 transition-all active:scale-75"
            >
              <div className={`transition-all duration-300 ${activeTab === item.id ? 'text-white' : 'text-neutral-500'}`} style={activeTab === item.id ? { color: settings.accentColor } : {}}>
                <item.icon size={18} strokeWidth={activeTab === item.id ? 2.5 : 2} />
              </div>
              {activeTab === item.id && (
                <div className="absolute -bottom-1 w-1 h-1 rounded-full animate-pulse" style={{ backgroundColor: settings.accentColor }}></div>
              )}
            </button>
          ))}
          <div className="w-px h-6 bg-white/10 mx-1"></div>
          <button 
            onClick={() => setActiveTab('configuracion')} 
            className="relative flex flex-col items-center justify-center w-12 h-12 transition-all active:scale-75"
          >
             <div className={`transition-all duration-300 ${activeTab === 'configuracion' ? 'text-white' : 'text-neutral-500'}`} style={activeTab === 'configuracion' ? { color: settings.accentColor } : {}}>
                <Settings size={18} />
             </div>
             {activeTab === 'configuracion' && (
                <div className="absolute -bottom-1 w-1 h-1 rounded-full animate-pulse" style={{ backgroundColor: settings.accentColor }}></div>
             )}
          </button>
        </nav>
      </div>
    );
  }

  return (
    <div className={`${isCollapsed ? 'w-24' : 'w-64'} ${isDark ? 'bg-[#09090b] border-white/5' : 'bg-white border-neutral-200'} border-r flex flex-col h-full py-8 px-4 transition-all duration-700 ease-in-out overflow-visible relative group/sidebar`}>
      
      {/* BOTÓN DE COLAPSO PROFESIONAL */}
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className={`absolute -right-4 top-12 w-8 h-8 ${isDark ? 'bg-[#121212] text-neutral-500 hover:text-white' : 'bg-white text-neutral-400 hover:text-black'} rounded-xl flex items-center justify-center shadow-2xl border border-white/10 z-[100] transition-all duration-500 hover:scale-110 active:scale-90`}
      >
        {isCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
      </button>

      {/* LOGO */}
      <div className="mb-10 px-2 flex items-center gap-4">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-lg" style={{ backgroundColor: settings.accentColor }}>
          <Zap size={18} className={(settings.accentColor === '#ffffff') ? 'text-black' : 'text-white'} fill="currentColor" />
        </div>
        {!isCollapsed && (
          <div className="animate-in fade-in slide-in-from-left-4 duration-500">
            <h1 className={`text-sm font-black uppercase tracking-[0.3em] ${isDark ? 'text-white' : 'text-neutral-900'}`}>Sync Pro</h1>
            <p className="text-[9px] text-neutral-500 font-bold uppercase tracking-widest">Sovereign OS</p>
          </div>
        )}
      </div>

      {/* NAVEGACIÓN PRINCIPAL */}
      <nav className="flex-1 space-y-2">
        {menuItems.map((item) => (
          <div key={item.id} className="relative flex items-center">
            <button
              onClick={() => setActiveTab(item.id)}
              onMouseEnter={() => setHoveredItem(item.id)}
              onMouseLeave={() => setHoveredItem(null)}
              className={`w-full flex items-center ${isCollapsed ? 'justify-center px-0' : 'justify-between px-4'} py-3 rounded-2xl transition-all duration-300 relative group/item ${
                activeTab === item.id ? 'shadow-2xl' : `${isDark ? 'text-neutral-500 hover:text-white hover:bg-white/5' : 'text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100'}`
              }`}
              style={activeTab === item.id ? accentStyle : {}}
            >
              <div className={`flex items-center ${isCollapsed ? 'gap-0' : 'gap-4'}`}>
                <item.icon size={20} strokeWidth={activeTab === item.id ? 2.5 : 2} className="shrink-0" />
                {!isCollapsed && (
                  <span className={`text-[11px] font-black uppercase tracking-widest transition-all duration-500 animate-in fade-in slide-in-from-left-2`}>
                    {item.label}
                  </span>
                )}
              </div>
              
              {!isCollapsed && item.count > 0 && (
                <span className={`text-[9px] px-2 py-0.5 rounded-full font-black ${
                  activeTab === item.id ? 'bg-black/20 text-black' : 'bg-neutral-500/10 text-neutral-500 group-hover/item:bg-neutral-500/20'
                }`}>
                  {item.count}
                </span>
              )}

              {isCollapsed && item.count > 0 && (
                <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border border-[#121212] animate-pulse"></div>
              )}
            </button>

            {isCollapsed && hoveredItem === item.id && (
              <div className={`absolute left-[85px] z-[200] px-4 py-2 ${isDark ? 'bg-white text-black' : 'bg-neutral-900 text-white'} text-[9px] font-black uppercase tracking-widest rounded-xl shadow-2xl animate-in fade-in slide-in-from-left-4 duration-300 pointer-events-none whitespace-nowrap border border-white/20 backdrop-blur-md`}>
                {item.label}
                <div className={`absolute left-[-4px] top-1/2 -translate-y-1/2 w-2 h-2 ${isDark ? 'bg-white' : 'bg-neutral-900'} rotate-45`}></div>
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* ACCIONES INFERIORES */}
      <div className="mt-auto space-y-4 pt-6 border-t border-white/5">
        
        {/* BOTÓN DE TEMA */}
        <div className="relative flex items-center">
          <button 
            onClick={() => setIsDark(!isDark)}
            onMouseEnter={() => setHoveredItem('theme-tip')}
            onMouseLeave={() => setHoveredItem(null)}
            className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'gap-4 px-4'} py-3 rounded-2xl transition-all ${isDark ? 'text-neutral-500 hover:text-amber-400 hover:bg-white/5' : 'text-neutral-400 hover:text-blue-600 hover:bg-neutral-100'}`}
          >
            {isDark ? <Sun size={20} className="shrink-0" /> : <Moon size={20} className="shrink-0" />}
            {!isCollapsed && <span className="text-[10px] font-black uppercase tracking-widest animate-in fade-in duration-500">{isDark ? 'Modo Día' : 'Modo Noche'}</span>}
          </button>
          {isCollapsed && hoveredItem === 'theme-tip' && (
            <div className={`absolute left-[85px] z-[200] px-4 py-2 ${isDark ? 'bg-amber-400 text-black' : 'bg-blue-600 text-white'} text-[9px] font-black uppercase tracking-widest rounded-xl shadow-xl animate-in fade-in slide-in-from-left-4 duration-300 pointer-events-none whitespace-nowrap`}>
               {isDark ? 'Modo Día' : 'Modo Noche'}
            </div>
          )}
        </div>

        <div className="relative flex items-center">
          <button 
            onClick={handleOpenCatalog}
            onMouseEnter={() => setHoveredItem('catalogo-tip')}
            onMouseLeave={() => setHoveredItem(null)}
            className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'gap-4 px-4'} py-4 bg-blue-600/10 border border-blue-500/20 rounded-2xl text-blue-500 hover:bg-blue-600 hover:text-white transition-all shadow-lg group shadow-blue-500/5`}
          >
            <ShoppingBag size={20} className="shrink-0" />
            {!isCollapsed && <span className="text-[10px] font-black uppercase tracking-widest animate-in fade-in duration-500">Catálogo</span>}
          </button>
          {isCollapsed && hoveredItem === 'catalogo-tip' && (
            <div className="absolute left-[85px] z-[200] px-4 py-2 bg-blue-600 text-white text-[9px] font-black uppercase tracking-widest rounded-xl shadow-xl animate-in fade-in slide-in-from-left-4 duration-300 pointer-events-none whitespace-nowrap">Ver Catálogo</div>
          )}
        </div>

        {googleUser && (
          <div className="relative flex items-center">
            <div className={`w-full flex items-center ${isCollapsed ? 'justify-center p-0 bg-transparent border-0' : `gap-3 px-4 py-3 ${isDark ? 'bg-white/5 border-white/5' : 'bg-neutral-100 border-neutral-200'} rounded-2xl border`} transition-all`}>
              <img src={googleUser.picture} alt="Profile" className="w-8 h-8 rounded-full border border-white/10 shrink-0" />
              {!isCollapsed && (
                <div className="overflow-hidden animate-in fade-in duration-500">
                  <p className={`text-[10px] font-black ${isDark ? 'text-white' : 'text-neutral-900'} truncate`}>{googleUser.name}</p>
                  <p className="text-[7px] text-neutral-500 font-bold truncate uppercase tracking-widest">Google Active</p>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="relative flex items-center">
          <button 
            onClick={() => setActiveTab('configuracion')}
            onMouseEnter={() => setHoveredItem('config-tip')}
            onMouseLeave={() => setHoveredItem(null)}
            className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'gap-4 px-4'} py-3 rounded-2xl transition-all ${activeTab === 'configuracion' ? 'shadow-xl' : `${isDark ? 'text-neutral-600 hover:text-white hover:bg-white/5' : 'text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100'}`}`}
            style={activeTab === 'configuracion' ? accentStyle : {}}
          >
            <Settings size={20} className="shrink-0" />
            {!isCollapsed && <span className="text-[10px] font-black uppercase tracking-widest animate-in fade-in duration-500">Configuración</span>}
          </button>
          {isCollapsed && hoveredItem === 'config-tip' && (
            <div className={`absolute left-[85px] z-[200] px-4 py-2 ${isDark ? 'bg-white text-black' : 'bg-neutral-900 text-white'} text-[9px] font-black uppercase tracking-widest rounded-xl shadow-xl animate-in fade-in slide-in-from-left-4 duration-300 pointer-events-none whitespace-nowrap`}>Ajustes</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
