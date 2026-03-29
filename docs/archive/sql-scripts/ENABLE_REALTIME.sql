-- Enable Realtime for whale_digest table
-- Run this in Supabase SQL Editor

ALTER PUBLICATION supabase_realtime ADD TABLE whale_digest;

-- Verify it's enabled
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime';
