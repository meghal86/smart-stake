import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Prediction {
  id: string;
  ts: string;
  asset: string;
  direction: 'long' | 'short';
  confidence: number;
  horizonMin: number;
  rationale?: string;
  features?: Record<string, number>;
}

interface UsePredictionsOptions {
  asset?: string;
  limit?: number;
}

export function usePredictions(options: UsePredictionsOptions = {}) {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPredictions();
  }, [options.asset, options.limit]);

  const fetchPredictions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('whale-predictions', {
        body: { asset: options.asset, limit: options.limit }
      });

      if (error) throw error;

      // Transform data to match interface
      const transformedPredictions: Prediction[] = (data?.predictions || []).map((p: unknown) => ({
        id: p.id,
        ts: p.timestamp || new Date().toISOString(),
        asset: p.asset,
        direction: p.predicted_value > 0 ? 'long' : 'short',
        confidence: p.confidence,
        horizonMin: 360, // 6 hours default
        rationale: p.explanation,
        features: p.features
      }));

      setPredictions(transformedPredictions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch predictions');
      // Fallback mock data
      setPredictions([
        {
          id: '1',
          ts: new Date().toISOString(),
          asset: 'ETH',
          direction: 'long',
          confidence: 0.85,
          horizonMin: 360,
          rationale: 'Strong accumulation pattern detected',
          features: { volume: 0.8, sentiment: 0.7 }
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return { predictions, loading, error, refetch: fetchPredictions };
}