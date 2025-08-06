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
          {/* Logo blocking overlay - positioned precisely */}
          <div 
            className="absolute top-0 right-0 h-full bg-card z-[100]"
            style={{ 
              width: "120px",
              background: "var(--card)"
            }}
          />
          
          {/* Gradient fade overlay for seamless blending */}
          <div 
            className="absolute top-0 right-0 h-full z-[99]"
            style={{ 
              width: "180px",
              background: "linear-gradient(to left, var(--card) 0%, var(--card) 60%, transparent 100%)"
            }}
          />
        </div>

        {/* Global styles for proper ticker display and logo hiding */}
        <style jsx>{`
          .tradingview-widget-container {
            position: relative !important;
            overflow: hidden !important;
            height: 60px !important;
            width: 100% !important;
          }

          .tradingview-widget-container iframe {
            width: 100% !important;
            height: 60px !important;
            border: none !important;
            overflow: hidden !important;
          }

          /* Hide all TradingView branding and copyright */
          .tradingview-widget-copyright,
          .tradingview-widget-container .tradingview-widget-copyright,
          [class*="copyright"],
          [data-copyright],
          a[href*="tradingview"] {
            display: none !important;
            visibility: hidden !important;
            opacity: 0 !important;
            position: absolute !important;
            left: -9999px !important;
          }

          /* Disable interactions on iframe */
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
