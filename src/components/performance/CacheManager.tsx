import { useState, useEffect } from 'react';
import { Database, Trash2, RefreshCw, BarChart3 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { globalCache } from '@/hooks/useCache';

export function CacheManager() {
  const [cacheStats, setCacheStats] = useState({
    size: 0,
    maxSize: 0,
    keys: [] as string[]
  });

  const updateStats = () => {
    setCacheStats(globalCache.getStats());
  };

  useEffect(() => {
    updateStats();
    const interval = setInterval(updateStats, 30000); // Reduced frequency to 30 seconds
    return () => clearInterval(interval);
  }, []);

  const clearCache = () => {
    globalCache.clear();
    updateStats();
  };

  const cacheUsagePercent = (cacheStats.size / cacheStats.maxSize) * 100;

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Database className="h-4 w-4" />
          <h4 className="font-medium">Cache Manager</h4>
          <Badge variant="outline" className="text-xs">
            {cacheStats.size}/{cacheStats.maxSize}
          </Badge>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={updateStats}>
            <RefreshCw className="h-3 w-3" />
          </Button>
          <Button size="sm" variant="outline" onClick={clearCache}>
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {/* Cache Usage */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span>Cache Usage</span>
            <span>{cacheUsagePercent.toFixed(1)}%</span>
          </div>
          <Progress value={cacheUsagePercent} className="h-2" />
        </div>

        {/* Cache Statistics */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Entries:</span>
            <span className="font-medium">{cacheStats.size}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Max Size:</span>
            <span className="font-medium">{cacheStats.maxSize}</span>
          </div>
        </div>

        {/* Recent Cache Keys */}
        {cacheStats.keys.length > 0 && (
          <div>
            <div className="text-sm font-medium mb-2">Recent Entries</div>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {cacheStats.keys.slice(0, 5).map((key, index) => (
                <div key={index} className="text-xs font-mono bg-muted/50 p-2 rounded">
                  {key.replace('cache_', '')}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Cache Health */}
        <div className="flex items-center gap-2 text-sm">
          <BarChart3 className="h-3 w-3 text-green-600" />
          <span className="text-green-600">
            {cacheUsagePercent < 80 ? 'Healthy' : cacheUsagePercent < 95 ? 'Warning' : 'Critical'}
          </span>
        </div>
      </div>
    </Card>
  );
}