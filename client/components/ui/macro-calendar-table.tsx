import React, { useState, useMemo } from "react";
import { EconomicEvent } from "@shared/api";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
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

const getCountryFlag = (country: string) => {
  const flagMap: Record<string, string> = {
    US: "🇺🇸",
    EUR: "🇪🇺",
    GB: "🇬🇧",
    JP: "🇯🇵",
    CA: "🇨🇦",
    AU: "🇦🇺",
    CHF: "🇨🇭",
    DE: "🇩🇪",
    FR: "🇫🇷",
    IT: "🇮🇹",
    ES: "🇪🇸",
    NL: "🇳🇱",
    BE: "🇧🇪",
    AT: "🇦🇹",
    PT: "🇵🇹",
    IE: "��🇪",
    FI: "🇫🇮",
    GR: "🇬🇷",
    CZ: "🇨🇿",
    PL: "🇵🇱",
    HU: "🇭🇺",
    SK: "🇸🇰",
    SI: "🇸🇮",
    EE: "🇪🇪",
    LV: "🇱🇻",
    LT: "🇱🇹",
    CN: "🇨🇳",
    IN: "🇮🇳",
    BR: "🇧🇷",
    MX: "🇲🇽",
    RU: "🇷🇺",
    ZA: "🇿🇦",
    KR: "🇰🇷",
    SG: "🇸🇬",
    HK: "🇭🇰",
    TH: "🇹🇭",
    MY: "🇲🇾",
    ID: "🇮🇩",
    PH: "🇵🇭",
    VN: "🇻🇳",
    NO: "🇳🇴",
    SE: "🇸🇪",
    DK: "🇩🇰",
    IS: "🇮🇸",
    TR: "🇹🇷",
    IL: "🇮🇱",
    SA: "🇸🇦",
    AE: "🇦🇪",
  };
  return flagMap[country] || "🌍";
};

const getCountryName = (country: string, language: string) => {
  const countryNames: Record<string, { en: string; ar: string }> = {
    US: { en: "United States", ar: "الولايات المتحدة" },
    EUR: { en: "Eurozone", ar: "منطقة اليورو" },
    GB: { en: "United Kingdom", ar: "المملكة المتحدة" },
    JP: { en: "Japan", ar: "اليابان" },
    CA: { en: "Canada", ar: "كندا" },
    AU: { en: "Australia", ar: "أستراليا" },
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
    const locale = language === "ar" ? "ar-SA" : "en-US";
    return date.toLocaleDateString(locale, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
};

export function MacroCalendarTable({
  events,
  className,
  language = "en",
  dir = "ltr",
}: MacroCalendarTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [countrySearchTerm, setCountrySearchTerm] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("all");
  const [selectedImportance, setSelectedImportance] = useState("3");
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

  // Filter events based on search criteria
  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const matchesSearch =
        searchTerm === "" ||
        event.event.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.country.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCountry =
        selectedCountry === "all" || event.country === selectedCountry;

      const matchesImportance =
        event.importance.toString() === selectedImportance;

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
  }, [
    events,
    searchTerm,
    selectedCountry,
    selectedImportance,
    selectedDate,
    dateRange,
  ]);

  const handleUpdate = () => {
    // Update online status from navigator
    setIsOnline(navigator.onLine);
    // This will trigger a refresh of the calendar data
    // In production, this would call the API to fetch fresh data
    window.location.reload();
  };

  const clearFilters = () => {
    setSearchTerm("");
    setCountrySearchTerm("");
    setSelectedCountry("all");
    setSelectedImportance("3");
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
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
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
                        {t("Next Week", "الأسبوع القادم")}
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
                <span>
                  {selectedCountry === "all"
                    ? t("Currency/Country", "العملة/البلد")
                    : `${getCountryFlag(selectedCountry)} ${selectedCountry}`}
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
                      "البحث في البلدان...",
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
                    {t("All Countries", "جميع البلدان")}
                  </div>

                  {/* Top Countries Section */}
                  <div className="mt-2 mb-2">
                    <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">
                      {t("Top Economic Countries", "أهم البلدان الاقت��ادية")}
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
                        <span>{getCountryFlag(country)}</span>
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
                          <span>{getCountryFlag(country)}</span>
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

          {/* Importance Filter */}
          <Select
            value={selectedImportance}
            onValueChange={setSelectedImportance}
          >
            <SelectTrigger className={dir === "rtl" ? "text-right" : ""}>
              <SelectValue placeholder={t("calendar.table.importance")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3">
                ⭐⭐⭐ {t("High Impact", "عالي التأثير")}
              </SelectItem>
              <SelectItem value="2">
                ⭐⭐ {t("Medium Impact", "متوسط التأثير")}
              </SelectItem>
              <SelectItem value="1">
                ⭐ {t("Low Impact", "منخفض التأثير")}
              </SelectItem>
            </SelectContent>
          </Select>

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

      {/* Events Table */}
      <div className="overflow-x-auto border rounded-lg">
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
                {t("calendar.table.importance")}
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
                      <span className="text-lg">
                        {getCountryFlag(event.country)}
                      </span>
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
                      {"⭐".repeat(event.importance)}{" "}
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
  );
}
