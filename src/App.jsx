// Inefable - System Updated: 2026-05-01
import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import CommandCenter from './views/CommandCenter';
import EditorVideo from './views/EditorVideo';
import Prestamos from './views/Prestamos';
import Notifications from './views/Notifications';
import MisEgresos from './views/MisEgresos';
import Inventario from './views/Inventario';
import Ajustes from './views/Ajustes';
import DriveSovereign from './views/DriveSovereign';
import GoogleCalendar from './views/GoogleCalendar';
import Recordatorios from './views/Recordatorios';
import BovedaSoberana from './views/BovedaSoberana';
import TrashView from './views/TrashView';
import SovereignAgent from './views/SovereignAgent';
import ClientPortal from './views/ClientPortal';
import PublicCatalog from './views/PublicCatalog';
import BovedaPass from './views/BovedaPass';
import FlujoTrabajo from './views/FlujoTrabajo';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { supabase } from './lib/supabaseClient';
import { getTheme } from './lib/theme';

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

  // NOTA: El refresh de token Google OAuth requiere un backend con refresh_token.
  // Sin un endpoint /api/refresh-token, el token expira en ~1 hora.
  // Al expirar, las llamadas a Google API fallarán con 401.
  // Considera agregar un backend proxy o usar el flujo de Google Identity Services
  // que maneja refresh automático vía gapi.client.
  const refreshGoogleToken = async () => {
    try {
      // Verificar si el token actual sigue siendo válido
      if (!googleToken) return;
      const checkRes = await fetch('https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=' + googleToken);
      if (!checkRes.ok) {
        console.warn("Token de Google expirado. El usuario deberá reconectar.");
        // No limpiar el token aquí para evitar pérdida de datos;
        // las APIs mostrarán error 401 que el usuario puede manejar reconectando desde Ajustes.
      }
    } catch (error) {
      // Sin conexión o error de red - no crítico
      console.warn("No se pudo verificar el token de Google (posiblemente sin conexión):", error.message);
    }
  };

  // Cargar/Renovar al iniciar
  useEffect(() => {
    refreshGoogleToken();
    // Verificar estado del token cada 50 minutos
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
    pagos: [],
    productos: [],
    recordatorios: [],
    egresos: [],
    notas: []
  });

  const [appSettings, setAppSettings] = useState(() => {
    const saved = localStorage.getItem('sovereign_settings');
    const defaults = {
      accentColor: '#ffffff',
      isMobileMode: false,
      interfaceDensity: 'normal',
      currencyRates: { USD: 10.50, EUR: 11.20, BRL: 2.10 },
      studioName: 'Inefable Studio',
      aiProvider: 'gemini',
      geminiKey: '',
      deepseekKey: ''
    };
    return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
  });

  useEffect(() => {
    localStorage.setItem('sovereign_settings', JSON.stringify(appSettings));
  }, [appSettings]);

  // Sincronizar settings cuando Ajustes los modifica
  useEffect(() => {
    const handler = () => {
      const saved = localStorage.getItem('sovereign_settings');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setAppSettings(prev => ({ ...prev, ...parsed }));
        } catch {}
      }
    };
    window.addEventListener('settings-changed', handler);
    return () => window.removeEventListener('settings-changed', handler);
  }, []);

  const fetchData = async () => {
    try {
      const { data: prestamosData } = await supabase.from('prestamos').select('*');
      if (prestamosData) setData(prev => ({ ...prev, prestamos: prestamosData }));

      const { data: meetingsData } = await supabase.from('reuniones').select('*');
      if (meetingsData) setMeetingsList(meetingsData);

      const { data: serviciosData } = await supabase.from('servicios').select('*');
      if (serviciosData) setServicios(serviciosData);

      const { data: productosData } = await supabase.from('productos').select('*').order('created_at', { ascending: false });
      if (productosData) setData(prev => ({ ...prev, productos: productosData }));

      const { data: recordatoriosData } = await supabase.from('recordatorios').select('*').order('created_at', { ascending: false });
      if (recordatoriosData) setData(prev => ({ ...prev, recordatorios: recordatoriosData }));

      // NUEVO: Traer egresos para el CommandCenter
      const { data: egresosData } = await supabase.from('egresos').select('*').order('created_at', { ascending: false });
      if (egresosData) setData(prev => ({ ...prev, egresos: egresosData }));

      // NUEVO: Traer ventas para el CommandCenter y MisEgresos
      const { data: ventasData } = await supabase.from('ventas').select('*').order('created_at', { ascending: false });
      if (ventasData) setData(prev => ({ ...prev, ventas: ventasData }));

      // NUEVO: Traer notas (conteo básico) para el CommandCenter
      const { data: notasData } = await supabase.from('notas').select('id, titulo, created_at').order('created_at', { ascending: false });
      if (notasData) setData(prev => ({ ...prev, notas: notasData }));
    } catch (e) {
      console.error("Error crítico de datos:", e);
    }
  };

  useEffect(() => {
    fetchData();
    // DETECCIÓN AUTOMÁTICA DE DISPOSITIVOS MÓVILES
    const checkMobile = () => {
      setAppSettings(prev => ({ ...prev, isMobileMode: window.innerWidth < 1024 }));
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

  const [inventarioSearch, setInventarioSearch] = useState('');
  const [recordatoriosSearch, setRecordatoriosSearch] = useState('');
  const [egresosSearch, setEgresosSearch] = useState('');

  const handleNavigateTo = (viewName, searchOptions = {}) => {
    if (viewName === 'inventario') {
      setInventarioSearch(searchOptions.search || '');
    } else if (viewName === 'recordatorios') {
      setRecordatoriosSearch(searchOptions.search || '');
    } else if (viewName === 'pagos') {
      setEgresosSearch(searchOptions.search || '');
    }
    setActiveTab(viewName);
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
            onNavigateTo={handleNavigateTo}
          />
        );
        case 'editor': return <EditorVideo meetingsList={meetingsList} setMeetingsList={setMeetingsList} settings={appSettings} isDark={isDarkMode} token={googleToken} />;
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
        case 'notificaciones': return <Notifications data={data} servicios={servicios} onNavigate={setActiveTab} isDark={isDarkMode} />;
        case 'pagos': return <MisEgresos data={data} setData={setData} servicios={servicios} setServicios={setServicios} onRefresh={fetchData} isDark={isDarkMode} initialFilterText={egresosSearch} />;
        case 'inventario': return <Inventario settings={appSettings} isDark={isDarkMode} initialSearch={inventarioSearch} />;
        case 'recordatorios': return <Recordatorios settings={appSettings} isDark={isDarkMode} initialSearch={recordatoriosSearch} />;
        case 'flujo-trabajo': return <FlujoTrabajo settings={appSettings} isDark={isDarkMode} />;
        case 'boveda': return <BovedaPass settings={appSettings} isDark={isDarkMode} />;
        case 'calendar': return <GoogleCalendar token={googleToken} settings={appSettings} isDark={isDarkMode} />;
        case 'drive-sovereign': return <DriveSovereign token={googleToken} user={googleUser} onLoginSuccess={(token, user) => { setGoogleToken(token); setGoogleUser(user); }} isDark={isDarkMode} />;
        case 'papelera': return <TrashView settings={appSettings} isDark={isDarkMode} />;
        case 'catalogo': return <PublicCatalog />;
        case 'configuracion': return (
          <Ajustes
            settings={appSettings}
            setSettings={setAppSettings}
            googleUser={googleUser}
            isDark={isDarkMode}
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
      console.error("Fallo de renderizado:", e);
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
    const theme = getTheme(isDarkMode, { 
      appearanceMode: appSettings.appearanceMode || appSettings.appBackground || 'darkGray', 
      accentColor: appSettings.accentColor 
    });
    if (isDarkMode) {
      document.documentElement.classList.remove('light-mode');
      document.documentElement.classList.add('dark-mode');
    } else {
      document.documentElement.classList.remove('dark-mode');
      document.documentElement.classList.add('light-mode');
    }
    document.body.style.backgroundColor = theme.bg;
  }, [isDarkMode, appSettings.appearanceMode, appSettings.appBackground, appSettings.accentColor]);

  const globalTheme = useMemo(() => {
    return getTheme(isDarkMode, { 
      appearanceMode: appSettings.appearanceMode || appSettings.appBackground || 'darkGray', 
      accentColor: appSettings.accentColor 
    });
  }, [isDarkMode, appSettings.appearanceMode, appSettings.appBackground, appSettings.accentColor]);

  return (
    <GoogleOAuthProvider clientId="834249589474-pdrp08eljve6vo7v4egddv10llkeh2it.apps.googleusercontent.com">
      <div className={`flex h-screen w-full font-sans overflow-hidden transition-colors duration-500 relative ${appSettings.interfaceDensity}`}
        style={{ backgroundColor: globalTheme.bg, color: globalTheme.text }}>
        
        {/* Background Wallpaper with extreme blur */}
        {appSettings.backgroundImage && (
          <>
            <div 
              className="absolute inset-0 z-0 pointer-events-none transition-all duration-1000"
              style={{
                backgroundImage: `url(${appSettings.backgroundImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                filter: `blur(60px) brightness(0.7) saturate(1.3)`,
                transform: 'scale(1.1)'
              }}
            />
            <div style={{
              position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none',
              backgroundColor: globalTheme.bg,
              opacity: 0.25,
            }} />
          </>
        )}
        <Sidebar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          settings={appSettings}
          googleUser={googleUser}
          isCollapsed={isSidebarCollapsed}
          setIsCollapsed={setIsSidebarCollapsed}
          isDark={isDarkMode}
          setIsDark={setIsDarkMode}
          sidebarBg={(() => {
            if (appSettings.sidebarColor === 'same' || !appSettings.sidebarColor) return globalTheme.bg;
            if (appSettings.sidebarColor === 'black') return '#000000';
            if (appSettings.sidebarColor === 'lightGray') return '#2a2a2a';
            return '#141414';
          })()}
          counts={{ 
            meetings: Array.isArray(meetingsList) ? meetingsList.length : 0, 
            prestamos: Array.isArray(data?.prestamos) ? data.prestamos.length : 0,
            notificaciones: getNotificationCount()
          }} 
        />
        
        <main className={`flex-1 h-full ${(activeTab === 'catalogo' || activeTab === 'flujo-trabajo') ? 'overflow-hidden' : 'overflow-y-auto'} mac-scrollbar relative transition-all duration-700 ease-in-out ${appSettings.isMobileMode ? 'pb-24' : ''}`}>
          <div className={`w-full relative z-10 flex flex-col ${(activeTab === 'catalogo' || activeTab === 'flujo-trabajo') ? 'h-full' : 'min-h-full'} ${activeTab === 'ajustes' ? '' : 'max-w-[2000px] mx-auto'} transition-all ${(activeTab === 'catalogo' || activeTab === 'flujo-trabajo') ? '' : (activeTab === 'ajustes' ? 'px-0 py-0' : (appSettings.isMobileMode ? 'px-4 py-4' : 'px-6 py-8 lg:px-16 lg:py-12'))}`}>
            {renderSafeContent()}
          </div>
        </main>
        
        {/* AGENTE GLOBAL FLOTANTE */}
        {activeTab !== 'ajustes' && (
          <SovereignAgent 
            isDark={isDarkMode} 
            currentView={activeTab}
            settings={appSettings}
            setSettings={setAppSettings}
            onRefresh={fetchData}
          />
        )}
      </div>
    </GoogleOAuthProvider>
  );
};

export default App;
