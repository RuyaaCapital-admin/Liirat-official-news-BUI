import { RequestHandler } from "express";
import {
  apiOptimizer,
  generateCacheKey,
  getClientId,
} from "../utils/rate-limiter";

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
  // Use the provided EODHD API key
  const apiKey = "6891e3b89ee5e1.29062933";

  try {
    const { symbol, symbols, fmt = "json", filter = "live" } = req.query;

    if (!symbol && !symbols) {
      return res.status(400).json({
        error: "Missing required parameter: symbol or symbols",
        prices: [],
      });
    }

    // Get client ID for rate limiting
    const clientId = getClientId(req);

    // Check rate limit
    if (!apiOptimizer.checkRateLimit(clientId, "prices")) {
      return res.status(429).json({
        error: "Rate limit exceeded. Please try again later.",
        prices: [],
        retryAfter: 60,
      });
    }

    // Generate cache key
    const symbolStr = (symbol || symbols) as string;
    const cacheKey = generateCacheKey("price", {
      symbol: symbolStr,
      fmt,
      filter,
    });

    // Check cache first
    const cachedData = apiOptimizer.getCached(cacheKey, "prices");
    if (cachedData) {
      return res.json(cachedData);
    }

    // Determine symbol type and format correctly for EODHD
    const isCrypto =
      symbolStr.includes("-USD") ||
      symbolStr.includes("BTC") ||
      symbolStr.includes("ETH");
    const isIndex = symbolStr === "GSPC" || symbolStr.includes(".INDX");

    let apiUrl: URL;
    let finalSymbol = symbolStr;

    if (isCrypto) {
      // Crypto API endpoint
      apiUrl = new URL("https://eodhd.com/api/real-time/crypto");
      // For crypto, EODHD expects symbols like BTC-USD, ETH-USD
      finalSymbol = symbolStr;
    } else if (isIndex) {
      // Index API endpoint - use stocks endpoint for indices
      apiUrl = new URL("https://eodhd.com/api/real-time/stocks");
      finalSymbol = symbolStr.includes(".INDX")
        ? symbolStr
        : symbolStr + ".INDX";
    } else {
      // Forex API endpoint - default for currency pairs
      apiUrl = new URL("https://eodhd.com/api/real-time/forex");
      // For forex, EODHD expects symbols like EURUSD.FOREX
      finalSymbol = symbolStr.includes(".FOREX")
        ? symbolStr
        : symbolStr + ".FOREX";
    }

    // Add API parameters
    apiUrl.searchParams.append("s", finalSymbol);
    apiUrl.searchParams.append("api_token", apiKey);
    apiUrl.searchParams.append("fmt", fmt as string);

    console.log(`Fetching EODHD price data: ${apiUrl.toString()}`);

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

    const response = await fetch(apiUrl.toString(), {
      method: "GET",
      headers: {
        Accept: "application/json",
        "User-Agent": "Liirat-News/1.0",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error(
        `EODHD Price API error: ${response.status} - ${response.statusText}`,
      );

      // Log response body for debugging
      try {
        const errorBody = await response.text();
        console.error("Error response body:", errorBody.substring(0, 500));
      } catch (e) {
        console.error("Could not read error response body");
      }

      return res.status(200).json({
        error: `EODHD Price API Error: ${response.status} - ${response.statusText}`,
        prices: [],
        symbol: symbolStr,
      });
    }

    // Check if response is JSON
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      console.error(
        `EODHD Price API returned non-JSON content: ${contentType}`,
      );
      return res.status(500).json({
        error: "Invalid response format from EODHD Price API",
        prices: [],
      });
    }

    const data = await response.json();
    console.log("Raw EODHD API response:", JSON.stringify(data, null, 2));

    // Transform EODHD response to our format
    let prices: PriceData[] = [];

    if (Array.isArray(data)) {
      // Multiple symbols response or single symbol in array
      prices = data
        .filter((item: any) => item && item.code && item.close !== "NA")
        .map((item: any) => transformPriceData(item, symbolStr));
    } else if (data && typeof data === "object" && data.code) {
      // Single symbol response
      if (data.close !== "NA") {
        prices = [transformPriceData(data, symbolStr)];
      }
    }

    // Filter out invalid prices
    prices = prices.filter((p) => p.price > 0);

    console.log("Transformed prices:", JSON.stringify(prices, null, 2));

    const responseData = {
      prices,
      total: prices.length,
      symbol: symbolStr,
      timestamp: new Date().toISOString(),
    };

    // Cache the successful response
    apiOptimizer.setCache(cacheKey, responseData, "prices");

    res.json(responseData);
  } catch (error) {
    console.error("Error fetching EODHD price data:", error);

    // Handle specific error types with basic localization (no lang param available)
    let errorMessage = "Failed to fetch price data";
    let errorMessageAr = "فشل في جلب بيانات الأسعار";

    if (error instanceof Error) {
      if (error.name === "AbortError") {
        errorMessage = "Request timeout - EODHD API took too long to respond";
        errorMessageAr = "انتهت مهلة الطلب - استغرق EODHD API وقتاً طويلاً للاستجابة";
      } else {
        errorMessage = error.message;
        errorMessageAr = `خطأ: ${error.message}`;
      }
    }

    res.status(200).json({
      prices: [],
      total: 0,
      error: errorMessage,
      errorAr: errorMessageAr, // Include Arabic error message
      timestamp: new Date().toISOString(),
    });
  }
};

function transformPriceData(item: any, originalSymbol: string): PriceData {
  // Parse values from EODHD response
  // For gold (XAUUSD), use previousClose when close is "NA"
  let price = parseFloat(item.close || item.price || item.last || item.value || 0);
  const previousClose = parseFloat(item.previousClose || item.previous_close || 0);

  // Special handling for gold when close is NA but previousClose exists
  if ((price === 0 || isNaN(price) || item.close === "NA") && previousClose > 0) {
    price = previousClose;
    console.log(`Using previousClose for ${item.code}: ${price}`);
  }

  const change = parseFloat(item.change || 0) || (price && previousClose ? price - previousClose : 0);
  const change_percent =
    parseFloat(item.change_p || item.change_percent || 0) ||
    (previousClose > 0 && change !== 0 ? (change / previousClose) * 100 : 0);

  console.log(
    `Transforming data for ${item.code}: price=${price}, change=${change}, change_p=${change_percent}, previousClose=${previousClose}`,
  );

  return {
    symbol: originalSymbol, // Use the original symbol requested
    name: item.name || undefined,
    price: price,
    change: change,
    change_percent: change_percent,
    currency: item.currency || undefined,
    timestamp: item.timestamp
      ? new Date(item.timestamp * 1000).toISOString()
      : new Date().toISOString(),
    market_status: item.market_status || undefined,
    volume: parseFloat(item.volume || 0) || undefined,
    high: parseFloat(item.high || 0) || undefined,
    low: parseFloat(item.low || 0) || undefined,
    open: parseFloat(item.open || 0) || undefined,
    previous_close: previousClose || undefined,
  };
}
