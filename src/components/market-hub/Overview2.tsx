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
  Eye,
  Activity,
  Zap,
  BarChart3,
  PieChart,
  LineChart
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Mobile Overview - Same as Overview 1
export function MobileOverview2({ marketSummary, whaleClusters, chainRisk, loading, timeWindow }: any) {
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
            
            <div className="flex-1 overflow-y-auto pb-20">
              <ClusterDetail
                cluster={whaleClusters?.find((c: any) => c.id === selectedCluster)}
                onClose={() => setSelectedCluster(null)}
              />
            </div>
          </div>
        </div>
      )}

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

// Desktop Overview 2 - Bloomberg Terminal Style Dashboard
export function DesktopOverview2({ marketSummary, whaleClusters, chainRisk, loading, timeWindow }: any) {
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
      <div className="space-y-4">
        <div className="grid grid-cols-6 gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-16 bg-muted/20 rounded animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-24 bg-muted/20 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Market Overview KPIs - Same as Overview 1 */}
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
          <MetricCard2 
            icon={<TrendingUp className="w-4 h-4" />}
            label="Market Sentiment"
            value="65.49"
            change={0.2}
            color="emerald"
          />
          <MetricCard2 
            icon={<DollarSign className="w-4 h-4" />}
            label="24h Volume"
            value="$45.2B"
            change={2.7}
            color="blue"
          />
          <MetricCard2 
            icon={<Users className="w-4 h-4" />}
            label="Active Whales"
            value="5"
            change={0.2}
            color="purple"
          />
          <MetricCard2 
            icon={<Shield className="w-4 h-4" />}
            label="Risk Index"
            value="2.4/10"
            change={-0.3}
            color="amber"
          />
        </div>
      </div>

      {/* Whale Clusters Section - Full Width */}
      <div>
        <DashboardPanel 
          title="Active Whale Clusters"
          subtitle={`${whaleClusters?.length || 5} clusters detected`}
          icon={<Fish className="w-4 h-4" />}
          action={
            <Button size="sm" variant="outline" onClick={() => navigate('/alerts')}>
              <Bell className="w-3 h-3 mr-1" />
              Alerts
            </Button>
          }
        >
          {!whaleClusters?.length ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground">
              <div className="text-center">
                <Fish className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No active clusters</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {whaleClusters.map((cluster: any) => (
                <CompactClusterCard
                  key={cluster.id}
                  cluster={cluster}
                  isSelected={selectedCluster === cluster.id}
                  onSelect={() => setSelectedCluster(selectedCluster === cluster.id ? null : cluster.id)}
                />
              ))}
            </div>
          )}
        </DashboardPanel>
      </div>

      {/* Secondary Grid - Chain Risk and AI Digest */}
      <div className="grid grid-cols-2 gap-4">
        {/* Chain Risk Matrix */}
        <div>
          <DashboardPanel 
            title="Chain Risk Matrix"
            subtitle="Security assessment"
            icon={<Shield className="w-4 h-4" />}
            badge={timeWindow}
          >
            <div className="h-48">
              <ChainRiskHeatmap data={chainRisk} timeWindow={timeWindow} compact />
            </div>
          </DashboardPanel>
        </div>

        {/* Intelligence Digest */}
        <div>
          <DashboardPanel 
            title="AI Intelligence Digest"
            subtitle="Market insights"
            icon={<BarChart3 className="w-4 h-4" />}
          >
            <div className="h-48 overflow-y-auto">
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
                compact
              />
            </div>
          </DashboardPanel>
        </div>
      </div>

      {/* Additional Analytics Grid */}
      <div className="grid grid-cols-3 gap-4">
        {/* Market Analytics */}
        <div>
          <DashboardPanel 
            title="Market Analytics"
            subtitle="Performance metrics"
            icon={<LineChart className="w-4 h-4" />}
          >
            <div className="space-y-3">
              <AnalyticsCard 
                label="Transaction Volume"
                value="$2.4B"
                change={12.5}
                trend="up"
              />
              <AnalyticsCard 
                label="Network Activity"
                value="89.2%"
                change={-2.1}
                trend="down"
              />
            </div>
          </DashboardPanel>
        </div>

        {/* Performance Metrics */}
        <div>
          <DashboardPanel 
            title="System Performance"
            subtitle="Resource usage"
            icon={<Activity className="w-4 h-4" />}
          >
            <div className="space-y-3">
              <MetricBar label="CPU Usage" value={67} color="blue" />
              <MetricBar label="Memory" value={45} color="emerald" />
              <MetricBar label="Network" value={89} color="amber" />
            </div>
          </DashboardPanel>
        </div>

        {/* Quick Actions */}
        <div>
          <DashboardPanel 
            title="Quick Actions"
            subtitle="Common tasks"
            icon={<Zap className="w-4 h-4" />}
          >
            <div className="space-y-2">
              <Button size="sm" variant="outline" className="w-full justify-start">
                <Bell className="w-3 h-3 mr-2" />
                Create Alert
              </Button>
              <Button size="sm" variant="outline" className="w-full justify-start">
                <Eye className="w-3 h-3 mr-2" />
                View Reports
              </Button>
              <Button size="sm" variant="outline" className="w-full justify-start">
                <Users className="w-3 h-3 mr-2" />
                Manage Whales
              </Button>
            </div>
          </DashboardPanel>
        </div>
      </div>

      {/* Expanded Cluster Details */}
      {selectedCluster && (
        <div className="mt-4">
          <DashboardPanel 
            title="Cluster Analysis"
            subtitle={whaleClusters?.find((c: any) => c.id === selectedCluster)?.name || 'Detailed View'}
            icon={<PieChart className="w-4 h-4" />}
            action={
              <Button size="sm" variant="ghost" onClick={() => setSelectedCluster(null)}>
                ×
              </Button>
            }
          >
            <ClusterDetail
              cluster={whaleClusters?.find((c: any) => c.id === selectedCluster)}
              onClose={() => setSelectedCluster(null)}
              compact
            />
          </DashboardPanel>
        </div>
      )}
    </div>
  );
}

