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
import TradingViewWidget from '@/components/ui/tradingview-widget';
import { Send, Bot, User, TrendingUp, Newspaper, BarChart3, Settings, RefreshCw, MessageCircle, Brain, Zap, Home, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Navigation Header */}
      <header className="neumorphic-header border-b border-gray-700/50 backdrop-blur-md bg-gray-900/95 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link to="/" className="flex items-center gap-3 text-white hover:text-gray-300 transition-colors">
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Home</span>
            </Link>
          </div>
          
          <div className="flex items-center gap-4">
            <img
              src="https://cdn.builder.io/api/v1/assets/8d6e2ebe2191474fb5a6de98317d4278/liirat-official-logo-bf14db?format=webp&width=800"
              alt="Liirat News"
              className="h-10 w-auto"
            />
          </div>
          
          <div className="flex items-center gap-3">
            <Badge className="neumorphic-badge bg-blue-600/20 text-blue-300 border border-blue-500/30">
              <Brain className="h-4 w-4 mr-1" />
              AI Trading
            </Badge>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="neumorphic-card-dark p-8 mb-6">
            <h1 className="text-4xl font-bold text-white mb-3">AI Trading Assistant</h1>
            <p className="text-lg text-gray-300">Your intelligent companion for market analysis and trading strategies</p>
            <div className="flex justify-center gap-4 mt-4">
              <Badge className="neumorphic-badge bg-blue-600/20 text-blue-300 border border-blue-500/30">
                <Brain className="h-4 w-4 mr-1" />
                Powered by GPT-4
              </Badge>
              <Badge className="neumorphic-badge bg-green-600/20 text-green-300 border border-green-500/30">
                <Zap className="h-4 w-4 mr-1" />
                Live Data
              </Badge>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Chat Interface */}
          <div className="lg:col-span-1">
            <div className="neumorphic-card-dark h-[700px]">
              <div className="p-6 border-b border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="neumorphic-icon-dark">
                    <Bot className="h-6 w-6 text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-white">AI Assistant</h2>
                    <p className="text-sm text-gray-400">Chat with your trading companion</p>
                  </div>
                </div>
              </div>
              
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
                              ? 'neumorphic-inset-dark bg-blue-600/20 text-blue-100 border border-blue-500/30'
                              : 'neumorphic-card-dark bg-gray-800/50 text-gray-100 border border-gray-700/50'
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
                        <div className="neumorphic-card-dark bg-gray-800/50 rounded-2xl p-4 border border-gray-700/50">
                          <div className="flex items-center gap-2">
                            <Bot className="h-4 w-4 text-blue-400" />
                            <div className="flex space-x-1">
                              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
                
                <div className="p-6 border-t border-gray-700">
                  <div className="flex gap-3">
                    <Textarea
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Ask about market analysis, trading strategies, or news..."
                      className="flex-1 neumorphic-inset-dark bg-gray-800/50 border-0 resize-none rounded-2xl text-white placeholder-gray-400"
                      rows={2}
                    />
                    <Button
                      onClick={sendMessage}
                      disabled={isLoading || !inputMessage.trim()}
                      className="neumorphic-button-dark bg-blue-600 hover:bg-blue-700 text-white px-6"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Chart and Market Data */}
          <div className="lg:col-span-2 space-y-8">
            {/* TradingView Chart */}
            <div className="neumorphic-card-dark">
              <div className="p-6 border-b border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <h2 className="text-xl font-semibold text-white">Market Chart</h2>
                    <div className="flex gap-2">
                      {popularSymbols.map((symbol) => (
                        <Button
                          key={symbol}
                          variant={selectedSymbol === symbol ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedSymbol(symbol)}
                          className={`text-xs neumorphic-button-dark ${
                            selectedSymbol === symbol 
                              ? 'bg-blue-600 text-white' 
                              : 'bg-gray-800/50 text-gray-300 border border-gray-600'
                          }`}
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
                      className="neumorphic-button-dark bg-gray-800/50 text-gray-300 text-xs border border-gray-600"
                    >
                      +SMA
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addIndicator('RSI')}
                      className="neumorphic-button-dark bg-gray-800/50 text-gray-300 text-xs border border-gray-600"
                    >
                      +RSI
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addIndicator('MACD')}
                      className="neumorphic-button-dark bg-gray-800/50 text-gray-300 text-xs border border-gray-600"
                    >
                      +MACD
                    </Button>
                  </div>
                </div>
              </div>
              <div className="p-4">
                <TradingViewWidget 
                  symbol={selectedSymbol}
                  theme="dark"
                  height="400px"
                  className="w-full"
                />
              </div>
            </div>

            {/* Market Data and News */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Market Data */}
              <div className="neumorphic-card-dark">
                <div className="p-6 border-b border-gray-700">
                  <div className="flex items-center gap-3">
                    <div className="neumorphic-icon-dark">
                      <TrendingUp className="h-5 w-5 text-green-400" />
                    </div>
                    <h2 className="text-xl font-semibold text-white">Market Data</h2>
                  </div>
                </div>
                <div className="p-6">
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-3">
                      {marketData.map((item) => (
                        <div key={item.symbol} className="neumorphic-inset-dark bg-gray-800/50 rounded-2xl p-4 border border-gray-700/50">
                          <div className="flex items-center justify-between">
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
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </div>

              {/* News Feed */}
              <div className="neumorphic-card-dark">
                <div className="p-6 border-b border-gray-700">
                  <div className="flex items-center gap-3">
                    <div className="neumorphic-icon-dark">
                      <Newspaper className="h-5 w-5 text-purple-400" />
                    </div>
                    <h2 className="text-xl font-semibold text-white">Latest News</h2>
                  </div>
                </div>
                <div className="p-6">
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-3">
                      {news.map((item) => (
                        <div key={item.id} className="neumorphic-inset-dark bg-gray-800/50 rounded-2xl p-4 border border-gray-700/50">
                          <div className="flex items-start gap-3">
                            <div className={`w-3 h-3 rounded-full mt-2 ${getImpactColor(item.impact)}`}></div>
                            <div className="flex-1">
                              <p className="font-semibold text-white text-sm mb-2">{item.title}</p>
                              <p className="text-xs text-gray-400 mb-3">{item.summary}</p>
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
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dark Neumorphic CSS */}
      <style jsx>{`
        .neumorphic-header {
          background: #1a1a1a;
          box-shadow: 
            0 4px 20px rgba(0, 0, 0, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
        }
        
        .neumorphic-card-dark {
          background: #2a2a2a;
          border-radius: 20px;
          box-shadow: 
            20px 20px 60px #1a1a1a,
            -20px -20px 60px #3a3a3a;
          border: 1px solid #404040;
        }
        
        .neumorphic-inset-dark {
          background: #2a2a2a;
          border-radius: 15px;
          box-shadow: 
            inset 5px 5px 10px #1a1a1a,
            inset -5px -5px 10px #3a3a3a;
          border: 1px solid #404040;
        }
        
        .neumorphic-button-dark {
          border-radius: 12px;
          box-shadow: 
            5px 5px 10px #1a1a1a,
            -5px -5px 10px #3a3a3a;
          transition: all 0.2s ease;
          border: 1px solid #404040;
        }
        
        .neumorphic-button-dark:hover {
          box-shadow: 
            inset 2px 2px 5px #1a1a1a,
            inset -2px -2px 5px #3a3a3a;
        }
        
        .neumorphic-button-dark:active {
          box-shadow: 
            inset 3px 3px 6px #1a1a1a,
            inset -3px -3px 6px #3a3a3a;
        }
        
        .neumorphic-icon-dark {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          background: #2a2a2a;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 
            5px 5px 10px #1a1a1a,
            -5px -5px 10px #3a3a3a;
          border: 1px solid #404040;
        }
        
        .neumorphic-badge {
          border-radius: 20px;
          box-shadow: 
            3px 3px 6px #1a1a1a,
            -3px -3px 6px #3a3a3a;
        }
      `}</style>
    </div>
  );
};

export default AITradingAssistant;