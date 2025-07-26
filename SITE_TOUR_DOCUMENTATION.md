# 🎯 Liirat Site Tour - Comprehensive Guide

## 📋 Overview

The Liirat Site Tour is a smart, interactive onboarding experience that guides new users through the key features of the financial news platform. It automatically detects the user's language (Arabic/English) and provides contextual explanations for each major feature.

## ✨ Key Features

### 🎨 **Smart Design**
- **Theme Integration**: Seamlessly matches your dark theme
- **No Visual Clutter**: Clean overlays with transparent backgrounds  
- **Modern UI**: Professional callout bubbles with smooth animations
- **Responsive**: Works perfectly on desktop and mobile

### 🌐 **Language Intelligence**
- **Auto-Detection**: Detects Arabic/English from page content
- **Bilingual Support**: Complete Arabic and English translations
- **RTL Support**: Proper right-to-left layout for Arabic

### 🎯 **Smart Tour Steps**

1. **📈 Price Ticker** - Real-time financial data
2. **📅 Economic Calendar** - Important economic events
3. **🔔 Smart Alerts** - Notification system
4. **🤖 AI Analysis** - Intelligent event insights
5. **💬 Support** - Contact and help section
6. **🧭 Navigation** - Site navigation overview

### 🧠 **Intelligent Behavior**
- **First-Visit Detection**: Only shows for new users
- **Local Storage**: Remembers completion status
- **Skip Option**: Users can skip anytime
- **Manual Trigger**: Available in navigation and footer

## 🔧 Implementation

### **React Component Integration**

```tsx
import { SiteTour } from '@/components/ui/site-tour';
import { TourTrigger } from '@/components/ui/tour-trigger';

// Auto-start tour
<SiteTour />

// Manual tour trigger (icon button)
<TourTrigger variant="icon" />

// Manual tour trigger (text link)  
<TourTrigger variant="text" />
```

### **Hook Usage**

```tsx
import { useSiteTour } from '@/components/ui/site-tour';

function MyComponent() {
  const { tourComponent, startTour, resetTour, isTourCompleted } = useSiteTour();

  return (
    <div>
      <button onClick={startTour}>Start Tour</button>
      <button onClick={resetTour}>Reset Tour</button>
      {tourComponent}
    </div>
  );
}
```

### **Data Attributes for Targeting**

Add these to your HTML elements for tour targeting:

```html
<!-- Price Ticker -->
<div data-tour-target="ticker">...</div>

<!-- Economic Calendar -->
<section data-tour-target="calendar">...</section>

<!-- Alerts Section -->
<section data-tour-target="alerts">...</section>

<!-- AI Analysis Button -->
<button data-tour-target="ai-analysis">...</button>

<!-- Contact Section -->
<section data-tour-target="contact">...</section>

<!-- Navigation -->
<nav data-tour-target="navigation">...</nav>
```

## 🎬 **Embed Script** (Standalone)

For non-React projects, use the standalone embed script:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Your Site</title>
</head>
<body>
    <!-- Your content with data-tour-target attributes -->
    
    <!-- Add tour script before closing body tag -->
    <script src="/liirat-tour-embed.js"></script>
    
    <!-- Optional: Manual controls -->
    <script>
        // Start tour manually
        LiiratTour.start();
        
        // Reset tour completion
        LiiratTour.reset();
        
        // Check if completed
        console.log('Tour completed:', LiiratTour.isCompleted());
    </script>
</body>
</html>
```

## 🎨 **Customization**

### **Tour Step Configuration**

```typescript
interface TourStep {
  id: string;                    // Unique identifier
  target: string;               // CSS selector
  title: string;                // Step title
  description: string;          // Step description  
  emoji: string;                // Visual emoji
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  offset?: { x: number; y: number }; // Position offset
}
```

### **Language Configuration**

```typescript
const tourSteps = {
  ar: [
    {
      id: 'ticker',
      target: '[data-tour-target="ticker"]',
      title: '📈 شريط الأسعار المباشر',
      description: 'تابع أسعار العملات والذهب والنفط في الوقت الفعلي',
      position: 'bottom'
    }
    // ... more steps
  ],
  en: [
    {
      id: 'ticker', 
      target: '[data-tour-target="ticker"]',
      title: '📈 Live Price Ticker',
      description: 'Track real-time prices of currencies, gold, and oil',
      position: 'bottom'
    }
    // ... more steps
  ]
};
```

### **Styling Customization**

```css
/* Tour overlay */
.tour-overlay {
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(1px);
}

/* Highlight border */
.tour-highlight {
  border-color: hsl(var(--primary));
  box-shadow: 0 0 20px hsl(var(--primary) / 0.8);
}

