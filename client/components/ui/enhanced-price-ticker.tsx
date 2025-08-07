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
  status: 'connected' | 'connecting' | 'disconnected';
}

interface TickerProps {
  className?: string;
}

// Configuration for the 10 required pairs with correct EODHD endpoints
const TICKER_CONFIG = [
  { symbol: "EURUSD.FOREX", displayName: "EUR/USD", wsType: "forex" },
  { symbol: "USDJPY.FOREX", displayName: "USD/JPY", wsType: "forex" },
  { symbol: "GBPUSD.FOREX", displayName: "GBP/USD", wsType: "forex" },
  { symbol: "AUDUSD.FOREX", displayName: "AUD/USD", wsType: "forex" },
  { symbol: "USDCHF.FOREX", displayName: "USD/CHF", wsType: "forex" },
  { symbol: "USDCAD.FOREX", displayName: "USD/CAD", wsType: "forex" },
  { symbol: "BTC-USD.CC", displayName: "BTC/USD", wsType: "crypto" },
  { symbol: "ETH-USD.CC", displayName: "ETH/USD", wsType: "crypto" },
  { symbol: "XAUUSD.FOREX", displayName: "XAU/USD", wsType: "forex" },
  { symbol: "GSPC.INDX", displayName: "S&P 500", wsType: "us" },
];

const EODHD_API_KEY = "6891e3b89ee5e1.29062933";

