import { useState, useEffect } from 'react';
import { portfolioValuationService } from '@/services/PortfolioValuationService';

interface ProductionPortfolioData {
  totalValue: number;
  pnl24h: number;
  pnlPercent: number;
  riskScore: number;
  concentrationHHI: number;
  holdings: Array<{
    token: string;
    qty: number;
    value: number;
    source: 'real' | 'simulated';
    change24h: number;
  }>;
  meta: {
    cacheStatus: 'hit' | 'miss' | 'stale';
    lastUpdated: Date;
    simVersion: string;
    latencyMs: number;
  };
}

export function useProductionPortfolio(addresses: string[]) {
  const [data, setData] = useState<ProductionPortfolioData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (addresses.length === 0) return;

    const fetchPortfolioData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const valuation = await portfolioValuationService.valuatePortfolio(addresses);
        
        const pnlPercent = valuation.kpis.total_value > 0 
          ? (valuation.kpis.pnl_24h / valuation.kpis.total_value) * 100 
          : 0;
        
        setData({
          totalValue: valuation.kpis.total_value,
          pnl24h: valuation.kpis.pnl_24h,
          pnlPercent,
          riskScore: valuation.kpis.risk_score,
          concentrationHHI: valuation.kpis.concentration_hhi,
          holdings: valuation.holdings.map(h => ({
            token: h.token,
            qty: h.qty,
            value: h.value,
            source: h.source,
            change24h: h.change_24h
          })),
          meta: {
            cacheStatus: valuation.meta.cache_status,
            lastUpdated: valuation.meta.last_updated,
            simVersion: valuation.meta.sim_version,
            latencyMs: valuation.meta.latency_ms
          }
        });
        
        console.log('🚀 Production Portfolio:', {
          totalValue: valuation.kpis.total_value.toFixed(2),
          latency: `${valuation.meta.latency_ms}ms`,
          holdings: valuation.holdings.length,
          simVersion: valuation.meta.sim_version
        });
        
      } catch (err: unknown) {
        console.error('Production portfolio error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch
    fetchPortfolioData();

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchPortfolioData, 30000);

    return () => clearInterval(interval);
  }, [addresses.join(',')]);

  const refetch = async () => {
    if (addresses.length === 0) return;
    
    setLoading(true);
    try {
      const valuation = await portfolioValuationService.valuatePortfolio(addresses);
      // Update data...
    } catch (err: unknown) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { 
    data, 
    loading, 
    error, 
    refetch,
    isLive: !!data,
    healthStatus: portfolioValuationService.getHealthStatus()
  };
}