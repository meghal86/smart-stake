# Sync Scheduler with Backoff

Robust scheduler for syncing external data sources with rate limiting, exponential backoff, circuit breakers, and observability.

## Features

- **Per-Source Rate Limiting**: Prevents 429 storms from external APIs
- **Exponential Backoff with Jitter**: Prevents thundering herd problem
- **Circuit Breaker Pattern**: Fails fast when external service is down
- **Bounded Retries**: Prevents infinite retry loops
- **Observable**: Emits sync results for monitoring

## Requirements

Implements Requirements 12.1-12.8:
- 12.1: Live airdrops synced hourly
- 12.2: Upcoming airdrops synced every 4 hours
- 12.3: Quests synced hourly
- 12.4: Yield/staking synced every 2 hours
- 12.5: Points/loyalty synced daily
- 12.6: Sponsored listings appear in real-time
- 12.7: Community submissions require admin review
- 12.8: Guardian scans reflected immediately

## Usage

### Basic Usage

```typescript
import { getScheduler } from '@/lib/sync/scheduler';

// Get singleton scheduler instance
const scheduler = getScheduler();

// Start all sources
scheduler.startAll();

// Or start specific sources
scheduler.start('airdrops');
scheduler.start('quests');

// Stop when done
scheduler.stopAll();
```

### Custom Sync Handler

```typescript
import { getScheduler, SyncSource } from '@/lib/sync/scheduler';

// Custom handler that processes data
async function customSyncHandler(source: SyncSource) {
  console.log(`Syncing ${source}...`);
  
  // Your sync logic here
  const items = await fetchFromExternalAPI(source);
  await saveToDatabase(items);
  
  return { itemsProcessed: items.length };
}

const scheduler = getScheduler(undefined, customSyncHandler);
scheduler.startAll();
```

### Observability

```typescript
import { getScheduler, SyncResult } from '@/lib/sync/scheduler';

// Monitor sync results
function onSyncResult(result: SyncResult) {
  if (result.success) {
    console.log(
      `✓ ${result.source}: ${result.itemsProcessed} items in ${result.duration}ms`
    );
  } else {
    console.error(
      `✗ ${result.source}: ${result.error} (retry ${result.retryCount})`
    );
  }
  
  // Send to monitoring service
  sendMetric('sync.duration', result.duration, { source: result.source });
  sendMetric('sync.success', result.success ? 1 : 0, { source: result.source });
}

const scheduler = getScheduler(undefined, undefined, onSyncResult);
scheduler.startAll();
```

### Check Circuit Breaker State

```typescript
const scheduler = getScheduler();

// Get state for a specific source
const state = scheduler.getCircuitBreakerState('airdrops');
console.log(`Circuit breaker state: ${state?.state}`);
console.log(`Failure count: ${state?.failureCount}`);

// Get all states for dashboard
const allStates = scheduler.getAllStates();
console.log(JSON.stringify(allStates, null, 2));
```

### Manual Circuit Breaker Reset

```typescript
const scheduler = getScheduler();

// Reset circuit breaker if you know the service is back up
scheduler.resetCircuitBreaker('airdrops');
```

## Configuration

Each source has its own configuration:

```typescript
interface SyncConfig {
  source: SyncSource;
  endpoint: string;
  intervalMs: number;
  rateLimit: {
    maxRequests: number;
    windowMs: number;
  };
  backoff: {
    initialDelayMs: number;
    maxDelayMs: number;
    multiplier: number;
    jitterFactor: number;
  };
  circuitBreaker: {
    failureThreshold: number;
    resetTimeoutMs: number;
    halfOpenMaxAttempts: number;
  };
  timeout: number;
}
```

### Default Configurations

| Source | Interval | Rate Limit | Failure Threshold |
|--------|----------|------------|-------------------|
| airdrops | 1 hour | 60/hour | 5 failures |
| airdrops_upcoming | 4 hours | 15/hour | 5 failures |
| quests | 1 hour | 60/hour | 5 failures |
| yield | 2 hours | 30/hour | 5 failures |
| points | 24 hours | 10/hour | 5 failures |
| sponsored | 5 minutes | 120/hour | 5 failures |
| community | 1 hour | 30/hour | 5 failures |

### Custom Configuration

```typescript
import { getScheduler, DEFAULT_SYNC_CONFIGS } from '@/lib/sync/scheduler';

const customConfigs = {
  airdrops: {
    ...DEFAULT_SYNC_CONFIGS.airdrops,
    intervalMs: 30 * 60 * 1000, // 30 minutes instead of 1 hour
    rateLimit: {
      maxRequests: 120,
      windowMs: 60 * 60 * 1000,
    },
  },
};

const scheduler = getScheduler(customConfigs);
```