export default function EnhancedPriceTicker({ className }: TickerProps) {
  const [priceData, setPriceData] = useState<Record<string, PriceData>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const wsConnections = useRef<Record<string, WebSocket>>({});
  const reconnectTimeouts = useRef<Record<string, NodeJS.Timeout>>({});

  // Initialize price data
  useEffect(() => {
    const initialData: Record<string, PriceData> = {};
    TICKER_CONFIG.forEach(config => {
      initialData[config.symbol] = {
        symbol: config.symbol,
        displayName: config.displayName,
        price: 0,
        change: 0,
        changePercent: 0,
        lastUpdate: new Date(),
        status: 'connecting',
      };
    });
    setPriceData(initialData);
  }, []);

  // Connect to WebSocket for a specific symbol
  const connectWebSocket = (config: typeof TICKER_CONFIG[0]) => {
    try {
      // Clear existing connection and timeout
      if (wsConnections.current[config.symbol]) {
        wsConnections.current[config.symbol].close();
      }
      if (reconnectTimeouts.current[config.symbol]) {
        clearTimeout(reconnectTimeouts.current[config.symbol]);
      }

      // Determine correct WebSocket URL based on asset type
      let wsUrl = "";
      switch (config.wsType) {
        case "forex":
          wsUrl = `wss://ws.eodhistoricaldata.com/ws/forex?api_token=${EODHD_API_KEY}`;
          break;
        case "crypto":
          wsUrl = `wss://ws.eodhistoricaldata.com/ws/crypto?api_token=${EODHD_API_KEY}`;
          break;
        case "us":
          wsUrl = `wss://ws.eodhistoricaldata.com/ws/us?api_token=${EODHD_API_KEY}`;
          break;
        default:
          console.error(`Unknown WebSocket type: ${config.wsType}`);
          return;
      }

      console.log(`Connecting to ${config.symbol} via ${wsUrl}`);

      const ws = new WebSocket(wsUrl);
      wsConnections.current[config.symbol] = ws;

      // Update status to connecting
      setPriceData(prev => ({
        ...prev,
        [config.symbol]: {
          ...prev[config.symbol],
          status: 'connecting',
        },
      }));

      ws.onopen = () => {
        console.log(`WebSocket connected for ${config.symbol}`);
        
        // Subscribe to the specific symbol
        const subscribeMessage = {
          action: 'subscribe',
          symbols: config.symbol,
        };
        ws.send(JSON.stringify(subscribeMessage));

        // Update status to connected
        setPriceData(prev => ({
          ...prev,
          [config.symbol]: {
            ...prev[config.symbol],
            status: 'connected',
          },
        }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log(`Price data received for ${config.symbol}:`, data);

          // Handle different message formats from EODHD
          if (data.s === config.symbol && data.p !== undefined) {
            const price = parseFloat(data.p);
            const previousPrice = priceData[config.symbol]?.price || price;
            const change = price - previousPrice;
            const changePercent = previousPrice !== 0 ? (change / previousPrice) * 100 : 0;

            setPriceData(prev => ({
              ...prev,
              [config.symbol]: {
                ...prev[config.symbol],
                price,
                change,
                changePercent,
                lastUpdate: new Date(),
                status: 'connected',
              },
            }));
          }
        } catch (error) {
          console.error(`Error parsing WebSocket message for ${config.symbol}:`, error);
        }
      };

      ws.onerror = (error) => {
        console.error(`WebSocket error for ${config.symbol}:`, error);
        setPriceData(prev => ({
          ...prev,
          [config.symbol]: {
            ...prev[config.symbol],
            status: 'disconnected',
          },
        }));
      };

      ws.onclose = (event) => {
        console.log(`WebSocket closed for ${config.symbol}:`, event.code, event.reason);
        setPriceData(prev => ({
          ...prev,
          [config.symbol]: {
            ...prev[config.symbol],
            status: 'disconnected',
          },
        }));

        // Auto-reconnect after 5 seconds
        reconnectTimeouts.current[config.symbol] = setTimeout(() => {
          console.log(`Attempting to reconnect ${config.symbol}...`);
          connectWebSocket(config);
        }, 5000);
      };

    } catch (error) {
      console.error(`Failed to connect WebSocket for ${config.symbol}:`, error);
      setPriceData(prev => ({
        ...prev,
        [config.symbol]: {
          ...prev[config.symbol],
          status: 'disconnected',
        },
      }));
    }
  };

  // Connect to all WebSockets
  useEffect(() => {
    TICKER_CONFIG.forEach(config => {
      connectWebSocket(config);
    });

    // Cleanup on unmount
    return () => {
      Object.values(wsConnections.current).forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.close();
        }
      });
      Object.values(reconnectTimeouts.current).forEach(timeout => {
        clearTimeout(timeout);
      });
    };
  }, []);

  // Auto-scroll through tickers (increased interval to reduce processing)
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % TICKER_CONFIG.length);
    }, 5000); // Change every 5 seconds to reduce processing

    return () => clearInterval(interval);
  }, []);

  // Fallback to REST API if WebSocket fails
  const fetchFallbackPrice = async (symbol: string) => {
    try {
      const response = await fetch(`/api/eodhd-price?symbol=${symbol}`);
      if (response.ok) {
        const data = await response.json();
        if (data.price) {
          const currentData = priceData[symbol];
          const change = data.price - (currentData?.price || data.price);
          const changePercent = currentData?.price ? (change / currentData.price) * 100 : 0;

          setPriceData(prev => ({
            ...prev,
            [symbol]: {
              ...prev[symbol],
              price: data.price,
              change,
              changePercent,
              lastUpdate: new Date(),
              status: 'connected',
            },
          }));
        }
      }
    } catch (error) {
      console.error(`Fallback price fetch failed for ${symbol}:`, error);
    }
  };

  // Fallback polling for disconnected symbols
  useEffect(() => {
    const fallbackInterval = setInterval(() => {
      Object.entries(priceData).forEach(([symbol, data]) => {
        if (data.status === 'disconnected') {
          fetchFallbackPrice(symbol);
        }
      });
    }, 30000); // Every 30 seconds

    return () => clearInterval(fallbackInterval);
  }, [priceData]);

  const formatPrice = (price: number, symbol: string) => {
    if (symbol.includes("BTC") || symbol.includes("ETH")) {
      return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    } else if (symbol.includes("JPY")) {
      return price.toFixed(3);
    } else {
      return price.toFixed(5);
    }
  };

  const formatChange = (change: number, changePercent: number) => {
    const sign = change >= 0 ? "+" : "";
    return `${sign}${change.toFixed(4)} (${sign}${changePercent.toFixed(2)}%)`;
  };

  const currentTicker = TICKER_CONFIG[currentIndex];
  const currentData = priceData[currentTicker?.symbol];

  if (!currentData) {
    return (
      <div className={cn("bg-primary/10 py-2 px-4 border-b border-border", className)}>
        <div className="flex items-center justify-center text-sm text-muted-foreground">
          Loading market data...
        </div>
      </div>
    );
  }

  return (
    <div className={cn("bg-background/95 backdrop-blur-sm py-2 px-4 border-b border-border", className)}>
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* Current Ticker Display */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-sm">{currentData.displayName}</span>
            <div className={cn(
              "w-2 h-2 rounded-full",
              currentData.status === 'connected' ? "bg-green-500" :
              currentData.status === 'connecting' ? "bg-yellow-500" :
              "bg-red-500"
            )} />
          </div>
          
          <div className="text-lg font-bold">
            {currentData.price > 0 ? formatPrice(currentData.price, currentData.symbol) : "--"}
          </div>
          
          {currentData.price > 0 && (
            <div className={cn(
              "flex items-center space-x-1 text-sm font-medium",
              currentData.change >= 0 ? "text-green-600" : "text-red-600"
            )}>
              {currentData.change >= 0 ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              <span>{formatChange(currentData.change, currentData.changePercent)}</span>
            </div>
          )}
        </div>

        {/* Mini ticker strip for all symbols */}
        <div className="hidden lg:flex items-center space-x-6 text-xs">
          {TICKER_CONFIG.slice(0, 5).map(config => {
            const data = priceData[config.symbol];
            if (!data || data.price === 0) return null;
            
            return (
              <div key={config.symbol} className="flex items-center space-x-1">
                <span className="text-muted-foreground">{config.displayName}:</span>
                <span className="font-semibold">{formatPrice(data.price, config.symbol)}</span>
                <span className={cn(
                  "text-xs",
                  data.change >= 0 ? "text-green-600" : "text-red-600"
                )}>
                  {data.change >= 0 ? "+" : ""}{data.changePercent.toFixed(1)}%
                </span>
              </div>
            );
          })}
        </div>

        {/* Live indicator */}
        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span>Live</span>
        </div>
      </div>
    </div>
  );
}
