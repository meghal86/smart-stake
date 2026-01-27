-- Diagnose and Fix Database Trigger Issue
-- Run this SQL in Supabase SQL Editor: https://supabase.com/dashboard/project/rebeznxivaxgserswhbn/sql/new

-- ============================================================================
-- STEP 1: DIAGNOSE - Check current trigger configuration
-- ============================================================================

-- Check if trigger exists and which table it's attached to
SELECT 
  tgname AS trigger_name,
  tgrelid::regclass AS table_name,
  tgenabled AS enabled,
  pg_get_triggerdef(oid) AS trigger_definition
FROM pg_trigger
WHERE tgname = 'trg_guardian_snapshot'
AND NOT tgisinternal;

-- Check if the function exists
SELECT 
  proname AS function_name,
  pg_get_functiondef(oid) AS function_definition
FROM pg_proc
WHERE proname = 'apply_latest_guardian_snapshot';

-- Check what triggers exist on opportunities table
SELECT 
  tgname AS trigger_name,
  pg_get_triggerdef(t.oid) AS trigger_definition
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
WHERE c.relname = 'opportunities'
AND NOT t.tgisinternal;

-- ============================================================================
-- STEP 2: FIX - Drop and recreate trigger correctly
-- ============================================================================

-- Drop trigger from both tables (in case it's on wrong table)
DROP TRIGGER IF EXISTS trg_guardian_snapshot ON opportunities;
DROP TRIGGER IF EXISTS trg_guardian_snapshot ON guardian_scans;

-- Drop the function
DROP FUNCTION IF EXISTS apply_latest_guardian_snapshot();

-- Recreate function (this is the CORRECT version)
CREATE OR REPLACE FUNCTION apply_latest_guardian_snapshot()
RETURNS TRIGGER AS $$
BEGIN
  -- Update opportunities table with latest Guardian scan results
  UPDATE opportunities
  SET 
    trust_score = NEW.score,
    trust_level = NEW.level,
    updated_at = NOW()
  WHERE id = NEW.opportunity_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on guardian_scans table (CORRECT table)
CREATE TRIGGER trg_guardian_snapshot
AFTER INSERT ON guardian_scans
FOR EACH ROW 
EXECUTE FUNCTION apply_latest_guardian_snapshot();

-- ============================================================================
-- STEP 3: VERIFY - Confirm fix worked
-- ============================================================================

-- Should show trigger on guardian_scans table only
SELECT 
  tgname AS trigger_name,
  tgrelid::regclass AS table_name,
  tgenabled AS enabled
FROM pg_trigger
WHERE tgname = 'trg_guardian_snapshot'
AND NOT tgisinternal;

-- Should return no rows (no triggers on opportunities table)
SELECT 
  tgname AS trigger_name
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
WHERE c.relname = 'opportunities'
AND NOT t.tgisinternal;

-- ============================================================================
-- STEP 4: TEST - Insert test data to verify trigger works
-- ============================================================================

-- This should succeed without errors
DO $$
DECLARE
  test_opp_id UUID;
BEGIN
  -- Insert test opportunity
  INSERT INTO opportunities (
    slug,
    title,
    protocol_name,
    type,
    chains,
    dedupe_key,
    source,
    status,
    reward_currency
  ) VALUES (
    'test-trigger-fix',
    'Test Opportunity',
    'Test Protocol',
    'airdrop',
    ARRAY['ethereum'],
    'test:trigger:fix:' || gen_random_uuid()::text,
    'internal',
    'published',
    'USD'
  )
  RETURNING id INTO test_opp_id;
  
  RAISE NOTICE 'Created test opportunity: %', test_opp_id;
  
  -- Clean up test data
  DELETE FROM opportunities WHERE id = test_opp_id;
  
  RAISE NOTICE 'Test passed! Trigger issue is fixed.';
END $$;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

SELECT 'Trigger fix complete! You can now run: npm run seed:all' AS status;
