import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { 
  handleAIChat, 
  handleMarketData, 
  handleNews, 
  handleChartIndicator, 
  handleTechnicalAnalysis 
} from "./routes/ai-trading";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // AI Trading Assistant routes
  app.post("/api/ai-chat", handleAIChat);
  app.get("/api/market-data", handleMarketData);
  app.get("/api/news", handleNews);
  app.post("/api/chart-indicator", handleChartIndicator);
  app.post("/api/technical-analysis", handleTechnicalAnalysis);

  return app;
}
