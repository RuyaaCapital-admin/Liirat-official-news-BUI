import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import {
  handleAIChat,
  handleMarketData,
  handleNews,
  handleChartIndicator,
  handleTechnicalAnalysis,
} from "./routes/ai-trading";
import { handleChat } from "./routes/chat";
import { getEconomicEvents, getNews } from "./routes/eodhd";
import { handlePriceAlert } from "./routes/price-alert";
import { handleMarketauxNews } from "./routes/marketaux-news";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // API routes with consistent /api prefix
  app.get("/api/ping", (_req, res) => {
    console.log("Ping endpoint hit!");
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // Chat widget route
  app.post("/api/chat", handleChat);

  // AI Trading Assistant routes
  app.post("/api/ai-chat", handleAIChat);
  app.get("/api/market-data", handleMarketData);
  app.get("/api/news-trading", handleNews); // Renamed to avoid conflict
  app.post("/api/chart-indicator", handleChartIndicator);
  app.post("/api/technical-analysis", handleTechnicalAnalysis);

  // EODHD API routes
  app.get("/api/economic-events", getEconomicEvents);
  app.get("/api/news", getNews);

  // Marketaux News API route
  app.get("/api/marketaux-news", handleMarketauxNews);

  // Price alert route
  app.get("/api/price-alert", handlePriceAlert);

  return app;
}
