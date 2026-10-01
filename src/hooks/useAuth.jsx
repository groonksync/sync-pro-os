import { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    if (!supabase) {
      setSession(null);
      setUser(null);
      setLoading(false);
      return;
    }

    // 1. Detectar si hay errores devueltos en la URL (por ejemplo redirect_uri_mismatch o access_denied)
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const hashString = window.location.hash.startsWith('#')
        ? window.location.hash.substring(1)
        : window.location.hash;
      const hashParams = new URLSearchParams(hashString);

      const errorDescription =
        searchParams.get('error_description') ||
        hashParams.get('error_description') ||
        searchParams.get('error') ||
        hashParams.get('error');

      if (errorDescription) {
        const decoded = decodeURIComponent(errorDescription.replace(/\+/g, ' '));
        console.error('Error de autenticación recibido en URL:', decoded);
        setAuthError(decoded);
        window.history.replaceState({}, document.title, window.location.pathname);
      }

      // 2. Si hay código PKCE en la URL, manejar intercambio explícito para evitar condiciones de carrera
      const code = searchParams.get('code');
      if (code) {
        setLoading(true);
        supabase.auth
          .exchangeCodeForSession(code)
          .then(({ data, error }) => {
            if (error) {
              console.error('Error al intercambiar código OAuth:', error.message);
              setAuthError(`No se pudo validar la sesión de Google: ${error.message}`);
            } else if (data?.session) {
              setSession(data.session);
              setUser(data.session.user ?? null);
              setAuthError(null);
            }
            window.history.replaceState({}, document.title, window.location.pathname);
            setLoading(false);
          })
          .catch((err) => {
            console.error('Excepción al intercambiar código:', err);
            setAuthError(`Fallo al verificar credenciales: ${err.message}`);
            setLoading(false);
          });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
          if (newSession) {
            setSession(newSession);
            setUser(newSession.user ?? null);
            setAuthError(null);
            setLoading(false);
          }
        });
        return () => subscription.unsubscribe();
      }
    }

    // 3. Flujo normal: obtener sesión activa en memoria/localStorage
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const clearAuthError = useCallback(() => {
    setAuthError(null);
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setAuthError(null);
    if (!supabase) {
      setAuthError('Supabase no está configurado. Faltan variables de entorno.');
      return;
    }

    setLoading(true);

    const redirectTo = typeof window !== 'undefined'
      ? window.location.origin
      : 'https://inefablesc.vercel.app';

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          scopes: 'openid email profile https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/tasks',
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          }
        }
      });
      if (error) {
        console.error('Error al iniciar sesion con Google:', error.message);
        setAuthError(error.message);
        setLoading(false);
      }
    } catch (err) {
      console.error('Excepción al iniciar sesión con Google:', err);
      setAuthError(err.message || 'Error de conexión con el proveedor.');
      setLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    if (!supabase) {
      console.error('Supabase no está configurado.');
      return;
    }
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setAuthError(null);
  }, []);

  return (
    <AuthContext.Provider value={{
      session,
      user,
      loading,
      authError,
      clearAuthError,
      signInWithGoogle,
      signOut
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de un AuthProvider');
  return context;
};
