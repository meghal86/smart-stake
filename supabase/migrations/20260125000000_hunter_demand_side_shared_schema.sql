-- Hunter Demand-Side: Shared Schema Extensions
-- Phase 0: Shared Foundations
-- Requirements: 3.1-3.7

-- ============================================================================
-- 1. Extend opportunities table with demand-side columns
-- ============================================================================

-- Add source tracking columns (if not exists)
ALTER TABLE public.opportunities
ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ;

-- Add unique constraint on (source, source_ref) if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'opportunities_source_ref_unique'
  ) THEN
    ALTER TABLE public.opportunities 
    ADD CONSTRAINT opportunities_source_ref_unique 
    UNIQUE (source, source_ref);
  END IF;
END $$;

-- ============================================================================
-- 2. Extend eligibility_cache table with scoring columns
-- ============================================================================

-- Add eligibility status and score columns
ALTER TABLE public.eligibility_cache
ADD COLUMN IF NOT EXISTS eligibility_status TEXT CHECK (eligibility_status IN ('likely', 'maybe', 'unlikely')),
ADD COLUMN IF NOT EXISTS eligibility_score NUMERIC(3,2) CHECK (eligibility_score >= 0 AND eligibility_score <= 1);

-- Rename 'eligible' column to 'is_eligible' for clarity (if exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public'
    AND table_name = 'eligibility_cache' 
    AND column_name = 'eligible'
  ) THEN
    ALTER TABLE public.eligibility_cache RENAME COLUMN eligible TO is_eligible;
  END IF;
END $$;

-- Add composite index for fast lookups (wallet_address, opportunity_id)
CREATE INDEX IF NOT EXISTS idx_eligibility_wallet_opp 
ON public.eligibility_cache (wallet_address, opportunity_id);

-- Add index on created_at for TTL queries
CREATE INDEX IF NOT EXISTS idx_eligibility_created_at
ON public.eligibility_cache (created_at);

-- ============================================================================
-- 3. Create user_history view for relevance scoring
-- ============================================================================

-- Drop view if exists (for idempotency)
DROP VIEW IF EXISTS public.user_history;

-- Create view aggregating user behavior for relevance scoring
CREATE OR REPLACE VIEW public.user_history AS
SELECT 
  uo.user_id,
  -- Aggregate saved tags from completed opportunities
  ARRAY_AGG(DISTINCT t.tag) FILTER (WHERE t.tag IS NOT NULL) AS saved_tags,
  -- Most frequently completed opportunity type
  MODE() WITHIN GROUP (ORDER BY o.type) AS most_completed_type,
  -- Total completed count
  COUNT(DISTINCT uo.opportunity_id) AS completed_count
FROM public.user_opportunities uo
JOIN public.opportunities o ON uo.opportunity_id = o.id
CROSS JOIN LATERAL unnest(o.tags) AS t(tag)
WHERE uo.status = 'completed'
GROUP BY uo.user_id;

-- Grant read access to authenticated users
GRANT SELECT ON public.user_history TO authenticated;

-- ============================================================================
-- 4. Add module-specific columns to opportunities table
-- ============================================================================

-- Yield/Staking columns
ALTER TABLE public.opportunities
ADD COLUMN IF NOT EXISTS underlying_assets TEXT[],
ADD COLUMN IF NOT EXISTS lockup_days INTEGER;

-- Airdrop columns
ALTER TABLE public.opportunities
ADD COLUMN IF NOT EXISTS snapshot_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS claim_start TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS claim_end TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS airdrop_category TEXT;

-- Quest columns
ALTER TABLE public.opportunities
ADD COLUMN IF NOT EXISTS quest_steps JSONB,
ADD COLUMN IF NOT EXISTS quest_difficulty TEXT CHECK (quest_difficulty IN ('easy', 'medium', 'hard')),
ADD COLUMN IF NOT EXISTS xp_reward INTEGER,
ADD COLUMN IF NOT EXISTS quest_type TEXT;

-- Points columns
ALTER TABLE public.opportunities
ADD COLUMN IF NOT EXISTS points_program_name TEXT,
ADD COLUMN IF NOT EXISTS conversion_hint TEXT,
ADD COLUMN IF NOT EXISTS points_estimate_formula TEXT;

-- RWA columns
ALTER TABLE public.opportunities
ADD COLUMN IF NOT EXISTS issuer_name TEXT,
ADD COLUMN IF NOT EXISTS jurisdiction TEXT,
ADD COLUMN IF NOT EXISTS kyc_required BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS min_investment NUMERIC,
ADD COLUMN IF NOT EXISTS liquidity_term_days INTEGER,
ADD COLUMN IF NOT EXISTS rwa_type TEXT;

-- Update type constraint to include new types
ALTER TABLE public.opportunities DROP CONSTRAINT IF EXISTS opportunities_type_check;
ALTER TABLE public.opportunities 
ADD CONSTRAINT opportunities_type_check 
CHECK (type IN ('airdrop', 'quest', 'staking', 'yield', 'points', 'rwa', 'strategy'));

-- ============================================================================
-- 5. Create module-specific tables
-- ============================================================================

-- User Yield Positions
CREATE TABLE IF NOT EXISTS public.user_yield_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  opportunity_id UUID REFERENCES public.opportunities(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  amount_deposited NUMERIC,
  current_value NUMERIC,
  apy_at_deposit NUMERIC,
  deposited_at TIMESTAMPTZ DEFAULT NOW(),
  withdrawn_at TIMESTAMPTZ,
  UNIQUE (user_id, opportunity_id, wallet_address)
);

