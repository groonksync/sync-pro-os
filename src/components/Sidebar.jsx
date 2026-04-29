import React from 'react';
import { 
  TrendingUp, Video, Briefcase, LayoutDashboard, Download, CreditCard, FileText, 
  Activity, FolderKanban
} from 'lucide-react';

const NavItem = ({ id, icon: Icon, label, badge, activeTab, setActiveTab }) => (
  <button onClick={() => setActiveTab(id)}
    className={`w-full flex items-center justify-between px-3 py-2 rounded-md transition-all duration-200 group ${
      activeTab === id ? 'bg-white/10 text-white shadow-sm' : 'text-neutral-500 hover:bg-white/5 hover:text-neutral-300'
    }`}>
    <div className="flex items-center gap-2.5">
      <Icon size={14} strokeWidth={activeTab === id ? 2.5 : 2} className={activeTab === id ? 'text-amber-500' : ''} />
      <span className="text-xs font-medium tracking-wide">{label}</span>
    </div>
    {badge > 0 && <span className="text-[9px] bg-white/10 px-1.5 py-0.5 rounded font-bold text-white">{badge}</span>}
  </button>
);

const Sidebar = ({ activeTab, setActiveTab, counts = {} }) => {
  return (
    <aside className="w-[220px] h-full flex flex-col bg-[#0a0a0a] border-r border-white/[0.05] z-10 relative shrink-0">
      <div className="pt-8 pb-6 px-6 cursor-default flex flex-col items-start border-b border-white/[0.02]">
        <div className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
          <Activity size={16} className="text-amber-500" />
          sync <span className="text-amber-500 italic">pro</span>
        </div>
      </div>
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto mac-scrollbar mt-4">
        <p className="px-3 text-[9px] font-bold text-neutral-600 uppercase tracking-widest mb-1.5 mt-2">Dashboard</p>
        <NavItem id="resumen" icon={TrendingUp} label="Command Center" activeTab={activeTab} setActiveTab={setActiveTab} />
        <NavItem id="meeting_studio" icon={Video} label="Meeting Studio" badge={counts.meetings} activeTab={activeTab} setActiveTab={setActiveTab} />
        
        <p className="px-3 text-[9px] font-bold text-neutral-600 uppercase tracking-widest mb-1.5 mt-6">Gestión</p>
        <NavItem id="proyectos" icon={FolderKanban} label="Proyectos" badge={counts.proyectos} activeTab={activeTab} setActiveTab={setActiveTab} />
        <NavItem id="prestamos" icon={LayoutDashboard} label="Préstamos" badge={counts.prestamos} activeTab={activeTab} setActiveTab={setActiveTab} />
        
        <p className="px-3 text-[9px] font-bold text-neutral-600 uppercase tracking-widest mb-1.5 mt-6">Finanzas</p>
        <NavItem id="ventas" icon={Download} label="Ventas Digitales" activeTab={activeTab} setActiveTab={setActiveTab} />
        <NavItem id="pagos" icon={CreditCard} label="Mis Egresos" activeTab={activeTab} setActiveTab={setActiveTab} />
        <NavItem id="recibos" icon={FileText} label="Recibos" activeTab={activeTab} setActiveTab={setActiveTab} />
      </nav>
    </aside>
  );
};

export default Sidebar;
