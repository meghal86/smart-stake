import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface EnhancedPortfolioData {
  totalValue: number;
  pnl24h: number;
  pnlPercent: number;
  riskScore: number;
  riskChange: number;
  whaleActivity: number;
  chainBreakdown: Array<{
    name: string;
    value: number;
    percentage: number;
    color: string;
  }>;
  topTokens: Array<{
    symbol: string;
    percentage: number;
    value: number;
    risk: 'low' | 'medium' | 'high';
  }>;
  concentrationScore: number;
  diversificationTrend: number;
  benchmarkData: Array<{
    date: string;
    portfolio: number;
    ethereum: number;
    bitcoin: number;
    solana: number;
  }>;
  riskFactors: Array<{
    name: string;
    score: number;
    change: number;
    impact: 'high' | 'medium' | 'low';
    description: string;
  }>;
  whaleInfluence: number;
  marketCorrelation: number;
  liquidityRisk: number;
  upcomingUnlocks: Array<{
    token: string;
    amount: number;
    value: number;
    unlockDate: Date;
    type: 'vesting' | 'staking' | 'lock';
    impact: 'high' | 'medium' | 'low';
  }>;
  liquidityData: Array<{
    token: string;
    totalLiquidity: number;
    dailyVolume: number;
    liquidityRatio: number;
    risk: 'high' | 'medium' | 'low';
  }>;
  whaleInteractions: Array<{
    id: string;
    timestamp: Date;
    type: 'CEX_INFLOW' | 'CEX_OUTFLOW' | 'DEX_SWAP' | 'STABLECOIN_MINT' | 'LARGE_TRANSFER' | 'STAKING';
    token: string;
    amount: number;
    value: number;
    whaleAddress: string;
    impact: 'high' | 'medium' | 'low';
    portfolioEffect: number;
    description: string;
    txHash?: string;
  }>;
}

export function useEnhancedPortfolio(addresses: string[]) {
  const [data, setData] = useState<EnhancedPortfolioData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEnhancedData = useCallback(async () => {
    if (addresses.length === 0) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Use mock data for demonstration (no API calls)
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate loading
      
      const mockData: EnhancedPortfolioData = {
        totalValue: 125000,
        pnl24h: 2500,
        pnlPercent: 2.04,
        riskScore: 7.2,
        riskChange: -0.3,
        whaleActivity: 8,
        chainBreakdown: [
          { name: 'Ethereum', value: 75000, percentage: 60, color: '#627EEA' },
          { name: 'Bitcoin', value: 25000, percentage: 20, color: '#F7931A' },
          { name: 'Solana', value: 15000, percentage: 12, color: '#9945FF' },
          { name: 'Polygon', value: 10000, percentage: 8, color: '#8247E5' }
        ],
        topTokens: [
          { symbol: 'ETH', percentage: 35, value: 43750, risk: 'low' },
          { symbol: 'BTC', percentage: 20, value: 25000, risk: 'low' },
          { symbol: 'SOL', percentage: 12, value: 15000, risk: 'medium' },
          { symbol: 'MATIC', percentage: 8, value: 10000, risk: 'medium' },
          { symbol: 'LINK', percentage: 6, value: 7500, risk: 'high' }
        ],
        concentrationScore: 67,
        diversificationTrend: 2.1,
        benchmarkData: generateMockBenchmarkData(),
        riskFactors: [
          {
            name: 'Whale Concentration',
            score: 6.5,
            change: 1.2,
            impact: 'high',
            description: 'Large whale holders increased positions by 15% in last 7 days'
          },
          {
            name: 'Market Correlation',
            score: 7.8,
            change: -0.5,
            impact: 'medium',
            description: 'Portfolio correlation with BTC decreased, showing better diversification'
          },
          {
            name: 'Liquidity Risk',
            score: 8.2,
            change: 0.0,
            impact: 'low',
            description: 'All major holdings maintain healthy liquidity levels'
          }
        ],
        whaleInfluence: 23.5,
        marketCorrelation: 0.72,
        liquidityRisk: 3.2,
        upcomingUnlocks: [
          {
            token: 'LINK',
            amount: 50000,
            value: 750000,
            unlockDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
            type: 'vesting',
            impact: 'high'
          },
          {
            token: 'SOL',
            amount: 1000,
            value: 150000,
            unlockDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
            type: 'staking',
            impact: 'medium'
          }
        ],
        liquidityData: [
          { token: 'ETH', totalLiquidity: 2500000000, dailyVolume: 15000000000, liquidityRatio: 6.0, risk: 'low' },
          { token: 'BTC', totalLiquidity: 1800000000, dailyVolume: 25000000000, liquidityRatio: 13.9, risk: 'low' },
          { token: 'SOL', totalLiquidity: 450000000, dailyVolume: 800000000, liquidityRatio: 1.8, risk: 'medium' },
          { token: 'LINK', totalLiquidity: 120000000, dailyVolume: 180000000, liquidityRatio: 1.5, risk: 'high' }
        ],
        whaleInteractions: generateMockWhaleInteractions()
      };

      setData(mockData);
    } catch (err: any) {
      console.error('Enhanced portfolio fetch error:', err);
      setError(null); // Ignore errors in demo mode
    } finally {
      setLoading(false);
    }
  }, [addresses]);

  useEffect(() => {
    fetchEnhancedData();
  }, [fetchEnhancedData]);

  const simulateScenario = useCallback(async (scenario: any) => {
    // Mock simulation logic
    const baseValue = data?.totalValue || 100000;
    const ethImpact = scenario.ethChange / 100;
    const btcImpact = scenario.btcChange / 100;
    const altImpact = scenario.altcoinChange / 100;
    
    // Calculate weighted impact based on portfolio composition
    const ethWeight = 0.35;
    const btcWeight = 0.20;
    const altWeight = 0.45;
    
    const totalImpact = (ethImpact * ethWeight) + (btcImpact * btcWeight) + (altImpact * altWeight);
    const newValue = baseValue * (1 + totalImpact);
    const change = newValue - baseValue;
    const changePercent = (change / baseValue) * 100;
    
    // Adjust for correlation breaks and stablecoin depegs
    let adjustedChange = changePercent;
    if (scenario.correlationBreak) {
      adjustedChange *= 1.2; // Amplify volatility
    }
    if (scenario.stablecoinDepeg) {
      adjustedChange -= 5; // Additional 5% hit
    }
    
    const finalValue = baseValue * (1 + adjustedChange / 100);
    const riskScore = Math.max(1, 10 - Math.abs(adjustedChange) / 5);
    
    return {
      totalValue: finalValue,
      change: finalValue - baseValue,
      changePercent: adjustedChange,
      riskScore,
      worstToken: adjustedChange < 0 ? 'LINK' : 'ETH',
      bestToken: adjustedChange > 0 ? 'ETH' : 'BTC'
    };
  }, [data]);

  return {
    data,
    loading,
    error,
    refetch: fetchEnhancedData,
    simulateScenario
  };
}

