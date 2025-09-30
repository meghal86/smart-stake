import { useState } from 'react';
import { ClusterStrip } from '@/components/market/ClusterStrip';
import { ClusterPanel } from '@/components/market/ClusterPanel';
import { ClusterMetrics } from '@/types/cluster';
import { calculateShareOfTotal } from '@/lib/market/compute';
import { useClusterStore } from '@/stores/clusterStore';

interface WhaleClustersProps {
  clusters?: any[];
  onClusterSelect?: (cluster: any) => void;
  onWhaleSelect?: (whale: any) => void;
}

function mapLegacyType(type: string): any {
  const mapping: Record<string, any> = {
    'ACCUMULATION': 'Accumulation',
    'DISTRIBUTION': 'Outflow',
    'CEX_INFLOW': 'CEXInflow',
    'DEFI_ACTIVITY': 'Defi',
    'DORMANT_WAKING': 'Dormant'
  };
  return mapping[type] || 'Other';
}

export function WhaleClusters({ clusters = [], onClusterSelect, onWhaleSelect }: WhaleClustersProps) {
  const { selectedCluster, setSelectedCluster, timeWindow } = useClusterStore();
  
  // Convert legacy cluster format to new ClusterMetrics format
  const convertedClusters: ClusterMetrics[] = clusters.map(cluster => {
    const allNetFlows = clusters.map(c => c.netFlow24h || 0);
    const shareOfTotal = calculateShareOfTotal(cluster.netFlow24h || 0, allNetFlows);
    
    return {
      clusterId: cluster.id || `cluster_${cluster.type?.toLowerCase()}`,
      name: cluster.name || 'Unknown Cluster',
      kind: mapLegacyType(cluster.type),
      activeAddresses: cluster.membersCount || 0,
      valueAbsUSD: Math.abs(cluster.sumBalanceUsd || 0),
      netFlowUSD: cluster.netFlow24h || 0,
      shareOfTotalPct: shareOfTotal,
      riskScore: cluster.riskScore || 0,
      confidencePct: cluster.riskScore > 0 ? 75 : 0
    };
  });
  
  // Fallback mock data if no clusters provided
  const mockClusters: ClusterMetrics[] = [
    {
      clusterId: 'dormant_waking',
      name: 'Dormant Wallets Awakening',
      kind: 'Dormant',
      activeAddresses: 23,
      valueAbsUSD: 104100000,
      netFlowUSD: -104100000,
      shareOfTotalPct: 45.2,
      riskScore: 90,
      confidencePct: 90
    },
    {
      clusterId: 'cex_inflow',
      name: 'CEX Inflows',
      kind: 'CEXInflow',
      activeAddresses: 0,
      valueAbsUSD: 0,
      netFlowUSD: 0,
      shareOfTotalPct: 0,
      riskScore: 0,
      confidencePct: 0,
      note: 'insufficient_data'
    },
    {
      clusterId: 'outflow_whales',
      name: 'Outflow Whales',
      kind: 'Outflow',
      activeAddresses: 8,
      valueAbsUSD: 3200000,
      netFlowUSD: -3200000,
      shareOfTotalPct: 1.4,
      riskScore: 65,
      confidencePct: 80
    },
    {
      clusterId: 'defi_activity',
      name: 'DeFi Interactions',
      kind: 'Defi',
      activeAddresses: 12,
      valueAbsUSD: 8900000,
      netFlowUSD: 2300000,
      shareOfTotalPct: 3.9,
      riskScore: 45,
      confidencePct: 70
    },
    {
      clusterId: 'accumulation',
      name: 'Accumulation Pattern',
      kind: 'Accumulation',
      activeAddresses: 15,
      valueAbsUSD: 25600000,
      netFlowUSD: 18900000,
      shareOfTotalPct: 8.2,
      riskScore: 35,
      confidencePct: 85
    }
  ];
  
  const displayClusters = convertedClusters.length > 0 ? convertedClusters : mockClusters;

  const handleClusterSelect = (clusterId: string) => {
    console.log('🎯 Cluster clicked:', clusterId);
    setSelectedCluster(selectedCluster === clusterId ? null : clusterId);
    if (onClusterSelect) {
      const cluster = displayClusters.find(c => c.clusterId === clusterId);
      if (cluster) onClusterSelect(cluster);
    }
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Enhanced Cluster Strip */}
      <ClusterStrip 
        clusters={displayClusters}
        onClusterSelect={handleClusterSelect}
      />

      {/* Enhanced Cluster Panel */}
      {selectedCluster && (
        <div>
          <p className="text-sm text-blue-600 mb-2">🔍 Debug: Rendering ClusterPanel for {selectedCluster}</p>
          <ClusterPanel 
            clusterId={selectedCluster}
            clusterData={clusters?.find(cluster => (cluster.id || cluster.clusterId) === selectedCluster)}
            onClose={() => setSelectedCluster(null)}
          />
        </div>
      )}
    </div>
  );
}
