# Ranking Debug View Documentation

## Overview

The `vw_opportunity_rank_debug` view provides comprehensive observability into the Hunter Screen ranking algorithm. It exposes all individual scoring components and their weighted contributions, enabling A/B testing, ranking analysis, and algorithm tuning.

**Requirements:** 3.1-3.6 (Personalized Feed Ranking)

## Purpose

This debug view is designed for:

1. **A/B Testing**: Compare different ranking formulas and weights
2. **Algorithm Analysis**: Understand why opportunities rank the way they do
3. **Performance Monitoring**: Track ranking component distributions over time
4. **Quality Assurance**: Verify ranking calculations are correct
5. **Product Insights**: Identify patterns in high-performing opportunities

## Schema

### Columns

```sql
CREATE OR REPLACE VIEW vw_opportunity_rank_debug AS
SELECT
  -- Basic opportunity info
  id,
  slug,
  title,
  type,
  trust_score,
  trust_level,
  difficulty,
  featured,
  sponsored,
  urgency,
  published_at,
  expires_at,
  
  -- Trending metrics
  trending_score,
  impressions,
  clicks,
  ctr,
  
  -- Raw component scores (0-1 range)
  relevance_score AS relevance_raw,
  trust_weighted_score AS trust_raw,
  freshness_weighted_score AS freshness_raw,
  
  -- Weighted components (with formula weights applied)
  (relevance_score * 0.60) AS relevance_weighted,
  (trust_weighted_score * 0.25) AS trust_weighted,
  (freshness_weighted_score * 0.15) AS freshness_weighted,
  
  -- Final ranking score
  rank_score,
  
  -- Age metrics for debugging
  EXTRACT(EPOCH FROM (NOW() - published_at)) / 3600 AS age_hours,
  CASE 
    WHEN expires_at IS NOT NULL 
    THEN EXTRACT(EPOCH FROM (expires_at - NOW())) / 3600 
    ELSE NULL 
  END AS time_left_hours

FROM mv_opportunity_rank
ORDER BY rank_score DESC;
```

### Column Descriptions

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Opportunity unique identifier |
| `slug` | TEXT | URL-friendly identifier |
| `title` | TEXT | Opportunity title |
| `type` | TEXT | Opportunity type (airdrop, quest, etc.) |
| `trust_score` | INTEGER | Guardian trust score (0-100) |
| `trust_level` | TEXT | Trust level (green, amber, red) |
| `difficulty` | TEXT | Difficulty level (easy, medium, advanced) |
| `featured` | BOOLEAN | Featured status |
| `sponsored` | BOOLEAN | Sponsored status |
| `urgency` | TEXT | Urgency flag (ending_soon, new, hot) |
| `trending_score` | NUMERIC | Trending score from impressions/CTR (0-1) |
| `impressions` | INTEGER | Number of times shown to users |
| `clicks` | INTEGER | Number of clicks received |
| `ctr` | NUMERIC | Click-through rate (clicks/impressions) |
| `relevance_raw` | NUMERIC | Raw relevance score (0-1) |
| `relevance_weighted` | NUMERIC | Relevance × 0.60 |
| `trust_raw` | NUMERIC | Raw trust score normalized (0-1) |
| `trust_weighted` | NUMERIC | Trust × 0.25 |
| `freshness_raw` | NUMERIC | Raw freshness/urgency score (0-1) |
| `freshness_weighted` | NUMERIC | Freshness × 0.15 |
| `rank_score` | NUMERIC | Final score = sum of weighted components |
| `age_hours` | NUMERIC | Hours since publication |
| `time_left_hours` | NUMERIC | Hours until expiration (null if no expiry) |

## Current Ranking Formula

The current production formula is:

```
rank_score = (relevance × 0.60) + (trust × 0.25) + (freshness × 0.15)
```

### Component Breakdown

**Relevance (60% weight):**
- Based on trending_score (impressions/CTR) if available
- Falls back to trust-based scoring for cold start
- Includes difficulty bonus (easy = +0.2, medium = +0.1)
- Featured bonus (+0.1)

**Trust (25% weight):**
- Normalized Guardian trust score (0-100 → 0-1)
- Green (≥80): 0.8-1.0
- Amber (60-79): 0.6-0.79
- Red (<60): 0-0.59

**Freshness/Urgency (15% weight):**
- Age-based decay (newer = higher)
- Urgency bonuses:
  - ending_soon: +0.3
  - hot: +0.2
  - new: +0.15
- Time-left urgency for expiring items

## Usage Examples

### 1. Basic Query - View Top Ranked Opportunities

