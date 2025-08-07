import { RequestHandler } from "express";
import {
  apiOptimizer,
  generateCacheKey,
  getClientId,
} from "../utils/rate-limiter";

interface NewsArticle {
  id: string;
  date: string;
  title: string;
  content: string;
  category: string;
  symbols: string[];
  tags: string[];
  link?: string;
  source: string;
  importance: number;
  country?: string;
}

interface NewsFilters {
  category?: string;
  symbol?: string;
  tag?: string;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
}

export const handleRealtimeNews: RequestHandler = async (req, res) => {
  // Use the provided EODHD API key
  const apiKey = "6891e3b89ee5e1.29062933";

  try {
    // Extract query parameters
    const {
      category,
      symbol,
      tag,
      from,
      to,
      limit = "20",
      offset = "0",
      search,
    } = req.query;

    console.log("Real-time news request with filters:", {
      category,
      symbol,
      tag,
      from,
      to,
      limit,
      offset,
      search,
    });

    // Get client ID for rate limiting
    const clientId = getClientId(req);

    // Check rate limit
    if (!apiOptimizer.checkRateLimit(clientId, "news")) {
      return res.status(429).json({
        articles: [],
        total: 0,
        error: "Rate limit exceeded. Please try again later.",
        retryAfter: 60,
      });
    }

    // Generate cache key
    const cacheKey = generateCacheKey("news", {
      category,
      symbol,
      tag,
      from,
      to,
      limit,
      offset,
      search,
    });

    // Check cache first
    const cachedData = apiOptimizer.getCached(cacheKey, "news");
    if (cachedData) {
      return res.json(cachedData);
    }

    // Build EODHD News API URL
    const apiUrl = new URL("https://eodhd.com/api/news");
    apiUrl.searchParams.append("api_token", apiKey);
    apiUrl.searchParams.append("fmt", "json");

    // Set reasonable limits
    const newsLimit = Math.min(parseInt(limit as string) || 20, 100);
    const newsOffset = Math.max(parseInt(offset as string) || 0, 0);

    apiUrl.searchParams.append("limit", newsLimit.toString());
    apiUrl.searchParams.append("offset", newsOffset.toString());

    // Add symbol filter if provided
    if (symbol && symbol !== "all") {
      apiUrl.searchParams.append("s", symbol as string);
    }

    // Add date range filters
    if (from) {
      apiUrl.searchParams.append("from", from as string);
    } else {
      // Default to last 24 hours for real-time news
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const fromDate = yesterday.toISOString().split("T")[0];
      apiUrl.searchParams.append("from", fromDate);
    }

    if (to) {
      apiUrl.searchParams.append("to", to as string);
    }

    console.log(`Fetching EODHD real-time news: ${apiUrl.toString()}`);

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000); // 25 second timeout

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

      // Log response body for debugging
      try {
        const errorBody = await response.text();
        console.error("News API error response:", errorBody.substring(0, 500));
      } catch (e) {
        console.error("Could not read news API error response");
      }

      return res.status(200).json({
        articles: [],
        total: 0,
        error: `News API Error: ${response.status}`,
        filters: {
          category,
          symbol,
          tag,
          from,
          to,
          limit: newsLimit,
          offset: newsOffset,
        },
        timestamp: new Date().toISOString(),
      });
    }

    // Check if response is JSON
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      console.error(`EODHD News API returned non-JSON content: ${contentType}`);
      const textResponse = await response.text();
      console.error("Non-JSON news response:", textResponse.substring(0, 500));
      return res.status(500).json({
        error: "Invalid response format from News API",
        articles: [],
        total: 0,
      });
    }

    const data = await response.json();
    console.log(
      "Raw EODHD News response (first 2 items):",
      JSON.stringify(data.slice ? data.slice(0, 2) : data, null, 2),
    );

    // Transform EODHD response to our format
    const articles: NewsArticle[] = Array.isArray(data)
      ? data.map((article: any, index: number) =>
          transformNewsData(article, index),
        )
      : [];

    // Apply client-side filters for category, tag, and search
    let filteredArticles = articles;

    // Filter by category
    if (category && category !== "all") {
      const categoryLower = (category as string).toLowerCase();
      filteredArticles = filteredArticles.filter(
        (article) =>
          article.category.toLowerCase().includes(categoryLower) ||
          article.tags.some((tag) => tag.toLowerCase().includes(categoryLower)),
      );
    }

    // Filter by tag
    if (tag && tag !== "all") {
      const tagLower = (tag as string).toLowerCase();
      filteredArticles = filteredArticles.filter(
        (article) =>
          article.tags.some((articleTag) =>
            articleTag.toLowerCase().includes(tagLower),
          ) || article.category.toLowerCase().includes(tagLower),
      );
    }

    // Filter by search term
    if (search) {
      const searchLower = (search as string).toLowerCase();
      filteredArticles = filteredArticles.filter(
        (article) =>
          article.title.toLowerCase().includes(searchLower) ||
          article.content.toLowerCase().includes(searchLower) ||
          article.symbols.some((sym) =>
            sym.toLowerCase().includes(searchLower),
          ),
      );
    }

    // Sort by date (newest first)
    filteredArticles.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

    console.log(
      `Returning ${filteredArticles.length} filtered news articles out of ${articles.length} total`,
    );

    const responseData = {
      articles: filteredArticles,
      total: filteredArticles.length,
      availableCategories: [...new Set(articles.map((a) => a.category))],
      availableTags: [...new Set(articles.flatMap((a) => a.tags))].slice(0, 20), // Top 20 tags
      filters: {
        category,
        symbol,
        tag,
        from,
        to,
        limit: newsLimit,
        offset: newsOffset,
        search,
      },
      timestamp: new Date().toISOString(),
    };

    // Cache the successful response
    apiOptimizer.setCache(cacheKey, responseData, "news");

    res.json(responseData);
  } catch (error) {
    console.error("Error fetching real-time news:", error);

    // Handle specific error types
    let errorMessage = "Failed to fetch real-time news";
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        errorMessage = "Request timeout - News API took too long to respond";
      } else {
        errorMessage = error.message;
      }
    }

    res.status(200).json({
      articles: [],
      total: 0,
      error: errorMessage,
      timestamp: new Date().toISOString(),
    });
  }
};

