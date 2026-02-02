import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PortfolioData {
  address: string;
  balance: number;
  tokens: Array<{
    symbol: string;
    balance: number;
    value_usd: number;
    price_change_24h: number;
  }>;
  total_value_usd: number;
  whale_interactions: number;
  risk_score: number;
}

export function usePortfolioData(addresses: string[]) {
  const [data, setData] = useState<Record<string, PortfolioData>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const addressesStr = JSON.stringify(addresses);

  const fetchPortfolioData = async () => {
    if (addresses.length === 0) {
      setData({});
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const { data: portfolioData, error } = await supabase.functions.invoke('portfolio-tracker', {
        body: { addresses },
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token || ''}`
        }
      });
      
      if (error) throw error;
      setData(portfolioData || {});
    } catch (err: unknown) {
      console.error('Portfolio API error:', err);
      if (err.message?.includes('404') || err.message?.includes('Failed to send a request')) {
        setError('Portfolio tracking service is not deployed. Please deploy the portfolio-tracker Edge Function.');
      } else {
        setError('Unable to load portfolio data. Please try again later.');
      }
      setData({});
    } finally {
      setLoading(false);
    }
  };

  // Fetch fresh data whenever addresses change (wallet switching)
  useEffect(() => {
    // Clear previous data immediately to prevent stale data display
    setData({});
    fetchPortfolioData();
  }, [addressesStr]);

  return { data, loading, error, refetch: fetchPortfolioData };
}