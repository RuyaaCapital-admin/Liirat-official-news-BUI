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

// Exactly 10 pairs as specified by user
const SYMBOLS = [
  { symbol: 'EURUSD.FOREX', display: 'EUR/USD' },
  { symbol: 'USDJPY.FOREX', display: 'USD/JPY' },
  { symbol: 'GBPUSD.FOREX', display: 'GBP/USD' },
  { symbol: 'AUDUSD.FOREX', display: 'AUD/USD' },
  { symbol: 'USDCHF.FOREX', display: 'USD/CHF' },
  { symbol: 'USDCAD.FOREX', display: 'USD/CAD' },
  { symbol: 'BTC-USD.CC', display: 'Bitcoin' },
  { symbol: 'ETH-USD.CC', display: 'Ethereum' },
  { symbol: 'XAUUSD.FOREX', display: 'Gold' },
  { symbol: 'GSPC.INDX', display: 'S&P 500' },
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
      // Connect to EODHD WebSocket for real-time forex data
      const wsUrl = 'wss://ws.eodhistoricaldata.com/ws/forex?api_token=6891e3b89ee5e1.29062933';

      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('EODHD WebSocket connected');
        setIsConnected(true);
        setConnectionStatus('connected');
        reconnectAttempts.current = 0;

        // Subscribe to all symbols
        const subscribeMessage = {
          action: 'subscribe',
          symbols: SYMBOLS.map(s => s.symbol.replace('.FOREX', '').replace('.CC', '').replace('.INDX', ''))
        };
        wsRef.current?.send(JSON.stringify(subscribeMessage));
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.s && data.p) {
            // Find matching symbol
            const matchingSymbol = SYMBOLS.find(sym =>
              sym.symbol.includes(data.s) ||
              data.s.includes(sym.symbol.split('.')[0])
            );

            if (matchingSymbol) {
              const change = data.c || 0;
              const changePercent = data.cp || 0;

              setPrices(prev => ({
                ...prev,
                [matchingSymbol.symbol]: {
                  symbol: matchingSymbol.symbol,
                  price: parseFloat(data.p),
                  change: parseFloat(change),
                  changePercent: parseFloat(changePercent),
                  lastUpdate: new Date()
                }
              }));
            }
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionStatus('disconnected');
        setIsConnected(false);
      };

      wsRef.current.onclose = () => {
        console.log('WebSocket connection closed');
        setIsConnected(false);
        setConnectionStatus('disconnected');
        scheduleReconnect();
      };

      // Also fetch initial prices via REST API as fallback
      fetchInitialPrices();

    } catch (error) {
      console.error('WebSocket connection failed:', error);
      setConnectionStatus('disconnected');
      scheduleReconnect();
      // Use REST API as fallback
      fetchInitialPrices();
    }
  };

  const fetchInitialPrices = async () => {
    try {
      // Fetch prices for all symbols using EODHD REST API
      const pricePromises = SYMBOLS.map(async ({ symbol, display }) => {
        try {
          const baseSymbol = symbol.replace('.FOREX', '').replace('.CC', '').replace('.INDX', '');
          const response = await fetch(`/api/eodhd-price?symbol=${baseSymbol}`);
          if (response.ok) {
            const data = await response.json();
            if (data.price !== undefined) {
              return {
                symbol,
                display,
                price: parseFloat(data.price) || 0,
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

      if (Object.keys(newPrices).length > 0) {
        setPrices(prevPrices => ({ ...prevPrices, ...newPrices }));
        if (connectionStatus !== 'connected') {
          setConnectionStatus('connected');
          setIsConnected(true);
        }
      }
    } catch (error) {
      console.error('Failed to fetch initial prices:', error);
      if (connectionStatus !== 'disconnected') {
        setConnectionStatus('disconnected');
      }
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
