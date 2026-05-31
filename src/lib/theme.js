// Tema compartido
// Modo Noche (default) y Modo Día
export const getTheme = (isDark = true) => {
  let bg = isDark ? '#141414' : '#f0f2f5';
  let panel = isDark ? '#141414' : '#ffffff';
  let surface = isDark ? '#141414' : '#ffffff';
  let input = isDark ? '#141414' : '#f8fafc';
  
  if (isDark) {
    try {
      const saved = localStorage.getItem('sovereign_settings');
      if (saved) {
        const settings = JSON.parse(saved);
        if (settings.appBackground === 'black') {
          bg = '#000000';
          panel = '#0a0a0a';
          surface = '#0a0a0a';
          input = '#000000';
        } else if (settings.appBackground === 'lightGray') {
          bg = '#222222';
          panel = '#2c2c2c';
          surface = '#2c2c2c';
          input = '#222222';
        }
      }
    } catch (e) {
      console.error(e);
    }
  }

  return {
    isDark,
    bg,
    panel,
    surface,
    border: isDark ? '#2e2e30' : 'rgba(0, 0, 0, 0.08)',
    borderLight: isDark ? '#3a3a3d' : 'rgba(0, 0, 0, 0.05)',
    accent: isDark ? '#a0a0a0' : '#475569',
    accentHover: isDark ? '#bbbbbb' : '#1e293b',
    accentSoft: isDark ? 'rgba(255, 255, 255, 0.07)' : 'rgba(0, 0, 0, 0.03)',
    accentSoftHover: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.06)',
    accentGlow: isDark ? 'rgba(255, 255, 255, 0.10)' : 'rgba(0, 0, 0, 0.04)',
    text: isDark ? '#d4d4d4' : '#0f172a',
    textMuted: isDark ? '#9e9e9e' : '#475569',
    textDim: isDark ? '#707070' : '#64748b',
    hover: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
    hoverActive: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
    glow: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.03)',
    input,
    inputBg: isDark ? 'rgba(255,255,255,0.03)' : '#ffffff',
    danger: '#e04a4a',
    dangerSoft: isDark ? 'rgba(224,74,74,0.1)' : 'rgba(224,74,74,0.06)',
    warning: '#cca700',
    success: '#4ec9b0',
    overlay: isDark ? `rgba(${bg === '#000000' ? '0,0,0' : bg === '#222222' ? '34,34,34' : '20,20,20'},0.95)` : 'rgba(240,242,245,0.95)',
  };
};

// Atajo para usar en componentes que aun no migran a getTheme dinámico
export const c = getTheme(true); // default night mode
