import React, { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, WifiOff, Wifi } from "lucide-react";
import { useNetworkStatus } from "@/hooks/use-network-status";

interface PriceData {
  symbol: string;
  displayName: string;
  price: number | null;
  change: number | null;
  changePercent: number | null;
  lastUpdate: Date;
  status: "connected" | "connecting" | "disconnected";
}

interface TickerProps {
  className?: string;
}

// Configuration for symbols using EODHD format - 15 symbols as requested
const TICKER_CONFIG = [
  // Crypto (.CC)
  { symbol: "BTC-USD.CC", displayName: "BTC/USD", priority: 1 },
  { symbol: "ETH-USD.CC", displayName: "ETH/USD", priority: 1 },
  // Forex (.FOREX)
  { symbol: "EURUSD.FOREX", displayName: "EUR/USD", priority: 1 },
  { symbol: "GBPUSD.FOREX", displayName: "GBP/USD", priority: 1 },
  { symbol: "USDJPY.FOREX", displayName: "USD/JPY", priority: 1 },
  { symbol: "XAUUSD.FOREX", displayName: "XAU/USD", priority: 1 },
  // Indices (.INDX)
  { symbol: "GSPC.INDX", displayName: "S&P 500", priority: 1 },
  { symbol: "DJI.INDX", displayName: "DOW JONES", priority: 1 },
  { symbol: "IXIC.INDX", displayName: "NASDAQ", priority: 1 },
  // US Leaders (.US)
  { symbol: "AAPL.US", displayName: "APPLE", priority: 2 },
  { symbol: "MSFT.US", displayName: "MICROSOFT", priority: 2 },
  { symbol: "NVDA.US", displayName: "NVIDIA", priority: 2 },
  { symbol: "TSLA.US", displayName: "TESLA", priority: 2 },
  { symbol: "GOOGL.US", displayName: "GOOGLE", priority: 2 },
  { symbol: "AMZN.US", displayName: "AMAZON", priority: 2 },
];

