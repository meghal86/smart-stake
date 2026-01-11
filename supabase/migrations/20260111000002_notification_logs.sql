-- ============================================================================
-- Notification Logs Database Schema
-- Migration: 20260111000002_notification_logs.sql
-- 
-- This migration creates the notification_logs table to track sent notifications
-- for daily caps enforcement and analytics.
--
-- Tables created:
--   1. notification_logs - Track sent notifications for caps enforcement
--
-- Requirements: 13.6 (daily caps enforcement)
-- ============================================================================

-- ============================================================================
-- 1. NOTIFICATION_LOGS TABLE
-- Tracks sent notifications for daily caps enforcement
-- Requirements: 13.6
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.notification_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('critical', 'daily_pulse', 'expiring_soon')),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  endpoint TEXT NOT NULL, -- Which subscription endpoint received it
  success BOOLEAN NOT NULL DEFAULT true,
  error_message TEXT,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Additional metadata
  payload JSONB, -- Full notification payload for debugging
  user_timezone TEXT -- User's timezone when notification was sent
);

-- Add comment for documentation
COMMENT ON TABLE public.notification_logs IS 'Tracks sent web push notifications for daily caps enforcement and analytics';
COMMENT ON COLUMN public.notification_logs.category IS 'Notification category: critical, daily_pulse, expiring_soon';
COMMENT ON COLUMN public.notification_logs.endpoint IS 'Push subscription endpoint that received the notification';
COMMENT ON COLUMN public.notification_logs.success IS 'Whether the notification was successfully sent';
COMMENT ON COLUMN public.notification_logs.payload IS 'Full notification payload for debugging and analytics';

-- Indexes for efficient queries
-- Index for daily caps checking (user + category + recent time)
CREATE INDEX IF NOT EXISTS idx_notification_logs_user_category_sent 
  ON public.notification_logs (user_id, category, sent_at DESC);

-- Index for user's recent notifications (for total daily cap)
CREATE INDEX IF NOT EXISTS idx_notification_logs_user_sent 
  ON public.notification_logs (user_id, sent_at DESC);

-- Index for cleanup of old logs (optional - for data retention)
CREATE INDEX IF NOT EXISTS idx_notification_logs_sent_at 
  ON public.notification_logs (sent_at);

-- Enable Row Level Security
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only see their own notification logs
-- SELECT policy (for analytics/debugging)
CREATE POLICY "notification_logs_select_own" 
  ON public.notification_logs 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- INSERT policy (service role only - notifications are sent server-side)
-- Users should not be able to insert their own notification logs
CREATE POLICY "notification_logs_insert_service" 
  ON public.notification_logs 
  FOR INSERT 
  WITH CHECK (false); -- Deny all user inserts

-- Allow service role to insert
CREATE POLICY "notification_logs_insert_service_role" 
  ON public.notification_logs 
  FOR INSERT 
  TO service_role
  WITH CHECK (true);

-- ============================================================================
-- 2. HELPER FUNCTIONS
-- ============================================================================

-- Function to get notification counts for daily caps checking
CREATE OR REPLACE FUNCTION public.get_notification_counts(
  p_user_id UUID,
  p_hours_back INTEGER DEFAULT 24
) RETURNS TABLE(
  total_count BIGINT,
  critical_count BIGINT,
  daily_pulse_count BIGINT,
  expiring_soon_count BIGINT
) AS $
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_count,
    COUNT(*) FILTER (WHERE category = 'critical') as critical_count,
    COUNT(*) FILTER (WHERE category = 'daily_pulse') as daily_pulse_count,
    COUNT(*) FILTER (WHERE category = 'expiring_soon') as expiring_soon_count
  FROM public.notification_logs
  WHERE user_id = p_user_id
    AND success = true
    AND sent_at > now() - (p_hours_back || ' hours')::interval;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to service role (for Edge Functions)
GRANT EXECUTE ON FUNCTION public.get_notification_counts(UUID, INTEGER) TO service_role;

-- Function to log a sent notification
CREATE OR REPLACE FUNCTION public.log_notification(
  p_user_id UUID,
  p_category TEXT,
  p_title TEXT,
  p_body TEXT,
  p_endpoint TEXT,
  p_success BOOLEAN DEFAULT true,
  p_error_message TEXT DEFAULT NULL,
  p_payload JSONB DEFAULT NULL,
  p_user_timezone TEXT DEFAULT NULL
) RETURNS BIGINT AS $
DECLARE
  log_id BIGINT;
BEGIN
  INSERT INTO public.notification_logs (
    user_id, category, title, body, endpoint, success, 
    error_message, payload, user_timezone
  ) VALUES (
    p_user_id, p_category, p_title, p_body, p_endpoint, p_success,
    p_error_message, p_payload, p_user_timezone
  ) RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to service role (for Edge Functions)
GRANT EXECUTE ON FUNCTION public.log_notification(UUID, TEXT, TEXT, TEXT, TEXT, BOOLEAN, TEXT, JSONB, TEXT) TO service_role;

-- Function to cleanup old notification logs (for data retention)
-- Keeps logs for 30 days by default
CREATE OR REPLACE FUNCTION public.cleanup_old_notification_logs(
  p_days_to_keep INTEGER DEFAULT 30
) RETURNS INTEGER AS $
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.notification_logs
  WHERE sent_at < now() - (p_days_to_keep || ' days')::interval;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to service role only (for scheduled cleanup jobs)
GRANT EXECUTE ON FUNCTION public.cleanup_old_notification_logs(INTEGER) TO service_role;

-- ============================================================================
-- 3. GRANTS
-- ============================================================================

-- Grant table access to authenticated users (RLS will enforce row-level access)
-- Users can only SELECT their own logs (for debugging/analytics)
GRANT SELECT ON public.notification_logs TO authenticated;

-- Grant table access to service role (for notification sending and cleanup)
GRANT ALL ON public.notification_logs TO service_role;

-- Grant sequence access for BIGSERIAL primary key
GRANT USAGE, SELECT ON SEQUENCE public.notification_logs_id_seq TO service_role;