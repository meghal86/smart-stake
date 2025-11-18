-- HarvestPro Seed Data
-- Description: Sample data for development and testing

-- Note: This seed data will only insert if a user exists in auth.users
-- To use this seed data, either:
-- 1. Sign up a user in your application first, then run this seed
-- 2. Replace the user_id variable below with an actual user ID from your auth.users table

-- ============================================================================
-- GET OR CREATE TEST USER
-- ============================================================================

DO $$
DECLARE
  v_test_user_id UUID;
BEGIN
  -- Try to get the first user from auth.users
  SELECT id INTO v_test_user_id
  FROM auth.users
  LIMIT 1;

  -- If no user exists, skip seeding and show a message
  IF v_test_user_id IS NULL THEN
    RAISE NOTICE 'No users found in auth.users. Please sign up a user first, then run this seed script.';
    RAISE NOTICE 'Skipping HarvestPro seed data insertion.';
    RETURN;
  END IF;

  RAISE NOTICE 'Using user ID: %', v_test_user_id;

  -- ============================================================================
  -- SAMPLE USER SETTINGS
  -- ============================================================================

  INSERT INTO harvest_user_settings (
    user_id,
    tax_rate,
    notifications_enabled,
    notification_threshold,
    preferred_wallets,
    risk_tolerance
  ) VALUES (
    v_test_user_id,
    0.24, -- 24% tax rate
    true,
    100, -- $100 minimum notification threshold
    ARRAY['0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb'],
    'moderate'
  ) ON CONFLICT (user_id) DO UPDATE SET
    tax_rate = EXCLUDED.tax_rate,
    notifications_enabled = EXCLUDED.notifications_enabled,
    notification_threshold = EXCLUDED.notification_threshold,
    preferred_wallets = EXCLUDED.preferred_wallets,
    risk_tolerance = EXCLUDED.risk_tolerance;

  -- ============================================================================
  -- SAMPLE WALLET TRANSACTIONS
  -- ============================================================================

  -- ETH transactions
  INSERT INTO wallet_transactions (
    user_id,
    wallet_address,
    token,
    transaction_hash,
    transaction_type,
    quantity,
    price_usd,
    timestamp
  ) VALUES
    -- Buy ETH at $2000
    (
      v_test_user_id,
      '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
      'ETH',
      '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      'buy',
      5.0,
      2000.00,
      NOW() - INTERVAL '400 days'
    ),
    -- Buy more ETH at $2500
    (
      v_test_user_id,
      '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
      'ETH',
      '0x2234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      'buy',
      3.0,
      2500.00,
      NOW() - INTERVAL '200 days'
    )
  ON CONFLICT (transaction_hash, wallet_address) DO NOTHING;

  -- LINK token transactions (potential loss)
  INSERT INTO wallet_transactions (
    user_id,
    wallet_address,
    token,
    transaction_hash,
    transaction_type,
    quantity,
    price_usd,
    timestamp
  ) VALUES
    -- Buy LINK at $25
    (
      v_test_user_id,
      '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
      'LINK',
      '0x3234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      'buy',
      1000.0,
      25.00,
      NOW() - INTERVAL '180 days'
    ),
    -- Buy more LINK at $30
    (
      v_test_user_id,
      '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
      'LINK',
      '0x4234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      'buy',
      500.0,
      30.00,
      NOW() - INTERVAL '90 days'
    )
  ON CONFLICT (transaction_hash, wallet_address) DO NOTHING;

  -- UNI token transactions (potential loss)
  INSERT INTO wallet_transactions (
    user_id,
    wallet_address,
    token,
    transaction_hash,
    transaction_type,
    quantity,
    price_usd,
    timestamp
  ) VALUES
    -- Buy UNI at $12
    (
      v_test_user_id,
      '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
      'UNI',
      '0x5234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      'buy',
      2000.0,
      12.00,
      NOW() - INTERVAL '300 days'
    )
  ON CONFLICT (transaction_hash, wallet_address) DO NOTHING;

  -- ============================================================================
  -- SAMPLE CEX ACCOUNT
  -- ============================================================================

  INSERT INTO cex_accounts (
    user_id,
    exchange_name,
    api_key_encrypted,
    api_secret_encrypted,
    is_active,
    last_synced_at
  ) VALUES (
    v_test_user_id,
    'Binance',
    'encrypted_api_key_placeholder',
    'encrypted_api_secret_placeholder',
    true,
    NOW() - INTERVAL '1 hour'
  ) ON CONFLICT DO NOTHING;

  -- ============================================================================
  -- SAMPLE CEX TRADES
  -- ============================================================================

  DECLARE
    v_cex_account_id UUID;
  BEGIN
    -- Get the CEX account we just created
    SELECT id INTO v_cex_account_id
    FROM cex_accounts
    WHERE user_id = v_test_user_id
    AND exchange_name = 'Binance'
    LIMIT 1;

    IF v_cex_account_id IS NOT NULL THEN
      -- BTC trades on CEX
      INSERT INTO cex_trades (
        cex_account_id,
        user_id,
        token,
        trade_type,
        quantity,
        price_usd,
        timestamp
      ) VALUES
        -- Buy BTC at $45000
        (
          v_cex_account_id,
          v_test_user_id,
          'BTC',
          'buy',
          0.5,
          45000.00,
          NOW() - INTERVAL '250 days'
        ),
        -- Buy more BTC at $50000
        (
          v_cex_account_id,
          v_test_user_id,
          'BTC',
          'buy',
          0.3,
          50000.00,
          NOW() - INTERVAL '150 days'
        )
      ON CONFLICT (cex_account_id, token, timestamp) DO NOTHING;

      -- SOL trades on CEX (potential loss)
      INSERT INTO cex_trades (
        cex_account_id,
        user_id,
        token,
        trade_type,
        quantity,
        price_usd,
        timestamp
      ) VALUES
        -- Buy SOL at $150
        (
          v_cex_account_id,
          v_test_user_id,
          'SOL',
          'buy',
          100.0,
          150.00,
          NOW() - INTERVAL '120 days'
        )
      ON CONFLICT (cex_account_id, token, timestamp) DO NOTHING;
    END IF;
  END;

