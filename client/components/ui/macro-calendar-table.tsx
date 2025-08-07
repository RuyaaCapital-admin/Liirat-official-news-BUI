import React, { useState, useMemo } from "react";
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
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  CalendarIcon,
  Filter,
  RefreshCw,
  ChevronDown,
} from "lucide-react";
import { format } from "date-fns";

interface MacroCalendarTableProps {
  events: EconomicEvent[];
  className?: string;
  language?: "ar" | "en";
  dir?: "rtl" | "ltr";
  onRefresh?: (filters?: {
    country?: string;
    importance?: string[];
    from?: string;
    to?: string;
  }) => void;
}

// Top economic countries that frequently affect markets
const TOP_COUNTRIES = [
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
];

const ALL_COUNTRIES = [
  "US",
  "EUR",
  "GB",
  "JP",
  "CA",
  "AU",
  "CHF",
  "DE",
  "FR",
  "IT",
  "ES",
  "NL",
  "BE",
  "AT",
  "PT",
  "IE",
  "FI",
  "GR",
  "CZ",
  "PL",
  "HU",
  "SK",
  "SI",
  "EE",
  "LV",
  "LT",
  "CN",
  "IN",
  "BR",
  "MX",
  "RU",
  "ZA",
  "KR",
  "SG",
  "HK",
  "TH",
  "MY",
  "ID",
  "PH",
  "VN",
  "NO",
  "SE",
  "DK",
  "IS",
  "TR",
  "IL",
  "SA",
  "AE",
];

const getImportanceColor = (importance: number) => {
  switch (importance) {
    case 3:
      return "bg-red-500 text-white";
    case 2:
      return "bg-orange-500 text-white";
    case 1:
      return "bg-green-500 text-white";
    default:
      return "bg-gray-500 text-white";
  }
};

const getImportanceLabel = (importance: number, language: string) => {
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
  }
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
};

const getCountryCode = (country: string): string => {
  const countryCodeMap: Record<string, string> = {
    US: "US",
    USA: "US",
    "United States": "US",
    EUR: "EU",
    EU: "EU",
    Eurozone: "EU",
    GB: "GB",
    UK: "GB",
    "United Kingdom": "GB",
    JP: "JP",
    JPY: "JP",
    Japan: "JP",
    CA: "CA",
    CAD: "CA",
    Canada: "CA",
    AU: "AU",
    AUD: "AU",
    Australia: "AU",
    CHF: "CH",
    CH: "CH",
    Switzerland: "CH",
    DE: "DE",
    GER: "DE",
    Germany: "DE",
    FR: "FR",
    France: "FR",
    IT: "IT",
    Italy: "IT",
    ES: "ES",
    Spain: "ES",
    NL: "NL",
    Netherlands: "NL",
    BE: "BE",
    Belgium: "BE",
    AT: "AT",
    Austria: "AT",
    PT: "PT",
    Portugal: "PT",
    IE: "IE",
    Ireland: "IE",
    FI: "FI",
    Finland: "FI",
    GR: "GR",
    Greece: "GR",
    CZ: "CZ",
    "Czech Republic": "CZ",
    PL: "PL",
    Poland: "PL",
    HU: "HU",
    Hungary: "HU",
    SK: "SK",
    Slovakia: "SK",
    SI: "SI",
    Slovenia: "SI",
    EE: "EE",
    Estonia: "EE",
    LV: "LV",
    Latvia: "LV",
    LT: "LT",
    Lithuania: "LT",
    CN: "CN",
    CHN: "CN",
    China: "CN",
    IN: "IN",
    IND: "IN",
    India: "IN",
    BR: "BR",
    BRA: "BR",
    Brazil: "BR",
    MX: "MX",
    MEX: "MX",
    Mexico: "MX",
    RU: "RU",
    RUS: "RU",
    Russia: "RU",
    ZA: "ZA",
    "South Africa": "ZA",
    KR: "KR",
    "South Korea": "KR",
    SG: "SG",
    SGP: "SG",
    Singapore: "SG",
    HK: "HK",
    "Hong Kong": "HK",
    TH: "TH",
    Thailand: "TH",
    MY: "MY",
    Malaysia: "MY",
    ID: "ID",
    Indonesia: "ID",
    PH: "PH",
    Philippines: "PH",
    VN: "VN",
    Vietnam: "VN",
    NO: "NO",
    Norway: "NO",
    SE: "SE",
    Sweden: "SE",
    DK: "DK",
    Denmark: "DK",
    IS: "IS",
    Iceland: "IS",
    TR: "TR",
    Turkey: "TR",
    IL: "IL",
    Israel: "IL",
    SA: "SA",
    "Saudi Arabia": "SA",
    AE: "AE",
    UAE: "AE",
    "United Arab Emirates": "AE",
    NZ: "NZ",
    "New Zealand": "NZ",
  };

  // Try direct match first, then uppercase
  return countryCodeMap[country] || countryCodeMap[country?.toUpperCase()] || "";
};

