import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          blue:   '#4F6DF5',
          aqua:   '#3ED1C6',
          purple: '#7A5CFF',
          bg:     '#EAF6FF',
          card:   '#FFFFFF',
          text:   '#1E293B',
          muted:  '#64748B',
        },
      },
      fontFamily: {
        sans: [
          '-apple-system', 'BlinkMacSystemFont', 'Hiragino Sans',
          'Hiragino Kaku Gothic ProN', 'Noto Sans JP',
          'sans-serif'
        ],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        card: '0 2px 16px 0 rgba(79, 109, 245, 0.08)',
        'card-lg': '0 4px 32px 0 rgba(79, 109, 245, 0.12)',
      },
    },
  },
  plugins: [],
} satisfies Config
