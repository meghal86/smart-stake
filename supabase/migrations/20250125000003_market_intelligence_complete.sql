-- Market Intelligence Hub Complete Schema
-- This migration adds missing tables and functions required by the specification

-- =====================================================
-- 1. CHAIN QUANTILES TABLE (30d rolling quantiles)
-- =====================================================
CREATE TABLE IF NOT EXISTS chain_quantiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    day DATE NOT NULL,
    chain TEXT NOT NULL,
    token TEXT NOT NULL DEFAULT 'native',
    q70 DECIMAL(20,2) NOT NULL,
    q80 DECIMAL(20,2) NOT NULL,
    q85 DECIMAL(20,2) NOT NULL,
    q90 DECIMAL(20,2) NOT NULL,
    sample_size INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT chain_quantiles_unique UNIQUE (day, chain, token),
    CONSTRAINT chain_quantiles_chain_check CHECK (chain IN ('BTC', 'ETH', 'SOL', 'Others')),
    CONSTRAINT chain_quantiles_quantiles_order CHECK (q70 <= q80 AND q80 <= q85 AND q85 <= q90)
);

-- =====================================================
-- 2. WHALE CLUSTER STATE TABLE (for hysteresis)
-- =====================================================
CREATE TABLE IF NOT EXISTS whale_cluster_state (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    whale_id TEXT NOT NULL, -- whale address
    cluster TEXT NOT NULL,
    since_ts TIMESTAMPTZ NOT NULL,
    confidence DECIMAL(3,2) NOT NULL DEFAULT 0.5,
    last_eval_ts TIMESTAMPTZ DEFAULT NOW(),
    bucket_history JSONB DEFAULT '[]', -- Last 3 buckets for hysteresis
    cooldown_until TIMESTAMPTZ, -- 6h cooldown timestamp
    
    CONSTRAINT whale_cluster_state_unique UNIQUE (whale_id),
    CONSTRAINT whale_cluster_state_cluster_check CHECK (cluster IN ('DORMANT_WAKING', 'CEX_INFLOW', 'DEFI_ACTIVITY', 'DISTRIBUTION', 'ACCUMULATION')),
    CONSTRAINT whale_cluster_state_confidence_range CHECK (confidence >= 0.0 AND confidence <= 1.0)
);

-- =====================================================
-- 3. WHALE CLUSTER HISTORY TABLE (for tracking changes)
-- =====================================================
CREATE TABLE IF NOT EXISTS whale_cluster_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    whale_id TEXT NOT NULL,
    cluster TEXT NOT NULL,
    ts TIMESTAMPTZ DEFAULT NOW(),
    confidence DECIMAL(3,2) NOT NULL,
    reason_codes TEXT[] DEFAULT '{}',
    metrics JSONB DEFAULT '{}',
    
    CONSTRAINT whale_cluster_history_cluster_check CHECK (cluster IN ('DORMANT_WAKING', 'CEX_INFLOW', 'DEFI_ACTIVITY', 'DISTRIBUTION', 'ACCUMULATION'))
);

-- =====================================================
-- 4. CHAIN FEATURES 24H TABLE (for risk calculation)
-- =====================================================
CREATE TABLE IF NOT EXISTS chain_features_24h (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chain TEXT NOT NULL,
    day DATE NOT NULL,
    whale_risk_mean DECIMAL(5,2) NOT NULL DEFAULT 50,
    cex_inflow_ratio DECIMAL(5,4) NOT NULL DEFAULT 0,
    net_outflow_ratio DECIMAL(5,4) NOT NULL DEFAULT 0,
    volatility_z DECIMAL(5,2) NOT NULL DEFAULT 0,
    large_tx_share DECIMAL(5,4) NOT NULL DEFAULT 0,
    dormant_wakeups_rate DECIMAL(5,4) NOT NULL DEFAULT 0,
    stablecoin_buffer_ratio DECIMAL(5,4) NOT NULL DEFAULT 0,
    raw_score DECIMAL(5,4) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT chain_features_unique UNIQUE (chain, day),
    CONSTRAINT chain_features_chain_check CHECK (chain IN ('BTC', 'ETH', 'SOL', 'Others'))
);

