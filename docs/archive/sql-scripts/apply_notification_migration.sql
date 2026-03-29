-- Check if notification tables exist and create only if they don't
DO $$
BEGIN
    -- Create notification_logs table if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'notification_logs') THEN
        CREATE TABLE notification_logs (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            type TEXT NOT NULL,
            title TEXT NOT NULL,
            message TEXT NOT NULL,
            channels TEXT[] NOT NULL,
            results JSONB,
            priority TEXT DEFAULT 'medium',
            sent_at TIMESTAMPTZ DEFAULT NOW(),
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        CREATE INDEX idx_notification_logs_user_id ON notification_logs(user_id);
        CREATE INDEX idx_notification_logs_sent_at ON notification_logs(sent_at);
        
        ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "Users can view own notification logs" ON notification_logs
            FOR SELECT USING (auth.uid() = user_id);
    END IF;

    -- Create push_subscriptions table if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'push_subscriptions') THEN
        CREATE TABLE push_subscriptions (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            endpoint TEXT NOT NULL,
            p256dh TEXT NOT NULL,
            auth TEXT NOT NULL,
            active BOOLEAN DEFAULT true,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        CREATE INDEX idx_push_subscriptions_user_id ON push_subscriptions(user_id);
        CREATE INDEX idx_push_subscriptions_active ON push_subscriptions(active);
        
        ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "Users can manage own push subscriptions" ON push_subscriptions
            FOR ALL USING (auth.uid() = user_id);
    END IF;

    -- Add notification preferences column to users table if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'notification_preferences') THEN
        ALTER TABLE users ADD COLUMN notification_preferences JSONB DEFAULT '{"email": true, "sms": false, "push": true}';
    END IF;

    -- Add phone column to users table if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'phone') THEN
        ALTER TABLE users ADD COLUMN phone TEXT;
    END IF;

END $$;