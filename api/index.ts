import express from "express";
import OpenAI from "openai";

const BASE = "https://eodhd.com/api";

// ---- helpers ----
function qs(input: Record<string, any> = {}) {
  const token = process.env.EODHD_API_KEY || process.env.EODHD_API_TOKEN || "";
  if (!token) throw new Error("EODHD_API_KEY not set");
  const p = new URLSearchParams();
  p.set("api_token", token);
  p.set("fmt", "json");
  for (const [k, v] of Object.entries(input)) {
    if (v !== undefined && v !== null && v !== "") p.set(k, String(v));
  }
  return p.toString();
}

async function pass(path: string, query: Record<string, any> = {}) {
  const token = process.env.EODHD_API_KEY || process.env.EODHD_API_TOKEN || "";
  if (!token) throw new Error("EODHD_API_KEY not set");

  const url = `${BASE}${path}?${qs(query)}`;
  const r = await fetch(url, {
    headers: {
      Accept: "application/json; charset=utf-8",
      "User-Agent": "Liirat-Financial-App/1.0",
    },
  });
  const text = await r.text();
  if (!r.ok) throw new Error(`${path} ${r.status}: ${text.slice(0,300)}`);
  try { return JSON.parse(text); } catch { return text; }
}

// ---- app ----
const app = express();
const r = express.Router();

app.use(express.json());
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,POST,OPTIONS,PUT,DELETE");
  res.header("Access-Control-Allow-Headers", "Content-Type,Authorization,Accept");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

/* ===== ROUTES ===== */

// Economic calendar
r.get("/eodhd/calendar", async (req, res) => {
  try {
    const { from, to, countries = "", limit = "300" } = req.query as any;
    if (!from || !to) return res.status(400).json({ error: "from and to required (YYYY-MM-DD)" });

    const raw = await pass("/economic-events", { from, to, countries, limit });
    const items = (Array.isArray(raw) ? raw : []).map((e: any) => {
      const d = String(e.date || e.datetime || "");
      const [date, timeRaw] = d.includes("T") ? d.split("T") : [d, "00:00"];
      const time = (timeRaw || "").split(".")[0] || "00:00";

      let importance = "low";
      const imp = String(e.importance ?? "").toLowerCase();
      if (imp.includes("high") || imp === "3") importance = "high";
      else if (imp.includes("medium") || imp === "2") importance = "medium";

      return {
        date,
        time,
        country: e.country || e.country_code || "",
        event: e.event || e.title || e.name || "",
        title: e.event || e.title || e.name || "",
        category: e.category || e.type || "economic",
        importance,
        previous: e.previous ?? "",
        forecast: e.estimate ?? e.forecast ?? "",
        actual: e.actual ?? "",
        currency: e.currency || "",
        unit: e.unit || "",
        source: "EODHD",
        id: `${e.country || "XX"}-${date}-${(e.event || "event")
          .toString()
          .replace(/[^a-zA-Z0-9-]/g, "-")}`,
      };
    });

    items.sort((a: any, b: any) => {
      const tA = new Date(`${a.date}T${a.time}`).getTime();
      const tB = new Date(`${b.date}T${b.time}`).getTime();
      if (tA !== tB) return tA - tB;
      const order: any = { low: 1, medium: 2, high: 3 };
      return order[b.importance] - order[a.importance];
    });

    res.json({ ok: true, items, count: items.length });
  } catch (e: any) {
    res.status(500).json({ error: e.message || "calendar failed" });
  }
});

// News
r.get("/eodhd/news", async (req, res) => {
  try {
    const q = req.query as any;
    const symbols = q.symbols || q.s || "";
    const topic = q.t || q.at || (symbols ? undefined : "financial");
    const { limit = "100", offset = "0", from, to } = q;

    const raw = await pass("/news", { s: symbols || undefined, t: topic, limit, offset, from, to });
    const arr = Array.isArray(raw) ? raw : [];
    const items = arr.map((n: any, i: number) => {
      const d = new Date(n.date || n.datetime || n.published_at || n.time || Date.now());
      return {
        id: `news-${Date.now()}-${i}`,
        datetimeIso: isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString(),
        title: String(n.title || "").trim(),
        content: String(n.content || n.description || n.summary || n.title || "").trim(),
        source: String(n.source || "EODHD").trim(),
        symbols: Array.isArray(n.symbols) ? n.symbols : [],
        tags: Array.isArray(n.tags) ? n.tags : [],
        url: n.link || n.url || "",
        country: n.country || "",
        category: n.category || "financial",
        sentiment: n.sentiment || "neutral",
        language: n.language || "en",
      };
    }).filter((x: any) => x.title?.length > 10 && x.content?.length > 20)
      .sort((a: any, b: any) => new Date(b.datetimeIso).getTime() - new Date(a.datetimeIso).getTime());

    res.json({ ok: true, items, count: items.length });
  } catch (e: any) {
    res.status(500).json({ error: e.message || "news failed" });
  }
});

