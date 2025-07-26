import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, Loader2, TrendingUp, TrendingDown, AlertCircle, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/language-context';

export interface EconomicEvent {
  date: string;
  time: string;
  event: string;
  country: string;
  countryFlag: string;
  forecast: string;
  previous: string;
  actual: string;
  importance: number;
}

export interface AIInsightResponse {
  summary: string;
  whatHappened: string;
  whyImportant: string;
  marketImpact: string;
  language: 'ar' | 'en';
}

interface AIEventInsightProps {
  event: EconomicEvent;
  className?: string;
}

// API Configuration - Replace these with your actual values
const AI_API_CONFIG = {
  // 🔧 REPLACE WITH YOUR OPENAI API ENDPOINT
  apiUrl: import.meta.env.VITE_OPENAI_API_URL || 'https://api.openai.com/v1/chat/completions',

  // 🔧 REPLACE WITH YOUR OPENAI API KEY
  apiKey: import.meta.env.VITE_OPENAI_API_KEY || 'your-api-key-here',

  // Model configuration
  model: 'gpt-3.5-turbo',
  maxTokens: 500,

  // Demo mode - set to true to show demo analysis without API calls
  demoMode: !import.meta.env.VITE_OPENAI_API_KEY || import.meta.env.VITE_OPENAI_API_KEY === 'your-api-key-here',
};

