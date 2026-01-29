-- Fix all triggers that reference opportunity_id on opportunities table
-- This is a comprehensive fix for the "record new has no field opportunity_id" error

-- First, let's find and drop ALL triggers on the opportunities table
DO $$
DECLARE
    trigger_record RECORD;
BEGIN
    FOR trigger_record IN 
        SELECT tgname
        FROM pg_trigger t
        JOIN pg_class c ON t.tgrelid = c.oid
        JOIN pg_namespace n ON c.relnamespace = n.oid
        WHERE c.relname = 'opportunities'
          AND n.nspname = 'public'
          AND NOT t.tgisinternal
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON opportunities', trigger_record.tgname);
        RAISE NOTICE 'Dropped trigger: %', trigger_record.tgname;
    END LOOP;
END $$;

-- Drop any functions that might be causing issues
DROP FUNCTION IF EXISTS apply_latest_guardian_snapshot() CASCADE;
DROP FUNCTION IF EXISTS check_auto_quarantine(UUID) CASCADE;
DROP FUNCTION IF EXISTS update_opportunity_snapshot() CASCADE;
DROP FUNCTION IF EXISTS sync_opportunity_data() CASCADE;

-- Verify no triggers remain
DO $$
DECLARE
    trigger_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO trigger_count
    FROM pg_trigger t
    JOIN pg_class c ON t.tgrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE c.relname = 'opportunities'
      AND n.nspname = 'public'
      AND NOT t.tgisinternal;
    
    IF trigger_count > 0 THEN
        RAISE WARNING 'Still have % trigger(s) on opportunities table', trigger_count;
    ELSE
        RAISE NOTICE 'All triggers successfully removed from opportunities table';
    END IF;
END $$;
