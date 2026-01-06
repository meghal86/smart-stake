-- Clean fix for alert tables
-- Drop existing tables and recreate with correct structure

-- Drop existing tables if they exist
DROP TABLE IF EXISTS alert_rule_history CASCADE;
DROP TABLE IF EXISTS alert_rules CASCADE;
DROP TABLE IF EXISTS alert_templates CASCADE;

-- Create alert_rules table
CREATE TABLE alert_rules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  conditions JSONB NOT NULL DEFAULT '[]'::jsonb,
  logic_operator TEXT NOT NULL DEFAULT 'AND' CHECK (logic_operator IN ('AND', 'OR', 'NOR')),
  time_window_hours INTEGER,
  frequency_limit INTEGER DEFAULT 10,
  delivery_channels JSONB NOT NULL DEFAULT '{"push": true}'::jsonb,
  webhook_url TEXT,
  priority INTEGER DEFAULT 3 CHECK (priority BETWEEN 1 AND 5),
  is_active BOOLEAN DEFAULT true,
  times_triggered INTEGER DEFAULT 0,
  last_triggered_at TIMESTAMPTZ,
  whale_address TEXT,
  hysteresis_percent NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create alert_rule_history table
CREATE TABLE alert_rule_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  alert_rule_id UUID REFERENCES alert_rules(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  alert_id UUID,
  matched_conditions JSONB NOT NULL DEFAULT '{}'::jsonb,
  delivery_status JSONB NOT NULL DEFAULT '{}'::jsonb,
  triggered_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create alert_templates table
CREATE TABLE alert_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('whale', 'defi', 'security', 'trading')),
  template_conditions JSONB NOT NULL DEFAULT '[]'::jsonb,
  default_logic_operator TEXT NOT NULL DEFAULT 'AND',
  suggested_delivery_channels JSONB NOT NULL DEFAULT '{"push": true}'::jsonb,
  is_premium BOOLEAN DEFAULT false,
  popularity_score INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_alert_rules_user_id ON alert_rules(user_id);
CREATE INDEX idx_alert_rules_active ON alert_rules(is_active) WHERE is_active = true;
CREATE INDEX idx_alert_rule_history_user_id ON alert_rule_history(user_id);
CREATE INDEX idx_alert_rule_history_triggered_at ON alert_rule_history(triggered_at DESC);
CREATE INDEX idx_alert_templates_category ON alert_templates(category);

-- Enable RLS
ALTER TABLE alert_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_rule_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_templates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage their own alert rules" ON alert_rules
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own alert history" ON alert_rule_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can view alert templates" ON alert_templates
  FOR SELECT USING (auth.role() = 'authenticated');

-- Insert default templates
INSERT INTO alert_templates (name, description, category, template_conditions, default_logic_operator, suggested_delivery_channels, is_premium) VALUES
('Large ETH Movements', 'Alert for ETH transactions over $1M', 'whale', '[{"type": "amount", "operator": "gte", "value": 1000000, "currency": "USD"}, {"type": "token", "operator": "eq", "value": "ETH"}]'::jsonb, 'AND', '{"push": true, "email": false}'::jsonb, false),
('Whale Activity', 'Monitor known whale addresses', 'whale', '[{"type": "whale_tag", "operator": "is_whale", "value": true}, {"type": "amount", "operator": "gte", "value": 500000, "currency": "USD"}]'::jsonb, 'AND', '{"push": true, "email": true}'::jsonb, false),
('DeFi Large Deposits', 'Track large DeFi protocol deposits', 'defi', '[{"type": "amount", "operator": "gte", "value": 2000000, "currency": "USD"}, {"type": "direction", "operator": "eq", "value": "deposit"}]'::jsonb, 'AND', '{"push": true, "webhook": false}'::jsonb, true),
('Cross-Chain Arbitrage', 'Detect potential arbitrage opportunities', 'trading', '[{"type": "amount", "operator": "gte", "value": 100000, "currency": "USD"}, {"type": "time_window", "operator": "within", "value": 1, "unit": "hours"}]'::jsonb, 'AND', '{"push": true, "email": true}'::jsonb, true);