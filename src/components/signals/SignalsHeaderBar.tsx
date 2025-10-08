/**
 * Unified Signals Header Bar - A++++ Compact Chrome
 */

import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { trackEvent } from '@/lib/telemetry';

interface SignalsHeaderBarProps {
  onBack?: () => void;
  onCreateAlert?: () => void;
  liveStatus: 'connected' | 'reconnecting' | 'paused';
  showMotto?: boolean;
}

export function SignalsHeaderBar({ 
  onBack, 
  onCreateAlert, 
  liveStatus, 
  showMotto = true 
}: SignalsHeaderBarProps) {
  const handleBack = () => {
    trackEvent('signals_back_clicked', { from: window.location.pathname, tab: 'signals' });
    onBack?.();
  };

  const handleCreateAlert = () => {
    trackEvent('signals_create_alert_clicked', { tab: 'signals', contextFilters: {} });
    onCreateAlert?.();
  };

  const getLiveStatusDisplay = () => {
    switch (liveStatus) {
      case 'connected':
        return (
          <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-sm" aria-live="polite">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse motion-safe:animate-pulse" />
            Live
          </span>
        );
      case 'reconnecting':
        return (
          <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 text-sm" aria-live="polite">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            Reconnecting
          </span>
        );
      case 'paused':
        return (
          <span className="inline-flex items-center gap-1 text-slate-500 dark:text-slate-400 text-sm" aria-live="polite">
            <span className="w-2 h-2 rounded-full bg-slate-400" />
            Paused
          </span>
        );
    }
  };

  return (
    <header 
      className="sticky top-0 z-30 h-16 bg-background/80 backdrop-blur border-b border-slate-200/60 dark:border-slate-800/60"
      role="banner"
      aria-labelledby="signals-title"
    >
      <div className="max-w-[1200px] mx-auto px-6 lg:px-8 h-full flex items-center justify-between">
        {/* Left: Back + Title + Motto */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
            aria-label="Back to Dashboard"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <h1 id="signals-title" className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Whale Signals
          </h1>
          
          {showMotto && (
            <span className="text-sm text-slate-500 dark:text-slate-400 ml-3 hidden md:inline">
              • Learn → Act → Profit
            </span>
          )}
        </div>

        {/* Right: Live Status + CTA */}
        <div className="flex items-center gap-3">
          {getLiveStatusDisplay()}
          
          <Button 
            size="sm" 
            onClick={handleCreateAlert}
            className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white"
          >
            <span className="hidden sm:inline">Create Alert</span>
            <span className="sm:hidden">Alert</span>
          </Button>
        </div>
      </div>
    </header>
  );
}