const getCountryFlag = (country: string) => {
  const countryCode = getCountryCode(country);

  if (countryCode) {
    return (
      <ReactCountryFlag
        countryCode={countryCode}
        svg
        style={{
          width: '1.2em',
          height: '1.2em',
          borderRadius: '2px'
        }}
        title={country}
      />
    );
  }

  // Fallback to world icon for unknown countries
  return (
    <span className="text-muted-foreground inline-flex items-center justify-center w-5 h-4 rounded text-xs border">
      {country}
    </span>
  );
};

const getCountryName = (country: string, language: string) => {
  const countryNames: Record<string, { en: string; ar: string }> = {
    US: { en: "United States", ar: "الولايات المتحدة" },
    EUR: { en: "Eurozone", ar: "منطقة اليورو" },
    GB: { en: "United Kingdom", ar: "المملكة المتحدة" },
    JP: { en: "Japan", ar: "اليابان" },
    CA: { en: "Canada", ar: "كندا" },
    AU: { en: "Australia", ar: "��ستراليا" },
    CHF: { en: "Switzerland", ar: "سويسرا" },
    DE: { en: "Germany", ar: "ألمانيا" },
    FR: { en: "France", ar: "فرنسا" },
    CN: { en: "China", ar: "الصين" },
    CH: { en: "Switzerland", ar: "سويسرا" },
  };
  return countryNames[country]?.[language] || country;
};