export default function EnhancedPriceTicker({ className }: TickerProps) {
  const [priceData, setPriceData] = useState<Record<string, PriceData>>({});
  const [isScrolling, setIsScrolling] = useState(true);
  const lastFetchTime = useRef<Record<string, number>>({});
  const intervalRef = useRef<NodeJS.Timeout>();
  const { isOnline } = useNetworkStatus();

  // Normalize EODHD response data to handle "NA" values
  const normalizeValue = (value: any): number | null => {
    if (value === "NA" || value === null || value === undefined || isNaN(Number(value))) {
      return null;
    }
    return Number(value);
  };

  // Fetch price for a single symbol
  const fetchSymbolPrice = async (symbol: string): Promise<void> => {
    try {
      // Set connecting status with safe defaults
      setPriceData((prev) => ({
        ...prev,
        [symbol]: {
          symbol,
          displayName: TICKER_CONFIG.find((c) => c.symbol === symbol)?.displayName || symbol,
          price: prev[symbol]?.price || null,
          change: prev[symbol]?.change || null,
          changePercent: prev[symbol]?.changePercent || null,
          lastUpdate: prev[symbol]?.lastUpdate || new Date(),
          status: "connecting",
        },
      }));

      const response = await fetch(`/api/eodhd/price?s=${encodeURIComponent(symbol)}`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // Handle both our API format and raw EODHD format with "NA" value normalization
      let price = normalizeValue(data.close || data.price || data.last);
      let change = normalizeValue(data.change || data.d);
      let changePct = normalizeValue(data.change_p || data.dp);

      // If current values are "NA", try previous values
      if (price === null) {
        price = normalizeValue(data.previousClose);
      }

      // Only update if we have valid price data
      if (price !== null && price > 0) {
        lastFetchTime.current[symbol] = Date.now();

        setPriceData((prev) => ({
          ...prev,
          [symbol]: {
            symbol,
            displayName: TICKER_CONFIG.find((c) => c.symbol === symbol)?.displayName || symbol,
            price,
            change: change || 0,
            changePercent: changePct || 0,
            lastUpdate: new Date(),
            status: "connected",
          },
        }));

        console.log(`[TICKER] Updated ${symbol}: $${price?.toFixed(4) || '-.--'} (${changePct && changePct > 0 ? "+" : ""}${changePct?.toFixed(2) || '0.00'}%)`);
      } else {
        // Keep previous data but mark as disconnected
        setPriceData((prev) => ({
          ...prev,
          [symbol]: {
            ...prev[symbol],
            lastUpdate: new Date(),
            status: "disconnected",
          },
        }));
      }
    } catch (error) {
      console.warn(`[TICKER] Error fetching ${symbol}:`, error);

      setPriceData((prev) => ({
        ...prev,
        [symbol]: {
          symbol,
          displayName: TICKER_CONFIG.find((c) => c.symbol === symbol)?.displayName || symbol,
          price: prev[symbol]?.price || null,
          change: prev[symbol]?.change || null,
          changePercent: prev[symbol]?.changePercent || null,
          lastUpdate: new Date(),
          status: "disconnected",
        },
      }));
    }
  };

  // Fetch all symbols with staggered timing to avoid rate limits
  const fetchAllPrices = async (): Promise<void> => {
    if (!isOnline) return;

    const symbols = TICKER_CONFIG.map(config => config.symbol);

    // Fetch symbols in batches with staggered timing to avoid rate limiting
    // Split into groups of 3-4 symbols each with delays between groups
    const batchSize = 3;
    for (let i = 0; i < symbols.length; i += batchSize) {
      const batch = symbols.slice(i, i + batchSize);

      // Fetch batch in parallel
      batch.forEach((symbol, index) => {
        setTimeout(() => fetchSymbolPrice(symbol), index * 100); // 100ms between symbols in batch
      });

      // Wait before next batch
      if (i + batchSize < symbols.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
  };

  // Auto-refresh prices every 8 seconds (increased from 5s to reduce API load)
  useEffect(() => {
    fetchAllPrices(); // Initial fetch

    intervalRef.current = setInterval(() => {
      fetchAllPrices();
    }, 8000); // Increased interval to 8 seconds

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isOnline]);

  // Pause scrolling on hover
  const handleMouseEnter = () => setIsScrolling(false);
  const handleMouseLeave = () => setIsScrolling(true);

  const formatPrice = (price: number | undefined | null, symbol: string): string => {
    // Handle undefined, null, or invalid price values
    if (price == null || isNaN(price) || price === 0) {
      return "-.--";
    }

    const validPrice = Number(price);
    if (isNaN(validPrice)) {
      return "-.--";
    }

    if (symbol.includes("JPY")) {
      return validPrice.toFixed(3);
    } else if (symbol.includes("BTC") || symbol.includes("ETH")) {
      return validPrice.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    } else if (symbol.includes("XAU") || symbol.includes("XAG")) {
      return validPrice.toFixed(2);
    } else if (symbol.includes(".US")) {
      return validPrice.toFixed(2);
    } else {
      return validPrice.toFixed(5);
    }
  };

  const formatChange = (changePercent: number | undefined | null): string => {
    // Handle undefined, null, or invalid changePercent values
    if (changePercent == null || isNaN(changePercent)) {
      return "0.00%";
    }

    const validChange = Number(changePercent);
    if (isNaN(validChange)) {
      return "0.00%";
    }

    return `${validChange > 0 ? "+" : ""}${validChange.toFixed(2)}%`;
  };

  const symbols = Object.values(priceData);
  const hasData = symbols.length > 0;

  return (
    <div className={cn("w-full overflow-hidden bg-card/80 backdrop-blur-sm border-b border-border", className)}>
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1">
            {isOnline ? (
              <Wifi className="w-4 h-4 text-green-500" />
            ) : (
              <WifiOff className="w-4 h-4 text-red-500" />
            )}
            <span className="text-xs font-medium text-muted-foreground">
              {hasData ? "LIVE" : "CONNECTING"}
            </span>
          </div>
        </div>
        
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          <span className="text-xs text-muted-foreground">Real-time</span>
        </div>
      </div>

      <div
        className="relative overflow-hidden"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div
          className={cn(
            "flex space-x-8 py-3 px-4 transition-transform duration-1000 ease-linear",
            isScrolling && hasData && "animate-scroll"
          )}
          style={{
            width: hasData ? `${symbols.length * 200}px` : "100%",
          }}
        >
          {hasData ? (
            symbols.map((data) => (
              <div
                key={data.symbol}
                className="flex items-center space-x-3 min-w-[180px] group"
              >
                <div className="flex flex-col">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-sm text-foreground">
                      {data.displayName}
                    </span>
                    <div
                      className={cn(
                        "w-2 h-2 rounded-full",
                        data.status === "connected" ? "bg-green-500" :
                        data.status === "connecting" ? "bg-yellow-500 animate-pulse" :
                        "bg-red-500"
                      )}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-bold text-foreground">
                      ${formatPrice(data.price, data.symbol)}
                    </span>
                    <div className="flex items-center space-x-1">
                      {data.changePercent > 0 ? (
                        <TrendingUp className="w-4 h-4 text-green-500" />
                      ) : data.changePercent < 0 ? (
                        <TrendingDown className="w-4 h-4 text-red-500" />
                      ) : null}
                      <span
                        className={cn(
                          "text-sm font-medium",
                          data.changePercent > 0 ? "text-green-500" :
                          data.changePercent < 0 ? "text-red-500" :
                          "text-muted-foreground"
                        )}
                      >
                        {formatChange(data.changePercent)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="flex items-center justify-center w-full py-4">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded-full bg-yellow-500 animate-pulse"></div>
                <span className="text-sm text-muted-foreground">
                  Loading market data...
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
