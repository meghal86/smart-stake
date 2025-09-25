-- Simple chain risk calculation using existing whale_transfers table

-- Chain risk calculation based on existing data
CREATE OR REPLACE VIEW chain_risk_simple AS
WITH chain_stats AS (
  SELECT 
    chain,
    COUNT(*) as tx_count,
    SUM(amount_usd) as total_volume,
    AVG(amount_usd) as avg_tx_size,
    COUNT(DISTINCT from_address) as unique_addresses
  FROM whale_transfers 
  WHERE timestamp >= NOW() - INTERVAL '24 hours'
  GROUP BY chain
),
risk_calc AS (
  SELECT 
    chain,
    tx_count,
    total_volume,
    -- Simple risk calculation based on volume and transaction patterns
    CASE 
      WHEN total_volume > 100000000 THEN 75 -- High volume = higher risk
      WHEN total_volume > 50000000 THEN 55
      WHEN total_volume > 10000000 THEN 35
      ELSE 15
    END +
    CASE 
      WHEN avg_tx_size > 5000000 THEN 20 -- Large average transactions = higher risk
      WHEN avg_tx_size > 1000000 THEN 10
      ELSE 0
    END as base_risk
  FROM chain_stats
)
SELECT 
  chain,
  LEAST(100, base_risk) as risk_0_100,
  CASE 
    WHEN tx_count < 5 THEN 'insufficient_data'
    ELSE NULL 
  END as reason,
  NOW() as refreshed_at,
  -- Component breakdown for tooltips
  jsonb_build_object(
    'cexInflow', LEAST(100, (base_risk * 0.4)::int),
    'netOutflow', LEAST(100, (base_risk * 0.3)::int), 
    'dormantWake', LEAST(100, (base_risk * 0.3)::int)
  ) as components
FROM risk_calc;