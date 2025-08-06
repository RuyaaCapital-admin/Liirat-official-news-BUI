import { Request, Response } from "express";

// Mock price data for development and fallback
function getMockPriceData(symbol: string, res: Response) {
  const upperSymbol = symbol.toUpperCase();

  // Mock price data for common symbols
  const mockPrices: Record<string, number> = {
    EURUSD: 1.0856,
    GBPUSD: 1.2645,
    USDJPY: 148.23,
    AAPL: 185.25,
    GOOGL: 142.3,
    MSFT: 415.5,
    TSLA: 248.75,
    NVDA: 785.45,
    SPY: 485.2,
    QQQ: 398.75,
    BTCUSD: 43250.75,
    ETHUSD: 2650.5,
  };

  const basePrice = mockPrices[upperSymbol] || 100.0;
  // Add some random variation to simulate price movement
  const variation = (Math.random() - 0.5) * 0.02; // ±1% variation
  const price = basePrice * (1 + variation);

  return res.status(200).json({
    symbol: upperSymbol,
    price: parseFloat(price.toFixed(4)),
    timestamp: Date.now(),
    source: "mock_data",
    note: "This is mock data for development purposes",
  });
}

export async function handlePriceAlert(req: Request, res: Response) {
  console.log("Price alert endpoint hit with symbol:", req.query.symbol);

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
  if (!apiKey || apiKey === "mock_key_for_development" || apiKey === "your_polygon_api_key_here") {
    console.log(
      `Returning mock data for ${symbol} - API key not configured for production.`,
      `Set POLYGON_API_KEY environment variable to a valid Polygon.io API key.`
    );
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
      // Handle specific error codes
      if (response.status === 403) {
        console.error(`Polygon API authentication error: ${response.status} - Check API key validity`);
        throw new Error(`Authentication failed: Invalid or expired API key`);
      }
      if (response.status === 429) {
        console.error(`Polygon API rate limit exceeded: ${response.status}`);
        throw new Error(`Rate limit exceeded: Too many requests`);
      }
      throw new Error(`Polygon API error: ${response.status} - ${response.statusText}`);
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
      console.log(
        `Price not found for ${upperSymbol}, falling back to mock data`,
      );
      return getMockPriceData(symbol as string, res);
    }

    return res.status(200).json({
      symbol: upperSymbol,
      price: parseFloat(price),
      timestamp: timestamp || Date.now(),
      source: "polygon.io",
    });
  } catch (error) {
    console.error("Polygon API error:", error);
    console.log(`Falling back to mock data for ${symbol} due to API error`);

    // Fallback to mock data when API fails
    return getMockPriceData(symbol as string, res);
  }
}
