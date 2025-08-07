import React, { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";

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

// Configuration for the most traded pairs with EODHD endpoints
const TICKER_CONFIG = [
  { symbol: "EURUSD.FOREX", displayName: "EUR/USD" },
  { symbol: "USDJPY.FOREX", displayName: "USD/JPY" },
  { symbol: "GBPUSD.FOREX", displayName: "GBP/USD" },
  { symbol: "AUDUSD.FOREX", displayName: "AUD/USD" },
  { symbol: "USDCHF.FOREX", displayName: "USD/CHF" },
  { symbol: "USDCAD.FOREX", displayName: "USD/CAD" },
  { symbol: "NZDUSD.FOREX", displayName: "NZD/USD" },
  { symbol: "EURGBP.FOREX", displayName: "EUR/GBP" },
  { symbol: "EURJPY.FOREX", displayName: "EUR/JPY" },
  { symbol: "GBPJPY.FOREX", displayName: "GBP/JPY" },
  { symbol: "BTC-USD.CC", displayName: "BTC/USD" },
  { symbol: "ETH-USD.CC", displayName: "ETH/USD" },
  { symbol: "XAUUSD.FOREX", displayName: "XAU/USD" },
  { symbol: "XAGUSD.FOREX", displayName: "XAG/USD" },
  { symbol: "GSPC.INDX", displayName: "S&P 500" },
];

export default function EnhancedPriceTicker({ className }: TickerProps) {
  const [priceData, setPriceData] = useState<Record<string, PriceData>>({});
  const [isScrolling, setIsScrolling] = useState(true);
  const lastFetchTime = useRef<Record<string, number>>({});
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch price data for a specific symbol
  const fetchPriceData = async (symbol: string) => {
    try {
      const now = Date.now();
      const lastFetch = lastFetchTime.current[symbol] || 0;
      
      // Rate limiting: don't fetch if less than 20 seconds have passed
      if (now - lastFetch < 20000) {
        return;
      }
      
      lastFetchTime.current[symbol] = now;

      const response = await fetch(`/api/eodhd-price?symbol=${encodeURIComponent(symbol)}`);
      
      if (!response.ok) {
        console.error(`Failed to fetch price for ${symbol}: ${response.status}`);
        setPriceData(prev => ({
          ...prev,
          [symbol]: { ...prev[symbol], status: "disconnected" }
        }));
        return;
      }

      const data = await response.json();
      
      if (data.prices && data.prices.length > 0) {
        const priceInfo = data.prices[0];
        const config = TICKER_CONFIG.find(c => c.symbol === symbol);
        
        setPriceData(prev => ({
          ...prev,
          [symbol]: {
            symbol,
            displayName: config?.displayName || symbol,
            price: priceInfo.price || 0,
            change: priceInfo.change || 0,
            changePercent: priceInfo.change_percent || 0,
            lastUpdate: new Date(),
            status: "connected"
          }
        }));
      } else {
        setPriceData(prev => ({
          ...prev,
          [symbol]: { ...prev[symbol], status: "disconnected" }
        }));
      }
    } catch (error) {
      console.error(`Error fetching price for ${symbol}:`, error);
      setPriceData(prev => ({
        ...prev,
        [symbol]: { ...prev[symbol], status: "disconnected" }
      }));
    }
  };

  // Initialize price data and start fetching
  useEffect(() => {
    const initialData: Record<string, PriceData> = {};
    TICKER_CONFIG.forEach((config) => {
      initialData[config.symbol] = {
        symbol: config.symbol,
        displayName: config.displayName,
        price: 0,
        change: 0,
        changePercent: 0,
        lastUpdate: new Date(),
        status: "connecting",
      };
    });
    setPriceData(initialData);

    // Start fetching price data for all symbols (staggered)
    TICKER_CONFIG.forEach((config, index) => {
      setTimeout(() => {
        fetchPriceData(config.symbol);
      }, index * 1000); // 1 second between each initial request
    });

    // Set up interval for continuous updates
    const interval = setInterval(() => {
      TICKER_CONFIG.forEach((config, index) => {
        setTimeout(() => {
          fetchPriceData(config.symbol);
        }, index * 500); // 500ms between each update request
      });
    }, 45000); // Update every 45 seconds

    return () => clearInterval(interval);
  }, []);

  // Get valid price entries for display
  const validPrices = Object.values(priceData).filter(
    data => data.price > 0 && data.status === "connected"
  );

  // Auto-scroll effect
  useEffect(() => {
    if (!isScrolling || !scrollRef.current) return;

    const scrollContainer = scrollRef.current;
    let scrollPosition = 0;
    const scrollSpeed = 1; // pixels per frame
    
    const scroll = () => {
      if (!scrollContainer) return;
      
      scrollPosition += scrollSpeed;
      
      // Reset position when we've scrolled past the content width
      if (scrollPosition >= scrollContainer.scrollWidth / 2) {
        scrollPosition = 0;
      }
      
      scrollContainer.scrollLeft = scrollPosition;
      
      if (isScrolling) {
        requestAnimationFrame(scroll);
      }
    };

    // Start scrolling
    const animationFrame = requestAnimationFrame(scroll);
    
    return () => cancelAnimationFrame(animationFrame);
  }, [isScrolling, validPrices.length]);

  const formatPrice = (price: number, symbol: string) => {
    if (symbol.includes("BTC") || symbol.includes("ETH")) {
      return price.toLocaleString("en-US", { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      });
    }
    return price.toFixed(5);
  };

  const formatPercent = (percent: number) => {
    return `${percent >= 0 ? '+' : ''}${percent.toFixed(2)}%`;
  };

  return (
    <div className={cn("relative overflow-hidden bg-background border-y border-border", className)}>
      <div
        ref={scrollRef}
        className={cn(
          "flex items-center whitespace-nowrap overflow-hidden",
          isScrolling && "animate-scroll"
        )}
        onMouseEnter={() => setIsScrolling(false)}
        onMouseLeave={() => setIsScrolling(true)}
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
                  <span className="font-semibold text-sm">{data.displayName}</span>
                  {data.changePercent >= 0 ? (
                    <TrendingUp className="w-4 h-4 text-green-500" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-500" />
                  )}
                </div>
                <div className="text-right">
                  <div className="font-mono text-sm font-bold">
                    {formatPrice(data.price, data.symbol)}
                  </div>
                  <div
                    className={cn(
                      "text-xs font-mono",
                      data.changePercent >= 0 ? "text-green-500" : "text-red-500"
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
