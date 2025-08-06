import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLanguage } from "@/contexts/language-context";
import { useAlerts } from "@/contexts/alert-context";
import {
  Plus,
  Trash2,
  Bell,
  TrendingUp,
  TrendingDown,
  Search,
  X,
  AlertTriangle,
  Clock,
  Target,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CurrencyPair {
  symbol: string;
  name: string;
  nameAr: string;
  currentPrice: number;
  change: number;
  changePercent: number;
}

interface PriceAlert {
  id: string;
  pair: string;
  targetPrice: number;
  condition: "above" | "below";
  isActive: boolean;
  createdAt: Date;
  name: string;
}

interface AdvancedAlertSystemProps {
  className?: string;
}

export function AdvancedAlertSystem({ className }: AdvancedAlertSystemProps) {
  const { language, dir } = useLanguage();
  const { addAlert } = useAlerts();
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedPair, setSelectedPair] = useState<CurrencyPair | null>(null);
  const [targetPrice, setTargetPrice] = useState("");
  const [condition, setCondition] = useState<"above" | "below">("above");
  const searchRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Real symbols compatible with Polygon.io API - will be updated with real prices
  const [currencyPairs, setCurrencyPairs] = useState<CurrencyPair[]>([
    {
      symbol: "EURUSD",
      name: "EUR/USD",
      nameAr: "يورو/دولار",
      currentPrice: 1.0856,
      change: 0.0023,
      changePercent: 0.21,
    },
    {
      symbol: "GBPUSD",
      name: "GBP/USD",
      nameAr: "جنيه/دولار",
      currentPrice: 1.2645,
      change: -0.0089,
      changePercent: -0.7,
    },
    {
      symbol: "USDJPY",
      name: "USD/JPY",
      nameAr: "دولار/ين",
      currentPrice: 148.23,
      change: 0.45,
      changePercent: 0.3,
    },
    {
      symbol: "AAPL",
      name: "Apple Inc",
      nameAr: "أبل",
      currentPrice: 185.25,
      change: 2.15,
      changePercent: 1.17,
    },
    {
      symbol: "GOOGL",
      name: "Alphabet Inc",
      nameAr: "ألفابت",
      currentPrice: 142.3,
      change: -1.85,
      changePercent: -1.28,
    },
    {
      symbol: "MSFT",
      name: "Microsoft Corp",
      nameAr: "مايكروسوفت",
      currentPrice: 415.5,
      change: 5.25,
      changePercent: 1.28,
    },
    {
      symbol: "TSLA",
      name: "Tesla Inc",
      nameAr: "تيسلا",
      currentPrice: 248.75,
      change: -8.5,
      changePercent: -3.31,
    },
    {
      symbol: "NVDA",
      name: "NVIDIA Corp",
      nameAr: "إنفيديا",
      currentPrice: 785.45,
      change: 12.3,
      changePercent: 1.59,
    },
    {
      symbol: "SPY",
      name: "S&P 500 ETF",
      nameAr: "صندوق إس&بي 500",
      currentPrice: 485.2,
      change: 3.15,
      changePercent: 0.65,
    },
    {
      symbol: "QQQ",
      name: "Nasdaq ETF",
      nameAr: "صندوق ناسداك",
      currentPrice: 398.75,
      change: -2.45,
      changePercent: -0.61,
    },
    {
      symbol: "BTCUSD",
      name: "Bitcoin/USD",
      nameAr: "بيتكوين/دولار",
      currentPrice: 43250.75,
      change: -1250.25,
      changePercent: -2.81,
    },
    {
      symbol: "ETHUSD",
      name: "Ethereum/USD",
      nameAr: "إيثريوم/دولار",
      currentPrice: 2650.5,
      change: 85.25,
      changePercent: 3.33,
    },
  ]);

  // Filter pairs based on search query
  const filteredPairs = currencyPairs.filter(
    (pair) =>
      pair.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pair.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pair.nameAr.includes(searchQuery),
  );

  // Show suggestions when typing
  useEffect(() => {
    setShowSuggestions(searchQuery.length > 0 && !selectedPair);
  }, [searchQuery, selectedPair]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Load alerts from localStorage on mount
  useEffect(() => {
    const savedAlerts = localStorage.getItem("price-alerts");
    if (savedAlerts) {
      try {
        const parsed = JSON.parse(savedAlerts);
        setAlerts(
          parsed.map((alert: any) => ({
            ...alert,
            createdAt: new Date(alert.createdAt),
          })),
        );
      } catch (error) {
        console.error("Error loading alerts:", error);
      }
    }
  }, []);

  // Fetch real-time prices for currency pairs
  useEffect(() => {
    const fetchRealPrices = async () => {
      try {
        const updatedPairs = await Promise.all(
          currencyPairs.map(async (pair) => {
            try {
              const response = await fetch(
                `/api/price-alert?symbol=${pair.symbol}`,
              );

              // Check if response is HTML (error page) instead of JSON
              const contentType = response.headers.get("content-type");
              if (!contentType || !contentType.includes("application/json")) {
                console.warn(
                  `API returned non-JSON response for ${pair.symbol}, using mock data`,
                );
                return pair; // Return original with mock data
              }

              if (response.ok) {
                const data = await response.json();
                return {
                  ...pair,
                  currentPrice: data.price || pair.currentPrice,
                  change: data.change || pair.change,
                  changePercent: data.changePercent || pair.changePercent,
                };
              } else {
                console.warn(
                  `API request failed for ${pair.symbol}: ${response.status}`,
                );
                return pair; // Return original with mock data
              }
            } catch (error) {
              // Handle JSON parsing errors and other issues
              if (
                error instanceof SyntaxError &&
                error.message.includes("Unexpected token")
              ) {
                console.warn(
                  `API returned HTML instead of JSON for ${pair.symbol}, likely endpoint not available in dev mode`,
                );
              } else {
                console.warn(
                  `Failed to fetch price for ${pair.symbol}:`,
                  error,
                );
              }
              return pair; // Return original with mock data
            }
          }),
        );
        setCurrencyPairs(updatedPairs);
      } catch (error) {
        console.error("Error fetching real prices:", error);
      }
    };

    // Initial fetch
    fetchRealPrices();

    // Update prices every 30 seconds
    const interval = setInterval(fetchRealPrices, 30000);
    return () => clearInterval(interval);
  }, []);

  // Save alerts to localStorage whenever alerts change
  useEffect(() => {
    localStorage.setItem("price-alerts", JSON.stringify(alerts));
  }, [alerts]);

  // Monitor price alerts using Polygon.io API
  useEffect(() => {
    const checkPriceAlerts = async () => {
      for (const alert of alerts) {
        if (!alert.isActive) continue;

        try {
          // Fetch real-time price from our API
          const response = await fetch(`/api/price-alert?symbol=${alert.pair}`);

          // Check if response is HTML (error page) instead of JSON
          const contentType = response.headers.get("content-type");
          if (!contentType || !contentType.includes("application/json")) {
            console.warn(
              `API returned HTML for ${alert.pair}, skipping alert check`,
            );
            continue;
          }

          if (!response.ok) {
            console.warn(
              `Failed to fetch price for ${alert.pair}:`,
              response.statusText,
            );
            continue;
          }

          const data = await response.json();
          const currentPrice = data.price;

          if (!currentPrice) continue;

          const isTriggered =
            (alert.condition === "above" &&
              currentPrice >= alert.targetPrice) ||
            (alert.condition === "below" && currentPrice <= alert.targetPrice);

          if (isTriggered) {
            // Trigger notification using the global notification system
            if ((window as any).addPriceNotification) {
              (window as any).addPriceNotification({
                symbol: alert.pair,
                currentPrice,
                targetPrice: alert.targetPrice,
                condition: alert.condition,
              });
            }

            // Also add to alert context for legacy compatibility
            const message =
              language === "ar"
                ? `تنبيه سعر: ${alert.name} ${alert.condition === "above" ? "فوق" : "تحت"} ${alert.targetPrice.toFixed(4)}`
                : `Price Alert: ${alert.name} ${alert.condition === "above" ? "above" : "below"} ${alert.targetPrice.toFixed(4)}`;

            addAlert({
              eventName: `${alert.pair} ${language === "ar" ? "تنبيه سعر" : "Price Alert"}`,
              message,
              importance: 3,
            });

            // Deactivate the alert to prevent spam
            setAlerts((prev) =>
              prev.map((a) =>
                a.id === alert.id ? { ...a, isActive: false } : a,
              ),
            );
          }
        } catch (error) {
          // Handle JSON parsing errors gracefully
          if (
            error instanceof SyntaxError &&
            error.message.includes("Unexpected token")
          ) {
            console.warn(
              `API endpoint returned HTML for ${alert.pair}, likely not available in development mode`,
            );
          } else {
            console.warn(`Error checking price for ${alert.pair}:`, error);
          }
        }
      }
    };

    if (alerts.length === 0) return;

    // Initial check
    checkPriceAlerts();

    // Set up interval - respecting Polygon.io rate limits (5 calls/minute = 12 seconds)
    const interval = setInterval(checkPriceAlerts, 15000); // 15 seconds to be safe

    return () => clearInterval(interval);
  }, [alerts, addAlert, language]);

  const handlePairSelect = (pair: CurrencyPair) => {
    setSelectedPair(pair);
    setSearchQuery(pair.symbol);
    setShowSuggestions(false);
  };

  const handleCreateAlert = () => {
    if (!selectedPair || !targetPrice || isNaN(parseFloat(targetPrice))) {
      // Show error feedback if validation fails
      console.warn("Invalid alert data:", { selectedPair, targetPrice });
      return;
    }

    const targetPriceNum = parseFloat(targetPrice);
    if (targetPriceNum <= 0) {
      console.warn("Target price must be positive");
      return;
    }

    const newAlert: PriceAlert = {
      id: Date.now().toString(),
      pair: selectedPair.symbol,
      targetPrice: targetPriceNum,
      condition,
      isActive: true,
      createdAt: new Date(),
      name: language === "ar" ? selectedPair.nameAr : selectedPair.name,
    };

    setAlerts((prev) => [...prev, newAlert]);

    // Show success feedback via notification system
    const message =
      language === "ar"
        ? `تم إنشاء تنبيه لـ ${selectedPair.symbol} عند ${targetPriceNum.toFixed(4)}`
        : `Alert created for ${selectedPair.symbol} at ${targetPriceNum.toFixed(4)}`;

    addAlert({
      eventName: language === "ar" ? "تنبيه جديد" : "New Alert Created",
      message,
      importance: 1,
    });

    // Reset form
    setSelectedPair(null);
    setSearchQuery("");
    setTargetPrice("");
    setCondition("above");
  };

  const toggleAlert = (id: string) => {
    setAlerts((prev) =>
      prev.map((alert) =>
        alert.id === id ? { ...alert, isActive: !alert.isActive } : alert,
      ),
    );
  };

  const deleteAlert = (id: string) => {
    setAlerts((prev) => prev.filter((alert) => alert.id !== id));
  };

  const getAlertStatus = (alert: PriceAlert) => {
    const pair = currencyPairs.find((p) => p.symbol === alert.pair);
    if (!pair) return "unknown";

    if (alert.condition === "above") {
      return pair.currentPrice >= alert.targetPrice ? "triggered" : "waiting";
    } else {
      return pair.currentPrice <= alert.targetPrice ? "triggered" : "waiting";
    }
  };

  const getPriceDisplay = (pair: CurrencyPair) => {
    return pair.currentPrice.toFixed(pair.symbol.includes("JPY") ? 2 : 4);
  };

  return (
    <div className={cn("w-full space-y-6", className)} dir={dir}>
      {/* Create New Alert Card */}
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Plus className="w-5 h-5 text-primary" />
            {language === "ar" ? "إنشاء تنبيه جديد" : "Create New Alert"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Pair Search */}
          <div className="space-y-2 relative" style={{ zIndex: 10000 }}>
            <Label className="text-sm font-medium">
              {language === "ar"
                ? "البحث عن زوج العملات"
                : "Search Currency Pair"}
            </Label>
            <div className="relative">
              <Search
                className={cn(
                  "absolute top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4",
                  dir === "rtl" ? "right-3" : "left-3",
                )}
              />
              <Input
                ref={searchRef}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSelectedPair(null);
                }}
                className={cn(
                  "bg-background/80 border-border/50 hover:border-primary/50 transition-colors",
                  dir === "rtl" ? "pr-10" : "pl-10",
                )}
                placeholder={
                  language === "ar"
                    ? "اكتب اسم الزوج (مثل EUR, USD, GBP)"
                    : "Type pair name (e.g., EUR, USD, GBP)"
                }
                dir={dir}
              />

              {/* Suggestions Dropdown */}
              {showSuggestions && filteredPairs.length > 0 && (
                <div
                  ref={suggestionsRef}
                  className="absolute top-full left-0 right-0 mt-1 bg-background border border-border/50 rounded-lg shadow-xl max-h-60 overflow-hidden"
                  style={{
                    zIndex: 9999,
                    position: "absolute",
                    boxShadow:
                      "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                  }}
                >
                  <ScrollArea className="max-h-60">
                    {filteredPairs.slice(0, 8).map((pair) => (
                      <div
                        key={pair.symbol}
                        onClick={() => handlePairSelect(pair)}
                        className="flex items-center justify-between p-3 hover:bg-muted/50 cursor-pointer border-b border-border/30 last:border-b-0"
                      >
                        <div className="flex items-center gap-3">
                          <div>
                            <div className="font-medium text-sm">
                              {pair.symbol}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {language === "ar" ? pair.nameAr : pair.name}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono text-sm font-medium">
                            {getPriceDisplay(pair)}
                          </div>
                          <div
                            className={cn(
                              "text-xs flex items-center gap-1",
                              pair.change >= 0
                                ? "text-green-500"
                                : "text-red-500",
                            )}
                          >
                            {pair.change >= 0 ? (
                              <TrendingUp className="w-3 h-3" />
                            ) : (
                              <TrendingDown className="w-3 h-3" />
                            )}
                            {pair.changePercent >= 0 ? "+" : ""}
                            {pair.changePercent.toFixed(2)}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </ScrollArea>
                </div>
              )}
            </div>
          </div>

          {/* Selected Pair Display */}
          {selectedPair && (
            <Card className="bg-muted/30 border-border/30">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div>
                      <div className="font-bold text-lg">
                        {selectedPair.symbol}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {language === "ar"
                          ? selectedPair.nameAr
                          : selectedPair.name}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-xl font-bold">
                      {getPriceDisplay(selectedPair)}
                    </div>
                    <div
                      className={cn(
                        "text-sm flex items-center gap-1 justify-end",
                        selectedPair.change >= 0
                          ? "text-green-500"
                          : "text-red-500",
                      )}
                    >
                      {selectedPair.change >= 0 ? (
                        <TrendingUp className="w-4 h-4" />
                      ) : (
                        <TrendingDown className="w-4 h-4" />
                      )}
                      {selectedPair.changePercent >= 0 ? "+" : ""}
                      {selectedPair.changePercent.toFixed(2)}%
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Alert Settings */}
          {selectedPair && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  {language === "ar" ? "الشرط" : "Condition"}
                </Label>
                <Select
                  value={condition}
                  onValueChange={(value: "above" | "below") =>
                    setCondition(value)
                  }
                >
                  <SelectTrigger className="bg-background/80 border-border/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="above">
                      {language === "ar"
                        ? "فوق السعر المحدد"
                        : "Above target price"}
                    </SelectItem>
                    <SelectItem value="below">
                      {language === "ar"
                        ? "تحت السعر المحدد"
                        : "Below target price"}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  {language === "ar" ? "السعر المستهدف" : "Target Price"}
                </Label>
                <Input
                  type="number"
                  step="0.0001"
                  value={targetPrice}
                  onChange={(e) => setTargetPrice(e.target.value)}
                  placeholder={`${language === "ar" ? "مثال:" : "e.g.,"} ${getPriceDisplay(selectedPair)}`}
                  className="bg-background/80 border-border/50 font-mono"
                  dir="ltr"
                />
              </div>

              <div className="flex items-end">
                <Button
                  onClick={handleCreateAlert}
                  disabled={!targetPrice}
                  className="w-full gap-2"
                >
                  <Bell className="w-4 h-4" />
                  {language === "ar" ? "إنشاء التنبيه" : "Create Alert"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active Alerts */}
      <Card className="bg-card/50 backdrop-blur-sm border-border/50 relative z-1">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" />
              {language === "ar" ? "التنبيهات النشطة" : "Active Alerts"} (
              {alerts.length})
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>
                {language === "ar"
                  ? "لا توجد تنبيهات نشطة"
                  : "No active alerts"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert) => {
                const pair = currencyPairs.find((p) => p.symbol === alert.pair);
                const status = getAlertStatus(alert);

                return (
                  <div
                    key={alert.id}
                    className={cn(
                      "p-4 rounded-lg border transition-all duration-200",
                      status === "triggered"
                        ? "bg-red-500/10 border-red-500/30"
                        : "bg-background/50 border-border/50",
                      !alert.isActive && "opacity-50",
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div>
                          <div className="font-medium text-sm">
                            {alert.pair}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {alert.name}
                          </div>
                        </div>

                        <div className="text-center">
                          <div className="text-xs text-muted-foreground">
                            {language === "ar" ? "المستهدف" : "Target"}
                          </div>
                          <div className="font-mono font-medium">
                            {alert.condition === "above" ? "↑" : "↓"}{" "}
                            {alert.targetPrice.toFixed(4)}
                          </div>
                        </div>

                        {pair && (
                          <div className="text-center">
                            <div className="text-xs text-muted-foreground">
                              {language === "ar" ? "الحالي" : "Current"}
                            </div>
                            <div className="font-mono font-medium">
                              {getPriceDisplay(pair)}
                            </div>
                          </div>
                        )}

                        <Badge
                          variant={
                            status === "triggered" ? "destructive" : "outline"
                          }
                          className="text-xs"
                        >
                          {status === "triggered"
                            ? language === "ar"
                              ? "تم التنشيط"
                              : "Triggered"
                            : language === "ar"
                              ? "في الانتظار"
                              : "Waiting"}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleAlert(alert.id)}
                          className="h-8 w-8 p-0"
                        >
                          {alert.isActive ? (
                            <Bell className="w-4 h-4" />
                          ) : (
                            <Clock className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteAlert(alert.id)}
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
