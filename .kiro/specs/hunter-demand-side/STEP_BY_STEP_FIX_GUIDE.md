# Hunter "No Data" - Step-by-Step Fix Guide

## Current Status
- ✅ Database has 51 opportunities
- ✅ Code updated to fetch directly from Supabase
- ❌ You're still seeing "No opportunities"

## Most Likely Causes

### 1. Demo Mode is Active (90% probability)
### 2. Environment variables not loaded (8% probability)
### 3. Browser cache issue (2% probability)

## Step-by-Step Fix

### Step 1: Open the Debug Tool

1. **Start your dev server** (if not running):
```bash
npm run dev
```

2. **Open the debug tool** in your browser:
```
http://localhost:8080/test-hunter-live-debug.html
```

3. **Click all the buttons** and share the results with me

### Step 2: Check Demo Mode

**In the debug tool**, look at "Step 3: Demo Mode Status"

If it says "Demo mode is ACTIVE":
1. Click "Force Live Mode" button
2. Go back to Hunter page: `http://localhost:8080/hunter`
3. Refresh the page (Cmd+R or Ctrl+R)

### Step 3: Check Browser Console

1. Open Hunter page: `http://localhost:8080/hunter`
2. Open DevTools Console (F12 or Cmd+Option+I)
3. Look for these logs:

**What you SHOULD see** (working):
```
🎯 Hunter Feed Mode: { isDemo: false, useRealAPI: true, ... }
🔴 LIVE MODE ACTIVE - Will fetch from Supabase
🌐 Live Mode: Fetching from Supabase { filter: 'All', ... }
✅ Supabase Response: { itemCount: 12, ... }
```

**What you might see** (not working):
```
🎯 Hunter Feed Mode: { isDemo: true, useRealAPI: false, ... }
🎭 DEMO MODE ACTIVE - Using mock data
📦 Demo Mode: Returning mock data (5 opportunities)
```

### Step 4: Force Live Mode (If Demo Mode is Active)

**Option A: Using Browser Console**
```javascript
// Paste this in browser console:
localStorage.setItem('demo_mode', 'false')
location.reload()
```

**Option B: Using Debug Tool**
1. Go to `http://localhost:8080/test-hunter-live-debug.html`
2. Click "Force Live Mode" button
3. Go back to Hunter page and refresh

### Step 5: Check Environment Variables

**In browser console**, run:
```javascript
console.log({
  url: import.meta.env.VITE_SUPABASE_URL,
  hasKey: !!import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
})
```

**Expected output**:
```javascript
{
  url: "https://rebeznxivaxgserswhbn.supabase.co",
  hasKey: true
}
```

**If you see `undefined`**:
1. Stop dev server (Ctrl+C)
2. Restart: `npm run dev`
3. Refresh browser

### Step 6: Clear Browser Cache

If still not working:

1. **Hard refresh**: Cmd+Shift+R (Mac) or Ctrl+Shift+F5 (Windows)
2. **Clear storage**:
   ```javascript
   // In browser console:
   localStorage.clear()
   sessionStorage.clear()
   location.reload()
   ```

### Step 7: Test Direct Supabase Query

**In browser console**, paste this:
```javascript
import('@supabase/supabase-js').then(async ({ createClient }) => {
  const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
  );
  
  const { data, error } = await supabase
    .from('opportunities')
    .select('*')
    .eq('status', 'published')
    .limit(5);
  
  console.log('Direct query result:', { data, error });
});
```

**Expected**: Should log 5 opportunities  
**If error**: Share the error message with me

## Quick Diagnostic Checklist

Run through this checklist and tell me which ones fail:

- [ ] Dev server is running on port 8080
- [ ] Can access http://localhost:8080/hunter
- [ ] Console shows "🔴 LIVE MODE ACTIVE"
- [ ] Console shows "✅ Supabase Response"
- [ ] localStorage.getItem('demo_mode') returns 'false'
- [ ] import.meta.env.VITE_SUPABASE_URL is defined
- [ ] No red errors in console
- [ ] Can see opportunities in debug tool (Step 4)

## What to Share With Me

If still not working, share these outputs:

### 1. Demo Mode Status
```javascript
// Run in console:
console.log('Demo mode:', localStorage.getItem('demo_mode'))
```

### 2. Environment Check
```javascript
// Run in console:
console.log({
  url: import.meta.env.VITE_SUPABASE_URL,
  hasKey: !!import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  mode: import.meta.env.MODE,
  dev: import.meta.env.DEV
})
```

### 3. Console Logs
Copy and paste ALL console logs from the Hunter page

### 4. Network Tab
1. Open DevTools → Network tab
2. Refresh Hunter page
3. Look for any failed requests (red)
4. Share screenshot or list of requests

### 5. Debug Tool Results
Share the output from all 4 steps in the debug tool

## Common Issues & Solutions

### Issue 1: "Demo mode is null"
**Solution**: Demo mode defaults to true when null
```javascript
localStorage.setItem('demo_mode', 'false')
location.reload()
```

### Issue 2: "VITE_SUPABASE_URL is undefined"
**Solution**: Restart dev server
```bash
# Stop server (Ctrl+C)
npm run dev
```

### Issue 3: "Supabase error: relation does not exist"
**Solution**: Run migrations
```bash
cd supabase
supabase db push
```

### Issue 4: "No opportunities in database"
**Solution**: Run seed scripts
```bash
npm run seed:all
```

### Issue 5: "Still seeing 5 mock opportunities"
**Solution**: Demo mode is still active
```javascript
localStorage.setItem('demo_mode', 'false')
location.reload()
```

## Expected Working State

When everything is working, you should see:

### Console Output
```
🎯 Hunter Feed Mode: {
  isDemo: false,
  useRealAPI: true,
  activeWallet: null,
  filter: "All",
  timestamp: "2025-02-01T..."
}

🔴 LIVE MODE ACTIVE - Will fetch from Supabase

🌐 Live Mode: Fetching from Supabase {
  filter: "All",
  sort: "recommended",
  cursor: undefined,
  walletAddress: null
}

✅ Supabase Response: {
  itemCount: 12,
  timestamp: "2025-02-01T..."
}
```

### UI
- 12 opportunity cards visible
- Real titles like "zkSync Era Airdrop", "Blast Points Program", etc.
- No blue "Demo Mode" banner
- Cards show real data (not mock data)

### Network Tab
- No requests to `/api/hunter/opportunities` (we're using direct Supabase)
- Requests to Supabase REST API (rebeznxivaxgserswhbn.supabase.co)

## Still Not Working?

If you've tried all the above and it's still not working:

1. **Share the debug tool output** (all 4 steps)
2. **Share console logs** (copy/paste everything)
3. **Share screenshot** of what you see
4. **Tell me**: 
   - What port is dev server on?
   - Do you see the demo banner?
   - How many opportunities do you see?
   - What are their titles?

I'll help you debug further!
