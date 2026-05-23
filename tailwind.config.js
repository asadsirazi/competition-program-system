/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        bangla: ['SolaimanLipi', 'Noto Sans Bengali', 'sans-serif'],
        impact: ['Impact', 'Arial Black', 'sans-serif'],
      },
      colors: {
        ink: 'var(--ink)',
        muted: 'var(--muted)',
        line: 'var(--line)',
        paper: 'var(--paper)',
        accent: 'var(--accent)',
      },
    },
  },
  plugins: [],
}

