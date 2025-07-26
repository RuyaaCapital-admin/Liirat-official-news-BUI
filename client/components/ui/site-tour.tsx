import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, ChevronRight, ChevronLeft, Play, SkipForward } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/language-context';

interface TourStep {
  id: string;
  target: string; // CSS selector for element to highlight
  title: string;
  description: string;
  emoji: string;
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  offset?: { x: number; y: number };
}

interface SiteTourProps {
  autoStart?: boolean;
  onComplete?: () => void;
  className?: string;
}

const TOUR_STORAGE_KEY = 'liirat-tour-completed';

export function SiteTour({ autoStart = true, onComplete, className }: SiteTourProps) {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [language, setLanguage] = useState<'ar' | 'en'>('ar');
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const [showWelcome, setShowWelcome] = useState(false);

  // Detect language from page content
  const detectLanguage = (): 'ar' | 'en' => {
    const htmlDir = document.documentElement.getAttribute('dir');
    if (htmlDir === 'rtl') return 'ar';
    
    const hasArabicText = document.body.textContent?.includes('التقويم') || 
                         document.body.textContent?.includes('ليرات');
    return hasArabicText ? 'ar' : 'en';
  };

  // Tour steps configuration (bilingual)
  const getTourSteps = (lang: 'ar' | 'en'): TourStep[] => {
    if (lang === 'ar') {
      return [
        {
          id: 'ticker',
          target: '[data-loc*="price-ticker"]',
          title: '📈 شريط الأسعار المباشر',
          description: 'تابع أسعار العملات والذهب والنفط والمؤشرات العالمية في الوقت الفعلي',
          emoji: '📈',
          position: 'bottom'
        },
        {
          id: 'calendar',
          target: '[href="#calendar"], #calendar, [data-loc*="calendar"]',
          title: '📅 التقويم الاقتصادي',
          description: 'اطلع على أهم الأحداث الاقتصادية والبيانات المالية القادمة',
          emoji: '📅',
          position: 'bottom'
        },
        {
          id: 'alerts',
          target: '[href="#alerts"], #alerts, button[class*="bell"]',
          title: '🔔 التنبيهات الذكية',
          description: 'احصل على تنبيهات فورية عند صدور البيانات الاقتصادية المهمة',
          emoji: '🔔',
          position: 'bottom'
        },
        {
          id: 'ai-analysis',
          target: 'button:contains("تحليل الذكاء الاصطناعي"), [data-loc*="ai-event"]',
          title: '🤖 التحليل الذكي',
          description: 'احصل على تحليل فوري بالذكاء الاصطناعي لكل حدث اقتصادي',
          emoji: '🤖',
          position: 'left'
        },
        {
          id: 'contact',
          target: '[href="#contact"], #contact',
          title: '💬 الدعم والمساعدة',
          description: 'تواصل معنا للحصول على الدعم الفني والاستفسارات',
          emoji: '💬',
          position: 'top'
        },
        {
          id: 'navigation',
          target: 'nav, header nav',
          title: '🧭 شريط التنقل',
          description: 'استخدم القائمة للوصول السريع لجميع أقسام الموقع',
          emoji: '🧭',
          position: 'bottom'
        }
      ];
    } else {
      return [
        {
          id: 'ticker',
          target: '[data-loc*="price-ticker"]',
          title: '📈 Live Price Ticker',
          description: 'Track real-time prices of currencies, gold, oil, and global indices',
          emoji: '📈',
          position: 'bottom'
        },
        {
          id: 'calendar',
          target: '[href="#calendar"], #calendar, [data-loc*="calendar"]',
          title: '📅 Economic Calendar',
          description: 'View upcoming economic events and important financial data releases',
          emoji: '📅',
          position: 'bottom'
        },
        {
          id: 'alerts',
          target: '[href="#alerts"], #alerts, button[class*="bell"]',
          title: '🔔 Smart Alerts',
          description: 'Get instant notifications when important economic data is released',
          emoji: '🔔',
          position: 'bottom'
        },
        {
          id: 'ai-analysis',
          target: 'button:contains("AI Analysis"), [data-loc*="ai-event"]',
          title: '🤖 AI Analysis',
          description: 'Get instant AI-powered analysis for every economic event',
          emoji: '🤖',
          position: 'left'
        },
        {
          id: 'contact',
          target: '[href="#contact"], #contact',
          title: '💬 Support & Help',
          description: 'Contact us for technical support and inquiries',
          emoji: '💬',
          position: 'top'
        },
        {
          id: 'navigation',
          target: 'nav, header nav',
          title: '🧭 Navigation',
          description: 'Use the menu to quickly access all sections of the site',
          emoji: '🧭',
          position: 'bottom'
        }
      ];
    }
  };

  const [tourSteps, setTourSteps] = useState<TourStep[]>([]);

  // Check if tour was already completed
  useEffect(() => {
    const completed = localStorage.getItem(TOUR_STORAGE_KEY);
    const detectedLang = detectLanguage();
    setLanguage(detectedLang);
    setTourSteps(getTourSteps(detectedLang));
    
    if (!completed && autoStart) {
      // Show welcome screen first
      setTimeout(() => setShowWelcome(true), 1000);
    }
  }, [autoStart]);

  // Find target element for current step
  useEffect(() => {
    if (!isActive || tourSteps.length === 0) return;
    
    const step = tourSteps[currentStep];
    if (!step) return;

    const findElement = () => {
      // Try multiple selectors
      const selectors = [
        step.target,
        step.target.split(',')[0].trim(),
        `[data-tour-target="${step.id}"]`
      ];
      
      for (const selector of selectors) {
        try {
          const element = document.querySelector(selector) as HTMLElement;
          if (element) {
            setTargetElement(element);
            // Scroll element into view
            element.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'center',
              inline: 'center'
            });
            return;
          }
        } catch (e) {
          // Invalid selector, continue
        }
      }
      
      // Fallback: find by text content for some steps
      if (step.id === 'calendar' && language === 'ar') {
        const calendarLink = Array.from(document.querySelectorAll('a')).find(
          a => a.textContent?.includes('التقويم')
        );
        if (calendarLink) setTargetElement(calendarLink as HTMLElement);
      }
    };

    findElement();
    
    // Retry finding element if not found immediately
    const retryTimer = setTimeout(findElement, 500);
    return () => clearTimeout(retryTimer);
  }, [currentStep, isActive, tourSteps, language]);

  // Get element position for callout placement
  const getElementPosition = (element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
    
    return {
      top: rect.top + scrollTop,
      left: rect.left + scrollLeft,
      width: rect.width,
      height: rect.height,
      centerX: rect.left + scrollLeft + rect.width / 2,
      centerY: rect.top + scrollTop + rect.height / 2
    };
  };

  // Calculate callout position
  const getCalloutPosition = (element: HTMLElement, position: string) => {
    const elementPos = getElementPosition(element);
    const calloutWidth = 320;
    const calloutHeight = 150;
    const offset = 20;

    switch (position) {
      case 'top':
        return {
          top: elementPos.top - calloutHeight - offset,
          left: elementPos.centerX - calloutWidth / 2,
        };
      case 'bottom':
        return {
          top: elementPos.top + elementPos.height + offset,
          left: elementPos.centerX - calloutWidth / 2,
        };
      case 'left':
        return {
          top: elementPos.centerY - calloutHeight / 2,
          left: elementPos.left - calloutWidth - offset,
        };
      case 'right':
        return {
          top: elementPos.centerY - calloutHeight / 2,
          left: elementPos.left + elementPos.width + offset,
        };
      default:
        return {
          top: window.innerHeight / 2 - calloutHeight / 2,
          left: window.innerWidth / 2 - calloutWidth / 2,
        };
    }
  };

  const startTour = () => {
    setShowWelcome(false);
    setIsActive(true);
    setCurrentStep(0);
  };

  const nextStep = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeTour();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const skipTour = () => {
    setShowWelcome(false);
    setIsActive(false);
    localStorage.setItem(TOUR_STORAGE_KEY, 'true');
  };

  const completeTour = () => {
    setIsActive(false);
    setIsCompleted(true);
    localStorage.setItem(TOUR_STORAGE_KEY, 'true');
    onComplete?.();
    
    // Auto-hide completion message
    setTimeout(() => setIsCompleted(false), 3000);
  };

  const currentStepData = tourSteps[currentStep];
  const calloutPosition = targetElement && currentStepData 
    ? getCalloutPosition(targetElement, currentStepData.position)
    : { top: 0, left: 0 };

  // Welcome dialog
  if (showWelcome) {
    return (
      <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-6 text-center">
            <div className="text-4xl mb-4">👋</div>
            <h2 className="text-xl font-bold mb-2">
              {language === 'ar' ? 'مرحباً بك في ليرات' : 'Welcome to Liirat'}
            </h2>
            <p className="text-muted-foreground mb-6">
              {language === 'ar' 
                ? 'هل تريد جولة سريعة لاكتشاف ميزات المنصة؟'
                : 'Would you like a quick tour to discover the platform features?'
              }
            </p>
            <div className="flex gap-3 justify-center">
              <Button onClick={startTour} className="gap-2">
                <Play className="w-4 h-4" />
                {language === 'ar' ? 'ابدأ الجولة' : 'Start Tour'}
              </Button>
              <Button variant="outline" onClick={skipTour} className="gap-2">
                <SkipForward className="w-4 h-4" />
                {language === 'ar' ? 'تخطي' : 'Skip'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Tour overlay and callout
  if (isActive && currentStepData && targetElement) {
    const elementPos = getElementPosition(targetElement);
    
    return (
      <div className="fixed inset-0 z-[9999] pointer-events-none">
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" />
        
        {/* Highlight cutout */}
        <div 
          className="absolute border-2 border-primary rounded-lg shadow-2xl shadow-primary/50 pointer-events-none animate-pulse"
          style={{
            top: elementPos.top - 4,
            left: elementPos.left - 4,
            width: elementPos.width + 8,
            height: elementPos.height + 8,
            boxShadow: `0 0 0 9999px rgba(0, 0, 0, 0.4), 0 0 20px rgba(var(--primary), 0.8)`
          }}
        />

        {/* Tour callout */}
        <Card 
          className="absolute pointer-events-auto max-w-[320px] shadow-2xl border-2 border-primary/20"
          style={{
            top: Math.max(10, Math.min(calloutPosition.top, window.innerHeight - 180)),
            left: Math.max(10, Math.min(calloutPosition.left, window.innerWidth - 340)),
          }}
        >
          <CardContent className="p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">{currentStepData.emoji}</span>
                <Badge variant="outline" className="text-xs">
                  {currentStep + 1} / {tourSteps.length}
                </Badge>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={skipTour}
                className="w-6 h-6 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Content */}
            <h3 className="font-semibold text-sm mb-2 text-right">
              {currentStepData.title}
            </h3>
            <p className="text-xs text-muted-foreground mb-4 text-right leading-relaxed">
              {currentStepData.description}
            </p>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={prevStep}
                disabled={currentStep === 0}
                className="gap-1"
              >
                {language === 'ar' ? (
                  <>
                    السابق <ChevronRight className="w-3 h-3" />
                  </>
                ) : (
                  <>
                    <ChevronLeft className="w-3 h-3" /> Previous
                  </>
                )}
              </Button>
              
              <Button 
                onClick={nextStep}
                size="sm"
                className="gap-1"
              >
                {currentStep === tourSteps.length - 1 
                  ? (language === 'ar' ? 'إنهاء' : 'Finish')
                  : (language === 'ar' ? (
                      <>
                        التالي <ChevronLeft className="w-3 h-3" />
                      </>
                    ) : (
                      <>
                        Next <ChevronRight className="w-3 h-3" />
                      </>
                    ))
                }
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Completion message
  if (isCompleted) {
    return (
      <div className="fixed bottom-4 right-4 z-[9999]">
        <Card className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
          <CardContent className="p-4 flex items-center gap-2">
            <span className="text-green-600">✅</span>
            <span className="text-sm font-medium">
              {language === 'ar' 
                ? 'تمت الجولة بنجاح! استمتع باستخدام ليرات'
                : 'Tour completed! Enjoy using Liirat'
              }
            </span>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}

// Hook for manual tour control
export function useSiteTour() {
  const [tourComponent, setTourComponent] = useState<React.ReactNode>(null);

  const startTour = (options?: { onComplete?: () => void }) => {
    localStorage.removeItem(TOUR_STORAGE_KEY);
    setTourComponent(
      <SiteTour 
        autoStart={true}
        onComplete={() => {
          setTourComponent(null);
          options?.onComplete?.();
        }}
      />
    );
  };

  const resetTour = () => {
    localStorage.removeItem(TOUR_STORAGE_KEY);
  };

  return {
    tourComponent,
    startTour,
    resetTour,
    isTourCompleted: !!localStorage.getItem(TOUR_STORAGE_KEY)
  };
}
