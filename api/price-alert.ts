import type { VercelRequest, VercelResponse } from "@vercel/node";

// Real price data fetcher using EODHD API
async function getRealPriceData(symbol: string): Promise<any | null> {
  try {
    const response = await fetch(
      `https://eodhd.com/api/real-time/forex?s=${encodeURIComponent(symbol)}&api_token=6891e3b89ee5e1.29062933&fmt=json`,
    );

    if (!response.ok) {
      throw new Error(`EODHD API returned ${response.status}`);
    }

    const data = await response.json();

    if (Array.isArray(data) && data.length > 0) {
      const item = data[0];
      return {
        symbol: symbol.toUpperCase(),
        price: parseFloat(item.close || item.price || item.last || 0),
        change: parseFloat(item.change || 0),
        changePercent: parseFloat(item.change_p || item.change_percent || 0),
        timestamp: Date.now(),
        source: "eodhd_api",
        realTime: true,
      };
    } else if (data && typeof data === "object" && data.code) {
      return {
        symbol: symbol.toUpperCase(),
        price: parseFloat(data.close || data.price || data.last || 0),
        change: parseFloat(data.change || 0),
        changePercent: parseFloat(data.change_p || data.change_percent || 0),
        timestamp: Date.now(),
        source: "eodhd_api",
        realTime: true,
      };
    }

    return null;
  } catch (error) {
    console.error(`Error fetching real price for ${symbol}:`, error);
    return null;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { symbol } = req.query;

  if (!symbol || typeof symbol !== "string") {
    return res.status(400).json({
      error: "Symbol parameter required",
      realTime: false,
    });
  }

  try {
    const priceData = await getRealPriceData(symbol);

    if (priceData) {
      return res.status(200).json(priceData);
    } else {
      return res.status(404).json({
        error: `No price data found for ${symbol}`,
        symbol: symbol.toUpperCase(),
        realTime: false,
      });
    }
  } catch (error) {
    console.error("Price alert API error:", error);
    return res.status(500).json({
      error: `Failed to fetch real price for ${symbol}`,
      symbol: symbol.toUpperCase(),
      realTime: false,
    });
  }
}
