import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: './',
  server: {
    port: 5173,
    strictPort: true,
    host: true,
    proxy: {
      '/yt-api': {
        target: 'https://www.youtube.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/yt-api/, ''),
        headers: {
          Origin: 'https://www.youtube.com',
          Referer: 'https://www.youtube.com/',
        },
      },
      '/yti-api': {
        target: 'https://youtubei.googleapis.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/yti-api/, ''),
        headers: {
          Origin: 'https://www.youtube.com',
          Referer: 'https://www.youtube.com/',
        },
      },
    },
  },
});
