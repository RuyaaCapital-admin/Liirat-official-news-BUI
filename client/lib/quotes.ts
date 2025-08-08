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

// Safely convert values, handling "NA" and invalid data
const asNum = (v: any): number | undefined => {
  if (v === undefined || v === null || v === "NA" || v === "") return undefined;
  const num = Number(v);
  return isNaN(num) ? undefined : num;
};

// Normalize EODHD quotes response
export function normalizeQuotes(payload: any) {
  const push = (row: any) => {
    const code = row?.code || row?.symbol || row?.ticker;
    if (!code) return;
    
    out.push({
      code,
      price: asNum(row.price ?? row.close ?? row.last ?? row.adjusted_close ?? row.c),
      change: asNum(row.change ?? row.d),
      changePercent: asNum(row.change_percent ?? row.dp ?? row.change_p)
    });
  };
  
  const out: any[] = [];
  
  if (Array.isArray(payload)) {
    payload.forEach(push);
  } else if (payload && typeof payload === "object") {
    // Single object response
    if (payload.code || payload.symbol) {
      push(payload);
    } else {
      // Object with multiple symbols as properties
      Object.values(payload).forEach(push);
    }
  }
  
  return out;
}

// Fetch batch quotes using multi-symbol API
export async function getBatchQuotes(symbols: string[], opts: {signal?: AbortSignal} = {}) {
  const u = new URL("/api/eodhd/quotes", location.origin);
  u.searchParams.set("symbols", symbols.join(","));

  const r = await fetch(u.toString(), { signal: opts.signal });
  if (!r.ok) throw new Error("quotes");

  const data = await r.json();
  return normalizeQuotes(data);
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
