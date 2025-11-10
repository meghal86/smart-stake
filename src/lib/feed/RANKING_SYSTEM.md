# Hunter Screen Ranking System

## Overview

The Hunter Screen uses a materialized view (`mv_opportunity_rank`) to efficiently rank opportunities based on three weighted components:

- **Relevance (60%)**: Based on trending score, trust, difficulty, and featured status
- **Trust (25%)**: Normalized trust score from Guardian scans
- **Freshness/Urgency (15%)**: Based on publication age and urgency flags

## Architecture

### Materialized View: `mv_opportunity_rank`

The view precomputes ranking scores for all published, non-expired opportunities. It refreshes every 2-5 minutes via cron job to balance freshness with performance.

**Key columns:**
- `rank_score`: Final weighted score (0-1 range)
- `relevance_score`: Relevance component (0-1)
- `trust_weighted_score`: Trust component (0-1)
- `freshness_weighted_score`: Freshness/urgency component (0-1)
- `trending_score`: Engagement-based trending score from impressions/CTR
- `impressions`, `clicks`, `ctr`: Engagement metrics

### Supporting Table: `opportunity_trending_scores`

Tracks engagement metrics for each opportunity:
- `trending_score`: Normalized score (0-1) based on engagement
- `impressions`: Number of times shown to users
- `clicks`: Number of times clicked
- `ctr`: Click-through rate (computed column)

## Scoring Components

### 1. Relevance Score (60% weight)

Calculated by `calculate_relevance_score()` function:

```sql
Base score components:
- Trending score (40% of relevance): Uses engagement metrics if available
- Trust score (30% of relevance): Quality proxy for cold start
- Difficulty bonus (20% of relevance): Easy=0.2, Medium=0.1, Advanced=0
- Featured bonus (10% of relevance): +0.1 for featured items
```

**Cold start handling:**
- If no trending data exists, uses trust score as proxy
- Prioritizes easy opportunities for new users
- Featured items get visibility boost

### 2. Trust Score (25% weight)

Calculated by `calculate_trust_weighted_score()` function:

```sql
Normalized trust score: trust_score / 100
- Green (≥80): 0.8-1.0
- Amber (60-79): 0.6-0.79
- Red (<60): 0-0.59
```

### 3. Freshness/Urgency Score (15% weight)

Calculated by `calculate_freshness_score()` function:

```sql
Freshness decay:
- <24h: 1.0
- 24h-7d: 0.8 to 0.5 (linear decay)
- 7d-30d: 0.5 to 0.1 (linear decay)
- >30d: 0.1

Urgency bonuses:
- ending_soon: +0.3 (expires in <48h)
- hot: +0.2 (trending/popular)
- new: +0.15 (published <24h)
- Time-based: +0.25 if expires in <48h

Total capped at 1.0
```

## Performance

### Indexes

The materialized view has optimized indexes for common query patterns:

```sql
-- Primary ranking index
idx_mv_rank_score: (rank_score DESC, trust_score DESC, expires_at ASC NULLS LAST, id ASC)

-- Filter indexes
idx_mv_rank_type: (type, rank_score DESC)
idx_mv_rank_chains: GIN(chains)
idx_mv_rank_trust_level: (trust_level, rank_score DESC)
idx_mv_rank_featured: (featured, rank_score DESC) WHERE featured = true
idx_mv_rank_sponsored: (sponsored, rank_score DESC) WHERE sponsored = true
```

### Performance Target

- **P95 latency**: <200ms for queries on 100k rows
- **Refresh interval**: 2-5 minutes (concurrent refresh)
- **Query pattern**: Cursor-based pagination with stable ordering

## Usage

### Query the View

```typescript
import { createServiceClient } from '@/integrations/supabase/service';

const supabase = createServiceClient();

// Get top ranked opportunities
const { data } = await supabase
  .from('mv_opportunity_rank')
  .select('*')
  .order('rank_score', { ascending: false })
  .order('trust_score', { ascending: false })
  .order('expires_at', { ascending: true, nullsFirst: false })
  .order('id', { ascending: true })
  .limit(12);
```

### Refresh the View

```sql
-- Manual refresh (concurrent, non-blocking)
SELECT refresh_opportunity_rank_view();
```

### Debug Ranking

Use the debug view to analyze ranking components:

```sql
SELECT 
  slug,
  title,
  rank_score,
  relevance_raw,
  relevance_weighted,
  trust_raw,
  trust_weighted,
  freshness_raw,
  freshness_weighted,
  trending_score,
  impressions,
  ctr,
  age_hours,
  time_left_hours
FROM vw_opportunity_rank_debug
ORDER BY rank_score DESC
LIMIT 20;
```

## Updating Trending Scores

Trending scores should be updated based on user engagement:

```typescript
// Update impressions when opportunity is shown
await supabase
  .from('opportunity_trending_scores')
  .upsert({
    opportunity_id: oppId,
    impressions: currentImpressions + 1,
    trending_score: calculateTrendingScore(impressions, clicks),
  });

// Update clicks when opportunity is clicked
await supabase
  .from('opportunity_trending_scores')
  .upsert({
    opportunity_id: oppId,
    clicks: currentClicks + 1,
    trending_score: calculateTrendingScore(impressions, clicks),
  });
```

## Fallback Behavior

If trending scores are missing (cold start):

1. Uses trust score as quality proxy
2. Falls back to: `trust_score DESC, published_at DESC`
3. Prioritizes easy difficulty for better UX
4. Featured items get visibility boost

## Monitoring

### Check Refresh Status

```sql
-- View last refresh time
SELECT 
  schemaname,
  matviewname,
  last_refresh
FROM pg_matviews
WHERE matviewname = 'mv_opportunity_rank';
```

### Check Cron Job Status

```sql
-- View cron job runs
SELECT * 
FROM cron.job_run_details 
WHERE jobid = (
  SELECT jobid 
  FROM cron.job 
  WHERE jobname = 'refresh-opportunity-rank'
)
ORDER BY start_time DESC 
LIMIT 10;
```

### Analyze Query Performance

```sql
-- Explain query plan
EXPLAIN ANALYZE
SELECT *
FROM mv_opportunity_rank
ORDER BY rank_score DESC, trust_score DESC, expires_at ASC NULLS LAST, id ASC
LIMIT 12;
```

## A/B Testing

The debug view provides all components for A/B testing different weight combinations:

```sql
-- Test alternative weights: 50% relevance, 30% trust, 20% freshness
SELECT 
  slug,
  title,
  rank_score AS current_score,
  (relevance_score * 0.50 + trust_weighted_score * 0.30 + freshness_weighted_score * 0.20) AS alternative_score
FROM mv_opportunity_rank
ORDER BY alternative_score DESC
LIMIT 20;
```

## Maintenance

### Rebuild View

If schema changes require rebuilding:

```sql
-- Drop and recreate
DROP MATERIALIZED VIEW IF EXISTS mv_opportunity_rank CASCADE;
-- Then run migration again
```

### Vacuum and Analyze

```sql
-- After bulk updates
VACUUM ANALYZE opportunity_trending_scores;
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_opportunity_rank;
```

## Requirements Mapping

- **3.1**: Personalized ranking with relevance, trust, freshness
- **3.2**: Cold start handling with trust-based fallback
- **3.3**: Trending score integration from impressions/CTR
- **3.4**: Freshness decay and urgency bonuses
- **3.5**: Featured and sponsored item boosting
- **3.6**: Stable ordering with deterministic tie-breaking
