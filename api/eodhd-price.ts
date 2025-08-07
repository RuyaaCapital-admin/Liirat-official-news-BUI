/**
 * EODHD Real-time Price API Endpoint
 *
 * Fetches real-time and historical price data from EODHD API
 * Supports stocks, forex, crypto, commodities, and indices
 *
 * Documentation:
 * - Real-time: https://eodhd.com/financial-apis/live-realtime-stocks-api/
 * - Crypto: https://eodhd.com/financial-apis/cryptocurrency-api/
 *
 * Query Parameters:
 * - symbol: Required symbol (e.g., AAPL.US, BTC-USD, EUR-USD)
 * - symbols: Multiple symbols comma-separated (alternative to symbol)
 * - fmt: Format (json/csv, default: json)
 * - filter: live/close/extended (default: live)
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set comprehensive CORS headers for production
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS",
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, Accept, X-Requested-With",
  );
  res.setHeader("Access-Control-Max-Age", "86400"); // 24 hours
  res.setHeader("Cache-Control", "public, max-age=30"); // Cache for 30 seconds

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  // Only allow GET requests
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed", prices: [] });
    return;
  }

  // Use hardcoded API key as specified by user
  const apiKey = "6891e3b89ee5e1.29062933";

  try {
    const { symbol, symbols, fmt = "json", filter = "live" } = req.query;

    if (!symbol && !symbols) {
      return res.status(400).json({
        error: "Missing required parameter: symbol or symbols",
        prices: [],
      });
    }

    // Determine symbol type and format correctly for EODHD
    const symbolStr = (symbol || symbols) as string;
    const isCrypto =
      symbolStr.includes("-USD.CC") ||
      symbolStr.includes("BTC") ||
      symbolStr.includes("ETH");
    const isMetal = symbolStr.includes("GC.COMEX") || symbolStr.includes("SI.COMEX");
    const isIndex = symbolStr === "GSPC" || symbolStr.includes(".INDX");

    // Use the official real-time API endpoint format
    const apiUrl = new URL(`https://eodhd.com/api/real-time/${symbolStr}`);
    apiUrl.searchParams.append("api_token", apiKey);
    apiUrl.searchParams.append("fmt", fmt as string);

    console.log(
      `[PRICE API] Fetching EODHD data for ${symbolStr}: ${apiUrl.toString()}`,
    );

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

    const response = await fetch(apiUrl.toString(), {
      method: "GET",
      headers: {
        Accept: "application/json",
        "User-Agent": "Liirat-News/1.0",
        "Cache-Control": "no-cache",
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

      return res.status(response.status).json({
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

    res.status(200).json({
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
      prices: [],
      total: 0,
      error: errorMessage,
      timestamp: new Date().toISOString(),
    });
  }
}

function transformPriceData(item: any, originalSymbol: string): PriceData {
  // Parse values from EODHD response
  const price = parseFloat(
    item.close || item.price || item.last || item.value || 0,
  );
  const previousClose = parseFloat(
    item.previousClose || item.previous_close || item.close || 0,
  );
  const change = parseFloat(item.change || 0) || price - previousClose;
  const change_percent =
    parseFloat(item.change_p || item.change_percent || 0) ||
    (previousClose > 0 ? (change / previousClose) * 100 : 0);

  console.log(
    `Transforming data for ${item.code}: price=${price}, change=${change}, change_p=${change_percent}`,
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
