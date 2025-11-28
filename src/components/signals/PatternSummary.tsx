/**
 * PatternSummary - Micro-analytics and comparative insights
 */

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Target, Clock } from 'lucide-react';
import type { Signal } from '@/types/signal';

interface PatternSummaryProps {
  signal: Signal;
  patternData: unknown;
  timeframe: string;
}

export function PatternSummary({ signal, patternData, timeframe }: PatternSummaryProps) {
  const formatAmount = (amount: number) => {
    if (amount >= 1e9) return `$${(amount / 1e9).toFixed(1)}B`;
    if (amount >= 1e6) return `$${(amount / 1e6).toFixed(1)}M`;
    return `$${(amount / 1e3).toFixed(0)}K`;
  };

  const stats = [
    {
      label: 'Pattern Strength',
      value: `${patternData.multiplier}×`,
      description: 'vs average',
      icon: TrendingUp,
      color: 'text-emerald-600'
    },
    {
      label: 'Historical Accuracy',
      value: `${patternData.accuracy}%`,
      description: 'success rate',
      icon: Target,
      color: 'text-blue-600'
    },
    {
      label: 'Median Outcome',
      value: `${patternData.medianDrift > 0 ? '+' : ''}${patternData.medianDrift}%`,
      description: '24h drift',
      icon: patternData.medianDrift > 0 ? TrendingUp : TrendingDown,
      color: patternData.medianDrift > 0 ? 'text-emerald-600' : 'text-red-600'
    },
    {
      label: 'Time to Impact',
      value: '18h',
      description: 'avg window',
      icon: Clock,
      color: 'text-purple-600'
    }
  ];

  return (
    <div className="space-y-4">
      {/* Key Metrics */}
      <Card>
        <CardContent className="p-4">
          <h4 className="font-semibold mb-3 text-slate-900 dark:text-slate-100">
            Pattern Metrics
          </h4>
          <div className="grid grid-cols-2 gap-3">
            {stats.map((stat, i) => (
              <div key={i} className="text-center p-2 bg-slate-50 dark:bg-slate-800 rounded">
                <div className="flex items-center justify-center mb-1">
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
                <div className={`font-bold text-lg tabular-nums ${stat.color}`}>
                  {stat.value}
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400">
                  {stat.label}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-500">
                  {stat.description}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Comparative Analysis */}
      <Card>
        <CardContent className="p-4">
          <h4 className="font-semibold mb-3 text-slate-900 dark:text-slate-100">
            Comparative Insights
          </h4>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-400">vs Yesterday</span>
              <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                +240% activity
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-400">vs Last Week</span>
              <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                +180% volume
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-400">Market Correlation</span>
              <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                Strong (0.82)
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Risk Assessment */}
      <Card>
        <CardContent className="p-4">
          <h4 className="font-semibold mb-3 text-slate-900 dark:text-slate-100">
            Risk Profile
          </h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600 dark:text-slate-400">Volatility Risk</span>
              <span className="text-slate-900 dark:text-slate-100">{signal.risk}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600 dark:text-slate-400">Liquidity Impact</span>
              <span className="text-slate-900 dark:text-slate-100">Moderate</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600 dark:text-slate-400">False Signal Rate</span>
              <span className="text-slate-900 dark:text-slate-100">{100 - patternData.accuracy}%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pattern Context */}
      <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 text-xs">
        <div className="font-medium text-slate-900 dark:text-slate-100 mb-1">
          Pattern Context
        </div>
        <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
          This {signal.direction} pattern for {signal.asset} occurs {Math.floor(patternData.totalInstances / 12)} times per month on average. 
          Current market conditions suggest {patternData.accuracy}% probability of similar outcome.
        </p>
      </div>
    </div>
  );
}