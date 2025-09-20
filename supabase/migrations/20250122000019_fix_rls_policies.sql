-- Fix RLS policies for admin access to attribution tables

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Admins can read all attribution events" ON preset_click_events;
DROP POLICY IF EXISTS "Admins can read all lock events" ON feature_lock_events;
DROP POLICY IF EXISTS "Admins can read all upgrade events" ON upgrade_events;
DROP POLICY IF EXISTS "Admins can read forecasts" ON upgrade_forecasts;

-- Create more permissive admin policies
CREATE POLICY "Admins can read preset clicks" ON preset_click_events 
  FOR SELECT USING (
    auth.jwt() ->> 'role' = 'service_role' OR
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Admins can read feature locks" ON feature_lock_events 
  FOR SELECT USING (
    auth.jwt() ->> 'role' = 'service_role' OR
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Admins can read upgrade events" ON upgrade_events 
  FOR SELECT USING (
    auth.jwt() ->> 'role' = 'service_role' OR
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Also allow admin access to forecasts
CREATE POLICY "Admins can read forecasts" ON upgrade_forecasts 
  FOR SELECT USING (
    auth.jwt() ->> 'role' = 'service_role' OR
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );