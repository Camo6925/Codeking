import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Ruckus Renditions brand palette
        ruckus: {
          black: '#0A0A0A',
          red: '#D4001A',
          'red-dark': '#A8001A',
          silver: '#C0C0C0',
          'gray-dark': '#1A1A1A',
          'gray-mid': '#2D2D2D',
          'gray-light': '#6B7280',
        },
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
      },
      screens: {
        xs: '375px',
      },
    },
  },
  plugins: [],
}

export default config
