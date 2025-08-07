import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
  Bell,
  Newspaper,
  TrendingUp,
  Plus,
  Edit,
  Trash2,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
import { EconomicEvent } from "@shared/api";

interface NewsEventAlert {
  id: string;
  type: "news" | "event";
  title: string;
  description?: string;
  keywords: string[];
  importance?: number;
  isActive: boolean;
  triggerTime?: "before" | "at" | "after";
  minutesBefore?: number;
  createdAt: Date;
  triggeredAt?: Date;
}

interface PriceAlert {
  id: string;
  symbol: string;
  displayName: string;
  condition: "above" | "below" | "change_percent";
  targetPrice?: number;
  changePercent?: number;
  currentPrice?: number;
  isActive: boolean;
  createdAt: Date;
  triggeredAt?: Date;
  message?: string;
}

interface SeparatedAlertSystemProps {
  className?: string;
  onNewsEventAlert?: (alert: NewsEventAlert) => void;
  onPriceAlert?: (alert: PriceAlert) => void;
}

const ALL_SYMBOLS = [
  // Major Forex Pairs
  { symbol: "EURUSD.FOREX", displayName: "EUR/USD", type: "forex" },
  { symbol: "USDJPY.FOREX", displayName: "USD/JPY", type: "forex" },
  { symbol: "GBPUSD.FOREX", displayName: "GBP/USD", type: "forex" },
  { symbol: "AUDUSD.FOREX", displayName: "AUD/USD", type: "forex" },
  { symbol: "USDCHF.FOREX", displayName: "USD/CHF", type: "forex" },
  { symbol: "USDCAD.FOREX", displayName: "USD/CAD", type: "forex" },
  { symbol: "NZDUSD.FOREX", displayName: "NZD/USD", type: "forex" },
  { symbol: "EURGBP.FOREX", displayName: "EUR/GBP", type: "forex" },
  { symbol: "EURJPY.FOREX", displayName: "EUR/JPY", type: "forex" },
  { symbol: "EURCHF.FOREX", displayName: "EUR/CHF", type: "forex" },
  { symbol: "EURCAD.FOREX", displayName: "EUR/CAD", type: "forex" },
  { symbol: "EURAUD.FOREX", displayName: "EUR/AUD", type: "forex" },
  { symbol: "GBPJPY.FOREX", displayName: "GBP/JPY", type: "forex" },
  { symbol: "GBPCHF.FOREX", displayName: "GBP/CHF", type: "forex" },
  { symbol: "GBPCAD.FOREX", displayName: "GBP/CAD", type: "forex" },
  { symbol: "GBPAUD.FOREX", displayName: "GBP/AUD", type: "forex" },
  { symbol: "CHFJPY.FOREX", displayName: "CHF/JPY", type: "forex" },
  { symbol: "CADJPY.FOREX", displayName: "CAD/JPY", type: "forex" },
  { symbol: "AUDJPY.FOREX", displayName: "AUD/JPY", type: "forex" },
  { symbol: "AUDCHF.FOREX", displayName: "AUD/CHF", type: "forex" },
  { symbol: "AUDCAD.FOREX", displayName: "AUD/CAD", type: "forex" },
  { symbol: "NZDJPY.FOREX", displayName: "NZD/JPY", type: "forex" },

  // Major Cryptocurrencies
  { symbol: "BTC-USD.CC", displayName: "Bitcoin (BTC/USD)", type: "crypto" },
  { symbol: "ETH-USD.CC", displayName: "Ethereum (ETH/USD)", type: "crypto" },
  { symbol: "ADA-USD.CC", displayName: "Cardano (ADA/USD)", type: "crypto" },
  { symbol: "SOL-USD.CC", displayName: "Solana (SOL/USD)", type: "crypto" },
  { symbol: "AVAX-USD.CC", displayName: "Avalanche (AVAX/USD)", type: "crypto" },
  { symbol: "DOT-USD.CC", displayName: "Polkadot (DOT/USD)", type: "crypto" },
  { symbol: "MATIC-USD.CC", displayName: "Polygon (MATIC/USD)", type: "crypto" },
  { symbol: "LINK-USD.CC", displayName: "Chainlink (LINK/USD)", type: "crypto" },
  { symbol: "UNI-USD.CC", displayName: "Uniswap (UNI/USD)", type: "crypto" },
  { symbol: "LTC-USD.CC", displayName: "Litecoin (LTC/USD)", type: "crypto" },

  // Commodities
  { symbol: "XAUUSD.FOREX", displayName: "Gold (XAU/USD)", type: "commodity" },
  { symbol: "XAGUSD.FOREX", displayName: "Silver (XAG/USD)", type: "commodity" },
  { symbol: "WTIUSD.FOREX", displayName: "WTI Crude Oil", type: "commodity" },
  { symbol: "XPDUSD.FOREX", displayName: "Palladium (XPD/USD)", type: "commodity" },
  { symbol: "XPTUSD.FOREX", displayName: "Platinum (XPT/USD)", type: "commodity" },

  // Major Stock Indices
  { symbol: "GSPC.INDX", displayName: "S&P 500", type: "index" },
  { symbol: "DJI.INDX", displayName: "Dow Jones", type: "index" },
  { symbol: "IXIC.INDX", displayName: "NASDAQ", type: "index" },
  { symbol: "RUT.INDX", displayName: "Russell 2000", type: "index" },
  { symbol: "VIX.INDX", displayName: "VIX", type: "index" },
  { symbol: "FTSE.INDX", displayName: "FTSE 100", type: "index" },
  { symbol: "GDAXI.INDX", displayName: "DAX", type: "index" },
  { symbol: "FCHI.INDX", displayName: "CAC 40", type: "index" },
  { symbol: "N225.INDX", displayName: "Nikkei 225", type: "index" },
  { symbol: "HSI.INDX", displayName: "Hang Seng", type: "index" },
];