-- =====================================================
-- 5. CHAIN RISK HISTORY TABLE (for normalization)
-- =====================================================
CREATE TABLE IF NOT EXISTS chain_risk_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    day DATE NOT NULL,
    chain TEXT NOT NULL,
    raw_score DECIMAL(5,4) NOT NULL,
    normalized_risk INTEGER NOT NULL,
    components JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT chain_risk_history_unique UNIQUE (day, chain),
    CONSTRAINT chain_risk_history_risk_range CHECK (normalized_risk >= 0 AND normalized_risk <= 100)
);

-- =====================================================
-- 6. USER SETTINGS TABLE (for filters and thresholds)
-- =====================================================
CREATE TABLE IF NOT EXISTS user_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    filters_json JSONB DEFAULT '{}',
    thresholds_json JSONB DEFAULT '{}',
    subscription_tier TEXT DEFAULT 'free',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT user_settings_unique UNIQUE (user_id),
    CONSTRAINT user_settings_tier_check CHECK (subscription_tier IN ('free', 'pro', 'enterprise'))
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Chain Quantiles Indexes
CREATE INDEX IF NOT EXISTS idx_chain_quantiles_day_chain ON chain_quantiles(day DESC, chain);
CREATE INDEX IF NOT EXISTS idx_chain_quantiles_chain_token ON chain_quantiles(chain, token);

-- Whale Cluster State Indexes
CREATE INDEX IF NOT EXISTS idx_whale_cluster_state_whale_id ON whale_cluster_state(whale_id);
CREATE INDEX IF NOT EXISTS idx_whale_cluster_state_cluster ON whale_cluster_state(cluster);
CREATE INDEX IF NOT EXISTS idx_whale_cluster_state_last_eval ON whale_cluster_state(last_eval_ts DESC);

-- Whale Cluster History Indexes
CREATE INDEX IF NOT EXISTS idx_whale_cluster_history_whale_id ON whale_cluster_history(whale_id);
CREATE INDEX IF NOT EXISTS idx_whale_cluster_history_ts ON whale_cluster_history(ts DESC);
CREATE INDEX IF NOT EXISTS idx_whale_cluster_history_cluster ON whale_cluster_history(cluster);

-- Chain Features Indexes
CREATE INDEX IF NOT EXISTS idx_chain_features_chain_day ON chain_features_24h(chain, day DESC);

-- Chain Risk History Indexes
CREATE INDEX IF NOT EXISTS idx_chain_risk_history_chain_day ON chain_risk_history(chain, day DESC);

-- User Settings Indexes
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE chain_quantiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE whale_cluster_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE whale_cluster_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE chain_features_24h ENABLE ROW LEVEL SECURITY;
ALTER TABLE chain_risk_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Public read access for market data
CREATE POLICY "Public read access to chain_quantiles" ON chain_quantiles
    FOR SELECT USING (true);

CREATE POLICY "Public read access to whale_cluster_state" ON whale_cluster_state
    FOR SELECT USING (true);

CREATE POLICY "Public read access to whale_cluster_history" ON whale_cluster_history
    FOR SELECT USING (true);

CREATE POLICY "Public read access to chain_features_24h" ON chain_features_24h
    FOR SELECT USING (true);

CREATE POLICY "Public read access to chain_risk_history" ON chain_risk_history
    FOR SELECT USING (true);

-- Service role full access
CREATE POLICY "Service role full access to chain_quantiles" ON chain_quantiles
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access to whale_cluster_state" ON whale_cluster_state
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access to whale_cluster_history" ON whale_cluster_history
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access to chain_features_24h" ON chain_features_24h
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access to chain_risk_history" ON chain_risk_history
    FOR ALL USING (auth.role() = 'service_role');

-- User settings are private
CREATE POLICY "Users can manage their own settings" ON user_settings
    FOR ALL USING (auth.uid() = user_id);

-- =====================================================
-- FUNCTIONS FOR MARKET INTELLIGENCE
-- =====================================================

-- Function to get chain-adaptive thresholds
CREATE OR REPLACE FUNCTION get_chain_thresholds(
    target_chain TEXT,
    target_date DATE DEFAULT CURRENT_DATE
)
RETURNS JSONB AS $$
DECLARE
    thresholds JSONB;
BEGIN
    SELECT jsonb_build_object(
        'min_amount', GREATEST(q70, 50000),
        'high_value', GREATEST(q85, 100000),
        'defi_threshold', GREATEST(q80, 50000),
        'net_out_threshold', GREATEST(q80, 100000),
        'net_in_threshold', GREATEST(q80, 100000),
        'q90_threshold', q90
    ) INTO thresholds
    FROM chain_quantiles
    WHERE chain = target_chain 
      AND token = 'native'
      AND day <= target_date
    ORDER BY day DESC
    LIMIT 1;
    
    -- Return default thresholds if no data found
    IF thresholds IS NULL THEN
        thresholds := jsonb_build_object(
            'min_amount', 50000,
            'high_value', 100000,
            'defi_threshold', 50000,
            'net_out_threshold', 100000,
            'net_in_threshold', 100000,
            'q90_threshold', 1000000
        );
    END IF;
    
    RETURN thresholds;
