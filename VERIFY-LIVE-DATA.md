# ✅ Verify Live Data is Working

## Quick Check (30 seconds)

### Step 1: Open Browser Console

1. Go to http://localhost:8083/lite
2. Press F12 (or Cmd+Option+I on Mac)
3. Go to Console tab

### Step 2: Look for These Messages

You should see:
```
✅ Loaded X whale transactions
```

Or if it fails:
```
❌ Whale Alert API failed: [error message]
```

### Step 3: Check Network Tab

1. Stay in DevTools
2. Click Network tab
3. Filter by "supabase"
4. Refresh page (Cmd+R or Ctrl+R)

You should see:
```
POST whale-alerts
Status: 200 OK
```

---

## What I Just Fixed

### The Problem
The `/lite` page was using `src/components/lite/DigestCard.tsx` which had **mock data**.

I was updating `src/components/hub/DigestCard.tsx` (wrong file!).

### The Solution
Updated the correct file (`lite/DigestCard.tsx`) to:
1. Call `supabase.functions.invoke('whale-alerts')`
2. Display live whale transaction count
3. Show live dollar amounts
4. Log to console for debugging

---

## Now You Should See

### In Browser Console:
```
✅ Loaded 47 whale transactions
```

### In the UI:
```
47 whale transactions detected. BTC movement of $5.2M
```

### In Network Tab:
```
Request URL: https://rebeznxivaxgserswhbn.supabase.co/functions/v1/whale-alerts
Status: 200 OK
```

---

## If You Still Don't See Network Calls

### Check 1: Is Dev Server Running?
```bash
# Should show process on port 8083
lsof -ti:8083
```

### Check 2: Are You on the Right Page?
```
✅ http://localhost:8083/lite
❌ http://localhost:8083/lite/hub
```

### Check 3: Browser Console Errors?
Open Console tab and look for red errors

### Check 4: Supabase Edge Function Deployed?
```bash
# Check if function exists
curl "https://rebeznxivaxgserswhbn.supabase.co/functions/v1/whale-alerts" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJlYmV6bnhpdmF4Z3NlcnN3aGJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0MDc0NDIsImV4cCI6MjA3MDk4MzQ0Mn0.u2t2SEmm3rTpseRRdgym3jnaOq7lRLHW531PxPmu6xo" \
  -X POST
```

---

## Troubleshooting

### Error: "Failed to invoke function"
**Cause:** Edge Function not deployed  
**Fix:**
```bash
supabase functions deploy whale-alerts
```

### Error: "WHALE_ALERT_API_KEY not configured"
**Cause:** Missing API key in Supabase secrets  
**Fix:**
```bash
supabase secrets set WHALE_ALERT_API_KEY=your_key
```

### No errors, but no network calls
**Cause:** Component not mounting  
**Fix:** Check browser console for React errors

---

## Expected Behavior

### Success ✅
1. Page loads
2. Console shows: `✅ Loaded X whale transactions`
3. Network tab shows POST to `whale-alerts`
4. UI shows live transaction count

### Failure ❌
1. Page loads
2. Console shows: `❌ Whale Alert API failed: [error]`
3. Network tab shows POST to `whale-alerts` with error
4. UI shows fallback text

**Both are correct!** The system fails explicitly, not silently.

---

## Files Updated

1. ✅ `src/components/lite/DigestCard.tsx` - Now calls Supabase
2. ✅ `src/components/hub/DigestCard.tsx` - Already updated (different component)
3. ✅ `src/components/hub/IndexDialCard.tsx` - Already updated
4. ✅ `src/components/hub/StreakCard.tsx` - Already updated
5. ✅ `src/components/hub/UnlockTeaserCard.tsx` - Already updated

---

## Next Steps

1. **Refresh the page:** http://localhost:8083/lite
2. **Open Console:** F12 → Console tab
3. **Look for:** `✅ Loaded X whale transactions`
4. **Check Network:** Network tab → Filter "supabase"

**You should now see live data calls!**
