/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        profit: '#10b981',
        loss: '#ef4444',
      },
    },
  },
  plugins: [],
};