END;
$$ LANGUAGE plpgsql;

-- Function to update whale cluster with hysteresis
CREATE OR REPLACE FUNCTION update_whale_cluster_with_hysteresis(
    whale_address TEXT,
    new_cluster TEXT,
    new_confidence DECIMAL,
    reason_codes TEXT[] DEFAULT '{}'
)
RETURNS BOOLEAN AS $$
DECLARE
    current_state RECORD;
    bucket_history JSONB;
    should_switch BOOLEAN := FALSE;
    cooldown_active BOOLEAN := FALSE;
BEGIN
    -- Get current state
    SELECT * INTO current_state
    FROM whale_cluster_state
    WHERE whale_id = whale_address;
    
    -- Check cooldown
    IF current_state.cooldown_until IS NOT NULL AND current_state.cooldown_until > NOW() THEN
        cooldown_active := TRUE;
    END IF;
    
    -- If no current state, create new one
    IF current_state IS NULL THEN
        INSERT INTO whale_cluster_state (whale_id, cluster, since_ts, confidence, bucket_history)
        VALUES (whale_address, new_cluster, NOW(), new_confidence, jsonb_build_array(new_cluster));
        
        INSERT INTO whale_cluster_history (whale_id, cluster, confidence, reason_codes)
        VALUES (whale_address, new_cluster, new_confidence, reason_codes);
        
        RETURN TRUE;
    END IF;
    
    -- Update bucket history (keep last 3)
    bucket_history := current_state.bucket_history || jsonb_build_array(new_cluster);
    IF jsonb_array_length(bucket_history) > 3 THEN
        bucket_history := bucket_history - 0; -- Remove first element
    END IF;
    
    -- Check hysteresis: require 2 of last 3 buckets to switch (and no cooldown)
    IF NOT cooldown_active AND new_cluster != current_state.cluster THEN
        -- Count occurrences of new_cluster in last 3 buckets
        SELECT COUNT(*) >= 2 INTO should_switch
        FROM jsonb_array_elements_text(bucket_history) AS bucket
        WHERE bucket = new_cluster;
    END IF;
    
    -- Update state
    IF should_switch THEN
        UPDATE whale_cluster_state
        SET 
            cluster = new_cluster,
            since_ts = NOW(),
            confidence = new_confidence,
            last_eval_ts = NOW(),
            bucket_history = bucket_history,
            cooldown_until = NOW() + INTERVAL '6 hours'
        WHERE whale_id = whale_address;
        
        -- Log history
        INSERT INTO whale_cluster_history (whale_id, cluster, confidence, reason_codes)
        VALUES (whale_address, new_cluster, new_confidence, reason_codes);
        
        RETURN TRUE;
    ELSE
        -- Just update evaluation time and bucket history
        UPDATE whale_cluster_state
        SET 
            last_eval_ts = NOW(),
            bucket_history = bucket_history
        WHERE whale_id = whale_address;
        
        RETURN FALSE;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate and store daily chain quantiles
CREATE OR REPLACE FUNCTION calculate_daily_chain_quantiles(
    target_date DATE DEFAULT CURRENT_DATE
)
RETURNS INTEGER AS $$
DECLARE
    chain_record RECORD;
    quantiles RECORD;
    rows_inserted INTEGER := 0;
