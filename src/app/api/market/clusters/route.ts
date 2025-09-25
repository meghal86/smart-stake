// API Route for Cluster Metrics
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/integrations/supabase/client';
import { ClusterMetrics, Window } from '@/types/cluster';
import { calculateShareOfTotal, validateClusterMetrics } from '@/lib/market/compute';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const window = (searchParams.get('window') as Window) || '24h';
  
  try {
    // Mock cluster data with realistic metrics
    const mockClusters: ClusterMetrics[] = [
      {
        clusterId: 'dormant_waking',
        name: 'Dormant Wallets Awakening',
        kind: 'Dormant',
        activeAddresses: 23,
        valueAbsUSD: 104100000,
        netFlowUSD: -104100000,
        shareOfTotalPct: 0, // Will be calculated
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
        shareOfTotalPct: 0, // Will be calculated
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
        shareOfTotalPct: 0, // Will be calculated
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
        shareOfTotalPct: 0, // Will be calculated
        riskScore: 35,
        confidencePct: 85
      }
    ];

    // Calculate correct share percentages
    const allNetFlows = mockClusters.map(c => c.netFlowUSD);
    const clustersWithShares = mockClusters.map(cluster => {
      const shareOfTotal = calculateShareOfTotal(cluster.netFlowUSD, allNetFlows);
      const updatedCluster = { ...cluster, shareOfTotalPct: shareOfTotal };
      
      // Validate metrics
      const errors = validateClusterMetrics(updatedCluster);
      if (errors.length > 0) {
        console.warn(`Cluster ${cluster.clusterId} validation errors:`, errors);
      }
      
      return updatedCluster;
    });

    return NextResponse.json(clustersWithShares, {
      headers: {
        'Cache-Control': 's-maxage=60, stale-while-revalidate=300'
      }
    });
    
  } catch (error) {
    console.error('Clusters API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cluster data' },
      { status: 500 }
    );
  }
}