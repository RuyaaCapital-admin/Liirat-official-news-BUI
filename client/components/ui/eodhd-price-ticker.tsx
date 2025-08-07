import React, { useEffect, useState, useRef } from 'react';
import { TrendingUp, TrendingDown, Wifi, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PriceData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  lastUpdate: Date;
}

interface EODHDPriceTickerProps {
  className?: string;
}

const SYMBOLS = [
  { symbol: 'XAUUSD.FOREX', display: 'Gold' },
  { symbol: 'GSPC.INDX', display: 'S&P 500' },
  { symbol: 'EURUSD.FOREX', display: 'EUR/USD' },
  { symbol: 'BTC-USD.CC', display: 'Bitcoin' },
  { symbol: 'ETH-USD.CC', display: 'Ethereum' },
  { symbol: 'GBPUSD.FOREX', display: 'GBP/USD' },
  { symbol: 'USDJPY.FOREX', display: 'USD/JPY' },
  { symbol: 'TSLA.US', display: 'Tesla' },
];

const EODHDPriceTicker: React.FC<EODHDPriceTickerProps> = ({ className }) => {
  const [prices, setPrices] = useState<Record<string, PriceData>>({});
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);

  const connectWebSocket = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    setConnectionStatus('connecting');
    
    try {
      // Use server-side endpoint to avoid exposing API key
      const wsUrl = `/api/eodhd-websocket`; // We'll create this endpoint
      
      // For now, use REST API fallback with periodic updates
      fetchInitialPrices();
      
      // Set up periodic refresh as fallback
      const interval = setInterval(fetchInitialPrices, 30000); // 30 seconds
      
      setIsConnected(true);
      setConnectionStatus('connected');
      
      return () => clearInterval(interval);
      
    } catch (error) {
      console.error('WebSocket connection failed:', error);
      setConnectionStatus('disconnected');
      scheduleReconnect();
    }
  };

  const fetchInitialPrices = async () => {
    try {
      // Fetch prices for all symbols using REST API
      const pricePromises = SYMBOLS.map(async ({ symbol, display }) => {
        try {
          const response = await fetch(`/api/eodhd-price?symbol=${symbol.replace('.FOREX', '').replace('.CC', '').replace('.INDX', '').replace('.US', '')}`);
          if (response.ok) {
            const data = await response.json();
            if (data.price) {
              return {
                symbol,
                display,
                price: parseFloat(data.price),
                change: parseFloat(data.change || 0),
                changePercent: parseFloat(data.change_p || 0),
                lastUpdate: new Date()
              };
            }
          }
        } catch (error) {
          console.warn(`Failed to fetch price for ${symbol}:`, error);
        }
        return null;
      });

      const results = await Promise.all(pricePromises);
      const newPrices: Record<string, PriceData> = {};

      results.forEach((result) => {
        if (result) {
          newPrices[result.symbol] = {
            symbol: result.symbol,
            price: result.price,
            change: result.change,
            changePercent: result.changePercent,
            lastUpdate: result.lastUpdate
          };
        }
      });

      setPrices(prevPrices => ({ ...prevPrices, ...newPrices }));
      setIsConnected(true);
      setConnectionStatus('connected');
    } catch (error) {
      console.error('Failed to fetch initial prices:', error);
      setConnectionStatus('disconnected');
    }
  };

  const scheduleReconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    reconnectAttempts.current++;
    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000); // Exponential backoff, max 30s
    
    reconnectTimeoutRef.current = setTimeout(() => {
      connectWebSocket();
    }, delay);
  };

  useEffect(() => {
    connectWebSocket();
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  const formatPrice = (price: number, symbol: string): string => {
    if (symbol.includes('JPY')) {
      return price.toFixed(3);
    } else if (symbol.includes('BTC') || symbol.includes('ETH')) {
      return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    } else if (symbol.includes('XAUUSD')) {
      return price.toFixed(2);
    } else if (symbol.includes('INDX')) {
      return price.toFixed(2);
    }
    return price.toFixed(4);
  };

  const formatChange = (change: number, changePercent: number): string => {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(2)} (${sign}${changePercent.toFixed(2)}%)`;
  };

  return (
    <div className={cn('bg-background border-b border-border', className)}>
      <div className="relative overflow-hidden h-12">
        <div className="flex items-center h-full">
          {/* Connection Status */}
          <div className="flex items-center gap-2 px-4 border-r border-border">
            {connectionStatus === 'connected' ? (
              <Wifi className="h-4 w-4 text-green-500" />
            ) : connectionStatus === 'connecting' ? (
              <div className="h-4 w-4 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-500" />
            )}
            <span className="text-xs text-muted-foreground">
              {connectionStatus === 'connected' ? 'Live' : 
               connectionStatus === 'connecting' ? 'Connecting' : 'Offline'}
            </span>
          </div>

          {/* Scrolling Ticker */}
          <div className="flex-1 overflow-hidden">
            <div className="flex animate-scroll-left whitespace-nowrap">
              {SYMBOLS.map(({ symbol, display }) => {
                const priceData = prices[symbol];
                if (!priceData) {
                  return (
                    <div key={symbol} className="flex items-center gap-2 px-6 py-2">
                      <span className="font-medium text-sm">{display}</span>
                      <div className="h-4 w-16 bg-muted animate-pulse rounded" />
                    </div>
                  );
                }

                const isPositive = priceData.change >= 0;
                
                return (
                  <div key={symbol} className="flex items-center gap-3 px-6 py-2 border-r border-border/50">
                    <span className="font-medium text-sm">{display}</span>
                    <span className="font-mono text-sm">
                      {formatPrice(priceData.price, symbol)}
                    </span>
                    <div className={cn(
                      'flex items-center gap-1 text-xs',
                      isPositive ? 'text-green-500' : 'text-red-500'
                    )}>
                      {isPositive ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      <span className="font-mono">
                        {formatChange(priceData.change, priceData.changePercent)}
                      </span>
                    </div>
                  </div>
                );
              })}
              
              {/* Duplicate for seamless loop */}
              {SYMBOLS.map(({ symbol, display }) => {
                const priceData = prices[symbol];
                if (!priceData) return null;

                const isPositive = priceData.change >= 0;
                
                return (
                  <div key={`${symbol}-dup`} className="flex items-center gap-3 px-6 py-2 border-r border-border/50">
                    <span className="font-medium text-sm">{display}</span>
                    <span className="font-mono text-sm">
                      {formatPrice(priceData.price, symbol)}
                    </span>
                    <div className={cn(
                      'flex items-center gap-1 text-xs',
                      isPositive ? 'text-green-500' : 'text-red-500'
                    )}>
                      {isPositive ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      <span className="font-mono">
                        {formatChange(priceData.change, priceData.changePercent)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes scroll-left {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-scroll-left {
          animation: scroll-left 60s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default EODHDPriceTicker;
