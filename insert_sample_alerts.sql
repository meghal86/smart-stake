-- Insert sample whale alerts into the database
INSERT INTO alerts (
  tx_hash,
  from_addr,
  to_addr,
  from_type,
  to_type,
  tx_type,
  amount_usd,
  token,
  chain,
  timestamp,
  created_at
) VALUES
(
  '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  '0x742d35Cc6634C0532925a3b8D4C9db4C532925a3',
  '0x8ba1f109eddd4bd1cffd8cb45b1e1cccf233b2b5',
  'wallet',
  'binance',
  'sell',
  2500000,
  'ETH',
  'ethereum',
  NOW() - INTERVAL '5 minutes',
  NOW()
),
(
  '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
  '0x3f5ce5fbfe3e9af3971dd833d26ba9b5c936f0be',
  '0x742d35Cc6634C0532925a3b8D4C9db4C532925a3',
  'binance',
  'wallet',
  'buy',
  1800000,
  'ETH',
  'ethereum',
  NOW() - INTERVAL '10 minutes',
  NOW()
),
(
  '0x9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba',
  '0x71660c4005ba85c37ccec55d0c4493e66fe775d3',
  '0x503828976d22510aad0201ac7ec88293211d23da',
  'coinbase',
  'coinbase',
  'exchange_transfer',
  5200000,
  'USDC',
  'ethereum',
  NOW() - INTERVAL '15 minutes',
  NOW()
),
(
  '0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321',
  '0x8ba1f109eddd4bd1cffd8cb45b1e1cccf233b2b5',
  '0x742d35Cc6634C0532925a3b8D4C9db4C532925a3',
  'wallet',
  'wallet',
  'transfer',
  750000,
  'ETH',
  'ethereum',
  NOW() - INTERVAL '20 minutes',
  NOW()
);