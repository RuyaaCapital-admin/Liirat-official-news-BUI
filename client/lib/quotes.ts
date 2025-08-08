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
      changePercent: asNum(
        r.change_p ?? r.change_percent ?? r.dp ?? r.changePct,
      ),
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
  opts: { signal?: AbortSignal } = {},
) {
  console.log(`📊 Fetching batch quotes for: ${symbols.join(", ")}`);

  // Use the correct EODHD price endpoint
  const url = `/api/eodhd/price?symbols=${encodeURIComponent(symbols.join(","))}`;

  try {
    const r = await fetch(url, {
      signal: opts.signal,
      cache: "no-store",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    if (!r.ok) {
      const errorText = await r.text().catch(() => "Unknown error");
      console.error(`❌ Quotes API error ${r.status}: ${errorText}`);

      // Enhanced error handling for different scenarios
      if (r.status === 500) {
        if (errorText.includes("EODHD_API_KEY")) {
          throw new Error(
            "API configuration error - EODHD API key not properly configured",
          );
        } else if (errorText.includes("timeout")) {
          throw new Error("Request timeout - Please try again");
        } else {
          throw new Error("Server error - Please try again later");
        }
      } else if (r.status === 401) {
        throw new Error("API authentication failed - Invalid API key");
      } else if (r.status === 429) {
        throw new Error("Rate limit exceeded - Please wait before retrying");
      }

      throw new Error(`quotes HTTP ${r.status}: ${errorText}`);
    }

    const data = await r.json();
    console.log(`✅ Received quotes data:`, data);

    // Handle different response formats from EODHD
    if (data.error) {
      console.error(`❌ API returned error:`, data.error);
      throw new Error(data.error || "API error");
    }

    // For EODHD API, check if we have the expected structure
    let quotesData = data;
    if (data.ok === false) {
      console.error(`❌ API returned error:`, data);
      throw new Error(data.detail || data.error || "API error");
    }

    // Handle different response structures
    if (data.items) {
      quotesData = data.items;
    } else if (data.data) {
      quotesData = data.data;
    } else if (Array.isArray(data)) {
      quotesData = data;
    }

    const normalized = normalizeQuotes(quotesData);
    console.log(`📈 Normalized ${normalized.length} quotes`);

    return normalized;
  } catch (error) {
    console.error(`❌ getBatchQuotes error:`, error);

    // Provide more user-friendly error messages
    if (error instanceof Error) {
      if (error.message.includes("API configuration error")) {
        throw new Error("API configuration issue - Please check your settings");
      } else if (error.message.includes("AbortError")) {
        throw new Error("Request cancelled");
      } else if (error.message.includes("NetworkError")) {
        throw new Error(
          "Network connection error - Please check your internet",
        );
      }
    }

    throw error;
  }
}
