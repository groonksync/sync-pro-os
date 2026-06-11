// Inefable - System Updated: 2026-05-01
import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import CommandCenter from './views/CommandCenter';
import EditorVideo from './views/EditorVideo';
import ProjectEngineView from './views/ProjectEngineView';
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
import ConversorWebP from './views/ConversorWebP';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { supabase } from './lib/supabaseClient';
import { getTheme } from './lib/theme';

const LoginScreen = ({ onLogin, loading }) => (
  <div style={{
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    height: '100vh', width: '100vw', backgroundColor: '#141414', color: '#d4d4d4',
    fontFamily: 'Space Grotesk, sans-serif', gap: 24
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
      <div style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #2e2e30' }}>
        <span style={{ fontSize: 20, fontWeight: 900, color: '#10b981' }}>I</span>
      </div>
      <div>
        <h1 style={{ fontSize: 18, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.03em', margin: 0 }}>Inefable</h1>
        <p style={{ fontSize: 9, color: '#707070', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>Estación de Trabajo Personal</p>
      </div>
    </div>
    <p style={{ fontSize: 10, color: '#9e9e9e', maxWidth: 300, textAlign: 'center', lineHeight: '1.6' }}>
      Inicia sesión con tu cuenta de Google para acceder a tu espacio de trabajo.
    </p>
    <button onClick={onLogin} disabled={loading} style={{
      display: 'flex', alignItems: 'center', gap: 10, padding: '12px 24px',
      borderRadius: 12, border: '1px solid #2e2e30', backgroundColor: '#1a1a1a',
      color: loading ? '#525252' : '#d4d4d4', cursor: loading ? 'not-allowed' : 'pointer',
      fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', transition: 'all 0.2s'
    }}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
      </svg>
      {loading ? 'Verificando...' : 'Iniciar sesión con Google'}
    </button>
    <p style={{ fontSize: 7, color: '#525252', textAlign: 'center', marginTop: 8 }}>
      Solo los usuarios autorizados pueden acceder al panel de administración.<br/>
      El catálogo público sigue disponible sin inicio de sesión.
    </p>
  </div>
);

const AppContent = () => {
  const { session, user, loading, signInWithGoogle } = useAuth();

  const [activeTab, setActiveTab] = useState('resumen');
  const [meetingsList, setMeetingsList] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [selectedPrestamoId, setSelectedPrestamoId] = useState(null);
  const [googleToken, setGoogleToken] = useState(() => localStorage.getItem('sovereign_google_token'));
  const [googleUser, setGoogleUser] = useState(() => {
    const saved = localStorage.getItem('sovereign_google_user');
    return saved ? JSON.parse(saved) : null;
  });

  // Capturar automáticamente el token de Google del proveedor desde la sesión de Supabase
  useEffect(() => {
    if (session) {
      if (session.provider_token) {
        setGoogleToken(session.provider_token);
      }
      if (session.user?.user_metadata) {
        setGoogleUser({
          name: session.user.user_metadata.full_name || session.user.user_metadata.name || session.user.email,
          email: session.user.email,
          picture: session.user.user_metadata.avatar_url || session.user.user_metadata.picture || '',
        });
      }
    } else {
      if (!loading) {
        setGoogleToken(null);
        setGoogleUser(null);
      }
    }
  }, [session, loading]);


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
      }
    } catch (error) {
      console.warn("No se pudo verificar el token de Google (posiblemente sin conexión):", error.message);
    }
  };

  // Cargar/Renovar al iniciar
  useEffect(() => {
    refreshGoogleToken();
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
        case 'proyectos-edicion': return <ProjectEngineView isDark={isDarkMode} />;
        case 'prestamos': return (
          <Prestamos 
            data={data} 
            setData={setData} 
            settings={appSettings}
            isDark={isDarkMode}
            token={googleToken}
            preSelectedId={selectedPrestamoId} 
            onClearSelection={() => setSelectedPrestamoId(null)}
          />
        );
        case 'notificaciones': return <Notifications data={data} servicios={servicios} onNavigate={setActiveTab} isDark={isDarkMode} />;
        case 'pagos': return <MisEgresos data={data} setData={setData} servicios={servicios} setServicios={setServicios} onRefresh={fetchData} isDark={isDarkMode} initialFilterText={egresosSearch} token={googleToken} />;
        case 'inventario': return <Inventario settings={appSettings} isDark={isDarkMode} initialSearch={inventarioSearch} />;
        case 'recordatorios': return <Recordatorios settings={appSettings} isDark={isDarkMode} initialSearch={recordatoriosSearch} token={googleToken} />;
        case 'flujo-trabajo': return <FlujoTrabajo settings={appSettings} isDark={isDarkMode} />;
        case 'conversor-imagenes': return <ConversorWebP settings={appSettings} isDark={isDarkMode} />;
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

  // Verificar rutas públicas primero
  const path = window.location.pathname;
  const isPortal = path.startsWith('/portal/');
  const isCatalog = path === '/catalogo' || path === '/catalogo/';

  if (isCatalog) return <PublicCatalog />;
  if (isPortal) return <ClientPortal portalId={path.split('/portal/')[1]} />;

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: '#141414' }}>
        <div className="animate-spin" style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid #2e2e30', borderTopColor: '#10b981' }} />
      </div>
    );
  }

  if (!user) return <LoginScreen onLogin={signInWithGoogle} loading={loading} />;

  return (
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
        
        <main className={`flex-1 h-full ${(activeTab === 'catalogo' || activeTab === 'flujo-trabajo' || activeTab === 'editor' || activeTab === 'proyectos-edicion') ? 'overflow-hidden' : 'overflow-y-auto'} mac-scrollbar relative transition-all duration-700 ease-in-out ${appSettings.isMobileMode ? 'pb-24' : ''}`}>
          <div className={`w-full relative z-10 flex flex-col ${(activeTab === 'catalogo' || activeTab === 'flujo-trabajo' || activeTab === 'editor' || activeTab === 'proyectos-edicion') ? 'h-full' : 'min-h-full'} ${activeTab === 'ajustes' ? '' : 'max-w-[2000px] mx-auto'} transition-all ${(activeTab === 'catalogo' || activeTab === 'flujo-trabajo' || activeTab === 'editor' || activeTab === 'proyectos-edicion') ? '' : (activeTab === 'ajustes' ? 'px-0 py-0' : (appSettings.isMobileMode ? 'px-4 py-4' : 'px-6 py-8 lg:px-16 lg:py-12'))}`}>
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
  );
};

const App = () => (
  <AuthProvider>
    <AppContent />
  </AuthProvider>
);

export default App;
