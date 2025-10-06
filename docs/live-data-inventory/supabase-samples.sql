-- ============================================================================
-- DB Tables Used for Live Data
-- ============================================================================
-- Run these queries in Supabase SQL Editor to verify data freshness
-- Replace [YOUR_PROJECT_REF] with actual Supabase project reference

-- ============================================================================
-- 1. LIST ALL PUBLIC TABLES
-- ============================================================================
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Expected tables (based on migrations):
-- - user_profiles
-- - whale_digest
-- - whale_index
-- - token_unlocks
-- - price_cache
-- - provider_usage
-- - whale_transactions
-- - whale_clusters
-- - predictions
-- - scenarios
-- - watchlist
-- - alert_rules
-- - portfolio_addresses

-- ============================================================================
-- 2. PRICE CACHE - Recent Price Data
-- ============================================================================
SELECT 
  asset,
  price_usd,
  provider,
  fetched_at,
  EXTRACT(EPOCH FROM (NOW() - fetched_at)) as age_seconds
FROM price_cache
WHERE fetched_at > NOW() - INTERVAL '5 minutes'
ORDER BY fetched_at DESC
LIMIT 10;

-- Expected columns: asset, price_usd, provider, fetched_at, ttl_seconds
-- Sample output:
-- asset | price_usd | provider   | fetched_at                | age_seconds
-- ------|-----------|------------|---------------------------|------------
-- ETH   | 3542.50   | coingecko  | 2024-01-15 10:30:45+00    | 12.5
-- BTC   | 65432.10  | coingecko  | 2024-01-15 10:30:45+00    | 12.5
-- ETH   | 3541.80   | coingecko  | 2024-01-15 10:30:30+00    | 27.3

-- ============================================================================
-- 3. WHALE DIGEST - Recent Whale Events
-- ============================================================================
SELECT 
  id,
  event_time,
  asset,
  summary,
  severity,
  amount_usd,
  EXTRACT(EPOCH FROM (NOW() - event_time)) / 3600 as hours_ago
FROM whale_digest
ORDER BY event_time DESC
LIMIT 10;

-- Expected columns: id, event_time, asset, summary, severity, amount_usd
-- Sample output:
-- id | event_time              | asset | summary                           | severity | amount_usd | hours_ago
-- ---|-------------------------|-------|-----------------------------------|----------|------------|----------
-- 1  | 2024-01-15 09:45:00+00  | ETH   | Large transfer to Binance         | 4        | 5200000    | 0.75
-- 2  | 2024-01-15 08:30:00+00  | BTC   | Whale accumulation detected       | 3        | 12000000   | 2.0

-- ============================================================================
-- 4. WHALE INDEX - Daily Activity Scores
-- ============================================================================
SELECT 
  date,
  score,
  label,
  whale_count,
  total_volume_usd,
  EXTRACT(EPOCH FROM (NOW() - date)) / 3600 as hours_ago
FROM whale_index
ORDER BY date DESC
LIMIT 10;

-- Expected columns: date, score, label, whale_count, total_volume_usd
-- Sample output:
-- date       | score | label     | whale_count | total_volume_usd | hours_ago
-- -----------|-------|-----------|-------------|------------------|----------
-- 2024-01-15 | 78    | Hot       | 892         | 1500000000       | 2.5
-- 2024-01-14 | 65    | Elevated  | 745         | 1200000000       | 26.5

-- ============================================================================
-- 5. TOKEN UNLOCKS - Upcoming Vesting Events
-- ============================================================================
SELECT 
  token,
  unlock_time,
  amount_usd,
  chain,
  project_name,
  EXTRACT(EPOCH FROM (unlock_time - NOW())) / 86400 as days_until
FROM token_unlocks
WHERE unlock_time > NOW()
ORDER BY unlock_time ASC
LIMIT 10;

-- Expected columns: token, unlock_time, amount_usd, chain, project_name
-- Sample output:
-- token | unlock_time             | amount_usd | chain    | project_name | days_until
-- ------|-------------------------|------------|----------|--------------|------------
-- ARB   | 2024-01-20 00:00:00+00  | 45000000   | ethereum | Arbitrum     | 4.5
-- OP    | 2024-01-25 00:00:00+00  | 32000000   | ethereum | Optimism     | 9.5

