# Guardian Staleness Cron Job

## Overview

This cron job automatically maintains the freshness of Guardian security scans for opportunities in the Hunter Screen feed.

**Requirements:** 2.9, 8.13  
**Task:** 28

## What It Does

The cron job performs the following tasks:

1. **Find Stale Opportunities**: Identifies opportunities with Guardian scans older than 24 hours
2. **Queue for Rescan**: Adds stale opportunities to the Guardian rescan queue
3. **Detect Category Changes**: Finds opportunities whose trust level changed (green ↔ amber ↔ red)
4. **Purge CDN Cache**: Invalidates cache for opportunities with category changes

## Schedule

The cron job runs **every 30 minutes** (configurable in `vercel.json`).

## Configuration

### Environment Variables

- `CRON_SECRET`: Secret token for authenticating cron requests (required)
- `VERCEL_TOKEN`: Vercel API token for CDN cache purging (optional, for production)

### Vercel Cron Configuration

Add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/guardian-rescan",
      "schedule": "*/30 * * * *"
    }
  ]
}
```

Schedule options:
- `*/30 * * * *` - Every 30 minutes (recommended)
- `0 * * * *` - Every hour
- `0 */2 * * *` - Every 2 hours

## Setup Instructions

### 1. Set CRON_SECRET in Vercel

```bash
# Generate a random secret
openssl rand -base64 32

# Add to Vercel environment variables
# Go to: Vercel Dashboard → Settings → Environment Variables
# Name: CRON_SECRET
# Value: <generated-secret>
# Environments: Production, Preview, Development
```

### 2. Update vercel.json

Add the cron configuration to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/refresh-ranking",
      "schedule": "*/3 * * * *"
    },
    {
      "path": "/api/cron/guardian-rescan",
      "schedule": "*/30 * * * *"
    }
  ]
}
```

### 3. Deploy to Vercel

```bash
git add .
git commit -m "Add Guardian staleness cron job"
git push
```

Vercel will automatically detect and configure the cron job.

## Testing

### Local Testing

```bash
# Set CRON_SECRET in .env
echo "CRON_SECRET=your-secret-here" >> .env

# Start the dev server
npm run dev

# Test the endpoint
curl -X GET http://localhost:3000/api/cron/guardian-rescan \
  -H "Authorization: Bearer your-secret-here"
```

### Production Testing

```bash
# Test the production endpoint
curl -X GET https://your-app.vercel.app/api/cron/guardian-rescan \
  -H "Authorization: Bearer your-secret-here"
```

Expected response:

```json
{
  "success": true,
  "stale_found": 15,
  "queued": 15,
  "queue_errors": 0,
  "category_flips": 2,
  "cache_purged": 2,
  "duration_ms": 1234,
  "timestamp": "2025-01-06T12:00:00.000Z"
}
```

## Monitoring

### Check Cron Execution Logs

1. Go to Vercel Dashboard → Your Project
2. Click on **Deployments**
3. Click on a deployment
4. Go to **Functions** tab
5. Find `/api/cron/guardian-rescan`
6. View execution logs

### Check Rescan Queue

Query Redis to see queued rescans:

```typescript
import { cacheGet } from '@/lib/redis/cache';

// Check if an opportunity is queued
const queueData = await cacheGet(`guardian:rescan:queue:${opportunityId}`);
console.log(queueData);
```

### Check Guardian Scans

Query the database to see recent scans:

```sql
-- Check recent Guardian scans
SELECT 
  o.slug,
  o.trust_level,
  gs.level,
  gs.score,
  gs.scanned_at,
  EXTRACT(EPOCH FROM (NOW() - gs.scanned_at)) / 3600 AS hours_since_scan
FROM opportunities o
LEFT JOIN guardian_scans gs ON gs.opportunity_id = o.id
WHERE o.status = 'published'
ORDER BY gs.scanned_at DESC
LIMIT 20;
```

## How It Works

### 1. Staleness Detection

The job queries the database for opportunities where:
- Status is `published`
- Not expired (`expires_at` is null or in the future)
- Last Guardian scan is older than 24 hours

```typescript
const staleOpportunities = await listStaleOpportunities({
  olderThanHours: 24,
  limit: 100,
});
```

### 2. Rescan Queueing

Each stale opportunity is added to a Redis queue:

```typescript
for (const opportunity of staleOpportunities) {
  await queueRescan(opportunity.id);
}
```

The queue entry includes:
- `opportunityId`: UUID of the opportunity
- `queuedAt`: Timestamp when queued
- `status`: 'pending'
- TTL: 48 hours

### 3. Category Change Detection

The job looks for opportunities where the trust level changed in the last 5 minutes:

```typescript
const categoryFlips = await findCategoryFlips(5);
```

This detects changes like:
- Green → Amber
- Amber → Red
- Red → Green

### 4. Cache Purging

For opportunities with category changes, the job:
1. Invalidates Guardian cache in Redis
2. (Optional) Purges CDN cache via Vercel API

```typescript
await purgeCDNCache(slugs);
```

## Integration with Guardian Service

The cron job uses the existing Guardian infrastructure:

- **Guardian Service** (`src/services/guardianService.ts`): Handles actual scanning
- **Hunter Integration** (`src/lib/guardian/hunter-integration.ts`): Provides batch operations
- **Guardian API** (`src/api/guardian.ts`): API client for Guardian endpoints

The actual rescanning is triggered by a separate process that reads from the queue.

## Error Handling

The cron job handles errors gracefully:

1. **Authentication Errors**: Returns 401 if CRON_SECRET is invalid
2. **Database Errors**: Logs errors and continues processing
3. **Queue Errors**: Tracks failed queue operations
4. **Partial Failures**: Returns success with error counts

Example error response:

```json
{
  "success": true,
  "stale_found": 20,
  "queued": 18,
  "queue_errors": 2,
  "category_flips": 0,
  "cache_purged": 0,
  "duration_ms": 1500,
  "timestamp": "2025-01-06T12:00:00.000Z"
}
```

## Performance Considerations

- **Batch Size**: Processes up to 100 stale opportunities per run
- **Execution Time**: Typically completes in 1-3 seconds
- **Database Load**: Uses indexed queries for efficient lookups
- **Redis Load**: Minimal, only writes queue markers
- **CDN Load**: Only purges changed opportunities (typically 0-5 per run)

## Troubleshooting

### Cron job not running

1. Check CRON_SECRET is set in Vercel environment variables
2. Verify `vercel.json` is committed and deployed
3. Check Vercel function logs for errors
4. Test the endpoint manually with curl

### No opportunities being queued

1. Check if there are stale opportunities:
   ```sql
   SELECT COUNT(*) FROM opportunities o
   JOIN guardian_scans gs ON gs.opportunity_id = o.id
   WHERE o.status = 'published'
   AND gs.scanned_at < NOW() - INTERVAL '24 hours';
   ```
2. Verify Redis is accessible
3. Check function logs for errors

### Category changes not detected

1. Verify Guardian scans are being recorded in the database
2. Check the `guardian_scans` table has recent entries
3. Verify the trigger `trg_guardian_snapshot` is active

### Cache not being purged

1. Check if VERCEL_TOKEN is set (for production CDN purging)
2. Verify the CDN purge implementation is correct
3. Check function logs for purge errors

## Future Enhancements

- [ ] Add metrics tracking (scans queued, cache purges, execution time)
- [ ] Implement actual CDN cache purging via Vercel API
- [ ] Add alerting for high error rates
- [ ] Support for priority rescanning (critical opportunities first)
- [ ] Batch rescan processing (trigger multiple scans at once)
- [ ] Add dashboard for monitoring queue status

## Related Files

- `src/lib/guardian/hunter-integration.ts` - Guardian integration service
- `src/services/guardianService.ts` - Guardian service layer
- `src/api/guardian.ts` - Guardian API client
- `vercel.json` - Cron configuration
- `.kiro/specs/hunter-screen-feed/GUARDIAN_AUDIT.md` - Guardian feature audit

## References

- [Vercel Cron Jobs Documentation](https://vercel.com/docs/cron-jobs)
- [Guardian Integration Status](.kiro/specs/hunter-screen-feed/GUARDIAN_INTEGRATION_STATUS.md)
- Requirements: 2.9, 8.13
- Task: 28
