import express from "express";
import serverless from "serverless-http";
import OpenAI from "openai";

const BASE = "https://eodhd.com/api";

// ----- helpers -----
function qs(input: Record<string, any> = {}) {
  // accept either env var name
  const token =
    process.env.EODHD_API_KEY || process.env.EODHD_API_TOKEN || "";
  if (!token) throw new Error("EODHD_API_KEY not set");

  const params = new URLSearchParams();
  params.set("api_token", token);
  params.set("fmt", "json");
  Object.entries(input).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") params.set(k, String(v));
  });
  return params.toString();
}

async function pass(path: string, query: Record<string, any> = {}) {
  const url = `${BASE}${path}?${qs(query)}`;
  const r = await fetch(url, {
    headers: { Accept: "application/json; charset=utf-8" },
  });
  if (!r.ok) throw new Error(`${path} ${r.status}`);
  return r.json();
}

// ----- app -----
const app = express();
const r = express.Router();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

// ===== Canonical routes under /api/eodhd/* =====
r.get("/eodhd/search/:query", async (req, res) => {
  try {
    const { query } = req.params;
    const { limit = "15", type = "all" } = req.query as any;
    res.json(await pass(`/search/${encodeURIComponent(query)}`, { limit, type }));
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

r.get("/eodhd/price", async (req, res) => {
  try {
    const s = String((req.query as any).s || "");
    if (!s) return res.status(400).json({ error: "s required" });
    res.json(await pass(`/real-time/${encodeURIComponent(s)}`));
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

r.get("/eodhd/quotes", async (req, res) => {
  try {
    const list = String((req.query as any).symbols || "")
      .split(",").map(s => s.trim()).filter(Boolean);
    if (!list.length) return res.status(400).json({ error: "symbols required" });
    const [first, ...rest] = list;
    const url = new URL(`${BASE}/real-time/${encodeURIComponent(first)}`);
    url.search = qs(rest.length ? { s: rest.join(",") } : {});
    const rr = await fetch(url.toString());
    if (!rr.ok) throw new Error(`real-time ${rr.status}`);
    res.json(await rr.json());
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

r.get("/eodhd/calendar", async (req, res) => {
  try {
    const { from, to, countries = "", limit = "200" } = req.query as any;
    if (!from || !to) return res.status(400).json({ error: "from and to required" });
    res.json(await pass("/economic-events", { from, to, countries, limit }));
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

r.get("/eodhd/news", async (req, res) => {
  try {
    const q = req.query as any;
    const t = q.t ?? q.at ?? ""; // accept both 't' and legacy 'at'
    const s = q.s ?? "";
    const { limit = "50", offset = "0" } = q;
    if (!s && !t) return res.status(400).json({ error: "s or t required" });
    res.json(await pass("/news", { s, t, limit, offset }));
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

r.get("/eodhd/ping", async (_req, res) => {
  try { res.json({ status: "OK", test: await pass("/real-time/AAPL.US") }); }
  catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ===== Back-compat aliases (so old frontend URLs still work) =====
r.get("/price", async (req, res) => {
  try {
    const symbols = String((req.query as any).symbols || "").trim();
    if (symbols) {
      const list = symbols.split(",").map(s => s.trim()).filter(Boolean);
      const [first, ...rest] = list;
      const url = new URL(`${BASE}/real-time/${encodeURIComponent(first)}`);
      url.search = qs(rest.length ? { s: rest.join(",") } : {});
      const rr = await fetch(url.toString());
      if (!rr.ok) throw new Error(`real-time ${rr.status}`);
      return res.json(await rr.json());
    }
    const s = String((req.query as any).s || "");
    if (!s) return res.status(400).json({ error: "s or symbols required" });
    return res.json(await pass(`/real-time/${encodeURIComponent(s)}`));
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

r.get("/quotes", (req, res) =>
  r.handle({ ...req, url: "/api/eodhd/quotes" } as any, res as any)
);

r.get("/calendar", (req, res) =>
  r.handle({ ...req, url: "/api/eodhd/calendar" } as any, res as any)
);

r.get("/news", (req, res) => {
  if ((req.query as any).at && !(req.query as any).t)
    (req.query as any).t = (req.query as any).at;
  return r.handle({ ...req, url: "/api/eodhd/news" } as any, res as any);
});

r.get("/ping", (_req, res) =>
  r.handle({ url: "/api/eodhd/ping" } as any, res as any)
);

// ===== OpenAI endpoints =====
r.post("/analysis", async (req, res) => {
  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const { text, prompt } = req.body || {};
    if (!text) return res.status(400).json({ error: "text required" });

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            prompt ||
            "You are a financial analyst. Provide concise analysis of the given text.",
        },
        { role: "user", content: text },
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    res.json({ result: response.choices?.[0]?.message?.content || "" });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

r.post("/translate", async (req, res) => {
  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const { text, targetLanguage = "Arabic" } = req.body || {};
    if (!text) return res.status(400).json({ error: "text required" });

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: `Translate to Modern Standard ${targetLanguage}. Return only the translation.` },
        { role: "user", content: text },
      ],
      max_tokens: 300,
      temperature: 0.3,
    });

    res.json({ result: response.choices?.[0]?.message?.content || text });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// health + bind
r.get("/health", (_req, res) =>
  res.json({ status: "OK", timestamp: new Date().toISOString() })
);

app.use("/api", r);
app.get("/", (_req, res) =>
  res.json({ message: "Liirat News API", version: "2.1" })
);

export default serverless(app);
