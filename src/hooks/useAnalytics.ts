import { useAuth } from '@/contexts/AuthContext';
import { useTier } from './useTier';
import { supabase } from '@/integrations/supabase/client';

interface AnalyticsEvent {
  event: string;
  properties?: Record<string, any>;
}

export function useAnalytics() {
  const { user } = useAuth();
  const { tier } = useTier();

  const track = async (eventName: string, properties: Record<string, any> = {}) => {
    const payload = {
      user_id: user?.id,
      event_name: eventName,
      user_tier: tier,
      asset: properties.asset,
      timeframe: properties.timeframe,
      model_version: properties.model_version || 'scn-v1.0',
      properties,
      session_id: sessionStorage.getItem('session_id') || crypto.randomUUID()
    };

    // Store session ID
    if (!sessionStorage.getItem('session_id')) {
      sessionStorage.setItem('session_id', payload.session_id!);
    }

    try {
      // Store in Supabase analytics
      await supabase.from('analytics_events').insert(payload);
      
      // Also log to console for debugging
      console.log('Analytics:', payload);
    } catch (error) {
      console.error('Analytics tracking failed:', error);
    }
  };

  return { track };
}