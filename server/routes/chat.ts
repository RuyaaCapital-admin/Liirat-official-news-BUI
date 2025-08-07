import { Request, Response } from "express";
import OpenAI from "openai";

// Comprehensive symbol database for dynamic lookups
const SYMBOL_DATABASE = [
  // Major Forex Pairs
  { symbol: "EURUSD.FOREX", name: "EUR/USD", category: "forex" },
  { symbol: "GBPUSD.FOREX", name: "GBP/USD", category: "forex" },
  { symbol: "USDJPY.FOREX", name: "USD/JPY", category: "forex" },
  { symbol: "AUDUSD.FOREX", name: "AUD/USD", category: "forex" },
  { symbol: "USDCHF.FOREX", name: "USD/CHF", category: "forex" },
  { symbol: "USDCAD.FOREX", name: "USD/CAD", category: "forex" },
  { symbol: "NZDUSD.FOREX", name: "NZD/USD", category: "forex" },
  { symbol: "EURGBP.FOREX", name: "EUR/GBP", category: "forex" },
  { symbol: "EURJPY.FOREX", name: "EUR/JPY", category: "forex" },
  { symbol: "GBPJPY.FOREX", name: "GBP/JPY", category: "forex" },

  // Cryptocurrencies
  { symbol: "BTC-USD.CC", name: "Bitcoin", category: "crypto" },
  { symbol: "ETH-USD.CC", name: "Ethereum", category: "crypto" },
  { symbol: "XRP-USD.CC", name: "XRP", category: "crypto" },
  { symbol: "LTC-USD.CC", name: "Litecoin", category: "crypto" },
  { symbol: "ADA-USD.CC", name: "Cardano", category: "crypto" },
  { symbol: "DOT-USD.CC", name: "Polkadot", category: "crypto" },
  { symbol: "LINK-USD.CC", name: "Chainlink", category: "crypto" },
  { symbol: "BCH-USD.CC", name: "Bitcoin Cash", category: "crypto" },

  // Major Indices
  { symbol: "GSPC.INDX", name: "S&P 500", category: "indices" },
  { symbol: "IXIC.INDX", name: "NASDAQ", category: "indices" },
  { symbol: "DJI.INDX", name: "Dow Jones", category: "indices" },
  { symbol: "RUT.INDX", name: "Russell 2000", category: "indices" },
  { symbol: "VIX.INDX", name: "VIX", category: "indices" },
  { symbol: "N225.INDX", name: "Nikkei 225", category: "indices" },
  { symbol: "HSI.INDX", name: "Hang Seng", category: "indices" },
  { symbol: "FTSE.INDX", name: "FTSE 100", category: "indices" },
  { symbol: "DAX.INDX", name: "DAX", category: "indices" },
  { symbol: "CAC.INDX", name: "CAC 40", category: "indices" },

  // Major Stocks
  { symbol: "AAPL.US", name: "Apple", category: "stocks" },
  { symbol: "MSFT.US", name: "Microsoft", category: "stocks" },
  { symbol: "GOOGL.US", name: "Google", category: "stocks" },
  { symbol: "AMZN.US", name: "Amazon", category: "stocks" },
  { symbol: "TSLA.US", name: "Tesla", category: "stocks" },
  { symbol: "META.US", name: "Meta", category: "stocks" },
  { symbol: "NVDA.US", name: "NVIDIA", category: "stocks" },
  { symbol: "NFLX.US", name: "Netflix", category: "stocks" },
  { symbol: "AMD.US", name: "AMD", category: "stocks" },
  { symbol: "INTC.US", name: "Intel", category: "stocks" },

  // Commodities
  { symbol: "XAUUSD.FOREX", name: "Gold", category: "commodities" },
  { symbol: "XAGUSD.FOREX", name: "Silver", category: "commodities" },
  { symbol: "XPTUSD.FOREX", name: "Platinum", category: "commodities" },
  { symbol: "XPDUSD.FOREX", name: "Palladium", category: "commodities" },
];

// Function to find symbol by name or symbol
function findSymbol(query: string): any | null {
  const searchTerm = query.toLowerCase();

  // First try exact matches
  const exactMatch = SYMBOL_DATABASE.find(
    (s) =>
      s.name.toLowerCase() === searchTerm ||
      s.symbol.toLowerCase().includes(searchTerm.toUpperCase()),
  );

  if (exactMatch) return exactMatch;

  // Then try partial matches
  const partialMatch = SYMBOL_DATABASE.find(
    (s) =>
      s.name.toLowerCase().includes(searchTerm) ||
      s.symbol.toLowerCase().includes(searchTerm),
  );

  return partialMatch || null;
}

