import React, { useEffect, useRef } from 'react';

interface TradingViewWidgetProps {
  symbol: string;
  interval?: string;
  theme?: 'light' | 'dark';
  style?: string;
  width?: string | number;
  height?: string | number;
  className?: string;
}

const TradingViewWidget: React.FC<TradingViewWidgetProps> = ({
  symbol,
  interval = 'D',
  theme = 'light',
  style = '1',
  width = '100%',
  height = '400px',
  className = ''
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<any>(null);

  useEffect(() => {
    const loadTradingViewWidget = () => {
      if (typeof window !== 'undefined' && (window as any).TradingView && containerRef.current) {
        // Clear previous widget
        if (containerRef.current) {
          containerRef.current.innerHTML = '';
        }

        // Create new widget
        widgetRef.current = new (window as any).TradingView.widget({
          symbol: symbol,
          interval: interval,
          timezone: 'Etc/UTC',
          theme: theme,
          style: style,
          locale: 'en',
          toolbar_bg: theme === 'dark' ? '#1a1a1a' : '#f1f3f6',
          enable_publishing: false,
          allow_symbol_change: true,
          container_id: containerRef.current.id,
          studies: [
            'MASimple@tv-basicstudies',
            'RSI@tv-basicstudies',
            'MACD@tv-basicstudies'
          ],
          disabled_features: ['use_localstorage_for_settings'],
          enabled_features: ['study_templates'],
          charts_storage_url: 'https://saveload.tradingview.com',
          charts_storage_api_version: '1.1',
          client_id: 'tradingview.com',
          user_id: 'public_user_id',
          fullscreen: false,
          autosize: true,
          studies_overrides: {},
          overrides: theme === 'dark' ? {
            "paneProperties.background": "#0a0a0a",
            "paneProperties.vertGridProperties.color": "#1a1a1a",
            "paneProperties.horzGridProperties.color": "#1a1a1a",
            "symbolWatermarkProperties.transparency": 90,
            "scalesProperties.textColor": "#AAA",
            "mainSeriesProperties.candleStyle.upColor": "#26a69a",
            "mainSeriesProperties.candleStyle.downColor": "#ef5350",
            "mainSeriesProperties.candleStyle.drawWick": true,
            "mainSeriesProperties.candleStyle.drawBorder": true,
            "mainSeriesProperties.candleStyle.borderUpColor": "#26a69a",
            "mainSeriesProperties.candleStyle.borderDownColor": "#ef5350",
            "mainSeriesProperties.candleStyle.wickUpColor": "#26a69a",
            "mainSeriesProperties.candleStyle.wickDownColor": "#ef5350"
          } : {}
        });
      }
    };

    // Load TradingView script if not already loaded
    if (typeof window !== 'undefined' && !(window as any).TradingView) {
      const script = document.createElement('script');
      script.src = 'https://s3.tradingview.com/tv.js';
      script.async = true;
      script.onload = () => {
        // Wait a bit for TradingView to initialize
        setTimeout(loadTradingViewWidget, 100);
      };
      document.head.appendChild(script);
    } else {
      // TradingView already loaded, create widget immediately
      loadTradingViewWidget();
    }

    // Cleanup function
    return () => {
      if (widgetRef.current && containerRef.current) {
        containerRef.current.innerHTML = '';
        widgetRef.current = null;
      }
    };
  }, [symbol, interval, theme, style]);

  // Generate unique ID for container
  const containerId = `tradingview_${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div
      id={containerId}
      ref={containerRef}
      className={className}
      style={{ width, height }}
    />
  );
};

export default TradingViewWidget;