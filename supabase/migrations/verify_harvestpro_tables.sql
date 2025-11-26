-- ============================================================================
-- HarvestPro Schema Verification Script
-- Checks that all 11 required tables exist with correct structure
-- ============================================================================

-- Check if all 11 tables exist
SELECT 
  table_name,
  CASE 
    WHEN table_name IN (
      'harvest_lots',
      'harvest_opportunities', 
      'harvest_sessions',
      'execution_steps',
      'harvest_user_settings',
      'wallet_transactions',
      'cex_accounts',
      'cex_trades',
      'harvest_sync_status',
      'approval_requests',
      'sanctions_screening_logs'
    ) THEN '✅ EXISTS'
    ELSE '❌ UNEXPECTED'
  END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND (
    table_name LIKE 'harvest_%' 
    OR table_name IN ('approval_requests', 'sanctions_screening_logs', 'cex_accounts', 'cex_trades', 'wallet_transactions', 'execution_steps')
  )
ORDER BY table_name;

-- Count total HarvestPro tables
SELECT 
  COUNT(*) as total_tables,
  CASE 
    WHEN COUNT(*) = 11 THEN '✅ ALL 11 TABLES PRESENT'
    ELSE '❌ MISSING TABLES (Expected: 11, Found: ' || COUNT(*) || ')'
  END as verification_status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'harvest_lots',
    'harvest_opportunities', 
    'harvest_sessions',
    'execution_steps',
    'harvest_user_settings',
    'wallet_transactions',
    'cex_accounts',
    'cex_trades',
    'harvest_sync_status',
    'approval_requests',
    'sanctions_screening_logs'
  );

-- Verify RLS is enabled on all tables
SELECT 
  tablename,
  rowsecurity as rls_enabled,
  CASE 
    WHEN rowsecurity = true THEN '✅ RLS ENABLED'
    ELSE '❌ RLS DISABLED'
  END as rls_status
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN (
    'harvest_lots',
    'harvest_opportunities', 
    'harvest_sessions',
    'execution_steps',
    'harvest_user_settings',
    'wallet_transactions',
    'cex_accounts',
    'cex_trades',
    'harvest_sync_status',
    'approval_requests',
    'sanctions_screening_logs'
  )
ORDER BY tablename;

-- Count indexes
SELECT 
  COUNT(*) as total_indexes,
  CASE 
    WHEN COUNT(*) >= 30 THEN '✅ SUFFICIENT INDEXES (Expected: 30+, Found: ' || COUNT(*) || ')'
    ELSE '⚠️ FEW INDEXES (Expected: 30+, Found: ' || COUNT(*) || ')'
  END as index_status
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND (
    tablename LIKE 'harvest_%' 
    OR tablename IN ('approval_requests', 'sanctions_screening_logs', 'cex_accounts', 'cex_trades', 'wallet_transactions', 'execution_steps')
  );

-- List all indexes
SELECT 
  tablename,
  indexname,
  indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND (
    tablename LIKE 'harvest_%' 
    OR tablename IN ('approval_requests', 'sanctions_screening_logs', 'cex_accounts', 'cex_trades', 'wallet_transactions', 'execution_steps')
  )
ORDER BY tablename, indexname;

-- Verify foreign key constraints
SELECT
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
  AND (
    tc.table_name LIKE 'harvest_%' 
    OR tc.table_name IN ('approval_requests', 'sanctions_screening_logs', 'cex_accounts', 'cex_trades', 'wallet_transactions', 'execution_steps')
  )
ORDER BY tc.table_name, tc.constraint_name;

-- Summary report
SELECT 
  '=== HARVESTPRO SCHEMA VERIFICATION SUMMARY ===' as report_section
UNION ALL
SELECT 
  'Total Tables: ' || COUNT(*) || ' (Expected: 11)'
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'harvest_lots',
    'harvest_opportunities', 
    'harvest_sessions',
    'execution_steps',
    'harvest_user_settings',
    'wallet_transactions',
    'cex_accounts',
    'cex_trades',
    'harvest_sync_status',
    'approval_requests',
    'sanctions_screening_logs'
  )
UNION ALL
SELECT 
  'RLS Enabled: ' || COUNT(*) || ' tables'
FROM pg_tables 
WHERE schemaname = 'public' 
  AND rowsecurity = true
  AND tablename IN (
    'harvest_lots',
    'harvest_opportunities', 
    'harvest_sessions',
    'execution_steps',
    'harvest_user_settings',
    'wallet_transactions',
    'cex_accounts',
    'cex_trades',
    'harvest_sync_status',
    'approval_requests',
    'sanctions_screening_logs'
  )
UNION ALL
SELECT 
  'Total Indexes: ' || COUNT(*) || ' (Expected: 30+)'
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND (
    tablename LIKE 'harvest_%' 
    OR tablename IN ('approval_requests', 'sanctions_screening_logs', 'cex_accounts', 'cex_trades', 'wallet_transactions', 'execution_steps')
  )
UNION ALL
SELECT 
  'Foreign Keys: ' || COUNT(*) || ' constraints'
FROM information_schema.table_constraints 
WHERE constraint_type = 'FOREIGN KEY'
  AND table_schema = 'public'
  AND (
    table_name LIKE 'harvest_%' 
    OR table_name IN ('approval_requests', 'sanctions_screening_logs', 'cex_accounts', 'cex_trades', 'wallet_transactions', 'execution_steps')
  );
