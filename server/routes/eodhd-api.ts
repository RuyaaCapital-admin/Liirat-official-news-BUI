import { RequestHandler } from "express";
const BASE = 'https://eodhd.com/api';
const key = process.env.EODHD_API_KEY;

async function eodFetch(path: string, q: Record<string,string|number|undefined> = {}) {
  if (!key) throw new Error('EODHD_API_KEY missing');

  const u = new URL(BASE + path);
  Object.entries(q).forEach(([k,v]) => v!==undefined && u.searchParams.set(k, String(v)));
  u.searchParams.set('api_token', key);
  u.searchParams.set('fmt', 'json');
  const ac = new AbortController();
  const t = setTimeout(()=>ac.abort(), 3000);
  const res = await fetch(u.toString(), { signal: ac.signal, headers:{'Accept':'application/json; charset=utf-8'} });
  clearTimeout(t);
  if (!res.ok) {
    const detail = await res.text().catch(()=> '');
    return new Response(JSON.stringify({ok:false, code:'UPSTREAM_ERROR', detail}), { status: res.status, headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}});
  }
  const data = await res.json();
  return new Response(JSON.stringify({ok:true, data}), { status: 200, headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'s-maxage=15, stale-while-revalidate=60'}});
}

// Search endpoint
export const handleEODHDSearch: RequestHandler = async (req, res) => {
  const { q, limit, type } = req.query;
  if (!q) {
    return res.status(400).json({ok:false, code:'MISSING_Q'});
  }
  
  try {
    const response = await eodFetch(`/search/${encodeURIComponent(q as string)}`, { 
      limit: (limit as string) || '15', 
      type: (type as string) || 'all' 
    });
    
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(500).json({ok:false, code:'INTERNAL_ERROR', detail: error instanceof Error ? error.message : 'Unknown error'});
  }
};

// Price endpoint  
export const handleEODHDPrice: RequestHandler = async (req, res) => {
  const { symbols } = req.query;
  const symbolList = (symbols as string || '').split(',').map(s=>s.trim()).filter(Boolean);
  
  if (!symbolList.length) {
    return res.status(400).json({ok:false, code:'MISSING_SYMBOLS'});
  }
  
  try {
    const base = symbolList[0].toUpperCase();
    const response = await eodFetch(`/real-time/${encodeURIComponent(base)}`, { 
      s: symbolList.slice(1).join(',') 
    });
    
    const r = await response.json();
    if (!r.ok) {
      return res.status(502).json(r);
    }
    
    const arr = Array.isArray(r.data) ? r.data : [r.data];
    const out = arr.map((x:any)=>({ 
      symbol:x.code||x.symbol, 
      price:+(x.close??x.price), 
      change:+(x.change??0), 
      changePct:+(x.change_p??x.change_percent??0), 
      ts:+(x.timestamp??x.ts??0)
    }));
    
    res.status(200).json({ok:true, items:out});
  } catch (error) {
    res.status(500).json({ok:false, code:'INTERNAL_ERROR', detail: error instanceof Error ? error.message : 'Unknown error'});
  }
};

// Calendar endpoint
export const handleEODHDCalendar: RequestHandler = async (req, res) => {
  const { from, to, country, type, limit } = req.query;
  
  if (!from || !to) {
    return res.status(400).json({ok:false, code:'MISSING_RANGE'});
  }
  
  try {
    const response = await eodFetch(`/economic-events`, { 
      from: from as string, 
      to: to as string, 
      country: country as string || undefined, 
      type: type as string || undefined, 
      limit: (limit as string) || '200'
    });
    
    const raw = await response.json();
    if (!raw.ok) {
      return res.status(502).json(raw);
    }
    
    const items = (raw.data||[]).map((e:any)=>({
      datetimeUtc: e.date || e.datetime, 
      country: e.country, 
      event: e.event, 
      category: e.category || e.type,
      importance: (e.importance||'').toLowerCase(), 
      previous: e.previous??'', 
      forecast: e.estimate??e.forecast??'', 
      actual: e.actual??''
    }));
    
    res.status(200).json({ok:true, items});
  } catch (error) {
    res.status(500).json({ok:false, code:'INTERNAL_ERROR', detail: error instanceof Error ? error.message : 'Unknown error'});
  }
};

// News endpoint
export const handleEODHDNews: RequestHandler = async (req, res) => {
  const { s, t, from, to, limit, offset } = req.query;
  
  if (!s && !t) {
    return res.status(400).json({ok:false, code:'MISSING_S_OR_T'});
  }
  
  try {
    const response = await eodFetch(`/news`, { 
      s: s as string || undefined, 
      t: t as string || undefined, 
      from: from as string || undefined, 
      to: to as string || undefined, 
      limit: (limit as string) || '50', 
      offset: (offset as string) || '0' 
    });
    
    const raw = await response.json();
    if (!raw.ok) {
      return res.status(502).json(raw);
    }
    
    const items = (raw.data||raw).map((n:any)=>({ 
      datetime:n.date, 
      title:n.title, 
      source:(n.source||'').toString(), 
      symbols:n.symbols||[], 
      url:n.link||n.url||'' 
    }));
    
    res.status(200).json({ok:true, items});
  } catch (error) {
    res.status(500).json({ok:false, code:'INTERNAL_ERROR', detail: error instanceof Error ? error.message : 'Unknown error'});
  }
};

// Ping endpoint
export const handleEODHDPing: RequestHandler = async (req, res) => {
  try {
    const testResponse = await eodFetch('/real-time/AAPL.US');
    const result = await testResponse.json();
    
    res.status(200).json({
      ok: true, 
      status: 'EODHD API connection successful',
      test: result.ok ? 'API key valid' : 'API key test failed'
    });
  } catch (error) {
    res.status(500).json({
      ok: false, 
      code: 'CONNECTION_ERROR',
      detail: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
