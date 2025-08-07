import React, { useState, useMemo, useEffect } from "react";
import { EconomicEvent } from "@shared/api";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import ReactCountryFlag from "react-country-flag";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  CalendarIcon,
  Filter,
  RefreshCw,
  ChevronDown,
  Bell,
  Bot,
  AlertTriangle,
  Clock,
  Globe,
} from "lucide-react";
import { format } from "date-fns";
import { useLanguage } from "@/contexts/language-context";

interface EnhancedMacroCalendarProps {
  events: EconomicEvent[];
  className?: string;
  onRefresh?: (filters?: {
    country?: string;
    importance?: string[];
    from?: string;
    to?: string;
    category?: string;
  }) => void;
  onCreateAlert?: (event: EconomicEvent, type: "event") => void;
}

// Economic event categories
const EVENT_CATEGORIES = [
  { value: "all", labelEn: "All Categories", labelAr: "جميع الفئات" },
  { value: "inflation", labelEn: "Inflation", labelAr: "التضخم" },
  { value: "employment", labelEn: "Employment", labelAr: "التوظيف" },
  {
    value: "central_bank",
    labelEn: "Central Banks",
    labelAr: "البنوك المركزية",
  },
  { value: "gdp", labelEn: "GDP", labelAr: "الناتج المحلي" },
  { value: "retail", labelEn: "Retail Sales", labelAr: "مبيعات التجزئة" },
  { value: "manufacturing", labelEn: "Manufacturing", labelAr: "التصنيع" },
  { value: "housing", labelEn: "Housing", labelAr: "الإسكان" },
  { value: "earnings", labelEn: "Earnings", labelAr: "الأرباح" },
];

// Timezone options
const TIMEZONES = [
  { value: "UTC", label: "UTC" },
  { value: "America/New_York", label: "New York (EST/EDT)" },
  { value: "Europe/London", label: "London (GMT/BST)" },
  { value: "Europe/Frankfurt", label: "Frankfurt (CET/CEST)" },
  { value: "Asia/Tokyo", label: "Tokyo (JST)" },
  { value: "Asia/Shanghai", label: "Shanghai (CST)" },
  { value: "Australia/Sydney", label: "Sydney (AEST/AEDT)" },
  { value: "Asia/Dubai", label: "Dubai (GST)" },
];

// Time period options
const TIME_PERIODS = [
  { value: "this_week", labelEn: "This Week", labelAr: "هذا الأسبوع" },
  { value: "next_week", labelEn: "Next Week", labelAr: "الأسبوع القادم" },
  { value: "this_month", labelEn: "This Month", labelAr: "هذا الشهر" },
  { value: "custom", labelEn: "Custom Range", labelAr: "فترة مخصصة" },
];

// Top economic countries
const COUNTRIES = [
  "US",
  "EUR",
  "GB",
  "JP",
  "CA",
  "AU",
  "DE",
  "FR",
  "CN",
  "CH",
  "IT",
  "ES",
  "NL",
  "SE",
  "NO",
  "DK",
];

