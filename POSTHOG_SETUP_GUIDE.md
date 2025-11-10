# PostHog Setup Guide

This guide will help you set up PostHog analytics for the Hunter Screen.

## What is PostHog?

PostHog is an open-source product analytics platform that helps you track user behavior, run A/B tests, and analyze product usage. It's privacy-focused and can be self-hosted or used as a cloud service.

## Getting Your PostHog API Key

### Option 1: PostHog Cloud (Recommended for Quick Start)

1. **Sign Up for PostHog Cloud**
   - Go to https://app.posthog.com/signup
   - Sign up with your email or GitHub account
   - It's free for up to 1 million events per month

2. **Create a New Project**
   - After signing up, you'll be prompted to create a project
   - Give it a name (e.g., "AlphaWhale Hunter Screen")
   - Select your data region (US or EU)

3. **Get Your Project API Key**
   - After creating the project, you'll see a setup screen
   - Look for "Project API Key" - it will look like: `phc_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - Copy this key

4. **Get Your API Host**
   - For PostHog Cloud US: `https://us.posthog.com`
   - For PostHog Cloud EU: `https://eu.posthog.com`
   - Or use the default: `https://app.posthog.com`

### Option 2: Self-Hosted PostHog

If you prefer to self-host PostHog:

1. **Deploy PostHog**
   - Follow the deployment guide: https://posthog.com/docs/self-host
   - Options include: Docker, Kubernetes, AWS, GCP, etc.

2. **Get Your API Key**
   - After deployment, log into your PostHog instance
   - Go to Project Settings → Project API Key
   - Copy the key

3. **Note Your Host URL**
   - This will be your self-hosted URL (e.g., `https://posthog.yourdomain.com`)

## Adding Keys to Your Project

### 1. Add to `.env` file

Add these lines to your `.env` file:

```bash
# PostHog Analytics
NEXT_PUBLIC_POSTHOG_KEY=phc_your_actual_key_here
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```

**Important Notes:**
- Replace `phc_your_actual_key_here` with your actual PostHog Project API Key
- The `NEXT_PUBLIC_` prefix makes these variables available in the browser
- For PostHog Cloud US, use: `https://us.posthog.com`
- For PostHog Cloud EU, use: `https://eu.posthog.com`
- For self-hosted, use your custom URL

### 2. Add to `.env.example` (for team reference)

Update your `.env.example` file:

```bash
# PostHog Analytics
NEXT_PUBLIC_POSTHOG_KEY=phc_your_key_here
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```

### 3. Add to Vercel/Production Environment

If deploying to Vercel:

1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add both variables:
   - `NEXT_PUBLIC_POSTHOG_KEY` = your key
   - `NEXT_PUBLIC_POSTHOG_HOST` = your host URL
4. Select which environments (Production, Preview, Development)
5. Save and redeploy

## Initialize Analytics in Your App

The analytics system is already implemented. You just need to initialize it:

### For Next.js App Router

Add to `src/app/layout.tsx`:

```typescript
import { analytics } from '@/lib/analytics';
import { useEffect } from 'react';

export default function RootLayout({ children }) {
  useEffect(() => {
    // Initialize analytics on client side
    analytics.initialize({
      enabled: true,
      apiKey: process.env.NEXT_PUBLIC_POSTHOG_KEY,
      apiHost: process.env.NEXT_PUBLIC_POSTHOG_HOST,
      debug: process.env.NODE_ENV === 'development',
      respectDNT: true,
    });
  }, []);

  return (
    <html>
      <body>{children}</body>
    </html>
  );
}
```

### For React/Vite

Add to `src/App.tsx` or `src/main.tsx`:

```typescript
import { analytics } from '@/lib/analytics';

// Initialize on app load
analytics.initialize({
  enabled: true,
  apiKey: import.meta.env.VITE_POSTHOG_KEY,
  apiHost: import.meta.env.VITE_POSTHOG_HOST,
  debug: import.meta.env.DEV,
  respectDNT: true,
});
```

## Verify Setup

### 1. Check Browser Console

With `debug: true`, you should see:
```
PostHog loaded successfully
Analytics client initialized
```

### 2. Check PostHog Dashboard

1. Go to your PostHog dashboard
2. Navigate to "Activity" or "Events"
3. You should see events coming in within a few seconds

### 3. Test Events

Open your browser console and run:

```javascript
// This should trigger a test event
window.posthog?.capture('test_event', { test: true });
```

Check your PostHog dashboard to see if the event appears.

## PostHog Dashboard Setup

### 1. Create Dashboards

In PostHog, create dashboards for:

