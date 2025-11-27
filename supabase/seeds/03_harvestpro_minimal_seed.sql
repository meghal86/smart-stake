-- HarvestPro MINIMAL Test Data Seed
-- This version only uses the core required columns
-- Run this if you're getting "column does not exist" errors

-- First, let's check what columns actually exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'harvest_lots'
ORDER BY ordinal_position;

-- If the above query shows the table exists, uncomment and run the INSERT below:
/*
INSERT INTO harvest_lots (
  user_id,
  token,
  wallet_or_cex,
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

-- Insert opportunities
INSERT INTO harvest_opportunities (
  lot_id,
  user_id,
  token,
  risk_level,
  unrealized_loss,
  remaining_qty,
  gas_estimate,
  slippage_estimate,
  trading_fees,
  net_tax_benefit,
  guardian_score,
  execution_time_estimate,
  confidence,
  recommendation_badge
)
SELECT
  lot_id,
  user_id,
  token,
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
  (abs(unrealized_pnl) * 0.24) - 
  CASE 
    WHEN token = 'ETH' THEN 82.00
    WHEN token = 'MATIC' THEN 92.00
    WHEN token = 'LINK' THEN 158.00
    WHEN token = 'UNI' THEN 84.00
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
  END as recommendation_badge
FROM harvest_lots
WHERE user_id = (SELECT id FROM auth.users LIMIT 1)
  AND eligible_for_harvest = true
  AND unrealized_pnl < 0
ON CONFLICT DO NOTHING;

-- Verify
SELECT 
  '✅ Test data seeded!' as status,
  (SELECT count(*) FROM harvest_lots WHERE user_id = (SELECT id FROM auth.users LIMIT 1)) as total_lots,
  (SELECT count(*) FROM harvest_opportunities WHERE user_id = (SELECT id FROM auth.users LIMIT 1)) as total_opportunities;
*/
