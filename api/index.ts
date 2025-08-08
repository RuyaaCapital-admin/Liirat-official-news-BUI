import express from "express";
import serverless from "serverless-http";
import OpenAI from "openai";

const app = express();
app.use(express.json());
app.set("trust proxy", true);

const BASE = "https://eodhd.com/api";
function qs(input: Record<string, any> = {}) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(input)) if (v !== undefined) p.append(k, String(v));
  const token = process.env.EODHD_API_TOKEN || "";
  if (!token) throw new Error("EODHD_API_TOKEN not set");
  p.set("api_token", token);
  p.set("fmt", "json");
  return p.toString();
}
async function pass(path: string, q: any) {
  const url = `${BASE}${path}?${qs(q)}`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${path} ${r.status}`);
  return r.json();
}
function pickPrice(obj: any) {
  // Show exactly what EODHD returns; no fabrication.
  const k = ["close","price","last","adjusted_close"];
  for (const key of k) if (obj && obj[key] != null) return Number(obj[key]);
  return null;
}

const r = express.Router();

// Health
r.get("/ping", (_req, res) => res.json({ ok: true, ts: Date.now() }));

// ---- EODHD (no hardcode)
r.get("/eodhd/news", async (req, res) => {
  try { res.set("Content-Type","application/json; charset=utf-8").json(await pass("/news", req.query)); }
  catch (e:any) { res.status(500).json({ error: e.message }); }
});
r.get("/eodhd/calendar", async (req, res) => {
  try { res.set("Content-Type","application/json; charset=utf-8").json(await pass("/economic-events", req.query)); }
  catch (e:any) { res.status(500).json({ error: e.message }); }
});
r.get("/eodhd/price", async (req, res) => {
  const s = (req.query.s as string) || (req.query.symbol as string);
  if (!s) return res.status(400).json({ error: "Missing query param: s (or symbol)" });
  try {
    const url = `${BASE}/real-time/${encodeURIComponent(s)}?${qs(req.query)}`;
    const r2 = await fetch(url);
    if (!r2.ok) throw new Error(`real-time ${r2.status}`);
    const json = await r2.json();
    res.set("Content-Type","application/json; charset=utf-8").json({ raw: json, price: pickPrice(json) });
  } catch (e:any) { res.status(500).json({ error: e.message }); }
});
r.get("/eodhd/search", async (req, res) => {
  const q = (req.query.q as string) || (req.query.query as string);
  if (!q) return res.status(400).json({ error: "Missing query param: q" });
  try {
    const url = `${BASE}/search/${encodeURIComponent(q)}?${qs(req.query)}`;
    const r2 = await fetch(url);
    if (!r2.ok) throw new Error(`search ${r2.status}`);
    res.set("Content-Type","application/json; charset=utf-8").json(await r2.json());
  } catch (e:any) { res.status(500).json({ error: e.message }); }
});

// ---- OpenAI analysis (fixes prior TS errors; no 'stream' misuse)
r.post("/analysis", async (req, res) => {
  try {
    if (!process.env.OPENAI_API_KEY) return res.status(500).json({ error: "OPENAI_API_KEY not set" });
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const { text } = req.body || {};
    const messages = [{ role: "system", content: "Be concise. Analyze market impact from the provided economic/news text." },
                      { role: "user", content: String(text || "") }];
    const out = await openai.chat.completions.create({ model: "gpt-4o-mini", messages });
    res.json({ result: out.choices?.[0]?.message?.content ?? "" });
  } catch (e:any) { res.status(500).json({ error: e.message }); }
});

app.use("/api", r);
app.use("/", r);
export default serverless(app);
