import React, { useState, useMemo, useEffect } from "react";
import { EconomicEvent } from "@shared/api";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import ReactCountryFlag from "react-country-flag";
import { useLanguage } from "@/contexts/language-context";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  RefreshCw,
  AlertTriangle,
  Clock,
  TrendingUp,
  TrendingDown,
  Loader2,
  AlertCircle,
  Wifi,
  WifiOff,
} from "lucide-react";
import { format, parseISO, isValid } from "date-fns";
import { toast } from "sonner";

interface CalendarError {
  message: string;
  userMessage: string;
  canRetry: boolean;
  details?: string;
}

interface EnhancedCalendarTableProps {
  events: EconomicEvent[];
  className?: string;
  isLoading?: boolean;
  error?: CalendarError | null;
  onRefresh?: (filters?: {
    country?: string;
    importance?: string[];
    from?: string;
    to?: string;
  }) => void;
  onCreateAlert?: (event: EconomicEvent) => void;
}

// Translations
const translations = {
  ar: {
    // Table headers
    dateTime: "التاريخ والوقت",
    country: "الدولة",
    event: "الحدث",
    importance: "الأهمية",
    actual: "الفعلي",
    forecast: "المتوقع",
    previous: "السابق",

    // Importance levels
    high: "عالي",
    medium: "متوسط",
    low: "منخفض",

    // Actions
    refresh: "تحديث",
    retry: "إعادة المحاولة",
    filter: "تصفية",
    search: "البحث",
    all: "الكل",

    // Status messages
    loading: "جاري التحميل...",
    noEvents: "لا توجد أحداث اقتصادية متاحة",
    noEventsFiltered: "لا توجد أحداث مطابقة للمرشحات المحددة",
    error: "خطأ في تحميل التقويم الاقتصادي",
    networkError: "خطأ في الشبكة",
    retryMessage: "فشل في تحميل البيانات. يرجى المحاولة مرة أخرى.",

    // Countries
    countries: {
      US: "الولايات المتحدة",
      EUR: "منطقة اليورو",
      GB: "المملكة المتحدة",
      JP: "اليابان",
      CA: "كندا",
      AU: "أستراليا",
      DE: "ألمانيا",
      FR: "فرنسا",
      CN: "الصين",
      CH: "سويسرا",
    },
  },
  en: {
    // Table headers
    dateTime: "Date & Time",
    country: "Country",
    event: "Event",
    importance: "Importance",
    actual: "Actual",
    forecast: "Forecast",
    previous: "Previous",

    // Importance levels
    high: "High",
    medium: "Medium",
    low: "Low",

    // Actions
    refresh: "Refresh",
    retry: "Retry",
    filter: "Filter",
    search: "Search",
    all: "All",

    // Status messages
    loading: "Loading...",
    noEvents: "No economic events available",
    noEventsFiltered: "No events match the selected filters",
    error: "Error loading economic calendar",
    networkError: "Network error",
    retryMessage: "Failed to load data. Please try again.",

    // Countries
    countries: {
      US: "United States",
      EUR: "Eurozone",
      GB: "United Kingdom",
      JP: "Japan",
      CA: "Canada",
      AU: "Australia",
      DE: "Germany",
      FR: "France",
      CN: "China",
      CH: "Switzerland",
    },
  },
};

const COUNTRIES = ["US", "EUR", "GB", "JP", "CA", "AU", "DE", "FR", "CN", "CH"];

