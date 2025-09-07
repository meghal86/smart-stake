-- Advanced Risk Scanner Tables Only (avoiding conflicts)

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
    alert_threshold BIGINT DEFAULT 10000,
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
    source TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_risk_reports_wallet_address ON risk_reports(wallet_address);
CREATE INDEX IF NOT EXISTS idx_wallet_monitoring_user_id ON wallet_monitoring(user_id);
CREATE INDEX IF NOT EXISTS idx_risky_addresses_address ON risky_addresses(address);
CREATE INDEX IF NOT EXISTS idx_compliance_alerts_wallet ON compliance_alerts(wallet_address);

-- Insert sample risky addresses
INSERT INTO risky_addresses (address, risk_type, risk_level, source, description) VALUES
('0x0000000000000000000000000000000000000000', 'scam', 'high', 'internal', 'Null address'),
('0x000000000000000000000000000000000000dEaD', 'scam', 'high', 'internal', 'Burn address'),
('0x8589427373D6D84E98730D7795D8f6f8731FDA16', 'mixer', 'high', 'chainalysis', 'Known mixer'),
('0x3f5CE5FBFe3E9af3971dD833D26bA9b5C936f0bE', 'exchange', 'low', 'internal', 'Binance Hot Wallet')
ON CONFLICT (address) DO NOTHING;