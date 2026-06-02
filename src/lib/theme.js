// ─── SISTEMA DE TEMAS CON 3 MODOS + COLORES PERSONALIZADOS ──

const MODOS = {
  darkGray: {
    bg: '#141414', panel: '#1a1a1a', surface: '#161616',
    input: '#1e1e1e', border: '#2e2e30', borderLight: '#3a3a3d',
    overlay: 'rgba(20,20,20,0.95)',
  },
  black: {
    bg: '#000000', panel: '#0d0d0d', surface: '#050505',
    input: '#111111', border: '#1a1a1a', borderLight: '#2a2a2a',
    overlay: 'rgba(0,0,0,0.95)',
  },
  lightGray: {
    bg: '#2a2a2a', panel: '#333333', surface: '#2d2d2d',
    input: '#383838', border: '#404040', borderLight: '#4a4a4a',
    overlay: 'rgba(42,42,42,0.95)',
  },
};

const LIGHT = {
  bg: '#f0f2f5', panel: '#ffffff', surface: '#ffffff',
  input: '#f8fafc', border: 'rgba(0,0,0,0.08)', borderLight: 'rgba(0,0,0,0.05)',
  overlay: 'rgba(240,242,245,0.95)',
};

function hexToRgba(hex, alpha) {
  const c = hex.replace('#', '');
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return hex;
  return `rgba(${r},${g},${b},${alpha})`;
}

function isHexLight(hex) {
  const c = hex.replace('#', '');
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return false;
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 180;
}

export function getTheme(isDark = true, custom = {}) {
  const base = isDark
    ? MODOS[custom.appearanceMode] || MODOS.darkGray
    : LIGHT;

  const accent = custom.accentColor || (isDark ? '#a0a0a0' : '#475569');
  const accentLight = isHexLight(accent);
  const accentHover = isDark
    ? (accentLight ? '#888888' : '#bbbbbb')
    : (accentLight ? '#334155' : '#1e293b');

  const textColor = isDark ? '#d4d4d4' : '#0f172a';
  const textMuted = isDark ? '#9e9e9e' : '#475569';
  const textDim = isDark ? '#707070' : '#64748b';

  return {
    ...base,
    accent,
    accentHover,
    accentSoft: hexToRgba(accent, isDark ? 0.07 : 0.03),
    accentSoftHover: hexToRgba(accent, isDark ? 0.12 : 0.06),
    accentGlow: hexToRgba(accent, isDark ? 0.10 : 0.04),
    text: textColor,
    textMuted,
    textDim,
    hover: hexToRgba(textColor, 0.03),
    hoverActive: hexToRgba(textColor, 0.06),
    glow: hexToRgba(textColor, 0.10),
    inputBg: isDark ? 'rgba(255,255,255,0.03)' : '#ffffff',
    danger: '#e04a4a',
    dangerSoft: 'rgba(224,74,74,0.1)',
    warning: '#cca700',
    success: '#4ec9b0',
  };
}

export const c = getTheme(true);