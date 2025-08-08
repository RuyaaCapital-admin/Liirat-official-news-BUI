import { eodFetch } from "../../src/server/eodhdClient.ts";

export default async function handler(req: Request): Promise<Response> {
  const u = new URL(req.url);
  const symbols = (u.searchParams.get("symbols") || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (!symbols.length)
    return new Response(
      JSON.stringify({ ok: false, code: "MISSING_SYMBOLS" }),
      { status: 400 },
    );

  const base = symbols[0].toUpperCase();
  const r = await (
    await eodFetch(`/real-time/${encodeURIComponent(base)}`, {
      s: symbols.slice(1).join(","),
    })
  ).json();

  if (!r.ok) return new Response(JSON.stringify(r), { status: 502 });

  const arr = Array.isArray(r.data) ? r.data : [r.data];
  const out = arr.map((x: any) => ({
    symbol: x.code || x.symbol,
    price: +(x.close ?? x.price),
    change: +(x.change ?? 0),
    changePct: +(x.change_p ?? x.change_percent ?? 0),
    ts: +(x.timestamp ?? x.ts ?? 0),
  }));

  return new Response(JSON.stringify({ ok: true, items: out }), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "s-maxage=15, stale-while-revalidate=60",
    },
  });
}
