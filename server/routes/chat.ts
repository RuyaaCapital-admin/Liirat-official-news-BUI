import { Request, Response } from "express";
import OpenAI from "openai";

// Fallback response generator when OpenAI is not available
function generateFallbackResponse(message: string, language: string): string {
  const lowerMessage = message.toLowerCase();

  if (language === "ar") {
    // Arabic responses
    if (
      lowerMessage.includes("مرحبا") ||
      lowerMessage.includes("السلام") ||
      lowerMessage.includes("أهلا")
    ) {
      return "مرحباً، أنا مساعد ليرات للأخبار الاقتصادية. كيف يمكنني مساعدتك اليوم؟";
    }
    if (
      lowerMessage.includes("سعر") ||
      lowerMessage.includes("أسعار") ||
      lowerMessage.includes("دولار") ||
      lowerMessage.includes("يورو")
    ) {
      return "يمكنك متابعة الأسعار المباشرة من خلال شريط الأسعار في أعلى الصفحة. للحصول على تحليل مفصل، يرجى تحديد الرمز المطلوب.";
    }
    if (
      lowerMessage.includes("تقويم") ||
      lowerMessage.includes("أحداث") ||
      lowerMessage.includes("اقتصادي")
    ) {
      return "يمكنك الاطلاع على التقويم الاقتصادي أسفل الصفحة لمتابعة الأحداث الاقتصادية المهمة والمؤثرة على الأسواق.";
    }
    if (lowerMessage.includes("أ��بار") || lowerMessage.includes("خبر")) {
      return "تابع آخر الأخبار الاقتصادية والمالية من مصادر موثوقة. يمكنك استخدام المرشحات للحصول على الأخبار المتعلقة بقطاع معين.";
    }
    return "أنا هنا لمساعدتك في الأمور الاقتصادية والمالية. يمكنني مساعدتك في متابعة الأسعار والتقويم الاقتصادي والأخبار المالية.";
  } else {
    // English responses
    if (
      lowerMessage.includes("hello") ||
      lowerMessage.includes("hi") ||
      lowerMessage.includes("hey")
    ) {
      return "Hi, I'm Liirat News AI Assistant. How can I help you today?";
    }
    if (
      lowerMessage.includes("price") ||
      lowerMessage.includes("usd") ||
      lowerMessage.includes("eur") ||
      lowerMessage.includes("gold")
    ) {
      return "You can track live prices using the ticker at the top of the page. For detailed analysis, please specify the symbol you're interested in.";
    }
    if (
      lowerMessage.includes("calendar") ||
      lowerMessage.includes("events") ||
      lowerMessage.includes("economic")
    ) {
      return "Check the Economic Calendar below to stay updated with important economic events that impact the markets.";
    }
    if (lowerMessage.includes("news")) {
      return "Stay updated with the latest economic and financial news from trusted sources. You can use filters to get news for specific sectors.";
    }
    return "I'm here to help with economic and financial matters. I can assist with price tracking, economic calendar, and financial news.";
  }
}

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  : null;