// Real-time prices (multi-symbol)
r.get("/eodhd/price", async (req, res) => {
  try {
    const { s, symbols } = req.query as any;
    const list = String(symbols || s || "")
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);
    if (!list.length) return res.status(400).json({ error: "symbols required (comma-separated)" });

    let results: any[] = [];                           // SINGLE declaration
    const promises = list.map(async (sym: string) => {
      try {
        const clean = sym.toUpperCase();
        const data = await pass(`/real-time/${encodeURIComponent(clean)}`);
        const price =
          data.close !== "NA" && data.close != null ? Number(data.close) :
          data.previousClose !== "NA" && data.previousClose != null ? Number(data.previousClose) :
          Number(data.price || 0);
        const change = data.change !== "NA" && data.change != null ? Number(data.change) : 0;
        const changePct = data.change_p !== "NA" && data.change_p != null ? Number(data.change_p) : 0;

        return {
          code: clean,
          symbol: clean,
          price: price || 0,
          close: price || 0,
          change: change || 0,
          changePct: changePct || 0,
          change_p: changePct || 0,
          timestamp: data.timestamp || Date.now(),
          ts: Date.now(),
          volume: data.volume || 0,
          open: Number(data.open || 0),
          high: Number(data.high || 0),
          low: Number(data.low || 0),
          previousClose: Number(data.previousClose || 0),
        };
      } catch (err: any) {
        return {
          code: sym.toUpperCase(),
          symbol: sym.toUpperCase(),
          price: 0, close: 0, change: 0, changePct: 0, change_p: 0,
          timestamp: Date.now(), ts: Date.now(),
          error: String(err?.message || err || "fetch failed"),
        };
      }
    });

    results = await Promise.all(promises);            // ASSIGN to the same var
    const validResults = results.filter((r) => r.price > 0);
    res.json({ ok: true, items: results, count: results.length, validCount: validResults.length });
  } catch (e: any) {
    res.status(500).json({ error: e.message || "price failed" });
  }
});

// Batch quotes (compat)
r.get("/eodhd/quotes", async (req, res) => {
  try {
    const list = String((req.query as any).symbols || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (!list.length) return res.status(400).json({ error: "symbols required" });

    const out: any[] = [];
    for (const sym of list) {
      try {
        const clean = sym.toUpperCase();
        const data = await pass(`/real-time/${encodeURIComponent(clean)}`);
        const price =
          data.close !== "NA" && data.close != null ? Number(data.close) :
          data.previousClose !== "NA" && data.previousClose != null ? Number(data.previousClose) :
          Number(data.price || 0);
        const change = data.change !== "NA" && data.change != null ? Number(data.change) : 0;
        const changePct = data.change_p !== "NA" && data.change_p != null ? Number(data.change_p) : 0;
        out.push({
          code: clean, symbol: clean, price, close: price, change, changePct, change_p: changePct,
          timestamp: data.timestamp || Date.now(), ts: Date.now(),
          volume: data.volume || 0,
          open: Number(data.open || 0), high: Number(data.high || 0),
          low: Number(data.low || 0), previousClose: Number(data.previousClose || 0),
        });
      } catch (err: any) {
        out.push({ code: sym.toUpperCase(), symbol: sym.toUpperCase(), price: 0, error: String(err?.message || err) });
      }
    }
    res.json({ ok: true, items: out, count: out.length });
  } catch (e: any) {
    res.status(500).json({ error: e.message || "quotes failed" });
  }
});

// Ping/status
r.get("/eodhd/ping", async (_req, res) => {
  try {
    const t = await pass("/real-time/AAPL.US");
    res.json({ status: "OK", test: { price: t.close || t.price || 0 }, ts: Date.now() });
  } catch (e: any) {
    res.status(500).json({ status: "ERROR", error: e.message, ts: Date.now() });
  }
});

r.get("/status", (_req, res) =>
  res.json({
    status: "OK",
    ts: new Date().toISOString(),
    env: {
      eodhd_api_key: !!(process.env.EODHD_API_KEY || process.env.EODHD_API_TOKEN),
      openai_api_key: !!process.env.OPENAI_API_KEY,
    },
    version: "2.2",
  })
);

// Back-compat shortcuts
r.get("/price", (req, res) => r.handle({ ...req, url: "/api/eodhd/price" } as any, res as any));
r.get("/quotes", (req, res) => r.handle({ ...req, url: "/api/eodhd/quotes" } as any, res as any));
r.get("/calendar", (req, res) => r.handle({ ...req, url: "/api/eodhd/calendar" } as any, res as any));
r.get("/news", (req, res) => {
  if ((req.query as any).at && !(req.query as any).t) (req.query as any).t = (req.query as any).at;
  return r.handle({ ...req, url: "/api/eodhd/news" } as any, res as any);
});

app.use("/api", r);
app.get("/", (_req, res) =>
  res.json({ message: "Liirat Financial API", version: "2.2", endpoints: ["/api/eodhd/calendar", "/api/eodhd/news", "/api/eodhd/price", "/api/eodhd/quotes", "/api/eodhd/ping", "/api/status"] })
);

// IMPORTANT: no serverless-http on Vercel
export default (req: any, res: any) => app(req, res);
