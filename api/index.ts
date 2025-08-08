// Single serverless function proxy to EODHD (no hardcoding, token from env)
import express from 'express';
import serverless from 'serverless-http';

const app = express();
app.use(express.json());

const BASE = 'https://eodhd.com/api';

function qs(input: Record<string, any> = {}) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(input)) if (v !== undefined) p.append(k, String(v));
  const token = process.env.EODHD_API_TOKEN || '';
  if (!token) throw new Error('EODHD_API_TOKEN not set');
  p.set('api_token', token);
  p.set('fmt', 'json');
  return p.toString();
}

async function pass(path: string, q: any) {
  const url = `${BASE}${path}?${qs(q)}`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${path} ${r.status}`);
  return r.json();
}

const r = express.Router();

// health
r.get('/ping', (_req, res) => res.json({ ok: true, ts: Date.now() }));

// ---- EODHD official endpoints (no hardcode) ----
r.get('/eodhd/news', async (req, res) => {
  try { res.json(await pass('/news', req.query)); }
  catch (e:any) { res.status(500).json({ error: e.message }); }
});

r.get('/eodhd/calendar', async (req, res) => {
  try { res.json(await pass('/economic-events', req.query)); }
  catch (e:any) { res.status(500).json({ error: e.message }); }
});

r.get('/eodhd/price', async (req, res) => {
  const s = (req.query.s as string) || (req.query.symbol as string);
  if (!s) return res.status(400).json({ error: 'Missing query param: s (or symbol)' });
  try {
    const url = `${BASE}/real-time/${encodeURIComponent(s)}?${qs(req.query)}`;
    const r2 = await fetch(url);
    if (!r2.ok) throw new Error(`real-time ${r2.status}`);
    res.json(await r2.json());
  } catch (e:any) { res.status(500).json({ error: e.message }); }
});

r.get('/eodhd/search', async (req, res) => {
  const q = (req.query.q as string) || (req.query.query as string);
  if (!q) return res.status(400).json({ error: 'Missing query param: q' });
  try {
    const url = `${BASE}/search/${encodeURIComponent(q)}?${qs(req.query)}`;
    const r2 = await fetch(url);
    if (!r2.ok) throw new Error(`search ${r2.status}`);
    res.json(await r2.json());
  } catch (e:any) { res.status(500).json({ error: e.message }); }
});

// mount for both /api/* and /*
app.use('/api', r);
app.use('/', r);

export default serverless(app);
