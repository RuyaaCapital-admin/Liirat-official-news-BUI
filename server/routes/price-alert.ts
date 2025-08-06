import { Request, Response } from "express";

export async function handlePriceAlert(req: Request, res: Response) {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { symbol } = req.query;
  const apiKey = process.env.POLYGON_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: "API key not configured" });
  }

  if (!symbol || typeof symbol !== "string") {
    return res.status(400).json({ error: "Symbol parameter required" });
  }

  try {
    // Determine the market type based on symbol
    let endpoint = "";
    const upperSymbol = symbol.toUpperCase();

    // Check if it's a forex pair
    if (
      upperSymbol.includes("USD") ||
      upperSymbol.includes("EUR") ||
      upperSymbol.includes("GBP") ||
      upperSymbol.includes("JPY") ||
      upperSymbol.includes("CAD") ||
      upperSymbol.includes("AUD") ||
      upperSymbol.includes("CHF") ||
      upperSymbol.includes("NZD")
    ) {
      endpoint = `https://api.polygon.io/v2/snapshot/locale/global/markets/forex/tickers/C:${upperSymbol}`;
    }
    // Check if it's crypto
    else if (
      upperSymbol.includes("BTC") ||
      upperSymbol.includes("ETH") ||
      upperSymbol.includes("LTC") ||
      upperSymbol.includes("XRP") ||
      upperSymbol.includes("ADA") ||
      upperSymbol.includes("DOT")
    ) {
      endpoint = `https://api.polygon.io/v2/snapshot/locale/global/markets/crypto/tickers/X:${upperSymbol}`;
    }
    // Default to stocks
    else {
      endpoint = `https://api.polygon.io/v2/snapshot/locale/us/markets/stocks/tickers/${upperSymbol}`;
    }

    const url = `${endpoint}?apiKey=${apiKey}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Polygon API error: ${response.status}`);
    }

    const data = await response.json();

    // Extract price based on response structure
    let price = null;
    let timestamp = null;

    if (data.results && data.results.length > 0) {
      const ticker = data.results[0];

      // Try different price fields based on market type
      if (ticker.value) {
        price = ticker.value; // Forex
      } else if (ticker.lastTrade) {
        price = ticker.lastTrade.p; // Stocks
        timestamp = ticker.lastTrade.t;
      } else if (ticker.last) {
        price = ticker.last.price; // Crypto
        timestamp = ticker.last.timestamp;
      }
    }

    if (price === null) {
      return res.status(404).json({
        error: "Price not found for symbol",
        symbol: upperSymbol,
      });
    }

    return res.status(200).json({
      symbol: upperSymbol,
      price: parseFloat(price),
      timestamp: timestamp || Date.now(),
      source: "polygon.io",
    });
  } catch (error) {
    console.error("Polygon API error:", error);
    return res.status(500).json({
      error: "Failed to fetch price data",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
