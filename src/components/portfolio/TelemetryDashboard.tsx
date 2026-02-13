/**
 * V2 Telemetry Dashboard Component
 * 
 * Displays comprehensive telemetry metrics:
 * - MTTS (Mean Time To Safety)
 * - Prevented Loss (p50/p95)
 * - Fix Rate and False Positive Rate
 * - Action Funnel Analytics
 * 
 * Requirements: 16.3, 16.4, 16.5
 */

'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Clock, 
  DollarSign, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown,
  Activity,
  Shield
} from 'lucide-react';
import { telemetryAnalytics, type TelemetryStats } from '@/lib/portfolio/telemetry/TelemetryAnalytics';

interface TelemetryDashboardProps {
  userId?: string;
  timeRangeDays?: number;
}

export const TelemetryDashboard = ({ userId, timeRangeDays = 30 }: TelemetryDashboardProps) => {
  const [stats, setStats] = useState<TelemetryStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
  }, [userId, timeRangeDays]);

  const loadStats = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await telemetryAnalytics.getComprehensiveStats(userId, timeRangeDays);
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load telemetry stats');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <TelemetryDashboardSkeleton />;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Portfolio Telemetry Dashboard</h2>
          <p className="text-muted-foreground">
            Advanced metrics for the last {timeRangeDays} days
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          V2 Analytics
        </Badge>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Mean Time To Safety"
          value={formatDuration(stats.mtts.overall)}
          description="Average time to resolve critical issues"
          icon={Clock}
          trend={stats.mtts.overall < 3600000 ? 'positive' : 'negative'}
        />
        <MetricCard
          title="Prevented Loss (p95)"
          value={formatCurrency(stats.preventedLoss.p95)}
          description="95th percentile prevented loss"
          icon={DollarSign}
          trend="positive"
        />
        <MetricCard
          title="Fix Rate"
          value={`${stats.fixRate.overall.toFixed(1)}%`}
          description="Actions completed by users"
          icon={CheckCircle2}
          trend={stats.fixRate.overall > 70 ? 'positive' : 'negative'}
        />
        <MetricCard
          title="False Positive Rate"
          value={`${stats.falsePositiveRate.overall.toFixed(1)}%`}
          description="Critical alerts dismissed"
          icon={AlertTriangle}
          trend={stats.falsePositiveRate.overall < 5 ? 'positive' : 'negative'}
        />
      </div>

      {/* Detailed Metrics Tabs */}
      <Tabs defaultValue="mtts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="mtts">MTTS</TabsTrigger>
          <TabsTrigger value="prevented-loss">Prevented Loss</TabsTrigger>
          <TabsTrigger value="fix-rate">Fix Rate</TabsTrigger>
          <TabsTrigger value="false-positives">False Positives</TabsTrigger>
          <TabsTrigger value="funnel">Action Funnel</TabsTrigger>
        </TabsList>

        <TabsContent value="mtts" className="space-y-4">
          <MTTSBreakdown mtts={stats.mtts} />
        </TabsContent>

        <TabsContent value="prevented-loss" className="space-y-4">
          <PreventedLossBreakdown preventedLoss={stats.preventedLoss} />
        </TabsContent>

        <TabsContent value="fix-rate" className="space-y-4">
          <FixRateBreakdown fixRate={stats.fixRate} />
        </TabsContent>

        <TabsContent value="false-positives" className="space-y-4">
          <FalsePositiveBreakdown falsePositiveRate={stats.falsePositiveRate} />
        </TabsContent>

        <TabsContent value="funnel" className="space-y-4">
          <ActionFunnelBreakdown actionFunnel={stats.actionFunnel} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Metric Card Component
interface MetricCardProps {
  title: string;
  value: string;
  description: string;
  icon: React.ElementType;
  trend?: 'positive' | 'negative' | 'neutral';
}