```sql
SELECT 
  slug,
  title,
  type,
  rank_score,
  relevance_weighted,
  trust_weighted,
  freshness_weighted
FROM vw_opportunity_rank_debug
ORDER BY rank_score DESC
LIMIT 10;
```

### 2. A/B Test Alternative Ranking Formula

Compare current formula (60/25/15) with alternative (50/30/20):

```sql
SELECT 
  slug,
  title,
  rank_score AS current_score,
  (relevance_raw * 0.50 + trust_raw * 0.30 + freshness_raw * 0.20) AS alternative_score,
  (rank_score - (relevance_raw * 0.50 + trust_raw * 0.30 + freshness_raw * 0.20)) AS score_diff
FROM vw_opportunity_rank_debug
ORDER BY ABS(score_diff) DESC
LIMIT 20;
```

This shows which opportunities would rank most differently under the alternative formula.

### 3. Analyze Component Distributions

```sql
SELECT 
  type,
  COUNT(*) as count,
  AVG(relevance_raw) as avg_relevance,
  AVG(trust_raw) as avg_trust,
  AVG(freshness_raw) as avg_freshness,
  AVG(rank_score) as avg_rank_score
FROM vw_opportunity_rank_debug
GROUP BY type
ORDER BY avg_rank_score DESC;
```

### 4. Find Opportunities with High Trust but Low Rank

Identify opportunities that might be undervalued:

```sql
SELECT 
  slug,
  title,
  trust_score,
  trust_raw,
  rank_score,
  relevance_raw,
  freshness_raw,
  age_hours
FROM vw_opportunity_rank_debug
WHERE trust_raw > 0.8
  AND rank_score < 0.5
ORDER BY trust_raw DESC
LIMIT 10;
```

### 5. Analyze Trending Impact

See how trending metrics affect ranking:

```sql
SELECT 
  slug,
  title,
  trending_score,
  impressions,
  clicks,
  ctr,
  relevance_raw,
  rank_score
FROM vw_opportunity_rank_debug
WHERE trending_score IS NOT NULL
ORDER BY trending_score DESC
LIMIT 20;
```

### 6. Compare Featured vs Non-Featured

```sql
SELECT 
  featured,
  COUNT(*) as count,
  AVG(rank_score) as avg_rank,
  AVG(relevance_raw) as avg_relevance,
  AVG(trust_raw) as avg_trust
FROM vw_opportunity_rank_debug
GROUP BY featured;
```

### 7. Urgency Impact Analysis

```sql
SELECT 
  urgency,
  COUNT(*) as count,
  AVG(freshness_raw) as avg_freshness,
  AVG(rank_score) as avg_rank,
  AVG(time_left_hours) as avg_time_left
FROM vw_opportunity_rank_debug
WHERE urgency IS NOT NULL
GROUP BY urgency
ORDER BY avg_rank DESC;
```

### 8. Identify Ranking Anomalies

Find opportunities where components don't align with expectations:

```sql
-- High relevance but low overall rank
SELECT 
  slug,
  title,
  relevance_raw,
  trust_raw,
  freshness_raw,
  rank_score
FROM vw_opportunity_rank_debug
WHERE relevance_raw > 0.7
  AND rank_score < 0.5
ORDER BY relevance_raw DESC
LIMIT 10;
```

## A/B Testing Workflow

### Step 1: Define Alternative Formula

Document your hypothesis and new weights:

```
Hypothesis: Increasing trust weight will improve user satisfaction
Current: 60% relevance, 25% trust, 15% freshness
Alternative: 50% relevance, 35% trust, 15% freshness
```

### Step 2: Simulate Alternative Rankings

```sql
-- Create temporary comparison table
CREATE TEMP TABLE ranking_comparison AS
SELECT 
  id,
  slug,
  title,
  type,
  rank_score AS current_rank,
  (relevance_raw * 0.50 + trust_raw * 0.35 + freshness_raw * 0.15) AS alternative_rank,
  ROW_NUMBER() OVER (ORDER BY rank_score DESC) AS current_position,
  ROW_NUMBER() OVER (ORDER BY (relevance_raw * 0.50 + trust_raw * 0.35 + freshness_raw * 0.15) DESC) AS alternative_position
FROM vw_opportunity_rank_debug;

-- Analyze position changes
SELECT 
  slug,
  title,
  type,
  current_position,
  alternative_position,
  (alternative_position - current_position) AS position_change
FROM ranking_comparison
WHERE ABS(alternative_position - current_position) > 5
ORDER BY ABS(position_change) DESC
LIMIT 20;
```

### Step 3: Analyze Impact by Segment

