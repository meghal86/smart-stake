import { useState, useEffect } from 'react';
import { Package, Zap, AlertTriangle, CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface BundleMetrics {
  totalSize: number;
  gzippedSize: number;
  loadTime: number;
  chunks: Array<{
    name: string;
    size: number;
    loaded: boolean;
  }>;
}

export function BundleAnalyzer() {
  const [metrics, setMetrics] = useState<BundleMetrics>({
    totalSize: 0,
    gzippedSize: 0,
    loadTime: 0,
    chunks: []
  });

  const [performanceScore, setPerformanceScore] = useState(0);

  useEffect(() => {
    // Simulate bundle analysis - replace with real metrics
    const simulateMetrics = () => {
      const chunks = [
        { name: 'main', size: 245000, loaded: true },
        { name: 'vendor', size: 180000, loaded: true },
        { name: 'charts', size: 95000, loaded: false },
        { name: 'reports', size: 67000, loaded: false },
        { name: 'defi', size: 43000, loaded: false }
      ];

      const totalSize = chunks.reduce((sum, chunk) => sum + chunk.size, 0);
      const loadedSize = chunks.filter(c => c.loaded).reduce((sum, chunk) => sum + chunk.size, 0);
      
      setMetrics({
        totalSize,
        gzippedSize: Math.floor(totalSize * 0.3),
        loadTime: performance.now(),
        chunks
      });

      // Calculate performance score
      const score = Math.max(0, 100 - (loadedSize / 1000000) * 50);
      setPerformanceScore(score);
    };

    simulateMetrics();
  }, []);

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 90) return CheckCircle;
    if (score >= 70) return AlertTriangle;
    return AlertTriangle;
  };

  const formatBytes = (bytes: number) => {
    return `${(bytes / 1024).toFixed(1)} KB`;
  };

  const ScoreIcon = getScoreIcon(performanceScore);

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <Package className="h-4 w-4" />
        <h4 className="font-medium">Bundle Analysis</h4>
        <Badge variant="outline" className="text-xs">
          Live
        </Badge>
      </div>

      <div className="space-y-4">
        {/* Performance Score */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ScoreIcon className={`h-4 w-4 ${getScoreColor(performanceScore)}`} />
            <span className="text-sm">Performance Score</span>
          </div>
          <span className={`font-bold ${getScoreColor(performanceScore)}`}>
            {performanceScore.toFixed(0)}/100
          </span>
        </div>

        {/* Bundle Sizes */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Total Size:</span>
            <div className="font-medium">{formatBytes(metrics.totalSize)}</div>
          </div>
          <div>
            <span className="text-muted-foreground">Gzipped:</span>
            <div className="font-medium">{formatBytes(metrics.gzippedSize)}</div>
          </div>
        </div>

        {/* Load Time */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Load Time:</span>
          <span className="font-medium">{metrics.loadTime.toFixed(0)}ms</span>
        </div>

        {/* Chunk Analysis */}
        <div>
          <div className="text-sm font-medium mb-2">Chunks</div>
          <div className="space-y-2">
            {metrics.chunks.map((chunk, index) => (
              <div key={index} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    chunk.loaded ? 'bg-green-500' : 'bg-gray-300'
                  }`} />
                  <span className="font-mono">{chunk.name}</span>
                </div>
                <span className="text-muted-foreground">
                  {formatBytes(chunk.size)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Optimization Suggestions */}
        <div className="pt-2 border-t">
          <div className="text-sm font-medium mb-2">Suggestions</div>
          <div className="space-y-1 text-xs text-muted-foreground">
            {performanceScore < 90 && (
              <>
                <div>• Enable code splitting for better performance</div>
                <div>• Lazy load non-critical components</div>
                <div>• Optimize bundle size with tree shaking</div>
              </>
            )}
            {performanceScore >= 90 && (
              <div className="text-green-600">✓ Bundle is well optimized</div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}