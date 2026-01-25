-- Run this SQL in your Supabase SQL Editor to fix the trigger issue
-- Go to: https://supabase.com/dashboard/project/rebeznxivaxgserswhbn/sql/new

-- Drop guardian snapshot trigger if it exists
DROP TRIGGER IF EXISTS trg_guardian_snapshot ON guardian_scans;
DROP FUNCTION IF EXISTS apply_latest_guardian_snapshot();

-- Drop auto quarantine trigger if it exists  
DROP TRIGGER IF EXISTS trg_auto_quarantine_check ON report_events;
DROP FUNCTION IF EXISTS check_auto_quarantine(UUID);

-- Verify no triggers remain on opportunities table
SELECT 
  tgname AS trigger_name,
  pg_get_triggerdef(t.oid) AS trigger_definition
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
WHERE c.relname = 'opportunities'
AND NOT t.tgisinternal;
