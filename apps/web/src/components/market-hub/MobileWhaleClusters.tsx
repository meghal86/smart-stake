import { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Fish, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  Activity,
  Eye,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { ClusterMetrics } from '@/types/cluster';
import { formatUSD } from '@/lib/market/compute';

interface MobileWhaleClustersProps {
  clusters?: ClusterMetrics[];
  loading?: boolean;
  timeWindow?: string;
  onClusterSelect?: (clusterId: string) => void;
  selectedCluster?: string | null;
  alerts?: any[];
}

interface ClusterCategory {
  id: string;
  label: string;
  icon: string;
  clusters: ClusterMetrics[];
}

export function MobileWhaleClusters({ 
  clusters = [], 
  loading = false, 
  timeWindow = '24h',
  onClusterSelect,
  selectedCluster,
  alerts = []
}: MobileWhaleClustersProps) {
  const [activeCategory, setActiveCategory] = useState('all');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Enhanced mock data for mobile
  const mockClusters: ClusterMetrics[] = [
    {
      clusterId: 'dormant_awakening',
      name: 'Dormant Whales Awakening',
      kind: 'Dormant',
      activeAddresses: 23,
      valueAbsUSD: 104100000,
      netFlowUSD: -104100000,
      shareOfTotalPct: 45.2,
      riskScore: 90,
      confidencePct: 90,
      trend: '+23%',
      lastActive: '2h ago',
      alertCount: 3,
      impact: 'High price impact expected'
    },
    {
      clusterId: 'smart_money',
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
      alertCount: 1,
      impact: 'Bullish accumulation pattern'
    },
    {
      clusterId: 'cex_outflow',
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
      alertCount: 2,
      impact: 'Supply shock potential'
    },
    {
      clusterId: 'defi_farmers',
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
      alertCount: 0,
      impact: 'Yield optimization activity'
    }
  ];

  const displayClusters = clusters.length > 0 ? clusters : mockClusters;

  // Categorize clusters for mobile tabs
  const categories: ClusterCategory[] = [
    {
      id: 'all',
      label: 'All',
      icon: '📊',
      clusters: displayClusters
    },
    {
      id: 'hot',
      label: 'Hot',
      icon: '🔥',
      clusters: displayClusters.filter(c => (c.riskScore || 0) >= 70 || (c.alertCount || 0) > 0)
    },
    {
      id: 'accumulation',
      label: 'Buying',
      icon: '📈',
      clusters: displayClusters.filter(c => (c.netFlowUSD || 0) > 0)
    },
    {
      id: 'distribution',
      label: 'Selling',
      icon: '📤',
      clusters: displayClusters.filter(c => (c.netFlowUSD || 0) < 0)
    },
    {
      id: 'dormant',
      label: 'Awakening',
      icon: '😴',
      clusters: displayClusters.filter(c => c.kind?.toLowerCase().includes('dormant'))
    }
  ];

  const activeClusterData = categories.find(cat => cat.id === activeCategory)?.clusters || [];

  const scrollToCategory = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 200;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  if (loading) {
    return <MobileClusterSkeleton />;
  }

  return (
    <div className="space-y-4 pb-20">
      {/* AI Digest Card */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200 mx-4">
        <CardContent className="p-3">
          <div className="flex items-start gap-2">
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Zap className="w-3 h-3 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-blue-900 text-sm">Market Alert</h3>
              <p className="text-xs text-blue-700 mt-1 leading-relaxed">
                Dormant BTC whales awakening could impact price in next 24h. 
                Large outflows suggest potential volatility.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Tabs with Horizontal Scroll */}
      <div className="relative">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="sm"
            className="absolute left-0 z-10 bg-background/80 backdrop-blur-sm"
            onClick={() => scrollToCategory('left')}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          
          <div 
            ref={scrollRef}
            className="flex gap-2 overflow-x-auto scrollbar-hide px-8 py-2"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={activeCategory === category.id ? 'default' : 'outline'}
                size="sm"
                className="flex-shrink-0 text-xs"
                onClick={() => setActiveCategory(category.id)}
              >
                <span className="mr-1">{category.icon}</span>
                {category.label}
                {category.clusters.length > 0 && (
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {category.clusters.length}
                  </Badge>
                )}
              </Button>
            ))}
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="absolute right-0 z-10 bg-background/80 backdrop-blur-sm"
            onClick={() => scrollToCategory('right')}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Cluster Cards - Horizontal Scroll */}
      <div className="px-4">
        {activeClusterData.length === 0 ? (
          <Card className="p-8 text-center">
            <Fish className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
            <h3 className="font-medium text-muted-foreground">No clusters in this category</h3>
            <p className="text-sm text-muted-foreground/70 mt-1">
              Try selecting a different category or check back later
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {activeClusterData.map((cluster) => (
              <MobileClusterCard
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
        )}
      </div>

      {/* Quick Stats Summary */}
      <div className="px-4">
        <Card>
          <CardContent className="p-3">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-lg font-bold text-green-600">
                  {displayClusters.filter(c => (c.netFlowUSD || 0) > 0).length}
                </div>
                <div className="text-xs text-muted-foreground">Accumulating</div>
              </div>
              <div>
                <div className="text-lg font-bold text-red-600">
                  {displayClusters.filter(c => (c.netFlowUSD || 0) < 0).length}
                </div>
                <div className="text-xs text-muted-foreground">Distributing</div>
              </div>
              <div>
                <div className="text-lg font-bold text-orange-600">
                  {displayClusters.filter(c => (c.riskScore || 0) >= 70).length}
                </div>
                <div className="text-xs text-muted-foreground">High Risk</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

interface MobileClusterCardProps {
  cluster: ClusterMetrics & { 
    trend?: string; 
    lastActive?: string; 
    alertCount?: number;
    impact?: string;
  };
  isSelected: boolean;
  onSelect: () => void;
  alerts: any[];
}

function MobileClusterCard({ cluster, isSelected, onSelect, alerts }: MobileClusterCardProps) {
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
      className={`cursor-pointer transition-all active:scale-95 ${
        isSelected ? 'ring-2 ring-primary shadow-lg' : ''
      } ${hasAlerts ? 'border-orange-200 bg-orange-50/30' : ''}`}
      onClick={onSelect}
    >
      <CardContent className="p-3">
        <div className="space-y-3">
          {/* Header Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-base">{getKindIcon(cluster.kind)}</span>
              <div className="min-w-0 flex-1">
                <h4 className="font-medium text-sm leading-tight truncate">
                  {cluster.name || 'Unknown Cluster'}
                </h4>
                <p className="text-xs text-muted-foreground">
                  {cluster.activeAddresses || 0} addresses
                </p>
              </div>
            </div>
            
            <div className="flex flex-col items-end gap-1">
              {hasAlerts && (
                <Badge variant="destructive" className="text-xs flex items-center gap-1">
                  <AlertTriangle className="w-2 h-2" />
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

          {/* Metrics Row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Value</div>
              <div className="font-semibold text-sm">
                {formatUSD(cluster.valueAbsUSD || 0)}
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">24h Flow</div>
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

          {/* Risk Score Bar */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Risk Score</span>
              <span className={`font-semibold text-xs ${getRiskColor(cluster.riskScore || 0)}`}>
                {cluster.riskScore || 0}/100
              </span>
            </div>
            <Progress 
              value={cluster.riskScore || 0} 
              className="h-1.5"
            />
          </div>

          {/* Impact Description */}
          {cluster.impact && (
            <div className="bg-muted/30 rounded p-2">
              <p className="text-xs text-muted-foreground leading-relaxed">
                {cluster.impact}
              </p>
            </div>
          )}

          {/* Share Percentage */}
          <div className="text-center py-1 bg-primary/5 rounded">
            <div className="text-sm font-bold text-primary">
              {(cluster.shareOfTotalPct || 0).toFixed(1)}%
            </div>
            <div className="text-xs text-muted-foreground">of total flow</div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="flex-1 text-xs h-7">
              <Eye className="w-3 h-3 mr-1" />
              Details
            </Button>
            <Button size="sm" variant="outline" className="flex-1 text-xs h-7">
              <Activity className="w-3 h-3 mr-1" />
              Track
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function MobileClusterSkeleton() {
  return (
    <div className="space-y-4 px-4 pb-20">
      {/* AI Digest Skeleton */}
      <Card>
        <CardContent className="p-3">
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-muted rounded w-1/3"></div>
            <div className="h-3 bg-muted rounded w-full"></div>
            <div className="h-3 bg-muted rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>

      {/* Category Tabs Skeleton */}
      <div className="flex gap-2 overflow-x-auto px-8">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-8 bg-muted rounded w-20 flex-shrink-0"></div>
        ))}
      </div>

      {/* Cluster Cards Skeleton */}
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-3">
              <div className="animate-pulse space-y-3">
                <div className="flex justify-between">
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                  <div className="h-4 bg-muted rounded w-1/4"></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="h-8 bg-muted rounded"></div>
                  <div className="h-8 bg-muted rounded"></div>
                </div>
                <div className="h-2 bg-muted rounded"></div>
                <div className="h-6 bg-muted rounded"></div>
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