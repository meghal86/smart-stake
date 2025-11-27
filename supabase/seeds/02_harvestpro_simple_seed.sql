-- HarvestPro Simple Test Data Seed
-- Run this in Supabase SQL Editor to create test opportunities
-- Make sure you're logged in to your app first!

-- Step 1: Insert test lots (replace YOUR_USER_ID with your actual user ID from auth.users)
-- To find your user ID, run: SELECT id FROM auth.users LIMIT 1;

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
    (SELECT id FROM auth.users LIMIT 1),
    'ETH',
    '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
    1,
    'WALLET',
    'Uniswap',
    now() - interval '60 days',
    2.5,
    2800.00,
    1000.00,
    -4500.00,
    60,
    false,
    'LOW',
    95.0,
    8.5,
    true
  ),
  -- MATIC position with $2,800 loss
  (
    (SELECT id FROM auth.users LIMIT 1),
    'MATIC',
    '0x8888888888888888888888888888888888888888',
    137,
    'WALLET',
    'QuickSwap',
    now() - interval '90 days',
    5000,
    0.70,
    0.14,
    -2800.00,
    90,
    true,
    'MEDIUM',
    75.0,
    6.2,
    true
  ),
  -- LINK position with $1,850 loss
  (
    (SELECT id FROM auth.users LIMIT 1),
    'LINK',
    '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
    1,
    'WALLET',
    'SushiSwap',
    now() - interval '45 days',
    150,
    18.00,
    5.67,
    -1850.00,
    45,
    false,
    'HIGH',
    60.0,
    4.1,
    true
  ),
  -- UNI position with $1,200 loss
  (
    (SELECT id FROM auth.users LIMIT 1),
    'UNI',
    '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
    1,
    'WALLET',
    'Uniswap',
    now() - interval '120 days',
    200,
    9.00,
    3.00,
    -1200.00,
    120,
    true,
    'LOW',
    90.0,
    8.0,
    true
  )
ON CONFLICT DO NOTHING;

-- Step 2: Insert harvest opportunities
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
WHERE user_id = (SELECT id FROM auth.users LIMIT 1)
  AND eligible_for_harvest = true
  AND unrealized_pnl < 0
ON CONFLICT DO NOTHING;

-- Step 3: Verify the data
SELECT 
  '✅ Test data seeded!' as status,
  (SELECT count(*) FROM harvest_lots WHERE user_id = (SELECT id FROM auth.users LIMIT 1)) as total_lots,
  (SELECT count(*) FROM harvest_opportunities WHERE user_id = (SELECT id FROM auth.users LIMIT 1)) as total_opportunities,
  (SELECT abs(sum(unrealized_pnl))::numeric(10,2) FROM harvest_lots WHERE user_id = (SELECT id FROM auth.users LIMIT 1) AND unrealized_pnl < 0) as total_potential_loss;

-- View the opportunities
SELECT 
  token,
  abs(unrealized_pnl)::numeric(10,2) as loss,
  (abs(unrealized_pnl) * 0.24)::numeric(10,2) as tax_benefit_24pct,
  risk_level,
  guardian_score
FROM harvest_lots
WHERE user_id = (SELECT id FROM auth.users LIMIT 1)
  AND unrealized_pnl < 0
ORDER BY unrealized_pnl ASC;
