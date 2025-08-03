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

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Example API routes
  app.get("/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/demo", handleDemo);

  // Chat widget route
  app.post("/chat", handleChat);

  // AI Trading Assistant routes
  app.post("/ai-chat", handleAIChat);
  app.get("/market-data", handleMarketData);
  app.get("/news", handleNews);
  app.post("/chart-indicator", handleChartIndicator);
  app.post("/technical-analysis", handleTechnicalAnalysis);

  return app;
}
