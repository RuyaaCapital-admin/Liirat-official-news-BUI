import { eodFetch } from "../../src/server/eodhdClient.ts";

export default async function handler(req: Request): Promise<Response> {
  const u = new URL(req.url);
  const from = u.searchParams.get("from");
  const to = u.searchParams.get("to");
  if (!from || !to)
    return new Response(JSON.stringify({ ok: false, code: "MISSING_RANGE" }), {
      status: 400,
    });

  const raw = await (
    await eodFetch(`/economic-events`, {
      from,
      to,
      country: u.searchParams.get("country") || undefined,
      type: u.searchParams.get("type") || undefined,
      limit: u.searchParams.get("limit") || "200",
    })
  ).json();

  if (!raw.ok) return new Response(JSON.stringify(raw), { status: 502 });

  const items = (raw.data || []).map((e: any) => ({
    datetimeUtc: e.date || e.datetime,
    country: e.country,
    event: e.event,
    category: e.category || e.type,
    importance: (e.importance || "").toLowerCase(),
    previous: e.previous ?? "",
    forecast: e.estimate ?? e.forecast ?? "",
    actual: e.actual ?? "",
  }));

  return new Response(JSON.stringify({ ok: true, items }), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "s-maxage=15, stale-while-revalidate=60",
    },
  });
}
