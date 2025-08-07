// Simple in-memory cache and rate limiter
interface CacheEntry {
  data: any;
  timestamp: number;
  expiry: number;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class APIOptimizer {
  private cache = new Map<string, CacheEntry>();
  private rateLimits = new Map<string, RateLimitEntry>();
  
  // Cache TTL settings (in milliseconds)
  private readonly CACHE_TTL = {
    prices: 30000,        // 30 seconds for price data
    news: 300000,         // 5 minutes for news
    calendar: 600000,     // 10 minutes for economic calendar
    analysis: 1800000,    // 30 minutes for AI analysis
  };

  // Rate limit settings (requests per minute)
  private readonly RATE_LIMITS = {
    prices: 60,           // 60 price requests per minute (1 per second)
    news: 12,             // 12 news requests per minute (1 per 5 seconds)
    calendar: 6,          // 6 calendar requests per minute (1 per 10 seconds)
    analysis: 20,         // 20 AI analysis requests per minute
  };

  // Get cached data if available and not expired
  getCached(key: string, type: keyof typeof this.CACHE_TTL): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now > entry.expiry) {
      this.cache.delete(key);
      return null;
    }

    console.log(`Cache hit for ${key}`);
    return entry.data;
  }

  // Set cache data with appropriate TTL
  setCache(key: string, data: any, type: keyof typeof this.CACHE_TTL): void {
    const now = Date.now();
    const ttl = this.CACHE_TTL[type];
    
    this.cache.set(key, {
      data,
      timestamp: now,
      expiry: now + ttl,
    });

    // Clean up expired entries periodically
    if (this.cache.size > 1000) {
      this.cleanupCache();
    }
  }

  // Check if API call is allowed under rate limit
  checkRateLimit(clientId: string, type: keyof typeof this.RATE_LIMITS): boolean {
    const now = Date.now();
    const windowMs = 60000; // 1 minute window
    const limit = this.RATE_LIMITS[type];
    
    const key = `${clientId}:${type}`;
    const entry = this.rateLimits.get(key);

    if (!entry || now > entry.resetTime) {
      // New window or expired window
      this.rateLimits.set(key, {
        count: 1,
        resetTime: now + windowMs,
      });
      return true;
    }

    if (entry.count >= limit) {
      console.warn(`Rate limit exceeded for ${clientId}:${type} (${entry.count}/${limit})`);
      return false;
    }

    // Increment counter
    entry.count++;
    return true;
  }

  // Clean up expired cache entries
  private cleanupCache(): void {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiry) {
        this.cache.delete(key);
        cleaned++;
      }
    }
    
    console.log(`Cleaned up ${cleaned} expired cache entries`);
  }

  // Get cache statistics
  getStats(): { cacheSize: number; rateLimitEntries: number } {
    return {
      cacheSize: this.cache.size,
      rateLimitEntries: this.rateLimits.size,
    };
  }

  // Clear old rate limit entries
  cleanupRateLimits(): void {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, entry] of this.rateLimits.entries()) {
      if (now > entry.resetTime) {
        this.rateLimits.delete(key);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      console.log(`Cleaned up ${cleaned} expired rate limit entries`);
    }
  }
}

// Singleton instance
export const apiOptimizer = new APIOptimizer();

// Cleanup task to run every 5 minutes
setInterval(() => {
  apiOptimizer.cleanupRateLimits();
}, 300000);

// Helper function to generate cache keys
export function generateCacheKey(type: string, params: Record<string, any>): string {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&');
  return `${type}:${sortedParams}`;
}

// Helper function to get client identifier
export function getClientId(req: any): string {
  return req.ip || req.connection.remoteAddress || 'unknown';
}
