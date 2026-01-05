-- Hunter Screen Ranking Materialized View Migration
-- This migration creates a materialized view for efficient opportunity ranking
-- with relevance (60%), trust (25%), and freshness/urgency (15%) scoring
--
-- Requirements: 3.1-3.6 (Personalized Feed Ranking)

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to calculate freshness/urgency score
CREATE OR REPLACE FUNCTION calculate_freshness_score(
  p_published_at TIMESTAMPTZ,
  p_expires_at TIMESTAMPTZ,
  p_urgency TEXT
) RETURNS NUMERIC AS $$
DECLARE
  v_age_hours NUMERIC;
  v_time_left_hours NUMERIC;
  v_freshness_score NUMERIC := 0;
  v_urgency_bonus NUMERIC := 0;
BEGIN
  -- Calculate age in hours (newer = higher score)
  v_age_hours := EXTRACT(EPOCH FROM (NOW() - p_published_at)) / 3600;
  
  -- Freshness decay: 1.0 for <24h, 0.5 for 7 days, 0.1 for 30+ days
  v_freshness_score := CASE
    WHEN v_age_hours < 24 THEN 1.0
    WHEN v_age_hours < 168 THEN 0.8 - (v_age_hours - 24) / 168 * 0.3  -- 24h-7d: 0.8 to 0.5
    WHEN v_age_hours < 720 THEN 0.5 - (v_age_hours - 168) / 552 * 0.4  -- 7d-30d: 0.5 to 0.1
    ELSE 0.1
  END;
  
  -- Urgency bonus
  v_urgency_bonus := CASE p_urgency
    WHEN 'ending_soon' THEN 0.3  -- Ending in <48h
    WHEN 'hot' THEN 0.2          -- Trending/popular
    WHEN 'new' THEN 0.15         -- Published <24h
    ELSE 0
  END;
  
  -- Time left urgency (if expires_at is set)
  IF p_expires_at IS NOT NULL THEN
    v_time_left_hours := EXTRACT(EPOCH FROM (p_expires_at - NOW())) / 3600;
    IF v_time_left_hours < 48 AND v_time_left_hours > 0 THEN
      -- Boost items expiring soon
      v_urgency_bonus := GREATEST(v_urgency_bonus, 0.25);
    END IF;
  END IF;
  
  -- Combine freshness and urgency (capped at 1.0)
  RETURN LEAST(v_freshness_score + v_urgency_bonus, 1.0);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to calculate trust-weighted score
CREATE OR REPLACE FUNCTION calculate_trust_weighted_score(
  p_trust_score INTEGER,
  p_trust_level TEXT
) RETURNS NUMERIC AS $$
BEGIN
  -- Normalize trust score to 0-1 range
  -- Green (≥80): 0.8-1.0
  -- Amber (60-79): 0.6-0.79
  -- Red (<60): 0-0.59
  RETURN COALESCE(p_trust_score, 60) / 100.0;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
/* Function to calculate relevance score (cold start / anonymous users) */
CREATE OR REPLACE FUNCTION calculate_relevance_score(
  p_trending_score NUMERIC,
  p_trust_score INTEGER,
  p_difficulty TEXT,
  p_featured BOOLEAN
) RETURNS NUMERIC AS $$
DECLARE
  v_base_score NUMERIC := 0.5;  -- Default baseline
  v_trending_weight NUMERIC := 0.4;
  v_trust_weight NUMERIC := 0.3;
  v_difficulty_weight NUMERIC := 0.2;
  v_featured_bonus NUMERIC := 0.1;
BEGIN
  -- Use trending_score if available, otherwise fallback to trust-based scoring
  IF p_trending_score IS NOT NULL AND p_trending_score > 0 THEN
    v_base_score := p_trending_score * v_trending_weight;
  ELSE
    -- Cold start: use trust score as proxy for quality
    v_base_score := (COALESCE(p_trust_score, 60) / 100.0) * v_trending_weight;
  END IF;
  
  -- Add trust component
  v_base_score := v_base_score + (COALESCE(p_trust_score, 60) / 100.0) * v_trust_weight;
  
  -- Difficulty bonus (easy opportunities rank higher for cold start)
  v_base_score := v_base_score + CASE p_difficulty
    WHEN 'easy' THEN 0.2
    WHEN 'medium' THEN 0.1
    ELSE 0
  END * v_difficulty_weight;
  
  -- Featured bonus
  IF p_featured THEN
    v_base_score := v_base_score + v_featured_bonus;
  END IF;
  
  -- Cap at 1.0
  RETURN LEAST(v_base_score, 1.0);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- TRENDING SCORE TABLE (for impressions/CTR tracking)
-- ============================================================================

