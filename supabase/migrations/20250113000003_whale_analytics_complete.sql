-- Whale Analytics Complete Schema
CREATE TABLE IF NOT EXISTS whale_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
  whale_address TEXT NOT NULL,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('withdrawal', 'deposit', 'activity', 'balance')),
  threshold_amount DECIMAL,
  notification_method TEXT DEFAULT 'email' CHECK (notification_method IN ('email', 'push', 'both')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_watchlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
  whale_address TEXT NOT NULL,
  whale_label TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, whale_address)
);

CREATE TABLE IF NOT EXISTS shared_watchlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  creator_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
  is_public BOOLEAN DEFAULT false,
  follower_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS shared_watchlist_whales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  watchlist_id UUID REFERENCES shared_watchlists(id) ON DELETE CASCADE,
  whale_address TEXT NOT NULL,
  whale_label TEXT,
  added_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(watchlist_id, whale_address)
);

CREATE TABLE IF NOT EXISTS watchlist_followers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  watchlist_id UUID REFERENCES shared_watchlists(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
  followed_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(watchlist_id, user_id)
);

CREATE TABLE IF NOT EXISTS whale_data_cache (
  whale_address TEXT PRIMARY KEY,
  chain TEXT NOT NULL,
  balance DECIMAL,
  transaction_count INTEGER,
  last_activity TIMESTAMP,
  risk_score DECIMAL,
  wallet_type TEXT,
  cached_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '5 minutes')
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_whale_alerts_user_id ON whale_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_watchlists_user_id ON user_watchlists(user_id);
CREATE INDEX IF NOT EXISTS idx_shared_watchlists_public ON shared_watchlists(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_whale_data_cache_expires ON whale_data_cache(expires_at);

-- RLS Policies
ALTER TABLE whale_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_watchlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_watchlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_watchlist_whales ENABLE ROW LEVEL SECURITY;
ALTER TABLE watchlist_followers ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can manage their own alerts" ON whale_alerts
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own watchlists" ON user_watchlists
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view public shared watchlists" ON shared_watchlists
  FOR SELECT USING (is_public = true OR creator_id = auth.uid());

CREATE POLICY "Users can manage their own shared watchlists" ON shared_watchlists
  FOR ALL USING (creator_id = auth.uid());