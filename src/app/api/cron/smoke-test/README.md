# Smoke Test Cron Job

This endpoint runs synthetic smoke tests from multiple regions (US, EU, APAC) to ensure the Hunter Screen API is available and performant.

## Configuration

### Environment Variables

```bash
# Required: Base URL for the application
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app

# Optional: Secret for authenticating cron requests
CRON_SECRET=your-secret-here
```

### Vercel Cron Setup

Add to `vercel.json`:

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

This runs the smoke test every 5 minutes.

## How It Works

1. **Multi-Region Testing**: Tests run from 3 regions:
   - US East (Virginia)
   - EU West (Ireland)
   - APAC (Singapore)

2. **Test Target**: Hits `/api/hunter/opportunities?mode=fixtures` to ensure:
   - API is responding
   - Fixtures endpoint works
   - Response time is acceptable

3. **Alert Conditions**:
   - Any region fails to respond
   - Max latency exceeds 2000ms
   - Average latency exceeds 1600ms (80% of max threshold)

4. **Alert Delivery**: Logs to console (integrate with your alerting service)

## Manual Testing

```bash
# Test locally
curl http://localhost:3000/api/cron/smoke-test

# Test on Vercel (with secret)
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://your-app.vercel.app/api/cron/smoke-test
```

## Response Format

```json
{
  "success": true,
  "report": {
    "testId": "smoke-1234567890",
    "timestamp": "2025-01-10T12:00:00.000Z",
    "results": [
      {
        "success": true,
        "region": "us-east-1",
        "latency": 150,
        "status": 200,
        "timestamp": "2025-01-10T12:00:00.000Z"
      }
    ],
    "summary": {
      "totalTests": 3,
      "passed": 3,
      "failed": 0,
      "avgLatency": 200,
      "maxLatency": 250
    }
  },
  "alert": {
    "triggered": false
  }
}
```

## Integration with Alerting Services

To integrate with your alerting service, modify the `sendAlert` function in `src/lib/monitoring/smoke-tests.ts`:

### Slack Example

```typescript
export async function sendAlert(report: SmokeTestReport, reasons: string[]): Promise<void> {
  await fetch(process.env.SLACK_WEBHOOK_URL!, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: `🚨 Smoke Test Alert`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Smoke Test Failed*\n${reasons.join('\n')}`,
          },
        },
        {
          type: 'section',
          fields: [
            { type: 'mrkdwn', text: `*Test ID:*\n${report.testId}` },
            { type: 'mrkdwn', text: `*Timestamp:*\n${report.timestamp}` },
            { type: 'mrkdwn', text: `*Passed:*\n${report.summary.passed}/${report.summary.totalTests}` },
            { type: 'mrkdwn', text: `*Max Latency:*\n${report.summary.maxLatency}ms` },
          ],
        },
      ],
    }),
  });
}
```

### PagerDuty Example

```typescript
export async function sendAlert(report: SmokeTestReport, reasons: string[]): Promise<void> {
  await fetch('https://events.pagerduty.com/v2/enqueue', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Token token=${process.env.PAGERDUTY_TOKEN}`,
    },
    body: JSON.stringify({
      routing_key: process.env.PAGERDUTY_ROUTING_KEY,
      event_action: 'trigger',
      payload: {
        summary: `Smoke Test Alert: ${reasons.join(', ')}`,
        severity: 'error',
        source: 'smoke-test-cron',
        custom_details: report,
      },
    }),
  });
}
```

## Monitoring

View smoke test results in:
- Vercel Logs: `vercel logs --follow`
- Your alerting service dashboard
- Custom monitoring dashboard (if integrated)

## Troubleshooting

### Tests Always Failing

1. Check `NEXT_PUBLIC_APP_URL` is set correctly
2. Verify `/api/hunter/opportunities?mode=fixtures` works manually
3. Check network connectivity from Vercel edge regions

### High Latency

1. Review API performance metrics
2. Check database query performance
3. Verify CDN caching is working
4. Consider scaling infrastructure

### Alerts Not Sending

1. Verify `sendAlert` function is implemented
2. Check alerting service credentials
3. Review error logs for integration issues