function generateMockBenchmarkData() {
  const data = [];
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);
  
  for (let i = 0; i < 30; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    
    data.push({
      date: date.toISOString().split('T')[0],
      portfolio: Math.random() * 20 - 5, // -5% to +15%
      ethereum: Math.random() * 15 - 3,  // -3% to +12%
      bitcoin: Math.random() * 12 - 2,   // -2% to +10%
      solana: Math.random() * 25 - 8     // -8% to +17%
    });
  }
  
  return data;
}

function generateMockWhaleInteractions() {
  const interactions = [];
  const types = ['CEX_INFLOW', 'CEX_OUTFLOW', 'DEX_SWAP', 'STABLECOIN_MINT', 'LARGE_TRANSFER', 'STAKING'] as const;
  const tokens = ['ETH', 'BTC', 'SOL', 'LINK', 'MATIC'];
  const impacts = ['high', 'medium', 'low'] as const;
  
  for (let i = 0; i < 15; i++) {
    const timestamp = new Date();
    timestamp.setHours(timestamp.getHours() - Math.random() * 48);
    
    const type = types[Math.floor(Math.random() * types.length)];
    const token = tokens[Math.floor(Math.random() * tokens.length)];
    const impact = impacts[Math.floor(Math.random() * impacts.length)];
    const amount = Math.random() * 1000000;
    const value = amount * (Math.random() * 3000 + 100);
    
    interactions.push({
      id: `interaction-${i}`,
      timestamp,
      type,
      token,
      amount,
      value,
      whaleAddress: `0x${Math.random().toString(16).substr(2, 40)}`,
      impact,
      portfolioEffect: (Math.random() - 0.5) * 10,
      description: `Large ${type.toLowerCase().replace('_', ' ')} of ${token} detected`,
      txHash: `0x${Math.random().toString(16).substr(2, 64)}`
    });
  }
  
  return interactions.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}