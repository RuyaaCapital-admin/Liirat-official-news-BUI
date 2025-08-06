import { Request, Response } from "express";

// Mock price data for development and fallback
function getMockPriceData(symbol: string, res: Response) {
  const upperSymbol = symbol.toUpperCase();

  // Mock price data for common symbols
  const mockPrices: Record<string, number> = {
    "EURUSD": 1.0856,
    "GBPUSD": 1.2645,
    "USDJPY": 148.23,
    "AAPL": 185.25,
    "GOOGL": 142.30,
    "MSFT": 415.50,
    "TSLA": 248.75,
    "NVDA": 785.45,
    "SPY": 485.20,
    "QQQ": 398.75,
    "BTCUSD": 43250.75,
    "ETHUSD": 2650.50,
  };

  const basePrice = mockPrices[upperSymbol] || 100.00;
  // Add some random variation to simulate price movement
  const variation = (Math.random() - 0.5) * 0.02; // ±1% variation
  const price = basePrice * (1 + variation);

  return res.status(200).json({
    symbol: upperSymbol,
    price: parseFloat(price.toFixed(4)),
    timestamp: Date.now(),
    source: "mock_data",
    note: "This is mock data for development purposes"
  });
}

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

  if (!symbol || typeof symbol !== "string") {
    return res.status(400).json({ error: "Symbol parameter required" });
  }

  // If no API key or using mock key, return mock data
  if (!apiKey || apiKey === "mock_key_for_development") {
    console.log(`Returning mock data for ${symbol} - API key not configured for production`);
    return getMockPriceData(symbol, res);
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
