-- Hunter Screen Enhancements Migration
-- This migration enhances the existing opportunities table and adds new tables
-- for the AlphaWhale Hunter Screen (Feed) feature
-- 
-- NOTE: This assumes the base opportunities table exists from 20251023000100_hunter_tables.sql

-- ============================================================================
-- ENUMS (Create if not exists)
-- ============================================================================

-- Opportunity types (extend existing if needed)
DO $$ BEGIN
  CREATE TYPE opportunity_type AS ENUM (
    'airdrop',
    'quest',
    'staking',
    'yield',
    'points',
    'loyalty',
    'testnet'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Reward units
DO $$ BEGIN
  CREATE TYPE reward_unit AS ENUM (
    'TOKEN',
    'USD',
    'APR',
    'APY',
    'POINTS',
    'NFT'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Opportunity status
DO $$ BEGIN
  CREATE TYPE opportunity_status AS ENUM (
    'draft',
    'published',
    'expired',
    'flagged',
    'quarantined'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Urgency types
DO $$ BEGIN
  CREATE TYPE urgency_type AS ENUM (
    'ending_soon',
    'new',
    'hot'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- ALTER EXISTING OPPORTUNITIES TABLE
-- ============================================================================

-- Add missing columns to opportunities table
ALTER TABLE opportunities 
  ADD COLUMN IF NOT EXISTS protocol_name TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS external_url TEXT,
  ADD COLUMN IF NOT EXISTS dedupe_key TEXT,
  ADD COLUMN IF NOT EXISTS source TEXT CHECK (source IN ('partner', 'internal', 'aggregator')),
  ADD COLUMN IF NOT EXISTS status opportunity_status DEFAULT 'published',
  ADD COLUMN IF NOT EXISTS trust_level TEXT CHECK (trust_level IN ('green', 'amber', 'red')),
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS sponsored BOOLEAN DEFAULT FALSE;

-- Update protocol_name from protocol if exists
UPDATE opportunities SET protocol_name = protocol WHERE protocol_name IS NULL AND protocol IS NOT NULL;

-- Set default values for new columns
UPDATE opportunities SET status = 'published' WHERE status IS NULL;
UPDATE opportunities SET source = 'internal' WHERE source IS NULL;
UPDATE opportunities SET dedupe_key = slug || ':' || type WHERE dedupe_key IS NULL;

-- Make required columns NOT NULL after setting defaults
ALTER TABLE opportunities 
  ALTER COLUMN protocol_name SET NOT NULL,
  ALTER COLUMN dedupe_key SET NOT NULL,
  ALTER COLUMN source SET NOT NULL;

-- Add unique constraint on dedupe_key
ALTER TABLE opportunities ADD CONSTRAINT opportunities_dedupe_key_unique UNIQUE (dedupe_key);

-- Update trust_level based on trust_score
UPDATE opportunities 
SET trust_level = CASE 
  WHEN trust_score >= 80 THEN 'green'
  WHEN trust_score >= 60 THEN 'amber'
  ELSE 'red'
END
WHERE trust_level IS NULL;

-- ============================================================================
-- NEW TABLES
-- ============================================================================

-- Guardian scans table (security scanning results)
-- Note: Drop the view first if it exists (from 20251022000001_guardian_tables.sql)
DROP VIEW IF EXISTS guardian_scans CASCADE;

CREATE TABLE IF NOT EXISTS guardian_scans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  level TEXT NOT NULL CHECK (level IN ('green', 'amber', 'red')),
  issues JSONB DEFAULT '[]',
  scanned_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(opportunity_id, scanned_at)
);

-- Update eligibility_cache if it exists, or create it
DO $$ 
BEGIN
  -- Check if eligibility_cache exists and has the old structure
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'eligibility_cache') THEN
    -- Add new columns if they don't exist
    ALTER TABLE eligibility_cache 
      ADD COLUMN IF NOT EXISTS status TEXT CHECK (status IN ('likely', 'maybe', 'unlikely', 'unknown')),
      ADD COLUMN IF NOT EXISTS score NUMERIC CHECK (score >= 0 AND score <= 1),
      ADD COLUMN IF NOT EXISTS reasons JSONB DEFAULT '[]',
      ADD COLUMN IF NOT EXISTS cached_at TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
    
    -- Update status from eligible boolean if needed
    UPDATE eligibility_cache 
    SET status = CASE WHEN eligible THEN 'likely' ELSE 'unlikely' END
    WHERE status IS NULL AND eligible IS NOT NULL;
    
    -- Set timestamps
    UPDATE eligibility_cache 
    SET cached_at = created_at, expires_at = created_at + interval '60 minutes'
    WHERE cached_at IS NULL;
  ELSE
    -- Create new table
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
  END IF;
END $$;

-- User preferences table - Add Hunter-specific columns if they don't exist
-- Note: user_preferences table already exists from multiple migrations
DO $$ 
BEGIN
  -- Add Hunter-specific preference columns
  ALTER TABLE user_preferences 
    ADD COLUMN IF NOT EXISTS preferred_chains TEXT[],
    ADD COLUMN IF NOT EXISTS trust_tolerance INTEGER DEFAULT 60,
    ADD COLUMN IF NOT EXISTS time_budget TEXT CHECK (time_budget IN ('easy_first', 'any')),
    ADD COLUMN IF NOT EXISTS show_risky_consent BOOLEAN DEFAULT FALSE;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'Could not add columns to user_preferences: %', SQLERRM;
END $$;

-- Saved opportunities table
CREATE TABLE IF NOT EXISTS saved_opportunities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
  saved_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, opportunity_id)
);

-- Completed opportunities table
CREATE TABLE IF NOT EXISTS completed_opportunities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, opportunity_id)
);

