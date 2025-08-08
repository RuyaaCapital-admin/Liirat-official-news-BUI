// Quotes data fetching utilities with EODHD API and NA value handling

// Watchlist with 15 symbols as requested
export const TICKERS = [
  // Crypto (.CC)
  "BTC-USD.CC", "ETH-USD.CC",
  // Forex (.FOREX)
  "EURUSD.FOREX", "GBPUSD.FOREX", "USDJPY.FOREX", "XAUUSD.FOREX",
  // Indices (.INDX)
  "GSPC.INDX", "DJI.INDX", "IXIC.INDX",
  // US leaders (.US)
  "AAPL.US", "MSFT.US", "NVDA.US", "TSLA.US", "GOOGL.US", "AMZN.US"
];

const asNum = (v:any)=> v==null || v==="NA" ? undefined : Number(v);
export function normalizeQuotes(payload:any){
  const rows:any[]=[]; const push=(r:any)=>{ const code=r?.code||r?.symbol||r?.ticker; if(!code) return;
    rows.push({ code,
      price: asNum(r.price??r.close??r.last??r.adjusted_close??r.c),
      change: asNum(r.change??r.d),
      changePercent: asNum(r.change_percent??r.dp)
    });
  };
  if (Array.isArray(payload)) payload.forEach(push);
  else if (payload && typeof payload==="object") { if (payload.code||payload.symbol) push(payload); else Object.values(payload).forEach(push); }
  return rows.filter(r=>Number.isFinite(r.price));
}

export async function getBatchQuotes(symbols:string[], opts:{signal?:AbortSignal}={}){
  const u = new URL("/api/eodhd/quotes", location.origin);
  u.searchParams.set("symbols", symbols.join(","));
  const r = await fetch(u.toString(), { signal: opts.signal });
  const ct = r.headers.get("content-type")||""; if (!ct.includes("application/json")) throw new Error("Non-JSON response");
  if (!r.ok) throw new Error("quotes");
  return normalizeQuotes(await r.json());
}

// Fetch single symbol quote
export async function getSingleQuote(symbol: string) {
  const u = new URL("/api/eodhd/price", location.origin);
  u.searchParams.set("s", symbol);
  
  const r = await fetch(u.toString());
  if (!r.ok) throw new Error(`Price API error: ${r.status}`);
  
  const data = await r.json();
  return normalizeQuotes([data])[0] || null;
}

// Format price with symbol-specific rules
export function formatPrice(price: number | undefined, symbol: string): string {
  if (price === undefined || price === null || isNaN(price)) {
    return "-.--";
  }
  
  // Symbol-specific formatting
  if (symbol.includes("JPY")) {
    return price.toFixed(3);
  } else if (symbol.includes("BTC") || symbol.includes("ETH")) {
    return price.toLocaleString("en-US", { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
  } else if (symbol.includes("XAU") || symbol.includes("XAG")) {
    return price.toFixed(2);
  } else if (symbol.includes(".US") || symbol.includes(".INDX")) {
    return price.toFixed(2);
  } else {
    return price.toFixed(5);
  }
}

// Format change percentage
export function formatChangePercent(changePercent: number | undefined): string {
  if (changePercent === undefined || changePercent === null || isNaN(changePercent)) {
    return "0.00%";
  }
  
  return `${changePercent > 0 ? "+" : ""}${changePercent.toFixed(2)}%`;
}

// Check if symbol exists in EODHD (for debugging)
export async function verifySymbol(symbol: string): Promise<boolean> {
  try {
    const quote = await getSingleQuote(symbol);
    return quote !== null && quote.price !== undefined;
  } catch (error) {
    console.warn(`Symbol verification failed for ${symbol}:`, error);
    return false;
  }
}
