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
  Wifi,
  WifiOff,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CurrencyPair {
  symbol: string;
  name: string;
  nameAr: string;
  currentPrice: number;
  change: number;
  changePercent: number;
  lastUpdate: Date;
}

interface PriceAlert {
  id: string;
  pair: string;
  targetPrice: number;
  condition: "above" | "below";
  isActive: boolean;
  createdAt: Date;
  name: string;
  lastTriggered?: Date;
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
  const [isConnected, setIsConnected] = useState(false);
  const [lastPriceUpdate, setLastPriceUpdate] = useState<Date | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // EODHD-supported symbols - using exactly the same symbols as the price ticker
  const [currencyPairs, setCurrencyPairs] = useState<CurrencyPair[]>([]);
  const [isLoadingPairs, setIsLoadingPairs] = useState(true);

  // Define supported symbols - prices will be fetched from EODHD
  const supportedSymbols = [
    { symbol: "EURUSD", name: "EUR/USD", nameAr: "يورو/دولار" },
    { symbol: "USDJPY", name: "USD/JPY", nameAr: "دولار/ين" },
    { symbol: "GBPUSD", name: "GBP/USD", nameAr: "جنيه/دولار" },
    { symbol: "AUDUSD", name: "AUD/USD", nameAr: "دولار أسترالي/دولار" },
    { symbol: "USDCHF", name: "USD/CHF", nameAr: "دولار/فرنك" },
    { symbol: "USDCAD", name: "USD/CAD", nameAr: "دولار/دولار كندي" },
    { symbol: "BTC-USD", name: "Bitcoin/USD", nameAr: "بيتكوين/دولار" },
    { symbol: "ETH-USD", name: "Ethereum/USD", nameAr: "إيثريوم/دولار" },
    { symbol: "XAUUSD", name: "Gold/USD", nameAr: "ذهب/دولار" },
    { symbol: "GSPC", name: "S&P 500", nameAr: "إس&بي 500" },
  ];

  // Fetch real prices for all supported symbols on component mount
  useEffect(() => {
    const fetchAllPrices = async () => {
      setIsLoadingPairs(true);
      try {
        console.log("Fetching prices for all supported symbols...");
        const pricePromises = supportedSymbols.map(async (symbol) => {
          try {
            let apiSymbol = symbol.symbol;
            // Format symbol for EODHD API based on type
            if (symbol.symbol === "BTC-USD" || symbol.symbol === "ETH-USD") {
              // Keep crypto symbols as is
            } else if (symbol.symbol === "GSPC") {
              apiSymbol = "GSPC.INDX"; // Add index suffix
            } else {
              // Forex symbols - keep as is, API will handle
            }

            console.log(
              `Fetching price for ${symbol.symbol} (API symbol: ${apiSymbol})`,
            );
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

            const response = await fetch(
              `/api/eodhd/price?symbols=${apiSymbol}`,
              { signal: controller.signal },
            );

            clearTimeout(timeoutId);

            if (response.ok) {
              const data = await response.json();
              console.log(`Price response for ${symbol.symbol}:`, data);
              const priceData =
                data.ok && data.items?.[0] ? data.items[0] : null;
              if (priceData) {
                setIsConnected(true);
                return {
                  symbol: symbol.symbol,
                  name: symbol.name,
                  nameAr: symbol.nameAr,
                  currentPrice: parseFloat(priceData.price) || 0,
                  change: parseFloat(priceData.change || 0),
                  changePercent: parseFloat(priceData.changePct || 0),
                  lastUpdate: new Date(),
                };
              }
            }

            console.warn(
              `Failed to fetch price for ${symbol.symbol}, API response:`,
              response.status,
            );
            return null;
          } catch (error) {
            console.warn(`Error fetching price for ${symbol.symbol}:`, error);
            return null;
          }
        });

        const results = await Promise.all(pricePromises);
        const validPairs = results.filter(
          (pair): pair is CurrencyPair => pair !== null,
        );

        console.log(
          `Successfully fetched ${validPairs.length} of ${supportedSymbols.length} symbols`,
        );
        setCurrencyPairs(validPairs);

        if (validPairs.length > 0) {
          setIsConnected(true);
          setLastPriceUpdate(new Date());
        } else {
          setIsConnected(false);
        }
      } catch (error) {
        console.error("Error fetching currency pair prices:", error);
        setIsConnected(false);
      } finally {
        setIsLoadingPairs(false);
      }
    };

    fetchAllPrices();
  }, []);

