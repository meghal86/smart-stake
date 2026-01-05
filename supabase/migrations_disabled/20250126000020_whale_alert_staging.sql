-- Whale Alert staging table and normalized view
CREATE TABLE IF NOT EXISTS whale_alert_events (
  id TEXT PRIMARY KEY,
  chain TEXT NOT NULL,
  tx_hash TEXT,
  from_addr TEXT,
  to_addr TEXT,
  amount_usd NUMERIC,
  symbol TEXT,
  detected_at TIMESTAMPTZ NOT NULL,
  labels JSONB,
  raw JSONB,
  inserted_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_whale_alert_unique
ON whale_alert_events (id);

CREATE INDEX IF NOT EXISTS idx_whale_alert_chain_time
ON whale_alert_events (chain, detected_at);

-- Normalized view
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