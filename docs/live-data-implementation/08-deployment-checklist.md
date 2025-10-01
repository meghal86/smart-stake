# 08 - Deployment Checklist

## Pre-Deployment

### ✅ Environment Setup
- [ ] API keys configured (Alchemy, Etherscan, CoinGecko)
- [ ] Supabase service role key set
- [ ] `NEXT_PUBLIC_DATA_MODE` environment variable configured
- [ ] Feature flags updated (`flags.data.live=true`)
- [ ] Slack webhook for alerts (optional)

### ✅ Database Ready
- [ ] `events_whale` table created or compatible table mapped
- [ ] Indexes created for performance
- [ ] RLS policies configured
- [ ] Data quality views created
- [ ] Legacy table compatibility verified (if applicable)

### ✅ Functions Deployed
- [ ] `ingest_whales_live` function deployed
- [ ] `whale-spotlight` function deployed  
- [ ] `fear-index` function deployed
- [ ] `prices` function deployed
- [ ] `backfill_24h` function deployed (optional)
- [ ] `uptime-monitor` function deployed (optional)

### ✅ Scheduling Configured
- [ ] Cron job for ingestion (every minute)
- [ ] Cron job for backfill (nightly)
- [ ] Cron job for health monitoring (every 5 minutes)
- [ ] Cron jobs tested manually

## Testing Validation

### ✅ Unit Tests
- [ ] Data processing logic tested
- [ ] USD calculation accuracy verified
- [ ] Confidence heuristic working
- [ ] Deduplication guard functional
- [ ] All unit tests passing

### ✅ Integration Tests
- [ ] Adapter fallback behavior tested
- [ ] Provenance switching verified
- [ ] MSW mocks working correctly
- [ ] Error handling tested

### ✅ E2E Tests
- [ ] Live data mode UI tested
- [ ] Provenance chips display correctly
- [ ] Etherscan links functional
- [ ] Timestamp updates verified
- [ ] All E2E tests passing

### ✅ Performance Tests
- [ ] k6 smoke tests passing
- [ ] p95 response time <400ms
- [ ] Error rate <10%
- [ ] Load testing completed

## Deployment Steps

### 1. Staging Deployment
```bash
# Deploy to staging
vercel --prod --env NEXT_PUBLIC_DATA_MODE=live

# Verify staging health
curl https://staging.alphawhale.com/api/healthz
```

### 2. Production Deployment
```bash
# Deploy functions first
supabase functions deploy --project-ref your-prod-ref

# Deploy frontend with feature flag
vercel --prod --env NEXT_PUBLIC_DATA_MODE=live
```

### 3. Monitoring Setup
```bash
# Enable cron jobs
psql -h your-db-host -c "SELECT cron.schedule('ingest-whales-live', '* * * * *', 'https://your-project.supabase.co/functions/v1/ingest_whales_live');"

# Verify first ingestion
curl -X POST https://your-project.supabase.co/functions/v1/ingest_whales_live
```

## Post-Deployment Validation

### ✅ Data Pipeline
- [ ] First ingestion completed successfully
- [ ] Data appearing in `events_whale` table
- [ ] No duplicate entries (tx_hash + log_index unique)
- [ ] USD amounts calculated correctly
- [ ] Confidence levels assigned properly

### ✅ API Endpoints
- [ ] `/functions/v1/whale-spotlight` returning live data
- [ ] `/functions/v1/fear-index` calculating correctly
- [ ] `/functions/v1/prices` proxying CoinGecko
- [ ] `/api/healthz` reporting system status

### ✅ UI Verification
- [ ] Spotlight card shows "Real" provenance
- [ ] Fear Index displays live score
- [ ] Timestamps updating within 1-3 minutes
- [ ] Etherscan links working with real tx hashes
- [ ] No UI regressions

### ✅ Health Monitoring
- [ ] Status page accessible at `/status`
- [ ] Ops dashboard functional at `/internal/ops`
- [ ] Slack alerts configured (if enabled)
- [ ] Data freshness monitoring active

## Acceptance Criteria

### ✅ Core Functionality
- [ ] **Spotlight**, **Fear Index**, and **Digest** reflect live events within 1-3 minutes
- [ ] Provenance correctly switches between "Real" ↔ "Simulated" based on data freshness
- [ ] All existing UI components work without changes
- [ ] No performance regressions

### ✅ Data Quality
- [ ] Only transactions ≥$250k USD threshold ingested
- [ ] Confidence levels: High (>$2M), Medium ($750k-$2M), Low (<$750k)
- [ ] No negative USD amounts in database
- [ ] All transactions have valid tx_hash
- [ ] Data freshness <10 minutes for "Real" provenance

### ✅ Reliability
- [ ] Graceful fallback to mock data on provider failures
- [ ] Idempotent ingestion (safe to run multiple times)
- [ ] Circuit breaker behavior on repeated failures
- [ ] Error logging and alerting functional

### ✅ Rollback Ready
- [ ] Setting `NEXT_PUBLIC_DATA_MODE=mock` instantly reverts to existing behavior
- [ ] No data loss or corruption possible
- [ ] All tests pass in both modes
- [ ] Feature flags allow gradual rollout

## Rollback Plan

If issues arise:

1. **Immediate**: Set `NEXT_PUBLIC_DATA_MODE=mock` in environment
2. **Disable ingestion**: `SELECT cron.unschedule('ingest-whales-live')`
3. **Redeploy**: Previous version with mock data
4. **Investigate**: Check logs, fix issues, re-test

## Success Metrics

After 24 hours:
- [ ] >95% uptime for data pipeline
- [ ] <5% error rate on API endpoints
- [ ] Data freshness consistently <3 minutes
- [ ] No user-reported issues
- [ ] Performance metrics within SLAs

---

**Next**: [API Reference](./09-api-reference.md)