const asNum = (v: any) => (v == null || v === "NA" ? undefined : Number(v));

export function normalizeQuotes(payload: any) {
  const out: any[] = [];
  const push = (r: any) => {
    const code = r?.code || r?.symbol || r?.ticker;
    if (!code) return;
    out.push({
      code,
      // EODHD -> close, change, change_p
      price: asNum(r.price ?? r.close ?? r.last ?? r.adjusted_close ?? r.c),
      change: asNum(r.change ?? r.d ?? r.changePct),
      changePercent: asNum(r.change_p ?? r.change_percent ?? r.dp ?? r.changePct),
    });
  };
  if (Array.isArray(payload)) payload.forEach(push);
  else if (payload && typeof payload === "object") {
    if (payload.code || payload.symbol) push(payload);
    else Object.values(payload).forEach(push);
  }
  return out.filter((r) => Number.isFinite(r.price));
}

export async function getBatchQuotes(
  symbols: string[],
  opts: { signal?: AbortSignal } = {}
) {
  // MUST hit your Express route, not /price
  const url = `/api/eodhd/quotes?symbols=${encodeURIComponent(symbols.join(","))}`;
  const r = await fetch(url, { signal: opts.signal, cache: "no-store" });
  if (!r.ok) throw new Error(`quotes HTTP ${r.status}`);
  const data = await r.json();
  return normalizeQuotes(data?.items ?? data);
}