-- User Airdrop Status
CREATE TABLE IF NOT EXISTS public.user_airdrop_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  opportunity_id UUID REFERENCES public.opportunities(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  status TEXT CHECK (status IN ('eligible', 'maybe', 'unlikely', 'claimed', 'missed', 'expired')) NOT NULL,
  claim_amount NUMERIC,
  claimed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, opportunity_id, wallet_address)
);

-- User Quest Progress
CREATE TABLE IF NOT EXISTS public.user_quest_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  opportunity_id UUID REFERENCES public.opportunities(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  current_step INTEGER DEFAULT 0,
  completed_steps JSONB DEFAULT '[]'::JSONB,
  xp_earned INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  UNIQUE (user_id, opportunity_id, wallet_address)
);

-- User Points Status
CREATE TABLE IF NOT EXISTS public.user_points_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  opportunity_id UUID REFERENCES public.opportunities(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  points_earned INTEGER DEFAULT 0,
  estimated_value_usd NUMERIC,
  last_updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, opportunity_id, wallet_address)
);

-- User RWA Positions
CREATE TABLE IF NOT EXISTS public.user_rwa_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  opportunity_id UUID REFERENCES public.opportunities(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  amount_invested NUMERIC,
  current_value NUMERIC,
  kyc_completed BOOLEAN DEFAULT FALSE,
  invested_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, opportunity_id, wallet_address)
);

-- Strategies
CREATE TABLE IF NOT EXISTS public.strategies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- Strategy Subscriptions
CREATE TABLE IF NOT EXISTS public.strategy_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  strategy_id UUID REFERENCES public.strategies(id) ON DELETE CASCADE,
  subscribed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, strategy_id)
);

-- Referral Profiles
CREATE TABLE IF NOT EXISTS public.referral_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  referral_code TEXT UNIQUE NOT NULL,
  total_referrals INTEGER DEFAULT 0,
  total_rewards NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Referrals
CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  activated_at TIMESTAMPTZ,
  reward_amount NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (referrer_id, referred_user_id)
);

-- Referral Rewards
CREATE TABLE IF NOT EXISTS public.referral_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_id UUID REFERENCES public.referrals(id) ON DELETE CASCADE,
  reward_type TEXT NOT NULL,
  reward_amount NUMERIC NOT NULL,
  claimed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 6. Enable RLS on new tables
-- ============================================================================

-- User Yield Positions
ALTER TABLE public.user_yield_positions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_yield_positions_owner_all" ON public.user_yield_positions
FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- User Airdrop Status
ALTER TABLE public.user_airdrop_status ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_airdrop_status_owner_all" ON public.user_airdrop_status
FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- User Quest Progress
ALTER TABLE public.user_quest_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_quest_progress_owner_all" ON public.user_quest_progress
FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- User Points Status
ALTER TABLE public.user_points_status ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_points_status_owner_all" ON public.user_points_status
FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- User RWA Positions
ALTER TABLE public.user_rwa_positions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_rwa_positions_owner_all" ON public.user_rwa_positions
FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Strategies (public read, creator write)
ALTER TABLE public.strategies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "strategies_public_read" ON public.strategies
FOR SELECT USING (true);
CREATE POLICY "strategies_creator_write" ON public.strategies
FOR ALL USING (auth.uid() = creator_id) WITH CHECK (auth.uid() = creator_id);

-- Strategy Subscriptions
ALTER TABLE public.strategy_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "strategy_subscriptions_owner_all" ON public.strategy_subscriptions
FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Referral Profiles
ALTER TABLE public.referral_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "referral_profiles_owner_all" ON public.referral_profiles
FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Referrals (referrer can read their referrals)
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "referrals_referrer_read" ON public.referrals
FOR SELECT USING (auth.uid() = referrer_id);
CREATE POLICY "referrals_service_insert" ON public.referrals
FOR INSERT WITH CHECK (true);

-- Referral Rewards
ALTER TABLE public.referral_rewards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "referral_rewards_referrer_read" ON public.referral_rewards
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.referrals r
    WHERE r.id = referral_id AND r.referrer_id = auth.uid()
  )
);

-- ============================================================================
-- 7. Create indexes for performance
-- ============================================================================

-- Opportunities indexes
CREATE INDEX IF NOT EXISTS idx_opportunities_source_ref ON public.opportunities (source, source_ref);
CREATE INDEX IF NOT EXISTS idx_opportunities_last_synced ON public.opportunities (last_synced_at);

-- Module-specific indexes
CREATE INDEX IF NOT EXISTS idx_user_yield_positions_user ON public.user_yield_positions (user_id);
CREATE INDEX IF NOT EXISTS idx_user_airdrop_status_user ON public.user_airdrop_status (user_id);
CREATE INDEX IF NOT EXISTS idx_user_quest_progress_user ON public.user_quest_progress (user_id);
CREATE INDEX IF NOT EXISTS idx_user_points_status_user ON public.user_points_status (user_id);
CREATE INDEX IF NOT EXISTS idx_user_rwa_positions_user ON public.user_rwa_positions (user_id);
CREATE INDEX IF NOT EXISTS idx_strategies_creator ON public.strategies (creator_id);
CREATE INDEX IF NOT EXISTS idx_strategy_subscriptions_user ON public.strategy_subscriptions (user_id);
CREATE INDEX IF NOT EXISTS idx_referral_profiles_code ON public.referral_profiles (referral_code);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON public.referrals (referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred ON public.referrals (referred_user_id);

-- ============================================================================
-- Migration complete
-- ============================================================================
