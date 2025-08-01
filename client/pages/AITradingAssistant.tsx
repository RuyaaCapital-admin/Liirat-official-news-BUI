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
import { Send, Bot, User, TrendingUp, Newspaper, BarChart3, Settings, RefreshCw, MessageCircle, Brain, Zap } from 'lucide-react';

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
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="neumorphic-card p-8 mb-6">
            <h1 className="text-4xl font-bold text-gray-800 mb-3">AI Trading Assistant</h1>
            <p className="text-lg text-gray-600">Your intelligent companion for market analysis and trading strategies</p>
            <div className="flex justify-center gap-4 mt-4">
              <Badge className="neumorphic-badge bg-blue-100 text-blue-800">
                <Brain className="h-4 w-4 mr-1" />
                Powered by GPT-4
              </Badge>
              <Badge className="neumorphic-badge bg-green-100 text-green-800">
                <Zap className="h-4 w-4 mr-1" />
                Live Data
              </Badge>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Chat Interface */}
          <div className="lg:col-span-1">
            <div className="neumorphic-card h-[700px]">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="neumorphic-icon">
                    <Bot className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-800">AI Assistant</h2>
                    <p className="text-sm text-gray-600">Chat with your trading companion</p>
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
                              ? 'neumorphic-inset bg-blue-50 text-blue-900'
                              : 'neumorphic-card bg-white text-gray-800'
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
                        <div className="neumorphic-card bg-white rounded-2xl p-4">
                          <div className="flex items-center gap-2">
                            <Bot className="h-4 w-4 text-blue-600" />
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
                
                <div className="p-6 border-t border-gray-200">
                  <div className="flex gap-3">
                    <Textarea
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Ask about market analysis, trading strategies, or news..."
                      className="flex-1 neumorphic-inset bg-gray-50 border-0 resize-none rounded-2xl"
                      rows={2}
                    />
                    <Button
                      onClick={sendMessage}
                      disabled={isLoading || !inputMessage.trim()}
                      className="neumorphic-button bg-blue-500 hover:bg-blue-600 text-white px-6"
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
            <div className="neumorphic-card">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <h2 className="text-xl font-semibold text-gray-800">Market Chart</h2>
                    <div className="flex gap-2">
                      {popularSymbols.map((symbol) => (
                        <Button
                          key={symbol}
                          variant={selectedSymbol === symbol ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedSymbol(symbol)}
                          className={`text-xs neumorphic-button ${
                            selectedSymbol === symbol 
                              ? 'bg-blue-500 text-white' 
                              : 'bg-white text-gray-700'
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
                      className="neumorphic-button bg-white text-gray-700 text-xs"
                    >
                      +SMA
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addIndicator('RSI')}
                      className="neumorphic-button bg-white text-gray-700 text-xs"
                    >
                      +RSI
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addIndicator('MACD')}
                      className="neumorphic-button bg-white text-gray-700 text-xs"
                    >
                      +MACD
                    </Button>
                  </div>
                </div>
              </div>
              <div className="p-4">
                <TradingViewWidget 
                  symbol={selectedSymbol}
                  theme="light"
                  height="400px"
                  className="w-full"
                />
              </div>
            </div>

            {/* Market Data and News */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Market Data */}
              <div className="neumorphic-card">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="neumorphic-icon">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-800">Market Data</h2>
                  </div>
                </div>
                <div className="p-6">
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-3">
                      {marketData.map((item) => (
                        <div key={item.symbol} className="neumorphic-inset bg-gray-50 rounded-2xl p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold text-gray-800">{item.symbol}</p>
                              <p className="text-sm text-gray-600">Vol: {item.volume.toLocaleString()}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-gray-800">${item.price.toFixed(2)}</p>
                              <p className={`text-sm ${item.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
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
              <div className="neumorphic-card">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="neumorphic-icon">
                      <Newspaper className="h-5 w-5 text-purple-600" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-800">Latest News</h2>
                  </div>
                </div>
                <div className="p-6">
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-3">
                      {news.map((item) => (
                        <div key={item.id} className="neumorphic-inset bg-gray-50 rounded-2xl p-4">
                          <div className="flex items-start gap-3">
                            <div className={`w-3 h-3 rounded-full mt-2 ${getImpactColor(item.impact)}`}></div>
                            <div className="flex-1">
                              <p className="font-semibold text-gray-800 text-sm mb-2">{item.title}</p>
                              <p className="text-xs text-gray-600 mb-3">{item.summary}</p>
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


      
      {/* Neumorphic CSS */}
      <style jsx>{`
        .neumorphic-card {
          background: #e0e0e0;
          border-radius: 20px;
          box-shadow: 
            20px 20px 60px #bebebe,
            -20px -20px 60px #ffffff;
        }
        
        .neumorphic-inset {
          background: #e0e0e0;
          border-radius: 15px;
          box-shadow: 
            inset 5px 5px 10px #bebebe,
            inset -5px -5px 10px #ffffff;
        }
        
        .neumorphic-button {
          border-radius: 12px;
          box-shadow: 
            5px 5px 10px #bebebe,
            -5px -5px 10px #ffffff;
          transition: all 0.2s ease;
        }
        
        .neumorphic-button:hover {
          box-shadow: 
            inset 2px 2px 5px #bebebe,
            inset -2px -2px 5px #ffffff;
        }
        
        .neumorphic-button:active {
          box-shadow: 
            inset 3px 3px 6px #bebebe,
            inset -3px -3px 6px #ffffff;
        }
        
        .neumorphic-icon {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          background: #e0e0e0;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 
            5px 5px 10px #bebebe,
            -5px -5px 10px #ffffff;
        }
        
        .neumorphic-badge {
          border-radius: 20px;
          box-shadow: 
            3px 3px 6px #bebebe,
            -3px -3px 6px #ffffff;
        }
      `}</style>
    </div>
  );
};

export default AITradingAssistant;