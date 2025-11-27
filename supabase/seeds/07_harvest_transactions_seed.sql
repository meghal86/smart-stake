-- ============================================================================
-- HarvestPro Transaction Data Seed
-- Creates realistic transaction history for testing the Edge Function
-- ============================================================================

-- Get the test user ID (or create one if needed)
DO $$
DECLARE
  test_user_id UUID;
BEGIN
  -- Try to get existing test user
  SELECT id INTO test_user_id FROM auth.users LIMIT 1;
  
  -- If no user exists, create one
  IF test_user_id IS NULL THEN
    INSERT INTO auth.users (
      id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      role
    ) VALUES (
      gen_random_uuid(),
      'test@harvestpro.com',
      crypt('testpassword123', gen_salt('bf')),
      NOW(),
      NOW(),
      NOW(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{}'::jsonb,
      false,
      'authenticated'
    )
    RETURNING id INTO test_user_id;
    
    RAISE NOTICE 'Created test user: %', test_user_id;
  ELSE
    RAISE NOTICE 'Using existing user: %', test_user_id;
  END IF;

  -- Clear existing transaction data for this user
  DELETE FROM harvest_transactions WHERE user_id = test_user_id;
  
  RAISE NOTICE 'Inserting transaction history...';
  
  -- ============================================================================
  -- ETH Transactions (Will create loss opportunity)
  -- ============================================================================
  
  -- Buy 1: 2 ETH @ $3000 (Jan 2024)
  INSERT INTO harvest_transactions (
    id, user_id, token, chain, transaction_type, quantity, price_usd, 
    timestamp, wallet_address, transaction_hash, source, metadata
  ) VALUES (
    gen_random_uuid(),
    test_user_id,
    'ETH',
    'ethereum',
    'buy',
    2.0,
    3000.00,
    '2024-01-15 10:00:00'::timestamp,
    '0x1234567890123456789012345678901234567890',
    '0xabc123...',
    'wallet',
    '{"venue": "Uniswap", "gas_paid": 15.50}'::jsonb
  );
  
  -- Buy 2: 1.5 ETH @ $3200 (Feb 2024)
  INSERT INTO harvest_transactions (
    id, user_id, token, chain, transaction_type, quantity, price_usd, 
    timestamp, wallet_address, transaction_hash, source, metadata
  ) VALUES (
    gen_random_uuid(),
    test_user_id,
    'ETH',
    'ethereum',
    'buy',
    1.5,
    3200.00,
    '2024-02-20 14:30:00'::timestamp,
    '0x1234567890123456789012345678901234567890',
    '0xdef456...',
    'wallet',
    '{"venue": "Uniswap", "gas_paid": 18.20}'::jsonb
  );
  
  -- Sell: 1 ETH @ $2800 (March 2024) - Creates realized loss
  INSERT INTO harvest_transactions (
    id, user_id, token, chain, transaction_type, quantity, price_usd, 
    timestamp, wallet_address, transaction_hash, source, metadata
  ) VALUES (
    gen_random_uuid(),
    test_user_id,
    'ETH',
    'ethereum',
    'sell',
    1.0,
    2800.00,
    '2024-03-10 09:15:00'::timestamp,
    '0x1234567890123456789012345678901234567890',
    '0xghi789...',
    'wallet',
    '{"venue": "Uniswap", "gas_paid": 12.80}'::jsonb
  );
  
  -- Current holdings: 2.5 ETH with cost basis ~$3080
  -- Current price: ~$2400 (will be fetched from oracle)
  -- Unrealized loss: ~$1700
  
  -- ============================================================================
  -- MATIC Transactions (Will create loss opportunity)
  -- ============================================================================
  
  -- Buy 1: 10000 MATIC @ $1.20 (Jan 2024)
  INSERT INTO harvest_transactions (
    id, user_id, token, chain, transaction_type, quantity, price_usd, 
    timestamp, wallet_address, transaction_hash, source, metadata
  ) VALUES (
    gen_random_uuid(),
    test_user_id,
    'MATIC',
    'polygon',
    'buy',
    10000.0,
    1.20,
    '2024-01-20 11:00:00'::timestamp,
    '0x2345678901234567890123456789012345678901',
    '0xjkl012...',
    'wallet',
    '{"venue": "QuickSwap", "gas_paid": 2.50}'::jsonb
  );
  
  -- Buy 2: 5000 MATIC @ $1.10 (Feb 2024)
  INSERT INTO harvest_transactions (
    id, user_id, token, chain, transaction_type, quantity, price_usd, 
    timestamp, wallet_address, transaction_hash, source, metadata
  ) VALUES (
    gen_random_uuid(),
    test_user_id,
    'MATIC',
    'polygon',
    'buy',
    5000.0,
    1.10,
    '2024-02-25 16:45:00'::timestamp,
    '0x2345678901234567890123456789012345678901',
    '0xmno345...',
    'wallet',
    '{"venue": "QuickSwap", "gas_paid": 1.80}'::jsonb
  );
  
  -- Sell: 10000 MATIC @ $0.95 (March 2024) - Creates realized loss
  INSERT INTO harvest_transactions (
    id, user_id, token, chain, transaction_type, quantity, price_usd, 
    timestamp, wallet_address, transaction_hash, source, metadata
  ) VALUES (
    gen_random_uuid(),
    test_user_id,
    'MATIC',
    'polygon',
    'sell',
    10000.0,
    0.95,
    '2024-03-15 13:20:00'::timestamp,
    '0x2345678901234567890123456789012345678901',
    '0xpqr678...',
    'wallet',
    '{"venue": "QuickSwap", "gas_paid": 1.20}'::jsonb
  );
  
  -- Current holdings: 5000 MATIC with cost basis $1.10
  -- Current price: ~$0.56 (will be fetched from oracle)
  -- Unrealized loss: ~$2700
  
  -- ============================================================================
  -- LINK Transactions (Will create loss opportunity)
  -- ============================================================================
  
  -- Buy 1: 500 LINK @ $18.00 (Jan 2024)
  INSERT INTO harvest_transactions (
    id, user_id, token, chain, transaction_type, quantity, price_usd, 
    timestamp, wallet_address, transaction_hash, source, metadata
  ) VALUES (
    gen_random_uuid(),
    test_user_id,
    'LINK',
    'ethereum',
    'buy',
    500.0,
    18.00,
    '2024-01-25 08:30:00'::timestamp,
    '0x3456789012345678901234567890123456789012',
    '0xstu901...',
    'wallet',
    '{"venue": "SushiSwap", "gas_paid": 22.00}'::jsonb
  );
  
  -- Buy 2: 300 LINK @ $16.50 (Feb 2024)
  INSERT INTO harvest_transactions (
    id, user_id, token, chain, transaction_type, quantity, price_usd, 
    timestamp, wallet_address, transaction_hash, source, metadata
  ) VALUES (
    gen_random_uuid(),
    test_user_id,
    'LINK',
    'ethereum',
    'buy',
    300.0,
    16.50,
    '2024-02-28 12:00:00'::timestamp,
    '0x3456789012345678901234567890123456789012',
    '0xvwx234...',
    'wallet',
    '{"venue": "SushiSwap", "gas_paid": 19.50}'::jsonb
  );
  
  -- Sell: 650 LINK @ $15.00 (March 2024) - Creates realized loss
  INSERT INTO harvest_transactions (
    id, user_id, token, chain, transaction_type, quantity, price_usd, 
    timestamp, wallet_address, transaction_hash, source, metadata
  ) VALUES (
    gen_random_uuid(),
    test_user_id,
    'LINK',
    'ethereum',
    'sell',
    650.0,
    15.00,
    '2024-03-20 15:45:00'::timestamp,
    '0x3456789012345678901234567890123456789012',
    '0xyza567...',
    'wallet',
    '{"venue": "SushiSwap", "gas_paid": 25.00}'::jsonb
  );
  
  -- Current holdings: 150 LINK with cost basis ~$17.17
  -- Current price: ~$12.33 (will be fetched from oracle)
  -- Unrealized loss: ~$726
  
  -- ============================================================================
  -- BTC Transactions (Profitable - no loss opportunity)
  -- ============================================================================
  
  -- Buy: 0.5 BTC @ $40000 (Jan 2024)
  INSERT INTO harvest_transactions (
    id, user_id, token, chain, transaction_type, quantity, price_usd, 
    timestamp, wallet_address, transaction_hash, source, metadata
  ) VALUES (
    gen_random_uuid(),
    test_user_id,
    'BTC',
    'bitcoin',
    'buy',
    0.5,
    40000.00,
    '2024-01-10 09:00:00'::timestamp,
    '0x4567890123456789012345678901234567890123',
    '0xbcd890...',
    'wallet',
    '{"venue": "Native", "gas_paid": 5.00}'::jsonb
  );
  
  -- Current holdings: 0.5 BTC with cost basis $40000
  -- Current price: ~$65000 (will be fetched from oracle)
  -- Unrealized gain: ~$12500 (NO HARVEST OPPORTUNITY)
  
  -- ============================================================================
  -- SOL Transactions (Small loss - below threshold)
  -- ============================================================================
  
  -- Buy: 100 SOL @ $110 (Feb 2024)
  INSERT INTO harvest_transactions (
    id, user_id, token, chain, transaction_type, quantity, price_usd, 
    timestamp, wallet_address, transaction_hash, source, metadata
  ) VALUES (
    gen_random_uuid(),
    test_user_id,
    'SOL',
    'solana',
    'buy',
    100.0,
    110.00,
    '2024-02-05 10:30:00'::timestamp,
    '0x5678901234567890123456789012345678901234',
    '0xefg123...',
    'wallet',
    '{"venue": "Raydium", "gas_paid": 0.50}'::jsonb
  );
  
  -- Current holdings: 100 SOL with cost basis $110
  -- Current price: ~$109 (will be fetched from oracle)
  -- Unrealized loss: ~$100 (BELOW THRESHOLD - may not show)

  RAISE NOTICE 'Transaction seed complete!';
  RAISE NOTICE 'Total transactions inserted: 13';
  RAISE NOTICE 'Expected opportunities: 3 (ETH, MATIC, LINK)';
  RAISE NOTICE 'Expected total unrealized loss: ~$5,126';
  
END $$;
