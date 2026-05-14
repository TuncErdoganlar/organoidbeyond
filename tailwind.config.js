/** @type {import('tailwindcss').Config} */
// -----------------------------------------------------------------------------
// Tailwind configuration. Step 1 only needs Tailwind to be wired in so the
// scaffolded entry file compiles. Step 2 will extend the theme with the
// scientific-dashboard palette.
// -----------------------------------------------------------------------------
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Placeholder brand palette — will be tuned in Step 2.
        brand: {
          50:  '#f0f7ff',
          500: '#2563eb',
          700: '#1d4ed8',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
