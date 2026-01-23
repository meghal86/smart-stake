import { useState } from 'react';
import { WalletScope, FreshnessConfidence } from '@/types/portfolio';
import { AssetBreakdown } from '../AssetBreakdown';
import { ChainBreakdownChart } from '../ChainBreakdownChart';
import { ProtocolExposure } from '../ProtocolExposure';
import { BenchmarkComparison } from '../BenchmarkComparison';

interface PositionsTabProps {
  walletScope: WalletScope;
  freshness: FreshnessConfidence;
  onWalletScopeChange?: (scope: WalletScope) => void;
}

export function PositionsTab({ walletScope, freshness }: PositionsTabProps) {
  // Mock data - will be replaced with real API integration
  const [mockAssets] = useState([
    {
      id: 'eth',
      symbol: 'ETH',
      name: 'Ethereum',
      amount: 15.5,
      valueUsd: 38750,
      priceChange24h: 2.3,
      allocation: 60,
      category: 'token' as const,
      chainId: 1,
      riskScore: 0.1
    },
    {
      id: 'usdc',
      symbol: 'USDC',
      name: 'USD Coin',
      amount: 25000,
      valueUsd: 25000,
      priceChange24h: 0.1,
      allocation: 20,
      category: 'token' as const,
      chainId: 1,
      riskScore: 0.05
    },
    {
      id: 'sol',
      symbol: 'SOL',
      name: 'Solana',
      amount: 150,
      valueUsd: 12000,
      priceChange24h: -1.8,
      allocation: 12,
      category: 'token' as const,
      chainId: 101,
      riskScore: 0.25
    },
    {
      id: 'matic',
      symbol: 'MATIC',
      name: 'Polygon',
      amount: 8000,
      valueUsd: 8000,
      priceChange24h: 4.2,
      allocation: 8,
      category: 'token' as const,
      chainId: 137,
      riskScore: 0.2
    }
  ]);

  const [mockChainData] = useState([
    { name: 'Ethereum', value: 63750, percentage: 60, color: '#627EEA' },
    { name: 'Solana', value: 12000, percentage: 12, color: '#9945FF' },
    { name: 'Polygon', value: 8000, percentage: 8, color: '#8247E5' },
    { name: 'Others', value: 21250, percentage: 20, color: '#6B7280' }
  ]);

  const [mockProtocols] = useState([
    {
      id: 'uniswap',
      name: 'Uniswap V3',
      category: 'DEX',
      valueUsd: 15000,
      allocation: 15,
      positions: [
        { pair: 'ETH/USDC', valueUsd: 10000, apy: 12.5 },
        { pair: 'USDC/DAI', valueUsd: 5000, apy: 8.2 }
      ],
      riskLevel: 'medium' as const
    },
    {
      id: 'aave',
      name: 'Aave V3',
      category: 'Lending',
      valueUsd: 8000,
      allocation: 8,
      positions: [
        { asset: 'USDC', valueUsd: 8000, apy: 4.2 }
      ],
      riskLevel: 'low' as const
    },
    {
      id: 'compound',
      name: 'Compound',
      category: 'Lending',
      valueUsd: 5000,
      allocation: 5,
      positions: [
        { asset: 'ETH', valueUsd: 5000, apy: 3.8 }
      ],
      riskLevel: 'low' as const
    }
  ]);

  const [mockBenchmarkData] = useState([
    { date: '2024-01-01', portfolio: 0, ethereum: 0, bitcoin: 0, solana: 0 },
    { date: '2024-01-07', portfolio: 2.1, ethereum: 1.8, bitcoin: 1.2, solana: 3.5 },
    { date: '2024-01-14', portfolio: 5.3, ethereum: 4.2, bitcoin: 2.8, solana: 8.1 },
    { date: '2024-01-21', portfolio: 8.7, ethereum: 6.5, bitcoin: 4.1, solana: 12.3 },
    { date: '2024-01-28', portfolio: 12.4, ethereum: 9.2, bitcoin: 6.8, solana: 15.7 }
  ]);

  const [mockComparisons] = useState([
    { name: 'Portfolio', performance: 12.4, outperformance: 0, color: '#14B8A6' },
    { name: 'Ethereum', performance: 9.2, outperformance: -3.2, color: '#627EEA' },
    { name: 'Bitcoin', performance: 6.8, outperformance: -5.6, color: '#F7931A' },
    { name: 'Solana', performance: 15.7, outperformance: 3.3, color: '#9945FF' }
  ]);

  const [timeframe, setTimeframe] = useState<'1D' | '7D' | '30D' | '90D'>('30D');

  const totalValue = mockAssets.reduce((sum, asset) => sum + asset.valueUsd, 0);

  return (
    <div className="space-y-6">
      {/* Asset Breakdown - Extended existing component */}
      <AssetBreakdown
        assets={mockAssets}
        totalValue={totalValue}
        freshness={freshness}
        walletScope={walletScope}
      />

      {/* Chain Distribution - Reuse existing component */}
      <ChainBreakdownChart
        data={mockChainData}
        totalValue={totalValue}
      />

      {/* Protocol Exposure - New component with progressive disclosure */}
      <ProtocolExposure
        protocols={mockProtocols}
        totalValue={totalValue}
        freshness={freshness}
      />

      {/* Performance Metrics - Reuse existing BenchmarkComparison */}
      <BenchmarkComparison
        data={mockBenchmarkData}
        timeframe={timeframe}
        onTimeframeChange={setTimeframe}
        comparisons={mockComparisons}
      />
    </div>
  );
}