import { Shield, AlertTriangle, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { WalletScope, FreshnessConfidence } from '@/types/portfolio';
import { Badge } from '@/components/ui/badge';

interface RiskSummaryData {
  overallScore: number; // 0-1 scale
  criticalIssues: number;
  highRiskApprovals: number;
  mediumRiskApprovals: number;
  lowRiskApprovals: number;
  riskFactors: Array<{
    name: string;
    score: number; // 0-1 scale
    trend: 'improving' | 'worsening' | 'stable';
  }>;
}

interface RiskSummaryCardProps {
  riskSummary: RiskSummaryData;
  freshness: FreshnessConfidence;
  walletScope: WalletScope;
}

export function RiskSummaryCard({ riskSummary, freshness, walletScope }: RiskSummaryCardProps) {
  const getRiskLevel = (score: number) => {
    if (score >= 0.8) return { level: 'Critical', color: 'text-red-400', bgColor: 'bg-red-500/10' };
    if (score >= 0.6) return { level: 'High', color: 'text-orange-400', bgColor: 'bg-orange-500/10' };
    if (score >= 0.4) return { level: 'Medium', color: 'text-yellow-400', bgColor: 'bg-yellow-500/10' };
    return { level: 'Low', color: 'text-green-400', bgColor: 'bg-green-500/10' };
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return TrendingDown;
      case 'worsening': return TrendingUp;
      default: return Minus;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'improving': return 'text-green-400';
      case 'worsening': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const overallRisk = getRiskLevel(riskSummary.overallScore);

  return (
    <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700/50">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-cyan-400" />
          <h3 className="text-lg font-semibold text-white">Risk Summary</h3>
        </div>
        
        <Badge variant="outline" className="text-xs">
          Scope: {walletScope.mode === 'all_wallets' ? 'All Wallets' : 'Single Wallet'}
        </Badge>
      </div>

      {/* Overall Risk Score */}
      <div className={`p-4 rounded-lg mb-6 ${overallRisk.bgColor} border border-gray-600/30`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-300 mb-1">Overall Risk Level</p>
            <div className="flex items-center gap-2">
              <span className={`text-2xl font-bold ${overallRisk.color}`}>
                {overallRisk.level}
              </span>
              <span className="text-gray-400 text-sm">
                ({Math.round(riskSummary.overallScore * 100)}%)
              </span>
            </div>
          </div>
          
          <div className={`p-3 rounded-full ${overallRisk.bgColor}`}>
            {riskSummary.overallScore >= 0.6 ? (
              <AlertTriangle className={`w-6 h-6 ${overallRisk.color}`} />
            ) : (
              <Shield className={`w-6 h-6 ${overallRisk.color}`} />
            )}
          </div>
        </div>
      </div>

      {/* Risk Breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-red-400 mb-1">
            {riskSummary.criticalIssues}
          </div>
          <p className="text-xs text-gray-400">Critical Issues</p>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-400 mb-1">
            {riskSummary.highRiskApprovals}
          </div>
          <p className="text-xs text-gray-400">High Risk</p>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-400 mb-1">
            {riskSummary.mediumRiskApprovals}
          </div>
          <p className="text-xs text-gray-400">Medium Risk</p>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-green-400 mb-1">
            {riskSummary.lowRiskApprovals}
          </div>
          <p className="text-xs text-gray-400">Low Risk</p>
        </div>
      </div>

      {/* Risk Factors */}
      <div>
        <h4 className="text-sm font-medium text-gray-300 mb-3">Risk Factors</h4>
        <div className="space-y-3">
          {riskSummary.riskFactors.map((factor, index) => {
            const factorRisk = getRiskLevel(factor.score);
            const TrendIcon = getTrendIcon(factor.trend);
            
            return (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${factorRisk.bgColor} border-2 ${factorRisk.color.replace('text-', 'border-')}`} />
                  <span className="text-sm text-gray-300">{factor.name}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <TrendIcon className={`w-4 h-4 ${getTrendColor(factor.trend)}`} />
                  <span className={`text-sm font-medium ${factorRisk.color}`}>
                    {Math.round(factor.score * 100)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Confidence Indicator */}
      <div className="mt-4 pt-4 border-t border-gray-700/50">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Risk Analysis Confidence</span>
          <span className={`font-medium ${
            freshness.confidence >= 0.8 ? 'text-green-400' : 
            freshness.confidence >= 0.6 ? 'text-yellow-400' : 'text-red-400'
          }`}>
            {Math.round(freshness.confidence * 100)}%
          </span>
        </div>
        
        {freshness.degraded && (
          <div className="mt-2 p-2 bg-yellow-900/30 border border-yellow-600/30 rounded">
            <p className="text-xs text-yellow-200">
              Risk analysis may be incomplete due to low confidence data.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}