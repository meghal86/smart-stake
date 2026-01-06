-- =====================================================
-- Dead Letter Queue (DLQ) Events Table
-- =====================================================
-- This table stores failed whale analytics ingestion events for retry processing
-- and error tracking. Events that fail processing are stored here with error
-- details and retry metadata for debugging and reprocessing.

-- =====================================================
-- DLQ EVENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS dlq_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Event Data
    payload JSONB NOT NULL,                   -- Original event payload that failed processing
    
    -- Error Information  
    error_message TEXT NOT NULL,              -- Primary error message from failed processing
    last_error TEXT,                          -- Most recent error message (for retries)
    
    -- Retry Metadata
    retry_count INTEGER DEFAULT 0,            -- Number of retry attempts made
    resolved BOOLEAN DEFAULT FALSE,           -- Whether the event was successfully processed
    
    -- Timestamps
    first_seen TIMESTAMP DEFAULT NOW(),       -- When error was first encountered
    last_retry TIMESTAMP,                     -- When last retry attempt was made
    resolved_at TIMESTAMP,                    -- When event was successfully resolved
    
    -- Additional Context
    source_function TEXT,                     -- Which function/service generated the error
    event_type TEXT,                          -- Type of event (balance, transfer, signal)
    
    -- Constraints
    CONSTRAINT dlq_events_retry_count_positive CHECK (retry_count >= 0),
    CONSTRAINT dlq_events_resolved_at_check CHECK (
        (resolved = TRUE AND resolved_at IS NOT NULL) OR 
        (resolved = FALSE AND resolved_at IS NULL)
    )
);

-- =====================================================
-- INDEXES FOR EFFICIENT QUERYING
-- =====================================================

-- Primary index for unresolved events ordered by first occurrence
CREATE INDEX idx_dlq_events_unresolved_first_seen ON dlq_events(first_seen ASC) 
WHERE resolved = FALSE;

-- Index for retry processing (unresolved events with low retry count)
CREATE INDEX idx_dlq_events_retry_queue ON dlq_events(retry_count ASC, first_seen ASC) 
WHERE resolved = FALSE;

-- Index for monitoring and alerting on error patterns
CREATE INDEX idx_dlq_events_error_analysis ON dlq_events(event_type, source_function, first_seen DESC);

-- Index for cleanup operations (resolved events)
CREATE INDEX idx_dlq_events_resolved_cleanup ON dlq_events(resolved_at DESC) 
WHERE resolved = TRUE;

-- GIN index for efficient JSONB payload queries
CREATE INDEX idx_dlq_events_payload_gin ON dlq_events USING GIN (payload);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS for security
ALTER TABLE dlq_events ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (for backend error handling)
CREATE POLICY "Service role full access on dlq_events" ON dlq_events
    FOR ALL USING (auth.role() = 'service_role');

-- Allow authenticated users read-only access for monitoring
CREATE POLICY "Authenticated users can read dlq_events" ON dlq_events
    FOR SELECT USING (auth.role() = 'authenticated');

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to insert new DLQ event
CREATE OR REPLACE FUNCTION insert_dlq_event(
    p_payload JSONB,
    p_error_message TEXT,
    p_source_function TEXT DEFAULT NULL,
    p_event_type TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    event_id UUID;
BEGIN
    INSERT INTO dlq_events (
        payload, 
        error_message, 
        source_function, 
        event_type
    ) VALUES (
        p_payload, 
        p_error_message, 
        p_source_function, 
        p_event_type
    ) RETURNING id INTO event_id;
    
    RETURN event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark event as resolved
CREATE OR REPLACE FUNCTION resolve_dlq_event(p_event_id UUID) RETURNS BOOLEAN AS $$
BEGIN
    UPDATE dlq_events 
    SET resolved = TRUE, resolved_at = NOW() 
    WHERE id = p_event_id AND resolved = FALSE;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment retry count
CREATE OR REPLACE FUNCTION increment_dlq_retry(
    p_event_id UUID, 
    p_new_error TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
BEGIN
    UPDATE dlq_events 
    SET 
        retry_count = retry_count + 1,
        last_retry = NOW(),
        last_error = COALESCE(p_new_error, last_error)
    WHERE id = p_event_id AND resolved = FALSE;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE dlq_events IS 'Dead letter queue for failed whale analytics ingestion events, enabling retry processing and error analysis';

COMMENT ON COLUMN dlq_events.payload IS 'Original JSONB payload that failed processing (contains full event data for retry)';
COMMENT ON COLUMN dlq_events.error_message IS 'Primary error message from initial processing failure';
COMMENT ON COLUMN dlq_events.last_error IS 'Most recent error message from retry attempts';
COMMENT ON COLUMN dlq_events.retry_count IS 'Number of retry attempts made (0 = never retried)';
COMMENT ON COLUMN dlq_events.resolved IS 'Whether event was successfully processed after retry';
COMMENT ON COLUMN dlq_events.first_seen IS 'Timestamp when error was first encountered';
COMMENT ON COLUMN dlq_events.source_function IS 'Function or service that generated the error';
COMMENT ON COLUMN dlq_events.event_type IS 'Type of whale analytics event (balance, transfer, signal)';

COMMENT ON FUNCTION insert_dlq_event IS 'Helper function to insert new DLQ event with proper metadata';
COMMENT ON FUNCTION resolve_dlq_event IS 'Mark a DLQ event as successfully resolved';
COMMENT ON FUNCTION increment_dlq_retry IS 'Increment retry count and update error message for DLQ event';

-- =====================================================
-- USAGE EXAMPLES
-- =====================================================
-- 
-- Insert a failed event:
-- SELECT insert_dlq_event(
--     '{"address": "0x123...", "balance": "1000.5"}'::jsonb,
--     'API timeout after 30 seconds',
--     'blockchain-monitor',
--     'balance'
-- );
--
-- Get unresolved events for retry:
-- SELECT * FROM dlq_events 
-- WHERE resolved = FALSE AND retry_count < 3 
-- ORDER BY first_seen ASC LIMIT 10;
--
-- Mark event as resolved:
-- SELECT resolve_dlq_event('550e8400-e29b-41d4-a716-446655440000');
--
-- Increment retry count:
-- SELECT increment_dlq_retry(
--     '550e8400-e29b-41d4-a716-446655440000',
--     'Connection refused on retry'
-- );