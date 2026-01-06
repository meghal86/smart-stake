-- Create risk_scores table for risk scanner functionality
CREATE TABLE IF NOT EXISTS risk_scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  address TEXT NOT NULL,
  risk_score INTEGER NOT NULL CHECK (risk_score >= 0 AND risk_score <= 100),
  risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  factors JSONB DEFAULT '{}',
  sanctions_check BOOLEAN DEFAULT false,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_risk_scores_address ON risk_scores(address);
CREATE INDEX IF NOT EXISTS idx_risk_scores_risk_level ON risk_scores(risk_level);
CREATE INDEX IF NOT EXISTS idx_risk_scores_last_updated ON risk_scores(last_updated);

-- Enable RLS
ALTER TABLE risk_scores ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users
CREATE POLICY "Users can view risk scores" ON risk_scores
  FOR SELECT USING (auth.role() = 'authenticated');

-- Insert sample data
INSERT INTO risk_scores (address, risk_score, risk_level, factors, sanctions_check) VALUES
('0x742d35Cc6634C0532925a3b8D4C9db4C532925a3', 15, 'low', '{"exchange_interaction": true, "large_transactions": false}', false),
('0x1234567890123456789012345678901234567890', 85, 'high', '{"mixer_usage": true, "sanctions_related": false}', false),
('0xabcdefabcdefabcdefabcdefabcdefabcdefabcd', 45, 'medium', '{"defi_interaction": true, "high_frequency": true}', false)
ON CONFLICT (address) DO NOTHING;