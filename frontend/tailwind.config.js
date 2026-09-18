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
          DEFAULT: '#181817', // Charcoal
          foreground: '#FFFFFF',
          hover: '#292927',
        },
        secondary: {
          DEFAULT: '#FFFFFF',
          foreground: '#181817',
          border: '#DDDCD7',
        },
        destructive: {
          DEFAULT: '#E13B22',
          foreground: '#FFFFFF',
        },
        muted: {
          DEFAULT: '#EFEFEA',
          foreground: '#6F6F6A',
        },
        accent: {
          DEFAULT: '#F05A3C', // Warm Coral-Orange
          foreground: '#FFFFFF',
        },
        card: {
          DEFAULT: '#FFFFFF',
          foreground: '#181817',
        },
        civic: {
          canvas: '#F7F6F2',
          charcoal: '#181817',
          charcoalSubtle: '#292927',
          orange: '#F05A3C',
          orangeHover: '#FF7A59',
          orangeLight: '#FFF0EB',
          gray: '#6F6F6A',
          grayLight: '#A3A39E',
          border: '#DDDCD7',
          borderSubtle: '#E8E7E2',
          white: '#FFFFFF',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Manrope', 'DM Sans', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '0.375rem',
        sm: '0.25rem',
        md: '0.375rem',
        lg: '0.5rem',
        xl: '0.75rem',
        '2xl': '1rem',
      },
      boxShadow: {
        subtle: '0 1px 2px 0 rgba(24, 24, 23, 0.04)',
        card: '0 1px 3px 0 rgba(24, 24, 23, 0.05), 0 1px 2px -1px rgba(24, 24, 23, 0.04)',
        elevated: '0 4px 12px 0 rgba(24, 24, 23, 0.08)',
        orange: '0 4px 14px 0 rgba(240, 90, 60, 0.25)',
      },
    },
  },
  plugins: [],
};
