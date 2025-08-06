import { VercelRequest, VercelResponse } from "@vercel/node";

// Global limiter (per instance)
let lastCallTimestamp = 0;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET")
    return res.status(405).json({ error: "Method not allowed" });

  const { symbol } = req.query;
  const apiKey = process.env.POLYGON_API_KEY;

  if (!apiKey) return res.status(500).json({ error: "API key not configured" });
  if (!symbol || typeof symbol !== "string")
    return res.status(400).json({ error: "Symbol parameter required" });

  // Rate limiter logic (15 sec)
  const now = Date.now();
  const SIXTY_SECONDS = 60 * 1000;
  if (now - lastCallTimestamp < SIXTY_SECONDS) {
    return res.status(429).json({
      error: "Too many requests – wait at least 60 seconds between calls",
      nextAllowed: new Date(lastCallTimestamp + SIXTY_SECONDS).toISOString(),
    });
  }
  lastCallTimestamp = now;

  try {
    const upperSymbol = symbol.toUpperCase();
    let endpoint = "";

    if (
      ["USD", "EUR", "GBP", "JPY", "CAD", "AUD", "CHF", "NZD"].some((cur) =>
        upperSymbol.includes(cur),
      )
    ) {
      endpoint = `https://api.polygon.io/v2/snapshot/locale/global/markets/forex/tickers/C:${upperSymbol}`;
    } else if (
      ["BTC", "ETH", "LTC", "XRP", "ADA", "DOT"].some((coin) =>
        upperSymbol.includes(coin),
      )
    ) {
      endpoint = `https://api.polygon.io/v2/snapshot/locale/global/markets/crypto/tickers/X:${upperSymbol}`;
    } else {
      endpoint = `https://api.polygon.io/v2/snapshot/locale/us/markets/stocks/tickers/${upperSymbol}`;
    }

    const url = `${endpoint}?apiKey=${apiKey}`;
    const response = await fetch(url);
    const raw = await response.text();

    let data: any = {};
    try {
      data = JSON.parse(raw);
    } catch (e) {
      return res.status(502).json({ error: "Invalid JSON from Polygon", raw });
    }

    if (!response.ok) {
      return res.status(response.status).json({
        error: "Polygon API error",
        status: response.status,
        message: data.message || raw,
      });
    }

    let price = null;
    let timestamp = null;

    if (data.results && data.results.length > 0) {
      const ticker = data.results[0];
      if (ticker.value) price = ticker.value;
      else if (ticker.lastTrade) {
        price = ticker.lastTrade.p;
        timestamp = ticker.lastTrade.t;
      } else if (ticker.last) {
        price = ticker.last.price;
        timestamp = ticker.last.timestamp;
      }
    }

    if (price === null) {
      return res
        .status(404)
        .json({
          error: "Price not found for symbol",
          symbol: upperSymbol,
          raw: data,
        });
    }

    return res.status(200).json({
      symbol: upperSymbol,
      price: parseFloat(price),
      timestamp: timestamp || Date.now(),
      source: "polygon.io",
    });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to fetch price data",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
