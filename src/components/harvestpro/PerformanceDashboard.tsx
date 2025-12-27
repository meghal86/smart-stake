/**
 * HarvestPro Performance Dashboard
 * 
 * Debug component for monitoring HarvestPro performance metrics
 * Only visible in development mode
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp,
  TrendingDown,
  BarChart3,
  X,
  RefreshCw,
} from 'lucide-react';
import { harvestProPerformanceMonitor } from '@/lib/harvestpro/performance-monitor';
import { usePerformanceDebug } from '@/hooks/useHarvestProPerformance';

interface PerformanceDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PerformanceDashboard({ isOpen, onClose }: PerformanceDashboardProps) {
  const { getHealthStatus, getSummary, getRecentMetrics } = usePerformanceDebug();
  const [healthStatus, setHealthStatus] = useState(getHealthStatus());
  const [summary, setSummary] = useState(getSummary());
  const [recentMetrics, setRecentMetrics] = useState(getRecentMetrics(60000)); // Last minute

  // Auto-refresh every 5 seconds
  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      setHealthStatus(getHealthStatus());
      setSummary(getSummary());
      setRecentMetrics(getRecentMetrics(60000));
    }, 5000);

    return () => clearInterval(interval);
  }, [isOpen, getHealthStatus, getSummary, getRecentMetrics]);

  const handleRefresh = () => {
    setHealthStatus(getHealthStatus());
    setSummary(getSummary());
    setRecentMetrics(getRecentMetrics(60000));
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const getStatusColor = (status: 'healthy' | 'degraded' | 'critical') => {
    switch (status) {
      case 'healthy': return 'text-green-400 bg-green-400/10';
      case 'degraded': return 'text-yellow-400 bg-yellow-400/10';
      case 'critical': return 'text-red-400 bg-red-400/10';
    }
  };

  const getStatusIcon = (status: 'healthy' | 'degraded' | 'critical') => {
    switch (status) {
      case 'healthy': return CheckCircle;
      case 'degraded': return AlertTriangle;
      case 'critical': return AlertTriangle;
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="fixed right-4 top-4 bottom-4 w-96 bg-slate-900/95 backdrop-blur-lg rounded-2xl border border-white/10 overflow-hidden"
          initial={{ x: 400, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 400, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-400" />
              <h2 className="text-lg font-semibold text-white">Performance Monitor</h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleRefresh}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              >
                <RefreshCw className="w-4 h-4 text-gray-400" />
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </div>

          <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(100vh-120px)]">
            {/* Health Status */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-300">System Health</h3>
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${getStatusColor(healthStatus.status)}`}>
                {React.createElement(getStatusIcon(healthStatus.status), { className: 'w-4 h-4' })}
                <span className="font-medium capitalize">{healthStatus.status}</span>
              </div>
              {healthStatus.issues.length > 0 && (
                <div className="space-y-1">
                  {healthStatus.issues.map((issue, index) => (
                    <div key={index} className="text-xs text-red-400 bg-red-400/10 px-2 py-1 rounded">
                      {issue}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Key Metrics */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-300">Key Metrics</h3>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(summary)
                  .filter(([name]) => 
                    name.includes('opportunities:') || 
                    name.includes('csv:') || 
                    name.includes('loading_state:') ||
                    name.includes('interaction:')
                  )
                  .slice(0, 8)
                  .map(([name, stats]) => (
                    <div key={name} className="bg-white/5 rounded-lg p-3">
                      <div className="text-xs text-gray-400 mb-1 truncate" title={name}>
                        {name.split(':').pop()}
                      </div>
                      <div className="text-sm font-medium text-white">
                        {formatDuration(stats.avg)}
                      </div>
                      <div className="flex items-center gap-1 text-xs">
                        {stats.violations > 0 ? (
                          <>
                            <TrendingUp className="w-3 h-3 text-red-400" />
                            <span className="text-red-400">{stats.violations} violations</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-3 h-3 text-green-400" />
                            <span className="text-green-400">OK</span>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-300">Recent Activity</h3>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {recentMetrics.slice(-10).reverse().map((metric, index) => (
                  <div key={index} className="flex items-center justify-between text-xs bg-white/5 rounded px-2 py-1">
                    <span className="text-gray-300 truncate flex-1" title={metric.name}>
                      {metric.name}
                    </span>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={metric.value > metric.threshold ? 'text-red-400' : 'text-green-400'}>
                        {formatDuration(metric.value)}
                      </span>
                      {metric.value > metric.threshold && (
                        <AlertTriangle className="w-3 h-3 text-red-400" />
                      )}
                    </div>
                  </div>
                ))}
                {recentMetrics.length === 0 && (
                  <div className="text-xs text-gray-500 text-center py-4">
                    No recent activity
                  </div>
                )}
              </div>
            </div>

            {/* Performance Summary */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-300">Performance Summary</h3>
              <div className="space-y-2">
                {Object.entries(summary)
                  .filter(([, stats]) => stats.count > 0)
                  .sort(([, a], [, b]) => b.count - a.count)
                  .slice(0, 5)
                  .map(([name, stats]) => (
                    <div key={name} className="bg-white/5 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-400 truncate" title={name}>
                          {name}
                        </span>
                        <span className="text-xs text-gray-500">
                          {stats.count} calls
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <div className="text-gray-500">Avg</div>
                          <div className="text-white font-medium">
                            {formatDuration(stats.avg)}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-500">P95</div>
                          <div className="text-white font-medium">
                            {formatDuration(stats.p95)}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-500">Max</div>
                          <div className="text-white font-medium">
                            {formatDuration(stats.max)}
                          </div>
                        </div>
                      </div>
                      {stats.violations > 0 && (
                        <div className="mt-2 text-xs text-red-400">
                          {stats.violations} violations ({((stats.violations / stats.count) * 100).toFixed(1)}%)
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * Performance Monitor Toggle Button
 * Only visible in development
 */
export function PerformanceMonitorToggle() {
  const [isOpen, setIsOpen] = useState(false);

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <>
      <motion.button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-40 p-3 bg-blue-600 hover:bg-blue-700 rounded-full shadow-lg transition-colors"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        title="Open Performance Monitor"
      >
        <BarChart3 className="w-5 h-5 text-white" />
      </motion.button>

      <PerformanceDashboard isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}