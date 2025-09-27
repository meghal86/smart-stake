import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Fish, 
  TrendingUp, 
  TrendingDown, 
  ChevronDown, 
  ChevronUp,
  AlertTriangle,
  Activity,
  Eye,
  Zap,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Flame
} from 'lucide-react';
import { ClusterMetrics } from '@/types/cluster';
import { formatUSD } from '@/lib/market/compute';

interface EnhancedWhaleClustersProps {
  clusters?: ClusterMetrics[];
  loading?: boolean;
  timeWindow?: string;
  onClusterSelect?: (clusterId: string) => void;
  selectedCluster?: string | null;
  alerts?: any[];
}

interface ClusterGroup {
  type: string;
  label: string;
  icon: string;
  clusters: ClusterMetrics[];
  defaultOpen: boolean;
}

export function EnhancedWhaleClustersV2({ 
  clusters = [], 
  loading = false, 
  timeWindow = '24h',
  onClusterSelect,
  selectedCluster,
  alerts = []
}: EnhancedWhaleClustersProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['high-activity', 'accumulation']));

  // Group clusters by type with enhanced categorization
  const clusterGroups: ClusterGroup[] = useMemo(() => {
    const groups: ClusterGroup[] = [
      {
        type: 'high-activity',
        label: 'High Activity Clusters',
        icon: '🔥',
        clusters: [],
        defaultOpen: true
      },
      {
        type: 'accumulation',
        label: 'Accumulation Patterns',
        icon: '📈',
        clusters: [],
        defaultOpen: true
      },
      {
        type: 'distribution',
        label: 'Distribution & Outflows',
        icon: '📤',
        clusters: [],
        defaultOpen: false
      },
      {
        type: 'dormant',
        label: 'Dormant & Awakening',
        icon: '😴',
        clusters: [],
        defaultOpen: false
      },
      {
        type: 'defi',
        label: 'DeFi Interactions',
        icon: '🔄',
        clusters: [],
        defaultOpen: false
      }
    ];

    // Categorize clusters with enhanced logic
    clusters.forEach(cluster => {
      const riskScore = cluster.riskScore || 0;
      const netFlow = cluster.netFlowUSD || 0;
      const kind = cluster.kind?.toLowerCase() || '';

      if (riskScore >= 70 || Math.abs(netFlow) > 50000000) {
        groups[0].clusters.push(cluster); // High Activity
      } else if (kind.includes('accumulation') || netFlow > 0) {
        groups[1].clusters.push(cluster); // Accumulation
      } else if (kind.includes('outflow') || kind.includes('distribution') || netFlow < 0) {
        groups[2].clusters.push(cluster); // Distribution
      } else if (kind.includes('dormant')) {
        groups[3].clusters.push(cluster); // Dormant
      } else if (kind.includes('defi')) {
        groups[4].clusters.push(cluster); // DeFi
      } else {
        groups[0].clusters.push(cluster); // Default to high activity
      }
    });

    return groups.filter(group => group.clusters.length > 0);
  }, [clusters]);

  // Enhanced mock data with trends and engagement hooks
  const mockClusters: ClusterMetrics[] = [
    {
      clusterId: 'dormant_awakening_btc',
      name: 'Dormant BTC Whales Awakening',
      kind: 'Dormant',
      activeAddresses: 23,
      valueAbsUSD: 104100000,
      netFlowUSD: -104100000,
      shareOfTotalPct: 45.2,
      riskScore: 90,
      confidencePct: 90,
      trend: '+23%',
      lastActive: '2h ago',
      alertCount: 3
    },
    {
      clusterId: 'smart_money_accumulation',
      name: 'Smart Money Accumulation',
      kind: 'Accumulation',
      activeAddresses: 15,
      valueAbsUSD: 67800000,
      netFlowUSD: 45200000,
      shareOfTotalPct: 19.6,
      riskScore: 35,
      confidencePct: 85,
      trend: '+156%',
      lastActive: '15m ago',
      alertCount: 1
    },
    {
      clusterId: 'cex_whale_outflow',
      name: 'CEX Whale Outflows',
      kind: 'Outflow',
      activeAddresses: 8,
      valueAbsUSD: 32100000,
      netFlowUSD: -28900000,
      shareOfTotalPct: 12.5,
      riskScore: 75,
      confidencePct: 80,
      trend: '+89%',
      lastActive: '32m ago',
      alertCount: 2
    },
    {
      clusterId: 'defi_yield_farmers',
      name: 'DeFi Yield Farmers',
      kind: 'Defi',
      activeAddresses: 12,
      valueAbsUSD: 18700000,
      netFlowUSD: 8900000,
      shareOfTotalPct: 3.9,
      riskScore: 45,
      confidencePct: 70,
      trend: '+12%',
      lastActive: '1h ago',
      alertCount: 0
    },
    {
      clusterId: 'institutional_rebalancing',
      name: 'Institutional Rebalancing',
      kind: 'CEXInflow',
      activeAddresses: 5,
      valueAbsUSD: 89300000,
      netFlowUSD: -12400000,
      shareOfTotalPct: 5.4,
      riskScore: 55,
      confidencePct: 75,
      trend: '-8%',
      lastActive: '45m ago',
      alertCount: 1
    }
  ];

  const displayClusters = clusters.length > 0 ? clusters : mockClusters;

  const toggleGroup = (groupType: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupType)) {
      newExpanded.delete(groupType);
    } else {
      newExpanded.add(groupType);
    }
    setExpandedGroups(newExpanded);
  };

  if (loading) {
    return <ClusterSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header with Top Movers */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Whale Behavior Clusters</h2>
          <p className="text-sm text-muted-foreground">Real-time behavioral analysis</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <Flame className="w-3 h-3" />
            Top Movers
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Updated 2m ago
          </Badge>
        </div>
      </div>

      {/* AI Digest */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
        <div className="flex items-center gap-2">
          <Zap className="w-3 h-3 text-blue-600" />
          <span className="text-xs text-blue-700">Dormant BTC whales awakening - price impact expected</span>
        </div>
      </div>

      {/* Grouped Clusters */}
      <div className="space-y-4">
        {clusterGroups.map((group) => (
          <Collapsible
            key={group.type}
            open={expandedGroups.has(group.type)}
            onOpenChange={() => toggleGroup(group.type)}
          >
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-between p-4 h-auto border rounded-lg hover:bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{group.icon}</span>
                  <div className="text-left">
                    <h3 className="font-medium">{group.label}</h3>
                    <p className="text-sm text-muted-foreground">
                      {group.clusters.length} cluster{group.clusters.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                {expandedGroups.has(group.type) ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            
            <CollapsibleContent className="mt-3">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {group.clusters.map((cluster) => (
                  <EnhancedClusterCard
                    key={cluster.clusterId}
                    cluster={cluster}
                    isSelected={selectedCluster === cluster.clusterId}
                    onSelect={() => onClusterSelect?.(cluster.clusterId)}
                    alerts={alerts.filter(alert => 
                      alert.clusterId === cluster.clusterId || 
                      alert.clusterType === cluster.kind
                    )}
                  />
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        ))}
      </div>
    </div>
  );
}

interface EnhancedClusterCardProps {
  cluster: ClusterMetrics & { 
    trend?: string; 
    lastActive?: string; 
    alertCount?: number;
  };
  isSelected: boolean;
  onSelect: () => void;
  alerts: any[];
}

function EnhancedClusterCard({ cluster, isSelected, onSelect, alerts }: EnhancedClusterCardProps) {
  const getRiskColor = (score: number) => {
    if (score >= 70) return 'text-red-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-green-600';
  };

  const getKindIcon = (kind: string) => {
    const icons: Record<string, string> = {
      'Accumulation': '📈',
      'Outflow': '📤',
      'CEXInflow': '🏦',
      'Defi': '🔄',
      'Dormant': '😴'
    };
    return icons[kind] || '❓';
  };

  const hasAlerts = alerts.length > 0 || (cluster.alertCount && cluster.alertCount > 0);
  const alertCount = alerts.length || cluster.alertCount || 0;

  return (
    <Card 
      className={`cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] ${
        isSelected ? 'ring-2 ring-primary shadow-lg' : ''
      } ${hasAlerts ? 'border-orange-200 bg-orange-50/30' : ''}`}
      onClick={onSelect}
    >
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header with Alert Badge */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">{getKindIcon(cluster.kind)}</span>
              <Badge variant="outline" className="text-xs">
                {cluster.kind}
              </Badge>
            </div>
            <div className="flex flex-col items-end gap-1">
              {hasAlerts && (
                <Badge variant="destructive" className="text-xs flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  {alertCount}
                </Badge>
              )}
              {cluster.trend && (
                <Badge 
                  variant={cluster.trend.startsWith('+') ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {cluster.trend}
                </Badge>
              )}
            </div>
          </div>

          {/* Cluster Name */}
          <div>
            <h4 className="font-medium text-sm leading-tight">{cluster.name || 'Unknown Cluster'}</h4>
            <p className="text-xs text-muted-foreground mt-1">
              {cluster.activeAddresses || 0} addresses
              {cluster.lastActive && ` • ${cluster.lastActive}`}
            </p>
          </div>

          {/* Value Display */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Value</span>
              <span className="font-semibold text-sm">
                {formatUSD(cluster.valueAbsUSD || 0)}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">24h Flow</span>
              <div className="flex items-center gap-1">
                {(cluster.netFlowUSD || 0) > 0 ? (
                  <ArrowUpRight className="w-3 h-3 text-green-600" />
                ) : (
                  <ArrowDownRight className="w-3 h-3 text-red-600" />
                )}
                <span className={`font-semibold text-sm ${
                  (cluster.netFlowUSD || 0) > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatUSD(Math.abs(cluster.netFlowUSD || 0))}
                </span>
              </div>
            </div>
          </div>

          {/* Risk Score with Circular Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Risk Score</span>
              <span className={`font-semibold text-sm ${getRiskColor(cluster.riskScore || 0)}`}>
                {cluster.riskScore || 0}/100
              </span>
            </div>
            <Progress 
              value={cluster.riskScore || 0} 
              className="h-2"
              // @ts-ignore
              style={{
                '--progress-background': (cluster.riskScore || 0) >= 70 ? '#ef4444' : 
                                       (cluster.riskScore || 0) >= 40 ? '#f97316' : '#22c55e'
              }}
            />
          </div>

          {/* Share of Total */}
          <div className="text-center py-2 bg-muted/30 rounded">
            <div className="text-lg font-bold">{(cluster.shareOfTotalPct || 0).toFixed(1)}%</div>
            <div className="text-xs text-muted-foreground">of total flow</div>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2 pt-2">
            <Button size="sm" variant="outline" className="flex-1 text-xs">
              <Eye className="w-3 h-3 mr-1" />
              Details
            </Button>
            <Button size="sm" variant="outline" className="flex-1 text-xs">
              <Activity className="w-3 h-3 mr-1" />
              Track
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ClusterSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="h-6 bg-muted rounded w-1/3"></div>
        <div className="h-4 bg-muted rounded w-1/2"></div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="animate-pulse space-y-3">
                <div className="flex justify-between">
                  <div className="h-4 bg-muted rounded w-1/3"></div>
                  <div className="h-4 bg-muted rounded w-1/4"></div>
                </div>
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-8 bg-muted rounded"></div>
                <div className="h-2 bg-muted rounded"></div>
                <div className="flex gap-2">
                  <div className="h-6 bg-muted rounded flex-1"></div>
                  <div className="h-6 bg-muted rounded flex-1"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}