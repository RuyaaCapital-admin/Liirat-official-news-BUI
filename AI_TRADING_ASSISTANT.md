# AI Trading Assistant

A comprehensive AI-powered trading assistant that provides market analysis, trading strategies, and real-time insights using GPT-4 and TradingView integration.

## 🚀 Features

### 🤖 AI Chat Interface
- **Intelligent Conversations**: Chat with an AI assistant trained on financial markets
- **Context-Aware Responses**: AI considers current market data and news when providing insights
- **Trading Strategy Development**: Get personalized trading strategies based on your preferences
- **Risk Management Advice**: Receive guidance on position sizing and risk management

### 📊 Live TradingView Charts
- **Interactive Charts**: Embedded TradingView charts with real-time data
- **Multiple Timeframes**: Switch between different chart timeframes
- **Technical Indicators**: Add SMA, RSI, MACD, and other indicators
- **Symbol Switching**: Easily switch between different trading pairs (XAUUSD, BTCUSD, etc.)

### 📈 Market Data
- **Real-time Prices**: Live price updates for major trading pairs
- **Price Changes**: Track price movements and percentage changes
- **Volume Data**: Monitor trading volume for market activity
- **Multiple Symbols**: Support for forex, crypto, and indices

### 📰 News Integration
- **Market-moving News**: Stay updated with relevant financial news
- **Impact Assessment**: News categorized by market impact (High/Medium/Low)
- **Source Attribution**: Track news sources and publication times
- **AI Analysis**: Get AI insights on how news affects specific markets

### 🎯 Trading Features
- **Technical Analysis**: AI-powered technical analysis with support/resistance levels
- **Entry/Exit Points**: Get specific entry and exit recommendations
- **Risk Assessment**: Understand potential risks and rewards
- **Educational Content**: Learn about trading concepts and strategies

## 🛠️ Setup Instructions

### Prerequisites
- Node.js 18+ 
- npm or yarn
- OpenAI API key

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables
Create a `.env` file in the root directory:
```env
OPENAI_API_KEY=your_openai_api_key_here
```

### 3. Start Development Server
```bash
npm run dev
```

### 4. Access the AI Trading Assistant
Navigate to `http://localhost:5173/ai-trading` or click the "Launch AI Trading Assistant" button on the main page.

## 📱 Usage Guide

### Getting Started
1. **Launch the Assistant**: Click the "Launch AI Trading Assistant" button
2. **Select a Symbol**: Choose your preferred trading pair (XAUUSD, BTCUSD, etc.)
3. **Start Chatting**: Ask questions about market analysis, strategies, or news

### Example Conversations

#### Market Analysis
```
User: "Analyze the current XAUUSD market"
AI: "Based on the current market data, XAUUSD is showing..."
```

#### Trading Strategy
```
User: "Give me a trading strategy for BTCUSD"
AI: "Here's a comprehensive strategy for BTCUSD..."
```

#### News Impact
```
User: "How will the Fed rate decision affect EURUSD?"
AI: "The Federal Reserve's decision is likely to impact EURUSD..."
```

### Chart Features
- **Add Indicators**: Click the +SMA, +RSI, or +MACD buttons
- **Switch Symbols**: Use the symbol buttons to change trading pairs
- **Timeframe Selection**: Use TradingView's built-in timeframe selector

## 🔧 API Endpoints

### AI Chat
- **POST** `/api/ai-chat`
- **Body**: `{ message, symbol, marketData, news }`
- **Response**: `{ response, type, timestamp }`

### Market Data
- **GET** `/api/market-data`
- **Response**: Array of market data objects

### News
- **GET** `/api/news`
- **Response**: Array of news items

### Technical Analysis
- **POST** `/api/technical-analysis`
- **Body**: `{ symbol, timeframe }`
- **Response**: Technical analysis object

### Chart Indicators
- **POST** `/api/chart-indicator`
- **Body**: `{ indicator, symbol }`
- **Response**: Success confirmation

## 🎨 Customization

### Adding New Trading Pairs
1. Update the `popularSymbols` array in `AITradingAssistant.tsx`
2. Add corresponding market data in the backend
3. Update the TradingView widget configuration

### Customizing AI Responses
1. Modify the system prompt in `ai-trading.ts`
2. Add new response types and handlers
3. Customize the AI's knowledge base

### Styling
The component uses Tailwind CSS classes and can be customized by:
- Modifying the color scheme in the component
- Updating the gradient backgrounds
- Customizing the card layouts

## 🔒 Security & Privacy

### Data Handling
- All API calls are made server-side
- No sensitive data is stored in the browser
- OpenAI API key is kept secure on the server

### Rate Limiting
- Implement rate limiting for API endpoints
- Monitor OpenAI API usage
- Set appropriate request limits

## 🚀 Deployment

### Vercel Deployment
1. Push code to GitHub
2. Connect repository to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy automatically

### Environment Variables for Production
```env
OPENAI_API_KEY=your_production_openai_key
NODE_ENV=production
```

## 📊 Performance Optimization

### Frontend
- Lazy load TradingView widget
- Implement message pagination
- Use React.memo for expensive components

### Backend
- Cache market data responses
- Implement request deduplication
- Use connection pooling for database

## 🔮 Future Enhancements

### Planned Features
- [ ] Real-time WebSocket connections for live data
- [ ] Advanced chart drawing tools
- [ ] Portfolio tracking and analysis
- [ ] Social trading features
- [ ] Mobile app version
- [ ] Voice commands
- [ ] Multi-language support

### Integration Opportunities
- [ ] MetaTrader 4/5 integration
- [ ] Broker API connections
- [ ] Advanced order management
- [ ] Risk management tools
- [ ] Performance analytics

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## ⚠️ Disclaimer

This AI Trading Assistant is for educational and informational purposes only. It does not constitute financial advice. Always:
- Do your own research
- Consult with financial advisors
- Understand the risks involved in trading
- Never invest more than you can afford to lose

The developers are not responsible for any financial losses incurred through the use of this tool.