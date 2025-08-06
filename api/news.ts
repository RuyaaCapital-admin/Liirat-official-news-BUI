import { VercelRequest, VercelResponse } from '@vercel/node';

// Mock news data - in production, this would connect to a real news provider
const generateNewsData = () => {
  const newsItems = [
    {
      id: '1',
      title: 'Federal Reserve Maintains Interest Rates at 5.25-5.50%',
      summary: 'The Federal Reserve decided to keep interest rates unchanged, citing ongoing inflation concerns and labor market strength.',
      source: 'Reuters',
      publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      impact: 'high' as const,
      category: 'monetary-policy'
    },
    {
      id: '2',
      title: 'Gold Prices Surge on Safe Haven Demand',
      summary: 'Gold prices reached new highs as investors seek safe haven assets amid global economic uncertainty.',
      source: 'Bloomberg',
      publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      impact: 'medium' as const,
      category: 'commodities'
    },
    {
      id: '3',
      title: 'EUR/USD Volatility Expected Ahead of ECB Meeting',
      summary: 'Currency traders are positioning for potential volatility in EUR/USD as the European Central Bank prepares for its policy announcement.',
      source: 'Financial Times',
      publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      impact: 'medium' as const,
      category: 'forex'
    },
    {
      id: '4',
      title: 'US Non-Farm Payrolls Beat Expectations',
      summary: 'The latest employment data shows stronger than expected job growth, adding 250,000 jobs versus 200,000 forecasted.',
      source: 'MarketWatch',
      publishedAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
      impact: 'high' as const,
      category: 'employment'
    },
    {
      id: '5',
      title: 'Bitcoin Consolidates Around $43,000 Level',
      summary: 'Bitcoin continues to trade in a narrow range as institutional investors await clearer regulatory guidance.',
      source: 'CoinDesk',
      publishedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
      impact: 'low' as const,
      category: 'crypto'
    },
    {
      id: '6',
      title: 'Oil Prices Rise on Supply Concerns',
      summary: 'Crude oil prices increased following reports of potential supply disruptions in key producing regions.',
      source: 'CNBC',
      publishedAt: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
      impact: 'medium' as const,
      category: 'energy'
    }
  ];

  return newsItems;
};

let lastCall = 0;
const FIFTEEN_SECONDS = 15 * 1000;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const now = Date.now();
  if (now - lastCall < FIFTEEN_SECONDS) {
    return res.status(429).json({
      error: 'Too many requests. Please wait 15 seconds.',
      nextAllowed: new Date(lastCall + FIFTEEN_SECONDS).toISOString()
    });
  }
  lastCall = now;

  try {
    const { category, limit = 10 } = req.query;
    
    let newsData = generateNewsData();
    
    if (category && typeof category === 'string') {
      newsData = newsData.filter(item => item.category === category);
    }

    const limitNum = parseInt(limit as string, 10);
    if (limitNum > 0) {
      newsData = newsData.slice(0, limitNum);
    }

    return res.status(200).json({
      success: true,
      data: newsData,
      timestamp: new Date().toISOString(),
      total: newsData.length
    });

  } catch (error: any) {
    console.error('News API Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error. Please try again later.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