-- Analytics events table - Add Hunter-specific columns if they don't exist
-- Note: analytics_events table already exists from 20250122000013_analytics_system.sql
DO $$ 
BEGIN
  -- Add Hunter-specific analytics columns
  ALTER TABLE analytics_events 
    ADD COLUMN IF NOT EXISTS event_type TEXT,
    ADD COLUMN IF NOT EXISTS user_id_hash TEXT,
    ADD COLUMN IF NOT EXISTS opportunity_id UUID REFERENCES opportunities(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
  
  -- Create index on event_type if it doesn't exist
  CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events(event_type, created_at DESC) 
    WHERE event_type IS NOT NULL;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'Could not add columns to analytics_events: %', SQLERRM;
END $$;

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Multicolumn indexes as specified in task
CREATE INDEX IF NOT EXISTS idx_opportunities_status_published ON opportunities(status, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_opportunities_trust_expires ON opportunities(trust_level, expires_at);

-- Optimized partial indexes for feed queries
CREATE INDEX IF NOT EXISTS idx_opps_published_green ON opportunities(published_at DESC) 
  WHERE status='published' AND trust_level='green';
CREATE INDEX IF NOT EXISTS idx_opps_status_trust_urgency ON opportunities(status, trust_level, urgency);
CREATE INDEX IF NOT EXISTS idx_opps_trust_published ON opportunities(trust_level, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_opportunities_dedupe ON opportunities(dedupe_key);
CREATE INDEX IF NOT EXISTS idx_opportunities_published ON opportunities(published_at DESC) WHERE published_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_opportunities_expires ON opportunities(expires_at) WHERE expires_at IS NOT NULL;

-- Guardian scans indexes
CREATE INDEX IF NOT EXISTS idx_guardian_scans_opportunity ON guardian_scans(opportunity_id, scanned_at DESC);
CREATE INDEX IF NOT EXISTS idx_guardian_scans_level ON guardian_scans(level);

-- Eligibility cache indexes
CREATE INDEX IF NOT EXISTS idx_eligibility_cache_lookup ON eligibility_cache(opportunity_id, wallet_address, expires_at);

-- Saved opportunities indexes
CREATE INDEX IF NOT EXISTS idx_saved_opportunities_user ON saved_opportunities(user_id, saved_at DESC);

-- Completed opportunities indexes
CREATE INDEX IF NOT EXISTS idx_completed_opportunities_user ON completed_opportunities(user_id, completed_at DESC);

-- Analytics events indexes (created in table alteration above)

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
DROP TRIGGER IF EXISTS trg_guardian_snapshot ON guardian_scans;
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
    p_payload->>'type',
    ARRAY(SELECT jsonb_array_elements_text(p_payload->'chains')),
    (p_payload->>'reward_min')::NUMERIC,
    (p_payload->>'reward_max')::NUMERIC,
    p_payload->>'reward_currency',
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

DROP POLICY IF EXISTS p_ins_saved ON saved_opportunities;
CREATE POLICY p_ins_saved ON saved_opportunities
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS p_sel_saved ON saved_opportunities;
CREATE POLICY p_sel_saved ON saved_opportunities
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS p_del_saved ON saved_opportunities;
CREATE POLICY p_del_saved ON saved_opportunities
  FOR DELETE USING (auth.uid() = user_id);

-- Completed opportunities RLS
ALTER TABLE completed_opportunities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS p_rw_completed ON completed_opportunities;
CREATE POLICY p_rw_completed ON completed_opportunities
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Analytics events RLS (already has policies from 20250122000013_analytics_system.sql)
-- Add additional policy for Hunter events if needed
DO $$
BEGIN
  -- Allow anonymous users to insert Hunter analytics events
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'analytics_events' 
    AND policyname = 'p_ins_hunter_analytics'
  ) THEN
    CREATE POLICY p_ins_hunter_analytics ON analytics_events
      FOR INSERT WITH CHECK (event_type IS NOT NULL);
  END IF;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'Could not create analytics policy: %', SQLERRM;
END $$;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE opportunities IS 'Main opportunities feed table with Guardian trust scores (enhanced)';
COMMENT ON TABLE guardian_scans IS 'Security scan results from Guardian system';
COMMENT ON TABLE eligibility_cache IS 'Cached wallet eligibility calculations (60 min TTL)';
COMMENT ON TABLE saved_opportunities IS 'User-saved opportunities for later review';
COMMENT ON TABLE completed_opportunities IS 'Opportunities completed by users';

COMMENT ON COLUMN analytics_events.event_type IS 'Hunter-specific event type (added for Hunter Screen feature)';
COMMENT ON COLUMN analytics_events.opportunity_id IS 'Reference to opportunity for Hunter events';
COMMENT ON COLUMN analytics_events.user_id_hash IS 'Hashed user identifier for privacy (Hunter events)';

COMMENT ON COLUMN opportunities.dedupe_key IS 'Deduplication key: {protocol_slug}:{type}:{campaign_id}:{chain}';
COMMENT ON COLUMN opportunities.source IS 'Data source precedence: partner > internal > aggregator';
COMMENT ON COLUMN opportunities.trust_score IS 'Denormalized from latest Guardian scan (0-100)';
COMMENT ON COLUMN opportunities.trust_level IS 'Denormalized trust level: green (≥80), amber (60-79), red (<60)';

COMMENT ON FUNCTION apply_latest_guardian_snapshot() IS 'Trigger function to update opportunity trust scores on new Guardian scans';
COMMENT ON FUNCTION upsert_opportunity(TEXT, TEXT, TEXT, JSONB) IS 'Upsert opportunity with source precedence logic';
