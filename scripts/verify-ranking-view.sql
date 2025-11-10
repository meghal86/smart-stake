-- Verification script for ranking materialized view
-- Run this after applying the migration to verify everything works

-- Check if the materialized view exists
SELECT 
  schemaname, 
  matviewname, 
  hasindexes, 
  ispopulated
FROM pg_matviews 
WHERE matviewname = 'mv_opportunity_rank';

-- Check if helper functions exist
SELECT 
  proname, 
  pg_get_function_arguments(oid) as arguments
FROM pg_proc 
WHERE proname IN (
  'calculate_freshness_score',
  'calculate_trust_weighted_score',
  'calculate_relevance_score',
  'refresh_opportunity_rank_view'
);

-- Check if trending scores table exists
SELECT 
  table_name, 
  table_type
FROM information_schema.tables 
WHERE table_name = 'opportunity_trending_scores';

-- Sample query from the materialized view
SELECT 
  id,
  slug,
  title,
  type,
  trust_score,
  trust_level,
  relevance_score,
  trust_weighted_score,
  freshness_weighted_score,
  rank_score,
  trending_score,
  impressions,
  clicks,
  ctr
FROM mv_opportunity_rank
ORDER BY rank_score DESC
LIMIT 5;

-- Check index usage
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'mv_opportunity_rank';

-- Verify scoring components are within valid ranges
SELECT 
  COUNT(*) as total_rows,
  COUNT(*) FILTER (WHERE rank_score >= 0 AND rank_score <= 1) as valid_rank_scores,
  COUNT(*) FILTER (WHERE relevance_score >= 0 AND relevance_score <= 1) as valid_relevance,
  COUNT(*) FILTER (WHERE trust_weighted_score >= 0 AND trust_weighted_score <= 1) as valid_trust,
  COUNT(*) FILTER (WHERE freshness_weighted_score >= 0 AND freshness_weighted_score <= 1) as valid_freshness,
  MIN(rank_score) as min_rank,
  MAX(rank_score) as max_rank,
  AVG(rank_score) as avg_rank
FROM mv_opportunity_rank;

-- Check debug view
SELECT 
  id,
  slug,
  relevance_raw,
  relevance_weighted,
  trust_raw,
  trust_weighted,
  freshness_raw,
  freshness_weighted,
  rank_score,
  age_hours,
  time_left_hours
FROM vw_opportunity_rank_debug
ORDER BY rank_score DESC
LIMIT 3;

-- Performance test: measure query time
EXPLAIN ANALYZE
SELECT *
FROM mv_opportunity_rank
WHERE trust_level = 'green'
  AND type = 'airdrop'
ORDER BY rank_score DESC, trust_score DESC, expires_at ASC NULLS LAST, id ASC
LIMIT 12;

-- Check that only published and non-expired items are included
SELECT 
  status,
  COUNT(*) as count,
  COUNT(*) FILTER (WHERE expires_at IS NOT NULL AND expires_at <= NOW()) as expired_count
FROM mv_opportunity_rank
GROUP BY status;

ECHO 'Verification complete!';
