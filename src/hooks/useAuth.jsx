import { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
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

  const signInWithGoogle = useCallback(async () => {
    setAuthError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        skipBrowserRedirect: true
      }
    });
    if (error) {
      setAuthError(error.message);
      console.error('Error al iniciar sesión:', error.message);
    }
  }, []);

  const signInWithGooglePopup = useCallback(async () => {
    setAuthError(null);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      setAuthError(err.message);
      console.error('Error al iniciar sesión:', err.message);
    }
  }, []);

  const handleGoogleCredential = useCallback(async (credential) => {
    setAuthError(null);
    try {
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: credential
      });
      if (error) throw error;
      return data;
    } catch (err) {
      setAuthError(err.message);
      console.error('Error al validar con Supabase:', err.message);
      return null;
    }
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  return (
    <AuthContext.Provider value={{
      session, user, loading, authError,
      signInWithGoogle, signInWithGooglePopup,
      handleGoogleCredential, signOut,
      setAuthError
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
