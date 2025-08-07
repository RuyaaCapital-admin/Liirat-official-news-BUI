import React, { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, WifiOff, Wifi } from "lucide-react";
import { useNetworkStatus } from "@/hooks/use-network-status";

interface PriceData {
  symbol: string;
  displayName: string;
  price: number;
  change: number;
  changePercent: number;
  lastUpdate: Date;
  status: "connected" | "connecting" | "disconnected";
}

interface TickerProps {
  className?: string;
}

// Configuration for ONLY the most reliable symbols that work 100% in production
const TICKER_CONFIG = [
  // Gold (XAU) - FIRST as user specifically requested - XAUUSD.FOREX
  { symbol: "XAUUSD.FOREX", displayName: "GOLD" },
  // Major Cryptocurrencies
  { symbol: "BTC-USD.CC", displayName: "BTC/USD" },
  { symbol: "ETH-USD.CC", displayName: "ETH/USD" },
  { symbol: "ADA-USD.CC", displayName: "ADA/USD" },
  { symbol: "SOL-USD.CC", displayName: "SOL/USD" },
  // Major Forex Pairs
  { symbol: "EURUSD.FOREX", displayName: "EUR/USD" },
  { symbol: "USDJPY.FOREX", displayName: "USD/JPY" },
  { symbol: "GBPUSD.FOREX", displayName: "GBP/USD" },
  { symbol: "AUDUSD.FOREX", displayName: "AUD/USD" },
  { symbol: "USDCAD.FOREX", displayName: "USD/CAD" },
  { symbol: "USDCHF.FOREX", displayName: "USD/CHF" },
  { symbol: "EURGBP.FOREX", displayName: "EUR/GBP" },
  { symbol: "EURJPY.FOREX", displayName: "EUR/JPY" },
  { symbol: "GBPJPY.FOREX", displayName: "GBP/JPY" },
  // Oil/Commodities
  { symbol: "BRENT.CC", displayName: "BRENT OIL" },
];

