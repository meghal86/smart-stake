-- ============================================================================
-- Investment Primitives Database Schema
-- Migration: 20260110000002_investment_primitives.sql
-- 
-- This migration creates the database schema for Investment Primitives
-- functionality required by Task 7.1 and 7.2.
--
-- Tables created:
--   1. user_investments - Save/bookmark functionality and wallet roles
--   2. cockpit_alert_rules - Alert rules system (separate from existing alert_rules)
--
-- Requirements: 12.1, 12.3, 12.4, 12.5, 12.6, 17.3, 17.4
-- ============================================================================

-- ============================================================================
-- 1. USER_INVESTMENTS TABLE
-- Stores user save/bookmark actions and wallet role assignments
-- Requirements: 12.1, 12.4, 17.3
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.user_investments (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('save','bookmark','wallet_role')),
  ref_id TEXT NOT NULL,
  payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, kind, ref_id)
);

-- Add comment for documentation
COMMENT ON TABLE public.user_investments IS 'User save/bookmark actions and wallet role assignments for investment primitives';
COMMENT ON COLUMN public.user_investments.kind IS 'Investment type: save (affects ranking), bookmark (quick access), wallet_role (address role assignment)';
COMMENT ON COLUMN public.user_investments.ref_id IS 'Reference ID for the saved item (opportunity ID, finding ID, wallet address, etc.)';
COMMENT ON COLUMN public.user_investments.payload IS 'Additional metadata for the investment (tags, notes, role details, etc.)';

-- Index for efficient queries by user and kind
CREATE INDEX IF NOT EXISTS idx_user_investments_user_kind 
  ON public.user_investments (user_id, kind);

-- Index for efficient queries by user and created_at (for recent items)
CREATE INDEX IF NOT EXISTS idx_user_investments_user_created 
  ON public.user_investments (user_id, created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.user_investments ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own data
-- SELECT policy
CREATE POLICY "user_investments_select_own" 
  ON public.user_investments 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- INSERT policy
CREATE POLICY "user_investments_insert_own" 
  ON public.user_investments 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- UPDATE policy (for updating payload/metadata)
CREATE POLICY "user_investments_update_own" 
  ON public.user_investments 
  FOR UPDATE 
  USING (auth.uid() = user_id) 
  WITH CHECK (auth.uid() = user_id);

-- DELETE policy (for removing saved items)
CREATE POLICY "user_investments_delete_own" 
  ON public.user_investments 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- ============================================================================
-- 2. COCKPIT_ALERT_RULES TABLE
-- Stores user-defined alert rules for the cockpit system
-- Note: Using cockpit_alert_rules to avoid conflict with existing alert_rules table
-- Requirements: 12.3, 12.5, 17.4
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.cockpit_alert_rules (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rule JSONB NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add comment for documentation
COMMENT ON TABLE public.cockpit_alert_rules IS 'User-defined alert rules for the cockpit system';
COMMENT ON COLUMN public.cockpit_alert_rules.rule IS 'JSONB rule definition with conditions, thresholds, and notification preferences';

-- Index for efficient queries by user and enabled status
CREATE INDEX IF NOT EXISTS idx_cockpit_alert_rules_user_enabled 
  ON public.cockpit_alert_rules (user_id, is_enabled);

-- Index for efficient queries by user and created_at (for recent rules)
CREATE INDEX IF NOT EXISTS idx_cockpit_alert_rules_user_created 
  ON public.cockpit_alert_rules (user_id, created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.cockpit_alert_rules ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own data
-- SELECT policy
CREATE POLICY "cockpit_alert_rules_select_own" 
  ON public.cockpit_alert_rules 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- INSERT policy
CREATE POLICY "cockpit_alert_rules_insert_own" 
  ON public.cockpit_alert_rules 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- UPDATE policy
CREATE POLICY "cockpit_alert_rules_update_own" 
  ON public.cockpit_alert_rules 
  FOR UPDATE 
  USING (auth.uid() = user_id) 
  WITH CHECK (auth.uid() = user_id);

-- DELETE policy
CREATE POLICY "cockpit_alert_rules_delete_own" 
  ON public.cockpit_alert_rules 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- ============================================================================
-- 3. HELPER FUNCTIONS
-- ============================================================================

-- Function to get user's saved items for relevance scoring
-- Returns items that should affect action ranking
CREATE OR REPLACE FUNCTION public.get_user_relevance_items(
  p_user_id UUID
) RETURNS TABLE(
  kind TEXT,
  ref_id TEXT,
  payload JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $fn$
BEGIN
  RETURN QUERY
  SELECT 
    ui.kind,
    ui.ref_id,
    ui.payload
  FROM public.user_investments ui
  WHERE ui.user_id = p_user_id
    AND ui.kind IN ('save', 'wallet_role'); -- Only items that affect relevance
END;
$fn$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_relevance_items(UUID) TO authenticated;

-- Function to get user's active alert rules
-- Returns enabled alert rules for processing
-- Function to get user's active alert rules
CREATE OR REPLACE FUNCTION public.get_active_alert_rules(
  p_user_id UUID
) RETURNS TABLE(
  id BIGINT,
  rule JSONB,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $fn$
BEGIN
  RETURN QUERY
  SELECT 
    car.id,
    car.rule,
    car.created_at
  FROM public.cockpit_alert_rules car
  WHERE car.user_id = p_user_id
    AND car.is_enabled = true
  ORDER BY car.created_at DESC;
END;
$fn$;


-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_active_alert_rules(UUID) TO authenticated;

-- ============================================================================
-- 4. GRANTS
-- ============================================================================

-- Grant table access to authenticated users (RLS will enforce row-level access)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_investments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cockpit_alert_rules TO authenticated;

-- Grant sequence access for auto-incrementing IDs
GRANT USAGE, SELECT ON SEQUENCE public.user_investments_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.cockpit_alert_rules_id_seq TO authenticated;

-- Grant table access to service role (for admin operations)
GRANT ALL ON public.user_investments TO service_role;
GRANT ALL ON public.cockpit_alert_rules TO service_role;
GRANT ALL ON SEQUENCE public.user_investments_id_seq TO service_role;
GRANT ALL ON SEQUENCE public.cockpit_alert_rules_id_seq TO service_role;

</text>
</invoke>