const GRAY_SCALE = {
  bg:         '#121214',
  panel:      '#121214',
  surface:    '#18181C',
  card:       '#1E1E22',
  input:      '#242427',
  border:     '#222225',
  borderLight:'#2D2D32',
  overlay:    'rgba(18,18,20,0.96)',
};

const MODOS = {
  darkGray: { ...GRAY_SCALE },
  black: {
    bg: '#0A0A0C', panel: '#0A0A0C', surface: '#121215',
    input: '#1A1A1E', border: '#202024', borderLight: '#2A2A30',
    overlay: 'rgba(10,10,12,0.95)',
  },
  lightGray: {
    bg: '#1C1C1E', panel: '#1C1C1E', surface: '#242427',
    input: '#2D2D30', border: '#3A3A3E', borderLight: '#46464B',
    overlay: 'rgba(28,28,30,0.96)',
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
    accentSoft: hexToRgba(accent, isDark ? 0.12 : 0.08),
    accentSoftHover: hexToRgba(accent, isDark ? 0.18 : 0.12),
    accentGlow: hexToRgba(accent, isDark ? 0.16 : 0.08),
    text: textColor,
    textSecondary,
    textMuted,
    textDim: isDark ? '#52525A' : '#94A3B8',
    hover: hexToRgba(textColor, isDark ? 0.05 : 0.04),
    hoverActive: hexToRgba(textColor, isDark ? 0.09 : 0.07),
    glow: hexToRgba(textColor, 0.08),
    inputBg: isDark ? 'rgba(255,255,255,0.03)' : '#FFFFFF',
    glassBg: isDark ? 'rgba(18, 18, 22, 0.72)' : 'rgba(255, 255, 255, 0.82)',
    glassBorder: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
    innerHighlight: isDark ? 'inset 0 1px 0 0 rgba(255, 255, 255, 0.07)' : 'inset 0 1px 0 0 rgba(255, 255, 255, 0.9)',
    card: isDark ? 'rgba(24, 24, 28, 0.65)' : '#FFFFFF',
    cardHover: isDark ? 'rgba(30, 30, 36, 0.85)' : '#F9FAFB',
    danger: '#F14C4C',
    dangerSoft: 'rgba(241,76,76,0.12)',
    warning: '#F59E0B',
    warningSoft: 'rgba(245,158,11,0.12)',
    success: '#10B981',
    successSoft: 'rgba(16,185,129,0.12)',
  };
}

export const c = getTheme(true);
export { useTheme } from './useTheme';
