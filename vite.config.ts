import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

// Corrected Vite config for production deployment
export default defineConfig(({ mode, command }) => ({
  server: {
    host: '::',
    port: 8080,
    fs: {
      allow: ['./client', './shared'],
      deny: ['.env', '.env.*', '*.{crt,pem}', '**/.git/**', 'server/**'],
    },
  },
  build: {
    outDir: 'dist/spa',  // ensure this matches your deployment settings
  },
  plugins: [
    react(),
    // Only include expressPlugin in development
    command === 'serve' && expressPlugin(),
  ].filter(Boolean),
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './client'),
      '@shared': path.resolve(__dirname, './shared'),
    },
  },
}));
        
function expressPlugin(): Plugin {
  return {
    name: 'express-plugin',
    apply: 'serve', // only during dev
    configureServer(server) {
      // Lazy import to avoid unresolved path in production
      import('./server/index.js').then(({ createServer }) => {
        const app = createServer();
        server.middlewares.use(app);
        console.log('Express server integrated with Vite dev server on /api');
      }).catch((error) => {
        console.warn('Dev-only server not available:', error.message);
      });
    },
  };
}
