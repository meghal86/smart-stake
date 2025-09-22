import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface FeatureFlag {
  key: string;
  enabled: boolean;
  config?: Record<string, any>;
}

const DEFAULT_FLAGS: Record<string, boolean> = {
  'kpi_microcopy': true,
  'correlation_heatmap': true,
  'what_if_rebalance': true,
  'scheduled_exports': false,
  'team_sharing': false,
  'custom_kpi_cards': false,
  'market_mood_weights': false,
  'mobile_widgets': true,
  'audit_logging': false
};

export function useFeatureFlags() {
  const { data: flags, isLoading } = useQuery({
    queryKey: ['feature-flags'],
    queryFn: async (): Promise<Record<string, boolean>> => {
      try {
        const { data, error } = await supabase
          .from('feature_flags')
          .select('key, enabled, config');
        
        if (error) throw error;
        
        const flagMap: Record<string, boolean> = { ...DEFAULT_FLAGS };
        data?.forEach((flag: FeatureFlag) => {
          flagMap[flag.key] = flag.enabled;
        });
        
        return flagMap;
      } catch (error) {
        console.warn('Failed to load feature flags, using defaults:', error);
        return DEFAULT_FLAGS;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 10 * 60 * 1000, // 10 minutes
  });

  const isEnabled = (flagKey: string): boolean => {
    return flags?.[flagKey] ?? DEFAULT_FLAGS[flagKey] ?? false;
  };

  return {
    flags: flags ?? DEFAULT_FLAGS,
    isEnabled,
    isLoading
  };
}