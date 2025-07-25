import React, { useEffect, useState } from 'react';

interface PriceData {
  symbol: string;
  price: string;
}

export const PriceTicker: React.FC = () => {
  const [prices, setPrices] = useState<PriceData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const symbols = [
    { label: 'EUR/USD', url: 'https://api.exchangerate.host/latest?base=EUR&symbols=USD' },
    { label: 'GBP/USD', url: 'https://api.exchangerate.host/latest?base=GBP&symbols=USD' },
    { label: 'USD/JPY', url: 'https://api.exchangerate.host/latest?base=USD&symbols=JPY' },
    { label: 'BTC/USD', url: 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd' },
    { label: 'ETH/USD', url: 'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd' }
  ];

  const fetchPrices = async () => {
    try {
      const pricePromises = symbols.map(async (s) => {
        try {
          const res = await fetch(s.url);
          const data = await res.json();
          let price;
          
          if (s.label.includes('BTC') || s.label.includes('ETH')) {
            price = data[s.label.split('/')[0].toLowerCase()]?.usd;
          } else {
            price = data.rates?.[s.label.split('/')[1]];
          }
          
          return {
            symbol: s.label,
            price: price ? parseFloat(price).toFixed(4) : '--'
          };
        } catch (e) {
          return {
            symbol: s.label,
            price: '--'
          };
        }
      });

      const results = await Promise.all(pricePromises);
      setPrices(results);
      setIsLoading(false);
    } catch (e) {
      // Fallback data
      setPrices([
        { symbol: 'EUR/USD', price: '1.0950' },
        { symbol: 'GBP/USD', price: '1.2750' },
        { symbol: 'USD/JPY', price: '148.50' },
        { symbol: 'BTC/USD', price: '43,250' },
        { symbol: 'ETH/USD', price: '2,650' }
      ]);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const displayText = isLoading 
    ? 'جار تحميل الأسعار...' 
    : prices.map(p => `${p.symbol}: ${p.price}`).join('   •   ');

  return (
    <div 
      className="bg-black text-white py-2 overflow-hidden whitespace-nowrap"
      style={{
        background: '#0d0d0d',
        fontSize: '14px'
      }}
    >
      <div 
        className="inline-block animate-scroll"
        style={{
          animation: 'scroll 30s linear infinite'
        }}
      >
        {displayText}
      </div>
      
      <style jsx>{`
        @keyframes scroll {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        .animate-scroll {
          animation: scroll 30s linear infinite;
        }
      `}</style>
    </div>
  );
};
