-- Fix Advanced Features - Add missing tables and constraints

-- Teams table (if not exists)
CREATE TABLE IF NOT EXISTS teams (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    owner_id UUID REFERENCES auth.users(id),
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User profiles table (if not exists)
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) UNIQUE,
    role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'analyst', 'viewer')),
    team_id UUID,
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add team_id foreign key if column exists but constraint doesn't
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'team_id') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'user_profiles_team_id_fkey') THEN
            ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_team_id_fkey FOREIGN KEY (team_id) REFERENCES teams(id);
        END IF;
    END IF;
END $$;

-- Shared watchlists table (if not exists)
CREATE TABLE IF NOT EXISTS shared_watchlists (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    team_id UUID REFERENCES teams(id),
    whale_addresses TEXT[] DEFAULT '{}',
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on new tables
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_watchlists ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Users can manage their own profile" ON user_profiles;
CREATE POLICY "Users can manage their own profile" ON user_profiles FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Team members can view team data" ON teams;
CREATE POLICY "Team members can view team data" ON teams FOR SELECT USING (
    auth.uid() = owner_id OR 
    auth.uid() IN (SELECT user_id FROM user_profiles WHERE team_id = teams.id)
);

DROP POLICY IF EXISTS "Team members can view shared watchlists" ON shared_watchlists;
CREATE POLICY "Team members can view shared watchlists" ON shared_watchlists FOR SELECT USING (
    team_id IN (SELECT team_id FROM user_profiles WHERE user_id = auth.uid())
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_team_id ON user_profiles(team_id);
CREATE INDEX IF NOT EXISTS idx_teams_owner_id ON teams(owner_id);
CREATE INDEX IF NOT EXISTS idx_shared_watchlists_team_id ON shared_watchlists(team_id);