BEGIN
    FOR chain_record IN SELECT DISTINCT chain FROM whale_transfers WHERE DATE(ts) = target_date LOOP
        -- Calculate quantiles for this chain
        SELECT 
            PERCENTILE_CONT(0.70) WITHIN GROUP (ORDER BY value_usd::DECIMAL) as q70,
            PERCENTILE_CONT(0.80) WITHIN GROUP (ORDER BY value_usd::DECIMAL) as q80,
            PERCENTILE_CONT(0.85) WITHIN GROUP (ORDER BY value_usd::DECIMAL) as q85,
            PERCENTILE_CONT(0.90) WITHIN GROUP (ORDER BY value_usd::DECIMAL) as q90,
            COUNT(*) as sample_size
        INTO quantiles
        FROM whale_transfers
        WHERE chain = chain_record.chain 
          AND DATE(ts) = target_date
          AND value_usd IS NOT NULL
          AND value_usd::DECIMAL > 0;
        
        -- Insert or update quantiles
        INSERT INTO chain_quantiles (day, chain, token, q70, q80, q85, q90, sample_size)
        VALUES (target_date, chain_record.chain, 'native', quantiles.q70, quantiles.q80, quantiles.q85, quantiles.q90, quantiles.sample_size)
        ON CONFLICT (day, chain, token)
        DO UPDATE SET
            q70 = EXCLUDED.q70,
            q80 = EXCLUDED.q80,
            q85 = EXCLUDED.q85,
            q90 = EXCLUDED.q90,
            sample_size = EXCLUDED.sample_size,
            created_at = NOW();
        
        rows_inserted := rows_inserted + 1;
    END LOOP;
    
    RETURN rows_inserted;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- SAMPLE DATA FOR TESTING
-- =====================================================

-- Insert sample chain quantiles for current date
INSERT INTO chain_quantiles (day, chain, token, q70, q80, q85, q90, sample_size) VALUES
(CURRENT_DATE, 'BTC', 'native', 75000, 150000, 250000, 500000, 1250),
(CURRENT_DATE, 'ETH', 'native', 50000, 100000, 175000, 350000, 2100),
(CURRENT_DATE, 'SOL', 'native', 25000, 50000, 85000, 175000, 850),
(CURRENT_DATE, 'Others', 'native', 30000, 60000, 100000, 200000, 650)
ON CONFLICT (day, chain, token) DO NOTHING;

-- Insert sample chain features for current date
INSERT INTO chain_features_24h (chain, day, whale_risk_mean, cex_inflow_ratio, net_outflow_ratio, volatility_z, large_tx_share, dormant_wakeups_rate, stablecoin_buffer_ratio, raw_score) VALUES
('BTC', CURRENT_DATE, 45.2, 0.12, 0.08, 0.3, 0.15, 0.02, 0.25, 0.38),
('ETH', CURRENT_DATE, 52.8, 0.18, 0.12, 0.5, 0.22, 0.04, 0.18, 0.45),
('SOL', CURRENT_DATE, 48.1, 0.15, 0.10, 0.7, 0.18, 0.03, 0.22, 0.42),
('Others', CURRENT_DATE, 50.0, 0.10, 0.06, 0.2, 0.12, 0.01, 0.30, 0.35)
ON CONFLICT (chain, day) DO NOTHING;

-- =====================================================
-- GRANTS AND PERMISSIONS
-- =====================================================

-- Grant necessary permissions
GRANT SELECT ON chain_quantiles TO authenticated;
GRANT SELECT ON whale_cluster_state TO authenticated;
GRANT SELECT ON whale_cluster_history TO authenticated;
GRANT SELECT ON chain_features_24h TO authenticated;
GRANT SELECT ON chain_risk_history TO authenticated;
GRANT ALL ON user_settings TO authenticated;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION get_chain_thresholds(TEXT, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION update_whale_cluster_with_hysteresis(TEXT, TEXT, DECIMAL, TEXT[]) TO service_role;
GRANT EXECUTE ON FUNCTION calculate_daily_chain_quantiles(DATE) TO service_role;

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE chain_quantiles IS 'Rolling 30-day quantiles per chain/token for adaptive thresholds';
COMMENT ON TABLE whale_cluster_state IS 'Current cluster state for each whale with hysteresis tracking';
COMMENT ON TABLE whale_cluster_history IS 'Historical record of whale cluster changes';
COMMENT ON TABLE chain_features_24h IS 'Daily chain risk features for risk calculation';
COMMENT ON TABLE chain_risk_history IS 'Historical chain risk scores for normalization';
COMMENT ON TABLE user_settings IS 'User-specific filters, thresholds, and subscription tier';

COMMENT ON FUNCTION get_chain_thresholds(TEXT, DATE) IS 'Get chain-adaptive thresholds based on quantiles';
COMMENT ON FUNCTION update_whale_cluster_with_hysteresis(TEXT, TEXT, DECIMAL, TEXT[]) IS 'Update whale cluster with 2-of-3 hysteresis and 6h cooldown';
COMMENT ON FUNCTION calculate_daily_chain_quantiles(DATE) IS 'Calculate and store daily quantiles for all chains';