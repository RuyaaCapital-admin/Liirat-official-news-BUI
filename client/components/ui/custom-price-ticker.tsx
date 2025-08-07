import React, { useState, useEffect, memo } from "react";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";

interface PriceData {
  symbol: string;
  displayName: string;
  price: number;
  change: number;
  changePercent: number;
  currency?: string;
}

interface CustomPriceTickerProps {
  className?: string;
}

function CustomPriceTicker({ className }: CustomPriceTickerProps) {
  const [priceData, setPriceData] = useState<PriceData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Top 12 traded pairs + BTC + ETH
  const symbols = [
    // Major Forex Pairs (Top 12 traded)
    { symbol: "EURUSD", displayName: "EUR/USD", type: "forex" },
    { symbol: "GBPUSD", displayName: "GBP/USD", type: "forex" },
    { symbol: "USDJPY", displayName: "USD/JPY", type: "forex" },
    { symbol: "USDCHF", displayName: "USD/CHF", type: "forex" },
    { symbol: "AUDUSD", displayName: "AUD/USD", type: "forex" },
    { symbol: "USDCAD", displayName: "USD/CAD", type: "forex" },
    { symbol: "NZDUSD", displayName: "NZD/USD", type: "forex" },
    { symbol: "EURGBP", displayName: "EUR/GBP", type: "forex" },
    { symbol: "EURJPY", displayName: "EUR/JPY", type: "forex" },
    { symbol: "GBPJPY", displayName: "GBP/JPY", type: "forex" },
    { symbol: "CHFJPY", displayName: "CHF/JPY", type: "forex" },
    { symbol: "AUDCAD", displayName: "AUD/CAD", type: "forex" },
    // Crypto
    { symbol: "BTCUSD", displayName: "Bitcoin", type: "crypto" },
    { symbol: "ETHUSD", displayName: "Ethereum", type: "crypto" },
  ];

  const fetchPriceData = async () => {
    try {
      setIsLoading(true);
      const promises = symbols.map(async ({ symbol, displayName, type }) => {
        try {
          const response = await fetch(`/api/eodhd-price?symbol=${symbol}`);
          if (response.ok) {
            const data = await response.json();
            const priceInfo = data.prices?.[0];
            
            if (priceInfo) {
              return {
                symbol,
                displayName,
                price: priceInfo.price || 0,
                change: priceInfo.change || 0,
                changePercent: priceInfo.change_percent || 0,
                currency: priceInfo.currency,
              };
            }
          }
          
          // Return null if API fails - NO MOCK DATA
          console.warn(`API failed for ${symbol}, no fallback data provided`);
          return null;
        } catch (error) {
          console.warn(`Failed to fetch price for ${symbol}:`, error);
          // Return null on error - NO MOCK DATA
          return null;
        }
      });

      const results = await Promise.all(promises);
      setPriceData(results.filter(Boolean));
    } catch (error) {
      console.error("Error fetching price data:", error);
    } finally {
      setIsLoading(false);
    }
  };


  const formatPrice = (price: number, symbol: string): string => {
    if (symbol.includes("JPY")) {
      return price.toFixed(2);
    } else if (symbol.includes("USD") && (symbol.includes("BTC") || symbol.includes("ETH"))) {
      return price.toLocaleString("en-US", { maximumFractionDigits: 0 });
    }
    return price.toFixed(4);
  };

  const formatChange = (change: number, changePercent: number): string => {
    const sign = changePercent >= 0 ? "+" : "";
    return `${sign}${changePercent.toFixed(2)}%`;
  };

  useEffect(() => {
    fetchPriceData();
    
    // Update every 30 seconds
    const interval = setInterval(fetchPriceData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className={cn("w-full h-[50px] sm:h-[60px] bg-card border-b border-border flex items-center justify-center", className)}>
        <div className="animate-pulse text-xs sm:text-sm text-muted-foreground">Loading market data...</div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "w-full h-[50px] sm:h-[60px] bg-card border-b border-border overflow-hidden relative",
        className
      )}
    >
      {/* Scrolling Container */}
      <div className="flex items-center h-full animate-scroll whitespace-nowrap will-change-transform">
        {/* First Set */}
        {priceData.map((item, index) => (
          <React.Fragment key={`${item.symbol}-1-${index}`}>
            <div className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 min-w-fit">
              <span className="font-medium text-xs sm:text-sm truncate max-w-[80px] sm:max-w-none">
                {item.displayName}
              </span>
              <span className="font-mono text-xs sm:text-sm font-bold">
                {formatPrice(item.price, item.symbol)}
              </span>
              <div
                className={cn(
                  "flex items-center gap-0.5 sm:gap-1 text-[10px] sm:text-xs",
                  item.changePercent >= 0 ? "text-green-500" : "text-red-500"
                )}
              >
                {item.changePercent >= 0 ? (
                  <TrendingUp className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                ) : (
                  <TrendingDown className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                )}
                <span className="whitespace-nowrap">{formatChange(item.change, item.changePercent)}</span>
              </div>
            </div>
            {/* Separator */}
            {index < priceData.length - 1 && (
              <div className="w-px h-6 bg-border mx-1"></div>
            )}
          </React.Fragment>
        ))}
        
        {/* Duplicate Set for Seamless Loop */}
        {priceData.map((item, index) => (
          <React.Fragment key={`${item.symbol}-2-${index}`}>
            <div className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 min-w-fit">
              <span className="font-medium text-xs sm:text-sm truncate max-w-[80px] sm:max-w-none">
                {item.displayName}
              </span>
              <span className="font-mono text-xs sm:text-sm font-bold">
                {formatPrice(item.price, item.symbol)}
              </span>
              <div
                className={cn(
                  "flex items-center gap-0.5 sm:gap-1 text-[10px] sm:text-xs",
                  item.changePercent >= 0 ? "text-green-500" : "text-red-500"
                )}
              >
                {item.changePercent >= 0 ? (
                  <TrendingUp className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                ) : (
                  <TrendingDown className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                )}
                <span className="whitespace-nowrap">{formatChange(item.change, item.changePercent)}</span>
              </div>
            </div>
            {/* Separator */}
            {index < priceData.length - 1 && (
              <div className="w-px h-6 bg-border mx-1"></div>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* CSS for Custom Animation Control */}
      <style jsx>{`
        .animate-scroll {
          animation: scroll 60s linear infinite;
        }

        /* Pause animation on hover for better UX */
        .animate-scroll:hover {
          animation-play-state: paused;
        }

        /* Mobile responsiveness - faster scroll on smaller screens */
        @media (max-width: 768px) {
          .animate-scroll {
            animation-duration: 45s;
          }
        }

        @media (max-width: 480px) {
          .animate-scroll {
            animation-duration: 35s;
          }
        }
      `}</style>
    </div>
  );
}

export default memo(CustomPriceTicker);
