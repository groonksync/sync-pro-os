/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Geist', 'Inter', 'system-ui', 'sans-serif'],
        display: ['Space Grotesk', 'Geist', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      colors: {
        obsidian: {
          950: '#08080A',
          900: '#0C0C0F',
          850: '#111113',
          800: '#16161A',
          750: '#1C1C22',
          700: '#24242C',
        },
        ash: {
          700: '#2E2E36',
          600: '#3A3A44',
          500: '#484853',
          400: '#5A5A66',
          300: '#70707A',
          200: '#8C8C94',
          100: '#A8A8AE',
        },
        silver: {
          400: '#B8B8C0',
          300: '#C8C8CF',
          200: '#D4D4D9',
          100: '#E0E0E4',
          50: '#ECECEE',
        },
        accent: {
          DEFAULT: '#C0C0C6',
          hover: '#D4D4D9',
          soft: 'rgba(192,192,198,0.08)',
          glow: 'rgba(192,192,198,0.12)',
        },
        danger: '#F14C4C',
        'danger-soft': 'rgba(241,76,76,0.1)',
        warning: '#CCA700',
        'warning-soft': 'rgba(204,167,0,0.1)',
        success: '#4EC9B0',
        'success-soft': 'rgba(78,201,176,0.1)',
      },
      borderRadius: {
        'pill': '9999px',
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
      },
      boxShadow: {
        'card': '0 1px 2px rgba(0,0,0,0.3), 0 4px 12px rgba(0,0,0,0.2)',
        'card-hover': '0 2px 4px rgba(0,0,0,0.4), 0 8px 24px rgba(0,0,0,0.3)',
        'panel': '0 0 0 1px rgba(255,255,255,0.04), 0 2px 8px rgba(0,0,0,0.3)',
        'glow': '0 0 24px rgba(192,192,198,0.06)',
        'dialog': '0 0 0 1px rgba(255,255,255,0.06), 0 16px 48px rgba(0,0,0,0.5)',
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'smooth': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
}
