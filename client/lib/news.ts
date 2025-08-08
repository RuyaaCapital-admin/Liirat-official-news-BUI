// News data fetching utilities with EODHD News API
export async function fetchNews(params: Record<string, any>) {
  const u = new URL("/api/eodhd/news", location.origin);

  // Either ticker symbol or tag is required by EODHD
  if (params.s) u.searchParams.set("s", params.s); // ticker symbol
  if (params.t) u.searchParams.set("t", params.t); // tag

  u.searchParams.set("limit", String(params.limit ?? 50));
  if (params.offset) u.searchParams.set("offset", String(params.offset));

  const r = await fetch(u.toString());
  if (!r.ok) throw new Error(`News API error: ${r.status}`);

  return r.json();
}

// Adapt EODHD news data to our table format
export const adaptNews = (n: any) => ({
  publishedAt: n.date ?? n.datetime ?? n.published_at ?? "",
  title: n.title ?? "",
  link: n.link ?? n.url ?? "",
  symbols: Array.isArray(n.symbols) ? n.symbols : [],
  tags: Array.isArray(n.tags)
    ? n.tags
    : Array.isArray(n.symbols)
      ? n.symbols
      : [],
  content: n.content ?? n.description ?? "",
  source: n.source ?? "",
  country: n.country ?? "",
});

// Analysis function for news articles
export async function analyzeNews(text: string): Promise<string> {
  try {
    const response = await fetch(new URL("/api/analysis", location.origin), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      throw new Error(`Analysis API error: ${response.status}`);
    }

    const data = await response.json();
    return data.result || "Analysis not available";
  } catch (error) {
    console.warn("Analysis error:", error);
    return "Analysis temporarily unavailable";
  }
}

// Translation function for Arabic titles
export async function translateTitle(
  title: string,
  targetLanguage: string = "Arabic",
): Promise<string> {
  try {
    const response = await fetch(new URL("/api/translate", location.origin), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: title,
        targetLanguage,
      }),
    });

    if (!response.ok) {
      throw new Error(`Translation API error: ${response.status}`);
    }

    const data = await response.json();
    return data.result || title;
  } catch (error) {
    console.warn("Translation error:", error);
    return title; // Fallback to original title
  }
}

// Cache for translated titles to avoid repeated API calls
const translationCache = new Map<string, string>();

export async function getCachedTranslation(
  title: string,
  targetLanguage: string = "Arabic",
): Promise<string> {
  const cacheKey = `${title}_${targetLanguage}`;

  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey)!;
  }

  const translation = await translateTitle(title, targetLanguage);
  translationCache.set(cacheKey, translation);

  return translation;
}
