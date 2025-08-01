import React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { PriceTicker } from "@/components/ui/price-ticker";
import { AIEventInsight } from "@/components/ui/ai-event-insight";

import { SimpleLanguageToggle } from "@/components/ui/simple-language-toggle";
import { NotificationDropdown } from "@/components/ui/notification-dropdown";
import { AlertSettingsModal } from "@/components/ui/alert-settings-modal";
import { CustomDatePicker } from "@/components/ui/custom-date-picker";
import { useLanguage } from "@/contexts/language-context";
import { useAlerts } from "@/contexts/alert-context";
import {
  Calendar,
  Bell,
  Clock,
  TrendingUp,
  Shield,
  Globe,
  Zap,
  BellRing,
  Search,
  Filter,
  Star,
  Bot,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useTheme } from "@/hooks/use-theme";

export default function Index() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [selectedPair, setSelectedPair] = useState("");
  const [selectedDate, setSelectedDate] = useState("today");
  const [selectedCountry, setSelectedCountry] = useState("all");
  const [selectedImportance, setSelectedImportance] = useState("all");
  const [searchEvent, setSearchEvent] = useState("");
  const [showAlertSettings, setShowAlertSettings] = useState(false);
  const { theme } = useTheme();
  const { language, t, dir } = useLanguage();
  const { checkEventAlerts } = useAlerts();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Connect to Supabase
    console.log("Form submitted:", { name, email, whatsapp });
  };

  const handleAlertSubmit = () => {
    // TODO: Connect to Supabase for alert system
    console.log("Alert setup for:", selectedPair);
  };

  // Enhanced economic calendar data with mixed language support
  const economicEvents = [
    {
      date: "2024-01-15",
      time: "14:30",
      event: "Consumer Price Index (CPI)",
      country: "USD",
      countryFlag: "🇺🇸",
      forecast: "3.2%",
      previous: "3.1%",
      actual: "3.4%",
      importance: 3,
    },
    {
      date: "2024-01-15",
      time: "16:00",
      event: "ECB Interest Rate Decision",
      country: "EUR",
      countryFlag: "🇪🇺",
      forecast: "4.25%",
      previous: "4.25%",
      actual: "-",
      importance: 3,
    },
    {
      date: "2024-01-16",
      time: "12:00",
      event: "GDP Growth Rate (QoQ)",
      country: "GBP",
      countryFlag: "🇬🇧",
      forecast: "0.3%",
      previous: "0.2%",
      actual: "-",
      importance: 2,
    },
    {
      date: "2024-01-16",
      time: "13:15",
      event: "ZEW Economic Sentiment",
      country: "EUR",
      countryFlag: "🇩🇪",
      forecast: "95.2",
      previous: "94.8",
      actual: "-",
      importance: 1,
    },
    {
      date: "2024-01-17",
      time: "08:30",
      event: "Employment Change",
      country: "AUD",
      countryFlag: "🇦🇺",
      forecast: "15.2K",
      previous: "12.8K",
      actual: "-",
      importance: 2,
    },
    {
      date: "2024-01-17",
      time: "15:00",
      event: "Federal Reserve Speech",
      country: "USD",
      countryFlag: "🇺🇸",
      forecast: "-",
      previous: "-",
      actual: "-",
      importance: 2,
    },
  ];

  const renderImportance = (level: number) => {
    const stars = [];
    for (let i = 1; i <= 3; i++) {
      stars.push(
        <Star
          key={i}
          className={`w-4 h-4 ${
            i <= level
              ? level === 3
                ? "fill-red-500 text-red-500"
                : level === 2
                  ? "fill-orange-500 text-orange-500"
                  : "fill-yellow-500 text-yellow-500"
              : "text-muted-foreground"
          }`}
        />,
      );
    }
    return <div className="flex gap-1">{stars}</div>;
  };

  const getImportanceColor = (level: number) => {
    switch (level) {
      case 3:
        return "destructive";
      case 2:
        return "default";
      case 1:
        return "secondary";
      default:
        return "secondary";
    }
  };

  const filteredEvents = economicEvents.filter((event) => {
    if (
      selectedCountry &&
      selectedCountry !== "all" &&
      event.country !== selectedCountry
    )
      return false;
    if (
      selectedImportance &&
      selectedImportance !== "all" &&
      event.importance.toString() !== selectedImportance
    )
      return false;
    if (
      searchEvent &&
      !event.event.toLowerCase().includes(searchEvent.toLowerCase())
    )
      return false;
    return true;
  });

  return (
    <div
      className={`min-h-screen bg-background relative ${language === "ar" ? "arabic" : "english"}`}
    >
      {/* Global Background Image */}
      <div className="fixed inset-0 z-0">
        <img
          src="https://cdn.builder.io/api/v1/image/assets%2F165a7c0d273f4448b5890b3ec14b12af%2F87665f5fec764be4b49626e43b10972a?format=webp&width=800"
          alt="Liirat Global Background"
          className="w-full h-full object-cover opacity-[0.02]"
        />
      </div>

      {/* All content with relative positioning */}
      <div className="relative z-10">
        <main role="main">
        {/* Navigation Header */}
        <header className="border-b border-border/40 backdrop-blur-md bg-background/95 sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-4 space-x-reverse">
              <img
                src="/liirat-logo.png"
                alt="Liirat News"
                className="h-14 w-auto cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                role="button"
                tabIndex={0}
                aria-label="Go to top of page"
              />
            </div>

            <nav
              className={`hidden md:flex items-center space-x-6 ${dir === "rtl" ? "space-x-reverse" : ""}`}
              role="navigation"
              aria-label="Main navigation"
            >
              <a
                href="/ai-trading"
                className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground px-4 py-2 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 flex items-center gap-2"
              >
                <Bot className="h-4 w-4" />
                AI Trading
              </a>
              <a
                href="#calendar"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                {t("nav.calendar")}
              </a>
              <a
                href="#alerts"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                {t("nav.alerts")}
              </a>
              <a
                href="#about"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                {t("nav.about")}
              </a>
              <a
                href="#contact"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                {t("nav.contact")}
              </a>
            </nav>

            <div className="flex items-center space-x-2 space-x-reverse">
              {/* Notification Dropdown */}
              <NotificationDropdown
                onSettingsClick={() => setShowAlertSettings(true)}
              />

              <SimpleLanguageToggle />
              <ThemeToggle />
            </div>
          </div>
        </header>

        {/* Real-Time Market Ticker */}
        <PriceTicker
          className="sticky top-[72px] z-40"
          pauseOnHover={true}
          speed={60}
        />

        {/* Hero Section */}
        <section className="py-20 lg:py-32 relative overflow-hidden">
          {/* Official Logo Background Pattern */}
          <div className="absolute inset-0">
            <div className="w-full h-full bg-gradient-to-br from-primary/5 via-background to-primary/10"></div>
            <div className="absolute inset-0 bg-[url('/liirat-logo.png')] bg-center bg-no-repeat bg-contain opacity-[0.03]"></div>
          </div>
          <div className="absolute inset-0 bg-gradient-to-br from-background/95 via-background/90 to-primary/5"></div>
          <div className="container mx-auto px-4 relative">
            <div className="text-center max-w-4xl mx-auto">
              <div className="backdrop-blur-sm bg-card/80 border border-primary/20 rounded-3xl p-12 mb-8 shadow-2xl">
                <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight text-foreground">
                  {t("hero.title")}
                  <span className="text-primary block">{t("hero.subtitle")}</span>
                </h1>
                <p className="text-xl md:text-2xl text-muted-foreground mb-8 leading-relaxed">
                  {t("hero.description")}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-6 justify-center">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground px-10 py-6 text-xl font-bold shadow-2xl hover:shadow-3xl transition-all duration-300 flex items-center gap-3 rounded-2xl"
                  onClick={() => window.location.href = '/ai-trading'}
                  aria-label="Launch AI Trading Assistant - Navigate to AI trading tools"
                >
                  <Bot className="h-6 w-6" aria-hidden="true" />
                  Launch AI Trading Assistant
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="border-primary/50 text-primary hover:bg-primary/10 hover:border-primary px-8 py-6 text-lg font-semibold rounded-2xl"
                  onClick={() =>
                    document
                      .getElementById("calendar")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                  aria-label="Navigate to economic calendar section"
                >
                  {t("hero.btn.calendar")}
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="border-primary/50 text-primary hover:bg-primary/10 hover:border-primary px-8 py-6 text-lg font-semibold rounded-2xl"
                  onClick={() =>
                    document
                      .getElementById("alerts")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                  aria-label="Navigate to alerts setup section"
                >
                  {t("hero.btn.alerts")}
                </Button>
              </div>
            </div>
          </div>
        </section>



        {/* Enhanced Economic Calendar Section */}
        <section id="calendar" className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                {t("calendar.title")}
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                {t("calendar.description")}
              </p>
            </div>

            <div className="max-w-7xl mx-auto">
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Filter className="w-5 h-5 text-primary" />
                    {t("calendar.filters.title")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Filters Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    {/* Date Picker */}
                    <div className="space-y-2">
                      <Label
                        className={`block ${dir === "rtl" ? "text-right" : "text-left"}`}
                      >
                        {t("calendar.filters.date")}
                      </Label>
                      <CustomDatePicker
                        value={selectedDate}
                        onValueChange={setSelectedDate}
                      />
                    </div>

                    {/* Country/Currency Selector */}
                    <div className="space-y-2">
                      <Label
                        className={`block ${dir === "rtl" ? "text-right" : "text-left"}`}
                      >
                        {t("calendar.filters.currency")}
                      </Label>
                      <Select
                        value={selectedCountry}
                        onValueChange={setSelectedCountry}
                      >
                        <SelectTrigger
                          className={dir === "rtl" ? "text-right" : "text-left"}
                        >
                          <SelectValue
                            placeholder={t("calendar.select.currency")}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">
                            {t("currency.all")}
                          </SelectItem>
                          <SelectItem value="USD">
                            {t("currency.usd")}
                          </SelectItem>
                          <SelectItem value="EUR">
                            {t("currency.eur")}
                          </SelectItem>
                          <SelectItem value="GBP">
                            {t("currency.gbp")}
                          </SelectItem>
                          <SelectItem value="JPY">
                            {t("currency.jpy")}
                          </SelectItem>
                          <SelectItem value="AUD">
                            {t("currency.aud")}
                          </SelectItem>
                          <SelectItem value="CAD">
                            {t("currency.cad")}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Importance Filter */}
                    <div className="space-y-2">
                      <Label
                        className={`block ${dir === "rtl" ? "text-right" : "text-left"}`}
                      >
                        {t("calendar.filters.importance")}
                      </Label>
                      <Select
                        value={selectedImportance}
                        onValueChange={setSelectedImportance}
                      >
                        <SelectTrigger
                          className={dir === "rtl" ? "text-right" : "text-left"}
                        >
                          <SelectValue
                            placeholder={t("calendar.select.importance")}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">
                            {t("importance.all")}
                          </SelectItem>
                          <SelectItem value="3">
                            {t("importance.high")}
                          </SelectItem>
                          <SelectItem value="2">
                            {t("importance.medium")}
                          </SelectItem>
                          <SelectItem value="1">
                            {t("importance.low")}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Search by Event Name */}
                    <div className="space-y-2">
                      <Label
                        className={`block ${dir === "rtl" ? "text-right" : "text-left"}`}
                      >
                        {t("calendar.filters.search")}
                      </Label>
                      <div className="relative">
                        <Search
                          className={`absolute ${dir === "rtl" ? "right-3" : "left-3"} top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4`}
                        />
                        <Input
                          type="text"
                          value={searchEvent}
                          onChange={(e) => setSearchEvent(e.target.value)}
                          className={`${dir === "rtl" ? "text-right pr-10" : "text-left pl-10"}`}
                          placeholder={t("calendar.filters.search.placeholder")}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Economic Events Table */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-primary" />
                      {language === "ar"
                        ? "الأحداث الاقتصادية"
                        : "Economic Events"}{" "}
                      ({filteredEvents.length})
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {t("calendar.live.badge")}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow
                          className={dir === "rtl" ? "text-right" : "text-left"}
                        >
                          <TableHead
                            className={
                              dir === "rtl" ? "text-right" : "text-left"
                            }
                          >
                            {t("calendar.table.datetime")}
                          </TableHead>
                          <TableHead
                            className={
                              dir === "rtl" ? "text-right" : "text-left"
                            }
                          >
                            {t("calendar.table.country")}
                          </TableHead>
                          <TableHead
                            className={
                              dir === "rtl" ? "text-right" : "text-left"
                            }
                          >
                            {t("calendar.table.importance")}
                          </TableHead>
                          <TableHead
                            className={
                              dir === "rtl" ? "text-right" : "text-left"
                            }
                          >
                            {t("calendar.table.event")}
                          </TableHead>
                          <TableHead
                            className={
                              dir === "rtl" ? "text-right" : "text-left"
                            }
                          >
                            {t("calendar.table.actual")}
                          </TableHead>
                          <TableHead
                            className={
                              dir === "rtl" ? "text-right" : "text-left"
                            }
                          >
                            {t("calendar.table.forecast")}
                          </TableHead>
                          <TableHead
                            className={
                              dir === "rtl" ? "text-right" : "text-left"
                            }
                          >
                            {t("calendar.table.previous")}
                          </TableHead>
                          <TableHead
                            className={
                              dir === "rtl" ? "text-right" : "text-left"
                            }
                          >
                            {t("calendar.table.analysis")}
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredEvents.map((event, index) => (
                          <TableRow key={index} className="hover:bg-muted/50">
                            <TableCell className="text-right">
                              <div className="font-medium">{event.date}</div>
                              <div className="text-sm text-muted-foreground">
                                {event.time} GMT
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex items-center justify-center gap-2">
                                <span className="text-2xl">
                                  {event.countryFlag}
                                </span>
                                <span className="font-mono font-bold">
                                  {event.country}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              {renderImportance(event.importance)}
                            </TableCell>
                            <TableCell className="text-right english">
                              <div className="font-medium">{event.event}</div>
                            </TableCell>
                            <TableCell className="text-right font-mono font-bold">
                              {event.actual === "-" ? (
                                <span className="text-muted-foreground">
                                  {t("calendar.upcoming")}
                                </span>
                              ) : (
                                <span
                                  className={
                                    event.actual === event.forecast
                                      ? "text-green-600"
                                      : "text-red-600"
                                  }
                                >
                                  {event.actual}
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {event.forecast}
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {event.previous}
                            </TableCell>
                            <TableCell className="text-right">
                              <AIEventInsight event={event} />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="mt-4 text-center">
                    <p className="text-sm text-muted-foreground">
                      {t("ai.supported")}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Market Overview Section */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                {t("market.title")}
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                {t("market.description")}
              </p>
            </div>

            <div className="max-w-6xl mx-auto">
              <Card className="overflow-hidden">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    Live Market Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="h-[500px] w-full">
                    <iframe 
                      src={`https://s.tradingview.com/embed-widget/market-overview/?locale=en#%7B%22colorTheme%22%3A%22${theme}%22%2C%22dateRange%22%3A%2212M%22%2C%22showChart%22%3Atrue%2C%22largeChartUrl%22%3A%22%22%2C%22isTransparent%22%3A${theme === 'dark' ? 'true' : 'false'}%2C%22showSymbolLogo%22%3Atrue%2C%22showFloatingTooltip%22%3Afalse%2C%22width%22%3A%22100%25%22%2C%22height%22%3A%22500%22%2C%22plotLineColorGrowing%22%3A%22hsl(85%2C%2070%25%2C%2050%25)%22%2C%22plotLineColorFalling%22%3A%22rgba(239%2C%2083%2C%2080%2C%201)%22%2C%22gridLineColor%22%3A%22rgba(240%2C%20243%2C%20250%2C%200.06)%22%2C%22scaleFontColor%22%3A%22rgba(209%2C%20212%2C%20220%2C%201)%22%2C%22belowLineFillColorGrowing%22%3A%22rgba(41%2C%2098%2C%20255%2C%200.12)%22%2C%22belowLineFillColorFalling%22%3A%22rgba(239%2C%2083%2C%2080%2C%200.12)%22%2C%22belowLineFillColorGrowingBottom%22%3A%22rgba(41%2C%2098%2C%20255%2C%200)%22%2C%22belowLineFillColorFallingBottom%22%3A%22rgba(239%2C%2083%2C%2080%2C%200)%22%2C%22symbolActiveColor%22%3A%22rgba(41%2C%2098%2C%20255%2C%200.12)%22%2C%22tabs%22%3A%5B%7B%22title%22%3A%22Indices%22%2C%22symbols%22%3A%5B%7B%22s%22%3A%22FOREXCOM%3ASPX500%22%2C%22d%22%3A%22S%26P%20500%22%7D%2C%7B%22s%22%3A%22FOREXCOM%3ANSXUSD%22%2C%22d%22%3A%22US%20100%22%7D%2C%7B%22s%22%3A%22FOREXCOM%3ADJI%22%2C%22d%22%3A%22Dow%2030%22%7D%2C%7B%22s%22%3A%22INDEX%3ANKY%22%2C%22d%22%3A%22Nikkei%20225%22%7D%2C%7B%22s%22%3A%22INDEX%3ADEU40%22%2C%22d%22%3A%22DAX%20Index%22%7D%2C%7B%22s%22%3A%22FOREXCOM%3AUKXGBP%22%2C%22d%22%3A%22UK%20100%22%7D%5D%2C%22originalTitle%22%3A%22Indices%22%7D%2C%7B%22title%22%3A%22Futures%22%2C%22symbols%22%3A%5B%7B%22s%22%3A%22CME_MINI%3AES1!%22%2C%22d%22%3A%22S%26P%20500%22%7D%2C%7B%22s%22%3A%22CME%3A6E1!%22%2C%22d%22%3A%22Euro%22%7D%2C%7B%22s%22%3A%22COMEX%3AGC1!%22%2C%22d%22%3A%22Gold%22%7D%2C%7B%22s%22%3A%22NYMEX%3ACL1!%22%2C%22d%22%3A%22WTI%20Crude%20Oil%22%7D%2C%7B%22s%22%3A%22NYMEX%3ANG1!%22%2C%22d%22%3A%22Gas%22%7D%2C%7B%22s%22%3A%22CBOT%3AZC1!%22%2C%22d%22%3A%22Corn%22%7D%5D%2C%22originalTitle%22%3A%22Futures%22%7D%2C%7B%22title%22%3A%22Bonds%22%2C%22symbols%22%3A%5B%7B%22s%22%3A%22CBOT%3AZB1!%22%2C%22d%22%3A%22T-Bond%22%7D%2C%7B%22s%22%3A%22CBOT%3AUB1!%22%2C%22d%22%3A%22Ultra%20T-Bond%22%7D%2C%7B%22s%22%3A%22EUREX%3AFGBL1!%22%2C%22d%22%3A%22Euro%20Bund%22%7D%2C%7B%22s%22%3A%22EUREX%3AFBTP1!%22%2C%22d%22%3A%22Euro%20BTP%22%7D%2C%7B%22s%22%3A%22EUREX%3AFGBM1!%22%2C%22d%22%3A%22Euro%20BOBL%22%7D%5D%2C%22originalTitle%22%3A%22Bonds%22%7D%2C%7B%22title%22%3A%22Forex%22%2C%22symbols%22%3A%5B%7B%22s%22%3A%22FX%3AEURUSD%22%2C%22d%22%3A%22EUR%20to%20USD%22%7D%2C%7B%22s%22%3A%22FX%3AGBPUSD%22%2C%22d%22%3A%22GBP%20to%20USD%22%7D%2C%7B%22s%22%3A%22FX%3AUSDJPY%22%2C%22d%22%3A%22USD%20to%20JPY%22%7D%2C%7B%22s%22%3A%22FX%3AUSDCHF%22%2C%22d%22%3A%22USD%20to%20CHF%22%7D%2C%7B%22s%22%3A%22FX%3AAUDUSD%22%2C%22d%22%3A%22AUD%20to%20USD%22%7D%2C%7B%22s%22%3A%22FX%3AUSDCAD%22%2C%22d%22%3A%22USD%20to%20CAD%22%7D%5D%2C%22originalTitle%22%3A%22Forex%22%7D%5D%2C%22utm_source%22%3A%22liirat.com%22%2C%22utm_medium%22%3A%22widget_new%22%2C%22utm_campaign%22%3A%22market-overview%22%7D`}
                      style={{ 
                        width: '100%', 
                        height: '100%', 
                        border: 'none',
                        backgroundColor: theme === 'dark' ? 'transparent' : '#ffffff'
                      }}
                      frameBorder="0"
                      allowTransparency={theme === 'dark'}
                      scrolling="no"
                      allowFullScreen
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Alert System Section */}
        <section id="alerts" className="py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  {t("alerts.title")}
                </h2>
                <p className="text-xl text-muted-foreground">
                  {t("alerts.description")}
                </p>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="w-5 h-5 text-primary" />
                    {t("alerts.setup.title")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>{t("alerts.select.pair")}</Label>
                        <Select
                          value={selectedPair}
                          onValueChange={setSelectedPair}
                        >
                          <SelectTrigger
                            className={
                              dir === "rtl" ? "text-right" : "text-left"
                            }
                          >
                            <SelectValue
                              placeholder={t("alerts.select.placeholder")}
                            />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="eurusd">
                              {t("alert.pairs.eurusd")}
                            </SelectItem>
                            <SelectItem value="gbpusd">
                              {t("alert.pairs.gbpusd")}
                            </SelectItem>
                            <SelectItem value="usdjpy">
                              {t("alert.pairs.usdjpy")}
                            </SelectItem>
                            <SelectItem value="usdcad">
                              {t("alert.pairs.usdcad")}
                            </SelectItem>
                            <SelectItem value="audusd">
                              {t("alert.pairs.audusd")}
                            </SelectItem>
                            <SelectItem value="nfp">
                              {t("alert.pairs.nfp")}
                            </SelectItem>
                            <SelectItem value="cpi">
                              {t("alert.pairs.cpi")}
                            </SelectItem>
                            <SelectItem value="gdp">
                              {t("alert.pairs.gdp")}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <Button
                        onClick={handleAlertSubmit}
                        className="w-full"
                        disabled={!selectedPair}
                      >
                        {t("alerts.btn.submit")}
                      </Button>

                      <p className="text-sm text-muted-foreground text-center">
                        {t("alerts.info")}
                      </p>
                    </div>

                    <div className="bg-muted/50 rounded-lg p-4">
                      <h4 className="font-semibold mb-3">
                        {t("alerts.types.title")}
                      </h4>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                          {t("alerts.types.high")}
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                          {t("alerts.types.central")}
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          {t("alerts.types.unexpected")}
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          {t("alerts.types.rates")}
                        </li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Notification Status */}
              <div className="mt-8 text-center">
                <Card className="bg-muted/30 border-dashed">
                  <CardContent className="py-8">
                    <BellRing className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      {t("alerts.status")}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* About Liirat Section */}
        <section id="about" className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                {t("about.title")}
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                {t("about.description")}
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-bold text-lg mb-2">
                  {t("about.realtime.title")}
                </h3>
                <p className="text-muted-foreground">
                  {t("about.realtime.desc")}
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-bold text-lg mb-2">
                  {t("about.analysis.title")}
                </h3>
                <p className="text-muted-foreground">
                  {t("about.analysis.desc")}
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-bold text-lg mb-2">
                  {t("about.sources.title")}
                </h3>
                <p className="text-muted-foreground">
                  {t("about.sources.desc")}
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Globe className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-bold text-lg mb-2">
                  {t("about.coverage.title")}
                </h3>
                <p className="text-muted-foreground">
                  {t("about.coverage.desc")}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                {t("contact.title")}
              </h2>
              <p className="text-xl text-muted-foreground mb-8">
                {t("contact.description")}
              </p>

              <Card className="text-right">
                <CardContent className="p-8">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <Label
                        htmlFor="name"
                        className={`block ${dir === "rtl" ? "text-right" : "text-left"}`}
                      >
                        {t("contact.form.name")}
                      </Label>
                      <Input
                        id="name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className={dir === "rtl" ? "text-right" : "text-left"}
                        placeholder={t("contact.form.name.placeholder")}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="email"
                        className={`block ${dir === "rtl" ? "text-right" : "text-left"}`}
                      >
                        {t("contact.form.email")}
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className={dir === "rtl" ? "text-right" : "text-left"}
                        placeholder={t("contact.form.email.placeholder")}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="whatsapp"
                        className={`block ${dir === "rtl" ? "text-right" : "text-left"}`}
                      >
                        {t("contact.form.whatsapp")}
                      </Label>
                      <Input
                        id="whatsapp"
                        type="tel"
                        value={whatsapp}
                        onChange={(e) => setWhatsapp(e.target.value)}
                        className={dir === "rtl" ? "text-right" : "text-left"}
                        placeholder={t("contact.form.whatsapp.placeholder")}
                      />
                    </div>

                    <Button
                      type="submit"
                      size="lg"
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-4 text-lg font-semibold"
                    >
                      {t("contact.form.submit")}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-muted/50 border-t border-border py-12">
          <div className="container mx-auto px-4">
            <div className="text-center">
              <img
                src="/liirat-logo.png"
                alt="Liirat News"
                className="h-8 w-auto mx-auto mb-4"
              />
              <p className="text-muted-foreground mb-4">
                {t("footer.description")}
              </p>
              <div className="flex justify-center space-x-6 space-x-reverse text-sm text-muted-foreground">
                <a href="#" className="hover:text-primary transition-colors">
                  {t("footer.privacy")}
                </a>
                <a href="#" className="hover:text-primary transition-colors">
                  {t("footer.terms")}
                </a>
                <a href="#" className="hover:text-primary transition-colors">
                  {t("footer.contact")}
                </a>
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                {t("footer.copyright")}
              </p>
            </div>
          </div>
        </footer>
        </main>

        {/* Alert Settings Modal */}
        <AlertSettingsModal
          open={showAlertSettings}
          onOpenChange={setShowAlertSettings}
        />
        
        {/* Neumorphic CSS Styles */}
        <style>{`
          .neumorphic-nav-button {
            border-radius: 12px;
            box-shadow: 
              5px 5px 10px #bebebe,
              -5px -5px 10px #ffffff;
            transition: all 0.3s ease;
          }
          
          .neumorphic-nav-button:hover {
            transform: translateY(-2px);
            box-shadow: 
              8px 8px 16px #bebebe,
              -8px -8px 16px #ffffff;
          }
          
          .neumorphic-hero-card {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 30px;
            box-shadow: 
              20px 20px 60px rgba(0, 0, 0, 0.3),
              -20px -20px 60px rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            backdrop-filter: blur(10px);
          }
          
          .neumorphic-hero-button {
            border-radius: 20px;
            box-shadow: 
              10px 10px 20px rgba(0, 0, 0, 0.3),
              -10px -10px 20px rgba(255, 255, 255, 0.1);
            transition: all 0.3s ease;
          }
          
          .neumorphic-hero-button:hover {
            transform: translateY(-3px);
            box-shadow: 
              15px 15px 30px rgba(0, 0, 0, 0.3),
              -15px -15px 30px rgba(255, 255, 255, 0.1);
          }
          
          .neumorphic-hero-button-secondary {
            border-radius: 20px;
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            color: white;
            box-shadow: 
              8px 8px 16px rgba(0, 0, 0, 0.3),
              -8px -8px 16px rgba(255, 255, 255, 0.1);
            transition: all 0.3s ease;
          }
          
          .neumorphic-hero-button-secondary:hover {
            transform: translateY(-2px);
            background: rgba(255, 255, 255, 0.2);
            box-shadow: 
              12px 12px 24px rgba(0, 0, 0, 0.3),
              -12px -12px 24px rgba(255, 255, 255, 0.1);
          }
        `}</style>
      </div>
    </div>
  );
}
