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
      // This runs immediately when configuring server
      console.log("🔧 Configuring Express plugin...");

      import("./server/index.ts")
        .then(({ createServer }) => {
          console.log("✅ Successfully imported server module");
          const app = createServer();
          console.log("✅ Express app created");

          // Add middleware immediately to handle API requests
          server.middlewares.use((req, res, next) => {
            console.log("🔍 Request:", req.method, req.url);
            if (req.url?.startsWith("/api")) {
              console.log("🚀 API request intercepted:", req.method, req.url);
              console.log("🎯 Available routes:", [
                "/api/ping",
                "/api/demo",
                "/api/chat",
                "/api/ai-chat",
                "/api/market-data",
                "/api/news-trading",
                "/api/chart-indicator",
                "/api/technical-analysis",
                "/api/economic-events",
                "/api/news",
                "/api/marketaux-news",
                "/api/price-alert",
              ]);
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
    },
  };
}