function transformNewsData(article: any, index: number): NewsArticle {
  // Generate unique ID
  const id = article.id || `news_${Date.now()}_${index}`;

  // Parse date
  const date =
    article.date ||
    article.datetime ||
    article.published ||
    new Date().toISOString();

  // Extract title
  const title = article.title || article.headline || "Financial News Update";

  // Extract content
  const content =
    article.content || article.description || article.summary || "";

  // Extract symbols/tickers
  const symbols = Array.isArray(article.symbols)
    ? article.symbols
    : article.symbols
      ? [article.symbols]
      : article.tickers
        ? Array.isArray(article.tickers)
          ? article.tickers
          : [article.tickers]
        : [];

  // Extract tags
  const tags = Array.isArray(article.tags)
    ? article.tags
    : article.tags
      ? [article.tags]
      : article.keywords
        ? Array.isArray(article.keywords)
          ? article.keywords
          : [article.keywords]
        : [];

  // Determine category based on content and tags
  let category = article.category || "Financial";

  const titleLower = title.toLowerCase();
  const contentLower = content.toLowerCase();

  if (titleLower.includes("earnings") || contentLower.includes("earnings")) {
    category = "Earnings";
  } else if (
    titleLower.includes("central bank") ||
    titleLower.includes("fed") ||
    titleLower.includes("interest rate")
  ) {
    category = "Central Banks";
  } else if (
    titleLower.includes("inflation") ||
    titleLower.includes("cpi") ||
    titleLower.includes("ppi")
  ) {
    category = "Inflation";
  } else if (
    titleLower.includes("employment") ||
    titleLower.includes("jobs") ||
    titleLower.includes("unemployment")
  ) {
    category = "Labor";
  } else if (
    titleLower.includes("gdp") ||
    titleLower.includes("economic growth")
  ) {
    category = "Economic Indicators";
  } else if (
    titleLower.includes("crypto") ||
    titleLower.includes("bitcoin") ||
    titleLower.includes("ethereum")
  ) {
    category = "Cryptocurrency";
  } else if (
    titleLower.includes("forex") ||
    titleLower.includes("currency") ||
    symbols.some((s) => s.includes("USD"))
  ) {
    category = "Forex";
  }

  // Determine importance (1-3 scale)
  let importance = 2; // Default medium

  // High importance keywords
  if (
    titleLower.includes("breaking") ||
    titleLower.includes("urgent") ||
    titleLower.includes("alert") ||
    contentLower.includes("federal reserve") ||
    contentLower.includes("interest rate") ||
    contentLower.includes("inflation") ||
    symbols.length > 3 // Multiple symbols affected
  ) {
    importance = 3;
  }
  // Low importance keywords
  else if (
    titleLower.includes("preview") ||
    titleLower.includes("outlook") ||
    titleLower.includes("analysis") ||
    content.length < 200 // Short articles
  ) {
    importance = 1;
  }

  return {
    id,
    date,
    title,
    content: content.substring(0, 500) + (content.length > 500 ? "..." : ""), // Limit content length
    category,
    symbols,
    tags,
    link: article.link || article.url,
    source: article.source || "Liirat News",
    importance,
    country: article.country,
  };
}
