import type { VercelRequest, VercelResponse } from "@vercel/node";

type Quote = {
  code: string;
  price: number | null;
  change: number | null;
  changePercent: number | null;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Cache-Control", "no-store");

  const apiToken = process.env.EODHD_API_TOKEN;
  if (!apiToken) return res.status(500).json({ error: "EODHD_API_TOKEN missing" });

  const symbolsParam = (req.query.symbols as string | undefined)?.trim();
  if (!symbolsParam) return res.status(400).json({ error: "symbols required" });

  const symbols = symbolsParam.split(",").map(s => s.trim()).filter(Boolean).slice(0, 20);
  if (!symbols.length) return res.json([]);

  const [first, ...rest] = symbols;
  const base = `https://eodhd.com/api/real-time/${encodeURIComponent(first)}?api_token=${encodeURIComponent(apiToken)}&fmt=json`;
  const url = rest.length ? `${base}&s=${encodeURIComponent(rest.join(","))}` : base;

  try {
    const r = await fetch(url);
    const txt = await r.text();
    if (!r.ok) return res.status(502).json({ error: `Upstream ${r.status}`, body: txt.slice(0, 500) });

    const j: any = JSON.parse(txt);
    const arr: any[] =
      Array.isArray(j) ? j :
      (j && j.code) ? [j] :
      (j && Array.isArray(j.data)) ? j.data : [];

    const out: Quote[] = arr.map((q: any) => ({
      code: String(q.code ?? ""),
      price: q.close != null ? Number(q.close) : null,
      change: q.change != null ? Number(q.change) : null,
      changePercent: q.change_p != null ? Number(q.change_p) : null,
    })).filter(q => q.code);

    return res.json(out);
  } catch (e: any) {
    return res.status(502).json({ error: e?.message || "Fetch failed" });
  }
}
