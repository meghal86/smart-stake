-- Discovery events tracking
CREATE TABLE discovery_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ROI patterns tracking
CREATE TABLE roi_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  pattern_id TEXT NOT NULL,
  hit_rate FLOAT DEFAULT 0,
  pnl FLOAT DEFAULT 0,
  alerts INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User ROI summary view
CREATE OR REPLACE VIEW v_user_roi_summary AS
SELECT 
  user_id,
  COUNT(*) as total_patterns,
  AVG(hit_rate) as avg_hit_rate,
  SUM(pnl) as total_pnl,
  SUM(alerts) as total_alerts,
  MAX(updated_at) as last_updated
FROM roi_patterns
GROUP BY user_id;

-- Enable RLS
ALTER TABLE discovery_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE roi_patterns ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own discovery events" ON discovery_events
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own discovery events" ON discovery_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own ROI patterns" ON roi_patterns
  FOR ALL USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_discovery_events_user_id ON discovery_events(user_id);
CREATE INDEX idx_discovery_events_type ON discovery_events(event_type);
CREATE INDEX idx_roi_patterns_user_id ON roi_patterns(user_id);
CREATE INDEX idx_roi_patterns_pattern_id ON roi_patterns(pattern_id);