import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/language-context";
import {
  Calendar,
  Search,
  Clock,
  Filter,
  Bot,
  TrendingUp,
  TrendingDown,
  Minus,
  Bell,
  Globe,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface EconomicEvent {
  id: string;
  date: string;
  time: string;
  country: string;
  countryFlag?: string;
  event: string;
  importance: 1 | 2 | 3;
  actual?: string;
  forecast?: string;
  previous?: string;
  category: "growth" | "employment" | "inflation" | "technology" | "all";
  currency: string;
  impact?: "positive" | "negative" | "neutral";
}

interface ModernEconomicCalendarProps {
  className?: string;
}

export function ModernEconomicCalendar({
  className,
}: ModernEconomicCalendarProps) {
  const { language, dir } = useLanguage();
  const [selectedTimezone, setSelectedTimezone] = useState("Dubai (GST)");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedWeek, setSelectedWeek] = useState("this-week");
  const [selectedDay, setSelectedDay] = useState("all");
  const [selectedCurrencies, setSelectedCurrencies] = useState<string[]>(["all"]);
  const [selectedCountries, setSelectedCountries] = useState<string[]>(["all"]);
  const [selectedImportance, setSelectedImportance] = useState<string[]>(["3"]);
  const [events, setEvents] = useState<EconomicEvent[]>([]);
  const [isLoadingAI, setIsLoadingAI] = useState<string | null>(null);

  // Search suggestions based on countries, events, and currencies (Arabic and English)
  const searchSuggestions = React.useMemo(() => {
    if (searchQuery.length < 1) return [];
    const countries = [...new Set(events.map((e) => e.country))];
    const eventTerms = [...new Set(events.map((e) => e.event))];
    const currencies = [...new Set(events.map((e) => e.currency))];
    const countryTranslations = [
      { ar: "الولايات المتحدة", en: "United States", currency: "USD" },
      { ar: "ألمانيا", en: "Germany", currency: "EUR" },
      { ar: "المملكة المتحدة", en: "United Kingdom", currency: "GBP" },
      { ar: "اليابان", en: "Japan", currency: "JPY" },
      { ar: "كندا", en: "Canada", currency: "CAD" },
    ];
    const allSuggestions = [
      ...countries.map((c) => ({ type: "country", text: c, icon: "🏛️" })),
      ...eventTerms.map((e) => ({ type: "event", text: e, icon: "📊" })),
      ...currencies.map((c) => ({ type: "currency", text: c, icon: "💱" })),
      ...countryTranslations.map((t) => ({ type: "country", text: t.en, icon: "🏛️" })),
      ...countryTranslations.map((t) => ({ type: "currency", text: `${t.currency} (${t.en})`, icon: "💱" })),
    ];
    return allSuggestions
      .filter(
        (s) =>
          typeof s.text === "string" &&
          (s.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (searchQuery.length >= 1 && s.text.includes(searchQuery))),
      )
      .slice(0, 8);
  }, [searchQuery, events]);

  // Show suggestions when user types 1+ characters
  React.useEffect(() => {
    setShowSearchSuggestions(
      searchQuery.length >= 1 && searchSuggestions.length > 0,
    );
  }, [searchQuery, searchSuggestions]);

  // Sample economic events data
  useEffect(() => {
    async function fetchEvents() {
      try {
        const params = new URLSearchParams();
        if (selectedCategory !== "all") params.append("category", selectedCategory);
        if (!selectedCountries.includes("all")) params.append("country", selectedCountries.join(","));
        if (!selectedCurrencies.includes("all")) params.append("currency", selectedCurrencies.join(","));
        if (selectedImportance.length > 0) params.append("importance", selectedImportance.join(","));
        // Always fetch for today and future
        const today = new Date().toISOString().split("T")[0];
        params.append("from", today);
        params.append("limit", "50");
        const res = await fetch(`/api/eodhd-calendar?${params.toString()}`);
        const data = await res.json();
        setEvents(Array.isArray(data.events) ? data.events : []);
      } catch (err) {
        setEvents([]);
      }
    }
    fetchEvents();
  }, [selectedCategory, selectedCountries, selectedCurrencies, selectedImportance]);

  const categories = [
    { value: "all", label: "الكل" },
    { value: "growth", label: "النمو" },
    { value: "employment", label: "التوظيف" },
    { value: "inflation", label: "التضخم" },
    { value: "technology", label: "التقنية" },
  ];

  const weekOptions = [
    { value: "this-week", label: "هذا الأسبوع" },
    { value: "next-week", label: "الأسبوع القادم" },
  ];

  const dayOptions = [
    { value: "all", label: "جميع الأيام" },
    { value: "today", label: "اليوم" },
    { value: "tomorrow", label: "غداً" },
  ];

  const currencyOptions = [
    { value: "all", label: "الكل" },
    { value: "USD", label: "الدولار الأمريكي" },
    { value: "EUR", label: "اليورو" },
    { value: "GBP", label: "الجنيه الإسترليني" },
    { value: "JPY", label: "الين الياباني" },
    { value: "CAD", label: "الدولار الكندي" },
  ];
  const countryFlagMap: Record<string, string> = {
    US: "🇺🇸", DE: "🇩🇪", GB: "🇬🇧", JP: "🇯🇵", CA: "🇨🇦", FR: "🇫🇷", CN: "🇨🇳", RU: "🇷🇺", AU: "🇦🇺", BR: "🇧🇷", IN: "🇮🇳", IT: "🇮🇹", ES: "🇪🇸", CH: "🇨🇭", TR: "🇹🇷", KR: "🇰🇷", SA: "🇸🇦", AE: "🇦🇪"
  };

  const timezones = [
    "Dubai (GST)",
    "London (GMT)",
    "New York (EST)",
    "Tokyo (JST)",
    "Sydney (AEDT)",
  ];

  const getImportanceColor = (importance: 1 | 2 | 3) => {
    switch (importance) {
      case 1:
        return "bg-gray-500";
      case 2:
        return "bg-yellow-500";
      case 3:
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  // Language helpers
  const normalizeArabic = (str: string) => str ? str.normalize('NFC') : "";
  const getImportanceLabel = (importance: 1 | 2 | 3) => {
    if (language === "ar") {
      switch (importance) {
        case 1: return normalizeArabic("عادي");
        case 2: return normalizeArabic("متوسط");
        case 3: return normalizeArabic("مرتفع");
        default: return normalizeArabic("عادي");
      }
    } else {
      switch (importance) {
        case 1: return "Low";
        case 2: return "Medium";
        case 3: return "High";
        default: return "Low";
      }
    }
  };

  // Date and time formatting
  const formatDateTime = (date: string, time: string) => {
    const dt = new Date(`${date}T${time}`);
    if (language === "ar") {
      return dt.toLocaleString("ar-EG", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
    } else {
      return dt.toLocaleString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
    }
  };

  const getImpactIcon = (impact?: "positive" | "negative" | "neutral") => {
    switch (impact) {
      case "positive":
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case "negative":
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      default:
        return <Minus className="w-4 h-4 text-gray-500" />;
    }
  };

  // Handler to set alert for an event (browser notification)
  const handleSetAlert = (event: EconomicEvent) => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission();
      }
      if (Notification.permission === "granted") {
        // Calculate time until event
        const eventDateTime = new Date(`${event.date}T${event.time}`);
        const now = new Date();
        const msUntilEvent = eventDateTime.getTime() - now.getTime();
        if (msUntilEvent > 0 && msUntilEvent < 1000 * 60 * 60 * 24 * 7) { // Only allow alerts for events within 7 days
          setTimeout(() => {
            new Notification(`${language === "ar" ? "تنبيه حدث اقتصادي" : "Economic Event Alert"}: ${event.event}`, {
              body: `${language === "ar" ? "الدولة" : "Country"}: ${event.country}\n${language === "ar" ? "الوقت" : "Time"}: ${event.time}\n${language === "ar" ? "الأهمية" : "Importance"}: ${getImportanceLabel(event.importance)}`,
              icon: "/liirat-favicon-64.png",
            });
          }, msUntilEvent);
          alert(`${language === "ar" ? "تم ضبط تنبيه للحدث" : "Alert set for event"}: ${event.event}`);
        } else if (msUntilEvent <= 0) {
          alert(language === "ar" ? "هذا الحدث قد بدأ بالفعل أو انتهى." : "This event has already started or ended.");
        } else {
          alert(language === "ar" ? "يمكن ضبط التنبيه فقط للأحداث خلال أسبوع من الآن." : "You can only set alerts for events within 7 days.");
        }
      } else {
        alert(language === "ar" ? "يرجى السماح بالإشعارات من المتصفح." : "Please allow notifications from your browser.");
      }
    } else {
      alert(language === "ar" ? "المتصفح لا يدعم الإشعارات." : "Browser does not support notifications.");
    }
  };

  // Handler to get AI summary for an event
  const [aiSummary, setAISummary] = useState<Record<string, string>>({});
  const handleAIAnalysis = async (eventId: string) => {
    setIsLoadingAI(eventId);
    try {
      // Check if API endpoint exists
      const event = events.find((e) => e.id === eventId);
      if (!event) return;
      const prompt = `Summarize this economic event in a short, powerful, and simple way for non-experts. Event: ${event.event}, Country: ${event.country}, Date: ${event.date}, Importance: ${getImportanceLabel(event.importance)}, Actual: ${event.actual}, Forecast: ${event.forecast}, Previous: ${event.previous}`;
      const response = await fetch("/api/openai-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      if (response.status === 404) {
        setAISummary((prev) => ({ ...prev, [eventId]: language === "ar" ? "تحليل الذكاء الاصطناعي غير متوفر حالياً." : "AI summary is not available right now." }));
      } else {
        const data = await response.json();
        setAISummary((prev) => ({ ...prev, [eventId]: data.summary || (language === "ar" ? "لم يتم العثور على ملخص." : "No summary found.") }));
      }
    } catch (err) {
      setAISummary((prev) => ({ ...prev, [eventId]: language === "ar" ? "حدث خطأ أثناء جلب التحليل." : "Error fetching analysis." }));
    }
    setIsLoadingAI(null);
  };

  const filteredEvents = events.filter((event) => {
    // Only show events from today and future
    const eventDateTime = new Date(`${event.date}T${event.time}`);
    const now = new Date();
    if (eventDateTime < now) return false;
    if (selectedCategory !== "all" && event.category !== selectedCategory) return false;
    if (!selectedCurrencies.includes("all") && !selectedCurrencies.includes(event.currency)) return false;
    if (!selectedCountries.includes("all") && !selectedCountries.includes(event.country)) return false;
    if (!event.importance || !['1','2','3'].includes(event.importance.toString())) return false;
    if (!selectedImportance.includes(event.importance.toString())) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const normalize = (str: string) => str ? str.normalize('NFC') : "";
      const matchesArabic = normalize(event.event).includes(normalize(searchQuery)) || normalize(event.country).includes(normalize(searchQuery)) || normalize(event.currency).includes(normalize(searchQuery));
      const matchesEnglish = event.event.toLowerCase().includes(query) || event.country.toLowerCase().includes(query) || event.currency.toLowerCase().includes(query);
      if (!matchesArabic && !matchesEnglish) return false;
    }
    return true;
  });

  return (
    <div
      className={cn(
        "w-full space-y-6",
        className,
        "text-base",
        "text-foreground",
        "[&_.font-medium]:text-foreground",
        "[&_.font-mono]:text-foreground",
        "[&_.text-muted-foreground]:text-gray-700 dark:text-muted-foreground"
      )}
      dir="rtl"
    >
      {/* Header */}
      <div className="text-center space-y-2 mb-8">
        <h1 className="text-4xl md:text-5xl font-bold text-primary mb-2">
          {normalizeArabic("التقويم الاقتصادي المباشر")}
        </h1>
        <p className="text-lg text-muted-foreground">
          {normalizeArabic("تابع أهم الأحداث الاقتصادية والمؤشرات المالية مع تحليلات الذكاء الاصطناعي")}
        </p>
      </div>

      {/* Filters Section */}
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold">{normalizeArabic("أدوات التصفية والبحث")}</h3>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* First Row: Timezone, Search, Category */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Timezone Selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                {normalizeArabic("المنطقة الزمنية")}
              </label>
              <Select
                value={selectedTimezone}
                onValueChange={setSelectedTimezone}
              >
                <SelectTrigger className="bg-background/80 border-border/50 hover:border-primary/50 transition-colors">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {timezones.map((tz) => (
                    <SelectItem key={tz} value={tz}>
                      {tz}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Smart Search Bar with Suggestions */}
            <div className="space-y-2 relative">
              <label className="text-sm font-medium text-muted-foreground">
                {normalizeArabic("البحث الذكي")}
              </label>
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() =>
                    setShowSearchSuggestions(searchQuery.length >= 1)
                  }
                  onBlur={() =>
                    setTimeout(() => setShowSearchSuggestions(false), 200)
                  }
                  className="pr-10 bg-background/80 border-border/50 hover:border-primary/50 transition-colors"
                  placeholder="ابحث في الأحداث أو العملات... (اكتب حرف أو اثنين)"
                  dir="rtl"
                />

                {/* Search Suggestions Dropdown */}
                {showSearchSuggestions && searchSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-background border border-border/50 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    <div className="p-2">
                      <div className="text-xs text-muted-foreground mb-2 px-2">
                        اقتراحات البحث:
                      </div>
                      {searchSuggestions.map((suggestion, index) => (
                        <div
                          key={index}
                          onClick={() => {
                            setSearchQuery(suggestion.text);
                            setShowSearchSuggestions(false);
                          }}
                          className="flex items-center gap-3 p-2 hover:bg-muted/50 cursor-pointer rounded text-sm"
                        >
                          <span className="text-lg">{suggestion.icon}</span>
                          <div className="flex-1">
                            <div className="font-medium">{suggestion.text}</div>
                            <div className="text-xs text-muted-foreground">
                              {suggestion.type === "country" && "دولة"}
                              {suggestion.type === "event" && "حدث اقتصادي"}
                              {suggestion.type === "currency" && "عملة"}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Category Dropdown */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                {normalizeArabic("الفئة")}
              </label>
              <Select
                value={selectedCategory}
                onValueChange={setSelectedCategory}
              >
                <SelectTrigger className="bg-background/80 border-border/50 hover:border-primary/50 transition-colors">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Second Row: Week, Day, Currency, Importance */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Week Selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                {normalizeArabic("الأسبوع")}
              </label>
              <Select value={selectedWeek} onValueChange={setSelectedWeek}>
                <SelectTrigger className="bg-background/80 border-border/50 hover:border-primary/50 transition-colors">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {weekOptions.map((week) => (
                    <SelectItem key={week.value} value={week.value}>
                      {week.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Day Selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                {normalizeArabic("اليوم")}
              </label>
              <Select value={selectedDay} onValueChange={setSelectedDay}>
                <SelectTrigger className="bg-background/80 border-border/50 hover:border-primary/50 transition-colors">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {dayOptions.map((day) => (
                    <SelectItem key={day.value} value={day.value}>
                      {day.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Currency Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">{normalizeArabic("العملة")}</label>
              <div className="flex flex-wrap gap-2">
                {currencyOptions.map((currency) => (
                  <Button
                    key={currency.value}
                    variant={selectedCurrencies.includes(currency.value) ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      if (currency.value === "all") {
                        setSelectedCurrencies(["all"]);
                      } else {
                        setSelectedCurrencies((prev) =>
                          prev.includes(currency.value)
                            ? prev.filter((c) => c !== currency.value)
                            : [...prev.filter((c) => c !== "all"), currency.value]
                        );
                      }
                    }}
                  >
                    {currency.label}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">{normalizeArabic("الدولة")}</label>
              <div className="flex flex-wrap gap-2">
                {[{ value: "all", label: "جميع البلدان" }, ...Object.keys(countryFlagMap).map((code) => ({ value: code, label: code }))].map((country) => (
                  <Button
                    key={country.value}
                    variant={selectedCountries.includes(country.value) ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      if (country.value === "all") {
                        setSelectedCountries(["all"]);
                      } else {
                        setSelectedCountries((prev) =>
                          prev.includes(country.value)
                            ? prev.filter((c) => c !== country.value)
                            : [...prev.filter((c) => c !== "all"), country.value]
                        );
                      }
                    }}
                  >
                    <span className="text-lg mr-1">{countryFlagMap[country.value] || "🌐"}</span>
                    {country.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Importance Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                {normalizeArabic("مستوى الأهمية (اختيار متعدد)")}
              </label>
              <div className="flex gap-2">
                <Button
                  variant={
                    selectedImportance.includes("1") ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() => {
                    if (selectedImportance.includes("1")) {
                      setSelectedImportance(
                        selectedImportance.filter((item) => item !== "1"),
                      );
                    } else {
                      setSelectedImportance([...selectedImportance, "1"]);
                    }
                  }}
                  className="flex-1 text-xs"
                >
                  {normalizeArabic("عادي")}
                </Button>
                <Button
                  variant={
                    selectedImportance.includes("2") ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() => {
                    if (selectedImportance.includes("2")) {
                      setSelectedImportance(
                        selectedImportance.filter((item) => item !== "2"),
                      );
                    } else {
                      setSelectedImportance([...selectedImportance, "2"]);
                    }
                  }}
                  className="flex-1 text-xs"
                >
                  {normalizeArabic("متوسط")}
                </Button>
                <Button
                  variant={
                    selectedImportance.includes("3") ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() => {
                    if (selectedImportance.includes("3")) {
                      setSelectedImportance(
                        selectedImportance.filter((item) => item !== "3"),
                      );
                    } else {
                      setSelectedImportance([...selectedImportance, "3"]);
                    }
                  }}
                  className="flex-1 text-xs"
                >
                  {normalizeArabic("مرتفع")}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Events Table */}
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">
                الأحداث الاقتصادية ({filteredEvents.length})
              </h3>
            </div>
            <Badge
              variant="outline"
              className="text-xs bg-primary/10 border-primary/20"
            >
              مباشر
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {/* Table Header */}
            <div className="hidden md:grid md:grid-cols-11 gap-4 p-4 bg-muted/30 rounded-lg font-medium text-sm text-muted-foreground">
              <div>{normalizeArabic("الوقت")}</div>
              <div>{normalizeArabic("الدولة")}</div>
              <div>{normalizeArabic("الحدث")}</div>
              <div>{normalizeArabic("الفئة")}</div>
              <div>{normalizeArabic("الأهمية")}</div>
              <div>{normalizeArabic("الفعلي")}</div>
              <div>{normalizeArabic("المتوقع")}</div>
              <div>{normalizeArabic("السابق")}</div>
              <div>{normalizeArabic("تنبيه")}</div>
              <div>{normalizeArabic("تحليل الذكاء الاصطناعي")}</div>
              <div>{normalizeArabic("ملخص سريع")}</div>
            </div>

            {/* Events List */}
            <div className="space-y-2">
              {filteredEvents
                .sort((a, b) => new Date(a.date + " " + a.time).getTime() - new Date(b.date + " " + b.time).getTime())
                .map((event) => (
                  <div
                    key={event.id}
                    className="p-4 bg-background/50 rounded-lg border border-border/50 hover:border-primary/30 transition-all duration-200 hover:shadow-lg"
                  >
                    {/* Desktop View */}
                    <div className="hidden md:grid md:grid-cols-11 gap-4 items-center">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span className="font-mono text-sm">{event.time}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{countryFlagMap[event.country] || event.countryFlag || "🌐"}</span>
                        <span className="text-sm">{event.country}</span>
                      </div>
                      <div className="font-medium text-sm">{event.event}</div>
                      <div className="font-medium text-xs">{event.category}</div>
                      <div className="flex items-center gap-2">
                        <div className={cn("w-3 h-3 rounded-full", getImportanceColor(event.importance))}></div>
                        <span className="text-xs">{getImportanceLabel(event.importance)}</span>
                      </div>
                      <div className="font-mono text-sm text-muted-foreground">{event.actual || "-"}</div>
                      <div className="font-mono text-sm text-muted-foreground">{event.forecast || "-"}</div>
                      <div className="font-mono text-sm text-muted-foreground">{event.previous || "-"}</div>
                      <div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleSetAlert(event)}
                          className="h-8 w-8 p-0 hover:bg-primary/10"
                        >
                          <Bell className="w-4 h-4 text-primary" />
                        </Button>
                      </div>
                      <div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleAIAnalysis(event.id)}
                          disabled={isLoadingAI === event.id}
                          className="h-8 w-8 p-0 hover:bg-primary/10"
                        >
                          {isLoadingAI === event.id ? (
                            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Bot className="w-4 h-4 text-primary" />
                          )}
                        </Button>
                      </div>
                      <div className="text-xs">{aiSummary[event.id] || ""}</div>
                    </div>
                    {/* Mobile View */}
                    <div className="md:hidden space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{countryFlagMap[event.country] || event.countryFlag || "🌐"}</span>
                          <span className="font-medium text-sm">{event.country}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span className="font-mono text-sm">{formatDateTime(event.date, event.time)}</span>
                        </div>
                      </div>
                      <div className="font-medium">{event.event}</div>
                      <div className="font-medium text-xs">{language === "ar" ? normalizeArabic(event.category) : event.category}</div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={cn("w-3 h-3 rounded-full", getImportanceColor(event.importance))}></div>
                          <span className="text-xs">{getImportanceLabel(event.importance)}</span>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleAIAnalysis(event.id)}
                          disabled={isLoadingAI === event.id}
                          className="h-8 gap-2 hover:bg-primary/10"
                        >
                          {isLoadingAI === event.id ? (
                            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Bot className="w-4 h-4 text-primary" />
                          )}
                          <span className="text-xs">{normalizeArabic("تحليل")}</span>
                        </Button>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <div className="text-muted-foreground text-xs">{normalizeArabic("الفعلي")}</div>
                          <div className="flex items-center gap-1 mt-1">
                            {event.actual ? (
                              <>
                                {getImpactIcon(event.impact)}
                                <span className="font-mono">{event.actual}</span>
                              </>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground text-xs">{normalizeArabic("المتوقع")}</div>
                          <div className="font-mono mt-1">{event.forecast || "-"}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground text-xs">{normalizeArabic("السابق")}</div>
                          <div className="font-mono mt-1">{event.previous || "-"}</div>
                        </div>
                      </div>
                      <div className="mt-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleSetAlert(event)}
                          className="h-8 w-8 p-0 hover:bg-primary/10"
                        >
                          <Bell className="w-4 h-4 text-primary" />
                        </Button>
                        <span className="text-xs text-muted-foreground ml-2">
                          {aiSummary[event.id] ? normalizeArabic(aiSummary[event.id]) : "-"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>

            {filteredEvents.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>{normalizeArabic("لا توجد أحداث اقتصادية تطابق المرشحات المحددة")}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
