# Smoke Test Quick Start Guide

## What Are Smoke Tests?

Synthetic smoke tests automatically monitor the Hunter Screen API from multiple regions (US, EU, APAC) every 5 minutes to ensure availability and performance.

## Quick Setup (5 Minutes)

### 1. Verify Configuration

The smoke tests are already configured and will run automatically on Vercel. No additional setup required!

```bash
# Verify cron is configured
cat vercel.json | grep smoke-test
```

### 2. Test Locally (Optional)

```bash
# Start your dev server
npm run dev

# In another terminal, run the test script
node scripts/test-smoke-tests.js
```

### 3. Deploy to Production

```bash
# Deploy to Vercel
vercel --prod

# The cron job will start running automatically every 5 minutes
```

### 4. Set Up Alerts (Recommended)

Choose one alerting method:

#### Option A: Slack (Easiest)

1. Create a Slack webhook: https://api.slack.com/messaging/webhooks
2. Add to your environment variables:
   ```bash
   SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
   ```
3. Update `src/lib/monitoring/smoke-tests.ts` with the Slack integration code from `SMOKE_TEST_SETUP.md`

#### Option B: PagerDuty (For On-Call)

1. Get your PagerDuty credentials
2. Add to environment variables:
   ```bash
   PAGERDUTY_TOKEN=your-token
   PAGERDUTY_ROUTING_KEY=your-routing-key
   ```
3. Update `src/lib/monitoring/smoke-tests.ts` with the PagerDuty integration code

#### Option C: Email (Simple)

1. Get SendGrid API key
2. Add to environment variables:
   ```bash
   SENDGRID_API_KEY=your-key
   ALERT_EMAIL=alerts@your-domain.com
   ```
3. Update `src/lib/monitoring/smoke-tests.ts` with the SendGrid integration code

## How It Works

```
Every 5 minutes:
  ├─ Test from US East (Virginia)
  ├─ Test from EU West (Ireland)
  └─ Test from APAC (Singapore)
       │
       └─ Hit: /api/hunter/opportunities?mode=fixtures
            │
            ├─ ✅ All pass → No alert
            └─ ❌ Any fail → Alert triggered
```

## Alert Conditions

Alerts trigger when:
- ❌ Any region fails (HTTP ≠ 200)
- ⏱️ Max latency > 2000ms
- 📊 Avg latency > 1600ms

## View Results

### Vercel Dashboard
1. Go to your project
2. Click "Cron Jobs"
3. View execution history

### CLI
```bash
vercel logs --follow
```

### Manual Test
```bash
# Test production
node scripts/test-smoke-tests.js https://your-app.vercel.app

# With cron secret
CRON_SECRET=your-secret node scripts/test-smoke-tests.js https://your-app.vercel.app
```

## Expected Output

```
🔍 Testing Smoke Test System
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Base URL: https://your-app.vercel.app
Cron Secret: ✓ Configured
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 Smoke Test Results
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Summary:
  Total Tests: 3
  Passed: 3
  Failed: 0
  Avg Latency: 250ms
  Max Latency: 350ms

Results by Region:
  ✓ us-east-1: 200ms (status: 200)
  ✓ eu-west-1: 250ms (status: 200)
  ✓ ap-southeast-1: 300ms (status: 200)

✅ All checks passed - No alerts triggered
```

## Troubleshooting

### Tests Failing?

1. **Check endpoint manually:**
   ```bash
   curl https://your-app.vercel.app/api/hunter/opportunities?mode=fixtures
   ```

2. **Verify environment variables:**
   - `NEXT_PUBLIC_APP_URL` is set
   - Endpoint returns 200

3. **Check logs:**
   ```bash
   vercel logs --follow
   ```

### High Latency?

1. Check API performance metrics
2. Review database queries
3. Verify CDN caching

### Alerts Not Sending?

1. Verify alerting credentials
2. Check `sendAlert` implementation
3. Review error logs

## Security

### Protect Cron Endpoint

Add to `.env`:
```bash
CRON_SECRET=your-random-secret-here
```

This prevents unauthorized access to the cron endpoint.

## Files Reference

- **Core Logic**: `src/lib/monitoring/smoke-tests.ts`
- **Cron Endpoint**: `src/app/api/cron/smoke-test/route.ts`
- **Configuration**: `vercel.json`
- **Test Script**: `scripts/test-smoke-tests.js`
- **Full Guide**: `.kiro/specs/hunter-screen-feed/SMOKE_TEST_SETUP.md`

## Next Steps

1. ✅ Deploy to production
2. ✅ Verify cron is running (check Vercel dashboard)
3. ✅ Set up alerting integration
4. ✅ Test alert delivery
5. ✅ Monitor for a few days
6. ✅ Adjust thresholds if needed

## Support

For detailed setup instructions, see:
- `SMOKE_TEST_SETUP.md` - Complete setup guide
- `TASK_34A_COMPLETION.md` - Implementation details
- `src/app/api/cron/smoke-test/README.md` - API documentation

## Summary

✅ **Smoke tests are ready to use!**

The system will automatically:
- Monitor your API every 5 minutes
- Test from 3 global regions
- Alert on failures or high latency
- Log all results to Vercel

Just deploy and optionally set up alerting. That's it!
