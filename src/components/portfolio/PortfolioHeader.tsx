import React from 'react';
import { Shield, TrendingUp, AlertTriangle, DollarSign } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface PortfolioHeaderProps {
  summary?: {
    totalValue: number;
    pnl24hPct: number;
    riskScore: number;
    trustIndex: number;
  };
}

export const PortfolioHeader: React.FC<PortfolioHeaderProps> = ({ summary }) => {
  if (!summary) {
    return (
      <Card className="p-6 animate-pulse">
        <div className="h-24 bg-muted rounded"></div>
      </Card>
    );
  }
  
  const { totalValue, pnl24hPct, riskScore, trustIndex } = summary;
  const getRiskColor = (score: number) => {
    if (score >= 8) return 'text-green-500';
    if (score >= 6) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getTrustColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <Card className="p-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        {/* Portfolio Value */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            <span className="text-sm text-muted-foreground">Total Portfolio Value</span>

          </div>
          <div className="text-3xl font-bold text-foreground">
            ${(totalValue || 0).toLocaleString()}
          </div>
          <div className={`flex items-center gap-1 text-sm ${pnl24hPct >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            <TrendingUp className="h-4 w-4" />
            {pnl24hPct >= 0 ? '+' : ''}{pnl24hPct.toFixed(2)}% (24h)
          </div>
        </div>

        {/* Risk & Trust Scores */}
        <div className="grid grid-cols-2 gap-6">
          {/* Risk Score */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <AlertTriangle className={`h-5 w-5 ${getRiskColor(riskScore)}`} />
              <span className="text-sm text-muted-foreground">Risk Score</span>
            </div>
            <div className={`text-2xl font-bold ${getRiskColor(riskScore)}`}>
              {riskScore}/10
            </div>
            <div className="text-xs text-muted-foreground">
              {riskScore >= 8 ? 'Low Risk' : riskScore >= 6 ? 'Medium Risk' : 'High Risk'}
            </div>
          </div>

          {/* Trust Score */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Shield className={`h-5 w-5 ${getTrustColor(trustIndex)}`} />
              <span className="text-sm text-muted-foreground">Trust Index</span>
            </div>
            <div className={`text-2xl font-bold ${getTrustColor(trustIndex)}`}>
              {trustIndex}%
            </div>
            <div className="text-xs text-muted-foreground">
              {trustIndex >= 80 ? 'Trusted' : trustIndex >= 60 ? 'Moderate' : 'Caution'}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};