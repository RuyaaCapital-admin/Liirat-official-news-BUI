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
        "displayMode": "adaptive",
        "autosize": true
      }`;

    container.current.appendChild(script);
  }, []);

  return (
    <div className={cn("tradingview-widget-container border-b border-border bg-card relative overflow-hidden", className)} ref={container}>
      <div className="tradingview-widget-container__widget relative">
        {/* Invisible overlay to disable all clicks */}
        <div className="absolute inset-0 z-10 cursor-default"
             onClick={(e) => e.preventDefault()}
             onMouseDown={(e) => e.preventDefault()}
             style={{ pointerEvents: 'auto' }}
        />
      </div>

      {/* Custom styling to hide branding and enable smooth scrolling */}
      <style jsx>{`
        .tradingview-widget-container iframe {
          pointer-events: none !important;
        }

        /* Hide the copyright text completely */
        .tradingview-widget-copyright {
          display: none !important;
          visibility: hidden !important;
          height: 0 !important;
          overflow: hidden !important;
        }

        /* Hide TradingView branding inside iframe */
        .tradingview-widget-container iframe::after {
          content: '';
          position: absolute;
          bottom: 0;
          right: 0;
          background: var(--card);
          width: 100px;
          height: 20px;
          z-index: 1000;
        }
      `}</style>
    </div>
  );
}

export default memo(TradingViewTicker);