export default function SeparatedAlertSystem({
  className,
  onNewsEventAlert,
  onPriceAlert,
}: SeparatedAlertSystemProps) {
  const { language, dir } = useLanguage();

  // State for alerts
  const [newsEventAlerts, setNewsEventAlerts] = useState<NewsEventAlert[]>([]);
  const [priceAlerts, setPriceAlerts] = useState<PriceAlert[]>([]);

  // Dialog state
  const [isNewsDialogOpen, setIsNewsDialogOpen] = useState(false);
  const [isPriceDialogOpen, setIsPriceDialogOpen] = useState(false);

  // Form state for news/event alerts
  const [newsForm, setNewsForm] = useState({
    type: "news" as "news" | "event",
    title: "",
    description: "",
    keywords: "",
    importance: 2,
    triggerTime: "at" as "before" | "at" | "after",
    minutesBefore: 15,
  });

  // Form state for price alerts
  const [priceForm, setPriceForm] = useState({
    symbol: "",
    condition: "above" as "above" | "below" | "change_percent",
    targetPrice: "",
    changePercent: "",
    message: "",
  });

  // Symbol search state
  const [symbolSearch, setSymbolSearch] = useState("");
  const [showSymbolSuggestions, setShowSymbolSuggestions] = useState(false);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [loadingPrice, setLoadingPrice] = useState(false);
  const [selectedSymbol, setSelectedSymbol] = useState<typeof ALL_SYMBOLS[0] | null>(null);

  // Filter symbols based on search
  const filteredSymbols = React.useMemo(() => {
    if (!symbolSearch || symbolSearch.length < 2) return ALL_SYMBOLS.slice(0, 10);

    const searchLower = symbolSearch.toLowerCase();
    return ALL_SYMBOLS.filter(symbol =>
      symbol.displayName.toLowerCase().includes(searchLower) ||
      symbol.symbol.toLowerCase().includes(searchLower)
    ).slice(0, 15);
  }, [symbolSearch]);

  // Fetch real-time price for selected symbol
  const fetchRealTimePrice = async (symbol: string) => {
    if (!symbol) return;

    setLoadingPrice(true);
    try {
      const response = await fetch(`/api/eodhd-price?symbol=${encodeURIComponent(symbol)}`);
      if (response.ok) {
        const data = await response.json();
        if (data.prices && data.prices.length > 0 && data.prices[0].price) {
          setCurrentPrice(data.prices[0].price);
        } else {
          setCurrentPrice(null);
        }
      } else {
        console.error('Failed to fetch price:', response.status);
        setCurrentPrice(null);
      }
    } catch (error) {
      console.error('Error fetching price:', error);
      setCurrentPrice(null);
    } finally {
      setLoadingPrice(false);
    }
  };

  // Handle symbol selection
  const handleSymbolSelect = (symbol: typeof ALL_SYMBOLS[0]) => {
    setSelectedSymbol(symbol);
    setPriceForm(prev => ({ ...prev, symbol: symbol.symbol }));
    setSymbolSearch(symbol.displayName);
    setShowSymbolSuggestions(false);
    fetchRealTimePrice(symbol.symbol);
  };

  // Monitor price alerts - check every 30 seconds
  React.useEffect(() => {
    if (priceAlerts.length === 0) return;

    const checkAlerts = async () => {
      for (const alert of priceAlerts.filter(a => a.isActive)) {
        try {
          const response = await fetch(`/api/eodhd-price?symbol=${encodeURIComponent(alert.symbol)}`);
          if (response.ok) {
            const data = await response.json();
            if (data.prices && data.prices.length > 0 && data.prices[0].price) {
              const currentPrice = data.prices[0].price;
              const targetPrice = parseFloat(alert.targetPrice);

              let shouldTrigger = false;

              if (alert.condition === 'above' && currentPrice >= targetPrice) {
                shouldTrigger = true;
              } else if (alert.condition === 'below' && currentPrice <= targetPrice) {
                shouldTrigger = true;
              } else if (alert.condition === 'change_percent') {
                // Calculate percentage change - would need previous price stored
                // For now, skip this condition until we store previous prices
              }

              if (shouldTrigger) {
                // Trigger alert notification
                if ('Notification' in window && Notification.permission === 'granted') {
                  new Notification(`Price Alert: ${alert.symbol}`, {
                    body: `${alert.symbol} is now ${currentPrice.toFixed(5)}. ${alert.message || ''}`,
                    icon: '/favicon.ico'
                  });
                }

                // Deactivate the alert since it triggered
                setPriceAlerts(prev =>
                  prev.map(a =>
                    a.id === alert.id ? { ...a, isActive: false } : a
                  )
                );

                console.log(`Alert triggered for ${alert.symbol}: ${currentPrice}`);
              }
            }
          }
        } catch (error) {
          console.error(`Error checking alert for ${alert.symbol}:`, error);
        }
      }
    };

    // Check immediately and then every 30 seconds
    checkAlerts();
    const interval = setInterval(checkAlerts, 30000);

    return () => clearInterval(interval);
  }, [priceAlerts]);

  // Request notification permission on component mount
  React.useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Create news/event alert
  const createNewsEventAlert = () => {
    const alert: NewsEventAlert = {
      id: Date.now().toString(),
      type: newsForm.type,
      title: newsForm.title,
      description: newsForm.description,
      keywords: newsForm.keywords
        .split(",")
        .map((k) => k.trim())
        .filter((k) => k),
      importance: newsForm.importance,
      isActive: true,
      triggerTime: newsForm.triggerTime,
      minutesBefore: newsForm.minutesBefore,
      createdAt: new Date(),
    };

    setNewsEventAlerts((prev) => [...prev, alert]);
    onNewsEventAlert?.(alert);

    // Reset form
    setNewsForm({
      type: "news",
      title: "",
      description: "",
      keywords: "",
      importance: 2,
      triggerTime: "at",
      minutesBefore: 15,
    });

    setIsNewsDialogOpen(false);
  };

  // Create price alert
  const createPriceAlert = () => {
    if (!selectedSymbol || !priceForm.targetPrice) {
      return; // Don't create alert without proper symbol and target price
    }

    const alert: PriceAlert = {
      id: Date.now().toString(),
      symbol: priceForm.symbol,
      displayName: selectedSymbol.displayName,
      condition: priceForm.condition,
      targetPrice: priceForm.targetPrice
        ? parseFloat(priceForm.targetPrice)
        : undefined,
      changePercent: priceForm.changePercent
        ? parseFloat(priceForm.changePercent)
        : undefined,
      isActive: true,
      createdAt: new Date(),
      message: priceForm.message,
    };

    setPriceAlerts((prev) => [...prev, alert]);
    onPriceAlert?.(alert);

    // Reset form
    setPriceForm({
      symbol: "",
      condition: "above",
      targetPrice: "",
      changePercent: "",
      message: "",
    });
    setSymbolSearch("");
    setSelectedSymbol(null);
    setCurrentPrice(null);
    setShowSymbolSuggestions(false);
    setIsPriceDialogOpen(false);
  };

  // Delete alert functions
  const deleteNewsAlert = (id: string) => {
    setNewsEventAlerts((prev) => prev.filter((alert) => alert.id !== id));
  };

  const deletePriceAlert = (id: string) => {
    setPriceAlerts((prev) => prev.filter((alert) => alert.id !== id));
  };

  // Toggle alert active state
  const toggleNewsAlert = (id: string) => {
    setNewsEventAlerts((prev) =>
      prev.map((alert) =>
        alert.id === id ? { ...alert, isActive: !alert.isActive } : alert,
      ),
    );
  };

  const togglePriceAlert = (id: string) => {
    setPriceAlerts((prev) =>
      prev.map((alert) =>
        alert.id === id ? { ...alert, isActive: !alert.isActive } : alert,
      ),
    );
  };

  // Quick add from economic event
  const addEventAlert = (event: EconomicEvent) => {
    const alert: NewsEventAlert = {
      id: Date.now().toString(),
      type: "event",
      title: event.event,
      description: `${event.country} - ${event.category || "Economic Event"}`,
      keywords: [event.event, event.country],
      importance: event.importance,
      isActive: true,
      triggerTime: "before",
      minutesBefore: 15,
      createdAt: new Date(),
    };

    setNewsEventAlerts((prev) => [...prev, alert]);
    onNewsEventAlert?.(alert);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat(language === "ar" ? "ar-SA" : "en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  return (
    <div className={cn("w-full space-y-6", className)}>
      <Tabs defaultValue="news-events" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="news-events" className="flex items-center gap-2">
            <Newspaper className="w-4 h-4" />
            {language === "ar"
              ? "تنبيهات الأخبار والأحداث"
              : "News & Event Alerts"}
          </TabsTrigger>
          <TabsTrigger value="price-alerts" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            {language === "ar" ? "تنبيهات الأسعار" : "Price Alerts"}
          </TabsTrigger>
        </TabsList>

        {/* News & Event Alerts Tab */}
        <TabsContent value="news-events">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Newspaper className="w-5 h-5 text-primary" />
                  {language === "ar"
                    ? "تنبيهات الأخبار والأحداث الاقتصادية"
                    : "News & Economic Event Alerts"}
                </CardTitle>
                <Dialog
                  open={isNewsDialogOpen}
                  onOpenChange={setIsNewsDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button className="flex items-center gap-2">
                      <Plus className="w-4 h-4" />
                      {language === "ar" ? "إضافة تنبيه" : "Add Alert"}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>
                        {language === "ar"
                          ? "إنشاء تنبيه جديد"
                          : "Create New Alert"}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4" dir={dir}>
                      <div>
                        <Label>
                          {language === "ar" ? "نوع التنبيه" : "Alert Type"}
                        </Label>
                        <Select
                          value={newsForm.type}
                          onValueChange={(value: "news" | "event") =>
                            setNewsForm((prev) => ({ ...prev, type: value }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="news">
                              {language === "ar" ? "خبر" : "News"}
                            </SelectItem>
                            <SelectItem value="event">
                              {language === "ar"
                                ? "حدث اقتصادي"
                                : "Economic Event"}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>{language === "ar" ? "العنوان" : "Title"}</Label>
                        <Input
                          value={newsForm.title}
                          onChange={(e) =>
                            setNewsForm((prev) => ({
                              ...prev,
                              title: e.target.value,
                            }))
                          }
                          placeholder={
                            language === "ar" ? "عنوان التنبيه" : "Alert title"
                          }
                        />
                      </div>

                      <div>
                        <Label>
                          {language === "ar" ? "الكلمات المفتاحية" : "Keywords"}
                        </Label>
                        <Input
                          value={newsForm.keywords}
                          onChange={(e) =>
                            setNewsForm((prev) => ({
                              ...prev,
                              keywords: e.target.value,
                            }))
                          }
                          placeholder={
                            language === "ar"
                              ? "كلمة مفتاحية، كلمة أخرى"
                              : "keyword, another keyword"
                          }
                        />
                      </div>

                      <div>
                        <Label>
                          {language === "ar"
                            ? "مستوى الأهمية"
                            : "Importance Level"}
                        </Label>
                        <Select
                          value={newsForm.importance.toString()}
                          onValueChange={(value) =>
                            setNewsForm((prev) => ({
                              ...prev,
                              importance: parseInt(value),
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">
                              {language === "ar" ? "منخفض" : "Low"}
                            </SelectItem>
                            <SelectItem value="2">
                              {language === "ar" ? "متوسط" : "Medium"}
                            </SelectItem>
                            <SelectItem value="3">
                              {language === "ar" ? "عالي" : "High"}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>
                          {language === "ar" ? "توقيت التنبيه" : "Alert Timing"}
                        </Label>
                        <Select
                          value={newsForm.triggerTime}
                          onValueChange={(value: "before" | "at" | "after") =>
                            setNewsForm((prev) => ({
                              ...prev,
                              triggerTime: value,
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="before">
                              {language === "ar" ? "قبل الحدث" : "Before Event"}
                            </SelectItem>
                            <SelectItem value="at">
                              {language === "ar"
                                ? "عند الحدث"
                                : "At Event Time"}
                            </SelectItem>
                            <SelectItem value="after">
                              {language === "ar" ? "بعد الحدث" : "After Event"}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {newsForm.triggerTime === "before" && (
                        <div>
                          <Label>
                            {language === "ar"
                              ? "��قائق قبل الحدث"
                              : "Minutes Before Event"}
                          </Label>
                          <Input
                            type="number"
                            value={newsForm.minutesBefore}
                            onChange={(e) =>
                              setNewsForm((prev) => ({
                                ...prev,
                                minutesBefore: parseInt(e.target.value) || 15,
                              }))
                            }
                            min="1"
                            max="1440"
                          />
                        </div>
                      )}

                      <Button onClick={createNewsEventAlert} className="w-full">
                        {language === "ar" ? "إنشاء التنبيه" : "Create Alert"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {newsEventAlerts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>
                    {language === "ar"
                      ? "لا توجد تنبيهات أخبار أو أحداث"
                      : "No news or event alerts"}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {newsEventAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="border border-border rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge
                              variant={
                                alert.type === "news" ? "default" : "secondary"
                              }
                            >
                              {alert.type === "news"
                                ? language === "ar"
                                  ? "خبر"
                                  : "News"
                                : language === "ar"
                                  ? "حدث"
                                  : "Event"}
                            </Badge>
                            <Badge
                              variant={alert.isActive ? "default" : "secondary"}
                            >
                              {alert.isActive
                                ? language === "ar"
                                  ? "نشط"
                                  : "Active"
                                : language === "ar"
                                  ? "معطل"
                                  : "Inactive"}
                            </Badge>
                            {alert.triggeredAt && (
                              <Badge
                                variant="outline"
                                className="text-green-600"
                              >
                                <CheckCircle className="w-3 h-3 mr-1" />
                                {language === "ar" ? "تم التشغيل" : "Triggered"}
                              </Badge>
                            )}
                          </div>

                          <h4 className="font-medium mb-1">{alert.title}</h4>
                          {alert.description && (
                            <p className="text-sm text-muted-foreground mb-2">
                              {alert.description}
                            </p>
                          )}

                          <div className="flex flex-wrap gap-1 mb-2">
                            {alert.keywords.map((keyword, idx) => (
                              <Badge
                                key={idx}
                                variant="outline"
                                className="text-xs"
                              >
                                {keyword}
                              </Badge>
                            ))}
                          </div>

                          <div className="text-xs text-muted-foreground">
                            {language === "ar" ? "تم الإنشاء:" : "Created:"}{" "}
                            {formatDate(alert.createdAt)}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 ml-4">
                          <Switch
                            checked={alert.isActive}
                            onCheckedChange={() => toggleNewsAlert(alert.id)}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteNewsAlert(alert.id)}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Price Alerts Tab */}
        <TabsContent value="price-alerts">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  {language === "ar"
                    ? "تنبيهات أسعار العملات والأسهم"
                    : "Currency & Stock Price Alerts"}
                </CardTitle>
                <Dialog
                  open={isPriceDialogOpen}
                  onOpenChange={setIsPriceDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button className="flex items-center gap-2">
                      <Plus className="w-4 h-4" />
                      {language === "ar"
                        ? "إضاف�� تنبيه سعر"
                        : "Add Price Alert"}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>
                        {language === "ar"
                          ? "إنشاء تنبيه سعر جديد"
                          : "Create New Price Alert"}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4" dir={dir}>
                      <div>
                        <Label>{language === "ar" ? "البحث عن الرمز" : "Search Symbol"}</Label>
                        <div className="relative">
                          <Input
                            value={symbolSearch}
                            onChange={(e) => {
                              setSymbolSearch(e.target.value);
                              setShowSymbolSuggestions(e.target.value.length >= 2);
                            }}
                            onFocus={() => setShowSymbolSuggestions(symbolSearch.length >= 2)}
                            placeholder={
                              language === "ar"
                                ? "ابحث عن الرمز (مثل: EUR, BTC, GOLD)"
                                : "Search symbol (e.g: EUR, BTC, GOLD)"
                            }
                            className="pr-10"
                          />

                          {/* Real-time price display */}
                          {selectedSymbol && (
                            <div className="mt-2 p-2 bg-muted/50 rounded border">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">{selectedSymbol.displayName}</span>
                                <div className="text-right">
                                  {loadingPrice ? (
                                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                  ) : currentPrice ? (
                                    <span className="text-lg font-bold text-primary">
                                      {currentPrice.toFixed(selectedSymbol.type === 'crypto' ? 2 : 5)}
                                    </span>
                                  ) : (
                                    <span className="text-sm text-muted-foreground">
                                      {language === "ar" ? "السعر غير متاح" : "Price unavailable"}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                {language === "ar" ? "السعر الحالي" : "Current Price"}
                              </div>
                            </div>
                          )}

                          {/* Symbol suggestions dropdown */}
                          {showSymbolSuggestions && filteredSymbols.length > 0 && (
                            <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-background border border-border/50 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                              <div className="p-2">
                                <div className="text-xs text-muted-foreground mb-2 px-2">
                                  {language === "ar" ? "اختر الرمز:" : "Select Symbol:"}
                                </div>
                                {filteredSymbols.map((symbol) => (
                                  <div
                                    key={symbol.symbol}
                                    onClick={() => handleSymbolSelect(symbol)}
                                    className="flex items-center gap-3 p-2 hover:bg-muted/50 cursor-pointer rounded text-sm"
                                  >
                                    <div className="flex-1">
                                      <div className="font-medium">{symbol.displayName}</div>
                                      <div className="text-xs text-muted-foreground">
                                        {symbol.symbol} • {symbol.type.toUpperCase()}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <Label>
                          {language === "ar"
                            ? "شرط التنبيه"
                            : "Alert Condition"}
                        </Label>
                        <Select
                          value={priceForm.condition}
                          onValueChange={(
                            value: "above" | "below" | "change_percent",
                          ) =>
                            setPriceForm((prev) => ({
                              ...prev,
                              condition: value,
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="above">
                              {language === "ar" ? "أعلى من" : "Above"}
                            </SelectItem>
                            <SelectItem value="below">
                              {language === "ar" ? "أقل من" : "Below"}
                            </SelectItem>
                            <SelectItem value="change_percent">
                              {language === "ar"
                                ? "تغيير بنسبة"
                                : "Change by %"}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {priceForm.condition === "change_percent" ? (
                        <div>
                          <Label>
                            {language === "ar"
                              ? "نسبة التغيير (%)"
                              : "Change Percentage (%)"}
                          </Label>
                          <Input
                            type="number"
                            step="0.1"
                            value={priceForm.changePercent}
                            onChange={(e) =>
                              setPriceForm((prev) => ({
                                ...prev,
                                changePercent: e.target.value,
                              }))
                            }
                            placeholder="5.0"
                          />
                        </div>
                      ) : (
                        <div>
                          <Label>
                            {language === "ar"
                              ? "السعر المستهدف"
                              : "Target Price"}
                          </Label>
                          <Input
                            type="number"
                            step="0.00001"
                            value={priceForm.targetPrice}
                            onChange={(e) =>
                              setPriceForm((prev) => ({
                                ...prev,
                                targetPrice: e.target.value,
                              }))
                            }
                            placeholder="1.2345"
                          />
                        </div>
                      )}

                      <div>
                        <Label>
                          {language === "ar"
                            ? "رسالة مخصصة (اختيارية)"
                            : "Custom Message (Optional)"}
                        </Label>
                        <Textarea
                          value={priceForm.message}
                          onChange={(e) =>
                            setPriceForm((prev) => ({
                              ...prev,
                              message: e.target.value,
                            }))
                          }
                          placeholder={
                            language === "ar"
                              ? "رسالة التنبيه"
                              : "Alert message"
                          }
                          rows={2}
                        />
                      </div>

                      <Button onClick={createPriceAlert} className="w-full">
                        {language === "ar"
                          ? "إنشاء تنبيه السعر"
                          : "Create Price Alert"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {priceAlerts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>
                    {language === "ar"
                      ? "لا توجد تنبيهات أسعار"
                      : "No price alerts"}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {priceAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="border border-border rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="default">{alert.displayName}</Badge>
                            <Badge
                              variant={alert.isActive ? "default" : "secondary"}
                            >
                              {alert.isActive
                                ? language === "ar"
                                  ? "نشط"
                                  : "Active"
                                : language === "ar"
                                  ? "معطل"
                                  : "Inactive"}
                            </Badge>
                            {alert.triggeredAt && (
                              <Badge
                                variant="outline"
                                className="text-green-600"
                              >
                                <CheckCircle className="w-3 h-3 mr-1" />
                                {language === "ar" ? "تم التشغيل" : "Triggered"}
                              </Badge>
                            )}
                          </div>

                          <div className="text-sm mb-2">
                            {alert.condition === "above" && (
                              <span>
                                {language === "ar"
                                  ? "تنبيه عندما يتجاوز السعر"
                                  : "Alert when price goes above"}{" "}
                                {alert.targetPrice}
                              </span>
                            )}
                            {alert.condition === "below" && (
                              <span>
                                {language === "ar"
                                  ? "تنبيه عندما ينخفض السعر دون"
                                  : "Alert when price goes below"}{" "}
                                {alert.targetPrice}
                              </span>
                            )}
                            {alert.condition === "change_percent" && (
                              <span>
                                {language === "ar"
                                  ? "تنبيه عند تغيير السعر بنسبة"
                                  : "Alert when price changes by"}{" "}
                                {alert.changePercent}%
                              </span>
                            )}
                          </div>

                          {alert.currentPrice && (
                            <div className="text-sm text-muted-foreground mb-2">
                              {language === "ar"
                                ? "السعر الحالي:"
                                : "Current price:"}{" "}
                              {alert.currentPrice}
                            </div>
                          )}

                          {alert.message && (
                            <p className="text-sm text-muted-foreground mb-2">
                              {alert.message}
                            </p>
                          )}

                          <div className="text-xs text-muted-foreground">
                            {language === "ar" ? "تم الإنشاء:" : "Created:"}{" "}
                            {formatDate(alert.createdAt)}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 ml-4">
                          <Switch
                            checked={alert.isActive}
                            onCheckedChange={() => togglePriceAlert(alert.id)}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deletePriceAlert(alert.id)}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
