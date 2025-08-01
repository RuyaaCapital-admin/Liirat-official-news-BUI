import { VercelRequest, VercelResponse } from '@vercel/node';

// Mock market data - in production, this would connect to a real market data provider
const generateMarketData = () => {
  const symbols = ['XAUUSD', 'BTCUSD', 'EURUSD', 'GBPUSD', 'USDJPY', 'SPX500'];
  const baseData = {
    'XAUUSD': { price: 2034.50, baseChange: 12.30 },
    'BTCUSD': { price: 43250.75, baseChange: -1250.25 },
    'EURUSD': { price: 1.0856, baseChange: 0.0023 },
    'GBPUSD': { price: 1.2645, baseChange: -0.0089 },
    'USDJPY': { price: 148.23, baseChange: 0.45 },
    'SPX500': { price: 4850.25, baseChange: 15.75 }
  };

  return symbols.map(symbol => {
    const base = baseData[symbol as keyof typeof baseData];
    // Add some random variation to simulate real-time data
    const priceVariation = (Math.random() - 0.5) * 0.02; // ±1% variation
    const changeVariation = (Math.random() - 0.5) * 0.1;
    
    const currentPrice = base.price * (1 + priceVariation);
    const currentChange = base.baseChange + changeVariation;
    const changePercent = (currentChange / (currentPrice - currentChange)) * 100;
    
    return {
      symbol,
      price: parseFloat(currentPrice.toFixed(symbol === 'USDJPY' ? 2 : 4)),
      change: parseFloat(currentChange.toFixed(symbol === 'USDJPY' ? 2 : 4)),
      changePercent: parseFloat(changePercent.toFixed(2)),
      volume: Math.floor(Math.random() * 1000000) + 100000,
      timestamp: new Date().toISOString()
    };
  });
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const marketData = generateMarketData();
    
    return res.status(200).json({
      success: true,
      data: marketData,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Market Data API Error:', error);
    
    return res.status(500).json({ 
      error: 'Internal server error. Please try again later.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}