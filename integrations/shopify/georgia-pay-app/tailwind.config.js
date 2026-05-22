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
        canvas: {
          DEFAULT: '#050508',
          elevated: '#0a0a10',
          card: '#0f0f16',
          border: 'rgba(255,255,255,0.06)',
        },
        accent: {
          blue: '#3b82f6',
          violet: '#8b5cf6',
          cyan: '#22d3ee',
          glow: '#60a5fa',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
        display: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 40px -8px rgba(59, 130, 246, 0.45)',
        'glow-violet': '0 0 50px -10px rgba(139, 92, 246, 0.4)',
        card: '0 4px 24px -4px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)',
        lift: '0 20px 50px -20px rgba(0,0,0,0.7)',
      },
      backgroundImage: {
        'mesh-gradient':
          'radial-gradient(ellipse 80% 60% at 20% 20%, rgba(59,130,246,0.15), transparent 50%), radial-gradient(ellipse 60% 50% at 80% 10%, rgba(139,92,246,0.12), transparent 45%), radial-gradient(ellipse 50% 40% at 50% 100%, rgba(34,211,238,0.08), transparent 50%)',
        'grid-fade':
          'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
      },
      backgroundSize: {
        grid: '64px 64px',
      },
      animation: {
        'pulse-soft': 'pulse-soft 3s ease-in-out infinite',
        shimmer: 'shimmer 2.5s linear infinite',
        float: 'float 6s ease-in-out infinite',
      },
      keyframes: {
        'pulse-soft': {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
      },
    },
  },
  plugins: [],
};
