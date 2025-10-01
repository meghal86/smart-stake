# 10 - Troubleshooting

## Common Issues

### Data Not Updating

**Symptoms**: UI shows stale timestamps, provenance stuck on "Simulated"

**Diagnosis**:
```sql
-- Check data freshness
SELECT * FROM data_freshness;

-- Check recent ingestion
SELECT count(*) FROM events_whale 
WHERE ts > now() - interval '1 hour';

-- Check cron jobs
SELECT * FROM cron.job WHERE jobname = 'ingest-whales-live';
```

**Solutions**:
1. **Cron not running**: Re-create cron job
2. **API keys invalid**: Check environment variables
3. **Function errors**: Check Supabase logs
4. **Rate limiting**: Reduce ingestion frequency

---

### High Error Rates

**Symptoms**: `/api/healthz` returns 500, Slack alerts firing

**Diagnosis**:
```bash
# Check function logs
supabase functions logs ingest_whales_live

# Check database connectivity
psql -h your-db-host -c "SELECT 1"

# Test API endpoints manually
curl -X POST https://your-project.supabase.co/functions/v1/ingest_whales_live
```

**Solutions**:
1. **Provider timeouts**: Increase timeout, add retry logic
2. **Database locks**: Check for long-running queries
3. **Memory issues**: Optimize function code
4. **Network issues**: Check Supabase status

---

### Incorrect USD Calculations

**Symptoms**: Amounts seem wrong, confidence levels incorrect

**Diagnosis**:
```sql
-- Check recent price data
SELECT * FROM events_whale 
WHERE ts > now() - interval '1 hour'
ORDER BY ts DESC LIMIT 10;

-- Verify price fetching
SELECT meta->'prices' FROM events_whale 
WHERE meta ? 'prices' LIMIT 5;
```

**Solutions**:
1. **Price API down**: Check CoinGecko status
2. **Wrong decimals**: Verify token decimal handling
3. **Stale prices**: Implement price caching fallback
4. **Currency mismatch**: Ensure USD conversion

---

### Duplicate Transactions

**Symptoms**: Same tx_hash appearing multiple times

**Diagnosis**:
```sql
-- Find duplicates
SELECT tx_hash, log_index, count(*) 
FROM events_whale 
GROUP BY tx_hash, log_index 
HAVING count(*) > 1;

-- Check unique constraint
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'events_whale';
```

**Solutions**:
1. **Missing constraint**: Add unique index on (tx_hash, log_index)
2. **Upsert logic**: Fix ON CONFLICT handling
3. **Race conditions**: Add proper locking
4. **Backfill overlap**: Ensure idempotent operations

---

### Performance Issues

**Symptoms**: Slow API responses, timeouts

**Diagnosis**:
```sql
-- Check query performance
EXPLAIN ANALYZE SELECT * FROM events_whale 
WHERE ts > now() - interval '24 hours'
ORDER BY amount_usd DESC LIMIT 10;

-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan 
FROM pg_stat_user_indexes 
WHERE tablename = 'events_whale';
```

**Solutions**:
1. **Missing indexes**: Add indexes on frequently queried columns
2. **Large result sets**: Implement pagination
3. **Expensive aggregations**: Use materialized views
4. **Connection pooling**: Configure Supabase connection limits

---

## Debugging Commands

### Function Testing
```bash
# Test ingestion manually
curl -X POST https://your-project.supabase.co/functions/v1/ingest_whales_live

# Test with verbose output
curl -v https://your-project.supabase.co/functions/v1/whale-spotlight

# Check function deployment
supabase functions list
```

### Database Debugging
```sql
-- Check table structure
\d events_whale

-- View recent activity
SELECT * FROM events_whale 
ORDER BY ts DESC LIMIT 20;

-- Check data distribution
SELECT 
  date_trunc('hour', ts) as hour,
  count(*) as events,
  avg(amount_usd) as avg_amount
FROM events_whale 
WHERE ts > now() - interval '24 hours'
GROUP BY hour
ORDER BY hour;

-- Find problematic records
SELECT * FROM events_whale 
WHERE amount_usd < 0 OR tx_hash IS NULL;
```

