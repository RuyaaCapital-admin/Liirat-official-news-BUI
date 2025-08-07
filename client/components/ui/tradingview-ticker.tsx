import React, { useEffect, useRef } from 'react';
import { useTheme } from '@/hooks/use-theme';

interface TradingViewTickerProps {
  className?: string;
}

const TradingViewTicker: React.FC<TradingViewTickerProps> = ({ className = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();

  useEffect(() => {
    const createWidget = () => {
      if (containerRef.current) {
        // Clear previous widget
        containerRef.current.innerHTML = '';
        
        // Create script element for TradingView widget
        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.async = true;
        script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js';
        
        // Widget configuration
        const config = {
          symbols: [
            {
              proName: "FOREXCOM:SPXUSD",
              title: "S&P 500"
            },
            {
              proName: "FOREXCOM:NSXUSD",
              title: "US 100"
            },
            {
              proName: "FX_IDC:EURUSD",
              title: "EUR/USD"
            },
            {
              proName: "FX_IDC:GBPUSD",
              title: "GBP/USD"
            },
            {
              proName: "FX_IDC:USDJPY",
              title: "USD/JPY"
            },
            {
              proName: "FX_IDC:USDCHF",
              title: "USD/CHF"
            },
            {
              proName: "FX_IDC:AUDUSD",
              title: "AUD/USD"
            },
            {
              proName: "FX_IDC:USDCAD",
              title: "USD/CAD"
            },
            {
              proName: "BITSTAMP:BTCUSD",
              title: "Bitcoin"
            },
            {
              proName: "BITSTAMP:ETHUSD",
              title: "Ethereum"
            },
            {
              proName: "TVC:GOLD",
              title: "Gold"
            },
            {
              proName: "NYMEX:CL1!",
              title: "Oil"
            }
          ],
          showSymbolLogo: false,
          isTransparent: theme === 'dark',
          displayMode: "adaptive",
          colorTheme: theme === 'dark' ? 'dark' : 'light',
          locale: "en",
          largeChartUrl: ""
        };

        script.innerHTML = JSON.stringify(config);
        containerRef.current.appendChild(script);
      }
    };

    // Small delay to ensure DOM is ready
    const timer = setTimeout(createWidget, 100);

    return () => {
      clearTimeout(timer);
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [theme]);

  return (
    <div className={`tradingview-widget-container ${className}`}>
      <div
        ref={containerRef}
        className="tradingview-widget-container__widget relative"
        style={{
          height: '50px',
          width: '100%',
          pointerEvents: 'none' // Disable all clicks
        }}
      />

      {/* CSS to hide TradingView logo and disable clicks */}
      <style jsx>{`
        .tradingview-widget-container iframe {
          pointer-events: none !important;
        }

        .tradingview-widget-container [class*="copyright"],
        .tradingview-widget-container [class*="logo"],
        .tradingview-widget-container [href*="tradingview"],
        .tradingview-widget-container a[target="_blank"] {
          display: none !important;
          visibility: hidden !important;
          opacity: 0 !important;
        }

        .tradingview-widget-container * {
          pointer-events: none !important;
          cursor: default !important;
        }
      `}</style>
    </div>
  );
};

export default TradingViewTicker;
