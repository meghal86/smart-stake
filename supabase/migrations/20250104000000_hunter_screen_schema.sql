-- Hunter Screen Database Schema Migration
-- This migration creates all tables, enums, indexes, triggers, and functions
-- required for the AlphaWhale Hunter Screen (Feed) feature

-- ============================================================================
-- ENUMS
-- ============================================================================

-- Opportunity types
CREATE TYPE opportunity_type AS ENUM (
  'airdrop',
  'quest',
  'staking',
  'yield',
  'points',
  'loyalty',
  'testnet'
);

-- Reward units
CREATE TYPE reward_unit AS ENUM (
  'TOKEN',
  'USD',
  'APR',
  'APY',
  'POINTS',
  'NFT'
);

-- Opportunity status
CREATE TYPE opportunity_status AS ENUM (
  'draft',
  'published',
  'expired',
  'flagged',
  'quarantined'
);

-- Urgency types
CREATE TYPE urgency_type AS ENUM (
  'ending_soon',
  'new',
  'hot'
);

-- ============================================================================
-- TABLES
-- ============================================================================

-- Opportunities table (main feed data)
CREATE TABLE opportunities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  protocol_name TEXT NOT NULL,
  protocol_logo TEXT,
  type opportunity_type NOT NULL,
  chains TEXT[] NOT NULL,
  reward_min NUMERIC,
  reward_max NUMERIC,
  reward_currency reward_unit,
  reward_confidence TEXT CHECK (reward_confidence IN ('estimated', 'confirmed')),
  apr NUMERIC,
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'advanced')),
  featured BOOLEAN DEFAULT FALSE,
  sponsored BOOLEAN DEFAULT FALSE,
  time_left_sec INTEGER,
  external_url TEXT,
  dedupe_key TEXT UNIQUE NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('partner', 'internal', 'aggregator')),
  status opportunity_status NOT NULL DEFAULT 'published',
  urgency urgency_type,
  trust_score INTEGER CHECK (trust_score >= 0 AND trust_score <= 100),
  trust_level TEXT CHECK (trust_level IN ('green', 'amber', 'red')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ
);

-- Guardian scans table (security scanning results)
CREATE TABLE guardian_scans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  level TEXT NOT NULL CHECK (level IN ('green', 'amber', 'red')),
  issues JSONB DEFAULT '[]',
  scanned_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(opportunity_id, scanned_at)
);

-- Eligibility cache table (wallet eligibility calculations)
CREATE TABLE eligibility_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('likely', 'maybe', 'unlikely', 'unknown')),
  score NUMERIC CHECK (score >= 0 AND score <= 1),
  reasons JSONB DEFAULT '[]',
  cached_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  UNIQUE(opportunity_id, wallet_address)
);

-- User preferences table
CREATE TABLE user_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  preferred_chains TEXT[],
  trust_tolerance INTEGER DEFAULT 60,
  time_budget TEXT CHECK (time_budget IN ('easy_first', 'any')),
  show_risky_consent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Saved opportunities table
CREATE TABLE saved_opportunities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
  saved_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, opportunity_id)
);

-- Completed opportunities table
CREATE TABLE completed_opportunities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, opportunity_id)
);

