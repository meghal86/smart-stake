-- Add user preferences table for personalization
CREATE TABLE public.user_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  favorite_chains TEXT[] DEFAULT ARRAY['ethereum'],
  favorite_tokens TEXT[] DEFAULT ARRAY[],
  min_whale_threshold NUMERIC DEFAULT 1000000,
  notification_settings JSONB DEFAULT '{"whale_alerts": true, "yield_alerts": true, "risk_alerts": false}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Create policies for user preferences
CREATE POLICY "Users can view their own preferences" 
ON public.user_preferences 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences" 
ON public.user_preferences 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences" 
ON public.user_preferences 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_user_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_preferences_updated_at();

-- Add onboarding completion tracking to users table
ALTER TABLE public.users 
ADD COLUMN onboarding_completed BOOLEAN DEFAULT false;

-- Add historical yields data table for analytics
CREATE TABLE public.yield_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  protocol TEXT NOT NULL,
  chain TEXT NOT NULL,
  apy NUMERIC NOT NULL,
  tvl_usd NUMERIC NOT NULL,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for yield history
ALTER TABLE public.yield_history ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read yield history data
CREATE POLICY "Anyone can view yield history" 
ON public.yield_history 
FOR SELECT 
USING (true);

-- Only service can insert yield history
CREATE POLICY "Only service can insert yield history" 
ON public.yield_history 
FOR INSERT 
WITH CHECK (false);

-- Create index for efficient querying
CREATE INDEX idx_yield_history_protocol_chain_date 
ON public.yield_history (protocol, chain, recorded_at DESC);