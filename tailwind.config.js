/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Space Grotesk', 'Inter', 'system-ui', 'sans-serif'],
        display: ['Space Grotesk', 'Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Dark Elegant Gray Palette
        deep: '#141414',
        panel: '#202022',
        surface: '#28282b',
        border: '#2e2e30',
        'border-light': '#3a3a3d',
        accent: '#a0a0a0',
        'accent-hover': '#bbbbbb',
        'accent-soft': 'rgba(255, 255, 255, 0.07)',
        'accent-glow': 'rgba(255, 255, 255, 0.10)',
        'text-primary': '#d4d4d4',
        'text-secondary': '#9e9e9e',
        'text-muted': '#707070',
        'input-bg': '#28282b',
        danger: '#f14c4c',
        warning: '#cca700',
        success: '#4ec9b0',
      },
      borderRadius: {
        'pill': '9999px',
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
      },
    },
  },
  plugins: [],
}
