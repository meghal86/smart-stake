-- Check database state for opportunities table

-- 1. Check if opportunities table exists
SELECT 
  'Table exists: ' || CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'opportunities'
  ) THEN 'YES' ELSE 'NO' END AS table_status;

-- 2. Check columns in opportunities table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'opportunities'
ORDER BY ordinal_position;

-- 3. Check for triggers on opportunities table
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'public'
  AND event_object_table = 'opportunities'
ORDER BY trigger_name;

-- 4. Check for functions that might reference opportunity_id
SELECT 
  routine_name,
  routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_definition LIKE '%opportunity_id%'
ORDER BY routine_name;

-- 5. Count existing opportunities
SELECT 
  type,
  source,
  COUNT(*) as count
FROM opportunities
GROUP BY type, source
ORDER BY type, source;
