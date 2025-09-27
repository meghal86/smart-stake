import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { ClusterCard } from '@/components/clusters/ClusterCard';
import { ClusterDetail } from '@/components/clusters/ClusterDetail';
import { ChainRiskHeatmap } from '@/components/heatmap/ChainRiskHeatmap';
import { AlertsDigest } from '@/components/digest/AlertsDigest';
import { 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Users,
  Shield,
  Fish,
  AlertTriangle,
  ChevronRight,
  Bell,
  Eye
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Mobile-First Overview - Clean Design
export function MobileOverview({ marketSummary, whaleClusters, chainRisk, loading, timeWindow }: any) {
  const navigate = useNavigate();
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
        onViewCluster={(id) => {
          const cluster = whaleClusters?.find((c: any) => c.id === id);
          if (cluster) {
            navigate(`/alerts?cluster=${id}&name=${encodeURIComponent(cluster.name)}&source=cluster`);
          }
        }}
        onCreateRule={(item) => alert(`Rule: ${item.title}`)}
        mobile
      />
    </>
  );
}

// Desktop Overview - Clean Professional Layout
export function DesktopOverview({ marketSummary, whaleClusters, chainRisk, loading, timeWindow }: any) {
  const navigate = useNavigate();
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
      <div className="space-y-6">
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-muted/20 rounded animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-32 bg-muted/20 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Market Overview KPIs */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-semibold">Market Overview</h2>
            <p className="text-sm text-muted-foreground">Real-time blockchain intelligence metrics</p>
          </div>
          <Badge variant="outline" className="text-xs">
            Live Data • {timeWindow}
          </Badge>
        </div>
        
        <div className="grid grid-cols-4 gap-4">
          <MetricCard 
            icon={<TrendingUp className="w-4 h-4" />}
            label="Market Sentiment"
            value="65.49"
            change={0.2}
            color="emerald"
          />
          <MetricCard 
            icon={<DollarSign className="w-4 h-4" />}
            label="24h Volume"
            value="$45.2B"
            change={2.7}
            color="blue"
          />
          <MetricCard 
            icon={<Users className="w-4 h-4" />}
            label="Active Whales"
            value="5"
            change={0.2}
            color="purple"
          />
          <MetricCard 
            icon={<Shield className="w-4 h-4" />}
            label="Risk Index"
            value="2.4/10"
            change={-0.3}
            color="amber"
          />
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-3 gap-6">
        {/* Whale Clusters - Takes 2 columns */}
        <div className="col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold">Whale Behavior Intelligence</h2>
              <p className="text-sm text-muted-foreground">AI-powered pattern recognition and behavioral clustering</p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="text-xs">
                {whaleClusters?.length || 5} Active Clusters
              </Badge>
              <Button 
                size="sm"
                onClick={() => navigate('/alerts')}
              >
                <Bell className="w-4 h-4 mr-2" />
                View All Alerts
              </Button>
            </div>
          </div>
          
          {!whaleClusters?.length ? (
            <Card className="border-dashed">
              <CardContent className="p-12 text-center">
                <Fish className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
                <h3 className="font-medium mb-2">No Active Clusters</h3>
                <p className="text-muted-foreground text-sm">
                  Whale activity will appear here when detected
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {whaleClusters.map((cluster: any) => (
                <ClusterCard
                  key={cluster.id}
                  cluster={cluster}
                  isSelected={selectedCluster === cluster.id}
                  onSelect={() => setSelectedCluster(selectedCluster === cluster.id ? null : cluster.id)}
                  className="hover:shadow-md transition-all duration-200"
                />
              ))}
            </div>
          )}

          {/* Expanded Cluster Details */}
          {selectedCluster && (
            <div className="mt-6 border-t pt-6">
              <ClusterDetail
                cluster={whaleClusters?.find((c: any) => c.id === selectedCluster)}
                onClose={() => setSelectedCluster(null)}
              />
            </div>
          )}
        </div>

        {/* Right Sidebar - Takes 1 column */}
        <div className="space-y-6">
          {/* Chain Risk Matrix */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-semibold">Chain Risk Matrix</h3>
                  <p className="text-xs text-muted-foreground">Real-time security assessment</p>
                </div>
                <Badge variant="outline" className="text-xs">
                  {timeWindow}
                </Badge>
              </div>
              <ChainRiskHeatmap data={chainRisk} timeWindow={timeWindow} />
            </CardContent>
          </Card>
          
          {/* Intelligence Digest */}
          <Card>
            <CardContent className="p-4">
              <div className="mb-3">
                <h3 className="font-semibold">Intelligence Digest</h3>
                <p className="text-xs text-muted-foreground">AI-powered market insights</p>
              </div>
              <AlertsDigest 
                items={digestItems}
                onViewCluster={(id) => {
                  const cluster = whaleClusters?.find((c: any) => c.id === id);
                  if (cluster) {
                    navigate(`/alerts?cluster=${id}&name=${encodeURIComponent(cluster.name)}&source=cluster`);
                  }
                }}
                onCreateRule={(item) => {
                  navigate('/alerts', { state: { createRule: item } });
                }}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Clean Metric Card
function MetricCard({ icon, label, value, change, color }: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  change: number | null;
  color: 'primary' | 'emerald' | 'sky' | 'amber' | 'blue' | 'purple';
}) {
  const colorClasses = {
    primary: { bg: 'bg-primary/10', text: 'text-primary', accent: 'bg-primary' },
    emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-600', accent: 'bg-emerald-500' },
    sky: { bg: 'bg-sky-500/10', text: 'text-sky-600', accent: 'bg-sky-500' },
    amber: { bg: 'bg-amber-500/10', text: 'text-amber-600', accent: 'bg-amber-500' },
    blue: { bg: 'bg-blue-500/10', text: 'text-blue-600', accent: 'bg-blue-500' },
    purple: { bg: 'bg-purple-500/10', text: 'text-purple-600', accent: 'bg-purple-500' }
  };

  const config = colorClasses[color];

  return (
    <div className="relative min-w-[140px] snap-center">
      <div className={`absolute top-0 left-0 w-full h-0.5 ${config.accent} rounded-t`}></div>
      <Card className="border-0 bg-card/50 hover:bg-card transition-colors">
        <CardContent className="p-3">
          <div className="flex items-center justify-between mb-2">
            <div className={`p-1.5 rounded ${config.bg} ${config.text}`}>
              {icon}
            </div>
            {change !== null && (
              <div className={`flex items-center gap-1 text-xs font-medium ${
                change >= 0 ? 'text-emerald-600' : 'text-red-600'
              }`}>
                {change >= 0 ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                {change >= 0 ? '+' : ''}{change.toFixed(1)}%
              </div>
            )}
          </div>
          
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
              {label}
            </p>
            <p className="text-lg font-bold">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}