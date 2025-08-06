// /api/marketaux-news.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const apiKey = process.env.MARKETAUX_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Marketaux API key missing' });
  }
  const { language = 'en', countries = 'us,gb,ae', limit = '10' } = req.query;
  const url = `https://api.marketaux.com/v1/news/all?api_token=${apiKey}&language=${language}&countries=${countries}&limit=${limit}`;
  try {
    const response = await fetch(url, { headers: { Accept: 'application/json' } });
    const data = await response.json();
    if (!response.ok || data.error) {
      return res.status(response.status).json({ error: data.error || 'Marketaux error', news: [] });
    }
    res.status(200).json({ news: data.data || [], total: data.meta?.found || 0, language });
  } catch (err) {
    res.status(500).json({ error: 'Fetch failed', news: [] });
  }
}
