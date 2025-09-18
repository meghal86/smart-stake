-- Premium Features Migration: Market Maker Flow Sentinel, Multi-Channel Alerts, NFT Whale Tracking

-- FEATURE 1: Market Maker Flow Sentinel
CREATE TABLE market_maker_flows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ NOT NULL,
  source_exchange TEXT NOT NULL,
  source_address TEXT NOT NULL,
  destination_mm TEXT NOT NULL,
  destination_address TEXT NOT NULL,
  token TEXT NOT NULL,
  amount DECIMAL NOT NULL,
  amount_usd DECIMAL NOT NULL,
  flow_type TEXT CHECK (flow_type IN ('inbound', 'outbound', 'rebalance')),
  confidence_score DECIMAL CHECK (confidence_score >= 0 AND confidence_score <= 1),
  market_impact_prediction DECIMAL,
  signal_strength TEXT CHECK (signal_strength IN ('weak', 'moderate', 'strong')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE mm_flow_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flow_id UUID REFERENCES market_maker_flows(id),
  signal_type TEXT NOT NULL,
  confidence DECIMAL NOT NULL,
  predicted_price_impact DECIMAL,
  timeframe TEXT NOT NULL,
  reasoning JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE market_maker_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  address TEXT UNIQUE NOT NULL,
  entity_name TEXT NOT NULL,
  entity_type TEXT CHECK (entity_type IN ('market_maker', 'exchange', 'fund')),
  chains TEXT[] DEFAULT ARRAY['ethereum'],
  is_active BOOLEAN DEFAULT true,
  confidence_level TEXT CHECK (confidence_level IN ('high', 'medium', 'low')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- FEATURE 2: Multi-Channel Alert Delivery
CREATE TABLE alert_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  channel_type TEXT CHECK (channel_type IN ('push', 'email', 'webhook', 'sms')),
  endpoint TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  subscription_tier_required TEXT CHECK (subscription_tier_required IN ('free', 'premium', 'enterprise')),
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE alert_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id UUID NOT NULL,
  channel_id UUID REFERENCES alert_channels(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('pending', 'sent', 'failed', 'rate_limited')),
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  delivery_metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE alert_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  channel_type TEXT NOT NULL,
  template_content TEXT NOT NULL,
  variables JSONB DEFAULT '{}',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- FEATURE 3: NFT Whale Tracking
CREATE TABLE nft_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_address TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  floor_price_eth DECIMAL DEFAULT 0,
  volume_24h_eth DECIMAL DEFAULT 0,
  total_supply INTEGER DEFAULT 0,
  is_monitored BOOLEAN DEFAULT false,
  whale_threshold_usd DECIMAL DEFAULT 100000,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE nft_whale_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_hash TEXT UNIQUE NOT NULL,
  block_number BIGINT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  from_address TEXT NOT NULL,
  to_address TEXT NOT NULL,
  contract_address TEXT REFERENCES nft_collections(contract_address),
  token_id TEXT NOT NULL,
  collection_name TEXT NOT NULL,
  collection_slug TEXT NOT NULL,
  transaction_type TEXT CHECK (transaction_type IN ('sale', 'transfer', 'mint', 'burn')),
  marketplace TEXT CHECK (marketplace IN ('opensea', 'blur', 'looksrare', 'x2y2', 'direct')),
  price_eth DECIMAL,
  price_usd DECIMAL,
  rarity_rank INTEGER,
  is_whale_transaction BOOLEAN DEFAULT false,
  whale_threshold_met TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE nft_whale_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  address TEXT UNIQUE NOT NULL,
  label TEXT,
  total_nft_value_usd DECIMAL DEFAULT 0,
  collection_count INTEGER DEFAULT 0,
  is_verified_whale BOOLEAN DEFAULT false,
  last_activity TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance Indexes
CREATE INDEX idx_mm_flows_timestamp ON market_maker_flows(timestamp DESC);
CREATE INDEX idx_mm_flows_token ON market_maker_flows(token);
CREATE INDEX idx_mm_addresses_address ON market_maker_addresses(address);
CREATE INDEX idx_alert_channels_user ON alert_channels(user_id);
CREATE INDEX idx_alert_deliveries_status ON alert_deliveries(status);
CREATE INDEX idx_nft_whale_txs_timestamp ON nft_whale_transactions(timestamp DESC);
CREATE INDEX idx_nft_whale_txs_collection ON nft_whale_transactions(contract_address);
CREATE INDEX idx_nft_whale_txs_price ON nft_whale_transactions(price_usd DESC);

-- Insert sample market maker addresses
INSERT INTO market_maker_addresses (address, entity_name, entity_type, confidence_level) VALUES
('0x4f3a120E72C76c22ae802D129F599BFDbc31cb81', 'Wintermute', 'market_maker', 'high'),
('0x151e24A486D7258dd7C33Fb67E4bB01919B7B32c', 'Jump Trading', 'market_maker', 'high'),
('0xf977814e90da44bfa03b6295a0616a897441acec', 'Alameda Research', 'market_maker', 'high'),
('0x1111111254EEB25477B68fb85Ed929f73A960582', 'Galaxy Digital', 'market_maker', 'high');

-- Insert sample NFT collections
INSERT INTO nft_collections (contract_address, name, slug, is_monitored, whale_threshold_usd) VALUES
('0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D', 'Bored Ape Yacht Club', 'boredapeyachtclub', true, 100000),
('0x60E4d786628Fea6478F785A6d7e704777c86a7c6', 'Mutant Ape Yacht Club', 'mutant-ape-yacht-club', true, 50000),
('0xED5AF388653567Af2F388E6224dC7C4b3241C544', 'Azuki', 'azuki', true, 75000),
('0x23581767a106ae21c074b2276D25e5C3e136a68b', 'Moonbirds', 'proof-moonbirds', true, 60000);

-- Insert default alert templates
INSERT INTO alert_templates (name, channel_type, template_content, is_default) VALUES
('Whale Alert Email', 'email', '🐋 Whale Alert: {{token}} ${{amount_usd}} transaction detected from {{from_addr}} to {{to_addr}}', true),
('Webhook Alert', 'webhook', '{"event": "whale_alert", "data": {"token": "{{token}}", "amount_usd": {{amount_usd}}, "from": "{{from_addr}}", "to": "{{to_addr}}"}}', true);