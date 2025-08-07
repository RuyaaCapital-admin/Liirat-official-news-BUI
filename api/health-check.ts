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
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Simple health check response
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    vercel: {
      region: process.env.VERCEL_REGION || "unknown",
      url: process.env.VERCEL_URL || "unknown",
    },
    api: {
      eodhdKey: process.env.EODHD_API_KEY ? "configured" : "missing",
      fallbackKey: "6891e3b89ee5e1.29062933",
    },
  });
}
