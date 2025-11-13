-- Add wallet labels to user_preferences table
-- This migration adds a JSONB column to store user-defined labels for wallet addresses
-- Format: { "0x1234...": "My Main Wallet", "0x5678...": "Trading Wallet" }

-- Add wallet_labels column to user_preferences
ALTER TABLE user_preferences 
ADD COLUMN IF NOT EXISTS wallet_labels JSONB DEFAULT '{}';

-- Add index for wallet_labels JSONB queries
CREATE INDEX IF NOT EXISTS idx_user_preferences_wallet_labels 
ON user_preferences USING GIN(wallet_labels);

-- Add comment
COMMENT ON COLUMN user_preferences.wallet_labels IS 'User-defined labels for wallet addresses. Format: { "address": "label" }';

-- Enable RLS on user_preferences if not already enabled
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_preferences if they don't exist
DO $$ 
BEGIN
  -- Check if policy exists before creating
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_preferences' 
    AND policyname = 'p_sel_user_prefs'
  ) THEN
    CREATE POLICY p_sel_user_prefs ON user_preferences
      FOR SELECT USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_preferences' 
    AND policyname = 'p_ins_user_prefs'
  ) THEN
    CREATE POLICY p_ins_user_prefs ON user_preferences
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_preferences' 
    AND policyname = 'p_upd_user_prefs'
  ) THEN
    CREATE POLICY p_upd_user_prefs ON user_preferences
      FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;

