import React, { useState, useEffect, useCallback, useMemo } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
  Bell,
  TrendingUp,
  TrendingDown,
  Plus,
  Edit,
  Trash2,
  Search,
  Loader2,
  CheckCircle,
  XCircle,
  Volume2,
} from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
import { toast } from "sonner";
import { fetchSpot } from "@/lib/alerts";

interface PriceAlert {
  id: string;
  symbol: string;
  symbolName: string;
  targetPrice: number;
  condition: "above" | "below";
  isActive: boolean;
  createdAt: string;
  triggeredAt?: string;
  notificationEnabled: boolean;
  soundEnabled: boolean;
}

interface SymbolData {
  symbol: string;
  name: string;
  price?: number;
  change?: number;
  changePercent?: number;
  category: "forex" | "crypto" | "stocks" | "indices" | "commodities";
}

// Comprehensive symbol database
const SYMBOL_DATABASE: SymbolData[] = [
  // Major Forex Pairs
  { symbol: "EURUSD.FOREX", name: "EUR/USD", category: "forex" },
  { symbol: "GBPUSD.FOREX", name: "GBP/USD", category: "forex" },
  { symbol: "USDJPY.FOREX", name: "USD/JPY", category: "forex" },
  { symbol: "AUDUSD.FOREX", name: "AUD/USD", category: "forex" },
  { symbol: "USDCHF.FOREX", name: "USD/CHF", category: "forex" },
  { symbol: "USDCAD.FOREX", name: "USD/CAD", category: "forex" },
  { symbol: "NZDUSD.FOREX", name: "NZD/USD", category: "forex" },
  { symbol: "EURGBP.FOREX", name: "EUR/GBP", category: "forex" },
  { symbol: "EURJPY.FOREX", name: "EUR/JPY", category: "forex" },
  { symbol: "GBPJPY.FOREX", name: "GBP/JPY", category: "forex" },

  // Cryptocurrencies
  { symbol: "BTC-USD.CC", name: "Bitcoin (BTC/USD)", category: "crypto" },
  { symbol: "ETH-USD.CC", name: "Ethereum (ETH/USD)", category: "crypto" },
  { symbol: "XRP-USD.CC", name: "XRP (XRP/USD)", category: "crypto" },
  { symbol: "LTC-USD.CC", name: "Litecoin (LTC/USD)", category: "crypto" },
  { symbol: "ADA-USD.CC", name: "Cardano (ADA/USD)", category: "crypto" },
  { symbol: "DOT-USD.CC", name: "Polkadot (DOT/USD)", category: "crypto" },
  { symbol: "LINK-USD.CC", name: "Chainlink (LINK/USD)", category: "crypto" },
  { symbol: "BCH-USD.CC", name: "Bitcoin Cash (BCH/USD)", category: "crypto" },

  // Major Indices
  { symbol: "GSPC.INDX", name: "S&P 500", category: "indices" },
  { symbol: "IXIC.INDX", name: "NASDAQ Composite", category: "indices" },
  {
    symbol: "DJI.INDX",
    name: "Dow Jones Industrial Average",
    category: "indices",
  },
  { symbol: "RUT.INDX", name: "Russell 2000", category: "indices" },
  { symbol: "VIX.INDX", name: "VIX Volatility Index", category: "indices" },
  { symbol: "N225.INDX", name: "Nikkei 225", category: "indices" },
  { symbol: "HSI.INDX", name: "Hang Seng Index", category: "indices" },
  { symbol: "FTSE.INDX", name: "FTSE 100", category: "indices" },
  { symbol: "DAX.INDX", name: "DAX", category: "indices" },
  { symbol: "CAC.INDX", name: "CAC 40", category: "indices" },

  // Major Stocks
  { symbol: "AAPL.US", name: "Apple Inc.", category: "stocks" },
  { symbol: "MSFT.US", name: "Microsoft Corporation", category: "stocks" },
  { symbol: "GOOGL.US", name: "Alphabet Inc.", category: "stocks" },
  { symbol: "AMZN.US", name: "Amazon.com Inc.", category: "stocks" },
  { symbol: "TSLA.US", name: "Tesla Inc.", category: "stocks" },
  { symbol: "META.US", name: "Meta Platforms Inc.", category: "stocks" },
  { symbol: "NVDA.US", name: "NVIDIA Corporation", category: "stocks" },
  { symbol: "NFLX.US", name: "Netflix Inc.", category: "stocks" },
  { symbol: "AMD.US", name: "Advanced Micro Devices", category: "stocks" },
  { symbol: "INTC.US", name: "Intel Corporation", category: "stocks" },

  // Commodities
  { symbol: "XAUUSD.FOREX", name: "Gold (XAU/USD)", category: "commodities" },
  { symbol: "XAGUSD.FOREX", name: "Silver (XAG/USD)", category: "commodities" },
  {
    symbol: "XPTUSD.FOREX",
    name: "Platinum (XPT/USD)",
    category: "commodities",
  },
  {
    symbol: "XPDUSD.FOREX",
    name: "Palladium (XPD/USD)",
    category: "commodities",
  },
  { symbol: "CL.F", name: "Crude Oil WTI", category: "commodities" },
  { symbol: "BZ.F", name: "Brent Crude Oil", category: "commodities" },
  { symbol: "NG.F", name: "Natural Gas", category: "commodities" },
];

