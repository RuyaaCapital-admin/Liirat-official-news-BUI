import { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';

// Initialize OpenAI client with API key from environment variables
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Tool functions for AI to use
async function getLivePrice(symbol: string) {
  try {
    // For now, return a disclaimer that we don't have real live data
    // This is honest and prevents showing fake data as real
    return {
      error: "Live price data not available",
      message: `I don't have access to real-time price feeds for ${symbol}. Check your broker or EODHD for current prices.`,
      symbol: symbol
    };
  } catch (error) {
    return { error: 'Failed to fetch price data' };
  }
}

async function analyzeChartPattern(symbol: string, timeframe = '1h') {
  try {
    // Honest response - we don't have real chart analysis capability
    return {
      error: "Chart analysis not available",
      message: `I can't analyze live charts for ${symbol} right now. Use EODHD or your trading platform for technical analysis.`,
      symbol: symbol,
      timeframe: timeframe
    };
  } catch (error) {
    return { error: 'Failed to analyze chart' };
  }
}

async function checkMarketSentiment(symbol?: string) {
  try {
    // Return general market context without fake data
    const generalSentiment = {
      message: "I don't have access to real-time sentiment data. Check financial news and social sentiment tools for current market mood.",
      suggestion: "Look at recent news, Fed announcements, and major economic events for sentiment clues."
    };
    
    return generalSentiment;
  } catch (error) {
    return { error: 'Failed to check sentiment' };
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, conversationHistory = [], context = {} } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required and must be a string' });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: 'OpenAI API key not configured' });
    }

    // Build context information
    let contextInfo = '';
    if (context.selectedSymbol) {
      contextInfo += `\nUser is looking at: ${context.selectedSymbol}`;
    }
    if (context.recentNews && context.recentNews.length > 0) {
      contextInfo += `\nRecent news:\n`;
      context.recentNews.forEach((item: any) => {
        contextInfo += `- ${item.title} (${item.impact} impact)\n`;
      });
    }

    // Prepare messages for OpenAI API
    const messages = [
      {
        role: 'system' as const,
        content: `You are Alex, a sharp and experienced trading assistant at Liirat. You're conversational, direct, and cut through the noise.

Your style:
- Talk like a real trader - casual but smart
- Keep it SHORT (2-3 sentences max unless complex analysis needed)
- Use emojis occasionally 📈📉💡
- Be direct: "That's a risky move" not "This strategy may present certain risks"
- Share insights, not textbook definitions
- When you don't have real data, say so upfront

What you do:
- Quick market takes and analysis
- Spot trading opportunities and risks
- Explain market moves in plain English
- Give actionable insights, not generic advice

What you DON'T do:
- Write essays or long explanations
- Give generic "do your own research" responses
- Be overly formal or robotic
- Pretend to have data you don't have

${contextInfo ? `Market context: ${contextInfo}` : ''}

Keep it real, keep it short, keep it valuable. 🎯`
      },
      ...conversationHistory.map((msg: any) => ({
        role: msg.role,
        content: msg.content
      })),
      {
        role: 'user' as const,
        content: message
      }
    ];



    // Call OpenAI API - simplified for reliability
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: messages,
      max_tokens: 400,
      temperature: 0.7,
      presence_penalty: 0.1,
      frequency_penalty: 0.1,
    });

    const aiResponse = completion.choices[0]?.message?.content;

    if (!aiResponse) {
      return res.status(500).json({ error: 'No response from AI' });
    }

    return res.status(200).json({
      success: true,
      response: aiResponse,
      usage: completion.usage
    });

  } catch (error: any) {
    console.error('OpenAI API Error:', error);
    
    // Handle specific OpenAI errors
    if (error.code === 'insufficient_quota') {
      return res.status(429).json({ 
        error: 'API quota exceeded. Please try again later.' 
      });
    }
    
    if (error.code === 'invalid_api_key') {
      return res.status(401).json({ 
        error: 'Invalid API key configuration.' 
      });
    }

    return res.status(500).json({ 
      error: 'Internal server error. Please try again later.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
