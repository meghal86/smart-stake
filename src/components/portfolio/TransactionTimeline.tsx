import { useState } from 'react';
import { Clock, ExternalLink, Filter, Activity, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { WalletScope, FreshnessConfidence } from '@/types/portfolio';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Transaction {
  id: string;
  hash: string;
  timestamp: Date;
  type: 'swap' | 'approval' | 'transfer' | 'mint' | 'burn';
  from: string;
  to: string;
  value: number;
  gasUsed: number;
  gasPrice: number;
  status: 'success' | 'failed' | 'pending';
  aiTags: string[];
  riskScore: number;
  description: string;
}

interface TransactionTimelineProps {
  transactions: Transaction[];
  walletScope: WalletScope;
  freshness: FreshnessConfidence;
}

export function TransactionTimeline({ transactions, walletScope, freshness }: TransactionTimelineProps) {
  const [filter, setFilter] = useState<'all' | 'high-risk' | 'approvals' | 'swaps'>('all');

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return CheckCircle;
      case 'failed': return XCircle;
      default: return Clock;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-400';
      case 'failed': return 'text-red-400';
      default: return 'text-yellow-400';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'swap': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'approval': return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
      case 'transfer': return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'mint': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'burn': return 'bg-red-500/10 text-red-400 border-red-500/20';
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  const getRiskColor = (score: number) => {
    if (score >= 0.8) return 'text-red-400';
    if (score >= 0.6) return 'text-orange-400';
    if (score >= 0.4) return 'text-yellow-400';
    return 'text-green-400';
  };

  const getAITagColor = (tag: string) => {
    if (tag.includes('high') || tag.includes('risk')) return 'bg-red-500/10 text-red-400';
    if (tag.includes('medium')) return 'bg-yellow-500/10 text-yellow-400';
    if (tag.includes('low')) return 'bg-green-500/10 text-green-400';
    return 'bg-blue-500/10 text-blue-400';
  };

  // Filter transactions
  const filteredTransactions = transactions.filter(tx => {
    switch (filter) {
      case 'high-risk': return tx.riskScore >= 0.6;
      case 'approvals': return tx.type === 'approval';
      case 'swaps': return tx.type === 'swap';
      default: return true;
    }
  });

  return (
    <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700/50">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">Transaction Timeline</h3>
          <Badge variant="outline" className="text-xs">
            {filteredTransactions.length} transactions
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <Select value={filter} onValueChange={(value: typeof filter) => setFilter(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="high-risk">High Risk</SelectItem>
              <SelectItem value="approvals">Approvals</SelectItem>
              <SelectItem value="swaps">Swaps</SelectItem>
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
          Confidence: {Math.round(freshness.confidence * 100)}% | Freshness: {freshness.freshnessSec}s
        </p>
      </div>

      {/* Timeline */}
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-8">
            <Activity className="w-12 h-12 mx-auto mb-4 text-gray-600" />
            <h4 className="text-lg font-medium mb-2 text-white">No Transactions</h4>
            <p className="text-gray-400">
              No transactions match the current filter criteria.
            </p>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-600" />
            
            {filteredTransactions.map((tx, index) => {
              const StatusIcon = getStatusIcon(tx.status);
              
              return (
                <div key={tx.id} className="relative flex items-start gap-4 pb-6">
                  {/* Timeline dot */}
                  <div className={`flex items-center justify-center w-12 h-12 rounded-full border-2 bg-gray-800 z-10 ${getStatusColor(tx.status).replace('text-', 'border-')}`}>
                    <StatusIcon className={`w-5 h-5 ${getStatusColor(tx.status)}`} />
                  </div>
                  
                  {/* Transaction Card */}
                  <div className="flex-1 bg-gray-700/30 rounded-lg p-4 border border-gray-600/30">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Badge className={`text-xs ${getTypeColor(tx.type)}`}>
                          {tx.type.toUpperCase()}
                        </Badge>
                        <span className={`text-sm font-medium ${getRiskColor(tx.riskScore)}`}>
                          Risk: {Math.round(tx.riskScore * 100)}%
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-400">{formatTime(tx.timestamp)}</span>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    
                    <p className="text-sm text-white mb-2">{tx.description}</p>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3 text-xs">
                      <div>
                        <span className="text-gray-400">From:</span>
                        <p className="text-white font-mono">{formatAddress(tx.from)}</p>
                      </div>
                      <div>
                        <span className="text-gray-400">To:</span>
                        <p className="text-white font-mono">{formatAddress(tx.to)}</p>
                      </div>
                      <div>
                        <span className="text-gray-400">Value:</span>
                        <p className="text-white">${tx.value.toLocaleString()}</p>
                      </div>
                      <div>
                        <span className="text-gray-400">Gas:</span>
                        <p className="text-white">{tx.gasUsed.toLocaleString()}</p>
                      </div>
                    </div>
                    
                    {/* AI Tags */}
                    {tx.aiTags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {tx.aiTags.map((tag, tagIndex) => (
                          <Badge 
                            key={tagIndex}
                            className={`text-xs ${getAITagColor(tag)}`}
                          >
                            {tag.replace(/-/g, ' ')}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Degraded Mode Warning */}
      {freshness.degraded && (
        <div className="mt-4 p-3 bg-yellow-900/30 border border-yellow-600/30 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-400" />
            <p className="text-sm text-yellow-200">
              Transaction data may be incomplete due to low confidence.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}