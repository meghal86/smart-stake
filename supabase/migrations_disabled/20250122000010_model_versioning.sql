-- Phase 2: Model lifecycle and A/B testing

CREATE TABLE IF NOT EXISTS model_versions (
  name TEXT PRIMARY KEY,
  family TEXT NOT NULL DEFAULT 'baseline',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT FALSE,
  rollout_percent INT DEFAULT 0 CHECK (rollout_percent >= 0 AND rollout_percent <= 100),
  description TEXT
);

CREATE TABLE IF NOT EXISTS model_assignments (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  model_name TEXT REFERENCES model_versions(name),
  assigned_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit events for enterprise compliance
CREATE TABLE IF NOT EXISTS audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id TEXT,
  meta JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_audit_user ON audit_events(user_id, created_at);
CREATE INDEX IF NOT EXISTS ix_audit_action ON audit_events(action, created_at);

-- RLS policies
ALTER TABLE model_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE model_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read active models" ON model_versions 
  FOR SELECT USING (is_active = true);

CREATE POLICY "Users can view their model assignment" ON model_assignments 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view their audit events" ON audit_events 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role manages all" ON model_versions 
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role manages assignments" ON model_assignments 
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role manages audit" ON audit_events 
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Seed initial model
INSERT INTO model_versions (name, family, is_active, rollout_percent, description) 
VALUES ('scn-v1.0', 'baseline', true, 100, 'Initial production model')
ON CONFLICT (name) DO NOTHING;