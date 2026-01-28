-- Fix misplaced triggers on opportunities table
-- These triggers reference NEW.opportunity_id which doesn't exist on opportunities table
-- They should be on report_events and guardian_scans tables instead

-- ============================================
-- 1. Drop the misplaced trigger on opportunities table
-- ============================================
DROP TRIGGER IF EXISTS trg_check_auto_quarantine_after_ins_upd ON opportunities;

-- ============================================
-- 2. Recreate the trigger on the CORRECT table (report_events)
-- ============================================
-- The trigger should be on report_events, not opportunities
CREATE OR REPLACE TRIGGER trg_check_auto_quarantine_after_ins_upd
  AFTER INSERT OR UPDATE ON report_events
  FOR EACH ROW
  EXECUTE FUNCTION trg_check_auto_quarantine();

-- ============================================
-- 3. Drop the guardian snapshot trigger if it exists on opportunities
-- ============================================
DROP TRIGGER IF EXISTS trg_guardian_snapshot ON opportunities;

-- ============================================
-- 4. Recreate the guardian snapshot trigger on the CORRECT table (guardian_scans)
-- ============================================
-- The trigger should be on guardian_scans, not opportunities
CREATE OR REPLACE TRIGGER trg_guardian_snapshot
  AFTER INSERT OR UPDATE ON guardian_scans
  FOR EACH ROW
  EXECUTE FUNCTION apply_latest_guardian_snapshot();

-- ============================================
-- 5. Verify no triggers remain on opportunities table
-- ============================================
DO $$
DECLARE
    trigger_count INTEGER;
    trigger_names TEXT;
BEGIN
    SELECT COUNT(*), STRING_AGG(tgname, ', ')
    INTO trigger_count, trigger_names
    FROM pg_trigger t
    JOIN pg_class c ON t.tgrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE c.relname = 'opportunities'
      AND n.nspname = 'public'
      AND NOT t.tgisinternal;
    
    IF trigger_count > 0 THEN
        RAISE WARNING 'Still have % trigger(s) on opportunities table: %', trigger_count, trigger_names;
    ELSE
        RAISE NOTICE '✅ All triggers successfully removed from opportunities table';
    END IF;
END $$;

-- ============================================
-- 6. Verify triggers are on correct tables
-- ============================================
DO $$
BEGIN
    -- Check report_events trigger
    IF EXISTS (
        SELECT 1 FROM pg_trigger t
        JOIN pg_class c ON t.tgrelid = c.oid
        WHERE c.relname = 'report_events' 
        AND t.tgname = 'trg_check_auto_quarantine_after_ins_upd'
    ) THEN
        RAISE NOTICE '✅ Auto-quarantine trigger correctly placed on report_events table';
    ELSE
        RAISE WARNING '⚠️  Auto-quarantine trigger not found on report_events table';
    END IF;

    -- Check guardian_scans trigger
    IF EXISTS (
        SELECT 1 FROM pg_trigger t
        JOIN pg_class c ON t.tgrelid = c.oid
        WHERE c.relname = 'guardian_scans' 
        AND t.tgname = 'trg_guardian_snapshot'
    ) THEN
        RAISE NOTICE '✅ Guardian snapshot trigger correctly placed on guardian_scans table';
    ELSE
        RAISE NOTICE 'ℹ️  Guardian snapshot trigger not found (may not be needed yet)';
    END IF;
END $$;
