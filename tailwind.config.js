/** @type {import('tailwindcss').Config} */
// -----------------------------------------------------------------------------
// Tailwind configuration tuned for a "clean scientific" dashboard:
//   - Slate-based neutral palette (calm, paper-like in light mode).
//   - Blue accent for actionable controls — slightly brighter in dark mode.
//   - One subtle category accent per topic so chips are recognizable without
//     screaming.
//
// Dark mode is **class-based** so we can toggle it deterministically (a
// boot-time script in index.html flips `<html class="dark">` before React
// mounts, avoiding a flash of light theme). See `src/main.tsx` and the Header
// toggle for the runtime side.
// -----------------------------------------------------------------------------
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Primary brand / action color (focus rings, active states, links).
        brand: {
          50:  '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          400: '#60a5fa',
          500: '#2563eb',
          600: '#1d4ed8',
          700: '#1e40af',
        },
        // Subtle category accents. Kept low-saturation so cards still read as
        // a unified set — the category dot is a hint, not a decoration.
        category: {
          organoid: '#0d9488', // teal-600
          stemcell: '#059669', // emerald-600
          cancer: '#dc2626', // red-600
          crispr: '#7c3aed', // violet-600
          epigenetics: '#ca8a04', // yellow-600
          gene: '#0284c7', // sky-600
          omics: '#c2410c', // orange-700
          immunology: '#a16207', // amber-700
          general: '#475569', // slate-600
        },
      },
      fontFamily: {
        // Inter is loaded via Google Fonts in index.html (see <link>).
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        // A soft card shadow that doesn't fight the paper aesthetic.
        card: '0 1px 2px 0 rgb(15 23 42 / 0.04), 0 1px 3px 0 rgb(15 23 42 / 0.06)',
        'card-hover':
          '0 4px 12px -2px rgb(15 23 42 / 0.08), 0 2px 6px -1px rgb(15 23 42 / 0.06)',
      },
    },
  },
  plugins: [],
};
