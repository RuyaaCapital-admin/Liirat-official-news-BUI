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
import { ThemeToggle } from '@/components/ui/theme-toggle';
import TradingViewWidget from '@/components/ui/tradingview-widget';
import { Send, Bot, User, TrendingUp, Newspaper, BarChart3, Settings, RefreshCw, MessageCircle, Brain, Zap, Home, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTheme } from '@/hooks/use-theme';

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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { theme } = useTheme();

  const popularSymbols = ['XAUUSD', 'BTCUSD', 'EURUSD', 'GBPUSD', 'USDJPY', 'SPX500'];

  useEffect(() => {
    scrollToBottom();
    fetchMarketData();
    fetchNews();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMarketData = async () => {
    try {
      const response = await fetch('/api/market-data');
      if (!response.ok) {
        throw new Error('Failed to fetch market data');
      }
      const data = await response.json();
      setMarketData(data);
    } catch (error) {
      console.error('Error fetching market data:', error);
      // Set mock data as fallback
      setMarketData([
        { symbol: 'XAUUSD', price: 2034.50, change: 12.30, changePercent: 0.61, volume: 125000 },
        { symbol: 'BTCUSD', price: 43250.75, change: -1250.25, changePercent: -2.81, volume: 890000 },
        { symbol: 'EURUSD', price: 1.0856, change: 0.0023, changePercent: 0.21, volume: 450000 },
        { symbol: 'GBPUSD', price: 1.2645, change: -0.0089, changePercent: -0.70, volume: 320000 },
        { symbol: 'USDJPY', price: 148.23, change: 0.45, changePercent: 0.30, volume: 280000 },
        { symbol: 'SPX500', price: 4850.25, change: 15.75, changePercent: 0.33, volume: 2100000 }
      ]);
    }
  };

  const fetchNews = async () => {
    try {
      const response = await fetch('/api/news');
      if (!response.ok) {
        throw new Error('Failed to fetch news');
      }
      const data = await response.json();
      setNews(data);
    } catch (error) {
      console.error('Error fetching news:', error);
      // Set mock news as fallback
      setNews([
        {
          id: '1',
          title: 'Federal Reserve Signals Potential Rate Cuts in 2024',
          summary: 'The Federal Reserve has indicated a more dovish stance, suggesting potential interest rate cuts in the coming year.',
          source: 'Reuters',
          publishedAt: '2024-01-15T10:30:00Z',
          impact: 'high'
        },
        {
          id: '2',
          title: 'Bitcoin ETF Approval Expected This Week',
          summary: 'Major cryptocurrency ETFs are expected to receive regulatory approval, potentially boosting institutional adoption.',
          source: 'Bloomberg',
          publishedAt: '2024-01-15T09:15:00Z',
          impact: 'high'
        },
        {
          id: '3',
          title: 'Gold Prices Reach New Highs Amid Economic Uncertainty',
          summary: 'Gold prices have surged to record levels as investors seek safe-haven assets during market volatility.',
          source: 'CNBC',
          publishedAt: '2024-01-15T08:45:00Z',
          impact: 'medium'
        }
      ]);
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
    const currentMessage = inputMessage;
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: currentMessage,
          symbol: selectedSymbol,
          marketData,
          news
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

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
      console.error('AI Chat Error:', error);
      toast({
        title: "Error",
        description: "Failed to get AI response. Please try again.",
        variant: "destructive",
      });
      
      // Add fallback response
      const fallbackMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I apologize, but I'm experiencing technical difficulties. Please check your internet connection and try again. You can also try asking about market analysis, trading strategies, or current market conditions.",
        timestamp: new Date(),
        type: 'text'
      };
      setMessages(prev => [...prev, fallbackMessage]);
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
    toast({
      title: "Indicator Added",
      description: `${indicator} has been added to the chart.`,
    });
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
    <div className="min-h-screen bg-background">
      {/* Navigation Header */}
      <header className="border-b border-border/40 backdrop-blur-md bg-background/95 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link to="/" className="flex items-center gap-3 text-foreground hover:text-primary transition-colors">
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Home</span>
            </Link>
          </div>
          
          <div className="flex items-center gap-4">
            <img
              src="/liirat-logo.png"
              alt="Liirat News"
              className="h-12 w-auto"
            />
          </div>
          
          <div className="flex items-center gap-3">
            <Badge className="bg-primary/20 text-primary border border-primary/30">
              <Brain className="h-4 w-4 mr-1" />
              AI Trading
            </Badge>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="bg-card border border-border rounded-3xl p-8 mb-6 shadow-lg">
            <h1 className="text-4xl font-bold text-foreground mb-3">AI Trading Assistant</h1>
            <p className="text-lg text-muted-foreground">Your intelligent companion for market analysis and trading strategies</p>
            <div className="flex justify-center gap-4 mt-4">
              <Badge className="bg-primary/20 text-primary border border-primary/30">
                <Brain className="h-4 w-4 mr-1" />
                Powered by GPT-4
              </Badge>
              <Badge className="bg-accent/20 text-accent-foreground border border-accent/30">
                <Zap className="h-4 w-4 mr-1" />
                Live Data
              </Badge>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Chat Interface */}
          <div className="lg:col-span-1">
            <Card className="h-[700px]">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                    <Bot className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">AI Assistant</CardTitle>
                    <CardDescription>Chat with your trading companion</CardDescription>
                  </div>
                </div>
              </CardHeader>
              
              <div className="flex flex-col h-[580px]">
                <ScrollArea className="flex-1 px-6">
                  <div className="space-y-4 py-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-2xl p-4 ${
                            message.role === 'user'
                              ? 'bg-primary/20 text-primary-foreground border border-primary/30'
                              : 'bg-muted/50 text-foreground border border-border/50'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-2">
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
                        <div className="bg-muted/50 rounded-2xl p-4 border border-border/50">
                          <div className="flex items-center gap-2">
                            <Bot className="h-4 w-4 text-primary" />
                            <div className="flex space-x-1">
                              <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
                
                <div className="p-6 border-t border-border">
                  <div className="flex gap-3">
                    <Textarea
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Ask about market analysis, trading strategies, or news..."
                      className="flex-1 resize-none rounded-2xl"
                      rows={2}
                    />
                    <Button
                      onClick={sendMessage}
                      disabled={isLoading || !inputMessage.trim()}
                      className="px-6 rounded-2xl"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Chart and Market Data */}
          <div className="lg:col-span-2 space-y-8">
            {/* TradingView Chart */}
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <CardTitle className="text-xl">Market Chart</CardTitle>
                    <div className="flex gap-2">
                      {popularSymbols.map((symbol) => (
                        <Button
                          key={symbol}
                          variant={selectedSymbol === symbol ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedSymbol(symbol)}
                          className="text-xs rounded-xl"
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
                      className="text-xs rounded-xl"
                    >
                      +SMA
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addIndicator('RSI')}
                      className="text-xs rounded-xl"
                    >
                      +RSI
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addIndicator('MACD')}
                      className="text-xs rounded-xl"
                    >
                      +MACD
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <TradingViewWidget 
                  symbol={selectedSymbol}
                  theme={theme}
                  height="400px"
                  className="w-full rounded-xl overflow-hidden"
                />
              </CardContent>
            </Card>

            {/* Market Data and News */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Market Data */}
              <Card>
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                      <TrendingUp className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-xl">Market Data</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-3">
                      {marketData.map((item) => (
                        <div key={item.symbol} className="bg-muted/50 rounded-2xl p-4 border border-border/50">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold text-foreground">{item.symbol}</p>
                              <p className="text-sm text-muted-foreground">Vol: {item.volume.toLocaleString()}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-foreground">${item.price.toFixed(2)}</p>
                              <p className={`text-sm ${item.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                {item.change >= 0 ? '+' : ''}{item.change.toFixed(2)} ({item.changePercent.toFixed(2)}%)
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* News Feed - Now with Real TradingView News Widget */}
              <Card>
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                      <Newspaper className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-xl">Latest News</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] rounded-xl overflow-hidden">
                    <div 
                      className="tradingview-widget-container"
                      style={{ height: '100%', width: '100%' }}
                    >
                      <div className="tradingview-widget-container__widget" style={{ height: 'calc(100% - 32px)', width: '100%' }}>
                        <iframe 
                          src={`https://s.tradingview.com/embed-widget/timeline/?locale=en#%7B%22feedMode%22%3A%22market%22%2C%22market%22%3A%22crypto%22%2C%22isTransparent%22%3A${theme === 'dark' ? 'true' : 'false'}%2C%22displayMode%22%3A%22adaptive%22%2C%22width%22%3A%22100%25%22%2C%22height%22%3A%22100%25%22%2C%22colorTheme%22%3A%22${theme}%22%2C%22utm_source%22%3A%22liirat.com%22%2C%22utm_medium%22%3A%22widget_new%22%2C%22utm_campaign%22%3A%22timeline%22%7D`}
                          style={{ 
                            width: '100%', 
                            height: '100%', 
                            border: 'none',
                            backgroundColor: theme === 'dark' ? 'transparent' : '#ffffff'
                          }}
                          frameBorder="0"
                          allowTransparency={theme === 'dark'}
                          scrolling="no"
                          allowFullScreen
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>


    </div>
  );
};

export default AITradingAssistant;