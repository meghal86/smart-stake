# 🐋 Whale Alert API Setup

## Get API Key

1. Visit https://whale-alert.io/
2. Sign up for an account
3. Get your API key from the dashboard

## Set API Key in Supabase

```bash
npx supabase secrets set WHALE_ALERT_API_KEY="your_api_key_here"
```

## Redeploy Function

```bash
npx supabase functions deploy whale-alerts
```

## Verify Setup

The app will now show real whale transactions instead of mock data.