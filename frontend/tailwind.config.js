/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
          50:  '#f2f7f4',
          100: '#e1ede6',
          200: '#c5dbcf',
          300: '#9ec1af',
          400: '#72a28b',
          500: '#4d836b',
          600: '#315C4A', // Forest Green
          700: '#284b3c',
          800: '#223c31',
          900: '#1d3229',
          950: '#0e1c16',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        gov: {
          bg: '#F8F7F2',
          surface: '#FFFFFF',
          text: '#202522',
          muted: '#68716B',
          forest: '#315C4A',
          sage: '#78917F',
          sageLight: '#EFF4F0',
          terracotta: '#C58B5B',
          terracottaLight: '#FDF6F0',
          gold: '#C8A96B',
          goldLight: '#FAF6ED',
          border: '#E5E5DE',
          borderSubtle: '#F0EFEA',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Manrope', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['Merriweather', 'Georgia', 'serif'],
      },
      borderRadius: {
        xl:  'calc(var(--radius) + 4px)',
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(32, 37, 34, 0.04), 0 1px 2px -1px rgba(32, 37, 34, 0.03)',
        'card-hover': '0 6px 16px -4px rgba(32, 37, 34, 0.06), 0 2px 6px -2px rgba(32, 37, 34, 0.04)',
        subtle: '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        dropdown: '0 10px 25px -5px rgba(32, 37, 34, 0.08), 0 8px 10px -6px rgba(32, 37, 34, 0.04)',
        'card-3d': '0 2px 8px -2px rgba(32, 37, 34, 0.05)',
        'card-3d-hover': '0 8px 20px -4px rgba(32, 37, 34, 0.08)',
        'glow-blue': '0 0 0 1px rgba(49, 92, 74, 0.15)',
        'glow-cyan': '0 0 0 1px rgba(120, 145, 127, 0.2)',
        'glow-amber': '0 0 0 1px rgba(197, 139, 91, 0.2)',
        'glow-rose': '0 0 0 1px rgba(220, 38, 38, 0.15)',
      },
      animation: {
        'fade-in': 'fadeIn 0.25s ease-out',
        'fade-in-up': 'fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-in': 'slideIn 0.3s ease-out',
        'pulse-soft': 'pulseSoft 2.5s cubic-bezier(0.4,0,0.6,1) infinite',
        'pulse-glow': 'pulseGlow 3s ease-in-out infinite',
        'float': 'float 5s ease-in-out infinite',
        'float-slow': 'float 9s ease-in-out infinite',
        'shimmer': 'shimmer 2.5s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateX(-8px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.6', filter: 'drop-shadow(0 0 10px rgba(37, 99, 235, 0.4))' },
          '50%': { opacity: '1', filter: 'drop-shadow(0 0 20px rgba(6, 182, 212, 0.7))' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        shimmer: {
          from: { backgroundPosition: '200% 0' },
          to: { backgroundPosition: '-200% 0' },
        }
      },
    },
  },
  plugins: [],
};
