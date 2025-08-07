import { RequestHandler } from "express";
import {
  apiOptimizer,
  generateCacheKey,
  getClientId,
} from "../utils/rate-limiter";

// OpenAI integration for news/event analysis
export const handleAIAnalysis: RequestHandler = async (req, res) => {
  const openaiApiKey = process.env.OPENAI_API_KEY;

  try {
    const { text, language = "en", type = "news" } = req.body;

    if (!text) {
      return res.status(400).json({
        error: "Text content is required for analysis",
      });
    }

    if (!openaiApiKey) {
      const errorMessage = language === "ar"
        ? "مفتاح OpenAI غير مُعدّ"
        : "OpenAI API key not configured";
      return res.status(500).json({
        error: errorMessage,
        analysis:
          language === "ar"
            ? "مفتاح OpenAI غير متوفر"
            : "OpenAI API key not available",
      });
    }

    // Get client ID for rate limiting
    const clientId = getClientId(req);

    // Check rate limit
    if (!apiOptimizer.checkRateLimit(clientId, "analysis")) {
      const errorMessage = language === "ar"
        ? "تجاوز الحد المسموح من الطلبات. يرجى المحاولة لاحقاً."
        : "Rate limit exceeded. Please try again later.";
      return res.status(429).json({
        error: errorMessage,
        analysis:
          language === "ar"
            ? "تجاوز الحد المسموح من الطلبات"
            : "Rate limit exceeded",
        retryAfter: 60,
      });
    }

    // Generate cache key for AI analysis
    const cacheKey = generateCacheKey("analysis", {
      text: text.substring(0, 100), // Use first 100 chars for cache key
      language,
      type,
    });

    // Check cache first
    const cachedData = apiOptimizer.getCached(cacheKey, "analysis");
    if (cachedData) {
      return res.json(cachedData);
    }

    // Create analysis prompt with the exact system prompt requested
    const systemPrompt =
      language === "ar"
        ? "لخص هذا الحدث/الخبر وتأثيره المحتمل على السوق بطريقة قصيرة وصادقة وواضحة. اعتمد فقط على محتوى الحدث، لا تعشوائي أبداً، لا تخمن. ركز على ما يحتاج المتداول لمعرفته - قدم فائدة واضحة، بدون تعقيد."
        : "Summarize this event/news and its likely market effect in a short, honest, and clear way. Only base analysis on the event content, never randomize, never guess. Focus on what a trader needs to know — deliver clear benefit, no complexity.";

    let userPrompt = "";
    if (type === "event") {
      userPrompt = `Economic Event: ${text}`;
    } else {
      userPrompt = `News: ${text}`;
    }

    console.log(`AI Analysis request: ${type} analysis for ${language}`);

    // Call OpenAI API
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: userPrompt,
          },
        ],
        max_tokens: 150,
        temperature: 0.1,
      }),
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error(
        `OpenAI API error: ${response.status} - ${response.statusText}`,
      );
      const errorText = await response.text();
      console.error("OpenAI error response:", errorText);

      return res.status(500).json({
        error: "AI analysis temporarily unavailable",
        analysis:
          language === "ar"
            ? "تحليل الذكاء الاصطناعي غير متاح حاليًا"
            : "AI analysis currently unavailable",
      });
    }

    const data = await response.json();
    const analysis =
      data.choices?.[0]?.message?.content ||
      (language === "ar" ? "لا يوجد تحليل متاح" : "No analysis available");

    const responseData = {
      analysis: analysis.trim(),
      language,
      type,
      timestamp: new Date().toISOString(),
    };

    // Cache the successful response
    apiOptimizer.setCache(cacheKey, responseData, "analysis");

    res.json(responseData);
  } catch (error) {
    console.error("Error in AI analysis:", error);

    const { language = "en" } = req.body; // Ensure language is available in catch block

    let errorMessage = "AI analysis failed";
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        errorMessage = "AI analysis timeout";
      } else {
        errorMessage = error.message;
      }
    }

    res.status(500).json({
      error: errorMessage,
      analysis:
        language === "ar"
          ? "تحليل الذكاء الاصطناعي غير متاح حاليًا"
          : "AI analysis currently unavailable",
    });
  }
};

// Translation endpoint using OpenAI
export const handleTranslation: RequestHandler = async (req, res) => {
  const openaiApiKey = process.env.OPENAI_API_KEY;

  try {
    const { text, targetLanguage = "ar" } = req.body;

    console.log(`[TRANSLATION] Request received:`, {
      text: text?.substring(0, 50) + '...',
      targetLanguage,
      hasApiKey: !!openaiApiKey
    });

    if (!text) {
      console.warn('[TRANSLATION] Missing text in request body');
      return res.status(400).json({
        error: "Text is required for translation",
        translatedText: "",
      });
    }

    if (!openaiApiKey) {
      console.error('[TRANSLATION] OpenAI API key not configured');
      const errorMessage = targetLanguage === "ar"
        ? "مفتاح OpenAI غير مُعدّ. لا يمكن تقديم الترجمة."
        : "OpenAI API key not configured. Translation unavailable.";
      return res.status(500).json({
        error: errorMessage,
        translatedText: text, // Return original text as fallback
      });
    }

    const prompt =
      targetLanguage === "ar"
        ? `Translate the following text to Arabic: "${text}"`
        : `Translate the following text to English: "${text}"`;

    console.log(`Translation request: ${targetLanguage}`);

    // Call OpenAI API
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 second timeout

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 200,
        temperature: 0.1,
      }),
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorBody = await response.text().catch(() => 'Could not read error response');
      console.error(`[TRANSLATION] OpenAI API error:`, {
        status: response.status,
        statusText: response.statusText,
        body: errorBody.substring(0, 200)
      });
      const errorMessage = req.body.targetLanguage === "ar"
        ? `خدمة الترجمة غير متاحة: ${response.status} ${response.statusText}`
        : `Translation service unavailable: ${response.status} ${response.statusText}`;
      return res.status(500).json({
        error: errorMessage,
        translatedText: text, // Return original text as fallback
      });
    }

    const data = await response.json();
    const translatedText = data.choices?.[0]?.message?.content || text;

    res.json({
      translatedText: translatedText.trim(),
      originalText: text,
      targetLanguage,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[TRANSLATION] Error in translation:", {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      text: req.body.text?.substring(0, 50) + '...'
    });

    const errorMessage = req.body.targetLanguage === "ar"
      ? `فشلت الترجمة: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`
      : `Translation failed: ${error instanceof Error ? error.message : 'Unknown error'}`;

    res.status(500).json({
      error: errorMessage,
      translatedText: req.body.text, // Return original text as fallback
    });
  }
};
