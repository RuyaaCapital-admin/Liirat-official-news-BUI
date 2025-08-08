import type { VercelRequest, VercelResponse } from "@vercel/node";
import { eodFetch } from "../src/server/eodhdClient.ts";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { pathname } = new URL(req.url || '', `http://${req.headers.host}`);
  
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

  try {
    // Route to different EODHD data endpoints
    if (pathname.includes('/price') || pathname.includes('/market-data')) {
      return await handlePriceData(req, res);
    }
    if (pathname.includes('/price-alert')) {
      return await handlePriceAlert(req, res);
    }
    
    // Default to price data
    return await handlePriceData(req, res);
  } catch (error) {
    console.error("EODHD Data API error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

// Handle price data (from market-data.ts and eodhd/price.ts)
async function handlePriceData(req: VercelRequest, res: VercelResponse) {
  const symbols = (req.query.symbols as string || req.query.symbol as string || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  
  if (!symbols.length) {
    return res.status(400).json({ ok: false, code: "MISSING_SYMBOLS" });
  }

  const base = symbols[0].toUpperCase();
  const response = await eodFetch(`/real-time/${encodeURIComponent(base)}`, {
    s: symbols.slice(1).join(","),
  });
  
  const r = await response.json();

  if (!r.ok) {
    return res.status(502).json(r);
  }

  const arr = Array.isArray(r.data) ? r.data : [r.data];
  const out = arr.map((x: any) => ({
    symbol: x.code || x.symbol,
    price: +(x.close ?? x.price),
    change: +(x.change ?? 0),
    changePct: +(x.change_p ?? x.change_percent ?? 0),
    ts: +(x.timestamp ?? x.ts ?? 0),
  }));

  res.status(200).json({ ok: true, items: out });
}

// Handle price alerts (from price-alert.ts)
async function handlePriceAlert(req: VercelRequest, res: VercelResponse) {
  const symbol = req.query.symbol as string;
  
  if (!symbol) {
    return res.status(400).json({ error: "Symbol is required" });
  }

  const response = await eodFetch(`/real-time/${encodeURIComponent(symbol.toUpperCase())}`);
  const data = await response.json();

  if (!data.ok) {
    return res.status(502).json(data);
  }

  const price = data.data?.close || data.data?.price || 0;
  
  res.status(200).json({
    symbol: symbol.toUpperCase(),
    price: +price,
    timestamp: Date.now()
  });
}
