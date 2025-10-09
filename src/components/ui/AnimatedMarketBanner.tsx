import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { motionClasses, animations } from '@/lib/motion-tokens';
import { formatPercentage, formatAmount } from '@/lib/format-helpers';

interface MarketMetric {
  label: string;
  value: string;
  change?: number;
  isLive?: boolean;
}

interface AnimatedMarketBannerProps {
  metrics: MarketMetric[];
  className?: string;
}

export function AnimatedMarketBanner({ metrics, className = '' }: AnimatedMarketBannerProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const primaryMetric = metrics[0];
  const secondaryMetrics = metrics.slice(1);

  return (
    <div className={`bg-slate-50 dark:bg-slate-900 border-b ${className}`}>
      {/* Desktop: Full banner */}
      <div className="hidden md:flex items-center justify-between px-6 py-3">
        <div className="flex items-center space-x-6">
          {metrics.map((metric, index) => (
            <div key={index} className="flex items-center space-x-2">
              {metric.isLive && (
                <div className={`w-2 h-2 bg-green-500 rounded-full ${animations.breathingPulse}`} />
              )}
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {metric.label}
              </span>
              <span className={`text-sm font-bold ${metric.change && metric.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {metric.value}
              </span>
              {metric.change && (
                <span className={`text-xs px-2 py-1 rounded-full ${
                  metric.change > 0 
                    ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' 
                    : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                } ${metric.change > 20 ? animations.marketPulse : ''}`}>
                  {formatPercentage(metric.change)}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Mobile: Collapsible summary */}
      <div className="md:hidden">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`w-full flex items-center justify-between px-4 py-3 ${motionClasses.fast}`}
        >
          <div className="flex items-center space-x-2">
            {primaryMetric.isLive && (
              <div className={`w-2 h-2 bg-green-500 rounded-full ${animations.breathingPulse}`} />
            )}
            <span className="text-sm font-medium">
              {primaryMetric.label} {primaryMetric.value}
            </span>
            {primaryMetric.change && (
              <span className={`text-xs px-2 py-1 rounded-full ${
                primaryMetric.change > 0 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-red-100 text-red-700'
              }`}>
                {formatPercentage(primaryMetric.change)}
              </span>
            )}
          </div>
          {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </button>

        {/* Expanded metrics */}
        <div className={`overflow-hidden transition-all duration-300 ${
          isCollapsed ? 'max-h-0' : 'max-h-96'
        }`}>
          <div className="px-4 pb-3 space-y-2">
            {secondaryMetrics.map((metric, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  {metric.label}
                </span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">{metric.value}</span>
                  {metric.change && (
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      metric.change > 0 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {formatPercentage(metric.change)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}