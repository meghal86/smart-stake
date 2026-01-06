-- Create whale_balances table with proper schema
CREATE TABLE IF NOT EXISTS whale_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  address TEXT NOT NULL UNIQUE,
  chain TEXT NOT NULL DEFAULT 'ethereum',
  balance DECIMAL(36,18) NOT NULL DEFAULT 0,
  ts TIMESTAMP NOT NULL DEFAULT NOW(),
  provider TEXT NOT NULL DEFAULT 'alchemy',
  method TEXT NOT NULL DEFAULT 'eth_getBalance',
  ingested_at TIMESTAMP DEFAULT NOW()
);

-- Insert initial whale data
INSERT INTO whale_balances (address, chain, balance, ts, provider, method) VALUES
('0x47ac0Fb4F2D84898e4D9E7b4DaB3C24507a6D503', 'ethereum', 1250.5, NOW(), 'alchemy', 'eth_getBalance'),
('0x8315177aB297bA92A06054cE80a67Ed4DBd7ed3a', 'ethereum', 890.2, NOW(), 'alchemy', 'eth_getBalance'),
('0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6', 'ethereum', 2100.8, NOW(), 'alchemy', 'eth_getBalance'),
('0x1522900b6dafac587d499a862861c0869be6e428', 'ethereum', 500.0, NOW(), 'alchemy', 'eth_getBalance'),
('0xBE0eB53F46cd790Cd13851d5EFf43D12404d33E8', 'ethereum', 3200.1, NOW(), 'alchemy', 'eth_getBalance'),
('0xF977814e90dA44bFA03b6295A0616a897441aceC', 'ethereum', 4500.7, NOW(), 'alchemy', 'eth_getBalance'),
('0x28C6c06298d514Db089934071355E5743bf21d60', 'ethereum', 1800.3, NOW(), 'alchemy', 'eth_getBalance'),
('0x2FAF487A4414Fe77e2327F0bf4AE2a264a776AD2', 'ethereum', 950.6, NOW(), 'alchemy', 'eth_getBalance')
ON CONFLICT (address) DO UPDATE SET 
  balance = EXCLUDED.balance,
  ingested_at = NOW();