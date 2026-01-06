-- Advanced Whale Behavior Predictions & Simulations
-- Enhanced ML models and prediction tables

-- Enhanced whale behavior predictions table
CREATE TABLE IF NOT EXISTS whale_behavior_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  whale_address TEXT NOT NULL,
  prediction_type TEXT NOT NULL CHECK (prediction_type IN ('accumulation', 'liquidation', 'cluster_movement', 'cross_chain')),
  confidence DECIMAL(5,2) NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
  predicted_amount DECIMAL(20,8),
  timeframe TEXT NOT NULL,
  impact_score DECIMAL(3,1) CHECK (impact_score >= 0 AND impact_score <= 10),
  explanation JSONB NOT NULL DEFAULT '[]',
  features JSONB NOT NULL DEFAULT '{}',
  model_version TEXT DEFAULT 'v1.0',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'validated', 'failed')),
  validation_result JSONB,
  actual_outcome JSONB
);

-- Market impact simulations table
CREATE TABLE IF NOT EXISTS market_simulations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  simulation_params JSONB NOT NULL,
  results JSONB NOT NULL,
  chain TEXT NOT NULL,
  total_volume DECIMAL(20,8),
  price_impact DECIMAL(8,4),
  liquidity_drain DECIMAL(5,2),
  cascade_risk TEXT CHECK (cascade_risk IN ('Low', 'Medium', 'High')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Whale behavior patterns table for ML training
CREATE TABLE IF NOT EXISTS whale_behavior_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  whale_address TEXT NOT NULL,
  pattern_type TEXT NOT NULL,
  pattern_data JSONB NOT NULL,
  confidence_score DECIMAL(5,2),
  time_window INTERVAL,
  detected_at TIMESTAMPTZ DEFAULT NOW(),
  validated BOOLEAN DEFAULT FALSE,
  validation_accuracy DECIMAL(5,2)
);

-- Model performance tracking
CREATE TABLE IF NOT EXISTS ml_model_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id UUID REFERENCES ml_models(id),
  prediction_type TEXT NOT NULL,
  accuracy DECIMAL(5,2),
  precision_score DECIMAL(5,2),
  recall_score DECIMAL(5,2),
  f1_score DECIMAL(5,2),
  evaluation_period DATERANGE,
  sample_size INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Whale interaction networks for cluster analysis
CREATE TABLE IF NOT EXISTS whale_interaction_networks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  whale_address_1 TEXT NOT NULL,
  whale_address_2 TEXT NOT NULL,
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('direct_transfer', 'common_counterparty', 'timing_correlation', 'amount_correlation')),
  correlation_score DECIMAL(5,4) CHECK (correlation_score >= 0 AND correlation_score <= 1),
  interaction_count INTEGER DEFAULT 1,
  total_volume DECIMAL(20,8),
  first_interaction TIMESTAMPTZ,
  last_interaction TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(whale_address_1, whale_address_2, interaction_type)
);

-- Prediction accuracy tracking
CREATE TABLE IF NOT EXISTS prediction_accuracy_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prediction_id UUID REFERENCES whale_behavior_predictions(id),
  predicted_outcome JSONB NOT NULL,
  actual_outcome JSONB,
  accuracy_score DECIMAL(5,2),
  time_to_outcome INTERVAL,
  validation_method TEXT,
  validated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_whale_predictions_address ON whale_behavior_predictions(whale_address);
CREATE INDEX IF NOT EXISTS idx_whale_predictions_type ON whale_behavior_predictions(prediction_type);
CREATE INDEX IF NOT EXISTS idx_whale_predictions_confidence ON whale_behavior_predictions(confidence DESC);
CREATE INDEX IF NOT EXISTS idx_whale_predictions_created ON whale_behavior_predictions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_whale_predictions_status ON whale_behavior_predictions(status);

CREATE INDEX IF NOT EXISTS idx_market_simulations_chain ON market_simulations(chain);
CREATE INDEX IF NOT EXISTS idx_market_simulations_created ON market_simulations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_market_simulations_impact ON market_simulations(price_impact DESC);

CREATE INDEX IF NOT EXISTS idx_whale_patterns_address ON whale_behavior_patterns(whale_address);
CREATE INDEX IF NOT EXISTS idx_whale_patterns_type ON whale_behavior_patterns(pattern_type);
CREATE INDEX IF NOT EXISTS idx_whale_patterns_detected ON whale_behavior_patterns(detected_at DESC);

CREATE INDEX IF NOT EXISTS idx_whale_networks_addr1 ON whale_interaction_networks(whale_address_1);
CREATE INDEX IF NOT EXISTS idx_whale_networks_addr2 ON whale_interaction_networks(whale_address_2);
CREATE INDEX IF NOT EXISTS idx_whale_networks_correlation ON whale_interaction_networks(correlation_score DESC);

-- Row Level Security
ALTER TABLE whale_behavior_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_simulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE whale_behavior_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE ml_model_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE whale_interaction_networks ENABLE ROW LEVEL SECURITY;
ALTER TABLE prediction_accuracy_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "whale_predictions_read" ON whale_behavior_predictions
  FOR SELECT USING (true);

CREATE POLICY "market_simulations_read" ON market_simulations
  FOR SELECT USING (true);

CREATE POLICY "market_simulations_insert" ON market_simulations
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "whale_patterns_read" ON whale_behavior_patterns
  FOR SELECT USING (true);

CREATE POLICY "model_performance_read" ON ml_model_performance
  FOR SELECT USING (true);

CREATE POLICY "whale_networks_read" ON whale_interaction_networks
  FOR SELECT USING (true);

