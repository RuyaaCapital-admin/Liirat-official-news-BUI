import React, { useState, useEffect, useCallback } from "react";
import Joyride, {
  CallBackProps,
  STATUS,
  EVENTS,
  ACTIONS,
  Step,
  Styles
} from "react-joyride";
import { useLanguage } from "@/contexts/language-context";

interface SiteTourProps {
  autoStart?: boolean;
  onComplete?: () => void;
  className?: string;
}

const TOUR_STORAGE_KEY = "liirat-tour-completed";

// Custom tour styles that match our theme
const getTourStyles = (isDark: boolean): Partial<Styles> => ({
  options: {
    primaryColor: 'hsl(85 85% 55%)', // Liirat green
    backgroundColor: isDark ? 'hsl(0 0% 8%)' : 'hsl(0 0% 100%)',
    textColor: isDark ? 'hsl(0 0% 98%)' : 'hsl(0 0% 9%)',
    overlayColor: 'rgba(0, 0, 0, 0.5)',
    spotlightShadow: '0 0 15px rgba(0, 0, 0, 0.5)',
    beaconSize: 36,
    zIndex: 9999,
  },
  tooltip: {
    fontSize: 14,
    textAlign: 'left' as const,
    borderRadius: 12,
    padding: 20,
    backgroundColor: isDark ? 'hsl(0 0% 8%)' : 'hsl(0 0% 100%)',
    color: isDark ? 'hsl(0 0% 98%)' : 'hsl(0 0% 9%)',
    border: `2px solid hsl(85 85% 55%)`,
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
    maxWidth: 350,
  },
  tooltipTitle: {
    color: isDark ? 'hsl(0 0% 98%)' : 'hsl(0 0% 9%)',
    fontSize: 16,
    fontWeight: 600,
    marginBottom: 8,
    textAlign: 'right' as const,
  },
  tooltipContent: {
    color: isDark ? 'hsl(0 0% 63%)' : 'hsl(0 0% 45%)',
    lineHeight: 1.6,
    textAlign: 'right' as const,
    fontSize: 13,
  },
  buttonNext: {
    backgroundColor: 'hsl(85 85% 55%)',
    color: 'hsl(0 0% 9%)',
    fontSize: 13,
    fontWeight: 500,
    padding: '8px 16px',
    borderRadius: 8,
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  buttonBack: {
    backgroundColor: 'transparent',
    color: isDark ? 'hsl(0 0% 63%)' : 'hsl(0 0% 45%)',
    fontSize: 13,
    padding: '8px 16px',
    borderRadius: 8,
    border: `1px solid ${isDark ? 'hsl(0 0% 14%)' : 'hsl(0 0% 89%)'}`,
    cursor: 'pointer',
    marginRight: 8,
  },
  buttonSkip: {
    backgroundColor: 'transparent',
    color: isDark ? 'hsl(0 0% 63%)' : 'hsl(0 0% 45%)',
    fontSize: 12,
    padding: '4px 8px',
    border: 'none',
    cursor: 'pointer',
    textDecoration: 'underline',
  },
  spotlight: {
    borderRadius: 8,
    border: '3px solid hsl(85 85% 55%)',
    boxShadow: '0 0 20px hsl(85 85% 55% / 0.6)',
  },
  beacon: {
    backgroundColor: 'hsl(85 85% 55%)',
    border: '3px solid hsl(85 85% 45%)',
    boxShadow: '0 0 20px hsl(85 85% 55% / 0.8)',
  },
  beaconInner: {
    backgroundColor: 'hsl(85 85% 65%)',
  },
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    backdropFilter: 'blur(2px)',
  }
});

