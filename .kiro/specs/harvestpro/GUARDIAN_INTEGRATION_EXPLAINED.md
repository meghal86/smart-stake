# HarvestPro Guardian Integration Explained

**Date:** 2025-01-26  
**Status:** ✅ No External API Needed

## Summary

**Good News:** You don't need to get a Guardian API key from anywhere! HarvestPro uses the Guardian feature you've already built into your app.

## How It Works

### Your Existing Guardian Feature

You have Guardian Edge Functions already deployed:
- `guardian-scan` - Security scanning for wallets/tokens
- `guardian-scan-v2` - Enhanced scanning with SSE support
- `wallet-registry-scan` - Wallet registry scanning

### HarvestPro Integration

HarvestPro's `guardian-adapter.ts` calls your internal Guardian Edge Function:

```typescript
// From: supabase/functions/_shared/harvestpro/guardian-adapter.ts
async function fetchGuardianScore(token: string): Promise<GuardianScore> {
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
  const GUARDIAN_API_KEY = Deno.env.get('GUARDIAN_API_KEY');
  
  // Calls YOUR Guardian Edge Function
  const response = await fetch(`${SUPABASE_URL}/functions/v1/guardian-scan`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GUARDIAN_API_KEY}`,  // Your service role key
    },
    body: JSON.stringify({
      token: token.toUpperCase(),
      scan_type: 'token',
    }),
  });
  
  // ... process response
}
```

### What "GUARDIAN_API_KEY" Really Is

The `GUARDIAN_API_KEY` environment variable is just your **Supabase Service Role Key**. It's used to authenticate calls to your own Guardian Edge Function.

**It's NOT:**
- ❌ An external API key
- ❌ A third-party service
- ❌ Something you need to get from the AlphaWhale team

**It IS:**
- ✅ Your existing Supabase Service Role Key
- ✅ Used to call your own Guardian Edge Function
- ✅ Already configured in your environment

## Configuration

### Option 1: Use Same Key (Recommended)

```bash
# In .env file
GUARDIAN_API_KEY=${SUPABASE_SERVICE_ROLE_KEY}

# In Supabase secrets
supabase secrets set GUARDIAN_API_KEY=$(supabase secrets get SUPABASE_SERVICE_ROLE_KEY)
```

### Option 2: Set Explicitly

```bash
# Get your service role key
echo $SUPABASE_SERVICE_ROLE_KEY

# Set as Guardian API key
supabase secrets set GUARDIAN_API_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Architecture Flow

```
HarvestPro Edge Function
  ↓
guardian-adapter.ts
  ↓
fetch(`${SUPABASE_URL}/functions/v1/guardian-scan`)
  ↓
YOUR Guardian Edge Function
  ↓
Returns risk score
  ↓
HarvestPro uses score for eligibility filtering
```

## What Guardian Provides to HarvestPro

HarvestPro uses Guardian scores for:

1. **Risk Classification** (Requirements 15.1-15.4)
   - LOW RISK: Guardian score >= 7
   - MEDIUM RISK: Guardian score 4-6
   - HIGH RISK: Guardian score < 4

2. **Eligibility Filtering** (Requirement 3.3)
   - Excludes lots where Guardian score < 3
   - Ensures only safe tokens are harvested

3. **Risk Warnings** (Requirement 7.4)
   - Shows Guardian warning banner for high-risk opportunities
   - Displays per-step Guardian scores during execution

## Mock Fallback

If Guardian is unavailable, HarvestPro automatically falls back to mock scores:

```typescript
function generateMockScore(token: string): GuardianScore {
  const hash = token.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const score = 3 + (hash % 8); // Score between 3-10
  
  return {
    score,
    riskLevel: score >= 7 ? 'LOW' : score >= 4 ? 'MEDIUM' : 'HIGH',
    lastUpdated: new Date().toISOString(),
    source: 'mock',
  };
}
```

This ensures HarvestPro works even if Guardian is temporarily unavailable.

## Testing Guardian Integration

### 1. Verify Guardian Edge Function Works

```bash
# Test your Guardian Edge Function directly
curl -X POST \
  https://rebeznxivaxgserswhbn.supabase.co/functions/v1/guardian-scan \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"token": "ETH", "scan_type": "token"}'
```

### 2. Test HarvestPro Integration

```bash
# Call HarvestPro opportunities endpoint
# It will internally call Guardian for risk scoring
curl http://localhost:3003/api/harvest/opportunities
```

### 3. Check Logs

```bash
# Check Guardian Edge Function logs
supabase functions logs guardian-scan

# Check HarvestPro Edge Function logs
supabase functions logs harvest-recompute-opportunities
```

## Troubleshooting

### Error: "Guardian API not configured"

**Cause:** `GUARDIAN_API_KEY` not set in Supabase secrets

**Solution:**
```bash
supabase secrets set GUARDIAN_API_KEY=$(echo $SUPABASE_SERVICE_ROLE_KEY)
```

### Error: "Guardian API error: 401"

**Cause:** Invalid service role key

**Solution:**
```bash
# Verify your service role key is correct
supabase secrets get SUPABASE_SERVICE_ROLE_KEY

# Update Guardian API key
supabase secrets set GUARDIAN_API_KEY=your_correct_service_role_key
```

### Using Mock Scores

If you see `source: 'mock'` in Guardian responses, it means:
- Guardian Edge Function is not responding
- HarvestPro is using fallback mock scores
- This is OK for development, but verify Guardian works for production

## Summary

**You don't need to do anything special for Guardian!**

Just set `GUARDIAN_API_KEY` to your existing `SUPABASE_SERVICE_ROLE_KEY`, and HarvestPro will automatically use your Guardian feature.

**Quick Setup:**
```bash
# Add to .env
GUARDIAN_API_KEY=${SUPABASE_SERVICE_ROLE_KEY}

# Set in Supabase
supabase secrets set GUARDIAN_API_KEY=$(echo $SUPABASE_SERVICE_ROLE_KEY)
```

That's it! HarvestPro will now use your existing Guardian feature for risk scoring. 🎉

---

**Related Documentation:**
- Guardian Adapter: `supabase/functions/_shared/harvestpro/guardian-adapter.ts`
- Guardian Edge Functions: `supabase/functions/guardian-scan/`
- Risk Classification: `supabase/functions/_shared/harvestpro/risk-classification.ts`
