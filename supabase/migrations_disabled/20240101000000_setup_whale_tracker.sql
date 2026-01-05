-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  email TEXT,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'premium')),
  onboarding_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create users_metadata table for extended user information
CREATE TABLE IF NOT EXISTS public.users_metadata (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  product_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'canceled', 'past_due', 'unpaid', 'trialing')),
  current_period_end TIMESTAMP WITH TIME ZONE,
  rc_entitlement TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create alerts table for whale transactions
CREATE TABLE IF NOT EXISTS public.alerts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  from_addr TEXT NOT NULL,
  to_addr TEXT NOT NULL,
  amount_usd NUMERIC NOT NULL,
  token TEXT NOT NULL,
  chain TEXT NOT NULL,
  tx_hash TEXT NOT NULL UNIQUE,
  detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_preferences table
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  favorite_chains TEXT[],
  favorite_tokens TEXT[],
  min_whale_threshold NUMERIC DEFAULT 1000000,
  notification_settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create devices table for push notifications
CREATE TABLE IF NOT EXISTS public.devices (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  expo_push_token TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, expo_push_token)
);

-- Create risk_scans table
CREATE TABLE IF NOT EXISTS public.risk_scans (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  wallet TEXT NOT NULL,
  result_json JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create yields table
CREATE TABLE IF NOT EXISTS public.yields (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  protocol TEXT NOT NULL,
  chain TEXT NOT NULL,
  apy NUMERIC NOT NULL,
  tvl_usd NUMERIC NOT NULL,
  risk_score NUMERIC NOT NULL CHECK (risk_score >= 0 AND risk_score <= 10),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(protocol, chain)
);

-- Create yield_history table
CREATE TABLE IF NOT EXISTS public.yield_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  protocol TEXT NOT NULL,
  chain TEXT NOT NULL,
  apy NUMERIC NOT NULL,
  tvl_usd NUMERIC NOT NULL,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_user_id ON public.users(user_id);
CREATE INDEX IF NOT EXISTS idx_users_metadata_user_id ON public.users_metadata(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON public.alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_amount_usd ON public.alerts(amount_usd DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_chain ON public.alerts(chain);
CREATE INDEX IF NOT EXISTS idx_alerts_token ON public.alerts(token);
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON public.user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_devices_user_id ON public.devices(user_id);
CREATE INDEX IF NOT EXISTS idx_risk_scans_user_id ON public.risk_scans(user_id);
CREATE INDEX IF NOT EXISTS idx_yields_apy ON public.yields(apy DESC);
CREATE INDEX IF NOT EXISTS idx_yield_history_recorded_at ON public.yield_history(recorded_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.yields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.yield_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies

-- Users table policies
CREATE POLICY "Users can view own data" ON public.users
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own data" ON public.users
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own data" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users metadata policies
CREATE POLICY "Users can view own metadata" ON public.users_metadata
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own metadata" ON public.users_metadata
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own metadata" ON public.users_metadata
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Subscriptions policies
CREATE POLICY "Users can view own subscriptions" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own subscriptions" ON public.subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscriptions" ON public.subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Alerts policies (public read for all authenticated users)
CREATE POLICY "Authenticated users can view alerts" ON public.alerts
  FOR SELECT USING (auth.role() = 'authenticated');

-- User preferences policies
CREATE POLICY "Users can view own preferences" ON public.user_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences" ON public.user_preferences
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences" ON public.user_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Devices policies
CREATE POLICY "Users can view own devices" ON public.devices
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own devices" ON public.devices
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own devices" ON public.devices
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own devices" ON public.devices
  FOR DELETE USING (auth.uid() = user_id);

-- Risk scans policies
CREATE POLICY "Users can view own risk scans" ON public.risk_scans
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own risk scans" ON public.risk_scans
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Yields policies (public read for all authenticated users)
CREATE POLICY "Authenticated users can view yields" ON public.yields
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view yield history" ON public.yield_history
  FOR SELECT USING (auth.role() = 'authenticated');

-- Create functions for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_metadata_updated_at BEFORE UPDATE ON public.users_metadata
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_devices_updated_at BEFORE UPDATE ON public.devices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_yields_updated_at BEFORE UPDATE ON public.yields
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample whale alerts for demo purposes
INSERT INTO public.alerts (from_addr, to_addr, amount_usd, token, chain, tx_hash) VALUES
  ('0x1234567890abcdef1234567890abcdef12345678', '0xabcdef1234567890abcdef1234567890abcdef12', 2500000, 'ETH', 'Ethereum', '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12'),
  ('0x9876543210fedcba9876543210fedcba98765432', '0xfedcba9876543210fedcba9876543210fedcba98', 1800000, 'USDC', 'Polygon', '0xfedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210fe'),
  ('0x5555555555555555555555555555555555555555', '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', 950000, 'BTC', 'Bitcoin', '0x5555555555555555555555555555555555555555555555555555555555555555'),
  ('0x7777777777777777777777777777777777777777', '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb', 3200000, 'ETH', 'Ethereum', '0x7777777777777777777777777777777777777777777777777777777777777777'),
  ('0x8888888888888888888888888888888888888888', '0xcccccccccccccccccccccccccccccccccccccccc', 1500000, 'MATIC', 'Polygon', '0x8888888888888888888888888888888888888888888888888888888888888888')
ON CONFLICT (tx_hash) DO NOTHING;

-- Insert some sample yield data
INSERT INTO public.yields (protocol, chain, apy, tvl_usd, risk_score) VALUES
  ('Aave', 'Ethereum', 4.5, 12500000000, 2.1),
  ('Compound', 'Ethereum', 3.8, 8900000000, 2.3),
  ('Uniswap V3', 'Ethereum', 12.4, 6700000000, 4.2),
  ('PancakeSwap', 'BSC', 8.9, 3400000000, 3.8),
  ('QuickSwap', 'Polygon', 15.2, 890000000, 5.1),
  ('Curve', 'Ethereum', 6.7, 4200000000, 2.8),
  ('SushiSwap', 'Ethereum', 9.3, 2100000000, 3.5)
ON CONFLICT (protocol, chain) DO NOTHING;