export function SiteTour({
  autoStart = true,
  onComplete,
  className,
}: SiteTourProps) {
  const [run, setRun] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [steps, setSteps] = useState<Step[]>([]);
  const { language, t } = useLanguage();
  
  // Detect dark mode
  const [isDark, setIsDark] = useState(false);
  
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    
    checkDarkMode();
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, { 
      attributes: true, 
      attributeFilter: ['class'] 
    });
    
    return () => observer.disconnect();
  }, []);

  // Enhanced tour steps with better targeting and descriptions
  const getTourSteps = useCallback((lang: "ar" | "en"): Step[] => {
    if (lang === "ar") {
      return [
        {
          target: '[data-tour-target="ticker"], [data-loc*="price-ticker"], .ticker, [class*="ticker"]',
          content: (
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px', color: 'inherit' }}>
                📈 شريط الأسعار المباشر
              </h3>
              <p style={{ fontSize: '13px', lineHeight: '1.6', margin: 0, color: 'hsl(var(--muted-foreground))' }}>
                تابع أسعار العملات والذهب والنفط والمؤشرات العالمية ل��ظة بلحظة. البيانات محدثة كل ثانية من أسواق المال العالمية.
              </p>
            </div>
          ),
          placement: 'bottom' as const,
          disableBeacon: true,
          styles: {
            tooltip: {
              textAlign: 'right' as const,
            }
          }
        },
        {
          target: '[data-tour-target="navigation"], nav, header nav, [class*="nav"]',
          content: (
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px', color: 'inherit' }}>
                🧭 شريط التنقل الذكي
              </h3>
              <p style={{ fontSize: '13px', lineHeight: '1.6', margin: 0, color: 'hsl(var(--muted-foreground))' }}>
                استخدم القائمة للوصول السريع لجميع أقسام الموقع، مع إمكانية تغيير اللغة والمظهر وإعدادات التنبيهات.
              </p>
            </div>
          ),
          placement: 'bottom' as const,
          styles: {
            tooltip: {
              textAlign: 'right' as const,
            }
          }
        },
        {
          target: '[data-tour-target="calendar"], [href="#calendar"], #calendar, [data-loc*="calendar"]',
          content: (
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px', color: 'inherit' }}>
                📅 التقويم الاقتصادي التفاعلي
              </h3>
              <p style={{ fontSize: '13px', lineHeight: '1.6', margin: 0, color: 'hsl(var(--muted-foreground))' }}>
                اطلع على أهم الأحداث الاقتصادية والبيانات المالية القادمة مع مؤشرات الأهمية ومواعيد النشر الدقيقة.
              </p>
            </div>
          ),
          placement: 'top' as const,
          styles: {
            tooltip: {
              textAlign: 'right' as const,
            }
          }
        },
        {
          target: '[data-tour-target="alerts"], [href="#alerts"], #alerts, button[class*="bell"], [class*="notification"]',
          content: (
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px', color: 'inherit' }}>
                🔔 نظام التنبيهات الذكي
              </h3>
              <p style={{ fontSize: '13px', lineHeight: '1.6', margin: 0, color: 'hsl(var(--muted-foreground))' }}>
                احصل على تنبيهات فورية ومخصصة عند صدور البيانات الاقتصادية المهمة أو تحركات الأسواق الكبيرة.
              </p>
            </div>
          ),
          placement: 'bottom' as const,
          styles: {
            tooltip: {
              textAlign: 'right' as const,
            }
          }
        },
        {
          target: '[data-tour-target="ai-analysis"], button:contains("تحليل"), [data-loc*="ai-event"], [class*="ai"]',
          content: (
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px', color: 'inherit' }}>
                🤖 التحليل بالذكاء الاصطناعي
              </h3>
              <p style={{ fontSize: '13px', lineHeight: '1.6', margin: 0, color: 'hsl(var(--muted-foreground))' }}>
                احصل على تحليل فوري ومتقدم بالذكاء الاصطناعي لكل حدث اقتصادي مع توقعات تأثيره على الأسواق.
              </p>
            </div>
          ),
          placement: 'left' as const,
          styles: {
            tooltip: {
              textAlign: 'right' as const,
            }
          }
        },
        {
          target: '[data-tour-target="contact"], [href="#contact"], #contact, [class*="contact"]',
          content: (
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px', color: 'inherit' }}>
                💬 الدعم والمساعدة
              </h3>
              <p style={{ fontSize: '13px', lineHeight: '1.6', margin: 0, color: 'hsl(var(--muted-foreground))' }}>
                فريقنا متاح دائماً لمساعدتك. تواصل معنا للدعم الفني أو الاستفسارات حول المنصة وميزاتها.
              </p>
            </div>
          ),
          placement: 'top' as const,
          styles: {
            tooltip: {
              textAlign: 'right' as const,
            }
          }
        },
      ];
    } else {
      return [
        {
          target: '[data-tour-target="ticker"], [data-loc*="price-ticker"], .ticker, [class*="ticker"]',
          content: (
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px', color: 'inherit' }}>
                📈 Live Price Ticker
              </h3>
              <p style={{ fontSize: '13px', lineHeight: '1.6', margin: 0, color: 'hsl(var(--muted-foreground))' }}>
                Track real-time prices of currencies, gold, oil, and global indices. Data updated every second from global financial markets.
              </p>
            </div>
          ),
          placement: 'bottom' as const,
          disableBeacon: true,
        },
        {
          target: '[data-tour-target="navigation"], nav, header nav, [class*="nav"]',
          content: (
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px', color: 'inherit' }}>
                🧭 Smart Navigation
              </h3>
              <p style={{ fontSize: '13px', lineHeight: '1.6', margin: 0, color: 'hsl(var(--muted-foreground))' }}>
                Use the navigation menu to quickly access all site sections, with options to change language, theme, and alert settings.
              </p>
            </div>
          ),
          placement: 'bottom' as const,
        },
        {
          target: '[data-tour-target="calendar"], [href="#calendar"], #calendar, [data-loc*="calendar"]',
          content: (
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px', color: 'inherit' }}>
                📅 Interactive Economic Calendar
              </h3>
              <p style={{ fontSize: '13px', lineHeight: '1.6', margin: 0, color: 'hsl(var(--muted-foreground))' }}>
                View upcoming economic events and important financial data releases with impact indicators and precise timing.
              </p>
            </div>
          ),
          placement: 'top' as const,
        },
        {
          target: '[data-tour-target="alerts"], [href="#alerts"], #alerts, button[class*="bell"], [class*="notification"]',
          content: (
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px', color: 'inherit' }}>
                🔔 Smart Alert System
              </h3>
              <p style={{ fontSize: '13px', lineHeight: '1.6', margin: 0, color: 'hsl(var(--muted-foreground))' }}>
                Get instant, personalized notifications when important economic data is released or major market movements occur.
              </p>
            </div>
          ),
          placement: 'bottom' as const,
        },
        {
          target: '[data-tour-target="ai-analysis"], button:contains("AI Analysis"), [data-loc*="ai-event"], [class*="ai"]',
          content: (
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px', color: 'inherit' }}>
                🤖 AI-Powered Analysis
              </h3>
              <p style={{ fontSize: '13px', lineHeight: '1.6', margin: 0, color: 'hsl(var(--muted-foreground))' }}>
                Get instant, advanced AI analysis for every economic event with predictions of market impact and insights.
              </p>
            </div>
          ),
          placement: 'left' as const,
        },
        {
          target: '[data-tour-target="contact"], [href="#contact"], #contact, [class*="contact"]',
          content: (
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px', color: 'inherit' }}>
                💬 Support & Help
              </h3>
              <p style={{ fontSize: '13px', lineHeight: '1.6', margin: 0, color: 'hsl(var(--muted-foreground))' }}>
                Our team is always available to help. Contact us for technical support or inquiries about the platform and its features.
              </p>
            </div>
          ),
          placement: 'top' as const,
        },
      ];
    }
  }, []);

  // Initialize tour steps when language changes
  useEffect(() => {
    setSteps(getTourSteps(language));
  }, [language, getTourSteps]);

  // Check if tour was already completed and auto-start
  useEffect(() => {
    const completed = localStorage.getItem(TOUR_STORAGE_KEY);
    
    if (!completed && autoStart) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        setRun(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [autoStart]);

  // Handle tour events
  const handleJoyrideCallback = useCallback((data: CallBackProps) => {
    const { status, type, index, action } = data;

    if (type === EVENTS.STEP_AFTER || type === EVENTS.TARGET_NOT_FOUND) {
      // Update step index
      setStepIndex(index + (action === ACTIONS.PREV ? -1 : 1));
    } else if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      // Tour completed or skipped
      setRun(false);
      setStepIndex(0);
      localStorage.setItem(TOUR_STORAGE_KEY, "true");
      
      if (status === STATUS.FINISHED) {
        onComplete?.();
      }
    }
  }, [onComplete]);

  // Custom tour locale for bilingual support
  const locale = {
    back: language === "ar" ? "السابق" : "Previous",
    close: language === "ar" ? "إغلاق" : "Close", 
    last: language === "ar" ? "إنهاء" : "Finish",
    next: language === "ar" ? "التالي" : "Next",
    open: language === "ar" ? "فتح الحوار" : "Open the dialog",
    skip: language === "ar" ? "تخطي الجولة" : "Skip tour",
  };

  if (!run || steps.length === 0) return null;

  return (
    <Joyride
      callback={handleJoyrideCallback}
      continuous={true}
      hideCloseButton={false}
      run={run}
      scrollToFirstStep={true}
      showProgress={true}
      showSkipButton={true}
      steps={steps}
      stepIndex={stepIndex}
      styles={getTourStyles(isDark)}
      locale={locale}
      disableOverlayClose={false}
      disableScrolling={false}
      floaterProps={{
        disableAnimation: false,
        styles: {
          floater: {
            filter: 'drop-shadow(0 10px 40px rgba(0, 0, 0, 0.15))',
          }
        }
      }}
      tooltipComponent={({ tooltipProps, primaryProps, backProps, skipProps, isLastStep, step }) => (
        <div 
          {...tooltipProps}
          style={{
            ...tooltipProps.style,
            backgroundColor: isDark ? 'hsl(0 0% 8%)' : 'hsl(0 0% 100%)',
            border: `2px solid hsl(85 85% 55%)`,
            borderRadius: 12,
            padding: 20,
            maxWidth: 350,
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
          }}
        >
          <div style={{ marginBottom: 16 }}>
            {step.content}
          </div>
          
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            paddingTop: 12,
            borderTop: `1px solid ${isDark ? 'hsl(0 0% 14%)' : 'hsl(0 0% 89%)'}`,
          }}>
            <div style={{ display: 'flex', gap: 8 }}>
              {stepIndex > 0 && (
                <button
                  {...backProps}
                  style={{
                    backgroundColor: 'transparent',
                    color: isDark ? 'hsl(0 0% 63%)' : 'hsl(0 0% 45%)',
                    fontSize: 13,
                    padding: '8px 16px',
                    borderRadius: 8,
                    border: `1px solid ${isDark ? 'hsl(0 0% 14%)' : 'hsl(0 0% 89%)'}`,
                    cursor: 'pointer',
                  }}
                >
                  {locale.back}
                </button>
              )}
              
              <button
                {...primaryProps}
                style={{
                  backgroundColor: 'hsl(85 85% 55%)',
                  color: 'hsl(0 0% 9%)',
                  fontSize: 13,
                  fontWeight: 500,
                  padding: '8px 16px',
                  borderRadius: 8,
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                {isLastStep ? locale.last : locale.next}
              </button>
            </div>
            
            <button
              {...skipProps}
              style={{
                backgroundColor: 'transparent',
                color: isDark ? 'hsl(0 0% 63%)' : 'hsl(0 0% 45%)',
                fontSize: 12,
                padding: '4px 8px',
                border: 'none',
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              {locale.skip}
            </button>
          </div>
        </div>
      )}
    />
  );
}

// Hook for manual tour control
export function useSiteTour() {
  const [tourComponent, setTourComponent] = useState<React.ReactNode>(null);

  const startTour = useCallback((options?: { onComplete?: () => void }) => {
    // Reset tour completion status
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
  }, []);

  const resetTour = useCallback(() => {
    localStorage.removeItem(TOUR_STORAGE_KEY);
  }, []);

  const isTourCompleted = !!localStorage.getItem(TOUR_STORAGE_KEY);

  return {
    tourComponent,
    startTour,
    resetTour,
    isTourCompleted,
  };
}
