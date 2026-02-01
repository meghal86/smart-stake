-- Hunter Strategies Module Schema
-- Migration: Create strategies and strategy_subscriptions tables
-- Strategies are creator plays that link multiple opportunities together

-- Create strategies table
CREATE TABLE IF NOT EXISTS strategies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  creator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  steps JSONB NOT NULL, -- Array of opportunity IDs
  trust_score_cached INTEGER DEFAULT 80,
  steps_trust_breakdown JSONB, -- Array of per-step trust scores
  category TEXT[],
  tags TEXT[],
  featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create strategy_subscriptions table
CREATE TABLE IF NOT EXISTS strategy_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  strategy_id UUID REFERENCES strategies(id) ON DELETE CASCADE,
  subscribed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, strategy_id)
);

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_strategies_creator 
ON strategies (creator_id);

CREATE INDEX IF NOT EXISTS idx_strategies_featured 
ON strategies (featured) WHERE featured = TRUE;

CREATE INDEX IF NOT EXISTS idx_strategy_subscriptions_user 
ON strategy_subscriptions (user_id);

CREATE INDEX IF NOT EXISTS idx_strategy_subscriptions_strategy 
ON strategy_subscriptions (strategy_id);

-- Enable RLS on strategies
ALTER TABLE strategies ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Anyone can read strategies
CREATE POLICY p_strategies_read
ON strategies
FOR SELECT
USING (true);

-- RLS Policy: Only creator can update their strategies
CREATE POLICY p_strategies_update
ON strategies
FOR UPDATE
USING (auth.uid() = creator_id);

-- RLS Policy: Only creator can delete their strategies
CREATE POLICY p_strategies_delete
ON strategies
FOR DELETE
USING (auth.uid() = creator_id);

-- RLS Policy: Authenticated users can create strategies
CREATE POLICY p_strategies_insert
ON strategies
FOR INSERT
WITH CHECK (auth.uid() = creator_id);

-- Enable RLS on strategy_subscriptions
ALTER TABLE strategy_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see their own subscriptions
CREATE POLICY p_strategy_subscriptions_user
ON strategy_subscriptions
FOR ALL
USING (auth.uid() = user_id);

-- Add comments for documentation
COMMENT ON TABLE strategies IS 'Creator plays that link multiple opportunities together';
COMMENT ON COLUMN strategies.steps IS 'Array of opportunity IDs (JSONB array)';
COMMENT ON COLUMN strategies.trust_score_cached IS 'Computed trust score by aggregating Guardian scores';
COMMENT ON COLUMN strategies.steps_trust_breakdown IS 'Per-step trust scores (JSONB array)';
COMMENT ON TABLE strategy_subscriptions IS 'Tracks user subscriptions to strategies';
