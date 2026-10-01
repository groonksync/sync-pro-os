const GRAY_SCALE = {
  bg:         '#070709',
  panel:      '#0A0A0D',
  surface:    '#0F0F13',
  card:       '#121217',
  input:      '#15151A',
  border:     '#1B1B22',
  borderLight:'#262630',
  overlay:    'rgba(7,7,9,0.96)',
};

const MODOS = {
  darkGray: { ...GRAY_SCALE },
  black: {
    bg: '#040406', panel: '#070709', surface: '#0B0B0E',
    card: '#0E0E12', input: '#121216', border: '#17171E', borderLight: '#202028',
    overlay: 'rgba(4,4,6,0.98)',
  },
  lightGray: {
    bg: '#0A0A0D', panel: '#0D0D11', surface: '#121216',
    card: '#16161B', input: '#1A1A20', border: '#22222A', borderLight: '#2E2E38',
    overlay: 'rgba(10,10,13,0.96)',
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

  const textColor = isDark ? '#F4F4F6' : '#09090B';
  const textSecondary = isDark ? '#A1A1AA' : '#52525B';
  const textMuted = isDark ? '#71717A' : '#71717A';

  return {
    ...base,
    accent,
    accentHover,
    accentSoft: hexToRgba(accent, isDark ? 0.06 : 0.04),
    accentSoftHover: hexToRgba(accent, isDark ? 0.12 : 0.08),
    accentGlow: hexToRgba(accent, isDark ? 0.08 : 0.04),
    text: textColor,
    textSecondary,
    textMuted,
    textDim: isDark ? '#52525B' : '#A1A1AA',
    hover: hexToRgba(textColor, 0.04),
    hoverActive: hexToRgba(textColor, 0.08),
    glow: hexToRgba(textColor, 0.06),
    inputBg: isDark ? 'rgba(255,255,255,0.025)' : '#FFFFFF',
    danger: '#EF4444',
    dangerSoft: 'rgba(239,68,68,0.08)',
    warning: '#F59E0B',
    success: '#10B981',
  };
}

export const c = getTheme(true);
export { useTheme } from './useTheme';