  // Periodic price updates every 30 seconds
  useEffect(() => {
    if (currencyPairs.length === 0) return;

    const updatePrices = async () => {
      try {
        console.log("Updating prices for currency pairs...");
        const updatedPairs = await Promise.all(
          currencyPairs.map(async (pair) => {
            try {
              let apiSymbol = pair.symbol;
              if (pair.symbol === "BTC-USD" || pair.symbol === "ETH-USD") {
                // Keep crypto symbols as is
              } else if (pair.symbol === "GSPC") {
                apiSymbol = "GSPC.INDX";
              }

              const response = await fetch(
                `/api/eodhd/price?symbols=${apiSymbol}`,
                { signal: AbortSignal.timeout(8000) }, // 8 second timeout
              );

              if (response.ok) {
                const data = await response.json();
                const priceData =
                  data.ok && data.items?.[0] ? data.items[0] : null;
                if (priceData) {
                  setIsConnected(true);
                  return {
                    ...pair,
                    currentPrice:
                      parseFloat(priceData.price) || pair.currentPrice,
                    change: parseFloat(priceData.change || 0),
                    changePercent: parseFloat(priceData.changePct || 0),
                    lastUpdate: new Date(),
                  };
                }
              }

              console.warn(`Failed to update price for ${pair.symbol}`);
              return pair; // Return original if update fails
            } catch (error) {
              console.warn(`Error updating price for ${pair.symbol}:`, error);
              return pair; // Return original if error
            }
          }),
        );

        setCurrencyPairs(updatedPairs);
        setLastPriceUpdate(new Date());
        console.log("Price update completed successfully");
      } catch (error) {
        console.error("Error updating prices:", error);
        setIsConnected(false);
      }
    };

    // Update prices every 30 seconds
    const interval = setInterval(updatePrices, 30000);
    return () => clearInterval(interval);
  }, [currencyPairs.length]);

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
    const savedAlerts = localStorage.getItem("eodhd-price-alerts");
    if (savedAlerts) {
      try {
        const parsed = JSON.parse(savedAlerts);
        setAlerts(
          parsed.map((alert: any) => ({
            ...alert,
            createdAt: new Date(alert.createdAt),
            lastTriggered: alert.lastTriggered
              ? new Date(alert.lastTriggered)
              : undefined,
          })),
        );
      } catch (error) {
        console.error("Error loading alerts:", error);
      }
    }
  }, []);

  // Save alerts to localStorage whenever alerts change
  useEffect(() => {
    localStorage.setItem("eodhd-price-alerts", JSON.stringify(alerts));
  }, [alerts]);

  // Monitor price alerts using EODHD data
  useEffect(() => {
    if (alerts.length === 0 || currencyPairs.length === 0) return;

    const checkPriceAlerts = () => {
      console.log("Checking price alerts...");

      for (const alert of alerts) {
        if (!alert.isActive) continue;

        const pair = currencyPairs.find((p) => p.symbol === alert.pair);
        if (!pair) continue;

        const currentPrice = pair.currentPrice;
        const isTriggered =
          (alert.condition === "above" && currentPrice >= alert.targetPrice) ||
          (alert.condition === "below" && currentPrice <= alert.targetPrice);

        if (isTriggered) {
          console.log(
            `Alert triggered for ${alert.pair}: ${currentPrice} ${alert.condition} ${alert.targetPrice}`,
          );

          // Trigger notification
          const message =
            language === "ar"
              ? `تنبيه سعر: ${alert.name} ${alert.condition === "above" ? "فوق" : "تحت"} ${alert.targetPrice.toFixed(4)} | السعر الحالي: ${currentPrice.toFixed(4)}`
              : `Price Alert: ${alert.name} ${alert.condition === "above" ? "above" : "below"} ${alert.targetPrice.toFixed(4)} | Current: ${currentPrice.toFixed(4)}`;

          addAlert({
            eventName: `${alert.pair} ${language === "ar" ? "تنبيه سعر" : "Price Alert"}`,
            message,
            importance: 3,
          });

          // Update alert as triggered and deactivate to prevent spam
          setAlerts((prev) =>
            prev.map((a) =>
              a.id === alert.id
                ? { ...a, isActive: false, lastTriggered: new Date() }
                : a,
            ),
          );

          // Browser notification if supported
          if (
            "Notification" in window &&
            Notification.permission === "granted"
          ) {
            new Notification(`Price Alert: ${alert.pair}`, {
              body: message,
              icon: "/liirat-logo-new.png",
            });
          }
        }
      }
    };

    // Check alerts every time prices update
    checkPriceAlerts();
  }, [currencyPairs, alerts, addAlert, language]);

  const handlePairSelect = (pair: CurrencyPair) => {
    setSelectedPair(pair);
    setSearchQuery(pair.symbol);
    setShowSuggestions(false);
  };

  const handleCreateAlert = () => {
    if (!selectedPair || !targetPrice || isNaN(parseFloat(targetPrice))) {
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

    // Show success feedback
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

    if (alert.lastTriggered) return "triggered";

    if (alert.condition === "above") {
      return pair.currentPrice >= alert.targetPrice ? "triggered" : "waiting";
    } else {
      return pair.currentPrice <= alert.targetPrice ? "triggered" : "waiting";
    }
  };

  const getPriceDisplay = (pair: CurrencyPair) => {
    if (pair.symbol.includes("JPY")) {
      return pair.currentPrice.toFixed(3);
    } else if (pair.symbol.includes("BTC") || pair.symbol.includes("ETH")) {
      return pair.currentPrice.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    } else if (pair.symbol.includes("XAU") || pair.symbol === "GSPC") {
      return pair.currentPrice.toFixed(2);
    }
    return pair.currentPrice.toFixed(4);
  };

  // Request notification permission
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // Show loading state while fetching currency pairs
  if (isLoadingPairs) {
    return (
      <div className={cn("w-full space-y-6", className)} dir={dir}>
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">
              {language === "ar"
                ? "جاري تحميل أزواج العملات..."
                : "Loading currency pairs..."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show message when no pairs are available (API access restricted)
  if (currencyPairs.length === 0) {
    return (
      <div className={cn("w-full space-y-6", className)} dir={dir}>
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {language === "ar"
                ? "بيانات الأسعار غير متاحة"
                : "Price Data Not Available"}
            </h3>
            <p className="text-muted-foreground">
              {language === "ar"
                ? "لا يمكن الوصول إلى بيانات الأسعار. يرجى المحاولة لاحقاً."
                : "Unable to access price data. Please try again later."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn("w-full space-y-6", className)} dir={dir}>
      {/* Connection Status */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {isConnected ? (
          <Wifi className="h-4 w-4 text-green-500" />
        ) : (
          <WifiOff className="h-4 w-4 text-red-500" />
        )}
        <span>
          {isConnected
            ? language === "ar"
              ? "متصل"
              : "Connected"
            : language === "ar"
              ? "��ير متصل"
              : "Disconnected"}
        </span>
        {lastPriceUpdate && (
          <span className="text-xs">
            • {language === "ar" ? "آخر تحديث:" : "Last update:"}{" "}
            {lastPriceUpdate.toLocaleTimeString()}
          </span>
        )}
      </div>

      {/* Create New Alert Card */}
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Plus className="w-5 h-5 text-primary" />
            {language === "ar"
              ? "إنشاء تنبيه سعر جديد"
              : "Create New Price Alert"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Pair Search */}
          <div className="space-y-2 relative" style={{ zIndex: 10000 }}>
            <Label className="text-sm font-medium">
              {language === "ar"
                ? "البحث عن زوج العملات أو الأصل"
                : "Search Currency Pair or Asset"}
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
                    ? "اكتب اسم الزوج (مثل EUR, USD, BTC)"
                    : "Type pair name (e.g., EUR, USD, BTC)"
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
                  {language === "ar" ? "نوع التنبيه" : "Condition"}
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
                  disabled={
                    !selectedPair ||
                    !targetPrice ||
                    isNaN(parseFloat(targetPrice)) ||
                    parseFloat(targetPrice) <= 0
                  }
                  className="w-full gap-2"
                  type="button"
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
              {language === "ar" ? "التنبيهات النشطة" : "Active Price Alerts"} (
              {alerts.length})
            </div>
            {alerts.some((a) => a.isActive) && (
              <Badge variant="secondary" className="text-xs">
                {alerts.filter((a) => a.isActive).length}{" "}
                {language === "ar" ? "نشط" : "active"}
              </Badge>
            )}
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
              <p className="text-sm mt-1">
                {language === "ar"
                  ? "قم بإنشاء تنبيه لمراقبة الأسعار في الوقت الفعلي"
                  : "Create an alert to monitor prices in real-time"}
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
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
                      <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
                        <div>
                          <div className="font-medium text-sm">
                            {alert.pair}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {alert.name}
                          </div>
                        </div>

                        <div className="text-center min-w-[60px]">
                          <div className="text-xs text-muted-foreground">
                            {language === "ar" ? "المستهدف" : "Target"}
                          </div>
                          <div className="font-mono font-medium text-xs sm:text-sm">
                            {alert.condition === "above" ? "↑" : "↓"}{" "}
                            {alert.targetPrice.toFixed(4)}
                          </div>
                        </div>

                        {pair && (
                          <div className="text-center min-w-[60px]">
                            <div className="text-xs text-muted-foreground">
                              {language === "ar" ? "الحالي" : "Current"}
                            </div>
                            <div className="font-mono font-medium text-xs sm:text-sm">
                              {getPriceDisplay(pair)}
                            </div>
                          </div>
                        )}

                        <Badge
                          variant={
                            status === "triggered"
                              ? "destructive"
                              : alert.isActive
                                ? "outline"
                                : "secondary"
                          }
                          className="text-xs whitespace-nowrap"
                        >
                          {status === "triggered"
                            ? language === "ar"
                              ? "تم التنشيط"
                              : "Triggered"
                            : alert.isActive
                              ? language === "ar"
                                ? "في الانتظار"
                                : "Waiting"
                              : language === "ar"
                                ? "متوقف"
                                : "Inactive"}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleAlert(alert.id)}
                          className="h-8 w-8 p-0"
                          title={
                            alert.isActive
                              ? language === "ar"
                                ? "إيقاف التنبيه"
                                : "Deactivate alert"
                              : language === "ar"
                                ? "تنشيط التنبيه"
                                : "Activate alert"
                          }
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
                          title={
                            language === "ar" ? "حذف التنبيه" : "Delete alert"
                          }
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {alert.lastTriggered && (
                      <div className="text-xs text-muted-foreground mt-2 pt-2 border-t border-border/30">
                        {language === "ar" ? "آخر تنشيط:" : "Last triggered:"}{" "}
                        {alert.lastTriggered.toLocaleString()}
                      </div>
                    )}
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
