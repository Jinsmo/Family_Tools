import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [vue()],
    server: {
      host: env.HOST || '127.0.0.1',
      port: Number(env.PORT) || 5173,
      allowedHosts: ['fm.jinsmo.com', 'localhost', '127.0.0.1'],
      proxy: {
        '/auth': {
          target: 'http://127.0.0.1:3000',
          changeOrigin: true,
        },
        '/api': {
          target: 'http://127.0.0.1:3000',
          changeOrigin: true,
        },
        '/uploads': {
          target: 'http://127.0.0.1:3000',
          changeOrigin: true,
        },
        '/health': {
          target: 'http://127.0.0.1:3000',
          changeOrigin: true,
        }
      }
    }
  };
});
