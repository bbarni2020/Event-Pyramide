import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [svelte()],
  server: {
    port: 5001,
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true
      },
      '/auth': {
        target: 'http://localhost:5001',
        changeOrigin: true
      }
    }
  }
});
