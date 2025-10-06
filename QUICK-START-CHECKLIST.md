# ✅ Quick Start Checklist - Get Live Data in 5 Minutes

## Why You Don't See Network Requests

**The dev server is not running!** That's why you don't see any network activity.

---

## 5-Minute Setup

### ☐ Step 1: Set Environment Variables (2 min)

```bash
# Create .env.local file
cat > .env.local << 'EOF'
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
WHALE_ALERT_API_KEY=your_whale_alert_key_here
EOF
```

**Get your keys:**
- Supabase: https://app.supabase.com/project/_/settings/api
- Whale Alert: https://whale-alert.io/signup

### ☐ Step 2: Verify Environment (10 sec)

```bash
./check-env.sh
```

**Expected:**
```
✅ All 4 required variables are set
```

### ☐ Step 3: Start Dev Server (30 sec)

```bash
npm run dev
```

**Expected:**
```
▲ Next.js 14.x.x
- Local:        http://localhost:3000
- Ready in 2.5s
```

### ☐ Step 4: Open Browser & Check Network Tab (1 min)

1. Open http://localhost:3000/lite
2. Open DevTools (F12 or Cmd+Option+I)
3. Go to Network tab
4. Refresh page (Cmd+R or Ctrl+R)

**You should see:**
```
✅ GET /api/lite/digest → 200 OK
✅ GET /api/lite/whale-index → 200 OK  
✅ GET /api/lite/streak → 200 OK
✅ GET /api/lite/unlocks → 200 OK
```

### ☐ Step 5: Verify Live Data (30 sec)

```bash
./health-check.sh http://localhost:3000
```

**Expected:**
```
✅ ALL CHECKS PASSED - System is A++ Grade
   All endpoints returning live data
```

---

## What You'll See

### In Browser (http://localhost:3000/lite):

- **KPI Cards** → Whale Pressure, Market Sentiment, Risk Index
- **Daily Whale Digest** → Recent whale transactions (live from Whale Alert)
- **Top Signals** → Market signals
- **Portfolio Demo** → Sample portfolio
- **Upgrade Teaser** → Pro features

### In Network Tab:

```
Name                    Status  Type    Size    Time
/api/lite/digest        200     xhr     2.3 KB  245ms
/api/lite/whale-index   200     xhr     156 B   89ms
/api/lite/streak        200     xhr     98 B    45ms
/api/lite/unlocks       200     xhr     1.1 KB  123ms
```

### In Terminal (where npm run dev is running):

```
GET /api/lite/digest 200 in 245ms
GET /api/lite/whale-index 200 in 89ms
GET /api/lite/streak 200 in 45ms
GET /api/lite/unlocks 200 in 123ms
```

---

## Troubleshooting

### ❌ "No process on port 3000"

**Solution:** Start the dev server
```bash
npm run dev
```

### ❌ "WHALE_ALERT_API_KEY not configured"

**Solution:** Add to .env.local
```bash
echo "WHALE_ALERT_API_KEY=your_key" >> .env.local
npm run dev
```

### ❌ Network tab shows 404 errors

**Solution:** Make sure you're on the right page
```
✅ http://localhost:3000/lite
❌ http://localhost:3000
```

### ❌ "Whale Alert API failed"

**This is EXPECTED if:**
- No whale transactions in last 24h (market is quiet)
- API key is invalid
- Whale Alert API is down

**Test your API key:**
```bash
curl "https://api.whale-alert.io/v1/transactions?api_key=YOUR_KEY&limit=1"
```

---

## Files Created (All Ready)

✅ `src/app/api/lite/digest/route.ts` - Whale transactions endpoint  
✅ `src/app/api/lite/whale-index/route.ts` - Activity score endpoint  
✅ `src/app/api/lite/streak/route.ts` - User streak endpoint  
✅ `src/app/api/lite/unlocks/route.ts` - Token unlocks endpoint  
✅ `health-check.sh` - Test all endpoints  
✅ `check-env.sh` - Verify environment  
✅ `src/app/lite/page.tsx` - Lite dashboard page (already exists)  
✅ `src/components/hub/DigestCard.tsx` - Already calls `/api/lite/digest`  

---

## Current Status

| Component | Status |
|-----------|--------|
| API Endpoints | ✅ Created |
| Frontend Components | ✅ Ready |
| Page Route | ✅ Exists at /lite |
| Environment Variables | ❓ Need to set |
| Dev Server | ❓ Need to start |
| Network Requests | ❓ Will work after above |

---

## Next Commands (Copy & Paste)

```bash
# 1. Check environment
./check-env.sh

# 2. If missing variables, edit .env.local
nano .env.local

# 3. Start dev server
npm run dev

# 4. In another terminal, test endpoints
./health-check.sh http://localhost:3000

# 5. Open browser
open http://localhost:3000/lite
```

---

## Success Criteria

✅ Dev server running on port 3000  
✅ Environment variables set  
✅ Browser shows http://localhost:3000/lite  
✅ Network tab shows 4 API requests  
✅ All requests return 200 status  
✅ Dashboard shows live whale data  
✅ Health check passes  

---

## Still Not Working?

### Check These:

1. **Is dev server running?**
   ```bash
   lsof -ti:3000
   # Should show a process ID
   ```

2. **Are you on the right URL?**
   ```
   ✅ http://localhost:3000/lite
   ❌ http://localhost:3000
   ```

3. **Are environment variables set?**
   ```bash
   ./check-env.sh
   ```

4. **Check browser console for errors**
   - Open DevTools → Console tab
   - Look for red error messages

5. **Check terminal for errors**
   - Look at terminal where `npm run dev` is running
   - Look for error messages

---

## Get Help

**Run diagnostics:**
```bash
./check-env.sh
./health-check.sh http://localhost:3000
```

**Check logs:**
```bash
# Terminal where npm run dev is running
# Look for error messages
```

**Manual test:**
```bash
curl http://localhost:3000/api/lite/digest | jq .
```

---

## Summary

**You have all the code.** You just need to:
1. Set environment variables
2. Start dev server
3. Open browser to /lite

**That's it!** The network requests will appear automatically.
