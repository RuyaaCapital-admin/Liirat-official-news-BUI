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
          {/* MAXIMUM LOGO BLOCKING - Multiple overlapping layers */}

          {/* Layer 1: Solid background color block */}
          <div
            className="absolute top-0 right-0 h-full z-[300]"
            style={{
              width: "300px",
              backgroundColor: "hsl(var(--background))",
              pointerEvents: "auto"
            }}
          />

          {/* Layer 2: Card background block */}
          <div
            className="absolute top-0 right-0 h-full z-[299]"
            style={{
              width: "280px",
              backgroundColor: "hsl(var(--card))",
              pointerEvents: "auto"
            }}
          />

          {/* Layer 3: White overlay for light mode */}
          <div
            className="absolute top-0 right-0 h-full z-[298]"
            style={{
              width: "260px",
              backgroundColor: "#ffffff",
              pointerEvents: "auto"
            }}
          />

          {/* Layer 4: Dark overlay for dark mode */}
          <div
            className="absolute top-0 right-0 h-full z-[297]"
            style={{
              width: "240px",
              backgroundColor: "#000000",
              pointerEvents: "auto"
            }}
          />

          {/* Layer 5: CSS variable backgrounds */}
          <div
            className="absolute top-0 right-0 h-full z-[296]"
            style={{
              width: "220px",
              background: "var(--background)",
              pointerEvents: "auto"
            }}
          />

          {/* Layer 6: Additional card background */}
          <div
            className="absolute top-0 right-0 h-full z-[295]"
            style={{
              width: "200px",
              background: "var(--card)",
              pointerEvents: "auto"
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
            -webkit-mask: linear-gradient(to right, black 0%, black 75%, transparent 100%);
            mask: linear-gradient(to right, black 0%, black 75%, transparent 100%);
            overflow: hidden !important;
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

          /* Block right side completely - MAXIMUM WIDTH */
          .tradingview-widget-container::after {
            content: "";
            position: absolute;
            top: 0;
            right: 0;
            width: 350px;
            height: 100%;
            background: hsl(var(--background));
            z-index: 9999;
            pointer-events: auto;
          }

          /* Additional before element for double protection */
          .tradingview-widget-container::before {
            content: "";
            position: absolute;
            top: 0;
            right: 0;
            width: 320px;
            height: 100%;
            background: hsl(var(--card));
            z-index: 9998;
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
