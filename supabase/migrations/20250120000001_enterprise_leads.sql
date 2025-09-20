-- Create enterprise_leads table for storing contact sales submissions
CREATE TABLE IF NOT EXISTS enterprise_leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT NOT NULL,
  message TEXT,
  company_size TEXT,
  use_case TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policy
ALTER TABLE enterprise_leads ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert their own leads
CREATE POLICY "Users can insert enterprise leads" ON enterprise_leads
  FOR INSERT WITH CHECK (true);

-- Allow service role to read all leads (for admin purposes)
CREATE POLICY "Service role can read all enterprise leads" ON enterprise_leads
  FOR SELECT USING (auth.role() = 'service_role');

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_enterprise_leads_created_at ON enterprise_leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_enterprise_leads_email ON enterprise_leads(email);