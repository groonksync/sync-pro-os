const GRAY_SCALE = {
  bg:         '#0A0A0C',
  panel:      '#111113',
  surface:    '#16161A',
  card:       '#18181D',
  input:      '#1C1C24',
  border:     '#27272E',
  borderLight:'#33333C',
  overlay:    'rgba(10,10,12,0.95)',
};

const MODOS = {
  darkGray: { ...GRAY_SCALE },
  black: {
    bg: '#000000', panel: '#0A0A0C', surface: '#0F0F13',
    input: '#16161D', border: '#222228', borderLight: '#2C2C35',
    overlay: 'rgba(0,0,0,0.95)',
  },
  lightGray: {
    bg: '#1A1A20', panel: '#202026', surface: '#26262E',
    input: '#2E2E38', border: '#383844', borderLight: '#444452',
    overlay: 'rgba(26,26,32,0.95)',
  },
};

const LIGHT = {
  bg: '#F5F5F7', panel: '#FFFFFF', surface: '#FFFFFF',
  input: '#F0F0F2', border: 'rgba(0,0,0,0.07)', borderLight: 'rgba(0,0,0,0.04)',
  overlay: 'rgba(245,245,247,0.95)',
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

  const accent = custom.accentColor || (isDark ? '#C0C0C6' : '#475569');
  const accentLight = isHexLight(accent);
  const accentHover = isDark
    ? (accentLight ? '#A0A0A6' : '#D4D4D9')
    : (accentLight ? '#334155' : '#1e293b');

  const textColor = isDark ? '#ECECEE' : '#0F172A';
  const textSecondary = isDark ? '#A0A0A6' : '#475569';
  const textMuted = isDark ? '#6A6A72' : '#64748B';

  return {
    ...base,
    accent,
    accentHover,
    accentSoft: hexToRgba(accent, isDark ? 0.08 : 0.04),
    accentSoftHover: hexToRgba(accent, isDark ? 0.14 : 0.08),
    accentGlow: hexToRgba(accent, isDark ? 0.10 : 0.05),
    text: textColor,
    textSecondary,
    textMuted,
    textDim: isDark ? '#52525A' : '#94A3B8',
    hover: hexToRgba(textColor, 0.04),
    hoverActive: hexToRgba(textColor, 0.08),
    glow: hexToRgba(textColor, 0.08),
    inputBg: isDark ? 'rgba(255,255,255,0.03)' : '#FFFFFF',
    danger: '#F14C4C',
    dangerSoft: 'rgba(241,76,76,0.1)',
    warning: '#CCA700',
    success: '#4EC9B0',
  };
}

export const c = getTheme(true);
export { useTheme } from './useTheme';
