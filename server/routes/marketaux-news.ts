import { RequestHandler } from "express";
import { MarketauxNewsResponse } from "@shared/api";

export const handleMarketauxNews: RequestHandler = async (req, res) => {
  try {
    const {
      language = "en",
      countries = "us,gb,ae",
      limit = "3",
    } = req.query;

    // Get API key from environment variable
    const apiKey = process.env.MARKETAUX_API_KEY;
    if (!apiKey) {
      console.error("MARKETAUX_API_KEY environment variable not set");
      return res.status(500).json({
        error: "API configuration error",
        news: [],
      });
    }

    // Build API URL according to specifications
    const apiUrl = new URL("https://api.marketaux.com/v1/news/all");
    apiUrl.searchParams.append("countries", countries as string);
    apiUrl.searchParams.append("language", language as string);
    apiUrl.searchParams.append("limit", limit as string);
    apiUrl.searchParams.append("api_token", apiKey);

    console.log(`Fetching news for language: ${language}`);

    // Fetch data from Marketaux API
    const response = await fetch(apiUrl.toString(), {
      method: "GET",
      headers: {
        Accept: "application/json",
        "User-Agent": "Liirat-News/1.0",
      },
    });

    if (!response.ok) {
      console.error(
        `News API error: ${response.status} - ${response.statusText}`,
      );
      return res.status(response.status).json({
        error: `API request failed: ${response.statusText}`,
        news: [],
      });
    }

    const data = await response.json();

    // Transform Marketaux data to our format
    const transformedNews = (data.data || []).map(
      (item: any, index: number) => {
        // Extract country/currency from entities
        const entity = item.entities?.[0];
        const country = entity?.country || entity?.currency || "Unknown";

        // Map importance (if available) or derive from sentiment
        let importance = 1; // Default to low
        if (entity?.importance) {
          importance = entity.importance;
        } else if (item.sentiment) {
          // Derive importance from sentiment strength
          const sentimentScore = Math.abs(item.sentiment);
          if (sentimentScore > 0.5) importance = 3;
          else if (sentimentScore > 0.2) importance = 2;
        }

        return {
          id: item.uuid || `marketaux-${index}`,
          date: item.published_at || new Date().toISOString(),
          country: country,
          importance: importance,
          event: item.title || "No title available",
          description: item.description || item.summary || "",
          actual: item.actual || null,
          forecast: item.forecast || null,
          previous: item.previous || null,
          url: item.url || "",
          source: "Liirat",
          sentiment: item.sentiment || null,
          entities: item.entities || [],
        };
      },
    );

    const response_data: MarketauxNewsResponse = {
      news: transformedNews,
      total: data.meta?.found || transformedNews.length,
      language: language as string,
    };

    res.json(response_data);
  } catch (error) {
    console.error("Error fetching news:", error);
    res.status(500).json({
      error: "Failed to fetch financial news",
      news: [],
    });
  }
};
