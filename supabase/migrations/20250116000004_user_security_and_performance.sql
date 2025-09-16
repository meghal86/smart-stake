-- User Security and Performance Enhancement
-- Migration: 20250116000004_user_security_and_performance.sql

-- Create user_watchlists table if not exists
CREATE TABLE IF NOT EXISTS user_watchlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    whale_address TEXT NOT NULL,
    chain TEXT NOT NULL DEFAULT 'ethereum',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, whale_address, chain)
);

-- Create alert_rules table if not exists
CREATE TABLE IF NOT EXISTS alert_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    whale_address TEXT NOT NULL,
    alert_type TEXT NOT NULL,
    threshold_value DECIMAL(18,2) NOT NULL,
    cooldown_minutes INTEGER DEFAULT 60,
    hysteresis_percent DECIMAL(5,2) DEFAULT 5.0,
    delivery_method TEXT DEFAULT 'email',
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create alert_notifications table if not exists
CREATE TABLE IF NOT EXISTS alert_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    whale_address TEXT NOT NULL,
    alert_rule_id UUID REFERENCES alert_rules(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending',
    delivery_method TEXT NOT NULL,
    message TEXT NOT NULL,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Performance indexes for user tables
CREATE INDEX IF NOT EXISTS idx_user_watchlists_user_id ON user_watchlists(user_id);
CREATE INDEX IF NOT EXISTS idx_user_watchlists_whale_address ON user_watchlists(whale_address);
CREATE INDEX IF NOT EXISTS idx_user_watchlists_created_at ON user_watchlists(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_alert_rules_user_id ON alert_rules(user_id);
CREATE INDEX IF NOT EXISTS idx_alert_rules_whale_address ON alert_rules(whale_address);
CREATE INDEX IF NOT EXISTS idx_alert_rules_active ON alert_rules(active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_alert_rules_type_threshold ON alert_rules(alert_type, threshold_value);

CREATE INDEX IF NOT EXISTS idx_alert_notifications_user_id ON alert_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_alert_notifications_status ON alert_notifications(status);
CREATE INDEX IF NOT EXISTS idx_alert_notifications_created_at ON alert_notifications(created_at DESC);

-- Enable RLS on user tables
ALTER TABLE user_watchlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_notifications ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_watchlists
DROP POLICY IF EXISTS "Users manage own watchlists" ON user_watchlists;
CREATE POLICY "Users manage own watchlists" ON user_watchlists
    FOR ALL USING (auth.uid() = user_id);

-- RLS policies for alert_rules
DROP POLICY IF EXISTS "Users manage own alert rules" ON alert_rules;
CREATE POLICY "Users manage own alert rules" ON alert_rules
    FOR ALL USING (auth.uid() = user_id);

-- RLS policies for alert_notifications
DROP POLICY IF EXISTS "Users view own notifications" ON alert_notifications;
CREATE POLICY "Users view own notifications" ON alert_notifications
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role manages notifications" ON alert_notifications;
CREATE POLICY "Service role manages notifications" ON alert_notifications
    FOR ALL USING (true);

-- Efficient query views
CREATE OR REPLACE VIEW user_whale_dashboard AS
SELECT 
    w.user_id,
    w.whale_address,
    w.chain,
    w.created_at as watchlist_added,
    COUNT(ar.id) as active_alerts,
    MAX(b.balance_usd) as current_balance,
    MAX(s.risk_score) as latest_risk_score,
    COUNT(an.id) FILTER (WHERE an.created_at > NOW() - INTERVAL '24 hours') as alerts_24h
FROM user_watchlists w
LEFT JOIN alert_rules ar ON ar.user_id = w.user_id AND ar.whale_address = w.whale_address AND ar.active = true
LEFT JOIN whale_balances b ON b.address = w.whale_address AND b.chain = w.chain
LEFT JOIN whale_signals s ON s.address = w.whale_address AND s.chain = w.chain
LEFT JOIN alert_notifications an ON an.user_id = w.user_id AND an.whale_address = w.whale_address
WHERE b.ts > NOW() - INTERVAL '7 days' OR b.ts IS NULL
GROUP BY w.user_id, w.whale_address, w.chain, w.created_at;

CREATE OR REPLACE VIEW alert_performance_metrics AS
SELECT 
    ar.user_id,
    ar.alert_type,
    ar.delivery_method,
    COUNT(*) as total_rules,
    COUNT(*) FILTER (WHERE ar.active = true) as active_rules,
    AVG(ar.cooldown_minutes) as avg_cooldown,
    COUNT(an.id) as total_notifications,
    COUNT(an.id) FILTER (WHERE an.status = 'sent') as successful_deliveries,
    COUNT(an.id) FILTER (WHERE an.status = 'failed') as failed_deliveries,
    ROUND(
        COUNT(an.id) FILTER (WHERE an.status = 'sent')::DECIMAL / 
        NULLIF(COUNT(an.id), 0) * 100, 2
    ) as success_rate_percent
FROM alert_rules ar
LEFT JOIN alert_notifications an ON an.alert_rule_id = ar.id
GROUP BY ar.user_id, ar.alert_type, ar.delivery_method;

-- Materialized view for high-performance whale rankings
CREATE MATERIALIZED VIEW IF NOT EXISTS whale_rankings AS
SELECT 
    b.address,
    b.chain,
    b.balance_usd,
    s.risk_score,
    s.confidence,
    COUNT(DISTINCT w.user_id) as watchers_count,
    COUNT(DISTINCT t.tx_hash) FILTER (WHERE t.ts > NOW() - INTERVAL '24 hours') as tx_count_24h,
    SUM(t.value_usd) FILTER (WHERE t.ts > NOW() - INTERVAL '24 hours') as volume_24h,
    ROW_NUMBER() OVER (ORDER BY b.balance_usd DESC) as balance_rank,
    ROW_NUMBER() OVER (ORDER BY s.risk_score DESC) as risk_rank
FROM whale_balances b
LEFT JOIN whale_signals s ON s.address = b.address AND s.chain = b.chain
LEFT JOIN user_watchlists w ON w.whale_address = b.address AND w.chain = b.chain
LEFT JOIN whale_transfers t ON (t.from_address = b.address OR t.to_address = b.address) AND t.chain = b.chain
WHERE b.ts > NOW() - INTERVAL '7 days'
GROUP BY b.address, b.chain, b.balance_usd, s.risk_score, s.confidence;

-- Index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_whale_rankings_address_chain ON whale_rankings(address, chain);
CREATE INDEX IF NOT EXISTS idx_whale_rankings_balance_rank ON whale_rankings(balance_rank);
CREATE INDEX IF NOT EXISTS idx_whale_rankings_risk_rank ON whale_rankings(risk_rank);

-- Function to refresh materialized view
CREATE OR REPLACE FUNCTION refresh_whale_rankings()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY whale_rankings;
END;
$$ LANGUAGE plpgsql;

COMMIT;