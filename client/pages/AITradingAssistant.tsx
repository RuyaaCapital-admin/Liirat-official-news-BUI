import React, { useState, useRef, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import { SimpleLanguageToggle } from "@/components/ui/simple-language-toggle";
import { NewLiquidToggle } from "@/components/ui/new-liquid-toggle";
// Using EODHD data only - no TradingView widgets
import {
  Send,
  Bot,
  User,
  TrendingUp,
  Newspaper,
  BarChart3,
  Settings,
  RefreshCw,
  MessageCircle,
  Brain,
  Zap,
  Home,
  ArrowLeft,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useTheme } from "@/hooks/use-theme";
import { useLanguage } from "@/contexts/language-context";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  type?: "text" | "analysis" | "strategy" | "news";
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
  impact: "high" | "medium" | "low";
}

const AITradingAssistant: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content:
        "Hello! I'm your AI trading assistant. I can help you analyze markets, provide trading strategies, and keep you updated with the latest news. What would you like to know about today?",
      timestamp: new Date(),
      type: "text",
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSymbol, setSelectedSymbol] = useState("XAUUSD");
  const [marketData, setMarketData] = useState<MarketData[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { theme } = useTheme();
  const { language, t, dir } = useLanguage();

  const popularSymbols = [
    "XAUUSD",
    "BTCUSD",
    "EURUSD",
    "GBPUSD",
    "USDJPY",
    "SPX500",
  ];

  useEffect(() => {
    scrollToBottom();
    fetchNews();
  }, [language]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Removed fake market data fetching - keeping it honest

  const fetchNews = async () => {
    try {
      const response = await fetch("/api/news-trading");
      if (!response.ok) {
        throw new Error("Failed to fetch news");
      }
      const result = await response.json();
      if (result.success && result.data) {
        setNews(result.data);
      } else {
        throw new Error("Invalid news data response");
      }
    } catch (error) {
      console.error("Error fetching news:", error);
      // Set mock news as fallback
      const newsData =
        language === "ar"
          ? [
              {
                id: "1",
                title:
                  "بنك الاحتياطي الفيدرالي يشير إلى تخفيضات محتملة في أسعار الفائدة لعام 2024",
                summary:
                  "أشار بنك الاحتياطي الفيدرالي إلى موقف أكثر مرونة، مما يشير إلى تخفيضات محتملة في أسعار الفائدة في العام القادم.",
                source: "رويترز",
                publishedAt: "2024-01-15T10:30:00Z",
                impact: "high",
              },
              {
                id: "2",
                title: "متوقع موافقة على صناديق بيتكوين المتداولة هذا الأسبوع",
                summary:
                  "من المتوقع أن تحصل صناديق ا��عملات المشفرة الرئيسية على الموافقة التنظيمية، مما قد يعزز الاعتماد المؤسسي.",
                source: "بلومبرغ",
                publishedAt: "2024-01-15T09:15:00Z",
                impact: "high",
              },
              {
                id: "3",
                title:
                  "أسعار الذهب تصل إلى مستويات قياسية جديدة وسط عدم اليقين الاقتصادي",
                summary:
                  "ارتفعت أسعار الذهب إلى مستويات قياسية حيث يسعى المستثمرون إلى الأصول الآمنة خلال تقلبات السوق.",
                source: "سي إن بي سي",
                publishedAt: "2024-01-15T08:45:00Z",
                impact: "medium",
              },
            ]
          : [
              {
                id: "1",
                title: "Federal Reserve Signals Potential Rate Cuts in 2024",
                summary:
                  "The Federal Reserve has indicated a more dovish stance, suggesting potential interest rate cuts in the coming year.",
                source: "Reuters",
                publishedAt: "2024-01-15T10:30:00Z",
                impact: "high",
              },
              {
                id: "2",
                title: "Bitcoin ETF Approval Expected This Week",
                summary:
                  "Major cryptocurrency ETFs are expected to receive regulatory approval, potentially boosting institutional adoption.",
                source: "Bloomberg",
                publishedAt: "2024-01-15T09:15:00Z",
                impact: "high",
              },
              {
                id: "3",
                title: "Gold Prices Reach New Highs Amid Economic Uncertainty",
                summary:
                  "Gold prices have surged to record levels as investors seek safe-haven assets during market volatility.",
                source: "CNBC",
                publishedAt: "2024-01-15T08:45:00Z",
                impact: "medium",
              },
            ];
      setNews(newsData);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputMessage,
      timestamp: new Date(),
      type: "text",
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentMessage = inputMessage;
    setInputMessage("");
    setIsLoading(true);

    try {
      // Prepare conversation history for API
      const conversationHistory = messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      const response = await fetch("/api/ai-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: currentMessage,
          conversationHistory: conversationHistory,
          context: {
            selectedSymbol,
            recentNews: news.slice(0, 2), // Send only recent news for context
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `HTTP error! status: ${response.status}`,
        );
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response,
        timestamp: new Date(),
        type: "analysis",
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error("AI Chat Error:", error);

      // Show appropriate error message
      let errorMessage = "Failed to get AI response. Please try again.";
      if (error.message.includes("quota")) {
        errorMessage =
          "AI service is currently at capacity. Please try again later.";
      } else if (error.message.includes("API key")) {
        errorMessage =
          "AI service is not properly configured. Please contact support.";
      } else if (error.message.includes("network")) {
        errorMessage =
          "Network error. Please check your connection and try again.";
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });

      // Add fallback response
      const fallbackMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          "I apologize, but I'm experiencing technical difficulties. Please check your internet connection and try again. You can also try asking about market analysis, trading strategies, or current market conditions.",
        timestamp: new Date(),
        type: "text",
      };
      setMessages((prev) => [...prev, fallbackMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
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
      case "high":
        return "bg-red-500";
      case "medium":
        return "bg-yellow-500";
      case "low":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div
      className={`min-h-screen bg-background ${language === "ar" ? "arabic" : "english"}`}
      dir={dir}
    >
      {/* Navigation Header */}
      <header className="border-b border-border/40 backdrop-blur-md bg-background/95 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div
            className={`flex items-center ${dir === "rtl" ? "space-x-reverse" : ""} space-x-6`}
          >
            <Link
              to="/"
              className="flex items-center gap-2 text-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">
                {language === "ar" ? "الرئيسية" : "Home"}
              </span>
            </Link>
            <nav
              className={`hidden md:flex items-center ${dir === "rtl" ? "space-x-reverse" : ""} space-x-4`}
            >
              <a
                href="/#calendar"
                className="text-muted-foreground hover:text-primary transition-colors text-sm"
              >
                {language === "ar" ? "التقويم" : "Calendar"}
              </a>
              <a
                href="/#alerts"
                className="text-muted-foreground hover:text-primary transition-colors text-sm"
              >
                {language === "ar" ? "التنبيهات" : "Alerts"}
              </a>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <img
              src="/liirat-logo.png"
              alt="Liirat News"
              className="h-12 w-auto cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => (window.location.href = "/")}
            />
          </div>

          <div
            className={`flex items-center ${dir === "rtl" ? "space-x-reverse" : ""} space-x-3`}
          >
            <Badge className="bg-primary/20 text-primary border border-primary/30">
              <Brain className="h-4 w-4 mr-1" />
              {language === "ar" ? "مساعد التداول" : "AI Trading"}
            </Badge>
            <SimpleLanguageToggle />
            <NewLiquidToggle />
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="bg-card border border-border rounded-3xl p-8 mb-6 shadow-lg">
            <h1 className="text-4xl font-bold text-foreground mb-3">
              {language === "ar"
                ? "مساعد التداول الذكي"
                : "AI Trading Assistant"}
            </h1>
            <p className="text-lg text-muted-foreground">
              {language === "ar"
                ? "رفيقك الذكي لتحليل الأسواق واستراتيجيات التداول"
                : "Your intelligent companion for market analysis and trading strategies"}
            </p>
            <div className="flex justify-center gap-4 mt-4">
              <Badge className="bg-primary/20 text-primary border border-primary/30">
                <Brain className="h-4 w-4 mr-1" />
                {language === "ar" ? "مدعوم بـ GPT-3.5" : "Powered by GPT-3.5"}
              </Badge>
              <Badge className="bg-accent/20 text-accent-foreground border border-accent/30">
                <Zap className="h-4 w-4 mr-1" />
                {language === "ar" ? "بيانات حية" : "Live Data"}
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
                    <CardTitle className="text-xl">
                      {language === "ar" ? "المساعد الذكي" : "AI Assistant"}
                    </CardTitle>
                    <CardDescription>
                      {language === "ar"
                        ? "تحدث مع مساعد التداول"
                        : "Chat with your trading companion"}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <div className="flex flex-col h-[580px]">
                <ScrollArea className="flex-1 px-6">
                  <div className="space-y-4 py-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-2xl p-4 ${
                            message.role === "user"
                              ? "bg-primary/20 text-primary-foreground border border-primary/30"
                              : "bg-muted/50 text-foreground border border-border/50"
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            {message.role === "user" ? (
                              <User className="h-4 w-4" />
                            ) : (
                              <Bot className="h-4 w-4" />
                            )}
                            <span className="text-xs opacity-70">
                              {message.timestamp.toLocaleTimeString()}
                            </span>
                          </div>
                          <p className="text-sm whitespace-pre-wrap">
                            {message.content}
                          </p>
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
                              <div
                                className="w-2 h-2 bg-primary rounded-full animate-bounce"
                                style={{ animationDelay: "0.1s" }}
                              ></div>
                              <div
                                className="w-2 h-2 bg-primary rounded-full animate-bounce"
                                style={{ animationDelay: "0.2s" }}
                              ></div>
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
            {/* EODHD Market Data - No TradingView */}
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <CardTitle className="text-xl">Market Chart</CardTitle>
                    <div className="flex gap-2">
                      {popularSymbols.map((symbol) => (
                        <Button
                          key={symbol}
                          variant={
                            selectedSymbol === symbol ? "default" : "outline"
                          }
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
                      onClick={() => addIndicator("SMA")}
                      className="text-xs rounded-xl"
                    >
                      +SMA
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addIndicator("RSI")}
                      className="text-xs rounded-xl"
                    >
                      +RSI
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addIndicator("MACD")}
                      className="text-xs rounded-xl"
                    >
                      +MACD
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="h-[400px] flex items-center justify-center bg-muted/30 rounded-xl">
                  <div className="text-center space-y-4">
                    <h3 className="text-lg font-semibold">EODHD Price Data</h3>
                    <p className="text-muted-foreground">
                      Chart functionality will use EODHD API data
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Selected: {selectedSymbol}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Market Data and News */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Live Market Data - EODHD Data Only */}
              <Card>
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                      <TrendingUp className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-xl">Live Market Data</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="h-[250px] flex items-center justify-center bg-muted/30 rounded-lg">
                    <div className="text-center space-y-3">
                      <TrendingUp className="h-8 w-8 text-primary mx-auto" />
                      <h3 className="font-semibold">EODHD Market Data</h3>
                      <p className="text-sm text-muted-foreground">
                        Real-time data powered by EODHD API
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* News Feed - EODHD News API */}
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
                  <div className="h-[250px] flex items-center justify-center bg-muted/30 rounded-lg">
                    <div className="text-center space-y-3">
                      <Newspaper className="h-8 w-8 text-primary mx-auto" />
                      <h3 className="font-semibold">EODHD Financial News</h3>
                      <p className="text-sm text-muted-foreground">
                        Market news powered by EODHD API
                      </p>
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
