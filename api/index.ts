import type { VercelRequest, VercelResponse } from "@vercel/node";
import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "../server/routes/demo";
import {
  handleAIChat,
  handleMarketData,
  handleNews,
  handleChartIndicator,
  handleTechnicalAnalysis,
} from "../server/routes/ai-trading";
import { handleChat } from "../server/routes/chat";
import { getEconomicEvents, getNews } from "../server/routes/eodhd";
import { handlePriceAlert } from "../server/routes/price-alert";
import { handleMarketauxNews } from "../server/routes/marketaux-news";
import { handleEODHDCalendar } from "../server/routes/eodhd-calendar";
import { handleEODHDPrice } from "../server/routes/eodhd-price";
import eodhd_news from "../server/routes/eodhd-news";
import { handleAIAnalysis, handleTranslation } from "../server/routes/ai-analysis";
import { handleRealtimeNews } from "../server/routes/realtime-news";

// Create Express app for serverless function
const app = express();

// Middleware
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// API routes
app.get("/ping", (_req, res) => {
  console.log("Ping endpoint hit!");
  const ping = process.env.PING_MESSAGE ?? "pong";
  res.json({ 
    message: ping,
    timestamp: new Date().toISOString(),
    environment: "production"
  });
});

app.get("/demo", handleDemo);

// Chat widget route
app.post("/chat", handleChat);

// AI Trading Assistant routes
app.post("/ai-chat", handleAIChat);
app.get("/market-data", handleMarketData);
app.get("/news-trading", handleNews);
app.post("/chart-indicator", handleChartIndicator);
app.post("/technical-analysis", handleTechnicalAnalysis);

// EODHD API routes
app.get("/economic-events", getEconomicEvents);
app.get("/news", getNews);

// Marketaux News API route
app.get("/marketaux-news", handleMarketauxNews);

// Price alert route
app.get("/price-alert", handlePriceAlert);

// EODHD API routes
app.get("/eodhd-calendar", handleEODHDCalendar);
app.get("/eodhd-price", handleEODHDPrice);
app.use("/eodhd-news", eodhd_news);

// AI Analysis routes
app.post("/ai-analysis", handleAIAnalysis);
app.post("/translate", handleTranslation);

// Real-time news route
app.get("/realtime-news", handleRealtimeNews);

// Health check route
app.get("/health", (_req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: "1.0.0"
  });
});

// Default handler for Vercel
export default function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.status(200).end();
    return;
  }

  // Remove /api prefix if it exists
  if (req.url?.startsWith("/api")) {
    req.url = req.url.replace("/api", "") || "/";
  }

  // Pass request to Express app
  app(req as any, res as any);
}
