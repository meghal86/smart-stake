-- Add whale preference columns to existing user_preferences table
ALTER TABLE user_preferences 
ADD COLUMN IF NOT EXISTS whale_min_amount DECIMAL DEFAULT 1000000,
ADD COLUMN IF NOT EXISTS whale_chains TEXT[] DEFAULT ARRAY['ethereum'],
ADD COLUMN IF NOT EXISTS whale_exclude_exchanges BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS whale_notifications BOOLEAN DEFAULT TRUE;