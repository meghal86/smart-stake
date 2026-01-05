-- Guardian Smart Automation Schema
-- Enable RLS on all tables
ALTER TABLE IF EXISTS guardian_automations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS guardian_automation_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS guardian_automation_logs ENABLE ROW LEVEL SECURITY;

-- Guardian Automations table - tracks user opt-in status
CREATE TABLE IF NOT EXISTS guardian_automations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  smart_wallet_address TEXT NOT NULL,
  eoa_address TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'disabled')),
  automation_type TEXT NOT NULL DEFAULT 'revoke' CHECK (automation_type IN ('revoke', 'maintenance')),
  gas_policy TEXT NOT NULL DEFAULT 'sponsored' CHECK (gas_policy IN ('sponsored', 'user_pays', 'subscription')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Guardian Automation Policies - user-defined rules
CREATE TABLE IF NOT EXISTS guardian_automation_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_id UUID NOT NULL REFERENCES guardian_automations(id) ON DELETE CASCADE,
  policy_type TEXT NOT NULL CHECK (policy_type IN ('auto_revoke', 'allowlist', 'denylist', 'threshold')),
  policy_data JSONB NOT NULL DEFAULT '{}',
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Guardian Automation Logs - audit trail
CREATE TABLE IF NOT EXISTS guardian_automation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_id UUID NOT NULL REFERENCES guardian_automations(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN ('revoke', 'scan', 'maintenance')),
  trigger_reason TEXT NOT NULL,
  tx_hash TEXT,
  contract_address TEXT,
  token_address TEXT,
  trust_score_before DECIMAL,
  trust_score_after DECIMAL,
  gas_cost_wei BIGINT,
  gas_price_gwei DECIMAL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'submitted', 'confirmed', 'failed', 'reverted')),
  error_message TEXT,
  relayer_request_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ
);

-- RLS Policies
CREATE POLICY "Users can view their own automations" ON guardian_automations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own automations" ON guardian_automations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own automations" ON guardian_automations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own policies" ON guardian_automation_policies
  FOR SELECT USING (
    automation_id IN (
      SELECT id FROM guardian_automations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their own policies" ON guardian_automation_policies
  FOR ALL USING (
    automation_id IN (
      SELECT id FROM guardian_automations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view their own logs" ON guardian_automation_logs
  FOR SELECT USING (
    automation_id IN (
      SELECT id FROM guardian_automations WHERE user_id = auth.uid()
    )
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_guardian_automations_user_id ON guardian_automations(user_id);
CREATE INDEX IF NOT EXISTS idx_guardian_automations_status ON guardian_automations(status);
CREATE INDEX IF NOT EXISTS idx_guardian_automation_policies_automation_id ON guardian_automation_policies(automation_id);
CREATE INDEX IF NOT EXISTS idx_guardian_automation_logs_automation_id ON guardian_automation_logs(automation_id);
CREATE INDEX IF NOT EXISTS idx_guardian_automation_logs_created_at ON guardian_automation_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_guardian_automation_logs_tx_hash ON guardian_automation_logs(tx_hash);

-- Functions
CREATE OR REPLACE FUNCTION update_guardian_automation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER update_guardian_automations_updated_at
  BEFORE UPDATE ON guardian_automations
  FOR EACH ROW EXECUTE FUNCTION update_guardian_automation_updated_at();

CREATE TRIGGER update_guardian_automation_policies_updated_at
  BEFORE UPDATE ON guardian_automation_policies
  FOR EACH ROW EXECUTE FUNCTION update_guardian_automation_updated_at();