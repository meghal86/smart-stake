-- =====================================================
-- Security & Performance Enhancement Migration
-- =====================================================

-- =====================================================
-- RLS POLICIES FOR USER DATA TABLES
-- =====================================================

-- User watchlists policies
ALTER TABLE user_watchlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own watchlists" ON user_watchlists
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Service role full access on user_watchlists" ON user_watchlists
    FOR ALL USING (auth.role() = 'service_role');

-- Alert rules policies
ALTER TABLE alert_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own alert rules" ON alert_rules
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Service role full access on alert_rules" ON alert_rules
    FOR ALL USING (auth.role() = 'service_role');

-- Alert notifications policies
ALTER TABLE alert_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own alert notifications" ON alert_notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role full access on alert_notifications" ON alert_notifications
    FOR ALL USING (auth.role() = 'service_role');

-- Shared watchlists policies
ALTER TABLE shared_watchlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view public shared watchlists" ON shared_watchlists
    FOR SELECT USING (is_public = true OR auth.uid() = created_by);

CREATE POLICY "Users can manage their own shared watchlists" ON shared_watchlists
    FOR ALL USING (auth.uid() = created_by);

-- =====================================================
-- PERFORMANCE INDEXES
-- =====================================================

-- Whale balances indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_whale_balances_addr_chain_ts 
ON whale_balances(address, chain, ts DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_whale_balances_ts_balance 
ON whale_balances(ts DESC, balance DESC);

-- Whale transfers indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_whale_transfers_addr_chain_ts 
ON whale_transfers(from_address, chain, ts DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_whale_transfers_to_addr_chain_ts 
ON whale_transfers(to_address, chain, ts DESC);

-- Whale signals indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_whale_signals_addr_chain_ts 
ON whale_signals(address, chain, ts DESC);

-- Partial indexes for active data
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_whale_signals_active_high_confidence 
ON whale_signals(address, chain, ts DESC) 
WHERE confidence >= 0.8;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_alert_rules_active 
ON alert_rules(user_id, whale_address) 
WHERE active = true;

-- User data indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_watchlists_user_whale 
ON user_watchlists(user_id, whale_address);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_alert_notifications_user_status 
ON alert_notifications(user_id, status, created_at DESC);

-- =====================================================
-- DTO VIEWS (AVOID SELECT *)
-- =====================================================

-- Whale summary view for dashboard
CREATE OR REPLACE VIEW whale_summary_dto AS
SELECT 
    wb.address,
    wb.chain,
    wb.balance,
    wb.ingested_at as last_updated,
    ws.signal_type,
    ws.confidence,
    ws.reasons
FROM whale_balances wb
LEFT JOIN LATERAL (
    SELECT signal_type, confidence, reasons
    FROM whale_signals 
    WHERE address = wb.address AND chain = wb.chain
    ORDER BY ts DESC 
    LIMIT 1
) ws ON true;

-- Alert rules DTO view
CREATE OR REPLACE VIEW alert_rules_dto AS
SELECT 
    id,
    user_id,
    whale_address,
    alert_type,
    threshold_value,
    cooldown_minutes,
    hysteresis_percent,
    delivery_method,
    active,
    created_at
FROM alert_rules;

-- User watchlist DTO view
CREATE OR REPLACE VIEW user_watchlist_dto AS
SELECT 
    uw.user_id,
    uw.whale_address,
    uw.created_at,
    wb.balance,
    wb.chain,
    ws.signal_type as latest_signal
FROM user_watchlists uw
LEFT JOIN whale_balances wb ON wb.address = uw.whale_address
LEFT JOIN LATERAL (
    SELECT signal_type
    FROM whale_signals 
    WHERE address = uw.whale_address
    ORDER BY ts DESC 
    LIMIT 1
) ws ON true;

-- Alert delivery log DTO view
CREATE OR REPLACE VIEW alert_delivery_dto AS
SELECT 
    id,
    user_id,
    whale_address,
    alert_type,
    status,
    delivery_method,
    message,
    error_message,
    created_at
FROM alert_notifications
ORDER BY created_at DESC;

-- =====================================================
-- GRANT PERMISSIONS ON VIEWS
-- =====================================================

GRANT SELECT ON whale_summary_dto TO authenticated;
GRANT SELECT ON alert_rules_dto TO authenticated;
GRANT SELECT ON user_watchlist_dto TO authenticated;
GRANT SELECT ON alert_delivery_dto TO authenticated;

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON VIEW whale_summary_dto IS 'Optimized whale data for dashboard display without SELECT *';
COMMENT ON VIEW alert_rules_dto IS 'User alert configuration data transfer object';
COMMENT ON VIEW user_watchlist_dto IS 'User watchlist with enriched whale data';
COMMENT ON VIEW alert_delivery_dto IS 'Alert delivery status and history';

COMMENT ON INDEX idx_whale_balances_addr_chain_ts IS 'Composite index for whale balance queries by address and chain';
COMMENT ON INDEX idx_whale_signals_active_high_confidence IS 'Partial index for high-confidence active signals only';