// vite.config.ts
// -----------------------------------------------------------------------------
// Vite build configuration. We keep it intentionally minimal: the React plugin
// gives us Fast Refresh + JSX transform, and we expose a `@` path alias so we
// can import as `@/services/...` instead of relative `../../services/...`.
// -----------------------------------------------------------------------------

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // The '@' alias maps to the `src/` directory. Combined with the matching
      // entry in `tsconfig.json#compilerOptions.paths`, both Vite and the
      // TypeScript compiler will agree on how to resolve `@/foo` imports.
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    open: true,
  },
});
