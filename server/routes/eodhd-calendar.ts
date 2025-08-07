import { RequestHandler } from "express";

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

export const handleEODHDCalendar: RequestHandler = async (req, res) => {
  // Use the provided EODHD API key
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
    if (importance && importance !== "all") {
      const importanceStr = importance as string;
      const importanceLevels = importanceStr
        .split(",")
        .map((i) => parseInt(i.trim()))
        .filter((i) => !isNaN(i));
      if (importanceLevels.length > 0) {
        // For now, use the highest importance level as EODHD API may not support multiple
        const maxImportance = Math.max(...importanceLevels);
        // Note: EODHD may not have importance filtering, we'll filter on our side
      }
    }

    // Add date range filters
    if (from) {
      apiUrl.searchParams.append("from", from as string);
    } else {
      // Default to start of current week to get current events
      const today = new Date();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay()); // Start of current week (Sunday)
      const fromDate = startOfWeek.toISOString().split("T")[0];
      apiUrl.searchParams.append("from", fromDate);
      console.log(`Default from date: ${fromDate}`);
    }

    if (to) {
      apiUrl.searchParams.append("to", to as string);
    } else {
      // Default to end of next week to get upcoming events
      const today = new Date();
      const endOfNextWeek = new Date(today);
      endOfNextWeek.setDate(today.getDate() - today.getDay() + 13); // End of next week (Saturday)
      const toDate = endOfNextWeek.toISOString().split("T")[0];
      apiUrl.searchParams.append("to", toDate);
      console.log(`Default to date: ${toDate}`);
    }

    console.log(`Fetching EODHD economic events: ${apiUrl.toString()}`);

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 second timeout

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
        `EODHD Calendar API error: ${response.status} - ${response.statusText}`,
      );

      // Log response body for debugging
      try {
        const errorBody = await response.text();
        console.error("Error response body:", errorBody.substring(0, 500));
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
      console.error(
        `EODHD Calendar API returned non-JSON content: ${contentType}`,
      );
      const textResponse = await response.text();
      console.error("Non-JSON response:", textResponse.substring(0, 500));
      return res.status(500).json({
        error: "Invalid response format from EODHD Calendar API",
        events: [],
      });
    }

    const data = await response.json();
    console.log(
      "Raw EODHD Calendar response (first 3 items):",
      JSON.stringify(data.slice ? data.slice(0, 3) : data, null, 2),
    );

    // Transform EODHD response to our format
    const events: EconomicEvent[] = Array.isArray(data)
      ? data.map((event: any) => transformEventData(event))
      : [];

    // Remove duplicates based on date, country, and event name
    const uniqueEvents: EconomicEvent[] = [];
    const seen = new Set<string>();

    for (const event of events) {
      const key = `${event.date}_${event.country}_${event.event}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueEvents.push(event);
      }
    }

    console.log(`Removed ${events.length - uniqueEvents.length} duplicate events`);

    // Filter events by importance on our side if multiple levels were requested
    let filteredEvents = uniqueEvents;
    if (importance && importance !== "all") {
      const importanceStr = importance as string;
      const requestedLevels = importanceStr
        .split(",")
        .map((i) => parseInt(i.trim()))
        .filter((i) => !isNaN(i));
      if (requestedLevels.length > 0) {
        filteredEvents = events.filter((event) =>
          requestedLevels.includes(event.importance),
        );
      }
    }

    console.log(
      `Returning ${filteredEvents.length} filtered events out of ${events.length} total events`,
    );

    res.json({
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
};

function transformEventData(event: any): EconomicEvent {
  // Parse date and time from EODHD format
  const rawDate = event.date || new Date().toISOString();
  let formattedDate = rawDate;
  let timeOnly = "00:00";

  // EODHD returns dates like "2025-09-05 23:00:00"
  if (rawDate.includes(" ")) {
    const [datePart, timePart] = rawDate.split(" ");
    formattedDate = `${datePart}T${timePart}Z`; // Convert to ISO format
    timeOnly = timePart.substring(0, 5); // Extract HH:MM
  } else if (rawDate.includes("T")) {
    // Already in ISO format
    formattedDate = rawDate;
    timeOnly = rawDate.split("T")[1]?.substring(0, 5) || "00:00";
  } else {
    // Date only, add default time
    formattedDate = `${rawDate}T00:00:00Z`;
    timeOnly = "00:00";
  }

  // Handle country code
  const country = event.country || event.Country || "Unknown";

  // Handle event name
  const eventName =
    event.type ||
    event.event ||
    event.Event ||
    event.title ||
    event.Title ||
    event.name ||
    event.Name ||
    "Economic Event";

  // Handle category
  const category =
    event.category || event.Category || event.type || event.Type || "Economic";

  // Calculate importance based on the event type (since EODHD may not provide importance directly)
  let importance = 2; // Default to medium
  const eventTypeLower = eventName.toLowerCase();

  // High importance events
  if (
    eventTypeLower.includes("inflation") ||
    eventTypeLower.includes("interest rate") ||
    eventTypeLower.includes("employment") ||
    eventTypeLower.includes("gdp") ||
    eventTypeLower.includes("retail sales") ||
    eventTypeLower.includes("consumer price") ||
    eventTypeLower.includes("producer price") ||
    eventTypeLower.includes("unemployment")
  ) {
    importance = 3;
  }
  // Low importance events
  else if (
    eventTypeLower.includes("building permits") ||
    eventTypeLower.includes("housing starts") ||
    eventTypeLower.includes("factory orders")
  ) {
    importance = 1;
  }

  // Handle actual, forecast, previous values
  const actual =
    event.actual !== null && event.actual !== undefined
      ? String(event.actual)
      : undefined;
  const forecast =
    event.estimate !== null && event.estimate !== undefined
      ? String(event.estimate)
      : event.forecast !== null && event.forecast !== undefined
        ? String(event.forecast)
        : undefined;
  const previous =
    event.previous !== null && event.previous !== undefined
      ? String(event.previous)
      : undefined;

  console.log(
    `Transforming event: ${eventName} on ${formattedDate} for ${country}`,
  );

  return {
    date: formattedDate,
    time: timeOnly,
    country: country,
    event: eventName,
    category: category,
    importance: Math.min(Math.max(importance, 1), 3), // Ensure importance is between 1-3
    actual: actual,
    forecast: forecast,
    previous: previous,
  };
}
