-- HarvestPro Setup Verification Script
-- Run this to check if everything is configured correctly

-- ============================================================================
-- CHECK 1: Users
-- ============================================================================
SELECT 
  '1. USERS' as check_name,
  CASE 
    WHEN count(*) > 0 THEN '✅ ' || count(*)::text || ' user(s) found'
    ELSE '❌ No users found - please sign up first'
  END as status
FROM auth.users;

-- ============================================================================
-- CHECK 2: Wallets
-- ============================================================================
SELECT 
  '2. WALLETS' as check_name,
  CASE 
    WHEN count(*) > 0 THEN '✅ ' || count(*)::text || ' wallet(s) configured'
    ELSE '❌ No wallets - run harvestpro_test_data.sql'
  END as status
FROM harvest_user_wallets;

-- ============================================================================
-- CHECK 3: Lots (Positions)
-- ============================================================================
SELECT 
  '3. LOTS' as check_name,
  CASE 
    WHEN count(*) > 0 THEN '✅ ' || count(*)::text || ' position(s) with data'
    ELSE '❌ No positions - run harvestpro_test_data.sql'
  END as status
FROM harvest_lots;

-- ============================================================================
-- CHECK 4: Eligible Harvest Opportunities
-- ============================================================================
SELECT 
  '4. OPPORTUNITIES' as check_name,
  CASE 
    WHEN count(*) > 0 THEN '✅ ' || count(*)::text || ' position(s) with losses'
    ELSE '❌ No losses found - run harvestpro_test_data.sql'
  END as status
FROM harvest_lots
WHERE unrealized_pnl_usd < 0 AND is_eligible_for_harvest = true;

-- ============================================================================
-- CHECK 5: User Settings
-- ============================================================================
SELECT 
  '5. SETTINGS' as check_name,
  CASE 
    WHEN count(*) > 0 THEN '✅ Tax settings configured'
    ELSE '⚠️  No tax settings - will use defaults'
  END as status
FROM harvest_user_settings;

-- ============================================================================
-- SUMMARY: Total Harvestable Loss
-- ============================================================================
SELECT 
  '6. TOTAL LOSS' as check_name,
  CASE 
    WHEN abs(sum(unrealized_pnl_usd)) > 0 
    THEN '✅ $' || abs(sum(unrealized_pnl_usd))::numeric(10,2)::text || ' available to harvest'
    ELSE '❌ No losses to harvest'
  END as status
FROM harvest_lots
WHERE unrealized_pnl_usd < 0 AND is_eligible_for_harvest = true;

-- ============================================================================
-- DETAILED VIEW: Show actual opportunities
-- ============================================================================
SELECT 
  '--- OPPORTUNITIES DETAIL ---' as info,
  '' as token,
  '' as chain,
  null::numeric as loss,
  null::numeric as tax_benefit_24pct;

SELECT 
  '' as info,
  token,
  chain,
  abs(unrealized_pnl_usd)::numeric(10,2) as loss,
  (abs(unrealized_pnl_usd) * 0.24)::numeric(10,2) as tax_benefit_24pct
FROM harvest_lots
WHERE unrealized_pnl_usd < 0 AND is_eligible_for_harvest = true
ORDER BY unrealized_pnl_usd ASC;

-- ============================================================================
-- NEXT STEPS
-- ============================================================================
SELECT 
  CASE 
    WHEN (SELECT count(*) FROM auth.users) = 0 
    THEN '❌ NEXT STEP: Sign up through your app first'
    WHEN (SELECT count(*) FROM harvest_lots WHERE unrealized_pnl_usd < 0) = 0
    THEN '❌ NEXT STEP: Run harvestpro_test_data.sql to seed test data'
    ELSE '✅ ALL SET! Go to HarvestPro and click "Live" mode'
  END as next_step;
