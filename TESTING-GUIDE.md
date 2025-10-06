# 🧪 Testing Guide - Why You Don't See Network Calls

## The Problem

You don't see network calls because **environment variables are not set**.

Without Supabase credentials, the components can't make API calls.

---

## Quick Test (2 minutes)

### Option 1: Standalone Test Page

1. **Open the test page:**
   ```bash
   open test-live-data.html
   # Or just double-click the file
   ```

2. **Enter your Supabase credentials:**
   - Supabase URL: `https://your-project.supabase.co`
   - Supabase Anon Key: `eyJ...`

3. **Click "Test All"**

4. **You'll see:**
   - ✅ Green = Working
   - ❌ Red = Failed (with error message)

### Option 2: Browser Console Test

1. **Open http://localhost:8083/lite**

2. **Open DevTools Console (F12)**

3. **Paste this:**
   ```javascript
   // Test Supabase connection
   const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
   
   const supabase = createClient(
     'https://your-project.supabase.co',
     'your-anon-key'
   );
   
   // Test whale alerts
   const { data, error } = await supabase.functions.invoke('whale-alerts');
   console.log('Result:', data, error);
   ```

4. **Check the output**

---

## Why No Network Calls?

### Check 1: Environment Variables

```bash
cat .env.local
```

**Expected:**
```
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
WHALE_ALERT_API_KEY=...
```

**If missing:** Create `.env.local` file with your credentials

### Check 2: Supabase Client

Open browser console on http://localhost:8083/lite and type:
```javascript
window.supabase
```

**Expected:** Should show Supabase client object  
**If undefined:** Environment variables not loaded

### Check 3: Component Mounting

Open browser console and type:
```javascript
document.querySelector('[class*="DigestCard"]')
```

**Expected:** Should show the component  
**If null:** Component not rendering

---

## Step-by-Step Debugging

### Step 1: Create .env.local

```bash
cat > .env.local << 'EOF'
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
WHALE_ALERT_API_KEY=your_whale_alert_key
EOF
```

### Step 2: Restart Dev Server

```bash
# Stop current server (Ctrl+C)
npm run dev
```

### Step 3: Verify Environment Loaded

Open browser console:
```javascript
console.log(import.meta.env.NEXT_PUBLIC_SUPABASE_URL)
// Should show your Supabase URL
```

### Step 4: Check Network Tab

1. Open http://localhost:8083/lite
2. Open DevTools → Network tab
3. Filter by "supabase"
4. Refresh page
5. Should see requests to `*.supabase.co`

---

## Common Issues

### Issue 1: "No network calls at all"

**Cause:** Environment variables not set  
**Fix:**
```bash
# Create .env.local with your credentials
# Restart dev server
npm run dev
```

### Issue 2: "401 Unauthorized"

**Cause:** Invalid Supabase key  
**Fix:** Get correct key from https://app.supabase.com/project/_/settings/api

### Issue 3: "Function not found"

**Cause:** Edge Functions not deployed  
**Fix:**
```bash
supabase functions deploy whale-alerts
supabase functions deploy market-summary-enhanced
```

### Issue 4: "relation does not exist"

**Cause:** Database tables not created  
**Fix:**
```bash
supabase db reset
```

---

## Manual Test Commands

### Test Supabase Connection
```bash
curl "https://your-project.supabase.co/rest/v1/" \
  -H "apikey: your-anon-key"
```

### Test Whale Alerts Function
```bash
curl "https://your-project.supabase.co/functions/v1/whale-alerts" \
  -H "Authorization: Bearer your-anon-key" \
  -H "Content-Type: application/json" \
  -X POST
```

### Test Market Summary Function
```bash
curl "https://your-project.supabase.co/functions/v1/market-summary-enhanced" \
  -H "Authorization: Bearer your-anon-key" \
  -H "Content-Type: application/json" \
  -X POST
```

### Test Database Query
```bash
curl "https://your-project.supabase.co/rest/v1/user_profiles?select=*&limit=1" \
  -H "apikey: your-anon-key" \
  -H "Authorization: Bearer your-anon-key"
```

---

## Expected Network Activity

### When Working Correctly:

```
Network Tab:
├── POST https://[project].supabase.co/functions/v1/whale-alerts
│   Status: 200 OK
│   Response: { "transactions": [...] }
│
├── POST https://[project].supabase.co/functions/v1/market-summary-enhanced
│   Status: 200 OK
│   Response: { "riskIndex": 65, ... }
│
├── GET https://[project].supabase.co/rest/v1/user_profiles
│   Status: 200 OK
│   Response: [{ "id": "...", "streak_count": 0 }]
│
└── GET https://[project].supabase.co/rest/v1/token_unlocks
    Status: 200 OK
    Response: [{ "token": "ARB", ... }]
```

---

## Quick Checklist

- [ ] `.env.local` file exists
- [ ] Supabase URL is set
- [ ] Supabase Anon Key is set
- [ ] Dev server restarted after adding env vars
- [ ] Browser on http://localhost:8083/lite
- [ ] DevTools Network tab open
- [ ] Page refreshed
- [ ] Filter by "supabase" in Network tab

---

## Still Not Working?

### Use the Test Page

1. Open `test-live-data.html` in browser
2. Enter your Supabase credentials
3. Click "Test All"
4. See exactly what's failing

### Check Browser Console

Look for errors like:
- ❌ "supabase is not defined" → Env vars not loaded
- ❌ "Failed to fetch" → Network issue
- ❌ "401 Unauthorized" → Invalid credentials
- ❌ "Function not found" → Edge Functions not deployed

---

## Get Your Credentials

### Supabase URL & Keys
1. Go to https://app.supabase.com
2. Select your project
3. Go to Settings → API
4. Copy:
   - Project URL
   - anon public key
   - service_role key (keep secret!)

### Whale Alert API Key
1. Go to https://whale-alert.io/signup
2. Sign up for free tier
3. Get API key from dashboard

---

## Summary

**You need 3 things:**
1. ✅ Environment variables in `.env.local`
2. ✅ Dev server restarted
3. ✅ Supabase Edge Functions deployed

**Then you'll see:**
- Network requests to Supabase
- Live whale data
- Real-time updates

**Use `test-live-data.html` to verify your setup!**
