import { CheckCircle, XCircle, Clock, AlertTriangle, FileText, TrendingUp } from 'lucide-react';
import { WalletScope, FreshnessConfidence } from '@/types/portfolio';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface ExecutionReceipt {
  id: string;
  planId: string;
  intent: string;
  plannedSteps: number;
  executedSteps: number;
  status: 'completed' | 'failed' | 'partial' | 'pending';
  createdAt: Date;
  completedAt: Date | null;
  gasEstimated: number;
  gasActual: number | null;
  description: string;
  failureReason?: string;
}

interface PlannedVsExecutedReceiptsProps {
  receipts: ExecutionReceipt[];
  freshness: FreshnessConfidence;
  walletScope: WalletScope;
}

export function PlannedVsExecutedReceipts({ 
  receipts, 
  freshness, 
  walletScope 
}: PlannedVsExecutedReceiptsProps) {
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

  const formatGas = (gas: number) => {
    return gas.toLocaleString();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return CheckCircle;
      case 'failed': return XCircle;
      case 'partial': return AlertTriangle;
      default: return Clock;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-400 bg-green-500/10 border-green-500/20';
      case 'failed': return 'text-red-400 bg-red-500/10 border-red-500/20';
      case 'partial': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
      default: return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
    }
  };

  const getExecutionRate = (receipt: ExecutionReceipt) => {
    return (receipt.executedSteps / receipt.plannedSteps) * 100;
  };

  const getGasEfficiency = (receipt: ExecutionReceipt) => {
    if (!receipt.gasActual) return null;
    return ((receipt.gasEstimated - receipt.gasActual) / receipt.gasEstimated) * 100;
  };

  // Calculate summary stats
  const totalReceipts = receipts.length;
  const completedReceipts = receipts.filter(r => r.status === 'completed').length;
  const failedReceipts = receipts.filter(r => r.status === 'failed').length;
  const avgExecutionRate = receipts.length > 0 
    ? receipts.reduce((sum, r) => sum + getExecutionRate(r), 0) / receipts.length 
    : 0;

  return (
    <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700/50">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-green-400" />
          <h3 className="text-lg font-semibold text-white">Planned vs Executed</h3>
          <Badge variant="outline" className="text-xs">
            {totalReceipts} receipts
          </Badge>
        </div>
        
        <div className="text-sm text-gray-400">
          Scope: {walletScope.mode === 'all_wallets' ? 'All Wallets' : 'Single Wallet'}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-700/30 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-green-400">{completedReceipts}</div>
          <p className="text-xs text-gray-400">Completed</p>
        </div>
        
        <div className="bg-gray-700/30 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-red-400">{failedReceipts}</div>
          <p className="text-xs text-gray-400">Failed</p>
        </div>
        
        <div className="bg-gray-700/30 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-blue-400">{avgExecutionRate.toFixed(1)}%</div>
          <p className="text-xs text-gray-400">Avg Success Rate</p>
        </div>
        
        <div className="bg-gray-700/30 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-purple-400">{totalReceipts}</div>
          <p className="text-xs text-gray-400">Total Plans</p>
        </div>
      </div>

      {/* Receipts List */}
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {receipts.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="w-12 h-12 mx-auto mb-4 text-gray-600" />
            <h4 className="text-lg font-medium mb-2 text-white">No Execution Receipts</h4>
            <p className="text-gray-400">
              No AlphaWhale-created plans have been executed yet.
            </p>
          </div>
        ) : (
          receipts.map((receipt) => {
            const StatusIcon = getStatusIcon(receipt.status);
            const executionRate = getExecutionRate(receipt);
            const gasEfficiency = getGasEfficiency(receipt);
            
            return (
              <div 
                key={receipt.id}
                className="p-4 rounded-lg border border-gray-600/30 bg-gray-700/20"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${getStatusColor(receipt.status)}`}>
                      <StatusIcon className="w-4 h-4" />
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-white">{receipt.intent.replace(/_/g, ' ')}</span>
                        <Badge className={`text-xs ${getStatusColor(receipt.status)}`}>
                          {receipt.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-400">{receipt.description}</p>
                    </div>
                  </div>
                  
                  <div className="text-right text-sm text-gray-400">
                    <p>Created {formatTime(receipt.createdAt)}</p>
                    {receipt.completedAt && (
                      <p>Completed {formatTime(receipt.completedAt)}</p>
                    )}
                  </div>
                </div>

                {/* Execution Progress */}
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-300">Execution Progress</span>
                    <span className="text-sm font-medium text-white">
                      {receipt.executedSteps}/{receipt.plannedSteps} steps ({executionRate.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-600 rounded-full">
                    <div 
                      className={`h-full rounded-full ${
                        receipt.status === 'completed' ? 'bg-green-500' :
                        receipt.status === 'failed' ? 'bg-red-500' :
                        receipt.status === 'partial' ? 'bg-yellow-500' :
                        'bg-blue-500'
                      }`}
                      style={{ width: `${executionRate}%` }}
                    />
                  </div>
                </div>

                {/* Gas Comparison */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Estimated Gas:</span>
                    <p className="text-white font-medium">{formatGas(receipt.gasEstimated)}</p>
                  </div>
                  
                  {receipt.gasActual && (
                    <>
                      <div>
                        <span className="text-gray-400">Actual Gas:</span>
                        <p className="text-white font-medium">{formatGas(receipt.gasActual)}</p>
                      </div>
                      
                      <div>
                        <span className="text-gray-400">Efficiency:</span>
                        <div className="flex items-center gap-1">
                          {gasEfficiency !== null && (
                            <>
                              {gasEfficiency > 0 ? (
                                <TrendingUp className="w-3 h-3 text-green-400" />
                              ) : (
                                <TrendingUp className="w-3 h-3 text-red-400 rotate-180" />
                              )}
                              <span className={`font-medium ${
                                gasEfficiency > 0 ? 'text-green-400' : 'text-red-400'
                              }`}>
                                {gasEfficiency > 0 ? '+' : ''}{gasEfficiency.toFixed(1)}%
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Failure Reason */}
                {receipt.failureReason && (
                  <div className="mt-3 p-2 bg-red-900/30 border border-red-600/30 rounded">
                    <div className="flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-red-400" />
                      <p className="text-sm text-red-200">{receipt.failureReason}</p>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="mt-3 flex items-center justify-end gap-2">
                  <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                    View Details
                  </Button>
                  {receipt.status === 'failed' && (
                    <Button size="sm" variant="outline" className="text-blue-400 border-blue-400">
                      Retry Plan
                    </Button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Confidence Indicator */}
      <div className="mt-4 pt-4 border-t border-gray-700/50">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Execution Data Confidence</span>
          <span className={`font-medium ${
            freshness.confidence >= 0.8 ? 'text-green-400' : 
            freshness.confidence >= 0.6 ? 'text-yellow-400' : 'text-red-400'
          }`}>
            {Math.round(freshness.confidence * 100)}%
          </span>
        </div>
        
        {freshness.degraded && (
          <div className="mt-2 p-2 bg-yellow-900/30 border border-yellow-600/30 rounded">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-400" />
              <p className="text-xs text-yellow-200">
                Execution receipt data may be incomplete due to low confidence.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}