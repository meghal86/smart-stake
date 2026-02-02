-- Migration: Hunter Quests Module Schema
-- Adds quest-specific columns to opportunities table and creates user_quest_progress table

-- Add quest-specific columns to opportunities table
ALTER TABLE opportunities
ADD COLUMN IF NOT EXISTS quest_steps JSONB,
ADD COLUMN IF NOT EXISTS quest_difficulty TEXT CHECK (quest_difficulty IN ('easy', 'medium', 'hard')),
ADD COLUMN IF NOT EXISTS xp_reward INTEGER,
ADD COLUMN IF NOT EXISTS quest_type TEXT;

-- Create user_quest_progress table for tracking quest completion
CREATE TABLE IF NOT EXISTS user_quest_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  current_step INTEGER DEFAULT 0,
  completed_steps JSONB DEFAULT '[]'::JSONB,
  xp_earned INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  UNIQUE (user_id, opportunity_id, wallet_address)
);

-- Create index for fast lookups by user and opportunity
CREATE INDEX IF NOT EXISTS idx_user_quest_progress_user_opp 
ON user_quest_progress (user_id, opportunity_id);

-- Create index for fast lookups by wallet address
CREATE INDEX IF NOT EXISTS idx_user_quest_progress_wallet 
ON user_quest_progress (wallet_address);

-- Enable RLS on user_quest_progress
ALTER TABLE user_quest_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see their own quest progress
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_quest_progress' 
    AND policyname = 'p_user_quest_progress_user'
  ) THEN
    CREATE POLICY p_user_quest_progress_user
    ON user_quest_progress
    FOR ALL
    USING (auth.uid() = user_id);
  END IF;
END $$;

-- Comment on table
COMMENT ON TABLE user_quest_progress IS 'Tracks user progress through multi-step quests';
COMMENT ON COLUMN user_quest_progress.current_step IS 'Current step index (0-based)';
COMMENT ON COLUMN user_quest_progress.completed_steps IS 'Array of completed step indices';
COMMENT ON COLUMN user_quest_progress.xp_earned IS 'Total XP earned from this quest';
