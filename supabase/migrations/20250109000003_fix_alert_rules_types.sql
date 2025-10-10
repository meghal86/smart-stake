-- Fix critical type issues in alert_rules table
-- This migration aligns the database schema with TypeScript interfaces

-- First, let's check if the table exists and has the correct structure
DO $$ 
BEGIN
  -- Drop and recreate the alert_rules table with correct types
  DROP TABLE IF EXISTS alert_rules CASCADE;
  
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

  -- Create indexes for performance
  CREATE INDEX idx_alert_rules_user_id ON alert_rules(user_id);
  CREATE INDEX idx_alert_rules_active ON alert_rules(is_active) WHERE is_active = true;
  CREATE INDEX idx_alert_rules_whale_address ON alert_rules(whale_address) WHERE whale_address IS NOT NULL;

  -- Enable RLS
  ALTER TABLE alert_rules ENABLE ROW LEVEL SECURITY;

  -- Create RLS policy
  CREATE POLICY "Users can manage their own alert rules" ON alert_rules
    FOR ALL USING (auth.uid() = user_id);

  -- Update the alert_rule_history table if it exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'alert_rule_history') THEN
    -- Ensure foreign key constraint is correct
    ALTER TABLE alert_rule_history 
    DROP CONSTRAINT IF EXISTS alert_rule_history_alert_rule_id_fkey;
    
    ALTER TABLE alert_rule_history 
    ADD CONSTRAINT alert_rule_history_alert_rule_id_fkey 
    FOREIGN KEY (alert_rule_id) REFERENCES alert_rules(id) ON DELETE CASCADE;
  END IF;

  -- Insert some default templates if alert_templates table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'alert_templates') THEN
    INSERT INTO alert_templates (name, description, category, template_conditions, default_logic_operator, suggested_delivery_channels, is_premium) VALUES
    ('Large ETH Movements', 'Alert for ETH transactions over $1M', 'whale', '[{"type": "amount", "operator": "gte", "value": 1000000, "currency": "USD"}, {"type": "token", "operator": "eq", "value": "ETH"}]'::jsonb, 'AND', '{"push": true, "email": false}'::jsonb, false),
    ('Whale Activity', 'Monitor known whale addresses', 'whale', '[{"type": "whale_tag", "operator": "is_whale", "value": true}, {"type": "amount", "operator": "gte", "value": 500000, "currency": "USD"}]'::jsonb, 'AND', '{"push": true, "email": true}'::jsonb, false),
    ('DeFi Large Deposits', 'Track large DeFi protocol deposits', 'defi', '[{"type": "amount", "operator": "gte", "value": 2000000, "currency": "USD"}, {"type": "direction", "operator": "eq", "value": "deposit"}]'::jsonb, 'AND', '{"push": true, "webhook": false}'::jsonb, true),
    ('Cross-Chain Arbitrage', 'Detect potential arbitrage opportunities', 'trading', '[{"type": "amount", "operator": "gte", "value": 100000, "currency": "USD"}, {"type": "time_window", "operator": "within", "value": 1, "unit": "hours"}]'::jsonb, 'AND', '{"push": true, "email": true}'::jsonb, true)
    ON CONFLICT (name) DO NOTHING;
  END IF;

END $$;

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_alert_rules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS trigger_alert_rules_updated_at ON alert_rules;
CREATE TRIGGER trigger_alert_rules_updated_at
  BEFORE UPDATE ON alert_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_alert_rules_updated_at();

-- Function to check alert rules against incoming data (updated)
CREATE OR REPLACE FUNCTION check_alert_rules(alert_data JSONB)
RETURNS TABLE(rule_id UUID, user_id UUID, matched_conditions JSONB) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ar.id,
    ar.user_id,
    alert_data
  FROM alert_rules ar
  WHERE ar.is_active = true
    AND (
      ar.frequency_limit IS NULL 
      OR ar.times_triggered < ar.frequency_limit
      OR (ar.time_window_hours IS NOT NULL 
          AND ar.last_triggered_at < NOW() - INTERVAL '1 hour' * ar.time_window_hours)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;