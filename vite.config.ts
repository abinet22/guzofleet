import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig(({ mode }) => {
  // Load env from .env files
  const env = loadEnv(mode, process.cwd(), '');
  
  // ALWAYS use the real server URL for proxy target, never '/api'
  const traccarUrl = env.VITE_TRACCAR_BASE_URL?.startsWith('http') 
    ? env.VITE_TRACCAR_BASE_URL 
    : 'https://gps.waltapharmaceuticals.pro.et';
  
  console.log('Proxy target:', traccarUrl); // Debug log

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      proxy: {
        '/api': {
          target: traccarUrl, // Must be full URL like https://gps.waltapharmaceuticals.pro.et
          changeOrigin: true,
          secure: true,
          // Don't rewrite path - keep /api
        },
        '/socket': {
          target: traccarUrl.replace('https://', 'wss://').replace('http://', 'ws://'),
          changeOrigin: true,
          ws: true,
          secure: true,
          rewrite: (path) => path.replace(/^\/socket/, '/api/socket'),
        },
      },
    },
  };
});