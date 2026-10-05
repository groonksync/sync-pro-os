const GRAY_SCALE = {
  bg:         '#212121', // Fondo principal gris carbón mate (estilo ChatGPT)
  sidebar:    '#171717', // Barra lateral carbón neutral
  panel:      '#171717',
  surface:    '#262626',
  card:       '#2D2D2D', // Superficies y tarjetas suaves
  cardHover:  '#333333',
  input:      '#2A2A2A',
  border:     '#333333',
  borderLight:'#3D3D3D',
  overlay:    'rgba(33,33,33,0.96)',
};

const MODOS = {
  darkGray: { ...GRAY_SCALE },
  black: {
    bg: '#181818', panel: '#121212', surface: '#1E1E1E',
    card: '#242424', input: '#202020', border: '#2C2C2C', borderLight: '#363636',
    overlay: 'rgba(24,24,24,0.98)',
  },
  lightGray: {
    bg: '#262626', panel: '#1B1B1B', surface: '#2E2E2E',
    card: '#333333', input: '#2F2F2F', border: '#3B3B3B', borderLight: '#444444',
    overlay: 'rgba(38,38,38,0.96)',
  },
};

const LIGHT = {
  bg: '#F9FAFB', panel: '#FFFFFF', surface: '#F3F4F6',
  input: '#F9FAFB', border: '#E5E7EB', borderLight: '#F3F4F6',
  overlay: 'rgba(255,255,255,0.96)',
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
  if (!custom.appearanceMode && typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem('sovereign_settings');
      if (raw) {
        const s = JSON.parse(raw);
        custom = {
          ...custom,
          appearanceMode: s.appearanceMode || s.appBackground || 'darkGray',
          accentColor: custom.accentColor || s.accentColor || (isDark ? '#C0C0C6' : '#475569'),
        };
      }
    } catch {}
  }

  const base = isDark
    ? MODOS[custom.appearanceMode] || MODOS.darkGray
    : LIGHT;

  const accent = custom.accentColor || (isDark ? '#EDEDF0' : '#18181B');
  const accentLight = isHexLight(accent);
  const accentHover = isDark
    ? (accentLight ? '#C4C4CC' : '#FFFFFF')
    : (accentLight ? '#334155' : '#09090B');

  const textColor = isDark ? '#ECECEC' : '#111827';
  const textSecondary = isDark ? '#9E9E9E' : '#4B5563';
  const textMuted = isDark ? '#7A7A7A' : '#6B7280';

  return {
    ...base,
    accent,
    accentHover,
    accentSoft: hexToRgba(accent, isDark ? 0.08 : 0.04),
    accentSoftHover: hexToRgba(accent, isDark ? 0.14 : 0.08),
    accentGlow: hexToRgba(accent, isDark ? 0.08 : 0.04),
    text: textColor,
    textSecondary,
    textMuted,
    textDim: isDark ? '#5A5A5A' : '#9CA3AF',
    hover: hexToRgba(textColor, 0.05),
    hoverActive: hexToRgba(textColor, 0.09),
    glow: hexToRgba(textColor, 0.05),
    inputBg: isDark ? '#2A2A2A' : '#FFFFFF',
    danger: '#EF4444',
    dangerSoft: 'rgba(239,68,68,0.08)',
    warning: '#F59E0B',
    success: '#10B981',
  };
}

export const c = getTheme(true);
export { useTheme } from './useTheme';
