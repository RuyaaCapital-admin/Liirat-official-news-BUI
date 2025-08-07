import { RequestHandler } from "express";
import {
  apiOptimizer,
  generateCacheKey,
  getClientId,
} from "../utils/rate-limiter";

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
  // Get API key from environment or use provided key as fallback
  const apiKey = process.env.EODHD_API_KEY || "6891e3b89ee5e1.29062933";

  try {
    // Extract query parameters
    const {
      country,
      importance,
      from,
      to,
      limit = "50",
      lang = "en",
    } = req.query;

    // Get client ID for rate limiting
    const clientId = getClientId(req);

    // Check rate limit
    if (!apiOptimizer.checkRateLimit(clientId, "calendar")) {
      return res.status(429).json({
        error: "Rate limit exceeded. Please try again later.",
        events: [],
        retryAfter: 60,
      });
    }

    // Generate cache key
    const cacheKey = generateCacheKey("calendar", {
      country,
      importance,
      from,
      to,
      limit,
      lang,
    });

    // Check cache first
    const cachedData = apiOptimizer.getCached(cacheKey, "calendar");
    if (cachedData) {
      return res.json(cachedData);
    }

    // Build OFFICIAL EODHD Economic Calendar API URL
    const apiUrl = new URL("https://eodhd.com/api/economic-events");
    apiUrl.searchParams.append("api_token", apiKey);
    apiUrl.searchParams.append("fmt", "json");

    // Set date range - REQUIRED parameters
    if (from) {
      apiUrl.searchParams.append("from", from as string);
    } else {
      // Default to today
      const today = new Date().toISOString().split("T")[0];
      apiUrl.searchParams.append("from", today);
    }

    if (to) {
      apiUrl.searchParams.append("to", to as string);
    } else {
      // Default to one week from today
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      const toDate = nextWeek.toISOString().split("T")[0];
      apiUrl.searchParams.append("to", toDate);
    }

    // Add optional parameters if supported
    if (country && country !== "all") {
      apiUrl.searchParams.append("country", country as string);
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

      // Return proper error response based on status with localization
      const isArabic = lang === "ar";
      let errorMessage = isArabic
        ? "فشل في جلب التقويم الاقتصادي"
        : "Failed to fetch economic calendar";

      if (response.status === 403) {
        errorMessage = isArabic
          ? "فشل في التحقق من مفتاح API. يرجى التحقق من إعدادات مفتاح API."
          : "API key authentication failed. Please check API key configuration.";
      } else if (response.status === 401) {
        errorMessage = isArabic
          ? "مفتاح API غير صحيح أو منتهي الصلاحية."
          : "API key is invalid or expired.";
      } else if (response.status === 429) {
        errorMessage = isArabic
          ? "تم تجاوز حد استخدام API. يرجى المحاولة لاحقاً."
          : "API rate limit exceeded. Please try again later.";
      } else if (response.status === 404) {
        errorMessage = isArabic
          ? "خدمة التقويم الاقتصادي غير موجودة."
          : "Economic calendar service not found.";
      }

      return res.status(response.status).json({
        error: errorMessage,
        details: errorDetails,
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
    if (importance && importance !== "all") {
      const importanceStr = importance as string;
      const requestedLevels = importanceStr
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
    };

    // Cache the successful response for 5 minutes
    apiOptimizer.setCache(cacheKey, responseData, "calendar");

    res.json(responseData);
  } catch (error) {
    console.error("Error fetching EODHD economic calendar:", error);

    // Handle specific error types with localization
    const isArabic = lang === "ar";
    let errorMessage = isArabic
      ? "فشل في جلب التقويم الاقتصادي"
      : "Failed to fetch economic calendar";

    if (error instanceof Error) {
      if (error.name === "AbortError") {
        errorMessage = isArabic
          ? "انتهت مهلة الطلب - استغرق EODHD API وقتاً طويلاً للاستجابة"
          : "Request timeout - EODHD API took too long to respond";
      } else if (error.message.includes("fetch")) {
        errorMessage = isArabic
          ? "خطأ في الشبكة عند الاتصال بـ EODHD API"
          : "Network error connecting to EODHD API";
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
