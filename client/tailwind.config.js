// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        sidebar: {
          bg:      '#12183A',
          hover:   'rgba(255,255,255,0.05)',
          active:  'rgba(59,130,246,0.18)',
          border:  'rgba(255,255,255,0.07)',
          text:    'rgba(255,255,255,0.55)',
          'text-active': '#ffffff',
          'text-muted':  'rgba(255,255,255,0.25)',
        },
        brand: {
          50:  '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
          900: '#1E3A8A',
        },
        surface: {
          page:   '#F5F6FA',
          card:   '#FFFFFF',
          border: '#E8EAF0',
          input:  '#F8FAFC',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'monospace'],
      },
      borderRadius: {
        card: '12px',
        btn:  '8px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.08)',
      },
    },
  },
  plugins: [],
}