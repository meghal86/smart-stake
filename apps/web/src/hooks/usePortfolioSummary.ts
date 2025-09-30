import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface PortfolioSummary {
  total_value: number;
  monitored_addresses: number;
  pnl_24h: number;
  pnl_24h_pct: number;
  last_activity: string;
  top_holdings: Array<{
    asset: string;
    value: number;
    percentage: number;
  }>;
}

interface PortfolioResponse {
  success: boolean;
  data: PortfolioSummary;
  meta: {
    cached: boolean;
    refreshed_at: string;
  };
}

export function usePortfolioSummary() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['portfolio-summary', user?.id],
    queryFn: async (): Promise<PortfolioResponse> => {
      if (!user) {
        throw new Error('User not authenticated');
      }

      // For now, return mock data since portfolio endpoint doesn't exist yet
      // This would call: supabase.functions.invoke('portfolio-summary')
      
      const mockData: PortfolioResponse = {
        success: true,
        data: {
          total_value: 125000,
          monitored_addresses: 3,
          pnl_24h: 2500,
          pnl_24h_pct: 2.04,
          last_activity: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
          top_holdings: [
            { asset: 'ETH', value: 75000, percentage: 60 },
            { asset: 'BTC', value: 37500, percentage: 30 },
            { asset: 'SOL', value: 12500, percentage: 10 }
          ]
        },
        meta: {
          cached: false,
          refreshed_at: new Date().toISOString()
        }
      };

      return mockData;
    },
    enabled: !!user,
    refetchInterval: 120_000, // 2 minutes
    staleTime: 90_000, // Consider stale after 90s
    retry: 1
  });
}