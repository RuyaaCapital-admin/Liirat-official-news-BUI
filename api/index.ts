import express from "express";
import serverless from "serverless-http";
import OpenAI from "openai";

const BASE = "https://eodhd.com/api";

// --- helpers ---
function qs(input: Record<string, any> = {}) {
  const token = process.env.EODHD_API_KEY || process.env.EODHD_API_TOKEN || "";
  if (!token) throw new Error("EODHD_API_KEY not set");
  const p = new URLSearchParams();
  p.set("api_token", token);
  p.set("fmt", "json");
  for (const [k, v] of Object.entries(input)) if (v !== undefined && v !== null && v !== "") p.set(k, String(v));
  return p.toString();
}
async function pass(path: string, query: Record<string, any> = {}) {
  const r = await fetch(`${BASE}${path}?${qs(query)}`, { headers: { Accept: "application/json; charset=utf-8" } });
  if (!r.ok) throw new Error(`${path} ${r.status}`);
  return r.json();
}

const app = express();
const r = express.Router();
app.use(express.json());
app.use((req,res,next)=>{res.header("Access-Control-Allow-Origin","*");res.header("Access-Control-Allow-Methods","GET,POST,OPTIONS");res.header("Access-Control-Allow-Headers","Content-Type,Authorization");if(req.method==="OPTIONS")return res.sendStatus(200);next();});

// ===== Canonical =====
r.get("/eodhd/calendar", async (req,res)=>{ try{
  const { from, to, countries = "", limit = "200" } = req.query as any;
  if(!from || !to) return res.status(400).json({ error:"from and to required" });
  res.json(await pass("/economic-events",{ from, to, countries, limit }));
}catch(e:any){ res.status(500).json({ error:e.message }); }});

r.get("/eodhd/news", async (req,res)=>{ try{
  const q=req.query as any; const t=q.t ?? q.at ?? ""; const s=q.s ?? ""; const { limit="50", offset="0" } = q;
  if(!s && !t) return res.status(400).json({ error:"s or t required" });
  res.json(await pass("/news",{ s, t, limit, offset }));
}catch(e:any){ res.status(500).json({ error:e.message }); }});

r.get("/eodhd/price", async (req,res)=>{ try{
  const s=String((req.query as any).s||""); if(!s) return res.status(400).json({ error:"s required" });
  res.json(await pass(`/real-time/${encodeURIComponent(s)}`));
}catch(e:any){ res.status(500).json({ error:e.message }); }});

// multi-symbol with upstream error passthrough
r.get("/eodhd/quotes", async (req,res)=>{ try{
  const list=String((req.query as any).symbols||"").split(",").map(s=>s.trim()).filter(Boolean);
  if(!list.length) return res.status(400).json({ error:"symbols required" });
  const [first,...rest]=list;
  const url=new URL(`${BASE}/real-time/${encodeURIComponent(first)}`); url.search=qs(rest.length?{ s:rest.join(",") }:{});
  const rr=await fetch(url.toString(),{ headers:{ Accept:"application/json" } }); const txt=await rr.text();
  if(!rr.ok) return res.status(rr.status).set("Content-Type", rr.headers.get("content-type")||"text/plain; charset=utf-8").send(txt);
  try { return res.json(JSON.parse(txt)); } catch { return res.status(502).json({ error:"Invalid JSON from EODHD", body: txt.slice(0,200) }); }
}catch(e:any){ res.status(500).json({ error:e.message }); }});

r.get("/eodhd/ping", async (_req,res)=>{ try{ res.json({ status:"OK", test: await pass("/real-time/AAPL.US") }); }catch(e:any){ res.status(500).json({ error:e.message }); }});

// ===== Back-compat (OLD frontend URLs) =====
r.get("/price", (req,res)=> r.handle({ ...req, url:"/api/eodhd/price" } as any, res as any));
r.get("/quotes", (req,res)=> r.handle({ ...req, url:"/api/eodhd/quotes" } as any, res as any));
r.get("/calendar", (req,res)=> r.handle({ ...req, url:"/api/eodhd/calendar" } as any, res as any));
r.get("/news",    (req,res)=> { if((req.query as any).at && !(req.query as any).t) (req.query as any).t=(req.query as any).at; return r.handle({ ...req, url:"/api/eodhd/news" } as any, res as any); });

app.use("/api", r);
app.get("/", (_req,res)=> res.json({ message:"Liirat News API", version:"2.2" }));
export default serverless(app);
