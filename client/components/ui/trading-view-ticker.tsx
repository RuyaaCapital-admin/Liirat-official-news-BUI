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
            "title": "S&P 500"
          },
          {
            "proName": "FOREXCOM:NSXUSD",
            "title": "US 100"
          },
          {
            "proName": "FX_IDC:EURUSD",
            "title": "EUR/USD"
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
            "title": "GBP/USD"
          },
          {
            "proName": "OANDA:USDJPY",
            "title": "USD/JPY"
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
        "showSymbolLogo": false,
        "displayMode": "adaptive"
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
          {/* Light mode overlay for better logo hiding */}
          <div className="light-mode-overlay" />
        </div>

        {/* Global styles to hide branding and enable smooth ticker movement */}
        <style>{`
          /* Ensure ticker container allows scrolling */
          .tradingview-widget-container {
            position: relative !important;
            overflow: hidden !important;
            width: 100% !important;
            height: 60px !important;
            display: block !important;
          }

          /* Configure iframe for proper display */
          .tradingview-widget-container iframe {
            width: 100% !important;
            height: 60px !important;
            border: none !important;
            display: block !important;
            pointer-events: none !important;
            user-select: none !important;
            -webkit-user-select: none !important;
          }

          /* Hide copyright text completely */
          .tradingview-widget-copyright,
          .tradingview-widget-container .tradingview-widget-copyright,
          [class*="copyright"],
          [data-copyright] {
            display: none !important;
            visibility: hidden !important;
            height: 0 !important;
            width: 0 !important;
            overflow: hidden !important;
            position: absolute !important;
            left: -9999px !important;
            opacity: 0 !important;
          }

          /* Aggressive symbol and logo hiding */
          .tradingview-widget-container [class*="logo"],
          .tradingview-widget-container [class*="brand"],
          .tradingview-widget-container [class*="attribution"],
          .tradingview-widget-container [class*="symbol"],
          .tradingview-widget-container [class*="Symbol"],
          .tradingview-widget-container [class*="tv-"],
          .tradingview-widget-container a[href*="tradingview"],
          .tradingview-widget-container a[href*="tradingview.com"] {
            display: none !important;
            visibility: hidden !important;
            opacity: 0 !important;
            position: absolute !important;
            left: -9999px !important;
          }

          /* Complete right-side coverage for logo hiding */
          .tradingview-widget-container::after {
            content: '';
            position: absolute;
            top: 0;
            right: 0;
            width: 180px;
            height: 100%;
            background: linear-gradient(to left, var(--background) 0%, var(--background) 80%, transparent 100%);
            z-index: 100;
            pointer-events: auto;
          }

          /* Additional overlay in both themes */
          .tradingview-widget-container::before {
            content: '';
            position: absolute;
            top: 0;
            right: 0;
            width: 120px;
            height: 100%;
            background: var(--card);
            z-index: 99;
            pointer-events: auto;
          }

          /* Masking for smooth fade */
          .tradingview-widget-container {
            -webkit-mask: linear-gradient(to right, black 0%, black 82%, transparent 100%);
            mask: linear-gradient(to right, black 0%, black 82%, transparent 100%);
          }

          /* Light mode specific overlay */
          .tradingview-widget-container .light-mode-overlay {
            position: absolute;
            top: 0;
            right: 0;
            width: 200px;
            height: 100%;
            background: linear-gradient(to left,
              rgba(255,255,255,1) 0%,
              rgba(255,255,255,0.95) 30%,
              rgba(255,255,255,0.8) 60%,
              transparent 100%);
            z-index: 98;
            pointer-events: none;
          }

          /* Click prevention overlay */
          .tradingview-widget-container .click-blocker {
            position: absolute;
            top: 0;
            right: 0;
            width: 250px;
            height: 100%;
            z-index: 101;
            pointer-events: auto;
            background: transparent;
            cursor: default;
          }

          /* Enable animations and scrolling */
          .tradingview-widget-container * {
            animation-play-state: running !important;
          }

          /* Mobile responsiveness */
          @media (max-width: 768px) {
            .tradingview-widget-container {
              height: 50px !important;
            }
            .tradingview-widget-container iframe {
              height: 50px !important;
            }
            .tradingview-widget-container::after {
              width: 150px;
            }
            .tradingview-widget-container::before {
              width: 100px;
            }
            .tradingview-widget-container .light-mode-overlay {
              width: 160px;
            }
            .tradingview-widget-container .click-blocker {
              width: 180px;
            }
          }

          /* Dark mode specific adjustments */
          @media (prefers-color-scheme: dark) {
            .tradingview-widget-container .light-mode-overlay {
              background: linear-gradient(to left,
                rgba(0,0,0,1) 0%,
                rgba(0,0,0,0.95) 30%,
                rgba(0,0,0,0.8) 60%,
                transparent 100%);
            }
          }
        `}</style>
      </div>
    </div>
  );
}

export default memo(TradingViewTicker);
