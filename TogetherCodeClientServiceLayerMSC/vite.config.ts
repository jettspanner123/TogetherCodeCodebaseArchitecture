import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './Src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/Api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/WebSocket': {
        target: 'ws://localhost:8080',
        ws: true,
      },
      '/ReverseProxy': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        ws: true,
      },
    },
  },
});
