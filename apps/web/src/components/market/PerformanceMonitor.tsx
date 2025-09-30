import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Activity, Clock, Database, Zap, AlertTriangle } from 'lucide-react';

interface PerformanceMetrics {
  apiLatency: number;
  cacheHitRate: number;
  dataAge: number;
  errorRate: number;
  lastUpdate: string;
  provider: string;
}

interface PerformanceMonitorProps {
  metrics: PerformanceMetrics;
  targetLatency?: number;
  isAdmin?: boolean;
}

export function PerformanceMonitor({ 
  metrics, 
  targetLatency = 700, 
  isAdmin = false 
}: PerformanceMonitorProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [performanceGrade, setPerformanceGrade] = useState<'A' | 'B' | 'C' | 'D' | 'F'>('A');

  useEffect(() => {
    // Calculate performance grade
    let score = 100;
    
    // Latency penalty
    if (metrics.apiLatency > targetLatency) {
      score -= Math.min(30, (metrics.apiLatency - targetLatency) / 10);
    }
    
    // Cache hit rate bonus/penalty
    score += (metrics.cacheHitRate - 50) * 0.3;
    
    // Data age penalty
    if (metrics.dataAge > 300) { // 5 minutes
      score -= Math.min(20, (metrics.dataAge - 300) / 30);
    }
    
    // Error rate penalty
    score -= metrics.errorRate * 10;
    
    // Assign grade
    if (score >= 90) setPerformanceGrade('A');
    else if (score >= 80) setPerformanceGrade('B');
    else if (score >= 70) setPerformanceGrade('C');
    else if (score >= 60) setPerformanceGrade('D');
    else setPerformanceGrade('F');
  }, [metrics, targetLatency]);

  const getLatencyColor = (latency: number) => {
    if (latency <= 500) return 'text-green-500';
    if (latency <= 700) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getCacheColor = (hitRate: number) => {
    if (hitRate >= 80) return 'text-green-500';
    if (hitRate >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getDataAgeColor = (age: number) => {
    if (age <= 90) return 'text-green-500';
    if (age <= 300) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A': return 'bg-green-500 text-white';
      case 'B': return 'bg-blue-500 text-white';
      case 'C': return 'bg-yellow-500 text-black';
      case 'D': return 'bg-orange-500 text-white';
      case 'F': return 'bg-red-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const formatAge = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    return `${Math.floor(seconds / 3600)}h`;
  };

  if (!isAdmin) {
    // Simplified view for non-admin users
    return (
      <Tooltip>
        <TooltipTrigger>
          <Badge variant="outline" className={`${getGradeColor(performanceGrade)} border-0`}>
            <Activity className="h-3 w-3 mr-1" />
            {performanceGrade}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-xs space-y-1">
            <p>Performance Grade: {performanceGrade}</p>
            <p>Latency: {formatDuration(metrics.apiLatency)}</p>
            <p>Data Age: {formatAge(metrics.dataAge)}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4" />
          <h3 className="font-medium">Performance Monitor</h3>
          <Badge className={getGradeColor(performanceGrade)}>
            Grade {performanceGrade}
          </Badge>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs"
        >
          {isExpanded ? 'Collapse' : 'Details'}
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Latency</span>
          </div>
          <div className={`font-medium ${getLatencyColor(metrics.apiLatency)}`}>
            {formatDuration(metrics.apiLatency)}
          </div>
          <div className="text-xs text-muted-foreground">
            Target: {formatDuration(targetLatency)}
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-1">
            <Database className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Cache Hit</span>
          </div>
          <div className={`font-medium ${getCacheColor(metrics.cacheHitRate)}`}>
            {metrics.cacheHitRate.toFixed(1)}%
          </div>
          <div className="text-xs text-muted-foreground">
            Target: 80%+
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-1">
            <Zap className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Data Age</span>
          </div>
          <div className={`font-medium ${getDataAgeColor(metrics.dataAge)}`}>
            {formatAge(metrics.dataAge)}
          </div>
          <div className="text-xs text-muted-foreground">
            Target: &lt;5m
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-1">
            <AlertTriangle className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Error Rate</span>
          </div>
          <div className={`font-medium ${
            metrics.errorRate > 5 ? 'text-red-500' : 
            metrics.errorRate > 1 ? 'text-yellow-500' : 'text-green-500'
          }`}>
            {metrics.errorRate.toFixed(1)}%
          </div>
          <div className="text-xs text-muted-foreground">
            Target: &lt;1%
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-4 pt-4 border-t space-y-2">
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-muted-foreground">Provider:</span>
              <span className="ml-2 font-medium">{metrics.provider}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Last Update:</span>
              <span className="ml-2 font-medium">
                {new Date(metrics.lastUpdate).toLocaleTimeString()}
              </span>
            </div>
          </div>
          
          <div className="text-xs text-muted-foreground">
            <p>Performance targets: p95 latency &lt;{targetLatency}ms, cache hit rate &gt;80%, data age &lt;5m, error rate &lt;1%</p>
          </div>
        </div>
      )}
    </Card>
  );
}