-- Table to store trending scores based on impressions and CTR
CREATE TABLE IF NOT EXISTS opportunity_trending_scores (
  opportunity_id UUID PRIMARY KEY REFERENCES opportunities(id) ON DELETE CASCADE,
  trending_score NUMERIC CHECK (trending_score >= 0 AND trending_score <= 1),
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  ctr NUMERIC GENERATED ALWAYS AS (
    CASE WHEN impressions > 0 THEN clicks::NUMERIC / impressions ELSE 0 END
  ) STORED,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_trending_scores_score ON opportunity_trending_scores(trending_score DESC);
CREATE INDEX idx_trending_scores_updated ON opportunity_trending_scores(last_updated DESC);

COMMENT ON TABLE opportunity_trending_scores IS 'Trending scores based on impressions and CTR for ranking';
COMMENT ON COLUMN opportunity_trending_scores.trending_score IS 'Normalized trending score (0-1) based on engagement metrics';
COMMENT ON COLUMN opportunity_trending_scores.ctr IS 'Click-through rate (clicks/impressions)';

-- ============================================================================
-- MATERIALIZED VIEW: mv_opportunity_rank
-- ============================================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_opportunity_rank AS
SELECT
  o.id,
  o.slug,
  o.title,
  o.protocol_name,
  o.protocol_logo,
  o.type,
  o.chains,
  o.reward_min,
  o.reward_max,
  o.reward_currency,
  o.reward_confidence,
  o.apr,
  o.difficulty,
  o.featured,
  o.sponsored,
  o.external_url,
  o.status,
  o.urgency,
  o.trust_score,
  o.trust_level,
  o.published_at,
  o.expires_at,
  o.updated_at,
  
  -- Individual scoring components (for observability)
  calculate_relevance_score(
    ts.trending_score,
    o.trust_score,
    o.difficulty,
    o.featured
  ) AS relevance_score,
  
  calculate_trust_weighted_score(
    o.trust_score,
    o.trust_level
  ) AS trust_weighted_score,
  
  calculate_freshness_score(
    o.published_at,
    o.expires_at,
    o.urgency::TEXT
  ) AS freshness_weighted_score,
  
  -- Final rank score: relevance(60%) + trust(25%) + freshness/urgency(15%)
  (
    calculate_relevance_score(ts.trending_score, o.trust_score, o.difficulty, o.featured) * 0.60 +
    calculate_trust_weighted_score(o.trust_score, o.trust_level) * 0.25 +
    calculate_freshness_score(o.published_at, o.expires_at, o.urgency::TEXT) * 0.15
  ) AS rank_score,
  
  -- Trending metrics (for observability)
  ts.trending_score,
  ts.impressions,
  ts.clicks,
  ts.ctr

FROM opportunities o
LEFT JOIN opportunity_trending_scores ts ON ts.opportunity_id = o.id
WHERE 
  o.status = 'published'
  AND (o.expires_at IS NULL OR o.expires_at > NOW());

-- Create indexes on the materialized view for fast queries
CREATE UNIQUE INDEX idx_mv_rank_id ON mv_opportunity_rank(id);
CREATE INDEX idx_mv_rank_score ON mv_opportunity_rank(rank_score DESC, trust_score DESC, expires_at ASC NULLS LAST, id ASC);
CREATE INDEX idx_mv_rank_type ON mv_opportunity_rank(type, rank_score DESC);
CREATE INDEX idx_mv_rank_chains ON mv_opportunity_rank USING GIN(chains);
CREATE INDEX idx_mv_rank_trust_level ON mv_opportunity_rank(trust_level, rank_score DESC);
CREATE INDEX idx_mv_rank_featured ON mv_opportunity_rank(featured, rank_score DESC) WHERE featured = true;
CREATE INDEX idx_mv_rank_sponsored ON mv_opportunity_rank(sponsored, rank_score DESC) WHERE sponsored = true;

COMMENT ON MATERIALIZED VIEW mv_opportunity_rank IS 'Precomputed opportunity rankings with relevance(60%) + trust(25%) + freshness(15%)';
COMMENT ON COLUMN mv_opportunity_rank.relevance_score IS 'Relevance component (0-1) based on trending, trust, difficulty, featured';
COMMENT ON COLUMN mv_opportunity_rank.trust_weighted_score IS 'Trust component (0-1) normalized from trust_score';
COMMENT ON COLUMN mv_opportunity_rank.freshness_weighted_score IS 'Freshness/urgency component (0-1) based on age and urgency';
COMMENT ON COLUMN mv_opportunity_rank.rank_score IS 'Final ranking score: 0.6*relevance + 0.25*trust + 0.15*freshness';

-- ============================================================================
-- DEBUG VIEW: vw_opportunity_rank_debug
-- ============================================================================

CREATE OR REPLACE VIEW vw_opportunity_rank_debug AS
SELECT
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
  trending_score,
  impressions,
  clicks,
  ctr,
  
  -- Individual components with weights applied
  relevance_score AS relevance_raw,
  (relevance_score * 0.60) AS relevance_weighted,
  
  trust_weighted_score AS trust_raw,
  (trust_weighted_score * 0.25) AS trust_weighted,
  
  freshness_weighted_score AS freshness_raw,
  (freshness_weighted_score * 0.15) AS freshness_weighted,
  
  -- Final score
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

COMMENT ON VIEW vw_opportunity_rank_debug IS 'Debug view showing ranking components and weights for A/B analysis';

-- ============================================================================
-- REFRESH FUNCTION
-- ============================================================================

-- Function to refresh the materialized view concurrently
CREATE OR REPLACE FUNCTION refresh_opportunity_rank_view()
RETURNS void AS $$
BEGIN
  -- Use CONCURRENTLY to avoid locking the view during refresh
  -- This allows queries to continue using the old data while refreshing
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_opportunity_rank;
  
  -- Log the refresh
  RAISE NOTICE 'Refreshed mv_opportunity_rank at %', NOW();
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION refresh_opportunity_rank_view() IS 'Refreshes the opportunity ranking materialized view concurrently';

-- ============================================================================
-- INITIAL REFRESH
-- ============================================================================

-- Perform initial refresh to populate the view
REFRESH MATERIALIZED VIEW mv_opportunity_rank;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant SELECT on the materialized view to authenticated and anonymous users
GRANT SELECT ON mv_opportunity_rank TO authenticated, anon;
GRANT SELECT ON vw_opportunity_rank_debug TO authenticated, anon;
GRANT SELECT ON opportunity_trending_scores TO authenticated, anon;

-- Only service role can refresh the view
REVOKE ALL ON FUNCTION refresh_opportunity_rank_view() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION refresh_opportunity_rank_view() TO service_role;

