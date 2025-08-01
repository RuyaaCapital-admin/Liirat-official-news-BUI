# Liirat Trading Platform - Vercel Deployment Guide

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **OpenAI API Key**: Get your API key from [OpenAI Platform](https://platform.openai.com/api-keys)
3. **GitHub Repository**: Your code should be in a GitHub repository

## Deployment Steps

### 1. Connect Repository to Vercel

1. Log in to your Vercel dashboard
2. Click "New Project"
3. Import your GitHub repository
4. Select the repository containing this code

### 2. Configure Build Settings

Vercel should automatically detect the configuration from `vercel.json`, but verify:

- **Framework Preset**: Vite
- **Build Command**: `npm run build:client`
- **Output Directory**: `dist/spa`
- **Install Command**: `npm install`

### 3. Set Environment Variables

In your Vercel project settings, add the following environment variables:

#### Required Variables:
```
OPENAI_API_KEY=sk-your-actual-openai-api-key-here
NODE_ENV=production
```

#### How to add environment variables:
1. Go to your project dashboard on Vercel
2. Click "Settings" tab
3. Click "Environment Variables" in the sidebar
4. Add each variable:
   - **Name**: `OPENAI_API_KEY`
   - **Value**: Your actual OpenAI API key (starts with `sk-`)
   - **Environment**: Production, Preview, Development (select all)

### 4. Deploy

1. Click "Deploy" button
2. Wait for the build to complete
3. Your site will be available at `https://your-project-name.vercel.app`

## API Endpoints

The following API endpoints will be available after deployment:

- `/api/ai-chat` - OpenAI chat integration
- `/api/market-data` - Market data (mock data with real-time variations)
- `/api/news` - Financial news (mock data)
- `/api/ping` - Health check

## Troubleshooting

### Build Failures

1. **"vite: not found"**: Make sure `npm install` runs successfully
2. **HTML structure errors**: Check for mismatched tags in React components
3. **TypeScript errors**: Ensure all types are properly defined

### Runtime Errors

1. **OpenAI API errors**:
   - Verify your API key is correctly set in environment variables
   - Check your OpenAI account has sufficient credits
   - Ensure the API key has the correct permissions

2. **CORS errors**:
   - API endpoints include CORS headers
   - Check browser console for specific error messages

### Environment Variables Not Working

1. Make sure environment variables are set for the correct environment (Production/Preview)
2. Redeploy after adding new environment variables
3. Check the "Functions" tab in Vercel dashboard for API logs

## Monitoring

- **Function Logs**: Check the "Functions" tab in your Vercel dashboard
- **Analytics**: Enable Vercel Analytics for usage insights
- **Error Tracking**: Monitor the "Functions" logs for API errors

## Security Notes

1. **Never commit API keys** to your repository
2. **Use environment variables** for all sensitive configuration
3. **Monitor API usage** to prevent unexpected charges
4. **Set usage limits** in your OpenAI account

## Cost Optimization

1. **OpenAI Usage**: The app uses `gpt-3.5-turbo` for cost efficiency
2. **Token Limits**: Messages are limited to 800 tokens
3. **Context Management**: Only recent conversation history is sent to reduce token usage

## Support

If you encounter issues:

1. Check Vercel deployment logs
2. Verify environment variables are set correctly
3. Test API endpoints individually using the browser network tab
4. Check OpenAI API status at [status.openai.com](https://status.openai.com)

## Production Checklist

- [ ] OpenAI API key is set in Vercel environment variables
- [ ] Build completes successfully
- [ ] All pages load without errors
- [ ] AI chat functionality works
- [ ] Theme toggle works properly
- [ ] TradingView widgets display correctly
- [ ] Mobile responsiveness is maintained