CREATE POLICY "prediction_accuracy_read" ON prediction_accuracy_log
  FOR SELECT USING (true);

-- Enhanced ML models with new types
INSERT INTO ml_models (name, type, accuracy, last_trained, status) VALUES
('Advanced Accumulation Predictor', 'accumulation', 89.2, NOW(), 'active'),
('Liquidation Risk Analyzer', 'liquidation', 92.8, NOW(), 'active'),
('Cluster Movement Detector', 'cluster_movement', 78.5, NOW(), 'active'),
('Cross-Chain Bridge Predictor', 'cross_chain', 84.1, NOW(), 'active')
ON CONFLICT (name) DO UPDATE SET
  accuracy = EXCLUDED.accuracy,
  last_trained = EXCLUDED.last_trained,
  status = EXCLUDED.status;

-- Sample whale behavior predictions (only if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'whale_behavior_predictions') THEN
    INSERT INTO whale_behavior_predictions (
      whale_address, 
      prediction_type, 
      confidence, 
      predicted_amount, 
      timeframe, 
      impact_score, 
      explanation,
      expires_at
    ) VALUES
    (
      '0x742d35Cc6aB3C0532C4C2C0532C4C2C0532C4C25a3',
      'accumulation',
      87.5,
      2500.0,
      '6-12 hours',
      8.2,
      '["Large inflow pattern detected", "Historical accumulation behavior", "Low market liquidity window"]'::jsonb,
      NOW() + INTERVAL '12 hours'
    ),
    (
      '0x8ba1f109eddd4bd1c328681c71137145c5af8223',
      'liquidation',
      94.2,
      5000.0,
      '2-4 hours',
      9.1,
      '["Stress indicators in portfolio", "Similar pattern to previous liquidations", "High leverage exposure"]'::jsonb,
      NOW() + INTERVAL '4 hours'
    ),
    (
      'Multiple addresses',
      'cluster_movement',
      76.8,
      15000.0,
      '24-48 hours',
      7.5,
      '["Coordinated wallet activity", "Similar transaction timing", "Cross-exchange movements"]'::jsonb,
      NOW() + INTERVAL '48 hours'
    )
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- Functions for prediction validation
CREATE OR REPLACE FUNCTION validate_prediction(
  prediction_id UUID,
  actual_data JSONB
) RETURNS VOID AS $$
DECLARE
  prediction_record whale_behavior_predictions%ROWTYPE;
  accuracy_score DECIMAL(5,2);
BEGIN
  SELECT * INTO prediction_record 
  FROM whale_behavior_predictions 
  WHERE id = prediction_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Prediction not found';
  END IF;
  
  -- Simple accuracy calculation (can be enhanced)
  accuracy_score := CASE 
    WHEN actual_data->>'outcome' = prediction_record.prediction_type THEN 
      GREATEST(0, prediction_record.confidence - 10) -- Reduce by 10 for timing differences
    ELSE 
      LEAST(100, 100 - prediction_record.confidence)
  END;
  
  -- Update prediction with validation
  UPDATE whale_behavior_predictions 
  SET 
    status = 'validated',
    actual_outcome = actual_data,
    validation_result = jsonb_build_object(
      'accuracy', accuracy_score,
      'validated_at', NOW()
    )
  WHERE id = prediction_id;
  
  -- Log accuracy
  INSERT INTO prediction_accuracy_log (
    prediction_id,
    predicted_outcome,
    actual_outcome,
    accuracy_score,
    time_to_outcome,
    validation_method,
    validated_at
  ) VALUES (
    prediction_id,
    jsonb_build_object(
      'type', prediction_record.prediction_type,
      'confidence', prediction_record.confidence,
      'amount', prediction_record.predicted_amount
    ),
    actual_data,
    accuracy_score,
    NOW() - prediction_record.created_at,
    'manual',
    NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get model performance metrics
CREATE OR REPLACE FUNCTION get_model_performance(
  model_type TEXT DEFAULT NULL,
  days_back INTEGER DEFAULT 30
) RETURNS TABLE (
  prediction_type TEXT,
  total_predictions BIGINT,
  validated_predictions BIGINT,
  avg_accuracy DECIMAL(5,2),
  avg_confidence DECIMAL(5,2),
  success_rate DECIMAL(5,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.prediction_type,
    COUNT(*) as total_predictions,
    COUNT(p.validation_result) as validated_predictions,
    AVG((p.validation_result->>'accuracy')::DECIMAL) as avg_accuracy,
    AVG(p.confidence) as avg_confidence,
    (COUNT(CASE WHEN (p.validation_result->>'accuracy')::DECIMAL > 70 THEN 1 END) * 100.0 / 
     NULLIF(COUNT(p.validation_result), 0)) as success_rate
  FROM whale_behavior_predictions p
  WHERE 
    (model_type IS NULL OR p.prediction_type = model_type)
    AND p.created_at >= NOW() - (days_back || ' days')::INTERVAL
  GROUP BY p.prediction_type
  ORDER BY avg_accuracy DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT SELECT ON whale_behavior_predictions TO authenticated;
GRANT SELECT ON market_simulations TO authenticated;
GRANT INSERT ON market_simulations TO authenticated;
GRANT SELECT ON whale_behavior_patterns TO authenticated;
GRANT SELECT ON ml_model_performance TO authenticated;
GRANT SELECT ON whale_interaction_networks TO authenticated;
GRANT SELECT ON prediction_accuracy_log TO authenticated;

GRANT EXECUTE ON FUNCTION validate_prediction(UUID, JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION get_model_performance(TEXT, INTEGER) TO authenticated;