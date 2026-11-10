import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In development, the React app runs on :5173 and forwards API calls to the
// PHP server on :8000. `npm run build` writes the finished app into
// backend/public, so one PHP/Apache folder serves both.
export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    host: true,
    proxy: {
      '/api.php': 'http://127.0.0.1:8000',
    },
  },
  build: {
    outDir: '../backend/public',
    emptyOutDir: false,
  },
});
