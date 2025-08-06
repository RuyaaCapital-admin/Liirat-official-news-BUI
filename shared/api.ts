// Demo Response (existing)
export interface DemoResponse {
  message: string;
}

// EODHD Economic Events
export interface EconomicEvent {
  date: string;
  time: string;
  country: string;
  event: string;
  category: string;
  importance: number; // 1-3 scale
  actual?: string;
  forecast?: string;
  previous?: string;
}

export interface EconomicEventsResponse {
  events: EconomicEvent[];
}

// EODHD News
export interface NewsArticle {
  title: string;
  content: string;
  link: string;
  symbols: string[];
  tags: string[];
  date: string;
  sentiment?: {
    polarity: number;
    label: string;
  };
}

export interface NewsResponse {
  news: NewsArticle[];
}

// Marketaux News API
export interface MarketauxNewsItem {
  id: string;
  date: string;
  country: string;
  importance: number; // 1-3 scale
  event: string;
  description: string;
  actual?: string | null;
  forecast?: string | null;
  previous?: string | null;
  url?: string;
  source?: string;
  sentiment?: number | null;
  entities?: any[];
}

export interface MarketauxNewsResponse {
  news: MarketauxNewsItem[];
  total: number;
  language: string;
  error?: string;
}
