-- Migration: Create users_metadata table for flexible user info storage
CREATE TABLE IF NOT EXISTS users_metadata (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Index for efficient user lookup
CREATE INDEX IF NOT EXISTS idx_users_metadata_user_id ON users_metadata(user_id);
-- Index for efficient JSONB field queries
CREATE INDEX IF NOT EXISTS idx_users_metadata_metadata ON users_metadata USING GIN (metadata);
