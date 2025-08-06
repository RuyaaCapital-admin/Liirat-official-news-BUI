import React, { useEffect, useRef, memo } from "react";
import { cn } from "@/lib/utils";

interface TradingViewTickerProps {
  className?: string;
}

function TradingViewTicker({ className }: TradingViewTickerProps) {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!container.current) return;

    // Clear any existing content
    container.current.innerHTML = '';

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
        "showSymbolLogo": false,
        "isTransparent": false,
        "displayMode": "regular",
        "colorTheme": "dark",
        "locale": "en",
        "largeChartUrl": ""
      }`;

    script.onload = () => {
      // Allow some time for the widget to initialize
      setTimeout(() => {
        // Ensure iframe allows animations
        const iframe = container.current?.querySelector('iframe');
        if (iframe) {
          iframe.style.pointerEvents = 'none';
          iframe.style.overflow = 'hidden';
        }
      }, 1000);
    };

    script.onerror = () => {
      console.warn('TradingView widget failed to load');
    };

    container.current.appendChild(script);

    // Clean up function
    return () => {
      if (container.current) {
        container.current.innerHTML = '';
      }
    };
  }, []);

  return (
    <div
      className={cn(
        "w-full border-b border-border bg-card relative overflow-hidden",
        className,
      )}
      style={{ minHeight: "60px" }}
    >
      <div
        className="tradingview-widget-container w-full"
        ref={container}
        style={{ 
          height: "60px", 
          width: "100%",
          position: "relative"
        }}
      >
        <div className="tradingview-widget-container__widget">
          {/* Strong logo blocking overlay */}
          <div
            className="absolute top-0 right-0 h-full z-[200]"
            style={{
              width: "200px",
              background: "var(--background)",
              pointerEvents: "auto"
            }}
          />

          {/* Additional overlay for complete coverage */}
          <div
            className="absolute top-0 right-0 h-full z-[199]"
            style={{
              width: "160px",
              background: "var(--card)",
              pointerEvents: "auto"
            }}
          />

          {/* Gradient fade for light/dark theme compatibility */}
          <div
            className="absolute top-0 right-0 h-full z-[198]"
            style={{
              width: "250px",
              background: "linear-gradient(to left, var(--background) 0%, var(--background) 70%, transparent 100%)",
              pointerEvents: "none"
            }}
          />
        </div>

        {/* Global styles for proper ticker display and logo hiding */}
        <style jsx>{`
          .tradingview-widget-container {
            position: relative !important;
            height: 60px !important;
            width: 100% !important;
            display: block !important;
            -webkit-mask: linear-gradient(to right, black 0%, black 80%, transparent 100%);
            mask: linear-gradient(to right, black 0%, black 80%, transparent 100%);
          }

          .tradingview-widget-container iframe {
            width: 100% !important;
            height: 60px !important;
            border: none !important;
            display: block !important;
          }

          /* Hide all TradingView branding and copyright - aggressive approach */
          .tradingview-widget-copyright,
          .tradingview-widget-container .tradingview-widget-copyright,
          [class*="copyright"],
          [data-copyright],
          a[href*="tradingview"],
          [class*="logo"],
          [class*="Logo"],
          [class*="brand"],
          [class*="Brand"],
          [class*="tv-"],
          [data-logo],
          [data-brand] {
            display: none !important;
            visibility: hidden !important;
            opacity: 0 !important;
            position: absolute !important;
            left: -9999px !important;
            width: 0 !important;
            height: 0 !important;
          }

          /* Block right side completely */
          .tradingview-widget-container::after {
            content: "";
            position: absolute;
            top: 0;
            right: 0;
            width: 180px;
            height: 100%;
            background: var(--background);
            z-index: 999;
            pointer-events: auto;
          }

          /* Disable click interactions but allow animations */
          .tradingview-widget-container iframe {
            pointer-events: none !important;
            user-select: none !important;
          }

          /* Mobile responsive */
          @media (max-width: 768px) {
            .tradingview-widget-container {
              height: 50px !important;
            }
            .tradingview-widget-container iframe {
              height: 50px !important;
            }
          }
        `}</style>
      </div>
    </div>
  );
}

export default memo(TradingViewTicker);
