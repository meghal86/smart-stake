-- Manual verification script for Hunter Screen migration
-- Run this in Supabase SQL Editor or via psql

-- ============================================================================
-- 1. Check Enums
-- ============================================================================
SELECT 'Checking Enums...' as step;

SELECT typname as enum_name, 'EXISTS' as status
FROM pg_type 
WHERE typname IN ('opportunity_type', 'reward_unit', 'opportunity_status', 'urgency_type')
ORDER BY typname;

-- ============================================================================
-- 2. Check Tables
-- ============================================================================
SELECT 'Checking Tables...' as step;

SELECT table_name, table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'opportunities', 
  'guardian_scans', 
  'eligibility_cache',
  'user_preferences', 
  'saved_opportunities', 
  'completed_opportunities',
  'analytics_events'
)
ORDER BY table_name;

-- ============================================================================
-- 3. Check Opportunities Table Columns
-- ============================================================================
SELECT 'Checking Opportunities Columns...' as step;

SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'opportunities' 
AND column_name IN (
  'status', 'trust_level', 'trust_score', 'urgency',
  'dedupe_key', 'source', 'protocol_name', 'sponsored',
  'published_at', 'expires_at'
)
ORDER BY column_name;

-- ============================================================================
-- 4. Check Guardian Scans (should be TABLE not VIEW)
-- ============================================================================
SELECT 'Checking Guardian Scans Type...' as step;

SELECT 
  table_name,
  table_type,
  CASE 
    WHEN table_type = 'BASE TABLE' THEN '✅ Correct (TABLE)'
    WHEN table_type = 'VIEW' THEN '❌ Wrong (still VIEW)'
    ELSE table_type
  END as verification
FROM information_schema.tables 
WHERE table_name = 'guardian_scans';

-- ============================================================================
-- 5. Check Indexes
-- ============================================================================
SELECT 'Checking Indexes...' as step;

SELECT 
  schemaname,
  tablename,
  indexname,
  '✅' as status
FROM pg_indexes 
WHERE tablename IN ('opportunities', 'guardian_scans', 'saved_opportunities', 'completed_opportunities')
AND indexname LIKE '%hunter%' OR indexname LIKE '%opps%' OR indexname LIKE '%guardian%' OR indexname LIKE '%saved%' OR indexname LIKE '%completed%'
ORDER BY tablename, indexname;

-- Show key indexes
SELECT indexname, tablename
FROM pg_indexes 
WHERE tablename = 'opportunities'
AND (
  indexname LIKE '%status%' 
  OR indexname LIKE '%trust%'
  OR indexname LIKE '%dedupe%'
)
ORDER BY indexname;

-- ============================================================================
-- 6. Check Triggers
-- ============================================================================
SELECT 'Checking Triggers...' as step;

SELECT 
  trigger_name,
  event_object_table as table_name,
  action_timing,
  event_manipulation,
  '✅' as status
FROM information_schema.triggers 
WHERE trigger_name = 'trg_guardian_snapshot';

-- ============================================================================
-- 7. Check Functions
-- ============================================================================
SELECT 'Checking Functions...' as step;

SELECT 
  routine_name as function_name,
  routine_type,
  '✅' as status
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('apply_latest_guardian_snapshot', 'upsert_opportunity')
ORDER BY routine_name;

-- ============================================================================
-- 8. Check RLS Policies
-- ============================================================================
SELECT 'Checking RLS Policies...' as step;

SELECT 
  schemaname,
  tablename,
  policyname,
  '✅' as status
FROM pg_policies 
WHERE tablename IN ('saved_opportunities', 'completed_opportunities', 'analytics_events')
ORDER BY tablename, policyname;

-- ============================================================================
-- 9. Summary Count
-- ============================================================================
SELECT 'Summary...' as step;

SELECT 
  'Enums' as category,
  COUNT(*) as count
FROM pg_type 
WHERE typname IN ('opportunity_type', 'reward_unit', 'opportunity_status', 'urgency_type')

UNION ALL

SELECT 
  'Tables' as category,
  COUNT(*) as count
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'opportunities', 'guardian_scans', 'eligibility_cache',
  'user_preferences', 'saved_opportunities', 'completed_opportunities', 'analytics_events'
)

UNION ALL

SELECT 
  'Triggers' as category,
  COUNT(*) as count
FROM information_schema.triggers 
WHERE trigger_name = 'trg_guardian_snapshot'

UNION ALL

SELECT 
  'Functions' as category,
  COUNT(*) as count
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('apply_latest_guardian_snapshot', 'upsert_opportunity');

-- ============================================================================
-- 10. Test Data (Optional - Insert and Verify Trigger)
-- ============================================================================
SELECT 'Testing Trigger (Optional)...' as step;

-- Uncomment to test:
/*
-- Insert test opportunity
INSERT INTO opportunities (
  slug, title, protocol_name, type, chains, dedupe_key, source, status
) VALUES (
  'test-validation', 'Test Opportunity', 'Test Protocol', 
  'airdrop', ARRAY['ethereum'], 'test:validation:001', 'internal', 'published'
) RETURNING id;

-- Insert guardian scan (should trigger trust_score update)
-- Replace <opportunity_id> with the ID from above
INSERT INTO guardian_scans (
  opportunity_id, score, level, scanned_at
) VALUES (
  '<opportunity_id>', 85, 'green', NOW()
);

-- Verify trigger worked
SELECT id, slug, trust_score, trust_level 
FROM opportunities 
WHERE slug = 'test-validation';
-- Should show trust_score = 85, trust_level = 'green'

-- Cleanup
DELETE FROM opportunities WHERE slug = 'test-validation';
*/
