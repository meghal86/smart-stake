-- Advanced Features Database Schema

-- Teams for collaboration
CREATE TABLE IF NOT EXISTS teams (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    owner_id UUID REFERENCES auth.users(id),
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User profiles and team management
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) UNIQUE,
    role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'analyst', 'viewer')),
    team_id UUID REFERENCES teams(id),
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Shared watchlists
CREATE TABLE IF NOT EXISTS shared_watchlists (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    team_id UUID REFERENCES teams(id),
    whale_addresses TEXT[] DEFAULT '{}',
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Whale profiles with detailed data
CREATE TABLE IF NOT EXISTS whale_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    address TEXT NOT NULL UNIQUE,
    tags TEXT[] DEFAULT '{}',
    portfolio JSONB DEFAULT '{}',
    counterparties JSONB DEFAULT '{}',
    risk_history JSONB DEFAULT '{}',
    last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Alert history and management
CREATE TABLE IF NOT EXISTS alert_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    whale_address TEXT NOT NULL,
    alert_type TEXT NOT NULL,
    conditions JSONB NOT NULL,
    triggered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'muted', 'resolved')),
    read_at TIMESTAMPTZ
);

-- API keys and webhooks
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    key_name TEXT NOT NULL,
    key_hash TEXT NOT NULL,
    permissions TEXT[] DEFAULT '{}',
    usage_count INTEGER DEFAULT 0,
    last_used TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS webhooks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    url TEXT NOT NULL,
    events TEXT[] DEFAULT '{}',
    secret TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User achievements and gamification
CREATE TABLE IF NOT EXISTS user_achievements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    achievement_type TEXT NOT NULL,
    achievement_data JSONB DEFAULT '{}',
    earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_team_id ON user_profiles(team_id);
CREATE INDEX IF NOT EXISTS idx_teams_owner_id ON teams(owner_id);
CREATE INDEX IF NOT EXISTS idx_shared_watchlists_team_id ON shared_watchlists(team_id);
CREATE INDEX IF NOT EXISTS idx_whale_profiles_address ON whale_profiles(address);
CREATE INDEX IF NOT EXISTS idx_alert_history_user_id ON alert_history(user_id);
CREATE INDEX IF NOT EXISTS idx_alert_history_whale_address ON alert_history(whale_address);
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_webhooks_user_id ON webhooks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_watchlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE whale_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their own profile" ON user_profiles FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Team members can view team data" ON teams FOR SELECT USING (
    auth.uid() = owner_id OR 
    auth.uid() IN (SELECT user_id FROM user_profiles WHERE team_id = teams.id)
);
CREATE POLICY "Team members can view shared watchlists" ON shared_watchlists FOR SELECT USING (
    created_by = auth.uid() OR 
    team_id IN (SELECT team_id FROM user_profiles WHERE user_id = auth.uid())
);
CREATE POLICY "Users can view whale profiles" ON whale_profiles FOR SELECT TO authenticated;
CREATE POLICY "Users can manage their alert history" ON alert_history FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their API keys" ON api_keys FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their webhooks" ON webhooks FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view their achievements" ON user_achievements FOR SELECT USING (auth.uid() = user_id);