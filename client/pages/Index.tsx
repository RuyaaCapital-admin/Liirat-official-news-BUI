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
} from "lucide-react";
import { useState } from "react";
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
  const { theme } = useTheme();

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
    <div className="min-h-screen bg-background arabic">
      {/* Navigation Header */}
      <header className="border-b border-border/40 backdrop-blur-md bg-background/95 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4 space-x-reverse">
            <img
              src="https://cdn.builder.io/api/v1/assets/8d6e2ebe2191474fb5a6de98317d4278/liirat-official-logo-bf14db?format=webp&width=800"
              alt="Liirat News"
              className="h-14 w-auto"
            />
          </div>

          <nav className="hidden md:flex items-center space-x-6 space-x-reverse">
            <a
              href="#calendar"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              التقويم الاقتصادي
            </a>
            <a
              href="#alerts"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              التنبيهات
            </a>
            <a
              href="#about"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              حول ليرات
            </a>
            <a
              href="#contact"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              تواصل معنا
            </a>
          </nav>

          <div className="flex items-center space-x-2 space-x-reverse">
            {/* Notification Bell */}
            <Button variant="ghost" size="sm" className="h-9 w-9 px-0 relative">
              <BellRing className="h-4 w-4" />
              <div className="absolute -top-1 -right-1 h-3 w-3 bg-primary rounded-full text-xs flex items-center justify-center text-primary-foreground">
                3
              </div>
              <span className="sr-only">التنبيهات</span>
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Real-Time Market Ticker */}
      <MarketTicker />

      {/* Hero Section */}
      <section className="py-20 lg:py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-muted/20"></div>
        <div className="container mx-auto px-4 relative">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              أخبار مالية واقتصادية
              <span className="text-primary block">دقيقة ومحدثة</span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 leading-relaxed">
              منصة ليرات للأخبار المالية - تقويم اقتصادي مباشر، تنبيهات فورية،
              وتحليلات متقدمة لجميع الأسواق العالمية
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 text-lg font-semibold"
                onClick={() =>
                  document
                    .getElementById("calendar")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
              >
                اطلع على التقويم
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="px-8 py-4 text-lg"
                onClick={() =>
                  document
                    .getElementById("alerts")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
              >
                إعداد التنبيهات
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
              التقويم الاقتصادي المباشر
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              تابع أهم الأحداث الاقتصادية والمؤشرات المالية في الوقت الفعلي مع
              إمكانيات تصفية متقدمة
            </p>
          </div>

          <div className="max-w-7xl mx-auto">
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="w-5 h-5 text-primary" />
                  فلاتر التقويم الاقتصادي
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Filters Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  {/* Date Picker */}
                  <div className="space-y-2">
                    <Label className="text-right block">التاريخ</Label>
                    <Select
                      value={selectedDate}
                      onValueChange={setSelectedDate}
                    >
                      <SelectTrigger className="text-right">
                        <SelectValue placeholder="اختر التاريخ" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="today">اليوم</SelectItem>
                        <SelectItem value="tomorrow">غداً</SelectItem>
                        <SelectItem value="this-week">هذا الأسبوع</SelectItem>
                        <SelectItem value="next-week">
                          الأسبوع القادم
                        </SelectItem>
                        <SelectItem value="custom">تاريخ مخصص</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Country/Currency Selector */}
                  <div className="space-y-2">
                    <Label className="text-right block">العملة/البلد</Label>
                    <Select
                      value={selectedCountry}
                      onValueChange={setSelectedCountry}
                    >
                      <SelectTrigger className="text-right">
                        <SelectValue placeholder="جميع العملات" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">جميع العملات</SelectItem>
                        <SelectItem value="USD">
                          🇺🇸 USD - ��لدولار الأمريكي
                        </SelectItem>
                        <SelectItem value="EUR">🇪🇺 EUR - اليورو</SelectItem>
                        <SelectItem value="GBP">
                          🇬🇧 GBP - الجنيه الإسترليني
                        </SelectItem>
                        <SelectItem value="JPY">
                          🇯🇵 JPY - الين الياباني
                        </SelectItem>
                        <SelectItem value="AUD">
                          🇦🇺 AUD - الدولار الأسترالي
                        </SelectItem>
                        <SelectItem value="CAD">
                          🇨🇦 CAD - الدولار الكندي
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Importance Filter */}
                  <div className="space-y-2">
                    <Label className="text-right block">مستوى الأهمية</Label>
                    <Select
                      value={selectedImportance}
                      onValueChange={setSelectedImportance}
                    >
                      <SelectTrigger className="text-right">
                        <SelectValue placeholder="جميع المستويات" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">جميع المستويات</SelectItem>
                        <SelectItem value="3">⭐⭐⭐ عالي التأثير</SelectItem>
                        <SelectItem value="2">⭐⭐ متوسط التأثير</SelectItem>
                        <SelectItem value="1">⭐ منخفض التأثير</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Search by Event Name */}
                  <div className="space-y-2">
                    <Label className="text-right block">البحث في الأحداث</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        type="text"
                        value={searchEvent}
                        onChange={(e) => setSearchEvent(e.target.value)}
                        className="text-right pl-10"
                        placeholder="ابحث عن حدث..."
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
                    الأحداث الاقتصادية ({filteredEvents.length})
                  </div>
                  <Badge variant="outline" className="text-xs">
                    تحديث مباشر
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="text-right">
                        <TableHead className="text-right">
                          التاريخ والوقت
                        </TableHead>
                        <TableHead className="text-right">
                          العملة/البلد
                        </TableHead>
                        <TableHead className="text-right">الأهمية</TableHead>
                        <TableHead className="text-right">الحدث</TableHead>
                        <TableHead className="text-right">
                          القيمة الفعلية
                        </TableHead>
                        <TableHead className="text-right">التوقع</TableHead>
                        <TableHead className="text-right">السابق</TableHead>
                        <TableHead className="text-right">
                          تحليل الذكاء الاصطناعي
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
                                قريباً
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
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs whitespace-nowrap"
                              disabled={event.actual === "-"}
                            >
                              تحليل الذكاء الاصطناعي
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="mt-4 text-center">
                  <p className="text-sm text-muted-foreground">
                    البيانات محدثة كل دقيقة من مصادر موثوقة •{" "}
                    {filteredEvents.length} من أصل {economicEvents.length} حدث
                  </p>
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
                نظام التنبيهات الذكي
              </h2>
              <p className="text-xl text-muted-foreground">
                احصل على تنبيهات فورية عند صدور البيانات الاقتصادية المهمة
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-primary" />
                  إعداد التنبيهات
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>اختر زوج العملة أو المؤشر</Label>
                      <Select
                        value={selectedPair}
                        onValueChange={setSelectedPair}
                      >
                        <SelectTrigger className="text-right">
                          <SelectValue placeholder="اختر من القائمة" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="eurusd">EUR/USD</SelectItem>
                          <SelectItem value="gbpusd">GBP/USD</SelectItem>
                          <SelectItem value="usdjpy">USD/JPY</SelectItem>
                          <SelectItem value="usdcad">USD/CAD</SelectItem>
                          <SelectItem value="audusd">AUD/USD</SelectItem>
                          <SelectItem value="nfp">
                            رواتب غير الزراعية الأمريكية
                          </SelectItem>
                          <SelectItem value="cpi">
                            مؤشر أسعار المستهلك
                          </SelectItem>
                          <SelectItem value="gdp">
                            الناتج المحلي الإجمالي
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button
                      onClick={handleAlertSubmit}
                      className="w-full"
                      disabled={!selectedPair}
                    >
                      أرسل لي تنبيهات
                    </Button>

                    <p className="text-sm text-muted-foreground text-center">
                      سيتم إرسال التنبيهات عبر البريد الإلكتروني والواتساب
                    </p>
                  </div>

                  <div className="bg-muted/50 rounded-lg p-4">
                    <h4 className="font-semibold mb-3">
                      أنواع التنبيهات المتاحة:
                    </h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                        بيانات اقتصادية عالية التأثير
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                        قرارات البنوك المركزية
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        تحركات غير متوقعة في الأسواق
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        تحديثات أسعار الفائدة
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
                    سيتم تفعيل التنبيهات لاحقاً
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
              لماذا ليرات نيوز؟
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              منصتك الموثوقة للأخبار المالية والتحليلات الاقتصادية
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-bold text-lg mb-2">تحديثات فورية</h3>
              <p className="text-muted-foreground">
                بيانات محدثة كل دقيقة من الأسواق العالمية
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-bold text-lg mb-2">تحليلات متقدمة</h3>
              <p className="text-muted-foreground">
                تحليلات عميقة للأحداث الاقتصادية
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-bold text-lg mb-2">مصادر موثوقة</h3>
              <p className="text-muted-foreground">
                من البنوك المركزية والمؤسسات المالية الرسمية
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Globe className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-bold text-lg mb-2">تغطية عالمية</h3>
              <p className="text-muted-foreground">
                جميع الأسواق والعملات الرئيسية
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
              تواصل مع فريق ليرات
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              للاستفسارات والدعم الفني
            </p>

            <Card className="text-right">
              <CardContent className="p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-right block">
                      الاسم الكامل
                    </Label>
                    <Input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="text-right"
                      placeholder="أدخل اسمك الكامل"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-right block">
                      البريد الإلكتروني
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="text-right"
                      placeholder="example@email.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="whatsapp" className="text-right block">
                      رقم الواتساب
                    </Label>
                    <Input
                      id="whatsapp"
                      type="tel"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      className="text-right"
                      placeholder="+966xxxxxxxxx"
                    />
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-4 text-lg font-semibold"
                  >
                    إرسال رسالة
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
              src="https://cdn.builder.io/api/v1/assets/8d6e2ebe2191474fb5a6de98317d4278/liirat-official-logo-bf14db?format=webp&width=800"
              alt="Liirat News"
              className="h-8 w-auto mx-auto mb-4"
            />
            <p className="text-muted-foreground mb-4">
              منصة ليرات للأخبار المالية والاقتصادية
            </p>
            <div className="flex justify-center space-x-6 space-x-reverse text-sm text-muted-foreground">
              <a href="#" className="hover:text-primary transition-colors">
                سياسة الخصوصية
              </a>
              <a href="#" className="hover:text-primary transition-colors">
                شروط الاستخدام
              </a>
              <a href="#" className="hover:text-primary transition-colors">
                تواصل معنا
              </a>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              © 2024 Liirat News. جميع الحقوق محفوظة.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
