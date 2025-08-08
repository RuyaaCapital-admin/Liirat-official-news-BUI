const asNum = (v: any) => (v == null || v === "NA" ? undefined : Number(v));
export function normalizeQuotes(payload: any) {
  const out: any[] = [];
  const push = (r: any) => {
    const code = r?.code || r?.symbol || r?.ticker;
    if (!code) return;

    out.push({
      code,
      price: asNum(r.price ?? r.close ?? r.last ?? r.adjusted_close ?? r.c),
      change: asNum(r.change ?? r.d ?? r.changePct),
      changePercent: asNum(
        r.change_percent ?? r.dp ?? r.changePct ?? r.changePct,
      ),
    });
  };

  if (Array.isArray(payload)) {
    payload.forEach(push);
  } else if (payload && typeof payload === "object") {
    if (payload.code || payload.symbol) {
      push(payload);
    } else {
      Object.values(payload).forEach(push);
    }
  }

  return out.filter((r) => Number.isFinite(r.price));
}
export async function getBatchQuotes(
  symbols: string[],
  opts: { signal?: AbortSignal } = {},
) {
  const u = new URL("/api/eodhd/price", location.origin);
  u.searchParams.set("symbols", symbols.join(","));

  const r = await fetch(u.toString(), { signal: opts.signal });
  const ct = r.headers.get("content-type") || "";

  if (!r.ok) {
    const errorText = await r.text();
    throw new Error(`quotes ${r.status}: ${errorText}`);
  }

  if (!ct.includes("application/json")) {
    const responseText = await r.text();
    throw new Error(
      `Non-JSON response: ${ct}. Body: ${responseText.slice(0, 200)}`,
    );
  }

  const data = await r.json();

  // Handle the server response format: { ok: true, items: [...] }
  if (data.ok && data.items) {
    return normalizeQuotes(data.items);
  } else {
    // Fallback to raw data
    return normalizeQuotes(data);
  }
}
