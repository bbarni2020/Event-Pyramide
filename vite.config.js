import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react()],
    server: {
      port: 5001,
      proxy: {
        '/api': {
          target: 'http://localhost:5002',
          changeOrigin: true
        },
        '/auth': {
          target: 'http://localhost:5002',
          changeOrigin: true
        }
      }
    },
    define: {
      'import.meta.env.VITE_CURRENCY': JSON.stringify(env.CURRENCY || 'HUF')
    }
  };
});
