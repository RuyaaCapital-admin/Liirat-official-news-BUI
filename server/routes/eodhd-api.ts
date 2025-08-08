import { RequestHandler } from "express";
import { toIsoUtc } from "../../src/server/date";
const BASE = "https://eodhd.com/api";

async function eodFetch(
  path: string,
  q: Record<string, string | number | undefined> = {},
) {
  // Try multiple ways to get the API key with fallback
  const key =
    process.env.EODHD_API_KEY ||
    process.env.VITE_EODHD_API_KEY ||
    process.env.EODHD_API_TOKEN ||
    "68951b70be6585.58184855"; // Fallback to provided key

  if (!key || key === "") {
    console.error("❌ EODHD_API_KEY environment variable is not set");
    console.error(
      "Available env vars:",
      Object.keys(process.env).filter(
        (k) => k.includes("EODHD") || k.includes("API"),
      ),
    );
    console.error("Please set EODHD_API_KEY in your environment variables");
    throw new Error(
      "EODHD_API_KEY not set - Please configure your API key in environment variables",
    );
  }

  console.log("✅ EODHD API key found, length:", key.length);

  const u = new URL(BASE + path);
  Object.entries(q).forEach(
    ([k, v]) => v !== undefined && u.searchParams.set(k, String(v)),
  );
  u.searchParams.set("api_token", key);
  u.searchParams.set("fmt", "json");

  console.log(
    `🔗 EODHD API Request: ${u.toString().replace(key, "[API_KEY_HIDDEN]")}`,
  );

  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), 10000); // Increased timeout for better reliability

  try {
    const res = await fetch(u.toString(), {
      signal: ac.signal,
      headers: {
        Accept: "application/json; charset=utf-8",
        "User-Agent": "Liirat-Financial-App/1.0",
      },
    });
    clearTimeout(t);

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error(`❌ EODHD API Error: ${res.status} - ${detail}`);
      return new Response(
        JSON.stringify({
          ok: false,
          code: "UPSTREAM_ERROR",
          detail,
          status: res.status,
        }),
        {
          status: res.status,
          headers: {
            "Content-Type": "application/json; charset=utf-8",
            "Cache-Control": "no-store",
          },
        },
      );
    }

    const data = await res.json();
    console.log(`✅ EODHD API Success: ${path}`);

    return new Response(JSON.stringify({ ok: true, data }), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "s-maxage=30, stale-while-revalidate=120", // Better caching for production
      },
    });
  } catch (error) {
    clearTimeout(t);
    console.error(`❌ EODHD API Network Error:`, error);
    throw error;
  }
}

