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

      // Add middleware before importing to ensure it's ready
      server.middlewares.use("/api", async (req, res, next) => {
        try {
          console.log("🔍 API Request:", req.method, req.url);

          // Set CORS headers first
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');

          // Handle preflight requests
          if (req.method === 'OPTIONS') {
            res.statusCode = 200;
            res.end();
            return;
          }

          // Dynamically import and create the Express app
          const { createServer } = await import("./server/index.ts");
          const app = createServer();

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
            "/api/eodhd-calendar",
            "/api/eodhd-price",
          ]);

          // Use the Express app to handle the request
          app(req, res, next);
        } catch (error) {
          console.error("❌ Error handling API request:", error);

          // Set CORS headers for error responses too
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Content-Type', 'application/json');

          res.statusCode = 500;
          res.end(JSON.stringify({
            error: "Internal Server Error",
            message: error instanceof Error ? error.message : "Unknown error"
          }));
        }
      });

      console.log("✅ Express API middleware registered");
    },
  };
}
