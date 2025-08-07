import React, { useState, useEffect, useCallback } from "react";
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
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
  Bell,
  TrendingUp,
  Plus,
  Edit,
  Trash2,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Volume2,
} from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
import { toast } from "sonner";

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

interface NewsAlert {
  id: string;
  type: "news" | "event";
  title: string;
  keywords: string[];
  isActive: boolean;
  createdAt: string;
  notificationEnabled: boolean;
  soundEnabled: boolean;
}

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

// Browser notification utility
function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!("Notification" in window)) {
    console.warn("This browser does not support notifications");
    return Promise.resolve("denied");
  }

  return Notification.requestPermission();
}

function showNotification(
  title: string,
  body: string,
  playSound: boolean = true,
) {
  if (Notification.permission === "granted") {
    const notification = new Notification(title, {
      body,
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      tag: "liirat-alert",
      requireInteraction: true,
    });

    // Play notification sound
    if (playSound) {
      try {
        const audio = new Audio("/notification-sound.mp3");
        audio.volume = 0.3;
        audio.play().catch(console.error);
      } catch (error) {
        console.error("Could not play notification sound:", error);
      }
    }

    // Auto-close notification after 10 seconds
    setTimeout(() => {
      notification.close();
    }, 10000);

    return notification;
  }
  return null;
}

