-- ============================================================================
-- Web Push Notifications Database Schema
-- Migration: 20260111000001_web_push_subscriptions.sql
-- 
-- This migration creates the database schema for web push notifications
-- for the Authenticated Decision Cockpit feature.
--
-- Tables created:
--   1. web_push_subscriptions - Browser push notification registrations
--
-- Requirements: 17.5 (web_push_subscriptions table)
-- ============================================================================

-- ============================================================================
-- 1. WEB_PUSH_SUBSCRIPTIONS TABLE
-- Manages browser push notification registrations
-- Requirements: 17.5
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.web_push_subscriptions (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, endpoint)
);
ALTER TABLE public.notification_logs
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS endpoint text,
  ADD COLUMN IF NOT EXISTS success boolean,
  ADD COLUMN IF NOT EXISTS payload jsonb;
-- Add comment for documentation
COMMENT ON TABLE public.web_push_subscriptions IS 'Browser push notification registrations for cockpit notifications';
COMMENT ON COLUMN public.web_push_subscriptions.endpoint IS 'Push service endpoint URL';
COMMENT ON COLUMN public.web_push_subscriptions.p256dh IS 'P256DH key for encryption';
COMMENT ON COLUMN public.web_push_subscriptions.auth IS 'Auth secret for encryption';

-- Enable Row Level Security
ALTER TABLE public.web_push_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own subscriptions
-- SELECT policy
CREATE POLICY "push_sub_select_own" 
  ON public.web_push_subscriptions 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- INSERT policy
CREATE POLICY "push_sub_insert_own" 
  ON public.web_push_subscriptions 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- DELETE policy (for unsubscribe)
CREATE POLICY "push_sub_delete_own" 
  ON public.web_push_subscriptions 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- ============================================================================
-- 2. GRANTS
-- ============================================================================

-- Grant table access to authenticated users (RLS will enforce row-level access)
GRANT SELECT, INSERT, DELETE ON public.web_push_subscriptions TO authenticated;

-- Grant table access to service role (for admin operations and notification sending)
GRANT ALL ON public.web_push_subscriptions TO service_role;

-- Grant sequence access for BIGSERIAL primary key
GRANT USAGE, SELECT ON SEQUENCE public.web_push_subscriptions_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.web_push_subscriptions_id_seq TO service_role;