// Executive KPI Component
function ExecutiveKPI({ icon, label, value, change, color }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  change: number | null;
  color: 'emerald' | 'blue' | 'purple' | 'amber' | 'cyan' | 'orange';
}) {
  const colors = {
    emerald: 'border-emerald-500 bg-emerald-50 text-emerald-700',
    blue: 'border-blue-500 bg-blue-50 text-blue-700',
    purple: 'border-purple-500 bg-purple-50 text-purple-700',
    amber: 'border-amber-500 bg-amber-50 text-amber-700',
    cyan: 'border-cyan-500 bg-cyan-50 text-cyan-700',
    orange: 'border-orange-500 bg-orange-50 text-orange-700'
  };

  return (
    <Card className={`border-l-4 ${colors[color]} hover:shadow-md transition-all`}>
      <CardContent className="p-3">
        <div className="flex items-center justify-between mb-1">
          {icon}
          {change !== null && (
            <span className={`text-xs font-medium ${change >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {change >= 0 ? '+' : ''}{change.toFixed(1)}%
            </span>
          )}
        </div>
        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {label}
        </div>
        <div className="text-lg font-bold">
          {value}
        </div>
      </CardContent>
    </Card>
  );
}

// Dashboard Panel Component
function DashboardPanel({ title, subtitle, icon, badge, action, children }: {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  badge?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Card className="h-full">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {icon}
            <div>
              <h3 className="font-semibold text-sm">{title}</h3>
              {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {badge && <Badge variant="outline" className="text-xs">{badge}</Badge>}
            {action}
          </div>
        </div>
        {children}
      </CardContent>
    </Card>
  );
}

// Compact Cluster Card
function CompactClusterCard({ cluster, isSelected, onSelect }: {
  cluster: any;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <div 
      className={`p-2 rounded border cursor-pointer transition-all ${
        isSelected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
      }`}
      onClick={onSelect}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            {cluster.type || 'Whale'}
          </Badge>
          <span className="text-sm font-medium">{cluster.name}</span>
        </div>
        <span className="text-xs text-muted-foreground">
          ${(cluster.totalValue / 1000000).toFixed(1)}M
        </span>
      </div>
    </div>
  );
}

// Analytics Card
function AnalyticsCard({ label, value, change, trend }: {
  label: string;
  value: string;
  change: number;
  trend: 'up' | 'down';
}) {
  return (
    <div className="p-3 border rounded">
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <div className="flex items-center justify-between">
        <span className="text-lg font-bold">{value}</span>
        <div className={`flex items-center gap-1 text-xs ${
          trend === 'up' ? 'text-emerald-600' : 'text-red-600'
        }`}>
          {trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {change.toFixed(1)}%
        </div>
      </div>
    </div>
  );
}

// Metric Bar
function MetricBar({ label, value, color }: {
  label: string;
  value: number;
  color: 'blue' | 'emerald' | 'amber';
}) {
  const colors = {
    blue: 'bg-blue-500',
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500'
  };

  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="w-full bg-muted rounded-full h-1.5">
        <div 
          className={`h-1.5 rounded-full ${colors[color]}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

// Desktop Metric Card - Same as Overview 1
function MetricCard2({ icon, label, value, change, color }: {
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

// Mobile Metric Card (reused from Overview 1)
function MetricCard({ icon, label, value, change, color }: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  change: number | null;
  color: 'primary' | 'emerald' | 'sky' | 'amber';
}) {
  const colorClasses = {
    primary: { bg: 'bg-primary/10', text: 'text-primary', accent: 'bg-primary' },
    emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-600', accent: 'bg-emerald-500' },
    sky: { bg: 'bg-sky-500/10', text: 'text-sky-600', accent: 'bg-sky-500' },
    amber: { bg: 'bg-amber-500/10', text: 'text-amber-600', accent: 'bg-amber-500' }
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