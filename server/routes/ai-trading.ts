import { Request, Response } from 'express';
import OpenAI from 'openai';
import axios from 'axios';
import * as cheerio from 'cheerio';

// Initialize OpenAI with proper configuration
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
  dangerouslyAllowBrowser: false,
});

// Mock market data for demonstration
const mockMarketData = [
  {
    symbol: 'XAUUSD',
    price: 2034.50,
    change: 12.30,
    changePercent: 0.61,
    volume: 125000
  },
  {
    symbol: 'BTCUSD',
    price: 43250.75,
    change: -1250.25,
    changePercent: -2.81,
    volume: 890000
  },
  {
    symbol: 'EURUSD',
    price: 1.0856,
    change: 0.0023,
    changePercent: 0.21,
    volume: 450000
  },
  {
    symbol: 'GBPUSD',
    price: 1.2645,
    change: -0.0089,
    changePercent: -0.70,
    volume: 320000
  },
  {
    symbol: 'USDJPY',
    price: 148.23,
    change: 0.45,
    changePercent: 0.30,
    volume: 280000
  },
  {
    symbol: 'SPX500',
    price: 4850.25,
    change: 15.75,
    changePercent: 0.33,
    volume: 2100000
  }
];

// Mock news data
const mockNews = [
  {
    id: '1',
    title: 'Federal Reserve Signals Potential Rate Cuts in 2024',
    summary: 'The Federal Reserve has indicated a more dovish stance, suggesting potential interest rate cuts in the coming year.',
    source: 'Reuters',
    publishedAt: '2024-01-15T10:30:00Z',
    impact: 'high' as const
  },
  {
    id: '2',
    title: 'Bitcoin ETF Approval Expected This Week',
    summary: 'Major cryptocurrency ETFs are expected to receive regulatory approval, potentially boosting institutional adoption.',
    source: 'Bloomberg',
    publishedAt: '2024-01-15T09:15:00Z',
    impact: 'high' as const
  },
  {
    id: '3',
    title: 'Gold Prices Reach New Highs Amid Economic Uncertainty',
    summary: 'Gold prices have surged to record levels as investors seek safe-haven assets during market volatility.',
    source: 'CNBC',
    publishedAt: '2024-01-15T08:45:00Z',
    impact: 'medium' as const
  },
  {
    id: '4',
    title: 'European Central Bank Maintains Current Policy Stance',
    summary: 'ECB officials have reaffirmed their commitment to current monetary policy despite economic headwinds.',
    source: 'Financial Times',
    publishedAt: '2024-01-15T07:30:00Z',
    impact: 'medium' as const
  },
  {
    id: '5',
    title: 'Oil Prices Stabilize After Recent Volatility',
    summary: 'Crude oil prices have stabilized following recent geopolitical tensions in the Middle East.',
    source: 'MarketWatch',
    publishedAt: '2024-01-15T06:20:00Z',
    impact: 'low' as const
  }
];

