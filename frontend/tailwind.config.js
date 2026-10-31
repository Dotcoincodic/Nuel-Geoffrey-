export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: { sans: ['Poppins', 'Futura', 'Century Gothic', 'sans-serif'] },
      colors: {
        primary: { DEFAULT: '#E0A100', soft: '#F2C23A', ink: '#1A1400' },
        paper: { DEFAULT: '#F7F7F4', raised: '#FFFFFF' },
        night: { DEFAULT: '#121211', raised: '#1C1C1A' },
      },
      keyframes: { marquee: { to: { transform: 'translateX(-50%)' } } },
      animation: { marquee: 'marquee 28s linear infinite' },
    },
  },
}
