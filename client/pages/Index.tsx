import React, { useEffect, useRef, useState } from "react";
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

import PriceTicker from "@/components/PriceTicker";
import { ChatWidget } from "@/components/ui/chat-widget";
import EnhancedMacroCalendar from "@/components/ui/enhanced-macro-calendar";
import RealtimeNewsTable from "@/components/ui/realtime-news-table";
import DynamicAlertSystem from "@/components/ui/dynamic-alert-system";
import { EconomicEvent } from "@shared/api";
import { NotificationSystem } from "@/components/ui/notification-system";
import { NotificationDropdown } from "@/components/ui/notification-dropdown";
import { SimpleLanguageToggle } from "@/components/ui/simple-language-toggle";
import { useLanguage } from "@/contexts/language-context";
import { translate } from "@/i18n";
import { useAlerts } from "@/contexts/alert-context";
import {
  fetchCalendar,
  adaptCal,
  sortCalendarByTime,
} from "@/lib/calendar";
import {
  Calendar,
  Bell,
  Clock,
  TrendingUp,
  Shield,
  Globe,
  Zap,
  BellRing,
  AlertTriangle,
  Newspaper,
} from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { NewLiquidToggle } from "@/components/ui/new-liquid-toggle";

export default function Index() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");

  // Economic Events Data State
  const [economicEvents, setEconomicEvents] = useState<EconomicEvent[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [eventsError, setEventsError] = useState<string | null>(null);
  const [isNavbarVisible, setIsNavbarVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  const abortRef = useRef<AbortController | null>(null);
  const reqIdRef = useRef(0);

  const { theme } = useTheme();
  const { language, t, dir } = useLanguage();
  const { addAlert } = useAlerts();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted:", { name, email, whatsapp });
  };

  // Handle navbar scroll behavior
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY < 10) setIsNavbarVisible(true);
      else if (currentScrollY < lastScrollY) setIsNavbarVisible(true);
      else if (currentScrollY > lastScrollY && currentScrollY > 100) setIsNavbarVisible(false);
      setLastScrollY(currentScrollY);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  // Helpers
  const filterImportance = (imp: any, activeImportance?: string) => {
    if (!activeImportance || activeImportance === "all") return true;
    const v = String(imp || "").toLowerCase();
    return (
      (activeImportance === "high" && v.includes("high")) ||
      (activeImportance === "medium" && v.includes("medium")) ||
      (activeImportance === "low" && v.includes("low"))
    );
  };
  const filterCategory = (event: string, activeCategory?: string) => {
    if (!activeCategory || activeCategory === "all") return true;
    return event?.toLowerCase().includes(activeCategory.toLowerCase());
  };

  // Fetch economic events data – guarded against aborts/races
  const fetchEconomicEvents = async (
    lang: string = language,
    filters?: { country?: string; importance?: string[]; from?: string; to?: string }
  ) => {
    // cancel any in-flight request
    abortRef.current?.abort("superseded");
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    const myReqId = ++reqIdRef.current;

    try {
      setIsLoadingEvents(true);
      setEventsError(null);

      const today = new Date();
      const to = new Date(today);
      to.setDate(to.getDate() + 7); // next 7 days
      const pad = (n: number) => String(n).padStart(2, "0");
      const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

      // NOTE: fetchCalendar may not accept a signal; that's fine.
      const raw = await fetchCalendar({
        from: filters?.from || fmt(today),
        to: filters?.to || fmt(to),
        countries: filters?.country || "",
        limit: 50,
        // @ts-ignore allow optional signal if implemented
        signal: ctrl.signal,
      } as any);

      if (reqIdRef.current !== myReqId) return; // superseded

      const rows = (Array.isArray(raw) ? raw : [])
        .map(adaptCal)
        .filter((r) => filterImportance(r.importance) && filterCategory(r.title));

      const sorted = sortCalendarByTime(rows);
      setEconomicEvents(sorted.slice(0, 6));
      setEventsError(null);
    } catch (error: any) {
      if (error?.name === "AbortError") {
        // ignore aborted fetches
        return;
      }

      console.error("Failed to fetch economic events:", error);
      let errorMessage: string;
      if (error instanceof Error) errorMessage = error.message;
      else errorMessage = lang === "ar" ? "خطأ غير معروف." : "Unknown error.";
      setEventsError(
        lang === "ar" ? `خطأ في الخدمة: ${errorMessage}` : `Service error: ${errorMessage}`
      );
      setEconomicEvents([]);
    } finally {
      if (reqIdRef.current === myReqId) {
        setIsLoadingEvents(false);
        abortRef.current = null;
      }
    }
  };

  // Initial fetch + cleanup on unmount
  useEffect(() => {
    fetchEconomicEvents(language);
    return () => abortRef.current?.abort("unmount");
  }, [language]);

  // Periodic refresh every 30 minutes
  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchEconomicEvents(language);
    }, 30 * 60 * 1000);
    return () => clearInterval(intervalId);
  }, [language]);

  return (
    <div
      className={`min-h-screen bg-background relative overflow-x-hidden w-full max-w-full ${language === "ar" ? "arabic" : "english"}`}
    >
      {/* Global Background Image */}
      <div className="fixed inset-0 z-0">
        <img
          src="https://cdn.builder.io/api/v1/image/assets%2F165a7c0d273f4448b5890b3ec14b12af%2F87665f5fec764be4b49626e43b10972a?format=webp&width=800"
          alt="Liirat Global Background"
          className="w-full h-full object-cover opacity-[0.02]"
        />
      </div>

      <div className="relative z-10">
        <main role="main">
          {/* Fixed Navigation Header */}
          <header
            className={`fixed left-1/2 transform -translate-x-1/2 z-50 transition-all duration-300 ease-in-out ${isNavbarVisible ? "top-2 sm:top-4" : "-top-20"} mx-1 sm:mx-2 max-w-[calc(100vw-0.5rem)] sm:max-w-[calc(100vw-1rem)]`}
          >
            <div className="neumorphic-card bg-background/95 backdrop-blur-md rounded-full px-2 sm:px-4 lg:px-6 py-1.5 sm:py-2 lg:py-3 flex items-center justify-between shadow-lg border border-border/50 w-full max-w-full">
              <div className="flex items-center">
                <img
                  src="/liirat-logo-new.png"
                  alt="Liirat News"
                  className="h-6 sm:h-8 w-auto cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                  role="button"
                  tabIndex={0}
                  aria-label="Go to top of page"
                />
              </div>

              <nav
                className={`hidden md:flex items-center space-x-1 ${dir === "rtl" ? "space-x-reverse" : ""}`}
                role="navigation"
                aria-label="Main navigation"
              >
                <a href="#calendar" className="flex items-center space-x-1 px-3 py-2 rounded-full text-xs font-medium text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all">
                  <Calendar className="w-3 h-3" />
                  <span>{t("nav.calendar")}</span>
                </a>
                <a href="#news" className="flex items-center space-x-1 px-3 py-2 rounded-full text-xs font-medium text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all">
                  <Newspaper className="w-3 h-3" />
                  <span>{translate("navNews", language, "News")}</span>
                </a>
                <a href="#alerts" className="flex items-center space-x-1 px-3 py-2 rounded-full text-xs font-medium text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all">
                  <Bell className="w-3 h-3" />
                  <span>{t("nav.alerts")}</span>
                </a>
                <a href="#about" className="flex items-center space-x-1 px-3 py-2 rounded-full text-xs font-medium text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all">
                  <Globe className="w-3 h-3" />
                  <span>{t("nav.about")}</span>
                </a>
                <a href="#contact" className="flex items-center space-x-1 px-3 py-2 rounded-full text-xs font-medium text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all">
                  <Zap className="w-3 h-3" />
                  <span>{t("nav.contact")}</span>
                </a>
              </nav>

              <div className="flex items-center space-x-0.5 sm:space-x-1">
                <NotificationDropdown className="h-6 w-6 sm:h-8 sm:w-8" />
                <SimpleLanguageToggle />
                <NewLiquidToggle />
              </div>
            </div>
          </header>

          {/* Market ticker */}
          <div className="pt-16 sm:pt-20">
            <PriceTicker />
          </div>

          {/* Hero */}
          <section className="pt-[calc(var(--nav-h)+4rem)] pb-12 sm:py-20 lg:py-32 relative overflow-hidden px-2 sm:px-0">
            <div className="absolute inset-0">
              <div className="w-full h-full bg-gradient-to-br from-primary/5 via-background to-primary/10"></div>
              <div className="absolute inset-0 bg-[url('/liirat-logo-new.png')] bg-center bg-no-repeat bg-contain opacity-[0.03]"></div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-br from-background/95 via-background/90 to-primary/5"></div>
            <div className="container mx-auto px-2 sm:px-4 lg:px-8 relative max-w-full">
              <div className="text-center max-w-4xl mx-auto">
                <div className="neumorphic-lg bg-card/90 rounded-3xl p-4 sm:p-8 lg:p-12 mb-8 mx-2 sm:mx-0">
                  <h1 className="text-xl sm:text-3xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 leading-tight text-foreground">
                    {t("hero.title")}
                    <span className="text-primary block">{t("hero.subtitle")}</span>
                  </h1>
                  <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-muted-foreground mb-6 sm:mb-8 leading-relaxed">
                    {t("hero.description")}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center">
                  <Button
                    variant="outline"
                    size="lg"
                    className="text-primary px-6 sm:px-8 py-4 sm:py-6 text-base sm:text-lg font-semibold neumorphic-hover"
                    onClick={() => document.getElementById("calendar")?.scrollIntoView({ behavior: "smooth" })}
                    aria-label="Navigate to economic calendar section"
                  >
                    {t("hero.btn.calendar")}
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="text-primary px-6 sm:px-8 py-4 sm:py-6 text-base sm:text-lg font-semibold neumorphic-hover"
                    onClick={() => document.getElementById("news")?.scrollIntoView({ behavior: "smooth" })}
                    aria-label="Navigate to news section"
                  >
                    {language === "ar" ? "الأخبار المباشرة" : "Live News"}
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="text-primary px-6 sm:px-8 py-4 sm:py-6 text-base sm:text-lg font-semibold neumorphic-hover"
                    onClick={() => document.getElementById("alerts")?.scrollIntoView({ behavior: "smooth" })}
                    aria-label="Navigate to alerts setup section"
                  >
                    {t("hero.btn.alerts")}
                  </Button>
                </div>
              </div>
            </div>
          </section>

          {/* Economic Calendar */}
          <section id="calendar" className="py-12 sm:py-20 bg-muted/30">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-full">
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

              <Card className="mb-8">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary" />
                    {language === "ar" ? "التقويم الاقتصادي المباشر" : "Live Economic Calendar"}
                  </CardTitle>
                  <CardDescription>
                    {language === "ar"
                      ? "الأحداث الاقتصادية المهمة والإعلانات المالية"
                      : "Important economic events and financial announcements"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingEvents ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary/20 border-t-primary"></div>
                      <span className="ml-2">
                        {language === "ar" ? "جاري تحميل التقويم الاقتصادي..." : "Loading economic calendar..."}
                      </span>
                    </div>
                  ) : (
                    <div>
                      {eventsError && (
                        <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                          <div className="flex items-center text-destructive text-sm">
                            <AlertTriangle className="w-4 h-4 mr-2" />
                            <span>
                              {language === "ar" ? "خطأ في تحميل التقويم الاقتصادي:" : "Error loading economic calendar:"}{" "}
                              {eventsError.replace("API Error:", "Error")}
                            </span>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => fetchEconomicEvents(language)}
                              className="text-xs"
                            >
                              {t("Retry", "إعادة المحاولة")}
                            </Button>
                            <div className="text-xs text-muted-foreground">
                              {language === "ar" ? "أو تواصل مع admin@ruyaacapital.com" : "or contact admin@ruyaacapital.com"}
                            </div>
                          </div>
                        </div>
                      )}
                      <div className="space-y-3">
                        {eventsError && economicEvents.length > 0 && (
                          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                            <div className="flex items-center text-yellow-800 dark:text-yellow-200 text-sm">
                              <Bell className="w-4 h-4 mr-2" />
                              <span>
                                {language === "ar"
                                  ? "عرض بيانات تجريبية - سيتم التحديث عند استعادة الاتصال"
                                  : "Data will update when connection is restored"}
                              </span>
                            </div>
                          </div>
                        )}
                        <EnhancedMacroCalendar
                          events={economicEvents}
                          className="rounded-lg overflow-hidden"
                          onRefresh={(filters) => fetchEconomicEvents(language, filters)}
                          onCreateAlert={(event) => {
                            const message =
                              language === "ar"
                                ? `تنبيه حدث اقتصادي: ${event.event} - ${event.country} - الوقت: ${event.time || "غير محدد"}`
                                : `Economic Event Alert: ${event.event} - ${event.country} - Time: ${event.time || "TBD"}`;

                            const eventName =
                              language === "ar" ? `حدث اقتصادي: ${event.event}` : `Economic Event: ${event.event}`;

                            addAlert({
                              eventName,
                              message,
                              importance: event.importance || 2,
                              eventData: { type: "economic_event", event, country: event.country, time: event.time },
                            });

                            addAlert({
                              eventName: language === "ar" ? "تأكيد التنبيه" : "Alert Confirmation",
                              message:
                                language === "ar"
                                  ? `تم إنشاء تنبيه للحدث الاقتصادي: ${event.event}`
                                  : `Alert created for economic event: ${event.event}`,
                              importance: 1,
                            });
                          }}
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Real-Time News */}
          <section id="news" className="py-12 sm:py-20">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-full">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  {language === "ar" ? "الأخبار المالية المباشرة" : "Real-Time Financial News"}
                </h2>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                  {language === "ar"
                    ? "تابع آخر الأخبار المالية والاقتصادية مع تحليل الذكاء الاصطناعي"
                    : "Follow the latest financial and economic news with AI analysis"}
                </p>
              </div>
              <RealtimeNewsTable />
            </div>
          </section>

          {/* Alerts */}
          <section id="alerts" className="py-12 sm:py-20">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-full">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  {language === "ar" ? "نظام التنبيهات المتقدم" : "Advanced Alert System"}
                </h2>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                  {language === "ar"
                    ? "قم بإنشاء تنبيهات ذكية لأي رمز مالي مع مراقبة الأسعار في الوقت الفعلي"
                    : "Create intelligent alerts for any financial symbol with real-time price monitoring"}
                </p>
              </div>
              <DynamicAlertSystem />
            </div>
          </section>

          {/* About */}
          <section id="about" className="py-12 sm:py-20 bg-muted/30">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-full">
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">{t("about.title")}</h2>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">{t("about.description")}</p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                <div className="text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Clock className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">{t("about.realtime.title")}</h3>
                  <p className="text-muted-foreground">{t("about.realtime.desc")}</p>
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <TrendingUp className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">{t("about.analysis.title")}</h3>
                  <p className="text-muted-foreground">{t("about.analysis.desc")}</p>
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Shield className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">{t("about.sources.title")}</h3>
                  <p className="text-muted-foreground">{t("about.sources.desc")}</p>
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Globe className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">{t("about.coverage.title")}</h3>
                  <p className="text-muted-foreground">{t("about.coverage.desc")}</p>
                </div>
              </div>
            </div>
          </section>

          {/* Contact */}
          <section id="contact" className="py-12 sm:py-20">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-full">
              <div className="max-w-2xl mx-auto text-center">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">{t("contact.title")}</h2>
                <p className="text-xl text-muted-foreground mb-8">{t("contact.description")}</p>

                <Card className="text-right">
                  <CardContent className="p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="name" className={`block ${dir === "rtl" ? "text-right" : "text-left"}`}>
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
                        <Label htmlFor="email" className={`block ${dir === "rtl" ? "text-right" : "text-left"}`}>
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
                        <Label htmlFor="whatsapp" className={`block ${dir === "rtl" ? "text-right" : "text-left"}`}>
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
          <footer className="bg-muted/50 border-t border-border py-8 sm:py-12">
            <div className="container mx-auto px-2 sm:px-4">
              <div className="text-center">
                <img src="/liirat-logo-new.png" alt="Liirat News" className="h-8 w-auto mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">{t("footer.description")}</p>
                <div className="flex justify-center space-x-6 space-x-reverse text-sm text-muted-foreground">
                  <a href="#" className="hover:text-primary transition-colors">{t("footer.privacy")}</a>
                  <a href="#" className="hover:text-primary transition-colors">{t("footer.terms")}</a>
                  <a href="#" className="hover:text-primary transition-colors">{t("footer.contact")}</a>
                </div>
                <p className="text-xs text-muted-foreground mt-4">{t("footer.copyright")}</p>
              </div>
            </div>
          </footer>
        </main>

        <ChatWidget />
        <NotificationSystem />

        <style>{`
          .neumorphic-nav-button{border-radius:12px;box-shadow:5px 5px 10px #bebebe,-5px -5px 10px #ffffff;transition:all .3s ease}
          .neumorphic-nav-button:hover{transform:translateY(-2px);box-shadow:8px 8px 16px #bebebe,-8px -8px 16px #ffffff}
          .neumorphic-hero-card{background:rgba(255,255,255,0.1);border-radius:30px;box-shadow:20px 20px 60px rgba(0,0,0,0.3),-20px -20px 60px rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);backdrop-filter:blur(10px)}
          .neumorphic-hero-button{border-radius:20px;box-shadow:10px 10px 20px rgba(0,0,0,0.3),-10px -10px 20px rgba(255,255,255,0.1);transition:all .3s ease}
          .neumorphic-hero-button:hover{transform:translateY(-3px);box-shadow:15px 15px 30px rgba(0,0,0,0.3),-15px -15px 30px rgba(255,255,255,0.1)}
          .neumorphic-hero-button-secondary{border-radius:20px;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);color:white;box-shadow:8px 8px 16px rgba(0,0,0,0.3),-8px -8px 16px rgba(255,255,255,0.1);transition:all .3s ease}
          .neumorphic-hero-button-secondary:hover{transform:translateY(-2px);background:rgba(255,255,255,0.2);box-shadow:12px 12px 24px rgba(0,0,0,0.3),-12px -12px 24px rgba(255,255,255,0.1)}
        `}</style>
      </div>
    </div>
  );
}
