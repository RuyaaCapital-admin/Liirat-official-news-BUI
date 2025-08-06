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
  Globe,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface EconomicEvent {
  id: string;
  time: string;
  country: string;
  countryFlag: string;
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
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedWeek, setSelectedWeek] = useState("this-week");
  const [selectedDay, setSelectedDay] = useState("all");
  const [selectedCurrency, setSelectedCurrency] = useState("all");
  const [selectedImportance, setSelectedImportance] = useState<string[]>([
    "3",
  ]);
  const [events, setEvents] = useState<EconomicEvent[]>([]);
  const [isLoadingAI, setIsLoadingAI] = useState<string | null>(null);

  // Sample economic events data
  const sampleEvents: EconomicEvent[] = [
    {
      id: "1",
      time: "14:30",
      country: "الولايات المتحدة",
      countryFlag: "🇺🇸",
      event: "بيانات التوظيف غير الزراعي",
      importance: 3,
      actual: "250K",
      forecast: "200K",
      previous: "180K",
      category: "employment",
      currency: "USD",
      impact: "positive",
    },
    {
      id: "2",
      time: "16:00",
      country: "ألمانيا",
      countryFlag: "🇩🇪",
      event: "مؤشر أسعار المستهلك",
      importance: 2,
      actual: undefined,
      forecast: "2.1%",
      previous: "2.0%",
      category: "inflation",
      currency: "EUR",
      impact: "neutral",
    },
    {
      id: "3",
      time: "18:15",
      country: "المملكة المتحدة",
      countryFlag: "🇬🇧",
      event: "قرار معدل الفائدة",
      importance: 3,
      actual: undefined,
      forecast: "5.25%",
      previous: "5.25%",
      category: "growth",
      currency: "GBP",
      impact: "neutral",
    },
    {
      id: "4",
      time: "20:00",
      country: "اليابان",
      countryFlag: "🇯🇵",
      event: "الناتج المحلي الإجمالي",
      importance: 2,
      actual: "1.2%",
      forecast: "1.0%",
      previous: "0.8%",
      category: "growth",
      currency: "JPY",
      impact: "positive",
    },
    {
      id: "5",
      time: "22:30",
      country: "كندا",
      countryFlag: "🇨🇦",
      event: "معدل البطالة",
      importance: 2,
      actual: undefined,
      forecast: "5.2%",
      previous: "5.4%",
      category: "employment",
      currency: "CAD",
      impact: "neutral",
    },
  ];

  useEffect(() => {
    setEvents(sampleEvents);
  }, []);

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

  const getImportanceLabel = (importance: 1 | 2 | 3) => {
    switch (importance) {
      case 1:
        return "عادي";
      case 2:
        return "متوسط";
      case 3:
        return "مرتفع";
      default:
        return "عادي";
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

  const handleAIAnalysis = async (eventId: string) => {
    setIsLoadingAI(eventId);

    try {
      const event = events.find((e) => e.id === eventId);
      if (!event) return;

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: `قم بتحليل هذا الحدث الاقتصادي: ${event.event} في ${event.country}. القيم: فعلي: ${event.actual || "غير متوفر"}, متوقع: ${event.forecast || "غير متوفر"}, سابق: ${event.previous || "غير متوفر"}`,
          language: "ar",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get AI analysis");
      }

      const data = await response.json();

      // You could store the analysis result in state or show it in a modal
      alert(`تحليل الذكاء الاصطناعي:\n\n${data.response}`);
    } catch (error) {
      console.error("AI Analysis error:", error);
      alert("عذراً، حدث خطأ في تحليل الذكاء الاصطناعي");
    } finally {
      setIsLoadingAI(null);
    }
  };

  const filteredEvents = events.filter((event) => {
    if (selectedCategory !== "all" && event.category !== selectedCategory)
      return false;
    if (selectedCurrency !== "all" && event.currency !== selectedCurrency)
      return false;
    if (!selectedImportance.includes(event.importance.toString()))
      return false;
    if (
      searchQuery &&
      !event.event.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !event.country.toLowerCase().includes(searchQuery.toLowerCase())
    )
      return false;
    return true;
  });

  return (
    <div className={cn("w-full space-y-6", className)} dir="rtl">
      {/* Header */}
      <div className="text-center space-y-2 mb-8">
        <h1 className="text-4xl md:text-5xl font-bold text-primary mb-2">
          التقويم الاقتصادي المباشر
        </h1>
        <p className="text-lg text-muted-foreground">
          تابع أهم الأحداث الاقتصادية والمؤشرات ال��الية مع تحليلات الذكاء
          الاصطناعي
        </p>
      </div>

      {/* Filters Section */}
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold">أدوات التصفية والبحث</h3>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* First Row: Timezone, Search, Category */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Timezone Selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                المنطقة الزمنية
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

            {/* Search Bar */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                البحث
              </label>
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10 bg-background/80 border-border/50 hover:border-primary/50 transition-colors"
                  placeholder="ابحث في الأحداث أو العملات..."
                  dir="rtl"
                />
              </div>
            </div>

            {/* Category Dropdown */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                الفئة
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
                الأسبوع
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
                اليوم
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
              <label className="text-sm font-medium text-muted-foreground">
                العملة
              </label>
              <Select
                value={selectedCurrency}
                onValueChange={setSelectedCurrency}
              >
                <SelectTrigger className="bg-background/80 border-border/50 hover:border-primary/50 transition-colors">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {currencyOptions.map((currency) => (
                    <SelectItem key={currency.value} value={currency.value}>
                      {currency.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Importance Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                مستوى الأهمية (اختيار متعدد)
              </label>
              <div className="flex gap-2">
                <Button
                  variant={
                    selectedImportance.includes("all") ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() => {
                    if (selectedImportance.includes("all")) {
                      setSelectedImportance([]);
                    } else {
                      setSelectedImportance(["all"]);
                    }
                  }}
                  className="flex-1 text-xs"
                >
                  ا��كل
                </Button>
                <Button
                  variant={
                    selectedImportance.includes("1") ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() => {
                    const newSelection = selectedImportance.filter(
                      (item) => item !== "all",
                    );
                    if (selectedImportance.includes("1")) {
                      setSelectedImportance(
                        newSelection.filter((item) => item !== "1"),
                      );
                    } else {
                      setSelectedImportance([...newSelection, "1"]);
                    }
                  }}
                  className="flex-1 text-xs"
                >
                  عادي
                </Button>
                <Button
                  variant={
                    selectedImportance.includes("2") ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() => {
                    const newSelection = selectedImportance.filter(
                      (item) => item !== "all",
                    );
                    if (selectedImportance.includes("2")) {
                      setSelectedImportance(
                        newSelection.filter((item) => item !== "2"),
                      );
                    } else {
                      setSelectedImportance([...newSelection, "2"]);
                    }
                  }}
                  className="flex-1 text-xs"
                >
                  متوسط
                </Button>
                <Button
                  variant={
                    selectedImportance.includes("3") ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() => {
                    const newSelection = selectedImportance.filter(
                      (item) => item !== "all",
                    );
                    if (selectedImportance.includes("3")) {
                      setSelectedImportance(
                        newSelection.filter((item) => item !== "3"),
                      );
                    } else {
                      setSelectedImportance([...newSelection, "3"]);
                    }
                  }}
                  className="flex-1 text-xs"
                >
                  مرتفع
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
            <div className="hidden md:grid md:grid-cols-8 gap-4 p-4 bg-muted/30 rounded-lg font-medium text-sm text-muted-foreground">
              <div>الوقت</div>
              <div>الدولة</div>
              <div>الحدث</div>
              <div>الأهمية</div>
              <div>الفعلي</div>
              <div>المتوقع</div>
              <div>السابق</div>
              <div>تحليل الذكاء الاصطناعي</div>
            </div>

            {/* Events List */}
            <div className="space-y-2">
              {filteredEvents.map((event) => (
                <div
                  key={event.id}
                  className="p-4 bg-background/50 rounded-lg border border-border/50 hover:border-primary/30 transition-all duration-200 hover:shadow-lg"
                >
                  {/* Desktop View */}
                  <div className="hidden md:grid md:grid-cols-8 gap-4 items-center">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="font-mono text-sm">{event.time}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-lg">{event.countryFlag}</span>
                      <span className="text-sm">{event.country}</span>
                    </div>

                    <div className="font-medium text-sm">{event.event}</div>

                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          "w-3 h-3 rounded-full",
                          getImportanceColor(event.importance),
                        )}
                      ></div>
                      <span className="text-xs">
                        {getImportanceLabel(event.importance)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      {event.actual && (
                        <>
                          {getImpactIcon(event.impact)}
                          <span className="font-mono text-sm">
                            {event.actual}
                          </span>
                        </>
                      )}
                      {!event.actual && (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </div>

                    <div className="font-mono text-sm text-muted-foreground">
                      {event.forecast || "-"}
                    </div>

                    <div className="font-mono text-sm text-muted-foreground">
                      {event.previous || "-"}
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
                  </div>

                  {/* Mobile View */}
                  <div className="md:hidden space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{event.countryFlag}</span>
                        <span className="font-medium text-sm">
                          {event.country}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span className="font-mono text-sm">{event.time}</span>
                      </div>
                    </div>

                    <div className="font-medium">{event.event}</div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className={cn(
                            "w-3 h-3 rounded-full",
                            getImportanceColor(event.importance),
                          )}
                        ></div>
                        <span className="text-xs">
                          {getImportanceLabel(event.importance)}
                        </span>
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
                        <span className="text-xs">تحليل</span>
                      </Button>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground text-xs">
                          ا��فعلي
                        </div>
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
                        <div className="text-muted-foreground text-xs">
                          المتوقع
                        </div>
                        <div className="font-mono mt-1">
                          {event.forecast || "-"}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground text-xs">
                          السابق
                        </div>
                        <div className="font-mono mt-1">
                          {event.previous || "-"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredEvents.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>لا توجد أحداث اقتصادية تطابق المرشحات المحددة</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