/* Callout bubble */
.tour-callout {
  background: hsl(var(--background));
  border: 2px solid hsl(var(--primary) / 0.2);
  color: hsl(var(--foreground));
}
```

## 📱 **Responsive Behavior**

### **Desktop Features**
- Full-size callout bubbles
- Precise element highlighting
- Smooth animations
- Hover effects

### **Mobile Adaptations**
- Smaller callout bubbles
- Touch-friendly buttons
- Adjusted positioning
- Simplified animations

## 🔧 **Integration Points**

### **Header Navigation**
```tsx
<div className="flex items-center space-x-2">
  <Button data-tour-target="alerts">🔔</Button>
  <TourTrigger variant="icon" />
  <ThemeToggle />
</div>
```

### **Footer Links**
```tsx
<div className="footer-links">
  <a href="#privacy">Privacy</a>
  <a href="#terms">Terms</a>
  <TourFooterLink />
</div>
```

## 📊 **Analytics & Tracking**

### **Tour Completion Events**

```typescript
// Track tour start
analytics.track('tour_started', {
  language: detectedLanguage,
  timestamp: Date.now()
});

// Track step completion
analytics.track('tour_step_completed', {
  step_id: currentStep.id,
  step_number: currentStepIndex,
  language: language
});

// Track tour completion
analytics.track('tour_completed', {
  completion_time: Date.now() - startTime,
  total_steps: tourSteps.length,
  language: language
});
```

### **User Behavior Insights**

```typescript
// Track skip behavior
analytics.track('tour_skipped', {
  step_at_skip: currentStepIndex,
  reason: 'user_action'
});

// Track manual tour starts
analytics.track('tour_manual_start', {
  trigger_location: 'header' | 'footer' | 'manual'
});
```

## 🎯 **Performance Optimization**

### **Lazy Loading**
- Tour components load only when needed
- Minimal initial bundle impact
- Dynamic script loading for embed version

### **Memory Management**
- Proper cleanup of event listeners
- DOM element removal after completion
- Local storage optimization

## 🔍 **Accessibility Features**

### **Keyboard Navigation**
- Tab navigation through tour steps
- Enter/Space to proceed
- Escape to skip tour

### **Screen Reader Support**
- ARIA labels for all interactive elements
- Proper heading structure
- Screen reader announcements

### **Color Contrast**
- High contrast callout bubbles
- Clear visual indicators
- Theme-aware styling

## 🚀 **Production Deployment**

### **Environment Setup**
```bash
# No additional dependencies required
# Tour works with existing React/TypeScript setup
```

### **Performance Monitoring**
```typescript
// Monitor tour performance
const tourMetrics = {
  loadTime: performance.now(),
  completionRate: completedTours / totalTourStarts,
  averageSteps: totalStepsCompleted / completedTours
};
```

### **Error Handling**
```typescript
try {
  // Tour initialization
  initializeTour();
} catch (error) {
  // Graceful fallback
  console.warn('Tour failed to initialize:', error);
  // Continue without tour
}
```

## 🔧 **Troubleshooting**

### **Common Issues**

1. **Tour not starting**
   - Check data-tour-target attributes
   - Verify localStorage is available
   - Ensure DOM elements exist

2. **Language detection fails**
   - Manually set language prop
   - Check HTML dir attribute
   - Verify Arabic content exists

3. **Positioning issues**
   - Check CSS positioning
   - Verify viewport calculations
   - Test on different screen sizes

### **Debug Mode**

```typescript
// Enable debug logging
localStorage.setItem('liirat-tour-debug', 'true');

// Reset tour state
localStorage.removeItem('liirat-tour-completed');

// Force language
localStorage.setItem('liirat-tour-language', 'ar');
```

## 📝 **Best Practices**

### **Content Guidelines**
- Keep descriptions under 25 words
- Use action-oriented language
- Include relevant emojis for visual appeal
- Test in both languages

### **UX Principles**
- Never block critical user actions
- Provide clear skip options
- Highlight most important features first
- Test with real users

### **Technical Standards**
- Follow accessibility guidelines
- Optimize for performance
- Handle edge cases gracefully
- Document customizations

## 🎉 **Success Metrics**

### **Key Performance Indicators**
- **Tour Completion Rate**: Target >70%
- **Feature Discovery**: Increased feature usage
- **User Retention**: Higher return visits
- **Support Reduction**: Fewer basic questions

### **A/B Testing**
- Test different step orders
- Experiment with copy variations  
- Compare auto-start vs manual trigger
- Measure optimal tour length
