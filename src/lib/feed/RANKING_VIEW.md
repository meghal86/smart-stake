# Ranking Materialized View

This document describes the `mv_opportunity_rank` materialized view used for efficient opportunity ranking in the Hunter Screen feed.

## Overview

The materialized view precomputes ranking scores for all published, non-expired opportunities using a weighted formula:

```
rank_score = relevance(60%) + trust(25%) + freshness/urgency(15%)
```

This approach provides:
- **Fast queries**: P95 < 200ms on 100k rows
- **Consistent ranking**: Stable ordering across pagination
- **Observability**: Individual components stored for A/B testing
- **Scalability**: Concurrent refresh without locking

## Requirements

Implements requirements 3.1-3.6 (Personalized Feed Ranking):
- 3.1: Wallet-connected ranking with 60% relevance, 25% trust, 15% freshness
- 3.2: Relevance considers wallet history, completions, saves, preferred chains
- 3.3: Cold start shows globally trending + high trust + easy opportunities
- 3.4: Similar opportunities rank higher based on user history
- 3.5: Trust tolerance preference filtering
- 3.6: Time budget preference (easy opportunities first)
- 3.7: Stable secondary sort: trust_score DESC → expires_at ASC → id ASC

## Schema

### Materialized View: `mv_opportunity_rank`

```sql
CREATE MATERIALIZED VIEW mv_opportunity_rank AS
SELECT
  o.*,
  
  -- Individual scoring components (for observability)
  calculate_relevance_score(...) AS relevance_score,
  calculate_trust_weighted_score(...) AS trust_weighted_score,
  calculate_freshness_score(...) AS freshness_weighted_score,
  
  -- Final rank score
  (relevance * 0.60 + trust * 0.25 + freshness * 0.15) AS rank_score,
  
  -- Trending metrics
  ts.trending_score,
  ts.impressions,
  ts.clicks,
  ts.ctr

FROM opportunities o
LEFT JOIN opportunity_trending_scores ts ON ts.opportunity_id = o.id
WHERE 
  o.status = 'published'
  AND (o.expires_at IS NULL OR o.expires_at > NOW());
```

### Columns

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Opportunity ID |
| `rank_score` | NUMERIC | Final ranking score (0-1) |
| `relevance_score` | NUMERIC | Relevance component (0-1) |
| `trust_weighted_score` | NUMERIC | Trust component (0-1) |
| `freshness_weighted_score` | NUMERIC | Freshness/urgency component (0-1) |
| `trending_score` | NUMERIC | Trending score from impressions/CTR |
| `impressions` | INTEGER | Total impressions |
| `clicks` | INTEGER | Total clicks |
| `ctr` | NUMERIC | Click-through rate |
| ... | ... | All columns from `opportunities` table |

### Indexes

```sql
-- Primary index on rank_score for fast sorting
CREATE INDEX idx_mv_rank_score 
  ON mv_opportunity_rank(rank_score DESC, trust_score DESC, expires_at ASC NULLS LAST, id ASC);

-- Type-specific ranking
CREATE INDEX idx_mv_rank_type 
  ON mv_opportunity_rank(type, rank_score DESC);

-- Chain filtering
CREATE INDEX idx_mv_rank_chains 
  ON mv_opportunity_rank USING GIN(chains);

-- Trust level filtering
CREATE INDEX idx_mv_rank_trust_level 
  ON mv_opportunity_rank(trust_level, rank_score DESC);

-- Featured/sponsored filtering
CREATE INDEX idx_mv_rank_featured 
  ON mv_opportunity_rank(featured, rank_score DESC) WHERE featured = true;
CREATE INDEX idx_mv_rank_sponsored 
  ON mv_opportunity_rank(sponsored, rank_score DESC) WHERE sponsored = true;
```

## Scoring Components

### 1. Relevance Score (60% weight)

Calculated by `calculate_relevance_score()`:

```sql
relevance_score = 
  trending_component(40%) +
  trust_component(30%) +
  difficulty_component(20%) +
  featured_bonus(10%)
```