-- ============================================================================
-- SAMPLE PRICE DATA (simulated current prices for loss scenarios)
-- ============================================================================

-- Note: In production, prices come from the price oracle
-- This is just for reference in seed data comments

-- Current simulated prices (for loss calculation):
-- ETH: $1800 (loss from $2000 and $2500 purchases)
-- LINK: $18 (loss from $25 and $30 purchases)
-- UNI: $8 (loss from $12 purchase)
-- BTC: $42000 (loss from $45000 and $50000 purchases)
-- SOL: $100 (loss from $150 purchase)

  -- ============================================================================
  -- SAMPLE HARVEST LOTS (calculated from transactions)
  -- ============================================================================

  -- ETH Lot 1 (long-term, eligible)
  INSERT INTO harvest_lots (
    user_id,
    token,
    wallet_or_cex,
    acquired_at,
    acquired_qty,
    acquired_price_usd,
    current_price_usd,
    unrealized_pnl,
    holding_period_days,
    long_term,
    risk_level,
    liquidity_score,
    guardian_score,
    eligible_for_harvest
  ) VALUES (
    v_test_user_id,
  'ETH',
  '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
  NOW() - INTERVAL '400 days',
  5.0,
  2000.00,
  1800.00,
  -1000.00, -- (1800 - 2000) * 5 = -1000
  400,
  true,
  'LOW',
  95.0,
  8.5,
  true
) ON CONFLICT DO NOTHING;

  -- ETH Lot 2 (short-term, eligible)
  INSERT INTO harvest_lots (
    user_id,
    token,
    wallet_or_cex,
    acquired_at,
    acquired_qty,
    acquired_price_usd,
    current_price_usd,
    unrealized_pnl,
    holding_period_days,
    long_term,
    risk_level,
    liquidity_score,
    guardian_score,
    eligible_for_harvest
  ) VALUES (
    v_test_user_id,
  'ETH',
  '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
  NOW() - INTERVAL '200 days',
  3.0,
  2500.00,
  1800.00,
  -2100.00, -- (1800 - 2500) * 3 = -2100
  200,
  false,
  'LOW',
  95.0,
  8.5,
  true
) ON CONFLICT DO NOTHING;

