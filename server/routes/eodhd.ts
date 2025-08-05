import { RequestHandler } from "express";
import { EconomicEventsResponse, NewsResponse } from "@shared/api";

const EODHD_API_TOKEN = process.env.EODHD_API_TOKEN || 'demo'; // Use demo token as fallback

console.log('EODHD API Token status:', EODHD_API_TOKEN ? 'Available' : 'Not found');

export const getEconomicEvents: RequestHandler = async (req, res) => {
  try {
    const response = await fetch(
      `https://eodhd.com/api/economic-events?api_token=${EODHD_API_TOKEN}&fmt=json`
    );
    
    if (!response.ok) {
      throw new Error(`EODHD API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Transform the data to match our interface
    const events = Array.isArray(data) ? data.map((event: any) => ({
      date: event.date || new Date().toISOString().split('T')[0],
      time: event.time || '',
      country: event.country || '',
      event: event.event || event.title || '',
      category: event.category || '',
      importance: event.importance || 1,
      actual: event.actual || '',
      forecast: event.forecast || '',
      previous: event.previous || ''
    })) : [];

    const result: EconomicEventsResponse = { events };
    res.json(result);
  } catch (error) {
    console.error('Error fetching economic events:', error);
    res.status(500).json({ error: 'Failed to fetch economic events' });
  }
};

export const getNews: RequestHandler = async (req, res) => {
  try {
    const offset = req.query.offset || '0';
    const limit = req.query.limit || '20';
    
    const response = await fetch(
      `https://eodhd.com/api/news?offset=${offset}&limit=${limit}&api_token=${EODHD_API_TOKEN}&fmt=json`
    );
    
    if (!response.ok) {
      throw new Error(`EODHD API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Transform the data to match our interface
    const news = Array.isArray(data) ? data.map((article: any) => ({
      title: article.title || '',
      content: article.content || article.summary || '',
      link: article.link || article.url || '',
      symbols: article.symbols || [],
      tags: article.tags || [],
      date: article.date || new Date().toISOString(),
      sentiment: article.sentiment ? {
        polarity: article.sentiment.polarity || 0,
        label: article.sentiment.label || 'neutral'
      } : undefined
    })) : [];

    const result: NewsResponse = { news };
    res.json(result);
  } catch (error) {
    console.error('Error fetching news:', error);
    res.status(500).json({ error: 'Failed to fetch news' });
  }
};
