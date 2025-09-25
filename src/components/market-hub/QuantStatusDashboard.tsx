import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useCoverageMonitor } from '@/hooks/useCoverageMonitor';
import { useCSVExport } from '@/hooks/useCSVExport';
import { useWatchlistAlerts } from '@/hooks/useWatchlistAlerts';
import { 
  Shield, 
  Database, 
  Zap, 
  Download, 
  Bell, 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  Clock,
  TrendingUp
} from 'lucide-react';

interface QuantStatusDashboardProps {
  timeWindow: string;
  chainRisk?: any;
  whaleClusters?: any[];
  alertsStream?: any;
}

export function QuantStatusDashboard({ 
  timeWindow, 
  chainRisk, 
  whaleClusters, 
  alertsStream 
}: QuantStatusDashboardProps) {
  const { coverage, isLoading: coverageLoading } = useCoverageMonitor(timeWindow);
  const { exportData, isExporting } = useCSVExport();
  const { alerts, isLoading: alertsLoading } = useWatchlistAlerts();

  const getImplementationStatus = () => {
    const features = [
      {
        name: 'Real Chain Risk Calculation',
        status: chainRisk?.chains?.some((c: any) => c.risk !== null) ? 'complete' : 'partial',
        description: 'Quantitative risk scoring with component breakdown'
      },
      {
        name: 'Whale Clustering',
        status: whaleClusters?.length >= 5 ? 'complete' : 'partial',
        description: '5 canonical clusters with priority classification'
      },
      {
        name: 'Alert Classification',
        status: alertsStream?.alerts?.length > 0 ? 'complete' : 'partial',
        description: 'Rule-based alert classification engine'
      },
      {
        name: 'Correlation Analysis',
        status: chainRisk?.correlationSpikes ? 'complete' : 'missing',
        description: 'Pearson correlation spike detection'
      },
      {
        name: 'Coverage Monitoring',
        status: coverage?.systemHealth ? 'complete' : 'missing',
        description: 'Data quality and system health tracking'
      },
      {
        name: 'CSV Export (Pro)',
        status: 'complete',
        description: 'Professional data export capabilities'
      },
      {
        name: 'Watchlist Alerts',
        status: 'complete',
        description: 'Custom threshold alerts for Pro users'
      },
      {
        name: 'Performance Monitoring',
        status: coverage?.apiPerformance ? 'complete' : 'partial',
        description: 'API response time and cache metrics'
      }
    ];

    const completed = features.filter(f => f.status === 'complete').length;
    const partial = features.filter(f => f.status === 'partial').length;
    const missing = features.filter(f => f.status === 'missing').length;

    return {
      features,
      completed,
      partial,
      missing,
      totalScore: Math.round((completed + partial * 0.5) / features.length * 100)
    };
  };

  const status = getImplementationStatus();

  return (
    <div className="space-y-6">
      {/* Overall Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Full Quant Market Hub Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Implementation Progress</span>
              <span className="text-sm text-muted-foreground">{status.totalScore}%</span>
            </div>
            <Progress value={status.totalScore} className="h-2" />
            
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-green-600">{status.completed}</div>
                <div className="text-xs text-muted-foreground">Complete</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-600">{status.partial}</div>
                <div className="text-xs text-muted-foreground">Partial</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">{status.missing}</div>
                <div className="text-xs text-muted-foreground">Missing</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feature Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {status.features.map((feature, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <FeatureStatusIcon status={feature.status} />
                    <span className="font-medium text-sm">{feature.name}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{feature.description}</p>
                </div>
                <Badge variant={getStatusVariant(feature.status)}>
                  {feature.status}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* System Health */}
      {coverage && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              System Health & Coverage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{coverage.systemHealth?.avgCoverage || 0}%</div>
                <div className="text-xs text-muted-foreground">Avg Coverage</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{coverage.systemHealth?.avgQuality || 0}</div>
                <div className="text-xs text-muted-foreground">Quality Score</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{coverage.apiPerformance?.p95ResponseTime || 0}ms</div>
                <div className="text-xs text-muted-foreground">P95 Response</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{coverage.apiPerformance?.cacheHitRate || 0}%</div>
                <div className="text-xs text-muted-foreground">Cache Hit Rate</div>
              </div>
            </div>
            
            {coverage.systemHealth?.chainsWithIssues > 0 && (
              <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    {coverage.systemHealth.chainsWithIssues} chains have data quality issues
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportData({ exportType: 'chain_risk', window: timeWindow })}
              disabled={isExporting}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export Risk Data
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportData({ exportType: 'whale_clusters', window: timeWindow })}
              disabled={isExporting}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export Clusters
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportData({ exportType: 'alerts', window: timeWindow })}
              disabled={isExporting}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export Alerts
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportData({ exportType: 'correlation_analysis', window: timeWindow })}
              disabled={isExporting}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export Correlation
            </Button>
          </div>
          
          <div className="mt-4 text-xs text-muted-foreground">
            {alerts?.length > 0 && (
              <div className="flex items-center gap-2">
                <Bell className="w-3 h-3" />
                <span>{alerts.length} watchlist alerts configured</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function FeatureStatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'complete':
      return <CheckCircle className="w-4 h-4 text-green-600" />;
    case 'partial':
      return <Clock className="w-4 h-4 text-yellow-600" />;
    case 'missing':
      return <XCircle className="w-4 h-4 text-red-600" />;
    default:
      return <AlertTriangle className="w-4 h-4 text-gray-600" />;
  }
}

function getStatusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case 'complete':
      return 'default';
    case 'partial':
      return 'secondary';
    case 'missing':
      return 'destructive';
    default:
      return 'outline';
  }
}