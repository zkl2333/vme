import { type Config } from 'tailwindcss'

export default {
  content: ['./{src,mdx}/**/*.{js,mjs,jsx,ts,tsx,mdx}'],
  darkMode: 'selector',
  theme: {
    extend: {
      fontSize: {
        '2xs': '.6875rem',
      },
      fontFamily: {
        sans: 'var(--font-inter)',
        display: 'var(--font-mona-sans)',
        kfc: ['"Helvetica Neue"', 'Arial', 'sans-serif'],
        funny: ['"Comic Sans MS"', '"Bubblegum Sans"', 'cursive'],
      },
      colors: {
        kfc: {
          red: '#E02020',
          darkRed: '#C11111',
          yellow: '#FFC72C',
          lightYellow: '#FFE082',
          brown: '#8B4513',
          cream: '#FFF8E1',
        },
      },
      boxShadow: {
        kfc: '0 4px 14px 0 rgba(224, 32, 32, 0.3)',
        'kfc-hover': '0 8px 24px 0 rgba(224, 32, 32, 0.4)',
      },
      opacity: {
        2.5: '0.025',
        7.5: '0.075',
        15: '0.15',
      },
      animation: {
        'chicken-rotate': 'chickenRotate 6s ease-in-out infinite',
        'pulse-soft': 'pulseSoft 2s infinite',
        'slide-up': 'slideUp 0.6s ease-out forwards',
        'float-effect': 'float 3s ease-in-out infinite',
        shine: 'shine 3s infinite',
      },
      keyframes: {
        chickenRotate: {
          '0%, 100%': { transform: 'rotate(-5deg) scale(1)' },
          '50%': { transform: 'rotate(5deg) scale(1.05)' },
        },
        pulseSoft: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shine: {
          '0%': { transform: 'rotate(30deg) translateX(-100%)' },
          '100%': { transform: 'rotate(30deg) translateX(100%)' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config
