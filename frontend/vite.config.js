import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'build',      // nginx serves from frontend/build/
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    proxy: {
      // Proxy API calls to voice-gateway during local dev
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
});