## Circuit Breaker States

The circuit breaker has three states:

1. **Closed** (Normal): All requests allowed
2. **Open** (Failing): No requests allowed, fast-fail
3. **Half-Open** (Testing): Limited requests to test if service recovered

### State Transitions

```
Closed --[failures >= threshold]--> Open
Open --[timeout elapsed]--> Half-Open
Half-Open --[success]--> Closed
Half-Open --[failure]--> Open
```

## Exponential Backoff

Retry delays grow exponentially with jitter:

```
delay = min(initialDelay * multiplier^retryCount, maxDelay) + jitter
```

Example with default config:
- Retry 1: ~1s
- Retry 2: ~2s
- Retry 3: ~4s
- Retry 4: ~8s
- Retry 5: ~16s
- Retry 6+: ~60s (capped)

Jitter (±10%) prevents thundering herd when multiple instances retry simultaneously.

## Rate Limiting

Per-source sliding window rate limiting:

- Tracks timestamps of recent requests
- Removes requests outside the window
- Rejects if limit exceeded
- Prevents 429 storms from external APIs

## Error Handling

The scheduler handles various error types:

- **RATE_LIMITED**: External API returned 429
- **TIMEOUT**: Request exceeded timeout
- **CIRCUIT_BREAKER_OPEN**: Circuit breaker is open
- **RATE_LIMIT_EXCEEDED**: Internal rate limit exceeded
- **HTTP errors**: Non-200 responses from external APIs

## Monitoring

Key metrics to track:

```typescript
// Success rate
sync.success{source="airdrops"} = 1 or 0

// Duration
sync.duration{source="airdrops"} = milliseconds

// Circuit breaker state
sync.circuit_breaker.state{source="airdrops"} = "closed" | "open" | "half-open"

// Failure count
sync.circuit_breaker.failures{source="airdrops"} = count

// Retry count
sync.retry_count{source="airdrops"} = count

// Rate limit usage
sync.rate_limit.usage{source="airdrops"} = requests / maxRequests
```

## Testing

See `src/__tests__/lib/sync/scheduler.test.ts` for comprehensive test coverage.

## Production Deployment

### Vercel Cron

```typescript
// app/api/cron/sync/route.ts
import { getScheduler } from '@/lib/sync/scheduler';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const scheduler = getScheduler();
  
  // Execute sync based on cron schedule
  const source = new URL(request.url).searchParams.get('source');
  if (source) {
    const result = await scheduler.executeSync(source as any);
    return Response.json(result);
  }

  return Response.json({ error: 'Missing source parameter' }, { status: 400 });
}
```

### Vercel Cron Configuration

```json
{
  "crons": [
    {
      "path": "/api/cron/sync?source=airdrops",
      "schedule": "0 * * * *"
    },
    {
      "path": "/api/cron/sync?source=airdrops_upcoming",
      "schedule": "0 */4 * * *"
    },
    {
      "path": "/api/cron/sync?source=quests",
      "schedule": "0 * * * *"
    },
    {
      "path": "/api/cron/sync?source=yield",
      "schedule": "0 */2 * * *"
    },
    {
      "path": "/api/cron/sync?source=points",
      "schedule": "0 0 * * *"
    },
    {
      "path": "/api/cron/sync?source=sponsored",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

## Best Practices

1. **Use Singleton**: Always use `getScheduler()` to get the singleton instance
2. **Monitor Metrics**: Track success rates and circuit breaker states
3. **Set Alerts**: Alert on high failure rates or open circuit breakers
4. **Tune Configs**: Adjust rate limits based on external API quotas
5. **Test Backoff**: Verify backoff prevents cascading failures
6. **Log Results**: Use `onResult` callback for observability
7. **Graceful Shutdown**: Call `stopAll()` before process exit

## Troubleshooting

### Circuit Breaker Stuck Open

If a circuit breaker is stuck open after the service recovers:

```typescript
scheduler.resetCircuitBreaker('airdrops');
```

### Rate Limit Exceeded

If hitting rate limits frequently:

1. Increase `intervalMs` to reduce frequency
2. Decrease `rateLimit.maxRequests` to be more conservative
3. Check if multiple instances are running

### Cascading Failures

If failures cascade across sources:

1. Verify backoff is working (check retry delays)
2. Ensure jitter is enabled (prevents thundering herd)
3. Check circuit breaker thresholds (may need to lower)
4. Monitor external API status

## Related

- [Rate Limiting](../rate-limit/README.md)
- [Redis Caching](../redis/README.md)
- [Feed Query](../feed/README.md)
