# API Configuration Setup

## OpenAI API Configuration

To enable AI analysis and translation features, you need to configure a valid OpenAI API key:

### 1. Get OpenAI API Key

- Visit [OpenAI Platform](https://platform.openai.com/account/api-keys)
- Create a new API key
- Copy the key (starts with `sk-`)

### 2. Set Environment Variable

Using the DevServerControl tool:

```
OPENAI_API_KEY=your-actual-openai-api-key-here
```

Or add to `.env` file:

```
OPENAI_API_KEY=sk-your-real-openai-api-key-here
```

### 3. Restart Development Server

After setting the API key, restart the development server to apply changes.

## Features Enabled with Valid API Key

- ✅ AI Analysis for economic events
- ✅ Auto-translation of news titles to Arabic
- ✅ Real-time market insights

## Current Status

⚠️ **Demo Mode**: Invalid or missing API key detected. AI features will show configuration messages until a valid key is provided.

## Troubleshooting

- Ensure API key starts with `sk-`
- Check OpenAI account has sufficient credits
- Verify environment variable is properly set
- Restart development server after changes
