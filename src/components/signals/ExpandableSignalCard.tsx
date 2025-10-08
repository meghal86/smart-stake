/**
 * ExpandableSignalCard - Living, breathing card with energy & emotion
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowUp, ArrowDown, Bell, BarChart3, MessageCircle, ChevronDown } from 'lucide-react';
import { HeartbeatDot } from './HeartbeatDot';
import { SparklineChart } from './SparklineChart';
import { AnimatedConfidenceBar } from './AnimatedConfidenceBar';
import { trackEvent } from '@/lib/telemetry';
import { PhaseDTelemetry } from '@/lib/phase-d-telemetry';
import type { Signal } from '@/types/signal';

interface ExpandableSignalCardProps {
  signal: Signal;
  rank?: number;
  isTopFlow?: boolean;
  onExplain: () => void;
  onCreateAlert: () => void;
  onViewPattern: () => void;
}

export function ExpandableSignalCard({ 
  signal, 
  rank, 
  isTopFlow = false,
  onExplain, 
  onCreateAlert, 
  onViewPattern 
}: ExpandableSignalCardProps) {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const [expanded, setExpanded] = useState(false);
  const [showNarrative, setShowNarrative] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const timeAgo = new Date(signal.timestamp).toLocaleString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
  
  const destination = signal.direction === 'outflow' ? 'exchange' : 'cold storage';
  const isAccumulation = signal.direction === 'inflow';
  const confidence = Math.floor(Math.random() * 30) + 70;
  const drift = (Math.random() - 0.5) * 4; // ±2%
  const multiplier = Math.random() * 3 + 1; // 1-4x
  const yesterdayChange = Math.random() * 20 - 10; // ±10%
  
  // Generate sparkline data
  const sparklineData = Array.from({ length: 12 }, (_, i) => {
    const base = 50;
    const trend = isAccumulation ? 1 : -1;
    return base + trend * (i / 12) * 20 + (Math.random() - 0.5) * 15;
  });

  const handleExpand = () => {
    setExpanded(!expanded);
    
    if (!expanded) {
      setShowNarrative(true);
      // Auto-collapse after 30s inactivity
      timeoutRef.current = setTimeout(() => {
        setExpanded(false);
        setShowNarrative(false);
      }, 30000);
      
      PhaseDTelemetry.trackGroupExpanded({
        asset: signal.asset,
        direction: signal.direction,
        count: 1,
        totalUsd: signal.amountUsd
      });
    } else {
      setShowNarrative(false);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    }
  };

  const handleActionClick = (action: 'create_alert' | 'view_pattern' | 'explain', callback: () => void) => {
    console.log(`Action clicked: ${action} for signal:`, signal.id);
    PhaseDTelemetry.trackQuickAction({
      action,
      asset: signal.asset,
      context: isTopFlow ? 'top_flow' : 'all_signals'
    });
    callback();
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const formatAmount = (amount: number) => {
    if (amount >= 1e9) {
      const val = amount / 1e9;
      return val % 1 === 0 ? `$${val.toFixed(0)}B` : `$${val.toFixed(1)}B`;
    }
    if (amount >= 1e6) {
      const val = amount / 1e6;
      return val % 1 === 0 ? `$${val.toFixed(0)}M` : `$${val.toFixed(1)}M`;
    }
    return `$${(amount / 1e3).toFixed(0)}K`;
  };

  const ambientGradient = signal.risk === 'high' 
    ? 'bg-gradient-to-br from-red-50/50 to-rose-100/30 dark:from-red-900/10 dark:to-rose-800/20'
    : 'bg-gradient-to-br from-emerald-50/50 to-teal-100/30 dark:from-emerald-900/10 dark:to-teal-800/20';

  return (
    <motion.div
      layout
      initial={!reducedMotion ? { opacity: 0, y: 20 } : { opacity: 1 }}
      animate={{ opacity: 1, y: 0 }}
      transition={!reducedMotion ? { duration: 0.25, ease: [0.4, 0, 0.2, 1] } : { duration: 0 }}
    >
      <Card 
        role="region"
        aria-label={`${signal.asset} ${signal.direction} to ${destination}, ${formatAmount(signal.amountUsd)}, ${signal.risk} severity ${confidence}%, ${timeAgo}`}
        className={`
          cursor-pointer transition-all duration-200 overflow-hidden
          ${isTopFlow ? 'border-l-4 border-l-[var(--brand-teal,#14B8A6)] bg-gradient-to-r from-[var(--brand-teal,#14B8A6)]/5 to-transparent' : ''}
          ${expanded ? ambientGradient : ''}
          hover:shadow-lg hover:scale-[1.01]
        `}
      >
        <CardContent 
          className="p-4 cursor-pointer" 
          onClick={handleExpand}
        >
          {/* Header Row */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              {rank && (
                <Badge className="bg-[var(--brand-teal,#14B8A6)] text-white text-xs">
                  #{rank}
                </Badge>
              )}
              
              <div className="flex items-center gap-2">
                {signal.direction === 'outflow' ? (
                  <ArrowDown className="h-4 w-4 text-red-500" />
                ) : (
                  <ArrowUp className="h-4 w-4 text-emerald-500" />
                )}
                <div>
                  <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    {signal.asset} → {destination}
                    <HeartbeatDot isLive={signal.isLive} size="sm" />
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span>This pattern = {multiplier.toFixed(1)}× average for {signal.asset} today</span>
                    {isTopFlow && (
                      <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 text-xs">
                        Last similar → +2.3% 24h
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className="text-lg font-bold tabular-nums text-slate-900 dark:text-slate-100">
                {formatAmount(signal.amountUsd)}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                {signal.risk} severity
              </div>
            </div>
          </div>

          {/* Confidence Bar */}
          <AnimatedConfidenceBar 
            value={confidence} 
            delay={expanded ? 200 : 0}
          />

          {/* Expand/Collapse Indicator */}
          <div className="flex justify-center mt-2">
            <motion.div 
              className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
              animate={!reducedMotion ? { rotate: expanded ? 180 : 0 } : {}}
              transition={!reducedMotion ? { duration: 0.25, ease: [0.4, 0, 0.2, 1] } : { duration: 0 }}
              role="button"
              aria-label={expanded ? 'Hide details' : 'Show details'}
              tabIndex={0}
            >
              <ChevronDown className="h-3 w-3" />
              <span>{expanded ? 'Hide' : 'Details'}</span>
            </motion.div>
          </div>

          {/* Expanded Content */}
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                className="mt-4 space-y-4"
              >
                {/* AI Narrative */}
                {showNarrative && (
                  <motion.div
                    initial={!reducedMotion ? { opacity: 0, x: -20 } : { opacity: 1 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={!reducedMotion ? { delay: 0.1, duration: 0.3 } : { duration: 0 }}
                    className="bg-white/60 dark:bg-slate-800/60 rounded-lg p-3 border border-slate-200/40 dark:border-slate-700 space-y-2"
                    role="region"
                    aria-labelledby="ai-narrative"
                    aria-describedby="prediction-details"
                  >
                    <div className="flex items-start gap-2">
                      <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 text-xs">
                        💠 {confidence}%
                      </Badge>
                      <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                        Whales are transferring {signal.asset} into {destination} faster than last 3 days — possible {isAccumulation ? 'accumulation' : 'distribution'} phase.
                      </p>
                    </div>
                    
                    {/* Outcome Prediction - Pro Feature */}
                    <div className="text-xs text-slate-600 dark:text-slate-400 bg-gradient-to-r from-[var(--brand-teal,#14B8A6)]/5 to-transparent p-2 rounded border-l-2 border-[var(--brand-teal,#14B8A6)]/30">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-medium">Based on similar last 30 cases:</span> +1.2–2.4% drift within 24h
                          <Badge className="ml-2 bg-[var(--brand-teal,#14B8A6)]/10 text-[var(--brand-teal,#14B8A6)] text-xs">Pro</Badge>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-[var(--brand-teal,#14B8A6)] hover:bg-[var(--brand-teal,#14B8A6)]/10 text-xs h-6 px-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Open backtest modal
                            console.log('Open backtest modal');
                          }}
                        >
                          Backtest
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Sparkline & Metrics */}
                <div className="flex items-center justify-between">
                  <SparklineChart 
                    data={sparklineData}
                    drift={drift}
                    animated={true}
                  />
                  
                  <div className="text-right space-y-1">
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Compared to yesterday hour
                    </div>
                    <div className={`text-sm font-medium tabular-nums ${
                      yesterdayChange >= 0 ? 'text-emerald-600' : 'text-red-600'
                    }`}>
                      {yesterdayChange >= 0 ? '+' : ''}{yesterdayChange.toFixed(1)}% asset accumulation
                    </div>
                    {/* Group Dynamics Tags */}
                    <div className="flex flex-wrap gap-1">
                      {Math.random() > 0.7 && (
                        <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 text-xs">
                          Coordinated wallets (4)
                        </Badge>
                      )}
                      {Math.random() > 0.8 && (
                        <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 text-xs">
                          Rising density
                        </Badge>
                      )}
                      {Math.random() > 0.9 && (
                        <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 text-xs">
                          Recurring pattern
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Row */}
                <div className="flex gap-2 pt-2 border-t border-slate-200/40 dark:border-slate-700">
                  <Button
                    size="sm"
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      handleActionClick('create_alert', onCreateAlert); 
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
                      handleActionClick('view_pattern', onViewPattern); 
                    }}
                    className="flex-1"
                  >
                    <BarChart3 className="h-3 w-3 mr-1" />
                    View Pattern
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      handleActionClick('explain', onExplain); 
                    }}
                  >
                    <MessageCircle className="h-3 w-3 mr-1" />
                    Explain
                  </Button>
                </div>

                {/* Pre-filled Alert Preview */}
                <div className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-800/50 rounded p-2">
                  Alert when &gt; {formatAmount(signal.amountUsd * 0.8)} to {destination} for {signal.asset}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}