const formatDate = (dateStr: string, language: string) => {
  try {
    const date = new Date(dateStr);
    if (language === "ar") {
      // Use Gregorian calendar for Arabic to avoid Islamic calendar months like "صفر"
      return date.toLocaleDateString("ar-SA-u-ca-gregory", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    }
  } catch {
    return dateStr;
  }
};

export function MacroCalendarTable({
  events,
  className,
  language = "en",
  dir = "ltr",
  onRefresh,
}: MacroCalendarTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [countrySearchTerm, setCountrySearchTerm] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("all");
  const [selectedImportances, setSelectedImportances] = useState<string[]>([
    "3",
  ]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [dateRange, setDateRange] = useState("all");
  const [isCountryOpen, setIsCountryOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const t = (enText: string, arText: string) =>
    language === "ar" ? arText : enText;

  // Listen for online/offline changes
  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Filter countries based on search
  const filteredCountries = useMemo(() => {
    const searchLower = countrySearchTerm.toLowerCase();
    if (!searchLower) return ALL_COUNTRIES;

    return ALL_COUNTRIES.filter((country) => {
      const countryName = getCountryName(country, language).toLowerCase();
      return (
        country.toLowerCase().includes(searchLower) ||
        countryName.includes(searchLower)
      );
    });
  }, [countrySearchTerm, language]);

  // Filter and sort events based on search criteria
  const filteredEvents = useMemo(() => {
    const filtered = events.filter((event) => {
      const matchesSearch =
        searchTerm === "" ||
        event.event.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.country.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCountry =
        selectedCountry === "all" || event.country === selectedCountry;

      const matchesImportance = selectedImportances.includes(
        event.importance.toString(),
      );

      const matchesDate = (() => {
        if (selectedDate) {
          const eventDate = new Date(event.date);
          return eventDate.toDateString() === selectedDate.toDateString();
        }

        if (dateRange === "all") return true;

        const eventDate = new Date(event.date);
        const today = new Date();

        switch (dateRange) {
          case "today":
            return eventDate.toDateString() === today.toDateString();
          case "thisweek":
            const weekStart = new Date(today);
            weekStart.setDate(today.getDate() - today.getDay());
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6);
            return eventDate >= weekStart && eventDate <= weekEnd;
          case "nextweek":
            const nextWeekStart = new Date(today);
            nextWeekStart.setDate(today.getDate() - today.getDay() + 7);
            const nextWeekEnd = new Date(nextWeekStart);
            nextWeekEnd.setDate(nextWeekStart.getDate() + 6);
            return eventDate >= nextWeekStart && eventDate <= nextWeekEnd;
          default:
            return true;
        }
      })();

      return (
        matchesSearch && matchesCountry && matchesImportance && matchesDate
      );
    });

    // Sort events by date - soonest first
    const sorted = filtered.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      const now = Date.now();

      // Prioritize upcoming events over past events
      const aIsUpcoming = dateA >= now;
      const bIsUpcoming = dateB >= now;

      if (aIsUpcoming && !bIsUpcoming) return -1;
      if (!aIsUpcoming && bIsUpcoming) return 1;

      // Within the same category (upcoming or past), sort by date
      return dateA - dateB;
    });

    return sorted;
  }, [
    events,
    searchTerm,
    selectedCountry,
    selectedImportances,
    selectedDate,
    dateRange,
  ]);

  const handleUpdate = () => {
    // Update online status from navigator
    setIsOnline(navigator.onLine);
    // Call refresh callback with current filters
    if (onRefresh) {
      const filters = {
        country: selectedCountry === "all" ? undefined : selectedCountry,
        importance: selectedImportances,
        from: selectedDate ? selectedDate.toISOString().split("T")[0] : undefined,
        to: selectedDate ? selectedDate.toISOString().split("T")[0] : undefined,
      };
      onRefresh(filters);
    }
  };

  // REMOVED auto-refresh to prevent infinite API calls
  // Refresh only happens manually via Update button

  const clearFilters = () => {
    setSearchTerm("");
    setCountrySearchTerm("");
    setSelectedCountry("all");
    setSelectedImportances(["3"]);
    setSelectedDate(undefined);
    setDateRange("all");
  };

  return (
    <div className={cn("space-y-4", className)} dir={dir}>
      {/* Search and Filter Section */}
      <div className="bg-card border rounded-lg p-4 space-y-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-sm">
            {t("Economic Calendar Filters", "فلاتر التقويم الاقتصادي")}
          </h3>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search
            className={cn(
              "absolute top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground",
              dir === "rtl" ? "right-3" : "left-3",
            )}
          />
          <Input
            type="text"
            placeholder={t("Search in events...", "البحث في الأحداث...")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={cn(
              "w-full",
              dir === "rtl" ? "pr-10 text-right" : "pl-10",
            )}
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Date Filter with Calendar */}
          <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn("justify-between", dir === "rtl" && "text-right")}
              >
                <span>
                  {selectedDate
                    ? format(selectedDate, "MMM dd")
                    : dateRange === "today"
                      ? t("Today", "اليوم")
                      : dateRange === "thisweek"
                        ? t("This Week", "هذا الأسبوع")
                        : dateRange === "nextweek"
                          ? t("Next Week", "الأسبوع القادم")
                          : t("Date", "التاريخ")}
                </span>
                <CalendarIcon className="h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <div className="p-3 border-b">
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={dateRange === "today" ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setDateRange("today");
                      setSelectedDate(undefined);
                      setIsCalendarOpen(false);
                    }}
                  >
                    {t("Today", "اليوم")}
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant={
                          dateRange.includes("week") ? "default" : "outline"
                        }
                        size="sm"
                        className="justify-between"
                      >
                        {t("Weekly", "أسبوعي")}
                        <ChevronDown className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem
                        onClick={() => {
                          setDateRange("thisweek");
                          setSelectedDate(undefined);
                          setIsCalendarOpen(false);
                        }}
                      >
                        {t("This Week", "هذا الأسبوع")}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setDateRange("nextweek");
                          setSelectedDate(undefined);
                          setIsCalendarOpen(false);
                        }}
                      >
                        {t("Next Week", "الأس��وع القادم")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => {
                  setSelectedDate(date);
                  setDateRange("all");
                  setIsCalendarOpen(false);
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          {/* Country Filter with Search */}
          <Popover open={isCountryOpen} onOpenChange={setIsCountryOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn("justify-between", dir === "rtl" && "text-right")}
              >
                <span className="flex items-center gap-2">
                  {selectedCountry === "all"
                    ? t("Currency/Country", "العملة/البلد")
                    : (
                        <>
                          <div className="flex items-center">
                            {getCountryFlag(selectedCountry)}
                          </div>
                          <span>{selectedCountry}</span>
                        </>
                      )}
                </span>
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0">
              <div className="p-3 border-b">
                <div className="relative">
                  <Search
                    className={cn(
                      "absolute top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground",
                      dir === "rtl" ? "right-3" : "left-3",
                    )}
                  />
                  <Input
                    placeholder={t(
                      "Search countries...",
                      "البحث في الب��دان...",
                    )}
                    value={countrySearchTerm}
                    onChange={(e) => setCountrySearchTerm(e.target.value)}
                    className={cn(dir === "rtl" ? "pr-10 text-right" : "pl-10")}
                  />
                </div>
              </div>
              <div className="max-h-60 overflow-y-auto">
                <div className="p-2">
                  <div
                    className="px-2 py-1 cursor-pointer hover:bg-muted rounded text-sm"
                    onClick={() => {
                      setSelectedCountry("all");
                      setIsCountryOpen(false);
                    }}
                  >
                    {t("All Countries", "جم��ع البلدان")}
                  </div>

                  {/* Top Countries Section */}
                  <div className="mt-2 mb-2">
                    <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">
                      {t("Top Economic Countries", "أهم البلدان الاقتصادية")}
                    </div>
                    {TOP_COUNTRIES.filter((country) =>
                      filteredCountries.includes(country),
                    ).map((country) => (
                      <div
                        key={country}
                        className="px-2 py-1 cursor-pointer hover:bg-muted rounded text-sm flex items-center gap-2"
                        onClick={() => {
                          setSelectedCountry(country);
                          setIsCountryOpen(false);
                        }}
                      >
                        <div className="flex items-center">
                          {getCountryFlag(country)}
                        </div>
                        <span>{country}</span>
                        <span className="text-muted-foreground text-xs">
                          {getCountryName(country, language)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* All Countries Section */}
                  <div className="border-t pt-2">
                    <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">
                      {t("All Countries", "جميع البلدان")}
                    </div>
                    {filteredCountries
                      .filter((country) => !TOP_COUNTRIES.includes(country))
                      .map((country) => (
                        <div
                          key={country}
                          className="px-2 py-1 cursor-pointer hover:bg-muted rounded text-sm flex items-center gap-2"
                          onClick={() => {
                            setSelectedCountry(country);
                            setIsCountryOpen(false);
                          }}
                        >
                          <div className="flex items-center">
                            {getCountryFlag(country)}
                          </div>
                          <span>{country}</span>
                          <span className="text-muted-foreground text-xs">
                            {getCountryName(country, language)}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Importance Filter - Multi-select */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn("justify-between", dir === "rtl" && "text-right")}
              >
                <span>
                  {selectedImportances.length === 1
                    ? selectedImportances[0] === "3"
                      ? t("High Impact", "عالي التأثير")
                      : selectedImportances[0] === "2"
                        ? t("Medium Impact", "متوسط التأثير")
                        : t("Low Impact", "منخفض التأثير")
                    : `${selectedImportances.length} ${t("Impact Levels", "مستويات التأثير")}`}
                </span>
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-3">
              <div className="space-y-3">
                <div className="text-sm font-medium">
                  {t("Select Impact Levels", "اختر مستويات التأثير")}
                </div>
                {[
                  {
                    value: "3",
                    label: t("High Impact", "عالي التأثير"),
                    color: "text-red-600",
                  },
                  {
                    value: "2",
                    label: t("Medium Impact", "متوسط التأثير"),
                    color: "text-orange-600",
                  },
                  {
                    value: "1",
                    label: t("Low Impact", "منخفض التأثير"),
                    color: "text-green-600",
                  },
                ].map((importance) => (
                  <div
                    key={importance.value}
                    className="flex items-center space-x-2"
                  >
                    <Checkbox
                      id={`importance-${importance.value}`}
                      checked={selectedImportances.includes(importance.value)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedImportances((prev) => [
                            ...prev,
                            importance.value,
                          ]);
                        } else {
                          setSelectedImportances((prev) =>
                            prev.filter((i) => i !== importance.value),
                          );
                        }
                      }}
                    />
                    <label
                      htmlFor={`importance-${importance.value}`}
                      className={cn("text-sm cursor-pointer", importance.color)}
                    >
                      {importance.label}
                    </label>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {/* Update Button with Status */}
          <Button
            variant="outline"
            onClick={handleUpdate}
            className="flex items-center gap-2 relative"
          >
            <RefreshCw className="h-4 w-4" />
            {t("Update", "تحديث")}
            <div
              className={cn(
                "absolute top-1 right-1 w-2 h-2 rounded-full",
                isOnline ? "bg-green-500" : "bg-red-500",
              )}
            />
          </Button>

          {/* Clear All Button */}
          <Button
            variant="ghost"
            onClick={clearFilters}
            className="text-muted-foreground hover:text-foreground"
          >
            {t("Clear All", "مسح الكل")}
          </Button>
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {t(
              `Showing ${filteredEvents.length} of ${events.length} events`,
              `عرض ${filteredEvents.length} من ${events.length} حدث`,
            )}
          </span>
        </div>
      </div>

      {/* Events Display - Mobile Cards + Desktop Table */}
      <div>
        {/* Mobile Card Layout */}
        <div className="sm:hidden space-y-3">
          {filteredEvents.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground bg-card rounded-lg border">
              {t(
                "No events found matching your criteria",
                "لا توجد أحداث تطابق معاييرك",
              )}
            </div>
          ) : (
            filteredEvents.map((event, index) => (
              <div
                key={index}
                className="bg-card rounded-lg border p-4 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="text-lg flex items-center">
                      {getCountryFlag(event.country)}
                    </div>
                    <span className="font-medium text-sm">{event.country}</span>
                  </div>
                  <Badge
                    className={cn(
                      "text-xs px-2 py-1",
                      getImportanceColor(event.importance),
                    )}
                  >
                    {getImportanceLabel(event.importance, language)}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="font-medium text-sm leading-tight">
                    {event.event}
                  </div>

                  <div className="text-xs text-muted-foreground">
                    {formatDate(event.date, language)}
                  </div>

                  {event.actual && (
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-muted-foreground">
                        {t("Actual", "الفعلي")}:
                      </span>
                      <span className="px-2 py-1 rounded bg-primary/10 text-primary font-medium">
                        {event.actual}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop Table Layout */}
        <div className="hidden sm:block border rounded-lg overflow-x-auto">
          <div className="min-w-[700px]">
            <table className="w-full border-collapse bg-card">
            <thead className="bg-muted/50">
              <tr>
                <th
                  className={cn(
                    "p-3 font-semibold text-sm border-b",
                    dir === "rtl" ? "text-right" : "text-left",
                  )}
                >
                  {t("Date & Time", "التاريخ والوقت")}
                </th>
                <th
                  className={cn(
                    "p-3 font-semibold text-sm border-b",
                    dir === "rtl" ? "text-right" : "text-left",
                  )}
                >
                  {t("Currency/Country", "العملة/البلد")}
                </th>
                <th
                  className={cn(
                    "p-3 font-semibold text-sm border-b",
                    dir === "rtl" ? "text-right" : "text-left",
                  )}
                >
                  {t("Impact", "التأثير")}
                </th>
                <th
                  className={cn(
                    "p-3 font-semibold text-sm border-b",
                    dir === "rtl" ? "text-right" : "text-left",
                  )}
                >
                  {t("Event", "الحدث")}
                </th>
                <th
                  className={cn(
                    "p-3 font-semibold text-sm border-b",
                    dir === "rtl" ? "text-right" : "text-left",
                  )}
                >
                  {t("Actual", "الفعلي")}
                </th>
                <th
                  className={cn(
                    "p-3 font-semibold text-sm border-b",
                    dir === "rtl" ? "text-right" : "text-left",
                  )}
                >
                  {t("Forecast", "التوقع")}
                </th>
                <th
                  className={cn(
                    "p-3 font-semibold text-sm border-b",
                    dir === "rtl" ? "text-right" : "text-left",
                  )}
                >
                  {t("Previous", "السابق")}
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredEvents.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="p-8 text-center text-muted-foreground"
                  >
                    {t(
                      "No events found matching your criteria",
                      "لا توجد أحداث تطابق معاييرك",
                    )}
                  </td>
                </tr>
              ) : (
                filteredEvents.map((event, index) => (
                  <tr
                    key={index}
                    className="border-b hover:bg-muted/30 transition-colors"
                  >
                    <td
                      className={cn(
                        "p-3 text-sm",
                        dir === "rtl" ? "text-right" : "text-left",
                      )}
                    >
                      <div className="font-medium">
                        {formatDate(event.date, language)}
                      </div>
                    </td>
                    <td
                      className={cn(
                        "p-3 text-sm",
                        dir === "rtl" ? "text-right" : "text-left",
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <div className="flex items-center">
                          {getCountryFlag(event.country)}
                        </div>
                        <span className="font-medium">{event.country}</span>
                      </div>
                    </td>
                    <td
                      className={cn(
                        "p-3",
                        dir === "rtl" ? "text-right" : "text-left",
                      )}
                    >
                      <Badge
                        className={cn(
                          "text-xs px-2 py-1",
                          getImportanceColor(event.importance),
                        )}
                      >
                        {getImportanceLabel(event.importance, language)}
                      </Badge>
                    </td>
                    <td
                      className={cn(
                        "p-3 text-sm",
                        dir === "rtl" ? "text-right" : "text-left",
                      )}
                    >
                      <div className="font-medium max-w-xs">{event.event}</div>
                    </td>
                    <td
                      className={cn(
                        "p-3 text-sm font-medium",
                        dir === "rtl" ? "text-right" : "text-left",
                      )}
                    >
                      <span
                        className={cn(
                          "px-2 py-1 rounded text-xs",
                          event.actual
                            ? "bg-primary/10 text-primary"
                            : "text-muted-foreground",
                        )}
                      >
                        {event.actual || "-"}
                      </span>
                    </td>
                    <td
                      className={cn(
                        "p-3 text-sm",
                        dir === "rtl" ? "text-right" : "text-left",
                      )}
                    >
                      <span className="text-muted-foreground">
                        {event.forecast || "-"}
                      </span>
                    </td>
                    <td
                      className={cn(
                        "p-3 text-sm",
                        dir === "rtl" ? "text-right" : "text-left",
                      )}
                    >
                      <span className="text-muted-foreground">
                        {event.previous || "-"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