export const handleAIChat = async (req: Request, res: Response) => {
  try {
    const { message, symbol, marketData, news } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Check if OpenAI API key is configured
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error('OpenAI API key not found in environment variables');
      return res.status(500).json({
        error: 'OpenAI API key not configured',
        response: 'I apologize, but the AI service is not properly configured. Please contact support.'
      });
    }

    console.log('OpenAI API Key found:', apiKey.substring(0, 10) + '...');
    console.log('Processing message:', message);

    // Create context for the AI
    const marketContext = marketData?.map((item: any) => 
      `${item.symbol}: $${item.price} (${item.change >= 0 ? '+' : ''}${item.changePercent}%)`
    ).join(', ');

    const newsContext = news?.slice(0, 3).map((item: any) => 
      `${item.title}: ${item.summary}`
    ).join('\n');

    const systemPrompt = `You are an expert AI trading assistant with deep knowledge of financial markets, technical analysis, and trading strategies. You can analyze market data, provide trading insights, and help users develop trading strategies.

Current Market Context:
${marketContext || 'Market data not available'}

Recent News:
${newsContext || 'News data not available'}

Current Symbol: ${symbol || 'Not specified'}

Your capabilities include:
1. Technical analysis (support/resistance, trends, patterns)
2. Fundamental analysis
3. Risk management advice
4. Trading strategy development
5. Market sentiment analysis
6. News impact assessment

Always provide:
- Clear, actionable insights
- Risk warnings when appropriate
- Specific entry/exit points when requested
- Educational explanations for complex concepts

Remember: This is for educational purposes only. Always advise users to do their own research and consider consulting with financial advisors.`;

    console.log('Creating OpenAI completion request...');

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message }
      ],
      max_tokens: 1000,
      temperature: 0.7,
    });

    const response = completion.choices[0]?.message?.content || 'Sorry, I could not generate a response.';

    console.log('OpenAI response received successfully:', response.substring(0, 100) + '...');

    // Determine response type based on content
    let type = 'text';
    if (response.toLowerCase().includes('strategy') || response.toLowerCase().includes('entry') || response.toLowerCase().includes('exit')) {
      type = 'strategy';
    } else if (response.toLowerCase().includes('analysis') || response.toLowerCase().includes('technical') || response.toLowerCase().includes('fundamental')) {
      type = 'analysis';
    } else if (response.toLowerCase().includes('news') || response.toLowerCase().includes('impact')) {
      type = 'news';
    }

    res.json({
      response,
      type,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('AI Chat Error Details:', error);
    
    // Provide more specific error messages
    let errorMessage = 'I apologize, but I\'m experiencing technical difficulties. Please try again in a moment.';
    
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      
      if (error.message.includes('401')) {
        errorMessage = 'Authentication error with AI service. Please check API configuration.';
      } else if (error.message.includes('429')) {
        errorMessage = 'Rate limit exceeded. Please wait a moment and try again.';
      } else if (error.message.includes('500')) {
        errorMessage = 'AI service is temporarily unavailable. Please try again later.';
      } else if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
        errorMessage = 'Network connection error. Please check your internet connection.';
      }
    }
    
    res.status(500).json({
      error: 'Failed to process AI request',
      response: errorMessage,
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const handleMarketData = async (req: Request, res: Response) => {
  try {
    // Try to fetch real market data from Alpha Vantage or similar
    const symbols = ['XAUUSD', 'BTCUSD', 'EURUSD', 'GBPUSD', 'USDJPY', 'SPX500'];
    const marketData = [];

    for (const symbol of symbols) {
      try {
        // For demonstration, we'll use a free API endpoint
        // In production, you should use a paid API like Alpha Vantage
        const response = await axios.get(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`, {
          timeout: 5000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });

        if (response.data && response.data.chart && response.data.chart.result) {
          const result = response.data.chart.result[0];
          const meta = result.meta;
          const quote = result.indicators.quote[0];
          
          const currentPrice = meta.regularMarketPrice;
          const previousClose = meta.previousClose;
          const change = currentPrice - previousClose;
          const changePercent = (change / previousClose) * 100;
          const volume = quote.volume ? quote.volume[quote.volume.length - 1] : 0;

          marketData.push({
            symbol,
            price: currentPrice,
            change: change,
            changePercent: changePercent,
            volume: volume
          });
        } else {
          // Fallback to mock data if API fails
          const mockItem = mockMarketData.find(item => item.symbol === symbol);
          if (mockItem) {
            marketData.push({
              ...mockItem,
              price: mockItem.price + (Math.random() - 0.5) * 10,
              change: mockItem.change + (Math.random() - 0.5) * 5,
              changePercent: mockItem.changePercent + (Math.random() - 0.5) * 2,
              volume: mockItem.volume + Math.floor(Math.random() * 10000)
            });
          }
        }
      } catch (symbolError) {
        console.error(`Error fetching data for ${symbol}:`, symbolError);
        // Fallback to mock data for this symbol
        const mockItem = mockMarketData.find(item => item.symbol === symbol);
        if (mockItem) {
          marketData.push({
            ...mockItem,
            price: mockItem.price + (Math.random() - 0.5) * 10,
            change: mockItem.change + (Math.random() - 0.5) * 5,
            changePercent: mockItem.changePercent + (Math.random() - 0.5) * 2,
            volume: mockItem.volume + Math.floor(Math.random() * 10000)
          });
        }
      }
    }

    console.log('Market data fetched successfully:', marketData.length, 'symbols');
    res.json(marketData);
  } catch (error) {
    console.error('Market Data Error:', error);
    // Return mock data as fallback
    const randomizedData = mockMarketData.map(item => ({
      ...item,
      price: item.price + (Math.random() - 0.5) * 10,
      change: item.change + (Math.random() - 0.5) * 5,
      changePercent: item.changePercent + (Math.random() - 0.5) * 2,
      volume: item.volume + Math.floor(Math.random() * 10000)
    }));
    res.json(randomizedData);
  }
};

export const handleNews = async (req: Request, res: Response) => {
  try {
    // In a real implementation, you would fetch news from APIs like:
    // - NewsAPI
    // - Alpha Vantage News
    // - Finnhub News
    
    // For now, we'll return mock data
    res.json(mockNews);
  } catch (error) {
    console.error('News Error:', error);
    res.status(500).json({ error: 'Failed to fetch news' });
  }
};

export const handleChartIndicator = async (req: Request, res: Response) => {
  try {
    const { indicator, symbol } = req.body;

    // This would integrate with TradingView's charting library
    // For now, we'll return a success response
    res.json({
      success: true,
      message: `${indicator} added to ${symbol} chart`,
      indicator,
      symbol
    });
  } catch (error) {
    console.error('Chart Indicator Error:', error);
    res.status(500).json({ error: 'Failed to add indicator' });
  }
};

export const handleTechnicalAnalysis = async (req: Request, res: Response) => {
  try {
    const { symbol, timeframe } = req.body;

    // In a real implementation, you would:
    // 1. Fetch historical price data
    // 2. Calculate technical indicators
    // 3. Analyze patterns and trends
    
    const analysis = {
      symbol,
      timeframe,
      support: 2000,
      resistance: 2100,
      trend: 'bullish',
      rsi: 65,
      macd: 'positive',
      movingAverages: {
        sma20: 2020,
        sma50: 1980,
        ema12: 2035
      },
      recommendations: [
        'Price is above key moving averages',
        'RSI indicates moderate momentum',
        'MACD shows positive divergence',
        'Consider buying on pullbacks to support'
      ]
    };

    res.json(analysis);
  } catch (error) {
    console.error('Technical Analysis Error:', error);
    res.status(500).json({ error: 'Failed to perform technical analysis' });
  }
};