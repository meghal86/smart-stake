import { useState, useEffect } from 'react';
import { Activity, Zap, Database, Wifi } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface PerformanceMetrics {
  apiResponseTime: number;
  cacheHitRate: number;
  activeConnections: number;
  memoryUsage: number;
}

export function PerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    apiResponseTime: 0,
    cacheHitRate: 0,
    activeConnections: 0,
    memoryUsage: 0
  });

  useEffect(() => {
    const updateMetrics = () => {
      // Simulate real metrics - replace with actual monitoring
      setMetrics({
        apiResponseTime: Math.random() * 500 + 100,
        cacheHitRate: Math.random() * 20 + 80,
        activeConnections: Math.floor(Math.random() * 50 + 10),
        memoryUsage: Math.random() * 30 + 40
      });
    };

    updateMetrics();
    const interval = setInterval(updateMetrics, 5000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (value: number, thresholds: { good: number; warning: number }) => {
    if (value <= thresholds.good) return 'text-green-600';
    if (value <= thresholds.warning) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="h-4 w-4" />
        <h4 className="font-medium">Performance Monitor</h4>
        <Badge variant="outline" className="text-xs">Live</Badge>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-3 w-3 text-muted-foreground" />
            <span>API Response</span>
          </div>
          <span className={getStatusColor(metrics.apiResponseTime, { good: 200, warning: 500 })}>
            {metrics.apiResponseTime.toFixed(0)}ms
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="h-3 w-3 text-muted-foreground" />
            <span>Cache Hit Rate</span>
          </div>
          <span className="text-green-600">
            {metrics.cacheHitRate.toFixed(1)}%
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wifi className="h-3 w-3 text-muted-foreground" />
            <span>Connections</span>
          </div>
          <span className="text-blue-600">
            {metrics.activeConnections}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-3 w-3 text-muted-foreground" />
            <span>Memory</span>
          </div>
          <span className={getStatusColor(metrics.memoryUsage, { good: 60, warning: 80 })}>
            {metrics.memoryUsage.toFixed(1)}%
          </span>
        </div>
      </div>
    </Card>
  );
}