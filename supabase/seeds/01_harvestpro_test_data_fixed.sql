-- HarvestPro Test Data Seed (FIXED for actual schema)
-- This creates test harvest opportunities for testing Live mode
-- Run this AFTER running the migration (20250201000000_harvestpro_schema.sql)

-- Get the first user (or use your specific user ID)
DO $$
DECLARE
  test_user_id uuid;
BEGIN
  -- Get first user
  SELECT id INTO test_user_id FROM auth.users LIMIT 1;
  
  IF test_user_id IS NULL THEN
    RAISE EXCEPTION 'No users found. Please sign up through your app first.';
  END IF;
  
  RAISE NOTICE 'Using user ID: %', test_user_id;
  
  -- ============================================================================
  -- INSERT TEST LOTS (positions with losses)
  -- ============================================================================
  
  INSERT INTO harvest_lots (
    user_id,
    token,
    wallet_or_cex,
    chain_id,
    venue_type,
    venue_name,
    acquired_at,
    acquired_qty,
    acquired_price_usd,
    current_price_usd,
    unrealized_pnl,
    holding_period_days,
    long_term,
    risk_level,
    liquidity_score,
    guardian_score,
    eligible_for_harvest
  )
  VALUES
    -- ETH position with $4,500 loss
    (
      test_user_id,
      'ETH',
      '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
      1, -- Ethereum mainnet
      'WALLET',
      'Uniswap',
      now() - interval '60 days',
      2.5,
      2800.00,  -- Bought at $2,800 per ETH
      1000.00,  -- Now worth $1,000 per ETH
      -4500.00, -- $4,500 loss
      60,
      false,
      'LOW',
      95.0,
      8.5,
      true
    ),
    -- MATIC position with $2,800 loss
    (
      test_user_id,
      'MATIC',
      '0x8888888888888888888888888888888888888888',
      137, -- Polygon
      'WALLET',
      'QuickSwap',
      now() - interval '90 days',
      5000,
      0.70,     -- Bought at $0.70 per MATIC
      0.14,     -- Now worth $0.14 per MATIC
      -2800.00, -- $2,800 loss
      90,
      true,
      'MEDIUM',
      75.0,
      6.2,
      true
    ),
    -- LINK position with $1,850 loss
    (
      test_user_id,
      'LINK',
      '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
      1, -- Ethereum
      'WALLET',
      'SushiSwap',
      now() - interval '45 days',
      150,
      18.00,    -- Bought at $18 per LINK
      5.67,     -- Now worth $5.67 per LINK
      -1850.00, -- $1,850 loss
      45,
      false,
      'HIGH',
      60.0,
      4.1,
      true
    ),
    -- UNI position with $1,200 loss
    (
      test_user_id,
      'UNI',
      '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
      1, -- Ethereum
      'WALLET',
      'Uniswap',
      now() - interval '120 days',
      200,
      9.00,     -- Bought at $9 per UNI
      3.00,     -- Now worth $3 per UNI
      -1200.00, -- $1,200 loss
      120,
      true,
      'LOW',
      90.0,
      8.0,
      true
    )
  ON CONFLICT DO NOTHING;
  
  -- ============================================================================
  -- INSERT HARVEST OPPORTUNITIES (computed from lots)
  -- ============================================================================
  
  INSERT INTO harvest_opportunities (
    lot_id,
    user_id,
    token,
    token_logo_url,
    risk_level,
    unrealized_loss,
    remaining_qty,
    gas_estimate,
    slippage_estimate,
    trading_fees,
    tax_rate_used,
    net_tax_benefit,
    guardian_score,
    execution_time_estimate,
    confidence,
    recommendation_badge,
    metadata
  )
  SELECT
    lot_id,
    user_id,
    token,
    null as token_logo_url,
    risk_level,
    abs(unrealized_pnl) as unrealized_loss,
    acquired_qty as remaining_qty,
    CASE 
      WHEN token = 'ETH' THEN 45.00
      WHEN token = 'MATIC' THEN 35.00
      WHEN token = 'LINK' THEN 55.00
      WHEN token = 'UNI' THEN 40.00
    END as gas_estimate,
    CASE 
      WHEN token = 'ETH' THEN 22.00
      WHEN token = 'MATIC' THEN 45.00
      WHEN token = 'LINK' THEN 85.00
      WHEN token = 'UNI' THEN 30.00
    END as slippage_estimate,
    CASE 
      WHEN token = 'ETH' THEN 15.00
      WHEN token = 'MATIC' THEN 12.00
      WHEN token = 'LINK' THEN 18.00
      WHEN token = 'UNI' THEN 14.00
    END as trading_fees,
    0.24 as tax_rate_used,
    -- Net benefit = (loss * tax_rate) - gas - slippage - fees
    (abs(unrealized_pnl) * 0.24) - 
    CASE 
      WHEN token = 'ETH' THEN 45.00 + 22.00 + 15.00
      WHEN token = 'MATIC' THEN 35.00 + 45.00 + 12.00
      WHEN token = 'LINK' THEN 55.00 + 85.00 + 18.00
      WHEN token = 'UNI' THEN 40.00 + 30.00 + 14.00
    END as net_tax_benefit,
    guardian_score,
    CASE 
      WHEN token = 'ETH' THEN '5-8 min'
      WHEN token = 'MATIC' THEN '8-12 min'
      WHEN token = 'LINK' THEN '10-15 min'
      WHEN token = 'UNI' THEN '6-10 min'
    END as execution_time_estimate,
    CASE 
      WHEN risk_level = 'LOW' THEN 92
      WHEN risk_level = 'MEDIUM' THEN 78
      WHEN risk_level = 'HIGH' THEN 65
    END as confidence,
    CASE 
      WHEN risk_level = 'LOW' AND guardian_score >= 8 THEN 'recommended'
      WHEN risk_level = 'MEDIUM' THEN 'high-benefit'
      WHEN risk_level = 'HIGH' THEN 'guardian-flagged'
      ELSE 'not-recommended'
    END as recommendation_badge,
    jsonb_build_object(
      'walletName', CASE 
        WHEN wallet_or_cex LIKE '%742d35%' THEN 'Main Wallet'
        ELSE 'Trading Wallet'
      END,
      'venue', venue_name,
      'reasons', CASE 
        WHEN risk_level = 'LOW' THEN jsonb_build_array('High liquidity', 'Low gas cost')
        WHEN risk_level = 'MEDIUM' THEN jsonb_build_array('Moderate slippage expected')
        WHEN risk_level = 'HIGH' THEN jsonb_build_array('Low liquidity pool', 'High slippage risk')
      END
    ) as metadata
  FROM harvest_lots
  WHERE user_id = test_user_id
    AND eligible_for_harvest = true
    AND unrealized_pnl < 0
  ON CONFLICT DO NOTHING;
  
  RAISE NOTICE '✅ Test data seeded successfully!';
  RAISE NOTICE 'Total lots created: %', (SELECT count(*) FROM harvest_lots WHERE user_id = test_user_id);
  RAISE NOTICE 'Total opportunities: %', (SELECT count(*) FROM harvest_opportunities WHERE user_id = test_user_id);
  RAISE NOTICE 'Total potential loss: $%', (SELECT abs(sum(unrealized_pnl)) FROM harvest_lots WHERE user_id = test_user_id AND unrealized_pnl < 0);
  
END $$;

-- Verification query
SELECT 
  token,
  abs(unrealized_pnl)::numeric(10,2) as loss,
  (abs(unrealized_pnl) * 0.24)::numeric(10,2) as tax_benefit_24pct,
  risk_level,
  guardian_score
FROM harvest_lots
WHERE unrealized_pnl < 0
ORDER BY unrealized_pnl ASC;
