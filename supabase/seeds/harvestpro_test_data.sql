-- HarvestPro Test Data Seed
-- This creates a test user with wallets and harvest opportunities
-- Run this in Supabase SQL Editor to test Live mode

-- ============================================================================
-- STEP 1: Get or create a test user
-- ============================================================================

-- First, let's use your existing user or create a test one
-- Replace this with your actual user ID from auth.users table
-- You can find it by running: SELECT id, email FROM auth.users LIMIT 1;

DO $$
DECLARE
  test_user_id uuid;
BEGIN
  -- Try to get the first user
  SELECT id INTO test_user_id FROM auth.users LIMIT 1;
  
  -- If no user exists, you'll need to create one through your app's signup
  IF test_user_id IS NULL THEN
    RAISE NOTICE 'No users found. Please sign up through your app first.';
    RAISE EXCEPTION 'No users available for seeding';
  END IF;
  
  RAISE NOTICE 'Using user ID: %', test_user_id;
  
  -- ============================================================================
  -- STEP 2: Add test wallets
  -- ============================================================================
  
  INSERT INTO harvest_user_wallets (user_id, wallet_address, wallet_name, chain, is_active, created_at)
  VALUES 
    (test_user_id, '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', 'Main Wallet', 'ethereum', true, now()),
    (test_user_id, '0x8888888888888888888888888888888888888888', 'Trading Wallet', 'polygon', true, now())
  ON CONFLICT (user_id, wallet_address, chain) DO NOTHING;
  
  -- ============================================================================
  -- STEP 3: Add test lots (positions with losses)
  -- ============================================================================
  
  INSERT INTO harvest_lots (
    user_id,
    wallet_address,
    token,
    chain,
    quantity,
    cost_basis_usd,
    current_price_usd,
    unrealized_pnl_usd,
    acquisition_date,
    is_eligible_for_harvest,
    last_price_update,
    created_at
  )
  VALUES
    -- ETH position with $4,500 loss
    (
      test_user_id,
      '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
      'ETH',
      'ethereum',
      2.5,
      7000.00,  -- Bought at $2,800 per ETH
      2500.00,  -- Now worth $1,000 per ETH
      -4500.00, -- $4,500 loss
      now() - interval '60 days',
      true,
      now(),
      now()
    ),
    -- MATIC position with $2,800 loss
    (
      test_user_id,
      '0x8888888888888888888888888888888888888888',
      'MATIC',
      'polygon',
      5000,
      3500.00,  -- Bought at $0.70 per MATIC
      700.00,   -- Now worth $0.14 per MATIC
      -2800.00, -- $2,800 loss
      now() - interval '90 days',
      true,
      now(),
      now()
    ),
    -- LINK position with $1,850 loss
    (
      test_user_id,
      '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
      'LINK',
      'ethereum',
      150,
      2700.00,  -- Bought at $18 per LINK
      850.00,   -- Now worth $5.67 per LINK
      -1850.00, -- $1,850 loss
      now() - interval '45 days',
      true,
      now(),
      now()
    ),
    -- UNI position with $1,200 loss
    (
      test_user_id,
      '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
      'UNI',
      'ethereum',
      200,
      1800.00,  -- Bought at $9 per UNI
      600.00,   -- Now worth $3 per UNI
      -1200.00, -- $1,200 loss
      now() - interval '120 days',
      true,
      now(),
      now()
    );
  
  -- ============================================================================
  -- STEP 4: Set user tax settings
  -- ============================================================================
  
  INSERT INTO harvest_user_settings (user_id, tax_rate, min_loss_threshold, max_risk_level, exclude_wash_sale, created_at, updated_at)
  VALUES (test_user_id, 0.24, 100, 'medium', true, now(), now())
  ON CONFLICT (user_id) DO UPDATE SET
    tax_rate = 0.24,
    min_loss_threshold = 100,
    max_risk_level = 'medium',
    exclude_wash_sale = true,
    updated_at = now();
  
  RAISE NOTICE 'Test data seeded successfully!';
  RAISE NOTICE 'Total lots created: 4';
  RAISE NOTICE 'Total potential loss: $10,350';
  RAISE NOTICE 'Estimated tax benefit (24%%): $2,484';
  
END $$;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check what was created
SELECT 
  'Wallets' as type,
  count(*)::text as count
FROM harvest_user_wallets
UNION ALL
SELECT 
  'Lots' as type,
  count(*)::text as count
FROM harvest_lots
UNION ALL
SELECT 
  'Total Loss' as type,
  '$' || abs(sum(unrealized_pnl_usd))::text as count
FROM harvest_lots
WHERE unrealized_pnl_usd < 0;

-- Show the lots
SELECT 
  token,
  chain,
  quantity,
  cost_basis_usd,
  current_price_usd,
  unrealized_pnl_usd as loss,
  acquisition_date::date
FROM harvest_lots
ORDER BY unrealized_pnl_usd ASC;
