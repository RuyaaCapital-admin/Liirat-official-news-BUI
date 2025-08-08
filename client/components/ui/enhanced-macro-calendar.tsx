import React, { useState, useMemo, useEffect } from "react";
import { EconomicEvent } from "@shared/api";
import { cn } from "@/lib/utils";
import { formatCalendarDate, getCurrentWeekRange } from "@/lib/calendar";
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
import { CountrySelect } from "@/components/CountrySelect";

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
  { value: "next_week", labelEn: "Next Week", labelAr: "الأسبوع الق��دم" },
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
  const [selectedImportance, setSelectedImportance] = useState<"all"|"high"|"medium"|"low">("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedTimezone, setSelectedTimezone] = useState("UTC");
  const [selectedPeriod, setSelectedPeriod] = useState("this_week");
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Pagination state
  const [showAll, setShowAll] = useState(false);
  const [itemsPerPage] = useState(10);

  // AI Analysis state
  const [aiAnalysis, setAiAnalysis] = useState<Record<string, string>>({});
  const [loadingAnalysis, setLoadingAnalysis] = useState<
    Record<string, boolean>
  >({});

  // Translation state
  const [translatedContent, setTranslatedContent] = useState<
    Record<string, string>
  >({});
  const [loadingTranslation, setLoadingTranslation] = useState<
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
          return "غير م��دد";
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
      // Use the new Gregorian-only formatter from calendar utilities
      const fullDateTime = timeString ? `${dateString} ${timeString}` : dateString;
      return formatCalendarDate(fullDateTime, language === "ar" ? "ar-AE" : "en-US");
    } catch (error) {
      console.error("Date formatting error:", error);
      return dateString; // Fallback to original string
    }
  };

  // Simple fallback formatting function
  const formatSimpleDateTime = (dateString: string, timeString?: string) => {
    try {
      // Handle various date formats with Gregorian calendar only
      let date: Date;

      // Clean up the date string if it has weird formatting
      if (dateString.includes("T00:00:00")) {
        // Remove the weird T00:00:00Z suffix
        date = new Date(dateString.split("T")[0]);
      } else {
        date = new Date(dateString);
      }

      if (isNaN(date.getTime())) {
        // If still invalid, try parsing as YYYY-MM-DD
        const cleanDate = dateString.replace(/[^0-9-]/g, "").split("-");
        if (cleanDate.length >= 3) {
          date = new Date(
            parseInt(cleanDate[0]),
            parseInt(cleanDate[1]) - 1,
            parseInt(cleanDate[2]),
          );
        } else {
          return dateString;
        }
      }

      // Simple, clean formatting for both Arabic and English - Gregorian calendar only
      const options: Intl.DateTimeFormatOptions = {
        calendar: "gregory", // Explicitly use Gregorian calendar
        month: "short",
        day: "numeric",
        timeZone: "Asia/Dubai", // Always use Dubai time
      };

      // Add time if provided and valid
      if (timeString && timeString !== "00:00" && !timeString.includes("T")) {
        options.hour = "2-digit";
        options.minute = "2-digit";
        options.hour12 = false;

        // Create a new date with the time
        const [hours, minutes] = timeString.split(":").map(Number);
        if (!isNaN(hours) && !isNaN(minutes)) {
          date.setHours(hours, minutes, 0, 0);
        }
      }

      // Always use Gregorian calendar for formatting
      return new Intl.DateTimeFormat("en-US", options).format(date);
    } catch (error) {
      console.error("Date formatting error:", error, "for:", dateString);
      // Return just the date part if there's an error
      return dateString.split("T")[0] || dateString;
    }
  };

  // Category filter function
  const matchesCategory = (event: EconomicEvent, category: string) => {
    if (category === "all") return true;

    const eventLower = (event.title || event.event || "").toLowerCase();
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
        !(event.title || event.event || "").toLowerCase().includes(searchTerm.toLowerCase()) &&
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

      // Importance filter - exact match with API values
      if (selectedImportance !== "all") {
        const impStr = String(event.importance || "").toLowerCase();
        if (selectedImportance === "high" && impStr !== "high") return false;
        if (selectedImportance === "medium" && impStr !== "medium") return false;
        if (selectedImportance === "low" && impStr !== "low") return false;
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

  // Paginated events
  const displayedEvents = useMemo(() => {
    if (showAll) return filteredEvents;
    return filteredEvents.slice(0, itemsPerPage);
  }, [filteredEvents, showAll, itemsPerPage]);

  // Auto-translate events when language changes to Arabic (with debouncing)
  useEffect(() => {
    // Enable real-time translation for Arabic mode with proper API configuration
    if (language === "ar" && displayedEvents.length > 0) {
      // Debounce translation requests to avoid overwhelming the API
      const timer = setTimeout(() => {
        displayedEvents.slice(0, 5).forEach((event, index) => {
          // Stagger requests to avoid rate limiting and reduce API load
          setTimeout(() => {
            translateContent(event);
          }, index * 2000); // 2 second delay between requests to reduce load
        });
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [language, displayedEvents]);

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

  // Offline translation fallback for common economic terms
  const getOfflineTranslation = (text: string): string => {
    const offlineTranslations: Record<string, string> = {
      Exports: "الصادرات",
      Imports: "الواردات",
      GDP: "الناتج المحلي الإجمالي",
      Inflation: "التضخم",
      Unemployment: "البطالة",
      "Interest Rate": "سعر الفائدة",
      "Trade Balance": "الميزان التجاري",
      "Consumer Price Index": "مؤشر أسعار المستهلك",
      "Producer Price Index": "مؤشر أسعار المنتجين",
      "Industrial Production": "الإنتاج الصناعي",
      "Retail Sales": "مبيعات التجزئة",
      Employment: "التوظيف",
      Manufacturing: "التصنيع",
      Services: "الخدمات",
      Housing: "الإسكان",
    };

    return offlineTranslations[text] || text;
  };

  // Handle translation request with proper error handling and API calls
  const translateContent = async (event: EconomicEvent) => {
    const eventTitle = event.title || event.event || "Economic Event";
    const eventKey = `${eventTitle}-${event.country}`;

    // Skip if already translated or currently translating
    if (translatedContent[eventKey] || loadingTranslation[eventKey]) {
      return translatedContent[eventKey] || eventTitle;
    }

    // Try offline translation first
    const offlineTranslation = getOfflineTranslation(eventTitle);
    if (offlineTranslation !== eventTitle) {
      setTranslatedContent((prev) => ({
        ...prev,
        [eventKey]: offlineTranslation,
      }));
      return offlineTranslation;
    }

    setLoadingTranslation((prev) => ({ ...prev, [eventKey]: true }));

    try {
      let response;
      try {
        response = await fetch(new URL("/api/translate", location.origin), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            text: event.event,
            targetLanguage: "ar",
          }),
          // Add timeout and error handling
          signal: AbortSignal.timeout(5000),
        });
      } catch (fetchError) {
        console.warn(
          `[TRANSLATION] Fetch failed for "${event.event}":`,
          fetchError,
        );
        // Use original text as fallback
        setTranslatedContent((prev) => ({ ...prev, [eventKey]: event.event }));
        return event.event;
      }

      if (response.ok) {
        const data = await response.json();
        const translated = data.translatedText || event.event;
        setTranslatedContent((prev) => ({ ...prev, [eventKey]: translated }));
        return translated;
      } else {
        // Log error but don't throw - use original text as fallback
        console.warn(
          `[TRANSLATION] API error ${response.status}, using original text as fallback`,
        );
        setTranslatedContent((prev) => ({ ...prev, [eventKey]: event.event }));
        return event.event;
      }
    } catch (error) {
      console.warn(
        "[TRANSLATION] Error occurred, using original text as fallback:",
        error,
      );
      // Always fallback to original text instead of throwing error
      setTranslatedContent((prev) => ({ ...prev, [eventKey]: event.event }));
      return event.event;
    } finally {
      setLoadingTranslation((prev) => ({ ...prev, [eventKey]: false }));
    }
  };

  // Handle AI analysis request with better error handling
  const requestAIAnalysis = async (event: EconomicEvent) => {
    if (aiAnalysis[event.event] || loadingAnalysis[event.event]) {
      return;
    }

    setLoadingAnalysis((prev) => ({ ...prev, [event.event]: true }));

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(new URL("/api/ai-analysis", location.origin), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: `${event.event} - ${event.country}. Previous: ${event.previous || "N/A"}, Forecast: ${event.forecast || "N/A"}, Actual: ${event.actual || "N/A"}`,
          language: language,
          type: "event",
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        if (data.analysis) {
          setAiAnalysis((prev) => ({ ...prev, [event.event]: data.analysis }));
        } else {
          throw new Error("No analysis received");
        }
      } else {
        // Handle specific API key errors
        const errorData = await response.json().catch(() => ({}));
        console.error(
          `AI Analysis API error: ${response.status} - ${response.statusText}`,
        );

        if (response.status === 401) {
          // API key not configured or invalid
          setAiAnalysis((prev) => ({
            ...prev,
            [event.event]:
              language === "ar"
                ? "⚠️ مفتاح OpenAI API غير صحيح أو غير مُعدّ. يرجى إعداد مفتاح صحيح في متغيرات البيئة."
                : "⚠️ OpenAI API key is invalid or not configured. Please set a valid API key in environment variables.",
          }));
          return; // Exit early to avoid throwing error
        } else if (response.status === 500) {
          setAiAnalysis((prev) => ({
            ...prev,
            [event.event]:
              language === "ar"
                ? "❌ خطأ في الخادم. يرجى المحاولة مرة أخرى لاحقاً."
                : "❌ Server error. Please try again later.",
          }));
          return; // Exit early to avoid throwing error
        } else {
          throw new Error(`API error: ${response.status}`);
        }
      }
    } catch (error) {
      console.error("AI analysis error:", error);
      setAiAnalysis((prev) => ({
        ...prev,
        [event.event]:
          language === "ar"
            ? "❌ تحليل الذكاء الاصطناعي غير متاح حاليًا. يرجى التحقق من إعدادات API."
            : "❌ AI analysis currently unavailable. Please check API configuration.",
      }));
    } finally {
      setLoadingAnalysis((prev) => ({ ...prev, [event.event]: false }));
    }
  };

  return (
    <div className={cn("w-full space-y-4", className)}>
      {/* Header Controls - Always Visible */}
      <div className="space-y-4">
        {/* Primary Controls Row */}
        <div className="flex flex-wrap gap-4 items-center justify-between">
          {/* Left side - Time period and timezone (always visible) */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-muted-foreground">
                {language === "ar" ? "الفترة:" : "Period:"}
              </label>
              <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-[100] max-h-72 overflow-auto">
                  {TIME_PERIODS.map((period) => (
                    <SelectItem key={period.value} value={period.value}>
                      {language === "ar" ? period.labelAr : period.labelEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-muted-foreground">
                {language === "ar" ? "التوقيت:" : "Time:"}
              </label>
              <Select
                value={selectedTimezone}
                onValueChange={setSelectedTimezone}
              >
                <SelectTrigger className="w-[140px]">
                  <Globe className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-[100] max-h-72 overflow-auto">
                  {TIMEZONES.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Right side - Refresh */}
          <Button
            variant="outline"
            onClick={() => onRefresh && onRefresh()}
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            {language === "ar" ? "تحديث" : "Refresh"}
          </Button>
        </div>

        {/* Filters Row - Always Visible and Functional */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg border border-border/50 shadow-sm">
          <div className="md:col-span-4 mb-2">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm">
                {language === "ar" ? "فلاتر" : "Filters"}
                {(searchTerm ||
                  selectedCountries.length > 0 ||
                  selectedImportance.length < 3 ||
                  selectedCategory !== "all") && (
                  <Badge
                    variant="secondary"
                    className="ml-2 text-xs bg-primary/10 text-primary"
                  >
                    {language === "ar" ? "نشط" : "Active"}
                  </Badge>
                )}
              </h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchTerm("");
                  setSelectedCountries([]);
                  setSelectedImportance([1, 2, 3]);
                  setSelectedCategory("all");
                  setDateFrom(undefined);
                  setDateTo(undefined);
                  setSelectedPeriod("this_week");
                }}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                {language === "ar" ? "مسح الكل" : "Clear All"}
              </Button>
            </div>
          </div>

          {/* Search */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              {language === "ar" ? "البحث" : "Search"}
            </label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={
                  language === "ar" ? "البحث في الأحداث..." : "Search events..."
                }
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-9"
              />
            </div>
          </div>

          {/* Category Filter */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              {language === "ar" ? "الفئة" : "Category"}
            </label>
            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectPortal>
                <SelectContent className="z-[100] max-h-72 overflow-auto">
                  {EVENT_CATEGORIES.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {language === "ar" ? category.labelAr : category.labelEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </SelectPortal>
            </Select>
          </div>

          {/* Countries */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              {language === "ar" ? "الدول" : "Countries"}
            </label>
            <CountrySelect
              value={selectedCountries}
              onChange={setSelectedCountries}
              options={COUNTRIES.map(code => ({code, name: code}))}
            />
          </div>

          {/* Importance Filter */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              {language === "ar" ? "مستوى الأهمية" : "Importance"}
            </label>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={selectedImportance === "high" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedImportance("high")}
                aria-pressed={selectedImportance === "high"}
                className={cn(
                  "text-xs transition-all",
                  selectedImportance === "high"
                    ? "bg-red-500 hover:bg-red-600 text-white border-red-500"
                    : "hover:bg-red-50 hover:border-red-200 dark:hover:bg-red-950"
                )}
              >
                {language === "ar" ? "عالي" : "High"}
              </Button>
              <Button
                variant={selectedImportance === "medium" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedImportance("medium")}
                aria-pressed={selectedImportance === "medium"}
                className={cn(
                  "text-xs transition-all",
                  selectedImportance === "medium"
                    ? "bg-orange-500 hover:bg-orange-600 text-white border-orange-500"
                    : "hover:bg-orange-50 hover:border-orange-200 dark:hover:bg-orange-950"
                )}
              >
                {language === "ar" ? "متوسط" : "Medium"}
              </Button>
              <Button
                variant={selectedImportance === "low" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedImportance("low")}
                aria-pressed={selectedImportance === "low"}
                className={cn(
                  "text-xs transition-all",
                  selectedImportance === "low"
                    ? "bg-green-500 hover:bg-green-600 text-white border-green-500"
                    : "hover:bg-green-50 hover:border-green-200 dark:hover:bg-green-950"
                )}
              >
                {language === "ar" ? "منخفض" : "Low"}
              </Button>
              <Button
                variant={selectedImportance === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedImportance("all")}
                aria-pressed={selectedImportance === "all"}
                className={cn(
                  "text-xs transition-all",
                  selectedImportance === "all"
                    ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                    : "hover:bg-muted"
                )}
              >
                {language === "ar" ? "الكل" : "All"}
              </Button>
            </div>
          </div>
        </div>

        {/* Custom Date Range Picker - Show when "Custom Range" is selected */}
        {selectedPeriod === "custom" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-primary/5 rounded-lg border border-primary/20">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                {language === "ar" ? "من تاريخ" : "From Date"}
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal h-9",
                      !dateFrom && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateFrom
                      ? format(dateFrom, "MMM dd, yyyy")
                      : language === "ar"
                        ? "اختر التاريخ"
                        : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateFrom}
                    onSelect={setDateFrom}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                {language === "ar" ? "إلى تاريخ" : "To Date"}
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal h-9",
                      !dateTo && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateTo
                      ? format(dateTo, "MMM dd, yyyy")
                      : language === "ar"
                        ? "اختر التاريخ"
                        : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateTo}
                    onSelect={setDateTo}
                    initialFocus
                    disabled={(date) => (dateFrom ? date < dateFrom : false)}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Apply Custom Date Range Button */}
            <div className="md:col-span-2 flex justify-end">
              <Button
                onClick={() => {
                  if (dateFrom && dateTo && onRefresh) {
                    onRefresh({
                      from: dateFrom.toISOString().split("T")[0],
                      to: dateTo.toISOString().split("T")[0],
                      country:
                        selectedCountries.length > 0
                          ? selectedCountries.join(",")
                          : undefined,
                      importance: selectedImportance.map(String),
                      category:
                        selectedCategory !== "all"
                          ? selectedCategory
                          : undefined,
                    });
                  }
                }}
                disabled={!dateFrom || !dateTo}
                className="gap-2"
              >
                <CalendarIcon className="w-4 h-4" />
                {language === "ar"
                  ? "تطبيق التاريخ المخصص"
                  : "Apply Custom Range"}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Events Table */}
      <div className="border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead className="bg-muted/30">
              <tr>
                <th
                  className={cn(
                    "px-4 py-3 text-sm font-medium w-[140px]",
                    dir === "rtl" ? "text-right" : "text-left",
                  )}
                >
                  {language === "ar" ? "التاريخ والوقت" : "Date & Time"}
                </th>
                <th
                  className={cn(
                    "px-4 py-3 text-sm font-medium w-[100px]",
                    dir === "rtl" ? "text-right" : "text-left",
                  )}
                >
                  {language === "ar" ? "الدولة" : "Country"}
                </th>
                <th
                  className={cn(
                    "px-4 py-3 text-sm font-medium w-[200px]",
                    dir === "rtl" ? "text-right" : "text-left",
                  )}
                >
                  {language === "ar" ? "الحدث" : "Event"}
                </th>
                <th
                  className={cn(
                    "px-4 py-3 text-sm font-medium w-[100px]",
                    dir === "rtl" ? "text-right" : "text-left",
                  )}
                >
                  {language === "ar" ? "الأهمية" : "Impact"}
                </th>
                <th
                  className={cn(
                    "px-4 py-3 text-sm font-medium w-[80px]",
                    dir === "rtl" ? "text-right" : "text-left",
                  )}
                >
                  {language === "ar" ? "السابق" : "Previous"}
                </th>
                <th
                  className={cn(
                    "px-4 py-3 text-sm font-medium w-[80px]",
                    dir === "rtl" ? "text-right" : "text-left",
                  )}
                >
                  {language === "ar" ? "المتوقع" : "Forecast"}
                </th>
                <th
                  className={cn(
                    "px-4 py-3 text-sm font-medium w-[80px]",
                    dir === "rtl" ? "text-right" : "text-left",
                  )}
                >
                  {language === "ar" ? "الفعلي" : "Actual"}
                </th>
                <th
                  className={cn(
                    "px-4 py-3 text-sm font-medium w-[120px]",
                    dir === "rtl" ? "text-right" : "text-left",
                  )}
                >
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
                displayedEvents.map((event, index) => (
                  <React.Fragment key={`${event.event}-${index}`}>
                    <tr className="border-t border-border hover:bg-muted/20">
                      <td className="px-4 py-3 text-sm align-top">
                        <div
                          className={cn(
                            "flex items-center gap-1 text-xs",
                            dir === "rtl" ? "justify-end" : "justify-start",
                          )}
                        >
                          <Clock className="w-3 h-3 text-muted-foreground" />
                          <span className="whitespace-nowrap">
                            {formatDateTime(event.date, event.time)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm align-top">
                        <div
                          className={cn(
                            "flex items-center gap-2",
                            dir === "rtl" ? "justify-end" : "justify-start",
                          )}
                        >
                          <ReactCountryFlag
                            countryCode={event.country}
                            svg
                            className="w-4 h-3 flex-shrink-0"
                          />
                          <span className="text-xs">{event.country}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm align-top">
                        <div className="w-full">
                          <div
                            className={cn(
                              "font-medium text-xs leading-tight",
                              dir === "rtl" ? "text-right" : "text-left",
                            )}
                          >
                            {language === "ar" &&
                            translatedContent[`${event.title || event.event}-${event.country}`]
                              ? translatedContent[
                                  `${event.title || event.event}-${event.country}`
                                ]
                              : event.title || event.event || "Economic Event"}
                            {language === "ar" &&
                              loadingTranslation[
                                `${event.title || event.event}-${event.country}`
                              ] && (
                                <span className="ml-2 text-xs text-muted-foreground">
                                  (translating...)
                                </span>
                              )}
                          </div>
                          {event.category && (
                            <Badge variant="outline" className="mt-1 text-xs">
                              {event.category}
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm align-top">
                        <div
                          className={cn(
                            "flex",
                            dir === "rtl" ? "justify-end" : "justify-start",
                          )}
                        >
                          <Badge
                            className={cn(
                              getImportanceColor(event.importance),
                              "text-xs",
                            )}
                          >
                            {getImportanceLabel(event.importance)}
                          </Badge>
                        </div>
                      </td>
                      <td
                        className={cn(
                          "px-4 py-3 text-xs align-top",
                          dir === "rtl" ? "text-right" : "text-left",
                        )}
                      >
                        {event.previous || "-"}
                      </td>
                      <td
                        className={cn(
                          "px-4 py-3 text-xs align-top",
                          dir === "rtl" ? "text-right" : "text-left",
                        )}
                      >
                        {event.forecast || "-"}
                      </td>
                      <td
                        className={cn(
                          "px-4 py-3 text-xs font-medium align-top",
                          dir === "rtl" ? "text-right" : "text-left",
                        )}
                      >
                        {event.actual || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm align-top">
                        <div
                          className={cn(
                            "flex items-center gap-1",
                            dir === "rtl" ? "justify-end" : "justify-start",
                          )}
                        >
                          <Button
                            variant={
                              aiAnalysis[event.event] ? "default" : "outline"
                            }
                            size="sm"
                            onClick={() => requestAIAnalysis(event)}
                            disabled={loadingAnalysis[event.event]}
                            className={cn(
                              "h-8 px-3 font-medium transition-all duration-200 shadow-sm",
                              aiAnalysis[event.event]
                                ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md hover:shadow-lg"
                                : "hover:bg-primary/10 border-primary/30 hover:border-primary/60",
                              loadingAnalysis[event.event] && "animate-pulse",
                            )}
                            title={
                              language === "ar" ? "تحليل ذك��" : "AI Analysis"
                            }
                          >
                            <Bot
                              className={cn(
                                "w-4 h-4 mr-1",
                                loadingAnalysis[event.event] && "animate-spin",
                                aiAnalysis[event.event] &&
                                  "text-primary-foreground",
                              )}
                            />
                            <span className="text-xs font-medium">
                              {language === "ar" ? "تحليل" : "AI"}
                            </span>
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
                                  ? "تحليل الذكاء الا��طناعي:"
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

      {/* Pagination Controls */}
      {filteredEvents.length > itemsPerPage && (
        <div className="flex items-center justify-center gap-4 pt-4">
          <Button
            variant="outline"
            onClick={() => setShowAll(!showAll)}
            className="flex items-center gap-2"
          >
            {showAll ? (
              <>
                <ChevronDown className="w-4 h-4 rotate-180" />
                {language === "ar" ? "عرض أقل" : "Show Less"}
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                {language === "ar" ? "عرض المزيد" : "Show More"}
              </>
            )}
          </Button>
        </div>
      )}

      {/* Results Summary */}
      {filteredEvents.length > 0 && (
        <div className="text-sm text-muted-foreground text-center">
          {language === "ar"
            ? `عرض ${displayedEvents.length} من ${filteredEvents.length} حدث ا��تصادي (${events.length} المجموع)`
            : `Showing ${displayedEvents.length} of ${filteredEvents.length} events (${events.length} total)`}
        </div>
      )}
    </div>
  );
}
