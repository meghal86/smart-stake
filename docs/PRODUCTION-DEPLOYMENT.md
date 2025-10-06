# Production Deployment Guide - A++ Grade System

## Philosophy: Fail Fast, Fail Loud, No Silent Failures

This system is built with ZERO tolerance for:
- ❌ Mock data
- ❌ Fallback data
- ❌ Silent failures
- ❌ Cached stale data masking API failures

Every endpoint returns LIVE data or fails with clear error messages.

---

## Pre-Deployment Checklist

### 1. Environment Variables (CRITICAL)

```bash
# Verify ALL required variables are set
cat > check-env.sh << 'EOF'
#!/bin/bash
REQUIRED_VARS=(
  "NEXT_PUBLIC_SUPABASE_URL"
  "NEXT_PUBLIC_SUPABASE_ANON_KEY"
  "SUPABASE_SERVICE_ROLE_KEY"
  "WHALE_ALERT_API_KEY"
)

MISSING=()
for var in "${REQUIRED_VARS[@]}"; do
  if [ -z "${!var}" ]; then
    MISSING+=("$var")
  fi
done

if [ ${#MISSING[@]} -gt 0 ]; then
  echo "❌ MISSING REQUIRED VARIABLES:"
  printf '  - %s\n' "${MISSING[@]}"
  exit 1
fi

echo "✅ All required environment variables are set"
EOF

chmod +x check-env.sh
./check-env.sh
```

### 2. Supabase Edge Functions Deployment

```bash
# Deploy whale-alerts function
supabase functions deploy whale-alerts --no-verify-jwt

# Deploy market-summary-enhanced function
supabase functions deploy market-summary-enhanced --no-verify-jwt

# Set secrets
supabase secrets set WHALE_ALERT_API_KEY=your_key_here
supabase secrets set CMC_API_KEY=your_key_here
supabase secrets set ETHERSCAN_API_KEY=your_key_here
```

### 3. Database Tables Verification

```sql
-- Run in Supabase SQL Editor
-- Verify all required tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'user_profiles',
  'token_unlocks',
  'whale_transactions',
  'price_cache',
  'provider_usage'
);

-- Should return 5 rows
-- If any missing, run migrations from supabase/migrations/
```

---

## API Endpoints - Production Behavior

### 1. `/api/lite/digest`

**Purpose:** Real-time whale transaction feed  
**Data Source:** Whale Alert API → Supabase Edge Function  
**Caching:** NONE  
**Failure Mode:** Returns 503 with error message

**Success Response:**
```json
{
  "items": [
    {
      "id": "tx-123",
      "event_time": "2024-01-15T10:30:00Z",
      "asset": "ETH",
      "summary": "1250.50 ETH → Binance",
      "severity": 4,
      "amount_usd": 5200000
    }
  ],
  "plan": "LITE",
  "timestamp": "2024-01-15T10:30:45Z",
  "source": "whale-alert-live"
}
```

**Failure Response:**
```json
{
  "error": "Whale Alert API failed: Connection timeout",
  "timestamp": "2024-01-15T10:30:45Z",
  "endpoint": "/api/lite/digest"
}
```

**Test Command:**
```bash
curl -v http://localhost:3000/api/lite/digest | jq .
```

---

### 2. `/api/lite/whale-index`

**Purpose:** Current whale activity index  
**Data Source:** Market Summary Edge Function  
**Caching:** NONE  
**Failure Mode:** Returns 503 with error message

**Success Response:**
```json
{
  "date": "2024-01-15T10:30:45Z",
  "score": 78,
  "label": "Hot",
  "whale_count": 892,
  "timestamp": "2024-01-15T10:30:45Z",
  "source": "market-summary-live"
}
```

**Test Command:**
```bash
curl -v http://localhost:3000/api/lite/whale-index | jq .
```

---

### 3. `/api/lite/streak`

**Purpose:** User daily streak  
**Data Source:** Supabase user_profiles table  
**Caching:** NONE  
**Failure Mode:** Returns 503 with error message

**Success Response (Authenticated):**
```json
{
  "streak_count": 7,
  "last_seen_date": "2024-01-15",
  "authenticated": true,
  "timestamp": "2024-01-15T10:30:45Z",
  "source": "supabase-live"
}
```

**Success Response (Unauthenticated):**
```json
{
  "streak_count": 0,
  "last_seen_date": null,
  "authenticated": false,
  "timestamp": "2024-01-15T10:30:45Z"
}
```

**Test Command:**
```bash
curl -v http://localhost:3000/api/lite/streak | jq .
```

---

### 4. `/api/lite/unlocks`

**Purpose:** Upcoming token unlock events  
**Data Source:** Supabase token_unlocks table  
**Caching:** NONE  
**Failure Mode:** Returns 503 with error message

**Success Response:**
```json
{
  "items": [
    {
      "token": "ARB",
      "unlock_time": "2024-01-20T00:00:00Z",
      "amount_usd": 45000000,
      "chain": "ethereum",
      "project_name": "Arbitrum"
    }
  ],
  "plan": "LITE",
  "next": { /* first unlock */ },
  "timestamp": "2024-01-15T10:30:45Z",
  "source": "supabase-live"
}
```

**Test Command:**
```bash
curl -v http://localhost:3000/api/lite/unlocks | jq .
```

---

## Monitoring & Alerting

### Health Check Script

