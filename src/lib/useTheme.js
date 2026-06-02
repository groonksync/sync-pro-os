import { useState, useEffect, useMemo } from 'react';
import { getTheme } from './theme';

// ─── HOOK QUE REACCIONA A CAMBIOS DE CONFIGURACIÓN ──
// Todos los componentes deben usar este hook en vez de
// useMemo(() => getTheme(isDark), [isDark])
// para que el tema se actualice cuando el usuario cambie colores en Ajustes.

export function useTheme(isDark) {
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    const handler = () => setRevision(v => v + 1);
    window.addEventListener('settings-changed', handler);
    return () => window.removeEventListener('settings-changed', handler);
  }, []);

  return useMemo(() => getTheme(isDark), [isDark, revision]);
}