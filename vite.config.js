import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const allowedHosts = (env.VITE_ALLOWED_HOSTS || 'localhost,127.0.0.1')
    .split(',')
    .map(host => host.trim())
    .filter(Boolean);
  const hmrHost = (env.VITE_HMR_HOST || '').trim();
  const hmrClientPort = Number(env.VITE_HMR_CLIENT_PORT || 443);
  
  return {
    plugins: [react()],
    server: {
      allowedHosts,
      host: env.VITE_DEV_HOST || '0.0.0.0',
      port: Number(env.VITE_DEV_PORT || 5001),
      ...(hmrHost ? {
        hmr: {
          host: hmrHost,
          protocol: env.VITE_HMR_PROTOCOL || 'wss',
          clientPort: hmrClientPort
        }
      } : {}),
      proxy: {
        '/api': {
          target: env.VITE_API_URL || 'http://localhost:5002',
          changeOrigin: true
        },
        '/auth': {
          target: env.VITE_API_URL || 'http://localhost:5002',
          changeOrigin: true
        }
      }
    },
    define: {
      'import.meta.env.VITE_CURRENCY': JSON.stringify(env.CURRENCY || 'HUF')
    }
  };
});
