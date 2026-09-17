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
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          Cookie: 'SOCS=CAESEwgDEgk2OTc3NjExMDUaAmVuIAEaBgiA_K-0Bg; CONSENT=PENDING+999',
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
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          Cookie: 'SOCS=CAESEwgDEgk2OTc3NjExMDUaAmVuIAEaBgiA_K-0Bg; CONSENT=PENDING+999',
        },
      },
      '/ytm-api': {
        target: 'https://music.youtube.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/ytm-api/, ''),
        headers: {
          Origin: 'https://music.youtube.com',
          Referer: 'https://music.youtube.com/',
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',
          Cookie: 'SOCS=CAESEwgDEgk2OTc3NjExMDUaAmVuIAEaBgiA_K-0Bg; CONSENT=PENDING+999',
        },
      },
    },
  },
});
