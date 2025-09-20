import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Target, Zap, Activity } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface MetricsSummary {
  accuracy_7d: string;
  accuracy_30d: string;
  accuracy_90d: string;
  avg_confidence: string;
  runs_today: number;
  last_updated: string;
}

export function ScenariosMetricsHeader() {
  const [metrics, setMetrics] = useState<MetricsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('metrics-scenarios-summary');
      
      if (error) throw error;
      setMetrics(data);
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
      // Fallback data
      setMetrics({
        accuracy_7d: '0.0',
        accuracy_30d: '0.0',
        accuracy_90d: '0.0',
        avg_confidence: '0.0',
        runs_today: 0,
        last_updated: new Date().toISOString()
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="p-4 mb-6">
        <div className="flex items-center gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-4 h-4 bg-muted rounded animate-pulse"></div>
              <div className="w-16 h-4 bg-muted rounded animate-pulse"></div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (!metrics) {
    return (
      <Card className="p-4 mb-6 bg-yellow-50 border-yellow-200">
        <div className="text-sm text-yellow-800">
          Metrics unavailable - check back later
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-green-600" />
            <div className="text-sm">
              <span className="text-muted-foreground">Accuracy:</span>
              <span className="ml-1 font-medium">
                {metrics.accuracy_7d}% / {metrics.accuracy_30d}% / {metrics.accuracy_90d}%
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-blue-600" />
            <div className="text-sm">
              <span className="text-muted-foreground">Avg Confidence:</span>
              <span className="ml-1 font-medium">{metrics.avg_confidence}%</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-purple-600" />
            <div className="text-sm">
              <span className="text-muted-foreground">Runs Today:</span>
              <span className="ml-1 font-medium">{metrics.runs_today}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            <Zap className="h-3 w-3 mr-1" />
            Live
          </Badge>
          <div className="text-xs text-muted-foreground">
            Updated {new Date(metrics.last_updated).toLocaleTimeString()}
          </div>
        </div>
      </div>
    </Card>
  );
}