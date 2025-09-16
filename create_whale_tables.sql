-- Create whale analytics tables directly
CREATE TABLE IF NOT EXISTS whale_balances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    address TEXT NOT NULL,
    chain TEXT NOT NULL,
    balance DECIMAL(36,18) NOT NULL,
    ts TIMESTAMP NOT NULL,
    provider TEXT NOT NULL,
    method TEXT NOT NULL,
    request_id TEXT,
    ingested_at TIMESTAMP DEFAULT NOW(),
    latency_ms INTEGER
);

CREATE TABLE IF NOT EXISTS whale_transfers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tx_hash TEXT NOT NULL,
    log_index INTEGER NOT NULL DEFAULT 0,
    from_address TEXT NOT NULL,
    to_address TEXT NOT NULL,
    value DECIMAL(36,18) NOT NULL,
    token TEXT NOT NULL DEFAULT 'ETH',
    chain TEXT NOT NULL,
    ts TIMESTAMP NOT NULL,
    provider TEXT NOT NULL,
    method TEXT NOT NULL,
    request_id TEXT,
    ingested_at TIMESTAMP DEFAULT NOW(),
    latency_ms INTEGER,
    CONSTRAINT whale_transfers_unique_tx UNIQUE (tx_hash, log_index)
);

CREATE TABLE IF NOT EXISTS whale_signals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    address TEXT NOT NULL,
    chain TEXT NOT NULL,
    signal_type TEXT NOT NULL,
    value DECIMAL(36,18),
    confidence FLOAT NOT NULL,
    reasons TEXT[] DEFAULT '{}',
    supporting_events TEXT[] DEFAULT '{}',
    ts TIMESTAMP NOT NULL,
    provider TEXT NOT NULL,
    method TEXT NOT NULL,
    ingested_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_whale_balances_address_chain ON whale_balances(address, chain);
CREATE INDEX IF NOT EXISTS idx_whale_transfers_from_address ON whale_transfers(from_address);
CREATE INDEX IF NOT EXISTS idx_whale_signals_address ON whale_signals(address);