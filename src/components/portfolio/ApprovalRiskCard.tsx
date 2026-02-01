import { useState } from 'react';
import { Shield, AlertTriangle, DollarSign, Clock, ExternalLink, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { ApprovalRisk } from '@/types/portfolio';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ApprovalRiskCardProps {
  approval: ApprovalRisk;
  onRevoke?: (approvalId: string) => void;
  onViewDetails?: (approvalId: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export function ApprovalRiskCard({
  approval,
  onRevoke,
  onViewDetails,
  isLoading = false,
  disabled = false
}: ApprovalRiskCardProps) {
  const [showDetails, setShowDetails] = useState(false);

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

  const getRiskScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-red-400';
    if (score >= 0.6) return 'text-orange-400';
    if (score >= 0.4) return 'text-yellow-400';
    return 'text-green-400';
  };

  const getVARSeverity = (varValue: number) => {
    if (varValue >= 10000) return 'critical';
    if (varValue >= 1000) return 'high';
    if (varValue >= 100) return 'medium';
    return 'low';
  };

  const SeverityIcon = getSeverityIcon(approval.severity);
  const riskScorePercent = Math.round(approval.riskScore * 100);
  const varSeverity = getVARSeverity(approval.valueAtRisk);

  return (
    <Card className="p-4 hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3 flex-1">
          <div className="flex flex-col items-center gap-1">
            <SeverityIcon className={`w-5 h-5 ${getSeverityColor(approval.severity).split(' ')[0]}`} />
            <span className={`text-xs font-medium ${getRiskScoreColor(approval.riskScore)}`}>
              {riskScorePercent}%
            </span>
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold text-white">{approval.token}</h4>
              <Badge className={`text-xs ${getSeverityColor(approval.severity)}`}>
                {approval.severity}
              </Badge>
              {approval.isPermit2 && (
                <Badge className="text-xs bg-purple-500/10 text-purple-400 border-purple-500/20">
                  <Shield className="w-3 h-3 mr-1" />
                  Permit2
                </Badge>
              )}
            </div>
            
            <p className="text-sm text-gray-300 mb-2">
              Spender: {approval.spender.slice(0, 6)}...{approval.spender.slice(-4)}
            </p>
            
            <div className="flex items-center gap-4 text-xs text-gray-400">
              <span>Amount: {approval.amount}</span>
              <span>Age: {approval.ageInDays}d</span>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col items-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => onViewDetails?.(approval.id)}
          >
            <ExternalLink className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Value at Risk Display */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-red-400" />
            <span className="text-sm font-medium">Value at Risk</span>
            <Tooltip>
              <TooltipTrigger>
                <Info className="w-3 h-3 text-gray-400" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Estimated dollar amount at risk from this approval</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-lg font-bold ${getSeverityColor(varSeverity).split(' ')[0]}`}>
              {formatCurrency(approval.valueAtRisk)}
            </span>
            <Badge className={`text-xs ${getSeverityColor(varSeverity)}`}>
              {varSeverity}
            </Badge>
          </div>
        </div>
        <Progress 
          value={Math.min((approval.valueAtRisk / 50000) * 100, 100)} 
          className="h-2"
        />
      </div>

      {/* Risk Score Progress */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Risk Score</span>
          <span className={`text-sm font-bold ${getRiskScoreColor(approval.riskScore)}`}>
            {riskScorePercent}%
          </span>
        </div>
        <Progress 
          value={riskScorePercent} 
          className="h-2"
        />
      </div>

      {/* Risk Reasons Preview */}
      <div className="mb-4">
        <div className="flex flex-wrap gap-1">
          {approval.riskReasons.slice(0, 3).map((reason, index) => (
            <Badge key={index} variant="outline" className="text-xs">
              {reason.replace(/_/g, ' ').toLowerCase()}
            </Badge>
          ))}
          {approval.riskReasons.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{approval.riskReasons.length - 3} more
            </Badge>
          )}
        </div>
      </div>

      {/* Permit2 Detection Alert */}
      {approval.isPermit2 && (
        <Alert className="mb-4 border-purple-200 bg-purple-50 dark:bg-purple-900/20">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            This is a Permit2 approval with operator permissions. 
            Review carefully before revoking as it may affect multiple protocols.
          </AlertDescription>
        </Alert>
      )}

      {/* Progressive Disclosure Toggle */}
      <div className="mb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowDetails(!showDetails)}
          className="w-full justify-between text-gray-400 hover:text-white"
        >
          <span>Risk Details</span>
          {showDetails ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </Button>
      </div>

      {/* Progressive Disclosure Content */}
      {showDetails && (
        <div className="space-y-4 pt-4 border-t border-gray-700/50">
          {/* Contributing Factors */}
          <div>
            <h5 className="text-sm font-medium mb-2 text-gray-300">Contributing Factors</h5>
            <div className="space-y-2">
              {approval.contributingFactors.map((factor, index) => (
                <div key={index} className="flex items-center justify-between p-2 rounded bg-gray-700/30">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">{factor.factor}</p>
                    <p className="text-xs text-gray-400">{factor.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{Math.round(factor.weight * 100)}%</span>
                    <Progress value={factor.weight * 100} className="w-12 h-1" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* All Risk Reasons */}
          <div>
            <h5 className="text-sm font-medium mb-2 text-gray-300">All Risk Reasons</h5>
            <div className="flex flex-wrap gap-1">
              {approval.riskReasons.map((reason, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {reason.replace(/_/g, ' ').toLowerCase()}
                </Badge>
              ))}
            </div>
          </div>

          {/* Technical Details */}
          <div>
            <h5 className="text-sm font-medium mb-2 text-gray-300">Technical Details</h5>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-gray-400">Chain ID:</span>
                <p className="text-white font-medium">{approval.chainId}</p>
              </div>
              <div>
                <span className="text-gray-400">Approval ID:</span>
                <p className="text-white font-medium">{approval.id.slice(0, 8)}...</p>
              </div>
              <div>
                <span className="text-gray-400">Token:</span>
                <p className="text-white font-medium">{approval.token}</p>
              </div>
              <div>
                <span className="text-gray-400">Spender:</span>
                <p className="text-white font-medium">{approval.spender.slice(0, 8)}...</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-4 border-t border-gray-700/50">
        <Button
          variant="outline"
          size="sm"
          disabled={disabled || isLoading}
          onClick={() => onRevoke?.(approval.id)}
          className="flex-1 text-red-400 border-red-400 hover:bg-red-900/20"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 border border-red-400 border-t-transparent rounded-full animate-spin" />
              Revoking...
            </div>
          ) : (
            'Revoke Approval'
          )}
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onViewDetails?.(approval.id)}
          className="text-gray-400 hover:text-white"
        >
          View on Explorer
        </Button>
      </div>
    </Card>
  );
}