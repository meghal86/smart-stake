-- Hunter System Migration
-- Creates tables and functions for Hunter gamification, XP, alerts, and achievements

-- Hunter alerts table
CREATE TABLE IF NOT EXISTS public.hunter_alerts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('new_quest', 'expiring_soon', 'reward_ready', 'quest_update')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  quest_id TEXT,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  action_label TEXT,
  action_url TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_hunter_alerts_user_id ON public.hunter_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_hunter_alerts_created_at ON public.hunter_alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_hunter_alerts_is_read ON public.hunter_alerts(user_id, is_read);

-- Enable RLS
ALTER TABLE public.hunter_alerts ENABLE ROW LEVEL SECURITY;

-- RLS policies for hunter_alerts
CREATE POLICY "Users can view their own alerts"
  ON public.hunter_alerts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own alerts"
  ON public.hunter_alerts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own alerts"
  ON public.hunter_alerts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own alerts"
  ON public.hunter_alerts FOR DELETE
  USING (auth.uid() = user_id);

-- Function to update hunter XP
CREATE OR REPLACE FUNCTION update_hunter_xp(
  p_user_id UUID,
  p_xp_amount INTEGER,
  p_reason TEXT DEFAULT 'quest_completed'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_metadata JSONB;
  v_current_xp INTEGER;
  v_completed_quests INTEGER;
  v_weekly_xp INTEGER;
BEGIN
  -- Get current metadata
  SELECT metadata INTO v_current_metadata
  FROM public.users_metadata
  WHERE user_id = p_user_id;

  -- Initialize if null
  IF v_current_metadata IS NULL THEN
    v_current_metadata := '{}'::jsonb;
  END IF;

  -- Get current values
  v_current_xp := COALESCE((v_current_metadata->>'hunter_xp')::integer, 0);
  v_completed_quests := COALESCE((v_current_metadata->>'completed_quests')::integer, 0);
  v_weekly_xp := COALESCE((v_current_metadata->>'weekly_xp')::integer, 0);

  -- Update values
  v_current_xp := v_current_xp + p_xp_amount;
  v_weekly_xp := v_weekly_xp + p_xp_amount;
  
  IF p_reason = 'quest_completed' THEN
    v_completed_quests := v_completed_quests + 1;
  END IF;

  -- Update metadata
  v_current_metadata := jsonb_set(v_current_metadata, '{hunter_xp}', to_jsonb(v_current_xp));
  v_current_metadata := jsonb_set(v_current_metadata, '{completed_quests}', to_jsonb(v_completed_quests));
  v_current_metadata := jsonb_set(v_current_metadata, '{weekly_xp}', to_jsonb(v_weekly_xp));
  v_current_metadata := jsonb_set(v_current_metadata, '{last_xp_update}', to_jsonb(NOW()::text));

  -- Upsert metadata
  INSERT INTO public.users_metadata (user_id, metadata)
  VALUES (p_user_id, v_current_metadata)
  ON CONFLICT (user_id)
  DO UPDATE SET 
    metadata = v_current_metadata,
    updated_at = NOW();
END;
$$;

-- Function to unlock hunter badge
CREATE OR REPLACE FUNCTION unlock_hunter_badge(
  p_user_id UUID,
  p_badge_id TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_metadata JSONB;
  v_unlocked_badges JSONB;
  v_badge_exists BOOLEAN;
BEGIN
  -- Get current metadata
  SELECT metadata INTO v_current_metadata
  FROM public.users_metadata
  WHERE user_id = p_user_id;

  -- Initialize if null
  IF v_current_metadata IS NULL THEN
    v_current_metadata := '{}'::jsonb;
  END IF;

  -- Get unlocked badges array
  v_unlocked_badges := COALESCE(v_current_metadata->'unlocked_badges', '[]'::jsonb);

  -- Check if badge already exists
  SELECT EXISTS(
    SELECT 1 FROM jsonb_array_elements(v_unlocked_badges) AS badge
    WHERE badge->>'id' = p_badge_id
  ) INTO v_badge_exists;

  -- Only add if doesn't exist
  IF NOT v_badge_exists THEN
    v_unlocked_badges := v_unlocked_badges || jsonb_build_object(
      'id', p_badge_id,
      'unlockedAt', NOW()::text
    );

    -- Update metadata
    v_current_metadata := jsonb_set(v_current_metadata, '{unlocked_badges}', v_unlocked_badges);

    -- Upsert metadata
    INSERT INTO public.users_metadata (user_id, metadata)
    VALUES (p_user_id, v_current_metadata)
    ON CONFLICT (user_id)
    DO UPDATE SET 
      metadata = v_current_metadata,
      updated_at = NOW();
  END IF;
END;
$$;

-- Function to reset weekly XP (run via cron)
CREATE OR REPLACE FUNCTION reset_weekly_hunter_xp()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.users_metadata
  SET metadata = jsonb_set(
    COALESCE(metadata, '{}'::jsonb),
    '{weekly_xp}',
    '0'::jsonb
  )
  WHERE metadata->>'weekly_xp' IS NOT NULL;
END;
$$;

-- Create updated_at trigger for hunter_alerts
CREATE OR REPLACE FUNCTION update_hunter_alerts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER hunter_alerts_updated_at
  BEFORE UPDATE ON public.hunter_alerts
  FOR EACH ROW
  EXECUTE FUNCTION update_hunter_alerts_updated_at();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.hunter_alerts TO authenticated;
GRANT EXECUTE ON FUNCTION update_hunter_xp TO authenticated;
GRANT EXECUTE ON FUNCTION unlock_hunter_badge TO authenticated;
GRANT EXECUTE ON FUNCTION reset_weekly_hunter_xp TO service_role;

-- Sample data for testing (optional, remove in production)
-- INSERT INTO public.hunter_alerts (user_id, type, title, message, priority)
-- SELECT 
--   auth.uid(),
--   'new_quest',
--   'New Opportunity Available!',
--   'A high-yield staking opportunity just appeared',
--   'high'
-- WHERE auth.uid() IS NOT NULL;

COMMENT ON TABLE public.hunter_alerts IS 'Stores real-time alerts and notifications for Hunter users';
COMMENT ON FUNCTION update_hunter_xp IS 'Updates user XP and quest completion count';
COMMENT ON FUNCTION unlock_hunter_badge IS 'Unlocks achievement badges for users';
COMMENT ON FUNCTION reset_weekly_hunter_xp IS 'Resets weekly XP counters (run via cron)';




