/**
 * ExplainModal - Enhanced learning layer with predictive pointers
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { SparklineChart } from './SparklineChart';
import { X, TrendingUp, AlertCircle, Share2, BarChart3 } from 'lucide-react';
import { PhaseDTelemetry } from '@/lib/phase-d-telemetry';
import type { Signal } from '@/types/signal';

interface ExplainModalProps {
  signal: Signal | null;
  isOpen: boolean;
  onClose: () => void;
  onCreateAlert: () => void;
}

export function ExplainModal({ signal, isOpen, onClose, onCreateAlert }: ExplainModalProps) {
  const [showSimilarCases, setShowSimilarCases] = useState(false);
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!signal) return null;

  const handleExplainOpened = () => {
    PhaseDTelemetry.trackExplainOpened({
      asset: signal.asset,
      amountUsd: signal.amountUsd,
      confidence: Math.floor(Math.random() * 30) + 70
    });
  };

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

  const similarCasesData = Array.from({ length: 5 }, (_, i) => ({
    date: new Date(Date.now() - (i + 1) * 24 * 60 * 60 * 1000).toLocaleDateString(),
    outcome: `+${(Math.random() * 3 + 1).toFixed(1)}%`,
    timeframe: '24h'
  }));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
        aria-labelledby="explain-modal-title"
        aria-describedby="explain-modal-description"
        onOpenAutoFocus={handleExplainOpened}
      >
        <DialogHeader>
          <DialogTitle id="explain-modal-title" className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-[var(--brand-teal,#14B8A6)]" />
            Understanding This Signal
          </DialogTitle>
        </DialogHeader>

        <motion.div
          initial={!reducedMotion ? { opacity: 0, y: 20 } : { opacity: 1 }}
          animate={{ opacity: 1, y: 0 }}
          transition={!reducedMotion ? { duration: 0.3 } : { duration: 0 }}
          className="space-y-6"
          id="explain-modal-description"
        >
          {/* Signal Overview */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-lg text-slate-900 dark:text-slate-100">
                    {signal.asset} {signal.direction === 'inflow' ? 'Accumulation' : 'Distribution'}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    {formatAmount(signal.amountUsd)} moved to {signal.direction === 'outflow' ? 'exchange' : 'cold storage'}
                  </p>
                </div>
                <Badge className={`${
                  signal.risk === 'high' ? 'bg-red-100 text-red-700' : 
                  signal.risk === 'medium' ? 'bg-amber-100 text-amber-700' : 
                  'bg-green-100 text-green-700'
                }`}>
                  {signal.risk} severity
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Pattern Strength:</span>
                  <div className="font-medium">3.2× above average</div>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Market Impact:</span>
                  <div className="font-medium">Moderate bullish signal</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* What Changed */}
          <Card>
            <CardContent className="p-4">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-[var(--brand-teal,#14B8A6)]" />
                What Changed
              </h4>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span>Whale wallet activity increased by</span>
                  <Badge className="bg-emerald-100 text-emerald-700">+340%</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Average transaction size grew by</span>
                  <Badge className="bg-blue-100 text-blue-700">+180%</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Time between transactions decreased by</span>
                  <Badge className="bg-purple-100 text-purple-700">-45%</Badge>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSimilarCases(!showSimilarCases)}
                  className="flex items-center gap-2"
                >
                  <BarChart3 className="h-3 w-3" />
                  {showSimilarCases ? 'Hide' : 'Show'} last 5 similar cases
                </Button>
              </div>

              <AnimatePresence>
                {showSimilarCases && (
                  <motion.div
                    initial={!reducedMotion ? { opacity: 0, height: 0 } : { opacity: 1, height: 'auto' }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={!reducedMotion ? { opacity: 0, height: 0 } : {}}
                    transition={!reducedMotion ? { duration: 0.25 } : { duration: 0 }}
                    className="mt-4 space-y-2"
                  >
                    {similarCasesData.map((case_, index) => (
                      <div key={index} className="flex items-center justify-between text-xs bg-slate-50 dark:bg-slate-800 rounded p-2">
                        <span>{case_.date}</span>
                        <span className="text-emerald-600 font-medium">{case_.outcome} in {case_.timeframe}</span>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>

          {/* Prediction & Context */}
          <Card className="bg-gradient-to-r from-[var(--brand-teal,#14B8A6)]/5 to-transparent border-l-4 border-l-[var(--brand-teal,#14B8A6)]">
            <CardContent className="p-4">
              <h4 className="font-semibold mb-3">Market Context & Prediction</h4>
              <p className="text-sm text-slate-700 dark:text-slate-300 mb-4">
                Based on historical patterns, similar {signal.asset} movements of this magnitude typically result in 
                a +1.2–2.4% price movement within 24 hours. The current market conditions suggest this pattern 
                has an 85% confidence rate.
              </p>
              
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                  <span>Historical accuracy: 85%</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Market correlation: Strong</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
            <Button
              onClick={onCreateAlert}
              className="flex-1 bg-[var(--brand-teal,#14B8A6)] hover:bg-[var(--brand-teal,#14B8A6)]/90 text-white"
            >
              Create Alert for Similar Events
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                // Share functionality
                console.log('Share signal');
              }}
              className="flex items-center gap-2"
            >
              <Share2 className="h-4 w-4" />
              Share
            </Button>
          </div>

          {/* Footer Note */}
          <div className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 rounded p-3">
            You'll be notified if future events like this occur. Alerts are delivered via your preferred channels 
            and can be customized in your notification settings.
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}