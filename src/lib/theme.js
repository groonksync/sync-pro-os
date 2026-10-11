// Escala "Gris Esencial": fondo grafito, paneles ligeramente más claros.
const GRAY_SCALE = {
  bg:         '#1A1A1C',
  sidebar:    '#232326',
  panel:      '#232326',
  surface:    '#2A2A2E',
  card:       '#232326',
  cardHover:  '#2D2D31',
  input:      '#2A2A2E',
  border:     '#333336',
  borderLight:'#3D3D41',
  overlay:    'rgba(26,26,28,0.96)',
};

const MODOS = {
  darkGray: { ...GRAY_SCALE },
  black: {
    bg: '#121214', panel: '#1A1A1C', surface: '#202024',
    card: '#1A1A1C', cardHover: '#242428', input: '#202024',
    border: '#2A2A2D', borderLight: '#343438',
    overlay: 'rgba(18,18,20,0.98)',
  },
  lightGray: {
    bg: '#222225', panel: '#2B2B2F', surface: '#323236',
    card: '#2B2B2F', cardHover: '#34343A', input: '#323236',
    border: '#3C3C40', borderLight: '#46464A',
    overlay: 'rgba(34,34,37,0.96)',
  },
};

const LIGHT = {
  bg: '#F2F2F3', panel: '#FFFFFF', surface: '#EAEAEC',
  card: '#FFFFFF', cardHover: '#F7F7F8',
  input: '#FFFFFF', border: '#E0E0E3', borderLight: '#EAEAEC',
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
          accentColor: custom.accentColor || s.accentColor || (isDark ? '#E8E8EA' : '#1C1C1E'),
        };
      }
    } catch {}
  }

  const base = isDark
    ? MODOS[custom.appearanceMode] || MODOS.darkGray
    : LIGHT;

  const accent = custom.accentColor || (isDark ? '#E8E8EA' : '#1C1C1E');
  const accentLight = isHexLight(accent);
  const accentHover = isDark
    ? (accentLight ? '#C4C4CC' : '#FFFFFF')
    : (accentLight ? '#4A4A50' : '#000000');

  const textColor = isDark ? '#E8E8EA' : '#1C1C1E';
  const textSecondary = isDark ? '#A0A0A6' : '#4A4A50';
  const textMuted = isDark ? '#8A8A90' : '#7A7A80';

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
    textDim: isDark ? '#5E5E64' : '#A0A0A6',
    hover: hexToRgba(textColor, 0.05),
    hoverActive: hexToRgba(textColor, 0.09),
    glow: hexToRgba(textColor, 0.05),
    inputBg: isDark ? '#2A2A2E' : '#FFFFFF',
    danger: '#EF4444',
    dangerSoft: 'rgba(239,68,68,0.08)',
    warning: '#F59E0B',
    success: '#10B981',
  };
}

export const c = getTheme(true);
export { useTheme } from './useTheme';
