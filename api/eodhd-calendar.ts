/**
 * EODHD Economic Events (Calendar) API Endpoint
 *
 * Fetches real-time and upcoming economic events from EODHD API
 * Supports filtering by country, importance, date range
 *
 * Documentation: https://eodhd.com/financial-apis/economic-events-api/
 *
 * Query Parameters:
 * - country: Filter by country code (US, GB, EUR, etc.)
 * - importance: Filter by importance level (1=low, 2=medium, 3=high)
 * - from: Start date (YYYY-MM-DD)
 * - to: End date (YYYY-MM-DD)
 * - limit: Number of events to return (default: 50)
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";

interface EconomicEvent {
  date: string;
  time: string;
  country: string;
  event: string;
  category: string;
  importance: number;
  actual?: string;
  forecast?: string;
  previous?: string;
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

  const apiKey = process.env.EODHD_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: "EODHD API key not configured",
      events: [],
    });
  }

  try {
    // Extract query parameters
    const { country, importance, from, to, limit = "50" } = req.query;

    // Build EODHD API URL
    const apiUrl = new URL("https://eodhd.com/api/economic-events");
    apiUrl.searchParams.append("api_token", apiKey);
    apiUrl.searchParams.append("fmt", "json");
    apiUrl.searchParams.append("limit", limit as string);

    // Add optional filters
    if (country) {
      apiUrl.searchParams.append("country", country as string);
    }
    if (importance) {
      apiUrl.searchParams.append("importance", importance as string);
    }
    if (from) {
      apiUrl.searchParams.append("from", from as string);
    }
    if (to) {
      apiUrl.searchParams.append("to", to as string);
    }

    console.log(`Fetching EODHD economic events: ${apiUrl.toString()}`);

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
        `EODHD API error: ${response.status} - ${response.statusText}`,
      );
      return res.status(response.status).json({
        error: `EODHD API Error: ${response.status} - ${response.statusText}`,
        events: [],
      });
    }

    // Check if response is JSON
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      console.error(`EODHD API returned non-JSON content: ${contentType}`);
      return res.status(500).json({
        error: "Invalid response format from EODHD API",
        events: [],
      });
    }

    const data = await response.json();

    // Transform EODHD response to our format
    const events: EconomicEvent[] = Array.isArray(data)
      ? data.map((event: any) => ({
          date: event.date || new Date().toISOString().split("T")[0],
          time: event.time || "", // EODHD may not provide 'time' separately
          country: event.country || event.currency || "Unknown",
          event: event.type || event.event || event.title || event.name || "Economic Event", // Use 'type' for event name
          category: event.category || event.type || "Economic",
          importance: parseInt(event.importance) || 1,
          actual: event.actual != null ? String(event.actual) : "-",
          forecast: event.estimate != null ? String(event.estimate) : (event.forecast != null ? String(event.forecast) : "-"),
          previous: event.previous != null ? String(event.previous) : "-",
        }))
      : [];

    res.status(200).json({
      events,
      total: events.length,
      filters: {
        country,
        importance,
        from,
        to,
        limit,
      },
    });
  } catch (error) {
    console.error("Error fetching EODHD economic events:", error);

    // Handle specific error types
    let errorMessage = "Failed to fetch economic events";
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        errorMessage = "Request timeout - EODHD API took too long to respond";
      } else {
        errorMessage = error.message;
      }
    }

    res.status(500).json({
      error: errorMessage,
      events: [],
      timestamp: new Date().toISOString(),
    });
  }
}
