import { Request, Response } from "express";

// Real price data fetcher using EODHD API
async function getRealPriceData(symbol: string, res: Response) {
  try {
    const response = await fetch(`http://localhost:8080/api/eodhd-price?symbol=${encodeURIComponent(symbol)}`);
    
    if (!response.ok) {
      throw new Error(`Price API returned ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.prices && data.prices.length > 0) {
      const price = data.prices[0];
      res.json({
        symbol: symbol.toUpperCase(),
        price: price.price,
        change: price.change,
        changePercent: price.change_percent,
        timestamp: Date.now(),
        source: "eodhd_api",
        realTime: true
      });
    } else {
      res.status(404).json({
        error: `No price data found for ${symbol}`,
        symbol: symbol.toUpperCase(),
        realTime: false
      });
    }
  } catch (error) {
    console.error(`Error fetching real price for ${symbol}:`, error);
    res.status(500).json({
      error: `Failed to fetch real price for ${symbol}`,
      symbol: symbol.toUpperCase(),
      realTime: false
    });
  }
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

  // Always use EODHD API for real data - no mock data ever
  if (
    !apiKey ||
    apiKey === "mock_key_for_development" ||
    apiKey === "your_polygon_api_key_here"
  ) {
    console.log(
      `No Polygon API key configured, using EODHD API for real price data: ${symbol}`,
    );
    return getRealPriceData(symbol, res);
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
        console.error(
          `Polygon API authentication error: ${response.status} - Check API key validity`,
        );
        throw new Error(`Authentication failed: Invalid or expired API key`);
      }
      if (response.status === 429) {
        console.error(`Polygon API rate limit exceeded: ${response.status}`);
        throw new Error(`Rate limit exceeded: Too many requests`);
      }
      throw new Error(
        `Polygon API error: ${response.status} - ${response.statusText}`,
      );
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
        `Price not found for ${upperSymbol} in Polygon, trying EODHD API`,
      );
      return getRealPriceData(symbol as string, res);
    }

    return res.status(200).json({
      symbol: upperSymbol,
      price: parseFloat(price),
      timestamp: timestamp || Date.now(),
      source: "polygon.io",
      realTime: true
    });
  } catch (error) {
    console.error("Polygon API error:", error);
    console.log(`Falling back to EODHD API for ${symbol} due to Polygon API error`);

    // Fallback to EODHD API when Polygon fails - NEVER mock data
    return getRealPriceData(symbol as string, res);
  }
}
