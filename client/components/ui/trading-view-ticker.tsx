import React, { useEffect, useRef, memo } from "react";
import { cn } from "@/lib/utils";

interface TradingViewTickerProps {
  className?: string;
}

function TradingViewTicker({ className }: TradingViewTickerProps) {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!container.current) return;

    const script = document.createElement("script");
    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js";
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
            "proName": "OANDA:GBPUSD",
            "title": "GBPUSD"
          },
          {
            "proName": "OANDA:USDJPY",
            "title": "USDJPY"
          },
          {
            "proName": "CME_MINI:ES1!",
            "title": "ES"
          },
          {
            "proName": "TVC:DXY",
            "title": "DXY"
          }
        ],
        "colorTheme": "dark",
        "locale": "en",
        "largeChartUrl": "",
        "isTransparent": false,
        "showSymbolLogo": true,
        "displayMode": "regular"
      }`;

    container.current.appendChild(script);
  }, []);

  return (
    <div
      className={cn(
        "w-full border-b border-border bg-card relative block",
        className,
      )}
      style={{ minHeight: "60px" }}
    >
      <div
        className="tradingview-widget-container relative overflow-hidden"
        style={{ width: "100%", maxWidth: "100vw" }}
        ref={container}
      >
        <div className="tradingview-widget-container__widget relative">
          {/* Minimal click prevention for logo area only */}
          <div
            className="click-blocker"
            onClick={(e) => e.preventDefault()}
            onMouseDown={(e) => e.preventDefault()}
            onTouchStart={(e) => e.preventDefault()}
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
          
          /* Hide TradingView logo - aggressive coverage */
          .tradingview-widget-container::after {
            content: '';
            position: absolute;
            bottom: 0;
            right: 0;
            background: var(--card);
            width: 250px;
            height: 100%;
            z-index: 50;
            pointer-events: auto;
            cursor: default;
          }

          .tradingview-widget-container::before {
            content: '';
            position: absolute;
            top: 0;
            right: 0;
            background: var(--background);
            width: 200px;
            height: 100%;
            z-index: 49;
            pointer-events: auto;
            cursor: default;
          }

          /* Use masking to fade out the right side completely */
          .tradingview-widget-container {
            -webkit-mask: linear-gradient(to right, black 0%, black 80%, transparent 100%);
            mask: linear-gradient(to right, black 0%, black 80%, transparent 100%);
            overflow: hidden !important;
          }

          /* Block all interactions in the right area */
          .tradingview-widget-container .click-blocker {
            position: absolute;
            top: 0;
            right: 0;
            width: 300px;
            height: 100%;
            z-index: 60;
            pointer-events: auto;
            background: transparent;
          }
          
          /* Allow natural ticker scrolling */
          .tradingview-widget-container {
            width: 100% !important;
            overflow: hidden !important;
            position: relative !important;
          }

          .tradingview-widget-container iframe {
            width: 100% !important;
            height: auto !important;
            min-height: 60px !important;
            border: none !important;
          }

          /* Ensure ticker visibility during scroll */
          .tradingview-widget-container {
            position: relative !important;
            z-index: 1 !important;
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
          }

          /* Mobile responsiveness */
          @media (max-width: 768px) {
            .tradingview-widget-container {
              min-height: 50px !important;
            }

            .tradingview-widget-container iframe {
              min-height: 50px !important;
            }
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
