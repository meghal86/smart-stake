/**
 * Cockpit Performance Monitor
 * 
 * Development-only component that displays real-time performance metrics
 * and SLO compliance status for the cockpit interface.
 * 
 * Requirements: 14.1, 14.2, 14.3
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Monitor, AlertTriangle, CheckCircle, X, BarChart3 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { usePerformanceMonitoring } from '@/lib/cockpit/performance';
import { useCockpitPerformanceMonitor } from './CockpitQueryProvider';

// ============================================================================
// Types
// ============================================================================

interface PerformanceMonitorProps {
  /** Whether to show the monitor (development only) */
  enabled?: boolean;
  /** Position of the monitor */
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

// ============================================================================
// Component
// ============================================================================

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  enabled = process.env.NODE_ENV === 'development',
  position = 'bottom-right',
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isVisible, setIsVisible] = useState(enabled);
  
  const { metrics, sloStatus } = usePerformanceMonitoring();
  const cacheMetrics = useCockpitPerformanceMonitor();
  
  // Don't render in production
  if (!enabled || process.env.NODE_ENV === 'production') {
    return null;
  }
  
  if (!isVisible) {
    return null;
  }
  
  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
  };
  
  const formatTime = (ms: number) => {
    if (ms < 1000) {
      return `${Math.round(ms)}ms`;
    }
    return `${(ms / 1000).toFixed(1)}s`;
  };
  
  const formatPercentage = (value: number) => {
    return `${Math.round(value)}%`;
  };
  
  const getSLOStatus = (metric: string, value: number, threshold: number) => {
    const passed = value <= threshold;
    return {
      passed,
      color: passed ? 'text-green-400' : 'text-red-400',
      icon: passed ? CheckCircle : AlertTriangle,
    };
  };
  
  return (
    <div className={`fixed ${positionClasses[position]} z-[9999] pointer-events-auto`}>
      <AnimatePresence>
        {!isExpanded ? (
          // Collapsed state - floating button
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="relative"
          >
            <Button
              onClick={() => setIsExpanded(true)}
              size="sm"
              className="rounded-full w-12 h-12 bg-slate-800/90 backdrop-blur-sm border border-white/10 hover:bg-slate-700/90 shadow-lg"
            >
              <Monitor className="w-5 h-5 text-cyan-400" />
            </Button>
            
            {/* SLO status indicator */}
            <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${
              sloStatus.passed ? 'bg-green-400' : 'bg-red-400'
            }`} />
          </motion.div>
        ) : (
          // Expanded state - performance panel
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="w-80 bg-slate-900/95 backdrop-blur-md border border-white/10 p-4 shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-cyan-400" />
                  <span className="text-white font-medium">Performance</span>
                  <Badge 
                    variant={sloStatus.passed ? 'default' : 'destructive'}
                    className="text-xs"
                  >
                    {sloStatus.passed ? 'SLO OK' : 'SLO FAIL'}
                  </Badge>
                </div>
                <Button
                  onClick={() => setIsExpanded(false)}
                  variant="ghost"
                  size="sm"
                  className="w-6 h-6 p-0 hover:bg-white/10"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              {/* Metrics */}
              <div className="space-y-3">
                {/* Page Load Metrics */}
                <div>
                  <div className="text-sm font-medium text-white mb-2">Page Load</div>
                  <div className="space-y-1 text-xs">
                    {metrics.firstMeaningfulPaint && (
                      <div className="flex justify-between">
                        <span className="text-slate-300">First Meaningful Paint</span>
                        <span className={
                          getSLOStatus('fmp', metrics.firstMeaningfulPaint, 1200).color
                        }>
                          {formatTime(metrics.firstMeaningfulPaint)}
                        </span>
                      </div>
                    )}
                    
                    {metrics.timeToInteractive && (
                      <div className="flex justify-between">
                        <span className="text-slate-300">Time to Interactive</span>
                        <span className="text-slate-400">
                          {formatTime(metrics.timeToInteractive)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* API Performance */}
                {metrics.apiResponseTimes && (
                  <div>
                    <div className="text-sm font-medium text-white mb-2">API Response</div>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-300">P50</span>
                        <span className={
                          getSLOStatus('p50', metrics.apiResponseTimes.p50, 150).color
                        }>
                          {formatTime(metrics.apiResponseTimes.p50)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-300">P95</span>
                        <span className={
                          getSLOStatus('p95', metrics.apiResponseTimes.p95, 400).color
                        }>
                          {formatTime(metrics.apiResponseTimes.p95)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-300">P99</span>
                        <span className={
                          getSLOStatus('p99', metrics.apiResponseTimes.p99, 900).color
                        }>
                          {formatTime(metrics.apiResponseTimes.p99)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* UI Interactions */}
                <div>
                  <div className="text-sm font-medium text-white mb-2">UI Interactions</div>
                  <div className="space-y-1 text-xs">
                    {metrics.drawerOpenLatency && (
                      <div className="flex justify-between">
                        <span className="text-slate-300">Drawer Open</span>
                        <span className={
                          getSLOStatus('drawer', metrics.drawerOpenLatency, 100).color
                        }>
                          {formatTime(metrics.drawerOpenLatency)}
                        </span>
                      </div>
                    )}
                    
                    {metrics.componentRenderTime && (
                      <div className="flex justify-between">
                        <span className="text-slate-300">Component Render</span>
                        <span className="text-slate-400">
                          {formatTime(metrics.componentRenderTime)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Cache Performance */}
                <div>
                  <div className="text-sm font-medium text-white mb-2">Cache</div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-300">Hit Rate</span>
                      <span className="text-cyan-400">
                        {formatPercentage(cacheMetrics.cacheHitRate)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-300">Total Queries</span>
                      <span className="text-slate-400">
                        {cacheMetrics.totalQueries}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-300">Error Rate</span>
                      <span className={
                        cacheMetrics.errorRate > 5 ? 'text-red-400' : 'text-slate-400'
                      }>
                        {formatPercentage(cacheMetrics.errorRate)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* SLO Violations */}
              {!sloStatus.passed && sloStatus.violations.length > 0 && (
                <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <div className="text-sm font-medium text-red-400 mb-2">
                    SLO Violations
                  </div>
                  <div className="space-y-1">
                    {sloStatus.violations.map((violation, index) => (
                      <div key={index} className="text-xs text-red-300">
                        {violation}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Actions */}
              <div className="mt-4 flex gap-2">
                <Button
                  onClick={() => window.location.reload()}
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs border-white/20 text-white hover:bg-white/10"
                >
                  Reload
                </Button>
                <Button
                  onClick={() => setIsVisible(false)}
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs border-white/20 text-white hover:bg-white/10"
                >
                  Hide
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PerformanceMonitor;