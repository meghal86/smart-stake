-- Execute this directly in Supabase SQL Editor
-- Whale Schema Upgrade - Direct Execution

-- Create whale_balances table
DROP TABLE IF EXISTS whale_balances CASCADE;
CREATE TABLE whale_balances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    address TEXT NOT NULL,
    chain TEXT NOT NULL DEFAULT 'ethereum',
    token_address TEXT,
    balance DECIMAL(36,18) NOT NULL,
    balance_usd DECIMAL(18,2),
    ts TIMESTAMP NOT NULL,
    provider TEXT NOT NULL,
    method TEXT NOT NULL,
    ingested_at TIMESTAMP DEFAULT NOW(),
    request_id TEXT,
    latency_ms INTEGER,
    block_number BIGINT,
    idempotency_key TEXT GENERATED ALWAYS AS (
        address || ':' || chain || ':' || COALESCE(block_number::text, extract(epoch from ts)::text)
    ) STORED,
    UNIQUE(idempotency_key)
);

-- Create whale_transfers table
DROP TABLE IF EXISTS whale_transfers CASCADE;
CREATE TABLE whale_transfers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tx_hash TEXT NOT NULL,
    from_address TEXT NOT NULL,
    to_address TEXT NOT NULL,
    value DECIMAL(36,18) NOT NULL,
    value_usd DECIMAL(18,2),
    token_address TEXT,
    token_symbol TEXT,
    chain TEXT NOT NULL DEFAULT 'ethereum',
    ts TIMESTAMP NOT NULL,
    provider TEXT NOT NULL,
    method TEXT NOT NULL,
    ingested_at TIMESTAMP DEFAULT NOW(),
    request_id TEXT,
    latency_ms INTEGER,
    block_number BIGINT,
    log_index INTEGER,
    gas_used BIGINT,
    gas_price DECIMAL(36,18),
    idempotency_key TEXT GENERATED ALWAYS AS (
        tx_hash || ':' || COALESCE(log_index::text, '0')
    ) STORED,
    UNIQUE(idempotency_key)
);

-- Recreate whale_signals with enhanced schema
DROP TABLE IF EXISTS whale_signals CASCADE;
CREATE TABLE whale_signals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    address TEXT NOT NULL,
    chain TEXT NOT NULL DEFAULT 'ethereum',
    signal_type TEXT NOT NULL,
    value DECIMAL(36,18),
    confidence FLOAT NOT NULL DEFAULT 0.5,
    reasons TEXT[] DEFAULT '{}',
    supporting_events TEXT[] DEFAULT '{}',
    ts TIMESTAMP NOT NULL DEFAULT NOW(),
    provider TEXT NOT NULL DEFAULT 'whale-analytics',
    method TEXT NOT NULL DEFAULT 'risk_computation',
    ingested_at TIMESTAMP DEFAULT NOW(),
    request_id TEXT,
    latency_ms INTEGER,
    risk_score INTEGER CHECK (risk_score >= 0 AND risk_score <= 100),
    alert_triggered BOOLEAN DEFAULT false,
    idempotency_key TEXT GENERATED ALWAYS AS (
        address || ':' || chain || ':' || signal_type || ':' || extract(epoch from ts)::text
    ) STORED,
    UNIQUE(idempotency_key)
);

-- Performance indexes
CREATE INDEX idx_whale_balances_addr_chain_ts ON whale_balances(address, chain, ts DESC);
CREATE INDEX idx_whale_balances_balance_usd ON whale_balances(balance_usd DESC) WHERE balance_usd > 1000000;
CREATE INDEX idx_whale_transfers_from_chain_ts ON whale_transfers(from_address, chain, ts DESC);
CREATE INDEX idx_whale_transfers_to_chain_ts ON whale_transfers(to_address, chain, ts DESC);
CREATE INDEX idx_whale_transfers_value_usd ON whale_transfers(value_usd DESC) WHERE value_usd > 100000;
CREATE INDEX idx_whale_signals_addr_chain_ts ON whale_signals(address, chain, ts DESC);
CREATE INDEX idx_whale_signals_confidence_risk ON whale_signals(confidence DESC, risk_score DESC);

-- Enable RLS
ALTER TABLE whale_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE whale_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE whale_signals ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "whale_balances_all" ON whale_balances FOR ALL USING (true);
CREATE POLICY "whale_transfers_all" ON whale_transfers FOR ALL USING (true);
CREATE POLICY "whale_signals_all" ON whale_signals FOR ALL USING (true);

-- DLQ table for failed whale events
CREATE TABLE IF NOT EXISTS whale_dlq_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payload JSONB NOT NULL,
    error_message TEXT NOT NULL,
    retry_count INTEGER DEFAULT 0,
    first_seen TIMESTAMP DEFAULT NOW(),
    last_error TIMESTAMP DEFAULT NOW(),
    resolved BOOLEAN DEFAULT false
);

-- DLQ indexes
CREATE INDEX idx_whale_dlq_unresolved ON whale_dlq_events(resolved, first_seen) WHERE resolved = false;
CREATE INDEX idx_whale_dlq_first_seen ON whale_dlq_events(first_seen DESC);

-- DLQ RLS
ALTER TABLE whale_dlq_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "whale_dlq_all" ON whale_dlq_events FOR ALL USING (true);

-- Optimized view
CREATE OR REPLACE VIEW whale_activity_summary AS
SELECT 
    b.address,
    b.chain,
    COUNT(DISTINCT t.tx_hash) as tx_count_24h,
    SUM(t.value_usd) as volume_24h,
    MAX(b.balance_usd) as current_balance_usd,
    MAX(s.risk_score) as risk_score,
    MAX(s.confidence) as confidence
FROM whale_balances b
LEFT JOIN whale_transfers t ON (t.from_address = b.address OR t.to_address = b.address) 
    AND t.chain = b.chain 
    AND t.ts > NOW() - INTERVAL '24 hours'
LEFT JOIN whale_signals s ON s.address = b.address 
    AND s.chain = b.chain 
    AND s.ts > NOW() - INTERVAL '24 hours'
WHERE b.ts > NOW() - INTERVAL '24 hours'
GROUP BY b.address, b.chain;