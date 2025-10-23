# 📊 How to View Guardian Logs

## Method 1: Browser Console (Recommended for Development)

I've added detailed logging to the frontend. To see logs:

1. **Open Browser DevTools**
   - Chrome/Edge: Press `F12` or `Cmd+Option+I` (Mac) / `Ctrl+Shift+I` (Windows)
   - Safari: Enable Developer menu in Preferences, then `Cmd+Option+C`

2. **Open Console Tab**

3. **Run a scan** and you'll see:
   ```
   🛡️ Guardian Scan Request: {
     wallet: "0x...",
     network: "ethereum",
     requestId: "req_abc123",
     status: 200
   }
   
   ✅ Guardian Scan Response: {
     requestId: "req_abc123",
     trustScore: 0.87,
     riskLevel: "Medium",
     flags: 2,
     network: "Ethereum Mainnet",
     fullResponse: { ... }
   }
   ```

4. **Click the triangles (▶)** to expand `fullResponse` and see all details

### Filtering Console Logs

To see only Guardian logs, type this in the console filter:
```
🛡️
```

Or:
```
Guardian
```

## Method 2: Supabase Dashboard (Production Logs)

### Step 1: Go to Edge Functions

1. Open [Supabase Dashboard](https://supabase.com/dashboard/project/rebeznxivaxgserswhbn)
2. Click **Edge Functions** in left sidebar
3. Click **guardian-scan-v2**

### Step 2: View Logs Tab

1. Click the **Logs** tab at the top
2. You'll see:
   - Request timestamps
   - Response codes (200, 500, etc.)
   - Execution duration
   - Error messages

### Step 3: Filter by Request ID

If you have a `requestId` from the browser console:
1. Copy the `requestId` (e.g., `req_abc123`)
2. In the logs search box, paste the ID
3. You'll see all logs for that specific request

### What to Look For:

| Log Entry | Meaning |
|-----------|---------|
| `scan_started` | Scan initiated successfully |
| `scan_step: { step: 'approvals' }` | Checking token approvals |
| `scan_step: { step: 'reputation' }` | Checking address reputation |
| `scan_step: { step: 'mixer' }` | Checking mixer proximity |
| `scan_completed: { duration: 2800 }` | Scan finished (2.8s) |
| `rate_limit_exceeded` | Too many requests |
| `Error: Timeout` | Probe took >10s |
| `Invalid API key` | Alchemy/Etherscan key issue |

## Method 3: Network Tab (See Full HTTP Request/Response)

### Step 1: Open Network Tab

1. Open DevTools (`F12`)
2. Click **Network** tab
3. Filter: Type `guardian` in the filter box

### Step 2: Trigger a Scan

1. Click "Rescan" in the Guardian page
2. In Network tab, click the `guardian-scan-v2` request

### Step 3: Inspect Details

Click through these tabs:
- **Headers**: See request headers, response headers
- **Payload**: See the request body
- **Response**: See the full JSON response
- **Timing**: See how long each phase took

### Useful Headers to Check:

- `x-request-id`: Unique ID for this request
- `Authorization`: Should start with `Bearer eyJ...`
- `Content-Type`: Should be `application/json`

## Method 4: Real-Time Log Stream (Advanced)

For real-time logs, you can use the Supabase Management API:

```bash
# Install jq for JSON parsing
brew install jq

# Stream logs (replace PROJECT_REF with your project ID)
curl "https://api.supabase.com/v1/projects/rebeznxivaxgserswhbn/functions/guardian-scan-v2/logs" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  | jq .
```

**Note:** You need to get an access token from the Supabase dashboard first.

## Debugging Common Issues

### Issue: Different Scores on Each Scan

**Look for in logs:**
```
Error: Timeout
```

**Solution:** Probes timing out intermittently. Already increased to 10s.

---

### Issue: 500 Internal Server Error

**Look for in logs:**
```
Invalid API key
ALCHEMY_API_KEY not configured
```

**Solution:** Redeploy function to pick up secrets.

---

### Issue: 401 Unauthorized

**Look for in browser console:**
```
Authorization: Bearer undefined
```

**Solution:** `VITE_SUPABASE_PUBLISHABLE_KEY` not in `.env`.

---

### Issue: No Risk Factors

**Look for in response:**
```
factors: []
```

**Solution:** All probes returning clean results (wallet is actually safe).

---

## Quick Commands

### View last 5 scans in browser console

```javascript
// Paste this in browser console
performance.getEntriesByType('resource')
  .filter(e => e.name.includes('guardian-scan'))
  .slice(-5)
  .forEach(e => console.log(e.name, e.duration + 'ms'))
```

### Export logs for debugging

```javascript
// Paste this in browser console
copy(console.memory)
```

---

## Production Monitoring

For production, consider:

1. **Sentry** - Error tracking (already stubbed in code)
2. **LogRocket** - Session replay + logs
3. **Datadog** - APM + logs
4. **Custom Dashboard** - Query Supabase logs table directly

---

**Need help?** Check browser console first, then Supabase Dashboard logs.

