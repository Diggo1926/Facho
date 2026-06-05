/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        cream: '#F5F0E8',
        surface: '#FDFAF5',
        terra: '#7A4A3A',
        caramel: '#C17A3A',
        gold: '#C9A87A',
        dark: '#2C1810',
        muted: '#6B5440',
        faint: '#A0896E',
        border: '#E0D8CC',
        'border-light': '#C9BFB0',
      },
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
      },
      borderRadius: {
        card: '10px',
        btn: '7px',
      },
    },
  },
  plugins: [],
};