-- ============================================================================
-- 6. USER PROFILES - Plan Distribution
-- ============================================================================
SELECT 
  plan,
  COUNT(*) as user_count,
  COUNT(*) * 100.0 / SUM(COUNT(*)) OVER () as percentage
FROM user_profiles
GROUP BY plan
ORDER BY user_count DESC;

-- Expected columns: plan, user_count, percentage
-- Sample output:
-- plan       | user_count | percentage
-- -----------|------------|------------
-- LITE       | 1250       | 75.5
-- PRO        | 350        | 21.1
-- ENTERPRISE | 56         | 3.4

-- ============================================================================
-- 7. PROVIDER USAGE - API Call Tracking
-- ============================================================================
SELECT 
  provider,
  day_window,
  SUM(calls) as total_calls,
  MAX(minute_window) as last_call
FROM provider_usage
WHERE day_window >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY provider, day_window
ORDER BY day_window DESC, provider;

-- Expected columns: provider, day_window, total_calls, last_call
-- Sample output:
-- provider   | day_window | total_calls | last_call
-- -----------|------------|-------------|-------------------------
-- coingecko  | 2024-01-15 | 8542        | 2024-01-15 10:30:00+00
-- cmc        | 2024-01-15 | 145         | 2024-01-15 09:15:00+00
-- etherscan  | 2024-01-15 | 2341        | 2024-01-15 10:28:00+00

-- ============================================================================
-- 8. WHALE TRANSACTIONS - Recent Large Movements
-- ============================================================================
SELECT 
  tx_hash,
  from_address,
  to_address,
  amount_usd,
  symbol,
  timestamp,
  blockchain,
  EXTRACT(EPOCH FROM (NOW() - timestamp)) / 60 as minutes_ago
FROM whale_transactions
WHERE timestamp > NOW() - INTERVAL '1 hour'
ORDER BY timestamp DESC
LIMIT 10;

-- Expected columns: tx_hash, from_address, to_address, amount_usd, symbol, timestamp, blockchain
-- Sample output:
-- tx_hash    | from_address | to_address   | amount_usd | symbol | timestamp               | blockchain | minutes_ago
-- -----------|--------------|--------------|------------|--------|-------------------------|------------|------------
-- 0xabc...   | 0x123...     | 0x456...     | 5200000    | ETH    | 2024-01-15 10:25:00+00  | ethereum   | 5.5
-- 0xdef...   | 0x789...     | 0xabc...     | 12000000   | BTC    | 2024-01-15 10:20:00+00  | bitcoin    | 10.2

-- ============================================================================
-- 9. PREDICTIONS - ML Model Outputs
-- ============================================================================
SELECT 
  id,
  asset,
  prediction_type,
  confidence,
  predicted_value,
  created_at,
  EXTRACT(EPOCH FROM (NOW() - created_at)) / 60 as minutes_ago
FROM predictions
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC
LIMIT 10;

-- Expected columns: id, asset, prediction_type, confidence, predicted_value, created_at
-- Sample output:
-- id  | asset | prediction_type | confidence | predicted_value | created_at              | minutes_ago
-- ----|-------|-----------------|------------|-----------------|-------------------------|------------
-- 123 | ETH   | price_movement  | 0.85       | 3600.00         | 2024-01-15 10:15:00+00  | 15.5
-- 124 | BTC   | whale_activity  | 0.72       | 1.00            | 2024-01-15 10:10:00+00  | 20.3

-- ============================================================================
-- 10. FRESHNESS CHECK - Latest Timestamps Across All Tables
-- ============================================================================
SELECT 
  'price_cache' as table_name,
  MAX(fetched_at) as latest_row,
  COUNT(*) as total_rows,
  EXTRACT(EPOCH FROM (NOW() - MAX(fetched_at))) as seconds_old
FROM price_cache

UNION ALL

