/**
 * EODHD Economic News/Events API Endpoint
 *
 * Fetches real-time economic news and events from EODHD API
 * This is the NEWS version that complements the calendar endpoint
 *
 * Documentation: https://eodhd.com/financial-apis/news-api/
 *
 * Query Parameters:
 * - s: Symbol to filter news (optional)
 * - from: Start date (YYYY-MM-DD)
 * - to: End date (YYYY-MM-DD)
 * - limit: Number of articles to return (default: 50)
 * - offset: Pagination offset (default: 0)
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";

interface NewsArticle {
  date: string;
  title: string;
  content: string;
  symbols?: string[];
  tags?: string[];
  link?: string;
  sentiment?: number;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  const apiKey = process.env.EODHD_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: "EODHD API key not configured",
      articles: [],
    });
  }

  try {
    // Extract query parameters
    const { s, from, to, limit = "50", offset = "0" } = req.query;

    // Build EODHD News API URL
    const apiUrl = new URL("https://eodhd.com/api/news");
    apiUrl.searchParams.append("api_token", apiKey);
    apiUrl.searchParams.append("fmt", "json");
    apiUrl.searchParams.append("limit", limit as string);
    apiUrl.searchParams.append("offset", offset as string);

    // Add optional filters
    if (s) {
      apiUrl.searchParams.append("s", s as string);
    }
    if (from) {
      apiUrl.searchParams.append("from", from as string);
    }
    if (to) {
      apiUrl.searchParams.append("to", to as string);
    }

    console.log(`Fetching EODHD news: ${apiUrl.toString()}`);

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

    const response = await fetch(apiUrl.toString(), {
      method: "GET",
      headers: {
        Accept: "application/json",
        "User-Agent": "Liirat-News/1.0",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error(
        `EODHD News API error: ${response.status} - ${response.statusText}`,
      );
      
      // Return empty array instead of mock data for 401/403 errors
      if (response.status === 401 || response.status === 403) {
        return res.status(200).json({
          articles: [],
          total: 0,
          message: "EODHD API access restricted - no mock data provided",
          filters: { s, from, to, limit, offset },
        });
      }
      
      return res.status(response.status).json({
        error: `EODHD News API Error: ${response.status} - ${response.statusText}`,
        articles: [],
      });
    }

    // Check if response is JSON
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      console.error(`EODHD News API returned non-JSON content: ${contentType}`);
      return res.status(500).json({
        error: "Invalid response format from EODHD News API",
        articles: [],
      });
    }

    const data = await response.json();

    // Transform EODHD response to our format
    const articles: NewsArticle[] = Array.isArray(data)
      ? data.map((article: any) => ({
          date: article.date || article.datetime || new Date().toISOString(),
          title: article.title || "Economic News Update",
          content: article.content || article.description || "",
          symbols: article.symbols || [],
          tags: article.tags || [],
          link: article.link || article.url,
          sentiment: article.sentiment || undefined,
        }))
      : [];

    res.status(200).json({
      articles,
      total: articles.length,
      filters: {
        s,
        from,
        to,
        limit,
        offset,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching EODHD news:", error);

    // Handle specific error types
    let errorMessage = "Failed to fetch economic news";
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        errorMessage = "Request timeout - EODHD News API took too long to respond";
      } else {
        errorMessage = error.message;
      }
    }

    // Return empty array instead of mock data on errors
    res.status(200).json({
      articles: [],
      total: 0,
      error: errorMessage,
      timestamp: new Date().toISOString(),
    });
  }
}
