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
    // Note: EODHD API doesn't support importance filtering directly
    // We'll filter the results after fetching
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
      ? data.map((event: any) => {
          // Create a descriptive event name from type, comparison, and period
          let eventName = event.type || "Economic Event";
          if (event.comparison && event.period) {
            eventName = `${event.type} (${event.comparison.toUpperCase()}) - ${event.period}`;
          } else if (event.period) {
            eventName = `${event.type} - ${event.period}`;
          }

          // Determine importance based on event type and other factors
          let importance = 1; // Default to low
          if (event.importance) {
            importance = parseInt(event.importance);
          } else {
            // High impact events
            const highImpactEvents = [
              'inflation rate', 'gdp', 'unemployment rate', 'interest rate',
              'cpi', 'ppi', 'retail sales', 'nonfarm payrolls', 'fed funds rate'
            ];
            const mediumImpactEvents = [
              'trade balance', 'current account', 'industrial production',
              'manufacturing pmi', 'services pmi', 'consumer confidence'
            ];

            const eventType = (event.type || '').toLowerCase();
            if (highImpactEvents.some(keyword => eventType.includes(keyword))) {
              importance = 3;
            } else if (mediumImpactEvents.some(keyword => eventType.includes(keyword))) {
              importance = 2;
            }
          }

          return {
            date: event.date || new Date().toISOString(),
            time: event.time || undefined,
            country: event.country || event.currency || "Unknown",
            event: eventName,
            category: event.category || event.type || "Economic",
            importance: importance,
            actual: event.actual !== null && event.actual !== undefined ? String(event.actual) : undefined,
            forecast: event.estimate !== null && event.estimate !== undefined ? String(event.estimate) : undefined,
            previous: event.previous !== null && event.previous !== undefined ? String(event.previous) : undefined,
          };
        })
      : [];

    console.log(`✅ Successfully transformed ${events.length} economic events from EODHD`);
    if (events.length > 0) {
      console.log("Sample event:", events[0]);
    }

    res.json({
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
};
