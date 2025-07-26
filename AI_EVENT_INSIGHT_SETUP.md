# AI Event Insight Feature Setup Guide

## 🎯 Overview

The AI Event Insight feature provides intelligent analysis of economic events using OpenAI's GPT models. When users click the "AI Analysis" button next to any economic event, the system generates a comprehensive analysis including:

- What happened?
- Why is it important?
- What's the likely market impact?

## 🔧 API Configuration

### 1. Environment Variables

Create a `.env` file in your project root and add your OpenAI API credentials:

```bash
# Required: Your OpenAI API Key
VITE_OPENAI_API_KEY=sk-your-actual-openai-api-key-here

# Optional: Custom API endpoint (defaults to OpenAI's official endpoint)
VITE_OPENAI_API_URL=https://api.openai.com/v1/chat/completions
```

### 2. API Configuration Location

The API configuration is centralized in `client/components/ui/ai-event-insight.tsx`:

```typescript
// 🔧 REPLACE THESE VALUES
const AI_API_CONFIG = {
  apiUrl:
    process.env.VITE_OPENAI_API_URL ||
    "https://api.openai.com/v1/chat/completions",
  apiKey: process.env.VITE_OPENAI_API_KEY || "your-api-key-here",
  model: "gpt-3.5-turbo",
  maxTokens: 500,
};
```

## 🌐 Language Support

### Automatic Language Detection

The system automatically detects the page language using multiple methods:

1. **HTML dir attribute**: `<html dir="rtl">` = Arabic, `<html dir="ltr">` = English
2. **Content analysis**: Searches for Arabic text patterns
3. **Fallback**: Defaults to Arabic if detection fails

### Language Implementation

```typescript
// Language detection in component
const detectLanguage = (): "ar" | "en" => {
  const htmlDir = document.documentElement.getAttribute("dir");
  if (htmlDir === "rtl") return "ar";

  const hasArabicText = document.body.textContent?.includes("العملة");
  if (hasArabicText) return "ar";

  return currentLanguage; // fallback
};
```

### API Request with Language Flag

The API request includes language metadata:

```typescript
{
  model: "gpt-3.5-turbo",
  messages: [...],
  metadata: {
    language: "ar" | "en",           // 🔧 Language flag
    eventType: "CPI",                // Event type for tracking
    country: "USD",                  // Country code
    importance: 3                    // Importance level (1-3)
  }
}
```

## 📊 Event Data Mapping

### Economic Event Structure

The system automatically maps economic event data to the AI prompt:

```typescript
interface EconomicEvent {
  date: string; // "2024-01-15"
  time: string; // "14:30"
  event: string; // "Consumer Price Index (CPI)"
  country: string; // "USD"
  countryFlag: string; // "🇺🇸"
  forecast: string; // "3.2%"
  previous: string; // "3.1%"
  actual: string; // "3.4%"
  importance: number; // 1-3 (1=low, 2=medium, 3=high)
}
```

### AI Prompt Generation

The system generates structured prompts based on the event data:

```typescript
const generatePrompt = (
  eventData: EconomicEvent,
  language: "ar" | "en",
): string => {
  return `
Economic Event Analysis:
Event: ${eventData.event}
Country: ${eventData.country}
Forecast: ${eventData.forecast}
Previous: ${eventData.previous}
Actual: ${eventData.actual}
Importance: ${eventData.importance}/3

[Language-specific analysis instructions...]
`;
};
```

## 🎨 UI Components

### Button Integration

The AI analysis button is integrated into each event row:

```tsx
<AIEventInsight event={event} currentLanguage={currentLanguage} />
```

### Modal/Dialog Features

- **Modern Design**: Matches dark theme
- **Loading States**: Shows spinner during API calls
- **Error Handling**: Displays user-friendly error messages
- **Responsive**: Works on mobile and desktop
- **Accessibility**: Full keyboard navigation support

## 🔧 Customization Points

### 1. API Provider

Change the API endpoint to use different providers:

```typescript
// For Azure OpenAI
apiUrl: "https://your-resource.openai.azure.com/openai/deployments/your-deployment/chat/completions?api-version=2023-12-01-preview";

// For custom proxy
apiUrl: "https://your-proxy.com/v1/chat/completions";
```

### 2. AI Model Selection

Modify the model in `AI_API_CONFIG`:

```typescript
model: 'gpt-4',           // For better analysis
model: 'gpt-3.5-turbo',   // For faster/cheaper responses
```

### 3. Language Support Extension

Add more languages by extending the language detection and prompt generation:

```typescript
type SupportedLanguage = "ar" | "en" | "fr" | "de";

const languageInstructions = {
  ar: {
    /* Arabic instructions */
  },
  en: {
    /* English instructions */
  },
  fr: {
    /* French instructions */
  },
  de: {
    /* German instructions */
  },
};
```

## 🚀 Production Deployment

### Security Considerations

1. **API Key Security**: Never expose API keys in client-side code
2. **Rate Limiting**: Implement rate limiting to prevent abuse
3. **Error Logging**: Log API errors for monitoring
4. **Caching**: Consider caching AI responses for repeated requests

### Performance Optimization

1. **Request Debouncing**: Prevent multiple rapid API calls
2. **Response Caching**: Cache responses for identical events
3. **Lazy Loading**: Only load AI component when needed
4. **Error Retry**: Implement exponential backoff for failed requests

## 📝 Usage Examples

### Basic Usage

```tsx
import { AIEventInsight } from "@/components/ui/ai-event-insight";

<AIEventInsight
  event={{
    date: "2024-01-15",
    time: "14:30",
    event: "Consumer Price Index (CPI)",
    country: "USD",
    countryFlag: "🇺🇸",
    forecast: "3.2%",
    previous: "3.1%",
    actual: "3.4%",
    importance: 3,
  }}
  currentLanguage="ar"
/>;
```

### With Custom Language

```tsx
<AIEventInsight
  event={economicEvent}
  currentLanguage="en"
  className="custom-button-styles"
/>
```

## 🔍 Testing

### Manual Testing

1. Click AI Analysis button on any event
2. Verify loading state appears
3. Check that response is in correct language
4. Verify error handling for invalid API keys

### Error Scenarios

- Invalid API key → Shows error message with retry button
- Network timeout → Graceful fallback with retry option
- Malformed response → User-friendly error display

## 📋 Troubleshooting

### Common Issues

1. **"API Key not found"**: Check `.env` file and restart dev server
2. **CORS errors**: Verify API endpoint supports browser requests
3. **Empty responses**: Check API key permissions and usage limits
4. **Language detection fails**: Manually set `currentLanguage` prop

### Debug Mode

Enable debug logging by adding to the component:

```typescript
const DEBUG = process.env.NODE_ENV === "development";

if (DEBUG) {
  console.log("AI API Request:", { prompt, language, event });
}
```
