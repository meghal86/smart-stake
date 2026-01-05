-- Create whale classifications table
CREATE TABLE IF NOT EXISTS whale_classifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    address TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL CHECK (type IN ('trader', 'hodler', 'liquidity_provider')),
    confidence DECIMAL(3,2) NOT NULL DEFAULT 0.5,
    signals TEXT[] DEFAULT '{}',
    risk_score INTEGER NOT NULL DEFAULT 5 CHECK (risk_score >= 1 AND risk_score <= 10),
    last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create whale transactions table
CREATE TABLE IF NOT EXISTS whale_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    address TEXT NOT NULL,
    transactions JSONB NOT NULL DEFAULT '[]',
    balance DECIMAL(20,8) NOT NULL DEFAULT 0,
    provider TEXT NOT NULL,
    last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create whale signals table for real-time alerts
CREATE TABLE IF NOT EXISTS whale_signals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    address TEXT NOT NULL,
    signal_type TEXT NOT NULL,
    signal_data JSONB NOT NULL DEFAULT '{}',
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    triggered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create whale behavior patterns table
CREATE TABLE IF NOT EXISTS whale_behavior_patterns (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    address TEXT NOT NULL,
    pattern_type TEXT NOT NULL,
    pattern_data JSONB NOT NULL DEFAULT '{}',
    confidence DECIMAL(3,2) NOT NULL DEFAULT 0.5,
    detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_whale_classifications_address ON whale_classifications(address);
CREATE INDEX IF NOT EXISTS idx_whale_classifications_type ON whale_classifications(type);
CREATE INDEX IF NOT EXISTS idx_whale_classifications_risk_score ON whale_classifications(risk_score);
CREATE INDEX IF NOT EXISTS idx_whale_transactions_address ON whale_transactions(address);
CREATE INDEX IF NOT EXISTS idx_whale_signals_address ON whale_signals(address);
CREATE INDEX IF NOT EXISTS idx_whale_signals_active ON whale_signals(is_active);
CREATE INDEX IF NOT EXISTS idx_whale_patterns_address ON whale_behavior_patterns(address);

-- Enable Row Level Security
ALTER TABLE whale_classifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE whale_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE whale_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE whale_behavior_patterns ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allow all for now, restrict in production)
CREATE POLICY "Allow all operations on whale_classifications" ON whale_classifications FOR ALL USING (true);
CREATE POLICY "Allow all operations on whale_transactions" ON whale_transactions FOR ALL USING (true);
CREATE POLICY "Allow all operations on whale_signals" ON whale_signals FOR ALL USING (true);
CREATE POLICY "Allow all operations on whale_behavior_patterns" ON whale_behavior_patterns FOR ALL USING (true);

-- Create function to update last_updated timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for auto-updating timestamps
CREATE TRIGGER update_whale_classifications_updated_at BEFORE UPDATE ON whale_classifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_whale_transactions_updated_at BEFORE UPDATE ON whale_transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();