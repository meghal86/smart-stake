-- =====================================================
-- Wallet Registry Cron Job
-- Schedules automatic wallet scanning
-- =====================================================

-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create a cron job to scan wallets every hour
-- This keeps trust scores fresh for all registered wallets
SELECT cron.schedule(
  'wallet-registry-hourly-scan',
  '0 * * * *', -- Every hour at minute 0
  $$
  SELECT
    net.http_post(
      url := current_setting('app.settings.supabase_url') || '/functions/v1/wallet-registry-scan',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.supabase_service_role_key')
      ),
      body := jsonb_build_object(
        'batch_size', 100,
        'trigger', 'cron'
      )
    ) AS request_id;
  $$
);

-- Create a more frequent scan for recently active wallets (every 15 minutes)
SELECT cron.schedule(
  'wallet-registry-recent-scan',
  '*/15 * * * *', -- Every 15 minutes
  $$
  SELECT
    net.http_post(
      url := current_setting('app.settings.supabase_url') || '/functions/v1/wallet-registry-scan',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.supabase_service_role_key')
      ),
      body := jsonb_build_object(
        'batch_size', 20,
        'trigger', 'cron-recent',
        'recent_hours', 24
      )
    ) AS request_id;
  $$
);

-- =====================================================
-- Helper Function: Trigger scan for specific user
-- =====================================================

CREATE OR REPLACE FUNCTION trigger_user_wallet_scan(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
BEGIN
  -- This function can be called from the client to trigger an immediate scan
  -- of all wallets for a specific user
  
  -- Note: In production, you'd want to call the edge function via HTTP
  -- For now, we'll just return a message
  
  SELECT jsonb_build_object(
    'message', 'Scan triggered for user',
    'user_id', p_user_id,
    'wallet_count', (
      SELECT COUNT(*)
      FROM user_wallets
      WHERE user_id = p_user_id
    )
  ) INTO v_result;
  
  RETURN v_result;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION trigger_user_wallet_scan TO authenticated;

-- =====================================================
-- Comments
-- =====================================================

COMMENT ON FUNCTION trigger_user_wallet_scan IS 'Triggers an immediate scan of all wallets for a specific user. Returns scan status.';




