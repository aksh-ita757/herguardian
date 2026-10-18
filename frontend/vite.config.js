import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
// Uncomment the line below to enable HTTPS (required for camera + voice SOS on a phone during local dev):
// import basicSsl from '@vitejs/plugin-basic-ssl';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [
      react(),
      // basicSsl(),   // ← Uncomment for HTTPS dev server
    ],
    server: {
      port: 5173,
      proxy: {
        // Local dev only: /api calls are forwarded to the Express backend.
        // In production the app calls VITE_API_URL directly (see src/config.js).
        '/api': {
          target:       env.VITE_DEV_API_TARGET || 'http://localhost:5000',
          changeOrigin: true,
        },
      },
    },
    build: {
      sourcemap: false,
      chunkSizeWarningLimit: 700,
    },
  };
});
