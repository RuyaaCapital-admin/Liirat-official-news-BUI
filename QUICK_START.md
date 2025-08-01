# 🚀 Quick Start Guide - AI Trading Assistant

Get your AI Trading Assistant up and running in 5 minutes!

## ⚡ Quick Setup

### 1. Clone and Install
```bash
git clone <your-repo-url>
cd <your-project>
npm install
```

### 2. Set Up Environment Variables
```bash
# Copy the example environment file
cp .env.example .env

# Edit .env and add your OpenAI API key
OPENAI_API_KEY=sk-your-actual-openai-api-key-here
```

### 3. Start the Development Server
```bash
npm run dev
```

### 4. Access the AI Trading Assistant
- Open your browser to `http://localhost:5173`
- Click the "Launch AI Trading Assistant" button
- Or navigate directly to `http://localhost:5173/ai-trading`

## 🎯 First Steps

### 1. Start a Conversation
Try asking the AI:
- "Analyze the current XAUUSD market"
- "Give me a trading strategy for BTCUSD"
- "What's the latest news affecting EURUSD?"

### 2. Explore the Chart
- Switch between different trading pairs (XAUUSD, BTCUSD, EURUSD, etc.)
- Add technical indicators (SMA, RSI, MACD)
- Use TradingView's built-in tools

### 3. Check Market Data
- View real-time prices and changes
- Monitor trading volume
- Track multiple symbols simultaneously

## 🔧 Troubleshooting

### Common Issues

**"Failed to get AI response"**
- Check your OpenAI API key in `.env`
- Ensure you have sufficient API credits
- Verify your internet connection

**TradingView chart not loading**
- Check your internet connection
- Ensure no ad blockers are blocking TradingView
- Try refreshing the page

**Market data not updating**
- This is currently using mock data
- For real data, add market API keys to `.env`

### Getting Help
- Check the full documentation in `AI_TRADING_ASSISTANT.md`
- Review the console for error messages
- Ensure all dependencies are installed

## 🎉 You're Ready!

Your AI Trading Assistant is now running! Start exploring the features and enjoy intelligent market analysis powered by GPT-4.

Remember: This tool is for educational purposes only. Always do your own research and consult with financial advisors before making trading decisions.