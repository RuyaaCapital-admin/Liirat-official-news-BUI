import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, WifiOff, Wifi } from "lucide-react";
import { useNetworkStatus } from "@/hooks/use-network-status";
import { getBatchQuotes } from "@/lib/quotes";
import { TICKERS } from "@/lib/watchlist";
import "@/styles/ticker.css";

const POLL_MS = 12000; // 12s as requested

interface PriceItem {
  code: string;
  price: number;
  change?: number;
  changePercent?: number;
}

interface TickerProps {
  className?: string;
}

export default function EnhancedPriceTicker({ className }: TickerProps) {
  const [items, setItems] = useState<PriceItem[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const intervalRef = useRef<number | null>(null);
  const inFlight = useRef<AbortController | null>(null);
  const { isOnline } = useNetworkStatus();

  const load = async () => {
    if (!isOnline) return;
    
    // cancel previous request if still running
    inFlight.current?.abort();
    const ac = new AbortController();
    inFlight.current = ac;
    
    try {
      const rows = await getBatchQuotes(TICKERS, { signal: ac.signal });
      const validItems = rows.filter(r => Number.isFinite(r.price)); // drop NA/undefined
      setItems(validItems);
      setIsConnected(true);
    } catch (error) {
      // ignore aborts, log other errors
      if (error.name !== 'AbortError') {
        console.warn('Ticker fetch error:', error);
        setIsConnected(false);
      }
    }
  };

  useEffect(() => {
    // one-time start
    load();
    
    const start = () => {
      if (intervalRef.current) return; // prevent stacking
      intervalRef.current = window.setInterval(load, POLL_MS);
    };
    
    const stop = () => {
      if (intervalRef.current) { 
        clearInterval(intervalRef.current); 
        intervalRef.current = null; 
      }
      inFlight.current?.abort();
    };
    
    start();
    
    // pause polling when tab hidden
    const onVis = () => (document.hidden ? stop() : (load(), start()));
    document.addEventListener("visibilitychange", onVis);

    return () => { 
      stop(); 
      document.removeEventListener("visibilitychange", onVis); 
    };
  }, [isOnline]);

  const formatPrice = (price: number, symbol: string): string => {
    if (symbol.includes("JPY")) {
      return price.toFixed(3);
    } else if (symbol.includes("BTC") || symbol.includes("ETH")) {
      return price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    } else if (symbol.includes("XAU")) {
      return price.toFixed(2);
    } else if (symbol.includes(".US") || symbol.includes(".INDX")) {
      return price.toFixed(2);
    } else {
      return price.toFixed(5);
    }
  };

  const formatChange = (changePercent?: number): string => {
    if (!changePercent || !Number.isFinite(changePercent)) {
      return "0.00%";
    }
    return `${changePercent > 0 ? "+" : ""}${changePercent.toFixed(2)}%`;
  };

  const getDisplayName = (code: string): string => {
    const displayNames: Record<string, string> = {
      "BTC-USD.CC": "BTC/USD",
      "ETH-USD.CC": "ETH/USD", 
      "EURUSD.FOREX": "EUR/USD",
      "GBPUSD.FOREX": "GBP/USD",
      "USDJPY.FOREX": "USD/JPY",
      "XAUUSD.FOREX": "XAU/USD",
      "GSPC.INDX": "S&P 500",
      "DJI.INDX": "DOW JONES",
      "IXIC.INDX": "NASDAQ",
      "AAPL.US": "APPLE",
      "MSFT.US": "MICROSOFT", 
      "NVDA.US": "NVIDIA",
      "TSLA.US": "TESLA"
    };
    return displayNames[code] || code;
  };

  const renderItem = (item: PriceItem, index: number) => (
    <div key={`${item.code}-${index}`} className="flex items-center space-x-3 min-w-[180px]">
      <div className="flex flex-col">
        <div className="flex items-center space-x-2">
          <span className="font-semibold text-sm text-foreground">
            {getDisplayName(item.code)}
          </span>
          <div className="w-2 h-2 rounded-full bg-green-500" />
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-lg font-bold text-foreground">
            ${formatPrice(item.price, item.code)}
          </span>
          <div className="flex items-center space-x-1">
            {item.changePercent && item.changePercent > 0 ? (
              <TrendingUp className="w-4 h-4 text-green-500" />
            ) : item.changePercent && item.changePercent < 0 ? (
              <TrendingDown className="w-4 h-4 text-red-500" />
            ) : null}
            <span
              className={cn(
                "text-sm font-medium",
                item.changePercent && item.changePercent > 0 ? "text-green-500" :
                item.changePercent && item.changePercent < 0 ? "text-red-500" :
                "text-muted-foreground"
              )}
            >
              {formatChange(item.changePercent)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className={cn("w-full bg-card/80 backdrop-blur-sm border-b border-border", className)}>
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1">
            {isOnline && isConnected ? (
              <Wifi className="w-4 h-4 text-green-500" />
            ) : (
              <WifiOff className="w-4 h-4 text-red-500" />
            )}
            <span className="text-xs font-medium text-muted-foreground">
              {items.length > 0 ? "LIVE" : "CONNECTING"}
            </span>
          </div>
        </div>
        
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          <span className="text-xs text-muted-foreground">Real-time</span>
        </div>
      </div>

      <div className="ticker-wrap">
        <div className="ticker-track">
          {items.map(renderItem)}
          {items.map(renderItem)} {/* duplicate for seamless scroll */}
        </div>
      </div>
    </div>
  );
}
