-- Safe Whale Schema Upgrade - Handles existing tables
-- Migration: 20250116000002_whale_schema_safe_upgrade.sql

-- 1. Create whale_balances table (safe)
CREATE TABLE IF NOT EXISTS whale_balances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    address TEXT NOT NULL,
    chain TEXT NOT NULL DEFAULT 'ethereum',
    token_address TEXT,
    balance DECIMAL(36,18) NOT NULL,
    balance_usd DECIMAL(18,2),
    ts TIMESTAMP NOT NULL,
    
    -- Provenance fields
    provider TEXT NOT NULL,
    method TEXT NOT NULL,
    ingested_at TIMESTAMP DEFAULT NOW(),
    request_id TEXT,
    latency_ms INTEGER,
    
    -- Idempotency for EVM chains
    block_number BIGINT,
    idempotency_key TEXT GENERATED ALWAYS AS (
        CASE 
            WHEN chain IN ('ethereum', 'polygon', 'bsc', 'arbitrum', 'optimism') 
            THEN address || ':' || chain || ':' || COALESCE(block_number::text, '')
            ELSE address || ':' || chain || ':' || extract(epoch from ts)::text
        END
    ) STORED
);

-- Add unique constraint if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'whale_balances_idempotency_key_key') THEN
        ALTER TABLE whale_balances ADD CONSTRAINT whale_balances_idempotency_key_key UNIQUE(idempotency_key);
    END IF;
END $$;

-- 2. Create whale_transfers table (safe)
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
    
    -- Provenance fields
    provider TEXT NOT NULL,
    method TEXT NOT NULL,
    ingested_at TIMESTAMP DEFAULT NOW(),
    request_id TEXT,
    latency_ms INTEGER,
    
    -- EVM specific fields
    block_number BIGINT,
    log_index INTEGER,
    gas_used BIGINT,
    gas_price DECIMAL(36,18),
    
    -- Idempotency for EVM chains
    idempotency_key TEXT GENERATED ALWAYS AS (
        CASE 
            WHEN chain IN ('ethereum', 'polygon', 'bsc', 'arbitrum', 'optimism')
            THEN tx_hash || ':' || COALESCE(log_index::text, '0')
            ELSE tx_hash || ':' || extract(epoch from ts)::text
        END
    ) STORED
);

-- Add unique constraint if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'whale_transfers_idempotency_key_key') THEN
        ALTER TABLE whale_transfers ADD CONSTRAINT whale_transfers_idempotency_key_key UNIQUE(idempotency_key);
    END IF;
END $$;

-- 3. Recreate whale_signals with enhanced schema
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
    
    -- Provenance fields
    provider TEXT NOT NULL DEFAULT 'whale-analytics',
    method TEXT NOT NULL DEFAULT 'risk_computation',
    ingested_at TIMESTAMP DEFAULT NOW(),
    request_id TEXT,
    latency_ms INTEGER,
    
    -- Signal metadata
    risk_score INTEGER CHECK (risk_score >= 0 AND risk_score <= 100),
    alert_triggered BOOLEAN DEFAULT false,
    
    -- Idempotency
    idempotency_key TEXT GENERATED ALWAYS AS (
        address || ':' || chain || ':' || signal_type || ':' || extract(epoch from ts)::text
    ) STORED,
    
    UNIQUE(idempotency_key)
);

-- 4. Create indexes (safe - only if not exists)
DO $$
BEGIN
    -- Whale balances indexes
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_whale_balances_addr_chain_ts') THEN
        CREATE INDEX idx_whale_balances_addr_chain_ts ON whale_balances(address, chain, ts DESC);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_whale_balances_provider_ingested') THEN
        CREATE INDEX idx_whale_balances_provider_ingested ON whale_balances(provider, ingested_at DESC);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_whale_balances_balance_usd') THEN
        CREATE INDEX idx_whale_balances_balance_usd ON whale_balances(balance_usd DESC) WHERE balance_usd > 1000000;
    END IF;

    -- Whale transfers indexes  
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_whale_transfers_from_chain_ts') THEN
        CREATE INDEX idx_whale_transfers_from_chain_ts ON whale_transfers(from_address, chain, ts DESC);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_whale_transfers_to_chain_ts') THEN
        CREATE INDEX idx_whale_transfers_to_chain_ts ON whale_transfers(to_address, chain, ts DESC);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_whale_transfers_value_usd') THEN
        CREATE INDEX idx_whale_transfers_value_usd ON whale_transfers(value_usd DESC) WHERE value_usd > 100000;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_whale_transfers_tx_hash') THEN
        CREATE INDEX idx_whale_transfers_tx_hash ON whale_transfers(tx_hash);
    END IF;

    -- Whale signals indexes
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_whale_signals_addr_chain_ts') THEN
        CREATE INDEX idx_whale_signals_addr_chain_ts ON whale_signals(address, chain, ts DESC);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_whale_signals_confidence_risk') THEN
        CREATE INDEX idx_whale_signals_confidence_risk ON whale_signals(confidence DESC, risk_score DESC);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_whale_signals_type_ts') THEN
        CREATE INDEX idx_whale_signals_type_ts ON whale_signals(signal_type, ts DESC);
    END IF;
END $$;

-- 5. Enable RLS (safe)
ALTER TABLE whale_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE whale_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE whale_signals ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS policies (safe - drop existing first)
DO $$
BEGIN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Service role full access balances" ON whale_balances;
    DROP POLICY IF EXISTS "Authenticated read balances" ON whale_balances;
    DROP POLICY IF EXISTS "Service role full access transfers" ON whale_transfers;
    DROP POLICY IF EXISTS "Authenticated read transfers" ON whale_transfers;
    DROP POLICY IF EXISTS "Service role full access signals" ON whale_signals;
    DROP POLICY IF EXISTS "Authenticated read signals" ON whale_signals;
    
    -- Create new policies
    CREATE POLICY "Service role full access balances" ON whale_balances FOR ALL USING (true);
    CREATE POLICY "Authenticated read balances" ON whale_balances FOR SELECT USING (true);
    CREATE POLICY "Service role full access transfers" ON whale_transfers FOR ALL USING (true);  
    CREATE POLICY "Authenticated read transfers" ON whale_transfers FOR SELECT USING (true);
    CREATE POLICY "Service role full access signals" ON whale_signals FOR ALL USING (true);
    CREATE POLICY "Authenticated read signals" ON whale_signals FOR SELECT USING (true);
END $$;

-- 7. Create optimized view
DROP VIEW IF EXISTS whale_activity_summary;
CREATE VIEW whale_activity_summary AS
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

COMMIT;