import React, { useEffect, useRef, memo } from 'react';
import { cn } from "@/lib/utils";

interface TradingViewTickerProps {
  className?: string;
}

function TradingViewTicker({ className }: TradingViewTickerProps) {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!container.current) return;

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = `
      {
        "symbols": [
          {
            "proName": "FOREXCOM:SPXUSD",
            "title": "S&P 500 Index"
          },
          {
            "proName": "FOREXCOM:NSXUSD",
            "title": "US 100 Cash CFD"
          },
          {
            "proName": "FX_IDC:EURUSD",
            "title": "EUR to USD"
          },
          {
            "proName": "BITSTAMP:BTCUSD",
            "title": "Bitcoin"
          },
          {
            "proName": "BITSTAMP:ETHUSD",
            "title": "Ethereum"
          },
          {
            "proName": "CME_MINI:NQ1!",
            "title": "Nasdaq"
          },
          {
            "proName": "OANDA:GBPUSD",
            "title": "GBPUSD"
          },
          {
            "proName": "OANDA:USDJPY",
            "title": "USDJPY"
          }
        ],
        "colorTheme": "dark",
        "locale": "en",
        "largeChartUrl": "",
        "isTransparent": true,
        "showSymbolLogo": true,
        "displayMode": "regular"
      }`;
    
    container.current.appendChild(script);
    
    // Disable clicking on symbols by preventing default click behavior
    const disableClicks = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target.closest('.tradingview-widget-container')) {
        // Allow the copyright link to work but disable symbol clicks
        if (!target.closest('.tradingview-widget-copyright')) {
          e.preventDefault();
          e.stopPropagation();
        }
      }
    };

    // Add click prevention after a short delay to ensure TradingView widget is loaded
    const timeoutId = setTimeout(() => {
      document.addEventListener('click', disableClicks, true);
    }, 2000);

    return () => {
      document.removeEventListener('click', disableClicks, true);
      clearTimeout(timeoutId);
    };
  }, []);

  return (
    <div className={cn("tradingview-widget-container border-b border-border bg-card", className)} ref={container}>
      <div className="tradingview-widget-container__widget"></div>
      <div className="tradingview-widget-copyright">
        <a 
          href="https://www.tradingview.com/" 
          rel="noopener nofollow" 
          target="_blank"
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <span className="blue-text">Ticker tape by TradingView</span>
        </a>
      </div>
    </div>
  );
}

export default memo(TradingViewTicker);