```sql
-- Impact by type
SELECT 
  type,
  COUNT(*) as count,
  AVG(current_rank) as avg_current,
  AVG(alternative_rank) as avg_alternative,
  AVG(alternative_rank - current_rank) as avg_change
FROM ranking_comparison rc
JOIN vw_opportunity_rank_debug d ON rc.id = d.id
GROUP BY type
ORDER BY avg_change DESC;
```

### Step 4: Identify Winners and Losers

```sql
-- Biggest winners (move up significantly)
SELECT 
  slug,
  title,
  type,
  trust_level,
  current_position,
  alternative_position,
  (current_position - alternative_position) AS positions_gained
FROM ranking_comparison
WHERE alternative_position < current_position
ORDER BY positions_gained DESC
LIMIT 10;

-- Biggest losers (move down significantly)
SELECT 
  slug,
  title,
  type,
  trust_level,
  current_position,
  alternative_position,
  (alternative_position - current_position) AS positions_lost
FROM ranking_comparison
WHERE alternative_position > current_position
ORDER BY positions_lost DESC
LIMIT 10;
```

### Step 5: Validate with Business Metrics

After implementing the alternative formula in production (via feature flag):

```sql
-- Compare CTR between control and treatment groups
SELECT 
  experiment_group,
  AVG(ctr) as avg_ctr,
  AVG(clicks) as avg_clicks,
  COUNT(*) as sample_size
FROM analytics_events ae
JOIN vw_opportunity_rank_debug d ON ae.opportunity_id = d.id
WHERE event_type = 'card_impression'
  AND created_at > NOW() - INTERVAL '7 days'
GROUP BY experiment_group;
```

## Monitoring Queries

### Daily Ranking Health Check

```sql
-- Check for null scores (should be 0%)
SELECT 
  COUNT(*) FILTER (WHERE rank_score IS NULL) * 100.0 / COUNT(*) AS null_pct,
  COUNT(*) FILTER (WHERE relevance_raw IS NULL) * 100.0 / COUNT(*) AS relevance_null_pct,
  COUNT(*) FILTER (WHERE trust_raw IS NULL) * 100.0 / COUNT(*) AS trust_null_pct,
  COUNT(*) FILTER (WHERE freshness_raw IS NULL) * 100.0 / COUNT(*) AS freshness_null_pct
FROM vw_opportunity_rank_debug;
```

### Component Distribution Check

```sql
-- Verify components are within expected ranges
SELECT 
  'relevance' as component,
  MIN(relevance_raw) as min_val,
  AVG(relevance_raw) as avg_val,
  MAX(relevance_raw) as max_val,
  STDDEV(relevance_raw) as stddev
FROM vw_opportunity_rank_debug
UNION ALL
SELECT 
  'trust',
  MIN(trust_raw),
  AVG(trust_raw),
  MAX(trust_raw),
  STDDEV(trust_raw)
FROM vw_opportunity_rank_debug
UNION ALL
SELECT 
  'freshness',
  MIN(freshness_raw),
  AVG(freshness_raw),
  MAX(freshness_raw),
  STDDEV(freshness_raw)
FROM vw_opportunity_rank_debug;
```

### Rank Drift Detection

```sql
-- Alert if average rank score changes significantly day-over-day
WITH today AS (
  SELECT AVG(rank_score) AS avg_score 
  FROM vw_opportunity_rank_debug
),
yesterday AS (
  SELECT AVG(rank_score) AS avg_score 
  FROM mv_opportunity_rank_history 
  WHERE snapshot_date = CURRENT_DATE - 1
)
SELECT 
  today.avg_score AS today_avg,
  yesterday.avg_score AS yesterday_avg,
  ((today.avg_score - yesterday.avg_score) / yesterday.avg_score * 100) AS pct_change
FROM today, yesterday
WHERE ABS((today.avg_score - yesterday.avg_score) / yesterday.avg_score) > 0.25;
```

## TypeScript Integration

### Query the Debug View from Code

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

// Fetch debug data for analysis
async function analyzeRankingComponents() {
  const { data, error } = await supabase
    .from('vw_opportunity_rank_debug')
    .select(`
      id,
      slug,
      title,
      type,
      relevance_raw,
      relevance_weighted,
      trust_raw,
      trust_weighted,
      freshness_raw,
      freshness_weighted,
      rank_score
    `)
    .order('rank_score', { ascending: false })
    .limit(100);

  if (error) throw error;
  return data;
}

