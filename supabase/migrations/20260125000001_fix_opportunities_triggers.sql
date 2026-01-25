-- Fix opportunities table triggers that reference non-existent opportunity_id column
-- This migration drops any triggers that were created from disabled migrations

-- Drop guardian snapshot trigger if it exists (references NEW.opportunity_id incorrectly)
DROP TRIGGER IF EXISTS trg_guardian_snapshot ON guardian_scans;
DROP FUNCTION IF EXISTS apply_latest_guardian_snapshot();

-- Drop any other problematic triggers on opportunities table
DROP TRIGGER IF EXISTS trg_auto_quarantine_check ON report_events;
DROP FUNCTION IF EXISTS check_auto_quarantine(UUID);

-- Note: These triggers were from disabled migrations and should not have been applied
-- If they are needed in the future, they should be updated to use the correct column names
