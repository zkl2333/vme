import { type Config } from 'tailwindcss'

export default {
  content: ['./{src,mdx}/**/*.{js,mjs,jsx,ts,tsx,mdx}'],
  darkMode: 'selector',
  theme: {
    extend: {
      fontSize: {
        '2xs': '.6875rem',
      },
      colors: {
        kfc: {
          red: '#C41200', // 更深更复古的红
          yellow: '#FFC72C', // 亮黄
          cream: '#F4F1EA', // 牛皮纸/旧报纸底色
          black: '#121212', // 墨黑
        },
      },
      boxShadow: {
        'neo': '4px 4px 0px 0px #000000',
        'neo-sm': '2px 2px 0px 0px #000000',
        'neo-lg': '6px 6px 0px 0px #000000',
        'neo-xl': '8px 8px 0px 0px #000000',
        'neo-red': '4px 4px 0px 0px #C41200',
        'neo-yellow': '4px 4px 0px 0px #FFC72C',
      },
      borderWidth: {
        '3': '3px',
      },
      fontFamily: {
        sans: ['"PingFang SC"', '"Microsoft YaHei"', '"Heiti SC"', 'var(--font-inter)', 'sans-serif'],
        display: ['var(--font-mona-sans)', '"PingFang SC"', '"Microsoft YaHei"', 'sans-serif'],
        kfc: ['"PingFang SC"', '"Microsoft YaHei"', 'Arial', 'sans-serif'],
        funny: ['"Comic Sans MS"', '"Bubblegum Sans"', '"PingFang SC"', '"Microsoft YaHei"', 'cursive'],
      },
    },
  },
  plugins: [],
} satisfies Config
