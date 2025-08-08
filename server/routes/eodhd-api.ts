import { RequestHandler } from "express";
import { toIsoUtc } from "../../src/server/date";
const BASE = "https://eodhd.com/api";

async function eodFetch(
  path: string,
  q: Record<string, string | number | undefined> = {},
) {
  const key = process.env.EODHD_API_KEY;
  if (!key) throw new Error("EODHD_API_KEY missing");

  const u = new URL(BASE + path);
  Object.entries(q).forEach(
    ([k, v]) => v !== undefined && u.searchParams.set(k, String(v)),
  );
  u.searchParams.set("api_token", key);
  u.searchParams.set("fmt", "json");
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), 3000);
  const res = await fetch(u.toString(), {
    signal: ac.signal,
    headers: { Accept: "application/json; charset=utf-8" },
  });
  clearTimeout(t);
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    return new Response(
      JSON.stringify({ ok: false, code: "UPSTREAM_ERROR", detail }),
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
  return new Response(JSON.stringify({ ok: true, data }), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "s-maxage=15, stale-while-revalidate=60",
    },
  });
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

// Price endpoint
export const handleEODHDPrice: RequestHandler = async (req, res) => {
  const { symbols } = req.query;
  const symbolList = ((symbols as string) || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (!symbolList.length) {
    return res.status(400).json({ ok: false, code: "MISSING_SYMBOLS" });
  }

  try {
    // Fetch each symbol individually to ensure reliability
    const results = [];

    for (const symbol of symbolList) {
      try {
        const response = await eodFetch(
          `/real-time/${encodeURIComponent(symbol.toUpperCase())}`,
        );
        const r = await response.json();

        if (r.ok && r.data) {
          const item = r.data;

          // Handle cases where EODHD returns "NA" for current data
          const close =
            item.close === "NA" || item.close === null
              ? item.previousClose
              : item.close;
          const change =
            item.change === "NA" || item.change === null ? 0 : item.change;
          const changePct =
            item.change_p === "NA" || item.change_p === null
              ? 0
              : item.change_p;
          const timestamp =
            item.timestamp === "NA" || item.timestamp === null
              ? Date.now()
              : item.timestamp;

          const priceData = {
            symbol: symbol,
            price: +(close ?? item.price ?? 0),
            change: +(change ?? 0),
            changePct: +(changePct ?? 0),
            ts: +(timestamp ?? Date.now()),
          };
          results.push(priceData);
        } else {
          // Add placeholder for failed symbols
          results.push({
            symbol: symbol,
            price: 0,
            change: 0,
            changePct: 0,
            ts: Date.now(),
          });
        }
      } catch (symbolError) {
        console.warn(`Failed to fetch ${symbol}:`, symbolError);
        // Add placeholder for failed symbols
        results.push({
          symbol: symbol,
          price: 0,
          change: 0,
          changePct: 0,
          ts: Date.now(),
        });
      }
    }

    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.status(200).json({ ok: true, items: results });
  } catch (error) {
    res.status(500).json({
      ok: false,
      code: "INTERNAL_ERROR",
      detail: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Calendar endpoint
export const handleEODHDCalendar: RequestHandler = async (req, res) => {
  const { from, to, country, type, limit } = req.query;

  if (!from || !to) {
    return res.status(400).json({ ok: false, code: "MISSING_RANGE" });
  }

  try {
    const response = await eodFetch(`/economic-events`, {
      from: from as string,
      to: to as string,
      country: (country as string) || undefined,
      type: (type as string) || undefined,
      limit: (limit as string) || "200",
    });

    const raw = await response.json();
    if (!raw.ok) {
      return res.status(502).json(raw);
    }

    const items = (raw.data || raw || []).map((e: any) => ({
      datetimeIso: toIsoUtc(e.date || e.datetime),
      country: e.country || "",
      event: e.event || "",
      category: e.category || e.type || "",
      importance: String(e.importance || "").toLowerCase(),
      previous: e.previous ?? "",
      forecast: e.estimate ?? e.forecast ?? "",
      actual: e.actual ?? "",
    }));

    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.status(200).json({ ok: true, items });
  } catch (error) {
    res.status(500).json({
      ok: false,
      code: "INTERNAL_ERROR",
      detail: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// News endpoint
export const handleEODHDNews: RequestHandler = async (req, res) => {
  const { s, t, from, to, limit, offset } = req.query;

  if (!s && !t) {
    return res.status(400).json({ ok: false, code: "MISSING_S_OR_T" });
  }

  try {
    const response = await eodFetch(`/news`, {
      s: (s as string) || undefined,
      t: (t as string) || undefined,
      from: (from as string) || undefined,
      to: (to as string) || undefined,
      limit: (limit as string) || "50",
      offset: (offset as string) || "0",
    });

    const raw = await response.json();
    if (!raw.ok) {
      return res.status(502).json(raw);
    }

    const items = (raw.data || raw).map((n: any) => ({
      datetimeIso: toIsoUtc(n.date || n.datetime || n.published_at || n.time),
      title: String(n.title || ""),
      content: String(n.content || n.description || n.title || ""),
      source: String(n.source || ""),
      symbols: n.symbols || [],
      tags: n.tags || n.symbols || [],
      url: n.link || n.url || "",
      country: n.country || "",
      category: n.category || "financial",
    }));

    res.status(200).json({ ok: true, items });
  } catch (error) {
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
