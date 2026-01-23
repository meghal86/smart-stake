import { DollarSign, TrendingUp, TrendingDown, RefreshCw, AlertTriangle } from 'lucide-react';
import { WalletScope, FreshnessConfidence } from '@/types/portfolio';

interface NetWorthData {
  totalValue: number;
  delta24h: number;
  deltaPercent: number;
  breakdown: Array<{
    chain: string;
    value: number;
    percentage: number;
  }>;
}

interface NetWorthCardProps {
  netWorth: NetWorthData;
  freshness: FreshnessConfidence;
  walletScope: WalletScope;
}

export function NetWorthCard({ netWorth, freshness, walletScope }: NetWorthCardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  };

  const isPositive = netWorth.delta24h >= 0;

  return (
    <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700/50">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-green-400" />
          <h3 className="text-lg font-semibold text-white">Net Worth</h3>
        </div>
        
        {/* Freshness & Confidence Display */}
        <div className="flex items-center gap-3 text-sm">
          <div className="flex items-center gap-1">
            <RefreshCw className="w-4 h-4 text-gray-400" />
            <span className="text-gray-300">{freshness.freshnessSec}s</span>
          </div>
          <div className={`flex items-center gap-1 ${
            freshness.degraded ? 'text-yellow-400' : 'text-green-400'
          }`}>
            {freshness.degraded && <AlertTriangle className="w-4 h-4" />}
            <span>{Math.round(freshness.confidence * 100)}%</span>
          </div>
        </div>
      </div>

      {/* Wallet Scope Indicator */}
      <div className="mb-4">
        <p className="text-sm text-gray-400">
          Scope: {walletScope.mode === 'all_wallets' ? 'All Wallets' : `Wallet ${walletScope.address?.slice(0, 6)}...${walletScope.address?.slice(-4)}`}
        </p>
      </div>

      {/* Main Value */}
      <div className="mb-6">
        <div className="text-3xl font-bold text-white mb-2">
          {formatCurrency(netWorth.totalValue)}
        </div>
        <div className="flex items-center gap-2">
          {isPositive ? (
            <TrendingUp className="w-4 h-4 text-green-400" />
          ) : (
            <TrendingDown className="w-4 h-4 text-red-400" />
          )}
          <span className={`text-lg font-semibold ${
            isPositive ? 'text-green-400' : 'text-red-400'
          }`}>
            {formatCurrency(netWorth.delta24h)} ({formatPercentage(netWorth.deltaPercent)})
          </span>
          <span className="text-gray-400 text-sm">24h</span>
        </div>
      </div>

      {/* Chain Breakdown */}
      <div>
        <h4 className="text-sm font-medium text-gray-300 mb-3">Distribution by Chain</h4>
        <div className="space-y-2">
          {netWorth.breakdown.map((chain) => (
            <div key={chain.chain} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-sm text-gray-300">{chain.chain}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-400">{chain.percentage}%</span>
                <span className="text-sm font-medium text-white">
                  {formatCurrency(chain.value)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Degraded Mode Warning */}
      {freshness.degraded && (
        <div className="mt-4 p-3 bg-yellow-900/30 border border-yellow-600/30 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-400" />
            <p className="text-sm text-yellow-200">
              Data confidence below threshold. Values may be stale.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}