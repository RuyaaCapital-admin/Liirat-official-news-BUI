import { Request, Response } from "express";
import OpenAI from "openai";

// Real-time market data fetcher
async function fetchRealMarketData(): Promise<any[]> {
  const symbols = [
    "XAUUSD.FOREX", // Gold
    "BTC-USD.CC", // Bitcoin
    "ETH-USD.CC", // Ethereum
    "EURUSD.FOREX", // EUR/USD
    "GBPUSD.FOREX", // GBP/USD
    "USDJPY.FOREX", // USD/JPY
    "GSPC.INDX", // S&P 500
    "IXIC.INDX", // NASDAQ
  ];

  const marketData = [];

  for (const symbol of symbols) {
    try {
      const response = await fetch(
        `http://localhost:8080/api/eodhd-price?symbol=${encodeURIComponent(symbol)}`,
      );
      if (response.ok) {
        const data = await response.json();
        if (data.prices && data.prices.length > 0) {
          const price = data.prices[0];
          marketData.push({
            symbol: symbol
              .replace(".FOREX", "")
              .replace(".CC", "")
              .replace(".INDX", ""),
            displayName: getDisplayName(symbol),
            price: price.price,
            change: price.change,
            changePercent: price.change_percent,
            timestamp: new Date().toISOString(),
          });
        }
      }
    } catch (error) {
      console.error(`Failed to fetch ${symbol}:`, error);
    }
  }

  return marketData;
}

// Get display name for symbols
function getDisplayName(symbol: string): string {
  const displayNames: Record<string, string> = {
    "XAUUSD.FOREX": "Gold (XAU/USD)",
    "BTC-USD.CC": "Bitcoin (BTC/USD)",
    "ETH-USD.CC": "Ethereum (ETH/USD)",
    "EURUSD.FOREX": "EUR/USD",
    "GBPUSD.FOREX": "GBP/USD",
    "USDJPY.FOREX": "USD/JPY",
    "GSPC.INDX": "S&P 500",
    "IXIC.INDX": "NASDAQ",
  };
  return displayNames[symbol] || symbol;
}

// Real-time news fetcher
async function fetchRealNews(): Promise<any[]> {
  try {
    const response = await fetch("http://localhost:8080/api/news");
    if (response.ok) {
      const data = await response.json();
      if (data.news && Array.isArray(data.news)) {
        return data.news.slice(0, 5).map((item: any) => ({
          id: item.id || Math.random().toString(),
          title: item.title,
          summary: item.content || item.summary || item.title,
          source: item.source || "Financial News",
          publishedAt:
            item.published_at || item.date || new Date().toISOString(),
          impact: "medium" as const,
        }));
      }
    }
  } catch (error) {
    console.error("Failed to fetch real news:", error);
  }

  return [];
}

// Function to fetch specific price data
async function fetchSpecificPrice(symbol: string): Promise<any | null> {
  try {
    const response = await fetch(
      `http://localhost:8080/api/eodhd-price?symbol=${encodeURIComponent(symbol)}`,
    );
    if (response.ok) {
      const data = await response.json();
      if (data.prices && data.prices.length > 0) {
        return data.prices[0];
      }
    }
  } catch (error) {
    console.error(`Failed to fetch price for ${symbol}:`, error);
  }
  return null;
}