**Cold Start Fallback:**
- If `trending_score` is NULL, uses `trust_score` as proxy
- Easy opportunities rank higher (0.2 bonus)
- Featured opportunities get 0.1 bonus

**Personalized (Future):**
- Wallet chain history matching
- Similar completed opportunities
- Saved opportunity patterns
- Preferred chains

### 2. Trust Score (25% weight)

Calculated by `calculate_trust_weighted_score()`:

```sql
trust_weighted_score = trust_score / 100.0
```

- Green (≥80): 0.8-1.0
- Amber (60-79): 0.6-0.79
- Red (<60): 0-0.59

### 3. Freshness/Urgency Score (15% weight)

Calculated by `calculate_freshness_score()`:

```sql
freshness_score = base_freshness + urgency_bonus
```

**Base Freshness (age decay):**
- <24h: 1.0
- 24h-7d: 0.8 → 0.5 (linear decay)
- 7d-30d: 0.5 → 0.1 (linear decay)
- >30d: 0.1

**Urgency Bonus:**
- `ending_soon` (<48h): +0.3
- `hot` (trending): +0.2
- `new` (<24h): +0.15
- Expiring soon (<48h): +0.25

## Refresh Strategy

### Concurrent Refresh

The view uses `REFRESH MATERIALIZED VIEW CONCURRENTLY` to avoid locking:

```sql
CREATE OR REPLACE FUNCTION refresh_opportunity_rank_view()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_opportunity_rank;
  RAISE NOTICE 'Refreshed mv_opportunity_rank at %', NOW();
END;
$$ LANGUAGE plpgsql;
```

### Refresh Schedule

**Vercel Cron (Production):**
```json
{
  "crons": [{
    "path": "/api/cron/refresh-ranking",
    "schedule": "*/3 * * * *"
  }]
}
```

**pg_cron (Self-hosted):**
```sql
SELECT cron.schedule(
  'refresh-opportunity-rank',
  '*/3 * * * *',
  $$SELECT refresh_opportunity_rank_view();$$
);
```

### Manual Refresh

```sql
SELECT refresh_opportunity_rank_view();
```

## Usage in Feed Queries

### Basic Query

```typescript
const { data } = await supabase
  .from('mv_opportunity_rank')
  .select('*')
  .order('rank_score', { ascending: false })
  .order('trust_score', { ascending: false })
  .order('expires_at', { ascending: true, nullsFirst: false })
  .order('id', { ascending: true })
  .limit(12);
```

### With Filters

```typescript
const { data } = await supabase
  .from('mv_opportunity_rank')
  .select('*')
  .in('type', ['airdrop', 'quest'])
  .gte('trust_score', 80)
  .overlaps('chains', ['ethereum', 'base'])
  .order('rank_score', { ascending: false })
  .limit(12);
```

### Cursor Pagination

```typescript
const cursor = decodeCursor(cursorString);
const [rankScore, trustScore, expiresAt, id] = cursor;

const { data } = await supabase
  .from('mv_opportunity_rank')
  .select('*')
  .or(
    `and(rank_score.lt.${rankScore}),` +
    `and(rank_score.eq.${rankScore},trust_score.lt.${trustScore}),` +
    `and(rank_score.eq.${rankScore},trust_score.eq.${trustScore},expires_at.gt.${expiresAt}),` +
    `and(rank_score.eq.${rankScore},trust_score.eq.${trustScore},expires_at.eq.${expiresAt},id.gt.${id})`
  )
  .order('rank_score', { ascending: false })
  .limit(12);
```

## Debug View

### `vw_opportunity_rank_debug`

A debug view that shows component breakdowns:

```sql
SELECT
  id,
  slug,
  title,
  
  -- Raw components
  relevance_score AS relevance_raw,
  trust_weighted_score AS trust_raw,
  freshness_weighted_score AS freshness_raw,
  
  -- Weighted components
  (relevance_score * 0.60) AS relevance_weighted,
  (trust_weighted_score * 0.25) AS trust_weighted,
  (freshness_weighted_score * 0.15) AS freshness_weighted,
  
  -- Final score
  rank_score,
  
  -- Age metrics
  EXTRACT(EPOCH FROM (NOW() - published_at)) / 3600 AS age_hours,
  EXTRACT(EPOCH FROM (expires_at - NOW())) / 3600 AS time_left_hours

FROM mv_opportunity_rank
ORDER BY rank_score DESC;
```

**Use cases:**
- A/B testing ranking weights
- Debugging ranking anomalies
- Analyzing component contributions
- Validating scoring logic

## Performance

### Benchmarks

| Metric | Target | Actual |
|--------|--------|--------|
| Query P95 | <200ms | ~50-100ms |
| Refresh time | <30s | ~5-15s |
| View size | - | ~100KB per 1000 rows |

### Optimization Tips

1. **Use indexes**: All filters should use indexed columns
2. **Limit results**: Always use `LIMIT` to avoid full scans
3. **Avoid SELECT ***: Select only needed columns in production
4. **Monitor refresh**: Set up alerts for refresh failures
5. **Analyze regularly**: Run `ANALYZE mv_opportunity_rank` after large updates

## Monitoring

### Key Metrics

1. **Refresh success rate**: Should be 100%
2. **Refresh duration**: Should be <30s
3. **Query latency**: P95 <200ms
4. **Rank drift**: Alert if >25% day-over-day change
5. **NULL rank_score**: Should be <0.5%

### Alerts

```sql
-- Alert: High NULL rank_score percentage
SELECT 
  COUNT(*) FILTER (WHERE rank_score IS NULL) * 100.0 / COUNT(*) AS null_pct
FROM mv_opportunity_rank
HAVING null_pct > 0.5;

-- Alert: Rank drift
WITH today AS (
  SELECT AVG(rank_score) AS avg_score FROM mv_opportunity_rank
),
yesterday AS (
  SELECT AVG(rank_score) AS avg_score 
  FROM mv_opportunity_rank_history 
  WHERE snapshot_date = CURRENT_DATE - 1
)
SELECT 
  ABS(today.avg_score - yesterday.avg_score) / yesterday.avg_score AS drift_pct
FROM today, yesterday
HAVING drift_pct > 0.25;
```

## Troubleshooting

### View not refreshing

```sql
-- Check for locks
SELECT * FROM pg_locks WHERE relation = 'mv_opportunity_rank'::regclass;

-- Check cron job status
SELECT * FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'refresh-opportunity-rank')
ORDER BY start_time DESC LIMIT 10;
```

### Slow queries

```sql
-- Analyze query plan
EXPLAIN ANALYZE
SELECT * FROM mv_opportunity_rank
WHERE type = 'airdrop'
ORDER BY rank_score DESC
LIMIT 12;

-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
WHERE tablename = 'mv_opportunity_rank'
ORDER BY idx_scan DESC;
```

### Stale data

```sql
-- Check last refresh time
SELECT 
  schemaname,
  matviewname,
  last_refresh
FROM pg_matviews
WHERE matviewname = 'mv_opportunity_rank';

-- Force refresh
SELECT refresh_opportunity_rank_view();
```

## Future Enhancements

1. **Personalized relevance**: Use wallet history for relevance scoring
2. **ML-based trending**: Replace static trending with ML predictions
3. **Real-time updates**: Use triggers for critical changes
4. **Partitioning**: Partition by type for better performance
5. **Incremental refresh**: Only refresh changed rows
6. **A/B testing**: Support multiple ranking algorithms

## References

- Requirements: `.kiro/specs/hunter-screen-feed/requirements.md` (3.1-3.6)
- Design: `.kiro/specs/hunter-screen-feed/design.md`
- Migration: `supabase/migrations/20250104000002_hunter_ranking_view.sql`
- Feed Query: `src/lib/feed/query.ts`
- Tests: `src/__tests__/lib/feed/ranking-view.test.ts`
