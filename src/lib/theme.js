// Tema compartido para todo Sovereign OS
// Modo Noche (default) y Modo Día
export const getTheme = (isDark = true) => ({
  isDark,
  bg: isDark ? '#141414' : '#f5f5f7',
  panel: isDark ? '#202022' : '#ffffff',
  surface: isDark ? '#28282b' : '#f0f0f2',
  border: isDark ? '#2e2e30' : '#e5e5e7',
  borderLight: isDark ? '#3a3a3d' : '#d4d4d6',
  accent: isDark ? '#a0a0a0' : '#707070',
  accentHover: isDark ? '#bbbbbb' : '#555555',
  accentSoft: isDark ? 'rgba(255, 255, 255, 0.07)' : 'rgba(0, 0, 0, 0.04)',
  accentSoftHover: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
  accentGlow: isDark ? 'rgba(255, 255, 255, 0.10)' : 'rgba(0, 0, 0, 0.06)',
  text: isDark ? '#d4d4d4' : '#1a1a1a',
  textMuted: isDark ? '#9e9e9e' : '#666666',
  textDim: isDark ? '#707070' : '#999999',
  hover: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
  hoverActive: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
  glow: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.06)',
  input: isDark ? '#28282b' : '#f0f0f2',
  inputBg: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
  danger: '#e04a4a',
  dangerSoft: isDark ? 'rgba(224,74,74,0.1)' : 'rgba(224,74,74,0.06)',
  warning: '#cca700',
  success: '#4ec9b0',
  overlay: isDark ? 'rgba(20,20,20,0.95)' : 'rgba(245,245,247,0.95)',
});

// Atajo para usar en componentes que aun no migran a getTheme dinámico
export const c = getTheme(true); // default night mode
