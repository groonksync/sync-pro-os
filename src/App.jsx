import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import CommandCenter from './views/CommandCenter';
import MeetingStudio from './views/MeetingStudio';
import Prestamos from './views/Prestamos';
import { supabase } from './lib/supabaseClient';

// Vistas Temporales (Placeholders para modularización futura)
const ProyectosView = () => <div className="text-white">Vista Proyectos</div>;
const VentasView = () => <div className="text-white">Vista Ventas</div>;
const PagosView = () => <div className="text-white">Vista Pagos</div>;
const RecibosView = () => <div className="text-white">Vista Recibos</div>;

const App = () => {
  const [activeTab, setActiveTab] = useState('resumen');
  
  const [meetingsList, setMeetingsList] = useState([]);

  const [data, setData] = useState({
    prestamos: [],
    proyectos: [],
    ventas: [],
    pagos: []
  });

  // Cargar datos de Supabase al iniciar
  useEffect(() => {
    const fetchData = async () => {
      // Cargar Préstamos
      const { data: prestamosData } = await supabase.from('prestamos').select('*');
      if (prestamosData) setData(prev => ({ ...prev, prestamos: prestamosData }));

      // Cargar Reuniones
      const { data: meetingsData } = await supabase.from('reuniones').select('*');
      if (meetingsData) setMeetingsList(meetingsData);
    };

    fetchData();
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'resumen': return <CommandCenter meetingsList={meetingsList} />;
      case 'meeting_studio': return <MeetingStudio meetingsList={meetingsList} setMeetingsList={setMeetingsList} />;
      case 'prestamos': return <Prestamos data={data} setData={setData} />;
      case 'proyectos': return <ProyectosView />;
      case 'ventas': return <VentasView />;
      case 'pagos': return <PagosView />;
      case 'recibos': return <RecibosView />;
      default: return <CommandCenter />;
    }
  };

  return (
    <div className="flex h-screen bg-[#050505] text-neutral-200 font-sans overflow-hidden selection:bg-amber-500/30 selection:text-amber-200">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        counts={{ meetings: meetingsList.length, prestamos: data.prestamos.length }} 
      />
      
      <main className="flex-1 h-full overflow-y-auto mac-scrollbar bg-[#050505] relative">
        <div className="absolute top-0 inset-x-0 h-64 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none"></div>
        <div className="w-full px-8 py-8 lg:px-10 lg:py-10 relative z-10 flex flex-col min-h-full">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;
