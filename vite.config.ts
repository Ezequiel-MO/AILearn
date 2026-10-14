import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// Rutas hash: el sitio funciona en cualquier alojamiento estático, con base relativa.
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    rolldownOptions: {
      output: {
        // KaTeX pesa unos 270 kB: su propio trozo mantiene el de las pantallas de juego bajo el aviso de 500 kB.
        codeSplitting: {
          groups: [{ name: 'katex', test: /[\\/]node_modules[\\/]katex[\\/]/ }],
        },
      },
    },
  },
  test: {
    // Los `beforeAll` que cargan Pyodide tardan 7-14 s en frío y más con otro proceso pesado a la vez:
    // con el plazo por defecto (10 s) el gancho `pre-push` fallaba por carga y no por un defecto.
    // Los ficheros que fijan su propio plazo en el `beforeAll` lo conservan.
    hookTimeout: 120_000,
    // Playwright (tests/e2e) corre aparte; Vitest no lo recoge.
    exclude: ['**/node_modules/**', '**/dist/**', 'tests/e2e/**'],
    projects: [
      {
        extends: true,
        test: {
          name: 'node',
          environment: 'node',
          include: ['src/**/*.test.ts', 'tests/**/*.test.ts'],
          exclude: ['**/node_modules/**', '**/dist/**', 'tests/e2e/**'],
        },
      },
      {
        extends: true,
        test: {
          name: 'jsdom',
          environment: 'jsdom',
          include: ['src/**/*.test.tsx', 'tests/**/*.test.tsx'],
          exclude: ['**/node_modules/**', '**/dist/**', 'tests/e2e/**'],
          setupFiles: ['src/test-setup.ts'],
        },
      },
    ],
  },
});
