import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { EnhancedWhaleClustersV2 } from './EnhancedWhaleClustersV2';
import { MobileWhaleClusters } from './MobileWhaleClusters';
import { AlertsIntegration } from './AlertsIntegration';
import { RiskVisualization, CompactRiskScore } from './RiskVisualization';
import { useWindowSize } from '@/hooks/use-mobile';
import { 
  Fish, 
  ExternalLink, 
  TrendingUp, 
  TrendingDown,
  Activity,
  Shield,
  Users,
  Eye,
  Plus
} from 'lucide-react';

export function DesktopWhales({ clusters, loading, selectedWhale, onWhaleSelect }: any) {
  const [selectedCluster, setSelectedCluster] = useState<string | null>(null);
  const [alerts, setAlerts] = useState([]);

  // Fetch alerts for cluster integration
  const { data: whaleAlerts } = useQuery({
    queryKey: ['whale-alerts-integration'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('whale-alerts');
      if (error) throw error;
      return data?.transactions || [];
    },
    retry: 1
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-8 bg-muted rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
      {/* Main Whale Clusters - Enhanced */}
      <div className="xl:col-span-3">
        <EnhancedWhaleClustersV2
          clusters={clusters}
          loading={loading}
          onClusterSelect={setSelectedCluster}
          selectedCluster={selectedCluster}
          alerts={whaleAlerts || []}
        />
        
        {/* Whale Cards Grid */}
        {selectedCluster && (
          <div className="mt-8">
            <WhaleCardsGrid 
              clusterId={selectedCluster}
              selectedWhale={selectedWhale}
              onWhaleSelect={onWhaleSelect}
            />
          </div>
        )}

        {/* Whale Detail Panel */}
        {selectedWhale && (
          <div className="mt-8">
            <WhaleDetailPanel whaleId={selectedWhale} />
          </div>
        )}
      </div>

      {/* Alerts Sidebar */}
      <div className="xl:col-span-1">
        <AlertsIntegration
          alerts={whaleAlerts || []}
          clusters={clusters || []}
          onClusterClick={setSelectedCluster}
        />
      </div>
    </div>
  );
}

export function MobileWhales({ clusters, loading, selectedWhale, onWhaleSelect }: any) {
  const [selectedCluster, setSelectedCluster] = useState<string | null>(null);

  // Fetch alerts for mobile integration
  const { data: whaleAlerts } = useQuery({
    queryKey: ['whale-alerts-mobile'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('whale-alerts');
      if (error) throw error;
      return data?.transactions || [];
    },
    retry: 1
  });

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="animate-pulse space-y-2">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-6 bg-muted rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <MobileWhaleClusters
      clusters={clusters}
      loading={loading}
      onClusterSelect={setSelectedCluster}
      selectedCluster={selectedCluster}
      alerts={whaleAlerts || []}
    />
  );
}

