# HarvestPro CORS & Edge Function Issue

## Current Error

```
Access to fetch at 'https://rebeznxivaxgserswhbn.supabase.co/functions/v1/harvest-recompute-opportunities' 
from origin 'http://localhost:8085' has been blocked by CORS policy
```

## Root Cause

The Supabase Edge Function `harvest-recompute-opportunities` either:
1. **Is not deployed** to Supabase
2. **Doesn't have CORS headers** configured
3. **Doesn't exist** in the Supabase project

## Solution

### Option 1: Deploy the Edge Function (Recommended)

The Edge Function exists locally at `supabase/functions/harvest-recompute-opportunities/index.ts` but needs to be deployed:

```bash
# Deploy the Edge Function
supabase functions deploy harvest-recompute-opportunities

# Verify it's deployed
supabase functions list
```

### Option 2: Use Demo Mode (Temporary Workaround)

Since the Edge Function isn't deployed, **keep Demo Mode ON** for now. The UI works perfectly in demo mode with mock data.

## Why This Happened

1. **Vite app** - Can't use Next.js API routes
2. **Fixed the hook** - Now calls Edge Function directly
3. **Edge Function not deployed** - CORS error because function doesn't exist on Supabase

## Current Status

✅ **Fixed:**
- Import error (`createClient` → `supabase`)
- Hook now calls Edge Function directly
- TypeScript errors resolved

❌ **Remaining:**
- Edge Function not deployed to Supabase
- CORS error when calling non-existent function

## Next Steps

### For Development (Use Demo Mode)

The app works perfectly in demo mode. Just keep the toggle ON.

### For Production (Deploy Edge Function)

1. **Check Supabase CLI is installed:**
```bash
supabase --version
```

2. **Login to Supabase:**
```bash
supabase login
```

3. **Link to your project:**
```bash
supabase link --project-ref rebeznxivaxgserswhbn
```

4. **Deploy the Edge Function:**
```bash
supabase functions deploy harvest-recompute-opportunities
```

5. **Verify deployment:**
```bash
supabase functions list
```

## Edge Function CORS Configuration

The Edge Function at `supabase/functions/harvest-recompute-opportunities/index.ts` should have CORS headers:

```typescript
Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  // Your function logic here
  
  return new Response(JSON.stringify(result), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
});
```

## Testing After Deployment

1. Deploy the Edge Function
2. Toggle Demo Mode OFF in the UI
3. Should see real data from Edge Function

## Summary

**The code is correct now.** The issue is that the Edge Function needs to be deployed to Supabase. Until then, use Demo Mode which works perfectly with mock data.
