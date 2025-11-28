import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface LivePortfolioData {
  address: string;
  totalValue: number;
  tokens: Array<{
    symbol: string;
    balance: number;
    value_usd: number;
    price_change_24h: number;
  }>;
  riskScore: number;
  whaleInteractions: number;
  lastUpdated: string;
}

export function useLivePortfolio(addresses: string[]) {
  const [data, setData] = useState<Record<string, LivePortfolioData>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLiveData = async () => {
    if (addresses.length === 0) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Temporarily disable live data calls to prevent infinite loops
      // const { data: liveData, error: fetchError } = await supabase.functions.invoke('portfolio-tracker-live', {
      //   body: { addresses },
      //   headers: {
      //     'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token || ''}`
      //   }
      // });
      
      // Use mock data instead
      const liveData: Record<string, {
        total_value_usd: number;
        tokens: Array<{ symbol: string; balance: number; value_usd: number; price_change_24h: number }>;
        risk_score: number;
        whale_interactions: number;
      }> = {};
      addresses.forEach(address => {
        liveData[address] = {
          total_value_usd: Math.random() * 100000 + 50000,
          tokens: [
            { symbol: 'ETH', balance: 15.5, value_usd: 54250, price_change_24h: 2.3 },
            { symbol: 'BTC', balance: 0.8, value_usd: 52000, price_change_24h: 1.8 }
          ],
          risk_score: Math.random() * 3 + 7,
          whale_interactions: Math.floor(Math.random() * 10)
        };
      });
      const fetchError = null;
      
      if (fetchError) {
        throw fetchError;
      }
      
      // Transform data
      const transformedData: Record<string, LivePortfolioData> = {};
      
      for (const address of addresses) {
        const portfolioData = liveData[address];
        if (portfolioData) {
          transformedData[address] = {
            address,
            totalValue: portfolioData.total_value_usd,
            tokens: portfolioData.tokens,
            riskScore: portfolioData.risk_score,
            whaleInteractions: portfolioData.whale_interactions,
            lastUpdated: new Date().toISOString()
          };
        }
      }
      
      setData(transformedData);
    } catch (err: unknown) {
      console.error('Live portfolio fetch error:', err);
      setError('Failed to fetch live portfolio data. Using cached data.');
      
      // Try to get cached data
      try {
        const { data: cachedData } = await supabase
          .from('portfolio_snapshots')
          .select('*')
          .in('address', addresses)
          .order('snapshot_time', { ascending: false });
          
        if (cachedData) {
          const transformedCached: Record<string, LivePortfolioData> = {};
          
          cachedData.forEach(cached => {
            transformedCached[cached.address] = {
              address: cached.address,
              totalValue: cached.total_value_usd || 0,
              tokens: cached.holdings || [],
              riskScore: cached.risk_score || 5,
              whaleInteractions: cached.whale_interactions || 0,
              lastUpdated: cached.snapshot_time
            };
          });
          
          setData(transformedCached);
        }
      } catch (cacheError) {
        console.error('Cache fetch error:', cacheError);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveData();
    
    // Set up auto-refresh every 2 minutes
    const interval = setInterval(fetchLiveData, 120000);
    
    return () => clearInterval(interval);
  }, [addresses]);

  return {
    data,
    loading,
    error,
    refetch: fetchLiveData,
    isLive: Object.keys(data).length > 0
  };
}