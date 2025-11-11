# Smoke Test Setup Guide

This guide covers the complete setup and configuration of synthetic smoke tests for the Hunter Screen API.

## Overview

The smoke test system monitors the Hunter Screen API from multiple regions (US, EU, APAC) every 5 minutes to ensure:
- API availability
- Response time performance
- Multi-region accessibility

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Vercel Cron                          │
│              (Runs every 5 minutes)                     │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│           /api/cron/smoke-test                          │
│         (Edge Runtime Handler)                          │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│         Smoke Test Runner                               │
│    (Tests from 3 regions in parallel)                   │
└─────┬───────────────┬───────────────┬───────────────────┘
      │               │               │
      ▼               ▼               ▼
┌──────────┐   ┌──────────┐   ┌──────────┐
│ US East  │   │ EU West  │   │  APAC    │
│ Virginia │   │ Ireland  │   │Singapore │
└──────────┘   └──────────┘   └──────────┘
      │               │               │
      └───────────────┴───────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│    /api/hunter/opportunities?mode=fixtures              │
│           (Target Endpoint)                             │
└─────────────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              Alert System                               │
│    (Slack, PagerDuty, Email, etc.)                      │
└─────────────────────────────────────────────────────────┘
```

## Configuration

### 1. Environment Variables

Add to your `.env` file:

```bash
# Required: Base URL for the application
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app

# Optional: Secret for authenticating cron requests
CRON_SECRET=your-random-secret-here

# Optional: Alerting service credentials
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
PAGERDUTY_TOKEN=your-pagerduty-token
PAGERDUTY_ROUTING_KEY=your-routing-key
```

### 2. Vercel Cron Configuration

The cron job is already configured in `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/smoke-test",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

This runs every 5 minutes. You can adjust the schedule:
- `*/5 * * * *` - Every 5 minutes
- `*/10 * * * *` - Every 10 minutes
- `*/15 * * * *` - Every 15 minutes
- `0 * * * *` - Every hour

### 3. Test Configuration

Default configuration in `src/lib/monitoring/smoke-tests.ts`:

```typescript
export const DEFAULT_CONFIG: SmokeTestConfig = {
  endpoint: '/api/hunter/opportunities?mode=fixtures',
  timeout: 10000, // 10 seconds
  expectedStatus: 200,
  maxLatency: 2000, // 2 seconds (alert threshold)
  regions: [
    { code: 'us-east-1', name: 'US East (Virginia)' },
    { code: 'eu-west-1', name: 'EU West (Ireland)' },
    { code: 'ap-southeast-1', name: 'APAC (Singapore)' },
  ],
};
```

## Alert Conditions

Alerts are triggered when:

1. **Any region fails** - HTTP status ≠ 200 or network error
2. **Max latency exceeds threshold** - Any region > 2000ms
3. **Average latency too high** - Average > 1600ms (80% of max threshold)

## Alerting Integrations

### Slack Integration

Edit `src/lib/monitoring/smoke-tests.ts`:

