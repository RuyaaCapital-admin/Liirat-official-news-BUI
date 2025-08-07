import { RequestHandler } from "express";
import { EconomicEventsResponse, NewsResponse } from "@shared/api";

const EODHD_API_TOKEN = process.env.EODHD_API_KEY;

// EODHD API Token configured

export const getEconomicEvents: RequestHandler = async (req, res) => {
  if (!EODHD_API_TOKEN) {
    const result: EconomicEventsResponse = {
      events: [],
      error: "EODHD API key not configured",
    };
    return res.status(500).json(result);
  }

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
      console.error(`EODHD API returned status: ${response.status}`);
      const result: EconomicEventsResponse = {
        events: [],
        error: `EODHD API Error: ${response.status} - ${response.statusText}`,
      };
      return res.json(result);
    }

    // Check if response is JSON before parsing
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      console.error(`EODHD API returned non-JSON content: ${contentType}`);
      const result: EconomicEventsResponse = {
        events: [],
        error: "Invalid response format from EODHD API",
      };
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
    const result: EconomicEventsResponse = {
      events: [],
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch economic events",
    };
    res.json(result);
  }
};

export const getNews: RequestHandler = async (req, res) => {
  if (!EODHD_API_TOKEN) {
    return res.status(500).json({
      news: [],
      error: "EODHD API key not configured",
    });
  }

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
      console.error(`EODHD News API returned status: ${response.status}`);
      const result: NewsResponse = { news: [] };
      return res.json(result);
    }

    // Check if response is JSON before parsing
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      console.error(`EODHD News API returned non-JSON content: ${contentType}`);
      const result: NewsResponse = { news: [] };
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
    const result: NewsResponse = { news: [] };
    res.json(result);
  }
};
