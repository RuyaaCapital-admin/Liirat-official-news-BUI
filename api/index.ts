import express from "express";
import serverless from "serverless-http";
import OpenAI from "openai";

const BASE = "https://eodhd.com/api";

// --- helpers ---
function qs(input: Record<string, any> = {}) {
  const token = process.env.EODHD_API_KEY || process.env.EODHD_API_TOKEN || "";
  if (!token) {
    console.error("❌ EODHD_API_KEY environment variable is not set");
    throw new Error(
      "EODHD_API_KEY not set - Please configure your API key in Vercel environment variables",
    );
  }
  const p = new URLSearchParams();
  p.set("api_token", token);
  p.set("fmt", "json");
  for (const [k, v] of Object.entries(input))
    if (v !== undefined && v !== null && v !== "") p.set(k, String(v));
  return p.toString();
}

async function pass(path: string, query: Record<string, any> = {}) {
  const token = process.env.EODHD_API_KEY || process.env.EODHD_API_TOKEN || "";
  if (!token) {
    console.error("❌ EODHD_API_KEY environment variable is not set");
    throw new Error(
      "EODHD_API_KEY not set - Please configure your API key in Vercel environment variables",
    );
  }

  const url = `${BASE}${path}?${qs(query)}`;
  console.log(
    `🔗 EODHD API Request: ${url.replace(token, "[API_KEY_HIDDEN]")}`,
  );

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout for production

  try {
    const r = await fetch(url, {
      headers: {
        Accept: "application/json; charset=utf-8",
        "User-Agent": "Liirat-Financial-App/1.0",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!r.ok) {
      const errorText = await r.text().catch(() => "");
      console.error(`❌ EODHD API Error ${r.status}: ${errorText}`);
      throw new Error(`${path} ${r.status}: ${errorText}`);
    }

    const data = await r.json();
    console.log(`✅ EODHD API Success: ${path}`);
    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    console.error(`❌ EODHD API Network Error for ${path}:`, error);
    throw error;
  }
}

const app = express();
const r = express.Router();
app.use(express.json());
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,POST,OPTIONS,PUT,DELETE");
  res.header(
    "Access-Control-Allow-Headers",
    "Content-Type,Authorization,Accept",
  );
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

// ===== Enhanced EODHD Endpoints =====

// Economic Calendar with enhanced data mapping
r.get("/eodhd/calendar", async (req, res) => {
  try {
    const { from, to, countries = "", limit = "300" } = req.query as any;
    if (!from || !to)
      return res
        .status(400)
        .json({ error: "from and to required (YYYY-MM-DD format)" });

    console.log(`📅 Fetching economic calendar: ${from} to ${to}`);

    const rawData = await pass("/economic-events", {
      from,
      to,
      countries,
      limit,
    });
    const events = Array.isArray(rawData) ? rawData : [];

    console.log(`📊 Received ${events.length} economic events`);

    const items = events.map((e: any) => {
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

      const importanceOrder = { high: 3, medium: 2, low: 1 };
      return (
        (importanceOrder[b.importance as keyof typeof importanceOrder] || 1) -
        (importanceOrder[a.importance as keyof typeof importanceOrder] || 1)
      );
    });

    console.log(`✅ Processed ${sortedItems.length} economic events`);
    res.json({ ok: true, items: sortedItems, count: sortedItems.length });
  } catch (e: any) {
    console.error("❌ Calendar endpoint error:", e);
    res.status(500).json({ error: e.message });
  }
});

// Enhanced News endpoint with better data mapping
r.get("/eodhd/news", async (req, res) => {
  try {
    const q = req.query as any;
    const t = q.t ?? q.at ?? "";
    const s = q.s ?? "";
    const { limit = "100", offset = "0", from, to } = q;

    // Default to financial news if no specific symbol or topic
    const symbol = s || undefined;
    const topic = t || (symbol ? undefined : "financial");

    console.log(
      `📰 Fetching financial news - Symbol: ${symbol || "none"}, Topic: ${topic || "none"}`,
    );

    const rawData = await pass("/news", {
      s: symbol,
      t: topic,
      limit,
      offset,
      from,
      to,
    });
    const newsArray = Array.isArray(rawData) ? rawData : [];

    console.log(`📊 Received ${newsArray.length} news articles`);

    const items = newsArray.map((n: any, index: number) => {
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
    res.json({ ok: true, items: sortedItems, count: sortedItems.length });
  } catch (e: any) {
    console.error("❌ News endpoint error:", e);
    res.status(500).json({ error: e.message });
  }
});

// Enhanced Real-time Price endpoint
r.get("/eodhd/price", async (req, res) => {
  try {
    const { s, symbols } = req.query as any;
    const symbolParam = symbols || s || "";
    const symbolList = symbolParam
      .split(",")
      .map((s: string) => s.trim())
      .filter(Boolean);

    if (!symbolList.length)
      return res
        .status(400)
        .json({ error: "symbols parameter required (comma-separated list)" });

    console.log(`📊 Fetching real-time prices for: ${symbolList.join(", ")}`);

    const results = [];

    // Process symbols in parallel for better performance
    const promises = symbolList.map(async (symbol: string) => {
      try {
        const cleanSymbol = symbol.toUpperCase().trim();
        const data = await pass(
          `/real-time/${encodeURIComponent(cleanSymbol)}`,
        );

        // Enhanced data handling for EODHD real-time API
        const price =
          data.close !== "NA" && data.close !== null
            ? parseFloat(data.close)
            : data.previousClose !== "NA" && data.previousClose !== null
              ? parseFloat(data.previousClose)
              : parseFloat(data.price || 0);

        const change =
          data.change !== "NA" && data.change !== null
            ? parseFloat(data.change)
            : 0;

        const changePct =
          data.change_p !== "NA" && data.change_p !== null
            ? parseFloat(data.change_p)
            : 0;

        return {
          code: cleanSymbol,
          symbol: cleanSymbol,
          price: price || 0,
          close: price || 0,
          change: change || 0,
          changePct: changePct || 0,
          change_p: changePct || 0,
          timestamp: data.timestamp || Date.now(),
          ts: Date.now(),
          volume: data.volume || 0,
          open: parseFloat(data.open || 0),
          high: parseFloat(data.high || 0),
          low: parseFloat(data.low || 0),
          previousClose: parseFloat(data.previousClose || 0),
        };
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

    const results = await Promise.all(promises);
    const validResults = results.filter((r) => r.price > 0);

    console.log(
      `✅ Successfully fetched ${validResults.length}/${results.length} prices`,
    );
    res.json({
      ok: true,
      items: results,
      count: results.length,
      validCount: validResults.length,
    });
  } catch (e: any) {
    console.error("❌ Price endpoint error:", e);
    res.status(500).json({ error: e.message });
  }
});

// Multi-symbol quotes with enhanced error handling
r.get("/eodhd/quotes", async (req, res) => {
  try {
    const list = String((req.query as any).symbols || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (!list.length)
      return res.status(400).json({ error: "symbols required" });

    console.log(`📊 Fetching quotes for: ${list.join(", ")}`);

    const results = [];

    // Process each symbol individually for better error handling
    for (const symbol of list) {
      try {
        const cleanSymbol = symbol.toUpperCase().trim();
        const data = await pass(
          `/real-time/${encodeURIComponent(cleanSymbol)}`,
        );

        const price =
          data.close !== "NA" && data.close !== null
            ? parseFloat(data.close)
            : data.previousClose !== "NA" && data.previousClose !== null
              ? parseFloat(data.previousClose)
              : parseFloat(data.price || 0);

        const change =
          data.change !== "NA" && data.change !== null
            ? parseFloat(data.change)
            : 0;

        const changePct =
          data.change_p !== "NA" && data.change_p !== null
            ? parseFloat(data.change_p)
            : 0;

        results.push({
          code: cleanSymbol,
          symbol: cleanSymbol,
          price: price || 0,
          close: price || 0,
          change: change || 0,
          changePct: changePct || 0,
          change_p: changePct || 0,
          timestamp: data.timestamp || Date.now(),
          ts: Date.now(),
          volume: data.volume || 0,
          open: parseFloat(data.open || 0),
          high: parseFloat(data.high || 0),
          low: parseFloat(data.low || 0),
          previousClose: parseFloat(data.previousClose || 0),
        });
      } catch (symbolError) {
        console.error(`❌ Failed to fetch quote for ${symbol}:`, symbolError);
        results.push({
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
        });
      }
    }

    const validResults = results.filter((r) => r.price > 0);
    console.log(
      `✅ Successfully fetched ${validResults.length}/${results.length} quotes`,
    );

    res.json({
      ok: true,
      items: results,
      count: results.length,
      validCount: validResults.length,
    });
  } catch (e: any) {
    console.error("❌ Quotes endpoint error:", e);
    res.status(500).json({ error: e.message });
  }
});

// Enhanced ping endpoint with comprehensive API testing
r.get("/eodhd/ping", async (_req, res) => {
  try {
    console.log("🏓 Testing EODHD API connection...");

    // Test with a reliable symbol
    const testData = await pass("/real-time/AAPL.US");

    const apiStatus = {
      status: "OK",
      timestamp: new Date().toISOString(),
      apiKeyConfigured: !!(
        process.env.EODHD_API_KEY || process.env.EODHD_API_TOKEN
      ),
      testSymbol: "AAPL.US",
      testResult: {
        price: testData.close || testData.price || 0,
        change: testData.change || 0,
        timestamp: testData.timestamp || Date.now(),
      },
    };

    console.log("✅ EODHD API connection successful");
    res.json(apiStatus);
  } catch (e: any) {
    console.error("❌ EODHD API ping failed:", e);
    res.status(500).json({
      status: "ERROR",
      error: e.message,
      apiKeyConfigured: !!(
        process.env.EODHD_API_KEY || process.env.EODHD_API_TOKEN
      ),
      timestamp: new Date().toISOString(),
    });
  }
});

// AI Analysis endpoint (if OpenAI key is available)
r.post("/analysis", async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: "Text is required" });
    }

    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) {
      return res.status(503).json({ error: "OpenAI API key not configured" });
    }

    const openai = new OpenAI({ apiKey: openaiKey });

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            "You are a financial analyst. Provide brief, actionable insights about the given financial news or data. Keep responses under 100 words.",
        },
        {
          role: "user",
          content: `Analyze this financial information: ${text}`,
        },
      ],
      max_tokens: 150,
      temperature: 0.7,
    });

    const analysis =
      completion.choices[0]?.message?.content || "Analysis unavailable";
    res.json({ result: analysis });
  } catch (error) {
    console.error("❌ AI Analysis error:", error);
    res.status(500).json({ error: "Analysis service temporarily unavailable" });
  }
});

