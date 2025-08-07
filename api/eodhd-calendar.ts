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

  // Use the user's specified API key
  const apiKey = "6891e3b89ee5e1.29062933";

  try {
    // Extract query parameters
    const { country, importance, from, to, limit = "50" } = req.query;

    // Build EODHD API URL
    const apiUrl = new URL("https://eodhd.com/api/economic-events");
    apiUrl.searchParams.append("api_token", apiKey);
    apiUrl.searchParams.append("fmt", "json");

    // Set reasonable limit
    const eventLimit = Math.min(parseInt(limit as string) || 50, 100);
    apiUrl.searchParams.append("limit", eventLimit.toString());

    // Add optional filters
    if (country && country !== "all") {
      apiUrl.searchParams.append("country", country as string);
    }
    
    // Handle importance filter - can be comma-separated values
    if (importance) {
      const importanceStr = importance as string;
      if (importanceStr !== "all") {
        // If it's comma-separated, convert to single value for EODHD API
        const importanceLevels = importanceStr.split(",").map(i => parseInt(i.trim())).filter(i => !isNaN(i));
        if (importanceLevels.length > 0) {
          // EODHD API typically accepts single importance level, so we'll use the highest
          const maxImportance = Math.max(...importanceLevels);
          apiUrl.searchParams.append("importance", maxImportance.toString());
        }
      }
    }
    
    // Add date range filters
    if (from) {
      apiUrl.searchParams.append("from", from as string);
    } else {
      // Default to today if no start date provided
      const today = new Date().toISOString().split("T")[0];
      apiUrl.searchParams.append("from", today);
    }
    
    if (to) {
      apiUrl.searchParams.append("to", to as string);
    } else {
      // Default to 7 days from now if no end date provided
      const weekFromNow = new Date();
      weekFromNow.setDate(weekFromNow.getDate() + 7);
      apiUrl.searchParams.append("to", weekFromNow.toISOString().split("T")[0]);
    }

    console.log(`Fetching EODHD economic events: ${apiUrl.toString()}`);

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
      console.error(`EODHD Calendar API error: ${response.status} - ${response.statusText}`);
      
      // Log response body for debugging
      try {
        const errorBody = await response.text();
        console.error("Error response body:", errorBody);
      } catch (e) {
        console.error("Could not read error response body");
      }

      return res.status(response.status).json({
        error: `EODHD Calendar API Error: ${response.status} - ${response.statusText}`,
        events: [],
        timestamp: new Date().toISOString(),
      });
    }

    // Check if response is JSON
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      console.error(`EODHD Calendar API returned non-JSON content: ${contentType}`);
      const textResponse = await response.text();
      console.error("Non-JSON response:", textResponse);
      return res.status(500).json({
        error: "Invalid response format from EODHD Calendar API",
        events: [],
      });
    }

    const data = await response.json();
    console.log("EODHD Calendar API response sample:", JSON.stringify(data.slice ? data.slice(0, 2) : data, null, 2));

    // Transform EODHD response to our format
    const events: EconomicEvent[] = Array.isArray(data)
      ? data.map((event: any) => transformEventData(event))
      : [];

    // Filter events by importance on our side if multiple levels were requested
    let filteredEvents = events;
    if (importance && importance !== "all") {
      const importanceStr = importance as string;
      const requestedLevels = importanceStr.split(",").map(i => parseInt(i.trim())).filter(i => !isNaN(i));
      if (requestedLevels.length > 1) {
        // Filter to only include events with requested importance levels
        filteredEvents = events.filter(event => requestedLevels.includes(event.importance));
      }
    }

    res.status(200).json({
      events: filteredEvents,
      total: filteredEvents.length,
      filters: {
        country,
        importance,
        from,
        to,
        limit: eventLimit,
      },
      timestamp: new Date().toISOString(),
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

function transformEventData(event: any): EconomicEvent {
  // Handle different possible field names from EODHD API
  const date = event.date || event.Date || new Date().toISOString().split("T")[0];
  const time = event.time || event.Time || "";
  const country = event.country || event.Country || event.currency || event.Currency || "Unknown";
  const eventName = event.event || event.Event || event.title || event.Title || event.name || event.Name || "Economic Event";
  const category = event.category || event.Category || event.type || event.Type || "Economic";
  const importance = parseInt(event.importance || event.Importance || "1") || 1;
  
  // Handle actual, forecast, previous values - convert to strings and handle null/undefined
  const actual = event.actual !== null && event.actual !== undefined ? String(event.actual) : 
                 event.Actual !== null && event.Actual !== undefined ? String(event.Actual) : undefined;
  
  const forecast = event.forecast !== null && event.forecast !== undefined ? String(event.forecast) :
                  event.Forecast !== null && event.Forecast !== undefined ? String(event.Forecast) :
                  event.estimate !== null && event.estimate !== undefined ? String(event.estimate) :
                  event.Estimate !== null && event.Estimate !== undefined ? String(event.Estimate) : undefined;
  
  const previous = event.previous !== null && event.previous !== undefined ? String(event.previous) :
                  event.Previous !== null && event.Previous !== undefined ? String(event.Previous) : undefined;

  // Create properly formatted datetime string
  let fullDateTime = date;
  if (time) {
    // If time is provided, combine with date
    if (date.includes("T")) {
      // Date already includes time
      fullDateTime = date;
    } else {
      // Add time to date
      fullDateTime = `${date}T${time}`;
    }
  } else {
    // No time provided, assume 00:00 UTC
    if (!date.includes("T")) {
      fullDateTime = `${date}T00:00:00Z`;
    }
  }

  return {
    date: fullDateTime,
    time: time || "00:00",
    country: country,
    event: eventName,
    category: category,
    importance: Math.min(Math.max(importance, 1), 3), // Ensure importance is between 1-3
    actual: actual,
    forecast: forecast,
    previous: previous,
  };
}