// LocalStorage utilities
const STORAGE_KEYS = {
  PRICE_ALERTS: "liirat_price_alerts",
  NEWS_ALERTS: "liirat_news_alerts",
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

interface EnhancedAlertSystemProps {
  className?: string;
}

export default function EnhancedAlertSystem({
  className,
}: EnhancedAlertSystemProps) {
  const { language } = useLanguage();
  const [priceAlerts, setPriceAlerts] = useState<PriceAlert[]>([]);
  const [newsAlerts, setNewsAlerts] = useState<NewsAlert[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAlert, setEditingAlert] = useState<PriceAlert | null>(null);
  const [notificationPermission, setNotificationPermission] =
    useState<NotificationPermission>("default");

  // Form states
  const [symbol, setSymbol] = useState("");
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
    const savedNewsAlerts = loadFromStorage<NewsAlert[]>(
      STORAGE_KEYS.NEWS_ALERTS,
      [],
    );

    setPriceAlerts(savedPriceAlerts);
    setNewsAlerts(savedNewsAlerts);

    // Request notification permission
    requestNotificationPermission().then(setNotificationPermission);
  }, []);

  // Save to localStorage whenever alerts change
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.PRICE_ALERTS, priceAlerts);
  }, [priceAlerts]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.NEWS_ALERTS, newsAlerts);
  }, [newsAlerts]);

  // Real-time price checking
  const checkPriceAlerts = useCallback(async () => {
    const activeAlerts = priceAlerts.filter(
      (alert) => alert.isActive && !alert.triggeredAt,
    );

    for (const alert of activeAlerts) {
      try {
        const response = await fetch(
          `/api/eodhd/price?symbols=${encodeURIComponent(alert.symbol)}`,
        );
        if (response.ok) {
          const data = await response.json();
          if (data.ok && data.items && data.items.length > 0) {
            const currentPrice = data.items[0].price;
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

              // Create notification
              const hijriDate = getHijriDate();
              const dubaiTime = new Date().toLocaleString("ar-AE", {
                timeZone: "Asia/Dubai",
                hour: "2-digit",
                minute: "2-digit",
              });

              const title =
                language === "ar"
                  ? `تنبيه سعر ${alert.symbolName}`
                  : `Price Alert: ${alert.symbolName}`;

              const body =
                language === "ar"
                  ? `السعر الحالي: $${currentPrice.toLocaleString()}\nالهدف: ${alert.condition === "above" ? "أعلى من" : "أقل من"} $${targetPrice.toLocaleString()}\n${hijriDate} - ${dubaiTime}`
                  : `Current price: $${currentPrice.toLocaleString()}\nTarget: ${alert.condition} $${targetPrice.toLocaleString()}\n${dubaiTime} Dubai time`;

              // Show browser notification
              if (alert.notificationEnabled) {
                showNotification(title, body, alert.soundEnabled);
              }

              // Show toast notification
              toast.success(title, {
                description: body,
                duration: 10000,
                action: {
                  label: language === "ar" ? "إغلاق" : "Close",
                  onClick: () => {},
                },
              });
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

  // Create new price alert
  const createPriceAlert = () => {
    if (!symbol || !targetPrice) {
      toast.error(
        language === "ar"
          ? "يرجى ملء جميع الحقول المطلوبة"
          : "Please fill in all required fields",
      );
      return;
    }

    const symbolNames: Record<string, string> = {
      "XAUUSD.FOREX": "Gold (XAU/USD)",
      "BTC-USD.CC": "Bitcoin",
      "ETH-USD.CC": "Ethereum",
      "EURUSD.FOREX": "EUR/USD",
      "GBPUSD.FOREX": "GBP/USD",
      "USDJPY.FOREX": "USD/JPY",
      "GSPC.INDX": "S&P 500",
      "IXIC.INDX": "NASDAQ",
    };

    const newAlert: PriceAlert = {
      id: Date.now().toString(),
      symbol,
      symbolName: symbolNames[symbol] || symbol,
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
    setSymbol("");
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
    toast.success(language === "ar" ? "تم حذف التنبيه" : "Alert deleted");
  };

  // Toggle alert active state
  const toggleAlert = (id: string) => {
    setPriceAlerts((prev) =>
      prev.map((alert) =>
        alert.id === id ? { ...alert, isActive: !alert.isActive } : alert,
      ),
    );
  };

  const symbolOptions = [
    {
      value: "XAUUSD.FOREX",
      label: language === "ar" ? "الذهب (XAU/USD)" : "Gold (XAU/USD)",
    },
    { value: "BTC-USD.CC", label: "Bitcoin (BTC/USD)" },
    { value: "ETH-USD.CC", label: "Ethereum (ETH/USD)" },
    { value: "EURUSD.FOREX", label: "EUR/USD" },
    { value: "GBPUSD.FOREX", label: "GBP/USD" },
    { value: "USDJPY.FOREX", label: "USD/JPY" },
    { value: "GSPC.INDX", label: "S&P 500" },
    { value: "IXIC.INDX", label: "NASDAQ" },
  ];

  return (
    <div className={cn("w-full space-y-6", className)}>
      <Card className="neumorphic-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-2xl font-bold flex items-center gap-2">
            <Bell className="h-6 w-6 text-primary" />
            {language === "ar"
              ? "نظام التنبيهات المحسن"
              : "Enhanced Alert System"}
          </CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="neumorphic-button-small">
                <Plus className="h-4 w-4 mr-2" />
                {language === "ar" ? "إضافة تنبي��" : "Add Alert"}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
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
                <div className="grid gap-2">
                  <Label htmlFor="symbol">
                    {language === "ar" ? "الرمز" : "Symbol"}
                  </Label>
                  <Select value={symbol} onValueChange={setSymbol}>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          language === "ar" ? "اختر الرمز" : "Select symbol"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {symbolOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

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
                      ? "تفعيل الإشعارات"
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

                <Button onClick={createPriceAlert} className="w-full">
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
          {notificationPermission !== "granted" && (
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <p className="text-sm text-yellow-800">
                  {language === "ar"
                    ? "يرجى السماح بالإشعارات لتلقي تنبيهات الأسعار"
                    : "Please enable notifications to receive price alerts"}
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    requestNotificationPermission().then(
                      setNotificationPermission,
                    )
                  }
                >
                  {language === "ar" ? "تفعيل" : "Enable"}
                </Button>
              </div>
            </div>
          )}

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
                    ? "قم بإنشاء تنبيه لمتابعة أسعار الأسهم والعملات"
                    : "Create an alert to track stock and currency prices"}
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
                        setSymbol(alert.symbol);
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
