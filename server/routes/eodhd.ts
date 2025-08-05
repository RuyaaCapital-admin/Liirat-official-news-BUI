import { RequestHandler } from "express";
import { EconomicEventsResponse, NewsResponse } from "@shared/api";

// Fallback mock data when API fails
const getMockEvents = () => [
  {
    date: new Date().toISOString().split("T")[0],
    time: "08:30",
    country: "US",
    event: "Consumer Price Index (CPI)",
    category: "Inflation",
    importance: 3,
    actual: "",
    forecast: "0.3%",
    previous: "0.2%",
  },
  {
    date: new Date().toISOString().split("T")[0],
    time: "14:00",
    country: "EU",
    event: "ECB Interest Rate Decision",
    category: "Central Bank",
    importance: 3,
    actual: "",
    forecast: "4.25%",
    previous: "4.25%",
  },
];

const getMockNews = () => [
  {
    title: "Market Update: Trading Activity Today",
    content:
      "Market overview and key developments affecting financial markets.",
    link: "#",
    symbols: ["SPX", "EUR", "USD"],
    tags: ["market", "trading"],
    date: new Date().toISOString(),
    sentiment: {
      polarity: 0,
      label: "neutral" as const,
    },
  },
];

const EODHD_API_TOKEN =
  process.env.NEXT_PUBLIC_EODHD_API_KEY ||
  process.env.EODHD_API_TOKEN ||
  "demo"; // Use demo token as fallback

// EODHD API Token configured

export const getEconomicEvents: RequestHandler = async (req, res) => {
  try {
    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout for serverless

    const response = await fetch(
      `https://eodhd.com/api/economic-events?api_token=${EODHD_API_TOKEN}&fmt=json&limit=20`,
      {
        signal: controller.signal,
        headers: {
          "User-Agent": "LiiratApp/1.0",
        },
      },
    );
    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`EODHD API returned status: ${response.status}`);
      // Return mock events instead of empty
      const result: EconomicEventsResponse = { events: getMockEvents() };
      return res.json(result);
    }

    // Check if response is JSON before parsing
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      console.warn(`EODHD API returned non-JSON content: ${contentType}`);
      const result: EconomicEventsResponse = { events: getMockEvents() };
      return res.json(result);
    }

    const data = await response.json();

    // Transform the data to match our interface
    const events = Array.isArray(data)
      ? data.map((event: any) => ({
          date: event.date || new Date().toISOString().split("T")[0],
          time: event.time || "",
          country: event.country || "",
          event: event.event || event.title || "",
          category: event.category || "",
          importance: event.importance || 1,
          actual: event.actual || "",
          forecast: event.forecast || "",
          previous: event.previous || "",
        }))
      : [];

    const result: EconomicEventsResponse = { events };
    res.json(result);
  } catch (error) {
    console.error("Error fetching economic events:", error);
    // Return mock data instead of empty array
    const result: EconomicEventsResponse = { events: getMockEvents() };
    res.json(result);
  }
};

export const getNews: RequestHandler = async (req, res) => {
  try {
    const offset = req.query.offset || "0";
    const limit = req.query.limit || "20";

    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout for serverless

    const response = await fetch(
      `https://eodhd.com/api/news?offset=${offset}&limit=${limit}&api_token=${EODHD_API_TOKEN}&fmt=json`,
      {
        signal: controller.signal,
        headers: {
          "User-Agent": "LiiratApp/1.0",
        },
      },
    );
    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`EODHD News API returned status: ${response.status}`);
      // Return mock news instead of empty
      const result: NewsResponse = { news: getMockNews() };
      return res.json(result);
    }

    // Check if response is JSON before parsing
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      console.warn(`EODHD News API returned non-JSON content: ${contentType}`);
      const result: NewsResponse = { news: getMockNews() };
      return res.json(result);
    }

    const data = await response.json();

    // Transform the data to match our interface
    const news = Array.isArray(data)
      ? data.map((article: any) => ({
          title: article.title || "",
          content: article.content || article.summary || "",
          link: article.link || article.url || "",
          symbols: article.symbols || [],
          tags: article.tags || [],
          date: article.date || new Date().toISOString(),
          sentiment: article.sentiment
            ? {
                polarity: article.sentiment.polarity || 0,
                label: article.sentiment.label || "neutral",
              }
            : undefined,
        }))
      : [];

    const result: NewsResponse = { news };
    res.json(result);
  } catch (error) {
    console.error("Error fetching news:", error);
    // Return mock data instead of empty array
    const result: NewsResponse = { news: getMockNews() };
    res.json(result);
  }
};
