import { useState, useMemo } from 'react';
import { WalletScope, FreshnessConfidence, PortfolioSnapshot } from '@/types/portfolio';
import { AssetBreakdown } from '../AssetBreakdown';
import { ChainBreakdownChart } from '../ChainBreakdownChart';
import { ProtocolExposure } from '../ProtocolExposure';
import { BenchmarkComparison } from '../BenchmarkComparison';

interface PositionsTabProps {
  walletScope: WalletScope;
  freshness: FreshnessConfidence;
  onWalletScopeChange?: (scope: WalletScope) => void;
  snapshot?: PortfolioSnapshot;
  isLoading?: boolean;
}

export function PositionsTab({ walletScope, freshness, snapshot, isLoading }: PositionsTabProps) {
  const [timeframe, setTimeframe] = useState<'1D' | '7D' | '30D' | '90D'>('30D');

  // Transform real positions data into assets format
  const assets = useMemo(() => {
    if (!snapshot?.positions || snapshot.positions.length === 0) {
      return [];
    }

    const totalValue = snapshot.positions.reduce((sum, pos) => sum + pos.valueUsd, 0);

    return snapshot.positions.map(pos => ({
      id: pos.id,
      symbol: pos.symbol,
      name: pos.token,
      amount: parseFloat(pos.amount),
      valueUsd: pos.valueUsd,
      priceChange24h: 0, // TODO: Get from price API
      allocation: totalValue > 0 ? (pos.valueUsd / totalValue) * 100 : 0,
      category: pos.category || 'token', // Default to 'token' if category is undefined
      chainId: pos.chainId,
      riskScore: 0.1 // TODO: Calculate from approvals
    }));
  }, [snapshot?.positions]);

  // Calculate chain distribution from real positions
  const chainData = useMemo(() => {
    if (!snapshot?.positions || snapshot.positions.length === 0) {
      return [];
    }

    const chainMap = new Map<number, { name: string; value: number }>();
    const totalValue = snapshot.positions.reduce((sum, pos) => sum + pos.valueUsd, 0);

    snapshot.positions.forEach(pos => {
      const existing = chainMap.get(pos.chainId) || { name: getChainName(pos.chainId), value: 0 };
      existing.value += pos.valueUsd;
      chainMap.set(pos.chainId, existing);
    });

    return Array.from(chainMap.entries())
      .map(([chainId, data]) => ({
        name: data.name,
        value: data.value,
        percentage: totalValue > 0 ? (data.value / totalValue) * 100 : 0,
        color: getChainColor(chainId)
      }))
      .sort((a, b) => b.value - a.value);
  }, [snapshot?.positions]);

  // Calculate protocol exposure from real positions
  const protocols = useMemo(() => {
    if (!snapshot?.positions || snapshot.positions.length === 0) {
      return [];
    }

    const protocolMap = new Map<string, {
      id: string;
      name: string;
      category: string;
      valueUsd: number;
      positions: Array<{ pair?: string; asset?: string; valueUsd: number; apy?: number }>;
    }>();

    const totalValue = snapshot.positions.reduce((sum, pos) => sum + pos.valueUsd, 0);

    snapshot.positions.forEach(pos => {
      if (pos.protocol) {
        const existing = protocolMap.get(pos.protocol) || {
          id: pos.protocol.toLowerCase().replace(/\s+/g, '-'),
          name: pos.protocol,
          category: getCategoryName(pos.category),
          valueUsd: 0,
          positions: []
        };

        existing.valueUsd += pos.valueUsd;
        existing.positions.push({
          asset: pos.symbol,
          valueUsd: pos.valueUsd,
          apy: 0 // TODO: Get from protocol API
        });

        protocolMap.set(pos.protocol, existing);
      }
    });

    return Array.from(protocolMap.values())
      .map(protocol => ({
        ...protocol,
        allocation: totalValue > 0 ? (protocol.valueUsd / totalValue) * 100 : 0,
        riskLevel: 'medium' as const // TODO: Calculate from protocol risk data
      }))
      .sort((a, b) => b.valueUsd - a.valueUsd);
  }, [snapshot?.positions]);

  const totalValue = useMemo(() => {
    return snapshot?.positions?.reduce((sum, pos) => sum + pos.valueUsd, 0) || 0;
  }, [snapshot?.positions]);

  // Mock benchmark data (TODO: implement real benchmark comparison)
  const mockBenchmarkData = [
    { date: '2024-01-01', portfolio: 0, ethereum: 0, bitcoin: 0, solana: 0 },
    { date: '2024-01-07', portfolio: 2.1, ethereum: 1.8, bitcoin: 1.2, solana: 3.5 },
    { date: '2024-01-14', portfolio: 5.3, ethereum: 4.2, bitcoin: 2.8, solana: 8.1 },
    { date: '2024-01-21', portfolio: 8.7, ethereum: 6.5, bitcoin: 4.1, solana: 12.3 },
    { date: '2024-01-28', portfolio: 12.4, ethereum: 9.2, bitcoin: 6.8, solana: 15.7 }
  ];

  const mockComparisons = [
    { name: 'Portfolio', performance: 12.4, outperformance: 0, color: '#14B8A6' },
    { name: 'Ethereum', performance: 9.2, outperformance: -3.2, color: '#627EEA' },
    { name: 'Bitcoin', performance: 6.8, outperformance: -5.6, color: '#F7931A' },
    { name: 'Solana', performance: 15.7, outperformance: 3.3, color: '#9945FF' }
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-64 bg-white/5 rounded-3xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (!snapshot?.positions || snapshot.positions.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400 text-lg mb-2">No positions found</p>
        <p className="text-gray-500 text-sm">
          {walletScope.mode === 'active_wallet' 
            ? 'This wallet has no tracked positions'
            : 'No positions found across your wallets'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Asset Breakdown - Now with real data */}
      <AssetBreakdown
        assets={assets}
        totalValue={totalValue}
        freshness={freshness}
        walletScope={walletScope}
      />

      {/* Chain Distribution - Now with real data */}
      {chainData.length > 0 && (
        <ChainBreakdownChart
          data={chainData}
          totalValue={totalValue}
        />
      )}

      {/* Protocol Exposure - Now with real data */}
      {protocols.length > 0 && (
        <ProtocolExposure
          protocols={protocols}
          totalValue={totalValue}
          freshness={freshness}
        />
      )}

      {/* Performance Metrics - Still using mock data (TODO: implement) */}
      <BenchmarkComparison
        data={mockBenchmarkData}
        timeframe={timeframe}
        onTimeframeChange={setTimeframe}
        comparisons={mockComparisons}
      />
    </div>
  );
}

// Helper functions
function getChainName(chainId: number): string {
  const chains: Record<number, string> = {
    1: 'Ethereum',
    137: 'Polygon',
    56: 'BSC',
    43114: 'Avalanche',
    250: 'Fantom',
    42161: 'Arbitrum',
    10: 'Optimism',
    8453: 'Base',
    101: 'Solana',
  };
  return chains[chainId] || `Chain ${chainId}`;
}

function getChainColor(chainId: number): string {
  const colors: Record<number, string> = {
    1: '#627EEA',    // Ethereum
    137: '#8247E5',  // Polygon
    56: '#F3BA2F',   // BSC
    43114: '#E84142', // Avalanche
    250: '#1969FF',  // Fantom
    42161: '#28A0F0', // Arbitrum
    10: '#FF0420',   // Optimism
    8453: '#0052FF', // Base
    101: '#9945FF',  // Solana
  };
  return colors[chainId] || '#6B7280';
}

function getCategoryName(category: string): string {
  const categories: Record<string, string> = {
    'token': 'Token',
    'lp': 'Liquidity Pool',
    'nft': 'NFT',
    'defi': 'DeFi Protocol'
  };
  return categories[category] || 'Other';
}