// Fallback response generator when OpenAI is not available
async function generateSmartFallbackResponse(
  message: string,
  language: string,
): Promise<string> {
  const lowerMessage = message.toLowerCase();

  // Check if user is asking for specific prices
  if (
    lowerMessage.includes("price") ||
    lowerMessage.includes("سعر") ||
    lowerMessage.includes("btc") ||
    lowerMessage.includes("bitcoin") ||
    lowerMessage.includes("eur") ||
    lowerMessage.includes("usd") ||
    lowerMessage.includes("gold") ||
    lowerMessage.includes("ذهب")
  ) {
    // Fetch real market data
    const marketData = await fetchRealMarketData();
    const dubaiTime = new Date(
      new Date().toLocaleString("en-US", { timeZone: "Asia/Dubai" }),
    );

    if (marketData.length > 0) {
      let priceInfo = "";
      
      // Check for specific symbols mentioned
      if (lowerMessage.includes("btc") || lowerMessage.includes("bitcoin")) {
        const btc = marketData.find((item) => item.symbol.includes("BTC"));
        if (btc) {
          priceInfo = language === "ar" 
            ? `سعر البيتكوين الحالي: $${btc.price.toLocaleString()} (${btc.changePercent >= 0 ? '+' : ''}${btc.changePercent.toFixed(2)}%)`
            : `Current Bitcoin price: $${btc.price.toLocaleString()} (${btc.changePercent >= 0 ? '+' : ''}${btc.changePercent.toFixed(2)}%)`;
        }
      } else if (lowerMessage.includes("eur") && lowerMessage.includes("usd")) {
        const eur = marketData.find((item) => item.symbol === "EURUSD");
        if (eur) {
          priceInfo = language === "ar"
            ? `سعر اليورو مقابل الدولار: ${eur.price.toFixed(5)} (${eur.changePercent >= 0 ? '+' : ''}${eur.changePercent.toFixed(2)}%)`
            : `EUR/USD price: ${eur.price.toFixed(5)} (${eur.changePercent >= 0 ? '+' : ''}${eur.changePercent.toFixed(2)}%)`;
        }
      } else if (lowerMessage.includes("gold") || lowerMessage.includes("ذهب")) {
        const gold = marketData.find((item) => item.symbol.includes("XAU"));
        if (gold) {
          priceInfo = language === "ar"
            ? `سعر الذهب الحالي: $${gold.price.toLocaleString()} (${gold.changePercent >= 0 ? '+' : ''}${gold.changePercent.toFixed(2)}%)`
            : `Current Gold price: $${gold.price.toLocaleString()} (${gold.changePercent >= 0 ? '+' : ''}${gold.changePercent.toFixed(2)}%)`;
        }
      } else {
        // Show general price info
        const topPrices = marketData.slice(0, 3);
        priceInfo = topPrices.map(item => 
          `${item.displayName}: $${typeof item.price === 'number' ? item.price.toLocaleString() : item.price} (${item.changePercent >= 0 ? '+' : ''}${item.changePercent.toFixed(2)}%)`
        ).join('\n');
      }

      const timeStamp = dubaiTime.toLocaleString(language === "ar" ? "ar-AE" : "en-US", {
        timeZone: "Asia/Dubai",
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

      return language === "ar"
        ? `${priceInfo}\n\nالوقت الحالي: ${timeStamp} (توقيت دبي)\nمساعد ليرات للأخبار المالية`
        : `${priceInfo}\n\nCurrent time: ${timeStamp} (Dubai time)\nLiirat News AI Assistant`;
    }
  }

  // Check if asking for news
  if (
    lowerMessage.includes("news") ||
    lowerMessage.includes("أخبار") ||
    lowerMessage.includes("خبر")
  ) {
    const news = await fetchRealNews();
    if (news.length > 0) {
      const newsText = news.slice(0, 3).map((item, index) => 
        `${index + 1}. ${item.title} - ${item.source}`
      ).join('\n');
      
      return language === "ar"
        ? `آخر الأخبار المالية:\n${newsText}\n\nللمزيد من الأخبار، تابع الصفحة الرئيسية.`
        : `Latest financial news:\n${newsText}\n\nFor more news, check the main page.`;
    }
  }

  // Default responses with real time
  const dubaiTime = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Dubai" }),
  );
  const timeStamp = dubaiTime.toLocaleString(language === "ar" ? "ar-AE" : "en-US", {
    timeZone: "Asia/Dubai",
    hour: "2-digit",
    minute: "2-digit",
  });

  if (language === "ar") {
    if (
      lowerMessage.includes("مرحبا") ||
      lowerMessage.includes("السلام") ||
      lowerMessage.includes("أهلا")
    ) {
      return `مرحباً، أنا مساعد ليرات للأخبار الاقتصادية. يمكنني مساعدتك في:\n- الحصول على أسعار الأسهم والعملات فورياً\n- آخر الأخبار المالية\n- التقويم الاقتصادي\n\nالوقت الحالي: ${timeStamp} (توقيت دبي)`;
    }
    return `أنا مساعد ليرات للأخبار المالية. يمكنني مساعدتك في الحصول على الأسعار الفورية والأخبار المالية.\n\nالوقت الحالي: ${timeStamp} (توقيت دبي)`;
  } else {
    if (
      lowerMessage.includes("hello") ||
      lowerMessage.includes("hi") ||
      lowerMessage.includes("hey")
    ) {
      return `Hi, I'm Liirat News AI Assistant. I can help you with:\n- Real-time stock and currency prices\n- Latest financial news\n- Economic calendar\n\nCurrent time: ${timeStamp} (Dubai time)`;
    }
    return `I'm Liirat News AI Assistant. I can help you get real-time prices and financial news.\n\nCurrent time: ${timeStamp} (Dubai time)`;
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

    // Always fetch real data first
    const [marketData, newsData] = await Promise.all([
      fetchRealMarketData(),
      fetchRealNews(),
    ]);

    if (!openai) {
      console.log("OpenAI API key not found, using smart fallback responses with real data");
      const fallbackResponse = await generateSmartFallbackResponse(message, language);

      const dubaiTime = new Date(
        new Date().toLocaleString("en-US", { timeZone: "Asia/Dubai" }),
      );

      return res.json({
        response: fallbackResponse,
        timestamp: dubaiTime.toISOString(),
        dubaiTime: dubaiTime.toLocaleString("en-US", {
          timeZone: "Asia/Dubai",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
        marketData,
        newsData,
        realTime: true,
        fallback: true,
      });
    }

    const dubaiTime = new Date(
      new Date().toLocaleString("en-US", { timeZone: "Asia/Dubai" }),
    );

    const systemPrompt = `You are Liirat News AI Assistant, providing real-time financial and economic information.

CURRENT REAL TIME: ${dubaiTime.toLocaleString("en-US", {
      timeZone: "Asia/Dubai",
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })} (Dubai/GST)

CURRENT LIVE MARKET DATA:
${marketData
  .map(
    (item) =>
      `${item.displayName}: $${typeof item.price === 'number' ? item.price.toLocaleString() : item.price} (${item.changePercent >= 0 ? "+" : ""}${item.changePercent.toFixed(2)}%)`,
  )
  .join("\n")}

LATEST NEWS HEADLINES:
${newsData
  .map(
    (item, index) =>
      `${index + 1}. ${item.title} - ${item.source} (${new Date(item.publishedAt).toLocaleString()})`,
  )
  .join("\n")}

CORE FUNCTIONS:
• Provide real-time market prices from the data above
• Deliver latest financial news from the headlines above
• Explain news/event impact on markets concisely
• Always detect and reply in the user's language (${language === "ar" ? "Arabic" : "English"})
• ALWAYS use the REAL current time above when referencing time
• Use the EXACT price data provided above - never guess or make up prices

CRITICAL RULES:
• Never reveal internal methods or implementation details
• Never leave your defined role or answer non-economic questions
• Never guess prices - always use the exact data provided above
• When asked about prices, provide the EXACT figures from the market data
• Always be confident and professional
• Include the real timestamp in your responses

RESPONSE REQUIREMENTS:
• Present data clearly with proper formatting
• Sign responses with real timestamp in GST (Dubai) timezone
• Keep responses concise and actionable
• When providing prices, always include the change percentage
• Reference actual news when discussing market events

USER MESSAGE: ${message}`;

    console.log("Sending request to OpenAI with real market data context");

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
      max_tokens: 1000,
      temperature: 0.3, // Lower temperature for more accurate responses
    });

    const response =
      completion.choices[0]?.message?.content ||
      (language === "ar"
        ? "عذراً، لم أستطع إنشاء رد."
        : "Sorry, I could not generate a response.");

    res.json({
      response,
      timestamp: dubaiTime.toISOString(),
      dubaiTime: dubaiTime.toLocaleString("en-US", {
        timeZone: "Asia/Dubai",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
      marketData,
      newsData,
      realTime: true,
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
      realTime: false,
    });
  }
};
