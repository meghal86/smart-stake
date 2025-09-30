// Cluster Strip with Corrected Formulas and Alert Linking
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { ClusterMetrics } from '@/types/cluster';
import { formatUSD, getRiskThreshold, getConfidenceLabel, calculateShareOfTotal, validateClusterMetrics } from '@/lib/market/compute';
import { useClusterStore } from '@/stores/clusterStore';

interface ClusterStripProps {
  clusters: ClusterMetrics[];
  onClusterSelect: (clusterId: string) => void;
}

export function ClusterStrip({ clusters, onClusterSelect }: ClusterStripProps) {
  const { selectedCluster, selectedAlert, timeWindow } = useClusterStore();
  
  // Calculate corrected share percentages
  const clustersWithCorrectShares = clusters.map(cluster => {
    const allNetFlows = clusters.map(c => c.netFlowUSD);
    const correctedShare = calculateShareOfTotal(cluster.netFlowUSD, allNetFlows);
    
    // Validate and log errors
    const errors = validateClusterMetrics({ ...cluster, shareOfTotalPct: correctedShare });
    if (errors.length > 0) {
      console.warn(`Cluster ${cluster.clusterId} validation:`, errors);
    }
    
    return {
      ...cluster,
      shareOfTotalPct: correctedShare
    };
  });

  const getClusterIcon = (kind: string) => {
    const icons: Record<string, string> = {
      'Accumulation': '📈',
      'Outflow': '📤', 
      'CEXInflow': '🏦',
      'Defi': '🔄',
      'Dormant': '😴'
    };
    return icons[kind] || '❓';
  };

  const getClusterColor = (kind: string) => {
    const colors: Record<string, string> = {
      'Accumulation': 'bg-green-500/10 text-green-700 border-green-200',
      'Outflow': 'bg-red-500/10 text-red-700 border-red-200',
      'CEXInflow': 'bg-orange-500/10 text-orange-700 border-orange-200',
      'Defi': 'bg-purple-500/10 text-purple-700 border-purple-200',
      'Dormant': 'bg-blue-500/10 text-blue-700 border-blue-200'
    };
    return colors[kind] || 'bg-gray-500/10 text-gray-700 border-gray-200';
  };

  const getRiskColor = (score: number) => {
    const level = getRiskThreshold(score);
    if (level === 'High') return 'text-red-600 bg-red-50';
    if (level === 'Watch') return 'text-orange-600 bg-orange-50';
    return 'text-green-600 bg-green-50';
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Whale Behavior Clusters</h3>
      
      {clustersWithCorrectShares.length === 0 ? (
        <div className="text-center text-muted-foreground py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading whale behavior clusters...</p>
          <p className="text-sm mt-2">Analyzing transaction patterns and behavioral signals</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          {clustersWithCorrectShares.map((cluster) => {
            const isSelected = selectedCluster === cluster.clusterId;
            const riskLevel = getRiskThreshold(cluster.riskScore);
            const confidenceLabel = getConfidenceLabel(cluster.confidencePct);
            const isUncertain = cluster.confidencePct < 20;
            
            return (
              <Card 
                key={cluster.clusterId}
                className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                  isSelected ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => onClusterSelect(cluster.clusterId)}
                data-cluster-id={cluster.clusterId}
              >
                <div className="space-y-3">
                  {/* Header with Icon and Risk */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getClusterIcon(cluster.kind)}</span>
                      <Badge className={getClusterColor(cluster.kind)}>
                        {isUncertain ? 'Uncertain' : cluster.kind.replace('_', ' ')}
                      </Badge>
                    </div>
                    {!isUncertain && (
                      <Badge className={getRiskColor(cluster.riskScore)}>
                        {cluster.riskScore}
                      </Badge>
                    )}
                  </div>

                  {/* Cluster Name and Address Count */}
                  <div>
                    <h4 className="font-medium text-sm mb-1">{cluster.name}</h4>
                    <p className="text-xs text-muted-foreground">
                      {cluster.activeAddresses} addresses
                    </p>
                  </div>

                  {/* Value and Flow Metrics */}
                  <div className="space-y-1">
                    <p className="text-sm font-semibold">
                      {formatUSD(cluster.valueAbsUSD)}
                    </p>
                    <div className="flex items-center gap-1 text-xs">
                      {cluster.netFlowUSD > 0 ? (
                        <TrendingUp className="h-3 w-3 text-green-600" />
                      ) : (
                        <TrendingDown className="h-3 w-3 text-red-600" />
                      )}
                      <span className={cluster.netFlowUSD > 0 ? 'text-green-600' : 'text-red-600'}>
                        {formatUSD(cluster.netFlowUSD)} {timeWindow}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {cluster.shareOfTotalPct.toFixed(1)}% of total
                    </div>
                  </div>

                  {/* Confidence and Data Source Indicators */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      {confidenceLabel} ({cluster.confidencePct}%)
                    </span>
                    {cluster.note === 'balance_delta_source' && (
                      <Badge variant="outline" className="text-xs">
                        Δ
                      </Badge>
                    )}
                    {cluster.note === 'insufficient_data' && (
                      <Badge variant="secondary" className="text-xs">
                        No Data
                      </Badge>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}