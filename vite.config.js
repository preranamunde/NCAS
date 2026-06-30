import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://ncas.nutanteksolutions.cloud',
        changeOrigin: true,
      },
      '/media': {
        target: 'https://ncas.nutanteksolutions.cloud',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});