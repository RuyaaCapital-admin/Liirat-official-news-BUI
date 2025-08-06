import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// Corrected Vite config for production deployment
export default defineConfig(({ mode, command }) => ({
  server: {
    host: "::",
    port: 8080,
    fs: {
      allow: ["./client", "./shared"],
      deny: [".env", ".env.*", "*.{crt,pem}", "**/.git/**", "server/**"],
    },
  },
  build: {
    outDir: "dist/spa", // ensure this matches your deployment settings
  },
  plugins: [react(), expressPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
}));

function expressPlugin(): Plugin {
  return {
    name: "express-plugin",
    apply: "serve", // only during dev
    configureServer(server) {
      return () => {
        // This runs after Vite's internal middlewares
        console.log("🔧 Configuring Express plugin...");

        import("./server/index.ts")
          .then(({ createServer }) => {
            console.log("✅ Successfully imported server module");
            const app = createServer();
            console.log("✅ Express app created");

            // Add middleware to handle all requests and pass API requests to Express
            server.middlewares.use((req, res, next) => {
              console.log("🔍 Request:", req.method, req.url);
              if (req.url?.startsWith('/api')) {
                console.log("🚀 API request intercepted:", req.method, req.url);
                return app(req, res, next);
              } else {
                next();
              }
            });

            console.log("✅ Express server integrated with Vite dev server");
          })
          .catch((error) => {
            console.error("❌ Failed to setup Express server:", error);
          });
      };
    },
  };
}