function WhaleCardsGrid({ clusterId, selectedWhale, onWhaleSelect, mobile }: any) {
  const { data: whales, isLoading } = useQuery({
    queryKey: ['fetchWhales', clusterId],
    queryFn: async () => {
      let response;
      console.log('WhaleCardsGrid API call, clusterId:', clusterId);
      if (clusterId == null) {
        // No cluster selected: fetch all whales
        response = await supabase.functions.invoke('fetchWhales');
      } else {
        // Cluster selected: fetch whales for that cluster
        response = await supabase.functions.invoke('fetchWhales', {
          body: { clusterId }
        });
      }
      const { data, error } = response;
      console.log('WhaleCardsGrid API response:', data);
      if (error) throw error;
      return data?.whales || data?.transactions || [];
    },
    retry: 3,
    // Fallback data
    placeholderData: [
      {
        id: '1',
        address: '0x1234...5678',
        balanceUsd: 45000000,
        riskScore: 72,
        transactions24h: 8,
        netFlow24h: -2300000,
        clusterRank: 3,
        clusterSize: 156,
        factorBars: {
          exchangeActivity: 68,
          largeTransfers: 45,
          priceCorrelation: 23,
          liquidityImpact: 34,
          entityReputation: 78
        }
      },
      {
        id: '2',
        address: '0xabcd...efgh',
        balanceUsd: 78000000,
        riskScore: 34,
        transactions24h: 12,
        netFlow24h: 5600000,
        clusterRank: 1,
        clusterSize: 156,
        factorBars: {
          exchangeActivity: 23,
          largeTransfers: 67,
          priceCorrelation: 45,
          liquidityImpact: 56,
          entityReputation: 89
        }
      }
    ]
  });

  if (isLoading) {
    return (
      <div className={mobile ? "space-y-3" : "grid grid-cols-3 gap-6"}>
        {[...Array(mobile ? 3 : 6)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-6 bg-muted rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  console.log('WhaleCardsGrid whales:', whales);
  if (!whales?.length) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Fish className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p className="text-lg font-medium">No whales in this cluster</p>
        <p className="text-sm mt-1">Try selecting 'All Whales' or another cluster to see available whale analytics.</p>
      </div>
    );
  }

  return (
    <div className={mobile ? "space-y-3" : "grid grid-cols-3 gap-6"}>
      {whales.map((whale: any) => (
        <WhaleCard
          key={whale.id}
          whale={whale}
          isSelected={selectedWhale === whale.id}
          onClick={() => onWhaleSelect(whale.id)}
          mobile={mobile}
        />
      ))}
    </div>
  );
}

function WhaleCard({ whale, isSelected, onClick, mobile }: any) {
  const getRiskCategory = (score: number) => {
    if (score >= 70) return { label: 'High', variant: 'destructive' as const };
    if (score >= 40) return { label: 'Medium', variant: 'secondary' as const };
    return { label: 'Low', variant: 'default' as const };
  };

  const riskCategory = getRiskCategory(whale.riskScore || 0);

  return (
    <Card 
      className={`cursor-pointer hover:shadow-md transition-all ${
        isSelected ? 'ring-2 ring-primary' : ''
      }`}
      onClick={onClick}
    >
      <CardContent className={mobile ? "p-4" : "p-6"}>
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Fish className="w-4 h-4 text-muted-foreground" />
              <span className="font-mono text-sm">
                {whale.address?.slice(0, 6)}...{whale.address?.slice(-4)}
              </span>
              <Button variant="ghost" size="sm">
                <ExternalLink className="w-3 h-3" />
              </Button>
            </div>
            <CompactRiskScore riskScore={whale.riskScore || 0} showLabel={false} />
          </div>

          {/* Balance & Risk Score */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Balance</span>
              <span className="font-semibold">
                ${((whale.balanceUsd || 0) / 1e6).toFixed(1)}M
              </span>
            </div>
          </div>

          {/* Enhanced Risk Visualization */}
          {!mobile && (
            <RiskVisualization
              riskScore={whale.riskScore || 0}
              factors={whale.factorBars}
              confidence={whale.confidence || 75}
              size="sm"
              showFactors={false}
            />
          )}

          {/* 24h Activity */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">24h Txns</div>
              <div className="font-semibold">{whale.transactions24h || 0}</div>
            </div>
            <div>
              <div className="text-muted-foreground">24h Net Flow</div>
              <div className={`font-semibold ${
                (whale.netFlow24h || 0) >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {(whale.netFlow24h || 0) >= 0 ? '+' : ''}${Math.abs((whale.netFlow24h || 0) / 1e6).toFixed(1)}M
              </div>
            </div>
          </div>

          {/* Cluster Rank */}
          {whale.clusterRank && (
            <div className="text-xs text-muted-foreground">
              Rank #{whale.clusterRank} of {whale.clusterSize} in cluster
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="flex-1">
              <Eye className="w-3 h-3 mr-1" />
              Details
            </Button>
            <Button size="sm" variant="outline">
              <Plus className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function FactorBars({ factors }: any) {
  const factorData = [
    { name: 'Exchange Activity', value: factors?.exchangeActivity || 0, weight: 30 },
    { name: 'Large Transfers', value: factors?.largeTransfers || 0, weight: 25 },
    { name: 'Price Correlation', value: factors?.priceCorrelation || 0, weight: 20 },
    { name: 'Liquidity Impact', value: factors?.liquidityImpact || 0, weight: 15 },
    { name: 'Entity Reputation', value: factors?.entityReputation || 0, weight: 10 }
  ];

  return (
    <div className="space-y-2">
      {factorData.map((factor) => (
        <div key={factor.name} className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span>{factor.name}</span>
            <span>{factor.value}% (w:{factor.weight}%)</span>
          </div>
          <Progress value={factor.value} className="h-1" />
        </div>
      ))}
    </div>
  );
}

function WhaleDetailPanel({ whaleId }: any) {
  const { data: whaleDetail, isLoading } = useQuery({
    queryKey: ['whale-detail', whaleId],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('whale-profile', {
        body: { whaleId }
      });
      if (error) throw error;
      return data;
    }
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-muted rounded w-1/3"></div>
            <div className="h-4 bg-muted rounded w-full"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Fish className="w-5 h-5" />
          Whale Detail Analysis
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Address Information</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Address:</span>
                  <span className="font-mono">{whaleDetail?.address}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Labels:</span>
                  <div className="flex gap-1">
                    {whaleDetail?.labels?.map((label: string) => (
                      <Badge key={label} variant="outline" className="text-xs">
                        {label}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Activity Metrics</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Transactions:</span>
                  <span>{whaleDetail?.totalTransactions?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">First Activity:</span>
                  <span>{whaleDetail?.firstActivity ? new Date(whaleDetail.firstActivity).toLocaleDateString() : 'Unknown'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Activity:</span>
                  <span>{whaleDetail?.lastActivity ? new Date(whaleDetail.lastActivity).toLocaleDateString() : 'Unknown'}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Enhanced Risk Analysis</h4>
              <RiskVisualization
                riskScore={whaleDetail?.riskScore || 0}
                factors={whaleDetail?.factorBars}
                confidence={whaleDetail?.confidence || 75}
                size="md"
                showFactors={true}
                interactive={true}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Actions</h4>
              <div className="space-y-2">
                <Button className="w-full">
                  Detailed Analysis
                </Button>
                <Button variant="outline" className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Add to Watchlist
                </Button>
                <Button variant="outline" className="w-full">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View on Explorer
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}