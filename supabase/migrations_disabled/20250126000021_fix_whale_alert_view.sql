-- Fix whale alert view by dropping and recreating
DROP VIEW IF EXISTS whale_alert_transfers_norm;

CREATE VIEW whale_alert_transfers_norm AS
SELECT
  chain,
  tx_hash,
  from_addr,
  to_addr,
  CASE 
    WHEN COALESCE(labels->>'to_entity','') ILIKE ANY (ARRAY['%binance%','%okx%','%coinbase%','%kraken%','%bybit%','%kucoin%'])
    THEN 'in' ELSE 'out' END AS direction,
  amount_usd::numeric AS usd_amount,
  detected_at AS block_time,
  labels,
  COALESCE(labels->>'to_entity','Unknown') AS to_entity,
  COALESCE(labels->>'from_entity','Unknown') AS from_entity
FROM whale_alert_events
WHERE amount_usd IS NOT NULL AND amount_usd >= 50000;