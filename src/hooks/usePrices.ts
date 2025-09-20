import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PriceData {
  timestamp: string;
  provider: 'coingecko' | 'cmc' | 'stale';
  quality: 'ok' | 'degraded' | 'stale';
  assets: Record<string, { price_usd: number }>;
}

interface UsePricesReturn {
  data: PriceData | null;
  isLoading: boolean;
  error: string | null;
  provider: string | null;
  quality: string | null;
}

export function usePrices(
  assets: string[] = ['ETH', 'BTC'], 
  refreshMs: number = 30000
): UsePricesReturn {
  const [data, setData] = useState<PriceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isVisibleRef = useRef(true);

  const fetchPrices = async () => {
    try {
      setError(null);
      
      const assetsParam = assets.join(',');
      const { data: response, error: fetchError } = await supabase.functions.invoke('prices', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (fetchError) throw fetchError;

      // If we have a direct response, use it
      if (response) {
        setData(response);
      } else {
        // Fallback: direct API call
        const url = `${supabase.supabaseUrl}/functions/v1/prices?assets=${assetsParam}`;
        const apiResponse = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${supabase.supabaseKey}`,
            'Content-Type': 'application/json'
          }
        });

        if (!apiResponse.ok) {
          throw new Error(`API error: ${apiResponse.status}`);
        }

        const apiData = await apiResponse.json();
        setData(apiData);
      }
    } catch (err) {
      console.error('Failed to fetch prices:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch prices');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      isVisibleRef.current = !document.hidden;
      
      if (isVisibleRef.current && intervalRef.current === null) {
        // Resume polling when page becomes visible
        fetchPrices();
        intervalRef.current = setInterval(() => {
          if (isVisibleRef.current) {
            fetchPrices();
          }
        }, refreshMs);
      } else if (!isVisibleRef.current && intervalRef.current) {
        // Pause polling when page is hidden
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [refreshMs]);

  // Initial fetch and polling setup
  useEffect(() => {
    fetchPrices();

    // Set up polling interval
    intervalRef.current = setInterval(() => {
      if (isVisibleRef.current) {
        fetchPrices();
      }
    }, refreshMs);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [assets.join(','), refreshMs]);

  return {
    data,
    isLoading,
    error,
    provider: data?.provider || null,
    quality: data?.quality || null
  };
}

// Utility hook for single asset price
export function usePrice(asset: string = 'ETH', refreshMs: number = 30000) {
  const { data, isLoading, error, provider, quality } = usePrices([asset], refreshMs);
  
  return {
    price: data?.assets[asset]?.price_usd || null,
    isLoading,
    error,
    provider,
    quality,
    timestamp: data?.timestamp || null
  };
}

// Hook for price health monitoring
export function usePriceHealth() {
  const [health, setHealth] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('prices/health');
        if (error) throw error;
        setHealth(data);
      } catch (err) {
        console.error('Failed to fetch price health:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHealth();
    const interval = setInterval(fetchHealth, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  return { health, isLoading };
}