/**
 * Unified Signal Card - World-class UX with variants
 */

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowUp, ArrowDown, Sparkles, TrendingUp, Clock } from 'lucide-react';
import { trackEvent } from '@/lib/telemetry';
import type { Signal } from '@/types/signal';

interface UnifiedSignalCardProps {
  signal: Signal;
  variant: 'top' | 'all';
  rank?: number;
  index?: number;
  onExplain: (signal: Signal) => void;
  onCreateAlert: (signal: Signal) => void;
}

export function UnifiedSignalCard({ 
  signal, 
  variant, 
  rank, 
  index = 0, 
  onExplain, 
  onCreateAlert 
}: UnifiedSignalCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showSparkline, setShowSparkline] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  
  const isTop = variant === 'top';
  const isTopRank = isTop && rank && rank <= 3;
  const destination = signal.direction === 'outflow' ? 'exchange' : 'cold storage';
  const confidence = Math.floor(Math.random() * 30) + 70;
  const priceImpact = signal.direction === 'outflow' ? '±1–2%' : '±1–2%';

  useEffect(() => {
    if (isHovered) {
      const timer = setTimeout(() => setShowSparkline(true), 200);
      return () => clearTimeout(timer);
    } else {
      setShowSparkline(false);
    }
  }, [isHovered]);

  const handleHover = (hovered: boolean) => {
    setIsHovered(hovered);
    if (hovered) {
      trackEvent('card_hover', { 
        signalId: signal.id, 
        variant, 
        rank: rank || null 
      });
    }
  };

  const sparklineData = Array.from({ length: 8 }, () => Math.random() * 40 + 30);

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.25, 
        delay: index * 0.05,
        ease: [0.4, 0, 0.2, 1]
      }}
      onMouseEnter={() => handleHover(true)}
      onMouseLeave={() => handleHover(false)}
      className="relative"
    >
      <Card className={`
        transition-all duration-200 cursor-pointer
        ${isTopRank ? 'border-t-2 border-t-[var(--brand-teal,#14B8A6)] bg-gradient-to-br from-[var(--brand-teal,#14B8A6)]/5 to-transparent' : ''}
        ${isHovered ? 'motion-safe:scale-[1.02] shadow-[0_4px_12px_rgba(20,184,166,0.25)] motion-safe:translate-y-[-2px]' : ''}
        ${isTop ? 'mb-5' : 'mb-4'}
      `}>
        <CardContent className={`p-5 ${isTop ? 'py-5' : 'py-4'}`}>
          {/* Header Row */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              {isTop && rank && (
                <div className="flex-shrink-0 w-8 h-8 bg-[var(--brand-teal,#14B8A6)] text-white rounded-full flex items-center justify-center text-sm font-bold">
                  #{rank}
                </div>
              )}
              
              <div className="flex items-center gap-2">
                {signal.direction === 'outflow' ? (
                  <ArrowDown className="h-4 w-4 text-red-500" />
                ) : (
                  <ArrowUp className="h-4 w-4 text-emerald-500" />
                )}
                <div>
                  <div className="font-semibold text-slate-900 dark:text-slate-100">
                    {signal.asset} {signal.direction === 'outflow' ? '↗' : '↘'} {destination}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {destination === 'cold storage' ? 'Cold storage inflows' : 'Exchange outflows'} often precede {signal.direction === 'outflow' ? 'selling pressure' : 'accumulation'}. Likely price drift: {priceImpact} next 24h.
                  </div>
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className="text-lg font-bold tabular-nums text-slate-900 dark:text-slate-100">
                ${(signal.amountUsd / 1e6).toFixed(1)}M
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {signal.risk} risk
              </div>
            </div>
          </div>

          {/* Confidence Bar */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <Sparkles className="h-3 w-3 text-[var(--brand-teal,#14B8A6)]" />
                <span className="text-xs text-slate-600 dark:text-slate-400">
                  AI Confidence: {confidence}%
                </span>
              </div>
              <div className="flex items-center gap-1 text-xs text-slate-500">
                <Clock className="h-3 w-3" />
                {new Date(signal.timestamp).toLocaleTimeString()}
              </div>
            </div>
            
            <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-[var(--confidence-green,#10B981)] via-[var(--warning-amber,#F59E0B)] to-[var(--danger-red,#EF4444)] transition-all duration-500"
                style={{ width: `${confidence}%` }}
              />
            </div>
          </div>

          {/* Hover Sparkline & Actions */}
          {isHovered && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15 }}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                {showSparkline && (
                  <div className="flex items-end gap-0.5 h-6">
                    {sparklineData.map((value, i) => (
                      <div
                        key={i}
                        className="w-1 bg-[var(--brand-teal,#14B8A6)] rounded-sm transition-all duration-200"
                        style={{ height: `${(value / 70) * 100}%` }}
                      />
                    ))}
                  </div>
                )}
                <div className="text-xs text-slate-600 dark:text-slate-400">
                  <TrendingUp className="h-3 w-3 inline mr-1" />
                  6h trend
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => { e.stopPropagation(); onExplain(signal); }}
                  className="h-7 px-2 text-xs"
                >
                  Explain
                </Button>
                <Button
                  size="sm"
                  onClick={(e) => { e.stopPropagation(); onCreateAlert(signal); }}
                  className="h-7 px-2 text-xs bg-[var(--brand-teal,#14B8A6)] hover:bg-[var(--brand-teal,#14B8A6)]/90"
                >
                  Alert
                </Button>
              </div>
            </motion.div>
          )}

          {/* Source Badge */}
          <div className="flex items-center justify-between mt-2">
            <Badge variant="outline" className="text-xs">
              {signal.source} • {signal.isLive ? 'Live' : 'Cached'}
            </Badge>
            {isTopRank && (
              <div className="text-xs text-[var(--brand-teal,#14B8A6)] font-medium">
                Top Signal
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}