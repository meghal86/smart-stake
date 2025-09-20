import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertTriangle, CheckCircle, Clock, Database, Activity } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface SystemHealth {
  status: 'healthy' | 'degraded' | 'error';
  data_freshness: {
    delay_minutes: number | null;
    status: 'ok' | 'stale' | 'error';
  };
  model_performance: {
    accuracy_7d: number | null;
    accuracy_30d: number | null;
    drift_detected: boolean;
  };
  provider_status: Record<string, string>;
  database_health: {
    connected: boolean;
  };
  uptime_metrics: {
    uptime_percentage: number;
    avg_response_time_ms: number;
    error_rate_percentage: number;
  };
}

export function SystemHealthDashboard() {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchHealth = async () => {
    try {
      const { data } = await supabase.functions.invoke('healthz');
      setHealth(data);
    } catch (error) {
      console.error('Health check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'ok':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'degraded':
      case 'stale':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
    }
  };

  if (!health) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-32">
          <RefreshCw className="h-6 w-6 animate-spin" />
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {getStatusIcon(health.status)}
            <h2 className="text-xl font-semibold">System Health</h2>
            <Badge className={health.status === 'healthy' ? 'bg-green-500' : 'bg-yellow-500'}>
              {health.status.toUpperCase()}
            </Badge>
          </div>
          <Button variant="outline" size="sm" onClick={fetchHealth} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {health.uptime_metrics.uptime_percentage.toFixed(1)}%
            </div>
            <div className="text-sm text-muted-foreground">Uptime</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">
              {health.uptime_metrics.avg_response_time_ms}ms
            </div>
            <div className="text-sm text-muted-foreground">Response Time</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {health.uptime_metrics.error_rate_percentage.toFixed(1)}%
            </div>
            <div className="text-sm text-muted-foreground">Error Rate</div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-5 w-5" />
            <h3 className="font-semibold">Data Freshness</h3>
            {getStatusIcon(health.data_freshness.status)}
          </div>
          <div className="text-sm">
            Delay: {health.data_freshness.delay_minutes || 0} minutes
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="h-5 w-5" />
            <h3 className="font-semibold">Model Performance</h3>
            {getStatusIcon(health.model_performance.drift_detected ? 'degraded' : 'ok')}
          </div>
          <div className="space-y-1 text-sm">
            <div>7d: {health.model_performance.accuracy_7d ? `${(health.model_performance.accuracy_7d * 100).toFixed(1)}%` : 'N/A'}</div>
            <div>30d: {health.model_performance.accuracy_30d ? `${(health.model_performance.accuracy_30d * 100).toFixed(1)}%` : 'N/A'}</div>
          </div>
        </Card>
      </div>

      <Card className="p-4">
        <h3 className="font-semibold mb-3">Providers</h3>
        <div className="grid grid-cols-3 gap-4">
          {Object.entries(health.provider_status).map(([provider, status]) => (
            <div key={provider} className="flex items-center justify-between p-2 bg-muted rounded">
              <span className="capitalize">{provider}</span>
              {getStatusIcon(status)}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}