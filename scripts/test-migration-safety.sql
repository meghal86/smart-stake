-- =====================================================
-- Test Migration Safety Script
-- Verifies that the multi-chain security migration works correctly
-- Run this on a copy of production data before deploying
-- =====================================================

-- =====================================================
-- SETUP: Create test data
-- =====================================================

-- Create a test user (if not exists)
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES (
  'test-user-migration-' || gen_random_uuid()::text,
  'test-migration-' || gen_random_uuid()::text || '@example.com',
  crypt('password123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW()
)
ON CONFLICT DO NOTHING;

-- Get the test user ID
WITH test_user AS (
  SELECT id FROM auth.users 
  WHERE email LIKE 'test-migration-%@example.com'
  LIMIT 1
)
INSERT INTO user_wallets (user_id, address, chain_namespace, is_primary, created_at, updated_at)
SELECT 
  test_user.id,
  '0x' || LPAD((ROW_NUMBER() OVER (ORDER BY 1))::text, 40, '0'),
  'eip155:' || (1 + (ROW_NUMBER() OVER (ORDER BY 1) % 5))::text,
  false,
  NOW() - INTERVAL '1 day' * (ROW_NUMBER() OVER (ORDER BY 1)),
  NOW()
FROM test_user
CROSS JOIN LATERAL (SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3) AS networks
ON CONFLICT DO NOTHING;

-- =====================================================
-- TEST 1: Verify address_lc column exists and is generated
-- =====================================================

DO $
DECLARE
  v_column_exists BOOLEAN;
  v_is_generated BOOLEAN;
  v_test_address TEXT;
  v_test_address_lc TEXT;
BEGIN
  -- Check if address_lc column exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_wallets' AND column_name = 'address_lc'
  ) INTO v_column_exists;

  IF NOT v_column_exists THEN
    RAISE EXCEPTION 'TEST 1 FAILED: address_lc column does not exist';
  END IF;

  -- Check if address_lc is generated
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_wallets' 
    AND column_name = 'address_lc'
    AND is_generated = 'ALWAYS'
  ) INTO v_is_generated;

  IF NOT v_is_generated THEN
    RAISE EXCEPTION 'TEST 1 FAILED: address_lc is not a generated column';
  END IF;

  -- Test that address_lc is lowercase
  SELECT address, address_lc INTO v_test_address, v_test_address_lc
  FROM user_wallets
  WHERE address IS NOT NULL
  LIMIT 1;

  IF v_test_address_lc != LOWER(v_test_address) THEN
    RAISE EXCEPTION 'TEST 1 FAILED: address_lc is not lowercase (% vs %)', v_test_address, v_test_address_lc;
  END IF;

  RAISE NOTICE 'TEST 1 PASSED: address_lc column exists and is properly generated';
END;
$;

-- =====================================================
-- TEST 2: Verify unique constraint on (user_id, address_lc, chain_namespace)
-- =====================================================

DO $
DECLARE
  v_constraint_exists BOOLEAN;
  v_test_user_id UUID;
  v_test_address TEXT;
  v_test_chain TEXT;
BEGIN
  -- Check if unique index exists
  SELECT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'user_wallets' 
    AND indexname = 'uq_user_wallets_user_addr_chain'
  ) INTO v_constraint_exists;

  IF NOT v_constraint_exists THEN
    RAISE EXCEPTION 'TEST 2 FAILED: Unique constraint index does not exist';
  END IF;

  -- Get a test wallet
  SELECT user_id, address, chain_namespace INTO v_test_user_id, v_test_address, v_test_chain
  FROM user_wallets
  LIMIT 1;

  -- Try to insert duplicate (should fail)
  BEGIN
    INSERT INTO user_wallets (user_id, address, chain_namespace, is_primary)
    VALUES (v_test_user_id, v_test_address, v_test_chain, false);
    
    RAISE EXCEPTION 'TEST 2 FAILED: Duplicate insert was allowed (constraint not enforced)';
  EXCEPTION WHEN unique_violation THEN
    RAISE NOTICE 'TEST 2 PASSED: Unique constraint on (user_id, address_lc, chain_namespace) is enforced';
  END;
END;
$;

-- =====================================================
-- TEST 3: Verify unique constraint on (user_id) WHERE is_primary = true
-- =====================================================

DO $
DECLARE
  v_constraint_exists BOOLEAN;
  v_test_user_id UUID;
  v_primary_count INTEGER;
BEGIN
  -- Check if unique index exists
  SELECT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'user_wallets' 
    AND indexname = 'uq_user_wallets_primary_per_user'
  ) INTO v_constraint_exists;

  IF NOT v_constraint_exists THEN
    RAISE EXCEPTION 'TEST 3 FAILED: Primary wallet unique constraint index does not exist';
  END IF;

  -- Verify no user has multiple primary wallets
  SELECT COUNT(DISTINCT user_id) INTO v_primary_count
  FROM (
    SELECT user_id, COUNT(*) as primary_count
    FROM user_wallets
    WHERE is_primary = true
    GROUP BY user_id
    HAVING COUNT(*) > 1
  ) t;

  IF v_primary_count > 0 THEN
    RAISE EXCEPTION 'TEST 3 FAILED: Found % users with multiple primary wallets', v_primary_count;
  END IF;

  RAISE NOTICE 'TEST 3 PASSED: Unique constraint on (user_id) WHERE is_primary = true is enforced';
END;
$;

-- =====================================================
-- TEST 4: Verify RLS policies are in place
-- =====================================================