// Status endpoint for health checks
r.get("/status", async (_req, res) => {
  const status = {
    status: "OK",
    timestamp: new Date().toISOString(),
    environment: {
      eodhd_api_key: !!(
        process.env.EODHD_API_KEY || process.env.EODHD_API_TOKEN
      ),
      openai_api_key: !!process.env.OPENAI_API_KEY,
    },
    version: "2.2",
  };

  res.json(status);
});

// ===== Back-compat (OLD frontend URLs) =====
r.get("/price", (req, res) =>
  r.handle({ ...req, url: "/api/eodhd/price" } as any, res as any),
);
r.get("/quotes", (req, res) =>
  r.handle({ ...req, url: "/api/eodhd/quotes" } as any, res as any),
);
r.get("/calendar", (req, res) =>
  r.handle({ ...req, url: "/api/eodhd/calendar" } as any, res as any),
);
r.get("/news", (req, res) => {
  if ((req.query as any).at && !(req.query as any).t)
    (req.query as any).t = (req.query as any).at;
  return r.handle({ ...req, url: "/api/eodhd/news" } as any, res as any);
});

app.use("/api", r);
app.get("/", (_req, res) =>
  res.json({
    message: "Liirat Financial API",
    version: "2.2",
    status: "Production Ready",
    endpoints: [
      "/api/eodhd/calendar",
      "/api/eodhd/news",
      "/api/eodhd/price",
      "/api/eodhd/quotes",
      "/api/eodhd/ping",
      "/api/analysis",
      "/api/status",
    ],
    timestamp: new Date().toISOString(),
  }),
);

export default serverless(app);
