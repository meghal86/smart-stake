-- Create webhook_logs table for debugging
CREATE TABLE IF NOT EXISTS public.webhook_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_type TEXT NOT NULL,
  event_id TEXT,
  status TEXT NOT NULL CHECK (status IN ('processing', 'success', 'failed')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for service role access
CREATE POLICY "Service role can manage webhook logs" ON public.webhook_logs
  FOR ALL USING (true);