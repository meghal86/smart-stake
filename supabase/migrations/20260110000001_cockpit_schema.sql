-- ============================================================================
-- Authenticated Decision Cockpit Database Schema
-- Migration: 20260110000001_cockpit_schema.sql
-- 
-- This migration creates the database schema for the Authenticated Decision 
-- Cockpit feature at /cockpit route.
--
-- Tables created:
--   1. cockpit_state - User session state and preferences
--   2. daily_pulse - Timezone-aware daily digests
--   3. shown_actions - Duplicate detection for action preview
--
-- Requirements: 17.1, 17.2, 17.7
-- ============================================================================

-- ============================================================================
-- 1. COCKPIT_STATE TABLE
-- Tracks user session state and preferences for the cockpit
-- Requirements: 17.1 (home_state equivalent for cockpit)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.cockpit_state (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  last_opened_at TIMESTAMPTZ,
  last_pulse_viewed_date DATE,
  -- prefs JSONB stores:
  --   wallet_scope_default: "active" | "all"
  --   timezone: IANA timezone string (e.g., "America/Chicago")
  --   dnd_start_local: "HH:MM" format
  --   dnd_end_local: "HH:MM" format
  --   notif_cap_per_day: integer 0-10
  prefs JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add comment for documentation
COMMENT ON TABLE public.cockpit_state IS 'User session state and preferences for the authenticated decision cockpit';
COMMENT ON COLUMN public.cockpit_state.prefs IS 'JSONB preferences: wallet_scope_default, timezone (IANA), dnd_start_local, dnd_end_local, notif_cap_per_day';

-- Enable Row Level Security
ALTER TABLE public.cockpit_state ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own data
-- SELECT policy
CREATE POLICY "cockpit_state_select_own" 
  ON public.cockpit_state 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- INSERT policy (for upsert path - first open creates row)
CREATE POLICY "cockpit_state_insert_own" 
  ON public.cockpit_state 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- UPDATE policy (for upsert path - later updates)
CREATE POLICY "cockpit_state_update_own" 
  ON public.cockpit_state 
  FOR UPDATE 
  USING (auth.uid() = user_id) 
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 2. DAILY_PULSE TABLE
-- Stores timezone-aware daily digests per user
-- Requirements: 17.2
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.daily_pulse (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pulse_date DATE NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, pulse_date)
);

-- Add comment for documentation
COMMENT ON TABLE public.daily_pulse IS 'Timezone-aware daily pulse digests for the cockpit';

-- Index for efficient queries by user and date (descending for recent first)
CREATE INDEX IF NOT EXISTS idx_daily_pulse_user_date 
  ON public.daily_pulse (user_id, pulse_date DESC);

-- Enable Row Level Security
ALTER TABLE public.daily_pulse ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own data
-- SELECT policy
CREATE POLICY "daily_pulse_select_own" 
  ON public.daily_pulse 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- INSERT policy (for upsert path)
CREATE POLICY "daily_pulse_insert_own" 
  ON public.daily_pulse 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- UPDATE policy (for upsert path)
CREATE POLICY "daily_pulse_update_own" 
  ON public.daily_pulse 
  FOR UPDATE 
  USING (auth.uid() = user_id) 
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 3. SHOWN_ACTIONS TABLE
-- Tracks which actions have been shown to users for duplicate detection
-- Requirements: Duplicate Detection (Locked)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.shown_actions (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dedupe_key TEXT NOT NULL,
  shown_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Unique constraint for upsert semantics
  UNIQUE (user_id, dedupe_key)
);

-- Add comment for documentation
COMMENT ON TABLE public.shown_actions IS 'Tracks shown actions for duplicate detection in cockpit action preview';
COMMENT ON COLUMN public.shown_actions.dedupe_key IS 'Format: source.kind:source.ref_id:cta.kind';

-- Index for efficient queries by user and time (for TTL cleanup and recent lookups)
CREATE INDEX IF NOT EXISTS idx_shown_actions_user_shown_at 
  ON public.shown_actions (user_id, shown_at DESC);

-- Index for TTL cleanup queries (simple index on shown_at for efficient deletion)
-- The cleanup function will filter by timestamp at query time
CREATE INDEX IF NOT EXISTS idx_shown_actions_shown_at 
  ON public.shown_actions (shown_at);

-- Enable Row Level Security
ALTER TABLE public.shown_actions ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own data
-- SELECT policy
CREATE POLICY "shown_actions_select_own" 
  ON public.shown_actions 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- INSERT policy
CREATE POLICY "shown_actions_insert_own" 
  ON public.shown_actions 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- UPDATE policy (for upsert refresh of shown_at)
CREATE POLICY "shown_actions_update_own" 
  ON public.shown_actions 
  FOR UPDATE 
  USING (auth.uid() = user_id) 
  WITH CHECK (auth.uid() = user_id);

-- DELETE policy (for TTL cleanup)
CREATE POLICY "shown_actions_delete_own" 
  ON public.shown_actions 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- ============================================================================
-- 4. HELPER FUNCTIONS
-- ============================================================================

-- Function to upsert shown_actions with refresh semantics (Locked)
-- Only refreshes shown_at if the existing row is older than 30 seconds
-- This prevents re-render spam from updating the timestamp too frequently
CREATE OR REPLACE FUNCTION public.upsert_shown_action(
  p_user_id UUID,
  p_dedupe_key TEXT
) RETURNS VOID AS $$
BEGIN
  INSERT INTO public.shown_actions (user_id, dedupe_key, shown_at)
  VALUES (p_user_id, p_dedupe_key, now())
  ON CONFLICT (user_id, dedupe_key)
  DO UPDATE SET shown_at = excluded.shown_at
  WHERE shown_actions.shown_at < now() - interval '30 seconds';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.upsert_shown_action(UUID, TEXT) TO authenticated;

-- Function to check if an action was shown recently (within 2 hours)
-- Returns true if the action should receive a duplicate penalty
CREATE OR REPLACE FUNCTION public.is_action_recently_shown(
  p_user_id UUID,
  p_dedupe_key TEXT
) RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.shown_actions 
    WHERE user_id = p_user_id 
      AND dedupe_key = p_dedupe_key 
      AND shown_at > now() - interval '2 hours'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.is_action_recently_shown(UUID, TEXT) TO authenticated;

-- Function to cleanup old shown_actions (TTL: 2 hours)
-- This should be called by a scheduled job
CREATE OR REPLACE FUNCTION public.cleanup_old_shown_actions() RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.shown_actions
  WHERE shown_at < now() - interval '2 hours';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to service role only (for scheduled jobs)
GRANT EXECUTE ON FUNCTION public.cleanup_old_shown_actions() TO service_role;

-- ============================================================================
-- 5. TRIGGERS
-- ============================================================================

-- Trigger to update updated_at on cockpit_state changes
CREATE OR REPLACE FUNCTION public.update_cockpit_state_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cockpit_state_updated_at_trigger
  BEFORE UPDATE ON public.cockpit_state
  FOR EACH ROW
  EXECUTE FUNCTION public.update_cockpit_state_updated_at();

-- ============================================================================
-- 6. GRANTS
-- ============================================================================

-- Grant table access to authenticated users (RLS will enforce row-level access)
GRANT SELECT, INSERT, UPDATE ON public.cockpit_state TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.daily_pulse TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shown_actions TO authenticated;

-- Grant table access to service role (for admin operations)
GRANT ALL ON public.cockpit_state TO service_role;
GRANT ALL ON public.daily_pulse TO service_role;
GRANT ALL ON public.shown_actions TO service_role;
