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
        "autosize": true,
        "speed": 80,
        "animationSpeed": "fast"
      }`;

    container.current.appendChild(script);
  }, []);

  return (
    <div className={cn("w-full flex justify-center border-b border-border bg-card", className)}>
      <div className="tradingview-widget-container relative overflow-hidden" style={{ maxWidth: '580px', width: '580px' }} ref={container}>
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

        /* Hide TradingView logo - multiple overlay blocks */
        .tradingview-widget-container::after {
          content: '';
          position: absolute;
          bottom: 0;
          right: 0;
          background: var(--card);
          width: 250px;
          height: 50px;
          z-index: 25;
          pointer-events: none;
        }

        .tradingview-widget-container::before {
          content: '';
          position: absolute;
          top: 0;
          right: 0;
          background: var(--card);
          width: 300px;
          height: 100%;
          z-index: 24;
          pointer-events: none;
        }

        /* Additional right-side logo hiding - cover entire right area */
        .tradingview-widget-container .tradingview-widget-container__widget::after {
          content: '';
          position: absolute;
          top: 0;
          right: 0;
          bottom: 0;
          background: var(--card);
          width: 150px;
          z-index: 30;
          pointer-events: none;
        }

        /* Extra aggressive right-side masking */
        .tradingview-widget-container iframe {
          mask: linear-gradient(to right, white 0%, white 70%, transparent 100%) !important;
          -webkit-mask: linear-gradient(to right, white 0%, white 70%, transparent 100%) !important;
        }

        /* Force continuous scrolling and prevent hover pause */
        .tradingview-widget-container iframe {
          animation: none !important;
          transition: none !important;
        }

        .tradingview-widget-container * {
          animation-play-state: running !important;
          animation-duration: inherit !important;
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
