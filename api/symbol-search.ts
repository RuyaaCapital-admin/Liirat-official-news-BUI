import type { VercelRequest, VercelResponse } from "@vercel/node";

// Comprehensive symbol database
const SYMBOL_DATABASE = [
  // Major Forex Pairs
  { symbol: "EURUSD.FOREX", name: "EUR/USD", category: "forex" },
  { symbol: "GBPUSD.FOREX", name: "GBP/USD", category: "forex" },
  { symbol: "USDJPY.FOREX", name: "USD/JPY", category: "forex" },
  { symbol: "AUDUSD.FOREX", name: "AUD/USD", category: "forex" },
  { symbol: "USDCHF.FOREX", name: "USD/CHF", category: "forex" },
  { symbol: "USDCAD.FOREX", name: "USD/CAD", category: "forex" },
  { symbol: "NZDUSD.FOREX", name: "NZD/USD", category: "forex" },
  { symbol: "EURGBP.FOREX", name: "EUR/GBP", category: "forex" },
  { symbol: "EURJPY.FOREX", name: "EUR/JPY", category: "forex" },
  { symbol: "GBPJPY.FOREX", name: "GBP/JPY", category: "forex" },
  { symbol: "CHFJPY.FOREX", name: "CHF/JPY", category: "forex" },
  { symbol: "CADJPY.FOREX", name: "CAD/JPY", category: "forex" },
  { symbol: "AUDCAD.FOREX", name: "AUD/CAD", category: "forex" },
  { symbol: "AUDCHF.FOREX", name: "AUD/CHF", category: "forex" },
  { symbol: "AUDJPY.FOREX", name: "AUD/JPY", category: "forex" },
  { symbol: "CADCHF.FOREX", name: "CAD/CHF", category: "forex" },
  { symbol: "EURCHF.FOREX", name: "EUR/CHF", category: "forex" },
  { symbol: "EURCAD.FOREX", name: "EUR/CAD", category: "forex" },
  { symbol: "GBPCAD.FOREX", name: "GBP/CAD", category: "forex" },
  { symbol: "GBPCHF.FOREX", name: "GBP/CHF", category: "forex" },
  
  // Cryptocurrencies
  { symbol: "BTC-USD.CC", name: "Bitcoin (BTC/USD)", category: "crypto" },
  { symbol: "ETH-USD.CC", name: "Ethereum (ETH/USD)", category: "crypto" },
  { symbol: "XRP-USD.CC", name: "XRP (XRP/USD)", category: "crypto" },
  { symbol: "LTC-USD.CC", name: "Litecoin (LTC/USD)", category: "crypto" },
  { symbol: "ADA-USD.CC", name: "Cardano (ADA/USD)", category: "crypto" },
  { symbol: "DOT-USD.CC", name: "Polkadot (DOT/USD)", category: "crypto" },
  { symbol: "LINK-USD.CC", name: "Chainlink (LINK/USD)", category: "crypto" },
  { symbol: "BCH-USD.CC", name: "Bitcoin Cash (BCH/USD)", category: "crypto" },
  { symbol: "BNB-USD.CC", name: "Binance Coin (BNB/USD)", category: "crypto" },
  { symbol: "SOL-USD.CC", name: "Solana (SOL/USD)", category: "crypto" },
  { symbol: "MATIC-USD.CC", name: "Polygon (MATIC/USD)", category: "crypto" },
  { symbol: "AVAX-USD.CC", name: "Avalanche (AVAX/USD)", category: "crypto" },
  { symbol: "UNI-USD.CC", name: "Uniswap (UNI/USD)", category: "crypto" },
  { symbol: "ATOM-USD.CC", name: "Cosmos (ATOM/USD)", category: "crypto" },
  
  // Major Indices
  { symbol: "GSPC.INDX", name: "S&P 500", category: "indices" },
  { symbol: "IXIC.INDX", name: "NASDAQ Composite", category: "indices" },
  { symbol: "DJI.INDX", name: "Dow Jones Industrial Average", category: "indices" },
  { symbol: "RUT.INDX", name: "Russell 2000", category: "indices" },
  { symbol: "VIX.INDX", name: "VIX Volatility Index", category: "indices" },
  { symbol: "N225.INDX", name: "Nikkei 225", category: "indices" },
  { symbol: "HSI.INDX", name: "Hang Seng Index", category: "indices" },
  { symbol: "FTSE.INDX", name: "FTSE 100", category: "indices" },
  { symbol: "DAX.INDX", name: "DAX", category: "indices" },
  { symbol: "CAC.INDX", name: "CAC 40", category: "indices" },
  { symbol: "ASX.INDX", name: "ASX 200", category: "indices" },
  { symbol: "KOSPI.INDX", name: "KOSPI", category: "indices" },
  { symbol: "TWII.INDX", name: "Taiwan Weighted", category: "indices" },
  
  // Major Stocks
  { symbol: "AAPL.US", name: "Apple Inc.", category: "stocks" },
  { symbol: "MSFT.US", name: "Microsoft Corporation", category: "stocks" },
  { symbol: "GOOGL.US", name: "Alphabet Inc.", category: "stocks" },
  { symbol: "AMZN.US", name: "Amazon.com Inc.", category: "stocks" },
  { symbol: "TSLA.US", name: "Tesla Inc.", category: "stocks" },
  { symbol: "META.US", name: "Meta Platforms Inc.", category: "stocks" },
  { symbol: "NVDA.US", name: "NVIDIA Corporation", category: "stocks" },
  { symbol: "NFLX.US", name: "Netflix Inc.", category: "stocks" },
  { symbol: "AMD.US", name: "Advanced Micro Devices", category: "stocks" },
  { symbol: "INTC.US", name: "Intel Corporation", category: "stocks" },
  { symbol: "CRM.US", name: "Salesforce Inc.", category: "stocks" },
  { symbol: "ORCL.US", name: "Oracle Corporation", category: "stocks" },
  { symbol: "ADBE.US", name: "Adobe Inc.", category: "stocks" },
  { symbol: "PYPL.US", name: "PayPal Holdings", category: "stocks" },
  { symbol: "DIS.US", name: "Walt Disney Company", category: "stocks" },
  { symbol: "UBER.US", name: "Uber Technologies", category: "stocks" },
  { symbol: "SPOT.US", name: "Spotify Technology", category: "stocks" },
  { symbol: "ZOOM.US", name: "Zoom Video Communications", category: "stocks" },
  { symbol: "SQ.US", name: "Block Inc.", category: "stocks" },
  { symbol: "SHOP.US", name: "Shopify Inc.", category: "stocks" },
  
  // Commodities
  { symbol: "XAUUSD.FOREX", name: "Gold (XAU/USD)", category: "commodities" },
  { symbol: "XAGUSD.FOREX", name: "Silver (XAG/USD)", category: "commodities" },
  { symbol: "XPTUSD.FOREX", name: "Platinum (XPT/USD)", category: "commodities" },
  { symbol: "XPDUSD.FOREX", name: "Palladium (XPD/USD)", category: "commodities" },
  { symbol: "CL.F", name: "Crude Oil WTI", category: "commodities" },
  { symbol: "BZ.F", name: "Brent Crude Oil", category: "commodities" },
  { symbol: "NG.F", name: "Natural Gas", category: "commodities" },
  { symbol: "HG.F", name: "Copper", category: "commodities" },
  { symbol: "SI.F", name: "Silver Futures", category: "commodities" },
  { symbol: "GC.F", name: "Gold Futures", category: "commodities" },
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { q: query, limit = "20", category } = req.query;

  try {
    let results = SYMBOL_DATABASE;

    // Filter by query if provided
    if (query && typeof query === "string") {
      const searchTerm = query.toLowerCase();
      results = SYMBOL_DATABASE.filter(
        (symbol) =>
          symbol.name.toLowerCase().includes(searchTerm) ||
          symbol.symbol.toLowerCase().includes(searchTerm) ||
          symbol.category.toLowerCase().includes(searchTerm),
      );
    }

    // Filter by category if provided
    if (category && typeof category === "string") {
      results = results.filter(
        (symbol) => symbol.category.toLowerCase() === category.toLowerCase(),
      );
    }

    // Limit results
    const limitNum = parseInt(limit as string, 10) || 20;
    results = results.slice(0, limitNum);

    res.status(200).json({
      symbols: results,
      total: results.length,
      query: query || "",
      category: category || "all",
    });
  } catch (error) {
    console.error("Symbol search error:", error);
    res.status(500).json({
      error: "Failed to search symbols",
      symbols: [],
      total: 0,
    });
  }
}
