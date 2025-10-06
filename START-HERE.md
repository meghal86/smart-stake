# 🚀 START HERE - Get Live Data Working

## Current Status
✅ API endpoints created  
✅ Frontend components ready  
❌ Dev server not running  
❌ Environment variables not set  

## 3-Step Quick Start

### Step 1: Set Environment Variables (2 minutes)

```bash
# Copy example file
cp .env.example .env.local

# Edit .env.local and add these REQUIRED variables:
# NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
# SUPABASE_SERVICE_ROLE_KEY=eyJ...
# WHALE_ALERT_API_KEY=your_whale_alert_key
```

**Get API Keys:**
- Supabase: https://app.supabase.com/project/_/settings/api
- Whale Alert: https://whale-alert.io/signup (free tier available)

### Step 2: Verify Environment (30 seconds)

```bash
./check-env.sh
```

Expected output:
```
✅ All 4 required variables are set
```

### Step 3: Start Dev Server (1 minute)

```bash
npm run dev
```

Expected output:
```
▲ Next.js 14.x.x
- Local:        http://localhost:3000
- Ready in 2.5s
```

---

## Verify It's Working

### Option A: Browser (Visual)

1. Open http://localhost:3000
2. Open DevTools → Network tab
3. Look for these requests:
   - `/api/lite/digest` → Should return whale transactions
   - `/api/lite/whale-index` → Should return activity score
   - `/api/lite/streak` → Should return streak data
   - `/api/lite/unlocks` → Should return token unlocks

### Option B: Command Line (Technical)

```bash
# Run health check
./health-check.sh http://localhost:3000
```

Expected output:
```
✅ ALL CHECKS PASSED - System is A++ Grade
   All endpoints returning live data
```

### Option C: Manual Test

```bash
# Test digest endpoint
curl http://localhost:3000/api/lite/digest | jq .

# Expected response:
{
  "items": [
    {
      "id": "...",
      "event_time": "2024-01-15T10:30:00Z",
      "asset": "ETH",
      "summary": "1250.50 ETH → Binance",
      "severity": 4
    }
  ],
  "plan": "LITE",
  "timestamp": "2024-01-15T10:30:45Z",
  "source": "whale-alert-live"
}
```

---

## Troubleshooting

### Issue: "WHALE_ALERT_API_KEY not configured"

**Fix:**
```bash
# Add to .env.local
echo "WHALE_ALERT_API_KEY=your_key_here" >> .env.local

# Restart dev server
npm run dev
```

### Issue: "No process on port 3000"

**Fix:**
```bash
# Start dev server
npm run dev
```

### Issue: Network tab shows no requests

**Possible causes:**
1. Dev server not running → Run `npm run dev`
2. Wrong URL → Make sure you're on http://localhost:3000
3. Component not mounted → Check browser console for errors

### Issue: "Whale Alert API failed"

**This is EXPECTED if:**
- API key is invalid
- No whale transactions in last 24h
- Whale Alert API is down

**Check:**
```bash
# Verify API key works
curl "https://api.whale-alert.io/v1/transactions?api_key=YOUR_KEY&limit=1"
```

---

## What Should Happen

### In Browser Network Tab:

```
Request: GET /api/lite/digest
Status: 200 OK
Response: { "items": [...], "source": "whale-alert-live" }

Request: GET /api/lite/whale-index  
Status: 200 OK
Response: { "score": 78, "source": "market-summary-live" }

Request: GET /api/lite/streak
Status: 200 OK
Response: { "streak_count": 0, "authenticated": false }

Request: GET /api/lite/unlocks
Status: 200 OK
Response: { "items": [...], "source": "supabase-live" }
```

### In Browser Console:

```
No errors (or only expected warnings)
```

### On Dashboard:

- 🐋 Daily Whale Digest → Shows recent whale transactions
- 📊 Whale Index → Shows current activity score
- 🔥 Daily Streak → Shows your streak (0 if not logged in)
- 🔒 Token Unlocks → Shows upcoming unlocks

---

## If Nothing Works

### Nuclear Option (Reset Everything)

```bash
# 1. Stop dev server (Ctrl+C)

# 2. Clear Next.js cache
rm -rf .next

# 3. Reinstall dependencies
rm -rf node_modules
npm install

# 4. Verify environment
./check-env.sh

# 5. Start fresh
npm run dev

# 6. Test
./health-check.sh http://localhost:3000
```

---

## Next Steps After It Works

1. **Deploy Supabase Edge Functions:**
   ```bash
   supabase functions deploy whale-alerts
   supabase functions deploy market-summary-enhanced
   ```

2. **Deploy to Vercel:**
   ```bash
   vercel --prod
   ```

3. **Set up monitoring:**
   - UptimeRobot for uptime
   - Sentry for errors

---

## Quick Reference

| Command | Purpose |
|---------|---------|
| `./check-env.sh` | Verify environment variables |
| `npm run dev` | Start dev server |
| `./health-check.sh http://localhost:3000` | Test all endpoints |
| `curl http://localhost:3000/api/lite/digest \| jq .` | Test single endpoint |

---

## Files You Need to Edit

1. **`.env.local`** - Add your API keys (REQUIRED)
2. Nothing else! All code is ready.

---

## Support

**If you see network requests but they fail:**
- Check `./check-env.sh` output
- Review error messages in browser console
- Check terminal where `npm run dev` is running

**If you don't see any network requests:**
- Verify dev server is running (`npm run dev`)
- Check you're on http://localhost:3000
- Open browser DevTools → Network tab
- Refresh the page

**Still stuck?**
- Check `docs/PRODUCTION-DEPLOYMENT.md` for detailed troubleshooting
- Run `./health-check.sh` for diagnostics