```bash
#!/bin/bash
# save as: health-check.sh

ENDPOINTS=(
  "/api/lite/digest"
  "/api/lite/whale-index"
  "/api/lite/streak"
  "/api/lite/unlocks"
)

BASE_URL="${1:-http://localhost:3000}"
FAILED=()

for endpoint in "${ENDPOINTS[@]}"; do
  echo "Testing $endpoint..."
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$endpoint")
  
  if [ "$STATUS" -eq 200 ]; then
    echo "  ✅ $endpoint - OK"
  else
    echo "  ❌ $endpoint - FAILED (HTTP $STATUS)"
    FAILED+=("$endpoint")
  fi
done

if [ ${#FAILED[@]} -gt 0 ]; then
  echo ""
  echo "❌ FAILED ENDPOINTS:"
  printf '  - %s\n' "${FAILED[@]}"
  exit 1
fi

echo ""
echo "✅ All endpoints healthy"
```

**Usage:**
```bash
chmod +x health-check.sh
./health-check.sh http://localhost:3000
./health-check.sh https://your-production-domain.com
```

---

## Error Handling Strategy

### Frontend Error Display

Update components to show errors prominently:

```typescript
// Example: src/components/hub/DigestCard.tsx
useEffect(() => {
  fetch('/api/lite/digest')
    .then(r => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    })
    .then(d => {
      if (d.error) {
        // SHOW ERROR TO USER - DO NOT HIDE
        setError(d.error);
        setItems([]);
      } else {
        setItems(d.items || []);
        setError(null);
      }
    })
    .catch(err => {
      // SHOW ERROR TO USER - DO NOT HIDE
      setError(`Failed to load whale data: ${err.message}`);
      setItems([]);
    });
}, []);

// In render:
{error && (
  <div className="bg-red-500/10 border border-red-500 rounded p-4">
    <p className="text-red-500 font-semibold">⚠️ Live Data Error</p>
    <p className="text-sm text-red-400">{error}</p>
    <button onClick={() => window.location.reload()}>
      Retry
    </button>
  </div>
)}
```

---

## Deployment Steps

### Step 1: Local Testing

```bash
# 1. Set environment variables
cp .env.example .env.local
# Edit .env.local with real API keys

# 2. Start dev server
npm run dev

# 3. Run health check
./health-check.sh http://localhost:3000

# 4. Manual testing
open http://localhost:3000
```

### Step 2: Staging Deployment

```bash
# 1. Deploy to Vercel staging
vercel --env-file=.env.staging

# 2. Set environment variables in Vercel dashboard
vercel env add WHALE_ALERT_API_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
# ... add all required vars

# 3. Deploy Supabase functions to staging
supabase link --project-ref your-staging-ref
supabase functions deploy whale-alerts
supabase functions deploy market-summary-enhanced

# 4. Run health check against staging
./health-check.sh https://your-staging-url.vercel.app
```

### Step 3: Production Deployment

```bash
# 1. Deploy to Vercel production
vercel --prod

# 2. Verify environment variables
vercel env ls

# 3. Deploy Supabase functions to production
supabase link --project-ref your-prod-ref
supabase functions deploy whale-alerts
supabase functions deploy market-summary-enhanced

# 4. Run health check against production
./health-check.sh https://your-production-domain.com

# 5. Monitor logs
vercel logs --follow
```

---

## Troubleshooting

### Issue: "WHALE_ALERT_API_KEY not configured"

**Solution:**
```bash
# Verify env var is set
echo $WHALE_ALERT_API_KEY

# If missing, add to .env.local
echo "WHALE_ALERT_API_KEY=your_key" >> .env.local

# Restart dev server
npm run dev
```

### Issue: "Whale Alert API failed: Connection timeout"

**Solution:**
1. Check Whale Alert API status: https://status.whale-alert.io
2. Verify API key is valid
3. Check rate limits
4. Review Supabase Edge Function logs

### Issue: "Database query failed: relation does not exist"

**Solution:**
```bash
# Run migrations
supabase db reset

# Or manually create missing tables
# See: supabase/migrations/
```

### Issue: "No whale transactions in last 24h"

**This is EXPECTED behavior** - Whale Alert may have no transactions >$500k in quiet periods.

**Options:**
1. Lower min_value threshold in whale-alerts Edge Function
2. Wait for market activity
3. Check Whale Alert dashboard for recent activity

---

## Performance Targets

| Metric | Target | Monitoring |
|--------|--------|------------|
| API Response Time | <500ms | Vercel Analytics |
| Error Rate | <1% | Vercel Logs |
| Uptime | >99.9% | UptimeRobot |
| Whale Alert Latency | <2s | Edge Function Logs |
| Database Query Time | <100ms | Supabase Dashboard |

---

## Success Criteria

✅ All 4 API endpoints return 200 status  
✅ No mock data in responses  
✅ Errors display clearly to users  
✅ Health check script passes  
✅ Frontend components load live data  
✅ No console errors in browser  
✅ Supabase Edge Functions deployed  
✅ All environment variables set  

---

## Support & Escalation

**If deployment fails:**
1. Check health-check.sh output
2. Review Vercel deployment logs
3. Check Supabase Edge Function logs
4. Verify all environment variables
5. Test each API endpoint individually with curl

**Critical Issues:**
- Whale Alert API down → Check status page
- Supabase down → Check Supabase status
- Database migration failed → Review migration logs
- Environment variables missing → Re-deploy with correct vars

---

## Next Steps After Deployment

1. **Set up monitoring:**
   - UptimeRobot for endpoint monitoring
   - Sentry for error tracking
   - Vercel Analytics for performance

2. **Add alerting:**
   - Email alerts for >5% error rate
   - Slack notifications for downtime
   - PagerDuty for critical failures

3. **Performance optimization:**
   - Add CDN caching at edge (Vercel)
   - Optimize database queries
   - Consider read replicas for scaling

4. **Documentation:**
   - API documentation for team
   - Runbook for on-call engineers
   - Incident response procedures