- **Hunter Screen Overview**
  - Total feed views
  - Unique users
  - Card click rate
  - Save rate

- **Conversion Funnels**
  - Feed view → Card click → Save
  - Feed view → Card click → CTA click

- **Trust Analysis**
  - Click rate by trust level
  - Save rate by trust level
  - Conversion by trust level

### 2. Set Up Insights

Create insights for:

- **Card Performance**
  - Filter by `opportunity_type`
  - Group by `trust_level`
  - Track `card_click` and `save` events

- **Filter Usage**
  - Track `filter_change` events
  - See which filters are most used

- **Scroll Depth**
  - Track `scroll_depth` events
  - See how far users scroll

### 3. Create Cohorts

Define user cohorts:

- **Active Hunters**: Users who view feed regularly
- **High Savers**: Users who save many opportunities
- **Filter Power Users**: Users who use multiple filters

## Privacy & Compliance

The analytics implementation is privacy-focused:

✅ **Wallet addresses are hashed** with per-session salt  
✅ **DNT (Do Not Track) is respected**  
✅ **Cookie consent is required** before tracking  
✅ **No plain wallet addresses** are ever logged  
✅ **Sampling** reduces data collection (0.1% for impressions)

### GDPR Compliance

PostHog is GDPR compliant. Additional steps:

1. **Add Cookie Consent Banner**
   - Use the consent management system in `src/lib/analytics/consent.ts`
   - Show banner before tracking

2. **Privacy Policy**
   - Update your privacy policy to mention PostHog
   - Explain what data is collected

3. **Data Retention**
   - Configure in PostHog Settings → Data Management
   - Set appropriate retention periods

## Troubleshooting

### Events Not Showing Up

1. **Check API Key**
   ```bash
   echo $NEXT_PUBLIC_POSTHOG_KEY
   ```

2. **Check Console for Errors**
   - Open browser DevTools
   - Look for PostHog errors

3. **Verify Consent**
   ```javascript
   // In browser console
   localStorage.getItem('alphawhale_consent')
   ```

4. **Check DNT**
   ```javascript
   // In browser console
   navigator.doNotTrack
   ```

### Analytics Not Initializing

1. **Check Environment Variables**
   - Ensure `NEXT_PUBLIC_POSTHOG_KEY` is set
   - Restart dev server after adding env vars

2. **Check Initialization**
   ```javascript
   // In browser console
   window.posthog
   ```

3. **Enable Debug Mode**
   ```typescript
   analytics.initialize({
     enabled: true,
     apiKey: process.env.NEXT_PUBLIC_POSTHOG_KEY,
     debug: true, // Enable debug logging
   });
   ```

## Cost Considerations

### PostHog Cloud Pricing (as of 2024)

- **Free Tier**: 1M events/month
- **Paid Plans**: Pay-as-you-go after free tier
- **Estimated Cost**: With 0.1% sampling on impressions, costs should be minimal

### Reducing Costs

1. **Sampling**: Already implemented (0.1% for impressions)
2. **Event Filtering**: Only track meaningful events
3. **Session Replay**: Disabled by default (can be expensive)
4. **Data Retention**: Set shorter retention periods

## Alternative Analytics Providers

If you prefer a different provider, the analytics system is designed to be provider-agnostic. You can swap PostHog for:

- **Mixpanel**: Similar API, good for product analytics
- **Amplitude**: Enterprise-focused, powerful analysis
- **Plausible**: Privacy-first, simpler analytics
- **Umami**: Open-source, self-hosted alternative

To switch providers, modify `src/lib/analytics/client.ts` to use their SDK.

## Next Steps

1. ✅ Sign up for PostHog
2. ✅ Get your API key
3. ✅ Add to `.env` file
4. ✅ Initialize analytics in your app
5. ✅ Test events in PostHog dashboard
6. ✅ Create dashboards and insights
7. ✅ Add cookie consent banner
8. ✅ Update privacy policy

## Resources

- **PostHog Docs**: https://posthog.com/docs
- **PostHog Pricing**: https://posthog.com/pricing
- **PostHog GitHub**: https://github.com/PostHog/posthog
- **Analytics Implementation**: `src/lib/analytics/README.md`

## Support

If you need help:

1. Check PostHog docs: https://posthog.com/docs
2. PostHog community: https://posthog.com/questions
3. Review implementation: `src/lib/analytics/README.md`
4. Check tests: `src/__tests__/lib/analytics/`

---

**Ready to track!** Once you add your PostHog key, the analytics system will automatically start tracking user behavior on the Hunter Screen.
