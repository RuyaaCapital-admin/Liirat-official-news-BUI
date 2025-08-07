import { Request, Response } from "express";
import OpenAI from "openai";
import axios from "axios";

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  : null;

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
        `/api/eodhd-price?symbol=${encodeURIComponent(symbol)}`,
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
    const response = await fetch("/api/news");
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

export const handleAIChat = async (req: Request, res: Response) => {
  try {
    const { message, context, language = "en" } = req.body;

    if (!message) {
      return res.status(400).json({
        error: language === "ar" ? "الرسالة مطلوبة" : "Message is required",
      });
    }

    if (!openai) {
      return res.status(500).json({
        error:
          language === "ar"
            ? "خدمة الذكاء الاصطناعي غير ��توفرة"
            : "AI service unavailable",
      });
    }

    // Fetch real-time data for context
    const [marketData, newsData] = await Promise.all([
      fetchRealMarketData(),
      fetchRealNews(),
    ]);

    const currentTime = new Date();
    const dubaiTime = new Date(
      currentTime.toLocaleString("en-US", { timeZone: "Asia/Dubai" }),
    );

    const systemPrompt = `You are Liirat News AI Assistant, providing real-time financial and economic information.

CURRENT REAL-TIME DATA (${dubaiTime.toISOString()}):

LIVE MARKET PRICES:
${marketData
  .map(
    (item) =>
      `${item.symbol}: $${item.price} (${item.change >= 0 ? "+" : ""}${item.changePercent.toFixed(2)}%)`,
  )
  .join("\n")}

LATEST NEWS HEADLINES:
${newsData
  .map(
    (item, index) =>
      `${index + 1}. ${item.title} - ${item.source} (${new Date(item.publishedAt).toLocaleString()})`,
  )
  .join("\n")}

INSTRUCTIONS:
- Always use REAL current time: ${dubaiTime.toLocaleString()} (Dubai/GST)
- Use the REAL market data above - never make up prices
- Reference actual news when discussing market events
- Respond in ${language === "ar" ? "Arabic" : "English"}
- Be concise and professional
- If asked about prices, use the exact data above
- If asked about news, reference the headlines above
- Never guess or make up information

USER MESSAGE: ${message}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
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
        ? "عذراً، لم ��ستطع إنشاء رد."
        : "Sorry, I could not generate a response.");

    res.json({
      response,
      timestamp: dubaiTime.toISOString(),
      marketData,
      newsData,
      realTime: true,
    });
  } catch (error) {
    console.error("AI Chat Error:", error);

    const { language = "ar" } = req.body;
    const errorMessage =
      language === "ar"
        ? "عذراً، أواجه صعوبات تقنية. يرجى المحاولة مرة أخرى."
        : "Sorry, I'm experiencing technical difficulties. Please try again.";

    res.status(500).json({
      error: "Failed to process AI chat request",
      response: errorMessage,
      realTime: false,
    });
  }
};

export const handleMarketData = async (req: Request, res: Response) => {
  try {
    const realMarketData = await fetchRealMarketData();

    res.json({
      data: realMarketData,
      timestamp: new Date().toISOString(),
      total: realMarketData.length,
      realTime: true,
    });
  } catch (error) {
    console.error("Market data error:", error);
    res.status(500).json({
      error: "Failed to fetch market data",
      data: [],
      realTime: false,
    });
  }
};

export const handleNews = async (req: Request, res: Response) => {
  try {
    const realNews = await fetchRealNews();

    res.json({
      news: realNews,
      timestamp: new Date().toISOString(),
      total: realNews.length,
      realTime: true,
    });
  } catch (error) {
    console.error("News fetch error:", error);
    res.status(500).json({
      error: "Failed to fetch news",
      news: [],
      realTime: false,
    });
  }
};

export const handleChartIndicator = async (req: Request, res: Response) => {
  try {
    const { symbol, indicator, period = "daily" } = req.body;

    if (!symbol || !indicator) {
      return res.status(400).json({
        error: "Symbol and indicator are required",
      });
    }

    // Fetch real price data for the symbol
    const response = await fetch(
      `/api/eodhd-price?symbol=${encodeURIComponent(symbol)}`,
    );
    const data = await response.json();

    if (!data.prices || data.prices.length === 0) {
      return res.status(404).json({
        error: "No price data found for symbol",
        symbol,
      });
    }

    const price = data.prices[0];

    // Generate technical analysis based on real data
    const analysis = {
      symbol,
      indicator,
      period,
      currentPrice: price.price,
      change: price.change,
      changePercent: price.change_percent,
      timestamp: new Date().toISOString(),
      signal:
        price.change_percent > 1
          ? "BUY"
          : price.change_percent < -1
            ? "SELL"
            : "HOLD",
      strength: Math.abs(price.change_percent) > 2 ? "STRONG" : "MODERATE",
    };

    res.json({
      analysis,
      realTime: true,
    });
  } catch (error) {
    console.error("Chart indicator error:", error);
    res.status(500).json({
      error: "Failed to generate chart indicator",
      realTime: false,
    });
  }
};

export const handleTechnicalAnalysis = async (req: Request, res: Response) => {
  try {
    const { symbol, timeframe = "1d" } = req.body;

    if (!symbol) {
      return res.status(400).json({
        error: "Symbol is required",
      });
    }

    // Fetch real market data
    const response = await fetch(
      `/api/eodhd-price?symbol=${encodeURIComponent(symbol)}`,
    );
    const data = await response.json();

    if (!data.prices || data.prices.length === 0) {
      return res.status(404).json({
        error: "No price data found for symbol",
        symbol,
      });
    }

    const price = data.prices[0];

    // Generate technical analysis based on real data
    const analysis = {
      symbol,
      timeframe,
      price: price.price,
      change: price.change,
      changePercent: price.change_percent,
      trend: price.change_percent > 0 ? "UPTREND" : "DOWNTREND",
      momentum: Math.abs(price.change_percent) > 1 ? "HIGH" : "LOW",
      support: price.price * 0.98, // Simple support calculation
      resistance: price.price * 1.02, // Simple resistance calculation
      recommendation:
        price.change_percent > 2
          ? "STRONG BUY"
          : price.change_percent > 0.5
            ? "BUY"
            : price.change_percent < -2
              ? "STRONG SELL"
              : price.change_percent < -0.5
                ? "SELL"
                : "HOLD",
      timestamp: new Date().toISOString(),
      confidence: "HIGH", // Based on real data
    };

    res.json({
      analysis,
      realTime: true,
    });
  } catch (error) {
    console.error("Technical analysis error:", error);
    res.status(500).json({
      error: "Failed to generate technical analysis",
      realTime: false,
    });
  }
};