### Environment Validation
```bash
# Check environment variables
echo $ALCHEMY_API_KEY | cut -c1-10
echo $ETHERSCAN_API_KEY | cut -c1-10
echo $NEXT_PUBLIC_DATA_MODE

# Test API connectivity
curl "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd"
```

---

## Monitoring Queries

### System Health Dashboard
```sql
-- Overall system status
WITH health AS (
  SELECT 
    extract(epoch from (now() - max(ts))) as data_age,
    count(*) as events_24h,
    sum(amount_usd) as volume_24h
  FROM events_whale 
  WHERE ts > now() - interval '24 hours'
)
SELECT 
  CASE 
    WHEN data_age < 180 THEN 'Healthy'
    WHEN data_age < 600 THEN 'Degraded'
    ELSE 'Critical'
  END as status,
  data_age,
  events_24h,
  volume_24h
FROM health;
```

### Error Detection
```sql
-- Data quality issues
SELECT 
  'Negative amounts' as issue,
  count(*) as count
FROM events_whale 
WHERE amount_usd < 0
UNION ALL
SELECT 
  'Missing hashes' as issue,
  count(*) as count
FROM events_whale 
WHERE tx_hash IS NULL OR tx_hash = ''
UNION ALL
SELECT 
  'Future timestamps' as issue,
  count(*) as count
FROM events_whale 
WHERE ts > now();
```

### Performance Metrics
```sql
-- Ingestion rate over time
SELECT 
  date_trunc('minute', ts) as minute,
  count(*) as events_per_minute
FROM events_whale 
WHERE ts > now() - interval '1 hour'
GROUP BY minute
ORDER BY minute DESC;
```

---

## Recovery Procedures

### Emergency Rollback
```bash
# 1. Switch to mock mode immediately
vercel env add NEXT_PUBLIC_DATA_MODE mock

# 2. Disable ingestion
psql -h your-db-host -c "SELECT cron.unschedule('ingest-whales-live');"

# 3. Redeploy with mock data
vercel --prod

# 4. Verify rollback
curl https://your-app.com/api/healthz
```

### Data Corruption Recovery
```sql
-- 1. Backup current data
CREATE TABLE events_whale_backup AS 
SELECT * FROM events_whale;

-- 2. Remove problematic records
DELETE FROM events_whale 
WHERE amount_usd < 0 OR tx_hash IS NULL;

-- 3. Re-run backfill
-- (Trigger backfill_24h function)

-- 4. Verify data integrity
SELECT count(*) FROM events_whale;
```

### Function Recovery
```bash
# 1. Check function status
supabase functions list

# 2. Redeploy problematic function
supabase functions deploy ingest_whales_live

# 3. Test manually
curl -X POST https://your-project.supabase.co/functions/v1/ingest_whales_live

# 4. Re-enable cron
psql -c "SELECT cron.schedule('ingest-whales-live', '* * * * *', '...');"
```

---

## Support Contacts

### Internal Escalation
1. **Data Issues**: Check database logs, contact DB admin
2. **API Issues**: Check Supabase status, review function logs  
3. **Provider Issues**: Check Alchemy/Etherscan status pages
4. **Performance Issues**: Review metrics, scale resources

### External Dependencies
- **Supabase Status**: https://status.supabase.com
- **Alchemy Status**: https://status.alchemy.com
- **Etherscan**: https://etherscan.io (no status page)
- **CoinGecko**: https://status.coingecko.com

### Useful Links
- [Supabase Dashboard](https://app.supabase.com)
- [Vercel Dashboard](https://vercel.com/dashboard)
- [Function Logs](https://app.supabase.com/project/your-project/functions)
- [Database Logs](https://app.supabase.com/project/your-project/logs)

---

**Implementation Complete!** 🎉

You now have comprehensive documentation for implementing live data in AlphaWhale Lite V2. Each document provides specific, actionable steps while maintaining the reuse-first, non-destructive approach outlined in the original prompt.