// Hijri date conversion utility
function getHijriDate(): string {
  try {
    const now = new Date();
    const hijriDate = new Intl.DateTimeFormat("ar-SA", {
      calendar: "islamic",
      numberingSystem: "arab",
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(now);
    return hijriDate;
  } catch (error) {
    console.error("Error getting Hijri date:", error);
    return "";
  }
}

// LocalStorage utilities
const STORAGE_KEYS = {
  PRICE_ALERTS: "liirat_price_alerts",
  ALERT_SETTINGS: "liirat_alert_settings",
};

function saveToStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error("Error saving to localStorage:", error);
  }
}

function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error("Error loading from localStorage:", error);
    return defaultValue;
  }
}

interface DynamicAlertSystemProps {
  className?: string;
}

export default function DynamicAlertSystem({
  className,
}: DynamicAlertSystemProps) {
  const { language } = useLanguage();
  const [priceAlerts, setPriceAlerts] = useState<PriceAlert[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAlert, setEditingAlert] = useState<PriceAlert | null>(null);

  // Form states
  const [symbolSearch, setSymbolSearch] = useState("");
  const [selectedSymbol, setSelectedSymbol] = useState<SymbolData | null>(null);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [priceLoading, setPriceLoading] = useState(false);
  const [targetPrice, setTargetPrice] = useState("");
  const [condition, setCondition] = useState<"above" | "below">("above");
  const [notificationEnabled, setNotificationEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Load data from localStorage on mount
  useEffect(() => {
    const savedPriceAlerts = loadFromStorage<PriceAlert[]>(
      STORAGE_KEYS.PRICE_ALERTS,
      [],
    );
    setPriceAlerts(savedPriceAlerts);
  }, []);

  // Save to localStorage whenever alerts change
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.PRICE_ALERTS, priceAlerts);
  }, [priceAlerts]);

  // Filter symbols based on search
  const filteredSymbols = useMemo(() => {
    if (!symbolSearch.trim()) return SYMBOL_DATABASE.slice(0, 10);

    const searchLower = symbolSearch.toLowerCase();
    return SYMBOL_DATABASE.filter(
      (symbol) =>
        symbol.name.toLowerCase().includes(searchLower) ||
        symbol.symbol.toLowerCase().includes(searchLower) ||
        symbol.category.toLowerCase().includes(searchLower),
    ).slice(0, 20);
  }, [symbolSearch]);

  // Fetch real-time price for selected symbol
  const fetchSymbolPrice = useCallback(
    async (symbolData: SymbolData) => {
      if (!symbolData) return;

      setPriceLoading(true);
      try {
        const response = await fetch(
          `/api/eodhd/price?s=${encodeURIComponent(symbolData.symbol)}`,
        );

        if (response.ok) {
          const data = await response.json();
          if (data.ok && data.items && data.items.length > 0) {
            const price = data.items[0];
            setCurrentPrice(price.price);

            // Update symbol data with current price info
            setSelectedSymbol((prev) =>
              prev
                ? {
                    ...prev,
                    price: price.price,
                    change: price.change,
                    changePercent: price.changePct,
                  }
                : null,
            );
          }
        }
      } catch (error) {
        console.error("Error fetching symbol price:", error);
        toast.error(
          language === "ar"
            ? "خطأ في جلب السعر الحالي"
            : "Error fetching current price",
        );
      } finally {
        setPriceLoading(false);
      }
    },
    [language],
  );

  // Handle symbol selection
  const handleSymbolSelect = useCallback(
    (symbolData: SymbolData) => {
      setSelectedSymbol(symbolData);
      setSymbolSearch(symbolData.name);
      fetchSymbolPrice(symbolData);
    },
    [fetchSymbolPrice],
  );

  // Real-time price checking for active alerts (NO NOTIFICATIONS)
  const checkPriceAlerts = useCallback(async () => {
    const activeAlerts = priceAlerts.filter(
      (alert) => alert.isActive && !alert.triggeredAt,
    );

    for (const alert of activeAlerts) {
      try {
        const response = await fetch(
          `/api/eodhd/price?s=${encodeURIComponent(alert.symbol)}`,
        );
        if (response.ok) {
          const data = await response.json();
          const currentPrice = data.price || data.close || 0;
          if (currentPrice > 0) {
            const targetPrice = alert.targetPrice;

            let shouldTrigger = false;
            if (alert.condition === "above" && currentPrice >= targetPrice) {
              shouldTrigger = true;
            } else if (
              alert.condition === "below" &&
              currentPrice <= targetPrice
            ) {
              shouldTrigger = true;
            }

            if (shouldTrigger) {
              // Update alert as triggered
              setPriceAlerts((prev) =>
                prev.map((a) =>
                  a.id === alert.id
                    ? { ...a, triggeredAt: new Date().toISOString() }
                    : a,
                ),
              );

              // Create internal notification log ONLY (no UI notifications)
              const hijriDate = getHijriDate();
              const dubaiTime = new Date().toLocaleString("ar-AE", {
                timeZone: "Asia/Dubai",
                hour: "2-digit",
                minute: "2-digit",
              });

              console.log(`Price Alert Triggered: ${alert.symbolName}`, {
                currentPrice,
                targetPrice,
                condition: alert.condition,
                hijriDate,
                dubaiTime,
              });

              // Show ONLY toast notification (no browser notification or nav bar notification)
              if (alert.notificationEnabled) {
                const title =
                  language === "ar"
                    ? `تنبيه سعر ${alert.symbolName}`
                    : `Price Alert: ${alert.symbolName}`;

                const body =
                  language === "ar"
                    ? `السعر الحالي: $${currentPrice.toLocaleString()}\nالهدف: ${alert.condition === "above" ? "أعلى من" : "أقل من"} $${targetPrice.toLocaleString()}`
                    : `Current price: $${currentPrice.toLocaleString()}\nTarget: ${alert.condition} $${targetPrice.toLocaleString()}`;

                toast.success(title, {
                  description: body,
                  duration: 8000,
                });
              }
            }
          }
        }
      } catch (error) {
        console.error(`Error checking price for ${alert.symbol}:`, error);
      }
    }
  }, [priceAlerts, language]);

  // Check alerts every 30 seconds
  useEffect(() => {
    const interval = setInterval(checkPriceAlerts, 30000);
    return () => clearInterval(interval);
  }, [checkPriceAlerts]);

  // Fetch live price for selected symbol when dialog is open - poll every 5s
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isDialogOpen && selectedSymbol) {
      const fetchPrice = async () => {
        try {
          setPriceLoading(true);
          const data = await fetchSpot(selectedSymbol.symbol);
          setCurrentPrice(data.price || data.close || null);
        } catch (error) {
          console.warn("Failed to fetch live price:", error);
        } finally {
          setPriceLoading(false);
        }
      };

      fetchPrice(); // Initial fetch
      interval = setInterval(fetchPrice, 5000); // Poll every 5s while dialog open
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isDialogOpen, selectedSymbol]);

  // Create new price alert
  const createPriceAlert = () => {
    if (!selectedSymbol || !targetPrice) {
      toast.error(
        language === "ar"
          ? "يرجى اختي��ر الرمز والسعر المستهدف"
          : "Please select symbol and target price",
      );
      return;
    }

    const newAlert: PriceAlert = {
      id: Date.now().toString(),
      symbol: selectedSymbol.symbol,
      symbolName: selectedSymbol.name,
      targetPrice: parseFloat(targetPrice),
      condition,
      isActive: true,
      createdAt: new Date().toISOString(),
      notificationEnabled,
      soundEnabled,
    };

    if (editingAlert) {
      setPriceAlerts((prev) =>
        prev.map((alert) =>
          alert.id === editingAlert.id
            ? { ...newAlert, id: editingAlert.id }
            : alert,
        ),
      );
      setEditingAlert(null);
    } else {
      setPriceAlerts((prev) => [...prev, newAlert]);
    }

    // Reset form
    setSymbolSearch("");
    setSelectedSymbol(null);
    setCurrentPrice(null);
    setTargetPrice("");
    setCondition("above");
    setIsDialogOpen(false);

    toast.success(
      language === "ar"
        ? "تم إنشاء التنبيه بنجاح"
        : "Alert created successfully",
    );
  };

  // Delete alert
  const deleteAlert = (id: string) => {
    setPriceAlerts((prev) => prev.filter((alert) => alert.id !== id));
    toast.success(language === "ar" ? "تم حذف الت��بيه" : "Alert deleted");
  };

  // Toggle alert active state
  const toggleAlert = (id: string) => {
    setPriceAlerts((prev) =>
      prev.map((alert) =>
        alert.id === id ? { ...alert, isActive: !alert.isActive } : alert,
      ),
    );
  };

  return (
    <div className={cn("w-full space-y-6", className)}>
      <Card className="neumorphic-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-2xl font-bold flex items-center gap-2">
            <Bell className="h-6 w-6 text-primary" />
            {language === "ar" ? "نظام التنبيهات الذكي" : "Smart Alert System"}
          </CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg border-0 font-medium"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                {language === "ar" ? "إضافة تنبيه" : "Add Alert"}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>
                  {editingAlert
                    ? language === "ar"
                      ? "تعديل التنبيه"
                      : "Edit Alert"
                    : language === "ar"
                      ? "إنشاء تنبيه جديد"
                      : "Create New Alert"}
                </DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                {/* Symbol Search */}
                <div className="grid gap-2">
                  <Label htmlFor="symbolSearch">
                    {language === "ar" ? "البحث عن الرمز" : "Search Symbol"}
                  </Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="symbolSearch"
                      value={symbolSearch}
                      onChange={(e) => setSymbolSearch(e.target.value)}
                      placeholder={
                        language === "ar"
                          ? "ابحث عن أسهم، عملات، مؤشرات..."
                          : "Search stocks, forex, indices..."
                      }
                      className="pl-10"
                    />
                  </div>

                  {/* Symbol Suggestions */}
                  {symbolSearch && filteredSymbols.length > 0 && (
                    <div className="max-h-48 overflow-y-auto border rounded-md bg-background">
                      {filteredSymbols.map((symbol) => (
                        <div
                          key={symbol.symbol}
                          onClick={() => handleSymbolSelect(symbol)}
                          className="p-3 hover:bg-muted cursor-pointer border-b last:border-b-0"
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="font-medium">{symbol.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {symbol.symbol} • {symbol.category}
                              </div>
                            </div>
                            {symbol.price && (
                              <div className="text-right">
                                <div className="font-mono text-sm">
                                  ${symbol.price.toLocaleString()}
                                </div>
                                {symbol.changePercent && (
                                  <div
                                    className={cn(
                                      "text-xs font-mono",
                                      symbol.changePercent >= 0
                                        ? "text-green-500"
                                        : "text-red-500",
                                    )}
                                  >
                                    {symbol.changePercent >= 0 ? "+" : ""}
                                    {symbol.changePercent.toFixed(2)}%
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Current Price Display */}
                {selectedSymbol && (
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium">{selectedSymbol.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {selectedSymbol.symbol}
                        </div>
                      </div>
                      <div className="text-right">
                        {priceLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : currentPrice ? (
                          <>
                            <div className="font-mono text-lg font-bold">
                              ${currentPrice.toLocaleString()}
                            </div>
                            {selectedSymbol.changePercent && (
                              <div
                                className={cn(
                                  "text-sm font-mono flex items-center gap-1",
                                  selectedSymbol.changePercent >= 0
                                    ? "text-green-500"
                                    : "text-red-500",
                                )}
                              >
                                {selectedSymbol.changePercent >= 0 ? (
                                  <TrendingUp className="h-3 w-3" />
                                ) : (
                                  <TrendingDown className="h-3 w-3" />
                                )}
                                {selectedSymbol.changePercent >= 0 ? "+" : ""}
                                {selectedSymbol.changePercent.toFixed(2)}%
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="text-sm text-muted-foreground">
                            {language === "ar" ? "غير متاح" : "No data"}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid gap-2">
                  <Label htmlFor="condition">
                    {language === "ar" ? "الشرط" : "Condition"}
                  </Label>
                  <Select
                    value={condition}
                    onValueChange={(value: "above" | "below") =>
                      setCondition(value)
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
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="targetPrice">
                    {language === "ar" ? "السعر المستهدف" : "Target Price"}
                  </Label>
                  <Input
                    id="targetPrice"
                    type="number"
                    step="0.00001"
                    value={targetPrice}
                    onChange={(e) => setTargetPrice(e.target.value)}
                    placeholder={
                      language === "ar" ? "أدخل السعر" : "Enter price"
                    }
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="notifications"
                    checked={notificationEnabled}
                    onCheckedChange={setNotificationEnabled}
                  />
                  <Label htmlFor="notifications">
                    {language === "ar"
                      ? "تفعيل التنبيهات"
                      : "Enable Notifications"}
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="sound"
                    checked={soundEnabled}
                    onCheckedChange={setSoundEnabled}
                  />
                  <Label htmlFor="sound">
                    {language === "ar" ? "تفعيل الصوت" : "Enable Sound"}
                  </Label>
                </div>

                <Button
                  onClick={createPriceAlert}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                  disabled={!selectedSymbol || !targetPrice}
                >
                  {editingAlert
                    ? language === "ar"
                      ? "تحديث التنبيه"
                      : "Update Alert"
                    : language === "ar"
                      ? "إنشاء التنبيه"
                      : "Create Alert"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {priceAlerts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>
                  {language === "ar"
                    ? "لا توجد تنبيهات حالياً"
                    : "No alerts yet"}
                </p>
                <p className="text-sm">
                  {language === "ar"
                    ? "قم بإنشاء تنبيه لمتابعة أسعار الأسواق المالية"
                    : "Create an alert to track financial market prices"}
                </p>
              </div>
            ) : (
              priceAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-center justify-between p-4 border rounded-lg neumorphic-sm"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "w-3 h-3 rounded-full",
                        alert.isActive ? "bg-green-500" : "bg-gray-400",
                      )}
                    />
                    <div>
                      <div className="font-medium">{alert.symbolName}</div>
                      <div className="text-sm text-muted-foreground">
                        {language === "ar"
                          ? `${alert.condition === "above" ? "أعلى من" : "أقل من"} $${alert.targetPrice.toLocaleString()}`
                          : `${alert.condition} $${alert.targetPrice.toLocaleString()}`}
                      </div>
                      {alert.triggeredAt && (
                        <Badge variant="outline" className="text-xs mt-1">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          {language === "ar" ? "تم التفعيل" : "Triggered"}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {alert.notificationEnabled && (
                      <Bell className="h-4 w-4 text-blue-500" />
                    )}
                    {alert.soundEnabled && (
                      <Volume2 className="h-4 w-4 text-green-500" />
                    )}
                    <Switch
                      checked={alert.isActive}
                      onCheckedChange={() => toggleAlert(alert.id)}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingAlert(alert);
                        // Find symbol data for editing
                        const symbolData = SYMBOL_DATABASE.find(
                          (s) => s.symbol === alert.symbol,
                        );
                        if (symbolData) {
                          setSelectedSymbol(symbolData);
                          setSymbolSearch(symbolData.name);
                          fetchSymbolPrice(symbolData);
                        }
                        setTargetPrice(alert.targetPrice.toString());
                        setCondition(alert.condition);
                        setNotificationEnabled(alert.notificationEnabled);
                        setSoundEnabled(alert.soundEnabled);
                        setIsDialogOpen(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteAlert(alert.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