export default function EnhancedCalendarTable({
  events,
  className,
  isLoading = false,
  error = null,
  onRefresh,
  onCreateAlert,
}: EnhancedCalendarTableProps) {
  const { language } = useLanguage();
  const t = translations[language];

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("all");
  const [selectedImportances, setSelectedImportances] = useState<string[]>([
    "1",
    "2",
    "3",
  ]);
  const [isExpanded, setIsExpanded] = useState(false);

  // Filter events based on search and filters
  const filteredEvents = useMemo(() => {
    if (!Array.isArray(events)) return [];

    return events.filter((event) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          event.event?.toLowerCase().includes(query) ||
          event.country?.toLowerCase().includes(query) ||
          event.category?.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // Country filter
      if (selectedCountry !== "all" && event.country !== selectedCountry) {
        return false;
      }

      // Importance filter
      if (!selectedImportances.includes(event.importance?.toString())) {
        return false;
      }

      return true;
    });
  }, [events, searchQuery, selectedCountry, selectedImportances]);

  // Display logic - show first 10 by default, expand to show all
  const displayedEvents = isExpanded
    ? filteredEvents
    : filteredEvents.slice(0, 10);

  // Format date and time
  const formatDateTime = (dateStr: string, timeStr?: string) => {
    try {
      let date: Date;

      // Handle different date formats
      if (dateStr.includes("T")) {
        date = new Date(dateStr);
      } else if (dateStr.includes("-")) {
        // Handle YYYY-MM-DD format
        const fullDateTime = timeStr
          ? `${dateStr}T${timeStr}:00.000Z`
          : `${dateStr}T12:00:00.000Z`;
        date = new Date(fullDateTime);
      } else {
        // Try to parse as-is
        date = new Date(dateStr);
      }

      if (!date || isNaN(date.getTime())) {
        return language === "ar" ? "تاريخ غير صالح" : "Invalid date";
      }

      // Format with Arabic locale support
      const locale = language === "ar" ? "ar-AE" : "en-US";
      const dateFormatted = date.toLocaleDateString(locale, {
        month: "short",
        day: "numeric",
        timeZone: "Asia/Dubai",
      });
      const timeFormatted =
        timeStr ||
        date.toLocaleTimeString(locale, {
          hour: "2-digit",
          minute: "2-digit",
          timeZone: "Asia/Dubai",
          hour12: false,
        });

      return (
        <div
          className={cn(
            "text-sm",
            language === "ar" ? "text-right" : "text-left",
          )}
        >
          <div className="font-medium">{dateFormatted}</div>
          <div className="text-muted-foreground">{timeFormatted}</div>
        </div>
      );
    } catch (error) {
      console.error("Date formatting error:", error);
      return language === "ar" ? "تاريخ غير صالح" : "Invalid date";
    }
  };

  // Get importance badge
  const getImportanceBadge = (importance: number) => {
    const importanceMap = {
      1: { label: t.low, color: "bg-gray-500" },
      2: { label: t.medium, color: "bg-yellow-500" },
      3: { label: t.high, color: "bg-red-500" },
    };

    const config =
      importanceMap[importance as keyof typeof importanceMap] ||
      importanceMap[2];

    return (
      <Badge className={cn("text-white text-xs", config.color)}>
        {config.label}
      </Badge>
    );
  };

  // Get country display name
  const getCountryName = (countryCode: string) => {
    return t.countries[countryCode as keyof typeof t.countries] || countryCode;
  };

  // Handle refresh
  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh({
        country: selectedCountry !== "all" ? selectedCountry : undefined,
        importance: selectedImportances,
      });
    }
  };

  // Handle importance filter change
  const handleImportanceChange = (importance: string, checked: boolean) => {
    setSelectedImportances((prev) =>
      checked ? [...prev, importance] : prev.filter((i) => i !== importance),
    );
  };

  // Error display component
  const ErrorDisplay = () => (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="flex items-center gap-3 mb-4">
        <AlertCircle className="h-8 w-8 text-red-500" />
        <WifiOff className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">{t.error}</h3>
      <p className="text-muted-foreground text-center mb-4 max-w-md">
        {error?.userMessage || t.retryMessage}
      </p>
      {error?.canRetry && (
        <Button onClick={handleRefresh} variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          {t.retry}
        </Button>
      )}
      {error?.details && (
        <details className="mt-4 text-xs text-muted-foreground">
          <summary className="cursor-pointer">Technical details</summary>
          <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto max-w-md">
            {error.details}
          </pre>
        </details>
      )}
    </div>
  );

  // Loading display component
  const LoadingDisplay = () => (
    <div className="flex flex-col items-center justify-center py-12">
      <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
      <p className="text-muted-foreground">{t.loading}</p>
    </div>
  );

  // No events display component
  const NoEventsDisplay = () => (
    <div className="flex flex-col items-center justify-center py-12">
      <Clock className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
      <h3 className="text-lg font-semibold mb-2">
        {searchQuery ||
        selectedCountry !== "all" ||
        selectedImportances.length < 3
          ? t.noEventsFiltered
          : t.noEvents}
      </h3>
      {(searchQuery ||
        selectedCountry !== "all" ||
        selectedImportances.length < 3) && (
        <Button
          variant="outline"
          onClick={() => {
            setSearchQuery("");
            setSelectedCountry("all");
            setSelectedImportances(["1", "2", "3"]);
          }}
          className="mt-2"
        >
          Clear filters
        </Button>
      )}
    </div>
  );

  return (
    <div
      className={cn("w-full space-y-4", className)}
      dir={language === "ar" ? "rtl" : "ltr"}
    >
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-wrap gap-2 items-center">
          {/* Search */}
          <div className="relative">
            <Search
              className={cn(
                "absolute top-3 h-4 w-4 text-muted-foreground",
                language === "ar" ? "right-3" : "left-3",
              )}
            />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.search + "..."}
              className={cn("w-64", language === "ar" ? "pr-10" : "pl-10")}
            />
          </div>

          {/* Country filter */}
          <Select value={selectedCountry} onValueChange={setSelectedCountry}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t.all}</SelectItem>
              {COUNTRIES.map((country) => (
                <SelectItem key={country} value={country}>
                  <div className="flex items-center gap-2">
                    <ReactCountryFlag
                      countryCode={country === "EUR" ? "EU" : country}
                      svg
                      style={{ width: "16px", height: "12px" }}
                    />
                    {getCountryName(country)}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Importance filter */}
          <div className="flex items-center gap-2 p-2 border rounded-md">
            <span className="text-sm font-medium">{t.importance}:</span>
            {[1, 2, 3].map((importance) => (
              <div key={importance} className="flex items-center gap-1">
                <Checkbox
                  id={`importance-${importance}`}
                  checked={selectedImportances.includes(importance.toString())}
                  onCheckedChange={(checked) =>
                    handleImportanceChange(
                      importance.toString(),
                      checked as boolean,
                    )
                  }
                />
                <label
                  htmlFor={`importance-${importance}`}
                  className="text-sm cursor-pointer"
                >
                  {importance === 1
                    ? t.low
                    : importance === 2
                      ? t.medium
                      : t.high}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Refresh button */}
        <Button
          onClick={handleRefresh}
          variant="outline"
          size="sm"
          className="gap-2"
          disabled={isLoading}
        >
          <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          {t.refresh}
        </Button>
      </div>

      {/* Content */}
      <div className="border rounded-lg">
        {error ? (
          <ErrorDisplay />
        ) : isLoading ? (
          <LoadingDisplay />
        ) : displayedEvents.length === 0 ? (
          <NoEventsDisplay />
        ) : (
          <>
            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-muted/30">
                  <tr>
                    <th
                      className={cn(
                        "p-3 text-sm font-semibold",
                        language === "ar" ? "text-right" : "text-left",
                      )}
                    >
                      {t.dateTime}
                    </th>
                    <th
                      className={cn(
                        "p-3 text-sm font-semibold",
                        language === "ar" ? "text-right" : "text-left",
                      )}
                    >
                      {t.country}
                    </th>
                    <th
                      className={cn(
                        "p-3 text-sm font-semibold",
                        language === "ar" ? "text-right" : "text-left",
                      )}
                    >
                      {t.event}
                    </th>
                    <th className={cn("p-3 text-sm font-semibold text-center")}>
                      {t.importance}
                    </th>
                    <th className={cn("p-3 text-sm font-semibold text-center")}>
                      {t.actual}
                    </th>
                    <th className={cn("p-3 text-sm font-semibold text-center")}>
                      {t.forecast}
                    </th>
                    <th className={cn("p-3 text-sm font-semibold text-center")}>
                      {t.previous}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {displayedEvents.map((event, index) => (
                    <tr
                      key={`${event.date}-${event.country}-${event.event}-${index}`}
                      className="border-b hover:bg-muted/20 transition-colors"
                    >
                      <td className="p-3">
                        {formatDateTime(event.date, event.time)}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <ReactCountryFlag
                            countryCode={
                              event.country === "EUR" ? "EU" : event.country
                            }
                            svg
                            style={{ width: "20px", height: "15px" }}
                          />
                          <span className="text-sm font-medium">
                            {getCountryName(event.country)}
                          </span>
                        </div>
                      </td>
                      <td className="p-3">
                        <div
                          className={cn(
                            "max-w-xs",
                            language === "ar" ? "text-right" : "text-left",
                          )}
                        >
                          <span className="text-sm font-medium">
                            {event.event}
                          </span>
                          {event.category && (
                            <div className="text-xs text-muted-foreground mt-1">
                              {event.category}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        {getImportanceBadge(event.importance)}
                      </td>
                      <td className="p-3 text-center">
                        <span className="text-sm font-mono">
                          {event.actual || "-"}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className="text-sm font-mono text-muted-foreground">
                          {event.forecast || "-"}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className="text-sm font-mono text-muted-foreground">
                          {event.previous || "-"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Show more button */}
            {filteredEvents.length > 10 && (
              <div className="p-4 text-center border-t">
                <Button
                  variant="outline"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="gap-2"
                >
                  {isExpanded
                    ? language === "ar"
                      ? "عرض أقل"
                      : "Show less"
                    : language === "ar"
                      ? `عرض ${filteredEvents.length - 10} أحداث أخرى`
                      : `Show ${filteredEvents.length - 10} more events`}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
