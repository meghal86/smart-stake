import { useState } from 'react';
import { Fish, Info, ExternalLink, Shield, Database, Activity, AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface WhaleData {
  id: string;
  address: string;
  fullAddress: string;
  label: string;
  balance: number;
  riskScore: number;
  recentActivity: number;
  chain: string;
  reasons: string[];
  supporting_events: string[];
  provider: string;
  method: string;
  confidence: number;
}

// Blockchain explorer URLs
const getExplorerUrl = (address: string, chain: string = 'ethereum'): string => {
  const explorers = {
    ethereum: 'https://etherscan.io/address/',
    polygon: 'https://polygonscan.com/address/',
    bsc: 'https://bscscan.com/address/'
  };
  return (explorers[chain as keyof typeof explorers] || explorers.ethereum) + address;
};

const getTxExplorerUrl = (txHash: string, chain: string = 'ethereum'): string => {
  const explorers = {
    ethereum: 'https://etherscan.io/tx/',
    polygon: 'https://polygonscan.com/tx/',
    bsc: 'https://bscscan.com/tx/'
  };
  return (explorers[chain as keyof typeof explorers] || explorers.ethereum) + txHash;
};

// Risk score utilities
const getRiskColor = (score: number): string => {
  if (score >= 70) return 'text-red-600';
  if (score >= 40) return 'text-yellow-600';
  return 'text-green-600';
};

const getRiskBadge = (score: number): { variant: 'destructive' | 'default' | 'secondary', label: string } => {
  if (score >= 70) return { variant: 'destructive', label: 'High Risk' };
  if (score >= 40) return { variant: 'default', label: 'Medium Risk' };
  return { variant: 'secondary', label: 'Low Risk' };
};

export const WhaleCard = ({ whale }: { whale: WhaleData }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [showRiskFactors, setShowRiskFactors] = useState(false);
  const riskBadge = getRiskBadge(whale.riskScore);

  return (
    <Card className="p-4 hover:shadow-md transition-shadow" role="article" aria-label={`Whale ${whale.label}`}>
      {/* Header with address, risk badge, and inline provenance */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <Fish className="h-5 w-5 text-primary" aria-hidden="true" />
          <div>
            <h3 className="font-semibold">{whale.label}</h3>
            <a
              href={getExplorerUrl(whale.fullAddress, whale.chain)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:text-blue-800 transition-colors inline-flex items-center gap-1"
              aria-label={`View wallet ${whale.fullAddress} on blockchain explorer`}
            >
              <code>{whale.address}</code>
              <ExternalLink className="h-3 w-3" aria-hidden="true" />
            </a>
          </div>
        </div>
        
        {/* Inline provenance badges - always visible */}
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="text-xs">
            <Database className="h-3 w-3 mr-1" aria-hidden="true" />
            {whale.provider}
          </Badge>
          <Badge variant="outline" className="text-xs">
            <Shield className="h-3 w-3 mr-1" aria-hidden="true" />
            {Math.round(whale.confidence * 100)}%
          </Badge>
          <Badge variant={riskBadge.variant} className="font-medium">
            {riskBadge.label}
          </Badge>
        </div>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
        <div>
          <p className="text-sm text-muted-foreground">Balance</p>
          <p className="font-medium">{whale.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ETH</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Activity</p>
          <p className="font-medium flex items-center gap-1">
            <Activity className="h-3 w-3" aria-hidden="true" />
            {whale.recentActivity}
          </p>
        </div>
        <div className="relative col-span-2 sm:col-span-1">
          <p className="text-sm text-muted-foreground">Risk Score</p>
          <div className="flex items-center gap-2">
            <span className={`font-bold ${getRiskColor(whale.riskScore)}`}>
              {whale.riskScore}/100
            </span>
            <button
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              onFocus={() => setShowTooltip(true)}
              onBlur={() => setShowTooltip(false)}
              className="text-muted-foreground hover:text-primary transition-colors"
              aria-label="Show detailed risk analysis"
            >
              <Info className="h-4 w-4" />
            </button>
          </div>

          {/* Enhanced tooltip with full details */}
          {showTooltip && (
            <div 
              className="absolute top-full left-0 mt-2 p-4 bg-popover border rounded-lg shadow-lg w-80 z-10"
              role="tooltip"
              aria-live="polite"
            >
              <div className="text-xs text-muted-foreground mb-2">
                Method: {whale.method}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Collapsible risk factors panel */}
      {whale.reasons.length > 0 && whale.reasons[0] !== 'No risk analysis available' && (
        <div className="mb-4">
          <button
            onClick={() => setShowRiskFactors(!showRiskFactors)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setShowRiskFactors(!showRiskFactors);
              }
            }}
            className="w-full text-left p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800 hover:bg-orange-100 dark:hover:bg-orange-950/30 transition-colors"
            aria-expanded={showRiskFactors}
            aria-controls={`risk-factors-${whale.id}`}
          >
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-600" aria-hidden="true" />
                Risk Factors ({whale.reasons.length})
              </h4>
              <span className="text-orange-600 transform transition-transform" style={{
                transform: showRiskFactors ? 'rotate(180deg)' : 'rotate(0deg)'
              }}>
                ▼
              </span>
            </div>
          </button>
          {showRiskFactors && (
            <div 
              id={`risk-factors-${whale.id}`}
              className="mt-2 p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800"
              role="region"
              aria-labelledby={`risk-factors-header-${whale.id}`}
            >
              <ul className="space-y-1" role="list">
                {whale.reasons.map((reason, idx) => (
                  <li key={idx} className="text-sm flex items-start gap-2" role="listitem">
                    <span className="text-orange-500 mt-1 flex-shrink-0">•</span>
                    <span className="text-orange-800 dark:text-orange-200">{reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Inline supporting events - always visible */}
      {whale.supporting_events.length > 0 && (
        <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
            <ExternalLink className="h-4 w-4 text-blue-600" aria-hidden="true" />
            Supporting Evidence
          </h4>
          <div className="flex flex-wrap gap-2" role="list">
            {whale.supporting_events.slice(0, 4).map((txHash, idx) => (
              <a
                key={idx}
                href={getTxExplorerUrl(txHash, whale.chain)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                role="listitem"
                aria-label={`View transaction ${txHash} on blockchain explorer`}
              >
                <code>{txHash.slice(0, 6)}...{txHash.slice(-4)}</code>
                <ExternalLink className="h-3 w-3" aria-hidden="true" />
              </a>
            ))}
            {whale.supporting_events.length > 4 && (
              <span className="inline-flex items-center px-2 py-1 bg-muted text-muted-foreground rounded text-xs">
                +{whale.supporting_events.length - 4} more
              </span>
            )}
          </div>
        </div>
      )}
    </Card>
  );
};