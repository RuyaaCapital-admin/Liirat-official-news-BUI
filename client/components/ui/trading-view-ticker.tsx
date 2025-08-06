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
        "displayMode": "regular",
        "autosize": false,
        "width": "580",
        "height": "72"
      }`;

    container.current.appendChild(script);
  }, []);

  return (
    <div className={cn("w-full flex justify-center border-b border-border bg-card", className)}>
      <div className="tradingview-widget-container relative overflow-hidden" style={{ maxWidth: '580px', width: '580px', height: '72px' }} ref={container}>
      <div className="tradingview-widget-container__widget relative">
        {/* Invisible overlay to completely disable all clicks and interactions */}
        <div
          className="absolute inset-0 z-50 cursor-default bg-transparent"
          onPointerDown={(e) => e.preventDefault()}
          onPointerUp={(e) => e.preventDefault()}
          onClick={(e) => e.preventDefault()}
          onMouseDown={(e) => e.preventDefault()}
          onMouseUp={(e) => e.preventDefault()}
          onTouchStart={(e) => e.preventDefault()}
          onTouchEnd={(e) => e.preventDefault()}
          style={{
            pointerEvents: 'auto',
            userSelect: 'none',
            WebkitUserSelect: 'none'
          }}
        />
      </div>

      {/* Global styles to hide branding and disable interactions */}
      <style>{`
        /* Completely disable iframe interactions */
        .tradingview-widget-container iframe {
          pointer-events: none !important;
          user-select: none !important;
          -webkit-user-select: none !important;
        }

        /* Hide copyright text completely - never show it */
        .tradingview-widget-copyright,
        .tradingview-widget-container .tradingview-widget-copyright {
          display: none !important;
          visibility: hidden !important;
          height: 0 !important;
          width: 0 !important;
          overflow: hidden !important;
          position: absolute !important;
          left: -9999px !important;
          opacity: 0 !important;
        }

        /* Hide any branding inside the iframe content */
        .tradingview-widget-container {
          position: relative;
          overflow: hidden;
        }

        /* Hide TradingView logo - aggressive overlays */
        .tradingview-widget-container::after {
          content: '';
          position: absolute;
          bottom: 0;
          right: 0;
          background: var(--card);
          width: 200px;
          height: 100%;
          z-index: 999;
          pointer-events: none;
          display: block;
        }

        .tradingview-widget-container::before {
          content: '';
          position: absolute;
          top: 0;
          right: 0;
          background: var(--background);
          width: 180px;
          height: 100%;
          z-index: 998;
          pointer-events: none;
          display: block;
        }

        /* Additional overlay for logo area */
        .tradingview-widget-container .tradingview-widget-container__widget::after {
          content: '';
          position: absolute;
          top: 0;
          right: 0;
          bottom: 0;
          background: var(--card);
          width: 120px;
          z-index: 1000;
          pointer-events: none;
          display: block !important;
        }

        /* Crop the iframe to hide right side */
        .tradingview-widget-container {
          clip-path: inset(0 120px 0 0) !important;
        }

        .tradingview-widget-container iframe {
          width: 700px !important;
          margin-right: -120px !important;
        }

        /* Force scrolling by constraining width */
        .tradingview-widget-container {
          max-width: 580px !important;
          width: 580px !important;
          overflow: hidden !important;
        }

        .tradingview-widget-container iframe {
          min-width: 700px !important;
          animation: none !important;
          transition: none !important;
        }

        .tradingview-widget-container * {
          animation-play-state: running !important;
          pointer-events: none !important;
        }

        /* Hide any potential branding elements */
        .tradingview-widget-container [class*="logo"],
        .tradingview-widget-container [class*="brand"],
        .tradingview-widget-container [class*="attribution"],
        .tradingview-widget-container a[href*="tradingview"] {
          display: none !important;
          visibility: hidden !important;
          opacity: 0 !important;
        }
      `}</style>
      </div>
    </div>
  );
}

export default memo(TradingViewTicker);