```typescript
export async function sendAlert(
  report: SmokeTestReport,
  reasons: string[]
): Promise<void> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) {
    console.error('SLACK_WEBHOOK_URL not configured');
    return;
  }

  const failedRegions = report.results
    .filter(r => !r.success)
    .map(r => `${r.region}: ${r.error || 'Unknown error'}`)
    .join('\n');

  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: '🚨 Hunter Screen Smoke Test Alert',
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '🚨 Smoke Test Alert',
            emoji: true,
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Reasons:*\n${reasons.map(r => `• ${r}`).join('\n')}`,
          },
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Test ID:*\n${report.testId}`,
            },
            {
              type: 'mrkdwn',
              text: `*Timestamp:*\n${report.timestamp}`,
            },
            {
              type: 'mrkdwn',
              text: `*Passed:*\n${report.summary.passed}/${report.summary.totalTests}`,
            },
            {
              type: 'mrkdwn',
              text: `*Max Latency:*\n${report.summary.maxLatency}ms`,
            },
          ],
        },
        ...(failedRegions ? [{
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Failed Regions:*\n${failedRegions}`,
          },
        }] : []),
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: 'View Logs',
                emoji: true,
              },
              url: `https://vercel.com/${process.env.VERCEL_PROJECT_ID}/logs`,
            },
          ],
        },
      ],
    }),
  });
}
```

### PagerDuty Integration

```typescript
export async function sendAlert(
  report: SmokeTestReport,
  reasons: string[]
): Promise<void> {
  const token = process.env.PAGERDUTY_TOKEN;
  const routingKey = process.env.PAGERDUTY_ROUTING_KEY;

  if (!token || !routingKey) {
    console.error('PagerDuty credentials not configured');
    return;
  }

  await fetch('https://events.pagerduty.com/v2/enqueue', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Token token=${token}`,
    },
    body: JSON.stringify({
      routing_key: routingKey,
      event_action: 'trigger',
      dedup_key: report.testId,
      payload: {
        summary: `Hunter Screen Smoke Test Alert: ${reasons.join(', ')}`,
        severity: 'error',
        source: 'smoke-test-cron',
        timestamp: report.timestamp,
        custom_details: {
          test_id: report.testId,
          passed: report.summary.passed,
          failed: report.summary.failed,
          avg_latency: report.summary.avgLatency,
          max_latency: report.summary.maxLatency,
          results: report.results,
        },
      },
    }),
  });
}
```

### Email Integration (SendGrid)

```typescript
export async function sendAlert(
  report: SmokeTestReport,
  reasons: string[]
): Promise<void> {
  const apiKey = process.env.SENDGRID_API_KEY;
  const toEmail = process.env.ALERT_EMAIL;

  if (!apiKey || !toEmail) {
    console.error('SendGrid credentials not configured');
    return;
  }

  const failedRegions = report.results
    .filter(r => !r.success)
    .map(r => `<li>${r.region}: ${r.error || 'Unknown error'} (${r.latency}ms)</li>`)
    .join('');

  await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      personalizations: [
        {
          to: [{ email: toEmail }],
          subject: `🚨 Hunter Screen Smoke Test Alert - ${report.testId}`,
        },
      ],
      from: { email: 'alerts@alphawhale.com', name: 'AlphaWhale Monitoring' },
      content: [
        {
          type: 'text/html',
          value: `
            <h2>🚨 Smoke Test Alert</h2>
            <p><strong>Test ID:</strong> ${report.testId}</p>
            <p><strong>Timestamp:</strong> ${report.timestamp}</p>
            
            <h3>Alert Reasons:</h3>
            <ul>
              ${reasons.map(r => `<li>${r}</li>`).join('')}
            </ul>
            
            <h3>Summary:</h3>
            <ul>
              <li>Total Tests: ${report.summary.totalTests}</li>
              <li>Passed: ${report.summary.passed}</li>
              <li>Failed: ${report.summary.failed}</li>
              <li>Avg Latency: ${report.summary.avgLatency}ms</li>
              <li>Max Latency: ${report.summary.maxLatency}ms</li>
            </ul>
            
            ${failedRegions ? `
              <h3>Failed Regions:</h3>
              <ul>${failedRegions}</ul>
            ` : ''}
          `,
        },
      ],
    }),
  });
}
```

## Testing

### Local Testing

1. Start your development server:
```bash
npm run dev
```

2. Run the manual test script:
```bash
node scripts/test-smoke-tests.js
```

3. Or test with curl:
```bash
curl http://localhost:3000/api/cron/smoke-test
```

### Production Testing

1. Test the deployed endpoint:
```bash
node scripts/test-smoke-tests.js https://your-app.vercel.app
```

2. With cron secret:
```bash
CRON_SECRET=your-secret node scripts/test-smoke-tests.js https://your-app.vercel.app
```

3. Or with curl:
```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://your-app.vercel.app/api/cron/smoke-test
```

### Automated Testing

Run the test suite:
```bash
npm test src/__tests__/lib/monitoring/smoke-tests.test.ts
npm test src/__tests__/api/cron-smoke-test.test.ts
npm test src/__tests__/api/cron-smoke-test.integration.test.ts
```

## Monitoring

### View Logs

**Vercel Dashboard:**
1. Go to your project in Vercel
2. Navigate to "Logs"
3. Filter by `/api/cron/smoke-test`

**CLI:**
```bash
vercel logs --follow
```

### View Cron Executions

**Vercel Dashboard:**
1. Go to your project in Vercel
2. Navigate to "Cron Jobs"
3. View execution history and logs

### Metrics to Monitor

1. **Success Rate**: % of smoke tests passing
2. **Latency Trends**: Average and max latency over time
3. **Regional Performance**: Compare latency across regions
4. **Alert Frequency**: How often alerts are triggered

## Troubleshooting

### Tests Always Failing

**Check endpoint availability:**
```bash
curl https://your-app.vercel.app/api/hunter/opportunities?mode=fixtures
```

**Verify environment variables:**
- `NEXT_PUBLIC_APP_URL` is set correctly
- Endpoint returns 200 status

**Check network connectivity:**
- Verify Vercel edge regions can reach your app
- Check for firewall rules blocking requests

### High Latency

**Review API performance:**
- Check database query performance
- Verify CDN caching is working
- Review API route implementation

**Check infrastructure:**
- Verify Vercel region configuration
- Check for cold starts
- Review resource limits

### Alerts Not Sending

**Verify integration:**
- Check alerting service credentials
- Test webhook URLs manually
- Review error logs

**Check implementation:**
- Verify `sendAlert` function is implemented
- Check for network errors
- Review rate limits on alerting service

### Cron Not Running

**Verify configuration:**
- Check `vercel.json` has correct cron configuration
- Verify cron schedule syntax
- Check Vercel project settings

**Check logs:**
```bash
vercel logs --follow
```

## Best Practices

1. **Set appropriate thresholds** - Balance between catching issues and avoiding false positives
2. **Monitor alert frequency** - Too many alerts = alert fatigue
3. **Test alerting integrations** - Verify alerts are delivered correctly
4. **Review logs regularly** - Look for patterns in failures
5. **Update thresholds as needed** - Adjust based on actual performance
6. **Document runbooks** - Create procedures for responding to alerts
7. **Test failover** - Verify system works when regions fail

## Security

1. **Protect cron endpoint** - Use `CRON_SECRET` in production
2. **Secure webhook URLs** - Don't commit secrets to git
3. **Use environment variables** - Store credentials securely
4. **Rotate secrets regularly** - Update tokens periodically
5. **Monitor access logs** - Watch for unauthorized access

## Next Steps

1. ✅ Verify smoke tests are running every 5 minutes
2. ✅ Configure alerting integration (Slack/PagerDuty/Email)
3. ✅ Test alert delivery
4. ✅ Set up monitoring dashboard
5. ✅ Document incident response procedures
6. ✅ Train team on alert handling

## References

- [Vercel Cron Jobs Documentation](https://vercel.com/docs/cron-jobs)
- [Slack Incoming Webhooks](https://api.slack.com/messaging/webhooks)
- [PagerDuty Events API](https://developer.pagerduty.com/docs/events-api-v2/overview/)
- [SendGrid API](https://docs.sendgrid.com/api-reference/mail-send/mail-send)
