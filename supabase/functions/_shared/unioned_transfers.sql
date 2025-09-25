-- SQL function for unioned transfers (internal + whale alert, deduped)
CREATE OR REPLACE FUNCTION get_unioned_transfers(window_hours INTEGER)
RETURNS TABLE (
  chain TEXT,
  tx_hash TEXT,
  direction TEXT,
  usd_amount NUMERIC,
  block_time TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  WITH windowed_internal AS (
    SELECT wt.chain, wt.tx_hash, wt.direction, wt.usd_amount, wt.block_time
    FROM whale_transfers wt
    WHERE wt.block_time >= NOW() - (window_hours || ' hours')::INTERVAL
  ),
  windowed_alert AS (
    SELECT wa.chain, wa.tx_hash, wa.direction, wa.usd_amount, wa.block_time, wa.from_addr, wa.to_addr
    FROM whale_alert_transfers_norm wa
    WHERE wa.block_time >= NOW() - (window_hours || ' hours')::INTERVAL
      AND wa.usd_amount >= 50000
      AND COALESCE((wa.labels->>'to_entity_confidence')::numeric, 1.0) >= 0.7
  ),
  unioned AS (
    SELECT * FROM windowed_internal
    UNION ALL
    SELECT a.chain, a.tx_hash, a.direction, a.usd_amount, a.block_time
    FROM windowed_alert a
    LEFT JOIN windowed_internal i
      ON i.chain = a.chain
     AND (i.tx_hash = a.tx_hash 
          OR (ABS(EXTRACT(EPOCH FROM (i.block_time - a.block_time))) <= 90
              AND ABS(i.usd_amount - a.usd_amount) <= 1.0
              AND i.from_addr = a.from_addr 
              AND i.to_addr = a.to_addr))
    WHERE i.tx_hash IS NULL
  )
  -- Apply single-transfer cap (≤35% of chain volume)
  SELECT u.chain, u.tx_hash, u.direction, 
         LEAST(u.usd_amount, chain_vol.max_single) as usd_amount, 
         u.block_time
  FROM unioned u
  JOIN (
    SELECT chain, SUM(usd_amount) * 0.35 as max_single
    FROM unioned 
    GROUP BY chain
  ) chain_vol ON u.chain = chain_vol.chain;
END;
$$ LANGUAGE plpgsql;