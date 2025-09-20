import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type PredictionCluster = {
  id: string;
  label: string;
  assets: string[];
  signal_count: number;
  direction: 'long' | 'short';
  confidence: number;
  rationale?: string;
};

export function usePredictionClusters() {
  const [clusters, setClusters] = useState<PredictionCluster[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClusters = async () => {
      try {
        const { data, error } = await supabase
          .from('prediction_clusters')
          .select('*')
          .order('confidence', { ascending: false })
          .limit(5);

        if (error) throw error;
        setClusters(data || []);
      } catch (error) {
        console.error('Error fetching clusters:', error);
        // Mock clusters for demo
        setClusters([
          {
            id: '1',
            label: 'ETH Upside Cluster',
            assets: ['ETH', 'BTC'],
            signal_count: 3,
            direction: 'long',
            confidence: 0.85,
            rationale: 'Strong whale accumulation across major assets'
          },
          {
            id: '2',
            label: 'DeFi Momentum',
            assets: ['ETH'],
            signal_count: 2,
            direction: 'long',
            confidence: 0.72,
            rationale: 'Increased DeFi activity driving demand'
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchClusters();
  }, []);

  return { clusters, loading };
}