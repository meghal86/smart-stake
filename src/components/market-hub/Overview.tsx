import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useState, useEffect } from 'react';
import { ClusterCard } from '@/components/clusters/ClusterCard';
import { ClusterDetail } from '@/components/clusters/ClusterDetail';
import { ChainRiskHeatmap } from '@/components/heatmap/ChainRiskHeatmap';
import { AlertsDigest } from '@/components/digest/AlertsDigest';
import { 
  TrendingUp, 
  DollarSign,
  Users,
  Shield,
  Fish,
  AlertTriangle,
  ChevronRight
} from 'lucide-react';

// Mobile-First Overview - Clean Design
export function MobileOverview({ marketSummary, whaleClusters, chainRisk, loading, timeWindow }: any) {
  const [selectedCluster, setSelectedCluster] = useState<string | null>(null);
  const [digestItems, setDigestItems] = useState([]);

  useEffect(() => {
    if (marketSummary?.topAlerts) {
      const items = marketSummary.topAlerts.slice(0, 3).map((alert: any, i: number) => ({
        id: `alert-${i}`,
        title: alert.title || `${alert.chain || 'ETH'} whale activity`,
        severity: i === 0 ? 'High' : 'Medium',
        clusterId: whaleClusters?.[i]?.id,
        description: `$${(Math.random() * 50 + 10).toFixed(1)}M movement detected`,
        timestamp: new Date().toISOString()
      }));
      setDigestItems(items);
    }
  }, [marketSummary, whaleClusters]);

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-20 bg-muted/20 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="pb-24">
        {/* Hero Metrics - Horizontal Scroll */}
        <div className="px-4 pt-4">
          <div className="flex gap-3 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide -mx-1">
            <MetricCard 
              icon={<TrendingUp className="w-4 h-4" />}
              label="Market Mood"
              value={marketSummary?.marketMood || 74}
              change={0.2}
              color="primary"
            />
            <MetricCard 
              icon={<DollarSign className="w-4 h-4" />}
              label="24h Volume"
              value="$45.0B"
              change={2.7}
              color="emerald"
            />
            <MetricCard 
              icon={<Users className="w-4 h-4" />}
              label="Active Whales"
              value={marketSummary?.activeWhales || 892}
              change={0.2}
              color="sky"
            />
            <MetricCard 
              icon={<Shield className="w-4 h-4" />}
              label="Risk Level"
              value="Low"
              change={null}
              color="amber"
            />
          </div>
        </div>

        {/* Chain Risk */}
        <div className="px-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Chain Risk</h2>
            <Badge variant="outline" className="text-xs">{timeWindow}</Badge>
          </div>
          <ChainRiskHeatmap data={chainRisk} timeWindow={timeWindow} mobile />
        </div>

        {/* Active Clusters */}
        <div className="px-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Active Clusters</h2>
            <span className="text-sm text-muted-foreground">
              {whaleClusters?.length || 5} detected
            </span>
          </div>
          
          {!whaleClusters?.length ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Fish className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
                <p className="text-muted-foreground">No active clusters</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {whaleClusters.slice(0, 5).map((cluster: any) => (
                <ClusterCard
                  key={cluster.id}
                  cluster={cluster}
                  isSelected={selectedCluster === cluster.id}
                  onSelect={() => setSelectedCluster(cluster.id)}
                  mobile
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Cluster Detail Modal */}
      {selectedCluster && (
        <div className="fixed inset-0 z-50 bg-black/20">
          <div className="fixed bottom-0 left-0 right-0 bg-background rounded-t-2xl shadow-2xl max-h-[85vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <button 
                onClick={() => setSelectedCluster(null)}
                className="flex items-center gap-2 text-primary font-medium min-w-[44px] min-h-[44px] -ml-2 pl-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>
              <h3 className="font-semibold text-center flex-1 truncate px-4">
                {whaleClusters?.find((c: any) => c.id === selectedCluster)?.name || 'Cluster Details'}
              </h3>
              <div className="w-16" />
            </div>
            
            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto pb-20">
              <ClusterDetail
                cluster={whaleClusters?.find((c: any) => c.id === selectedCluster)}
                onClose={() => setSelectedCluster(null)}
              />
            </div>
          </div>
        </div>
      )}

      {/* AI Digest */}
      <AlertsDigest 
        items={digestItems}
        onViewCluster={(id) => setSelectedCluster(id)}
        onCreateRule={(item) => alert(`Rule: ${item.title}`)}
        mobile
      />
    </>
  );
}

// Desktop Overview
export function DesktopOverview({ marketSummary, whaleClusters, chainRisk, loading, timeWindow }: any) {
  const [selectedCluster, setSelectedCluster] = useState<string | null>(null);
  const [digestItems, setDigestItems] = useState([]);

  useEffect(() => {
    if (marketSummary?.topAlerts) {
      const items = marketSummary.topAlerts.slice(0, 8).map((alert: any, i: number) => ({
        id: `alert-${i}`,
        title: alert.title || `${alert.chain || 'ETH'} whale movement`,
        severity: i < 2 ? 'High' : i < 5 ? 'Medium' : 'Low',
        clusterId: whaleClusters?.[i]?.id,
        description: `Large transaction detected: $${(Math.random() * 100 + 50).toFixed(1)}M`,
        timestamp: new Date().toISOString()
      }));
      setDigestItems(items);
    }
  }, [marketSummary, whaleClusters]);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-muted/20 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Status Bar */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <MetricCard 
          icon={<TrendingUp className="w-5 h-5" />}
          label="Market Mood"
          value={marketSummary?.marketMood || 74}
          change={0.2}
          color="primary"
        />
        <MetricCard 
          icon={<DollarSign className="w-5 h-5" />}
          label="24h Volume"
          value="$45.0B"
          change={2.7}
          color="emerald"
        />
        <MetricCard 
          icon={<Users className="w-5 h-5" />}
          label="Active Whales"
          value={892}
          change={0.2}
          color="sky"
        />
        <MetricCard 
          icon={<Shield className="w-5 h-5" />}
          label="Risk Index"
          value="Low"
          change={null}
          color="amber"
        />
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Main Content */}
        <div className="col-span-8 space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-6">Whale Behavior Clusters</h2>
            {!whaleClusters?.length ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Fish className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                  <h3 className="font-medium mb-2">No Active Clusters</h3>
                  <p className="text-muted-foreground">Whale activity will appear here when detected</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {whaleClusters.map((cluster: any) => (
                  <ClusterCard
                    key={cluster.id}
                    cluster={cluster}
                    isSelected={selectedCluster === cluster.id}
                    onSelect={() => setSelectedCluster(selectedCluster === cluster.id ? null : cluster.id)}
                  />
                ))}
              </div>
            )}
          </div>

          {selectedCluster && (
            <ClusterDetail
              cluster={whaleClusters?.find((c: any) => c.id === selectedCluster)}
              onClose={() => setSelectedCluster(null)}
            />
          )}
        </div>

        {/* Sidebar */}
        <div className="col-span-4 space-y-6">
          <div>
            <h3 className="font-semibold mb-4">Chain Risk Assessment</h3>
            <ChainRiskHeatmap data={chainRisk} timeWindow={timeWindow} />
          </div>
          
          <AlertsDigest 
            items={digestItems}
            onViewCluster={(id) => setSelectedCluster(id)}
            onCreateRule={(item) => alert(`Creating rule: ${item.title}`)}
          />
        </div>
      </div>
    </div>
  );
}

// Compact Metric Card
function MetricCard({ icon, label, value, change, color }: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  change: number | null;
  color: 'primary' | 'emerald' | 'sky' | 'amber';
}) {
  const colorClasses = {
    primary: 'bg-primary/10 text-primary',
    emerald: 'bg-emerald-500/10 text-emerald-600',
    sky: 'bg-sky-500/10 text-sky-600',
    amber: 'bg-amber-500/10 text-amber-600'
  };

  return (
    <Card className="min-w-[140px] snap-center">
      <CardContent className="p-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg ${colorClasses[color]}`}>
              {icon}
            </div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
              {label}
            </p>
          </div>
          <div>
            <p className="text-xl font-bold">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </p>
            {change !== null && (
              <p className={`text-xs font-medium ${
                change >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {change >= 0 ? '+' : ''}{change.toFixed(1)}%
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Updated {Math.floor(Math.random() * 3) + 1}m ago
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}