import { useState, useEffect, useRef } from 'react';

interface PriceData {
  symbol: string;
  displayName: string;
  price: number;
  change: number;
  changePercent: number;
  lastUpdate: Date;
  status: 'connected' | 'connecting' | 'disconnected';
}

interface UsePriceDataOptions {
  symbols: Array<{ symbol: string; displayName: string }>;
  updateInterval?: number;
  enabled?: boolean;
}

// Global state to prevent duplicate API calls across components
const globalPriceCache = new Map<string, PriceData>();
const pendingRequests = new Set<string>();
const subscribers = new Map<string, Set<(data: PriceData) => void>>();

export function usePriceData({ symbols, updateInterval = 60000, enabled = true }: UsePriceDataOptions) {
  const [priceData, setPriceData] = useState<Record<string, PriceData>>({});
  const [isLoading, setIsLoading] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout>();

  // Initialize price data
  useEffect(() => {
    const initialData: Record<string, PriceData> = {};
    symbols.forEach(config => {
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
  }, [symbols]);

  // Subscribe to price updates
  useEffect(() => {
    if (!enabled) return;

    const handlePriceUpdate = (symbol: string) => (data: PriceData) => {
      setPriceData(prev => ({
        ...prev,
        [symbol]: data,
      }));
    };

    // Subscribe to each symbol
    symbols.forEach(({ symbol }) => {
      if (!subscribers.has(symbol)) {
        subscribers.set(symbol, new Set());
      }
      subscribers.get(symbol)!.add(handlePriceUpdate(symbol));
    });

    // Cleanup subscriptions
    return () => {
      symbols.forEach(({ symbol }) => {
        const symbolSubscribers = subscribers.get(symbol);
        if (symbolSubscribers) {
          symbolSubscribers.delete(handlePriceUpdate(symbol));
          if (symbolSubscribers.size === 0) {
            subscribers.delete(symbol);
          }
        }
      });
    };
  }, [symbols, enabled]);

  // Fetch price data with batching
  const fetchPrices = async () => {
    if (!enabled) return;

    try {
      // Group symbols that need updates
      const symbolsToFetch = symbols.filter(({ symbol }) => {
        const cached = globalPriceCache.get(symbol);
        if (!cached) return true;
        
        // Check if data is stale (older than update interval)
        const now = Date.now();
        const lastUpdate = cached.lastUpdate.getTime();
        return (now - lastUpdate) > updateInterval;
      });

      if (symbolsToFetch.length === 0) {
        setIsLoading(false);
        return;
      }

      // Batch requests to avoid too many simultaneous API calls
      const batchSize = 3; // Process 3 symbols at a time
      const batches = [];
      for (let i = 0; i < symbolsToFetch.length; i += batchSize) {
        batches.push(symbolsToFetch.slice(i, i + batchSize));
      }

      for (const batch of batches) {
        // Process batch in parallel
        await Promise.all(
          batch.map(({ symbol, displayName }) => fetchSinglePrice(symbol, displayName))
        );
        
        // Small delay between batches to respect rate limits
        if (batches.length > 1) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching batch prices:', error);
      setIsLoading(false);
    }
  };

  // Fetch single price with deduplication
  const fetchSinglePrice = async (symbol: string, displayName: string) => {
    // Prevent duplicate requests
    if (pendingRequests.has(symbol)) {
      return;
    }

    pendingRequests.add(symbol);

    try {
      const response = await fetch(`/api/eodhd-price?symbol=${symbol}`);
      
      if (response.status === 429) {
        // Rate limited - update status and retry later
        updateSubscribers(symbol, {
          symbol,
          displayName,
          price: globalPriceCache.get(symbol)?.price || 0,
          change: 0,
          changePercent: 0,
          lastUpdate: new Date(),
          status: 'disconnected',
        });
        return;
      }

      if (response.ok) {
        const data = await response.json();
        if (data.prices && data.prices.length > 0) {
          const priceInfo = data.prices[0];
          const currentData = globalPriceCache.get(symbol);
          const change = currentData ? priceInfo.price - currentData.price : priceInfo.change || 0;
          const changePercent = currentData && currentData.price > 0 
            ? (change / currentData.price) * 100 
            : priceInfo.change_percent || 0;

          const newData: PriceData = {
            symbol,
            displayName,
            price: priceInfo.price,
            change,
            changePercent,
            lastUpdate: new Date(),
            status: 'connected',
          };

          // Update global cache
          globalPriceCache.set(symbol, newData);
          
          // Notify subscribers
          updateSubscribers(symbol, newData);
        }
      } else {
        // API error - mark as disconnected
        updateSubscribers(symbol, {
          symbol,
          displayName,
          price: globalPriceCache.get(symbol)?.price || 0,
          change: 0,
          changePercent: 0,
          lastUpdate: new Date(),
          status: 'disconnected',
        });
      }
    } catch (error) {
      console.error(`Failed to fetch price for ${symbol}:`, error);
      updateSubscribers(symbol, {
        symbol,
        displayName,
        price: globalPriceCache.get(symbol)?.price || 0,
        change: 0,
        changePercent: 0,
        lastUpdate: new Date(),
        status: 'disconnected',
      });
    } finally {
      pendingRequests.delete(symbol);
    }
  };

  // Update all subscribers for a symbol
  const updateSubscribers = (symbol: string, data: PriceData) => {
    const symbolSubscribers = subscribers.get(symbol);
    if (symbolSubscribers) {
      symbolSubscribers.forEach(callback => callback(data));
    }
  };

  // Set up periodic updates
  useEffect(() => {
    if (!enabled) return;

    // Initial fetch
    fetchPrices();

    // Set up interval
    intervalRef.current = setInterval(fetchPrices, updateInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [symbols, updateInterval, enabled]);

  return {
    priceData,
    isLoading,
    refetch: fetchPrices,
  };
}