const MetricCard = ({ title, value, description, icon: Icon, trend = 'neutral' }: MetricCardProps) => {
  const trendIcon = trend === 'positive' ? TrendingUp : trend === 'negative' ? TrendingDown : Activity;
  const trendColor = trend === 'positive' ? 'text-green-500' : trend === 'negative' ? 'text-red-500' : 'text-gray-500';
  const TrendIcon = trendIcon;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline space-x-2">
          <div className="text-2xl font-bold">{value}</div>
          <TrendIcon className={`h-4 w-4 ${trendColor}`} />
        </div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  );
};

// MTTS Breakdown Component
const MTTSBreakdown = ({ mtts }: { mtts: TelemetryStats['mtts'] }) => (
  <div className="grid gap-4 md:grid-cols-2">
    <Card>
      <CardHeader>
        <CardTitle>MTTS by Severity</CardTitle>
        <CardDescription>Average resolution time by issue severity</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {Object.entries(mtts.bySeverity).map(([severity, time]) => (
          <div key={severity} className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Badge variant={severity === 'critical' ? 'destructive' : 'outline'}>
                {severity}
              </Badge>
            </div>
            <span className="font-mono text-sm">{formatDuration(time)}</span>
          </div>
        ))}
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>MTTS by Issue Type</CardTitle>
        <CardDescription>Average resolution time by issue category</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {Object.entries(mtts.byIssueType).map(([type, time]) => (
          <div key={type} className="flex items-center justify-between">
            <span className="text-sm capitalize">{type.replace(/_/g, ' ')}</span>
            <span className="font-mono text-sm">{formatDuration(time)}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  </div>
);

// Prevented Loss Breakdown Component
const PreventedLossBreakdown = ({ preventedLoss }: { preventedLoss: TelemetryStats['preventedLoss'] }) => (
  <div className="grid gap-4 md:grid-cols-2">
    <Card>
      <CardHeader>
        <CardTitle>Prevented Loss Distribution</CardTitle>
        <CardDescription>Statistical distribution of prevented losses</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm">Median (p50)</span>
          <span className="font-mono text-lg font-bold">{formatCurrency(preventedLoss.p50)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm">95th Percentile (p95)</span>
          <span className="font-mono text-lg font-bold">{formatCurrency(preventedLoss.p95)}</span>
        </div>
        <div className="flex items-center justify-between border-t pt-3">
          <span className="text-sm font-semibold">Total Prevented</span>
          <span className="font-mono text-xl font-bold text-green-600">
            {formatCurrency(preventedLoss.total)}
          </span>
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>By Action Type</CardTitle>
        <CardDescription>Prevented loss breakdown by action category</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {Object.entries(preventedLoss.byActionType).map(([type, stats]) => (
          <div key={type} className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-sm capitalize">{type.replace(/_/g, ' ')}</span>
              <span className="font-mono text-sm font-bold">{formatCurrency(stats.total)}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>p50: {formatCurrency(stats.p50)}</span>
              <span>p95: {formatCurrency(stats.p95)}</span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  </div>
);

// Fix Rate Breakdown Component
const FixRateBreakdown = ({ fixRate }: { fixRate: TelemetryStats['fixRate'] }) => (
  <div className="grid gap-4 md:grid-cols-2">
    <Card>
      <CardHeader>
        <CardTitle>Fix Rate by Severity</CardTitle>
        <CardDescription>Completion rate by issue severity</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {Object.entries(fixRate.bySeverity).map(([severity, rate]) => (
          <div key={severity} className="space-y-1">
            <div className="flex items-center justify-between">
              <Badge variant={severity === 'critical' ? 'destructive' : 'outline'}>
                {severity}
              </Badge>
              <span className="font-mono text-sm font-bold">{rate.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${rate > 70 ? 'bg-green-500' : rate > 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
                style={{ width: `${rate}%` }}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>Fix Rate by Action Type</CardTitle>
        <CardDescription>Completion rate by action category</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {Object.entries(fixRate.byActionType).map(([type, rate]) => (
          <div key={type} className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-sm capitalize">{type.replace(/_/g, ' ')}</span>
              <span className="font-mono text-sm font-bold">{rate.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${rate > 70 ? 'bg-green-500' : rate > 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
                style={{ width: `${rate}%` }}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  </div>
);

// False Positive Breakdown Component
const FalsePositiveBreakdown = ({ falsePositiveRate }: { falsePositiveRate: TelemetryStats['falsePositiveRate'] }) => (
  <div className="grid gap-4 md:grid-cols-2">
    <Card>
      <CardHeader>
        <CardTitle>FP Rate by Severity</CardTitle>
        <CardDescription>False positive rate by issue severity</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {Object.entries(falsePositiveRate.bySeverity).map(([severity, rate]) => (
          <div key={severity} className="space-y-1">
            <div className="flex items-center justify-between">
              <Badge variant={severity === 'critical' ? 'destructive' : 'outline'}>
                {severity}
              </Badge>
              <span className="font-mono text-sm font-bold">{rate.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${rate < 5 ? 'bg-green-500' : rate < 10 ? 'bg-yellow-500' : 'bg-red-500'}`}
                style={{ width: `${Math.min(rate, 100)}%` }}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>FP Rate by Issue Type</CardTitle>
        <CardDescription>False positive rate by issue category</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {Object.entries(falsePositiveRate.byIssueType).map(([type, rate]) => (
          <div key={type} className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-sm capitalize">{type.replace(/_/g, ' ')}</span>
              <span className="font-mono text-sm font-bold">{rate.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${rate < 5 ? 'bg-green-500' : rate < 10 ? 'bg-yellow-500' : 'bg-red-500'}`}
                style={{ width: `${Math.min(rate, 100)}%` }}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  </div>
);

// Action Funnel Breakdown Component
const ActionFunnelBreakdown = ({ actionFunnel }: { actionFunnel: TelemetryStats['actionFunnel'] }) => (
  <div className="grid gap-4">
    <Card>
      <CardHeader>
        <CardTitle>Action Execution Funnel</CardTitle>
        <CardDescription>User progression through action flow</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {Object.entries(actionFunnel.stages).map(([stage, count]) => (
          <div key={stage} className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-sm capitalize">{stage.replace(/_/g, ' ')}</span>
              <span className="font-mono text-sm font-bold">{count}</span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>Conversion Rates</CardTitle>
        <CardDescription>Stage-to-stage conversion percentages</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {Object.entries(actionFunnel.conversionRates).map(([transition, rate]) => (
          <div key={transition} className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-sm">{transition.replace(/_/g, ' → ')}</span>
              <span className="font-mono text-sm font-bold">{rate.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${rate > 80 ? 'bg-green-500' : rate > 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                style={{ width: `${rate}%` }}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>

    {actionFunnel.dropoffPoints.length > 0 && (
      <Card>
        <CardHeader>
          <CardTitle>Significant Drop-off Points</CardTitle>
          <CardDescription>Stages with &gt;20% drop-off rate</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {actionFunnel.dropoffPoints.map((dropoff, idx) => (
            <Alert key={idx} variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>{dropoff.rate.toFixed(1)}%</strong> drop-off from{' '}
                <strong>{dropoff.from.replace(/_/g, ' ')}</strong> to{' '}
                <strong>{dropoff.to.replace(/_/g, ' ')}</strong>
              </AlertDescription>
            </Alert>
          ))}
        </CardContent>
      </Card>
    )}
  </div>
);

// Loading Skeleton
const TelemetryDashboardSkeleton = () => (
  <div className="space-y-6">
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <Card key={i}>
          <CardHeader className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-32" />
          </CardHeader>
        </Card>
      ))}
    </div>
    <Skeleton className="h-96 w-full" />
  </div>
);

// Utility Functions
const formatDuration = (ms: number): string => {
  if (ms === 0) return '—';
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
};

const formatCurrency = (value: number): string => {
  if (value === 0) return '$0';
  if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(2)}K`;
  return `$${value.toFixed(2)}`;
};
