/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        body: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        headline: ['Manrope', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      colors: {
        /* Primary */
        'primary': '#005bc1',
        'primary-dim': '#3a7be0',
        'primary-container': '#d4e3ff',
        'primary-fixed': '#d4e3ff',
        'primary-fixed-dim': '#a5c4f7',
        'on-primary': '#ffffff',
        'on-primary-container': '#001a41',
        'on-primary-fixed-variant': '#003d8f',

        /* Secondary */
        'secondary': '#555f71',
        'secondary-container': '#d9e3f7',
        'on-secondary': '#ffffff',
        'on-secondary-container': '#12202f',

        /* Tertiary */
        'tertiary': '#8e2fbd',
        'tertiary-container': '#f2daff',
        'on-tertiary': '#ffffff',
        'on-tertiary-container': '#310049',

        /* Error */
        'error': '#ba1a1a',
        'error-container': '#ffdad6',
        'on-error': '#ffffff',
        'on-error-container': '#410002',

        /* Surface (Light Theme) — matched to global #F5F7FA grey */
        'surface': '#F5F7FA',
        'surface-container-lowest': '#FFFFFF',
        'surface-container-low': '#F0F2F5',
        'surface-container': '#EAECF0',
        'surface-container-high': '#E2E5EA',
        'surface-container-highest': '#DCDFE4',
        'on-surface': '#191c20',
        'on-surface-variant': '#43474e',
      },
    },
  },
  plugins: [],
}
