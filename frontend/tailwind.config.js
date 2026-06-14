/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        sez: {
          blue:   '#185FA5',
          teal:   '#0F6E56',
          amber:  '#854F0B',
          coral:  '#993C1D',
          green:  '#3B6D11',
          purple: '#534AB7',
        }
      }
    }
  },
  plugins: [],
}
