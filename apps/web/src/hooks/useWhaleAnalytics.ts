import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface WhaleData {
  id: string;
  address: string;
  fullAddress: string;
  label: string;
  balance: number;
  riskScore: number;
  recentActivity: number;
  chain: string;
  reasons: string[];
  supporting_events: string[];
  provider: string;
  method: string;
  confidence: number;
}

interface FilterState {
  search: string;
  riskLevel: 'all' | 'high' | 'medium' | 'low';
  sortBy: 'risk' | 'balance' | 'activity';
  sortOrder: 'asc' | 'desc';
  minBalance: string;
  chain: 'all' | 'ethereum' | 'polygon' | 'bsc';
}

interface MarketMetrics {
  volume24h: number;
  activeWhales: number;
  topSignals: Array<{
    signal_type: string;
    confidence: number;
    value: string;
  }>;
}

export const useWhaleAnalytics = () => {
  const [whales, setWhales] = useState<WhaleData[]>([]);
  const [metrics, setMetrics] = useState<MarketMetrics>({ volume24h: 0, activeWhales: 0, topSignals: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    riskLevel: 'all',
    sortBy: 'risk',
    sortOrder: 'desc',
    minBalance: '',
    chain: 'all'
  });

  // Fetch whale data from database
  const fetchWhaleData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch whale balances
      const { data: balances, error: balanceError } = await supabase
        .from('whale_balances')
        .select('address, balance, balance_usd, chain, ts, provider, method')
        .order('balance_usd', { ascending: false })
        .limit(100);

      if (balanceError) throw balanceError;

      // Fetch whale signals
      const { data: signals } = await supabase
        .from('whale_signals')
        .select('address, chain, risk_score, confidence, reasons, supporting_events, provider, method')
        .order('ts', { ascending: false });

      // Fetch recent transfers for activity
      const { data: transfers } = await supabase
        .from('whale_transfers')
        .select('from_address, to_address, ts, value_usd')
        .gte('ts', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      if (!balances || balances.length === 0) {
        setError('No whale data found in database.');
        setWhales([]);
        return;
      }

      // Transform data
      const enhancedWhales = balances.map((whale, index) => {
        const signal = signals?.find(s => s.address === whale.address && s.chain === whale.chain);
        const recentActivity = transfers?.filter(t => 
          t.from_address === whale.address || t.to_address === whale.address
        ).length || 0;

        return {
          id: `whale-${index}`,
          address: whale.address.slice(0, 10) + '...' + whale.address.slice(-6),
          fullAddress: whale.address,
          label: `Whale ${index + 1}`,
          balance: parseFloat(whale.balance) || 0,
          riskScore: signal?.risk_score || 50,
          recentActivity,
          chain: whale.chain,
          reasons: signal?.reasons || ['No risk analysis available'],
          supporting_events: signal?.supporting_events || [],
          provider: signal?.provider || whale.provider,
          method: signal?.method || whale.method,
          confidence: signal?.confidence || 0.5
        };
      });

      // Calculate metrics
      const volume24h = transfers?.reduce((sum, t) => sum + (parseFloat(t.value_usd) || 0), 0) / 1000000 || 0;
      const activeWhales = balances.length;
      const topSignals = signals?.slice(0, 5) || [];

      setWhales(enhancedWhales);
      setMetrics({
        volume24h: Math.round(volume24h),
        activeWhales,
        topSignals
      });
    } catch (err) {
      console.error('Failed to fetch whale data:', err);
      setError(`Failed to load whale data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort whales
  const filteredWhales = useMemo(() => {
    let filtered = [...whales];

    // Search filter
    if (filters.search) {
      filtered = filtered.filter(whale => 
        whale.fullAddress.toLowerCase().includes(filters.search.toLowerCase()) ||
        whale.label.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    // Risk level filter
    if (filters.riskLevel !== 'all') {
      filtered = filtered.filter(whale => {
        if (filters.riskLevel === 'high') return whale.riskScore >= 70;
        if (filters.riskLevel === 'medium') return whale.riskScore >= 40 && whale.riskScore < 70;
        if (filters.riskLevel === 'low') return whale.riskScore < 40;
        return true;
      });
    }

    // Chain filter
    if (filters.chain !== 'all') {
      filtered = filtered.filter(whale => whale.chain === filters.chain);
    }

    // Min balance filter
    if (filters.minBalance) {
      const minBalance = parseFloat(filters.minBalance);
      filtered = filtered.filter(whale => whale.balance >= minBalance);
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (filters.sortBy) {
        case 'risk':
          aValue = a.riskScore;
          bValue = b.riskScore;
          break;
        case 'balance':
          aValue = a.balance;
          bValue = b.balance;
          break;
        case 'activity':
          aValue = a.recentActivity;
          bValue = b.recentActivity;
          break;
        default:
          aValue = a.riskScore;
          bValue = b.riskScore;
      }

      return filters.sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    });

    return filtered;
  }, [whales, filters]);

  // Ingest blockchain data
  const ingestBlockchainData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('blockchain-monitor');
      
      if (error) throw error;
      
      console.log('Blockchain ingestion result:', data);
      await fetchWhaleData();
    } catch (error) {
      console.error('Blockchain ingestion failed:', error);
      setError(`Data ingestion failed: ${error.message}`);
    }
  };

  // Real-time updates
  useEffect(() => {
    fetchWhaleData();

    // Subscribe to real-time updates
    const subscription = supabase
      .channel('whale_updates')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'whale_balances' },
        () => fetchWhaleData()
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'whale_signals' },
        () => fetchWhaleData()
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return {
    whales: filteredWhales,
    totalWhales: whales.length,
    metrics,
    loading,
    error,
    filters,
    setFilters,
    fetchWhaleData,
    ingestBlockchainData
  };
};