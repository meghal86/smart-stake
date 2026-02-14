-- ============================================================================
-- PORTFOLIO CLEANUP SCHEDULED JOBS
-- ============================================================================
-- This migration sets up scheduled jobs for:
-- 1. Cleaning up expired simulation receipts (every 5 minutes)
-- 2. Cleaning up old portfolio snapshots (daily at 3 AM UTC)
--
-- Requirements: R8.6 - Cleanup Job
-- ============================================================================

-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ============================================================================
-- 1. CLEANUP EXPIRED SIMULATION RECEIPTS
-- ============================================================================
-- Runs every 5 minutes to delete expired simulation receipts
-- This prevents TOCTOU attacks by ensuring stale receipts are removed promptly
-- ============================================================================

SELECT cron.schedule(
  'portfolio-cleanup-expired-receipts',
  '*/5 * * * *',  -- Every 5 minutes
  $$
  SELECT cleanup_expired_simulation_receipts();
  $$
);

-- ============================================================================
-- 2. CLEANUP OLD PORTFOLIO SNAPSHOTS
-- ============================================================================
-- Runs daily at 3 AM UTC to keep only the last 10 snapshots per scope
-- This prevents unbounded growth of snapshot history
-- ============================================================================

SELECT cron.schedule(
  'portfolio-cleanup-old-snapshots',
  '0 3 * * *',  -- Daily at 3 AM UTC
  $$
  SELECT cleanup_old_portfolio_snapshots(10);
  $$
);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- To verify the scheduled jobs are created, run:
-- SELECT * FROM cron.job WHERE jobname LIKE 'portfolio-%';
--
-- To manually trigger the jobs for testing:
-- SELECT cleanup_expired_simulation_receipts();
-- SELECT cleanup_old_portfolio_snapshots(10);
--
-- To check job execution history:
-- SELECT * FROM cron.job_run_details WHERE jobid IN (
--   SELECT jobid FROM cron.job WHERE jobname LIKE 'portfolio-%'
-- ) ORDER BY start_time DESC LIMIT 10;
-- ============================================================================

-- Add comments for documentation
COMMENT ON EXTENSION pg_cron IS 'PostgreSQL job scheduler for running periodic tasks';

-- Log the successful creation of scheduled jobs
DO $$
BEGIN
  RAISE NOTICE 'Portfolio cleanup scheduled jobs created successfully:';
  RAISE NOTICE '  - portfolio-cleanup-expired-receipts: Every 5 minutes';
  RAISE NOTICE '  - portfolio-cleanup-old-snapshots: Daily at 3 AM UTC';
END $$;
