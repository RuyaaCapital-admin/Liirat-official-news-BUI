import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface AssetData {
  symbol: string;
  name: string;
  price: number | null;
  change: number | null;
  changePercent: number | null;
}

interface PriceTickerProps {
  className?: string;
  autoPlay?: boolean;
  pauseOnHover?: boolean;
  speed?: number; // Duration in seconds for one complete cycle
}

export function PriceTicker({ 
  className,
  autoPlay = true,
  pauseOnHover = true,
  speed = 60
}: PriceTickerProps) {
  const [assets, setAssets] = useState<AssetData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const tickerRef = useRef<HTMLDivElement>(null);

  // Asset configuration with multiple data sources
  const assetConfigs = [
    { symbol: 'BTC/USD', name: 'Bitcoin', type: 'crypto', id: 'bitcoin' },
    { symbol: 'ETH/USD', name: 'Ethereum', type: 'crypto', id: 'ethereum' },
    { symbol: 'EUR/USD', name: 'Euro', type: 'forex', id: 'eurusd' },
    { symbol: 'GBP/USD', name: 'British Pound', type: 'forex', id: 'gbpusd' },
    { symbol: 'USD/JPY', name: 'Japanese Yen', type: 'forex', id: 'usdjpy' },
    { symbol: 'XAU/USD', name: 'Gold', type: 'commodity', id: 'gold' },
    { symbol: 'WTI', name: 'Oil', type: 'commodity', id: 'crude-oil' },
    { symbol: 'NASDAQ', name: 'Nasdaq', type: 'index', id: 'nasdaq' },
    { symbol: 'DOW', name: 'Dow Jones', type: 'index', id: 'dow-jones' },
    { symbol: 'S&P 500', name: 'S&P 500', type: 'index', id: 'sp500' },
  ];

  // Mock data for demonstration (replace with real API calls)
  const generateMockData = (): AssetData[] => {
    return assetConfigs.map(config => ({
      symbol: config.symbol,
      name: config.name,
      price: Math.random() * 1000 + 100, // Random price between 100-1100
      change: (Math.random() - 0.5) * 20, // Random change between -10 to +10
      changePercent: (Math.random() - 0.5) * 5, // Random % change between -2.5% to +2.5%
    }));
  };

  // Fetch real-time data
  const fetchAssetData = async () => {
    try {
      // For crypto assets, use CoinGecko API with better error handling
      const cryptoIds = assetConfigs.filter(a => a.type === 'crypto').map(a => a.id);

      let cryptoData: any = {};
      if (cryptoIds.length > 0) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

          const cryptoResponse = await fetch(
            `https://api.coingecko.com/api/v3/simple/price?ids=${cryptoIds.join(',')}&vs_currencies=usd&include_24hr_change=true`,
            {
              signal: controller.signal,
              mode: 'cors',
              headers: {
                'Accept': 'application/json',
              }
            }
          );
          clearTimeout(timeoutId);

          if (!cryptoResponse.ok) {
            throw new Error(`API returned ${cryptoResponse.status}`);
          }

          cryptoData = await cryptoResponse.json();
        } catch (error) {
          console.warn('Crypto API failed, using mock data:', error instanceof Error ? error.message : 'Unknown error');
          // Generate realistic mock data for crypto
          cryptoData = {
            bitcoin: { usd: 95420, usd_24h_change: 2.3 },
            ethereum: { usd: 3520, usd_24h_change: -1.8 }
          };
        }
      }

      // For now, generate realistic mock data for forex/commodities/indices
      // In production, you would integrate with financial data providers like:
      // - Alpha Vantage, Twelve Data, IEX Cloud, Finnhub, etc.
      const updatedAssets: AssetData[] = assetConfigs.map(config => {
        if (config.type === 'crypto' && cryptoData[config.id]) {
          const data = cryptoData[config.id];
          return {
            symbol: config.symbol,
            name: config.name,
            price: data.usd,
            change: data.usd_24h_change,
            changePercent: data.usd_24h_change,
          };
        }
        
        // Realistic mock data for other asset types
        const basePrice = getBasePriceForAsset(config.symbol);
        const changePercent = (Math.random() - 0.5) * 4; // ±2%
        const price = basePrice * (1 + changePercent / 100);
        const change = price - basePrice;
        
        return {
          symbol: config.symbol,
          name: config.name,
          price: price,
          change: change,
          changePercent: changePercent,
        };
      });

      setAssets(updatedAssets);
      setIsLoading(false);
    } catch (error) {
      console.warn('Data fetch failed, using mock data:', error);
      setAssets(generateMockData());
      setIsLoading(false);
    }
  };

  // Get realistic base prices for different assets
  const getBasePriceForAsset = (symbol: string): number => {
    const basePrices: { [key: string]: number } = {
      'BTC/USD': 95000,
      'ETH/USD': 3500,
      'EUR/USD': 1.0850,
      'GBP/USD': 1.2680,
      'USD/JPY': 149.50,
      'XAU/USD': 2040.00,
      'WTI': 75.20,
      'NASDAQ': 15800,
      'DOW': 37500,
      'S&P 500': 4850,
    };
    return basePrices[symbol] || 100;
  };

  // Fetch data on mount and set up interval
  useEffect(() => {
    fetchAssetData();
    const interval = setInterval(fetchAssetData, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Handle hover pause/resume
  const handleMouseEnter = () => {
    if (pauseOnHover) {
      setIsPaused(true);
    }
  };

  const handleMouseLeave = () => {
    if (pauseOnHover) {
      setIsPaused(false);
    }
  };

  // Format price based on asset type
  const formatPrice = (price: number | null, symbol: string): string => {
    if (price === null) return '–';
    
    if (symbol.includes('USD/JPY')) {
      return price.toFixed(2);
    } else if (symbol.includes('/USD') && !symbol.includes('BTC') && !symbol.includes('ETH')) {
      return price.toFixed(4);
    } else if (symbol.includes('XAU') || symbol.includes('WTI')) {
      return price.toFixed(2);
    } else if (symbol.includes('BTC')) {
      return price.toLocaleString('en-US', { maximumFractionDigits: 0 });
    } else if (symbol.includes('ETH')) {
      return price.toFixed(0);
    } else {
      return price.toFixed(2);
    }
  };

  // Format change percentage
  const formatChangePercent = (change: number | null): string => {
    if (change === null) return '';
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(2)}%`;
  };

  if (isLoading) {
    return (
      <div className={cn(
        "bg-card border-b border-border overflow-hidden py-3",
        className
      )}>
        <div className="container mx-auto px-4">
          <div className="text-sm text-muted-foreground text-center">
            Loading market data...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "bg-card border-b border-border overflow-hidden relative py-3",
      className
    )}>
      <div 
        className="relative w-full overflow-hidden"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div
          ref={tickerRef}
          className={cn(
            "flex gap-8 whitespace-nowrap",
            autoPlay && !isPaused && "animate-scroll"
          )}
          style={{
            animationDuration: `${speed}s`,
            animationPlayState: isPaused ? 'paused' : 'running',
          }}
        >
          {/* Duplicate assets for seamless loop */}
          {[...assets, ...assets].map((asset, index) => (
            <div
              key={`${asset.symbol}-${index}`}
              className="flex items-center gap-3 px-4 py-1 rounded-md hover:bg-muted/50 transition-colors"
            >
              {/* Asset Symbol */}
              <div className="font-semibold text-sm text-foreground min-w-fit">
                {asset.symbol}
              </div>

              {/* Separator */}
              <div className="w-px h-4 bg-border"></div>

              {/* Price */}
              <div className="font-mono text-sm font-medium text-foreground">
                ${formatPrice(asset.price, asset.symbol)}
              </div>

              {/* Change with icon and color */}
              <div className={cn(
                "flex items-center gap-1 text-sm font-medium",
                asset.changePercent === null ? "text-muted-foreground" :
                asset.changePercent >= 0 ? "text-green-600" : "text-red-600"
              )}>
                {asset.changePercent !== null && (
                  <>
                    {asset.changePercent >= 0 ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    <span className="font-mono">
                      {formatChangePercent(asset.changePercent)}
                    </span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CSS for smooth scrolling animation */}
      <style>{`
        @keyframes scroll {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-scroll {
          animation: scroll ${speed}s linear infinite;
        }
      `}</style>
    </div>
  );
}
