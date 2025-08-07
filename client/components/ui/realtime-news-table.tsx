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
  date: string;
  title: string;
  content: string;
  category: string;
  symbols: string[];
  tags: string[];
  link?: string;
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
  const [translatedTitles, setTranslatedTitles] = useState<Record<string, string>>({});
  const [loadingTranslation, setLoadingTranslation] = useState<Record<string, boolean>>({});

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

  // Fetch news data
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

      const params = new URLSearchParams({
        from,
        to,
        limit: "50",
      });

      if (selectedCategory !== "all") {
        params.append("category", selectedCategory);
      }
      if (selectedSymbol !== "all") {
        params.append("symbol", selectedSymbol);
      }
      if (searchTerm.trim()) {
        params.append("search", searchTerm.trim());
      }

      console.log(`Fetching news with params: ${params.toString()}`);

      const response = await fetch(`/api/realtime-news?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        setError(data.error);
        setArticles([]);
      } else {
        setArticles(data.articles || []);
        setAvailableCategories(data.availableCategories || []);
        setAvailableSymbols(data.availableTags || []);
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
        filteredArticles.slice(0, Math.min(5, itemsToShow)).forEach((article, index) => {
          // Stagger requests to avoid rate limiting
          setTimeout(() => {
            translateTitle(article);
          }, index * 600);
        });
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [language, filteredArticles, itemsToShow]);

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

  // Handle translation request with better error handling
  const translateTitle = async (article: NewsArticle) => {
    if (translatedTitles[article.id] || loadingTranslation[article.id]) {
      return translatedTitles[article.id];
    }

    if (language !== "ar") {
      return article.title; // Return original if not Arabic mode
    }

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
      if (error instanceof Error && error.name === 'AbortError') {
        console.warn('Translation request timed out');
      } else {
        console.error("Translation error:", error);
      }
    } finally {
      setLoadingTranslation((prev) => ({ ...prev, [article.id]: false }));
    }

    return article.title; // Fallback to original
  };

  // Request AI analysis for an article with better error handling
  const requestAIAnalysis = async (article: NewsArticle) => {
    if (aiAnalysis[article.id] || loadingAnalysis[article.id]) {
      return; // Already have analysis or loading
    }

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
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        if (data.analysis) {
          setAiAnalysis((prev) => ({ ...prev, [article.id]: data.analysis }));
        } else {
          throw new Error("No analysis received");
        }
      } else {
        // Don't read response body twice - just use status for error
        console.error(`AI Analysis API error: ${response.status} - ${response.statusText}`);
        throw new Error(`API error: ${response.status}`);
      }
    } catch (error) {
      console.error("AI analysis error:", error);
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

  // Format date with timezone - always use English format to avoid Hijri calendar
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      timeZone: selectedTimezone,
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(date);
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
              {availableCategories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
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
                {language === "ar" ? "آخر ش��ر" : "Last month"}
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
                    <div className={cn(
                      "flex items-center gap-2 mb-2 flex-wrap",
                      dir === "rtl" ? "justify-start" : "justify-start"
                    )}>
                      <Badge className={cn(getImportanceColor(article.importance), "font-medium")}>
                        {getImportanceLabel(article.importance)}
                      </Badge>
                      <Badge variant="outline" className="font-medium">{article.category}</Badge>
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
                        <span className="ml-2 text-xs text-muted-foreground">(translating...)</span>
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
                      {formatDate(article.date)}
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
                          loadingAnalysis[article.id] && "animate-pulse"
                        )}
                      >
                        <Bot
                          className={cn(
                            "w-4 h-4",
                            loadingAnalysis[article.id] && "animate-spin",
                            aiAnalysis[article.id] && "text-primary-foreground"
                          )}
                        />
                        <span className="text-xs font-medium">
                          {language === "ar" ? "تحليل" : "AI"}
                        </span>
                      </Button>

                      {/* Manual Translation Button (only in Arabic mode) */}
                      {language === "ar" && !translatedTitles[article.id] && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => translateTitle(article)}
                          disabled={loadingTranslation[article.id]}
                          className="flex items-center gap-1"
                        >
                          <span className={cn(
                            "text-xs",
                            loadingTranslation[article.id] && "animate-pulse"
                          )}>
                            {loadingTranslation[article.id] ? "جاري..." : "ترجمة"}
                          </span>
                        </Button>
                      )}

                      {/* Read More Dialog */}
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            {language === "ar" ? "اقرأ المزيد" : "Read More"}
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle className="text-right" dir={dir}>
                              {article.title}
                            </DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4" dir={dir}>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Clock className="w-4 h-4" />
                              {formatDate(article.date)}
                              <Badge
                                className={getImportanceColor(
                                  article.importance,
                                )}
                              >
                                {getImportanceLabel(article.importance)}
                              </Badge>
                            </div>

                            <p className="text-sm leading-relaxed">
                              {article.content}
                            </p>

                            {article.symbols.length > 0 && (
                              <div>
                                <h4 className="font-medium mb-2">
                                  {language === "ar"
                                    ? "الرموز المتأثرة:"
                                    : "Related Symbols:"}
                                </h4>
                                <div className="flex flex-wrap gap-1">
                                  {article.symbols.map((symbol, idx) => (
                                    <Badge key={idx} variant="secondary">
                                      {symbol}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}

                            {article.link && (
                              <Button
                                variant="outline"
                                className="w-full flex items-center gap-2"
                                onClick={() =>
                                  window.open(article.link, "_blank")
                                }
                              >
                                <ExternalLink className="w-4 h-4" />
                                {language === "ar"
                                  ? "المصدر الأصلي"
                                  : "Original Source"}
                              </Button>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
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
