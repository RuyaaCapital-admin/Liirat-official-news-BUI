import React, { useEffect, useRef } from 'react';

interface MarketDataWidgetProps {
  symbols?: string[];
  width?: string | number;
  height?: string | number;
  className?: string;
}

const MarketDataWidget: React.FC<MarketDataWidgetProps> = ({
  symbols = ['XAUUSD', 'BTCUSD', 'EURUSD', 'GBPUSD', 'USDJPY', 'SPX500'],
  width = '100%',
  height = '300px',
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
          symbol: symbols.join(','),
          interval: 'D',
          timezone: 'Etc/UTC',
          theme: 'dark',
          style: '1',
          locale: 'en',
          toolbar_bg: '#1a1a1a',
          enable_publishing: false,
          allow_symbol_change: true,
          container_id: containerRef.current.id,
          studies: [],
          disabled_features: ['use_localstorage_for_settings'],
          enabled_features: ['study_templates'],
          charts_storage_url: 'https://saveload.tradingview.com',
          charts_storage_api_version: '1.1',
          client_id: 'tradingview.com',
          user_id: 'public_user_id',
          fullscreen: false,
          autosize: true,
          studies_overrides: {},
          overrides: {
            'paneProperties.background': '#1a1a1a',
            'paneProperties.vertGridProperties.color': '#2a2a2a',
            'paneProperties.horzGridProperties.color': '#2a2a2a',
            'symbolWatermarkProperties.transparency': 90,
            'scalesProperties.textColor': '#ffffff'
          }
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
  }, [symbols]);

  // Generate unique ID for container
  const containerId = `market_data_${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div
      id={containerId}
      ref={containerRef}
      className={className}
      style={{ width, height }}
    />
  );
};

export default MarketDataWidget;