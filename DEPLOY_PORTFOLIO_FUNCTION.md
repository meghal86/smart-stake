# Deploy Portfolio Tracker Edge Function

The portfolio monitor requires the `portfolio-tracker` Edge Function to be deployed to Supabase.

## Quick Deploy

```bash
# Install Supabase CLI (if not installed)
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Deploy the portfolio-tracker function
supabase functions deploy portfolio-tracker
```

## Alternative: Manual Deploy via Supabase Dashboard

1. Go to your Supabase Dashboard
2. Navigate to Edge Functions
3. Create new function named `portfolio-tracker`
4. Copy the code from `supabase/functions/portfolio-tracker/index.ts`
5. Deploy the function

## Function Status

The portfolio monitor will show an error message until this function is deployed:
- ❌ "Portfolio tracking service is not deployed"
- ✅ Working portfolio data once deployed

## Function Purpose

The `portfolio-tracker` function provides:
- Real-time portfolio value tracking
- Token balance monitoring  
- Risk score calculation
- Whale interaction detection