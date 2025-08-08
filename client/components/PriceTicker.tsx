import { useEffect, useRef, useState } from "react";
import { getBatchQuotes } from "@/lib/quotes";
import { TICKERS } from "@/lib/watchlist";
import { cn } from "@/lib/utils";
import "@/styles/ticker.css";

const POLL_MS = 15000; // Slower polling

export default function PriceTicker() {
  const [items, setItems] = useState<any[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<number | null>(null);
  const inFlight = useRef<AbortController | null>(null);

  const load = async (showLoader = false) => {
    // cancel older request
    inFlight.current?.abort("superseded");
    const ctrl = new AbortController();
    inFlight.current = ctrl;

    if (showLoader) setInitialLoading(true);
    setError(null);

    try {
      console.log(`🔄 Loading real-time prices for ${TICKERS.length} symbols`);
      const data = await getBatchQuotes(TICKERS, { signal: ctrl.signal });
      if (inFlight.current !== ctrl) return; // superseded

      const validData = Array.isArray(data)
        ? data.filter((item) => item && item.price > 0)
        : [];
      console.log(
        `✅ Loaded ${validData.length}/${TICKERS.length} valid prices`,
      );

      setItems(validData);

      // Clear error if we got some data
      if (validData.length > 0) {
        setError(null);
      } else if (validData.length === 0 && data.length > 0) {
        setError("No valid price data received");
      }
    } catch (e: any) {
      if (e?.name === "AbortError") return; // ignore cancels
      console.error("❌ Price ticker error:", e);

      // Provide more specific error messages
      let errorMessage = "Failed to load real-time prices";
      if (e?.message?.includes("API configuration")) {
        errorMessage = "API configuration issue - Please refresh the page";
      } else if (e?.message?.includes("EODHD_API_KEY")) {
        errorMessage = "API key configuration error";
      } else if (e?.message?.includes("authentication failed")) {
        errorMessage = "API authentication failed";
      } else if (e?.message?.includes("Rate limit")) {
        errorMessage = "Rate limit exceeded - Data will refresh shortly";
      } else if (e?.message?.includes("timeout")) {
        errorMessage = "Request timeout - Retrying...";
      } else if (e?.message?.includes("Network")) {
        errorMessage = "Network error - Please check your connection";
      } else if (e?.message) {
        errorMessage = e.message;
      }

      setError(errorMessage);
    } finally {
      if (inFlight.current === ctrl && showLoader) setInitialLoading(false);
    }
  };

  useEffect(() => {
    // initial fetch
    load(true);

    // polling (no spinner on polls)
    timer.current = window.setInterval(() => load(false), POLL_MS);

    const onVis = () => {
      if (document.hidden) {
        if (timer.current) {
          clearInterval(timer.current);
          timer.current = null;
        }
        inFlight.current?.abort("hidden");
      } else {
        load(false);
        if (!timer.current)
          timer.current = window.setInterval(() => load(false), POLL_MS);
      }
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      if (timer.current) clearInterval(timer.current);
      inFlight.current?.abort("unmount");
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  const renderItem = (q: any) => {
    const price = q.price || q.close || 0;
    const change = q.change || 0;
    const changePercent = q.changePercent || q.changePct || q.change_p || 0;
    const symbol = q.code || q.symbol || "N/A";

    return (
      <div
        key={q.key || symbol}
        className="flex items-center gap-2 sm:gap-3 min-w-max text-sm sm:text-base px-4"
      >
        <span className="font-semibold text-foreground tracking-wide">
          {symbol}
        </span>
        <strong className="text-foreground font-mono text-lg">
          {price > 0
            ? price.toLocaleString(undefined, {
                minimumFractionDigits: price < 1 ? 4 : 2,
                maximumFractionDigits: price < 1 ? 6 : 2,
              })
            : "---"}
        </strong>
        <span
          className={cn(
            "text-sm font-mono font-medium",
            change >= 0 ? "text-green-500" : "text-red-500",
          )}
        >
          {change !== undefined && change !== null
            ? (change >= 0 ? "+" : "") + change.toFixed(price < 1 ? 4 : 2)
            : "---"}
          {changePercent !== undefined && changePercent !== null && (
            <span className="hidden sm:inline ml-1">
              ({(changePercent >= 0 ? "+" : "") + changePercent.toFixed(2)}%)
            </span>
          )}
        </span>
        {q.error && (
          <span className="text-xs text-orange-500" title={q.error}>
            ⚠️
          </span>
        )}
      </div>
    );
  };

  if (initialLoading) {
    return (
      <div className="ticker-wrap bg-background/95 backdrop-blur-sm border-b border-border/50 sticky top-0 z-40">
        <div className="ticker-track">
          <div className="flex items-center gap-4 text-muted-foreground">
            <span>Loading market data...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!items.length && !error) return null;

  return (
    <div className="ticker-wrap bg-background/95 backdrop-blur-sm border-b border-border/50 sticky top-0 z-40">
      <div className="ticker-track">
        {items.map((q, i) => renderItem({ ...q, key: `first-${i}` }))}
        {items.map((q, i) => renderItem({ ...q, key: `second-${i}` }))}
      </div>
      {error && (
        <div className="absolute top-0 right-4 text-xs text-red-500 py-1">
          {error}
        </div>
      )}
    </div>
  );
}
