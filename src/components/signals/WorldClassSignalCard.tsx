/**
 * World-Class Signal Card - Tesla × Airbnb × Robinhood × Perplexity level
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowUp, ArrowDown, Sparkles, Bell, BarChart3, Clock } from 'lucide-react';
import { trackEvent } from '@/lib/telemetry';
import type { Signal } from '@/types/signal';

interface WorldClassSignalCardProps {
  group: {
    signals: Signal[];
    asset: string;
    destination: string;
    count: number;
    totalUsd: number;
    avgUsd: number;
    multiplier: number;
    aiConfidence: number;
    latencyMs: number;
    history: number[];
  };
  rank?: number;
  onExpand: () => void;
  onExplain: () => void;
  onCreateAlert: () => void;
}

export function WorldClassSignalCard({ 
  group, 
  rank, 
  onExpand, 
  onExplain, 
  onCreateAlert 
}: WorldClassSignalCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [confidenceAnimated, setConfidenceAnimated] = useState(false);
  
  const isTopRank = rank && rank <= 3;
  const direction = group.destination === 'cold storage' ? 'inflow' : 'outflow';
  const whyItMatters = direction === 'inflow' ? 'accumulation' : 'selling pressure';
  const expectedDrift = direction === 'inflow' ? '+1–2%' : '±1–2%';

  useEffect(() => {
    const timer = setTimeout(() => setConfidenceAnimated(true), 200);
    return () => clearTimeout(timer);
  }, []);

  const handleExpand = () => {
    setExpanded(!expanded);
    onExpand();
    trackEvent('card_expanded', { 
      asset: group.asset,
      rank: rank || null,
      expanded: !expanded,
      totalUsd: group.totalUsd
    });
  };

  const handleAction = (action: string, callback: () => void) => {
    trackEvent('card_action_clicked', { 
      action,
      asset: group.asset,
      rank: rank || null
    });
    callback();
  };

  const toHuman = (usd: number) => {
    if (usd >= 1e9) return `$${(usd / 1e9).toFixed(1)}B`;
    if (usd >= 1e6) return `$${(usd / 1e6).toFixed(1)}M`;
    return `$${(usd / 1e3).toFixed(0)}K`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
    >
      <Card className={`
        rounded-xl bg-card shadow-sm transition-all duration-200 cursor-pointer
        ${isTopRank ? 'rank-shimmer border-t-2 border-t-[var(--brand-teal,#14B8A6)] scale-[1.02]' : ''}
        hover:shadow-[0_4px_12px_rgba(20,184,166,0.25)] hover:scale-[1.01]
      `}>
        <CardContent className="p-4" onClick={handleExpand}>
          {/* Header Row */}
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">
              {group.count}x {group.asset} 
              <span className="mx-1 text-slate-400">→</span> 
              {group.destination}
            </h3>
            <div className="text-right">
              <div className="font-mono tabular-nums font-semibold text-slate-900 dark:text-slate-100">
                {toHuman(group.totalUsd)}
              </div>
              <div className="text-xs text-slate-400">
                avg {toHuman(group.avgUsd)}
              </div>
            </div>
          </div>

          {/* Why It Matters */}
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {group.destination === 'cold storage' ? 'Cold storage inflows' : 'Exchange outflows'} often imply{' '}
            <span className={direction === 'inflow' ? 'text-emerald-600' : 'text-red-600'}>
              {whyItMatters}
            </span>. Today's size is{' '}
            <span className="font-medium text-slate-900 dark:text-slate-100">
              {group.multiplier.toFixed(1)}×
            </span> hourly avg.
          </p>

          {/* Confidence & Metrics Row */}
          <div className="mt-3 flex items-center gap-3">
            {/* AI Confidence Bar */}
            <div className="flex-1">
              <div className="flex items-center gap-1 mb-1">
                <Sparkles className="h-3 w-3 text-[var(--brand-teal,#14B8A6)]" />
                <span className="text-xs text-slate-600 dark:text-slate-400">
                  AI: {group.aiConfidence}%
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-[var(--confidence-green,#10B981)] to-[var(--brand-teal,#14B8A6)] confidence-fill"
                  style={{ 
                    width: confidenceAnimated ? `${group.aiConfidence}%` : '0%'
                  }}
                />
              </div>
            </div>

            {/* Mini Sparkline */}
            <div className="flex items-end gap-0.5 h-6">
              {group.history.map((value, i) => (
                <div
                  key={i}
                  className="w-1 bg-[var(--brand-teal,#14B8A6)] rounded-sm transition-all duration-300"
                  style={{ 
                    height: `${Math.max((value / 100) * 100, 10)}%`,
                    animationDelay: `${i * 50}ms`
                  }}
                />
              ))}
            </div>

            {/* Latency Badge */}
            <Badge variant="outline" className="text-xs">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-1 live-pulse" />
              {group.latencyMs}ms
            </Badge>
          </div>

          {/* Expanded State */}
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ duration: 0.25 }}
              className="mt-4 pt-4 border-t border-slate-200/40 dark:border-slate-800"
            >
              {/* Cluster Strength & Expected Drift */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Cluster Strength</div>
                  <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    High ({group.count} tx / 8m)
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Expected Drift (24h)</div>
                  <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {expectedDrift} (historical median)
                  </div>
                </div>
              </div>

              {/* Action Belt */}
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    handleAction('create_alert', onCreateAlert); 
                  }}
                  className="flex-1 bg-[var(--brand-teal,#14B8A6)] hover:bg-[var(--brand-teal,#14B8A6)]/90 text-white"
                >
                  <Bell className="h-3 w-3 mr-1" />
                  Create Alert
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    handleAction('view_similar', () => {}); 
                  }}
                  className="flex-1"
                >
                  <BarChart3 className="h-3 w-3 mr-1" />
                  View 24h Similar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    handleAction('explain', onExplain); 
                  }}
                >
                  💬 Explain
                </Button>
              </div>
            </motion.div>
          )}

          {/* Top Rank Indicator */}
          {isTopRank && (
            <div className="absolute top-2 right-2">
              <Badge className="bg-[var(--brand-teal,#14B8A6)] text-white text-xs">
                #{rank}
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}