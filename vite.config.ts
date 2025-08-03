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
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        configure: (proxy, options) => {
          // Start our Express server on port 3001
          import('./server/index.js').then(({ createServer }) => {
            const app = createServer();
            app.listen(3001, () => {
              console.log('Express API server running on port 3001');
            });
          }).catch((error) => {
            console.warn('Could not start API server:', error.message);
          });
        }
      }
    }
  },
  build: {
    outDir: 'dist/spa',  // ensure this matches your deployment settings
  },
  plugins: [
    react(),
    // Express server now runs separately and is proxied
    // command === 'serve' && expressPlugin(),
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

        // Debug middleware
        server.middlewares.use((req, res, next) => {
          if (req.url?.startsWith('/api/')) {
            console.log('API request:', req.method, req.url);
          }
          next();
        });

        server.middlewares.use(app);
        console.log('Express server integrated with Vite dev server');
      }).catch((error) => {
        console.warn('Dev-only server not available:', error.message);
      });
    },
  };
}
