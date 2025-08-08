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
          res.setHeader("Access-Control-Allow-Origin", "*");
          res.setHeader(
            "Access-Control-Allow-Methods",
            "GET, POST, PUT, DELETE, OPTIONS",
          );
          res.setHeader(
            "Access-Control-Allow-Headers",
            "Content-Type, Authorization, Accept",
          );

          // Handle preflight requests
          if (req.method === "OPTIONS") {
            res.statusCode = 200;
            res.end();
            return;
          }

          // For development, check if route exists in new API first
          if (req.url?.startsWith('/eodhd/')) {
            console.log("🔀 Routing to new consolidated API:", req.url);

            try {
              // Import the new consolidated API directly
              const express = await import("express");
              const serverless = await import("serverless-http");

              const app = express.default();
              app.use(express.default.json());

              // Add CORS
              app.use((req: any, res: any, next: any) => {
                res.setHeader('Access-Control-Allow-Origin', '*');
                res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
                res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
                if (req.method === 'OPTIONS') {
                  res.status(200).end();
                  return;
                }
                next();
              });

              // Copy router logic from api/index.ts
              const BASE = 'https://eodhd.com/api';

              function qs(input: Record<string, any> = {}) {
                const p = new URLSearchParams();
                for (const [k, v] of Object.entries(input)) if (v !== undefined) p.append(k, String(v));
                const token = process.env.EODHD_API_KEY || '';
                if (!token) throw new Error('EODHD_API_KEY not set');
                p.set('api_token', token);
                p.set('fmt', 'json');
                return p.toString();
              }

              async function pass(path: string, q: any) {
                const url = `${BASE}${path}?${qs(q)}`;
                const r = await fetch(url);
                if (!r.ok) throw new Error(`${path} ${r.status}`);
                return r.json();
              }

              // Add ping endpoint
              app.get('/eodhd/ping', async (req: any, res: any) => {
                res.json({ ok: true, ts: Date.now() });
              });

              // Add price endpoint
              app.get('/eodhd/price', async (req: any, res: any) => {
                const s = (req.query.s as string) || (req.query.symbol as string) || (req.query.symbols as string);
                if (!s) return res.status(400).json({ error: 'Missing query param: s (or symbol)' });
                try {
                  const url = `${BASE}/real-time/${encodeURIComponent(s)}?${qs(req.query)}`;
                  const r2 = await fetch(url);
                  if (!r2.ok) throw new Error(`real-time ${r2.status}`);
                  res.json(await r2.json());
                } catch (e: any) { res.status(500).json({ error: e.message }); }
              });

              // Add search endpoint
              app.get('/eodhd/search', async (req: any, res: any) => {
                const q = (req.query.q as string) || (req.query.query as string);
                if (!q) return res.status(400).json({ error: 'Missing query param: q' });
                try {
                  const url = `${BASE}/search/${encodeURIComponent(q)}?${qs(req.query)}`;
                  const r2 = await fetch(url);
                  if (!r2.ok) throw new Error(`search ${r2.status}`);
                  res.json(await r2.json());
                } catch (e: any) { res.status(500).json({ error: e.message }); }
              });

              // Add calendar endpoint
              app.get('/eodhd/calendar', async (req: any, res: any) => {
                try {
                  const raw = await pass('/economic-events', req.query);
                  res.json(raw);
                } catch (e: any) { res.status(500).json({ error: e.message }); }
              });

              // Add news endpoint
              app.get('/eodhd/news', async (req: any, res: any) => {
                const { s, t, from, to, limit, offset } = req.query;

                if (!s && !t) {
                  return res.status(400).json({ ok: false, code: 'MISSING_S_OR_T' });
                }

                try {
                  console.log('Fetching news with params:', req.query);
                  const raw = await pass('/news', req.query);
                  console.log('Raw EODHD response type:', typeof raw, Array.isArray(raw) ? 'array' : 'object');

                  let newsData = raw;
                  if (raw.data) {
                    newsData = raw.data;
                  } else if (Array.isArray(raw)) {
                    newsData = raw;
                  } else if (raw.items) {
                    newsData = raw.items;
                  }

                  if (!Array.isArray(newsData)) {
                    console.error('Unexpected EODHD response format:', raw);
                    return res.status(502).json({ ok: false, error: 'Invalid response format from EODHD' });
                  }

                  const items = newsData.map((n: any) => {
                    let datetimeIso = null;
                    const dateField = n.date || n.datetime || n.published_at || n.time;
                    if (dateField) {
                      try {
                        const date = new Date(dateField);
                        if (!isNaN(date.getTime())) {
                          datetimeIso = date.toISOString();
                        }
                      } catch (e) {
                        console.warn('Failed to parse date:', dateField);
                      }
                    }

                    return {
                      datetimeIso,
                      title: String(n.title || ''),
                      content: String(n.content || n.description || n.title || ''),
                      source: String(n.source || ''),
                      symbols: n.symbols || [],
                      tags: n.tags || n.symbols || [],
                      url: n.link || n.url || '',
                      country: n.country || '',
                      category: n.category || 'financial',
                    };
                  });

                  console.log(`Transformed ${items.length} news items`);
                  res.json({ ok: true, items });
                } catch (e: any) {
                  console.error('News endpoint error:', e);
                  res.status(500).json({ ok: false, error: e.message });
                }
              });

              // Strip /api prefix and handle the request
              req.url = req.url.replace(/^\/api/, "") || "/";
              app(req as any, res as any, next);
              return;
            } catch (error) {
              console.error("❌ Error with new API:", error);
            }
          }

          // Fallback to old server for other routes
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
            "/api/marketaux-news",
            "/api/price-alert",
            "/api/eodhd/search",
            "/api/eodhd/price",
            "/api/eodhd/calendar",
            "/api/eodhd/news",
            "/api/eodhd/ping",
            "/api/ai-analysis",
            "/api/translate",
          ]);

          // Strip /api prefix and handle the request
          req.url = req.url.replace(/^\/api/, "") || "/";
          app(req as any, res as any, next);
        } catch (error) {
          console.error("❌ Error handling API request:", error);

          // Set CORS headers for error responses too
          res.setHeader("Access-Control-Allow-Origin", "*");
          res.setHeader("Content-Type", "application/json");

          res.statusCode = 500;
          res.end(
            JSON.stringify({
              error: "Internal Server Error",
              message: error instanceof Error ? error.message : "Unknown error",
            }),
          );
        }
      });

      console.log("✅ Express API middleware registered");
    },
  };
}
