import { useState, useEffect } from 'react';
import { useWalletSwitching } from '../useWalletSwitching';

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
  error?: Error;
  refetch: () => Promise<void>;
} {
  const [data, setData] = useState<PortfolioSummary>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error>();
  const { activeWallet } = useWalletSwitching();

  const fetchSummary = async () => {
    try {
      setIsLoading(true);
      setError(undefined);
      
      // Clear previous data to prevent stale display
      setData(undefined);
      
      // Mock data - replace with actual API call
      // In production, this should call /api/v1/portfolio/snapshot
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

  // Refetch when active wallet changes to ensure real-time accuracy
  useEffect(() => {
    fetchSummary();
  }, [activeWallet]);

  return { data, isLoading, error, refetch: fetchSummary };
}