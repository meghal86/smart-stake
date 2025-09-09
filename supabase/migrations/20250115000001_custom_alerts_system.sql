-- Custom Alert Rules System
-- This migration creates tables for advanced on-chain alert customization

-- Create alert_rules table for user-defined alert conditions
CREATE TABLE IF NOT EXISTS public.alert_rules (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  
  -- Alert conditions (stored as JSONB for flexibility)
  conditions JSONB NOT NULL DEFAULT '[]',
  -- Example structure:
  -- [
  --   {
  --     "type": "amount",
  --     "operator": "gte",
  --     "value": 1000000,
  --     "currency": "USD"
  --   },
  --   {
  --     "type": "chain",
  --     "operator": "in",
  --     "value": ["ethereum", "polygon"]
  --   }
  -- ]
  
  -- Boolean logic for combining conditions
  logic_operator TEXT DEFAULT 'AND' CHECK (logic_operator IN ('AND', 'OR', 'NOR')),
  
  -- Time-based triggers
  time_window_hours INTEGER DEFAULT NULL, -- NULL means no time constraint
  frequency_limit INTEGER DEFAULT NULL, -- Max alerts per time window
  
  -- Delivery preferences
  delivery_channels JSONB DEFAULT '{"push": true, "email": false, "sms": false, "webhook": false}',
  webhook_url TEXT DEFAULT NULL,
  
  -- Metadata
  tags TEXT[] DEFAULT '{}',
  priority INTEGER DEFAULT 1 CHECK (priority >= 1 AND priority <= 5),
  
  -- Tracking
  times_triggered INTEGER DEFAULT 0,
  last_triggered_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create alert_rule_history table to track when rules are triggered
CREATE TABLE IF NOT EXISTS public.alert_rule_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  alert_rule_id UUID REFERENCES public.alert_rules(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- The alert that triggered this rule
  alert_id UUID REFERENCES public.alerts(id) ON DELETE SET NULL,
  
  -- Snapshot of conditions that matched
  matched_conditions JSONB NOT NULL,
  
  -- Delivery status
  delivery_status JSONB DEFAULT '{}',
  -- Example: {"push": "sent", "email": "failed", "sms": "not_configured"}
  
  triggered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create alert_templates table for preset alert configurations
CREATE TABLE IF NOT EXISTS public.alert_templates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  category TEXT NOT NULL, -- 'whale', 'defi', 'security', etc.
  
  -- Template configuration
  template_conditions JSONB NOT NULL,
  default_logic_operator TEXT DEFAULT 'AND',
  suggested_delivery_channels JSONB DEFAULT '{"push": true, "email": false}',
  
  -- Metadata
  is_premium BOOLEAN DEFAULT false,
  popularity_score INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_alert_rules_user_id ON public.alert_rules(user_id);
CREATE INDEX IF NOT EXISTS idx_alert_rules_active ON public.alert_rules(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_alert_rules_priority ON public.alert_rules(priority DESC);
CREATE INDEX IF NOT EXISTS idx_alert_rule_history_rule_id ON public.alert_rule_history(alert_rule_id);
CREATE INDEX IF NOT EXISTS idx_alert_rule_history_user_id ON public.alert_rule_history(user_id);
CREATE INDEX IF NOT EXISTS idx_alert_rule_history_triggered_at ON public.alert_rule_history(triggered_at DESC);
CREATE INDEX IF NOT EXISTS idx_alert_templates_category ON public.alert_templates(category);
CREATE INDEX IF NOT EXISTS idx_alert_templates_premium ON public.alert_templates(is_premium);

-- Enable RLS
ALTER TABLE public.alert_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_rule_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for alert_rules
CREATE POLICY "Users can view own alert rules" ON public.alert_rules
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own alert rules" ON public.alert_rules
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own alert rules" ON public.alert_rules
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own alert rules" ON public.alert_rules
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for alert_rule_history
CREATE POLICY "Users can view own alert history" ON public.alert_rule_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own alert history" ON public.alert_rule_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for alert_templates (public read)
CREATE POLICY "Authenticated users can view templates" ON public.alert_templates
  FOR SELECT USING (auth.role() = 'authenticated');

-- Add updated_at triggers
CREATE TRIGGER update_alert_rules_updated_at BEFORE UPDATE ON public.alert_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_alert_templates_updated_at BEFORE UPDATE ON public.alert_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default alert templates
INSERT INTO public.alert_templates (name, description, category, template_conditions, is_premium) VALUES
  (
    'Large Whale Buy',
    'Detect large purchases by known whale wallets',
    'whale',
    '[
      {"type": "amount", "operator": "gte", "value": 1000000, "currency": "USD"},
      {"type": "direction", "operator": "eq", "value": "buy"},
      {"type": "whale_tag", "operator": "eq", "value": true}
    ]',
    false
  ),
  (
    'Multi-chain Transfer Spike',
    'Alert when same wallet transfers across multiple chains within timeframe',
    'whale',
    '[
      {"type": "amount", "operator": "gte", "value": 500000, "currency": "USD"},
      {"type": "multi_chain", "operator": "eq", "value": true},
      {"type": "time_window", "operator": "lte", "value": 24, "unit": "hours"}
    ]',
    true
  ),
  (
    'Stablecoin Large Movement',
    'Track large stablecoin transfers that might indicate market movements',
    'defi',
    '[
      {"type": "token_type", "operator": "eq", "value": "stablecoin"},
      {"type": "amount", "operator": "gte", "value": 10000000, "currency": "USD"}
    ]',
    false
  ),
  (
    'Exchange Outflow Alert',
    'Monitor large withdrawals from major exchanges',
    'whale',
    '[
      {"type": "from_type", "operator": "eq", "value": "exchange"},
      {"type": "amount", "operator": "gte", "value": 2000000, "currency": "USD"},
      {"type": "direction", "operator": "eq", "value": "withdrawal"}
    ]',
    true
  ),
  (
    'DeFi Protocol Interaction',
    'Alert on large interactions with specific DeFi protocols',
    'defi',
    '[
      {"type": "to_type", "operator": "eq", "value": "defi_protocol"},
      {"type": "amount", "operator": "gte", "value": 1000000, "currency": "USD"},
      {"type": "protocol", "operator": "in", "value": ["uniswap", "aave", "compound"]}
    ]',
    true
  )
ON CONFLICT (name) DO NOTHING;

-- Create function to check if alert matches user rules
CREATE OR REPLACE FUNCTION check_alert_rules(alert_data JSONB)
RETURNS TABLE(
  rule_id UUID,
  user_id UUID,
  rule_name TEXT,
  delivery_channels JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ar.id,
    ar.user_id,
    ar.name,
    ar.delivery_channels
  FROM public.alert_rules ar
  WHERE ar.is_active = true
    AND (
      -- Simple condition matching logic (can be enhanced)
      (ar.conditions @> '[{"type": "amount"}]' AND (alert_data->>'amount_usd')::numeric >= 
        (SELECT (condition->>'value')::numeric 
         FROM jsonb_array_elements(ar.conditions) AS condition 
         WHERE condition->>'type' = 'amount' LIMIT 1))
      OR
      (ar.conditions @> '[{"type": "chain"}]' AND alert_data->>'chain' = 
        (SELECT condition->>'value' 
         FROM jsonb_array_elements(ar.conditions) AS condition 
         WHERE condition->>'type' = 'chain' LIMIT 1))
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;