export const handleChat = async (req: Request, res: Response) => {
  try {
    const { message, language = "ar" } = req.body;

    if (!message) {
      return res.status(400).json({
        error: language === "ar" ? "الرسالة مطلوبة" : "Message is required",
      });
    }

    if (!openai) {
      console.log("OpenAI API key not found, using fallback responses");

      // Provide useful fallback responses
      const fallbackResponse = generateFallbackResponse(message, language);

      return res.json({
        response: fallbackResponse,
        timestamp: new Date().toISOString(),
        fallback: true,
      });
    }

    const systemPrompt = `You are Liirat News AI Assistant, a professional economic and financial news agent serving users in both Arabic and English.

CORE FUNCTIONS:
• Instantly deliver economic calendar events, real-time news, and market price alerts
• Explain news/event impact on markets in a concise, user-friendly way—no lengthy or complex answers
• Always detect and reply in the user's language (Arabic or English). Never mix languages in a single reply

PROFESSIONAL STANDARDS:
• Never reveal internal methods, private information, or implementation details
• Never leave your defined role. Never answer non-economic or off-topic questions
• Never guess, assume, or provide uncertain information. If data is unavailable or unclear, state so directly
• Always act confidently and professionally—no weak language, no hedging, no "maybe", "I guess", or "possibly"
• When explaining market impact, refer to specific events/data, and when possible, include date/time for context

GREETING RESPONSES (always the same, in user's language):
English: "Hi, I'm Liirat News AI Assistant. How can I help you today?"
Arabic: "مرحباً، أنا مساعد ليرات للأخبار الاقتصادية. كيف يمكنني مساعدتك اليوم؟"

ROLE RESTRICTIONS (absolute):
• You are strictly limited to financial/economic topics
• Never provide any non-economic advice or information, even if asked repeatedly
• Never discuss internal logic, AI, your limitations, or "how you work"
• Always keep answers short, clear, and actionable

ERROR RESPONSES:
If user's request is outside your scope:
English: "I'm only able to assist with economic and financial news or market data. Please ask about these topics."
Arabic: "أستطيع فقط مساعدتك في الأخبار والبيانات الاقتصادية والمالية. يرجى طرح أسئلة حول هذه المواضيع."

If real-time data is unavailable:
English: "I'm facing technical issues fetching live data. Please specify the news or chart you need help with, and I'll assist based on the latest available information."
Arabic: "أواجه حالياً مشكلة في جلب البيانات الحية. يرجى تحديد الخبر أو الرسم البياني الذي تحتاج لمساعدتي به، وسأساعدك بما هو متوفر لدي."

RESPONSE FORMAT:
• Present data clearly: calendar items in tables, news headlines in bullet format, real-time prices in tickers
• Sign responses with timestamp in GST (Dubai) timezone
• Keep responses concise and actionable—no lengthy explanations unless specifically requested`;

    console.log("Sending request to OpenAI with message:", message);

    const completion = await openai!.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
      max_tokens: 1000,
      temperature: 0.7,
    });

    const response =
      completion.choices[0]?.message?.content ||
      (language === "ar"
        ? "عذراً، لم أستطع إنشاء رد."
        : "Sorry, I could not generate a response.");

    console.log(
      "OpenAI response received:",
      response.substring(0, 100) + "...",
    );

    // Get real Dubai time
    const dubaiTime = new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Dubai"}));

    res.json({
      response,
      timestamp: dubaiTime.toISOString(),
      dubaiTime: dubaiTime.toLocaleString('en-US', {
        timeZone: 'Asia/Dubai',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }),
      realTime: true
    });
  } catch (error) {
    console.error("Chat Error:", error);

    const { language = "ar" } = req.body;

    let errorMessage =
      language === "ar"
        ? "عذراً، أواجه صعوبات تقنية. يرجى المحاولة مرة أخرى."
        : "Sorry, I'm experiencing technical difficulties. Please try again.";

    if (error instanceof Error) {
      if (error.message.includes("401")) {
        errorMessage =
          language === "ar"
            ? "خطأ في المصادقة مع خدمة الذكاء الاصطناعي."
            : "Authentication error with AI service.";
      } else if (error.message.includes("429")) {
        errorMessage =
          language === "ar"
            ? "تم تجاوز الحد المسموح. يرجى الانتظار والمحاولة مرة أخرى."
            : "Rate limit exceeded. Please wait and try again.";
      } else if (error.message.includes("500")) {
        errorMessage =
          language === "ar"
            ? "الخدمة غير متوفرة مؤقتاً. يرجى المحاولة لاحقاً."
            : "Service is temporarily unavailable. Please try again later.";
      }
    }

    res.status(500).json({
      error: "Failed to process chat request",
      response: errorMessage,
    });
  }
};
