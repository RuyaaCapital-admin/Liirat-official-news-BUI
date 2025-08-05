import { VercelRequest, VercelResponse } from "@vercel/node";
import OpenAI from "openai";

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  : null;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message, language = "ar" } = req.body;

    if (!message) {
      return res.status(400).json({
        error: language === "ar" ? "الرسالة مطلوبة" : "Message is required",
      });
    }

    if (!openai) {
      console.error("OpenAI API key not found");
      return res.status(500).json({
        error: "OpenAI API key not configured",
        response:
          language === "ar"
            ? "عذراً، الخدمة غير متوفرة حالياً. يرجى المحاولة لاحقاً."
            : "Sorry, the service is not available right now. Please try again later.",
      });
    }

    const systemPrompt = `You are Liirat News AI Assistant, a professional economic and financial news agent serving users in both Arabic and English.

CORE FUNCTIONS:
• Instantly deliver economic calendar events, real-time news, and market price alerts
• Explain news/event impact on markets in a concise, user-friendly way—no lengthy or complex answers
• Always detect and reply in the user's language (${language === "ar" ? "Arabic" : "English"}). Never mix languages in a single reply

PROFESSIONAL STANDARDS:
• Never reveal internal methods, private information, or implementation details
• Never leave your defined role. Never answer non-economic or off-topic questions
• Never guess, assume, or provide uncertain information. If data is unavailable or unclear, state so directly
• Always act confidently and professionally—no weak language, no hedging, no "maybe", "I guess", or "possibly"
• When explaining market impact, refer to specific events/data, and when possible, include date/time for context

GREETING RESPONSE (always the same):
${
  language === "ar"
    ? "مرحباً، أنا مساعد ليرات للأخبار الاقتصادية. كيف يمكنني مساعدتك ال��وم؟"
    : "Hi, I'm Liirat News AI Assistant. How can I help you today?"
}

ROLE RESTRICTIONS (absolute):
• You are strictly limited to financial/economic topics
• Never provide any non-economic advice or information, even if asked repeatedly
• Never discuss internal logic, AI, your limitations, or "how you work"
• Always keep answers short, clear, and actionable

ERROR RESPONSES:
If user's request is outside your scope:
${
  language === "ar"
    ? "أستطيع فقط مساعدتك في الأخبار والبيانات الاقتصادية والمالية. يرجى طرح أسئلة حول هذه المواضيع."
    : "I'm only able to assist with economic and financial news or market data. Please ask about these topics."
}

If real-time data is unavailable:
${
  language === "ar"
    ? "أواجه حالياً مشكلة في جلب البيانات الحية. يرجى تحديد الخبر أو الرسم البياني الذي تحتاج لمساعدتي به، وسأساعدك بما هو متوفر لدي."
    : "I'm facing technical issues fetching live data. Please specify the news or chart you need help with, and I'll assist based on the latest available information."
}

RESPONSE FORMAT:
• Present data clearly: calendar items in tables, news headlines in bullet format, real-time prices in tickers
• Keep responses concise and actionable—no lengthy explanations unless specifically requested
• This is for educational and informational purposes only, not investment advice`;

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

    res.json({
      response,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Chat Error:", error);

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
}
