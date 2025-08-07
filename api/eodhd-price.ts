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
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.status(200).end();
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

    // Determine if it's crypto, forex, or regular stock
    const symbolStr = (symbol || symbols) as string;
    const isMultiple = !!symbols;
    const isCrypto =
      symbolStr.includes("-USD") ||
      symbolStr.includes("BTC") ||
      symbolStr.includes("ETH");
    const isForex =
      symbolStr.includes("USD") ||
      symbolStr.includes("EUR") ||
      symbolStr.includes("GBP") ||
      symbolStr.includes("JPY") ||
      symbolStr.includes("CHF") ||
      symbolStr.includes("CAD") ||
      symbolStr.includes("AUD") ||
      symbolStr.includes("XAU");
    const isIndex = symbolStr.includes(".INDX") || symbolStr === "GSPC";

    let apiUrl: URL;

    if (isCrypto) {
      // Crypto API endpoint
      apiUrl = new URL("https://eodhd.com/api/real-time/crypto");
      apiUrl.searchParams.append("s", symbolStr);
    } else if (isForex) {
      // Forex API endpoint - format properly for EODHD
      let forexSymbol = symbolStr;
      if (!forexSymbol.includes(".FOREX")) {
        forexSymbol = forexSymbol + ".FOREX";
      }
      apiUrl = new URL("https://eodhd.com/api/real-time/forex");
      apiUrl.searchParams.append("s", forexSymbol);
    } else if (isIndex) {
      // Index API endpoint
      let indexSymbol = symbolStr;
      if (!indexSymbol.includes(".INDX")) {
        indexSymbol = indexSymbol + ".INDX";
      }
      apiUrl = new URL("https://eodhd.com/api/real-time/stocks");
      apiUrl.searchParams.append("s", indexSymbol);
    } else {
      // Regular stocks/ETFs
      apiUrl = new URL("https://eodhd.com/api/real-time/stocks");
      apiUrl.searchParams.append("s", symbolStr);
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
        console.error("Error response body:", errorBody);
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
    console.log("EODHD API response:", JSON.stringify(data, null, 2));

    // Transform EODHD response to our format
    let prices: PriceData[] = [];

    if (Array.isArray(data)) {
      // Multiple symbols response
      prices = data.map((item: any) => transformPriceData(item));
    } else if (data && typeof data === "object") {
      // Single symbol response
      prices = [transformPriceData(data)];
    }

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

function transformPriceData(item: any): PriceData {
  const symbol = item.code || item.symbol || "Unknown";
  const price = parseFloat(
    item.close || item.price || item.last || item.value || 0,
  );
  const change = parseFloat(item.change || item.change_price || item.diff || 0);
  const change_percent = parseFloat(
    item.change_p || item.change_percent || item.chg_percent || 0,
  );

  return {
    symbol: symbol,
    name: item.name || undefined,
    price: price,
    change: change,
    change_percent: change_percent,
    currency: item.currency || undefined,
    timestamp: item.timestamp || item.gmtoffset || new Date().toISOString(),
    market_status: item.market_status || undefined,
    volume: parseFloat(item.volume || 0) || undefined,
    high: parseFloat(item.high || 0) || undefined,
    low: parseFloat(item.low || 0) || undefined,
    open: parseFloat(item.open || 0) || undefined,
    previous_close:
      parseFloat(item.previous_close || item.previousClose || 0) || undefined,
  };
}
