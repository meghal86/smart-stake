import { useState } from 'react';
import { Shield, AlertTriangle, TrendingUp, ChevronDown, ChevronUp, Layers } from 'lucide-react';
import { FreshnessConfidence } from '@/types/portfolio';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Protocol {
  id: string;
  name: string;
  category: string;
  valueUsd: number;
  allocation: number;
  positions: Array<{
    pair?: string;
    asset?: string;
    valueUsd: number;
    apy: number;
  }>;
  riskLevel: 'low' | 'medium' | 'high';
}

interface ProtocolExposureProps {
  protocols: Protocol[];
  totalValue: number;
  freshness: FreshnessConfidence;
  showTopN?: number;
}

export function ProtocolExposure({ 
  protocols, 
  totalValue, 
  freshness,
  showTopN = 5 
}: ProtocolExposureProps) {
  const [showAll, setShowAll] = useState(false);
  const [expandedProtocols, setExpandedProtocols] = useState<Set<string>>(new Set());

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-red-400 bg-red-500/10 border-red-500/20';
      case 'medium': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
      default: return 'text-green-400 bg-green-500/10 border-green-500/20';
    }
  };

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'high': return AlertTriangle;
      case 'medium': return Shield;
      default: return Shield;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'dex': return 'bg-blue-500/10 text-blue-400';
      case 'lending': return 'bg-green-500/10 text-green-400';
      case 'staking': return 'bg-purple-500/10 text-purple-400';
      case 'yield': return 'bg-orange-500/10 text-orange-400';
      default: return 'bg-gray-500/10 text-gray-400';
    }
  };

  const toggleProtocolExpansion = (protocolId: string) => {
    const newExpanded = new Set(expandedProtocols);
    if (newExpanded.has(protocolId)) {
      newExpanded.delete(protocolId);
    } else {
      newExpanded.add(protocolId);
    }
    setExpandedProtocols(newExpanded);
  };

  // Sort protocols by value
  const sortedProtocols = [...protocols].sort((a, b) => b.valueUsd - a.valueUsd);
  const displayedProtocols = showAll ? sortedProtocols : sortedProtocols.slice(0, showTopN);

  return (
    <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700/50">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-purple-400" />
          <h3 className="text-lg font-semibold text-white">Protocol Exposure</h3>
          <Badge variant="outline" className="text-xs">
            {protocols.length} protocols
          </Badge>
        </div>
        
        <div className="text-sm text-gray-400">
          Total DeFi: {formatCurrency(protocols.reduce((sum, p) => sum + p.valueUsd, 0))}
        </div>
      </div>

      {/* Protocols List */}
      <div className="space-y-4">
        {displayedProtocols.length === 0 ? (
          <div className="text-center py-8">
            <Layers className="w-12 h-12 mx-auto mb-4 text-gray-600" />
            <h4 className="text-lg font-medium mb-2 text-white">No Protocol Exposure</h4>
            <p className="text-gray-400">
              No DeFi protocol positions found in this portfolio.
            </p>
          </div>
        ) : (
          displayedProtocols.map((protocol) => {
            const RiskIcon = getRiskIcon(protocol.riskLevel);
            const isExpanded = expandedProtocols.has(protocol.id);
            
            return (
              <div 
                key={protocol.id} 
                className="p-4 rounded-lg border border-gray-600/30 bg-gray-700/20"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    {/* Protocol Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-white">{protocol.name}</span>
                        <Badge className={`text-xs ${getCategoryColor(protocol.category)}`}>
                          {protocol.category}
                        </Badge>
                        <Badge className={`text-xs ${getRiskColor(protocol.riskLevel)}`}>
                          <RiskIcon className="w-3 h-3 mr-1" />
                          {protocol.riskLevel} risk
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <span>Value: {formatCurrency(protocol.valueUsd)}</span>
                        <span>Allocation: {protocol.allocation.toFixed(1)}%</span>
                        <span>Positions: {protocol.positions.length}</span>
                      </div>
                    </div>

                    {/* Allocation Bar */}
                    <div className="w-24">
                      <div className="w-full h-2 bg-gray-600 rounded-full">
                        <div 
                          className="h-full bg-purple-500 rounded-full"
                          style={{ width: `${Math.min(protocol.allocation, 100)}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-400 mt-1 text-center">
                        {protocol.allocation.toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  {/* Expand Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleProtocolExpansion(protocol.id)}
                    className="h-8 w-8 p-0 ml-2"
                  >
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </Button>
                </div>

                {/* Expanded Positions */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-gray-600/30">
                    <h5 className="text-sm font-medium text-gray-300 mb-3">Positions</h5>
                    <div className="space-y-2">
                      {protocol.positions.map((position, index) => (
                        <div 
                          key={index}
                          className="flex items-center justify-between p-3 bg-gray-600/20 rounded-lg"
                        >
                          <div>
                            <p className="text-sm font-medium text-white">
                              {position.pair || position.asset}
                            </p>
                            <p className="text-xs text-gray-400">
                              {formatCurrency(position.valueUsd)}
                            </p>
                          </div>
                          
                          <div className="text-right">
                            <div className="flex items-center gap-1 text-green-400">
                              <TrendingUp className="w-3 h-3" />
                              <span className="text-sm font-medium">
                                {position.apy.toFixed(1)}% APY
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Progressive Disclosure */}
      {protocols.length > showTopN && (
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
                View All {protocols.length} Protocols
              </>
            )}
          </Button>
        </div>
      )}

      {/* Confidence Indicator */}
      <div className="mt-4 pt-4 border-t border-gray-700/50">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Protocol Data Confidence</span>
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
              Protocol exposure data may be incomplete due to low confidence.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}