SELECT 
  'whale_digest' as table_name,
  MAX(event_time) as latest_row,
  COUNT(*) as total_rows,
  EXTRACT(EPOCH FROM (NOW() - MAX(event_time))) as seconds_old
FROM whale_digest

UNION ALL

SELECT 
  'whale_index' as table_name,
  MAX(date) as latest_row,
  COUNT(*) as total_rows,
  EXTRACT(EPOCH FROM (NOW() - MAX(date))) as seconds_old
FROM whale_index

UNION ALL

SELECT 
  'token_unlocks' as table_name,
  MAX(created_at) as latest_row,
  COUNT(*) as total_rows,
  EXTRACT(EPOCH FROM (NOW() - MAX(created_at))) as seconds_old
FROM token_unlocks

UNION ALL

SELECT 
  'whale_transactions' as table_name,
  MAX(timestamp) as latest_row,
  COUNT(*) as total_rows,
  EXTRACT(EPOCH FROM (NOW() - MAX(timestamp))) as seconds_old
FROM whale_transactions

ORDER BY seconds_old ASC;

-- Expected output:
-- table_name          | latest_row              | total_rows | seconds_old
-- --------------------|-------------------------|------------|------------
-- price_cache         | 2024-01-15 10:30:45+00  | 1247       | 12.5
-- whale_transactions  | 2024-01-15 10:25:00+00  | 8542       | 357.2
-- whale_digest        | 2024-01-15 09:45:00+00  | 2341       | 3057.8
-- whale_index         | 2024-01-15 00:00:00+00  | 365        | 37845.0
-- token_unlocks       | 2024-01-10 12:00:00+00  | 156        | 432000.0

-- ============================================================================
-- 11. DATA QUALITY CHECKS
-- ============================================================================

-- Check for NULL values in critical fields
SELECT 
  'price_cache' as table_name,
  COUNT(*) FILTER (WHERE price_usd IS NULL) as null_prices,
  COUNT(*) FILTER (WHERE provider IS NULL) as null_providers,
  COUNT(*) as total_rows
FROM price_cache
WHERE fetched_at > NOW() - INTERVAL '1 hour';

-- Check for stale data (older than expected TTL)
SELECT 
  asset,
  provider,
  fetched_at,
  EXTRACT(EPOCH FROM (NOW() - fetched_at)) as age_seconds,
  CASE 
    WHEN EXTRACT(EPOCH FROM (NOW() - fetched_at)) > 60 THEN 'STALE'
    ELSE 'FRESH'
  END as status
FROM price_cache
WHERE fetched_at > NOW() - INTERVAL '5 minutes'
ORDER BY age_seconds DESC;

-- Check for duplicate entries
SELECT 
  asset,
  fetched_at,
  COUNT(*) as duplicate_count
FROM price_cache
WHERE fetched_at > NOW() - INTERVAL '1 hour'
GROUP BY asset, fetched_at
HAVING COUNT(*) > 1;

-- ============================================================================
-- 12. PERFORMANCE METRICS
-- ============================================================================

-- Average cache hit rate (requires application-level tracking)
-- This would need to be implemented in the application

-- API response times (if logged)
SELECT 
  provider,
  AVG(response_time_ms) as avg_response_ms,
  MAX(response_time_ms) as max_response_ms,
  MIN(response_time_ms) as min_response_ms
FROM api_logs
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY provider;

-- ============================================================================
-- NOTES FOR RUNNING THESE QUERIES
-- ============================================================================
-- 1. Connect to Supabase SQL Editor: https://app.supabase.com/project/[YOUR_PROJECT_REF]/editor
-- 2. Run queries individually or in groups
-- 3. Some tables may not exist if migrations haven't been run
-- 4. Adjust time intervals based on your data retention policy
-- 5. For production, consider creating views for common queries
-- 6. Add indexes on timestamp columns for better performance:
--    CREATE INDEX idx_price_cache_fetched_at ON price_cache(fetched_at DESC);
--    CREATE INDEX idx_whale_digest_event_time ON whale_digest(event_time DESC);
--    CREATE INDEX idx_whale_transactions_timestamp ON whale_transactions(timestamp DESC);
