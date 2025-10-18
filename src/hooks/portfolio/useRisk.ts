import { useState, useEffect } from 'react';

export interface RiskMetrics { 
  liquidity: number; 
  concentration: number; 
  correlation: number;
}

export interface RiskTrendPoint { 
  t: string; 
  score: number;
}

export function useRisk(): { 
  metrics?: RiskMetrics; 
  factors?: any; 
  trend?: RiskTrendPoint[]; 
  isLoading: boolean;
} {
  const [metrics, setMetrics] = useState<RiskMetrics>();
  const [trend, setTrend] = useState<RiskTrendPoint[]>();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRisk = async () => {
      try {
        setIsLoading(true);
        await new Promise(resolve => setTimeout(resolve, 800));
        
        setMetrics({
          liquidity: 8.2,
          concentration: 6.5,
          correlation: 7.1
        });

        setTrend([
          { t: '2024-01-01', score: 7.2 },
          { t: '2024-01-02', score: 6.8 },
          { t: '2024-01-03', score: 6.5 },
          { t: '2024-01-04', score: 6.2 },
          { t: '2024-01-05', score: 6.2 }
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRisk();
  }, []);

  return { metrics, trend, isLoading };
}