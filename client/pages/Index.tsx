import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Calendar, Bell, Bot, Clock, TrendingUp, Shield, Globe, Zap } from "lucide-react";
import { useState } from "react";

export default function Index() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Connect to Supabase or GSheet
    console.log("Form submitted:", { name, email, whatsapp });
  };

  return (
    <div className="min-h-screen bg-background arabic">
      {/* Navigation Header */}
      <header className="border-b border-border/40 backdrop-blur-md bg-background/95 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4 space-x-reverse">
            <img 
              src="https://cdn.builder.io/api/v1/assets/8d6e2ebe2191474fb5a6de98317d4278/liirat-official-logo-bf14db?format=webp&width=800" 
              alt="Liirat News" 
              className="h-10 w-auto"
            />
          </div>
          <nav className="hidden md:flex items-center space-x-6 space-x-reverse">
            <a href="#features" className="text-muted-foreground hover:text-primary transition-colors">الخدمات</a>
            <a href="#data" className="text-muted-foreground hover:text-primary transition-colors">البيانات المباشرة</a>
            <a href="#about" className="text-muted-foreground hover:text-primary transition-colors">لماذا RuyaaCapital-AI</a>
            <a href="#contact" className="text-muted-foreground hover:text-primary transition-colors">تواصل معنا</a>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 lg:py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-muted/20"></div>
        <div className="container mx-auto px-4 relative">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              حلول ذكية لتداول مالي 
              <span className="text-primary block">أسرع وأكثر دقة</span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 leading-relaxed">
              نقدّم لك تقويمًا اقتصاديًا ذكيًا، تنبيهات سوق فورية، ومساعدًا يعمل بالذكاء الاصطناعي – بلغتك، وبمستوى احترافي
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 text-lg font-semibold"
                onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
              >
                ابدأ الآن
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="px-8 py-4 text-lg"
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
              >
                اكتشف المزيد
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">خدماتنا المتقدمة</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              نوفر لك كل ما تحتاجه لاتخاذ قرارات تداول ذكية ومدروسة
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <Card className="border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-xl font-bold">📆 التقويم الاقتصادي الذكي</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center text-lg leading-relaxed">
                  متابعة فورية للأحداث الاقتصادية وتحليل تأثيرها على الأسواق
                </CardDescription>
              </CardContent>
            </Card>

            {/* Feature 2 */}
            <Card className="border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Bell className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-xl font-bold">🔔 نظام تنبيهات السوق اللحظية</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center text-lg leading-relaxed">
                  اختر العملات أو المؤشرات التي تهمك واستلم التنبيهات تلقائيًا
                </CardDescription>
              </CardContent>
            </Card>

            {/* Feature 3 */}
            <Card className="border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Bot className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-xl font-bold">🤖 مساعد دعم ذكي</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center text-lg leading-relaxed">
                  مساعد يعمل بالذكاء الاصطناعي يرد تلقائيًا على الاستفسارات باللغتين العربية والإنجليزية
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Live Data Section */}
      <section id="data" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">البيانات الاقتصادية المباش��ة</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              احصل على تحليلات فورية للأحداث الاقتصادية وتأثيرها على الأسواق
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            {/* Placeholder for Live Economic Events */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  الأحداث الاقتصادية اليوم
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Sample event */}
                <div className="border-r-4 border-primary pr-4 py-3">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">بيانات التضخم الأمريكي</h4>
                    <Badge variant="secondary">عالي التأثير</Badge>
                  </div>
                  <p className="text-muted-foreground mb-3">14:30 GMT | المتوقع: 3.2% | السابق: 3.1%</p>
                  
                  {/* AI Analysis Placeholder */}
                  <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
                    <h5 className="font-semibold text-primary mb-2 flex items-center gap-2">
                      <Bot className="w-4 h-4" />
                      تحليل الذكاء الاصطناعي - تأثير الحدث على السوق
                    </h5>
                    <p className="text-sm leading-relaxed">
                      سيتم تحديث هذا القسم تلقائيًا بتحليل ذكي للحدث وتأثيره المتوقع على أزواج العملات الرئيسية والمؤشرات...
                    </p>
                  </div>
                </div>

                {/* Additional sample events */}
                <div className="border-r-4 border-orange-500 pr-4 py-3">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">قرار الفائدة الأوروبية</h4>
                    <Badge variant="outline">متوسط التأثير</Badge>
                  </div>
                  <p className="text-muted-foreground">16:00 GMT | المتوقع: 4.25% | السابق: 4.25%</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Why RuyaaCapital-AI Section */}
      <section id="about" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">لماذا RuyaaCapital-AI؟</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              اختر الحل الأذكى والأكثر موثوقية في عالم التداول
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-bold text-lg mb-2">دعم تلقائي على مدار الساعة</h3>
              <p className="text-muted-foreground">متاح 24/7 لجميع استفساراتك التجارية</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-bold text-lg mb-2">تنبيهات دقيقة بحسب تفضيلات المتداول</h3>
              <p className="text-muted-foreground">تنبيهات مخصصة حسب استراتيجيتك</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-bold text-lg mb-2">واجهة سهلة وسريعة</h3>
              <p className="text-muted-foreground">تصميم بديهي يركز على تجربة المستخدم</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Globe className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-bold text-lg mb-2">دعم لغوي عربي / إنجليزي</h3>
              <p className="text-muted-foreground">تواصل بلغتك المفضلة</p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact / Call to Action Section */}
      <section id="contact" className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">احجز تجربة مجانية</h2>
            <p className="text-xl text-muted-foreground mb-8">
              ابدأ رحلتك مع أذكى منصة تداول في المنطقة
            </p>

            <Card className="text-right">
              <CardContent className="p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-right block">الاسم الكامل</Label>
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
                    <Label htmlFor="email" className="text-right block">البريد الإلكتروني</Label>
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
                    <Label htmlFor="whatsapp" className="text-right block">رقم الواتساب</Label>
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
                    احجز تجربتك المجانية الآن
                  </Button>
                </form>
              </CardContent>
            </Card>

            <p className="text-sm text-muted-foreground mt-4">
              سنتواصل معك خلال 24 ساعة لتنسيق جلسة تعريفية مجانية
            </p>
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
              منصة Liirat News مدعومة بتقنيات RuyaaCapital-AI المتطورة
            </p>
            <div className="flex justify-center space-x-6 space-x-reverse text-sm text-muted-foreground">
              <a href="#" className="hover:text-primary transition-colors">سياسة الخصوصية</a>
              <a href="#" className="hover:text-primary transition-colors">شروط الاستخدام</a>
              <a href="#" className="hover:text-primary transition-colors">تواصل معنا</a>
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
