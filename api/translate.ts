import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const { text, targetLanguage } = req.body;

    if (!text || !targetLanguage) {
      return res.status(400).json({
        error: "Missing required fields: text and targetLanguage",
      });
    }

    // Simple translation mapping for common economic terms
    const translations: Record<string, string> = {
      // Economic Events
      Exports: "الصادرات",
      Imports: "الواردات",
      GDP: "الناتج المحلي الإجمالي",
      Inflation: "التضخم",
      Unemployment: "البطالة",
      "Interest Rate": "سعر الفائدة",
      "Trade Balance": "الميزان التجاري",
      "Consumer Price Index": "مؤشر أسعار المستهلك",
      "Producer Price Index": "مؤشر أسعار المنتجين",
      "Industrial Production": "الإنتاج الصناعي",
      "Retail Sales": "مبيعات التجزئة",
      Employment: "التوظيف",
      Payrolls: "كشوف المرتبات",
      Wages: "الأجور",
      Manufacturing: "التصنيع",
      Services: "الخدمات",
      Housing: "الإسكان",
      Construction: "البناء",
      "Central Bank": "البنك المركزي",
      "Federal Reserve": "الاحتياطي الفيدرالي",
      ECB: "البنك المركزي الأوروبي",
      "Bank of England": "بنك إنجلترا",
      "Bank of Japan": "بنك اليابان",

      // Categories
      Financial: "مالي",
      Economic: "اقتصادي",
      Earnings: "الأرباح",
      "Central Banks": "البنوك المركزية",
      Forex: "تداول العملات",
      "All Categories": "جميع الفئات",
      "All Countries": "جميع البلدان",

      // Common Terms
      High: "عالي",
      Medium: "متوسط",
      Low: "منخفض",
      Previous: "السابق",
      Forecast: "المتوقع",
      Actual: "الفعلي",
      Impact: "التأثير",
      Country: "الدولة",
      Event: "الحدث",
      "Date & Time": "التاريخ والوقت",
      Actions: "الإجراءات",
      Search: "البحث",
      Category: "الفئة",
      Countries: "البلدان",
      Importance: "الأهمية",
      Filters: "الفلاتر",
      "Clear All": "مسح الكل",
      Refresh: "تحديث",
      Period: "الفترة",
      Time: "الوقت",
      "This Week": "هذا الأسبوع",
      "Next Week": "الأسبوع القادم",
      "This Month": "هذا الشهر",
      "Custom Range": "فترة مخصصة",
    };

    // Return direct translation if available
    const translatedText = translations[text] || text;

    res.status(200).json({
      translatedText,
      originalText: text,
      targetLanguage,
      success: true,
    });
  } catch (error) {
    console.error("Translation API error:", error);
    res.status(500).json({
      error: "Translation failed",
      translatedText: req.body.text, // Fallback to original
      success: false,
    });
  }
}
