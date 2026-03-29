-- Sample whale alert data for testing
INSERT INTO whale_alert_events (
  id, chain, tx_hash, from_addr, to_addr, amount_usd, symbol, detected_at, labels
) VALUES 
(
  'test_1',
  'ETH',
  '0x123...abc',
  '0x1234567890123456789012345678901234567890',
  '0x0987654321098765432109876543210987654321',
  5000000,
  'ETH',
  NOW() - INTERVAL '2 hours',
  '{"to_entity": "Binance", "from_entity": "Unknown"}'::jsonb
),
(
  'test_2', 
  'BTC',
  '0x456...def',
  '0x2345678901234567890123456789012345678901',
  '0x1987654321098765432109876543210987654321',
  12000000,
  'BTC',
  NOW() - INTERVAL '4 hours',
  '{"to_entity": "Unknown", "from_entity": "Coinbase"}'::jsonb
),
(
  'test_3',
  'ETH', 
  '0x789...ghi',
  '0x3456789012345678901234567890123456789012',
  '0x2987654321098765432109876543210987654321',
  8500000,
  'USDT',
  NOW() - INTERVAL '6 hours',
  '{"to_entity": "OKX", "from_entity": "Unknown"}'::jsonb
)
ON CONFLICT (id) DO NOTHING;