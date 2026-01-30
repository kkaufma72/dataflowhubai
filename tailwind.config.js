/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Shadcn compatibility
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        
        // IBM Blue - Primary brand color (Carbon Dark Theme)
        primary: {
          DEFAULT: '#0F62FE',
          foreground: "hsl(var(--primary-foreground))",
          50: '#E5F1FF',
          100: '#CCE3FF',
          200: '#99C7FF',
          300: '#66ABFF',
          400: '#338FFF',
          500: '#0F62FE',
          600: '#0043CE',
          700: '#002D9C',
          800: '#001D6C',
          900: '#001141'
        },
        // IBM Carbon Gray scale (Dark Theme)
        gray: {
          50: '#F4F4F4',    // Gray 10
          100: '#E0E0E0',   // Gray 20
          200: '#C6C6C6',   // Gray 30
          300: '#A8A8A8',   // Gray 40
          400: '#8D8D8D',   // Gray 50
          500: '#6F6F6F',   // Gray 60
          600: '#525252',   // Gray 70
          700: '#393939',   // Gray 80
          800: '#262626',   // Gray 90
          900: '#161616',   // Gray 100 (darkest background)
          950: '#0D0D0D'    // Extra dark
        },
        // IBM Success Green
        success: {
          DEFAULT: '#24A148',
          light: '#42BE65',
          dark: '#198038'
        },
        // IBM Warning Yellow
        warning: {
          DEFAULT: '#F1C21B',
          light: '#FFD449',
          dark: '#D4A00E'
        },
        // IBM Error Red
        error: {
          DEFAULT: '#DA1E28',
          light: '#FA4D56',
          dark: '#A2191F'
        },
        // IBM Info Blue
        info: {
          DEFAULT: '#0043CE',
          light: '#4589FF',
          dark: '#002D9C'
        },
        // Maintain backward compatibility
        secondary: {
          DEFAULT: '#24A148',
          foreground: "hsl(var(--secondary-foreground))",
          light: '#42BE65',
          dark: '#198038'
        },
        accent: {
          DEFAULT: '#0062FF',
          light: '#4589FF',
          dark: '#002D9C'
        }
      },
      fontFamily: {
        // IBM Plex Sans - IBM's official font family
        sans: ['IBM Plex Sans', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        heading: ['IBM Plex Sans', 'Montserrat', 'sans-serif'],
        body: ['IBM Plex Sans', 'Open Sans', 'sans-serif'],
        mono: ['IBM Plex Mono', 'Menlo', 'Monaco', 'Courier New', 'monospace']
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
      },
      boxShadow: {
        'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'DEFAULT': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      },
      borderRadius: {
        'none': '0',
        'sm': '0.25rem',
        'DEFAULT': '0.375rem',
        'md': '0.5rem',
        'lg': '0.75rem',
        'xl': '1rem',
        '2xl': '1.5rem',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fade-in 0.3s ease-out forwards',
        'fadeIn': 'fadeIn 0.5s ease-out forwards',
        'slide-in': 'slide-in 0.2s ease-out',
      },
      keyframes: {
        'fadeIn': {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
        'fade-in': {
          '0%': { opacity: 0, transform: 'translateY(-10px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        'slide-in': {
          '0%': { opacity: 0, transform: 'translateX(-10px)' },
          '100%': { opacity: 1, transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [],
  safelist: [
    'bg-blue-100',
    'bg-green-100',
    'bg-red-100',
    'bg-yellow-100',
    'bg-indigo-100',
    'bg-purple-100',
    'bg-pink-100',
    'bg-amber-100',
    'bg-emerald-100',
    'text-blue-500',
    'text-green-500',
    'text-red-500',
    'text-yellow-500',
    'text-indigo-500',
    'text-purple-500',
    'text-pink-500',
    'text-amber-500',
    'text-emerald-500',
    'dark:bg-blue-900',
    'dark:bg-green-900',
    'dark:bg-red-900',
    'dark:bg-yellow-900',
    'dark:bg-indigo-900',
    'dark:bg-purple-900',
    'dark:bg-pink-900',
    'dark:bg-amber-900',
    'dark:bg-emerald-900',
    'dark:text-blue-400',
    'dark:text-green-400',
    'dark:text-red-400',
    'dark:text-yellow-400',
    'dark:text-indigo-400',
    'dark:text-purple-400',
    'dark:text-pink-400',
    'dark:text-amber-400',
    'dark:text-emerald-400',
    'dark:bg-opacity-20',
  ]
};