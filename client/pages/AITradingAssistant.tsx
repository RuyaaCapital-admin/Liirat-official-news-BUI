import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import { Send, Bot, User, TrendingUp, Newspaper, BarChart3, Settings, RefreshCw } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  type?: 'text' | 'analysis' | 'strategy' | 'news';
}

interface MarketData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
}

interface NewsItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  publishedAt: string;
  impact: 'high' | 'medium' | 'low';
}

const AITradingAssistant: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m your AI trading assistant. I can help you analyze markets, provide trading strategies, and keep you updated with the latest news. What would you like to know about today?',
      timestamp: new Date(),
      type: 'text'
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSymbol, setSelectedSymbol] = useState('XAUUSD');
  const [marketData, setMarketData] = useState<MarketData[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [chartWidget, setChartWidget] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const popularSymbols = ['XAUUSD', 'BTCUSD', 'EURUSD', 'GBPUSD', 'USDJPY', 'SPX500'];

  useEffect(() => {
    scrollToBottom();
    initializeTradingView();
    fetchMarketData();
    fetchNews();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const initializeTradingView = () => {
    if (typeof window !== 'undefined' && (window as any).TradingView) {
      const widget = new (window as any).TradingView.widget({
        symbol: selectedSymbol,
        interval: 'D',
        timezone: 'Etc/UTC',
        theme: 'dark',
        style: '1',
        locale: 'en',
        toolbar_bg: '#f1f3f6',
        enable_publishing: false,
        allow_symbol_change: true,
        container_id: 'tradingview_chart',
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
        studies_overrides: {}
      });
      setChartWidget(widget);
    }
  };

  const fetchMarketData = async () => {
    try {
      const response = await fetch('/api/market-data');
      const data = await response.json();
      setMarketData(data);
    } catch (error) {
      console.error('Error fetching market data:', error);
    }
  };

  const fetchNews = async () => {
    try {
      const response = await fetch('/api/news');
      const data = await response.json();
      setNews(data);
    } catch (error) {
      console.error('Error fetching news:', error);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date(),
      type: 'text'
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputMessage,
          symbol: selectedSymbol,
          marketData,
          news
        }),
      });

      const data = await response.json();
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
        type: data.type || 'text'
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to get AI response. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const addIndicator = (indicator: string) => {
    if (chartWidget) {
      // This would integrate with TradingView widget API
      toast({
        title: "Indicator Added",
        description: `${indicator} has been added to the chart.`,
      });
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">AI Trading Assistant</h1>
          <p className="text-gray-300">Your intelligent companion for market analysis and trading strategies</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chat Interface */}
          <div className="lg:col-span-1">
            <Card className="h-[600px] bg-slate-800/50 border-slate-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-white flex items-center gap-2">
                  <Bot className="h-5 w-5" />
                  AI Assistant
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Chat with your AI trading companion
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="flex flex-col h-[500px]">
                  <ScrollArea className="flex-1 px-4">
                    <div className="space-y-4">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-lg p-3 ${
                              message.role === 'user'
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-700 text-gray-100'
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              {message.role === 'user' ? (
                                <User className="h-4 w-4" />
                              ) : (
                                <Bot className="h-4 w-4" />
                              )}
                              <span className="text-xs opacity-70">
                                {message.timestamp.toLocaleTimeString()}
                              </span>
                            </div>
                            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          </div>
                        </div>
                      ))}
                      {isLoading && (
                        <div className="flex justify-start">
                          <div className="bg-slate-700 text-gray-100 rounded-lg p-3">
                            <div className="flex items-center gap-2">
                              <Bot className="h-4 w-4" />
                              <div className="flex space-x-1">
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>
                  <Separator className="my-2" />
                  <div className="p-4">
                    <div className="flex gap-2">
                      <Textarea
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Ask about market analysis, trading strategies, or news..."
                        className="flex-1 bg-slate-700 border-slate-600 text-white placeholder-gray-400 resize-none"
                        rows={2}
                      />
                      <Button
                        onClick={sendMessage}
                        disabled={isLoading || !inputMessage.trim()}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chart and Market Data */}
          <div className="lg:col-span-2 space-y-6">
            {/* TradingView Chart */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <CardTitle className="text-white">Market Chart</CardTitle>
                    <div className="flex gap-2">
                      {popularSymbols.map((symbol) => (
                        <Button
                          key={symbol}
                          variant={selectedSymbol === symbol ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedSymbol(symbol)}
                          className="text-xs"
                        >
                          {symbol}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addIndicator('SMA')}
                      className="text-xs"
                    >
                      +SMA
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addIndicator('RSI')}
                      className="text-xs"
                    >
                      +RSI
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addIndicator('MACD')}
                      className="text-xs"
                    >
                      +MACD
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div id="tradingview_chart" className="h-[400px]"></div>
              </CardContent>
            </Card>

            {/* Market Data and News */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Market Data */}
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader className="pb-3">
                  <CardTitle className="text-white flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Market Data
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-3">
                      {marketData.map((item) => (
                        <div key={item.symbol} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                          <div>
                            <p className="font-semibold text-white">{item.symbol}</p>
                            <p className="text-sm text-gray-400">Vol: {item.volume.toLocaleString()}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-white">${item.price.toFixed(2)}</p>
                            <p className={`text-sm ${item.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {item.change >= 0 ? '+' : ''}{item.change.toFixed(2)} ({item.changePercent.toFixed(2)}%)
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* News Feed */}
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader className="pb-3">
                  <CardTitle className="text-white flex items-center gap-2">
                    <Newspaper className="h-5 w-5" />
                    Latest News
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-3">
                      {news.map((item) => (
                        <div key={item.id} className="p-3 bg-slate-700/50 rounded-lg">
                          <div className="flex items-start gap-2">
                            <div className={`w-2 h-2 rounded-full mt-2 ${getImpactColor(item.impact)}`}></div>
                            <div className="flex-1">
                              <p className="font-semibold text-white text-sm mb-1">{item.title}</p>
                              <p className="text-xs text-gray-400 mb-2">{item.summary}</p>
                              <div className="flex items-center justify-between text-xs text-gray-500">
                                <span>{item.source}</span>
                                <span>{new Date(item.publishedAt).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* TradingView Widget Script */}
      <script
        type="text/javascript"
        src="https://s3.tradingview.com/tv.js"
        onLoad={initializeTradingView}
      />
    </div>
  );
};

export default AITradingAssistant;