export default function EnhancedMacroCalendar({
  events,
  className,
  onRefresh,
  onCreateAlert,
}: EnhancedMacroCalendarProps) {
  const { language, dir } = useLanguage();

  // State management
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [selectedImportance, setSelectedImportance] = useState<number[]>([
    1, 2, 3,
  ]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedTimezone, setSelectedTimezone] = useState("UTC");
  const [selectedPeriod, setSelectedPeriod] = useState("this_week");
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // AI Analysis state
  const [aiAnalysis, setAiAnalysis] = useState<Record<string, string>>({});
  const [loadingAnalysis, setLoadingAnalysis] = useState<
    Record<string, boolean>
  >({});

  // Helper functions
  const getImportanceColor = (importance: number) => {
    switch (importance) {
      case 3:
        return "bg-red-500 text-white";
      case 2:
        return "bg-yellow-500 text-white";
      case 1:
        return "bg-green-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const getImportanceLabel = (importance: number) => {
    if (language === "ar") {
      switch (importance) {
        case 3:
          return "عالي";
        case 2:
          return "متوسط";
        case 1:
          return "منخفض";
        default:
          return "غير محدد";
      }
    } else {
      switch (importance) {
        case 3:
          return "High";
        case 2:
          return "Medium";
        case 1:
          return "Low";
        default:
          return "Unknown";
      }
    }
  };

  const formatDateTime = (dateString: string, timeString?: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;

      return new Intl.DateTimeFormat(language === "ar" ? "ar-SA" : "en-US", {
        timeZone: selectedTimezone,
        month: "short",
        day: "numeric",
        hour: timeString ? "2-digit" : undefined,
        minute: timeString ? "2-digit" : undefined,
        hour12: false,
      }).format(date);
    } catch (error) {
      return dateString;
    }
  };

  // Category filter function
  const matchesCategory = (event: EconomicEvent, category: string) => {
    if (category === "all") return true;

    const eventLower = event.event.toLowerCase();
    const categoryLower = event.category?.toLowerCase() || "";

    switch (category) {
      case "inflation":
        return (
          eventLower.includes("inflation") ||
          eventLower.includes("cpi") ||
          eventLower.includes("ppi")
        );
      case "employment":
        return (
          eventLower.includes("employment") ||
          eventLower.includes("unemployment") ||
          eventLower.includes("jobs") ||
          eventLower.includes("payroll")
        );
      case "central_bank":
        return (
          eventLower.includes("interest rate") ||
          eventLower.includes("fed") ||
          eventLower.includes("ecb") ||
          eventLower.includes("boe") ||
          categoryLower.includes("monetary")
        );
      case "gdp":
        return (
          eventLower.includes("gdp") || eventLower.includes("gross domestic")
        );
      case "retail":
        return (
          eventLower.includes("retail sales") ||
          eventLower.includes("consumer spending")
        );
      case "manufacturing":
        return (
          eventLower.includes("manufacturing") ||
          eventLower.includes("pmi") ||
          eventLower.includes("industrial")
        );
      case "housing":
        return (
          eventLower.includes("housing") ||
          eventLower.includes("building permits") ||
          eventLower.includes("home sales")
        );
      case "earnings":
        return (
          eventLower.includes("earnings") || categoryLower.includes("earnings")
        );
      default:
        return true;
    }
  };

  // Filter and sort events
  const filteredEvents = useMemo(() => {
    let filtered = events.filter((event) => {
      // Search filter
      if (
        searchTerm &&
        !event.event.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !event.country.toLowerCase().includes(searchTerm.toLowerCase())
      ) {
        return false;
      }

      // Country filter
      if (
        selectedCountries.length > 0 &&
        !selectedCountries.includes(event.country)
      ) {
        return false;
      }

      // Importance filter
      if (!selectedImportance.includes(event.importance)) {
        return false;
      }

      // Category filter
      if (!matchesCategory(event, selectedCategory)) {
        return false;
      }

      return true;
    });

    // Sort by date and importance
    return filtered.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      if (dateA !== dateB) return dateA - dateB;
      return b.importance - a.importance; // Higher importance first
    });
  }, [
    events,
    searchTerm,
    selectedCountries,
    selectedImportance,
    selectedCategory,
  ]);

  // Handle time period changes
  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period);

    const today = new Date();
    let from: Date, to: Date;

    switch (period) {
      case "this_week":
        from = new Date(today);
        from.setDate(today.getDate() - today.getDay()); // Start of week
        to = new Date(from);
        to.setDate(from.getDate() + 6); // End of week
        break;
      case "next_week":
        from = new Date(today);
        from.setDate(today.getDate() - today.getDay() + 7); // Start of next week
        to = new Date(from);
        to.setDate(from.getDate() + 6); // End of next week
        break;
      case "this_month":
        from = new Date(today.getFullYear(), today.getMonth(), 1);
        to = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        break;
      default:
        return;
    }

    setDateFrom(from);
    setDateTo(to);

    if (onRefresh) {
      onRefresh({
        from: from.toISOString().split("T")[0],
        to: to.toISOString().split("T")[0],
        country:
          selectedCountries.length > 0
            ? selectedCountries.join(",")
            : undefined,
        importance: selectedImportance.map(String),
        category: selectedCategory !== "all" ? selectedCategory : undefined,
      });
    }
  };

  // Handle AI analysis request
  const requestAIAnalysis = async (event: EconomicEvent) => {
    if (aiAnalysis[event.event] || loadingAnalysis[event.event]) {
      return;
    }

    setLoadingAnalysis((prev) => ({ ...prev, [event.event]: true }));

    try {
      const response = await fetch("/api/ai-analysis", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: `${event.event} - ${event.country}. Previous: ${event.previous || "N/A"}, Forecast: ${event.forecast || "N/A"}, Actual: ${event.actual || "N/A"}`,
          language: language,
          type: "event",
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setAiAnalysis((prev) => ({ ...prev, [event.event]: data.analysis }));
      } else {
        setAiAnalysis((prev) => ({
          ...prev,
          [event.event]:
            language === "ar"
              ? "تحليل الذكاء الاصطناعي غير متاح حاليًا"
              : "AI analysis currently unavailable",
        }));
      }
    } catch (error) {
      console.error("AI analysis error:", error);
      setAiAnalysis((prev) => ({
        ...prev,
        [event.event]:
          language === "ar"
            ? "تحليل الذكاء الاصطناعي غير متاح حاليًا"
            : "AI analysis currently unavailable",
      }));
    } finally {
      setLoadingAnalysis((prev) => ({ ...prev, [event.event]: false }));
    }
  };

  return (
    <div className={cn("w-full space-y-4", className)}>
      {/* Header Controls - Always Visible */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        {/* Left side - Time period selector (always visible) */}
        <div className="flex items-center gap-2">
          <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIME_PERIODS.map((period) => (
                <SelectItem key={period.value} value={period.value}>
                  {language === "ar" ? period.labelAr : period.labelEn}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedTimezone} onValueChange={setSelectedTimezone}>
            <SelectTrigger className="w-[180px]">
              <Globe className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIMEZONES.map((tz) => (
                <SelectItem key={tz.value} value={tz.value}>
                  {tz.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Right side - Filter and Refresh */}
        <div className="flex items-center gap-2">
          <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Filter className="w-4 h-4" />
                {language === "ar" ? "فلاتر" : "Filters"}
                <ChevronDown className="w-4 h-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <div className="space-y-4">
                <h4 className="font-medium">
                  {language === "ar" ? "خيارات الفلترة" : "Filter Options"}
                </h4>

                {/* Search */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    {language === "ar" ? "البحث" : "Search"}
                  </label>
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder={
                        language === "ar"
                          ? "البحث في الأحداث..."
                          : "Search events..."
                      }
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Category Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    {language === "ar" ? "الفئة" : "Category"}
                  </label>
                  <Select
                    value={selectedCategory}
                    onValueChange={setSelectedCategory}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EVENT_CATEGORIES.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {language === "ar"
                            ? category.labelAr
                            : category.labelEn}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Country Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    {language === "ar" ? "الدول" : "Countries"}
                  </label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-between"
                      >
                        {selectedCountries.length === 0
                          ? language === "ar"
                            ? "جميع الدول"
                            : "All Countries"
                          : `${selectedCountries.length} ${language === "ar" ? "دولة مختارة" : "selected"}`}
                        <ChevronDown className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56">
                      <DropdownMenuItem
                        onClick={() => setSelectedCountries([])}
                      >
                        {language === "ar" ? "جميع الدول" : "All Countries"}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {COUNTRIES.map((country) => (
                        <DropdownMenuItem
                          key={country}
                          onClick={() => {
                            setSelectedCountries((prev) =>
                              prev.includes(country)
                                ? prev.filter((c) => c !== country)
                                : [...prev, country],
                            );
                          }}
                        >
                          <Checkbox
                            checked={selectedCountries.includes(country)}
                            className="mr-2"
                          />
                          <ReactCountryFlag
                            countryCode={country}
                            svg
                            className="mr-2"
                          />
                          {country}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Importance Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    {language === "ar" ? "مستوى الأهمية" : "Importance Level"}
                  </label>
                  <div className="flex gap-2">
                    {[3, 2, 1].map((level) => (
                      <Button
                        key={level}
                        variant={
                          selectedImportance.includes(level)
                            ? "default"
                            : "outline"
                        }
                        size="sm"
                        onClick={() => {
                          setSelectedImportance((prev) =>
                            prev.includes(level)
                              ? prev.filter((l) => l !== level)
                              : [...prev, level],
                          );
                        }}
                        className={
                          selectedImportance.includes(level)
                            ? getImportanceColor(level)
                            : ""
                        }
                      >
                        {getImportanceLabel(level)}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <Button
            variant="outline"
            onClick={() => onRefresh && onRefresh()}
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            {language === "ar" ? "تحديث" : "Refresh"}
          </Button>
        </div>
      </div>

      {/* Events Table */}
      <div className="border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/30">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium">
                  {language === "ar" ? "التاريخ والوقت" : "Date & Time"}
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium">
                  {language === "ar" ? "الدولة" : "Country"}
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium">
                  {language === "ar" ? "��لحدث" : "Event"}
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium">
                  {language === "ar" ? "الأهمية" : "Impact"}
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium">
                  {language === "ar" ? "السابق" : "Previous"}
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium">
                  {language === "ar" ? "المتوقع" : "Forecast"}
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium">
                  {language === "ar" ? "الفعلي" : "Actual"}
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium">
                  {language === "ar" ? "الإجراءات" : "Actions"}
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredEvents.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    {language === "ar"
                      ? "لا توجد أحداث اقتصادية متاحة"
                      : "No economic events available"}
                  </td>
                </tr>
              ) : (
                filteredEvents.map((event, index) => (
                  <React.Fragment key={index}>
                    <tr className="border-t border-border hover:bg-muted/20">
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-muted-foreground" />
                          {formatDateTime(event.date, event.time)}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-2">
                          <ReactCountryFlag
                            countryCode={event.country}
                            svg
                            className="w-4 h-3"
                          />
                          <span>{event.country}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="max-w-xs">
                          <div className="font-medium">{event.event}</div>
                          {event.category && (
                            <Badge variant="outline" className="mt-1 text-xs">
                              {event.category}
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <Badge className={getImportanceColor(event.importance)}>
                          {getImportanceLabel(event.importance)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {event.previous || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {event.forecast || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium">
                        {event.actual || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => requestAIAnalysis(event)}
                            disabled={loadingAnalysis[event.event]}
                            className="h-8 w-8 p-0"
                            title={
                              language === "ar" ? "تحليل ذكي" : "AI Analysis"
                            }
                          >
                            <Bot
                              className={cn(
                                "w-4 h-4",
                                loadingAnalysis[event.event] && "animate-spin",
                              )}
                            />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              onCreateAlert && onCreateAlert(event, "event")
                            }
                            className="h-8 w-8 p-0"
                            title={
                              language === "ar" ? "إنشاء تنبيه" : "Create Alert"
                            }
                          >
                            <Bell className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                    {/* AI Analysis Row */}
                    {aiAnalysis[event.event] && (
                      <tr className="border-t border-border bg-primary/5">
                        <td colSpan={8} className="px-4 py-3">
                          <div className="flex items-start gap-2">
                            <Bot className="w-4 h-4 text-primary mt-0.5" />
                            <div className="flex-1">
                              <div className="text-xs font-medium text-primary mb-1">
                                {language === "ar"
                                  ? "تحليل الذكاء الاصطناعي:"
                                  : "AI Analysis:"}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {aiAnalysis[event.event]}
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Results Summary */}
      {filteredEvents.length > 0 && (
        <div className="text-sm text-muted-foreground text-center">
          {language === "ar"
            ? `عرض ${filteredEvents.length} من ${events.length} حدث اقتصادي`
            : `Showing ${filteredEvents.length} of ${events.length} economic events`}
        </div>
      )}
    </div>
  );
}
