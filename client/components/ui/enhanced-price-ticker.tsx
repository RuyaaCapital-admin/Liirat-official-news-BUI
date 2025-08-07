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
// Priority tiers for fetching - fetch most important first
const TICKER_CONFIG = [
  // TIER 1: Most reliable and important symbols
  { symbol: "BTC-USD.CC", displayName: "BTC/USD", priority: 1 },
  { symbol: "ETH-USD.CC", displayName: "ETH/USD", priority: 1 },
  { symbol: "EURUSD.FOREX", displayName: "EUR/USD", priority: 1 },
  { symbol: "GBPUSD.FOREX", displayName: "GBP/USD", priority: 1 },
  { symbol: "USDJPY.FOREX", displayName: "USD/JPY", priority: 1 },

  // TIER 2: Important but can load slower
  { symbol: "XAUUSD.FOREX", displayName: "GOLD", priority: 2 },
  { symbol: "AAPL.US", displayName: "APPLE", priority: 2 },
  { symbol: "MSFT.US", displayName: "MICROSOFT", priority: 2 },
  { symbol: "NVDA.US", displayName: "NVIDIA", priority: 2 },
  { symbol: "TSLA.US", displayName: "TESLA", priority: 2 },

  // TIER 3: Additional symbols (load last)
  { symbol: "XAGUSD.FOREX", displayName: "SILVER", priority: 3 },
  { symbol: "USDCHF.FOREX", displayName: "USD/CHF", priority: 3 },
  { symbol: "USDCAD.FOREX", displayName: "USD/CAD", priority: 3 },
  { symbol: "AUDUSD.FOREX", displayName: "AUD/USD", priority: 3 },
  { symbol: "GOOGL.US", displayName: "GOOGLE", priority: 3 },
  { symbol: "AMZN.US", displayName: "AMAZON", priority: 3 },
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
    // Basic browser online check first
    if (!navigator?.onLine) {
      return false;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const response = await fetch("/api/status", {
        method: "GET",
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response?.ok || false;
    } catch (error) {
      console.debug("[TICKER] Network connectivity check failed:", error);
      return false;
    }
  };

  // Fetch price data using new batch API endpoint
  const fetchBatchPriceData = async (symbols: string[], retryCount = 0) => {
    const maxRetries = 1;
    const retryDelay = 3000;

    try {
      const now = Date.now();

      // Set connecting status for all symbols
      if (retryCount === 0) {
        symbols.forEach(symbol => {
          setPriceData((prev) => ({
            ...prev,
            [symbol]: { ...prev[symbol], status: "connecting" },
          }));
        });
      }

      console.log(`[TICKER] Attempting to fetch batch: ${symbols.join(',')}`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      let response;
      try {
        response = await fetch(
          `/api/eodhd/price?symbols=${encodeURIComponent(symbols.join(','))}`,
          {
            method: "GET",
            headers: {
              Accept: "application/json; charset=utf-8",
              "Content-Type": "application/json; charset=utf-8",
            },
            signal: controller.signal,
          },
        );
      } catch (fetchError) {
        console.warn(`[TICKER] Batch fetch failed:`, fetchError);
        clearTimeout(timeoutId);

        // Set disconnected status for all symbols
        symbols.forEach(symbol => {
          setPriceData((prev) => ({
            ...prev,
            [symbol]: {
              ...prev[symbol],
              status: "disconnected",
              lastUpdate: new Date(),
            },
          }));
        });
        return;
      }

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text().catch(() => "No response body");
        console.error(
          `[TICKER] API error for batch: ${response.status} - ${response.statusText}`,
          errorText.substring(0, 200),
        );

        if (
          (response.status >= 500 ||
            response.status === 429 ||
            response.status === 0) &&
          retryCount < maxRetries
        ) {
          console.log(
            `[TICKER] Retrying batch in ${retryDelay}ms (attempt ${retryCount + 1}/${maxRetries})`,
          );
          setTimeout(() => fetchBatchPriceData(symbols, retryCount + 1), retryDelay);
          return;
        }

        // Set disconnected status for all symbols after retries
        symbols.forEach(symbol => {
          setPriceData((prev) => ({
            ...prev,
            [symbol]: {
              ...prev[symbol],
              status: "disconnected",
              lastUpdate: new Date(),
            },
          }));
        });
        return;
      }

      const data = await response.json();

      if (data.ok && data.items && data.items.length > 0) {
        // Update each symbol with its data
        data.items.forEach((item: any) => {
          const config = TICKER_CONFIG.find((c) => c.symbol === item.symbol);

          setPriceData((prev) => ({
            ...prev,
            [item.symbol]: {
              symbol: item.symbol,
              displayName: config?.displayName || item.symbol,
              price: item.price || 0,
              change: item.change || 0,
              changePercent: item.changePct || 0,
              lastUpdate: new Date(),
              status: "connected",
            },
          }));
        });

        console.log(`[TICKER] Successfully fetched ${data.items.length} symbols`);
      } else {
        console.warn(`[TICKER] No price data received in batch response`);
        symbols.forEach(symbol => {
          setPriceData((prev) => ({
            ...prev,
            [symbol]: { ...prev[symbol], status: "disconnected" },
          }));
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`[TICKER] Network error for batch:`, errorMessage);

      const isNetworkError =
        errorMessage.includes("Failed to fetch") ||
        errorMessage.includes("NetworkError") ||
        errorMessage.includes("AbortError") ||
        errorMessage.includes("TypeError");

      if (isNetworkError && retryCount < maxRetries) {
        console.log(
          `[TICKER] Retrying batch due to network error in ${retryDelay}ms (attempt ${retryCount + 1}/${maxRetries})`,
        );
        setTimeout(() => {
          try {
            fetchBatchPriceData(symbols, retryCount + 1);
          } catch (retryError) {
            console.error(`[TICKER] Batch retry failed:`, retryError);
          }
        }, retryDelay);
        return;
      }

      // Set disconnected status for all symbols on final failure
      symbols.forEach(symbol => {
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
      });
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

    // Start fetching by priority tiers to reduce load
    const tier1 = TICKER_CONFIG.filter((c) => c.priority === 1);
    const tier2 = TICKER_CONFIG.filter((c) => c.priority === 2);
    const tier3 = TICKER_CONFIG.filter((c) => c.priority === 3);

    // Fetch tier 1 immediately (most important)
    tier1.forEach((config, index) => {
      setTimeout(() => {
        fetchPriceData(config.symbol);
      }, index * 1000); // 1 second between tier 1
    });

    // Fetch tier 2 after 10 seconds
    setTimeout(() => {
      tier2.forEach((config, index) => {
        setTimeout(() => {
          fetchPriceData(config.symbol);
        }, index * 2000); // 2 seconds between tier 2
      });
    }, 10000);

    // Fetch tier 3 after 30 seconds
    setTimeout(() => {
      tier3.forEach((config, index) => {
        setTimeout(() => {
          fetchPriceData(config.symbol);
        }, index * 3000); // 3 seconds between tier 3
      });
    }, 30000);

    // Set up interval for updates - only tier 1 updates frequently
    const interval = setInterval(() => {
      tier1.forEach((config, index) => {
        setTimeout(() => {
          fetchPriceData(config.symbol);
        }, index * 2000);
      });
    }, 120000); // Update tier 1 every 2 minutes

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
