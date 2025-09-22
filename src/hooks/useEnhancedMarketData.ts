import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { calculateMarketMood } from '@/utils/marketMood';

interface MarketSummaryData {
  volume24h: number;
  activeWhales: number;
  riskAlerts: number;
  avgRiskScore: number;
  volumeDelta: number;
  whalesDelta: number;
  riskAlertsDelta: number;
  riskScoreDelta: number;
  btcPrice: number;
  ethPrice: number;
  btcChange: number;
  ethChange: number;
  marketMood: {
    mood: number;
    label: string;
    color: string;
    description: string;
  };
  refreshedAt: string;
}

export function useEnhancedMarketData() {
  return useQuery({
    queryKey: ['market-summary'],
    queryFn: async (): Promise<MarketSummaryData> => {
      try {
        // Try to call the market-summary edge function first
        const { data: edgeData, error: edgeError } = await supabase.functions.invoke('market-summary');
        
        if (!edgeError && edgeData) {
          return edgeData;
        }
      } catch (error) {
        console.warn('Edge function not available, using fallback data');
      }

      // Fallback to individual queries and mock data
      const [whaleData, priceData] = await Promise.all([
        // Whale data query
        supabase
          .from('whale_balances')
          .select('balance_usd, ts')
          .gte('ts', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
          .order('ts', { ascending: false })
          .limit(1000),
        
        // Price data (mock for now)
        Promise.resolve({
          btcPrice: 43500 + (Math.random() - 0.5) * 2000,
          ethPrice: 2650 + (Math.random() - 0.5) * 200,
          btcChange: (Math.random() - 0.5) * 10,
          ethChange: (Math.random() - 0.5) * 8
        })
      ]);

      // Calculate metrics from whale data
      const whaleBalances = whaleData.data || [];
      const volume24h = whaleBalances.reduce((sum, w) => sum + (w.balance_usd || 0), 0);
      const activeWhales = whaleBalances.length;
      
      // Mock additional metrics
      const riskAlerts = Math.floor(Math.random() * 50) + 10;
      const avgRiskScore = Math.floor(Math.random() * 40) + 30;
      
      // Calculate deltas (mock)
      const volumeDelta = (Math.random() - 0.5) * 20;
      const whalesDelta = (Math.random() - 0.5) * 15;
      const riskAlertsDelta = (Math.random() - 0.5) * 25;
      const riskScoreDelta = (Math.random() - 0.5) * 10;

      // Calculate market mood
      const marketMood = calculateMarketMood({
        btcChange: priceData.btcChange,
        ethChange: priceData.ethChange,
        volume24h: volume24h / 1000000, // Convert to millions
        activeWhales,
        riskScore: avgRiskScore
      });

      return {
        volume24h,
        activeWhales,
        riskAlerts,
        avgRiskScore,
        volumeDelta,
        whalesDelta,
        riskAlertsDelta,
        riskScoreDelta,
        btcPrice: priceData.btcPrice,
        ethPrice: priceData.ethPrice,
        btcChange: priceData.btcChange,
        ethChange: priceData.ethChange,
        marketMood,
        refreshedAt: new Date().toISOString()
      };
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
  });
}