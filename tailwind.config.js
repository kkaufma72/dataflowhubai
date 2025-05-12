/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#4F46E5',
          light: '#6366F1',
          dark: '#4338CA'
        },
        secondary: {
          DEFAULT: '#10B981',
          light: '#34D399',
          dark: '#059669'
        },
        accent: {
          DEFAULT: '#F59E0B',
          light: '#FBBF24',
          dark: '#D97706'
        }
      },
      fontFamily: {
        heading: ['Montserrat', 'sans-serif'],
        body: ['Open Sans', 'sans-serif']
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fade-in 0.3s ease-out forwards',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: 0, transform: 'translateY(-10px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
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