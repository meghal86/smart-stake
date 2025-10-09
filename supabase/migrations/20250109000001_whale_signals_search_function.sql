-- Create RPC function to search whale signals by asset
CREATE OR REPLACE FUNCTION search_whale_signals(
  search_asset TEXT,
  start_time TIMESTAMPTZ DEFAULT '2020-01-01T00:00:00.000Z'
)
RETURNS TABLE (
  id UUID,
  address TEXT,
  chain TEXT,
  signal_type TEXT,
  value NUMERIC,
  confidence DOUBLE PRECISION,
  reasons TEXT[],
  supporting_events TEXT[],
  ts TIMESTAMP,
  provider TEXT,
  method TEXT,
  ingested_at TIMESTAMP,
  request_id TEXT,
  latency_ms INTEGER,
  risk_score INTEGER,
  alert_triggered BOOLEAN,
  idempotency_key TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ws.id,
    ws.address,
    ws.chain,
    ws.signal_type,
    ws.value,
    ws.confidence,
    ws.reasons,
    ws.supporting_events,
    ws.ts,
    ws.provider,
    ws.method,
    ws.ingested_at,
    ws.request_id,
    ws.latency_ms,
    ws.risk_score,
    ws.alert_triggered,
    ws.idempotency_key
  FROM whale_signals ws
  WHERE 
    ws.provider = 'whale-alert'
    AND ws.ts >= start_time
    AND EXISTS (
      SELECT 1 FROM unnest(ws.reasons) AS reason
      WHERE reason ILIKE '%' || search_asset || '%'
    )
  ORDER BY ws.ts DESC
  LIMIT 100;
END;
$$ LANGUAGE plpgsql;