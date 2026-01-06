-- Clean notification system setup
DO $$ 
BEGIN
  -- Create notification_logs table if not exists
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'notification_logs') THEN
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
    CREATE POLICY "notification_logs_user_policy" ON notification_logs FOR ALL USING (auth.uid() = user_id);
  END IF;

  -- Create push_subscriptions table if not exists
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'push_subscriptions') THEN
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
    CREATE POLICY "push_subscriptions_user_policy" ON push_subscriptions FOR ALL USING (auth.uid() = user_id);
  END IF;

  -- Add notification preferences to users table if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'notification_preferences') THEN
    ALTER TABLE users ADD COLUMN notification_preferences JSONB DEFAULT '{"email": true, "sms": false, "push": true}';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'phone') THEN
    ALTER TABLE users ADD COLUMN phone TEXT;
  END IF;
END $$;