// Search endpoint
export const handleEODHDSearch: RequestHandler = async (req, res) => {
  const { q, limit, type } = req.query;
  if (!q) {
    return res.status(400).json({ ok: false, code: "MISSING_Q" });
  }

  try {
    const response = await eodFetch(
      `/search/${encodeURIComponent(q as string)}`,
      {
        limit: (limit as string) || "15",
        type: (type as string) || "all",
      },
    );

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(500).json({
      ok: false,
      code: "INTERNAL_ERROR",
      detail: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Price endpoint - Enhanced for real-time data
export const handleEODHDPrice: RequestHandler = async (req, res) => {
  const { symbols, s } = req.query;

  // Handle both 'symbols' and 's' parameters for compatibility
  const symbolParam = (symbols as string) || (s as string) || "";
  const symbolList = symbolParam
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (!symbolList.length) {
    return res.status(400).json({
      ok: false,
      code: "MISSING_SYMBOLS",
      message: "Please provide symbols parameter (comma-separated list)",
    });
  }

  console.log(`📊 Fetching real-time prices for: ${symbolList.join(", ")}`);

  try {
    // Process symbols in parallel for better performance
    const promises = symbolList.map(async (symbol) => {
      try {
        const cleanSymbol = symbol.toUpperCase().trim();
        const response = await eodFetch(
          `/real-time/${encodeURIComponent(cleanSymbol)}`,
        );
        const r = await response.json();

        if (r.ok && r.data) {
          const item = r.data;

          // Enhanced data handling for EODHD real-time API
          const price =
            item.close !== "NA" && item.close !== null
              ? parseFloat(item.close)
              : item.previousClose !== "NA" && item.previousClose !== null
                ? parseFloat(item.previousClose)
                : parseFloat(item.price || 0);

          const change =
            item.change !== "NA" && item.change !== null
              ? parseFloat(item.change)
              : 0;

          const changePct =
            item.change_p !== "NA" && item.change_p !== null
              ? parseFloat(item.change_p)
              : 0;

          return {
            code: cleanSymbol,
            symbol: cleanSymbol,
            price: price || 0,
            close: price || 0,
            change: change || 0,
            changePct: changePct || 0,
            change_p: changePct || 0,
            timestamp: item.timestamp || Date.now(),
            ts: Date.now(),
            volume: item.volume || 0,
            open: parseFloat(item.open || 0),
            high: parseFloat(item.high || 0),
            low: parseFloat(item.low || 0),
            previousClose: parseFloat(item.previousClose || 0),
          };
        } else {
          console.warn(`⚠️ No data received for symbol: ${cleanSymbol}`);
          return {
            code: cleanSymbol,
            symbol: cleanSymbol,
            price: 0,
            close: 0,
            change: 0,
            changePct: 0,
            change_p: 0,
            timestamp: Date.now(),
            ts: Date.now(),
            error: "No data available",
          };
        }
      } catch (symbolError) {
        console.error(`❌ Failed to fetch ${symbol}:`, symbolError);
        return {
          code: symbol.toUpperCase(),
          symbol: symbol.toUpperCase(),
          price: 0,
          close: 0,
          change: 0,
          changePct: 0,
          change_p: 0,
          timestamp: Date.now(),
          ts: Date.now(),
          error:
            symbolError instanceof Error ? symbolError.message : "Fetch failed",
        };
      }
    });

    const priceResults = await Promise.all(promises);
    const validResults = priceResults.filter((r) => r.price > 0);

    console.log(
      `✅ Successfully fetched ${validResults.length}/${priceResults.length} prices`,
    );

    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Cache-Control", "s-maxage=10, stale-while-revalidate=30");
    res.status(200).json({
      ok: true,
      items: priceResults,
      count: priceResults.length,
      validCount: validResults.length,
    });
  } catch (error) {
    console.error(`❌ Price endpoint error:`, error);
    res.status(500).json({
      ok: false,
      code: "INTERNAL_ERROR",
      detail: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Calendar endpoint - Enhanced for economic events
export const handleEODHDCalendar: RequestHandler = async (req, res) => {
  const { from, to, countries, country, type, limit } = req.query;

  if (!from || !to) {
    return res.status(400).json({
      ok: false,
      code: "MISSING_RANGE",
      message:
        "Please provide 'from' and 'to' date parameters (YYYY-MM-DD format)",
    });
  }

  console.log(`📅 Fetching economic calendar: ${from} to ${to}`);

  try {
    const response = await eodFetch(`/economic-events`, {
      from: from as string,
      to: to as string,
      country: (countries as string) || (country as string) || undefined,
      type: (type as string) || undefined,
      limit: (limit as string) || "300", // Increased limit for more comprehensive data
    });

    const raw = await response.json();
    if (!raw.ok) {
      console.error(`❌ Calendar API error:`, raw);
      return res.status(502).json(raw);
    }

    const rawData = raw.data || raw || [];
    console.log(`📊 Received ${rawData.length} economic events`);

    const items = rawData.map((e: any) => {
      // Enhanced date/time parsing
      let eventDate = "";
      let eventTime = "00:00";

      if (e.date) {
        const dateStr = e.date.toString();
        if (dateStr.includes("T")) {
          const parts = dateStr.split("T");
          eventDate = parts[0];
          eventTime = parts[1]?.split(".")[0] || "00:00";
        } else {
          eventDate = dateStr;
        }
      } else if (e.datetime) {
        const dateStr = e.datetime.toString();
        if (dateStr.includes("T")) {
          const parts = dateStr.split("T");
          eventDate = parts[0];
          eventTime = parts[1]?.split(".")[0] || "00:00";
        } else {
          eventDate = dateStr;
        }
      }

      // Enhanced importance mapping
      let importance = "low";
      if (e.importance) {
        const imp = String(e.importance).toLowerCase();
        if (imp.includes("high") || imp === "3") importance = "high";
        else if (imp.includes("medium") || imp === "2") importance = "medium";
        else importance = "low";
      }

      return {
        date: eventDate,
        time: eventTime,
        country: e.country || e.country_code || "",
        event: e.event || e.title || e.name || "",
        title: e.event || e.title || e.name || "",
        category: e.category || e.type || "economic",
        importance: importance,
        previous:
          e.previous !== null && e.previous !== undefined
            ? String(e.previous)
            : "",
        forecast:
          e.estimate !== null && e.estimate !== undefined
            ? String(e.estimate)
            : e.forecast !== null && e.forecast !== undefined
              ? String(e.forecast)
              : "",
        actual:
          e.actual !== null && e.actual !== undefined ? String(e.actual) : "",
        currency: e.currency || "",
        unit: e.unit || "",
        source: "EODHD",
        id: `${e.country || "XX"}-${eventDate}-${e.event || "event"}`.replace(
          /[^a-zA-Z0-9-]/g,
          "-",
        ),
      };
    });

    // Sort by date and importance
    const sortedItems = items.sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.time}`).getTime();
      const dateB = new Date(`${b.date}T${b.time}`).getTime();
      if (dateA !== dateB) return dateA - dateB;

      // Sort by importance (high > medium > low)
      const importanceOrder = { high: 3, medium: 2, low: 1 };
      return (
        (importanceOrder[b.importance as keyof typeof importanceOrder] || 1) -
        (importanceOrder[a.importance as keyof typeof importanceOrder] || 1)
      );
    });

    console.log(`✅ Processed ${sortedItems.length} economic events`);

    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600"); // 5min cache
    res.status(200).json({
      ok: true,
      items: sortedItems,
      count: sortedItems.length,
      dateRange: { from, to },
    });
  } catch (error) {
    console.error(`❌ Calendar endpoint error:`, error);
    res.status(500).json({
      ok: false,
      code: "INTERNAL_ERROR",
      detail: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// News endpoint - Enhanced for financial news
export const handleEODHDNews: RequestHandler = async (req, res) => {
  const { s, t, from, to, limit, offset } = req.query;

  // Default to financial news if no specific symbol or topic provided
  const symbol = (s as string) || undefined;
  const topic = (t as string) || (symbol ? undefined : "financial");

  console.log(
    `📰 Fetching financial news - Symbol: ${symbol || "none"}, Topic: ${topic || "none"}`,
  );

  try {
    const response = await eodFetch(`/news`, {
      s: symbol,
      t: topic,
      from: (from as string) || undefined,
      to: (to as string) || undefined,
      limit: (limit as string) || "100", // Increased for more comprehensive news
      offset: (offset as string) || "0",
    });

    const raw = await response.json();
    if (!raw.ok) {
      console.error(`❌ News API error:`, raw);
      return res.status(502).json(raw);
    }

    const rawData = raw.data || raw || [];
    console.log(`📊 Received ${rawData.length} news articles`);

    const items = rawData.map((n: any, index: number) => {
      // Enhanced date parsing
      let datetimeIso = null;
      const dateField = n.date || n.datetime || n.published_at || n.time;
      if (dateField) {
        try {
          const date = new Date(dateField);
          if (!isNaN(date.getTime())) {
            datetimeIso = date.toISOString();
          }
        } catch (e) {
          console.warn(`⚠️ Failed to parse date: ${dateField}`);
        }
      }

      // Fallback to current time if no valid date
      if (!datetimeIso) {
        datetimeIso = new Date().toISOString();
      }

      return {
        id: `news-${Date.now()}-${index}`,
        datetimeIso,
        title: String(n.title || "").trim(),
        content: String(
          n.content || n.description || n.summary || n.title || "",
        ).trim(),
        source: String(n.source || "EODHD").trim(),
        symbols: Array.isArray(n.symbols) ? n.symbols : [],
        tags: Array.isArray(n.tags)
          ? n.tags
          : Array.isArray(n.symbols)
            ? n.symbols
            : [],
        url: n.link || n.url || "",
        country: n.country || "",
        category: n.category || "financial",
        sentiment: n.sentiment || "neutral",
        language: n.language || "en",
      };
    });

    // Filter out empty or invalid articles
    const validItems = items.filter(
      (item) =>
        item.title &&
        item.title.length > 10 &&
        item.content &&
        item.content.length > 20,
    );

    // Sort by date (newest first)
    const sortedItems = validItems.sort(
      (a, b) =>
        new Date(b.datetimeIso).getTime() - new Date(a.datetimeIso).getTime(),
    );

    console.log(`✅ Processed ${sortedItems.length} valid news articles`);

    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Cache-Control", "s-maxage=180, stale-while-revalidate=360"); // 3min cache
    res.status(200).json({
      ok: true,
      items: sortedItems,
      count: sortedItems.length,
      totalReceived: rawData.length,
    });
  } catch (error) {
    console.error(`❌ News endpoint error:`, error);
    res.status(500).json({
      ok: false,
      code: "INTERNAL_ERROR",
      detail: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Ping endpoint
export const handleEODHDPing: RequestHandler = async (req, res) => {
  try {
    const testResponse = await eodFetch("/real-time/AAPL.US");
    const result = await testResponse.json();

    res.status(200).json({
      ok: true,
      status: "EODHD API connection successful",
      test: result.ok ? "API key valid" : "API key test failed",
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      code: "CONNECTION_ERROR",
      detail: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
