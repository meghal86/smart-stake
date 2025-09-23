-- Create user portfolio addresses table
CREATE TABLE IF NOT EXISTS user_portfolio_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  address TEXT NOT NULL,
  label TEXT NOT NULL,
  address_group TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, address)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_portfolio_addresses_user_id ON user_portfolio_addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_user_portfolio_addresses_address ON user_portfolio_addresses(address);

-- Enable RLS
ALTER TABLE user_portfolio_addresses ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage their own portfolio addresses" 
ON user_portfolio_addresses 
FOR ALL USING (auth.uid() = user_id);

-- Create function to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger
CREATE TRIGGER update_user_portfolio_addresses_updated_at 
    BEFORE UPDATE ON user_portfolio_addresses 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();