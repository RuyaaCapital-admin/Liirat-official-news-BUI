import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  Newspaper,
  Search,
  Filter,
  RefreshCw,
  ExternalLink,
  Bot,
  Clock,
  TrendingUp,
  AlertTriangle,
  Globe,
} from "lucide-react";
import { useLanguage } from "@/contexts/language-context";

interface NewsArticle {
  id: string;
  datetimeIso: string | null;
  title: string;
  content: string;
  category: string;
  symbols: string[];
  tags: string[];
  url?: string;
  source: string;
  importance: number;
  country?: string;
}

interface NewsTableProps {
  className?: string;
}

export default function RealtimeNewsTable({ className }: NewsTableProps) {
  const { language, dir } = useLanguage();
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [itemsToShow, setItemsToShow] = useState(10);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedSymbol, setSelectedSymbol] = useState<string>("all");
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>("24h");

  // Available filter options
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [availableSymbols, setAvailableSymbols] = useState<string[]>([]);

  // AI Analysis
  const [aiAnalysis, setAiAnalysis] = useState<Record<string, string>>({});
  const [loadingAnalysis, setLoadingAnalysis] = useState<
    Record<string, boolean>
  >({});

  // Translation state
  const [translatedTitles, setTranslatedTitles] = useState<
    Record<string, string>
  >({});
  const [loadingTranslation, setLoadingTranslation] = useState<
    Record<string, boolean>
  >({});

  // Timezone selector
  const [selectedTimezone, setSelectedTimezone] = useState("UTC");
  const timezones = [
    { value: "UTC", label: "UTC" },
    { value: "America/New_York", label: "New York" },
    { value: "Europe/London", label: "London" },
    { value: "Europe/Frankfurt", label: "Frankfurt" },
    { value: "Asia/Tokyo", label: "Tokyo" },
    { value: "Asia/Shanghai", label: "Shanghai" },
    { value: "Australia/Sydney", label: "Sydney" },
  ];

  // Fetch news data - ALWAYS fetch in English first
  const fetchNews = async () => {
    try {
      setLoading(true);
      setError(null);

      // Calculate date range based on timeframe
      const to = new Date().toISOString().split("T")[0];
      let from = "";
      const fromDate = new Date();

      switch (selectedTimeframe) {
        case "24h":
          fromDate.setDate(fromDate.getDate() - 1);
          break;
        case "3d":
          fromDate.setDate(fromDate.getDate() - 3);
          break;
        case "1w":
          fromDate.setDate(fromDate.getDate() - 7);
          break;
        case "1m":
          fromDate.setMonth(fromDate.getMonth() - 1);
          break;
        default:
          fromDate.setDate(fromDate.getDate() - 1);
      }

      from = fromDate.toISOString().split("T")[0];

      // ALWAYS fetch in English - never pass language to API
      const params = new URLSearchParams({
        from,
        to,
        limit: "50",
      });

      // EODHD API requires either 's' (symbol) or 't' (topic) parameter
      if (selectedSymbol !== "all") {
        params.append("s", selectedSymbol);
      } else if (selectedCategory !== "all") {
        params.append("t", selectedCategory);
      } else {
        // Default to general financial news
        params.append("t", "financial");
      }

      console.log(`Fetching news with params: ${params.toString()}`);

      const response = await fetch(`/api/eodhd/news?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        setError(data.error);
        setArticles([]);
      } else {
        // Transform server response to match client interface
        const transformedArticles = (data.items || []).map((item: any, index: number) => {
          // Calculate real importance based on available EODHD API data
          let importance = 1; // Default to low

          const title = item.title || '';
          const symbols = item.symbols || [];
          const source = item.source || '';

          // High importance keywords in title (financial impact indicators)
          const highImpactKeywords = [
            'fed', 'federal reserve', 'interest rate', 'inflation', 'gdp', 'unemployment',
            'central bank', 'monetary policy', 'recession', 'crisis', 'crash', 'surge',
            'breakthrough', 'acquisition', 'merger', 'earnings', 'bankruptcy', 'ipo'
          ];

          const mediumImpactKeywords = [
            'market', 'trading', 'stock', 'price', 'volatility', 'analysis',
            'forecast', 'outlook', 'report', 'data', 'economic', 'financial'
          ];

          // Check title for impact keywords
          const titleLower = title.toLowerCase();
          const hasHighImpact = highImpactKeywords.some(keyword => titleLower.includes(keyword));
          const hasMediumImpact = mediumImpactKeywords.some(keyword => titleLower.includes(keyword));

          if (hasHighImpact) {
            importance = 3; // High importance
          } else if (hasMediumImpact) {
            importance = 2; // Medium importance
          }

          // Boost importance for major financial symbols
          const majorSymbols = ['EURUSD', 'GBPUSD', 'USDJPY', 'USDCHF', 'AUDUSD', 'USDCAD', 'NZDUSD', 'XAUUSD', 'BTCUSD', 'ETHUSD'];
          const hasImportantSymbols = symbols.some((symbol: string) =>
            majorSymbols.some(major => symbol.toUpperCase().includes(major.replace('USD', '')))
          );

          if (hasImportantSymbols && importance < 2) {
            importance = 2; // Boost importance for major financial instruments
          }

          // Boost importance for trusted news sources
          const trustedSources = ['reuters', 'bloomberg', 'cnbc', 'marketwatch', 'financial times', 'wsj'];
          const isTrustedSource = trustedSources.some(trusted =>
            source.toLowerCase().includes(trusted)
          );

          if (isTrustedSource && importance < 2) {
            importance = 2;
          }

          return {
            id: `news-${Date.now()}-${index}`, // Unique ID with timestamp
            datetimeIso: item.datetimeIso,
            title: title,
            content: item.content || title, // Use API content if available, fallback to title
            category: item.category || 'financial',
            symbols: symbols,
            tags: item.tags || symbols,
            url: item.url,
            source: source,
            importance: importance, // Real importance based on content analysis
            country: item.country || ''
          };
        });
        setArticles(transformedArticles);
        setAvailableCategories(['financial']);
        setAvailableSymbols([]);
      }
    } catch (err) {
      console.error("Error fetching news:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch news");
      setArticles([]);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch and periodic refresh (reduced frequency)
  useEffect(() => {
    fetchNews();
    const interval = setInterval(fetchNews, 600000); // Refresh every 10 minutes to reduce API calls
    return () => clearInterval(interval);
  }, [selectedTimeframe, selectedCategory, selectedSymbol]);

  // Auto-translate articles when language changes to Arabic (with debouncing)
  useEffect(() => {
    if (language === "ar" && filteredArticles.length > 0) {
      // Debounce translation requests to avoid overwhelming the API
      const timer = setTimeout(() => {
        // Translate ALL visible articles, not just first 5
        filteredArticles.slice(0, itemsToShow).forEach((article, index) => {
          // Only translate if not already translated
          if (
            !translatedTitles[article.id] &&
            !loadingTranslation[article.id]
          ) {
            // Stagger requests to avoid rate limiting
            setTimeout(() => {
              translateTitle(article);
            }, index * 400); // Reduced delay for faster translation
          }
        });
      }, 500); // Reduced debounce time

      return () => clearTimeout(timer);
    }
  }, [
    language,
    filteredArticles,
    itemsToShow,
    translatedTitles,
    loadingTranslation,
  ]);

  // Apply filters
  useEffect(() => {
    let filtered = [...articles];

    // Search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (article) =>
          article.title.toLowerCase().includes(searchLower) ||
          article.content.toLowerCase().includes(searchLower) ||
          article.symbols.some((symbol) =>
            symbol.toLowerCase().includes(searchLower),
          ) ||
          article.tags.some((tag) => tag.toLowerCase().includes(searchLower)),
      );
    }

    setFilteredArticles(filtered);
    setItemsToShow(10); // Reset pagination when filters change
  }, [articles, searchTerm]);

  // Network connectivity check for translations
  const checkNetworkStatus = async (): Promise<boolean> => {
    try {
      const response = await fetch("/api/status", {
        method: "GET",
        cache: "no-cache",
        signal: AbortSignal.timeout(3000),
      });
      return response.ok;
    } catch {
      return false;
    }
  };

  // Offline translation dictionary for common financial news terms
  const getOfflineTranslation = (title: string): string => {
    const translations: Record<string, string> = {
      Financial: "مالي",
      Market: "السوق",
      Stock: "الأسهم",
      Price: "السعر",
      Economy: "الاقتصاد",
      Trading: "التداول",
      Investment: "الاستثمار",
      Bank: "البنك",
      Currency: "العملة",
      Dollar: "ا��دولار",
      Euro: "اليورو",
      Gold: "الذهب",
      Oil: "النفط",
      Bitcoin: "البتكوين",
      News: "الأخبار",
      Report: "الت��رير",
      Analysis: "التحليل",
      Growth: "النمو",
      Rise: "الارتفاع",
    };

    let translatedTitle = title;
    Object.entries(translations).forEach(([english, arabic]) => {
      const regex = new RegExp(`\\b${english}\\b`, "gi");
      translatedTitle = translatedTitle.replace(regex, arabic);
    });
    return translatedTitle;
  };

  // Handle translation request with better error handling
  const translateTitle = async (article: NewsArticle) => {
    if (translatedTitles[article.id] || loadingTranslation[article.id]) {
      return translatedTitles[article.id];
    }

    // Skip empty or very short titles
    if (!article.title || article.title.trim().length < 3) {
      setTranslatedTitles((prev) => ({ ...prev, [article.id]: article.title }));
      return article.title;
    }

    // Check if title is already in Arabic (contains Arabic characters)
    const hasArabic = /[\u0600-\u06FF]/.test(article.title);
    if (hasArabic) {
      // Already in Arabic, no need to translate
      setTranslatedTitles((prev) => ({ ...prev, [article.id]: article.title }));
      return article.title;
    }

    if (language !== "ar") {
      return article.title; // Return original if not Arabic mode
    }

    // Use offline translation for instant results without API calls
    const offlineTranslation = getOfflineTranslation(article.title);
    console.log(`[NEWS] Translating offline: "${article.title}" -> "${offlineTranslation}"`);

    // Always cache the translation result (even if unchanged)
    setTranslatedTitles((prev) => ({
      ...prev,
      [article.id]: offlineTranslation,
    }));
    return offlineTranslation;

    setLoadingTranslation((prev) => ({ ...prev, [article.id]: true }));

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch("/api/translate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: article.title,
          targetLanguage: "ar",
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        const translated = data.translatedText || article.title;
        setTranslatedTitles((prev) => ({ ...prev, [article.id]: translated }));
        return translated;
      } else {
        console.warn(`Translation failed with status: ${response.status}`);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      if (error instanceof Error && error.name === "AbortError") {
        console.warn(
          `[NEWS] Translation request timed out for article ${article.id}`,
        );
      } else if (
        errorMessage.includes("Failed to fetch") ||
        errorMessage.includes("NetworkError")
      ) {
        console.warn(
          `[NEWS] Network error during translation for article ${article.id}: ${errorMessage}`,
        );
      } else {
        console.error(
          `[NEWS] Translation error for article ${article.id}:`,
          errorMessage,
        );
      }

      // Cache original title to avoid repeated failed attempts
      setTranslatedTitles((prev) => ({ ...prev, [article.id]: article.title }));
    } finally {
      setLoadingTranslation((prev) => ({ ...prev, [article.id]: false }));
    }

    return article.title; // Fallback to original
  };

  // Request AI analysis for an article with better error handling
  const requestAIAnalysis = async (article: NewsArticle) => {
    // Ensure we only analyze the specific selected article
    if (aiAnalysis[article.id] || loadingAnalysis[article.id]) {
      return; // Already have analysis or loading for this specific article
    }

    console.log(`[AI ANALYSIS] Starting analysis for article: ${article.id} - ${article.title.substring(0, 50)}...`);
    setLoadingAnalysis((prev) => ({ ...prev, [article.id]: true }));

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const response = await fetch("/api/ai-analysis", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: `${article.title}. ${article.content.substring(0, 300)}`,
          language: language,
          type: "news",
          articleId: article.id, // Include article ID for tracking
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        if (data.analysis) {
          console.log(`[AI ANALYSIS] Completed for article: ${article.id}`);
          setAiAnalysis((prev) => ({ ...prev, [article.id]: data.analysis }));
        } else {
          throw new Error("No analysis received");
        }
      } else {
        // Don't read response body twice - just use status for error
        console.error(
          `AI Analysis API error: ${response.status} - ${response.statusText}`,
        );
        throw new Error(`API error: ${response.status}`);
      }
    } catch (error) {
      console.error(`[AI ANALYSIS] Error for article ${article.id}:`, error);
      setAiAnalysis((prev) => ({
        ...prev,
        [article.id]:
          language === "ar"
            ? "تحليل الذكاء الاصطناعي غير متاح حاليًا"
            : "AI analysis currently unavailable",
      }));
    } finally {
      setLoadingAnalysis((prev) => ({ ...prev, [article.id]: false }));
    }
  };

  // Safe date parsing utilities
  function parseIso(input?: string | null) {
    if (!input) return null;
    const d = new Date(input);
    return isNaN(+d) ? null : d;
  }

  function formatUtc(iso?: string | null, tz: string = 'UTC') {
    const d = parseIso(iso);
    if (!d) return '—';
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: tz
    }).format(d);
  }

  // Format date with timezone - always use English format to avoid Hijri calendar
  const formatDate = (dateString: string) => {
    return formatUtc(dateString, selectedTimezone);
  };

  // Get importance color with better contrast for light mode
  const getImportanceColor = (importance: number) => {
    switch (importance) {
      case 3:
        return "bg-red-500 text-white border-red-600";
      case 2:
        return "bg-yellow-500 text-white border-yellow-600";
      case 1:
        return "bg-green-500 text-white border-green-600";
      default:
        return "bg-gray-500 text-white border-gray-600";
    }
  };

  const getImportanceLabel = (importance: number) => {
    switch (importance) {
      case 3:
        return language === "ar" ? "عالي" : "High";
      case 2:
        return language === "ar" ? "متوسط" : "Medium";
      case 1:
        return language === "ar" ? "منخفض" : "Low";
      default:
        return language === "ar" ? "غير محدد" : "Unknown";
    }
  };

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Newspaper className="w-5 h-5 text-primary" />
          {language === "ar"
            ? "الأخبار المالية المباشرة"
            : "Real-Time Financial News"}
        </CardTitle>

        {/* Filters Row */}
        <div className="flex flex-wrap gap-4 mt-4">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={
                  language === "ar" ? "البحث في الأخبار..." : "Search news..."
                }
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Category Filter */}
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[150px]">
              <SelectValue
                placeholder={language === "ar" ? "الفئة" : "Category"}
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {language === "ar" ? "جميع الفئات" : "All Categories"}
              </SelectItem>
              {availableCategories.map((category) => {
                // Translate category names to Arabic when needed
                const categoryTranslations: Record<string, string> = {
                  Financial: language === "ar" ? "مالي" : "Financial",
                  Earnings: language === "ar" ? "الأرباح" : "Earnings",
                  "Central Banks":
                    language === "ar" ? "البنوك المركزية" : "Central Banks",
                  Inflation: language === "ar" ? "التضخم" : "Inflation",
                  Forex: language === "ar" ? "تداو�� العملات" : "Forex",
                  Economic: language === "ar" ? "اقتصادي" : "Economic",
                  Employment: language === "ar" ? "التوظيف" : "Employment",
                  Trade: language === "ar" ? "التجارة" : "Trade",
                  Manufacturing:
                    language === "ar" ? "التصنيع" : "Manufacturing",
                  Services: language === "ar" ? "الخدم��ت" : "Services",
                  Housing: language === "ar" ? "الإسكان" : "Housing",
                  Consumer: language === "ar" ? "المستهلك" : "Consumer",
                };

                return (
                  <SelectItem key={category} value={category}>
                    {categoryTranslations[category] || category}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>

          {/* Timeframe Filter */}
          <Select
            value={selectedTimeframe}
            onValueChange={setSelectedTimeframe}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">
                {language === "ar" ? "آخر 24 ساعة" : "Last 24h"}
              </SelectItem>
              <SelectItem value="3d">
                {language === "ar" ? "آخر 3 أيام" : "Last 3 days"}
              </SelectItem>
              <SelectItem value="1w">
                {language === "ar" ? "آخر أسبوع" : "Last week"}
              </SelectItem>
              <SelectItem value="1m">
                {language === "ar" ? "آخر شهر" : "Last month"}
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Timezone Selector */}
          <Select value={selectedTimezone} onValueChange={setSelectedTimezone}>
            <SelectTrigger className="w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {timezones.map((tz) => (
                <SelectItem key={tz.value} value={tz.value}>
                  {tz.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Refresh Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={fetchNews}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            {language === "ar" ? "تحديث" : "Refresh"}
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {error && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <div className="flex items-center text-destructive text-sm">
              <AlertTriangle className="w-4 h-4 mr-2" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary/20 border-t-primary"></div>
            <span className="ml-2">
              {language === "ar" ? "جاري تحميل الأخبار..." : "Loading news..."}
            </span>
          </div>
        ) : filteredArticles.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Newspaper className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>
              {language === "ar" ? "لا توجد أخبار متاحة" : "No news available"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredArticles.slice(0, itemsToShow).map((article, index) => (
              <div
                key={`${article.id}-${index}`}
                className="border border-border rounded-lg p-4 hover:bg-muted/30 transition-colors"
                dir={dir}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <div
                      className={cn(
                        "flex items-center gap-2 mb-2 flex-wrap",
                        dir === "rtl" ? "justify-start" : "justify-start",
                      )}
                    >
                      <Badge
                        className={cn(
                          getImportanceColor(article.importance),
                          "font-medium",
                        )}
                      >
                        {getImportanceLabel(article.importance)}
                      </Badge>
                      <Badge variant="outline" className="font-medium">
                        {article.category}
                      </Badge>
                      {article.country && (
                        <Badge
                          variant="outline"
                          className="flex items-center gap-1 font-medium"
                        >
                          <Globe className="w-3 h-3" />
                          {article.country}
                        </Badge>
                      )}
                    </div>

                    <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                      {language === "ar" && translatedTitles[article.id]
                        ? translatedTitles[article.id]
                        : article.title}
                      {language === "ar" && loadingTranslation[article.id] && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          (translating...)
                        </span>
                      )}
                    </h3>

                    <p className="text-muted-foreground text-sm mb-3 line-clamp-3">
                      {article.content}
                    </p>

                    {/* Symbols and Tags */}
                    <div className="flex flex-wrap gap-1 mb-3">
                      {article.symbols.slice(0, 3).map((symbol, idx) => (
                        <Badge
                          key={idx}
                          variant="secondary"
                          className="text-xs"
                        >
                          {symbol}
                        </Badge>
                      ))}
                      {article.symbols.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{article.symbols.length - 3}
                        </Badge>
                      )}
                    </div>

                    {/* AI Analysis */}
                    {aiAnalysis[article.id] && (
                      <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 mb-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Bot className="w-4 h-4 text-primary" />
                          <span className="text-sm font-medium text-primary">
                            {language === "ar"
                              ? "تحليل الذكاء الاصطناعي"
                              : "AI Analysis"}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {aiAnalysis[article.id]}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-2 ml-4">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {formatUtc(article.datetimeIso, selectedTimezone)}
                    </div>

                    <div className="flex gap-2">
                      {/* AI Analysis Button */}
                      <Button
                        variant={aiAnalysis[article.id] ? "default" : "outline"}
                        size="sm"
                        onClick={() => requestAIAnalysis(article)}
                        disabled={loadingAnalysis[article.id]}
                        className={cn(
                          "flex items-center gap-2 font-medium transition-all duration-200 shadow-sm",
                          aiAnalysis[article.id]
                            ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md hover:shadow-lg"
                            : "hover:bg-primary/10 border-primary/20 hover:border-primary/40",
                          loadingAnalysis[article.id] && "animate-pulse",
                        )}
                      >
                        <Bot
                          className={cn(
                            "w-4 h-4",
                            loadingAnalysis[article.id] && "animate-spin",
                            aiAnalysis[article.id] && "text-primary-foreground",
                          )}
                        />
                        <span className="text-xs font-medium">
                          {language === "ar" ? "تحليل" : "AI"}
                        </span>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination Controls */}
        {!loading && filteredArticles.length > 0 && (
          <div className="mt-6 pt-4 border-t border-border">
            <div className="text-center text-sm text-muted-foreground mb-4">
              {language === "ar"
                ? `عرض ${Math.min(itemsToShow, filteredArticles.length)} من ${filteredArticles.length} خبر`
                : `Showing ${Math.min(itemsToShow, filteredArticles.length)} of ${filteredArticles.length} articles`}
            </div>

            {filteredArticles.length > itemsToShow && (
              <div className="flex justify-center gap-2">
                <Button
                  variant="outline"
                  onClick={() =>
                    setItemsToShow((prev) =>
                      Math.min(prev + 10, filteredArticles.length),
                    )
                  }
                  className="flex items-center gap-2"
                >
                  {language === "ar" ? "عرض المزيد" : "Show More"}
                  <span className="text-xs">
                    ({Math.min(10, filteredArticles.length - itemsToShow)})
                  </span>
                </Button>
              </div>
            )}

            {itemsToShow > 10 && (
              <div className="flex justify-center gap-2 mt-2">
                <Button
                  variant="outline"
                  onClick={() => setItemsToShow(10)}
                  className="flex items-center gap-2"
                >
                  {language === "ar" ? "عرض أقل" : "Show Less"}
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
