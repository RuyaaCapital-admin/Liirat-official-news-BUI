import { RequestHandler } from "express";
import { apiOptimizer, generateCacheKey, getClientId } from "../utils/rate-limiter";

// OpenAI integration for news/event analysis
export const handleAIAnalysis: RequestHandler = async (req, res) => {
  const openaiApiKey = "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";

  try {
    const { text, language = "en", type = "news" } = req.body;

    if (!text) {
      return res.status(400).json({
        error: "Text content is required for analysis",
      });
    }

    // Get client ID for rate limiting
    const clientId = getClientId(req);

    // Check rate limit
    if (!apiOptimizer.checkRateLimit(clientId, 'analysis')) {
      return res.status(429).json({
        error: "Rate limit exceeded. Please try again later.",
        analysis: language === "ar"
          ? "تجاوز الحد المسموح من الطلبات"
          : "Rate limit exceeded",
        retryAfter: 60
      });
    }

    // Generate cache key for AI analysis
    const cacheKey = generateCacheKey('analysis', {
      text: text.substring(0, 100), // Use first 100 chars for cache key
      language,
      type
    });

    // Check cache first
    const cachedData = apiOptimizer.getCached(cacheKey, 'analysis');
    if (cachedData) {
      return res.json(cachedData);
    }

    // Create analysis prompt based on type
    let prompt = "";
    if (type === "event") {
      prompt = `Give me a one-line summary of how this economic event might impact the market: "${text}"`;
    } else {
      prompt = `Give me a one-line summary of how this news might impact the market: "${text}"`;
    }

    // Add translation instruction for Arabic
    if (language === "ar") {
      prompt += " Please provide the response in Arabic.";
    }

    console.log(`AI Analysis request: ${type} analysis for ${language}`);

    // Call OpenAI API
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: "gpt-3.5-turbo", // Using cheapest model as requested
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 150,
        temperature: 0.3,
      }),
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error(`OpenAI API error: ${response.status} - ${response.statusText}`);
      const errorText = await response.text();
      console.error("OpenAI error response:", errorText);
      
      return res.status(500).json({
        error: "AI analysis temporarily unavailable",
        analysis: language === "ar" 
          ? "تحليل الذكاء الاصطناعي غير متاح حاليًا"
          : "AI analysis currently unavailable",
      });
    }

    const data = await response.json();
    const analysis = data.choices?.[0]?.message?.content || 
      (language === "ar" ? "لا يوجد تحليل متاح" : "No analysis available");

    res.json({
      analysis: analysis.trim(),
      language,
      type,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error("Error in AI analysis:", error);
    
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
      analysis: language === "ar" 
        ? "تحليل الذكاء الاصطناعي غير متاح حاليًا"
        : "AI analysis currently unavailable",
    });
  }
};

// Translation endpoint using OpenAI
export const handleTranslation: RequestHandler = async (req, res) => {
  const openaiApiKey = "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";

  try {
    const { text, targetLanguage = "ar" } = req.body;

    if (!text) {
      return res.status(400).json({
        error: "Text is required for translation",
      });
    }

    const prompt = targetLanguage === "ar" 
      ? `Translate the following text to Arabic: "${text}"`
      : `Translate the following text to English: "${text}"`;

    console.log(`Translation request: ${targetLanguage}`);

    // Call OpenAI API
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 second timeout

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
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
      console.error(`OpenAI Translation API error: ${response.status}`);
      return res.status(500).json({
        error: "Translation service unavailable",
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
    console.error("Error in translation:", error);
    
    res.status(500).json({
      error: "Translation failed",
      translatedText: req.body.text, // Return original text as fallback
    });
  }
};
