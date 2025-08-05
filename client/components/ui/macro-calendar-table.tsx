import React, { useState, useMemo } from "react";
import { EconomicEvent } from "@shared/api";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Search, Calendar, Filter, RefreshCw } from "lucide-react";

interface MacroCalendarTableProps {
  events: EconomicEvent[];
  className?: string;
  language?: "ar" | "en";
  dir?: "rtl" | "ltr";
}

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
      case 3: return "عالي";
      case 2: return "متوسط";
      case 1: return "منخفض";
      default: return "غير محدد";
    }
  }
  switch (importance) {
    case 3: return "High";
    case 2: return "Medium";
    case 1: return "Low";
    default: return "Unknown";
  }
};

const getCountryFlag = (country: string) => {
  const flagMap: Record<string, string> = {
    US: "🇺🇸", EUR: "🇪🇺", GB: "🇬🇧", JP: "🇯🇵",
    CA: "🇨🇦", AU: "🇦🇺", CHF: "🇨🇭", DE: "🇩🇪",
    FR: "🇫🇷", IT: "🇮🇹", ES: "🇪🇸", NL: "🇳🇱",
    BE: "🇧🇪", AT: "🇦🇹", PT: "🇵🇹", IE: "🇮🇪",
    FI: "🇫🇮", GR: "🇬🇷", CZ: "🇨🇿", PL: "🇵🇱",
    HU: "🇭🇺", SK: "🇸🇰", SI: "🇸🇮", EE: "🇪🇪",
    LV: "🇱🇻", LT: "🇱🇹", CN: "🇨🇳", IN: "🇮🇳",
    BR: "🇧🇷", MX: "🇲🇽", RU: "🇷🇺", ZA: "🇿🇦",
    KR: "🇰🇷", SG: "🇸🇬", HK: "🇭🇰", TH: "🇹🇭",
    MY: "🇲🇾", ID: "🇮🇩", PH: "🇵🇭", VN: "🇻🇳",
    NO: "🇳🇴", SE: "🇸🇪", DK: "🇩🇰", IS: "🇮🇸",
    TR: "🇹🇷", IL: "🇮🇱", SA: "🇸🇦", AE: "🇦🇪",
  };
  return flagMap[country] || "🌍";
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
  const [selectedCountry, setSelectedCountry] = useState("all");
  const [selectedImportance, setSelectedImportance] = useState("all");
  const [selectedDate, setSelectedDate] = useState("all");

  const t = (enText: string, arText: string) => language === "ar" ? arText : enText;

  // Get unique countries for filter
  const countries = useMemo(() => {
    const uniqueCountries = Array.from(new Set(events.map(event => event.country)));
    return uniqueCountries.sort();
  }, [events]);

  // Filter events based on search criteria
  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      const matchesSearch = searchTerm === "" || 
        event.event.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.country.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCountry = selectedCountry === "all" || 
        event.country === selectedCountry;
      
      const matchesImportance = selectedImportance === "all" || 
        event.importance.toString() === selectedImportance;

      const matchesDate = selectedDate === "all" || (() => {
        const eventDate = new Date(event.date);
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        switch (selectedDate) {
          case "today":
            return eventDate.toDateString() === today.toDateString();
          case "tomorrow":
            return eventDate.toDateString() === tomorrow.toDateString();
          case "thisweek":
            const weekStart = new Date(today);
            weekStart.setDate(today.getDate() - today.getDay());
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6);
            return eventDate >= weekStart && eventDate <= weekEnd;
          default:
            return true;
        }
      })();

      return matchesSearch && matchesCountry && matchesImportance && matchesDate;
    });
  }, [events, searchTerm, selectedCountry, selectedImportance, selectedDate]);

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCountry("all");
    setSelectedImportance("all");
    setSelectedDate("all");
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
          <Search className={cn(
            "absolute top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground",
            dir === "rtl" ? "right-3" : "left-3"
          )} />
          <Input
            type="text"
            placeholder={t("Search in events...", "البحث في الأحداث...")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={cn(
              "w-full",
              dir === "rtl" ? "pr-10 text-right" : "pl-10"
            )}
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Date Filter */}
          <Select value={selectedDate} onValueChange={setSelectedDate}>
            <SelectTrigger className={dir === "rtl" ? "text-right" : ""}>
              <SelectValue placeholder={t("Date", "التاريخ")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("All Dates", "جميع التواريخ")}</SelectItem>
              <SelectItem value="today">{t("Today", "اليوم")}</SelectItem>
              <SelectItem value="tomorrow">{t("Tomorrow", "غداً")}</SelectItem>
              <SelectItem value="thisweek">{t("This Week", "هذا الأسبوع")}</SelectItem>
            </SelectContent>
          </Select>

          {/* Country Filter */}
          <Select value={selectedCountry} onValueChange={setSelectedCountry}>
            <SelectTrigger className={dir === "rtl" ? "text-right" : ""}>
              <SelectValue placeholder={t("Currency/Country", "العملة/البلد")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("All Countries", "جميع البلدان")}</SelectItem>
              {countries.map(country => (
                <SelectItem key={country} value={country}>
                  {getCountryFlag(country)} {country}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Importance Filter */}
          <Select value={selectedImportance} onValueChange={setSelectedImportance}>
            <SelectTrigger className={dir === "rtl" ? "text-right" : ""}>
              <SelectValue placeholder={t("Importance", "الأهمية")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("All Levels", "جميع المستويات")}</SelectItem>
              <SelectItem value="3">⭐⭐⭐ {t("High Impact", "عالي التأثير")}</SelectItem>
              <SelectItem value="2">⭐⭐ {t("Medium Impact", "متوسط التأ��ير")}</SelectItem>
              <SelectItem value="1">⭐ {t("Low Impact", "منخفض التأثير")}</SelectItem>
            </SelectContent>
          </Select>

          {/* Clear Filters */}
          <Button 
            variant="outline" 
            onClick={clearFilters}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            {t("Clear", "مسح")}
          </Button>
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {t(
              `Showing ${filteredEvents.length} of ${events.length} events`,
              `عرض ${filteredEvents.length} من ${events.length} حدث`
            )}
          </span>
          <Badge variant="secondary" className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {t("Live Updates", "تحديث مباشر")}
          </Badge>
        </div>
      </div>

      {/* Events Table */}
      <div className="overflow-x-auto border rounded-lg">
        <table className="w-full border-collapse bg-card">
          <thead className="bg-muted/50">
            <tr>
              <th className={cn("p-3 font-semibold text-sm border-b", dir === "rtl" ? "text-right" : "text-left")}>
                {t("Date & Time", "التاريخ والوقت")}
              </th>
              <th className={cn("p-3 font-semibold text-sm border-b", dir === "rtl" ? "text-right" : "text-left")}>
                {t("Currency/Country", "العملة/البلد")}
              </th>
              <th className={cn("p-3 font-semibold text-sm border-b", dir === "rtl" ? "text-right" : "text-left")}>
                {t("Importance", "الأهمية")}
              </th>
              <th className={cn("p-3 font-semibold text-sm border-b", dir === "rtl" ? "text-right" : "text-left")}>
                {t("Event", "الحدث")}
              </th>
              <th className={cn("p-3 font-semibold text-sm border-b", dir === "rtl" ? "text-right" : "text-left")}>
                {t("Actual", "الفعلي")}
              </th>
              <th className={cn("p-3 font-semibold text-sm border-b", dir === "rtl" ? "text-right" : "text-left")}>
                {t("Forecast", "التوقع")}
              </th>
              <th className={cn("p-3 font-semibold text-sm border-b", dir === "rtl" ? "text-right" : "text-left")}>
                {t("Previous", "السابق")}
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredEvents.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-muted-foreground">
                  {t("No events found matching your criteria", "لا توجد أحداث تطابق معاييرك")}
                </td>
              </tr>
            ) : (
              filteredEvents.map((event, index) => (
                <tr key={index} className="border-b hover:bg-muted/30 transition-colors">
                  <td className={cn("p-3 text-sm", dir === "rtl" ? "text-right" : "text-left")}>
                    <div className="font-medium">
                      {formatDate(event.date, language)}
                    </div>
                  </td>
                  <td className={cn("p-3 text-sm", dir === "rtl" ? "text-right" : "text-left")}>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getCountryFlag(event.country)}</span>
                      <span className="font-medium">{event.country}</span>
                    </div>
                  </td>
                  <td className={cn("p-3", dir === "rtl" ? "text-right" : "text-left")}>
                    <Badge 
                      className={cn("text-xs px-2 py-1", getImportanceColor(event.importance))}
                    >
                      {"⭐".repeat(event.importance)} {getImportanceLabel(event.importance, language)}
                    </Badge>
                  </td>
                  <td className={cn("p-3 text-sm", dir === "rtl" ? "text-right" : "text-left")}>
                    <div className="font-medium max-w-xs">
                      {event.event}
                    </div>
                  </td>
                  <td className={cn("p-3 text-sm font-medium", dir === "rtl" ? "text-right" : "text-left")}>
                    <span className={cn(
                      "px-2 py-1 rounded text-xs",
                      event.actual ? "bg-primary/10 text-primary" : "text-muted-foreground"
                    )}>
                      {event.actual || "-"}
                    </span>
                  </td>
                  <td className={cn("p-3 text-sm", dir === "rtl" ? "text-right" : "text-left")}>
                    <span className="text-muted-foreground">
                      {event.forecast || "-"}
                    </span>
                  </td>
                  <td className={cn("p-3 text-sm", dir === "rtl" ? "text-right" : "text-left")}>
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
