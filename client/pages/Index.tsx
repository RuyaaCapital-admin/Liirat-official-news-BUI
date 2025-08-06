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

import TradingViewTicker from "@/components/ui/trading-view-ticker";
import { AIEventInsight } from "@/components/ui/ai-event-insight";
import { ChatWidget } from "@/components/ui/chat-widget";
import { MacroCalendarTable } from "@/components/ui/macro-calendar-table";
import { NewsCardsList } from "@/components/ui/news-cards-list";
import { EconomicEventsResponse, NewsResponse } from "@shared/api";
import { AdvancedAlertSystem } from "@/components/ui/advanced-alert-system";

import { SimpleLanguageToggle } from "@/components/ui/simple-language-toggle";
import { NotificationDropdown } from "@/components/ui/notification-dropdown";
import { AlertSettingsModal } from "@/components/ui/alert-settings-modal";

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
  Bot,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useTheme } from "@/hooks/use-theme";
import { NewLiquidToggle } from "@/components/ui/new-liquid-toggle";

export default function Index() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");

  // EODHD Data State
  const [economicEvents, setEconomicEvents] = useState<
    EconomicEventsResponse["events"]
  >([]);
  const [news, setNews] = useState<NewsResponse["news"]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [isLoadingNews, setIsLoadingNews] = useState(true);

  const [showAlertSettings, setShowAlertSettings] = useState(false);
  const { theme } = useTheme();
  const { language, t, dir } = useLanguage();
  const { checkEventAlerts } = useAlerts();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Connect to Supabase
    console.log("Form submitted:", { name, email, whatsapp });
  };

  // Fetch EODHD data with enhanced error handling and fallback
  useEffect(() => {
    const fetchEconomicEvents = async () => {
      try {
        setIsLoadingEvents(true);
        // Add timeout to prevent hanging
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

        const response = await fetch("/api/economic-events", {
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (response.ok) {
          // Check if response is JSON before parsing
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const data: EconomicEventsResponse = await response.json();
            setEconomicEvents(data.events || []);
          } else {
            console.warn(
              "Economic events API returned non-JSON content:",
              contentType,
            );
            setEconomicEvents([]);
          }
        } else {
          console.warn(
            "Economic events API returned non-OK status:",
            response.status,
          );
          setEconomicEvents([]); // Set empty array on failure
        }
      } catch (error) {
        console.error("Failed to fetch economic events:", error);
        setEconomicEvents([]); // Always set fallback data
      } finally {
        setIsLoadingEvents(false);
      }
    };

    const fetchNews = async () => {
      try {
        setIsLoadingNews(true);
        // Add timeout to prevent hanging
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

        const response = await fetch("/api/news", {
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (response.ok) {
          // Check if response is JSON before parsing
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const data: NewsResponse = await response.json();
            setNews(data.news || []);
          } else {
            console.warn("News API returned non-JSON content:", contentType);
            setNews([]);
          }
        } else {
          console.warn("News API returned non-OK status:", response.status);
          setNews([]); // Set empty array on failure
        }
      } catch (error) {
        console.error("Failed to fetch news:", error);
        setNews([]); // Always set fallback data
      } finally {
        setIsLoadingNews(false);
      }
    };

    fetchEconomicEvents();
    fetchNews();
  }, []);

  // Enhanced economic calendar data with mixed language support

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
          <header className="border-b border-border/40 backdrop-blur-md bg-background/95 sticky top-0 z-[60]">
            <div className="container mx-auto px-4 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-4 space-x-reverse">
                <img
                  src="/liirat-logo.png"
                  alt="Liirat News"
                  className="h-14 w-auto cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() =>
                    window.scrollTo({ top: 0, behavior: "smooth" })
                  }
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
                <SimpleLanguageToggle />
                <NewLiquidToggle />
              </div>
            </div>
          </header>

          {/* Real-Time Market Ticker */}
          <TradingViewTicker className="sticky top-[72px] z-[30]" />

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
                    <span className="text-primary block">
                      {t("hero.subtitle")}
                    </span>
                  </h1>
                  <p className="text-xl md:text-2xl text-muted-foreground mb-8 leading-relaxed">
                    {t("hero.description")}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-6 justify-center">
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

          {/* EODHD Economic Calendar Section */}
          <section id="calendar" className="py-20 bg-muted/30">
            <div className="container mx-auto px-4">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  {t("calendar.title")}
                </h2>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                  {language === "ar"
                    ? "تابع الأحداث الاقتصادية المهمة والأخبار المالية في الوقت الفعلي"
                    : "Track important economic events and real-time financial news"}
                </p>
              </div>

              {/* Economic Events Table */}
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary" />
                    {language === "ar"
                      ? "التقويم الاقتصادي"
                      : "Economic Calendar"}
                  </CardTitle>
                  <CardDescription>
                    {language === "ar"
                      ? "أحداث اقتصادية مهمة ومؤشرات مالية رئيسية"
                      : "Important economic events and key financial indicators"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingEvents ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      <span className="ml-2">Loading economic events...</span>
                    </div>
                  ) : (
                    <MacroCalendarTable
                      events={economicEvents}
                      className="rounded-lg overflow-hidden"
                      language={language}
                      dir={dir}
                    />
                  )}
                </CardContent>
              </Card>

              {/* News Cards */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    {language === "ar" ? "الأخبار المالية" : "Financial News"}
                  </CardTitle>
                  <CardDescription>
                    {language === "ar"
                      ? "آخر الأخبار والتحليلات المالية"
                      : "Latest financial news and market analysis"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingNews ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      <span className="ml-2">Loading news...</span>
                    </div>
                  ) : (
                    <NewsCardsList
                      news={news}
                      className="max-h-[600px] overflow-y-auto"
                    />
                  )}
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Market Overview Section */}
          <section className="py-20 bg-muted/30 hidden">
            <div className="container mx-auto px-4">
              <div className="text-center mb-16">
                {/* <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  {t("market.title")}
                </h2> */}
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
                      {/* Commented out TradingView widget as requested */}
                      {/* <iframe
                        src={`https://s.tradingview.com/embed-widget/market-overview/?locale=en#%7B%22colorTheme%22%3A%22${theme}%22%2C%22dateRange%22%3A%2212M%22%2C%22showChart%22%3Atrue%2C%22largeChartUrl%22%3A%22%22%2C%22isTransparent%22%3A${theme === "dark" ? "true" : "false"}%2C%22showSymbolLogo%22%3Atrue%2C%22showFloatingTooltip%22%3Afalse%2C%22width%22%3A%22100%25%22%2C%22height%22%3A%22500%22%2C%22plotLineColorGrowing%22%3A%22hsl(85%2C%2070%25%2C%2050%25)%22%2C%22plotLineColorFalling%22%3A%22rgba(239%2C%2083%2C%2080%2C%201)%22%2C%22gridLineColor%22%3A%22rgba(240%2C%20243%2C%20250%2C%200.06)%22%2C%22scaleFontColor%22%3A%22rgba(209%2C%20212%2C%20220%2C%201)%22%2C%22belowLineFillColorGrowing%22%3A%22rgba(41%2C%2098%2C%20255%2C%200.12)%22%2C%22belowLineFillColorFalling%22%3A%22rgba(239%2C%2083%2C%2080%2C%200.12)%22%2C%22belowLineFillColorGrowingBottom%22%3A%22rgba(41%2C%2098%2C%20255%2C%200)%22%2C%22belowLineFillColorFallingBottom%22%3A%22rgba(239%2C%2083%2C%2080%2C%200)%22%2C%22symbolActiveColor%22%3A%22rgba(41%2C%2098%2C%20255%2C%200.12)%22%2C%22tabs%22%3A%5B%7B%22title%22%3A%22Indices%22%2C%22symbols%22%3A%5B%7B%22s%22%3A%22FOREXCOM%3ASPX500%22%2C%22d%22%3A%22S%26P%20500%22%7D%2C%7B%22s%22%3A%22FOREXCOM%3ANSXUSD%22%2C%22d%22%3A%22US%20100%22%7D%2C%7B%22s%22%3A%22FOREXCOM%3ADJI%22%2C%22d%22%3A%22Dow%2030%22%7D%2C%7B%22s%22%3A%22INDEX%3ANKY%22%2C%22d%22%3A%22Nikkei%20225%22%7D%2C%7B%22s%22%3A%22INDEX%3ADEU40%22%2C%22d%22%3A%22DAX%20Index%22%7D%2C%7B%22s%22%3A%22FOREXCOM%3AUKXGBP%22%2C%22d%22%3A%22UK%20100%22%7D%5D%2C%22originalTitle%22%3A%22Indices%22%7D%2C%7B%22title%22%3A%22Futures%22%2C%22symbols%22%3A%5B%7B%22s%22%3A%22CME_MINI%3AES1!%22%2C%22d%22%3A%22S%26P%20500%22%7D%2C%7B%22s%22%3A%22CME%3A6E1!%22%2C%22d%22%3A%22Euro%22%7D%2C%7B%22s%22%3A%22COMEX%3AGC1!%22%2C%22d%22%3A%22Gold%22%7D%2C%7B%22s%22%3A%22NYMEX%3ACL1!%22%2C%22d%22%3A%22WTI%20Crude%20Oil%22%7D%2C%7B%22s%22%3A%22NYMEX%3ANG1!%22%2C%22d%22%3A%22Gas%22%7D%2C%7B%22s%22%3A%22CBOT%3AZC1!%22%2C%22d%22%3A%22Corn%22%7D%5D%2C%22originalTitle%22%3A%22Futures%22%7D%2C%7B%22title%22%3A%22Bonds%22%2C%22symbols%22%3A%5B%7B%22s%22%3A%22CBOT%3AZB1!%22%2C%22d%22%3A%22T-Bond%22%7D%2C%7B%22s%22%3A%22CBOT%3AUB1!%22%2C%22d%22%3A%22Ultra%20T-Bond%22%7D%2C%7B%22s%22%3A%22EUREX%3AFGBL1!%22%2C%22d%22%3A%22Euro%20Bund%22%7D%2C%7B%22s%22%3A%22EUREX%3AFBTP1!%22%2C%22d%22%3A%22Euro%20BTP%22%7D%2C%7B%22s%22%3A%22EUREX%3AFGBM1!%22%2C%22d%22%3A%22Euro%20BOBL%22%7D%5D%2C%22originalTitle%22%3A%22Bonds%22%7D%2C%7B%22title%22%3A%22Forex%22%2C%22symbols%22%3A%5B%7B%22s%22%3A%22FX%3AEURUSD%22%2C%22d%22%3A%22EUR%20to%20USD%22%7D%2C%7B%22s%22%3A%22FX%3AGBPUSD%22%2C%22d%22%3A%22GBP%20to%20USD%22%7D%2C%7B%22s%22%3A%22FX%3AUSDJPY%22%2C%22d%22%3A%22USD%20to%20JPY%22%7D%2C%7B%22s%22%3A%22FX%3AUSDCHF%22%2C%22d%22%3A%22USD%20to%20CHF%22%7D%2C%7B%22s%22%3A%22FX%3AAUDUSD%22%2C%22d%22%3A%22AUD%20to%20USD%22%7D%2C%7B%22s%22%3A%22FX%3AUSDCAD%22%2C%22d%22%3A%22USD%20to%20CAD%22%7D%5D%2C%22originalTitle%22%3A%22Forex%22%7D%5D%2C%22utm_source%22%3A%22liirat.com%22%2C%22utm_medium%22%3A%22widget_new%22%2C%22utm_campaign%22%3A%22market-overview%22%7D`}
                        style={{
                          width: "100%",
                          height: "100%",
                          border: "none",
                          backgroundColor:
                            theme === "dark" ? "transparent" : "#ffffff",
                        }}
                        frameBorder="0"
                        allowTransparency={theme === "dark"}
                        scrolling="no"
                        allowFullScreen
                      /> */}
                      {/* Market section removed completely */}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>

          {/* Advanced Alert System Section */}
          <section id="alerts" className="py-20">
            <div className="container mx-auto px-4">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  {language === "ar"
                    ? "نظام التنبيهات المتقدم"
                    : "Advanced Alert System"}
                </h2>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                  {language === "ar"
                    ? "قم بإنشاء تنبيهات ذكية لأزواج العملات مع مراقبة الأسعار في الوقت الفعلي"
                    : "Create intelligent alerts for currency pairs with real-time price monitoring"}
                </p>
              </div>
              <AdvancedAlertSystem />
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

        {/* Chat Widget */}
        <ChatWidget />

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
