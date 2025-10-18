import { useState, useEffect } from 'react';

export interface PortfolioSummary {
  totalValue: number;
  pnl24hPct: number;
  riskScore: number;   // 0..10
  trustIndex: number;  // 0..100
  updatedAt: string;
}

export function usePortfolioSummary(): { 
  data?: PortfolioSummary; 
  isLoading: boolean; 
  error?: Error 
} {
  const [data, setData] = useState<PortfolioSummary>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error>();

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setIsLoading(true);
        // Mock data - replace with actual API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setData({
          totalValue: 125000,
          pnl24hPct: 2.4,
          riskScore: 6.2,
          trustIndex: 87,
          updatedAt: new Date().toISOString()
        });
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSummary();
  }, []);

  return { data, isLoading, error };
}