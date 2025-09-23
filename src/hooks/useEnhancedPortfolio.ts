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

  const fetchEnhancedData = async () => {
    if (addresses.length === 0) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Skip live data for now to prevent infinite loops
      // TODO: Re-enable when live data is stable
      
      // Fallback to mock data
      await new Promise(resolve => setTimeout(resolve, 1000));
      
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
  };

  useEffect(() => {
    fetchEnhancedData();
  }, [addresses.join(',')]);

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

// Static benchmark data to prevent infinite re-renders
const STATIC_BENCHMARK_DATA = (() => {
  const data = [];
  const startDate = new Date('2024-01-01');
  
  for (let i = 0; i < 30; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    
    data.push({
      date: date.toISOString().split('T')[0],
      portfolio: 5.2 + (i * 0.3) + Math.sin(i * 0.2) * 2,
      ethereum: 3.1 + (i * 0.25) + Math.sin(i * 0.15) * 1.5,
      bitcoin: 2.8 + (i * 0.2) + Math.sin(i * 0.1) * 1.2,
      solana: 1.5 + (i * 0.4) + Math.sin(i * 0.25) * 3
    });
  }
  
  return data;
})();

function generateMockBenchmarkData() {
  return STATIC_BENCHMARK_DATA;
}

// Static whale interactions to prevent infinite re-renders
const STATIC_WHALE_INTERACTIONS = (() => {
  const interactions = [];
  const types = ['CEX_INFLOW', 'CEX_OUTFLOW', 'DEX_SWAP', 'STABLECOIN_MINT', 'LARGE_TRANSFER', 'STAKING'] as const;
  const tokens = ['ETH', 'BTC', 'SOL', 'LINK', 'MATIC'];
  const impacts = ['high', 'medium', 'low'] as const;
  
  for (let i = 0; i < 15; i++) {
    const timestamp = new Date('2024-01-01');
    timestamp.setHours(timestamp.getHours() - i * 3);
    
    interactions.push({
      id: `interaction-${i}`,
      timestamp,
      type: types[i % types.length],
      token: tokens[i % tokens.length],
      amount: 500000 + (i * 50000),
      value: (500000 + (i * 50000)) * (2000 + i * 100),
      whaleAddress: `0x${'a'.repeat(40)}${i}`,
      impact: impacts[i % impacts.length],
      portfolioEffect: (i % 3 - 1) * 2.5,
      description: `Large ${types[i % types.length].toLowerCase().replace('_', ' ')} of ${tokens[i % tokens.length]} detected`,
      txHash: `0x${'b'.repeat(63)}${i}`
    });
  }
  
  return interactions.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
})();

function generateMockWhaleInteractions() {
  return STATIC_WHALE_INTERACTIONS;
}

function convertLiveDataToEnhanced(liveData: any, addresses: string[]): EnhancedPortfolioData {
  const firstAddress = addresses[0];
  const portfolioData = liveData[firstAddress];
  
  if (!portfolioData) {
    throw new Error('No portfolio data available');
  }

  // Convert live data to enhanced format
  const chainBreakdown = [
    { name: 'Ethereum', value: portfolioData.total_value_usd * 0.6, percentage: 60, color: '#627EEA' },
    { name: 'Bitcoin', value: portfolioData.total_value_usd * 0.2, percentage: 20, color: '#F7931A' },
    { name: 'Solana', value: portfolioData.total_value_usd * 0.12, percentage: 12, color: '#9945FF' },
    { name: 'Polygon', value: portfolioData.total_value_usd * 0.08, percentage: 8, color: '#8247E5' }
  ];

  const topTokens = portfolioData.tokens.slice(0, 5).map((token: any, index: number) => ({
    symbol: token.symbol,
    percentage: (token.value_usd / portfolioData.total_value_usd) * 100,
    value: token.value_usd,
    risk: index < 2 ? 'low' as const : index < 4 ? 'medium' as const : 'high' as const
  }));

  return {
    totalValue: portfolioData.total_value_usd,
    pnl24h: portfolioData.total_value_usd * 0.02, // 2% gain
    pnlPercent: 2.04,
    riskScore: portfolioData.risk_score,
    riskChange: -0.3,
    whaleActivity: portfolioData.whale_interactions,
    chainBreakdown,
    topTokens,
    concentrationScore: Math.max(60, topTokens[0]?.percentage || 0),
    diversificationTrend: 2.1,
    benchmarkData: generateMockBenchmarkData(),
    riskFactors: [
      {
        name: 'Live Portfolio Risk',
        score: portfolioData.risk_score,
        change: 0.5,
        impact: 'medium' as const,
        description: 'Real-time risk assessment based on current holdings'
      }
    ],
    whaleInfluence: 23.5,
    marketCorrelation: 0.72,
    liquidityRisk: 3.2,
    upcomingUnlocks: [],
    liquidityData: portfolioData.tokens.slice(0, 4).map((token: any) => ({
      token: token.symbol,
      totalLiquidity: Math.random() * 1000000000,
      dailyVolume: Math.random() * 500000000,
      liquidityRatio: Math.random() * 5 + 1,
      risk: Math.random() > 0.7 ? 'high' as const : Math.random() > 0.4 ? 'medium' as const : 'low' as const
    })),
    whaleInteractions: generateMockWhaleInteractions()
  };
}