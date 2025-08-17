-- Create users table (extends auth.users with additional fields)
CREATE TABLE public.users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'premium')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create alerts table for whale transactions
CREATE TABLE public.alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chain TEXT NOT NULL,
  token TEXT NOT NULL,
  amount_usd DECIMAL(20,2) NOT NULL,
  tx_hash TEXT NOT NULL,
  from_addr TEXT NOT NULL,
  to_addr TEXT NOT NULL,
  detected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create yields table for DeFi protocols
CREATE TABLE public.yields (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  protocol TEXT NOT NULL,
  chain TEXT NOT NULL,
  apy DECIMAL(8,4) NOT NULL,
  tvl_usd DECIMAL(20,2) NOT NULL,
  risk_score INTEGER NOT NULL CHECK (risk_score >= 0 AND risk_score <= 100),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create risk_scans table for wallet analysis
CREATE TABLE public.risk_scans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet TEXT NOT NULL,
  result_json JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create devices table for push notifications
CREATE TABLE public.devices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expo_push_token TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android')),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, expo_push_token)
);

-- Create subscriptions table for RevenueCat integration
CREATE TABLE public.subscriptions (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  status TEXT NOT NULL CHECK (status IN ('active', 'expired', 'cancelled', 'trial')),
  product_id TEXT NOT NULL,
  current_period_end TIMESTAMP WITH TIME ZONE,
  rc_entitlement TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.yields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view their own profile" 
ON public.users 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.users 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.users 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for alerts table (public read for all users)
CREATE POLICY "Anyone can view alerts" 
ON public.alerts 
FOR SELECT 
USING (true);

CREATE POLICY "Only service can insert alerts" 
ON public.alerts 
FOR INSERT 
WITH CHECK (false); -- Only edge functions can insert

-- RLS Policies for yields table (public read)
CREATE POLICY "Anyone can view yields" 
ON public.yields 
FOR SELECT 
USING (true);

CREATE POLICY "Only service can modify yields" 
ON public.yields 
FOR ALL 
USING (false); -- Only edge functions can modify

-- RLS Policies for risk_scans table
CREATE POLICY "Users can view their own risk scans" 
ON public.risk_scans 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own risk scans" 
ON public.risk_scans 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for devices table
CREATE POLICY "Users can view their own devices" 
ON public.devices 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own devices" 
ON public.devices 
FOR ALL 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for subscriptions table
CREATE POLICY "Users can view their own subscription" 
ON public.subscriptions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscription" 
ON public.subscriptions 
FOR ALL 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_devices_updated_at
  BEFORE UPDATE ON public.devices
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user signups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (user_id, email, plan)
  VALUES (NEW.id, NEW.email, 'free');
  RETURN NEW;
END;
$$;

-- Trigger to create user profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Add indexes for better performance
CREATE INDEX idx_alerts_detected_at ON public.alerts(detected_at DESC);
CREATE INDEX idx_alerts_amount_usd ON public.alerts(amount_usd DESC);
CREATE INDEX idx_alerts_chain ON public.alerts(chain);
CREATE INDEX idx_alerts_token ON public.alerts(token);

CREATE INDEX idx_yields_apy ON public.yields(apy DESC);
CREATE INDEX idx_yields_chain ON public.yields(chain);
CREATE INDEX idx_yields_updated_at ON public.yields(updated_at DESC);

CREATE INDEX idx_risk_scans_user_id ON public.risk_scans(user_id);
CREATE INDEX idx_risk_scans_created_at ON public.risk_scans(created_at DESC);

CREATE INDEX idx_devices_user_id ON public.devices(user_id);
CREATE INDEX idx_users_user_id ON public.users(user_id);