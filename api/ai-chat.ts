import { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';

// Initialize OpenAI client with API key from environment variables
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
      contextInfo += `\nCurrently viewing symbol: ${context.selectedSymbol}`;
    }
    if (context.marketData && context.marketData.length > 0) {
      contextInfo += `\nCurrent market data:\n`;
      context.marketData.forEach((item: any) => {
        contextInfo += `- ${item.symbol}: $${item.price} (${item.change >= 0 ? '+' : ''}${item.change}, ${item.changePercent}%)\n`;
      });
    }
    if (context.recentNews && context.recentNews.length > 0) {
      contextInfo += `\nRecent market news:\n`;
      context.recentNews.forEach((item: any) => {
        contextInfo += `- ${item.title} (${item.impact} impact)\n`;
      });
    }

    // Prepare messages for OpenAI API
    const messages = [
      {
        role: 'system' as const,
        content: `You are a professional AI trading assistant for Liirat, a financial news and trading platform. You provide:

1. Market analysis and insights
2. Trading strategies and recommendations
3. Economic event explanations
4. Risk management advice
5. Technical analysis guidance

Guidelines:
- Always provide accurate, well-researched financial information
- Include disclaimers about trading risks
- Be professional and helpful
- Focus on education and analysis
- Never guarantee profits or specific outcomes
- Suggest users do their own research before making trading decisions
- Use the provided market context when relevant
- Keep responses concise but informative (max 500 words)

${contextInfo ? `Current market context:${contextInfo}` : ''}

Remember: This is for educational purposes only and not financial advice.`
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

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: messages,
      max_tokens: 800,
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