-- Advanced Risk Scanner Database Schema

-- Risk reports table for detailed compliance tracking
CREATE TABLE IF NOT EXISTS risk_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    wallet_address TEXT NOT NULL,
    risk_score INTEGER NOT NULL CHECK (risk_score >= 1 AND risk_score <= 10),
    risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'medium', 'high')),
    risk_factors TEXT[] DEFAULT '{}',
    compliance_flags TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Wallet monitoring table for real-time alerts
CREATE TABLE IF NOT EXISTS wallet_monitoring (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    wallet_address TEXT NOT NULL,
    risk_score INTEGER NOT NULL,
    alert_threshold BIGINT DEFAULT 10000, -- Alert on transactions above this USD value
    monitoring_enabled BOOLEAN DEFAULT true,
    last_scan TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, wallet_address)
);

-- Risky addresses database for compliance checking
CREATE TABLE IF NOT EXISTS risky_addresses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    address TEXT NOT NULL UNIQUE,
    risk_type TEXT NOT NULL CHECK (risk_type IN ('mixer', 'scam', 'darknet', 'sanctions', 'exchange')),
    risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'medium', 'high')),
    source TEXT, -- OFAC, FATF, internal, etc.
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transaction analysis cache for performance
CREATE TABLE IF NOT EXISTS transaction_analysis_cache (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    wallet_address TEXT NOT NULL,
    analysis_data JSONB NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '1 hour'),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(wallet_address)
);

-- Compliance alerts for regulatory tracking
CREATE TABLE IF NOT EXISTS compliance_alerts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    wallet_address TEXT NOT NULL,
    alert_type TEXT NOT NULL CHECK (alert_type IN ('sanctions', 'aml_risk', 'address_poisoning', 'suspicious_pattern')),
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    description TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_risk_reports_wallet_address ON risk_reports(wallet_address);
CREATE INDEX IF NOT EXISTS idx_risk_reports_created_at ON risk_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wallet_monitoring_user_id ON wallet_monitoring(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_monitoring_wallet_address ON wallet_monitoring(wallet_address);
CREATE INDEX IF NOT EXISTS idx_risky_addresses_address ON risky_addresses(address);
CREATE INDEX IF NOT EXISTS idx_risky_addresses_risk_type ON risky_addresses(risk_type);
CREATE INDEX IF NOT EXISTS idx_transaction_analysis_cache_wallet ON transaction_analysis_cache(wallet_address);
CREATE INDEX IF NOT EXISTS idx_transaction_analysis_cache_expires ON transaction_analysis_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_compliance_alerts_wallet ON compliance_alerts(wallet_address);
CREATE INDEX IF NOT EXISTS idx_compliance_alerts_severity ON compliance_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_compliance_alerts_resolved ON compliance_alerts(resolved);

-- Row Level Security (RLS) policies
ALTER TABLE risk_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_monitoring ENABLE ROW LEVEL SECURITY;
ALTER TABLE risky_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_analysis_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for risk_reports (admin access only)
CREATE POLICY "Admin can view all risk reports" ON risk_reports
    FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Service role can manage risk reports" ON risk_reports
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- RLS Policies for wallet_monitoring (users can only see their own)
CREATE POLICY "Users can view own wallet monitoring" ON wallet_monitoring
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own wallet monitoring" ON wallet_monitoring
    FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for risky_addresses (read-only for authenticated users)
CREATE POLICY "Authenticated users can view risky addresses" ON risky_addresses
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Service role can manage risky addresses" ON risky_addresses
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- RLS Policies for transaction_analysis_cache (service access only)
CREATE POLICY "Service role can manage analysis cache" ON transaction_analysis_cache
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- RLS Policies for compliance_alerts (admin access only)
CREATE POLICY "Admin can view compliance alerts" ON compliance_alerts
    FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Service role can manage compliance alerts" ON compliance_alerts
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Insert sample risky addresses for testing
INSERT INTO risky_addresses (address, risk_type, risk_level, source, description) VALUES
('0x0000000000000000000000000000000000000000', 'scam', 'high', 'internal', 'Null address - commonly used in scams'),
('0x000000000000000000000000000000000000dEaD', 'scam', 'high', 'internal', 'Burn address - potential scam indicator'),
('0x8589427373D6D84E98730D7795D8f6f8731FDA16', 'mixer', 'high', 'chainalysis', 'Known cryptocurrency mixer'),
('0x722122dF12D4e14e13Ac3b6895a86e84145b6967', 'mixer', 'high', 'chainalysis', 'Tornado Cash related address'),
('0x3f5CE5FBFe3E9af3971dD833D26bA9b5C936f0bE', 'exchange', 'low', 'internal', 'Binance Hot Wallet'),
('0x28C6c06298d514Db089934071355E5743bf21d60', 'exchange', 'low', 'internal', 'Binance 14'),
('0x71660c4005ba85c37ccec55d0c4493e66fe775d3', 'exchange', 'low', 'internal', 'Coinbase Wallet')
ON CONFLICT (address) DO NOTHING;

-- Function to clean up expired cache entries
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS void AS $$
BEGIN
    DELETE FROM transaction_analysis_cache WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to clean up cache (requires pg_cron extension)
-- SELECT cron.schedule('cleanup-cache', '0 * * * *', 'SELECT cleanup_expired_cache();');