-- LINK Lot 1 (short-term, eligible)
INSERT INTO harvest_lots (
  user_id,
  token,
  wallet_or_cex,
  acquired_at,
  acquired_qty,
  acquired_price_usd,
  current_price_usd,
  unrealized_pnl,
  holding_period_days,
  long_term,
  risk_level,
  liquidity_score,
  guardian_score,
  eligible_for_harvest
) VALUES (
    v_test_user_id,
    'LINK',
    '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
    NOW() - INTERVAL '180 days',
    1000.0,
    25.00,
    18.00,
    -7000.00, -- (18 - 25) * 1000 = -7000
    180,
    false,
    'MEDIUM',
    75.0,
    6.0,
    true
  ) ON CONFLICT DO NOTHING;

  -- LINK Lot 2 (short-term, eligible)
  INSERT INTO harvest_lots (
    user_id,
    token,
    wallet_or_cex,
    acquired_at,
    acquired_qty,
    acquired_price_usd,
    current_price_usd,
    unrealized_pnl,
    holding_period_days,
    long_term,
    risk_level,
    liquidity_score,
    guardian_score,
    eligible_for_harvest
  ) VALUES (
    v_test_user_id,
    'LINK',
    '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
    NOW() - INTERVAL '90 days',
    500.0,
    30.00,
    18.00,
    -6000.00, -- (18 - 30) * 500 = -6000
    90,
    false,
    'MEDIUM',
    75.0,
    6.0,
    true
  ) ON CONFLICT DO NOTHING;

  -- UNI Lot (long-term, eligible)
  INSERT INTO harvest_lots (
    user_id,
    token,
    wallet_or_cex,
    acquired_at,
    acquired_qty,
    acquired_price_usd,
    current_price_usd,
    unrealized_pnl,
    holding_period_days,
    long_term,
    risk_level,
    liquidity_score,
    guardian_score,
    eligible_for_harvest
  ) VALUES (
    v_test_user_id,
    'UNI',
    '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
    NOW() - INTERVAL '300 days',
    2000.0,
    12.00,
    8.00,
    -8000.00, -- (8 - 12) * 2000 = -8000
    300,
    false,
    'MEDIUM',
    80.0,
    7.0,
    true
  ) ON CONFLICT DO NOTHING;

  -- BTC Lot 1 (CEX, short-term, eligible)
  INSERT INTO harvest_lots (
    user_id,
    token,
    wallet_or_cex,
    acquired_at,
    acquired_qty,
    acquired_price_usd,
    current_price_usd,
    unrealized_pnl,
    holding_period_days,
    long_term,
    risk_level,
    liquidity_score,
    guardian_score,
    eligible_for_harvest
  ) VALUES (
    v_test_user_id,
    'BTC',
    'Binance',
    NOW() - INTERVAL '250 days',
    0.5,
    45000.00,
    42000.00,
    -1500.00, -- (42000 - 45000) * 0.5 = -1500
    250,
    false,
    'LOW',
    98.0,
    9.0,
    true
  ) ON CONFLICT DO NOTHING;

  -- BTC Lot 2 (CEX, short-term, eligible)
  INSERT INTO harvest_lots (
    user_id,
    token,
    wallet_or_cex,
    acquired_at,
    acquired_qty,
    acquired_price_usd,
    current_price_usd,
    unrealized_pnl,
    holding_period_days,
    long_term,
    risk_level,
    liquidity_score,
    guardian_score,
    eligible_for_harvest
  ) VALUES (
    v_test_user_id,
    'BTC',
    'Binance',
    NOW() - INTERVAL '150 days',
    0.3,
    50000.00,
    42000.00,
    -2400.00, -- (42000 - 50000) * 0.3 = -2400
    150,
    false,
    'LOW',
    98.0,
    9.0,
    true
  ) ON CONFLICT DO NOTHING;

  -- SOL Lot (CEX, short-term, eligible)
  INSERT INTO harvest_lots (
    user_id,
    token,
    wallet_or_cex,
    acquired_at,
    acquired_qty,
    acquired_price_usd,
    current_price_usd,
    unrealized_pnl,
    holding_period_days,
    long_term,
    risk_level,
    liquidity_score,
    guardian_score,
    eligible_for_harvest
  ) VALUES (
    v_test_user_id,
    'SOL',
    'Binance',
    NOW() - INTERVAL '120 days',
    100.0,
    150.00,
    100.00,
    -5000.00, -- (100 - 150) * 100 = -5000
    120,
    false,
    'MEDIUM',
    85.0,
    7.5,
    true
  ) ON CONFLICT DO NOTHING;

  -- ============================================================================
  -- SAMPLE HARVEST OPPORTUNITIES (calculated from lots)
  -- ============================================================================

  -- ETH Opportunity 1 (high benefit, long-term)
  INSERT INTO harvest_opportunities (
    lot_id,
    user_id,
    token,
    token_logo_url,
    risk_level,
    unrealized_loss,
    remaining_qty,
    gas_estimate,
    slippage_estimate,
    trading_fees,
    net_tax_benefit,
    guardian_score,
    execution_time_estimate,
    confidence,
    recommendation_badge,
    metadata
  )
  SELECT
    lot_id,
    user_id,
    token,
    'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
    risk_level,
    1000.00, -- unrealized loss
    acquired_qty,
    15.00, -- gas estimate
    5.00, -- slippage estimate
    2.00, -- trading fees
    218.00, -- net benefit: (1000 * 0.24) - 15 - 5 - 2 = 218
    guardian_score,
    '5-10 min',
    95,
    'recommended',
    jsonb_build_object(
      'walletName', 'Main Wallet',
      'venue', 'Uniswap V3',
      'reasons', ARRAY['Long-term capital loss', 'High liquidity', 'Low gas cost']
    )
  FROM harvest_lots
  WHERE token = 'ETH' AND holding_period_days = 400
  LIMIT 1
  ON CONFLICT DO NOTHING;

  -- LINK Opportunity 1 (high benefit, short-term)
  INSERT INTO harvest_opportunities (
    lot_id,
    user_id,
    token,
    token_logo_url,
    risk_level,
    unrealized_loss,
    remaining_qty,
    gas_estimate,
    slippage_estimate,
    trading_fees,
    net_tax_benefit,
    guardian_score,
    execution_time_estimate,
    confidence,
    recommendation_badge,
    metadata
  )
  SELECT
    lot_id,
    user_id,
    token,
    'https://assets.coingecko.com/coins/images/877/small/chainlink.png',
    risk_level,
    7000.00, -- unrealized loss
    acquired_qty,
    18.00, -- gas estimate
    25.00, -- slippage estimate
    5.00, -- trading fees
    1632.00, -- net benefit: (7000 * 0.24) - 18 - 25 - 5 = 1632
    guardian_score,
    '5-10 min',
    90,
    'high-benefit',
    jsonb_build_object(
      'walletName', 'Main Wallet',
      'venue', 'Uniswap V3',
      'reasons', ARRAY['Large unrealized loss', 'Good liquidity', 'Moderate risk']
    )
  FROM harvest_lots
  WHERE token = 'LINK' AND holding_period_days = 180
  LIMIT 1
  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'HarvestPro seed data inserted successfully for user: %', v_test_user_id;
END $$;

-- ============================================================================
-- SAMPLE GUARDIAN SCORES (for reference)
-- ============================================================================

-- Note: In production, Guardian scores come from the Guardian API
-- Sample scores used in seed data:
-- ETH: 8.5 (LOW risk)
-- LINK: 6.0 (MEDIUM risk)
-- UNI: 7.0 (MEDIUM risk)
-- BTC: 9.0 (LOW risk)
-- SOL: 7.5 (MEDIUM risk)

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Uncomment to verify seed data:
-- SELECT COUNT(*) as wallet_transactions FROM wallet_transactions;
-- SELECT COUNT(*) as cex_trades FROM cex_trades;
-- SELECT COUNT(*) as harvest_lots FROM harvest_lots;
-- SELECT COUNT(*) as harvest_opportunities FROM harvest_opportunities;
-- SELECT * FROM harvest_opportunities ORDER BY net_tax_benefit DESC;
