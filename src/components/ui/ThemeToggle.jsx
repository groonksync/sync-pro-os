import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../lib/theme';

/** Conmutador día/noche en forma de píldora sol/luna. */
export default function ThemeToggle({ isDark, setIsDark }) {
  const t = useTheme(isDark);

  const btn = (active) => ({
    width: 28,
    height: 28,
    borderRadius: 9999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: 'none',
    cursor: 'pointer',
    backgroundColor: active ? t.card : 'transparent',
    color: active ? t.text : t.textMuted,
    boxShadow: active && !isDark ? '0 1px 3px rgba(0,0,0,0.12)' : 'none',
    transition: 'all 150ms ease',
  });

  return (
    <div
      className="inline-flex items-center p-0.5 rounded-full"
      style={{ backgroundColor: t.surface, border: `1px solid ${t.border}` }}
      role="group"
      aria-label="Modo de color"
    >
      <button type="button" onClick={() => setIsDark(false)} style={btn(!isDark)} title="Modo día" aria-pressed={!isDark}>
        <Sun size={14} />
      </button>
      <button type="button" onClick={() => setIsDark(true)} style={btn(isDark)} title="Modo noche" aria-pressed={isDark}>
        <Moon size={14} />
      </button>
    </div>
  );
}
