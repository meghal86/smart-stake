-- Guardian Confidence & Evidence Enhancement
-- Adds confidence tracking, better indexes, and request tracing

-- Add confidence column if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='scans' AND column_name='confidence') THEN
    ALTER TABLE public.scans ADD COLUMN confidence numeric NOT NULL DEFAULT 0.8;
  END IF;
END $$;

-- Add request_id for tracing
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='scans' AND column_name='request_id') THEN
    ALTER TABLE public.scans ADD COLUMN request_id text;
  END IF;
END $$;

-- Add check constraint for confidence
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'scans_confidence_check') THEN
    ALTER TABLE public.scans ADD CONSTRAINT scans_confidence_check 
      CHECK (confidence >= 0 AND confidence <= 1);
  END IF;
END $$;

-- Enhanced index for recent scans
-- Note: Removed time-based WHERE clause as CURRENT_TIMESTAMP is not IMMUTABLE
DROP INDEX IF EXISTS idx_scans_target_recent;
CREATE INDEX idx_scans_target_recent ON public.scans(target_address, created_at DESC);

-- Index for user scans ordered by date
DROP INDEX IF EXISTS idx_scans_user_created_desc;
CREATE INDEX idx_scans_user_created_desc ON public.scans(user_id, created_at DESC);

-- Index for request tracing
CREATE INDEX IF NOT EXISTS idx_scans_request_id ON public.scans(request_id) 
  WHERE request_id IS NOT NULL;

-- Add composite index for common queries
CREATE INDEX IF NOT EXISTS idx_scans_target_score ON public.scans(target_address, trust_score, created_at DESC);

-- Function to calculate average confidence per user (last 30 days)
-- Note: Changed to use NOW() at execution time, marked as STABLE
CREATE OR REPLACE FUNCTION public.user_avg_confidence(p_user_id uuid, days_back integer DEFAULT 30)
RETURNS numeric AS $$
  SELECT COALESCE(AVG(confidence), 0.8)
  FROM public.scans
  WHERE user_id = p_user_id
    AND created_at > (NOW() - (days_back || ' days')::INTERVAL);
$$ LANGUAGE SQL STABLE;

-- Grant necessary permissions (specify full signature)
GRANT EXECUTE ON FUNCTION public.user_avg_confidence(uuid, integer) TO authenticated;

-- Add helpful comment
COMMENT ON COLUMN public.scans.confidence IS 'Confidence score (0-1) indicating data quality and freshness';
COMMENT ON COLUMN public.scans.request_id IS 'UUID for request tracing and debugging';

