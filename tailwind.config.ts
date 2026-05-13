import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: {
          base: 'var(--bg-base)',
          surface: 'var(--bg-surface)',
          card: 'var(--bg-card)',
          elevated: 'var(--bg-elevated)',
        },
        accent: {
          primary: '#6C63FF',
          light: '#8B84FF',
          dark: '#5249E5',
        },
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444',
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
        },
        border: 'var(--border-color)',
      },
      boxShadow: {
        card: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        glow: '0 0 15px -3px rgba(108, 99, 255, 0.4)',
        'glow-success': '0 0 15px -3px rgba(16, 185, 129, 0.4)',
        'glow-danger': '0 0 15px -3px rgba(239, 68, 68, 0.4)',
        'glow-warning': '0 0 15px -3px rgba(245, 158, 11, 0.4)',
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(to right, var(--tw-gradient-stops))',
        'gradient-success': 'linear-gradient(to right, var(--tw-gradient-stops))',
        'card-primary': 'linear-gradient(135deg, rgba(108, 99, 255, 0.1) 0%, rgba(108, 99, 255, 0) 100%)',
        'card-success': 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0) 100%)',
        'card-danger': 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(239, 68, 68, 0) 100%)',
        'hero-glow': 'radial-gradient(circle at 50% 0%, rgba(108, 99, 255, 0.15) 0%, transparent 70%)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'fade-up': 'fadeUp 0.4s ease-out',
        'slide-in-left': 'slideInLeft 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          from: { backgroundPosition: '200% 0' },
          to: { backgroundPosition: '-200% 0' },
        },
      },
      fontFamily: {
        sans: ['Inter', 'Hind Siliguri', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config;
