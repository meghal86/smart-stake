-- Minimal Whale Tables Creation
-- Migration: 20250116000003_whale_tables_only.sql

-- Create whale_balances table
CREATE TABLE IF NOT EXISTS whale_balances (
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
    block_number BIGINT
);

-- Create whale_transfers table
CREATE TABLE IF NOT EXISTS whale_transfers (
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
    gas_price DECIMAL(36,18)
);

-- Recreate whale_signals with full schema
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
    alert_triggered BOOLEAN DEFAULT false
);

-- Add essential indexes
CREATE INDEX IF NOT EXISTS idx_whale_balances_addr_chain ON whale_balances(address, chain);
CREATE INDEX IF NOT EXISTS idx_whale_transfers_from_addr ON whale_transfers(from_address);
CREATE INDEX IF NOT EXISTS idx_whale_transfers_to_addr ON whale_transfers(to_address);
CREATE INDEX IF NOT EXISTS idx_whale_signals_addr_chain ON whale_signals(address, chain);
CREATE INDEX IF NOT EXISTS idx_whale_signals_confidence ON whale_signals(confidence DESC);

-- Enable RLS
ALTER TABLE whale_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE whale_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE whale_signals ENABLE ROW LEVEL SECURITY;

-- Simple RLS policies
DROP POLICY IF EXISTS "whale_balances_policy" ON whale_balances;
DROP POLICY IF EXISTS "whale_transfers_policy" ON whale_transfers;
DROP POLICY IF EXISTS "whale_signals_policy" ON whale_signals;

CREATE POLICY "whale_balances_policy" ON whale_balances FOR ALL USING (true);
CREATE POLICY "whale_transfers_policy" ON whale_transfers FOR ALL USING (true);
CREATE POLICY "whale_signals_policy" ON whale_signals FOR ALL USING (true);

COMMIT;