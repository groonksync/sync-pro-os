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
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const Sidebar = ({ activeTab, setActiveTab, counts, settings, googleUser, isCollapsed, setIsCollapsed }) => {
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
    { id: 'papelera', label: 'Papelera', icon: Trash2 },
  ];

  const accentStyle = {
    backgroundColor: settings.accentColor,
    color: settings.accentColor === '#ffffff' ? '#000000' : '#ffffff',
    boxShadow: `0 10px 30px -10px ${settings.accentColor}44`
  };

  if (settings.isMobileMode) {
    return (
      <nav className="fixed bottom-0 inset-x-0 h-20 bg-[#080808]/90 backdrop-blur-xl border-t border-white/5 flex items-center justify-around px-4 z-[1000] animate-in slide-in-from-bottom duration-500">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center gap-1 p-2 transition-all ${activeTab === item.id ? 'scale-110' : 'opacity-40 grayscale'}`}
          >
            <div className="p-2 rounded-xl transition-all" style={activeTab === item.id ? { backgroundColor: `${settings.accentColor}22`, color: settings.accentColor } : {}}>
              <item.icon size={20} strokeWidth={activeTab === item.id ? 2.5 : 2} />
            </div>
          </button>
        ))}
        <button onClick={handleOpenCatalog} className="flex flex-col items-center gap-1 p-2 opacity-40 hover:opacity-100 transition-all">
           <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500"><ShoppingBag size={20} /></div>
        </button>
        <button onClick={() => setActiveTab('configuracion')} className={`flex flex-col items-center gap-1 p-2 transition-all ${activeTab === 'configuracion' ? 'scale-110' : 'opacity-40 grayscale'}`}>
           <div className="p-2 rounded-xl" style={activeTab === 'configuracion' ? { backgroundColor: `${settings.accentColor}22`, color: settings.accentColor } : {}}><Settings size={20} /></div>
        </button>
      </nav>
    );
  }

  return (
    <div className={`${isCollapsed ? 'w-24' : 'w-64'} bg-[#080808] border-r border-white/5 flex flex-col h-full py-8 px-4 transition-all duration-700 ease-in-out overflow-visible relative group/sidebar`}>
      
      {/* BOTÓN DE COLAPSO MAESTRO */}
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-10 w-6 h-6 bg-white text-black rounded-full flex items-center justify-center shadow-xl border border-white/10 z-[100] hover:scale-110 transition-all"
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      {/* LOGO Y CABECERA */}
      <div className="mb-10 px-2 flex items-center gap-4">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-lg" style={{ backgroundColor: settings.accentColor }}>
          <Zap size={18} className={settings.accentColor === '#ffffff' ? 'text-black' : 'text-white'} fill="currentColor" />
        </div>
        {!isCollapsed && (
          <div className="animate-in fade-in slide-in-from-left-4 duration-500">
            <h1 className="text-sm font-black uppercase tracking-[0.3em] text-white">Sync Pro</h1>
            <p className="text-[9px] text-neutral-600 font-bold uppercase tracking-widest">Sovereign OS</p>
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
                activeTab === item.id ? 'shadow-2xl' : 'text-neutral-500 hover:text-white hover:bg-white/5'
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
                  activeTab === item.id ? 'bg-black/20 text-black' : 'bg-white/10 text-neutral-400 group-hover/item:bg-white/20'
                }`}>
                  {item.count}
                </span>
              )}

              {/* INDICADOR DE PUNTO PARA MODO COLAPSADO */}
              {isCollapsed && item.count > 0 && (
                <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border border-[#080808] animate-pulse"></div>
              )}
            </button>

            {/* TOOLTIP FLOTANTE (QUANTUM GLASS) */}
            {isCollapsed && hoveredItem === item.id && (
              <div className="absolute left-[85px] z-[200] px-4 py-2 bg-white text-black text-[9px] font-black uppercase tracking-widest rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] animate-in fade-in slide-in-from-left-4 duration-300 pointer-events-none whitespace-nowrap border border-white/20 backdrop-blur-md">
                {item.label}
                <div className="absolute left-[-4px] top-1/2 -translate-y-1/2 w-2 h-2 bg-white rotate-45"></div>
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* ACCIONES INFERIORES */}
      <div className="mt-auto space-y-4 pt-6 border-t border-white/5">
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
            <div className={`w-full flex items-center ${isCollapsed ? 'justify-center p-0 bg-transparent border-0' : 'gap-3 px-4 py-3 bg-white/5 rounded-2xl border border-white/5'} transition-all`}>
              <img src={googleUser.picture} alt="Profile" className="w-8 h-8 rounded-full border border-white/10 shrink-0" />
              {!isCollapsed && (
                <div className="overflow-hidden animate-in fade-in duration-500">
                  <p className="text-[10px] font-black text-white truncate">{googleUser.name}</p>
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
            className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'gap-4 px-4'} py-3 rounded-2xl transition-all ${activeTab === 'configuracion' ? 'shadow-xl' : 'text-neutral-600 hover:text-white hover:bg-white/5'}`}
            style={activeTab === 'configuracion' ? accentStyle : {}}
          >
            <Settings size={20} className="shrink-0" />
            {!isCollapsed && <span className="text-[10px] font-black uppercase tracking-widest animate-in fade-in duration-500">Configuración</span>}
          </button>
          {isCollapsed && hoveredItem === 'config-tip' && (
            <div className="absolute left-[85px] z-[200] px-4 py-2 bg-white text-black text-[9px] font-black uppercase tracking-widest rounded-xl shadow-xl animate-in fade-in slide-in-from-left-4 duration-300 pointer-events-none whitespace-nowrap">Ajustes</div>
          )}
        </div>
      </div>
    </div>
  );
};

const Zap = ({ size, className, fill }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
  </svg>
);

export default Sidebar;
