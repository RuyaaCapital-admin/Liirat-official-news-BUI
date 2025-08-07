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

function transformEventData(
  event: any,
  language: string = "en",
): EconomicEvent {
  // Parse date and time from EODHD format
  const eventDate =
    event.date || event.Date || new Date().toISOString().split("T")[0];
  const eventTime = event.time || event.Time || "00:00";

  // Format date consistently
  let formattedDate = eventDate;
  if (!eventDate.includes("T")) {
    formattedDate = `${eventDate}T${eventTime}:00Z`;
  }

  // Handle country code/name
  const country = event.country || event.Country || event.currency || "Unknown";

  // Handle event name
  const eventName =
    event.event ||
    event.Event ||
    event.title ||
    event.Title ||
    event.name ||
    event.Name ||
    event.type ||
    event.Type ||
    "Economic Event";

  // Handle category
  const category =
    event.category ||
    event.Category ||
    event.sector ||
    event.Sector ||
    "Economic";

  // Determine importance based on keywords and event type
  let importance = 2; // Default to medium
  const eventNameLower = eventName.toLowerCase();

  // High importance keywords
  if (
    eventNameLower.includes("gdp") ||
    eventNameLower.includes("inflation") ||
    eventNameLower.includes("interest rate") ||
    eventNameLower.includes("employment") ||
    eventNameLower.includes("unemployment") ||
    eventNameLower.includes("retail sales") ||
    eventNameLower.includes("consumer price") ||
    eventNameLower.includes("producer price") ||
    eventNameLower.includes("federal funds rate") ||
    eventNameLower.includes("nonfarm payrolls") ||
    eventNameLower.includes("cpi") ||
    eventNameLower.includes("ppi")
  ) {
    importance = 3;
  }
  // Low importance keywords
  else if (
    eventNameLower.includes("building permits") ||
    eventNameLower.includes("housing starts") ||
    eventNameLower.includes("factory orders") ||
    eventNameLower.includes("wholesale inventories") ||
    eventNameLower.includes("business inventories")
  ) {
    importance = 1;
  }

  // Override with API importance if provided
  if (event.importance && !isNaN(parseInt(event.importance))) {
    importance = Math.min(Math.max(parseInt(event.importance), 1), 3);
  }

  // Handle actual, forecast, previous values
  const actual =
    event.actual !== null && event.actual !== undefined
      ? String(event.actual)
      : undefined;

  const forecast =
    event.forecast !== null && event.forecast !== undefined
      ? String(event.forecast)
      : event.estimate !== null && event.estimate !== undefined
        ? String(event.estimate)
        : undefined;

  const previous =
    event.previous !== null && event.previous !== undefined
      ? String(event.previous)
      : undefined;

  return {
    date: formattedDate,
    time: eventTime,
    country,
    event: eventName,
    category,
    importance,
    actual,
    forecast,
    previous,
  };
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

  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    // Get API key from Vercel environment variables or use provided key as fallback
    const apiKey = process.env.EODHD_API_KEY || "6891e3b89ee5e1.29062933";

    // Extract query parameters
    const {
      country,
      importance,
      from,
      to,
      limit = "50",
      lang = "en",
    } = req.query;

    // Build OFFICIAL EODHD Economic Calendar API URL
    const apiUrl = new URL("https://eodhd.com/api/economic-events");
    apiUrl.searchParams.append("api_token", apiKey);
    apiUrl.searchParams.append("fmt", "json");

    // Set date range - REQUIRED parameters
    if (from && typeof from === "string") {
      apiUrl.searchParams.append("from", from);
    } else {
      // Default to today
      const today = new Date().toISOString().split("T")[0];
      apiUrl.searchParams.append("from", today);
    }

    if (to && typeof to === "string") {
      apiUrl.searchParams.append("to", to);
    } else {
      // Default to one week from today
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      const toDate = nextWeek.toISOString().split("T")[0];
      apiUrl.searchParams.append("to", toDate);
    }

    // Add optional parameters
    if (country && country !== "all" && typeof country === "string") {
      apiUrl.searchParams.append("country", country);
    }

    console.log(`Fetching EODHD Economic Calendar: ${apiUrl.toString()}`);

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
        `EODHD Calendar API error: ${response.status} - ${response.statusText}`,
      );

      // Log response body for debugging
      let errorDetails = "";
      try {
        const errorBody = await response.text();
        errorDetails = errorBody.substring(0, 500);
        console.error("EODHD API Error response:", errorDetails);
      } catch (e) {
        console.error("Could not read error response body");
      }

      // Return proper error response based on status
      let errorMessage = "Failed to fetch economic calendar";
      let userMessage = "";

      if (response.status === 403) {
        errorMessage = "API key authentication failed";
        userMessage =
          lang === "ar"
            ? "خطأ في مفتاح API. يرجى التحقق من إعدادات الخدمة."
            : "API key authentication failed. Please check service configuration.";
      } else if (response.status === 401) {
        errorMessage = "API key is invalid or expired";
        userMessage =
          lang === "ar"
            ? "مفتاح API غير صالح أو منتهي الصلاحية."
            : "API key is invalid or expired.";
      } else if (response.status === 429) {
        errorMessage = "API rate limit exceeded";
        userMessage =
          lang === "ar"
            ? "تم تجاوز حد الاستخدام. يرجى المحاولة لاحقاً."
            : "API rate limit exceeded. Please try again later.";
      } else if (response.status === 404) {
        errorMessage = "Economic calendar service not found";
        userMessage =
          lang === "ar"
            ? "خدمة التقويم الاقتصادي غير متوفرة."
            : "Economic calendar service not available.";
      } else {
        userMessage =
          lang === "ar"
            ? "خطأ في جلب التقويم الاقتصادي. يرجى المحاولة مرة أخرى."
            : "Error fetching economic calendar. Please try again.";
      }

      return res.status(response.status).json({
        error: errorMessage,
        userMessage,
        details: errorDetails,
        events: [],
        timestamp: new Date().toISOString(),
        canRetry: response.status !== 401 && response.status !== 403,
      });
    }

    // Check if response is JSON
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      console.error(
        `EODHD Calendar API returned non-JSON content: ${contentType}`,
      );
      return res.status(500).json({
        error: "Invalid response format from EODHD Calendar API",
        userMessage:
          lang === "ar"
            ? "تنسيق استجابة غير صالح من خدمة التقويم."
            : "Invalid response format from calendar service.",
        events: [],
        canRetry: true,
      });
    }

    const data = await response.json();
    console.log(
      "EODHD Calendar API response received, items count:",
      Array.isArray(data) ? data.length : "Not an array",
    );

    // Transform EODHD response to our format
    let events: EconomicEvent[] = [];

    if (Array.isArray(data)) {
      events = data
        .filter((event: any) => event && (event.date || event.time))
        .map((event: any) => transformEventData(event, lang as string));
    } else if (data && typeof data === "object") {
      // Handle case where API returns an object instead of array
      if (data.events && Array.isArray(data.events)) {
        events = data.events
          .filter((event: any) => event && (event.date || event.time))
          .map((event: any) => transformEventData(event, lang as string));
      }
    }

    // Filter by importance if specified
    if (importance && importance !== "all" && typeof importance === "string") {
      const requestedLevels = importance
        .split(",")
        .map((i) => parseInt(i.trim()))
        .filter((i) => !isNaN(i) && i >= 1 && i <= 3);

      if (requestedLevels.length > 0) {
        events = events.filter((event) =>
          requestedLevels.includes(event.importance),
        );
      }
    }

    // Apply limit
    const eventLimit = Math.min(parseInt(limit as string) || 50, 200);
    events = events.slice(0, eventLimit);

    console.log(`Returning ${events.length} economic events`);

    const responseData = {
      events,
      total: events.length,
      filters: {
        country: country || "all",
        importance: importance || "all",
        from: from || "today",
        to: to || "+7 days",
        limit: eventLimit,
        lang: lang || "en",
      },
      timestamp: new Date().toISOString(),
      success: true,
    };

    res.json(responseData);
  } catch (error) {
    console.error("Error fetching EODHD economic calendar:", error);

    // Handle specific error types
    let errorMessage = "Failed to fetch economic calendar";
    let userMessage = "";

    if (error instanceof Error) {
      if (error.name === "AbortError") {
        errorMessage = "Request timeout";
        userMessage =
          (req.query.lang as string) === "ar"
            ? "انتهت مهلة الطلب. يرجى المحاولة مرة أخرى."
            : "Request timeout. Please try again.";
      } else if (error.message.includes("fetch")) {
        errorMessage = "Network error";
        userMessage =
          (req.query.lang as string) === "ar"
            ? "خطأ في الشبكة. يرجى التحقق من الاتصال."
            : "Network error. Please check your connection.";
      } else {
        errorMessage = error.message;
        userMessage =
          (req.query.lang as string) === "ar"
            ? "خطأ في الخدمة. يرجى المحاولة لاحقاً."
            : "Service error. Please try again later.";
      }
    }

    res.status(500).json({
      error: errorMessage,
      userMessage,
      events: [],
      timestamp: new Date().toISOString(),
      canRetry: true,
    });
  }
}
