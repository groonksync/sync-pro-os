// Sovereign OS - System Updated: 2026-05-01
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import CommandCenter from './views/CommandCenter';
import MeetingStudio from './views/MeetingStudio';
import Prestamos from './views/Prestamos';
import Notifications from './views/Notifications';
import Pagos from './views/Pagos';
import Inventario from './views/Inventario';
import Ajustes from './views/Ajustes';
import DriveSovereign from './views/DriveSovereign';
import GoogleCalendar from './views/GoogleCalendar';
import TrashView from './views/TrashView';
import ClientPortal from './views/ClientPortal';
import PublicCatalog from './views/PublicCatalog';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { supabase } from './lib/supabaseClient';

const App = () => {
  // Detectar si estamos en la vista de Portal del Cliente
  const path = window.location.pathname;
  const isPortal = path.startsWith('/portal/');
  const isCatalog = path === '/catalogo' || path === '/catalogo/';

  const [activeTab, setActiveTab] = useState('resumen');
  const [meetingsList, setMeetingsList] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [selectedPrestamoId, setSelectedPrestamoId] = useState(null);
  const [googleToken, setGoogleToken] = useState(() => localStorage.getItem('sovereign_google_token'));
  const [googleUser, setGoogleUser] = useState(() => {
    const saved = localStorage.getItem('sovereign_google_user');
    return saved ? JSON.parse(saved) : null;
  });

  // Función para renovar token automáticamente
  const refreshGoogleToken = async () => {
    try {
      const response = await fetch('/api/refresh-token');
      const data = await response.json();
      if (data.access_token) {
        setGoogleToken(data.access_token);
        // Si no tenemos usuario, intentar cargarlo
        if (!googleUser) {
          const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${data.access_token}` }
          });
          const userData = await userRes.json();
          setGoogleUser(userData);
        }
      }
    } catch (error) {
      console.error("Error auto-refreshing token:", error);
    }
  };

  // Cargar/Renovar al iniciar
  useEffect(() => {
    refreshGoogleToken();
    // Renovar cada 50 minutos
    const interval = setInterval(refreshGoogleToken, 50 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Guardar en localStorage cuando cambie el estado
  useEffect(() => {
    if (googleToken) localStorage.setItem('sovereign_google_token', googleToken);
    else localStorage.removeItem('sovereign_google_token');
  }, [googleToken]);

  useEffect(() => {
    if (googleUser) localStorage.setItem('sovereign_google_user', JSON.stringify(googleUser));
    else localStorage.removeItem('sovereign_google_user');
  }, [googleUser]);
  
  const [data, setData] = useState({
    prestamos: [],
    proyectos: [],
    ventas: [],
    pagos: []
  });

  const [appSettings, setAppSettings] = useState({
    accentColor: '#ffffff',
    isMobileMode: false,
    interfaceDensity: 'normal',
    currencyRates: { USD: 10.50, EUR: 11.20, BRL: 2.10 },
    studioName: 'Sync Pro Studio'
  });

  const fetchData = async () => {
    try {
      const { data: prestamosData } = await supabase.from('prestamos').select('*');
      if (prestamosData) setData(prev => ({ ...prev, prestamos: prestamosData }));

      const { data: meetingsData } = await supabase.from('reuniones').select('*');
      if (meetingsData) setMeetingsList(meetingsData);

      const { data: serviciosData } = await supabase.from('servicios').select('*');
      if (serviciosData) setServicios(serviciosData);
    } catch (e) {
      console.error("Error crítico de datos:", e);
    }
  };

  useEffect(() => {
    fetchData();
    // DETECCIÓN AUTOMÁTICA DE DISPOSITIVOS MÓVILES
    const checkMobile = () => {
      if (window.innerWidth < 1024) {
        setAppSettings(prev => ({ ...prev, isMobileMode: true }));
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (isCatalog) return <PublicCatalog />;
  if (isPortal) return <ClientPortal portalId={path.split('/portal/')[1]} />;

  const handleNavigateToPrestamo = (id) => {
    setSelectedPrestamoId(id);
    setActiveTab('prestamos');
  };

  const handleQuickPayment = async (prestamoId) => {
    try {
      const prestamo = data.prestamos.find(p => p.id === prestamoId);
      if (!prestamo) return;

      const hoy = new Date();
      const mesActual = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;
      
      const currentPagos = Array.isArray(prestamo.pagos) ? prestamo.pagos : [];
      let newPagos;
      
      if (currentPagos.includes(mesActual)) {
        newPagos = currentPagos.filter(m => m !== mesActual);
      } else {
        newPagos = [...currentPagos, mesActual];
      }

      const { error } = await supabase
        .from('prestamos')
        .update({ pagos: newPagos })
        .eq('id', prestamoId);

      if (error) throw error;
      
      const updatedPrestamos = data.prestamos.map(p => 
        p.id === prestamoId ? { ...p, pagos: newPagos } : p
      );
      setData({ ...data, prestamos: updatedPrestamos });

    } catch (e) {
      alert("Error al procesar el pago: " + e.message);
    }
  };

  const getNotificationCount = () => {
    try {
      const hoy = new Date();
      const mesActual = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;
      const lista = Array.isArray(data?.prestamos) ? data.prestamos : [];
      
      return lista.filter(p => {
        if (!p || !p.inicio) return false;
        const pagos = Array.isArray(p.pagos) ? p.pagos : [];
        if (pagos.includes(mesActual)) return false;

        const start = new Date(p.inicio);
        if (isNaN(start.getTime())) return false;
        
        const billingDay = start.getDate();
        let next = new Date(hoy.getFullYear(), hoy.getMonth(), billingDay);
        if (next < hoy && next.toDateString() !== hoy.toDateString()) {
          next = new Date(hoy.getFullYear(), hoy.getMonth() + 1, billingDay);
        }
        const diffDays = Math.ceil((next - hoy) / (1000 * 60 * 60 * 24));
        return diffDays <= 7 && diffDays >= 0; 
      }).length;
    } catch (e) {
      return 0;
    }
  };

  const renderSafeContent = () => {
    try {
      switch (activeTab) {
        case 'resumen': return (
          <CommandCenter 
            meetingsList={meetingsList} 
            data={data} 
            servicios={servicios} 
            settings={appSettings}
            isDark={isDarkMode}
            onNavigateToPrestamo={handleNavigateToPrestamo}
            onQuickPayment={handleQuickPayment} 
          />
        );
        case 'editor': return <MeetingStudio meetingsList={meetingsList} setMeetingsList={setMeetingsList} settings={appSettings} isDark={isDarkMode} token={googleToken} />;
        case 'prestamos': return (
          <Prestamos 
            data={data} 
            setData={setData} 
            settings={appSettings}
            isDark={isDarkMode}
            preSelectedId={selectedPrestamoId} 
            onClearSelection={() => setSelectedPrestamoId(null)}
          />
        );
        case 'notificaciones': return <Notifications data={data} isDark={isDarkMode} />;
        case 'pagos': return <Pagos isDark={isDarkMode} />;
        case 'inventario': return <Inventario settings={appSettings} isDark={isDarkMode} />;
        case 'calendar': return <GoogleCalendar token={googleToken} settings={appSettings} />;
        case 'recordatorios': return <Notifications data={data} />;
        case 'drive-sovereign': return <DriveSovereign token={googleToken} user={googleUser} onLoginSuccess={(token, user) => { setGoogleToken(token); setGoogleUser(user); }} />;
        case 'papelera': return <TrashView settings={appSettings} />;
        case 'configuracion': return (
          <Ajustes 
            settings={appSettings} 
            setSettings={setAppSettings} 
            googleUser={googleUser}
            onLoginSuccess={(token, user) => { setGoogleToken(token); setGoogleUser(user); }}
            onLogout={() => { setGoogleToken(null); setGoogleUser(null); setActiveTab('resumen'); }}
          />
        );
        case 'logout-google': 
          setGoogleToken(null); 
          setGoogleUser(null); 
          setActiveTab('resumen');
          return null;
        default: return <CommandCenter meetingsList={meetingsList} data={data} servicios={servicios} onNavigateToPrestamo={handleNavigateToPrestamo} />;
      }
    } catch (e) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center p-10 bg-black/50 rounded-[40px] border border-white/10">
          <h3 className="text-xl font-bold text-white mb-2">Error de Visualización</h3>
          <p className="text-neutral-500 mb-6 max-w-md">Hay un dato en esta sección que no se puede mostrar.</p>
          <button onClick={() => setActiveTab('resumen')} className="px-6 py-2 bg-white text-black font-bold rounded-xl uppercase text-[10px]">Volver al Inicio</button>
        </div>
      );
    }
  };

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);

  // EFECTO DE TEMA GLOBAL
  useEffect(() => {
    document.body.style.backgroundColor = isDarkMode ? '#050505' : '#f8f9fa';
  }, [isDarkMode]);

  return (
    <GoogleOAuthProvider clientId="834249589474-pdrp08eljve6vo7v4egddv10llkeh2it.apps.googleusercontent.com">
      <div className={`flex h-screen w-full ${isDarkMode ? 'bg-[#050505] text-white' : 'bg-neutral-50 text-neutral-900'} font-sans selection:bg-emerald-500 selection:text-black overflow-hidden transition-colors duration-500 ${appSettings.interfaceDensity}`}>
        <Sidebar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          settings={appSettings}
          googleUser={googleUser}
          isCollapsed={isSidebarCollapsed}
          setIsCollapsed={setIsSidebarCollapsed}
          isDark={isDarkMode}
          setIsDark={setIsDarkMode}
          counts={{ 
            meetings: Array.isArray(meetingsList) ? meetingsList.length : 0, 
            prestamos: Array.isArray(data?.prestamos) ? data.prestamos.length : 0,
            notificaciones: getNotificationCount()
          }} 
        />
        
        <main className={`flex-1 h-full overflow-y-auto mac-scrollbar relative transition-all duration-700 ease-in-out ${appSettings.isMobileMode ? 'pb-24' : ''}`}>
          <div className={`absolute top-0 inset-x-0 h-64 bg-gradient-to-b ${isDarkMode ? 'from-white/[0.02]' : 'from-black/[0.02]'} to-transparent pointer-events-none`}></div>
          <div className={`w-full relative z-10 flex flex-col min-h-full max-w-[2000px] mx-auto transition-all ${appSettings.isMobileMode ? 'px-4 py-4' : 'px-6 py-8 lg:px-16 lg:py-12'}`}>
            {renderSafeContent()}
          </div>
        </main>
      </div>
    </GoogleOAuthProvider>
  );
};

export default App;
