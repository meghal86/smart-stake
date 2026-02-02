import { useState } from 'react';
import { TrendingUp, TrendingDown, ChevronDown, ChevronUp, Filter, Eye } from 'lucide-react';
import { WalletScope, FreshnessConfidence } from '@/types/portfolio';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Asset {
  id: string;
  symbol: string;
  name: string;
  amount: number;
  valueUsd: number;
  priceChange24h: number;
  allocation: number;
  category: 'token' | 'lp' | 'nft' | 'defi';
  chainId: number;
  riskScore: number;
}

interface AssetBreakdownProps {
  assets: Asset[];
  totalValue: number;
  freshness: FreshnessConfidence;
  walletScope: WalletScope;
  showTopN?: number;
}

export function AssetBreakdown({ 
  assets, 
  totalValue, 
  freshness, 
  walletScope,
  showTopN = 10 
}: AssetBreakdownProps) {
  const [showAll, setShowAll] = useState(false);
  const [sortBy, setSortBy] = useState<'value' | 'allocation' | 'change'>('value');
  const [filterCategory, setFilterCategory] = useState<'all' | 'token' | 'lp' | 'nft' | 'defi'>('all');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatAmount = (amount: number) => {
    if (amount >= 1000000) return `${(amount / 1000000).toFixed(2)}M`;
    if (amount >= 1000) return `${(amount / 1000).toFixed(1)}K`;
    return amount.toFixed(2);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'token': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'lp': return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'nft': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'defi': return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  const getRiskColor = (score: number) => {
    if (score >= 0.8) return 'text-red-400';
    if (score >= 0.6) return 'text-orange-400';
    if (score >= 0.4) return 'text-yellow-400';
    return 'text-green-400';
  };

  // Filter and sort assets
  const filteredAssets = assets
    .filter(asset => filterCategory === 'all' || asset.category === filterCategory)
    .sort((a, b) => {
      switch (sortBy) {
        case 'value': return b.valueUsd - a.valueUsd;
        case 'allocation': return b.allocation - a.allocation;
        case 'change': return b.priceChange24h - a.priceChange24h;
        default: return 0;
      }
    });

  const displayedAssets = showAll ? filteredAssets : filteredAssets.slice(0, showTopN);

  return (
    <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700/50">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2 flex-wrap">
          <Eye className="w-5 h-5 text-blue-400 flex-shrink-0" />
          <h3 className="text-lg font-semibold text-white whitespace-nowrap">Asset Breakdown</h3>
          <Badge variant="outline" className="text-xs">
            {filteredAssets.length} assets
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <Select value={filterCategory} onValueChange={(value: typeof filterCategory) => setFilterCategory(value)}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="token">Tokens</SelectItem>
              <SelectItem value="lp">LP</SelectItem>
              <SelectItem value="nft">NFTs</SelectItem>
              <SelectItem value="defi">DeFi</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={sortBy} onValueChange={(value: typeof sortBy) => setSortBy(value)}>
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="value">Value</SelectItem>
              <SelectItem value="allocation">Allocation</SelectItem>
              <SelectItem value="change">Change</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Wallet Scope & Freshness */}
      <div className="flex items-center justify-between mb-4 text-sm">
        <p className="text-gray-400">
          Scope: {walletScope.mode === 'all_wallets' ? 'All Wallets' : `Wallet ${walletScope.address?.slice(0, 6)}...${walletScope.address?.slice(-4)}`}
        </p>
        <p className="text-gray-400">
          Total: {formatCurrency(totalValue)} | Confidence: {Math.round(freshness.confidence * 100)}%
        </p>
      </div>

      {/* Assets List */}
      <div className="space-y-3">
        {displayedAssets.length === 0 ? (
          <div className="text-center py-8">
            <Eye className="w-12 h-12 mx-auto mb-4 text-gray-600" />
            <h4 className="text-lg font-medium mb-2 text-white">No Assets Found</h4>
            <p className="text-gray-400">
              No assets match the current filter criteria.
            </p>
          </div>
        ) : (
          displayedAssets.map((asset) => (
            <div 
              key={asset.id} 
              className="p-4 rounded-lg border border-gray-600/30 bg-gray-700/20 hover:bg-gray-700/40 transition-colors"
            >
              <div className="flex flex-col gap-4">
                {/* Asset Info Row */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap min-w-0">
                    <span className="font-medium text-white text-lg">{asset.symbol}</span>
                    <Badge className={`text-xs ${getCategoryColor(asset.category)}`}>
                      {asset.category.toUpperCase()}
                    </Badge>
                    <span className={`text-xs font-medium ${getRiskColor(asset.riskScore)} whitespace-nowrap`}>
                      Risk: {Math.round(asset.riskScore * 100)}%
                    </span>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm text-gray-400 mb-1">Allocation</p>
                    <p className="text-lg font-bold text-white">{asset.allocation.toFixed(1)}%</p>
                  </div>
                </div>

                {/* Asset Name */}
                <p className="text-sm text-gray-400 -mt-2">{asset.name}</p>

                {/* Metrics Grid */}
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-400 mb-1 text-xs">Amount</p>
                    <p className="font-medium text-white">{formatAmount(asset.amount)}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 mb-1 text-xs">Value</p>
                    <p className="font-medium text-white">{formatCurrency(asset.valueUsd)}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 mb-1 text-xs">24h Change</p>
                    <div className={`flex items-center gap-1 font-medium ${
                      asset.priceChange24h >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {asset.priceChange24h >= 0 ? (
                        <TrendingUp className="w-3 h-3 flex-shrink-0" />
                      ) : (
                        <TrendingDown className="w-3 h-3 flex-shrink-0" />
                      )}
                      <span>{Math.abs(asset.priceChange24h).toFixed(2)}%</span>
                    </div>
                  </div>
                </div>

                {/* Allocation Bar */}
                <div className="w-full h-2 bg-gray-600 rounded-full">
                  <div 
                    className="h-full bg-blue-500 rounded-full transition-all"
                    style={{ width: `${Math.min(asset.allocation, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Progressive Disclosure */}
      {filteredAssets.length > showTopN && (
        <div className="mt-4 text-center">
          <Button
            variant="outline"
            onClick={() => setShowAll(!showAll)}
            className="text-gray-300 border-gray-600 hover:bg-gray-700"
          >
            {showAll ? (
              <>
                <ChevronUp className="w-4 h-4 mr-2" />
                Show Top {showTopN}
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4 mr-2" />
                View All {filteredAssets.length} Assets
              </>
            )}
          </Button>
        </div>
      )}

      {/* Degraded Mode Warning */}
      {freshness.degraded && (
        <div className="mt-4 p-3 bg-yellow-900/30 border border-yellow-600/30 rounded-lg">
          <p className="text-sm text-yellow-200">
            Asset values may be stale due to low confidence data.
          </p>
        </div>
      )}
    </div>
  );
}