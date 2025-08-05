import React from 'react';
import { NewsArticle } from '@shared/api';
import { cn } from '@/lib/utils';
import { ExternalLink, Clock, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface NewsCardsListProps {
  news: NewsArticle[];
  className?: string;
}

const getSentimentColor = (sentiment?: { polarity: number; label: string }) => {
  if (!sentiment) return 'bg-gray-500';
  
  if (sentiment.polarity > 0.1) return 'bg-green-500';
  if (sentiment.polarity < -0.1) return 'bg-red-500';
  return 'bg-yellow-500';
};

const getSentimentIcon = (sentiment?: { polarity: number; label: string }) => {
  if (!sentiment) return <Minus className="w-3 h-3" />;
  
  if (sentiment.polarity > 0.1) return <TrendingUp className="w-3 h-3" />;
  if (sentiment.polarity < -0.1) return <TrendingDown className="w-3 h-3" />;
  return <Minus className="w-3 h-3" />;
};

const getSentimentLabel = (sentiment?: { polarity: number; label: string }) => {
  if (!sentiment) return 'Neutral';
  return sentiment.label.charAt(0).toUpperCase() + sentiment.label.slice(1);
};

const formatDate = (dateStr: string) => {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return 'Yesterday';
    
    return date.toLocaleDateString([], { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  } catch {
    return dateStr;
  }
};

const truncateContent = (content: string, maxLength: number = 150) => {
  if (content.length <= maxLength) return content;
  return content.substring(0, maxLength).trim() + '...';
};

export function NewsCardsList({ news, className }: NewsCardsListProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {news.length === 0 ? (
        <div className="text-center p-8 text-muted-foreground bg-card rounded-lg shadow-sm">
          No news articles available
        </div>
      ) : (
        news.map((article, index) => (
          <div 
            key={index}
            className="bg-card border border-border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between gap-4 mb-3">
              <h3 className="text-lg font-semibold text-foreground leading-tight flex-1">
                {article.title}
              </h3>
              {article.link && (
                <a 
                  href={article.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors flex-shrink-0"
                  title="Read full article"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
            
            <p className="text-muted-foreground mb-4 leading-relaxed">
              {truncateContent(article.content)}
            </p>
            
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                {/* Date */}
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  <span>{formatDate(article.date)}</span>
                </div>
                
                {/* Sentiment Indicator */}
                <div className="flex items-center gap-1">
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    getSentimentColor(article.sentiment)
                  )} />
                  <span className="text-xs text-muted-foreground">
                    {getSentimentLabel(article.sentiment)}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-2 flex-wrap">
                {/* Symbols */}
                {article.symbols && article.symbols.length > 0 && (
                  <div className="flex gap-1">
                    {article.symbols.slice(0, 3).map((symbol, symbolIndex) => (
                      <span 
                        key={symbolIndex}
                        className="inline-block bg-primary/10 text-primary px-2 py-1 rounded text-xs font-medium"
                      >
                        {symbol}
                      </span>
                    ))}
                    {article.symbols.length > 3 && (
                      <span className="text-xs text-muted-foreground px-1">
                        +{article.symbols.length - 3}
                      </span>
                    )}
                  </div>
                )}
                
                {/* Tags */}
                {article.tags && article.tags.length > 0 && (
                  <div className="flex gap-1">
                    {article.tags.slice(0, 2).map((tag, tagIndex) => (
                      <span 
                        key={tagIndex}
                        className="inline-block bg-secondary text-secondary-foreground px-2 py-1 rounded text-xs font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                    {article.tags.length > 2 && (
                      <span className="text-xs text-muted-foreground px-1">
                        +{article.tags.length - 2}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
