-- Add signal filters to user_profiles
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS signal_filters JSONB DEFAULT '{
  "mutedWallets": [], 
  "mutedExchanges": [], 
  "mutedAssets": []
}'::jsonb;
