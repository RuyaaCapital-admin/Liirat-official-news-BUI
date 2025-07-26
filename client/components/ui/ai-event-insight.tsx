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
  currentLanguage?: 'ar' | 'en';
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

export function AIEventInsight({ event, currentLanguage = 'ar', className }: AIEventInsightProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [insight, setInsight] = useState<AIInsightResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  // Detect language from website content or user preference
  const detectLanguage = (): 'ar' | 'en' => {
    // Check HTML dir attribute
    const htmlDir = document.documentElement.getAttribute('dir');
    if (htmlDir === 'rtl') return 'ar';
    
    // Check for Arabic text in the page
    const hasArabicText = document.body.textContent?.includes('العملة') || 
                         document.body.textContent?.includes('الاقتصادي');
    if (hasArabicText) return 'ar';
    
    // Default to current language prop or Arabic
    return currentLanguage;
  };

  // Generate AI prompt based on event data and language
  const generatePrompt = (eventData: EconomicEvent, language: 'ar' | 'en'): string => {
    const languageInstructions = {
      ar: {
        instructions: 'يرجى الإجابة باللغة العربية. قدم تحليلاً مالياً واقتصادياً مفصلاً ومهنياً.',
        whatHappened: 'ماذا حدث؟',
        whyImportant: 'لماذا هذا مهم؟',
        marketImpact: 'ما هو التأثير المتوقع على الأسواق؟'
      },
      en: {
        instructions: 'Please respond in English. Provide a detailed and professional financial and economic analysis.',
        whatHappened: 'What happened?',
        whyImportant: 'Why is this important?',
        marketImpact: 'What is the expected market impact?'
      }
    };

    const lang = languageInstructions[language];
    
    return `${lang.instructions}

Economic Event Analysis:
Event: ${eventData.event}
Country: ${eventData.country}
Date/Time: ${eventData.date} ${eventData.time} GMT
Forecast: ${eventData.forecast}
Previous: ${eventData.previous}
Actual: ${eventData.actual}
Importance Level: ${eventData.importance}/3

Please provide a comprehensive analysis structured as follows:

1. ${lang.whatHappened}
2. ${lang.whyImportant}  
3. ${lang.marketImpact}

Keep the analysis concise but informative, suitable for traders and investors. Focus on practical implications for currency markets, commodities, and indices.`;
  };

  // Generate demo analysis for testing without API
  const generateDemoAnalysis = (eventData: EconomicEvent, language: 'ar' | 'en'): AIInsightResponse => {
    if (language === 'ar') {
      return {
        summary: `تحليل للحدث الاقتصادي: ${eventData.event}

📊 ماذا حدث؟
جاءت البيانات الفعلية ${eventData.actual} مقارنة بالتوقعات ${eventData.forecast} والقيمة السابقة ${eventData.previous}. ${eventData.actual !== eventData.forecast ? (parseFloat(eventData.actual) > parseFloat(eventData.forecast) ? 'هذا يعني أن البيانات جاءت أعلى من المتوقع.' : 'هذا يعني أن البيانات جاءت أقل من المتوقع.') : 'البيانات جاءت متوافقة مع التوقعات.'}

💡 لماذا هذا مهم؟
هذا الحدث الاقتصادي له أهمية ${eventData.importance === 3 ? 'عالية جداً' : eventData.importance === 2 ? 'متوسطة' : 'منخفضة'} على الأسواق المالية. ${eventData.country} يلعب دوراً مهماً في الاقتصاد العالمي، وهذه البيانات تؤثر على قرارات البنوك المركزية والمستثمرين.

📈 التأثير المتوقع على الأسواق:
${eventData.actual !== eventData.forecast ?
  `نتوقع تأثيراً ${eventData.importance === 3 ? 'قوياً' : 'معتدلاً'} على عملة ${eventData.country} والأسواق المرتبط�� بها. قد نشهد تحركات في أسواق الذهب والنفط والمؤشرات الرئيسية.` :
  'التأثير قد يكون محدوداً نظراً لتوافق البيانات مع التوقعات، لكن السوق قد يركز على التفاصيل والتوجهات المستقبلية.'
}

⚠️ هذا تحليل تجريبي. للحصول على تحليل حقيقي، يرجى إعداد مفتاح OpenAI API.`,
        whatHappened: `البيانات الفعلية: ${eventData.actual}، المتوقع: ${eventData.forecast}`,
        whyImportant: `حدث بأهمية ${eventData.importance}/3 يؤثر على اقتصاد ${eventData.country}`,
        marketImpact: 'تأثير متوقع على العملات والأسواق العالمية',
        language: 'ar'
      };
    } else {
      return {
        summary: `Economic Event Analysis: ${eventData.event}

📊 What Happened?
The actual reading came in at ${eventData.actual} compared to the forecast of ${eventData.forecast} and previous value of ${eventData.previous}. ${eventData.actual !== eventData.forecast ? (parseFloat(eventData.actual) > parseFloat(eventData.forecast) ? 'This indicates the data came in above expectations.' : 'This indicates the data came in below expectations.') : 'The data aligned with market expectations.'}

💡 Why Is This Important?
This economic event has ${eventData.importance === 3 ? 'high' : eventData.importance === 2 ? 'moderate' : 'low'} importance for financial markets. ${eventData.country} plays a significant role in the global economy, and this data influences central bank decisions and investor sentiment.

📈 Expected Market Impact:
${eventData.actual !== eventData.forecast ?
  `We expect a ${eventData.importance === 3 ? 'strong' : 'moderate'} impact on ${eventData.country} currency and related markets. We may see movements in gold, oil, and major indices.` :
  'The impact may be limited given the data met expectations, but markets may focus on details and future trends.'
}

⚠️ This is a demo analysis. For real AI insights, please configure your OpenAI API key.`,
        whatHappened: `Actual: ${eventData.actual}, Expected: ${eventData.forecast}`,
        whyImportant: `High-importance event affecting ${eventData.country} economy`,
        marketImpact: 'Expected impact on currencies and global markets',
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
              content: language === 'ar' 
                ? 'أنت محلل اقتصادي ومالي خبير. قدم تحليلات دقيقة ومفيدة باللغة العربية.'
                : 'You are an expert economic and financial analyst. Provide accurate and helpful analysis in English.'
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
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>مدعوم بالذكاء الاصطناعي</span>
                    <div className="flex items-center gap-2">
                      <span>اللغة: {insight.language === 'ar' ? 'العربية' : 'English'}</span>
                      <Badge variant="outline" className="text-xs">
                        GPT-3.5
                      </Badge>
                    </div>
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
