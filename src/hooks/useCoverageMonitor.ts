import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useCoverageMonitor(window: string = '24h') {
  return useQuery({
    queryKey: ['coverage-monitor', window],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('coverage-monitor', {
        body: { window }
      });
      
      if (error) throw error;
      return data;
    },
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
    retry: 2,
    staleTime: 2 * 60 * 1000, // Consider data stale after 2 minutes
  });
}

export function useCoverageStatus() {
  const { data: coverage, isLoading } = useCoverageMonitor();
  
  const getCoverageStatus = () => {
    if (isLoading || !coverage) return 'loading';
    
    const { systemHealth } = coverage;
    return systemHealth?.overall || 'unknown';
  };

  const getCoverageMessage = () => {
    if (isLoading) return 'Checking data coverage...';
    if (!coverage) return 'Coverage data unavailable';
    
    const { systemHealth } = coverage;
    return systemHealth?.summary || 'Coverage status unknown';
  };

  const getCoverageColor = () => {
    const status = getCoverageStatus();
    switch (status) {
      case 'excellent': return 'text-green-600';
      case 'good': return 'text-blue-600';
      case 'fair': return 'text-yellow-600';
      case 'poor': return 'text-orange-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const shouldShowLowCoverageWarning = () => {
    if (!coverage) return false;
    
    const { systemHealth } = coverage;
    return systemHealth?.overall === 'poor' || systemHealth?.overall === 'critical';
  };

  return {
    coverage,
    isLoading,
    status: getCoverageStatus(),
    message: getCoverageMessage(),
    color: getCoverageColor(),
    showWarning: shouldShowLowCoverageWarning()
  };
}