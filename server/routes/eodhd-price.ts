import { RequestHandler } from "express";

interface PriceData {
  symbol: string;
  name?: string;
  price: number;
  change: number;
  change_percent: number;
  currency?: string;
  timestamp: string;
  market_status?: string;
  volume?: number;
  high?: number;
  low?: number;
  open?: number;
  previous_close?: number;
}

export const handleEODHDPrice: RequestHandler = async (req, res) => {
  const apiKey = process.env.EODHD_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ 
      error: "EODHD API key not configured",
      prices: []
    });
  }

  try {
    const { symbol, symbols, fmt = "json", filter = "live" } = req.query;

    if (!symbol && !symbols) {
      return res.status(400).json({
        error: "Missing required parameter: symbol or symbols",
        prices: [],
      });
    }

    // Determine if it's crypto, forex, or regular stock
    const symbolStr = (symbol || symbols) as string;
    const isMultiple = !!symbols;
    const isCrypto = symbolStr.includes("-USD") || symbolStr.includes("BTC") || symbolStr.includes("ETH");
    const isForex = symbolStr.includes("FOREX:") || symbolStr.includes(".FOREX") || (symbolStr.includes("-") && !isCrypto);
    const isComm = symbolStr.includes(".COMM");
    const isIndex = symbolStr.includes(".INDX");

    let apiUrl: URL;
    
    if (isCrypto) {
      // Crypto API endpoint
      apiUrl = new URL("https://eodhd.com/api/real-time/crypto");
      apiUrl.searchParams.append("s", symbolStr);
    } else if (isForex) {
      // Forex API endpoint  
      apiUrl = new URL("https://eodhd.com/api/real-time/forex");
      apiUrl.searchParams.append("s", symbolStr);
    } else {
      // Regular stocks/ETFs/indices/commodities
      apiUrl = new URL("https://eodhd.com/api/real-time/stocks");
      if (isMultiple) {
        apiUrl.searchParams.append("s", symbolStr);
      } else {
        apiUrl.searchParams.append("s", symbolStr);
      }
    }

    // Add common parameters
    apiUrl.searchParams.append("api_token", apiKey);
    apiUrl.searchParams.append("fmt", fmt as string);
    if (filter && !isCrypto) {
      apiUrl.searchParams.append("filter", filter as string);
    }

    console.log(`Fetching EODHD price data: ${apiUrl.toString()}`);

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch(apiUrl.toString(), {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "User-Agent": "Liirat-News/1.0",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error(`EODHD Price API error: ${response.status} - ${response.statusText}`);
      return res.status(response.status).json({
        error: `EODHD Price API Error: ${response.status} - ${response.statusText}`,
        prices: [],
      });
    }

    // Check if response is JSON
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      console.error(`EODHD Price API returned non-JSON content: ${contentType}`);
      return res.status(500).json({
        error: "Invalid response format from EODHD Price API",
        prices: [],
      });
    }

    const data = await response.json();

    // Transform EODHD response to our format
    let prices: PriceData[] = [];

    if (Array.isArray(data)) {
      // Multiple symbols response
      prices = data.map((item: any) => transformPriceData(item));
    } else if (data && typeof data === "object") {
      // Single symbol response
      prices = [transformPriceData(data)];
    }

    res.json({
      prices,
      total: prices.length,
      symbol: symbolStr,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error("Error fetching EODHD price data:", error);

    // Handle specific error types
    let errorMessage = "Failed to fetch price data";
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        errorMessage = "Request timeout - EODHD API took too long to respond";
      } else {
        errorMessage = error.message;
      }
    }

    res.status(500).json({
      error: errorMessage,
      prices: [],
      timestamp: new Date().toISOString(),
    });
  }
};

function transformPriceData(item: any): PriceData {
  return {
    symbol: item.code || item.symbol || "Unknown",
    name: item.name || undefined,
    price: parseFloat(item.close || item.price || item.last || 0),
    change: parseFloat(item.change || item.change_price || 0),
    change_percent: parseFloat(item.change_p || item.change_percent || 0),
    currency: item.currency || undefined,
    timestamp: item.timestamp || item.gmtoffset || new Date().toISOString(),
    market_status: item.market_status || undefined,
    volume: parseFloat(item.volume || 0) || undefined,
    high: parseFloat(item.high || 0) || undefined,
    low: parseFloat(item.low || 0) || undefined,
    open: parseFloat(item.open || 0) || undefined,
    previous_close: parseFloat(item.previous_close || item.previousClose || 0) || undefined,
  };
}
