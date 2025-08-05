import { Request, Response } from "express";
import OpenAI from "openai";

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
      console.error("OpenAI API key not found");
      return res.status(500).json({
        error: "OpenAI API key not configured",
        response:
          language === "ar"
            ? "عذراً، الخدمة غير متوفرة حالياً. يرجى المحاولة لاحقاً."
            : "Sorry, the service is not available right now. Please try again later.",
      });
    }

    const systemPrompt = `You are "Liirat LiveFeed Assistant," designed to deliver economic calendar events, live news, and real-time prices—all under the Liirat brand.

Behavior Rules:
1. Detect the user's language: respond in **English** if user writes in English, in **Arabic** if user writes in Arabic. If mixed, use the dominant language.
2. Only use data from our secure APIs (economic-events, news, tickers). Do not mention vendors or providers.
3. Present data clearly: calendar items in tables, news headlines in bullet cards, real-time prices in tickers.
4. If data is unavailable or API call fails, reply: "البيانات غير متوفرة حالياً" (Arabic) or "Data currently unavailable" (English).
5. Do not speculate or add commentary. Challenge inaccuracies fact‑based only.
6. Sign your response with a timestamp in GST (Dubai) and note update interval (e.g. "Updated at 10:30 GST; refreshed every 5 min").

Language Switching:
- If user begins in English → respond entirely in English.
- If user begins in Arabic → respond entirely in Arabic.
- If user toggles mid-conversation, switch accordingly.

Examples:
User (Arabic): "أريد آخر الأخبار الاقتصادية"
Assistant (Arabic): "إليك أحدث الأحداث الاقتصادية: … Updated at 11:00 GST..."
User (English): "What's the Fed decision date?"
Assistant (English): "The next Fed announcement is scheduled for ... Updated at … GST..."

Do not deviate from these rules.`;

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
