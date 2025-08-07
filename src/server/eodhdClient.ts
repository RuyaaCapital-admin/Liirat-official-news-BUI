const BASE = "https://eodhd.com/api";
const key = process.env.EODHD_API_KEY;
if (!key) throw new Error("EODHD_API_KEY missing");

export async function eodFetch(
  path: string,
  q: Record<string, string | number | undefined> = {},
) {
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
