/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#1C1B22',
        graphite: '#26252E',
        panel: '#2F2E38',
        keycap: '#F4B942',
        keycapDeep: '#D99A1F',
        mint: '#3FBF9F',
        coral: '#E85D5D',
        paper: '#F6F4EF',
        muted: '#9C9AA8',
      },
      fontFamily: {
        display: ['"Black Han Sans"', 'sans-serif'],
        body: ['"Pretendard"', '"Noto Sans KR"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      borderRadius: {
        key: '6px',
      },
      boxShadow: {
        key: '0 4px 0 0 rgba(0,0,0,0.35)',
        keyPressed: '0 1px 0 0 rgba(0,0,0,0.35)',
      },
    },
  },
  plugins: [],
}
