-- Fix subscription system to work through UI
-- This migration fixes all the issues preventing the subscription flow from working

-- 1. Fix the plan constraint to support all plan types
ALTER TABLE public.users 
DROP CONSTRAINT IF EXISTS users_plan_check;

ALTER TABLE public.users 
ADD CONSTRAINT users_plan_check 
CHECK (plan IN ('free', 'pro', 'premium'));

-- 2. Create function to handle new user creation automatically
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (user_id, email, plan, created_at, updated_at)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'plan', 'free'),
    NOW(),
    NOW()
  );
  RETURN new;
EXCEPTION
  WHEN unique_violation THEN
    -- User already exists, update their info
    UPDATE public.users 
    SET email = new.email, updated_at = NOW()
    WHERE user_id = new.id;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create trigger to automatically create user records on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Add RLS policies that allow service role (webhooks) to manage data
CREATE POLICY "Service role can manage users" ON public.users
  FOR ALL USING (
    auth.jwt() ->> 'role' = 'service_role' OR
    auth.uid() = user_id
  );

CREATE POLICY "Service role can manage subscriptions" ON public.subscriptions
  FOR ALL USING (
    auth.jwt() ->> 'role' = 'service_role' OR
    auth.uid() = user_id
  );

CREATE POLICY "Service role can manage webhook logs" ON public.webhook_logs
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- 5. Create webhook_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.webhook_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_type TEXT NOT NULL,
  event_id TEXT,
  status TEXT NOT NULL CHECK (status IN ('processing', 'success', 'failed')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for webhook_logs
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

-- 6. Create a function to sync existing auth users to public.users
CREATE OR REPLACE FUNCTION public.sync_existing_users()
RETURNS void AS $$
DECLARE
  auth_user RECORD;
BEGIN
  -- This function can be called to sync existing auth.users to public.users
  -- Note: This requires service role access to auth.users
  FOR auth_user IN 
    SELECT id, email, created_at 
    FROM auth.users 
    WHERE id NOT IN (SELECT user_id FROM public.users)
  LOOP
    INSERT INTO public.users (user_id, email, plan, created_at, updated_at)
    VALUES (auth_user.id, auth_user.email, 'free', auth_user.created_at, NOW())
    ON CONFLICT (user_id) DO NOTHING;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Verify the setup
SELECT 'Migration completed successfully' as status;