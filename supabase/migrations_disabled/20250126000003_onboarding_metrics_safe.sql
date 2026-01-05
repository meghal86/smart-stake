-- Onboarding Metrics & Analytics System
-- Safe version with minimal dependencies

-- Onboarding events table
CREATE TABLE IF NOT EXISTS onboarding_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  event_type TEXT NOT NULL,
  event_metadata JSONB DEFAULT '{}',
  session_id TEXT,
  user_agent TEXT,
  referrer TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Onboarding sessions table
CREATE TABLE IF NOT EXISTS onboarding_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL UNIQUE,
  user_id UUID,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  last_event_at TIMESTAMPTZ,
  current_step TEXT,
  steps_completed TEXT[] DEFAULT '{}',
  total_events INTEGER DEFAULT 0,
  time_to_complete_seconds INTEGER,
  abandoned BOOLEAN DEFAULT FALSE,
  abandoned_at TIMESTAMPTZ,
  conversion_type TEXT,
  user_plan TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Onboarding funnel metrics
CREATE TABLE IF NOT EXISTS onboarding_funnel_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID UNIQUE,
  signup_date TIMESTAMPTZ NOT NULL,
  email_verified_date TIMESTAMPTZ,
  first_login_date TIMESTAMPTZ,
  tour_started_date TIMESTAMPTZ,
  tour_completed_date TIMESTAMPTZ,
  first_alert_date TIMESTAMPTZ,
  first_dashboard_view_date TIMESTAMPTZ,
  onboarding_completed_date TIMESTAMPTZ,
  subscription_upgraded_date TIMESTAMPTZ,
  time_to_email_verify INTEGER,
  time_to_first_login INTEGER,
  time_to_tour_complete INTEGER,
  time_to_first_alert INTEGER,
  time_to_onboarding_complete INTEGER,
  time_to_upgrade INTEGER,
  total_sessions INTEGER DEFAULT 0,
  total_events INTEGER DEFAULT 0,
  features_discovered TEXT[] DEFAULT '{}',
  tour_steps_completed INTEGER DEFAULT 0,
  tour_steps_total INTEGER DEFAULT 7,
  funnel_stage TEXT,
  completion_percentage INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Drop-off analysis table
CREATE TABLE IF NOT EXISTS onboarding_dropoffs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  session_id TEXT,
  drop_off_step TEXT NOT NULL,
  last_completed_step TEXT,
  time_spent_seconds INTEGER,
  events_before_dropoff INTEGER,
  potential_reasons TEXT[],
  detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  recovered BOOLEAN DEFAULT FALSE,
  recovered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_onboarding_events_user_id ON onboarding_events(user_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_events_type ON onboarding_events(event_type);
CREATE INDEX IF NOT EXISTS idx_onboarding_events_timestamp ON onboarding_events(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_onboarding_sessions_user_id ON onboarding_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_sessions_session_id ON onboarding_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_funnel_user_id ON onboarding_funnel_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_funnel_stage ON onboarding_funnel_metrics(funnel_stage);
CREATE INDEX IF NOT EXISTS idx_onboarding_dropoffs_user_id ON onboarding_dropoffs(user_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_dropoffs_step ON onboarding_dropoffs(drop_off_step);

-- Enable RLS
ALTER TABLE onboarding_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_funnel_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_dropoffs ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (users can view their own data)
CREATE POLICY "Users can view their own onboarding events"
  ON onboarding_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own sessions"
  ON onboarding_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own funnel metrics"
  ON onboarding_funnel_metrics FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can manage all
CREATE POLICY "Service role can manage onboarding events"
  ON onboarding_events FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role can manage sessions"
  ON onboarding_sessions FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role can manage funnel metrics"
  ON onboarding_funnel_metrics FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role can manage dropoffs"
  ON onboarding_dropoffs FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

COMMENT ON TABLE onboarding_events IS 'Detailed event-level tracking for user onboarding journey';
COMMENT ON TABLE onboarding_sessions IS 'Session-level onboarding tracking with completion metrics';
COMMENT ON TABLE onboarding_funnel_metrics IS 'Aggregated per-user funnel metrics and time-to-completion data';
COMMENT ON TABLE onboarding_dropoffs IS 'Drop-off detection and recovery tracking';