export function AIEventInsight({ event, className }: AIEventInsightProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [insight, setInsight] = useState<AIInsightResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const { language } = useLanguage();



  // Generate AI prompt based on event data and language
  const generatePrompt = (eventData: EconomicEvent, language: 'ar' | 'en'): string => {
    const languageText = language === 'ar' ? 'Arabic' : 'English';

    return `Event: ${eventData.event}. Actual: ${eventData.actual}. Forecast: ${eventData.forecast}. Previous: ${eventData.previous}. Date: ${eventData.date}. Write a single, short, actionable sentence for traders. No intro, no extra text. Maximum 25 words. Language: ${languageText}.`;
  };

  // Generate demo analysis for testing without API
  const generateDemoAnalysis = (eventData: EconomicEvent, language: 'ar' | 'en'): AIInsightResponse => {
    const isAboveExpected = parseFloat(eventData.actual) > parseFloat(eventData.forecast);

    if (language === 'ar') {
      const analysis = isAboveExpected
        ? `${eventData.event} أعلى من المتوقع، قد يؤثر إ��جابياً على ${eventData.country}.`
        : `${eventData.event} أقل من المتوقع، ضغط محتمل على ${eventData.country}.`;

      return {
        summary: `${analysis}\n\n⚠️ هذا تحليل تجريبي. للحصول على تحليل حقيقي من الذكاء الاصطناعي، يرجى إعداد مفتاح OpenAI API في متغيرات البيئة.`,
        whatHappened: analysis,
        whyImportant: analysis,
        marketImpact: analysis,
        language: 'ar'
      };
    } else {
      const analysis = isAboveExpected
        ? `${eventData.event} above forecast, potential bullish impact on ${eventData.country}.`
        : `${eventData.event} below forecast, potential bearish pressure on ${eventData.country}.`;

      return {
        summary: `${analysis}\n\n⚠️ This is a demo analysis. For real AI insights, please configure your OpenAI API key in environment variables.`,
        whatHappened: analysis,
        whyImportant: analysis,
        marketImpact: analysis,
        language: 'en'
      };
    }
  };

  // Call OpenAI API
  const fetchAIInsight = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const language = detectLanguage();

      // 🔧 DEMO MODE - Remove this when API is configured
      if (AI_API_CONFIG.demoMode) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        const demoInsight = generateDemoAnalysis(event, language);
        setInsight(demoInsight);
        setIsLoading(false);
        return;
      }

      const prompt = generatePrompt(event, language);

      // 🔧 API CALL CONFIGURATION
      const response = await fetch(AI_API_CONFIG.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${AI_API_CONFIG.apiKey}`,
        },
        body: JSON.stringify({
          model: AI_API_CONFIG.model,
          messages: [
            {
              role: 'system',
              content: 'Summarize economic events in a single, short, direct sentence. Maximum 25 words. No explanations, no introduction, no extra details. Write ONLY the most actionable insight for a trader. Match the requested language exactly.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: AI_API_CONFIG.maxTokens,
          temperature: 0.7,
          // 🔧 LANGUAGE FLAG - Pass language code for API tracking
          metadata: {
            language: language,
            eventType: event.event,
            country: event.country,
            importance: event.importance
          }
        })
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const aiResponse = data.choices?.[0]?.message?.content;

      if (!aiResponse) {
        throw new Error('No response from AI');
      }

      // Parse AI response - for now, treat as single summary
      // In production, you might want to structure the AI response better
      const parsedInsight: AIInsightResponse = {
        summary: aiResponse,
        whatHappened: aiResponse.split('\n')[0] || aiResponse.substring(0, 150),
        whyImportant: aiResponse.split('\n')[1] || aiResponse.substring(150, 300),
        marketImpact: aiResponse.split('\n')[2] || aiResponse.substring(300),
        language: language
      };

      setInsight(parsedInsight);
    } catch (err) {
      console.error('AI Analysis Error:', err);
      setError(err instanceof Error ? err.message : 'خطأ في الحصول على التحليل');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle button click
  const handleAnalysisClick = () => {
    setIsOpen(true);
    if (!insight && !error) {
      fetchAIInsight();
    }
  };

  // Get importance color
  const getImportanceColor = (level: number) => {
    switch (level) {
      case 3: return 'bg-red-500';
      case 2: return 'bg-orange-500';  
      case 1: return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "text-xs whitespace-nowrap hover:bg-primary/10 hover:text-primary transition-colors",
            className
          )}
          disabled={event.actual === "-"}
          onClick={handleAnalysisClick}
          data-tour-target="ai-analysis"
        >
          <Brain className="w-3 h-3 mr-1" />
          تحليل الذكاء الاصطناعي
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-right">
            <Sparkles className="w-5 h-5 text-primary" />
            تحليل ذكي للحدث الاقتصادي
          </DialogTitle>
          <DialogDescription className="text-right">
            تحليل مدعوم بالذكاء الاصطناعي للحدث الاقتصادي وتأثيره على الأسواق
          </DialogDescription>
        </DialogHeader>

        {/* Event Summary Card */}
        <Card className="mb-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">{event.countryFlag}</span>
                <span className="font-mono">{event.country}</span>
              </div>
              <Badge 
                variant="outline" 
                className={cn("text-white", getImportanceColor(event.importance))}
              >
                أهمية {event.importance}/3
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-2 text-right">
            <div className="font-medium text-base">{event.event}</div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">الفعلي:</span>
                <span className={cn(
                  "font-mono font-bold mr-2",
                  event.actual !== "-" && event.actual !== event.forecast
                    ? parseFloat(event.actual) > parseFloat(event.forecast) 
                      ? "text-green-600" 
                      : "text-red-600"
                    : "text-foreground"
                )}>
                  {event.actual}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">المتوقع:</span>
                <span className="font-mono mr-2">{event.forecast}</span>
              </div>
              <div>
                <span className="text-muted-foreground">السابق:</span>
                <span className="font-mono mr-2">{event.previous}</span>
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              {event.date} في {event.time} GMT
            </div>
          </CardContent>
        </Card>

        {/* AI Analysis Content */}
        <div className="space-y-4">
          {isLoading && (
            <Card>
              <CardContent className="py-8 text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
                <p className="text-muted-foreground">جاري تحليل الحدث الاقتصادي...</p>
                <p className="text-xs text-muted-foreground mt-2">
                  قد يستغرق هذا بضع ثوان
                </p>
              </CardContent>
            </Card>
          )}

          {error && (
            <Card className="border-red-200 dark:border-red-800">
              <CardContent className="py-6 text-center text-right">
                <AlertCircle className="w-8 h-8 mx-auto mb-4 text-red-500" />
                <p className="text-red-600 dark:text-red-400 font-medium mb-2">
                  خطأ في الحصول على التحليل
                </p>
                <p className="text-sm text-red-500 mb-4">{error}</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={fetchAIInsight}
                  className="border-red-200 hover:bg-red-50 dark:hover:bg-red-950"
                >
                  إعادة المحاولة
                </Button>
              </CardContent>
            </Card>
          )}

          {insight && (
            <Card>
              <CardHeader>
                <CardTitle className="text-right flex items-center gap-2">
                  <Brain className="w-5 h-5 text-primary" />
                  التحليل الذكي
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-right">
                <div className="prose prose-sm max-w-none text-right [&>*]:text-right">
                  <div className="whitespace-pre-wrap leading-relaxed">
                    {insight.summary}
                  </div>
                </div>
                
                <div className="mt-6 pt-4 border-t border-border">
                  <div className="flex items-center justify-center text-xs text-muted-foreground">
                    <span>مدعوم بالذكاء الاصطناعي</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
