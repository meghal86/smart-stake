-- Final fix for wallet persistence issues
-- This addresses RLS permissions, duplicate handling, and ensures proper wallet loading

-- 1. First, ensure the table exists with correct structure
CREATE TABLE IF NOT EXISTS user_wallets (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    address text NOT NULL,
    address_lc text GENERATED ALWAYS AS (lower(address)) STORED,
    chain_namespace text NOT NULL DEFAULT 'eip155:1',
    label text,
    network_metadata jsonb DEFAULT '{}',
    balance_cache jsonb DEFAULT '{}',
    guardian_scores jsonb DEFAULT '{}',
    is_primary boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 2. Ensure unique constraint exists (this prevents duplicates)
DO $$ 
BEGIN
    -- Drop existing constraint if it exists
    ALTER TABLE user_wallets DROP CONSTRAINT IF EXISTS uq_user_wallets_user_addr_chain;
    
    -- Add the constraint
    ALTER TABLE user_wallets ADD CONSTRAINT uq_user_wallets_user_addr_chain 
        UNIQUE (user_id, address_lc, chain_namespace);
EXCEPTION
    WHEN duplicate_table THEN
        -- Constraint already exists, ignore
        NULL;
END $$;

-- 3. Create index for performance
CREATE INDEX IF NOT EXISTS idx_user_wallets_user_id ON user_wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_user_wallets_address_lc ON user_wallets(address_lc);

-- 4. Enable RLS
ALTER TABLE user_wallets ENABLE ROW LEVEL SECURITY;

-- 5. Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can view their own wallets" ON user_wallets;
DROP POLICY IF EXISTS "Users can insert their own wallets" ON user_wallets;
DROP POLICY IF EXISTS "Users can update their own wallets" ON user_wallets;
DROP POLICY IF EXISTS "Users can delete their own wallets" ON user_wallets;

-- 6. Create comprehensive RLS policies
CREATE POLICY "Users can view their own wallets" ON user_wallets
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own wallets" ON user_wallets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own wallets" ON user_wallets
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own wallets" ON user_wallets
    FOR DELETE USING (auth.uid() = user_id);

-- 7. Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_user_wallets_updated_at ON user_wallets;
CREATE TRIGGER update_user_wallets_updated_at
    BEFORE UPDATE ON user_wallets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 8. Grant necessary permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON user_wallets TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- 9. Verify the setup
DO $$
DECLARE
    policy_count integer;
    constraint_exists boolean;
BEGIN
    -- Check policies exist
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE tablename = 'user_wallets' AND schemaname = 'public';
    
    IF policy_count < 4 THEN
        RAISE EXCEPTION 'Not all RLS policies were created. Expected 4, got %', policy_count;
    END IF;
    
    -- Check unique constraint exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'user_wallets' 
        AND constraint_name = 'uq_user_wallets_user_addr_chain'
    ) INTO constraint_exists;
    
    IF NOT constraint_exists THEN
        RAISE EXCEPTION 'Unique constraint uq_user_wallets_user_addr_chain was not created';
    END IF;
    
    RAISE NOTICE 'Wallet persistence setup completed successfully';
    RAISE NOTICE 'Policies created: %', policy_count;
    RAISE NOTICE 'Unique constraint exists: %', constraint_exists;
END $$;

-- 10. Clean up any orphaned or duplicate entries (optional - run with caution)
-- Uncomment the following if you want to clean up existing data:

/*
-- Remove exact duplicates (keeping the oldest one)
DELETE FROM user_wallets 
WHERE id NOT IN (
    SELECT DISTINCT ON (user_id, address_lc, chain_namespace) id
    FROM user_wallets 
    ORDER BY user_id, address_lc, chain_namespace, created_at ASC
);
*/

-- Show final table structure for verification
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'user_wallets' 
ORDER BY ordinal_position;