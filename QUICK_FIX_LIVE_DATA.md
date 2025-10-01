# 🚨 Quick Fix: Why You're Still Seeing Mock Data

## The Issue
The environment variable `NEXT_PUBLIC_DATA_MODE=live` is set, but you're still seeing mock data because:

1. **Need to restart dev server** after changing .env
2. **Functions may be falling back** due to empty database
3. **Client-side caching** might be showing old data

## 🔧 Quick Fix Steps

### 1. Restart Dev Server
```bash
# Kill current server (Ctrl+C)
# Then restart
npm run dev
```

### 2. Check Browser Console
Open browser dev tools and look for:
- Network requests to `/functions/v1/whale-spotlight`
- Any error messages
- Console logs about data mode

### 3. Force Refresh
```bash
# Hard refresh in browser
Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
```

### 4. Check Provenance Chips
Look for small badges that say:
- ✅ "Real" = Live data working
- 🔄 "Simulated" = Fallback to mock data

## 🎯 Most Likely Cause

The `whale_transfers` table is probably empty, so the functions fall back to mock data even in live mode.

### To Fix:
1. **Trigger data ingestion** (needs API keys):
```bash
curl -X POST https://rebeznxivaxgserswhbn.supabase.co/functions/v1/data-ingestion
```

2. **Or add some test data** to `whale_transfers` table

3. **Or check if data exists**:
```sql
SELECT COUNT(*) FROM whale_transfers WHERE timestamp > NOW() - INTERVAL '24 hours';
```

## 🚀 Expected Behavior

When working correctly:
- Spotlight shows different numbers than the demo $2.5M
- Fear Index shows different score than demo 67
- Provenance chips show "Real" instead of "Simulated"
- Last updated timestamps are recent

Try restarting your dev server first - that's the most common fix!