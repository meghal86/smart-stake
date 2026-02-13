import { useState } from 'react';
import { Shield, AlertTriangle, DollarSign, Clock, Filter, Eye, ExternalLink } from 'lucide-react';
import { WalletScope, FreshnessConfidence, ApprovalRisk } from '@/types/portfolio';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ApprovalsRiskListProps {
  approvals: ApprovalRisk[];
  freshness: FreshnessConfidence;
  walletScope: WalletScope;
}

export function ApprovalsRiskList({ approvals, freshness, walletScope }: ApprovalsRiskListProps) {
  const [filter, setFilter] = useState<'all' | 'critical' | 'high' | 'permit2'>('all');
  const [selectedApprovals, setSelectedApprovals] = useState<Set<string>>(new Set());

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return AlertTriangle;
      case 'high': return Shield;
      case 'medium': return Shield;
      default: return Shield;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-400 bg-red-500/10 border-red-500/20';
      case 'high': return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
      case 'medium': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
      default: return 'text-green-400 bg-green-500/10 border-green-500/20';
    }
  };

  const toggleApprovalSelection = (approvalId: string) => {
    const newSelected = new Set(selectedApprovals);
    if (newSelected.has(approvalId)) {
      newSelected.delete(approvalId);
    } else {
      newSelected.add(approvalId);
    }
    setSelectedApprovals(newSelected);
  };

  const selectAllVisible = () => {
    const visibleIds = new Set(filteredApprovals.map(approval => approval.id));
    setSelectedApprovals(visibleIds);
  };

  const clearSelection = () => {
    setSelectedApprovals(new Set());
  };

  // Filter approvals
  const filteredApprovals = approvals.filter(approval => {
    switch (filter) {
      case 'critical': return approval.severity === 'critical';
      case 'high': return approval.severity === 'high';
      case 'permit2': return approval.isPermit2;
      default: return true;
    }
  });

  const totalVAR = filteredApprovals.reduce((sum, approval) => sum + approval.valueAtRisk, 0);

  return (
    <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700/50">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-orange-400" />
          <h3 className="text-lg font-semibold text-white">Approvals Risk List</h3>
          <Badge variant="outline" className="text-xs">
            {filteredApprovals.length} approvals
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
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="high">High Risk</SelectItem>
              <SelectItem value="permit2">Permit2</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-700/30 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-red-400">
            {filteredApprovals.filter(a => a.severity === 'critical').length}
          </div>
          <p className="text-xs text-gray-400">Critical</p>
        </div>
        
        <div className="bg-gray-700/30 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-orange-400">
            {filteredApprovals.filter(a => a.severity === 'high').length}
          </div>
          <p className="text-xs text-gray-400">High Risk</p>
        </div>
        
        <div className="bg-gray-700/30 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-purple-400">
            {filteredApprovals.filter(a => a.isPermit2).length}
          </div>
          <p className="text-xs text-gray-400">Permit2</p>
        </div>
        
        <div className="bg-gray-700/30 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-yellow-400">
            {formatCurrency(totalVAR)}
          </div>
          <p className="text-xs text-gray-400">Total VAR</p>
        </div>
      </div>

      {/* Batch Actions */}
      {selectedApprovals.size > 0 && (
        <div className="flex items-center justify-between p-3 bg-blue-900/30 border border-blue-600/30 rounded-lg mb-4">
          <span className="text-sm text-blue-200">
            {selectedApprovals.size} approval{selectedApprovals.size > 1 ? 's' : ''} selected
          </span>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={clearSelection}>
              Clear
            </Button>
            <Button 
              size="sm" 
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={freshness.degraded}
            >
              Batch Revoke
            </Button>
          </div>
        </div>
      )}

      {/* Wallet Scope & Freshness */}
      <div className="flex items-center justify-between mb-4 text-sm">
        <p className="text-gray-400">
          Scope: {walletScope.mode === 'all_wallets' ? 'All Wallets' : `Wallet ${walletScope.address?.slice(0, 6)}...${walletScope.address?.slice(-4)}`}
        </p>
        <div className="flex items-center gap-4">
          <Button size="sm" variant="outline" onClick={selectAllVisible}>
            Select All
          </Button>
          <p className="text-gray-400">
            Confidence: {Math.round(freshness.confidence * 100)}%
          </p>
        </div>
      </div>

      {/* Approvals List */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {filteredApprovals.length === 0 ? (
          <div className="text-center py-8">
            <Eye className="w-12 h-12 mx-auto mb-4 text-gray-600" />
            <h4 className="text-lg font-medium mb-2 text-white">No Approvals Found</h4>
            <p className="text-gray-400">
              No approvals match the current filter criteria.
            </p>
          </div>
        ) : (
          filteredApprovals.map((approval) => {
            const SeverityIcon = getSeverityIcon(approval.severity);
            const isSelected = selectedApprovals.has(approval.id);
            
            return (
              <div 
                key={approval.id} 
                className={`p-4 rounded-lg border transition-colors cursor-pointer ${
                  isSelected 
                    ? 'border-blue-500/50 bg-blue-900/20' 
                    : 'border-gray-600/30 bg-gray-700/20 hover:bg-gray-700/40'
                }`}
                onClick={() => toggleApprovalSelection(approval.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    {/* Checkbox */}
                    <div className={`w-4 h-4 rounded border-2 mt-1 flex items-center justify-center ${
                      isSelected 
                        ? 'bg-blue-600 border-blue-600' 
                        : 'border-gray-500'
                    }`}>
                      {isSelected && <div className="w-2 h-2 bg-white rounded-sm" />}
                    </div>
                    
                    {/* Approval Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium text-white">{approval.token}</span>
                        <Badge className={`text-xs ${getSeverityColor(approval.severity)}`}>
                          <SeverityIcon className="w-3 h-3 mr-1" />
                          {approval.severity}
                        </Badge>
                        {approval.isPermit2 && (
                          <Badge className="text-xs bg-purple-500/10 text-purple-400 border-purple-500/20">
                            Permit2
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-300 mb-2">
                        Spender: {approval.spender}
                      </p>
                      
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        <div>
                          <span className="text-gray-400">Amount:</span>
                          <p className="text-white font-medium">{approval.amount}</p>
                        </div>
                        <div>
                          <span className="text-gray-400">VAR:</span>
                          <p className="text-red-400 font-medium">{formatCurrency(approval.valueAtRisk)}</p>
                        </div>
                        <div>
                          <span className="text-gray-400">Age:</span>
                          <p className="text-white">{approval.ageInDays}d</p>
                        </div>
                        <div>
                          <span className="text-gray-400">Risk Score:</span>
                          <p className={`font-medium ${getSeverityColor(approval.severity).split(' ')[0]}`}>
                            {Math.round(approval.riskScore * 100)}%
                          </p>
                        </div>
                      </div>
                      
                      {/* Risk Reasons */}
                      {approval.riskReasons && approval.riskReasons.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs text-gray-400 mb-1">Risk Factors:</p>
                          <div className="flex flex-wrap gap-1">
                            {approval.riskReasons.map((reason, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {reason.replace(/_/g, ' ').toLowerCase()}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-2 ml-4">
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <ExternalLink className="w-3 h-3" />
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={freshness.degraded}
                      className="text-red-400 border-red-400 hover:bg-red-900/20"
                    >
                      Revoke
                    </Button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Degraded Mode Warning */}
      {freshness.degraded && (
        <div className="mt-4 p-3 bg-yellow-900/30 border border-yellow-600/30 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-400" />
            <p className="text-sm text-yellow-200">
              Approval revocation is disabled in degraded mode for safety.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}