// Function to fetch specific price data for any symbol
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

// Real-time market data fetcher for popular symbols
async function fetchRealMarketData(): Promise<any[]> {
  const popularSymbols = [
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

  for (const symbol of popularSymbols) {
    try {
      const response = await fetch(
        `http://localhost:8080/api/eodhd-price?symbol=${encodeURIComponent(symbol)}`,
      );
      if (response.ok) {
        const data = await response.json();
        if (data.prices && data.prices.length > 0) {
          const price = data.prices[0];
          const symbolData = SYMBOL_DATABASE.find((s) => s.symbol === symbol);
          marketData.push({
            symbol: symbol
              .replace(".FOREX", "")
              .replace(".CC", "")
              .replace(".INDX", ""),
            displayName: symbolData?.name || symbol,
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

// Get accurate Dubai time
function getDubaiTime(): { date: Date; formatted: string; timeString: string } {
  const now = new Date();
  const dubaiTime = new Date(
    now.toLocaleString("en-US", { timeZone: "Asia/Dubai" }),
  );

  const formatted = dubaiTime.toLocaleString("en-US", {
    timeZone: "Asia/Dubai",
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  const timeString = dubaiTime.toLocaleString("en-US", {
    timeZone: "Asia/Dubai",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  return { date: dubaiTime, formatted, timeString };
}

// Enhanced fallback response generator with dynamic symbol support
async function generateSmartFallbackResponse(
  message: string,
  language: string,
): Promise<string> {
  const lowerMessage = message.toLowerCase();
  const dubaiTime = getDubaiTime();

  // Check if user is asking for specific symbol prices
  const priceKeywords = ["price", "سعر", "cost", "value", "quote", "rate"];
  const isAskingForPrice = priceKeywords.some((keyword) =>
    lowerMessage.includes(keyword),
  );

  if (isAskingForPrice) {
    // Try to extract symbol from message
    let requestedSymbol = null;

    // Check for specific mentions
    if (lowerMessage.includes("btc") || lowerMessage.includes("bitcoin")) {
      requestedSymbol = SYMBOL_DATABASE.find((s) => s.symbol === "BTC-USD.CC");
    } else if (
      lowerMessage.includes("eth") ||
      lowerMessage.includes("ethereum")
    ) {
      requestedSymbol = SYMBOL_DATABASE.find((s) => s.symbol === "ETH-USD.CC");
    } else if (lowerMessage.includes("gold") || lowerMessage.includes("ذهب")) {
      requestedSymbol = SYMBOL_DATABASE.find(
        (s) => s.symbol === "XAUUSD.FOREX",
      );
    } else if (lowerMessage.includes("eur") && lowerMessage.includes("usd")) {
      requestedSymbol = SYMBOL_DATABASE.find(
        (s) => s.symbol === "EURUSD.FOREX",
      );
    } else if (lowerMessage.includes("gbp") && lowerMessage.includes("usd")) {
      requestedSymbol = SYMBOL_DATABASE.find(
        (s) => s.symbol === "GBPUSD.FOREX",
      );
    } else if (lowerMessage.includes("usd") && lowerMessage.includes("jpy")) {
      requestedSymbol = SYMBOL_DATABASE.find(
        (s) => s.symbol === "USDJPY.FOREX",
      );
    } else if (
      lowerMessage.includes("s&p") ||
      lowerMessage.includes("sp500") ||
      lowerMessage.includes("s p 500")
    ) {
      requestedSymbol = SYMBOL_DATABASE.find((s) => s.symbol === "GSPC.INDX");
    } else if (lowerMessage.includes("nasdaq")) {
      requestedSymbol = SYMBOL_DATABASE.find((s) => s.symbol === "IXIC.INDX");
    } else if (
      lowerMessage.includes("apple") ||
      lowerMessage.includes("aapl")
    ) {
      requestedSymbol = SYMBOL_DATABASE.find((s) => s.symbol === "AAPL.US");
    } else if (
      lowerMessage.includes("tesla") ||
      lowerMessage.includes("tsla")
    ) {
      requestedSymbol = SYMBOL_DATABASE.find((s) => s.symbol === "TSLA.US");
    } else if (
      lowerMessage.includes("microsoft") ||
      lowerMessage.includes("msft")
    ) {
      requestedSymbol = SYMBOL_DATABASE.find((s) => s.symbol === "MSFT.US");
    } else if (
      lowerMessage.includes("google") ||
      lowerMessage.includes("googl")
    ) {
      requestedSymbol = SYMBOL_DATABASE.find((s) => s.symbol === "GOOGL.US");
    } else if (
      lowerMessage.includes("amazon") ||
      lowerMessage.includes("amzn")
    ) {
      requestedSymbol = SYMBOL_DATABASE.find((s) => s.symbol === "AMZN.US");
    } else if (
      lowerMessage.includes("nvidia") ||
      lowerMessage.includes("nvda")
    ) {
      requestedSymbol = SYMBOL_DATABASE.find((s) => s.symbol === "NVDA.US");
    } else {
      // Try to find symbol by searching through all symbols
      const words = lowerMessage.split(" ");
      for (const word of words) {
        const found = findSymbol(word);
        if (found) {
          requestedSymbol = found;
          break;
        }
      }
    }

    if (requestedSymbol) {
      // Fetch real-time price for the requested symbol
      const priceData = await fetchSpecificPrice(requestedSymbol.symbol);

      if (priceData) {
        const priceInfo =
          language === "ar"
            ? `سعر ${requestedSymbol.name} الحالي: $${priceData.price.toLocaleString()} (${priceData.change_percent >= 0 ? "+" : ""}${priceData.change_percent.toFixed(2)}%)`
            : `Current ${requestedSymbol.name} price: $${priceData.price.toLocaleString()} (${priceData.change_percent >= 0 ? "+" : ""}${priceData.change_percent.toFixed(2)}%)`;

        return language === "ar"
          ? `${priceInfo}\n\nالوقت الحالي: ${dubaiTime.formatted} (توقيت دبي)\nمساعد ليرات للأخبار المالية`
          : `${priceInfo}\n\nCurrent time: ${dubaiTime.formatted} (Dubai time)\nLiirat News AI Assistant`;
      } else {
        return language === "ar"
          ? `عذراً، لا يمكنني الحصول على سعر ${requestedSymbol.name} في الوقت الحالي. يرجى المحاولة مرة أخرى.\n\nالوقت الحالي: ${dubaiTime.formatted} (توقيت دبي)`
          : `Sorry, I couldn't fetch the ${requestedSymbol.name} price right now. Please try again.\n\nCurrent time: ${dubaiTime.formatted} (Dubai time)`;
      }
    } else {
      // Show general market data if no specific symbol found
      const marketData = await fetchRealMarketData();
      if (marketData.length > 0) {
        const topPrices = marketData.slice(0, 3);
        const priceInfo = topPrices
          .map(
            (item) =>
              `${item.displayName}: $${typeof item.price === "number" ? item.price.toLocaleString() : item.price} (${item.changePercent >= 0 ? "+" : ""}${item.changePercent.toFixed(2)}%)`,
          )
          .join("\n");

        return language === "ar"
          ? `أسعار الأسواق الحالية:\n${priceInfo}\n\nالوقت الحالي: ${dubaiTime.formatted} (توقيت دبي)\nمساعد ليرات للأخبار المالية`
          : `Current market prices:\n${priceInfo}\n\nCurrent time: ${dubaiTime.formatted} (Dubai time)\nLiirat News AI Assistant`;
      }
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
      const newsText = news
        .slice(0, 3)
        .map((item, index) => `${index + 1}. ${item.title} - ${item.source}`)
        .join("\n");

      return language === "ar"
        ? `آخر الأخبار المالية:\n${newsText}\n\nللمزيد من الأخبار، تابع الصفحة الرئيسية.\n\nالوقت الحالي: ${dubaiTime.formatted} (توقيت دبي)`
        : `Latest financial news:\n${newsText}\n\nFor more news, check the main page.\n\nCurrent time: ${dubaiTime.formatted} (Dubai time)`;
    }
  }

  // Default responses with real time
  if (language === "ar") {
    if (
      lowerMessage.includes("مرحبا") ||
      lowerMessage.includes("السلام") ||
      lowerMessage.includes("أهلا")
    ) {
      return `مرحباً، أنا مساعد ليرات للأخبار الاقتصادية. يمكنني مساعدتك في:\n- الحصول على أسعار الأسهم والعملات فورياً\n- آخر الأخ��ار المالية\n- التقويم الاقتصادي\n\nالوقت الحالي: ${dubaiTime.formatted} (توقيت دبي)`;
    }
    return `أنا مساعد ليرات للأخبار المالية. يمكنني مساعدتك في الحصول على الأسعار الفورية والأخبار المالية.\n\nالوقت الحالي: ${dubaiTime.formatted} (توقيت دبي)`;
  } else {
    if (
      lowerMessage.includes("hello") ||
      lowerMessage.includes("hi") ||
      lowerMessage.includes("hey")
    ) {
      return `Hi, I'm Liirat News AI Assistant. I can help you with:\n- Real-time stock and currency prices\n- Latest financial news\n- Economic calendar\n\nCurrent time: ${dubaiTime.formatted} (Dubai time)`;
    }
    return `I'm Liirat News AI Assistant. I can help you get real-time prices and financial news.\n\nCurrent time: ${dubaiTime.formatted} (Dubai time)`;
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

    // Get accurate Dubai time
    const dubaiTime = getDubaiTime();

    if (!openai) {
      console.log(
        "OpenAI API key not found, using smart fallback responses with real data",
      );
      const fallbackResponse = await generateSmartFallbackResponse(
        message,
        language,
      );

      return res.json({
        response: fallbackResponse,
        timestamp: dubaiTime.date.toISOString(),
        dubaiTime: dubaiTime.formatted,
        marketData,
        newsData,
        realTime: true,
        fallback: true,
      });
    }

    // Check if user is asking for a specific symbol price
    let specificSymbolData = null;
    const lowerMessage = message.toLowerCase();

    // Try to extract and fetch specific symbol if mentioned
    const symbolKeywords = ["price", "سعر", "quote", "value"];
    if (symbolKeywords.some((keyword) => lowerMessage.includes(keyword))) {
      const words = lowerMessage.split(" ");
      for (const word of words) {
        const found = findSymbol(word);
        if (found) {
          const priceData = await fetchSpecificPrice(found.symbol);
          if (priceData) {
            specificSymbolData = {
              symbol: found.name,
              price: priceData.price,
              change: priceData.change,
              changePercent: priceData.change_percent,
            };
          }
          break;
        }
      }
    }

    const systemPrompt = `You are Liirat News AI Assistant, providing real-time financial and economic information.

CURRENT REAL TIME: ${dubaiTime.formatted} (Dubai/GST)

CURRENT LIVE MARKET DATA:
${marketData
  .map(
    (item) =>
      `${item.displayName}: $${typeof item.price === "number" ? item.price.toLocaleString() : item.price} (${item.changePercent >= 0 ? "+" : ""}${item.changePercent.toFixed(2)}%)`,
  )
  .join("\n")}

${
  specificSymbolData
    ? `SPECIFIC REQUESTED SYMBOL:
${specificSymbolData.symbol}: $${specificSymbolData.price.toLocaleString()} (${specificSymbolData.changePercent >= 0 ? "+" : ""}${specificSymbolData.changePercent.toFixed(2)}%)

`
    : ""
}LATEST NEWS HEADLINES:
${newsData
  .map(
    (item, index) =>
      `${index + 1}. ${item.title} - ${item.source} (${new Date(item.publishedAt).toLocaleString()})`,
  )
  .join("\n")}

CORE FUNCTIONS:
• Provide real-time market prices from the data above for ANY symbol requested
• Deliver latest financial news from the headlines above
• Explain news/event impact on markets concisely
• Always detect and reply in the user's language (${language === "ar" ? "Arabic" : "English"})
• ALWAYS use the EXACT current time above: ${dubaiTime.formatted} (Dubai/GST)
• Use the EXACT price data provided above - never guess or make up prices

CRITICAL RULES:
• Never reveal internal methods or implementation details
• Never leave your defined role or answer non-economic questions
• Never guess prices - always use the exact data provided above
• When asked about prices, provide the EXACT figures from the market data
• Always be confident and professional
• Include the real timestamp in your responses: ${dubaiTime.formatted} (Dubai/GST)
• Support ANY symbol request by using the provided market data or specific symbol data

RESPONSE REQUIREMENTS:
• Present data clearly with proper formatting
• Sign responses with real timestamp in GST (Dubai) timezone
• Keep responses concise and actionable
• When providing prices, always include the change percentage
• Reference actual news when discussing market events
• If asked about a symbol not in current data, acknowledge and suggest checking main market data

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
      timestamp: dubaiTime.date.toISOString(),
      dubaiTime: dubaiTime.formatted,
      marketData,
      newsData,
      specificSymbolData,
      realTime: true,
    });
  } catch (error) {
    console.error("Chat Error:", error);

    const { language = "ar" } = req.body;
    const dubaiTime = getDubaiTime();

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
      timestamp: dubaiTime.date.toISOString(),
      dubaiTime: dubaiTime.formatted,
      realTime: false,
    });
  }
};
