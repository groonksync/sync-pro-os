import React from 'react';
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
  ExternalLink
} from 'lucide-react';

const Sidebar = ({ activeTab, setActiveTab, counts, settings, googleUser }) => {
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

  // Estilos dinámicos basados en el Ajustador Maestro
  const accentStyle = {
    backgroundColor: settings.accentColor,
    color: settings.accentColor === '#ffffff' ? '#000000' : '#ffffff',
    boxShadow: `0 10px 30px -10px ${settings.accentColor}44`
  };

  // SI EL MODO MÓVIL ESTÁ ACTIVO, RENDERIZAR BARRA INFERIOR
  if (settings.isMobileMode) {
    return (
      <nav className="fixed bottom-0 inset-x-0 h-20 bg-[#080808]/90 backdrop-blur-xl border-t border-white/5 flex items-center justify-around px-4 z-[1000] animate-in slide-in-from-bottom duration-500">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center gap-1 p-2 transition-all ${
              activeTab === item.id ? 'scale-110' : 'opacity-40 grayscale'
            }`}
          >
            <div 
              className="p-2 rounded-xl transition-all"
              style={activeTab === item.id ? { backgroundColor: `${settings.accentColor}22`, color: settings.accentColor } : {}}
            >
              <item.icon size={20} strokeWidth={activeTab === item.id ? 2.5 : 2} />
            </div>
          </button>
        ))}
        <button 
          onClick={handleOpenCatalog}
          className="flex flex-col items-center gap-1 p-2 opacity-40 hover:opacity-100 transition-all"
        >
           <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
             <ShoppingBag size={20} />
           </div>
        </button>
        <button 
          onClick={() => setActiveTab('configuracion')}
          className={`flex flex-col items-center gap-1 p-2 transition-all ${activeTab === 'configuracion' ? 'scale-110' : 'opacity-40 grayscale'}`}
        >
           <div className="p-2 rounded-xl" style={activeTab === 'configuracion' ? { backgroundColor: `${settings.accentColor}22`, color: settings.accentColor } : {}}>
             <Settings size={20} />
           </div>
        </button>
      </nav>
    );
  }

  // RENDERIZADO NORMAL (DESKTOP)
  return (
    <div className="w-60 bg-[#080808] border-r border-white/5 flex flex-col h-full py-8 px-5 transition-all duration-500 overflow-hidden">
      <div className="mb-8 px-2">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-3 h-3 rounded-full animate-pulse" style={{ backgroundColor: settings.accentColor }}></div>
          <h1 className="text-sm font-black uppercase tracking-[0.3em] text-neutral-400">Sync Pro</h1>
        </div>
        <p className="text-[10px] text-neutral-600 font-bold uppercase tracking-widest">Sovereign OS v2.0</p>
      </div>

      <nav className="flex-1 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center justify-between px-4 py-2.5 rounded-2xl transition-all duration-300 group ${
              activeTab === item.id 
                ? 'shadow-xl' 
                : 'text-neutral-500 hover:text-white hover:bg-white/5'
            }`}
            style={activeTab === item.id ? accentStyle : {}}
          >
            <div className="flex items-center gap-3">
              <item.icon size={18} strokeWidth={activeTab === item.id ? 2.5 : 2} />
              <span className={`text-xs font-bold tracking-tight ${activeTab === item.id ? 'font-black' : 'font-medium'}`}>
                {item.label}
              </span>
            </div>
            {item.count > 0 && (
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                activeTab === item.id ? 'bg-black/20 text-black' : 'bg-white/10 text-neutral-400 group-hover:bg-white/20'
              }`}>
                {item.count}
              </span>
            )}
          </button>
        ))}
      </nav>

      <div className="py-4">
        <button 
          onClick={handleOpenCatalog}
          className="w-full flex items-center justify-between px-4 py-3 bg-blue-600/10 border border-blue-500/20 rounded-2xl text-blue-500 hover:bg-blue-600 hover:text-white transition-all group shadow-lg shadow-blue-500/5"
        >
          <div className="flex items-center gap-3">
            <ShoppingBag size={18} />
            <span className="text-[11px] font-black uppercase tracking-widest">Ver Catálogo</span>
          </div>
          <ExternalLink size={12} className="opacity-40 group-hover:opacity-100 transition-opacity" />
        </button>
      </div>

      {/* PERFIL DE GOOGLE (SI ESTÁ LOGUEADO) */}
      {googleUser && (
        <div className="mb-6 px-4 py-3 bg-white/5 rounded-2xl border border-white/5 flex items-center gap-3">
          <img src={googleUser.picture} alt="Profile" className="w-8 h-8 rounded-full border border-white/10" />
          <div className="overflow-hidden">
            <p className="text-[10px] font-black text-white truncate">{googleUser.name}</p>
            <p className="text-[8px] text-neutral-500 font-bold truncate uppercase tracking-widest">Google Sync Active</p>
          </div>
        </div>
      )}

      <div className="mt-auto pt-8 border-t border-white/5 space-y-1">
        <button 
          onClick={() => setActiveTab('configuracion')}
          className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-xs font-bold uppercase tracking-widest ${
            activeTab === 'configuracion' ? 'shadow-lg' : 'text-neutral-600 hover:text-white'
          }`}
          style={activeTab === 'configuracion' ? accentStyle : {}}
        >
          <Settings size={16} /> Configuración
        </button>
        {googleUser && (
          <button 
            onClick={() => setActiveTab('logout-google')}
            className="w-full flex items-center gap-3 px-4 py-3 bg-rose-500/5 border border-rose-500/10 rounded-2xl text-rose-500 hover:bg-rose-500 hover:text-white transition-all text-[9px] font-black uppercase tracking-[0.2em] shadow-lg shadow-rose-500/5"
          >
            <Cloud size={14} /> Cerrar Sesión Google
          </button>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
