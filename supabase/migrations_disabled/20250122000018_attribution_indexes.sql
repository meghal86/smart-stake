-- Performance indexes for attribution system

-- Preset clicks indexes
CREATE INDEX IF NOT EXISTS ix_preset_clicks_user_time ON preset_click_events(user_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS ix_preset_clicks_preset_time ON preset_click_events(preset_key, occurred_at DESC);
CREATE INDEX IF NOT EXISTS ix_preset_clicks_time ON preset_click_events(occurred_at DESC);

-- Feature locks indexes  
CREATE INDEX IF NOT EXISTS ix_lock_user_time ON feature_lock_events(user_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS ix_lock_feature_time ON feature_lock_events(lock_key, occurred_at DESC);
CREATE INDEX IF NOT EXISTS ix_lock_time ON feature_lock_events(occurred_at DESC);

-- Upgrades indexes
CREATE INDEX IF NOT EXISTS ix_upgrades_user_time ON upgrade_events(user_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS ix_upgrades_time ON upgrade_events(occurred_at DESC);
CREATE INDEX IF NOT EXISTS ix_upgrades_preset_key ON upgrade_events(last_preset_key, occurred_at DESC);
CREATE INDEX IF NOT EXISTS ix_upgrades_lock_key ON upgrade_events(last_lock_key, occurred_at DESC);

-- Composite indexes for attribution queries
CREATE INDEX IF NOT EXISTS ix_preset_clicks_user_preset_time ON preset_click_events(user_id, preset_key, occurred_at DESC);
CREATE INDEX IF NOT EXISTS ix_lock_events_user_lock_time ON feature_lock_events(user_id, lock_key, occurred_at DESC);