import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'ar' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, fallback?: string) => string;
  dir: 'rtl' | 'ltr';
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Translation keys
const translations = {
  ar: {
    // Navigation
    'nav.calendar': 'التقويم الاقتصادي',
    'nav.alerts': 'التنبيهات',
    'nav.about': 'حول ليرات',
    'nav.contact': 'تواصل معنا',
    'nav.notifications': 'التنبيهات',
    'nav.theme': 'تبديل المظهر',
    'nav.tour': 'بدء جولة الموقع',
    
    // Hero Section
    'hero.title': 'أخبار مالية واقتصادية',
    'hero.subtitle': 'دقيقة ومحدثة',
    'hero.description': 'منصة ليرات للأخبار المالية - تقويم اقتصادي مباشر، تنبيهات فورية، وتحليلات متقدمة لجميع الأسواق العالمية',
    'hero.btn.calendar': 'اطلع على التقويم',
    'hero.btn.alerts': 'إعداد التنبيهات',
    
    // Economic Calendar
    'calendar.title': 'التقويم الاقتصادي المباشر',
    'calendar.description': 'تابع أهم الأحداث الاقتصادية والمؤشرات المالية في الوقت الفعلي مع إمكانيات تصفية متقدمة',
    'calendar.filters.title': 'فلاتر التقويم الاقتصادي',
    'calendar.filters.date': 'التاريخ',
    'calendar.filters.currency': 'العملة/البلد',
    'calendar.filters.importance': 'مستوى الأهمية',
    'calendar.filters.search': 'البحث في الأحداث',
    'calendar.filters.search.placeholder': 'ابحث عن حدث...',
    'calendar.table.datetime': 'التاريخ والوقت',
    'calendar.table.country': 'العملة/البلد',
    'calendar.table.importance': 'الأهمية',
    'calendar.table.event': 'الحدث',
    'calendar.table.actual': 'القيمة الفعلية',
    'calendar.table.forecast': 'التوقع',
    'calendar.table.previous': 'السابق',
    'calendar.table.analysis': 'تحليل الذكاء الاصطناعي',
    'calendar.live.badge': 'تحديث مباشر',
    'calendar.events.count': '{count} من أصل {total} حدث',
    'calendar.events.update': 'البيانات محدثة كل دقيقة من مصادر موثوقة',
    'calendar.upcoming': 'قريباً',
    
    // Alerts Section
    'alerts.title': 'نظام التنبيهات الذكي',
    'alerts.description': 'احصل على تنبيهات فورية عند صدور البيانات الاقتصادية المهمة',
    'alerts.setup.title': 'إعداد التنبيهات',
    'alerts.select.pair': 'اختر زوج العملة أو المؤشر',
    'alerts.select.placeholder': 'اختر من القائمة',
    'alerts.btn.submit': 'أرسل لي تنبيهات',
    'alerts.info': 'سيتم إرسال التنبيهات عبر البريد الإلكتروني والواتساب',
    'alerts.types.title': 'أنواع التنبيهات المتاحة:',
    'alerts.types.high': 'بيانات اقتصادية عالية التأثير',
    'alerts.types.central': 'قرارات البنوك المركزية',
    'alerts.types.unexpected': 'تحركات غير متوقعة في الأسواق',
    'alerts.types.rates': 'تحديثا�� أسعار الفائدة',
    'alerts.status': 'سيتم تفعيل التنبيهات لاحقاً',
    
    // About Section
    'about.title': 'لماذا ليرات نيوز؟',
    'about.description': 'منصتك الموثوقة للأخبار المالية والتحليلات الاقتصادية',
    'about.realtime.title': 'تحديثات فورية',
    'about.realtime.desc': 'بيانات محدثة كل دقيقة من الأسواق العالمية',
    'about.analysis.title': 'تحليلات متقدمة',
    'about.analysis.desc': 'تحليلات عميقة للأحداث الاقتصادية',
    'about.sources.title': 'مصادر موثوقة',
    'about.sources.desc': 'من البنوك المركزية والمؤسسات المالية الرسمية',
    'about.coverage.title': 'تغطية عالمية',
    'about.coverage.desc': 'جميع الأسواق والعملات ��لرئيسية',
    
    // Contact Section
    'contact.title': 'تواصل مع فريق ليرات',
    'contact.description': 'للاستفسارات والدعم الفني',
    'contact.form.name': 'ال��سم الكامل',
    'contact.form.name.placeholder': 'أدخل اسمك الكامل',
    'contact.form.email': 'البريد الإلكتروني',
    'contact.form.email.placeholder': 'example@email.com',
    'contact.form.whatsapp': 'رقم الواتساب',
    'contact.form.whatsapp.placeholder': '+966xxxxxxxxx',
    'contact.form.submit': 'إرسال رسالة',
    
    // Footer
    'footer.description': 'منصة ليرات للأخبار المالية والاقتصادية',
    'footer.privacy': 'سياسة الخصوصية',
    'footer.terms': 'شروط الاستخدام',
    'footer.contact': 'تواصل معنا',
    'footer.tour': 'جولة الموقع',
    'footer.copyright': '© 2024 Liirat News. جميع الحقوق محفوظة.',
    
    // AI Analysis
    'ai.button': 'تحليل الذكاء الاصطناعي',
    'ai.title': 'تحليل ذكي للحدث الاقتصادي',
    'ai.description': 'تحليل مدعوم بالذكاء الاصطناعي للحدث الاقتصادي وتأثيره على الأسواق',
    'ai.loading': 'جاري تحليل الحدث الاقتصادي...',
    'ai.loading.desc': 'قد يستغرق هذا بضع ثوان',
    'ai.error.title': 'خطأ في الحصول على التحليل',
    'ai.retry': 'إعادة المحاولة',
    'ai.analysis.title': 'التحليل الذكي',
    'ai.powered': 'مدعوم بالذكاء الاصطناعي',
    'ai.importance': 'أهمية',
    'ai.actual': 'الفعلي',
    'ai.forecast': 'المتوقع',
    'ai.previous': 'السابق',
    
    // Date/Time Options
    'date.today': 'اليوم',
    'date.tomorrow': 'غداً',
    'date.thisweek': 'هذا الأسبوع',
    'date.nextweek': 'الأسبوع القادم',
    'date.custom': 'تاريخ مخصص',
    
    // Importance Levels
    'importance.all': 'جميع المستويات',
    'importance.high': '⭐⭐⭐ عالي التأثير',
    'importance.medium': '⭐⭐ متوسط التأثير',
    'importance.low': '⭐ منخفض التأثير',
    
    // Currency Options
    'currency.all': 'جميع العملات',
    'currency.usd': '🇺🇸 USD - الدولار الأمريكي',
    'currency.eur': '🇪🇺 EUR - اليورو',
    'currency.gbp': '🇬🇧 GBP - الجنيه الإسترليني',
    'currency.jpy': '🇯🇵 JPY - الين الياباني',
    'currency.aud': '🇦🇺 AUD - الدولار الأسترالي',
    'currency.cad': '🇨🇦 CAD - الدولار الكندي',

    // Calendar placeholders and labels
    'calendar.select.date': 'اختر التاريخ',
    'calendar.select.currency': 'جميع العملات',
    'calendar.select.importance': 'جميع المستويات',

    // Alert pairs
    'alert.pairs.eurusd': 'EUR/USD',
    'alert.pairs.gbpusd': 'GBP/USD',
    'alert.pairs.usdjpy': 'USD/JPY',
    'alert.pairs.usdcad': 'USD/CAD',
    'alert.pairs.audusd': 'AUD/USD',
    'alert.pairs.nfp': 'رواتب غير الزراعية الأمريكية',
    'alert.pairs.cpi': 'مؤشر أسعار المستهلك',
    'alert.pairs.gdp': 'الناتج المحلي الإجمالي',

    // Error messages
    'error.loading': 'خطأ في التحميل',
    'error.retry': 'إعادة المحاولة',
    'error.network': 'خطأ في الشبكة',

    // Common actions
    'common.loading': 'جاري التحميل...',
    'common.save': 'حفظ',
    'common.cancel': 'إلغاء',
    'common.close': 'إغلاق',
    'common.edit': 'تعديل',
    'common.delete': 'حذف',
    'common.add': 'إضافة',
    'common.select': 'اختيار',
    'common.confirm': 'تأكيد',

    // Notification system
    'notifications.title': 'التنبيهات',
    'notifications.empty': 'لا توجد تنبيهات',
    'notifications.mark_read': 'تحديد كمقروء',
    'notifications.clear_all': 'مسح الكل',
    'notifications.settings': 'إعدادات التنبيهات',
  },
  en: {
    // Navigation
    'nav.calendar': 'Economic Calendar',
    'nav.alerts': 'Alerts',
    'nav.about': 'About Liirat',
    'nav.contact': 'Contact Us',
    'nav.notifications': 'Notifications',
    'nav.theme': 'Toggle Theme',
    'nav.tour': 'Start Site Tour',
    
    // Hero Section
    'hero.title': 'Financial & Economic News',
    'hero.subtitle': 'Accurate and Updated',
    'hero.description': 'Liirat Financial News Platform - Live economic calendar, instant alerts, and advanced analysis for all global markets',
    'hero.btn.calendar': 'View Calendar',
    'hero.btn.alerts': 'Setup Alerts',
    
    // Economic Calendar
    'calendar.title': 'Live Economic Calendar',
    'calendar.description': 'Follow the most important economic events and financial indicators in real-time with advanced filtering capabilities',
    'calendar.filters.title': 'Economic Calendar Filters',
    'calendar.filters.date': 'Date',
    'calendar.filters.currency': 'Currency/Country',
    'calendar.filters.importance': 'Importance Level',
    'calendar.filters.search': 'Search Events',
    'calendar.filters.search.placeholder': 'Search for an event...',
    'calendar.table.datetime': 'Date & Time',
    'calendar.table.country': 'Currency/Country',
    'calendar.table.importance': 'Importance',
    'calendar.table.event': 'Event',
    'calendar.table.actual': 'Actual Value',
    'calendar.table.forecast': 'Forecast',
    'calendar.table.previous': 'Previous',
    'calendar.table.analysis': 'AI Analysis',
    'calendar.live.badge': 'Live Update',
    'calendar.events.count': '{count} out of {total} events',
    'calendar.events.update': 'Data updated every minute from reliable sources',
    'calendar.upcoming': 'Coming Soon',
    
    // Alerts Section
    'alerts.title': 'Smart Alert System',
    'alerts.description': 'Get instant notifications when important economic data is released',
    'alerts.setup.title': 'Setup Alerts',
    'alerts.select.pair': 'Choose Currency Pair or Index',
    'alerts.select.placeholder': 'Select from list',
    'alerts.btn.submit': 'Send Me Alerts',
    'alerts.info': 'Alerts will be sent via email and WhatsApp',
    'alerts.types.title': 'Available Alert Types:',
    'alerts.types.high': 'High-impact economic data',
    'alerts.types.central': 'Central bank decisions',
    'alerts.types.unexpected': 'Unexpected market movements',
    'alerts.types.rates': 'Interest rate updates',
    'alerts.status': 'Alerts will be activated later',
    
    // About Section
    'about.title': 'Why Liirat News?',
    'about.description': 'Your trusted platform for financial news and economic analysis',
    'about.realtime.title': 'Real-time Updates',
    'about.realtime.desc': 'Data updated every minute from global markets',
    'about.analysis.title': 'Advanced Analysis',
    'about.analysis.desc': 'Deep insights into economic events',
    'about.sources.title': 'Reliable Sources',
    'about.sources.desc': 'From central banks and official financial institutions',
    'about.coverage.title': 'Global Coverage',
    'about.coverage.desc': 'All major markets and currencies',
    
    // Contact Section
    'contact.title': 'Contact Liirat Team',
    'contact.description': 'For inquiries and technical support',
    'contact.form.name': 'Full Name',
    'contact.form.name.placeholder': 'Enter your full name',
    'contact.form.email': 'Email Address',
    'contact.form.email.placeholder': 'example@email.com',
    'contact.form.whatsapp': 'WhatsApp Number',
    'contact.form.whatsapp.placeholder': '+966xxxxxxxxx',
    'contact.form.submit': 'Send Message',
    
    // Footer
    'footer.description': 'Liirat Financial and Economic News Platform',
    'footer.privacy': 'Privacy Policy',
    'footer.terms': 'Terms of Use',
    'footer.contact': 'Contact Us',
    'footer.tour': 'Site Tour',
    'footer.copyright': '© 2024 Liirat News. All rights reserved.',
    
    // AI Analysis
    'ai.button': 'AI Analysis',
    'ai.title': 'Smart Economic Event Analysis',
    'ai.description': 'AI-powered analysis of economic events and their market impact',
    'ai.loading': 'Analyzing economic event...',
    'ai.loading.desc': 'This may take a few seconds',
    'ai.error.title': 'Error getting analysis',
    'ai.retry': 'Retry',
    'ai.analysis.title': 'Smart Analysis',
    'ai.powered': 'Powered by AI',
    'ai.importance': 'Importance',
    'ai.actual': 'Actual',
    'ai.forecast': 'Forecast',
    'ai.previous': 'Previous',
    
    // Date/Time Options
    'date.today': 'Today',
    'date.tomorrow': 'Tomorrow',
    'date.thisweek': 'This Week',
    'date.nextweek': 'Next Week',
    'date.custom': 'Custom Date',
    
    // Importance Levels
    'importance.all': 'All Levels',
    'importance.high': '⭐⭐⭐ High Impact',
    'importance.medium': '⭐⭐ Medium Impact',
    'importance.low': '⭐ Low Impact',
    
    // Currency Options
    'currency.all': 'All Currencies',
    'currency.usd': '🇺🇸 USD - US Dollar',
    'currency.eur': '🇪🇺 EUR - Euro',
    'currency.gbp': '🇬🇧 GBP - British Pound',
    'currency.jpy': '🇯🇵 JPY - Japanese Yen',
    'currency.aud': '🇦🇺 AUD - Australian Dollar',
    'currency.cad': '🇨🇦 CAD - Canadian Dollar',

    // Calendar placeholders and labels
    'calendar.select.date': 'Select Date',
    'calendar.select.currency': 'All Currencies',
    'calendar.select.importance': 'All Levels',

    // Alert pairs
    'alert.pairs.eurusd': 'EUR/USD',
    'alert.pairs.gbpusd': 'GBP/USD',
    'alert.pairs.usdjpy': 'USD/JPY',
    'alert.pairs.usdcad': 'USD/CAD',
    'alert.pairs.audusd': 'AUD/USD',
    'alert.pairs.nfp': 'US Non-Farm Payrolls',
    'alert.pairs.cpi': 'Consumer Price Index',
    'alert.pairs.gdp': 'Gross Domestic Product',

    // Error messages
    'error.loading': 'Loading Error',
    'error.retry': 'Retry',
    'error.network': 'Network Error',

    // Common actions
    'common.loading': 'Loading...',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.close': 'Close',
    'common.edit': 'Edit',
    'common.delete': 'Delete',
    'common.add': 'Add',
    'common.select': 'Select',
    'common.confirm': 'Confirm',

    // Notification system
    'notifications.title': 'Notifications',
    'notifications.empty': 'No notifications',
    'notifications.mark_read': 'Mark as read',
    'notifications.clear_all': 'Clear all',
    'notifications.settings': 'Notification Settings',
  }
};

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguageState] = useState<Language>('ar');

  // Initialize language from localStorage or browser preference
  useEffect(() => {
    const savedLanguage = localStorage.getItem('liirat-language') as Language;
    if (savedLanguage && (savedLanguage === 'ar' || savedLanguage === 'en')) {
      setLanguageState(savedLanguage);
    } else {
      // Auto-detect from browser/content
      const htmlDir = document.documentElement.getAttribute('dir');
      if (htmlDir === 'rtl') {
        setLanguageState('ar');
      } else if (htmlDir === 'ltr') {
        setLanguageState('en');
      } else {
        // Check for Arabic content
        const hasArabicText = document.body.textContent?.includes('التقويم') || 
                             document.body.textContent?.includes('ليرات');
        setLanguageState(hasArabicText ? 'ar' : 'en');
      }
    }
  }, []);

  // Update HTML attributes and save preference when language changes
  useEffect(() => {
    document.documentElement.setAttribute('lang', language);
    document.documentElement.setAttribute('dir', language === 'ar' ? 'rtl' : 'ltr');
    localStorage.setItem('liirat-language', language);
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: string, fallback?: string): string => {
    const translation = translations[language]?.[key as keyof typeof translations[typeof language]];
    return translation || fallback || key;
  };

  return (
    <LanguageContext.Provider value={{
      language,
      setLanguage,
      t,
      dir: language === 'ar' ? 'rtl' : 'ltr'
    }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