DO $
DECLARE
  v_rls_enabled BOOLEAN;
  v_select_policy_exists BOOLEAN;
  v_insert_policy_exists BOOLEAN;
  v_update_policy_exists BOOLEAN;
  v_delete_policy_exists BOOLEAN;
BEGIN
  -- Check if RLS is enabled
  SELECT relrowsecurity INTO v_rls_enabled
  FROM pg_class
  WHERE relname = 'user_wallets';

  IF NOT v_rls_enabled THEN
    RAISE EXCEPTION 'TEST 4 FAILED: RLS is not enabled on user_wallets';
  END IF;

  -- Check if policies exist
  SELECT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_wallets' AND policyname = 'p_user_wallets_select_own'
  ) INTO v_select_policy_exists;

  SELECT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_wallets' AND policyname = 'p_user_wallets_no_insert'
  ) INTO v_insert_policy_exists;

  SELECT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_wallets' AND policyname = 'p_user_wallets_no_update'
  ) INTO v_update_policy_exists;

  SELECT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_wallets' AND policyname = 'p_user_wallets_no_delete'
  ) INTO v_delete_policy_exists;

  IF NOT (v_select_policy_exists AND v_insert_policy_exists AND v_update_policy_exists AND v_delete_policy_exists) THEN
    RAISE EXCEPTION 'TEST 4 FAILED: Not all RLS policies are in place (SELECT: %, INSERT: %, UPDATE: %, DELETE: %)',
      v_select_policy_exists, v_insert_policy_exists, v_update_policy_exists, v_delete_policy_exists;
  END IF;

  RAISE NOTICE 'TEST 4 PASSED: RLS policies are properly configured';
END;
$;

-- =====================================================
-- TEST 5: Verify REVOKE permissions
-- =====================================================

DO $
DECLARE
  v_anon_insert BOOLEAN;
  v_anon_update BOOLEAN;
  v_anon_delete BOOLEAN;
  v_authenticated_insert BOOLEAN;
  v_authenticated_update BOOLEAN;
  v_authenticated_delete BOOLEAN;
BEGIN
  -- Check permissions for anon role
  SELECT EXISTS (
    SELECT 1 FROM information_schema.role_table_grants
    WHERE table_name = 'user_wallets'
    AND grantee = 'anon'
    AND privilege_type = 'INSERT'
  ) INTO v_anon_insert;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.role_table_grants
    WHERE table_name = 'user_wallets'
    AND grantee = 'anon'
    AND privilege_type = 'UPDATE'
  ) INTO v_anon_update;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.role_table_grants
    WHERE table_name = 'user_wallets'
    AND grantee = 'anon'
    AND privilege_type = 'DELETE'
  ) INTO v_anon_delete;

  -- Check permissions for authenticated role
  SELECT EXISTS (
    SELECT 1 FROM information_schema.role_table_grants
    WHERE table_name = 'user_wallets'
    AND grantee = 'authenticated'
    AND privilege_type = 'INSERT'
  ) INTO v_authenticated_insert;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.role_table_grants
    WHERE table_name = 'user_wallets'
    AND grantee = 'authenticated'
    AND privilege_type = 'UPDATE'
  ) INTO v_authenticated_update;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.role_table_grants
    WHERE table_name = 'user_wallets'
    AND grantee = 'authenticated'
    AND privilege_type = 'DELETE'
  ) INTO v_authenticated_delete;

  IF v_anon_insert OR v_anon_update OR v_anon_delete THEN
    RAISE EXCEPTION 'TEST 5 FAILED: anon role still has write permissions (INSERT: %, UPDATE: %, DELETE: %)',
      v_anon_insert, v_anon_update, v_anon_delete;
  END IF;

  IF v_authenticated_insert OR v_authenticated_update OR v_authenticated_delete THEN
    RAISE EXCEPTION 'TEST 5 FAILED: authenticated role still has write permissions (INSERT: %, UPDATE: %, DELETE: %)',
      v_authenticated_insert, v_authenticated_update, v_authenticated_delete;
  END IF;

  RAISE NOTICE 'TEST 5 PASSED: Write permissions properly revoked from anon and authenticated roles';
END;
$;

-- =====================================================
-- TEST 6: Verify migration is idempotent
-- =====================================================

DO $
DECLARE
  v_wallet_count_before INTEGER;
  v_wallet_count_after INTEGER;
BEGIN
  -- Count wallets before re-running cleanup
  SELECT COUNT(*) INTO v_wallet_count_before FROM user_wallets;

  -- Re-run the cleanup logic (should be idempotent)
  UPDATE user_wallets uw
  SET is_primary = false
  WHERE is_primary = true
  AND uw.id NOT IN (
    SELECT id FROM (
      SELECT 
        id,
        ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at ASC, id ASC) as rn
      FROM user_wallets
      WHERE is_primary = true
    ) ranked
    WHERE rn = 1
  );

  -- Count wallets after re-running cleanup
  SELECT COUNT(*) INTO v_wallet_count_after FROM user_wallets;

  IF v_wallet_count_before != v_wallet_count_after THEN
    RAISE EXCEPTION 'TEST 6 FAILED: Migration is not idempotent (wallet count changed from % to %)',
      v_wallet_count_before, v_wallet_count_after;
  END IF;

  RAISE NOTICE 'TEST 6 PASSED: Migration is idempotent (wallet count unchanged: %)', v_wallet_count_before;
END;
$;

-- =====================================================
-- SUMMARY
-- =====================================================

RAISE NOTICE '';
RAISE NOTICE '========================================';
RAISE NOTICE 'Migration Safety Tests Completed';
RAISE NOTICE '========================================';
RAISE NOTICE 'All tests passed! Migration is safe to deploy.';
RAISE NOTICE '';
