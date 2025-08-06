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

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // API routes - no /api prefix since Vite mounts at /api
  app.get("/ping", (_req, res) => {
    console.log("Ping endpoint hit!");
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/demo", handleDemo);

  // Chat widget route
  app.post("/chat", handleChat);

  // AI Trading Assistant routes
  app.post("/ai-chat", handleAIChat);
  app.get("/market-data", handleMarketData);
  app.get("/news-trading", handleNews); // Renamed to avoid conflict
  app.post("/chart-indicator", handleChartIndicator);
  app.post("/technical-analysis", handleTechnicalAnalysis);

  // EODHD API routes
  app.get("/economic-events", getEconomicEvents);
  app.get("/news", getNews);

  // Price alert route
  app.get("/price-alert", handlePriceAlert);

  return app;
}
