/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'bg-page': '#FAFAF9',
        'bg-surface': '#FFFFFF',
        'bg-subtle': '#F4F4F5',
        'bg-hover': '#E4E4E7',
        'bg-mint': '#EEF2FF',
        accent: {
          DEFAULT: '#4338CA',
          hover: '#4F46E5',
          light: '#EEF2FF',
          border: '#C7D2FE',
          bright: '#6366F1',
          blue: '#4338CA',
          violet: '#6366F1',
          cyan: '#6366F1',
          glow: '#818CF8',
        },
        brand: {
          DEFAULT: '#0F172A',
          mid: '#1E293B',
          light: '#A5B4FC',
        },
        'tx-primary': '#18181B',
        'tx-body': '#52525B',
        'tx-secondary': '#71717A',
        'tx-muted': '#A1A1AA',
        'bd-default': '#E4E4E7',
        'bd-strong': '#D4D4D8',
        navy: {
          DEFAULT: '#0F172A',
          mid: '#1E293B',
        },
        success: '#16A34A',
        warning: '#D97706',
        danger: '#DC2626',
        canvas: {
          DEFAULT: 'rgb(var(--canvas) / <alpha-value>)',
          elevated: 'rgb(var(--canvas-elevated) / <alpha-value>)',
          card: 'rgb(var(--canvas-card) / <alpha-value>)',
        },
        foreground: {
          DEFAULT: 'rgb(var(--foreground) / <alpha-value>)',
          muted: 'rgb(var(--foreground-muted) / <alpha-value>)',
        },
        border: {
          DEFAULT: 'rgb(var(--border-rgb) / var(--border-alpha))',
          strong: 'rgb(var(--border-rgb) / var(--border-alpha-strong))',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'JetBrains Mono', 'Fira Code', 'ui-monospace', 'monospace'],
        display: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        hero: ['clamp(2.75rem,5.5vw,4.5rem)', { lineHeight: '1.05', letterSpacing: '-0.035em', fontWeight: '800' }],
        section: ['clamp(1.875rem,3.5vw,2.75rem)', { lineHeight: '1.1', letterSpacing: '-0.03em', fontWeight: '700' }],
        'card-h': ['1.25rem', { lineHeight: '1.35', letterSpacing: '-0.015em', fontWeight: '600' }],
        label: ['0.6875rem', { lineHeight: '1', letterSpacing: '0.12em', fontWeight: '700' }],
      },
      boxShadow: {
        card: '0 1px 2px rgba(24,24,27,0.04), 0 4px 16px rgba(24,24,27,0.06)',
        'card-hover': '0 8px 32px rgba(67,56,202,0.12), 0 2px 8px rgba(24,24,27,0.06)',
        'card-dark': '0 1px 4px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.04)',
        'card-dark-hover': '0 4px 20px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.08)',
        float: '0 24px 64px rgba(67,56,202,0.14), 0 8px 24px rgba(24,24,27,0.08)',
        nav: '0 4px 24px rgba(24,24,27,0.08), 0 0 0 1px rgba(228,228,231,0.8)',
        glow: '0 0 40px -8px rgba(99,102,241,0.35)',
        'glow-violet': '0 0 50px -10px rgba(99,102,241,0.25)',
        'glow-light': '0 1px 12px rgba(24,24,27,0.06)',
      },
      borderRadius: {
        card: '1.25rem',
        btn: '0.625rem',
        chip: '999px',
        nav: '999px',
      },
      backgroundSize: {
        grid: '48px 48px',
      },
      animation: {
        'pulse-soft': 'pulse-soft 3s ease-in-out infinite',
        float: 'float 6s ease-in-out infinite',
      },
      keyframes: {
        'pulse-soft': {
          '0%, 100%': { opacity: '0.5' },
          '50%': { opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
      },
    },
  },
  plugins: [],
};
