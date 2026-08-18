/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          base: '#0B0E14',
          panel: '#11151F',
          elevated: '#161B27',
          hover: '#1C2230',
        },
        edge: {
          subtle: '#1F2533',
          DEFAULT: '#2A3142',
          strong: '#3A4256',
        },
        bull: {
          DEFAULT: '#00E676',
          soft: '#00E67622',
          text: '#00E676',
        },
        bear: {
          DEFAULT: '#FF1744',
          soft: '#FF174422',
          text: '#FF1744',
        },
        warn: {
          DEFAULT: '#FFAB00',
          soft: '#FFAB0022',
        },
        accent: {
          DEFAULT: '#2979FF',
          soft: '#2979FF22',
        },
        neutral: {
          text: '#8B95A7',
          muted: '#5A6478',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      backdropBlur: {
        glass: '12px',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'ticker': 'ticker 30s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        ticker: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
    },
  },
  plugins: [],
};