-- Analytics events table
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type TEXT NOT NULL,
  user_id_hash TEXT,
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Basic indexes for opportunities table
CREATE INDEX idx_opportunities_type ON opportunities(type);
CREATE INDEX idx_opportunities_chains ON opportunities USING GIN(chains);
CREATE INDEX idx_opportunities_published ON opportunities(published_at DESC) WHERE published_at IS NOT NULL;
CREATE INDEX idx_opportunities_expires ON opportunities(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX idx_opportunities_dedupe ON opportunities(dedupe_key);

-- Multicolumn indexes as specified in task
CREATE INDEX idx_opportunities_status_published ON opportunities(status, published_at DESC);
CREATE INDEX idx_opportunities_trust_expires ON opportunities(trust_level, expires_at);

-- Optimized partial indexes for feed queries
CREATE INDEX idx_opps_published_green ON opportunities(published_at DESC) 
  WHERE status='published' AND trust_level='green';
CREATE INDEX idx_opps_status_trust_urgency ON opportunities(status, trust_level, urgency);
CREATE INDEX idx_opps_featured ON opportunities(featured) WHERE featured=true;
CREATE INDEX idx_opps_trust_published ON opportunities(trust_level, published_at DESC);

-- Guardian scans indexes
CREATE INDEX idx_guardian_scans_opportunity ON guardian_scans(opportunity_id, scanned_at DESC);
CREATE INDEX idx_guardian_scans_level ON guardian_scans(level);

-- Eligibility cache indexes
CREATE INDEX idx_eligibility_cache_lookup ON eligibility_cache(opportunity_id, wallet_address, expires_at);

-- Saved opportunities indexes
CREATE INDEX idx_saved_opportunities_user ON saved_opportunities(user_id, saved_at DESC);

-- Completed opportunities indexes
CREATE INDEX idx_completed_opportunities_user ON completed_opportunities(user_id, completed_at DESC);

-- Analytics events indexes
CREATE INDEX idx_analytics_events_type ON analytics_events(event_type, created_at DESC);

-- ============================================================================
-- TRIGGERS AND FUNCTIONS
-- ============================================================================

-- Trigger function to keep trust snapshot fresh on new Guardian scans
CREATE OR REPLACE FUNCTION apply_latest_guardian_snapshot()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE opportunities
    SET trust_score = NEW.score,
        trust_level = NEW.level,
        updated_at  = NOW()
  WHERE id = NEW.opportunity_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER trg_guardian_snapshot
AFTER INSERT ON guardian_scans
FOR EACH ROW EXECUTE PROCEDURE apply_latest_guardian_snapshot();

-- Function for deterministic opportunity upsert with source precedence
CREATE OR REPLACE FUNCTION upsert_opportunity(
  p_slug TEXT,
  p_source TEXT,
  p_dedupe_key TEXT,
  p_payload JSONB
) RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO opportunities (
    slug, source, dedupe_key, title, protocol_name, protocol_logo,
    type, chains, reward_min, reward_max, reward_currency, reward_confidence,
    apr, difficulty, featured, sponsored, external_url, published_at, expires_at
  )
  VALUES (
    p_slug,
    p_source,
    p_dedupe_key,
    p_payload->>'title',
    p_payload->>'protocol_name',
    p_payload->>'protocol_logo',
    (p_payload->>'type')::opportunity_type,
    ARRAY(SELECT jsonb_array_elements_text(p_payload->'chains')),
    (p_payload->>'reward_min')::NUMERIC,
    (p_payload->>'reward_max')::NUMERIC,
    (p_payload->>'reward_currency')::reward_unit,
    p_payload->>'reward_confidence',
    (p_payload->>'apr')::NUMERIC,
    p_payload->>'difficulty',
    COALESCE((p_payload->>'featured')::BOOLEAN, FALSE),
    COALESCE((p_payload->>'sponsored')::BOOLEAN, FALSE),
    p_payload->>'external_url',
    (p_payload->>'published_at')::TIMESTAMPTZ,
    (p_payload->>'expires_at')::TIMESTAMPTZ
  )
  ON CONFLICT (dedupe_key) DO UPDATE
  SET
    -- Precedence: Partner > Internal > Aggregator
    title = CASE
      WHEN EXCLUDED.source='partner' OR (opportunities.source='aggregator' AND EXCLUDED.source='internal')
      THEN EXCLUDED.title ELSE opportunities.title END,
    protocol_logo = COALESCE(EXCLUDED.protocol_logo, opportunities.protocol_logo),
    reward_min = COALESCE(EXCLUDED.reward_min, opportunities.reward_min),
    reward_max = COALESCE(EXCLUDED.reward_max, opportunities.reward_max),
    reward_currency = COALESCE(EXCLUDED.reward_currency, opportunities.reward_currency),
    apr = COALESCE(EXCLUDED.apr, opportunities.apr),
    updated_at = NOW()
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Saved opportunities RLS
ALTER TABLE saved_opportunities ENABLE ROW LEVEL SECURITY;

CREATE POLICY p_ins_saved ON saved_opportunities
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY p_sel_saved ON saved_opportunities
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY p_del_saved ON saved_opportunities
  FOR DELETE USING (auth.uid() = user_id);

-- Completed opportunities RLS
ALTER TABLE completed_opportunities ENABLE ROW LEVEL SECURITY;

CREATE POLICY p_rw_completed ON completed_opportunities
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Analytics events RLS (write-only, no read from client)
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY p_ins_analytics ON analytics_events
  FOR INSERT WITH CHECK (true);

-- Revoke SELECT on analytics_events from anon and authenticated users
REVOKE SELECT ON analytics_events FROM anon, authenticated;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE opportunities IS 'Main opportunities feed table with Guardian trust scores';
COMMENT ON TABLE guardian_scans IS 'Security scan results from Guardian system';
COMMENT ON TABLE eligibility_cache IS 'Cached wallet eligibility calculations (60 min TTL)';
COMMENT ON TABLE user_preferences IS 'User preferences for feed personalization';
COMMENT ON TABLE saved_opportunities IS 'User-saved opportunities for later review';
COMMENT ON TABLE completed_opportunities IS 'Opportunities completed by users';
COMMENT ON TABLE analytics_events IS 'Analytics events (write-only, wallet addresses hashed)';

COMMENT ON COLUMN opportunities.dedupe_key IS 'Deduplication key: {protocol_slug}:{type}:{campaign_id}:{chain}';
COMMENT ON COLUMN opportunities.source IS 'Data source precedence: partner > internal > aggregator';
COMMENT ON COLUMN opportunities.trust_score IS 'Denormalized from latest Guardian scan (0-100)';
COMMENT ON COLUMN opportunities.trust_level IS 'Denormalized trust level: green (≥80), amber (60-79), red (<60)';

COMMENT ON FUNCTION apply_latest_guardian_snapshot() IS 'Trigger function to update opportunity trust scores on new Guardian scans';
COMMENT ON FUNCTION upsert_opportunity(TEXT, TEXT, TEXT, JSONB) IS 'Upsert opportunity with source precedence logic';
