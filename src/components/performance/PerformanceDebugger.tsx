import React, { useState, useEffect } from 'react';
import { Activity, Trash2, RefreshCw, AlertTriangle, CheckCircle, X, Minimize2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { performanceMonitor } from '@/lib/performance/monitor';
import { useMemoryMonitor } from '@/lib/performance/memory-monitor';
import { intervalManager } from '@/lib/performance/interval-manager';

/**
 * Performance Debugger Component
 * 
 * Shows real-time performance metrics and memory usage
 * Only available in development mode, opens on click
 */
export function PerformanceDebugger() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [performanceMetrics, setPerformanceMetrics] = useState(performanceMonitor.getMetrics());
  const [intervalStats, setIntervalStats] = useState(intervalManager.getStats());
  const { memoryStats, forceGarbageCollection } = useMemoryMonitor();

  // Only available in development
  const isDevelopment = process.env.NODE_ENV === 'development';

  // Update metrics periodically when open
  useEffect(() => {
    if (!isOpen) return;

    const updateMetrics = () => {
      setPerformanceMetrics(performanceMonitor.getMetrics());
      setIntervalStats(intervalManager.getStats());
    };

    updateMetrics();
    const interval = setInterval(updateMetrics, 5000);
    return () => clearInterval(interval);
  }, [isOpen]);

  // Global function to open debugger from anywhere
  useEffect(() => {
    if (!isDevelopment) return;

    const openDebugger = () => {
      setIsOpen(true);
      setIsMinimized(false);
    };

    // Expose global function
    (window as unknown as Record<string, unknown>).openPerformanceDebugger = openDebugger;

    return () => {
      delete (window as unknown as Record<string, unknown>).openPerformanceDebugger;
    };
  }, [isDevelopment]);

  if (!isDevelopment) return null;

  const clearMetrics = () => {
    performanceMonitor.clear();
    setPerformanceMetrics([]);
  };

  const clearAllIntervals = () => {
    intervalManager.clearAll();
    setIntervalStats(intervalManager.getStats());
  };

  const memoryUsagePercent = memoryStats?.current.usagePercent || 0;
  const isMemoryHigh = memoryUsagePercent > 80;
  const hasMemoryGrowth = memoryStats?.trend && memoryStats.trend.growth > 10 * 1024 * 1024; // 10MB

  // Floating trigger button when closed
  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          className="rounded-full w-12 h-12 bg-black/90 hover:bg-black text-white border border-gray-700"
          title="Open Performance Debugger"
        >
          <Activity className="h-5 w-5" />
        </Button>
      </div>
    );
  }

  // Minimized state
  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Card className="p-2 bg-black/90 text-white border-gray-700">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            <span className="text-sm font-medium">Performance</span>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={() => setIsMinimized(false)}
              className="h-6 w-6 p-0"
            >
              <Minimize2 className="h-3 w-3" />
            </Button>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={() => setIsOpen(false)}
              className="h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Full debugger panel
  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <Card className="p-4 bg-black/90 text-white border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            <h4 className="font-medium">Performance Debug</h4>
            <Badge variant="outline" className="text-xs">
              DEV
            </Badge>
          </div>
          <div className="flex items-center gap-1">
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={() => setIsMinimized(true)}
              className="h-6 w-6 p-0"
              title="Minimize"
            >
              <Minimize2 className="h-3 w-3" />
            </Button>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={() => setIsOpen(false)}
              className="h-6 w-6 p-0"
              title="Close"
            >
              <X className="h-3 w-3" />
            </Button>
            <Button size="sm" variant="outline" onClick={clearMetrics} title="Clear metrics">
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>

        <div className="space-y-4 text-sm">
          {/* Memory Usage */}
          {memoryStats && (
            <div>
              <div className="flex justify-between items-center mb-2">
                <span>Memory Usage</span>
                <div className="flex items-center gap-2">
                  {isMemoryHigh ? (
                    <AlertTriangle className="h-3 w-3 text-red-500" />
                  ) : (
                    <CheckCircle className="h-3 w-3 text-green-500" />
                  )}
                  <span>{memoryUsagePercent.toFixed(1)}%</span>
                </div>
              </div>
              <Progress 
                value={memoryUsagePercent} 
                className={`h-2 ${isMemoryHigh ? 'bg-red-900' : 'bg-gray-700'}`}
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>{(memoryStats.current.used / 1024 / 1024).toFixed(1)} MB</span>
                <span>{(memoryStats.current.limit / 1024 / 1024).toFixed(0)} MB</span>
              </div>
              {hasMemoryGrowth && (
                <div className="text-xs text-yellow-400 mt-1">
                  ⚠️ Growing: +{(memoryStats.trend!.growth / 1024 / 1024).toFixed(1)} MB
                </div>
              )}
            </div>
          )}

          {/* Active Timers */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span>Active Timers</span>
              <div className="flex items-center gap-2">
                <span>{intervalStats.total}</span>
                <Button size="sm" variant="outline" onClick={clearAllIntervals}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>Intervals: {intervalStats.activeIntervals}</div>
              <div>Timeouts: {intervalStats.activeTimeouts}</div>
            </div>
          </div>

          {/* Performance Metrics */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span>Performance Metrics</span>
              <span>{performanceMetrics.length}</span>
            </div>
            {performanceMetrics.slice(-3).map((metric, index) => (
              <div key={index} className="flex justify-between text-xs">
                <span className="font-mono">{metric.name}</span>
                <span className={metric.value > metric.threshold ? 'text-red-400' : 'text-green-400'}>
                  {metric.value.toFixed(0)}ms
                </span>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={forceGarbageCollection}>
              <RefreshCw className="h-3 w-3 mr-1" />
              GC
            </Button>
            <Button size="sm" variant="outline" onClick={() => window.location.reload()}>
              <RefreshCw className="h-3 w-3 mr-1" />
              Reload
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}