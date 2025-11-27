-- Step 1: Check if HarvestPro tables exist
-- Run this FIRST to see if you need to run the migration

SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'harvest_lots')
    THEN '✅ harvest_lots table exists'
    ELSE '❌ harvest_lots table MISSING - Run migration first!'
  END as harvest_lots_status,
  
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'harvest_opportunities')
    THEN '✅ harvest_opportunities table exists'
    ELSE '❌ harvest_opportunities table MISSING - Run migration first!'
  END as harvest_opportunities_status,
  
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'harvest_sessions')
    THEN '✅ harvest_sessions table exists'
    ELSE '❌ harvest_sessions table MISSING - Run migration first!'
  END as harvest_sessions_status;

-- If you see ❌ marks, you need to run the migration first:
-- Copy/paste the contents of: supabase/migrations/20250201000000_harvestpro_schema.sql
