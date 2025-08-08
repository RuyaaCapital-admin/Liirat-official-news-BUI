import "dotenv/config";
import express from "express";
import cors from "cors";
import {
  handleAIChat,
  handleMarketData,
  handleNews,
  handleChartIndicator,
  handleTechnicalAnalysis,
} from "./routes/ai-trading";
import { handleChat } from "./routes/chat";
import { handlePriceAlert } from "./routes/price-alert";
import { handleAIAnalysis, handleTranslation } from "./routes/ai-analysis";
import {
  handleEODHDSearch,
  handleEODHDPrice,
  handleEODHDCalendar,
  handleEODHDNews,
  handleEODHDPing,
} from "./routes/eodhd-api";
import { handleStatus } from "./routes/status";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // API routes (without /api prefix since middleware handles it)
  app.get("/ping", (_req, res) => {
    console.log("Ping endpoint hit!");
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  // Chat widget route
  app.post("/chat", handleChat);

  // AI Trading Assistant routes
  app.post("/ai-chat", handleAIChat);
  app.get("/market-data", handleMarketData);
  app.get("/news-trading", handleNews); // Renamed to avoid conflict
  app.post("/chart-indicator", handleChartIndicator);
  app.post("/technical-analysis", handleTechnicalAnalysis);


  // Price alert route
  app.get("/price-alert", handlePriceAlert);

  // New EODHD API routes (secure server-side only)
  app.get("/eodhd/search", handleEODHDSearch);
  app.get("/eodhd/price", handleEODHDPrice);
  app.get("/eodhd/calendar", handleEODHDCalendar);
  app.get("/eodhd/news", handleEODHDNews);
  app.get("/eodhd/ping", handleEODHDPing);

  // AI Analysis routes (secure backend only)
  app.post("/ai-analysis", handleAIAnalysis);
  app.post("/translate", handleTranslation);

  // Status endpoint
  app.get("/status", handleStatus);

  return app;
}

const app = createServer();
const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });