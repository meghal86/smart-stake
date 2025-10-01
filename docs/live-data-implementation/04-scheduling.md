# 04 - Scheduling

## Supabase Cron Jobs

Configure in Supabase Dashboard > Database > Cron:

```sql
-- Data ingestion: Every minute
SELECT cron.schedule(
  'ingest-whales-live',
  '* * * * *',
  'https://your-project.supabase.co/functions/v1/ingest_whales_live'
);

-- Nightly backfill: Daily at 2:15 AM
SELECT cron.schedule(
  'backfill-nightly',
  '15 2 * * *',
  'https://your-project.supabase.co/functions/v1/backfill_24h'
);

-- Health monitoring: Every 5 minutes
SELECT cron.schedule(
  'health-monitor',
  '*/5 * * * *',
  'https://your-project.supabase.co/functions/v1/uptime-monitor'
);
```

## Backfill Function

**Path**: `supabase/functions/backfill_24h/index.ts`

```typescript
Deno.serve(async (req) => {
  try {
    // Get last 24h of blocks
    const fromBlock = await getBlockFromTimestamp(Date.now() - 24*60*60*1000)
    const toBlock = 'latest'
    
    // Fetch transfers for full 24h period
    const transfers = await fetchAlchemyTransfersRange(fromBlock, toBlock)
    const prices = await fetchHistoricalPrices()
    
    // Process and upsert (idempotent)
    const events = processTransfers(transfers, prices)
    
    await supabase
      .from('events_whale')
      .upsert(events, { 
        onConflict: 'tx_hash,log_index',
        ignoreDuplicates: true 
      })
    
    return new Response(JSON.stringify({
      backfilled: events.length,
      period: '24h'
    }))
  } catch (error) {
    console.error('Backfill error:', error)
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500 
    })
  }
})
```

## Uptime Monitor

**Path**: `supabase/functions/uptime-monitor/index.ts`

```typescript
Deno.serve(async (req) => {
  const checks = await Promise.allSettled([
    checkDataFreshness(),
    checkProviderHealth(),
    checkDatabaseHealth()
  ])
  
  const results = checks.map((check, i) => ({
    service: ['data', 'providers', 'database'][i],
    status: check.status === 'fulfilled' ? 'ok' : 'error',
    details: check.status === 'fulfilled' ? check.value : check.reason
  }))
  
  // Send alerts if critical issues
  const criticalIssues = results.filter(r => r.status === 'error')
  if (criticalIssues.length > 0) {
    await sendSlackAlert(criticalIssues)
  }
  
  return new Response(JSON.stringify({ checks: results }))
})
```

## Manual Triggers

```bash
# Trigger immediate ingestion
curl -X POST https://your-project.supabase.co/functions/v1/ingest_whales_live

# Trigger backfill
curl -X POST https://your-project.supabase.co/functions/v1/backfill_24h

# Check health
curl https://your-project.supabase.co/functions/v1/uptime-monitor
```

## Monitoring Cron Status

```sql
-- View active cron jobs
SELECT * FROM cron.job;

-- View cron job history
SELECT * FROM cron.job_run_details 
ORDER BY start_time DESC 
LIMIT 10;

-- Disable/enable jobs
SELECT cron.unschedule('ingest-whales-live');
SELECT cron.schedule('ingest-whales-live', '* * * * *', '...');
```

---

**Next**: [Client Adapters](./05-client-adapters.md)