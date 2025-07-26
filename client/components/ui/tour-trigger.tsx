import React from 'react';
import { Button } from '@/components/ui/button';
import { HelpCircle, Play } from 'lucide-react';
import { useSiteTour } from './site-tour';
import { useLanguage } from '@/contexts/language-context';

interface TourTriggerProps {
  variant?: 'button' | 'icon' | 'text';
  className?: string;
}

export function TourTrigger({ variant = 'button', className }: TourTriggerProps) {
  const { startTour, tourComponent } = useSiteTour();
  const { t } = useLanguage();

  const handleStartTour = () => {
    startTour();
  };

  if (variant === 'icon') {
    return (
      <>
        <Button
          variant="ghost"
          size="sm"
          className={`h-9 w-9 px-0 ${className}`}
          onClick={handleStartTour}
          title={t('nav.tour')}
        >
          <HelpCircle className="h-4 w-4" />
          <span className="sr-only">{t('nav.tour')}</span>
        </Button>
        {tourComponent}
      </>
    );
  }

  if (variant === 'text') {
    return (
      <>
        <button
          onClick={handleStartTour}
          className={`text-sm text-muted-foreground hover:text-primary transition-colors underline ${className}`}
        >
          جولة الموقع
        </button>
        {tourComponent}
      </>
    );
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={handleStartTour}
        className={`gap-2 ${className}`}
      >
        <Play className="w-4 h-4" />
        بدء جولة الموقع
      </Button>
      {tourComponent}
    </>
  );
}

// Helper component to add to footer
export function TourFooterLink() {
  return (
    <TourTrigger 
      variant="text" 
      className="hover:text-primary" 
    />
  );
}
