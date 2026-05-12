import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        'linku-bg': '#050814',
        'linku-bg-2': '#0A1428',
        'linku-bg-3': '#0F1B33',
        'linku-coral': '#FF5A5F',
        'linku-coral-soft': '#FF7B7F',
        'linku-coral-glow': 'rgba(255, 90, 95, 0.15)',
        'linku-text': '#E8EEF5',
        'linku-text-muted': '#8A9BB0',
        'linku-text-dim': '#5A6B82',
        'linku-border': 'rgba(255, 255, 255, 0.06)',
        'linku-border-2': 'rgba(255, 255, 255, 0.10)'
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif']
      },
      letterSpacing: {
        tightish: '-0.02em',
        tighter2: '-0.03em'
      },
      backgroundImage: {
        'hero-glow':
          'radial-gradient(ellipse at top right, rgba(255,90,95,0.18) 0%, transparent 60%)',
        'section-glow':
          'radial-gradient(ellipse at center, rgba(255,90,95,0.10) 0%, transparent 70%)',
        'card-gradient':
          'linear-gradient(180deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0) 100%)',
        'coral-divider':
          'linear-gradient(90deg, transparent, rgba(255,90,95,0.3), transparent)'
      },
      boxShadow: {
        'coral-glow': '0 0 40px rgba(255,90,95,0.2)',
        'coral-glow-strong': '0 0 60px rgba(255,90,95,0.35)'
      },
      keyframes: {
        'pulse-coral': {
          '0%, 100%': {
            boxShadow: '0 0 0 0 rgba(255,90,95,0.6)'
          },
          '50%': {
            boxShadow: '0 0 0 8px rgba(255,90,95,0)'
          }
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' }
        }
      },
      animation: {
        'pulse-coral': 'pulse-coral 2s ease-out infinite',
        'fade-up': 'fade-up 0.6s ease-out forwards',
        marquee: 'marquee 40s linear infinite'
      }
    }
  },
  plugins: []
};

export default config;
