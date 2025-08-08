import express from "express";
import serverless from "serverless-http";
import OpenAI from "openai";

const BASE = "https://eodhd.com/api";

// Helper to build query string with API token
function qs(input: Record<string, any> = {}) {
  const token = process.env.EODHD_API_KEY || "";
  if (!token) throw new Error("EODHD_API_KEY not set");

  const params = new URLSearchParams();
  params.set("api_token", token);
  params.set("fmt", "json");
  
  Object.entries(input).forEach(([k, v]) => {
    if (v !== undefined && v !== null) {
      params.set(k, String(v));
    }
  });
  
  return params.toString();
}

// EODHD API pass-through
async function pass(path: string, query: Record<string, any> = {}) {
  const url = `${BASE}${path}?${qs(query)}`;
  const response = await fetch(url, {
    headers: { "Accept": "application/json; charset=utf-8" }
  });
  
  if (!response.ok) {
    throw new Error(`EODHD API error: ${response.status}`);
  }
  
  return response.json();
}

const app = express();
const r = express.Router();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS middleware
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// EODHD Pass-through endpoints
r.get("/eodhd/search/:query", async (req, res) => {
  try {
    const { query } = req.params;
    const { limit = "15", type = "all" } = req.query;
    const data = await pass(`/search/${encodeURIComponent(query)}`, { limit, type });
    res.set("Content-Type", "application/json; charset=utf-8").json(data);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

r.get("/eodhd/price", async (req, res) => {
  try {
    const { s } = req.query;
    if (!s) return res.status(400).json({ error: "Symbol required" });
    
    const data = await pass(`/real-time/${encodeURIComponent(String(s))}`, {});
    res.set("Content-Type", "application/json; charset=utf-8").json(data);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

r.get("/eodhd/quotes", async (req, res) => {
  try {
    const list = String(req.query.symbols || "").split(",").map(s=>s.trim()).filter(Boolean);
    if (!list.length) return res.status(400).json({ error: "symbols required" });
    const first = list[0], rest = list.slice(1).join(",");
    const url = new URL(`${BASE}/real-time/${encodeURIComponent(first)}`);
    url.search = qs(rest ? { s: rest } : {});
    const rr = await fetch(url.toString());
    if (!rr.ok) throw new Error(`real-time ${rr.status}`);
    res.set("Content-Type","application/json; charset=utf-8").json(await rr.json());
  } catch (e:any) { res.status(500).json({ error: e.message }); }
});

r.get("/eodhd/calendar", async (req, res) => {
  try {
    const { from, to, countries, limit = "200" } = req.query;
    if (!from || !to) return res.status(400).json({ error: "from and to dates required" });
    
    const data = await pass("/economic-events", { from, to, countries, limit });
    res.set("Content-Type", "application/json; charset=utf-8").json(data);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

r.get("/eodhd/news", async (req, res) => {
  try {
    const { s, t, limit = "50", offset = "0" } = req.query;
    if (!s && !t) return res.status(400).json({ error: "s or t parameter required" });
    
    const data = await pass("/news", { s, t, limit, offset });
    res.set("Content-Type", "application/json; charset=utf-8").json(data);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

r.get("/eodhd/ping", async (req, res) => {
  try {
    const data = await pass("/real-time/AAPL.US", {});
    res.json({ status: "OK", test: data });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// OpenAI Analysis endpoint
r.post("/analysis", async (req, res) => {
  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const { text, prompt } = req.body || {};
    
    if (!text) {
      return res.status(400).json({ error: "text required" });
    }
    
    const messages = [
      {
        role: "system" as const,
        content: prompt || "You are a financial analyst. Provide concise analysis of the given text. Focus on key financial implications, trends, and actionable insights."
      },
      {
        role: "user" as const,
        content: text
      }
    ];
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      max_tokens: 500,
      temperature: 0.7
    });
    
    const result = response.choices?.[0]?.message?.content || "";
    res.json({ result });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Translation endpoint
r.post("/translate", async (req, res) => {
  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const { text, targetLanguage = "Arabic" } = req.body || {};
    
    if (!text) {
      return res.status(400).json({ error: "text required" });
    }
    
    const messages = [
      {
        role: "system" as const,
        content: `Translate to Modern Standard ${targetLanguage} only. Return just the translation, no explanations.`
      },
      {
        role: "user" as const,
        content: text
      }
    ];
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      max_tokens: 300,
      temperature: 0.3
    });
    
    const result = response.choices?.[0]?.message?.content || text;
    res.json({ result });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Health check
r.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

app.use("/api", r);

// Handle root requests
app.get("/", (req, res) => {
  res.json({ message: "Liirat News API", version: "2.0" });
});

export default serverless(app);