// Compare alternative ranking formula
async function compareRankingFormulas(
  relevanceWeight: number,
  trustWeight: number,
  freshnessWeight: number
) {
  const { data, error } = await supabase
    .from('vw_opportunity_rank_debug')
    .select(`
      id,
      slug,
      title,
      relevance_raw,
      trust_raw,
      freshness_raw,
      rank_score
    `);

  if (error) throw error;

  return data.map((row) => ({
    ...row,
    alternative_score:
      row.relevance_raw * relevanceWeight +
      row.trust_raw * trustWeight +
      row.freshness_raw * freshnessWeight,
    score_diff: row.rank_score - (
      row.relevance_raw * relevanceWeight +
      row.trust_raw * trustWeight +
      row.freshness_raw * freshnessWeight
    ),
  }));
}

// Analyze component impact
async function analyzeComponentImpact() {
  const { data, error } = await supabase
    .from('vw_opportunity_rank_debug')
    .select(`
      type,
      relevance_raw,
      trust_raw,
      freshness_raw,
      rank_score
    `);

  if (error) throw error;

  // Group by type and calculate averages
  const byType = data.reduce((acc, row) => {
    if (!acc[row.type]) {
      acc[row.type] = {
        count: 0,
        totalRelevance: 0,
        totalTrust: 0,
        totalFreshness: 0,
        totalRank: 0,
      };
    }
    acc[row.type].count++;
    acc[row.type].totalRelevance += row.relevance_raw;
    acc[row.type].totalTrust += row.trust_raw;
    acc[row.type].totalFreshness += row.freshness_raw;
    acc[row.type].totalRank += row.rank_score;
    return acc;
  }, {} as Record<string, any>);

  return Object.entries(byType).map(([type, stats]) => ({
    type,
    count: stats.count,
    avgRelevance: stats.totalRelevance / stats.count,
    avgTrust: stats.totalTrust / stats.count,
    avgFreshness: stats.totalFreshness / stats.count,
    avgRank: stats.totalRank / stats.count,
  }));
}
```

## Best Practices

1. **Use for Analysis Only**: This view is for debugging and analysis, not for production feed queries. Use `mv_opportunity_rank` for actual feed data.

2. **Sample Large Datasets**: When analyzing all opportunities, use `LIMIT` or sampling to avoid performance issues.

3. **Compare Apples to Apples**: When A/B testing, ensure you're comparing the same set of opportunities (same filters, same time period).

4. **Document Experiments**: Keep a log of all A/B tests with hypotheses, formulas tested, and results.

5. **Monitor Component Distributions**: Set up alerts for unusual distributions that might indicate data quality issues.

6. **Validate Calculations**: Periodically verify that weighted components sum to rank_score correctly.

7. **Consider Segments**: Different opportunity types may benefit from different ranking weights.

8. **Track Over Time**: Create snapshots of ranking distributions to detect drift.

## Troubleshooting

### Issue: All rank_scores are the same

**Cause**: Likely missing trending_score data or all opportunities have similar characteristics.

**Solution**: 
```sql
-- Check trending score coverage
SELECT 
  COUNT(*) FILTER (WHERE trending_score IS NOT NULL) * 100.0 / COUNT(*) AS trending_coverage_pct
FROM vw_opportunity_rank_debug;
```

### Issue: Components don't sum to rank_score

**Cause**: Rounding errors or view not refreshed.

**Solution**:
```sql
-- Verify calculation
SELECT 
  slug,
  relevance_weighted + trust_weighted + freshness_weighted AS calculated_sum,
  rank_score,
  ABS((relevance_weighted + trust_weighted + freshness_weighted) - rank_score) AS diff
FROM vw_opportunity_rank_debug
WHERE ABS((relevance_weighted + trust_weighted + freshness_weighted) - rank_score) > 0.001
LIMIT 10;
```

### Issue: Unexpected ranking order

**Cause**: May be due to specific component dominating or data quality issues.

**Solution**:
```sql
-- Analyze top-ranked opportunities
SELECT 
  slug,
  title,
  rank_score,
  relevance_raw,
  trust_raw,
  freshness_raw,
  trending_score,
  featured,
  urgency
FROM vw_opportunity_rank_debug
ORDER BY rank_score DESC
LIMIT 10;
```

## Related Documentation

- [RANKING_SYSTEM.md](./RANKING_SYSTEM.md) - Overall ranking system architecture
- [RANKING_VIEW.md](./RANKING_VIEW.md) - Materialized view technical details
- [query.ts](./query.ts) - Feed query implementation

## Change Log

| Date | Change | Reason |
|------|--------|--------|
| 2025-01-04 | Initial creation | Task 9c - Add rank observability |

## Support

For questions or issues with the debug view:
1. Check the [Troubleshooting](#troubleshooting) section
2. Review related documentation
3. Contact the data team for ranking algorithm questions