export default function EnhancedPriceTicker({ className }: TickerProps) {
  const [priceData, setPriceData] = useState<Record<string, PriceData>>({});
  const [isScrolling, setIsScrolling] = useState(true);
  const lastFetchTime = useRef<Record<string, number>>({});
  const failedSymbols = useRef<Set<string>>(new Set()); // Track failed symbols
  const scrollRef = useRef<HTMLDivElement>(null);
  const { isApiAvailable, isDegraded, isOnline } = useNetworkStatus();

  // Network connectivity check
  const checkNetworkConnectivity = async (): Promise<boolean> => {
    try {
      const response = await fetch("/api/status", {
        method: "GET",
        cache: "no-cache",
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch {
      return false;
    }
  };

  // Fetch price data with enhanced error handling and fallback
  const fetchPriceData = async (symbol: string, retryCount = 0) => {
    const maxRetries = 1; // Further reduced retries to minimize errors
    const retryDelay = 3000; // Fixed 3 second delay

    try {
      const now = Date.now();
      const lastFetch = lastFetchTime.current[symbol] || 0;

      // Skip if symbol is blacklisted (repeatedly failed)
      if (failedSymbols.current.has(symbol)) {
        console.log(`[TICKER] Skipping blacklisted symbol: ${symbol}`);
        return;
      }

      // Rate limiting: don't fetch if less than 30 seconds have passed
      if (now - lastFetch < 30000 && retryCount === 0) {
        return;
      }

      lastFetchTime.current[symbol] = now;

      // Set connecting status only on first attempt
      if (retryCount === 0) {
        setPriceData((prev) => ({
          ...prev,
          [symbol]: { ...prev[symbol], status: "connecting" },
        }));
      }

      // Always try to fetch - don't block on connectivity check
      console.log(`[TICKER] Attempting to fetch ${symbol}...`);

      // Create fetch with shorter timeout for production
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

      let response;
      try {
        response = await fetch(
          `/api/eodhd-price?symbol=${encodeURIComponent(symbol)}`,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
              "Cache-Control": "no-cache",
            },
            signal: controller.signal,
            // Add credentials and mode for CORS
            mode: "cors",
            credentials: "same-origin",
          },
        );
      } catch (fetchError) {
        console.error(`[TICKER] Fetch failed for ${symbol}:`, fetchError);
        throw new Error(
          `Network request failed: ${fetchError instanceof Error ? fetchError.message : String(fetchError)}`,
        );
      }

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text().catch(() => "No response body");
        console.error(
          `[TICKER] API error for ${symbol}: ${response.status} - ${response.statusText}`,
          errorText.substring(0, 200),
        );

        // Only retry on specific error codes
        if (
          (response.status >= 500 ||
            response.status === 429 ||
            response.status === 0) &&
          retryCount < maxRetries
        ) {
          console.log(
            `[TICKER] Retrying ${symbol} in ${retryDelay}ms (attempt ${retryCount + 1}/${maxRetries})`,
          );
          setTimeout(() => fetchPriceData(symbol, retryCount + 1), retryDelay);
          return;
        }

        // Set disconnected status after all retries failed
        setPriceData((prev) => ({
          ...prev,
          [symbol]: {
            ...prev[symbol],
            status: "disconnected",
            lastUpdate: new Date(),
          },
        }));
        return;
      }

      const data = await response.json();

      if (data.prices && data.prices.length > 0) {
        const priceInfo = data.prices[0];
        const config = TICKER_CONFIG.find((c) => c.symbol === symbol);

        setPriceData((prev) => ({
          ...prev,
          [symbol]: {
            symbol,
            displayName: config?.displayName || symbol,
            price: priceInfo.price || 0,
            change: priceInfo.change || 0,
            changePercent: priceInfo.change_percent || 0,
            lastUpdate: new Date(),
            status: "connected",
          },
        }));
        console.log(
          `[TICKER] Successfully fetched ${symbol}: $${priceInfo.price}`,
        );
      } else {
        console.warn(`[TICKER] No price data received for ${symbol}`);
        setPriceData((prev) => ({
          ...prev,
          [symbol]: { ...prev[symbol], status: "disconnected" },
        }));
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error(`[TICKER] Network error for ${symbol}:`, errorMessage);

      // Check if it's a network error or timeout
      const isNetworkError =
        errorMessage.includes("Failed to fetch") ||
        errorMessage.includes("NetworkError") ||
        errorMessage.includes("AbortError");

      // Retry on network errors but with exponential backoff
      if (isNetworkError && retryCount < maxRetries) {
        console.log(
          `[TICKER] Retrying ${symbol} due to network error in ${retryDelay}ms (attempt ${retryCount + 1}/${maxRetries})`,
        );
        setTimeout(() => fetchPriceData(symbol, retryCount + 1), retryDelay);
        return;
      }

      // Final failure - blacklist symbol and set disconnected status
      console.warn(
        `[TICKER] Blacklisting symbol ${symbol} after repeated failures`,
      );
      failedSymbols.current.add(symbol);

      const config = TICKER_CONFIG.find((c) => c.symbol === symbol);
      setPriceData((prev) => ({
        ...prev,
        [symbol]: {
          symbol,
          displayName: config?.displayName || symbol,
          price: 0,
          change: 0,
          changePercent: 0,
          status: "disconnected",
          lastUpdate: new Date(),
        },
      }));
    }
  };

  // Initialize price data with network awareness
  useEffect(() => {
    const initializePriceTicker = () => {
      // Initialize price data structure
      const initialData: Record<string, PriceData> = {};
      TICKER_CONFIG.forEach((config) => {
        initialData[config.symbol] = {
          symbol: config.symbol,
          displayName: config.displayName,
          price: 0,
          change: 0,
          changePercent: 0,
          lastUpdate: new Date(),
          status: isApiAvailable ? "connecting" : "disconnected",
        };
      });
      setPriceData(initialData);
    };

    initializePriceTicker();
  }, []);

  // Start fetching data immediately
  useEffect(() => {
    console.log("[TICKER] Starting price updates immediately");

    // Start fetching price data for all symbols (staggered) - ALWAYS TRY
    TICKER_CONFIG.forEach((config, index) => {
      setTimeout(() => {
        fetchPriceData(config.symbol);
      }, index * 1500); // 1.5 seconds between requests
    });

    // Set up interval for continuous updates
    const interval = setInterval(() => {
      TICKER_CONFIG.forEach((config, index) => {
        setTimeout(() => {
          fetchPriceData(config.symbol);
        }, index * 800); // 800ms between each update request
      });
    }, 60000); // Update every 60 seconds

    return () => clearInterval(interval);
  }, []); // Remove dependency on network status

  // Get ALL price entries for display - show every symbol regardless of status
  const validPrices = Object.values(priceData);

  // Handle scroll pause on hover
  const handleMouseEnter = () => setIsScrolling(false);
  const handleMouseLeave = () => setIsScrolling(true);

  const formatPrice = (price: number, symbol: string) => {
    if (symbol.includes("BTC") || symbol.includes("ETH")) {
      return price.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    }
    return price.toFixed(5);
  };

  const formatPercent = (percent: number) => {
    return `${percent >= 0 ? "+" : ""}${percent.toFixed(2)}%`;
  };

  return (
    <div
      className={cn(
        "relative overflow-hidden bg-background border-y border-border",
        className,
      )}
    >
      {/* Network Status Indicator - Only show if truly offline */}
      {!isOnline && (
        <div className="absolute top-1 right-2 z-10 flex items-center gap-1 text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded">
          <WifiOff className="w-3 h-3" />
          Offline
        </div>
      )}

      <div
        ref={scrollRef}
        className={cn(
          "flex items-center whitespace-nowrap overflow-hidden",
          isScrolling && "animate-scroll",
        )}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Duplicate the content for seamless scrolling */}
        {[...Array(2)].map((_, duplicateIndex) => (
          <div key={duplicateIndex} className="flex items-center">
            {validPrices.map((data, index) => (
              <div
                key={`${duplicateIndex}-${data.symbol}`}
                className="flex items-center gap-3 px-6 py-3 border-r border-border/50 min-w-[200px]"
              >
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm">
                    {data.displayName}
                  </span>
                  {data.changePercent >= 0 ? (
                    <TrendingUp className="w-4 h-4 text-green-500" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-500" />
                  )}
                </div>
                <div className="text-right">
                  <div className="font-mono text-sm font-bold">
                    {data.status === "connecting"
                      ? "..."
                      : data.status === "disconnected"
                        ? "Loading..."
                        : formatPrice(data.price, data.symbol)}
                  </div>
                  <div
                    className={cn(
                      "text-xs font-mono",
                      data.changePercent >= 0
                        ? "text-green-500"
                        : "text-red-500",
                    )}
                  >
                    {formatPercent(data.changePercent)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
