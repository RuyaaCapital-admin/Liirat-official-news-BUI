import * as React from "react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Plus,
  Trash2,
  Bell,
  Mail,
  MessageSquare,
  Monitor,
  Star,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAlerts, AlertPreference } from "@/contexts/alert-context";
import { useLanguage } from "@/contexts/language-context";

interface AlertSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AlertSettingsModal({
  open,
  onOpenChange,
}: AlertSettingsModalProps) {
  const { preferences, addPreference, removePreference, updatePreference } =
    useAlerts();
  const { t, language, dir } = useLanguage();

  const [newAlert, setNewAlert] = useState({
    eventType: "",
    eventName: "",
    currency: "",
    importance: 1,
    methods: ["browser"] as ("email" | "whatsapp" | "browser")[],
  });

  const eventTypes = [
    { value: "Consumer Price Index", label: t("alert.pairs.cpi") },
    { value: "Non-Farm Payrolls", label: t("alert.pairs.nfp") },
    { value: "GDP", label: t("alert.pairs.gdp") },
    {
      value: "Interest Rate Decision",
      label: language === "ar" ? "قرار سعر الفائدة" : "Interest Rate Decision",
    },
    {
      value: "Employment Change",
      label: language === "ar" ? "تغير التوظيف" : "Employment Change",
    },
  ];

  const currencies = [
    { value: "USD", label: "USD", flag: "🇺🇸" },
    { value: "EUR", label: "EUR", flag: "🇪🇺" },
    { value: "GBP", label: "GBP", flag: "🇬🇧" },
    { value: "JPY", label: "JPY", flag: "🇯🇵" },
    { value: "AUD", label: "AUD", flag: "🇦🇺" },
    { value: "CAD", label: "CAD", flag: "🇨🇦" },
  ];

  const handleAddAlert = () => {
    if (!newAlert.eventType || !newAlert.currency) return;

    addPreference({
      eventType: newAlert.eventType,
      eventName: newAlert.eventName || newAlert.eventType,
      currency: newAlert.currency,
      importance: newAlert.importance,
      enabled: true,
      methods: newAlert.methods,
    });

    // Reset form
    setNewAlert({
      eventType: "",
      eventName: "",
      currency: "",
      importance: 1,
      methods: ["browser"],
    });
  };

  const toggleMethod = (method: "email" | "whatsapp" | "browser") => {
    setNewAlert((prev) => ({
      ...prev,
      methods: prev.methods.includes(method)
        ? prev.methods.filter((m) => m !== method)
        : [...prev.methods, method],
    }));
  };

  const getImportanceStars = (level: number) => {
    return Array.from({ length: 3 }, (_, i) => (
      <Star
        key={i}
        className={cn(
          "w-4 h-4",
          i < level
            ? level === 3
              ? "fill-red-500 text-red-500"
              : level === 2
                ? "fill-orange-500 text-orange-500"
                : "fill-yellow-500 text-yellow-500"
            : "text-muted-foreground",
        )}
      />
    ));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            {t("notifications.settings")}
          </DialogTitle>
          <DialogDescription>
            {language === "ar"
              ? "إدارة تنبيهاتك للأحداث الاقتصادية المهمة"
              : "Manage your alerts for important economic events"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Add New Alert */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Plus className="w-4 h-4" />
                {language === "ar" ? "إضافة تنبيه جديد" : "Add New Alert"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Event Type */}
                <div className="space-y-2">
                  <Label>
                    {language === "ar" ? "نوع الحدث" : "Event Type"}
                  </Label>
                  <Select
                    value={newAlert.eventType}
                    onValueChange={(value) =>
                      setNewAlert((prev) => ({ ...prev, eventType: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          language === "ar"
                            ? "اختر نوع الحدث"
                            : "Select event type"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {eventTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Currency */}
                <div className="space-y-2">
                  <Label>{language === "ar" ? "العملة" : "Currency"}</Label>
                  <Select
                    value={newAlert.currency}
                    onValueChange={(value) =>
                      setNewAlert((prev) => ({ ...prev, currency: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          language === "ar" ? "اختر العملة" : "Select currency"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map((currency) => (
                        <SelectItem key={currency.value} value={currency.value}>
                          <span className="flex items-center gap-2">
                            <span>{currency.flag}</span>
                            <span>{currency.label}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Importance Level */}
              <div className="space-y-2">
                <Label>
                  {language === "ar" ? "مستوى الأهمية" : "Importance Level"}
                </Label>
                <div className="flex gap-2">
                  {[1, 2, 3].map((level) => (
                    <Button
                      key={level}
                      variant={
                        newAlert.importance === level ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() =>
                        setNewAlert((prev) => ({ ...prev, importance: level }))
                      }
                      className="flex items-center gap-1"
                    >
                      {getImportanceStars(level)}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Notification Methods */}
              <div className="space-y-2">
                <Label>
                  {language === "ar" ? "طرق التنبيه" : "Notification Methods"}
                </Label>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={
                      newAlert.methods.includes("browser")
                        ? "default"
                        : "outline"
                    }
                    size="sm"
                    onClick={() => toggleMethod("browser")}
                    className="flex items-center gap-2"
                  >
                    <Monitor className="w-4 h-4" />
                    {language === "ar" ? "المتصفح" : "Browser"}
                  </Button>
                  <Button
                    variant={
                      newAlert.methods.includes("email") ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => toggleMethod("email")}
                    className="flex items-center gap-2"
                    disabled
                  >
                    <Mail className="w-4 h-4" />
                    {language === "ar" ? "الإيميل" : "Email"}
                    <Badge variant="secondary" className="text-xs ml-1">
                      {language === "ar" ? "قريباً" : "Soon"}
                    </Badge>
                  </Button>
                  <Button
                    variant={
                      newAlert.methods.includes("whatsapp")
                        ? "default"
                        : "outline"
                    }
                    size="sm"
                    onClick={() => toggleMethod("whatsapp")}
                    className="flex items-center gap-2"
                    disabled
                  >
                    <MessageSquare className="w-4 h-4" />
                    {language === "ar" ? "واتساب" : "WhatsApp"}
                    <Badge variant="secondary" className="text-xs ml-1">
                      {language === "ar" ? "قريباً" : "Soon"}
                    </Badge>
                  </Button>
                </div>
              </div>

              <Button
                onClick={handleAddAlert}
                disabled={!newAlert.eventType || !newAlert.currency}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                {language === "ar" ? "إضافة التنبيه" : "Add Alert"}
              </Button>
            </CardContent>
          </Card>

          {/* Existing Alerts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>
                  {language === "ar" ? "التنبيهات النشطة" : "Active Alerts"}
                </span>
                <Badge variant="secondary">{preferences.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {preferences.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>
                    {language === "ar"
                      ? "لا توجد تنبيهات مفعلة"
                      : "No active alerts"}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {preferences.map((preference) => (
                    <div
                      key={preference.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex">
                          {getImportanceStars(preference.importance)}
                        </div>
                        <div>
                          <div className="font-medium text-sm">
                            {preference.eventName}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {
                              currencies.find(
                                (c) => c.value === preference.currency,
                              )?.flag
                            }{" "}
                            {preference.currency}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Switch
                          checked={preference.enabled}
                          onCheckedChange={(enabled) =>
                            updatePreference(preference.id, { enabled })
                          }
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removePreference(preference.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Note */}
          <div className="text-xs text-muted-foreground p-3 bg-muted/30 rounded-lg">
            <AlertCircle className="w-4 h-4 inline mr-1" />
            {language === "ar"
              ? "ستتلقى تنبيهات عندما تتطابق الأحداث الاقتصادية مع تفضيلاتك."
              : "You will receive notifications when economic events match your preferences."}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
