import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder-url.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key'

console.log('Supabase URL detectada:', supabaseUrl);

if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  console.error('ERROR: Faltan las variables de entorno de Supabase');
}

/**
 * Función fetch personalizada para interceptar todas las peticiones a Supabase
 * e inyectar el encabezado HTTP de autorización dinámicamente desde los Ajustes locales.
 */
const dynamicFetchWithAuth = (url, options = {}) => {
  let dbPass = 'SovereignPass123_SecureAccess'; // Fallback por defecto
  
  try {
    const settingsStr = localStorage.getItem('sovereign_settings');
    if (settingsStr) {
      const settings = JSON.parse(settingsStr);
      if (settings.dbPasscode) {
        dbPass = settings.dbPasscode;
      }
    }
  } catch (e) {
    console.error('Error leyendo la clave de base de datos de localStorage:', e);
  }

  // Clonar y añadir el encabezado de seguridad
  const headers = {
    ...options.headers,
    'x-sovereign-pass': dbPass
  };

  return fetch(url, {
    ...options,
    headers
  });
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    fetch: dynamicFetchWithAuth
  }
})
