import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import CommandCenter from './views/CommandCenter';
import MeetingStudio from './views/MeetingStudio';
import Prestamos from './views/Prestamos';
import Proyectos from './views/Proyectos';
import VentasDigitales from './views/VentasDigitales';
import MisEgresos from './views/MisEgresos';
import Recibos from './views/Recibos';
import { supabase } from './lib/supabaseClient';

const App = () => {
  const [activeTab, setActiveTab] = useState('resumen');
  const [meetingsList, setMeetingsList] = useState([]);
  const [proyectos, setProyectos] = useState([]);

  const [data, setData] = useState({
    prestamos: [],
    ventas: [],
    egresos: [],
    recibos: [],
  });

  useEffect(() => {
    const fetchData = async () => {
      // Préstamos
      const { data: prestamosData } = await supabase.from('prestamos').select('*');
      if (prestamosData) setData(prev => ({ ...prev, prestamos: prestamosData }));

      // Reuniones
      const { data: meetingsData } = await supabase.from('reuniones').select('*');
      if (meetingsData) setMeetingsList(meetingsData);

      // Proyectos
      const { data: proyectosData } = await supabase.from('proyectos').select('*');
      if (proyectosData) setProyectos(proyectosData);

      // Ventas
      const { data: ventasData } = await supabase.from('ventas').select('*');
      if (ventasData) setData(prev => ({ ...prev, ventas: ventasData }));

      // Egresos
      const { data: egresosData } = await supabase.from('egresos').select('*');
      if (egresosData) setData(prev => ({ ...prev, egresos: egresosData }));

      // Recibos
      const { data: recibosData } = await supabase.from('recibos').select('*');
      if (recibosData) setData(prev => ({ ...prev, recibos: recibosData }));
    };

    fetchData();
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'resumen':
        return <CommandCenter meetingsList={meetingsList} data={data} proyectos={proyectos} setData={setData} />;
      case 'meeting_studio':
        return <MeetingStudio meetingsList={meetingsList} setMeetingsList={setMeetingsList} />;
      case 'prestamos':
        return <Prestamos data={data} setData={setData} />;
      case 'proyectos':
        return <Proyectos proyectos={proyectos} setProyectos={setProyectos} />;
      case 'ventas':
        return <VentasDigitales data={data} setData={setData} />;
      case 'pagos':
        return <MisEgresos data={data} setData={setData} />;
      case 'recibos':
        return <Recibos data={data} setData={setData} />;
      default:
        return <CommandCenter meetingsList={meetingsList} data={data} proyectos={proyectos} setData={setData} />;
    }
  };

  return (
    <div className="flex h-screen bg-[#050505] text-neutral-200 font-sans overflow-hidden selection:bg-amber-500/30 selection:text-amber-200">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        counts={{
          meetings: meetingsList.length,
          prestamos: data.prestamos.length,
          proyectos: proyectos.filter(p => p.estado !== 'Entregado').length,
        }}
      />
      <main className="flex-1 h-full overflow-y-auto mac-scrollbar bg-[#050505] relative">
        <div className="absolute top-0 inset-x-0 h-64 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />
        <div className="w-full px-8 py-8 lg:px-10 lg:py-10 relative z-10 flex flex-col min-h-full">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;
