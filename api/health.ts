import type { VercelRequest, VercelResponse } from "@vercel/node";

export default function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  // Check environment variables availability
  const envCheck = {
    openai: !!process.env.OPENAI_API_KEY,
    eodhd: !!process.env.EODHD_API_KEY,
    marketaux: !!process.env.MARKETAUX_API_KEY,
    nodeEnv: process.env.NODE_ENV || "development"
  };

  const allGood = Object.values(envCheck).every(check => 
    typeof check === 'boolean' ? check : true
  );

  res.status(allGood ? 200 : 206).json({
    status: allGood ? "healthy" : "partial",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    environment: envCheck,
    endpoints: {
      ping: "/api/ping",
      demo: "/api/demo",
      chat: "/api/chat",
      aiChat: "/api/ai-chat",
      marketData: "/api/market-data",
      health: "/api/health"
    },
    deployment: {
      platform: "vercel",
      region: process.env.VERCEL_REGION || "unknown",
      deployment: process.env.VERCEL_DEPLOYMENT_ID || "local"
    }
  });
}
