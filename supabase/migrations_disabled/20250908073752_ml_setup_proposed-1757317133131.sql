-- ML Predictions and Model Performance
CREATE TABLE ml_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'clustering', 'liquidation', 'accumulation'
  accuracy DECIMAL(5,2),
  last_trained TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'active'
);

CREATE TABLE ml_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id UUID REFERENCES ml_models(id),
  prediction_type TEXT NOT NULL,
  confidence DECIMAL(5,2) NOT NULL,
  prediction_text TEXT NOT NULL,
  impact_text TEXT,
  whale_address TEXT,
  predicted_amount DECIMAL(20,8),
  timeframe_hours INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  status TEXT DEFAULT 'active'
);

-- Insert initial models
INSERT INTO ml_models (name, type, accuracy) VALUES
('Whale Clustering Model', 'clustering', 87.5),
('Liquidation Predictor', 'liquidation', 94.2),
('Accumulation Detector', 'accumulation', 76.8);

-- Sample predictions
INSERT INTO ml_predictions (model_id, prediction_type, confidence, prediction_text, impact_text, timeframe_hours, expires_at) 
SELECT 
  m.id,
  m.type,
  m.accuracy + (RANDOM() * 10 - 5),
  CASE m.type
    WHEN 'clustering' THEN 'High probability of coordinated whale activity detected'
    WHEN 'liquidation' THEN 'Large holder likely to liquidate position'
    WHEN 'accumulation' THEN 'Institutional accumulation pattern identified'
  END,
  CASE m.type
    WHEN 'clustering' THEN 'Medium market impact expected'
    WHEN 'liquidation' THEN 'Potential sell pressure: $' || (RANDOM() * 5 + 1)::DECIMAL(10,1) || 'M'
    WHEN 'accumulation' THEN 'Bullish signal for next 48 hours'
  END,
  CASE m.type
    WHEN 'clustering' THEN 6
    WHEN 'liquidation' THEN 24
    WHEN 'accumulation' THEN 48
  END,
  NOW() + INTERVAL '24 hours'
FROM ml_models m;